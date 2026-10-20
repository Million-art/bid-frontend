import { apiFetch, type ApiResponse } from "@/lib/api";

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    bidId?: string;
    auctionId?: string;
    isRead: boolean;
    priority: string;
    createdAt: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    items?: Notification[];
    total: number;
    unreadCount: number;
}

export async function getNotifications(limit: number = 20, offset: number = 0): Promise<NotificationsResponse> {
    const response = await apiFetch<ApiResponse<NotificationsResponse>>(`/api/notifications?limit=${limit}&offset=${offset}`);
    const data = response?.data;
    return {
        notifications: data?.notifications ?? data?.items ?? [],
        total: data?.total ?? 0,
        unreadCount: data?.unreadCount ?? 0,
    };
}

export async function getUnreadCount(): Promise<number> {
    const response = await apiFetch<ApiResponse<{ count: number }>>('/api/notifications/unread/count');
    return response?.data?.count ?? 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
    await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
    });
}

export async function markAllAsRead(): Promise<void> {
    await apiFetch('/api/notifications/read-all', {
        method: 'PATCH',
    });
}

export async function deleteNotification(notificationId: string): Promise<void> {
    await apiFetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
    });
}
