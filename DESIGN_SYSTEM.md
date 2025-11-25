# Chutney Smugglers Design System

A vintage Indian curry menu-inspired design system for a progressive web app focused on rating curries with friends.

## Design Philosophy

The Chutney Smugglers design system evokes the warmth and richness of Indian cuisine through:

- **Vintage Curry Menu Aesthetic**: Old paper textures, warm spice-inspired colors
- **Traditional Indian Elements**: Paisley-inspired borders, decorative corner ornaments
- **Mobile-First PWA**: Optimized touch targets, smooth animations, accessible interactions
- **Warm Color Psychology**: Using the inviting warmth of curry oranges, saffron golds, and terracotta browns

---

## Color Palette

### Primary Colors (Light Mode)

#### Curry Orange
- **Variable**: `--curry: oklch(0.62 0.20 40)`
- **Usage**: Primary CTA buttons, progress indicators, key actions
- **Hex Equivalent**: Approximately `#D97835`
- **Contrast**: WCAG AA compliant with white text

#### Saffron Gold
- **Variable**: `--saffron: oklch(0.78 0.15 80)`
- **Usage**: Luxury accents, badges, highlights
- **Hex Equivalent**: Approximately `#E8C062`

#### Turmeric Yellow
- **Variable**: `--turmeric: oklch(0.82 0.16 95)`
- **Usage**: Bright highlights, warning states, energy indicators
- **Hex Equivalent**: Approximately `#F4D345`

#### Terracotta
- **Variable**: `--terracotta: oklch(0.52 0.12 45)`
- **Usage**: Earthy secondary actions, decorative elements
- **Hex Equivalent**: Approximately `#B86B4A`

#### Spice Brown
- **Variable**: `--spice: oklch(0.35 0.03 50)`
- **Usage**: Dark text, badges, grounding elements
- **Hex Equivalent**: Approximately `#593F30`

### Background Colors

#### Light Mode
- **Background**: `oklch(0.96 0.015 65)` - Cream/old paper
- **Card**: `oklch(0.98 0.012 70)` - Light parchment
- **Muted**: `oklch(0.92 0.015 70)` - Light beige

#### Dark Mode
- **Background**: `oklch(0.20 0.025 45)` - Rich dark brown
- **Card**: `oklch(0.25 0.028 48)` - Slightly lighter brown
- **Muted**: `oklch(0.32 0.03 50)` - Medium brown

### Semantic Colors

- **Primary**: Curry orange (main actions)
- **Secondary**: Saffron gold (secondary actions)
- **Accent**: Turmeric yellow (highlights)
- **Destructive**: `oklch(0.55 0.22 25)` - Deep red chili

---

## Typography

### Current Setup
- **Sans Serif**: Geist (body text, UI elements)
- **Monospace**: Geist Mono (code, data)

### Recommendations for Headers

Consider adding one of these Google Fonts for headers to enhance the Indian theme:

1. **Cinzel** - Elegant, classical serif perfect for menu-style headers
2. **Cormorant Garamond** - Ornate serif with vintage feel
3. **Playfair Display** - High-contrast serif for dramatic headers

#### Implementation Example

```typescript
// In app/layout.tsx
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Add to body className
className={`${geistSans.variable} ${playfair.variable} antialiased`}
```

Then use `font-display` for headers:

```html
<h1 className="font-display text-4xl font-bold">Chutney Smugglers</h1>
```

### Typography Scale

- **Body**: 16px minimum (mobile readability)
- **Small**: 14px (captions, meta)
- **Large**: 18px (emphasis)
- **Headings**: Scale from 20px to 40px

### Features
- Kerning enabled: `"kern" 1`
- Ligatures enabled: `"liga" 1`
- Contextual alternates for headings: `"calt" 1`
- Slight letter-spacing tightening on headings: `-0.01em`

---

## Custom CSS Utility Classes

### Paper Textures

#### `.paper-texture`
Basic old paper texture effect with subtle crosshatch pattern
```html
<div class="paper-texture p-6 rounded-lg">
  Content with paper texture background
</div>
```

#### `.paper-aged`
Enhanced paper with aged, stained effect using inset shadows
```html
<div class="paper-aged p-8 rounded-xl">
  Vintage parchment appearance
</div>
```

#### `.card-parchment`
Complete parchment card style with texture, borders, and shadows
```html
<div class="card-parchment p-6">
  Perfect for curry rating cards
</div>
```

### Gradients

#### `.curry-gradient`
Warm curry orange gradient (135deg)
```html
<button class="curry-gradient text-white px-6 py-3 rounded-lg">
  Rate Curry
</button>
```

#### `.saffron-gradient`
Turmeric to saffron gold gradient
```html
<div class="saffron-gradient p-4 rounded-lg">
  Premium badge
</div>
```

