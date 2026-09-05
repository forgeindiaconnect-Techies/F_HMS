import { useState } from 'react';
import { TrendingUp, Star, DollarSign, Clock, Award, CheckCircle2, HeartPulse, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const WaiterPerformance = () => {
    const [period, setPeriod] = useState('Today');

    const performanceData = {
        'Today': {
            orders: 28,
            ordersTrend: '+15% vs yesterday',
            serveTime: '14m',
            serveTrend: '2m faster than branch avg',
            rating: 4.9,
            reviewsCount: 18,
            tips: '₹1,850',
            tipsTrend: '+₹450 in last hour',
            accuracy: 98,
            accuracyText: 'Zero order rejections or returns during today\'s shift.',
            feedback: [
                { id: 1, table: 'Table 5', rating: 5, comment: 'Prompt service and amazing food recommendation!', time: '1h ago', customer: 'Alex M.' },
                { id: 2, table: 'Table 7', rating: 5, comment: 'Very polite floor captain. Quick bill generation.', time: '2h ago', customer: 'Sarah K.' },
                { id: 3, table: 'Table 2', rating: 4.5, comment: 'Good overall, hot pizzas served fast.', time: '3h ago', customer: 'David R.' },
            ]
        },
        'This Week': {
            orders: 184,
            ordersTrend: '+22% vs last week',
            serveTime: '13m',
            serveTrend: '3m faster than branch avg',
            rating: 4.8,
            reviewsCount: 112,
            tips: '₹12,400',
            tipsTrend: '+₹2,100 vs last week',
            accuracy: 97,
            accuracyText: 'Only 2 order modifications requested across 184 tickets.',
            feedback: [
                { id: 10, table: 'Table 12', rating: 5, comment: 'Consistently high quality table management!', time: 'Yesterday', customer: 'Jessica T.' },
                { id: 11, table: 'Table 4', rating: 5, comment: 'Great attention to nut allergy requirements.', time: '2 days ago', customer: 'Michael P.' },
                { id: 12, table: 'Table 9', rating: 4.5, comment: 'Friendly waiter service for our birthday dinner.', time: '3 days ago', customer: 'Elena B.' },
            ]
        },
        'This Month': {
            orders: 740,
            ordersTrend: '+18% monthly growth',
            serveTime: '15m',
            serveTrend: 'Top 5% floor captain speed',
            rating: 4.9,
            reviewsCount: 420,
            tips: '₹48,900',
            tipsTrend: '+₹6,500 vs previous month',
            accuracy: 99,
            accuracyText: 'Rated #1 for order accuracy across the entire franchise.',
            feedback: [
                { id: 20, table: 'Table 1', rating: 5, comment: 'Outstanding hospitality month after month!', time: '1 week ago', customer: 'Robert H.' },
                { id: 21, table: 'Table 8', rating: 5, comment: 'Our favorite server at Savor!', time: '2 weeks ago', customer: 'Amanda L.' },
                { id: 22, table: 'Table 3', rating: 5, comment: 'Flawless VIP service experience.', time: '3 weeks ago', customer: 'Chris V.' },
            ]
        }
    };

    const handlePeriodChange = (p) => {
        setPeriod(p);
        toast.success(`Loaded performance metrics for ${p}`);
    };

    const currentData = performanceData[period] || performanceData['Today'];

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Banner Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                        <Award size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Shift Performance & Tips
                        </h1>
                        <p className="text-sm font-medium text-emerald-100 mt-0.5">
                            Real-time waiter service analytics, accuracy scores & tips earned
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {['Today', 'This Week', 'This Month'].map((p) => (
                        <button
                            key={p}
                            onClick={() => handlePeriodChange(p)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                                period === p
                                ? 'bg-white text-emerald-800 border-white shadow-md'
                                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                        <span>Orders Served</span>
                        <CheckCircle2 size={18} className="text-emerald-600" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{currentData.orders}</div>
                    <p className="text-xs text-emerald-600 font-bold">{currentData.ordersTrend}</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                        <span>Avg Serve Time</span>
                        <Clock size={18} className="text-blue-600" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{currentData.serveTime}</div>
                    <p className="text-xs text-blue-600 font-bold">{currentData.serveTrend}</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                        <span>Customer Rating</span>
                        <Star size={18} className="fill-amber-400 text-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{currentData.rating} <span className="text-sm font-bold text-slate-400">/ 5.0</span></div>
                    <p className="text-xs text-amber-600 font-bold">Based on {currentData.reviewsCount} table reviews</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                        <span>{period}'s Tips</span>
                        <DollarSign size={18} className="text-emerald-600" />
                    </div>
                    <div className="text-3xl font-black text-emerald-700">{currentData.tips}</div>
                    <p className="text-xs text-emerald-600 font-bold">{currentData.tipsTrend}</p>
                </div>
            </div>

            {/* Performance Details Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Accuracy Score Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <HeartPulse size={20} className="text-emerald-600" /> Order Accuracy & Service Quality
                    </h3>
                    <div className="flex items-center gap-6 bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100">
                        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" className="text-emerald-200" fill="transparent" />
                                <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" className="text-emerald-600" fill="transparent" strokeDasharray="201" strokeDashoffset={(201 * (100 - currentData.accuracy)) / 100} strokeLinecap="round" />
                            </svg>
                            <span className="absolute font-black text-base text-emerald-950">{currentData.accuracy}%</span>
                        </div>
                        <div>
                            <h4 className="font-extrabold text-slate-900 text-base">Execution Score ({period})</h4>
                            <p className="text-xs text-slate-600 font-medium mt-1">
                                {currentData.accuracyText}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Reviews Feed */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Star size={20} className="text-amber-500 fill-amber-500" /> Customer Feedback ({period})
                    </h3>
                    <div className="space-y-3">
                        {currentData.feedback.map(item => (
                            <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-extrabold text-xs text-slate-900">{item.table} ({item.customer})</span>
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 font-medium italic">"{item.comment}"</p>
                                <span className="text-[10px] text-slate-400 font-bold block">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default WaiterPerformance;

