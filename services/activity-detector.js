'use strict';

// ═══════════════════════════════════════════════════════════════
// WVI ACTIVITY DETECTOR — 64 Activity Types + TRIMP + HR Zones
// ═══════════════════════════════════════════════════════════════

const ACTIVITY_TYPES = {
  // Sleep (5)
  deep_sleep:       { id: 0,  cat: 'sleep',         emoji: '😴', mets: 0.9 },
  light_sleep:      { id: 1,  cat: 'sleep',         emoji: '💤', mets: 0.9 },
  rem_sleep:        { id: 2,  cat: 'sleep',         emoji: '🌙', mets: 0.9 },
  nap:              { id: 3,  cat: 'sleep',         emoji: '😪', mets: 0.9 },
  falling_asleep:   { id: 4,  cat: 'sleep',         emoji: '🥱', mets: 0.9 },
  // Rest (7)
  resting:          { id: 5,  cat: 'rest',          emoji: '🛋', mets: 1.0 },
  sitting_relaxed:  { id: 6,  cat: 'rest',          emoji: '📺', mets: 1.0 },
  sitting_working:  { id: 7,  cat: 'rest',          emoji: '💻', mets: 1.3 },
  standing:         { id: 8,  cat: 'rest',          emoji: '🧍', mets: 1.5 },
  lying_awake:      { id: 9,  cat: 'rest',          emoji: '🛏', mets: 1.0 },
  phone_scrolling:  { id: 10, cat: 'rest',          emoji: '📱', mets: 1.0 },
  watching_screen:  { id: 11, cat: 'rest',          emoji: '🎬', mets: 1.0 },
  // Walking (5)
  stroll:           { id: 12, cat: 'walking',       emoji: '🚶', mets: 2.0 },
  walk_normal:      { id: 13, cat: 'walking',       emoji: '🚶', mets: 3.3 },
  walk_brisk:       { id: 14, cat: 'walking',       emoji: '🏃‍♂️', mets: 4.5 },
  hiking:           { id: 15, cat: 'walking',       emoji: '🥾', mets: 5.5 },
  nordic_walking:   { id: 16, cat: 'walking',       emoji: '🏔', mets: 5.0 },
  // Running (5)
  jogging:          { id: 17, cat: 'running',       emoji: '🏃', mets: 7.0 },
  run_tempo:        { id: 18, cat: 'running',       emoji: '🏃‍♀️', mets: 9.0 },
  run_interval:     { id: 19, cat: 'running',       emoji: '⚡', mets: 10.5 },
  sprinting:        { id: 20, cat: 'running',       emoji: '💨', mets: 15.0 },
  trail_running:    { id: 21, cat: 'running',       emoji: '🏔', mets: 8.5 },
  // Cardio machines (4)
  cycling:          { id: 22, cat: 'cardio_machine', emoji: '🚴', mets: 7.5 },
  stationary_bike:  { id: 23, cat: 'cardio_machine', emoji: '🚲', mets: 7.0 },
  elliptical:       { id: 24, cat: 'cardio_machine', emoji: '🔄', mets: 5.5 },
  rowing:           { id: 25, cat: 'cardio_machine', emoji: '🚣', mets: 7.0 },
  // Strength (5)
  weight_training:  { id: 26, cat: 'strength',      emoji: '🏋️', mets: 5.0 },
  bodyweight:       { id: 27, cat: 'strength',      emoji: '💪', mets: 5.5 },
  crossfit:         { id: 28, cat: 'strength',      emoji: '🏋️‍♀️', mets: 10.0 },
  hiit:             { id: 29, cat: 'strength',      emoji: '⚡', mets: 12.0 },
  circuit_training: { id: 30, cat: 'strength',      emoji: '🔁', mets: 8.0 },
  // Mind-body (5)
  yoga_vinyasa:     { id: 31, cat: 'mind_body',     emoji: '🧘', mets: 3.5 },
  yoga_hot:         { id: 32, cat: 'mind_body',     emoji: '🔥', mets: 5.0 },
  pilates:          { id: 33, cat: 'mind_body',     emoji: '🤸', mets: 3.0 },
  stretching:       { id: 34, cat: 'mind_body',     emoji: '🙆', mets: 2.0 },
  meditation:       { id: 35, cat: 'mind_body',     emoji: '🕉', mets: 1.0 },
  // Sports (7)
  football:         { id: 36, cat: 'sports',        emoji: '⚽', mets: 8.0 },
  basketball:       { id: 37, cat: 'sports',        emoji: '🏀', mets: 8.0 },
  tennis:           { id: 38, cat: 'sports',        emoji: '🎾', mets: 7.0 },
  badminton:        { id: 39, cat: 'sports',        emoji: '🏸', mets: 5.5 },
  swimming:         { id: 40, cat: 'sports',        emoji: '🏊', mets: 7.0 },
  martial_arts:     { id: 41, cat: 'sports',        emoji: '🥊', mets: 8.0 },
  dancing:          { id: 42, cat: 'sports',        emoji: '💃', mets: 5.5 },
  // Daily (6)
  housework:        { id: 43, cat: 'daily',         emoji: '🧹', mets: 3.0 },
  cooking:          { id: 44, cat: 'daily',         emoji: '👨‍🍳', mets: 2.5 },
  driving:          { id: 45, cat: 'daily',         emoji: '🚗', mets: 1.5 },
  commuting:        { id: 46, cat: 'daily',         emoji: '🚌', mets: 1.3 },
  shopping:         { id: 47, cat: 'daily',         emoji: '🛍', mets: 2.5 },
  eating:           { id: 48, cat: 'daily',         emoji: '🍽', mets: 1.5 },
  // Physiological (7)
  stress_event:     { id: 49, cat: 'physiological', emoji: '😰', mets: 1.2 },
  panic_attack:     { id: 50, cat: 'physiological', emoji: '😱', mets: 1.5 },
  crying:           { id: 51, cat: 'physiological', emoji: '😢', mets: 1.2 },
  laughing:         { id: 52, cat: 'physiological', emoji: '😂', mets: 1.5 },
  pain_episode:     { id: 53, cat: 'physiological', emoji: '🤕', mets: 1.0 },
  illness:          { id: 54, cat: 'physiological', emoji: '🤒', mets: 1.0 },
  intimacy:         { id: 55, cat: 'physiological', emoji: '❤️‍🔥', mets: 2.5 },
  // Recovery (4)
  warm_up:          { id: 56, cat: 'recovery',      emoji: '🏃‍♂️', mets: 3.0 },
  cool_down:        { id: 57, cat: 'recovery',      emoji: '🧊', mets: 2.5 },
  active_recovery:  { id: 58, cat: 'recovery',      emoji: '🚶‍♂️', mets: 2.0 },
  passive_recovery: { id: 59, cat: 'recovery',      emoji: '😌', mets: 1.0 },
  // Mental (4)
  deep_work:        { id: 60, cat: 'mental',        emoji: '🧠', mets: 1.5 },
  presentation:     { id: 61, cat: 'mental',        emoji: '🎤', mets: 1.8 },
  exam:             { id: 62, cat: 'mental',        emoji: '📝', mets: 1.3 },
  creative_flow:    { id: 63, cat: 'mental',        emoji: '🎨', mets: 1.3 },
};

