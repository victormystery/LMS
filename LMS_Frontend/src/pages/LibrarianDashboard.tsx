import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  BookOpen,
  Users,
  LogOut,
  UserCog,
  DollarSign,
  LibraryBig,
} from "lucide-react";

import { booksService } from "@/services/books";
import { borrowsService } from "@/services/borrows";
import api from "@/lib/api_clean";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";

import { DashboardStats } from "@/components/librarian/DashboardStats";
import { OverdueTable } from "@/components/librarian/OverdueTable";
import { CatalogManagement } from "@/components/librarian/CatalogManagement";
import { BorrowedBooks } from "@/components/librarian/BorrowedBooks";
import { FilteredBorrowedBooks } from "@/components/librarian/FilteredBorrowedBooks";

import type { BorrowRead } from "@/services/borrows";

// ----------------------------------------------------------------------

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

// ===========================================================================
// 📌 MAIN COMPONENT – LIBRARIAN DASHBOARD
// ===========================================================================

const LibrarianDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ⭐ Preloaded categories
  const PRELOADED_CATEGORIES = [
    "Fiction",
    "Non-fiction",
    "Science",
    "Technology",
    "History",
    "Biography",
    "Children",
    "Religion",
    "Arts",
    "Business",
  ];

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [categories, setCategories] = useState<string[]>(PRELOADED_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const [overdueBooks, setOverdueBooks] = useState<BorrowRead[]>([]);
  const [overdueExpanded, setOverdueExpanded] = useState(false);

  // ------------------- LOADERS -------------------

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await booksService.list();
      setBooks(res.data || []);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load books.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await booksService.getCategories();
      setCategories(PRELOADED_CATEGORIES);
    } catch {
      setCategories(PRELOADED_CATEGORIES);
    }
  };

  const loadOverdueBooks = async () => {
    try {
      const data = await borrowsService.overdueBorrows();
      setOverdueBooks(data || []);
    } catch {
      setOverdueBooks([]);
    }
  };

  // Load logged in user
  useEffect(() => {
    const stored = api.getUser();
    if (stored) setCurrentUser(stored);
  }, []);

  // Main load
  useEffect(() => {
    loadBooks();
    loadCategories();
    loadOverdueBooks();

    const fetchUser = async () => {
      try {
        const user = await api.fetchWithAuth(`/api/auth/me`);
        if (user) {
          api.saveUser(user);
          setCurrentUser(user);
        }
      } catch {
        const stored = api.getUser();
        if (stored && !currentUser) setCurrentUser(stored);
      }
    };
    fetchUser();

    const onReturned = () => {
      loadBooks();
      loadOverdueBooks();
    };
    window.addEventListener("borrow:returned", onReturned);
    return () => window.removeEventListener("borrow:returned", onReturned);
  }, []);

  // ------------------- RENDER -------------------

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <LibraryBig className="w-6 h-6" />
            <h1 className="text-xl font-bold">Librarian Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/user-management")}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <UserCog className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/payments")}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </Button>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <UserAvatar
                name={currentUser?.username}
                avatarUrl={currentUser?.avatar_url || currentUser?.avatarUrl}
              />
              <span className="text-sm text-white font-medium">
                {currentUser?.username}
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                api.logout();
                navigate("/");
              }}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8">
        {/* TOP STATS */}
        <DashboardStats
          books={books}
          overdueBooks={overdueBooks}
          overdueExpanded={overdueExpanded}
          onToggleOverdue={() => setOverdueExpanded((v) => !v)}
        />

        {/* OVERDUE TABLE */}
        <OverdueTable overdueBooks={overdueBooks} isExpanded={overdueExpanded} />

        {/* TABS */}
        <Tabs defaultValue="catalog" className="space-y-4">
          <TabsList>
            <TabsTrigger value="catalog">Catalog Management</TabsTrigger>
            <TabsTrigger value="borrowed">Currently Borrowed</TabsTrigger>
            <TabsTrigger value="all-borrowed">All Borrowed Books</TabsTrigger>
          </TabsList>

          {/* CATALOG TAB */}
          <TabsContent value="catalog" className="space-y-4">
            <CatalogManagement
              books={books}
              categories={categories}
              onReload={loadBooks}
            />
          </TabsContent>

          {/* BORROWED TAB */}
          <TabsContent value="borrowed" className="space-y-4">
            <BorrowedBooks books={books} />
          </TabsContent>

          {/* ALL BORROWED BOOKS WITH FILTERS TAB */}
          <TabsContent value="all-borrowed" className="space-y-4">
            <FilteredBorrowedBooks categories={categories} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LibrarianDashboard;
