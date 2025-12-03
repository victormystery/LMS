import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen } from "lucide-react";
import { booksService, absoluteUrl } from "@/services/books";
import { borrowsService } from "@/services/borrows";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api_clean";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<any | null>(null);

  // Borrowing history
  const [borrowingHistory, setBorrowingHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  // Reservation queue
  const [reservationQueue, setReservationQueue] = useState<any[]>([]);
  const [resPage, setResPage] = useState(1);
  const [resPageSize] = useState(10);
  const [resTotal, setResTotal] = useState(0);
  const [resLoading, setResLoading] = useState(false);

  // Main
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------
  // Load book + reservations + history
  // -------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!id) throw new Error("Missing book id");
        const bookId = Number(id);

        // Fetch book
        const bookData = await booksService.getBook(bookId);
        setBook(bookData);

        // Fetch reservations
        try {
          setResLoading(true);
          const res = await booksService.listReservations(bookId, 1, resPageSize);
          const items = res?.data?.items ?? [];
          const total = res?.data?.total ?? 0;

          setReservationQueue(items);
          setResTotal(total);
          setResPage(1);
        } catch (e) {
          setReservationQueue([]);
          setResTotal(0);
        } finally {
          setResLoading(false);
        }

        // Borrowing history for THIS USER
        try {
          const myBorrows = await borrowsService.myBorrows(true);
          const history = (myBorrows || [])
            .filter((b) => b.book_id === bookId)
            .map((b) => ({
              id: b.id,
              user: api.getUser()?.username || "You",
              userType: api.getUser()?.role || "User",
              borrowedDate: new Date(b.borrowed_at).toLocaleDateString(),
              returnedDate: b.returned_at
                ? new Date(b.returned_at).toLocaleDateString()
                : null,
              status: b.returned_at ? "returned" : "borrowed",
            }));

          setBorrowingHistory(history);
        } catch {}
      } catch (e: any) {
        setError(e?.message || "Failed to load book");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // -------------------------------------------------------
  // Reserve book
  // -------------------------------------------------------
  const handleReserve = async (bookId: number, title: string) => {
    setReserving(true);
    try {
      await booksService.reserveBook(bookId);

      toast({
        title: "Reserved",
        description: `You will be notified when "${title}" is available.`,
      });

      window.dispatchEvent(
        new CustomEvent("reservation:created", { detail: { bookId, title } })
      );
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: err?.message || "Could not reserve.",
      });
    } finally {
      setReserving(false);
    }
  };

  // -------------------------------------------------------
  // Filter history
  // -------------------------------------------------------
  const filteredHistory = borrowingHistory.filter(
    (h) =>
      h.user.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.status.toLowerCase().includes(historySearch.toLowerCase())
  );

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="p-8 text-center text-red-500">
        {error ?? "Book not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Library System</h1>
          </div>

          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left — Book Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-40 bg-muted overflow-hidden rounded">
                      {book.cover_url ? (
                        <img
                          src={absoluteUrl(book.cover_url)}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.src = "/fallback-cover.png")
                          }
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-2">
                          No cover
                        </div>
                      )}
                    </div>

                    <div>
                      <CardTitle className="text-2xl">{book.title}</CardTitle>
                      <CardDescription className="mt-1 text-base">
                        {book.author}
                      </CardDescription>
                    </div>
                  </div>

                  <Badge
                    variant={
                      book.available_copies > 0 ? "default" : "secondary"
                    }
                  >
                    {book.available_copies > 0
                      ? "available"
                      : "unavailable"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Separator />

                {/* Metadata */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ISBN:</span>
                    <span className="font-medium">{book.isbn}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{book.category ?? "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Publisher:</span>
                    <span className="font-medium">{book.publisher ?? "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published:</span>
                    <span className="font-medium">
                      {book.publication_year ?? "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <span className="font-medium">{book.book_format ?? "-"}</span>
                  </div>
                </div>

                <Separator />

                {/* Availability */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Availability:</span>
                    <span className="font-medium">
                      {book.available_copies}/{book.total_copies}
                    </span>
                  </div>
                  <Progress
                    value={
                      (book.available_copies /
                        Math.max(1, book.total_copies)) *
                      100
                    }
                  />
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  {book.available_copies > 0 ? (
                    <Button className="w-full" size="lg">
                      Borrow Book
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                      onClick={() => handleReserve(book.id, book.title)}
                      disabled={reserving}
                    >
                      {reserving ? "Reserving..." : "Reserve Book"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="description">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="queue">Queue</TabsTrigger>
              </TabsList>

              {/* Description */}
              <TabsContent value="description">
                <Card>
                  <CardHeader>
                    <CardTitle>About this book</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {book.description}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Borrowing History</CardTitle>
                    <CardDescription>Your records</CardDescription>

                    <Input
                      placeholder="Search history..."
                      className="mt-3"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                    />
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {filteredHistory.length === 0 ? (
                      <div className="text-muted-foreground">
                        No matching history.
                      </div>
                    ) : (
                      filteredHistory.map((record) => (
                        <div
                          key={record.id}
                          className="p-4 border rounded-lg flex justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {record.user.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <p className="font-medium">{record.user}</p>
                              <p className="text-xs text-muted-foreground">
                                Borrowed: {record.borrowedDate}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <Badge
                              variant={
                                record.status === "returned"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {record.status}
                            </Badge>

                            {record.returnedDate && (
                              <p className="text-xs text-muted-foreground">
                                Returned: {record.returnedDate}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Queue */}
              <TabsContent value="queue">
                <Card>
                  <CardHeader>
                    <CardTitle>Reservation Queue</CardTitle>
                    <CardDescription>
                      {reservationQueue.length} user(s) waiting
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {reservationQueue.length === 0 ? (
                      <div className="text-muted-foreground">
                        No active reservations.
                      </div>
                    ) : (
                      <>
                        {reservationQueue.map((r: any, idx: number) => (
                          <li
                            key={r.id}
                            className="flex items-center gap-3 p-3 border rounded-lg mb-2 list-none"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {(r.full_name || r.username || "U")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <p className="font-medium">
                                {r.full_name ??
                                  r.username ??
                                  `User ${r.user_id}`}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Position: {idx + 1}
                              </p>
                            </div>

                            <span className="ml-auto text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleString()}
                            </span>
                          </li>
                        ))}

                        {reservationQueue.length < resTotal && (
                          <div className="text-center mt-4">
                            <Button
                              disabled={resLoading}
                              onClick={async () => {
                                const next = resPage + 1;
                                setResLoading(true);

                                try {
                                  const res = await booksService.listReservations(
                                    Number(id),
                                    next,
                                    resPageSize
                                  );
                                  const items = res?.data?.items ?? [];
                                  setReservationQueue((p) => [...p, ...items]);
                                  setResPage(next);
                                } finally {
                                  setResLoading(false);
                                }
                              }}
                            >
                              {resLoading ? "Loading..." : "Load More"}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookDetail;
