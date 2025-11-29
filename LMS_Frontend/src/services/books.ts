import api from "@/lib/api";

export const booksService = {
  getBooks: async (skip = 0, limit = 100) => {
    const response = await api.get(`/api/books/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getBook: async (id: number) => {
    const response = await api.get(`/api/books/${id}`);
    return response.data;
  },

  createBook: async (bookData: any) => {
    const response = await api.post("/api/books/", bookData);
    return response.data;
  },
};
