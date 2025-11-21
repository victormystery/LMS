import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockBorrowedBooks = [
  { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", dueDate: "2025-12-01", isOverdue: false },
  { id: 3, title: "1984", author: "George Orwell", dueDate: "2025-11-28", isOverdue: false },
  { id: 4, title: "Clean Code", author: "Robert C. Martin", dueDate: "2025-11-10", isOverdue: true, lateFee: 5.00 },
];

const mockReservedBooks = [
  { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", reservedOn: "2025-11-15", position: 2 },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const overdueBooks = mockBorrowedBooks.filter(book => book.isOverdue);
  const totalLateFees = overdueBooks.reduce((sum, book) => sum + (book.lateFee || 0), 0);

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {overdueBooks.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {overdueBooks.length} overdue book(s). Total late fees: ${totalLateFees.toFixed(2)}
            </AlertDescription>
          </Alert>
        )}

        {/* Borrowed Books */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Currently Borrowed</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockBorrowedBooks.map((book) => (
              <Card key={book.id} className={book.isOverdue ? "border-destructive" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                  <CardDescription>{book.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Due: {book.dueDate}</span>
                  </div>
                  {book.isOverdue && (
                    <div className="mt-2">
                      <Badge variant="destructive">Overdue - ${book.lateFee?.toFixed(2)} fee</Badge>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">Return Book</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Reserved Books */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Reservations</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockReservedBooks.map((book) => (
              <Card key={book.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                  <CardDescription>{book.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Reserved on: {book.reservedOn}</p>
                    <Badge variant="secondary">Position in queue: {book.position}</Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">Cancel Reservation</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
