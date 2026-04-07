# Design System Specification: High-End Editorial CV

## 1. Overview & Creative North Star: "The Digital Luminary"
This design system moves away from the static, "flat" resume templates of the past decade. Our Creative North Star is **The Digital Luminary**—an experience that feels like a high-end, interactive physical installation. We are blending the precision of technical blueprints with the atmospheric depth of a luxury dark-mode interface.

To break the "template" look, we utilize **intentional asymmetry**. Hero sections should feature overlapping typography and floating glass modules that break the grid. We use high-contrast typography scales—pairing massive, confident displays with microscopic, precise labels—to create an editorial rhythm that feels curated and authoritative.

---

## 2. Colors & Atmospheric Depth
Our palette is rooted in a "Deep Space" black (`#0e0e13`), punctuated by hyper-saturated neon pulses. The goal is not "colorful," but "illuminated."

### The "No-Line" Rule
**Strict Mandate:** Traditional 1px solid borders are prohibited for sectioning. 
Structure is defined through **Tonal Transitions**. Use `surface-container-low` for large section backgrounds against a `surface` base. Let the change in value define the edge, creating a seamless, architectural feel rather than a boxed-in layout.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers:
*   **Base Layer:** `surface` (#0e0e13) for the primary canvas.
*   **Submerged Layer:** `surface-container-lowest` (#000000) for deep inset areas like code snippets or secondary sidebars.
*   **Elevated Modules:** Use `surface-container-high` (#1f1f26) for cards that need to "step forward."

### The "Glass & Gradient" Rule
Floating elements (modals, navigation bars, hover cards) must use **Glassmorphism**. 
*   **Fill:** `surface_variant` (#25252d) at 60% opacity.
*   **Effect:** `backdrop-filter: blur(20px)`.
*   **Signature Textures:** Apply a linear gradient (45deg) from `primary` (#8ff5ff) to `secondary` (#ac89ff) at 15% opacity as a background overlay to provide a "soulful" shimmer to glass containers.

---

## 3. Typography
We use a high-contrast pairing: **Space Grotesk** for technical, high-impact headings and **Inter/Manrope** for elite readability.

*   **Display (Space Grotesk):** Massive and unapologetic. Used for name and key section titles. Letter spacing should be slightly tight (-0.02em) to feel "engineered."
*   **Headline (Space Grotesk):** Used for project titles. Pair with `primary` color tokens to draw the eye.
*   **Body (Inter):** Maximum legibility. Use `on-surface-variant` (#acaab1) for secondary text to maintain the dark-mode atmosphere without losing contrast.
*   **Labels (Manrope):** All-caps, tracked out (+0.1em). These are the "metadata" of the CV—dates, tech stacks, and micro-categories.

---

## 4. Elevation & Depth
Depth in this system is achieved through light and layering, not structural lines.

### The Layering Principle
Stacking tiers creates natural lift. Place a `surface-container-highest` card on top of a `surface-container` section. The subtle shift in value communicates hierarchy more elegantly than a border ever could.

### Ambient Shadows
For "Floating" states (Active cards or Nav):
*   **Color:** Use `secondary` (#ac89ff) at 8% opacity. 
*   **Properties:** `box-shadow: 0 20px 40px rgba(172, 137, 255, 0.08)`. 
*   Avoid grey shadows; shadows must feel like "ambient light blockage" from the neon accents.

### The "Ghost Border" Fallback
If accessibility requires a container definition, use a **Ghost Border**:
*   `outline-variant` (#48474d) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons (The "Pulse" Interaction)
*   **Primary:** Gradient background (`primary` to `secondary`). No border. `xl` roundedness. On hover, increase the `primary_container` glow.
*   **Secondary:** Ghost style. `outline` token at 20% opacity. Text in `primary`.
*   **Tertiary:** Text-only in `secondary`, all-caps `label-md` styling.

### Cards & Project Tiles
*   **Rule:** Forbid divider lines. Use vertical white space (64px+) or a shift from `surface-container-low` to `surface-container-high` to separate projects.
*   **Interactive State:** On hover, a project card should "lift" using a `primary_dim` 1px ghost border and a 5% `backdrop-filter` increase.

### Chips (Skill Tags)
*   Background: `surface-container-highest`.
*   Text: `primary_fixed` at 0.75rem.
*   Shape: `full` pill.
*   No shadow. Use a 10% `primary` inner-glow (box-shadow inset) to make them look like "lit displays."

### Input Fields
*   Background: `surface_container_lowest`.
*   Active State: Bottom border only (2px) using the `tertiary` (#ff59e3) token to provide a high-tech "active line" feel.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Let a project image bleed off the right edge of the grid while text is pinned to the left.
*   **Use Neon Sparingly:** Use `primary` and `tertiary` for highlights (icons, active states) only. If everything glows, nothing is important.
*   **Respect the "Air":** Use generous margins. High-end design requires "breathing room" to feel premium.

### Don't:
*   **Don't Use Pure White:** Never use #FFFFFF. Use `on-surface` (#f9f5fd) to keep the "electric" vibe consistent.
*   **Don't Use 1px Dividers:** If you feel the need to draw a line, use a 32px gap of empty space instead.
*   **Don't Use Default Shadows:** Standard black shadows will "muddy" the dark mode. Always tint shadows with the `secondary` or `primary` hue.