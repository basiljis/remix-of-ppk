import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Heart, Menu, GraduationCap, Building2, Home 
} from "lucide-react";

interface PublicNavbarProps {
  showHomeButton?: boolean;
  currentPage?: 'organizations' | 'specialists' | 'parents' | 'auth' | 'landing' | 'catalog-specialists' | 'catalog-organizations' | 'other';
  showSecondaryNav?: boolean;
  variant?: 'full' | 'minimal';
}

export function PublicNavbar({ 
  showHomeButton = true, 
  currentPage, 
  showSecondaryNav = true,
  variant = 'full'
}: PublicNavbarProps) {
  const isSpecialistsCatalog = currentPage === 'catalog-specialists';
  const isOrganizationsCatalog = currentPage === 'catalog-organizations';

  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">universum.</span>
          </Link>
          
          {variant === 'full' && (
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/for-organizations" 
                className={`text-sm ${currentPage === 'organizations' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
              >
                Организациям
              </Link>
              <Link 
                to="/for-specialists" 
                className={`text-sm ${currentPage === 'specialists' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
              >
                Педагогам
              </Link>
              <Link 
                to="/for-parents" 
                className={`text-sm ${currentPage === 'parents' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
              >
                Родителям
              </Link>
              <ThemeToggle />
              <Link to="/auth">
                <Button size="sm">Вход</Button>
              </Link>
            </nav>
          )}

          {variant === 'minimal' && (
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Link to="/parent-auth">
                <Button variant="outline" size="sm">Вход для родителей</Button>
              </Link>
            </div>
          )}
          
          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Меню</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground px-3">Каталог</p>
                    <Link 
                      to="/specialists" 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSpecialistsCatalog ? 'bg-muted font-medium' : 'hover:bg-muted'}`}
                    >
                      <GraduationCap className="h-4 w-4" />
                      Найти специалиста
                    </Link>
                    <Link 
                      to="/organizations" 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isOrganizationsCatalog ? 'bg-muted font-medium' : 'hover:bg-muted'}`}
                    >
                      <Building2 className="h-4 w-4" />
                      Найти организацию
                    </Link>
                  </div>
                  
                  {variant === 'full' && (
                    <div className="border-t pt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground px-3">Информация</p>
                      <Link 
                        to="/for-organizations" 
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        Организациям
                      </Link>
                      <Link 
                        to="/for-specialists" 
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        Педагогам
                      </Link>
                      <Link 
                        to="/for-parents" 
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        Родителям
                      </Link>
                    </div>
                  )}
                  
                  {showHomeButton && (
                    <div className="border-t pt-4">
                      <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <Home className="h-4 w-4" />
                        На главную
                      </Link>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <Link to={variant === 'minimal' ? "/parent-auth" : "/auth"} className="block">
                      <Button className="w-full">Вход</Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Secondary navigation bar for public catalog - hidden on mobile */}
      {showSecondaryNav && (
        <div className="hidden md:block fixed top-16 left-0 right-0 z-40 bg-muted/50 backdrop-blur border-b">
          <div className="container mx-auto flex h-10 items-center justify-center gap-6 px-4">
            <Link 
              to="/specialists" 
              className={`text-sm transition-colors flex items-center gap-1.5 ${isSpecialistsCatalog ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Найти специалиста
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link 
              to="/organizations" 
              className={`text-sm transition-colors flex items-center gap-1.5 ${isOrganizationsCatalog ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Найти организацию
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

// Simplified search bar component for embedding in existing headers
export function SearchNavBar({ currentPage }: { currentPage?: 'specialists' | 'organizations' }) {
  return (
    <div className="hidden md:block fixed top-16 left-0 right-0 z-40 bg-muted/50 backdrop-blur border-b">
      <div className="container mx-auto flex h-10 items-center justify-center gap-6 px-4">
        <Link 
          to="/specialists" 
          className={`text-sm transition-colors flex items-center gap-1.5 ${currentPage === 'specialists' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          Найти специалиста
        </Link>
        <span className="text-muted-foreground/30">|</span>
        <Link 
          to="/organizations" 
          className={`text-sm transition-colors flex items-center gap-1.5 ${currentPage === 'organizations' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Найти организацию
        </Link>
      </div>
    </div>
  );
}
