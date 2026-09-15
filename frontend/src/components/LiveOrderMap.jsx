import { useEffect, useRef, useState } from 'react';

// Dynamic loader for Leaflet library & stylesheet
const loadLeaflet = () => {
    return new Promise((resolve) => {
        if (window.L) {
            resolve(window.L);
            return;
        }

        // Add Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        // Add Leaflet JS
        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve(window.L);
            document.head.appendChild(script);
        } else {
            const checkL = setInterval(() => {
                if (window.L) {
                    clearInterval(checkL);
                    resolve(window.L);
                }
            }, 100);
        }
    });
};

const LiveOrderMap = ({ 
    customerLocation, 
    restaurantLocation, 
    deliveryPartnerLocation, 
    orderStatus, 
    deliveryStatus,
    deliveryPartnerName = 'Rider',
    height = '360px',
    className = ''
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const polylineRef = useRef(null);
    const backgroundPolylineRef = useRef(null);

    const [routeInfo, setRouteInfo] = useState({ distanceKm: 0, durationMins: 0, status: 'loading' });
    const [leafletReady, setLeafletReady] = useState(false);
    const [osrmError, setOsrmError] = useState(null);

    // Default Fallback Coordinates (Chennai, TN)
    const DEFAULT_RESTAURANT = { latitude: 13.0475, longitude: 80.2090 };
    const DEFAULT_CUSTOMER = { latitude: 13.0827, longitude: 80.2707 };

    const restLoc = (restaurantLocation && restaurantLocation.latitude && restaurantLocation.longitude) 
        ? restaurantLocation 
        : DEFAULT_RESTAURANT;

    const custLoc = (customerLocation && customerLocation.latitude && customerLocation.longitude) 
        ? customerLocation 
        : DEFAULT_CUSTOMER;

    const riderLoc = (deliveryPartnerLocation && deliveryPartnerLocation.latitude && deliveryPartnerLocation.longitude) 
        ? deliveryPartnerLocation 
        : null;

    const isDelivered = orderStatus === 'Delivered' || orderStatus === 'Completed' || deliveryStatus === 'Delivered';
    const isRiderActive = ['Accepted', 'Picked Up', 'On the Way'].includes(deliveryStatus) || ['Out for Delivery'].includes(orderStatus);

    useEffect(() => {
        loadLeaflet().then(() => {
            setLeafletReady(true);
        });
    }, []);

    // Initialize Map with Light Theme Tiles & Clear Labels
    useEffect(() => {
        if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;
        const L = window.L;

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: true
        }).setView([restLoc.latitude, restLoc.longitude], 13);

        // 100% Free OpenStreetMap Light Tile Layer (No API key required, full place & street names)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [leafletReady]);

    // Update Markers & OSRM Route
    useEffect(() => {
        if (!leafletReady || !mapInstanceRef.current) return;
        const L = window.L;
        const map = mapInstanceRef.current;

        // Custom DIV Icons for Light Theme
        const createStoreIcon = () => L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; width: 40px; height: 40px; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4); border: 2.5px solid white;">
                        <span style="font-size: 20px;">🏪</span>
                    </div>
                    <span style="font-size: 10px; font-weight: 800; background: #ffffff; color: #b45309; padding: 2px 8px; border-radius: 8px; border: 1.5px solid #fde68a; margin-top: 4px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-transform: uppercase;">Kitchen Hub</span>
                </div>
            `,
            iconSize: [44, 60],
            iconAnchor: [22, 30]
        });

        const createCustomerIcon = () => L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4); border: 2.5px solid white;">
                        <span style="font-size: 20px;">🏠</span>
                    </div>
                    <span style="font-size: 10px; font-weight: 800; background: #ffffff; color: #6d28d9; padding: 2px 8px; border-radius: 8px; border: 1.5px solid #ddd6fe; margin-top: 4px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-transform: uppercase;">Customer</span>
                </div>
            `,
            iconSize: [44, 60],
            iconAnchor: [22, 30]
        });

        const createRiderIcon = (name, isMoving) => L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
                    <div style="filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.35)); ${isMoving ? 'animation: pulseRider 1.5s infinite ease-in-out;' : ''}">
                        <svg width="52" height="52" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Delivery Box (Back) -->
                            <rect x="6" y="20" width="14" height="14" rx="3" fill="#F97316" stroke="#FFFFFF" stroke-width="2"/>
                            <path d="M10 24H16" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>

                            <!-- Delivery Rider (Person) -->
                            <!-- Head / Helmet -->
                            <circle cx="28" cy="11" r="6" fill="#1E293B" stroke="#FFFFFF" stroke-width="1.5"/>
                            <path d="M26 11H32" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/> <!-- Helmet Visor -->
                            <!-- Body / Jacket -->
                            <path d="M22 23C22 18.5 25.5 17 29 17C32.5 17 36 18.5 36 23L34 32H24L22 23Z" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5"/>
                            <!-- Arms holding handlebar -->
                            <path d="M32 22L42 26" stroke="#10B981" stroke-width="3.5" stroke-linecap="round"/>
                            <circle cx="42" cy="26" r="2" fill="#1E293B"/> <!-- Hand -->

                            <!-- Scooter Body -->
                            <!-- Main Chassis -->
                            <path d="M14 34L26 34L35 34L45 32L50 26C51 24.5 52.5 24 54 24H56" stroke="#059669" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                            <!-- Front Shield / Body -->
                            <path d="M44 26L48 37H38L36 30Z" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5"/>
                            <!-- Seat -->
                            <path d="M18 31H34C35 31 36 32 35 33H17C16 32 17 31 18 31Z" fill="#334155"/>

                            <!-- Wheels -->
                            <!-- Back Wheel -->
                            <circle cx="16" cy="44" r="7.5" fill="#1E293B" stroke="#FFFFFF" stroke-width="2"/>
                            <circle cx="16" cy="44" r="3" fill="#94A3B8"/>
                            <!-- Front Wheel -->
                            <circle cx="46" cy="44" r="7.5" fill="#1E293B" stroke="#FFFFFF" stroke-width="2"/>
                            <circle cx="46" cy="44" r="3" fill="#94A3B8"/>
                        </svg>
                    </div>
                    <span style="font-size: 10px; font-weight: 900; background: #059669; color: #ffffff; padding: 2px 8px; border-radius: 8px; border: 1.5px solid #ffffff; margin-top: 2px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.25); text-transform: uppercase;">${name || 'Rider'}</span>
                </div>
            `,
            iconSize: [52, 68],
            iconAnchor: [26, 34]
        });

        // 1. Restaurant Marker
        if (!markersRef.current.restaurant) {
            markersRef.current.restaurant = L.marker([restLoc.latitude, restLoc.longitude], { icon: createStoreIcon() }).addTo(map);
        } else {
            markersRef.current.restaurant.setLatLng([restLoc.latitude, restLoc.longitude]);
        }

        // 2. Customer Marker
        if (!markersRef.current.customer) {
            markersRef.current.customer = L.marker([custLoc.latitude, custLoc.longitude], { icon: createCustomerIcon() }).addTo(map);
        } else {
            markersRef.current.customer.setLatLng([custLoc.latitude, custLoc.longitude]);
        }

        // 3. Rider Marker
        const currentRiderPos = riderLoc || restLoc;
        if (isRiderActive || riderLoc) {
            if (!markersRef.current.rider) {
                markersRef.current.rider = L.marker([currentRiderPos.latitude, currentRiderPos.longitude], { 
                    icon: createRiderIcon(deliveryPartnerName, isRiderActive) 
                }).addTo(map);
            } else {
                markersRef.current.rider.setLatLng([currentRiderPos.latitude, currentRiderPos.longitude]);
                markersRef.current.rider.setIcon(createRiderIcon(deliveryPartnerName, isRiderActive));
            }
        } else if (markersRef.current.rider) {
            map.removeLayer(markersRef.current.rider);
            delete markersRef.current.rider;
        }

        // 4. Fetch OSRM Road Route
        const originLngLat = riderLoc 
            ? `${riderLoc.longitude},${riderLoc.latitude}` 
            : `${restLoc.longitude},${restLoc.latitude}`;
        
        const destLngLat = `${custLoc.longitude},${custLoc.latitude}`;

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLngLat};${destLngLat}?overview=full&geometries=geojson`;

        let isMounted = true;

        fetch(osrmUrl)
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const distanceKm = Number((route.distance / 1000).toFixed(1));
                    const durationMins = Math.max(1, Math.ceil(route.duration / 60));

                    setRouteInfo({
                        distanceKm,
                        durationMins,
                        status: 'success'
                    });
                    setOsrmError(null);

                    // Convert OSRM [lng, lat] coordinates to Leaflet [lat, lng]
                    const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

                    // Render Background Polyline
                    if (backgroundPolylineRef.current) {
                        map.removeLayer(backgroundPolylineRef.current);
                    }
                    backgroundPolylineRef.current = L.polyline(latLngs, {
                        color: '#94a3b8',
                        weight: 7,
                        opacity: 0.6,
                        dashArray: '10, 10'
                    }).addTo(map);

                    // Render Active Blue/Emerald Polyline
                    if (polylineRef.current) {
                        map.removeLayer(polylineRef.current);
                    }
                    polylineRef.current = L.polyline(latLngs, {
                        color: '#2563eb',
                        weight: 6,
                        opacity: 0.9,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(map);

                    // Auto-fit Bounds
                    const boundsPoints = [
                        [restLoc.latitude, restLoc.longitude],
                        [custLoc.latitude, custLoc.longitude]
                    ];
                    if (riderLoc) {
                        boundsPoints.push([riderLoc.latitude, riderLoc.longitude]);
                    }

                    map.fitBounds(L.latLngBounds(boundsPoints), {
                        padding: [50, 50],
                        maxZoom: 16
                    });
                } else {
                    setOsrmError('Unable to fetch OSRM road route.');
                }
            })
            .catch(err => {
                if (!isMounted) return;
                console.error('OSRM Route fetch error:', err);
                setOsrmError('OSRM service unavailable. Showing direct locations.');
                
                // Fallback straight polyline
                const fallbackLatLngs = [
                    [currentRiderPos.latitude, currentRiderPos.longitude],
                    [custLoc.latitude, custLoc.longitude]
                ];
                if (polylineRef.current) map.removeLayer(polylineRef.current);
                polylineRef.current = L.polyline(fallbackLatLngs, { color: '#2563eb', weight: 5, dashArray: '6,6' }).addTo(map);

                const boundsPoints = [
                    [restLoc.latitude, restLoc.longitude],
                    [custLoc.latitude, custLoc.longitude]
                ];
                if (riderLoc) boundsPoints.push([riderLoc.latitude, riderLoc.longitude]);
                map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40] });
            });

        return () => {
            isMounted = false;
        };
    }, [leafletReady, restLoc.latitude, restLoc.longitude, custLoc.latitude, custLoc.longitude, riderLoc?.latitude, riderLoc?.longitude, isRiderActive, deliveryPartnerName]);

    return (
        <div className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white w-full ${className}`} style={{ height }}>
            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full z-0" />

            {/* Light Theme OSRM Route HUD Card */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 border border-slate-200 p-3.5 rounded-2xl backdrop-blur text-left shadow-xl flex flex-col gap-1 min-w-[160px]">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">OSRM Road Route</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 leading-none mt-1">
                    {isDelivered ? 'Arrived 🎉' : `${routeInfo.durationMins || '--'} mins`}
                </h4>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                    {isDelivered ? '0.0 km' : `${routeInfo.distanceKm || '--'} km remaining`}
                </p>
                {deliveryPartnerLocation?.updatedAt && (
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Updated: {new Date(deliveryPartnerLocation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                )}
            </div>

            {/* Status Warning / Info Banner */}
            {!riderLoc && isRiderActive && (
                <div className="absolute bottom-4 left-4 right-4 z-10 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center shadow-lg">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                        ⏳ Waiting for delivery partner GPS update...
                    </span>
                </div>
            )}

            {osrmError && (
                <div className="absolute top-4 right-4 z-10 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-[9px] text-red-700 font-bold shadow-md">
                    {osrmError}
                </div>
            )}
        </div>
    );
};

export default LiveOrderMap;
