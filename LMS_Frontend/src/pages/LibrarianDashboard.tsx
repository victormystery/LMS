import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  BookOpen,
  Plus,
  Users,
  BookMarked,
  AlertCircle,
  LogOut,
} from "lucide-react";

import { booksService } from "@/services/books";
import { borrowsService } from "@/services/borrows";
import api from "@/lib/api_clean";
import { absoluteUrl } from "@/lib/api_clean";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";

import type { BorrowRead } from "@/services/borrows";

// ----------------------------------------------------------------------

type BookRow = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  description?: string;
  category?: string;
  publisher?: string;
  publication_year?: number;
  book_format?: string;
  shelf?: string;
  subcategory?: string;
  cover_url?: string;
};

// ===========================================================================
// 📌 MAIN COMPONENT – LIBRARIAN DASHBOARD
// ===========================================================================

const LibrarianDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ⭐ Preloaded categories
  const PRELOADED_CATEGORIES = [
    "Fiction",
    "Non-fiction",
    "Science",
    "Technology",
    "History",
    "Biography",
    "Children",
    "Religion",
    "Arts",
    "Business",
  ];

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [categories, setCategories] = useState<string[]>(PRELOADED_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const [deletingIsbn, setDeletingIsbn] = useState<string | null>(null);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);

  const [overdueBooks, setOverdueBooks] = useState<BorrowRead[]>([]);
  const [overdueExpanded, setOverdueExpanded] = useState(false);

  const overdueCount = overdueBooks.length;

  // ------------------- LOADERS -------------------

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await booksService.list();
      setBooks(res.data || []);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load books.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await booksService.getCategories();
      setCategories(PRELOADED_CATEGORIES);
    } catch {
      setCategories(PRELOADED_CATEGORIES);
    }
  };

  const loadOverdueBooks = async () => {
    try {
      const data = await borrowsService.overdueBorrows();
      setOverdueBooks(data || []);
    } catch {
      setOverdueBooks([]);
    }
  };

  // Load logged in user
  useEffect(() => {
    const stored = api.getUser();
    if (stored) setCurrentUser(stored);
  }, []);

  // Main load
  useEffect(() => {
    loadBooks();
    loadCategories();
    loadOverdueBooks();

    const fetchUser = async () => {
      try {
        const user = await api.fetchWithAuth(`/api/auth/me`);
        if (user) {
          api.saveUser(user);
          setCurrentUser(user);
        }
      } catch {
        const stored = api.getUser();
        if (stored && !currentUser) setCurrentUser(stored);
      }
    };
    fetchUser();

    const onReturned = () => {
      loadBooks();
      loadOverdueBooks();
    };
    window.addEventListener("borrow:returned", onReturned);
    return () => window.removeEventListener("borrow:returned", onReturned);
  }, []);

  // ------------------- RENDER -------------------

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Librarian Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserAvatar
                name={currentUser?.username}
                avatarUrl={currentUser?.avatar_url || currentUser?.avatarUrl}
              />
              <span className="text-sm text-muted-foreground">
                {currentUser?.username}
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                api.logout();
                navigate("/");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8">

        {/* TOP STATS */}
       
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {books.reduce((sum, b) => sum + b.total_copies, 0)}
              </div>
              <p className="text-xs text-muted-foreground">{books.length} titles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="text-sm font-medium">Currently Borrowed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {books.reduce(
                  (sum, b) => sum + (b.total_copies - b.available_copies),
                  0
                )}
              </div>
              <p className="text-xs text-muted-foreground">Borrowed copies</p>
            </CardContent>
          </Card>

          <Card className={overdueCount > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
              <AlertCircle
                className={`h-4 w-4 ${
                  overdueCount > 0 ? "text-destructive" : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  overdueCount > 0 ? "text-destructive" : ""
                }`}
              >
                {overdueCount}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setOverdueExpanded((v) => !v)}
              >
                {overdueExpanded ? "Hide Overdue" : "Show Overdue"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ============================= */}
        {/* OVERDUE TABLE */}
        {/* ============================= */}
        {overdueExpanded && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Overdue Books</CardTitle>
              <CardDescription>These books should have been returned.</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueBooks.length === 0 ? (
                <div className="text-muted-foreground">No overdue books</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueBooks.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.book_id}</TableCell>
                        <TableCell>{b.user_id}</TableCell>
                        <TableCell>
                          {new Date(b.due_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${b.fee_applied.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* ============================= */}
        {/* TABS */}
        {/* ============================= */}

        <Tabs defaultValue="catalog" className="space-y-4">
          <TabsList>
            <TabsTrigger value="catalog">Catalog Management</TabsTrigger>
            <TabsTrigger value="borrowed">Borrowed Books</TabsTrigger>
          </TabsList>

          {/* ============================= */}
          {/* CATALOG TAB */}
          {/* ============================= */}
          <TabsContent value="catalog" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Book Catalog</h2>

              <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" /> Add Book
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                    <DialogDescription>Enter book details.</DialogDescription>
                  </DialogHeader>

                  <AddBookForm
                    categories={categories}
                    onClose={() => setIsAddBookOpen(false)}
                    onCreated={loadBooks}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* ============================= */}
            {/* CATALOG TABLE */}
            {/* ============================= */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cover</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Publisher</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Shelf</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          {book.cover_url ? (
                            <img
                              src={absoluteUrl(book.cover_url)}
                              className="w-10 h-14 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-10 h-14 border rounded text-[10px] text-muted-foreground flex items-center justify-center">
                              No cover
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell className="text-muted-foreground">{book.isbn}</TableCell>
                        <TableCell className="text-muted-foreground">{book.publisher ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{book.publication_year ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{book.book_format ?? "-"}</TableCell>
                        <TableCell>{book.total_copies}</TableCell>

                        <TableCell>
                          <Badge variant={book.available_copies > 0 ? "default" : "secondary"}>
                            {book.available_copies}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">{book.shelf ?? "-"}</TableCell>

                        <TableCell className="flex gap-2">
                          <EditBookButton
                            book={book}
                            categories={categories}
                            onUpdated={loadBooks}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Remove book "${book.title}"?`)) return;

                              try {
                                setDeletingIsbn(book.isbn);
                                await booksService.deleteBook(book.isbn);
                                toast({
                                  title: "Deleted",
                                  description: `${book.title} removed.`,
                                });
                                await loadBooks();
                              } catch (err: any) {
                                toast({
                                  variant: "destructive",
                                  title: "Delete failed",
                                  description: err?.message,
                                });
                              } finally {
                                setDeletingIsbn(null);
                              }
                            }}
                          >
                            {deletingIsbn === book.isbn ? "Removing…" : "Remove"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================= */}
          {/* BORROWED TAB */}
          {/* ============================= */}
          <TabsContent value="borrowed" className="space-y-4">
            <h2 className="text-2xl font-bold">Borrowed Books</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {books.filter((b) => b.total_copies - b.available_copies > 0).length === 0 ? (
                <div className="text-muted-foreground col-span-full">
                  No borrowed titles.
                </div>
              ) : (
                books
                  .filter((b) => b.total_copies - b.available_copies > 0)
                  .map((b) => (
                    <Card key={b.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{b.title}</CardTitle>
                        <CardDescription className="text-sm">{b.author}</CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Borrowed</p>
                            <div className="text-xl font-bold">
                              {b.total_copies - b.available_copies}
                            </div>
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

// ===========================================================================
// 📌 ADD BOOK FORM (with real-time cover preview)
// ===========================================================================
// (This matches the version you approved earlier)

const AddBookForm = ({
  categories,
  onClose,
  onCreated,
}: {
  categories: string[];
  onClose: () => void;
  onCreated: () => void;
}) => {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [copies, setCopies] = useState<number>(1);
  const [description, setDescription] = useState("");

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  const [publisher, setPublisher] = useState("");
  const [publicationYear, setPublicationYear] = useState<number | "">("");

  const [bookFormat, setBookFormat] = useState("");
  const [shelf, setShelf] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const onSelectCover = (file: File | null) => {
    setCoverFile(file);

    if (!file) {
      setCoverPreview(null);
      return;
    }

    const ext = file.name.toLowerCase();
    if (!(ext.endsWith(".png") || ext.endsWith(".jpg") || ext.endsWith(".jpeg"))) {
      toast({
        variant: "destructive",
        title: "Invalid image format",
        description: "Only JPG/PNG allowed.",
      });
      setCoverFile(null);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Max size 3MB.",
      });
      setCoverFile(null);
      return;
    }

    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!title || !author || !isbn) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Title, author, and ISBN are required.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await booksService.createBook({
        title,
        author,
        isbn,
        total_copies: copies,
        description: description || undefined,
        category: category || undefined,
        subcategory: subcategory || undefined,
        publisher: publisher || undefined,
        publication_year:
          publicationYear === "" ? undefined : Number(publicationYear),
        book_format: bookFormat || undefined,
        shelf: shelf || undefined,
      });

      if (coverFile) {
        await booksService.uploadCover(res.id, coverFile);
      }

      toast({
        title: "Success",
        description: "Book added successfully.",
      });

      onCreated();
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: err?.message || "Could not create book.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Cover Preview</Label>
        {coverPreview ? (
          <img
            src={coverPreview}
            className="w-24 h-32 object-cover border rounded"
          />
        ) : (
          <div className="w-24 h-32 border rounded text-xs text-muted-foreground flex items-center justify-center">
            No cover
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => onSelectCover(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Author</Label>
        <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>ISBN</Label>
        <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Total Copies</Label>
        <Input
          type="number"
          min={1}
          value={copies}
          onChange={(e) => setCopies(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <select
          className="border rounded px-2 py-1"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">-- Select Category --</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Subcategory</Label>
        <Input
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Publisher</Label>
          <Input
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Publication Year</Label>
          <Input
            type="number"
            value={publicationYear}
            onChange={(e) =>
              setPublicationYear(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Format</Label>
          <Input
            value={bookFormat}
            onChange={(e) => setBookFormat(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Shelf</Label>
          <Input
            value={shelf}
            onChange={(e) => setShelf(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={loading} onClick={handleCreate}>
          {loading ? "Saving…" : "Add Book"}
        </Button>
      </div>
    </div>
  );
};

// ===========================================================================
// 📌 EDIT BOOK BUTTON (with persistent + live preview)
// ===========================================================================

const EditBookButton = ({
  book,
  categories,
  onUpdated,
}: {
  book: BookRow;
  categories: string[];
  onUpdated: () => void;
}) => {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [copies, setCopies] = useState(book.total_copies);
  const [description, setDescription] = useState(book.description || "");

  const [category, setCategory] = useState(book.category || "");
  const [subcategory, setSubcategory] = useState(book.subcategory || "");

  const [publisher, setPublisher] = useState(book.publisher || "");
  const [publicationYear, setPublicationYear] = useState<number | "">(
    book.publication_year ?? ""
  );

  const [bookFormat, setBookFormat] = useState(book.book_format || "");
  const [shelf, setShelf] = useState(book.shelf || "");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(
    absoluteUrl(book.cover_url)
  );

  const [loading, setLoading] = useState(false);

  const onSelectCover = (file: File | null) => {
    setCoverFile(file);

    if (!file) {
      setCoverPreview(absoluteUrl(book.cover_url));
      return;
    }

    const ext = file.name.toLowerCase();
    if (!(ext.endsWith(".png") || ext.endsWith(".jpg") || ext.endsWith(".jpeg"))) {
      toast({
        variant: "destructive",
        title: "Invalid image format",
        description: "Only JPG/PNG allowed.",
      });
      setCoverFile(null);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Max size 3MB.",
      });
      setCoverFile(null);
      return;
    }

    setCoverPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async () => {
    setLoading(true);

    try {
      await booksService.updateBook(book.id, {
        title,
        author,
        total_copies: copies,
        description: description || undefined,
        category: category || undefined,
        subcategory: subcategory || undefined,
        publisher: publisher || undefined,
        publication_year:
          publicationYear === "" ? undefined : Number(publicationYear),
        book_format: bookFormat || undefined,
        shelf: shelf || undefined,
      });

      // Upload cover if new file selected
      if (coverFile) {
        try {
          const res = await booksService.uploadCover(book.id, coverFile);
          await booksService.updateBook(book.id, { cover_url: res.cover_url });
        } catch (err) {
          console.warn("Cover upload failed", err);
        }
      }

      toast({
        title: "Updated",
        description: `"${title}" updated successfully.`,
      });

      onUpdated();
      setOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Book</DialogTitle>
          <DialogDescription>Update book details below.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* COVER PREVIEW */}
          <div className="space-y-2">
            <Label>Cover Preview</Label>
            <img
              src={coverPreview || absoluteUrl(book.cover_url)}
              className="w-24 h-32 object-cover border rounded"
            />
          </div>

          <div className="space-y-2">
            <Label>Replace Cover</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => onSelectCover(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">JPG/PNG, max 3MB</p>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Author</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Total Copies</Label>
            <Input
              type="number"
              min={1}
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="border px-3 py-2 rounded bg-background"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">-- Select category --</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Subcategory</Label>
            <Input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Publisher</Label>
              <Input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Publication Year</Label>
              <Input
                type="number"
                value={publicationYear}
                onChange={(e) =>
                  setPublicationYear(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Input
                value={bookFormat}
                onChange={(e) => setBookFormat(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Shelf</Label>
              <Input
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={loading} onClick={handleUpdate}>
              {loading ? "Updating…" : "Update Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LibrarianDashboard;
