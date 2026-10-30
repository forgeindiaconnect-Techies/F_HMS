import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';

const GlobalReports = () => {
    const { api } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/super-admin/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [api]);

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-900 font-sans">Global Platform Reports</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Restaurants</p>
                        <h3 className="text-2xl font-black text-gray-900">{stats?.totalRestaurants || 0}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-50 text-green-600 shrink-0">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Platform Revenue</p>
                        <h3 className="text-2xl font-black text-gray-900">₹{(stats?.totalRevenue || 0).toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600 shrink-0">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders Processed</p>
                        <h3 className="text-2xl font-black text-gray-900">{stats?.totalOrders || 0}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mt-8">
                <h3 className="text-lg font-bold text-gray-900 font-sans mb-6">Coming Soon</h3>
                <p className="text-gray-500">Advanced charting, commission reports, and MRR forecasting will be available in a future update.</p>
            </div>
        </div>
    );
};

export default GlobalReports;
