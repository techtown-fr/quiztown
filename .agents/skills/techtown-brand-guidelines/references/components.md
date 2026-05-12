# Component Patterns Reference

Ready-to-use component patterns following TechTown brand guidelines.

## Buttons

### Primary Button (Solid)
```html
<a href="#" class="btn">Contact Us</a>
```

```css
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #1c63ed;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
  border: 2px solid transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn:hover {
  background-color: #1557d6;
}
```

### Secondary Button (Outlined)
```html
<a href="#" class="btn btn-secondary">Learn More</a>
```

```css
.btn-secondary {
  background-color: transparent;
  color: #1c63ed;
  border: 2px solid #1c63ed;
}

.btn-secondary:hover {
  background-color: #1c63ed;
  color: white;
}
```

### White Button (for dark backgrounds)
```html
<a href="#" class="btn btn-white">Get Started</a>
```

```css
.btn-white {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-white:hover {
  background-color: white;
  color: #1c63ed;
}
```

## Cards

### Basic Card
```html
<div class="card">
  <h3 class="card-title">Card Title</h3>
  <p class="card-description">Card description text goes here.</p>
</div>
```

```css
.card {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

.card-description {
  font-size: 1.125rem;
  line-height: 1.6;
  color: #6b7280;
}
```

### Service Card (with icon)
```html
<div class="service-card">
  <div class="icon-circle icon--md">
    <span class="icon-text">☁️</span>
  </div>
  <h3>Cloud Consulting</h3>
  <p>Expert guidance for your cloud journey.</p>
  <a href="#" class="btn btn-secondary">En savoir plus</a>
</div>
```

```css
.service-card {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  text-align: center;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.service-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.service-card p {
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: #6b7280;
  flex-grow: 1;
}
```

## Icon Circles

```html
<div class="icon-circle icon--md">
  <span class="icon-text">AI</span>
</div>
```

```css
.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: url(/noise-light.png) #1c63ed;
  color: white;
  margin: 0 auto 1rem;
}

.icon--sm { width: 60px; height: 60px; }
.icon--md { width: 100px; height: 100px; }
.icon--lg { width: 100px; height: 100px; }

.icon-text {
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
}
```

## Sections

### Standard Section
```html
<section class="section">
  <div class="container">
    <h2 class="section-title">Section Title</h2>
    <p class="section-subtitle">A brief description of this section.</p>
    <!-- Content -->
  </div>
</section>
```

```css
.section {
  padding: 4rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-title {
  font-size: 1.875rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 3rem;
  color: #1f2937;
}

.section-subtitle {
  font-size: 1.25rem;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 3rem;
  color: #6b7280;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}
```

### Primary Branded Section (dark with texture)
```html
<section class="section services">
  <div class="container">
    <h2 class="section-title">Our Services</h2>
    <!-- White cards on primary background -->
  </div>
</section>
```

```css
.services {
  background: url(/noise-light.png) #1c63ed;
  color: white;
}

.services .section-title {
  color: white;
}
```

### Alternate Background Section
```html
<section class="section expertises">
  <div class="container">
    <!-- Content -->
  </div>
</section>
```

```css
.expertises {
  background: #f9fafb;
}
```

## Grid Layouts

### 2-Column Grid
```html
<div class="grid grid-2">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
</div>
```

```css
.grid {
  display: grid;
  gap: 2rem;
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### 3-Column Grid
```html
<div class="grid grid-3">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
</div>
```

```css
.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

## Hero Section

```html
<section class="hero">
  <div class="container">
    <div class="hero-content">
      <div class="hero-brand">
        <img src="/techtown-logo.svg" alt="TechTown" class="hero-logo" />
      </div>
      <p class="hero-subtitle">Your tagline here</p>
      <div class="hero-keywords">
        <span>Cloud</span>
        <span>•</span>
        <span>IA</span>
        <span>•</span>
        <span>DevOps</span>
      </div>
      <div class="hero-actions">
        <a href="#contact" class="btn">Nous contacter</a>
        <a href="#services" class="btn btn-secondary">En savoir plus</a>
      </div>
    </div>
  </div>
</section>
```

```css
.hero {
  background: white;
  padding: 4rem 0;
  text-align: center;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
}

.hero-logo {
  height: 80px;
  max-width: 100%;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 2rem;
}

.hero-keywords {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1c63ed;
  margin-bottom: 3rem;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}
```

## Social Links

```html
<div class="social-links">
  <a href="https://linkedin.com/company/techtown-fr" class="social-link" title="LinkedIn">
    <svg><!-- LinkedIn icon --></svg>
  </a>
  <!-- More social icons -->
</div>
```

```css
.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  color: #6b7280;
  transition: color 0.2s ease;
}

.social-link:hover {
  color: #1c63ed;
}
```
