import PageShell from "@/components/PageShell";

const Terms = () => (
  <PageShell title="Terms of Service | Sparkline" description="Sparkline's terms of service. Read the terms governing use of our cleaning business management software.">
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-[720px] mx-auto">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: February 2025</p>

        <div className="prose-sm space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">1. Agreement</h2>
            <p>By accessing or using Sparkline ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service. These terms are governed by the laws of England and Wales.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
            <p>Sparkline provides a cloud-based software platform for managing cleaning businesses, including booking, scheduling, invoicing, client management, team management, and analytics.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">3. Accounts</h2>
            <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials and for all activity under your account.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">4. Subscription & Payment</h2>
            <p>Sparkline offers paid subscription plans billed monthly or annually in GBP (£). Prices are exclusive of VAT where applicable. You may cancel your subscription at any time; access continues until the end of the current billing period.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">5. Free Trial</h2>
            <p>We offer a 14-day free trial for all plans. No credit card is required. At the end of the trial, you must subscribe to continue using the Service.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">6. Data Ownership</h2>
            <p>You retain all rights to the data you enter into Sparkline. We do not claim ownership of your content. You may export or delete your data at any time.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">7. Account Deletion</h2>
            <p>You may request deletion of your account and all associated data at any time through Settings or by contacting support@sparkline.co.uk. We will process deletion requests within 30 days in accordance with our Privacy Policy and UK GDPR requirements.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, Sparkline shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">9. Changes to Terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">10. Contact</h2>
            <p>For questions about these terms, contact: legal@sparkline.co.uk</p>
          </section>
        </div>
      </div>
    </section>
  </PageShell>
);

export default Terms;
