import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, ChevronDown, ShoppingBag, Heart, Star, 
  Clock, ShieldCheck, Tag, ArrowRight, Sparkles,
  ChevronLeft, ChevronRight, Truck, CreditCard, UtensilsCrossed,
  Smartphone, User, Copy, Check, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

// ============================================================================
// 1. REFERENCE DATA MATCHING SCREENSHOT EXACTLY
// ============================================================================

const FEATURED_RESTAURANTS = [
  {
    _id: 'rest-spice-villa',
    name: 'Spice Villa',
    badge: 'Bestseller',
    badgeColor: 'bg-[#FF5A1F] text-white',
    rating: '4.5',
    deliveryTime: '30-40 mins',
    cuisines: 'Indian • South Indian • Chinese',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop'
  },
  {
    _id: 'rest-burger-hub',
    name: 'Burger Hub',
    badge: 'Popular',
    badgeColor: 'bg-[#10B981] text-white',
    rating: '4.3',
    deliveryTime: '25-35 mins',
    cuisines: 'Burgers • Fast Food • Beverages',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop'
  },
  {
    _id: 'rest-pizza-palace',
    name: 'Pizza Palace',
    badge: null,
    rating: '4.7',
    deliveryTime: '30-45 mins',
    cuisines: 'Pizza • Italian • Fast Food',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop'
  },
  {
    _id: 'rest-royal-thali',
    name: 'Royal Thali',
    badge: null,
    rating: '4.4',
    deliveryTime: '35-50 mins',
    cuisines: 'South Indian • North Indian',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=800&auto=format&fit=crop'
  }
];

