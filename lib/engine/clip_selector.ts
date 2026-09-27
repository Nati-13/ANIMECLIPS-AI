import { Clip } from '@/types';
import { CandidateSegment } from './candidate_generator';

export interface SelectionOptions {
  numberOfClips: number | 'auto';
  actionIntensity: number; // 0 - 100
  sceneDiversity: number; // 0 - 100
  prioritizeHook: boolean;
  maxOverlapSeconds?: number;
}

/**
 * Selects the highest quality, non-redundant clips from the candidate pool.
 */
export function selectBestClips(
  candidates: CandidateSegment[],
  projectId: string,
  options: SelectionOptions
): Clip[] {
  if (candidates.length === 0) return [];

  // Sort candidates primarily by overall score, boosting action/hook according to user options
  const scored = candidates.map((cand) => {
    let effectiveScore = cand.overallScore;

    // Weight action intensity slider
    const actionWeight = options.actionIntensity / 100;
    effectiveScore = (effectiveScore * 0.6) + (cand.actionScore * 0.4 * actionWeight);

    // Opening hook priority
    if (options.prioritizeHook && cand.hookScore >= 70) {
      effectiveScore += 5;
    }

    return {
      ...cand,
      effectiveScore: Math.min(99, Math.round(effectiveScore)),
    };
  });

  // Sort descending
  scored.sort((a, b) => b.effectiveScore - a.effectiveScore);

  const targetCount = options.numberOfClips === 'auto' 
    ? Math.min(6, Math.max(2, Math.floor(candidates.length / 2)))
    : options.numberOfClips;

  const overlapLimit = options.maxOverlapSeconds ?? Math.max(3, (100 - options.sceneDiversity) * 0.2);
  const selected: CandidateSegment[] = [];

  for (const cand of scored) {
    if (selected.length >= targetCount) break;

    // Check overlap with previously chosen clips
    let hasExcessiveOverlap = false;
    for (const prev of selected) {
      const overlapStart = Math.max(cand.startTime, prev.startTime);
      const overlapEnd = Math.min(cand.endTime, prev.endTime);
      const overlapDuration = Math.max(0, overlapEnd - overlapStart);

      if (overlapDuration > overlapLimit) {
        hasExcessiveOverlap = true;
        break;
      }
    }

    if (!hasExcessiveOverlap) {
      selected.push(cand);
    }
  }

  // If strict non-overlap was too restrictive and we have fewer than targetCount, allow next best
  if (selected.length < targetCount) {
    for (const cand of scored) {
      if (selected.length >= targetCount) break;
      if (!selected.some((s) => s.id === cand.id)) {
        selected.push(cand);
      }
    }
  }

  // Sort selected clips chronologically by start time
  selected.sort((a, b) => a.startTime - b.startTime);

  return selected.map((cand, idx) => ({
    id: `clip_${Date.now()}_${idx + 1}`,
    projectId,
    sceneStart: cand.startTime,
    sceneEnd: cand.endTime,
    duration: cand.duration,
    score: cand.overallScore,
    hookScore: cand.hookScore,
    actionScore: cand.actionScore,
    status: 'ready',
    reason: cand.reason,
    scores: cand.scores,
    createdAt: new Date().toISOString(),
  }));
}
