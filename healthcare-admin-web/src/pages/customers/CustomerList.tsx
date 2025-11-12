import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS } from '../../utils/theme';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import './CustomerList.css';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  totalAppointments?: number;
}

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Get all customers
      const usersRef = collection(db, 'users');
      const customersQuery = query(usersRef, where('role', '==', 'customer'));
      const usersSnapshot = await getDocs(customersQuery);
      
      const customersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];

      // Get appointment counts
      const appointmentsRef = collection(db, 'appointments');
      const confirmedQuery = query(appointmentsRef, where('status', '==', 'confirmed'));
      const appointmentsSnapshot = await getDocs(confirmedQuery);

      const appointmentCounts: { [key: string]: number } = {};
      appointmentsSnapshot.forEach(doc => {
        const customerId = doc.data().customerId;
        appointmentCounts[customerId] = (appointmentCounts[customerId] || 0) + 1;
      });

      // Combine data
      const customersWithCounts = customersList.map(customer => ({
        ...customer,
        totalAppointments: appointmentCounts[customer.id] || 0
      }));

      setCustomers(customersWithCounts);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || ''
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '' });
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCustomer || !formData.name) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }

    try {
      const customerRef = doc(db, 'users', editingCustomer.id);
      await updateDoc(customerRef, {
        name: formData.name,
        phone: formData.phone
      });

      setCustomers(prev =>
        prev.map(c =>
          c.id === editingCustomer.id
            ? { ...c, name: formData.name, phone: formData.phone }
            : c
        )
      );

      toast.success('Cập nhật thông tin khách hàng thành công!');
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Không thể cập nhật thông tin khách hàng');
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.name}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', customer.id));
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      toast.success('Xóa khách hàng thành công!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Không thể xóa khách hàng');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const lowerQuery = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.email.toLowerCase().includes(lowerQuery) ||
      (customer.phone && customer.phone.includes(searchQuery))
    );
  });

  const exportToExcel = () => {
    try {
      const exportData = filteredCustomers.map(customer => ({
        'Tên khách hàng': customer.name,
        'Email': customer.email,
        'Số điện thoại': customer.phone || 'Chưa có',
        'Số lịch hẹn': customer.totalAppointments || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 30 }, // Tên
        { wch: 35 }, // Email
        { wch: 15 }, // SĐT
        { wch: 15 }, // Lịch hẹn
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Khách hàng');

      const fileName = `Khach_hang_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Đã xuất ${filteredCustomers.length} khách hàng ra file Excel!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Không thể xuất file Excel');
    }
  };

  if (loading) {
    return (
      <div className="customers-loading">
        <div className="spinner"></div>
        <p>Đang tải danh sách khách hàng...</p>
      </div>
    );
  }

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>Quản lý khách hàng</h1>
        <div className="header-actions">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên, email, hoặc SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={exportToExcel} className="export-btn">
            📥 Xuất Excel
          </button>
          <button onClick={fetchCustomers} className="refresh-btn">
            🔄 Làm mới
          </button>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-icon">👥</span>
          <div>
            <p className="stat-value">{customers.length}</p>
            <p className="stat-label">Tổng khách hàng</p>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">✅</span>
          <div>
            <p className="stat-value">
              {customers.filter(c => (c.totalAppointments || 0) > 0).length}
            </p>
            <p className="stat-label">Có lịch hẹn</p>
          </div>
        </div>
      </div>

      <div className="customers-list">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <p>👥</p>
            <h3>{searchQuery ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}</h3>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="customer-card">
              <div className="customer-header">
                <div className="customer-avatar" style={{ backgroundColor: COLORS.primary }}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="customer-info">
                  <h3>{customer.name}</h3>
                  <div className="appointment-badge">
                    📅 {customer.totalAppointments || 0} lịch hẹn
                  </div>
                </div>
              </div>

              <div className="customer-body">
                <div className="info-row">
                  <span className="icon">📧</span>
                  <span>{customer.email}</span>
                </div>
                <div className="info-row">
                  <span className="icon">📱</span>
                  <span>{customer.phone || 'Chưa có SĐT'}</span>
                </div>
              </div>

              <div className="customer-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleOpenEditModal(customer)}
                >
                  ✏️ Sửa
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteCustomer(customer)}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chỉnh sửa thông tin khách hàng</h2>
              <p className="modal-subtitle">
                ⚠️ Đây là thông tin bảo mật. Hãy cẩn thận khi sửa đổi!
              </p>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="form-group">
                <label>Email (không thể thay đổi)</label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Tên khách hàng *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên khách hàng"
                  required
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={handleCloseEditModal}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
