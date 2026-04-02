# WVI MEGA-ALGORITHM: Wellness Vitality Index + Emotion AI

## Context

Building a mega-algorithm WVI that combines:
- **V8 BLE SDK** — 17 health endpoints from smart watches (HR, HRV, stress, SpO2, temp, sleep, ECG, PPG, PPI, BP, activity)
- **AI Analytics** — Claude API (Sonnet/Opus) for data interpretation
- **AI Analytics** — Claude Sonnet/Opus for data interpretation and recommendations
- **18 Emotions** — detection via physiological Fuzzy Logic cascade
- **64 Activity Types** — auto-detection with TRIMP and heart rate zones
- **Product Pipeline** — from data collection to final report

---

## PART 1: MEGA-ALGORITHM ARCHITECTURE

### 1.1 Modules

```
WVIEngine/
├── WVIModels.h                    — All data structures, 18 emotions, WVIResult
├── WVIDataCollector.h/.m          — Data collection from ALL 17 SDK endpoints
├── WVIMetricNormalizer.h/.m       — Normalization of 10 metrics → 0-100
├── WVIEmotionEngine.h/.m          — 18 emotions: cascading algorithm + fuzzy logic
├── WVIScoreCalculator.h/.m        — Final WVI 0-100 (weighted)
├── WVITrendAnalyzer.h/.m          — Trends, patterns, predictions
├── WVIAIInterpreter.h/.m          — AI layer: Claude analyzes raw data
├── WVIReportGenerator.h/.m        — Report generation (PDF, HTML, Telegram)
├── WVIAutoMonitorSetup.h/.m       — Auto-monitoring setup on device
└── WVIAlertSystem.h/.m            — Telegram alerts for critical values
```

### 1.2 Pipeline (Full Cycle)

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: DATA COLLECTION (WVIDataCollector)                    │
│  ├─ BLE SDK → HR, HRV+stress+BP, SpO2, Temp, Sleep, PPI, ECG  │
│  ├─ Auto-pagination (mode 0 → mode 2 when count==50)            │
│  └─ Collect PersonalInfo for calibration (age, gender, weight, height) │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: NORMALIZATION (WVIMetricNormalizer)                   │
│  ├─ 10 metrics → each normalized to 0-100                   │
│  ├─ Personalization: accounting for age, gender, restingHR, baseTemp   │
│  └─ Compute derivatives: RMSSD, PPI coherence, HRV trend       │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: EMOTION DETECTION (WVIEmotionEngine)                  │
│  ├─ Cascading algorithm: 18 emotions with priorities               │
│  ├─ Fuzzy Logic: soft boundaries, dual matches             │
│  ├─ Temporal Smoothing: no emotion switching within < 5 min      │
│  └─ Confidence scoring: 0-1 for each detection             │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4: WVI SCORE (WVIScoreCalculator)                        │
│  ├─ Weighted sum of 9 normalized metrics                   │
│  ├─ Adaptive weights: change based on time of day and context      │
│  └─ Scale: 0-100 → 5 levels                                   │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 5: AI INTERPRETATION (WVIAIInterpreter)                  │
│  ├─ Claude Sonnet: analyzes raw data + WVI + emotion      │
│  ├─ Genius Layer (8 personas): Doctor, Psychologist, Biohacker,   │
│  │   Coach, Nutritionist, Neuroscientist, Sleep Expert, Athlete │
│  ├─ Recommendations: specific actions based on patterns       │
│  └─ Predictions: WVI forecast for the next 6h                  │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 6: TREND ANALYSIS (WVITrendAnalyzer)                     │
│  ├─ 24h / 7d / 30d trends for each metric                        │
│  ├─ Patterns: circadian rhythm, weekly cycles                   │
│  ├─ Anomaly detection: outliers and abnormal patterns            │
│  └─ Predictive: linear regression + exponential smoothing    │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 7: OUTPUT (WVIReportGenerator + WVIAlertSystem)          │
│  ├─ Telegram: emoji-rich message with WVI + emotion + advice    │
│  ├─ PDF: McKinsey-quality report (via pdf-generator skill)     │
│  ├─ HTML: interactive dashboard (via html-page skill)         │
│  └─ Alerts: instant notifications when WVI < 40 or anomalies │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 2: ALL SDK API ENDPOINTS

| # | Metric | SDK Method | Enum (Value) | Response Keys |
|---|---------|-----------|--------------|--------------|
| 1 | HR continuous | `GetContinuousHRDataWithMode:withStartDate:` | DynamicHR_V8 (28) | `arrayContinuousHR` → `{date, arrayHR}` |
| 2 | HR single | `GetSingleHRDataWithMode:withStartDate:` | StaticHR_V8 (29) | `arraySingleHR` → `{date, singleHR}` |
| 3 | HRV+Stress+BP | `GetHRVDataWithMode:withStartDate:` | HRVData_V8 (41) | `arrayHrvData` → `{date, hrv, stress, heartRate, systolicBP, diastolicBP}` |
| 4 | SpO2 auto | `GetAutomaticSpo2DataWithMode:withStartDate:` | AutomaticSpo2Data_V8 (45) | `arrayAutomaticSpo2Data` → `{date, automaticSpo2Data}` |
| 5 | SpO2 manual | `GetManualSpo2DataWithMode:withStartDate:` | ManualSpo2Data_V8 (46) | manual SpO2 readings |
| 6 | Temperature | `GetTemperatureDataWithMode:withStartDate:` | TemperatureData_V8 (48) | `arrayemperatureData` → `{date, temperature}` |
| 7 | Sleep detail | `GetDetailSleepDataWithMode:withStartDate:` | DetailSleepData_V8 (27) | `arrayDetailSleepData` → `{startTime_SleepData, totalSleepTime, arraySleepQuality, sleepUnitLength}` |
| 8 | Sleep+Activity | `getSleepDetailsAndActivityWithMode:withStartDate:` | DetailSleepAndActivityData_V8 (81) | + `arrayActivityData` |
| 9 | PPI intervals | `GetPPIDataWithMode:withStartDate:` | ppiData_V8 (96) | `arrayPPIData` → `{date, groupCount, currentIndex, arrayPPIData}` |
| 10 | ECG raw | `setECGRealtimeDuringHRVEnabled:` | ECG_RawData_V8 (54) | `{arrayEcgRawData, packetID}` |
| 11 | Activity total | `GetTotalActivityDataWithMode:withStartDate:` | TotalActivityData_V8 (25) | steps, calories, distance |
| 12 | Activity detail | `GetDetailActivityDataWithMode:withStartDate:` | DetailActivityData_V8 (26) | per-interval breakdown |
| 13 | Activity mode+METS | `GetActivityModeDataWithMode:withStartDate:needMETS:` | ActivityModeData_V8 (30) | activity type + METS value |
| 14 | RT HR | `manualMeasurementWithDataType:heartRateData_V8` | DeviceMeasurement_HR_V8 (58) | live BPM |
| 15 | RT HRV | `manualMeasurementWithDataType:hrvData_v8` | DeviceMeasurement_HRV_V8 (59) | live HRV |
| 16 | RT SpO2 | `manualMeasurementWithDataType:spo2Data_V8` | DeviceMeasurement_Spo2_V8 (60) | live SpO2 |
| 17 | Auto config | `SetAutomaticHRMonitoring:` | — | mode, interval, schedule, dataType(1-4) |

**Pagination**: mode 0 = start, mode 2 = next 50, mode 0x99 = delete. Check `dataEnd` + count==50.

---

## PART 3: 18 EMOTIONS — MEGA-ALGORITHM

### 3.0 Input Parameters

```objc
@interface WVIRawMetrics : NSObject
// Direct data from device
@property double heartRate;          // BPM (from arrayContinuousHR or DeviceMeasurement_HR)
@property double hrv;                // ms (from arrayHrvData.hrv)
@property double stress;             // 0-100 (from arrayHrvData.stress)
@property double spo2;               // % (from automaticSpo2Data)
@property double temperature;        // °C (from arrayemperatureData.temperature)
@property double systolicBP;         // mmHg (from arrayHrvData.systolicBP)
@property double diastolicBP;        // mmHg (from arrayHrvData.diastolicBP)
@property NSArray *ppiIntervals;     // ms[] (from arrayPPIData)
@property NSArray *sleepQuality;     // sleep phases (from arraySleepQuality)
@property double totalSleepTime;     // min (from totalSleepTime)
@property double steps;              // steps (from TotalActivityData)
@property double calories;           // kcal
@property double activeMins;         // active minutes
@property double mets;               // METS from ActivityMode

// Computed (in WVIMetricNormalizer)
@property double restingHR;          // average nighttime HR (01:00-05:00)
@property double baseTemp;           // personal temperature baseline
@property double ppiRMSSD;           // RMSSD from PPI
@property double ppiCoherence;       // PPI coherence (0-1)
@property WVITrend hrvTrend;         // rising / falling / stable
@end

typedef NS_ENUM(NSInteger, WVITrend) {
    WVITrendFalling = -1,
    WVITrendStable  = 0,
    WVITrendRising  = 1
};
```

### 3.1 Normalization of 10 Metrics (WVIMetricNormalizer)

```objc
// ═══ 1. HR Score ═══
// Closer to resting = better (at rest)
double deltaHR = fabs(m.heartRate - m.restingHR);
double hrScore = MAX(0, MIN(100, 100.0 - deltaHR * 2.5));
// restingHR = average HR during 01:00-05:00 over last 7 days

// ═══ 2. HRV Score ═══
// Age-normalized: HRV decreases with age
// ageMaxHRV: 20-29=74ms, 30-39=62ms, 40-49=52ms, 50-59=42ms, 60+=35ms
double ageMaxHRV = [self ageBasedMaxHRV:personalInfo.age];
double hrvScore = MAX(0, MIN(100, (m.hrv / ageMaxHRV) * 100.0));

// ═══ 3. Stress Score (inverted) ═══
// SDK gives 0-100 (0=calm, 100=stressed). Inverted for WVI.
double stressScore = MAX(0, 100.0 - m.stress);

// ═══ 4. SpO2 Score ═══
// Non-linear scale: <90=0, 90=0, 95=50, 97=70, 98=85, 99=95, 100=100
double spo2Score;
if (m.spo2 >= 98) spo2Score = 80 + (m.spo2 - 98) * 10;
else if (m.spo2 >= 95) spo2Score = 30 + (m.spo2 - 95) * 16.67;
else if (m.spo2 >= 90) spo2Score = (m.spo2 - 90) * 6;
else spo2Score = 0;

// ═══ 5. Temperature Score ═══
// Deviation from personal baseline
double tempDelta = fabs(m.temperature - m.baseTemp);
double tempScore = MAX(0, 100.0 - tempDelta * 40.0);
// baseTemp = average temperature over last 14 days (±0.2 outlier filter)

// ═══ 6. Sleep Score (composite) ═══
// Sleep phases: 0=awake, 1=light, 2=deep (from arraySleepQuality)
double deepPercent = [self deepSleepPercent:m.sleepQuality]; // target: 15-25%
double lightPercent = [self lightSleepPercent:m.sleepQuality]; // target: 50-60%
double totalHours = m.totalSleepTime / 60.0; // target: 7-9h
double continuity = [self sleepContinuity:m.sleepQuality]; // % without awakenings

double deepScore = (deepPercent >= 15 && deepPercent <= 25) ? 100 :
                   MAX(0, 100 - fabs(deepPercent - 20) * 5);
double durationScore = (totalHours >= 7 && totalHours <= 9) ? 100 :
                       MAX(0, 100 - fabs(totalHours - 8) * 20);
double contScore = continuity * 100;

double sleepScore = deepScore * 0.35 + durationScore * 0.40 + contScore * 0.25;

// ═══ 7. Activity Score ═══
// Combination of steps + METS + active minutes
double stepGoal = 10000; // WHO standard
double stepRatio = MIN(1.0, m.steps / stepGoal);
double activeMinRatio = MIN(1.0, m.activeMins / 30.0); // WHO: 30min/day
double metsBonus = MIN(1.0, m.mets / 8.0) * 20; // intensity bonus

double activityScore = MIN(100, stepRatio * 45 + activeMinRatio * 35 + metsBonus);

// ═══ 8. BP Score ═══
// Optimal: 120/80. Each mmHg deviation = -1.5 points
double bpDeviation = fabs(m.systolicBP - 120) + fabs(m.diastolicBP - 80);
double bpScore = MAX(0, 100.0 - bpDeviation * 1.5);

// ═══ 9. PPI Coherence Score ═══
// RMSSD from PPI intervals → normalization
double sumSqDiff = 0;
for (int i = 1; i < m.ppiIntervals.count; i++) {
    double diff = [m.ppiIntervals[i] doubleValue] - [m.ppiIntervals[i-1] doubleValue];
    sumSqDiff += diff * diff;
}
double rmssd = sqrt(sumSqDiff / MAX(1, m.ppiIntervals.count - 1));
double meanPPI = [self average:m.ppiIntervals];
double cv = (meanPPI > 0) ? rmssd / meanPPI : 1.0;
double ppiCoherence = MAX(0, MIN(1, 1.0 - cv * 5.0));
double ppiScore = ppiCoherence * 100;
```

### 3.2 Cascading Emotion Engine (18 Emotions)

```objc
typedef NS_ENUM(NSInteger, WVIEmotionState) {
    // ═══ POSITIVE (5) ═══
    WVIEmotionCalm        = 0,   // Calm — vagal balance
    WVIEmotionRelaxed     = 1,   // Relaxed — parasympathetic dominance
    WVIEmotionJoyful      = 2,   // Joy — positive arousal (dopamine+serotonin)
    WVIEmotionEnergized   = 3,   // Energized — high tone + movement
    WVIEmotionExcited     = 4,   // Excitement/Euphoria — peak positive activation

    // ═══ NEUTRAL/PRODUCTIVE (4) ═══
    WVIEmotionFocused     = 5,   // Focus — controlled arousal
    WVIEmotionMeditative  = 6,   // Meditation — deep parasympathetic + coherence
    WVIEmotionRecovering  = 7,   // Recovery — HRV rising, stress falling
    WVIEmotionDrowsy      = 8,   // Drowsiness — body demands rest

    // ═══ NEGATIVE (7) ═══
    WVIEmotionStressed    = 9,   // Stress — moderate sympathetic activation
    WVIEmotionAnxious     = 10,  // Anxiety — acute hyperactivation
    WVIEmotionAngry       = 11,  // Anger — aggressive activation + BP↑
    WVIEmotionFrustrated  = 12,  // Frustration — stress with HR fluctuations
    WVIEmotionFearful     = 13,  // Fear — sudden HR spike + breath holding
    WVIEmotionSad         = 14,  // Sadness — depression without tachycardia
    WVIEmotionExhausted   = 15,  // Exhaustion — autonomic collapse

    // ═══ PHYSIOLOGICAL (2) ═══
    WVIEmotionPain        = 16,  // Pain/discomfort — HR↑ + stress↑ + temp↑ + no activity
    WVIEmotionFlow        = 17   // Flow state — ideal challenge/skill balance
};
// Total: 18 emotional states
```

#### Full Algorithm with Fuzzy Logic + Temporal Smoothing

