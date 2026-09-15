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

    // Initialize Map
    useEffect(() => {
        if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;
        const L = window.L;

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([restLoc.latitude, restLoc.longitude], 13);

        // Dark/Standard OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            className: 'map-tiles'
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

        // Custom DIV Icons
        const createStoreIcon = () => L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; width: 38px; height: 38px; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.5); border: 2px solid #0f172a;">
                        <span style="font-size: 18px;">🏪</span>
                    </div>
                    <span style="font-size: 9px; font-weight: 900; background: rgba(15, 23, 42, 0.95); color: #f59e0b; padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.4); margin-top: 4px; white-space: nowrap; text-transform: uppercase;">Kitchen Hub</span>
                </div>
            `,
            iconSize: [40, 56],
            iconAnchor: [20, 28]
        });

        const createCustomerIcon = () => L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: linear-gradient(135deg, #9333ea, #7e22ce); color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(147, 51, 234, 0.5); border: 2px solid #0f172a;">
                        <span style="font-size: 18px;">🏠</span>
                    </div>
                    <span style="font-size: 9px; font-weight: 900; background: rgba(15, 23, 42, 0.95); color: #c084fc; padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(192, 132, 252, 0.4); margin-top: 4px; white-space: nowrap; text-transform: uppercase;">Customer</span>
                </div>
            `,
            iconSize: [40, 56],
            iconAnchor: [20, 28]
        });

        const createRiderIcon = (name, isMoving) => L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.6); border: 2px solid #0f172a; position: relative;">
                        <span style="font-size: 22px; ${isMoving ? 'animation: bounce 1s infinite;' : ''}">🛵</span>
                    </div>
                    <span style="font-size: 9px; font-weight: 900; background: rgba(15, 23, 42, 0.95); color: #34d399; padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(52, 211, 153, 0.4); margin-top: 4px; white-space: nowrap; text-transform: uppercase;">${name || 'Rider'}</span>
                </div>
            `,
            iconSize: [48, 62],
            iconAnchor: [24, 31]
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
        // OSRM format: longitude,latitude
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

                    // Render Background Dashed Polyline
                    if (backgroundPolylineRef.current) {
                        map.removeLayer(backgroundPolylineRef.current);
                    }
                    backgroundPolylineRef.current = L.polyline(latLngs, {
                        color: '#334155',
                        weight: 6,
                        opacity: 0.8,
                        dashArray: '8, 8'
                    }).addTo(map);

                    // Render Active Emerald Polyline
                    if (polylineRef.current) {
                        map.removeLayer(polylineRef.current);
                    }
                    polylineRef.current = L.polyline(latLngs, {
                        color: '#10b981',
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
                polylineRef.current = L.polyline(fallbackLatLngs, { color: '#10b981', weight: 4, dashArray: '6,6' }).addTo(map);

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
        <div className={`relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 w-full ${className}`} style={{ height }}>
            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full z-0" />

            {/* OSRM Route HUD Card */}
            <div className="absolute top-4 left-4 z-10 bg-slate-900/95 border border-slate-800 p-3.5 rounded-2xl backdrop-blur text-left shadow-2xl flex flex-col gap-1 min-w-[150px]">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">OSRM Live Route</span>
                </div>
                <h4 className="text-base font-extrabold text-white leading-none mt-1">
                    {isDelivered ? 'Delivered 🎉' : `${routeInfo.durationMins || '--'} mins`}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {isDelivered ? '0.0 km' : `${routeInfo.distanceKm || '--'} km remaining`}
                </p>
                {deliveryPartnerLocation?.updatedAt && (
                    <span className="text-[8px] text-slate-500 font-mono mt-1">
                        Updated: {new Date(deliveryPartnerLocation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                )}
            </div>

            {/* Status Warning / Info Banner */}
            {!riderLoc && isRiderActive && (
                <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/90 border border-amber-500/30 p-2.5 rounded-xl text-center backdrop-blur shadow-xl">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        ⏳ Waiting for delivery partner GPS update...
                    </span>
                </div>
            )}

            {osrmError && (
                <div className="absolute top-4 right-4 z-10 bg-red-950/80 border border-red-500/30 px-3 py-1.5 rounded-xl text-[9px] text-red-300 font-bold backdrop-blur">
                    {osrmError}
                </div>
            )}
        </div>
    );
};

export default LiveOrderMap;
