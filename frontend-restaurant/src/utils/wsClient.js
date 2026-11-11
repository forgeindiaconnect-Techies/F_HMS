/**
 * Creates a leak-free reconnecting WebSocket connection with automatic cleanup
 * and JWT token inclusion for authenticated tenant channels.
 */
export const createReconnectingWebSocket = ({
    apiUrl,
    buildRegistrationPayload,
    onMessage,
    reconnectDelayMs = 5000,
}) => {
    let isUnmounted = false;
    let reconnectTimer = null;
    let ws = null;

    const getToken = () => {
        try {
            return (
                sessionStorage.getItem('token') ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('customer_token') ||
                localStorage.getItem('customer_token') ||
                null
            );
        } catch {
            return null;
        }
    };

    const connect = () => {
        if (isUnmounted) return;
        try {
            const wsURL = String(apiUrl || '').replace(/^http/, 'ws').replace(/\/api$/, '');
            if (!wsURL) return;

            ws = new WebSocket(wsURL);

            ws.onopen = () => {
                if (isUnmounted || !ws) return;
                const payload = typeof buildRegistrationPayload === 'function' ? buildRegistrationPayload() : {};
                const token = getToken();
                ws.send(JSON.stringify({
                    type: 'register',
                    ...(token ? { token } : {}),
                    ...payload,
                }));
            };

            ws.onmessage = (event) => {
                if (isUnmounted || typeof onMessage !== 'function') return;
                try {
                    const msg = JSON.parse(event.data);
                    onMessage(msg);
                } catch {
                    // Ignore malformed WS packets
                }
            };

            ws.onclose = () => {
                if (!isUnmounted) {
                    reconnectTimer = setTimeout(connect, reconnectDelayMs);
                }
            };

            ws.onerror = () => {
                // Close handler handles retry when appropriate
            };
        } catch {
            if (!isUnmounted) {
                reconnectTimer = setTimeout(connect, reconnectDelayMs);
            }
        }
    };

    connect();

    return () => {
        isUnmounted = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (ws) {
            try {
                ws.onclose = null;
                ws.close();
            } catch {
                // ignore
            }
        }
    };
};

