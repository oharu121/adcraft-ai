/**
 * Debug Mode Toggle API
 *
 * Development-only endpoint for switching between demo and real modes.
 * Disabled in production for security.
 */

import { NextRequest, NextResponse } from "next/server";
import { AppModeConfig } from "@/lib/config/app-mode";

/**
 * Get current mode status
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Debug endpoints disabled in production" }, { status: 403 });
  }

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
}

// /**
//  * Switch application mode
//  */
// export async function POST(request: NextRequest) {
//   if (process.env.NODE_ENV === "production") {
//     return NextResponse.json({ error: "Mode switching disabled in production" }, { status: 403 });
//   }

//   try {
//     const body = await request.json();
//     const { mode } = body;

//     if (!mode || !["demo", "real"].includes(mode)) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Invalid mode. Must be "demo" or "real"',
//         },
//         { status: 400 }
//       );
//     }

//     // Switch the mode
//     AppModeConfig.setMode(mode);
//     const newModeInfo = AppModeConfig.getModeInfo();

//     return NextResponse.json({
//       success: true,
//       data: {
//         previousMode: mode === "demo" ? "real" : "demo",
//         currentMode: newModeInfo.mode,
//         displayName: newModeInfo.displayName,
//         description: newModeInfo.description,
//         timestamp: Date.now(),
//       },
//       message: `Successfully switched to ${newModeInfo.displayName}`,
//     });
//   } catch (error) {
//     console.error("Mode switch error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to switch mode",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
