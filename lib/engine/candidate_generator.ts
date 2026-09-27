import { Scene, PresetConfig, ClipScoreBreakdown } from '@/types';

export interface CandidateSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  scores: ClipScoreBreakdown;
  reason: string;
  hookScore: number;
  actionScore: number;
  overallScore: number;
}

/**
 * Builds candidate short-form video intervals aligned with natural scene cuts and motion peaks.
 */
export function generateCandidateSegments(
  scenes: Scene[],
  totalDuration: number,
  targetDuration: number,
  preset: PresetConfig,
  minDuration = 8,
  maxDuration = 60
): CandidateSegment[] {
  const candidates: CandidateSegment[] = [];
  if (scenes.length === 0 || totalDuration < minDuration) {
    return candidates;
  }

  // 1. Scene-aligned window sliding
  // Group adjacent scenes until cumulative duration ~ targetDuration
  for (let i = 0; i < scenes.length; i++) {
    const startScene = scenes[i];
    const candidateStart = startScene.startTime;
    let candidateEnd = startScene.endTime;
    let includedScenes: Scene[] = [startScene];

    for (let j = i + 1; j < scenes.length; j++) {
      const nextScene = scenes[j];
      const newDuration = nextScene.endTime - candidateStart;

      if (newDuration > targetDuration + 3) {
        break;
      }

      includedScenes.push(nextScene);
      candidateEnd = nextScene.endTime;

      if (newDuration >= targetDuration - 2) {
        break;
      }
    }

    let clipDuration = candidateEnd - candidateStart;

    // If shorter than minDuration, expand to targetDuration if video permits
    if (clipDuration < minDuration) {
      candidateEnd = Math.min(totalDuration, candidateStart + targetDuration);
      clipDuration = candidateEnd - candidateStart;
    }

    if (clipDuration < minDuration || clipDuration > maxDuration) {
      continue;
    }

    // 2. Compute Hook Score (activity in the first 1-3 seconds)
    const hookScene = includedScenes[0] || startScene;
    const hookActivity = (hookScene.motionScore || 50) * 0.6 + (hookScene.audioScore || 50) * 0.4;
    const hookScore = Math.min(99, Math.max(30, Math.round(hookActivity)));

    // 3. Aggregate Action, Visual, and Audio
    const avgMotion = includedScenes.reduce((acc, s) => acc + (s.motionScore || 50), 0) / includedScenes.length;
    const avgAction = includedScenes.reduce((acc, s) => acc + (s.actionScore || 50), 0) / includedScenes.length;
    const avgAudio = includedScenes.reduce((acc, s) => acc + (s.audioScore || 50), 0) / includedScenes.length;
    const avgFace = includedScenes.reduce((acc, s) => acc + (s.faceScore || 50), 0) / includedScenes.length;

    const visualScore = Math.round((avgMotion + avgAction) / 2);
    const actionScore = Math.round(avgAction);
    const audioScore = Math.round(avgAudio);

    // 4. Weighted formula using preset config
    const weights = preset.weights;
    const rawScore = 
      (visualScore * weights.visualActivity) +
      (actionScore * weights.actionScore) +
      (audioScore * weights.audioEnergy) +
      (avgFace * weights.facePresence) +
      (hookScore * weights.hookStrength) +
      (visualScore * weights.sceneImportance);

    const overallScore = Math.min(99, Math.max(40, Math.round(rawScore)));

    // 5. Generate deterministic explanation
    const reasons: string[] = [];
    if (actionScore >= 75) reasons.push('High Anime Combat/Motion');
    if (hookScore >= 75) reasons.push('Instant Opening Hook');
    if (audioScore >= 75) reasons.push('Peak Audio Energy / Soundtrack');
    if (avgFace >= 70) reasons.push('Character Focus');
    if (reasons.length === 0) reasons.push('Balanced Scene Sequence');

    candidates.push({
      id: `candidate_${i + 1}`,
      startTime: Math.round(candidateStart * 100) / 100,
      endTime: Math.round(candidateEnd * 100) / 100,
      duration: Math.round(clipDuration * 100) / 100,
      scores: {
        overall: overallScore,
        action: actionScore,
        hook: hookScore,
        visual: visualScore,
        audio: audioScore,
      },
      reason: reasons.join(' + '),
      hookScore,
      actionScore,
      overallScore,
    });
  }

  return candidates;
}
