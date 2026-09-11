import { accessRequestHref, navigation } from "@/content/landing";
import { Brand } from "@/components/ui/Brand";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="primary-navigation" aria-label="Primary navigation">
          {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <div className="header-actions">
          <GoogleSignInButton compact />
          <a className="button button-primary button-small" href={accessRequestHref}>Request access <span>→</span></a>
        </div>
      </div>
    </header>
  );
}
