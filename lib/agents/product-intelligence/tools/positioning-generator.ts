/**
 * Positioning Generator for Product Intelligence
 *
 * Generates brand positioning, value propositions, and competitive advantages
 * for different product categories based on locale and product context.
 */

import { getLocaleConstants } from "@/lib/constants/locale-constants";
import { ProductCategory,  BrandTone, MarketTier } from "../enums";
import { Positioning } from "../types";

/**
 * Positioning generation options
 */
export interface PositioningGenerationOptions {
  category: ProductCategory;
  productName?: string;
  locale?: "en" | "ja";
}

/**
 * Positioning Generator class
 */
export class PositioningGenerator {
  /**
   * Generate brand positioning based on product category and locale
   */
  public generatePositioning(options: PositioningGenerationOptions): Positioning {
    const { category, productName, locale = "en" } = options;

    const localeConstants = getLocaleConstants(locale);
    const valueProps =
      localeConstants.valuePropositions[category] ||
      localeConstants.valuePropositions[ProductCategory.OTHER];

    const positioningMap = {
      [ProductCategory.ELECTRONICS]: {
        brandPersonality: {
          traits: ["innovative", "premium", "professional", "sophisticated"],
          tone: BrandTone.LUXURY,
          voice: localeConstants.brandVoices[ProductCategory.ELECTRONICS],
        },
        valueProposition: {
          primaryBenefit: valueProps.primaryBenefit(productName),
          supportingBenefits: valueProps.supportingBenefits,
          differentiators: valueProps.differentiators,
        },
        competitiveAdvantages: {
          functional: [
            "superior AI processing",
            "advanced capabilities",
            "professional reliability",
          ],
          emotional: ["executive confidence", "innovation leadership", "professional prestige"],
          experiential: ["seamless workflows", "premium quality", "exclusive features"],
        },
        marketPosition: {
          tier: MarketTier.LUXURY,
          niche: "professionals and innovators",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.FASHION]: {
        brandPersonality: {
          traits: ["stylish", "trendy", "confident", "expressive"],
          tone: BrandTone.FRIENDLY,
          voice: localeConstants.brandVoices[ProductCategory.FASHION],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.FASHION].primaryBenefit(productName),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.FASHION].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.FASHION].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior comfort", "quality materials", "versatile styling"],
          emotional: ["confidence boost", "style expression", "trendsetting"],
          experiential: ["premium feel", "compliment-worthy", "Instagram-ready"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "fashion-forward individuals",
          marketShare: "niche" as const,
        },
      },
      [ProductCategory.HOME_GARDEN]: {
        brandPersonality: {
          traits: ["reliable", "comfortable", "practical", "welcoming"],
          tone: BrandTone.FRIENDLY,
          voice: localeConstants.brandVoices[ProductCategory.HOME_GARDEN],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.HOME_GARDEN].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.HOME_GARDEN].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.HOME_GARDEN].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior durability", "practical design", "easy maintenance"],
          emotional: ["home comfort", "family wellbeing", "peace of mind"],
          experiential: ["daily satisfaction", "long-term value", "effortless living"],
        },
        marketPosition: {
          tier: MarketTier.MAINSTREAM,
          niche: "home comfort enthusiasts",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.FOOD_BEVERAGE]: {
        brandPersonality: {
          traits: ["fresh", "authentic", "wholesome", "satisfying"],
          tone: BrandTone.FRIENDLY,
          voice: localeConstants.brandVoices[ProductCategory.FOOD_BEVERAGE],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.FOOD_BEVERAGE].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.FOOD_BEVERAGE].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.FOOD_BEVERAGE].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior taste", "quality ingredients", "nutritional value"],
          emotional: ["comfort food feeling", "family tradition", "guilt-free indulgence"],
          experiential: ["satisfying meals", "memorable flavors", "social sharing"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "quality food enthusiasts",
          marketShare: "niche" as const,
        },
      },
      [ProductCategory.HEALTH_BEAUTY]: {
        brandPersonality: {
          traits: ["nurturing", "wellness-focused", "premium", "trustworthy"],
          tone: BrandTone.FRIENDLY,
          voice: localeConstants.brandVoices[ProductCategory.HEALTH_BEAUTY],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.HEALTH_BEAUTY].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.HEALTH_BEAUTY].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.HEALTH_BEAUTY].differentiators,
        },
        competitiveAdvantages: {
          functional: ["proven effectiveness", "gentle formulation", "visible results"],
          emotional: ["confidence boost", "self-care ritual", "wellbeing enhancement"],
          experiential: ["luxurious feel", "daily indulgence", "transformative results"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "wellness enthusiasts",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.SPORTS_OUTDOORS]: {
        brandPersonality: {
          traits: ["energetic", "adventurous", "durable", "performance-focused"],
          tone: BrandTone.AUTHORITATIVE,
          voice: localeConstants.brandVoices[ProductCategory.SPORTS_OUTDOORS],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.SPORTS_OUTDOORS].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.SPORTS_OUTDOORS].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.SPORTS_OUTDOORS].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior durability", "enhanced performance", "weather resistance"],
          emotional: ["achievement motivation", "adventure spirit", "confidence building"],
          experiential: ["peak performance", "outdoor freedom", "personal records"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "outdoor enthusiasts",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.AUTOMOTIVE]: {
        brandPersonality: {
          traits: ["powerful", "reliable", "sophisticated", "innovative"],
          tone: BrandTone.LUXURY,
          voice: localeConstants.brandVoices[ProductCategory.AUTOMOTIVE],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.AUTOMOTIVE].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.AUTOMOTIVE].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.AUTOMOTIVE].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior performance", "advanced safety", "fuel efficiency"],
          emotional: ["driving pleasure", "status symbol", "freedom of mobility"],
          experiential: ["smooth ride", "luxury comfort", "technological sophistication"],
        },
        marketPosition: {
          tier: MarketTier.LUXURY,
          niche: "driving enthusiasts",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.BOOKS_MEDIA]: {
        brandPersonality: {
          traits: ["intellectual", "inspiring", "accessible", "enriching"],
          tone: BrandTone.PROFESSIONAL,
          voice: localeConstants.brandVoices[ProductCategory.BOOKS_MEDIA],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.BOOKS_MEDIA].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.BOOKS_MEDIA].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.BOOKS_MEDIA].differentiators,
        },
        competitiveAdvantages: {
          functional: ["comprehensive content", "expert insights", "practical application"],
          emotional: ["intellectual satisfaction", "personal growth", "inspiration"],
          experiential: ["engaging storytelling", "knowledge acquisition", "skill development"],
        },
        marketPosition: {
          tier: MarketTier.MAINSTREAM,
          niche: "lifelong learners",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.TOYS_GAMES]: {
        brandPersonality: {
          traits: ["playful", "creative", "educational", "fun"],
          tone: BrandTone.PLAYFUL,
          voice: localeConstants.brandVoices[ProductCategory.TOYS_GAMES],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.TOYS_GAMES].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.TOYS_GAMES].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.TOYS_GAMES].differentiators,
        },
        competitiveAdvantages: {
          functional: ["educational benefits", "safety standards", "durability"],
          emotional: ["joy and laughter", "family bonding", "achievement satisfaction"],
          experiential: ["creative play", "skill development", "memorable moments"],
        },
        marketPosition: {
          tier: MarketTier.MAINSTREAM,
          niche: "families and educators",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.BUSINESS]: {
        brandPersonality: {
          traits: ["professional", "efficient", "reliable", "innovative"],
          tone: BrandTone.AUTHORITATIVE,
          voice: localeConstants.brandVoices[ProductCategory.BUSINESS],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.BUSINESS].primaryBenefit(productName),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.BUSINESS].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.BUSINESS].differentiators,
        },
        competitiveAdvantages: {
          functional: ["operational efficiency", "integration capabilities", "data security"],
          emotional: ["professional confidence", "competitive advantage", "growth enablement"],
          experiential: ["streamlined workflows", "productivity gains", "strategic insights"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "business professionals",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.OTHER]: {
        brandPersonality: {
          traits: ["reliable", "practical", "quality", "trustworthy"],
          tone: BrandTone.PROFESSIONAL,
          voice: "reliable quality that meets your needs", // Fallback voice
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.OTHER].primaryBenefit(productName),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.OTHER].supportingBenefits,
          differentiators: localeConstants.valuePropositions[ProductCategory.OTHER].differentiators,
        },
        competitiveAdvantages: {
          functional: ["reliable performance", "practical features", "good value"],
          emotional: ["peace of mind", "confidence", "satisfaction"],
          experiential: ["consistent quality", "dependable service", "long-term value"],
        },
        marketPosition: {
          tier: MarketTier.MAINSTREAM,
          niche: "quality-conscious consumers",
          marketShare: "challenger" as const,
        },
      },
    };

    return (positioningMap[category] || positioningMap[ProductCategory.OTHER]) as Positioning;
  }
}
