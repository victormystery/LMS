import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { username, password } = credentials;
      const data = await authService.login(username, password);
      
      if (data?.access_token) {
        // Store token under the username immediately so it won't be saved under "default"
        api.setToken(data.access_token, username);
        
        // Also ask backend to set a cookie for SSE authentication (send credentials)
        try {
          await fetch(`${api.API_URL}/api/auth/set-cookie`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: data.access_token }),
          });
        } catch (e) {
          // ignore cookie set failure
        }
      }
      
      if (data?.user) {
        api.saveUser(data.user);
        
        // Redirect based on user role from backend
        switch (data.user.role) {
          case "librarian":
            navigate("/librarian-dashboard");
            break;
          case "student":
          case "faculty":
            navigate("/catalog");
            break;
          default:
            navigate("/catalog");
        }
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.full_name || username}!`,
        });
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-400/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md shadow-2xl relative z-10 border-2 border-white/20 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Library Management
          </CardTitle>
          <CardDescription className="text-base">Sign in to access your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                required
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground mt-4">
                Don't have an account?{" "}
                <button
                  onClick={handleRegisterRedirect}
                  className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Register
                </button>
              </div>
            </CardContent>
          </Card>
    </div>
  );
};

export default Login;
