import PageShell from "@/components/PageShell";

const Privacy = () => (
  <PageShell title="Privacy Policy | Sparkline" description="Sparkline's privacy policy. Learn how we collect, use, and protect your data in compliance with UK GDPR.">
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-[720px] mx-auto">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: February 2025</p>

        <div className="prose-sm space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">1. Who we are</h2>
            <p>Sparkline ("we", "us", "our") is a trading name operating from the United Kingdom. We provide cleaning business management software. Our registered address is available upon written request to privacy@sparkline.co.uk.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">2. Data we collect</h2>
            <p>We collect the following personal data: name, email address, phone number, business name, postal address, payment information (processed by our payment provider), and usage data (pages visited, features used, device information).</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">3. Lawful basis for processing</h2>
            <p>We process personal data under the following lawful bases as defined by the UK GDPR: (a) contract performance — to provide our services; (b) legitimate interests — to improve our product and communicate with you; (c) consent — for marketing communications.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">4. How we use your data</h2>
            <p>We use your data to: provide and maintain our service, process transactions, send transactional emails, improve our platform, and (with your consent) send marketing communications.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">5. Data retention</h2>
            <p>We retain your personal data for as long as your account is active. If you delete your account, we will erase all your personal data within 30 days, except where we are required by law to retain certain records (e.g., financial records for 6 years under HMRC requirements).</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">6. Your rights under UK GDPR</h2>
            <p>You have the right to: access your personal data, rectify inaccurate data, erase your data (right to be forgotten), restrict processing, data portability, object to processing, and withdraw consent at any time. To exercise any of these rights, contact us at privacy@sparkline.co.uk.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">7. Data sharing</h2>
            <p>We do not sell your personal data. We may share data with: hosting providers (cloud infrastructure), payment processors, email delivery services, and analytics tools — all of which are bound by data processing agreements.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">8. Cookies</h2>
            <p>We use essential cookies required for the platform to function. We use analytics cookies only with your consent. You can manage your cookie preferences at any time.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">9. Contact</h2>
            <p>For any privacy-related enquiries, please contact: privacy@sparkline.co.uk. You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.</p>
          </section>
        </div>
      </div>
    </section>
  </PageShell>
);

export default Privacy;
