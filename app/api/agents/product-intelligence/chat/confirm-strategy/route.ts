/**
 * Product Intelligence Agent - Strategy Confirmation API
 * 
 * Handles user confirmation (Yes/No) for strategy updates
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiErrorCode } from "@/lib/agents/product-intelligence/enums";
import { ApiResponse } from "@/lib/agents/product-intelligence/types";
import { FirestoreService } from "@/lib/services/firestore";

// Request validation schema
const ConfirmationRequestSchema = z.object({
  sessionId: z.string().uuid(),
  messageId: z.string(),
  confirmed: z.boolean(),
  locale: z.enum(["en", "ja"]).default("en"),
});

/**
 * Handle POST requests for strategy confirmations
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{
  success: boolean;
  message: string;
  updatedStrategy?: any;
}>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = ConfirmationRequestSchema.parse(body);

    const { sessionId, messageId, confirmed, locale } = validatedRequest;

    const firestoreService = FirestoreService.getInstance();

    if (confirmed) {
      // User confirmed - confirm the pending strategy
      const result = await firestoreService.confirmPendingStrategy(sessionId);
      
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ApiErrorCode.INTERNAL_ERROR,
              message: "Failed to confirm strategy",
              userMessage:
                locale === "ja"
                  ? "戦略の更新に失敗しました。"
                  : "Failed to update strategy.",
            },
            timestamp,
            requestId,
          },
          { status: 500 }
        );
      }

      const successMessage = locale === "ja" 
        ? "戦略を更新しました！新しい戦略で進めましょう。"
        : "Strategy updated! Let's continue with the new strategy.";

      return NextResponse.json({
        success: true,
        data: {
          success: true,
          message: successMessage,
          updatedStrategy: result.updatedStrategy
        },
        timestamp,
        requestId,
      });
    } else {
      // User rejected - clear pending strategy
      await firestoreService.clearPendingStrategy(sessionId);
      
      const rejectionMessage = locale === "ja"
        ? "承知しました。元の戦略を保持します。他に調整したい点はありますか？"
        : "Understood. Keeping the original strategy. Anything else you'd like to adjust?";

      return NextResponse.json({
        success: true,
        data: {
          success: true,
          message: rejectionMessage
        },
        timestamp,
        requestId,
      });
    }

  } catch (error) {
    console.error("Strategy confirmation error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ApiErrorCode.INTERNAL_ERROR,
          message: "Strategy confirmation failed",
          userMessage:
            "Strategy confirmation failed. Please try again.",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}

