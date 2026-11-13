import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Confirm Action', 
    message = 'Are you sure you want to proceed?', 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    isDestructive = true 
}) => {
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        try {
            setSubmitting(true);
            if (onConfirm) {
                await onConfirm();
            }
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Confirm action error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
                className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-150 relative text-left"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    disabled={submitting}
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
                >
                    <X size={18} />
                </button>

                <div className="flex gap-4 items-start">
                    <div className={`p-3 rounded-2xl shrink-0 ${isDestructive ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-1.5 pr-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button 
                        type="button"
                        disabled={submitting}
                        onClick={handleConfirm}
                        className={`flex-1 py-2.5 px-4 text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            isDestructive 
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20 active:scale-98 disabled:opacity-60' 
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-98 disabled:opacity-60'
                        }`}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
