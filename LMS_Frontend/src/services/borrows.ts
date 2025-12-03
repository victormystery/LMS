import api, { absoluteUrl } from "@/lib/api_clean";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------
export type BorrowCreate = {
  book_id: number;
};

export type BorrowRead = {
  id: number;
  user_id: number;
  book_id: number;

  borrowed_at: string;
  due_date: string;
  returned_at?: string | null;

  fee_applied: number;

  book?: {
    title?: string;
    author?: string;
    isbn?: string;
    cover_url?: string;
  };
};

// ------------------------------------------------------
// SERVICE
// ------------------------------------------------------
export const borrowsService = {
  // --------------------------------------------------
  // BORROW A BOOK
  // --------------------------------------------------
  async borrowBook(payload: BorrowCreate): Promise<BorrowRead> {
    const resp = await api.fetchWithAuth(`/api/borrows/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return resp as BorrowRead;
  },

  // --------------------------------------------------
  // RETURN BOOK
  // --------------------------------------------------
  async returnBook(borrowId: number): Promise<any> {
    const resp = await api.fetchWithAuth(`/api/borrows/${borrowId}/return`, {
      method: "POST",
    });

    return resp;
  },

  // --------------------------------------------------
  // USER — LIST MY BORROWS (Optional history)
  // --------------------------------------------------
  async myBorrows(includeHistory = false): Promise<BorrowRead[]> {
    const resp = await api.fetchWithAuth(
      `/api/borrows/my?history=${includeHistory ? "1" : "0"}`
    );

    const list = (resp || []) as BorrowRead[];

    // normalize cover URLs
    return list.map((b) => ({
      ...b,
      book: b.book
        ? {
            ...b.book,
            cover_url: absoluteUrl(b.book.cover_url),
          }
        : undefined,
    }));
  },

  // --------------------------------------------------
  // LIBRARIAN — LIST ALL BORROWS
  // --------------------------------------------------
  async listAll(): Promise<BorrowRead[]> {
    const resp = await api.fetchWithAuth(`/api/borrows/`);

    const list = (resp || []) as BorrowRead[];

    return list.map((b) => ({
      ...b,
      book: b.book
        ? {
            ...b.book,
            cover_url: absoluteUrl(b.book.cover_url),
          }
        : undefined,
    }));
  },

  // --------------------------------------------------
  // LIST OVERDUE BORROWS
  // --------------------------------------------------
  async overdueBorrows(): Promise<BorrowRead[]> {
    const resp = await api.fetchWithAuth(`/api/borrows/overdue`);

    const list = (resp || []) as BorrowRead[];

    return list.map((b) => ({
      ...b,
      book: b.book
        ? {
            ...b.book,
            cover_url: absoluteUrl(b.book.cover_url),
          }
        : undefined,
    }));
  },
};

export default borrowsService;
