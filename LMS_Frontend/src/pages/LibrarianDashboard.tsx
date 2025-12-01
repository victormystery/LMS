import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Plus, Users, BookMarked, AlertCircle, LogOut } from "lucide-react";
import { booksService } from "@/lib/api_clean";
import { useToast } from "@/hooks/use-toast";

type BookRow = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  description?: string;
};

const LibrarianDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIsbn, setDeletingIsbn] = useState<string | null>(null);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);

  const overdueCount = 0; // backend placeholder

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await booksService.list();
      setBooks(res.data || []);
    } catch (err) {
      console.error("Failed to load books:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not load catalog." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Librarian Dashboard</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

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
              <div className="text-2xl font-bold">
                {books.reduce((sum, b) => sum + (b.total_copies - b.available_copies), 0)}
              </div>
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
                    <Plus className="w-4 h-4 mr-2" /> Add Book
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                    <DialogDescription>Enter the details of the book to add to the catalog.</DialogDescription>
                  </DialogHeader>
                  <AddBookForm onClose={() => setIsAddBookOpen(false)} onCreated={loadBooks} />
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
                          <Badge variant={book.available_copies > 0 ? "default" : "secondary"}>{book.available_copies}</Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <EditBookButton book={book} onUpdated={loadBooks} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Remove book ${book.title}?`)) return;
                              try {
                                setDeletingIsbn(book.isbn);
                                await booksService.deleteBook(book.isbn);
                                toast({ title: "Deleted", description: `${book.title} removed.` });
                                await loadBooks();
                              } catch (err) {
                                console.error("Delete failed:", err);
                                toast({
                                  variant: "destructive",
                                  title: "Delete failed",
                                  description: (err as any)?.message || "Could not delete book.",
                                });
                              } finally {
                                setDeletingIsbn(null);
                              }
                            }}
                          >
                            {deletingIsbn === book.isbn ? "Removing..." : "Remove"}
                          </Button>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {books.filter((b) => b.total_copies - b.available_copies > 0).length === 0 ? (
                <div className="text-muted-foreground col-span-full">No currently borrowed titles.</div>
              ) : (
                books.filter((b) => b.total_copies - b.available_copies > 0).map((b) => (
                  <Card key={b.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{b.title}</CardTitle>
                      <CardDescription className="text-sm">{b.author}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Borrowed copies</p>
                          <div className="text-xl font-bold">{b.total_copies - b.available_copies}</div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <div className="font-medium">{b.total_copies}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Add Book Form
const AddBookForm = ({ onClose, onCreated }: { onClose: () => void; onCreated?: () => Promise<void> }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [copies, setCopies] = useState(1);
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await booksService.createBook({ title, author, isbn, total_copies: copies, description });
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
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief summary of the book" />
        <p className="text-xs text-muted-foreground">Optional: Add a short description of the book.</p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} disabled={loading}>{loading ? "Adding..." : "Add Book"}</Button>
      </div>
    </div>
  );
};

// Edit Book Button
const EditBookButton = ({ book, onUpdated }: { book: BookRow; onUpdated: () => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [copies, setCopies] = useState(book.total_copies);
  const [description, setDescription] = useState(book.description || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await booksService.updateBook(book.id, { title, author, total_copies: copies, description });
      toast({ title: "Book updated", description: `${title} updated.` });
      if (onUpdated) await onUpdated();
      setOpen(false);
    } catch (err) {
      console.error("Update failed:", err);
      toast({ variant: "destructive", title: "Update failed", description: (err as any)?.message || "Could not update book." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Book</DialogTitle>
          <DialogDescription>Update book information.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-author">Author</Label>
            <Input id="edit-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-copies">Number of Copies</Label>
            <Input id="edit-copies" type="number" min={1} value={copies} onChange={(e) => setCopies(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief summary of the book" />
            <p className="text-xs text-muted-foreground">Optional: Update the book description.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={loading}>{loading ? "Updating..." : "Update Book"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LibrarianDashboard;
