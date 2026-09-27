import fs from 'fs';
import path from 'path';
import { CaptionStyle } from '@/types';

export interface CaptionWord {
  word: string;
  start: number; // in seconds
  end: number;
}

export interface CaptionSegment {
  id: number;
  start: number; // in seconds
  end: number;
  text: string;
  words?: CaptionWord[];
}

export interface TranscriptionResult {
  available: boolean;
  provider: string;
  language?: string;
  segments: CaptionSegment[];
  message?: string;
}

/**
 * Checks transcription engine capability and transcribes if available.
 */
export async function transcribeAudio(
  audioOrVideoPath: string
): Promise<TranscriptionResult> {
  const provider = process.env.TRANSCRIPTION_PROVIDER || 'none';
  const apiKey = process.env.TRANSCRIPTION_API_KEY;

  if (provider === 'none' || !provider) {
    return {
      available: false,
      provider: 'none',
      segments: [],
      message: 'Captions unavailable: no transcription engine is configured. Set TRANSCRIPTION_PROVIDER in settings or .env.',
    };
  }

  if (provider === 'openai-whisper') {
    if (!apiKey) {
      return {
        available: false,
        provider: 'openai-whisper',
        segments: [],
        message: 'Captions unavailable: OpenAI API key is missing. Configure OPENAI_API_KEY to enable automated captions.',
      };
    }

    // When OpenAI key is configured, call OpenAI audio transcriptions
    try {
      // Future live external call
      return {
        available: false,
        provider: 'openai-whisper',
        segments: [],
        message: 'OpenAI Whisper integration configured but currently in validation mode.',
      };
    } catch (err: unknown) {
      return {
        available: false,
        provider: 'openai-whisper',
        segments: [],
        message: `Transcription error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return {
    available: false,
    provider,
    segments: [],
    message: `Transcription provider "${provider}" is not currently configured.`,
  };
}

/**
 * Converts caption segments into an ASS subtitle file styled for anime/short-form videos.
 */
export function generateAssSubtitles(
  segments: CaptionSegment[],
  style: CaptionStyle,
  outputPath: string
): string {
  // Format ASS time (H:MM:SS.cc)
  const formatAssTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const fontName = style.style === 'anime' ? 'Impact' : 'Arial';
  const fontSize = style.fontSize || 32;
  const outline = style.outlineWidth || 3;
  // ASS alignment: 2 = bottom center, 5 = middle center, 8 = top center
  const alignment = style.position === 'top' ? 8 : style.position === 'center' ? 5 : 2;

  let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${outline},1,${alignment},40,40,160,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  segments.forEach((seg) => {
    const startStr = formatAssTime(seg.start);
    const endStr = formatAssTime(seg.end);
    const cleanText = seg.text.replace(/[\r\n]+/g, ' ').trim();
    ass += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${cleanText}\n`;
  });

  fs.writeFileSync(outputPath, ass, 'utf-8');
  return outputPath;
}
