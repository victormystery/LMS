import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import api from "@/lib/api_clean";

const NotificationsBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.fetchWithAuth(`/api/notifications/`);
            const data = res as any;
            setItems(data?.items || []);
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
        // listen for incoming SSE notifications and update the bell count in real-time
        const handler = (ev: any) => {
            const detail = ev?.detail;
            if (detail) {
                setItems((s) => [detail, ...s]);
            }
        };
        window.addEventListener("notification:received", handler as EventListener);
        return () => {
            window.removeEventListener("notification:received", handler as EventListener);
        };
    }, []);

    const markRead = async (id: number) => {
        try {
            await api.fetchWithAuth(`/api/notifications/mark-read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            // remove locally
            setItems((s) => s.filter((x) => x.id !== id));
        } catch (e) {
            // ignore
        }
    };

    const unread = items.length;

    return (
        <div style={{ position: "relative", display: "inline-block", marginLeft: 12 }}>
            <button
                onClick={() => { setOpen(!open); if (!open) fetchItems(); }}
                aria-label="Notifications"
                className="p-2 rounded hover:bg-transparent hover:opacity-70 transition-opacity"
            >
                <Bell />
                {unread > 0 && (
                    <span style={{ position: "absolute", top: 0, right: 0 }} className="text-xs bg-red-600 text-white rounded-full px-1">{unread}</span>
                )}
            </button>

            {open && (
                <div style={{ position: "absolute", right: 0, top: 36, width: 320, zIndex: 50 }} className="bg-slate-900 text-white border rounded shadow">
                    <div className="p-2 border-b font-semibold">Notifications</div>
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        {loading && <div className="p-2 text-gray-300">Loading...</div>}
                        {!loading && items.length === 0 && <div className="p-2 text-sm text-gray-300">No new notifications</div>}
                        {items.map((it) => {
                            const isOverdue = it.type === "overdue" || it.type === "overdue_librarian";
                            const hours = it.hours_overdue || 0;
                            const fee = it.current_fee || 0;
                            
                            return (
                                <div key={it.id} className={`p-2 hover:bg-slate-800 flex justify-between items-start ${isOverdue ? 'border-l-4 border-red-500' : ''}`}>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">
                                            {it.book_title || it.message || "Notification"}
                                            {isOverdue && <span className="ml-2 text-red-400">⚠ OVERDUE</span>}
                                        </div>
                                        <div className="text-xs text-gray-300">
                                            {it.type === "overdue_librarian" ? 
                                                `Borrower: ${it.borrower_full_name || it.borrower_username || "Unknown"}` : 
                                                (it.full_name || it.username || "Someone")
                                            }
                                        </div>
                                        {isOverdue && (
                                            <div className="text-xs text-red-300 mt-1">
                                                {hours}h overdue • £{fee} fine
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <button onClick={() => markRead(it.id)} className="text-xs text-primary">Mark</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsBell;
