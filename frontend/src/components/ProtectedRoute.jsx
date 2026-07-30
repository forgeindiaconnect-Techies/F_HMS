import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to appropriate login page based on the path
        const path = location.pathname;
        const isStaffPath = path.startsWith('/admin') || 
                            path.startsWith('/manager') || 
                            path.startsWith('/chef') || 
                            path.startsWith('/waiter') || 
                            path.startsWith('/cashier') || 
                            path.startsWith('/super-admin');
                            
        let loginPath = '/login';
        if (path.startsWith('/delivery')) {
            loginPath = '/delivery/login';
        } else if (isStaffPath) {
            loginPath = '/staff/login';
        }
        
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user.role || 'Customer';
        
        // Exact matching for roles is much safer than substring matching
        const isAllowed = allowedRoles.some(role => 
            userRole.toLowerCase() === role.toLowerCase()
        );

        if (!isAllowed) {
            // Role not authorized, redirect to home or their appropriate dashboard
            let fallbackRoute = '/';
            if (userRole === 'SuperAdmin') fallbackRoute = '/super-admin';
            else if (userRole === 'RestaurantAdmin' || userRole === 'Admin') fallbackRoute = '/admin';
            else if (userRole === 'BranchManager') fallbackRoute = '/manager';
            else if (userRole === 'Chef') fallbackRoute = '/chef';
            else if (userRole === 'Waiter') fallbackRoute = '/waiter';
            else if (userRole === 'Cashier') fallbackRoute = '/cashier';
            else if (userRole === 'DeliveryPartner') fallbackRoute = '/delivery/dashboard';
            
            return <Navigate to={fallbackRoute} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
