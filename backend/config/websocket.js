import { WebSocketServer } from 'ws';

let wss;
const clients = new Map(); // ws -> { restaurantId, role, orderId }

export const initWebSocket = (server) => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('New WebSocket Connection');

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'register') {
                    clients.set(ws, {
                        restaurantId: data.restaurantId || null,
                        role: data.role || null,
                        orderId: data.orderId || null
                    });
                    console.log(`Registered connection: role=${data.role}, restaurantId=${data.restaurantId}`);
                }
            } catch (err) {
                console.error('Error parsing WebSocket message', err);
            }
        });

        ws.on('close', () => {
            clients.delete(ws);
            console.log('WebSocket Connection Closed');
        });
    });
};

const extractId = (id) => {
    if (!id) return '';
    if (typeof id === 'object') return String(id._id || id.id || id);
    return String(id);
};

export const broadcastToRestaurant = (restaurantId, eventType, payload) => {
    if (!wss) return;

    const targetRestId = extractId(restaurantId);
    const message = JSON.stringify({ type: eventType, data: payload });

    clients.forEach((clientInfo, ws) => {
        if (ws.readyState === 1) {
            const clientRestId = extractId(clientInfo?.restaurantId);
            
            // Broadcast if target matches client, or if client/target is generic staff connection
            if (!targetRestId || !clientRestId || clientRestId === targetRestId || clientRestId === '[object Object]') {
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
    const message = JSON.stringify({ type: eventType, data: payload });

    clients.forEach((clientInfo, ws) => {
        if (ws.readyState === 1) {
            const clientOrderId = extractId(clientInfo?.orderId);
            if (!targetOrderId || !clientOrderId || clientOrderId === targetOrderId || clientOrderId === '[object Object]') {
                try {
                    ws.send(message);
                } catch (e) {
                    console.error('Error broadcasting customer order WS', e);
                }
            }
        }
    });
};
