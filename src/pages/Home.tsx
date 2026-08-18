import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { FaqSection, homeFaqItems } from "@/components/home/FaqSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { LeadCaptureForm } from "@/components/home/LeadCaptureForm";
import { StickyMobileCta } from "@/components/home/StickyMobileCta";
import { Typewriter } from "@/components/home/Typewriter";
import { ProtocolValidationInfo } from "@/components/ProtocolValidationInfo";

import {
  Building2,
  GraduationCap,
  Users,
  ShieldCheck,
  ClipboardCheck,
  CalendarDays,
  FileText,
  BarChart3,
  ArrowRight,
  Sparkles,
  Award,
  Lock,
  Scale,
} from "lucide-react";

export default function Home() {
  const { t, i18n } = useTranslation("pages");

  const audiences = [
    {
      icon: Building2,
      title: t("homePage.audiences.orgTitle"),
      description: t("homePage.audiences.orgDesc"),
      href: "/for-organizations",
      color: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: GraduationCap,
      title: t("homePage.audiences.specTitle"),
      description: t("homePage.audiences.specDesc"),
      href: "/for-specialists",
      color: "from-orange-500/10 to-orange-500/5",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: Users,
      title: t("homePage.audiences.parTitle"),
      description: t("homePage.audiences.parDesc"),
      href: "/for-parents",
      color: "from-emerald-500/10 to-emerald-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const features = [
    {
      icon: ClipboardCheck,
      title: t("homePage.features.protocolsTitle"),
      description: t("homePage.features.protocolsDesc"),
    },
    {
      icon: CalendarDays,
      title: t("homePage.features.scheduleTitle"),
      description: t("homePage.features.scheduleDesc"),
    },
    {
      icon: FileText,
      title: t("homePage.features.diagnosticsTitle"),
      description: t("homePage.features.diagnosticsDesc"),
    },
    {
      icon: BarChart3,
      title: t("homePage.features.analyticsTitle"),
      description: t("homePage.features.analyticsDesc"),
    },
  ];

  const trust = [
    { icon: ShieldCheck, label: t("homePage.trust.fzLabel"), sub: t("homePage.trust.fzSub") },
    { icon: Award, label: t("homePage.trust.registryLabel"), sub: t("homePage.trust.registrySub") },
    { icon: Lock, label: t("homePage.trust.securityLabel"), sub: t("homePage.trust.securitySub") },
    { icon: Sparkles, label: t("homePage.trust.orderLabel"), sub: t("homePage.trust.orderSub") },
  ];

  const stats = [
    { value: "150+", label: t("homePage.stats.organizations") },
    { value: "2 000+", label: t("homePage.stats.specialists") },
    { value: "50 000+", label: t("homePage.stats.protocols") },
    { value: t("homePage.stats.fiveYears"), label: t("homePage.stats.storageYears") },
  ];

  const isEn = i18n.resolvedLanguage === "en" || i18n.language?.startsWith("en");

  // JSON-LD structured data — boosts rich snippets in Yandex/Google
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Universum",
      url: "https://unvrsm.ru/",
      logo: "https://unvrsm.ru/og-image.png",
      description: t("homePage.seoDescription"),
      sameAs: [
        "https://t.me/universum_platform",
        "https://vk.com/universum_platform",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        availableLanguage: isEn ? ["English", "Russian"] : ["Russian"],
        areaServed: "RU",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Universum",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      url: "https://unvrsm.ru/",
      description: t("homePage.seoDescription"),
      offers: {
        "@type": "Offer",
        price: "330",
        priceCurrency: "RUB",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "330",
          priceCurrency: "RUB",
          unitText: "MONTH",
        },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "127",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: homeFaqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  useSeoMeta({
    title: t("homePage.seoTitle"),
    description: t("homePage.seoDescription"),
    canonical: "https://unvrsm.ru/",
    keywords: t("homePage.seoKeywords", "universum, PPC automation, child development platform, educators tool, education software"),
    jsonLd,
    ogTitle: t("homePage.ogTitle"),
    ogDescription: t("homePage.ogDescription"),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="landing" />

      <main>
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 -z-10 h-[400px] w-[800px] rounded-full bg-primary/10 blur-3xl" />

        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-background/50 backdrop-blur text-sm text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("homePage.badge")}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 min-h-[1.2em]">
            {t("homePage.heroTitle1")}{" "}
            <Typewriter
              words={(t("homePage.heroRotating", { returnObjects: true }) as string[]) || [t("homePage.heroTitle2")]}
              className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            />
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("homePage.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button asChild size="lg" className="text-base h-12 px-8">
              <a href="#lead-form">
                {t("homePage.ctaDemo")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base h-12 px-8"
            >
              <Link to="/register">{t("homePage.ctaTryFree")}</Link>
            </Button>
          </div>

          {/* Stats — скрыто */}
        </div>
      </section>

      {/* 3 Audiences */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("homePage.audiences.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("homePage.audiences.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((a) => (
              <Link key={a.href} to={a.href} className="group" aria-label={`${t("homePage.audiences.more")}: ${a.title}`}>
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 border-border/50">
                  <CardContent className="p-8">
                    <div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-5`}
                    >
                      <a.icon className={`h-7 w-7 ${a.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                      {a.description}
                    </p>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary">
                      {t("homePage.audiences.more")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Trust */}
      <section className="py-16 md:py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("homePage.trust.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("homePage.trust.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trust.map((tr) => (
              <div
                key={tr.label}
                className="flex flex-col items-center text-center p-6 rounded-xl border bg-card"
              >
                <tr.icon className="h-8 w-8 text-primary mb-3" />
                <div className="font-semibold text-sm">{tr.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{tr.sub}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button asChild variant="ghost" size="sm">
              <Link to="/documents">{t("homePage.trust.certification")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/registry">{t("homePage.trust.registry")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/privacy-policy">{t("homePage.trust.privacy")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/legal" className="inline-flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" />
                Нормативная база
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key features */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("homePage.features.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("homePage.features.subtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="border-border/50">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg">
              <Link to="/features">
                {t("homePage.features.all")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">{t("homePage.partners.title")}</h2>
            <p className="text-muted-foreground">{t("homePage.partners.subtitle")}</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16">
            <a
              href="https://info.youcanread.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all hover:scale-105"
            >
              <img
                src="/assets/partners/youcanread-logo.svg"
                alt={t("homePage.partners.youcanread")}
                className="h-10 md:h-12 w-auto opacity-70 group-hover:opacity-100 transition-opacity dark:invert"
              />
            </a>
            <a
              href="https://лабсс.рф"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all hover:scale-105"
            >
              <img
                src="/assets/partners/labss-logo.png"
                alt={t("homePage.partners.labss")}
                className="h-14 md:h-16 w-auto opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* Validation Protocol Info */}
      <section className="px-4">
        <div className="container mx-auto">
          <ProtocolValidationInfo />
        </div>
      </section>


      {/* Lead capture form */}
      <LeadCaptureForm />

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
            <CardContent className="p-10 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {t("homePage.finalCta.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                {t("homePage.finalCta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="text-base h-12 px-8">
                  <a href="#lead-form">
                    {t("homePage.ctaDemo")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-base h-12 px-8"
                >
                  <Link to="/pricing">{t("homePage.finalCta.pricing")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      </main>

      <LandingFooter />
      <StickyMobileCta />
    </div>
  );
}
