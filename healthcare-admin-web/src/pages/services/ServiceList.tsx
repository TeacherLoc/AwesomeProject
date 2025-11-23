import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS } from '../../utils/theme';
import toast from 'react-hot-toast';
import './ServiceList.css';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const servicesRef = collection(db, 'services');
      const snapshot = await getDocs(servicesRef);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        imageUrl: service.imageUrl || ''
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', imageUrl: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({ name: '', description: '', price: '', imageUrl: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || ''
      };

      if (editingService) {
        // Update existing service
        const serviceRef = doc(db, 'services', editingService.id);
        await updateDoc(serviceRef, serviceData);
        
        setServices(prev => 
          prev.map(s => s.id === editingService.id ? { ...s, ...serviceData } : s)
        );
        
        toast.success('Cập nhật dịch vụ thành công!');
      } else {
        // Add new service
        const docRef = await addDoc(collection(db, 'services'), serviceData);
        
        setServices(prev => [...prev, { id: docRef.id, ...serviceData }]);
        
        toast.success('Thêm dịch vụ mới thành công!');
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Không thể lưu dịch vụ');
    }
  };

  const handleDelete = async (service: Service) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'services', service.id));
      setServices(prev => prev.filter(s => s.id !== service.id));
      toast.success('Xóa dịch vụ thành công!');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Không thể xóa dịch vụ');
    }
  };

  if (loading) {
    return (
      <div className="services-loading">
        <div className="spinner"></div>
        <p>Đang tải danh sách dịch vụ...</p>
      </div>
    );
  }

  return (
    <div className="services-container">
      <div className="services-header">
        <h1>Quản lý dịch vụ</h1>
        <button 
          className="add-btn"
          onClick={() => handleOpenModal()}
          
        >
          ➕ Thêm dịch vụ mới
        </button>
      </div>

      <div className="services-grid">
        {services.length === 0 ? (
          <div className="empty-state">
            <p>🏥</p>
            <h3>Chưa có dịch vụ nào</h3>
            <button 
              className="add-first-btn"
              onClick={() => handleOpenModal()}
              style={{ backgroundColor: COLORS.primary }}
            >
              Thêm dịch vụ đầu tiên
            </button>
          </div>
        ) : (
          services.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-image">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt={service.name} />
                ) : (
                  <div className="placeholder-image">🏥</div>
                )}
              </div>
              
              <div className="service-content">
                <h3>{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <p className="service-price">
                  💰 {service.price.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>

              <div className="service-actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleOpenModal(service)}
                >
                  ✏️ Sửa
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(service)}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên dịch vụ *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Khám tổng quát"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về dịch vụ..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label>Giá dịch vụ (VNĐ) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>URL hình ảnh (tùy chọn)</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {editingService ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceList;
