# WVI MEGA-ALGORITHM: Wellness Vitality Index + Emotion AI

## Context

Создаём мега-алгоритм WVI который объединяет:
- **V8 BLE SDK** — 17 эндпоинтов здоровья с умных часов (HR, HRV, stress, SpO2, temp, sleep, ECG, PPG, PPI, BP, activity)
- **AI аналитика** — Claude API (Sonnet/Opus) для интерпретации данных
- **AI аналитика** — Claude Sonnet/Opus для интерпретации данных и рекомендаций
- **18 эмоций** — распознавание через физиологический Fuzzy Logic каскад
- **64 типа активности** — авто-детекция с TRIMP и пульсовыми зонами
- **Пайплайн продукта** — от сбора данных до финального отчёта

---

## ЧАСТЬ 1: АРХИТЕКТУРА МЕГА-АЛГОРИТМА

### 1.1 Модули

```
WVIEngine/
├── WVIModels.h                    — Все структуры данных, 18 эмоций, WVIResult
├── WVIDataCollector.h/.m          — Сбор данных со ВСЕХ 17 эндпоинтов SDK
├── WVIMetricNormalizer.h/.m       — Нормализация 10 метрик → 0-100
├── WVIEmotionEngine.h/.m          — 18 эмоций: каскадный алгоритм + fuzzy logic
├── WVIScoreCalculator.h/.m        — Итоговый WVI 0-100 (взвешенный)
├── WVITrendAnalyzer.h/.m          — Тренды, паттерны, предсказания
├── WVIAIInterpreter.h/.m          — AI слой: Claude анализирует raw данные
├── WVIReportGenerator.h/.m        — Генерация отчётов (PDF, HTML, Telegram)
├── WVIAutoMonitorSetup.h/.m       — Настройка автозамеров на устройстве
└── WVIAlertSystem.h/.m            — Алерты в Telegram при критических значениях
```

### 1.2 Pipeline (полный цикл)

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: DATA COLLECTION (WVIDataCollector)                    │
│  ├─ BLE SDK → HR, HRV+stress+BP, SpO2, Temp, Sleep, PPI, ECG  │
│  ├─ Auto-pagination (mode 0 → mode 2 при count==50)            │
│  └─ Сбор PersonalInfo для калибровки (возраст, пол, вес, рост) │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: NORMALIZATION (WVIMetricNormalizer)                   │
│  ├─ 10 метрик → каждая нормализована в 0-100                   │
│  ├─ Персонализация: учёт возраста, пола, restingHR, baseTemp   │
│  └─ Расчёт производных: RMSSD, PPI coherence, HRV trend       │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: EMOTION DETECTION (WVIEmotionEngine)                  │
│  ├─ Каскадный алгоритм: 18 эмоций с приоритетами               │
│  ├─ Fuzzy Logic: мягкие границы, двойные совпадения             │
│  ├─ Temporal Smoothing: не прыгать между эмоциями < 5 мин      │
│  └─ Confidence scoring: 0-1 для каждого определения             │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4: WVI SCORE (WVIScoreCalculator)                        │
│  ├─ Взвешенная сумма 9 нормализованных метрик                   │
│  ├─ Адаптивные веса: меняются от времени суток и контекста      │
│  └─ Шкала: 0-100 → 5 уровней                                   │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 5: AI INTERPRETATION (WVIAIInterpreter)                  │
│  ├─ Claude Sonnet: анализирует сырые данные + WVI + эмоцию      │
│  ├─ Genius Layer (8 персон): Doctor, Psychologist, Biohacker,   │
│  │   Coach, Nutritionist, Neuroscientist, Sleep Expert, Athlete │
│  ├─ Рекомендации: конкретные действия на основе паттернов       │
│  └─ Предсказания: прогноз WVI на ближайшие 6ч                  │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 6: TREND ANALYSIS (WVITrendAnalyzer)                     │
│  ├─ 24ч / 7д / 30д тренды каждой метрики                        │
│  ├─ Паттерны: циркадный ритм, недельные циклы                   │
│  ├─ Anomaly detection: выбросы и аномальные паттерны            │
│  └─ Predictive: линейная регрессия + экспоненциальное сглаж.    │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 7: OUTPUT (WVIReportGenerator + WVIAlertSystem)          │
│  ├─ Telegram: emoji-rich сообщение с WVI + эмоцией + советом    │
│  ├─ PDF: McKinsey-quality отчёт (через pdf-generator skill)     │
│  ├─ HTML: интерактивный дашборд (через html-page skill)         │
│  └─ Alerts: моментальные уведомления при WVI < 40 или аномалии │
└─────────────────────────────────────────────────────────────────┘
```

---

## ЧАСТЬ 2: ВСЕ API ЭНДПОИНТЫ SDK

| # | Метрика | SDK метод | Enum (Value) | Ключи ответа |
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

## ЧАСТЬ 3: 11 ЭМОЦИЙ — МЕГА-АЛГОРИТМ

### 3.0 Входные параметры

```objc
@interface WVIRawMetrics : NSObject
// Прямые данные с устройства
@property double heartRate;          // BPM (из arrayContinuousHR или DeviceMeasurement_HR)
@property double hrv;                // ms (из arrayHrvData.hrv)
@property double stress;             // 0-100 (из arrayHrvData.stress)
@property double spo2;               // % (из automaticSpo2Data)
@property double temperature;        // °C (из arrayemperatureData.temperature)
@property double systolicBP;         // mmHg (из arrayHrvData.systolicBP)
@property double diastolicBP;        // mmHg (из arrayHrvData.diastolicBP)
@property NSArray *ppiIntervals;     // ms[] (из arrayPPIData)
@property NSArray *sleepQuality;     // фазы сна (из arraySleepQuality)
@property double totalSleepTime;     // мин (из totalSleepTime)
@property double steps;              // шаги (из TotalActivityData)
@property double calories;           // ккал
@property double activeMins;         // минуты активности
@property double mets;               // METS из ActivityMode

// Вычисляемые (в WVIMetricNormalizer)
@property double restingHR;          // среднее ночное HR (01:00-05:00)
@property double baseTemp;           // персональная норма температуры
@property double ppiRMSSD;           // RMSSD из PPI
@property double ppiCoherence;       // когерентность PPI (0-1)
@property WVITrend hrvTrend;         // rising / falling / stable
@end

typedef NS_ENUM(NSInteger, WVITrend) {
    WVITrendFalling = -1,
    WVITrendStable  = 0,
    WVITrendRising  = 1
};
```

### 3.1 Нормализация 10 метрик (WVIMetricNormalizer)

```objc
// ═══ 1. HR Score ═══
// Чем ближе к resting — тем лучше (в покое)
double deltaHR = fabs(m.heartRate - m.restingHR);
double hrScore = MAX(0, MIN(100, 100.0 - deltaHR * 2.5));
// restingHR = среднее HR за 01:00-05:00 последних 7 дней

// ═══ 2. HRV Score ═══
// Нормализация по возрасту: HRV снижается с возрастом
// ageMaxHRV: 20-29=74ms, 30-39=62ms, 40-49=52ms, 50-59=42ms, 60+=35ms
double ageMaxHRV = [self ageBasedMaxHRV:personalInfo.age];
double hrvScore = MAX(0, MIN(100, (m.hrv / ageMaxHRV) * 100.0));

// ═══ 3. Stress Score (инвертированный) ═══
// SDK даёт 0-100 (0=спокоен, 100=стресс). Инвертируем для WVI.
double stressScore = MAX(0, 100.0 - m.stress);

// ═══ 4. SpO2 Score ═══
// Нелинейная шкала: <90=0, 90=0, 95=50, 97=70, 98=85, 99=95, 100=100
double spo2Score;
if (m.spo2 >= 98) spo2Score = 80 + (m.spo2 - 98) * 10;
else if (m.spo2 >= 95) spo2Score = 30 + (m.spo2 - 95) * 16.67;
else if (m.spo2 >= 90) spo2Score = (m.spo2 - 90) * 6;
else spo2Score = 0;

// ═══ 5. Temperature Score ═══
// Отклонение от персональной базовой нормы
double tempDelta = fabs(m.temperature - m.baseTemp);
double tempScore = MAX(0, 100.0 - tempDelta * 40.0);
// baseTemp = среднее температуры за последние 14 дней (±0.2 фильтр выбросов)

// ═══ 6. Sleep Score (комплексный) ═══
// Фазы сна: 0=awake, 1=light, 2=deep (из arraySleepQuality)
double deepPercent = [self deepSleepPercent:m.sleepQuality]; // целевая: 15-25%
double lightPercent = [self lightSleepPercent:m.sleepQuality]; // целевая: 50-60%
double totalHours = m.totalSleepTime / 60.0; // целевые: 7-9ч
double continuity = [self sleepContinuity:m.sleepQuality]; // % без пробуждений

double deepScore = (deepPercent >= 15 && deepPercent <= 25) ? 100 :
                   MAX(0, 100 - fabs(deepPercent - 20) * 5);
double durationScore = (totalHours >= 7 && totalHours <= 9) ? 100 :
                       MAX(0, 100 - fabs(totalHours - 8) * 20);
double contScore = continuity * 100;

double sleepScore = deepScore * 0.35 + durationScore * 0.40 + contScore * 0.25;

// ═══ 7. Activity Score ═══
// Комбинация шагов + METS + активных минут
double stepGoal = 10000; // стандарт ВОЗ
double stepRatio = MIN(1.0, m.steps / stepGoal);
double activeMinRatio = MIN(1.0, m.activeMins / 30.0); // WHO: 30мин/день
double metsBonus = MIN(1.0, m.mets / 8.0) * 20; // бонус за интенсивность

double activityScore = MIN(100, stepRatio * 45 + activeMinRatio * 35 + metsBonus);

// ═══ 8. BP Score ═══
// Оптимальное: 120/80. Каждый mmHg отклонения = -1.5 балла
double bpDeviation = fabs(m.systolicBP - 120) + fabs(m.diastolicBP - 80);
double bpScore = MAX(0, 100.0 - bpDeviation * 1.5);

// ═══ 9. PPI Coherence Score ═══
// RMSSD из PPI интервалов → нормализация
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

### 3.2 Каскадный Emotion Engine (18 эмоций)

```objc
typedef NS_ENUM(NSInteger, WVIEmotionState) {
    // ═══ ПОЗИТИВНЫЕ (5) ═══
    WVIEmotionCalm        = 0,   // Спокойствие — вагальный баланс
    WVIEmotionRelaxed     = 1,   // Расслабленность — парасимпатика доминирует
    WVIEmotionJoyful      = 2,   // Радость — позитивное возбуждение (допамин+серотонин)
    WVIEmotionEnergized   = 3,   // Энергичность — высокий тонус + движение
    WVIEmotionExcited     = 4,   // Возбуждение/Эйфория — пиковая позитивная активация

    // ═══ НЕЙТРАЛЬНЫЕ/ПРОДУКТИВНЫЕ (4) ═══
    WVIEmotionFocused     = 5,   // Концентрация — контролируемое возбуждение
    WVIEmotionMeditative  = 6,   // Медитация — глубокая парасимпатика + когерентность
    WVIEmotionRecovering  = 7,   // Восстановление — HRV растёт, стресс падает
    WVIEmotionDrowsy      = 8,   // Сонливость — организм требует отдыха

    // ═══ НЕГАТИВНЫЕ (7) ═══
    WVIEmotionStressed    = 9,   // Стресс — умеренная симпатическая активация
    WVIEmotionAnxious     = 10,  // Тревожность — острая гиперактивация
    WVIEmotionAngry       = 11,  // Гнев — агрессивная активация + BP↑
    WVIEmotionFrustrated  = 12,  // Фрустрация — стресс с колебаниями HR
    WVIEmotionFearful     = 13,  // Страх — внезапный HR скачок + задержка дыхания
    WVIEmotionSad         = 14,  // Грусть — подавленность без тахикардии
    WVIEmotionExhausted   = 15,  // Истощение — вегетативный коллапс

    // ═══ ФИЗИОЛОГИЧЕСКИЕ (2) ═══
    WVIEmotionPain        = 16,  // Боль/дискомфорт — HR↑ + stress↑ + temp↑ + нет активности
    WVIEmotionFlow        = 17   // Состояние потока — идеальный баланс challenge/skill
};
// Итого: 18 эмоциональных состояний
```

#### Полный алгоритм с Fuzzy Logic + Temporal Smoothing

