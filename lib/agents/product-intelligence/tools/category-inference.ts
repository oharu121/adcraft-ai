/**
 * Product Category Inference Utilities
 * 
 * Utilities for inferring product categories and subcategories from product names.
 * Uses pattern matching on product names to classify products into standard categories.
 */

import { ProductCategory } from "../enums";

/**
 * Category inference result interface
 */
export interface CategoryInferenceResult {
  category: ProductCategory;
  subcategory: string;
  confidence: number; // 0-1 confidence score
}

/**
 * Product Category Inference class
 */
export class CategoryInference {
  /**
   * Infer product category from product name
   */
  public static inferProductCategory(productName?: string): ProductCategory {
    if (!productName) return ProductCategory.OTHER;

    const name = productName.toLowerCase();

    if (
      name.includes("phone") ||
      name.includes("iphone") ||
      name.includes("samsung") ||
      name.includes("pixel")
    ) {
      return ProductCategory.ELECTRONICS;
    }
    if (
      name.includes("shoe") ||
      name.includes("nike") ||
      name.includes("adidas") ||
      name.includes("sneaker") ||
      name.includes("boot")
    ) {
      return ProductCategory.FASHION;
    }
    if (
      name.includes("coffee") ||
      name.includes("tea") ||
      name.includes("drink") ||
      name.includes("beverage") ||
      name.includes("starbucks")
    ) {
      return ProductCategory.FOOD_BEVERAGE;
    }
    if (
      name.includes("car") ||
      name.includes("tesla") ||
      name.includes("bmw") ||
      name.includes("toyota") ||
      name.includes("honda")
    ) {
      return ProductCategory.AUTOMOTIVE;
    }
    if (name.includes("book") || name.includes("magazine") || name.includes("kindle")) {
      return ProductCategory.BOOKS_MEDIA;
    }
    if (name.includes("laptop") || name.includes("computer") || name.includes("tablet")) {
      return ProductCategory.ELECTRONICS;
    }
    if (name.includes("game") || name.includes("toy") || name.includes("puzzle")) {
      return ProductCategory.TOYS_GAMES;
    }
    if (name.includes("cream") || name.includes("shampoo") || name.includes("skincare")) {
      return ProductCategory.HEALTH_BEAUTY;
    }
    if (name.includes("furniture") || name.includes("chair") || name.includes("table")) {
      return ProductCategory.HOME_GARDEN;
    }

    return ProductCategory.OTHER;
  }

  /**
   * Infer product subcategory from product name and category
   */
  public static inferProductSubcategory(productName?: string): string {
    if (!productName) return "general product";

    const name = productName.toLowerCase();
    const category = this.inferProductCategory(productName);

    switch (category) {
      case ProductCategory.ELECTRONICS:
        if (name.includes("phone")) return "smartphone";
        if (name.includes("laptop")) return "laptop computer";
        if (name.includes("tablet")) return "tablet";
        if (name.includes("watch")) return "smartwatch";
        return "consumer electronics";
      case ProductCategory.FASHION:
        if (name.includes("shoe") || name.includes("sneaker")) return "athletic footwear";
        if (name.includes("shirt")) return "apparel";
        if (name.includes("dress")) return "clothing";
        if (name.includes("jacket")) return "outerwear";
        return "fashion accessory";
      case ProductCategory.FOOD_BEVERAGE:
        if (name.includes("coffee")) return "coffee product";
        if (name.includes("tea")) return "tea product";
        if (name.includes("wine")) return "alcoholic beverage";
        if (name.includes("water")) return "non-alcoholic beverage";
        return "beverage";
      case ProductCategory.AUTOMOTIVE:
        if (name.includes("car")) return "passenger vehicle";
        if (name.includes("truck")) return "commercial vehicle";
        return "vehicle";
      case ProductCategory.HOME_GARDEN:
        if (name.includes("furniture")) return "furniture";
        if (name.includes("plant")) return "gardening";
        if (name.includes("decor")) return "home decoration";
        return "home improvement";
      case ProductCategory.HEALTH_BEAUTY:
        if (name.includes("skincare")) return "skincare product";
        if (name.includes("makeup")) return "cosmetic product";
        if (name.includes("shampoo")) return "hair care";
        return "personal care";
      case ProductCategory.TOYS_GAMES:
        if (name.includes("game")) return "game";
        if (name.includes("puzzle")) return "educational toy";
        return "toy";
      case ProductCategory.BOOKS_MEDIA:
        if (name.includes("book")) return "book";
        if (name.includes("magazine")) return "periodical";
        return "media content";
      default:
        return "consumer product";
    }
  }

