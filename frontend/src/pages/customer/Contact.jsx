import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getApiUrl } from '../../utils/axiosInstance';
import WebsiteNavbar from '../../components/WebsiteNavbar';
import WebsiteFooter from '../../components/WebsiteFooter';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        restaurantName: '',
        subject: 'Sales',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const API_URL = getApiUrl();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/inquiries`, formData);
            toast.success("Thank you! Your message has been sent successfully.");
            setFormData({ name: '', email: '', phone: '', restaurantName: '', subject: 'Sales', message: '' });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FFFDF9] font-sans text-slate-900 transition-colors relative overflow-x-hidden">
            {/* Unified FoodNest Navbar */}
            <WebsiteNavbar />

            {/* Ambient Warm Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-orange-100/40 via-amber-50/20 to-transparent blur-3xl pointer-events-none z-0" />

            {/* Main Section */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 relative z-10">
                
                {/* Back Link */}
                <div className="mb-8 flex items-center justify-between">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-orange-200 text-slate-600 hover:text-[#FF5A1F] font-bold text-xs shadow-xs transition-all group cursor-pointer"
                    >
                        <span className="text-[#FF5A1F] group-hover:-translate-x-0.5 transition-transform">←</span>
                        <span>Back to Home</span>
                    </Link>
                    <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                        FoodNest Support &amp; Sales Desk
                    </span>
                </div>

                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#FF5A1F] font-bold text-xs uppercase tracking-wider">
                        Get In Touch
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#142B45] tracking-tight leading-tight">
                        We'd Love to Hear From You
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                        Have questions about plans, custom integrations, or scheduling a live demo? Send us a message and our team will reach out.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#142B45] text-white p-8 rounded-3xl relative overflow-hidden border border-slate-800 shadow-xl">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF5A1F]/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                            
                            <h3 className="text-xl font-black mb-6 relative z-10 text-white">Contact Information</h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#FF5A1F] shrink-0">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sales &amp; Inquiries</p>
                                        <p className="text-base font-bold text-slate-100 mt-0.5">+1 (555) 234-5678</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Mon-Fri · 9:00 AM - 6:00 PM EST</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Support Desk</p>
                                        <p className="text-base font-bold text-slate-100 mt-0.5">support@foodnest.com</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Average response: &lt; 2 hours</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#FF5A1F] shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Corporate Headquarters</p>
                                        <p className="text-base font-bold text-slate-100 mt-0.5">123 Culinary Ave, Suite 400</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Food District, NY 10013</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm relative">
                            <h3 className="text-2xl font-black text-[#142B45] mb-6">Send Us a Message</h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-5 min-w-0 pr-1.5 flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 min-w-0 pr-1.5 flex-1">
                                        <label className="text-xs font-bold text-slate-700">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your Name"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white text-slate-900 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5 min-w-0 pr-1.5 flex-1">
                                        <label className="text-xs font-bold text-slate-700">Business Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="name@restaurant.com"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white text-slate-900 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 min-w-0 pr-1.5 flex-1">
                                        <label className="text-xs font-bold text-slate-700">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Your Phone Number"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white text-slate-900 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5 min-w-0 pr-1.5 flex-1">
                                        <label className="text-xs font-bold text-slate-700">Restaurant Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.restaurantName}
                                            onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                            placeholder="E.g. Bistro Central"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white text-slate-900 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 min-w-0 pr-1.5 flex-1">
                                    <label className="text-xs font-bold text-slate-700">Subject</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white text-slate-900 transition-all font-medium"
                                    >
                                        <option value="Sales">Sales &amp; Pricing</option>
                                        <option value="Support">Technical Support</option>
                                        <option value="Demo">Schedule a Live Demo</option>
                                        <option value="General">General Inquiry</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5 min-w-0 pr-1.5 flex-1">
                                    <label className="text-xs font-bold text-slate-700">How can we help?</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Tell us about your restaurant branches, seating capacity, or specific feature requests..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white text-slate-900 transition-all font-medium resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#FF5A1F] hover:bg-[#E04812] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {loading ? "Sending Message..." : (
                                        <>
                                            Send Inquiry <Send size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* Unified FoodNest Footer */}
            <WebsiteFooter />
        </div>
    );
};

export default Contact;
