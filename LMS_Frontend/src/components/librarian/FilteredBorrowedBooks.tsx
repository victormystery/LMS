import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, X } from "lucide-react";
import api from "@/lib/api_clean";
import { useToast } from "@/hooks/use-toast";

interface BorrowRecord {
  id: number;
  user_id: number;
  book_id: number;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  user?: {
    username: string;
    full_name: string;
    role: string;
  };
  book?: {
    title: string;
    author: string;
    category: string;
    isbn: string;
  };
}

interface FilteredBorrowedBooksProps {
  categories: string[];
}

export const FilteredBorrowedBooks = ({ categories }: FilteredBorrowedBooksProps) => {
  const { toast } = useToast();
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    includeReturned: true,
  });

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.category) params.append("category", filters.category);
      params.append("include_returned", filters.includeReturned.toString());

      const response = await api.fetchWithAuth(`/api/borrows/all?${params.toString()}`);
      setBorrows(response || []);
    } catch (error: any) {
      console.error("Failed to fetch borrows:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.detail || "Failed to load borrowed books",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrows();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchBorrows();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      category: "",
      includeReturned: true,
    });
    setTimeout(() => fetchBorrows(), 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-2 border-purple-200 dark:border-purple-800">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 pointer-events-none"></div>
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Borrowed Books
          </CardTitle>
          <CardDescription>
            Filter borrowed books by date range and category
          </CardDescription>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                From Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                To Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Include Returned */}
            <div className="space-y-2">
              <Label htmlFor="includeReturned">Status</Label>
              <Select
                value={filters.includeReturned.toString()}
                onValueChange={(value) => handleFilterChange("includeReturned", value === "true")}
              >
                <SelectTrigger id="includeReturned">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">All Books</SelectItem>
                  <SelectItem value="false">Active Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleApplyFilters}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              {loading ? "Loading..." : "Apply Filters"}
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Borrowed Books ({borrows.length})</CardTitle>
          <CardDescription>
            {filters.startDate || filters.endDate || filters.category
              ? "Filtered results"
              : "All borrowed books"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading borrowed books...
            </div>
          ) : borrows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No borrowed books found matching the filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Borrowed Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrows.map((borrow) => (
                    <TableRow key={borrow.id}>
                      <TableCell className="font-medium">
                        {borrow.book?.title || "Unknown"}
                      </TableCell>
                      <TableCell>{borrow.book?.author || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{borrow.book?.category || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{borrow.user?.full_name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">
                            @{borrow.user?.username || "unknown"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            borrow.user?.role === "faculty"
                              ? "default"
                              : borrow.user?.role === "student"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {borrow.user?.role || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(borrow.borrowed_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(borrow.due_date)}
                      </TableCell>
                      <TableCell>
                        {borrow.returned_at ? (
                          <Badge variant="default" className="bg-green-600">
                            Returned
                          </Badge>
                        ) : new Date(borrow.due_date) < new Date() ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
