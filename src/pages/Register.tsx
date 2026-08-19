import { Link, useNavigate } from "react-router-dom";
import { Heart, GraduationCap, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const ROLES = [
  {
    id: "parent",
    title: "Родитель",
    desc: "Личный кабинет для семьи: тесты развития ребёнка, запись на консультации, доступ к заключениям. Бесплатно.",
    to: "/parent-auth",
    icon: Heart,
    accent: "text-pink-600",
    ring: "hover:border-pink-500/60",
  },
  {
    id: "specialist",
    title: "Педагог / Специалист",
    desc: "Психолог, логопед, дефектолог, тьютор, соц. педагог. Ведение карточек, ППк-протоколы, экспорт для ПМПК.",
    to: "/auth?mode=private",
    icon: GraduationCap,
    accent: "text-primary",
    ring: "hover:border-primary/60",
  },
  {
    id: "organization",
    title: "Организация",
    desc: "Школа, детский сад, ППМС-центр. Служба по Приказу 666, KPI, командная работа, единая подписка.",
    to: "/auth?mode=organization",
    icon: Building2,
    accent: "text-emerald-600",
    ring: "hover:border-emerald-500/60",
  },
];

export default function Register() {
  const navigate = useNavigate();

  useSeoMeta({
    title: "Регистрация — universum.",
    description:
      "Выберите роль: родитель, педагог или организация. universum. — экосистема поддержки развития детей для школ, центров и семей.",
    canonical: "https://unvrsm.ru/register",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar currentPage="auth" />
      <main className="flex-1 container mx-auto max-w-5xl px-4 pt-28 md:pt-32 pb-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Кто вы?</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Выберите тип аккаунта — мы направим вас на соответствующую форму входа или регистрации.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <Card
                key={r.id}
                onClick={() => navigate(r.to)}
                className={`cursor-pointer transition-all border-2 ${r.ring} hover:shadow-lg`}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className={`mb-4 ${r.accent}`}>
                    <Icon className="h-10 w-10" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{r.title}</h2>
                  <p className="text-sm text-muted-foreground flex-1">{r.desc}</p>
                  <Button asChild variant="ghost" className="mt-4 justify-between px-0 hover:bg-transparent">
                    <Link to={r.to}>
                      Продолжить <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Уже есть аккаунт? Выберите тип выше и нажмите «Войти» на странице авторизации.
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}
