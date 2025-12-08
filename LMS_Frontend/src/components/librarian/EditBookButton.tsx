import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { booksService } from "@/services/books";
import { absoluteUrl } from "@/lib/api_clean";

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

interface EditBookButtonProps {
  book: BookRow;
  categories: string[];
  onUpdated: () => void;
}

export const EditBookButton = ({
  book,
  categories,
  onUpdated,
}: EditBookButtonProps) => {
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
