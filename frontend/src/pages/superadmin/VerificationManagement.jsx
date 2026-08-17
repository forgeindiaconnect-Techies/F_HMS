import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Eye, Check, X, Clock, AlertTriangle, FileText, Download, CheckCircle, XCircle, ArrowUpRight, History, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VerificationManagement = () => {
    const { api } = useAuth();
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null); // Document preview modal

    // Form inputs for review
    const [overallStatus, setOverallStatus] = useState('Verified');
    const [overallReason, setOverallReason] = useState('');
    const [docReviews, setDocReviews] = useState({}); // { fssai: { status: 'Approved', reason: '' } }
    const [submittingReview, setSubmittingReview] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const loadVerifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/restaurants/verification/all');
            let data = Array.isArray(res.data) ? res.data : [];
            
            // Fallback: If verification endpoint returns no items, query all platform restaurants directly
            if (data.length === 0) {
                const restRes = await api.get('/super-admin/restaurants');
                const rests = Array.isArray(restRes.data) ? restRes.data : [];
                data = rests.map(r => ({
                    _id: r._id,
                    restaurantId: r,
                    status: r.approvalStatus === 'Approved' ? 'Verified' : 'Pending',
                    documents: {}
                }));
            }
            
            setVerifications(data);
        } catch (error) {
            console.error("Failed to fetch verifications", error);
            try {
                const restRes = await api.get('/super-admin/restaurants');
                const rests = Array.isArray(restRes.data) ? restRes.data : [];
                const fallbackData = rests.map(r => ({
                    _id: r._id,
                    restaurantId: r,
                    status: r.approvalStatus === 'Approved' ? 'Verified' : 'Pending',
                    documents: {}
                }));
                setVerifications(fallbackData);
            } catch (fErr) {
                toast.error("Failed to load verification list.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVerifications();
    }, [api]);

    const handleSelectReview = (verification) => {
        setSelectedReview(verification);
        setOverallStatus('Verified');
        setOverallReason('');
        
        // Populate current doc review states
        const initialDocReviews = {};
        const fields = ['fssai', 'businessRegistration', 'panCard', 'aadhaarCard', 'addressProof', 'bankProof'];
        fields.forEach(f => {
            const doc = verification.documents?.[f];
            initialDocReviews[f] = {
                status: doc?.status === 'Approved' ? 'Approved' : 'Rejected',
                reason: doc?.rejectReason || ''
            };
        });
        setDocReviews(initialDocReviews);
    };

    const handleDocStatusChange = (field, status) => {
        setDocReviews(prev => ({
            ...prev,
            [field]: { ...prev[field], status }
        }));
    };

    const handleDocReasonChange = (field, reason) => {
        setDocReviews(prev => ({
            ...prev,
            [field]: { ...prev[field], reason }
        }));
    };

    const submitReview = async (e) => {
        e.preventDefault();

        if (overallStatus === 'Rejected' && !overallReason.trim()) {
            toast.error("Please enter a rejection reason");
            return;
        }

        // If requesting re-upload, verify that at least one document is rejected
        if (overallStatus === 'Re-upload Required') {
            const rejectedDocs = Object.keys(docReviews).filter(k => docReviews[k].status === 'Rejected');
            if (rejectedDocs.length === 0) {
                toast.error("To request a re-upload, at least one document must be rejected");
                return;
            }
            // Check that rejected documents have reasons
            const missingReason = rejectedDocs.some(k => !docReviews[k].reason.trim());
            if (missingReason) {
                toast.error("Please provide a rejection reason for all rejected documents");
                return;
            }
        }

        setSubmittingReview(true);

        const payload = {
            status: overallStatus,
            rejectionReason: overallReason,
            documentStatus: overallStatus === 'Re-upload Required' ? docReviews : null
        };

        const targetRestaurantId = selectedReview.restaurantId?._id || selectedReview._id;

        try {
            // Try standard verification endpoint review
            try {
                await api.put(`/restaurants/verification/${selectedReview._id}/review`, payload);
            } catch (vErr) {
                console.warn("Verification endpoint review fallback trigger:", vErr.message);
            }

            // Sync direct restaurant approval status
            const approvalPayload = {
                approvalStatus: overallStatus === 'Verified' ? 'Approved' : overallStatus === 'Rejected' ? 'Rejected' : 'Pending',
                verificationStatus: overallStatus
            };
            await api.put(`/super-admin/restaurants/${targetRestaurantId}/approval`, approvalPayload);

            toast.success("Verification reviewed & restaurant status updated successfully!");
            setSelectedReview(null);
            loadVerifications();
        } catch (error) {
            console.error("Failed to submit review", error);
            toast.error(error.response?.data?.message || "Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteVerification = async (id, restaurantName) => {
        if (!window.confirm(`Are you sure you want to permanently delete the verification record for "${restaurantName}"? This action cannot be undone.`)) {
            return;
        }
        setDeletingId(id);
        try {
            await api.delete(`/restaurants/verification/${id}`);
            setVerifications(verifications.filter(v => v._id !== id));
            if (selectedReview?._id === id) setSelectedReview(null);
            toast.success('Verification record deleted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete verification record');
        } finally {
            setDeletingId(null);
        }
    };

    const getFullUrl = (filePath) => {
        if (!filePath) return '';
        const base = api.defaults.baseURL.replace('/api', '');
        return `${base}${filePath}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const docLabels = {
        fssai: 'FSSAI License',
        businessRegistration: 'Business Registration Certificate',
        panCard: 'PAN Card of the Business/Owner',
        aadhaarCard: 'Owner Aadhaar Card',
        addressProof: 'Business Address Proof',
        bankProof: 'Bank Account Proof'
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Restaurant Verifications</h2>
                    <p className="text-sm text-gray-500 font-semibold mt-0.5">Review legal documents and approve platform subscription access.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Verification list table */}
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="p-4 font-bold">Restaurant</th>
                                    <th className="p-4 font-bold">Owner</th>
                                    <th className="p-4 font-bold">Requested Plan</th>
                                    <th className="p-4 font-bold">Verification Status</th>
                                    <th className="p-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {verifications.map((v) => (
                                    <tr key={v._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                                                    {v.restaurantId?.logo ? (
                                                        <img src={getFullUrl(v.restaurantId.logo)} alt={v.restaurantId.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                                                            {v.restaurantId?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-gray-900">{v.restaurantId?.name || 'Deleted Restaurant'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-semibold text-gray-900">{v.restaurantId?.ownerId?.name || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{v.restaurantId?.ownerId?.email || 'N/A'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                                                {v.restaurantId?.subscription?.plan || 'Basic'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${
                                                v.status === 'Verified' ? 'bg-green-100 text-green-700 border-green-200' :
                                                v.status === 'Under Review' ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' :
                                                v.status === 'Re-upload Required' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                v.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                {v.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSelectReview(v)}
                                                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl border border-blue-100 hover:border-blue-200 transition-all flex items-center gap-1"
                                                >
                                                    <Eye size={12} />
                                                    Review Details
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVerification(v._id, v.restaurantId?.name || 'Unknown')}
                                                    disabled={deletingId === v._id}
                                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0"
                                                    title="Delete Verification Record"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {verifications.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500 font-semibold">
                                            No verification requests found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit details / review panel */}
                <div className="xl:col-span-1">
                    {selectedReview ? (
                        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-6 animate-in slide-in-from-right duration-200">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="font-black text-gray-900">Review Request</h3>
                                    <p className="text-xs text-gray-400 font-bold mt-0.5">{selectedReview.restaurantId?.name}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Inspection block */}
                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Submitted Documents</h4>
                                
                                {Object.keys(docLabels).map(key => {
                                    const doc = selectedReview.documents?.[key];
                                    if (!doc || !doc.filePath) {
                                        return (
                                            <div key={key} className="p-3 bg-red-50 text-red-700 font-bold text-xs rounded-xl border border-red-100">
                                                ❌ {docLabels[key]}: Document missing!
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={key} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <span className="text-xs font-black text-gray-800 block">{docLabels[key]}</span>
                                                    {key === 'fssai' && doc.expiryDate && (
                                                        <span className="text-[10px] text-gray-400 font-bold block">
                                                            📅 Expiry: {new Date(doc.expiryDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {key === 'addressProof' && doc.addressText && (
                                                        <p className="text-[11px] font-semibold text-gray-500 bg-white p-2 rounded-lg border border-gray-100 mt-1.5">
                                                            🏠 Address: {doc.addressText}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setPreviewDoc({ label: docLabels[key], path: doc.filePath })}
                                                    className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-gray-600 transition-all"
                                                    title="Preview document"
                                                >
                                                    <Eye size={12} />
                                                </button>
                                            </div>

                                            {/* Doc approval toggle inside Re-upload request */}
                                            {overallStatus === 'Re-upload Required' && (
                                                <div className="space-y-2 pt-2 border-t border-gray-100/50">
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDocStatusChange(key, 'Approved')}
                                                            className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1 ${
                                                                docReviews[key]?.status === 'Approved'
                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                    : 'bg-white text-gray-400 border-gray-200'
                                                            }`}
                                                        >
                                                            <CheckCircle size={10} /> Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDocStatusChange(key, 'Rejected')}
                                                            className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1 ${
                                                                docReviews[key]?.status === 'Rejected'
                                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                                    : 'bg-white text-gray-400 border-gray-200'
                                                            }`}
                                                        >
                                                            <XCircle size={10} /> Reject / Request Re-upload
                                                        </button>
                                                    </div>

                                                    {docReviews[key]?.status === 'Rejected' && (
                                                        <input
                                                            type="text"
                                                            value={docReviews[key]?.reason || ''}
                                                            onChange={(e) => handleDocReasonChange(key, e.target.value)}
                                                            placeholder="Why is this document rejected? (Required)"
                                                            required
                                                            className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:border-red-400 transition-colors"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Showcase assets info */}
                                {(selectedReview.documents?.logo?.filePath || selectedReview.documents?.menuPdf?.filePath || selectedReview.documents?.images?.length > 0) && (
                                    <div className="p-4 bg-gray-50 rounded-2xl space-y-2 mt-4 border border-gray-100">
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Brand Assets</h5>
                                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
                                            {selectedReview.documents.logo?.filePath && (
                                                <button onClick={() => setPreviewDoc({ label: 'Logo', path: selectedReview.documents.logo.filePath })} className="px-2 py-1 bg-white rounded border hover:bg-gray-100 flex items-center gap-1 transition-all">
                                                    🎨 Logo
                                                </button>
                                            )}
                                            {selectedReview.documents.menuPdf?.filePath && (
                                                <button onClick={() => setPreviewDoc({ label: 'Menu PDF', path: selectedReview.documents.menuPdf.filePath })} className="px-2 py-1 bg-white rounded border hover:bg-gray-100 flex items-center gap-1 transition-all">
                                                    📄 Menu PDF
                                                </button>
                                            )}
                                            {selectedReview.documents.images?.map((img, i) => (
                                                <button key={i} onClick={() => setPreviewDoc({ label: `Showcase ${i+1}`, path: img.filePath })} className="px-2 py-1 bg-white rounded border hover:bg-gray-100 flex items-center gap-1 transition-all">
                                                    🖼️ Image {i+1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Verification form submission */}
                            <form onSubmit={submitReview} className="space-y-4 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">Set Overall Status</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { val: 'Verified', label: 'Approve', color: 'border-green-200 hover:bg-green-50/20 text-green-700 bg-green-50/10' },
                                            { val: 'Re-upload Required', label: 'Re-upload', color: 'border-orange-200 hover:bg-orange-50/20 text-orange-700 bg-orange-50/10' },
                                            { val: 'Rejected', label: 'Reject', color: 'border-red-200 hover:bg-red-50/20 text-red-700 bg-red-50/10' }
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                type="button"
                                                onClick={() => setOverallStatus(opt.val)}
                                                className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                                                    overallStatus === opt.val
                                                        ? opt.color + ' ring-2 ring-offset-1 ring-blue-500'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {overallStatus !== 'Verified' && (
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">
                                            Rejection / Review Comments <span className="text-red-500 font-bold">*</span>
                                        </label>
                                        <textarea
                                            value={overallReason}
                                            onChange={(e) => setOverallReason(e.target.value)}
                                            required
                                            rows={3}
                                            placeholder="Details describing the review result or what needs to be changed..."
                                            className="w-full px-4 py-2.5 bg-white rounded-xl border-2 border-gray-100 focus:outline-none focus:border-blue-400 transition-colors font-semibold text-sm"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                                >
                                    {submittingReview ? 'Processing...' : 'Submit Audit Decision'}
                                </button>
                            </form>

                            {/* Audit History Log list */}
                            {selectedReview.history?.length > 0 && (
                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <History size={10} /> Review History Log ({selectedReview.history.length})
                                    </h5>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                        {selectedReview.history.map((hist, index) => (
                                            <div key={index} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] font-semibold text-gray-600 space-y-1">
                                                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                                                    <span>By: {hist.actionBy?.name || 'Admin'}</span>
                                                    <span>{new Date(hist.actionDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-black text-gray-800">Action:</span>
                                                    <span className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase ${
                                                        hist.status === 'Verified' ? 'bg-green-100 text-green-700' :
                                                        hist.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>{hist.status}</span>
                                                </div>
                                                {hist.reason && <p className="text-red-500 font-bold">Reason: {hist.reason}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center text-gray-400 font-semibold min-h-[300px] flex flex-col items-center justify-center gap-2">
                            <ShieldCheck size={36} className="opacity-60" />
                            Select a verification request from the table to begin inspection and audit.
                        </div>
                    )}
                </div>
            </div>

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={() => setPreviewDoc(null)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <span className="font-black text-gray-900 text-base">{previewDoc.label} Preview</span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={getFullUrl(previewDoc.path)}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl transition-all"
                                    title="Open / Download"
                                >
                                    <Download size={14} />
                                </a>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-gray-900 p-6 flex items-center justify-center">
                            {previewDoc.path.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={getFullUrl(previewDoc.path)}
                                    title="PDF Document"
                                    className="w-full h-[60vh] border-0 rounded-2xl bg-white"
                                />
                            ) : (
                                <img
                                    src={getFullUrl(previewDoc.path)}
                                    alt={previewDoc.label}
                                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-gray-800"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationManagement;