#### `.spice-gradient`
Deep, rich brown gradient for dark elements
```html
<div class="spice-gradient text-white p-6">
  Footer content
</div>
```

#### `.terracotta-gradient`
Earthy clay gradient
```html
<div class="terracotta-gradient text-white rounded-full p-3">
  Icon container
</div>
```

#### `.mesh-gradient`
Warm radial mesh gradient for page backgrounds
```html
<div class="mesh-gradient min-h-screen">
  Page content
</div>
```

### Decorative Borders

#### `.indian-border`
Double-line paisley-inspired border
```html
<div class="indian-border p-6">
  Featured content with decorative border
</div>
```

#### `.border-dots`
Dotted decorative border pattern
```html
<div class="border-dots pl-4">
  List item with dotted accent
</div>
```

#### `.corner-ornament`
Corner decorations in saffron gold
```html
<div class="corner-ornament p-8">
  Special announcement card
</div>
```

### Component Styles

#### `.btn-curry`
Button with curry gradient hover effect
```html
<button class="btn-curry px-6 py-3 rounded-lg touch-target">
  <span>Submit Rating</span>
</button>
```

#### `.accent-saffron`
Saffron accent element with glow
```html
<span class="accent-saffron px-3 py-1 rounded-full text-sm">
  New
</span>
```

#### `.progress-curry`
SVG stroke color for progress rings
```html
<circle class="progress-curry" ... />
```

#### `.card-hover`
Smooth card hover effect with lift and shadow
```html
<div class="card-parchment card-hover p-6 cursor-pointer">
  Interactive curry card
</div>
```

#### `.badge-spice`
Dark spice brown badge with uppercase text
```html
<span class="badge-spice">Premium</span>
```

### Animations

#### `.shimmer`
Loading shimmer effect
```html
<div class="shimmer h-20 rounded-lg"></div>
```

#### `.pulse-curry`
Pulsing effect with curry-colored shadow
```html
<div class="pulse-curry bg-curry w-3 h-3 rounded-full"></div>
```

### Touch Targets

#### `.touch-target`
Minimum 44x44px touch target (iOS/WCAG compliant)
```html
<button class="touch-target">
  <Icon />
</button>
```

#### `.touch-target-lg`
Larger 52x52px touch target for primary actions
```html
<button class="touch-target-lg bg-curry rounded-full">
  <PlusIcon />
</button>
```

### Accessibility

#### `.focus-curry`
Curry-colored focus outline
```html
<button class="focus-curry ...">
  Accessible button
</button>
```

---

## Direct Color Utilities

### Text Colors
```html
<p class="text-curry">Curry orange text</p>
<p class="text-saffron">Saffron gold text</p>
<p class="text-turmeric">Turmeric yellow text</p>
<p class="text-terracotta">Terracotta text</p>
<p class="text-spice">Spice brown text</p>
```

### Background Colors
```html
<div class="bg-curry">Curry background</div>
<div class="bg-saffron">Saffron background</div>
<div class="bg-turmeric">Turmeric background</div>
<div class="bg-terracotta">Terracotta background</div>
<div class="bg-spice">Spice background</div>
```

### Border Colors
```html
<div class="border-2 border-curry">Curry border</div>
<div class="border-2 border-saffron">Saffron border</div>
```

---

## Component Examples

### Curry Rating Card

```jsx
<div className="card-parchment card-hover p-6 space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="font-display text-xl font-semibold text-spice">
      Chicken Tikka Masala
    </h3>
    <span className="badge-spice">Rated</span>
  </div>

  <div className="flex items-center gap-2">
    <svg className="w-16 h-16 -rotate-90">
      <circle
        className="text-muted stroke-current"
        strokeWidth="4"
        fill="transparent"
        r="28"
        cx="32"
        cy="32"
      />
      <circle
        className="progress-curry"
        strokeWidth="4"
        strokeDasharray={`${8.5 * 6.283}, 200`}
        fill="transparent"
        r="28"
        cx="32"
        cy="32"
      />
    </svg>
    <div>
      <div className="text-3xl font-bold text-curry">8.5</div>
      <div className="text-sm text-muted-foreground">Delicious</div>
    </div>
  </div>

  <button className="btn-curry w-full py-3 rounded-lg touch-target">
    <span>View Details</span>
  </button>
</div>
```

### Stats Dashboard Card

```jsx
<div className="paper-aged p-6 rounded-xl space-y-3">
  <h4 className="text-sm font-semibold text-spice uppercase tracking-wide">
    This Month
  </h4>
  <div className="flex items-end gap-2">
    <div className="text-4xl font-bold text-curry">12</div>
    <div className="text-muted-foreground mb-1">curries rated</div>
  </div>
  <div className="curry-gradient h-2 rounded-full" />
</div>
```

