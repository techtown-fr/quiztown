---
name: techtown-brand-guidelines
description: TechTown brand and design system guidelines. Use when creating UI components, styling pages, generating marketing materials, or implementing visual design for TechTown projects. Covers colors, typography, spacing, components, and logo usage.
metadata:
  author: techtown
  version: "1.0"
license: Proprietary. LICENSE.txt has complete terms
---

# TechTown Brand Guidelines

## Overview

TechTown is a French tech consulting company specializing in Cloud & AI expertise, based in Nantes. The brand identity reflects innovation, technical excellence, and approachability.

## Color Palette

### Primary Colors

| Name             | Hex       | CSS Variable           | Usage                                     |
| ---------------- | --------- | ---------------------- | ----------------------------------------- |
| **Primary Blue** | `#1C62ED` | `--color-primary`      | Primary brand color, CTAs, links, accents |
| **Primary Dark** | `#1557D6` | `--color-primary-dark` | Hover states, emphasis                    |
| **Accent Blue**  | `#3B7EFF` | `--color-accent`       | Secondary highlights                      |
| **White**        | `#FFFFFF` | `--color-background`   | Backgrounds, text on dark                 |
| **Black**        | `#000000` | -                      | Reserved for true black needs             |

### Text Colors

| Name             | Hex       | CSS Variable         | Usage                        |
| ---------------- | --------- | -------------------- | ---------------------------- |
| **Text Primary** | `#1F2937` | `--color-text`       | Body text, headings          |
| **Text Light**   | `#6B7280` | `--color-text-light` | Secondary text, descriptions |
| **Text White**   | `#FFFFFF` | `--color-text-white` | Text on dark backgrounds     |
| **Neutral**      | `#6B7280` | `--color-neutral`    | Muted elements               |

### Background Colors

| Name                | Hex       | CSS Variable                   | Usage                      |
| ------------------- | --------- | ------------------------------ | -------------------------- |
| **Background**      | `#FFFFFF` | `--color-background`           | Main page background       |
| **Background Alt**  | `#F9FAFB` | `--color-background-alt`       | Section backgrounds, cards |
| **Background Dark** | `#1F2937` | `--color-background-alt-black` | Dark sections, footer      |
| **Border**          | `#E5E7EB` | `--color-border`               | Borders, dividers          |

### Gradient Colors

| Name               | Hex       | CSS Variable                   | Usage            |
| ------------------ | --------- | ------------------------------ | ---------------- |
| **Gradient Start** | `#F8FAFC` | `--color-gradient-light-start` | Subtle gradients |
| **Gradient End**   | `#E2E8F0` | `--color-gradient-light-end`   | Subtle gradients |

### Special Purpose Colors

#### TechReady Event

| Name      | Hex       | Variable                      |
| --------- | --------- | ----------------------------- |
| Primary   | `#667EEA` | `--color-techready-primary`   |
| Secondary | `#764BA2` | `--color-techready-secondary` |
| Warning   | `#F59E0B` | `--color-techready-warning`   |
| Success   | `#10B981` | `--color-techready-success`   |

#### Chatbot (Purple Theme)

| Name      | Hex       | Variable                 |
| --------- | --------- | ------------------------ |
| Primary   | `#8B5CF6` | `--color-chat-primary`   |
| Secondary | `#A855F7` | `--color-chat-secondary` |
| Tertiary  | `#C084FC` | `--color-chat-tertiary`  |

#### Social Media

| Platform  | Hex       | Variable            |
| --------- | --------- | ------------------- |
| LinkedIn  | `#0077B5` | `--color-linkedin`  |
| Bluesky   | `#00BCD4` | `--color-bluesky`   |
| Instagram | `#E4405F` | `--color-instagram` |
| YouTube   | `#FF0000` | `--color-youtube`   |

#### Google Brand

| Color | Hex       | Variable               |
| ----- | --------- | ---------------------- |
| Blue  | `#4285F4` | `--color-google-blue`  |
| Green | `#34A853` | `--color-google-green` |

## Typography

### Font Family

- **Primary Font**: `Poppins` (sans-serif)
- **Fallback**: System sans-serif stack

```css
font-family: "Poppins", sans-serif;
```

### Font Weights

| Weight         | Variable                 | Usage                     |
| -------------- | ------------------------ | ------------------------- |
| Light (300)    | `--font-weight-light`    | Subtle text               |
| Regular (400)  | `--font-weight-normal`   | Body text                 |
| Medium (500)   | `--font-weight-medium`   | Buttons, emphasis         |
| Semibold (600) | `--font-weight-semibold` | Subheadings               |
| Bold (700)     | `--font-weight-bold`     | Headings, strong emphasis |

### Font Sizes

| Size  | Variable           | Value           | Usage              |
| ----- | ------------------ | --------------- | ------------------ |
| Base  | `--font-size-base` | 1rem (16px)     | Body text          |
| Large | `--font-size-lg`   | 1.125rem (18px) | Lead text          |
| XL    | `--font-size-xl`   | 1.25rem (20px)  | Card titles        |
| 2XL   | `--font-size-2xl`  | 1.5rem (24px)   | H3, subsections    |
| 3XL   | `--font-size-3xl`  | 1.875rem (30px) | H2, section titles |
| 4XL   | `--font-size-4xl`  | 2.25rem (36px)  | H1, hero headings  |
| 5XL   | `--font-size-5xl`  | 3rem (48px)     | Display text       |

