import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface AdminMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userMessage: string;
  adminReply?: string;
  status: 'pending' | 'answered';
  createdAt: Date;
  answeredAt?: Date;
  answeredBy?: string;
}

const AdminChatManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<AdminMessage[]>([]);
  const [tabValue, setTabValue] = useState<'pending' | 'answered'>('pending');
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'adminMessages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: AdminMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<AdminMessage, 'id' | 'createdAt' | 'answeredAt'>),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        answeredAt: doc.data().answeredAt?.toDate(),
      }));
      setMessages(messagesData);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const filtered = messages.filter((msg) => msg.status === tabValue);
    setFilteredMessages(filtered);
  }, [messages, tabValue]);

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim() || !currentUser) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Cập nhật tin nhắn với câu trả lời
      const messageRef = doc(db, 'adminMessages', selectedMessage.id);
      await updateDoc(messageRef, {
        adminReply: replyText.trim(),
        status: 'answered',
        answeredAt: new Date(),
        answeredBy: currentUser.email,
      });

      // Tạo thông báo cho user
      const notificationsRef = collection(db, 'notifications');
      const shortQuestion = selectedMessage.userMessage.length > 50 
        ? selectedMessage.userMessage.substring(0, 50) + '...' 
        : selectedMessage.userMessage;

      await addDoc(notificationsRef, {
        userId: selectedMessage.userId,
        type: 'admin_reply',
        title: '💬 Admin đã trả lời',
        message: `Câu hỏi: "${shortQuestion}"\n\nTrả lời: ${replyText.trim()}`,
        isRead: false,
        createdAt: Timestamp.now(),
        relatedId: selectedMessage.id,
      });

      setSuccess('Đã gửi câu trả lời thành công!');
      setSelectedMessage(null);
      setReplyText('');
    } catch (err) {
      console.error('Error replying to message:', err);
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="text.primary">
        💬 Quản lý tin nhắn từ khách hàng
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Xem và trả lời các câu hỏi từ khách hàng qua chatbot
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab
            label={`Chờ trả lời (${messages.filter((m) => m.status === 'pending').length})`}
            value="pending"
          />
          <Tab
            label={`Đã trả lời (${messages.filter((m) => m.status === 'answered').length})`}
            value="answered"
          />
        </Tabs>
      </Box>

      {filteredMessages.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {tabValue === 'pending'
                ? '🎉 Không có tin nhắn nào chờ trả lời'
                : '📭 Chưa có tin nhắn nào được trả lời'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredMessages.map((message) => (
            <Card key={message.id} elevation={2}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="600" color="text.primary">
                      {message.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {message.userEmail} • {formatDate(message.createdAt)}
                    </Typography>
                  </Box>
                  <Chip
                    label={message.status === 'pending' ? 'Chờ trả lời' : 'Đã trả lời'}
                    color={message.status === 'pending' ? 'warning' : 'success'}
                    size="small"
                  />
                </Stack>

                <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 2, border: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ color: 'text.primary', opacity: 0.7 }} fontWeight="600" mb={0.5}>
                    Câu hỏi:
                  </Typography>
                  <Typography variant="body1" color="text.primary">{message.userMessage}</Typography>
                </Box>

                {message.adminReply && (
                  <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, mb: 2, border: 1, borderColor: 'primary.200' }}>
                    <Typography variant="body2" color="primary.main" fontWeight="600" mb={0.5}>
                      Câu trả lời:
                    </Typography>
                    <Typography variant="body1" color="text.primary">{message.adminReply}</Typography>
                    {message.answeredAt && (
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        Trả lời bởi {message.answeredBy} • {formatDate(message.answeredAt)}
                      </Typography>
                    )}
                  </Box>
                )}

                {message.status === 'pending' && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setSelectedMessage(message)}
                    fullWidth
                  >
                    Trả lời ngay
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Dialog trả lời */}
      <Dialog
        open={!!selectedMessage}
        onClose={() => !loading && setSelectedMessage(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Trả lời tin nhắn</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.primary" fontWeight="600">
                  Từ: {selectedMessage.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedMessage.userEmail}
                </Typography>
              </Box>

              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 2, border: 1, borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ color: 'text.primary', opacity: 0.7 }} fontWeight="600" mb={0.5}>
                  Câu hỏi:
                </Typography>
                <Typography variant="body1" color="text.primary">{selectedMessage.userMessage}</Typography>
              </Box>

              <TextField
                label="Câu trả lời của bạn"
                multiline
                rows={4}
                fullWidth
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập câu trả lời cho khách hàng..."
                disabled={loading}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMessage(null)} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleReply}
            variant="contained"
            color="primary"
            disabled={loading || !replyText.trim()}
            startIcon={loading && <CircularProgress size={16} />}
          >
            Gửi câu trả lời
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminChatManagement;
