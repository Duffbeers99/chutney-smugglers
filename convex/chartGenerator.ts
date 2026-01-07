/**
 * Generate inline SVG charts for ratings
 * These can be embedded directly in HTML for Substack articles
 */

export interface RatingData {
  food: number;
  service: number;
  extras: number;
  atmosphere: number;
  price?: number;
}

/**
 * Generate a horizontal bar chart for ratings
 * Returns an SVG string that can be embedded in HTML
 */
export function generateRatingChart(data: RatingData): string {
  const width = 600;
  const height = 280;
  const barHeight = 40;
  const barSpacing = 12;
  const leftMargin = 120;
  const rightMargin = 80;
  const chartWidth = width - leftMargin - rightMargin;

  const categories = [
    { label: "Food", value: data.food, max: 10, color: "#FF6B6B" },
    { label: "Service", value: data.service, max: 5, color: "#4ECDC4" },
    { label: "Extras", value: data.extras, max: 5, color: "#45B7D1" },
    { label: "Atmosphere", value: data.atmosphere, max: 5, color: "#FFA07A" },
  ];

  if (data.price !== undefined && data.price !== null) {
    categories.push({
      label: "Price",
      value: data.price,
      max: 5,
      color: "#95E1D3",
    });
  }

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <style>
      .chart-label { font-size: 14px; font-weight: 600; fill: #333; }
      .chart-value { font-size: 14px; font-weight: 700; fill: #333; }
      .chart-max { font-size: 12px; fill: #999; }
    </style>
  </defs>

  ${categories.map((cat, index) => {
    const y = 20 + index * (barHeight + barSpacing);
    const barWidth = (cat.value / cat.max) * chartWidth;

    return `
    <g>
      <!-- Label -->
      <text x="10" y="${y + barHeight / 2 + 5}" class="chart-label">${cat.label}</text>

      <!-- Background bar -->
      <rect x="${leftMargin}" y="${y}" width="${chartWidth}" height="${barHeight}" fill="#f0f0f0" rx="4"/>

      <!-- Value bar -->
      <rect x="${leftMargin}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${cat.color}" rx="4"/>

      <!-- Value text -->
      <text x="${leftMargin + barWidth + 10}" y="${y + barHeight / 2 + 5}" class="chart-value">${cat.value.toFixed(1)}</text>

      <!-- Max value -->
      <text x="${leftMargin + chartWidth + 15}" y="${y + barHeight / 2 + 5}" class="chart-max">/ ${cat.max}</text>
    </g>
    `;
  }).join('\n')}
</svg>
  `.trim();

  return svg;
}

/**
 * Generate a visual price indicator (£ symbols)
 */
export function generatePriceIndicator(priceLevel: number): string {
  const filledColor = "#2ECC71";
  const emptyColor = "#E0E0E0";
  const width = 200;
  const height = 40;
  const symbolWidth = 30;
  const spacing = 10;

  const symbols = Array.from({ length: 5 }, (_, i) => {
    const x = 10 + i * (symbolWidth + spacing);
    const isFilled = i < priceLevel;
    const color = isFilled ? filledColor : emptyColor;

    return `
    <text x="${x}" y="28" font-size="24" font-weight="bold" fill="${color}">£</text>
    `;
  });

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  ${symbols.join('\n')}
</svg>
  `.trim();
}

/**
 * Generate a comparison chart showing current vs. previous visit
 */
export function generateComparisonChart(current: RatingData, previous: RatingData): string {
  const width = 600;
  const height = 320;
  const barHeight = 30;
  const barSpacing = 50;
  const leftMargin = 120;
  const rightMargin = 80;
  const chartWidth = width - leftMargin - rightMargin;

  const categories = [
    { label: "Food", currentValue: current.food, previousValue: previous.food, max: 10, color: "#FF6B6B" },
    { label: "Service", currentValue: current.service, previousValue: previous.service, max: 5, color: "#4ECDC4" },
    { label: "Extras", currentValue: current.extras, previousValue: previous.extras, max: 5, color: "#45B7D1" },
    { label: "Atmosphere", currentValue: current.atmosphere, previousValue: previous.atmosphere, max: 5, color: "#FFA07A" },
  ];

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <style>
      .chart-label { font-size: 14px; font-weight: 600; fill: #333; }
      .chart-value { font-size: 12px; font-weight: 600; fill: #333; }
      .chart-legend { font-size: 11px; fill: #666; }
      .chart-diff-positive { font-size: 11px; font-weight: 700; fill: #2ECC71; }
      .chart-diff-negative { font-size: 11px; font-weight: 700; fill: #E74C3C; }
    </style>
  </defs>

  <!-- Legend -->
  <rect x="${leftMargin}" y="5" width="15" height="15" fill="#999" opacity="0.3" rx="2"/>
  <text x="${leftMargin + 20}" y="16" class="chart-legend">Previous Visit</text>

  <rect x="${leftMargin + 120}" y="5" width="15" height="15" fill="#999" rx="2"/>
  <text x="${leftMargin + 140}" y="16" class="chart-legend">This Visit</text>

  ${categories.map((cat, index) => {
    const y = 40 + index * barSpacing;
    const currentBarWidth = (cat.currentValue / cat.max) * chartWidth;
    const previousBarWidth = (cat.previousValue / cat.max) * chartWidth;
    const diff = cat.currentValue - cat.previousValue;
    const diffText = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    const diffClass = diff > 0 ? "chart-diff-positive" : "chart-diff-negative";

    return `
    <g>
      <!-- Label -->
      <text x="10" y="${y + 20}" class="chart-label">${cat.label}</text>

      <!-- Previous visit bar (lighter) -->
      <rect x="${leftMargin}" y="${y}" width="${previousBarWidth}" height="${barHeight}" fill="${cat.color}" opacity="0.3" rx="4"/>

      <!-- Current visit bar -->
      <rect x="${leftMargin}" y="${y}" width="${currentBarWidth}" height="${barHeight}" fill="${cat.color}" rx="4"/>

      <!-- Values -->
      <text x="${leftMargin + Math.max(currentBarWidth, previousBarWidth) + 10}" y="${y + 20}" class="chart-value">${cat.currentValue.toFixed(1)}</text>

      <!-- Difference -->
      ${diff !== 0 ? `<text x="${leftMargin + Math.max(currentBarWidth, previousBarWidth) + 50}" y="${y + 20}" class="${diffClass}">${diffText}</text>` : ''}
    </g>
    `;
  }).join('\n')}
</svg>
  `.trim();

  return svg;
}

/**
 * Generate an overall score badge
 */
export function generateScoreBadge(score: number, maxScore: number = 25): string {
  const percentage = (score / maxScore) * 100;
  const color = percentage >= 80 ? "#2ECC71" : percentage >= 60 ? "#F39C12" : "#E74C3C";

  return `
<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .badge-score { font-size: 36px; font-weight: 700; fill: #333; }
      .badge-max { font-size: 16px; fill: #999; }
      .badge-label { font-size: 12px; fill: #666; text-transform: uppercase; letter-spacing: 1px; }
    </style>
  </defs>

  <!-- Circle background -->
  <circle cx="60" cy="60" r="55" fill="${color}" opacity="0.1" stroke="${color}" stroke-width="3"/>

  <!-- Score -->
  <text x="60" y="65" text-anchor="middle" class="badge-score">${score.toFixed(1)}</text>
  <text x="60" y="82" text-anchor="middle" class="badge-max">/ ${maxScore}</text>
</svg>
  `.trim();
}
