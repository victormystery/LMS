import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, Star, User, Clock, Users } from "lucide-react";

// Mock data - in real app, this would come from API based on book ID
const mockBookDetails = {
  id: 1,
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  isbn: "978-0743273565",
  status: "available",
  category: "Fiction",
  description: "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, near New York City, the novel depicts first-person narrator Nick Carraway's interactions with mysterious millionaire Jay Gatsby and Gatsby's obsession to reunite with his former lover, Daisy Buchanan. The novel was inspired by a youthful romance Fitzgerald had with socialite Ginevra King, and the riotous parties he attended on Long Island's North Shore in 1922.",
  publishYear: 1925,
  totalCopies: 3,
  availableCopies: 2,
  publisher: "Charles Scribner's Sons",
  pages: 180,
};

const mockReviews = [
  { id: 1, user: "John Doe", userType: "Faculty", rating: 5, comment: "A timeless classic that beautifully captures the American Dream and its disillusionment.", date: "2025-10-15" },
  { id: 2, user: "Jane Smith", userType: "Student", rating: 4, comment: "Excellent prose and vivid characters. The symbolism adds depth to the narrative.", date: "2025-09-20" },
  { id: 3, user: "Bob Wilson", userType: "Student", rating: 5, comment: "One of the best novels I've read. Fitzgerald's writing is magnificent.", date: "2025-08-10" },
];

const mockBorrowingHistory = [
  { id: 1, user: "Alice Johnson", userType: "Student", borrowedDate: "2025-11-01", returnedDate: "2025-11-15", status: "returned" },
  { id: 2, user: "Mike Brown", userType: "Faculty", borrowedDate: "2025-10-15", returnedDate: "2025-10-29", status: "returned" },
  { id: 3, user: "Sarah Davis", userType: "Student", borrowedDate: "2025-11-20", returnedDate: null, status: "borrowed" },
];

const mockReservationQueue = [
  { id: 1, user: "Tom Wilson", userType: "Student", reservedDate: "2025-11-18", position: 1 },
  { id: 2, user: "Emma White", userType: "Faculty", reservedDate: "2025-11-19", position: 2 },
];

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book] = useState(mockBookDetails);
  const [reviews] = useState(mockReviews);
  const [borrowingHistory] = useState(mockBorrowingHistory);
  const [reservationQueue] = useState(mockReservationQueue);

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Library System</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Book Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{book.title}</CardTitle>
                    <CardDescription className="text-base mt-2">{book.author}</CardDescription>
                  </div>
                  <Badge variant={book.status === "available" ? "default" : "secondary"} className="shrink-0">
                    {book.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(averageRating) ? "fill-accent text-accent" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ISBN:</span>
                    <span className="font-medium">{book.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{book.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Publisher:</span>
                    <span className="font-medium">{book.publisher}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published:</span>
                    <span className="font-medium">{book.publishYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pages:</span>
                    <span className="font-medium">{book.pages}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Availability:</span>
                    <span className="font-medium">
                      {book.availableCopies} / {book.totalCopies} copies
                    </span>
                  </div>
                  <Progress value={(book.availableCopies / book.totalCopies) * 100} />
                </div>

                <Separator />

                <div className="space-y-2">
                  {book.status === "available" ? (
                    <Button className="w-full" size="lg">
                      Borrow Book
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" variant="outline">
                      Reserve Book
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="queue">Queue</TabsTrigger>
              </TabsList>

              {/* Description Tab */}
              <TabsContent value="description">
                <Card>
                  <CardHeader>
                    <CardTitle>About this book</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{book.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>User Reviews</CardTitle>
                    <CardDescription>{reviews.length} reviews</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {reviews.map((review, index) => (
                      <div key={review.id}>
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {review.user
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{review.user}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {review.userType}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{review.date}</span>
                                </div>
                              </div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? "fill-accent text-accent" : "text-muted"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          </div>
                        </div>
                        {index < reviews.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Borrowing History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Borrowing History</CardTitle>
                    <CardDescription>Complete record of all borrowing activities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {borrowingHistory.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{record.user}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {record.userType}
                              </Badge>
                              <span>•</span>
                              <span>Borrowed: {record.borrowedDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={record.status === "returned" ? "secondary" : "default"}>
                            {record.status}
                          </Badge>
                          {record.returnedDate && (
                            <p className="text-xs text-muted-foreground mt-1">Returned: {record.returnedDate}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reservation Queue Tab */}
              <TabsContent value="queue">
                <Card>
                  <CardHeader>
                    <CardTitle>Reservation Queue</CardTitle>
                    <CardDescription>
                      {reservationQueue.length > 0
                        ? `${reservationQueue.length} user(s) waiting`
                        : "No active reservations"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reservationQueue.length > 0 ? (
                      <div className="space-y-4">
                        {reservationQueue.map((reservation) => (
                          <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                <span className="font-bold text-accent">#{reservation.position}</span>
                              </div>
                              <div>
                                <p className="font-medium">{reservation.user}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {reservation.userType}
                                  </Badge>
                                  <span>•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>Reserved: {reservation.reservedDate}</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary">In Queue</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No one is currently waiting for this book</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookDetail;
