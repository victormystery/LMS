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
      // try to parse JSON, but some endpoints may return empty body
      try {
        return await res.json();
      } catch {
        return null;
      }
    }

    // axios-like convenience wrappers that return { data }
    async function get(path: string, options: RequestInit = {}) {
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
        // try to parse JSON, but some endpoints may return empty body
        try {
          return await res.json();
        } catch {
          return null;
        }
      }

      // axios-like convenience wrappers that return { data }
      async function get(path: string, options: RequestInit = {}) {
        const data = await request(path, { ...options, method: "GET" });
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

      export function setToken(token: string) {
        localStorage.setItem("access_token", token);
      }

      export function getToken(): string | null {
        return localStorage.getItem("access_token");
      }

      export function logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("current_user");
      }

      export async function fetchWithAuth(path: string, options: RequestInit = {}) {
        const token = getToken();
        const headers = options.headers ? { ...(options.headers as any) } : {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return request(path, { ...options, headers });
      }

      export function saveUser(user: any) {
        try {
          localStorage.setItem("current_user", JSON.stringify(user));
        } catch {}
      }

      export function getUser(): any | null {
        try {
          const v = localStorage.getItem("current_user");
          return v ? JSON.parse(v) : null;
        } catch {
          return null;
        }
      }

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
