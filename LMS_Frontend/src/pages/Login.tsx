import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent, role: string) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock login - in real app, this would call authentication API
    setTimeout(() => {
      setIsLoading(false);
      if (role === "librarian") {
        navigate("/librarian-dashboard");
      } else {
        navigate("/catalog");
      }
    }, 1000);
  };

  const handleRegisterRedirect = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Library Management</CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">User</TabsTrigger>
              <TabsTrigger value="librarian">Librarian</TabsTrigger>
            </TabsList>

            {/* USER LOGIN TAB */}
            <TabsContent value="user" className="space-y-4">
              <form onSubmit={(e) => handleLogin(e, "user")} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-username">Username</Label>
                  <Input id="user-username" type="text" placeholder="username" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Password</Label>
                  <Input id="user-password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Don’t have an account?{" "}
                <button
                  onClick={handleRegisterRedirect}
                  className="text-primary hover:underline"
                >
                  Register
                </button>
              </div>
            </TabsContent>

            {/* LIBRARIAN LOGIN TAB */}
            <TabsContent value="librarian" className="space-y-4">
              <form onSubmit={(e) => handleLogin(e, "librarian")} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="librarian-username">Username</Label>
                  <Input
                    id="librarian-username"
                    type="text"
                    placeholder="librarianusername"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="librarian-password">Password</Label>
                  <Input id="librarian-password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