const LOAD_LEVELS = ['none', 'minimal', 'light', 'moderate', 'high', 'intense', 'extreme'];

// ═══ HR Zone calculator ═══

function hrZone(heartRate, restingHR, maxHR) {
  const reserve = maxHR - restingHR;
  const pct = ((heartRate - restingHR) / reserve) * 100;
  if (pct < 50) return 0;
  if (pct < 60) return 1; // Recovery
  if (pct < 70) return 2; // Fat Burn
  if (pct < 80) return 3; // Aerobic
  if (pct < 90) return 4; // Anaerobic
  return 5; // VO2max
}

// ═══ TRIMP per minute (Banister) ═══

function trimpPerMinute(heartRate, restingHR, maxHR, gender = 'male') {
  const hrPct = (heartRate - restingHR) / (maxHR - restingHR);
  const deltaHRratio = Math.max(0, hrPct - 0.5);
  const b = gender === 'male' ? 1.92 : 1.67;
  return deltaHRratio * Math.exp(b * deltaHRratio);
}

// ═══ Calories per minute ═══

function caloriesPerMinute(mets, weightKg) {
  return mets * weightKg * 3.5 / 200;
}

// ═══ Load level from HR zone ═══

function loadLevelFromZone(zone) {
  return Math.min(6, zone);
}

// ═══ Main detection ═══

