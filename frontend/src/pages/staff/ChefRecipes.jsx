import { useState, useEffect } from 'react';
import { Search, Book, Clock, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ChefRecipes = () => {
    const { api } = useAuth();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const res = await api.get('/menu');
            setRecipes(res.data);
        } catch (err) {
            console.error('Failed to fetch menu items', err);
            toast.error('Failed to fetch menu items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const filteredRecipes = recipes.filter(recipe => 
        !searchQuery || 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        recipe.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full max-w-[1600px] mx-auto font-sans space-y-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Digital Recipe Book</h2>
                    <p className="text-gray-400 text-sm mt-1">Standardized recipes and plating instructions.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search recipe..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#1e2330] border border-[#2a3040] text-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500 min-w-[300px]" 
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : filteredRecipes.length === 0 ? (
                <div className="bg-[#1e2330] rounded-2xl p-12 border border-[#2a3040] text-center">
                    <p className="text-gray-400">No menu recipes found in the database.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredRecipes.map((recipe, i) => {
                        const prepTime = recipe.description?.length > 100 ? '25m' : (recipe.description?.length > 50 ? '15m' : '10m');
                        const difficulty = recipe.description?.length > 100 ? 'Hard' : (recipe.description?.length > 50 ? 'Medium' : 'Easy');
                        return (
                            <div key={i} className="bg-[#1e2330] rounded-2xl border border-[#2a3040] p-5 hover:border-orange-500/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-[#151923] text-orange-400 rounded-xl group-hover:bg-orange-500/10 transition-colors">
                                            <Book size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-[#151923] px-2 py-1 rounded border border-[#2a3040]">
                                            {recipe.category}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-white text-lg mb-2 leading-tight">{recipe.name}</h3>
                                    <p className="text-xs text-gray-400 mb-4 line-clamp-2">{recipe.description || 'No standardized plating description provided.'}</p>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm border-t border-[#2a3040] pt-4">
                                    <span className="flex items-center gap-1.5 text-gray-400"><Clock size={16} /> {prepTime}</span>
                                    <span className="flex items-center gap-1.5 text-gray-400"><ChefHat size={16} /> {difficulty}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ChefRecipes;
