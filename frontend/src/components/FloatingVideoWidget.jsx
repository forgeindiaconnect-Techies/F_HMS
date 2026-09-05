import React, { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX, Play, Pause, Maximize, Minimize } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const FloatingVideoWidget = () => {
    const location = useLocation();
    const [isSkipped, setIsSkipped] = useState(() => {
        return localStorage.getItem('demo_video_skipped') === 'true';
    });
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHeroVisible, setIsHeroVisible] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        const handleOpenDemo = () => {
            setIsSkipped(false);
            setIsPlaying(true);
        };
        window.addEventListener('open_demo_video', handleOpenDemo);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            window.removeEventListener('open_demo_video', handleOpenDemo);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Only display on the main restaurant landing page ('/')
    if (location.pathname !== '/') {
        return null;
    }

    const handleSkip = (e) => {
        if (e) e.stopPropagation();
        localStorage.setItem('demo_video_skipped', 'true');
        setIsSkipped(true);
    };

    const handleWatchDemo = () => {
        localStorage.removeItem('demo_video_skipped');
        setIsSkipped(false);
        setIsPlaying(true);
    };

    if (isSkipped) {
        return null;
    }

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullScreen = (e) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            } else {
                if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen().catch(() => {});
                } else if (videoRef.current.webkitRequestFullscreen) {
                    videoRef.current.webkitRequestFullscreen();
                } else if (videoRef.current.msRequestFullscreen) {
                    videoRef.current.msRequestFullscreen();
                }
            }
        }
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-72 sm:w-80 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 group">
            {/* Header overlay with Skip & Fullscreen button */}
            <div className="absolute top-0 left-0 right-0 z-20 p-2.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-[#FF2D55] animate-pulse"></span>
                    <span>Demo Video</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={toggleFullScreen}
                        className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg border border-white/20 transition-all cursor-pointer"
                        title="Full Screen"
                    >
                        <Maximize size={14} />
                    </button>
                    <button
                        onClick={handleSkip}
                        className="flex items-center gap-1 bg-[#FF2D55] hover:bg-[#E0264A] text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer"
                        title="Skip Video"
                    >
                        <span>Skip</span>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video bg-black cursor-pointer overflow-hidden" onClick={togglePlay}>
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    poster="/assets/images/saas-hero-scene-2.png"
                    className="w-full h-full object-cover"
                >
                    <source src="/demo-video.mp4" type="video/mp4" />
                </video>

                {/* Controls overlay on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="text-white hover:text-[#FF2D55] p-1 transition-colors cursor-pointer"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-white" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                            className="text-white hover:text-[#FF2D55] p-1 transition-colors cursor-pointer"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                    </div>

                    <button
                        onClick={toggleFullScreen}
                        className="text-white hover:text-[#FF2D55] p-1 transition-colors cursor-pointer"
                        title="Full Screen"
                    >
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingVideoWidget;
