import { useState, useEffect } from 'react';

const STORAGE_KEY = 'waiter_search_query';

export const setWaiterSearchQuery = (val) => {
    const next = typeof val === 'string' ? val : '';
    try {
        if (next) {
            sessionStorage.setItem(STORAGE_KEY, next);
        } else {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('waiter-search', { detail: next }));
};

export const useWaiterSearch = () => {
    const [searchQuery, setSearchQuery] = useState(() => {
        try {
            return sessionStorage.getItem(STORAGE_KEY) || '';
        } catch (_) {
            return '';
        }
    });

    useEffect(() => {
        const onWaiterSearch = (e) => {
            setSearchQuery(typeof e.detail === 'string' ? e.detail : '');
        };
        window.addEventListener('waiter-search', onWaiterSearch);
        return () => window.removeEventListener('waiter-search', onWaiterSearch);
    }, []);

    return searchQuery;
};

export const matchesOrderSearch = (order, query) => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    if (!order) return false;
    const itemList = Array.isArray(order.orderItems)
        ? order.orderItems
        : (Array.isArray(order.items) ? order.items : []);
    const itemText = itemList.map((i) => i.name || '').join(' ').toLowerCase();
    const shortId = order._id ? String(order._id).slice(-6).toLowerCase() : '';
    return (
        String(order._id || '').toLowerCase().includes(q) ||
        shortId.includes(q) ||
        String(order.tableNumber || '').toLowerCase().includes(q) ||
        String(order.customerName || '').toLowerCase().includes(q) ||
        String(order.status || '').toLowerCase().includes(q) ||
        String(order.orderType || '').toLowerCase().includes(q) ||
        itemText.includes(q)
    );
};
