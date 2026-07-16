import { useState } from 'react';
import { TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

const ManagerAnalytics = () => {
    const [range, setRange] = useState('Last 7 Days');

    const dataByRange = {
        'Last 7 Days': {
            revenue: '₹34,250',
            orders: '842',
            traffic: '1,204',
            waitTime: '14m 20s',
            popularItems: [
                { name: 'Classic Burger', qty: 245, rev: '₹3,675' },
                { name: 'Truffle Fries', qty: 180, rev: '₹1,260' },
                { name: 'Caesar Salad', qty: 156, rev: '₹1,872' },
                { name: 'Craft IPA', qty: 142, rev: '₹1,136' },
            ],
            targetSpeed: '68%',
            mediumSpeed: '22%',
            slowSpeed: '10%'
        },
        'Last 30 Days': {
            revenue: '₹148,500',
            orders: '3,420',
            traffic: '5,120',
            waitTime: '13m 45s',
            popularItems: [
                { name: 'Classic Burger', qty: 980, rev: '₹14,700' },
                { name: 'Caesar Salad', qty: 740, rev: '₹8,880' },
                { name: 'Truffle Fries', qty: 690, rev: '₹4,830' },
                { name: 'Craft IPA', qty: 610, rev: '₹4,880' },
            ],
            targetSpeed: '72%',
            mediumSpeed: '20%',
            slowSpeed: '8%'
        },
        'This Month': {
            revenue: '₹112,000',
            orders: '2,750',
            traffic: '3,980',
            waitTime: '14m 05s',
            popularItems: [
                { name: 'Classic Burger', qty: 810, rev: '₹12,150' },
                { name: 'Caesar Salad', qty: 610, rev: '₹7,320' },
                { name: 'Truffle Fries', qty: 580, rev: '₹4,060' },
                { name: 'Craft IPA', qty: 520, rev: '₹4,160' },
            ],
            targetSpeed: '70%',
            mediumSpeed: '21%',
            slowSpeed: '9%'
        },
        'Year to Date': {
            revenue: '₹984,200',
            orders: '22,410',
            traffic: '32,800',
            waitTime: '12m 55s',
            popularItems: [
                { name: 'Classic Burger', qty: 6500, rev: '₹97,500' },
                { name: 'Caesar Salad', qty: 4800, rev: '₹57,600' },
                { name: 'Truffle Fries', qty: 4100, rev: '₹28,700' },
                { name: 'Craft IPA', qty: 3900, rev: '₹31,200' },
            ],
            targetSpeed: '75%',
            mediumSpeed: '18%',
            slowSpeed: '7%'
        }
    };

    const currentData = dataByRange[range] || dataByRange['Last 7 Days'];

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Analytics</h2>
                    <p className="text-gray-500 text-sm mt-1">Key performance metrics and trends for your branch.</p>
                </div>
                <select 
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm focus:outline-none focus:border-green-500"
                >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="This Month">This Month</option>
                    <option value="Year to Date">Year to Date</option>
                </select>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            <ArrowUpRight size={14} /> 12.5%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                    <h3 className="text-2xl font-extrabold text-gray-900">{currentData.revenue}</h3>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><ShoppingBag size={20} /></div>
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            <ArrowUpRight size={14} /> 5.2%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                    <h3 className="text-2xl font-extrabold text-gray-900">{currentData.orders}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                            <ArrowDownRight size={14} /> 2.1%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Customer Traffic</p>
                    <h3 className="text-2xl font-extrabold text-gray-900">{currentData.traffic}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20} /></div>
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            <ArrowDownRight size={14} /> 4.0%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Avg Wait Time</p>
                    <h3 className="text-2xl font-extrabold text-gray-900">{currentData.waitTime}</h3>
                </div>
            </div>

            {/* Two Column Layout for deeper analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Popular Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Top Selling Items</h3>
                    </div>
                    <div className="p-5">
                        <div className="space-y-4">
                            {currentData.popularItems.map((item, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="font-extrabold text-gray-300 w-4">{i + 1}</span>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.qty} sold</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-700">{item.rev}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Wait Time Analysis */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Order Fulfillment Speed</h3>
                    </div>
                    <div className="p-5">
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 font-medium">Under 15 mins (Target)</span>
                                    <span className="font-bold text-green-600">{currentData.targetSpeed}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full transition-all duration-350" style={{ width: currentData.targetSpeed }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 font-medium">15 - 25 mins</span>
                                    <span className="font-bold text-orange-500">{currentData.mediumSpeed}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-orange-400 h-2 rounded-full transition-all duration-350" style={{ width: currentData.mediumSpeed }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 font-medium">Over 25 mins (Delayed)</span>
                                    <span className="font-bold text-red-600">{currentData.slowSpeed}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full transition-all duration-350" style={{ width: currentData.slowSpeed }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ManagerAnalytics;
