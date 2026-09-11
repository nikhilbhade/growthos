import { navigation } from "@/content/landing";
import { Brand } from "@/components/ui/Brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Brand />
      <p>Growth intelligence for restaurants.</p>
      <nav aria-label="Footer navigation">
        {navigation.slice(0, 2).map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        <a href="/app.html">Log in</a>
      </nav>
    </footer>
  );
}
