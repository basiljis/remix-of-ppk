import { Link } from "react-router-dom";
import { Heart, Mail, Phone, FileText } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="border-t py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Heart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">universum.</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Развитие. Для каждого.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4 text-base">Продукт</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/for-organizations" className="hover:text-foreground transition-colors">Организациям</Link></li>
              <li><Link to="/for-specialists" className="hover:text-foreground transition-colors">Педагогам</Link></li>
              <li><Link to="/for-parents" className="hover:text-foreground transition-colors">Родителям</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4 text-base">Контакты</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                info@profilaktika.site
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                Пн-Пт, 10:00-18:00 МСК
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">ИП Загладин В.С.</p>
              <p className="text-xs text-muted-foreground">ИНН: 770702169499</p>
              <p className="text-xs text-muted-foreground">ОГРНИП: 323774600132891</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4 text-base">Документы</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span>Политика конфиденциальности</span>
                </Link>
              </li>
              <li>
              <Link 
                  to="/partnership-offer" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span>Партнёрская программа</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/documents" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span>Сертификация и безопасность</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} universum. Все права защищены.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Конфиденциальность</Link>
            <Link to="/partnership-offer" className="hover:text-foreground transition-colors">Партнёрство</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
