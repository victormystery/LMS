import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Check, X } from "lucide-react";
import { authService } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        password: "",
        role: "student",
    });
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{
        username?: string;
        full_name?: string;
    }>({});

    // Username validation
    const validateUsername = (username: string): string | null => {
        if (!username) return null;
        if (username.length < 3) return "Username must be at least 3 characters long";
        if (!/^[a-zA-Z]/.test(username)) return "Username must start with a letter";
        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username)) {
            return "Username can only contain letters, numbers, underscores, and hyphens";
        }
        return null;
    };

    // Full name validation
    const validateFullName = (fullName: string): string | null => {
        if (!fullName.trim()) return null;
        if (fullName.trim().length < 2) return "Full name must be at least 2 characters long";
        if (!/^[a-zA-Z][a-zA-Z\s'-]*$/.test(fullName)) {
            return "Full name can only contain letters, spaces, hyphens, and apostrophes";
        }
        return null;
    };

    // Password validation rules
    const validatePassword = (password: string) => {
        return {
            minLength: password.length >= 8,
            hasLetter: /[a-zA-Z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSymbol: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(password),
        };
    };

    const passwordRules = validatePassword(formData.password);
    const isPasswordValid = Object.values(passwordRules).every(Boolean);
    const isFormValid = isPasswordValid && 
        !validationErrors.username && 
        !validationErrors.full_name &&
        formData.username.length >= 3 &&
        formData.full_name.trim().length >= 2;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Validate on change
        if (name === "username") {
            const error = validateUsername(value);
            setValidationErrors(prev => ({ ...prev, username: error || undefined }));
        } else if (name === "full_name") {
            const error = validateFullName(value);
            setValidationErrors(prev => ({ ...prev, full_name: error || undefined }));
        }
    };

    const handleRoleChange = (value: string) => {
        setFormData({ ...formData, role: value });
    };

    const handleRegister = async (roleParam?: string) => {
        // Validate all fields
        const usernameError = validateUsername(formData.username);
        const fullNameError = validateFullName(formData.full_name);

        if (usernameError || fullNameError) {
            setValidationErrors({
                username: usernameError || undefined,
                full_name: fullNameError || undefined,
            });
            toast({
                variant: "destructive",
                title: "Validation error",
                description: usernameError || fullNameError || "Please fix the errors in the form.",
            });
            return;
        }

        if (!isPasswordValid) {
            toast({
                variant: "destructive",
                title: "Invalid password",
                description: "Please ensure your password meets all security requirements.",
            });
            return;
        }

        setIsLoading(true);

        try {
            const userData = {
                username: formData.username,
                password: formData.password,
                full_name: formData.full_name,
                role: formData.role,
            };

            await authService.register(userData);

            toast({
                title: "Registration successful",
                description: "Please sign in with your new account.",
            });
            navigate("/");
        } catch (error: any) {
            console.error("Registration failed:", error);
            const errorMessage = error?.response?.data?.detail || "Please check your details and try again.";
            toast({
                variant: "destructive",
                title: "Registration failed",
                description: errorMessage,
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-400/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            <Card className="w-full max-w-md shadow-2xl relative z-10 border-2 border-white/20 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        Create an Account
                    </CardTitle>
                    <CardDescription className="text-base">Register to access the library system</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                type="text"
                                placeholder="John Doe"
                                required
                                onChange={handleChange}
                                className={validationErrors.full_name ? "border-red-500" : ""}
                            />
                            {validationErrors.full_name && (
                                <p className="text-sm text-red-500">{validationErrors.full_name}</p>
                            )}
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
                                className={validationErrors.username ? "border-red-500" : ""}
                            />
                            {validationErrors.username && (
                                <p className="text-sm text-red-500">{validationErrors.username}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select 
                                value={formData.role} 
                                onValueChange={handleRoleChange}
                                onOpenChange={setRoleDropdownOpen}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select your role" />
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
                            style={{ marginTop: roleDropdownOpen ? '120px' : '10' }}
                        >
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                onChange={handleChange}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                            />
                            {(passwordFocused || formData.password) && (
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
                        <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
                            disabled={isLoading || !isFormValid}
                        >
                            {isLoading ? "Registering..." : "Register"}
                        </Button>
                    </form>
                    <div className="text-center text-sm text-muted-foreground mt-4">
                        Already have an account?{" "}
                        <button 
                            onClick={() => navigate("/")} 
                            className="text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all"
                        >
                            Login
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;
