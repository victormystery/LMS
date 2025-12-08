import api from "@/lib/api_clean";

export interface PaymentSummary {
  total_unpaid: number;
  total_paid: number;
  count_unpaid: number;
  count_paid: number;
}

export interface BorrowWithPayment {
  id: number;
  user_id: number;
  book_id: number;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  fee_applied: number;
  payment_status: string;
  paid_at: string | null;
  username?: string;
  full_name?: string;
  role?: string;
  message?: string;
  borrow_id?: number;
  fee_paid?: number;
  book_title?: string;
}

export const paymentService = {
  // Pay a late fee
  payLateFee: async (borrowId: number): Promise<BorrowWithPayment> => {
    const response = await api.post(`/api/payments/pay/${borrowId}`);
    return response.data;
  },

  // Get unpaid fees for current user
  getUnpaidFees: async (): Promise<BorrowWithPayment[]> => {
    const response = await api.get("/api/payments/unpaid");
    return response.data;
  },

  // Get payment summary for current user
  getPaymentSummary: async (): Promise<PaymentSummary> => {
    const response = await api.get("/api/payments/summary");
    return response.data;
  },

  // Get all payment summary (librarian only)
  getAllPaymentSummary: async (): Promise<PaymentSummary> => {
    const response = await api.get("/api/payments/all-summary");
    return response.data;
  },

  // Get all unpaid fees (librarian only)
  getAllUnpaidFees: async (): Promise<BorrowWithPayment[]> => {
    const response = await api.get("/api/payments/all-unpaid");
    return response.data;
  },

  // Get payment history for current user
  getPaymentHistory: async (statusFilter?: string): Promise<BorrowWithPayment[]> => {
    const params = statusFilter ? `?status_filter=${statusFilter}` : '';
    const response = await api.get(`/api/payments/history${params}`);
    return response.data;
  },

  // Get all payment history (librarian only)
  getAllPaymentHistory: async (statusFilter?: string, limit: number = 100): Promise<BorrowWithPayment[]> => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    params.append('limit', limit.toString());
    const response = await api.get(`/api/payments/all-history?${params}`);
    return response.data;
  },
};
