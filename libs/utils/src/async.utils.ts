/**
 * Random pause between min and max milliseconds
 * @param minMs - Minimum delay in milliseconds (default: 1000)
 * @param maxMs - Maximum delay in milliseconds (default: 3000)
 * @returns Promise that resolves after random delay
 */
export async function randomPause(minMs = 1000, maxMs = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, delay));
}
