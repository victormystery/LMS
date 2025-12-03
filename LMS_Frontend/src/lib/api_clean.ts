// ----------------------------------------------
// API BASE URL
// ----------------------------------------------
const API_URL =
  (import.meta as any).env.VITE_API_URL ?? "http://127.0.0.1:8000";

// ----------------------------------------------
// Helper: Build Absolute URLs (for covers & thumbnails)
// ----------------------------------------------
export function absoluteUrl(path?: string): string {
  if (!path) return "";

  // Already absolute?
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Static files served at: http://127.0.0.1:8000/static/...
  if (path.startsWith("/static/")) {
    return `${API_URL}${path}`;
  }

  // Generic fallback
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
}

// ----------------------------------------------
// CORE REQUEST WRAPPER
// ----------------------------------------------
async function request(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, options);

  if (!res.ok) {
    let errMsg = "Request failed";

    try {
      const json = await res.json();
      errMsg =
        json?.detail ||
        json?.message ||
        JSON.stringify(json) ||
        res.statusText;
    } catch {
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

// ----------------------------------------------
// Convenience HTTP wrappers
// ----------------------------------------------
async function get(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = options.headers ? { ...(options.headers as any) } : {};

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const data = await request(path, {
    ...options,
    method: "GET",
    headers,
  });

  return { data };
}

async function post(path: string, body?: any, options: RequestInit = {}) {
  const headers: any = options.headers ? { ...(options.headers as any) } : {};
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const data = await request(path, {
    ...options,
    method: "POST",
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

  return { data };
}

async function put(path: string, body?: any, options: RequestInit = {}) {
  const headers: any = options.headers ? { ...(options.headers as any) } : {};
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const data = await request(path, {
    ...options,
    method: "PUT",
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

  return { data };
}

async function del(path: string, options: RequestInit = {}) {
  const data = await request(path, {
    ...options,
    method: "DELETE",
  });
  return { data };
}

// ----------------------------------------------
// AUTH SECTION
// ----------------------------------------------
export type RegisterPayload = {
  username: string;
  password: string;
  full_name?: string;
  role?: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export async function register(payload: RegisterPayload) {
  return request(`/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload) {
  return request(`/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------
// TOKEN STORAGE
// ----------------------------------------------
export function setToken(token: string, username?: string) {
  sessionStorage.setItem("access_token", token);

  try {
    if (username) {
      const raw = localStorage.getItem("access_tokens");
      const map = raw ? JSON.parse(raw) : {};
      map[username] = token;
      localStorage.setItem("access_tokens", JSON.stringify(map));
    }
  } catch {}
}

export function getToken(): string | null {
  try {
    const user = getUser();
    if (user?.username) {
      const raw = localStorage.getItem("access_tokens");
      if (raw) {
        const map = JSON.parse(raw);
        if (map[user.username]) return map[user.username];
      }
    }
  } catch {}

  return (
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access_token")
  );
}

// ----------------------------------------------
// FETCH WITH AUTH
// ----------------------------------------------
export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = options.headers ? { ...(options.headers as any) } : {};

  if (token) headers["Authorization"] = `Bearer ${token}`;

  return request(path, {
    ...options,
    headers,
    credentials: "include",
  });
}

// ----------------------------------------------
// USER STORAGE
// ----------------------------------------------
export function saveUser(user: any) {
  try {
    sessionStorage.setItem("current_user", JSON.stringify(user));

    if (user?.username) {
      const raw = localStorage.getItem("known_users");
      const map = raw ? JSON.parse(raw) : {};
      map[user.username] = user;
      localStorage.setItem("known_users", JSON.stringify(map));
    }
  } catch {}
}

export function getUser(): any | null {
  const raw = sessionStorage.getItem("current_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ----------------------------------------------
// LOGOUT
// ----------------------------------------------
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
    }

    sessionStorage.removeItem("current_user");
    sessionStorage.removeItem("access_token");
    localStorage.removeItem("access_token");
  } catch {}
}

// ----------------------------------------------
// EXPORT
// ----------------------------------------------
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
};

export default api;

export { API_URL };
