import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Plus, Users, BookMarked, AlertCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { booksService } from "@/services/books";
import { useToast } from "@/hooks/use-toast";

type BookRow = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
};

const LibrarianDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingIsbn, setDeletingIsbn] = useState<string | null>(null);

  const overdueCount = 0; // Backend doesn't expose global overdue list; keep 0 or implement backend endpoint

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await booksService.getBooks();
      setBooks(data || []);
    } catch (err) {
      console.error("Failed to load books:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not load catalog." });
    } finally {
      setLoading(false);
    }
  };

  // load on mount
  useEffect(() => { loadBooks(); }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Librarian Dashboard</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{books.reduce((sum, b) => sum + b.total_copies, 0)}</div>
              <p className="text-xs text-muted-foreground">Across {books.length} titles</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Borrowed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{books.reduce((sum, b) => sum + (b.total_copies - b.available_copies), 0)}</div>
              <p className="text-xs text-muted-foreground">Currently borrowed across catalog</p>
            </CardContent>
          </Card>
          <Card className={overdueCount > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
              <AlertCircle className={`h-4 w-4 ${overdueCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overdueCount > 0 ? "text-destructive" : ""}`}>{overdueCount}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="catalog" className="space-y-4">
          <TabsList>
            <TabsTrigger value="catalog">Catalog Management</TabsTrigger>
            <TabsTrigger value="borrowed">Borrowed Books</TabsTrigger>
          </TabsList>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Book Catalog</h2>
              <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Book
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                    <DialogDescription>Enter the details of the book to add to the catalog.</DialogDescription>
                  </DialogHeader>
                  <AddBookForm onClose={() => setIsAddBookOpen(false)} onCreated={async () => {
                    setIsAddBookOpen(false);
                    await loadBooks();
                  }} />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Total Copies</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell className="text-muted-foreground">{book.isbn}</TableCell>
                        <TableCell>{book.total_copies}</TableCell>
                        <TableCell>
                          <Badge variant={book.available_copies > 0 ? "default" : "secondary"}>
                            {book.available_copies}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={async () => {
                            // TODO: wire edit
                            toast({ title: "Edit", description: "Edit is not implemented yet." });
                          }}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={async () => {
                            if (!confirm(`Remove book ${book.title}?`)) return;
                            try {
                              setDeletingIsbn(book.isbn);
                              await booksService.deleteBook(book.isbn);
                              toast({ title: "Deleted", description: `${book.title} removed.` });
                              await loadBooks();
                            } catch (err) {
                              console.error("Delete failed:", err);
                              toast({ variant: "destructive", title: "Delete failed", description: (err as any)?.message || "Could not delete book." });
                            } finally {
                              setDeletingIsbn(null);
                            }
                          }}>{deletingIsbn === book.isbn ? "Removing..." : "Remove"}</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Borrowed Books Tab */}
          <TabsContent value="borrowed" className="space-y-4">
            <h2 className="text-2xl font-bold">Borrowed Books Tracking</h2>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Backend does not expose a global borrow-tracking endpoint. Borrowed counts are derived from catalog availability.</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const AddBookForm = ({ onClose, onCreated }: { onClose: () => void; onCreated?: () => Promise<void> }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [copies, setCopies] = useState(1);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await booksService.createBook({ title, author, isbn, total_copies: copies });
      toast({ title: "Book added", description: `${title} added to catalog.` });
      if (onCreated) await onCreated();
      onClose();
    } catch (err) {
      console.error("Create failed:", err);
      toast({ variant: "destructive", title: "Add failed", description: (err as any)?.message || "Could not add book." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="author">Author</Label>
        <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="isbn">ISBN</Label>
        <Input id="isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978-XXXXXXXXXX" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="copies">Number of Copies</Label>
        <Input id="copies" type="number" min={1} value={copies} onChange={(e) => setCopies(Number(e.target.value))} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} disabled={loading}>{loading ? "Adding..." : "Add Book"}</Button>
      </div>
    </div>
  );
};

export default LibrarianDashboard;
