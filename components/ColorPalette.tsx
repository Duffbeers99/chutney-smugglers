"use client";

/**
 * Color Palette Preview Component
 *
 * Use this component to visualize the Chutney Smugglers color palette
 * during development. Can be temporarily added to any page to see colors.
 *
 * Usage:
 * import { ColorPalette } from '@/components/ColorPalette';
 *
 * <ColorPalette />
 */

export function ColorPalette() {
  const colors = [
    {
      name: "Curry Orange",
      description: "Primary CTA, progress indicators",
      classes: "bg-curry text-curry-foreground",
      variable: "--curry",
    },
    {
      name: "Saffron Gold",
      description: "Luxury accents, badges",
      classes: "bg-saffron text-saffron-foreground",
      variable: "--saffron",
    },
    {
      name: "Turmeric Yellow",
      description: "Bright highlights, warnings",
      classes: "bg-turmeric text-turmeric-foreground",
      variable: "--turmeric",
    },
    {
      name: "Terracotta",
      description: "Earthy secondary actions",
      classes: "bg-terracotta text-terracotta-foreground",
      variable: "--terracotta",
    },
    {
      name: "Spice Brown",
      description: "Dark text, badges",
      classes: "bg-spice text-spice-foreground",
      variable: "--spice",
    },
  ];

  const backgrounds = [
    {
      name: "Background",
      classes: "bg-background text-foreground border border-border",
      variable: "--background",
    },
    {
      name: "Card",
      classes: "bg-card text-card-foreground border border-border",
      variable: "--card",
    },
    {
      name: "Muted",
      classes: "bg-muted text-muted-foreground",
      variable: "--muted",
    },
  ];

  const utilities = [
    {
      name: "Paper Texture",
      classes: "paper-texture",
      description: "Old paper crosshatch",
    },
    {
      name: "Paper Aged",
      classes: "paper-aged",
      description: "Vintage parchment",
    },
    {
      name: "Curry Gradient",
      classes: "curry-gradient text-white",
      description: "Warm orange gradient",
    },
    {
      name: "Saffron Gradient",
      classes: "saffron-gradient text-saffron-foreground",
      description: "Gold gradient",
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Chutney Smugglers Color Palette
        </h1>
        <p className="text-muted-foreground">
          Indian-themed vintage curry menu aesthetic
        </p>
      </div>

      {/* Primary Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Primary Colors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colors.map((color) => (
            <div
              key={color.name}
              className="card-parchment overflow-hidden space-y-0"
            >
              <div className={`${color.classes} h-32 flex items-center justify-center`}>
                <div className="text-center">
                  <div className="font-bold text-lg">{color.name}</div>
                  <div className="text-sm opacity-90 font-mono">{color.variable}</div>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <div className="font-medium text-sm">{color.name}</div>
                <div className="text-xs text-muted-foreground">{color.description}</div>
                <div className="font-mono text-xs text-spice mt-2">
                  .{color.classes.split(' ')[0]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Background Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Background Colors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {backgrounds.map((bg) => (
            <div key={bg.name} className="space-y-2">
              <div
                className={`${bg.classes} h-24 rounded-lg flex items-center justify-center`}
              >
                <span className="font-medium">{bg.name}</span>
              </div>
              <div className="font-mono text-xs text-spice">{bg.variable}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Utility Classes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Utility Classes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {utilities.map((util) => (
            <div key={util.name} className="space-y-2">
              <div
                className={`${util.classes} h-32 rounded-lg flex items-center justify-center p-6`}
              >
                <div className="text-center">
                  <div className="font-bold text-lg">{util.name}</div>
                  <div className="text-sm opacity-80 mt-1">{util.description}</div>
                </div>
              </div>
              <div className="font-mono text-xs text-spice">.{util.classes.split(' ')[0]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Component Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Component Examples
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Button Examples */}
          <div className="card-parchment p-6 space-y-4">
            <h3 className="font-semibold text-spice">Buttons</h3>
            <button className="btn-curry w-full py-3 rounded-lg touch-target">
              <span>Curry Button</span>
            </button>
            <button className="bg-terracotta text-terracotta-foreground w-full py-3 rounded-lg touch-target">
              Terracotta Button
            </button>
            <button className="bg-muted text-foreground w-full py-3 rounded-lg touch-target">
              Muted Button
            </button>
          </div>

          {/* Badge Examples */}
          <div className="card-parchment p-6 space-y-4">
            <h3 className="font-semibold text-spice">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <span className="badge-spice">Premium</span>
              <span className="accent-saffron px-3 py-1 rounded-full text-sm font-semibold">
                New
              </span>
              <span className="bg-curry text-curry-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Hot
              </span>
              <span className="bg-turmeric text-turmeric-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Spicy
              </span>
            </div>
          </div>

          {/* Border Examples */}
          <div className="card-parchment p-6 space-y-4">
            <h3 className="font-semibold text-spice">Decorative Borders</h3>
            <div className="indian-border p-4 text-center text-sm">
              Indian Border
            </div>
            <div className="corner-ornament p-4 border border-border rounded-lg text-center text-sm">
              Corner Ornament
            </div>
          </div>

          {/* Card with Hover */}
          <div className="card-parchment card-hover p-6 cursor-pointer">
            <h3 className="font-semibold text-spice mb-2">Hoverable Card</h3>
            <p className="text-sm text-muted-foreground">
              Hover over this card to see the lift effect
            </p>
          </div>

          {/* Progress Example */}
          <div className="card-parchment p-6">
            <h3 className="font-semibold text-spice mb-4">Progress Ring</h3>
            <div className="flex items-center justify-center">
              <svg className="w-24 h-24 -rotate-90">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="6"
                  fill="transparent"
                  r="40"
                  cx="48"
                  cy="48"
                />
                <circle
                  className="progress-curry"
                  strokeWidth="6"
                  strokeDasharray={`${7.5 * 6.283}, 300`}
                  fill="transparent"
                  r="40"
                  cx="48"
                  cy="48"
                />
              </svg>
            </div>
            <div className="text-center mt-2">
              <div className="text-2xl font-bold text-curry">7.5</div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          </div>

          {/* Shimmer Loading */}
          <div className="card-parchment p-6 space-y-3">
            <h3 className="font-semibold text-spice mb-2">Loading States</h3>
            <div className="shimmer h-4 rounded" />
            <div className="shimmer h-4 rounded w-3/4" />
            <div className="shimmer h-4 rounded w-1/2" />
          </div>
        </div>
      </section>

      {/* Text Color Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Text Colors
        </h2>
        <div className="card-parchment p-6 space-y-2">
          <p className="text-curry text-lg">Curry orange text - for emphasis and CTAs</p>
          <p className="text-saffron text-lg">Saffron gold text - for luxury accents</p>
          <p className="text-turmeric text-lg">Turmeric yellow text - for highlights</p>
          <p className="text-terracotta text-lg">Terracotta text - for earthy tones</p>
          <p className="text-spice text-lg">Spice brown text - for dark emphasis</p>
          <p className="text-muted-foreground text-lg">Muted text - for secondary content</p>
        </div>
      </section>

      {/* Gradient Showcase */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Gradients
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="curry-gradient h-32 rounded-lg flex items-center justify-center text-white font-semibold">
            Curry Gradient
          </div>
          <div className="saffron-gradient h-32 rounded-lg flex items-center justify-center text-saffron-foreground font-semibold">
            Saffron Gradient
          </div>
          <div className="terracotta-gradient h-32 rounded-lg flex items-center justify-center text-white font-semibold">
            Terracotta Gradient
          </div>
          <div className="spice-gradient h-32 rounded-lg flex items-center justify-center text-white font-semibold">
            Spice Gradient
          </div>
        </div>
      </section>

      {/* Mesh Gradient Background */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Mesh Gradient Background
        </h2>
        <div className="mesh-gradient h-64 rounded-lg flex items-center justify-center">
          <div className="card-parchment p-8">
            <h3 className="text-2xl font-bold text-spice">Beautiful Mesh</h3>
            <p className="text-muted-foreground mt-2">
              Warm radial gradients for page backgrounds
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
