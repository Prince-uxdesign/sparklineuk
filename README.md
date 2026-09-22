# Sparkline Business OS

Build a SaaS web application called "Sparkline" — a modern business management platform for professional cleaning companies. The tagline is: "Run your cleaning business like a Fortune 500 company."

TECH STACK:

- React + TypeScript

- Tailwind CSS

- Framer Motion for all animations

- Shadcn/ui for components

- React Router for navigation

- Supabase for backend (auth + database)

- Lucide React for icons

---

DESIGN SYSTEM — THIS IS NON-NEGOTIABLE:

Color Palette:

- Background: #FAFAF9 (off-white, warm)

- Primary: #0A0A0A (near-black)

- Accent: #2563EB (electric blue — used sparingly, only for CTAs and key highlights)

- Surface: #FFFFFF

- Border: #E5E5E5

- Muted text: #737373

- Success: #16A34A

- Warning: #D97706

- Danger: #DC2626

NO GRADIENTS ANYWHERE. None. Every background must be a flat solid color.

Typography:

- Headings: "Geist" or "DM Sans" — large, bold, tight letter-spacing (-0.03em)

- Body: "Inter" at 15px, line-height 1.6

- Monospace (for numbers/stats): "JetBrains Mono"

- Import all fonts from Google Fonts

Spacing Philosophy:

- Generous white space everywhere

- Section padding: 120px top/bottom on desktop, 60px on mobile

- Max content width: 1200px, centered

- Cards: 32px internal padding, 16px border-radius, subtle 1px border (#E5E5E5), NO shadow by default — use border instead

Animation Rules (Framer Motion):

- All page sections fade up on scroll (y: 40 → 0, opacity: 0 → 1, duration: 0.6s, ease: easeOut)

- Stagger children by 0.1s delay

- Hover on cards: scale(1.01), border color shifts to #2563EB, transition 200ms

- Buttons: slight scale(0.97) on press

- NO bouncy or playful animations — everything should feel precise and controlled

- Page transitions: fade (opacity 0 → 1, 300ms)

---

BUILD THE LANDING PAGE with these exact sections:

1. NAVBAR

- Logo: "Sparkline" in bold DM Sans, black

- Nav links: Features, Pricing, About (right side)

- CTA button: "Start Free Trial" — solid black (#0A0A0A), white text, 14px, 44px height, 12px border-radius

- Navbar is sticky, starts transparent, becomes white with 1px bottom border (#E5E5E5) on scroll

- No hamburger menu on desktop. Clean horizontal layout.

2. HERO SECTION

- Eyebrow text: "Trusted by 2,000+ cleaning professionals" — small caps, #737373, with a subtle • divider and a green dot pulse animation indicating "live"

- H1 (large, 72px desktop): "The operating system for modern cleaning businesses."

- Subheading (20px, #737373): "Booking, scheduling, invoicing, and client management — unified in one beautifully simple platform."

- Two CTA buttons side by side:

  - Primary: "Start for free" — solid black

  - Secondary: "See how it works →" — text only, underline on hover

- Below CTAs: small social proof line — avatars of 5 fake users + "Join 2,000+ businesses already on Sparkline"

- Hero image: A clean browser mockup (use a placeholder div styled as a browser window with a white background and a simple dashboard UI sketch inside using Tailwind) — give it a very subtle shadow and slight tilt (rotate-1) 

- Full section height: 100vh, vertically centered content

3. LOGOS SECTION

- "Trusted by teams at" — centered, muted text

- Display 6 fake company names in a single horizontal row in light gray (#D4D4D4), large elegant typography. Names: "CleanCo", "BrightHomes", "PureSpace", "SwiftMaids", "NeatNest", "GlossGroup"

- Subtle horizontal scroll animation (marquee effect, slow, infinite loop)

4. FEATURES SECTION

- Section label: "FEATURES" in tiny uppercase, letter-spacing 0.15em, blue accent color

- H2: "Everything your business needs. Nothing it doesn't."

- 3-column grid of 6 feature cards:

  Card 1: "Smart Booking" — clients book 24/7 from a custom link

  Card 2: "Job Scheduling" — drag-and-drop calendar for your team

  Card 3: "Auto Invoicing" — send invoices automatically after job completion

  Card 4: "Client CRM" — full history, notes, preferences per client

  Card 5: "Team Management" — assign cleaners, track hours, manage roles

  Card 6: "Analytics Dashboard" — revenue, bookings, and growth at a glance

- Each card: white background, 1px border, icon (Lucide), title, 2-line description

- On hover: border turns blue (#2563EB), subtle scale up with Framer Motion

5. HOW IT WORKS SECTION

- H2: "Set up in 15 minutes. Run forever."

- 3 numbered steps in a horizontal row (large step numbers in very light gray behind text, almost watermark-like):

  Step 1: "Create your account" — takes 2 minutes

  Step 2: "Add your services & team" — customize everything

  Step 3: "Share your booking link" — clients book, you earn

- Clean, minimal, large numbers as background decorative elements

6. PRICING SECTION

- H2: "Simple, transparent pricing."

- 3 pricing cards: Starter ($49/mo), Growth ($99/mo), Pro ($199/mo)

- Middle card (Growth) is highlighted: solid black background, white text — this is the "recommended" plan

- Each card lists 5 features with checkmarks

- Starter: 1 team member, 50 bookings/mo, basic analytics, invoicing, email support

- Growth: 5 team members, unlimited bookings, advanced analytics, invoicing + auto-reminders, priority support

- Pro: unlimited team, unlimited bookings, custom reports, white-label client portal, dedicated account manager

- Toggle at top to switch between Monthly/Annual (annual = 2 months free)

7. TESTIMONIALS SECTION

- H2: "What cleaning businesses say about us."

- 3 testimonial cards in a row

- Each: star rating (5 stars), quote text, avatar placeholder circle, name and company

- Make testimonials sound real and specific, not generic

8. FINAL CTA SECTION

- Full-width, black background (#0A0A0A), white text

- H2: "Your competitors are already moving faster."

- Subtext: "Start your 14-day free trial. No credit card required."

- Single CTA button: "Get started free" — white background, black text

- Very generous padding (160px top/bottom)

9. FOOTER

- 4-column layout: Logo+tagline | Product | Company | Legal

- Bottom bar: "© 2025 Sparkline. All rights reserved." left | "Privacy · Terms" right

- Background: #0A0A0A, text: #737373, links white on hover

---

GLOBAL REQUIREMENTS:

- Fully responsive (mobile, tablet, desktop)

- All animations powered by Framer Motion

- No gradient anywhere in the entire codebase

- Pixel-perfect spacing

- The overall feel should be like visiting Linear.app or Stripe.com — cold, precise, premium, minimal

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
