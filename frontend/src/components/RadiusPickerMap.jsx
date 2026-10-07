import { useEffect, useRef, useState } from 'react';

const loadLeaflet = () => {
    return new Promise((resolve) => {
        if (window.L) {
            resolve(window.L);
            return;
        }

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

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

const RadiusPickerMap = ({
    latitude = 13.0475,
    longitude = 80.2090,
    radiusKm = 5,
    onLocationChange,
    height = '320px'
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const circleRef = useRef(null);
    const [leafletReady, setLeafletReady] = useState(false);

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
            attributionControl: true
        }).setView([latitude, longitude], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Store pin marker icon
        const storeIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 42px; height: 42px; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); border: 2.5px solid white;">
                        <span style="font-size: 22px;">🏪</span>
                    </div>
                    <span style="font-size: 10px; font-weight: 800; background: #ffffff; color: #047857; padding: 2px 8px; border-radius: 8px; border: 1.5px solid #a7f3d0; margin-top: 4px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-transform: uppercase;">Restaurant Location</span>
                </div>
            `,
            iconSize: [44, 60],
            iconAnchor: [22, 30]
        });

        const marker = L.marker([latitude, longitude], { icon: storeIcon, draggable: true }).addTo(map);
        markerRef.current = marker;

        // Radius Bounding Circle (radius in meters)
        const circle = L.circle([latitude, longitude], {
            radius: radiusKm * 1000,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '6, 6'
        }).addTo(map);
        circleRef.current = circle;

        // Click on map to set position
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            circle.setLatLng([lat, lng]);
            if (onLocationChange) {
                onLocationChange({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
            }
        });

        // Drag marker to set position
        marker.on('dragend', () => {
            const position = marker.getLatLng();
            circle.setLatLng(position);
            if (onLocationChange) {
                onLocationChange({ latitude: Number(position.lat.toFixed(6)), longitude: Number(position.lng.toFixed(6)) });
            }
        });

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [leafletReady]);

    // Update Circle radius dynamically when slider changes
    useEffect(() => {
        if (!circleRef.current) return;
        circleRef.current.setRadius(radiusKm * 1000);
        if (mapInstanceRef.current && circleRef.current) {
            mapInstanceRef.current.fitBounds(circleRef.current.getBounds(), { padding: [30, 30], maxZoom: 15 });
        }
    }, [radiusKm]);

    // Update position if props update
    useEffect(() => {
        if (!markerRef.current || !circleRef.current || !mapInstanceRef.current) return;
        const currentPos = markerRef.current.getLatLng();
        if (currentPos.lat !== latitude || currentPos.lng !== longitude) {
            markerRef.current.setLatLng([latitude, longitude]);
            circleRef.current.setLatLng([latitude, longitude]);
            mapInstanceRef.current.setView([latitude, longitude]);
        }
    }, [latitude, longitude]);

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50" style={{ height }}>
            <div ref={mapRef} className="w-full h-full z-0" />
            <div className="absolute top-3 left-3 z-10 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-xl shadow-md text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Click map or drag pin to move restaurant location</span>
            </div>
        </div>
    );
};

export default RadiusPickerMap;
