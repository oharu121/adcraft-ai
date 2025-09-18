import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/video/proxy/[fileId]
 *
 * Proxy endpoint to serve Gemini API video files with proper headers
 * This handles the authentication and streaming for video playback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Construct the Gemini API file URL
    const fileUrl = `https://generativelanguage.googleapis.com/v1beta/files/${fileId}:download?alt=media`;
    
    console.log(`🎬 Proxying video request for file: ${fileId}`);

    // Fetch the video from Gemini API with proper headers
    const response = await fetch(fileUrl, {
      headers: {
        'x-goog-api-key': geminiApiKey,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch video' },
        { status: response.status }
      );
    }

    // Get the video data
    const videoData = await response.arrayBuffer();
    
    console.log(`🎬 Video proxy successful, size: ${videoData.byteLength} bytes`);

    // Return the video with appropriate headers
    return new NextResponse(videoData, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoData.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error) {
    console.error('Video proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}