```objc
- (WVIEmotionResult *)detectEmotionWithNormalized:(WVINormalizedMetrics)n
                                              raw:(WVIRawMetrics *)m
                                     previousEmotion:(WVIEmotionState)prevEmotion
                                     prevTimestamp:(NSDate *)prevTS {

    double deltaHR = m.heartRate - m.restingHR;
    double tempDelta = m.temperature - m.baseTemp;
    NSMutableArray<WVIEmotionCandidate *> *candidates = [NSMutableArray array];

    // ════════════════════════════════════════════════════════
    // STEP 1: Вычисляем SCORE каждой эмоции (fuzzy, 0-1)
    // Не binary IF/ELSE — каждая эмоция получает вероятность
    // ════════════════════════════════════════════════════════

    // ── ANGRY (Гнев) ──
    // Паттерн: резкий HR↑ + BP↑ + HRV↓ + хаотичный PPI + temp↑
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

    // ── ANXIOUS (Тревожность) ──
    // Паттерн: stress↑↑ + HRV↓↓ + PPI хаос + дыхание (SpO2↓)
    {
        double s = 1.0;
        s *= [self sigmoid:m.stress midpoint:68 steepness:0.12];
        s *= [self sigmoidInverse:m.hrv midpoint:32 steepness:0.10];
        s *= [self sigmoid:deltaHR midpoint:12 steepness:0.10];
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.28 steepness:8.0];
        s *= [self sigmoidInverse:m.spo2 midpoint:97.5 steepness:2.0]; // shallow breathing
        // Дифференциатор от ANGRY: BP не скачет
        s *= [self sigmoidInverse:m.systolicBP midpoint:132 steepness:0.05];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionAnxious score:s weight:0.95]];
    }

    // ── STRESSED (Стресс) ──
    // Паттерн: умеренный stress + HRV↓ + HR немного повышен
    {
        double s = 1.0;
        s *= [self sigmoid:m.stress midpoint:48 steepness:0.10];
        s *= [self sigmoidInverse:m.hrv midpoint:52 steepness:0.08];
        s *= [self sigmoid:deltaHR midpoint:6 steepness:0.12];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionStressed score:s weight:0.85]];
    }

    // ── SAD (Грусть/Подавленность) ──
    // Паттерн: низкий HRV + НОРМАЛЬНЫЙ HR + мало активности + плохой сон
    // Ключевое отличие от стресса: нет тахикардии!
    {
        double s = 1.0;
        s *= [self sigmoidInverse:m.hrv midpoint:47 steepness:0.08];
        s *= [self sigmoidInverse:deltaHR midpoint:6 steepness:0.15];   // HR NOT elevated
        s *= [self bellCurve:m.stress center:40 width:20];               // moderate stress
        s *= [self sigmoidInverse:n.activityScore midpoint:35 steepness:0.08];
        s *= [self sigmoidInverse:n.sleepScore midpoint:55 steepness:0.06];
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.42 steepness:6.0];
        s *= [self sigmoidInverse:tempDelta midpoint:0.1 steepness:5.0]; // temp не растёт
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionSad score:s weight:0.80]];
    }

    // ── EXHAUSTED (Истощение) ──
    // Паттерн: всё на минимуме — вегетативная система истощена
    {
        double s = 1.0;
        s *= [self sigmoidInverse:n.sleepScore midpoint:42 steepness:0.08];
        s *= [self sigmoid:m.stress midpoint:32 steepness:0.08];
        s *= [self sigmoidInverse:m.hrv midpoint:42 steepness:0.08];
        s *= [self sigmoidInverse:m.spo2 midpoint:96.5 steepness:1.5];
        s *= [self sigmoidInverse:n.activityScore midpoint:28 steepness:0.10];
        s *= [self sigmoidInverse:deltaHR midpoint:5 steepness:0.15];     // нет энергии
        s *= [self sigmoidInverse:m.ppiRMSSD midpoint:22 steepness:0.15]; // RMSSD↓↓
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionExhausted score:s weight:0.88]];
    }

    // ── RECOVERING (Восстановление) ──
    // Паттерн: HRV тренд ВВЕРХ + стресс спадает
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

    // ── FOCUSED (Концентрация) ──
    // Паттерн: средний HRV + высокая PPI когерентность + не двигается
    {
        double s = 1.0;
        s *= [self bellCurve:m.hrv center:52 width:22];                   // HRV в среднем диапазоне
        s *= [self bellCurve:m.stress center:32 width:15];                // умеренный стресс
        s *= [self bellCurve:deltaHR center:10 width:8];                  // HR чуть повышен
        s *= [self sigmoid:m.ppiCoherence midpoint:0.42 steepness:6.0];  // упорядоченный ритм
        s *= [self sigmoidInverse:n.activityScore midpoint:52 steepness:0.06]; // сидит
        s *= [self sigmoid:m.spo2 midpoint:95.5 steepness:1.5];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionFocused score:s weight:0.78]];
    }

    // ── JOYFUL (Радость) ──
    // Паттерн: высокий HRV + повышенный HR + ВЫСОКАЯ когерентность
    // Парадокс: HR↑ + HRV↑ одновременно = позитивное возбуждение (допамин+серотонин)
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:52 steepness:0.08];
        s *= [self sigmoidInverse:m.stress midpoint:32 steepness:0.10];
        s *= [self bellCurve:deltaHR center:12 width:10];                 // HR повышен
        s *= [self sigmoid:m.ppiCoherence midpoint:0.52 steepness:6.0];  // высокая когерентность
        s *= [self sigmoid:m.spo2 midpoint:96.5 steepness:1.5];
        s *= [self sigmoid:n.sleepScore midpoint:52 steepness:0.05];
        s *= [self sigmoid:n.activityScore midpoint:38 steepness:0.05];
        s *= [self sigmoid:tempDelta midpoint:-0.1 steepness:3.0];        // temp нормальная+
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionJoyful score:s weight:0.72]];
    }

    // ── ENERGIZED (Энергичность) ──
    // Паттерн: высокий HRV + ВЫСОКАЯ активность + HR↑
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:48 steepness:0.08];
        s *= [self sigmoidInverse:m.stress midpoint:38 steepness:0.08];
        s *= [self sigmoid:deltaHR midpoint:8 steepness:0.10];
        s *= [self sigmoid:n.activityScore midpoint:65 steepness:0.06];   // МНОГО движения
        s *= [self sigmoid:m.spo2 midpoint:95.5 steepness:1.5];
        s *= [self sigmoid:n.sleepScore midpoint:48 steepness:0.04];
        s *= [self sigmoid:m.ppiCoherence midpoint:0.38 steepness:5.0];
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionEnergized score:s weight:0.80]];
    }

    // ── RELAXED (Расслабленность) ──
    // Паттерн: высокий HRV + низкий стресс + ровный HR + хороший сон
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

    // ── FEARFUL (Страх) ──
    // Паттерн: ВНЕЗАПНЫЙ скачок HR + задержка дыхания (SpO2↓) + HRV↓↓
    // Отличие от Anxious: скорость изменения HR (dHR/dt), а не абсолют
    {
        double s = 1.0;
        double hrAcceleration = [self hrAccelerationFromHistory]; // BPM/мин
        s *= [self sigmoid:hrAcceleration midpoint:15 steepness:0.15]; // HR вырос на >15 BPM/мин
        s *= [self sigmoidInverse:m.hrv midpoint:28 steepness:0.12];
        s *= [self sigmoidInverse:m.spo2 midpoint:96 steepness:2.0];   // задержка дыхания
        s *= [self sigmoid:m.stress midpoint:60 steepness:0.10];
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.20 steepness:10.0]; // максимальный хаос
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionFearful score:s weight:0.90]];
    }

    // ── FRUSTRATED (Фрустрация) ──
    // Паттерн: стресс + КОЛЕБАНИЯ HR (то вверх то вниз) + средний BP
    {
        double s = 1.0;
        double hrVariance = [self shortTermHRVariance]; // дисперсия HR за 10 мин
        s *= [self sigmoid:m.stress midpoint:45 steepness:0.08];
        s *= [self sigmoid:hrVariance midpoint:8 steepness:0.15];       // HR прыгает
        s *= [self sigmoidInverse:m.hrv midpoint:48 steepness:0.08];
        s *= [self bellCurve:m.systolicBP center:125 width:15];          // BP средний (не скачок)
        s *= [self bellCurve:deltaHR center:10 width:12];                // HR умеренно повышен
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionFrustrated score:s weight:0.76]];
    }

    // ── MEDITATIVE (Медитация) ──
    // Паттерн: HRV↑↑ + HR↓↓ + stress <10 + ОЧЕНЬ высокая когерентность
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:65 steepness:0.10];           // HRV очень высокий
        s *= [self sigmoidInverse:m.stress midpoint:12 steepness:0.15]; // stress почти 0
        s *= [self sigmoidInverse:deltaHR midpoint:3 steepness:0.20];   // HR у самого покоя
        s *= [self sigmoid:m.ppiCoherence midpoint:0.65 steepness:8.0]; // максимальная когерентность!
        s *= [self sigmoidInverse:n.activityScore midpoint:15 steepness:0.12]; // неподвижен
        s *= [self sigmoid:m.spo2 midpoint:97 steepness:1.5];           // дыхание ровное
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionMeditative score:s weight:0.88]];
    }

    // ── DROWSY (Сонливость) ──
    // Паттерн: HR↓ + HRV↓ + temp↓ + нет активности + послеобеденное время
    {
        double s = 1.0;
        s *= [self sigmoidInverse:deltaHR midpoint:2 steepness:0.15];    // HR низкий
        s *= [self sigmoidInverse:m.hrv midpoint:45 steepness:0.06];     // HRV тоже снижен
        s *= [self sigmoidInverse:tempDelta midpoint:-0.1 steepness:4.0]; // temp чуть ниже нормы
        s *= [self sigmoidInverse:n.activityScore midpoint:10 steepness:0.15]; // нулевая активность
        s *= [self sigmoidInverse:m.stress midpoint:25 steepness:0.08];  // стресс низкий
        // Бонус за послеобеденное время (13:00-16:00) или позднее (22:00+)
        double timeBonus = [self drowsyTimeBonus:timeOfDay]; // 0.5-1.0
        s *= timeBonus;
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionDrowsy score:s weight:0.74]];
    }

    // ── EXCITED (Возбуждение/Эйфория) ──
    // Паттерн: как Joyful, но ИНТЕНСИВНЕЕ — HR↑↑ + HRV↑ + temp↑ + actScore↑
    {
        double s = 1.0;
        s *= [self sigmoid:m.hrv midpoint:55 steepness:0.10];
        s *= [self sigmoidInverse:m.stress midpoint:25 steepness:0.10];
        s *= [self sigmoid:deltaHR midpoint:18 steepness:0.10];          // HR СИЛЬНО повышен
        s *= [self sigmoid:m.ppiCoherence midpoint:0.50 steepness:6.0];
        s *= [self sigmoid:m.spo2 midpoint:96.5 steepness:1.5];
        s *= [self sigmoid:n.activityScore midpoint:50 steepness:0.05];
        s *= [self sigmoid:tempDelta midpoint:0.15 steepness:4.0];       // temp повышена
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionExcited score:s weight:0.73]];
    }

    // ── PAIN (Боль/Дискомфорт) ──
    // Паттерн: HR↑ + stress↑ + HRV↓ + temp↑ + actScore↓ + НЕ тренировка
    {
        double s = 1.0;
        s *= [self sigmoid:deltaHR midpoint:10 steepness:0.10];
        s *= [self sigmoid:m.stress midpoint:45 steepness:0.08];
        s *= [self sigmoidInverse:m.hrv midpoint:40 steepness:0.08];
        s *= [self sigmoid:tempDelta midpoint:0.3 steepness:4.0];        // temp↑ (воспаление)
        s *= [self sigmoidInverse:n.activityScore midpoint:20 steepness:0.10]; // не двигается
        s *= [self sigmoidInverse:m.ppiCoherence midpoint:0.35 steepness:6.0];
        BOOL notExercising = (currentActivityMode == NONE);
        s *= notExercising ? 1.0 : 0.1;                                  // если тренировка — не боль
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionPain score:s weight:0.82]];
    }

    // ── FLOW (Состояние потока) ──
    // Паттерн: идеальный баланс — HRV в ОПТИМУМЕ + stress 25-40 + высокая когерентность
    // + умеренная активность. "Зона" где challenge = skill.
    {
        double s = 1.0;
        s *= [self bellCurve:m.hrv center:55 width:15];                  // HRV в оптимуме (не низкий, не высокий)
        s *= [self bellCurve:m.stress center:32 width:10];               // stress в "продуктивной зоне"
        s *= [self bellCurve:deltaHR center:8 width:6];                  // HR чуть повышен
        s *= [self sigmoid:m.ppiCoherence midpoint:0.55 steepness:7.0]; // высокая когерентность
        s *= [self sigmoid:m.spo2 midpoint:96.5 steepness:1.5];
        // Flow длится — нужна стабильность > 15 мин
        double stabilityBonus = [self emotionStabilityDuration:WVIEmotionFlow] > 900 ? 1.2 : 0.8;
        s *= MIN(1.0, s * stabilityBonus);
        [candidates addObject:[WVIEmotionCandidate make:WVIEmotionFlow score:s weight:0.85]];
    }

    // ── CALM (Спокойствие — default positive) ──
    // Паттерн: всё в норме, нет ярко выраженных паттернов
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
    // STEP 2: Ранжирование + Temporal Smoothing
    // ════════════════════════════════════════════════════════

    // Сортируем по weighted score
    [candidates sortUsingComparator:^(WVIEmotionCandidate *a, WVIEmotionCandidate *b) {
        double scoreA = a.score * a.weight;
        double scoreB = b.score * b.weight;
        return [@(scoreB) compare:@(scoreA)];
    }];

    WVIEmotionCandidate *top = candidates.firstObject;

    // Temporal Smoothing: не менять эмоцию, если прошло < 5 мин
    // и новая эмоция не сильно убедительнее предыдущей
    NSTimeInterval elapsed = [NSDate.date timeIntervalSinceDate:prevTS];
    if (elapsed < 300 && top.emotion != prevEmotion) {
        // Нужен перевес > 30% чтобы сменить эмоцию за < 5 мин
        WVIEmotionCandidate *prevCandidate = [self findCandidate:prevEmotion in:candidates];
        double topWeighted = top.score * top.weight;
        double prevWeighted = prevCandidate.score * prevCandidate.weight;
        if (topWeighted < prevWeighted * 1.3) {
            top = prevCandidate; // остаёмся на предыдущей
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

// Sigmoid: плавный переход 0→1 вокруг midpoint
- (double)sigmoid:(double)x midpoint:(double)mid steepness:(double)k {
    return 1.0 / (1.0 + exp(-k * (x - mid)));
}

// Inverse Sigmoid: плавный переход 1→0
- (double)sigmoidInverse:(double)x midpoint:(double)mid steepness:(double)k {
    return 1.0 / (1.0 + exp(k * (x - mid)));
}

// Bell Curve: максимум в center, спад в обе стороны
- (double)bellCurve:(double)x center:(double)c width:(double)w {
    return exp(-pow(x - c, 2) / (2 * pow(w, 2)));
}
```

### 3.3 Описания эмоций для пользователя

```objc
- (NSString *)emotionDescription:(WVIEmotionState)emotion {
    switch (emotion) {
        // Позитивные
        case WVIEmotionCalm:       return @"😌 Спокойствие — нервная система в балансе";
        case WVIEmotionRelaxed:    return @"🧘 Расслабленность — глубокий парасимпатический отдых";
        case WVIEmotionJoyful:     return @"😊 Радость — позитивная активация, допамин + серотонин";
        case WVIEmotionEnergized:  return @"⚡ Энергичность — высокий тонус, отличная форма";
        case WVIEmotionExcited:    return @"🎉 Возбуждение — пиковая позитивная энергия";
        // Нейтральные
        case WVIEmotionFocused:    return @"🎯 Концентрация — контролируемое продуктивное напряжение";
        case WVIEmotionMeditative: return @"🕉 Медитация — глубокая когерентность, сознание ясное";
        case WVIEmotionRecovering: return @"🔄 Восстановление — организм выходит из нагрузки";
        case WVIEmotionDrowsy:     return @"😴 Сонливость — организм просит отдыха";
        // Негативные
        case WVIEmotionStressed:   return @"😰 Стресс — симпатика активирована, повышенная готовность";
        case WVIEmotionAnxious:    return @"😱 Тревожность — нервная гиперактивация, дышите глубже";
        case WVIEmotionAngry:      return @"😤 Гнев — агрессивная активация, нужна разрядка";
        case WVIEmotionFrustrated: return @"😣 Фрустрация — нарастающее напряжение, смените фокус";
        case WVIEmotionFearful:    return @"😨 Страх — острая реакция, вы в безопасности";
        case WVIEmotionSad:        return @"😔 Подавленность — низкая энергия, позаботьтесь о себе";
        case WVIEmotionExhausted:  return @"😩 Истощение — ресурсы на нуле, необходим отдых";
        // Физиологические
        case WVIEmotionPain:       return @"🤕 Дискомфорт — тело сигнализирует о проблеме";
        case WVIEmotionFlow:       return @"🌊 Состояние потока — пиковая производительность, не отвлекайтесь";
    }
}
```

---

## ЧАСТЬ 3B: MEGA ACTIVITY DETECTION ENGINE — Полный разбор активности

### 3B.0 Философия: КАЖДУЮ СЕКУНДУ знаем что делает человек

Устройство V8 даёт: HR (каждые 5 мин), HRV, steps, stress, SpO2, temperature, PPI, sleep phases, METS.
Из КОМБИНАЦИИ этих данных + времени суток + истории → определяем 50+ типов активности.

### 3B.1 Полная таксономия активностей (50 типов)

