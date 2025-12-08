import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { booksService } from "@/services/books";

interface AddBookFormProps {
  categories: string[];
  onClose: () => void;
  onCreated: () => void;
}

export const AddBookForm = ({
  categories,
  onClose,
  onCreated,
}: AddBookFormProps) => {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [isbnError, setIsbnError] = useState("");
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

  const handleIsbnChange = (value: string) => {
    // Only allow digits and hyphens
    const cleaned = value.replace(/[^0-9-]/g, '');
    setIsbn(cleaned);
    
    // Validate ISBN format (10 or 13 digits, allowing hyphens)
    const digitsOnly = cleaned.replace(/-/g, '');
    if (cleaned && !/^\d{10}(\d{3})?$/.test(digitsOnly)) {
      setIsbnError("ISBN must be 10 or 13 digits");
    } else {
      setIsbnError("");
    }
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

    if (isbnError) {
      toast({
        variant: "destructive",
        title: "Invalid ISBN",
        description: isbnError,
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
      console.error("Book creation error:", err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Could not create book.";
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: errorMessage,
        duration: 5000,
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
        <Input 
          value={isbn} 
          onChange={(e) => handleIsbnChange(e.target.value)}
          placeholder="Enter 10 or 13 digit ISBN"
          className={isbnError ? "border-red-500" : ""}
        />
        {isbnError && (
          <p className="text-sm text-red-500">{isbnError}</p>
        )}
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
