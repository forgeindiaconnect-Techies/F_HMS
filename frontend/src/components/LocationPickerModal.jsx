import { useState, useMemo } from 'react';
import { MapPin, Navigation, Search, X, Check, Loader2, Store, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  saveUserLocation, 
  detectUserLocation, 
  getAvailableCitiesFromRestaurants 
} from '../utils/locationHelper';

const POPULAR_CITIES = [
  'Chennai',
  'Krishnagiri',
  'Bengaluru',
  'Hosur',
  'Salem',
  'Coimbatore',
  'Madurai',
  'Hyderabad',
  'Mumbai',
  'Delhi'
];

export default function LocationPickerModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  restaurants = []
}) {
  const [searchCity, setSearchCity] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  // Dynamically extract registered cities from loaded restaurants & outlets
  const availableCities = useMemo(() => {
    return getAvailableCitiesFromRestaurants(restaurants);
  }, [restaurants]);

  if (!isOpen) return null;

  const handleDetectGPS = async () => {
    setIsDetecting(true);
    const loadingToast = toast.loading('Detecting your GPS location...');
    try {
      const res = await detectUserLocation();
      toast.dismiss(loadingToast);
      if (res.success && res.formattedLocation) {
        toast.success(`Location set to ${res.formattedLocation}!`, { icon: '📍' });
        if (onSelectLocation) onSelectLocation(res.formattedLocation);
        onClose();
      } else {
        toast.error('Could not detect location automatically. Please select your city below.', { duration: 4000 });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Location detection failed. Please select your city below.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handlePickCity = (cityName) => {
    const formatted = `${cityName}, India`;
    saveUserLocation(formatted);
    if (onSelectLocation) onSelectLocation(formatted);
    toast.success(`Location set to ${cityName}!`, { icon: '📍' });
    onClose();
  };

  const handleClearLocation = () => {
    saveUserLocation('');
    if (onSelectLocation) onSelectLocation('');
    toast('Showing outlets from all locations', { icon: '🍽️' });
    onClose();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    const clean = searchCity.trim();
    const formatted = clean.toLowerCase().includes('india') ? clean : `${clean}, India`;
    saveUserLocation(formatted);
    if (onSelectLocation) onSelectLocation(formatted);
    toast.success(`Location set to ${clean}!`, { icon: '📍' });
    onClose();
  };

  // Filter available cities by search
  const filteredAvailable = availableCities.filter(c => 
    !searchCity || c.name.toLowerCase().includes(searchCity.toLowerCase())
  );

  const filteredPopular = POPULAR_CITIES.filter(c => 
    !searchCity || c.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5A1F] flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Choose Your Location
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Find restaurants and verified outlets delivering to you
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 1. Detect Current GPS Location Action Button */}
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isDetecting}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100/80 active:scale-[0.99] text-[#FF5A1F] font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF5A1F] text-white flex items-center justify-center shrink-0 shadow-xs">
                {isDetecting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Navigation size={16} />
                )}
              </div>
              <div className="text-left">
                <p className="font-extrabold text-slate-900 leading-tight">
                  {isDetecting ? 'Detecting Your Location...' : 'Use Current Location'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Using GPS &amp; high precision network detection
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#FF5A1F] hidden sm:inline">
              Detect GPS &rarr;
            </span>
          </button>

          {/* 2. Search City Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search size={16} className="text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search city, area, or neighborhood..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#FF5A1F] focus:bg-white transition-all"
            />
            {searchCity && (
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 bg-[#FF5A1F] text-white text-xs font-bold rounded-lg hover:bg-[#e04f1a] transition-colors cursor-pointer"
              >
                Apply
              </button>
            )}
          </form>

          {/* Current Selection Status */}
          {currentLocation && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-500 font-medium">Selected:</span>
                <span className="font-bold text-slate-800 truncate">{currentLocation}</span>
              </div>
              <button
                type="button"
                onClick={handleClearLocation}
                className="text-[11px] font-bold text-[#FF5A1F] hover:underline cursor-pointer shrink-0 ml-2"
              >
                Clear / All
              </button>
            </div>
          )}

          {/* 3. Cities with Active Verified Outlets (Dynamic from Database) */}
          {availableCities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Store size={13} className="text-[#FF5A1F]" /> Active Outlet Locations
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {availableCities.length} {availableCities.length === 1 ? 'City' : 'Cities'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {filteredAvailable.map((c) => {
                  const isSelected = currentLocation && currentLocation.toLowerCase().includes(c.name.toLowerCase());
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handlePickCity(c.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#FF5A1F] bg-orange-50/70 text-[#FF5A1F] font-bold shadow-xs'
                          : 'border-slate-200/90 hover:border-orange-300 hover:bg-orange-50/30 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {c.count} {c.count === 1 ? 'Outlet' : 'Outlets'}
                        </p>
                      </div>
                      {isSelected ? (
                        <Check size={14} className="text-[#FF5A1F] shrink-0 ml-1" />
                      ) : (
                        <MapPin size={13} className="text-slate-400 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Popular Cities Quick Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Compass size={13} className="text-slate-400" /> Popular Cities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {filteredPopular.map((city) => {
                const isSelected = currentLocation && currentLocation.toLowerCase().includes(city.toLowerCase());
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handlePickCity(city)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF5A1F] text-white shadow-xs font-bold'
                        : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#FF5A1F]'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClearLocation}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            View All Outlets (Any City)
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

