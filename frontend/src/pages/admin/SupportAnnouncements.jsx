import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Calendar, Bell, Info, ShieldAlert, Sparkles, Megaphone, 
    ArrowLeft, ChevronRight, Activity, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const SupportAnnouncements = () => {
    const { api } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setLoading(true);
            try {
                const params = {};
                if (typeFilter) params.type = typeFilter;
                
                const res = await api.get('/support/announcements', { params });
                setAnnouncements(res.data);
            } catch (error) {
                console.error('Failed to load announcements:', error);
                toast.error('Failed to retrieve announcements.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, [api, typeFilter]);

    const getAnnouncementTypeDetails = (type) => {
        switch (type) {
            case 'Scheduled Maintenance':
                return {
                    label: 'Maintenance',
                    color: 'bg-orange-50 text-orange-700 border-orange-100',
                    icon: Clock
                };
            case 'Feature Releases':
                return {
                    label: 'Release',
                    color: 'bg-green-50 text-green-700 border-green-100',
                    icon: Sparkles
                };
            case 'Service Updates':
                return {
                    label: 'Update',
                    color: 'bg-blue-50 text-blue-700 border-blue-100',
                    icon: Info
                };
            case 'Known Issues':
                return {
                    label: 'Outage/Alert',
                    color: 'bg-red-50 text-red-700 border-red-100 animate-pulse',
                    icon: ShieldAlert
                };
            default:
                return {
                    label: 'Notification',
                    color: 'bg-gray-50 text-gray-700 border-gray-100',
                    icon: Bell
                };
        }
    };

    const announcementTypes = [
        'Scheduled Maintenance',
        'Feature Releases',
        'Service Updates',
        'Known Issues'
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-gray-900">Support Announcements</h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">SaaS maintenance notices, service updates, releases, and alerts.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2.5 shrink-0 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                <button
                    onClick={() => setTypeFilter('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        !typeFilter 
                        ? 'bg-gray-900 text-white shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    All Updates
                </button>
                {announcementTypes.map((type) => {
                    const style = getAnnouncementTypeDetails(type);
                    const isSelected = typeFilter === type;
                    return (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isSelected 
                                ? 'bg-gray-900 text-white border-gray-900' 
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-100'
                            }`}
                        >
                            {type}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map((n) => (
                            <div key={n} className="bg-white p-6 rounded-3xl border border-gray-50 animate-pulse space-y-3">
                                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-50 rounded w-2/3"></div>
                                <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
                        <div className="p-3.5 bg-gray-50 text-gray-400 rounded-full">
                            <Megaphone size={30} />
                        </div>
                        <h3 className="font-extrabold text-gray-900 text-sm">No announcements</h3>
                        <p className="text-xs text-gray-400 font-semibold max-w-xs leading-relaxed">
                            No announcements or system status reports found for the selected category.
                        </p>
                    </div>
                ) : (
                    announcements.map((announce) => {
                        const config = getAnnouncementTypeDetails(announce.type);
                        const Icon = config.icon;
                        return (
                            <div key={announce._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-5 items-start">
                                {/* Left icon */}
                                <div className={`p-3.5 rounded-2xl border ${config.color} shrink-0`}>
                                    <Icon size={20} />
                                </div>
                                
                                {/* Content info */}
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full border ${config.color}`}>
                                            {config.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            {new Date(announce.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-semibold">
                                            by Platform Support Team
                                        </span>
                                    </div>
                                    <h3 className="text-base font-extrabold text-gray-900">{announce.title}</h3>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed whitespace-pre-wrap">{announce.content}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default SupportAnnouncements;
