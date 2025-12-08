import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { booksService } from "@/services/books";
import { absoluteUrl } from "@/lib/api_clean";
import { AddBookForm } from "./AddBookForm";
import { EditBookButton } from "./EditBookButton";

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

interface CatalogManagementProps {
  books: BookRow[];
  categories: string[];
  onReload: () => void;
}

export const CatalogManagement = ({
  books,
  categories,
  onReload,
}: CatalogManagementProps) => {
  const { toast } = useToast();
  const [deletingIsbn, setDeletingIsbn] = useState<string | null>(null);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);

  return (
    <div className="space-y-4">
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
              onCreated={onReload}
            />
          </DialogContent>
        </Dialog>
      </div>

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
                  <TableCell className="text-muted-foreground">
                    {book.publisher ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {book.publication_year ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {book.book_format ?? "-"}
                  </TableCell>
                  <TableCell>{book.total_copies}</TableCell>

                  <TableCell>
                    <Badge
                      variant={book.available_copies > 0 ? "default" : "secondary"}
                    >
                      {book.available_copies}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {book.shelf ?? "-"}
                  </TableCell>

                  <TableCell className="flex gap-2">
                    <EditBookButton
                      book={book}
                      categories={categories}
                      onUpdated={onReload}
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
                          await onReload();
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
    </div>
  );
};
