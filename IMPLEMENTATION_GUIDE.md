# Implementation Guide - Chutney Smugglers Theme

Quick reference guide for implementing the Indian-themed design system in your components.

## Quick Start

All styles are already configured in `/Users/jake.duffy/git/chutney-smugglers/app/globals.css`. Simply use the utility classes in your components.

## Common Patterns

### 1. Curry Rating Card

```jsx
<div className="card-parchment card-hover p-6 space-y-4 max-w-sm">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h3 className="text-xl font-semibold text-spice">
      Butter Chicken
    </h3>
    <span className="badge-spice">5★</span>
  </div>

  {/* Progress Ring */}
  <div className="flex items-center gap-4">
    <svg className="w-20 h-20 -rotate-90">
      <circle
        className="text-muted stroke-current"
        strokeWidth="4"
        fill="transparent"
        r="32"
        cx="40"
        cy="40"
      />
      <circle
        className="progress-curry"
        strokeWidth="4"
        strokeDasharray={`${9.2 * 6.283}, 200`}
        strokeLinecap="round"
        fill="transparent"
        r="32"
        cx="40"
        cy="40"
      />
    </svg>
    <div>
      <div className="text-3xl font-bold text-curry">9.2</div>
      <div className="text-sm text-muted-foreground">Outstanding</div>
    </div>
  </div>

  {/* Action Button */}
  <button className="btn-curry w-full py-3 rounded-lg touch-target">
    <span className="font-semibold">View Details</span>
  </button>
</div>
```

### 2. Dashboard Stats Widget

```jsx
<div className="paper-aged p-6 rounded-xl space-y-3">
  <div className="flex items-center justify-between">
    <h4 className="text-xs font-semibold text-spice uppercase tracking-wide">
      Curries This Month
    </h4>
    <span className="pulse-curry bg-curry w-2 h-2 rounded-full" />
  </div>

  <div className="flex items-end gap-2">
    <div className="text-4xl font-bold text-curry">24</div>
    <div className="text-muted-foreground mb-1.5">rated</div>
  </div>

  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div className="curry-gradient h-full w-3/4" />
  </div>

  <p className="text-xs text-muted-foreground">
    3 more than last month
  </p>
</div>
```

### 3. Premium Badge

```jsx
<div className="accent-saffron px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-lg">
  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
  <span className="text-sm font-semibold">Premium Member</span>
</div>
```

### 4. List Item with Decorative Border

```jsx
<div className="border-dots pl-6 py-4 space-y-1">
  <h4 className="font-medium text-foreground">Chicken Korma</h4>
  <p className="text-sm text-muted-foreground">Mild and creamy</p>
  <div className="flex gap-2 mt-2">
    <span className="bg-turmeric text-turmeric-foreground px-2 py-0.5 rounded text-xs font-semibold">
      Mild
    </span>
    <span className="bg-saffron text-saffron-foreground px-2 py-0.5 rounded text-xs font-semibold">
      Creamy
    </span>
  </div>
</div>
```

### 5. Featured Content Card

```jsx
<div className="corner-ornament card-parchment p-8 space-y-4">
  <div className="inline-block bg-curry text-curry-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
    Featured
  </div>

  <h2 className="text-2xl font-bold text-spice">
    Curry of the Week
  </h2>

  <p className="text-muted-foreground">
    Discover our community's highest-rated curry this week
  </p>

  <button className="btn-curry px-6 py-3 rounded-lg touch-target inline-flex items-center gap-2">
    <span>Explore Now</span>
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
</div>
```

### 6. Navigation Bar (Bottom)

```jsx
<nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
  <div className="flex items-center justify-around max-w-lg mx-auto px-4 py-2">
    <button className="touch-target-lg flex flex-col items-center gap-1 focus-curry rounded-lg">
      <div className="bg-curry text-curry-foreground rounded-full p-2">
        <HomeIcon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-curry">Home</span>
    </button>

    <button className="touch-target-lg flex flex-col items-center gap-1 focus-curry rounded-lg">
      <div className="bg-muted text-muted-foreground rounded-full p-2">
        <ListIcon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">List</span>
    </button>

    <button className="touch-target-lg flex flex-col items-center gap-1 focus-curry rounded-lg">
      <div className="curry-gradient text-white rounded-full p-3 shadow-lg">
        <PlusIcon className="w-6 h-6" />
      </div>
    </button>

    <button className="touch-target-lg flex flex-col items-center gap-1 focus-curry rounded-lg">
      <div className="bg-muted text-muted-foreground rounded-full p-2">
        <StatsIcon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">Stats</span>
    </button>

    <button className="touch-target-lg flex flex-col items-center gap-1 focus-curry rounded-lg">
      <div className="bg-muted text-muted-foreground rounded-full p-2">
        <ProfileIcon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">Profile</span>
    </button>
  </div>
</nav>
```

### 7. Loading Skeleton

```jsx
<div className="card-parchment p-6 space-y-4">
  <div className="flex items-center justify-between">
    <div className="shimmer h-6 w-32 rounded" />
    <div className="shimmer h-5 w-16 rounded-full" />
  </div>

  <div className="flex items-center gap-4">
    <div className="shimmer w-20 h-20 rounded-full" />
    <div className="space-y-2 flex-1">
      <div className="shimmer h-8 w-16 rounded" />
      <div className="shimmer h-4 w-24 rounded" />
    </div>
  </div>

  <div className="shimmer h-12 w-full rounded-lg" />
</div>
```

### 8. Empty State

