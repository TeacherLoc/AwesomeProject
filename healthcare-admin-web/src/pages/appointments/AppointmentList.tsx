/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS } from '../../utils/theme';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import './AppointmentList.css';

interface Appointment {
  id: string;
  serviceName: string;
  appointmentDateTime: { seconds: number };
  status: 'pending' | 'confirmed' | 'cancelled_by_customer' | 'cancelled_by_admin' | 'rejected' | 'completed';
  servicePrice?: number;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  requestTimestamp?: { seconds: number };
}

const AppointmentList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<Appointment['status'] | null>(null);
  const [reason, setReason] = useState<string>('');
  const [showReasonModal, setShowReasonModal] = useState(false);

  // Notification helper functions
  const createNotification = async (userId: string, type: string, title: string, message: string, relatedId?: string) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        type,
        title,
        message,
        isRead: false,
        createdAt: Timestamp.now(),
        ...(relatedId && { relatedId })
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const createAppointmentNotification = async (appointment: Appointment, status: Appointment['status'], reasonText?: string) => {
    const appointmentDate = new Date(appointment.appointmentDateTime.seconds * 1000);
    const dateStr = appointmentDate.toLocaleDateString('vi-VN');
    const timeStr = appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    switch (status) {
      case 'confirmed':
        await createNotification(
          appointment.customerId,
          'status',
          'Lịch hẹn đã xác nhận ✅',
          `Lịch hẹn "${appointment.serviceName}" của bạn đã được xác nhận vào ${timeStr} ngày ${dateStr}`,
          appointment.id
        );
        break;
      case 'completed':
        await createNotification(
          appointment.customerId,
          'status',
          'Lịch hẹn hoàn thành ✓',
          `Lịch hẹn "${appointment.serviceName}" của bạn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!`,
          appointment.id
        );
        break;
      case 'cancelled_by_admin':
        { const defaultCancelReason = 'Phòng khám có vấn đề về lịch trình không thể thực hiện được.';
        await createNotification(
          appointment.customerId,
          'status',
          'Lịch hẹn bị hủy bởi Admin ❌',
          `Rất tiếc! Lịch hẹn "${appointment.serviceName}" của bạn đã bị hủy bởi admin.\n\n📝 Lý do: ${reasonText || defaultCancelReason}\n\n🙏 Chúng tôi rất xin lỗi vì sự bất tiện này. Quý khách có thể đặt lại lịch hẹn khác.`,
          appointment.id
        );
        break; }
      case 'rejected':
        { const defaultRejectReason = 'Lịch khám trong thời gian này đã đầy hoặc không phù hợp.';
        await createNotification(
          appointment.customerId,
          'status',
          'Lịch hẹn bị từ chối ❌',
          `Rất tiếc! Lịch hẹn "${appointment.serviceName}" của bạn đã bị từ chối.\n\n📝 Lý do: ${reasonText || defaultRejectReason}\n\n🙏 Quý khách vui lòng chọn thời gian khác hoặc liên hệ để được hỗ trợ.`,
          appointment.id
        );
        break; }
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsRef = collection(db, 'appointments');
      const q = query(appointmentsRef, orderBy('requestTimestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (appointment: Appointment, status: Appointment['status']) => {
    setSelectedAppointment(appointment);
    setNewStatus(status);
    
    // Nếu là cancel hoặc reject, hiển thị modal nhập lý do
    if (status === 'cancelled_by_admin' || status === 'rejected') {
      setReason('');
      setShowReasonModal(true);
    } else {
      setShowModal(true);
    }
  };

  const handleReasonSubmit = () => {
    setShowReasonModal(false);
    setShowModal(true);
  };

  const confirmUpdate = async () => {
    if (!selectedAppointment || !newStatus) return;

    try {
      const appointmentRef = doc(db, 'appointments', selectedAppointment.id);
      const updateData: any = { status: newStatus };
      
      // Add timestamp for status change
      if (newStatus === 'confirmed') updateData.confirmedAt = Timestamp.now();
      else if (newStatus === 'rejected') updateData.rejectedAt = Timestamp.now();
      else if (newStatus === 'cancelled_by_admin') updateData.cancelledAt = Timestamp.now();
      else if (newStatus === 'completed') updateData.completedAt = Timestamp.now();
      
      await updateDoc(appointmentRef, updateData);
      
      // Tạo thông báo cho khách hàng
      await createAppointmentNotification(selectedAppointment, newStatus, reason.trim() || undefined);
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, status: newStatus }
            : apt
        )
      );
      
      setShowModal(false);
      setReason('');
      toast.success('Cập nhật trạng thái và gửi thông báo thành công!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const getStatusText = (status: Appointment['status']) => {
    const statusMap = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      cancelled_by_customer: 'Khách hủy',
      cancelled_by_admin: 'Admin hủy',
      rejected: 'Từ chối',
      completed: 'Hoàn thành'
    };
    return statusMap[status];
  };

  const getStatusColor = (status: Appointment['status']) => {
    const colorMap = {
      pending: COLORS.warning,
      confirmed: COLORS.success,
      cancelled_by_customer: COLORS.error,
      cancelled_by_admin: COLORS.error,
      rejected: COLORS.error,
      completed: COLORS.info
    };
    return colorMap[status];
  };

  const formatDate = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString('vi-VN');
  };

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredAppointments.map(apt => ({
        'Dịch vụ': apt.serviceName,
        'Khách hàng': apt.customerName || 'N/A',
        'Email': apt.customerEmail || 'N/A',
        'Thời gian': formatDate(apt.appointmentDateTime),
        'Giá': apt.servicePrice ? `${apt.servicePrice.toLocaleString('vi-VN')} VNĐ` : 'N/A',
        'Trạng thái': getStatusText(apt.status),
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, // Dịch vụ
        { wch: 25 }, // Khách hàng
        { wch: 30 }, // Email
        { wch: 20 }, // Thời gian
        { wch: 15 }, // Giá
        { wch: 15 }, // Trạng thái
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lịch hẹn');

      // Generate file name with date
      const fileName = `Lich_hen_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Đã xuất ${filteredAppointments.length} lịch hẹn ra file Excel!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Không thể xuất file Excel');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  if (loading) {
    return (
      <div className="appointments-loading">
        <div className="spinner"></div>
        <p>Đang tải danh sách lịch hẹn...</p>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>Quản lý lịch hẹn</h1>
        <div className="header-actions">
          <button onClick={exportToExcel} className="export-btn">
            📥 Xuất Excel
          </button>
          <button onClick={fetchAppointments} className="refresh-btn">
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả ({appointments.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Chờ xác nhận ({appointments.filter(a => a.status === 'pending').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setFilter('confirmed')}
        >
          Đã xác nhận ({appointments.filter(a => a.status === 'confirmed').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Hoàn thành ({appointments.filter(a => a.status === 'completed').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'cancelled_by_admin' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled_by_admin')}
        >
          Admin hủy ({appointments.filter(a => a.status === 'cancelled_by_admin').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Từ chối ({appointments.filter(a => a.status === 'rejected').length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="appointments-list">
        {filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <p>📅</p>
            <h3>Không có lịch hẹn nào</h3>
          </div>
        ) : (
          filteredAppointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <div className="service-name">{appointment.serviceName}</div>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: `${getStatusColor(appointment.status)}20`, color: getStatusColor(appointment.status) }}
                >
                  {getStatusText(appointment.status)}
                </div>
              </div>

              <div className="appointment-body">
                <div className="info-row">
                  <span className="icon">👤</span>
                  <span>{appointment.customerName || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="icon">📧</span>
                  <span>{appointment.customerEmail || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="icon">📅</span>
                  <span>{formatDate(appointment.appointmentDateTime)}</span>
                </div>
                {appointment.servicePrice && (
                  <div className="info-row">
                    <span className="icon">💰</span>
                    <span>{appointment.servicePrice.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                )}
              </div>

              {appointment.status === 'pending' && (
                <div className="appointment-actions">
                  <button 
                    className="action-btn confirm-btn"
                    onClick={() => handleUpdateStatus(appointment, 'confirmed')}
                  >
                     Xác nhận
                  </button>
                  <button 
                    className="action-btn reject-btn"
                    onClick={() => handleUpdateStatus(appointment, 'rejected')}
                  >
                     Từ chối
                  </button>
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => handleUpdateStatus(appointment, 'cancelled_by_admin')}
                  >
                    🚫 Hủy
                  </button>
                </div>
              )}

              {appointment.status === 'confirmed' && (
                <div className="appointment-actions">
                  <button 
                    className="action-btn complete-btn"
                    onClick={() => handleUpdateStatus(appointment, 'completed')}
                  >
                    ✓ Hoàn thành
                  </button>
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => handleUpdateStatus(appointment, 'cancelled_by_admin')}
                  >
                    🚫 Hủy bởi Admin
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="modal-overlay" onClick={() => setShowReasonModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{newStatus === 'cancelled_by_admin' ? 'Hủy lịch hẹn' : 'Từ chối lịch hẹn'}</h2>
            <p>
              Vui lòng nhập lý do để khách hàng được thông báo chi tiết:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do (tùy chọn)..."
              className="reason-input"
              rows={4}
            />
            <div className="modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowReasonModal(false)}>
                Hủy bỏ
              </button>
              <button 
                className="modal-btn confirm" 
                onClick={handleReasonSubmit}
                style={{ backgroundColor: COLORS.primary }}
              >
                {newStatus === 'cancelled_by_admin' ? 'Hủy lịch' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Xác nhận thay đổi</h2>
            <p>
              Bạn có chắc chắn muốn thay đổi trạng thái lịch hẹn <strong>{selectedAppointment?.serviceName}</strong> 
              {' '}thành <strong>{newStatus && getStatusText(newStatus)}</strong>?
            </p>
            {(newStatus === 'cancelled_by_admin' || newStatus === 'rejected') && reason.trim() && (
              <div className="reason-display">
                <strong>Lý do:</strong> {reason}
              </div>
            )}
            <div className="modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button 
                className="modal-btn confirm" 
                onClick={confirmUpdate}
                style={{ backgroundColor: COLORS.primary }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
