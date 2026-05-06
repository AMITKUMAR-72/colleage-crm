import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085';
const WEBSOCKET_URL = `${BASE_URL}/ws`;

export const createWebSocketClient = (onMessageReceived: (message: any) => void) => {
    console.log('[WebSocket] Initializing with URL:', WEBSOCKET_URL);
    
    const client = new Client({
        webSocketFactory: () => {
            console.log('[WebSocket] Factory invoked, creating SockJS instance...');
            const socket = new SockJS(WEBSOCKET_URL);
            return socket;
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
        console.log('[WebSocket] Connected successfully to:', WEBSOCKET_URL);
        
        // Subscribe to all dashboard topics
        const topics = [
            '/topic/dashboard/summary',
            '/topic/dashboard/lead-volume',
            '/topic/dashboard/campaign-stats',
            '/topic/dashboard/counselor-stats',
            '/topic/dashboard/city-stats'
        ];

        topics.forEach(topic => {
            console.log(`[WebSocket] Subscribing to ${topic}`);
            client.subscribe(topic, (message) => {
                const body = JSON.parse(message.body);
                onMessageReceived({ 
                    type: body.type || 'UPDATE', 
                    data: body.data || body 
                });
            });
        });
    };

    client.onStompError = (frame) => {
        console.error('[WebSocket] STOMP Error:', frame.headers['message']);
        console.error('[WebSocket] Details:', frame.body);
    };

    client.onWebSocketError = (event) => {
        console.error('[WebSocket] Transport Error:', event);
    };

    client.onWebSocketClose = () => {
        console.warn('[WebSocket] Connection closed');
    };

    client.onDisconnect = () => {
        console.log('[WebSocket] Disconnected');
    };

    return client;
};
