import { apiFetch, type ApiResponse } from "@/lib/api";

export type ShareTelegramContactPayload = {
  telegramId: number;
  phone: string;
  fullName?: string;
  username?: string;
};

export async function shareTelegramContact(
  payload: ShareTelegramContactPayload
): Promise<{ telegramId: number; phone: string; userId?: string }> {
  const res = await apiFetch<
    ApiResponse<{ telegramId: number; phone: string; userId?: string }>
  >("/api/telegram/share-contact", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuthRedirect: true,
  });
  return res.data;
}
