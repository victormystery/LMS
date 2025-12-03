import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { borrowsService } from "@/services/borrows";
import { booksService } from "@/services/books";
import api from "@/lib/api_clean";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type BorrowRecord = {
  id: number;
  user_id: number;
  book_id: number;
  borrowed_at: string;
  due_date: string;
  returned_at?: string | null;
  fee_applied: number;
  book?: {
    title?: string;
    author?: string;
    isbn?: string;
    cover_url?: string;
  };
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returningId, setReturningId] = useState<number | null>(null);

  // ----------------------------------------------------------
  // Load all user's borrow records
  // ----------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      try {
        const data = await borrowsService.myBorrows();
        const borrowsList = data || [];

        const bookIds = Array.from(new Set(borrowsList.map((b) => b.book_id)));

        // Fetch metadata for each book
        const bookMap: Record<number, any> = {};
        await Promise.all(
          bookIds.map(async (id) => {
            try {
              const book = await booksService.getBook(id);
              bookMap[id] = book;
            } catch (e) {}
          })
        );

        setBorrows(
          borrowsList.map((b) => ({
            ...b,
            book: bookMap[b.book_id],
          }))
        );
      } catch (err) {
        console.error("Failed to load borrows:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your borrows.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [toast]);

  // ----------------------------------------------------------
  // Return a book
  // ----------------------------------------------------------
  const handleReturn = async (borrowId: number) => {
    if (!confirm("Are you sure you want to return this book?")) return;

    setReturningId(borrowId);

    try {
      await borrowsService.returnBook(borrowId);

      toast({
        title: "Book returned",
        description: "Thank you — book returned successfully.",
      });

      // Reload borrow list
      setIsLoading(true);

      try {
        const data = await borrowsService.myBorrows();
        const borrowsList = data || [];

        const bookIds = Array.from(new Set(borrowsList.map((b) => b.book_id)));
        const bookMap: Record<number, any> = {};

        await Promise.all(
          bookIds.map(async (id) => {
            try {
              const book = await booksService.getBook(id);
              bookMap[id] = book;
            } catch (e) {}
          })
        );

        setBorrows(
          borrowsList.map((b) => ({
            ...b,
            book: bookMap[b.book_id],
          }))
        );
      } finally {
        setIsLoading(false);
      }

      // Notify other parts of the app
      window.dispatchEvent(
        new CustomEvent("borrow:returned", { detail: { borrowId } })
      );
    } catch (err) {
      console.error("Return failed:", err);
      toast({
        variant: "destructive",
        title: "Return failed",
        description: (err as any)?.message || "Could not return the book.",
      });
    } finally {
      setReturningId(null);
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Overdue logic
  // ----------------------------------------------------------
  const overdueRecords = borrows.filter(
    (b) => !b.returned_at && new Date(b.due_date) < new Date()
  );

  const totalLateFees = overdueRecords.reduce(
    (sum, r) => sum + (r.fee_applied || 0),
    0
  );

  const currentUser = api.getUser();

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">My Books</h1>
          </div>

          <Button variant="ghost" onClick={() => navigate("/catalog")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Overdue Alert */}
        {overdueRecords.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {overdueRecords.length} overdue book(s). Total late fees: $
              {totalLateFees.toFixed(2)}
            </AlertDescription>
          </Alert>
        )}

        {/* Borrowed Books */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Currently Borrowed</h2>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : borrows.length === 0 ? (
            <div className="text-muted-foreground">
              You have no borrowed books.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {borrows.map((b) => {
                const isOverdue =
                  !b.returned_at && new Date(b.due_date) < new Date();

                const title = b.book?.title ?? `Book #${b.book_id}`;
                const author = b.book?.author ?? "Unknown";
                const cover = b.book?.cover_url ?? null;

                return (
                  <Card
                    key={b.id}
                    className={isOverdue ? "border-destructive" : ""}
                  >
                    <CardHeader>
                      <div className="flex gap-3">
                        <div className="w-16 h-24 bg-muted rounded overflow-hidden">
                          {cover ? (
                            <img
                              src={cover}
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                              No cover
                            </div>
                          )}
                        </div>

                        <div>
                          <CardTitle className="text-lg">{title}</CardTitle>
                          <CardDescription>{author}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          Due: {new Date(b.due_date).toLocaleDateString()}
                        </span>
                      </div>

                      {isOverdue && (
                        <div className="mt-2">
                          <Badge variant="destructive">
                            Overdue — $
                            {b.fee_applied?.toFixed(2) ?? "0.00"} fee
                          </Badge>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleReturn(b.id)}
                        disabled={returningId === b.id}
                      >
                        {returningId === b.id ? "Returning..." : "Return Book"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Reservations Section (optional) */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Reservations</h2>
          <div className="text-muted-foreground">
            No reservations endpoint implemented in backend.
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
