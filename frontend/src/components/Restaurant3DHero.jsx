import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
    QrCode, ChefHat, ShoppingBag, Truck, Smartphone, CheckCircle, 
    Sparkles, ArrowRight, Activity, Clock, Zap, Layers 
} from 'lucide-react';

const Restaurant3DHero = ({ isBackground = false, className = "" }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    
    // Workflow stage state for overlay sync: 'new' | 'preparing' | 'ready' | 'delivery'
    const [orderStage, setOrderStage] = useState('new');
    const [prepTimer, setPrepTimer] = useState(12);
    const [hasWebGLError, setHasWebGLError] = useState(false);

    useEffect(() => {
        // Stage cycling timer for UI synchronization
        const stageInterval = setInterval(() => {
            setOrderStage(prev => {
                if (prev === 'new') return 'preparing';
                if (prev === 'preparing') return 'ready';
                if (prev === 'ready') return 'delivery';
                return 'new';
            });
        }, 4000);

        const timerInterval = setInterval(() => {
            setPrepTimer(prev => (prev > 0 ? prev - 1 : 15));
        }, 1000);

        return () => {
            clearInterval(stageInterval);
            clearInterval(timerInterval);
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const container = containerRef.current;
        let width = container.clientWidth;
        let height = container.clientHeight;

        // 1. Scene Setup
        const scene = new THREE.Scene();
        
        // 2. Camera Setup (Isometric Angle)
        const aspect = width / height;
        const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 1000);
        camera.position.set(14, 13, 16);
        camera.lookAt(0, 0, 0);

        // 3. Renderer Setup with WebGL Context Safety Check
        let renderer;
        try {
            const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl') || canvasRef.current.getContext('experimental-webgl');
            if (!gl) {
                console.warn("WebGL Context unavailable");
                setHasWebGLError(true);
                return;
            }
            renderer = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                context: gl,
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } catch (err) {
            console.warn("WebGL initialization error caught safely:", err);
            setHasWebGLError(true);
            return;
        }

        // 4. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
        mainLight.position.set(15, 22, 12);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.bias = -0.0001;
        scene.add(mainLight);

        const rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
        rimLight.position.set(-12, 10, -10);
        scene.add(rimLight);

        const warmLight = new THREE.PointLight(0xff7733, 2.5, 12);
        warmLight.position.set(0, 3, 0);
        scene.add(warmLight);

        const cyanLight = new THREE.PointLight(0x06b6d4, 2.0, 10);
        cyanLight.position.set(-4, 3, -4);
        scene.add(cyanLight);

        // Group Root for Parallax
        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        // 5. Materials
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.2,
            metalness: 0.1,
        });

        const platformMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.15,
            metalness: 0.05,
        });

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0xc2410c,
            roughness: 0.4,
            metalness: 0.1,
        });

        const counterTopMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.2,
            metalness: 0.8,
        });

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            transmission: 0.9,
            thickness: 0.5
        });

        const brandRedMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            roughness: 0.3,
            metalness: 0.2
        });

        const brandGreenMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            roughness: 0.3,
            metalness: 0.2
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            roughness: 0.3,
            metalness: 0.6
        });

        // 6. Base Isometric Stage Platform
        const stageGeo = new THREE.BoxGeometry(11, 0.4, 9);
        const stageMesh = new THREE.Mesh(stageGeo, platformMat);
        stageMesh.position.set(0, -0.2, 0);
        stageMesh.receiveShadow = true;
        rootGroup.add(stageMesh);

        // Base glow border
        const baseRingGeo = new THREE.BoxGeometry(11.4, 0.1, 9.4);
        const baseRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.25 });
        const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
        baseRing.position.set(0, -0.35, 0);
        rootGroup.add(baseRing);

        // 7. Dining Section (Foreground Right)
        const tableGroup = new THREE.Group();
        tableGroup.position.set(2.5, 0, 2);
        rootGroup.add(tableGroup);

        // Table Top
        const tableTopGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.15, 32);
        const tableTop = new THREE.Mesh(tableTopGeo, woodMat);
        tableTop.position.y = 1.2;
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        tableGroup.add(tableTop);

        // Table Leg
        const tableLegGeo = new THREE.CylinderGeometry(0.12, 0.25, 1.2, 16);
        const tableLeg = new THREE.Mesh(tableLegGeo, counterTopMat);
        tableLeg.position.y = 0.6;
        tableLeg.castShadow = true;
        tableGroup.add(tableLeg);

        // Table Base
        const tableBaseGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.08, 32);
        const tableBase = new THREE.Mesh(tableBaseGeo, counterTopMat);
        tableBase.position.y = 0.04;
        tableBase.castShadow = true;
        tableGroup.add(tableBase);

        // Plates & Gourmet Burger on Table
        const plateGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.05, 32);
        const plateMesh = new THREE.Mesh(plateGeo, platformMat);
        plateMesh.position.set(0.3, 1.3, 0.2);
        plateMesh.castShadow = true;
        tableGroup.add(plateMesh);

        // Burger Bun Bottom
        const bunBottomGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16);
        const bunMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
        const bunBottom = new THREE.Mesh(bunBottomGeo, bunMat);
        bunBottom.position.set(0.3, 1.36, 0.2);
        tableGroup.add(bunBottom);

        // Patty
        const pattyGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16);
        const pattyMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
        const patty = new THREE.Mesh(pattyGeo, pattyMat);
        patty.position.set(0.3, 1.42, 0.2);
        tableGroup.add(patty);

        // Cheese
        const cheeseGeo = new THREE.BoxGeometry(0.28, 0.02, 0.28);
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
        const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
        cheese.position.set(0.3, 1.46, 0.2);
        cheese.rotation.y = Math.PI / 4;
        tableGroup.add(cheese);

        // Bun Top
        const bunTopGeo = new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const bunTop = new THREE.Mesh(bunTopGeo, bunMat);
        bunTop.position.set(0.3, 1.47, 0.2);
        tableGroup.add(bunTop);

        // QR Standee on Table
        const qrStandGroup = new THREE.Group();
        qrStandGroup.position.set(-0.6, 1.28, -0.4);
        tableGroup.add(qrStandGroup);

        const qrBaseGeo = new THREE.BoxGeometry(0.3, 0.06, 0.2);
        const qrBase = new THREE.Mesh(qrBaseGeo, counterTopMat);
        qrStandGroup.add(qrBase);

        const qrCardGeo = new THREE.BoxGeometry(0.24, 0.36, 0.02);
        const qrCardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        const qrCard = new THREE.Mesh(qrCardGeo, qrCardMat);
        qrCard.position.set(0, 0.2, 0);
        qrCard.rotation.x = -0.15;
        qrStandGroup.add(qrCard);

        // QR Pulse Ring
        const ringGeo = new THREE.RingGeometry(0.12, 0.16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const qrRing = new THREE.Mesh(ringGeo, ringMat);
        qrRing.position.set(0, 0.21, 0.015);
        qrRing.rotation.x = -0.15;
        qrStandGroup.add(qrRing);

        // 8. Smartphone in Foreground
        const phoneGroup = new THREE.Group();
        phoneGroup.position.set(3.8, 2.4, 3.5);
        phoneGroup.rotation.set(-0.2, -0.4, 0.1);
        rootGroup.add(phoneGroup);

        const phoneBodyGeo = new THREE.BoxGeometry(1.1, 2.2, 0.1);
        const phoneBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
        const phoneBody = new THREE.Mesh(phoneBodyGeo, phoneBodyMat);
        phoneBody.castShadow = true;
        phoneGroup.add(phoneBody);

        const phoneScreenGeo = new THREE.PlaneGeometry(1.02, 2.1);
        const phoneScreenMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const phoneScreen = new THREE.Mesh(phoneScreenGeo, phoneScreenMat);
        phoneScreen.position.z = 0.055;
        phoneGroup.add(phoneScreen);

        // Menu UI elements on phone screen
        const menuHeaderGeo = new THREE.PlaneGeometry(0.9, 0.3);
        const menuHeaderMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const menuHeader = new THREE.Mesh(menuHeaderGeo, menuHeaderMat);
        menuHeader.position.set(0, 0.8, 0.06);
        phoneGroup.add(menuHeader);

        for (let i = 0; i < 3; i++) {
            const itemBarGeo = new THREE.PlaneGeometry(0.86, 0.28);
            const itemBarMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
            const itemBar = new THREE.Mesh(itemBarGeo, itemBarMat);
            itemBar.position.set(0, 0.35 - i * 0.45, 0.06);
            phoneGroup.add(itemBar);
        }

        // 9. Kitchen Display Section (Back Left)
        const kitchenGroup = new THREE.Group();
        kitchenGroup.position.set(-3.2, 0, -2);
        rootGroup.add(kitchenGroup);

        // Kitchen Counter
        const kitchenCounterGeo = new THREE.BoxGeometry(4.2, 1.3, 2.2);
        const kitchenCounter = new THREE.Mesh(kitchenCounterGeo, counterTopMat);
        kitchenCounter.position.y = 0.65;
        kitchenCounter.castShadow = true;
        kitchenCounter.receiveShadow = true;
        kitchenGroup.add(kitchenCounter);

        // Stainless Steel Counter Top Surface
        const steelTopGeo = new THREE.BoxGeometry(4.3, 0.08, 2.3);
        const steelTopMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const steelTop = new THREE.Mesh(steelTopGeo, steelTopMat);
        steelTop.position.y = 1.34;
        kitchenGroup.add(steelTop);

        // Kitchen KDS Screen (Pillar Mounted)
        const kdsPillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2);
        const kdsPillar = new THREE.Mesh(kdsPillarGeo, counterTopMat);
        kdsPillar.position.set(-1.2, 1.9, -0.6);
        kitchenGroup.add(kdsPillar);

        const kdsMonitorGeo = new THREE.BoxGeometry(1.6, 1.0, 0.08);
        const kdsMonitorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
        const kdsMonitor = new THREE.Mesh(kdsMonitorGeo, kdsMonitorMat);
        kdsMonitor.position.set(-1.2, 2.5, -0.6);
        kitchenGroup.add(kdsMonitor);

        // Live KDS Status Light
        const kdsLightGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const kdsLightMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const kdsLight = new THREE.Mesh(kdsLightGeo, kdsLightMat);
        kdsLight.position.set(-1.2, 3.1, -0.6);
        kitchenGroup.add(kdsLight);

        // Stylized Chef Hat Model
        const chefGroup = new THREE.Group();
        chefGroup.position.set(0.8, 1.38, 0);
        kitchenGroup.add(chefGroup);

        const chefHatBaseGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 24);
        const chefHatBase = new THREE.Mesh(chefHatBaseGeo, platformMat);
        chefHatBase.position.y = 0.12;
        chefGroup.add(chefHatBase);

        const chefHatTopGeo = new THREE.SphereGeometry(0.42, 24, 16);
        const chefHatTop = new THREE.Mesh(chefHatTopGeo, platformMat);
        chefHatTop.position.y = 0.45;
        chefHatTop.scale.set(1, 0.7, 1);
        chefGroup.add(chefHatTop);

        // 10. Delivery Station (Back Right)
        const deliveryGroup = new THREE.Group();
        deliveryGroup.position.set(2.8, 0, -2.5);
        rootGroup.add(deliveryGroup);

        // Delivery Bag / Package Model
        const bagGeo = new THREE.BoxGeometry(1.1, 1.2, 0.8);
        const bagMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 });
        const bagMesh = new THREE.Mesh(bagGeo, bagMat);
        bagMesh.position.y = 0.6;
        bagMesh.castShadow = true;
        deliveryGroup.add(bagMesh);

        // Bag Handles
        const handleGeo = new THREE.TorusGeometry(0.2, 0.03, 12, 24, Math.PI);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.5 });
        const handle1 = new THREE.Mesh(handleGeo, handleMat);
        handle1.position.set(0, 1.2, 0.2);
        deliveryGroup.add(handle1);

        const handle2 = new THREE.Mesh(handleGeo, handleMat);
        handle2.position.set(0, 1.2, -0.2);
        deliveryGroup.add(handle2);

        // 11. Floating Order Packet Particle Model
        const orderPacketGeo = new THREE.BoxGeometry(0.6, 0.35, 0.08);
        const orderPacketMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.6,
            roughness: 0.2
        });
        const orderPacket = new THREE.Mesh(orderPacketGeo, orderPacketMat);
        orderPacket.position.set(2.5, 2.5, 2);
        rootGroup.add(orderPacket);

        // 12. Dynamic Glow Connection Lines (Customer -> QR -> Kitchen -> Delivery)
        const curvePoints = [
            new THREE.Vector3(3.8, 2.2, 3.5),   // Smartphone
            new THREE.Vector3(2.5, 1.8, 2.0),   // QR Table
            new THREE.Vector3(-1.2, 2.8, -0.6), // KDS Kitchen
            new THREE.Vector3(2.8, 1.8, -2.5),  // Delivery Bag
        ];

        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.04, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.45,
            wireframe: false
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        rootGroup.add(tubeMesh);

        // Light energy pulse sphere following curve
        const pulseSphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const pulseSphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pulseSphere = new THREE.Mesh(pulseSphereGeo, pulseSphereMat);
        rootGroup.add(pulseSphere);

        // 13. Mouse / Touch Drag to Rotate & Parallax
        let rotationX = 0;
        let rotationY = 0;
        let targetRotationX = 0;
        let targetRotationY = 0;

        let isDragging = false;
        let previousPointerPosition = { x: 0, y: 0 };

        const handlePointerDown = (e) => {
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            previousPointerPosition = { x: clientX, y: clientY };
        };

        const handlePointerMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            if (isDragging) {
                const deltaX = clientX - previousPointerPosition.x;
                const deltaY = clientY - previousPointerPosition.y;

                targetRotationX += deltaX * 0.005;
                targetRotationY += deltaY * 0.005;

                // Clamp vertical rotation
                targetRotationY = Math.max(-0.4, Math.min(0.4, targetRotationY));

                previousPointerPosition = { x: clientX, y: clientY };
            } else {
                // Gentle parallax fallback when not dragging
                if (!e.touches) {
                    const rect = container.getBoundingClientRect();
                    const x = (clientX - rect.left) / width - 0.5;
                    const y = (clientY - rect.top) / height - 0.5;
                    targetRotationX = x * 0.35;
                    targetRotationY = y * 0.25;
                }
            }
        };

        const handlePointerUp = () => {
            isDragging = false;
        };

        container.addEventListener('mousedown', handlePointerDown);
        container.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);

        container.addEventListener('touchstart', handlePointerDown, { passive: true });
        container.addEventListener('touchmove', handlePointerMove, { passive: true });
        window.addEventListener('touchend', handlePointerUp);

        let animationFrameId;
        let clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            // Smooth Lerp Rotations
            rotationX += (targetRotationX - rotationX) * 0.05;
            rotationY += (targetRotationY - rotationY) * 0.05;

            rootGroup.rotation.y = rotationX;
            rootGroup.rotation.x = rotationY;

            // Gentle Floating Motions
            phoneGroup.rotation.y = -0.4 + Math.sin(elapsedTime * 1.2) * 0.08;
            phoneGroup.position.y = 2.4 + Math.sin(elapsedTime * 1.5) * 0.12;

            qrRing.scale.setScalar(1 + Math.sin(elapsedTime * 3) * 0.15);
            qrRing.material.opacity = 0.5 + Math.sin(elapsedTime * 3) * 0.3;

            chefGroup.rotation.y = Math.sin(elapsedTime * 2) * 0.1;
            kdsLight.material.color.setHex(Math.floor(elapsedTime * 2) % 2 === 0 ? 0x10b981 : 0x06b6d4);

            // Floating Order Packet Journey (Customer -> QR -> Kitchen -> Delivery)
            const packetProgress = (elapsedTime * 0.3) % 1;
            const packetPos = curve.getPointAt(packetProgress);
            orderPacket.position.copy(packetPos);
            orderPacket.rotation.y = elapsedTime * 2;
            orderPacket.rotation.z = Math.sin(elapsedTime * 3) * 0.2;

            // Light Energy Pulse
            const pulseProgress = ((elapsedTime + 0.5) * 0.3) % 1;
            pulseSphere.position.copy(curve.getPointAt(pulseProgress));

            // Delivery Bag subtle float when reached
            bagMesh.position.y = 0.6 + Math.sin(elapsedTime * 2) * 0.04;

            renderer.render(scene, camera);
        };

        animate();

        // 14. Responsive Resize
        const handleResize = () => {
            if (!container) return;
            width = container.clientWidth;
            height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            container.removeEventListener('mousedown', handlePointerDown);
            container.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', handlePointerUp);
            container.removeEventListener('touchstart', handlePointerDown);
            container.removeEventListener('touchmove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, []);

    if (isBackground) {
        return (
            <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto z-0">
                {/* Ambient Backlight Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Subtle Text Contrast Shield Layer */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-white/90 backdrop-blur-[2px] pointer-events-none z-10" />

                {/* Three.js Canvas */}
                <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing z-0" />

                {/* Floating SaaS Card 1: Live QR Stream */}
                <div className="absolute top-24 left-8 lg:left-16 z-20 bg-white/90 backdrop-blur-md border border-white/80 p-4 rounded-2xl shadow-xl max-w-xs space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-700 hidden xl:block">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Live Order Feed</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Table #04
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-xl text-red-500 shrink-0">
                            <QrCode size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-900">QR Digital Scan</h4>
                            <p className="text-[10px] text-slate-500 font-medium">1x Gourmet Truffle Burger · 1x Latte</p>
                        </div>
                    </div>
                </div>

                {/* Floating SaaS Card 2: Kitchen KDS Sync */}
                <div className="absolute bottom-16 left-8 lg:left-16 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl text-white max-w-xs space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 hidden lg:block">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-cyan-400">
                            <ChefHat size={16} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Kitchen KDS Workflow</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                            00:{prepTimer < 10 ? `0${prepTimer}` : prepTimer}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                        <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Active Order Stage</span>
                            <p className="text-xs font-black text-white capitalize">
                                {orderStage === 'new' && '📥 New Order Received'}
                                {orderStage === 'preparing' && '🍳 Chef Preparing Food'}
                                {orderStage === 'ready' && '✨ Plated & Ready'}
                                {orderStage === 'delivery' && '🛵 Out for Delivery'}
                            </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            orderStage === 'new' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            orderStage === 'preparing' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            orderStage === 'ready' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                            {orderStage}
                        </span>
                    </div>
                </div>

                {/* Floating SaaS Card 3: Auto Dispatch */}
                <div className="absolute top-24 right-8 lg:right-16 z-20 bg-white/90 backdrop-blur-md border border-white/80 p-4 rounded-2xl shadow-xl max-w-xs space-y-2 animate-in fade-in slide-in-from-right-4 duration-700 hidden xl:block">
                    <div className="flex items-center gap-2 text-rose-600">
                        <Truck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">Auto Dispatch</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Delivery Partner:</span>
                        <span className="text-emerald-600 font-black">Assigned (Alex M.)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-red-500 to-emerald-500 h-full transition-all duration-1000"
                            style={{
                                width: orderStage === 'new' ? '25%' : orderStage === 'preparing' ? '50%' : orderStage === 'ready' ? '80%' : '100%'
                            }}
                        />
                    </div>
                </div>

                {/* Interactive Scene Guide Chip */}
                <div className="absolute bottom-6 right-8 lg:right-16 z-20 bg-white/90 backdrop-blur-md border border-slate-100 px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2 text-xs font-bold text-slate-600 pointer-events-none">
                    <Sparkles size={14} className="text-amber-500 animate-spin" />
                    <span>Move mouse for 3D Parallax</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={className || "relative w-full h-[520px] md:h-[620px] rounded-[3rem] overflow-hidden bg-gradient-to-br from-slate-900/5 via-slate-50 to-red-50/20 border border-slate-100/80 shadow-2xl flex items-center justify-center"}>
            
            {/* Ambient Backlight Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Three.js Canvas */}
            <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing z-10" />

            {/* Glassmorphism SaaS UI Floating Overlay 1: Live QR Order Stream */}
            <div className="absolute top-6 left-6 z-20 bg-white/80 backdrop-blur-md border border-white/60 p-4 rounded-2xl shadow-xl max-w-xs space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-700 hidden sm:block">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Live Order Feed</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Table #04
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-xl text-red-500 shrink-0">
                        <QrCode size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-slate-900">QR Digital Scan</h4>
                        <p className="text-[10px] text-slate-500 font-medium">1x Gourmet Truffle Burger · 1x Latte</p>
                    </div>
                </div>
            </div>

            {/* Glassmorphism SaaS UI Floating Overlay 2: Dynamic KDS Kitchen Display Screen Sync */}
            <div className="absolute bottom-6 left-6 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl text-white max-w-xs space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 hidden md:block">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <ChefHat size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Kitchen KDS Workflow</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                        00:{prepTimer < 10 ? `0${prepTimer}` : prepTimer}
                    </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-semibold">Active Order Stage</span>
                        <p className="text-xs font-black text-white capitalize">
                            {orderStage === 'new' && '📥 New Order Received'}
                            {orderStage === 'preparing' && '🍳 Chef Preparing Food'}
                            {orderStage === 'ready' && '✨ Plated & Ready'}
                            {orderStage === 'delivery' && '🛵 Out for Delivery'}
                        </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        orderStage === 'new' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        orderStage === 'preparing' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        orderStage === 'ready' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                        {orderStage}
                    </span>
                </div>
            </div>

            {/* Glassmorphism SaaS UI Floating Overlay 3: Delivery Dispatch Sync */}
            <div className="absolute top-6 right-6 z-20 bg-white/80 backdrop-blur-md border border-white/60 p-4 rounded-2xl shadow-xl max-w-xs space-y-2 animate-in fade-in slide-in-from-right-4 duration-700 hidden sm:block">
                <div className="flex items-center gap-2 text-rose-600">
                    <Truck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">Auto Dispatch</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Delivery Partner:</span>
                    <span className="text-emerald-600 font-black">Assigned (Alex M.)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-red-500 to-emerald-500 h-full transition-all duration-1000"
                        style={{
                            width: orderStage === 'new' ? '25%' : orderStage === 'preparing' ? '50%' : orderStage === 'ready' ? '80%' : '100%'
                        }}
                    />
                </div>
            </div>

            {/* Interactive Scene Guide Chip */}
            <div className="absolute bottom-6 right-6 z-20 bg-white/90 backdrop-blur-md border border-slate-100 px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2 text-xs font-bold text-slate-600">
                <Sparkles size={14} className="text-amber-500 animate-spin" />
                <span>Move mouse for 3D Parallax</span>
            </div>

        </div>
    );
};

export default Restaurant3DHero;
