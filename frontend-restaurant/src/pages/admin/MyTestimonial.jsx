import { useState, useEffect, useRef } from 'react';
import { 
    Star, MessageSquareQuote, CheckCircle2, AlertCircle, Clock, 
    Upload, Eye, Send, Sparkles, Building2, MapPin, User, ShieldCheck, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const MyTestimonial = () => {
    const { api, user, restaurant } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [testimonial, setTestimonial] = useState(null);

    // Form state
    const [ownerName, setOwnerName] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [location, setLocation] = useState('');
    const [quote, setQuote] = useState('');
    const [rating, setRating] = useState(5);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [removedAvatar, setRemovedAvatar] = useState(false);

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const fileInputRef = useRef(null);

    const fetchMyTestimonial = async () => {
        try {
            setLoading(true);
            const res = await api.get('/testimonials/mine');
            if (res.data?.success) {
                const data = res.data.data;
                const defaults = res.data.defaults || {};

                if (data) {
                    setTestimonial(data);
                    setOwnerName(data.ownerName || '');
                    setRestaurantName(data.restaurantName || '');
                    setLocation(data.location || '');
                    setQuote(data.quote || '');
                    setRating(data.rating || 5);
                    if (data.avatar && !data.avatar.includes('unsplash') && !data.avatar.includes('photo-1507003211169')) {
                        const apiBase = import.meta.env.VITE_API_URL || 'https://f-hms-1.onrender.com/api';
                        let origin = '';
                        try {
                            origin = new URL(apiBase).origin;
                        } catch (_) {}
                        const fullAvatar = data.avatar.startsWith('http') || data.avatar.startsWith('data:') 
                            ? data.avatar 
                            : `${origin}${data.avatar.startsWith('/') ? '' : '/'}${data.avatar}`;
                        setAvatarPreview(fullAvatar);
                    } else {
                        setAvatarPreview('');
                    }
                } else {
                    // Set sensible auto-populated defaults
                    setOwnerName(user?.name || defaults.ownerName || '');
                    setRestaurantName(restaurant?.name || defaults.restaurantName || '');
                    setLocation(
                        restaurant?.address || 
                        (restaurant?.city && restaurant?.state ? `${restaurant.city}, ${restaurant.state}` : defaults.location || '')
                    );
                    setRating(5);
                    setAvatarPreview('');
                }
            }
        } catch (error) {
            console.error('Failed to fetch testimonial:', error);
            toast.error('Could not load testimonial status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTestimonial();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setAvatarFile(file);
        setRemovedAvatar(false);
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview('');
        setRemovedAvatar(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!ownerName.trim()) {
            toast.error('Please enter the owner name.');
            return;
        }
        if (!restaurantName.trim()) {
            toast.error('Please enter the restaurant name.');
            return;
        }
        if (!location.trim()) {
            toast.error('Please enter city and state location.');
            return;
        }
        if (!quote.trim()) {
            toast.error('Please enter your testimonial experience.');
            return;
        }
        if (quote.trim().length < 20) {
            toast.error('Testimonial should be at least 20 characters long.');
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('ownerName', ownerName.trim());
            formData.append('restaurantName', restaurantName.trim());
            formData.append('location', location.trim());
            formData.append('quote', quote.trim());
            formData.append('rating', rating);

            if (removedAvatar) {
                formData.append('removeAvatar', 'true');
            } else if (avatarFile) {
                formData.append('avatar', avatarFile);
            } else if (avatarPreview && !avatarPreview.startsWith('data:')) {
                formData.append('avatarUrl', avatarPreview);
            }

            const res = await api.post('/testimonials/mine', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Testimonial submitted successfully!');
                setTestimonial(res.data.data);
                setShowPreviewModal(false);
                setRemovedAvatar(false);
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit testimonial.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Live on Landing Page (Approved)</span>
                    </div>
                );
            case 'Pending':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                        <Clock size={14} className="text-amber-600" />
                        <span>Under Review by Admin (Pending)</span>
                    </div>
                );
            case 'Rejected':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                        <AlertCircle size={14} className="text-rose-600" />
                        <span>Needs Revision (Rejected)</span>
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                        <span>Not Submitted Yet</span>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-500">Loading your testimonial data...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5A1F] flex items-center justify-center border border-orange-100 dark:border-orange-900/40">
                            <MessageSquareQuote size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                My Testimonial
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Share your restaurant's story and get featured on the FoodNest public landing page.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    {getStatusBadge(testimonial?.status)}
                </div>
            </div>

            {/* Status Feedback Banners */}
            {testimonial?.status === 'Approved' && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                            Your testimonial is live on the public landing page!
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                            Any edits you make below will be submitted to the Admin team for review before updating publicly.
                        </p>
                    </div>
                </div>
            )}

            {testimonial?.status === 'Pending' && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                    <Clock size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                            Submitted and awaiting administrator moderation.
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                            Our team verifies all partner testimonials before publication. You can still modify your details below.
                        </p>
                    </div>
                </div>
            )}

            {testimonial?.status === 'Rejected' && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                    <AlertCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                            Feedback from Admin: {testimonial?.rejectionReason || 'Please update your testimonial and resubmit.'}
                        </p>
                        <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                            Revise your testimonial text or details below and click "Submit for Approval".
                        </p>
                    </div>
                </div>
            )}

            {/* Main Form & Live Card Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Form Inputs (7 cols) */}
                <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles size={16} className="text-[#FF5A1F]" />
                            {testimonial ? 'Edit Testimonial' : 'Write Your Testimonial'}
                        </h2>
                        <span className="text-[11px] text-slate-400 font-medium">
                            1 testimonial per partner
                        </span>
                    </div>

                    {/* Owner Name & Restaurant Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <User size={13} className="text-slate-400" /> Owner Name *
                            </label>
                            <input
                                type="text"
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                placeholder="e.g. Arun Kumar"
                                required
                                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FF5A1F]/30 focus:border-[#FF5A1F] transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Building2 size={13} className="text-slate-400" /> Restaurant Name *
                            </label>
                            <input
                                type="text"
                                value={restaurantName}
                                onChange={(e) => setRestaurantName(e.target.value)}
                                placeholder="e.g. The Food Hub"
                                required
                                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FF5A1F]/30 focus:border-[#FF5A1F] transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Location & Star Rating */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <MapPin size={13} className="text-slate-400" /> Location (City, State) *
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Chennai, Tamil Nadu"
                                required
                                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FF5A1F]/30 focus:border-[#FF5A1F] transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Rating *
                            </label>
                            <div className="flex items-center gap-1.5 py-2">
                                {[1, 2, 3, 4, 5].map((starVal) => (
                                    <button
                                        type="button"
                                        key={starVal}
                                        onClick={() => setRating(starVal)}
                                        className="p-1 text-[#FF5A0A] hover:scale-110 transition-transform cursor-pointer"
                                    >
                                        <Star
                                            size={22}
                                            fill={starVal <= rating ? '#FF5A0A' : 'none'}
                                            stroke={starVal <= rating ? '#FF5A0A' : '#CBD5E1'}
                                            strokeWidth={starVal <= rating ? 0 : 2}
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {rating} of 5 Stars
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Profile Photo */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Profile Photo (Optional)
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-orange-50 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-500">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-orange-100 text-[#FF5A1F] font-black text-lg">
                                        {ownerName ? ownerName.trim().charAt(0).toUpperCase() : <User size={24} className="text-slate-400" />}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Upload size={14} /> {avatarPreview ? 'Change Photo' : 'Upload Image'}
                                    </button>
                                    {avatarPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="px-3.5 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                                        >
                                            Remove Photo
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Square portrait recommended. JPG, PNG or WEBP up to 5MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial / Experience Textarea */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Testimonial / Experience Review *
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">
                                {quote.length} chars
                            </span>
                        </div>
                        <textarea
                            value={quote}
                            onChange={(e) => setQuote(e.target.value)}
                            placeholder="Share how FoodNest helped your restaurant operations, billing speed, customer satisfaction, or revenue growth..."
                            rows={4}
                            required
                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FF5A1F]/30 focus:border-[#FF5A1F] transition-all outline-none resize-none leading-relaxed"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowPreviewModal(true)}
                            className="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            <Eye size={15} /> Preview Landing Card
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 text-xs font-bold bg-[#FF5A1F] hover:bg-[#E04812] text-white rounded-xl shadow-md shadow-orange-500/25 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={15} />
                                    <span>{testimonial ? 'Update & Submit for Approval' : 'Submit for Approval'}</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>

                {/* Right: Live Preview of Card (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                            <Eye size={14} className="text-[#FF5A1F]" />
                            Live Landing Page Card Preview
                        </h3>

                        {/* Exact Landing Page Card Representation */}
                        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm text-left flex flex-col justify-between space-y-4">
                            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                                "{quote.trim() || 'Your testimonial experience will appear here. FoodNest has helped thousands of restaurants scale seamlessly.'}"
                            </p>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {avatarPreview ? (
                                        <img 
                                            src={avatarPreview} 
                                            alt={ownerName || "Owner"}
                                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center font-bold text-sm border border-orange-200">
                                            {ownerName ? ownerName.trim().charAt(0).toUpperCase() : <User size={18} />}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                                            {ownerName.trim() || 'Owner Name'}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {restaurantName.trim() || 'Restaurant Name'}{location.trim() ? `, ${location.trim()}` : ', City'}
                                        </p>
                                    </div>
                                </div>

                                {/* Star Rating (#FF5A0A / #FF5A1F) */}
                                <div className="flex text-[#FF5A0A]">
                                    {[...Array(rating)].map((_, i) => (
                                        <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <ShieldCheck size={13} className="text-[#FF5A1F]" /> Publication Criteria:
                            </div>
                            <p>• Only approved testimonials are displayed publicly to visitors.</p>
                            <p>• Edits to an existing testimonial are held in Pending state until approved.</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Full Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                Card Preview on Landing Page
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Testimonial Card */}
                        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm text-left flex flex-col justify-between space-y-4">
                            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                                "{quote.trim() || 'No quote written yet.'}"
                            </p>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {avatarPreview ? (
                                        <img 
                                            src={avatarPreview} 
                                            alt={ownerName}
                                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center font-bold text-sm border border-orange-200">
                                            {ownerName ? ownerName.trim().charAt(0).toUpperCase() : <User size={18} />}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                                            {ownerName || 'Owner Name'}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {restaurantName || 'Restaurant Name'}{location ? `, ${location}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex text-[#FF5A0A]">
                                    {[...Array(rating)].map((_, i) => (
                                        <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Close Preview
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-5 py-2 text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#E04812] rounded-xl shadow-md transition-all cursor-pointer"
                            >
                                {submitting ? 'Submitting...' : 'Submit from Preview'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MyTestimonial;
