# Knive Design Tokens Reference

This document outlines the design tokens used across the Knive web applications for consistency and brand identity.

## Colors (OKLCH Space)

| Token Name    | Light Mode Value         | Dark Mode Value        | Brand Purpose                                        |
| :------------ | :----------------------- | :--------------------- | :--------------------------------------------------- |
| `primary`     | `oklch(0.24 0.06 240)`   | `oklch(0.38 0.08 240)` | Trust Navy: Brand primary, main buttons, headers     |
| `accent`      | `oklch(0.79 0.17 76)`    | `oklch(0.79 0.17 76)`  | Safety Amber: Emergency flags, badges, highlights    |
| `background`  | `oklch(0.985 0.005 240)` | `oklch(0.12 0.02 240)` | Soft Canvas Off-White / Deep Midnight Navy           |
| `card`        | `oklch(1 0 0)`           | `oklch(0.16 0.03 240)` | Card/panel backgrounds                               |
| `destructive` | `oklch(0.58 0.21 25)`    | `oklch(0.58 0.21 25)`  | Alert Red: Danger actions and error statements       |
| `success`     | `oklch(0.65 0.18 140)`   | `oklch(0.65 0.18 140)` | Safety Green: Successful status, verified checkmarks |

## Border Radius

- `radius-sm`: `calc(var(--radius) * 0.6)` (~4.5px) — Checkboxes, small tags.
- `radius-md`: `calc(var(--radius) * 0.8)` (~6px) — Small buttons, input fields.
- `radius-lg`: `var(--radius)` (12px / 0.75rem) — Default card shapes, main dialogs, action panels.
- `radius-xl`: `calc(var(--radius) * 1.4)` (~16.8px) — Main sheet overlays, modal wrappers.

## Premium Styling Utilities (defined in globals.css)

### 1. Glassmorphism (`.glassmorphism`)

A modern, blurred-background frosted overlay style that reacts beautifully to light and dark theme shifts.

```css
/* Light Mode */
background: rgba(255, 255, 255, 0.45);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.25);

/* Dark Mode */
background: rgba(22, 28, 45, 0.55);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);
```

### 2. High-Visibility Alert Gradient (`.button-warning-gradient`)

A dynamic gradient style running from Safety Amber to Safety Orange designed to draw immediate attention.

```css
background: linear-gradient(135deg, var(--safety-amber) 0%, var(--safety-orange) 100%);
```

### 3. Glow and Micro-animations

- `animate-pulse-glow`: Smooth, breathing ambient shadow animation on action items.
- `animate-float`: Subtle floating micro-interaction to give static items life.
