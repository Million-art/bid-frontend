"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Bell,
    Check,
    Trash2,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { SimplePagination } from "@/components/ui/pagination";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    type Notification
} from "@/services/notifications.service";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { toastApiError } from "@/lib/toast-api-error";

const LIMIT = 15;

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const loadNotifications = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const offset = (page - 1) * LIMIT;
            const data = await getNotifications(LIMIT, offset);
            setNotifications(data.notifications);
            setTotal(data.total);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error("Failed to load notifications:", error);
            toastApiError(error, "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications(currentPage);
    }, [currentPage, loadNotifications]);

    const handleMarkAsRead = async (id: string) => {
        setActionLoading(id);
        try {
            await markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.success("Marked as read");
        } catch (error) {
            toastApiError(error, "Failed to mark as read");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        setActionLoading(id + "-delete");
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setTotal(prev => prev - 1);
            toast.success("Notification deleted");
        } catch (error) {
            toastApiError(error, "Failed to delete notification");
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            toastApiError(error, "Failed to mark all as read");
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 pt-24">
            <div className="container mx-auto max-w-4xl px-4">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-2"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="mt-1 text-slate-500">
                            Manage your alerts and winner confirmations.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-100 disabled:opacity-50"
                            >
                                <Check className="h-4 w-4" />
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>

                {/* List Container */}
                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                        {loading && !notifications.length ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="rounded-3xl bg-slate-50 p-8 mb-6 shadow-inner border border-slate-100">
                                    <Bell className="h-12 w-12 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">No notifications yet</h3>
                                <p className="mt-2 text-slate-500 max-w-xs font-medium">
                                    When you join auctions or win prizes, we&apos;ll notify you here.
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`group relative flex gap-5 p-6 transition-all hover:bg-slate-50 ${!notification.isRead ? "bg-primary-50/30" : ""
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] text-2xl shadow-sm ${getPriorityStyles(notification.priority)
                                            }`}>
                                            {getIconForType(notification.type)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className={`text-lg font-bold truncate ${!notification.isRead ? "text-slate-900" : "text-slate-700"
                                                        }`}>
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.isRead && (
                                                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary-600" />
                                                    )}
                                                </div>
                                                <p className="text-slate-600 leading-relaxed font-medium">
                                                    {notification.message}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        disabled={actionLoading === notification.id}
                                                        className="p-2.5 rounded-xl text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all active:scale-90"
                                                        title="Mark as read"
                                                    >
                                                        {actionLoading === notification.id ? (
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                        ) : (
                                                            <Check className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(notification.id)}
                                                    disabled={actionLoading === notification.id + "-delete"}
                                                    className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                                                    title="Delete"
                                                >
                                                    {actionLoading === notification.id + "-delete" ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-6 text-xs">
                                            <span className="text-slate-500 font-bold bg-slate-100 py-1 px-3 rounded-full">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                            {notification.actionUrl && (
                                                <Link
                                                    href={notification.actionUrl}
                                                    className="font-black text-primary-600 hover:text-primary-700 uppercase tracking-wider flex items-center gap-1.5 transition-colors group/link"
                                                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                                >
                                                    {notification.actionLabel || "View Details"}
                                                    <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                            ))}
                    </div>

                    {/* Footer / Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-6">
                            <SimplePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Mobile Statistics hint */}
                <div className="mt-6 px-4 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing {Math.min(notifications.length, total)} of {total} notifications
                    </p>
                </div>
            </div>
        </div>
    );
}

function getIconForType(type: string) {
    switch (type) {
        case 'winner_confirmation_request': return '🏆';
        case 'payout_ready': return '💸';
        case 'payout_completed': return '💰';
        case 'prize_not_delivered': return '🚨';
        case 'bid_approved':
        case 'auction_approved':
            return '🔨';
        case 'bid_rejected':
        case 'auction_rejected':
            return '🛑';
        case 'bid_submitted':
        case 'auction_submitted':
            return '📝';
        case 'bid_drawn':
        case 'auction_closed':
            return '🏆';
        case 'winner_compensated': return '💵';
        case 'legal_document_updated': return '📜';
        default: return '✨';
    }
}

function getPriorityStyles(priority: string) {
    switch (priority) {
        case 'urgent':
            return "bg-red-50 border border-red-100 text-red-600";
        case 'high':
            return "bg-orange-50 border border-orange-100 text-orange-600";
        default:
            return "bg-slate-50 border border-slate-100 text-slate-400";
    }
}
