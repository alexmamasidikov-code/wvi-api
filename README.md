# WVI — Wellness Vitality Index API

**EN:** Complete REST API for biometric data collection, WVI calculation (0-100), 18 emotion detection via Fuzzy Logic, 64 activity type auto-detection with TRIMP/HR zones, and AI-powered health insights.

**RU:** Полный REST API для сбора биометрических данных, расчёта WVI (0-100), определения 18 эмоций через Fuzzy Logic, авто-детекции 64 типов активности с TRIMP/пульсовыми зонами, и AI-аналитики здоровья.

---

## Quick Start / Быстрый старт

### Docker (recommended / рекомендуется)

```bash
# Clone / Клонировать
git clone https://github.com/anthropics/wvi-api.git
cd wvi-api

# Copy env / Скопировать настройки
cp .env.example .env

# Build & run / Собрать и запустить
docker-compose up -d

# Open / Открыть
# Swagger UI:      http://localhost:8091/api/v1/docs
# Documentation:   http://localhost:8091/api/v1/documentation
# Health check:    http://localhost:8091/api/v1/health/server-status
```

### Node.js (development / разработка)

```bash
# Install / Установка
npm install

# Run / Запуск
PORT=8091 node server.js

# Or with env file / Или с файлом настроек
cp .env.example .env
npm start
```

---

## Links / Ссылки

| Link / Ссылка | Description / Описание |
|---|---|
| `http://localhost:8091/api/v1/docs` | Swagger UI — interactive API explorer / интерактивный обозреватель API |
| `http://localhost:8091/api/v1/documentation` | Full API docs (HTML) / Полная документация API |
| `http://localhost:8091/api/v1/documentation/raw` | API docs (Markdown) / Документация в Markdown |
| `http://localhost:8091/api/v1/docs.json` | OpenAPI 3.1 JSON spec / Спецификация OpenAPI |
| `http://localhost:8091/api/v1/health/server-status` | Health check / Проверка здоровья сервера |

---

## Features / Возможности

### WVI Score (0-100)
- **10 normalized metrics / 10 нормализованных метрик:** HR, HRV, Stress, SpO2, Temperature, Sleep, Activity, Blood Pressure, PPI Coherence, Emotional Wellbeing
- **Adaptive weights / Адаптивные веса:** change by time of day (night: sleep matters more, morning: HRV critical, workday: stress important)
- **Emotion feedback loop / Обратная связь эмоций:** detected emotion adjusts final WVI (flow +12%, exhausted -15%)
- **7 levels / 7 уровней:** superb (95+), excellent (85+), good (70+), moderate (55+), attention (40+), critical (25+), dangerous (0-24)

### 18 Emotions / 18 Эмоций
Detected via Fuzzy Logic cascade (sigmoid + bell curve + temporal smoothing):

| Emoji | EN | RU | Category |
|---|---|---|---|
| 😌 | Calm | Спокойствие | Positive |
| 🧘 | Relaxed | Расслабленность | Positive |
| 😊 | Joyful | Радость | Positive |
| ⚡ | Energized | Энергичность | Positive |
| 🎉 | Excited | Возбуждение | Positive |
| 🎯 | Focused | Концентрация | Neutral |
| 🕉 | Meditative | Медитация | Neutral |
| 🔄 | Recovering | Восстановление | Neutral |
| 😴 | Drowsy | Сонливость | Neutral |
| 😰 | Stressed | Стресс | Negative |
| 😱 | Anxious | Тревожность | Negative |
| 😤 | Angry | Гнев | Negative |
| 😣 | Frustrated | Фрустрация | Negative |
| 😨 | Fearful | Страх | Negative |
| 😔 | Sad | Грусть | Negative |
| 😩 | Exhausted | Истощение | Negative |
| 🤕 | Pain | Боль | Physiological |
| 🌊 | Flow | Поток | Physiological |

### 64 Activity Types / 64 Типа Активности
Auto-detected from HR + steps + HRV + stress + SpO2 + temperature + PPI:

| Category / Категория | Types / Типы |
|---|---|
| 💤 Sleep / Сон | deep_sleep, light_sleep, rem_sleep, nap, falling_asleep |
| 🪑 Rest / Покой | resting, sitting_relaxed, sitting_working, standing, lying_awake, phone_scrolling, watching_screen |
| 🚶 Walking / Ходьба | stroll, walk_normal, walk_brisk, hiking, nordic_walking |
| 🏃 Running / Бег | jogging, run_tempo, run_interval, sprinting, trail_running |
| 🚴 Cardio / Кардио | cycling, stationary_bike, elliptical, rowing |
| 🏋️ Strength / Силовые | weight_training, bodyweight, crossfit, hiit, circuit_training |
| 🧘 Mind-Body | yoga_vinyasa, yoga_hot, pilates, stretching, meditation |
| ⚽ Sports / Спорт | football, basketball, tennis, badminton, swimming, martial_arts, dancing |
| 🏠 Daily / Быт | housework, cooking, driving, commuting, shopping, eating |
| ⚡ Physio / Физиология | stress_event, panic_attack, crying, laughing, pain_episode, illness, intimacy |
| 🔄 Recovery / Восстановление | warm_up, cool_down, active_recovery, passive_recovery |
| 🧠 Mental / Ментальные | deep_work, presentation, exam, creative_flow |

### Load Tracking / Отслеживание нагрузки
- **7 load levels / 7 уровней:** none → minimal → light → moderate → high → intense → extreme
- **5 HR zones / 5 пульсовых зон:** Recovery, Fat Burn, Aerobic, Anaerobic, VO2max
- **TRIMP** (Banister Training Impulse)
- **METS** (Metabolic Equivalent of Task)
- **Calories/min** from METS formula