```objc
typedef NS_ENUM(NSInteger, WVIActivityType) {

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ A: СОН (5 типов)
    // ══════════════════════════════════════════════
    WVIActivityDeepSleep        = 0,   // Глубокий сон (N3): HRV↑↑, HR↓↓, нет движений
    WVIActivityLightSleep       = 1,   // Лёгкий сон (N1-N2): HRV средний, редкие микродвижения
    WVIActivityREMSleep         = 2,   // REM-фаза: HRV нерегулярный, HR колеблется, PPI хаотичный
    WVIActivityNap              = 3,   // Дневной сон (<90 мин, дневное время)
    WVIActivityFallingAsleep    = 4,   // Засыпание: HR↓ постепенно, HRV↑ постепенно

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ B: ПОКОЙ / ПАССИВНОЕ (7 типов)
    // ══════════════════════════════════════════════
    WVIActivityResting          = 5,   // Отдых лёжа (не спит): HR у resting, steps=0
    WVIActivitySittingRelaxed   = 6,   // Сидит расслабленно (ТВ, чтение): HR↓, stress↓
    WVIActivitySittingWorking   = 7,   // Сидит работает (ментальная нагрузка): HR слегка↑, stress↑
    WVIActivityStanding         = 8,   // Стоит на месте: HR чуть выше чем сидя
    WVIActivityLyingAwake       = 9,   // Лежит бодрствуя: HR у resting, stress может быть любой
    WVIActivityPhoneScrolling   = 10,  // Сидит с телефоном: stress↑ микро-скачками, steps=0
    WVIActivityWatchingScreen   = 11,  // Экранное время (ТВ/кино): HR стабильный, stress от контента

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ C: ХОДЬБА (5 типов)
    // ══════════════════════════════════════════════
    WVIActivityStroll           = 12,  // Прогулка (<3.5 км/ч, <60 шаг/мин): релаксация
    WVIActivityWalkNormal       = 13,  // Обычная ходьба (3.5-5 км/ч, 60-90 шаг/мин)
    WVIActivityWalkBrisk        = 14,  // Быстрая ходьба (5-7 км/ч, 90-120 шаг/мин): аэробная
    WVIActivityHiking           = 15,  // Хайкинг: длительная ходьба + HR зона 2-3
    WVIActivityNordicWalking    = 16,  // Скандинавская ходьба: HR зона 2-3 + ритмичный шаг

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ D: БЕГ (5 типов)
    // ══════════════════════════════════════════════
    WVIActivityJogging          = 17,  // Лёгкий бег (>120 шаг/мин, HR зона 2-3)
    WVIActivityRunTempo         = 18,  // Темповой бег (HR зона 3-4, стабильный ритм)
    WVIActivityRunInterval      = 19,  // Интервальный бег (HR чередуется зона 2↔4-5)
    WVIActivitySprinting        = 20,  // Спринт (HR зона 5, >160 шаг/мин, <2 мин)
    WVIActivityTrailRunning     = 21,  // Трейл (HR колеблется из-за рельефа, длительный)

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ E: ВЕЛОСИПЕД / КАРДИО МАШИНЫ (4 типа)
    // ══════════════════════════════════════════════
    WVIActivityCycling          = 22,  // Велосипед: HR зона 2-4, steps=0, длительный
    WVIActivityStationaryBike   = 23,  // Велотренажёр: тот же паттерн, но в помещении
    WVIActivityElliptical       = 24,  // Эллиптик: HR зона 2-3, steps ~80-100/мин (руки двигаются)
    WVIActivityRowing           = 25,  // Гребля: ритмичный HR, steps мало, интервальный паттерн

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ F: СИЛОВЫЕ / GYM (5 типов)
    // ══════════════════════════════════════════════
    WVIActivityWeightTraining   = 26,  // Силовая: HR интервальный (подход→отдых→подход)
    WVIActivityBodyweight       = 27,  // Воркаут (отжимания, подтягивания): интервальный HR
    WVIActivityCrossfit         = 28,  // Кроссфит: HR зона 4-5 длительно + интервалы
    WVIActivityHIIT             = 29,  // HIIT: HR резко 1↔5 зона каждые 20-60 сек
    WVIActivityCircuitTraining  = 30,  // Круговая: HR средне-высокий стабильно

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ G: ГИБКОСТЬ / MIND-BODY (5 типов)
    // ══════════════════════════════════════════════
    WVIActivityYogaVinyasa      = 31,  // Виньяса йога: HR зона 1-2, ритмичный, HRV↑
    WVIActivityYogaHot          = 32,  // Горячая йога: HR зона 2-3, temp↑↑, SpO2 может↓
    WVIActivityPilates          = 33,  // Пилатес: HR зона 1-2, контролируемый
    WVIActivityStretching       = 34,  // Растяжка: HR у resting, HRV↑
    WVIActivityMeditation       = 35,  // Медитация: HR↓↓, HRV↑↑, PPI когерентность↑↑, stress→0

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ H: СПОРТИВНЫЕ ИГРЫ (7 типов)
    // ══════════════════════════════════════════════
    WVIActivityFootball         = 36,  // Футбол: HR чередуется 2-5 зона, много шагов, рваный ритм
    WVIActivityBasketball       = 37,  // Баскетбол: быстрые спринты + отдых, HR 3-5
    WVIActivityTennis           = 38,  // Теннис: интервальный (розыгрыш→пауза), HR 2-4
    WVIActivityBadminton        = 39,  // Бадминтон: быстрые рывки, HR 2-4
    WVIActivitySwimming         = 40,  // Плавание: HR зона 2-4, steps=0, SpO2↓ кратковременно
    WVIActivityMartialArts      = 41,  // Единоборства: HR 3-5, интервальный, stress↑
    WVIActivityDancing          = 42,  // Танцы: HR 2-4, ритмичные шаги, HRV может↑

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ I: ПОВСЕДНЕВНЫЕ (6 типов)
    // ══════════════════════════════════════════════
    WVIActivityHousework        = 43,  // Домашние дела: нерегулярные шаги, HR зона 1-2
    WVIActivityCooking          = 44,  // Готовка: стоит, мало шагов, temp руки↑
    WVIActivityDriving          = 45,  // Вождение: сидит, stress может↑, steps=0
    WVIActivityCommuting        = 46,  // В транспорте: сидит/стоит, микро-стресс
    WVIActivityShopping         = 47,  // Шопинг: медленная ходьба + частые остановки
    WVIActivityEating           = 48,  // Приём пищи: HR↑ на 5-15 BPM (термогенез), temp↑

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ J: ФИЗИОЛОГИЧЕСКИЕ СОБЫТИЯ (7 типов)
    // ══════════════════════════════════════════════
    WVIActivityStressEvent      = 49,  // Стрессовое событие: HR↑ + stress↑ + steps=0
    WVIActivityPanicAttack      = 50,  // Паническая атака: HR↑↑ резко + SpO2↓ + HRV↓↓ + steps=0
    WVIActivityCrying           = 51,  // Плач: HR↑ умеренно + нерегулярное дыхание (SpO2 колебания)
    WVIActivityLaughing         = 52,  // Смех: HR↑ кратковременно + PPI хаос + stress↓
    WVIActivityPain             = 53,  // Болевой эпизод: HR↑ + stress↑ + temp↑ + steps=0
    WVIActivityIllness          = 54,  // Болезнь: temp↑↑ + HR↑ + HRV↓ + SpO2↓ + actScore↓
    WVIActivityIntimacy         = 55,  // Интимная близость: HR↑↑ постепенно → пик → резкий↓

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ K: ВОССТАНОВЛЕНИЕ (4 типа)
    // ══════════════════════════════════════════════
    WVIActivityWarmUp           = 56,  // Разминка: HR плавно↑ от resting к зоне 2
    WVIActivityCoolDown         = 57,  // Заминка: HR плавно↓ от зоны 3+ к resting
    WVIActivityActiveRecovery   = 58,  // Активное восстановление: HR зона 1, лёгкая ходьба
    WVIActivityPassiveRecovery  = 59,  // Пассивный отдых: лежит, HRV↑, HR→resting

    // ══════════════════════════════════════════════
    // КАТЕГОРИЯ L: МЕНТАЛЬНЫЕ (4 типа)
    // ══════════════════════════════════════════════
    WVIActivityDeepWork         = 60,  // Глубокая работа: stress 25-45, HR чуть↑, steps=0, >45мин
    WVIActivityPresentation     = 61,  // Выступление: stress↑↑ + HR↑↑ + стоит
    WVIActivityExam             = 62,  // Экзамен/тест: stress↑↑ + HR↑ + сидит + длительно
    WVIActivityCreativeFlow     = 63   // Творческий поток: stress 20-35, HRV↑, PPI когерентность↑
};
// Итого: 64 типа активности (0-63)
```
```

### 3B.2 Уровни нагрузки

```objc
typedef NS_ENUM(NSInteger, WVILoadLevel) {
    WVILoadNone     = 0,   // Нет нагрузки (сон, покой)
    WVILoadMinimal  = 1,   // Минимальная (сидя, стоя)
    WVILoadLight    = 2,   // Лёгкая (ходьба, дела по дому)
    WVILoadModerate = 3,   // Умеренная (быстрая ходьба, йога)
    WVILoadHigh     = 4,   // Высокая (бег, велосипед, тренажёрка)
    WVILoadIntense  = 5,   // Интенсивная (HIIT, спринт)
    WVILoadExtreme  = 6    // Экстремальная (HR > 90% maxHR > 10 мин)
};

typedef NS_ENUM(NSInteger, WVILoadTarget) {
    WVILoadTargetCardio      = 0,   // Сердечно-сосудистая
    WVILoadTargetMuscular    = 1,   // Мышечная
    WVILoadTargetMental      = 2,   // Ментальная (стресс, концентрация)
    WVILoadTargetMixed       = 3    // Комбинированная
};
```

### 3B.3 Результат анализа активности

```objc
@interface WVIActivityResult : NSObject
@property WVIActivityType activityType;         // Что делает
@property WVILoadLevel loadLevel;               // Уровень нагрузки 0-6
@property WVILoadTarget loadTarget;             // На что нагрузка
@property double loadScore;                     // Числовая нагрузка 0-100
@property double confidence;                    // 0-1
@property NSString *activityDescription;        // Текстовое описание
@property double caloriesPerMinute;             // Расход калорий/мин
@property double heartRateZone;                 // Пульсовая зона 1-5
@property double durationMinutes;               // Длительность текущей активности
@property double cumulativeLoadToday;           // Накопленная нагрузка за день (TRIMP)

// Пульсовые зоны
@property double hrZone1Mins;  // 50-60% maxHR (recovery)
@property double hrZone2Mins;  // 60-70% maxHR (fat burn)
@property double hrZone3Mins;  // 70-80% maxHR (aerobic)
@property double hrZone4Mins;  // 80-90% maxHR (anaerobic)
@property double hrZone5Mins;  // 90-100% maxHR (VO2max)
@end
```

### 3B.4 МЕГА-АЛГОРИТМ детекции активности (64 типа)

#### Входные сигналы для детекции

```objc
@interface WVIActivitySignals : NSObject
// Прямые данные
@property double heartRate;             // BPM текущий
@property double restingHR;             // BPM ночной средний
@property double maxHR;                 // 208 - 0.7 * age
@property double hrReserve;             // maxHR - restingHR
@property double hrPercent;             // (HR - restingHR) / hrReserve * 100
@property int hrZone;                   // 0-5

@property double hrv;                   // ms
@property double stress;                // 0-100
@property double spo2;                  // %
@property double temperature;           // °C
@property double baseTemp;              // персональная норма
@property double ppiCoherence;          // 0-1
@property double ppiRMSSD;              // ms

// Шаги и движение
@property double stepsPerMin;           // шаги за последние 5 мин / 5
@property double stepCadence;           // ритмичность шага (0-1)
@property double totalStepsToday;       // всего за день

// Производные (рассчитываются)
@property double deltaHR;              // HR - restingHR
@property double hrAcceleration;       // dHR/dt (BPM/мин, скорость изменения)
@property double shortTermHRVariance;  // дисперсия HR за 10 мин
@property double hrIntervalPattern;    // 0=стабильный, 1=интервальный (подход/отдых)
@property double hrRampDirection;      // -1=снижается, 0=стабильно, 1=растёт
@property double breathingRate;        // приблизительно из PPI
@property double breathingRegularity;  // 0=хаотичное, 1=ритмичное

// Время и контекст
@property int hour;                    // 0-23
@property int dayOfWeek;               // 0-6
@property double minutesSinceLastActivity; // мин с последней смены активности
@property WVIActivityType previousActivity; // предыдущая активность

