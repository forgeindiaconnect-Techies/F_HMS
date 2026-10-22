import { Link } from 'react-router-dom';
import { Utensils } from 'lucide-react';

const WebsiteFooter = () => {
    return (
        <footer className="bg-slate-950 text-white border-t border-slate-800 py-16 px-6 sm:px-12 relative z-10 font-sans">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
                
                {/* Brand Column */}
                <div className="space-y-4 md:col-span-1">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 bg-gradient-to-tr from-[#FF2D55] to-[#FF6A00] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                            <Utensils size={18} />
                        </div>
                        <span className="text-xl font-black text-white">
                            Restaurant<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] to-[#FF6A00]">Hub</span>
                        </span>
                    </Link>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        The enterprise-grade cloud operating system for modern restaurants, cafes, food courts, and multi-branch chains.
                    </p>
                </div>

                {/* Navigation Columns */}
                <div>
                    <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">POS Modules</h4>
                    <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                        <li><Link to="/pos/billing" className="hover:text-white transition-colors">Billing &amp; Settlement</Link></li>
                        <li><Link to="/pos/inventory" className="hover:text-white transition-colors">Inventory Control</Link></li>
                        <li><Link to="/pos/online-ordering" className="hover:text-white transition-colors">Online Ordering</Link></li>
                        <li><Link to="/pos/reporting" className="hover:text-white transition-colors">Reporting &amp; P&amp;L</Link></li>
                        <li><Link to="/pos/menu" className="hover:text-white transition-colors">Menu Management</Link></li>
                        <li><Link to="/pos/crm" className="hover:text-white transition-colors">Customer CRM</Link></li>
                        <li><Link to="/pos/purchase-manager" className="hover:text-white transition-colors">Purchase Manager</Link></li>
                        <li><Link to="/pos/offline-pos" className="hover:text-white transition-colors">Offline POS Terminal</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Outlet Types</h4>
                    <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                        <li><Link to="/outlet-types/fine-dining" className="hover:text-white transition-colors">Fine Dining &amp; Bars</Link></li>
                        <li><Link to="/outlet-types/quick-service" className="hover:text-white transition-colors">Quick Service (QSR)</Link></li>
                        <li><Link to="/outlet-types/cafes-bakeries" className="hover:text-white transition-colors">Cafes &amp; Bakeries</Link></li>
                        <li><Link to="/outlet-types/cloud-kitchens" className="hover:text-white transition-colors">Cloud &amp; Dark Kitchens</Link></li>
                        <li><Link to="/outlet-types/multi-outlet-chains" className="hover:text-white transition-colors">Multi-Outlet Chains</Link></li>
                        <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Account &amp; Access</h4>
                    <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                        <li><Link to="/staff/register" className="hover:text-white transition-colors">Register Partner Account</Link></li>
                        <li><Link to="/customer/login" className="hover:text-white transition-colors">Customer Login</Link></li>
                        <li><Link to="/staff/login" className="hover:text-white transition-colors">Staff &amp; POS Portal</Link></li>
                        <li><Link to="/super-admin/login" className="hover:text-white transition-colors">Super Admin Portal</Link></li>
                    </ul>
                </div>

            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-xs font-bold text-slate-500 gap-4">
                <p>© 2026 RestaurantHub — Built By Ruturaj. All Rights Reserved.</p>
                <div className="flex items-center gap-6">
                    <span className="hover:text-[#FF2D55] cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
                    <span className="hover:text-slate-300 cursor-pointer">SLA Guarantee</span>
                </div>
            </div>
        </footer>
    );
};

export default WebsiteFooter;
