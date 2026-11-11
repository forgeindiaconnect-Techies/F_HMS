import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let wss;
const clients = new Map(); // ws -> { restaurantId, role, orderId, userId }

const extractId = (id) => {
    if (!id) return '';
    if (typeof id === 'object') return String(id._id || id.id || '');
    const str = String(id).trim();
    return (str === 'undefined' || str === 'null' || str === '[object Object]') ? '' : str;
};

export const initWebSocket = (server) => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                if (data.type === 'register') {
                    let restaurantId = extractId(data.restaurantId);
                    let role = data.role ? String(data.role).trim() : null;
                    let userId = null;

                    // Verify token if provided so role & restaurantId cannot be spoofed
                    if (data.token) {
                        try {
                            const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'supersecretjwtkey123');
                            const authUser = await User.findById(decoded.id).select('_id role restaurantId branchId isActive').lean();
                            if (authUser && authUser.isActive !== false) {
                                userId = String(authUser._id);
                                role = authUser.role;
                                if (authUser.restaurantId) {
                                    restaurantId = extractId(authUser.restaurantId);
                                }
                            }
                        } catch (jwtErr) {
                            // Token invalid — clear claimed staff context
                            restaurantId = '';
                            role = 'guest';
                        }
                    }

                    clients.set(ws, {
                        restaurantId: restaurantId || null,
                        role,
                        orderId: extractId(data.orderId) || null,
                        userId,
                    });
                } else if (data.type === 'delivery_location_update' || data.type === 'deliveryLocationUpdate') {
                    const { orderId, latitude, longitude } = data;
                    const clientInfo = clients.get(ws);
                    if (orderId && latitude != null && longitude != null) {
                        const lat = Number(latitude);
                        const lng = Number(longitude);
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

                        try {
                            const Order = (await import('../models/Order.js')).default;
                            const order = await Order.findById(orderId);
                            if (order) {
                                // Enforce tenant / partner matching when registered
                                if (clientInfo?.restaurantId && String(clientInfo.restaurantId) !== String(order.restaurantId)) {
                                    return;
                                }
                                if (clientInfo?.userId && order.deliveryPartner && String(order.deliveryPartner) !== String(clientInfo.userId) && !['RestaurantAdmin', 'BranchManager', 'SuperAdmin'].includes(clientInfo.role)) {
                                    return;
                                }

                                const updatedAt = new Date();
                                order.deliveryPartnerLocation = {
                                    latitude: lat,
                                    longitude: lng,
                                    updatedAt,
                                };
                                await order.save();

                                const payload = {
                                    orderId: String(order._id),
                                    latitude: lat,
                                    longitude: lng,
                                    updatedAt,
                                    deliveryStatus: order.deliveryStatus,
                                    status: order.status,
                                };

                                broadcastToCustomerOrder(order._id, 'delivery_location_updated', payload);
                                broadcastToRestaurant(order.restaurantId, 'delivery_location_updated', payload);
                            }
                        } catch (locErr) {
                            console.error('Error saving websocket delivery location update', locErr);
                        }
                    }
                }
            } catch (err) {
                console.error('Error parsing WebSocket message', err);
            }
        });

        ws.on('close', () => {
            clients.delete(ws);
        });
    });
};

export const broadcastToRestaurant = (restaurantId, eventType, payload) => {
    if (!wss) return;

    const targetRestId = extractId(restaurantId);
    if (!targetRestId) return; // Never broadcast restaurant-private events globally

    const message = JSON.stringify({ type: eventType, data: payload });

    clients.forEach((clientInfo, ws) => {
        if (ws.readyState === 1) {
            const clientRestId = extractId(clientInfo?.restaurantId);
            if (clientRestId && clientRestId === targetRestId) {
                try {
                    ws.send(message);
                } catch (e) {
                    console.error('Error broadcasting to WS client', e);
                }
            }
        }
    });
};

export const broadcastToCustomerOrder = (orderId, eventType, payload) => {
    if (!wss) return;

    const targetOrderId = extractId(orderId);
    if (!targetOrderId) return;

    const message = JSON.stringify({ type: eventType, data: payload });

    clients.forEach((clientInfo, ws) => {
        if (ws.readyState === 1) {
            const clientOrderId = extractId(clientInfo?.orderId);
            if (clientOrderId && clientOrderId === targetOrderId) {
                try {
                    ws.send(message);
                } catch (e) {
                    console.error('Error broadcasting customer order WS', e);
                }
            }
        }
    });
};
