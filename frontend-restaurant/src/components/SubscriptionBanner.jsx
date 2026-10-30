import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

const SubscriptionBanner = () => {
    const { api, user } = useAuth();
    const [isFrozen, setIsFrozen] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            if (user && user.restaurantId) {
                try {
                    const res = await api.get('/restaurants/mine');
                    if (res.data?.subscription?.status === 'Frozen') {
                        setIsFrozen(true);
                    }
                } catch (error) {
                    console.error("Failed to check subscription", error);
                }
            }
        };
        checkStatus();
    }, [api, user]);

    if (!isFrozen) return null;

    return (
        <div className="bg-red-600 text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 z-50">
            <AlertTriangle size={16} />
            Your subscription has expired. Please renew to continue using the platform.
        </div>
    );
};

export default SubscriptionBanner;
