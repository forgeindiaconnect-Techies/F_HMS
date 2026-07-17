import { useState, useEffect } from 'react';
import { Search, MapPin, Star, ChevronDown, User, ShoppingBag, Percent, Navigation, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const Explore = () => {
    const { user, logout } = useCustomerAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState(localStorage.getItem('userLocation') || 'San Francisco, CA');
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const availableLocations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'London, UK', 'Mumbai, IN'];

    // Dummy data for the landing page grid
    const dummyRestaurants = [
        { _id: 'demo1', name: 'Pizza Palace', rating: 4.8, time: '20-25', tags: 'Italian, Pizzas, Fast Food', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo2', name: 'Burger Hub', rating: 4.5, time: '15-20', tags: 'American, Burgers, Beverages', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo3', name: 'South Indian Cafe', rating: 4.9, time: '10-15', tags: 'South Indian, Breakfast', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo4', name: 'Chinese Bowl', rating: 4.2, time: '25-30', tags: 'Chinese, Asian, Noodles', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo5', name: 'BBQ Nation', rating: 4.7, time: '30-40', tags: 'BBQ, Grilled, Non-Veg', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo6', name: 'Juice Corner', rating: 4.6, time: '5-10', tags: 'Beverages, Healthy, Shakes', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ];

    const foodItems = [
        { name: 'Pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Burger', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Chicken', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Paneer', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Noodles', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Dosa', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' }
    ];

    const fetchLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        toast.loading("Detecting location...", { id: "gps" });

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    
                    if (res.data && res.data.address) {
                        const city = res.data.address.city || res.data.address.town || res.data.address.village || "";
                        const state = res.data.address.state || "";
                        const country = res.data.address.country || "";
                        
                        let newLoc = city ? `${city}, ${state || country}` : country;
                        
                        setLocation(newLoc);
                        localStorage.setItem('userLocation', newLoc);
                        toast.success("Location updated!", { id: "gps" });
                        setIsLocationOpen(false);
                    } else {
                        toast.error("Could not determine city", { id: "gps" });
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to fetch location data", { id: "gps" });
                }
            },
            (error) => {
                toast.error("Location permission denied", { id: "gps" });
            }
        );
    };

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
                if (!API_URL.endsWith('/api')) API_URL += '/api';
                const res = await axios.get(`${API_URL}/restaurants`);
                let realRest = res.data.filter(r => r.subscription?.status === 'Active' && r.isActive !== false);
                let combined = [...realRest];
                if (combined.length < 6) {
                    combined.push(...dummyRestaurants.slice(0, 6 - combined.length));
                }
                setRestaurants(combined);
            } catch (error) {
                console.error("Failed to load restaurants", error);
                setRestaurants(dummyRestaurants);
            } finally {
                setTimeout(() => setLoading(false), 500);
            }
        };
        fetchRestaurants();
    }, []);

    const filtered = restaurants.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans">
            
            {/* Clean Zomato/Swiggy Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm py-3 px-4 lg:px-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1200px] mx-auto w-full">
                    
                    {/* Logo & Location */}
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                        <Link to="/" className="text-3xl font-black italic tracking-tighter text-red-500 hover:opacity-80 transition-opacity">
                            RestaurantHub
                        </Link>
                        
                        {/* Location Selector */}
                        <div className="relative hidden md:block">
                            <div 
                                onClick={() => setIsLocationOpen(!isLocationOpen)}
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors border-b-2 border-transparent hover:border-gray-200"
                            >
                                <MapPin size={20} className="text-red-500 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-800 line-clamp-1 border-b border-dashed border-gray-400">
                                        {location}
                                    </span>
                                </div>
                                <ChevronDown size={16} className="text-red-500" />
                            </div>

                            {isLocationOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                                    <div 
                                        onClick={fetchLocation}
                                        className="px-4 py-2 text-sm cursor-pointer hover:bg-red-50 text-red-600 transition-colors font-bold flex items-center gap-2 border-b border-gray-100 pb-3 mb-1"
                                    >
                                        <Navigation size={16} /> Detect Current Location
                                    </div>
                                    {availableLocations.map(loc => (
                                        <div 
                                            key={loc}
                                            onClick={() => { setLocation(loc); localStorage.setItem('userLocation', loc); setIsLocationOpen(false); }}
                                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors ${location === loc ? 'font-bold text-red-500 bg-red-50/50' : 'text-gray-700'}`}
                                        >
                                            {loc}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search & Auth */}
                    <div className="flex items-center gap-4 w-full md:w-auto flex-1 md:flex-none justify-end">
                        {/* Search Bar */}
                        <div className="flex-1 md:w-80 lg:w-[400px] bg-gray-50 border border-gray-200 rounded-xl flex items-center px-4 py-2.5 focus-within:bg-white focus-within:shadow-md focus-within:border-gray-300 transition-all">
                            <Search className="text-gray-400 shrink-0 mr-3" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search for restaurant, cuisine or a dish" 
                                className="w-full bg-transparent outline-none text-gray-700 text-sm font-light"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Mobile Location (shows only on small screens) */}
                        <div className="md:hidden flex items-center text-red-500">
                            <MapPin size={24} />
                        </div>

                        {user ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                                    className="hidden md:flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors font-bold text-gray-700"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                        <User size={18} />
                                    </div>
                                    {user.name}
                                </button>
                                
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                                        <Link 
                                            to="/profile" 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 font-bold transition-colors text-left"
                                        >
                                            Profile
                                        </Link>
                                        <Link 
                                            to="/profile/orders" 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 font-bold transition-colors text-left"
                                        >
                                            Orders
                                        </Link>
                                        <Link 
                                            to="/profile/reservations" 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 font-bold transition-colors text-left"
                                        >
                                            Table Booking History
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-3">
                                <Link to="/login?type=customer" className="text-gray-600 hover:text-red-500 font-medium px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
                                    Log in
                                </Link>
                                <Link to="/register?type=customer" className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-xl shadow-sm hover:shadow transition-all">
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1200px] mx-auto w-full px-4 py-8">
                
                {/* Promo Banner with Abstract Graphics & Intro Summary */}
                <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-red-500 to-orange-500 text-white p-8 md:p-12 mb-10 shadow-lg shadow-red-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Abstract Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute -bottom-10 left-10 w-48 h-48 bg-black/10 rounded-full blur-xl"></div>
                    
                    <div className="relative z-10 space-y-3 max-w-xl">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Special Offer
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black font-sans tracking-tight">
                            Delicious food, delivered right to your table!
                        </h2>
                        <p className="text-white/80 text-sm font-medium leading-relaxed">
                            Order online for contactless table service, schedule a quick pickup, or reserve your favorite table in advance. Get 50% discount on your first order.
                        </p>
                    </div>
                    <div className="relative z-10 shrink-0">
                        <Link 
                            to="/menu" 
                            className="bg-white text-red-600 font-bold px-6 py-3.5 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Explore Menu <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

                {/* Food Items Section: "Inspiration for your first order" */}
                <section className="mb-14">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">What's on your mind?</h2>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-6 pb-6 pt-2 custom-scrollbar no-scrollbar scroll-smooth">
                        {foodItems.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 min-w-[130px] cursor-pointer group shrink-0">
                                <div className="w-32 h-32 rounded-full bg-transparent overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                                </div>
                                <span className="text-lg font-medium text-gray-700 group-hover:text-gray-900">{item.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="w-full h-[1px] bg-gray-200 mt-4"></div>
                </section>

                {/* Restaurant Grid Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Restaurants with Self-Pickup near you</h2>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filtered.map(restaurant => (
                                <Link to={`/restaurant/${restaurant._id}`} key={restaurant._id} className="group cursor-pointer block hover:scale-[0.98] transition-transform duration-200">
                                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                                        <img 
                                            src={restaurant.img || restaurant.logo || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"} 
                                            alt={restaurant.name} 
                                            className="w-full h-full object-cover"
                                        />
                                        
                                        {/* Gradient Overlay for text readability at bottom */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                        
                                        {/* Offer Text */}
                                        <div className="absolute bottom-2 left-3 right-3 text-white">
                                            <h4 className="text-xl font-black tracking-tighter flex items-center gap-1.5">
                                                <Percent size={18} /> 50% OFF UPTO ₹100
                                            </h4>
                                        </div>
                                    </div>
                                    
                                    <div className="px-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-[1.15rem] font-bold text-gray-900 truncate">
                                                {restaurant.name}
                                            </h3>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="bg-green-700 text-white px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                                                <Star size={10} className="fill-white" /> 4.{Math.floor(Math.random() * 5) + 1}
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                            <span className="text-sm font-bold text-gray-700">{restaurant.time || '15-20'} mins</span>
                                        </div>
                                        
                                        <div className="text-[14px] text-gray-500 font-light truncate mb-2">
                                            {restaurant.tags || 'North Indian, Fast Food, Beverages'}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 border-dashed">
                                            <ShoppingBag size={14} className="text-orange-500" />
                                            <span>Multiple self-pickup locations available</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    
                    {!loading && filtered.length === 0 && (
                        <div className="text-center py-20 flex flex-col items-center">
                            <img src="https://b.zmtcdn.com/web/assets/not-found.svg" alt="Not found" className="w-64 h-64 opacity-50 mb-6" />
                            <h3 className="text-2xl font-bold text-gray-700">No restaurants found</h3>
                            <p className="text-gray-500 mt-2 font-light">Try searching for something else.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Explore;
