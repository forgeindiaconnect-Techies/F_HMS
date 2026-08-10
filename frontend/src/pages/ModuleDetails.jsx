import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Utensils, ArrowRight, CheckCircle2, ChevronRight, BarChart3, ShoppingBag, Users, Store, ShieldCheck, ArrowLeft } from 'lucide-react';

const ModuleDetails = () => {
    const [searchParams] = useSearchParams();
    const activeModule = searchParams.get('module') || 'intelligence';

    const moduleData = {
        intelligence: {
            title: "Business Intelligence & Analytics",
            tag: "Restaurant Owner",
            description: "Gain complete executive visibility over daily revenue, order trends, profit margins, and sales channels.",
            accent: "text-red-600 bg-red-50 border-red-100",
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
            description: "Manage your food catalog, auto-route orders to kitchen screens, and enable instant table QR ordering.",
            accent: "text-orange-600 bg-orange-50 border-orange-100",
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
            description: "Control employee roles, monitor shift attendance, and maintain detailed customer dining histories.",
            accent: "text-blue-600 bg-blue-50 border-blue-100",
            icon: "👥",
            features: [
                { name: "Staff Account Delegation", desc: "Create accounts for managers, chefs, waiters, and cashiers with strict role-based access permissions." },
                { name: "Attendance & Shift Tracking", desc: "Record clock-in/clock-out timestamps and track operational staff performance per shift." },
                { name: "Customer Profile Directory", desc: "Store customer contact details, dining history, favorite items, and loyalty reward balances." },
                { name: "Role-Based Access Control", desc: "Restrict sensitive settings like tax rates or refund authorizations to store owners and managers." }
            ]
        },
        manager: {
            title: "Branch Manager Operations",
            tag: "Branch Manager",
            description: "Empower local managers with real-time operational feeds, table occupancy charts, and petty cash logs.",
            accent: "text-emerald-600 bg-emerald-50 border-emerald-100",
            icon: "🏬",
            features: [
                { name: "Live Branch Overview Feed", desc: "Live KPI summary of shift revenue, active waiters on shift, and automated inventory stock alerts." },
                { name: "Daily Orders Tracking", desc: "Keep track of active kitchen status lists, waiter orders status, and cashier shift summaries." },
                { name: "Staff Shifts & Monitoring", desc: "Coordinate daily check-in logs, break statuses, and monitor schedule adherence directly from the floor." },
                { name: "Localized Expense Tracking", desc: "Record local branch cash outflows and operational expenses including emergency repairs or supplies." },
                { name: "Interactive Table Status", desc: "Visual map tracking occupied tables, pending guest reservations, and served status cycles." },
                { name: "Customer Feedback Logbook", desc: "Review customer service reviews, food rating surveys, and suggestions in real time." }
            ]
        }
    };

    const current = moduleData[activeModule] || moduleData.intelligence;

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
                        <Link to="/features/management" className="text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors flex items-center gap-1">
                            <ArrowLeft size={16} /> Back to Overview
                        </Link>
                        <Link to="/staff/register" className="bg-gray-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-sm transition-all">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content Container */}
            <main className="max-w-6xl mx-auto px-6 py-16 space-y-16">
                
                {/* Header Banner */}
                <div className="space-y-4 text-center max-w-3xl mx-auto">
                    <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border font-bold text-xs uppercase tracking-wider ${current.accent}`}>
                        <span>{current.tag}</span>
                        <ChevronRight size={14} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                        {current.title}
                    </h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        {current.description}
                    </p>
                </div>

                {/* Feature Explanation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {current.features.map((feat, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-red-500 font-black text-lg">
                                {idx + 1}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{feat.name}</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Call to Action Card */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-3xl font-black">Ready to optimize your restaurant?</h2>
                        <p className="text-red-100 font-medium text-sm">Experience the full power of our restaurant management suite today.</p>
                    </div>
                    <Link to="/staff/register" className="bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap">
                        Get Started Free
                    </Link>
                </div>

            </main>
        </div>
    );
};

export default ModuleDetails;
