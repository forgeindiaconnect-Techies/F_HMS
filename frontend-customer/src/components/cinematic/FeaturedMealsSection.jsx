import { useState } from 'react';
import { Star, Clock, ShoppingBag, Check, Flame } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const POPULAR_MEALS = [
    {
        id: 'pop-1',
        name: 'Flame-Charred Chicken Tikka Platter',
        category: 'Grill',
        price: 360,
        rating: 4.9,
        time: '20 min',
        image: '/images/food/kebabs.jpg',
        tags: 'Kashmiri Chili, Lime, Fresh Mint'
    },
    {
        id: 'pop-2',
        name: 'Classic Margherita Stone Pizza',
        category: 'Pizza',
        price: 420,
        rating: 4.8,
        time: '15 min',
        image: '/images/food/pizza.jpg',
        tags: 'Buffalo Mozzarella, Basil, Olive Oil'
    },
    {
        id: 'pop-3',
        name: 'Nawabi Handi Chicken Biryani',
        category: 'Biryani',
        price: 399,
        rating: 4.9,
        time: '25 min',
        image: '/images/food/biryani.jpg',
        tags: 'Saffron Basmati, Fried Shallots'
    },
    {
        id: 'pop-4',
        name: 'Double Truffle Angus Smash Burger',
        category: 'Burger',
        price: 310,
        rating: 4.9,
        time: '15 min',
        image: '/images/food/burger.jpg',
        tags: 'Aged Cheddar, Brioche, Truffle Aioli'
    },
    {
        id: 'pop-5',
        name: 'Creamy Black Truffle Fettuccine',
        category: 'Pasta',
        price: 350,
        rating: 4.7,
        time: '15 min',
        image: '/images/food/pasta.jpg',
        tags: 'Parmesan Emulsion, Black Truffles'
    },
    {
        id: 'pop-6',
        name: 'Warm Valrhona Chocolate Lava Cake',
        category: 'Dessert',
        price: 240,
        rating: 4.9,
        time: '10 min',
        image: '/images/food/dessert.jpg',
        tags: 'Molten Ganache, Vanilla Gelato'
    }
];

const CATEGORIES = ['All', 'Grill', 'Pizza', 'Biryani', 'Burger', 'Pasta', 'Dessert'];

const FeaturedMealsSection = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [addedMealId, setAddedMealId] = useState(null);
    const { addToCart } = useCart();

    const filteredMeals = selectedCategory === 'All'
        ? POPULAR_MEALS
        : POPULAR_MEALS.filter(m => m.category === selectedCategory);

    const handleAdd = (meal) => {
        addToCart({
            id: meal.id,
            _id: meal.id,
            name: meal.name,
            price: meal.price,
            image: meal.image,
            category: meal.category
        });
        setAddedMealId(meal.id);
        toast.success(`Added ${meal.name} to order!`);
        setTimeout(() => setAddedMealId(null), 1800);
    };

    return (
        <section className="py-20 md:py-28 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            <Flame size={14} />
                            <span>Signature &amp; Popular Meals</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Fresh From Our Kitchens
                        </h2>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    selectedCategory === cat
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-105'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid of Dishes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMeals.map(meal => (
                        <div
                            key={meal.id}
                            className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-orange-500/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <img
                                    src={meal.image}
                                    alt={meal.name}
                                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                                    loading="lazy"
                                />
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black text-amber-300 flex items-center gap-1">
                                    <Star size={11} className="fill-amber-300" />
                                    <span>{meal.rating}</span>
                                </div>
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1">
                                    <Clock size={11} className="text-orange-400" />
                                    <span>{meal.time}</span>
                                </div>
                            </div>

                            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
                                        {meal.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {meal.tags}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-lg font-black text-slate-900 dark:text-white">
                                        ₹{meal.price}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleAdd(meal)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-orange-500/20"
                                    >
                                        {addedMealId === meal.id ? (
                                            <>
                                                <Check size={14} />
                                                <span>Added</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingBag size={14} />
                                                <span>Add to Order</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default FeaturedMealsSection;
