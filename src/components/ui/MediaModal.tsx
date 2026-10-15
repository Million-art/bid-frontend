"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'image' | 'video';
    url: string;
}

export const MediaModal: React.FC<MediaModalProps> = ({ isOpen, onClose, type, url }) => {
    // Lock scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Helper to get YouTube embed URL
    const getEmbedUrl = (rawUrl: string) => {
        if (rawUrl.includes('youtube.com/watch?v=')) {
            return rawUrl.replace('watch?v=', 'embed/');
        }
        if (rawUrl.includes('youtu.be/')) {
            const id = rawUrl.split('/').pop();
            return `https://www.youtube.com/embed/${id}`;
        }
        return rawUrl;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                    />

                    {/* Content Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative z-10 max-h-full w-full max-w-6xl overflow-hidden rounded-3xl bg-black shadow-2xl"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex h-full w-full items-center justify-center bg-black">
                            {type === 'image' ? (
                                <img
                                    src={url}
                                    alt="Preview"
                                    className="max-h-[85vh] w-full object-contain"
                                />
                            ) : (
                                <div className="aspect-video w-full max-w-5xl">
                                    <iframe
                                        src={`${getEmbedUrl(url)}?autoplay=1`}
                                        className="h-full w-full border-none"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title="Raffle Video"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
