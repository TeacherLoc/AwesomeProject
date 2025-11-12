import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS } from '../../utils/theme';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

interface Stats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  totalCustomers: number;
  totalServices: number;
  totalRevenue: number;
}

interface RecentAppointment {
  id: string;
  serviceName: string;
  customerName: string;
  status: string;
  appointmentDateTime: { seconds: number };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    totalCustomers: 0,
    totalServices: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get appointments
      const appointmentsRef = collection(db, 'appointments');
      const appointmentsSnapshot = await getDocs(appointmentsRef);
      const totalAppointments = appointmentsSnapshot.size;

      const pendingQuery = query(appointmentsRef, where('status', '==', 'pending'));
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingAppointments = pendingSnapshot.size;

      const confirmedQuery = query(appointmentsRef, where('status', '==', 'confirmed'));
      const confirmedSnapshot = await getDocs(confirmedQuery);
      const confirmedAppointments = confirmedSnapshot.size;

      const completedQuery = query(appointmentsRef, where('status', '==', 'completed'));
      const completedSnapshot = await getDocs(completedQuery);
      const completedAppointments = completedSnapshot.size;

      // Calculate total revenue from completed appointments
      let totalRevenue = 0;
      completedSnapshot.forEach(doc => {
        const price = doc.data().servicePrice || 0;
        totalRevenue += price;
      });

      // Get customers
      const usersRef = collection(db, 'users');
      const customersQuery = query(usersRef, where('role', '==', 'customer'));
      const customersSnapshot = await getDocs(customersQuery);
      const totalCustomers = customersSnapshot.size;

      // Get services
      const servicesRef = collection(db, 'services');
      const servicesSnapshot = await getDocs(servicesRef);
      const totalServices = servicesSnapshot.size;

      // Get recent appointments (last 5)
      const allAppointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecentAppointment[];
      
      const sortedAppointments = allAppointments
        .sort((a, b) => b.appointmentDateTime.seconds - a.appointmentDateTime.seconds)
        .slice(0, 5);
      
      setRecentAppointments(sortedAppointments);

      setStats({
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        totalCustomers,
        totalServices,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Tổng lịch hẹn',
      value: stats.totalAppointments,
      icon: '📅',
      color: COLORS.primary,
    },
    {
      title: 'Chờ xác nhận',
      value: stats.pendingAppointments,
      icon: '⏳',
      color: COLORS.warning,
    },
    {
      title: 'Đã xác nhận',
      value: stats.confirmedAppointments,
      icon: '✅',
      color: COLORS.success,
    },
    {
      title: 'Hoàn thành',
      value: stats.completedAppointments,
      icon: '✓',
      color: COLORS.info,
    },
    {
      title: 'Khách hàng',
      value: stats.totalCustomers,
      icon: '👥',
      color: COLORS.secondary,
    },
    {
      title: 'Dịch vụ',
      value: stats.totalServices,
      icon: '🏥',
      color: '#FF9800',
    },
  ];

  // Prepare chart data
  const statusChartData = [
    { name: 'Chờ xác nhận', value: stats.pendingAppointments, color: COLORS.warning },
    { name: 'Đã xác nhận', value: stats.confirmedAppointments, color: COLORS.success },
    { name: 'Hoàn thành', value: stats.completedAppointments, color: COLORS.info },
  ];

  const revenueData = [
    { name: 'Tổng doanh thu', value: stats.totalRevenue },
  ];

  const formatDate = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: COLORS.warning,
      confirmed: COLORS.success,
      completed: COLORS.info,
      cancelled_by_customer: COLORS.error,
      cancelled_by_admin: COLORS.error,
      rejected: COLORS.error,
    };
    return colorMap[status] || COLORS.gray;
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled_by_customer: 'Khách hủy',
      cancelled_by_admin: 'Admin hủy',
      rejected: 'Từ chối',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tổng quan hệ thống</h1>
        <p>Thống kê và quản lý Healthcare</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <h3>{card.title}</h3>
              <p className="stat-value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Card */}
      <div className="revenue-card">
        <div className="revenue-header">
          <h2>💰 Doanh thu</h2>
          <p className="revenue-subtitle">Từ các lịch hẹn hoàn thành</p>
        </div>
        <div className="revenue-amount">
          {stats.totalRevenue.toLocaleString('vi-VN')} VNĐ
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Status Chart */}
        <div className="chart-card">
          <h3>📊 Biểu đồ trạng thái lịch hẹn</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="chart-card">
          <h3>💵 Doanh thu tổng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString('vi-VN')} VNĐ`} />
              <Legend />
              <Bar dataKey="value" fill={COLORS.success} name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="recent-appointments">
        <h2>📋 Lịch hẹn gần đây</h2>
        <div className="appointments-table">
          {recentAppointments.length === 0 ? (
            <p className="no-data">Chưa có lịch hẹn nào</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Dịch vụ</th>
                  <th>Khách hàng</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td className="service-cell">{appointment.serviceName}</td>
                    <td>{appointment.customerName}</td>
                    <td className="date-cell">{formatDate(appointment.appointmentDateTime)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: `${getStatusColor(appointment.status)}20`, 
                          color: getStatusColor(appointment.status) 
                        }}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>👋 Chào mừng đến với Healthcare Admin</h2>
          <p>Sử dụng menu bên trái để quản lý hệ thống:</p>
          <ul>
            <li>📅 <strong>Quản lý lịch hẹn:</strong> Xem, xác nhận và quản lý các lịch hẹn</li>
            <li>🏥 <strong>Quản lý dịch vụ:</strong> Thêm, sửa, xóa các dịch vụ y tế</li>
            <li>👥 <strong>Quản lý khách hàng:</strong> Xem thông tin và quản lý khách hàng</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
