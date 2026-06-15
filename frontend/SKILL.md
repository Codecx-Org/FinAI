# SKILL.md — BizSawa Landing Page
**Agent Role:** Senior creative technologist + design director at a boutique studio that has never shipped a templated page.

---

## 0. MANDATORY ORIENTATION — READ BEFORE TOUCHING ANY FILE

### What BizSawa Is
BizSawa is an **AI-powered financial and business management assistant** built for African small business owners and entrepreneurs. Core product capabilities (pulled from live product):

| Capability | What it does |
|---|---|
| **Sales Tracker** | Log every sale instantly; daily/weekly/monthly revenue at a glance |
| **Inventory Manager** | Real-time stock levels, low-stock alerts, best-seller auto-detection |
| **AI Business Coach** | Personalised advice from real sales data; ask in English or Swahili |
| **Social Media Generator** | AI writes captions + generates images for Instagram, WhatsApp, Facebook |
| **Business Insights** | Trends, peak hours, top customers, profit margins — no accountant needed |
| **Loan & SACCO Guide** | Real loan products from KCB, Equity, Co-op, SACCOs matched to business type |
| **M-Pesa Integration** | Automatic payment tracking linked to M-Pesa number |

**Target users:** Agrovet owners, duka/retail shop operators, restaurant & hotel owners, fundi/services businesses, fashion boutiques — primarily in Kenya and East Africa, mobile-first.

### The Anti-Pattern: What the Existing Site Looks Like (DO NOT REPLICATE)
The live site at `biz-sawa.vercel.app` commits every sin this skill forbids:
- Plain white background, no visual atmosphere
- Emoji-as-icons (📊 📦 🤖) instead of real icon system
- Static feature cards with zero interactivity
- Gradient text on a white page — the most overused SaaS cliché of 2023
- A hero that opens with a tagline and a subtitle and two buttons — the template layout
- No scroll-triggered animation whatsoever
- Ticker/marquee scrolling feature list — the laziest "social proof" pattern
- Generic testimonials section at the bottom with star ratings
- Looks like it was scaffolded from a Tailwind UI starter in 40 minutes

**Your job is to make someone say "what is this?" in the best possible way** — not recognise the pattern within 0.5 seconds of loading.

---

## 1. TOOLCHAIN — ROLES AND CONSTRAINTS

Each tool has a specific, non-overlapping responsibility. Do not mix them up.

### 1.1 Framer Motion
**Role:** All scroll-based animation and transition orchestration.

**Mandatory uses:**
- `useScroll` + `useTransform` for parallax depth on the hero background layer
- `whileInView` with `viewport={{ once: true, margin: "-80px" }}` for all feature card reveals
- `motion.div` wrappers with `initial`, `animate`, `exit` on every page section
- `AnimatePresence` for any component that conditionally mounts/unmounts
- `useMotionValue` + `useSpring` for cursor-tracking magnetic effects on the hero CTA
- Staggered children using `staggerChildren` in `variants` — never animate siblings with manual `delay` props

**Constraints:**
- Never use CSS `transition` or `animation` for anything Framer Motion can handle
- All spring configs: `{ stiffness: 120, damping: 20, mass: 1 }` — no bounce, no over-shoot on UI elements; save higher stiffness for cursor effects only
- Respect `prefers-reduced-motion`: wrap all non-essential animations in a `useReducedMotion()` check and provide a static fallback

**DO NOT use Framer Motion for:**
- 3D transforms (delegate to Taste skill / Three.js)
- Icon hover states (use CSS)
- Loading spinners

### 1.2 UI UX Pro Max
**Role:** Design system foundation — spacing, typography scale, component anatomy, colour tokens.

**Apply these principles:**
- **Spatial system:** 4px base unit. All spacing values must be multiples of 4 (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).
- **Type scale:** Use a modular scale with ratio 1.25 — implement as CSS custom properties:
  ```css
  --text-xs:   0.64rem;
  --text-sm:   0.8rem;
  --text-base: 1rem;
  --text-lg:   1.25rem;
  --text-xl:   1.563rem;
  --text-2xl:  1.953rem;
  --text-3xl:  2.441rem;
  --text-4xl:  3.052rem;
  --text-5xl:  3.815rem;
  --text-6xl:  4.768rem;
  ```
- **Touch targets:** All interactive elements minimum 44×44px on mobile
- **Contrast:** All body text meets WCAG AA (4.5:1). Hero large text meets AA (3:1 minimum)
- **Component anatomy:** Every component must have: container, content area, optional leading element, optional trailing element, optional label. No ad-hoc DOM trees.

