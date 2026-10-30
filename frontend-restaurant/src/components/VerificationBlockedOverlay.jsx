import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Lock, FileText, AlertTriangle, CheckCircle, RefreshCw, Clock } from 'lucide-react';

const VerificationBlockedOverlay = () => {
    const { user, restaurant } = useAuth();
    
    const status = restaurant?.verificationStatus || 'Pending';
    const isAdmin = user?.role === 'RestaurantAdmin';

    // Status styling maps
    const config = {
        Pending: {
            icon: FileText,
            color: 'text-amber-500 bg-amber-50',
            borderColor: 'border-amber-200',
            title: 'Verification Documents Required',
            description: 'Before you can access your dashboard and activate your subscription, please submit the mandatory business documents for review.',
            actionText: 'Submit Verification Documents',
            actionLink: '/admin/verification'
        },
        'Under Review': {
            icon: Clock,
            color: 'text-blue-500 bg-blue-50',
            borderColor: 'border-blue-200',
            title: 'Verification Under Review',
            description: 'Our administration team is currently reviewing your uploaded documents. This process typically takes 12-24 hours. You will receive a notification as soon as verification is complete.',
            actionText: 'Check Document Status',
            actionLink: '/admin/verification'
        },
        'Re-upload Required': {
            icon: RefreshCw,
            color: 'text-orange-500 bg-orange-50',
            borderColor: 'border-orange-200',
            title: 'Action Required: Re-upload Documents',
            description: 'Some of the documents you uploaded did not pass verification. Please check the rejection details and re-upload the corrected files to resume review.',
            actionText: 'Re-upload Documents',
            actionLink: '/admin/verification'
        },
        Rejected: {
            icon: AlertTriangle,
            color: 'text-red-500 bg-red-50',
            borderColor: 'border-red-200',
            title: 'Restaurant Verification Rejected',
            description: `Your verification request has been rejected. Please review the reasons provided by the administrator or contact support.`,
            actionText: 'Update and Re-submit Documents',
            actionLink: '/admin/verification'
        },
        Expired: {
            icon: AlertTriangle,
            color: 'text-rose-500 bg-rose-50',
            borderColor: 'border-rose-200',
            title: 'License or Verification Expired',
            description: 'Your uploaded license (e.g., FSSAI) has expired. Please upload a valid, updated document to reactivate dashboard access.',
            actionText: 'Update Verification Documents',
            actionLink: '/admin/verification'
        }
    };

    const current = config[status] || config.Pending;
    const IconComponent = current.icon;

    return (
        <div className="min-h-[75vh] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 text-center flex flex-col items-center gap-6 relative overflow-hidden">
                {/* Decorative gradients */}
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-2xl pointer-events-none" />

                {/* Locked Icon Header */}
                <div className="relative">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${current.color} border-2 ${current.borderColor} shadow-sm`}>
                        <IconComponent size={36} />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-gray-900 rounded-full border-2 border-white flex items-center justify-center text-white">
                        <Lock size={12} />
                    </div>
                </div>

                <div className="space-y-3 max-w-lg">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 font-sans tracking-tight">
                        {current.title}
                    </h2>
                    
                    {/* Status Badge */}
                    <div className="flex justify-center">
                        <span className={`px-3.5 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                            status === 'Under Review' ? 'bg-blue-100 text-blue-700' :
                            status === 'Re-upload Required' ? 'bg-orange-100 text-orange-700' :
                            status === 'Rejected' || status === 'Expired' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                            Status: {status}
                        </span>
                    </div>

                    <p className="text-gray-500 text-sm md:text-base font-medium leading-relaxed pt-2">
                        {current.description}
                    </p>

                    {status === 'Rejected' && restaurant?.rejectionReason && (
                        <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 text-left">
                            <span className="text-xs font-black text-red-700 uppercase tracking-wider block mb-1">Rejection Reason:</span>
                            <p className="text-sm font-semibold text-red-600 leading-relaxed">{restaurant.rejectionReason}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="w-full max-w-md border-t border-gray-100 pt-6 mt-2 flex flex-col gap-3">
                    {isAdmin ? (
                        <Link 
                            to={current.actionLink} 
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl shadow-md hover:shadow-lg transition-all hover:opacity-95 text-sm md:text-base flex items-center justify-center gap-2 group"
                        >
                            {current.actionText}
                        </Link>
                    ) : (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-semibold text-gray-500">
                            🔒 Access restricted. Please ask the main restaurant administrator to log in and upload the required documents.
                        </div>
                    )}
                    
                    <button 
                        onClick={() => window.location.reload()} 
                        className="text-xs text-gray-400 hover:text-gray-600 font-bold self-center transition-colors py-2"
                    >
                        🔄 Refresh Status
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationBlockedOverlay;
