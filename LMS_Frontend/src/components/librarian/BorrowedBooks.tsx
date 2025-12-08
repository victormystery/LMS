import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

interface BorrowedBooksProps {
  books: BookRow[];
}

export const BorrowedBooks = ({ books }: BorrowedBooksProps) => {
  const borrowedBooks = books.filter(
    (b) => b.total_copies - b.available_copies > 0
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Borrowed Books</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {borrowedBooks.length === 0 ? (
          <div className="text-muted-foreground col-span-full">
            No borrowed titles.
          </div>
        ) : (
          borrowedBooks.map((b) => (
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
    </div>
  );
};