### 1.3 21st.dev
**Role:** Component patterns and reusability architecture.

**Apply these patterns:**
- **Compound components** for the pricing section: `<Pricing>`, `<Pricing.Card>`, `<Pricing.Feature>`, `<Pricing.CTA>`
- **Render props or slots** for any component that needs layout flexibility (feature grid, testimonial carousel)
- **Headless logic hooks** for any stateful UI: `useActiveFeature()`, `useMobileNav()`, `useScrollProgress()`
- **Composition over configuration:** avoid `variant="large"` prop sprawl; instead compose smaller primitives
- All components export their own TypeScript interface — no `any` types
- Shared state via React Context, not prop drilling beyond 2 levels

**Reusability targets:**
- `<FeatureCard />` — accepts icon, title, description, delay; handles its own whileInView animation
- `<GlassPanel />` — base surface component used by feature cards, testimonials, pricing cards
- `<MagneticButton />` — cursor-tracking CTA used in hero and final CTA section
- `<ScrollReveal />` — wrapper that applies staggered fade+slide to any children

### 1.4 Emil Kowalski Design Principles
**Role:** Micro-interaction quality, motion taste, and the "feel" of every hover, press, and transition.

**Mandatory micro-interactions (Emil-grade quality):**
- **Button press:** `scale(0.97)` on `mousedown`, spring back on `mouseup` — feels physical, not digital
- **Hover lift:** Cards lift `translateY(-4px)` with a simultaneous subtle border brightening — single motion, never two separate effects
- **Focus rings:** Custom `box-shadow: 0 0 0 3px rgba(amber, 0.4)` — never the browser default outline
- **Link underlines:** Animated underline that draws from left on hover using `scaleX` transform on a `::after` pseudo-element — not `text-decoration`
- **Number counters:** Animate numbers in the stats section using a custom count-up with easing (not linear)
- **Input fields:** Label floats up on focus (not placeholder text) — placeholder is a hint, label is a label
- **The 100ms rule:** No interactive element should feel like it has more than 100ms before visual feedback begins

**Texture rules (Emil aesthetic):**
- Surfaces have depth: use layered `box-shadow` (ambient + key) not a single flat shadow
- Border: `1px solid rgba(255,255,255,0.08)` on dark surfaces — barely visible, just enough
- Inner glow on active elements: `inset 0 1px 0 rgba(255,255,255,0.1)` 
- Text rendering: `text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased`

### 1.5 Impeccable (Output Verification)
**Role:** Anti-slop quality gate. After generating each section, the agent MUST run this checklist before moving on.

**Impeccable Section Checklist — fail = rewrite that section:**

```
[ ] ORIGINALITY: Does this section look like any Tailwind/shadcn/Vercel template? → FAIL if yes
[ ] SPECIFICITY: Does the copy mention BizSawa by name and reference real product features? → FAIL if generic
[ ] ANIMATION: Is there at least one non-trivial, purposeful animation per section? → FAIL if static
[ ] TYPOGRAPHY: Are more than 2 font weights used in the same block? → FAIL (max 2 weights per block)
[ ] COLOUR: Are more than 4 colours used simultaneously? → FAIL (the palette has rules, see §2)
[ ] CONTRAST: Does every text element pass WCAG AA minimum? → FAIL if not
[ ] MOBILE: Does this section work on a 375px viewport without horizontal scroll? → FAIL if not
[ ] EMOJI: Are any emoji used as UI icons? → FAIL immediately, always
[ ] GRADIENTS: Is a gradient used on text as a stylistic trick? → FAIL (gradients are for backgrounds and specific accent moments only)
[ ] SLOP PHRASES: Does the copy use "unlock", "seamlessly", "revolutionise", "game-changer", "cutting-edge", "supercharge"? → FAIL
[ ] STOCK PATTERNS: Ticker/marquee feature lists, star ratings at the top of testimonials, "Join X+ users" as the only social proof? → FAIL
```

**Global AI Slop Red List — if any of these appear, delete and rewrite:**
- Hero with a phone mockup floating on the right side
- Three-column "Why us" icons with title + two sentences each, no animation
- FAQ accordion at the bottom
- "Built for [audience]" as the hero headline
- Blue + purple gradient background
- Lottie animation of a robot or graph

### 1.6 Taste Skill (3D Animations)
**Role:** Three.js / R3F scene in the hero. This is the signature element of the page.

**The Hero 3D Scene — specification:**

