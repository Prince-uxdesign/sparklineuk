import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "/integrations" },
    { label: "Changelog", href: "/changelog" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground/50 pt-20 pb-8 px-6 border-t border-primary-foreground/10">
      <div className="content-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="font-heading text-lg font-bold text-primary-foreground mb-3 block">
              Sparkline
            </Link>
            <p className="text-sm leading-relaxed">
              Run your cleaning business like a Fortune 500 company.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs uppercase tracking-[0.1em] text-primary-foreground/30 font-medium mb-4">
                {category}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm hover:text-primary-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mb-6">
          <p className="text-xs text-primary-foreground/30">
            Sparkline is designed for cleaning businesses across England, Scotland, Wales, and Northern Ireland.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-primary-foreground/10 gap-4">
          <p className="text-xs">© 2025 Sparkline. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-xs hover:text-primary-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs hover:text-primary-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
