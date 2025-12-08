import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { BorrowRead } from "@/services/borrows";

interface OverdueTableProps {
  overdueBooks: BorrowRead[];
  isExpanded: boolean;
}

export const OverdueTable = ({ overdueBooks, isExpanded }: OverdueTableProps) => {
  if (!isExpanded) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Overdue Books</CardTitle>
        <CardDescription>These books should have been returned. Fines are calculated in real-time: £5 initial + £1 per hour.</CardDescription>
      </CardHeader>
      <CardContent>
        {overdueBooks.length === 0 ? (
          <div className="text-muted-foreground">No overdue books</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Hours Overdue</TableHead>
                <TableHead>Current Fine</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueBooks.map((b: any) => {
                const hoursOverdue = b.hours_overdue || 0;
                const currentFee = b.current_fee || b.fee_applied || 0;
                
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.book_title || `Book #${b.book_id}`}</div>
                    </TableCell>
                    <TableCell>
                      <div>{b.full_name || b.username || `User #${b.user_id}`}</div>
                      <div className="text-xs text-muted-foreground">{b.username}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.role === 'student' ? 'default' : 'secondary'}>
                        {b.role || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(b.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="text-red-500 font-semibold">{hoursOverdue}h</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-bold">£{currentFee.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.payment_status === 'paid' ? 'outline' : 'destructive'}>
                        {b.payment_status || 'unpaid'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
