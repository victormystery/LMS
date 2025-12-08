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
import { BookOpen, Clock, AlertCircle, ArrowLeft, DollarSign } from "lucide-react";
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
  // Overdue logic - Calculate real-time fees
  // ----------------------------------------------------------
  const overdueRecords = borrows.filter(
    (b) => !b.returned_at && new Date(b.due_date) < new Date()
  );

  // Calculate real-time fees for overdue books: £5 + £1 per hour
  const calculateCurrentFee = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = now.getTime() - due.getTime();
    const hoursOverdue = Math.floor(diffMs / (1000 * 60 * 60));
    return 5 + (hoursOverdue * 1);
  };

  const totalLateFees = overdueRecords.reduce((sum, r) => {
    return sum + calculateCurrentFee(r.due_date);
  }, 0);

  const currentUser = api.getUser();

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="w-6 h-6" />
            <h1 className="text-xl font-bold">My Library</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => navigate("/payments")}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/catalog")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Overdue Alert */}
        {overdueRecords.length > 0 && (
          <Alert variant="destructive" className="mb-6 border-l-4 border-red-600 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              ⚠️ You have {overdueRecords.length} overdue book(s). Current total fines: £
              {totalLateFees.toFixed(2)} (£5 initial + £1 per hour)
            </AlertDescription>
          </Alert>
        )}

        {/* Borrowed Books */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Currently Borrowed
          </h2>

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

                // Calculate real-time fee
                const currentFee = isOverdue ? calculateCurrentFee(b.due_date) : 0;
                const hoursOverdue = isOverdue ? 
                  Math.floor((new Date().getTime() - new Date(b.due_date).getTime()) / (1000 * 60 * 60)) : 0;

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
                        <div className="mt-2 space-y-1">
                          <Badge variant="destructive">
                            Overdue — {hoursOverdue}h
                          </Badge>
                          <div className="text-sm font-semibold text-red-600">
                            Current Fine: £{currentFee.toFixed(2)}
                          </div>
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
