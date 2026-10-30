import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const WhatsAppNotificationContext = createContext(null);

const DEFAULT_ALERTS = [
    {
        id: 'wa-alert-1',
        type: 'order',
        title: 'New QR Dine-In Order Placed',
        message: '🛎️ *NEW ORDER #ORD-1084* received from Table 04 (Dine-In)!\n• Items: 2x Paneer Butter Masala, 4x Garlic Naan, 2x Cold Lime Soda\n• Bill Amount: *₹1,320.00* (UPI Pre-Authorized)\n• Kitchen Station: North Indian Curry & Tandoor KDS notified.',
        recipient: 'Owner WhatsApp (+91 98765 43210)',
        time: 'Just now',
        timestamp: Date.now() - 1000 * 60 * 3,
        read: false,
        meta: { orderId: 'ORD-1084', amount: 1320, table: 'Table 04' }
    },
    {
        id: 'wa-alert-2',
        type: 'closing',
        title: 'Daily Executive Sales & GST Statement',
        message: '📊 *FOODNEST DAILY EXECUTIVE CLOSING SUMMARY*\n🗓️ Date: Today\n📍 Store: Downtown Gourmet Bistro #102\n\n• Gross Revenue: *₹1,24,917.00*\n• Net Bank Settlement: *₹1,14,461.15*\n• Total GST Collected (5%): *₹6,245.85*\n• Total Dining Orders: *342 Orders* | AOV: *₹365.00*\n• Food Cost (CoGS): 31.6% (Optimal)\n• Cash Drawer Balance: ₹19,976 (Zero variance)\n\n✅ Shift certified by Store Manager.',
        recipient: 'Owner WhatsApp (+91 98765 43210)',
        time: '18 mins ago',
        timestamp: Date.now() - 1000 * 60 * 18,
        read: false,
        meta: { amount: 124917, orders: 342 }
    },
    {
        id: 'wa-alert-3',
        type: 'inventory',
        title: 'Low Stock Safety Buffer Alert',
        message: '⚠️ *LOW STOCK CRITICAL WARNING*\nItem: Fresh Mozzarella Cheese (Grade A)\n• Current Stock: *4.0 Kg*\n• Minimum Buffer: *10.0 Kg*\n• Action: Auto Reorder Indent #PO-941 generated for Dairy Wholesale Co-op.',
        recipient: 'Owner WhatsApp (+91 98765 43210)',
        time: '42 mins ago',
        timestamp: Date.now() - 1000 * 60 * 42,
        read: true,
        meta: { item: 'Mozzarella Cheese', stock: '4 Kg' }
    },
    {
        id: 'wa-alert-4',
        type: 'customer',
        title: 'VIP Guest Anniversary Reservation',
        message: '🎉 *VIP GOLD DINER ARRIVAL NOTIFICATION*\nGuest: *Amit Sharma* (1,240 FoodNest Coins)\n• Reservation: Table 02 (Corner Window)\n• Occasion: 3rd Wedding Anniversary\n• Note: Complimentary dessert platter pre-assigned to order.',
        recipient: 'Owner WhatsApp (+91 98765 43210)',
        time: '1 hour ago',
        timestamp: Date.now() - 1000 * 60 * 65,
        read: true,
        meta: { guest: 'Amit Sharma', tier: 'VIP Gold' }
    }
];

