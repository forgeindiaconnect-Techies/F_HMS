import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
    Receipt, Package, ShoppingCart, BarChart3, BookOpen, Users, Truck, Monitor,
    CheckCircle2, ArrowRight, Star, ChevronDown, ChevronRight, ShieldCheck, 
    Clock, Sparkles, Printer, Smartphone, Laptop, Zap, Check, HelpCircle, 
    DollarSign, Flame, Utensils, Boxes, LineChart, Building2, Store, CreditCard,
    QrCode, FileText, Split, AlertCircle, TrendingUp, Calendar, Phone, ArrowUpRight,
    ArrowDown, Plus, Minus, Trash2, Volume2, X, Copy, ExternalLink, Download, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/axiosInstance';
import WebsiteNavbar from '../../components/WebsiteNavbar';
import WebsiteFooter from '../../components/WebsiteFooter';

const POS_MODULE_CONFIGS = {
    'billing': {
        id: 'billing',
        title: 'Billing',
        headline: 'Smart Billing. Faster Checkout.',
        tagline: 'Lightning-fast POS billing, itemized split bills, automated GST tax invoices, and multi-tender digital payments.',
        badge: 'Core POS Module',
        accentColor: '#FF2D55',
        icon: Receipt,
        sandboxLabel: 'Explore Live Billing Terminal ↓',
        previewImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Avg. Bill Speed', value: '3 Seconds', sub: 'Instant print & settle' },
            { label: 'Uptime Reliability', value: '99.99%', sub: 'Never stops at rush hour' },
            { label: 'GST Compliance', value: '100%', sub: 'CGST & SGST compliant' },
            { label: 'Revenue Leakage', value: '0%', sub: 'Audit logged cashier actions' }
        ],
        heroMockup: {
            title: 'Express Bill Settlement Terminal',
            invoiceNo: 'INV-2026-8492',
            table: 'Table 04 (Dine-In)',
            items: [
                { name: 'Paneer Butter Masala', qty: 2, price: 680 },
                { name: 'Garlic Butter Naan', qty: 4, price: 240 },
                { name: 'Cold Pressed Lime Soda', qty: 2, price: 180 },
                { name: 'Gulab Jamun with Ice Cream', qty: 2, price: 220 }
            ],
            subtotal: 1320,
            tax: 66,
            total: 1386,
            paymentModes: ['Cash', 'UPI QR', 'Card', 'Split']
        },
        features: [
            {
                title: '3-Second High Speed Checkout',
                description: 'Designed specifically for rapid counter turnover. Cashiers can punch items in two taps, apply pre-configured promo codes, and print thermal KOTs in under 3 seconds.',
                points: ['Touch-optimized menu quick keys', 'Barcode and SKU scan support', 'Automatic thermal KOT dispatch to kitchen stations'],
                icon: Zap,
                bgColor: 'bg-rose-50/60',
                borderColor: 'border-rose-100'
            },
            {
                title: 'Flexible Bill Splitting & Merging',
                description: 'Cater to modern diners who split checks. Divide bills equally by guest count, split by specific dishes, or merge multiple dining tables into a single master invoice.',
                points: ['Split evenly across up to 20 guests', 'Item-by-item seat assignation', 'Merge tables across different floor zones seamlessly'],
                icon: Split,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: 'Automated 5% GST & Custom Tax Rules',
                description: 'Stay completely compliant with Indian GST tax laws and international VAT frameworks. Prints clear CGST (2.5%) and SGST (2.5%) splits with your official GSTIN number.',
                points: ['Auto-computed GST with HSN codes', 'Custom service charge toggles', 'Export ready for GSTR-1, GSTR-3B filings'],
                icon: ShieldCheck,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Multi-Tender & Dynamic QR Collections',
                description: 'Accept split tenders on a single bill—half in cash and half via UPI. Displays an instant dynamic UPI payment QR code directly on the customer-facing screen.',
                points: ['Dynamic soundbox & QR webhook sync', 'Credit & debit card terminal integration', 'Integrated change calculator prevents cashier errors'],
                icon: CreditCard,
                bgColor: 'bg-indigo-50/60',
                borderColor: 'border-indigo-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Punch Order', desc: 'Captain takes order on tablet or cashier taps quick-keys on touch POS.' },
            { step: '02', title: 'Auto KOT Print', desc: 'Order routes instantly to chef prep stations with cooking notes.' },
            { step: '03', title: 'One-Tap Settle', desc: 'Customer pays via Cash, UPI QR, or Card with automated discount.' },
            { step: '04', title: 'Tax Invoice & Cloud Sync', desc: 'Receipt prints in 3s and figures sync live to executive dashboard.' }
        ],
        benefits: [
            { title: 'Eliminate Long Billing Lines', desc: 'Zero cashier lags during Saturday night rushes ensures faster table turnover.' },
            { title: 'Stop Cash Drawer Thefts', desc: 'Manager pin required for voiding items, applying big discounts, or reprints.' },
            { title: 'Seamless Split Billing', desc: 'No more manual calculators when friends dine together and split the check.' },
            { title: 'Print Thermal Slips Offline', desc: 'Never worry about internet outages slowing down your front-desk checkout.' },
            { title: 'Daily Cash Register Audit', desc: 'Day-end tally shows physical cash vs system expected balance down to ₹1.' },
            { title: '1-Click CSV & Tally Export', desc: 'Accountants love the instant tax reports, invoice logs, and refund ledgers.' }
        ],
        faqs: [
            { q: 'Can I print bills on standard thermal printers?', a: 'Yes! RestoSys supports all standard 2-inch and 3-inch USB, Bluetooth, Ethernet, and Wi-Fi thermal printers including Epson, TVS, Rugtek, and Citizen.' },
            { q: 'Does it calculate GST automatically?', a: 'Yes. It automatically calculates 2.5% CGST and 2.5% SGST (or 5% composite tax) on all food and beverages with your restaurant GSTIN clearly printed.' },
            { q: 'Can multiple cashiers use the billing terminal simultaneously?', a: 'Yes. RestoSys supports multi-cashier shift management with individual login pins and separate cash register drawer reconciliations.' },
            { q: 'What happens if a customer wants to split payment between Cash and UPI?', a: 'Our split payment mode allows any order to be split across multiple payment tenders with individual verification receipts.' }
        ]
    },

    'inventory': {
        id: 'inventory',
        title: 'Inventory',
        headline: 'Take Control of Your Restaurant Inventory.',
        tagline: 'Track ingredients down to the gram, auto-deplete recipes on billing, cut food wastage, and receive real-time low stock reorder alerts.',
        badge: 'Stock & Recipe Control',
        accentColor: '#FF6A00',
        icon: Package,
        sandboxLabel: 'Explore Live Stock Terminal ↓',
        previewImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Food Waste Reduced', value: '28%', sub: 'Stops pilferage & spoilage' },
            { label: 'Tracking Accuracy', value: '99.8%', sub: 'Recipe-level auto deduction' },
            { label: 'Stock Outages Prevented', value: '100%', sub: 'Automated reorder triggers' },
            { label: 'Cost Savings', value: '15-20%', sub: 'Optimized bulk purchasing' }
        ],
        heroMockup: {
            title: 'Live Ingredient Stock Monitor',
            invoiceNo: 'STORE-CENTRAL-01',
            table: 'Branch: Downtown Kitchen',
            items: [
                { name: 'Fresh Paneer (Kg)', qty: 42, price: 'Stock: 42 Kg (Healthy)' },
                { name: 'Amul Dairy Butter (Kg)', qty: 18, price: 'Stock: 18 Kg (Healthy)' },
                { name: 'Mozzarella Cheese (Kg)', qty: 4, price: 'Stock: 4 Kg (Low Alert!)' },
                { name: 'Basmati Rice Premium (Kg)', qty: 120, price: 'Stock: 120 Kg (Healthy)' }
            ],
            subtotal: 184,
            tax: 0,
            total: 184,
            paymentModes: ['Auto PO', 'Indent Request', 'Transfer Stock']
        },
        features: [
            {
                title: 'Recipe-Level Ingredient Auto-Depletion',
                description: 'Every time a dish is ordered and billed, RestoSys automatically deducts the exact recipe ingredients—such as 200g chicken, 50ml cream, and 30g butter—from your live stock ledger.',
                points: ['Sub-recipe and batch production support', 'Accurate cost per plate analytics', 'Eliminates manual daily ingredient logbooks'],
                icon: Boxes,
                bgColor: 'bg-orange-50/60',
                borderColor: 'border-orange-100'
            },
            {
                title: 'Instant Low-Stock & Expiry Alerts',
                description: 'Set custom safety reorder thresholds for every raw material. Receive instant WhatsApp and dashboard notifications when critical items fall below minimum levels.',
                points: ['Real-time notifications before items run out', 'Expiry date tracking for perishables', 'Automatic emergency purchase order draft generation'],
                icon: AlertCircle,
                bgColor: 'bg-red-50/60',
                borderColor: 'border-red-100'
            },
            {
                title: 'Physical Audit vs. Book Variance',
                description: 'Conduct weekly or monthly stock audits. Compare physical count against theoretical consumption to catch kitchen pilferage, over-portioning, and spillage immediately.',
                points: ['Barcode scanner mobile audit mode', 'Variance loss report in rupees', 'Identifies high-theft items like alcohol, dairy & meat'],
                icon: LineChart,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            },
            {
                title: 'Multi-Outlet & Central Kitchen Transfers',
                description: 'Seamlessly transfer raw materials between central preparation hubs and satellite branch outlets with formal digital goods dispatch notes (GDN) and acceptance signatures.',
                points: ['Central kitchen bulk batch production', 'In-transit stock tracking', 'Automated outlet consumption billing'],
                icon: Truck,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Define Recipes', desc: 'Link menu dishes to raw ingredient quantities in grams and milliliters.' },
            { step: '02', title: 'Receive Goods', desc: 'Inward vendor deliveries with invoice prices and quality inspections.' },
            { step: '03', title: 'Auto Consumption', desc: 'Orders billed at the POS automatically deduct raw materials in real time.' },
            { step: '04', title: 'Reorder Alert', desc: 'When stock drops below threshold, auto-generate purchase orders.' }
        ],
        benefits: [
            { title: 'Eliminate Dish 86 During Rush', desc: 'Never run out of key ingredients during dinner rush on Friday or Saturday.' },
            { title: 'Protect Restaurant Profit Margins', desc: 'Gain precise visibility into food cost percentage for every single menu dish.' },
            { title: 'Detect Kitchen Theft Early', desc: 'Pinpoint exact discrepancies between theoretical food use and actual stock.' },
            { title: 'Automated Vendor Indents', desc: 'Send bulk purchase requests to preferred suppliers via email or WhatsApp in seconds.' },
            { title: 'Multi-Branch Consistency', desc: 'Standardize recipes across all branches so your butter chicken tastes identical.' },
            { title: 'Zero Food Expiry Waste', desc: 'First-in-first-out (FIFO) batch management ensures ingredients are used fresh.' }
        ],
        faqs: [
            { q: 'How does automatic recipe deduction work?', a: 'You input the master recipe once (e.g., 1 Margherita Pizza = 180g Dough + 90g Mozzarella + 40g Sauce). When the order is completed, those quantities deduct automatically.' },
            { q: 'Can I track raw materials across multiple branches?', a: 'Yes! RestoSys manages central warehouse inventory and lets you track multi-branch store indents, dispatches, and inter-branch transfers.' },
            { q: 'Does it support unit conversions (e.g., purchasing in 50Kg bags, using in grams)?', a: 'Yes. RestoSys has built-in unit conversion matrices so you purchase in bulk bags, crates, or liters and consume in grams or milliliters.' }
        ]
    },

    'online-ordering': {
        id: 'online-ordering',
        title: 'Online Ordering',
        headline: 'Make Ordering Simple for Every Customer.',
        tagline: 'Launch your 0% commission direct digital ordering website. Accept pickup, tabletop QR, and direct delivery orders seamlessly.',
        badge: 'Direct Customer Channel',
        accentColor: '#10B981',
        icon: ShoppingCart,
        sandboxLabel: 'Explore Live Digital Storefront ↓',
        previewImage: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Commission Saved', value: '100%', sub: '0% fees to 3rd-party apps' },
            { label: 'Average Order Value', value: '+24%', sub: 'Smart automatic upselling' },
            { label: 'Direct Customer Data', value: '100% Mine', sub: 'Phone, names, email access' },
            { label: 'Setup Time', value: '15 Mins', sub: 'Instant live branded link' }
        ],
        heroMockup: {
            title: 'Customer Branded Mobile Ordering',
            invoiceNo: 'ORDER-WEB-902',
            table: 'Direct Delivery to Customer',
            items: [
                { name: 'Tandoori Smoked Platter', qty: 1, price: 499 },
                { name: 'Biryani Feast Box (Combo)', qty: 2, price: 798 },
                { name: 'Mango Lassi Bottle', qty: 2, price: 160 },
                { name: 'Special Dessert Pairing', qty: 1, price: 120 }
            ],
            subtotal: 1577,
            tax: 78,
            total: 1655,
            paymentModes: ['UPI FastPay', 'Card Online', 'Cash on Delivery']
        },
        features: [
            {
                title: 'Zero Commission Direct Storefront',
                description: 'Stop giving away 25-30% of your hard-earned revenue to third-party food aggregator apps. Keep 100% of your gross margins on your own custom web storefront.',
                points: ['Custom subdomain or own domain link', 'No third-party commission deductions', 'Direct settlement into your restaurant bank account'],
                icon: DollarSign,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Smart Upselling & Modifier Combos',
                description: 'Increase your average order value automatically. System recommends popular beverage pairings, dessert add-ons, and extra toppings right before the customer checks out.',
                points: ['Custom beverage & dessert pairing prompts', 'Multi-variant customization (sizes, spice levels)', 'Order notes for chef dietary instructions'],
                icon: TrendingUp,
                bgColor: 'bg-indigo-50/60',
                borderColor: 'border-indigo-100'
            },
            {
                title: 'Live Order Tracking & Dispatch Maps',
                description: 'Delight customers with live GPS rider tracking, cooking status updates, and automated WhatsApp/SMS notifications from preparation to their doorstep.',
                points: ['Customer order tracking without app installation', 'Integrated Google Map routing for riders', 'Accurate kitchen cooking countdown timers'],
                icon: Clock,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: '100% Own Customer Data & Re-marketing',
                description: 'Unlike food delivery apps that mask phone numbers, RestoSys gives you full ownership of your customer names, mobile numbers, and ordering history for direct marketing.',
                points: ['Direct WhatsApp marketing integration', 'Custom promo codes and flash discount campaigns', 'Repeat customer loyalty cashback rewards'],
                icon: Users,
                bgColor: 'bg-rose-50/60',
                borderColor: 'border-rose-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Customer Browses', desc: 'Diners scan QR or visit your website on any phone or laptop browser.' },
            { step: '02', title: 'Customizes & Pays', desc: 'Selects dishes, adds extra toppings, and pays seamlessly via UPI or Card.' },
            { step: '03', title: 'Kitchen Prepares', desc: 'Order appears instantly on your Kitchen Display System (KDS) & POS.' },
            { step: '04', title: 'Pickup or Dispatch', desc: 'Rider picks up or customer collects with live tracking updates.' }
        ],
        benefits: [
            { title: 'Save Massive Aggregator Fees', desc: 'A restaurant doing ₹5 Lakhs monthly delivery saves over ₹1.25 Lakhs every single month.' },
            { title: 'Build Direct Brand Loyalty', desc: 'Turn casual third-party app buyers into loyal, direct repeat restaurant customers.' },
            { title: 'Complete Menu Independence', desc: 'Update prices and dishes in seconds without waiting for aggregator approvals.' },
            { title: 'Works on All Mobile Browsers', desc: 'No customer app download needed. Works directly in Safari, Chrome & WhatsApp.' },
            { title: 'Integrated Loyalty Points', desc: 'Reward repeat orders with redeemable points, driving frequency by up to 35%.' },
            { title: 'Full Delivery Fleet Control', desc: 'Assign your own delivery boys or connect with Dunzo/Shadowfax fleets.' }
        ],
        faqs: [
            { q: 'Do customers need to download a mobile app to order?', a: 'No! RestoSys Online Ordering works as a high-speed progressive web app directly in any phone browser. Customers order in seconds.' },
            { q: 'How does payment settlement work?', a: 'Payments via UPI, Credit/Debit cards, or NetBanking go directly into your verified bank account with zero middleman deductions.' },
            { q: 'Can I offer coupons and discount codes?', a: 'Yes. You can configure flat discounts, percentage off, minimum order rules, and first-time customer coupon codes.' }
        ]
    },

    'reporting': {
        id: 'reporting',
        title: 'Reporting',
        headline: 'Turn Restaurant Data into Better Decisions.',
        tagline: 'Deep executive business analytics, P&L summaries, hourly footfall heatmaps, menu engineering matrix, and automated daily audits.',
        badge: 'Executive Analytics',
        accentColor: '#3B82F6',
        icon: BarChart3,
        sandboxLabel: 'Explore Live Analytics Terminal ↓',
        previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Reports Available', value: '45+ Metrics', sub: 'Sales, taxes, items & staff' },
            { label: 'Audit Accuracy', value: '100%', sub: 'Immutable audit logs' },
            { label: 'Time Saved Daily', value: '2 Hours', sub: 'Automated closing balance' },
            { label: 'Real-Time Sync', value: '0 Sec Delay', sub: 'Live multi-branch metrics' }
        ],
        heroMockup: {
            title: 'Executive Revenue & Sales Dashboard',
            invoiceNo: 'REPORT-DAILY-SUMMARY',
            table: 'All Branches Consolidated',
            items: [
                { name: 'Total Gross Sales Today', qty: 1, price: '₹1,24,850 (+18% YoY)' },
                { name: 'Total Orders Completed', qty: 1, price: '342 Orders (AOV: ₹365)' },
                { name: 'Dine-In vs Takeaway Ratio', qty: 1, price: '64% Dine-In / 36% Takeaway' },
                { name: 'Top Seller: Butter Chicken', qty: 1, price: '86 Portions (₹34,400)' }
            ],
            subtotal: 124850,
            tax: 6242,
            total: 131092,
            paymentModes: ['UPI: 58%', 'Card: 26%', 'Cash: 16%']
        },
        features: [
            {
                title: 'Comprehensive Sales & Revenue Analytics',
                description: 'Get total clarity on your restaurant sales with breakdown by channels (Dine-In, Takeaway, Online Delivery), payment types (UPI, Cash, Card), and hour-by-hour velocity.',
                points: ['Real-time revenue graphs across all outlets', 'Average Order Value (AOV) and customer spend patterns', 'Compare sales week-on-week and month-on-month'],
                icon: TrendingUp,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            },
            {
                title: 'Menu Engineering Matrix (Stars & Dogs)',
                description: 'Discover exactly which dishes generate maximum profit and which ones are wasting kitchen space. Categorize menu items into Stars, Plowhorses, Puzzles, and Dogs.',
                points: ['Item popularity vs profitability index', 'Identify low-margin dishes hurting bottom line', 'Data-backed price increase recommendations'],
                icon: Utensils,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            },
            {
                title: 'Shift-End Register & Cash Audit',
                description: 'Close your daily cash drawer with total peace of mind. Compare expected cash from settled bills against actual physical currency denominations counted by cashiers.',
                points: ['Cash drawer denomination calculator', 'Records every cash deposit and withdrawal', 'Instant variance notification if money is missing'],
                icon: ShieldCheck,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Automated Nightly Executive Email & WhatsApp',
                description: 'Never chase managers for closing numbers. RestoSys automatically sends a clean, encrypted executive summary to the owner’s WhatsApp and email at closing time.',
                points: ['Nightly automated closing statement', 'Total revenue, gross profit, and refunds list', 'Multi-outlet consolidated owner view'],
                icon: Phone,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Data Aggregation', desc: 'Every order, bill, refund, and stock transfer logs into secure cloud database.' },
            { step: '02', title: 'Visual Processing', desc: 'Charts, heatmaps, and financial statements compute automatically.' },
            { step: '03', title: 'Deep Insights', desc: 'Filter by date range, staff member, branch location, or dish category.' },
            { step: '04', title: 'Automated Export', desc: 'Download CSV, Excel, or PDF reports for tax filings and accounting.' }
        ],
        benefits: [
            { title: 'Never Wonder Where Money Went', desc: 'Full transparency over revenue, discounts given, refunds, and cashier drawers.' },
            { title: 'Spot Slow Hours and React', desc: 'Use footfall data to launch happy hours or special combos during slow weekdays.' },
            { title: 'Reward Top Performing Staff', desc: 'Track sales generated per waiter and table turnaround speed accurately.' },
            { title: 'Tax Filing in 1 Click', desc: 'Generate complete GSTR reports with tax breakdowns ready for your CA.' },
            { title: 'Multi-Branch Overview on Phone', desc: 'Monitor all restaurant branches simultaneously from your smartphone anywhere.' },
            { title: 'Eliminate Discrepancies', desc: 'Immutable audit logs record every bill edit, discount, and cashier void.' }
        ],
        faqs: [
            { q: 'Can I export reports to Excel or Tally?', a: 'Yes! All sales, inventory, tax, and billing reports can be exported to Excel, CSV, or PDF with one click.' },
            { q: 'Can I view reports from my phone when I am travelling?', a: 'Absolutely. RestoSys reporting works on any mobile browser or tablet so owners have real-time visibility from anywhere in the world.' },
            { q: 'Are cancelled orders and discounts tracked?', a: 'Yes. Every discount, voided bill, and cancelled KOT is logged with the responsible staff member ID and reason.' }
        ]
    },

    'menu': {
        id: 'menu',
        title: 'Menu',
        headline: 'Your Menu. Your Rules. Complete Control.',
        tagline: 'Manage multi-category catalogs, food variants, dish modifiers, dietary labels, and instant 1-click item 86 out-of-stock toggles.',
        badge: 'Catalog & Modifiers',
        accentColor: '#EC4899',
        icon: BookOpen,
        sandboxLabel: 'Explore Live Menu Studio ↓',
        previewImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Instant 86 Sync', value: '1 Click', sub: 'Across POS, QR & Online' },
            { label: 'Catalog Capacity', value: 'Unlimited', sub: 'Categories, items & variants' },
            { label: 'Time Saved', value: '80%', sub: 'No reprinting paper menus' },
            { label: 'Custom Modifiers', value: '100+ Combos', sub: 'Sizes, crusts & add-ons' }
        ],
        heroMockup: {
            title: 'Dynamic Digital Menu Builder',
            invoiceNo: 'MENU-CATALOG-ACTIVE',
            table: 'Categories: Starters, Mains, Combos',
            items: [
                { name: 'Gourmet Truffle Burger (Variant: Double)', qty: 1, price: '₹420 (Live)' },
                { name: 'Wood-Fired Margherita Pizza', qty: 1, price: '₹380 (Live)' },
                { name: 'Peri Peri Crispy Wings (6 Pcs)', qty: 1, price: '₹290 (Live)' },
                { name: 'Avocado Salad Bowl (Dietary: Vegan)', qty: 1, price: '₹340 (Live)' }
            ],
            subtotal: 1430,
            tax: 71,
            total: 1501,
            paymentModes: ['Tags: Chef Special', 'Spicy: Medium', 'Veg: 100%']
        },
        features: [
            {
                title: 'Instant 1-Click 86 Out-of-Stock Toggle',
                description: 'Ran out of avocados or paneer? Toggle the item off in your POS with a single tap, and it instantly vanishes from digital QR menus and online ordering, preventing angry guests.',
                points: ['Real-time synchronization across all order channels', 'Prevents waiters from taking orders for unavailable dishes', 'Auto-restores stock when inventory replenishes'],
                icon: Zap,
                bgColor: 'bg-pink-50/60',
                borderColor: 'border-pink-100'
            },
            {
                title: 'Custom Modifier & Add-on Groups',
                description: 'Build flexible choices for every dish. Offer beverage sizes, pizza crust options, spice levels, egg choices, and extra cheese toppings with custom pricing for each add-on.',
                points: ['Mandatory and optional modifier rules', 'Custom add-on pricing (e.g., +₹60 Extra Cheese)', 'Preparation instructions for chef stations'],
                icon: Sparkles,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            },
            {
                title: 'Time-Based Dynamic Menus',
                description: 'Run morning breakfast menus from 7 AM to 11 AM, switch automatically to lunch buffets, and activate happy hours or late-night dessert menus without lifting a finger.',
                points: ['Automated time and day schedules', 'Weekend special dish scheduling', 'Happy hour pricing rules by hour'],
                icon: Clock,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: 'High-Res Photos, Allergens & Dietary Tags',
                description: 'Showcase dishes with appetite-inducing high-definition food photography, dietary badges (Pure Veg, Non-Veg, Egg, Vegan, Gluten-Free), and spice index ratings.',
                points: ['Rich visual menu cards that increase sales', 'Mandatory allergen disclosures for customer safety', 'Detailed calorie and nutritional highlights'],
                icon: CheckCircle2,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Create Categories', desc: 'Organize your dishes into appetizers, main course, beverages, and desserts.' },
            { step: '02', title: 'Add Modifiers', desc: 'Attach customization options like spice levels, sizes, and paid toppings.' },
            { step: '03', title: 'Set Prices & Taxes', desc: 'Specify base rates and auto-link standard 5% restaurant GST.' },
            { step: '04', title: 'Publish Live', desc: 'Updates propagate instantly to all staff POS terminals and customer QR codes.' }
        ],
        benefits: [
            { title: 'Zero Menu Reprinting Costs', desc: 'Never spend thousands of rupees on expensive laminated menu reprints for small price changes.' },
            { title: 'Drive Average Order Value', desc: 'Appealing food photos and smart modifier prompts boost spending by up to 22%.' },
            { title: 'Cater to Dietary Conscious Diners', desc: 'Clear vegan, gluten-free, and nut allergy tags build deep diner trust.' },
            { title: 'Multi-Branch Price Adjustments', desc: 'Set different pricing for high-rent airport branches vs street outlets easily.' },
            { title: 'Fast Captain Order Taking', desc: 'Well-structured category layouts allow captains to find dishes in seconds.' },
            { title: 'Automatic Inventory Integration', desc: 'Every menu dish links directly to its underlying ingredient recipe.' }
        ],
        faqs: [
            { q: 'How quickly do menu updates show up on customer phones?', a: 'Instantly! As soon as you click Save in the admin menu editor, all digital QR menus and online ordering links update in real-time.' },
            { q: 'Can I set different menu prices for different branches?', a: 'Yes. RestoSys allows central multi-branch menu management with location-specific price overrides and tax adjustments.' },
            { q: 'Can I upload photos for each dish?', a: 'Yes! You can upload high-resolution photos for each item to make your digital menu visually irresistible.' }
        ]
    },

    'crm': {
        id: 'crm',
        title: 'CRM',
        headline: 'Build Stronger Customer Relationships.',
        tagline: 'Capture guest preferences, visit history, average order spends, automated loyalty points, and run targeted WhatsApp promotions.',
        badge: 'Customer Retention',
        accentColor: '#8B5CF6',
        icon: Users,
        sandboxLabel: 'Explore Live Customer CRM ↓',
        previewImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Repeat Visits', value: '+35%', sub: 'Loyalty & targeted campaigns' },
            { label: 'Customer Profiles', value: 'Automatic', sub: 'Captured on billing & QR' },
            { label: 'WhatsApp Open Rate', value: '98%', sub: 'Direct personalized offers' },
            { label: 'Customer LTV', value: '+28%', sub: 'Higher lifetime spending' }
        ],
        heroMockup: {
            title: 'Guest Profile & Loyalty Wallet',
            invoiceNo: 'CRM-VIP-GUEST-019',
            table: 'Guest: Rajesh Mehta (VIP Gold)',
            items: [
                { name: 'Total Lifetime Visits', qty: 18, price: '18 Visits (Frequent)' },
                { name: 'Total Lifetime Spend', qty: 1, price: '₹42,850 (Top 5% Spender)' },
                { name: 'Active Loyalty Wallet Balance', qty: 1, price: '₹1,240 Redeemable' },
                { name: 'Favorite Dish', qty: 1, price: 'Dal Makhani & Butter Naan' }
            ],
            subtotal: 42850,
            tax: 0,
            total: 42850,
            paymentModes: ['Tag: Anniversary Dec 14', 'Preference: Corner Table', 'Phone: +91 98200-XXXXX']
        },
        features: [
            {
                title: 'Automated Guest Profile Capture',
                description: 'Collect customer mobile numbers, names, and birthdays effortlessly during billing, Wi-Fi logins, reservation bookings, or digital tabletop QR orders without friction.',
                points: ['Automatic profile creation on checkout', 'Tracks visit count, total spent, and average bill size', 'Compliant with privacy and communication laws'],
                icon: Users,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            },
            {
                title: 'Tiered Loyalty Points & Digital Wallet',
                description: 'Turn one-time diners into passionate brand advocates. Reward every rupee spent with digital loyalty points that guests can redeem on future dine-in visits.',
                points: ['Silver, Gold, and Platinum VIP tier levels', 'Instant SMS confirmation of points earned', 'Redeem points directly on POS bill settlement'],
                icon: Star,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: 'Targeted WhatsApp & SMS Campaigns',
                description: 'Stop wasting money on generic broad marketing. Filter guests who haven’t visited in 45 days, or guests celebrating birthdays this week, and send tailored offers.',
                points: ['Automated birthday and anniversary greetings', 'Win-back campaigns for lapsed diners', 'High-converting 98% open rate on WhatsApp'],
                icon: Phone,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Guest Feedback & Negative Review Interception',
                description: 'Gather instant digital feedback on service, food taste, and ambiance right after billing. Intercept dissatisfied customers and resolve issues before they post negative Google reviews.',
                points: ['Digital 5-star ratings on bill slip or SMS', 'Alerts manager instantly if rating is below 3 stars', 'Directs happy 5-star diners to post on Google Maps'],
                icon: ShieldCheck,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Capture Number', desc: 'Cashier enters guest mobile number or guest inputs it on digital QR order.' },
            { step: '02', title: 'Track Spends', desc: 'Every bill amount and favorite dish logs automatically under their profile.' },
            { step: '03', title: 'Award Points', desc: 'Customer receives instant WhatsApp confirmation of reward points earned.' },
            { step: '04', title: 'Re-engage', desc: 'Automated promotions bring the guest back for birthdays and weekend dinners.' }
        ],
        benefits: [
            { title: 'Build Your Own Proprietary Database', desc: 'Own your customer relationships instead of relying on third-party aggregators.' },
            { title: 'Personalize Dining Experiences', desc: 'Waiters can greet guests by name and remember their corner table preferences.' },
            { title: 'Drive Predictable Weekday Footfall', desc: 'Send Tuesday dinner discounts exclusively to nearby regular diners.' },
            { title: 'Recover Lapsed Customers', desc: 'Automatically remind guests who loved your restaurant 2 months ago to return.' },
            { title: 'Protect Google Review Ratings', desc: 'Solve service hiccups privately before they turn into public 1-star reviews.' },
            { title: 'Reward High-Spending VIPs', desc: 'Identify top 10% spenders and treat them to complimentary chef desserts.' }
        ],
        faqs: [
            { q: 'How does the loyalty program work for diners?', a: 'Customers earn points automatically whenever their phone number is entered on a bill. They can redeem points on future visits directly at checkout.' },
            { q: 'Can I send promotional messages via WhatsApp?', a: 'Yes! RestoSys integrates with verified WhatsApp Business APIs to send personalized messages with high open rates.' },
            { q: 'Is customer data kept private and secure?', a: 'Yes. Your customer data belongs 100% to your restaurant brand and is encrypted with strict security controls.' }
        ]
    },

    'purchase-manager': {
        id: 'purchase-manager',
        title: 'Purchase Manager',
        headline: 'Make Restaurant Purchasing Easier.',
        tagline: 'Automate vendor purchase orders, track contract supply rates, verify incoming goods against invoices, and control food procurement costs.',
        badge: 'Procurement & Vendors',
        accentColor: '#0284C7',
        icon: Truck,
        sandboxLabel: 'Explore Live Procurement Desk ↓',
        previewImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Procurement Time Saved', value: '75%', sub: 'Automated 1-click PO creation' },
            { label: 'Invoice Overbilling Stopped', value: '100%', sub: 'PO vs GRN matching' },
            { label: 'Vendor Directory', value: 'Unlimited', sub: 'Suppliers, items & prices' },
            { label: 'Margin Protection', value: '+8-12%', sub: 'Strict rate contract checks' }
        ],
        heroMockup: {
            title: 'Vendor Procurement & PO Ledger',
            invoiceNo: 'PO-2026-SUPPLY-418',
            table: 'Vendor: Fresh Farms Wholesale Dairy',
            items: [
                { name: 'Fresh Paneer Blocks (Grade A)', qty: 50, price: '50 Kg @ ₹280 = ₹14,000' },
                { name: 'Cow Milk Full Cream (Litres)', qty: 100, price: '100 L @ ₹58 = ₹5,800' },
                { name: 'Dairy Cooking Ghee (15 Kg Tin)', qty: 2, price: '2 Tins @ ₹8,500 = ₹17,000' },
                { name: 'Heavy Whipping Cream', qty: 20, price: '20 Packs @ ₹160 = ₹3,200' }
            ],
            subtotal: 40000,
            tax: 2000,
            total: 42000,
            paymentModes: ['Status: Approved PO', 'Delivery: Today 08:00 AM', 'Terms: Net 15 Days']
        },
        features: [
            {
                title: '1-Click Automated Purchase Orders',
                description: 'Never write purchase orders by hand. When inventory drops below minimum safety stock, RestoSys automatically drafts ready-to-send POs for your designated suppliers.',
                points: ['Auto-generates POs based on par levels and consumption', 'Pre-fills vendor contact info and agreed rates', 'Send directly via PDF email or WhatsApp in seconds'],
                icon: FileText,
                bgColor: 'bg-sky-50/60',
                borderColor: 'border-sky-100'
            },
            {
                title: 'Goods Received Note (GRN) Verification',
                description: 'Stop paying for goods that never arrived. Compare incoming delivery challans against original purchase orders to catch short deliveries, damaged goods, and price markups.',
                points: ['Item weight and quantity verification at kitchen door', 'Automatic credit note generation for returned items', 'Updates inventory ledger automatically upon GRN approval'],
                icon: CheckCircle2,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Vendor Rate Contract Enforcement',
                description: 'Lock in negotiated supplier prices for meat, vegetables, dairy, and packaging. RestoSys alerts managers if a vendor tries to invoice above the agreed contract price.',
                points: ['Contract price caps prevent price creep', 'Rate history comparison across different suppliers', 'Multiple vendor bids comparison for big procurements'],
                icon: DollarSign,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: 'Supplier Payables & Due Date Reminders',
                description: 'Keep vendor relationships strong while managing cash flow. Track pending supplier invoices, payment terms (Net 7, Net 15, Net 30), and credit limits in one place.',
                points: ['Real-time outstanding balances ledger', 'Automated due date alerts before credit locks', 'Export ready for accounting reconciliation'],
                icon: Clock,
                bgColor: 'bg-indigo-50/60',
                borderColor: 'border-indigo-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Stock Drops', desc: 'Inventory system detects item has fallen below minimum reorder par level.' },
            { step: '02', title: 'Generate PO', desc: 'Manager approves auto-generated purchase order with negotiated supplier rate.' },
            { step: '03', title: 'Receive & Inspect', desc: 'Kitchen receiving staff verifies weight and quality, generating digital GRN.' },
            { step: '04', title: 'Auto Stock Update', desc: 'Inventory increases instantly and payable invoice logs for finance team.' }
        ],
        benefits: [
            { title: 'Eliminate Overbilling & Cheating', desc: 'Catch price discrepancies between promised quotes and final delivery bills.' },
            { title: 'Standardize Raw Material Quality', desc: 'Enforce quality inspection gates before accepting ingredients into the store.' },
            { title: 'Never Forget What You Owe Suppliers', desc: 'Maintain clear vendor accounts to avoid abrupt delivery freezes from suppliers.' },
            { title: 'Multi-Branch Bulk Buying Power', desc: 'Pool procurement needs across branches to negotiate 10-15% lower wholesale rates.' },
            { title: 'Audit Trail for Every Delivery', desc: 'Know exactly which staff member accepted, weighed, and approved each delivery.' },
            { title: 'Paperless Purchasing Workflow', desc: 'Replace messy carbon-copy paper receipt pads with clean digital records.' }
        ],
        faqs: [
            { q: 'Can I manage multiple vendors for the same ingredient?', a: 'Yes! You can maintain primary and backup suppliers for every item (e.g., Dairy Vendor A vs Vendor B) with their respective pricing.' },
            { q: 'How does it prevent supplier overbilling?', a: 'When receiving goods, the system compares the invoice rate against the pre-approved purchase order rate and flags any price difference.' },
            { q: 'Can chefs create indent requests from the kitchen?', a: 'Yes. Kitchen chefs can raise indent requests for needed ingredients, which managers can approve into formal purchase orders.' }
        ]
    },

    'offline-pos': {
        id: 'offline-pos',
        title: 'Offline POS',
        headline: 'Keep Billing Moving, Even Offline.',
        tagline: 'Never let internet outages shut down your restaurant. RestoSys POS processes bills, prints thermal KOTs, and saves settlements locally, syncing automatically once reconnected.',
        badge: 'Zero-Downtime Guarantee',
        accentColor: '#6366F1',
        icon: Monitor,
        sandboxLabel: 'Explore Live Offline Terminal ↓',
        previewImage: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Offline Resilience', value: '100% Native', sub: 'Zero downtime during outages' },
            { label: 'Local KOT Print', value: '100% LAN Works', sub: 'Direct printer communication' },
            { label: 'Data Recovery', value: '100% Safe', sub: 'Auto cloud reconciliation' },
            { label: 'Cash Drawer Sync', value: 'Seamless', sub: 'Preserves sequential numbering' }
        ],
        heroMockup: {
            title: 'Offline Resilient Cashier Terminal',
            invoiceNo: 'OFFLINE-BILL-3012',
            table: 'Status: Internet Disconnected (Active Offline Mode)',
            items: [
                { name: 'Crispy Falafel Pita Pocket', qty: 2, price: 360 },
                { name: 'Hummus & Warm Pita Platter', qty: 1, price: 280 },
                { name: 'Mint Lemon Cooler Jar', qty: 2, price: 220 },
                { name: 'Turkish Baklava (4 Pcs)', qty: 1, price: 240 }
            ],
            subtotal: 1100,
            tax: 55,
            total: 1155,
            paymentModes: ['Local Storage Active', 'LAN KOT Printed', 'Auto Sync on Reconnect']
        },
        features: [
            {
                title: 'Uninterrupted Local Billing & Settlements',
                description: 'When your Wi-Fi or broadband drops, RestoSys automatically switches to local offline mode without showing a loading spinner. Cashiers continue punching orders and billing customers as normal.',
                points: ['Zero lag or freezes when internet goes down', 'Punch orders, split bills, and tender payments locally', 'High-speed local IndexedDB caching technology'],
                icon: Zap,
                bgColor: 'bg-indigo-50/60',
                borderColor: 'border-indigo-100'
            },
            {
                title: 'LAN-Based Kitchen KOT Printing',
                description: 'Kitchen printers keep working! RestoSys communicates directly over your local area network (LAN) or Bluetooth to dispatch KOTs to kitchen prep stations without routing through external servers.',
                points: ['Direct hardware socket communication', 'KOTs print immediately at cook stations', 'Prevents food prep delays during internet blackouts'],
                icon: Printer,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Automatic Silent Cloud Synchronization',
                description: 'The moment internet connectivity restores, RestoSys silently synchronizes all offline invoices, inventory deductions, and payments back to the central cloud database without duplicating bill numbers.',
                points: ['Zero data collisions or duplicated bill numbers', 'Background sync requires zero manual intervention', 'Cloud executive dashboard reflects accurate end-of-day sales'],
                icon: ShieldCheck,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            },
            {
                title: 'Cross-Device Local Compatibility',
                description: 'Runs resiliently across Windows desktop computers, touch-screen all-in-one POS terminals, Android tablets, iPads, and mobile waiter handheld devices without heavy server infrastructure.',
                points: ['Lightweight hardware footprint', 'Supports USB, Wi-Fi, Ethernet, and Bluetooth printers', 'Encrypted local storage protects transaction integrity'],
                icon: Laptop,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Internet Cuts Out', desc: 'POS detects connection drop and instantly shifts to local high-speed memory.' },
            { step: '02', title: 'Punch & Print', desc: 'Cashier bills customers and prints receipts & kitchen KOTs via local network.' },
            { step: '03', title: 'Internet Returns', desc: 'System reconnects and syncs all transactions quietly in the background.' },
            { step: '04', title: 'Audit Verified', desc: 'All inventory deductions and revenue metrics match cloud records with 100% parity.' }
        ],
        benefits: [
            { title: 'Zero Lost Sales During Rush Hours', desc: 'Never tell a restaurant full of hungry customers that your billing system is down.' },
            { title: 'Kitchen Never Stops Cooking', desc: 'Kitchen prep lines continue receiving orders seamlessly over local network.' },
            { title: 'No Pricey On-Premises Server Needed', desc: 'Get the safety of on-premise software with the convenience of modern cloud POS.' },
            { title: 'Strict Sequential Bill Numbers', desc: 'Maintains tax audit integrity by preventing gaps or conflicts in invoice numbering.' },
            { title: 'Eliminate Cashier Frustration', desc: 'Cashiers never have to stare at spinning wheel loading screens during checkout.' },
            { title: 'Peace of Mind for Owners', desc: 'Sleep easy knowing unstable local broadband will never paralyze your restaurant operations.' }
        ],
        faqs: [
            { q: 'How many bills can I generate while offline?', a: 'You can generate thousands of bills offline! The local browser and terminal cache can store days worth of transactions before syncing.' },
            { q: 'Will my kitchen printers still work without the internet?', a: 'Yes! Kitchen printers connected via LAN Ethernet, Wi-Fi, or Bluetooth communicate directly on your local network without needing the internet.' },
            { q: 'Do I need to press any button to sync when the internet returns?', a: 'No. The system automatically detects when your internet connection is back and syncs all transactions quietly in the background.' }
        ]
    }
};

