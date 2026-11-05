
const isNativePlatform = () => typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.());

// Capacitor optional
// Geolocation optional

export const LOCATION_CACHE_KEY = 'userLocation';
export const COORDS_CACHE_KEY = 'userCoordinates';
export const EVENT_LOCATION_UPDATED = 'foodnest_location_updated';

// Primary LocationIQ Key (from .env or fallback)
const LOCATIONIQ_KEY = import.meta.env.VITE_OPENSTREET_API_KEY || 'pk.49c70597e20688e023143ba6502ceb2b';

/**
 * Get current saved location from localStorage
 */
export const getSavedLocation = () => {
  try {
    return localStorage.getItem(LOCATION_CACHE_KEY) || '';
  } catch (e) {
    return '';
  }
};

/**
 * Get current saved GPS coordinates from localStorage
 */
export const getSavedCoordinates = () => {
  try {
    const raw = localStorage.getItem(COORDS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Persist location and notify all listeners
 */
export const saveUserLocation = (formattedLocation, coordinates = null) => {
  try {
    if (formattedLocation) {
      localStorage.setItem(LOCATION_CACHE_KEY, formattedLocation);
    } else {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }

    if (coordinates && coordinates.latitude && coordinates.longitude) {
      localStorage.setItem(COORDS_CACHE_KEY, JSON.stringify(coordinates));
    } else if (formattedLocation === '') {
      localStorage.removeItem(COORDS_CACHE_KEY);
    }
  } catch (e) {
    console.warn('Failed saving location to localStorage', e);
  }

  // Broadcast change across windows and dashboard components
  try {
    window.dispatchEvent(
      new CustomEvent(EVENT_LOCATION_UPDATED, {
        detail: {
          location: formattedLocation,
          coordinates
        }
      })
    );
  } catch (_) {}
};

/**
 * Helper to clean and format a city name nicely
 */
export const getCityOnly = (locationStr) => {
  if (!locationStr || typeof locationStr !== 'string') return '';
  const parts = locationStr.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  return parts[0];
};

/**
 * Convert Coordinates into City and Country using Reverse Geocoding
 * Priority 1: LocationIQ (Reverse Geocode API with OpenStreetMap data)
 * Priority 2: OpenStreetMap Nominatim
 * Priority 3: BigDataCloud client API
 */
export const reverseGeocodeCoords = async (latitude, longitude) => {
  let detectedCity = '';
  let detectedState = '';
  let detectedCountry = '';

  // 1. Primary: LocationIQ Reverse Geocoding (high precision worldwide & India)
  try {
    const liqUrl = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${latitude}&lon=${longitude}&format=json&normalizeaddress=1`;
    const res = await fetch(liqUrl, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      detectedCity = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.city_district || addr.county || addr.state_district || '';
      detectedState = addr.state || '';
      detectedCountry = addr.country || 'India';
    }
  } catch (e) {
    console.warn('[locationHelper] LocationIQ geocode error:', e);
  }

  // 2. Fallback: OpenStreetMap Nominatim Reverse Geocoding
  if (!detectedCity) {
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
      const res = await fetch(osmUrl, {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        detectedCity = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.county || addr.state_district || '';
        detectedState = addr.state || '';
        detectedCountry = addr.country || 'India';
      }
    } catch (e) {
      console.warn('[locationHelper] Nominatim geocode error:', e);
    }
  }

  // 3. Fallback: BigDataCloud client API
  if (!detectedCity) {
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const res = await fetch(bdcUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        detectedCity = data.city || data.locality || data.localityInfo?.administrative?.[3]?.name || data.localityInfo?.administrative?.[2]?.name || '';
        detectedState = data.principalSubdivision || '';
        detectedCountry = data.countryName || 'India';
      }
    } catch (e) {
      console.warn('[locationHelper] BigDataCloud geocode error:', e);
    }
  }

  // Format into "City, Country"
  let formattedLocation = '';
  if (detectedCity && detectedCountry) {
    formattedLocation = `${detectedCity}, ${detectedCountry}`;
  } else if (detectedCity) {
    formattedLocation = detectedCity;
  } else if (detectedState && detectedCountry) {
    formattedLocation = `${detectedState}, ${detectedCountry}`;
  } else if (latitude && longitude) {
    formattedLocation = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
  }

  return {
    city: detectedCity,
    state: detectedState,
    country: detectedCountry || 'India',
    formattedLocation,
    coordinates: { latitude, longitude }
  };
};

/**
 * React GPS Method:
 * 1. Asks for browser GPS permission
 * 2. Gets real latitude and longitude
 * 3. Converts coordinates into city and country using reverse geocoding
 * 4. Automatically updates localStorage and notifies React components
 */
export const requestBrowserGpsLocation = async () => {
  // If running inside Capacitor Native Mobile App (Android APK / iOS)
  if (isNativePlatform()) {
    try {
      let permStatus = { location: 'prompt' };
      if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Geolocation) {
        permStatus = await window.Capacitor.Plugins.Geolocation.checkPermissions();
      }
      if (permStatus.location !== 'granted' && permStatus.coarseLocation !== 'granted') {
        permStatus = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
      }

      if (permStatus.location === 'granted' || permStatus.coarseLocation === 'granted') {
        const nativePos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });

        if (nativePos?.coords) {
          const result = await reverseGeocodeCoords(nativePos.coords.latitude, nativePos.coords.longitude);
          if (result.formattedLocation) {
            saveUserLocation(result.formattedLocation, result.coordinates);
            return { success: true, ...result };
          }
        }
      }
    } catch (nativeErr) {
      console.warn('[locationHelper] Capacitor native GPS error:', nativeErr);
    }
  }

  // Standard Browser Geolocation
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  const pos = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds so user has time to click "Allow"
      maximumAge: 0   // Fresh real-time GPS hardware coordinates
    });
  });

  const { latitude, longitude } = pos.coords;
  const result = await reverseGeocodeCoords(latitude, longitude);

  if (result.formattedLocation) {
    saveUserLocation(result.formattedLocation, result.coordinates);
  }

  return { success: true, ...result };
};

/**
 * Backward compatibility alias
 */
export const detectUserLocation = requestBrowserGpsLocation;

/**
 * Calculate distance between two GPS points using Haversine formula (km)
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Extract all unique cities and outlet counts from the loaded restaurants and branches
 */
export const getAvailableCitiesFromRestaurants = (restaurants = []) => {
  const cityMap = new Map();

  restaurants.forEach((r) => {
    // Check main restaurant city
    if (r.city && r.city.trim()) {
      const cleanCity = r.city.trim();
      const existing = cityMap.get(cleanCity.toLowerCase()) || { name: cleanCity, count: 0 };
      existing.count += 1;
      cityMap.set(cleanCity.toLowerCase(), existing);
    }

    // Check branches
    if (Array.isArray(r.branches)) {
      r.branches.forEach((b) => {
        const bCity = b.location?.city || '';
        if (bCity && bCity.trim()) {
          const clean = bCity.trim();
          const existing = cityMap.get(clean.toLowerCase()) || { name: clean, count: 0 };
          existing.count += 1;
          cityMap.set(clean.toLowerCase(), existing);
        }
      });
    }
  });

  return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
};

/**
 * Clean location query into searchable tokens, removing generic non-locality terms
 */
export const extractLocationTokens = (locationStr) => {
  if (!locationStr || typeof locationStr !== 'string') return [];
  const lower = locationStr.toLowerCase();
  
  // Exclude country names or generic filler words
  const stopWords = new Set(['india', 'country', 'state', 'district', 'near', 'in', 'the', 'area', 'city']);
  
  return lower
    .split(/[,/\s-]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && !stopWords.has(s));
};

/**
 * Check if a restaurant or its branches match a given location query
 */
export const matchesRestaurantLocation = (restaurant, locationQuery) => {
  if (!locationQuery || !locationQuery.trim()) return true;

  const tokens = extractLocationTokens(locationQuery);
  if (tokens.length === 0) return true;

  const locLower = locationQuery.toLowerCase().trim();
  const restCity = (restaurant.city || '').toLowerCase().trim();
  const restState = (restaurant.state || '').toLowerCase().trim();
  const restAddr = (restaurant.address || '').toLowerCase().trim();
  const verifAddr = (restaurant.verificationAddress || '').toLowerCase().trim();
  const restName = (restaurant.name || '').toLowerCase().trim();

  // 1. Direct city match
  if (restCity && (locLower.includes(restCity) || restCity.includes(locLower))) {
    return true;
  }

  // 2. Token match against restaurant location fields
  for (const token of tokens) {
    if (restCity && (restCity.includes(token) || token.includes(restCity))) return true;
    if (restAddr && restAddr.includes(token)) return true;
    if (verifAddr && verifAddr.includes(token)) return true;
    if (restState && restState.includes(token)) return true;
  }

  // 3. Branch match
  if (Array.isArray(restaurant.branches)) {
    for (const b of restaurant.branches) {
      const bCity = (b.location?.city || '').toLowerCase().trim();
      const bAddr = (b.location?.address || '').toLowerCase().trim();
      const bState = (b.location?.state || '').toLowerCase().trim();
      const bName = (b.name || '').toLowerCase().trim();

      if (bCity && (locLower.includes(bCity) || bCity.includes(locLower))) return true;

      for (const token of tokens) {
        if (bCity && (bCity.includes(token) || token.includes(bCity))) return true;
        if (bAddr && bAddr.includes(token)) return true;
        if (bState && bState.includes(token)) return true;
        if (bName && bName.includes(token)) return true;
      }
    }
  }

  return false;
};

/**
 * Filter and format restaurants and their active branches/outlets for a location
 */
export const filterRestaurantsForLocation = (restaurants = [], location = '', searchQuery = '') => {
  let base = restaurants;

  // 1. Search Query filter (dishes, restaurant name, or cuisines)
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    base = base.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const cuisines = (r.cuisines || '').toLowerCase();
      const city = (r.city || '').toLowerCase();
      const address = (r.address || '').toLowerCase();
      return name.includes(q) || cuisines.includes(q) || city.includes(q) || address.includes(q);
    });
  }

  // 2. If no location filter specified, return all with branch count
  if (!location || !location.trim()) {
    return {
      filtered: base,
      isLocationFiltered: false,
      matchingOutletsCount: base.reduce((acc, r) => acc + Math.max(1, (r.branches || []).length), 0)
    };
  }

  // 3. Apply location matching
  const matched = base.filter((r) => matchesRestaurantLocation(r, location));

  // Count total matching branches/outlets
  const matchingOutletsCount = matched.reduce((acc, r) => {
    const branchesInLoc = (r.branches || []).filter(b => {
      const bLoc = `${b.location?.city || ''} ${b.location?.address || ''} ${b.name || ''}`.toLowerCase();
      const tokens = extractLocationTokens(location);
      return tokens.some(t => bLoc.includes(t)) || (r.city && location.toLowerCase().includes(r.city.toLowerCase()));
    });
    return acc + Math.max(1, branchesInLoc.length);
  }, 0);

  return {
    filtered: matched,
    isLocationFiltered: true,
    matchingOutletsCount
  };
};