export const WhatsAppNotificationProvider = ({ children }) => {
    // Persistent settings
    const [ownerPhone, setOwnerPhone] = useState(() => {
        return localStorage.getItem('restosys_owner_wa_phone') || '+91 98765 43210';
    });

    const [isSyncActive, setIsSyncActive] = useState(() => {
        const saved = localStorage.getItem('restosys_owner_wa_sync');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('restosys_owner_wa_sound');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [triggers, setTriggers] = useState(() => {
        const saved = localStorage.getItem('restosys_owner_wa_triggers');
        return saved ? JSON.parse(saved) : {
            newOrder: true,
            kotDelay: true,
            lowStock: true,
            dailyClosing: true,
            vipArrival: true
        };
    });

    // Alert feed state
    const [alerts, setAlerts] = useState(() => {
        const saved = localStorage.getItem('restosys_owner_wa_alerts');
        return saved ? JSON.parse(saved) : DEFAULT_ALERTS;
    });

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activePopup, setActivePopup] = useState(null);

    // Save state on change
    useEffect(() => {
        localStorage.setItem('restosys_owner_wa_phone', ownerPhone);
    }, [ownerPhone]);

    useEffect(() => {
        localStorage.setItem('restosys_owner_wa_sync', JSON.stringify(isSyncActive));
    }, [isSyncActive]);

    useEffect(() => {
        localStorage.setItem('restosys_owner_wa_sound', JSON.stringify(isSoundEnabled));
    }, [isSoundEnabled]);

    useEffect(() => {
        localStorage.setItem('restosys_owner_wa_triggers', JSON.stringify(triggers));
    }, [triggers]);

    useEffect(() => {
        localStorage.setItem('restosys_owner_wa_alerts', JSON.stringify(alerts));
    }, [alerts]);

    // Synthesize realistic WhatsApp notification chime via Web Audio API
    const playChime = useCallback(() => {
        if (!isSoundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;

            // Tone 1 (soft bell)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // A5
            gain1.gain.setValueAtTime(0.12, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.18);

            // Tone 2 (higher ping)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6
            gain2.gain.setValueAtTime(0.18, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.4);
        } catch (e) {
            console.log('Notification chime muted by browser policy', e);
        }
    }, [isSoundEnabled]);

    // Trigger an alert programmatically
    const triggerAlert = useCallback(({ title, message, type = 'order', recipient, meta = {} }) => {
        if (!isSyncActive) return;

        const newAlert = {
            id: `wa-alert-${Date.now()}`,
            type,
            title,
            message,
            recipient: recipient || `Owner WhatsApp (${ownerPhone})`,
            time: 'Just now',
            timestamp: Date.now(),
            read: false,
            meta
        };

        setAlerts(prev => [newAlert, ...prev]);
        setActivePopup(newAlert);
        playChime();

        // Auto dismiss popup after 7 seconds
        setTimeout(() => {
            setActivePopup(current => (current?.id === newAlert.id ? null : current));
        }, 7000);
    }, [isSyncActive, ownerPhone, playChime]);

    // Test alert generator
    const triggerTestNotification = useCallback(() => {
        const orderNumber = Math.floor(1000 + Math.random() * 9000);
        const tableNumber = Math.floor(1 + Math.random() * 12);
        const amount = Math.floor(650 + Math.random() * 1800);

        triggerAlert({
            title: `Live Order #${orderNumber} Placed`,
            message: `🛎️ *LIVE DINE-IN ORDER #${orderNumber}*\n• Table: Table 0${tableNumber} (Ground Floor)\n• Subtotal: *₹${amount.toLocaleString('en-IN')}*\n• Payment: UPI QR Instant Settled ✓\n• KDS Station: Dispatch to Grill & Curry Kitchen.`,
            type: 'order',
            meta: { orderId: `ORD-${orderNumber}`, amount, table: `Table ${tableNumber}` }
        });
        toast.success(`WhatsApp ping dispatched to ${ownerPhone}!`, { icon: '📲' });
    }, [triggerAlert, ownerPhone]);

    // Dispatch real-time daily closing summary
    const dispatchDailyClosingSummary = useCallback((customData = {}) => {
        const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const revenue = customData.revenue || 124917;
        const orders = customData.orders || 342;
        const net = customData.net || 114461;

        const msg = 
`📊 *FOODNEST DAILY EXECUTIVE CLOSING SUMMARY*
🗓️ Date: ${dateStr}
📍 Store: Downtown Gourmet Bistro #102

💰 *FINANCIAL SNAPSHOT*
• Gross Sales: *₹${revenue.toLocaleString('en-IN')}*
• Net Bank Payout: *₹${net.toLocaleString('en-IN')}*
• GST Collected (5%): *₹${Math.round(revenue * 0.05).toLocaleString('en-IN')}*
• Total Orders Settled: *${orders} Orders*
• Food Cost (CoGS): 31.6% (Within Budget)
• Cash Counter Reconciled: ₹19,976.00 (Zero Variance)

✅ All shifts closed and reconciled. Daily audit certified by FoodNest Cloud.`;

        triggerAlert({
            title: 'Daily Closing P&L Dispatched',
            message: msg,
            type: 'closing',
            meta: { amount: revenue, orders }
        });

        toast.success(`Nightly closing report sent to owner WhatsApp: ${ownerPhone}`);
    }, [triggerAlert, ownerPhone]);

    // Send direct WhatsApp chat with client/staff
    const sendDirectMessage = useCallback(({ phone, message }) => {
        if (!phone) {
            toast.error('Please specify a recipient phone number');
            return;
        }
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        const encoded = encodeURIComponent(message);
        const url = `https://api.whatsapp.com/send?phone=${cleanPhone.replace('+', '')}&text=${encoded}`;
        window.open(url, '_blank');

        // Log this outgoing message
        const outgoingAlert = {
            id: `wa-out-${Date.now()}`,
            type: 'customer',
            title: `Direct WhatsApp Chat to ${cleanPhone}`,
            message: message,
            recipient: `Recipient: ${cleanPhone}`,
            time: 'Just now',
            timestamp: Date.now(),
            read: true,
            meta: { outgoing: true, phone: cleanPhone }
        };
        setAlerts(prev => [outgoingAlert, ...prev]);
        toast.success(`Launched WhatsApp chat with ${cleanPhone}!`, { icon: '💬' });
    }, []);

    const markAllRead = useCallback(() => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    }, []);

    const markAsRead = useCallback((id) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    }, []);

    const deleteAlert = useCallback((id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);

    const clearAllAlerts = useCallback(() => {
        setAlerts([]);
        toast('WhatsApp alert log cleared', { icon: '🧹' });
    }, []);

    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <WhatsAppNotificationContext.Provider value={{
            ownerPhone,
            setOwnerPhone,
            isSyncActive,
            setIsSyncActive,
            isSoundEnabled,
            setIsSoundEnabled,
            triggers,
            setTriggers,
            alerts,
            unreadCount,
            isDrawerOpen,
            setIsDrawerOpen,
            activePopup,
            setActivePopup,
            triggerAlert,
            triggerTestNotification,
            dispatchDailyClosingSummary,
            sendDirectMessage,
            markAllRead,
            markAsRead,
            deleteAlert,
            clearAllAlerts,
            playChime
        }}>
            {children}
        </WhatsAppNotificationContext.Provider>
    );
};

export const useWhatsAppNotifications = () => {
    const context = useContext(WhatsAppNotificationContext);
    if (!context) {
        throw new Error('useWhatsAppNotifications must be used within a WhatsAppNotificationProvider');
    }
    return context;
};
