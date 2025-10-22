import { Page, Cookie } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export async function waitForTimeOut(timeOutDuration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeOutDuration));
}

/**
 * Helper method to check if element exists on page
 * @param page - Puppeteer page instance
 * @param selector - CSS selector
 * @returns true if element exists, false otherwise
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.$(selector);
    return element !== null;
  } catch {
    return false;
  }
}

/**
 * Download a file from a URL using the browser's page context
 * @param url - The URL of the file to download
 * @param page - Puppeteer page instance (for cookies and session context)
 * @param pathToSave - Directory path where captcha files should be saved
 * @returns The file path where the file was saved
 */
export async function downloadFile(url: string, page: Page, pathToSave: string): Promise<string> {
  // Create captcha directory if it doesn't exist
  if (!fs.existsSync(pathToSave)) {
    fs.mkdirSync(pathToSave, { recursive: true });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = path.extname(url) || '.png';
  const filename = `captcha_${timestamp}${extension}`;
  const filepath = path.join(pathToSave, filename);

  // Fetch the file using the page's context (to maintain session/cookies)
  const response = await page.evaluate(async (fileUrl) => {
    const res = await fetch(fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    return Array.from(new Uint8Array(arrayBuffer));
  }, url);

  // Write the file to disk
  const buffer = Buffer.from(response);
  fs.writeFileSync(filepath, buffer);

  return filepath;
}

export async function deleteFile(fullFileName: string): Promise<void> {
  await fs.promises.unlink(fullFileName);
}

/**
 * Convert browser cookies array to cookie string format
 * @param cookies - Array of cookies from Puppeteer
 * @returns Cookie string in format "name1=value1; name2=value2"
 */
export function cookiesToString(cookies: Cookie[]): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}
