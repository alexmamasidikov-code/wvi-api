'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// ── Real WVI algorithm engines ──
const { detectEmotion } = require('./services/emotion-engine');
const { calculateWVI } = require('./services/wvi-calculator');
const { detectActivity } = require('./services/activity-detector');

const app = express();
const PORT = process.env.PORT || 8080;

// ── Privy Auth middleware ──
const PRIVY_APP_ID = process.env.PRIVY_APP_ID || '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || '';

async function privyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  if (PRIVY_APP_ID && PRIVY_APP_SECRET) {
    try {
      const resp = await fetch('https://auth.privy.io/api/v1/token/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'privy-app-id': PRIVY_APP_ID,
          'Authorization': `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64')}`,
        },
        body: JSON.stringify({ token }),
      });
      if (!resp.ok) return res.status(401).json({ error: 'Privy token verification failed' });
      const data = await resp.json();
      req.user = { id: data.user_id || data.sub, privyUser: data };
    } catch (err) {
      return res.status(401).json({ error: 'Privy auth error: ' + err.message });
    }
  } else {
    req.user = { id: 'usr_dev_001', email: 'dev@wvi.health' };
  }
  next();
}

app.use('/api/v1', (req, res, next) => {
  const publicPaths = ['/auth/', '/health/', '/docs', '/documentation'];
  if (publicPaths.some(p => req.path.startsWith(p))) return next();
  return privyAuth(req, res, next);
});

// ── Middleware ──
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan('combined'));
app.use(express.json());

// ── API Documentation (HTML + raw markdown) ──
const fs = require('fs');
const { marked } = require('marked');

