import { useEffect, useRef } from "react";
import api from "@/lib/api_clean";
import { toast } from "@/components/ui/sonner";

export default function useNotifications() {
    const seen = useRef<Set<number>>(new Set());
    const esRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Connect via EventSource; authentication uses cookie set by `/api/auth/set-cookie`.
        const base = api.API_URL || (import.meta as any).env.VITE_API_URL || "http://127.0.0.1:8000";
        const url = `${base}/api/notifications/stream`;

        const es = new EventSource(url, { withCredentials: true } as any);
        esRef.current = es;

        es.onmessage = async (ev) => {
            try {
                // Event data is JSON string
                const data = ev.data && ev.data !== "" ? JSON.parse(ev.data) : null;
                if (!data) return;
                const id = data.id;
                if (id && !seen.current.has(id)) {
                    seen.current.add(id);
                    const title = data.book_title || data.message || "Notification";
                    const user = data.full_name || data.username || "Someone";
                    toast(`${title} is now available for ${user}`);
                    // mark read via API so server store is up-to-date
                    try {
                        await api.fetchWithAuth(`/api/notifications/mark-read`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id }),
                        });
                    } catch (e) {
                        // ignore
                    }
                }
            } catch (e) {
                // ignore parse errors
            }
            // dispatch a DOM event so other components (bell) can update immediately
            try {
                const detail = ev.data && ev.data !== "" ? JSON.parse(ev.data) : null;
                if (detail) {
                    window.dispatchEvent(new CustomEvent("notification:received", { detail }));
                }
            } catch { }
        };

        es.onerror = (ev) => {
            // EventSource will reconnect automatically. We can log if needed.
            // If closed, clean up
            if (es.readyState === EventSource.CLOSED) {
                es.close();
            }
        };

        return () => {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        };
    }, []);
}
