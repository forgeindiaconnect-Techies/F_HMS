import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) {
            return stored === 'dark';
        }
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            <button
                onClick={() => setIsDark(!isDark)}
                className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-amber-400 dark:text-emerald-400 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-400" />}
            </button>
        </div>
    );
};

export default ThemeToggle;
