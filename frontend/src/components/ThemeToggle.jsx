import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ThemeToggle = () => {
    const location = useLocation();
    const isChefRoute = location.pathname.startsWith('/chef');

    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) {
            return stored === 'dark';
        }
        return document.documentElement.classList.contains('dark');
    });

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('theme-changed'));
    }, [isDark]);

    useEffect(() => {
        // Sync when the Topbar's theme button fires either event
        const syncFromDOM = () => {
            const currentlyDark = document.documentElement.classList.contains('dark');
            setIsDark(currentlyDark);
        };
        window.addEventListener('toggle-theme', syncFromDOM);
        window.addEventListener('theme-changed', syncFromDOM);
        return () => {
            window.removeEventListener('toggle-theme', syncFromDOM);
            window.removeEventListener('theme-changed', syncFromDOM);
        };
    }, []);

    const isLandingRoute = location.pathname === '/' || location.pathname === '';
    if (isChefRoute || isLandingRoute) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            <button
                onClick={toggleTheme}
                className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-amber-500 dark:text-emerald-400 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDark ? <Sun size={22} className="text-amber-400" /> : <Moon size={22} className="text-slate-700" />}
            </button>
        </div>
    );
};

export default ThemeToggle;