Build a Three.js (or React Three Fiber) scene that renders **a slowly rotating abstract mesh representing financial data flow** — NOT a globe, NOT a coin, NOT a chart. Think: an organic form that morphs between states. Suggested approach:

Option A — **Morphing Icosphere:** A low-poly icosphere (detail level 2–3) whose vertices are displaced by a sin/cos wave seeded from Perlin noise. The mesh rotates slowly on Y axis (0.003 rad/frame). On scroll, the displacement amplitude increases — the form becomes more "turbulent" as you scroll down, then calms. Material: `MeshStandardMaterial` with `roughness: 0.2`, `metalness: 0.8`, colour matching brand palette.

Option B — **Particle field:** ~2000 particles arranged in a torus knot path. Particles drift with a slow sine oscillation on each axis. On scroll, the torus knot tightens (radius decreases) as if coalescing into order — representing chaos → organised financial clarity. Use `PointsMaterial` with a custom disc texture, additive blending.

Option C — **Flowing ribbon mesh:** A parametric ribbon that traces a 3D Lissajous curve, rendered as a thin `TubeGeometry`. The ribbon "writes itself" on load using a custom draw range animation. Colour: shifts from the brand amber to white along the length. On scroll, the Lissajous parameters shift, reshaping the path.

**Choose the option that best fits the palette and implement fully.** Do not use a placeholder. Do not use a `<img>` or Lottie here.

**3D Scene constraints:**
- Render in a `<canvas>` at the hero section — 60fps target on a mid-range laptop
- Pixel ratio cap: `Math.min(window.devicePixelRatio, 2)` — do not set to `window.devicePixelRatio` uncapped
- Lighting: one `PointLight` (amber, intensity 2, position [2,3,2]) + one `AmbientLight` (white, intensity 0.3)
- The scene background is transparent — the page background shows through
- On mobile (`width < 768px`): reduce particle count by 60%, or simplify mesh detail — performance > fidelity
- `useFrame` delta-corrected: `mesh.rotation.y += 0.003 * delta * 60` — not frame-rate dependent

---

## 2. VISUAL DESIGN SYSTEM

### 2.1 Colour Palette (Non-Negotiable)

```css
:root {
  /* Backgrounds — layered depth */
  --bg-void:        #080610;   /* page base — near black with blue-violet undertone */
  --bg-deep:        #0E0C1C;   /* primary surfaces */
  --bg-elevated:    #161428;   /* cards, panels */
  --bg-glass:       rgba(22, 20, 40, 0.6); /* glass morphism panels */

  /* Brand */
  --brand-amber:    #F59E0B;   /* primary accent — Kenyan sunrise */
  --brand-amber-dim: rgba(245, 158, 11, 0.15); /* ambient glow */
  --brand-amber-glow: rgba(245, 158, 11, 0.3); /* hover state */
  --brand-green:    #10B981;   /* success states, growth indicators */

  /* Text */
  --text-primary:   #F8F8F8;
  --text-secondary: rgba(248, 248, 248, 0.6);
  --text-muted:     rgba(248, 248, 248, 0.35);
  --text-amber:     #FCD34D;   /* display text accent only */

  /* Borders */
  --border-subtle:  rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-amber:   rgba(245, 158, 11, 0.3);

  /* Semantic */
  --success:  #10B981;
  --warning:  #F59E0B;
  --error:    #EF4444;
}
```

**Colour usage rules:**
- `--brand-amber` appears on: CTA buttons, active states, the 3D mesh, number highlights in stats, the logo mark
- Never use amber on body text — only on display size headings (≥ 2xl) and UI controls
- The page has **no white backgrounds anywhere** — the darkest surface is `--bg-void`
- Glass panels: `background: var(--bg-glass); backdrop-filter: blur(12px) saturate(1.4);`
- The only bright moment is the hero — ambient amber glow behind the 3D scene. All other sections are controlled.

### 2.2 Typography

**Font stack:**
```
Display:  'Cabinet Grotesk' (variable, weights 500–800) — from Fontshare, free
Body:     'Satoshi' (variable, weights 400–700) — from Fontshare, free  
Mono:     'JetBrains Mono' (for data/code/numbers in feature cards)
```

**If Fontshare fonts fail to load** (network), fallback: `system-ui, -apple-system, sans-serif`.

