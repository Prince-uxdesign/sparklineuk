import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";

const CookiePolicy = () => (
  <PageShell title="Cookie Policy | Sparkline" description="Learn how Sparkline uses cookies and how you can manage your preferences.">
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-[720px] mx-auto">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: February 2025</p>

        <div className="prose-sm space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">1. What are cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help websites function properly, remember your preferences, and provide analytics data.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">2. How we use cookies</h2>
            <p>Sparkline uses cookies for the following purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Essential cookies:</strong> Required for the platform to function. These handle authentication, session management, and security. You cannot opt out of these.</li>
              <li><strong className="text-foreground">Analytics cookies:</strong> Help us understand how users interact with Sparkline so we can improve the product. These are only set with your consent.</li>
              <li><strong className="text-foreground">Preference cookies:</strong> Remember your settings and choices (e.g., cookie consent preference).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">3. Third-party cookies</h2>
            <p>We may use third-party services (such as analytics providers) that set their own cookies. These are governed by the respective third party's privacy policy.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">4. Managing cookies</h2>
            <p>When you first visit Sparkline, you'll see a cookie consent banner where you can choose to accept all cookies or reject non-essential ones. You can also manage cookies through your browser settings at any time.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">5. Changes to this policy</h2>
            <p>We may update this cookie policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">6. Contact</h2>
            <p>If you have questions about our use of cookies, please contact us at{" "}
              <a href="mailto:privacy@sparkline.co.uk" className="text-foreground underline">privacy@sparkline.co.uk</a>.
            </p>
          </section>
        </div>
      </div>
    </section>
  </PageShell>
);

export default CookiePolicy;
