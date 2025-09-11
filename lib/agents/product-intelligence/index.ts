/**
 * Product Intelligence Agent
 *
 * Clean exports for all agent functionality using functional approach.
 */

// Main functions
export * as Vision from "./core/vision";
export * as Chat from "./core/chat";

// Convenient direct exports for common functions
export {
  analyzeProductImage,
  inferProductCategory,
  generateProductDescription,
} from "./core/vision";
export { processMessage } from "./core/chat";