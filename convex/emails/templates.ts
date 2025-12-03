/**
 * Email template helpers with consistent Chutney Smugglers branding
 */

/**
 * Base email wrapper with curry-themed styling
 */
export function emailWrapper(content: string): string {
  return `
    <div style="font-family: 'Georgia', serif; max-width: 500px; margin: 0 auto; background: linear-gradient(to bottom, #FFF8E7, #FFEFD5); padding: 32px; border: 2px solid #D2691E;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #8B4513; font-size: 28px; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Chutney Smugglers</h1>
      </div>
      ${content}
    </div>
  `;
}

/**
 * Content card with curry-themed border
 */
export function contentCard(content: string): string {
  return `
    <div style="background: #FFFAF0; padding: 24px; border-radius: 8px; border-left: 4px solid #FF6347;">
      ${content}
    </div>
  `;
}

/**
 * Primary heading
 */
export function heading(text: string): string {
  return `<h2 style="color: #8B4513; font-size: 20px; margin-top: 0;">${text}</h2>`;
}

/**
 * Body paragraph
 */
export function paragraph(text: string): string {
  return `<p style="color: #654321; font-size: 16px; line-height: 1.6;">${text}</p>`;
}

/**
 * Call-to-action button
 */
export function button(url: string, text: string): string {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #FF6347, #FF4500); color: white; padding: 14px 32px; text-decoration: none; border-radius: 24px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">${text}</a>
    </div>
  `;
}

/**
 * Small text (for details or disclaimers)
 */
export function smallText(text: string): string {
  return `<p style="color: #8B4513; font-size: 14px; margin-bottom: 0;">${text}</p>`;
}

/**
 * Footer text (italic, muted)
 */
export function footer(text: string): string {
  return `<p style="color: #A0826D; font-size: 13px; text-align: center; margin-top: 16px; font-style: italic;">${text}</p>`;
}

/**
 * Event details section
 */
export function eventDetails(details: {
  venueName: string;
  date: string;
  time: string;
  address?: string;
}): string {
  return `
    <div style="background: #FFF8DC; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #DEB887;">
      <div style="margin-bottom: 8px;">
        <strong style="color: #8B4513;">🏪 Venue:</strong>
        <span style="color: #654321;">${details.venueName}</span>
      </div>
      <div style="margin-bottom: 8px;">
        <strong style="color: #8B4513;">📅 Date:</strong>
        <span style="color: #654321;">${details.date}</span>
      </div>
      <div style="margin-bottom: 8px;">
        <strong style="color: #8B4513;">🕐 Time:</strong>
        <span style="color: #654321;">${details.time}</span>
      </div>
      ${details.address ? `
        <div>
          <strong style="color: #8B4513;">📍 Address:</strong>
          <span style="color: #654321;">${details.address}</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * List of attendees
 */
export function attendeeList(attendees: string[]): string {
  const items = attendees.map(name => `
    <li style="color: #654321; margin-bottom: 4px;">• ${name}</li>
  `).join('');

  return `
    <div style="margin: 16px 0;">
      <strong style="color: #8B4513;">Who's coming:</strong>
      <ul style="list-style: none; padding-left: 0; margin-top: 8px;">
        ${items}
      </ul>
    </div>
  `;
}