function detectActivity(signals) {
  const {
    heartRate, restingHR = 65, maxHR = 186,
    hrv = 50, stress = 30, spo2 = 98, temperature = 36.5, baseTemp = 36.5,
    ppiCoherence = 0.5,
    stepsPerMin = 0, stepCadence = 0.5,
    hour = new Date().getHours(),
    sdkActivityMode = null,
    previousActivity = null,
    minutesSinceLastActivity = 30,
    shortTermHRVariance = 5,
    hrIntervalPattern = 0,
    hrRampDirection = 0,
    hrAcceleration = 0,
    breathingRegularity = 0.5,
    gender = 'male', weightKg = 75,
  } = signals;

  const zone = hrZone(heartRate, restingHR, maxHR);
  const deltaHR = heartRate - restingHR;
  const tempDelta = temperature - baseTemp;

  let result = {
    type: 'resting',
    category: 'rest',
    confidence: 0.5,
    loadLevel: 0,
    loadTarget: 'cardio',
    isEmergency: false,
    alertMessage: null,
  };

  // SDK mode override
  if (sdkActivityMode !== null && sdkActivityMode !== undefined) {
    const sdkMap = ['jogging','cycling','badminton','football','tennis','yoga_vinyasa',
      'meditation','dancing','basketball','walk_normal','weight_training','bodyweight',
      'hiking','bodyweight','tennis','jogging','bodyweight','football'];
    result.type = sdkMap[sdkActivityMode] || 'weight_training';
    result.confidence = 0.95;
  }
  // Panic attack
  else if (hrAcceleration > 20 && deltaHR > 40 && spo2 < 96 && hrv < 20 && stepsPerMin < 2) {
    result = { type: 'panic_attack', confidence: 0.88, loadLevel: 4, isEmergency: true,
      alertMessage: 'Possible panic attack. Breathe: 4s in, 7s hold, 8s out.' };
  }
  // Illness
  else if (temperature > 38.0 && deltaHR > 10 && hrv < 35 && spo2 < 96) {
    result = { type: 'illness', confidence: 0.85, loadLevel: 0, alertMessage: 'Elevated temperature + altered vitals.' };
  }
  // Sleep detection
  else if ((hour >= 21 || hour < 8) && stepsPerMin < 1 && deltaHR < 8 && stress < 30) {
    if (hrv > 55 && ppiCoherence > 0.55 && stepsPerMin === 0) {
      result = { type: 'deep_sleep', confidence: 0.90, loadLevel: 0 };
    } else if (shortTermHRVariance > 5 && ppiCoherence < 0.35 && hrv < 45) {
      result = { type: 'rem_sleep', confidence: 0.72, loadLevel: 0 };
    } else if (hrRampDirection < -0.3 && previousActivity && !previousActivity.includes('sleep')) {
      result = { type: 'falling_asleep', confidence: 0.78, loadLevel: 0 };
    } else {
      result = { type: 'light_sleep', confidence: 0.85, loadLevel: 0 };
    }
  }
  // Nap
  else if (stepsPerMin === 0 && deltaHR < 3 && stress < 15 && hrv > 50 && hour >= 12 && hour <= 16) {
    result = { type: 'nap', confidence: 0.65, loadLevel: 0 };
  }
  // High intensity (zone 4-5)
  else if (zone >= 4) {
    if (stepsPerMin > 150 && zone === 5) {
      result = { type: 'sprinting', confidence: 0.90, loadLevel: 6 };
    } else if (hrIntervalPattern > 0.7 && shortTermHRVariance > 20) {
      result = { type: 'hiit', confidence: 0.82, loadLevel: 6 };
    } else if (stepsPerMin > 130 && shortTermHRVariance < 5) {
      result = { type: 'run_tempo', confidence: 0.80, loadLevel: 5 };
    } else if (stepsPerMin > 120 && hrIntervalPattern > 0.4) {
      result = { type: 'run_interval', confidence: 0.78, loadLevel: 5 };
    } else if (stepsPerMin < 10 && hrIntervalPattern > 0.3) {
      result = { type: 'rowing', confidence: 0.50, loadLevel: 4 };
    } else if (stepsPerMin < 10) {
      result = { type: 'cycling', confidence: 0.55, loadLevel: 4 };
    } else if (stress > 50 && stepsPerMin < 30) {
      result = { type: 'martial_arts', confidence: 0.55, loadLevel: 5 };
    } else {
      result = { type: 'circuit_training', confidence: 0.50, loadLevel: 4 };
    }
  }
  // Medium intensity (zone 2-3)
  else if (zone >= 2) {
    if (stepsPerMin > 120) result = { type: 'jogging', confidence: 0.85, loadLevel: 3 };
    else if (stepsPerMin >= 90) result = { type: 'walk_brisk', confidence: 0.85, loadLevel: 3 };
    else if (stepsPerMin >= 50 && minutesSinceLastActivity > 60) result = { type: 'hiking', confidence: 0.60, loadLevel: 3 };
    else if (stepsPerMin < 10 && hrIntervalPattern > 0.4) result = { type: 'weight_training', confidence: 0.70, loadLevel: 4 };
    else if (stepsPerMin < 5 && tempDelta > 0.8 && hrv > 40) result = { type: 'yoga_hot', confidence: 0.55, loadLevel: 3 };
    else if (stepsPerMin === 0 && spo2 < 97) result = { type: 'swimming', confidence: 0.50, loadLevel: 4 };
    else if (stepsPerMin < 5 && deltaHR > 30) result = { type: 'cycling', confidence: 0.60, loadLevel: 3 };
    else if (stepsPerMin < 5 && deltaHR > 15) result = { type: 'stationary_bike', confidence: 0.55, loadLevel: 3 };
    else if (stepsPerMin >= 50) result = { type: 'walk_normal', confidence: 0.75, loadLevel: 2 };
    else if (stepsPerMin >= 20) result = { type: 'housework', confidence: 0.55, loadLevel: 2 };
    else result = { type: 'elliptical', confidence: 0.45, loadLevel: 2 };
  }
  // Meditation
  else if (hrv > 60 && stress < 12 && deltaHR < 3 && ppiCoherence > 0.60 && stepsPerMin < 1) {
    result = { type: 'meditation', confidence: 0.85, loadLevel: 1 };
  }
  // Stress event (no movement)
  else if (stress > 55 && deltaHR > 15 && stepsPerMin < 2 && hrv < 35) {
    result = { type: 'stress_event', confidence: 0.78, loadLevel: 3, loadTarget: 'mental' };
  }
  // Eating
  else if (deltaHR > 5 && deltaHR < 18 && stepsPerMin < 3 && tempDelta > 0.1 && stress < 35) {
    const mealTime = [7,8,9,12,13,14,18,19,20].includes(hour);
    if (mealTime) result = { type: 'eating', confidence: 0.55, loadLevel: 1 };
  }
  // Deep work
  else if (stress >= 25 && stress <= 50 && deltaHR > 3 && stepsPerMin === 0 && minutesSinceLastActivity > 30) {
    result = { type: 'deep_work', confidence: 0.60, loadLevel: 2, loadTarget: 'mental' };
  }
  // Creative flow
  else if (stress >= 20 && stress <= 35 && hrv > 50 && ppiCoherence > 0.50 && stepsPerMin === 0 && minutesSinceLastActivity > 45) {
    result = { type: 'creative_flow', confidence: 0.55, loadLevel: 2, loadTarget: 'mental' };
  }
  // Walking
  else if (stepsPerMin > 60) {
    result = { type: 'walk_normal', confidence: 0.82, loadLevel: 2 };
  } else if (stepsPerMin > 30) {
    result = { type: stepCadence < 0.4 ? 'shopping' : 'stroll', confidence: 0.65, loadLevel: 2 };
  } else if (stepsPerMin > 5) {
    result = { type: 'housework', confidence: 0.55, loadLevel: 2 };
  }
  // Sitting variants
  else if (stepsPerMin === 0) {
    if (stress > 25 && deltaHR > 5) result = { type: 'sitting_working', confidence: 0.70, loadLevel: 1, loadTarget: 'mental' };
    else if (stress < 20 && hrv > 50) result = { type: 'sitting_relaxed', confidence: 0.75, loadLevel: 1 };
    else result = { type: 'resting', confidence: 0.60, loadLevel: 0 };
  }

  // Enrich result
  const info = ACTIVITY_TYPES[result.type] || { cat: 'rest', emoji: '❓', mets: 1.0 };
  const mets = info.mets || 1.0;

  return {
    type: result.type,
    category: info.cat,
    emoji: info.emoji,
    confidence: result.confidence,
    loadLevel: result.loadLevel || 0,
    loadLevelName: LOAD_LEVELS[result.loadLevel || 0],
    loadScore: Math.min(100, trimpPerMinute(heartRate, restingHR, maxHR, gender) * 28.5),
    loadTarget: result.loadTarget || (info.cat === 'mental' ? 'mental' : 'cardio'),
    heartRateZone: zone,
    heartRateZoneName: ['Sub-threshold','Recovery','Fat Burn','Aerobic','Anaerobic','VO2max'][zone],
    mets,
    caloriesPerMinute: caloriesPerMinute(mets, weightKg),
    isEmergency: result.isEmergency || false,
    alertMessage: result.alertMessage || null,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { detectActivity, ACTIVITY_TYPES, LOAD_LEVELS, hrZone, trimpPerMinute, caloriesPerMinute };
