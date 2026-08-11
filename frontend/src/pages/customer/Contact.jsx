import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2, Star, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

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

    const getApiUrl = () => {
        let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
        if (!baseURL.endsWith('/api')) baseURL += '/api';
        return baseURL;
    };
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
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100 transition-colors">
            {/* SaaS Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm py-3.5 px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <Link to="/" className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 text-white group-hover:scale-105 transition-transform shrink-0">
                            <Utensils size={18} className="sm:w-6 sm:h-6" />
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">RestaurantHub</h1>
                    </Link>
                    
                    <nav className="hidden md:flex gap-8 font-medium text-sm text-gray-600 dark:text-slate-300">
                        <a href="/#features" className="hover:text-red-500 transition-colors">Features</a>
                        <a href="/#workflow" className="hover:text-red-500 transition-colors">Workflow</a>
                        <a href="/#pricing" className="hover:text-red-500 transition-colors">Pricing</a>
                        <Link to="/contact" className="text-red-500 font-bold transition-colors">Contact</Link>
                    </nav>

                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold shrink-0">
                        <Link to="/staff/login" className="text-gray-600 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white transition-colors whitespace-nowrap px-1">Log in</Link>
                        <Link to="/staff/register" className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap">
                            <span className="md:hidden">Sign Up</span>
                            <span className="hidden md:inline">Get Started Free</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Section */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-block mb-4 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                        Get In Touch
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
                        We'd Love to Hear From You
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-slate-400 font-medium">
                        Have questions about plans, custom integrations, or scheduling a live demo? Send us a message and our team will reach out.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-slate-900 dark:bg-slate-900/90 text-white p-8 rounded-[2rem] relative overflow-hidden border border-slate-800 shadow-xl">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                            
                            <h3 className="text-xl font-bold mb-6 relative z-10 text-white">Contact Information</h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sales & Inquiries</p>
                                        <p className="text-base font-bold text-slate-100 mt-0.5">+1 (555) 234-5678</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Mon-Fri · 9:00 AM - 6:00 PM EST</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Support Desk</p>
                                        <p className="text-base font-bold text-slate-100 mt-0.5">support@restosys.com</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Average response: &lt; 2 hours</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Corporate Headquarters</p>
                                        <p className="text-base font-bold text-slate-100 mt-0.5">123 Culinary Ave, Suite 400</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Food District, NY 10013</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2rem] border border-gray-150 dark:border-slate-800 shadow-sm relative">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Us a Message</h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-slate-300">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your Name"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-slate-300">Business Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="name@restaurant.com"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-slate-300">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Your Phone Number"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-slate-300">Restaurant Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.restaurantName}
                                            onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                            placeholder="E.g. Bistro Central"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-slate-300">Subject</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all font-medium"
                                    >
                                        <option value="Sales">Sales & Pricing</option>
                                        <option value="Support">Technical Support</option>
                                        <option value="Demo">Schedule a Live Demo</option>
                                        <option value="General">General Inquiry</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-slate-300">How can we help?</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Tell us about your restaurant branches, seating capacity, or specific feature requests..."
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all font-medium resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-650 hover:to-red-750 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 active:scale-[0.98]"
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

            {/* SaaS Footer */}
            <footer className="bg-slate-900 dark:bg-slate-950 pt-16 pb-8 border-t border-slate-800">
                <div className="max-w-[1200px] mx-auto px-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 text-center md:text-left">
                        <div className="md:col-span-2 lg:col-span-2 flex flex-col items-center md:items-start">
                            <Link to="/" className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-85 transition-opacity">
                                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white"><Utensils size={18} /></div>
                                <h2 className="text-2xl font-black text-white tracking-tight">RestaurantHub</h2>
                            </Link>
                            <p className="text-slate-400 text-sm mb-6 max-w-sm leading-relaxed text-center md:text-left">
                                The all-in-one operating system for modern restaurants. POS, inventory, online ordering, and analytics all perfectly synced.
                            </p>
                        </div>
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="font-bold text-white mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-slate-400 text-center md:text-left">
                                <li><a href="/#features" className="hover:text-red-400 transition-colors">Features</a></li>
                                <li><a href="/#pricing" className="hover:text-red-400 transition-colors">Pricing</a></li>
                                <li><a href="/#why-choose-us" className="hover:text-red-400 transition-colors">Integrations</a></li>
                            </ul>
                        </div>
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="font-bold text-white mb-4">Company</h4>
                            <ul className="space-y-3 text-sm text-slate-400 text-center md:text-left">
                                <li><a href="/#about" className="hover:text-red-400 transition-colors">About Us</a></li>
                                <li><Link to="/contact" className="hover:text-red-400 transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 text-center flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 text-sm">© 2026 RestaurantHub Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Contact;
