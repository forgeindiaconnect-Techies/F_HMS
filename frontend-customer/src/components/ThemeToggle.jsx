import { useEffect } from 'react';
import { Sun, Check } from 'lucide-react';

export const ThemeSettingCard = () => {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h3 className="font-bold text-gray-900 text-base">Appearance & Theme</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Workspace visual mode is standardized on the modern, high-contrast light theme.</p>
                </div>
            </div>

            <div className="max-w-md pt-2">
                {/* Active Light Mode Display */}
                <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                        <Sun size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">Light Theme (Active)</p>
                        <p className="text-xs text-gray-500">Clean, crisp light background across all customer screens</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeSettingCard;
