"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastApiError } from "@/lib/toast-api-error";
import {
  getTelegramBroadcastStats,
  sendTelegramBroadcast,
  type TelegramBroadcastPayload,
  type TelegramMediaType,
  type TelegramBroadcastTarget,
} from "@/services/staff.service";

const MEDIA_OPTIONS: { value: TelegramMediaType; label: string }[] = [
  { value: "none", label: "Text only" },
  { value: "photo", label: "Photo (file_id)" },
  { value: "video", label: "Video (file_id)" },
  { value: "animation", label: "GIF / animation (file_id)" },
];

export function BroadcastPanel({ actorRole }: { actorRole: string }) {
  const role = actorRole.toLowerCase();
  const canSend = ["super_admin", "admin"].includes(role);

  const [target, setTarget] = useState<TelegramBroadcastTarget>("channel");
  const [text, setText] = useState("");
  const [mediaType, setMediaType] = useState<TelegramMediaType>("none");
  const [fileId, setFileId] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");

  const statsQuery = useQuery({
    queryKey: ["staff", "telegram", "broadcast-stats"],
    queryFn: getTelegramBroadcastStats,
    enabled: canSend,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: TelegramBroadcastPayload) =>
      sendTelegramBroadcast(payload),
    onSuccess: (result) => {
      toast.success(
        `Sent ${result.sent}/${result.audience} · failed ${result.failed}`
      );
    },
    onError: (err) => toastApiError(err, "Broadcast failed"),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    if (!text.trim() && !fileId.trim()) {
      toast.error("Add message text and/or a Telegram file_id");
      return;
    }
    if (mediaType !== "none" && !fileId.trim()) {
      toast.error("Paste the Telegram file_id for this media type");
      return;
    }
    const hasBtn = Boolean(buttonText.trim() || buttonUrl.trim());
    if (hasBtn && (!buttonText.trim() || !buttonUrl.trim())) {
      toast.error("Button needs both label and URL");
      return;
    }
    if (
      target === "bot" &&
      statsQuery.data &&
      statsQuery.data.botAudience === 0
    ) {
      toast.error("No users with Telegram IDs yet");
      return;
    }

    const payload: TelegramBroadcastPayload = {
      target,
      text: text.trim(),
      mediaType,
      fileId: fileId.trim() || undefined,
      buttonText: buttonText.trim() || undefined,
      buttonUrl: buttonUrl.trim() || undefined,
    };

    const audienceLabel =
      target === "channel"
        ? "the Telegram channel"
        : `${statsQuery.data?.botAudience ?? "all"} bot users`;

    if (
      !window.confirm(
        `Send this broadcast to ${audienceLabel}? This cannot be undone.`
      )
    ) {
      return;
    }
    sendMutation.mutate(payload);
  };

  if (!canSend) {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-6 text-sm text-sky-950">
        Broadcast requires <code>admin</code> or <code>super_admin</code>.
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
            Telegram
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Broadcast
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Post to the channel or DM everyone who started the bot. Use Telegram
            HTML for rich text, and paste a <code>file_id</code> from your file
            detector bot for photo / video / GIF.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Bot audience
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">
            {statsQuery.isLoading ? "…" : (stats?.botAudience ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            users with telegram_id
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Channel
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {stats?.channelConfigured ? "Ready" : "Not set"}
          </p>
          <p className="mt-1 text-xs text-slate-500">CHANNEL_ID in backend .env</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Bot token
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {stats?.botConfigured ? "Ready" : "Not set"}
          </p>
          <p className="mt-1 text-xs text-slate-500">BOT_TOKEN in backend .env</p>
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">Send via</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "channel", label: "Channel" },
                { id: "bot", label: "Bot DMs" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTarget(opt.id)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  target === opt.id
                    ? "bg-[var(--brand-blue)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-800">
            Message (Telegram HTML)
          </label>
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'<b>Title</b>\nLine two\n<a href="https://…">Link</a>'}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[var(--brand-blue)] focus:outline-hidden"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Supported tags:{" "}
            <code>&lt;b&gt;</code> <code>&lt;i&gt;</code> <code>&lt;u&gt;</code>{" "}
            <code>&lt;s&gt;</code> <code>&lt;code&gt;</code>{" "}
            <code>&lt;a href=&quot;…&quot;&gt;</code>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Media type
            </label>
            <select
              value={mediaType}
              onChange={(e) =>
                setMediaType(e.target.value as TelegramMediaType)
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              {MEDIA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Telegram file_id
            </label>
            <Input
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              placeholder="Paste file_id from detector bot"
              disabled={mediaType === "none"}
            />
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Optional URL button
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Label
              </label>
              <Input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Join & bid"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                URL
              </label>
              <Input
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://t.me/… or https://…"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            <Megaphone className="mr-1 inline h-3.5 w-3.5" />
            {target === "channel"
              ? "Posts once to CHANNEL_ID"
              : `DMs ~${stats?.botAudience ?? 0} chats (rate-limited)`}
          </p>
          <Button
            type="submit"
            disabled={sendMutation.isPending || !stats?.botConfigured}
            className="rounded-xl bg-[var(--brand-blue)] font-bold text-white"
          >
            <Send className="mr-1.5 h-4 w-4" />
            {sendMutation.isPending ? "Sending…" : "Send broadcast"}
          </Button>
        </div>
      </form>
    </div>
  );
}