```objc
- (WVIEmotionResult *)detectEmotionWithNormalized:(WVINormalizedMetrics)n
                                              raw:(WVIRawMetrics *)m
                                     previousEmotion:(WVIEmotionState)prevEmotion
                                     prevTimestamp:(NSDate *)prevTS {

    double deltaHR = m.heartRate - m.restingHR;
    double tempDelta = m.temperature - m.baseTemp;
    NSMutableArray<WVIEmotionCandidate *> *candidates = [NSMutableArray array];

    // ════════════════════════════════════════════════════════
    // STEP 1: Compute SCORE for each emotion (fuzzy, 0-1)
    // Not binary IF/ELSE — each emotion gets a probability
    // ════════════════════════════════════════════════════════

    // ── ANGRY ──
    // Pattern: sharp HR↑ + BP↑ + HRV↓ + chaotic PPI + temp↑
    {
        double s = 1.0;
        s *= [self sigmoid:m.stress midpoint:65 steepness:0.15];      // stress > 65
        s *= [self sigmoid:deltaHR midpoint:22 steepness:0.12];       // deltaHR > 22
        s *= [self sigmoidInverse:m.hrv midpoint:38 steepness:0.10];  // hrv < 38
        s *= [self sigmoid:m.systolicBP midpoint:130 steepness:0.08]; // BP > 130
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.35 steepness:8.0]; // chaos
        s *= [self sigmoid:tempDelta midpoint:0.2 steepness:5.0];     // temp rising
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionAngry score:s weight:1.0]];
    }

    // ── ANXIOUS ──
    // Pattern: stress↑↑ + HRV↓↓ + PPI chaos + breathing (SpO2↓)
    {
        double s = 1.0;
        s *= [self sigmoid:m.stress midpoint:68 steepness:0.12];
        s *= [self sigmoidInverse:m.hrv midpoint:32 steepness:0.10];
        s *= [self sigmoid:deltaHR midpoint:12 steepness:0.10];
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.28 steepness:8.0];
        s *= [self sigmoidInverse:m.spo2 midpoint:97.5 steepness:2.0]; // shallow breathing
        // Differentiator from ANGRY: BP does not spike
        s *= [self sigmoidInverse:m.systolicBP midpoint:132 steepness:0.05];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionAnxious score:s weight:0.95]];
    }

    // ── STRESSED ──
    // Pattern: moderate stress + HRV↓ + HR slightly elevated
    {
        double s = 1.0;
        s *= [self sigmoid:m.stress midpoint:48 steepness:0.10];
        s *= [self sigmoidInverse:m.hrv midpoint:52 steepness:0.08];
        s *= [self sigmoid:deltaHR midpoint:6 steepness:0.12];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionStressed score:s weight:0.85]];
    }

    // ── SAD ──
    // Pattern: low HRV + NORMAL HR + low activity + poor sleep
    // Key difference from stress: no tachycardia!
    {
        double s = 1.0;
        s *= [self sigmoidInverse:m.hrv midpoint:47 steepness:0.08];
        s *= [self sigmoidInverse:deltaHR midpoint:6 steepness:0.15];   // HR NOT elevated
        s *= [self bellCurve:m.stress center:40 width:20];               // moderate stress
        s *= [self sigmoidInverse:n.activityScore midpoint:35 steepness:0.08];
        s *= [self sigmoidInverse:n.sleepScore midpoint:55 steepness:0.06];
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.42 steepness:6.0];
        s *= [self sigmoidInverse:tempDelta midpoint:0.1 steepness:5.0]; // temp not rising
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionSad score:s weight:0.80]];
    }

    // ── EXHAUSTED ──
    // Pattern: everything at minimum — autonomic system exhausted
    {
        double s = 1.0;
        s *= [self sigmoidInverse:n.sleepScore midpoint:42 steepness:0.08];
        s *= [self sigmoid:m.stress midpoint:32 steepness:0.08];
        s *= [self sigmoidInverse:m.hrv midpoint:42 steepness:0.08];
        s *= [self sigmoidInverse:m.spo2 midpoint:96.5 steepness:1.5];
        s *= [self sigmoidInverse:n.activityScore midpoint:28 steepness:0.10];
        s *= [self sigmoidInverse:deltaHR midpoint:5 steepness:0.15];     // no energy
        s *= [self sigmoidInverse:m.ppiRMSSD midpoint:22 steepness:0.15]; // RMSSD↓↓
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionExhausted score:s weight:0.88]];
    }

    // ── RECOVERING ──
    // Pattern: HRV trend UP + stress declining
    {
        double s = 1.0;
        double trendBonus = (m.hrvTrend == WVITrendRising) ? 1.0 : 0.2;
        s *= trendBonus;
        s *= [self bellCurve:m.stress center:30 width:20];
        s *= [self sigmoid:n.sleepScore midpoint:42 steepness:0.06];
        s *= [self sigmoidInverse:deltaHR midpoint:12 steepness:0.10];
        s *= [self sigmoid:m.ppiCoherence midpoint:0.32 steepness:5.0];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionRecovering score:s weight:0.75]];
    }

    // ── FOCUSED ──
    // Pattern: medium HRV + high PPI coherence + not moving
    {
        double s = 1.0;
        s *= [self bellCurve:m.hrv center:52 width:22];                   // HRV in medium range
        s *= [self bellCurve:m.stress center:32 width:15];                // moderate stress
        s *= [self bellCurve:deltaHR center:10 width:8];                  // HR slightly elevated
        s *= [self sigmoid:m.ppiCoherence midpoint:0.42 steepness:6.0];  // orderly rhythm
        s *= [self sigmoidInverse:n.activityScore midpoint:52 steepness:0.06]; // sitting
        s *= [self sigmoid:m.spo2 midpoint:95.5 steepness:1.5];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionFocused score:s weight:0.78]];
    }

    // ── JOYFUL ──
    // Pattern: high HRV + elevated HR + HIGH coherence
    // Paradox: HR↑ + HRV↑ simultaneously = positive arousal (dopamine+serotonin)
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:52 steepness:0.08];
        s *= [self sigmoidInverse:m.stress midpoint:32 steepness:0.10];
        s *= [self bellCurve:deltaHR center:12 width:10];                 // HR elevated
        s *= [self sigmoid:m.ppiCoherence midpoint:0.52 steepness:6.0];  // high coherence
        s *= [self sigmoid:m.spo2 midpoint:96.5 steepness:1.5];
        s *= [self sigmoid:n.sleepScore midpoint:52 steepness:0.05];
        s *= [self sigmoid:n.activityScore midpoint:38 steepness:0.05];
        s *= [self sigmoid:tempDelta midpoint:-0.1 steepness:3.0];        // temp normal+
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionJoyful score:s weight:0.72]];
    }

    // ── ENERGIZED ──
    // Pattern: high HRV + HIGH activity + HR↑
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:48 steepness:0.08];
        s *= [self sigmoidInverse:m.stress midpoint:38 steepness:0.08];
        s *= [self sigmoid:deltaHR midpoint:8 steepness:0.10];
        s *= [self sigmoid:n.activityScore midpoint:65 steepness:0.06];   // LOTS of movement
        s *= [self sigmoid:m.spo2 midpoint:95.5 steepness:1.5];
        s *= [self sigmoid:n.sleepScore midpoint:48 steepness:0.04];
        s *= [self sigmoid:m.ppiCoherence midpoint:0.38 steepness:5.0];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionEnergized score:s weight:0.80]];
    }

    // ── RELAXED ──
    // Pattern: high HRV + low stress + steady HR + good sleep
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:58 steepness:0.08];
        s *= [self sigmoidInverse:m.stress midpoint:27 steepness:0.10];
        s *= [self sigmoidInverse:deltaHR midpoint:9 steepness:0.12];
        s *= [self sigmoid:n.sleepScore midpoint:58 steepness:0.05];
        s *= [self sigmoid:m.ppiCoherence midpoint:0.48 steepness:6.0];
        s *= [self sigmoid:m.spo2 midpoint:96.5 steepness:1.5];
        s *= [self sigmoidInverse:n.activityScore midpoint:52 steepness:0.05];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionRelaxed score:s weight:0.85]];
    }

    // ── FEARFUL ──
    // Pattern: SUDDEN HR spike + breath holding (SpO2↓) + HRV↓↓
    // Difference from Anxious: rate of HR change (dHR/dt), not absolute
    {
        double s = 1.0;
        double hrAcceleration = [self hrAccelerationFromHistory]; // BPM/min
        s *= [self sigmoid:hrAcceleration midpoint:15 steepness:0.15]; // HR rose by >15 BPM/min
        s *= [self sigmoidInverse:m.hrv midpoint:28 steepness:0.12];
        s *= [self sigmoidInverse:m.spo2 midpoint:96 steepness:2.0];   // breath holding
        s *= [self sigmoid:m.stress midpoint:60 steepness:0.10];
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.20 steepness:10.0]; // maximum chaos
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionFearful score:s weight:0.90]];
    }

    // ── FRUSTRATED ──
    // Pattern: stress + HR FLUCTUATIONS (up and down) + medium BP
    {
        double s = 1.0;
        double hrVariance = [self shortTermHRVariance]; // HR variance over 10 min
        s *= [self sigmoid:m.stress midpoint:45 steepness:0.08];
        s *= [self sigmoid:hrVariance midpoint:8 steepness:0.15];       // HR jumps
        s *= [self sigmoidInverse:m.hrv midpoint:48 steepness:0.08];
        s *= [self bellCurve:m.systolicBP center:125 width:15];          // BP medium (no spike)
        s *= [self bellCurve:deltaHR center:10 width:12];                // HR moderately elevated
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionFrustrated score:s weight:0.76]];
    }

    // ── MEDITATIVE ──
    // Pattern: HRV↑↑ + HR↓↓ + stress <10 + VERY high coherence
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:65 steepness:0.10];           // HRV very high
        s *= [self sigmoidInverse:m.stress midpoint:12 steepness:0.15]; // stress near 0
        s *= [self sigmoidInverse:deltaHR midpoint:3 steepness:0.20];   // HR at resting
        s *= [self sigmoid:m.ppiCoherence midpoint:0.65 steepness:8.0]; // maximum coherence!
        s *= [self sigmoidInverse:n.activityScore midpoint:15 steepness:0.12]; // motionless
        s *= [self sigmoid:m.spo2 midpoint:97 steepness:1.5];           // breathing steady
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionMeditative score:s weight:0.88]];
    }

    // ── DROWSY ──
    // Pattern: HR↓ + HRV↓ + temp↓ + no activity + afternoon time
    {
        double s = 1.0;
        s *= [self sigmoidInverse:deltaHR midpoint:2 steepness:0.15];    // HR low
        s *= [self sigmoidInverse:m.hrv midpoint:45 steepness:0.06];     // HRV also reduced
        s *= [self sigmoidInverse:tempDelta midpoint:-0.1 steepness:4.0]; // temp slightly below normal
        s *= [self sigmoidInverse:n.activityScore midpoint:10 steepness:0.15]; // zero activity
        s *= [self sigmoidInverse:m.stress midpoint:25 steepness:0.08];  // stress low
        // Bonus for afternoon (13:00-16:00) or late (22:00+)
        double timeBonus = [self drowsyTimeBonus:timeOfDay]; // 0.5-1.0
        s *= timeBonus;
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionDrowsy score:s weight:0.74]];
    }

    // ── EXCITED ──
    // Pattern: like Joyful but MORE INTENSE — HR↑↑ + HRV↑ + temp↑ + actScore↑
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:55 steepness:0.10];
        s *= [self sigmoidInverse:m.stress midpoint:25 steepness:0.10];
        s *= [self sigmoid:deltaHR midpoint:18 steepness:0.10];          // HR STRONGLY elevated
        s *= [self sigmoid:m.ppiCoherence midpoint:0.50 steepness:6.0];
        s *= [self sigmoid:m.spo2 midpoint:96.5 steepness:1.5];
        s *= [self sigmoid:n.activityScore midpoint:50 steepness:0.05];
        s *= [self sigmoid:tempDelta midpoint:0.15 steepness:4.0];       // temp elevated
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionExcited score:s weight:0.73]];
    }

    // ── PAIN ──
    // Pattern: HR↑ + stress↑ + HRV↓ + temp↑ + actScore↓ + NOT exercising
    {
        double s = 1.0;
        s *= [self sigmoid:deltaHR midpoint:10 steepness:0.10];
        s *= [self sigmoid:m.stress midpoint:45 steepness:0.08];
        s *= [self sigmoidInverse:m.hrv midpoint:40 steepness:0.08];
        s *= [self sigmoid:tempDelta midpoint:0.3 steepness:4.0];        // temp↑ (inflammation)
        s *= [self sigmoidInverse:n.activityScore midpoint:20 steepness:0.10]; // not moving
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.35 steepness:6.0];
        BOOL notExercising = (currentActivityMode == NONE);
        s *= notExercising ? 1.0 : 0.1;                                  // if exercising — not pain
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionPain score:s weight:0.82]];
    }

    // ── FLOW ──
    // Pattern: ideal balance — HRV at OPTIMUM + stress 25-40 + high coherence
    // + moderate activity. "Zone" where challenge = skill.
    {
        double s = 1.0;
        s *= [self bellCurve:m.hrv center:55 width:15];                  // HRV at optimum (not low, not high)
        s *= [self bellCurve:m.stress center:32 width:10];               // stress in "productive zone"
        s *= [self bellCurve:deltaHR center:8 width:6];                  // HR slightly elevated
        s *= [self sigmoid:m.ppiCoherence midpoint:0.55 steepness:7.0]; // high coherence
        s *= [self sigmoid:m.spo2 midpoint:96.5 steepness:1.5];
        // Flow persists — needs stability > 15 min
        double stabilityBonus = [self emotionStabilityDuration:WVIEmotionFlow] > 900 ? 1.2 : 0.8;
        s *= MIN(1.0, s * stabilityBonus);
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionFlow score:s weight:0.85]];
    }

    // ── CALM (default positive) ──
    // Pattern: everything normal, no pronounced patterns
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:48 steepness:0.06];
        s *= [self sigmoidInverse:m.stress midpoint:32 steepness:0.08];
        s *= [self sigmoidInverse:fabs(deltaHR) midpoint:12 steepness:0.10];
        s *= [self sigmoid:m.spo2 midpoint:95.5 steepness:1.0];
        s *= [self sigmoid:m.ppiCoherence midpoint:0.38 steepness:4.0];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionCalm score:s weight:0.70]];
    }

    // ════════════════════════════════════════════════════════
    // STEP 2: Ranking + Temporal Smoothing
    // ════════════════════════════════════════════════════════

    // Sort by weighted score
    [candidates sortUsingComparator:^(WVIEmotionCandidate *a, WVIEmotionCandidate *b) {
        double scoreA = a.score * a.weight;
        double scoreB = b.score * b.weight;
        return [@(scoreB) compare:@(scoreA)];
    }];

    WVIEmotionCandidate *top = candidates.firstObject;

    // Temporal Smoothing: do not change emotion if < 5 min elapsed
    // and new emotion is not significantly more convincing than previous
    NSTimeInterval elapsed = [NSDate.date timeIntervalSinceDate:prevTS];
    if (elapsed < 300 && top.emotion != prevEmotion) {
        // Need > 30% advantage to switch emotion within < 5 min
        WVIEmotionCandidate *prevCandidate = [self findCandidate:prevEmotion in:candidates];
        double topWeighted = top.score * top.weight;
        double prevWeighted = prevCandidate.score * prevCandidate.weight;
        if (topWeighted < prevWeighted * 1.3) {
            top = prevCandidate; // stay on previous
        }
    }

    // ════════════════════════════════════════════════════════
    // STEP 3: Confidence + Secondary Emotion
    // ════════════════════════════════════════════════════════

    WVIEmotionResult *result = [[WVIEmotionResult alloc] init];
    result.primaryEmotion = top.emotion;
    result.confidence = MIN(1.0, top.score * top.weight);
    result.secondaryEmotion = (candidates.count > 1) ? candidates[1].emotion : top.emotion;
    result.secondaryConfidence = (candidates.count > 1) ?
        MIN(1.0, candidates[1].score * candidates[1].weight) : 0;
    result.allScores = candidates;
    result.description = [self emotionDescription:top.emotion];

    return result;
}

// ═══ Fuzzy Functions ═══

// Sigmoid: smooth transition 0→1 around midpoint
- (double)sigmoid:(double)x midpoint:(double)mid steepness:(double)k {
    return 1.0 / (1.0 + exp(-k * (x - mid)));
}

// Inverse Sigmoid: smooth transition 1→0
- (double)sigmoidInverse:(double)x midpoint:(double)mid steepness:(double)k {
    return 1.0 / (1.0 + exp(k * (x - mid)));
}

// Bell Curve: maximum at center, decay in both directions
- (double)bellCurve:(double)x center:(double)c width:(double)w {
    return exp(-pow(x - c, 2) / (2 * pow(w, 2)));
}
```

### 3.3 Emotion Descriptions for User

```objc
- (NSString *)emotionDescription:(WVIEmotionState)emotion {
    switch (emotion) {
        // Positive
        case WVIEmotionCalm:       return @"😌 Calm — nervous system in balance";
        case WVIEmotionRelaxed:    return @"🧘 Relaxed — deep parasympathetic rest";
        case WVIEmotionJoyful:     return @"😊 Joy — positive activation, dopamine + serotonin";
        case WVIEmotionEnergized:  return @"⚡ Energized — high tone, excellent form";
        case WVIEmotionExcited:    return @"🎉 Excitement — peak positive energy";
        // Neutral
        case WVIEmotionFocused:    return @"🎯 Focus — controlled productive tension";
        case WVIEmotionMeditative: return @"🕉 Meditation — deep coherence, clear mind";
        case WVIEmotionRecovering: return @"🔄 Recovery — body recovering from load";
        case WVIEmotionDrowsy:     return @"😴 Drowsy — body requesting rest";
        // Negative
        case WVIEmotionStressed:   return @"😰 Stress — sympathetic activated, heightened readiness";
        case WVIEmotionAnxious:    return @"😱 Anxiety — nervous hyperactivation, breathe deeper";
        case WVIEmotionAngry:      return @"😤 Anger — aggressive activation, needs release";
        case WVIEmotionFrustrated: return @"😣 Frustration — rising tension, change focus";
        case WVIEmotionFearful:    return @"😨 Fear — acute reaction, you are safe";
        case WVIEmotionSad:        return @"😔 Low mood — low energy, take care of yourself";
        case WVIEmotionExhausted:  return @"😩 Exhaustion — resources depleted, rest needed";
        // Physiological
        case WVIEmotionPain:       return @"🤕 Discomfort — body signaling a problem";
        case WVIEmotionFlow:       return @"🌊 Flow state — peak performance, do not get distracted";
    }
}
```

---

## PART 3B: MEGA ACTIVITY DETECTION ENGINE — Full Activity Breakdown

### 3B.0 Philosophy: EVERY SECOND we know what the person is doing

V8 device provides: HR (every 5 min), HRV, steps, stress, SpO2, temperature, PPI, sleep phases, METS.
From the COMBINATION of these data + time of day + history → we detect 50+ activity types.

### 3B.1 Full Activity Taxonomy (50 Types)

```objc
typedef NS_ENUM(NSInteger, WVIActivityType) {

    // ══════════════════════════════════════════════
    // CATEGORY A: SLEEP (5 types)
    // ══════════════════════════════════════════════
    WVIActivityDeepSleep        = 0,   // Deep sleep (N3): HRV↑↑, HR↓↓, no movement
    WVIActivityLightSleep       = 1,   // Light sleep (N1-N2): HRV medium, rare micro-movements
    WVIActivityREMSleep         = 2,   // REM phase: HRV irregular, HR fluctuates, PPI chaotic
    WVIActivityNap              = 3,   // Nap (<90 min, daytime)
    WVIActivityFallingAsleep    = 4,   // Falling asleep: HR↓ gradually, HRV↑ gradually

    // ══════════════════════════════════════════════
    // CATEGORY B: REST / PASSIVE (7 types)
    // ══════════════════════════════════════════════
    WVIActivityResting          = 5,   // Resting lying down (awake): HR at resting, steps=0
    WVIActivitySittingRelaxed   = 6,   // Sitting relaxed (TV, reading): HR↓, stress↓
    WVIActivitySittingWorking   = 7,   // Sitting working (mental load): HR slightly↑, stress↑
    WVIActivityStanding         = 8,   // Standing still: HR slightly higher than sitting
    WVIActivityLyingAwake       = 9,   // Lying awake: HR at resting, stress can vary
    WVIActivityPhoneScrolling   = 10,  // Phone scrolling: stress↑ micro-spikes, steps=0
    WVIActivityWatchingScreen   = 11,  // Screen time (TV/movies): HR stable, stress from content

    // ══════════════════════════════════════════════
    // CATEGORY C: WALKING (5 types)
    // ══════════════════════════════════════════════
    WVIActivityStroll           = 12,  // Stroll (<3.5 km/h, <60 steps/min): relaxation
    WVIActivityWalkNormal       = 13,  // Normal walking (3.5-5 km/h, 60-90 steps/min)
    WVIActivityWalkBrisk        = 14,  // Brisk walking (5-7 km/h, 90-120 steps/min): aerobic
    WVIActivityHiking           = 15,  // Hiking: extended walking + HR zone 2-3
    WVIActivityNordicWalking    = 16,  // Nordic walking: HR zone 2-3 + rhythmic pace

    // ══════════════════════════════════════════════
    // CATEGORY D: RUNNING (5 types)
    // ══════════════════════════════════════════════
    WVIActivityJogging          = 17,  // Light jog (>120 steps/min, HR zone 2-3)
    WVIActivityRunTempo         = 18,  // Tempo run (HR zone 3-4, stable rhythm)
    WVIActivityRunInterval      = 19,  // Interval run (HR alternates zone 2↔4-5)
    WVIActivitySprinting        = 20,  // Sprint (HR zone 5, >160 steps/min, <2 min)
    WVIActivityTrailRunning     = 21,  // Trail (HR fluctuates due to terrain, prolonged)

    // ══════════════════════════════════════════════
    // CATEGORY E: CYCLING / CARDIO MACHINES (4 types)
    // ══════════════════════════════════════════════
    WVIActivityCycling          = 22,  // Cycling: HR zone 2-4, steps=0, prolonged
    WVIActivityStationaryBike   = 23,  // Stationary bike: same pattern, indoors
    WVIActivityElliptical       = 24,  // Elliptical: HR zone 2-3, steps ~80-100/min (arms moving)
    WVIActivityRowing           = 25,  // Rowing: rhythmic HR, few steps, interval pattern

    // ══════════════════════════════════════════════
    // CATEGORY F: STRENGTH / GYM (5 types)
    // ══════════════════════════════════════════════
    WVIActivityWeightTraining   = 26,  // Weight training: HR interval (set→rest→set)
    WVIActivityBodyweight       = 27,  // Bodyweight (push-ups, pull-ups): interval HR
    WVIActivityCrossfit         = 28,  // CrossFit: HR zone 4-5 prolonged + intervals
    WVIActivityHIIT             = 29,  // HIIT: HR sharply 1↔5 zone every 20-60 sec
    WVIActivityCircuitTraining  = 30,  // Circuit: HR medium-high stable

    // ══════════════════════════════════════════════
    // CATEGORY G: FLEXIBILITY / MIND-BODY (5 types)
    // ══════════════════════════════════════════════
    WVIActivityYogaVinyasa      = 31,  // Vinyasa yoga: HR zone 1-2, rhythmic, HRV↑
    WVIActivityYogaHot          = 32,  // Hot yoga: HR zone 2-3, temp↑↑, SpO2 may↓
    WVIActivityPilates          = 33,  // Pilates: HR zone 1-2, controlled
    WVIActivityStretching       = 34,  // Stretching: HR at resting, HRV↑
    WVIActivityMeditation       = 35,  // Meditation: HR↓↓, HRV↑↑, PPI coherence↑↑, stress→0

    // ══════════════════════════════════════════════
    // CATEGORY H: SPORTS GAMES (7 types)
    // ══════════════════════════════════════════════
    WVIActivityFootball         = 36,  // Football: HR alternates zone 2-5, many steps, irregular rhythm
    WVIActivityBasketball       = 37,  // Basketball: fast sprints + rest, HR 3-5
    WVIActivityTennis           = 38,  // Tennis: interval (rally→pause), HR 2-4
    WVIActivityBadminton        = 39,  // Badminton: quick dashes, HR 2-4
    WVIActivitySwimming         = 40,  // Swimming: HR zone 2-4, steps=0, SpO2↓ briefly
    WVIActivityMartialArts      = 41,  // Martial arts: HR 3-5, interval, stress↑
    WVIActivityDancing          = 42,  // Dancing: HR 2-4, rhythmic steps, HRV may↑

    // ══════════════════════════════════════════════
    // CATEGORY I: DAILY (6 types)
    // ══════════════════════════════════════════════
    WVIActivityHousework        = 43,  // Housework: irregular steps, HR zone 1-2
    WVIActivityCooking          = 44,  // Cooking: standing, few steps, hand temp↑
    WVIActivityDriving          = 45,  // Driving: sitting, stress may↑, steps=0
    WVIActivityCommuting        = 46,  // Commuting: sitting/standing, micro-stress
    WVIActivityShopping         = 47,  // Shopping: slow walking + frequent stops
    WVIActivityEating           = 48,  // Eating: HR↑ by 5-15 BPM (thermogenesis), temp↑

    // ══════════════════════════════════════════════
    // CATEGORY J: PHYSIOLOGICAL EVENTS (7 types)
    // ══════════════════════════════════════════════
    WVIActivityStressEvent      = 49,  // Stress event: HR↑ + stress↑ + steps=0
    WVIActivityPanicAttack      = 50,  // Panic attack: HR↑↑ sharply + SpO2↓ + HRV↓↓ + steps=0
    WVIActivityCrying           = 51,  // Crying: HR↑ moderately + irregular breathing (SpO2 fluctuations)
    WVIActivityLaughing         = 52,  // Laughing: HR↑ briefly + PPI chaos + stress↓
    WVIActivityPain             = 53,  // Pain episode: HR↑ + stress↑ + temp↑ + steps=0
    WVIActivityIllness          = 54,  // Illness: temp↑↑ + HR↑ + HRV↓ + SpO2↓ + actScore↓
    WVIActivityIntimacy         = 55,  // Intimacy: HR↑↑ gradually → peak → sharp↓

    // ══════════════════════════════════════════════
    // CATEGORY K: RECOVERY (4 types)
    // ══════════════════════════════════════════════
    WVIActivityWarmUp           = 56,  // Warm-up: HR gradually↑ from resting to zone 2
    WVIActivityCoolDown         = 57,  // Cool-down: HR gradually↓ from zone 3+ to resting
    WVIActivityActiveRecovery   = 58,  // Active recovery: HR zone 1, light walking
    WVIActivityPassiveRecovery  = 59,  // Passive rest: lying, HRV↑, HR→resting

    // ══════════════════════════════════════════════
    // CATEGORY L: MENTAL (4 types)
    // ══════════════════════════════════════════════
    WVIActivityDeepWork         = 60,  // Deep work: stress 25-45, HR slightly↑, steps=0, >45min
    WVIActivityPresentation     = 61,  // Presentation: stress↑↑ + HR↑↑ + standing
    WVIActivityExam             = 62,  // Exam/test: stress↑↑ + HR↑ + sitting + prolonged
    WVIActivityCreativeFlow     = 63   // Creative flow: stress 20-35, HRV↑, PPI coherence↑
};
// Total: 64 activity types (0-63)
```
```

### 3B.2 Load Levels

```objc
typedef NS_ENUM(NSInteger, WVILoadLevel) {
    WVILoadNone     = 0,   // No load (sleep, rest)
    WVILoadMinimal  = 1,   // Minimal (sitting, standing)
    WVILoadLight    = 2,   // Light (walking, housework)
    WVILoadModerate = 3,   // Moderate (brisk walking, yoga)
    WVILoadHigh     = 4,   // High (running, cycling, gym)
    WVILoadIntense  = 5,   // Intense (HIIT, sprint)
    WVILoadExtreme  = 6    // Extreme (HR > 90% maxHR > 10 min)
};

