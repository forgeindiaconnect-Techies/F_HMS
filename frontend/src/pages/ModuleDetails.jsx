import { Link, useSearchParams } from 'react-router-dom';
import { Utensils, ArrowRight, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

const ModuleDetails = () => {
    const [searchParams] = useSearchParams();
    const activeModule = searchParams.get('module') || 'intelligence';

    const moduleData = {
        intelligence: {
            title: "Business Intelligence & Analytics",
            tag: "Restaurant Owner",
            tagColor: "text-[#FF2D55] bg-[#FF2D55]/10 border-[#FF2D55]/20",
            checkColor: "text-[#FF2D55]",
            icon: "📊",
            features: [
                { name: "Executive Sales Dashboard", desc: "Live overview of total revenue, average order value (AOV), active orders, and top-selling menu items." },
                { name: "Profit & Loss Tracking", desc: "Monitor raw material ingredient costs against menu pricing to calculate real-time net profit margins." },
                { name: "Revenue Reports & Export", desc: "Generate daily, weekly, or monthly financial breakdowns compatible with accounting software." },
                { name: "Sales Trend Analysis", desc: "Identify peak operational hours and customer ordering habits to optimize staffing shifts." }
            ]
        },
        orders: {
            title: "Menu, Orders & Dine-In Operations",
            tag: "Operations",
            tagColor: "text-[#FF6A00] bg-[#FF6A00]/10 border-[#FF6A00]/20",
            checkColor: "text-[#FF6A00]",
            icon: "🍔",
            features: [
                { name: "Menu Catalog Management", desc: "Add, edit, or temporarily disable menu items, set category tags, and manage multi-branch pricing." },
                { name: "Real-Time Order Routing", desc: "Orders flow directly to kitchen display screens (KDS), waiter tablets, and cashier billing counters." },
                { name: "Smart QR Digital Menu", desc: "Generate table-specific QR codes enabling customers to view digital menus and pay at their table." },
                { name: "Table & Reservation Scheduling", desc: "Visual floor map tracking occupied tables, pending bookings, and party arrival times." }
            ]
        },
        staff: {
            title: "Staff & Customer Relationship Management",
            tag: "Team & Hospitality",
            tagColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20",
            checkColor: "text-blue-500",
            icon: "👥",
            features: [
                { name: "Staff Account Delegation", desc: "Create accounts for managers, chefs, waiters, and cashiers with strict role-based access permissions." },
                { name: "Attendance & Shift Tracking", desc: "Record clock-in/clock-out timestamps and track operational staff performance per shift." },
                { name: "Customer Profile Directory", desc: "Store customer contact details, dining history, favorite items, and loyalty reward balances." },
                { name: "Role-Based Access Control", desc: "Restrict sensitive settings like tax rates or refund authorizations to store owners and managers." }
            ]
        },
        manager: {
            title: "Branch Manager Operations & Dashboard",
            tag: "Branch Manager",
            tagColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
            checkColor: "text-emerald-500",
            icon: "🏬",
            image: "/branch-manager-dashboard.png",
            features: [
                { name: "Live Orders Dashboard", desc: "Monitor incoming customer dining orders, takeaway tickets, and new order sound alerts in real time." },
                { name: "Revenue Analytics & Trends", desc: "Interactive graph charts tracking peak sales hours, daily bill volume, and live revenue totals." },
                { name: "Inventory & Stock Levels", desc: "Instant visibility into raw ingredient stock, low-inventory warnings, and kitchen stock reorders." },
                { name: "Reservations & Table Map", desc: "Track reserved tables, party sizes, time slots, and visual dine-in table seating status." },
                { name: "Staff Attendance & Shifts", desc: "Log active floor waiters, chef prep shifts, clock-in times, and staff performance metrics." },
                { name: "Customer Reviews & Sales Reports", desc: "Logbook of dining feedback, dish ratings, revenue pie-charts, and daily financial summaries." }
            ]
        }
    };

    const current = moduleData[activeModule] || moduleData.intelligence;

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
                        <Link to="/features/management" className="text-gray-500 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-white font-semibold text-sm transition-colors flex items-center gap-1">
                            <ArrowLeft size={16} /> Back to Overview
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

            {/* Content Container */}
            <main className="w-full px-4 sm:px-6 py-16 space-y-16 relative z-10">

                {/* Header Banner */}
                <div className="space-y-4 text-center max-w-3xl mx-auto">
                    <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border font-bold text-xs uppercase tracking-wider ${current.tagColor}`}>
                        <span>{current.tag}</span>
                        <ChevronRight size={14} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                        {current.title}
                    </h1>
                    <p className="text-gray-500 dark:text-[#94A3B8] font-medium text-lg leading-relaxed">
                        {current.description}
                    </p>
                </div>

                {/* Rounded Dashboard Illustration Frame */}
                {current.image && (
                    <div className="max-w-4xl mx-auto rounded-[2.5rem] overflow-hidden bg-gradient-to-tr from-emerald-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-emerald-950/40 p-4 sm:p-6 border border-emerald-100 dark:border-slate-800 shadow-xl">
                        <div className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-950 shadow-inner border border-slate-200/80 dark:border-slate-800">
                            <img 
                                src={current.image} 
                                alt={current.title}
                                className="w-full h-auto object-cover filter contrast-[1.02] hover:scale-[1.01] transition-transform duration-500" 
                            />
                        </div>
                        
                        {/* Interactive Feature Pills */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-black">
                            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">🛒 Live Orders</span>
                            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">📈 Revenue Analytics</span>
                            <span className="px-3 py-1 rounded-full bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20">📦 Inventory</span>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">📅 Reservations</span>
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">👥 Staff Attendance</span>
                            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">⭐ Customer Reviews</span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">📊 Sales Reports</span>
                        </div>
                    </div>
                )}

                {/* Feature Explanation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {current.features.map((feat, idx) => (
                        <div key={idx} className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 border border-gray-100 dark:border-white/[0.08] shadow-sm dark:shadow-none hover:shadow-md dark:hover:border-[#FF2D55]/20 transition-all space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-[#FF2D55]/10 flex items-center justify-center text-[#FF2D55] font-black text-lg border border-gray-100 dark:border-[#FF2D55]/20">
                                {idx + 1}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{feat.name}</h3>
                            <p className="text-gray-500 dark:text-[#94A3B8] text-sm font-medium leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Call to Action Card */}
                <div className="max-w-5xl mx-auto bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#FF2D55]/20">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-3xl font-black">Ready to optimize your restaurant?</h2>
                        <p className="text-red-100 font-medium text-sm">Experience the full power of our restaurant management suite today.</p>
                    </div>
                    <Link to="/staff/register" className="bg-white dark:bg-[#050816] text-gray-900 dark:text-white font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-lg whitespace-nowrap border border-transparent dark:border-white/[0.12]">
                        Get Started Free
                    </Link>
                </div>

            </main>
        </div>
    );
};

export default ModuleDetails;
