const API_URL = (import.meta as any).env.VITE_API_URL ?? "http://127.0.0.1:8000";

type RegisterPayload = {
  username: string;
  password: string;
  full_name?: string;
  role?: string;
};

type LoginPayload = {
  username: string;
  password: string;
};

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    let errMsg = "Request failed";
    try {
      const json = await res.json();
      errMsg = (json && (json.detail || json.message)) || JSON.stringify(json);
    } catch (e) {
      errMsg = res.statusText || errMsg;
    }
    const error: any = new Error(errMsg);
    error.status = res.status;
    throw error;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Convenience wrappers
async function get(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = options.headers ? { ...(options.headers as any) } : {};
  if (token && !headers["Authorization"]) headers["Authorization"] = `Bearer ${token}`;
  const data = await request(path, { ...options, method: "GET", headers });
  return { data };
}

async function post(path: string, body?: any, options: RequestInit = {}) {
  const headers: any = options.headers ? { ...(options.headers as any) } : {};
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const opts: RequestInit = {
    ...options,
    method: "POST",
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body),
  };
  const data = await request(path, opts);
  return { data };
}

async function put(path: string, body?: any, options: RequestInit = {}) {
  const headers: any = options.headers ? { ...(options.headers as any) } : {};
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const opts: RequestInit = {
    ...options,
    method: "PUT",
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body),
  };
  const data = await request(path, opts);
  return { data };
}

async function del(path: string, options: RequestInit = {}) {
  const data = await request(path, { ...options, method: "DELETE" });
  return { data };
}

// Auth functions
export async function register(payload: RegisterPayload) {
  return post(`/api/auth/register`, payload);
}

export async function login(payload: LoginPayload) {
  return post(`/api/auth/login`, payload);
}

export function setToken(token: string, username?: string) {
  // Store active token in sessionStorage (per-tab)
  sessionStorage.setItem("access_token", token);
  // Also store in the tokens map under the provided username (if any) or the current user
  try {
    const u = username ? { username } : getUser();
    const name = u?.username || "default";
    const raw = localStorage.getItem("access_tokens");
    const map = raw ? JSON.parse(raw) : {};
    map[name] = token;
    localStorage.setItem("access_tokens", JSON.stringify(map));
  } catch {}
}

export function getToken(): string | null {
  // Prefer token for the currently active user (if any)
  try {
    const u = getUser();
    if (u && u.username) {
      const raw = localStorage.getItem("access_tokens");
      if (raw) {
        const map = JSON.parse(raw || "{}");
        if (map[u.username]) return map[u.username];
      }
    }
  } catch {}
  // Fallback to the per-tab session token, then to localStorage for compatibility
  return sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
}



export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = options.headers ? { ...(options.headers as any) } : {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // include credentials so cookies (e.g., access_token for SSE) are sent
  const opts = { ...options, headers, credentials: "include" as RequestCredentials };
  return request(path, opts);
}

export function saveUser(user: any) {
  try {
    // Save the active user in sessionStorage (per-tab) and keep a map of known users to support multiple sessions
    sessionStorage.setItem("current_user", JSON.stringify(user));
    try {
      const raw = localStorage.getItem("known_users");
      const map = raw ? JSON.parse(raw) : {};
      if (user?.username) map[user.username] = user;
      localStorage.setItem("known_users", JSON.stringify(map));
    } catch {}
  } catch {}
}

export function getUser(): any | null {
  try {
    const v = sessionStorage.getItem("current_user");
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

// Optional: remove a user's token and optionally clear active user
export function logout(username?: string) {
  try {
    if (username) {
      const raw = localStorage.getItem("access_tokens");
      if (raw) {
        const map = JSON.parse(raw);
        delete map[username];
        localStorage.setItem("access_tokens", JSON.stringify(map));
      }
      const known = localStorage.getItem("known_users");
      if (known) {
        const map = JSON.parse(known);
        delete map[username];
        localStorage.setItem("known_users", JSON.stringify(map));
      }
    } else {
      // Default behaviour: remove token for active user and clear active user
      const active = getUser();
      const activeName = active?.username;
      if (activeName) {
        const raw = localStorage.getItem("access_tokens");
        if (raw) {
          const map = JSON.parse(raw);
          delete map[activeName];
          localStorage.setItem("access_tokens", JSON.stringify(map));
        }
      }
      // Remove per-tab active user and token
      sessionStorage.removeItem("current_user");
      sessionStorage.removeItem("access_token");
    }
    // keep backward-compatible single token removal
    localStorage.removeItem("access_token");
  } catch {}
}

// Books API
export const booksService = {
  list: (q?: string) => get(`/api/books${q ? `?q=${q}` : ""}`),
  createBook: (data: any) => fetchWithAuth(`/api/books`, { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  updateBook: (id: number, data: any) => fetchWithAuth(`/api/books/${id}`, { method: "PUT", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  deleteBook: (isbn: string) => fetchWithAuth(`/api/books/${isbn}`, { method: "DELETE" }),
  borrowBook: (bookId: number) => fetchWithAuth(`/api/borrows`, { method: "POST", body: JSON.stringify({ book_id: bookId }), headers: { "Content-Type": "application/json" } }),
  reserveBook: (bookId: number) => fetchWithAuth(`/api/reservations/`, { method: "POST", body: JSON.stringify({ book_id: bookId }), headers: { "Content-Type": "application/json" } }),
  listReservations: (bookId?: number, page?: number, pageSize?: number) => {
    const qs: string[] = [];
    if (bookId !== undefined) qs.push(`book_id=${encodeURIComponent(String(bookId))}`);
    if (page !== undefined) qs.push(`page=${encodeURIComponent(String(page))}`);
    if (pageSize !== undefined) qs.push(`page_size=${encodeURIComponent(String(pageSize))}`);
    const qstr = qs.length ? `?${qs.join("&")}` : "";
    return fetchWithAuth(`/api/reservations/${qstr}`);
  },
};

const api = {
  API_URL,
  request,
  get,
  post,
  put,
  delete: del,
  register,
  login,
  setToken,
  getToken,
  logout,
  fetchWithAuth,
  saveUser,
  getUser,
  booksService,
};

export default api;
export { API_URL };
