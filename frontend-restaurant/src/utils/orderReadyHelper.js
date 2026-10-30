/**
 * Order Ready Time Calculation Utility
 * Provides accurate preparation countdown, ready time timestamps, and status labels
 * for customer dashboards and tracking screens.
 */

export const getOrderReadyTimeInfo = (order) => {
    if (!order) return null;

    const status = String(order.status || '').trim();
    const deliveryStatus = String(order.deliveryStatus || '').trim();
    const isDelivery = order.orderType === 'Delivery';
    const isSelfPickup = order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup' || order.source === 'Self-Pickup' || String(order.orderType || '').toLowerCase().includes('pickup');
    const isSelfDineIn = !isSelfPickup && (order.serviceType === 'Self Dine-In (KFC Style)' || String(order.serviceType || '').toLowerCase().includes('self dine-in'));

    const isCancelled = status === 'Cancelled';
    const isCompleted = ['Delivered', 'Completed', 'Served'].includes(status) || deliveryStatus === 'Delivered';
    const isReady = ['Ready', 'Ready for Pickup', 'Ready for Dispatch'].includes(status);

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
            label: isDelivery ? 'Delivered Safely' : isSelfPickup ? 'Picked Up & Completed' : 'Served & Completed',
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
        let label = 'Food is Ready & Plated!';
        let pickupPrompt = 'Your order is plated and being brought to your table now.';

        if (isDelivery) {
            label = 'Packed & Ready for Dispatch';
            pickupPrompt = 'Your order is packed and waiting for delivery partner pickup.';
        } else if (isSelfPickup) {
            label = 'Ready for Counter Pickup!';
            pickupPrompt = 'Your packed order is ready! Please collect it from the pickup counter.';
        } else if (isSelfDineIn) {
            label = 'Ready at Counter!';
            pickupPrompt = 'Your order is ready at the counter. Please collect your tray!';
        }

        return {
            status: 'Ready',
            label,
            displayTime: 'Ready Now',
            badgeClass: 'bg-emerald-600 text-white font-black animate-pulse shadow-sm',
            isCancelled: false,
            isReady: true,
            isCompleted: false,
            isPreparing: false,
            progressPercent: 100,
            remainingMinutes: 0,
            pickupPrompt
        };
    }

    // Calculating Estimated Ready Time
    const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const prepMinutes = Number(order.estimatedPrepMinutes) || (isDelivery ? 30 : 20);

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

    let pickupPrompt = `Chefs are preparing your dishes fresh. Estimated ready time is ${readyClock}.`;
    if (isDelivery) {
        pickupPrompt = `Chefs are preparing your order. Estimated dispatch time is ${readyClock}.`;
    } else if (isSelfPickup) {
        pickupPrompt = `Estimated ready time is ${readyClock}. You will receive an alert once your packed order is ready at the counter.`;
    } else if (isSelfDineIn) {
        pickupPrompt = `Estimated ready time is ${readyClock}. You will receive an alert once ready at the counter.`;
    }

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
        pickupPrompt
    };
};
