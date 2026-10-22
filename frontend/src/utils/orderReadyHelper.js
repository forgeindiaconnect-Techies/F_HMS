/**
 * Order Ready Time Calculation Utility
 * Provides accurate preparation countdown, ready time timestamps, and status labels
 * for customer dashboards and tracking screens.
 */

export const getOrderReadyTimeInfo = (order) => {
    if (!order) return null;

    const status = String(order.status || '').trim();
    const deliveryStatus = String(order.deliveryStatus || '').trim();
    const isSelfPickup = order.orderType === 'Self-Pickup' || 
                         order.orderType === 'Self Pickup' || 
                         order.serviceType === 'Self Dine-In (KFC Style)';

    const isCancelled = status === 'Cancelled';
    const isCompleted = ['Delivered', 'Completed', 'Served'].includes(status) || deliveryStatus === 'Delivered';
    const isReady = ['Ready', 'Ready for Pickup'].includes(status);

    if (isCancelled) {
        return {
            status: 'Cancelled',
            label: 'Order Cancelled',
            displayTime: 'Cancelled',
            badgeClass: 'bg-red-50 text-red-700 border-red-200',
            isCancelled: true,
            isReady: false,
            isCompleted: false,
            isPreparing: false,
            progressPercent: 0,
            remainingMinutes: 0
        };
    }

    if (isCompleted) {
        const completedTime = order.updatedAt 
            ? new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : 'Done';
        return {
            status: 'Completed',
            label: order.orderType === 'Delivery' ? 'Delivered Safely' : 'Served & Completed',
            displayTime: completedTime,
            badgeClass: 'bg-green-50 text-green-700 border-green-200',
            isCancelled: false,
            isReady: false,
            isCompleted: true,
            isPreparing: false,
            progressPercent: 100,
            remainingMinutes: 0
        };
    }

    if (isReady) {
        return {
            status: 'Ready',
            label: isSelfPickup ? 'Ready for Counter Pickup!' : 'Food is Ready & Plated!',
            displayTime: 'Ready Now',
            badgeClass: 'bg-emerald-600 text-white font-black animate-pulse shadow-sm',
            isCancelled: false,
            isReady: true,
            isCompleted: false,
            isPreparing: false,
            progressPercent: 100,
            remainingMinutes: 0,
            pickupPrompt: isSelfPickup 
                ? 'Your order is ready at the pickup counter. Please collect your tray!' 
                : 'Your order is plated and being brought to your table now.'
        };
    }

    // Calculating Estimated Ready Time
    const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const prepMinutes = Number(order.estimatedPrepMinutes) || (order.orderType === 'Delivery' ? 30 : 20);

    let readyDate;
    if (order.estimatedReadyTime) {
        readyDate = new Date(order.estimatedReadyTime);
    } else {
        readyDate = new Date(createdDate.getTime() + prepMinutes * 60 * 1000);
    }

    const now = Date.now();
    const diffMs = readyDate.getTime() - now;
    const remainingMinutes = Math.max(1, Math.ceil(diffMs / 60000));
    const readyClock = readyDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    // Calculate elapsed progress percentage
    const totalDurationMs = prepMinutes * 60 * 1000;
    const elapsedMs = Math.max(0, now - createdDate.getTime());
    const calculatedProgress = Math.min(95, Math.max(15, Math.round((elapsedMs / totalDurationMs) * 100)));

    return {
        status: status || 'Preparing',
        label: `Ready in ~${remainingMinutes} min${remainingMinutes > 1 ? 's' : ''}`,
        displayTime: readyClock,
        exactReadyTime: readyClock,
        badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
        isCancelled: false,
        isReady: false,
        isCompleted: false,
        isPreparing: true,
        prepMinutes,
        remainingMinutes,
        progressPercent: calculatedProgress,
        pickupPrompt: isSelfPickup 
            ? `Estimated ready time is ${readyClock}. You will receive an alert once ready at the counter.`
            : `Chefs are preparing your dishes fresh. Estimated ready time is ${readyClock}.`
    };
};
