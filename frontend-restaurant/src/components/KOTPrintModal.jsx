import React, { useRef } from 'react';
import { Printer, X, Check, Utensils, Clock, AlertCircle, Eye, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateThermalKOTHtml, printKOTViaWindow, printKOTViaIframe } from '../utils/receiptGenerator';
import toast from 'react-hot-toast';

const KOTPrintModal = ({ isOpen, onClose, kot, onPrinted }) => {
    const { api, restaurant } = useAuth();
    const printAreaRef = useRef(null);

    if (!isOpen || !kot) return null;

    const itemsList = Array.isArray(kot.items) 
        ? kot.items 
        : Array.isArray(kot.orderItems) 
        ? kot.orderItems 
        : [];

    const handlePrint = async () => {
        try {
            if (kot._id) {
                await api.put(`/kot/${kot._id}/print`).catch(() => {});
            }
            if (onPrinted) onPrinted();
            
            // Generate clean thermal HTML and trigger print preview via dedicated window
            const html = generateThermalKOTHtml(kot, restaurant, { paperWidth: '80mm' });
            printKOTViaWindow(html);
        } catch (err) {
            console.error('Print trigger error', err);
            window.print();
        }
    };

    const handleSilentPrint = async () => {
        try {
            if (kot._id) {
                await api.put(`/kot/${kot._id}/print`).catch(() => {});
            }
            if (onPrinted) onPrinted();
            
            const html = generateThermalKOTHtml(kot, restaurant, { paperWidth: '80mm' });
            printKOTViaIframe(html);
            toast.success('KOT queued for thermal printing');
        } catch (err) {
            console.error('Silent print error', err);
        }
    };

    const formattedDate = kot.createdAt 
        ? new Date(kot.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString();

    const formattedTime = kot.createdAt
        ? new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const tableDisplay = kot.tableNumber && kot.tableNumber !== 'Any' && kot.tableNumber !== 'Takeout'
        ? (kot.tableNumber.startsWith('Table') ? kot.tableNumber : `Table ${kot.tableNumber}`)
        : (kot.orderType === 'Delivery' ? '🛵 Delivery' : '📦 Counter / Pickup');

    const printCount = (kot.printCount || 0) + 1;
    const isReprint = (kot.printCount || 0) > 0;
    const restName = kot.restaurantName || restaurant?.name || 'FOODNEST RESTAURANT';
    const brName = kot.branchName || restaurant?.branchName || '';

    const calculatedTotal = itemsList.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || i.quantity || 1)), 0);
    const totalAmount = Number(kot.totalPrice || kot.totalAmount || kot.total || calculatedTotal);
    const totalItemsCount = itemsList.reduce((sum, i) => sum + (Number(i.qty || i.quantity || 1)), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            {/* Embedded Print Stylesheet for 80mm Thermal Printer */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #kot-thermal-slip, #kot-thermal-slip * {
                        visibility: visible;
                    }
                    #kot-thermal-slip {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm !important;
                        margin: 0 !important;
                        padding: 4mm !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        font-family: 'Courier New', Courier, monospace !important;
                        font-size: 13px !important;
                        line-height: 1.3 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                            <Printer size={16} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-slate-900">80mm Kitchen Order Ticket</h3>
                            <p className="text-[11px] text-slate-500 font-medium">{kot.kotNumber || 'New Ticket'} • Thermal Print Preview</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Thermal Slip Preview Box */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 flex justify-center">
                    <div 
                        id="kot-thermal-slip"
                        ref={printAreaRef}
                        className="w-[300px] bg-white p-5 rounded-xl border border-slate-300 shadow-sm font-mono text-xs text-slate-900 leading-tight select-all"
                    >
                        {/* Header */}
                        <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
                            <h2 className="text-base font-black uppercase tracking-wider">{kot.restaurantName || 'RESTAURANT'}</h2>
                            {kot.branchName && (
                                <p className="text-[11px] font-bold text-slate-600">{kot.branchName}</p>
                            )}
                            <div className="py-1">
                                <span className="inline-block px-2.5 py-0.5 font-black text-xs uppercase bg-black text-white rounded">
                                    *** K.O.T. ***
                                </span>
                            </div>
                            {isReprint && (
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                                    [ DUPLICATE RE-PRINT #{kot.printCount} ]
                                </p>
                            )}
                        </div>

                        {/* Station & Ticket Banner */}
                        <div className="py-2 border-b border-dashed border-slate-400 text-center bg-slate-50 my-1 rounded">
                            <div className="text-sm font-black uppercase tracking-wide">
                                {kot.kitchenStation || 'MAIN KITCHEN'}
                            </div>
                            {kot.isAddon && (
                                <div className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded mt-0.5 inline-block">
                                    ⚡ RUNNING / ADD-ON ORDER
                                </div>
                            )}
                        </div>

                        {/* Order Meta Details */}
                        <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                            <div className="flex justify-between font-bold">
                                <span>KOT NO:</span>
                                <span className="text-sm font-black">{kot.kotNumber || 'KOT-1001'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>ORDER #:</span>
                                <span className="font-bold">{kot.orderNumber || (kot.orderId ? `#${String(kot.orderId).slice(-5).toUpperCase()}` : '#ORD-1')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>TABLE:</span>
                                <span className="text-sm font-black">{tableDisplay}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>SERVICE:</span>
                                <span>{kot.serviceType || kot.orderType || 'Dine In'}</span>
                            </div>
                            {kot.customerName && (
                                <div className="flex justify-between">
                                    <span>GUEST:</span>
                                    <span className="font-bold">{kot.customerName}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>SERVER:</span>
                                <span>{kot.serverName || 'Staff'}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>DATE/TIME:</span>
                                <span>{formattedDate} {formattedTime}</span>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="py-2">
                            <div className="flex justify-between font-bold border-b border-slate-900 pb-1 mb-1 text-[11px]">
                                <span className="w-10">QTY</span>
                                <span className="flex-1">ITEM DESCRIPTION</span>
                                <span className="text-right">PRICE</span>
                            </div>
                            <div className="space-y-1.5 py-1">
                                {itemsList.map((item, idx) => {
                                    const qty = Number(item.qty || item.quantity || 1);
                                    const unitPrice = Number(item.price || item.unitPrice || 0);
                                    const lineTotal = Number(item.total || (unitPrice * qty));
                                    return (
                                        <div key={idx} className="border-b border-dotted border-slate-200 pb-1">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start flex-1 min-w-0 pr-2">
                                                    <span className="w-10 font-black text-sm shrink-0">{qty}x</span>
                                                    <span className="font-bold text-xs uppercase leading-tight">
                                                        {item.name}
                                                        {qty > 1 && unitPrice > 0 && (
                                                            <span className="text-[10px] font-normal text-slate-500 block">(@ ₹{unitPrice.toFixed(2)})</span>
                                                        )}
                                                    </span>
                                                </div>
                                                {lineTotal > 0 && (
                                                    <span className="font-black text-xs font-mono shrink-0">₹{lineTotal.toFixed(2)}</span>
                                                )}
                                            </div>
                                            {item.notes && (
                                                <div className="pl-10 text-[10px] text-slate-600 italic font-medium">
                                                    * {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cooking Instructions / Special Notes */}
                        {kot.notes && (
                            <div className="py-2 border-t border-dashed border-slate-400 mt-1 bg-yellow-50/70 p-2 rounded">
                                <span className="font-black text-[10px] uppercase block text-amber-900">SPECIAL INSTRUCTIONS:</span>
                                <p className="font-bold text-xs text-amber-950 mt-0.5 whitespace-pre-wrap">{kot.notes}</p>
                            </div>
                        )}

                        {/* Total Items & Total Amount */}
                        <div className="py-2 border-t border-dashed border-slate-400 text-[11px] space-y-1">
                            <div className="flex justify-between font-bold">
                                <span>TOTAL ITEMS:</span>
                                <span>{totalItemsCount} Items</span>
                            </div>
                            {totalAmount > 0 && (
                                <div className="flex justify-between font-black text-xs font-mono">
                                    <span>TOTAL AMOUNT:</span>
                                    <span>₹{totalAmount.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] text-slate-500 space-y-0.5 mt-1">
                            <p>Printed: {new Date().toLocaleTimeString()} • Slip #{printCount}</p>
                            <p className="font-mono text-[9px] text-slate-400">--- END OF KOT ---</p>
                        </div>
                    </div>
                </div>

                {/* Modal Action Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all cursor-pointer"
                    >
                        <Printer size={16} /> Print KOT (80mm Thermal)
                    </button>
                </div>

            </div>
        </div>
    );
};

export default KOTPrintModal;
