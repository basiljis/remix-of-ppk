import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export interface RelatedLink {
  to: string;
  title: string;
  description: string;
}

interface RelatedLinksProps {
  title?: string;
  links: RelatedLink[];
}

/**
 * Блок перелинковки: связывает гайды, блог, нормативную базу и продуктовые страницы.
 * Улучшает индексацию и распределение веса между страницами.
 */
export function RelatedLinks({ title = "Читайте также", links }: RelatedLinksProps) {
  if (!links.length) return null;

  return (
    <section className="py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">{title}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    {link.title}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Каталог основных посадочных страниц для перелинковки */
export const SITE_LINKS: Record<string, RelatedLink> = {
  pmpk: {
    to: "/guides/pmpk-preparation",
    title: "Подготовка к ПМПК",
    description: "Документы, этапы обследования, отличия от ППк и права родителей.",
  },
  conclusion: {
    to: "/guides/ppk-conclusion",
    title: "Как оформить заключение ППк",
    description: "Структура коллегиального заключения, формулировки и типовые ошибки.",
  },
  protocol: {
    to: "/guides/ppk-protocol",
    title: "Протокол заседания ППк: образец",
    description: "Обязательные реквизиты протокола, порядок ведения и хранения.",
  },
  workload: {
    to: "/guides/workload-norms",
    title: "Нормы часов и нагрузка специалистов",
    description: "СанПиН и приказы: длительность занятий, ставка, документация.",
  },
  templates: {
    to: "/templates",
    title: "Шаблоны и бланки ППк",
    description: "Готовые к скачиванию бланки: согласия, представления, протоколы.",
  },
  legal: {
    to: "/legal",
    title: "Нормативно-правовая база",
    description: "Актуальные приказы, распоряжения и методические рекомендации.",
  },
  blog: {
    to: "/blog",
    title: "Блог и новости",
    description: "Разборы практики, изменения законодательства, инструменты работы.",
  },
  forSpecialists: {
    to: "/for-specialists",
    title: "Специалистам",
    description: "Карточка ребёнка, диагностика, документы и динамика в одном месте.",
  },
  forOrganizations: {
    to: "/for-organizations",
    title: "Школам и ППМС-центрам",
    description: "Организация работы ППк, контроль сроков и отчётность.",
  },
  forParents: {
    to: "/for-parents",
    title: "Родителям",
    description: "Что такое ППк, какие права у семьи и как читать заключение.",
  },
};
