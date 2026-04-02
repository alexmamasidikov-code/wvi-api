'use strict';

// ═══════════════════════════════════════════════════════════════
// WVI EMOTION ENGINE — 18 Emotions via Fuzzy Logic Cascade
// ═══════════════════════════════════════════════════════════════

const EMOTIONS = {
  // Positive (5)
  calm:       { id: 0,  category: 'positive',      emoji: '😌', label: 'Calm' },
  relaxed:    { id: 1,  category: 'positive',      emoji: '🧘', label: 'Relaxed' },
  joyful:     { id: 2,  category: 'positive',      emoji: '😊', label: 'Joyful' },
  energized:  { id: 3,  category: 'positive',      emoji: '⚡', label: 'Energized' },
  excited:    { id: 4,  category: 'positive',      emoji: '🎉', label: 'Excited' },
  // Neutral (4)
  focused:    { id: 5,  category: 'neutral',       emoji: '🎯', label: 'Focused' },
  meditative: { id: 6,  category: 'neutral',       emoji: '🕉', label: 'Meditative' },
  recovering: { id: 7,  category: 'neutral',       emoji: '🔄', label: 'Recovering' },
  drowsy:     { id: 8,  category: 'neutral',       emoji: '😴', label: 'Drowsy' },
  // Negative (7)
  stressed:   { id: 9,  category: 'negative',      emoji: '😰', label: 'Stressed' },
  anxious:    { id: 10, category: 'negative',      emoji: '😱', label: 'Anxious' },
  angry:      { id: 11, category: 'negative',      emoji: '😤', label: 'Angry' },
  frustrated: { id: 12, category: 'negative',      emoji: '😣', label: 'Frustrated' },
  fearful:    { id: 13, category: 'negative',      emoji: '😨', label: 'Fearful' },
  sad:        { id: 14, category: 'negative',      emoji: '😔', label: 'Sad' },
  exhausted:  { id: 15, category: 'negative',      emoji: '😩', label: 'Exhausted' },
  // Physiological (2)
  pain:       { id: 16, category: 'physiological', emoji: '🤕', label: 'Pain/Discomfort' },
  flow:       { id: 17, category: 'physiological', emoji: '🌊', label: 'Flow State' },
};

// ═══ Fuzzy math functions ═══

function sigmoid(x, midpoint, steepness) {
  return 1.0 / (1.0 + Math.exp(-steepness * (x - midpoint)));
}

function sigmoidInverse(x, midpoint, steepness) {
  return 1.0 / (1.0 + Math.exp(steepness * (x - midpoint)));
}

function bellCurve(x, center, width) {
  return Math.exp(-Math.pow(x - center, 2) / (2 * Math.pow(width, 2)));
}

function clamp(val, min = 0, max = 1) {
  return Math.max(min, Math.min(max, val));
}

// ═══ Main detection ═══

