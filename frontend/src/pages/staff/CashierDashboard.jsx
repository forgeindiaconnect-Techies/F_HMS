import { useState, useEffect, useRef } from 'react';
import { 
    Receipt, CreditCard, Banknote, QrCode, 
    Calculator, Split, Printer, CheckCircle, 
    ArrowLeftRight, Tag, Undo2, Coins, Landmark,
    ChevronDown, ChevronUp, Clock, Utensils, Plus, Sparkles,
    ShoppingBag, History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/axiosInstance';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';
import KOTPrintModal from '../../components/KOTPrintModal';

const CashierDashboard = () => {
    const { api, restaurant } = useAuth();
    const [queue, setQueue] = useState([]);
    const [selfPickupQueue, setSelfPickupQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('Pending');
    const [activeBill, setActiveBill] = useState(null);
    const [printModalKOT, setPrintModalKOT] = useState(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Card');
    const [isSplit, setIsSplit] = useState(false);
    const [splitParts, setSplitParts] = useState(1);
    const [settled, setSettled] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const [isMerging, setIsMerging] = useState(false);
    const [mergeTargetId, setMergeTargetId] = useState('');
    const [autoPrintBillEnabled, setAutoPrintBillEnabled] = useState(() => localStorage.getItem('resto_cashier_autoprint') !== 'false');
    const [searchQuery, setSearchQuery] = useState('');
    const seenPrintedOrdersRef = useRef(new Set());

    useEffect(() => {
        const handleSearch = (e) => {
            setSearchQuery(e.detail || '');
        };
        window.addEventListener('cashier-search', handleSearch);
        return () => window.removeEventListener('cashier-search', handleSearch);
    }, []);

    const pmConfig = restaurant?.restaurantConfig?.paymentMethods || { cash: true, upi: true, card: true, onlineGateway: true };
    const availableMethods = [
        { id: 'Card', icon: <CreditCard size={18} />, enabled: pmConfig.card !== false },
        { id: 'Cash', icon: <Banknote size={18} />, enabled: pmConfig.cash !== false },
        { id: 'UPI', icon: <QrCode size={18} />, enabled: pmConfig.upi !== false },
        { id: 'Online', icon: <Landmark size={18} />, enabled: pmConfig.onlineGateway !== false }
    ].filter(m => m.enabled);

    useEffect(() => {
        if (availableMethods.length > 0 && !availableMethods.some(m => m.id === paymentMethod)) {
            setPaymentMethod(availableMethods[0].id);
        }
    }, [restaurant?.restaurantConfig?.paymentMethods]);

    // Search filter helper
    const filterBills = (list) => {
        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase().trim();
        return list.filter(b => {
            const id = (b._id || '').toLowerCase();
            const table = String(b.tableNumber || '').toLowerCase();
            const cust = (b.customerName || '').toLowerCase();
            const phone = (b.customerPhone || '').toLowerCase();
            const kot = (b.kotNumbers || []).join(' ').toLowerCase();
            return id.includes(q) || table.includes(q) || cust.includes(q) || phone.includes(q) || kot.includes(q);
        });
    };

    // Helper function for identifying self-pickup / takeout orders
    const isSelfOrder = (o) => {
        if (!o) return false;
        const type = String(o.orderType || '').toLowerCase();
        return type.includes('pickup') || type.includes('takeaway') || type.includes('takeout') || type.includes('self') || (!o.tableNumber && type !== 'dine in' && type !== 'dine-in');
    };

    // Fetch orders on load & refresh
    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            if (Array.isArray(data)) {
                const pendingOrders = data.filter(o => !isSelfOrder(o) && o.status !== 'Completed' && ['Served', 'Billing Requested', 'Delivered', 'Ready', 'Billing', 'Preparing', 'Pending'].includes(o.status));
                const pickupOrders = data.filter(o => isSelfOrder(o) && o.status !== 'Completed');
                const paidOrders = data.filter(o => o.status === 'Completed');

                setQueue(pendingOrders);
                setSelfPickupQueue(pickupOrders);
                setHistory(paidOrders);

                // Auto-select active bill so right console is always informative and never blank
                setActiveBill(prev => {
                    if (prev) {
                        const found = data.find(o => o._id === prev._id);
                        if (found) return found;
                    }
                    if (activeTab === 'Pending') return pendingOrders[0] || null;
                    if (activeTab === 'Self-Pickup') return pickupOrders[0] || null;
                    if (activeTab === 'Paid') return paidOrders[0] || null;
                    return null;
                });
            }
        } catch (error) {
            console.error('Failed to fetch orders', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);

        let ws;
        const connectWS = () => {
            try {
                let baseURL = getApiUrl();
                let wsURL = baseURL.replace(/^http/, 'ws').replace(/\/api$/, '');
                ws = new WebSocket(wsURL);

                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        type: 'register',
                        role: 'cashier'
                    }));
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (['new_order', 'order_updated', 'new_notification', 'order_status_updated'].includes(msg.type)) {
                            fetchOrders();

                            const orderData = msg.data?.orderData || msg.data;
                            if (msg.type === 'new_order' && orderData && orderData._id) {
                                if (!seenPrintedOrdersRef.current.has(orderData._id)) {
                                    seenPrintedOrdersRef.current.add(orderData._id);
                                    if (autoPrintBillEnabled) {
                                        autoPrintCashierBill(orderData);
                                    }
                                }
                            }

                            if (msg.type === 'order_status_updated' || msg.type === 'new_notification') {
                                const status = orderData?.status;
                                if (status === 'Picked Up' || status === 'Ready for Pickup') {
                                    const ticketNum = orderData?._id ? String(orderData._id).substring(String(orderData._id).length - 5).toUpperCase() : 'ALERT';
                                    
                                    try {
                                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                                        const osc = audioCtx.createOscillator();
                                        const gain = audioCtx.createGain();
                                        osc.type = 'sine';
                                        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                                        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);
                                        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
                                        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                                        osc.connect(gain);
                                        gain.connect(audioCtx.destination);
                                        osc.start();
                                        osc.stop(audioCtx.currentTime + 0.4);
                                    } catch (e) {}

                                    setActiveTab('Self-Pickup');
                                    toast.success(`📦 SELF-PICKUP QUEUE: Order #${ticketNum} arrived at Cashier counter!`, {
                                        id: `cashier-pickup-${orderData?._id || Date.now()}`,
                                        duration: 8000,
                                        position: 'top-right'
                                    });
                                }
                            }
                        }
                    } catch (e) {}
                };

                ws.onclose = () => {
                    setTimeout(connectWS, 5000);
                };
            } catch (e) {}
        };

        connectWS();

        return () => {
            clearInterval(interval);
            if (ws) ws.close();
        };
    }, [api]);

    // Pathname check to dynamically switch states on sidebar clicks
    useEffect(() => {
        const path = window.location.pathname;
        if (path.includes('/cashier/history') || path.includes('/cashier/refunds') || path.includes('/cashier/summary')) {
            setActiveTab('Paid');
        } else {
            setActiveTab('Pending');
        }

        if (path.includes('/cashier/split')) {
            setIsSplit(true);
        } else {
            setIsSplit(false);
        }

        if (path.includes('/cashier/merge')) {
            setIsMerging(true);
        } else {
            setIsMerging(false);
        }
    }, [window.location.pathname]);

    // Calculate subtotal, discount, tax, totals
    const subtotal = activeBill ? activeBill.orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0) : 0;
    const discountAmount = subtotal * (discount / 100);
    const taxAmount = (subtotal - discountAmount) * 0.05;
    const total = subtotal - discountAmount + taxAmount;

    // Settle payment action
    const handleSelectBill = (bill) => {
        setActiveBill(bill);
        setDiscount(0);
        setPaymentMethod('Card');
        setIsSplit(false);
        setSplitParts(1);
        setSettled(false);
    };

    // Helper to render each high-visibility bill card in the left queue
    const renderBillCard = (bill) => {
        const isSelected = activeBill?._id === bill._id;
        const hasTable = bill.tableNumber && bill.tableNumber !== 'Any' && bill.tableNumber !== 'Takeout';
        const tableTitle = hasTable 
            ? (bill.tableNumber.startsWith('Table') ? bill.tableNumber : `Table ${bill.tableNumber}`) 
            : (isSelfOrder(bill) ? '📦 Self-Pickup Counter' : (bill.orderType || 'Counter'));

        const displayKot = (bill.kotNumbers && bill.kotNumbers.length > 0)
            ? bill.kotNumbers.join(', ')
            : `KOT-${bill._id.substring(bill._id.length - 4).toUpperCase()}`;

        const getStatusBadge = (status) => {
            switch (status) {
                case 'Ready':
                case 'Ready for Pickup':
                    return 'bg-emerald-600 text-white font-black animate-pulse shadow-xs';
                case 'Preparing':
                case 'In Kitchen':
                    return 'bg-blue-600 text-white font-extrabold shadow-xs';
                case 'Served':
                    return 'bg-purple-600 text-white font-extrabold shadow-xs';
                case 'Billing Requested':
                case 'Billing':
                    return 'bg-rose-600 text-white font-black shadow-xs';
                case 'Completed':
                case 'Paid':
                    return 'bg-slate-700 text-white font-bold';
                default: // Pending / Placed
                    return 'bg-amber-500 text-slate-950 font-black shadow-xs';
            }
        };

        const itemCount = bill.orderItems?.reduce((sum, it) => sum + (it.qty || 1), 0) || bill.orderItems?.length || 0;
        const itemsPreview = bill.orderItems?.map(it => `${it.qty}× ${it.name}`).slice(0, 2).join(', ');
        const moreCount = (bill.orderItems?.length || 0) > 2 ? ` +${bill.orderItems.length - 2} more` : '';
        const timeFormatted = bill.createdAt 
            ? new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

        return (
            <button
                key={bill._id}
                onClick={() => handleSelectBill(bill)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col gap-2.5 cursor-pointer ${
                    isSelected
                    ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 shadow-lg ring-2 ring-emerald-500/25 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 hover:shadow-md'
                }`}
            >
                {/* Top Row: Table Name & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base font-black text-slate-900 dark:text-white truncate">
                            {tableTitle}
                        </span>
                        {bill.serviceType === 'Self Dine-In (KFC Style)' && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                                Self Dine-In
                            </span>
                        )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide shrink-0 ${getStatusBadge(bill.status)}`}>
                        {bill.status || 'Pending'}
                    </span>
                </div>

                {/* Second Row: KOT Tag & Order Ref & Customer */}
                <div className="flex items-center justify-between text-xs gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[11px] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2.5 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                            <span>🎟️</span>
                            <span>{displayKot}</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                            #{bill._id.substring(bill._id.length - 6).toUpperCase()}
                        </span>
                    </div>
                    {bill.customerName && (
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                            👤 {bill.customerName}
                        </span>
                    )}
                </div>

                {/* Items Summary Snippet */}
                {bill.orderItems && bill.orderItems.length > 0 && (
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 truncate">
                        <span className="font-black text-slate-900 dark:text-white">{itemCount} items: </span>
                        <span>{itemsPreview}{moreCount}</span>
                    </div>
                )}

                {/* Bottom Row: Grand Total & Time */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total:</span>
                        <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            ₹{(bill.totalPrice || 0).toFixed(2)}
                        </span>
                    </div>
                    {timeFormatted && (
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> {timeFormatted}
                        </span>
                    )}
                </div>
            </button>
        );
    };

    const handleSettle = async () => {
        if (!activeBill) return;
        setSettled(true);
        try {
            const finalMethod = isSplit ? `Split (${splitParts} parts)` : paymentMethod;
            await api.put(`/orders/${activeBill._id}/pay`, {
                paymentMethod: finalMethod,
                taxPrice: taxAmount,
                totalPrice: total
            });
            await api.put(`/orders/${activeBill._id}/status`, { status: 'Completed' });
            
            handlePrintReceipt({
                ...activeBill,
                paymentMethod: finalMethod,
                taxPrice: taxAmount,
                totalPrice: total,
                paidAt: new Date()
            });

            toast.success('Payment successfully processed!');
            setTimeout(() => {
                setActiveBill(null);
                setSettled(false);
                fetchOrders();
            }, 2000);
        } catch (error) {
            console.error('Failed to settle bill', error);
            setSettled(false);
            toast.error('Payment failed');
        }
    };

    // Self-pickup counter completion
    const handleCompletePickup = async () => {
        if (!activeBill) return;
        setSettled(true);
        try {
            const finalMethod = activeBill.isPaid ? (activeBill.paymentMethod || 'Online') : paymentMethod;
            if (!activeBill.isPaid) {
                await api.put(`/orders/${activeBill._id}/pay`, {
                    paymentMethod: finalMethod,
                    taxPrice: taxAmount,
                    totalPrice: total
                });
            }
            
            await api.put(`/orders/${activeBill._id}/status`, { status: 'Completed' });

            handlePrintReceipt({
                ...activeBill,
                paymentMethod: finalMethod,
                taxPrice: taxAmount,
                totalPrice: total,
                paidAt: new Date()
            });

            toast.success('Order completed and handed over.');
            setTimeout(() => {
                setActiveBill(null);
                setSettled(false);
                fetchOrders();
            }, 2000);
        } catch (error) {
            console.error('Failed to complete pickup', error);
            setSettled(false);
            toast.error('Failed to complete handover');
        }
    };

    // Merge active bill with another
    const handleMergeBill = async () => {
        if (!activeBill || !mergeTargetId) return;
        try {
            const res = await api.post(`/orders/merge`, {
                sourceOrderId: activeBill._id,
                targetOrderId: mergeTargetId
            });
            toast.success('Bills merged successfully');
            setIsMerging(false);
            setActiveBill(null);
            fetchOrders();
        } catch (error) {
            console.error('Failed to merge bills', error);
            toast.error(error.response?.data?.message || 'Merge failed. Please verify orders.');
        }
    };


    // Print KOT Ticket Modal Trigger
    const handlePrintKOT = async (bill) => {
        if (!bill) return;
        try {
            const res = await api.get(`/kot?orderId=${bill._id}`).catch(() => null);
            if (res && res.data && res.data.length > 0) {
                setPrintModalKOT(res.data[0]);
                return;
            }
        } catch (e) {}

        const kotNum = bill.kotNumbers?.[0] || `KOT-${bill._id.substring(bill._id.length - 4).toUpperCase()}`;
        setPrintModalKOT({
            _id: bill._id,
            kotNumber: kotNum,
            orderId: bill._id,
            orderNumber: `#${bill._id.substring(bill._id.length - 5).toUpperCase()}`,
            tableNumber: bill.tableNumber || (bill.orderType === 'Delivery' ? 'Delivery' : 'Counter'),
            orderType: bill.orderType || 'Dine In',
            serviceType: bill.serviceType,
            customerName: bill.customerName,
            kitchenStation: 'Main Kitchen',
            items: (bill.orderItems || []).map(i => ({
                name: i.name,
                quantity: i.qty || i.quantity || 1,
                notes: i.notes || ''
            })),
            notes: bill.notes,
            createdAt: bill.createdAt || new Date().toISOString()
        });
    };

    // Refund a previously paid transaction
    const handleRefund = async (id) => {
        try {
            await api.put(`/orders/${id}/refund`);
            toast.success('Refund processed successfully');
            setActiveBill(null);
            fetchOrders();
        } catch (error) {
            console.error('Failed to process refund', error);
            toast.error('Refund failed');
        }
    };

    const toggleAutoPrintBill = () => {
        setAutoPrintBillEnabled(prev => {
            const next = !prev;
            localStorage.setItem('resto_cashier_autoprint', String(next));
            toast.success(next ? 'Auto-print on new orders enabled' : 'Auto-print disabled');
            return next;
        });
    };

    // Auto-Print Cashier Bill via hidden iframe to bypass popup blockers
    const autoPrintCashierBill = (receipt) => {
        if (!receipt) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
        } catch (e) {}

        const ticketNum = receipt._id ? String(receipt._id).slice(-5).toUpperCase() : 'NEW';
        toast.success(`🖨️ Auto-Printed Bill Receipt for Order #${ticketNum}${receipt.tableNumber ? ` (Table ${receipt.tableNumber})` : ''}`, {
            id: `cashier-autoprint-${receipt._id}`,
            duration: 6000,
            icon: '🧾'
        });

        const items = receipt.orderItems || [];
        const itemsHtml = items.map(item => `
            <tr style="border-bottom: 1px dashed #ddd;">
                <td style="padding: 5px 0; font-weight: bold;">${item.qty}x ${item.name}</td>
                <td style="text-align: right; padding: 5px 0; font-family: monospace;">₹${((item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
            </tr>
        `).join('');

        const subtotal = items.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 1), 0);
        const tax = receipt.taxPrice || 0;
        const tip = receipt.tipAmount || 0;
        const total = receipt.totalPrice || (subtotal + tax + tip);

        const printContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Bill Receipt #${ticketNum}</title>
                    <style>
                        @page { size: 80mm auto; margin: 4mm; }
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            width: 78mm;
                            max-width: 78mm;
                            margin: 0 auto;
                            padding: 8px 4px;
                            font-size: 13px;
                            line-height: 1.3;
                            color: #000;
                        }
                        .center { text-align: center; }
                        .line { border-bottom: 1px dashed #000; margin: 8px 0; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="center">
                        <h2 style="margin: 0; font-size: 18px; font-weight: 900;">RESTOSYS POS</h2>
                        <p style="margin: 3px 0; font-weight: bold;">OFFICIAL BILL RECEIPT</p>
                        <p style="margin: 2px 0;">Order #${ticketNum}</p>
                        <p style="margin: 2px 0; font-weight: bold;">${receipt.orderType || 'Dine In'} ${receipt.tableNumber ? `• Table ${receipt.tableNumber}` : ''}</p>
                        ${receipt.customerName ? `<p style="margin: 2px 0;">Guest: ${receipt.customerName}</p>` : ''}
                    </div>
                    <div class="line"></div>
                    <table>
                        ${itemsHtml}
                    </table>
                    <div class="line"></div>
                    <table>
                        <tr><td>Subtotal</td><td style="text-align: right;">₹${subtotal.toFixed(2)}</td></tr>
                        ${tax > 0 ? `<tr><td>Tax</td><td style="text-align: right;">₹${tax.toFixed(2)}</td></tr>` : ''}
                        ${tip > 0 ? `<tr><td>Staff Tip</td><td style="text-align: right;">₹${tip.toFixed(2)}</td></tr>` : ''}
                        <tr style="font-weight: 900; font-size: 14px;"><td>Grand Total</td><td style="text-align: right;">₹${total.toFixed(2)}</td></tr>
                    </table>
                    <div class="line"></div>
                    <div class="center" style="font-size: 11px;">
                        Payment: ${receipt.paymentMethod || 'Pay at Counter / Waiter'}<br/>
                        Status: ${receipt.isPaid ? 'PAID & SETTLED' : 'PAYMENT DUE'}<br/>
                        Date: ${new Date(receipt.createdAt || Date.now()).toLocaleString()}<br/><br/>
                        Thank you for dining with us!
                    </div>
                </body>
            </html>
        `;

        let printFrame = document.getElementById('cashier-auto-print-frame');
        if (!printFrame) {
            printFrame = document.createElement('iframe');
            printFrame.id = 'cashier-auto-print-frame';
            printFrame.style.position = 'fixed';
            printFrame.style.right = '0';
            printFrame.style.bottom = '0';
            printFrame.style.width = '0';
            printFrame.style.height = '0';
            printFrame.style.border = '0';
            document.body.appendChild(printFrame);
        }
        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(printContent);
        frameDoc.close();
        setTimeout(() => {
            try {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
            } catch (e) {
                console.error('Auto print trigger error:', e);
            }
        }, 400);
    };

    // Invoice generator (print receipt window)
    const handlePrintReceipt = (receipt) => {
        if (!receipt) return;
        const printWindow = window.open('', '_blank');
        const itemsHtml = receipt.orderItems.map(item => `
            <tr style="border-bottom: 1px dashed #eee;">
                <td style="padding: 6px 0;">${item.qty}x ${item.name}</td>
                <td style="text-align: right; padding: 6px 0;">₹${(item.price * item.qty).toFixed(2)}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Bill Receipt #${receipt._id.substring(receipt._id.length - 6).toUpperCase()}</title>
                    <style>
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            width: 300px;
                            margin: 0 auto;
                            padding: 20px 10px;
                            font-size: 13px;
                        }
                        .center { text-align: center; }
                        .line { border-bottom: 1px dashed #000; margin: 12px 0; }
                    </style>
                </head>
                <body>
                    <div class="center">
                        <h2 style="margin: 0;">RESTOSYS POS</h2>
                        <p style="margin: 5px 0;">INVOICE RECEIPTS</p>
                        <p style="margin: 2px 0;">ID: #${receipt._id.toUpperCase()}</p>
                        <p style="margin: 2px 0;">Type: ${receipt.orderType} ${receipt.tableNumber ? `(Table ${receipt.tableNumber})` : ''}</p>
                    </div>
                    <div class="line"></div>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${itemsHtml}
                    </table>
                    <div class="line"></div>
                    <table style="width: 100%;">
                        <tr><td>Subtotal</td><td style="text-align: right;">₹${(receipt.totalPrice - (receipt.taxPrice || 0)).toFixed(2)}</td></tr>
                        <tr><td>Tax (5%)</td><td style="text-align: right;">₹${(receipt.taxPrice || 0).toFixed(2)}</td></tr>
                        <tr style="font-weight: bold; font-size: 15px;"><td>Grand Total</td><td style="text-align: right;">₹${receipt.totalPrice.toFixed(2)}</td></tr>
                    </table>
                    <div class="line"></div>
                    <div class="center">
                        Paid via: ${receipt.paymentMethod || 'Settled'}<br/>
                        Date: ${new Date(receipt.paidAt || new Date()).toLocaleString()}<br/><br/>
                        Thank you for dining with us!
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Calculate Cash summaries for the daily drawer
    const cashSummary = history.reduce((acc, curr) => {
        const amt = curr.totalPrice || 0;
        const method = curr.paymentMethod || 'Online';
        if (method.includes('Cash')) acc.cash += amt;
        else if (method.includes('Card')) acc.card += amt;
        else if (method.includes('UPI')) acc.upi += amt;
        else acc.online += amt;
        acc.total += amt;
        return acc;
    }, { cash: 0, card: 0, upi: 0, online: 0, total: 0 });

    const path = window.location.pathname;
    let currentView = 'billing';
    if (path.includes('/cashier/invoices')) currentView = 'invoices';
    else if (path.includes('/cashier/split')) currentView = 'split';
    else if (path.includes('/cashier/merge')) currentView = 'merge';
    else if (path.includes('/cashier/discounts')) currentView = 'discounts';
    else if (path.includes('/cashier/collection')) currentView = 'collection';
    else if (path.includes('/cashier/refunds')) currentView = 'refunds';
    else if (path.includes('/cashier/summary')) currentView = 'summary';
    else if (path.includes('/cashier/history')) currentView = 'history';

    if (currentView === 'split') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Split Bill Workspace</h2>
                    <p className="text-gray-500 mt-1">Configure and divide active dine-in table bills among guests.</p>
                </div>

                {!activeBill ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Select Active Table to Split</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {queue.map(bill => (
                                    <button
                                        key={bill._id}
                                        onClick={() => { setActiveBill(bill); setSplitParts(2); }}
                                        className="p-5 rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-purple-500 bg-white dark:bg-slate-900 transition-all text-left space-y-2 group hover:scale-[1.02]"
                                    >
                                        <p className="font-bold text-gray-950 dark:text-white group-hover:text-purple-650">Table {bill.tableNumber || 'Any'}</p>
                                        <p className="text-[10px] text-gray-400 font-mono">#{bill._id.substring(bill._id.length - 6).toUpperCase()}</p>
                                        <p className="text-sm font-black text-green-700 dark:text-green-400 mt-2">₹{bill.totalPrice.toFixed(2)}</p>
                                    </button>
                                ))}
                                {queue.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-gray-400 font-semibold">No active dine-in bills to split.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
                                <h3 className="font-black text-gray-900 dark:text-white font-sans text-base">Table {activeBill.tableNumber || 'Any'} Items</h3>
                                <button onClick={() => setActiveBill(null)} className="text-xs text-purple-600 font-bold hover:underline">← Back to Tables</button>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                                {activeBill.orderItems.map((item, idx) => (
                                    <div key={idx} className="py-3 flex justify-between text-gray-900 dark:text-gray-300">
                                        <span className="font-semibold">{item.qty}x {item.name}</span>
                                        <span className="font-extrabold">₹{(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t dark:border-slate-800 pt-4 flex justify-between font-bold text-sm">
                                <span className="text-gray-800 dark:text-white font-sans">Grand Total</span>
                                <span className="text-green-700 dark:text-green-400">₹{activeBill.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Configure Split</h3>
                            
                            <div className="space-y-2 min-w-0 pr-1.5 flex-1">
                                <label className="text-xs text-gray-400 font-bold block">Number of Split Parts</label>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setSplitParts(Math.max(1, splitParts - 1))} className="w-10 h-10 border dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-805 text-gray-850 dark:text-white font-bold flex items-center justify-center">-</button>
                                    <span className="font-black text-lg text-gray-900 dark:text-white">{splitParts}</span>
                                    <button type="button" onClick={() => setSplitParts(splitParts + 1)} className="w-10 h-10 border dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-805 text-gray-850 dark:text-white font-bold flex items-center justify-center">+</button>
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-1">
                                <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-black">Amount per Person</p>
                                <p className="text-2xl font-black text-purple-950 dark:text-purple-100">₹{(activeBill.totalPrice / splitParts).toFixed(2)}</p>
                            </div>

                            <button
                                onClick={handleSettle}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                            >
                                Settle Split Payment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (currentView === 'merge') {
        const sourceBill = activeBill;
        const targetBill = queue.find(q => q._id === mergeTargetId);
        
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Merge Bills & Tables</h2>
                    <p className="text-gray-500 mt-1">Combine two active table bills into a single invoice.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Select Tables to Merge</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 min-w-0 pr-1.5 flex-1">
                                <label className="text-xs text-gray-400 font-bold block">Source Table (Bill to merge from)</label>
                                <select 
                                    value={activeBill?._id || ''} 
                                    onChange={(e) => setActiveBill(queue.find(q => q._id === e.target.value) || null)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white font-semibold focus:outline-none"
                                >
                                    <option value="">Select Table</option>
                                    {queue.map(q => (
                                        <option key={q._id} value={q._id}>Table {q.tableNumber || 'Any'} (₹{q.totalPrice.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 min-w-0 pr-1.5 flex-1">
                                <label className="text-xs text-gray-400 font-bold block">Target Table (Bill to merge into)</label>
                                <select 
                                    value={mergeTargetId} 
                                    onChange={(e) => setMergeTargetId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-805 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white font-semibold focus:outline-none"
                                >
                                    <option value="">Select Table</option>
                                    {queue.filter(q => q._id !== activeBill?._id).map(q => (
                                        <option key={q._id} value={q._id}>Table {q.tableNumber || 'Any'} (₹{q.totalPrice.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {sourceBill && targetBill && (
                            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/50 rounded-xl space-y-4 text-xs">
                                <h4 className="font-bold text-orange-850 dark:text-orange-300">Merge Preview Summary</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                        <p className="font-bold text-gray-400">Source Table {sourceBill.tableNumber}</p>
                                        <p className="font-black text-gray-900 dark:text-white">₹{sourceBill.totalPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                        <p className="font-bold text-gray-400">Target Table {targetBill.tableNumber}</p>
                                        <p className="font-black text-gray-900 dark:text-white">₹{targetBill.totalPrice.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="border-t border-orange-200/50 dark:border-orange-900/40 pt-3 flex justify-between font-bold text-sm">
                                    <span>Combined Total Invoice</span>
                                    <span className="text-green-700 dark:text-green-400">₹{(sourceBill.totalPrice + targetBill.totalPrice).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                        <div className="space-y-3 min-w-0 pr-1.5 flex-1">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Confirm Merge</h3>
                            <p className="text-xs text-gray-450 leading-relaxed">Merging combines all items from the Source table into the Target table. The Source table will then be freed up.</p>
                        </div>
                        <button
                            onClick={handleMergeBill}
                            disabled={!activeBill || !mergeTargetId}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50 text-xs"
                        >
                            Merge Tables
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'discounts') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Discount & Promotion Center</h2>
                    <p className="text-gray-500 mt-1">Apply percentage deductions or promotional discounts to active table invoices.</p>
                </div>

                {!activeBill ? (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Select Active Table to Apply Discount</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {queue.map(bill => (
                                <button
                                    key={bill._id}
                                    onClick={() => { setActiveBill(bill); setDiscount(10); }}
                                    className="p-5 rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-purple-500 bg-white dark:bg-slate-900 transition-all text-left space-y-2 group hover:scale-[1.02]"
                                >
                                    <p className="font-bold text-gray-955 dark:text-white group-hover:text-purple-600">Table {bill.tableNumber || 'Any'}</p>
                                    <p className="text-xs text-gray-400 font-bold">Subtotal: ₹{(bill.totalPrice).toFixed(2)}</p>
                                </button>
                            ))}
                            {queue.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-400 font-semibold">No active dine-in bills to discount.</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
                                <h3 className="font-black text-gray-900 dark:text-white text-base">Discount Calculator</h3>
                                <button onClick={() => setActiveBill(null)} className="text-xs text-purple-600 font-bold hover:underline">← Back to Tables</button>
                            </div>
                            
                            <div className="space-y-4 min-w-0 pr-1.5 flex-1">
                                <label className="text-xs text-gray-400 font-bold block">Select Discount Percentage</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {[5, 10, 15, 20, 25, 30].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setDiscount(p)}
                                            className={`py-3.5 rounded-xl border text-xs font-bold text-center transition-all ${
                                                discount === p
                                                ? 'bg-purple-650 border-purple-700 text-white shadow-sm'
                                                : 'bg-gray-50 dark:bg-slate-805 border-gray-205 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                                            }`}
                                        >
                                            {p}% OFF
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl text-xs space-y-2">
                                <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-red-500 font-bold"><span>Discount Amount ({discount}%):</span><span>-₹{discountAmount.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Goods Tax (5%):</span><span>₹{taxAmount.toFixed(2)}</span></div>
                                <div className="border-t border-purple-200/50 dark:border-purple-900/30 pt-2 flex justify-between font-bold text-sm">
                                    <span>Updated Total Amount:</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                            <div className="space-y-3 min-w-0 pr-1.5 flex-1">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Apply and Settle</h3>
                                <p className="text-xs text-gray-450 leading-relaxed">Applying a discount updates the invoice grand total before settling the payment.</p>
                            </div>
                            <button
                                onClick={handleSettle}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-xs"
                            >
                                Apply Discount & Settle Payment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (currentView === 'collection') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Payment Collection Console</h2>
                    <p className="text-gray-500 mt-1">Select table invoices and record customer payments via physical or digital channels.</p>
                </div>

                {!activeBill ? (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Unsettled Table Invoices</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {queue.map(bill => (
                                <div
                                    key={bill._id}
                                    className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shadow-sm"
                                >
                                    <div>
                                        <p className="font-bold text-gray-950 dark:text-white">Table {bill.tableNumber || 'Any'}</p>
                                        <p className="text-sm font-black text-green-700 dark:text-green-400 mt-1">₹{bill.totalPrice.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => { setActiveBill(bill); setPaymentMethod('Card'); }}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                                    >
                                        Collect Payment
                                    </button>
                                </div>
                            ))}
                            {queue.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-400 font-semibold">All active table invoices have been settled.</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
                                <h3 className="font-black text-gray-900 dark:text-white text-base">Collect Payment: Table {activeBill.tableNumber || 'Any'}</h3>
                                <button onClick={() => setActiveBill(null)} className="text-xs text-purple-600 font-bold hover:underline">← Back to Console</button>
                            </div>
                            
                            <div className="space-y-4 min-w-0 pr-1.5 flex-1">
                                <label className="text-xs text-gray-400 font-bold block">Payment Channel</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'Card', label: 'Credit/Debit Card', icon: <CreditCard size={18} /> },
                                        { id: 'Cash', label: 'Physical Cash', icon: <Banknote size={18} /> },
                                        { id: 'UPI', label: 'UPI / QR Code', icon: <QrCode size={18} /> }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(m.id)}
                                            className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                                paymentMethod === m.id
                                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-bold'
                                                : 'border-gray-100 dark:border-slate-800 text-gray-650 dark:text-gray-305 hover:bg-gray-50'
                                            }`}
                                        >
                                            {m.icon}
                                            <span className="text-xs">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl space-y-2 text-xs">
                                <div className="flex justify-between"><span>Dine-in Order Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Goods & Services Tax (5%):</span><span>₹{taxAmount.toFixed(2)}</span></div>
                                <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-sm">
                                    <span>Total Payment Due:</span>
                                    <span className="text-green-700 dark:text-green-400">₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                            <div className="space-y-3 min-w-0 pr-1.5 flex-1">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Finalize Transaction</h3>
                                <p className="text-xs text-gray-455 leading-relaxed">Ensure payment has been successfully authorized at the card reader or that physical cash is correctly counted before recording register settlement.</p>
                            </div>
                            <button
                                onClick={handleSettle}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-xs"
                            >
                                Confirm Payment Settled
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (currentView === 'summary') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Shift Sales & Cash Summary</h2>
                    <p className="text-gray-500 mt-1">Real-time breakdown of cash register collections and payment transactions for this shift.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Shift Revenue', value: `₹${cashSummary.total.toFixed(2)}`, desc: 'All payment channels combined', color: 'text-purple-600 dark:text-purple-400' },
                        { label: 'Cash Collection', value: `₹${cashSummary.cash.toFixed(2)}`, desc: 'Physical currency in drawer', color: 'text-emerald-605 dark:text-emerald-400' },
                        { label: 'Card Collection', value: `₹${cashSummary.card.toFixed(2)}`, desc: 'Processed via card terminals', color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'UPI & Digital', value: `₹${(cashSummary.upi + cashSummary.online).toFixed(2)}`, desc: 'Direct online transfers', color: 'text-orange-600 dark:text-orange-400' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight break-words">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{stat.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Shift Drawer Activity Logs</h3>
                        <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                            <div className="py-3 flex justify-between">
                                <span className="font-semibold text-gray-600 dark:text-gray-400">Opening Register Float</span>
                                <span className="font-bold text-gray-900 dark:text-white">₹2,000.00</span>
                            </div>
                            <div className="py-3 flex justify-between">
                                <span className="font-semibold text-gray-600 dark:text-gray-400">Total Cash Sales Added</span>
                                <span className="font-bold text-green-600">+₹{cashSummary.cash.toFixed(2)}</span>
                            </div>
                            <div className="py-3 flex justify-between">
                                <span className="font-semibold text-gray-600 dark:text-gray-400">Cash Paid Out / Drops</span>
                                <span className="font-bold text-red-650">-₹0.00</span>
                            </div>
                            <div className="py-3 flex justify-between border-t dark:border-slate-800 font-bold text-sm">
                                <span className="text-gray-800 dark:text-white">Expected Cash in Drawer</span>
                                <span className="text-green-700 dark:text-green-400">₹{(2000 + cashSummary.cash).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">Shift Reconciliation</h3>
                            <p className="text-xs text-gray-450 leading-relaxed">Reconcile physical cash counts with the expected drawer total before closing your register session.</p>
                        </div>
                        <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all text-xs shadow-md">
                            Close Register & End Shift
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'history') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Transaction History Logs</h2>
                    <p className="text-gray-500 mt-1">Audit log of all payments settled or refunded during the current business day.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-850 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/20">
                        <span className="font-bold text-gray-900 dark:text-white">Settled Transactions ({history.length})</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-955/40 text-gray-550 border-b border-gray-100 dark:border-slate-800 font-bold uppercase tracking-wider">
                                    <th className="p-4">Invoice ID</th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Table / Type</th>
                                    <th className="p-4">Payment Method</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {history.map(bill => (
                                    <tr key={bill._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors text-gray-900 dark:text-gray-300">
                                        <td className="p-4 font-mono font-bold">#{bill._id.toUpperCase()}</td>
                                        <td className="p-4">{new Date(bill.paidAt || bill.updatedAt).toLocaleString()}</td>
                                        <td className="p-4 font-semibold">{isSelfOrder(bill) ? '📦 Self-Pickup' : (bill.orderType === 'Dine In' ? `Table ${bill.tableNumber || 'Any'}` : bill.orderType)}</td>
                                        <td className="p-4"><span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-lg font-bold">{bill.paymentMethod}</span></td>
                                        <td className="p-4 font-black text-green-700 dark:text-green-400">₹{bill.totalPrice.toFixed(2)}</td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => handlePrintReceipt(bill)} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg transition-all">Print</button>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-400 font-bold">No transaction history found for this shift.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'refunds') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Refund & Void Manager</h2>
                    <p className="text-gray-500 mt-1">Search settled receipts and process immediate order payment refunds.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950/20 font-bold text-gray-900 dark:text-white">
                            Select Invoice for Refund
                        </div>
                        <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-955/40 text-gray-550 border-b border-gray-100 dark:border-slate-800 font-bold uppercase tracking-wider">
                                        <th className="p-4">Invoice ID</th>
                                        <th className="p-4">Table / Type</th>
                                        <th className="p-4">Payment Method</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {history.map(bill => (
                                        <tr key={bill._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors text-gray-900 dark:text-gray-300">
                                            <td className="p-4 font-mono font-bold">#{bill._id.toUpperCase()}</td>
                                            <td className="p-4 font-semibold">{bill.orderType === 'Dine In' ? `Table ${bill.tableNumber || 'Any'}` : bill.orderType}</td>
                                            <td className="p-4">{bill.paymentMethod}</td>
                                            <td className="p-4 font-black text-green-700 dark:text-green-400">₹{bill.totalPrice.toFixed(2)}</td>
                                            <td className="p-4 text-right">
                                                {bill.status === 'Refunded' ? (
                                                    <span className="text-red-500 font-bold bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-lg">Refunded</span>
                                                ) : (
                                                    <button onClick={() => handleRefund(bill._id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg border border-red-100 transition-all">Issue Refund</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Refund Policy & Auditing</h3>
                        <p className="text-xs text-gray-450 leading-relaxed">Processing a refund returns order status to <strong>Refunded</strong> in reports. Ensure drawer float calculations reconcile with physical cash changes before issuing refunds in cash.</p>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                            ⚠️ All refund logs are linked directly to your active Cashier user credentials.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'invoices') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Invoice Generator & Printers</h2>
                    <p className="text-gray-500 mt-1">Generate and print previews or final thermal invoices for active and previous orders.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950/20 font-bold text-gray-900 dark:text-white">
                            All Active Orders
                        </div>
                        <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-955/40 text-gray-550 border-b border-gray-100 dark:border-slate-800 font-bold uppercase tracking-wider">
                                        <th className="p-4">Order ID</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Total</th>
                                        <th className="p-4 text-right">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {queue.map(bill => (
                                        <tr key={bill._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors text-gray-900 dark:text-gray-300">
                                            <td className="p-4 font-mono font-bold">
                                                #{bill._id.substring(bill._id.length - 6).toUpperCase()}
                                                {bill.kotNumbers && bill.kotNumbers.length > 0 && (
                                                    <span className="ml-2 text-[10px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded">
                                                        {bill.kotNumbers[0]}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 font-semibold">{bill.orderType} {bill.tableNumber ? `(Table ${bill.tableNumber})` : ''}</td>
                                            <td className="p-4"><span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 rounded font-bold">{bill.status}</span></td>
                                            <td className="p-4 font-black">₹{bill.totalPrice.toFixed(2)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => handlePrintKOT(bill)} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-200 transition-all flex items-center gap-1 text-[11px]" title="Print Kitchen Order Ticket">
                                                        <Printer size={12} /> KOT
                                                    </button>
                                                    <button onClick={() => handlePrintReceipt(bill)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg border border-blue-100 transition-all flex items-center gap-1 text-[11px]">
                                                        <Printer size={12} /> Receipt
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {queue.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-400 font-bold">No active orders available to invoice.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Thermal Printer Settings</h3>
                        <p className="text-xs text-gray-450 leading-relaxed">Invoice prints are formatted for standard 80mm POS thermal receipt printers. Use the browser print setup to configure default margins and layouts.</p>
                    </div>
                </div>
            </div>
        );
    }

    const filteredQueue = filterBills(queue);
    const filteredPickup = filterBills(selfPickupQueue);
    const filteredHistory = filterBills(history);

    return (
        <div className="h-full flex flex-col gap-2.5 sm:gap-3 min-h-0 overflow-hidden font-sans">
            
            {/* Sleek, Space-Efficient Cashier POS Status Bar */}
            <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shadow-md border border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-black tracking-wide uppercase text-slate-200">Billing Counter #1</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-xs text-slate-400 font-medium truncate max-w-[140px] sm:max-w-[180px]">Cashier: {restaurant?.name || 'Active Session'}</span>
                    </div>
                    {/* Compact Shift Attendance Widget */}
                    <StaffShiftClockWidget compact={true} userName="Cashier" userRole="POS Cashier / Billing Agent" />
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    {/* Shift Sales Pill */}
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs border border-slate-700/60 font-semibold shadow-xs">
                        <span className="text-slate-400">Shift Total:</span>
                        <span className="font-mono font-black text-emerald-400">₹{cashSummary.total.toFixed(2)}</span>
                    </div>

                    {/* Auto-Print Thermal Receipt Toggle */}
                    <button
                        type="button"
                        onClick={toggleAutoPrintBill}
                        className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border ${
                            autoPrintBillEnabled 
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25' 
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                        title="Click to toggle automatic bill printing on incoming orders"
                    >
                        <Printer size={13} className={autoPrintBillEnabled ? 'text-emerald-400' : 'text-slate-400'} />
                        <span>Auto-Print: {autoPrintBillEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                </div>
            </div>

            {/* Main POS Interface (Left Queue + Right Billing Console) */}
            <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0 overflow-y-auto lg:overflow-hidden">
            
                {/* Left Queue View (shown full width on mobile unless bill is opened) */}
                <div className={`w-full lg:w-[350px] xl:w-[380px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col min-h-0 shrink-0 ${activeBill ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex items-center justify-between mb-2.5 px-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                Orders Queue
                            </span>
                            {searchQuery && (
                                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-md">
                                    Filtered
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 font-mono">
                            {filteredQueue.length + filteredPickup.length} Active
                        </span>
                    </div>

                    {/* Queue Tabs */}
                    <div className="flex bg-slate-100/95 dark:bg-slate-800/95 p-1.5 rounded-2xl mb-3 shrink-0 gap-1.5 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                        {[
                            { id: 'Pending', label: 'Billing', count: filteredQueue.length, icon: Receipt },
                            { id: 'Self-Pickup', label: 'Pickup', count: filteredPickup.length, icon: ShoppingBag },
                            { id: 'Paid', label: 'History', count: filteredHistory.length, icon: History }
                        ].map(t => {
                            const IconComponent = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button 
                                    key={t.id}
                                    onClick={() => { 
                                        setActiveTab(t.id); 
                                        if (t.id === 'Pending') setActiveBill(filteredQueue[0] || null);
                                        else if (t.id === 'Self-Pickup') setActiveBill(filteredPickup[0] || null);
                                        else if (t.id === 'Paid') setActiveBill(filteredHistory[0] || null);
                                    }}
                                    className={`flex-1 py-2 px-2 text-xs font-black rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                                        isActive 
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/20 font-black' 
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 font-extrabold border-2 border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <IconComponent size={13} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                    <span>{t.label}</span>
                                    {t.count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                                            isActive 
                                            ? 'bg-white text-emerald-700 shadow-xs' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                                        }`}>
                                            {t.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Queue Cards List */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 custom-scrollbar pr-1 pb-1">
                        {activeTab === 'Pending' && (
                            filteredQueue.length === 0 ? (
                                <div className="text-center py-10 px-4 space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 my-auto">
                                    <Receipt className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto" />
                                    <div>
                                        <p className="text-slate-800 dark:text-slate-200 font-bold text-xs">No Pending Bills</p>
                                        <p className="text-slate-400 text-[11px] mt-0.5">Orders from QR or Waiters will appear here automatically.</p>
                                    </div>
                                </div>
                            ) : (
                                filteredQueue.map(bill => renderBillCard(bill))
                            )
                        )}

                        {activeTab === 'Self-Pickup' && (
                            filteredPickup.length === 0 ? (
                                <div className="text-center py-10 px-4 space-y-2 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 my-auto">
                                    <p className="text-slate-700 dark:text-slate-300 font-bold text-xs">No Takeout / Pickup Orders</p>
                                    <p className="text-slate-400 text-[11px]">Self-pickup orders marked ready in kitchen will arrive here.</p>
                                </div>
                            ) : (
                                filteredPickup.map(bill => renderBillCard(bill))
                            )
                        )}

                        {activeTab === 'Paid' && (
                            filteredHistory.length === 0 ? (
                                <div className="text-center py-10 px-4 space-y-2 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 my-auto">
                                    <p className="text-slate-700 dark:text-slate-300 font-bold text-xs">No Settled Invoices Yet</p>
                                    <p className="text-slate-400 text-[11px]">Completed payments from today's shift will appear here.</p>
                                </div>
                            ) : (
                                filteredHistory.map(bill => renderBillCard(bill))
                            )
                        )}
                    </div>

                    {/* Shift Sales Box at Bottom */}
                    <div className="rounded-xl mt-2 border bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 overflow-hidden shrink-0">
                        <button 
                            type="button"
                            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                            className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs">📊</span>
                                <div>
                                    <p className="font-extrabold uppercase tracking-wider text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                                        Shift Sales
                                    </p>
                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none mt-0.5">
                                        ₹{cashSummary.total.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <span>{isSummaryOpen ? 'Hide' : 'Details'}</span>
                                {isSummaryOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </div>
                        </button>

                        {isSummaryOpen && (
                            <div className="px-3 pb-3 pt-1 space-y-1.5 text-xs font-semibold border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-1">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1">💵 Cash</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{cashSummary.cash.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1">💳 Card</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{cashSummary.card.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1">📲 UPI / Online</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{(cashSummary.upi + cashSummary.online).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-800 pt-1.5 flex justify-between font-extrabold text-emerald-600 dark:text-emerald-400">
                                    <span>Total Collection</span>
                                    <span className="font-mono text-xs">₹{cashSummary.total.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side Billing Console (full screen on mobile when a bill is active) */}
                <div className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden ${!activeBill ? 'hidden lg:flex' : 'flex'}`}>
                    {!activeBill ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                                <Receipt size={32} />
                            </div>
                            <div className="max-w-md space-y-1">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Ready for Billing & Checkout</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Select any pending table or customer ticket from the left queue to review items, apply discounts, and print KOT or thermal tax receipts.
                                </p>
                            </div>
                            {filteredQueue.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => handleSelectBill(filteredQueue[0])}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                                >
                                    <span>Process Next: {filteredQueue[0].tableNumber ? `Table ${filteredQueue[0].tableNumber}` : filteredQueue[0].orderType} (₹{(filteredQueue[0].totalPrice || 0).toFixed(2)})</span>
                                    <span>→</span>
                                </button>
                            ) : null}
                        </div>
                    ) : settled ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-emerald-600 space-y-3 my-auto">
                            <CheckCircle size={48} className="text-emerald-500 animate-bounce" />
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Payment Successfully Settled!</h3>
                            <p className="text-xs text-slate-500 font-semibold">Printing receipt and updating table status...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row h-full gap-4 sm:gap-5 min-h-0 overflow-y-auto lg:overflow-hidden">
                            
                            {/* Left Sub-Column: Order Details & Scrollable Items Table */}
                            <div className="flex-1 flex flex-col min-h-0">
                                
                                {/* Mobile Back to Queue Button */}
                                <button
                                    type="button"
                                    onClick={() => setActiveBill(null)}
                                    className="lg:hidden text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer self-start active:scale-95 transition-all"
                                >
                                    ← Back to Orders Queue
                                </button>
                                
                                {/* Order Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {activeBill.tableNumber && activeBill.tableNumber !== 'Any' && activeBill.tableNumber !== 'Takeout'
                                                    ? (activeBill.tableNumber.startsWith('Table') ? activeBill.tableNumber : `Table ${activeBill.tableNumber}`)
                                                    : (isSelfOrder(activeBill) ? 'Self-Pickup Counter' : (activeBill.orderType || 'Counter'))
                                                }
                                            </h3>
                                            {activeBill.serviceType === 'Self Dine-In (KFC Style)' && (
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                                    Self Dine-In
                                                </span>
                                            )}
                                            <span className="font-mono font-black text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                                                <span>🎟️</span>
                                                <span>
                                                    {activeBill.kotNumbers && activeBill.kotNumbers.length > 0 
                                                        ? `KOT: ${activeBill.kotNumbers.join(', ')}` 
                                                        : `KOT-${activeBill._id.substring(activeBill._id.length - 4).toUpperCase()}`
                                                    }
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                            <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]" title={`Full Ref: #${activeBill._id.toUpperCase()}`}>
                                                Ref: #{activeBill._id.substring(activeBill._id.length - 6).toUpperCase()}
                                            </span>
                                            {activeBill.customerName && (
                                                <span className="font-bold text-slate-700 dark:text-slate-300">👤 {activeBill.customerName}</span>
                                            )}
                                            {activeBill.customerPhone && (
                                                <span className="font-semibold text-slate-500">📞 {activeBill.customerPhone}</span>
                                            )}
                                            {activeBill.createdAt && (
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(activeBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons Toolbar */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handlePrintKOT(activeBill)}
                                            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer shadow-xs transition-all active:scale-95"
                                            title="Print Kitchen Order Ticket"
                                        >
                                            <Printer size={13} /> Print KOT
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePrintReceipt(activeBill)}
                                            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 cursor-pointer shadow-xs transition-all active:scale-95"
                                            title="Print Customer Bill Preview"
                                        >
                                            <Printer size={13} /> Print Bill
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setIsMerging(!isMerging)}
                                            className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                        >
                                            <ArrowLeftRight size={13} /> Merge
                                        </button>
                                    </div>
                                </div>

                                {/* Merge Selector Overlay */}
                                {isMerging && (
                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-xl my-2 space-y-1.5 animate-in slide-in-from-top-1 shrink-0">
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Select target table to merge items into:</p>
                                        <div className="flex gap-2">
                                            <select 
                                                value={mergeTargetId} 
                                                onChange={(e) => setMergeTargetId(e.target.value)}
                                                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                                            >
                                                <option value="">Select Order</option>
                                                {queue.filter(q => q._id !== activeBill._id).map(q => (
                                                    <option key={q._id} value={q._id}>Table {q.tableNumber || 'Any'} (Ref: #{q._id.substring(q._id.length - 4).toUpperCase()})</option>
                                                ))}
                                            </select>
                                            <button onClick={handleMergeBill} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer">Merge</button>
                                            <button onClick={() => setIsMerging(false)} className="text-slate-500 text-xs cursor-pointer">Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {/* Scrollable Items Table Container */}
                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl mt-3 bg-slate-50/50 dark:bg-slate-950/40">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900/95 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
                                            <tr className="text-left text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                                <th className="py-2.5 px-3">Menu Item</th>
                                                <th className="py-2.5 px-2 text-center">Qty</th>
                                                <th className="py-2.5 px-3 text-right">Price</th>
                                                <th className="py-2.5 px-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                                            {activeBill.orderItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                                                        <div>{item.name}</div>
                                                        {item.notes && (
                                                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold italic mt-0.5">
                                                                Note: {item.notes}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <span className="font-extrabold px-2 py-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md text-xs">
                                                            {item.qty}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 font-mono">₹{item.price.toFixed(2)}</td>
                                                    <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900 dark:text-white">₹{(item.price * item.qty).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Items Footer info */}
                                <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500 font-medium shrink-0">
                                    <span>{activeBill.orderItems.reduce((s, it) => s + (it.qty || 1), 0)} items ({activeBill.orderItems.length} lines)</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">Subtotal: ₹{subtotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Right Sub-Column: Dedicated Checkout & Settlement Console */}
                            <div className="w-full lg:w-[350px] xl:w-[370px] flex flex-col justify-between shrink-0 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 min-h-0 mt-3 lg:mt-0">
                                {activeTab === 'Paid' ? (
                                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl text-center space-y-2">
                                            <CheckCircle size={32} className="text-emerald-600 mx-auto" />
                                            <div>
                                                <p className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm">Payment Settled</p>
                                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                                                    Paid via {activeBill.paymentMethod || 'Online'}
                                                </p>
                                            </div>
                                            <div className="border-t border-emerald-200 dark:border-emerald-800/60 pt-2 flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                                <span>Settled Amount:</span>
                                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">₹{activeBill.totalPrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mt-auto">
                                            <button 
                                                onClick={() => handlePrintReceipt(activeBill)}
                                                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer"
                                            >
                                                <Printer size={15} /> Reprint Tax Invoice
                                            </button>
                                            {activeBill.status !== 'Refunded' ? (
                                                <button 
                                                    onClick={() => handleRefund(activeBill._id)}
                                                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                                                >
                                                    <Undo2 size={15} /> Refund Transaction
                                                </button>
                                            ) : (
                                                <span className="block text-center text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                                                    Transaction Refunded
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col justify-between min-h-0 space-y-3 overflow-y-auto custom-scrollbar pr-0.5">
                                        <div className="space-y-3 shrink-0">
                                            {/* Subtotal, Discount & Tax Card */}
                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2 shadow-xs">
                                                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                    <span>Subtotal</span>
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                                                </div>

                                                {/* Discount Pills */}
                                                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 font-semibold">Discount</span>
                                                        <span className={discount > 0 ? 'text-rose-600 font-bold font-mono' : 'font-mono text-slate-400'}>
                                                            -{discount > 0 ? '₹' : ''}{discountAmount.toFixed(2)} ({discount}%)
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {[5, 10, 15, 20].map(p => (
                                                            <button 
                                                                key={p} 
                                                                type="button"
                                                                onClick={() => setDiscount(discount === p ? 0 : p)}
                                                                className={`flex-1 py-1 rounded-lg border text-[10px] font-black cursor-pointer transition-all ${
                                                                    discount === p 
                                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                                                }`}
                                                            >
                                                                {p}%
                                                            </button>
                                                        ))}
                                                        {discount > 0 && (
                                                            <button 
                                                                type="button"
                                                                onClick={() => setDiscount(0)} 
                                                                className="px-2 py-1 rounded-lg border text-[10px] font-bold bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 cursor-pointer"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* GST */}
                                                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                                                    <span>Tax (5% GST)</span>
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white">₹{taxAmount.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Invoice Grand Total Hero Card */}
                                            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl p-3 shadow-md flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Total Due</p>
                                                    <p className="text-2xl font-black font-mono tracking-tight text-white leading-tight">₹{total.toFixed(2)}</p>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-lg bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
                                                    {isSplit ? `${splitParts} Splits` : (isSelfOrder(activeBill) ? 'Takeout' : 'Dine In')}
                                                </span>
                                            </div>

                                            {/* Payment Method Selector */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                                    Payment Method
                                                </span>
                                                <div className={`grid grid-cols-${Math.max(1, Math.min(availableMethods.length, 3))} gap-1.5`}>
                                                    {availableMethods.map(m => (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => { setPaymentMethod(m.id); setIsSplit(false); }}
                                                            className={`py-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                                                paymentMethod === m.id && !isSplit
                                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black shadow-xs ring-1 ring-emerald-500/20'
                                                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {m.icon}
                                                            <span className="text-[11px] font-bold">{m.id}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Split Bill Calculator */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSplit(!isSplit)}
                                                    className={`w-full py-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                                        isSplit 
                                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' 
                                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <Split size={13} /> {isSplit ? 'Disable Bill Split' : 'Configure Split Bill'}
                                                </button>

                                                {isSplit && (
                                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 animate-in slide-in-from-top-1">
                                                        <div className="flex justify-between items-center">
                                                            <span>Split by People:</span>
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={() => setSplitParts(Math.max(1, splitParts - 1))} className="w-6 h-6 border rounded-lg bg-slate-100 dark:bg-slate-800 font-bold flex items-center justify-center cursor-pointer shadow-xs">-</button>
                                                                <span className="font-extrabold text-sm">{splitParts}</span>
                                                                <button type="button" onClick={() => setSplitParts(splitParts + 1)} className="w-6 h-6 border rounded-lg bg-slate-100 dark:bg-slate-800 font-bold flex items-center justify-center cursor-pointer shadow-xs">+</button>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 flex justify-between font-extrabold text-emerald-600 dark:text-emerald-400">
                                                            <span>Per Person</span>
                                                            <span className="font-mono text-sm">₹{(total / splitParts).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Settle Action button (firmly anchored & unclipped) */}
                                        <div className="pt-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={isSelfOrder(activeBill) ? handleCompletePickup : handleSettle}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <CheckCircle size={16} /> 
                                                <span>
                                                    {isSelfOrder(activeBill) 
                                                        ? `Complete & Handover (₹${total.toFixed(2)})` 
                                                        : `Complete Invoice & Settle (₹${total.toFixed(2)})`
                                                    }
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Thermal KOT Print Modal */}
                <KOTPrintModal
                    isOpen={!!printModalKOT}
                    onClose={() => setPrintModalKOT(null)}
                    kot={printModalKOT}
                />
            </div>
        </div>
    );
};

export default CashierDashboard;
