'use strict';

// ═══════════════════════════════════════════════════════════════
// WVI SCORE CALCULATOR — 10 Metrics + Adaptive Weights + Emotion Feedback
// ═══════════════════════════════════════════════════════════════

// Age-based max HRV norms (ms)
function ageBasedMaxHRV(age) {
  if (age < 30) return 74;
  if (age < 40) return 62;
  if (age < 50) return 52;
  if (age < 60) return 42;
  return 35;
}

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

// ═══ 10 Metric Normalizers (0-100) ═══

function normalizeHR(heartRate, restingHR) {
  const delta = Math.abs(heartRate - restingHR);
  return clamp(100 - delta * 2.5);
}

function normalizeHRV(hrv, age) {
  const maxHRV = ageBasedMaxHRV(age);
  return clamp((hrv / maxHRV) * 100);
}

function normalizeStress(stress) {
  // SDK stress 0-100 (0=calm, 100=stressed). Invert for WVI.
  return clamp(100 - stress);
}

function normalizeSpO2(spo2) {
  if (spo2 >= 98) return clamp(80 + (spo2 - 98) * 10);
  if (spo2 >= 95) return clamp(30 + (spo2 - 95) * 16.67);
  if (spo2 >= 90) return clamp((spo2 - 90) * 6);
  return 0;
}

function normalizeTemperature(temp, baseTemp) {
  const delta = Math.abs(temp - baseTemp);
  return clamp(100 - delta * 40);
}

function normalizeSleep(totalMinutes, deepPercent, continuity = 0.8) {
  const totalHours = totalMinutes / 60;
  const deepScore = (deepPercent >= 15 && deepPercent <= 25)
    ? 100
    : clamp(100 - Math.abs(deepPercent - 20) * 5);
  const durationScore = (totalHours >= 7 && totalHours <= 9)
    ? 100
    : clamp(100 - Math.abs(totalHours - 8) * 20);
  const contScore = continuity * 100;
  return deepScore * 0.35 + durationScore * 0.40 + contScore * 0.25;
}

function normalizeActivity(steps, activeMins, mets = 0, stepGoal = 10000) {
  const stepRatio = Math.min(1, steps / stepGoal);
  const activeMinRatio = Math.min(1, activeMins / 30);
  const metsBonus = Math.min(1, mets / 8) * 20;
  return clamp(stepRatio * 45 + activeMinRatio * 35 + metsBonus);
}

function normalizeBP(systolic, diastolic) {
  const deviation = Math.abs(systolic - 120) + Math.abs(diastolic - 80);
  return clamp(100 - deviation * 1.5);
}

function normalizePPICoherence(coherence) {
  return clamp(coherence * 100);
}

// ═══ Emotional Wellbeing Sub-Score (10th metric) ═══

const EMOTION_VALUES = {
  flow: 100, meditative: 95, joyful: 90, excited: 85, energized: 85,
  relaxed: 80, calm: 75, focused: 72, recovering: 60, drowsy: 50,
  stressed: 35, frustrated: 30, sad: 25, anxious: 20, angry: 18,
  pain: 15, fearful: 12, exhausted: 10,
};

function emotionalWellbeingScore(emotionHistory24h) {
  if (!emotionHistory24h || emotionHistory24h.length === 0) return 50;

  let totalWeighted = 0;
  let totalWeight = 0;

  for (const entry of emotionHistory24h) {
    const emotionValue = EMOTION_VALUES[entry.emotion] || 50;
    const hoursAgo = (Date.now() - new Date(entry.timestamp).getTime()) / 3600000;
    const recencyWeight = Math.exp(-hoursAgo * 0.15); // half-life ~4.6h
    const confidence = entry.confidence || 0.5;

    totalWeighted += emotionValue * confidence * recencyWeight;
    totalWeight += confidence * recencyWeight;
  }

  return totalWeight > 0 ? totalWeighted / totalWeight : 50;
}

// ═══ Emotion → WVI Feedback Multiplier ═══

const EMOTION_MULTIPLIERS = {
  flow: 1.12, meditative: 1.10, joyful: 1.08, excited: 1.06, energized: 1.05,
  relaxed: 1.04, calm: 1.02, focused: 1.03, recovering: 1.00, drowsy: 0.97,
  stressed: 0.95, frustrated: 0.93, sad: 0.91, anxious: 0.88, angry: 0.87,
  pain: 0.86, fearful: 0.85, exhausted: 0.85,
};

function applyEmotionFeedback(rawWVI, emotion, confidence = 0.7) {
  const multiplier = EMOTION_MULTIPLIERS[emotion] || 1.0;
  const adjusted = 1.0 + (multiplier - 1.0) * confidence;
  return clamp(rawWVI * adjusted);
}

// ═══ Main WVI Calculator ═══

