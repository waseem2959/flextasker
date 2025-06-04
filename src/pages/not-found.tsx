import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-primary">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-[hsl(206,33%,16%)]">404</h1>
        <p className="text-xl text-[hsl(220,14%,46%)] mb-4">Oops! Page not found</p>
        <a href="/" className="text-[hsl(196,80%,43%)] hover:text-[hsl(192,84%,26%)] underline transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
