import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Shield, Server, FileCheck, ScrollText, Building2, Lock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const certifications = [
  {
    title: "152-ФЗ УЗ-1 — Защита персональных данных",
    icon: Shield,
    badge: "Высший уровень",
    description:
      "Платформа Cloud.ru Evolution имеет уровень защиты УЗ-1 — максимальный уровень защищённости персональных данных согласно Федеральному закону №152-ФЗ «О персональных данных». Сертификаты выданы контролирующими органами и подтверждают соответствие инфраструктуры всем требованиям.",
  },
  {
    title: "Сертификаты ЦОДов размещения",
    icon: Server,
    badge: "Tier III",
    description:
      "Центры обработки данных, в которых размещается инфраструктура платформы, соответствуют стандартам Uptime Institute Tier III Design, Tier III Facility и Tier III Operation — это гарантия отказоустойчивости и доступности.",
  },
];

const licenses = [
  {
    name: "Лицензия Роскомнадзора №171948",
    date: "07.02.2019",
    scope: "Оказание услуг связи по предоставлению каналов связи",
  },
  {
    name: "Лицензия Роскомнадзора №171946",
    date: "07.02.2019",
    scope: "Услуги связи по передаче данных",
  },
  {
    name: "Лицензия Роскомнадзора №171949",
    date: "07.02.2019",
    scope: "Оказание телематических услуг связи",
  },
  {
    name: "Лицензия ЦЛСЗ ФСБ ЛСЗ №0017477",
    date: "11.03.2020",
    scope: "Разработка, производство и распространение шифровальных (криптографических) средств, информационных и телекоммуникационных систем",
  },
  {
    name: "Лицензия ФСТЭК КИ 0321 №016150",
    date: "11.09.2019",
    scope: "Техническая защита конфиденциальной информации",
  },
  {
    name: "Лицензия ФСТЭК КИ 0319 №016030",
    date: "30.06.2020",
    scope: "Разработка и производство средств защиты конфиденциальной информации",
  },
];

export default function Documents() {
  useSeoMeta({
    title: "Сертификация и безопасность — ФЗ-152, УЗ-1, Cloud.ru | universum.",
    description: "Документы и сертификаты безопасности платформы universum.: соответствие ФЗ-152 (УЗ-1), размещение в ЦОД Tier III, сертификаты ФСТЭК. Защита персональных данных детей.",
    canonical: "/documents",
    keywords: "ФЗ-152 УЗ-1, персональные данные, ФСТЭК, ЦОД Tier III, cloud.ru, безопасность образовательной платформы",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Page header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Документы</h1>
            <p className="text-muted-foreground text-lg">
              Сертификация, лицензии и нормативное соответствие платформы
            </p>
          </div>

          {/* Certification section */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Сертификация и безопасность</h2>
            </div>

            <p className="text-muted-foreground mb-6">
              Инфраструктура universum. размещена на платформе{" "}
              <a
                href="https://cloud.ru/docs/evolution/overview/topics/security__compliance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Cloud.ru Evolution
                <ExternalLink className="h-3 w-3" />
              </a>
              , которая включает многоуровневую систему защиты информации, соответствующую требованиям
              законодательства РФ и лучшим мировым практикам кибербезопасности.
            </p>

            <div className="grid gap-4 md:grid-cols-2 mb-8">
              {certifications.map((cert) => {
                const Icon = cert.icon;
                return (
                  <Card key={cert.title} className="border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base leading-tight">{cert.title}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0 text-xs">
                          {cert.badge}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{cert.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <Separator className="mb-12" />

          {/* Licenses section */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <FileCheck className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Лицензии</h2>
            </div>

            <p className="text-muted-foreground mb-6">
              Cloud.ru имеет лицензии, выданные соответствующими регуляторами, на оказание услуг связи
              и на работу с различными средствами защиты конфиденциальной информации.
            </p>

            <div className="space-y-3">
              {licenses.map((license) => (
                <Card key={license.name} className="border-border/60">
                  <CardContent className="py-4 px-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{license.name}</span>
                      </div>
                      <Badge variant="outline" className="w-fit text-xs flex-shrink-0">
                        от {license.date}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{license.scope}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="mb-12" />

          {/* Client responsibility note */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Аттестации клиентов</h2>
            </div>
            <Card className="border-border/60 bg-muted/30">
              <CardContent className="py-5 px-5">
                <p className="text-sm text-muted-foreground">
                  Соответствие облачной платформы Evolution нормативным актам и наличие сертификатов
                  не снимает с клиента обязательства по проведению аттестаций и сертификаций
                  в отношении собственной инфраструктуры, построенной поверх инфраструктуры
                  облачной платформы, в случаях, когда это необходимо.
                </p>
              </CardContent>
            </Card>
          </section>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