typedef NS_ENUM(NSInteger, WVILoadTarget) {
    WVILoadTargetCardio      = 0,   // Cardiovascular
    WVILoadTargetMuscular    = 1,   // Muscular
    WVILoadTargetMental      = 2,   // Mental (stress, concentration)
    WVILoadTargetMixed       = 3    // Combined
};
```

### 3B.3 Activity Analysis Result

```objc
@interface WVIActivityResult : NSObject
@property WVIActivityType activityType;         // What is being done
@property WVILoadLevel loadLevel;               // Load level 0-6
@property WVILoadTarget loadTarget;             // Load target
@property double loadScore;                     // Numeric load 0-100
@property double confidence;                    // 0-1
@property NSString *activityDescription;        // Text description
@property double caloriesPerMinute;             // Calories burned/min
@property double heartRateZone;                 // Heart rate zone 1-5
@property double durationMinutes;               // Duration of current activity
@property double cumulativeLoadToday;           // Accumulated daily load (TRIMP)

// Heart rate zones
@property double hrZone1Mins;  // 50-60% maxHR (recovery)
@property double hrZone2Mins;  // 60-70% maxHR (fat burn)
@property double hrZone3Mins;  // 70-80% maxHR (aerobic)
@property double hrZone4Mins;  // 80-90% maxHR (anaerobic)
@property double hrZone5Mins;  // 90-100% maxHR (VO2max)
@end
```

### 3B.4 MEGA-ALGORITHM for Activity Detection (64 Types)

#### Input Signals for Detection

```objc
@interface WVIActivitySignals : NSObject
// Direct data
@property double heartRate;             // current BPM
@property double restingHR;             // nighttime average BPM
@property double maxHR;                 // 208 - 0.7 * age
@property double hrReserve;             // maxHR - restingHR
@property double hrPercent;             // (HR - restingHR) / hrReserve * 100
@property int hrZone;                   // 0-5

@property double hrv;                   // ms
@property double stress;                // 0-100
@property double spo2;                  // %
@property double temperature;           // °C
@property double baseTemp;              // personal baseline
@property double ppiCoherence;          // 0-1
@property double ppiRMSSD;              // ms

// Steps and movement
@property double stepsPerMin;           // steps over last 5 min / 5
@property double stepCadence;           // step rhythmicity (0-1)
@property double totalStepsToday;       // total for day

// Derivatives (computed)
@property double deltaHR;              // HR - restingHR
@property double hrAcceleration;       // dHR/dt (BPM/min, rate of change)
@property double shortTermHRVariance;  // HR variance over 10 min
@property double hrIntervalPattern;    // 0=stable, 1=interval (set/rest)
@property double hrRampDirection;      // -1=decreasing, 0=stable, 1=increasing
@property double breathingRate;        // approximate from PPI
@property double breathingRegularity;  // 0=chaotic, 1=rhythmic

// Time and context
@property int hour;                    // 0-23
@property int dayOfWeek;               // 0-6
@property double minutesSinceLastActivity; // min since last activity change
@property WVIActivityType previousActivity; // previous activity