### Premium Badge

```jsx
<div className="accent-saffron px-4 py-2 rounded-full inline-flex items-center gap-2">
  <svg className="w-4 h-4 text-saffron-foreground" ... >
    <path d="..." />
  </svg>
  <span className="text-sm font-semibold">Premium Member</span>
</div>
```

### Navigation Button

```jsx
<button className="touch-target-lg bg-curry text-curry-foreground rounded-full shadow-lg focus-curry">
  <HomeIcon className="w-6 h-6" />
</button>
```

---

## Dark Mode Support

All utilities automatically adapt to dark mode. The system uses:

- **Warm dark browns** instead of pure black
- **Brighter accent colors** for better contrast
- **Subtle texture overlays** that remain visible
- **Enhanced glow effects** on interactive elements

Toggle dark mode with:

```jsx
// Add 'dark' class to html or body element
document.documentElement.classList.toggle('dark');
```

Or use Next.js themes:

```jsx
import { ThemeProvider } from "next-themes"

<ThemeProvider attribute="class" defaultTheme="light">
  {children}
</ThemeProvider>
```

---

## Accessibility Standards

This design system meets WCAG 2.1 AA standards:

- **Color Contrast**: 4.5:1 for body text, 3:1 for large text and UI
- **Touch Targets**: Minimum 44x44px (use `.touch-target`)
- **Focus Indicators**: 2px solid outlines with offset
- **Reduced Motion**: Animations disabled via `prefers-reduced-motion`
- **High Contrast**: Paper textures removed in high contrast mode
- **Semantic HTML**: Use proper heading hierarchy, ARIA labels

---

## Performance Considerations

- **OKLCH Colors**: Modern perceptual color space for consistent appearance
- **CSS-only textures**: No image assets required for paper effects
- **Minimal animations**: 200-300ms transitions for snappy feel
- **Layered utilities**: Use Tailwind's `@layer` for optimal CSS generation
- **Dark mode optimization**: Single class toggle, no flash

---

## Mobile PWA Optimizations

### Touch Zones
- Primary actions in thumb-friendly zones (bottom third of screen)
- Navigation bar at bottom for easy reach
- Large touch targets (44px+) for all interactive elements

### Visual Feedback
- Immediate visual response on tap (no 300ms delay)
- Subtle haptic-like animations on button press
- Clear active/pressed states

### Spacing
- 8px base unit for consistent rhythm
- Adequate padding for comfortable tapping (16px minimum)
- Cards separated by 12-16px gaps

### Loading States
Use `.shimmer` for skeleton screens while content loads:

```jsx
<div className="space-y-4">
  <div className="shimmer h-24 rounded-lg" />
  <div className="shimmer h-24 rounded-lg" />
  <div className="shimmer h-24 rounded-lg" />
</div>
```

---

## Browser Support

- **Modern browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **OKLCH support**: 90%+ of users (graceful degradation to sRGB)
- **CSS Grid/Flexbox**: Full support in all modern browsers
- **Custom properties**: Full support

---

## File Location

All styles are centralized in:

```
/Users/jake.duffy/git/chutney-smugglers/app/globals.css
```

The design system is built on:
- **Tailwind CSS v4**
- **shadcn/ui components** (New York style)
- **OKLCH color system**
- **Next.js 14+**

---

## Usage Tips

1. **Start with shadcn/ui components** - They inherit the theme automatically
2. **Layer textures thoughtfully** - Don't overuse `.paper-texture`, reserve for key cards
3. **Use curry colors sparingly** - Let the warm neutrals breathe, accent with curry/saffron
4. **Test in dark mode early** - Ensure designs work in both modes
5. **Combine utilities** - Mix `.card-parchment`, `.card-hover`, and `.corner-ornament` for rich effects
6. **Mobile-first always** - Test on real devices, verify touch targets

---

## Next Steps

Consider adding:

1. **Display font** - Playfair Display or Cinzel for headers
2. **Pattern library** - SVG paisley or mandala patterns for backgrounds
3. **Icon system** - Custom curry/spice themed icons
4. **Illustrations** - Hand-drawn curry illustrations in the vintage style
5. **Sound effects** - Subtle audio feedback for ratings (optional for PWA)

---

## Questions or Customization

To adjust colors, modify the OKLCH values in `/app/globals.css`:

- **First number (L)**: Lightness (0-1)
- **Second number (C)**: Chroma/saturation (0-0.4)
- **Third number (H)**: Hue angle (0-360)

Example:
```css
--curry: oklch(0.62 0.20 40);
         /* L: 62% bright
            C: 20% saturated
            H: 40deg orange */
```

Use [oklch.com](https://oklch.com) to visualize and adjust colors.
