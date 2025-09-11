import { NextRequest, NextResponse } from "next/server";
import { AppModeConfig } from "@/lib/config/app-mode";

/**
 * Get current mode status
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Debug endpoints disabled in production" }, { status: 403 });
  }

  try {
    AppModeConfig.switchMode();
    const modeInfo = AppModeConfig.getModeInfo();

    return NextResponse.json({
      success: true,
      data: {
        currentMode: modeInfo.mode,
        displayName: modeInfo.displayName,
        description: modeInfo.description,
        canSwitch: AppModeConfig.canSwitchMode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Mode switch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to switch mode",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