app.get('/api/v1/documentation', (_req, res) => {
  try {
    const md = fs.readFileSync(path.join(__dirname, 'API-DOCUMENTATION.md'), 'utf8');
    const html = marked(md);
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WVI API Documentation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; background: #f8f9fa; }
    .container { max-width: 960px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2.2rem; margin: 2rem 0 1rem; color: #0f0f23; border-bottom: 3px solid #6c5ce7; padding-bottom: 0.5rem; }
    h2 { font-size: 1.6rem; margin: 2rem 0 0.8rem; color: #2d3436; border-bottom: 2px solid #dfe6e9; padding-bottom: 0.4rem; }
    h3 { font-size: 1.3rem; margin: 1.5rem 0 0.5rem; color: #636e72; }
    h4 { font-size: 1.1rem; margin: 1rem 0 0.4rem; }
    p { margin: 0.5rem 0; }
    code { background: #2d3436; color: #74b9ff; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #2d3436; color: #dfe6e9; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1rem 0; }
    pre code { background: none; color: inherit; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #dfe6e9; padding: 8px 12px; text-align: left; }
    th { background: #6c5ce7; color: white; }
    tr:nth-child(even) { background: #f1f2f6; }
    blockquote { border-left: 4px solid #6c5ce7; padding: 0.5rem 1rem; margin: 1rem 0; background: #f1f2f6; }
    a { color: #6c5ce7; }
    ul, ol { margin: 0.5rem 0 0.5rem 1.5rem; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .nav { position: fixed; top: 0; left: 0; right: 0; background: #0f0f23; color: white; padding: 0.8rem 2rem; z-index: 100; display: flex; gap: 1.5rem; align-items: center; }
    .nav a { color: #74b9ff; text-decoration: none; font-size: 0.9rem; }
    .nav a:hover { color: #a29bfe; }
    .content { margin-top: 60px; }
    strong { color: #2d3436; }
  </style>
</head>
<body>
  <div class="nav">
    <strong style="color:#a29bfe;font-size:1.1rem;">WVI API</strong>
    <a href="/api/v1/docs">Swagger UI</a>
    <a href="/api/v1/docs.json">OpenAPI JSON</a>
    <a href="/api/v1/documentation/raw">Raw Markdown</a>
    <a href="/api/v1/health/server-status">Health</a>
  </div>
  <div class="content">
    <div class="container">${html}</div>
  </div>
</body>
</html>`);
  } catch (err) {
    res.status(500).json({ error: 'Documentation file not found' });
  }
});

app.get('/api/v1/documentation/raw', (_req, res) => {
  try {
    const md = fs.readFileSync(path.join(__dirname, 'API-DOCUMENTATION.md'), 'utf8');
    res.type('text/markdown').send(md);
  } catch (err) {
    res.status(500).json({ error: 'Documentation file not found' });
  }
});

// ── Swagger UI ──
const swaggerDoc = YAML.load(path.join(__dirname, 'swagger', 'openapi.yaml'));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  customSiteTitle: 'WVI API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));
app.get('/api/v1/docs.json', (_req, res) => res.json(swaggerDoc));

// ── Helpers ──
const ts = () => new Date().toISOString();
const ok = (data) => ({ success: true, timestamp: ts(), data });

// ══════════════════════════════════════════════════════════════
// 1. AUTH
// ══════════════════════════════════════════════════════════════

app.post('/api/v1/auth/register', (_req, res) => res.status(201).json(ok({
  userId: 'usr_abc123', email: 'user@wvi.health', name: 'Alexander',
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-access-token',
  refreshToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-refresh-token',
  expiresIn: 3600
})));

app.post('/api/v1/auth/login', (_req, res) => res.json(ok({
  userId: 'usr_abc123',
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-access-token',
  refreshToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-refresh-token',
  expiresIn: 3600
})));

app.post('/api/v1/auth/refresh', (_req, res) => res.json(ok({
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-new-access-token',
  expiresIn: 3600
})));

// ══════════════════════════════════════════════════════════════
// 2. USERS
// ══════════════════════════════════════════════════════════════

const userProfile = {
  userId: 'usr_abc123', email: 'user@wvi.health', name: 'Alexander',
  age: 32, gender: 'male', height: 180, weight: 78,
  createdAt: '2026-01-15T08:00:00Z'
};

app.get('/api/v1/users/me', (_req, res) => res.json(ok(userProfile)));
app.put('/api/v1/users/me', (_req, res) => res.json(ok({ ...userProfile, updatedAt: ts() })));

app.get('/api/v1/users/me/norms', (_req, res) => res.json(ok({
  hr: { min: 55, max: 85, resting: 62 },
  hrv: { min: 35, max: 120, baseline: 68 },
  spo2: { min: 95, max: 100 },
  temperature: { min: 36.1, max: 37.2 },
  stress: { low: 25, high: 70 },
  bloodPressure: { systolicMin: 100, systolicMax: 130, diastolicMin: 60, diastolicMax: 85 }
})));

app.post('/api/v1/users/me/norms/calibrate', (_req, res) => res.json(ok({
  status: 'calibration_started', estimatedDuration: '7 days', message: 'Collecting baseline data'
})));

// ══════════════════════════════════════════════════════════════
// 3. BIOMETRICS (16 endpoints)
// ══════════════════════════════════════════════════════════════

app.post('/api/v1/biometrics/sync', (_req, res) => res.json(ok({
  syncId: 'sync_001', recordsReceived: 1420, recordsProcessed: 1420,
  duration: '2.3s', lastSyncAt: ts()
})));

app.get('/api/v1/biometrics/heart-rate', (_req, res) => res.json(ok({
  current: 72, min: 58, max: 145, resting: 62, unit: 'bpm',
  history: [{ ts: ts(), value: 72 }, { ts: ts(), value: 70 }]
})));

app.get('/api/v1/biometrics/hrv', (_req, res) => res.json(ok({
  rmssd: 68.4, sdnn: 74.2, lnRmssd: 4.23, pnn50: 32.1, unit: 'ms',
  history: [{ ts: ts(), rmssd: 68.4, sdnn: 74.2 }]
})));

app.get('/api/v1/biometrics/spo2', (_req, res) => res.json(ok({
  current: 98, min: 95, max: 99, unit: '%',
  history: [{ ts: ts(), value: 98 }]
})));

app.get('/api/v1/biometrics/temperature', (_req, res) => res.json(ok({
  current: 36.6, min: 36.1, max: 37.0, unit: 'celsius',
  history: [{ ts: ts(), value: 36.6 }]
})));

app.get('/api/v1/biometrics/sleep', (_req, res) => res.json(ok({
  totalMinutes: 462, deepMinutes: 95, lightMinutes: 248, remMinutes: 102, awakeMinutes: 17,
  efficiency: 0.92, startTime: '2026-04-01T23:15:00Z', endTime: '2026-04-02T07:07:00Z'
})));

app.get('/api/v1/biometrics/ppi', (_req, res) => res.json(ok({
  intervals: [812, 798, 825, 801, 810], unit: 'ms', meanPPI: 809.2, coherence: 0.78
})));

app.get('/api/v1/biometrics/ecg', (_req, res) => res.json(ok({
  samples: [0.12, 0.45, 0.98, 0.34, -0.12], sampleRate: 125, unit: 'mV',
  rhythm: 'normal_sinus', heartRate: 72
})));

app.get('/api/v1/biometrics/activity', (_req, res) => res.json(ok({
  steps: 8420, calories: 2150, distance: 6.3, activeMinutes: 47, unit: 'metric',
  currentType: 'sitting_working'
})));

app.get('/api/v1/biometrics/blood-pressure', (_req, res) => res.json(ok({
  systolic: 118, diastolic: 74, pulse: 72, unit: 'mmHg', classification: 'normal',
  measuredAt: ts()
})));

app.get('/api/v1/biometrics/stress', (_req, res) => res.json(ok({
  current: 35, level: 'low', unit: 'index_0_100',
  history: [{ ts: ts(), value: 35 }]
})));

app.get('/api/v1/biometrics/breathing-rate', (_req, res) => res.json(ok({
  current: 16, unit: 'breaths_per_min',
  history: [{ ts: ts(), value: 16 }]
})));

app.get('/api/v1/biometrics/rmssd', (_req, res) => res.json(ok({
  current: 68.4, unit: 'ms', trend: 'stable',
  history: [{ ts: ts(), value: 68.4 }]
})));

app.get('/api/v1/biometrics/coherence', (_req, res) => res.json(ok({
  score: 0.78, level: 'medium', unit: 'ratio_0_1',
  history: [{ ts: ts(), score: 0.78 }]
})));

app.get('/api/v1/biometrics/realtime', (_req, res) => res.json(ok({
  hr: 72, hrv: 68.4, spo2: 98, stress: 35, temperature: 36.6, activity: 'sitting_working',
  sampledAt: ts()
})));

app.get('/api/v1/biometrics/summary', (_req, res) => res.json(ok({
  date: '2026-04-02',
  hr: { avg: 72, min: 58, max: 145, resting: 62 },
  hrv: { avgRmssd: 68.4, avgSdnn: 74.2 },
  spo2: { avg: 98, min: 95 },
  stress: { avg: 35, max: 62 },
  steps: 8420, calories: 2150, activeMinutes: 47,
  sleepScore: 85
})));

// ══════════════════════════════════════════════════════════════
// 4. WVI (8 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/wvi/current', (req, res) => {
  const q = req.query;
  const m = {
    heartRate: +(q.hr||72), hrv: +(q.hrv||52), stress: +(q.stress||28),
    spo2: +(q.spo2||97.5), temperature: +(q.temp||36.5),
    systolicBP: +(q.sys||118), diastolicBP: +(q.dia||76),
    ppiCoherence: +(q.coherence||0.55),
    totalSleepMinutes: +(q.sleepMin||420), deepSleepPercent: +(q.deep||22),
    steps: +(q.steps||7240), activeMinutes: +(q.activeMins||35), mets: +(q.mets||0),
  };
  const norms = { restingHR: 62, baseTemp: 36.55, age: 32, stepGoal: 10000 };
  const emotion = detectEmotion(m, norms, { hour: new Date().getHours() });
  const activity = detectActivity({
    heartRate: m.heartRate, restingHR: norms.restingHR, maxHR: 208-0.7*norms.age,
    hrv: m.hrv, stress: m.stress, spo2: m.spo2, temperature: m.temperature,
    baseTemp: norms.baseTemp, ppiCoherence: m.ppiCoherence,
    stepsPerMin: +(q.stepsPerMin||0), hour: new Date().getHours(),
  });
  const wvi = calculateWVI(m, norms, {
    hour: new Date().getHours(), currentEmotion: emotion.primary,
    emotionConfidence: emotion.primaryConfidence, isExercising: activity.loadLevel >= 3,
  });
  res.json(ok({ wvi, emotion, activity }));
});

app.get('/api/v1/wvi/history', (_req, res) => res.json(ok({
  period: '30d',
  entries: [
    { date: '2026-04-02', score: 78 }, { date: '2026-04-01', score: 75 },
    { date: '2026-03-31', score: 80 }, { date: '2026-03-30', score: 72 }
  ]
})));

app.get('/api/v1/wvi/trends', (_req, res) => res.json(ok({
  period: '30d', direction: 'improving', slope: 0.42, confidence: 0.87,
  avgScore: 76.3, bestDay: { date: '2026-03-28', score: 88 },
  worstDay: { date: '2026-03-19', score: 61 }
})));

app.get('/api/v1/wvi/predict', (_req, res) => res.json(ok({
  predictedScore: 80, confidence: 0.82, horizon: '24h',
  factors: ['good_sleep_trend', 'low_stress', 'regular_activity']
})));

app.post('/api/v1/wvi/simulate', (_req, res) => res.json(ok({
  currentScore: 78, simulatedScore: 84, delta: +6,
  scenario: 'If you sleep 8h tonight and walk 10k steps tomorrow',
  confidence: 0.74
})));

app.get('/api/v1/wvi/circadian', (_req, res) => res.json(ok({
  peakHour: 10, troughHour: 15, currentPhase: 'ascending',
  hourlyScores: Array.from({ length: 24 }, (_, i) => ({
    hour: i, score: 60 + Math.round(18 * Math.sin((i - 4) * Math.PI / 12))
  }))
})));

app.get('/api/v1/wvi/correlations', (_req, res) => res.json(ok({
  pairs: [
    { metricA: 'sleep_quality', metricB: 'wvi_score', r: 0.82, p: 0.001 },
    { metricA: 'stress', metricB: 'wvi_score', r: -0.71, p: 0.003 },
    { metricA: 'hrv_rmssd', metricB: 'wvi_score', r: 0.68, p: 0.008 }
  ]
})));

app.get('/api/v1/wvi/breakdown', (_req, res) => res.json(ok({
  score: 78,
  weights: { hr: 0.12, hrv: 0.15, stress: 0.12, spo2: 0.08, temperature: 0.05, sleep: 0.18, activity: 0.10, bloodPressure: 0.08, ppiCoherence: 0.05, emotionalWellbeing: 0.07 },
  contributions: { hr: 9.84, hrv: 11.1, stress: 9.72, spo2: 7.6, temperature: 4.5, sleep: 15.3, activity: 6.8, bloodPressure: 7.04, ppiCoherence: 3.6, emotionalWellbeing: 5.32 }
})));

// ══════════════════════════════════════════════════════════════
// 5. EMOTIONS (8 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/emotions/current', (req, res) => {
  const q = req.query;
  const m = {
    heartRate: +(q.hr||72), hrv: +(q.hrv||52), stress: +(q.stress||28),
    spo2: +(q.spo2||97.5), temperature: +(q.temp||36.5),
    ppiCoherence: +(q.coherence||0.55), ppiRMSSD: +(q.rmssd||35),
    sleepScore: +(q.sleepScore||75), activityScore: +(q.activityScore||50),
    systolicBP: +(q.sys||118),
  };
  const norms = { restingHR: +(q.restingHR||62), baseTemp: 36.55 };
  res.json(ok(detectEmotion(m, norms, { hour: new Date().getHours() })));
});

app.get('/api/v1/emotions/history', (_req, res) => res.json(ok({
  period: '24h',
  entries: [
    { ts: '2026-04-02T08:00:00Z', emotion: 'energized', confidence: 0.82 },
    { ts: '2026-04-02T10:00:00Z', emotion: 'focused', confidence: 0.87 },
    { ts: '2026-04-02T14:00:00Z', emotion: 'calm', confidence: 0.79 }
  ]
})));

app.get('/api/v1/emotions/wellbeing', (_req, res) => res.json(ok({
  score: 76, trend: 'stable', positiveRatio: 0.72,
  dominantEmotion: 'focused', period: '7d'
})));

app.get('/api/v1/emotions/distribution', (_req, res) => res.json(ok({
  period: '7d',
  distribution: { focused: 0.28, calm: 0.22, content: 0.18, energized: 0.12, neutral: 0.08, anxious: 0.06, tired: 0.04, stressed: 0.02 }
})));

app.get('/api/v1/emotions/heatmap', (_req, res) => res.json(ok({
  period: '7d',
  grid: Array.from({ length: 7 }, (_, d) => ({
    day: d, hours: Array.from({ length: 24 }, (_, h) => ({
      hour: h, emotion: 'calm', intensity: +(0.3 + Math.random() * 0.6).toFixed(2)
    }))
  }))
})));

app.get('/api/v1/emotions/transitions', (_req, res) => res.json(ok({
  period: '24h',
  transitions: [
    { from: 'sleepy', to: 'energized', count: 1, avgDuration: '25min' },
    { from: 'energized', to: 'focused', count: 1, avgDuration: '45min' },
    { from: 'focused', to: 'calm', count: 2, avgDuration: '60min' }
  ]
})));

app.get('/api/v1/emotions/triggers', (_req, res) => res.json(ok({
  triggers: [
    { emotion: 'stressed', trigger: 'low_sleep_quality', correlation: 0.74 },
    { emotion: 'focused', trigger: 'morning_routine_completed', correlation: 0.68 },
    { emotion: 'energized', trigger: 'physical_activity', correlation: 0.81 }
  ]
})));

app.get('/api/v1/emotions/streaks', (_req, res) => res.json(ok({
  currentStreak: { emotion: 'positive', days: 5 },
  longestStreak: { emotion: 'positive', days: 12, startDate: '2026-03-01' },
  streaks: [{ type: 'positive', current: 5 }, { type: 'focused', current: 3 }]
})));

// ══════════════════════════════════════════════════════════════
// 6. ACTIVITIES (10 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/activities/current', (req, res) => {
  const q = req.query;
  const signals = {
    heartRate: +(q.hr||72), restingHR: +(q.restingHR||62), maxHR: +(q.maxHR||186),
    hrv: +(q.hrv||52), stress: +(q.stress||28), spo2: +(q.spo2||97.5),
    temperature: +(q.temp||36.5), baseTemp: 36.55, ppiCoherence: +(q.coherence||0.55),
    stepsPerMin: +(q.stepsPerMin||0), stepCadence: +(q.stepCadence||0.5),
    hour: new Date().getHours(), shortTermHRVariance: +(q.hrVar||5),
    hrIntervalPattern: +(q.hrInterval||0), hrRampDirection: +(q.hrRamp||0),
    hrAcceleration: +(q.hrAccel||0), breathingRegularity: +(q.breathReg||0.5),
    minutesSinceLastActivity: +(q.minsSince||30), weightKg: +(q.weight||75),
    gender: q.gender||'male',
  };
  res.json(ok(detectActivity(signals)));
});

app.get('/api/v1/activities/history', (_req, res) => res.json(ok({
  period: '24h',
  activities: [
    { type: 'sleeping', start: '2026-04-01T23:15:00Z', end: '2026-04-02T07:07:00Z', calories: 420 },
    { type: 'walking', start: '2026-04-02T07:30:00Z', end: '2026-04-02T08:00:00Z', steps: 3200, calories: 150 },
    { type: 'sitting_working', start: '2026-04-02T09:15:00Z', end: null, calories: 85 }
  ]
})));

app.get('/api/v1/activities/load', (_req, res) => res.json(ok({
  trimp: 124, acuteLoad: 310, chronicLoad: 285, ratio: 1.09, status: 'optimal', zone: 'productive'
})));

app.get('/api/v1/activities/zones', (_req, res) => res.json(ok({
  zones: [
    { zone: 1, name: 'Recovery', min: 50, max: 60, pctHrMax: '50-60%', minutesToday: 180 },
    { zone: 2, name: 'Aerobic', min: 60, max: 70, pctHrMax: '60-70%', minutesToday: 30 },
    { zone: 3, name: 'Tempo', min: 70, max: 80, pctHrMax: '70-80%', minutesToday: 15 },
    { zone: 4, name: 'Threshold', min: 80, max: 90, pctHrMax: '80-90%', minutesToday: 5 },
    { zone: 5, name: 'VO2max', min: 90, max: 100, pctHrMax: '90-100%', minutesToday: 0 }
  ]
})));

app.get('/api/v1/activities/categories', (_req, res) => res.json(ok({
  categories: [
    { name: 'Sedentary', types: ['sitting_working', 'sitting_idle', 'lying_down'], totalMinutes: 420 },
    { name: 'Light', types: ['walking', 'standing', 'cooking'], totalMinutes: 95 },
    { name: 'Moderate', types: ['brisk_walking', 'cycling', 'yoga'], totalMinutes: 30 },
    { name: 'Vigorous', types: ['running', 'hiit', 'swimming'], totalMinutes: 0 }
  ]
})));

app.get('/api/v1/activities/transitions', (_req, res) => res.json(ok({
  transitions: [
    { from: 'sleeping', to: 'walking', at: '2026-04-02T07:07:00Z' },
    { from: 'walking', to: 'sitting_working', at: '2026-04-02T09:15:00Z' }
  ]
})));

app.get('/api/v1/activities/sedentary', (_req, res) => res.json(ok({
  totalMinutes: 420, longestBout: 95, bouts: 4, breaksTaken: 3,
  recommendation: 'Take a 5-minute walk break every 50 minutes'
})));

app.get('/api/v1/activities/exercise-log', (_req, res) => res.json(ok({
  exercises: [
    { id: 'ex_001', type: 'walking', duration: 30, calories: 150, hr: { avg: 98, max: 112 }, date: '2026-04-02' }
  ]
})));

app.get('/api/v1/activities/recovery-status', (_req, res) => res.json(ok({
  status: 'recovered', score: 88, readiness: 'high',
  hrRecovery: { resting: 62, current: 65, delta: 3 },
  recommendation: 'Good to train at moderate-high intensity'
})));

app.post('/api/v1/activities/manual-log', (_req, res) => res.status(201).json(ok({
  id: 'ex_002', type: 'yoga', duration: 45, logged: true, loggedAt: ts()
})));

// ══════════════════════════════════════════════════════════════
// 7. SLEEP (5 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/sleep/last-night', (_req, res) => res.json(ok({
  score: 85, totalMinutes: 462, efficiency: 0.92,
  phases: { deep: 95, light: 248, rem: 102, awake: 17 },
  start: '2026-04-01T23:15:00Z', end: '2026-04-02T07:07:00Z',
  latency: 12, wakeups: 2
})));

app.get('/api/v1/sleep/score-history', (_req, res) => res.json(ok({
  period: '14d',
  scores: [
    { date: '2026-04-02', score: 85 }, { date: '2026-04-01', score: 78 },
    { date: '2026-03-31', score: 82 }, { date: '2026-03-30', score: 90 }
  ]
})));

app.get('/api/v1/sleep/architecture', (_req, res) => res.json(ok({
  cycles: 5,
  stages: [
    { stage: 'light', start: '23:15', end: '23:45', duration: 30 },
    { stage: 'deep', start: '23:45', end: '00:20', duration: 35 },
    { stage: 'rem', start: '00:20', end: '00:45', duration: 25 },
    { stage: 'light', start: '00:45', end: '01:30', duration: 45 }
  ],
  deepPct: 0.206, remPct: 0.221, lightPct: 0.537, awakePct: 0.037
})));

app.get('/api/v1/sleep/consistency', (_req, res) => res.json(ok({
  avgBedtime: '23:20', avgWakeTime: '07:05', stdDevBedtime: '22min', stdDevWakeTime: '18min',
  socialJetLag: '15min', consistency: 'good', score: 82
})));

app.get('/api/v1/sleep/debt', (_req, res) => res.json(ok({
  accumulatedDebt: 45, unit: 'minutes', period: '7d',
  dailyTarget: 480, dailyAvg: 455, recommendation: 'Try to sleep 15 min earlier tonight'
})));

// ══════════════════════════════════════════════════════════════
// 8. AI (7 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/ai/interpret', (_req, res) => res.json(ok({
  wviScore: 78,
  interpretation: 'Your WVI of 78 reflects good overall wellness. HRV is solid at 68ms, stress is well-managed at 35/100. Sleep quality was excellent last night (85/100). Main area for improvement: increase daily activity.',
  perspectives: {
    doctor: 'Vitals within healthy range. Blood pressure 118/74 is optimal.',
    psychologist: 'Emotional state is positive — focused and calm. Good emotional regulation.',
    neuroscientist: 'HRV pattern suggests healthy autonomic balance. PPI coherence at 0.78 is above average.',
    biohacker: 'Temperature delta minimal — circadian rhythm well-aligned. Consider cold exposure for HRV boost.',
    coach: 'Activity load ratio 1.09 is in the sweet spot. Ready for moderate training.',
    nutritionist: 'Stable glucose indicators. Consider hydration — breathing rate slightly elevated.',
    sleepExpert: 'Sleep architecture excellent — 5 full cycles, 20% deep sleep. Consistency score 82/100.',
    dataScientist: 'WVI trending +0.42/day over 30d. Correlation: sleep quality is your strongest lever (r=0.82).'
  }
})));

app.get('/api/v1/ai/recommendations', (_req, res) => res.json(ok({
  recommendations: [
    { priority: 1, category: 'activity', text: 'Take a 10-minute walk now — sedentary for 2h 45m', impact: '+3 WVI' },
    { priority: 2, category: 'sleep', text: 'Maintain your bedtime at 23:15 tonight', impact: '+2 WVI' },
    { priority: 3, category: 'stress', text: 'Try 5 min box breathing before your next meeting', impact: '+1 WVI' }
  ]
})));

app.post('/api/v1/ai/chat', (_req, res) => res.json(ok({
  response: 'Based on your current data, your WVI of 78 is in the "Good" range. Your strongest metrics are sleep (85) and blood pressure (88). To push into "Excellent" (85+), focus on increasing daily activity and maintaining your sleep schedule.',
  context: { wviScore: 78, emotion: 'focused', activity: 'sitting_working' }
})));

app.get('/api/v1/ai/explain-metric', (_req, res) => res.json(ok({
  metric: 'hrv', value: 68.4, unit: 'ms',
  explanation: 'Heart Rate Variability (HRV) measures the variation in time between heartbeats. Your RMSSD of 68.4ms indicates good autonomic nervous system balance. Values above 50ms are generally considered healthy for your age group.',
  percentile: 72, population: 'males_30_35'
})));

app.post('/api/v1/ai/action-plan', (_req, res) => res.json(ok({
  plan: {
    goal: 'Reach WVI 85+ by next week',
    actions: [
      { time: 'morning', action: 'Walk 20 min after waking', metric: 'activity', expectedImpact: '+4' },
      { time: 'midday', action: 'Standing desk for 2h', metric: 'activity', expectedImpact: '+2' },
      { time: 'evening', action: 'Wind down routine at 22:30', metric: 'sleep', expectedImpact: '+3' }
    ],
    estimatedDays: 5
  }
})));

app.get('/api/v1/ai/insights', (_req, res) => res.json(ok({
  insights: [
    { type: 'pattern', text: 'Your WVI peaks on days when you walk >8000 steps', confidence: 0.88 },
    { type: 'anomaly', text: 'HRV dropped 15% after late meals — consider eating dinner before 20:00', confidence: 0.72 },
    { type: 'streak', text: '5-day positive emotion streak — keep it up!', confidence: 0.95 }
  ]
})));

app.get('/api/v1/ai/genius-layer', (_req, res) => res.json(ok({
  layer: 'genius',
  perspectives: ['doctor', 'psychologist', 'neuroscientist', 'biohacker', 'coach', 'nutritionist', 'sleepExpert', 'dataScientist'],
  synthesis: 'Multi-perspective analysis indicates positive health trajectory. Key consensus: maintain sleep consistency (all 8 experts agree), increase mid-day movement (6/8 agree), and consider HRV-guided breathing exercises (5/8 recommend).',
  confidenceScore: 0.84
})));

// ══════════════════════════════════════════════════════════════
// 9. REPORTS (5 endpoints)
// ══════════════════════════════════════════════════════════════

app.post('/api/v1/reports/generate', (_req, res) => res.status(201).json(ok({
  reportId: 'rpt_20260402_001', format: 'pdf', status: 'generating',
  estimatedTime: '15s', createdAt: ts()
})));

app.get('/api/v1/reports/list', (_req, res) => res.json(ok({
  reports: [
    { id: 'rpt_20260401_001', title: 'Daily Wellness Report', format: 'pdf', date: '2026-04-01', status: 'ready' },
    { id: 'rpt_20260331_001', title: 'Weekly Summary', format: 'html', date: '2026-03-31', status: 'ready' }
  ]
})));

app.get('/api/v1/reports/templates', (_req, res) => res.json(ok({
  templates: [
    { id: 'tpl_daily', name: 'Daily Wellness', format: 'pdf' },
    { id: 'tpl_weekly', name: 'Weekly Summary', format: 'html' },
    { id: 'tpl_monthly', name: 'Monthly Overview', format: 'slides' },
    { id: 'tpl_doctor', name: 'Doctor Report', format: 'pdf' }
  ]
})));

app.get('/api/v1/reports/:id', (req, res) => res.json(ok({
  id: req.params.id, title: 'Daily Wellness Report', format: 'pdf',
  date: '2026-04-01', status: 'ready', downloadUrl: `/api/v1/reports/${req.params.id}/download`,
  pages: 5, generatedAt: '2026-04-01T23:59:00Z'
})));

app.delete('/api/v1/reports/:id', (req, res) => res.json(ok({ id: req.params.id, deleted: true })));

// ══════════════════════════════════════════════════════════════
// 10. ALERTS (6 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/alerts/list', (_req, res) => res.json(ok({
  alerts: [
    { id: 'alt_001', level: 'warning', metric: 'stress', message: 'Stress level rose above 70', value: 72, threshold: 70, at: '2026-04-02T11:30:00Z', acknowledged: false },
    { id: 'alt_002', level: 'info', metric: 'sedentary', message: 'Sedentary for 90+ min', at: '2026-04-02T11:00:00Z', acknowledged: true }
  ]
})));

app.get('/api/v1/alerts/settings', (_req, res) => res.json(ok({
  enabled: true,
  thresholds: {
    hr: { critical: { min: 40, max: 180 }, warning: { min: 50, max: 150 } },
    spo2: { critical: { min: 88 }, warning: { min: 93 } },
    stress: { warning: { max: 70 }, critical: { max: 85 } }
  },
  channels: ['push', 'email']
})));

app.put('/api/v1/alerts/settings', (_req, res) => res.json(ok({ updated: true, updatedAt: ts() })));

app.get('/api/v1/alerts/history', (_req, res) => res.json(ok({
  period: '7d', total: 12,
  alerts: [
    { id: 'alt_001', level: 'warning', metric: 'stress', at: '2026-04-02T11:30:00Z' },
    { id: 'alt_002', level: 'info', metric: 'sedentary', at: '2026-04-02T11:00:00Z' }
  ]
})));

app.post('/api/v1/alerts/:id/acknowledge', (req, res) => res.json(ok({
  id: req.params.id, acknowledged: true, acknowledgedAt: ts()
})));

app.get('/api/v1/alerts/stats', (_req, res) => res.json(ok({
  period: '30d', total: 47,
  byLevel: { critical: 2, warning: 15, info: 25, notice: 5 },
  byMetric: { stress: 12, sedentary: 18, hr: 8, spo2: 4, temperature: 5 },
  avgResponseTime: '4.2min'
})));

// ══════════════════════════════════════════════════════════════
// 11. DEVICE (6 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/device/status', (_req, res) => res.json(ok({
  deviceId: 'v8_ble_001', model: 'V8 BLE', firmware: '2.4.1',
  battery: 72, connected: true, lastSync: ts(),
  signal: 'strong', uptime: '18h 32m'
})));

app.get('/api/v1/device/auto-monitoring', (_req, res) => res.json(ok({
  enabled: true, interval: 300, metrics: ['hr', 'hrv', 'spo2', 'temperature', 'stress', 'activity'],
  nightMode: true, nightInterval: 600
})));

app.put('/api/v1/device/auto-monitoring', (_req, res) => res.json(ok({ updated: true, updatedAt: ts() })));

app.post('/api/v1/device/sync', (_req, res) => res.json(ok({
  syncId: 'sync_002', status: 'started', estimatedRecords: 500
})));

app.get('/api/v1/device/capabilities', (_req, res) => res.json(ok({
  sensors: ['ppg', 'accelerometer', 'gyroscope', 'thermometer', 'ecg'],
  metrics: ['hr', 'hrv', 'spo2', 'temperature', 'ecg', 'ppi', 'activity', 'sleep', 'stress', 'blood_pressure'],
  sampleRates: { ppg: 25, ecg: 125, accelerometer: 50, temperature: 1 },
  features: ['continuous_hr', 'sleep_tracking', 'auto_activity', 'spot_ecg']
})));

app.post('/api/v1/device/measure', (_req, res) => res.json(ok({
  measurementId: 'msr_001', type: 'ecg', status: 'started',
  estimatedDuration: '30s', startedAt: ts()
})));

// ══════════════════════════════════════════════════════════════
// 12. TRAINING (4 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/training/recommendation', (_req, res) => res.json(ok({
  type: 'moderate_cardio', intensity: 'moderate', duration: 45, unit: 'minutes',
  reason: 'Recovery score 88/100, acute:chronic ratio 1.09 — safe for moderate effort',
  suggestedActivities: ['brisk_walking', 'cycling', 'swimming']
})));

app.get('/api/v1/training/weekly-plan', (_req, res) => res.json(ok({
  week: '2026-W14',
  plan: [
    { day: 'Mon', type: 'moderate_cardio', duration: 45 },
    { day: 'Tue', type: 'strength', duration: 40 },
    { day: 'Wed', type: 'rest', duration: 0 },
    { day: 'Thu', type: 'hiit', duration: 30 },
    { day: 'Fri', type: 'moderate_cardio', duration: 45 },
    { day: 'Sat', type: 'active_recovery', duration: 30 },
    { day: 'Sun', type: 'rest', duration: 0 }
  ],
  totalLoad: 190, targetLoad: 200
})));

app.get('/api/v1/training/overtraining-risk', (_req, res) => res.json(ok({
  risk: 'low', score: 18,
  factors: {
    acuteChronicRatio: 1.09, hrvTrend: 'stable', restingHrTrend: 'stable',
    sleepQuality: 85, subjectiveFatigue: null
  },
  recommendation: 'All indicators green. Safe to train as planned.'
})));

app.get('/api/v1/training/optimal-time', (_req, res) => res.json(ok({
  optimalWindow: { start: '10:00', end: '12:00' },
  reason: 'HRV peaks mid-morning, cortisol at optimal training level',
  alternativeWindow: { start: '16:00', end: '18:00' },
  avoidWindow: { start: '21:00', end: '06:00', reason: 'Sleep preparation zone' }
})));

// ══════════════════════════════════════════════════════════════
// 13. RISK (5 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/risk/assessment', (_req, res) => res.json(ok({
  overallRisk: 'low', varScore: 12, confidence: 0.85,
  riskFactors: [
    { factor: 'cardiovascular', level: 'low', score: 8 },
    { factor: 'metabolic', level: 'low', score: 15 },
    { factor: 'mental_health', level: 'low', score: 10 },
    { factor: 'musculoskeletal', level: 'moderate', score: 22 }
  ],
  assessedAt: ts()
})));

app.get('/api/v1/risk/anomalies', (_req, res) => res.json(ok({
  anomalies: [
    { metric: 'resting_hr', value: 68, expected: 62, deviation: 2.1, severity: 'mild', at: '2026-04-02T06:00:00Z' }
  ],
  period: '7d', totalDetected: 3
})));

app.get('/api/v1/risk/chronic-flags', (_req, res) => res.json(ok({
  flags: [], message: 'No chronic risk patterns detected in the last 90 days', lastAssessed: ts()
})));

app.get('/api/v1/risk/correlations', (_req, res) => res.json(ok({
  correlations: [
    { factorA: 'poor_sleep', factorB: 'elevated_stress', r: 0.76, clinicalRelevance: 'high' },
    { factorA: 'low_activity', factorB: 'elevated_resting_hr', r: 0.62, clinicalRelevance: 'moderate' }
  ]
})));

app.get('/api/v1/risk/volatility', (_req, res) => res.json(ok({
  wviVolatility: 6.2, unit: 'points', period: '30d', classification: 'stable',
  metricVolatility: { hr: 8.1, hrv: 12.4, stress: 15.2, sleep: 7.8 }
})));

// ══════════════════════════════════════════════════════════════
// 14. DASHBOARD (3 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/dashboard/widgets', (_req, res) => res.json(ok({
  widgets: [
    { id: 'wvi_gauge', type: 'gauge', title: 'WVI Score', value: 78, max: 100 },
    { id: 'hr_chart', type: 'sparkline', title: 'Heart Rate', current: 72, data: [68, 70, 72, 74, 71] },
    { id: 'emotion_badge', type: 'badge', title: 'Current Emotion', value: 'focused' },
    { id: 'activity_ring', type: 'ring', title: 'Activity', steps: 8420, goal: 10000 },
    { id: 'sleep_bar', type: 'bar', title: 'Sleep Score', value: 85, max: 100 }
  ]
})));

app.get('/api/v1/dashboard/daily-brief', (_req, res) => res.json(ok({
  date: '2026-04-02',
  greeting: 'Good morning, Alexander!',
  summary: 'You slept well (85/100), WVI is 78 — solid. Focus today: stay active and hydrated.',
  highlights: [
    { icon: 'moon', text: 'Sleep score 85 — 5 full cycles, great deep sleep' },
    { icon: 'heart', text: 'Resting HR 62 bpm — right on target' },
    { icon: 'brain', text: 'Emotional state: focused — productivity window open' }
  ],
  topRecommendation: 'Walk 20 min this morning to boost your WVI by ~3 points'
})));

app.get('/api/v1/dashboard/evening-review', (_req, res) => res.json(ok({
  date: '2026-04-02',
  summary: 'Productive day! WVI averaged 76. You were focused for 4h and took 8420 steps.',
  metrics: {
    wviAvg: 76, wviPeak: 82, steps: 8420, activeMinutes: 47,
    stressAvg: 35, dominantEmotion: 'focused'
  },
  achievements: ['5-day positive streak', 'Sleep consistency maintained'],
  tomorrowTip: 'Aim for bed by 23:15 to maintain your sleep rhythm'
})));

// ══════════════════════════════════════════════════════════════
// 15. EXPORT (3 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/export/csv', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=wvi-export.csv');
  res.send('date,wvi_score,hr_avg,hrv_rmssd,stress,spo2,sleep_score,steps\n2026-04-02,78,72,68.4,35,98,85,8420\n2026-04-01,75,74,65.1,42,97,78,6200\n');
});

app.get('/api/v1/export/json', (_req, res) => res.json(ok({
  exportDate: ts(), format: 'json', records: 2,
  data: [
    { date: '2026-04-02', wviScore: 78, hrAvg: 72, hrvRmssd: 68.4, stress: 35, spo2: 98, sleepScore: 85, steps: 8420 },
    { date: '2026-04-01', wviScore: 75, hrAvg: 74, hrvRmssd: 65.1, stress: 42, spo2: 97, sleepScore: 78, steps: 6200 }
  ]
})));

app.get('/api/v1/export/health-summary', (_req, res) => res.json(ok({
  format: 'pdf', status: 'generated',
  summary: {
    period: '2026-03-02 to 2026-04-02',
    avgWvi: 76.3, avgHr: 71, avgHrv: 66.8, avgStress: 38,
    sleepQuality: 'good', activityLevel: 'moderate',
    riskAssessment: 'low', recommendation: 'Continue current lifestyle with focus on increasing daily steps'
  },
  downloadUrl: '/api/v1/export/health-summary/download'
})));

// ══════════════════════════════════════════════════════════════
// 16. SETTINGS (4 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/settings', (_req, res) => res.json(ok({
  units: 'metric', language: 'en', timezone: 'Europe/Moscow',
  theme: 'auto', dataRetention: '365d',
  privacy: { shareAnonymousData: false, showInLeaderboard: false }
})));

app.put('/api/v1/settings', (_req, res) => res.json(ok({ updated: true, updatedAt: ts() })));

app.get('/api/v1/settings/notifications', (_req, res) => res.json(ok({
  push: true, email: false, sms: false,
  quietHours: { enabled: true, start: '23:00', end: '07:00' },
  alertLevels: { critical: true, warning: true, info: true, notice: false }
})));

app.put('/api/v1/settings/notifications', (_req, res) => res.json(ok({ updated: true, updatedAt: ts() })));

// ══════════════════════════════════════════════════════════════
// 17. HEALTH (2 endpoints)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/health/server-status', (_req, res) => res.json({
  status: 'ok', uptime: process.uptime(), timestamp: ts(),
  version: '1.0.0', environment: process.env.NODE_ENV || 'development'
}));

app.get('/api/v1/health/api-version', (_req, res) => res.json({
  api: 'WVI — Wellness Vitality Index API', version: '1.0.0',
  openapi: '3.1.0', endpoints: 108, docsUrl: '/api/v1/docs'
}));

// ── 404 handler ──
// ═══════════════════════════════════════════════════════════
// MISSING ENDPOINTS (15) — completing to 108+ total
// ═══════════════════════════════════════════════════════════

// ── Biometrics POST (8): upload individual metric data ──
const bioPostTypes = ['heart-rate','hrv','spo2','temperature','sleep','ppi','ecg','activity'];
bioPostTypes.forEach(type => {
  app.post(`/api/v1/biometrics/${type}`, (req, res) => {
    const count = Array.isArray(req.body?.records) ? req.body.records.length : 1;
    res.status(201).json(ok({ message: `${type} data saved`, recordsSaved: count, type }));
  });
});

// ── WVI compare (GET): compare two periods ──
app.get('/api/v1/wvi/compare', (req, res) => {
  const { period1 = '2026-03-01/2026-03-15', period2 = '2026-03-16/2026-03-31' } = req.query;
  res.json(ok({
    period1: { range: period1, avgWVI: 72.3, avgEmotion: 'focused', avgActivity: 'sitting_working' },
    period2: { range: period2, avgWVI: 78.1, avgEmotion: 'calm', avgActivity: 'walk_normal' },
    delta: 5.8, trend: 'improving',
    metricChanges: {
      hrvScore: +8.2, stressScore: +6.1, sleepScore: +4.5, activityScore: +12.3,
      heartRateScore: -1.2, spo2Score: +0.5, temperatureScore: +2.1,
      bpScore: +3.0, ppiCoherenceScore: +5.4, emotionalWellbeingScore: +7.8,
    },
  }));
});

// ── Sleep phases (GET): detailed phase timeline ──
app.get('/api/v1/sleep/phases', (_req, res) => res.json(ok({
  date: '2026-04-01',
  phases: [
    { phase: 'light', start: '23:15', end: '23:55', durationMin: 40 },
    { phase: 'deep', start: '23:55', end: '00:40', durationMin: 45 },
    { phase: 'light', start: '00:40', end: '01:30', durationMin: 50 },
    { phase: 'rem', start: '01:30', end: '02:10', durationMin: 40 },
    { phase: 'deep', start: '02:10', end: '03:00', durationMin: 50 },
    { phase: 'light', start: '03:00', end: '04:30', durationMin: 90 },
    { phase: 'rem', start: '04:30', end: '05:30', durationMin: 60 },
    { phase: 'light', start: '05:30', end: '06:45', durationMin: 75 },
  ],
  totalCycles: 4, avgCycleDuration: 95,
})));

// ── Sleep optimal window (GET) ──
app.get('/api/v1/sleep/optimal-window', (_req, res) => res.json(ok({
  recommendedBedtime: '23:00', recommendedWakeTime: '07:00',
  chronotype: 'intermediate', melatoninOnsetEstimate: '22:30',
  reason: 'Based on your circadian HRV pattern and sleep consistency data',
})));

// ── AI explain-metric (POST): why is this metric at this value ──
app.post('/api/v1/ai/explain-metric', (req, res) => {
  const metric = req.body?.metric || 'hrv';
  const value = req.body?.value || 48;
  res.json(ok({
    metric, value,
    explanation: `Your ${metric} value of ${value} is within the normal range for your age and fitness level. ` +
      `Key factors: sleep quality (22% deep), stress level (28/100), and recent activity patterns.`,
    comparisons: {
      personalAvg: 52, populationAvg: 45, personalBest: 78, personalWorst: 18,
      percentile: 68,
    },
    recommendations: [
      `To improve ${metric}: prioritize 7-8 hours of sleep with consistent bed time`,
      `Breathing exercises (4-7-8 pattern) for 5 minutes can boost ${metric} acutely`,
    ],
    references: ['Shaffer & Ginsberg 2017', 'Laborde et al. 2017'],
  }));
});

// ── Reports download (GET) ──
app.get('/api/v1/reports/:id/download', (req, res) => {
  res.json(ok({
    id: req.params.id,
    downloadUrl: `https://storage.wvi.health/reports/${req.params.id}.pdf`,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    format: 'pdf', sizeBytes: 1245678,
  }));
});

// ── Alerts active (GET): only unacknowledged ──
app.get('/api/v1/alerts/active', (_req, res) => res.json(ok({
  count: 1,
  alerts: [{
    id: 'alt_001', level: 'warning', metric: 'stress',
    message: 'Sustained stress >60 for over 45 minutes',
    value: 68, threshold: 60, timestamp: ts(), acknowledged: false,
  }],
})));

// ── Device firmware (GET) ──
app.get('/api/v1/device/firmware', (_req, res) => res.json(ok({
  currentVersion: '2.1.4', latestVersion: '2.2.0',
  updateAvailable: true,
  releaseNotes: 'Improved HRV accuracy, fixed SpO2 calibration, added PPI continuous mode',
  updateUrl: 'https://firmware.v8device.com/v2.2.0.bin',
})));

// ── 404 fallback ──
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not found' }));

// ── Start ──
app.listen(PORT, () => {
  console.log(`WVI API server running on port ${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api/v1/docs`);
  console.log(`Health:     http://localhost:${PORT}/api/v1/health/server-status`);
});