---

## API Endpoints / Эндпоинты API

**110 endpoints** across **17 groups / групп:**

| Group / Группа | Count | Description / Описание |
|---|---|---|
| Auth | 3 | Register, login, refresh (Privy JWT) |
| Users | 4 | Profile, norms, calibration |
| Biometrics | 25 | HR, HRV, SpO2, temp, sleep, PPI, ECG, activity, BP, stress, breathing, RMSSD, coherence, realtime, summary, sync |
| WVI | 9 | Current, history, trends, predict, simulate, circadian, correlations, breakdown, compare |
| Emotions | 8 | Current, history, wellbeing, distribution, heatmap, transitions, triggers, streaks |
| Activities | 10 | Current, history, load, zones, categories, transitions, sedentary, exercise-log, recovery, manual-log |
| Sleep | 7 | Last-night, score-history, architecture, consistency, debt, phases, optimal-window |
| AI | 8 | Interpret, recommendations, chat, insights, genius-layer, explain-metric, action-plan |
| Reports | 6 | Generate, list, templates, get, download, delete |
| Alerts | 7 | List, active, settings, history, acknowledge, stats |
| Device | 7 | Status, auto-monitoring, sync, capabilities, measure, firmware |
| Training | 4 | Recommendation, weekly-plan, overtraining-risk, optimal-time |
| Risk | 5 | Assessment, anomalies, chronic-flags, correlations, volatility |
| Dashboard | 3 | Widgets, daily-brief, evening-review |
| Export | 3 | CSV, JSON, health-summary |
| Settings | 4 | Get/set settings, get/set notifications |
| Health | 2 | Server status, API version |

---

## Authentication / Аутентификация

**EN:** Uses [Privy](https://privy.io) for authentication. All endpoints except `/auth/*`, `/health/*`, `/docs*`, and `/documentation*` require `Authorization: Bearer <token>` header.

**RU:** Используется [Privy](https://privy.io) для аутентификации. Все эндпоинты кроме `/auth/*`, `/health/*`, `/docs*` и `/documentation*` требуют заголовок `Authorization: Bearer <token>`.

**Dev mode / Режим разработки:** Without `PRIVY_APP_ID` set, any Bearer token is accepted. / Без `PRIVY_APP_ID` принимается любой Bearer токен.

```bash
# Example / Пример
curl -H "Authorization: Bearer dev-token" http://localhost:8091/api/v1/wvi/current
```

---

## Testing with Query Parameters / Тестирование через параметры

**EN:** The `/wvi/current`, `/emotions/current`, and `/activities/current` endpoints accept query parameters to test with different biometric values.

**RU:** Эндпоинты `/wvi/current`, `/emotions/current` и `/activities/current` принимают параметры запроса для тестирования с разными биометрическими значениями.

```bash
# Stressed person / Стрессовый человек
curl -H "Authorization: Bearer dev" \
  'http://localhost:8091/api/v1/wvi/current?hr=90&hrv=32&stress=68&spo2=95&temp=36.9'

# Runner / Бегущий
curl -H "Authorization: Bearer dev" \
  'http://localhost:8091/api/v1/activities/current?hr=155&stepsPerMin=130&stress=20'

# Anxious / Тревожный
curl -H "Authorization: Bearer dev" \
  'http://localhost:8091/api/v1/emotions/current?hr=100&hrv=22&stress=80&spo2=95'

# Meditating / Медитирующий
curl -H "Authorization: Bearer dev" \
  'http://localhost:8091/api/v1/activities/current?hr=58&stepsPerMin=0&stress=8&hrv=72&coherence=0.75'
```

Available parameters / Доступные параметры:
`hr`, `hrv`, `stress`, `spo2`, `temp`, `sys`, `dia`, `coherence`, `rmssd`, `steps`, `stepsPerMin`, `activeMins`, `sleepMin`, `deep`, `mets`, `restingHR`, `maxHR`, `weight`, `gender`, `stepCadence`, `hrVar`, `hrInterval`, `hrRamp`, `hrAccel`, `breathReg`, `minsSince`, `sleepScore`, `activityScore`

---

## Environment Variables / Переменные окружения

| Variable | Default | Description / Описание |
|---|---|---|
| `PORT` | `8091` | Server port / Порт сервера |
| `NODE_ENV` | `development` | Environment / Окружение |
| `PRIVY_APP_ID` | — | Privy app ID (optional in dev) |
| `PRIVY_APP_SECRET` | — | Privy app secret (optional in dev) |
| `ANTHROPIC_API_KEY` | — | Claude API key for /ai/* endpoints |

---

## Architecture / Архитектура

```
wvi-api/
├── server.js                  — Express server (110 endpoints, Privy auth)
├── services/
│   ├── emotion-engine.js      — 18 emotions (Fuzzy Logic: sigmoid, bellCurve, temporal smoothing)
│   ├── wvi-calculator.js      — WVI score (10 metrics, adaptive weights, emotion feedback)
│   └── activity-detector.js   — 64 activities (cascade detection, TRIMP, HR zones, METS)
├── swagger/
│   ├── openapi.yaml           — OpenAPI 3.1 spec (100 paths, 29 schemas)
│   └── openapi-en.yaml        — English-only spec
├── API-DOCUMENTATION.md       — Full bilingual documentation
├── docker-compose.yml         — Docker deployment
├── Dockerfile                 — Node 20 Alpine, healthcheck
├── .env.example               — Environment template
└── package.json               — Dependencies
```

---

## License

Proprietary — All rights reserved.
