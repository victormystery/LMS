import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { borrowsService } from "@/services/borrows";
import { booksService } from "@/services/books";
import api from "@/lib/api_clean";
import { useToast } from "@/hooks/use-toast";

type BorrowRecord = {
	id: number;
	user_id: number;
	book_id: number;
	borrowed_at: string;
	due_date: string;
	returned_at?: string | null;
	fee_applied: number;
	book?: { title?: string; author?: string; isbn?: string };
};

const UserDashboard = () => {
	const navigate = useNavigate();
	const { toast } = useToast();
	const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [returningId, setReturningId] = useState<number | null>(null);

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			try {
				const data = await borrowsService.myBorrows();
				const borrows = data || [];
				// Fetch book metadata for each borrow (backend returns only book_id)
				const bookIds = Array.from(new Set(borrows.map(b => b.book_id)));
				const bookMap: Record<number, any> = {};
				await Promise.all(bookIds.map(async (id) => {
					try {
						const book = await booksService.getBook(id);
						bookMap[id] = book;
					} catch (e) {
						// ignore failures and leave metadata absent
					}
				}));
				setBorrows(borrows.map(b => ({ ...b, book: bookMap[b.book_id] })));
			} catch (err) {
				console.error("Failed to load borrows:", err);
				toast({ variant: "destructive", title: "Error", description: "Could not load your borrows." });
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, [toast]);

	const handleReturn = async (borrowId: number) => {
		setReturningId(borrowId);
		try {
			await borrowsService.returnBook(borrowId);
			toast({ title: "Book returned", description: "Thank you — book returned successfully." });
			// Refresh borrows
			setIsLoading(true);
			const data = await borrowsService.myBorrows();
			setBorrows(data || []);
		} catch (err) {
			console.error("Return failed:", err);
			toast({ variant: "destructive", title: "Return failed", description: (err as any)?.message || "Could not return the book." });
		} finally {
			setReturningId(null);
			setIsLoading(false);
		}
	};

	const overdueRecords = borrows.filter(b => !b.returned_at && new Date(b.due_date) < new Date());
	const totalLateFees = overdueRecords.reduce((sum, r) => sum + (r.fee_applied || 0), 0);

	const currentUser = api.getUser();

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b bg-card sticky top-0 z-10 shadow-sm">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<BookOpen className="w-6 h-6 text-primary" />
						<h1 className="text-xl font-bold">My Books</h1>
					</div>
					<Button variant="ghost" onClick={() => navigate("/catalog")}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Catalog
					</Button>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">
				{overdueRecords.length > 0 && (
					<Alert variant="destructive" className="mb-6">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							You have {overdueRecords.length} overdue book(s). Total late fees: ${totalLateFees.toFixed(2)}
						</AlertDescription>
					</Alert>
				)}

				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-4">Currently Borrowed</h2>
					{isLoading ? (
						<div className="text-center py-12">Loading your borrows...</div>
					) : borrows.length === 0 ? (
						<div className="text-muted-foreground">You have no borrowed books.</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{borrows.map((b) => {
								const isOverdue = !b.returned_at && new Date(b.due_date) < new Date();
								const title = b.book?.title ?? `Book #${b.book_id}`;
								const author = b.book?.author ?? "Unknown";
								return (
									<Card key={b.id} className={isOverdue ? "border-destructive" : ""}>
										<CardHeader>
											<CardTitle className="text-lg">{title}</CardTitle>
											<CardDescription>{author}</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Clock className="w-4 h-4" />
												<span>Due: {new Date(b.due_date).toLocaleDateString()}</span>
											</div>
											{isOverdue && (
												<div className="mt-2">
													<Badge variant="destructive">Overdue - ${b.fee_applied?.toFixed(2) ?? "0.00"} fee</Badge>
												</div>
											)}
										</CardContent>
										<CardFooter>
											<Button className="w-full" variant="outline" onClick={() => handleReturn(b.id)} disabled={returningId === b.id}>
												{returningId === b.id ? "Returning..." : "Return Book"}
											</Button>
										</CardFooter>
									</Card>
								);
							})}
						</div>
					)}
				</div>

				<div>
					<h2 className="text-2xl font-bold mb-4">Reservations</h2>
					<div className="text-muted-foreground">No reservations are available in the backend.</div>
				</div>
			</main>
		</div>
	);
};

export default UserDashboard;