const QUICK_ADD_ITEMS = [
    { name: 'Garlic Butter Naan', price: 60 },
    { name: 'Fresh Lime Soda', price: 90 },
    { name: 'Cold Coffee Frappe', price: 140 },
    { name: 'Gulab Jamun (2 Pcs)', price: 110 }
];

const PosModuleLandingPage = ({ module: moduleProp }) => {
    const { moduleSlug } = useParams();
    const navigate = useNavigate();
    const activeKey = (moduleProp || moduleSlug || 'billing').toLowerCase();
    const config = POS_MODULE_CONFIGS[activeKey] || POS_MODULE_CONFIGS['billing'];

    // Interactive Demo Sandbox state
    const [simulatedItems, setSimulatedItems] = useState(config.heroMockup?.items || []);
    const [selectedPaymentMode, setSelectedPaymentMode] = useState('UPI QR');
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [soundboxNotification, setSoundboxNotification] = useState(false);
    const [cashTendered, setCashTendered] = useState(2000);
    const [splitGuests, setSplitGuests] = useState(2);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [whatsAppModalContent, setWhatsAppModalContent] = useState({
        title: '',
        recipient: '',
        message: ''
    });

    // Sync simulated items when switching module
    useEffect(() => {
        if (config.heroMockup?.items) {
            setSimulatedItems(config.heroMockup.items);
        }
        setSoundboxNotification(false);
        setSelectedPaymentMode('UPI QR');
    }, [activeKey]);

    const isBilling = activeKey === 'billing' || activeKey === 'offline-pos';

    const currentSubtotal = isBilling
        ? simulatedItems.reduce((acc, it) => acc + ((typeof it.price === 'number' ? it.price : 0) * (it.qty || 1)), 0)
        : (config.heroMockup?.subtotal || 0);
    const currentTax = isBilling ? Math.round(currentSubtotal * 0.05) : (config.heroMockup?.tax || 0);
    const currentGrandTotal = isBilling ? (currentSubtotal + currentTax) : (config.heroMockup?.total || 0);

    const handleQuickAdd = (dish) => {
        setSimulatedItems(prev => {
            const idx = prev.findIndex(p => p.name === dish.name);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], qty: (next[idx].qty || 1) + 1 };
                return next;
            }
            return [...prev, { name: dish.name, qty: 1, price: dish.price }];
        });
        toast.success(`Added ${dish.name} (₹${dish.price}) to live terminal bill!`, { duration: 1500 });
    };

    const handleUpdateQty = (idx, delta) => {
        setSimulatedItems(prev => {
            const next = [...prev];
            const currentQty = next[idx].qty || 1;
            if (currentQty + delta <= 0) {
                return next.filter((_, i) => i !== idx);
            }
            next[idx] = { ...next[idx], qty: currentQty + delta };
            return next;
        });
    };

    const handleRemoveItem = (idx) => {
        setSimulatedItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleResetDemo = () => {
        setSimulatedItems(config.heroMockup?.items || []);
        setSoundboxNotification(false);
        toast('Demo bill reset to default!', { icon: '🔄' });
    };

    // Export Executive P&L Report in real CSV/Excel format
    const handleExportExcelReport = () => {
        const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const dateStamp = new Date().toISOString().slice(0, 10);
        const csvContent = [
            ["RestoSys Cloud POS - Executive Daily P&L & GST Sales Audit Statement"],
            ["Generated Date", todayStr],
            ["Branch", "Downtown Gourmet Bistro (Store #102)"],
            ["GSTIN", "07AAAAA0000A1Z5"],
            ["Audit Status", "Reconciled & Certified for CA Filing"],
            [],
            ["1. REVENUE HEAD SUMMARY", "AMOUNT (INR)", "% REVENUE SHARE"],
            ["Gross Dine-In Sales", "72480.00", "58.0%"],
            ["Online Delivery (Swiggy / Zomato)", "32461.00", "26.0%"],
            ["Takeaway & Direct Counter Sales", "19976.00", "16.0%"],
            ["TOTAL GROSS REVENUE", "124917.00", "100.0%"],
            [],
            ["2. TAX & SETTLEMENT LEDGER", "AMOUNT (INR)", "TAX RATE"],
            ["Central GST (CGST)", "3122.92", "2.5%"],
            ["State GST (SGST)", "3122.92", "2.5%"],
            ["Total GST Collected", "6245.85", "5.0%"],
            ["Customer Loyalty & Promo Discounts", "-4210.00", "3.4%"],
            ["NET SETTLED REVENUE", "114461.15", "-"],
            [],
            ["3. OPERATIONAL KEY PERFORMANCE METRICS", "VALUE", "INDUSTRY BENCHMARK"],
            ["Total Dining Covers / Bills", "342 Orders", "Healthy Turnover"],
            ["Average Order Value (AOV)", "₹365.00", "+14% vs Regional Avg"],
            ["Cost of Goods Sold (CoGS)", "31.6%", "Optimal (< 33%)"],
            ["Gross Contribution Margin", "68.4%", "Industry Leading"],
            ["Peak Sales Window", "₹24800 (08:00 PM - 10:00 PM)", "Peak Capacity"],
            ["Average Table Turn Time", "42 minutes", "Rapid Floor Velocity"],
            [],
            ["4. TOP 5 DISHES BY REVENUE CONTRIBUTION", "QTY SOLD", "REVENUE (INR)", "CONTRIBUTION"],
            ["Paneer Butter Masala", "78", "27300.00", "21.8%"],
            ["Garlic Butter Naan", "164", "11480.00", "9.2%"],
            ["Tandoori Chicken Platter", "42", "16800.00", "13.4%"],
            ["Virgin Mojito Coolers", "89", "14240.00", "11.4%"],
            ["Hyderabadi Dum Biryani", "55", "19250.00", "15.4%"],
            [],
            ["RestoSys POS v3.4.1 - Confidential Restaurant Owner Report", "Automated Daily End-of-Day Ledger", "Hash: RST-99482-EXEC"]
        ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `RestoSys_Executive_PnL_Report_${dateStamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Executive P&L Excel Report (.csv) downloaded successfully!');
    };

    // Open simulated executive WhatsApp modal
    const handleOpenWhatsAppSummary = (type = 'reporting') => {
        const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        if (type === 'reporting') {
            const msg = 
`📊 *RESTOSYS DAILY EXECUTIVE CLOSING SUMMARY*
🗓️ Date: ${todayStr}
📍 Store: Downtown Gourmet Bistro #102

💰 *FINANCIAL SNAPSHOT*
• Gross Revenue: *₹1,24,917*
• Net Bank Settlement: *₹1,14,461*
• GST Collected (5%): *₹6,245.85*
• Discounts Given: *₹4,210* (3.4%)

🍽️ *CHANNEL BREAKDOWN*
• Dine-In (58%): ₹72,480 (198 orders)
• Swiggy / Zomato (26%): ₹32,461 (94 orders)
• Takeaway Counter (16%): ₹19,976 (50 orders)
• Total Orders: *342 Orders* | AOV: *₹365*

⚡ *KEY AUDIT & SPEED*
• Peak Rush: ₹24,800/hr (8-10 PM)
• Avg Table Turn: 42 mins
• Food Cost (CoGS): 31.6% (Under Budget)
• Cash Drawer Balance: ₹19,976 (Zero Discrepancy)

✅ *AUDIT STATUS*: All 6 KOTs settled. Cash drawer reconciled. Staff shift closed.

_Generated automatically by RestoSys Cloud POS at 11:45 PM_`;

            setWhatsAppModalContent({
                title: 'Nightly Executive Closing Summary',
                recipient: 'Owner WhatsApp: +91 98765 43210',
                message: msg
            });
            setShowWhatsAppModal(true);
        } else if (type === 'crm') {
            const msg =
`🎉 *EXCLUSIVE ANNIVERSARY INVITATION* 🍾
Dear *Amit Sharma*,

Happy 3rd Anniversary from the team at *Downtown Gourmet Bistro*! 🥂

As a valued *VIP Gold Diner* (1,240 RestoSys Coins earned), we would love to celebrate your special milestone with you:
🎁 Enjoy a *Complimentary Dessert Platter + 20% Off* on your dinner reservation this week!

Use Code: *VIPCELEBRATE*
Reserve your preferred table here: https://restosys.app/r/bistro-gold

Looking forward to hosting you and your family! ✨`;

            setWhatsAppModalContent({
                title: 'Automated CRM WhatsApp Campaign',
                recipient: 'VIP Guest: Amit Sharma (+91 98110 54321)',
                message: msg
            });
            setShowWhatsAppModal(true);
        } else if (type === 'purchase-manager') {
            const msg =
`📦 *RESTOSYS PURCHASE ORDER #PO-2026-418*
To: *Fresh Farms Wholesale Suppliers*
From: Downtown Gourmet Bistro Store #102
GSTIN: 07AAAAA0000A1Z5

Dear Vendor, please deliver the following pre-approved stock:
1. Dairy Mozzarella Cheese (Block) - 10 Kg @ ₹340/kg = ₹3,400
2. Farm Fresh Cottage Cheese (Paneer) - 15 Kg @ ₹280/kg = ₹4,200
3. Amul Salted Butter (500g) - 20 Packs @ ₹245/ea = ₹4,900
4. Cooking Fresh Cream (1L) - 12 Tetra @ ₹190/ea = ₹2,280

Total PO Value: *₹14,780* (Net 15 Days Payment Terms)
Required Delivery Slot: Tomorrow by 09:30 AM (Kitchen Receiving Gate 2)

Kindly confirm delivery acknowledgement.`;

            setWhatsAppModalContent({
                title: 'Digital Vendor Purchase Order Dispatch',
                recipient: 'Vendor: Fresh Farms Wholesale (+91 98200 11223)',
                message: msg
            });
            setShowWhatsAppModal(true);
        }
    };

    const handleCopyWhatsAppMessage = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(whatsAppModalContent.message);
            toast.success('WhatsApp summary message copied to clipboard!');
        }
    };

    const handleShareOnWhatsApp = () => {
        const encoded = encodeURIComponent(whatsAppModalContent.message);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    };

    // Auto Reorder Indent generator for inventory module
    const handleAutoReorderIndent = () => {
        const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const indentContent = 
`=======================================================
 RESTOSYS AUTOMATED PURCHASE REORDER INDENT
 Generated by AI Inventory Forecasting Module
=======================================================
Purchase Order No: PO-941
Date: ${todayStr}
Supplier: Heritage Dairy Wholesale Co-op (Vendor ID: SUP-042)
Status: AUTO-APPROVED (Safety Buffer Threshold Reached)

LOW STOCK TRIGGER:
- Item: Fresh Mozzarella Cheese Block (Grade A)
- Current Kitchen Stock: 4.00 Kg
- Configured Safety Minimum: 10.00 Kg
- Lead Time: 12 Hours
- Recommended Indent Quantity: 15.00 Kg

ITEMIZED PURCHASE SPECIFICATION:
Item Code   Item Name                     Quantity   Unit Rate     Estimated Total
----------------------------------------------------------------------------------
ING-082     Fresh Mozzarella Cheese        15 Kg     ₹340.00/Kg     ₹5,100.00
ING-091     Unsalted Culinary Butter       10 Kg     ₹460.00/Kg     ₹4,600.00
ING-104     Heavy Whipping Cream 35%       12 Liters ₹210.00/L      ₹2,520.00
----------------------------------------------------------------------------------
Subtotal:                                                           ₹12,220.00
Tax Head (GST 5%):                                                  ₹611.00
Estimated Total Value:                                              ₹12,831.00

DELIVERY INSTRUCTIONS:
Delivery Gate: Receiving Bay 1 (Walk-in Cold Storage)
Temperature Control Requirement: Maintain < 4°C at delivery
Expected Arrival: Tomorrow 08:30 AM

Authorized by: RestoSys Intelligent Stock Engine
Digital Verification Hash: SHA-IND-9418-DAIRY
=======================================================`;

        const blob = new Blob([indentContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'RestoSys_Purchase_Indent_PO-941.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Generated & downloaded Auto-Reorder Indent PO-941!');
    };

    // Lead capture form state
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        restaurantName: '',
        city: '',
        outletType: 'Dine-In Restaurant'
    });
    const [submitting, setSubmitting] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(0);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.phoneNumber || !formData.restaurantName) {
            toast.error('Please fill in your name, phone number, and restaurant name.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post('/billing-demos', {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                restaurantName: formData.restaurantName,
                city: formData.city,
                outletFormat: formData.outletType
            });
            if (res.data?.duplicate) {
                toast(res.data.message, { icon: 'ℹ️', duration: 5000 });
            } else {
                toast.success(res.data?.message || `Thank you, ${formData.fullName}! Your free walkthrough request is booked.`);
            }
            setFormData({
                fullName: '',
                phoneNumber: '',
                restaurantName: '',
                city: '',
                outletType: 'Dine-In Restaurant'
            });
        } catch (err) {
            console.error('Billing demo submission error:', err);
            toast.error(err.response?.data?.message || 'Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const scrollToForm = () => {
        const formEl = document.getElementById('demo-request-form');
        if (formEl) {
            formEl.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#FFF1F1] selection:text-[#FF2D55] transition-colors">
            {/* Top Navigation Bar with POS Dropdown */}
            <WebsiteNavbar />

            <main className="pt-20 sm:pt-24 overflow-x-hidden">
                
                {/* ========================================================================= */}
                {/* 1. HERO SECTION (Clean SaaS, Headline, Supporting Copy, Dual CTA) */}
                {/* ========================================================================= */}
                <section className="relative px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24 max-w-7xl mx-auto">
                    {/* Background Subtle Ambient Glow */}
                    <div 
                        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-rose-100/50 via-orange-50/30 to-transparent blur-3xl pointer-events-none -z-10" 
                    />

                    <div className="text-center max-w-4xl mx-auto space-y-6">
                        {/* Module Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF1F1] border border-rose-200/80 text-[#FF2D55] font-black text-xs uppercase tracking-wider shadow-xs animate-in fade-in duration-300">
                            <config.icon size={15} className="shrink-0" />
                            <span>{config.badge}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D55]"></span>
                            <span>{config.title}</span>
                        </div>

                        {/* Exact Required Headline */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0A192F] tracking-tight leading-[1.12]">
                            {config.headline}
                        </h1>

                        {/* Supporting Description */}
                        <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
                            {config.tagline}
                        </p>

                        {/* CTA Buttons */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                            <Link
                                to="/staff/register"
                                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-extrabold text-sm sm:text-base text-white bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] shadow-xl shadow-[#FF2D55]/25 hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center gap-2"
                            >
                                <span>Get Started Free</span>
                                <ArrowRight size={18} />
                            </Link>

                            <button
                                type="button"
                                onClick={() => {
                                    const el = document.getElementById('live-terminal-sandbox');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all hover:border-slate-300 flex items-center justify-center gap-2 text-center cursor-pointer group"
                            >
                                <span>{config.sandboxLabel || `Explore Live ${config.title} Terminal ↓`}</span>
                                <ArrowDown size={16} className="text-[#FF2D55] group-hover:translate-y-0.5 transition-transform" />
                            </button>

                            <button
                                type="button"
                                onClick={scrollToForm}
                                className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Book Free Demo ↓
                            </button>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* 2. DASHBOARD PREVIEW / PRODUCT ILLUSTRATION (Matching Reference Mockup) */}
                    {/* ========================================================================= */}
                    <div id="live-terminal-sandbox" className="mt-12 sm:mt-16 max-w-5xl mx-auto scroll-mt-24">
                        <div className="bg-[#FFF5F2] border border-rose-100/90 rounded-3xl p-4 sm:p-8 shadow-2xl shadow-rose-950/5 relative overflow-hidden">
                            {/* Decorative Header Bar */}
                            <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-rose-200/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-3.5 h-3.5 rounded-full bg-red-400"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
                                    <span className="ml-2 text-xs font-bold text-slate-500 hidden sm:inline">RestoSys POS Engine • {config.title} Live Interactive Terminal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                        Interactive Demo Sandbox
                                    </span>
                                </div>
                            </div>

                            {/* Soundbox simulated notification banner */}
                            {soundboxNotification && (
                                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-600 text-white flex items-center justify-between shadow-lg shadow-emerald-600/20">
                                    <div className="flex items-center gap-2.5">
                                        <Volume2 size={20} className="animate-pulse shrink-0" />
                                        <span className="font-black text-xs sm:text-sm">
                                            RestoSys Dynamic Soundbox: Received ₹{currentGrandTotal.toLocaleString('en-IN')} successfully via PhonePe UPI!
                                        </span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setSoundboxNotification(false)}
                                        className="text-white/80 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Main Visual Layout (Card / Receipt / Tablet Display) */}
                            <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                {/* Left Simulated Screen */}
                                <div className="md:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-md space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-sm text-[#0A192F]">{config.heroMockup.title}</h3>
                                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-[#FF2D55] border border-rose-100">Live Demo</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-400">{config.heroMockup.table}</p>
                                        </div>
                                        <span className="text-[11px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                            {config.heroMockup.invoiceNo}
                                        </span>
                                    </div>

                                    {/* Quick Punch Bar for Public Visitors */}
                                    {isBilling && (
                                        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                Punch Demo Items (Test Terminal Speed):
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {QUICK_ADD_ITEMS.map((dish, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => handleQuickAdd(dish)}
                                                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 hover:text-[#FF2D55] text-slate-700 border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                                    >
                                                        <Plus size={12} className="text-[#FF2D55]" />
                                                        <span>{dish.name}</span>
                                                        <span className="text-slate-400 font-medium">₹{dish.price}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Itemized Rows */}
                                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                        {simulatedItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-dashed border-slate-100 last:border-0 hover:bg-slate-50/60 px-1 rounded-lg transition-colors">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {isBilling ? (
                                                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateQty(idx, -1)}
                                                                className="w-4 h-4 rounded hover:bg-white text-slate-700 font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                                                title="Decrease quantity"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-4 text-center font-bold text-slate-800 text-[11px]">
                                                                {item.qty || 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateQty(idx, 1)}
                                                                className="w-4 h-4 rounded hover:bg-white text-slate-700 font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                                                title="Increase quantity"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                                                            {item.qty}
                                                        </span>
                                                    )}
                                                    <span className="font-bold text-slate-800 truncate">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    <span className="font-extrabold text-slate-900">
                                                        {typeof item.price === 'number' ? `₹${item.price * (item.qty || 1)}` : item.price}
                                                    </span>
                                                    {isBilling && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="text-slate-300 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                                                            title="Remove item"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Billing Cashier Terminal Controls (Only for Billing / Offline POS) */}
                                    {isBilling ? (
                                        <>
                                            {/* Subtotal & Total */}
                                            <div className="pt-2 border-t border-slate-200 space-y-1">
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Subtotal</span>
                                                    <span className="font-bold">₹{currentSubtotal.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>CGST (2.5%) + SGST (2.5%)</span>
                                                    <span className="font-bold">₹{currentTax.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between text-base font-black text-[#0A192F] pt-1">
                                                    <span>Net Total</span>
                                                    <span className="text-[#FF2D55] text-lg font-black tracking-tight">₹{currentGrandTotal.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            {/* Interactive Payment Modes */}
                                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        Select Tender Mode (Simulated):
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        Instant Settle
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {['UPI QR', 'Cash', 'Card', 'Split'].map((mode) => (
                                                        <button
                                                            key={mode}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedPaymentMode(mode);
                                                                setSoundboxNotification(false);
                                                            }}
                                                            className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                                                selectedPaymentMode === mode
                                                                    ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-md shadow-[#FF2D55]/20 scale-[1.02]'
                                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                                            }`}
                                                        >
                                                            {mode}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Tender Mode Specific Controls */}
                                                {selectedPaymentMode === 'UPI QR' && (
                                                    <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-10 h-10 rounded-lg bg-white border border-rose-200 flex items-center justify-center shrink-0">
                                                                <QrCode size={22} className="text-[#FF2D55]" />
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-extrabold text-slate-800 block">Dynamic UPI QR Ready</span>
                                                                <span className="text-[10px] text-slate-500">Auto-displays on customer screen</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSoundboxNotification(true)}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
                                                        >
                                                            Simulate Scan & Pay ⚡
                                                        </button>
                                                    </div>
                                                )}

                                                {selectedPaymentMode === 'Cash' && (
                                                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-bold text-slate-700">Cash Received:</span>
                                                            <div className="flex gap-1.5">
                                                                {[currentGrandTotal, 1500, 2000].map((amt) => (
                                                                    <button
                                                                        key={amt}
                                                                        type="button"
                                                                        onClick={() => setCashTendered(amt)}
                                                                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border ${
                                                                            cashTendered === amt
                                                                                ? 'bg-amber-600 text-white border-amber-600'
                                                                                : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                                                                        }`}
                                                                    >
                                                                        ₹{amt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs font-extrabold pt-1 border-t border-amber-200/50">
                                                            <span className="text-slate-600">Change to Return Customer:</span>
                                                            <span className="text-emerald-700 text-sm font-black">
                                                                ₹{Math.max(0, cashTendered - currentGrandTotal).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedPaymentMode === 'Card' && (
                                                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard size={18} className="text-blue-600" />
                                                            <span className="font-bold text-slate-700">PineLabs / EDC Terminal Linked</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                                            Tap / Chip Ready
                                                        </span>
                                                    </div>
                                                )}

                                                {selectedPaymentMode === 'Split' && (
                                                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-bold text-slate-700">Split Evenly By Guests:</span>
                                                            <div className="flex gap-1.5">
                                                                {[2, 3, 4, 5].map((g) => (
                                                                    <button
                                                                        key={g}
                                                                        type="button"
                                                                        onClick={() => setSplitGuests(g)}
                                                                        className={`w-6 h-6 rounded text-[11px] font-extrabold cursor-pointer border ${
                                                                            splitGuests === g
                                                                                ? 'bg-purple-600 text-white border-purple-600'
                                                                                : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100'
                                                                        }`}
                                                                    >
                                                                        {g}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs font-extrabold pt-1 border-t border-purple-200/50">
                                                            <span className="text-slate-600">Each Diner Pays:</span>
                                                            <span className="text-purple-700 text-sm font-black">
                                                                ₹{Math.ceil(currentGrandTotal / splitGuests).toLocaleString('en-IN')} / person
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons: Preview Slip & Reset */}
                                            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowReceiptModal(true)}
                                                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
                                                >
                                                    <Printer size={15} />
                                                    <span>Preview Simulated Thermal Slip (3s Print)</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleResetDemo}
                                                    className="w-full sm:w-auto py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
                                                >
                                                    Reset Bill
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        /* Module-Specific Controls for Non-Billing Modules (Reporting, Inventory, CRM, etc.) */
                                        <div className="pt-2 border-t border-slate-200 space-y-3">
                                            {activeKey === 'reporting' && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                            Payment Channel Collection Mix (Live Today):
                                                        </span>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-center">
                                                                <span className="text-[10px] font-bold text-purple-600 block">UPI Gateway</span>
                                                                <span className="text-sm font-black text-purple-900 block">58%</span>
                                                                <span className="text-[10px] text-purple-700 font-semibold">₹72,413</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-center">
                                                                <span className="text-[10px] font-bold text-blue-600 block">Card Swipes</span>
                                                                <span className="text-sm font-black text-blue-900 block">26%</span>
                                                                <span className="text-[10px] text-blue-700 font-semibold">₹32,461</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-center">
                                                                <span className="text-[10px] font-bold text-emerald-600 block">Cash Counter</span>
                                                                <span className="text-sm font-black text-emerald-900 block">16%</span>
                                                                <span className="text-[10px] text-emerald-700 font-semibold">₹19,976</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                                        <div>
                                                            <span className="text-slate-500 font-medium block">Average Order Value</span>
                                                            <span className="font-black text-slate-900 text-sm">₹365.00</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 font-medium block">Peak Sales Hour</span>
                                                            <span className="font-black text-emerald-600 text-sm">₹24,800/hr (8-10 PM)</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 font-medium block">Net Margin</span>
                                                            <span className="font-black text-slate-900 text-sm">68.4%</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleExportExcelReport}
                                                            className="flex-1 py-2.5 px-4 rounded-xl bg-[#0A192F] hover:bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                                        >
                                                            <FileText size={15} />
                                                            <span>Export Executive P&L Report (Excel)</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenWhatsAppSummary('reporting')}
                                                            className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                                        >
                                                            <Phone size={14} />
                                                            <span>WhatsApp Summary</span>
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            {activeKey === 'inventory' && (
                                                <>
                                                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <AlertCircle size={20} className="text-amber-600 shrink-0" />
                                                            <div>
                                                                <span className="text-xs font-black text-amber-900 block">Low Stock Alert: Mozzarella Cheese</span>
                                                                <span className="text-[11px] text-amber-700">Current stock: 4 Kg (Safety minimum: 10 Kg)</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleAutoReorderIndent}
                                                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-sm cursor-pointer shrink-0"
                                                        >
                                                            Auto Reorder Indent ⚡
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-slate-400 text-[10px] font-bold block">Pantry Items</span>
                                                            <span className="font-black text-slate-900 text-sm">184 Items</span>
                                                        </div>
                                                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                                            <span className="text-emerald-600 text-[10px] font-bold block">Stock Health</span>
                                                            <span className="font-black text-emerald-800 text-sm">98.2% In-Stock</span>
                                                        </div>
                                                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                                                            <span className="text-rose-600 text-[10px] font-bold block">Wastage Tracked</span>
                                                            <span className="font-black text-rose-800 text-sm">0.8% (&lt; 2%)</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => toast.success('📷 Physical Stock Audit scanner active! Point camera at pantry barcodes.', { icon: '📦' })}
                                                        className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <Boxes size={15} />
                                                        <span>Launch Mobile Barcode Stock Audit</span>
                                                    </button>
                                                </>
                                            )}

                                            {activeKey === 'crm' && (
                                                <>
                                                    <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <Star size={20} className="text-purple-600 fill-purple-600 shrink-0" />
                                                            <div>
                                                                <span className="text-xs font-black text-purple-900 block">VIP Gold Tier • 1,240 Coins</span>
                                                                <span className="text-[11px] text-purple-700">Diner earns 5% coins on every visit</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenWhatsAppSummary('crm')}
                                                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-sm cursor-pointer shrink-0"
                                                        >
                                                            Send WhatsApp Offer 💬
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-slate-400 text-[10px] font-bold block">Guest Preference</span>
                                                            <span className="font-bold text-slate-800 text-xs">Corner Table • Non-Smoking</span>
                                                        </div>
                                                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-slate-400 text-[10px] font-bold block">Important Date</span>
                                                            <span className="font-bold text-slate-800 text-xs">Wedding Anniversary: Dec 14</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {activeKey === 'menu' && (
                                                <>
                                                    <div className="p-3 rounded-xl bg-pink-50/80 border border-pink-200 flex items-center justify-between gap-3">
                                                        <div>
                                                            <span className="text-xs font-black text-pink-900 block">Instant 86 (Out-of-Stock) Sync</span>
                                                            <span className="text-[11px] text-pink-700">Turn off sold-out items across QR, POS & aggregators in 1 tap</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toast.success('Gourmet Truffle Burger marked as 86 Out of Stock across all menus!')}
                                                            className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-black text-xs shadow-sm cursor-pointer shrink-0"
                                                        >
                                                            Toggle 86 Out ⚡
                                                        </button>
                                                    </div>

                                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                                        <span className="text-slate-600 font-medium">Auto-sync with Digital QR & Online Store:</span>
                                                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            ✓ Live 0-Second Delay
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {activeKey === 'online-ordering' && (
                                                <>
                                                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3">
                                                        <div>
                                                            <span className="text-xs font-black text-emerald-900 block">0% Aggregator Commission Saved</span>
                                                            <span className="text-[11px] text-emerald-700">Saved ₹394 direct profit vs 25% delivery app fee</span>
                                                        </div>
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px]">
                                                            100% Margin
                                                        </span>
                                                    </div>

                                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                                        <span className="text-slate-600 font-medium">Live Delivery Status:</span>
                                                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                                            🛵 Rider Dispatched (ETA: 14 mins)
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {activeKey === 'purchase-manager' && (
                                                <>
                                                    <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 flex items-center justify-between gap-3">
                                                        <div>
                                                            <span className="text-xs font-black text-sky-900 block">PO #PO-2026-SUPPLY-418 • Approved</span>
                                                            <span className="text-[11px] text-sky-700">Vendor: Fresh Farms Wholesale • Net 15 Days</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenWhatsAppSummary('purchase-manager')}
                                                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-sm cursor-pointer shrink-0"
                                                        >
                                                            Send PO via WhatsApp 📲
                                                        </button>
                                                    </div>

                                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                                        <span className="text-slate-600 font-medium">Rate Contract Verification:</span>
                                                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            ✓ 100% Pre-Agreed Wholesale Rates
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side Highlights & Callout */}
                                <div className="md:col-span-5 space-y-4">
                                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#FFF1F1] text-[#FF2D55] flex items-center justify-center font-bold">
                                            <config.icon size={22} />
                                        </div>
                                        <h4 className="font-black text-slate-900 text-base leading-snug">
                                            Engineered for High-Pressure Peak Hours
                                        </h4>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            Zero loading wheels. Cashiers and captains process orders instantly with tactile feedback and immediate thermal KOT slips.
                                        </p>
                                    </div>

                                    <div className="bg-gradient-to-tr from-[#0A192F] to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Operational Guarantee</span>
                                        <p className="text-sm font-bold leading-snug">
                                            100% Zero Revenue Leakage with Manager PIN Overrides
                                        </p>
                                        <p className="text-[11px] text-slate-300">
                                            Every bill alteration, cancellation, or split is audit-logged with time and staff credentials.
                                        </p>
                                    </div>

                                    {/* Demo Walkthrough Prompt */}
                                    <div className="bg-white rounded-2xl p-4 border border-rose-100 space-y-2">
                                        <span className="text-xs font-black text-[#0A192F] block">Want a full walkthrough with your menu?</span>
                                        <p className="text-[11px] text-slate-500">
                                            Our specialist will demo live on video using your actual restaurant items, table layout, and tax rules.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={scrollToForm}
                                            className="w-full py-2 px-3 rounded-lg bg-[#FFF1F1] text-[#FF2D55] hover:bg-rose-100 font-extrabold text-xs transition-colors text-center cursor-pointer block"
                                        >
                                            Schedule Free Walkthrough ↓
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simulated Thermal Receipt Modal for Public Visitors (Only on Billing) */}
                    {isBilling && showReceiptModal && (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
                                <button
                                    type="button"
                                    onClick={() => setShowReceiptModal(false)}
                                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>

                                {/* Thermal Slip Representation */}
                                <div className="font-mono text-[11px] bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 text-slate-800 space-y-2 shadow-inner">
                                    <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                                        <h4 className="font-black text-xs tracking-wider">RESTOSYS EXPRESS BISTRO</h4>
                                        <p className="text-[10px] text-slate-500">Connaught Place, New Delhi</p>
                                        <p className="text-[9px] text-slate-400">GSTIN: 07AAAAA0000A1Z5 • FSSAI: 10020011000123</p>
                                    </div>

                                    <div className="flex justify-between text-[10px] text-slate-600">
                                        <span>Invoice: {config.heroMockup.invoiceNo}</span>
                                        <span>{config.heroMockup.table}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 pb-2 border-b border-dashed border-slate-300">
                                        <span>Date: 22-Oct-2026</span>
                                        <span>Time: 12:45 PM</span>
                                    </div>

                                    {/* Item rows */}
                                    <div className="space-y-1 py-1">
                                        {simulatedItems.map((it, idx) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{it.qty || 1}x {it.name}</span>
                                                <span className="font-bold">₹{(typeof it.price === 'number' ? it.price * (it.qty || 1) : it.price)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2 border-t border-dashed border-slate-300 space-y-0.5">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Subtotal:</span>
                                            <span>₹{currentSubtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>CGST (2.5%):</span>
                                            <span>₹{Math.round(currentTax / 2).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>SGST (2.5%):</span>
                                            <span>₹{Math.round(currentTax / 2).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between font-black text-xs text-slate-900 pt-1 border-t border-slate-400">
                                            <span>TOTAL AMOUNT:</span>
                                            <span>₹{currentGrandTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-emerald-700 font-bold pt-0.5">
                                            <span>PAID VIA:</span>
                                            <span>{selectedPaymentMode} (SETTLED)</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 text-center space-y-1 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
                                        <p className="font-bold">*** RESTOSYS POS DEMO RECEIPT ***</p>
                                        <p>Thank You For Dining With Us!</p>
                                        <div className="h-6 w-36 mx-auto bg-slate-300 rounded flex items-center justify-center text-[8px] tracking-widest text-slate-600 font-bold">
                                            |||| | ||||| || ||||
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowReceiptModal(false)}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                                >
                                    Close Receipt Preview
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Simulated WhatsApp Summary Modal */}
                    {showWhatsAppModal && (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                            <div className="bg-[#EFEAE2] rounded-2xl max-w-md w-full shadow-2xl border border-slate-300 relative overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
                                {/* WhatsApp Header */}
                                <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between shrink-0 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-400/40 flex items-center justify-center font-black text-sm text-white shadow-xs">
                                            RS
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm leading-tight">RestoSys Executive Bot</h4>
                                            <p className="text-[10px] text-emerald-200">Online • End-to-end encrypted</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowWhatsAppModal(false)}
                                        className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-800/50 transition-colors cursor-pointer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Recipient banner */}
                                <div className="bg-[#128C7E]/10 border-b border-[#075E54]/10 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-700">
                                    <span className="font-semibold">{whatsAppModalContent.title}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{whatsAppModalContent.recipient}</span>
                                </div>

                                {/* Chat Body with WhatsApp Doodle aesthetic */}
                                <div 
                                    className="p-4 overflow-y-auto space-y-3 flex-1 bg-[#ECE5DD]"
                                    style={{
                                        backgroundImage: 'radial-gradient(#d1c7bc 0.75px, transparent 0.75px)',
                                        backgroundSize: '12px 12px'
                                    }}
                                >
                                    {/* Security pill */}
                                    <div className="flex justify-center">
                                        <span className="bg-[#FFF9C4] text-[#795548] text-[9.5px] px-2.5 py-1 rounded-md shadow-2xs font-medium text-center max-w-[90%] border border-[#FFF59D]">
                                            🔒 Messages are end-to-end encrypted. Real-time closing sync powered by RestoSys Cloud.
                                        </span>
                                    </div>

                                    {/* Message bubble */}
                                    <div className="flex justify-end">
                                        <div className="max-w-[95%] bg-[#DCF8C6] rounded-2xl rounded-tr-xs p-3.5 shadow-xs text-slate-800 space-y-1.5 border border-[#C5E1A5]/60">
                                            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-900 select-all">
                                                {whatsAppModalContent.message}
                                            </pre>
                                            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-1">
                                                <span>11:45 PM</span>
                                                <CheckCheck size={14} className="text-sky-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Actions footer */}
                                <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleShareOnWhatsApp}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
                                    >
                                        <ExternalLink size={14} />
                                        <span>Open in WhatsApp</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopyWhatsAppMessage}
                                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Copy size={14} />
                                        <span>Copy Text</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowWhatsAppModal(false)}
                                        className="py-2.5 px-3 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Metric Stat Strip */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                        {config.stats.map((stat, i) => (
                            <div key={i} className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 sm:p-5 text-center">
                                <span className="text-2xl sm:text-3xl font-black text-[#0A192F] block tracking-tight">
                                    {stat.value}
                                </span>
                                <span className="text-xs font-bold text-slate-800 block mt-1">
                                    {stat.label}
                                </span>
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                    {stat.sub}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 3. HARDWARE & DEVICE COMPATIBILITY STRIP (Matching Screenshot Strip) */}
                {/* ========================================================================= */}
                <section className="bg-slate-50 border-y border-slate-200/80 py-10 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto text-center space-y-6">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            Works Out-of-the-Box with Your Existing Restaurant Hardware
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6 pt-2">
                            {[
                                { name: 'Thermal Printers', sub: 'USB, Bluetooth & LAN', icon: Printer },
                                { name: 'Touch POS Terminals', sub: 'All-in-One Screens', icon: Monitor },
                                { name: 'Android & iPads', sub: 'Waiter Handhelds', icon: Smartphone },
                                { name: 'Barcode Scanners', sub: '1D & 2D SKU Readers', icon: QrCode },
                                { name: 'Cash Drawers', sub: 'RJ11 Auto-Kick', icon: CreditCard },
                                { name: 'UPI Soundboxes', sub: 'Real-time Audio Alert', icon: Zap }
                            ].map((hw, idx) => (
                                <div key={idx} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/60 shadow-xs flex flex-col items-center text-center space-y-1.5 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 rounded-lg bg-[#FFF1F1] text-[#FF2D55] flex items-center justify-center">
                                        <hw.icon size={20} />
                                    </div>
                                    <span className="text-xs font-black text-[#0A192F] block leading-tight">{hw.name}</span>
                                    <span className="text-[10px] text-slate-400 block leading-tight">{hw.sub}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 4. DEEP FEATURE SPOTLIGHT CARDS (Alternating Sections) */}
                {/* ========================================================================= */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 sm:space-y-24">
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-[#FF2D55]">Features That Deliver Impact</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-[#0A192F] tracking-tight">
                            Built Specifically for High-Volume Restaurant Workflows
                        </h2>
                        <p className="text-slate-600 font-medium text-sm sm:text-base">
                            Designed closely with restaurant owners, head chefs, and cashiers to solve real floor bottlenecks.
                        </p>
                    </div>

                    <div className="space-y-16">
                        {config.features.map((feature, idx) => {
                            const isEven = idx % 2 === 0;
                            return (
                                <div 
                                    key={idx}
                                    className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 sm:gap-14 bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm`}
                                >
                                    {/* Text Column */}
                                    <div className="flex-1 space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FFF1F1] text-[#FF2D55] text-xs font-bold border border-rose-100">
                                            <feature.icon size={15} />
                                            <span>Feature {idx + 1}</span>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
                                            {feature.description}
                                        </p>
                                        <ul className="space-y-2.5 pt-2">
                                            {feature.points.map((pt, pIdx) => (
                                                <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-slate-800">
                                                    <CheckCircle2 size={18} className="text-[#FF2D55] shrink-0 mt-0.5" />
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Visual Card Column */}
                                    <div className="flex-1 w-full">
                                        <div className={`${feature.bgColor} ${feature.borderColor} border rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm`}>
                                            <div className="flex items-center justify-between pb-3 border-b border-black/5">
                                                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                                                    Module Architecture
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-xs">
                                                    Real-Time Ready
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="bg-white rounded-xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[#FFF1F1] text-[#FF2D55] flex items-center justify-center font-bold">
                                                            <feature.icon size={16} />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-900 block">{feature.title}</span>
                                                            <span className="text-[10px] text-slate-400 block">Instant sync with {config.title}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-extrabold text-emerald-600">Active</span>
                                                </div>

                                                <div className="bg-white/70 rounded-xl p-3 border border-black/5 text-[11px] text-slate-600 space-y-1">
                                                    <span className="font-bold text-slate-900 block">Key Performance Benefit:</span>
                                                    <p>{feature.points[0]}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 5. HOW IT WORKS SECTION (Sequential 4 Steps) */}
                {/* ========================================================================= */}
                <section className="bg-slate-50 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-200/80">
                    <div className="max-w-7xl mx-auto space-y-12">
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <span className="text-xs font-black uppercase tracking-wider text-[#FF2D55]">Simple Implementation</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#0A192F] tracking-tight">
                                How It Works in Daily Service
                            </h2>
                            <p className="text-slate-600 text-sm font-medium">
                                Four straightforward operational steps designed to eliminate confusion and train staff in 15 minutes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {config.workflowSteps.map((step, idx) => (
                                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3 relative">
                                    <span className="text-3xl font-black text-[#FF2D55]/20 block font-mono">
                                        {step.step}
                                    </span>
                                    <h4 className="text-base font-black text-[#0A192F]">{step.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 6. BENEFITS SECTION (6 Value Pillars Grid) */}
                {/* ========================================================================= */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#FF2D55]">The Business Advantage</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-[#0A192F] tracking-tight">
                            Why Restaurant Owners Rely on {config.title}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {config.benefits.map((benefit, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:border-rose-200 hover:shadow-md transition-all space-y-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#FFF1F1] text-[#FF2D55] flex items-center justify-center font-bold">
                                    <Check size={18} />
                                </div>
                                <h4 className="text-base font-black text-[#0A192F]">{benefit.title}</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 7. DARK SAAS TRUST & SCALE METRICS BANNER */}
                {/* ========================================================================= */}
                <section className="bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center sm:text-left">
                        <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                            <span className="text-3xl sm:text-4xl font-black text-white">50,000+</span>
                            <span className="text-xs text-rose-400 font-bold block uppercase tracking-wider">Restaurants Trust Us</span>
                            <p className="text-xs text-slate-400 pt-1">From boutique cafes to multi-outlet QSR franchise chains.</p>
                        </div>
                        <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                            <span className="text-3xl sm:text-4xl font-black text-white">99.99%</span>
                            <span className="text-xs text-rose-400 font-bold block uppercase tracking-wider">Cloud Uptime SLA</span>
                            <p className="text-xs text-slate-400 pt-1">Zero downtime during Saturday night dinner rushes.</p>
                        </div>
                        <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                            <span className="text-3xl sm:text-4xl font-black text-white">3 Seconds</span>
                            <span className="text-xs text-rose-400 font-bold block uppercase tracking-wider">Order to Print Time</span>
                            <p className="text-xs text-slate-400 pt-1">Fastest checkout speed in the Indian restaurant industry.</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-3xl sm:text-4xl font-black text-white">24/7/365</span>
                            <span className="text-xs text-rose-400 font-bold block uppercase tracking-wider">Priority Support</span>
                            <p className="text-xs text-slate-400 pt-1">Dedicated restaurant engineers available via phone & WhatsApp.</p>
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 8. INTERACTIVE LEAD CAPTURE / DEMO BOOKING FORM (From Screenshot) */}
                {/* ========================================================================= */}
                <section id="demo-request-form" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="bg-[#FFF5F2] border border-rose-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#FF2D55] text-xs font-bold shadow-xs">
                                <span>Free Guided Demo</span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-[#0A192F]">
                                See {config.title} in Action for Your Restaurant
                            </h3>
                            <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-lg mx-auto">
                                Schedule a 15-minute 1-on-1 walkthrough tailored specifically to your restaurant format and operational workflow.
                            </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-700 block mb-1">Your Full Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="e.g. Ramesh Sharma"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-700 block mb-1">Mobile Phone Number *</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="e.g. +91 98765 43210"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-1">
                                    <label className="text-xs font-black text-slate-700 block mb-1">Restaurant Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.restaurantName}
                                        onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                        placeholder="e.g. Spice Symphony Cafe"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-700 block mb-1">City / Region</label>
                                    <input 
                                        type="text" 
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="e.g. Mumbai / Bengaluru"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-700 block mb-1">Outlet Format</label>
                                    <select
                                        value={formData.outletType}
                                        onChange={(e) => setFormData({ ...formData, outletType: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    >
                                        <option value="Dine-In Restaurant">Fine Dine &amp; Resto-Bar</option>
                                        <option value="Quick Service (QSR)">Quick Service (QSR)</option>
                                        <option value="Cafe & Bakery">Cafe &amp; Bakery</option>
                                        <option value="Cloud Kitchen">Cloud Kitchen</option>
                                        <option value="Multi-Outlet Chain">Multi-Outlet Chain</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 rounded-xl font-black text-base text-white bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] shadow-lg shadow-[#FF2D55]/25 transition-all cursor-pointer active:scale-98 disabled:opacity-70"
                            >
                                {submitting ? 'Connecting With Specialist...' : `Schedule Free ${config.title} Walkthrough`}
                            </button>
                            <p className="text-center text-[11px] text-slate-400 font-medium">
                                No credit card required. Free 14-day trial included with all guided demos.
                            </p>
                        </form>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 9. MODULE FAQ ACCORDION */}
                {/* ========================================================================= */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#FF2D55]">Got Questions?</span>
                        <h2 className="text-3xl font-black text-[#0A192F]">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-3">
                        {config.faqs.map((faq, idx) => {
                            const isOpen = expandedFaq === idx;
                            return (
                                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-900 hover:text-[#FF2D55] transition-colors cursor-pointer"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#FF2D55]' : ''}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 10. FINAL BOTTOM CALL-TO-ACTION SECTION */}
                {/* ========================================================================= */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] rounded-3xl p-8 sm:p-14 text-white text-center space-y-6 shadow-2xl shadow-rose-900/20 relative overflow-hidden">
                        <div className="max-w-2xl mx-auto space-y-3">
                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                                Ready to Transform Your {config.title} Operations?
                            </h2>
                            <p className="text-rose-100 text-sm sm:text-base font-medium">
                                Join thousands of top restaurateurs who power their daily floor operations with RestoSys.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <Link
                                to="/staff/register"
                                className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-sm sm:text-base bg-white text-[#FF2D55] hover:bg-slate-50 shadow-lg transition-transform hover:scale-105 active:scale-95"
                            >
                                Start 14-Day Free Trial
                            </Link>

                            <Link
                                to="/contact"
                                className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-sm sm:text-base bg-black/20 hover:bg-black/30 text-white border border-white/20 transition-colors"
                            >
                                Contact Sales Team
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            {/* Complete Website Footer */}
            <WebsiteFooter />
        </div>
    );
};

export default PosModuleLandingPage;
