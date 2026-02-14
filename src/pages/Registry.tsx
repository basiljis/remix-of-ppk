import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { ExternalLink, CheckCircle, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Registry() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Реестр отечественного ПО</h1>
            <p className="text-muted-foreground text-lg">
              Сведения о включении программного обеспечения в Единый реестр российского ПО
            </p>
          </div>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Зарегистрированное ПО</h2>
            </div>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base leading-tight">
                      АИС СПТ — Автоматизированная информационная система социально-психологического тестирования
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0 text-xs">
                    В реестре
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Компонент платформы universum., внесённый в Единый реестр российских программ для электронных 
                  вычислительных машин и баз данных Минцифры России. Реестровая запись подтверждает соответствие 
                  программного обеспечения требованиям, предъявляемым к отечественному ПО.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Реестровая запись №</span>{" "}
                    <span className="font-medium">3607428</span>
                  </div>
                  <a
                    href="https://reestr.digital.gov.ru/reestr/3607428/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    Открыть в реестре Минцифры
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
