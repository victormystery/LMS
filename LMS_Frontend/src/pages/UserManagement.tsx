import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Trash2, RefreshCw, Check, X, BookOpen, DollarSign, LogOut, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { userService, User, CreateUserData } from "@/services/users";
import UserAvatar from "@/components/UserAvatar";
import api from "@/lib/api_clean";

const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [newUser, setNewUser] = useState<CreateUserData>({
    username: "",
    password: "",
    full_name: "",
    role: "student",
  });

  // Password validation
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  
  useEffect(() => {
    const user = api.getUser();
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    api.logout();
    navigate("/login");
  };
  
  const validatePassword = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(password),
    };
  };

  const passwordRules = validatePassword(newUser.password);
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!isPasswordValid) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "Please ensure your password meets all security requirements.",
      });
      return;
    }

    setIsCreating(true);
    try {
      await userService.createUser(newUser);
      toast({
        title: "User created",
        description: `User ${newUser.username} has been created successfully.`,
      });
      setIsCreateDialogOpen(false);
      setNewUser({
        username: "",
        password: "",
        full_name: "",
        role: "student",
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to create user.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    try {
      await userService.deleteUser(userId);
      toast({
        title: "User deleted",
        description: `User ${username} has been deleted.`,
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete user.",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "librarian":
        return "default";
      case "faculty":
        return "secondary";
      case "student":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">User Management</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/librarian-dashboard")}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/payments")}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </Button>
            <div className="flex items-center gap-2">
              <UserAvatar
                name={currentUser?.username}
                avatarUrl={currentUser?.avatar_url || currentUser?.avatarUrl}
              />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage library users and their roles</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the library system.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                        onOpenChange={setRoleDropdownOpen}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]" side="bottom" align="start">
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                          <SelectItem value="librarian">Librarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div 
                      className="space-y-2 transition-all duration-300" 
                      style={{ marginTop: roleDropdownOpen ? '120px' : '0' }}
                    >
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder="Enter password"
                      />
                      {(passwordFocused || newUser.password) && (
                        <div className="mt-2 p-3 bg-muted rounded-md text-xs space-y-1">
                          <p className="font-semibold mb-2">Password must contain:</p>
                          <div className="flex items-center gap-2">
                            {passwordRules.minLength ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span className={passwordRules.minLength ? "text-green-500" : "text-muted-foreground"}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordRules.hasLetter ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span className={passwordRules.hasLetter ? "text-green-500" : "text-muted-foreground"}>
                              At least one letter (a-z, A-Z)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordRules.hasNumber ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span className={passwordRules.hasNumber ? "text-green-500" : "text-muted-foreground"}>
                              At least one number (0-9)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordRules.hasSymbol ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span className={passwordRules.hasSymbol ? "text-green-500" : "text-muted-foreground"}>
                              At least one symbol (!@#$%^&*...)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateUser}
                      disabled={isCreating || !isPasswordValid || !newUser.username || !newUser.full_name}
                    >
                      {isCreating ? "Creating..." : "Create User"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the user <strong>{user.username}</strong>.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default UserManagement;
