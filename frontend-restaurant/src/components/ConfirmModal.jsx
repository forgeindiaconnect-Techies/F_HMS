import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = true }) => {
    useEffect(() => {
        if (isOpen) {
            toast.custom((t) => (
                <div className={`bg-white shadow-2xl rounded-2xl p-5 w-80 md:w-96 border border-gray-100 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
                    <div className="flex gap-4 items-start">
                        <div className={`p-2.5 rounded-full shrink-0 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{message}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={() => {
                                toast.dismiss(t.id);
                                onClose();
                            }}
                            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={() => {
                                toast.dismiss(t.id);
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-2.5 text-white text-sm font-bold rounded-xl shadow-sm transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            ), { 
                duration: Infinity, 
                id: 'confirm-toast',
                position: 'top-center'
            });
        } else {
            toast.dismiss('confirm-toast');
        }
    }, [isOpen, onClose, onConfirm, title, message, confirmText, cancelText, isDestructive]);

    return null; // Render nothing in the normal DOM flow
};

export default ConfirmModal;
