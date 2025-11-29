import api from "@/lib/api";

export type BookCreate = {
  title: string;
  author: string;
  isbn: string;
  total_copies?: number;
  description?: string;
};

export type BookRead = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  description?: string;
};

export type BookUpdate = Partial<{
  title: string;
  author: string;
  total_copies: number;
  description: string;
}>;

export const booksService = {
  // List books; optional query string search
  getBooks: async (q?: string) => {
    const path = q ? `/api/books/?q=${encodeURIComponent(q)}` : `/api/books/`;
    const resp = await api.get(path);
    return resp.data as BookRead[];
  },

  getBook: async (id: number) => {
    const resp = await api.get(`/api/books/${id}`);
    return resp.data as BookRead;
  },

  createBook: async (bookData: BookCreate) => {
    // Protected - requires librarian
    const resp = await api.fetchWithAuth(`/api/books/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    return resp as BookRead;
  },

  updateBook: async (id: number, patch: BookUpdate) => {
    const resp = await api.fetchWithAuth(`/api/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return resp as BookRead;
  },

  deleteBook: async (isbn: string) => {
    const resp = await api.fetchWithAuth(`/api/books/${encodeURIComponent(isbn)}`, {
      method: "DELETE",
    });
    return resp as { detail: string } | null;
  },
};

export default booksService;
