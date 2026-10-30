import clsx from 'clsx';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, colorClass = "bg-green-500" }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mt-2">{value}</h3>
                </div>
                <div className={clsx("p-3 rounded-xl text-white", colorClass)}>
                    <Icon size={24} />
                </div>
            </div>
            
            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={clsx(
                        "text-xs font-semibold px-2 py-1 rounded-full",
                        trendUp 
                            ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400" 
                            : "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400"
                    )}>
                        {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                    <span className="text-gray-400 dark:text-slate-500 text-xs">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
