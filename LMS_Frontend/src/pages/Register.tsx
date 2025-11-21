import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";

const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent, role: string) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    username: formData.username,
                    password: formData.password,
                    role,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Registration failed");
            }

            const data = await response.json();
            console.log("User registered:", data);

            // Redirect to login after successful registration
            navigate("/login");
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setIsLoading(false);
        }
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
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                    <CardDescription>Register to access the library system</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="user" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="user">User</TabsTrigger>
                            <TabsTrigger value="librarian">Librarian</TabsTrigger>
                        </TabsList>

                        {/* User Registration */}
                        <TabsContent value="user" className="space-y-4">
                            <form onSubmit={(e) => handleRegister(e, "user")} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        placeholder="John Doe"
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="johndoe"
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roles">Role</Label>
                                    <select
                                        id="roles"
                                        name="roles"
                                        required
                                        // onChange={handleChange}
                                        className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Select role</option>
                                        <option value="student">Student</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Registering..." : "Register"}
                                </Button>
                            </form>
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <button onClick={() => navigate("/")} className="text-primary hover:underline">
                                    Login
                                </button>
                            </div>
                        </TabsContent>

                        {/* Librarian Registration */}
                        <TabsContent value="librarian" className="space-y-4">
                            <form onSubmit={(e) => handleRegister(e, "librarian")} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lib_full_name">Full Name</Label>
                                    <Input
                                        id="lib_full_name"
                                        name="full_name"
                                        type="text"
                                        placeholder="Jane Smith"
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lib_username">Username</Label>
                                    <Input
                                        id="lib_username"
                                        name="username"
                                        type="text"
                                        placeholder="librarian01"
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lib_password">Password</Label>
                                    <Input
                                        id="lib_password"
                                        name="password"
                                        type="password"
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Registering..." : "Register"}
                                </Button>
                            </form>
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <button onClick={() => navigate("/")} className="text-primary hover:underline">
                                    Login
                                </button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;
