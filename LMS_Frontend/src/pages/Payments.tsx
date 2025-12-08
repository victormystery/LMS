import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, RefreshCw, AlertCircle, BookOpen, UserCog, LogOut, Home, History, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentService, BorrowWithPayment, PaymentSummary } from "@/services/payments";
import UserAvatar from "@/components/UserAvatar";
import api from "@/lib/api_clean";

const Payments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unpaidFees, setUnpaidFees] = useState<BorrowWithPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<BorrowWithPayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ total_unpaid: 0, total_paid: 0, count_unpaid: 0, count_paid: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [historyFilter, setHistoryFilter] = useState<string>("");

  useEffect(() => {
    const user = api.getUser();
    setCurrentUser(user);
  }, []);

  const isLibrarian = currentUser?.role === "librarian" || currentUser?.role === "admin";

  const fetchUnpaidFees = async () => {
    setIsLoading(true);
    try {
      if (isLibrarian) {
        const [fees, summaryData] = await Promise.all([
          paymentService.getAllUnpaidFees(),
          paymentService.getAllPaymentSummary()
        ]);
        setUnpaidFees(fees);
        setSummary(summaryData);
      } else {
        const [fees, summaryData] = await Promise.all([
          paymentService.getUnpaidFees(),
          paymentService.getPaymentSummary(),
        ]);
        setUnpaidFees(fees);
        setSummary(summaryData);
      }
    } catch (error) {
      console.error("Failed to fetch unpaid fees:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment information.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentHistory = async (filter?: string) => {
    setIsLoadingHistory(true);
    try {
      const history = isLibrarian 
        ? await paymentService.getAllPaymentHistory(filter || undefined, 200)
        : await paymentService.getPaymentHistory(filter || undefined);
      setPaymentHistory(history);
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment history.",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUnpaidFees();
      fetchPaymentHistory();
    }
  }, [currentUser]);

  const handlePayFee = async (borrowId: number) => {
    setPayingId(borrowId);
    try {
      const result = await paymentService.payLateFee(borrowId);
      toast({
        title: "✅ Payment Successful",
        description: result.message || "Your late fee has been paid successfully.",
      });
      await Promise.all([fetchUnpaidFees(), fetchPaymentHistory(historyFilter)]);
    } catch (error: any) {
      console.error("Failed to pay fee:", error);
      toast({
        variant: "destructive",
        title: "❌ Payment Failed",
        description: error.message || error.response?.data?.detail || "Failed to process payment.",
      });
    } finally {
      setPayingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getHoursOverdue = (dueDate: string, returnedAt: string) => {
    const due = new Date(dueDate);
    const returned = new Date(returnedAt);
    const diff = returned.getTime() - due.getTime();
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return hours > 0 ? hours : 0;
  };

  const handleLogout = () => {
    api.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <DollarSign className="w-6 h-6" />
            <h1 className="text-xl font-bold">Payments & Revenue</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(isLibrarian ? "/librarian-dashboard" : "/catalog")}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            {isLibrarian && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/user-management")}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <UserCog className="w-4 h-4 mr-2" />
                Users
              </Button>
            )}
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <UserAvatar
                name={currentUser?.username}
                avatarUrl={currentUser?.avatar_url || currentUser?.avatarUrl}
              />
              <span className="text-sm text-white font-medium">{currentUser?.username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-red-200 dark:border-red-900/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 opacity-50 pointer-events-none"></div>
            <CardHeader className="relative">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-red-700 dark:text-red-400">Unpaid Fees</CardTitle>
                  <CardDescription>Outstanding late fees</CardDescription>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">£{summary.total_unpaid.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.count_unpaid} {summary.count_unpaid === 1 ? "fee" : "fees"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-900/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 opacity-50 pointer-events-none"></div>
            <CardHeader className="relative">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-green-700 dark:text-green-400">Total Paid</CardTitle>
                  <CardDescription>Fees paid from history</CardDescription>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">£{summary.total_paid.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.count_paid} {summary.count_paid === 1 ? "payment" : "payments"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-900/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 opacity-50 pointer-events-none"></div>
            <CardHeader className="relative">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-blue-700 dark:text-blue-400">Total Revenue</CardTitle>
                  <CardDescription>
                    {isLibrarian ? "All collections" : "All fees"}
                  </CardDescription>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                £{(summary.total_paid + summary.total_unpaid).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.count_paid + summary.count_unpaid} total records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert for unpaid fees */}
        {!isLibrarian && summary.count_unpaid > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unpaid Late Fees</AlertTitle>
            <AlertDescription>
              You have {summary.count_unpaid} unpaid late {summary.count_unpaid === 1 ? "fee" : "fees"} totaling £{summary.total_unpaid}. 
              Please pay them to avoid account restrictions.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs for Unpaid and History */}
        <Tabs defaultValue="unpaid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 p-1">
            <TabsTrigger 
              value="unpaid" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Unpaid Fees ({summary.count_unpaid})
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <History className="w-4 h-4 mr-2" />
              Payment History
            </TabsTrigger>
          </TabsList>

          {/* Unpaid Fees Tab */}
          <TabsContent value="unpaid">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Unpaid Fees</CardTitle>
                    <CardDescription>
                      {isLibrarian 
                        ? "Late fees for overdue book returns from all users" 
                        : "Late fees for overdue book returns"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUnpaidFees}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : unpaidFees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No unpaid fees. You're all set! ✅
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Borrow ID</TableHead>
                        {isLibrarian && <TableHead>User</TableHead>}
                        {isLibrarian && <TableHead>Role</TableHead>}
                        <TableHead>Book {isLibrarian && "ID"}</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Returned</TableHead>
                        <TableHead>Hours Overdue</TableHead>
                        <TableHead>Fee Amount</TableHead>
                        {!isLibrarian && <TableHead className="text-right">Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidFees.map((borrow) => (
                        <TableRow key={borrow.id}>
                          <TableCell>{borrow.id}</TableCell>
                          {isLibrarian && (
                            <TableCell>
                              <div>
                                <div className="font-medium">{borrow.full_name}</div>
                                <div className="text-sm text-muted-foreground">{borrow.username}</div>
                              </div>
                            </TableCell>
                          )}
                          {isLibrarian && (
                            <TableCell>
                              <Badge variant={borrow.role === "student" ? "default" : "secondary"}>
                                {borrow.role}
                              </Badge>
                            </TableCell>
                          )}
                          <TableCell>
                            {borrow.book_title || `#${borrow.book_id}`}
                          </TableCell>
                          <TableCell>{formatDate(borrow.due_date)}</TableCell>
                          <TableCell>
                            {borrow.returned_at ? formatDate(borrow.returned_at) : (
                              <Badge variant="destructive">Not returned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {borrow.returned_at
                              ? getHoursOverdue(borrow.due_date, borrow.returned_at)
                              : getHoursOverdue(borrow.due_date, new Date().toISOString())}
                          </TableCell>
                          <TableCell className="font-semibold">
                            £{borrow.fee_applied}
                          </TableCell>
                          {!isLibrarian && (
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handlePayFee(borrow.id)}
                                disabled={payingId === borrow.id}
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                {payingId === borrow.id ? "Processing..." : "Pay Now"}
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>
                      {isLibrarian 
                        ? "All payment records from students and faculty" 
                        : "Your complete payment history"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="border rounded px-3 py-1 text-sm"
                      value={historyFilter}
                      onChange={(e) => {
                        setHistoryFilter(e.target.value);
                        fetchPaymentHistory(e.target.value);
                      }}
                    >
                      <option value="">All</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPaymentHistory(historyFilter)}
                      disabled={isLoadingHistory}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingHistory ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="text-center py-8">Loading history...</div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment records found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        {isLibrarian && <TableHead>User</TableHead>}
                        <TableHead>Book</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.borrowed_at)}</TableCell>
                          {isLibrarian && (
                            <TableCell>
                              <div>
                                <div className="font-medium">{record.full_name}</div>
                                <div className="text-sm text-muted-foreground">{record.username}</div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>{record.book_title || `Book #${record.book_id}`}</TableCell>
                          <TableCell className="font-semibold">£{record.fee_applied}</TableCell>
                          <TableCell>
                            <Badge variant={record.payment_status === "paid" ? "outline" : "destructive"}>
                              {record.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.paid_at ? formatDate(record.paid_at) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
};

export default Payments;
