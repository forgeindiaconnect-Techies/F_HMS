import { useState, useEffect } from 'react';
import { 
    Receipt, CreditCard, Banknote, QrCode, 
    Calculator, Split, Printer, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

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
    const [splitCash, setSplitCash] = useState(0);
    const [settled, setSettled] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');

    // Calculate totals
    const subtotal = activeBill ? activeBill.orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0) : 0;
    const discountAmount = subtotal * (discount / 100);
    const taxAmount = (subtotal - discountAmount) * 0.05;
    const total = subtotal - discountAmount + taxAmount;

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

    // Split payment logic
    const handleSplitChange = (val) => {
        const cashVal = Math.min(Math.max(0, parseFloat(val) || 0), total);
        setSplitCash(cashVal);
    };

    const handleSelectBill = (bill) => {
        setActiveBill(bill);
        setDiscount(0);
        setPaymentMethod('Card');
        setIsSplit(false);
        setSplitCash(0);
        setSettled(false);
    };

    const handlePrintReceipt = (receipt) => {
        if (!receipt) return;
        const printWindow = window.open('', '_blank');
        const itemsHtml = receipt.orderItems.map(item => `
            <div class="row">
                <span>${item.qty}x ${item.name}</span>
                <span>₹${(item.price * item.qty).toFixed(2)}</span>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Bill Receipt #${receipt._id.substring(receipt._id.length - 6).toUpperCase()}</title>
                    <style>
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            width: 280px;
                            margin: 0 auto;
                            padding: 20px 10px;
                            color: #000;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 1px dashed #000;
                            padding-bottom: 15px;
                            margin-bottom: 15px;
                        }
                        .title {
                            font-size: 20px;
                            font-weight: bold;
                            margin: 0 0 5px 0;
                        }
                        .info {
                            font-size: 12px;
                            margin: 2px 0;
                        }
                        .row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 13px;
                            margin: 5px 0;
                        }
                        .totals {
                            border-top: 1px dashed #000;
                            border-bottom: 1px dashed #000;
                            padding: 10px 0;
                            margin: 15px 0;
                        }
                        .grand-total {
                            font-weight: bold;
                            font-size: 15px;
                        }
                        .footer {
                            text-align: center;
                            font-size: 11px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <p class="title">RESTOSYS</p>
                        <p class="info">BILL #${receipt._id.substring(receipt._id.length - 6).toUpperCase()}</p>
                        <p class="info">${receipt.orderType === 'Dine In' ? `Table ${receipt.tableNumber || 'Any'}` : receipt.orderType}</p>
                    </div>
                    
                    <div>
                        ${itemsHtml}
                    </div>
                    
                    <div class="totals">
                        <div class="row">
                            <span>Subtotal</span>
                            <span>₹${(receipt.totalPrice - receipt.taxPrice).toFixed(2)}</span>
                        </div>
                        <div class="row">
                            <span>Tax (5%)</span>
                            <span>₹${receipt.taxPrice.toFixed(2)}</span>
                        </div>
                        <div class="row grand-total">
                            <span>Grand Total</span>
                            <span>₹${receipt.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="footer">
                        Paid via ${receipt.paymentMethod}<br/>
                        ${new Date(receipt.paidAt || receipt.createdAt || new Date()).toLocaleString()}<br/><br/>
                        Thank you for dining with us!
                    </div>
                    
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleSettle = async () => {
        setSettled(true);
        try {
            const finalMethod = isSplit ? 'Split' : paymentMethod;
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
            setTimeout(() => {
                setActiveBill(null);
                setSettled(false);
                fetchOrders();
            }, 2000); // Mock printing receipt delay
        } catch (error) {
            console.error('Failed to settle bill', error);
            setSettled(false);
            toast.error('Payment failed');
        }
    };

    const handleCompletePickup = async () => {
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
            
            await api.put(`/orders/${activeBill._id}/status`, {
                status: 'Completed'
            });

            handlePrintReceipt({
                ...activeBill,
                paymentMethod: finalMethod,
                taxPrice: taxAmount,
                totalPrice: total,
                paidAt: new Date()
            });

            setTimeout(() => {
                setActiveBill(null);
                setSettled(false);
                fetchOrders();
            }, 2000);
        } catch (error) {
            console.error('Failed to complete pickup', error);
            setSettled(false);
            toast.error('Failed to process pickup');
        }
    };

    return (
        <div className="h-full flex gap-6">
            
            {/* Left: Billing Queue */}
            <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0 shrink-0">
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4 shrink-0">
                    <button 
                        onClick={() => { setActiveTab('Pending'); setActiveBill(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'Pending' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-750'}`}
                    >
                        Billing ({queue.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('Self-Pickup'); setActiveBill(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'Self-Pickup' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-750'}`}
                    >
                        Pickups ({selfPickupQueue.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('Paid'); setActiveBill(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'Paid' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-750'}`}
                    >
                        History ({history.length})
                    </button>
                </div>

                {activeTab === 'Self-Pickup' && (
                    <div className="mb-3">
                        <input 
                            type="text"
                            placeholder="Enter Order ID to verify..."
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 font-mono"
                        />
                    </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {activeTab === 'Pending' ? (
                        queue.length === 0 ? (
                            <p className="text-center text-gray-400 py-10 font-medium">No pending bills.</p>
                        ) : (
                            queue.map(bill => (
                                <button 
                                    key={bill._id}
                                    onClick={() => handleSelectBill(bill)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                                        activeBill?._id === bill._id 
                                        ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-500/10' 
                                        : 'border-gray-100 bg-white hover:border-purple-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div>
                                        <p className="font-bold text-gray-900 font-sans text-lg">{bill.orderType === 'Dine In' ? `Table ${bill.tableNumber || 'Any'}` : bill.orderType}</p>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                                            <Receipt size={12} /> #{bill._id.substring(bill._id.length - 4).toUpperCase()}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        activeBill?._id === bill._id ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {bill.status}
                                    </span>
                                </button>
                            ))
                        )
                    ) : activeTab === 'Self-Pickup' ? (
                        selfPickupQueue.filter(bill => bill._id.toLowerCase().includes(verifyCode.toLowerCase())).length === 0 ? (
                            <p className="text-center text-gray-400 py-10 font-medium">No pickups at counter.</p>
                        ) : (
                            selfPickupQueue.filter(bill => bill._id.toLowerCase().includes(verifyCode.toLowerCase())).map(bill => (
                                <button 
                                    key={bill._id}
                                    onClick={() => handleSelectBill(bill)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                                        activeBill?._id === bill._id 
                                        ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10' 
                                        : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div>
                                        <p className="font-bold text-gray-900 font-sans text-sm truncate max-w-[150px]">#{bill._id.toUpperCase()}</p>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                                            <Receipt size={12} /> {bill.orderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        activeBill?._id === bill._id ? 'bg-orange-200 text-orange-850' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        Ready
                                    </span>
                                </button>
                            ))
                        )
                    ) : (
                        history.length === 0 ? (
                            <p className="text-center text-gray-400 py-10 font-medium">No payment history yet.</p>
                        ) : (
                            history.map(bill => (
                                <button 
                                    key={bill._id}
                                    onClick={() => handleSelectBill(bill)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                                        activeBill?._id === bill._id 
                                        ? 'border-green-500 bg-green-50 shadow-md shadow-green-500/10' 
                                        : 'border-gray-100 bg-white hover:border-green-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div>
                                        <p className="font-bold text-gray-900 font-sans text-lg">{bill.orderType === 'Dine In' ? `Table ${bill.tableNumber || 'Any'}` : bill.orderType}</p>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                                            {bill.paymentMethod} • ₹{bill.totalPrice.toFixed(2)}
                                        </p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                        <CheckCircle size={12} /> Paid
                                    </span>
                                </button>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Right: POS Interface */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0 relative overflow-hidden">
                {!activeBill ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                            <Calculator size={40} className="text-gray-300" />
                        </div>
                        <p className="font-medium">Select a bill from the queue to process payment.</p>
                    </div>
                ) : settled ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-green-600 space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
                            <p className="text-gray-500 font-medium mt-2 flex items-center justify-center gap-2">
                                <Printer size={16} className="animate-pulse" /> Printing Receipt...
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full gap-8">
                        {/* Bill Details */}
                        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-100 pr-8">
                            <div className="flex justify-between items-start mb-6 shrink-0">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 font-sans">{activeBill.orderType === 'Dine In' ? `Table ${activeBill.tableNumber || 'Any'}` : activeBill.orderType}</h2>
                                    <p className="text-sm font-medium text-gray-500 mt-1">Order #{activeBill._id.substring(activeBill._id.length - 4).toUpperCase()} • {new Date(activeBill.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-400 font-bold border-b border-gray-200">
                                            <th className="pb-2">Item</th>
                                            <th className="pb-2 text-center">Qty</th>
                                            <th className="pb-2 text-right">Price</th>
                                            <th className="pb-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activeBill.orderItems.map((item, idx) => (
                                            <tr key={idx} className="text-gray-900">
                                                <td className="py-3 font-medium">{item.name}</td>
                                                <td className="py-3 text-center">{item.qty}</td>
                                                <td className="py-3 text-right text-gray-500">₹{item.price.toFixed(2)}</td>
                                                <td className="py-3 text-right font-bold">₹{(item.price * item.qty).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 shrink-0">
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <span>Discount</span>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                min="0" max="100"
                                                value={discount}
                                                onChange={(e) => setDiscount(e.target.value)}
                                                className="w-16 h-7 bg-white border border-gray-200 rounded text-center focus:outline-none focus:border-purple-500 text-gray-900 font-bold"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                        </div>
                                    </div>
                                    <span className={discount > 0 ? 'text-red-500' : ''}>
                                        -{discount > 0 ? '₹' : ''}{discountAmount.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm font-medium text-gray-500 border-b border-gray-100 pb-4">
                                    <span>Tax (5%)</span>
                                    <span>₹{taxAmount.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-end pt-2">
                                    <span className="text-lg font-bold text-gray-900">Grand Total</span>
                                    <span className="text-4xl font-bold text-purple-700 tracking-tight">₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Processing */}
                        <div className="w-[300px] flex flex-col shrink-0 overflow-y-auto custom-scrollbar max-h-full pr-2">
                            {(activeBill.orderType === 'Self-Pickup' || activeBill.orderType === 'Self Pickup') ? (
                                <div className="space-y-6 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Verification Details</h3>
                                        
                                        <div className="bg-orange-50/70 border border-orange-100 p-4 rounded-xl space-y-2">
                                            <p className="text-xs font-bold text-orange-850 uppercase tracking-wide">Order Reference</p>
                                            <p className="text-sm font-mono font-black text-gray-900 truncate">#{activeBill._id.toUpperCase()}</p>
                                        </div>

                                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                                            activeBill.isPaid 
                                            ? 'bg-green-50 border-green-200 text-green-700' 
                                            : 'bg-yellow-50 border-yellow-200 text-yellow-750'
                                        }`}>
                                            {activeBill.isPaid ? (
                                                <>
                                                    <CheckCircle size={24} className="text-green-500" />
                                                    <span className="font-bold">Payment Settled (Pre-Paid)</span>
                                                    <span className="text-[10px] text-green-600 font-medium">Verified via online checkout</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Banknote size={24} className="text-yellow-605 animate-pulse" />
                                                    <span className="font-bold">Unpaid / Pay on Counter</span>
                                                    <span className="text-[10px] text-yellow-600 font-medium">Please collect ₹{total.toFixed(2)} from customer</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {activeBill.status === 'Completed' ? (
                                        <div className="p-4 bg-green-55/70 border border-green-200 rounded-xl flex flex-col items-center justify-center text-center mt-auto">
                                            <CheckCircle size={32} className="text-green-500 mb-2" />
                                            <p className="text-green-700 font-bold">Picked Up & Completed</p>
                                            <button onClick={() => handlePrintReceipt(activeBill)} className="mt-4 w-full bg-white border border-green-200 text-green-700 font-bold py-2 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2 text-sm">
                                                <Printer size={16} /> Print Receipt
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 mt-auto">
                                            {!activeBill.isPaid && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Payment Method</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Cash', 'Card'].map(m => (
                                                            <button
                                                                key={m}
                                                                type="button"
                                                                onClick={() => setPaymentMethod(m)}
                                                                className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                                                    paymentMethod === m 
                                                                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                                                                    : 'border-gray-200 text-gray-650 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {m}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <button 
                                                onClick={handleCompletePickup}
                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <CheckCircle size={18} /> Mark as Picked Up
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Method</h3>
                                    
                                    <div className="space-y-3 mb-6">
                                        {['Card', 'Cash', 'UPI'].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => { setPaymentMethod(method); setIsSplit(false); }}
                                                className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                                                    paymentMethod === method && !isSplit
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200'
                                                }`}
                                            >
                                                {method === 'Card' ? <CreditCard size={20} /> : method === 'Cash' ? <Banknote size={20} /> : <QrCode size={20} />}
                                                <span className="text-lg">{method}</span>
                                            </button>
                                        ))}
                                        
                                        <button
                                            onClick={() => setIsSplit(true)}
                                            className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                                                isSplit
                                                ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200'
                                            }`}
                                        >
                                            <Split size={20} />
                                            <span className="text-lg">Split Payment</span>
                                        </button>
                                    </div>

                                    {/* Split Payment UI */}
                                    {isSplit && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-4 animate-in slide-in-from-top-2">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase flex justify-between mb-2">
                                                    <span>Cash Amount</span>
                                                    <span className="text-gray-900">₹{splitCash.toFixed(2)}</span>
                                                </label>
                                                <input 
                                                    type="range" min="0" max={total} step="0.01"
                                                    value={splitCash}
                                                    onChange={(e) => handleSplitChange(e.target.value)}
                                                    className="w-full accent-purple-600"
                                                />
                                            </div>
                                            <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold">
                                                <span className="text-gray-500 uppercase text-xs">Card Amount</span>
                                                <span className="text-gray-900">₹{(total - splitCash).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {activeBill.isPaid ? (
                                        <div className="mt-auto p-4 bg-green-50/70 border border-green-200 rounded-2xl flex flex-col items-center justify-center text-center">
                                            <CheckCircle size={32} className="text-green-500 mb-2" />
                                            <p className="text-green-700 font-bold">Paid Successfully</p>
                                            <p className="text-green-600 text-sm mt-1">Paid via {activeBill.paymentMethod}</p>
                                            <button onClick={() => handlePrintReceipt(activeBill)} className="mt-4 w-full bg-white border border-green-200 text-green-700 font-bold py-2 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2">
                                                <Printer size={16} /> Print Copy
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-auto">
                                            <button 
                                                onClick={handleSettle}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-purple-600/20 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
                                            >
                                                <Printer size={20} /> Settle & Print
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashierDashboard;
