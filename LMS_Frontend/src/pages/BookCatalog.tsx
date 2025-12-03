import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { booksService } from "@/services/books";
import { borrowsService } from "@/services/borrows";
import api from "@/lib/api_clean";

import NotificationsBell from "@/components/NotificationsBell";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { absoluteUrl } from "@/lib/api_clean";

const BookCatalog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | undefined>(
    undefined
  );

  const [categories, setCategories] = useState<string[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [borrowLoadingId, setBorrowLoadingId] = useState<number | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const paginated = books.slice((page - 1) * pageSize, page * pageSize);
  const hasNextPage = page * pageSize < books.length;

  // ------------------------------------------
  // Load categories
  // ------------------------------------------
  const loadCategories = async () => {
    try {
      const cats = await booksService.getCategories();
      setCategories(cats || []);
    } catch {
      setCategories([]);
    }
  };

  // ------------------------------------------
  // Load books
  // ------------------------------------------
  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const data = await booksService.getBooks(undefined, {
        category: filterCategory,
      });

      // 🔥 ensure cover_url is absolute
      const mapped = data.map((b) => ({
        ...b,
        cover_url: absoluteUrl(b.cover_url),
      }));

      setBooks(mapped);
      setError(null);
      setPage(1); // reset pagination
    } catch (err) {
      console.error(err);
      setError("Failed to load books.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load books.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial user + categories
  useEffect(() => {
    const storedUser = api.getUser();
    if (storedUser) setCurrentUser(storedUser);
    loadCategories();
  }, []);

  // Fetch books + user refresh
  useEffect(() => {
    loadBooks();

    const refresh = () => loadBooks();
    window.addEventListener("borrow:returned", refresh);

    return () => window.removeEventListener("borrow:returned", refresh);
  }, [filterCategory]);

  // -----------------------------------------------------
  // Borrow logic
  // -----------------------------------------------------
  const handleBorrow = async (bookId: number, e?: any) => {
    e?.stopPropagation();
    setBorrowLoadingId(bookId);

    try {
      await borrowsService.borrowBook({ book_id: bookId });
      toast({ title: "Borrowed", description: "Enjoy your reading!" });
      await loadBooks();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Borrow failed",
        description: err.message,
      });
    }

    setBorrowLoadingId(null);
  };

  // -----------------------------------------------------
  // Reserve logic
  // -----------------------------------------------------
  const handleReserve = async (bookId: number, title: string, e?: any) => {
    e?.stopPropagation();
    try {
      await booksService.reserveBook(bookId);
      toast({
        title: "Reserved",
        description: `You will be notified when "${title}" becomes available.`,
      });

      await loadBooks();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to reserve",
        description: err.message,
      });
    }
  };

  // Filter by search
  const filtered = paginated.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Library System</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationsBell />

            <div className="flex items-center gap-2">
              <UserAvatar
                name={currentUser?.username}
                avatarUrl={currentUser?.avatar_url}
              />
              <span className="text-sm text-muted-foreground">
                {currentUser?.username ?? "Guest"}
              </span>
            </div>

            <Button variant="ghost" onClick={() => navigate("/my-books")}>
              <User className="w-4 h-4 mr-2" />
              My Books
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                api.logout();
                navigate("/");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-2">Book Catalog</h2>
        <p className="text-muted-foreground mb-6">
          Browse and borrow books from the library
        </p>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filter */}
          <div className="mt-3 flex gap-3 items-center">
            <select
              value={filterCategory ?? ""}
              onChange={(e) =>
                setFilterCategory(e.target.value || undefined)
              }
              className="border rounded px-3 py-2 bg-background"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <Button onClick={() => loadBooks()}>Apply</Button>
          </div>
        </div>

        {/* Book grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="w-full h-40 mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-10">{error}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-10">
                No books found
              </p>
            ) : (
              filtered.map((book) => (
                <Card
                  key={book.id}
                  className="flex flex-col hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-20 h-28 bg-muted/10 rounded overflow-hidden">
                        {book.cover_url ? (
                          <img
                            src={absoluteUrl(book.cover_url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                            No cover
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {book.title}
                        </CardTitle>
                        <CardDescription>{book.author}</CardDescription>
                      </div>

                      <Badge
                        variant={
                          book.available_copies > 0
                            ? "default"
                            : "secondary"
                        }
                      >
                        {book.available_copies > 0
                          ? "Available"
                          : "Unavailable"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      ISBN: {book.isbn}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Category: {book.category || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Year: {book.publication_year || "-"}
                    </p>
                  </CardContent>

                  <CardFooter>
                    {book.available_copies > 0 ? (
                      <Button
                        className="w-full"
                        disabled={borrowLoadingId === book.id}
                        onClick={(e) => handleBorrow(book.id, e)}
                      >
                        {borrowLoadingId === book.id
                          ? "Borrowing..."
                          : "Borrow Book"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={(e) =>
                          handleReserve(book.id, book.title, e)
                        }
                      >
                        Reserve
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center gap-4 mt-8">
          {page > 1 && (
            <Button variant="outline" onClick={() => setPage(page - 1)}>
              Previous
            </Button>
          )}

          {hasNextPage && (
            <Button variant="outline" onClick={() => setPage(page + 1)}>
              Next
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookCatalog;