  /**
   * Infer category with confidence score
   */
  public static inferCategoryWithConfidence(productName?: string): CategoryInferenceResult {
    if (!productName) {
      return {
        category: ProductCategory.OTHER,
        subcategory: "general product",
        confidence: 0.1,
      };
    }

    const category = this.inferProductCategory(productName);
    const subcategory = this.inferProductSubcategory(productName);
    
    // Calculate confidence based on how specific the match is
    const name = productName.toLowerCase();
    let confidence = 0.5; // Base confidence

    // Increase confidence for very specific matches
    const specificTerms = [
      "iphone", "samsung", "pixel", // Electronics
      "nike", "adidas", "starbucks", // Brand names
      "tesla", "bmw", "toyota", "honda", // Automotive brands
    ];

    const hasSpecificTerm = specificTerms.some(term => name.includes(term));
    if (hasSpecificTerm) {
      confidence = 0.9;
    } else if (category !== ProductCategory.OTHER) {
      confidence = 0.7;
    }

    return {
      category,
      subcategory,
      confidence,
    };
  }

  /**
   * Get all possible categories for a product name (for ambiguous cases)
   */
  public static getPossibleCategories(productName?: string): ProductCategory[] {
    if (!productName) return [ProductCategory.OTHER];

    const name = productName.toLowerCase();
    const categories: ProductCategory[] = [];

    // Check all category patterns
    if (this.matchesElectronics(name)) categories.push(ProductCategory.ELECTRONICS);
    if (this.matchesFashion(name)) categories.push(ProductCategory.FASHION);
    if (this.matchesFoodBeverage(name)) categories.push(ProductCategory.FOOD_BEVERAGE);
    if (this.matchesAutomotive(name)) categories.push(ProductCategory.AUTOMOTIVE);
    if (this.matchesHomeGarden(name)) categories.push(ProductCategory.HOME_GARDEN);
    if (this.matchesHealthBeauty(name)) categories.push(ProductCategory.HEALTH_BEAUTY);
    if (this.matchesToysGames(name)) categories.push(ProductCategory.TOYS_GAMES);
    if (this.matchesBooksMedia(name)) categories.push(ProductCategory.BOOKS_MEDIA);

    return categories.length > 0 ? categories : [ProductCategory.OTHER];
  }

  // Helper methods for category matching
  private static matchesElectronics(name: string): boolean {
    return name.includes("phone") || name.includes("laptop") || name.includes("computer") ||
           name.includes("tablet") || name.includes("watch") || name.includes("electronics");
  }

  private static matchesFashion(name: string): boolean {
    return name.includes("shoe") || name.includes("clothing") || name.includes("fashion") ||
           name.includes("apparel") || name.includes("dress") || name.includes("shirt");
  }

  private static matchesFoodBeverage(name: string): boolean {
    return name.includes("food") || name.includes("drink") || name.includes("beverage") ||
           name.includes("coffee") || name.includes("tea") || name.includes("wine");
  }

  private static matchesAutomotive(name: string): boolean {
    return name.includes("car") || name.includes("vehicle") || name.includes("automotive") ||
           name.includes("truck") || name.includes("motorcycle");
  }

  private static matchesHomeGarden(name: string): boolean {
    return name.includes("home") || name.includes("garden") || name.includes("furniture") ||
           name.includes("decor") || name.includes("plant") || name.includes("house");
  }

  private static matchesHealthBeauty(name: string): boolean {
    return name.includes("health") || name.includes("beauty") || name.includes("skincare") ||
           name.includes("makeup") || name.includes("cosmetic") || name.includes("wellness");
  }

  private static matchesToysGames(name: string): boolean {
    return name.includes("toy") || name.includes("game") || name.includes("puzzle") ||
           name.includes("play") || name.includes("educational");
  }

  private static matchesBooksMedia(name: string): boolean {
    return name.includes("book") || name.includes("media") || name.includes("magazine") ||
           name.includes("content") || name.includes("publication");
  }
}