import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, Users, AlertTriangle, TrendingUp, MoreVertical, Clock, ShoppingBag, Phone, Mail, MapPin, X, Eye, Info, Search, ShieldCheck, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, staffRes, invRes, suppRes] = await Promise.allSettled([
          api.get('/analytics/dashboard'),
          api.get('/staff'),
          api.get('/inventory'),
          api.get('/suppliers')
        ]);

        if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
        if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value.data)) setStaffList(staffRes.value.data);
        if (invRes.status === 'fulfilled' && Array.isArray(invRes.value.data)) {
          const lowItems = invRes.value.data.filter(item => item.quantity <= (item.minStock || 5));
          setStockAlerts(lowItems);
        }
        if (suppRes.status === 'fulfilled' && Array.isArray(suppRes.value.data)) setSuppliers(suppRes.value.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchDashboardData();
  }, [api]);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalRevenue = data?.overview?.totalRevenue || 0;
  const revenueGoal = 5000;
  const goalPercent = Math.min(100, Math.round((totalRevenue / revenueGoal) * 100));
  const goalRemaining = Math.max(0, revenueGoal - totalRevenue);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      
      {/* Shift Attendance Clock In / Clock Out Status Bar */}
      <StaffShiftClockWidget userRole="Branch Manager" userName={user?.name || "Manager"} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Store size={24} /></div>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                <TrendingUp size={14} /> {data?.overview?.revenueChange ? `${data.overview.revenueChange > 0 ? '+' : ''}${data.overview.revenueChange}%` : '0%'}
              </span>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Today's Revenue</p>
            <h2 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Users size={24} /></div>
              <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md">
                {staffList.filter(s => s.status === 'On Break').length} on break
              </span>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Staff on Shift</p>
            <h2 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {staffList.length}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Orders & Stock) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <AlertTriangle size={20} className="text-red-500" /> Stock Alerts
              </h3>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stockAlerts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                {stockAlerts.length} Item{stockAlerts.length !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Stock warnings list */}
            <div className="p-4 space-y-3">
              {stockAlerts.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm font-semibold">No stock alerts</p>
                  <p className="text-xs text-gray-400 mt-0.5">All inventory items are sufficiently stocked.</p>
                </div>
              ) : (
                stockAlerts.map((item, idx) => (
                  <div key={item._id || idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} {item.unit || 'units'} left · Min: {item.minStock || 5} {item.unit || 'units'}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${item.quantity <= (item.minStock / 2) ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                      {item.quantity <= (item.minStock / 2) ? 'Critical' : 'Low Stock'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Delivery Partner Ops */}
          {data?.deliveryAnalytics && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <Truck size={20} className="text-blue-500" /> Delivery Partner Ops
                </h3>
                <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {data.deliveryAnalytics.onlinePartners} Online
                </span>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Assign</p>
                  <p className="text-xl font-black text-gray-900 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.deliveryAnalytics.pendingAssignments}</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Active Deliveries</p>
                  <p className="text-xl font-black text-orange-700 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.deliveryAnalytics.activeDeliveries}</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Completed</p>
                  <p className="text-xl font-black text-green-700 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.deliveryAnalytics.completedDeliveries}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-center">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Delivery Revenue</p>
                  <p className="text-xl font-black text-purple-700 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{data.deliveryAnalytics.totalDeliveryEarnings}</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-50 bg-gray-50/20 text-center">
                <button 
                  onClick={() => navigate('/manager/orders')} 
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  View Active Order Dispatch Tracking ↗
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Staff & Daily Goal) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-md">
            <h3 className="font-bold text-green-50 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Daily Revenue Goal</h3>
            <p className="text-3xl font-extrabold mb-6 mt-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              ₹{totalRevenue.toLocaleString('en-IN')} <span className="text-lg text-green-200 font-medium">/ ₹{revenueGoal.toLocaleString('en-IN')}</span>
            </p>
            <div className="w-full bg-green-700/50 rounded-full h-3 mb-2">
              <div className="bg-white rounded-full h-3 relative transition-all duration-500" style={{ width: `${goalPercent}%` }}>
                <div className="absolute right-0 -top-2 w-7 h-7 bg-white rounded-full border-4 border-green-500 shadow-md" />
              </div>
            </div>
            <div className="flex justify-between text-sm font-bold text-green-100">
              <span>{goalPercent}% Completed</span>
              <span>₹{goalRemaining.toLocaleString('en-IN')} to go</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Current Shift Staff</h3>
              <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              {staffList.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm font-semibold">No staff registered on shift</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add staff members to display current shift ops.</p>
                </div>
              ) : (
                staffList.slice(0, 5).map((staff, i) => (
                  <div key={staff._id || i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-600">
                      {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{staff.name}</p>
                      <p className="text-xs text-gray-500">{staff.role || 'Staff'}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${staff.status === 'On Break' ? 'bg-orange-500' : 'bg-green-500'}`} title={staff.status || 'Working'} />
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-50">
              <button onClick={() => navigate('/manager/staff')} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-lg transition-colors">
                Manage Schedule & Staff
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Supplier Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Supplier Contact Directory
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">Quick call and supplier directory for inventory management.</p>
          </div>
          
          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search suppliers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
            />
          </div>
        </div>

        {loadingSuppliers ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div>
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 text-sm font-medium">No suppliers found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((s) => {
                  const initials = s.name ? s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SP';
                  return (
                    <div key={s._id} className="p-4 border border-gray-100 rounded-2xl bg-white hover:shadow-md transition-shadow flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="font-bold text-gray-900 text-sm truncate">{s.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${s.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-green-600 mt-0.5">{s.category || 'General'}</p>
                        
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                          <Phone size={12} className="shrink-0" />
                          <span className="truncate">{s.phone}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                          <button 
                            onClick={() => setSelectedSupplier(s)}
                            className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye size={12} /> View
                          </button>
                          <a 
                            href={`tel:${s.phone}`} 
                            className="flex-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-center"
                          >
                            <Phone size={12} /> Call
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white relative">
              <button 
                onClick={() => setSelectedSupplier(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {selectedSupplier.category || 'General'}
              </span>
              <h3 className="text-xl font-bold mt-2 pr-6 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {selectedSupplier.name}
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-sm text-gray-700">
              {selectedSupplier.contactPerson && (
                <div className="flex items-start gap-3">
                  <Users size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Contact Person</p>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedSupplier.contactPerson}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-400">Phone Number</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedSupplier.phone}</p>
                </div>
              </div>

              {selectedSupplier.email && (
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Email Address</p>
                    <p className="font-medium text-gray-900 mt-0.5 break-all">{selectedSupplier.email}</p>
                  </div>
                </div>
              )}

              {selectedSupplier.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Address</p>
                    <p className="font-medium text-gray-900 mt-0.5">{selectedSupplier.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Info size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-400">Status</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${selectedSupplier.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedSupplier.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <a 
                href={`tel:${selectedSupplier.phone}`}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 text-center"
              >
                <Phone size={16} /> Place Quick Call
              </a>
              <button 
                onClick={() => setSelectedSupplier(null)}
                className="px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
