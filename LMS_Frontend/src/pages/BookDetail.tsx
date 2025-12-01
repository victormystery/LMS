import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, User } from "lucide-react";
import { booksService } from "@/services/books";
import { borrowsService } from "@/services/borrows";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api_clean";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<any | null>(null);
  const [borrowingHistory, setBorrowingHistory] = useState<any[]>([]);
  const [reservationQueue, setReservationQueue] = useState<any[]>([]);
  const [resPage, setResPage] = useState(1);
  const [resPageSize] = useState(10);
  const [resTotal, setResTotal] = useState(0);
  const [resLoading, setResLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [borrowLoadingId, setBorrowLoadingId] = useState<number | null>(null);



  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!id) throw new Error("Missing book id");
        const bookId = Number(id);
        const bookData = await booksService.getBook(bookId);
        setBook(bookData);

        // Load reservation queue for this book (server-side filter, paged)
        try {
          setResLoading(true);
          const res = await api.booksService.listReservations(bookId, 1, resPageSize);
          const items = res.data?.items ?? [];
          setReservationQueue(items);
          setResTotal(res.data?.total ?? 0);
          setResPage(1);
        } catch (e) {
          setReservationQueue([]);
          setResTotal(0);
        } finally {
          setResLoading(false);
        }

        // Load current user's borrow records for this book
        try {
          const myBorrows = await borrowsService.myBorrows();
          const history = (myBorrows || [])
            .filter(b => b.book_id === bookId)
            .map(b => ({
              id: b.id,
              user: api.getUser()?.username || "You",
              userType: api.getUser()?.role || "User",
              borrowedDate: new Date(b.borrowed_at).toLocaleDateString(),
              returnedDate: b.returned_at ? new Date(b.returned_at).toLocaleDateString() : null,
              status: b.returned_at ? "returned" : "borrowed",
            }));
          setBorrowingHistory(history);
        } catch (e) {
          // ignore history errors
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load book");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleReserve = async (bookId: number, title: string) => {
    setReserving(true);
    try {
      await booksService.reserveBook(bookId);
      toast({ title: "Reserved", description: `You will be notified when \"${title}\" is available.` });
      // Refresh book list to reflect reservation
      setIsLoading(true);
      const data = await booksService.getBooks();
      setBooks(data);
      // Notify librarian dashboard (custom event)
      window.dispatchEvent(new CustomEvent("reservation:created", { detail: { bookId, title } }));
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: (err as any)?.message || "Could not reserve" });
    } finally {
      setIsLoading(false);
      setReserving(false);
    }
  };

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

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Book Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{book?.title ?? "Loading..."}</CardTitle>
                    <CardDescription className="text-base mt-2">{book?.author}</CardDescription>
                  </div>
                  <Badge
                    variant={(book && book.available_copies > 0) ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {book ? (book.available_copies > 0 ? "available" : "unavailable") : ""}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Separator />

                {/* Book Metadata */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ISBN:</span>
                    <span className="font-medium">{book?.isbn}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{book?.category ?? "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Publisher:</span>
                    <span className="font-medium">{book?.publisher ?? "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published:</span>
                    <span className="font-medium">{book?.publish_year ?? book?.publishYear ?? "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pages:</span>
                    <span className="font-medium">{book?.pages ?? "-"}</span>
                  </div>
                </div>

                <Separator />

                {/* Availability */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Availability:</span>
                    <span className="font-medium">
                      {book ? `${book.available_copies} / ${book.total_copies} copies` : "-"}
                    </span>
                  </div>
                  <Progress value={book ? (book.available_copies / Math.max(1, book.total_copies)) * 100 : 0} />
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  {book && book.available_copies > 0 ? (
                    <Button className="w-full" size="lg">
                      Borrow Book
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" variant="outline" onClick={() => handleReserve(book.id, book.title)} disabled={reserving}>
                      {reserving ? "Reserving..." : "Reserved Book"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="description" className="w-full">

              {/* FIXED: now only 3 tabs */}
              <TabsList className="grid w-full grid-cols-3">
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
                    <p className="text-muted-foreground leading-relaxed">{book?.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Borrowing History</CardTitle>
                    <CardDescription>Your borrowing records for this book</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {borrowingHistory.length === 0 ? (
                      <div className="text-muted-foreground">No history for this book.</div>
                    ) : (
                      borrowingHistory.map(record => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{record.user}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {record.userType}
                                </Badge>
                                <span>•</span>
                                <span>Borrowed: {record.borrowedDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <Badge variant={record.status === "returned" ? "secondary" : "default"}>
                              {record.status}
                            </Badge>
                            {record.returnedDate && (
                              <p className="text-xs text-muted-foreground mt-1">
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
                      {reservationQueue.length > 0
                        ? `${reservationQueue.length} user(s) waiting`
                        : "No active reservations"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reservationQueue.length > 0 ? (
                      <>
                        <ul className="space-y-2">
                          {reservationQueue.map((r: any, idx: number) => (
                            <li key={r.id} className="flex items-center gap-2 p-3 border rounded-lg">
                              <Avatar className="w-6 h-6"><AvatarFallback>{(r.full_name || r.username) ? (r.full_name || r.username).substring(0, 2).toUpperCase() : String(r.user_id).slice(-2)}</AvatarFallback></Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{r.full_name ?? r.username ?? `User ${r.user_id}`}</span>
                                <span className="text-xs text-muted-foreground">Position: {idx + 1}</span>
                              </div>
                              <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>

                        {reservationQueue.length < resTotal && (
                          <div className="mt-4 text-center">
                            <Button onClick={async () => {
                              // load next page
                              const next = resPage + 1;
                              setResLoading(true);
                              try {
                                const res = await api.booksService.listReservations(Number(id), next, resPageSize);
                                const items = res.data?.items ?? [];
                                setReservationQueue(prev => [...prev, ...items]);
                                setResPage(next);
                                setResTotal(res.data?.total ?? resTotal);
                              } catch (e) {
                                // ignore
                              } finally {
                                setResLoading(false);
                              }
                            }} disabled={resLoading}>
                              {resLoading ? "Loading..." : "Load more"}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-muted-foreground">No active reservations.</div>
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
