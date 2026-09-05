import { useState, useEffect } from 'react';
import { Sun, Moon, Check } from 'lucide-react';

export const ThemeSettingCard = () => {
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    const applyTheme = (mode) => {
        setTheme(mode);
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('theme-changed'));
        window.dispatchEvent(new Event('toggle-theme'));
    };

    useEffect(() => {
        const syncTheme = () => {
            const isDarkNow = document.documentElement.classList.contains('dark');
            setTheme(isDarkNow ? 'dark' : 'light');
        };
        window.addEventListener('theme-changed', syncTheme);
        window.addEventListener('toggle-theme', syncTheme);
        return () => {
            window.removeEventListener('theme-changed', syncTheme);
            window.removeEventListener('toggle-theme', syncTheme);
        };
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Appearance & Theme</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Customize your workspace visual mode across all dashboard screens.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Light Mode Selector Card */}
                <button
                    type="button"
                    onClick={() => applyTheme('light')}
                    className={`relative p-5 rounded-2xl border-2 flex items-center gap-4 transition-all cursor-pointer text-left ${
                        theme === 'light'
                            ? 'border-green-600 bg-green-50/50 dark:bg-green-950/20 shadow-sm'
                            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-gray-50/50 dark:bg-slate-800/40'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Sun size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Light Theme</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Clean, crisp light background</p>
                    </div>
                    {theme === 'light' && (
                        <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
                            <Check size={14} />
                        </div>
                    )}
                </button>

                {/* Dark Mode Selector Card */}
                <button
                    type="button"
                    onClick={() => applyTheme('dark')}
                    className={`relative p-5 rounded-2xl border-2 flex items-center gap-4 transition-all cursor-pointer text-left ${
                        theme === 'dark'
                            ? 'border-green-600 bg-slate-900 text-white shadow-sm'
                            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-slate-900/90 text-white'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                        <Moon size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-white text-sm">Dark Theme</p>
                        <p className="text-xs text-slate-400">Premium low-light dark workspace</p>
                    </div>
                    {theme === 'dark' && (
                        <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
                            <Check size={14} />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ThemeSettingCard;