function calculateWVI(metrics, norms, context = {}) {
  const {
    heartRate, hrv, stress, spo2, temperature,
    systolicBP = 120, diastolicBP = 80,
    ppiCoherence = 0.5,
    totalSleepMinutes = 420, deepSleepPercent = 20, sleepContinuity = 0.8,
    steps = 5000, activeMinutes = 30, mets = 0,
  } = metrics;

  const { restingHR = 65, baseTemp = 36.5, age = 30, stepGoal = 10000 } = norms;
  const { hour = new Date().getHours(), isExercising = false, currentEmotion = 'calm',
          emotionConfidence = 0.5, emotionHistory24h = [] } = context;

  // Normalize all 10 metrics
  const scores = {
    heartRateScore:          normalizeHR(heartRate, restingHR),
    hrvScore:                normalizeHRV(hrv, age),
    stressScore:             normalizeStress(stress),
    spo2Score:               normalizeSpO2(spo2),
    temperatureScore:        normalizeTemperature(temperature, baseTemp),
    sleepScore:              normalizeSleep(totalSleepMinutes, deepSleepPercent, sleepContinuity),
    activityScore:           normalizeActivity(steps, activeMinutes, mets, stepGoal),
    bpScore:                 normalizeBP(systolicBP, diastolicBP),
    ppiCoherenceScore:       normalizePPICoherence(ppiCoherence),
    emotionalWellbeingScore: emotionalWellbeingScore(emotionHistory24h),
  };

  // Adaptive weights by time of day
  let weights = {
    heartRateScore: 0.09, hrvScore: 0.18, stressScore: 0.15, spo2Score: 0.09,
    temperatureScore: 0.05, sleepScore: 0.13, activityScore: 0.08,
    bpScore: 0.06, ppiCoherenceScore: 0.05, emotionalWellbeingScore: 0.12,
  };

  // Night: sleep matters more
  if (hour >= 22 || hour < 6) {
    weights.sleepScore = 0.25; weights.temperatureScore = 0.08; weights.activityScore = 0.03;
    weights.hrvScore = 0.20; weights.stressScore = 0.16; weights.emotionalWellbeingScore = 0.08;
    weights.heartRateScore = 0.06; weights.spo2Score = 0.06; weights.bpScore = 0.04; weights.ppiCoherenceScore = 0.04;
  }
  // Morning: HRV and recovery critical
  else if (hour >= 6 && hour < 10) {
    weights.hrvScore = 0.28; weights.sleepScore = 0.18; weights.stressScore = 0.15;
    weights.activityScore = 0.05; weights.emotionalWellbeingScore = 0.10;
    weights.heartRateScore = 0.06; weights.spo2Score = 0.06; weights.temperatureScore = 0.04;
    weights.bpScore = 0.04; weights.ppiCoherenceScore = 0.04;
  }
  // Work day: stress and focus matter
  else if (hour >= 10 && hour < 18) {
    weights.stressScore = 0.22; weights.hrvScore = 0.20; weights.activityScore = 0.12;
    weights.emotionalWellbeingScore = 0.12; weights.sleepScore = 0.08;
    weights.heartRateScore = 0.06; weights.spo2Score = 0.06; weights.temperatureScore = 0.04;
    weights.bpScore = 0.05; weights.ppiCoherenceScore = 0.05;
  }

  // Exercise override
  if (isExercising) {
    weights.heartRateScore = 0.05; weights.activityScore = 0.15; weights.spo2Score = 0.15;
  }

  // Normalize weights to sum = 1
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0);

  // Weighted sum
  let rawWVI = 0;
  for (const [key, score] of Object.entries(scores)) {
    rawWVI += score * (weights[key] / totalW);
  }

  // Emotion feedback loop
  const finalWVI = applyEmotionFeedback(rawWVI, currentEmotion, emotionConfidence);

  // Level
  let level;
  if (finalWVI >= 95) level = 'superb';
  else if (finalWVI >= 85) level = 'excellent';
  else if (finalWVI >= 70) level = 'good';
  else if (finalWVI >= 55) level = 'moderate';
  else if (finalWVI >= 40) level = 'attention';
  else if (finalWVI >= 25) level = 'critical';
  else level = 'dangerous';

  return {
    wviScore: +finalWVI.toFixed(1),
    level,
    metrics: Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, +v.toFixed(1)])
    ),
    weights: Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, +(v / totalW).toFixed(3)])
    ),
    emotionFeedback: {
      emotion: currentEmotion,
      multiplier: EMOTION_MULTIPLIERS[currentEmotion] || 1.0,
      rawWVI: +rawWVI.toFixed(1),
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  calculateWVI,
  normalizeHR, normalizeHRV, normalizeStress, normalizeSpO2,
  normalizeTemperature, normalizeSleep, normalizeActivity,
  normalizeBP, normalizePPICoherence, emotionalWellbeingScore,
  applyEmotionFeedback, ageBasedMaxHRV, EMOTION_VALUES, EMOTION_MULTIPLIERS,
};
