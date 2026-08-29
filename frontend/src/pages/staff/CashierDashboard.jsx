import { useState, useEffect } from 'react';
import { 
    Receipt, CreditCard, Banknote, QrCode, 
    Calculator, Split, Printer, CheckCircle, 
    ArrowLeftRight, Tag, Undo2, Coins, Landmark
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';

const CashierDashboard = () => {
    const { api } = useAuth();
    const [queue, setQueue] = useState([]);
    const [selfPickupQueue, setSelfPickupQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('Pending');
    const [activeBill, setActiveBill] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Card');
    const [isSplit, setIsSplit] = useState(false);
    const [splitParts, setSplitParts] = useState(1);
    const [settled, setSettled] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const [isMerging, setIsMerging] = useState(false);
    const [mergeTargetId, setMergeTargetId] = useState('');

    // Fetch orders on load & refresh
    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setQueue(data.filter(o => !o.isPaid && o.orderType !== 'Self-Pickup' && o.orderType !== 'Self Pickup' && (o.status === 'Served' || o.status === 'Billing Requested' || o.status === 'Delivered')));
            setSelfPickupQueue(data.filter(o => (o.orderType === 'Self-Pickup' || o.orderType === 'Self Pickup') && o.status === 'Picked Up'));
            setHistory(data.filter(o => o.isPaid || o.status === 'Completed'));
        } catch (error) {
            console.error('Failed to fetch orders', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
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

    // Create a test order for visual testing in browser
    const handleCreateTestOrder = async () => {
        try {
            await api.post('/orders', {
                orderItems: [
                    { name: 'Margherita Pizza', price: 299, qty: 1 },
                    { name: 'Garlic Bread', price: 99, qty: 2 }
                ],
                orderType: 'Dine In',
                tableNumber: '4',
                taxPrice: 24.85,
                totalPrice: 521.85,
                source: 'Walk-in'
            });
            toast.success('Test order created!');
            fetchOrders();
        } catch (error) {
            console.error('Failed to create test order', error);
            toast.error('Failed to create test order');
        }
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
                            
                            <div className="space-y-2">
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
                            <div className="space-y-2">
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

                            <div className="space-y-2">
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
                                    <div className="space-y-1">
                                        <p className="font-bold text-gray-400">Source Table {sourceBill.tableNumber}</p>
                                        <p className="font-black text-gray-900 dark:text-white">₹{sourceBill.totalPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1">
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
                        <div className="space-y-3">
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
                            
                            <div className="space-y-4">
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
                            <div className="space-y-3">
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
                            
                            <div className="space-y-4">
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
                            <div className="space-y-3">
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
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
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
                                        <td className="p-4 font-semibold">{bill.orderType === 'Dine In' ? `Table ${bill.tableNumber || 'Any'}` : bill.orderType}</td>
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
                                            <td className="p-4 font-mono font-bold">#{bill._id.toUpperCase()}</td>
                                            <td className="p-4 font-semibold">{bill.orderType} {bill.tableNumber ? `(Table ${bill.tableNumber})` : ''}</td>
                                            <td className="p-4"><span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 rounded font-bold">{bill.status}</span></td>
                                            <td className="p-4 font-black">₹{bill.totalPrice.toFixed(2)}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handlePrintReceipt(bill)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg border border-blue-100 transition-all flex items-center gap-1 ml-auto">
                                                    <Printer size={12} /> Print Receipt
                                                </button>
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

    return (
        <div className="h-full flex flex-col gap-4">
            
            {/* Shift Attendance Clock In / Clock Out Status Bar */}
            <StaffShiftClockWidget userRole="POS Cashier / Billing Agent" userName="Cashier" />

            <div className="flex-1 flex gap-6 min-h-0">
            
            {/* Left Queue View */}
            <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0 shrink-0">
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4 shrink-0">
                    {['Pending', 'Self-Pickup', 'Paid'].map(t => (
                        <button 
                            key={t}
                            onClick={() => { setActiveTab(t); setActiveBill(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                activeTab === t ? 'bg-white shadow-sm text-green-700 font-extrabold' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t === 'Pending' ? 'Billing' : t === 'Self-Pickup' ? 'Pickup' : 'History'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {activeTab === 'Pending' && (
                        queue.length === 0 ? (
                            <div className="text-center py-10 space-y-4">
                                <p className="text-gray-400 text-xs font-semibold">No pending bills.</p>
                                <button 
                                    type="button"
                                    onClick={handleCreateTestOrder}
                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] rounded-xl transition-all shadow-md shadow-green-600/10 active:scale-95"
                                >
                                    + Add Test Order (Dine-In T4)
                                </button>
                            </div>
                        ) :
                        queue.map(bill => (
                            <button
                                key={bill._id}
                                onClick={() => handleSelectBill(bill)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                                    activeBill?._id === bill._id 
                                    ? 'border-green-500 bg-green-50/50 shadow-sm' 
                                    : 'border-gray-100 bg-white hover:border-green-200'
                                }`}
                            >
                                <div>
                                    <p className="font-bold text-gray-900">{bill.orderType === 'Dine In' ? `Table ${bill.tableNumber || 'Any'}` : bill.orderType}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">#{bill._id.substring(bill._id.length - 6).toUpperCase()}</p>
                                </div>
                                <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-100">{bill.status}</span>
                            </button>
                        ))
                    )}

                    {activeTab === 'Self-Pickup' && (
                        selfPickupQueue.length === 0 ? <p className="text-center text-gray-400 py-10 text-xs">No ready self-pickups.</p> :
                        selfPickupQueue.map(bill => (
                            <button
                                key={bill._id}
                                onClick={() => handleSelectBill(bill)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                                    activeBill?._id === bill._id 
                                    ? 'border-green-500 bg-green-50/50 shadow-sm' 
                                    : 'border-gray-100 bg-white hover:border-green-200'
                                }`}
                            >
                                <div>
                                    <p className="font-bold text-gray-900">Self Pickup Counter</p>
                                    <p className="text-[10px] text-gray-400 font-mono">#{bill._id.substring(bill._id.length - 6).toUpperCase()}</p>
                                </div>
                                <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-100">Ready</span>
                            </button>
                        ))
                    )}

                    {activeTab === 'Paid' && (
                        history.length === 0 ? <p className="text-center text-gray-400 py-10 text-xs">No payment history.</p> :
                        history.map(bill => (
                            <button
                                key={bill._id}
                                onClick={() => handleSelectBill(bill)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                                    activeBill?._id === bill._id 
                                    ? 'border-green-500 bg-green-50/50 shadow-sm' 
                                    : 'border-gray-100 bg-white hover:border-green-200'
                                }`}
                            >
                                <div>
                                    <p className="font-bold text-gray-900">{bill.orderType === 'Dine In' ? `Table ${bill.tableNumber || 'Any'}` : bill.orderType}</p>
                                    <p className="text-[10px] text-gray-450 font-bold">{bill.paymentMethod} • ₹{bill.totalPrice.toFixed(2)}</p>
                                </div>
                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded">Settled</span>
                            </button>
                        ))
                    )}
                </div>

                {/* Daily Cash Summary Box */}
                <div className={`p-4 rounded-2xl mt-4 space-y-2 text-xs font-semibold border transition-all ${
                    window.location.pathname.includes('/cashier/summary')
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-500 shadow-md ring-2 ring-purple-100 dark:ring-purple-900/40 text-purple-950 dark:text-purple-100 scale-[1.02]'
                    : 'bg-gray-50 dark:bg-slate-900/50 border-gray-150 dark:border-slate-800 text-gray-700 dark:text-gray-300'
                }`}>
                    <p className="font-bold uppercase tracking-wider text-[10px] text-gray-400 dark:text-purple-400">Daily Shift Sales Summary</p>
                    <div className="flex justify-between"><span>💵 Cash Sales</span><span>₹{cashSummary.cash.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>💳 Card Sales</span><span>₹{cashSummary.card.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>📲 UPI / Online</span><span>₹{(cashSummary.upi + cashSummary.online).toFixed(2)}</span></div>
                    <div className="border-t border-gray-200 dark:border-purple-900/40 pt-2 flex justify-between font-bold text-green-700 dark:text-green-400">
                        <span>Total Collection</span>
                        <span>₹{cashSummary.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Right Side Billing Console */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
                {!activeBill ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3">
                        <Receipt size={48} className="text-gray-300" />
                        <p className="text-sm font-medium">Select a pending bill from the sidebar to process.</p>
                    </div>
                ) : settled ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-green-600 space-y-4">
                        <CheckCircle size={48} className="text-green-500 animate-bounce" />
                        <h3 className="text-xl font-bold text-gray-800">Processing payment invoice...</h3>
                    </div>
                ) : (
                    <div className="flex h-full gap-8">
                        {/* Order & Items list */}
                        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-100 pr-8">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {activeBill.orderType === 'Dine In' ? `Table ${activeBill.tableNumber || 'Any'}` : activeBill.orderType}
                                    </h3>
                                    <p className="text-xs text-gray-450 font-mono">Invoice Ref: #{activeBill._id.toUpperCase()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsMerging(!isMerging)}
                                        className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1"
                                    >
                                        <ArrowLeftRight size={14} /> Merge Bill
                                    </button>
                                </div>
                            </div>

                            {/* Merge Overlay Selector */}
                            {isMerging && (
                                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-4 space-y-3 animate-in slide-in-from-top-2">
                                    <p className="text-xs font-bold text-orange-850">Select target order to merge items into:</p>
                                    <div className="flex gap-2">
                                        <select 
                                            value={mergeTargetId} 
                                            onChange={(e) => setMergeTargetId(e.target.value)}
                                            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs"
                                        >
                                            <option value="">Select Order</option>
                                            {queue.filter(q => q._id !== activeBill._id).map(q => (
                                                <option key={q._id} value={q._id}>Table {q.tableNumber || 'Any'} (Ref: #{q._id.substring(q._id.length - 4).toUpperCase()})</option>
                                            ))}
                                        </select>
                                        <button onClick={handleMergeBill} className="bg-orange-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs">Merge</button>
                                        <button onClick={() => setIsMerging(false)} className="text-gray-550 text-xs">Cancel</button>
                                    </div>
                                </div>
                            )}

                            {/* Items list */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 custom-scrollbar">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-gray-400 font-bold border-b border-gray-200 pb-2">
                                            <th className="pb-2">Menu Item</th>
                                            <th className="pb-2 text-center">Qty</th>
                                            <th className="pb-2 text-right">Price</th>
                                            <th className="pb-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activeBill.orderItems.map((item, idx) => (
                                            <tr key={idx} className="text-gray-900">
                                                <td className="py-2.5 font-semibold text-gray-800">{item.name}</td>
                                                <td className="py-2.5 text-center font-bold">{item.qty}</td>
                                                <td className="py-2.5 text-right text-gray-450">₹{item.price.toFixed(2)}</td>
                                                <td className="py-2.5 text-right font-extrabold">₹{(item.price * item.qty).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Applied Discounts & Totals */}
                            <div className="space-y-3 shrink-0">
                                <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <span>Discount Rate</span>
                                        <div className="flex gap-1">
                                            {[5, 10, 15].map(p => (
                                                <button 
                                                    key={p} 
                                                    onClick={() => setDiscount(p)}
                                                    className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                                                        discount === p ? 'bg-green-500 border-green-600 text-white' : 'bg-white hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {p}%
                                                </button>
                                            ))}
                                            <button onClick={() => setDiscount(0)} className="px-1.5 py-0.5 rounded border text-[10px] font-bold bg-white text-red-500">Clear</button>
                                        </div>
                                    </div>
                                    <span className={discount > 0 ? 'text-red-500 font-bold' : ''}>
                                        -{discount > 0 ? '₹' : ''}{discountAmount.toFixed(2)} ({discount}%)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                                    <span>Goods Tax (5%)</span>
                                    <span>₹{taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end border-t border-gray-150 pt-3">
                                    <span className="font-extrabold text-gray-900 text-sm">Invoice Grand Total</span>
                                    <span className="text-3xl font-black text-green-700 tracking-tight">₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Split Bill Actions */}
                        <div className="w-72 flex flex-col shrink-0 overflow-y-auto custom-scrollbar pr-1">
                            {activeTab === 'Paid' ? (
                                <div className="space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="bg-green-50 border border-green-200 p-5 rounded-2xl text-center space-y-3">
                                        <CheckCircle size={32} className="text-green-500 mx-auto" />
                                        <div>
                                            <p className="font-extrabold text-green-800 text-sm">Payment Settled</p>
                                            <p className="text-xs text-green-600 mt-1">Paid via {activeBill.paymentMethod || 'Online'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mt-auto">
                                        <button 
                                            onClick={() => handlePrintReceipt(activeBill)}
                                            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-sm"
                                        >
                                            <Printer size={16} /> Reprint Invoice
                                        </button>
                                        {activeBill.status !== 'Refunded' ? (
                                            <button 
                                                onClick={() => handleRefund(activeBill._id)}
                                                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded-xl border border-red-200 transition-all flex items-center justify-center gap-1.5 text-xs"
                                            >
                                                <Undo2 size={16} /> Refund Transaction
                                            </button>
                                        ) : (
                                            <span className="block text-center text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-100">Transaction Refunded</span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Method</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'Card', icon: <CreditCard size={16} /> },
                                                { id: 'Cash', icon: <Banknote size={16} /> },
                                                { id: 'UPI', icon: <QrCode size={16} /> }
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => { setPaymentMethod(m.id); setIsSplit(false); }}
                                                    className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                                                        paymentMethod === m.id && !isSplit
                                                        ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                                                        : 'border-gray-100 text-gray-505 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {m.icon}
                                                    <span className="text-[10px] font-bold">{m.id}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Split Bill Calculator */}
                                        <button
                                            onClick={() => setIsSplit(!isSplit)}
                                            className={`w-full py-2.5 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                                isSplit ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-650 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Split size={14} /> {isSplit ? 'Disable Bill Split' : 'Configure Split Bill'}
                                        </button>

                                        {isSplit && (
                                            <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl space-y-4 animate-in slide-in-from-top-2 text-xs font-semibold text-gray-700">
                                                <div className="flex justify-between items-center">
                                                    <span>Split by People:</span>
                                                    <div className="flex items-center gap-2">
                                                        <button type="button" onClick={() => setSplitParts(Math.max(1, splitParts - 1))} className="w-6 h-6 border rounded bg-white font-bold flex items-center justify-center">-</button>
                                                        <span className="font-extrabold">{splitParts}</span>
                                                        <button type="button" onClick={() => setSplitParts(splitParts + 1)} className="w-6 h-6 border rounded bg-white font-bold flex items-center justify-center">+</button>
                                                    </div>
                                                </div>
                                                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-green-700">
                                                    <span>Amount per Person</span>
                                                    <span>₹{(total / splitParts).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action button */}
                                    <div className="mt-auto pt-4">
                                        <button
                                            onClick={activeBill.orderType.includes('Pickup') ? handleCompletePickup : handleSettle}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Complete Invoice & Settle
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default CashierDashboard;
