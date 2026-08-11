import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default PublicLayout;
