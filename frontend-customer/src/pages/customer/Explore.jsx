import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { 
  Search, MapPin, ChevronDown, ShoppingBag, Heart, Star, 
  Clock, ShieldCheck, Tag, ArrowRight, Sparkles,
  ChevronLeft, ChevronRight, Truck, CreditCard, UtensilsCrossed,
  Smartphone, User, Copy, Check, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import LocationPickerModal from '../../components/LocationPickerModal';
import DishDetailModal from '../../components/DishDetailModal';
import { getSavedLocation, saveUserLocation, detectUserLocation, requestBrowserGpsLocation, reverseGeocodeCoords, filterRestaurantsForLocation, EVENT_LOCATION_UPDATED } from '../../utils/locationHelper';
import { useCart } from '../../context/CartContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getApiUrl } from '../../utils/axiosInstance';

// ============================================================================
// 1. REFERENCE DATA MATCHING SCREENSHOT EXACTLY
// ============================================================================
// 1. CUISINES CATEGORIES
// ============================================================================

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

export default function Explore() {
  const navigate = useNavigate();
  const { cartCount, addToCart, wishlist, toggleWishlist, setIsCartOpen } = useCart();
  const { user, api, logout } = useCustomerAuth();

  // State (Initialized cleanly with cached fallback for instant rendering)
  const [restaurants, setRestaurants] = useState(() => {
    try {
      const cached = localStorage.getItem('foodnest_explore_restaurants_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [dishes, setDishes] = useState(() => {
    try {
      const cached = localStorage.getItem('foodnest_explore_dishes_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [loadingData, setLoadingData] = useState(() => {
    try {
      const cached = localStorage.getItem('foodnest_explore_restaurants_cache');
      return !(cached && JSON.parse(cached)?.length > 0);
    } catch { return true; }
  });
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize location from localStorage if previously detected
  const [location, setLocation] = useState(() => getSavedLocation() || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);
  const [customerReviews, setCustomerReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewCarouselIndex, setReviewCarouselIndex] = useState(0);

  // Location Permission & Services Error Modal State
  const [locationModal, setLocationModal] = useState({
    isOpen: false,
    type: null, // 'permission_denied' | 'permanently_denied' | 'services_disabled'
    title: '',
    message: ''
  });
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [manualCityInput, setManualCityInput] = useState('');
  const [selectedDish, setSelectedDish] = useState(null);

  const containerRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  const [fetchError, setFetchError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // --------------------------------------------------------------------------
  // Fetch Real-time Backend Data Exclusively from MongoDB
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    if (restaurants.length === 0) setLoadingData(true);
    setFetchError(null);

    // Guaranteed fallback timer so skeleton loading NEVER hangs indefinitely (1500ms max loading cap)
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoadingData(false);
      }
    }, 1500);

    // Parallel atomic fetching with Promise.allSettled
    Promise.allSettled([
      api.get('/restaurants'),
      api.get('/menu'),
      api.get('/offers'),
      api.get('/customer-reviews/public')
    ]).then(([restRes, menuRes, offersRes, reviewsRes]) => {
      if (!isMounted) return;

      // 1. Process Restaurants
      if (restRes.status === 'fulfilled' && Array.isArray(restRes.value?.data)) {
        const approved = restRes.value.data.filter(
          (r) => r.isDeleted !== true && r.status !== 'Inactive' && (r.approvalStatus === 'Approved' || r.approvalStatus === 'Pending' || !r.approvalStatus)
        );
        const backendMapped = approved.map((r, idx) => {
          // Resolve actual uploaded showcase/brand image from DB with highest priority
          const showcaseImg = (Array.isArray(r.showcaseImages) && r.showcaseImages.length > 0 ? r.showcaseImages[0] : null)
            || (typeof r.showcaseImages === 'string' && r.showcaseImages ? r.showcaseImages : null)
            || r.bannerImage
            || r.image
            || (r.logo && !r.logo.includes('.pdf') ? r.logo : null);

          let rawImg = showcaseImg || null;
          if (rawImg && typeof rawImg === 'string') {
            const apiBase = getApiUrl() || api?.defaults?.baseURL || '';
            const origin = apiBase.startsWith('http') ? new URL(apiBase).origin : 'https://f-hms.onrender.com';
            if (!rawImg.startsWith('http') && !rawImg.startsWith('data:')) {
              rawImg = origin + (rawImg.startsWith('/') ? '' : '/') + rawImg;
            }
          }

          // Only show image if uploaded by restaurant admin; otherwise null (empty placeholder)
          const finalImage = rawImg || null;

          return {
            _id: r._id,
            name: r.name,
            badge: r.badge || null,
            badgeColor: r.badge ? 'bg-[#FF5A1F] text-white' : null,
            rating: r.rating ? String(r.rating) : null,
            deliveryTime: r.deliveryTime || null,
            cuisines: r.cuisineType || r.cuisine || '',
            image: finalImage,
            hasCustomImage: !!rawImg,
            showcaseImages: Array.isArray(r.showcaseImages) ? r.showcaseImages : (r.showcaseImages ? [r.showcaseImages] : []),
            bannerImage: r.bannerImage || '',
            logo: r.logo || '',
            city: r.city || '',
            state: r.state || '',
            country: r.country || '',
            address: r.address || '',
            verificationAddress: r.verificationAddress || '',
            branches: r.branches || []
          };
        });
        setRestaurants(backendMapped);
        try {
          const slimCache = backendMapped.map(r => ({
            ...r,
            image: r.image && r.image.length < 4000 ? r.image : null,
            logo: r.logo && r.logo.length < 4000 ? r.logo : '',
            showcaseImages: []
          }));
          localStorage.setItem('foodnest_explore_restaurants_cache', JSON.stringify(slimCache));
        } catch {}
      } else if (restRes.status === 'rejected') {
        console.error('Failed to load restaurants from server:', restRes.reason);
      }

      // 2. Process Menu Dishes
      if (menuRes.status === 'fulfilled' && Array.isArray(menuRes.value?.data)) {
        const backendDishes = menuRes.value.data.map((d, i) => {
          const restObj = typeof d.restaurantId === 'object' && d.restaurantId !== null ? d.restaurantId : null;
          const restName = restObj?.name || '';
          const restId = restObj?._id || (typeof d.restaurantId === 'string' ? d.restaurantId : '');

          let inferredCuisine = d.cuisine || '';
          const dNameLower = (d.name || '').toLowerCase();
          const dCatLower = (d.category || '').toLowerCase();
          if (!inferredCuisine) {
            if (dNameLower.includes('dosa') || dNameLower.includes('idli') || dCatLower.includes('south')) {
              inferredCuisine = 'South Indian';
            } else if (dNameLower.includes('pizza') || dCatLower.includes('pizza') || dNameLower.includes('pasta')) {
              inferredCuisine = 'Italian';
            } else if (dNameLower.includes('burger') || dNameLower.includes('sandwich') || dCatLower.includes('fast')) {
              inferredCuisine = 'Fast Food';
            } else {
              inferredCuisine = d.category || 'Specialty';
            }
          }

          let dishImg = d.image && typeof d.image === 'string' && !d.image.includes('undefined') && !d.image.includes('unsplash.com') ? d.image : null;
          if (dishImg && !dishImg.startsWith('http') && !dishImg.startsWith('data:')) {
            const apiBase = getApiUrl() || api?.defaults?.baseURL || '';
            const origin = apiBase.startsWith('http') ? new URL(apiBase).origin : 'https://f-hms.onrender.com';
            dishImg = `${origin}${dishImg.startsWith('/') ? '' : '/'}${dishImg}`;
          }

          return {
            _id: d._id,
            name: d.name,
            restaurantId: restId,
            restaurantName: restName,
            discount: d.discount ? `${d.discount}% OFF` : (i % 2 === 0 ? '20% OFF' : null),
            rating: d.rating ? String(d.rating) : '4.8',
            price: d.price || 0,
            originalPrice: d.originalPrice || (d.price ? Math.round(d.price * 1.25) : 0),
            cuisine: inferredCuisine,
            category: d.category || 'Mains',
            image: dishImg,
            description: d.description || ''
          };
        });
        setDishes(backendDishes);
        try {
          const slimDishes = backendDishes.map(d => ({
            ...d,
            image: d.image && d.image.length < 4000 ? d.image : null
          }));
          localStorage.setItem('foodnest_explore_dishes_cache', JSON.stringify(slimDishes));
        } catch {}
      } else if (menuRes.status === 'rejected') {
        console.error('Failed to load menu dishes from server:', menuRes.reason);
      }

      // Check if both core queries failed
      if (restRes.status === 'rejected' && menuRes.status === 'rejected') {
        setFetchError('Unable to connect to FoodNest server. Please check your internet connection.');
      }

      // 3. Process Offers
      if (offersRes.status === 'fulfilled' && Array.isArray(offersRes.value?.data)) {
        const active = offersRes.value.data.filter((o) => o.status === 'Active' || (!o.status && o.isActive !== false));
        if (active.length > 0) setActiveOffer(active[0]);
      }

      // 4. Process Reviews
      if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value?.data?.data)) {
        const liveReviews = reviewsRes.value.data.data.map((r) => ({
          id: r._id,
          name: r.customerName || 'Happy Customer',
          avatar: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.customerName || 'Customer')}&background=FF5A1F&color=fff`,
          rating: Number(r.rating) || 5,
          text: r.reviewText,
          createdAt: r.createdAt
        }));
        setCustomerReviews(liveReviews);
      }
      setReviewsLoading(false);
    }).catch((err) => {
      console.error('Unexpected error in Explore data loader:', err);
      if (isMounted) setFetchError('Failed to load restaurant data.');
    }).finally(() => {
      clearTimeout(safetyTimeout);
      if (isMounted) {
        setLoadingData(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [api, fetchTrigger]);

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

    // Safety fallback: ensure reveal-on-scroll elements never remain hidden on mobile/APK webviews
    const revealFallback = setTimeout(() => {
      containerRef.current?.querySelectorAll('.reveal-on-scroll:not(.is-revealed)').forEach(el => {
        el.classList.add('is-revealed');
      });
    }, 350);

    return () => {
      clearTimeout(revealFallback);
      observer.disconnect();
    };
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
  // React GPS Method: Hardware GPS + Reverse Geocoding + Persistence
  // --------------------------------------------------------------------------
  const handleGetLocation = async () => {
    setIsDetectingLocation(true);
    const loadingToast = toast.loading('Waiting for browser GPS permission...');
    try {
      const res = await requestBrowserGpsLocation();
      toast.dismiss(loadingToast);
      if (res && res.formattedLocation) {
        setLocation(res.formattedLocation);
        saveUserLocation(res.formattedLocation, res.coordinates);
        if (user && api) {
          api.put('/users/profile', {
            address: res.formattedLocation
          }).catch(() => {});
        }
        toast.success('Location set to ' + res.formattedLocation + '!', { icon: '📍' });
      } else {
        setIsLocationPickerOpen(true);
        toast('Please pick your city from the list', { icon: '📍' });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.warn('GPS location detection error:', err);
      if (err?.code === 1 || err?.message?.toLowerCase().includes('denied')) {
        setLocationModal({
          isOpen: true,
          type: 'permission_denied',
          title: 'Location Permission Denied',
          message: 'Location permission was denied. Please allow location access in your browser settings or select your city manually.'
        });
      } else {
        toast.error('Could not get GPS location. Please select your city manually.');
        setIsLocationPickerOpen(true);
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleAddToCart = (dish, qty = 1) => {
    addToCart(dish, qty);
    toast.success(`Added ${qty > 1 ? `${qty}x ` : ''}${dish.name} to cart!`);
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
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      const qLower = q.toLowerCase();

      // Check if query matches restaurant name, dish name, or cuisine
      const matchesDishOrCuisine = dishes.some(d => 
        (d.name || '').toLowerCase().includes(qLower) || 
        (d.cuisine || '').toLowerCase().includes(qLower) ||
        (d.category || '').toLowerCase().includes(qLower)
      );

      // Check if user typed a city or location (guard non-empty strings!)
      const isLikelyLocation = (qLower.length >= 3 && restaurants.some(r => {
        const c = (r.city || '').toLowerCase().trim();
        const a = (r.address || '').toLowerCase().trim();
        const v = (r.verificationAddress || '').toLowerCase().trim();
        return (c && (c.includes(qLower) || qLower.includes(c))) ||
               (a && a.includes(qLower)) ||
               (v && v.includes(qLower));
      })) || ['chennai', 'krishnagiri', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'coimbatore', 'madurai', 'salem', 'hosur'].some(known => qLower.includes(known));

      if (isLikelyLocation && !matchesDishOrCuisine) {
        setLocation(q);
        saveUserLocation(q);
        setSearchQuery('');
        toast.success(`Showing restaurants in ${q}!`, { icon: '📍' });
      } else if (isLikelyLocation && matchesDishOrCuisine) {
        // If query matches both, only set location cleanly
        setLocation(q);
        saveUserLocation(q);
        setSearchQuery('');
        toast.success(`Showing restaurants in ${q}!`, { icon: '📍' });
      }
    }

    const el = document.getElementById('featured-restaurants');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/menu');
    }
  };

    // Filter restaurants and outlets by detected location and search query (with friendly fallback to all outlets)
  const { filtered: displayedRestaurants, matchingOutletsCount, isLocationFallback } = useMemo(() => {
    const res = filterRestaurantsForLocation(restaurants, location, searchQuery);
    if (res.filtered.length === 0 && restaurants.length > 0 && location && location.trim() && !searchQuery.trim()) {
      return {
        filtered: restaurants,
        matchingOutletsCount: restaurants.reduce((acc, r) => acc + Math.max(1, (r.branches || []).length), 0),
        isLocationFallback: true
      };
    }
    return { ...res, isLocationFallback: false };
  }, [restaurants, location, searchQuery]);

  // Filter dishes by cuisine, search, and matching restaurants
  const displayedDishes = dishes.filter(d => {
    // If an exact location match is active (not fallback), prioritize dishes belonging to matching restaurants
    if (location && location.trim() && !isLocationFallback && displayedRestaurants.length > 0) {
      const matchingRestIds = new Set(displayedRestaurants.map(r => String(r._id)));
      const dishRestId = String(d.restaurantId?._id || d.restaurantId || '');
      if (dishRestId && !matchingRestIds.has(dishRestId)) {
        return false;
      }
    }

    const qCuisine = selectedCuisine.toLowerCase().replace('-', ' ').trim();
    const dCuisine = (d.cuisine || '').toLowerCase();
    const dCat = (d.category || '').toLowerCase();
    const dName = (d.name || '').toLowerCase();

    let matchesCuisine = selectedCuisine === 'all';
    if (!matchesCuisine) {
      matchesCuisine = dCuisine.includes(qCuisine) || 
                       dCat.includes(qCuisine) || 
                       dName.includes(qCuisine);

      // Smart cuisine mapping for common terms
      if (!matchesCuisine) {
        if (qCuisine.includes('south') && (dName.includes('dosa') || dName.includes('idli') || dName.includes('vada') || dName.includes('sambar') || dName.includes('coffee') || dCat.includes('meal'))) {
          matchesCuisine = true;
        } else if (qCuisine.includes('italian') && (dName.includes('pizza') || dName.includes('pasta') || dCat.includes('pizza'))) {
          matchesCuisine = true;
        } else if (qCuisine.includes('chinese') && (dName.includes('noodle') || dName.includes('manchurian') || dName.includes('fried rice') || dName.includes('hakka'))) {
          matchesCuisine = true;
        } else if (qCuisine.includes('fast food') && (dName.includes('burger') || dName.includes('fries') || dName.includes('sandwich') || dCat.includes('pizza'))) {
          matchesCuisine = true;
        } else if (qCuisine.includes('beverage') && (dName.includes('juice') || dName.includes('smoothie') || dName.includes('tea') || dName.includes('coffee') || dName.includes('shake'))) {
          matchesCuisine = true;
        } else if (qCuisine.includes('dessert') && (dName.includes('cake') || dName.includes('sweet') || dName.includes('ice cream'))) {
          matchesCuisine = true;
        }
      }
    }

    const matchesSearch = !searchQuery || 
      dName.includes(searchQuery.toLowerCase()) ||
      dCuisine.includes(searchQuery.toLowerCase()) ||
      dCat.includes(searchQuery.toLowerCase());

    return matchesCuisine && matchesSearch;
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#FF5A1F] selection:text-white">

      {/* ======================================================================= */}
      {/* 1. NAVBAR (RESPONSIVE FOR MOBILE APPS & TABLETS)                        */}
      {/* ======================================================================= */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-[76px] flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo with Utensil Icon & Tagline */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shadow-md shadow-[#FF5A1F]/25 group-hover:scale-105 transition-transform">
              <UtensilsCrossed size={18} className="sm:w-[22px] sm:h-[22px] stroke-[2.2]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg sm:text-[22px] font-black tracking-tight text-slate-900 leading-none">
                Food<span className="text-[#FF5A1F]">Nest</span>
              </span>
              <span className="hidden xs:inline text-[9px] sm:text-[10px] font-medium text-slate-400 mt-0.5 sm:mt-1">
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
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* GPS Location Button (Hidden on very narrow screens to prevent crushing, integrated into hero/sub-bar) */}
            <button
              onClick={handleGetLocation}
              disabled={isDetectingLocation}
              className={`hidden sm:flex items-center gap-1.5 text-xs font-bold transition-all px-2.5 py-1.5 rounded-xl border cursor-pointer ${
                isDetectingLocation
                  ? 'bg-orange-50 text-[#FF5A1F] border-orange-200 animate-pulse'
                  : 'text-slate-700 hover:text-[#FF5A1F] hover:bg-orange-50/60 border-slate-200/80 hover:border-orange-200 shadow-xs'
              }`}
              title="Click to detect your current location via GPS"
              aria-label="Detect GPS Location"
            >
              <MapPin size={15} className={`text-[#FF5A1F] shrink-0 ${isDetectingLocation ? 'animate-bounce' : ''}`} />
              <span className="max-w-[100px] md:max-w-[150px] truncate">
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
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
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
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#FF5A1F] transition-colors cursor-pointer"
              aria-label="Shopping Cart"
              title="View your cart"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A1F] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold border border-orange-200 transition-colors cursor-pointer"
                  title="My Account"
                  aria-label="Account Menu"
                >
                  <User size={14} />
                  <span className="max-w-[70px] sm:max-w-[85px] truncate">{user.name || 'Account'}</span>
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
                className="bg-[#FF5A1F] hover:bg-[#e04f1a] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-[13px] shadow-sm shadow-[#FF5A1F]/30 hover:shadow-md transition-all cursor-pointer"
              >
                Login
              </Link>
            )}

          </div>
        </div>

        {/* Mobile GPS Location Strip (Shown on mobile screens right under top bar) */}
        <div className="sm:hidden px-3.5 py-2.5 bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50 border-t border-orange-100 flex items-center justify-between text-xs select-none">
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-2 text-slate-800 truncate text-left flex-1 min-w-0 cursor-pointer active:opacity-75 touch-manipulation"
          >
            <div className="w-6 h-6 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center shrink-0 shadow-xs">
              <MapPin size={13} className={isDetectingLocation ? 'animate-bounce' : ''} />
            </div>
            <div className="truncate">
              <p className="truncate font-bold text-[12px] text-slate-900 leading-tight">
                {location || 'Detect Your Location'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {location ? 'Tap to refresh GPS' : 'Connect GPS to find nearby restaurants'}
              </p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isDetectingLocation}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FF5A1F] hover:bg-[#e04f1a] active:scale-95 text-white rounded-lg text-[11px] font-bold shadow-xs shrink-0 ml-2 cursor-pointer transition-all touch-manipulation"
          >
            {isDetectingLocation ? (
              <>
                <Loader2 size={11} className="animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <MapPin size={11} />
                <span>{location ? 'Change' : 'GPS'}</span>
              </>
            )}
          </button>
        </div>

        {/* Live Search Input Bar */}
        {isSearchOpen && (
          <div className="bg-slate-50 border-t border-slate-100 px-3 sm:px-4 py-2.5 animate-in slide-in-from-top-1">
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
                  placeholder="Search dishes or restaurants..."
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
                className="bg-[#FF5A1F] hover:bg-[#e04f1a] text-white px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
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
      {/* 2. HERO SECTION (RESPONSIVE SEAMLESS FOOD COMPOSITION)                  */}
      {/* ======================================================================= */}
      <section id="home" className="relative w-full overflow-hidden bg-[#FAF6F0]">
        
        {/* Soft Organic Background Glow (Top Left) */}
        <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-amber-100/60 via-orange-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-orange-50/50 rounded-full blur-3xl pointer-events-none" />

        {/* Food Scene - Ambient Seamless Background on Mobile, Split Right on Desktop */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[58%] xl:w-[54%] h-full pointer-events-none select-none z-0">
          <img
            src="/images/food/biryani-hero-platter.jpg"
            alt="Delicious Chicken Dum Biryani Platter with raita and sides"
            className="w-full h-full object-cover object-[75%_25%] sm:object-[center_center] lg:object-[left_center] opacity-40 sm:opacity-75 lg:opacity-100"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.9) 35%, black 55%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskComposite: 'destination-in',
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.9) 35%, black 55%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              maskComposite: 'intersect'
            }}
            loading="eager"
          />
          
          {/* Multi-layered Feathering & Seamless Atmosphere Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F0]/80 via-transparent to-[#FAF6F0] lg:hidden pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-full sm:w-60 lg:w-72 bg-gradient-to-r from-[#FAF6F0] via-[#FAF6F0]/90 lg:via-[#FAF6F0]/80 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-16 sm:h-24 bg-gradient-to-b from-[#FAF6F0] via-[#FAF6F0]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-[#FAF6F0] via-[#FAF6F0]/70 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#FAF6F0]/40 to-transparent pointer-events-none" />

          {/* Handwritten "Hot & Fresh Always!" Callout with Arrow */}
          <div className="absolute top-3 right-3 sm:top-8 sm:right-10 z-20 flex flex-col items-end pointer-events-none select-none bg-white/75 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl border border-amber-900/10 shadow-xs">
            <span className="font-serif italic font-black text-[#78350F] text-[10px] sm:text-base tracking-tight drop-shadow-xs">
              Hot &amp; Fresh<br />Always! ↝
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-6 sm:py-10 lg:py-14">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-3.5 sm:space-y-5 lg:pr-6">
              
              {/* Fresh & Tasty Tag */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] sm:text-xs font-bold">
                <span className="text-xs sm:text-sm">🌿</span>
                <span>Fresh &amp; Tasty Food</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-[52px] font-black text-slate-900 tracking-tight leading-[1.18]">
                Delicious Food<br />
                Delivered to <span className="text-[#FF5A1F]">Your Door</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-base text-slate-600 font-medium max-w-lg leading-relaxed">
                Explore your favourite restaurants, order online and get fresh, hot and delicious food delivered at your doorstep.
              </p>

              {/* Location / Search Box Card */}
              <div className="w-full max-w-lg bg-white p-1.5 sm:p-2 rounded-2xl shadow-md sm:shadow-lg shadow-slate-200/60 border border-slate-100 flex items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 px-2 sm:px-3 py-1 min-w-0">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isDetectingLocation}
                    title="Detect current location via GPS"
                    className="p-1 rounded-lg hover:bg-orange-50 text-[#FF5A1F] transition-colors cursor-pointer shrink-0"
                  >
                    <MapPin size={16} className={isDetectingLocation ? 'animate-bounce' : ''} />
                  </button>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={location ? `In ${location}...` : "Enter delivery location..."}
                    className="w-full text-xs sm:text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isDetectingLocation}
                    className="text-[10px] sm:text-[11px] font-bold text-[#FF5A1F] hover:underline whitespace-nowrap cursor-pointer shrink-0"
                  >
                    {isDetectingLocation ? '...' : 'GPS'}
                  </button>
                </div>
                <button
                  onClick={handleFindRestaurants}
                  className="bg-[#FF5A1F] hover:bg-[#e04f1a] text-white font-bold px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-md shadow-[#FF5A1F]/30 text-xs sm:text-sm shrink-0 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="sm:hidden">Search</span>
                  <span className="hidden sm:inline">Find Restaurants</span>
                </button>
              </div>

              {/* Trust Highlights (3 Horizontal Pills) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-lg pt-1">
                
                {/* Fast Delivery */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl border border-slate-100 shadow-xs min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center shrink-0">
                    <Clock size={15} />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight truncate">Fast Delivery</span>
                    <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium truncate">In time delivery</span>
                  </div>
                </div>

                {/* Safe & Secure */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl border border-slate-100 shadow-xs min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={15} />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight truncate">Safe &amp; Secure</span>
                    <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium truncate">Secure payments</span>
                  </div>
                </div>

                {/* Great Offers */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl border border-slate-100 shadow-xs min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Tag size={15} />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight truncate">Great Offers</span>
                    <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium truncate">Save more</span>
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
      <section id="featured-restaurants" className="py-4 sm:py-6 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex items-end justify-between mb-5 sm:mb-6">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
                  Featured Restaurants
                </h2>
                {location && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#FF5A1F] text-[11px] font-bold">
                    <MapPin size={11} /> {location}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5">
                {location ? `Showing ${displayedRestaurants.length} verified restaurants with ${matchingOutletsCount || displayedRestaurants.length} active outlets delivering to ${location.split(',')[0]}` : 'Showing all verified partner outlets nationwide'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {location && (
                <button
                  onClick={() => {
                    setLocation('');
                    localStorage.removeItem('userLocation');
                    toast('Showing all restaurants', { icon: '🍽️' });
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Clear location
                </button>
              )}
              <Link
                to="/menu"
                className="text-xs sm:text-sm font-bold text-[#FF5A1F] hover:underline flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Loading Skeleton, Error State, Empty State, or 4 Cards Grid */}
          {loadingData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden">
                  <div className="aspect-[16/9] w-full bg-slate-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError && displayedRestaurants.length === 0 ? (
            <div className="bg-orange-50/50 rounded-2xl border border-orange-200/60 p-8 sm:p-10 text-center max-w-xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center mx-auto">
                <UtensilsCrossed size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Connecting to FoodNest</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                {fetchError}
              </p>
              <button
                onClick={() => setFetchTrigger((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5A1F] hover:bg-[#e04f1a] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Retry Connection</span>
              </button>
            </div>
          ) : displayedRestaurants.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center mx-auto">
                <MapPin size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">No restaurants currently detected in "{location}"</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn't find active restaurants registered in this exact area yet. You can explore all our partner outlets or search another city.
              </p>
              <button
                onClick={() => {
                  setLocation('');
                  localStorage.removeItem('userLocation');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5A1F] hover:bg-[#e04f1a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Explore All Outlets</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {isLocationFallback && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-orange-50/80 border border-orange-200/80 rounded-xl px-4 py-2.5 text-left">
                  <p className="text-xs font-semibold text-slate-700">
                    No exact outlets registered in <span className="font-bold text-[#FF5A1F]">{location.split(',')[0]}</span> yet — showing all <span className="font-bold">{displayedRestaurants.length}</span> verified FoodNest partner restaurants.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLocation('');
                      localStorage.removeItem('userLocation');
                    }}
                    className="text-xs font-bold text-[#FF5A1F] hover:underline self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    Show All Cities
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {displayedRestaurants.map((rest, index) => {
                const outletCount = (rest.branches && rest.branches.length > 0) ? rest.branches.length : 1;
                const primaryBranch = rest.branches?.[0];
                const outletAddress = primaryBranch?.location?.address && primaryBranch.location.address !== 'Primary Location'
                  ? primaryBranch.location.address
                  : (rest.address && rest.address !== 'Primary Location' ? rest.address : (rest.city ? `${rest.city}, India` : 'Verified Outlet'));

                return (
                  <div
                    key={rest._id}
                    onClick={() => navigate(`/restaurant/${rest._id}`)}
                    className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left"
                  >
                    {/* 16:9 Cover Image or Clean Store Placeholder (Only uploaded images shown) */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      {rest.image ? (
                        <img
                          src={rest.image}
                          alt={rest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50/40 text-slate-400 group-hover:text-[#FF5A1F] transition-colors ${
                          rest.image ? 'hidden' : 'flex'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-[#FF5A1F]">
                          <UtensilsCrossed size={18} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 mt-1.5">{rest.name}</span>
                      </div>
                      {rest.badge && (
                        <div className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${rest.badgeColor}`}>
                          {rest.badge}
                        </div>
                      )}
                      {rest.image && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Sparkles size={10} className="text-amber-300" />
                          <span>Showcase</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3 space-y-1.5">
                      {/* Rating & Delivery Time */}
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                        <div className="flex items-center gap-1 text-slate-800 font-bold">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{rest.rating || '4.5'}</span>
                        </div>
                        <span className="text-slate-300 mx-1">•</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock size={11} className="text-slate-400" />
                          <span className="text-[11px] font-medium">{rest.deliveryTime || '25-35 min'}</span>
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-[#FF5A1F] transition-colors line-clamp-1">
                        {rest.name}
                      </h3>

                      {/* Cuisines & Location pill */}
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <p className="line-clamp-1 text-[12px]">{rest.cuisines || 'Multi-Cuisine • Pure Veg & Non-Veg'}</p>
                        {rest.city && (
                          <span className="text-[10px] text-slate-600 bg-slate-100 font-semibold px-1.5 py-0.5 rounded shrink-0 ml-1">
                            {rest.city}
                          </span>
                        )}
                      </div>

                      {/* Outlet Location & Outlets Count */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 min-w-0 pr-1 text-slate-600 font-medium truncate">
                          <MapPin size={12} className="text-[#FF5A1F] shrink-0" />
                          <span className="truncate">{outletAddress}</span>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-[#FF5A1F] border border-orange-200/60">
                          {outletCount > 1 ? `${outletCount} Outlets` : 'Main Outlet'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

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

          {/* 8 Compact Category Tiles (Horizontal scroll on mobile, grid on desktop) */}
          <div className="flex sm:grid sm:grid-cols-8 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 gap-3 sm:gap-3.5 no-scrollbar scroll-smooth">
            {CUISINES_LIST.map((c) => {
              const isActive = selectedCuisine === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCuisine(c.id)}
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center group shrink-0 min-w-[76px] sm:min-w-0 touch-manipulation active:scale-95 ${
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

          {/* Loading Skeleton or Responsive Grid or Empty State */}
          {loadingData ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2.5">
                  <div className="aspect-square rounded-lg bg-slate-200 w-full" />
                  <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayedDishes.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 sm:p-10 text-center max-w-md mx-auto space-y-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center mx-auto">
                <UtensilsCrossed size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No dishes available right now</h3>
              <p className="text-xs text-slate-500">
                Menu items will appear here as soon as registered restaurants publish their live menus.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {displayedDishes.slice(0, 5).map((dish, index) => {
                const isFav = wishlist?.some(item => (item._id || item.id) === (dish._id || dish.id));

                return (
                  <div
                    key={dish._id}
                    onClick={() => setSelectedDish(dish)}
                    className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between text-left cursor-pointer"
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <div>
                      {/* Square Image with Green Discount Badge & Wishlist Heart */}
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-50 mb-2.5 flex items-center justify-center">
                        {dish.image ? (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                            className="w-full h-full object-cover hover:scale-103 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50/50 text-[#FF5A1F]">
                            <UtensilsCrossed size={28} className="opacity-40" />
                            <span className="text-[10px] font-bold text-slate-400 mt-1">{dish.category || 'Specialty'}</span>
                          </div>
                        )}
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
                        {dish.restaurantName && (
                          <p className="text-[10px] font-semibold text-[#FF5A1F] line-clamp-1 flex items-center gap-1">
                            <span>By</span>
                            <span className="font-bold underline decoration-dotted">{dish.restaurantName}</span>
                          </p>
                        )}
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

                    {/* Add to Cart Button (opens dish description before adding) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDish(dish);
                      }}
                      className="w-full mt-3 bg-[#FF5A1F] hover:bg-[#e04f1a] active:scale-95 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-all shadow-xs cursor-pointer touch-manipulation flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag size={13} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>


      {/* ======================================================================= */}
      {/* 6. PROMOTIONAL BANNER (DYNAMIC OFFER / VOUCHER)                          */}
      {/* ======================================================================= */}
      <section id="offers" className="py-2.5 sm:py-5 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FFF5ED] via-[#FFF9F3] to-[#FFF5ED] border border-orange-200/60 p-4 sm:p-8 lg:p-10 shadow-xs overflow-hidden">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center relative z-10">
              
              {/* Left Column: Heading & Coupon */}
              <div className="lg:col-span-5 text-center lg:text-left flex flex-col items-center lg:items-start space-y-2 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white border border-orange-200 text-orange-700 text-[11px] sm:text-xs font-bold shadow-xs">
                  <span>🌿</span>
                  <span>Special Offer</span>
                </div>

                <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {activeOffer ? (
                    activeOffer.type === 'Percentage' ? `Flat ${activeOffer.discountValue}% OFF` :
                    activeOffer.type === 'Fixed Amount' ? `Flat ₹${activeOffer.discountValue} OFF` :
                    'Free Express Delivery'
                  ) : (
                    'Special Partner Offers'
                  )}<br />
                  <span className="text-slate-500 font-semibold text-base sm:text-xl lg:text-2xl">
                    {activeOffer?.description || (activeOffer?.minSpend > 0 ? `on orders above ₹${activeOffer.minSpend}` : 'available on your next order')}
                  </span>
                </h3>

                {/* Coupon Code Pill */}
                {activeOffer?.code && (
                  <div className="pt-0.5">
                    <div
                      onClick={() => handleCopyCoupon(activeOffer.code)}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-dashed border-[#FF5A1F] text-[#FF5A1F] font-mono font-bold text-xs sm:text-sm shadow-xs cursor-pointer hover:bg-orange-50/50 transition-colors group"
                      title="Click to copy coupon code"
                    >
                      <span>Use Code:</span>
                      <span className="text-slate-900 tracking-wider">{activeOffer.code}</span>
                      <Copy size={13} className="text-[#FF5A1F] group-hover:scale-110 transition-transform" />
                      {copiedCoupon && <span className="text-[10px] text-emerald-600 font-bold ml-1">Copied!</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Center Column: Promo Badge Visual */}
              <div className="lg:col-span-4 flex items-center justify-center py-1 sm:py-2 lg:py-0">
                <div className="relative w-28 h-28 sm:w-40 sm:h-40 lg:w-52 lg:h-52 rounded-full overflow-hidden shadow-lg sm:shadow-xl border-3 sm:border-4 border-white shrink-0 bg-gradient-to-tr from-[#FF5A1F] to-[#FF8A00] flex flex-col items-center justify-center text-white p-4 text-center">
                  <Sparkles size={36} className="text-amber-200 animate-pulse mb-1" />
                  <span className="text-xl sm:text-2xl font-black tracking-tight">50% OFF</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-widest mt-0.5">Special Treat</span>
                </div>
              </div>

              {/* Right Column: 3 Perks in a balanced responsive grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-4 w-full">
                
                {/* Free Delivery */}
                <div className="flex items-center gap-2.5 sm:gap-3 bg-white/80 lg:bg-transparent p-2 sm:p-2.5 lg:p-0 rounded-xl sm:rounded-2xl lg:rounded-none border border-orange-100/60 lg:border-none shadow-xs lg:shadow-none text-left">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Truck size={15} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">Free Delivery</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">on orders above ₹199</span>
                  </div>
                </div>

                {/* Exclusive Deals */}
                <div className="flex items-center gap-2.5 sm:gap-3 bg-white/80 lg:bg-transparent p-2 sm:p-2.5 lg:p-0 rounded-xl sm:rounded-2xl lg:rounded-none border border-orange-100/60 lg:border-none shadow-xs lg:shadow-none text-left">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles size={15} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">Exclusive Deals</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">only on our app</span>
                  </div>
                </div>

                {/* Easy Payments */}
                <div className="flex items-center gap-2.5 sm:gap-3 bg-white/80 lg:bg-transparent p-2 sm:p-2.5 lg:p-0 rounded-xl sm:rounded-2xl lg:rounded-none border border-orange-100/60 lg:border-none shadow-xs lg:shadow-none text-left">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CreditCard size={15} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">Easy Payments</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">UPI, Cards, Wallets</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>


      {/* ======================================================================= */}
      {/* 7. HOW IT WORKS (4 STEPS BALANCED 2x2 ON MOBILE, 4-COL ON DESKTOP)      */}
      {/* ======================================================================= */}
      <section id="how-it-works" className="py-4 sm:py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5">
              Get your favourite food in just a few steps
            </p>
          </div>

          {/* 4 Steps: 2x2 Grid on Mobile, 4 Columns on Large Screens */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Step 1: Choose Restaurant */}
            <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-orange-50/30 sm:bg-transparent border border-orange-100/50 sm:border-none space-y-2.5 sm:space-y-3">
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-50 border border-orange-200 text-[#FF5A1F] flex items-center justify-center shadow-xs">
                  <Search size={20} className="sm:hidden" />
                  <Search size={22} className="hidden sm:block" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  1
                </div>
              </div>
              <h4 className="text-xs sm:text-base font-bold text-slate-900">Choose Restaurant</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 sm:text-slate-400 font-medium max-w-[200px] leading-relaxed">
                Browse restaurants near you.
              </p>
            </div>

            {/* Step 2: Select Food */}
            <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-orange-50/30 sm:bg-transparent border border-orange-100/50 sm:border-none space-y-2.5 sm:space-y-3">
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-50 border border-orange-200 text-[#FF5A1F] flex items-center justify-center shadow-xs">
                  <UtensilsCrossed size={20} className="sm:hidden" />
                  <UtensilsCrossed size={22} className="hidden sm:block" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  2
                </div>
              </div>
              <h4 className="text-xs sm:text-base font-bold text-slate-900">Select Food</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 sm:text-slate-400 font-medium max-w-[200px] leading-relaxed">
                Add dishes to your cart.
              </p>
            </div>

            {/* Step 3: Make Payment */}
            <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-orange-50/30 sm:bg-transparent border border-orange-100/50 sm:border-none space-y-2.5 sm:space-y-3">
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-50 border border-orange-200 text-[#FF5A1F] flex items-center justify-center shadow-xs">
                  <CreditCard size={20} className="sm:hidden" />
                  <CreditCard size={22} className="hidden sm:block" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  3
                </div>
              </div>
              <h4 className="text-xs sm:text-base font-bold text-slate-900">Make Payment</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 sm:text-slate-400 font-medium max-w-[200px] leading-relaxed">
                Quick &amp; secure checkout.
              </p>
            </div>

            {/* Step 4: Enjoy Food */}
            <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-emerald-50/30 sm:bg-transparent border border-emerald-100/50 sm:border-none space-y-2.5 sm:space-y-3">
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-50 border border-emerald-200 text-[#10B981] flex items-center justify-center shadow-xs">
                  <Truck size={20} className="sm:hidden" />
                  <Truck size={22} className="hidden sm:block" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#10B981] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  4
                </div>
              </div>
              <h4 className="text-xs sm:text-base font-bold text-slate-900">Enjoy Food</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 sm:text-slate-400 font-medium max-w-[200px] leading-relaxed">
                Delivered right to your door.
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

          {/* Review Cards (Shows 3 at a time or slides dynamically, or empty state) */}
          {customerReviews.length === 0 ? (
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-dashed border-slate-200 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF5A1F] flex items-center justify-center mx-auto">
                <Star size={20} className="fill-[#FF5A1F]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No customer reviews yet</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Be the first to share your dining experience! Leave your feedback directly from your customer dashboard.
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5A1F] hover:bg-[#e04f1a] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Share Your Review
              </Link>
            </div>
          ) : (
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
          )}

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

      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        currentLocation={location}
        onSelectLocation={(loc) => setLocation(loc)}
        restaurants={restaurants}
      />

      {/* Location Permission & GPS Services Alert / Retry Modal */}
      {locationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A1F] shadow-inner">
              <MapPin size={32} className="animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                {locationModal.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {locationModal.message}
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLocationModal(prev => ({ ...prev, isOpen: false }));
                  handleGetLocation();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#FF5A1F] hover:bg-[#e04f1a] text-white font-bold text-sm shadow-md shadow-[#FF5A1F]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Try Again</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setLocationModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close & Enter Manually
              </button>
            </div>
          </div>
        </div>
      )}

      <DishDetailModal
        dish={selectedDish}
        isOpen={Boolean(selectedDish)}
        onClose={() => setSelectedDish(null)}
        onAddToCart={(d, qty) => handleAddToCart(d, qty)}
        isWishlisted={Boolean(selectedDish && wishlist?.some(item => (item._id || item.id) === (selectedDish._id || selectedDish.id)))}
        onToggleWishlist={(d) => {
          const isFavNow = wishlist?.some(item => (item._id || item.id) === (d._id || d.id));
          toggleWishlist(d);
          toast.success(isFavNow ? 'Removed from wishlist' : 'Added to wishlist!');
        }}
      />

    </div>
  );
}
