import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const CustomerProtectedRoute = ({ children }) => {
    const { user, loading } = useCustomerAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to customer login but save the attempted url
        return <Navigate to="/customer/login" state={{ from: location }} replace />;
    }

    if (user.role !== 'Customer') {
        return <Navigate to="/customer/login" replace />;
    }

    return children;
};

export default CustomerProtectedRoute;
