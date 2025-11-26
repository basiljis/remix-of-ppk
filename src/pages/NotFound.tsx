import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import notFoundImage from "@/assets/404-illustration.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl mx-auto">
        <img 
          src={notFoundImage} 
          alt="404 - Страница не найдена" 
          className="w-full max-w-lg mx-auto mb-8"
        />
        <h1 className="text-4xl font-bold mb-4 text-foreground">
          Страница не найдена
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>
        <Button 
          onClick={() => navigate("/")} 
          size="lg"
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          На главную
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
