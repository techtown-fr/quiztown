# CSS Variables Reference

Complete list of CSS custom properties for TechTown design system.

## Quick Copy - All Variables

```css
:root {
  /* Colors */
  --color-primary: #1c63ed;
  --color-primary-dark: #1557d6;
  --color-secondary: #1557d6;
  --color-accent: #3b7eff;
  --color-text: #1f2937;
  --color-text-light: #6b7280;
  --color-text-white: #ffffff;
  --color-background: #ffffff;
  --color-background-alt: #f9fafb;
  --color-background-alt-black: #1f2937;
  --color-border: #e5e7eb;
  --color-neutral: #6b7280;
  --color-gradient-light-start: #f8fafc;
  --color-gradient-light-end: #e2e8f0;
  
  /* TechReady event colors */
  --color-techready-primary: #667eea;
  --color-techready-secondary: #764ba2;
  --color-techready-warning: #f59e0b;
  --color-techready-success: #10b981;
  
  /* Social Media Colors */
  --color-linkedin: #0077b5;
  --color-bluesky: #00bcd4;
  --color-instagram: #e4405f;
  --color-youtube: #ff0000;
  
  /* Google Brand Colors */
  --color-google-blue: #4285F4;
  --color-google-green: #34A853;
  
  /* Chat Colors - Purple gradient */
  --color-chat-primary: #8b5cf6;
  --color-chat-secondary: #a855f7;
  --color-chat-tertiary: #c084fc;
  --color-chat-primary-dark: #7c3aed;
  --color-chat-secondary-dark: #9333ea;
  
  /* Typography */
  --font-family: 'Poppins', sans-serif;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;
  
  /* Layout */
  --container-max-width: 1200px;
  --border-radius: 0.5rem;
  --border-radius-lg: 1rem;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Textures */
  --texture-noise-light: url(/noise-light.png);
}
```

## Tailwind CSS Mapping

If using Tailwind CSS, here's the equivalent configuration:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1c63ed',
          dark: '#1557d6',
        },
        accent: '#3b7eff',
        techtown: {
          text: '#1f2937',
          'text-light': '#6b7280',
          border: '#e5e7eb',
          'bg-alt': '#f9fafb',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      spacing: {
        'xs': '0.5rem',
        'sm': '0.75rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
      },
      maxWidth: {
        container: '1200px',
      },
    },
  },
}
```

## Color Swatches by Context

### Primary Actions
```css
/* Main CTA buttons, links, active states */
background-color: var(--color-primary);    /* #1c63ed */
background-color: var(--color-primary-dark); /* #1557d6 - hover */
```

### Text
```css
/* Body text */
color: var(--color-text);        /* #1f2937 */

/* Secondary/muted text */
color: var(--color-text-light);  /* #6b7280 */

/* Text on dark backgrounds */
color: var(--color-text-white);  /* #ffffff */
```

### Backgrounds
```css
/* Main background */
background-color: var(--color-background);      /* #ffffff */

/* Alternate sections (subtle contrast) */
background-color: var(--color-background-alt);  /* #f9fafb */

/* Dark sections */
background-color: var(--color-background-alt-black); /* #1f2937 */

/* Primary branded background */
background: var(--texture-noise-light) var(--color-primary);
```
