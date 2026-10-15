"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
import { Button } from "./button";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: "danger" | "primary";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    variant = "primary",
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md bg-white border border-slate-200 text-slate-600 p-0 overflow-hidden shadow-2xl rounded-[2rem]">
                <DialogHeader className="px-6 pt-6 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${variant === "danger"
                                    ? "bg-red-50 text-red-600 border border-red-100"
                                    : "bg-primary-50 text-primary-600 border border-primary-100"
                                }`}
                        >
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-slate-900 text-lg font-bold">{title}</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="px-6 py-4">
                    <DialogDescription className="text-slate-500 leading-relaxed text-sm">
                        {message}
                    </DialogDescription>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 rounded-b-[2rem]">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="rounded-xl border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === "danger" ? "destructive" : "primary"}
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={`rounded-xl px-5 text-sm font-bold shadow-lg ${variant === "danger" ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/10" : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/10"}`}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
