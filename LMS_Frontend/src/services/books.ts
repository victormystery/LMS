import api, { API_URL } from "@/lib/api_clean";

// --------------------------------------------------
// Types
// --------------------------------------------------

export type BookCreate = {
  title: string;
  author: string;
  isbn: string;
  total_copies?: number;
  description?: string;
  category?: string;
  publisher?: string;
  publication_year?: number;
  book_format?: string;
  shelf?: string;
  subcategory?: string;
};

export type BookRead = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  description?: string;
  category?: string;
  publisher?: string;
  publication_year?: number;
  book_format?: string;
  shelf?: string;
  subcategory?: string;
  cover_url?: string;
};

export type BookUpdate = Partial<BookCreate & { cover_url?: string }>;

// --------------------------------------------------
// Helper
// --------------------------------------------------

function normalizeIsbn(isbn: string) {
  return isbn.replace(/[^0-9]/g, "");
}

export function absoluteUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

// --------------------------------------------------
// Books Service
// --------------------------------------------------

export const booksService = {
  // ----------------------------------------------
  // Fetch categories
  // ----------------------------------------------
  getCategories: async (): Promise<string[]> => {
    const resp = await api.get(`/api/books/categories`);
    return resp.data ?? [];
  },

  // ----------------------------------------------
  // List books (with optional filters)
  // ----------------------------------------------
  getBooks: async (
    search?: string,
    opts?: {
      category?: string;
      subcategory?: string;
      book_format?: string;
      publication_year?: number;
      shelf?: string;
    }
  ): Promise<BookRead[]> => {
    const params = new URLSearchParams();

    if (search) params.append("q", search);

    if (opts?.category) params.append("category", opts.category);
    if (opts?.subcategory) params.append("subcategory", opts.subcategory);
    if (opts?.book_format) params.append("book_format", opts.book_format);
    if (opts?.publication_year)
      params.append("publication_year", String(opts.publication_year));
    if (opts?.shelf) params.append("shelf", opts.shelf);

    const path =
      `/api/books` + (params.toString() ? `?${params.toString()}` : "");

    const resp = await api.get(path);

    const mapped = (resp.data || []).map((b: BookRead) => ({
      ...b,
      cover_url: absoluteUrl(b.cover_url),
    }));

    return mapped;
  },

  // Backward compatibility wrapper
  list: async (q?: string, opts?: { category?: string }) => {
    const data = await booksService.getBooks(q, opts);
    return { data };
  },

  // ----------------------------------------------
  // Get single book
  // ----------------------------------------------
  getBook: async (id: number): Promise<BookRead> => {
    const resp = await api.get(`/api/books/${id}`);

    return {
      ...resp.data,
      cover_url: absoluteUrl(resp.data.cover_url),
    };
  },

  // ----------------------------------------------
  // Create book
  // ----------------------------------------------
  createBook: async (payload: BookCreate): Promise<BookRead> => {
    const normalized = {
      ...payload,
      isbn: normalizeIsbn(payload.isbn),
    };

    const resp = await api.fetchWithAuth(`/api/books/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    });

    return resp as BookRead;
  },

  // ----------------------------------------------
  // Update book
  // ----------------------------------------------
  updateBook: async (id: number, patch: BookUpdate): Promise<BookRead> => {
    const resp = await api.fetchWithAuth(`/api/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    return resp as BookRead;
  },

  // ----------------------------------------------
  // Delete book (by ISBN or ID)
  // ----------------------------------------------
  deleteBook: async (isbnOrId: string | number) => {
    const identifier =
      typeof isbnOrId === "string"
        ? normalizeIsbn(isbnOrId)
        : encodeURIComponent(String(isbnOrId));

    return await api.fetchWithAuth(`/api/books/${identifier}`, {
      method: "DELETE",
    });
  },

  // ----------------------------------------------
  // Upload cover
  // Produces backend thumbnail URL: /static/thumbnails/xxxxx.jpg
  // ----------------------------------------------
  uploadCover: async (
    bookId: number,
    file: File
  ): Promise<{ cover_url: string }> => {
    const MAX_SIZE = 3 * 1024 * 1024;
    const allowed = ["image/jpeg", "image/png"];

    if (file.size > MAX_SIZE) {
      throw new Error("Image too large (max 3MB).");
    }

    if (!allowed.includes(file.type)) {
      throw new Error("Invalid file type. JPG/PNG only.");
    }

    const form = new FormData();
    form.append("file", file);

    const resp = await api.fetchWithAuth(`/api/books/${bookId}/cover`, {
      method: "POST",
      body: form,
    });

    return {
      cover_url: absoluteUrl(resp.cover_url),
    };
  },

  // ----------------------------------------------
  // Reserve book
  // ----------------------------------------------
  reserveBook: async (bookId: number) => {
    return api.fetchWithAuth(`/api/reservations/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book_id: bookId }),
    });
  },

  // ----------------------------------------------
  // List reservations (paginated)
  // ----------------------------------------------
  listReservations: async (
    bookId?: number,
    page = 1,
    pageSize = 10
  ): Promise<{ data: { items: any[]; total: number } }> => {
    const params = new URLSearchParams();

    if (bookId !== undefined) params.append("book_id", String(bookId));
    params.append("page", String(page));
    params.append("page_size", String(pageSize));

    const resp = await api.fetchWithAuth(
      `/api/reservations/?${params.toString()}`
    );

    return resp as { data: { items: any[]; total: number } };
  },
};

export default booksService;
