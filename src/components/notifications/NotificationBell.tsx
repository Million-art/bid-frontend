"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount, type Notification } from '@/services/notifications.service';
import { formatDistanceToNow } from 'date-fns';
import { wsClient } from '@/lib/websocket';
import { toast } from 'sonner';

export const NotificationBell: React.FC<{ className?: string }> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load notifications when dropdown opens
    useEffect(() => {
        if (isOpen && notifications.length === 0) {
            loadNotifications();
        }
    }, [isOpen, notifications.length]);

    // Load unread count on mount and listen to web sockets
    useEffect(() => {
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 30000);

        let unsubscribe: (() => void) | undefined;

        if (wsClient) {
            unsubscribe = wsClient.on('user_notification', (msg: unknown) => {
                const m = msg as { type?: string; data?: Notification };
                if (m.type === 'notification' && m.data) {
                    const newNotif = m.data;
                    setNotifications(prev => {
                        // Prevent duplicates
                        if (prev.some(n => n.id === newNotif.id)) return prev;
                        return [newNotif, ...prev];
                    });
                    setUnreadCount(prev => prev + 1);

                    // Trigger real-time toast
                    toast.info(newNotif.title, {
                        description: newNotif.message,
                        action: newNotif.actionUrl ? {
                            label: newNotif.actionLabel || 'View',
                            onClick: () => window.location.href = newNotif.actionUrl!
                        } : undefined
                    });
                }
            });
        }

        return () => {
            clearInterval(interval);
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await getNotifications(20, 0);
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={className || "relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"}
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        aria-hidden="true"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed left-2 right-2 top-16 z-20 w-auto rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(92vw,24rem)]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[min(400px,calc(100vh-8rem))] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Bell className="mx-auto h-8 w-8 text-slate-400" />
                                    <p className="mt-2 text-sm text-slate-500">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`group relative px-4 py-3 transition-colors hover:bg-slate-50 ${!notification.isRead ? 'bg-primary-50/50' : ''
                                                }`}
                                        >
                                            {notification.actionUrl ? (
                                                <Link
                                                    href={notification.actionUrl}
                                                    onClick={() => {
                                                        if (!notification.isRead) {
                                                            markAsRead(notification.id);
                                                            setNotifications(prev =>
                                                                prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                                                            );
                                                            setUnreadCount(prev => Math.max(0, prev - 1));
                                                        }
                                                        setIsOpen(false);
                                                    }}
                                                    className="block"
                                                >
                                                    <NotificationContent notification={notification} />
                                                </Link>
                                            ) : (
                                                <NotificationContent notification={notification} />
                                            )}

                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    className="absolute right-2 top-2 rounded-full p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-200 hover:text-slate-900 group-hover:opacity-100"
                                                    aria-label="Mark as read"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t border-slate-100 px-4 py-2">
                                <Link
                                    href="/notifications"
                                    className="block text-center text-xs font-semibold text-primary-600 hover:text-primary-700"
                                    onClick={() => setIsOpen(false)}
                                >
                                    View all notifications
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const NotificationContent: React.FC<{ notification: Notification }> = ({ notification }) => {
    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0 text-xl">
                {notification.type === 'winner_confirmation_request' && '🏆'}
                {notification.type === 'payout_ready' && '💸'}
                {notification.type === 'payout_completed' && '💰'}
                {notification.type === 'prize_not_delivered' && '🚨'}
                {(notification.type === 'raffle_approved' || notification.type === 'auction_approved') && '🔨'}
                {(notification.type === 'raffle_rejected' || notification.type === 'auction_rejected') && '🛑'}
                {(notification.type === 'raffle_submitted' || notification.type === 'auction_submitted') && '📝'}
                {(notification.type === 'raffle_drawn' || notification.type === 'auction_closed') && '🏆'}
                {notification.type === 'winner_compensated' && '💵'}
                {notification.type === 'legal_document_updated' && '📜'}
                {!['winner_confirmation_request', 'payout_ready', 'payout_completed', 'prize_not_delivered', 'raffle_approved', 'raffle_rejected', 'raffle_submitted', 'raffle_drawn', 'auction_approved', 'auction_rejected', 'auction_submitted', 'auction_closed', 'winner_compensated', 'legal_document_updated'].includes(notification.type) && '✨'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{notification.message}</p>
                {notification.actionLabel && (
                    <p className="mt-1 text-xs font-semibold text-primary-600">
                        {notification.actionLabel} →
                    </p>
                )}
                <p className="mt-1 text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
            </div>
            {!notification.isRead && (
                <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary-600" />
                </div>
            )}
        </div>
    );
};