**Typography rules:**
- Hero headline: Cabinet Grotesk, weight 800, `letter-spacing: -0.04em`, `line-height: 0.95`
- Section headlines: Cabinet Grotesk, weight 700, `letter-spacing: -0.025em`
- Body copy: Satoshi, weight 400, `line-height: 1.7`
- Metric numbers (stats, dashboard preview): JetBrains Mono, amber colour
- **Never** use font-weight 900 — it looks crude; 800 is the ceiling
- Sentence case only. No ALL CAPS headings except labels (navigation, section eyebrows).
- Section eyebrows: Satoshi, weight 600, `letter-spacing: 0.12em`, `text-transform: uppercase`, `font-size: var(--text-xs)`, `color: var(--brand-amber)`

### 2.3 The Signature Element
The page's single most memorable moment: **the hero section contains an animated mesh (from Taste Skill §1.6) whose ambient amber glow bleeds into the page background** — the further you are from the hero, the darker the page becomes. Achieve this with a radial gradient behind the `<canvas>`:

```css
.hero-ambient {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 60% 50% at 65% 40%,
    rgba(245, 158, 11, 0.12) 0%,
    transparent 70%
  );
  pointer-events: none;
}
```

This creates the impression that the 3D object is a real light source. Every other section is dark with no ambient glow — the contrast makes the hero feel alive.

---

## 3. PAGE ARCHITECTURE — SECTION BY SECTION

### Section 0: Navigation
**Height:** 64px. `position: sticky; top: 0; z-index: 100`  
**Background:** `rgba(8, 6, 16, 0.8); backdrop-filter: blur(20px)`  
**Border-bottom:** `1px solid var(--border-subtle)` — appears only after scrolling 100px (add/remove class with `useScroll`)

**Left:** Logo — "Biz**Sawa**" — "Sawa" in amber, "Biz" in white. No icon. The wordmark IS the brand.  
**Centre:** Navigation links — Features, How it Works, Pricing, For Who  
**Right:** `<MagneticButton>` "Get Started Free" — amber background, dark text  

**Mobile nav:** Full-screen overlay, enters with `AnimatePresence` slide-from-right, blurred background. Close button top-right. Links animate in with stagger.

---

### Section 1: Hero
**This section determines whether someone stays. Treat it accordingly.**

**Layout:** Full viewport height (`100svh`). Two columns on desktop (60/40 split), single column on mobile.

**Left column (60%):**
```
[EYEBROW] → "AI-Powered Business Intelligence"
[HEADLINE] → Two lines max. Suggested: 
             "Your business,
              finally understood."
             OR: 
             "The AI that runs
              your numbers."
[SUBHEAD]  → 1–2 sentences. Concrete. Specific. Reference real features.
             Example: "BizSawa tracks every shilling, coaches your strategy, 
             and writes your Instagram posts — all from your phone."
[CTA ROW]  → Primary: MagneticButton "Start Free Today"
             Secondary: text link "Watch how it works →" with animated underline
[SOCIAL PROOF] → Not a star rating. Instead: 
             "Used by 12,000+ entrepreneurs across Kenya" 
             in --text-muted size, with a row of 5 small avatar circles (not stock photos — 
             generate CSS-based illustrated avatars using SVG)
```

**Right column (40%):**
The Three.js scene canvas. Positioned absolutely within a container that clips overflow. The mesh floats with a subtle `useScroll`-driven parallax (moves up 30px as user scrolls down 200px).

**Scroll indicator:** At the bottom of the hero, a vertical line with a dot that slides down, labeled "Scroll" in --text-muted. Fades out after 300px of scroll using `useScroll` + `useTransform` opacity.

**Hero entrance animation sequence (Framer Motion):**
```
t=0ms:    Canvas scene begins rendering
t=200ms:  Eyebrow fades in, slides up 12px
t=400ms:  Headline word-by-word reveal (split text, each word slides up with stagger 60ms)
t=700ms:  Subhead fades in
t=900ms:  CTA row slides up
t=1100ms: Social proof fades in
```
Implement with `motion.div` variants and `staggerChildren`. Each element should already be in its final state when `prefers-reduced-motion` is active.

---

### Section 2: Live Dashboard Preview
**Not a static screenshot. Not a phone mockup tilted at 15°.**

Build a **live, interactive mini-dashboard** using real React components styled to look like the BizSawa app UI. This section shows what the product actually does.

**Layout:** Full-width section with dark background (`--bg-deep`). The dashboard component is a `GlassPanel` with rounded corners (16px) and a subtle amber border glow.

