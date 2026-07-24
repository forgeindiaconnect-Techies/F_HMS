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

export const broadcastToRestaurant = (restaurantId, eventType, payload) => {
    if (!wss) return;
    const message = JSON.stringify({ type: eventType, data: payload });

    clients.forEach((clientInfo, ws) => {
        if (ws.readyState === 1 && String(clientInfo.restaurantId) === String(restaurantId)) {
            ws.send(message);
        }
    });
};

export const broadcastToCustomerOrder = (orderId, eventType, payload) => {
    if (!wss) return;
    const message = JSON.stringify({ type: eventType, data: payload });

    clients.forEach((clientInfo, ws) => {
        if (ws.readyState === 1 && String(clientInfo.orderId) === String(orderId)) {
            ws.send(message);
        }
    });
};
