import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, Star, User, Clock, Users } from "lucide-react";
import { booksService } from "@/services/books";
import { borrowsService } from "@/services/borrows";
import api from "@/lib/api_clean";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<any | null>(null);
  const [reviews] = useState<any[]>([]); // backend reviews not available
  const [borrowingHistory, setBorrowingHistory] = useState<any[]>([]);
  const [reservationQueue] = useState<any[]>([]); // backend reservations not available
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!id) throw new Error("Missing book id");
        const bookId = Number(id);
        const bookData = await booksService.getBook(bookId);
        setBook(bookData);

        // load current user's borrow records for this book (backend only exposes /borrows/me)
        try {
          const myBorrows = await borrowsService.myBorrows();
          const history = (myBorrows || []).filter(b => b.book_id === bookId).map(b => ({
            id: b.id,
            user: api.getUser()?.username || "You",
            userType: api.getUser()?.role || "User",
            borrowedDate: new Date(b.borrowed_at).toLocaleDateString(),
            returnedDate: b.returned_at ? new Date(b.returned_at).toLocaleDateString() : null,
            status: b.returned_at ? "returned" : "borrowed",
          }));
          setBorrowingHistory(history);
        } catch (e) {
          // ignore borrow history errors
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load book");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Book Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{book?.title ?? "Loading..."}</CardTitle>
                    <CardDescription className="text-base mt-2">{book?.author}</CardDescription>
                  </div>
                  <Badge variant={(book && book.available_copies > 0) ? "default" : "secondary"} className="shrink-0">
                    {book ? (book.available_copies > 0 ? "available" : "unavailable") : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(averageRating) ? "fill-accent text-accent" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>

                <Separator />

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

                <div className="space-y-2">
                  {book && book.available_copies > 0 ? (
                    <Button className="w-full" size="lg">
                      Borrow Book
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" variant="outline">
                      Reserve Book
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="queue">Queue</TabsTrigger>
              </TabsList>

              {/* Description Tab */}
              <TabsContent value="description">
                <Card>
                  <CardHeader>
                    <CardTitle>About this book</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{book.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>User Reviews</CardTitle>
                    <CardDescription>{reviews.length} reviews</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-muted-foreground">Reviews are not available from the backend.</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Borrowing History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Borrowing History</CardTitle>
                    <CardDescription>Complete record of all borrowing activities</CardDescription>
                  </CardHeader>
              <CardContent className="space-y-4">
                {borrowingHistory.length === 0 ? (
                  <div className="text-muted-foreground">No borrowing history available for your account on this book.</div>
                ) : (
                  borrowingHistory.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                          <p className="text-xs text-muted-foreground mt-1">Returned: {record.returnedDate}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
                </Card>
              </TabsContent>

              {/* Reservation Queue Tab */}
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
                <div className="text-muted-foreground">Reservation queue is not exposed by the backend.</div>
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
