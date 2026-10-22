import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
    Utensils, Clock, Sparkles, Flame, Building2, ChevronRight, CheckCircle2, 
    ArrowRight, Star, ChevronDown, ShieldCheck, Printer, Smartphone, Laptop, 
    Zap, Check, HelpCircle, DollarSign, Boxes, LineChart, Store, CreditCard, 
    QrCode, FileText, Split, AlertCircle, TrendingUp, Calendar, Phone, ArrowUpRight,
    ChefHat, Users, Coffee, Cake, Layers, ShoppingBag, Eye, Award,
    Monitor, ShoppingCart, Truck, BookOpen, ArrowDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/axiosInstance';
import WebsiteNavbar from '../../components/WebsiteNavbar';
import WebsiteFooter from '../../components/WebsiteFooter';

const OUTLET_TYPE_CONFIGS = {
    'fine-dining': {
        id: 'fine-dining',
        slug: 'fine-dining',
        title: 'Fine Dining & Bars',
        headline: 'Deliver Exceptional Dining Experiences.',
        description: 'Manage reservations, table service, detailed orders, and restaurant operations with a connected management system.',
        badge: 'Full-Service & Luxury Dining',
        accentColor: '#FF2D55',
        icon: Utensils,
        primaryCta: 'Explore Table Floor Plan ↓',
        heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Table Turn Time', value: '22% Faster', sub: 'Instant course notification' },
            { label: 'Reservation Accuracy', value: '100%', sub: 'Zero double bookings' },
            { label: 'Average Check Size', value: '+18%', sub: 'Smart sommelier upsells' },
            { label: 'Guest Retention', value: '42%', sub: 'VIP dining preferences logged' }
        ],
        mockupType: 'fine-dining',
        features: [
            {
                title: 'Table & Floor Plan Layout Management',
                description: 'Visually map dining rooms, private dining rooms (PDR), patios, and bar stools. Color-coded tables indicate whether a party is seated, waiting for courses, or requesting the check.',
                points: ['Interactive drag-and-drop floor plans', 'Real-time table status color codes (Vacant, Seated, Billed)', 'Floor section assignment by captain and server'],
                icon: Utensils,
                bgColor: 'bg-rose-50/60',
                borderColor: 'border-rose-100'
            },
            {
                title: 'Advanced Reservations & Guest Seating',
                description: 'Eliminate reservation mix-ups. Seamlessly manage walk-in queues, phone reservations, and online table bookings with guest preference notes and anniversary tags.',
                points: ['Direct reservation integration with SMS reminders', 'Waitlist management with live customer SMS notifications', 'Historical diner notes (allergies, favorite tables, wine choices)'],
                icon: Calendar,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: 'Multi-Course Kitchen Order Management',
                description: 'Hold and fire courses effortlessly. Captains can punch Appetizers, Mains, and Desserts together, firing each subsequent course to the kitchen only when the table is ready.',
                points: ['Course-by-course kitchen KOT routing', 'Captains hold and fire courses with one tap', 'Chef prep countdown timers ensure dishes arrive simultaneously'],
                icon: ChefHat,
                bgColor: 'bg-indigo-50/60',
                borderColor: 'border-indigo-100'
            },
            {
                title: 'Captain Handhelds & Waiter Workflows',
                description: 'Equip floor captains with mobile handheld tablets. Take orders table-side, beam tickets instantly to the bar and kitchen, and spend more time delighting guests.',
                points: ['Lightweight tablet order entry directly at the table', 'Custom special preparation notes for each guest', 'Instant notification when kitchen marks dish ready'],
                icon: Smartphone,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Fine Dining Billing & Seat-Wise Splits',
                description: 'Effortlessly split bills by seat, split evenly across corporate cards, or divide specific bottles of wine among distinct diners without holding up table turnover.',
                points: ['Seat-by-seat and item-by-item split billing', 'Multiple credit card swipe support with digital signature', 'Automatic service charge and composite GST calculations'],
                icon: Split,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            },
            {
                title: 'Sommelier Wine & Luxury Sales Reporting',
                description: 'Deep reporting on vintage wine cellar consumption, captain sales performance, table turnaround velocity, and high-ticket guest lifetime values.',
                points: ['Wine cellar vintage inventory and bottle tracking', 'Server tips and table velocity performance metrics', 'Executive P&L statements by floor zone and meal period'],
                icon: LineChart,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Seat Guests', desc: 'Hostess seats reserved party at Table 04; table status turns blue on floor plan.' },
            { step: '02', title: 'Course Order', desc: 'Captain punches multi-course order on tablet; drinks dispatch immediately to bar.' },
            { step: '03', title: 'Fire Courses', desc: 'Captain fires main courses when starters clear; kitchen synchronizes cook times.' },
            { step: '04', title: 'Split & Settle', desc: 'Bill splits effortlessly by seat; payment completes table-side with digital receipt.' }
        ],
        benefits: [
            { title: 'Elevate Diner Experience', desc: 'Flawless table coordination and course timing make every dinner unforgettable.' },
            { title: 'Speed Up Saturday Turns', desc: 'Shave 15 minutes off average dining times without rushing luxury guests.' },
            { title: 'Zero Food Waste on VIP Orders', desc: 'Accurate kitchen instructions prevent expensive steaks and seafood remakes.' },
            { title: 'VIP Guest Recognition', desc: 'Servers greet returning patrons by name and know their favorite wine vintages.' },
            { title: 'Eliminate Split-Bill Headaches', desc: 'Split corporate dinners across 6 cards in seconds with zero math errors.' },
            { title: 'Mobile Captain Freedom', desc: 'Floor captains stay present with guests instead of running back to stationary POS terminals.' }
        ],
        faqs: [
            { q: 'Can floor captains fire courses from mobile tablets?', a: 'Yes! Captains can take full multi-course orders at the table and fire subsequent courses directly from their mobile handheld or tablet.' },
            { q: 'How does seat-wise bill splitting work?', a: 'Dishes are assigned to individual seat numbers when ordering. When settling, simply tap "Split by Seat" to produce separate printed slips instantly.' },
            { q: 'Does it manage wine cellar and bar inventory?', a: 'Yes. RestoSys supports bottle-level tracking, spirit peg measurements, and recipe deductions for high-end cocktail bars.' }
        ]
    },

    'quick-service': {
        id: 'quick-service',
        slug: 'quick-service',
        title: 'Quick Service (QSR)',
        headline: 'Serve Faster. Keep Every Order Moving.',
        tagline: 'Streamline counter ordering, fast billing, kitchen coordination, and takeaway operations.',
        badge: 'High-Volume Fast Casual',
        accentColor: '#FF6A00',
        icon: Clock,
        primaryCta: 'Explore QSR Counter POS ↓',
        heroImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Counter Order Speed', value: '< 15 Sec', sub: 'Two-tap rapid punch' },
            { label: 'Token Accuracy', value: '100%', sub: 'Digital queue display' },
            { label: 'Peak Hour Throughput', value: '3x More', sub: 'Zero cashier lag' },
            { label: 'Order Error Rate', value: '0.01%', sub: 'Clear kitchen routing' }
        ],
        mockupType: 'quick-service',
        features: [
            {
                title: 'High-Speed Counter POS Billing',
                description: 'Engineered for rapid order entry. Cashiers punch popular burgers, wraps, and beverage combos in two taps, prompt for upsells, and collect payments in seconds.',
                points: ['Touch-optimized visual quick keys for top 20 sellers', 'Integrated barcode scanning for packaged grab-and-go items', 'Lightning-fast 2-second thermal slip printing'],
                icon: Zap,
                bgColor: 'bg-orange-50/60',
                borderColor: 'border-orange-100'
            },
            {
                title: 'Automated Token & Live Queue Display',
                description: 'Eliminate chaotic counter crowding. Generates sequential order token numbers displayed live on large customer-facing TV screens with audio chimes when ready.',
                points: ['Automated token numbering for Dine-In and Takeaway', 'HDMI TV display screen integration for waiting areas', 'Voice chime announce (e.g. "Order 402 is Ready!")'],
                icon: Monitor,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: 'Direct Kitchen KDS Order Routing',
                description: 'Orders flow instantly to fryer, burger assembly, and drink preparation stations. Color-coded ticket timers warn chefs if orders exceed 3-minute targets.',
                points: ['Station-wise routing (Grill, Fryer, Beverage, Packing)', 'Red flashing timers for orders pending over 4 minutes', 'Bump bar and touch screen kitchen fulfillment'],
                icon: Flame,
                bgColor: 'bg-red-50/60',
                borderColor: 'border-red-100'
            },
            {
                title: 'Takeaway & Pickup Queue Optimization',
                description: 'Seamlessly coordinate counter takeaways, drive-through pickups, and online platform orders without counter confusion or mixed-up bags.',
                points: ['Bag label stickers with itemized contents and token #', 'Designated pickup counter fulfillment queue', 'Customer SMS notification when takeaway bag is sealed'],
                icon: ShoppingBag,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Combo & Meal Deal Customization',
                description: 'Configure high-margin meal deals effortlessly (Burger + Fries + Drink). Cashiers swap fries for onion rings or upgrade drink sizes with single-tap pricing rules.',
                points: ['Dynamic combo package builders', 'One-tap size upgrade prompts (+₹40 for Large Meal)', 'Automatic inventory deduction for every combo component'],
                icon: Sparkles,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            },
            {
                title: 'Peak-Hour Velocity & Speed of Service Reports',
                description: 'Analyze order turnaround speed, average queue wait time, cashier checkout velocity, and hourly revenue spikes during peak lunch and dinner surges.',
                points: ['Hourly order volume and cashier efficiency metrics', 'Speed-of-Service (SOS) kitchen prep time tracking', 'Item velocity heatmaps to prepare batches in advance'],
                icon: TrendingUp,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Order & Pay', desc: 'Customer orders at counter; cashier punches combo and collects payment in 15 seconds.' },
            { step: '02', title: 'Token Generated', desc: 'Thermal receipt prints with Token #402; customer-facing screen displays "In Prep".' },
            { step: '03', title: 'Kitchen Prep', desc: 'Burger and fryer stations receive ticket; chef bumps order when packaged.' },
            { step: '04', title: 'Token Handover', desc: 'Screen announces "Token #402 Ready"; customer collects order and departs.' }
        ],
        benefits: [
            { title: 'Serve Triple the Customers', desc: 'Speed up line movement so hungry lunch crowds never walk away to competitors.' },
            { title: 'Eliminate Wrong Bag Handouts', desc: 'Clear itemized token bag stickers ensure the right meal reaches the right guest.' },
            { title: 'Reduce Cashier Mistakes', desc: 'Visual touchscreen tiles prevent incorrect item punches during rush hours.' },
            { title: 'Automated Combo Upselling', desc: 'System automatically reminds cashiers to ask: "Would you like to make that a meal?"' },
            { title: 'Real-Time KDS Accountability', desc: 'Measure exact kitchen prep speed to identify and solve assembly line bottlenecks.' },
            { title: 'Offline Counter Continuity', desc: 'Internet outage? Cash registers continue billing and printing tokens locally.' }
        ],
        faqs: [
            { q: 'Can RestoSys display tokens on a customer-facing TV screen?', a: 'Yes! You can connect any standard smart TV or HDMI monitor to display live "Preparing" and "Ready for Pickup" token columns.' },
            { q: 'How fast is counter order punching?', a: 'A trained cashier can punch a 3-item combo and print the receipt in under 15 seconds using touch-screen quick tiles.' },
            { q: 'Does it support combo meal modifications?', a: 'Yes. You can easily configure options like drink swaps, fry size upgrades, and flavor choices with automated price recalculations.' }
        ]
    },

    'cafes-bakeries': {
        id: 'cafes-bakeries',
        slug: 'cafes-bakeries',
        title: 'Cafes & Bakeries',
        headline: 'Made for Cafes. Built for Better Service.',
        tagline: 'Manage beverages, bakery products, customisations, combos, and everyday cafe operations in one place.',
        badge: 'Artisanal Coffee & Bakes',
        accentColor: '#D97706',
        icon: Coffee,
        primaryCta: 'Explore Cafe Barista POS ↓',
        heroImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Beverage Customizations', value: 'Unlimited', sub: 'Milks, syrups, sizes & shots' },
            { label: 'Bakery Batch Tracking', value: 'Real-Time', sub: 'Freshness & shelf-life' },
            { label: 'Repeat Customer Visits', value: '+45%', sub: 'Digital loyalty coffee cards' },
            { label: 'Ingredient Accuracy', value: 'Gram-Level', sub: 'Beans, milk, syrups tracked' }
        ],
        mockupType: 'cafes-bakeries',
        features: [
            {
                title: 'Beverage Sizing & Customization Matrix',
                description: 'Tailored for coffee shop workflows. Seamlessly handle beverage sizes (Small, Regular, Large), milk preferences (Oat, Almond, Soy, Skim), extra espresso shots, and sugar levels.',
                points: ['Barista-friendly modifier tags (e.g. "Iced Oat Latte, +Vanilla, Decaf")', 'Automatic price adjustments for premium dairy substitutes', 'Direct printing on cup label stickers for barista station'],
                icon: Coffee,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: 'Bakery Batch Freshness & Shelf-Life Management',
                description: 'Track fresh morning bakes. Log daily production batches of croissants, sourdough loaves, and pastries with automatic alerts before items pass peak freshness.',
                points: ['Morning bake batch quantity logs', 'Expiry and end-of-day markdown pricing rules', 'Wastage logs with cost per batch analytics'],
                icon: Cake,
                bgColor: 'bg-rose-50/60',
                borderColor: 'border-rose-100'
            },
            {
                title: 'Breakfast & Afternoon Coffee Combos',
                description: 'Create tempting breakfast pairings (Cappuccino + Butter Croissant for ₹249). System prompts cashiers to offer pairings whenever a hot beverage is selected.',
                points: ['Automatic combo detection and bundle pricing', 'Time-restricted morning breakfast specials (7 AM - 11 AM)', 'Seasonal festive dessert promotions'],
                icon: Sparkles,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Gram-Level Bean & Dairy Inventory Control',
                description: 'Track your expensive specialty roasted coffee beans, dairy cartons, and gourmet flavored syrups down to the exact gram and milliliter on every shot pulled.',
                points: ['Tracks bean consumption per espresso shot (18g double shot)', 'Dairy inventory by milliliters with low-stock alerts', 'Reduces waste on specialty artisanal ingredients'],
                icon: Boxes,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            },
            {
                title: 'Digital Coffee Stamp Loyalty Cards',
                description: 'Ditch paper stamp cards that guests lose. RestoSys tracks coffee purchases automatically by customer phone number—"Buy 5 Coffees, Get the 6th Free!"',
                points: ['Digital stamp tracker sends WhatsApp confirmation', 'Automatic loyalty reward redemption at checkout', 'Drives frequent morning routine cafe visits'],
                icon: Award,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            },
            {
                title: 'Custom Pre-Orders & Birthday Cake Bookings',
                description: 'Manage customized celebration cake orders with advance deposits, pickup time slots, personalized icing inscriptions, and flavor specifications.',
                points: ['Advance order deposit recording', 'Calendar schedule for pastry chef prep times', 'SMS reminder to customer when cake is boxed and ready'],
                icon: Calendar,
                bgColor: 'bg-pink-50/60',
                borderColor: 'border-pink-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Customize Drink', desc: 'Barista enters: "Large Flat White, Oat Milk, +1 Vanilla Shot" in two clicks.' },
            { step: '02', title: 'Cup Sticker Prints', desc: 'Adhesive thermal label prints on cup with guest name and exact recipe specs.' },
            { step: '03', title: 'Barista Crafts', desc: 'Barista reads clear label and prepares drink without verbal confusion.' },
            { step: '04', title: 'Loyalty Rewarded', desc: 'Guest phone logs digital coffee stamp; automatic loyalty points update.' }
        ],
        benefits: [
            { title: 'Zero Barista Order Confusion', desc: 'Clear cup labels prevent remake waste from misunderstood milk or syrup choices.' },
            { title: 'Boost Beverage Margins', desc: 'Easy upsells for premium oat milk (+₹50) and extra espresso shots (+₹40).' },
            { title: 'Turn Casual Passersby into Daily Regulars', desc: 'Frictionless digital loyalty keeps neighborhood professionals returning every morning.' },
            { title: 'Precise Coffee Bean Costing', desc: 'Know exact ingredient cost down to ₹1 for every single artisanal cup poured.' },
            { title: 'Seamless Pastry Showcase Sync', desc: 'Cashiers see exact remaining quantities of muffins and croissants in real time.' },
            { title: 'Stress-Free Pre-Order Cakes', desc: 'Track advance deposits and custom messages without messy paper order notebooks.' }
        ],
        faqs: [
            { q: 'Can it print stickers directly onto coffee cups?', a: 'Yes! RestoSys supports 2-inch adhesive thermal cup label printers so baristas have exact custom instructions right on the cup.' },
            { q: 'How does the digital coffee loyalty stamp card work?', a: 'When a customer gives their phone number, the system credits a digital stamp. On their 6th visit (or custom rule), their coffee discount applies automatically.' },
            { q: 'Can we track shelf life and daily bakes for pastries?', a: 'Yes. You can inward morning batches and set automatic end-of-day markdown rules for fresh baked goods.' }
        ]
    },

    'cloud-kitchens': {
        id: 'cloud-kitchens',
        slug: 'cloud-kitchens',
        title: 'Cloud & Dark Kitchens',
        headline: 'Power Your Kitchen. Grow Every Food Brand.',
        tagline: 'Coordinate digital orders, kitchen operations, menu management, and multiple virtual food brands from one central kitchen.',
        badge: 'Ghost & Virtual Kitchen Hub',
        accentColor: '#EF4444',
        icon: Flame,
        primaryCta: 'Explore Multi-Brand KDS ↓',
        heroImage: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Virtual Brands Handled', value: 'Unlimited', sub: 'From a single kitchen facility' },
            { label: 'Kitchen Prep Time', value: '14 Mins Avg', sub: 'Synchronized cook timers' },
            { label: 'Rider Handover Speed', value: '< 45 Sec', sub: 'Barcoded packaging verification' },
            { label: 'Ingredient Sharing', value: '100% Unified', sub: 'Shared pantry inventory' }
        ],
        mockupType: 'cloud-kitchens',
        features: [
            {
                title: 'Multi-Brand Operations from One Screen',
                description: 'Operate 5 distinct virtual food brands (e.g., Biryani, Gourmet Burgers, Pizza, Healthy Bowls, Desserts) from one physical kitchen space without confusing chefs.',
                points: ['Color-coded visual branding on every order ticket', 'Shared pantry raw material inventory across brands', 'Independent revenue and brand performance analytics'],
                icon: Layers,
                bgColor: 'bg-red-50/60',
                borderColor: 'border-red-100'
            },
            {
                title: 'Unified Kitchen Display System (KDS)',
                description: 'Route orders by preparation station rather than by brand. Biryanis route to the rice station, while burgers route to the grill, maximizing cook efficiency.',
                points: ['Station-wise routing (Grill, Tandoor, Fryer, Assembly, Packing)', 'Countdown timers with audio alerts for delayed tickets', 'Bump-bar and touchscreen ticket completion'],
                icon: ChefHat,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: '1-Click Master Menu & Stock 86 Toggle',
                description: 'Ran out of paneer or chicken breast? Toggle the ingredient once, and RestoSys automatically marks all corresponding dishes unavailable across all virtual brand storefronts.',
                points: ['Ingredient-level 86 disables all dishes using that item', 'Prevents unfulfillable orders and customer cancellations', 'Auto-restores items when stock delivery arrives'],
                icon: Zap,
                bgColor: 'bg-rose-50/60',
                borderColor: 'border-rose-100'
            },
            {
                title: 'Direct Online Ordering & 0% Commission Storefronts',
                description: 'Launch branded direct delivery websites for each of your virtual food brands. Accept direct orders via UPI and keep 100% of your customer data and profit margins.',
                points: ['Independent storefront URLs for each virtual brand', 'Zero 3rd-party commission deductions on direct orders', 'Full customer phone number and order history ownership'],
                icon: ShoppingCart,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Delivery Rider Dispatch & Packaging QC',
                description: 'Verify every outgoing order with barcoded packing stickers. Ensure the correct side sauces and beverages are placed in the bag before handing it to the delivery rider.',
                points: ['Bag packing checklist verification on screen', 'Scannable barcode handover reduces wrong deliveries', 'Live rider arrival tracking prevents food getting cold on shelf'],
                icon: Truck,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            },
            {
                title: 'Brand-Wise Profitability & Food Cost Audits',
                description: 'Gain complete visibility into which virtual brand generates true profit after raw materials, packaging, and operational overheads are factored in.',
                points: ['P&L breakdown by virtual brand', 'Packaging cost per order calculations', 'Top-performing dish rankings across all virtual concepts'],
                icon: LineChart,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'Order Arrives', desc: 'Direct digital order arrives; system tags brand name (e.g. "Royal Biryani").' },
            { step: '02', title: 'Station Routing', desc: 'KDS splits ticket: Rice station gets Biryani, Salad station gets Raita.' },
            { step: '03', title: 'Packing QC', desc: 'Kitchen packs order; bag barcode prints with customer items checklist.' },
            { step: '04', title: 'Rider Handover', desc: 'Rider scans token on pickup; customer receives live dispatch notification.' }
        ],
        benefits: [
            { title: 'Maximize Physical Kitchen ROI', desc: 'Generate 5x the revenue from the same rent, electricity, and kitchen staff.' },
            { title: 'Stop Cooking Chaos in the Kitchen', desc: 'Station-based KDS ensures chefs focus on their stations, not brand paperwork.' },
            { title: 'Cut Costly Food Remakes', desc: 'Packing checklist screens eliminate missing sauces, cold drinks, or incorrect cutlery.' },
            { title: 'Shared Bulk Procurement Savings', desc: 'Buy chicken, rice, and oil in wholesale bulk for all virtual brands together.' },
            { title: 'Test New Food Concepts Fast', desc: 'Launch a new virtual wrap or pasta brand in 48 hours without leasing new real estate.' },
            { title: 'Own Customer Relationships', desc: 'Build direct customer loyalty lists instead of relying solely on delivery apps.' }
        ],
        faqs: [
            { q: 'How many virtual brands can I operate from one kitchen?', a: 'Unlimited! RestoSys is built specifically for cloud kitchen multi-tenancy, allowing you to run as many virtual brands as your kitchen can handle.' },
            { q: 'Can chefs see orders from all brands on one kitchen display?', a: 'Yes. RestoSys can route orders either by brand or by cooking station (e.g. all fry items go to the Fryer KDS regardless of brand).' },
            { q: 'Does it support direct customer online ordering for cloud kitchens?', a: 'Yes! You get direct branded ordering links with 0% commission and integrated live order dispatch tracking.' }
        ]
    },

    'multi-outlet-chains': {
        id: 'multi-outlet-chains',
        slug: 'multi-outlet-chains',
        title: 'Multi-Outlet Chains',
        headline: 'Manage Every Outlet. From One Platform.',
        tagline: 'Bring restaurant branches, menus, inventory, sales reporting, and operations into a centralised management system.',
        badge: 'Enterprise Multi-Branch & Franchise',
        accentColor: '#4F46E5',
        icon: Building2,
        primaryCta: 'Explore Central Chain Console ↓',
        heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        stats: [
            { label: 'Outlets Supported', value: '100+ Stores', sub: 'Scales from 2 to 500+ branches' },
            { label: 'Central Menu Push', value: '1 Click', sub: 'Instant recipe & price updates' },
            { label: 'Data Isolation', value: '100% Strict', sub: 'Role & branch level security' },
            { label: 'Inventory Audits', value: 'Live Cloud', sub: 'HQ visibility into all stores' }
        ],
        mockupType: 'multi-outlet-chains',
        features: [
            {
                title: 'Centralized Master Menu & Pricing Push',
                description: 'Manage your master menu from corporate headquarters. Push new seasonal dishes, update recipe specs, and adjust prices across all 50 outlets simultaneously or by city tier.',
                points: ['1-Click master menu deployment across all stores', 'Tier-wise price overrides (e.g., Airport +20%, Tier-2 -10%)', 'Locked recipe standards maintain taste consistency'],
                icon: BookOpen,
                bgColor: 'bg-indigo-50/60',
                borderColor: 'border-indigo-100'
            },
            {
                title: 'Central Kitchen & Store Indent Transfers',
                description: 'Streamline bulk batch production at your central commissary. Outlets submit daily digital indent requests, and central kitchen dispatches goods with signed digital transit notes.',
                points: ['Outlet-to-commissary indent request workflows', 'Goods dispatch note (GDN) tracking with driver sign-off', 'Automated inter-branch stock consumption billing'],
                icon: Boxes,
                bgColor: 'bg-emerald-50/60',
                borderColor: 'border-emerald-100'
            },
            {
                title: 'Consolidated Multi-Outlet Sales Analytics',
                description: 'Compare branch performance in real time. Headquarters executives see total system-wide gross revenue, outlet rank leaderboards, and sales trends from an executive dashboard.',
                points: ['Live consolidated executive revenue dashboard', 'Branch vs branch sales, footfall, and margin comparisons', 'Automated nightly consolidated executive WhatsApp digest'],
                icon: LineChart,
                bgColor: 'bg-blue-50/60',
                borderColor: 'border-blue-100'
            },
            {
                title: 'Strict Role-Based Branch Access Permissions',
                description: 'Keep your business secure with strict tenant isolation. Branch managers only see their own store data, while regional managers and founders have full chain-wide visibility.',
                points: ['Granular permissions for Cashiers, Chefs, Managers, and HQ Admins', 'Prevents branch staff from snooping on sister outlet performance', 'Central audit trail logs every critical management override'],
                icon: ShieldCheck,
                bgColor: 'bg-purple-50/60',
                borderColor: 'border-purple-100'
            },
            {
                title: 'Franchise Royalty & Fee Calculation',
                description: 'Automate franchise operations. System automatically calculates monthly franchise royalties, brand marketing fees, and software levies based on audited POS net sales.',
                points: ['Automated franchise royalty percentage computing', 'Audited gross vs net sales tracking prevents under-reporting', 'Franchise billing statements generated with one click'],
                icon: DollarSign,
                bgColor: 'bg-amber-50/60',
                borderColor: 'border-amber-100'
            },
            {
                title: 'Chain-Wide Customer CRM & Cross-Branch Loyalty',
                description: 'Customers earn points at your Downtown outlet and redeem them at your Airport branch. Centralized guest profiles ensure VIP treatment wherever your patrons dine.',
                points: ['Unified customer mobile database across all branches', 'Universal loyalty wallet redemption at any store', 'Chain-wide promotional gift cards and vouchers'],
                icon: Users,
                bgColor: 'bg-rose-50/60',
                borderColor: 'border-rose-100'
            }
        ],
        workflowSteps: [
            { step: '01', title: 'HQ Master Setup', desc: 'Corporate team sets standardized recipes, menu items, and supplier contracts.' },
            { step: '02', title: 'Store Operations', desc: 'Each branch runs daily billing, seating, and prep with local cashier permissions.' },
            { step: '03', title: 'Daily Indents', desc: 'Branch managers submit inventory requests to central commissary kitchen.' },
            { step: '04', title: 'HQ Live Monitor', desc: 'Leadership team tracks system-wide revenue, margins, and store rankings live.' }
        ],
        benefits: [
            { title: 'Maintain Brand Consistency Across Cities', desc: 'Ensure your signature taste and pricing remain identical across every single location.' },
            { title: 'Bulk Purchasing Power', desc: 'Pool procurement for 20 outlets to negotiate 15% wholesale discounts on food supplies.' },
            { title: 'Zero Franchise Under-Reporting', desc: 'Audited cloud POS logs prevent franchise partners from hiding sales to dodge royalties.' },
            { title: 'Instant Menu Rollouts', desc: 'Launch a summer dessert festival across all 50 stores in 60 seconds from HQ.' },
            { title: 'Centralized Commissary Efficiency', desc: 'Cook marinades and sauces in bulk at central kitchen, cutting skilled chef costs at outlets.' },
            { title: 'Scale Without Growing Pains', desc: 'Add new restaurant branches in 15 minutes with standardized clone configurations.' }
        ],
        faqs: [
            { q: 'Can branch managers see other branches’ revenue data?', a: 'No. RestoSys provides strict role-based access control. Branch staff are restricted strictly to their assigned branch, while HQ admins see all stores.' },
            { q: 'How does central commissary inventory dispatch work?', a: 'Outlets raise digital stock indents. Central kitchen approves, produces in bulk batches, and generates digital Goods Dispatch Notes (GDN).' },
            { q: 'Can we have different pricing for airport outlets vs downtown stores?', a: 'Yes. RestoSys allows central menu management with tier-based location price overrides and local tax customization.' }
        ]
    }
};

