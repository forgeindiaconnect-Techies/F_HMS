import { Link } from 'react-router-dom';
import { Utensils, ArrowRight, ArrowLeft, CheckCircle2, ChevronRight, BarChart3, ShoppingCart, Users, Building2 } from 'lucide-react';
import WebsiteNavbar from '../components/WebsiteNavbar';
import WebsiteFooter from '../components/WebsiteFooter';

const ManagementFeatures = () => {
    return (
        <div className="min-h-screen bg-[#FFFDF9] text-slate-800 font-sans selection:bg-[#FF5A1F] selection:text-white transition-colors relative overflow-x-hidden">

            {/* Global FoodNest Navbar */}
            <WebsiteNavbar />

            {/* Ambient Warm Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-orange-100/40 via-amber-50/20 to-transparent blur-3xl pointer-events-none z-0" />

            {/* Main Content */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-24 space-y-12 relative z-10">

                {/* Back Navigation Bar */}
                <div className="flex items-center justify-between">
                    <Link 
                        to="/#features" 
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-orange-200 text-slate-600 hover:text-[#FF5A1F] font-bold text-xs shadow-xs transition-all group cursor-pointer"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-[#FF5A1F]" />
                        <span>Back to Features</span>
                    </Link>
                    <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                        FoodNest Feature Suite • Management &amp; Operations
                    </span>
                </div>

                {/* Hero */}
                <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
                    <p className="text-sm sm:text-[15px] font-serif italic font-bold text-[#FF5A0A] tracking-wide">
                        FoodNest Enterprise Suite
                    </p>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-[#FF5A1F] font-bold text-xs uppercase tracking-wider shadow-xs">
                        <span>Management &amp; Operations</span>
                        <ChevronRight size={13} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#142B45] tracking-tight leading-[1.14]">
                        Complete Management Solution for Modern Restaurants
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        Empower your restaurant operations with real-time intelligence, automated order workflows, and unified staff administration.
                    </p>
                </div>

                {/* 4 Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Category 1: Business Intelligence */}
                    <div className="bg-white rounded-3xl p-7 border border-orange-100/80 shadow-sm hover:shadow-xl hover:border-orange-200 space-y-6 flex flex-col justify-between hover:-translate-y-1 transition-all group">
                        <div className="space-y-5 flex-1">
                            <div className="w-13 h-13 bg-orange-50 text-[#FF5A1F] rounded-2xl flex items-center justify-center text-2xl font-bold border border-orange-100">
                                📊
                            </div>
                            <div>
                                <p className="text-xs font-black text-[#FF5A1F] uppercase tracking-wider mb-1">Restaurant Owner</p>
                                <h2 className="text-xl font-black text-[#142B45]">Business Intelligence</h2>
                                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5 leading-relaxed">Executive analytics to monitor profitability and performance metrics instantly.</p>
                            </div>
                            <div className="rounded-2xl overflow-hidden border border-slate-100 bg-[#FFFDF9] p-2 group-hover:border-orange-200 transition-colors">
                                <img src="/business-intelligence-dashboard.png" alt="Business Intelligence Dashboard" className="w-full h-32 object-contain rounded-xl filter contrast-[1.02] group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <ul className="space-y-2.5 pt-1 font-bold text-slate-700 text-xs sm:text-sm">
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-[#FF5A1F] shrink-0" /> Sales Analytics</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-[#FF5A1F] shrink-0" /> Revenue Reports</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-[#FF5A1F] shrink-0" /> Profit &amp; Loss Insights</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-[#FF5A1F] shrink-0" /> Executive Dashboard</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <Link to="/features/details?module=intelligence" className="inline-flex items-center gap-2 font-bold text-sm text-[#142B45] hover:text-[#FF5A1F] transition-colors group-hover:translate-x-1 transition-transform">
                                <span>Learn more</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 2: Menu & Orders */}
                    <div className="bg-white rounded-3xl p-7 border border-orange-100/80 shadow-sm hover:shadow-xl hover:border-orange-200 space-y-6 flex flex-col justify-between hover:-translate-y-1 transition-all group">
                        <div className="space-y-5 flex-1">
                            <div className="w-13 h-13 bg-orange-50 text-[#FF5A1F] rounded-2xl flex items-center justify-center text-2xl font-bold border border-orange-100">
                                🍔
                            </div>
                            <div>
                                <p className="text-xs font-black text-[#FF5A1F] uppercase tracking-wider mb-1">Operations</p>
                                <h2 className="text-xl font-black text-[#142B45]">Menu &amp; Orders</h2>
                                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5 leading-relaxed">Complete control over dishes, table ordering, and instant kitchen routing.</p>
                            </div>
                            <ul className="space-y-2.5 pt-1 font-bold text-slate-700 text-xs sm:text-sm">
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-[#FF5A1F] shrink-0" /> Menu Management</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-[#FF5A1F] shrink-0" /> Order Management</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-[#FF5A1F] shrink-0" /> Smart QR Digital Menu</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-[#FF5A1F] shrink-0" /> Table Reservations</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <Link to="/features/details?module=orders" className="inline-flex items-center gap-2 font-bold text-sm text-[#142B45] hover:text-[#FF5A1F] transition-colors group-hover:translate-x-1 transition-transform">
                                <span>Learn more</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 3: Staff & Customers */}
                    <div className="bg-white rounded-3xl p-7 border border-orange-100/80 shadow-sm hover:shadow-xl hover:border-orange-200 space-y-6 flex flex-col justify-between hover:-translate-y-1 transition-all group">
                        <div className="space-y-5 flex-1">
                            <div className="w-13 h-13 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold border border-blue-100">
                                👥
                            </div>
                            <div>
                                <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-1">Team &amp; Hospitality</p>
                                <h2 className="text-xl font-black text-[#142B45]">Staff &amp; Customers</h2>
                                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5 leading-relaxed">Manage employee roles, track attendance, and build customer loyalty records.</p>
                            </div>
                            <ul className="space-y-2.5 pt-1 font-bold text-slate-700 text-xs sm:text-sm">
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-blue-600 shrink-0" /> Staff Management</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-blue-600 shrink-0" /> Customer Management</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-blue-600 shrink-0" /> Custom Roles &amp; Access</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-blue-600 shrink-0" /> Attendance Tracking</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <Link to="/features/details?module=staff" className="inline-flex items-center gap-2 font-bold text-sm text-[#142B45] hover:text-blue-600 transition-colors group-hover:translate-x-1 transition-transform">
                                <span>Learn more</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>

                    {/* Category 4: Branch Manager Dashboard */}
                    <div className="bg-white rounded-3xl p-7 border border-orange-100/80 shadow-sm hover:shadow-xl hover:border-orange-200 space-y-6 flex flex-col justify-between hover:-translate-y-1 transition-all group">
                        <div className="space-y-5 flex-1">
                            <div className="w-13 h-13 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold border border-emerald-100">
                                🏬
                            </div>
                            <div>
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Branch Manager</p>
                                <h2 className="text-xl font-black text-[#142B45]">Branch Management</h2>
                                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5 leading-relaxed">Daily overview, staff shifts monitoring, petty cash expenses and table status.</p>
                            </div>
                            <ul className="space-y-2.5 pt-1 font-bold text-slate-700 text-xs sm:text-sm">
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> Live Orders &amp; Revenue Analytics</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> Inventory &amp; Reservations</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> Staff Attendance &amp; Reviews</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> Sales Reports &amp; Petty Cash</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <Link to="/features/details?module=manager" className="inline-flex items-center gap-2 font-bold text-sm text-[#142B45] hover:text-emerald-600 transition-colors group-hover:translate-x-1 transition-transform">
                                <span>Learn more</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Global FoodNest Footer */}
            <WebsiteFooter />
        </div>
    );
};

export default ManagementFeatures;