**Dashboard shows (animated on scroll into view):**
1. **Greeting row:** "Good morning, Grace 👋" — use an actual SVG wave hand, not emoji
2. **Four KPI cards** (counter-up animation on scroll):
   - Today's Sales: **Ksh 14,850** (green trend arrow +12%)
   - Total Revenue: **Ksh 92,400**
   - Inventory Alerts: **3 items** (amber badge)
   - AI Coach Insights: **2 new** (pulsing dot)
3. **Mini sparkline chart** (SVG path, draws itself on scroll using `stroke-dashoffset` animation)
4. **AI Coach message bubble:** Typewriter text reveal — "Your Chick Mash sales are up 24% this week. Consider restocking before Thursday."

**Scroll-trigger:** Section enters with `useInView`. KPI numbers count up from 0. Chart path draws. AI message types out. Total reveal time: 2 seconds.

---

### Section 3: Feature Cards
**This is the section most likely to look like AI slop. Fight it.**

**Layout:** NOT a 3-column grid of equal cards. Instead: an **alternating bento-style layout**:

```
Row 1: [Large card 60%] [Small card 40%]
Row 2: [Small card 33%] [Small card 33%] [Small card 33%]
Row 3: [Large card 40%] [Large card 60%]
```

**Scroll animation (Framer Motion — the key creative moment):**
Cards do NOT all fade in at once. Use a **perspective-flip reveal:**
- Each card starts: `rotateX(8deg), translateY(40px), opacity(0)`  
- On scroll into view: springs to `rotateX(0), translateY(0), opacity(1)`  
- Stagger: 120ms between cards  
- The parent container has `perspective: 1200px` to make the rotateX visible

**Feature Card content (use real product capabilities):**

| Card | Size | Icon | Title | Copy | Visual |
|---|---|---|---|---|---|
| AI Business Coach | Large | Custom SVG brain/circuit hybrid | "Your AI that knows your numbers" | "Ask anything in English or Swahili. Get advice based on your actual sales — not generic tips." | Animated chat bubble expanding |
| Sales Tracker | Small | Trending line SVG | "Every sale, tracked." | "Log from your phone. See the picture immediately." | Mini sparkline |
| Inventory Manager | Small | Box/stack SVG | "Know before you run out." | "Real-time alerts before stock hits zero." | Progress bar filling |
| M-Pesa Integration | Small | M-Pesa green accent | "Payments, automatic." | "Link your M-Pesa. Every transaction tracked without lifting a finger." | Transaction list items appearing |
| Social Media Generator | Large | Stars/wand SVG | "Professional posts in 30 seconds" | "AI writes the caption. AI generates the image. You just tap share." | Before/after toggle |
| Loan & SACCO Guide | Large | Document SVG | "Know what you can borrow." | "Real products from KCB, Equity, Co-op and SACCOs — matched to your sales data." | Loan cards sliding in |

**Card anatomy (Emil rules apply):**
- `background: var(--bg-elevated)` with `border: 1px solid var(--border-subtle)`
- On hover: `border-color` transitions to `var(--border-amber)`, `translateY(-4px)`, inner glow appears
- Icon container: 48×48px, `background: var(--brand-amber-dim)`, `border-radius: 12px`
- Icons: Lucide React or custom SVG — never emoji

---

### Section 4: How It Works
**Three steps. But make it feel like a journey, not a listicle.**

**Layout:** Horizontal scrolling timeline on desktop, vertical stack on mobile.

**Visual:** A continuous amber line connects the three steps. Framer Motion `pathLength` animates the line from 0 to 1 as the section scrolls into view.

**Steps:**
1. **Create your account** — "Sign up with your email. Tell us about your business. Done in 90 seconds."
2. **Add your products** — "Enter what you sell. Link your M-Pesa number. The AI starts learning immediately."
3. **Watch your business grow** — "Log sales. Get coached. Post to Instagram. Borrow confidently."

Each step number animates from 0 to the step number (count-up). Step text fades in after the line reaches it.

---

### Section 5: Who It's For (Target Audience)
**The existing site does this with emoji cards. Do not.**

**Layout:** A horizontal scrollable row of "persona cards" on mobile, 3-col grid on desktop.

**Persona cards:** Each is a `GlassPanel` with:
- A top illustration: a minimal 3–5 colour SVG scene (not clipart, not emoji) representing the business type
- Business type label (amber, uppercase, small)
- A first-person quote snippet: "I track every bag of feed I sell."

**Personas (from product research):**
- Agrovet & Farmers
- Retail Shop / Duka
- Restaurant / Hotel
- Services / Fundi
- Fashion Boutique

**Animation:** On scroll, cards enter in a cascade from left to right, each with a 100ms stagger.

---

