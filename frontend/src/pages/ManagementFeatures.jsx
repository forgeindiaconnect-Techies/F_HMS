import { Link } from 'react-router-dom';
import { Utensils, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

const ManagementFeatures = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 px-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                            <Utensils size={22} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">RestaurantHub</h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors">Back to Home</Link>
                        <Link to="/staff/register" className="bg-gray-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-sm transition-all">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-16 space-y-16">
                {/* Hero */}
                <div className="text-center max-w-4xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold text-xs uppercase tracking-wider">
                        <span>Management Suite</span>
                        <ChevronRight size={14} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                        Complete Management Solution for Modern Restaurants
                    </h1>
                    <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
                        Empower your restaurant operations with real-time intelligence, automated order workflows, and staff management.
                    </p>
                </div>

                {/* 4 Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Category 1: Business Intelligence */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-xl transition-all group">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl font-bold">
                                📊
                            </div>
                            <div>
                                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Restaurant Owner</p>
                                <h2 className="text-2xl font-black text-gray-900">Business Intelligence</h2>
                                <p className="text-gray-500 text-sm font-medium mt-2">Executive analytics to monitor profitability and performance metrics instantly.</p>
                            </div>
                            <ul className="space-y-3 pt-2 font-bold text-gray-700 text-sm">
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-500 shrink-0" /> Sales Analytics</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-500 shrink-0" /> Revenue Reports</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-500 shrink-0" /> Profit & Loss Insights</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-500 shrink-0" /> Executive Dashboard</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-50">
                            <Link to="/features/details?module=intelligence" className="inline-flex items-center gap-2 font-bold text-gray-900 hover:text-red-500 transition-colors group-hover:translate-x-1 transition-transform">
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 2: Menu & Orders */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-xl transition-all group">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-3xl font-bold">
                                🍔
                            </div>
                            <div>
                                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Operations</p>
                                <h2 className="text-2xl font-black text-gray-900">Menu & Orders</h2>
                                <p className="text-gray-500 text-sm font-medium mt-2">Complete control over dishes, table ordering, and instant kitchen routing.</p>
                            </div>
                            <ul className="space-y-3 pt-2 font-bold text-gray-700 text-sm">
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> Menu Management</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> Order Management</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> Smart QR Digital Menu</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500 shrink-0" /> Table Reservations</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-50">
                            <Link to="/features/details?module=orders" className="inline-flex items-center gap-2 font-bold text-gray-900 hover:text-orange-500 transition-colors group-hover:translate-x-1 transition-transform">
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 3: Staff & Customers */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-xl transition-all group">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-3xl font-bold">
                                👥
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Team & Hospitality</p>
                                <h2 className="text-2xl font-black text-gray-900">Staff & Customers</h2>
                                <p className="text-gray-500 text-sm font-medium mt-2">Manage employee roles, track attendance, and build customer loyalty records.</p>
                            </div>
                            <ul className="space-y-3 pt-2 font-bold text-gray-700 text-sm">
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Staff Management</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Customer Management</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Custom Roles & Access</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Attendance Tracking</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-50">
                            <Link to="/features/details?module=staff" className="inline-flex items-center gap-2 font-bold text-gray-900 hover:text-blue-500 transition-colors group-hover:translate-x-1 transition-transform">
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 4: Branch Manager Dashboard */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-xl transition-all group">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-3xl font-bold">
                                🏬
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Branch Manager</p>
                                <h2 className="text-2xl font-black text-gray-900">Branch Management</h2>
                                <p className="text-gray-500 text-sm font-medium mt-2">Daily overview, staff shifts monitoring, petty cash expenses and tables status.</p>
                            </div>
                            <ul className="space-y-3 pt-2 font-bold text-gray-700 text-sm">
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Branch Overview</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Daily Orders & Feedback</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Live Table Status</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Expense Tracking</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-50">
                            <Link to="/features/details?module=manager" className="inline-flex items-center gap-2 font-bold text-gray-900 hover:text-emerald-500 transition-colors group-hover:translate-x-1 transition-transform">
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManagementFeatures;