const OutletTypeLandingPage = ({ type: typeProp }) => {
    const { formatSlug } = useParams();
    const activeKey = (typeProp || formatSlug || 'fine-dining').toLowerCase();
    const config = OUTLET_TYPE_CONFIGS[activeKey] || OUTLET_TYPE_CONFIGS['fine-dining'];

    // Lead capture form state
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        restaurantName: '',
        city: '',
        outletCount: '1 Outlet'
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
                outletFormat: config.title || 'Dine-In Restaurant'
            });
            if (res.data?.duplicate) {
                toast(res.data.message, { icon: 'ℹ️', duration: 5000 });
            } else {
                toast.success(res.data?.message || `Thank you, ${formData.fullName}! Our ${config.title} specialist will connect with you on ${formData.phoneNumber} shortly.`);
            }
            setFormData({
                fullName: '',
                phoneNumber: '',
                restaurantName: '',
                city: '',
                outletCount: '1 Outlet'
            });
        } catch (err) {
            console.error('Billing demo submission error:', err);
            toast.error(err.response?.data?.message || 'Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const scrollToForm = () => {
        const formEl = document.getElementById('demo-booking-section');
        if (formEl) {
            formEl.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#FFF1F1] selection:text-[#FF2D55] transition-colors">
            {/* Top Navigation Bar with Outlet Types Dropdown */}
            <WebsiteNavbar />

            <main className="pt-20 sm:pt-24 overflow-x-hidden">
                
                {/* ========================================================================= */}
                {/* 1. BREADCRUMB NAVIGATION */}
                {/* ========================================================================= */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                    <nav className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
                        <ChevronRight size={13} className="text-slate-300" />
                        <span className="text-slate-500">Outlet Types</span>
                        <ChevronRight size={13} className="text-slate-300" />
                        <span className="text-[#FF2D55]">{config.title}</span>
                    </nav>
                </div>

                {/* ========================================================================= */}
                {/* 2. HERO SECTION (Format-Specific Hero, Dual CTAs, Supporting Copy) */}
                {/* ========================================================================= */}
                <section className="relative px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-16 sm:pb-20 max-w-7xl mx-auto">
                    {/* Background Subtle Ambient Glow */}
                    <div 
                        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-rose-100/40 via-orange-50/20 to-transparent blur-3xl pointer-events-none -z-10" 
                    />

                    <div className="text-center max-w-4xl mx-auto space-y-6">
                        {/* Format Pill Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF1F1] border border-rose-200/80 text-[#FF2D55] font-black text-xs uppercase tracking-wider shadow-xs">
                            <config.icon size={15} className="shrink-0" />
                            <span>Outlet Type Solution</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D55]"></span>
                            <span>{config.title}</span>
                        </div>

                        {/* Exact Required Headline */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0A192F] tracking-tight leading-[1.12]">
                            {config.headline}
                        </h1>

                        {/* Exact Required Description */}
                        <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
                            {config.description}
                        </p>

                        {/* CTA Buttons */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    const el = document.getElementById('format-preview-demo');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-extrabold text-sm sm:text-base text-white bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] shadow-xl shadow-[#FF2D55]/25 hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>{config.primaryCta}</span>
                                <ArrowDown size={18} />
                            </button>

                            <button
                                type="button"
                                onClick={scrollToForm}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all hover:border-slate-300 flex items-center justify-center gap-2 text-center cursor-pointer"
                            >
                                <span>Book a Demo</span>
                                <Calendar size={16} className="text-[#FF2D55]" />
                            </button>

                            <Link
                                to="/staff/register"
                                className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-center"
                            >
                                Start 14-Day Free Trial →
                            </Link>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* 3. UNIQUE PRODUCT PREVIEW / INTERACTIVE FORMAT MOCKUP (Custom per Format) */}
                    {/* ========================================================================= */}
                    <div id="format-preview-demo" className="mt-12 sm:mt-16 max-w-5xl mx-auto scroll-mt-24">
                        <div className="bg-[#FFF5F2] border border-rose-100/90 rounded-3xl p-4 sm:p-8 shadow-2xl shadow-rose-950/5 relative overflow-hidden">
                            {/* Decorative Top Control Bar */}
                            <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-rose-200/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-3.5 h-3.5 rounded-full bg-red-400"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
                                    <span className="ml-2 text-xs font-bold text-slate-500 hidden sm:inline">
                                        RestoSys Format Console • {config.title} Live Interactive Mockup
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Demonstration Mode
                                </span>
                            </div>

                            {/* Format-Specific Visual Canvas */}
                            <div className="pt-6">
                                {config.mockupType === 'fine-dining' && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                        {/* Floor Plan Display */}
                                        <div className="md:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                <h4 className="font-black text-sm text-[#0A192F]">Main Dining Room Floor Plan</h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">Zone A: 8 Tables</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { table: 'T-01', seats: '4 Seats', status: 'Seated (Mains)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                                                    { table: 'T-02', seats: '2 Seats', status: 'Bill Printed', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                                                    { table: 'T-03', seats: '6 Seats', status: 'Reserved 8:00 PM', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                                                    { table: 'T-04', seats: '4 Seats', status: 'Seated (Courses)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                                                    { table: 'T-05', seats: '2 Seats', status: 'Vacant (Ready)', color: 'bg-slate-50 text-slate-600 border-slate-200' },
                                                    { table: 'PDR-1', seats: '12 VIP', status: 'Private Dining Active', color: 'bg-purple-50 text-purple-800 border-purple-200' },
                                                ].map((t, i) => (
                                                    <div key={i} className={`p-3 rounded-xl border text-center space-y-1 ${t.color}`}>
                                                        <span className="font-black text-sm block">{t.table}</span>
                                                        <span className="text-[10px] font-bold block opacity-80">{t.seats}</span>
                                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/70 block truncate">{t.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Captain Course Order Pad */}
                                        <div className="md:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                <span className="text-xs font-black text-slate-900">Captain Pad: Table 04</span>
                                                <span className="text-[10px] font-bold text-[#FF2D55]">Course 2 of 3</span>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                                                    <span>1x Truffle Wild Mushroom Arancini</span>
                                                    <span className="font-bold text-emerald-600">✓ Served</span>
                                                </div>
                                                <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100 flex justify-between">
                                                    <span>2x Herb-Crusted Rack of Lamb</span>
                                                    <span className="font-bold text-[#FF2D55] animate-pulse">🔥 Fired (Cooking)</span>
                                                </div>
                                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between text-slate-400">
                                                    <span>2x Dark Chocolate Soufflé</span>
                                                    <span>⏳ Held (Dessert)</span>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-700">
                                                <span>Subtotal: ₹3,450</span>
                                                <span className="text-[#FF2D55]">Split by Seat Active</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {config.mockupType === 'quick-service' && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                        {/* QSR Express Cashier Punch Keys */}
                                        <div className="md:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                <h4 className="font-black text-sm text-[#0A192F]">Express Touch POS Billing</h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Sub-15s Mode</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2.5">
                                                {[
                                                    { name: 'Double Cheese Burger Meal', price: '₹289', tag: 'Combo #1' },
                                                    { name: 'Crispy Chicken Wrap Meal', price: '₹249', tag: 'Combo #2' },
                                                    { name: 'Peri Peri Fries (Large)', price: '₹140', tag: 'Side' },
                                                    { name: 'Cold Coffee Float (500ml)', price: '₹160', tag: 'Drink' },
                                                    { name: 'Spicy Paneer Crunch Box', price: '₹310', tag: 'Meal Deal' },
                                                    { name: 'Choco Lava Cake', price: '₹99', tag: 'Dessert' },
                                                ].map((dish, i) => (
                                                    <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-[#FFF1F1] hover:border-rose-200 transition-colors text-left space-y-1 cursor-pointer">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">{dish.tag}</span>
                                                        <span className="text-xs font-black text-slate-900 block leading-tight truncate">{dish.name}</span>
                                                        <span className="text-xs font-extrabold text-[#FF2D55] block">{dish.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Live Order Token Display Screen */}
                                        <div className="md:col-span-5 bg-slate-950 text-white rounded-2xl p-5 shadow-xl space-y-4">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                                <span className="text-xs font-black text-rose-400">Order Token Board</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Live TV Display</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-center">
                                                <div className="bg-slate-900 rounded-xl p-3 border border-emerald-500/40">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">✓ Ready for Pickup</span>
                                                    <div className="space-y-1">
                                                        <span className="text-2xl font-black text-emerald-400 block font-mono">#402</span>
                                                        <span className="text-xl font-black text-emerald-400 block font-mono">#403</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900 rounded-xl p-3 border border-amber-500/40">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">⏳ In Preparation</span>
                                                    <div className="space-y-1">
                                                        <span className="text-xl font-black text-amber-400 block font-mono">#404</span>
                                                        <span className="text-xl font-black text-amber-400 block font-mono">#405</span>
                                                        <span className="text-xl font-black text-amber-400 block font-mono">#406</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {config.mockupType === 'cafes-bakeries' && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                        {/* Beverage Customizer */}
                                        <div className="md:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                <h4 className="font-black text-sm text-[#0A192F]">Artisan Coffee Customizer</h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800">Barista Tag</span>
                                            </div>
                                            <div className="space-y-2.5 text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-500 block mb-1">Size Option:</span>
                                                    <div className="flex gap-2">
                                                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">Small (250ml)</span>
                                                        <span className="px-3 py-1 rounded-lg bg-rose-50 text-[#FF2D55] font-black border border-rose-200">Regular (350ml) ✓</span>
                                                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">Large (+₹40)</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-500 block mb-1">Milk Preference:</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">Whole Dairy</span>
                                                        <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-black border border-amber-200">Oat Milk (+₹50) ✓</span>
                                                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">Almond (+₹50)</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-500 block mb-1">Add-on Flavors:</span>
                                                    <div className="flex gap-2">
                                                        <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-800 font-black border border-purple-200">+Madagascar Vanilla (+₹40) ✓</span>
                                                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">+Caramel</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bakery Showcase & Stamp Loyalty */}
                                        <div className="md:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                <span className="text-xs font-black text-slate-900">Morning Bakes &amp; Stamp Card</span>
                                                <span className="text-[10px] font-bold text-emerald-600">Fresh Batch 07:30 AM</span>
                                            </div>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between py-1 border-b border-slate-100">
                                                    <span className="font-bold text-slate-800">Butter Croissant</span>
                                                    <span className="font-mono text-emerald-700 font-bold">14 left in showcase</span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-slate-100">
                                                    <span className="font-bold text-slate-800">Blueberry Danish</span>
                                                    <span className="font-mono text-amber-700 font-bold">4 left (Reorder soon)</span>
                                                </div>
                                            </div>
                                            <div className="bg-[#FFF5F2] rounded-xl p-3 border border-rose-100 text-center space-y-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF2D55]">Customer Coffee Stamp Card</span>
                                                <p className="text-xs font-black text-slate-800">5 of 6 Coffees Purchased ☕☕☕☕☕</p>
                                                <span className="text-[10px] text-emerald-700 font-bold block">Next coffee is 100% Free!</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {config.mockupType === 'cloud-kitchens' && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                        {/* Multi-Brand Kitchen Order Dispatch */}
                                        <div className="md:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                <h4 className="font-black text-sm text-[#0A192F]">Central Kitchen Multi-Brand Queue</h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-[#FF2D55]">3 Virtual Brands Active</span>
                                            </div>
                                            <div className="space-y-2.5">
                                                {[
                                                    { brand: 'Royal Awadhi Biryani', order: '#RAB-902', items: '2x Dum Biryani, 1x Mirchi Salan', timer: '8m left', brandColor: 'bg-amber-100 text-amber-900 border-amber-200' },
                                                    { brand: 'Firehouse Smash Burgers', order: '#FSB-114', items: '1x Truffle Double, 1x Loaded Fries', timer: '4m left (Rush)', brandColor: 'bg-red-100 text-red-900 border-red-200' },
                                                    { brand: 'Zen Bowl Healthy Salads', order: '#ZBH-408', items: '1x Quinoa Avocado, 1x Green Cold Press', timer: '11m left', brandColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
                                                ].map((b, i) => (
                                                    <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.brandColor}`}>{b.brand}</span>
                                                                <span className="font-mono font-bold text-slate-500">{b.order}</span>
                                                            </div>
                                                            <span className="font-bold text-slate-800 block">{b.items}</span>
                                                        </div>
                                                        <span className="font-black text-rose-600 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs shrink-0">{b.timer}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rider Dispatch & Handover */}
                                        <div className="md:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                <span className="text-xs font-black text-slate-900">Rider Handover Bay</span>
                                                <span className="text-[10px] font-bold text-emerald-600">QC Verified</span>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                                                <div className="flex justify-between font-bold">
                                                    <span>Order #FSB-114 (Firehouse)</span>
                                                    <span className="text-emerald-700">✓ Sealed &amp; Tagged</span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 space-y-0.5">
                                                    <p>• Double Burger (Hot bag)</p>
                                                    <p>• Truffle Dip &amp; Extra Napkins included</p>
                                                    <p>• Delivery Rider: Rahul V. (Arrived outside)</p>
                                                </div>
                                                <button type="button" className="w-full py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors">
                                                    Scan &amp; Handover to Rider
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {config.mockupType === 'multi-outlet-chains' && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                        {/* Multi-Branch Consolidated Leaderboard */}
                                        <div className="md:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                <h4 className="font-black text-sm text-[#0A192F]">Chain-Wide Real-Time Revenue</h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">HQ Master View</span>
                                            </div>
                                            <div className="space-y-2.5 text-xs">
                                                {[
                                                    { outlet: 'Downtown Flagship Outlet', sales: '₹1,48,200 Today', orders: '382 Orders', status: 'Top Performer', color: 'text-emerald-600' },
                                                    { outlet: 'Airport T3 Express Hub', sales: '₹2,10,400 Today', orders: '540 Orders', status: 'High Velocity', color: 'text-indigo-600' },
                                                    { outlet: 'Tech Park Mall Outlet', sales: '₹94,800 Today', orders: '210 Orders', status: 'Normal Pace', color: 'text-slate-600' },
                                                    { outlet: 'Suburban Highway Diner', sales: '₹82,100 Today', orders: '190 Orders', status: 'Normal Pace', color: 'text-slate-600' },
                                                ].map((br, i) => (
                                                    <div key={i} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                                        <div>
                                                            <span className="font-black text-slate-900 block">{br.outlet}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{br.orders}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-black text-slate-900 block">{br.sales}</span>
                                                            <span className={`text-[10px] font-bold ${br.color}`}>{br.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Inter-Store Stock Transfer & Recipe Sync */}
                                        <div className="md:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                <span className="text-xs font-black text-slate-900">Inter-Branch Stock Transfer</span>
                                                <span className="text-[10px] font-bold text-indigo-600">In Transit</span>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                                                <div className="flex justify-between font-bold">
                                                    <span>Central Kitchen ➔ Airport T3</span>
                                                    <span className="text-indigo-700">Dispatch #GDN-408</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">
                                                    50 Kg Marinated Paneer + 30 L Signature Makhani Sauce dispatched via Cold Van #MH-02.
                                                </p>
                                                <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px] font-bold">
                                                    <span>Central Recipe Push:</span>
                                                    <span className="text-emerald-600">✓ All 4 Outlets Synced</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Format Metric Strip */}
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
                {/* 4. DEEP FEATURE SECTIONS (Format-Tailored 6 Pillar Grid) */}
                {/* ========================================================================= */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-[#FF2D55]">Specialized Functionality</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-[#0A192F] tracking-tight">
                            Everything You Need to Run {config.title}
                        </h2>
                        <p className="text-slate-600 font-medium text-sm sm:text-base">
                            Built with industry-tested best practices to solve real daily operating hurdles.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {config.features.map((feature, idx) => (
                            <div 
                                key={idx}
                                className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-rose-200 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#FFF1F1] text-[#FF2D55] flex items-center justify-center font-bold">
                                        <feature.icon size={20} />
                                    </div>
                                    <h3 className="text-lg font-black text-[#0A192F] tracking-tight leading-snug">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                                <ul className="space-y-2 pt-2 border-t border-slate-100">
                                    {feature.points.map((pt, pIdx) => (
                                        <li key={pIdx} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                                            <CheckCircle2 size={15} className="text-[#FF2D55] shrink-0 mt-0.5" />
                                            <span>{pt}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 5. WORKFLOW EXPLANATION SECTION (Step-by-Step Flow) */}
                {/* ========================================================================= */}
                <section className="bg-slate-50 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-200/80">
                    <div className="max-w-7xl mx-auto space-y-12">
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <span className="text-xs font-black uppercase tracking-wider text-[#FF2D55]">Operational Workflow</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#0A192F] tracking-tight">
                                How It Works from Start to Finish
                            </h2>
                            <p className="text-slate-600 text-sm font-medium">
                                A frictionless step-by-step cycle that keeps your team synchronized during every service shift.
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
                {/* 6. BENEFITS SECTION (6 Key Business Outcomes) */}
                {/* ========================================================================= */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#FF2D55]">Measurable Impact</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-[#0A192F] tracking-tight">
                            Key Benefits for {config.title}
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
                {/* 7. DARK SAAS METRICS BANNER */}
                {/* ========================================================================= */}
                <section className="bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center sm:text-left">
                        <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                            <span className="text-3xl sm:text-4xl font-black text-white">50,000+</span>
                            <span className="text-xs text-rose-400 font-bold block uppercase tracking-wider">Food Outlets Powered</span>
                            <p className="text-xs text-slate-400 pt-1">Across 40+ cities in India, UAE, and Southeast Asia.</p>
                        </div>
                        <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                            <span className="text-3xl sm:text-4xl font-black text-white">99.99%</span>
                            <span className="text-xs text-rose-400 font-bold block uppercase tracking-wider">Uptime Reliability</span>
                            <p className="text-xs text-slate-400 pt-1">Zero floor disruption even during peak Friday dinner rushes.</p>
                        </div>
                        <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                            <span className="text-3xl sm:text-4xl font-black text-white">15 Minutes</span>
                            <span className="text-xs text-rose-400 font-bold block uppercase tracking-wider">Staff Onboarding</span>
                            <p className="text-xs text-slate-400 pt-1">Intuitive touch screens require zero technical training.</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-3xl sm:text-4xl font-black text-white">24/7/365</span>
                            <span className="text-xs text-rose-400 font-bold block uppercase tracking-wider">Direct Specialist Support</span>
                            <p className="text-xs text-slate-400 pt-1">Dedicated restaurant hospitality engineers on phone and chat.</p>
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 8. INTERACTIVE DEMO BOOKING FORM (From Screenshot) */}
                {/* ========================================================================= */}
                <section id="demo-booking-section" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="bg-[#FFF5F2] border border-rose-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#FF2D55] text-xs font-bold shadow-xs">
                                <span>Schedule a Walkthrough</span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-[#0A192F]">
                                Experience RestoSys for {config.title}
                            </h3>
                            <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-lg mx-auto">
                                Speak with an industry specialist who understands the unique operational dynamics of your food service model.
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
                                        placeholder="e.g. Vikram Malhotra"
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
                                        placeholder="e.g. +91 98200 12345"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-1">
                                    <label className="text-xs font-black text-slate-700 block mb-1">Restaurant / Brand Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.restaurantName}
                                        onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                        placeholder="e.g. Trattoria Gourmet"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-700 block mb-1">City</label>
                                    <input 
                                        type="text" 
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="e.g. Mumbai / Delhi"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-700 block mb-1">Number of Outlets</label>
                                    <select
                                        value={formData.outletCount}
                                        onChange={(e) => setFormData({ ...formData, outletCount: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF2D55] focus:ring-2 focus:ring-[#FF2D55]/20"
                                    >
                                        <option value="1 Outlet">1 Outlet</option>
                                        <option value="2-5 Outlets">2 - 5 Outlets</option>
                                        <option value="6-15 Outlets">6 - 15 Outlets</option>
                                        <option value="16+ Outlets">16+ Outlets (Enterprise)</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 rounded-xl font-black text-base text-white bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] shadow-lg shadow-[#FF2D55]/25 transition-all cursor-pointer active:scale-98 disabled:opacity-70"
                            >
                                {submitting ? 'Connecting With Specialist...' : `Schedule Free 1-on-1 ${config.title} Walkthrough`}
                            </button>
                            <p className="text-center text-[11px] text-slate-400 font-medium">
                                Free guided demonstration • Customized to your kitchen format • Zero commitment
                            </p>
                        </form>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 9. FORMAT-SPECIFIC FAQ ACCORDION */}
                {/* ========================================================================= */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#FF2D55]">Common Queries</span>
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
                {/* 10. FINAL CALL TO ACTION SECTION */}
                {/* ========================================================================= */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] rounded-3xl p-8 sm:p-14 text-white text-center space-y-6 shadow-2xl shadow-rose-900/20 relative overflow-hidden">
                        <div className="max-w-2xl mx-auto space-y-3">
                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                                Ready to Transform Your {config.title}?
                            </h2>
                            <p className="text-rose-100 text-sm sm:text-base font-medium">
                                Join leading hospitality operators who rely on RestoSys to power their daily service.
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

export default OutletTypeLandingPage;
