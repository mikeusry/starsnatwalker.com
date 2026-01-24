/**
 * pd-pixel tracking for coach views
 * Sends view events to program-match analytics
 *
 * @module tracking
 * @see {@link ../lib/README.md} for integration documentation
 */

/**
 * View event data structure sent to analytics endpoint
 */
interface ViewEvent {
  /** URL slug of the player being viewed */
  playerSlug: string;
  /** Full name of the player */
  playerName: string;
  /** ISO timestamp of the view */
  timestamp: string;
  /** HTTP referrer (where visitor came from) */
  referrer: string;
  /** Browser user agent string */
  userAgent: string;
  /** IP address (optional, hashed server-side for privacy) */
  ipAddress?: string;
}

/**
 * Track a player profile view
 *
 * Sends anonymous view event to Program Match analytics.
 * Used to track which coaches are viewing which players.
 *
 * @param playerSlug - URL slug of the player (e.g., "ayn-parker-usry")
 * @param playerName - Full name of the player for reporting
 * @returns Promise that resolves when event is sent (or fails silently)
 *
 * @example
 * ```typescript
 * await trackPlayerView('maddie-diaz', 'Maddie Diaz');
 * ```
 *
 * @remarks
 * - Only runs in browser (SSR-safe with guard)
 * - Fails silently if analytics is down
 * - Uses keepalive to ensure event sends even if page closes
 * - Respects ad blockers (graceful degradation)
 */
export async function trackPlayerView(
  playerSlug: string,
  playerName: string
): Promise<void> {
  if (typeof window === 'undefined') return; // SSR guard

  const event: ViewEvent = {
    playerSlug,
    playerName,
    timestamp: new Date().toISOString(),
    referrer: document.referrer || 'direct',
    userAgent: navigator.userAgent,
  };

  try {
    // Send to program-match analytics endpoint
    const response = await fetch('https://your-analytics-endpoint.com/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'player_view',
        site: 'starsnatwalker',
        data: event,
      }),
      // Don't wait for response
      keepalive: true,
    });

    if (!response.ok) {
      console.warn('Analytics tracking failed:', response.statusText);
    }
  } catch (error) {
    // Fail silently - don't break page if analytics is down
    console.warn('Analytics error:', error);
  }
}

/**
 * Track recruiting activity events for the activity feed
 *
 * Records coach interest indicators (views, video watches, contact clicks)
 * to populate the public recruiting activity feed on the homepage.
 *
 * @param activityType - Type of recruiting activity
 * @param playerSlug - URL slug of the player
 * @param metadata - Optional additional data about the activity
 * @returns Promise that resolves when event is sent (or fails silently)
 *
 * @example
 * ```typescript
 * // Track video watch
 * await trackRecruitingActivity('video_watch', 'sophia-perez', {
 *   duration: 120,
 *   completionRate: 0.85
 * });
 *
 * // Track contact click
 * await trackRecruitingActivity('contact_click', 'riley-walker', {
 *   contactType: 'email'
 * });
 * ```
 *
 * @remarks
 * - Used to generate the public recruiting activity feed
 * - Creates FOMO effect for other coaches
 * - Anonymous by default (coach names not exposed)
 */
export async function trackRecruitingActivity(
  activityType: 'view' | 'video_watch' | 'contact_click' | 'download',
  playerSlug: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch('https://your-analytics-endpoint.com/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: activityType,
        playerSlug,
        site: 'starsnatwalker',
        timestamp: new Date().toISOString(),
        metadata,
      }),
      keepalive: true,
    });
  } catch (error) {
    console.warn('Activity tracking error:', error);
  }
}

/**
 * Generate pd-pixel tracking script for HTML injection
 *
 * Creates a 1x1 tracking pixel script that can be embedded in HTML emails
 * or external pages to track when they're opened/viewed.
 *
 * @param playerSlug - URL slug of the player to track
 * @returns HTML script tag as string
 *
 * @example
 * ```typescript
 * const pixelScript = generateTrackingPixel('maddie-diaz');
 * // Include in email template or external page
 * ```
 *
 * @remarks
 * - Returns self-executing script
 * - Creates invisible 1x1 image
 * - Includes timestamp to prevent caching
 * - Useful for email open tracking
 *
 * @deprecated Consider using pd-pixel.js library instead for richer tracking
 */
export function generateTrackingPixel(playerSlug: string): string {
  return `
    <script>
      (function() {
        var img = new Image();
        img.src = 'https://your-analytics-endpoint.com/px.gif?player=${encodeURIComponent(playerSlug)}&t=' + Date.now();
        img.style.display = 'none';
        document.body.appendChild(img);
      })();
    </script>
  `;
}
