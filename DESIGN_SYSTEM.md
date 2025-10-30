# Alphland Design System

Complete design system documentation for the Alphland project, including all style specifications, colors, fonts, and component design guidelines.

## 🎨 Color System

### Primary Colors
```css
--orange: #ff5d51          /* Primary accent color */
--accessible-green: #02A697 /* Secondary accent color */
```

### Background Colors
```css
/* Light Mode */
--smoked-white: #f7f7f7    /* Main page background */
--white: #fff              /* Card/container background */

/* Dark Mode */
--light-black: #181818     /* Main page background */
--hero-dark: #1F1F1F       /* Hero section background */
```

### Text Colors
```css
--black: #000              /* Primary text (light mode) */
--white: #fff              /* Primary text (dark mode) */
--lightgrey: #8F8D8C       /* Secondary text */
--light-charcoal: #8F8E8C  /* Tertiary text */
--dark-charcoal: #5c5b59   /* Dark tertiary text */
```

### Borders & Dividers
```css
--border-grey: #ededed     /* Border color */
--clay: #C2C0BE           /* Secondary border */
```

### Other
```css
--tooltip-dark: #333333    /* Tooltip background */
```

## 📝 Typography

### Font Family
```css
font-family: 'Barlow', system-ui, sans-serif;
```

**Barlow Font Weights:**
- 300 (Light)
- 400 (Regular)
- 500 (Medium)
- 600 (Semi Bold)
- 700 (Bold)
- 800 (Extra Bold)
- 900 (Black)

### Font Sizes (Tailwind)
Uses Tailwind default font sizes plus custom:
```css
--button-size: 17px
```

## 🎯 Common Tailwind Classes

### Container
```jsx
<div className="container px-4 mx-auto">
  {/* Content */}
</div>
```

### Responsive Grid
```jsx
// Card grid
<div className="grid grid-cols-1 gap-y-8 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-x-20 lg:gap-y-20">
  {/* Cards */}
</div>
```

### Text Styles
```jsx
<h3 className="font-semibold text-xl leading-none mb-5">
  Title Text
</h3>
```

### Dark Mode
```jsx
<div className="bg-white dark:bg-light-black">
  <p className="text-black dark:text-white">
    Text content
  </p>
</div>
```

## 🎭 Shadow Effects

```css
box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.15);        /* Default shadow */
box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.2);         /* Hover shadow */
```

Or use Tailwind classes:
```jsx
<div className="shadow-box-image-shadow hover:shadow-box-image-shadow-hover">
```

## 📦 Component Design Principles

### 1. Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)

### 2. Dark Mode Support
- All components must support dark mode
- Use `dark:` prefix for dark mode styles
- Use `useDarkMode` hook to get current theme

### 3. Spacing Standards
```jsx
// Page-level spacing
mb-16 lg:mb-32          // Page bottom
mt-20                   // Page top

// Component spacing
gap-y-8 lg:gap-y-20     // Vertical spacing
gap-x-20                // Horizontal spacing
px-4                    // Horizontal padding
```

## 🔧 Using Styled Components

When custom styles are needed, use styled-components:

```tsx
import styled from "styled-components";

const CustomSection = styled.section`
  display: grid;
  grid-template-columns: minmax(300px, 340px) 1fr;
  grid-column-gap: 64px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;
```

## 📱 Layout Structure

### Standard Page Layout
```tsx
import Layout from "../components/Layout";

const YourPage = () => {
  return (
    <Layout
      title="Page Title"
      description="Page Description"
      image="/your-og-image.png"
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Page content */}
      </div>
    </Layout>
  );
};
```

### Home Page Layout
```tsx
<Layout isHome>
  {/* isHome will use special HomeHeader */}
</Layout>
```

## 🎨 Card Design

Standard card styles reference `src/components/Card/Card.tsx`:
- Rounded corners
- Hover effects (shadow deepening)
- Responsive images
- Tag/badge system

## 🌈 Theme Switching

Implemented using `next-themes`:
```tsx
import { useDarkMode } from "../../hooks/useDarkMode";

const Component = () => {
  const { currentTheme, setTheme } = useDarkMode();

  return (
    <button onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
};
```

## 📋 Icons and Assets

- Logo: `/public` directory
- Favicons: Multiple sizes configured
- OG Images: For social sharing

## ✅ Development Checklist

When creating new pages, ensure:
- [ ] Wrapped with Layout component
- [ ] Dark mode support
- [ ] Responsive design (test all breakpoints)
- [ ] Using design system colors
- [ ] Using Barlow font
- [ ] Proper page meta information
- [ ] Test theme switching functionality

## 🚀 Quick Start New Page Template

```tsx
import Layout from "../components/Layout";

const BountyPage = () => {
  return (
    <Layout
      title="Bounty"
      description="Alphland Bounty Program"
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Use Tailwind + Barlow font */}
        <h1 className="text-4xl font-bold mb-8 dark:text-white">
          Bounty Program
        </h1>

        {/* Use design system colors */}
        <div className="bg-white dark:bg-hero-dark rounded-lg p-6">
          <p className="text-light-charcoal dark:text-white">
            Content...
          </p>

          <button className="bg-orange text-white px-6 py-3 rounded-lg hover:opacity-90">
            Get Started
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default BountyPage;
```

## 📁 Configuration Files

All style configurations are in the following files:
- `tailwind.config.js` - Tailwind configuration and custom colors
- `src/styles/globals.css` - Global styles and font imports
- `src/pages/_app.tsx` - ThemeProvider configuration

## 🎯 Best Practices

1. **Always use the Layout component** for consistent header/footer
2. **Test both themes** - light and dark mode
3. **Mobile-first** - build for mobile, enhance for desktop
4. **Use semantic HTML** - proper heading hierarchy
5. **Accessibility** - proper contrast ratios, ARIA labels when needed
6. **Performance** - optimize images, lazy load when appropriate

## 🔍 Component Examples

### Button Styles
```tsx
// Primary button
<button className="bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
  Primary Action
</button>

// Secondary button
<button className="bg-accessible-green text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
  Secondary Action
</button>

// Outline button
<button className="border-2 border-orange text-orange px-6 py-3 rounded-lg font-medium hover:bg-orange hover:text-white transition-all">
  Outline Button
</button>
```

### Card Styles
```tsx
<div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
  <h3 className="text-2xl font-semibold mb-4 dark:text-white">
    Card Title
  </h3>
  <p className="text-light-charcoal dark:text-lightgrey">
    Card content goes here
  </p>
</div>
```

### Tag/Badge Styles
```tsx
<span className="bg-orange text-white px-4 py-1 rounded-full text-sm font-medium">
  Featured
</span>

<span className="bg-smoked-white dark:bg-light-black px-3 py-1 rounded text-sm dark:text-white">
  Category
</span>
```

---

**Need Help?** Refer to existing components in `src/components/` for more examples.
