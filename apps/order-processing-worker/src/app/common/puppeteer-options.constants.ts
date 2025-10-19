/**
 * Puppeteer browser configuration options
 */

/**
 * User agent string for browser
 */
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.107 Safari/537.36';

/**
 * HTTP headers to set on pages
 */
export const HTTP_HEADERS = {
  // 'user-agent': USER_AGENT,
  // 'upgrade-insecure-requests': '1',
  // accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  // 'accept-encoding': 'gzip, deflate, br',
  // 'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
} as const;

/**
 * Browser launch arguments for optimal performance and stealth
 */
export const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process',
  '--ignore-certificate-errors',
  '--password-store=basic',
  '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '--lang=ru-RU,ru',
  '--accept-lang=ru-RU,ru',
  '--window-size=1920,1080',
  '--no-first-run',
  '--no-default-browser-check',
  ]

export const BROWSER_ARGS1 = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-web-security',
  '--allow-running-insecure-content',
  '--disable-blink-features=AutomationControlled',
  '--mute-audio',
  '--no-zygote',
  '--no-xshm',
  '--window-size=1920,1080',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--enable-webgl',
  '--ignore-certificate-errors',
  '--password-store=basic',
  '--disable-gpu-sandbox',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-infobars',
  '--disable-breakpad',
  '--disable-canvas-aa',
  '--disable-2d-canvas-clip-aa',
  '--disable-gl-drawing-for-tests',
  '--enable-low-end-device-mode',
  '--lang=ru-RU,ru',
  '--accept-lang=ru-RU,ru'
] as const;

/**
 * Default viewport configuration
 */
export const DEFAULT_VIEWPORT = {
  width: 1920,
  height: 1080,
} as const;

/**
 * Timeout configurations (in milliseconds)
 */
export const PUPPETEER_TIMEOUTS = {
  /** Timeout for page navigation */
  NAVIGATION: 30000,
  /** Timeout for waiting for an element to appear */
  ELEMENT_WAIT: 10000,
  /** Timeout for login process completion */
  LOGIN_COMPLETE: 60000,
  /** Default timeout for general operations */
  DEFAULT: 5000,
} as const;
