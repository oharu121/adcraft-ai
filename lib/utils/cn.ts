import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for combining and merging CSS classes
 * Uses clsx for conditional classes and tailwind-merge for proper Tailwind CSS merging
 * 
 * @param inputs - CSS class values to merge
 * @returns Merged CSS class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}