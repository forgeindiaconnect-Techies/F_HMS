import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Search, HelpCircle, ThumbsUp, ThumbsDown, ChevronRight, 
    BookOpen, Heart, Eye, ArrowLeft, RefreshCw, Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';

const SupportKnowledgeBase = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [activeCategory, setActiveCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [loading, setLoading] = useState(true);

    const categories = [
        'Getting Started',
        'Subscription',
        'Orders',
        'POS',
        'QR Digital Menu',
        'Kitchen',
        'Inventory',
        'Payments',
        'Delivery',
        'Troubleshooting',
        'FAQs'
    ];

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (activeCategory) params.category = activeCategory;
            const search = searchParams.get('search');
            if (search) params.search = search;

            const res = await api.get('/support/knowledge-base', { params });
            setArticles(res.data);
        } catch (error) {
            console.error('Failed to load help articles:', error);
            toast.error('Failed to load knowledge base articles.');
        } finally {
            setLoading(false);
        }
    }, [api, activeCategory, searchParams]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchParams(searchQuery ? { search: searchQuery } : {});
    };

    const handleArticleClick = async (article) => {
        try {
            // Fetch latest article details (which increments views on the server)
            const res = await api.get(`/support/knowledge-base/${article._id}`);
            setSelectedArticle(res.data);
        } catch (error) {
            setSelectedArticle(article);
        }
    };

    const handleVote = async (id, voteType) => {
        try {
            const payload = {};
            if (voteType === 'helpful') {
                payload.helpfulVotes = (selectedArticle.helpfulVotes || 0) + 1;
            } else {
                payload.unhelpfulVotes = (selectedArticle.unhelpfulVotes || 0) + 1;
            }

            // We can reuse the update KB article endpoint for votes tracking
            const res = await api.put(`/support/knowledge-base/${id}`, payload);
            setSelectedArticle(res.data);
            setArticles(articles.map(art => art._id === id ? res.data : art));
            toast.success('Thank you for your feedback!');
        } catch (error) {
            toast.error('Failed to register vote.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100">Knowledge Base</h2>
                    <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5">Search help documentation, POS setups, and FAQs.</p>
                </div>
                {selectedArticle && (
                    <button 
                        onClick={() => setSelectedArticle(null)}
                        className="px-4 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                        <ArrowLeft size={14} /> Back to Search
                    </button>
                )}
            </div>

            {/* If article detail view is open */}
            {selectedArticle ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
                    <div className="space-y-3 border-b border-gray-50 dark:border-slate-800 pb-5">
                        <span className="text-[10px] font-black uppercase text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-900/50">
                            {selectedArticle.category}
                        </span>
                        <h1 className="text-2xl font-black text-gray-950 dark:text-slate-100">{selectedArticle.title}</h1>
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Eye size={14} /> {selectedArticle.views} views</span>
                            <span className="flex items-center gap-1"><ThumbsUp size={14} /> {selectedArticle.helpfulVotes} helpful votes</span>
                            <span>Updated: {new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="prose max-w-none text-sm text-gray-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                        {selectedArticle.content}
                    </div>

                    {/* Helpful Question */}
                    <div className="pt-6 border-t border-gray-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/20 dark:bg-slate-950/30 p-5 rounded-2xl">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-200">Was this article helpful to resolve your query?</span>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => handleVote(selectedArticle._id, 'helpful')}
                                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-950/50 text-green-600 dark:text-green-400 border border-gray-100 dark:border-slate-700 hover:border-green-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                            >
                                <ThumbsUp size={14} /> Yes
                            </button>
                            <button 
                                onClick={() => handleVote(selectedArticle._id, 'unhelpful')}
                                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 border border-gray-100 dark:border-slate-700 hover:border-red-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                            >
                                <ThumbsDown size={14} /> No
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Search Feed Grid */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Category list panel */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 block px-3">Help Categories</span>
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
                            <button
                                onClick={() => setActiveCategory('')}
                                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                                    !activeCategory 
                                    ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400' 
                                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
                                }`}
                            >
                                All Categories
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                                        activeCategory === cat 
                                        ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400' 
                                        : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Articles Feed */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Search input bar */}
                        <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search key terms (e.g. printer config, refund policy)..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-50 dark:border-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-semibold transition-all"
                                />
                                <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-slate-500" />
                            </div>
                            <button 
                                type="submit" 
                                className="px-5 py-2.5 bg-gray-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors shrink-0"
                            >
                                Search
                            </button>
                        </form>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((n) => (
                                        <div key={n} className="py-4 border-b border-gray-50 dark:border-slate-800 space-y-2 animate-pulse">
                                            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-1/3"></div>
                                            <div className="h-3 bg-gray-50 dark:bg-slate-800/60 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : articles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                    <div className="p-3 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 rounded-full">
                                        <BookOpen size={30} />
                                    </div>
                                    <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm">No articles found</h3>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold max-w-xs leading-relaxed">
                                        There are no help articles listed under this category or matching your search term.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                                    {articles.map((article) => (
                                        <div 
                                            key={article._id}
                                            onClick={() => handleArticleClick(article)}
                                            className="py-4 hover:bg-gray-50/20 dark:hover:bg-slate-800/40 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                                        >
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black uppercase text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {article.category}
                                                </span>
                                                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors mt-1">
                                                    {article.title}
                                                </h4>
                                                <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold truncate max-w-xl">
                                                    {article.content}
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-green-500 transition-colors shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportKnowledgeBase;
