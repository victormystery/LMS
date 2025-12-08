import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, Users, AlertCircle } from "lucide-react";
import type { BorrowRead } from "@/services/borrows";

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

interface DashboardStatsProps {
  books: BookRow[];
  overdueBooks: BorrowRead[];
  overdueExpanded: boolean;
  onToggleOverdue: () => void;
}

export const DashboardStats = ({
  books,
  overdueBooks,
  overdueExpanded,
  onToggleOverdue,
}: DashboardStatsProps) => {
  const overdueCount = overdueBooks.length;

  return (
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
            onClick={onToggleOverdue}
          >
            {overdueExpanded ? "Hide Overdue" : "Show Overdue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
