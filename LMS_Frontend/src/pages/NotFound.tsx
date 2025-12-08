import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-400/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="text-center relative z-10 p-8 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl border-2 border-white/20">
        <h1 className="mb-4 text-6xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">404</h1>
        <p className="mb-6 text-2xl text-muted-foreground">Oops! Page not found</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-white font-semibold hover:from-red-700 hover:via-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
