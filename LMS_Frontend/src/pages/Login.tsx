import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import api from "@/lib/api_clean";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const handleLogin = async (roleParam?: string) => {
    setIsLoading(true);
    try {
      const username = credentials.username;
      const password = credentials.password;
      const data = await authService.login(username, password);
      if (data?.access_token) {
        api.setToken(data.access_token);
      }
      if (data?.user) {
        api.saveUser(data.user);
        if (data.user.role === "librarian") {
          navigate("/librarian-dashboard");
        } else {
          navigate("/catalog");
        }
      } else if (roleParam === "librarian") {
        navigate("/librarian-dashboard");
      } else {
        navigate("/");
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
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
                <form onSubmit={(e) => { e.preventDefault(); handleLogin("user"); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-username">Username</Label>
                  <Input
                    id="user-username"
                    name="username"
                    type="text"
                    placeholder="username"
                    required
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Password</Label>
                  <Input
                    id="user-password"
                    name="password"
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  />
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
              <form onSubmit={(e) => { e.preventDefault(); handleLogin("librarian"); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="librarian-username">Username</Label>
                  <Input
                    id="librarian-username"
                    name="username"
                    type="text"
                    placeholder="librarianusername"
                    required
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="librarian-password">Password</Label>
                  <Input
                    id="librarian-password"
                    name="password"
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  />
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