const CUISINES_LIST = [
  { id: 'all', name: 'All', isGrid: true },
  { id: 'south-indian', name: 'South Indian', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=240&auto=format&fit=crop' },
  { id: 'north-indian', name: 'North Indian', image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=240&auto=format&fit=crop' },
  { id: 'chinese', name: 'Chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=240&auto=format&fit=crop' },
  { id: 'italian', name: 'Italian', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=240&auto=format&fit=crop' },
  { id: 'fast-food', name: 'Fast Food', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=240&auto=format&fit=crop' },
  { id: 'beverages', name: 'Beverages', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=240&auto=format&fit=crop' },
  { id: 'desserts', name: 'Desserts', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=240&auto=format&fit=crop' }
];

const POPULAR_DISHES = [
  {
    _id: 'dish-chicken-biryani',
    name: 'Chicken Biryani',
    discount: '40% OFF',
    rating: '4.6',
    price: 180,
    originalPrice: 300,
    cuisine: 'North Indian',
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop',
    description: 'Slow-cooked aromatic basmati rice with tender spiced chicken pieces.'
  },
  {
    _id: 'dish-paneer-butter-masala',
    name: 'Paneer Butter Masala',
    discount: '30% OFF',
    rating: '4.5',
    price: 150,
    originalPrice: 220,
    cuisine: 'North Indian',
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600&auto=format&fit=crop',
    description: 'Fresh cottage cheese simmered in a velvety rich butter and tomato cashew gravy.'
  },
  {
    _id: 'dish-margherita-pizza',
    name: 'Margherita Pizza',
    discount: '20% OFF',
    rating: '4.4',
    price: 220,
    originalPrice: 275,
    cuisine: 'Italian',
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?q=80&w=600&auto=format&fit=crop',
    description: 'Crisp hand-stretched crust topped with fresh mozzarella, basil, and San Marzano sauce.'
  },
  {
    _id: 'dish-veg-fried-rice',
    name: 'Veg Fried Rice',
    discount: '25% OFF',
    rating: '4.3',
    price: 120,
    originalPrice: 160,
    cuisine: 'Chinese',
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=600&auto=format&fit=crop',
    description: 'Fragrant wok-tossed long-grain rice with crisp garden vegetables and light soy.'
  },
  {
    _id: 'dish-chocolate-lava-cake',
    name: 'Chocolate Lava Cake',
    discount: '15% OFF',
    rating: '4.7',
    price: 90,
    originalPrice: 105,
    cuisine: 'Desserts',
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop',
    description: 'Warm molten chocolate cake with a rich oozing Belgian cocoa center.'
  }
];

const CUSTOMER_REVIEWS = [
  {
    id: 'rev-priya',
    name: 'Priya S.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    text: 'Amazing food and super fast delivery! The biryani was just perfect. Highly recommended!'
  },
  {
    id: 'rev-arun',
    name: 'Arun K.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    text: 'Great variety of restaurants and easy to order. Love the offers and discounts!'
  },
  {
    id: 'rev-sneha',
    name: 'Sneha R.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    text: 'The app is so user friendly and the food arrived hot. Keep it up!'
  }
];

export default function Explore() {
  const navigate = useNavigate();
  const { cartCount, addToCart, wishlist, toggleWishlist, setIsCartOpen } = useCart();
  const { user, api, logout } = useCustomerAuth();

  // State
  const [restaurants, setRestaurants] = useState(FEATURED_RESTAURANTS);
  const [dishes, setDishes] = useState(POPULAR_DISHES);
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(() => localStorage.getItem('userLocation') || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(() => !!localStorage.getItem('foodnest_newsletter_subscribed'));
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [customerReviews, setCustomerReviews] = useState(CUSTOMER_REVIEWS);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewCarouselIndex, setReviewCarouselIndex] = useState(0);

  const containerRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  // --------------------------------------------------------------------------
  // Fetch Backend Data (Merge Real Database Records Gracefully)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // Load Live Restaurants
    api.get('/restaurants').then(({ data }) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        const approved = data.filter(r => !r.isDeleted && r.status !== 'Inactive' && r.approvalStatus === 'Approved');
        if (approved.length > 0) {
          const backendMapped = approved.map((r, i) => ({
            _id: r._id,
            name: r.name,
            badge: i === 0 ? 'Bestseller' : (i === 1 ? 'Popular' : null),
            badgeColor: i === 0 ? 'bg-[#FF5A1F] text-white' : 'bg-[#10B981] text-white',
            rating: r.rating ? String(r.rating) : '4.5',
            deliveryTime: r.deliveryTime || '30-40 mins',
            cuisines: r.cuisineType || r.cuisine || 'Multi-Cuisine',
            image: r.image || r.bannerImage || FEATURED_RESTAURANTS[i % FEATURED_RESTAURANTS.length].image
          }));
          const existingNames = new Set(backendMapped.map(r => r.name.toLowerCase()));
          const nonDup = FEATURED_RESTAURANTS.filter(r => !existingNames.has(r.name.toLowerCase()));
          setRestaurants([...FEATURED_RESTAURANTS, ...backendMapped.filter(b => !nonDup.some(n => n._id === b._id))]);
        }
      }
    }).catch(() => {});

    // Load Live Menu
    api.get('/menu').then(({ data }) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        const backendDishes = data.map((d, i) => ({
          _id: d._id,
          name: d.name,
          discount: d.discount ? `${d.discount}% OFF` : (i % 2 === 0 ? '30% OFF' : '20% OFF'),
          rating: d.rating ? String(d.rating) : '4.5',
          price: d.price || 150,
          originalPrice: d.originalPrice || Math.round((d.price || 150) * 1.35),
          cuisine: d.cuisine || 'Indian',
          category: d.category || 'Mains',
          image: d.image || POPULAR_DISHES[i % POPULAR_DISHES.length].image,
          description: d.description || 'Freshly prepared delicious specialty dish.'
        }));
        const existingNames = new Set(POPULAR_DISHES.map(d => d.name.toLowerCase()));
        const extraBackend = backendDishes.filter(b => !existingNames.has(b.name.toLowerCase()));
        setDishes([...POPULAR_DISHES, ...extraBackend]);
      }
    }).catch(() => {});

    // Load Live Customer Reviews (Real-time DB synced with Customer Dashboard reviews)
    setReviewsLoading(true);
    api.get('/customer-reviews/public').then(({ data }) => {
      if (isMounted && data && Array.isArray(data.data) && data.data.length > 0) {
        const liveReviews = data.data.map(r => ({
          id: r._id,
          name: r.customerName || 'Happy Foodie',
          avatar: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.customerName || 'Customer')}&background=FF5A1F&color=fff`,
          rating: Number(r.rating) || 5,
          text: r.reviewText,
          createdAt: r.createdAt
        }));
        // Prepend dynamic live reviews before the fallback defaults
        setCustomerReviews([...liveReviews, ...CUSTOMER_REVIEWS]);
      }
    }).catch(() => {}).finally(() => {
      if (isMounted) setReviewsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [api]);

  // --------------------------------------------------------------------------
  // Intersection Observer for Smooth Scroll-Reveal
  // --------------------------------------------------------------------------
  useEffect(() => {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '50px 0px 50px 0px'
    });

    const elements = containerRef.current?.querySelectorAll('.reveal-on-scroll');
    elements?.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [restaurants, dishes]);

  // --------------------------------------------------------------------------
  // Close Modals on Outside Click & Escape Key
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isManualScrollRef = useRef(false);
  const manualScrollTimerRef = useRef(null);

  // --------------------------------------------------------------------------
  // Scroll Spy for Dynamic Active Navbar Links
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      // If user clicked a navbar button, ignore scroll events until smooth scroll settles
      if (isManualScrollRef.current) return;

      const navHeight = 76;
      const scrollPos = window.scrollY + navHeight + 100;
      const sections = [
        { id: 'about', el: document.getElementById('how-it-works') },
        { id: 'offers', el: document.getElementById('offers') },
        { id: 'menu', el: document.getElementById('popular-dishes') },
        { id: 'restaurants', el: document.getElementById('featured-restaurants') },
        { id: 'home', el: document.getElementById('home') },
      ];
      for (const sec of sections) {
        if (sec.el && sec.el.offsetTop <= scrollPos) {
          setActiveNav(sec.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    };
  }, []);

  const handleNavClick = (id, targetId) => {
    setActiveNav(id);
    isManualScrollRef.current = true;
    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    
    // Release manual scroll lock after smooth scrolling completes
    manualScrollTimerRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 850);

    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(targetId);
    if (el) {
      const navOffset = 76;
      const elPos = el.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top: Math.max(0, elPos), behavior: 'smooth' });
    }
  };

  // --------------------------------------------------------------------------
  // React GPS Method: Browser Geolocation + Reverse Geocoding (City, Country)
  // --------------------------------------------------------------------------
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser', { icon: '⚠️' });
      return;
    }

    setIsDetectingLocation(true);
    const loadingToast = toast.loading('Accessing GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedCity = '';
        let detectedCountry = '';

        try {
          // OpenStreetMap Nominatim reverse geocode
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || addr.state || '';
            detectedCountry = addr.country || '';
          }
        } catch (e) {
          console.warn('Nominatim reverse geocode error:', e);
        }

        // Secondary fallback to BigDataCloud client API
        if (!detectedCity || !detectedCountry) {
          try {
            const bdcRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (bdcRes.ok) {
              const bdcData = await bdcRes.json();
              if (!detectedCity) detectedCity = bdcData.city || bdcData.locality || bdcData.principalSubdivision || '';
              if (!detectedCountry) detectedCountry = bdcData.countryName || '';
            }
          } catch (e) {
            console.warn('BigDataCloud reverse geocode error:', e);
          }
        }

        // Format into City, Country
        const formattedLocation = (detectedCity && detectedCountry)
          ? `${detectedCity}, ${detectedCountry}`
          : (detectedCity || detectedCountry || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);

        // Automatically update state
        setLocation(formattedLocation);

        // Save in localStorage
        localStorage.setItem('userLocation', formattedLocation);
        localStorage.setItem('userCoordinates', JSON.stringify({ latitude, longitude }));

        // If user logged in, persist to backend profile
        if (user && api) {
          api.put('/customer/profile', { location: formattedLocation, coordinates: { latitude, longitude } }).catch(() => {});
        }

        setIsDetectingLocation(false);
        toast.dismiss(loadingToast);
        toast.success(`Location updated to ${formattedLocation}!`, { icon: '📍' });
      },
      (error) => {
        setIsDetectingLocation(false);
        toast.dismiss(loadingToast);
        if (error.code === 1) {
          toast.error('Location permission was denied. Please allow GPS access in your browser settings.');
        } else if (error.code === 2) {
          toast.error('Location unavailable. Please check your network or GPS connection.');
        } else if (error.code === 3) {
          toast.error('Location request timed out. Please try again.');
        } else {
          toast.error('Could not detect location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleAddToCart = (dish) => {
    addToCart(dish);
    toast.success(`Added ${dish.name} to cart!`);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      toast.error('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubscribing(true);
    // Simulate instantaneous newsletter registration API dispatch
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      localStorage.setItem('foodnest_newsletter_subscribed', cleanEmail);
    } catch {
      // ignore localStorage quota errors
    }
    setSubscribed(true);
    setEmailInput('');
    setIsSubscribing(false);
    toast.success('Thank you for subscribing! Exclusive offers and 20% OFF coupon sent to your inbox.', {
      icon: '🎉',
      duration: 4000
    });
  };

  const handleFindRestaurants = () => {
    const el = document.getElementById('featured-restaurants');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/menu');
    }
  };

  // Filter dishes by cuisine or search
  const displayedDishes = dishes.filter(d => {
    const matchesCuisine = selectedCuisine === 'all' || 
      d.cuisine?.toLowerCase().includes(selectedCuisine) ||
      d.category?.toLowerCase().includes(selectedCuisine);
    const matchesSearch = !searchQuery || 
      d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCuisine && matchesSearch;
  });

  const displayedRestaurants = restaurants.filter(r => {
    if (!searchQuery) return true;
    return r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.cuisines?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#FF5A1F] selection:text-white">

      {/* ======================================================================= */}
      {/* 1. NAVBAR (COMPACT WHITE NAVBAR MATCHING SCREENSHOT)                    */}
      {/* ======================================================================= */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between gap-4">
          
          {/* Logo with Utensil Icon & Tagline */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shadow-md shadow-[#FF5A1F]/25 group-hover:scale-105 transition-transform">
              <UtensilsCrossed size={22} className="stroke-[2.2]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[22px] font-black tracking-tight text-slate-900 leading-none">
                Food<span className="text-[#FF5A1F]">Nest</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 mt-1">
                Good Food, Better Mood
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Dynamic Active State */}
          <div className="hidden lg:flex items-center gap-7 text-[15px] font-semibold">
            {[
              { id: 'home', label: 'Home', targetId: 'home' },
              { id: 'restaurants', label: 'Restaurants', targetId: 'featured-restaurants' },
              { id: 'menu', label: 'Menu', targetId: 'popular-dishes' },
              { id: 'offers', label: 'Offers', targetId: 'offers' },
              { id: 'about', label: 'About Us', targetId: 'how-it-works' },
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.targetId)}
                  className={`relative py-1.5 font-semibold transition-colors duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'text-[#FF5A1F]'
                      : 'text-slate-600 hover:text-[#FF5A1F]'
                  }`}
                >
                  <span>{item.label}</span>
                  {/* Fixed underline bar that doesn't cause text width re-flow or jumping */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#FF5A1F] transition-all duration-200 ${
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Action Icons: Location, Search, Cart, Login */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* GPS Location Button (Direct browser GPS permission + reverse geocode) */}
            <button
              onClick={handleGetLocation}
              disabled={isDetectingLocation}
              className={`flex items-center gap-1.5 text-xs font-bold transition-all px-2.5 py-1.5 rounded-xl border cursor-pointer ${
                isDetectingLocation
                  ? 'bg-orange-50 text-[#FF5A1F] border-orange-200 animate-pulse'
                  : 'text-slate-700 hover:text-[#FF5A1F] hover:bg-orange-50/60 border-slate-200/80 hover:border-orange-200 shadow-xs'
              }`}
              title="Click to detect your current location via GPS"
              aria-label="Detect GPS Location"
            >
              <MapPin size={15} className={`text-[#FF5A1F] shrink-0 ${isDetectingLocation ? 'animate-bounce' : ''}`} />
              <span className="max-w-[110px] sm:max-w-[160px] truncate">
                {isDetectingLocation ? 'Detecting...' : (location || 'Detect Location')}
              </span>
            </button>

            {/* Search Icon */}
            <button
              onClick={() => {
                const nextState = !isSearchOpen;
                setIsSearchOpen(nextState);
                if (nextState) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isSearchOpen ? 'bg-orange-50 text-[#FF5A1F]' : 'text-slate-600 hover:bg-slate-100 hover:text-[#FF5A1F]'
              }`}
              aria-label="Search"
              title="Search menu and restaurants"
            >
              <Search size={18} />
            </button>

            {/* Cart Icon with Live Badge Counter */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#FF5A1F] transition-colors cursor-pointer"
              aria-label="Shopping Cart"
              title="View your cart"
            >
              <ShoppingBag size={20} />
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#FF5A1F] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {cartCount > 0 ? cartCount : 2}
              </span>
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold border border-orange-200 transition-colors cursor-pointer"
                  title="My Account"
                  aria-label="Account Menu"
                >
                  <User size={14} />
                  <span className="max-w-[85px] truncate">{user.name || 'Account'}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email || ''}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#FF5A1F] transition-colors"
                      >
                        <User size={14} />
                        <span>My Dashboard</span>
                      </Link>

                      <Link
                        to="/profile/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#FF5A1F] transition-colors"
                      >
                        <ShoppingBag size={14} />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/reservations"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#FF5A1F] transition-colors"
                      >
                        <UtensilsCrossed size={14} />
                        <span>Book a Table</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          toast.success('Logged out successfully');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                      >
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/customer/login"
                className="bg-[#FF5A1F] hover:bg-[#e04f1a] text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] shadow-sm shadow-[#FF5A1F]/30 hover:shadow-md transition-all cursor-pointer"
              >
                Login / Sign Up
              </Link>
            )}

          </div>
        </div>

        {/* Live Search Input Bar */}
        {isSearchOpen && (
          <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 animate-in slide-in-from-top-1">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  const el = document.getElementById('popular-dishes');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                  toast.success(`Found items matching "${searchQuery}"`);
                }
              }}
              className="max-w-xl mx-auto relative flex items-center gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <Search size={16} className="text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search dishes or restaurants (e.g. Biryani, Pizza, Burger)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-14 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#FF5A1F]"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')} 
                    className="absolute right-3.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-[#FF5A1F] hover:bg-[#e04f1a] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer text-xs"
                title="Close"
              >
                ✕
              </button>
            </form>
          </div>
        )}
      </nav>


      {/* ======================================================================= */}
      {/* 2. HERO SECTION (SEAMLESS FULL-WIDTH NATURAL FOOD COMPOSITION - NO CARD) */}
      {/* ======================================================================= */}
      <section id="home" className="relative w-full overflow-hidden bg-gradient-to-r from-white via-[#FCF9F5] to-[#F8F5EE]">
        
        {/* Soft Organic Background Glow (Top Left) */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-emerald-100/40 via-orange-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Right Food Scene - Natural Blended Photography (NO CARDS, NO BORDERS, NO SHADOWS) */}
        <div className="lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-[54%] xl:w-[52%] w-full h-[360px] xs:h-[420px] sm:h-[480px] lg:h-full relative pointer-events-none select-none">
          <img
            src="/images/food/biryani-hero-platter.jpg"
            alt="Delicious Chicken Dum Biryani Platter with raita and sides"
            className="w-full h-full object-cover object-[center_right] lg:object-[left_center]"
            loading="eager"
          />
          {/* Subtle Seamless Left Edge Gradient Blending directly into the Hero Canvas */}
          <div className="absolute inset-y-0 left-0 w-24 sm:w-44 lg:w-64 bg-gradient-to-r from-white sm:from-[#FCF9F5] via-[#FCF9F5]/85 to-transparent pointer-events-none" />
          
          {/* Subtle Top & Bottom Gradient Feathering */}
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#FCF9F5] to-transparent pointer-events-none lg:block hidden" />

          {/* Handwritten "Hot & Fresh Always!" Callout with Arrow */}
          <div className="absolute top-6 right-6 sm:top-10 sm:right-14 z-20 flex flex-col items-end pointer-events-none select-none">
            <span className="font-serif italic font-extrabold text-[#78350F] text-sm sm:text-base tracking-tight drop-shadow-xs">
              Hot &amp; Fresh<br />Always! ↝
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] py-8 sm:py-10 lg:py-12">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-4 sm:space-y-5 lg:pr-6">
              
              {/* Fresh & Tasty Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-bold">
                <span className="text-sm">🌿</span>
                <span>Fresh &amp; Tasty</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.12]">
                Delicious Food<br />
                Delivered to <span className="text-[#FF5A1F]">Your Door</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-500 font-medium max-w-lg leading-relaxed">
                Explore your favourite restaurants, order online and get fresh, hot and delicious food at your doorstep.
              </p>

              {/* Location / Search Box Card */}
              <div className="w-full max-w-lg bg-white p-2 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2 w-full sm:flex-1 px-3 py-1">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isDetectingLocation}
                    title="Detect current location via GPS"
                    className="p-1 rounded-lg hover:bg-orange-50 text-[#FF5A1F] transition-colors cursor-pointer shrink-0"
                  >
                    <MapPin size={18} className={isDetectingLocation ? 'animate-bounce' : ''} />
                  </button>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={location ? `Delivery in ${location}...` : "Enter your delivery location"}
                    className="w-full text-xs sm:text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isDetectingLocation}
                    className="text-[11px] font-bold text-[#FF5A1F] hover:underline whitespace-nowrap cursor-pointer shrink-0"
                  >
                    {isDetectingLocation ? 'Locating...' : 'Use GPS'}
                  </button>
                </div>
                <button
                  onClick={handleFindRestaurants}
                  className="w-full sm:w-auto bg-[#FF5A1F] hover:bg-[#e04f1a] text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-[#FF5A1F]/30 text-xs sm:text-sm shrink-0 transition-all cursor-pointer"
                >
                  Find Restaurants
                </button>
              </div>

              {/* Trust Highlights (3 Pills) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg pt-1">
                
                {/* Fast Delivery */}
                <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">Fast Delivery</span>
                    <span className="text-[10px] text-slate-400 font-medium">In time delivery</span>
                  </div>
                </div>

                {/* Safe & Secure */}
                <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">Safe &amp; Secure</span>
                    <span className="text-[10px] text-slate-400 font-medium">Secure payments</span>
                  </div>
                </div>

                {/* Great Offers */}
                <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Tag size={16} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">Great Offers</span>
                    <span className="text-[10px] text-slate-400 font-medium">Save more</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Spacer for desktop layout balance */}
            <div className="hidden lg:block lg:col-span-5 pointer-events-none" />

          </div>


        </div>
      </section>


      {/* ======================================================================= */}
      {/* 3. FEATURED RESTAURANTS (EXACT PIXEL RECREATION: 4 CARDS, 16:9, COMPACT)*/}
      {/* ======================================================================= */}
      <section id="featured-restaurants" className="py-3 sm:py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex items-end justify-between mb-5 sm:mb-6">
            <div className="text-left">
              <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
                Featured Restaurants
              </h2>
              <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5">
                Top rated restaurants near you
              </p>
            </div>
            <Link
              to="/menu"
              className="text-xs sm:text-sm font-bold text-[#FF5A1F] hover:underline flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 4 Cards Responsive Grid (Single row on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayedRestaurants.slice(0, 4).map((rest, index) => (
              <div
                key={rest._id}
                onClick={() => navigate(`/restaurant/${rest._id}`)}
                className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left reveal-on-scroll"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {/* 16:9 Cover Image with Optional Badge */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  <img
                    src={rest.image}
                    alt={rest.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  {rest.badge && (
                    <div className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${rest.badgeColor}`}>
                      {rest.badge}
                    </div>
                  )}
                </div>

                {/* Details (Compact spacing & exact typography) */}
                <div className="p-3 space-y-1">
                  {/* Rating & Delivery Time */}
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                    <div className="flex items-center gap-1 text-slate-800 font-bold">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{rest.rating}</span>
                    </div>
                    <span className="text-slate-300 mx-1">•</span>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={11} className="text-slate-400" />
                      <span className="text-[11px] font-medium">{rest.deliveryTime}</span>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-[#FF5A1F] transition-colors line-clamp-1">
                    {rest.name}
                  </h3>

                  {/* Cuisines */}
                  <p className="text-xs text-slate-400 font-medium line-clamp-1">
                    {rest.cuisines}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ======================================================================= */}
      {/* 4. EXPLORE BY CUISINE (EXACT 8 TILES ROW, COMPACT, ACTIVE ORANGE ALL)   */}
      {/* ======================================================================= */}
      <section className="py-3 sm:py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex items-end justify-between mb-5 sm:mb-6">
            <div className="text-left">
              <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
                Explore by Cuisine
              </h2>
              <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5">
                Find your favourite cuisine
              </p>
            </div>
            <button
              onClick={() => setSelectedCuisine('all')}
              className="text-xs sm:text-sm font-bold text-[#FF5A1F] hover:underline flex items-center gap-1 group cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* 8 Compact Category Tiles (Single row on desktop) */}
          <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-3.5">
            {CUISINES_LIST.map((c) => {
              const isActive = selectedCuisine === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCuisine(c.id)}
                  className={`flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center group ${
                    isActive
                      ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/20 scale-102'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:border-orange-200 hover:shadow-xs'
                  }`}
                >
                  {/* Icon or Food Photo */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 overflow-hidden ${
                    isActive ? 'bg-white/20' : 'bg-transparent'
                  }`}>
                    {c.isGrid ? (
                      <div className="grid grid-cols-2 gap-1 p-1">
                        <span className="w-2 h-2 rounded-xs bg-white" />
                        <span className="w-2 h-2 rounded-xs bg-white" />
                        <span className="w-2 h-2 rounded-xs bg-white" />
                        <span className="w-2 h-2 rounded-xs bg-white" />
                      </div>
                    ) : (
                      <img 
                        src={c.image} 
                        alt={c.name} 
                        className="w-full h-full object-cover rounded-md group-hover:scale-108 transition-transform"
                      />
                    )}
                  </div>
                  <span className={`text-xs font-bold tracking-tight line-clamp-1 ${
                    isActive ? 'text-white' : 'text-slate-800 group-hover:text-[#FF5A1F]'
                  }`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </section>


      {/* ======================================================================= */}
      {/* 5. POPULAR DISHES (EXACT 5-COL ROW, SQUARES, GREEN DISCOUNT, ORANGE BTN)*/}
      {/* ======================================================================= */}
      <section id="popular-dishes" className="py-3 sm:py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex items-end justify-between mb-5 sm:mb-6">
            <div className="text-left">
              <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
                Popular Dishes
              </h2>
              <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5">
                Loved by our customers
              </p>
            </div>
            <Link
              to="/menu"
              className="text-xs sm:text-sm font-bold text-[#FF5A1F] hover:underline flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 5-Column Grid (Single row on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {displayedDishes.slice(0, 5).map((dish, index) => {
              const isFav = wishlist?.some(item => (item._id || item.id) === (dish._id || dish.id));

              return (
                <div
                  key={dish._id}
                  className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between text-left reveal-on-scroll"
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  <div>
                    {/* Square Image with Green Discount Badge & Wishlist Heart */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-50 mb-2.5">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover hover:scale-103 transition-transform duration-300"
                        loading="lazy"
                      />
                      {dish.discount && (
                        <div className="absolute top-2 left-2 bg-[#10B981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          {dish.discount}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(dish);
                          toast(isFav ? 'Removed from favourites' : 'Added to favourites!', { icon: '❤️' });
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                          isFav ? 'bg-red-500 text-white shadow-xs' : 'bg-white/90 text-slate-600 hover:text-red-500 shadow-xs'
                        }`}
                        aria-label="Wishlist"
                      >
                        <Heart size={12} className={isFav ? 'fill-white' : ''} />
                      </button>
                    </div>

                    {/* Dish Info */}
                    <div className="space-y-0.5">
                      <h4 className="text-[13px] sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {dish.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{dish.rating}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 pt-1">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{dish.price}
                        </span>
                        {dish.originalPrice && (
                          <span className="text-xs font-semibold text-slate-400 line-through">
                            ₹{dish.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button (Compact & exact orange pill) */}
                  <button
                    onClick={() => handleAddToCart(dish)}
                    className="w-full mt-3 bg-[#FF5A1F] hover:bg-[#e04f1a] active:scale-98 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* ======================================================================= */}
      {/* 6. PROMOTIONAL BANNER (BURGER/FRIES, FLAT 20% OFF, PERKS)               */}
      {/* ======================================================================= */}
      <section id="offers" className="py-3 sm:py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#FFF5ED] via-[#FFF9F3] to-[#FFF5ED] border border-orange-200/60 p-6 sm:p-10 shadow-xs overflow-hidden">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left Column */}
              <div className="lg:col-span-5 text-left space-y-3.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-orange-200 text-orange-700 text-xs font-bold shadow-xs">
                  <span>🌿</span>
                  <span>Special Offer</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Flat 20% OFF<br />
                  <span className="text-slate-500 font-semibold text-xl sm:text-2xl">on your first order</span>
                </h3>

                {/* Coupon Code Pill */}
                <div className="pt-1">
                  <div
                    onClick={() => handleCopyCoupon('WELCOME20')}
                    className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-dashed border-[#FF5A1F] text-[#FF5A1F] font-mono font-bold text-xs sm:text-sm shadow-xs cursor-pointer hover:bg-orange-50/50 transition-colors group"
                    title="Click to copy coupon code"
                  >
                    <span>Use Code:</span>
                    <span className="text-slate-900 tracking-wider">WELCOME20</span>
                    <Copy size={13} className="text-[#FF5A1F] group-hover:scale-110 transition-transform" />
                    {copiedCoupon && <span className="text-[10px] text-emerald-600 font-bold ml-1">Copied!</span>}
                  </div>
                </div>
              </div>

              {/* Center Column: Mouthwatering Burger & Fries Photo */}
              <div className="lg:col-span-4 flex items-center justify-center">
                <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-xl border-4 border-white">
                  <img
                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"
                    alt="Flame grilled burger with crispy fries and dips"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Right Column: 3 Perks */}
              <div className="lg:col-span-3 flex flex-col space-y-4 text-left">
                
                {/* Free Delivery */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Truck size={17} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">Free Delivery</span>
                    <span className="text-[11px] text-slate-400 font-medium">on orders above ₹199</span>
                  </div>
                </div>

                {/* Exclusive Deals */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles size={17} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">Exclusive Deals</span>
                    <span className="text-[11px] text-slate-400 font-medium">only on our app</span>
                  </div>
                </div>

                {/* Easy Payments */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CreditCard size={17} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">Easy Payments</span>
                    <span className="text-[11px] text-slate-400 font-medium">UPI, Cards, Wallets</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>


      {/* ======================================================================= */}
      {/* 7. HOW IT WORKS (4 STEPS NUMBERED 1, 2, 3, 4)                           */}
      {/* ======================================================================= */}
      <section id="how-it-works" className="py-3 sm:py-5 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-5 sm:mb-6 text-left">
            <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5">
              Get your favourite food in just a few steps
            </p>
          </div>

          {/* 4 Steps Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1: Choose Restaurant */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-[#FF5A1F] flex items-center justify-center shadow-xs">
                  <Search size={22} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  1
                </div>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">Choose Restaurant</h4>
              <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">
                Browse from a variety of restaurants near you.
              </p>
            </div>

            {/* Step 2: Select Food */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-[#FF5A1F] flex items-center justify-center shadow-xs">
                  <UtensilsCrossed size={22} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  2
                </div>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">Select Food</h4>
              <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">
                Add your favourite dishes to the cart.
              </p>
            </div>

            {/* Step 3: Make Payment */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-[#FF5A1F] flex items-center justify-center shadow-xs">
                  <CreditCard size={22} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  3
                </div>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">Make Payment</h4>
              <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">
                Choose your preferred payment method.
              </p>
            </div>

            {/* Step 4: Enjoy Food */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-[#10B981] flex items-center justify-center shadow-xs">
                  <Truck size={22} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#10B981] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  4
                </div>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">Enjoy Food</h4>
              <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">
                Get your food delivered at your doorstep.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* ======================================================================= */}
      {/* 8. WHAT OUR CUSTOMERS SAY (3 TESTIMONIAL CARDS WITH AVATARS & STARS)   */}
      {/* ======================================================================= */}
      <section className="py-4 sm:py-6 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex items-end justify-between mb-7">
            <div className="text-left">
              <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight">
                What Our Customers Say
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                Real people. Real experiences.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Link to="/profile" className="hidden sm:inline text-xs font-bold text-[#FF5A1F] hover:underline mr-2">
                Write a Review →
              </Link>
              <button
                onClick={() => setReviewCarouselIndex(prev => Math.max(0, prev - 1))}
                disabled={reviewCarouselIndex === 0}
                className={`w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center transition-colors shadow-xs ${
                  reviewCarouselIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-[#FF5A1F] cursor-pointer'
                }`}
                aria-label="Previous"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setReviewCarouselIndex(prev => Math.min(Math.max(0, customerReviews.length - 3), prev + 1))}
                disabled={reviewCarouselIndex >= Math.max(0, customerReviews.length - 3)}
                className={`w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center transition-colors shadow-xs ${
                  reviewCarouselIndex >= Math.max(0, customerReviews.length - 3) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-[#FF5A1F] cursor-pointer'
                }`}
                aria-label="Next"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Review Cards (Shows 3 at a time or slides dynamically) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {customerReviews.slice(reviewCarouselIndex, reviewCarouselIndex + 3).map((rev) => (
              <div
                key={rev.id || rev._id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.avatar}
                      alt={rev.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.name)}&background=FF5A1F&color=fff`;
                      }}
                      className="w-10 h-10 rounded-full object-cover border border-orange-100"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900">{rev.name}</h4>
                        {rev.createdAt && (
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                          <Star key={i} size={11} className="fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                    "{rev.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ======================================================================= */}
      {/* 9. NEWSLETTER SECTION (LIGHT MINT BANNER WITH EMAIL SUBSCRIBE)          */}
      {/* ======================================================================= */}
      <section className="py-3 sm:py-4 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#ECFDF5] via-[#F0FDF4] to-[#ECFDF5] border border-emerald-100 p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
            
            {/* Left Content */}
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-xl bg-[#047857] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Get Exclusive Offers &amp; Updates
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Subscribe to our newsletter and never miss a deal.
                </p>
              </div>
            </div>

            {/* Form & Success State */}
            {subscribed ? (
              <div className="flex items-center gap-3 bg-emerald-100/70 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>You're subscribed! Keep an eye on your inbox.</span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('foodnest_newsletter_subscribed');
                    setSubscribed(false);
                  }}
                  className="ml-2 text-emerald-700 hover:text-emerald-950 underline font-bold cursor-pointer text-[11px]"
                >
                  Change
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} noValidate className="w-full md:w-auto flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isSubscribing}
                  className="w-full sm:w-64 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#047857] disabled:opacity-60 transition-all"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="bg-[#047857] hover:bg-[#065F46] disabled:opacity-75 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      </section>


      {/* ======================================================================= */}
      {/* 10. FOOTER (DARK SLATE #0D1527, BRAND, QUICK LINKS, HELP, APP BADGES)   */}
      {/* ======================================================================= */}
      <footer className="bg-[#0D1527] text-slate-400 pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-left">
            
            {/* Brand Column */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center">
                  <UtensilsCrossed size={19} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xl font-black text-white tracking-tight leading-none">
                    Food<span className="text-[#FF5A1F]">Nest</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    Good Food, Better Mood
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Your favourite dishes and restaurants delivered fast, fresh, and hot right to your doorstep.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-white mb-3.5 tracking-wider uppercase">
                Quick Links
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li><button type="button" onClick={() => handleNavClick('home', 'home')} className="hover:text-[#FF5A1F] transition-colors cursor-pointer text-left">Home</button></li>
                <li><button type="button" onClick={() => handleNavClick('restaurants', 'featured-restaurants')} className="hover:text-[#FF5A1F] transition-colors cursor-pointer text-left">Restaurants</button></li>
                <li><button type="button" onClick={() => handleNavClick('menu', 'popular-dishes')} className="hover:text-[#FF5A1F] transition-colors cursor-pointer text-left">Menu</button></li>
                <li><button type="button" onClick={() => handleNavClick('offers', 'offers')} className="hover:text-[#FF5A1F] transition-colors cursor-pointer text-left">Offers</button></li>
                <li><button type="button" onClick={() => handleNavClick('about', 'how-it-works')} className="hover:text-[#FF5A1F] transition-colors cursor-pointer text-left">About Us</button></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="text-xs font-bold text-white mb-3.5 tracking-wider uppercase">
                Help
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <button 
                    type="button" 
                    onClick={() => handleNavClick('about', 'how-it-works')} 
                    className="hover:text-[#FF5A1F] transition-colors cursor-pointer text-left no-underline outline-none"
                  >
                    How It Works
                  </button>
                </li>
                <li><Link to="/reservations" className="hover:text-[#FF5A1F] transition-colors no-underline">Book a Table</Link></li>
              </ul>
            </div>

            {/* App Badges */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white tracking-wider uppercase">
                Download Our App
              </h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-700 transition-colors">
                  <span>Google Play</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-700 transition-colors">
                  <span>App Store</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500">
            <p>© 2026 FoodNest. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span>Good Food</span>
              <span>|</span>
              <span>Great Mood</span>
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
