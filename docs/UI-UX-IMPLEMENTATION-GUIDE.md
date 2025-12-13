# AdCraft AI - UI/UX Implementation Guide

> **Purpose**: Instruct Claude Code to apply similar UI/UX patterns to another Next.js + Tailwind CSS + shadcn project
> **Target**: Projects with light/dark mode support

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [CSS Variables & Theming](#css-variables--theming)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Patterns](#component-patterns)
7. [Animation System](#animation-system)
8. [Accessibility](#accessibility)
9. [Responsive Design](#responsive-design)
10. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

AdCraft AI uses a **"Magical Glass Morphism"** design language:
- Dark-first theme with sophisticated light mode support
- Glass morphism cards with backdrop blur
- Gradient accents (purple → pink → gold)
- Subtle animations that respect user preferences
- Professional, premium feel without being overwhelming

### Core Principles
1. **Glass over solid** - Semi-transparent backgrounds with blur
2. **Gradients for emphasis** - Reserve gradients for CTAs and headings
3. **Lift on hover** - Subtle translateY(-2px) for interactive elements
4. **Glow for focus** - Purple glow shadows for focused/active states
5. **Accessibility first** - Reduced motion, high contrast support built-in

---

## CSS Variables & Theming

### Base Setup (globals.css)

```css
@import "tailwindcss";

:root {
  /* === BACKGROUNDS === */
  --background: #0a0a0f;           /* Dark mode default */
  --foreground: #f8fafc;

  /* === PRIMARY PALETTE === */
  --color-primary: #a78bfa;        /* Purple-400 - Main brand */
  --color-primary-glow: #c084fc;   /* Purple-300 - Highlights */
  --color-accent: #f59e0b;         /* Amber-500 - Gold accents */

  /* === GRADIENT COLORS === */
  --color-magic-start: #8b5cf6;    /* Purple-500 */
  --color-magic-mid: #a78bfa;      /* Purple-400 */
  --color-magic-end: #c084fc;      /* Purple-300 */
  --color-pink: #ec4899;           /* Pink-500 */
  --color-blue: #3b82f6;           /* Blue-500 */

  /* === GLASS MORPHISM === */
  --glass-bg-light: rgba(255, 255, 255, 0.05);
  --glass-bg-medium: rgba(255, 255, 255, 0.08);
  --glass-bg-strong: rgba(255, 255, 255, 0.12);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-border-hover: rgba(167, 139, 250, 0.3);

  /* === SHADOWS === */
  --shadow-magical: 0 10px 25px rgba(167, 139, 250, 0.3);
  --shadow-glow: 0 0 25px rgba(167, 139, 250, 0.2);
  --shadow-enchanted: 0 20px 40px rgba(124, 58, 237, 0.2);

  /* === BORDER RADIUS === */
  --radius: 0.75rem;
  --radius-sm: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;

  /* === MUTED === */
  --color-muted: rgba(148, 163, 184, 0.3);
  --color-muted-foreground: #94a3b8;
}

/* === LIGHT MODE === */
@media (prefers-color-scheme: light) {
  :root {
    --background: #f8fafc;         /* Slate-50 */
    --foreground: #0f172a;         /* Slate-900 */

    /* Glass morphism for light mode */
    --glass-bg-light: rgba(255, 255, 255, 0.7);
    --glass-bg-medium: rgba(255, 255, 255, 0.8);
    --glass-bg-strong: rgba(255, 255, 255, 0.9);
    --glass-border: rgba(148, 163, 184, 0.2);
    --glass-border-hover: rgba(139, 92, 246, 0.3);

    /* Adjusted shadows for light mode */
    --shadow-magical: 0 10px 25px rgba(139, 92, 246, 0.15);
    --shadow-glow: 0 0 25px rgba(139, 92, 246, 0.1);
  }
}

/* For projects using class-based dark mode (shadcn default) */
.dark {
  --background: #0a0a0f;
  --foreground: #f8fafc;
  --glass-bg-light: rgba(255, 255, 255, 0.05);
  --glass-bg-medium: rgba(255, 255, 255, 0.08);
  --glass-bg-strong: rgba(255, 255, 255, 0.12);
  --glass-border: rgba(255, 255, 255, 0.1);
}

.light {
  --background: #f8fafc;
  --foreground: #0f172a;
  --glass-bg-light: rgba(255, 255, 255, 0.7);
  --glass-bg-medium: rgba(255, 255, 255, 0.8);
  --glass-bg-strong: rgba(255, 255, 255, 0.9);
  --glass-border: rgba(148, 163, 184, 0.2);
}
```

### Body Background Pattern

```css
body {
  background: var(--background);
  color: var(--foreground);
  background-image:
    radial-gradient(circle at 20% 80%, rgba(167, 139, 250, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
  background-attachment: fixed;
  min-height: 100vh;
}

/* Light mode - softer gradients */
.light body,
@media (prefers-color-scheme: light) {
  body {
    background-image:
      radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.05) 0%, transparent 50%);
  }
}
```

---

## Color System

### Semantic Color Usage

| Purpose | Dark Mode | Light Mode | Tailwind Class |
|---------|-----------|------------|----------------|
| Primary text | `#f8fafc` | `#0f172a` | `text-foreground` |
| Secondary text | `#d1d5db` | `#4b5563` | `text-gray-300 dark:text-gray-600` |
| Muted text | `#94a3b8` | `#64748b` | `text-muted-foreground` |
| Primary action | `#a78bfa` | `#8b5cf6` | `text-purple-400 dark:text-purple-500` |
| Success | `#4ade80` | `#22c55e` | `text-green-400 dark:text-green-500` |
| Error | `#f87171` | `#ef4444` | `text-red-400 dark:text-red-500` |
| Warning | `#fbbf24` | `#f59e0b` | `text-amber-400 dark:text-amber-500` |

### Gradient Patterns

```css
/* Magical text gradient - use for headings */
.magical-text {
  background: linear-gradient(
    45deg,
    var(--color-magic-start),
    var(--color-magic-mid),
    var(--color-magic-end),
    var(--color-accent)
  );
  background-size: 300% 300%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s ease-in-out infinite;
}

/* Button gradient */
.gradient-button {
  background: linear-gradient(to right, #8b5cf6, #ec4899);
}

.gradient-button:hover {
  background: linear-gradient(to right, #9333ea, #db2777);
}
```

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
```

### Heading Scale (Responsive)

```jsx
// Hero heading
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold magical-text">

// Section heading
<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold magical-text">

// Card title
<h3 className="text-lg font-semibold text-foreground">

// Subsection
<h4 className="text-sm font-semibold text-foreground">
```

### Body Text

```jsx
// Primary paragraph
<p className="text-base text-foreground">

// Secondary/description
<p className="text-sm text-muted-foreground">

// Small/helper
<span className="text-xs text-muted-foreground">
```

---

## Spacing & Layout

### Container Pattern

```jsx
<div className="container mx-auto px-4 max-w-6xl">
  {/* Content */}
</div>
```

### Section Spacing

```jsx
// Page sections
<section className="py-16 md:py-24">

// Between cards/components
<div className="space-y-6">

// Inside cards
<div className="space-y-4">
```

### Grid Layouts

```jsx
// Two-column responsive
<div className="grid lg:grid-cols-2 gap-8">

// Feature grid
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

// Single column with max-width
<div className="max-w-3xl mx-auto">
```

---

## Component Patterns

### Glass Card

```tsx
interface CardProps {
  variant?: 'default' | 'glass' | 'magical';
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
}

// CSS classes
const cardVariants = {
  default: 'bg-card border border-border',
  glass: 'glass-card',
  magical: 'glass-card feature-card'
};

// Glass card CSS
.glass-card {
  background: var(--glass-bg-light);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
}

.glass-card-hover:hover {
  background: var(--glass-bg-medium);
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-magical);
}

// Feature card with shimmer
.feature-card:hover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: translateX(-100%);
  animation: shimmer-sweep 0.7s ease-out forwards;
}
```

### Button Variants

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'magical' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shimmer?: boolean;
  glow?: boolean;
}

// Size classes
const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
  xl: 'px-8 py-3 text-lg'
};

// Magical button CSS
.magical-button {
  background: linear-gradient(to right, #8b5cf6, #ec4899);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}

.magical-button:hover {
  background: linear-gradient(to right, #9333ea, #db2777);
  transform: translateY(-2px);
  box-shadow: var(--shadow-magical);
}

.magical-button:active {
  transform: scale(0.95);
}
```

### Input Styling

```css
/* Magical input CSS */
.magical-input {
  background: var(--glass-bg-light);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  color: var(--foreground);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.magical-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
  background: var(--glass-bg-medium);
}

.magical-input::placeholder {
  color: var(--color-muted-foreground);
}

/* Light mode adjustments */
.light .magical-input {
  background: var(--glass-bg-light);
  border-color: var(--glass-border);
}
```

---

## Animation System

### Global Transition

```css
/* Apply smooth transitions globally - OPTIONAL, can be aggressive */
* {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Keyframe Animations

```css
/* Shimmer for text gradients */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Float for decorative elements */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Pulse glow */
@keyframes magicalPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(167, 139, 250, 0); }
}

