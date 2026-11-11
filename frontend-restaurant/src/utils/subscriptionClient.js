import toast from 'react-hot-toast';

export const buildDummyUpiQrUrl = ({ amount = 0, label = 'FoodNest Subscription', upiId = 'foodnest@upi' } = {}) => {
    const cleanAmount = Math.max(0, Number(amount) || 0);
    const upiPayload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent('FoodNest SaaS')}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(label)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayload)}`;
};

/**
 * Single client-side source of truth for subscription freeze/expiry state across all roles.
 */
export const evaluateClientSubscriptionFreeze = (user, restaurant) => {
    if (!user || ['SuperAdmin', 'SupportAgent', 'Customer'].includes(user.role)) {
        return { isFrozen: false, isOwner: false };
    }

    const isOwner = ['RestaurantAdmin', 'Admin'].includes(user.role);
    if (!restaurant || restaurant.isDemo) {
        return { isFrozen: false, isOwner };
    }

    const sub = restaurant.subscription || {};
    const status = sub.status || 'Active';
    const now = new Date();

    const isManualFrozen = Boolean(sub.manualFreeze || status === 'Frozen');
    const isPendingApproval = status === 'Pending Approval';
    const isRejected = status === 'Rejected';

    const trialEnd = sub.trialEndDate || sub.expiryDate;
    const isTrialExpired = Boolean(sub.trialActive && trialEnd && now > new Date(trialEnd));

    const paidEnd = sub.subscriptionEndDate || sub.expiryDate;
    const isPaidExpired = Boolean(!sub.trialActive && paidEnd && now > new Date(paidEnd));

    const isStatusBlocked = ['Expired', 'Inactive', 'Suspended', 'Cancelled'].includes(status) || sub.paymentStatus === 'Failed';

    const isFrozen = Boolean(
        isManualFrozen ||
        isPendingApproval ||
        isRejected ||
        isTrialExpired ||
        isPaidExpired ||
        isStatusBlocked
    );

    let freezeType = null;
    if (isManualFrozen) freezeType = 'manual';
    else if (isPendingApproval) freezeType = 'pending';
    else if (isRejected) freezeType = 'rejected';
    else if (sub.paymentStatus === 'Failed') freezeType = 'failed';
    else if (isTrialExpired || isPaidExpired || isStatusBlocked) freezeType = 'expired';

    return {
        isFrozen,
        isOwner,
        freezeType,
        isManualFrozen,
        isPendingApproval,
        isRejected,
        isTrialExpired,
        isPaidExpired,
        isTrial: sub.paymentStatus === 'Trial' || Boolean(sub.trialActive),
        reason: sub.freezeReason || sub.rejectionReason || '',
        status,
    };
};

/**
 * Confirms a Dummy QR Scanner subscription payment via backend without Razorpay.
 */
export const confirmDummyQRSubscriptionPayment = async ({
    api,
    planName,
    billingCycle = 'monthly',
    refId,
    onSuccess,
    onFailure,
}) => {
    try {
        const txnRef = refId || `QR-SUB-${Date.now().toString().slice(-8)}`;
        const res = await api.post('/restaurants/mine/confirm-qr-payment', {
            planName,
            billingCycle,
            refId: txnRef,
            transactionId: txnRef,
        });
        toast.success(`QR Payment confirmed! ${planName} plan is now active.`);
        if (onSuccess) await onSuccess(res.data);
        return res.data;
    } catch (err) {
        const msg = err.response?.data?.message || 'Failed to confirm QR payment.';
        toast.error(msg);
        if (onFailure) onFailure(msg);
        return null;
    }
};