### Line Height

Default line height: `1.6` for body text, `1.4` for headings.

## Spacing System

| Name | Variable        | Value          |
| ---- | --------------- | -------------- |
| XS   | `--spacing-xs`  | 0.5rem (8px)   |
| SM   | `--spacing-sm`  | 0.75rem (12px) |
| MD   | `--spacing-md`  | 1rem (16px)    |
| LG   | `--spacing-lg`  | 1.5rem (24px)  |
| XL   | `--spacing-xl`  | 2rem (32px)    |
| 2XL  | `--spacing-2xl` | 3rem (48px)    |
| 3XL  | `--spacing-3xl` | 4rem (64px)    |

## Layout

| Property            | Variable                | Value        |
| ------------------- | ----------------------- | ------------ |
| Max Width           | `--container-max-width` | 1200px       |
| Border Radius       | `--border-radius`       | 0.5rem (8px) |
| Border Radius Large | `--border-radius-lg`    | 1rem (16px)  |

## Shadows

```css
/* Standard shadow */
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

/* Large shadow (cards, elevated elements) */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

## Components

### Buttons

#### Primary Button

```css
.btn {
  padding: var(--spacing-sm) var(--spacing-lg); /* 12px 24px */
  background-color: var(--color-primary); /* #1C62ED */
  color: white;
  border-radius: var(--border-radius); /* 8px */
  font-weight: var(--font-weight-medium); /* 500 */
  border: 2px solid transparent;
  transition: background-color 0.2s ease;
}

.btn:hover {
  background-color: var(--color-primary-dark); /* #1557D6 */
}
```

#### Secondary Button (Outlined)

```css
.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-secondary:hover {
  background-color: var(--color-primary);
  color: white;
}
```

#### White Button (on dark backgrounds)

```css
.btn-white {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-white:hover {
  background-color: white;
  color: var(--color-primary);
}
```

### Cards

Standard card styling:

```css
.card {
  background: white;
  padding: var(--spacing-2xl); /* 48px */
  border-radius: var(--border-radius-lg); /* 16px */
  box-shadow: var(--shadow-lg);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

### Icon Circles

Circular icons with primary background and texture:

```css
.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--texture-noise-light) var(--color-primary);
  color: white;
}

/* Sizes */
.icon--sm {
  width: 60px;
  height: 60px;
}
.icon--md {
  width: 100px;
  height: 100px;
}
.icon--lg {
  width: 100px;
  height: 100px;
}
```

### Sections

```css
.section {
  padding: var(--spacing-3xl) 0; /* 64px vertical */
}

.section-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  color: var(--color-text);
}
```

### Primary Background Section

```css
.services {
  background: var(--texture-noise-light) var(--color-primary);
  color: var(--color-text-white);
}
```

## Logo

### Files (included in `assets/`)

| File                                                                  | Format | Usage                       |
| --------------------------------------------------------------------- | ------ | --------------------------- |
| [techtown-logo.svg](assets/techtown-logo.svg)                         | SVG    | Primary logo (preferred)    |
| [techtown-logo-square.svg](assets/techtown-logo-square.svg)           | SVG    | Square format for icons     |
| [techtown-logo.png](assets/techtown-logo.png)                         | PNG    | Raster fallback             |
| [techtown-logo-transparent.png](assets/techtown-logo-transparent.png) | PNG    | Transparent background      |
| [techtown-logo-long.png](assets/techtown-logo-long.png)               | PNG    | Wide format                 |
| [techtown-meta-og.png](assets/techtown-meta-og.png)                   | PNG    | Open Graph / social sharing |

### Usage

```html
<!-- Header logo -->
<img
  src="/techtown-logo.svg"
  alt="TechTown"
  class="brand-logo"
  width="167"
  height="30"
/>

<!-- Hero logo (larger) -->
<img
  src="/techtown-logo.svg"
  alt="TechTown"
  class="hero-logo"
  width="445"
  height="80"
/>
```

### Guidelines

- Always use SVG when possible for crisp rendering
- Maintain aspect ratio
- Provide adequate clear space around the logo
- On dark backgrounds, use the light/white variant

## Textures

A subtle noise texture is used on primary-colored backgrounds.

**File**: [noise-light.png](assets/noise-light.png)

```css
--texture-noise-light: url(/noise-light.png);

/* Applied to primary backgrounds */
background: var(--texture-noise-light) var(--color-primary);
```

## Responsive Breakpoints

| Breakpoint | Usage                    |
| ---------- | ------------------------ |
| 768px      | Mobile/tablet transition |

```css
@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .section {
    padding: var(--spacing-2xl) 0 var(--spacing-md);
  }
}
```

## Grid System

```css
.grid {
  display: grid;
  gap: var(--spacing-xl); /* 32px */
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

## Best Practices

1. **Consistency**: Always use CSS variables instead of hardcoded values
2. **Accessibility**: Ensure sufficient color contrast (WCAG AA minimum)
3. **Primary Blue Usage**: Reserve `#1C62ED` for interactive elements and brand emphasis
4. **White Space**: Use generous spacing for clean, modern feel
5. **Typography Hierarchy**: Clear visual hierarchy using font weights and sizes
6. **Hover States**: Apply subtle transitions (0.2-0.3s ease) for interactive elements
7. **Card Elevation**: Use shadows and hover transforms for depth
8. **Mobile First**: Design for mobile, enhance for desktop
