import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Phone, FileText, Rss, BookOpen } from "lucide-react";
import brandLogo from "@/assets/brand-logo.png";

export default function LandingFooter() {
  const { t } = useTranslation("pages");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={brandLogo} alt="universum." className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold">universum.</span>
            </Link>
            <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-base">{t("footer.product")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/for-organizations" className="hover:text-foreground transition-colors">{t("footer.organizations")}</Link></li>
              <li><Link to="/for-specialists" className="hover:text-foreground transition-colors">{t("footer.specialists")}</Link></li>
              <li><Link to="/for-parents" className="hover:text-foreground transition-colors">{t("footer.parents")}</Link></li>
              <li><Link to="/instructions" className="hover:text-foreground transition-colors">{t("footer.instructions")}</Link></li>
              <li><Link to="/templates" className="hover:text-foreground transition-colors">{t("footer.templates", "Шаблоны документов")}</Link></li>
              <li><Link to="/guides/ppk-conclusion" className="hover:text-foreground transition-colors">{t("footer.guideConclusion", "Заключение ППк")}</Link></li>
              <li><Link to="/guides/ppk-protocol" className="hover:text-foreground transition-colors">{t("footer.guideProtocol", "Протокол ППк")}</Link></li>
              <li><Link to="/guides/pmpk-preparation" className="hover:text-foreground transition-colors">{t("footer.guidePmpk", "Подготовка к ПМПК")}</Link></li>
              <li><Link to="/guides/workload-norms" className="hover:text-foreground transition-colors">{t("footer.guideWorkload", "Нормы часов")}</Link></li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> {t("footer.blog")}
                </Link>
              </li>
              <li>
                <a href="/rss.xml" className="hover:text-foreground transition-colors inline-flex items-center gap-1" aria-label={t("footer.rssAria")}>
                  <Rss className="h-3.5 w-3.5" /> RSS
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-base">{t("footer.contacts")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                info@profilaktika.site
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                {t("footer.workHours")}
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">{t("footer.ipName")}</p>
              <p className="text-xs text-muted-foreground">{t("footer.inn")}</p>
              <p className="text-xs text-muted-foreground">{t("footer.ogrnip")}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-base">{t("footer.documents")}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/privacy-policy" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                  <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span>{t("footer.privacy")}</span>
                </Link>
              </li>
              <li>
                <Link to="/partnership-offer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                  <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span>{t("footer.partnership")}</span>
                </Link>
              </li>
              <li>
                <Link to="/documents" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                  <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span>{t("footer.certification")}</span>
                </Link>
              </li>
              <li>
                <Link to="/installation" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                  <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span>{t("footer.installation")}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025{year > 2025 ? `–${year}` : '–2026'} universum. {t("footer.rights")}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/legal" className="hover:text-foreground transition-colors">{t("footer.legalNav")}</Link>
            <Link to="/patents" className="hover:text-foreground transition-colors">{t("footer.patents")}</Link>
            <Link to="/registry" className="hover:text-foreground transition-colors">{t("footer.registry")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
