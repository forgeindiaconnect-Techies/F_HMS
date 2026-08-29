import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
    Coffee, Pizza, Utensils, GlassWater, IceCream, ChefHat, 
    Sparkles, ArrowRight, Play, Pause, Volume2, VolumeX, Eye, 
    RotateCcw, Compass, MapPin, CheckCircle2, ChevronRight, Layers, Flame, Award
} from 'lucide-react';

const Interactive3DRestaurantExperience = ({ height = "h-[85vh]", isStandalone = false }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    
    // Interactive State
    const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
    const [activeChapter, setActiveChapter] = useState(0); // 0: Arrival, 1: Journey, 2: Crafting, 3: Kitchen, 4: Service
    const [activeDish, setActiveDish] = useState('coffee'); // 'coffee' | 'pizza' | 'burger' | 'dessert' | 'drink'
    const [isOrbitMode, setIsOrbitMode] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(true);
    const [isPlayingAnimation, setIsPlayingAnimation] = useState(true);

    // Audio Context Ref for Synthesized Ambient Sound (Zero external audio file dependencies)
    const audioCtxRef = useRef(null);
    const ambientGainRef = useRef(null);

    // Three.js scene references stored in ref to maintain state across renders
    const threeRef = useRef({
        scene: null,
        camera: null,
        renderer: null,
        rootGroup: null,
        cameraTarget: new THREE.Vector3(0, 2, 0),
        cameraPosition: new THREE.Vector3(0, 8, 25),
        targetCameraPos: new THREE.Vector3(0, 8, 25),
        targetCameraLookAt: new THREE.Vector3(0, 2, 0),
        
        // Animated objects
        doorsLeft: null,
        doorsRight: null,
        signLight: null,
        chimneySmokeParticles: [],
        hangingLights: [],
        chairs: [],
        dishGroup: null,
        coffeeMug: null,
        steamParticles: [],
        coffeeBeans: [],
        pouringLiquid: null,
        pizzaGroup: null,
        pizzaToppings: [],
        pizzaSlice: null,
        burgerGroup: null,
        burgerParts: [],
        dessertGroup: null,
        dessertCream: null,
        drinkGroup: null,
        drinkBubbles: [],
        kitchenFireParticles: [],
        chefKnife: null,
        waiterModel: null,

        // User interaction
        pointerX: 0,
        pointerY: 0,
        isPointerDown: false,
        dragRotationX: 0,
        dragRotationY: 0,
    });

    // Sound Synthesizer using Web Audio API
    const toggleAudio = () => {
        if (isAudioMuted) {
            try {
                if (!audioCtxRef.current) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    const ctx = new AudioContext();
                    audioCtxRef.current = ctx;

                    // Create subtle warm ambient murmur / chime sound synthesizer
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(220, ctx.currentTime);
                    
                    // LFO for warm organic atmosphere
                    const lfo = ctx.createOscillator();
                    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
                    const lfoGain = ctx.createGain();
                    lfoGain.gain.setValueAtTime(10, ctx.currentTime);
                    lfo.connect(osc.frequency);
                    lfo.start();

                    gain.gain.setValueAtTime(0.03, ctx.currentTime);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    ambientGainRef.current = gain;
                } else if (audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
                setIsAudioMuted(false);
            } catch (e) {
                console.log("Web Audio initialization skipped", e);
            }
        } else {
            if (audioCtxRef.current) {
                audioCtxRef.current.suspend();
            }
            setIsAudioMuted(true);
        }
    };

    // Chapter Definitions
    const chapters = [
        {
            id: 0,
            title: "Grand Arrival & Entrance",
            subtitle: "The restaurant emerges with glowing neon signboards, automatic glass entry doors, and kitchen chimney smoke.",
            icon: "🏰",
            badge: "01 / STORY ENGINE"
        },
        {
            id: 1,
            title: "Customer Welcome & Dining Seating",
            subtitle: "Step into warm ambient lighting. Host greets you as chairs slide in smoothly for your table arrangement.",
            icon: "🍷",
            badge: "02 / ATMOSPHERE"
        },
        {
            id: 2,
            title: "Micro-Animation Culinary Crafting",
            subtitle: "Interactive 3D preparation of signature items: Coffee pours, pizza bakes, burgers stack, desserts swirl.",
            icon: "☕",
            badge: "03 / DISH EXPERIENCE"
        },
        {
            id: 3,
            title: "Kitchen Workflow & Flaming Stoves",
            subtitle: "Sizzling stoves, knife precision chopping, steam rising, and live order routing to KDS displays.",
            icon: "🔥",
            badge: "04 / KITCHEN ENGINE"
        },
        {
            id: 4,
            title: "Plating & Service Delivery",
            subtitle: "Waiters collect freshly prepared dishes and dispatch instant orders directly to customers.",
            icon: "✨",
            badge: "05 / EXPRESS SERVICE"
        }
    ];

    // Handle Scroll Progress Update
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current || isOrbitMode) return;
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Calculate how far container is scrolled through viewport
            const totalDistance = rect.height + windowHeight;
            const currentPosition = windowHeight - rect.top;
            let progress = Math.max(0, Math.min(1, currentPosition / totalDistance));

            setScrollProgress(progress);

            // Determine active chapter based on progress thresholds
            if (progress < 0.2) setActiveChapter(0);
            else if (progress < 0.4) setActiveChapter(1);
            else if (progress < 0.6) setActiveChapter(2);
            else if (progress < 0.8) setActiveChapter(3);
            else setActiveChapter(4);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial evaluation

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isOrbitMode]);

    // -------------------------------------------------------------
    // THREE.JS SCENE BUILD & ANIMATION LOOP
    // -------------------------------------------------------------
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const container = containerRef.current;
        let width = container.clientWidth;
        let height = container.clientHeight;

        // 1. SCENE SETUP
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x070a14);
        scene.fog = new THREE.FogExp2(0x070a14, 0.018);
        threeRef.current.scene = scene;

        // 2. CAMERA SETUP
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
        camera.position.set(0, 10, 26);
        threeRef.current.camera = camera;

        // 3. RENDERER SETUP
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        threeRef.current.renderer = renderer;

        // 4. LIGHTING SYSTEM
        const ambientLight = new THREE.AmbientLight(0xffedd5, 1.2);
        scene.add(ambientLight);

        // Key Warm Spotlight for Entrance & Table
        const spotLight = new THREE.SpotLight(0xff9900, 4.5);
        spotLight.position.set(0, 20, 12);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.8;
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        scene.add(spotLight);

        // Neon Sign Directional Light
        const signLight = new THREE.PointLight(0xff2d55, 6, 25);
        signLight.position.set(0, 7.5, 12);
        scene.add(signLight);
        threeRef.current.signLight = signLight;

        // Warm Interior Ambient Glow
        const interiorWarm = new THREE.PointLight(0xf97316, 4, 30);
        interiorWarm.position.set(0, 4, -2);
        scene.add(interiorWarm);

        // Kitchen Flame Blue/Orange Light
        const kitchenFlameLight = new THREE.PointLight(0x38bdf8, 5, 20);
        kitchenFlameLight.position.set(-10, 4, -8);
        scene.add(kitchenFlameLight);

        // 5. ROOT SCENE GROUP
        const rootGroup = new THREE.Group();
        scene.add(rootGroup);
        threeRef.current.rootGroup = rootGroup;

        // -------------------------------------------------------------
        // MATERIALS CATALOG
        // -------------------------------------------------------------
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.5 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.1, transmission: 0.9, thickness: 0.5 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.8 });
        const mahoganyMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 });
        const neonRedMat = new THREE.MeshBasicMaterial({ color: 0xff2d55 });
        const neonOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff6a00 });
        const whiteMarbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.1 });
        const stainlessSteelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.15 });

        // -------------------------------------------------------------
        // ENVIRONMENT 1: EXTERIOR BUILDING & ENTRANCE (CH 0)
        // -------------------------------------------------------------
        const buildingGroup = new THREE.Group();
        buildingGroup.position.set(0, 0, 10);
        rootGroup.add(buildingGroup);

        // Ground Pavement Base
        const pavementGeo = new THREE.BoxGeometry(32, 0.4, 30);
        const pavementMesh = new THREE.Mesh(pavementGeo, floorMat);
        pavementMesh.position.y = -0.2;
        pavementMesh.receiveShadow = true;
        buildingGroup.add(pavementMesh);

        // Main Entrance Facade Frame
        const facadeGeo = new THREE.BoxGeometry(16, 9, 0.8);
        const facadeMesh = new THREE.Mesh(facadeGeo, wallMat);
        facadeMesh.position.set(0, 4.5, 2);
        facadeMesh.castShadow = true;
        buildingGroup.add(facadeMesh);

        // Entrance Arch Archway Cutout (Glass Surround)
        const glassWallGeo = new THREE.BoxGeometry(7, 6, 0.1);
        const glassWallMesh = new THREE.Mesh(glassWallGeo, glassMat);
        glassWallMesh.position.set(0, 3, 2.05);
        buildingGroup.add(glassWallMesh);

        // Automatic Sliding Doors (Left & Right)
        const doorGeo = new THREE.BoxGeometry(1.8, 4.8, 0.15);
        
        const doorLeft = new THREE.Mesh(doorGeo, glassMat);
        doorLeft.position.set(-0.95, 2.4, 2.1);
        buildingGroup.add(doorLeft);
        threeRef.current.doorsLeft = doorLeft;

        const doorRight = new THREE.Mesh(doorGeo, glassMat);
        doorRight.position.set(0.95, 2.4, 2.1);
        buildingGroup.add(doorRight);
        threeRef.current.doorsRight = doorRight;

        // Glowing 3D Signboard ("RESTAURANTHUB GOURMET")
        const signBoardGeo = new THREE.BoxGeometry(8, 1.4, 0.4);
        const signBoardMesh = new THREE.Mesh(signBoardGeo, wallMat);
        signBoardMesh.position.set(0, 7.5, 2.4);
        buildingGroup.add(signBoardMesh);

        const neonTextBarGeo = new THREE.BoxGeometry(7.2, 0.5, 0.1);
        const neonTextBar = new THREE.Mesh(neonTextBarGeo, neonRedMat);
        neonTextBar.position.set(0, 7.5, 2.65);
        buildingGroup.add(neonTextBar);

        // Chimney Smoke Particles Generator
        const smokeGroup = new THREE.Group();
        smokeGroup.position.set(-6, 9.5, 0);
        buildingGroup.add(smokeGroup);

        const chimneyGeo = new THREE.CylinderGeometry(0.5, 0.6, 3, 16);
        const chimneyMesh = new THREE.Mesh(chimneyGeo, wallMat);
        smokeGroup.add(chimneyMesh);

        const smokeParticles = [];
        for (let i = 0; i < 25; i++) {
            const pGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.25, 8, 8);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.3 });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.set(
                (Math.random() - 0.5) * 0.4,
                1.5 + i * 0.3,
                (Math.random() - 0.5) * 0.4
            );
            smokeGroup.add(pMesh);
            smokeParticles.push({ mesh: pMesh, speedY: 0.02 + Math.random() * 0.02, initialY: 1.5 });
        }
        threeRef.current.chimneySmokeParticles = smokeParticles;

        // Decorative Outdoor Trees (Left & Right)
        for (let side of [-6.5, 6.5]) {
            const potGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.2, 16);
            const potMesh = new THREE.Mesh(potGeo, goldMat);
            potMesh.position.set(side, 0.6, 4);
            buildingGroup.add(potMesh);

            const foliageGeo = new THREE.SphereGeometry(1.2, 16, 16);
            const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
            const foliageMesh = new THREE.Mesh(foliageGeo, foliageMat);
            foliageMesh.position.set(side, 2.2, 4);
            buildingGroup.add(foliageMesh);
        }

        // -------------------------------------------------------------
        // ENVIRONMENT 2: DINING ROOM & SEATING JOURNEY (CH 1)
        // -------------------------------------------------------------
        const diningGroup = new THREE.Group();
        diningGroup.position.set(0, 0, 0);
        rootGroup.add(diningGroup);

        // Host Podium
        const podiumGeo = new THREE.CylinderGeometry(0.8, 0.9, 1.3, 24);
        const podiumMesh = new THREE.Mesh(podiumGeo, mahoganyMat);
        podiumMesh.position.set(-2.5, 0.65, 4);
        diningGroup.add(podiumMesh);

        // Main VIP Dining Table
        const mainTableGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.18, 32);
        const mainTableMesh = new THREE.Mesh(mainTableGeo, whiteMarbleMat);
        mainTableMesh.position.set(0, 1.4, -1);
        mainTableMesh.castShadow = true;
        mainTableMesh.receiveShadow = true;
        diningGroup.add(mainTableMesh);

        const tableLegGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.3, 16);
        const tableLegMesh = new THREE.Mesh(tableLegGeo, goldMat);
        tableLegMesh.position.set(0, 0.65, -1);
        diningGroup.add(tableLegMesh);

        // Flickering Candle on Dining Table
        const candleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16);
        const candleMat = new THREE.MeshStandardMaterial({ color: 0xfffbe6, roughness: 0.2 });
        const candleMesh = new THREE.Mesh(candleGeo, candleMat);
        candleMesh.position.set(0, 1.7, -1);
        diningGroup.add(candleMesh);

        const flameGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const flameMesh = new THREE.Mesh(flameGeo, flameMat);
        flameMesh.position.set(0, 1.95, -1);
        diningGroup.add(flameMesh);

        // Sliding Velvet Chairs (North, South, East, West around main table)
        const chairsList = [];
        const chairPositions = [
            { angle: 0, dist: 2.8 },
            { angle: Math.PI / 2, dist: 2.8 },
            { angle: Math.PI, dist: 2.8 },
            { angle: Math.PI * 1.5, dist: 2.8 },
        ];

        chairPositions.forEach((pos, idx) => {
            const chairGroup = new THREE.Group();
            const x = Math.cos(pos.angle) * pos.dist;
            const z = -1 + Math.sin(pos.angle) * pos.dist;
            chairGroup.position.set(x, 0, z);
            chairGroup.rotation.y = -pos.angle - Math.PI / 2;

            // Chair Seat
            const seatGeo = new THREE.BoxGeometry(1.0, 0.15, 1.0);
            const velvetMat = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.5 });
            const seatMesh = new THREE.Mesh(seatGeo, velvetMat);
            seatMesh.position.y = 0.7;
            seatMesh.castShadow = true;
            chairGroup.add(seatMesh);

            // Chair Backrest
            const backGeo = new THREE.BoxGeometry(1.0, 0.9, 0.12);
            const backMesh = new THREE.Mesh(backGeo, velvetMat);
            backMesh.position.set(0, 1.15, -0.44);
            chairGroup.add(backMesh);

            // Gold Legs
            for (let lx of [-0.4, 0.4]) {
                for (let lz of [-0.4, 0.4]) {
                    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 12);
                    const legMesh = new THREE.Mesh(legGeo, goldMat);
                    legMesh.position.set(lx, 0.35, lz);
                    chairGroup.add(legMesh);
                }
            }

            diningGroup.add(chairGroup);
            chairsList.push({ group: chairGroup, basePos: new THREE.Vector3(x, 0, z), targetDist: pos.dist });
        });
        threeRef.current.chairs = chairsList;

        // Swaying Overhead Pendant Lights
        const hangingLightsList = [];
        for (let lx of [-3, 0, 3]) {
            const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, 3.5, 8);
            const wireMesh = new THREE.Mesh(wireGeo, wallMat);
            wireMesh.position.set(lx, 6.25, -1);
            diningGroup.add(wireMesh);

            const shadeGeo = new THREE.ConeGeometry(0.6, 0.6, 16);
            const shadeMesh = new THREE.Mesh(shadeGeo, goldMat);
            shadeMesh.position.set(lx, 4.5, -1);
            diningGroup.add(shadeMesh);

            const bulbGeo = new THREE.SphereGeometry(0.18, 16, 16);
            const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
            const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
            bulbMesh.position.set(lx, 4.3, -1);
            diningGroup.add(bulbMesh);

            hangingLightsList.push({ shade: shadeMesh, bulb: bulbMesh, baseLx: lx });
        }
        threeRef.current.hangingLights = hangingLightsList;

        // -------------------------------------------------------------
        // ENVIRONMENT 3: MICRO-ANIMATION DISH STAGE (CH 2)
        // -------------------------------------------------------------
        const dishStageGroup = new THREE.Group();
        dishStageGroup.position.set(0, 3.2, -1);
        rootGroup.add(dishStageGroup);
        threeRef.current.dishGroup = dishStageGroup;

        // Pedestal Spotlight Base
        const pedBaseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.3, 32);
        const pedBaseMesh = new THREE.Mesh(pedBaseGeo, goldMat);
        pedBaseMesh.position.y = -0.15;
        dishStageGroup.add(pedBaseMesh);

        // 3A. COFFEE EXPERIENCE DISH
        const coffeeGroup = new THREE.Group();
        dishStageGroup.add(coffeeGroup);
        threeRef.current.coffeeMug = coffeeGroup;

        // Coffee Saucer
        const saucerGeo = new THREE.CylinderGeometry(1.1, 0.9, 0.08, 32);
        const saucerMesh = new THREE.Mesh(saucerGeo, whiteMarbleMat);
        saucerMesh.position.y = 0.04;
        coffeeGroup.add(saucerMesh);

        // Coffee Ceramic Cup
        const mugGeo = new THREE.CylinderGeometry(0.75, 0.6, 1.1, 32);
        const mugMesh = new THREE.Mesh(mugGeo, whiteMarbleMat);
        mugMesh.position.y = 0.6;
        mugMesh.castShadow = true;
        coffeeGroup.add(mugMesh);

        // Mug Handle
        const handleGeo = new THREE.TorusGeometry(0.3, 0.08, 16, 24, Math.PI);
        const handleMesh = new THREE.Mesh(handleGeo, whiteMarbleMat);
        handleMesh.position.set(0.78, 0.6, 0);
        handleMesh.rotation.z = -Math.PI / 2;
        coffeeGroup.add(handleMesh);

        // Liquid Surface (Espresso & Milk Foam Swirl)
        const liquidGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32);
        const liquidMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.3 });
        const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
        liquidMesh.position.y = 1.08;
        coffeeGroup.add(liquidMesh);

        // Steam Particles
        const steamParticlesList = [];
        for (let i = 0; i < 15; i++) {
            const sGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 8, 8);
            const sMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
            const sMesh = new THREE.Mesh(sGeo, sMat);
            sMesh.position.set(
                (Math.random() - 0.5) * 0.4,
                1.2 + Math.random() * 0.6,
                (Math.random() - 0.5) * 0.4
            );
            coffeeGroup.add(sMesh);
            steamParticlesList.push({ mesh: sMesh, speedY: 0.015 + Math.random() * 0.015 });
        }
        threeRef.current.steamParticles = steamParticlesList;

        // Floating Coffee Beans Orbiting Cup
        const beansList = [];
        for (let i = 0; i < 8; i++) {
            const beanGeo = new THREE.SphereGeometry(0.12, 12, 8);
            const beanMat = new THREE.MeshStandardMaterial({ color: 0x271406, roughness: 0.8 });
            const beanMesh = new THREE.Mesh(beanGeo, beanMat);
            beanMesh.scale.set(1.4, 0.8, 0.9);
            coffeeGroup.add(beanMesh);
            beansList.push({ mesh: beanMesh, angle: (i / 8) * Math.PI * 2, radius: 1.4 + Math.random() * 0.4, height: 0.5 + Math.random() * 0.8 });
        }
        threeRef.current.coffeeBeans = beansList;

        // 3B. PIZZA ARTISANSHIP DISH
        const pizzaGroup = new THREE.Group();
        pizzaGroup.visible = false;
        dishStageGroup.add(pizzaGroup);
        threeRef.current.pizzaGroup = pizzaGroup;

        // Pizza Wooden Peel Plate
        const pizzaPlateGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.06, 32);
        const pizzaPlateMesh = new THREE.Mesh(pizzaPlateGeo, mahoganyMat);
        pizzaPlateMesh.position.y = 0.03;
        pizzaGroup.add(pizzaPlateMesh);

        // Golden Pizza Crust Base
        const crustGeo = new THREE.TorusGeometry(1.3, 0.16, 16, 32);
        const crustMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
        const crustMesh = new THREE.Mesh(crustGeo, crustMat);
        crustMesh.position.y = 0.12;
        crustMesh.rotation.x = Math.PI / 2;
        pizzaGroup.add(crustMesh);

        // Sauce & Melted Cheese Inner Base
        const cheeseBaseGeo = new THREE.CylinderGeometry(1.28, 1.28, 0.06, 32);
        const cheeseBaseMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
        const cheeseBaseMesh = new THREE.Mesh(cheeseBaseGeo, cheeseBaseMat);
        cheeseBaseMesh.position.y = 0.1;
        pizzaGroup.add(cheeseBaseMesh);

        // Falling Toppings (Pepperoni Slices & Basil Leaves)
        const toppingsList = [];
        for (let i = 0; i < 10; i++) {
            const pepGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16);
            const pepMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
            const pepMesh = new THREE.Mesh(pepGeo, pepMat);
            
            const r = 0.3 + Math.random() * 0.7;
            const a = Math.random() * Math.PI * 2;
            pepMesh.position.set(Math.cos(a) * r, 0.16 + i * 0.05, Math.sin(a) * r);
            pizzaGroup.add(pepMesh);
            toppingsList.push({ mesh: pepMesh, targetY: 0.14, startY: 1.5 + i * 0.2 });
        }
        threeRef.current.pizzaToppings = toppingsList;

        // 3C. GOURMET BURGER ASSEMBLY DISH
        const burgerGroup = new THREE.Group();
        burgerGroup.visible = false;
        dishStageGroup.add(burgerGroup);
        threeRef.current.burgerGroup = burgerGroup;

        const burgerPlateGeo = new THREE.CylinderGeometry(1.4, 1.2, 0.06, 32);
        const burgerPlateMesh = new THREE.Mesh(burgerPlateGeo, whiteMarbleMat);
        burgerPlateMesh.position.y = 0.03;
        burgerGroup.add(burgerPlateMesh);

        // Stacked Burger Layer Components
        const burgerMatBun = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
        const burgerMatPatty = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
        const burgerMatCheese = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
        const burgerMatTomato = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
        const burgerMatLettuce = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });

        // Bun Bottom
        const bBunBot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 24), burgerMatBun);
        bBunBot.position.y = 0.12;
        burgerGroup.add(bBunBot);

        // Patty
        const bPatty = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.16, 24), burgerMatPatty);
        bPatty.position.y = 0.32;
        burgerGroup.add(bPatty);

        // Cheese Slice
        const bCheese = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.9), burgerMatCheese);
        bCheese.position.y = 0.44;
        bCheese.rotation.y = Math.PI / 4;
        burgerGroup.add(bCheese);

        // Tomato Slice
        const bTomato = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.08, 24), burgerMatTomato);
        bTomato.position.y = 0.52;
        burgerGroup.add(bTomato);

        // Lettuce Leaf Layer
        const bLettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.75, 0.05, 24), burgerMatLettuce);
        bLettuce.position.y = 0.6;
        burgerGroup.add(bLettuce);

        // Bun Top (Dome)
        const bBunTop = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), burgerMatBun);
        bBunTop.position.y = 0.64;
        burgerGroup.add(bBunTop);

        threeRef.current.burgerParts = [
            { mesh: bBunBot, targetY: 0.12, initialY: 0.12 },
            { mesh: bPatty, targetY: 0.32, initialY: 1.2 },
            { mesh: bCheese, targetY: 0.44, initialY: 1.8 },
            { mesh: bTomato, targetY: 0.52, initialY: 2.4 },
            { mesh: bLettuce, targetY: 0.6, initialY: 3.0 },
            { mesh: bBunTop, targetY: 0.64, initialY: 3.6 },
        ];

        // 3D. SIGNATURE DESSERT DISH
        const dessertGroup = new THREE.Group();
        dessertGroup.visible = false;
        dishStageGroup.add(dessertGroup);
        threeRef.current.dessertGroup = dessertGroup;

        const dessertPlateGeo = new THREE.CylinderGeometry(1.3, 1.1, 0.06, 32);
        const dessertPlateMesh = new THREE.Mesh(dessertPlateGeo, whiteMarbleMat);
        dessertPlateMesh.position.y = 0.03;
        dessertGroup.add(dessertPlateMesh);

        // Lava Cake / Brownie Base
        const cakeGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.6, 24);
        const cakeMat = new THREE.MeshStandardMaterial({ color: 0x3f1d0b, roughness: 0.8 });
        const cakeMesh = new THREE.Mesh(cakeGeo, cakeMat);
        cakeMesh.position.y = 0.36;
        dessertGroup.add(cakeMesh);

        // Cream Swirl Top
        const creamGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const creamMesh = new THREE.Mesh(creamGeo, creamMat);
        creamMesh.position.y = 0.82;
        dessertGroup.add(creamMesh);
        threeRef.current.dessertCream = creamMesh;

        // Strawberry & Mint Garnish
        const berryGeo = new THREE.ConeGeometry(0.14, 0.25, 16);
        const berryMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3 });
        const berryMesh = new THREE.Mesh(berryGeo, berryMat);
        berryMesh.position.set(0.15, 1.1, 0.1);
        berryMesh.rotation.z = 0.4;
        dessertGroup.add(berryMesh);

        // 3E. CRAFT COCKTAIL DRINK DISH
        const drinkGroup = new THREE.Group();
        drinkGroup.visible = false;
        dishStageGroup.add(drinkGroup);
        threeRef.current.drinkGroup = drinkGroup;

        // Highball Glass
        const glassGeo = new THREE.CylinderGeometry(0.55, 0.48, 1.5, 32);
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        glassMesh.position.y = 0.8;
        drinkGroup.add(glassMesh);

        // Amber Liquid Fill
        const liquidFillGeo = new THREE.CylinderGeometry(0.5, 0.44, 1.2, 32);
        const liquidFillMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85, roughness: 0.1 });
        const liquidFillMesh = new THREE.Mesh(liquidFillGeo, liquidFillMat);
        liquidFillMesh.position.y = 0.68;
        drinkGroup.add(liquidFillMesh);

        // Floating Ice Cubes inside Glass
        for (let i = 0; i < 3; i++) {
            const iceGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
            const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, transmission: 0.9 });
            const iceMesh = new THREE.Mesh(iceGeo, iceMat);
            iceMesh.position.set(
                (Math.random() - 0.5) * 0.3,
                0.5 + i * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            iceMesh.rotation.set(Math.random(), Math.random(), Math.random());
            drinkGroup.add(iceMesh);
        }

        // Effervescent Bubbles Rising
        const bubblesList = [];
        for (let i = 0; i < 15; i++) {
            const bGeo = new THREE.SphereGeometry(0.03, 8, 8);
            const bMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
            const bMesh = new THREE.Mesh(bGeo, bMat);
            bMesh.position.set(
                (Math.random() - 0.5) * 0.4,
                0.2 + Math.random() * 1.0,
                (Math.random() - 0.5) * 0.4
            );
            drinkGroup.add(bMesh);
            bubblesList.push({ mesh: bMesh, speedY: 0.01 + Math.random() * 0.01 });
        }
        threeRef.current.drinkBubbles = bubblesList;


        // -------------------------------------------------------------
        // ENVIRONMENT 4: KITCHEN WORKFLOW & FLAMING STOVE (CH 3)
        // -------------------------------------------------------------
        const kitchenGroup = new THREE.Group();
        kitchenGroup.position.set(-10, 0, -8);
        rootGroup.add(kitchenGroup);

        // Stainless Steel Kitchen Counter Base
        const kCounterGeo = new THREE.BoxGeometry(8, 1.4, 3);
        const kCounterMesh = new THREE.Mesh(kCounterGeo, stainlessSteelMat);
        kCounterMesh.position.y = 0.7;
        kCounterMesh.castShadow = true;
        kitchenGroup.add(kCounterMesh);

        // Stove Gas Burners & Rising Fire Particles
        for (let bx of [-2, 0, 2]) {
            const burnerGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.08, 24);
            const burnerMesh = new THREE.Mesh(burnerGeo, wallMat);
            burnerMesh.position.set(bx, 1.44, 0);
            kitchenGroup.add(burnerMesh);
        }

        // Animated Kitchen Flame Particles
        const fireParticles = [];
        for (let i = 0; i < 20; i++) {
            const fGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 8, 8);
            const fMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xff4500 : 0x38bdf8 });
            const fMesh = new THREE.Mesh(fGeo, fMat);
            const bx = [-2, 0, 2][i % 3];
            fMesh.position.set(bx + (Math.random() - 0.5) * 0.5, 1.5, (Math.random() - 0.5) * 0.5);
            kitchenGroup.add(fMesh);
            fireParticles.push({ mesh: fMesh, speedY: 0.02 + Math.random() * 0.02, initialY: 1.5 });
        }
        threeRef.current.kitchenFireParticles = fireParticles;

        // Chopping Board & Precision Knife Motion
        const boardGeo = new THREE.BoxGeometry(1.4, 0.08, 0.9);
        const boardMesh = new THREE.Mesh(boardGeo, mahoganyMat);
        boardMesh.position.set(3, 1.44, 0.5);
        kitchenGroup.add(boardMesh);

        const knifeGroup = new THREE.Group();
        knifeGroup.position.set(3, 1.8, 0.5);
        kitchenGroup.add(knifeGroup);

        const knifeBladeGeo = new THREE.BoxGeometry(0.8, 0.22, 0.02);
        const knifeBlade = new THREE.Mesh(knifeBladeGeo, stainlessSteelMat);
        knifeBlade.position.x = 0.4;
        knifeGroup.add(knifeBlade);

        const knifeHandleGeo = new THREE.BoxGeometry(0.4, 0.1, 0.06);
        const knifeHandle = new THREE.Mesh(knifeHandleGeo, wallMat);
        knifeHandle.position.x = -0.1;
        knifeGroup.add(knifeHandle);

        threeRef.current.chefKnife = knifeGroup;


        // -------------------------------------------------------------
        // ENVIRONMENT 5: WAITER & SERVICE DELIVERY (CH 4)
        // -------------------------------------------------------------
        const serviceGroup = new THREE.Group();
        serviceGroup.position.set(8, 0, -4);
        rootGroup.add(serviceGroup);

        // Serving Tray Carrier Waiter Standee Model
        const waiterGroup = new THREE.Group();
        serviceGroup.add(waiterGroup);
        threeRef.current.waiterModel = waiterGroup;

        // Tray Model
        const trayGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.06, 32);
        const trayMesh = new THREE.Mesh(trayGeo, stainlessSteelMat);
        trayMesh.position.set(0, 1.8, 0);
        waiterGroup.add(trayMesh);

        // Cloche Dome Cover
        const clocheGeo = new THREE.SphereGeometry(0.9, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const clocheMesh = new THREE.Mesh(clocheGeo, stainlessSteelMat);
        clocheMesh.position.set(0, 1.83, 0);
        waiterGroup.add(clocheMesh);

        const clocheKnobGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const clocheKnob = new THREE.Mesh(clocheKnobGeo, goldMat);
        clocheKnob.position.set(0, 2.75, 0);
        waiterGroup.add(clocheKnob);


        // -------------------------------------------------------------
        // POINTER & TOUCH CONTROLS
        // -------------------------------------------------------------
        const handlePointerDown = (e) => {
            threeRef.current.isPointerDown = true;
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            threeRef.current.pointerX = x;
            threeRef.current.pointerY = y;
        };

        const handlePointerMove = (e) => {
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;

            if (threeRef.current.isPointerDown && isOrbitMode) {
                const deltaX = x - threeRef.current.pointerX;
                const deltaY = y - threeRef.current.pointerY;

                threeRef.current.dragRotationX += deltaX * 0.005;
                threeRef.current.dragRotationY += deltaY * 0.005;
                threeRef.current.dragRotationY = Math.max(-0.5, Math.min(0.5, threeRef.current.dragRotationY));

                threeRef.current.pointerX = x;
                threeRef.current.pointerY = y;
            }
        };

        const handlePointerUp = () => {
            threeRef.current.isPointerDown = false;
        };

        container.addEventListener('mousedown', handlePointerDown);
        container.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);

        container.addEventListener('touchstart', handlePointerDown, { passive: true });
        container.addEventListener('touchmove', handlePointerMove, { passive: true });
        window.addEventListener('touchend', handlePointerUp);

        // -------------------------------------------------------------
        // ANIMATION RENDER LOOP (60 FPS)
        // -------------------------------------------------------------
        let animFrameId;
        const clock = new THREE.Clock();

        const renderLoop = () => {
            animFrameId = requestAnimationFrame(renderLoop);
            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            // 1. CHIMNEY SMOKE PARTICLES ANIMATION
            threeRef.current.chimneySmokeParticles.forEach(p => {
                p.mesh.position.y += p.speedY;
                p.mesh.position.x += Math.sin(elapsed * 2 + p.initialY) * 0.005;
                p.mesh.material.opacity = Math.max(0, 0.35 - (p.mesh.position.y / 6));
                if (p.mesh.position.y > 6) {
                    p.mesh.position.y = p.initialY;
                    p.mesh.material.opacity = 0.35;
                }
            });

            // 2. SWAYING HANGING PENDANT LIGHTS
            threeRef.current.hangingLights.forEach((light, i) => {
                const swayAngle = Math.sin(elapsed * 1.5 + i) * 0.08;
                light.shade.position.x = light.baseLx + Math.sin(swayAngle) * 1.5;
                light.bulb.position.x = light.baseLx + Math.sin(swayAngle) * 1.5;
            });

            // 3. STEAM PARTICLES ON COFFEE
            threeRef.current.steamParticles.forEach(s => {
                s.mesh.position.y += s.speedY;
                s.mesh.position.x += Math.sin(elapsed * 3 + s.mesh.position.y) * 0.003;
                s.mesh.material.opacity = Math.max(0, 0.4 - ((s.mesh.position.y - 1.2) / 1.5));
                if (s.mesh.position.y > 2.7) {
                    s.mesh.position.y = 1.2;
                    s.mesh.material.opacity = 0.4;
                }
            });

            // 4. FLOATING COFFEE BEANS ORBIT
            threeRef.current.coffeeBeans.forEach(b => {
                b.angle += delta * 0.8;
                b.mesh.position.x = Math.cos(b.angle) * b.radius;
                b.mesh.position.z = Math.sin(b.angle) * b.radius;
                b.mesh.position.y = b.height + Math.sin(elapsed * 2 + b.angle) * 0.1;
                b.mesh.rotation.x += delta * 2;
                b.mesh.rotation.y += delta * 1.5;
            });

            // 5. DRINK BUBBLES RISING
            threeRef.current.drinkBubbles.forEach(b => {
                b.mesh.position.y += b.speedY;
                if (b.mesh.position.y > 1.4) {
                    b.mesh.position.y = 0.2;
                }
            });

            // 6. KITCHEN FLAME PARTICLES
            threeRef.current.kitchenFireParticles.forEach(f => {
                f.mesh.position.y += f.speedY;
                f.mesh.scale.setScalar(Math.max(0.1, 1 - ((f.mesh.position.y - f.initialY) / 0.8)));
                if (f.mesh.position.y > f.initialY + 0.8) {
                    f.mesh.position.y = f.initialY;
                }
            });

            // 7. CHEF KNIFE PRECISION CHOPPING MOTION
            if (threeRef.current.chefKnife) {
                threeRef.current.chefKnife.position.y = 1.8 + Math.abs(Math.sin(elapsed * 6)) * 0.25;
                threeRef.current.chefKnife.rotation.z = Math.sin(elapsed * 6) * 0.15;
            }

            // 8. WAITER GENTLE FLOAT
            if (threeRef.current.waiterModel) {
                threeRef.current.waiterModel.position.y = Math.sin(elapsed * 2) * 0.08;
            }

            // -------------------------------------------------------------
            // CAMERA POSITIONING & CHAPTER STORYTELLING PATH INTERPOLATION
            // -------------------------------------------------------------
            if (!isOrbitMode) {
                // Smooth interpolation targets based on active chapter
                let targetEye = new THREE.Vector3(0, 8, 25);
                let targetLook = new THREE.Vector3(0, 2, 0);

                if (activeChapter === 0) {
                    // Chapter 0: Entrance Fly-In
                    targetEye.set(0, 7 - scrollProgress * 5, 26 - scrollProgress * 15);
                    targetLook.set(0, 4, 10);

                    // Open entrance doors as camera moves closer
                    const doorOpenDist = Math.min(1.8, Math.max(0, (scrollProgress - 0.05) * 12));
                    if (threeRef.current.doorsLeft) threeRef.current.doorsLeft.position.x = -0.95 - doorOpenDist;
                    if (threeRef.current.doorsRight) threeRef.current.doorsRight.position.x = 0.95 + doorOpenDist;
                } else if (activeChapter === 1) {
                    // Chapter 1: Dining Walkthrough & Chairs Slide In
                    targetEye.set(3, 4.5, 7);
                    targetLook.set(0, 1.4, -1);

                    // Chairs slide smoothly into table
                    const chairSlide = Math.min(1, Math.max(0, (scrollProgress - 0.2) * 5));
                    threeRef.current.chairs.forEach(c => {
                        const dist = 2.8 - chairSlide * 0.8;
                        c.group.position.x = Math.cos(c.group.rotation.y + Math.PI / 2) * dist;
                        c.group.position.z = -1 + Math.sin(c.group.rotation.y + Math.PI / 2) * dist;
                    });
                } else if (activeChapter === 2) {
                    // Chapter 2: Micro-Animation Dish Crafting Close-Up
                    targetEye.set(0, 5.2, 3.2);
                    targetLook.set(0, 3.4, -1);

                    // Rotate active dish stage slowly
                    if (threeRef.current.dishGroup) {
                        threeRef.current.dishGroup.rotation.y += delta * 0.5;
                    }
                } else if (activeChapter === 3) {
                    // Chapter 3: Kitchen Workflow
                    targetEye.set(-7, 4.2, -3);
                    targetLook.set(-10, 2, -8);
                } else if (activeChapter === 4) {
                    // Chapter 4: Service Delivery
                    targetEye.set(6, 4.0, 1);
                    targetLook.set(8, 1.8, -4);
                }

                // Smooth Lerp Camera
                camera.position.lerp(targetEye, 0.06);
                threeRef.current.cameraTarget.lerp(targetLook, 0.06);
                camera.lookAt(threeRef.current.cameraTarget);
            } else {
                // Free Orbit Pan Mode
                threeRef.current.rootGroup.rotation.y = threeRef.current.dragRotationX;
                threeRef.current.rootGroup.rotation.x = threeRef.current.dragRotationY;
            }

            renderer.render(scene, camera);
        };

        renderLoop();

        // Responsive Resize Handler
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
            cancelAnimationFrame(animFrameId);
            container.removeEventListener('mousedown', handlePointerDown);
            container.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', handlePointerUp);
            container.removeEventListener('touchstart', handlePointerDown);
            container.removeEventListener('touchmove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, [activeChapter, isOrbitMode]);

    // Handle Active Dish Switching in Chapter 2
    useEffect(() => {
        const { coffeeMug, pizzaGroup, burgerGroup, dessertGroup, drinkGroup } = threeRef.current;
        if (!coffeeMug) return;

        coffeeMug.visible = activeDish === 'coffee';
        if (pizzaGroup) pizzaGroup.visible = activeDish === 'pizza';
        if (burgerGroup) burgerGroup.visible = activeDish === 'burger';
        if (dessertGroup) dessertGroup.visible = activeDish === 'dessert';
        if (drinkGroup) drinkGroup.visible = activeDish === 'drink';
    }, [activeDish]);

    return (
        <div ref={containerRef} className={`relative w-full ${height} overflow-hidden bg-slate-950 text-white font-sans selection:bg-[#FF2D55] select-none rounded-[2.5rem] border border-slate-800 shadow-2xl`}>
            
            {/* Ambient Background Gradient & Glow Spheres */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FF2D55]/15 rounded-full blur-[140px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF6A00]/15 rounded-full blur-[120px]" />
            </div>

            {/* Main Three.js WebGL Canvas */}
            <canvas 
                ref={canvasRef} 
                className={`w-full h-full z-10 ${isOrbitMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} 
            />

            {/* TOP HEADER CONTROLS BAR */}
            <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-auto">
                
                {/* Active Chapter Badge */}
                <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 px-4 py-2 rounded-2xl shadow-xl">
                    <span className="text-xl">{chapters[activeChapter].icon}</span>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF2D55] block">
                            {chapters[activeChapter].badge}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs">
                            {chapters[activeChapter].title}
                        </h4>
                    </div>
                </div>

                {/* Right Action Tools: Mute, Orbit Toggle, Story Jump */}
                <div className="flex items-center gap-2">
                    {/* Mute / Audio Toggle */}
                    <button
                        onClick={toggleAudio}
                        className={`p-3 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer shadow-lg ${
                            !isAudioMuted 
                                ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-[#FF2D55]/30' 
                                : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-white'
                        }`}
                        title={isAudioMuted ? "Unmute Ambient Restaurant Sound" : "Mute Sound"}
                    >
                        {isAudioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    {/* Orbit / Free View Toggle */}
                    <button
                        onClick={() => setIsOrbitMode(!isOrbitMode)}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl backdrop-blur-xl border text-xs font-bold transition-all cursor-pointer shadow-lg ${
                            isOrbitMode 
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20' 
                                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:text-white'
                        }`}
                    >
                        <Compass size={16} className={isOrbitMode ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{isOrbitMode ? 'Free 3D Orbit' : 'Story Scroll'}</span>
                    </button>
                </div>
            </div>

            {/* OVERLAY: ACTIVE CHAPTER STORY CARD & SUBTITLE */}
            <div className="absolute bottom-24 left-6 right-6 sm:left-12 sm:right-auto sm:max-w-md z-30 pointer-events-auto">
                <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 p-5 sm:p-6 rounded-3xl shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles size={12} /> Chapter {activeChapter + 1} of 5
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                            {Math.round(scrollProgress * 100)}% Depth
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
                        {chapters[activeChapter].subtitle}
                    </p>

                    {/* Interactive Dish Selector Toolbar (Only visible in Chapter 2) */}
                    {activeChapter === 2 && (
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                Choose Signature Dish Experience:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { id: 'coffee', label: 'Coffee ☕' },
                                    { id: 'pizza', label: 'Pizza 🍕' },
                                    { id: 'burger', label: 'Burger 🍔' },
                                    { id: 'dessert', label: 'Dessert 🍰' },
                                    { id: 'drink', label: 'Cocktail 🍹' },
                                ].map(dish => (
                                    <button
                                        key={dish.id}
                                        onClick={() => setActiveDish(dish.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                            activeDish === dish.id 
                                                ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-md shadow-[#FF2D55]/30 scale-105' 
                                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                        }`}
                                    >
                                        {dish.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM CHAPTER QUICK NAVIGATION TIMELINE BAR */}
            <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center justify-between bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-2 sm:p-2.5 rounded-2xl pointer-events-auto">
                <div className="flex items-center gap-1 sm:gap-2 flex-1 overflow-x-auto pr-2">
                    {chapters.map((ch, idx) => (
                        <button
                            key={ch.id}
                            onClick={() => {
                                setActiveChapter(idx);
                                setScrollProgress((idx / 4) * 0.95);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                                activeChapter === idx 
                                    ? 'bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] text-white border-[#FF2D55] shadow-md scale-105' 
                                    : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <span>{ch.icon}</span>
                            <span className="hidden md:inline">{ch.title.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>

                <div className="text-[10px] font-black text-slate-400 px-3 border-l border-slate-800 hidden sm:flex items-center gap-1.5 shrink-0">
                    <Flame size={14} className="text-[#FF6A00]" />
                    <span>Scroll to Explore 3D Story</span>
                </div>
            </div>

        </div>
    );
};

export default Interactive3DRestaurantExperience;
