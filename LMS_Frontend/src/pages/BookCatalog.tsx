import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { booksService } from "@/services/books";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const BookCatalog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await booksService.getBooks();
        setBooks(data);
      } catch (err) {
        console.error("Failed to fetch books:", err);
        setError("Failed to load books. Please try again later.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load books. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [toast]);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Library System</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/my-books")}> 
              <User className="w-4 h-4 mr-2" />
              My Books
            </Button>
            <Button variant="ghost" onClick={() => { api.logout(); navigate("/"); }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Book Catalog</h2>
          <p className="text-muted-foreground">Browse and borrow books from our collection</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading books...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.length === 0 ? (
              <div className="text-center col-span-full py-12 text-muted-foreground">No books found</div>
            ) : (
              filteredBooks.map((book) => (
            <Card 
              key={book.id} 
              className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{book.title}</CardTitle>
                    <CardDescription className="mt-1">{book.author}</CardDescription>
                  </div>
                      <Badge variant={book.available_copies > 0 ? "default" : "secondary"}>
                        {book.available_copies > 0 ? "available" : "unavailable"}
                      </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">ISBN: {book.isbn}</p>
                      <p className="text-muted-foreground">Available copies: {book.available_copies}</p>
                </div>
              </CardContent>
              <CardFooter>
                      {book.available_copies > 0 ? (
                        <Button className="w-full" onClick={(e) => {
                          e.stopPropagation();
                          // Borrow action
                        }}>Borrow Book</Button>
                      ) : (
                        <Button className="w-full" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          // Reserve action
                        }}>Reserve</Button>
                      )}
              </CardFooter>
            </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookCatalog;
