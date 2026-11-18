import { LanguageToggle } from "@/components/ui/language-toggle";

/**
 * Fixed top-right language toggle for public pages
 * that don't render the PublicNavbar (NotFound, Install, ResetPassword, etc.)
 */
export function FloatingLanguageToggle() {
  // Translation switcher hidden: translation is not working reliably.
  return null;
  return (
    <div className="fixed top-4 right-4 z-50">
      <LanguageToggle />
    </div>
  );
}
