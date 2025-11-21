import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockBooks = [
  { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", status: "available", category: "Fiction" },
  { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0060935467", status: "borrowed", category: "Fiction" },
  { id: 3, title: "1984", author: "George Orwell", isbn: "978-0451524935", status: "available", category: "Fiction" },
  { id: 4, title: "Clean Code", author: "Robert C. Martin", isbn: "978-0132350884", status: "available", category: "Technology" },
  { id: 5, title: "Design Patterns", author: "Gang of Four", isbn: "978-0201633612", status: "borrowed", category: "Technology" },
  { id: 6, title: "The Pragmatic Programmer", author: "Andy Hunt", isbn: "978-0135957059", status: "available", category: "Technology" },
];

const BookCatalog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [books] = useState(mockBooks);

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
            <Button variant="ghost" onClick={() => navigate("/")}>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
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
                  <Badge variant={book.status === "available" ? "default" : "secondary"}>
                    {book.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">ISBN: {book.isbn}</p>
                  <p className="text-muted-foreground">Category: {book.category}</p>
                </div>
              </CardContent>
              <CardFooter>
                {book.status === "available" ? (
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
          ))}
        </div>
      </main>
    </div>
  );
};

export default BookCatalog;
