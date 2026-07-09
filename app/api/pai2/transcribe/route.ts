/**
 * PAI2 Audio Transcription API Route
 *
 * POST /api/pai2/transcribe
 *
 * Accepts audio file uploads and transcribes them using Groq Whisper.
 */

import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { isAIError } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const { isAuthenticated } = getKindeServerSession();
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/m4a",
      "audio/flac",
    ];

    if (!allowedTypes.some((t) => file.type.startsWith(t.split("/")[0]))) {
      return NextResponse.json(
        { error: "Unsupported audio format. Supported: MP3, WAV, WebM, OGG, M4A, FLAC" },
        { status: 400 }
      );
    }

    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum 25MB." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Transcription service not configured" },
        { status: 500 }
      );
    }

    // Send to Groq Whisper
    const whisperForm = new FormData();
    whisperForm.append("file", file);
    whisperForm.append("model", "whisper-large-v3-turbo");
    // Don't set language — let Whisper auto-detect for best accuracy

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperForm,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[PAI2 Transcribe Error]", response.status, errorText);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Transcription rate limit reached. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Transcription failed. Please try again." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (err) {
    console.error("[PAI2 Transcribe Error]", err);
    return NextResponse.json(
      { error: "Transcription service error" },
      { status: 500 }
    );
  }
}