// SDK data
@property ACTIVITYMODE_V8 sdkActivityMode; // if SDK is tracking
@property WORKMODE_V8 sdkWorkMode;         // start/pause/stop
@property double mets;                     // METS from SDK
@end
```

#### Full Cascading Algorithm

```objc
- (WVIActivityResult *)detectActivity:(WVIActivitySignals *)s {

    WVIActivityResult *result = [[WVIActivityResult alloc] init];
    result.heartRateZone = s.hrZone;

    // ═══════════════════════════════════════════════════════
    // LEVEL 0: SDK ACTIVITY MODE (if device is tracking)
    // Confidence: 0.95 — trust the device
    // ═══════════════════════════════════════════════════════

    if (s.sdkWorkMode == startActivity || s.sdkWorkMode == continueActivity) {
        result.activityType = [self mapSDKToActivity:s.sdkActivityMode hrZone:s.hrZone];
        result.confidence = 0.95;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL 1: CRITICAL / EMERGENCY STATES
    // Check FIRST — health is more important than classification
    // ═══════════════════════════════════════════════════════

    // ── PANIC ATTACK ──
    // Sharp HR↑↑ (>40 BPM in <2 min) + SpO2↓ + HRV↓↓ + no movement
    if (s.hrAcceleration > 20 && s.deltaHR > 40 && s.spo2 < 96
        && s.hrv < 20 && s.stepsPerMin < 2 && s.ppiCoherence < 0.15) {
        result.activityType = WVIActivityPanicAttack;
        result.confidence = 0.88;
        result.loadLevel = WVILoadHigh;
        result.loadTarget = WVILoadTargetMental;
        result.isEmergency = YES;
        result.alertMessage = @"⚠️ Possible panic attack. Breathe: 4 sec inhale, 7 sec exhale";
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ILLNESS / FEVER ──
    // temp > 38°C + HR↑ + HRV↓ + SpO2↓ + actScore↓
    if (s.temperature > 38.0 && s.deltaHR > 10 && s.hrv < 35
        && s.spo2 < 96 && s.stepsPerMin < 3) {
        result.activityType = WVIActivityIllness;
        result.confidence = 0.85;
        result.loadLevel = WVILoadNone;
        result.alertMessage = @"🌡 Elevated temperature + altered readings";
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── PAIN EPISODE ──
    // HR↑ + stress↑↑ + temp↑ (local inflammation) + steps=0 + NOT exercising
    if (s.stress > 60 && s.deltaHR > 12 && (s.temperature - s.baseTemp) > 0.3
        && s.stepsPerMin < 2 && s.hrv < 30 && s.previousActivity != WVIActivityWeightTraining) {
        result.activityType = WVIActivityPain;
        result.confidence = 0.72;
        result.loadLevel = WVILoadMinimal;
        result.loadTarget = WVILoadTargetMixed;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL 2: SLEEP (priority by time of day)
    // ═══════════════════════════════════════════════════════

    BOOL isSleepWindow = (s.hour >= 21 || s.hour < 8);
    BOOL sleepSignals = (s.stepsPerMin < 1 && s.deltaHR < 8 && s.stress < 30);

    if (isSleepWindow && sleepSignals) {

        // ── FALLING ASLEEP ──
        // HR gradually↓ + HRV gradually↑ + previous activity not sleep
        if (s.hrRampDirection < -0.3 && s.previousActivity != WVIActivityDeepSleep
            && s.previousActivity != WVIActivityLightSleep
            && s.previousActivity != WVIActivityREMSleep) {
            result.activityType = WVIActivityFallingAsleep;
            result.confidence = 0.78;
        }
        // ── DEEP SLEEP (N3) ──
        // HRV↑↑ + HR at minimum + PPI coherence↑↑ + absolute stillness
        else if (s.hrv > 55 && s.deltaHR < 3 && s.ppiCoherence > 0.55
                 && s.stepsPerMin == 0 && s.breathingRegularity > 0.7) {
            result.activityType = WVIActivityDeepSleep;
            result.confidence = 0.90;
        }
        // ── REM PHASE ──
        // HRV irregular (fluctuates) + HR fluctuates + PPI chaotic
        // REM: parasympathetic disengages periodically
        else if (s.shortTermHRVariance > 5 && s.ppiCoherence < 0.35
                 && s.stepsPerMin < 0.5 && s.hrv < 45) {
            result.activityType = WVIActivityREMSleep;
            result.confidence = 0.72;
        }
        // ── LIGHT SLEEP (N1-N2) ──
        else {
            result.activityType = WVIActivityLightSleep;
            result.confidence = 0.85;
        }

        result.loadLevel = WVILoadNone;
        result.loadTarget = WVILoadTargetCardio;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── NAP ──
    if (!isSleepWindow && s.stepsPerMin == 0 && s.deltaHR < 3 && s.stress < 15
        && s.hrv > 50 && s.minutesSinceLastActivity > 10
        && (s.hour >= 12 && s.hour <= 16)) {
        result.activityType = WVIActivityNap;
        result.confidence = 0.65;
        result.loadLevel = WVILoadNone;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL 3: HIGH-INTENSITY WORKOUTS
    // (HR zone 4-5, determine TYPE)
    // ═══════════════════════════════════════════════════════

    if (s.hrZone >= 4) {

        // ── SPRINT ──
        // >150 steps/min + HR zone 5 + <3 min
        if (s.stepsPerMin > 150 && s.hrZone == 5 && s.minutesSinceLastActivity < 3) {
            result.activityType = WVIActivitySprinting;
            result.confidence = 0.90;
            result.loadLevel = WVILoadExtreme;
        }
        // ── HIIT ──
        // HR sharply alternates zone 1↔5 every 20-60 sec
        else if (s.hrIntervalPattern > 0.7 && s.shortTermHRVariance > 20) {
            result.activityType = WVIActivityHIIT;
            result.confidence = 0.82;
            result.loadLevel = WVILoadExtreme;
        }
        // ── CROSSFIT ──
        // HR zone 4-5 prolonged (>10min) + interval + irregular steps
        else if (s.minutesSinceLastActivity > 10 && s.hrIntervalPattern > 0.4
                 && s.stepsPerMin > 20 && s.stepsPerMin < 80) {
            result.activityType = WVIActivityCrossfit;
            result.confidence = 0.68;
            result.loadLevel = WVILoadExtreme;
        }
        // ── BASKETBALL / FOOTBALL ──
        // Fast sprints + rest + many steps + irregular rhythm
        else if (s.hrIntervalPattern > 0.5 && s.stepsPerMin > 40 && s.stepCadence < 0.5) {
            // Irregular step = team sport
            if (s.stepsPerMin > 80) {
                result.activityType = WVIActivityFootball;
            } else {
                result.activityType = WVIActivityBasketball;
            }
            result.confidence = 0.55; // low — hard to distinguish
            result.loadLevel = WVILoadIntense;
        }
        // ── MARTIAL ARTS ──
        // HR 4-5 + stress↑ + few steps + interval
        else if (s.stress > 50 && s.stepsPerMin < 30 && s.hrIntervalPattern > 0.5) {
            result.activityType = WVIActivityMartialArts;
            result.confidence = 0.55;
            result.loadLevel = WVILoadIntense;
        }
        // ── INTERVAL RUN ──
        // Steps > 120 + HR alternates 2↔5
        else if (s.stepsPerMin > 120 && s.hrIntervalPattern > 0.4) {
            result.activityType = WVIActivityRunInterval;
            result.confidence = 0.78;
            result.loadLevel = WVILoadIntense;
        }
        // ── TEMPO RUN ──
        // Steps > 130 + HR stable in zone 4
        else if (s.stepsPerMin > 130 && s.shortTermHRVariance < 5) {
            result.activityType = WVIActivityRunTempo;
            result.confidence = 0.80;
            result.loadLevel = WVILoadHigh;
        }
        // ── FALLBACK: Intense workout without steps = cycling / rowing
        else if (s.stepsPerMin < 10) {
            if (s.hrIntervalPattern > 0.3) {
                result.activityType = WVIActivityRowing;
                result.confidence = 0.50;
            } else {
                result.activityType = WVIActivityCycling;
                result.confidence = 0.55;
            }
            result.loadLevel = WVILoadHigh;
        }
        else {
            result.activityType = WVIActivityCircuitTraining;
            result.confidence = 0.50;
            result.loadLevel = WVILoadHigh;
        }

        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL 4: MODERATE WORKOUTS (HR zone 2-3)
    // ═══════════════════════════════════════════════════════

    if (s.hrZone >= 2 && s.hrZone <= 3) {

        // ── JOGGING (light) ──
        if (s.stepsPerMin > 120 && s.stepCadence > 0.7) {
            result.activityType = WVIActivityJogging;
            result.confidence = 0.85;
            result.loadLevel = WVILoadModerate;
        }
        // ── TRAIL ──
        // Running + HR fluctuates (terrain) + prolonged (>30 min)
        else if (s.stepsPerMin > 100 && s.shortTermHRVariance > 8
                 && s.minutesSinceLastActivity > 30) {
            result.activityType = WVIActivityTrailRunning;
            result.confidence = 0.60;
            result.loadLevel = WVILoadHigh;
        }
        // ── BRISK WALKING ──
        else if (s.stepsPerMin >= 90 && s.stepsPerMin < 120) {
            result.activityType = WVIActivityWalkBrisk;
            result.confidence = 0.85;
            result.loadLevel = WVILoadModerate;
        }
        // ── HIKING ──
        // Walking + HR zone 2-3 + prolonged (>60 min)
        else if (s.stepsPerMin >= 50 && s.stepsPerMin < 90
                 && s.minutesSinceLastActivity > 60) {
            result.activityType = WVIActivityHiking;
            result.confidence = 0.60;
            result.loadLevel = WVILoadModerate;
        }
        // ── DANCING ──
        // Rhythmic steps + HR zone 2-3 + HRV may↑ (enjoyment)
        else if (s.stepsPerMin > 50 && s.stepCadence > 0.6 && s.hrv > 45) {
            result.activityType = WVIActivityDancing;
            result.confidence = 0.50;
            result.loadLevel = WVILoadModerate;
        }
        // ── CYCLING / ELLIPTICAL ──
        else if (s.stepsPerMin < 15 && s.minutesSinceLastActivity > 5) {
            if (s.stepsPerMin > 5) {
                result.activityType = WVIActivityElliptical;
                result.confidence = 0.50;
            } else {
                result.activityType = WVIActivityStationaryBike;
                result.confidence = 0.50;
            }
            result.loadLevel = WVILoadModerate;
        }
        // ── STRENGTH (set + rest) ──
        else if (s.stepsPerMin < 10 && s.hrIntervalPattern > 0.4) {
            result.activityType = WVIActivityWeightTraining;
            result.confidence = 0.70;
            result.loadLevel = WVILoadHigh;
        }
        // ── BADMINTON / TENNIS ──
        else if (s.stepsPerMin > 20 && s.stepsPerMin < 60 && s.hrIntervalPattern > 0.3) {
            if (s.hrIntervalPattern > 0.5) {
                result.activityType = WVIActivityTennis;
            } else {
                result.activityType = WVIActivityBadminton;
            }
            result.confidence = 0.45;
            result.loadLevel = WVILoadModerate;
        }
        // ── HOT YOGA ──
        // HR zone 2-3 + temp↑↑ + few steps + HRV normal
        else if (s.stepsPerMin < 5 && (s.temperature - s.baseTemp) > 0.8 && s.hrv > 40) {
            result.activityType = WVIActivityYogaHot;
            result.confidence = 0.55;
            result.loadLevel = WVILoadModerate;
        }
        // ── SWIMMING ──
        // HR zone 2-4 + steps=0 + SpO2↓ briefly (breath holding during strokes)
        else if (s.stepsPerMin == 0 && s.spo2 < 97 && s.breathingRegularity < 0.4) {
            result.activityType = WVIActivitySwimming;
            result.confidence = 0.50;
            result.loadLevel = WVILoadHigh;
        }
        else {
            // FALLBACK: normal walking
            result.activityType = WVIActivityWalkNormal;
            result.confidence = 0.60;
            result.loadLevel = WVILoadLight;
        }

        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL 5: LIGHT ACTIVITY (HR zone 1 or below)
    // ═══════════════════════════════════════════════════════

    // ── WARM-UP ──
    // HR gradually rises from resting to zone 2 + started <5 min ago
    if (s.hrRampDirection > 0.5 && s.hrZone <= 1 && s.minutesSinceLastActivity < 5
        && (s.previousActivity == WVIActivitySittingRelaxed
            || s.previousActivity == WVIActivityStanding)) {
        result.activityType = WVIActivityWarmUp;
        result.confidence = 0.70;
        result.loadLevel = WVILoadLight;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── COOL-DOWN ──
    // HR gradually decreases from zone 3+ to resting + previous activity = workout
    if (s.hrRampDirection < -0.3 && [self isPreviousActivityExercise:s.previousActivity]) {
        result.activityType = WVIActivityCoolDown;
        result.confidence = 0.75;
        result.loadLevel = WVILoadLight;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ACTIVE RECOVERY ──
    // HR zone 1 + light steps + after workout
    if (s.hrZone == 1 && s.stepsPerMin > 20 && s.stepsPerMin < 60
        && [self isPreviousActivityExercise:s.previousActivity]) {
        result.activityType = WVIActivityActiveRecovery;
        result.confidence = 0.72;
        result.loadLevel = WVILoadLight;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── MEDITATION ──
    if (s.hrv > 60 && s.stress < 12 && s.deltaHR < 3 && s.ppiCoherence > 0.60
        && s.stepsPerMin < 1 && s.breathingRegularity > 0.75) {
        result.activityType = WVIActivityMeditation;
        result.confidence = 0.85;
        result.loadLevel = WVILoadMinimal;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── YOGA / PILATES / STRETCHING ──
    if (s.stepsPerMin < 5 && s.hrZone <= 1 && s.hrv > 50) {
        if (s.ppiCoherence > 0.55 && s.breathingRegularity > 0.6) {
            result.activityType = WVIActivityYogaVinyasa;
            result.confidence = 0.55;
        } else if (s.deltaHR > 3) {
            result.activityType = WVIActivityPilates;
            result.confidence = 0.45;
        } else {
            result.activityType = WVIActivityStretching;
            result.confidence = 0.55;
        }
        result.loadLevel = WVILoadLight;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── WALKING (various types) ──
    if (s.stepsPerMin > 0) {
        if (s.stepsPerMin > 60 && s.stepsPerMin < 90) {
            result.activityType = WVIActivityWalkNormal;
            result.confidence = 0.82;
            result.loadLevel = WVILoadLight;
        } else if (s.stepsPerMin >= 30 && s.stepsPerMin <= 60) {
            // Slow stroll or shopping (frequent stops)
            if (s.stepCadence < 0.4) {
                result.activityType = WVIActivityShopping;
                result.confidence = 0.45;
            } else {
                result.activityType = WVIActivityStroll;
                result.confidence = 0.70;
            }
            result.loadLevel = WVILoadLight;
        } else if (s.stepsPerMin > 5 && s.stepsPerMin < 30) {
            result.activityType = WVIActivityHousework;
            result.confidence = 0.55;
            result.loadLevel = WVILoadLight;
        }
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL 6: MOTIONLESS (steps=0, HR < zones)
    // Determine WHAT is being done while sitting/lying
    // ═══════════════════════════════════════════════════════

    // ── INTIMACY ──
    // HR↑↑ gradually → peak → sharp↓ + stress↓ + lying + night
    if (s.deltaHR > 25 && s.hrRampDirection > 0.5 && s.stress < 40
        && s.stepsPerMin == 0 && (s.hour >= 21 || s.hour < 2)) {
        result.activityType = WVIActivityIntimacy;
        result.confidence = 0.50; // sensitive topic, low confidence
        result.loadLevel = WVILoadModerate;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── LAUGHING ──
    // HR↑ briefly (2-3 min) + PPI chaos + stress↓ + stepsPerMin=0
    if (s.deltaHR > 5 && s.deltaHR < 20 && s.ppiCoherence < 0.3
        && s.stress < 25 && s.stepsPerMin == 0 && s.minutesSinceLastActivity < 3) {
        result.activityType = WVIActivityLaughing;
        result.confidence = 0.45;
        result.loadLevel = WVILoadMinimal;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── CRYING ──
    // HR↑ moderately + irregular breathing (SpO2 fluctuations) + stress↑
    if (s.deltaHR > 5 && s.breathingRegularity < 0.3 && s.stress > 40
        && s.stepsPerMin == 0 && s.spo2 < 98) {
        result.activityType = WVIActivityCrying;
        result.confidence = 0.40;
        result.loadLevel = WVILoadMinimal;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── STRESS EVENT ──
    if (s.stress > 55 && s.deltaHR > 15 && s.stepsPerMin < 2 && s.hrv < 35) {
        result.activityType = WVIActivityStressEvent;
        result.confidence = 0.78;
        result.loadLevel = WVILoadModerate;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── PRESENTATION ──
    // stress↑↑ + HR↑↑ + standing (no steps, but upright)
    if (s.stress > 50 && s.deltaHR > 15 && s.stepsPerMin < 5
        && s.hour >= 9 && s.hour <= 18) {
        result.activityType = WVIActivityPresentation;
        result.confidence = 0.45;
        result.loadLevel = WVILoadModerate;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── EXAM / HIGH MENTAL LOAD ──
    if (s.stress > 45 && s.deltaHR > 8 && s.stepsPerMin == 0
        && s.minutesSinceLastActivity > 30) {
        result.activityType = WVIActivityExam;
        result.confidence = 0.40;
        result.loadLevel = WVILoadModerate;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── EATING ──
    BOOL mealTime = (s.hour>=7 && s.hour<=9) || (s.hour>=12 && s.hour<=14) || (s.hour>=18 && s.hour<=20);
    if (mealTime && s.deltaHR > 5 && s.deltaHR < 18 && s.stepsPerMin < 3
        && (s.temperature - s.baseTemp) > 0.1 && s.stress < 35) {
        result.activityType = WVIActivityEating;
        result.confidence = 0.55;
        result.loadLevel = WVILoadMinimal;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── CREATIVE FLOW ──
    // stress 20-35 + HRV↑ + PPI coherence↑ + sitting + prolonged > 45 min
    if (s.stress >= 20 && s.stress <= 35 && s.hrv > 50 && s.ppiCoherence > 0.50
        && s.stepsPerMin == 0 && s.minutesSinceLastActivity > 45) {
        result.activityType = WVIActivityCreativeFlow;
        result.confidence = 0.55;
        result.loadLevel = WVILoadLight;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── DEEP WORK ──
    // stress 25-45 + HR slightly↑ + steps=0 + >45 min
    if (s.stress >= 25 && s.stress <= 50 && s.deltaHR > 3 && s.deltaHR < 15
        && s.stepsPerMin == 0 && s.minutesSinceLastActivity > 30) {
        result.activityType = WVIActivityDeepWork;
        result.confidence = 0.60;
        result.loadLevel = WVILoadLight;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── DRIVING ──
    // Sitting + stress varies + HR stable + working hours
    if (s.stepsPerMin == 0 && s.deltaHR > 3 && s.deltaHR < 12
        && s.stress > 15 && s.stress < 45 && s.shortTermHRVariance < 4) {
        result.activityType = WVIActivityDriving;
        result.confidence = 0.40;
        result.loadLevel = WVILoadMinimal;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── PASSIVE RECOVERY ──
    // Lying + HRV↑ + HR→resting + after workout
    if (s.deltaHR < 5 && s.hrv > 55 && s.stepsPerMin == 0
        && [self isPreviousActivityExercise:s.previousActivity]) {
        result.activityType = WVIActivityPassiveRecovery;
        result.confidence = 0.72;
        result.loadLevel = WVILoadNone;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── SITTING WORKING vs SITTING RELAXED ──
    if (s.stepsPerMin == 0) {
        if (s.stress > 25 && s.deltaHR > 5) {
            result.activityType = WVIActivitySittingWorking;
            result.confidence = 0.70;
            result.loadTarget = WVILoadTargetMental;
        } else if (s.stress < 20 && s.hrv > 50) {
            result.activityType = WVIActivitySittingRelaxed;
            result.confidence = 0.75;
        } else if (s.deltaHR < 3 && s.stress < 15) {
            result.activityType = WVIActivityLyingAwake;
            result.confidence = 0.60;
        } else {
            result.activityType = WVIActivityStanding;
            result.confidence = 0.45;
        }
        result.loadLevel = WVILoadMinimal;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══ ABSOLUTE FALLBACK ═══
    result.activityType = WVIActivityResting;
    result.confidence = 0.30;
    result.loadLevel = WVILoadNone;
    [self enrichResult:result withSignals:s];
    return result;
}
```

### 3B.5 Load Score and TRIMP Calculation

```objc
// Load Score: how heavy the current load is (0-100)
- (void)calculateLoadScore:(WVIActivityResult *)result
                    withHR:(double)hr maxHR:(double)maxHR mets:(double)mets {

    double hrPercent = hr / maxHR;

    // Banister's TRIMP per minute (Training Impulse)
    // TRIMP = duration * deltaHR * e^(b * deltaHR)
    // b = 1.92 (male) or 1.67 (female)
    double b = 1.92; // TODO: from personalInfo.gender
    double deltaHRratio = hrPercent - 0.5; // normalization from 50% maxHR
    double trimpPerMin = MAX(0, deltaHRratio) * exp(b * MAX(0, deltaHRratio));

    // Load Score: TRIMP normalization to 0-100
    // trimpPerMin ~0 (rest) to ~3.5 (maximum load)
    result.loadScore = MIN(100, trimpPerMin * 28.5);

    // Calories burned/min (approximate, via METS or HR)
    if (mets > 0) {
        // METs formula: Cal/min = METs * weight_kg * 3.5 / 200
        result.caloriesPerMinute = mets * 75.0 * 3.5 / 200.0; // TODO: actual weight
    } else {
        // Formula via HR (Keytel et al. 2005)
        result.caloriesPerMinute = MAX(0, (-55.0969 + 0.6309 * hr + 0.0901 * 75
                                           + 0.2017 * 30) / 4.184); // TODO: age/weight
    }
}

// TRIMP: accumulated daily load
- (double)calculateDailyTRIMP:(NSArray<WVIActivityResult *> *)activityHistory {
    double totalTRIMP = 0;
    for (WVIActivityResult *ar in activityHistory) {
        totalTRIMP += ar.loadScore * ar.durationMinutes / 100.0;
    }
    return totalTRIMP;
    // Norms: <50 light day, 50-100 medium, 100-200 heavy, >200 overload
}
```

### 3B.6 Heart Rate Zones and Time in Zones

```objc
// Calculate time in each heart rate zone per day
- (void)updateHRZones:(WVIActivityResult *)result
             withHR:(double)hr maxHR:(double)maxHR
           duration:(double)minutes {

    double hrPercent = (hr / maxHR) * 100;

    if (hrPercent >= 90)      result.hrZone5Mins += minutes; // VO2max
    else if (hrPercent >= 80) result.hrZone4Mins += minutes; // Anaerobic
    else if (hrPercent >= 70) result.hrZone3Mins += minutes; // Aerobic
    else if (hrPercent >= 60) result.hrZone2Mins += minutes; // Fat Burn
    else if (hrPercent >= 50) result.hrZone1Mins += minutes; // Recovery
}

// Recommended distribution (80/20 rule):
// Zones 1-2: 80% of time (aerobic base)
// Zones 3-5: 20% of time (intensity)
- (double)trainingBalanceScore:(WVIActivityResult *)result {
    double total = result.hrZone1Mins + result.hrZone2Mins +
                   result.hrZone3Mins + result.hrZone4Mins + result.hrZone5Mins;
    if (total < 10) return 50; // insufficient data

    double lowIntensity = (result.hrZone1Mins + result.hrZone2Mins) / total;
    double highIntensity = (result.hrZone3Mins + result.hrZone4Mins + result.hrZone5Mins) / total;

    // Ideal: 80% low / 20% high
    double balance = 100 - fabs(lowIntensity - 0.80) * 200;
    return MAX(0, MIN(100, balance));
}
```

### 3B.7 Activity ↔ Emotion ↔ WVI Connection

```objc
// Activity affects emotion interpretation:
// - High HR + Running = NORMAL (not stress!)
// - High HR + Sitting = STRESS
// - High HR + Sitting + night = ANXIETY

// Activity affects WVI weights:
// - Workout: wHR decreases (high HR = ok), wSpO2 increases
// - Sleep: wSleep maximum, wActivity = 0
// - Work: wStress and wEmotion increase

// Load affects AI recommendations:
// - TRIMP > 200: "Overtraining! Rest day needed"
// - TRIMP < 20 (3 consecutive days): "Lack of movement, try a walk"
// - Zone 5 > 30 min: "Reduce intensity for heart health"
```

### 3B.8 enrichResult — Enriching Result with Full Breakdown

```objc
- (void)enrichResult:(WVIActivityResult *)result withSignals:(WVIActivitySignals *)s {

    // Load
    [self calculateLoadScore:result withHR:s.heartRate maxHR:s.maxHR mets:s.mets];
    result.loadTarget = [self loadTargetFromActivityType:result.activityType];

    // Calories
    result.caloriesPerMinute = [self caloriesPerMin:s];

    // Daily TRIMP (accumulated load)
    result.cumulativeLoadToday = [self dailyTRIMP];

    // Heart rate zones
    [self updateHRZones:result withHR:s.heartRate maxHR:s.maxHR duration:5.0];

    // Description
    result.activityDescription = [self activityDescription:result.activityType];
    result.activityEmoji = [self activityEmoji:result.activityType];
    result.activityCategory = [self activityCategory:result.activityType];

    // Activity-contextual recommendation
    result.contextualAdvice = [self adviceForActivity:result.activityType
                                          withSignals:s
                                               result:result];
}

// Categories for grouping
- (NSString *)activityCategory:(WVIActivityType)type {
    if (type <= 4)  return @"💤 Sleep";
    if (type <= 11) return @"🪑 Rest";
    if (type <= 16) return @"🚶 Walking";
    if (type <= 21) return @"🏃 Running";
    if (type <= 25) return @"🚴 Cardio Machines";
    if (type <= 30) return @"🏋️ Strength";
    if (type <= 35) return @"🧘 Mind-Body";
    if (type <= 42) return @"⚽ Sports";
    if (type <= 48) return @"🏠 Daily";
    if (type <= 55) return @"⚡ Physiological";
    if (type <= 59) return @"🔄 Recovery";
    return @"🧠 Mental";
}

// Emoji for each type
- (NSString *)activityEmoji:(WVIActivityType)type {
    NSArray *emojis = @[
        @"😴",@"💤",@"🌙",@"😪",@"🥱",  // Sleep
        @"🛋",@"📺",@"💻",@"🧍",@"🛏",@"📱",@"🎬", // Rest
        @"🚶",@"🚶",@"🏃‍♂️",@"🥾",@"🏔",  // Walking
        @"🏃",@"🏃‍♀️",@"⚡",@"💨",@"🏔",  // Running
        @"🚴",@"🚲",@"🔄",@"🚣",          // Cardio
        @"🏋️",@"💪",@"🏋️‍♀️",@"⚡",@"🔁", // Strength
        @"🧘",@"🔥",@"🤸",@"🙆",@"🕉",    // Mind-Body
        @"⚽",@"🏀",@"🎾",@"🏸",@"🏊",@"🥊",@"💃", // Sports
        @"🧹",@"👨‍🍳",@"🚗",@"🚌",@"🛍",@"🍽", // Daily
        @"😰",@"😱",@"😢",@"😂",@"🤕",@"🤒",@"❤️‍🔥", // Physiological
        @"🏃‍♂️",@"🧊",@"🚶‍♂️",@"😌",      // Recovery
        @"🧠",@"🎤",@"📝",@"🎨"           // Mental
    ];
    return (type < emojis.count) ? emojis[type] : @"❓";
}

// Contextual recommendation
- (NSString *)adviceForActivity:(WVIActivityType)type
                    withSignals:(WVIActivitySignals *)s
                         result:(WVIActivityResult *)r {

    // Overtraining
    if (r.cumulativeLoadToday > 200 && r.loadLevel >= WVILoadHigh) {
        return @"⚠️ Daily load already high. Recommend reducing intensity.";
    }

    // Too long in zone 5
    if (r.hrZone5Mins > 20) {
        return @"🔴 Over 20 min in max zone. Lower pace for safety.";
    }

    // Sitting too long
    if (type == WVIActivitySittingWorking && s.minutesSinceLastActivity > 60) {
        return @"🪑 Over an hour without movement. Stand up, walk for 5 minutes.";
    }

    // Sleep deficit + workout
    if (r.loadLevel >= WVILoadHigh && [self lastNightSleepScore] < 50) {
        return @"😴 Poor sleep last night. Reduce load by 20-30%.";
    }

    // Dehydration (HR↑ unexplained)
    if (s.deltaHR > 15 && s.stress < 30 && type == WVIActivitySittingRelaxed) {
        return @"💧 HR elevated at rest. Possible dehydration — drink water.";
    }

    return nil; // no special recommendations
}
```

### 3B.9 Full Activity Breakdown — Report Format

```
🏃 FULL ACTIVITY BREAKDOWN • {time}
═══════════════════════════════════

📍 NOW:
🏃‍♀️ Tempo Run (80%)
📊 Load: 72/100 — HIGH (Cardio)
⏱ Duration: 34 min
🔥 Burn: 11.4 kcal/min (388 kcal per session)

❤️ HEART RATE:
💓 HR: 162 BPM (82% of max 197)
🏋️ Zone: 4 (Anaerobic)
📈 Trend: stable

📊 ZONES FOR DAY:
💤 Outside zones: 8h 12m (sleep + rest)
🟦 Z1 Recovery (50-60%): 45 min
🟩 Z2 Fat Burn (60-70%): 32 min
🟨 Z3 Aerobic (70-80%): 28 min
🟧 Z4 Anaerobic (80-90%): 34 min ← NOW
🟥 Z5 VO2max (90-100%): 3 min

📈 DAILY LOAD:
🔵 TRIMP: 142 (HEAVY DAY)
⚖️ 80/20 Balance: 55% low / 45% high → too much intensity
🔥 Workout Calories: 620 kcal
👣 Steps: 12,340

🗓 DAY HISTORY:
💤 00:00-06:45 — Sleep (6h 45m, deep 22%)
😌 06:45-07:15 — Rest (waking up)
🍽 07:15-07:45 — Eating
💻 07:45-12:00 — Computer work
🍽 12:00-12:30 — Lunch
💻 12:30-17:00 — Work (deep work 2.5h!)
🏃‍♂️ 17:15-17:25 — Warm-up
🏃‍♀️ 17:25-NOW — Tempo Run (34 min)

💡 RECOMMENDATION:
😴 Night sleep was shorter than goal (6.75h vs target 8h).
Limit workout to 45 min for optimal recovery.
```

---

## PART 4: WVI SCORE — CALCULATION

### 4.1 Adaptive Weights (Context-Dependent)

```objc
- (double)calculateWVIWithMetrics:(WVINormalizedMetrics)n
                      timeOfDay:(int)hour
                    isExercising:(BOOL)exercising {

    // Base weights (10 metrics, sum = 1.0)
    double wHRV = 0.18, wStress = 0.15, wSleep = 0.13, wEmotion = 0.12;
    double wSpO2 = 0.09, wHR = 0.09, wActivity = 0.08, wBP = 0.06, wTemp = 0.05, wPPI = 0.05;

    // Adaptation by time of day
    if (hour >= 22 || hour < 6) {
        // Night: sleep and temperature more important, activity unimportant
        wSleep = 0.25; wTemp = 0.08; wActivity = 0.03;
        wHRV = 0.20; wStress = 0.16;
    } else if (hour >= 6 && hour < 10) {
        // Morning: HRV and post-sleep recovery are critical
        wHRV = 0.28; wSleep = 0.18; wStress = 0.15;
        wActivity = 0.05;
    } else if (hour >= 10 && hour < 18) {
        // Work day: stress and focus
        wStress = 0.22; wHRV = 0.20; wActivity = 0.12;
    }

    // Adaptation during exercise
    if (exercising) {
        wHR = 0.05;        // high HR — normal
        wActivity = 0.15;  // activity = goal
        wSpO2 = 0.15;      // oxygen is critical
    }

    // Weight normalization (sum = 1.0)
    double totalW = wHRV + wStress + wSleep + wSpO2 + wHR + wActivity + wBP + wTemp + wPPI;

    // 10th metric: Emotional Wellbeing (from 24h emotion history)
    double emotionScore = [self emotionalWellbeingScore:emotionHistory24h];

    double wvi = (n.hrvScore * wHRV + n.stressScore * wStress + n.sleepScore * wSleep +
                  emotionScore * wEmotion + n.spo2Score * wSpO2 + n.heartRateScore * wHR +
                  n.activityScore * wActivity + n.bpScore * wBP +
                  n.temperatureScore * wTemp + n.ppiCoherenceScore * wPPI)
                 / totalW;

    // Emotion Feedback Loop: current emotion adjusts final WVI
    wvi = [self applyEmotionFeedback:wvi emotion:currentEmotion confidence:emotionConfidence];

    return MAX(0, MIN(100, wvi));
}
```

### 4.2 Emotion → WVI Feedback Loop (Bidirectional)

```objc
// Emotion ADJUSTS final WVI
// Positive emotions = bonus, negative = penalty
- (double)applyEmotionFeedback:(double)rawWVI emotion:(WVIEmotionState)emotion confidence:(double)conf {

    // Emotion Multiplier: how much emotion affects overall wellbeing
    double emotionMultiplier;
    switch (emotion) {
        // Positive — bonus up to +12%
        case WVIEmotionFlow:       emotionMultiplier = 1.12; break; // Flow = peak performance
        case WVIEmotionMeditative: emotionMultiplier = 1.10; break; // Meditation = deep recovery
        case WVIEmotionJoyful:     emotionMultiplier = 1.08; break;
        case WVIEmotionExcited:    emotionMultiplier = 1.06; break;
        case WVIEmotionEnergized:  emotionMultiplier = 1.05; break;
        case WVIEmotionRelaxed:    emotionMultiplier = 1.04; break;
        case WVIEmotionCalm:       emotionMultiplier = 1.02; break;

        // Neutral — minimal impact
        case WVIEmotionFocused:    emotionMultiplier = 1.03; break;
        case WVIEmotionRecovering: emotionMultiplier = 1.00; break;
        case WVIEmotionDrowsy:     emotionMultiplier = 0.97; break;

        // Negative — penalty up to -15%
        case WVIEmotionStressed:   emotionMultiplier = 0.95; break;
        case WVIEmotionFrustrated: emotionMultiplier = 0.93; break;
        case WVIEmotionSad:        emotionMultiplier = 0.91; break;
        case WVIEmotionAnxious:    emotionMultiplier = 0.88; break;
        case WVIEmotionAngry:      emotionMultiplier = 0.87; break;
        case WVIEmotionPain:       emotionMultiplier = 0.86; break;
        case WVIEmotionFearful:    emotionMultiplier = 0.85; break;
        case WVIEmotionExhausted:  emotionMultiplier = 0.85; break;
    }

    // Impact strength depends on confidence: more confident = stronger correction
    double adjustedMultiplier = 1.0 + (emotionMultiplier - 1.0) * conf;

    // Emotion duration amplifies effect: >1h negative = increased penalty
    double duration = [self currentEmotionDurationMinutes];
    if (emotionMultiplier < 1.0 && duration > 60) {
        // Chronic negative: penalty amplified by 20%
        adjustedMultiplier = 1.0 + (adjustedMultiplier - 1.0) * 1.2;
    }
    if (emotionMultiplier > 1.0 && duration > 30) {
        // Sustained positive: bonus amplified by 15%
        adjustedMultiplier = 1.0 + (adjustedMultiplier - 1.0) * 1.15;
    }

    double finalWVI = rawWVI * adjustedMultiplier;
    return MAX(0, MIN(100, finalWVI));
}
```

### 4.3 Emotional Wellbeing Sub-Score (10th WVI Metric)

```objc
// Adding 10th metric: Emotional Wellbeing Score
// Computed from emotional history over last 24h
- (double)emotionalWellbeingScore:(NSArray<WVIEmotionResult *> *)emotionHistory24h {
    if (emotionHistory24h.count == 0) return 50; // no data = neutral

    double totalWeighted = 0;
    double totalWeight = 0;

    for (WVIEmotionResult *er in emotionHistory24h) {
        double emotionValue;
        switch (er.primaryEmotion) {
            case WVIEmotionFlow:       emotionValue = 100; break;
            case WVIEmotionMeditative: emotionValue = 95; break;
            case WVIEmotionJoyful:     emotionValue = 90; break;
            case WVIEmotionExcited:    emotionValue = 85; break;
            case WVIEmotionEnergized:  emotionValue = 85; break;
            case WVIEmotionRelaxed:    emotionValue = 80; break;
            case WVIEmotionCalm:       emotionValue = 75; break;
            case WVIEmotionFocused:    emotionValue = 72; break;
            case WVIEmotionRecovering: emotionValue = 60; break;
            case WVIEmotionDrowsy:     emotionValue = 50; break;
            case WVIEmotionStressed:   emotionValue = 35; break;
            case WVIEmotionFrustrated: emotionValue = 30; break;
            case WVIEmotionSad:        emotionValue = 25; break;
            case WVIEmotionAnxious:    emotionValue = 20; break;
            case WVIEmotionAngry:      emotionValue = 18; break;
            case WVIEmotionPain:       emotionValue = 15; break;
            case WVIEmotionFearful:    emotionValue = 12; break;
            case WVIEmotionExhausted:  emotionValue = 10; break;
        }

        // More recent measurements weigh more (exponential decay)
        double hoursAgo = -[er.timestamp timeIntervalSinceNow] / 3600.0;
        double recencyWeight = exp(-hoursAgo * 0.15); // half-life ~4.6h

        totalWeighted += emotionValue * er.confidence * recencyWeight;
        totalWeight += er.confidence * recencyWeight;
    }

    return (totalWeight > 0) ? totalWeighted / totalWeight : 50;
}
```

### 4.4 WVI Scale

```
95-100: 🟣 SUPERB — peak form, all systems optimal
85-94:  🟢 EXCELLENT — high level of wellbeing
70-84:  🔵 GOOD — stable state with minor growth areas
55-69:  🟡 MODERATE — noticeable deviations, worth attention
40-54:  🟠 NEEDS ATTENTION — several metrics in red zone
25-39:  🔴 CRITICAL — immediate action needed
0-24:   ⚫ DANGEROUS — multiple critical deviations
```

---

## PART 5: AI INTERPRETATION (Claude API)

### 5.1 AI Prompt for Data Analysis

Every 30 min (or on emotion change) send to Claude Sonnet via API:

```
You are a WVI AI analyst (Genius Layer: Doctor + Psychologist + Neuroscientist).

USER DATA:
- WVI: {score}/100 ({level})
- Emotion: {emotion} (confidence: {conf})
- Secondary: {secondary} ({secConf})
- HR: {hr} BPM (resting: {restHR}), delta: {deltaHR}
- HRV: {hrv} ms (trend: {trend}), age norm: {ageMax}
- Stress: {stress}/100
- SpO2: {spo2}%
- Temperature: {temp}°C (baseline: {baseTemp})
- BP: {sys}/{dia} mmHg
- Sleep: {sleepScore}/100 (deep {deep}%, {totalH}h)
- Activity: {actScore}/100 ({steps} steps, {activeMins} min)
- PPI coherence: {coherence}

HISTORY (last 6h):
{wviHistory}

TASK:
1. Interpret current state (2-3 sentences)
2. Explain WHY this specific emotion was detected
3. Give 3 specific actions right now
4. Forecast WVI in 3h at current trend
5. If anomalies exist — specify what is wrong
```

### 5.2 Telegram Response Format

```
🔵 WVI REPORT • {time}
═══════════════════════════════════

💎 WVI: 78/100 — GOOD
😊 Emotion: Joy (85%)
🔄 Secondary: Energized (62%)

📊 Metrics:
❤️ Heart Rate: 72 BPM (norm 64)
🧠 HRV: 58 ms ↑ (excellent for age 32)
😰 Stress: 22/100 — low
🫁 SpO2: 98%
🌡 Temperature: 36.5°C
💉 Blood Pressure: 118/76
😴 Sleep: 82/100 (7.2h, 22% deep)
🏃 Activity: 65/100 (7,240 steps)
💓 PPI coherence: 0.62

🤖 AI Analytics:
{claude_interpretation}

⚡ Recommendations:
1. {action_1}
2. {action_2}
3. {action_3}

📈 WVI Forecast in 3h: ~{predicted}
```

---

## PART 6: TREND ANALYZER

```objc
@interface WVITrendAnalyzer : NSObject

// Trends for different periods
- (WVITrendReport *)analyze24hTrend:(NSArray<WVIResult *> *)history;
- (WVITrendReport *)analyze7dTrend:(NSArray<WVIResult *> *)history;
- (WVITrendReport *)analyze30dTrend:(NSArray<WVIResult *> *)history;

// Circadian pattern: when WVI peaks / bottoms
- (WVICircadianPattern *)detectCircadianPattern:(NSArray<WVIResult *> *)history30d;

// Anomalies
- (NSArray<WVIAnomaly *> *)detectAnomalies:(WVIResult *)current
                                   history:(NSArray<WVIResult *> *)history;

// Prediction
- (double)predictWVIIn:(NSTimeInterval)seconds
           fromHistory:(NSArray<WVIResult *> *)history;

@end

// Prediction: exponential smoothing + trend
- (double)predictWVIIn:(NSTimeInterval)seconds
           fromHistory:(NSArray<WVIResult *> *)history {
    if (history.count < 3) return history.lastObject.wviScore;

    // Double exponential smoothing (Holt)
    double alpha = 0.3; // level smoothing
    double beta = 0.1;  // trend smoothing

    double level = history[0].wviScore;
    double trend = 0;

    for (int i = 1; i < history.count; i++) {
        double prevLevel = level;
        level = alpha * history[i].wviScore + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    double periodsAhead = seconds / 1800.0; // 30min = 1 period
    double predicted = level + trend * periodsAhead;
    return MAX(0, MIN(100, predicted));
}
```

---

## PART 7: ALERT SYSTEM

```objc
// Critical alerts → immediately to Telegram
typedef NS_ENUM(NSInteger, WVIAlertLevel) {
    WVIAlertInfo     = 0,  // informational
    WVIAlertWarning  = 1,  // warning
    WVIAlertCritical = 2,  // critical
    WVIAlertEmergency = 3  // emergency
};

// Alert rules:
// WVI < 25                    → EMERGENCY: "⚫ WVI critically low!"
// WVI < 40                    → CRITICAL: "🔴 WVI needs attention"
// SpO2 < 92                   → EMERGENCY: "🫁 SpO2 dangerously low!"
// HR > restingHR + 50 (at rest) → CRITICAL: "❤️ Abnormal tachycardia"
// HR < 45                     → CRITICAL: "❤️ Bradycardia"
// Temp > 38.0                 → WARNING: "🌡 Elevated temperature"
// Stress > 85 (>30 min)       → WARNING: "😰 Prolonged stress"
// WVI drop > 25 in 1h         → CRITICAL: "📉 Sharp WVI drop"
// Emotion = Anxious (>1h)     → WARNING: "😱 Prolonged anxiety"
```

---

## PART 8: AUTO-MONITORING SETUP

```objc
// On first device connection — optimal configuration for WVI
- (void)setupAutoMonitoringForWVI {
    MyWeeks_V8 allDays = {YES, YES, YES, YES, YES, YES, YES};

    // HR every 5 min (for accurate trend analysis)
    MyAutomaticMonitoring_V8 hr = {
        .mode = 2, .dataType = 1, .intervalTime = 5,
        .startTime_Hour = 0, .endTime_Hour = 23,
        .startTime_Minutes = 0, .endTime_Minutes = 59,
        .weeks = allDays
    };

    // HRV every 15 min (key WVI metric)
    MyAutomaticMonitoring_V8 hrv = {
        .mode = 2, .dataType = 4, .intervalTime = 15,
        .startTime_Hour = 0, .endTime_Hour = 23,
        .weeks = allDays
    };

    // SpO2 every 30 min
    MyAutomaticMonitoring_V8 spo2 = {
        .mode = 2, .dataType = 2, .intervalTime = 30,
        .startTime_Hour = 0, .endTime_Hour = 23,
        .weeks = allDays
    };

    // Temperature every 30 min
    MyAutomaticMonitoring_V8 temp = {
        .mode = 2, .dataType = 3, .intervalTime = 30,
        .startTime_Hour = 0, .endTime_Hour = 23,
        .weeks = allDays
    };

    // Send all configurations to device
    [self sendConfig:hr]; [self sendConfig:hrv];
    [self sendConfig:spo2]; [self sendConfig:temp];
}
```

---

---

## PART 10: WVI PRODUCT PIPELINES

### 10.1 Main Pipeline (Data → WVI → Output)

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 1: REALTIME WVI (every 5 min)                ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [1] BLE SYNC ─────────────────────────────────────────  ║
║      │ GetContinuousHRDataWithMode:0                     ║
║      │ GetHRVDataWithMode:0                              ║
║      │ GetAutomaticSpo2DataWithMode:0                    ║
║      │ GetTemperatureDataWithMode:0                      ║
║      │ GetPPIDataWithMode:0                              ║
║      │ (parallel: all requests simultaneously)               ║
║      ▼                                                   ║
║  [2] NORMALIZE ────────────────────────────────────────  ║
║      │ 10 metrics → 0-100                                 ║
║      │ restingHR, baseTemp, RMSSD, coherence, trends     ║
║      ▼                                                   ║
║  [3] DETECT (parallel) ───────────────────────────────── ║
║      │ ┌─ EmotionEngine: 18 emotions (fuzzy cascade)      ║
║      │ ├─ ActivityDetector: 23 types + TRIMP + HR zones   ║
║      │ └─ AnomalyDetector: outliers, pattern violations  ║
║      ▼                                                   ║
║  [4] SCORE ────────────────────────────────────────────  ║
║      │ WVI = weighted(10 metrics) * emotionFeedback      ║
║      │ + activityContext adjustment                       ║
║      ▼                                                   ║
║  [5] AI INTERPRET ─────────────────────────────────────  ║
║      │ Claude Sonnet → cause + recommendations            ║
║      │ 8 perspectives (Genius Layer)                     ║
║      ▼                                                   ║
║  [6] OUTPUT ───────────────────────────────────────────  ║
║      ├─ Push Notification (if alert)                   ║
║      ├─ Local Storage (history)                          ║
║      └─ UI Update (dashboard)                              ║
╚══════════════════════════════════════════════════════════╝
```

### 10.2 Report Pipeline (Daily/Weekly)

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 2: WVI REPORT                                  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [1] AGGREGATE ────────────────────────────────────────  ║
║      │ Collect all WVI results for period (24h/7d/30d)    ║
║      │ Averages, min, max, trends for each metric         ║
║      │ Emotion heatmap (hour × day)                      ║
║      │ Activity breakdown (TRIMP, zones, types)            ║
║      ▼                                                   ║
║  [2] ANALYZE ──────────────────────────────────────────  ║
║      │ ┌─ Trend Analysis (Holt exponential smoothing)    ║
║      │ ├─ Circadian Pattern (when WVI peaks/bottoms)          ║
║      │ ├─ Correlation Matrix (which metrics are correlated)     ║
║      │ ├─ Anomaly Report (what was unusual)           ║
║      │ └─ Prediction (forecast for next period)       ║
║      ▼                                                   ║
║  [3] AI DEEP ANALYSIS ────────────────────────────────── ║
║      │ Claude Opus (extended context):               ║
║      │ ├─ Root cause analysis: why WVI changed        ║
║      │ ├─ Pattern recognition: hidden patterns    ║
║      │ ├─ Personalized insights: what is unique for YOU  ║
║      │ └─ Action plan: 5 specific steps for the week      ║
║      ▼                                                   ║
║  [4] GENERATE ─────────────────────────────────────────  ║
║      ├─ PDF Report (8-12 pages, premium design)        ║
║      │   • Executive Summary + WVI Score Card             ║
║      │   • Emotion Heatmap + Activity Timeline            ║
║      │   • Metric Trends (charts)                         ║
║      │   • AI Insights + Recommendations                  ║
║      ├─ HTML Dashboard (interactive)                    ║
║      │   • Live gauges, charts, sparklines                ║
║      │   • Emotion wheel, activity map                    ║
║      └─ Summary (for push/notification)                   ║
╚══════════════════════════════════════════════════════════╝
```

### 10.3 Calibration Pipeline (Every 14 Days)

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 3: SELF-CALIBRATION                            ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [1] Recalculate restingHR (average HR 01:00-05:00)     ║
║  [2] Recalculate baseTemp (median over 14d)               ║
║  [3] Recalculate ageBasedMaxHRV                          ║
║  [4] Recalculate maxHR (Tanaka: 208 - 0.7*age)          ║
║  [5] Update emotion thresholds based on personal  ║
║      data (if user HRV is consistently > norm →   ║
║      shift midpoints up)                           ║
║  [6] Update correlation weights: if THIS          ║
║      user has sleep↔stress correlation 0.9 →          ║
║      increase wSleep                                    ║
║  [7] Validation: compare WVI with self-reported mood        ║
║      (if user reports) → fine-tune emotion    ║
║      weights                                             ║
╚══════════════════════════════════════════════════════════╝
```

### 10.4 Training Advisor Pipeline

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 4: TRAINING ADVISOR                            ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  INPUT: current WVI + yesterday's TRIMP + sleep + emotion  ║
║                                                          ║
║  RULES:                                                  ║
║  ├─ WVI > 80 + sleepScore > 70 + yesterday TRIMP < 100      ║
║  │   → "✅ Ready for intense workout (Zone 3-4)"    ║
║  ├─ WVI 60-80 + normal sleep                           ║
║  │   → "🟡 Moderate load (Zone 2-3)"               ║
║  ├─ WVI < 60 OR sleepScore < 50 OR yesterday TRIMP > 200    ║
║  │   → "🔴 Light activity or rest only (Zone 1)" ║
║  ├─ Emotion = Exhausted/Sad/Pain                         ║
║  │   → "⛔ Active rest: 20 min walk or yoga"     ║
║  └─ Emotion = Energized/Joyful + WVI > 85                ║
║      → "🚀 Peak form! Perfect day for records"  ║
║                                                          ║
║  OUTPUT:                                                 ║
║  ├─ Recommended workout type                         ║
║  ├─ Target heart rate zone                               ║
║  ├─ Recommended duration                           ║
║  └─ Warnings (overtraining, sleep deficit)             ║
╚══════════════════════════════════════════════════════════╝
```

### 10.5 Health Risk Pipeline

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 5: HEALTH RISK ASSESSMENT                      ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [1] Health VaR (Value at Risk):                         ║
║      P(WVI drop > 20pts in 24h) = ?                      ║
║      Based on WVI volatility over last 30d       ║
║                                                          ║
║  [2] Drawdown Monitor:                                   ║
║      If WVI dropped > 15% in 3 days → ALERT                ║
║      If WVI < personal_minimum → CRITICAL              ║
║                                                          ║
║  [3] Correlation Matrix:                                 ║
║      Which metrics are strongly correlated for THIS user?  ║
║      Example: sleep↔stress = 0.85, activity↔mood = 0.72  ║
║      → Recommendation: "Improve sleep — stress will drop on its own"   ║
║                                                          ║
║  [4] Anomaly Detection:                                  ║
║      Z-score of each metric vs personal history           ║
║      |Z| > 2.5 → anomaly → AI investigates cause        ║
║                                                          ║
║  [5] Chronic Risk Flags:                                 ║
║      stress > 60 (>7 days) → "Chronic stress"       ║
║      sleepScore < 50 (>5 days) → "Chronic sleep deficit"   ║
║      WVI trend ↓ (>14 days) → "Systemic deterioration"     ║
║      SpO2 < 95 (>3 readings) → "Consult a doctor"        ║
╚══════════════════════════════════════════════════════════╝
```

### 10.6 Systems Dynamics Pipeline (What-If Analysis)

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 6: FEEDBACK LOOPS & SIMULATION                 ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  3 main health feedback loops:                   ║
║                                                          ║
║  LOOP 1 (Positive spiral):                            ║
║  Exercise↑ → Sleep↑ → Stress↓ → HRV↑ → Energy↑          ║
║  → More Exercise → ... (reinforcing loop)               ║
║                                                          ║
║  LOOP 2 (Negative spiral):                            ║
║  Poor Sleep → Stress↑ → Inflammation(temp↑) → Pain       ║
║  → Less Activity → Worse Sleep → ... (suppressing loop) ║
║                                                          ║
║  LOOP 3 (Mental):                                    ║
║  Meditation → HRV↑ → Emotional Balance → Focus↑          ║
║  → Productivity → Joy → Motivation → More Meditation     ║
║                                                          ║
║  SIMULATION (Claude + formulas):                          ║
║  "If adding 30 min daily walking" →               ║
║     Day 1-3: activityScore +15, slight HR↑                ║
║     Day 4-7: sleepScore +8, stress -5                     ║
║     Day 7-14: HRV +3ms, WVI +6 points                    ║
║     Day 14-30: new baseline, emotion shift → Energized   ║
║                                                          ║
║  OUTPUT: "In 14 days WVI will increase by ~6 points,      ║
║  dominant emotion will shift from Stressed to Focused/Calm"   ║
╚══════════════════════════════════════════════════════════╝
```

### 10.7 Full Product Feature Map

```
WVI Product Features:
├── CORE ENGINE
│   ├── 10 metrics → WVI Score (0-100)
│   ├── 18 emotions (Fuzzy Logic + AI)
│   ├── 64 activity types (auto-detection)
│   ├── 7 load levels + TRIMP
│   ├── 5 heart rate zones
│   └── Emotion ↔ WVI feedback loop
│
├── AI LAYER
│   ├── 8 AI perspectives (Genius Layer)
│   ├── Personalized recommendations
│   ├── Forecasting (Holt smoothing)
│   ├── Root cause analysis
│   └── What-if simulation
│
├── REPORTS
│   ├── PDF (premium, 8-12 pages)
│   ├── HTML Dashboard (interactive)
│   ├── Daily/Weekly summary
│   └── Doctor/Coach export
│
├── ALERTS
│   ├── 4 levels (Info → Emergency)
│   ├── 9 trigger rules
│   ├── Push notifications
│   └── Chronic risk flags
│
├── TRAINING ADVISOR
│   ├── Training recommendations
│   ├── Target heart rate zones
│   ├── Recovery management
│   └── Overtraining prevention
│
├── RISK ASSESSMENT
│   ├── Health VaR
│   ├── Drawdown monitor
│   ├── Correlation matrix
│   ├── Anomaly detection
│   └── Chronic risk flags
│
├── SELF-CALIBRATION
│   ├── Auto-calibration every 14d
│   ├── Personal norms
│   ├── Adaptive emotion thresholds
│   └── User feedback learning
│
└── DATA LAYER
    ├── V8 BLE SDK (17 endpoints)
    ├── Auto-monitoring setup
    ├── Pagination + sync
    ├── Local storage (privacy-first)
    └── Export (CSV/JSON/PDF)
```

---

## PART 11: SWAGGER API — Full WVI REST Architecture

### 11.0 Server Architecture

```
WVI API Server (Node.js / Express or FastAPI)
├── Port: 8080
├── Base URL: /api/v1
├── Auth: Bearer JWT
├── Docs: /api/v1/docs (Swagger UI)
├── Format: JSON
└── Versioning: URL-based (/v1, /v2)

Components:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Mobile App  │────▶│   WVI API    │────▶│  PostgreSQL  │
│  (iOS + BLE)  │     │  (REST)      │     │  (TimescaleDB│
└──────────────┘     │              │     │   for time-  │
                     │  /api/v1/*   │     │   series)    │
┌──────────────┐     │              │     └──────────────┘
│  Web Dashboard│────▶│              │     ┌──────────────┐
│  (React)     │     │              │────▶│  Redis       │
└──────────────┘     │              │     │  (cache +    │
                     │              │     │   realtime)  │
┌──────────────┐     │              │     └──────────────┘
│  Claude AI   │◀────│              │     ┌──────────────┐
│  (Claude API)│     │              │────▶│  S3/Minio    │
└──────────────┘     └──────────────┘     │  (reports)   │
                                          └──────────────┘
```

### 11.1 Swagger OpenAPI Spec

```yaml
openapi: 3.1.0
info:
  title: WVI — Wellness Vitality Index API
  description: |
    Mega-API for collecting biometric data, calculating WVI,
    detecting 18 emotions, 64 activity types,
    AI analytics and report generation.
  version: 1.0.0
  contact:
    name: WVI Engine
    email: api@wvi.health

servers:
  - url: https://api.wvi.health/v1
    description: Production
  - url: http://localhost:8080/api/v1
    description: Local development

tags:
  - name: Auth
    description: Registration, authorization, tokens
  - name: Users
    description: User profile, settings, personal norms
  - name: Biometrics
    description: Raw biometric data from device (HR, HRV, SpO2, Temp, Sleep, PPI, ECG, BP, Activity)
  - name: WVI
    description: Wellness Vitality Index — calculation, history, trends
  - name: Emotions
    description: 18 emotional states — current, history, analytics
  - name: Activities
    description: 64 activity types — current, history, load, TRIMP
  - name: AI
    description: AI interpretation, recommendations, forecasts, Genius Layer
  - name: Reports
    description: PDF, HTML, presentations — generation and download
  - name: Alerts
    description: Critical alerts, notification settings
  - name: Device
    description: V8 BLE device management, synchronization, auto-monitoring
  - name: Training
    description: Training recommendations, heart rate zones, recovery
  - name: Risk
    description: Health VaR, anomalies, chronic risks, correlations
```

### 11.2 AUTH — Authorization

```yaml
paths:

  /auth/register:
    post:
      tags: [Auth]
      summary: Register a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email:
                  type: string
                  format: email
                  example: "user@example.com"
                password:
                  type: string
                  minLength: 8
                  example: "SecurePass123!"
                name:
                  type: string
                  example: "Alexander"
      responses:
        201:
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'

  /auth/login:
    post:
      tags: [Auth]
      summary: Login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        200:
          description: JWT token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'

  /auth/refresh:
    post:
      tags: [Auth]
      summary: Refresh JWT token
      security:
        - bearerAuth: []
      responses:
        200:
          description: New token
```

### 11.3 USERS — Profile and Settings

```yaml
  /users/me:
    get:
      tags: [Users]
      summary: Get current user profile
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfile'

    put:
      tags: [Users]
      summary: Update profile (personal data for calibration)
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                gender:
                  type: string
                  enum: [male, female]
                  description: "Gender — affects HRV, HR, TRIMP norms"
                age:
                  type: integer
                  minimum: 5
                  maximum: 100
                  description: "Age — affects maxHR, ageBasedMaxHRV"
                height:
                  type: integer
                  description: "Height in cm — for step and calorie calculations"
                weight:
                  type: number
                  description: "Weight in kg — for METS and calories"
                stepGoal:
                  type: integer
                  default: 10000
                  description: "Daily step goal"
                sleepGoalHours:
                  type: number
                  default: 8.0
                  description: "Sleep goal in hours"
      responses:
        200:
          description: Profile updated

  /users/me/norms:
    get:
      tags: [Users]
      summary: Personal norms (auto-calibrated)
      description: |
        Calculated norms based on data history:
        - restingHR: average HR during 01:00-05:00 (last 7 days)
        - baseTemp: median temperature over 14 days
        - maxHR: 208 - 0.7 * age (Tanaka)
        - ageBasedMaxHRV: HRV norm for age
        - personalCorrelations: which metrics are correlated for this user
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PersonalNorms'

    post:
      tags: [Users]
      summary: Trigger recalibration of personal norms
      description: "Usually automatic every 14 days. Can be triggered manually."
      security:
        - bearerAuth: []
      responses:
        202:
          description: Calibration started
```

### 11.4 BIOMETRICS — Raw Data from Device

```yaml
  /biometrics/sync:
    post:
      tags: [Biometrics]
      summary: Bulk upload biometric data from device
      description: |
        Accepts all data types from V8 BLE SDK in a single request.
        Called after BLE synchronization.
        Data is stored in TimescaleDB for time-series analysis.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BiometricSync'
      responses:
        201:
          description: Data accepted, WVI recalculated
          content:
            application/json:
              schema:
                type: object
                properties:
                  recordsProcessed:
                    type: integer
                    example: 847
                  wviRecalculated:
                    type: boolean
                    example: true
                  newAlerts:
                    type: array
                    items:
                      $ref: '#/components/schemas/Alert'

  /biometrics/heart-rate:
    get:
      tags: [Biometrics]
      summary: Heart rate history (HR)
      description: |
        Continuous heart rate (DynamicHR_V8) and spot measurements (StaticHR_V8).
        SDK endpoint: GetContinuousHRDataWithMode / GetSingleHRDataWithMode.
        Keys: arrayContinuousHR → {date, arrayHR}, arraySingleHR → {date, singleHR}
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
        - $ref: '#/components/parameters/granularity'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/HeartRateRecord'
                  stats:
                    $ref: '#/components/schemas/MetricStats'

    post:
      tags: [Biometrics]
      summary: Upload HR data from device
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                continuous:
                  type: array
                  description: "arrayContinuousHR from SDK"
                  items:
                    type: object
                    properties:
                      date:
                        type: string
                        format: date-time
                      values:
                        type: array
                        items:
                          type: integer
                        description: "arrayHR — array of BPM values"
                single:
                  type: array
                  description: "arraySingleHR from SDK"
                  items:
                    type: object
                    properties:
                      date:
                        type: string
                        format: date-time
                      bpm:
                        type: integer
      responses:
        201:
          description: HR data saved

  /biometrics/hrv:
    get:
      tags: [Biometrics]
      summary: HRV + Stress + BP history
      description: |
        Richest endpoint: HRV, stress, heart rate at measurement, blood pressure.
        SDK endpoint: GetHRVDataWithMode.
        Keys: arrayHrvData → {date, hrv, stress, heartRate, systolicBP, diastolicBP}
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/HRVRecord'
                  stats:
                    type: object
                    properties:
                      avgHRV:
                        type: number
                        description: "Average HRV for period (ms)"
                      avgStress:
                        type: number
                        description: "Average stress (0-100)"
                      avgBP:
                        type: string
                        example: "122/78"

    post:
      tags: [Biometrics]
      summary: Upload HRV data from device
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                records:
                  type: array
                  items:
                    type: object
                    required: [date, hrv, stress, heartRate, systolicBP, diastolicBP]
                    properties:
                      date:
                        type: string
                        format: date-time
                      hrv:
                        type: number
                        description: "HRV in ms"
                      stress:
                        type: integer
                        minimum: 0
                        maximum: 100
                        description: "Stress level"
                      heartRate:
                        type: integer
                        description: "HR during HRV measurement"
                      systolicBP:
                        type: integer
                        description: "Systolic blood pressure"
                      diastolicBP:
                        type: integer
                        description: "Diastolic blood pressure"
      responses:
        201:
          description: HRV data saved

  /biometrics/spo2:
    get:
      tags: [Biometrics]
      summary: SpO2 history (blood oxygen)
      description: |
        Automatic and manual SpO2 measurements.
        SDK: GetAutomaticSpo2DataWithMode / GetManualSpo2DataWithMode.
        Keys: arrayAutomaticSpo2Data → {date, automaticSpo2Data}
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/SpO2Record'

    post:
      tags: [Biometrics]
      summary: Upload SpO2 data
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                automatic:
                  type: array
                  items:
                    type: object
                    properties:
                      date:
                        type: string
                        format: date-time
                      spo2:
                        type: number
                        minimum: 70
                        maximum: 100
                        description: "SpO2 in %"
                manual:
                  type: array
                  items:
                    type: object
                    properties:
                      date:
                        type: string
                        format: date-time
                      spo2:
                        type: number
      responses:
        201:
          description: SpO2 data saved

  /biometrics/temperature:
    get:
      tags: [Biometrics]
      summary: Body temperature history
      description: |
        SDK: GetTemperatureDataWithMode.
        Keys: arrayemperatureData → {date, temperature}
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/TemperatureRecord'

    post:
      tags: [Biometrics]
      summary: Upload temperature data
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                records:
                  type: array
                  items:
                    type: object
                    properties:
                      date:
                        type: string
                        format: date-time
                      temperature:
                        type: number
                        description: "Temperature in °C"
                        example: 36.6
      responses:
        201:
          description: Temperature data saved

  /biometrics/sleep:
    get:
      tags: [Biometrics]
      summary: Sleep history (phases, duration, quality)
      description: |
        SDK: GetDetailSleepDataWithMode / getSleepDetailsAndActivityWithMode.
        Keys: arrayDetailSleepData → {startTime_SleepData, totalSleepTime,
        arraySleepQuality, sleepUnitLength}
        arraySleepQuality: phases array (0=awake, 1=light, 2=deep)
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/SleepRecord'

    post:
      tags: [Biometrics]
      summary: Upload sleep data
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                records:
                  type: array
                  items:
                    type: object
                    properties:
                      startTime:
                        type: string
                        format: date-time
                      totalMinutes:
                        type: integer
                        description: "Total sleep time in minutes"
                      phases:
                        type: array
                        items:
                          type: integer
                          enum: [0, 1, 2]
                          description: "0=awake, 1=light, 2=deep"
                      unitLengthMinutes:
                        type: integer
                        description: "Duration of each interval in phases"
                      activityDuringNight:
                        type: array
                        items:
                          type: integer
                        description: "Night activity (from arrayActivityData)"
      responses:
        201:
          description: Sleep data saved

  /biometrics/ppi:
    get:
      tags: [Biometrics]
      summary: PPI history (Pulse-to-Pulse Interval)
      description: |
        Pulse-to-pulse intervals in ms. Used for calculating
        RMSSD, coherence, additional HRV analysis.
        SDK: GetPPIDataWithMode.
        Keys: arrayPPIData → {date, groupCount, currentIndex, arrayPPIData}
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/PPIRecord'

    post:
      tags: [Biometrics]
      summary: Upload PPI data
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                records:
                  type: array
                  items:
                    type: object
                    properties:
                      date:
                        type: string
                        format: date-time
                      intervals:
                        type: array
                        items:
                          type: number
                        description: "PPI intervals in ms"
      responses:
        201:
          description: PPI data saved

  /biometrics/ecg:
    get:
      tags: [Biometrics]
      summary: ECG history (ECG raw data)
      description: |
        Raw ECG data. SDK: ECG_RawData_V8.
        Keys: {arrayEcgRawData, packetID}
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  sessions:
                    type: array
                    items:
                      $ref: '#/components/schemas/ECGSession'

    post:
      tags: [Biometrics]
      summary: Upload ECG session
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                sessionDate:
                  type: string
                  format: date-time
                durationSeconds:
                  type: integer
                packets:
                  type: array
                  items:
                    type: object
                    properties:
                      packetID:
                        type: integer
                      values:
                        type: array
                        items:
                          type: integer
      responses:
        201:
          description: ECG session saved

  /biometrics/activity:
    get:
      tags: [Biometrics]
      summary: Physical activity history (steps, calories, METS)
      description: |
        SDK: GetTotalActivityDataWithMode / GetDetailActivityDataWithMode /
        GetActivityModeDataWithMode.
        Includes steps, calories, distance, activity type, METS.
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  daily:
                    type: array
                    items:
                      $ref: '#/components/schemas/DailyActivityRecord'
                  sessions:
                    type: array
                    items:
                      $ref: '#/components/schemas/ActivitySession'

    post:
      tags: [Biometrics]
      summary: Upload activity data
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                daily:
                  type: array
                  items:
                    type: object
                    properties:
                      date:
                        type: string
                        format: date
                      steps:
                        type: integer
                      calories:
                        type: number
                      distanceKm:
                        type: number
                      activeMinutes:
                        type: integer
                sessions:
                  type: array
                  description: "Training sessions (SDK ActivityMode)"
                  items:
                    type: object
                    properties:
                      startTime:
                        type: string
                        format: date-time
                      endTime:
                        type: string
                        format: date-time
                      sdkActivityType:
                        type: integer
                        description: "ACTIVITYMODE_V8 enum (0=Run..17=Volleyball)"
                      mets:
                        type: number
                      avgHR:
                        type: integer
                      maxHR:
                        type: integer
                      calories:
                        type: number
      responses:
        201:
          description: Activity data saved
```

### 11.5 WVI — Wellness Vitality Index

```yaml
  /wvi/current:
    get:
      tags: [WVI]
      summary: Current WVI score + all sub-metrics
      description: |
        Returns the latest calculated WVI score (0-100),
        all 10 normalized metrics, current emotion,
        current activity and AI interpretation.
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WVISnapshot'

  /wvi/history:
    get:
      tags: [WVI]
      summary: WVI history for period
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
        - name: granularity
          in: query
          schema:
            type: string
            enum: [5min, 30min, 1h, 1d]
            default: 30min
          description: "Granularity: 5min (realtime), 30min, 1h, 1d"
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/WVIHistoryPoint'
                  trend:
                    $ref: '#/components/schemas/TrendAnalysis'

  /wvi/trends:
    get:
      tags: [WVI]
      summary: WVI trend analytics (24h / 7d / 30d)
      security:
        - bearerAuth: []
      parameters:
        - name: period
          in: query
          required: true
          schema:
            type: string
            enum: [24h, 7d, 30d]
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WVITrendReport'

  /wvi/predict:
    get:
      tags: [WVI]
      summary: WVI forecast (Holt exponential smoothing)
      security:
        - bearerAuth: []
      parameters:
        - name: hoursAhead
          in: query
          schema:
            type: integer
            default: 6
            maximum: 24
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  currentWVI:
                    type: number
                  predictedWVI:
                    type: number
                  confidence:
                    type: number
                  trend:
                    type: string
                    enum: [rising, stable, falling]

  /wvi/simulate:
    post:
      tags: [WVI]
      summary: What-if simulation ("if doing X, what happens to WVI")
      description: |
        Systems Dynamics: models feedback loops.
        Example: "Add 30 min walking" → WVI prediction over 7/14/30 days.
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                action:
                  type: string
                  description: "Action to model"
                  example: "Add 30 minutes daily walking"
                parameters:
                  type: object
                  properties:
                    extraStepsPerDay:
                      type: integer
                    extraSleepMinutes:
                      type: integer
                    meditationMinutesPerDay:
                      type: integer
                    reduceStressBy:
                      type: integer
                daysToSimulate:
                  type: integer
                  default: 14
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SimulationResult'
```

### 11.6 EMOTIONS — 18 Emotional States

```yaml
  /emotions/current:
    get:
      tags: [Emotions]
      summary: Current emotion (primary + secondary)
      description: |
        Fuzzy Logic cascade detected emotion from 18 possible.
        Includes confidence, description, secondary emotion.
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmotionResult'

  /emotions/history:
    get:
      tags: [Emotions]
      summary: Emotion history for period
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  timeline:
                    type: array
                    items:
                      $ref: '#/components/schemas/EmotionHistoryPoint'
                  distribution:
                    type: object
                    description: "% time in each emotion"
                    additionalProperties:
                      type: number
                  heatmap:
                    type: array
                    description: "Hour × day → dominant emotion"
                    items:
                      type: object
                      properties:
                        hour:
                          type: integer
                        dayOfWeek:
                          type: integer
                        dominantEmotion:
                          type: string
                        count:
                          type: integer

  /emotions/wellbeing:
    get:
      tags: [Emotions]
      summary: Emotional Wellbeing Score (10th WVI metric)
      description: |
        Calculated from 24h emotion history with exponential decay.
        Positive emotions = high score, negative = low.
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  score:
                    type: number
                    description: "0-100"
                  dominantEmotionToday:
                    type: string
                  positiveRatio:
                    type: number
                    description: "% time in positive emotions"
                  longestNegativeStreak:
                    type: integer
                    description: "Longest negative period (min)"
```

### 11.7 ACTIVITIES — 64 Activity Types

```yaml
  /activities/current:
    get:
      tags: [Activities]
      summary: Current activity + full breakdown
      description: |
        Detected type from 64 possible activities.
        Includes load, heart rate zone, calories, TRIMP, recommendations.
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActivityResult'

  /activities/history:
    get:
      tags: [Activities]
      summary: Activity history (day timeline)
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  timeline:
                    type: array
                    items:
                      $ref: '#/components/schemas/ActivityTimelineEntry'
                  summary:
                    $ref: '#/components/schemas/DailyActivitySummary'

  /activities/load:
    get:
      tags: [Activities]
      summary: Daily load (TRIMP + heart rate zones)
      security:
        - bearerAuth: []
      parameters:
        - name: date
          in: query
          schema:
            type: string
            format: date
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DailyLoadReport'

  /activities/zones:
    get:
      tags: [Activities]
      summary: Time in each heart rate zone
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/dateFrom'
        - $ref: '#/components/parameters/dateTo'
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  zone1Minutes:
                    type: number
                    description: "Recovery (50-60% maxHR)"
                  zone2Minutes:
                    type: number
                    description: "Fat Burn (60-70%)"
                  zone3Minutes:
                    type: number
                    description: "Aerobic (70-80%)"
                  zone4Minutes:
                    type: number
                    description: "Anaerobic (80-90%)"
                  zone5Minutes:
                    type: number
                    description: "VO2max (90-100%)"
                  balanceScore:
                    type: number
                    description: "80/20 balance (0-100)"
```

### 11.8 AI — Interpretation and Recommendations

```yaml
  /ai/interpret:
    post:
      tags: [AI]
      summary: AI interpretation of current state
      description: |
        Sends current data to Claude (Genius Layer — 8 personas):
        Doctor, Psychologist, Neuroscientist, Biohacker, Coach,
        Nutritionist, Sleep Expert, Data Scientist.
        Returns interpretation + 3-5 recommendations + forecast.
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                includeHistory:
                  type: boolean
                  default: true
                  description: "Include 6h history"
                perspective:
                  type: string
                  enum: [all, doctor, psychologist, coach, biohacker]
                  default: all
                  description: "Which AI perspectives to use"
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AIInterpretation'

  /ai/recommendations:
    get:
      tags: [AI]
      summary: AI recommendations (based on latest data)
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  immediate:
                    type: array
                    description: "What to do NOW"
                    items:
                      $ref: '#/components/schemas/Recommendation'
                  today:
                    type: array
                    description: "Plan for today"
                    items:
                      $ref: '#/components/schemas/Recommendation'
                  weeklyGoals:
                    type: array
                    description: "Goals for the week"
                    items:
                      $ref: '#/components/schemas/Recommendation'
```

### 11.9 REPORTS, ALERTS, DEVICE, TRAINING, RISK

```yaml
  # ═══ REPORTS ═══

  /reports/generate:
    post:
      tags: [Reports]
      summary: Generate report (PDF / HTML / Slides)
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [type, period]
              properties:
                type:
                  type: string
                  enum: [pdf, html, slides]
                period:
                  type: string
                  enum: [daily, weekly, monthly]
      responses:
        202:
          description: Report generating
          content:
            application/json:
              schema:
                type: object
                properties:
                  reportId:
                    type: string
                  estimatedSeconds:
                    type: integer

  /reports/{reportId}:
    get:
      tags: [Reports]
      summary: Download generated report
      parameters:
        - name: reportId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Report file
          content:
            application/pdf: {}
            text/html: {}

  # ═══ ALERTS ═══

  /alerts:
    get:
      tags: [Alerts]
      summary: List active alerts
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Alert'

  /alerts/settings:
    get:
      tags: [Alerts]
      summary: Alert settings
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AlertSettings'
    put:
      tags: [Alerts]
      summary: Update alert settings
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AlertSettings'

  # ═══ DEVICE ═══

  /device/status:
    get:
      tags: [Device]
      summary: Connected V8 device status
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  connected:
                    type: boolean
                  battery:
                    type: integer
                  macAddress:
                    type: string
                  firmwareVersion:
                    type: string
                  lastSyncTime:
                    type: string
                    format: date-time

  /device/auto-monitoring:
    get:
      tags: [Device]
      summary: Current auto-monitoring settings
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  hr:
                    $ref: '#/components/schemas/AutoMonitoringConfig'
                  hrv:
                    $ref: '#/components/schemas/AutoMonitoringConfig'
                  spo2:
                    $ref: '#/components/schemas/AutoMonitoringConfig'
                  temperature:
                    $ref: '#/components/schemas/AutoMonitoringConfig'

    put:
      tags: [Device]
      summary: Set auto-monitoring settings
      description: |
        Optimal for WVI:
        - HR every 5 min (dataType=1)
        - HRV every 15 min (dataType=4)
        - SpO2 every 30 min (dataType=2)
        - Temperature every 30 min (dataType=3)
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                hr:
                  $ref: '#/components/schemas/AutoMonitoringConfig'
                hrv:
                  $ref: '#/components/schemas/AutoMonitoringConfig'
                spo2:
                  $ref: '#/components/schemas/AutoMonitoringConfig'
                temperature:
                  $ref: '#/components/schemas/AutoMonitoringConfig'

  # ═══ TRAINING ═══

  /training/recommendation:
    get:
      tags: [Training]
      summary: Today's training recommendation
      description: |
        Based on WVI + yesterday's TRIMP + sleep + emotion:
        workout type, zone, duration, warnings.
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrainingRecommendation'

  # ═══ RISK ═══

  /risk/assessment:
    get:
      tags: [Risk]
      summary: Health Risk Assessment
      description: |
        Health VaR, drawdown monitor, correlation matrix,
        anomaly detection, chronic risk flags.
      security:
        - bearerAuth: []
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RiskAssessment'
```

### 11.10 SCHEMAS — All Data Models

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  parameters:
    dateFrom:
      name: from
      in: query
      schema:
        type: string
        format: date-time
      description: "Start of period (ISO 8601)"
    dateTo:
      name: to
      in: query
      schema:
        type: string
        format: date-time
      description: "End of period (ISO 8601)"
    granularity:
      name: granularity
      in: query
      schema:
        type: string
        enum: [1min, 5min, 30min, 1h, 1d]
        default: 5min

  schemas:

    AuthResponse:
      type: object
      properties:
        token:
          type: string
        refreshToken:
          type: string
        expiresIn:
          type: integer

    UserProfile:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
        gender:
          type: string
          enum: [male, female]
        age:
          type: integer
        height:
          type: integer
        weight:
          type: number
        stepGoal:
          type: integer
        sleepGoalHours:
          type: number
        createdAt:
          type: string
          format: date-time

    PersonalNorms:
      type: object
      properties:
        restingHR:
          type: number
          description: "Average resting HR (01:00-05:00 over 7 days)"
        baseTemp:
          type: number
          description: "Temperature median over 14 days"
        maxHR:
          type: number
          description: "208 - 0.7 * age"
        ageBasedMaxHRV:
          type: number
          description: "Normative HRV maximum for age"
        lastCalibrated:
          type: string
          format: date-time
        correlations:
          type: object
          description: "Personal correlation matrix"
          properties:
            sleep_stress:
              type: number
            activity_mood:
              type: number
            hrv_sleep:
              type: number

    BiometricSync:
      type: object
      description: "Bulk upload of all data after BLE synchronization"
      properties:
        deviceMac:
          type: string
        syncTimestamp:
          type: string
          format: date-time
        heartRate:
          type: object
          properties:
            continuous:
              type: array
              items:
                type: object
            single:
              type: array
              items:
                type: object
        hrv:
          type: array
          items:
            type: object
        spo2:
          type: object
          properties:
            automatic:
              type: array
            manual:
              type: array
        temperature:
          type: array
          items:
            type: object
        sleep:
          type: array
          items:
            type: object
        ppi:
          type: array
          items:
            type: object
        activity:
          type: object
          properties:
            daily:
              type: array
            sessions:
              type: array

    HeartRateRecord:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        bpm:
          type: integer
        type:
          type: string
          enum: [continuous, single, realtime]

    HRVRecord:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        hrv:
          type: number
          description: "ms"
        stress:
          type: integer
          description: "0-100"
        heartRate:
          type: integer
        systolicBP:
          type: integer
        diastolicBP:
          type: integer

    SpO2Record:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        spo2:
          type: number
        type:
          type: string
          enum: [automatic, manual]

    TemperatureRecord:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        celsius:
          type: number

    SleepRecord:
      type: object
      properties:
        date:
          type: string
          format: date
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
        totalMinutes:
          type: integer
        deepPercent:
          type: number
        lightPercent:
          type: number
        remPercent:
          type: number
        awakePercent:
          type: number
        phases:
          type: array
          items:
            type: object
            properties:
              phase:
                type: string
                enum: [deep, light, rem, awake]
              startMinute:
                type: integer
              durationMinutes:
                type: integer
        sleepScore:
          type: number
          description: "Normalized 0-100"

    PPIRecord:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        intervals:
          type: array
          items:
            type: number
          description: "PPI in ms"
        rmssd:
          type: number
          description: "Computed RMSSD"
        coherence:
          type: number
          description: "Coherence 0-1"

    ECGSession:
      type: object
      properties:
        sessionId:
          type: string
        timestamp:
          type: string
          format: date-time
        durationSeconds:
          type: integer
        sampleRate:
          type: integer
        dataPoints:
          type: integer
        downloadUrl:
          type: string
          description: "URL for downloading raw data"

    WVISnapshot:
      type: object
      description: "Full snapshot of current state"
      properties:
        wviScore:
          type: number
          description: "0-100"
        level:
          type: string
          enum: [excellent, good, moderate, attention, critical, dangerous]
        levelEmoji:
          type: string
        metrics:
          type: object
          properties:
            heartRateScore:
              type: number
            hrvScore:
              type: number
            stressScore:
              type: number
            spo2Score:
              type: number
            temperatureScore:
              type: number
            sleepScore:
              type: number
            activityScore:
              type: number
            bpScore:
              type: number
            ppiCoherenceScore:
              type: number
            emotionalWellbeingScore:
              type: number
        emotion:
          $ref: '#/components/schemas/EmotionResult'
        activity:
          $ref: '#/components/schemas/ActivityResult'
        rawData:
          type: object
          properties:
            heartRate:
              type: integer
            hrv:
              type: number
            stress:
              type: integer
            spo2:
              type: number
            temperature:
              type: number
            systolicBP:
              type: integer
            diastolicBP:
              type: integer
            steps:
              type: integer
        timestamp:
          type: string
          format: date-time

    EmotionResult:
      type: object
      properties:
        primary:
          type: string
          enum: [calm, relaxed, joyful, energized, excited,
                 focused, meditative, recovering, drowsy,
                 stressed, anxious, angry, frustrated, fearful, sad, exhausted,
                 pain, flow]
        primaryConfidence:
          type: number
          description: "0-1"
        secondary:
          type: string
        secondaryConfidence:
          type: number
        emoji:
          type: string
        description:
          type: string
        category:
          type: string
          enum: [positive, neutral, negative, physiological]

    ActivityResult:
      type: object
      properties:
        type:
          type: string
          description: "One of 64 types"
        category:
          type: string
          enum: [sleep, rest, walking, running, cardio_machine, strength,
                 mind_body, sports, daily, physiological, recovery, mental]
        emoji:
          type: string
        description:
          type: string
        confidence:
          type: number
        loadLevel:
          type: integer
          description: "0-6"
        loadLevelName:
          type: string
          enum: [none, minimal, light, moderate, high, intense, extreme]
        loadScore:
          type: number
          description: "0-100"
        loadTarget:
          type: string
          enum: [cardio, muscular, mental, mixed]
        heartRateZone:
          type: integer
          description: "0-5"
        caloriesPerMinute:
          type: number
        durationMinutes:
          type: number
        cumulativeTRIMP:
          type: number
          description: "Daily TRIMP"
        contextualAdvice:
          type: string
          description: "Activity-contextual recommendation"

    DailyLoadReport:
      type: object
      properties:
        date:
          type: string
          format: date
        totalTRIMP:
          type: number
        trimpLevel:
          type: string
          enum: [light, medium, heavy, overload]
        totalCalories:
          type: number
        totalSteps:
          type: integer
        activeMinutes:
          type: integer
        zones:
          type: object
          properties:
            zone1Minutes: { type: number }
            zone2Minutes: { type: number }
            zone3Minutes: { type: number }
            zone4Minutes: { type: number }
            zone5Minutes: { type: number }
        balanceScore:
          type: number
          description: "80/20 rule compliance (0-100)"
        activityBreakdown:
          type: array
          items:
            type: object
            properties:
              activityType:
                type: string
              minutes:
                type: number
              percentage:
                type: number

    Alert:
      type: object
      properties:
        id:
          type: string
        level:
          type: string
          enum: [info, warning, critical, emergency]
        message:
          type: string
        metric:
          type: string
        value:
          type: number
        threshold:
          type: number
        timestamp:
          type: string
          format: date-time
        acknowledged:
          type: boolean

    AlertSettings:
      type: object
      properties:
        enabled:
          type: boolean
        pushNotifications:
          type: boolean
        rules:
          type: object
          properties:
            wviCritical:
              type: object
              properties:
                enabled: { type: boolean, default: true }
                threshold: { type: number, default: 25 }
            spo2Low:
              type: object
              properties:
                enabled: { type: boolean, default: true }
                threshold: { type: number, default: 92 }
            hrHigh:
              type: object
              properties:
                enabled: { type: boolean, default: true }
                deltaThreshold: { type: number, default: 50 }
            tempHigh:
              type: object
              properties:
                enabled: { type: boolean, default: true }
                threshold: { type: number, default: 38.0 }
            chronicStress:
              type: object
              properties:
                enabled: { type: boolean, default: true }
                stressThreshold: { type: number, default: 85 }
                durationMinutes: { type: number, default: 30 }

    AutoMonitoringConfig:
      type: object
      properties:
        enabled:
          type: boolean
        intervalMinutes:
          type: integer
          description: "5-120 min"
        startHour:
          type: integer
        endHour:
          type: integer
        daysOfWeek:
          type: array
          items:
            type: string
            enum: [mon, tue, wed, thu, fri, sat, sun]

    AIInterpretation:
      type: object
      properties:
        summary:
          type: string
          description: "2-3 sentences about current state"
        emotionExplanation:
          type: string
          description: "Why this specific emotion was detected"
        recommendations:
          type: array
          items:
            $ref: '#/components/schemas/Recommendation'
        prediction:
          type: object
          properties:
            wviIn3h:
              type: number
            trend:
              type: string
        anomalies:
          type: array
          items:
            type: string
        perspectives:
          type: object
          description: "Genius Layer — 8 perspectives"
          properties:
            doctor:
              type: string
            psychologist:
              type: string
            coach:
              type: string
            neuroscientist:
              type: string

    Recommendation:
      type: object
      properties:
        priority:
          type: string
          enum: [immediate, today, week]
        action:
          type: string
        reason:
          type: string
        expectedImpact:
          type: string
          description: "Expected impact on WVI"

    TrainingRecommendation:
      type: object
      properties:
        readiness:
          type: string
          enum: [peak, ready, moderate, rest_needed, recovery_only]
        recommendedActivity:
          type: string
        targetZone:
          type: integer
          description: "Target heart rate zone 1-5"
        durationMinutes:
          type: integer
        warnings:
          type: array
          items:
            type: string
        reasoning:
          type: string

    RiskAssessment:
      type: object
      properties:
        healthVaR:
          type: object
          properties:
            probabilityDrop20:
              type: number
              description: "P(WVI drop > 20 in 24h)"
            worstCase24h:
              type: number
        drawdown:
          type: object
          properties:
            currentDrawdown:
              type: number
            maxDrawdown30d:
              type: number
            daysInDrawdown:
              type: integer
        anomalies:
          type: array
          items:
            type: object
            properties:
              metric:
                type: string
              zScore:
                type: number
              description:
                type: string
        chronicFlags:
          type: array
          items:
            type: object
            properties:
              flag:
                type: string
              duration:
                type: string
              severity:
                type: string
                enum: [warning, critical]

    SimulationResult:
      type: object
      properties:
        scenario:
          type: string
        predictions:
          type: array
          items:
            type: object
            properties:
              day:
                type: integer
              predictedWVI:
                type: number
              mainChange:
                type: string
        summary:
          type: string
        feedbackLoopsActivated:
          type: array
          items:
            type: string
```

### 11.11 Full Endpoint Registry (RU/EN Descriptions)

```
#  | METHOD | PATH                          | DESCRIPTION
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
 1 | POST   | /auth/register                | Register a new user account
 2 | POST   | /auth/login                   | Login with email & password, returns JWT
 3 | POST   | /auth/refresh                 | Refresh expired JWT token
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
 4 | GET    | /users/me                     | Get user profile (gender, age, height, weight)
 5 | PUT    | /users/me                     | Update profile for calibration
 6 | GET    | /users/me/norms               | Get personal norms (auto-calibrated)
 7 | POST   | /users/me/norms/calibrate     | Trigger manual recalibration
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
 8 | POST   | /biometrics/sync              | Bulk upload all biometric data from BLE sync
 9 | GET    | /biometrics/heart-rate        | Heart rate history (continuous + single)
10 | POST   | /biometrics/heart-rate        | Upload HR data from device
11 | GET    | /biometrics/hrv               | HRV history including stress and blood pressure
12 | POST   | /biometrics/hrv               | Upload HRV records (hrv, stress, BP)
13 | GET    | /biometrics/spo2              | SpO2 (blood oxygen) history
14 | POST   | /biometrics/spo2              | Upload SpO2 readings (auto + manual)
15 | GET    | /biometrics/temperature       | Body temperature history (°C)
16 | POST   | /biometrics/temperature       | Upload temperature records
17 | GET    | /biometrics/sleep             | Sleep history (phases, duration, quality score)
18 | POST   | /biometrics/sleep             | Upload sleep data (phases, night activity)
19 | GET    | /biometrics/ppi               | PPI history (pulse-to-pulse intervals, ms)
20 | POST   | /biometrics/ppi               | Upload PPI interval data
21 | GET    | /biometrics/ecg               | ECG session history (raw waveform data)
22 | POST   | /biometrics/ecg               | Upload ECG recording session
23 | GET    | /biometrics/activity          | Activity history (steps, calories, METS, sessions)
24 | POST   | /biometrics/activity          | Upload activity data (daily + sessions)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
25 | GET    | /wvi/current                  | Current WVI snapshot (score + all 10 sub-metrics)
26 | GET    | /wvi/history                  | WVI history with configurable granularity
27 | GET    | /wvi/trends                   | Trend analysis for 24h / 7d / 30d periods
28 | GET    | /wvi/predict                  | Predict future WVI using Holt exponential smoothing
29 | POST   | /wvi/simulate                 | What-if simulation via systems dynamics model
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
30 | GET    | /emotions/current             | Current emotion (primary + secondary, 18 types)
31 | GET    | /emotions/history             | Emotion history with distribution and heatmap
32 | GET    | /emotions/wellbeing           | Emotional Wellbeing Score (10th WVI metric)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
33 | GET    | /activities/current           | Current activity (64 types) with full breakdown
34 | GET    | /activities/history           | Activity timeline for the day
35 | GET    | /activities/load              | Daily load report (TRIMP + HR zones)
36 | GET    | /activities/zones             | Time in each HR zone + 80/20 balance score
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
37 | POST   | /ai/interpret                 | AI interpretation (Genius Layer, 8 perspectives)
38 | GET    | /ai/recommendations           | AI recommendations (immediate + daily + weekly)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
39 | POST   | /reports/generate             | Generate report (PDF / HTML / Slides)
40 | GET    | /reports/{id}                 | Download generated report
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
41 | GET    | /alerts                       | List active alerts
42 | GET    | /alerts/settings              | Get alert settings (thresholds, rules)
43 | PUT    | /alerts/settings              | Update alert settings
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
44 | GET    | /device/status                | Device V8 status (battery, MAC, firmware)
45 | GET    | /device/auto-monitoring       | Current auto-monitoring configuration
46 | PUT    | /device/auto-monitoring       | Set auto-monitoring (HR/HRV/SpO2/Temp intervals)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
47 | GET    | /training/recommendation      | Today's training recommendation based on readiness
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
48 | GET    | /risk/assessment              | Health risk assessment (VaR, anomalies, chronic flags)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
49 | GET    | /wvi/circadian                | Circadian WVI pattern (peak/low hours)
50 | GET    | /wvi/correlations             | Correlation matrix of all 10 WVI sub-metrics
51 | GET    | /wvi/breakdown                | WVI breakdown: contribution of each metric
52 | GET    | /wvi/compare                  | Compare WVI between two time periods
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
53 | GET    | /emotions/distribution        | Emotion distribution for period (% per emotion)
54 | GET    | /emotions/heatmap             | Emotion heatmap (hour × day of week)
55 | GET    | /emotions/transitions         | Emotion transition matrix (A→B frequency)
56 | GET    | /emotions/triggers            | Emotion triggers (which metrics cause each)
57 | GET    | /emotions/streaks             | Longest positive/negative emotion streaks
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
58 | GET    | /activities/categories        | Time in each activity category per day
59 | GET    | /activities/transitions       | Activity transition log (what → what)
60 | GET    | /activities/sedentary         | Sedentary time analysis + break frequency
61 | GET    | /activities/exercise-log      | Exercise session log with details
62 | GET    | /activities/recovery-status   | Recovery status (readiness for next workout)
63 | POST   | /activities/manual-log        | Manual activity log (override auto-detection)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
64 | GET    | /biometrics/blood-pressure    | Blood pressure history (from HRV data)
65 | GET    | /biometrics/stress            | Stress level history
66 | GET    | /biometrics/breathing-rate    | Breathing rate estimated from PPI
67 | GET    | /biometrics/rmssd             | RMSSD history (computed from PPI)
68 | GET    | /biometrics/coherence         | PPI coherence history
69 | GET    | /biometrics/realtime          | Last 5 minutes of all readings
70 | GET    | /biometrics/summary           | Daily summary (all metrics min/max/avg)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
71 | GET    | /sleep/last-night             | Last night full sleep analysis
72 | GET    | /sleep/score-history          | Sleep score history for 30 days
73 | GET    | /sleep/architecture           | Sleep architecture breakdown
74 | GET    | /sleep/consistency            | Sleep consistency (bed/wake regularity)
75 | GET    | /sleep/debt                   | Sleep debt (hours below goal this week)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
76 | POST   | /ai/chat                      | Health AI chat (free-form question + data)
77 | POST   | /ai/explain-metric            | AI explanation for specific metric value
78 | POST   | /ai/action-plan               | AI-generated weekly action plan
79 | GET    | /ai/insights                  | AI insights: what was unusual in 24h
80 | GET    | /ai/genius-layer              | All 8 Genius Layer perspectives
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
81 | GET    | /reports                      | List all user reports
82 | DELETE | /reports/{id}                 | Delete a report
83 | GET    | /reports/templates            | Available report templates
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
84 | GET    | /alerts/history               | Alert history (including acknowledged)
85 | PUT    | /alerts/{id}/acknowledge      | Acknowledge an alert
86 | GET    | /alerts/stats                 | Alert statistics for period
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
87 | POST   | /device/sync                  | Trigger BLE device sync
88 | GET    | /device/capabilities          | Device capabilities (supported metrics)
89 | POST   | /device/measure               | Start manual measurement
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
90 | GET    | /training/weekly-plan         | Weekly training plan
91 | GET    | /training/overtraining-risk   | Overtraining risk (based on TRIMP trend)
92 | GET    | /training/optimal-time        | Optimal training time (circadian-based)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
93 | GET    | /risk/anomalies               | Current anomalies (Z-score > 2.5)
94 | GET    | /risk/chronic-flags           | Chronic risk flags
95 | GET    | /risk/correlations            | Personal metric correlation matrix
96 | GET    | /risk/volatility              | WVI volatility (7d / 30d)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
97 | GET    | /dashboard/widgets            | All dashboard widget data (single request)
98 | GET    | /dashboard/daily-brief        | Morning brief (WVI + sleep + day plan)
99 | GET    | /dashboard/evening-review     | Evening review (day summary + recommendations)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
100| GET    | /export/csv                   | Export all data as CSV
101| GET    | /export/json                  | Export all data as JSON
102| GET    | /export/health-summary        | Health summary for doctor (PDF)
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
103| GET    | /settings                     | All user settings
104| PUT    | /settings                     | Update user settings
105| GET    | /settings/notifications       | Notification preferences
106| PUT    | /settings/notifications       | Update notification preferences
───┼────────┼───────────────────────────────┼──────────────────────────────────────────────
107| GET    | /health/server-status         | Server health check
108| GET    | /health/api-version           | API version info
═══╧════════╧═══════════════════════════════╧══════════════════════════════════════════════
TOTAL: 108 REST endpoints

GROUPING:
├── Auth:        3 endpoints
├── Users:       4 endpoints
├── Biometrics: 24 endpoints
├── WVI:         8 endpoints
├── Emotions:    8 endpoints
├── Activities:  9 endpoints
├── Sleep:       5 endpoints
├── AI:          8 endpoints
├── Reports:     5 endpoints
├── Alerts:      6 endpoints
├── Device:      6 endpoints
├── Training:    4 endpoints
├── Risk:        5 endpoints
├── Dashboard:   3 endpoints
├── Export:      3 endpoints
├── Settings:    4 endpoints
└── Health:      2 endpoints
```

### 11.12 Swagger Server Deployment

```
═══════════════════════════════════════════════════════════════
SWAGGER API SERVER DEPLOYMENT PLAN
SWAGGER API SERVER DEPLOYMENT PLAN
═══════════════════════════════════════════════════════════════

STACK:
├── Runtime: Node.js 20+ (LTS)
├── Framework: Express.js 4.x
├── Swagger UI: swagger-ui-express + swagger-jsdoc
├── Validation: Zod (schema validation)
├── Auth: jsonwebtoken + bcrypt
├── DB: PostgreSQL 16 + TimescaleDB (time-series)
├── ORM: Prisma
├── Cache: Redis 7+
├── Queue: BullMQ (for background tasks: reports, AI)
├── AI: @anthropic-ai/sdk (Claude API direct)
├── Reports: Puppeteer (PDF), EJS (HTML templates)
├── Storage: S3-compatible (MinIO for self-hosted)
└── Docs: Swagger UI at /api/v1/docs

FILE STRUCTURE:
wvi-api/
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma          — DB schema (User, Biometric, WVI, Emotion, Activity, Alert)
├── src/
│   ├── server.ts              — Express app + Swagger UI setup
│   ├── config/
│   │   ├── database.ts        — Prisma client
│   │   ├── redis.ts           — Redis connection
│   │   ├── claude.ts          — Anthropic SDK init
│   │   └── swagger.ts         — Swagger config + jsdoc options
│   ├── middleware/
│   │   ├── auth.ts            — JWT verify middleware
│   │   ├── validation.ts      — Zod schema validation
│   │   ├── rateLimit.ts       — Rate limiting
│   │   └── errorHandler.ts    — Global error handler
│   ├── routes/
│   │   ├── auth.routes.ts     — POST /auth/register, /login, /refresh
│   │   ├── users.routes.ts    — GET/PUT /users/me, /norms
│   │   ├── biometrics.routes.ts — All /biometrics/* (sync, hr, hrv, spo2, temp, sleep, ppi, ecg, activity)
│   │   ├── wvi.routes.ts      — GET /wvi/current, /history, /trends, /predict, POST /simulate
│   │   ├── emotions.routes.ts — GET /emotions/current, /history, /wellbeing
│   │   ├── activities.routes.ts — GET /activities/current, /history, /load, /zones
│   │   ├── ai.routes.ts       — POST /ai/interpret, GET /recommendations
│   │   ├── reports.routes.ts  — POST /reports/generate, GET /{id}
│   │   ├── alerts.routes.ts   — GET /alerts, GET/PUT /settings
│   │   ├── device.routes.ts   — GET /device/status, GET/PUT /auto-monitoring
│   │   ├── training.routes.ts — GET /training/recommendation
│   │   └── risk.routes.ts     — GET /risk/assessment
│   ├── services/
│   │   ├── wvi-calculator.ts  — WVI Score (10 metrics + adaptive weights + emotion feedback)
│   │   ├── emotion-engine.ts  — Fuzzy Logic (18 emotions, sigmoid, bellCurve, temporal smoothing)
│   │   ├── activity-detector.ts — Activity Detection (64 types, cascade, enrichResult)
│   │   ├── metric-normalizer.ts — 10 metric normalizations (0-100)
│   │   ├── trend-analyzer.ts  — Holt smoothing, circadian, anomaly detection
│   │   ├── ai-interpreter.ts  — Claude API → Genius Layer (8 perspectives)
│   │   ├── report-generator.ts — PDF (Puppeteer) + HTML (EJS) + Slides
│   │   ├── alert-engine.ts    — 4 alert levels, 9 rules, push notifications
│   │   ├── calibration.ts     — restingHR, baseTemp, maxHR, adaptive thresholds
│   │   ├── risk-analyzer.ts   — Health VaR, drawdown, correlations, chronic flags
│   │   └── simulation.ts      — Systems dynamics, feedback loops, what-if
│   ├── models/                — Zod schemas (validation + types)
│   │   ├── auth.schema.ts
│   │   ├── user.schema.ts
│   │   ├── biometric.schema.ts
│   │   ├── wvi.schema.ts
│   │   ├── emotion.schema.ts
│   │   ├── activity.schema.ts
│   │   └── alert.schema.ts
│   └── utils/
│       ├── fuzzy-math.ts      — sigmoid, sigmoidInverse, bellCurve
│       ├── statistics.ts      — RMSSD, coherence, linear regression, Holt
│       └── constants.ts       — Emotion names, activity names, HR zones
├── swagger/
│   └── openapi.yaml           — Full OpenAPI 3.1 specification (RU/EN)
├── docker-compose.yml         — PostgreSQL + Redis + MinIO + API
├── Dockerfile
└── .env.example

STARTUP COMMANDS:

# 1. Install
npm install

# 2. Setup DB
npx prisma generate
npx prisma db push

# 3. Start dev
npm run dev
# → http://localhost:8080/api/v1/docs (Swagger UI)

# 4. Docker (production)
docker-compose up -d
# → PostgreSQL :5432, Redis :6379, MinIO :9000, API :8080

SWAGGER UI CONFIG:

// src/config/swagger.ts
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load('./swagger/openapi.yaml');

// RU + EN descriptions in each endpoint
// via x-description-ru / description fields

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WVI API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  }
}));

// JSON spec for clients
app.get('/api/v1/docs.json', (req, res) => res.json(swaggerDocument));

PRISMA SCHEMA / DB MODEL:

// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  gender        String?  // male/female
  age           Int?
  height        Int?     // cm
  weight        Float?   // kg
  stepGoal      Int      @default(10000)
  sleepGoalH    Float    @default(8.0)
  restingHR     Float?   // auto-calibration
  baseTemp      Float?   // auto-calibration
  maxHR         Float?   // 208 - 0.7*age
  ageMaxHRV     Float?   // HRV norm
  lastCalibrated DateTime?
  createdAt     DateTime @default(now())

  biometrics    BiometricData[]
  wviResults    WVIResult[]
  emotions      EmotionRecord[]
  activities    ActivityRecord[]
  alerts        Alert[]
  reports       Report[]
}

model BiometricData {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // hr, hrv, spo2, temperature, sleep, ppi, ecg, activity
  timestamp DateTime
  data      Json     // flexible structure for all types
  createdAt DateTime @default(now())

  @@index([userId, type, timestamp])
}

model WVIResult {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  timestamp       DateTime
  wviScore        Float    // 0-100
  level           String   // excellent/good/moderate/attention/critical/dangerous
  // 10 sub-metrics
  heartRateScore  Float
  hrvScore        Float
  stressScore     Float
  spo2Score       Float
  temperatureScore Float
  sleepScore      Float
  activityScore   Float
  bpScore         Float
  ppiCoherenceScore Float
  emotionalWellbeingScore Float
  // Raw data at calculation time
  rawData         Json
  createdAt       DateTime @default(now())

  @@index([userId, timestamp])
}

model EmotionRecord {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  timestamp           DateTime
  primaryEmotion      String   // 18 types
  primaryConfidence   Float
  secondaryEmotion    String?
  secondaryConfidence Float?
  allScores           Json     // fuzzy scores of all 18 emotions
  createdAt           DateTime @default(now())

  @@index([userId, timestamp])
}

model ActivityRecord {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  timestamp       DateTime
  activityType    String   // 64 types
  category        String   // sleep/rest/walking/running/etc
  confidence      Float
  loadLevel       Int      // 0-6
  loadScore       Float    // 0-100
  loadTarget      String   // cardio/muscular/mental/mixed
  heartRateZone   Int      // 0-5
  caloriesPerMin  Float?
  durationMinutes Float?
  trimp           Float?
  createdAt       DateTime @default(now())

  @@index([userId, timestamp])
}

model Alert {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  level        String   // info/warning/critical/emergency
  metric       String
  value        Float
  threshold    Float
  message      String
  acknowledged Boolean  @default(false)
  timestamp    DateTime
  createdAt    DateTime @default(now())

  @@index([userId, acknowledged])
}

model Report {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // pdf/html/slides
  period    String   // daily/weekly/monthly
  status    String   // pending/generating/ready/failed
  fileUrl   String?
  createdAt DateTime @default(now())
}

DOCKER-COMPOSE:

// docker-compose.yml
version: '3.8'
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_DB: wvi
      POSTGRES_USER: wvi
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: wvi
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://wvi:${DB_PASSWORD}@postgres:5432/wvi
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      S3_ENDPOINT: http://minio:9000
    depends_on:
      - postgres
      - redis
      - minio

volumes:
  pgdata:
  minio_data:
```

### 11.13 Example Requests

```bash
# ═══ Register ═══
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@wvi.health","password":"SecurePass123!","name":"Alexander"}'

# ═══ Login ═══
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@wvi.health","password":"SecurePass123!"}'
# → {"token":"eyJ...","refreshToken":"...","expiresIn":3600}

# ═══ Bulk sync ═══
curl -X POST http://localhost:8080/api/v1/biometrics/sync \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "deviceMac": "AA:BB:CC:DD:EE:FF",
    "syncTimestamp": "2026-04-02T15:00:00Z",
    "heartRate": {"continuous": [{"date":"2026-04-02T10:00:00Z","values":[72,74,71]}]},
    "hrv": [{"date":"2026-04-02T10:00:00Z","hrv":58,"stress":22,"heartRate":72,"systolicBP":118,"diastolicBP":76}],
    "spo2": {"automatic": [{"date":"2026-04-02T10:00:00Z","spo2":98}]},
    "temperature": [{"date":"2026-04-02T10:00:00Z","temperature":36.5}],
    "sleep": [{"startTime":"2026-04-02T00:00:00Z","totalMinutes":420,"phases":[1,1,2,2,1,0,1,2]}],
    "ppi": [{"date":"2026-04-02T10:00:00Z","intervals":[820,815,830,825]}],
    "activity": {"daily": [{"date":"2026-04-02","steps":7240,"calories":320}]}
  }'
# → {"recordsProcessed":12,"wviRecalculated":true,"newAlerts":[]}

# ═══ Current WVI ═══
curl http://localhost:8080/api/v1/wvi/current \
  -H "Authorization: Bearer eyJ..."
# → {"wviScore":78,"level":"good","metrics":{...},"emotion":{...},"activity":{...}}

# ═══ AI interpretation ═══
curl -X POST http://localhost:8080/api/v1/ai/interpret \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"includeHistory":true,"perspective":"all"}'
# → {"summary":"Your state is good...","recommendations":[...],"perspectives":{...}}

# ═══ Generate PDF report ═══
curl -X POST http://localhost:8080/api/v1/reports/generate \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"type":"pdf","period":"weekly"}'
# → {"reportId":"rpt_abc123","estimatedSeconds":30}

# ═══ Swagger docs ═══
# Open in browser:
# http://localhost:8080/api/v1/docs
```

---

## PART 12: FILES TO CREATE (Updated)

| # | File | Description |
|---|------|----------|
| 1 | `WVIEngine/WVIModels.h` | All structures: 18 emotions, 64 activities, 7 load levels, WVIResult, Candidates, Trends |
| 2 | `WVIEngine/WVIDataCollector.h/.m` | Data collection from all 17 SDK endpoints + pagination + auto-sync |
| 3 | `WVIEngine/WVIMetricNormalizer.h/.m` | 10 metric normalizations + restingHR + baseTemp + RMSSD + coherence + emotional wellbeing |
| 4 | `WVIEngine/WVIEmotionEngine.h/.m` | Fuzzy Logic cascade 18 emotions + sigmoid/bellCurve + temporal smoothing + secondary emotion |
| 5 | `WVIEngine/WVIActivityDetector.h/.m` | 64 activity types + TRIMP + heart rate zones + calories + auto-detection |
| 6 | `WVIEngine/WVIScoreCalculator.h/.m` | 10 metrics + adaptive weights + emotion feedback loop + activity context |
| 7 | `WVIEngine/WVITrendAnalyzer.h/.m` | Trends 24h/7d/30d + circadian pattern + Holt prediction + anomalies |
| 8 | `WVIEngine/WVIAIInterpreter.h/.m` | Claude Genius Layer (8 personas) → interpretation + recommendations + forecast |
| 9 | `WVIEngine/WVIReportGenerator.h/.m` | PDF (McKinsey) + HTML (dashboard) + Telegram + Presentation |
| 10 | `WVIEngine/WVIAlertSystem.h/.m` | 4 alert levels + 9 trigger rules + Telegram notifications |
| 11 | `WVIEngine/WVIAutoMonitorSetup.h/.m` | Setup of 4 auto-monitoring types (HR/5min, HRV/15min, SpO2/30min, Temp/30min) |
| 12 | `WVIEngine/WVIHealthRisk.h/.m` | Health VaR + drawdown + correlation matrix + tail risk (from risk-monitor) |
| 13 | `WVIEngine/WVISystemsDynamics.h/.m` | Feedback loops + simulation "if X → WVI in Y days" (from mit-systems) |
| 14 | `WVIEngine/WVISentimentBridge.h/.m` | Text sentiment + biometrics = combined mood (from sentiment-analyzer) |
| 15 | `api/middleware/auth.js` | JWT auth middleware |
| 16 | `api/middleware/validation.js` | Request validation (Joi/Zod) |
| 17 | `api/server.js` | Express server + Swagger UI setup |
| 18 | `api/swagger.yaml` | OpenAPI 3.1 specification — 43 endpoints, all schemas |
| 19 | `api/routes/auth.js` | Auth routes: register, login, refresh |
| 20 | `api/routes/users.js` | Users routes: profile, norms, calibration |
| 21 | `api/routes/biometrics.js` | Biometrics routes: 8 data types + sync |
| 22 | `api/routes/wvi.js` | WVI routes: current, history, trends, predict, simulate |
| 23 | `api/routes/emotions.js` | Emotions routes: current, history, wellbeing |
| 24 | `api/routes/activities.js` | Activities routes: current, history, load, zones |
| 25 | `api/routes/ai.js` | AI routes: interpret, recommendations |
| 26 | `api/routes/reports.js` | Reports routes: generate, download |
| 27 | `api/routes/alerts.js` | Alerts routes: list, settings |
| 28 | `api/routes/device.js` | Device routes: status, auto-monitoring |
| 29 | `api/routes/training.js` | Training routes: recommendation |
| 30 | `api/routes/risk.js` | Risk routes: assessment |
| 31 | `api/models/*.js` | DB models (Sequelize/Prisma): User, BiometricData, WVIResult, Emotion, Activity, Alert, Report |
| 32 | `api/services/wvi-calculator.js` | Server-side WVI Score Calculator |
| 33 | `api/services/emotion-engine.js` | Server-side Emotion Engine (18 fuzzy) |
| 34 | `api/services/activity-detector.js` | Server-side Activity Detector (64 types) |
| 35 | `api/services/ai-interpreter.js` | Claude AI integration (Genius Layer) |

---

## PART 13: VERIFICATION

1. **Normalization unit tests**: mock data → verify each of 9 formulas at boundary values
2. **Emotion fuzzy tests**: 11 sets of "ideal" metrics → each should detect its emotion
3. **Temporal smoothing test**: rapidly alternating data → emotion should not switch more often than 5 min
4. **WVI adaptive weights**: verify weight sum = 1.0 for all timeOfDay
5. **Alert rules**: mock data with SpO2=90 → should trigger EMERGENCY
6. **Prediction**: synthetic trends → verify Holt forecasting
7. **Integration**: connect device → full cycle collection → WVI → Telegram
8. **AI prompt**: send test data to Claude → verify interpretation quality