// SDK данные
@property ACTIVITYMODE_V8 sdkActivityMode; // если SDK трекает
@property WORKMODE_V8 sdkWorkMode;         // start/pause/stop
@property double mets;                     // METS из SDK
@end
```

#### Полный каскадный алгоритм

```objc
- (WVIActivityResult *)detectActivity:(WVIActivitySignals *)s {

    WVIActivityResult *result = [[WVIActivityResult alloc] init];
    result.heartRateZone = s.hrZone;

    // ═══════════════════════════════════════════════════════
    // LEVEL 0: SDK ACTIVITY MODE (если устройство трекает)
    // Confidence: 0.95 — доверяем устройству
    // ═══════════════════════════════════════════════════════

    if (s.sdkWorkMode == startActivity || s.sdkWorkMode == continueActivity) {
        result.activityType = [self mapSDKToActivity:s.sdkActivityMode hrZone:s.hrZone];
        result.confidence = 0.95;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL 1: КРИТИЧЕСКИЕ / ЭКСТРЕННЫЕ СОСТОЯНИЯ
    // Проверяем ПЕРВЫМИ — здоровье важнее классификации
    // ═══════════════════════════════════════════════════════

    // ── ПАНИЧЕСКАЯ АТАКА ──
    // Резкий HR↑↑ (>40 BPM за <2 мин) + SpO2↓ + HRV↓↓ + нет движений
    if (s.hrAcceleration > 20 && s.deltaHR > 40 && s.spo2 < 96
        && s.hrv < 20 && s.stepsPerMin < 2 && s.ppiCoherence < 0.15) {
        result.activityType = WVIActivityPanicAttack;
        result.confidence = 0.88;
        result.loadLevel = WVILoadHigh;
        result.loadTarget = WVILoadTargetMental;
        result.isEmergency = YES;
        result.alertMessage = @"⚠️ Возможная паническая атака. Дышите: 4 сек вдох, 7 сек выдох";
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── БОЛЕЗНЬ / ЛИХОРАДКА ──
    // temp > 38°C + HR↑ + HRV↓ + SpO2↓ + actScore↓
    if (s.temperature > 38.0 && s.deltaHR > 10 && s.hrv < 35
        && s.spo2 < 96 && s.stepsPerMin < 3) {
        result.activityType = WVIActivityIllness;
        result.confidence = 0.85;
        result.loadLevel = WVILoadNone;
        result.alertMessage = @"🌡 Повышенная температура + изменённые показатели";
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── БОЛЕВОЙ ЭПИЗОД ──
    // HR↑ + stress↑↑ + temp↑ (локальное воспаление) + steps=0 + НЕ тренировка
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
    // LEVEL 2: СОН (приоритет по времени суток)
    // ═══════════════════════════════════════════════════════

    BOOL isSleepWindow = (s.hour >= 21 || s.hour < 8);
    BOOL sleepSignals = (s.stepsPerMin < 1 && s.deltaHR < 8 && s.stress < 30);

    if (isSleepWindow && sleepSignals) {

        // ── ЗАСЫПАНИЕ ──
        // HR постепенно↓ + HRV постепенно↑ + предыдущая активность не сон
        if (s.hrRampDirection < -0.3 && s.previousActivity != WVIActivityDeepSleep
            && s.previousActivity != WVIActivityLightSleep
            && s.previousActivity != WVIActivityREMSleep) {
            result.activityType = WVIActivityFallingAsleep;
            result.confidence = 0.78;
        }
        // ── ГЛУБОКИЙ СОН (N3) ──
        // HRV↑↑ + HR у минимума + PPI когерентность↑↑ + абсолютная неподвижность
        else if (s.hrv > 55 && s.deltaHR < 3 && s.ppiCoherence > 0.55
                 && s.stepsPerMin == 0 && s.breathingRegularity > 0.7) {
            result.activityType = WVIActivityDeepSleep;
            result.confidence = 0.90;
        }
        // ── REM-ФАЗА ──
        // HRV нерегулярный (колеблется) + HR колеблется + PPI хаотичный
        // REM: парасимпатика отключается периодически
        else if (s.shortTermHRVariance > 5 && s.ppiCoherence < 0.35
                 && s.stepsPerMin < 0.5 && s.hrv < 45) {
            result.activityType = WVIActivityREMSleep;
            result.confidence = 0.72;
        }
        // ── ЛЁГКИЙ СОН (N1-N2) ──
        else {
            result.activityType = WVIActivityLightSleep;
            result.confidence = 0.85;
        }

        result.loadLevel = WVILoadNone;
        result.loadTarget = WVILoadTargetCardio;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ДНЕВНОЙ СОН (NAP) ──
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
    // LEVEL 3: ВЫСОКОИНТЕНСИВНЫЕ ТРЕНИРОВКИ
    // (HR зона 4-5, определяем ТИП)
    // ═══════════════════════════════════════════════════════

    if (s.hrZone >= 4) {

        // ── СПРИНТ ──
        // >150 шагов/мин + HR зона 5 + <3 мин
        if (s.stepsPerMin > 150 && s.hrZone == 5 && s.minutesSinceLastActivity < 3) {
            result.activityType = WVIActivitySprinting;
            result.confidence = 0.90;
            result.loadLevel = WVILoadExtreme;
        }
        // ── HIIT ──
        // HR резко чередуется зона 1↔5 каждые 20-60 сек
        else if (s.hrIntervalPattern > 0.7 && s.shortTermHRVariance > 20) {
            result.activityType = WVIActivityHIIT;
            result.confidence = 0.82;
            result.loadLevel = WVILoadExtreme;
        }
        // ── CROSSFIT ──
        // HR зона 4-5 длительно (>10мин) + интервальный + шаги нерегулярные
        else if (s.minutesSinceLastActivity > 10 && s.hrIntervalPattern > 0.4
                 && s.stepsPerMin > 20 && s.stepsPerMin < 80) {
            result.activityType = WVIActivityCrossfit;
            result.confidence = 0.68;
            result.loadLevel = WVILoadExtreme;
        }
        // ── БАСКЕТБОЛ / ФУТБОЛ ──
        // Быстрые спринты + отдых + много шагов + рваный ритм
        else if (s.hrIntervalPattern > 0.5 && s.stepsPerMin > 40 && s.stepCadence < 0.5) {
            // Рваный шаг = игровой вид спорта
            if (s.stepsPerMin > 80) {
                result.activityType = WVIActivityFootball;
            } else {
                result.activityType = WVIActivityBasketball;
            }
            result.confidence = 0.55; // низкая — сложно различить
            result.loadLevel = WVILoadIntense;
        }
        // ── ЕДИНОБОРСТВА ──
        // HR 4-5 + stress↑ + steps мало + интервальный
        else if (s.stress > 50 && s.stepsPerMin < 30 && s.hrIntervalPattern > 0.5) {
            result.activityType = WVIActivityMartialArts;
            result.confidence = 0.55;
            result.loadLevel = WVILoadIntense;
        }
        // ── ИНТЕРВАЛЬНЫЙ БЕГ ──
        // Шаги > 120 + HR чередуется 2↔5
        else if (s.stepsPerMin > 120 && s.hrIntervalPattern > 0.4) {
            result.activityType = WVIActivityRunInterval;
            result.confidence = 0.78;
            result.loadLevel = WVILoadIntense;
        }
        // ── ТЕМПОВОЙ БЕГ ──
        // Шаги > 130 + HR стабильно в зоне 4
        else if (s.stepsPerMin > 130 && s.shortTermHRVariance < 5) {
            result.activityType = WVIActivityRunTempo;
            result.confidence = 0.80;
            result.loadLevel = WVILoadHigh;
        }
        // ── FALLBACK: Интенсивная тренировка без шагов = велосипед / гребля
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
    // LEVEL 4: СРЕДНИЕ ТРЕНИРОВКИ (HR зона 2-3)
    // ═══════════════════════════════════════════════════════

    if (s.hrZone >= 2 && s.hrZone <= 3) {

        // ── БЕГ (лёгкий) ──
        if (s.stepsPerMin > 120 && s.stepCadence > 0.7) {
            result.activityType = WVIActivityJogging;
            result.confidence = 0.85;
            result.loadLevel = WVILoadModerate;
        }
        // ── ТРЕЙЛ ──
        // Бег + HR колеблется (рельеф) + длительный (>30 мин)
        else if (s.stepsPerMin > 100 && s.shortTermHRVariance > 8
                 && s.minutesSinceLastActivity > 30) {
            result.activityType = WVIActivityTrailRunning;
            result.confidence = 0.60;
            result.loadLevel = WVILoadHigh;
        }
        // ── БЫСТРАЯ ХОДЬБА ──
        else if (s.stepsPerMin >= 90 && s.stepsPerMin < 120) {
            result.activityType = WVIActivityWalkBrisk;
            result.confidence = 0.85;
            result.loadLevel = WVILoadModerate;
        }
        // ── ХАЙКИНГ ──
        // Ходьба + HR зона 2-3 + длительный (>60 мин)
        else if (s.stepsPerMin >= 50 && s.stepsPerMin < 90
                 && s.minutesSinceLastActivity > 60) {
            result.activityType = WVIActivityHiking;
            result.confidence = 0.60;
            result.loadLevel = WVILoadModerate;
        }
        // ── ТАНЦЫ ──
        // Ритмичные шаги + HR зона 2-3 + HRV может быть↑ (удовольствие)
        else if (s.stepsPerMin > 50 && s.stepCadence > 0.6 && s.hrv > 45) {
            result.activityType = WVIActivityDancing;
            result.confidence = 0.50;
            result.loadLevel = WVILoadModerate;
        }
        // ── ВЕЛОСИПЕД / ЭЛЛИПТИК ──
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
        // ── СИЛОВАЯ (подход + отдых) ──
        else if (s.stepsPerMin < 10 && s.hrIntervalPattern > 0.4) {
            result.activityType = WVIActivityWeightTraining;
            result.confidence = 0.70;
            result.loadLevel = WVILoadHigh;
        }
        // ── БАДМИНТОН / ТЕННИС ──
        else if (s.stepsPerMin > 20 && s.stepsPerMin < 60 && s.hrIntervalPattern > 0.3) {
            if (s.hrIntervalPattern > 0.5) {
                result.activityType = WVIActivityTennis;
            } else {
                result.activityType = WVIActivityBadminton;
            }
            result.confidence = 0.45;
            result.loadLevel = WVILoadModerate;
        }
        // ── ГОРЯЧАЯ ЙОГА ──
        // HR зона 2-3 + temp↑↑ + steps мало + HRV нормальный
        else if (s.stepsPerMin < 5 && (s.temperature - s.baseTemp) > 0.8 && s.hrv > 40) {
            result.activityType = WVIActivityYogaHot;
            result.confidence = 0.55;
            result.loadLevel = WVILoadModerate;
        }
        // ── ПЛАВАНИЕ ──
        // HR зона 2-4 + steps=0 + SpO2↓ кратковременно (задержка дыхания при гребках)
        else if (s.stepsPerMin == 0 && s.spo2 < 97 && s.breathingRegularity < 0.4) {
            result.activityType = WVIActivitySwimming;
            result.confidence = 0.50;
            result.loadLevel = WVILoadHigh;
        }
        else {
            // FALLBACK: обычная ходьба
            result.activityType = WVIActivityWalkNormal;
            result.confidence = 0.60;
            result.loadLevel = WVILoadLight;
        }

        [self enrichResult:result withSignals:s];
        return result;
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL 5: ЛЁГКАЯ АКТИВНОСТЬ (HR зона 1 или ниже)
    // ═══════════════════════════════════════════════════════

    // ── РАЗМИНКА ──
    // HR плавно растёт от resting к зоне 2 + началось <5 мин назад
    if (s.hrRampDirection > 0.5 && s.hrZone <= 1 && s.minutesSinceLastActivity < 5
        && (s.previousActivity == WVIActivitySittingRelaxed
            || s.previousActivity == WVIActivityStanding)) {
        result.activityType = WVIActivityWarmUp;
        result.confidence = 0.70;
        result.loadLevel = WVILoadLight;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ЗАМИНКА ──
    // HR плавно снижается от зоны 3+ к resting + предыдущая активность = тренировка
    if (s.hrRampDirection < -0.3 && [self isPreviousActivityExercise:s.previousActivity]) {
        result.activityType = WVIActivityCoolDown;
        result.confidence = 0.75;
        result.loadLevel = WVILoadLight;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── АКТИВНОЕ ВОССТАНОВЛЕНИЕ ──
    // HR зона 1 + лёгкие шаги + после тренировки
    if (s.hrZone == 1 && s.stepsPerMin > 20 && s.stepsPerMin < 60
        && [self isPreviousActivityExercise:s.previousActivity]) {
        result.activityType = WVIActivityActiveRecovery;
        result.confidence = 0.72;
        result.loadLevel = WVILoadLight;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── МЕДИТАЦИЯ ──
    if (s.hrv > 60 && s.stress < 12 && s.deltaHR < 3 && s.ppiCoherence > 0.60
        && s.stepsPerMin < 1 && s.breathingRegularity > 0.75) {
        result.activityType = WVIActivityMeditation;
        result.confidence = 0.85;
        result.loadLevel = WVILoadMinimal;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ЙОГА / ПИЛАТЕС / РАСТЯЖКА ──
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

    // ── ХОДЬБА (разные типы) ──
    if (s.stepsPerMin > 0) {
        if (s.stepsPerMin > 60 && s.stepsPerMin < 90) {
            result.activityType = WVIActivityWalkNormal;
            result.confidence = 0.82;
            result.loadLevel = WVILoadLight;
        } else if (s.stepsPerMin >= 30 && s.stepsPerMin <= 60) {
            // Медленная прогулка или шопинг (частые остановки)
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
    // LEVEL 6: НЕПОДВИЖЕН (steps=0, HR < зоны)
    // Определяем ЧТО делает сидя/лёжа
    // ═══════════════════════════════════════════════════════

    // ── ИНТИМНАЯ БЛИЗОСТЬ ──
    // HR↑↑ постепенно → пик → резкий↓ + stress↓ + лёжа + ночь
    if (s.deltaHR > 25 && s.hrRampDirection > 0.5 && s.stress < 40
        && s.stepsPerMin == 0 && (s.hour >= 21 || s.hour < 2)) {
        result.activityType = WVIActivityIntimacy;
        result.confidence = 0.50; // деликатная тема, низкая уверенность
        result.loadLevel = WVILoadModerate;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── СМЕХ ──
    // HR↑ кратковременно (2-3 мин) + PPI хаос + stress↓ + stepsPerMin=0
    if (s.deltaHR > 5 && s.deltaHR < 20 && s.ppiCoherence < 0.3
        && s.stress < 25 && s.stepsPerMin == 0 && s.minutesSinceLastActivity < 3) {
        result.activityType = WVIActivityLaughing;
        result.confidence = 0.45;
        result.loadLevel = WVILoadMinimal;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ПЛАЧ ──
    // HR↑ умеренно + нерегулярное дыхание (SpO2 колебания) + stress↑
    if (s.deltaHR > 5 && s.breathingRegularity < 0.3 && s.stress > 40
        && s.stepsPerMin == 0 && s.spo2 < 98) {
        result.activityType = WVIActivityCrying;
        result.confidence = 0.40;
        result.loadLevel = WVILoadMinimal;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── СТРЕССОВОЕ СОБЫТИЕ ──
    if (s.stress > 55 && s.deltaHR > 15 && s.stepsPerMin < 2 && s.hrv < 35) {
        result.activityType = WVIActivityStressEvent;
        result.confidence = 0.78;
        result.loadLevel = WVILoadModerate;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ВЫСТУПЛЕНИЕ / ПРЕЗЕНТАЦИЯ ──
    // stress↑↑ + HR↑↑ + стоит (нет шагов, но вертикально)
    if (s.stress > 50 && s.deltaHR > 15 && s.stepsPerMin < 5
        && s.hour >= 9 && s.hour <= 18) {
        result.activityType = WVIActivityPresentation;
        result.confidence = 0.45;
        result.loadLevel = WVILoadModerate;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ЭКЗАМЕН / ВЫСОКАЯ МЕНТАЛЬНАЯ НАГРУЗКА ──
    if (s.stress > 45 && s.deltaHR > 8 && s.stepsPerMin == 0
        && s.minutesSinceLastActivity > 30) {
        result.activityType = WVIActivityExam;
        result.confidence = 0.40;
        result.loadLevel = WVILoadModerate;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ПРИЁМ ПИЩИ ──
    BOOL mealTime = (s.hour>=7 && s.hour<=9) || (s.hour>=12 && s.hour<=14) || (s.hour>=18 && s.hour<=20);
    if (mealTime && s.deltaHR > 5 && s.deltaHR < 18 && s.stepsPerMin < 3
        && (s.temperature - s.baseTemp) > 0.1 && s.stress < 35) {
        result.activityType = WVIActivityEating;
        result.confidence = 0.55;
        result.loadLevel = WVILoadMinimal;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ТВОРЧЕСКИЙ ПОТОК ──
    // stress 20-35 + HRV↑ + PPI когерентность↑ + сидит + длительно > 45 мин
    if (s.stress >= 20 && s.stress <= 35 && s.hrv > 50 && s.ppiCoherence > 0.50
        && s.stepsPerMin == 0 && s.minutesSinceLastActivity > 45) {
        result.activityType = WVIActivityCreativeFlow;
        result.confidence = 0.55;
        result.loadLevel = WVILoadLight;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── DEEP WORK (глубокая работа) ──
    // stress 25-45 + HR чуть↑ + steps=0 + >45 мин
    if (s.stress >= 25 && s.stress <= 50 && s.deltaHR > 3 && s.deltaHR < 15
        && s.stepsPerMin == 0 && s.minutesSinceLastActivity > 30) {
        result.activityType = WVIActivityDeepWork;
        result.confidence = 0.60;
        result.loadLevel = WVILoadLight;
        result.loadTarget = WVILoadTargetMental;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ВОЖДЕНИЕ ──
    // Сидит + stress может быть разный + HR стабильный + рабочие часы
    if (s.stepsPerMin == 0 && s.deltaHR > 3 && s.deltaHR < 12
        && s.stress > 15 && s.stress < 45 && s.shortTermHRVariance < 4) {
        result.activityType = WVIActivityDriving;
        result.confidence = 0.40;
        result.loadLevel = WVILoadMinimal;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── ПАССИВНОЕ ВОССТАНОВЛЕНИЕ ──
    // Лежит + HRV↑ + HR→resting + после тренировки
    if (s.deltaHR < 5 && s.hrv > 55 && s.stepsPerMin == 0
        && [self isPreviousActivityExercise:s.previousActivity]) {
        result.activityType = WVIActivityPassiveRecovery;
        result.confidence = 0.72;
        result.loadLevel = WVILoadNone;
        [self enrichResult:result withSignals:s];
        return result;
    }

    // ── СИДИТ РАБОТАЕТ vs СИДИТ РАССЛАБЛЕННО ──
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

### 3B.5 Расчёт Load Score и TRIMP

```objc
// Load Score: насколько тяжёлая текущая нагрузка (0-100)
- (void)calculateLoadScore:(WVIActivityResult *)result
                    withHR:(double)hr maxHR:(double)maxHR mets:(double)mets {

    double hrPercent = hr / maxHR;

    // Banister's TRIMP per minute (Training Impulse)
    // TRIMP = duration * deltaHR * e^(b * deltaHR)
    // b = 1.92 (мужчины) или 1.67 (женщины)
    double b = 1.92; // TODO: из personalInfo.gender
    double deltaHRratio = hrPercent - 0.5; // нормализация от 50% maxHR
    double trimpPerMin = MAX(0, deltaHRratio) * exp(b * MAX(0, deltaHRratio));

    // Load Score: нормализация TRIMP в 0-100
    // trimpPerMin ~0 (покой) до ~3.5 (максимальная нагрузка)
    result.loadScore = MIN(100, trimpPerMin * 28.5);

    // Расход калорий/мин (приблизительный, через METS или HR)
    if (mets > 0) {
        // METs формула: Cal/min = METs * weight_kg * 3.5 / 200
        result.caloriesPerMinute = mets * 75.0 * 3.5 / 200.0; // TODO: реальный вес
    } else {
        // Формула через HR (Keytel et al. 2005)
        result.caloriesPerMinute = MAX(0, (-55.0969 + 0.6309 * hr + 0.0901 * 75
                                           + 0.2017 * 30) / 4.184); // TODO: возраст/вес
    }
}

// TRIMP: накопленная нагрузка за день
- (double)calculateDailyTRIMP:(NSArray<WVIActivityResult *> *)activityHistory {
    double totalTRIMP = 0;
    for (WVIActivityResult *ar in activityHistory) {
        totalTRIMP += ar.loadScore * ar.durationMinutes / 100.0;
    }
    return totalTRIMP;
    // Нормы: <50 лёгкий день, 50-100 средний, 100-200 тяжёлый, >200 перегрузка
}
```

### 3B.6 Пульсовые зоны и время в зонах

```objc
// Расчёт времени в каждой пульсовой зоне за день
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

// Рекомендуемое распределение (80/20 правило):
// Зоны 1-2: 80% времени (аэробная база)
// Зоны 3-5: 20% времени (интенсивность)
- (double)trainingBalanceScore:(WVIActivityResult *)result {
    double total = result.hrZone1Mins + result.hrZone2Mins +
                   result.hrZone3Mins + result.hrZone4Mins + result.hrZone5Mins;
    if (total < 10) return 50; // мало данных

    double lowIntensity = (result.hrZone1Mins + result.hrZone2Mins) / total;
    double highIntensity = (result.hrZone3Mins + result.hrZone4Mins + result.hrZone5Mins) / total;

    // Идеал: 80% low / 20% high
    double balance = 100 - fabs(lowIntensity - 0.80) * 200;
    return MAX(0, MIN(100, balance));
}
```

### 3B.7 Activity ↔ Emotion ↔ WVI связь

```objc
// Активность влияет на интерпретацию эмоций:
// - Высокий HR + Бег = НОРМА (не стресс!)
// - Высокий HR + Сидит = СТРЕСС
// - Высокий HR + Сидит + ночь = ТРЕВОГА

// Активность влияет на WVI веса:
// - Тренировка: wHR снижается (высокий HR = ок), wSpO2 растёт
// - Сон: wSleep максимальный, wActivity = 0
// - Работа: wStress и wEmotion растут

// Нагрузка влияет на рекомендации AI:
// - TRIMP > 200: "Перетренировка! Нужен день отдыха"
// - TRIMP < 20 (3 дня подряд): "Недостаток движения, попробуйте прогулку"
// - Зона 5 > 30 мин: "Снизьте интенсивность для здоровья сердца"
```

### 3B.8 enrichResult — дополнение результата полным разбором

```objc
- (void)enrichResult:(WVIActivityResult *)result withSignals:(WVIActivitySignals *)s {

    // Нагрузка
    [self calculateLoadScore:result withHR:s.heartRate maxHR:s.maxHR mets:s.mets];
    result.loadTarget = [self loadTargetFromActivityType:result.activityType];

    // Калории
    result.caloriesPerMinute = [self caloriesPerMin:s];

    // TRIMP за день (накопленная нагрузка)
    result.cumulativeLoadToday = [self dailyTRIMP];

    // Пульсовые зоны
    [self updateHRZones:result withHR:s.heartRate maxHR:s.maxHR duration:5.0];

    // Описание
    result.activityDescription = [self activityDescription:result.activityType];
    result.activityEmoji = [self activityEmoji:result.activityType];
    result.activityCategory = [self activityCategory:result.activityType];

    // Рекомендация в контексте активности
    result.contextualAdvice = [self adviceForActivity:result.activityType
                                          withSignals:s
                                               result:result];
}

// Категории для группировки
- (NSString *)activityCategory:(WVIActivityType)type {
    if (type <= 4)  return @"💤 Сон";
    if (type <= 11) return @"🪑 Покой";
    if (type <= 16) return @"🚶 Ходьба";
    if (type <= 21) return @"🏃 Бег";
    if (type <= 25) return @"🚴 Кардио-машины";
    if (type <= 30) return @"🏋️ Силовые";
    if (type <= 35) return @"🧘 Mind-Body";
    if (type <= 42) return @"⚽ Спорт";
    if (type <= 48) return @"🏠 Повседневные";
    if (type <= 55) return @"⚡ Физиологические";
    if (type <= 59) return @"🔄 Восстановление";
    return @"🧠 Ментальные";
}

// Эмодзи для каждого типа
- (NSString *)activityEmoji:(WVIActivityType)type {
    NSArray *emojis = @[
        @"😴",@"💤",@"🌙",@"😪",@"🥱",  // Сон
        @"🛋",@"📺",@"💻",@"🧍",@"🛏",@"📱",@"🎬", // Покой
        @"🚶",@"🚶",@"🏃‍♂️",@"🥾",@"🏔",  // Ходьба
        @"🏃",@"🏃‍♀️",@"⚡",@"💨",@"🏔",  // Бег
        @"🚴",@"🚲",@"🔄",@"🚣",          // Кардио
        @"🏋️",@"💪",@"🏋️‍♀️",@"⚡",@"🔁", // Силовые
        @"🧘",@"🔥",@"🤸",@"🙆",@"🕉",    // Mind-Body
        @"⚽",@"🏀",@"🎾",@"🏸",@"🏊",@"🥊",@"💃", // Спорт
        @"🧹",@"👨‍🍳",@"🚗",@"🚌",@"🛍",@"🍽", // Повседневные
        @"😰",@"😱",@"😢",@"😂",@"🤕",@"🤒",@"❤️‍🔥", // Физиологические
        @"🏃‍♂️",@"🧊",@"🚶‍♂️",@"😌",      // Восстановление
        @"🧠",@"🎤",@"📝",@"🎨"           // Ментальные
    ];
    return (type < emojis.count) ? emojis[type] : @"❓";
}

// Контекстная рекомендация
- (NSString *)adviceForActivity:(WVIActivityType)type
                    withSignals:(WVIActivitySignals *)s
                         result:(WVIActivityResult *)r {

    // Перетренировка
    if (r.cumulativeLoadToday > 200 && r.loadLevel >= WVILoadHigh) {
        return @"⚠️ Дневная нагрузка уже высокая. Рекомендую снизить интенсивность.";
    }

    // Слишком долго в зоне 5
    if (r.hrZone5Mins > 20) {
        return @"🔴 Более 20 мин в максимальной зоне. Снизьте темп для безопасности.";
    }

    // Слишком долго сидит
    if (type == WVIActivitySittingWorking && s.minutesSinceLastActivity > 60) {
        return @"🪑 Более часа без движения. Встаньте, пройдитесь 5 минут.";
    }

    // Недосып + тренировка
    if (r.loadLevel >= WVILoadHigh && [self lastNightSleepScore] < 50) {
        return @"😴 Плохой сон прошлой ночью. Снизьте нагрузку на 20-30%.";
    }

    // Обезвоживание (HR↑ необъяснимо)
    if (s.deltaHR > 15 && s.stress < 30 && type == WVIActivitySittingRelaxed) {
        return @"💧 HR повышен в покое. Возможно обезвоживание — выпейте воды.";
    }

    return nil; // нет особых рекомендаций
}
```

### 3B.9 Полный разбор активности — формат отчёта

```
🏃 ПОЛНЫЙ РАЗБОР АКТИВНОСТИ • {time}
═══════════════════════════════════

📍 СЕЙЧАС:
🏃‍♀️ Темповой бег (80%)
📊 Нагрузка: 72/100 — ВЫСОКАЯ (Кардио)
⏱ Длительность: 34 мин
🔥 Расход: 11.4 ккал/мин (388 ккал за сессию)

❤️ ПУЛЬС:
💓 HR: 162 BPM (82% от макс 197)
🏋️ Зона: 4 (Анаэробная)
📈 Тренд: стабильный

📊 ЗОНЫ ЗА ДЕНЬ:
💤 Вне зон: 8ч 12м (сон + покой)
🟦 Z1 Восстановление (50-60%): 45 мин
🟩 Z2 Жиросжигание (60-70%): 32 мин
🟨 Z3 Аэробная (70-80%): 28 мин
🟧 Z4 Анаэробная (80-90%): 34 мин ← СЕЙЧАС
🟥 Z5 VO2max (90-100%): 3 мин

📈 ДНЕВНАЯ НАГРУЗКА:
🔵 TRIMP: 142 (ТЯЖЁЛЫЙ ДЕНЬ)
⚖️ Баланс 80/20: 55% low / 45% high → слишком много интенсивности
🔥 Калории тренировок: 620 ккал
👣 Шаги: 12,340

🗓 ИСТОРИЯ ДНЯ:
💤 00:00-06:45 — Сон (6ч 45м, глубокий 22%)
😌 06:45-07:15 — Отдых (просыпание)
🍽 07:15-07:45 — Приём пищи
💻 07:45-12:00 — Работа за компьютером
🍽 12:00-12:30 — Обед
💻 12:30-17:00 — Работа (deep work 2.5ч!)
🏃‍♂️ 17:15-17:25 — Разминка
🏃‍♀️ 17:25-NOW — Темповой бег (34 мин)

💡 РЕКОМЕНДАЦИЯ:
😴 Ночной сон был короче нормы (6.75ч vs цель 8ч).
Ограничьте тренировку до 45 мин для оптимального восстановления.
```

---

## ЧАСТЬ 4: WVI SCORE — РАСЧЁТ

### 4.1 Адаптивные веса (меняются от контекста)

```objc
- (double)calculateWVIWithMetrics:(WVINormalizedMetrics)n
                      timeOfDay:(int)hour
                    isExercising:(BOOL)exercising {

    // Базовые веса (10 метрик, сумма = 1.0)
    double wHRV = 0.18, wStress = 0.15, wSleep = 0.13, wEmotion = 0.12;
    double wSpO2 = 0.09, wHR = 0.09, wActivity = 0.08, wBP = 0.06, wTemp = 0.05, wPPI = 0.05;

    // Адаптация по времени суток
    if (hour >= 22 || hour < 6) {
        // Ночь: сон и температура важнее, активность неважна
        wSleep = 0.25; wTemp = 0.08; wActivity = 0.03;
        wHRV = 0.20; wStress = 0.16;
    } else if (hour >= 6 && hour < 10) {
        // Утро: HRV и восстановление после сна критичны
        wHRV = 0.28; wSleep = 0.18; wStress = 0.15;
        wActivity = 0.05;
    } else if (hour >= 10 && hour < 18) {
        // Рабочий день: стресс и концентрация
        wStress = 0.22; wHRV = 0.20; wActivity = 0.12;
    }

    // Адаптация при тренировке
    if (exercising) {
        wHR = 0.05;        // высокий HR — норма
        wActivity = 0.15;  // активность = цель
        wSpO2 = 0.15;      // кислород критичен
    }

    // Нормализация весов (сумма = 1.0)
    double totalW = wHRV + wStress + wSleep + wSpO2 + wHR + wActivity + wBP + wTemp + wPPI;

    // 10я метрика: Emotional Wellbeing (из истории эмоций за 24ч)
    double emotionScore = [self emotionalWellbeingScore:emotionHistory24h];

    double wvi = (n.hrvScore * wHRV + n.stressScore * wStress + n.sleepScore * wSleep +
                  emotionScore * wEmotion + n.spo2Score * wSpO2 + n.heartRateScore * wHR +
                  n.activityScore * wActivity + n.bpScore * wBP +
                  n.temperatureScore * wTemp + n.ppiCoherenceScore * wPPI)
                 / totalW;

    // Emotion Feedback Loop: текущая эмоция корректирует итоговый WVI
    wvi = [self applyEmotionFeedback:wvi emotion:currentEmotion confidence:emotionConfidence];

    return MAX(0, MIN(100, wvi));
}
```

### 4.2 Emotion → WVI Feedback Loop (двусторонняя связь)

```objc
// Эмоция КОРРЕКТИРУЕТ итоговый WVI
// Позитивные эмоции = бонус, негативные = штраф
- (double)applyEmotionFeedback:(double)rawWVI emotion:(WVIEmotionState)emotion confidence:(double)conf {

    // Emotion Multiplier: насколько эмоция влияет на общее благополучие
    double emotionMultiplier;
    switch (emotion) {
        // Позитивные — бонус до +12%
        case WVIEmotionFlow:       emotionMultiplier = 1.12; break; // Flow = пиковая производительность
        case WVIEmotionMeditative: emotionMultiplier = 1.10; break; // Медитация = глубокое восстановление
        case WVIEmotionJoyful:     emotionMultiplier = 1.08; break;
        case WVIEmotionExcited:    emotionMultiplier = 1.06; break;
        case WVIEmotionEnergized:  emotionMultiplier = 1.05; break;
        case WVIEmotionRelaxed:    emotionMultiplier = 1.04; break;
        case WVIEmotionCalm:       emotionMultiplier = 1.02; break;

        // Нейтральные — минимальное влияние
        case WVIEmotionFocused:    emotionMultiplier = 1.03; break;
        case WVIEmotionRecovering: emotionMultiplier = 1.00; break;
        case WVIEmotionDrowsy:     emotionMultiplier = 0.97; break;

        // Негативные — штраф до -15%
        case WVIEmotionStressed:   emotionMultiplier = 0.95; break;
        case WVIEmotionFrustrated: emotionMultiplier = 0.93; break;
        case WVIEmotionSad:        emotionMultiplier = 0.91; break;
        case WVIEmotionAnxious:    emotionMultiplier = 0.88; break;
        case WVIEmotionAngry:      emotionMultiplier = 0.87; break;
        case WVIEmotionPain:       emotionMultiplier = 0.86; break;
        case WVIEmotionFearful:    emotionMultiplier = 0.85; break;
        case WVIEmotionExhausted:  emotionMultiplier = 0.85; break;
    }

    // Сила влияния зависит от confidence: чем увереннее — тем сильнее коррекция
    double adjustedMultiplier = 1.0 + (emotionMultiplier - 1.0) * conf;

    // Длительность эмоции усиливает эффект: >1ч негативной = усиление штрафа
    double duration = [self currentEmotionDurationMinutes];
    if (emotionMultiplier < 1.0 && duration > 60) {
        // Хронический негатив: штраф усиливается на 20%
        adjustedMultiplier = 1.0 + (adjustedMultiplier - 1.0) * 1.2;
    }
    if (emotionMultiplier > 1.0 && duration > 30) {
        // Устойчивый позитив: бонус усиливается на 15%
        adjustedMultiplier = 1.0 + (adjustedMultiplier - 1.0) * 1.15;
    }

    double finalWVI = rawWVI * adjustedMultiplier;
    return MAX(0, MIN(100, finalWVI));
}
```

### 4.3 Emotional Wellbeing Sub-Score (10я метрика WVI)

```objc
// Добавляем 10-ю метрику: Emotional Wellbeing Score
// Вычисляется из эмоциональной истории за последние 24ч
- (double)emotionalWellbeingScore:(NSArray<WVIEmotionResult *> *)emotionHistory24h {
    if (emotionHistory24h.count == 0) return 50; // нет данных = нейтрально

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

        // Более свежие замеры весят больше (exponential decay)
        double hoursAgo = -[er.timestamp timeIntervalSinceNow] / 3600.0;
        double recencyWeight = exp(-hoursAgo * 0.15); // полураспад ~4.6ч

        totalWeighted += emotionValue * er.confidence * recencyWeight;
        totalWeight += er.confidence * recencyWeight;
    }

    return (totalWeight > 0) ? totalWeighted / totalWeight : 50;
}
```

### 4.4 WVI Шкала

```
95-100: 🟣 ПРЕВОСХОДНО — пиковая форма, все системы оптимальны
85-94:  🟢 ОТЛИЧНО — высокий уровень благополучия
70-84:  🔵 ХОРОШО — стабильное состояние с небольшими зонами роста
55-69:  🟡 УМЕРЕННО — есть заметные отклонения, стоит обратить внимание
40-54:  🟠 ТРЕБУЕТ ВНИМАНИЯ — несколько метрик в красной зоне
25-39:  🔴 КРИТИЧНО — необходимы немедленные действия
0-24:   ⚫ ОПАСНО — множественные критические отклонения
```

---

## ЧАСТЬ 5: AI ИНТЕРПРЕТАЦИЯ (Claude API)

### 5.1 AI Prompt для анализа данных

Каждые 30 мин (или при смене эмоции) отправляем в Claude Sonnet через API:

```
Ты — WVI AI аналитик (Genius Layer: Doctor + Psychologist + Neuroscientist).

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
- WVI: {score}/100 ({level})
- Эмоция: {emotion} (confidence: {conf})
- Вторичная: {secondary} ({secConf})
- HR: {hr} BPM (resting: {restHR}), delta: {deltaHR}
- HRV: {hrv} ms (тренд: {trend}), возрастная норма: {ageMax}
- Stress: {stress}/100
- SpO2: {spo2}%
- Температура: {temp}°C (базовая: {baseTemp})
- BP: {sys}/{dia} mmHg
- Сон: {sleepScore}/100 (глубокий {deep}%, {totalH}ч)
- Активность: {actScore}/100 ({steps} шагов, {activeMins} мин)
- PPI когерентность: {coherence}

ИСТОРИЯ (последние 6ч):
{wviHistory}

ЗАДАЧА:
1. Интерпретируй текущее состояние (2-3 предложения)
2. Объясни ПОЧЕМУ именно эта эмоция определена
3. Дай 3 конкретных действия прямо сейчас
4. Спрогнозируй WVI через 3ч при текущем тренде
5. Если есть аномалии — укажи что именно не так
```

### 5.2 Telegram формат ответа

```
🔵 WVI ОТЧЁТ • {time}
═══════════════════════════════════

💎 WVI: 78/100 — ХОРОШО
😊 Эмоция: Радость (85%)
🔄 Вторичная: Энергичность (62%)

📊 Метрики:
❤️ Пульс: 72 BPM (норма 64)
🧠 HRV: 58 ms ↑ (отлично для 32 лет)
😰 Стресс: 22/100 — низкий
🫁 SpO2: 98%
🌡 Температура: 36.5°C
💉 Давление: 118/76
😴 Сон: 82/100 (7.2ч, 22% глубокий)
🏃 Активность: 65/100 (7,240 шагов)
💓 PPI когерентность: 0.62

🤖 AI Аналитика:
{claude_interpretation}

⚡ Рекомендации:
1. {action_1}
2. {action_2}
3. {action_3}

📈 Прогноз WVI через 3ч: ~{predicted}
```

---

## ЧАСТЬ 6: TREND ANALYZER

```objc
@interface WVITrendAnalyzer : NSObject

// Тренды за разные периоды
- (WVITrendReport *)analyze24hTrend:(NSArray<WVIResult *> *)history;
- (WVITrendReport *)analyze7dTrend:(NSArray<WVIResult *> *)history;
- (WVITrendReport *)analyze30dTrend:(NSArray<WVIResult *> *)history;

// Циркадный паттерн: когда WVI пик / дно
- (WVICircadianPattern *)detectCircadianPattern:(NSArray<WVIResult *> *)history30d;

// Аномалии
- (NSArray<WVIAnomaly *> *)detectAnomalies:(WVIResult *)current
                                   history:(NSArray<WVIResult *> *)history;

// Предсказание
- (double)predictWVIIn:(NSTimeInterval)seconds
           fromHistory:(NSArray<WVIResult *> *)history;

@end

// Предсказание: экспоненциальное сглаживание + тренд
- (double)predictWVIIn:(NSTimeInterval)seconds
           fromHistory:(NSArray<WVIResult *> *)history {
    if (history.count < 3) return history.lastObject.wviScore;

    // Двойное экспоненциальное сглаживание (Holt)
    double alpha = 0.3; // level smoothing
    double beta = 0.1;  // trend smoothing

    double level = history[0].wviScore;
    double trend = 0;

    for (int i = 1; i < history.count; i++) {
        double prevLevel = level;
        level = alpha * history[i].wviScore + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    double periodsAhead = seconds / 1800.0; // 30мин = 1 период
    double predicted = level + trend * periodsAhead;
    return MAX(0, MIN(100, predicted));
}
```

---

## ЧАСТЬ 7: ALERT SYSTEM

```objc
// Критические алерты → немедленно в Telegram
typedef NS_ENUM(NSInteger, WVIAlertLevel) {
    WVIAlertInfo     = 0,  // информационный
    WVIAlertWarning  = 1,  // предупреждение
    WVIAlertCritical = 2,  // критический
    WVIAlertEmergency = 3  // экстренный
};

// Правила алертов:
// WVI < 25                    → EMERGENCY: "⚫ WVI критически низкий!"
// WVI < 40                    → CRITICAL: "🔴 WVI требует внимания"
// SpO2 < 92                   → EMERGENCY: "🫁 SpO2 опасно низкий!"
// HR > restingHR + 50 (покой) → CRITICAL: "❤️ Аномальная тахикардия"
// HR < 45                     → CRITICAL: "❤️ Брадикардия"
// Temp > 38.0                 → WARNING: "🌡 Повышенная температура"
// Stress > 85 (>30 мин)       → WARNING: "😰 Продолжительный стресс"
// WVI drop > 25 за 1ч         → CRITICAL: "📉 Резкое падение WVI"
// Emotion = Anxious (>1ч)     → WARNING: "😱 Длительная тревожность"
```

---

## ЧАСТЬ 8: НАСТРОЙКА АВТОЗАМЕРОВ

```objc
// При первом подключении устройства — оптимальная конфигурация для WVI
- (void)setupAutoMonitoringForWVI {
    MyWeeks_V8 allDays = {YES, YES, YES, YES, YES, YES, YES};

    // HR каждые 5 мин (для точного тренд-анализа)
    MyAutomaticMonitoring_V8 hr = {
        .mode = 2, .dataType = 1, .intervalTime = 5,
        .startTime_Hour = 0, .endTime_Hour = 23,
        .startTime_Minutes = 0, .endTime_Minutes = 59,
        .weeks = allDays
    };

    // HRV каждые 15 мин (ключевая метрика WVI)
    MyAutomaticMonitoring_V8 hrv = {
        .mode = 2, .dataType = 4, .intervalTime = 15,
        .startTime_Hour = 0, .endTime_Hour = 23,
        .weeks = allDays
    };

    // SpO2 каждые 30 мин
    MyAutomaticMonitoring_V8 spo2 = {
        .mode = 2, .dataType = 2, .intervalTime = 30,
        .startTime_Hour = 0, .endTime_Hour = 23,
        .weeks = allDays
    };

    // Temperature каждые 30 мин
    MyAutomaticMonitoring_V8 temp = {
        .mode = 2, .dataType = 3, .intervalTime = 30,
        .startTime_Hour = 0, .endTime_Hour = 23,
        .weeks = allDays
    };

    // Отправляем все конфигурации на устройство
    [self sendConfig:hr]; [self sendConfig:hrv];
    [self sendConfig:spo2]; [self sendConfig:temp];
}
```

---

---

## ЧАСТЬ 10: ПРОДУКТОВЫЕ ПАЙПЛАЙНЫ WVI

### 10.1 Main Pipeline (Data → WVI → Output)

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 1: REALTIME WVI (каждые 5 мин)                ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [1] BLE SYNC ─────────────────────────────────────────  ║
║      │ GetContinuousHRDataWithMode:0                     ║
║      │ GetHRVDataWithMode:0                              ║
║      │ GetAutomaticSpo2DataWithMode:0                    ║
║      │ GetTemperatureDataWithMode:0                      ║
║      │ GetPPIDataWithMode:0                              ║
║      │ (parallel: все запросы одновременно)               ║
║      ▼                                                   ║
║  [2] NORMALIZE ────────────────────────────────────────  ║
║      │ 10 метрик → 0-100                                 ║
║      │ restingHR, baseTemp, RMSSD, coherence, trends     ║
║      ▼                                                   ║
║  [3] DETECT (parallel) ───────────────────────────────── ║
║      │ ┌─ EmotionEngine: 18 эмоций (fuzzy cascade)      ║
║      │ ├─ ActivityDetector: 23 типа + TRIMP + HR zones   ║
║      │ └─ AnomalyDetector: выбросы, нарушения паттернов  ║
║      ▼                                                   ║
║  [4] SCORE ────────────────────────────────────────────  ║
║      │ WVI = weighted(10 metrics) * emotionFeedback      ║
║      │ + activityContext adjustment                       ║
║      ▼                                                   ║
║  [5] AI INTERPRET ─────────────────────────────────────  ║
║      │ Claude Sonnet → причина + рекомендации            ║
║      │ 8 perspectives (Genius Layer)                     ║
║      ▼                                                   ║
║  [6] OUTPUT ───────────────────────────────────────────  ║
║      ├─ Push Notification (если алерт)                   ║
║      ├─ Local Storage (история)                          ║
║      └─ UI Update (дашборд)                              ║
╚══════════════════════════════════════════════════════════╝
```

### 10.2 Report Pipeline (ежедневный/еженедельный)

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 2: WVI REPORT                                  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [1] AGGREGATE ────────────────────────────────────────  ║
║      │ Собрать все WVI results за период (24ч/7д/30д)    ║
║      │ Средние, мин, макс, тренды каждой метрики         ║
║      │ Emotion heatmap (час × день)                      ║
║      │ Activity breakdown (TRIMP, зоны, типы)            ║
║      ▼                                                   ║
║  [2] ANALYZE ──────────────────────────────────────────  ║
║      │ ┌─ Trend Analysis (Holt exponential smoothing)    ║
║      │ ├─ Circadian Pattern (когда пик/дно WVI)          ║
║      │ ├─ Correlation Matrix (какие метрики связаны)     ║
║      │ ├─ Anomaly Report (что было необычного)           ║
║      │ └─ Prediction (прогноз на следующий период)       ║
║      ▼                                                   ║
║  [3] AI DEEP ANALYSIS ────────────────────────────────── ║
║      │ Claude Opus (расширенный контекст):               ║
║      │ ├─ Root cause analysis: почему WVI менялся        ║
║      │ ├─ Pattern recognition: скрытые закономерности    ║
║      │ ├─ Personalized insights: что уникально для ТЕБЯ  ║
║      │ └─ Action plan: 5 конкретных шагов на неделю      ║
║      ▼                                                   ║
║  [4] GENERATE ─────────────────────────────────────────  ║
║      ├─ PDF Report (8-12 страниц, premium design)        ║
║      │   • Executive Summary + WVI Score Card             ║
║      │   • Emotion Heatmap + Activity Timeline            ║
║      │   • Metric Trends (charts)                         ║
║      │   • AI Insights + Recommendations                  ║
║      ├─ HTML Dashboard (интерактивный)                    ║
║      │   • Live gauges, charts, sparklines                ║
║      │   • Emotion wheel, activity map                    ║
║      └─ Summary (для push/notification)                   ║
╚══════════════════════════════════════════════════════════╝
```

### 10.3 Calibration Pipeline (раз в 14 дней)

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 3: SELF-CALIBRATION                            ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [1] Пересчитать restingHR (среднее HR 01:00-05:00)     ║
║  [2] Пересчитать baseTemp (медиана за 14д)               ║
║  [3] Пересчитать ageBasedMaxHRV                          ║
║  [4] Пересчитать maxHR (Tanaka: 208 - 0.7*age)          ║
║  [5] Обновить emotion thresholds на основе персональных  ║
║      данных (если HRV пользователя стабильно > нормы →   ║
║      сдвинуть midpoints вверх)                           ║
║  [6] Обновить correlation weights: если у ЭТОГО          ║
║      пользователя sleep↔stress корреляция 0.9 →          ║
║      увеличить wSleep                                    ║
║  [7] Валидация: сравнить WVI с self-reported mood        ║
║      (если пользователь отмечает) → fine-tune emotion    ║
║      weights                                             ║
╚══════════════════════════════════════════════════════════╝
```

### 10.4 Training Advisor Pipeline

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 4: TRAINING ADVISOR                            ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  INPUT: текущий WVI + вчерашний TRIMP + sleep + emotion  ║
║                                                          ║
║  RULES:                                                  ║
║  ├─ WVI > 80 + sleepScore > 70 + TRIMP вчера < 100      ║
║  │   → "✅ Готов к интенсивной тренировке (Zone 3-4)"    ║
║  ├─ WVI 60-80 + нормальный сон                           ║
║  │   → "🟡 Умеренная нагрузка (Zone 2-3)"               ║
║  ├─ WVI < 60 OR sleepScore < 50 OR TRIMP вчера > 200    ║
║  │   → "🔴 Только лёгкая активность или отдых (Zone 1)" ║
║  ├─ Emotion = Exhausted/Sad/Pain                         ║
║  │   → "⛔ Активный отдых: прогулка 20 мин или йога"     ║
║  └─ Emotion = Energized/Joyful + WVI > 85                ║
║      → "🚀 Пиковая форма! Идеальный день для рекордов"  ║
║                                                          ║
║  OUTPUT:                                                 ║
║  ├─ Рекомендуемый тип тренировки                         ║
║  ├─ Целевая пульсовая зона                               ║
║  ├─ Рекомендуемая длительность                           ║
║  └─ Предупреждения (перетренировка, недосып)             ║
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
║      Основано на волатильности WVI за последние 30д       ║
║                                                          ║
║  [2] Drawdown Monitor:                                   ║
║      Если WVI упал > 15% за 3 дня → ALERT                ║
║      Если WVI < personal_minimum → CRITICAL              ║
║                                                          ║
║  [3] Correlation Matrix:                                 ║
║      Какие метрики у ЭТОГО пользователя сильно связаны?  ║
║      Пример: sleep↔stress = 0.85, activity↔mood = 0.72  ║
║      → Рекомендация: "Улучши сон — стресс упадёт сам"   ║
║                                                          ║
║  [4] Anomaly Detection:                                  ║
║      Z-score каждой метрики vs personal history           ║
║      |Z| > 2.5 → аномалия → AI разбирает причину        ║
║                                                          ║
║  [5] Chronic Risk Flags:                                 ║
║      stress > 60 (>7 дней) → "Хронический стресс"       ║
║      sleepScore < 50 (>5 дней) → "Хронический недосып"   ║
║      WVI тренд ↓ (>14 дней) → "Системное ухудшение"     ║
║      SpO2 < 95 (>3 замера) → "Проверить у врача"        ║
╚══════════════════════════════════════════════════════════╝
```

### 10.6 Systems Dynamics Pipeline (что-если анализ)

```
╔══════════════════════════════════════════════════════════╗
║  PIPELINE 6: FEEDBACK LOOPS & SIMULATION                 ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  3 основных feedback loops в здоровье:                   ║
║                                                          ║
║  LOOP 1 (Позитивная спираль):                            ║
║  Exercise↑ → Sleep↑ → Stress↓ → HRV↑ → Energy↑          ║
║  → More Exercise → ... (усиливающая петля)               ║
║                                                          ║
║  LOOP 2 (Негативная спираль):                            ║
║  Poor Sleep → Stress↑ → Inflammation(temp↑) → Pain       ║
║  → Less Activity → Worse Sleep → ... (подавляющая петля) ║
║                                                          ║
║  LOOP 3 (Ментальная):                                    ║
║  Meditation → HRV↑ → Emotional Balance → Focus↑          ║
║  → Productivity → Joy → Motivation → More Meditation     ║
║                                                          ║
║  SIMULATION (Claude + формулы):                          ║
║  "Если добавить 30 мин ходьбы ежедневно" →               ║
║     Day 1-3: activityScore +15, slight HR↑                ║
║     Day 4-7: sleepScore +8, stress -5                     ║
║     Day 7-14: HRV +3ms, WVI +6 points                    ║
║     Day 14-30: new baseline, emotion shift → Energized   ║
║                                                          ║
║  OUTPUT: "Через 14 дней WVI вырастет на ~6 пунктов,      ║
║  основная эмоция сместится с Stressed на Focused/Calm"   ║
╚══════════════════════════════════════════════════════════╝
```

### 10.7 Полная карта продукта (features)

```
WVI Product Features:
├── CORE ENGINE
│   ├── 10 метрик → WVI Score (0-100)
│   ├── 18 эмоций (Fuzzy Logic + AI)
│   ├── 64 типа активности (авто-детекция)
│   ├── 7 уровней нагрузки + TRIMP
│   ├── 5 пульсовых зон
│   └── Emotion ↔ WVI feedback loop
│
├── AI LAYER
│   ├── 8 AI perspectives (Genius Layer)
│   ├── Персонализированные рекомендации
│   ├── Прогнозирование (Holt smoothing)
│   ├── Root cause analysis
│   └── What-if simulation
│
├── REPORTS
│   ├── PDF (premium, 8-12 страниц)
│   ├── HTML Dashboard (интерактивный)
│   ├── Daily/Weekly summary
│   └── Doctor/Coach export
│
├── ALERTS
│   ├── 4 уровня (Info → Emergency)
│   ├── 9 правил триггеров
│   ├── Push notifications
│   └── Chronic risk flags
│
├── TRAINING ADVISOR
│   ├── Рекомендации по тренировкам
│   ├── Целевые пульсовые зоны
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
│   ├── Авто-калибровка каждые 14д
│   ├── Персональные нормы
│   ├── Adaptive emotion thresholds
│   └── User feedback learning
│
└── DATA LAYER
    ├── V8 BLE SDK (17 эндпоинтов)
    ├── Auto-monitoring setup
    ├── Pagination + sync
    ├── Local storage (privacy-first)
    └── Export (CSV/JSON/PDF)
```

---

## ЧАСТЬ 11: SWAGGER API — Полная REST архитектура WVI

### 11.0 Архитектура сервера

```
WVI API Server (Node.js / Express или FastAPI)
├── Port: 8080
├── Base URL: /api/v1
├── Auth: Bearer JWT
├── Docs: /api/v1/docs (Swagger UI)
├── Format: JSON
└── Versioning: URL-based (/v1, /v2)

Компоненты:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Mobile App  │────▶│   WVI API    │────▶│  PostgreSQL  │
│  (iOS + BLE)  │     │  (REST)      │     │  (TimescaleDB│
└──────────────┘     │              │     │   для time-  │
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
    Мега-API для сбора биометрических данных, расчёта WVI,
    определения 18 эмоций, 64 типов активности,
    AI-аналитики и генерации отчётов.
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
    description: Регистрация, авторизация, токены
  - name: Users
    description: Профиль пользователя, настройки, персональные нормы
  - name: Biometrics
    description: Сырые биометрические данные с устройства (HR, HRV, SpO2, Temp, Sleep, PPI, ECG, BP, Activity)
  - name: WVI
    description: Wellness Vitality Index — расчёт, история, тренды
  - name: Emotions
    description: 18 эмоциональных состояний — текущее, история, аналитика
  - name: Activities
    description: 64 типа активности — текущая, история, нагрузка, TRIMP
  - name: AI
    description: AI-интерпретация, рекомендации, прогнозы, Genius Layer
  - name: Reports
    description: PDF, HTML, презентации — генерация и скачивание
  - name: Alerts
    description: Критические алерты, настройки уведомлений
  - name: Device
    description: Управление устройством V8 BLE, синхронизация, автозамеры
  - name: Training
    description: Тренировочные рекомендации, пульсовые зоны, восстановление
  - name: Risk
    description: Health VaR, аномалии, хронические риски, корреляции
```

### 11.2 AUTH — Авторизация

```yaml
paths:

  /auth/register:
    post:
      tags: [Auth]
      summary: Регистрация нового пользователя
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
          description: Пользователь создан
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'

  /auth/login:
    post:
      tags: [Auth]
      summary: Вход в систему
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
          description: JWT токен
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'

  /auth/refresh:
    post:
      tags: [Auth]
      summary: Обновить JWT токен
      security:
        - bearerAuth: []
      responses:
        200:
          description: Новый токен
```

### 11.3 USERS — Профиль и настройки

```yaml
  /users/me:
    get:
      tags: [Users]
      summary: Получить профиль текущего пользователя
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
      summary: Обновить профиль (персональные данные для калибровки)
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
                  description: "Пол — влияет на нормы HRV, HR, TRIMP"
                age:
                  type: integer
                  minimum: 5
                  maximum: 100
                  description: "Возраст — влияет на maxHR, ageBasedMaxHRV"
                height:
                  type: integer
                  description: "Рост в см — для расчёта шага и калорий"
                weight:
                  type: number
                  description: "Вес в кг — для METS и калорий"
                stepGoal:
                  type: integer
                  default: 10000
                  description: "Цель шагов в день"
                sleepGoalHours:
                  type: number
                  default: 8.0
                  description: "Цель сна в часах"
      responses:
        200:
          description: Профиль обновлён

  /users/me/norms:
    get:
      tags: [Users]
      summary: Персональные нормы (авто-калиброванные)
      description: |
        Рассчитанные нормы на основе истории данных:
        - restingHR: среднее HR за 01:00-05:00 (последние 7 дней)
        - baseTemp: медиана температуры за 14 дней
        - maxHR: 208 - 0.7 * age (Tanaka)
        - ageBasedMaxHRV: норма HRV для возраста
        - personalCorrelations: какие метрики связаны у этого пользователя
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
      summary: Запустить пересчёт персональных норм (калибровка)
      description: "Обычно автоматически каждые 14 дней. Можно вызвать вручную."
      security:
        - bearerAuth: []
      responses:
        202:
          description: Калибровка запущена
```

### 11.4 BIOMETRICS — Сырые данные с устройства

```yaml
  /biometrics/sync:
    post:
      tags: [Biometrics]
      summary: Массовая загрузка биометрических данных с устройства
      description: |
        Принимает все типы данных с V8 BLE SDK одним запросом.
        Вызывается после BLE синхронизации.
        Данные сохраняются в TimescaleDB для time-series анализа.
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
          description: Данные приняты, WVI пересчитан
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
      summary: История пульса (HR)
      description: |
        Непрерывный пульс (DynamicHR_V8) и точечные замеры (StaticHR_V8).
        SDK эндпоинт: GetContinuousHRDataWithMode / GetSingleHRDataWithMode.
        Ключи: arrayContinuousHR → {date, arrayHR}, arraySingleHR → {date, singleHR}
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
      summary: Загрузить данные HR с устройства
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
                  description: "arrayContinuousHR из SDK"
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
                        description: "arrayHR — массив BPM значений"
                single:
                  type: array
                  description: "arraySingleHR из SDK"
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
          description: HR данные сохранены

  /biometrics/hrv:
    get:
      tags: [Biometrics]
      summary: История HRV + Stress + BP
      description: |
        Самый богатый эндпоинт: HRV, стресс, пульс при замере, давление.
        SDK эндпоинт: GetHRVDataWithMode.
        Ключи: arrayHrvData → {date, hrv, stress, heartRate, systolicBP, diastolicBP}
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
                        description: "Средний HRV за период (ms)"
                      avgStress:
                        type: number
                        description: "Средний стресс (0-100)"
                      avgBP:
                        type: string
                        example: "122/78"

    post:
      tags: [Biometrics]
      summary: Загрузить HRV данные с устройства
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
                        description: "HRV в ms"
                      stress:
                        type: integer
                        minimum: 0
                        maximum: 100
                        description: "Уровень стресса"
                      heartRate:
                        type: integer
                        description: "HR при замере HRV"
                      systolicBP:
                        type: integer
                        description: "Систолическое давление"
                      diastolicBP:
                        type: integer
                        description: "Диастолическое давление"
      responses:
        201:
          description: HRV данные сохранены

  /biometrics/spo2:
    get:
      tags: [Biometrics]
      summary: История SpO2 (кислород в крови)
      description: |
        Автоматические и ручные замеры SpO2.
        SDK: GetAutomaticSpo2DataWithMode / GetManualSpo2DataWithMode.
        Ключи: arrayAutomaticSpo2Data → {date, automaticSpo2Data}
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
      summary: Загрузить SpO2 данные
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
                        description: "SpO2 в %"
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
          description: SpO2 данные сохранены

  /biometrics/temperature:
    get:
      tags: [Biometrics]
      summary: История температуры тела
      description: |
        SDK: GetTemperatureDataWithMode.
        Ключи: arrayemperatureData → {date, temperature}
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
      summary: Загрузить данные температуры
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
                        description: "Температура в °C"
                        example: 36.6
      responses:
        201:
          description: Данные температуры сохранены

  /biometrics/sleep:
    get:
      tags: [Biometrics]
      summary: История сна (фазы, длительность, качество)
      description: |
        SDK: GetDetailSleepDataWithMode / getSleepDetailsAndActivityWithMode.
        Ключи: arrayDetailSleepData → {startTime_SleepData, totalSleepTime,
        arraySleepQuality, sleepUnitLength}
        arraySleepQuality: массив фаз (0=awake, 1=light, 2=deep)
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
      summary: Загрузить данные сна
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
                        description: "Общее время сна в минутах"
                      phases:
                        type: array
                        items:
                          type: integer
                          enum: [0, 1, 2]
                          description: "0=awake, 1=light, 2=deep"
                      unitLengthMinutes:
                        type: integer
                        description: "Длительность каждого интервала в phases"
                      activityDuringNight:
                        type: array
                        items:
                          type: integer
                        description: "Активность ночью (из arrayActivityData)"
      responses:
        201:
          description: Данные сна сохранены

  /biometrics/ppi:
    get:
      tags: [Biometrics]
      summary: История PPI (Pulse-to-Pulse Interval)
      description: |
        Интервалы между пульсами в мс. Используется для расчёта
        RMSSD, когерентности, дополнительного HRV анализа.
        SDK: GetPPIDataWithMode.
        Ключи: arrayPPIData → {date, groupCount, currentIndex, arrayPPIData}
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
      summary: Загрузить PPI данные
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
                        description: "PPI интервалы в мс"
      responses:
        201:
          description: PPI данные сохранены

  /biometrics/ecg:
    get:
      tags: [Biometrics]
      summary: История ЭКГ (ECG raw data)
      description: |
        Сырые данные ЭКГ. SDK: ECG_RawData_V8.
        Ключи: {arrayEcgRawData, packetID}
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
      summary: Загрузить ECG сессию
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
          description: ECG сессия сохранена

  /biometrics/activity:
    get:
      tags: [Biometrics]
      summary: История физической активности (шаги, калории, METS)
      description: |
        SDK: GetTotalActivityDataWithMode / GetDetailActivityDataWithMode /
        GetActivityModeDataWithMode.
        Включает шаги, калории, дистанцию, тип активности, METS.
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
      summary: Загрузить данные активности
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
                  description: "Тренировочные сессии (SDK ActivityMode)"
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
          description: Данные активности сохранены
```

### 11.5 WVI — Wellness Vitality Index

```yaml
  /wvi/current:
    get:
      tags: [WVI]
      summary: Текущий WVI score + все подметрики
      description: |
        Возвращает последний рассчитанный WVI score (0-100),
        все 10 нормализованных метрик, текущую эмоцию,
        текущую активность и AI-интерпретацию.
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
      summary: История WVI за период
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
          description: "Гранулярность: 5мин (realtime), 30мин, 1ч, 1д"
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
      summary: Аналитика трендов WVI (24ч / 7д / 30д)
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
      summary: Прогноз WVI (Holt exponential smoothing)
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
      summary: What-if симуляция ("если делать X, что будет с WVI")
      description: |
        Systems Dynamics: моделирует feedback loops.
        Пример: "Добавить 30 мин ходьбы" → предсказание WVI через 7/14/30 дней.
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
                  description: "Действие для моделирования"
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

### 11.6 EMOTIONS — 18 эмоциональных состояний

```yaml
  /emotions/current:
    get:
      tags: [Emotions]
      summary: Текущая эмоция (primary + secondary)
      description: |
        Определённая Fuzzy Logic каскадом эмоция из 18 возможных.
        Включает confidence, описание, вторичную эмоцию.
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
      summary: История эмоций за период
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
                    description: "% времени в каждой эмоции"
                    additionalProperties:
                      type: number
                  heatmap:
                    type: array
                    description: "Час × день → доминирующая эмоция"
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
      summary: Emotional Wellbeing Score (10я метрика WVI)
      description: |
        Рассчитывается из истории эмоций за 24ч с exponential decay.
        Позитивные эмоции = высокий score, негативные = низкий.
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
                    description: "% времени в позитивных эмоциях"
                  longestNegativeStreak:
                    type: integer
                    description: "Самый длинный негативный период (мин)"
```

### 11.7 ACTIVITIES — 64 типа активности

```yaml
  /activities/current:
    get:
      tags: [Activities]
      summary: Текущая активность + полный разбор
      description: |
        Определённый тип из 64 возможных активностей.
        Включает нагрузку, пульсовую зону, калории, TRIMP, рекомендации.
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
      summary: История активностей (таймлайн дня)
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
      summary: Дневная нагрузка (TRIMP + пульсовые зоны)
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
      summary: Время в каждой пульсовой зоне
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
                    description: "Баланс 80/20 (0-100)"
```

### 11.8 AI — Интерпретация и рекомендации

```yaml
  /ai/interpret:
    post:
      tags: [AI]
      summary: AI интерпретация текущего состояния
      description: |
        Отправляет текущие данные в Claude (Genius Layer — 8 персон):
        Doctor, Psychologist, Neuroscientist, Biohacker, Coach,
        Nutritionist, Sleep Expert, Data Scientist.
        Возвращает интерпретацию + 3-5 рекомендаций + прогноз.
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
                  description: "Включить историю за 6ч"
                perspective:
                  type: string
                  enum: [all, doctor, psychologist, coach, biohacker]
                  default: all
                  description: "Какие AI-перспективы использовать"
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AIInterpretation'

  /ai/recommendations:
    get:
      tags: [AI]
      summary: AI рекомендации (на основе последних данных)
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
                    description: "Что сделать СЕЙЧАС"
                    items:
                      $ref: '#/components/schemas/Recommendation'
                  today:
                    type: array
                    description: "План на сегодня"
                    items:
                      $ref: '#/components/schemas/Recommendation'
                  weeklyGoals:
                    type: array
                    description: "Цели на неделю"
                    items:
                      $ref: '#/components/schemas/Recommendation'
```

### 11.9 REPORTS, ALERTS, DEVICE, TRAINING, RISK

```yaml
  # ═══ REPORTS ═══

  /reports/generate:
    post:
      tags: [Reports]
      summary: Сгенерировать отчёт (PDF / HTML / Slides)
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
          description: Отчёт генерируется
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
      summary: Скачать готовый отчёт
      parameters:
        - name: reportId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Файл отчёта
          content:
            application/pdf: {}
            text/html: {}

  # ═══ ALERTS ═══

  /alerts:
    get:
      tags: [Alerts]
      summary: Список активных алертов
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
      summary: Настройки алертов
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
      summary: Обновить настройки алертов
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
      summary: Статус подключённого устройства V8
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
      summary: Текущие настройки автозамеров
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
      summary: Установить настройки автозамеров
      description: |
        Оптимальные для WVI:
        - HR каждые 5 мин (dataType=1)
        - HRV каждые 15 мин (dataType=4)
        - SpO2 каждые 30 мин (dataType=2)
        - Temperature каждые 30 мин (dataType=3)
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
      summary: Тренировочная рекомендация на сегодня
      description: |
        На основе WVI + вчерашнего TRIMP + сна + эмоции:
        тип тренировки, зона, длительность, предупреждения.
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

### 11.10 SCHEMAS — Все модели данных

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
      description: "Начало периода (ISO 8601)"
    dateTo:
      name: to
      in: query
      schema:
        type: string
        format: date-time
      description: "Конец периода (ISO 8601)"
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
          description: "Средний HR покоя (01:00-05:00 за 7 дней)"
        baseTemp:
          type: number
          description: "Медиана температуры за 14 дней"
        maxHR:
          type: number
          description: "208 - 0.7 * age"
        ageBasedMaxHRV:
          type: number
          description: "Нормативный максимум HRV для возраста"
        lastCalibrated:
          type: string
          format: date-time
        correlations:
          type: object
          description: "Персональная корреляционная матрица"
          properties:
            sleep_stress:
              type: number
            activity_mood:
              type: number
            hrv_sleep:
              type: number

    BiometricSync:
      type: object
      description: "Массовая загрузка всех данных после BLE синхронизации"
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
          description: "Нормализованный 0-100"

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
          description: "PPI в мс"
        rmssd:
          type: number
          description: "Рассчитанный RMSSD"
        coherence:
          type: number
          description: "Когерентность 0-1"

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
          description: "URL для скачивания raw данных"

    WVISnapshot:
      type: object
      description: "Полный снапшот текущего состояния"
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
          description: "Один из 64 типов"
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
          description: "TRIMP за день"
        contextualAdvice:
          type: string
          description: "Рекомендация в контексте активности"

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
          description: "5-120 мин"
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
          description: "2-3 предложения о текущем состоянии"
        emotionExplanation:
          type: string
          description: "Почему определена именно эта эмоция"
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
          description: "Genius Layer — 8 перспектив"
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
          description: "Ожидаемое влияние на WVI"

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
          description: "Целевая пульсовая зона 1-5"
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

### 11.11 Полный реестр эндпоинтов (RU/EN описания)

```
#  | METHOD | PATH                          | RU ОПИСАНИЕ                                    | EN DESCRIPTION
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
 1 | POST   | /auth/register                | Регистрация нового пользователя                | Register a new user account
 2 | POST   | /auth/login                   | Вход в систему (email + пароль → JWT)          | Login with email & password, returns JWT
 3 | POST   | /auth/refresh                 | Обновить истёкший JWT токен                     | Refresh expired JWT token
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
 4 | GET    | /users/me                     | Получить профиль (пол, возраст, рост, вес)     | Get user profile (gender, age, height, weight)
 5 | PUT    | /users/me                     | Обновить профиль для калибровки                | Update profile for calibration
 6 | GET    | /users/me/norms               | Персональные нормы (restingHR, baseTemp, maxHR)| Get personal norms (auto-calibrated)
 7 | POST   | /users/me/norms/calibrate     | Запустить пересчёт персональных норм           | Trigger manual recalibration
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
 8 | POST   | /biometrics/sync              | Массовая загрузка всех данных после BLE-синхр. | Bulk upload all biometric data from BLE sync
 9 | GET    | /biometrics/heart-rate        | История пульса (непрерывный + точечный)        | Heart rate history (continuous + single)
10 | POST   | /biometrics/heart-rate        | Загрузить данные HR с устройства               | Upload HR data from device
11 | GET    | /biometrics/hrv               | История HRV + стресс + давление                | HRV history including stress and blood pressure
12 | POST   | /biometrics/hrv               | Загрузить HRV данные (hrv, stress, BP)         | Upload HRV records (hrv, stress, BP)
13 | GET    | /biometrics/spo2              | История SpO2 (кислород в крови)                | SpO2 (blood oxygen) history
14 | POST   | /biometrics/spo2              | Загрузить SpO2 данные (авто + ручные)          | Upload SpO2 readings (auto + manual)
15 | GET    | /biometrics/temperature       | История температуры тела (°C)                  | Body temperature history (°C)
16 | POST   | /biometrics/temperature       | Загрузить данные температуры                   | Upload temperature records
17 | GET    | /biometrics/sleep             | История сна (фазы, длительность, качество)     | Sleep history (phases, duration, quality score)
18 | POST   | /biometrics/sleep             | Загрузить данные сна (фазы, активность)        | Upload sleep data (phases, night activity)
19 | GET    | /biometrics/ppi               | История PPI (интервалы между пульсами, мс)     | PPI history (pulse-to-pulse intervals, ms)
20 | POST   | /biometrics/ppi               | Загрузить PPI данные                           | Upload PPI interval data
21 | GET    | /biometrics/ecg               | История ЭКГ (сессии, raw данные)               | ECG session history (raw waveform data)
22 | POST   | /biometrics/ecg               | Загрузить ECG сессию                           | Upload ECG recording session
23 | GET    | /biometrics/activity          | История активности (шаги, калории, METS)       | Activity history (steps, calories, METS, sessions)
24 | POST   | /biometrics/activity          | Загрузить данные активности                    | Upload activity data (daily + sessions)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
25 | GET    | /wvi/current                  | Текущий WVI score + все 10 подметрик           | Current WVI snapshot (score + all 10 sub-metrics)
26 | GET    | /wvi/history                  | История WVI за период (5мин/30мин/1ч/1д)       | WVI history with configurable granularity
27 | GET    | /wvi/trends                   | Аналитика трендов (24ч / 7д / 30д)             | Trend analysis for 24h / 7d / 30d periods
28 | GET    | /wvi/predict                  | Прогноз WVI (Holt smoothing, до 24ч)           | Predict future WVI using Holt exponential smoothing
29 | POST   | /wvi/simulate                 | What-if симуляция (feedback loops)              | What-if simulation via systems dynamics model
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
30 | GET    | /emotions/current             | Текущая эмоция (primary + secondary, 18 типов) | Current emotion (primary + secondary, 18 types)
31 | GET    | /emotions/history             | История эмоций + распределение + heatmap       | Emotion history with distribution and heatmap
32 | GET    | /emotions/wellbeing           | Emotional Wellbeing Score (10я метрика WVI)    | Emotional Wellbeing Score (10th WVI metric)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
33 | GET    | /activities/current           | Текущая активность (64 типа) + полный разбор   | Current activity (64 types) with full breakdown
34 | GET    | /activities/history           | Таймлайн активностей за день                   | Activity timeline for the day
35 | GET    | /activities/load              | Дневная нагрузка (TRIMP + пульсовые зоны)      | Daily load report (TRIMP + HR zones)
36 | GET    | /activities/zones             | Время в каждой пульсовой зоне + баланс 80/20   | Time in each HR zone + 80/20 balance score
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
37 | POST   | /ai/interpret                 | AI интерпретация (Genius Layer, 8 перспектив)  | AI interpretation (Genius Layer, 8 perspectives)
38 | GET    | /ai/recommendations           | AI рекомендации (немедленные + дневные)         | AI recommendations (immediate + daily + weekly)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
39 | POST   | /reports/generate             | Генерация отчёта (PDF / HTML / Slides)         | Generate report (PDF / HTML / Slides)
40 | GET    | /reports/{id}                 | Скачать готовый отчёт                          | Download generated report
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
41 | GET    | /alerts                       | Список активных алертов                        | List active alerts
42 | GET    | /alerts/settings              | Настройки алертов (пороги, правила)            | Get alert settings (thresholds, rules)
43 | PUT    | /alerts/settings              | Обновить настройки алертов                     | Update alert settings
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
44 | GET    | /device/status                | Статус устройства V8 (батарея, MAC, версия)    | Device V8 status (battery, MAC, firmware)
45 | GET    | /device/auto-monitoring       | Текущие настройки автозамеров                  | Current auto-monitoring configuration
46 | PUT    | /device/auto-monitoring       | Установить автозамеры (HR/HRV/SpO2/Temp)       | Set auto-monitoring (HR/HRV/SpO2/Temp intervals)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
47 | GET    | /training/recommendation      | Тренировочная рекомендация на сегодня          | Today's training recommendation based on readiness
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
48 | GET    | /risk/assessment              | Health Risk Assessment (VaR, аномалии, флаги)  | Health risk assessment (VaR, anomalies, chronic flags)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
49 | GET    | /wvi/circadian                | Циркадный паттерн WVI (по часам суток)         | Circadian WVI pattern (peak/low hours)
50 | GET    | /wvi/correlations             | Корреляционная матрица всех 10 метрик           | Correlation matrix of all 10 WVI sub-metrics
51 | GET    | /wvi/breakdown                | Детальная разбивка: вклад каждой метрики в WVI | WVI breakdown: contribution of each metric
52 | GET    | /wvi/compare                  | Сравнение WVI за два периода                   | Compare WVI between two time periods
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
53 | GET    | /emotions/distribution        | Распределение эмоций за период (% каждой)      | Emotion distribution for period (% per emotion)
54 | GET    | /emotions/heatmap             | Heatmap эмоций (час × день недели)              | Emotion heatmap (hour × day of week)
55 | GET    | /emotions/transitions         | Матрица переходов между эмоциями               | Emotion transition matrix (A→B frequency)
56 | GET    | /emotions/triggers            | Триггеры: что вызывает каждую эмоцию           | Emotion triggers (which metrics cause each)
57 | GET    | /emotions/streaks             | Рекорды: самая долгая позитивная/негативная     | Longest positive/negative emotion streaks
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
58 | GET    | /activities/categories        | Время в каждой категории за день                | Time in each activity category per day
59 | GET    | /activities/transitions       | Лог переходов между активностями               | Activity transition log (what → what)
60 | GET    | /activities/sedentary         | Анализ сидячего времени + перерывы              | Sedentary time analysis + break frequency
61 | GET    | /activities/exercise-log      | Лог всех тренировок за период                  | Exercise session log with details
62 | GET    | /activities/recovery-status   | Статус восстановления (готовность)              | Recovery status (readiness for next workout)
63 | POST   | /activities/manual-log        | Ручная запись активности                       | Manual activity log (override auto-detection)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
64 | GET    | /biometrics/blood-pressure    | История кровяного давления                     | Blood pressure history (from HRV data)
65 | GET    | /biometrics/stress            | История стресса (0-100)                        | Stress level history
66 | GET    | /biometrics/breathing-rate    | Частота дыхания (из PPI)                       | Breathing rate estimated from PPI
67 | GET    | /biometrics/rmssd             | RMSSD история (из PPI)                         | RMSSD history (computed from PPI)
68 | GET    | /biometrics/coherence         | PPI когерентность — история                    | PPI coherence history
69 | GET    | /biometrics/realtime          | Последние 5 мин всех показателей               | Last 5 minutes of all readings
70 | GET    | /biometrics/summary           | Сводка за день (все метрики мин/макс/сред)     | Daily summary (all metrics min/max/avg)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
71 | GET    | /sleep/last-night             | Полный анализ прошлой ночи                     | Last night full sleep analysis
72 | GET    | /sleep/score-history          | История sleep score за 30 дней                 | Sleep score history for 30 days
73 | GET    | /sleep/architecture           | Архитектура сна (% deep/light/REM/awake)       | Sleep architecture breakdown
74 | GET    | /sleep/consistency            | Регулярность сна (время засыпания/подъёма)     | Sleep consistency (bed/wake regularity)
75 | GET    | /sleep/debt                   | Дефицит сна (часы недосыпа за неделю)          | Sleep debt (hours below goal this week)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
76 | POST   | /ai/chat                      | AI чат (свободный вопрос + данные)             | Health AI chat (free-form question + data)
77 | POST   | /ai/explain-metric            | AI: почему эта метрика такая                   | AI explanation for specific metric value
78 | POST   | /ai/action-plan               | AI: план действий на неделю                    | AI-generated weekly action plan
79 | GET    | /ai/insights                  | AI: что необычного за последние 24ч            | AI insights: what was unusual in 24h
80 | GET    | /ai/genius-layer              | Все 8 перспектив текущего состояния             | All 8 Genius Layer perspectives
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
81 | GET    | /reports                      | Список всех отчётов                            | List all user reports
82 | DELETE | /reports/{id}                 | Удалить отчёт                                  | Delete a report
83 | GET    | /reports/templates            | Доступные шаблоны отчётов                      | Available report templates
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
84 | GET    | /alerts/history               | История всех алертов                           | Alert history (including acknowledged)
85 | PUT    | /alerts/{id}/acknowledge      | Подтвердить алерт                              | Acknowledge an alert
86 | GET    | /alerts/stats                 | Статистика алертов за период                   | Alert statistics for period
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
87 | POST   | /device/sync                  | Инициировать BLE синхронизацию                 | Trigger BLE device sync
88 | GET    | /device/capabilities          | Возможности устройства                         | Device capabilities (supported metrics)
89 | POST   | /device/measure               | Запустить ручной замер (HR/HRV/SpO2)           | Start manual measurement
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
90 | GET    | /training/weekly-plan         | Недельный план тренировок                      | Weekly training plan
91 | GET    | /training/overtraining-risk   | Риск перетренировки (TRIMP тренд)              | Overtraining risk (based on TRIMP trend)
92 | GET    | /training/optimal-time        | Оптимальное время тренировки (циркадный)       | Optimal training time (circadian-based)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
93 | GET    | /risk/anomalies               | Текущие аномалии (Z-score > 2.5)               | Current anomalies (Z-score > 2.5)
94 | GET    | /risk/chronic-flags           | Хронические флаги (стресс>7д, недосып>5д)      | Chronic risk flags
95 | GET    | /risk/correlations            | Персональная корреляционная матрица             | Personal metric correlation matrix
96 | GET    | /risk/volatility              | Волатильность WVI (7д / 30д)                   | WVI volatility (7d / 30d)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
97 | GET    | /dashboard/widgets            | Все виджеты дашборда (1 запрос)                | All dashboard widget data (single request)
98 | GET    | /dashboard/daily-brief        | Утренний брифинг                               | Morning brief (WVI + sleep + day plan)
99 | GET    | /dashboard/evening-review     | Вечерний обзор                                 | Evening review (day summary + recommendations)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
100| GET    | /export/csv                   | Экспорт всех данных в CSV                      | Export all data as CSV
101| GET    | /export/json                  | Экспорт всех данных в JSON                     | Export all data as JSON
102| GET    | /export/health-summary        | Сводка для врача (PDF)                         | Health summary for doctor (PDF)
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
103| GET    | /settings                     | Все настройки пользователя                     | All user settings
104| PUT    | /settings                     | Обновить настройки                             | Update user settings
105| GET    | /settings/notifications       | Настройки уведомлений                          | Notification preferences
106| PUT    | /settings/notifications       | Обновить уведомления                           | Update notification preferences
───┼────────┼───────────────────────────────┼────────────────────────────────────────────────┼──────────────────────────────────────────────
107| GET    | /health/server-status         | Здоровье сервера (uptime, DB, Redis)           | Server health check
108| GET    | /health/api-version           | Версия API                                     | API version info
═══╧════════╧═══════════════════════════════╧════════════════════════════════════════════════╧══════════════════════════════════════════════
ИТОГО: 108 REST эндпоинтов / TOTAL: 108 REST endpoints

ГРУППИРОВКА / GROUPING:
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

### 11.12 Развёртывание Swagger сервера / Swagger Server Deployment

```
═══════════════════════════════════════════════════════════════
ПЛАН РАЗВЁРТЫВАНИЯ SWAGGER API СЕРВЕРА
SWAGGER API SERVER DEPLOYMENT PLAN
═══════════════════════════════════════════════════════════════

СТЕК / STACK:
├── Runtime: Node.js 20+ (LTS)
├── Framework: Express.js 4.x
├── Swagger UI: swagger-ui-express + swagger-jsdoc
├── Validation: Zod (schema validation)
├── Auth: jsonwebtoken + bcrypt
├── DB: PostgreSQL 16 + TimescaleDB (time-series)
├── ORM: Prisma
├── Cache: Redis 7+
├── Queue: BullMQ (для фоновых задач: reports, AI)
├── AI: @anthropic-ai/sdk (Claude API direct)
├── Reports: Puppeteer (PDF), EJS (HTML templates)
├── Storage: S3-compatible (MinIO для self-hosted)
└── Docs: Swagger UI на /api/v1/docs

СТРУКТУРА ФАЙЛОВ / FILE STRUCTURE:
wvi-api/
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma          — DB схема (User, Biometric, WVI, Emotion, Activity, Alert)
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
│   │   ├── wvi-calculator.ts  — WVI Score (10 метрик + адаптивные веса + emotion feedback)
│   │   ├── emotion-engine.ts  — Fuzzy Logic (18 эмоций, sigmoid, bellCurve, temporal smoothing)
│   │   ├── activity-detector.ts — Activity Detection (64 типа, каскад, enrichResult)
│   │   ├── metric-normalizer.ts — 10 метрик нормализации (0-100)
│   │   ├── trend-analyzer.ts  — Holt smoothing, circadian, anomaly detection
│   │   ├── ai-interpreter.ts  — Claude API → Genius Layer (8 perspectives)
│   │   ├── report-generator.ts — PDF (Puppeteer) + HTML (EJS) + Slides
│   │   ├── alert-engine.ts    — 4 уровня алертов, 9 правил, push notifications
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
│   └── openapi.yaml           — Полная OpenAPI 3.1 спецификация (RU/EN)
├── docker-compose.yml         — PostgreSQL + Redis + MinIO + API
├── Dockerfile
└── .env.example

КОМАНДЫ ЗАПУСКА / STARTUP COMMANDS:

# 1. Установка / Install
npm install

# 2. Настройка БД / Setup DB
npx prisma generate
npx prisma db push

# 3. Запуск в dev режиме / Start dev
npm run dev
# → http://localhost:8080/api/v1/docs (Swagger UI)

# 4. Docker (production)
docker-compose up -d
# → PostgreSQL :5432, Redis :6379, MinIO :9000, API :8080

SWAGGER UI КОНФИГУРАЦИЯ / SWAGGER UI CONFIG:

// src/config/swagger.ts
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load('./swagger/openapi.yaml');

// Русский + English описания в каждом endpoint
// через x-description-ru / description поля

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

// JSON spec для клиентов
app.get('/api/v1/docs.json', (req, res) => res.json(swaggerDocument));

PRISMA SCHEMA / БД МОДЕЛЬ:

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
  restingHR     Float?   // авто-калибровка
  baseTemp      Float?   // авто-калибровка
  maxHR         Float?   // 208 - 0.7*age
  ageMaxHRV     Float?   // норма HRV
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
  data      Json     // гибкая структура для всех типов
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
  // 10 подметрик
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
  // Raw данные на момент расчёта
  rawData         Json
  createdAt       DateTime @default(now())

  @@index([userId, timestamp])
}

model EmotionRecord {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  timestamp           DateTime
  primaryEmotion      String   // 18 типов
  primaryConfidence   Float
  secondaryEmotion    String?
  secondaryConfidence Float?
  allScores           Json     // fuzzy scores всех 18 эмоций
  createdAt           DateTime @default(now())

  @@index([userId, timestamp])
}

model ActivityRecord {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  timestamp       DateTime
  activityType    String   // 64 типа
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

### 11.13 Пример запросов / Example Requests

```bash
# ═══ Регистрация / Register ═══
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@wvi.health","password":"SecurePass123!","name":"Alexander"}'

# ═══ Логин / Login ═══
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@wvi.health","password":"SecurePass123!"}'
# → {"token":"eyJ...","refreshToken":"...","expiresIn":3600}

# ═══ Массовая синхронизация / Bulk sync ═══
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

# ═══ Текущий WVI / Current WVI ═══
curl http://localhost:8080/api/v1/wvi/current \
  -H "Authorization: Bearer eyJ..."
# → {"wviScore":78,"level":"good","metrics":{...},"emotion":{...},"activity":{...}}

# ═══ AI интерпретация / AI interpretation ═══
curl -X POST http://localhost:8080/api/v1/ai/interpret \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"includeHistory":true,"perspective":"all"}'
# → {"summary":"Ваше состояние хорошее...","recommendations":[...],"perspectives":{...}}

# ═══ Генерация PDF отчёта / Generate PDF report ═══
curl -X POST http://localhost:8080/api/v1/reports/generate \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"type":"pdf","period":"weekly"}'
# → {"reportId":"rpt_abc123","estimatedSeconds":30}

# ═══ Swagger UI / Swagger docs ═══
# Открыть в браузере / Open in browser:
# http://localhost:8080/api/v1/docs
```

---

## ЧАСТЬ 12: ФАЙЛЫ ДЛЯ СОЗДАНИЯ (обновлено)

| # | Файл | Описание |
|---|------|----------|
| 1 | `WVIEngine/WVIModels.h` | Все структуры: 18 эмоций, 64 активности, 7 уровней нагрузки, WVIResult, Candidates, Trends |
| 2 | `WVIEngine/WVIDataCollector.h/.m` | Сбор данных со всех 17 эндпоинтов SDK + pagination + auto-sync |
| 3 | `WVIEngine/WVIMetricNormalizer.h/.m` | 10 метрик нормализации + restingHR + baseTemp + RMSSD + coherence + emotional wellbeing |
| 4 | `WVIEngine/WVIEmotionEngine.h/.m` | Fuzzy Logic каскад 18 эмоций + sigmoid/bellCurve + temporal smoothing + secondary emotion |
| 5 | `WVIEngine/WVIActivityDetector.h/.m` | 64 типа активности + TRIMP + пульсовые зоны + калории + auto-detection |
| 6 | `WVIEngine/WVIScoreCalculator.h/.m` | 10 метрик + адаптивные веса + emotion feedback loop + activity context |
| 7 | `WVIEngine/WVITrendAnalyzer.h/.m` | Тренды 24ч/7д/30д + циркадный паттерн + Holt prediction + anomalies |
| 8 | `WVIEngine/WVIAIInterpreter.h/.m` | Claude Genius Layer (8 персон) → интерпретация + рекомендации + прогноз |
| 9 | `WVIEngine/WVIReportGenerator.h/.m` | PDF (McKinsey) + HTML (dashboard) + Telegram + Presentation |
| 10 | `WVIEngine/WVIAlertSystem.h/.m` | 4 уровня алертов + 9 правил триггеров + Telegram notifications |
| 11 | `WVIEngine/WVIAutoMonitorSetup.h/.m` | Настройка 4 типов автозамеров (HR/5мин, HRV/15мин, SpO2/30мин, Temp/30мин) |
| 12 | `WVIEngine/WVIHealthRisk.h/.m` | Health VaR + drawdown + correlation matrix + tail risk (из risk-monitor) |
| 13 | `WVIEngine/WVISystemsDynamics.h/.m` | Feedback loops + simulation "если X → WVI через Y дней" (из mit-systems) |
| 14 | `WVIEngine/WVISentimentBridge.h/.m` | Текстовый sentiment + биометрика = комбинированный mood (из sentiment-analyzer) |
| 15 | `api/middleware/auth.js` | JWT auth middleware |
| 16 | `api/middleware/validation.js` | Request validation (Joi/Zod) |
| 17 | `api/server.js` | Express server + Swagger UI setup |
| 18 | `api/swagger.yaml` | OpenAPI 3.1 спецификация — 43 эндпоинта, все schemas |
| 19 | `api/routes/auth.js` | Auth routes: register, login, refresh |
| 20 | `api/routes/users.js` | Users routes: profile, norms, calibration |
| 21 | `api/routes/biometrics.js` | Biometrics routes: 8 типов данных + sync |
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
| 32 | `api/services/wvi-calculator.js` | Серверная версия WVI Score Calculator |
| 33 | `api/services/emotion-engine.js` | Серверная версия Emotion Engine (18 fuzzy) |
| 34 | `api/services/activity-detector.js` | Серверная версия Activity Detector (64 типа) |
| 35 | `api/services/ai-interpreter.js` | Claude AI интеграция (Genius Layer) |

---

## ЧАСТЬ 13: VERIFICATION

1. **Unit tests нормализации**: mock данные → проверить каждую из 9 формул на граничных значениях
2. **Emotion fuzzy tests**: 11 наборов "идеальных" метрик → каждый должен определить свою эмоцию
3. **Temporal smoothing test**: быстро чередующиеся данные → эмоция не должна прыгать чаще 5 мин
4. **WVI адаптивные веса**: проверить что сумма весов = 1.0 для всех timeOfDay
5. **Alert rules**: mock данные с SpO2=90 → должен сработать EMERGENCY
6. **Prediction**: синтетические тренды → проверить Holt forecasting
7. **Integration**: подключить устройство → полный цикл сбор → WVI → Telegram
8. **AI prompt**: отправить тестовые данные в Claude → проверить качество интерпретации
