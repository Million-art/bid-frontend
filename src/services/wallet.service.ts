import { apiFetch, type ApiResponse } from "@/lib/api";

export interface WalletBalance {
    availableBalance: number;
    pendingBalance: number;
}

export interface WalletTransaction {
    id: string;
    amount: number;
    type: string;
    status: string;
    description: string;
    createdAt: string;
    referenceId?: string;
}

export interface TransactionsResponse {
    transactions: WalletTransaction[];
    total: number;
    page: number;
    limit: number;
}

export const walletService = {
    async getBalance(): Promise<WalletBalance> {
        const response = await apiFetch<ApiResponse<WalletBalance>>(
            "/api/me/wallet"
        );
        return response.data;
    },

    async getTransactions(page = 1, limit = 10): Promise<TransactionsResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        const response = await apiFetch<ApiResponse<TransactionsResponse>>(
            `/api/me/wallet/transactions?${params.toString()}`
        );
        return response.data;
    },
};