### Section 6: Testimonials
**Three testimonials. Anti-patterns to avoid: star ratings at the top, grey card on white, "Join X+ users" as social proof alone.**

**Layout:** Masonry or staggered offset — cards NOT aligned to a baseline.

**Card design:** `GlassPanel` with a large amber opening quotation mark (typographic, not icon), the quote, then name + role + business type + location.

**No star ratings.** Instead: a small amber badge reading "Verified BizSawa user".

**Scroll animation:** Cards slide in from alternating directions (left card from left, right card from right, middle from below).

**Real testimonials to use:**
- Grace Wanjiku, Agrovet Owner, Nairobi: "Since I started using BizSawa, I can see exactly which products make me money. I stopped selling things at a loss without even knowing it."
- Joseph Mutua, Hardware Shop, Mombasa: "The AI Coach told me exactly how much I could borrow based on my actual sales. I walked into the bank confident for the first time."
- Amina Farah, Fashion Boutique, Kisumu: "I used to spend hours on Instagram posts. Now BizSawa makes them for me in 30 seconds and my page looks more professional than ever."

---

### Section 7: Pricing
**Free tier + paid tier. If the product's pricing is unclear, use reasonable defaults.**

**Layout:** Two cards, centred, side by side on desktop. The paid card has the amber border glow (2px solid `var(--border-amber)`) and a "Most popular" chip above it.

**Pricing cards must use compound component pattern (21st.dev §1.3):**
```tsx
<Pricing>
  <Pricing.Card tier="Starter" price="Free" period="forever">
    <Pricing.Feature>Up to 50 sales/month</Pricing.Feature>
    <Pricing.Feature>Basic inventory tracking</Pricing.Feature>
    <Pricing.Feature>AI Coach (5 questions/day)</Pricing.Feature>
    <Pricing.CTA>Get started free</Pricing.CTA>
  </Pricing.Card>
  <Pricing.Card tier="Growth" price="KES 999" period="/month" featured>
    <Pricing.Feature>Unlimited sales tracking</Pricing.Feature>
    <Pricing.Feature>Full inventory manager</Pricing.Feature>
    <Pricing.Feature>Unlimited AI Coach</Pricing.Feature>
    <Pricing.Feature>Social media generator</Pricing.Feature>
    <Pricing.Feature>Loan matching</Pricing.Feature>
    <Pricing.Feature>M-Pesa auto-sync</Pricing.Feature>
    <Pricing.CTA>Start 14-day free trial</Pricing.CTA>
  </Pricing.Card>
</Pricing>
```

**Animation:** Cards enter with the perspective-flip from Section 3 (reuse `<ScrollReveal />` component).

---

### Section 8: Final CTA
**One job: convert. Do not add any new information here.**

**Layout:** Full-width section with an intensified version of the hero ambient glow — as if the 3D object has been brought back. Consider: a second subtle Three.js render (can be a very simple version — just a single glowing sphere or the mesh blurred heavily) OR a CSS radial gradient that pulses slowly using a CSS keyframe animation.

**Content:**
```
[HEADLINE]  "Your business has been managing itself.
             Now let's manage it better."
[SUBHEAD]   "Start free. No credit card. Works on any phone."
[CTA]       <MagneticButton> "Create your free account →"
[SECONDARY] "Already have an account? Sign in"
```

**The `<MagneticButton>` at full power here:** Cursor tracking with `useMotionValue`, button tilts toward cursor with `rotateX`/`rotateY` (max ±8deg). On hover, a shimmer sweep crosses the button surface (CSS `::after` with `background: linear-gradient`, animated with `scaleX`).

---

### Section 9: Footer
**Minimal. Not an SEO dumping ground.**

**Three columns:**
1. Logo + one-line description: "AI-powered business management for African entrepreneurs."
2. Links: Features, Pricing, Blog, Careers, GitHub
3. Legal: Privacy, Terms. + "© 2026 BizSawa"

Social links: GitHub only (from existing site). Keep it honest — don't add Twitter/Instagram links that don't exist.

**No newsletter signup** unless the product genuinely has one.

---

## 4. COMPONENT LIBRARY — IMPLEMENTATION GUIDE

### `<GlassPanel />`
```tsx
interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;        // adds amber border glow
  padding?: 'sm' | 'md' | 'lg';
}
```
Styles:
```css
background: rgba(22, 20, 40, 0.6);
backdrop-filter: blur(12px) saturate(1.4);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
```
With `glow`:
```css
border-color: rgba(245, 158, 11, 0.3);
box-shadow: 0 0 32px rgba(245, 158, 11, 0.08), inset 0 1px 0 rgba(255,255,255,0.08);
```

