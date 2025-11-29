import api from "@/lib/api_clean";

export type BorrowRequest = {
  book_id: number;
};

export type BorrowRead = {
  id: number;
  user_id: number;
  book_id: number;
  borrowed_at: string; // ISO datetime
  due_date: string;
  returned_at?: string | null;
  fee_applied: number;
};

export const borrowsService = {
  borrowBook: async (payload: BorrowRequest): Promise<BorrowRead> => {
    const res = await api.fetchWithAuth(`/api/borrows/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res as BorrowRead;
  },

  returnBook: async (borrowId: number): Promise<BorrowRead> => {
    const res = await api.fetchWithAuth(`/api/borrows/return/${borrowId}`, {
      method: "POST",
    });
    return res as BorrowRead;
  },

  myBorrows: async (): Promise<BorrowRead[]> => {
    const res = await api.fetchWithAuth(`/api/borrows/me`, {
      method: "GET",
    });
    return res as BorrowRead[];
  },
};

export default borrowsService;
