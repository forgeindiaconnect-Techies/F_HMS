import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Receipt, CreditCard, Banknote, QrCode, Search, Download, 
    Printer, CheckCircle2, AlertCircle, Clock, ArrowUpRight, ArrowDownRight, 
    RefreshCcw, Filter, Plus, Trash2, X, ChevronRight, FileText, 
    Tag, Split, DollarSign, Calendar, Store, User, Phone, Check, 
    Layers, Percent, Coins, Landmark, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const getStatusBadge = (isPaid, status) => {
    if (status === 'Refunded') {
        return { label: 'Refunded', style: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
    }
    if (status === 'Cancelled') {
        return { label: 'Cancelled', style: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800' };
    }
    if (isPaid || status === 'Completed') {
        return { label: 'Paid & Settled', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
    return { label: 'Payment Pending', style: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse' };
};

const getMethodBadge = (method) => {
    switch (method?.toLowerCase()) {
        case 'cash':
            return { icon: Banknote, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' };
        case 'upi':
            return { icon: QrCode, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50' };
        case 'card':
            return { icon: CreditCard, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' };
        case 'split':
            return { icon: Split, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50' };
        default:
            return { icon: Coins, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    }
};

const BillingManagement = () => {
    const { api, user, restaurant } = useAuth();
    const printReceiptRef = useRef(null);

    // Main States
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Active Tab: 'active' (Open Bills), 'invoices' (Billing History), 'pos' (Quick Counter POS), 'summary' (Day End Register)
    const [activeTab, setActiveTab] = useState('active');

    // Filtering & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [methodFilter, setMethodFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [periodFilter, setPeriodFilter] = useState('today'); // 'today', 'yesterday', 'week', 'month', 'all'
    const [selectedBranchId, setSelectedBranchId] = useState('All');

    // Modals
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [settleModalOrder, setSettleModalOrder] = useState(null);
    const [refundModalOrder, setRefundModalOrder] = useState(null);

    // Settle Modal form state
    const [settleMethod, setSettleMethod] = useState('Card');
    const [settleDiscountPct, setSettleDiscountPct] = useState(0);
    const [settleCashTendered, setSettleCashTendered] = useState('');
    const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);

    // POS Quick Bill Generator state
    const [posOrderType, setPosOrderType] = useState('Dine In');
    const [posTableNum, setPosTableNum] = useState('');
    const [posCustomerName, setPosCustomerName] = useState('');
    const [posCustomerPhone, setPosCustomerPhone] = useState('');
    const [posCart, setPosCart] = useState([]);
    const [posMenuSearch, setPosMenuSearch] = useState('');
    const [posMenuCategory, setPosMenuCategory] = useState('All');
    const [posDiscountPct, setPosDiscountPct] = useState(0);
    const [posPaymentMethod, setPosPaymentMethod] = useState('Cash');
    const [posBranchId, setPosBranchId] = useState('');
    const [isSubmittingPos, setIsSubmittingPos] = useState(false);

    // Day End Cash Drawer Calculator
    const [cashDenominations, setCashDenominations] = useState({
        500: 0,
        200: 0,
        100: 0,
        50: 0,
        20: 0,
        10: 0
    });

    // Fetch orders & metadata
    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, menuRes, branchRes] = await Promise.all([
                api.get('/orders').catch(() => ({ data: [] })),
                api.get('/menu').catch(() => ({ data: [] })),
                api.get('/branches').catch(() => ({ data: [] }))
            ]);

            setOrders(ordersRes.data || []);
            setMenuItems(menuRes.data || []);
            const bList = branchRes.data || [];
            setBranches(bList);
            if (bList.length > 0 && !posBranchId) {
                setPosBranchId(bList[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch billing data', error);
            toast.error('Failed to load billing records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // 15s polling for live orders
        return () => clearInterval(interval);
    }, []);

    // Time filtering helper
    const filterByDate = (dateStr, period) => {
        if (period === 'all') return true;
        const target = new Date(dateStr);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (period === 'today') {
            return target >= todayStart;
        }
        if (period === 'yesterday') {
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            return target >= yesterdayStart && target < todayStart;
        }
        if (period === 'week') {
            const weekStart = new Date(todayStart);
            weekStart.setDate(weekStart.getDate() - 7);
            return target >= weekStart;
        }
        if (period === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return target >= monthStart;
        }
        return true;
    };

    // Filtered lists
    const activeOpenBills = useMemo(() => {
        return orders.filter(o => {
            const isCompletedOrCancelled = o.status === 'Completed' || o.status === 'Cancelled' || o.status === 'Refunded';
            if (isCompletedOrCancelled && o.isPaid) return false;
            if (selectedBranchId !== 'All' && String(o.branchId) !== String(selectedBranchId)) return false;
            return true;
        });
    }, [orders, selectedBranchId]);

    const historicalInvoices = useMemo(() => {
        return orders.filter(o => {
            if (selectedBranchId !== 'All' && String(o.branchId) !== String(selectedBranchId)) return false;
            if (!filterByDate(o.createdAt, periodFilter)) return false;

            if (statusFilter === 'Paid') {
                if (!o.isPaid && o.status !== 'Completed') return false;
            } else if (statusFilter === 'Pending') {
                if (o.isPaid || o.status === 'Completed') return false;
            } else if (statusFilter === 'Refunded') {
                if (o.status !== 'Refunded') return false;
            }

            if (methodFilter !== 'All') {
                const orderMethod = (o.paymentMethod || 'Card').toLowerCase();
                if (orderMethod !== methodFilter.toLowerCase()) return false;
            }

            if (typeFilter !== 'All') {
                if (o.orderType?.toLowerCase() !== typeFilter.toLowerCase()) return false;
            }

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const invId = `INV-${o._id?.slice(-6)}`.toLowerCase();
                const ordId = `ORD-${o._id?.slice(-6)}`.toLowerCase();
                const cust = (o.user?.name || '').toLowerCase();
                const table = String(o.tableNumber || '').toLowerCase();
                if (!invId.includes(query) && !ordId.includes(query) && !cust.includes(query) && !table.includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [orders, selectedBranchId, periodFilter, statusFilter, methodFilter, typeFilter, searchQuery]);

    // Financial KPI Metrics
    const metrics = useMemo(() => {
        const todayOrders = orders.filter(o => filterByDate(o.createdAt, 'today'));
        const paidToday = todayOrders.filter(o => o.isPaid || o.status === 'Completed');

        const totalBilledToday = paidToday.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
        const cashToday = paidToday
            .filter(o => (o.paymentMethod || '').toLowerCase() === 'cash')
            .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
        const upiToday = paidToday
            .filter(o => (o.paymentMethod || '').toLowerCase() === 'upi')
            .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
        const cardToday = paidToday
            .filter(o => (o.paymentMethod || '').toLowerCase() === 'card')
            .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
        const digitalToday = upiToday + cardToday;

        const totalTaxToday = paidToday.reduce((sum, o) => sum + (Number(o.taxPrice) || 0), 0);
        const openBillsCount = activeOpenBills.length;
        const openBillsTotal = activeOpenBills.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

        const refundsToday = todayOrders
            .filter(o => o.status === 'Refunded')
            .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

        return {
            totalBilledToday,
            cashToday,
            digitalToday,
            upiToday,
            cardToday,
            totalTaxToday,
            openBillsCount,
            openBillsTotal,
            refundsToday,
            paidCountToday: paidToday.length
        };
    }, [orders, activeOpenBills]);

    // Handle Quick Settle
    const openSettleModal = (order) => {
        setSettleModalOrder(order);
        setSettleMethod(order.paymentMethod || 'Card');
        setSettleDiscountPct(0);
        setSettleCashTendered('');
    };

    const handleConfirmSettle = async () => {
        if (!settleModalOrder) return;
        setIsSubmittingSettle(true);
        try {
            const rawSubtotal = settleModalOrder.orderItems?.reduce((sum, i) => sum + (i.price * (i.qty || i.quantity || 1)), 0) || settleModalOrder.totalPrice;
            const discountAmt = rawSubtotal * (settleDiscountPct / 100);
            const discountedBase = Math.max(0, rawSubtotal - discountAmt);
            const taxAmt = discountedBase * 0.05; // 5% GST
            const finalTotal = Math.round((discountedBase + taxAmt) * 100) / 100;

            await api.put(`/orders/${settleModalOrder._id}/pay`, {
                paymentMethod: settleMethod,
                taxPrice: taxAmt,
                totalPrice: finalTotal
            });

            await api.put(`/orders/${settleModalOrder._id}/status`, {
                status: 'Completed'
            });

            toast.success(`Bill #${settleModalOrder._id.slice(-6).toUpperCase()} settled successfully!`);
            
            // Auto open printable receipt
            const settledObj = {
                ...settleModalOrder,
                isPaid: true,
                status: 'Completed',
                paymentMethod: settleMethod,
                taxPrice: taxAmt,
                totalPrice: finalTotal,
                paidAt: new Date().toISOString()
            };
            setSelectedInvoice(settledObj);

            setSettleModalOrder(null);
            fetchData();
        } catch (error) {
            console.error('Failed to settle bill', error);
            toast.error(error.response?.data?.message || 'Failed to settle bill');
        } finally {
            setIsSubmittingSettle(false);
        }
    };

    // Handle Refund
    const handleProcessRefund = async () => {
        if (!refundModalOrder) return;
        try {
            await api.put(`/orders/${refundModalOrder._id}/refund`).catch(async () => {
                // Fallback to status update
                await api.put(`/orders/${refundModalOrder._id}/status`, { status: 'Refunded' });
            });
            toast.success(`Refund processed for order #${refundModalOrder._id.slice(-6).toUpperCase()}`);
            setRefundModalOrder(null);
            fetchData();
        } catch (error) {
            console.error('Failed to process refund', error);
            toast.error('Failed to process refund');
        }
    };

    // POS Cart Helpers
    const handleAddToCart = (item) => {
        setPosCart(prev => {
            const existing = prev.find(p => p._id === item._id);
            if (existing) {
                return prev.map(p => p._id === item._id ? { ...p, qty: p.qty + 1 } : p);
            }
            return [...prev, { _id: item._id, name: item.name, price: item.price, image: item.image || '', qty: 1 }];
        });
    };

    const handleUpdateQty = (itemId, delta) => {
        setPosCart(prev => {
            return prev.map(p => {
                if (p._id === itemId) {
                    const newQty = p.qty + delta;
                    return newQty > 0 ? { ...p, qty: newQty } : null;
                }
                return p;
            }).filter(Boolean);
        });
    };

    const posSubtotal = useMemo(() => {
        return posCart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    }, [posCart]);

    const posDiscountAmt = useMemo(() => {
        return posSubtotal * (posDiscountPct / 100);
    }, [posSubtotal, posDiscountPct]);

    const posTaxAmt = useMemo(() => {
        return Math.max(0, posSubtotal - posDiscountAmt) * 0.05; // 5% GST
    }, [posSubtotal, posDiscountAmt]);

    const posTotal = useMemo(() => {
        return Math.round((posSubtotal - posDiscountAmt + posTaxAmt) * 100) / 100;
    }, [posSubtotal, posDiscountAmt, posTaxAmt]);

    // Handle Quick POS Generate & Settle Bill
    const handleCreateAndSettlePosBill = async () => {
        if (posCart.length === 0) {
            toast.error('Cart is empty. Add items to create a bill.');
            return;
        }

        setIsSubmittingPos(true);
        try {
            const orderPayload = {
                orderItems: posCart.map(i => ({
                    name: i.name,
                    qty: i.qty,
                    price: i.price,
                    image: i.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800',
                    product: i._id
                })),
                orderType: posOrderType,
                tableNumber: posOrderType === 'Dine In' ? (posTableNum || 'Counter 1') : undefined,
                paymentMethod: posPaymentMethod,
                branchId: posBranchId || undefined,
                taxPrice: posTaxAmt,
                totalPrice: posTotal,
                notes: `POS Bill created by Admin. Customer: ${posCustomerName || 'Walk-in'} (${posCustomerPhone || 'N/A'})`
            };

            const createRes = await api.post('/orders', orderPayload);
            const createdOrder = createRes.data;

            // Immediately mark as paid & completed
            if (createdOrder?._id) {
                await api.put(`/orders/${createdOrder._id}/pay`, {
                    paymentMethod: posPaymentMethod,
                    taxPrice: posTaxAmt,
                    totalPrice: posTotal
                });
                await api.put(`/orders/${createdOrder._id}/status`, {
                    status: 'Completed'
                });
            }

            toast.success(`POS Bill created & settled for ₹${posTotal.toFixed(2)}!`);

            // Open Receipt Print View
            setSelectedInvoice({
                ...createdOrder,
                orderItems: orderPayload.orderItems,
                isPaid: true,
                status: 'Completed',
                paymentMethod: posPaymentMethod,
                taxPrice: posTaxAmt,
                totalPrice: posTotal,
                tableNumber: orderPayload.tableNumber,
                paidAt: new Date().toISOString()
            });

            // Reset cart
            setPosCart([]);
            setPosCustomerName('');
            setPosCustomerPhone('');
            setPosTableNum('');
            fetchData();
        } catch (error) {
            console.error('POS creation error', error);
            toast.error(error.response?.data?.message || 'Failed to generate POS bill');
        } finally {
            setIsSubmittingPos(false);
        }
    };

    // Print Receipt Function
    const handleTriggerPrint = () => {
        window.print();
    };

    // Export CSV of Invoices
    const handleExportCSV = () => {
        if (historicalInvoices.length === 0) {
            toast.error('No invoices to export.');
            return;
        }

        const headers = ['Invoice ID', 'Date', 'Customer', 'Order Type', 'Table', 'Payment Method', 'Items Count', 'Subtotal', 'Tax (GST)', 'Grand Total', 'Status'];
        const rows = historicalInvoices.map(o => [
            `INV-${o._id?.slice(-6).toUpperCase()}`,
            new Date(o.createdAt).toLocaleString(),
            `"${(o.user?.name || 'Walk-in Guest').replace(/"/g, '""')}"`,
            o.orderType || 'Dine In',
            o.tableNumber || 'N/A',
            o.paymentMethod || 'Card',
            o.orderItems?.length || 1,
            ((o.totalPrice || 0) - (o.taxPrice || 0)).toFixed(2),
            (o.taxPrice || 0).toFixed(2),
            (o.totalPrice || 0).toFixed(2),
            o.isPaid ? 'Paid' : o.status
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Invoices exported to CSV!');
    };

    // Denominations calculation
    const totalCashCounted = useMemo(() => {
        return Object.entries(cashDenominations).reduce((sum, [denom, count]) => {
            return sum + (Number(denom) * Number(count || 0));
        }, 0);
    }, [cashDenominations]);

    return (
        <div className="p-2 sm:p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Receipt size={24} />
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Billing Management
                        </h2>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                        Live table bill settlements, tax invoices, POS counter billing &amp; daily register audit.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button 
                        onClick={() => setActiveTab('pos')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} /> New Counter Bill
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                        <Download size={15} /> Export CSV
                    </button>
                    <button 
                        onClick={fetchData} 
                        className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer border border-gray-200 dark:border-slate-700"
                        title="Refresh Data"
                    >
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Billed Today */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Today's Billed Revenue
                        </span>
                        <span className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 rounded-xl">
                            <Banknote size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            ₹{metrics.totalBilledToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">● {metrics.paidCountToday} Invoices</span> settled today
                    </p>
                </div>

                {/* Cash vs Digital */}
                <div className="bg-gradient-to-br from-blue-500/10 via-white to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                            Cash vs Digital Split
                        </span>
                        <span className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-xl">
                            <Split size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Cash</p>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                ₹{metrics.cashToday.toLocaleString('en-IN')}
                            </h4>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-gray-400">UPI + Card</p>
                            <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                ₹{metrics.digitalToday.toLocaleString('en-IN')}
                            </h4>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden flex">
                        <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${metrics.totalBilledToday > 0 ? (metrics.cashToday / metrics.totalBilledToday) * 100 : 50}%` }} 
                            title="Cash Portion"
                        />
                        <div 
                            className="bg-indigo-500 h-full" 
                            style={{ width: `${metrics.totalBilledToday > 0 ? (metrics.digitalToday / metrics.totalBilledToday) * 100 : 50}%` }} 
                            title="Digital Portion"
                        />
                    </div>
                </div>

                {/* Open / Unsettled Bills */}
                <div 
                    onClick={() => setActiveTab('active')}
                    className="bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/40 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Active Open Bills
                        </span>
                        <span className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 rounded-xl">
                            <Clock size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {metrics.openBillsCount} Tables
                        </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-semibold flex items-center justify-between">
                        <span>Pending Value: ₹{metrics.openBillsTotal.toLocaleString('en-IN')}</span>
                        <span className="text-amber-600 font-bold hover:underline">Settle ↗</span>
                    </p>
                </div>

                {/* Tax / GST Collected */}
                <div className="bg-gradient-to-br from-purple-500/10 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/40 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                            Taxes / GST Collected
                        </span>
                        <span className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-xl">
                            <Landmark size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            ₹{metrics.totalTaxToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-semibold">
                        CGST: ₹{(metrics.totalTaxToday / 2).toFixed(2)} · SGST: ₹{(metrics.totalTaxToday / 2).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-1.5 sm:gap-2">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'active'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Clock size={16} /> Active Open Bills ({activeOpenBills.length})
                </button>
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'invoices'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <FileText size={16} /> Invoices &amp; History
                </button>
                <button
                    onClick={() => setActiveTab('pos')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'pos'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Plus size={16} /> Quick POS Counter Billing
                </button>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'summary'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Landmark size={16} /> Day-End Cash Summary
                </button>
            </div>

            {/* TAB 1: ACTIVE OPEN BILLS */}
            {activeTab === 'active' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                        <div>
                            <h3 className="font-bold text-base text-gray-900 dark:text-white">Live Open Orders &amp; Table Bills</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Bills requiring payment settlement or actively dining in restaurant.</p>
                        </div>
                        {branches.length > 1 && (
                            <select 
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-gray-700 dark:text-slate-300"
                            >
                                <option value="All">All Branches</option>
                                {branches.map(b => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {activeOpenBills.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">All Bills Are Settled!</h4>
                            <p className="text-gray-400 text-xs max-w-sm mx-auto">No pending or unpaid orders currently in the queue. Create a new bill using the Quick POS tab.</p>
                            <button
                                onClick={() => setActiveTab('pos')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition-colors"
                            >
                                <Plus size={14} /> Open POS Counter
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeOpenBills.map(bill => {
                                const badge = getStatusBadge(bill.isPaid, bill.status);
                                const isBillingRequested = bill.status === 'Billing Requested' || bill.status === 'Served';
                                return (
                                    <div 
                                        key={bill._id}
                                        className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                                            isBillingRequested 
                                                ? 'border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/20 shadow-amber-500/5' 
                                                : 'border-gray-100 dark:border-slate-800'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div>
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                        #{bill._id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <h4 className="text-base font-black text-gray-900 dark:text-white">
                                                        {bill.tableNumber ? `Table ${bill.tableNumber}` : (bill.orderType || 'Counter Order')}
                                                    </h4>
                                                    <p className="text-[11px] text-gray-400">
                                                        {bill.user?.name || 'Walk-in Guest'} · {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.style}`}>
                                                    {badge.label}
                                                </span>
                                            </div>

                                            {/* Order items snippet */}
                                            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl mb-4 space-y-1.5 text-xs max-h-36 overflow-y-auto custom-scrollbar">
                                                {(bill.orderItems || []).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-gray-700 dark:text-slate-300">
                                                        <span className="truncate pr-2 font-medium">
                                                            {item.qty || item.quantity || 1}x {item.name}
                                                        </span>
                                                        <span className="font-bold shrink-0 text-gray-900 dark:text-white">
                                                            ₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 dark:border-slate-800 pt-3 mt-2">
                                            <div className="flex items-baseline justify-between mb-3">
                                                <span className="text-xs font-bold text-gray-500">Total Amount:</span>
                                                <span className="text-xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                    ₹{(bill.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={() => openSettleModal(bill)}
                                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <CheckCircle2 size={14} /> Settle Bill
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedInvoice(bill)}
                                                    className="w-full py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <Printer size={14} /> View Slip
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: INVOICES & BILLING HISTORY */}
            {activeTab === 'invoices' && (
                <div className="space-y-4">
                    {/* Filters Toolbar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search Invoice ID, customer, table..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium dark:text-white"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            {/* Period Filter */}
                            <select 
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200"
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">Past 7 Days</option>
                                <option value="month">This Month</option>
                                <option value="all">All Time</option>
                            </select>

                            {/* Status Filter */}
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200"
                            >
                                <option value="All">All Status</option>
                                <option value="Paid">Paid Only</option>
                                <option value="Pending">Pending</option>
                                <option value="Refunded">Refunded</option>
                            </select>

                            {/* Payment Method */}
                            <select 
                                value={methodFilter}
                                onChange={(e) => setMethodFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200"
                            >
                                <option value="All">All Methods</option>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Split">Split</option>
                            </select>

                            {/* Order Type */}
                            <select 
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200"
                            >
                                <option value="All">All Types</option>
                                <option value="Dine In">Dine In</option>
                                <option value="Self-Pickup">Takeaway</option>
                                <option value="Delivery">Delivery</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                <p className="text-xs text-gray-400 mt-2">Loading invoice records...</p>
                            </div>
                        ) : historicalInvoices.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 space-y-2">
                                <Receipt className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600" />
                                <p className="text-sm font-semibold">No invoices found matching criteria.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice / Bill #</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer / Table</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Order Type</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Tax (5%)</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Grand Total</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs sm:text-sm">
                                        {historicalInvoices.map(invoice => {
                                            const badge = getStatusBadge(invoice.isPaid, invoice.status);
                                            const method = getMethodBadge(invoice.paymentMethod);
                                            const MethodIcon = method.icon;
                                            return (
                                                <tr key={invoice._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                                                        INV-{invoice._id.slice(-6).toUpperCase()}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400 text-xs">
                                                        {new Date(invoice.createdAt).toLocaleDateString()} {new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <p className="font-bold text-gray-900 dark:text-white">{invoice.user?.name || 'Walk-in Guest'}</p>
                                                        <p className="text-[11px] text-gray-400">{invoice.tableNumber ? `Table #${invoice.tableNumber}` : 'Counter'}</p>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="font-semibold text-gray-700 dark:text-slate-300">
                                                            {invoice.orderType || 'Dine In'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${method.color}`}>
                                                            <MethodIcon size={13} /> {invoice.paymentMethod || 'Card'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 font-medium text-gray-500 dark:text-slate-400">
                                                        ₹{(invoice.taxPrice || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-5 py-3.5 font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                        ₹{(invoice.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.style}`}>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button 
                                                                onClick={() => setSelectedInvoice(invoice)}
                                                                className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                                                title="View / Print Invoice"
                                                            >
                                                                <Printer size={13} /> Invoice
                                                            </button>

                                                            {invoice.isPaid && invoice.status !== 'Refunded' && (
                                                                <button 
                                                                    onClick={() => setRefundModalOrder(invoice)}
                                                                    className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
                                                                    title="Refund Invoice"
                                                                >
                                                                    <RefreshCcw size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: QUICK POS COUNTER BILL GENERATOR */}
            {activeTab === 'pos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left 7 Cols: Menu Catalog */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">POS Menu Catalog</h3>
                                <p className="text-xs text-gray-400">Click items to add to the active counter bill.</p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                                <input 
                                    type="text" 
                                    placeholder="Search food items..."
                                    value={posMenuSearch}
                                    onChange={(e) => setPosMenuSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Menu Items Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                            {menuItems
                                .filter(m => !posMenuSearch || m.name.toLowerCase().includes(posMenuSearch.toLowerCase()))
                                .map(item => (
                                    <div 
                                        key={item._id}
                                        onClick={() => handleAddToCart(item)}
                                        className="bg-gray-50/70 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 p-3 rounded-xl transition-all cursor-pointer flex flex-col justify-between group"
                                    >
                                        <div>
                                            <p className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                                {item.name}
                                            </p>
                                            <span className="text-[10px] text-gray-400 block mt-0.5">
                                                {item.category?.name || item.category || 'Food'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="font-black text-sm text-gray-900 dark:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                ₹{(item.price || 0).toFixed(2)}
                                            </span>
                                            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform">
                                                +
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Right 5 Cols: Active Bill Terminal */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                            <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                <Receipt size={18} className="text-emerald-600" /> Active Bill Terminal
                            </h3>
                            {posCart.length > 0 && (
                                <button 
                                    onClick={() => setPosCart([])}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                                >
                                    <Trash2 size={13} /> Clear
                                </button>
                            )}
                        </div>

                        {/* Customer & Order Metadata */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <label className="font-bold text-gray-500 dark:text-slate-400 block mb-1">Order Type</label>
                                <select 
                                    value={posOrderType}
                                    onChange={(e) => setPosOrderType(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-gray-800 dark:text-white"
                                >
                                    <option value="Dine In">Dine In</option>
                                    <option value="Self-Pickup">Takeaway</option>
                                    <option value="Delivery">Delivery</option>
                                </select>
                            </div>

                            {posOrderType === 'Dine In' && (
                                <div>
                                    <label className="font-bold text-gray-500 dark:text-slate-400 block mb-1">Table #</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. 4"
                                        value={posTableNum}
                                        onChange={(e) => setPosTableNum(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-semibold text-gray-800 dark:text-white"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="font-bold text-gray-500 dark:text-slate-400 block mb-1">Customer Name</label>
                                <input 
                                    type="text"
                                    placeholder="Guest Name"
                                    value={posCustomerName}
                                    onChange={(e) => setPosCustomerName(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-semibold text-gray-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-gray-500 dark:text-slate-400 block mb-1">Phone (Optional)</label>
                                <input 
                                    type="text"
                                    placeholder="9876543210"
                                    value={posCustomerPhone}
                                    onChange={(e) => setPosCustomerPhone(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-semibold text-gray-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-3 min-h-[140px] max-h-52 overflow-y-auto space-y-2 custom-scrollbar">
                            {posCart.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-10 font-semibold">
                                    No items added yet. Click dishes from catalog to begin.
                                </p>
                            ) : (
                                posCart.map(item => (
                                    <div key={item._id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-slate-800 last:border-0">
                                        <div className="min-w-0 pr-2">
                                            <p className="font-bold text-gray-800 dark:text-slate-200 truncate">{item.name}</p>
                                            <p className="text-[10px] text-gray-400">₹{item.price} each</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                <button 
                                                    onClick={() => handleUpdateQty(item._id, -1)}
                                                    className="px-2 py-0.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 text-gray-700 dark:text-slate-300 font-bold"
                                                >
                                                    -
                                                </button>
                                                <span className="px-2 font-bold text-gray-900 dark:text-white">{item.qty}</span>
                                                <button 
                                                    onClick={() => handleUpdateQty(item._id, 1)}
                                                    className="px-2 py-0.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 text-gray-700 dark:text-slate-300 font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="font-black text-gray-900 dark:text-white w-14 text-right" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                ₹{(item.price * item.qty).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Bill Breakdown Calculations */}
                        <div className="space-y-2 text-xs border-t border-gray-100 dark:border-slate-800 pt-3">
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span className="font-bold text-gray-800 dark:text-slate-200">₹{posSubtotal.toFixed(2)}</span>
                            </div>

                            {/* Discount selector */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Discount</span>
                                <div className="flex items-center gap-1">
                                    {[0, 5, 10, 15].map(d => (
                                        <button 
                                            key={d}
                                            onClick={() => setPosDiscountPct(d)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${posDiscountPct === d ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
                                        >
                                            {d}%
                                        </button>
                                    ))}
                                    <span className="text-emerald-600 font-bold ml-1">-₹{posDiscountAmt.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-gray-500">
                                <span>GST (5% CGST+SGST)</span>
                                <span className="font-bold text-gray-800 dark:text-slate-200">+₹{posTaxAmt.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-baseline border-t border-gray-100 dark:border-slate-800 pt-2 text-sm">
                                <span className="font-extrabold text-gray-900 dark:text-white">Grand Total</span>
                                <span className="text-xl font-black text-emerald-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    ₹{posTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1.5">Payment Method</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Cash', 'UPI', 'Card'].map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setPosPaymentMethod(m)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            posPaymentMethod === m
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20'
                                                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {m === 'Cash' && <Banknote size={14} />}
                                        {m === 'UPI' && <QrCode size={14} />}
                                        {m === 'Card' && <CreditCard size={14} />}
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Final Action */}
                        <button
                            onClick={handleCreateAndSettlePosBill}
                            disabled={isSubmittingPos || posCart.length === 0}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <CheckCircle2 size={16} /> 
                            {isSubmittingPos ? 'Processing & Printing...' : `Generate & Settle Bill (₹${posTotal.toFixed(2)})`}
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 4: DAY-END CASH & REGISTER SUMMARY */}
            {activeTab === 'summary' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left 7 Cols: Financial Closing Statement */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Shift Close &amp; Reconciliation</span>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Day-End Register Closing Summary
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Date: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                                <span className="text-gray-600 dark:text-slate-400">Total Orders Settled Today</span>
                                <span className="font-black text-gray-900 dark:text-white">{metrics.paidCountToday} Invoices</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                                <span className="text-gray-600 dark:text-slate-400">Total Cash Collections</span>
                                <span className="font-black text-emerald-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    ₹{metrics.cashToday.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                                <span className="text-gray-600 dark:text-slate-400">Total UPI QR Collections</span>
                                <span className="font-black text-indigo-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    ₹{metrics.upiToday.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                                <span className="text-gray-600 dark:text-slate-400">Total Card POS Swipes</span>
                                <span className="font-black text-blue-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    ₹{metrics.cardToday.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                                <span className="text-gray-600 dark:text-slate-400">CGST Collected (2.5%)</span>
                                <span className="font-bold text-gray-800 dark:text-slate-200">
                                    ₹{(metrics.totalTaxToday / 2).toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                                <span className="text-gray-600 dark:text-slate-400">SGST Collected (2.5%)</span>
                                <span className="font-bold text-gray-800 dark:text-slate-200">
                                    ₹{(metrics.totalTaxToday / 2).toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                                <span className="text-gray-600 dark:text-slate-400">Refunds &amp; Cancellations</span>
                                <span className="font-bold text-purple-600">
                                    ₹{metrics.refundsToday.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-baseline pt-4 border-t-2 border-dashed border-gray-200 dark:border-slate-700">
                                <span className="font-black text-base text-gray-900 dark:text-white">Net Total Revenue</span>
                                <span className="text-2xl font-black text-emerald-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    ₹{metrics.totalBilledToday.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={() => window.print()}
                            className="w-full py-3 bg-gray-900 dark:bg-slate-800 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                            <Printer size={15} /> Print Day-End Settlement Report
                        </button>
                    </div>

                    {/* Right 5 Cols: Physical Cash Drawer Denominations */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Drawer Verification</span>
                            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                                Cash Denominations Counter
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Tally physical notes in till against system cash.</p>
                        </div>

                        <div className="space-y-2 text-xs">
                            {Object.keys(cashDenominations).sort((a,b) => b-a).map(denom => (
                                <div key={denom} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                                    <span className="font-bold text-gray-700 dark:text-slate-300 w-16">₹{denom}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">×</span>
                                        <input 
                                            type="number"
                                            min="0"
                                            value={cashDenominations[denom]}
                                            onChange={(e) => setCashDenominations({ ...cashDenominations, [denom]: Math.max(0, parseInt(e.target.value) || 0) })}
                                            className="w-20 px-2 py-1 text-center font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs"
                                        />
                                    </div>
                                    <span className="font-black text-gray-900 dark:text-white w-20 text-right" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                        ₹{(Number(denom) * Number(cashDenominations[denom] || 0)).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-500">Physical Cash Counted</span>
                                <span className="font-black text-base text-gray-900 dark:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    ₹{totalCashCounted.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-500">System Cash Expected</span>
                                <span className="font-black text-base text-emerald-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    ₹{metrics.cashToday.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-100 dark:border-slate-800 pt-2 font-bold">
                                <span>Variance / Discrepancy</span>
                                <span className={`text-sm font-black ${
                                    totalCashCounted - metrics.cashToday >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                    {totalCashCounted - metrics.cashToday >= 0 ? '+' : ''}₹{(totalCashCounted - metrics.cashToday).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: SETTLE BILL MODAL */}
            {settleModalOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95">
                        <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                            <div>
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Fast Settlement</span>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                    Settle Bill #{settleModalOrder._id.slice(-6).toUpperCase()}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {settleModalOrder.tableNumber ? `Table ${settleModalOrder.tableNumber}` : settleModalOrder.orderType} · {settleModalOrder.user?.name || 'Walk-in'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSettleModalOrder(null)} 
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Order breakdown summary */}
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-3.5 rounded-xl space-y-1.5 text-xs">
                            <div className="flex justify-between text-gray-500">
                                <span>Items Subtotal ({settleModalOrder.orderItems?.length || 1} items)</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    ₹{(settleModalOrder.orderItems?.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0) || settleModalOrder.totalPrice).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Discount Applicable</span>
                                <div className="flex items-center gap-1.5">
                                    {[0, 5, 10, 15].map(d => (
                                        <button 
                                            key={d}
                                            onClick={() => setSettleDiscountPct(d)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${settleDiscountPct === d ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300'}`}
                                        >
                                            {d}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Taxes (5% GST)</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    ₹{(((settleModalOrder.totalPrice || 0) * (1 - settleDiscountPct/100)) * 0.05).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 dark:border-slate-700 text-sm">
                                <span className="font-bold text-gray-900 dark:text-white">Final Amount to Settle</span>
                                <span className="text-xl font-black text-emerald-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    ₹{(((settleModalOrder.totalPrice || 0) * (1 - settleDiscountPct/100)) * 1.05).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 dark:text-slate-300 block mb-2">Select Payment Method</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['Cash', 'UPI', 'Card', 'Split'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setSettleMethod(m)}
                                        className={`py-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                            settleMethod === m 
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/20'
                                                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {m === 'Cash' && <Banknote size={18} />}
                                        {m === 'UPI' && <QrCode size={18} />}
                                        {m === 'Card' && <CreditCard size={18} />}
                                        {m === 'Split' && <Split size={18} />}
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* If Cash, tender calculator */}
                        {settleMethod === 'Cash' && (
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                    <label className="font-bold text-gray-700 dark:text-slate-300 block">Cash Tendered by Customer</label>
                                    <input 
                                        type="number"
                                        placeholder="e.g. 1000"
                                        value={settleCashTendered}
                                        onChange={(e) => setSettleCashTendered(e.target.value)}
                                        className="mt-1 px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-gray-900 dark:text-white text-sm w-36"
                                    />
                                </div>
                                {Number(settleCashTendered) > 0 && (
                                    <div className="text-right">
                                        <span className="text-gray-400 font-semibold block">Change Return</span>
                                        <span className="text-lg font-black text-emerald-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                            ₹{Math.max(0, Number(settleCashTendered) - (((settleModalOrder.totalPrice || 0) * (1 - settleDiscountPct/100)) * 1.05)).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setSettleModalOrder(null)}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 font-bold text-xs text-gray-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSettle}
                                disabled={isSubmittingSettle}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 font-bold text-xs text-white rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <CheckCircle2 size={16} /> {isSubmittingSettle ? 'Settling...' : 'Confirm & Settle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: PRINTABLE THERMAL & DIGITAL INVOICE MODAL */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                        
                        {/* Header bar */}
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/50 shrink-0">
                            <div className="flex items-center gap-2">
                                <Receipt size={18} className="text-emerald-600" />
                                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                                    Invoice #{selectedInvoice._id.slice(-6).toUpperCase()}
                                </h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleTriggerPrint}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                >
                                    <Printer size={13} /> Print
                                </button>
                                <button 
                                    onClick={() => setSelectedInvoice(null)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Printable Thermal Receipt Slip */}
                        <div ref={printReceiptRef} className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-gray-800 dark:text-slate-200">
                            {/* Restaurant Letterhead */}
                            <div className="text-center space-y-1 border-b-2 border-dashed border-gray-300 dark:border-slate-700 pb-4">
                                <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white font-sans uppercase">
                                    {restaurant?.name || 'FoodNest'}
                                </h2>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                    {restaurant?.address || 'Main Branch Highway, Downtown'}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                    Phone: {restaurant?.phone || '+91 98765 43210'} · GSTIN: 33ABCDE1234F1Z5
                                </p>
                                <span className="inline-block px-2 py-0.5 mt-1 bg-gray-100 dark:bg-slate-800 text-[10px] font-bold rounded uppercase">
                                    TAX INVOICE
                                </span>
                            </div>

                            {/* Bill Metadata */}
                            <div className="grid grid-cols-2 gap-1 text-[11px] border-b border-gray-200 dark:border-slate-800 pb-3">
                                <div>
                                    <p className="text-gray-400">Invoice ID:</p>
                                    <p className="font-bold">INV-{selectedInvoice._id.slice(-6).toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-400">Date &amp; Time:</p>
                                    <p className="font-bold">{new Date(selectedInvoice.createdAt || Date.now()).toLocaleString()}</p>
                                </div>
                                <div className="mt-1">
                                    <p className="text-gray-400">Customer / Table:</p>
                                    <p className="font-bold">{selectedInvoice.user?.name || 'Walk-in'} {selectedInvoice.tableNumber ? `(T-${selectedInvoice.tableNumber})` : ''}</p>
                                </div>
                                <div className="mt-1 text-right">
                                    <p className="text-gray-400">Order Mode:</p>
                                    <p className="font-bold uppercase">{selectedInvoice.orderType || 'Dine In'}</p>
                                </div>
                            </div>

                            {/* Itemized Table */}
                            <div className="space-y-1.5 border-b-2 border-dashed border-gray-300 dark:border-slate-700 pb-3">
                                <div className="flex justify-between font-bold text-gray-400 text-[10px] uppercase pb-1">
                                    <span>Item</span>
                                    <span>Qty × Rate</span>
                                    <span>Amount</span>
                                </div>
                                {(selectedInvoice.orderItems || []).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-[11px]">
                                        <span className="truncate max-w-[150px] font-medium">{item.name}</span>
                                        <span className="text-gray-500">{item.qty || item.quantity || 1} × ₹{item.price}</span>
                                        <span className="font-bold">₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Total Breakdown */}
                            <div className="space-y-1 text-xs border-b border-gray-200 dark:border-slate-800 pb-3">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>₹{((selectedInvoice.totalPrice || 0) - (selectedInvoice.taxPrice || 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>CGST (2.5%)</span>
                                    <span>₹{((selectedInvoice.taxPrice || 0) / 2).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>SGST (2.5%)</span>
                                    <span>₹{((selectedInvoice.taxPrice || 0) / 2).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2 text-sm font-bold border-t border-gray-200 dark:border-slate-800">
                                    <span className="text-gray-900 dark:text-white uppercase font-black">Grand Total</span>
                                    <span className="text-lg font-black text-emerald-600 font-sans">
                                        ₹{(selectedInvoice.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Method & Footer */}
                            <div className="text-center space-y-1 pt-1 text-[11px]">
                                <p className="font-bold uppercase text-emerald-600">
                                    Payment Method: {selectedInvoice.paymentMethod || 'Card'} · {selectedInvoice.isPaid ? 'PAID' : 'PENDING'}
                                </p>
                                <p className="text-gray-400 text-[10px]">
                                    Thank you for dining with us! Please visit again.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: REFUND CONFIRMATION MODAL */}
            {refundModalOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 text-center">
                        <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto">
                            <RefreshCcw size={26} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Process Refund?</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Are you sure you want to issue a refund of <strong className="text-gray-900 dark:text-white">₹{refundModalOrder.totalPrice}</strong> for Invoice #{refundModalOrder._id.slice(-6).toUpperCase()}?
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setRefundModalOrder(null)}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessRefund}
                                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                            >
                                Confirm Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BillingManagement;
