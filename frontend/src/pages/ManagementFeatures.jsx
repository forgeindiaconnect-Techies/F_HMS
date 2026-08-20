import { Link } from 'react-router-dom';
import { Utensils, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

const ManagementFeatures = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-[#050816] text-gray-900 dark:text-white font-sans transition-colors duration-300">

            {/* Ambient dark glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#FF2D55]/10 via-[#FF6A00]/5 to-transparent blur-[160px] pointer-events-none z-0 hidden dark:block" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#050816]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.08] py-4 px-6 shadow-sm dark:shadow-none transition-colors">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-tr from-[#FF2D55] to-[#FF6A00] rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
                            <Utensils size={22} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                            Restaurant<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] to-[#FF6A00]">Hub</span>
                        </h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-500 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-white font-semibold text-sm transition-colors">
                            Back to Home
                        </Link>
                        <Link
                            to="/staff/register"
                            className="bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-[#FF2D55]/25 hover:scale-[1.03] active:scale-95 transition-all text-sm"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full px-4 sm:px-6 py-16 space-y-16 relative z-10">
                {/* Hero */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 dark:bg-[#FF2D55]/10 text-[#FF2D55] border border-red-100 dark:border-[#FF2D55]/20 font-bold text-xs uppercase tracking-wider">
                        <span>Management Suite</span>
                        <ChevronRight size={14} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                        Complete Management Solution for Modern Restaurants
                    </h1>
                    <p className="text-gray-500 dark:text-[#94A3B8] font-medium text-lg max-w-2xl mx-auto">
                        Empower your restaurant operations with real-time intelligence, automated order workflows, and staff management.
                    </p>
                </div>

                {/* 4 Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Category 1: Business Intelligence */}
                    <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 border border-gray-100 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl dark:hover:border-[#FF2D55]/30 transition-all group">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-red-50 dark:bg-[#FF2D55]/10 text-red-500 dark:text-[#FF2D55] rounded-2xl flex items-center justify-center text-3xl font-bold border border-red-100 dark:border-[#FF2D55]/20">
                                📊
                            </div>
                            <div>
                                <p className="text-xs font-bold text-red-500 dark:text-[#FF2D55] uppercase tracking-widest mb-1">Restaurant Owner</p>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Business Intelligence</h2>
                                <p className="text-gray-500 dark:text-[#94A3B8] text-sm font-medium mt-2">Executive analytics to monitor profitability and performance metrics instantly.</p>
                            </div>
                            <ul className="space-y-3 pt-2 font-bold text-gray-700 dark:text-slate-300 text-sm">
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-500 dark:text-[#FF2D55] shrink-0" /> Sales Analytics</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-500 dark:text-[#FF2D55] shrink-0" /> Revenue Reports</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-500 dark:text-[#FF2D55] shrink-0" /> Profit &amp; Loss Insights</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-500 dark:text-[#FF2D55] shrink-0" /> Executive Dashboard</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                            <Link to="/features/details?module=intelligence" className="inline-flex items-center gap-2 font-bold text-gray-900 dark:text-white hover:text-[#FF2D55] dark:hover:text-[#FF2D55] transition-colors group-hover:translate-x-1 transition-transform">
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 2: Menu & Orders */}
                    <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 border border-gray-100 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl dark:hover:border-[#FF6A00]/30 transition-all group">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-orange-50 dark:bg-[#FF6A00]/10 text-orange-500 dark:text-[#FF6A00] rounded-2xl flex items-center justify-center text-3xl font-bold border border-orange-100 dark:border-[#FF6A00]/20">
                                🍔
                            </div>
                            <div>
                                <p className="text-xs font-bold text-orange-500 dark:text-[#FF6A00] uppercase tracking-widest mb-1">Operations</p>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Menu &amp; Orders</h2>
                                <p className="text-gray-500 dark:text-[#94A3B8] text-sm font-medium mt-2">Complete control over dishes, table ordering, and instant kitchen routing.</p>
                            </div>
                            <ul className="space-y-3 pt-2 font-bold text-gray-700 dark:text-slate-300 text-sm">
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500 dark:text-[#FF6A00] shrink-0" /> Menu Management</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500 dark:text-[#FF6A00] shrink-0" /> Order Management</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500 dark:text-[#FF6A00] shrink-0" /> Smart QR Digital Menu</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500 dark:text-[#FF6A00] shrink-0" /> Table Reservations</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                            <Link to="/features/details?module=orders" className="inline-flex items-center gap-2 font-bold text-gray-900 dark:text-white hover:text-[#FF6A00] dark:hover:text-[#FF6A00] transition-colors group-hover:translate-x-1 transition-transform">
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 3: Staff & Customers */}
                    <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 border border-gray-100 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl dark:hover:border-blue-500/30 transition-all group">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center text-3xl font-bold border border-blue-100 dark:border-blue-500/20">
                                👥
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Team &amp; Hospitality</p>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Staff &amp; Customers</h2>
                                <p className="text-gray-500 dark:text-[#94A3B8] text-sm font-medium mt-2">Manage employee roles, track attendance, and build customer loyalty records.</p>
                            </div>
                            <ul className="space-y-3 pt-2 font-bold text-gray-700 dark:text-slate-300 text-sm">
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Staff Management</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Customer Management</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Custom Roles &amp; Access</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Attendance Tracking</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                            <Link to="/features/details?module=staff" className="inline-flex items-center gap-2 font-bold text-gray-900 dark:text-white hover:text-blue-500 transition-colors group-hover:translate-x-1 transition-transform">
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 4: Branch Manager Dashboard */}
                    <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 border border-gray-100 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl dark:hover:border-emerald-500/30 transition-all group">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center text-3xl font-bold border border-emerald-100 dark:border-emerald-500/20">
                                🏬
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Branch Manager</p>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Branch Management</h2>
                                <p className="text-gray-500 dark:text-[#94A3B8] text-sm font-medium mt-2">Daily overview, staff shifts monitoring, petty cash expenses and tables status.</p>
                            </div>

                            <ul className="space-y-3 pt-2 font-bold text-gray-700 dark:text-slate-300 text-sm">
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Live Orders &amp; Revenue Analytics</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Inventory &amp; Reservations</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Staff Attendance &amp; Customer Reviews</li>
                                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Sales Reports &amp; Petty Cash</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                            <Link to="/features/details?module=manager" className="inline-flex items-center gap-2 font-bold text-gray-900 dark:text-white hover:text-emerald-500 transition-colors group-hover:translate-x-1 transition-transform">
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