/* Toast animations */
@keyframes toast-slide-down {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes toast-slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### Interactive Effects

```css
/* Lift on hover */
.interactive-lift {
  transition: transform 0.2s ease;
}

.interactive-lift:hover {
  transform: translateY(-2px);
}

.interactive-lift:active {
  transform: translateY(0);
}

/* Glow on hover */
.magical-glow-hover:hover {
  box-shadow: var(--shadow-glow);
}

/* Scale on active */
.active\:scale-95:active {
  transform: scale(0.95);
}
```

### Button Shimmer Effect

```css
/* Shimmer sweep on hover */
.shimmer-button {
  position: relative;
  overflow: hidden;
}

.shimmer-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transform: translateX(-100%);
  transition: transform 0.7s;
}

.shimmer-button:hover::before {
  transform: translateX(100%);
}
```

---

## Accessibility

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .magical-text {
    animation: none;
    background: var(--color-primary);
    background-clip: text;
    -webkit-background-clip: text;
  }
}
```

### High Contrast Support

```css
@media (prefers-contrast: high) {
  .glass-card {
    border-width: 2px;
    background: var(--glass-bg-strong);
  }

  .magical-button {
    border: 2px solid var(--color-primary);
  }

  .magical-input {
    border-width: 2px;
  }
}
```

### Focus States

```css
/* Visible focus ring */
.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip link for keyboard users */
.skip-link {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-link:focus {
  position: fixed;
  top: 0;
  left: 0;
  width: auto;
  height: auto;
  z-index: 9999;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
}
```

### ARIA Patterns

```tsx
// Button loading state
<button aria-busy={isLoading} disabled={isLoading}>

// Input with error
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>
{error && <p id={`${id}-error`} role="alert">{error}</p>}

// Modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

---

## Responsive Design

### Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile Optimizations

```css
@media (max-width: 768px) {
  /* Hide decorative elements */
  .floating-orb {
    display: none;
  }

  /* Reduce blur for performance */
  .glass-card {
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  /* Touch-friendly targets (48px minimum) */
  .magical-button,
  .magical-input {
    min-height: 48px;
  }
}

@media (max-width: 480px) {
  :root {
    --radius: 0.5rem;
    --radius-lg: 0.5rem;
  }

  .glass-card {
    margin: 0.5rem;
    padding: 1rem;
  }
}
```

### Touch Interactions

```css
.touch-manipulation {
  touch-action: manipulation;
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Add CSS variables to globals.css (copy `:root` block)
- [ ] Add light/dark mode variable overrides (`.dark` / `.light` classes)
- [ ] Add body background gradient pattern
- [ ] Install dependencies: `clsx`, `tailwind-merge`
- [ ] Create `cn()` utility function

### Phase 2: Utility Classes
- [ ] Add `.glass-card` and `.glass-card-hover` classes
- [ ] Add `.magical-text` gradient class
- [ ] Add `.magical-button` and `.magical-input` classes
- [ ] Add `.interactive-lift` and `.magical-glow-hover`
- [ ] Add keyframe animations (shimmer, float, etc.)

### Phase 3: Accessibility
- [ ] Add `@media (prefers-reduced-motion)` rules
- [ ] Add `@media (prefers-contrast: high)` rules
- [ ] Add `.focus-visible` styles
- [ ] Add `.skip-link` for keyboard navigation

### Phase 4: Responsive
- [ ] Add mobile-specific media queries
- [ ] Ensure 48px minimum touch targets
- [ ] Test backdrop-filter performance on mobile
- [ ] Add tablet-specific optimizations

### Phase 5: Components
- [ ] Update Card component with glass/magical variants
- [ ] Update Button component with magical variant
- [ ] Update Input component with glass styling
- [ ] Add hover/glow props to interactive components

---

## Utility Function

```typescript
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

---

## Honest Assessment

### Strengths
1. **Cohesive visual language** - The glass morphism + gradients create a premium feel
2. **Good accessibility** - Built-in support for reduced motion and high contrast
3. **Performance conscious** - Mobile optimizations for blur effects
4. **Well-structured** - CSS variables make theming straightforward

### Considerations
1. **Backdrop blur performance** - Can be heavy on older devices; we reduce it on mobile
2. **Global transition** - The `* { transition: all 0.3s }` is aggressive; consider scoping
3. **Dark-first bias** - Light mode works but dark mode is clearly the primary design
4. **Animation density** - Multiple shimmer/glow effects could feel busy; use sparingly

### For Light/Dark Mode Projects
The patterns work well for dual-mode projects, but you'll want to:
1. Test glass morphism carefully in light mode (may need higher opacity)
2. Adjust shadow colors for light mode (purple shadows on white can look odd)
3. Consider whether gradients need toning down in light mode
4. Ensure sufficient contrast ratios in both modes

---

## Source Files Reference

For implementation details, reference these files from the AdCraft AI codebase:

| File | Purpose |
|------|---------|
| `app/globals.css` | All CSS variables and utility classes |
| `components/ui/Button.tsx` | Button component with variants |
| `components/ui/Card.tsx` | Card component with glass/magical variants |
| `components/ui/Input.tsx` | Input component with styling |
| `components/ui/Modal.tsx` | Modal with accessibility features |
| `components/ui/Toast.tsx` | Toast notifications |
| `components/ui/LoadingSpinner.tsx` | Loading states |
| `components/ui/SkeletonLoader.tsx` | Skeleton loading patterns |
| `lib/utils/cn.ts` | Class merging utility |
| `hooks/useViewport.ts` | Responsive viewport hook |
| `hooks/useHaptics.ts` | Mobile haptic feedback |
