# AnimeClips AI — Media Pipeline Documentation

## Pipeline Workflow

The media pipeline executes across 8 discrete stages:

```
Long Video
   ↓
1. probing_media (FFprobe extracts duration, resolution, codecs, fps)
   ↓
2. detecting_scenes (FFmpeg shot transition detection)
   ↓
3. analyzing_motion (Inter-frame variance & action intensity calculation)
   ↓
4. analyzing_audio (Volume energy, dialogue, and soundtrack detection)
   ↓
5. transcribing (Speech-to-text integration or graceful fallback)
   ↓
6. scoring_candidates (Weighted multi-signal scoring per preset)
   ↓
7. selecting_clips (Deduplication, non-overlap, and ranking)
   ↓
8. rendering_video (9:16 vertical crop/blur/mirror render & FFprobe validation)
```

## Scoring Formula
Candidate short intervals are scored using a configurable weighted formula:

```ts
score =
  visualActivity * weights.visualActivity +
  actionScore * weights.actionScore +
  audioEnergy * weights.audioEnergy +
  speechScore * weights.speechScore +
  facePresence * weights.facePresence +
  sceneImportance * weights.sceneImportance +
  hookStrength * weights.hookStrength
```

## Vertical 9:16 Reframing Modes
- **Smart Crop**: Calculates the optimal horizontal window `(w - 608) / 2` and crops 608x1080 from a 1920x1080 frame, scaling to 1080x1920.
- **Blur Background**: Duplicates the stream with `split`. The background is scaled and blurred with `boxblur=25:5`, with the sharp original centered on top.
- **Mirror Background**: Mirrored edges with `hflip` and blur.
- **Letterbox Fit**: Preserves the complete original frame with black padding.