```jsx
<div className="mesh-gradient min-h-[400px] flex items-center justify-center p-8">
  <div className="card-parchment max-w-md p-8 text-center space-y-4">
    <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
      <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>

    <h3 className="text-xl font-semibold text-spice">
      No Curries Yet
    </h3>

    <p className="text-muted-foreground">
      Start your curry rating journey by adding your first restaurant experience
    </p>

    <button className="btn-curry px-6 py-3 rounded-lg touch-target inline-flex items-center gap-2 mx-auto">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span>Add First Curry</span>
    </button>
  </div>
</div>
```

### 9. Alert/Toast Notification

```jsx
<div className="card-parchment indian-border p-4 flex items-start gap-3 max-w-sm shadow-lg">
  <div className="accent-saffron rounded-full p-2 flex-shrink-0">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  </div>
  <div className="flex-1 min-w-0">
    <h4 className="font-semibold text-spice">Rating Submitted!</h4>
    <p className="text-sm text-muted-foreground mt-1">
      Your curry rating has been added successfully
    </p>
  </div>
  <button className="text-muted-foreground hover:text-foreground transition-colors">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>
```

### 10. Header with Mesh Background

```jsx
<header className="mesh-gradient border-b border-border">
  <div className="max-w-lg mx-auto px-4 py-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="curry-gradient w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
          CS
        </div>
        <div>
          <h1 className="text-xl font-bold text-spice">Chutney Smugglers</h1>
          <p className="text-xs text-muted-foreground">Rate your curries</p>
        </div>
      </div>

      <button className="touch-target rounded-lg focus-curry">
        <div className="relative">
          <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 pulse-curry bg-curry w-2 h-2 rounded-full" />
        </div>
      </button>
    </div>
  </div>
</header>
```

## Using with shadcn/ui Components

The theme automatically applies to shadcn/ui components. Examples:

### Button (from shadcn/ui)

```jsx
import { Button } from "@/components/ui/button"

// Automatically uses curry orange
<Button>Click Me</Button>

// Variants work with the theme
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
```

### Card (from shadcn/ui)

```jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Add paper texture to shadcn cards
<Card className="card-parchment card-hover">
  <CardHeader>
    <CardTitle className="text-spice">Curry Rating</CardTitle>
  </CardHeader>
  <CardContent>
    Content with vintage paper theme
  </CardContent>
</Card>
```

### Badge (from shadcn/ui)

```jsx
import { Badge } from "@/components/ui/badge"

<Badge className="bg-curry">Hot</Badge>
<Badge className="bg-saffron text-saffron-foreground">Premium</Badge>
<Badge className="badge-spice">Spicy</Badge>
```

## Responsive Design Tips

### Mobile-First Breakpoints

```jsx
<div className="
  grid
  grid-cols-1      /* Mobile: single column */
  md:grid-cols-2   /* Tablet: 2 columns (768px+) */
  lg:grid-cols-3   /* Desktop: 3 columns (1024px+) */
  gap-4
">
  {/* Cards */}
</div>
```

### Touch-Friendly Spacing

```jsx
{/* Mobile: tight spacing, Desktop: relaxed */}
<div className="space-y-4 md:space-y-6 lg:space-y-8">
  {/* Content */}
</div>

{/* Mobile: smaller padding, Desktop: larger */}
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>
```

### Typography Scaling

```jsx
{/* Responsive text sizes */}
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-spice">
  Responsive Heading
</h1>

<p className="text-sm md:text-base lg:text-lg text-muted-foreground">
  Responsive body text
</p>
```

## Dark Mode Toggle

```jsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="touch-target bg-muted rounded-lg focus-curry"
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5 text-curry" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5 text-spice" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
        </svg>
      )}
    </button>
  );
}
```

## Performance Tips

1. **Use semantic color variables**: `bg-curry` instead of hardcoded OKLCH values
2. **Avoid excessive nesting**: Paper textures are CSS-heavy, use sparingly
3. **Optimize images**: Use WebP format with fallbacks
4. **Lazy load below fold**: Only load visible content initially
5. **Reduce animations on slow devices**: `prefers-reduced-motion` is built-in

## Testing Checklist

- [ ] Test on real mobile devices (not just browser dev tools)
- [ ] Verify touch targets are at least 44x44px
- [ ] Check contrast ratios in both light and dark mode
- [ ] Test with screen readers (buttons have proper ARIA labels)
- [ ] Verify keyboard navigation works smoothly
- [ ] Test on slow 3G connection
- [ ] Check PWA installation flow
- [ ] Verify dark mode transition is smooth

## Color Palette Preview

To visualize all colors during development:

```jsx
import { ColorPalette } from '@/components/ColorPalette';

// Temporarily add to any page
export default function DevPage() {
  return <ColorPalette />;
}
```

## Need Help?

- **Design System Documentation**: `/DESIGN_SYSTEM.md`
- **Color Variables**: `/app/globals.css` (lines 57-211)
- **Utility Classes**: `/app/globals.css` (lines 231-750)
- **Examples**: `/components/ColorPalette.tsx`

## Common Issues

### Issue: Colors not showing
**Solution**: Ensure Tailwind CSS v4 is properly configured and globals.css is imported in layout.tsx

### Issue: Paper texture not visible
**Solution**: Element must have sufficient size (min 50x50px) and the texture is subtle by design

### Issue: Dark mode not working
**Solution**: Add `class` attribute to ThemeProvider and ensure html/body has dark class toggled

### Issue: Touch targets too small
**Solution**: Use `.touch-target` or `.touch-target-lg` classes on interactive elements

### Issue: Gradients not smooth
**Solution**: OKLCH gradients require modern browsers, consider adding fallback colors
