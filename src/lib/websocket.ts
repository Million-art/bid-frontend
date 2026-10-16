export type WebSocketMessageType =
    | 'bid_update'
    | 'bid_locked'
    | 'bid_executed'
    | 'bid_countdown'
    | 'draw_started'
    | 'bid_approved'
    | 'subscribe'
    | 'unsubscribe'
    | 'notification'
    | 'user_notification'
    | 'authenticate'
    | 'auth_success'
    | 'auth_error';

export interface WebSocketMessage {
    type: WebSocketMessageType;
    bidId?: string;
    auctionId?: string;
    token?: string;
    data?: Record<string, unknown>;
}

// WebSocket client for live notifications and auction updates

class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10; // Increased
    private reconnectDelay = 1000;
    private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
    private subscriptions: Set<string> = new Set();
    private authenticated = false;

    constructor(url: string) {
        this.url = url;
    }

    connect(): Promise<void> {
        // Use 127.0.0.1 instead of localhost for IPv4/IPv6 consistency if needed, 
        // URL comes from ENV so we use as is.
        return new Promise((resolve, reject) => {
            try {
                // Remove token from URL for security
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    this.reconnectAttempts = 0;

                    this.subscriptions.forEach((topicId) => {
                        this.send({
                            type: 'subscribe',
                            bidId: topicId,
                            auctionId: topicId,
                        });
                    });

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        this.handleInternalMessage(message);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('[WebSocket] Failed to parse message:', error);
                    }
                };

                this.ws.onerror = (event: Event) => {
                    // DOM Event doesn't serialize; extract useful context for debugging.
                    const target = event.target as WebSocket | null;
                    const detail = {
                        type: event.type,
                        url: target?.url,
                        readyState: target?.readyState,
                        readyStateLabel: target ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][target.readyState] : 'unknown',
                    };
                    console.error('[WebSocket] Error:', JSON.stringify(detail));
                    if (this.ws?.readyState !== WebSocket.OPEN) {
                        reject(new Error(`WebSocket error: ${detail.readyStateLabel} at ${detail.url ?? 'unknown'}`));
                    }
                };

                this.ws.onclose = () => {
                    this.authenticated = false;
                    this.handleReconnect();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private handleInternalMessage(message: WebSocketMessage) {
        if (message.type === 'auth_success') {
            this.authenticated = true;
        } else if (message.type === 'auth_error') {
            this.authenticated = false;
            console.error('[WebSocket] Authentication failed:', message.data?.error);
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            // Exponential backoff with jitter
            const baseDelay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            const jitter = Math.random() * 1000;
            const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30s

            setTimeout(() => {
                this.connect().catch(() => {
                    // Fail silently, onclose will trigger next attempt
                });
            }, delay);
        } else {
            console.error('[WebSocket] Max reconnect attempts reached');
        }
    }

    private handleMessage(message: WebSocketMessage) {
        const { type, bidId, auctionId, data } = message;
        const topicId = auctionId || bidId;

        const typeListeners = this.listeners.get(type);
        if (typeListeners) {
            typeListeners.forEach((callback) =>
                callback({ bidId, auctionId: topicId, ...data })
            );
        }

        if (topicId) {
            const topicListeners =
                this.listeners.get(`auction:${topicId}`) ||
                this.listeners.get(`bid:${topicId}`);
            if (topicListeners) {
                topicListeners.forEach((callback) => callback({ type, ...data }));
            }
        }
    }

    authenticate(token: string) {
        this.send({
            type: 'authenticate',
            token,
        });
    }

    send(message: WebSocketMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('[WebSocket] Cannot send message, not connected');
        }
    }

    subscribe(topicId: string) {
        this.subscriptions.add(topicId);
        if (this.isConnected()) {
            this.send({
                type: 'subscribe',
                bidId: topicId,
                auctionId: topicId,
            });
        }
    }

    unsubscribe(topicId: string) {
        this.subscriptions.delete(topicId);
        if (this.isConnected()) {
            this.send({
                type: 'unsubscribe',
                bidId: topicId,
                auctionId: topicId,
            });
        }
    }

    on<T = unknown>(event: string, callback: (data: T) => void) {
        const stored = callback as (data: unknown) => void;
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(stored);

        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(event);
            if (listeners) {
                listeners.delete(stored);
                if (listeners.size === 0) {
                    this.listeners.delete(event);
                }
            }
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.onclose = null; // Prevent reconnect on intentional disconnect
            this.ws.close();
            this.ws = null;
        }
        this.authenticated = false;
        this.listeners.clear();
        this.subscriptions.clear();
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    isAuthenticated(): boolean {
        return this.authenticated;
    }
}

// Singleton instance
const getWsUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Check if development environment (localhost, 127.x, local network IPs, or .local domains)
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.endsWith(".local");

    if (isLocal) {
      // Connect to the local backend on port 8080 relative to current hostname
      return `ws://${hostname}:8080/ws`;
    }
  }
  return "wss://adminbackend.carramarket.com/ws";
};

const WS_URL = getWsUrl();
if (!WS_URL) {
  console.warn("NEXT_PUBLIC_WS_URL is not set. WebSocket functionality will be disabled.");
}

let wsClient: WebSocketClient | null = null;

// Only initialize on client side
if (typeof window !== 'undefined' && WS_URL) {
    wsClient = new WebSocketClient(WS_URL);
    // Don't connect immediately at module load to avoid unnecessary connections on public pages
    // Components should call connect() when needed, or we connect here if likely needed
    // For now, let's keep the auto-connect but only if we are on a page that actually needs it?
    // Actually, many pages do. Let's keep it but make it more robust.
    wsClient.connect().catch(console.error);
}

export { wsClient };