### `<MagneticButton />`
```tsx
interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant: 'primary' | 'ghost';
  size?: 'md' | 'lg';
}
```
Logic:
- Track `mousemove` relative to button centre using `useMotionValue`
- Apply `useSpring` with `{ stiffness: 300, damping: 20 }` to x and y
- Button translates up to 6px toward cursor
- On `mouseleave`, springs back to 0,0

### `<ScrollReveal />`
```tsx
interface ScrollRevealProps {
  children: React.ReactNode;
  staggerDelay?: number;    // default: 0.1s
  direction?: 'up' | 'left' | 'right';
  perspective?: boolean;    // enables the rotateX flip effect
}
```
Internally uses `useInView` + `motion.div` with variants.

### `<FeatureCard />`
```tsx
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  size: 'small' | 'large';
  visual?: React.ReactNode;   // optional animated visual in card
  delay?: number;
}
```

---

## 5. PERFORMANCE BUDGET

| Metric | Target |
|---|---|
| LCP | < 2.5s on 4G mobile |
| TBT | < 300ms |
| CLS | < 0.1 |
| Bundle size (JS, gzipped) | < 180KB excluding Three.js |
| Three.js chunk | < 150KB gzipped (lazy-loaded, `React.lazy`) |
| Web fonts | ≤ 2 font families, variable where possible, `font-display: swap` |
| Images | `<Image>` from Next.js or `loading="lazy"` + WebP, no unoptimised PNGs |

**Three.js lazy loading is mandatory.** Use:
```tsx
const HeroScene = React.lazy(() => import('./components/HeroScene'));

// In hero:
<Suspense fallback={<div className="hero-scene-placeholder" />}>
  <HeroScene />
</Suspense>
```

---

## 6. ACCESSIBILITY REQUIREMENTS

- All animated elements respect `prefers-reduced-motion`:
  ```tsx
  const prefersReducedMotion = useReducedMotion(); // Framer Motion hook
  const variants = prefersReducedMotion ? staticVariants : animatedVariants;
  ```
- All Framer Motion `whileInView` animations must have a `once: true` to prevent re-triggering
- `<canvas>` element must have `aria-label="Abstract 3D visualization representing financial data"` and `role="img"`
- All interactive elements keyboard navigable; focus visible
- No colour as the only differentiator between states
- `lang="en"` on `<html>`; include `lang="sw"` on any Swahili text strings
- The dashboard section's animated numbers use `aria-live="polite"` so screen readers announce the final value

---

## 7. FILE STRUCTURE

```
src/
├── app/
│   ├── layout.tsx          # fonts, metadata, global CSS
│   ├── page.tsx            # section assembly
│   └── globals.css         # CSS custom properties (§2.1)
│
├── components/
│   ├── navigation/
│   │   ├── Nav.tsx
│   │   └── MobileNav.tsx
│   ├── hero/
│   │   ├── Hero.tsx
│   │   ├── HeroScene.tsx   # Three.js (lazy loaded)
│   │   └── HeroText.tsx    # staggered word reveal
│   ├── dashboard/
│   │   └── DashboardPreview.tsx
│   ├── features/
│   │   ├── FeatureGrid.tsx
│   │   └── FeatureCard.tsx
│   ├── testimonials/
│   │   └── Testimonials.tsx
│   ├── pricing/
│   │   └── Pricing.tsx     # compound component
│   ├── cta/
│   │   └── FinalCTA.tsx
│   ├── ui/                 # primitives (21st.dev patterns)
│   │   ├── GlassPanel.tsx
│   │   ├── MagneticButton.tsx
│   │   ├── ScrollReveal.tsx
│   │   └── CountUp.tsx
│   └── footer/
│       └── Footer.tsx
│
├── hooks/
│   ├── useScrollProgress.ts
│   ├── useActiveSection.ts
│   └── useMagneticEffect.ts
│
├── lib/
│   └── three-utils.ts      # shared Three.js helpers
│
└── styles/
    └── tokens.css          # design tokens (consumed by globals.css)
```

---

## 8. COPY GUIDELINES

**Voice:** Direct. Specific. Earned confidence. The person reading this is busy, has seen many apps, and needs to understand within 5 seconds why this one is different.

**Things to never write:**
- "Unlock your business potential"
- "Seamlessly manage your operations"
- "The all-in-one platform"
- "Revolutionise the way you work"
- "We're on a mission to..."
- "Powerful yet simple"