function detectEmotion(metrics, norms, options = {}) {
  const {
    heartRate, hrv, stress, spo2, temperature,
    ppiCoherence = 0.5, ppiRMSSD = 30,
    sleepScore = 50, activityScore = 50,
    systolicBP = 120,
  } = metrics;

  const restingHR = norms.restingHR || 65;
  const baseTemp = norms.baseTemp || 36.5;
  const deltaHR = heartRate - restingHR;
  const tempDelta = temperature - baseTemp;
  const hrvTrend = options.hrvTrend || 'stable'; // 'rising', 'falling', 'stable'
  const hrAcceleration = options.hrAcceleration || 0;
  const timeOfDay = options.hour || new Date().getHours();

  const candidates = [];

  // ── ANGRY ──
  {
    let s = 1;
    s *= sigmoid(stress, 65, 0.15);
    s *= sigmoid(deltaHR, 22, 0.12);
    s *= sigmoidInverse(hrv, 38, 0.10);
    s *= sigmoid(systolicBP, 130, 0.08);
    s *= sigmoidInverse(ppiCoherence, 0.35, 8.0);
    s *= sigmoid(tempDelta, 0.2, 5.0);
    candidates.push({ emotion: 'angry', score: s, weight: 1.0 });
  }

  // ── ANXIOUS ──
  {
    let s = 1;
    s *= sigmoid(stress, 68, 0.12);
    s *= sigmoidInverse(hrv, 32, 0.10);
    s *= sigmoid(deltaHR, 12, 0.10);
    s *= sigmoidInverse(ppiCoherence, 0.28, 8.0);
    s *= sigmoidInverse(spo2, 97.5, 2.0);
    s *= sigmoidInverse(systolicBP, 132, 0.05);
    candidates.push({ emotion: 'anxious', score: s, weight: 0.95 });
  }

  // ── FEARFUL ──
  {
    let s = 1;
    s *= sigmoid(hrAcceleration, 15, 0.15);
    s *= sigmoidInverse(hrv, 28, 0.12);
    s *= sigmoidInverse(spo2, 96, 2.0);
    s *= sigmoid(stress, 60, 0.10);
    s *= sigmoidInverse(ppiCoherence, 0.20, 10.0);
    candidates.push({ emotion: 'fearful', score: s, weight: 0.90 });
  }

  // ── STRESSED ──
  {
    let s = 1;
    s *= sigmoid(stress, 48, 0.10);
    s *= sigmoidInverse(hrv, 52, 0.08);
    s *= sigmoid(deltaHR, 6, 0.12);
    candidates.push({ emotion: 'stressed', score: s, weight: 0.85 });
  }

  // ── SAD ──
  {
    let s = 1;
    s *= sigmoidInverse(hrv, 47, 0.08);
    s *= sigmoidInverse(deltaHR, 6, 0.15);
    s *= bellCurve(stress, 40, 20);
    s *= sigmoidInverse(activityScore, 35, 0.08);
    s *= sigmoidInverse(sleepScore, 55, 0.06);
    s *= sigmoidInverse(ppiCoherence, 0.42, 6.0);
    s *= sigmoidInverse(tempDelta, 0.1, 5.0);
    candidates.push({ emotion: 'sad', score: s, weight: 0.80 });
  }

  // ── FRUSTRATED ──
  {
    let s = 1;
    const hrVariance = options.shortTermHRVariance || 5;
    s *= sigmoid(stress, 45, 0.08);
    s *= sigmoid(hrVariance, 8, 0.15);
    s *= sigmoidInverse(hrv, 48, 0.08);
    s *= bellCurve(systolicBP, 125, 15);
    s *= bellCurve(deltaHR, 10, 12);
    candidates.push({ emotion: 'frustrated', score: s, weight: 0.76 });
  }

  // ── EXHAUSTED ──
  {
    let s = 1;
    s *= sigmoidInverse(sleepScore, 42, 0.08);
    s *= sigmoid(stress, 32, 0.08);
    s *= sigmoidInverse(hrv, 42, 0.08);
    s *= sigmoidInverse(spo2, 96.5, 1.5);
    s *= sigmoidInverse(activityScore, 28, 0.10);
    s *= sigmoidInverse(deltaHR, 5, 0.15);
    s *= sigmoidInverse(ppiRMSSD, 22, 0.15);
    candidates.push({ emotion: 'exhausted', score: s, weight: 0.88 });
  }

  // ── PAIN ──
  {
    let s = 1;
    s *= sigmoid(deltaHR, 10, 0.10);
    s *= sigmoid(stress, 45, 0.08);
    s *= sigmoidInverse(hrv, 40, 0.08);
    s *= sigmoid(tempDelta, 0.3, 4.0);
    s *= sigmoidInverse(activityScore, 20, 0.10);
    s *= sigmoidInverse(ppiCoherence, 0.35, 6.0);
    const notExercising = activityScore < 30 ? 1.0 : 0.1;
    s *= notExercising;
    candidates.push({ emotion: 'pain', score: s, weight: 0.82 });
  }

  // ── RECOVERING ──
  {
    let s = 1;
    const trendBonus = hrvTrend === 'rising' ? 1.0 : 0.2;
    s *= trendBonus;
    s *= bellCurve(stress, 30, 20);
    s *= sigmoid(sleepScore, 42, 0.06);
    s *= sigmoidInverse(deltaHR, 12, 0.10);
    s *= sigmoid(ppiCoherence, 0.32, 5.0);
    candidates.push({ emotion: 'recovering', score: s, weight: 0.75 });
  }

  // ── FOCUSED ──
  {
    let s = 1;
    s *= bellCurve(hrv, 52, 22);
    s *= bellCurve(stress, 32, 15);
    s *= bellCurve(deltaHR, 10, 8);
    s *= sigmoid(ppiCoherence, 0.42, 6.0);
    s *= sigmoidInverse(activityScore, 52, 0.06);
    s *= sigmoid(spo2, 95.5, 1.5);
    candidates.push({ emotion: 'focused', score: s, weight: 0.78 });
  }

  // ── FLOW ──
  {
    let s = 1;
    s *= bellCurve(hrv, 55, 15);
    s *= bellCurve(stress, 32, 10);
    s *= bellCurve(deltaHR, 8, 6);
    s *= sigmoid(ppiCoherence, 0.55, 7.0);
    s *= sigmoid(spo2, 96.5, 1.5);
    candidates.push({ emotion: 'flow', score: s, weight: 0.85 });
  }

  // ── MEDITATIVE ──
  {
    let s = 1;
    s *= sigmoid(hrv, 65, 0.10);
    s *= sigmoidInverse(stress, 12, 0.15);
    s *= sigmoidInverse(deltaHR, 3, 0.20);
    s *= sigmoid(ppiCoherence, 0.65, 8.0);
    s *= sigmoidInverse(activityScore, 15, 0.12);
    s *= sigmoid(spo2, 97, 1.5);
    candidates.push({ emotion: 'meditative', score: s, weight: 0.88 });
  }

  // ── DROWSY ──
  {
    let s = 1;
    s *= sigmoidInverse(deltaHR, 2, 0.15);
    s *= sigmoidInverse(hrv, 45, 0.06);
    s *= sigmoidInverse(tempDelta, -0.1, 4.0);
    s *= sigmoidInverse(activityScore, 10, 0.15);
    s *= sigmoidInverse(stress, 25, 0.08);
    const drowsyBonus = (timeOfDay >= 13 && timeOfDay <= 16) || timeOfDay >= 22 ? 1.0 : 0.6;
    s *= drowsyBonus;
    candidates.push({ emotion: 'drowsy', score: s, weight: 0.74 });
  }

  // ── JOYFUL ──
  {
    let s = 1;
    s *= sigmoid(hrv, 52, 0.08);
    s *= sigmoidInverse(stress, 32, 0.10);
    s *= bellCurve(deltaHR, 12, 10);
    s *= sigmoid(ppiCoherence, 0.52, 6.0);
    s *= sigmoid(spo2, 96.5, 1.5);
    s *= sigmoid(sleepScore, 52, 0.05);
    s *= sigmoid(activityScore, 38, 0.05);
    s *= sigmoid(tempDelta, -0.1, 3.0);
    candidates.push({ emotion: 'joyful', score: s, weight: 0.72 });
  }

  // ── EXCITED ──
  {
    let s = 1;
    s *= sigmoid(hrv, 55, 0.10);
    s *= sigmoidInverse(stress, 25, 0.10);
    s *= sigmoid(deltaHR, 18, 0.10);
    s *= sigmoid(ppiCoherence, 0.50, 6.0);
    s *= sigmoid(spo2, 96.5, 1.5);
    s *= sigmoid(activityScore, 50, 0.05);
    s *= sigmoid(tempDelta, 0.15, 4.0);
    candidates.push({ emotion: 'excited', score: s, weight: 0.73 });
  }

  // ── ENERGIZED ──
  {
    let s = 1;
    s *= sigmoid(hrv, 48, 0.08);
    s *= sigmoidInverse(stress, 38, 0.08);
    s *= sigmoid(deltaHR, 8, 0.10);
    s *= sigmoid(activityScore, 65, 0.06);
    s *= sigmoid(spo2, 95.5, 1.5);
    s *= sigmoid(sleepScore, 48, 0.04);
    s *= sigmoid(ppiCoherence, 0.38, 5.0);
    candidates.push({ emotion: 'energized', score: s, weight: 0.80 });
  }

  // ── RELAXED ──
  {
    let s = 1;
    s *= sigmoid(hrv, 58, 0.08);
    s *= sigmoidInverse(stress, 27, 0.10);
    s *= sigmoidInverse(deltaHR, 9, 0.12);
    s *= sigmoid(sleepScore, 58, 0.05);
    s *= sigmoid(ppiCoherence, 0.48, 6.0);
    s *= sigmoid(spo2, 96.5, 1.5);
    s *= sigmoidInverse(activityScore, 52, 0.05);
    candidates.push({ emotion: 'relaxed', score: s, weight: 0.85 });
  }

  // ── CALM (default) ──
  {
    let s = 1;
    s *= sigmoid(hrv, 48, 0.06);
    s *= sigmoidInverse(stress, 32, 0.08);
    s *= sigmoidInverse(Math.abs(deltaHR), 12, 0.10);
    s *= sigmoid(spo2, 95.5, 1.0);
    s *= sigmoid(ppiCoherence, 0.38, 4.0);
    candidates.push({ emotion: 'calm', score: s, weight: 0.70 });
  }

  // ═══ Rank by weighted score ═══
  candidates.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));

  // Temporal smoothing
  const prevEmotion = options.previousEmotion;
  const prevTimestamp = options.previousTimestamp;
  if (prevEmotion && prevTimestamp) {
    const elapsed = (Date.now() - new Date(prevTimestamp).getTime()) / 1000;
    if (elapsed < 300 && candidates[0].emotion !== prevEmotion) {
      const prevCand = candidates.find(c => c.emotion === prevEmotion);
      if (prevCand) {
        const topW = candidates[0].score * candidates[0].weight;
        const prevW = prevCand.score * prevCand.weight;
        if (topW < prevW * 1.3) {
          // Stay on previous emotion
          const idx = candidates.indexOf(prevCand);
          if (idx > 0) {
            candidates.splice(idx, 1);
            candidates.unshift(prevCand);
          }
        }
      }
    }
  }

  const primary = candidates[0];
  const secondary = candidates[1] || primary;
  const info = EMOTIONS[primary.emotion] || {};

  return {
    primary: primary.emotion,
    primaryConfidence: clamp(primary.score * primary.weight),
    secondary: secondary.emotion,
    secondaryConfidence: clamp(secondary.score * secondary.weight),
    emoji: info.emoji || '❓',
    category: info.category || 'unknown',
    label: info.label || primary.emotion,
    allScores: candidates.slice(0, 5).map(c => ({
      emotion: c.emotion,
      score: +((c.score * c.weight)).toFixed(4),
    })),
    timestamp: new Date().toISOString(),
  };
}

module.exports = { detectEmotion, EMOTIONS, sigmoid, sigmoidInverse, bellCurve };
