// Updated Business Intelligence illustration asset
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Utensils, ArrowRight, CheckCircle2, ChevronRight, ArrowLeft, Sparkles, Zap, Check } from 'lucide-react';

const ModuleDetails = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeModule = searchParams.get('module') || 'intelligence';
    const featureIdxParam = searchParams.get('feature');

    const [selectedFeature, setSelectedFeature] = useState(null);

    const moduleData = {
        intelligence: {
            title: "Business Intelligence & Executive Analytics",
            tag: "Restaurant Owner",
            tagColor: "text-[#FF2D55] bg-[#FF2D55]/10 border-[#FF2D55]/20",
            checkColor: "text-[#FF2D55]",
            icon: "📊",
            image: "/business-intelligence-dashboard.png",
            pills: ["📈 Total Revenue (₹24,85,000)", "💰 Total Profit (₹8,45,000)", "🛒 Total Orders (1,245)", "🍕 Top Dish: Margherita Pizza", "📊 Dine-In Sales (45%)", "⚡ Growth (+18.5%)"],
            features: [
                {
                    name: "Executive Sales Dashboard",
                    desc: "Live overview of total ₹24,85,000 revenue, 1,235 total orders, average order value (AOV), active order turns, and top dish statistics.",
                    image: "/executive-sales-dashboard.png",
                    capabilities: [
                        "Live multi-branch revenue & sales tracking",
                        "Average Order Value (AOV) performance analysis",
                        "Top-selling dish velocity & volume heatmaps",
                        "Peak sales hour time-series graphs"
                    ],
                    workflow: [
                        "Orders are settled across tables or online apps",
                        "System aggregates gross revenue & taxes instantly",
                        "Executive dashboard updates graphs & KPIs in real time"
                    ],
                    preview: {
                        metric: "₹24,85,000",
                        sub: "Total Revenue (+18% Monthly Sales Growth)",
                        status: "Live Business KPIs Active",
                        detail: "1,235 Total Orders • Profit Margin: 45% • Today's Orders: 108"
                    }
                },
                {
                    name: "Profit & Loss Tracking",
                    desc: "Monitor raw material ingredient costs against menu pricing to calculate real-time net 75% profit margins and manage store expenses.",
                    image: "/profit-and-loss-dashboard.png",
                    capabilities: [
                        "Automated recipe ingredient cost accounting & calculator",
                        "Dish-level net profit margin calculation (75% Profit Margin)",
                        "Low margin alert thresholds & warnings for menu items",
                        "Real-time ledger of store operational expenses & financial health score"
                    ],
                    workflow: [
                        "Log raw ingredient invoice prices in Inventory calculator",
                        "System calculates exact food cost & recipe margin",
                        "View live profit vs expense charts & financial health scores"
                    ],
                    preview: {
                        metric: "75% Profit Margin",
                        sub: "Revenue: $7,000.00 • Expenses: $1,883.00",
                        status: "Financial Health Score: High",
                        detail: "Low Margin Alerts: Active • Ingredient Food Cost: $18.75"
                    }
                },
                {
                    name: "Revenue Growth & Export",
                    desc: "Generate daily, weekly, or monthly financial breakdowns tracking +18.5% growth velocity and instant multi-format audit report exports.",
                    image: "/revenue-growth-dashboard.png",
                    capabilities: [
                        "Custom date-range financial filtering & time-series trends",
                        "Tax & GST summary compliance reporting",
                        "One-click PDF Report, Excel Sheet & CSV File exports",
                        "Period-over-period revenue velocity comparison (+18.5% Growth)"
                    ],
                    workflow: [
                        "Select desired date range (Daily, Weekly, Monthly)",
                        "System calculates growth percentages & GST summary",
                        "Click Export Button to download PDF, Excel, or CSV audit reports"
                    ],
                    preview: {
                        metric: "+18.5%",
                        sub: "Overall Revenue Growth Velocity",
                        status: "Export Ready (PDF / Excel / CSV)",
                        detail: "Daily Revenue: +12.5% • Weekly: +103.8% • Monthly: +58.2%"
                    }
                },
                {
                    name: "Customer Insights & Trends",
                    desc: "Identify dining customer demographics, peak arrival hour heatmaps, dish review ratings, and guest loyalty trends.",
                    image: "/customer-insights-dashboard.png",
                    capabilities: [
                        "Customer demographic profiling & age/gender analytics",
                        "Peak hours arrival heatmap & dining time series",
                        "Dish rating sentiment & review feedback analysis ('Best Pizza', 'Loved Biryani')",
                        "Customer loyalty portal & repeat customer rate (+14.2%)"
                    ],
                    workflow: [
                        "Capture customer dining profile & ratings on QR or POS",
                        "AI generates peak hour heatmaps & demographic insights",
                        "Reward loyal diners with targeted promotions & loyalty score points"
                    ],
                    preview: {
                        metric: "85/100 Loyalty Score",
                        sub: "Customer Satisfaction: 74% Positive",
                        status: "Repeat Customer Rate (+14.2%)",
                        detail: "Top Favorites: Margherita Pizza, Dum Biryani • 89% Dine-in Share"
                    }
                }
            ]
        },
        orders: {
            title: "Menu, Orders & Dine-In Operations",
            tag: "Operations",
            tagColor: "text-[#FF6A00] bg-[#FF6A00]/10 border-[#FF6A00]/20",
            checkColor: "text-[#FF6A00]",
            icon: "🍔",
            image: "/menu-orders-dashboard.png",
            pills: ["🎫 Order Tickets", "📱 QR Digital Menu", "👨‍🍳 Kitchen Queue (KDS)", "🍔 Menu Management", "📅 Table Reservations", "🛵 Delivery Tracker"],
            features: [
                {
                    name: "Live Orders Dashboard & Ticket Routing",
                    desc: "Centralized Live Orders Dashboard to manage incoming Dine-In, Takeaway, Delivery Orders, and Kitchen Queues with instant Sound Alerts, Table Numbers (T-05, T-06, T-03), and live order counters (12 Active).",
                    image: "/live-orders-dashboard.png",
                    capabilities: [
                        "Real-time Live Order Counter (12 Active Orders) across Dine-In, Takeaway & Delivery",
                        "New Order Notification & Sound Alert chime cards for instant staff awareness",
                        "Order Status tracking (New, Preparing, Ready, Delivered) & Table Numbers allocation (T-05, T-06, T-03)",
                        "Kitchen Display, Chef Queue, Delivery Dispatch ($1274.4.5) & POS Integration"
                    ],
                    workflow: [
                        "Customer Order received via POS integration",
                        "Kitchen Display routes ticket & updates Chef Queue",
                        "Dish status progresses: Preparing -> Ready -> Delivered / Table"
                    ],
                    preview: {
                        metric: "12 Live Order Counter",
                        sub: "Dine-In • Takeaway • Delivery • Kitchen Queue",
                        status: "Sound Alerts & POS Integration Active",
                        detail: "Tables: T-05, T-06, T-03 • Delivery Dispatch & Chef Queue Active"
                    }
                },
                {
                    name: "Smart QR Digital Menu",
                    desc: "Generate table-specific QR codes enabling guests to scan, browse interactive HD dish menus, customize dietary preferences, pay online, and send orders directly to the kitchen.",
                    image: "/smart-qr-digital-menu.png",
                    capabilities: [
                        "Table-Specific QR Management & instant QR Code Generator",
                        "HD Dish Gallery with dietary filters (Vegan, Gluten Free, Spice Levels)",
                        "Customizable order add-ons & popular dish highlights",
                        "Secure online payment gateway & instant kitchen dispatch"
                    ],
                    workflow: [
                        "Scan QR Code at Table 07",
                        "Browse Menu Categories & HD Dish Gallery",
                        "Customize Order (Spice Level, Vegan / Gluten Free tags)",
                        "Add to Cart & Pay Online securely",
                        "Order dispatches directly to Kitchen Queue"
                    ],
                    preview: {
                        metric: "Table 07 Session",
                        sub: "Live Cart: Veg Spring Rolls, Truffle Pasta ($12.00)",
                        status: "Instant Kitchen Routing",
                        detail: "Contactless Payment Enabled • Dietary Filters Active"
                    }
                },
                {
                    name: "Kitchen Queue (KDS Display)",
                    desc: "Organize cooking tasks into To Do, In Progress, and Ready status boards with automated timers.",
                    image: "/kitchen-display-dashboard.png",
                    capabilities: [
                        "Color-coded kitchen status columns (To Do, In Progress, Ready)",
                        "Prep time countdown timers with delay alerts",
                        "One-touch kitchen status updates",
                        "Kitchen staff station load balancing"
                    ],
                    workflow: [
                        "New order ticket arrives in To Do column",
                        "Chef taps ticket to move to In Progress",
                        "Order prepped; chef marks Ready for waiter pickup"
                    ],
                    preview: {
                        metric: "04:15 mins",
                        sub: "Average Kitchen Prep Time",
                        status: "Station 1 Active",
                        detail: "To Do: 2 • In Progress: 3 • Ready: 1"
                    }
                },
                {
                    name: "Menu Catalog & Delivery Tracking",
                    desc: "Real-time menu editing, instant price updates, out-of-stock item toggles, reservation management, and live GPS rider delivery tracking.",
                    image: "/menu-catalog-dashboard.png",
                    capabilities: [
                        "Real-time menu item editing & instant price updates ($28.00)",
                        "Instant out-of-stock item availability toggling",
                        "Reservation calendar & table allocation management",
                        "Live delivery queue status timeline (Preparing -> Out for Delivery -> Delivered) & Rider GPS tracking"
                    ],
                    workflow: [
                        "Edit dish prices or toggle out-of-stock items in Menu Catalog",
                        "Changes reflect instantly across QR digital menus & POS terminals",
                        "Assign delivery riders & track live driver map location with ETA countdown (ETA 12 mins)"
                    ],
                    preview: {
                        metric: "ETA: 12 MINS",
                        sub: "Live Delivery Tracking • Rider Near",
                        status: "Rider Assigned",
                        detail: "Truffle Pasta & Margherita Pizza ($28.00) • Live GPS Active"
                    }
                }
            ]
        },
        staff: {
            title: "Staff & Customer Relationship Management",
            tag: "Team & Hospitality",
            tagColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20",
            checkColor: "text-blue-500",
            icon: "👥",
            image: "/staff-customer-dashboard.png",
            pills: ["👥 Staff Dashboard", "📊 Attendance Overview", "👨‍🍳 Team Roles & Shifts", "⭐ Customer Loyalty Portal", "📅 Reservation Log", "💬 Customer Feedback"],
            features: [
                {
                    name: "Staff Account Delegation",
                    desc: "User management dashboard to create accounts and delegate role-based permissions across Owner, Manager, Chef, Waiter, Cashier, and Receptionist team members.",
                    image: "/staff-delegation-dashboard.png",
                    capabilities: [
                        "Role Assignment & Permission Matrix (Owner, Manager, Chef, Waiter, Cashier, Receptionist)",
                        "Granular Feature Access Controls & Active / Disabled Account Toggles",
                        "Delegated Permissions & Access Key Security",
                        "Real-time Staff Login Status monitoring (Active / Inactive sessions)"
                    ],
                    workflow: [
                        "Owner selects staff member profile in User Management Dashboard",
                        "Assigns specific role permissions (Kitchen Access, Billing Access, Order Access)",
                        "Issue Access Key; track live staff login status across terminals"
                    ],
                    preview: {
                        metric: "6 Roles Matrix",
                        sub: "Permission Matrix & Access Key Security",
                        status: "User Management Dashboard Active",
                        detail: "Owner (Full), Manager (Ops), Chef (Kitchen), Waiter (Orders), Cashier (Billing), Receptionist"
                    }
                },
                {
                    name: "Attendance & Shift Tracking",
                    desc: "Shift management dashboard to track 36+ daily staff attendance, terminal Clock In/Out, weekly schedule calendars, table area allocations, and overtime logs.",
                    image: "/attendance-shift-dashboard.png",
                    capabilities: [
                        "Terminal Clock In & Clock Out timestamping with staff status (Present, On Leave, Late)",
                        "Interactive Shift Calendar (8:00-16:00, 16:00-0:00) & Weekly Schedule matrix",
                        "Table Area Allocation & staff section assignment",
                        "Staff Performance metrics, Working Hours (3h 20h), and Overtime Hours (6h) logging"
                    ],
                    workflow: [
                        "Staff member taps Clock In on terminal screen at shift start",
                        "Manager assigns table area section & shift time slot on Shift Calendar",
                        "System automatically logs working hours, punctuality, and overtime duration"
                    ],
                    preview: {
                        metric: "36 Total Attendance",
                        sub: "Shift Management Dashboard Active",
                        status: "Clock In / Out Active",
                        detail: "Status: Present / On Leave / Late • Working: 3h 20h • Overtime: 6h"
                    }
                },
                {
                    name: "Customer Profile & Loyalty Portal",
                    desc: "Centralized Customer Profile Dashboard to manage QR membership cards, track 530+ loyalty points, reward wallet balances ($1,000), Gold Status tiers, and guest dining histories.",
                    image: "/customer-loyalty-dashboard.png",
                    capabilities: [
                        "QR Membership & Digital Loyalty Card (530+ Loyalty Points)",
                        "Reward Wallet Balance ($1,000) & Gift Voucher issuance",
                        "Gold Status Membership Level & dining visit history tracking",
                        "Favorite Menu Items, Customer Reviews, Birthday Rewards & Referral Bonuses"
                    ],
                    workflow: [
                        "Guest scans QR Membership card or provides phone number at POS",
                        "System credits 530+ Loyalty Points & updates Reward Wallet Balance ($1,000)",
                        "Automatically unlocks Gold Status perks, Birthday Rewards & Gift Vouchers"
                    ],
                    preview: {
                        metric: "530+ Loyalty Points",
                        sub: "Membership Level: Gold Status",
                        status: "Reward Wallet: $1,000 Balance",
                        detail: "Gift Vouchers Active • Referral Bonus & Birthday Rewards Enabled"
                    }
                },
                {
                    name: "Reservation Log & Feedback",
                    desc: "Reservation Management Dashboard to manage table booking timelines, guest lists, party sizes, special requests, table availability, live waitlists, and guest feedback analytics.",
                    image: "/reservation-feedback-dashboard.png",
                    capabilities: [
                        "Reservation Calendar & Table Booking Timeline management",
                        "Guest List, Party Size, Special Requests & Guest Notes logging",
                        "Table Availability tracking, Waitlist toggle (ON/OFF) & Notification Alerts",
                        "Dining Reviews, 5-Star Customer Ratings & Feedback Analytics"
                    ],
                    workflow: [
                        "Customer Books table online or via phone call",
                        "Reservation Confirmed & added to master Table Booking Timeline",
                        "Table Allocated & Waitlist managed when busy",
                        "Guest Checked In at table",
                        "Feedback Collected & 5-Star Reviews saved in analytics"
                    ],
                    preview: {
                        metric: "Reservation Calendar Active",
                        sub: "Table Booking Timeline & Waitlist ON",
                        status: "5-Star Rating Analytics Enabled",
                        detail: "Guest Notes: Active • Special Requests & Notification Alerts Synced"
                    }
                }
            ]
        },
        manager: {
            title: "Branch Manager Operations & Dashboard",
            tag: "Branch Manager",
            tagColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
            checkColor: "text-emerald-500",
            icon: "🏬",
            image: "/branch-manager-dashboard.png",
            pills: ["🛒 Live Orders", "📈 Revenue Analytics", "📦 Inventory", "📅 Reservations", "👥 Staff Attendance", "⭐ Customer Reviews", "📊 Sales Reports"],
            features: [
                {
                    name: "Live Orders Dashboard",
                    desc: "Monitor incoming customer dining orders, takeaway tickets, and new order sound alerts in real time.",
                    image: "/live-orders-dashboard.png",
                    capabilities: [
                        "Centralized live dine-in & takeaway order feed",
                        "Instant audio chime alerts for new incoming orders",
                        "Order status monitoring (Prepped, Cooking, Billed)",
                        "Table bill settlement monitoring"
                    ],
                    workflow: [
                        "Orders stream into manager dashboard live",
                        "Manager monitors kitchen prep times & table service",
                        "Ensure smooth billing & customer throughput"
                    ],
                    preview: {
                        metric: "3 Active",
                        sub: "Table #08, Table #14, Takeaway",
                        status: "Live Feed Active",
                        detail: "Total Active Value: ₹1,530 • Sound Alerts: On"
                    }
                },
                {
                    name: "Revenue Analytics & Trends",
                    desc: "Analytics Dashboard tracking Hourly Revenue ($13.62K), Monthly Revenue ($2,507.0K), Average Order Value ($19.39), Revenue Comparison trends (+2.93% Growth), Peak Sales Hours, and Sales Heatmaps.",
                    image: "/revenue-analytics-dashboard.png",
                    capabilities: [
                        "Hourly Revenue ($13.62K) & Monthly Revenue ($2,507.0K) performance tracking",
                        "Average Order Value (AOV: $19.39) & Revenue Trend curve visualization (Jan to Jun)",
                        "Peak Sales Hours & Sales Heatmap dining intensity matrices",
                        "Revenue Comparison Growth Cards (+2.93%), Branch Analytics KPIs (33%, 34.6%, 31%) & Export Reports"
                    ],
                    workflow: [
                        "Manager opens Analytics Dashboard to review hourly & monthly sales curves",
                        "Analyzes Peak Sales Hours & Sales Heatmap dining windows",
                        "Click Export Report button to download branch KPI summaries"
                    ],
                    preview: {
                        metric: "$2,507.0K Monthly Revenue",
                        sub: "Hourly Revenue: $13.62K • Average Order Value: $19.39",
                        status: "+2.93% Growth Comparison",
                        detail: "Peak Sales Hours Active • Sales Heatmap & Branch Analytics KPIs Synced"
                    }
                },
                {
                    name: "Inventory & Stock Levels",
                    desc: "Inventory Dashboard managing 1,248 raw ingredients (Total Stock Value ₹24,85,000), 36 Low Stock Alerts, 18 Pending Purchase Orders (PO #1258, #1257), Expiry Tracking, Barcode Scanner, and Warehouse Overview (98% Utilization).",
                    image: "/inventory-stock-dashboard.png",
                    capabilities: [
                        "Real-time ingredient tracking (1,248 Items • ₹24,85,000 Stock Value • 98% Stock Availability)",
                        "Low Stock & Critical Item Alerts (36 Items below reorder level: Chicken Breast 18kg, Tomato 22kg, Paneer 5kg)",
                        "Expiry Tracking (Expires in 2 to 7 days), Inventory Movement logs (-5kg, +10kg), & Barcode Scanner",
                        "Warehouse Overview (4 Warehouses • 2,340 Bins) & Top Supplier Management (FreshFarm Foods 92%)"
                    ],
                    workflow: [
                        "Scan ingredient barcodes or view Low Stock Alerts (36 Items below threshold)",
                        "System tracks ingredient expiry (Expires in 2 days) & inventory movement",
                        "One-click 'Create Purchase Order' dispatches 18 Pending POs (Worth ₹5,40,000)"
                    ],
                    preview: {
                        metric: "1,248 Total Items (₹24,85,000)",
                        sub: "36 Low Stock Alerts • 18 Pending POs (₹5,40,000)",
                        status: "98% Stock Availability Active",
                        detail: "Warehouse Utilization: 98% • Expiry Tracking & Barcode Scanner Active"
                    }
                },
                {
                    name: "Reservations & Table Map",
                    desc: "Interactive floor plan table layout map displaying real-time table occupancy status (Green Available / Red Occupied), table seating duration timers (35m, 52m), Waiting Queue, and upcoming guest reservation calendar (7:00 PM, 7:30 PM).",
                    image: "/reservations-tablemap-dashboard.png",
                    capabilities: [
                        "Interactive floor plan table layout map (Tables T1, T2, T3, T4, T5, TS)",
                        "Real-time table occupancy status (Green = Available, Red = Occupied)",
                        "Table seating duration timers (35 MINS, 52 MINS) & live Waiting Queue monitoring",
                        "Upcoming guest reservation calendar, Reservation Ticket (7:30 PM), Guest Profile & Waitlist toggle"
                    ],
                    workflow: [
                        "Receive Reservation Request & click Reservation Confirmed",
                        "Assign Table on interactive floor plan map & issue Reservation Ticket (7:30 PM)",
                        "Guest Checked-In -> Monitor table seating duration timer (35 MINS, 52 MINS) -> Dining Completed"
                    ],
                    preview: {
                        metric: "Interactive Floor Plan Active",
                        sub: "Green = Available • Red = Occupied",
                        status: "Seating Timers: 35 MINS & 52 MINS",
                        detail: "Reservation Tickets: 7:30 PM (Party Size 4P, 2P) • Waiting Queue & Waitlist Active"
                    }
                },
                {
                    name: "Staff Attendance & Shifts",
                    desc: "Staff Attendance Dashboard monitoring 26 Active Floor Staff, terminal Clock In/Out times, Chef kitchen food prep speed tracking, Waiter table section allocations (Tables 1-6), and Shift Compliance Logs.",
                    image: "/staff-attendance-dashboard.png",
                    capabilities: [
                        "Staff Directory (26 Active Staff Counter) with real-time Present / Off Duty status badges & Staff Profile Cards",
                        "Chef kitchen food prep speed tracking & Chef Productivity Tracker speed graphs across shift hours",
                        "Waiter table section allocation & Waiter Floor Assignment cards (Tables 1, 2, 3, 4, 5, 6)",
                        "Break duration & shift compliance logs, Leave Request Cards, & Staff Performance Metrics (Progress 43%, Break 12%, KPI 1.38)"
                    ],
                    workflow: [
                        "Staff member clocks in; profile appears in Active Floor Staff directory (26 Active Counter)",
                        "Manager allocates waiter floor sections across Tables 1 to 6",
                        "Monitor chef prep speed graphs & track break duration compliance logs"
                    ],
                    preview: {
                        metric: "26 Active Staff Counter",
                        sub: "Staff Directory • Chef Prep Speed • Table Allocations",
                        status: "Shift Compliance Logs Active",
                        detail: "Performance Metrics: Progress 43% • Break 12% • KPI 1.38 • 25 Notifications"
                    }
                },
                {
                    name: "Customer Reviews & Sales Reports",
                    desc: "Customer Reviews & Sales Dashboard providing real-time guest dining feedback logbooks, dish rating sentiment scores (4.8★ Margherita Pizza), Revenue Pie Charts, Daily Sales KPI ($2.5K Today), and End-of-Day summary report exports.",
                    image: "/customer-reviews-sales-dashboard.png",
                    capabilities: [
                        "Real-time guest dining feedback logbook & Customer Rating Overview (5-Star: 58%, 4-Star: 35%)",
                        "Dish rating & customer sentiment scores (Margherita Pizza 4.8★, Chocosa Pizza 4.8★, Sentiment Meter)",
                        "Daily Sales KPI ($2.5K Today), Revenue Pie Chart (Dine-in / Takeaway), & Weekly Revenue Report bar charts",
                        "Best Selling Menu Items (49 orders), Local branch petty cash recording, & End-of-Day Report Export Card"
                    ],
                    workflow: [
                        "Guest submits dining feedback or review rating after meal",
                        "Feedback logs instantly in Guest Dining Feedback Logbook & updates Sentiment Meter",
                        "Manager reviews Daily Sales KPI ($2.5K Today) & clicks Report Export Card to download summary"
                    ],
                    preview: {
                        metric: "$2.5K Daily Sales KPI",
                        sub: "Customer Rating: 58% 5-Star • Dish Sentiment Score: 4.8★",
                        status: "Guest Feedback Notifications Active",
                        detail: "Best Seller: Margherita Pizza (49 Orders) • End-of-Day Report Export Ready"
                    }
                }
            ]
        }
    };

    const current = moduleData[activeModule] || moduleData.intelligence;

    // Check if feature query param exists on mount or update
    useEffect(() => {
        if (featureIdxParam !== null && current.features[parseInt(featureIdxParam)]) {
            setSelectedFeature(current.features[parseInt(featureIdxParam)]);
        } else {
            setSelectedFeature(null);
        }
    }, [featureIdxParam, activeModule]);

    const openFeatureModal = (feat, idx) => {
        setSelectedFeature(feat);
        setSearchParams({ module: activeModule, feature: idx.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeFeatureModal = () => {
        setSelectedFeature(null);
        setSearchParams({ module: activeModule });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── 1. DEDICATED FULL-SCREEN FEATURE DETAIL PAGE VIEW ──────────────────────────────────
    if (selectedFeature) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#050816] text-gray-900 dark:text-white font-sans transition-colors duration-300">
                
                {/* Ambient Glow Background */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#FF2D55]/10 via-[#FF6A00]/5 to-transparent blur-[160px] pointer-events-none z-0 hidden dark:block" />

                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#050816]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.08] py-3 sm:py-4 px-3 sm:px-6 shadow-sm transition-colors">
                    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-[#FF2D55] to-[#FF6A00] rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform shrink-0">
                                <Utensils size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                Restaurant<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] to-[#FF6A00]">Hub</span>
                            </h1>
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button 
                                onClick={closeFeatureModal}
                                className="text-gray-600 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1 cursor-pointer bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl whitespace-nowrap"
                            >
                                <ArrowLeft size={14} className="sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Back to</span> {current.tag} Overview
                            </button>
                            <Link
                                to="/staff/register"
                                className="bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-extrabold px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-[#FF2D55]/25 hover:scale-[1.03] active:scale-95 transition-all text-xs sm:text-sm whitespace-nowrap"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content Split Layout: Content on Left, Image on Right */}
                <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12 relative z-10">

                    {/* Side-by-Side Grid Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">

                        {/* LEFT SIDE OF THE SCREEN: Content, Header, Live Metrics */}
                        <div className="lg:col-span-6 space-y-6 text-left">
                            {/* Top Hero Header for Feature */}
                            <div className="space-y-3 sm:space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-bold text-[10px] sm:text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 max-w-full truncate">
                                    <span>{current.icon}</span>
                                    <span className="truncate">{current.tag} • FULL SPECIFICATION</span>
                                    <ChevronRight size={12} className="shrink-0" />
                                </div>
                                
                                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {selectedFeature.name}
                                </h1>
                                
                                <p className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base lg:text-lg leading-relaxed">
                                    {selectedFeature.desc}
                                </p>
                            </div>

                            {/* Real-time Live Metric Preview Banner */}
                            {selectedFeature.preview && (
                                <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-2xl space-y-4 sm:space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
                                                LIVE SYSTEM PREVIEW METRICS
                                            </span>
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                            {selectedFeature.preview.status}
                                        </span>
                                    </div>

                                    <div className="border-y border-slate-800 py-3 sm:py-4 space-y-1 sm:space-y-2">
                                        <h4 className="text-2xl sm:text-4xl font-black text-white tracking-tight break-words">
                                            {selectedFeature.preview.metric}
                                        </h4>
                                        <p className="text-xs sm:text-sm font-bold text-rose-400">
                                            {selectedFeature.preview.sub}
                                        </p>
                                    </div>
                                    <div className="pt-1">
                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-700/60 inline-block leading-normal">
                                            {selectedFeature.preview.detail}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDE OF THE SCREEN: Image Graphic */}
                        <div className="lg:col-span-6 space-y-4 w-full">
                            {(selectedFeature.image || current.image) && (
                                <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-tr from-orange-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-orange-950/40 p-2 sm:p-4 border border-orange-100 dark:border-slate-800 shadow-2xl w-full">
                                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-inner border border-slate-200/80 dark:border-slate-800 flex items-center justify-center min-h-[220px]">
                                        <img 
                                            src={selectedFeature.image || current.image} 
                                            alt={selectedFeature.name}
                                            className="w-full h-auto max-h-[350px] sm:max-h-[520px] object-contain filter contrast-[1.02] hover:scale-[1.01] transition-transform duration-500 mx-auto" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Key System Capabilities (Positioned AFTER the right side image, flowing left to right) */}
                    <div className="space-y-4 sm:space-y-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/60">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles size={20} className="text-rose-500 shrink-0" />
                            <span>Key System Capabilities & Responsibilities</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {selectedFeature.capabilities?.map((cap, idx) => (
                                <div key={idx} className="flex flex-col justify-between p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-500/30 transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 border border-emerald-500/20">
                                            <Check size={16} className="sm:w-4 sm:h-4" />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-wider">
                                            0{idx + 1}
                                        </span>
                                    </div>
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                        {cap}
                                    </h4>
                                    <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Engineered for high-volume operational efficiency and real-time synchronization.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* How It Works Workflow Steps */}
                    {selectedFeature.workflow && (
                        <div className="space-y-4 sm:space-y-6">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap size={20} className="text-orange-500 shrink-0" />
                                <span>How It Works (Step-by-Step Workflow)</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                                {selectedFeature.workflow.map((step, idx) => (
                                    <div key={idx} className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-lg">
                                            0{idx + 1}
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                                            Step {idx + 1}
                                        </h4>
                                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feature Switcher Bar - Switch to other features easily */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 sm:space-y-4">
                        <h4 className="text-[10px] sm:text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                            EXPLORE OTHER FEATURES IN THIS MODULE
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {current.features.map((feat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => openFeatureModal(feat, idx)}
                                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        selectedFeature.name === feat.name
                                            ? 'bg-rose-500 text-white shadow-md'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    {feat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bottom CTA Banner */}
                    <div className="bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#FF2D55]/20">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-2xl sm:text-3xl font-black">Ready to deploy {selectedFeature.name}?</h2>
                            <p className="text-red-100 font-medium text-xs sm:text-sm">Get started with our 1-Day Free Trial and transform your restaurant operations.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={closeFeatureModal}
                                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-3 rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
                            >
                                Back to Module Overview
                            </button>
                            <Link to="/staff/register" className="w-full sm:w-auto text-center bg-white dark:bg-[#050816] text-gray-900 dark:text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-lg whitespace-nowrap border border-transparent dark:border-white/[0.12] text-xs sm:text-sm">
                                Get Started Free
                            </Link>
                        </div>
                    </div>

                </main>
            </div>
        );
    }

    // ── 2. MODULE OVERVIEW PAGE VIEW (NO FEATURE SELECTED) ──────────────────────────────────
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
                        Click on any feature card below to open its dedicated full-screen specification page.
                    </p>
                </div>

                {/* Rounded Dashboard Illustration Frame */}
                {current.image && (
                    <div className="max-w-2xl sm:max-w-3xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-tr from-emerald-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-emerald-950/40 p-3 sm:p-4 border border-emerald-100 dark:border-slate-800 shadow-xl">
                        <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-inner border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                            <img 
                                src={current.image} 
                                alt={current.title}
                                className="max-h-[380px] w-auto max-w-full object-contain filter contrast-[1.02] hover:scale-[1.01] transition-transform duration-500 mx-auto" 
                            />
                        </div>
                        
                        {/* Interactive Feature Pills */}
                        {current.pills && (
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-black">
                                {current.pills.map((pill, idx) => (
                                    <span key={idx} className="px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 shadow-sm">
                                        {pill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Feature Explanation Grid - CLICKABLE CARDS */}
                <div className="space-y-4 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Key Feature Modules</span>
                            <span className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                                Click any card to open full-screen page
                            </span>
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {current.features.map((feat, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => openFeatureModal(feat, idx)}
                                className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-none hover:shadow-xl hover:border-[#FF2D55]/50 dark:hover:border-[#FF2D55]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer space-y-4 group relative overflow-hidden"
                            >
                                {/* Glow Accent on Hover */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl group-hover:opacity-100 opacity-0 transition-opacity" />

                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-[#FF2D55]/10 flex items-center justify-center text-[#FF2D55] font-black text-lg border border-red-100 dark:border-[#FF2D55]/20 group-hover:scale-110 transition-transform">
                                        {idx + 1}
                                    </div>
                                    <span className="text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Open Full Detail Page <ArrowRight size={14} />
                                    </span>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
                                        {feat.name}
                                    </h3>
                                    <p className="text-gray-500 dark:text-[#94A3B8] text-sm font-medium leading-relaxed mt-2">
                                        {feat.desc}
                                    </p>
                                </div>

                                {/* Capability Pills Preview */}
                                {feat.capabilities && (
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                                        {feat.capabilities.slice(0, 2).map((cap, cIdx) => (
                                            <span key={cIdx} className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                ✓ {cap}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
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