**Things to write instead:**
- Name the specific outcome: "Know which products are losing you money"
- Use concrete numbers when available: "30 seconds to generate an Instagram post"
- Use active verbs: "Track. Coach. Post. Borrow."
- Reference the user's real world: "From the counter. From the market. From anywhere."
- Respect their intelligence — never over-explain

**Swahili integration:** The phrase "sawa" (okay/right/exactly) should appear naturally at least once in the hero — not forced, but earned. The product name itself means "okay/in order" — the copy should pay that off.

---

## 9. PRE-DELIVERY FINAL CHECKLIST

Before marking the task complete, verify every item:

```
DESIGN
[ ] Zero emoji used as icons anywhere in the UI
[ ] No gradient text (gradient backgrounds only)
[ ] All text passes WCAG AA contrast against its background
[ ] Dark colour scheme consistent across all sections
[ ] GlassPanel component used consistently for all card surfaces
[ ] Brand amber appears only as specified in §2.1 colour rules

ANIMATION
[ ] Hero entrance sequence plays correctly (§3 Section 1)
[ ] 3D scene renders and animates (60fps on desktop, simplified on mobile)
[ ] Feature card perspective-flip works on scroll
[ ] Dashboard KPI counter-up fires on scroll into view
[ ] Sparkline path draws on scroll into view
[ ] Typewriter effect on AI Coach message
[ ] MagneticButton cursor tracking works on both hero and CTA
[ ] All animations have prefers-reduced-motion fallback

COMPONENTS
[ ] GlassPanel, MagneticButton, ScrollReveal, FeatureCard, CountUp implemented as reusable components
[ ] Pricing uses compound component pattern
[ ] TypeScript interfaces defined for all component props, no `any` types

PERFORMANCE
[ ] Three.js is lazy-loaded with React.lazy + Suspense
[ ] All images are WebP + lazy loaded
[ ] Font files use font-display: swap
[ ] No unoptimised dependencies imported (check bundle with next build)

CONTENT
[ ] All six BizSawa features represented in the feature grid
[ ] Three real testimonials used (Grace, Joseph, Amina)
[ ] Pricing reflects real KES amounts
[ ] Social proof is specific (number of users, processing volume)
[ ] No slop phrases in any copy (re-run Impeccable checklist §1.5)

ACCESSIBILITY
[ ] canvas has aria-label and role="img"
[ ] All interactive elements keyboard accessible
[ ] Focus rings visible and styled
[ ] animated numbers use aria-live="polite"
[ ] lang attribute on html element

MOBILE
[ ] Nav collapses to hamburger at 768px
[ ] Hero is single column below 768px
[ ] Feature grid reflows to single column on mobile
[ ] 3D scene performance-optimised on mobile
[ ] Touch targets ≥ 44px on all interactive elements
[ ] No horizontal overflow at 375px viewport width
```

---

## 10. KNOWN FAILURE MODES — WATCH FOR THESE

1. **The Lazy Hero:** Generating a headline + subtitle + two buttons + a phone mockup = immediate failure. The hero must have the 3D scene.

2. **Fake Glass:** Using `opacity: 0.9` on a dark card is not glassmorphism. Real glass requires `backdrop-filter: blur()` and a semi-transparent background that actually lets the layer below show through.

3. **Framer Motion Overload:** Applying `whileHover` and `whileTap` to every single element kills performance and feels twitchy. Reserve micro-interactions for: buttons, cards, and navigation links only.

4. **The Scroll Jank:** Not setting `will-change: transform` on scroll-animated elements, or animating `top`/`left` instead of `transform`. Always animate `transform` and `opacity`.

5. **Missing the Three.js Performance Trap:** Setting `pixelRatio` to `window.devicePixelRatio` uncapped on a Retina screen = 4x the GPU work. Always cap at 2.

6. **Generic Section Eyebrows:** Writing "Features" or "Why BizSawa?" as the section eyebrow instead of something specific like "What's inside" or "Built for your counter".

7. **Social Proof Without Specifics:** "Trusted by businesses across Africa" is meaningless. "Used by 12,000+ entrepreneurs across Kenya, Uganda, and Tanzania" is something a person can assess.

8. **The Footer Graveyard:** Do not add 30 footer links that don't exist. Keep it honest.

---

*SKILL.md version 1.0 — BizSawa landing page agent brief*  
*This document is the authoritative specification. When in doubt, ask: "Would someone who cares deeply about design and craft be proud of this output?"*
