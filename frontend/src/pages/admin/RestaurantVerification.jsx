import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle, XCircle, AlertCircle, Clock, FileText, ArrowLeft, RefreshCw, Check, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const RestaurantVerification = () => {
    const { api, restaurant, fetchRestaurant } = useAuth();
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [addressText, setAddressText] = useState('');
    const [fssaiExpiryDate, setFssaiExpiryDate] = useState('');
    
    // File upload references
    const [files, setFiles] = useState({
        fssai: null,
        businessRegistration: null,
        panCard: null,
        aadhaarCard: null,
        addressProof: null,
        bankProof: null,
        logo: null,
        menuPdf: null
    });
    
    const [optionalImages, setOptionalImages] = useState([]);

    const fileInputRefs = {
        fssai: useRef(),
        businessRegistration: useRef(),
        panCard: useRef(),
        aadhaarCard: useRef(),
        addressProof: useRef(),
        bankProof: useRef(),
        logo: useRef(),
        menuPdf: useRef()
    };

    const loadVerification = async () => {
        try {
            const res = await api.get('/restaurants/verification/mine');
            setVerification(res.data);
            if (res.data?.documents?.addressProof?.addressText) {
                setAddressText(res.data.documents.addressProof.addressText);
            }
            if (res.data?.documents?.fssai?.expiryDate) {
                setFssaiExpiryDate(new Date(res.data.documents.fssai.expiryDate).toISOString().split('T')[0]);
            }
        } catch (error) {
            console.error("Failed to load verification detail", error);
            toast.error("Failed to load verification status.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVerification();
    }, [api]);

    const [logoBase64, setLogoBase64] = useState(null);

    const handleFileChange = (field, e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size cannot exceed 5 MB");
            return;
        }

        // Extension check
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            toast.error("Only PDF, JPG, JPEG, PNG, and WEBP files are allowed");
            return;
        }

        if (field === 'logo') {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoBase64(reader.result);
            };
            reader.readAsDataURL(file);
        }

        setFiles(prev => ({ ...prev, [field]: file }));
        toast.success(`${file.name} selected!`);
    };

    const handleImagesChange = (e) => {
        const selected = Array.from(e.target.files);
        let valid = [];
        
        selected.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} exceeds 5 MB limit`);
                return;
            }
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
                toast.error(`File ${file.name} has unsupported file type`);
                return;
            }
            valid.push(file);
        });

        if (valid.length > 0) {
            setOptionalImages(prev => [...prev, ...valid]);
            toast.success(`${valid.length} image(s) added!`);
        }
    };

    const removeOptionalImage = (index) => {
        setOptionalImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const isNew = !verification || !verification._id;
        const status = verification?.status || 'Pending';

        // Validations
        if (isNew) {
            // Mandatory check
            const mandatory = ['fssai', 'businessRegistration', 'panCard', 'aadhaarCard', 'addressProof', 'bankProof'];
            const missing = mandatory.filter(f => !files[f]);
            if (missing.length > 0) {
                toast.error(`Please select files for all mandatory documents.`);
                return;
            }
            if (!addressText.trim()) {
                toast.error("Please enter your business address.");
                return;
            }
            if (!fssaiExpiryDate) {
                toast.error("Please enter your FSSAI License expiry date.");
                return;
            }
        }

        if (fssaiExpiryDate) {
            const expiry = new Date(fssaiExpiryDate);
            if (expiry < new Date()) {
                toast.error("FSSAI License expiry date must be in the future.");
                return;
            }
        }

        setSubmitting(true);
        const formData = new FormData();
        
        // Add files
        Object.keys(files).forEach(key => {
            if (files[key]) {
                formData.append(key, files[key]);
            }
        });

        // Add optional multi-images
        optionalImages.forEach(img => {
            formData.append('images', img);
        });

        // Add text metadata
        formData.append('addressText', addressText);
        if (fssaiExpiryDate) {
            formData.append('fssaiExpiryDate', fssaiExpiryDate);
        }
        if (logoBase64) {
            formData.append('logoBase64', logoBase64);
        }

        try {
            await api.post('/restaurants/verification/submit', formData);
            
            toast.success("Verification documents submitted successfully!");
            // Refresh context and local details
            await fetchRestaurant();
            await loadVerification();
            
            // Clear temporary local file selections
            setFiles({
                fssai: null,
                businessRegistration: null,
                panCard: null,
                aadhaarCard: null,
                addressProof: null,
                bankProof: null,
                logo: null,
                menuPdf: null
            });
            setOptionalImages([]);
        } catch (error) {
            console.error("Submission failed", error);
            toast.error(error.response?.data?.message || "Failed to submit verification.");
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to render doc state badge/details
    const renderDocState = (fieldName, label) => {
        const doc = verification?.documents?.[fieldName];
        const localFile = files[fieldName];
        const globalStatus = verification?.status || 'Pending';
        const isUnderReview = globalStatus === 'Under Review';

        // Check if document needs upload or if it is approved/rejected
        let statusText = 'Pending Upload';
        let badgeColor = 'bg-gray-100 text-gray-500 border-gray-200';
        let BadgeIcon = Info;
        let isEditable = !isUnderReview;

        if (doc) {
            if (doc.status === 'Approved') {
                statusText = 'Approved';
                badgeColor = 'bg-green-100 text-green-700 border-green-200';
                BadgeIcon = CheckCircle;
                isEditable = false; // Cannot modify approved files
            } else if (doc.status === 'Rejected') {
                statusText = 'Rejected (Re-upload Required)';
                badgeColor = 'bg-red-100 text-red-700 border-red-200 animate-pulse';
                BadgeIcon = XCircle;
            } else if (isUnderReview || doc.status === 'Pending') {
                statusText = 'Under Review';
                badgeColor = 'bg-blue-100 text-blue-700 border-blue-200';
                BadgeIcon = Clock;
            }
        }

        return (
            <div className={`p-5 rounded-2xl border-2 bg-white transition-all duration-200 ${
                doc?.status === 'Rejected' ? 'border-red-200 shadow-sm shadow-red-50' : 
                doc?.status === 'Approved' ? 'border-green-100 bg-green-50/10' : 'border-gray-100 hover:border-gray-200'
            }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 text-sm md:text-base">{label}</span>
                            <span className="text-red-500 font-bold">*</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${badgeColor}`}>
                                <BadgeIcon size={10} />
                                {statusText}
                            </span>
                        </div>

                        {doc?.rejectReason && (
                            <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 mt-1 max-w-xl">
                                ⚠️ Reason: {doc.rejectReason}
                            </div>
                        )}

                        {/* Existing file link */}
                        {doc?.filePath && (
                            <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5 pt-1.5">
                                <FileText size={12} className="text-blue-500" />
                                <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.filePath}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    View Submitted Document
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                        {isEditable ? (
                            <div className="w-full md:w-auto">
                                <input
                                    type="file"
                                    ref={fileInputRefs[fieldName]}
                                    onChange={(e) => handleFileChange(fieldName, e)}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRefs[fieldName].current.click()}
                                    className="w-full md:w-auto px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 hover:border-gray-300 transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Upload size={14} className="text-gray-500" />
                                    {doc ? 'Replace Document' : 'Choose File'}
                                </button>
                            </div>
                        ) : (
                            doc?.status === 'Approved' && (
                                <div className="text-green-600 font-black text-xs flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                                    <Check size={12} /> Complete
                                </div>
                            )
                        )}

                        {localFile && (
                            <span className="text-[11px] font-bold text-green-600 max-w-[200px] truncate block text-right mt-1">
                                📎 Selected: {localFile.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expiry date specific for FSSAI */}
                {fieldName === 'fssai' && (
                    <div className="mt-4 pt-4 border-t border-gray-50 max-w-sm">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">
                            FSSAI License Expiry Date <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                            type="date"
                            value={fssaiExpiryDate}
                            onChange={(e) => setFssaiExpiryDate(e.target.value)}
                            disabled={!isEditable}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-green-400 focus:outline-none transition-all font-semibold text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        />
                    </div>
                )}

                {/* Address Proof Details */}
                {fieldName === 'addressProof' && (
                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">
                                Full Business Address <span className="text-red-500 font-bold">*</span>
                            </label>
                            <textarea
                                value={addressText}
                                onChange={(e) => setAddressText(e.target.value)}
                                disabled={!isEditable}
                                required
                                rows={3}
                                placeholder="Enter complete billing/operational address"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-green-400 focus:outline-none transition-all font-semibold text-sm disabled:bg-gray-50 disabled:text-gray-400"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const verificationStatus = verification?.status || 'Pending';
    const isUnderReview = verificationStatus === 'Under Review';

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-1 z-10">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Restaurant Verification</h2>
                    <p className="text-sm text-gray-500 font-semibold">
                        SaaS compliance panel for restaurant identity and registration auditing.
                    </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">Current Status:</span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                        verificationStatus === 'Verified' ? 'bg-green-100 text-green-700 border-green-200' :
                        verificationStatus === 'Under Review' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        verificationStatus === 'Re-upload Required' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        verificationStatus === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                        {verificationStatus}
                    </span>
                </div>
            </div>

            {/* General Overall Rejection Box */}
            {verificationStatus === 'Rejected' && verification?.rejectionReason && (
                <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl flex items-start gap-4">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5 animate-bounce" size={24} />
                    <div className="space-y-1">
                        <h4 className="font-black text-red-700">Verification Rejected</h4>
                        <p className="text-sm font-semibold text-red-600 leading-relaxed">{verification.rejectionReason}</p>
                        <p className="text-xs text-red-500 pt-2 font-bold">Please update and submit correct files for review.</p>
                    </div>
                </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Mandatory section */}
                <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-2">
                        <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">1. Mandatory Legal Documents</h3>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5">All documents are required by regulation and cannot be skipped.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {renderDocState('fssai', 'FSSAI License')}
                        {renderDocState('businessRegistration', 'Business Registration Certificate')}
                        {renderDocState('panCard', 'PAN Card of the Business/Owner')}
                        {renderDocState('aadhaarCard', 'Owner Aadhaar Card')}
                        {renderDocState('addressProof', 'Business Address Proof')}
                        {renderDocState('bankProof', 'Bank Account Proof (Cancelled Cheque/Passbook)')}
                    </div>
                </div>

                {/* Optional uploads */}
                <div className="space-y-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    <div className="border-b border-gray-100 pb-2">
                        <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">2. Optional Brand Assets</h3>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5">Upload brand assets to customize your customers experience.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Logo upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">Restaurant Logo (Image / PDF)</label>
                            {verification?.documents?.logo?.filePath && (() => {
                                const rawPath = verification.documents.logo.filePath;
                                const docUrl = (rawPath.startsWith('http') || rawPath.startsWith('data:'))
                                    ? rawPath
                                    : `${api.defaults.baseURL.replace('/api', '')}${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;
                                const isPdf = docUrl.includes('application/pdf') || docUrl.toLowerCase().endsWith('.pdf');
                                return isPdf ? (
                                    <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs flex items-center gap-2 border border-red-100 max-w-xs shadow-sm">
                                        <FileText size={16} /> PDF Logo Document Uploaded
                                    </div>
                                ) : (
                                    <div className="mb-3 w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                        <img src={docUrl} alt="Logo" className="w-full h-full object-cover" />
                                    </div>
                                );
                            })()}
                            <input
                                type="file"
                                ref={fileInputRefs.logo}
                                onChange={(e) => handleFileChange('logo', e)}
                                disabled={isUnderReview}
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRefs.logo.current.click()}
                                disabled={isUnderReview}
                                className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:bg-gray-100"
                            >
                                <Upload size={14} className="text-gray-500" />
                                {files.logo ? `Change Logo (${files.logo.name})` : 'Upload Logo'}
                            </button>
                        </div>

                        {/* Menu PDF upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">Menu PDF</label>
                            {verification?.documents?.menuPdf?.filePath && (
                                <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-blue-600">
                                    <FileText size={12} />
                                    <a href={`${api.defaults.baseURL.replace('/api', '')}${verification.documents.menuPdf.filePath}`} target="_blank" rel="noreferrer" className="hover:underline">
                                        View Menu PDF
                                    </a>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRefs.menuPdf}
                                onChange={(e) => handleFileChange('menuPdf', e)}
                                disabled={isUnderReview}
                                className="hidden"
                                accept=".pdf"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRefs.menuPdf.current.click()}
                                disabled={isUnderReview}
                                className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:bg-gray-100"
                            >
                                <Upload size={14} className="text-gray-500" />
                                {files.menuPdf ? `Change Menu PDF (${files.menuPdf.name})` : 'Upload Menu PDF'}
                            </button>
                        </div>
                    </div>

                    {/* Multi images section */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">Restaurant Showcase Images (Max 5)</label>
                        
                        {/* Display existing images */}
                        {verification?.documents?.images?.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-3">
                                {verification.documents.images.map((img, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                                        <img src={`${api.defaults.baseURL.replace('/api', '')}${img.filePath}`} alt="Showcase" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            type="file"
                            multiple
                            onChange={handleImagesChange}
                            disabled={isUnderReview || (verification?.documents?.images?.length || 0) + optionalImages.length >= 5}
                            className="hidden"
                            id="showcase-images"
                            accept=".jpg,.jpeg,.png"
                        />
                        
                        <div className="flex items-center gap-4">
                            <label
                                htmlFor="showcase-images"
                                className={`px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 text-xs flex items-center gap-2 shadow-sm cursor-pointer ${
                                    isUnderReview || (verification?.documents?.images?.length || 0) + optionalImages.length >= 5 ? 'opacity-50 pointer-events-none bg-gray-100' : ''
                                }`}
                            >
                                <Upload size={14} className="text-gray-500" />
                                Add Showcase Images
                            </label>
                            <span className="text-xs text-gray-400 font-bold">
                                {optionalImages.length} images selected to upload
                            </span>
                        </div>

                        {/* Local selected images queue */}
                        {optionalImages.length > 0 && (
                            <div className="flex flex-wrap gap-3 p-3 bg-white rounded-2xl border border-gray-100 mt-2">
                                {optionalImages.map((file, i) => (
                                    <div key={i} className="relative w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 p-1">
                                        <span className="text-[10px] text-gray-400 font-bold truncate max-w-full">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeOptionalImage(i)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                                        >
                                            <XCircle size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Footer Submit Action */}
                <div className="bg-white border border-gray-100 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3 max-w-xl">
                        <Info className="text-gray-400 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                            By submitting these files, you verify that all documents are legal, valid, and match your registered restaurant identity. Falsification of documents will lead to permanent platform ban.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isUnderReview || submitting}
                        className={`px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl shadow-md hover:shadow-lg transition-all hover:opacity-95 text-sm md:text-base flex items-center justify-center gap-2 shrink-0 ${
                            isUnderReview ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {submitting ? (
                            <><RefreshCw size={16} className="animate-spin" /> Submitting…</>
                        ) : isUnderReview ? (
                            'Locked Under Review'
                        ) : (
                            'Submit for Verification'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RestaurantVerification;
