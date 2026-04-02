# WVI API Documentation / Документация WVI API

> **Version / Версия:** 1.0.0
> **Base URL:** `http://localhost:8091/api/v1`
> **Swagger UI:** `http://localhost:8091/api/v1/docs`
> **OpenAPI Spec:** `http://localhost:8091/api/v1/docs.json`

---

## Table of Contents / Содержание

1. [Overview / Обзор](#1-overview--обзор)
2. [Authentication / Аутентификация](#2-authentication--аутентификация)
3. [User Profile / Профиль пользователя](#3-user-profile--профиль-пользователя)
4. [Biometrics / Биометрические данные](#4-biometrics--биометрические-данные)
5. [WVI -- Wellness Vitality Index](#5-wvi--wellness-vitality-index)
6. [Emotions / Эмоции (18 states)](#6-emotions--эмоции-18-states)
7. [Activities / Активности (64 types)](#7-activities--активности-64-types)
8. [Sleep / Сон](#8-sleep--сон)
9. [AI / Искусственный интеллект](#9-ai--искусственный-интеллект)
10. [Reports / Отчёты](#10-reports--отчёты)
11. [Alerts / Алерты](#11-alerts--алерты)
12. [Device / Устройство](#12-device--устройство)
13. [Training / Тренировки](#13-training--тренировки)
14. [Risk / Риски](#14-risk--риски)
15. [Dashboard / Дашборд](#15-dashboard--дашборд)
16. [Export / Экспорт](#16-export--экспорт)
17. [Settings / Настройки](#17-settings--настройки)
18. [Health / Здоровье сервера](#18-health--здоровье-сервера)
- [Appendix A: Query Parameters for Testing](#appendix-a-query-parameters-for-testing)
- [Appendix B: Error Codes](#appendix-b-error-codes)

---

## 1. Overview / Обзор

### What is WVI / Что такое WVI

**EN:** WVI (Wellness Vitality Index) is a real-time wellness scoring API that combines biometric data from wearable devices (heart rate, HRV, SpO2, temperature, ECG, PPI, sleep, activity) with emotion detection and activity recognition algorithms. The core WVI score (0-100) is computed from 10 weighted sub-metrics and adjusted for circadian rhythm, emotional state, and physical activity context.

**RU:** WVI (Wellness Vitality Index) -- это API для оценки здоровья в реальном времени, которое объединяет биометрические данные с носимых устройств (ЧСС, ВРС, SpO2, температура, ЭКГ, PPI, сон, активность) с алгоритмами распознавания эмоций и активности. Основной индекс WVI (0-100) вычисляется из 10 взвешенных суб-метрик и корректируется с учётом циркадного ритма, эмоционального состояния и физической активности.

**Key capabilities / Ключевые возможности:**
- Real-time WVI score with 10-metric breakdown / Индекс WVI в реальном времени с декомпозицией по 10 метрикам
- 18-emotion detection from biometric signals / Распознавание 18 эмоций по биометрическим сигналам
- 64-activity type recognition with TRIMP-based load scoring / Распознавание 64 типов активности с TRIMP-нагрузкой
- AI-powered interpretations from 8 expert perspectives (Genius Layer) / AI-интерпретации с 8 экспертных перспектив
- Risk assessment, anomaly detection, chronic pattern flagging / Оценка рисков, детекция аномалий, хронические флаги
- Training recommendations based on readiness and load balance / Рекомендации по тренировкам на основе готовности
- Sleep architecture analysis with debt tracking / Анализ архитектуры сна со слежением за долгом сна
- Full data export (CSV, JSON, PDF) / Полный экспорт данных

### Response Format / Формат ответа

All endpoints return a standard wrapper:

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": { ... }
}
```

On error:

```json
{
  "success": false,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "error": { "code": 401, "message": "Unauthorized" }
}
```

---

## 2. Authentication / Аутентификация

**EN:** Authentication uses Privy JWT tokens. Register or login to receive an `accessToken` and `refreshToken`. Include the access token as a `Bearer` token in the `Authorization` header for all authenticated endpoints.

**RU:** Аутентификация использует JWT-токены Privy. Зарегистрируйтесь или войдите для получения `accessToken` и `refreshToken`. Передавайте access token как `Bearer` token в заголовке `Authorization` для всех защищённых эндпоинтов.

```
Authorization: Bearer <accessToken>
```

---

### POST /auth/register

**EN:** Creates a new user account and returns access and refresh tokens.
**RU:** Создаёт новую учётную запись пользователя и возвращает токены доступа и обновления.

**Request Body:**

| Field | Type | Required | Description EN | Описание RU |
|-------|------|----------|---------------|-------------|
| email | string | Yes | User email | Email пользователя |
| password | string | Yes | Password (min 8 chars) | Пароль (мин. 8 символов) |
| name | string | Yes | User name | Имя пользователя |

```bash
curl -X POST http://localhost:8091/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@wvi.health",
    "password": "SecurePass123",
    "name": "Alexander"
  }'
```

**Response (201):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "userId": "usr_abc123",
    "email": "user@wvi.health",
    "name": "Alexander",
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "rt_x7k9m2...",
    "expiresIn": 3600
  }
}
```

---

### POST /auth/login

**EN:** Authenticates a user and returns access and refresh tokens.
**RU:** Аутентифицирует пользователя и возвращает токены доступа и обновления.

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

```bash
curl -X POST http://localhost:8091/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@wvi.health",
    "password": "SecurePass123"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "userId": "usr_abc123",
    "email": "user@wvi.health",
    "name": "Alexander",
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "rt_x7k9m2...",
    "expiresIn": 3600
  }
}
```

---

### POST /auth/refresh

**EN:** Exchanges a valid refresh token for a new access token. Call this before the current access token expires to maintain the session.
**RU:** Обменивает действительный refresh token на новый access token. Вызовите перед истечением срока действия текущего токена.

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| refreshToken | string | Yes |

```bash
curl -X POST http://localhost:8091/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "rt_x7k9m2..."}'
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

---

## 3. User Profile / Профиль пользователя

### GET /users/me

**EN:** Returns the authenticated user's profile including demographic data used for personalized calculations (age, gender, height, weight).
**RU:** Возвращает профиль аутентифицированного пользователя, включая демографические данные для персонализированных расчётов.

```bash
curl http://localhost:8091/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "userId": "usr_abc123",
    "email": "user@wvi.health",
    "name": "Alexander",
    "age": 30,
    "gender": "male",
    "height": 180,
    "weight": 75,
    "createdAt": "2026-03-01T10:00:00.000Z"
  }
}
```

---

### PUT /users/me

**EN:** Updates the authenticated user's profile. Only provided fields are updated. Changes to age, weight, or gender may affect WVI calculations.
**RU:** Обновляет профиль пользователя. Обновляются только переданные поля. Изменения возраста, веса или пола могут повлиять на расчёт WVI.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| name | string | User name |
| age | integer | Age in years |
| gender | string | male / female / other |
| height | integer | Height in cm |
| weight | integer | Weight in kg |

```bash
curl -X PUT http://localhost:8091/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"age": 31, "weight": 74}'
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "userId": "usr_abc123",
    "email": "user@wvi.health",
    "name": "Alexander",
    "age": 31,
    "gender": "male",
    "height": 180,
    "weight": 74,
    "updatedAt": "2026-04-02T12:00:00.000Z"
  }
}
```

---

### GET /users/me/norms

**EN:** Returns the user's personal biometric baselines used for WVI calculation. These norms are either calibrated from historical data or set to population defaults.
**RU:** Возвращает персональные биометрические базовые значения пользователя для расчёта WVI. Нормы либо калибруются по историческим данным, либо устанавливаются по умолчанию.

```bash
curl http://localhost:8091/api/v1/users/me/norms \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "hr": { "min": 55, "max": 85, "resting": 62 },
    "hrv": { "min": 35, "max": 120, "baseline": 68 },
    "spo2": { "min": 95, "max": 100 },
    "temperature": { "min": 36.1, "max": 37.2 },
    "stress": { "low": 25, "high": 70 },
    "bloodPressure": {
      "systolicMin": 100, "systolicMax": 130,
      "diastolicMin": 60, "diastolicMax": 85
    }
  }
}
```

---

### POST /users/me/norms/calibrate

**EN:** Initiates a 7-day calibration period where the system collects baseline biometric data to establish personalized norms.
**RU:** Запускает 7-дневный период калибровки, в течение которого система собирает базовые биометрические данные для установления персональных норм.

```bash
curl -X POST http://localhost:8091/api/v1/users/me/norms/calibrate \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "status": "calibration_started",
    "estimatedDuration": "7 days",
    "message": "Calibration started. Wear your device continuously for best results."
  }
}
```

---

## 4. Biometrics / Биометрические данные

### POST /biometrics/sync

**EN:** Uploads a batch of biometric records from the wearable device. Accepts mixed metric types in a single request.
**RU:** Загружает пакет биометрических записей с носимого устройства. Принимает смешанные типы метрик в одном запросе.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| deviceId | string | Device identifier |
| records | array | Array of records, each with `type`, `timestamp`, `data` |

Valid types: `heart_rate`, `hrv`, `spo2`, `temperature`, `sleep`, `ppi`, `ecg`, `activity`

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/sync \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "polar_verity_001",
    "records": [
      {"type": "heart_rate", "timestamp": "2026-04-02T12:00:00Z", "data": {"bpm": 72}},
      {"type": "hrv", "timestamp": "2026-04-02T12:00:00Z", "data": {"rmssd": 68.4, "sdnn": 74.2}},
      {"type": "spo2", "timestamp": "2026-04-02T12:00:00Z", "data": {"value": 98}}
    ]
  }'
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:01.000Z",
  "data": {
    "syncId": "sync_abc123",
    "recordsReceived": 3,
    "recordsProcessed": 3,
    "duration": "142ms",
    "lastSyncAt": "2026-04-02T12:00:01.000Z"
  }
}
```

---

### Common Query Parameters for Biometric GET Endpoints

| Parameter | Type | Description EN | Описание RU |
|-----------|------|---------------|-------------|
| from | string (ISO 8601) | Start of date range | Начало диапазона дат |
| to | string (ISO 8601) | End of date range | Конец диапазона дат |
| granularity | string | `minute` / `hour` / `day` (default: `hour`) | Гранулярность данных |

---

### GET /biometrics/heart-rate

**EN:** Returns current heart rate, resting HR, min/max for the period, and time-series history.
**RU:** Возвращает текущую ЧСС, ЧСС в покое, мин/макс за период и историю временного ряда.

```bash
curl "http://localhost:8091/api/v1/biometrics/heart-rate?from=2026-04-01T00:00:00Z&to=2026-04-02T00:00:00Z&granularity=hour" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "current": 72,
    "min": 58,
    "max": 145,
    "resting": 62,
    "unit": "bpm",
    "history": [
      {"ts": "2026-04-01T00:00:00Z", "value": 58},
      {"ts": "2026-04-01T01:00:00Z", "value": 60}
    ]
  }
}
```

### POST /biometrics/heart-rate

**EN:** Uploads one or more heart rate measurement records.
**RU:** Загружает одну или несколько записей измерений ЧСС.

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/heart-rate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"timestamp": "2026-04-02T12:00:00Z", "value": 72},
      {"timestamp": "2026-04-02T12:01:00Z", "value": 74}
    ]
  }'
```

**Response (201):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:01:00.000Z",
  "data": {
    "message": "Data saved",
    "recordsSaved": 2,
    "type": "heart_rate"
  }
}
```

---

### GET /biometrics/hrv

**EN:** Returns HRV metrics: RMSSD, SDNN, lnRMSSD, pNN50. RMSSD is the primary HRV indicator used in WVI calculation.
**RU:** Возвращает метрики ВРС: RMSSD, SDNN, lnRMSSD, pNN50. RMSSD -- основной показатель ВРС в расчёте WVI.

```bash
curl "http://localhost:8091/api/v1/biometrics/hrv?granularity=hour" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "rmssd": 68.4,
    "sdnn": 74.2,
    "lnRmssd": 4.23,
    "pnn50": 32.1,
    "unit": "ms",
    "history": [
      {"ts": "2026-04-02T08:00:00Z", "rmssd": 72.1, "sdnn": 78.3},
      {"ts": "2026-04-02T09:00:00Z", "rmssd": 65.8, "sdnn": 70.1}
    ]
  }
}
```

### POST /biometrics/hrv

**EN:** Uploads HRV measurement records. Each record may include RMSSD, SDNN, pNN50, stress, heart rate, and BP.
**RU:** Загружает записи измерений ВРС. Каждая запись может включать RMSSD, SDNN, pNN50, стресс, ЧСС и АД.

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/hrv \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"timestamp": "2026-04-02T12:00:00Z", "value": 68.4}
    ]
  }'
```

**Response (201):**

```json
{
  "success": true,
  "data": { "message": "Data saved", "recordsSaved": 1, "type": "hrv" }
}
```

---

### GET /biometrics/spo2

**EN:** Returns blood oxygen saturation. Normal: 95-100%. Below 92% triggers a critical alert.
**RU:** Возвращает насыщение крови кислородом. Норма: 95-100%. Ниже 92% -- критический алерт.

```bash
curl "http://localhost:8091/api/v1/biometrics/spo2" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "current": 98, "min": 95, "max": 99,
    "unit": "%",
    "history": [{"ts": "2026-04-02T08:00:00Z", "value": 97}]
  }
}
```

### POST /biometrics/spo2

**EN:** Uploads SpO2 measurement records.
**RU:** Загружает записи измерений SpO2.

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/spo2 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"records": [{"timestamp": "2026-04-02T12:00:00Z", "value": 98}]}'
```

---

### GET /biometrics/temperature

**EN:** Returns body temperature in Celsius. Normal: 36.1-37.2C. Deviations from personal baseline are used in WVI.
**RU:** Возвращает температуру тела в Цельсиях. Норма: 36.1-37.2C. Отклонения от базовой используются в WVI.

```bash
curl "http://localhost:8091/api/v1/biometrics/temperature" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "current": 36.6, "min": 36.1, "max": 37.0,
    "unit": "celsius",
    "history": [{"ts": "2026-04-02T08:00:00Z", "value": 36.4}]
  }
}
```

### POST /biometrics/temperature

**EN:** Uploads temperature records.
**RU:** Загружает записи температуры.

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/temperature \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"records": [{"timestamp": "2026-04-02T12:00:00Z", "value": 36.6}]}'
```

---

### GET /biometrics/sleep

**EN:** Returns raw sleep metrics: total/deep/light/REM/awake minutes, efficiency, start/end times.
**RU:** Возвращает сырые метрики сна: общее/глубокое/лёгкое/REM/бодрствование минуты, эффективность, время начала/конца.

```bash
curl "http://localhost:8091/api/v1/biometrics/sleep" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalMinutes": 462,
    "deepMinutes": 95,
    "lightMinutes": 248,
    "remMinutes": 102,
    "awakeMinutes": 17,
    "efficiency": 0.92,
    "startTime": "2026-04-01T23:15:00Z",
    "endTime": "2026-04-02T07:00:00Z"
  }
}
```

### POST /biometrics/sleep

**EN:** Uploads sleep tracking records.
**RU:** Загружает записи сна.

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/sleep \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"records": [{"timestamp": "2026-04-02T07:00:00Z", "value": 462}]}'
```

---

### GET /biometrics/ppi

**EN:** Returns peak-to-peak interval data from PPG sensor. Includes raw intervals (ms), mean PPI, and cardiac coherence score (0-1).
**RU:** Возвращает данные интервалов от пика к пику из датчика PPG. Включает сырые интервалы (мс), средний PPI и скор когерентности сердца (0-1).

```bash
curl "http://localhost:8091/api/v1/biometrics/ppi" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "intervals": [812, 798, 825, 801, 815],
    "unit": "ms",
    "meanPPI": 809.2,
    "coherence": 0.78
  }
}
```

### POST /biometrics/ppi

**EN:** Uploads PPI records with intervals and coherence.
**RU:** Загружает записи PPI с интервалами и когерентностью.

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/ppi \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"records": [{"timestamp": "2026-04-02T12:00:00Z", "value": 809}]}'
```

---

### GET /biometrics/ecg

**EN:** Returns ECG session data: waveform samples (mV), sample rate, rhythm classification, derived heart rate.
**RU:** Возвращает данные ЭКГ-сессии: отсчёты волновой формы (мВ), частота дискретизации, классификация ритма, вычисленная ЧСС.

```bash
curl "http://localhost:8091/api/v1/biometrics/ecg" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "samples": [0.12, 0.15, 0.85, 1.2, 0.9, 0.3, -0.1, 0.05],
    "sampleRate": 125,
    "unit": "mV",
    "rhythm": "normal_sinus",
    "heartRate": 72
  }
}
```

### POST /biometrics/ecg

**EN:** Uploads ECG session records with waveform samples.
**RU:** Загружает записи ЭКГ-сессий с отсчётами волновой формы.

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/ecg \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"records": [{"timestamp": "2026-04-02T12:00:00Z", "value": 72}]}'
```

---

### GET /biometrics/activity

**EN:** Returns step count, calories, distance, active minutes, and current detected activity type.
**RU:** Возвращает количество шагов, калории, расстояние, активные минуты и текущий тип активности.

```bash
curl "http://localhost:8091/api/v1/biometrics/activity" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "steps": 8420,
    "calories": 2150,
    "distance": 6.3,
    "activeMinutes": 47,
    "unit": "metric",
    "currentType": "sitting_working"
  }
}
```

### POST /biometrics/activity

**EN:** Uploads activity records from the wearable device.
**RU:** Загружает записи активности с носимого устройства.

```bash
curl -X POST http://localhost:8091/api/v1/biometrics/activity \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"records": [{"timestamp": "2026-04-02T12:00:00Z", "value": 120}]}'
```

---

### Derived Metrics / Производные метрики

These are read-only GET endpoints for metrics derived from raw biometric data.

### GET /biometrics/blood-pressure

**EN:** Returns derived blood pressure (systolic/diastolic) from pulse wave analysis with BP classification.
**RU:** Возвращает производное артериальное давление из анализа пульсовой волны с классификацией АД.

```bash
curl "http://localhost:8091/api/v1/biometrics/blood-pressure" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "systolic": 118,
    "diastolic": 74,
    "pulse": 72,
    "unit": "mmHg",
    "classification": "normal",
    "measuredAt": "2026-04-02T12:00:00Z"
  }
}
```

Classification values: `optimal`, `normal`, `high_normal`, `hypertension_1`, `hypertension_2`

---

### GET /biometrics/stress

**EN:** Returns stress index (0-100) from HRV frequency domain analysis. Lower = calmer.
**RU:** Возвращает индекс стресса (0-100) из частотного анализа ВРС. Ниже = спокойнее.

```bash
curl "http://localhost:8091/api/v1/biometrics/stress" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "current": 35,
    "level": "low",
    "unit": "index_0_100",
    "history": [{"ts": "2026-04-02T08:00:00Z", "value": 28}]
  }
}
```

Level values: `low`, `moderate`, `high`, `very_high`

---

### GET /biometrics/breathing-rate

**EN:** Returns respiratory rate from PPG waveform modulation. Normal: 12-20 breaths/min.
**RU:** Возвращает частоту дыхания из модуляции PPG-волны. Норма: 12-20 вдохов/мин.

```bash
curl "http://localhost:8091/api/v1/biometrics/breathing-rate" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "current": 16,
    "unit": "breaths_per_min",
    "history": [{"ts": "2026-04-02T08:00:00Z", "value": 14}]
  }
}
```

---

### GET /biometrics/rmssd

**EN:** Returns RMSSD -- the primary HRV time-domain metric. Higher values = better parasympathetic tone.
**RU:** Возвращает RMSSD -- основную метрику ВРС во временном домене. Выше = лучший парасимпатический тонус.

```bash
curl "http://localhost:8091/api/v1/biometrics/rmssd" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "current": 68.4,
    "unit": "ms",
    "trend": "stable",
    "history": [{"ts": "2026-04-02T08:00:00Z", "value": 72.1}]
  }
}
```

Trend values: `improving`, `stable`, `declining`

---

### GET /biometrics/coherence

**EN:** Returns cardiac coherence score (0-1) from PPI regularity analysis. Above 0.6 = good coherence.
**RU:** Возвращает скор кардиальной когерентности (0-1). Выше 0.6 = хорошая когерентность.

```bash
curl "http://localhost:8091/api/v1/biometrics/coherence" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "score": 0.78,
    "level": "high",
    "unit": "ratio_0_1",
    "history": [{"ts": "2026-04-02T08:00:00Z", "score": 0.72}]
  }
}
```

Level values: `low`, `medium`, `high`

---

### GET /biometrics/realtime

**EN:** Returns latest values for all primary biometric signals in one response. For live dashboards.
**RU:** Возвращает последние значения всех основных биометрических сигналов в одном ответе. Для живых дашбордов.

```bash
curl "http://localhost:8091/api/v1/biometrics/realtime" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "hr": 72,
    "hrv": 68.4,
    "spo2": 98,
    "stress": 35,
    "temperature": 36.6,
    "activity": "sitting_working",
    "sampledAt": "2026-04-02T12:00:00Z"
  }
}
```

---

### GET /biometrics/summary

**EN:** Returns aggregated biometric statistics for a given day.
**RU:** Возвращает агрегированные биометрические статистики за указанный день.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| date | string (date) | Date to summarize (default: today) |

```bash
curl "http://localhost:8091/api/v1/biometrics/summary?date=2026-04-01" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "date": "2026-04-01",
    "hr": { "avg": 72, "min": 58, "max": 145, "resting": 62 },
    "hrv": { "avgRmssd": 68.4, "avgSdnn": 74.2 },
    "spo2": { "avg": 97.5, "min": 95 },
    "stress": { "avg": 35, "max": 72 },
    "steps": 8420,
    "calories": 2150,
    "activeMinutes": 47,
    "sleepScore": 82
  }
}
```

---

## 5. WVI -- Wellness Vitality Index

### How WVI is Calculated / Как вычисляется WVI

**EN:** The WVI score (0-100) is computed from **10 normalized sub-metrics** (each 0-100), combined with **adaptive time-of-day weights**, and adjusted by an **emotion feedback multiplier**.

**RU:** Индекс WVI (0-100) вычисляется из **10 нормализованных суб-метрик** (каждая 0-100), объединённых с **адаптивными весами по времени суток**, и скорректированных **эмоциональным мультипликатором обратной связи**.

#### The 10 Metrics / 10 метрик

| # | Metric | Normalizer | Default Weight |
|---|--------|-----------|----------------|
| 1 | Heart Rate | `100 - abs(HR - restingHR) * 2.5` | 0.09 |
| 2 | HRV (RMSSD) | `(hrv / ageBasedMaxHRV) * 100` | 0.18 |
| 3 | Stress | `100 - stress` (inverted) | 0.15 |
| 4 | SpO2 | Piecewise: 98+=80-100, 95-98=30-80, 90-95=0-30 | 0.09 |
| 5 | Temperature | `100 - abs(temp - baseTemp) * 40` | 0.05 |
| 6 | Sleep | 35% deep + 40% duration + 25% continuity | 0.13 |
| 7 | Activity | 45% steps + 35% activeMins + 20% METs bonus | 0.08 |
| 8 | Blood Pressure | `100 - (abs(sys-120) + abs(dia-80)) * 1.5` | 0.06 |
| 9 | PPI Coherence | `coherence * 100` | 0.05 |
| 10 | Emotional Wellbeing | Recency-weighted average of emotion values (24h) | 0.12 |

#### Adaptive Weights by Time of Day / Адаптивные веса по времени суток

| Time Period | Key Weight Changes |
|-------------|-------------------|
| **Night (22:00-06:00)** | Sleep 0.25, HRV 0.20, Activity 0.03 |
| **Morning (06:00-10:00)** | HRV 0.28, Sleep 0.18, Activity 0.05 |
| **Work Day (10:00-18:00)** | Stress 0.22, HRV 0.20, Activity 0.12, Emotional 0.12 |
| **Default** | Standard weights above |
| **Exercise Override** | HR 0.05, Activity 0.15, SpO2 0.15 |

#### Emotion Feedback Multiplier / Эмоциональный мультипликатор

The detected emotion adjusts the raw WVI via a multiplier:

| Emotion | Multiplier | Emotion | Multiplier |
|---------|-----------|---------|-----------|
| flow | 1.12 | drowsy | 0.97 |
| meditative | 1.10 | stressed | 0.95 |
| joyful | 1.08 | frustrated | 0.93 |
| excited | 1.06 | sad | 0.91 |
| energized | 1.05 | anxious | 0.88 |
| relaxed | 1.04 | angry | 0.87 |
| focused | 1.03 | pain | 0.86 |
| calm | 1.02 | fearful | 0.85 |
| recovering | 1.00 | exhausted | 0.85 |

Formula: `finalWVI = rawWVI * (1.0 + (multiplier - 1.0) * emotionConfidence)`

#### WVI Levels / Уровни WVI

| Score Range | Level | Description EN | Описание RU |
|------------|-------|---------------|-------------|
| 95-100 | superb | Exceptional wellness state | Исключительное состояние |
| 85-94 | excellent | All metrics in optimal range | Все метрики в оптимальном диапазоне |
| 70-84 | good | Generally healthy with minor areas to improve | В целом здоров, есть мелкие улучшения |
| 55-69 | moderate | Some metrics need attention | Некоторые метрики требуют внимания |
| 40-54 | attention | Multiple metrics below optimal | Несколько метрик ниже оптимума |
| 25-39 | critical | Significant health concerns | Значительные проблемы со здоровьем |
| 0-24 | dangerous | Immediate attention required | Требует немедленного внимания |

---

### GET /wvi/current

**EN:** Computes the real-time WVI score from latest biometric data. Returns WVI breakdown (10 sub-scores with weights), detected emotion, and detected activity. Supports query param overrides for testing.
**RU:** Вычисляет индекс WVI в реальном времени. Возвращает декомпозицию WVI (10 суб-скоров с весами), распознанную эмоцию и активность. Поддерживает override параметров для тестирования.

**Query Parameters (all optional, for testing):**

| Parameter | Description |
|-----------|-------------|
| hr | Heart rate (bpm) |
| hrv | HRV RMSSD (ms) |
| stress | Stress index (0-100) |
| spo2 | SpO2 (%) |
| temp | Temperature (C) |
| sys | Systolic BP (mmHg) |
| dia | Diastolic BP (mmHg) |
| coherence | PPI coherence (0-1) |
| sleepMin | Total sleep minutes |
| deep | Deep sleep percentage |
| steps | Step count |
| activeMins | Active minutes |
| mets | METs value |
| stepsPerMin | Steps per minute |

```bash
curl "http://localhost:8091/api/v1/wvi/current" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": {
    "wvi": {
      "wviScore": 78.5,
      "level": "good",
      "metrics": {
        "heartRate": 82.5,
        "hrv": 92.4,
        "stress": 65.0,
        "spo2": 90.0,
        "temperature": 96.0,
        "sleep": 77.5,
        "activity": 58.3,
        "bloodPressure": 91.0,
        "ppiCoherence": 50.0,
        "emotionalWellbeing": 72.0
      },
      "weights": {
        "heartRateScore": 0.060,
        "hrvScore": 0.200,
        "stressScore": 0.220,
        "spo2Score": 0.060,
        "temperatureScore": 0.040,
        "sleepScore": 0.080,
        "activityScore": 0.120,
        "bpScore": 0.050,
        "ppiCoherenceScore": 0.050,
        "emotionalWellbeingScore": 0.120
      },
      "emotionFeedback": {
        "emotion": "focused",
        "multiplier": 1.03,
        "rawWVI": 76.2
      }
    },
    "emotion": {
      "primary": "focused",
      "primaryConfidence": 0.82,
      "secondary": "calm",
      "secondaryConfidence": 0.65,
      "emoji": "^_target",
      "category": "neutral",
      "label": "Focused",
      "allScores": [
        {"emotion": "focused", "score": 0.82},
        {"emotion": "calm", "score": 0.65},
        {"emotion": "relaxed", "score": 0.48},
        {"emotion": "joyful", "score": 0.22},
        {"emotion": "stressed", "score": 0.12}
      ],
      "timestamp": "2026-04-02T12:00:00.000Z"
    },
    "activity": {
      "type": "sitting_working",
      "category": "rest",
      "emoji": "^_computer",
      "confidence": 0.88,
      "loadLevel": 0,
      "loadLevelName": "none",
      "loadScore": 2.1,
      "loadTarget": "mental",
      "heartRateZone": 0,
      "heartRateZoneName": "Sub-threshold",
      "mets": 1.3,
      "caloriesPerMinute": 1.71,
      "isEmergency": false,
      "alertMessage": null,
      "timestamp": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

---

### GET /wvi/history

**EN:** Returns daily WVI scores over the specified period.
**RU:** Возвращает ежедневные скоры WVI за указанный период.

**Parameters:** `period` = `7d` / `14d` / `30d` / `90d` (default: `30d`)

```bash
curl "http://localhost:8091/api/v1/wvi/history?period=7d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "entries": [
      {"date": "2026-03-27", "score": 72.3},
      {"date": "2026-03-28", "score": 78.1},
      {"date": "2026-03-29", "score": 75.6},
      {"date": "2026-03-30", "score": 80.2},
      {"date": "2026-03-31", "score": 68.9},
      {"date": "2026-04-01", "score": 82.4},
      {"date": "2026-04-02", "score": 78.5}
    ]
  }
}
```

---

### GET /wvi/trends

**EN:** Returns trend direction, slope, confidence, average score, and best/worst days.
**RU:** Возвращает направление тренда, наклон, уверенность, средний скор, лучшие/худшие дни.

**Parameters:** `period` = `7d` / `14d` / `30d` / `90d` (default: `30d`)

```bash
curl "http://localhost:8091/api/v1/wvi/trends?period=30d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "direction": "improving",
    "slope": 0.35,
    "confidence": 0.82,
    "avgScore": 75.2,
    "bestDay": {"date": "2026-04-01", "score": 88.2},
    "worstDay": {"date": "2026-03-15", "score": 52.1}
  }
}
```

---

### GET /wvi/predict

**EN:** Predicts future WVI score based on recent trends. Returns predicted score, confidence, and contributing factors.
**RU:** Предсказывает будущий скор WVI на основе недавних трендов.

**Parameters:** `horizon` = `6h` / `12h` / `24h` / `48h` (default: `24h`)

```bash
curl "http://localhost:8091/api/v1/wvi/predict?horizon=24h" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "predictedScore": 79.2,
    "confidence": 0.75,
    "horizon": "24h",
    "factors": ["improving HRV trend", "consistent sleep pattern", "moderate stress"]
  }
}
```

---

### POST /wvi/simulate

**EN:** Runs a what-if simulation by modifying biometric inputs and computing the resulting WVI. Shows delta from current score.
**RU:** Запускает симуляцию "что если", изменяя биометрические входы и вычисляя результирующий WVI.

```bash
curl -X POST http://localhost:8091/api/v1/wvi/simulate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"changes": {"sleepHours": 8, "steps": 10000}}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "currentScore": 78.5,
    "simulatedScore": 85.2,
    "delta": 6.7,
    "scenario": "8 hours sleep + 10000 steps would improve your WVI by 6.7 points",
    "confidence": 0.80
  }
}
```

---

### GET /wvi/circadian

**EN:** Returns 24-hour circadian rhythm of WVI scores with peak/trough hours and current phase.
**RU:** Возвращает 24-часовой циркадный ритм скоров WVI с пиковыми/нижними часами и текущей фазой.

```bash
curl "http://localhost:8091/api/v1/wvi/circadian" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "peakHour": 10,
    "troughHour": 15,
    "currentPhase": "descending",
    "hourlyScores": [
      {"hour": 0, "score": 65.2},
      {"hour": 6, "score": 72.0},
      {"hour": 10, "score": 82.5},
      {"hour": 15, "score": 68.1},
      {"hour": 20, "score": 74.3}
    ]
  }
}
```

---

### GET /wvi/correlations

**EN:** Returns Pearson correlation coefficients between biometric metrics and WVI score.
**RU:** Возвращает коэффициенты корреляции Пирсона между биометрическими метриками и скором WVI.

```bash
curl "http://localhost:8091/api/v1/wvi/correlations" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "pairs": [
      {"metricA": "hrv", "metricB": "wvi", "r": 0.85, "p": 0.001},
      {"metricA": "stress", "metricB": "wvi", "r": -0.72, "p": 0.003},
      {"metricA": "sleep", "metricB": "wvi", "r": 0.68, "p": 0.005}
    ]
  }
}
```

---

### GET /wvi/breakdown

**EN:** Returns WVI score decomposed into 10 component metrics with weights and contributions.
**RU:** Возвращает скор WVI, разложенный на 10 компонентных метрик с весами и вкладами.

```bash
curl "http://localhost:8091/api/v1/wvi/breakdown" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "score": 78,
    "weights": {
      "hr": 0.06, "hrv": 0.20, "stress": 0.22, "spo2": 0.06,
      "temperature": 0.04, "sleep": 0.08, "activity": 0.12,
      "bloodPressure": 0.05, "ppiCoherence": 0.05, "emotionalWellbeing": 0.12
    },
    "contributions": {
      "hr": 4.95, "hrv": 18.48, "stress": 14.30, "spo2": 5.40,
      "temperature": 3.84, "sleep": 6.20, "activity": 7.00,
      "bloodPressure": 4.55, "ppiCoherence": 2.50, "emotionalWellbeing": 8.64
    }
  }
}
```

---

### GET /wvi/compare

**EN:** Compares average WVI between two date ranges. Shows per-metric changes.
**RU:** Сравнивает средний WVI между двумя датовыми диапазонами. Показывает по-метричные изменения.

**Parameters (required):**

| Parameter | Description |
|-----------|-------------|
| period1 | First period (e.g. `2026-03-01/2026-03-15`) |
| period2 | Second period (e.g. `2026-03-16/2026-03-31`) |

```bash
curl "http://localhost:8091/api/v1/wvi/compare?period1=2026-03-01/2026-03-15&period2=2026-03-16/2026-03-31" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period1": {"range": "2026-03-01/2026-03-15", "avgWVI": 72.3, "avgEmotion": "calm", "avgActivity": "sitting_working"},
    "period2": {"range": "2026-03-16/2026-03-31", "avgWVI": 78.1, "avgEmotion": "focused", "avgActivity": "walk_normal"},
    "delta": 5.8,
    "trend": "improving",
    "metricChanges": {"hrv": 4.2, "stress": -3.1, "sleep": 2.8, "activity": 8.5}
  }
}
```

---

## 6. Emotions / Эмоции (18 states)

### How It Works / Как это работает

**EN:** The Emotion Engine uses a **Fuzzy Logic Cascade** algorithm to detect 18 emotional states from biometric signals. Each emotion has a set of fuzzy membership functions (sigmoid, inverse sigmoid, bell curve) applied to HR, HRV, stress, SpO2, temperature, PPI coherence, RMSSD, sleep score, activity score, systolic BP, and time of day. Candidates are ranked by weighted score, with temporal smoothing to prevent rapid flickering between states (30% hysteresis within 5 minutes).

**RU:** Движок Эмоций использует алгоритм **нечёткой логики каскадного типа** для детектирования 18 эмоциональных состояний по биометрическим сигналам. Каждая эмоция имеет набор функций принадлежности (сигмоид, обратный сигмоид, колоколообразная кривая), применяемых к ЧСС, ВРС, стрессу, SpO2, температуре, PPI когерентности, RMSSD, скору сна, скору активности, систолическому АД и времени суток. Кандидаты ранжируются по взвешенному скору с темпоральным сглаживанием для предотвращения быстрой смены состояний (гистерезис 30% в пределах 5 минут).

### Full Emotion List / Полный список эмоций

#### Positive / Позитивные (5)

| ID | Key | Emoji | Label EN | Описание RU |
|----|-----|-------|---------|-------------|
| 0 | calm | `calm_emoji` | Calm | Спокойствие |
| 1 | relaxed | `yoga_emoji` | Relaxed | Расслабленность |
| 2 | joyful | `happy_emoji` | Joyful | Радость |
| 3 | energized | `lightning_emoji` | Energized | Энергичность |
| 4 | excited | `celebration_emoji` | Excited | Возбуждённость |

#### Neutral / Нейтральные (4)

| ID | Key | Emoji | Label EN | Описание RU |
|----|-----|-------|---------|-------------|
| 5 | focused | `target_emoji` | Focused | Сосредоточенность |
| 6 | meditative | `om_emoji` | Meditative | Медитативность |
| 7 | recovering | `recycle_emoji` | Recovering | Восстановление |
| 8 | drowsy | `sleeping_emoji` | Drowsy | Сонливость |

#### Negative / Негативные (7)

| ID | Key | Emoji | Label EN | Описание RU |
|----|-----|-------|---------|-------------|
| 9 | stressed | `anxious_emoji` | Stressed | Стресс |
| 10 | anxious | `scream_emoji` | Anxious | Тревожность |
| 11 | angry | `angry_emoji` | Angry | Гнев |
| 12 | frustrated | `frustrated_emoji` | Frustrated | Фрустрация |
| 13 | fearful | `fearful_emoji` | Fearful | Страх |
| 14 | sad | `sad_emoji` | Sad | Грусть |
| 15 | exhausted | `exhausted_emoji` | Exhausted | Истощение |

#### Physiological / Физиологические (2)

| ID | Key | Emoji | Label EN | Описание RU |
|----|-----|-------|---------|-------------|
| 16 | pain | `injury_emoji` | Pain/Discomfort | Боль/Дискомфорт |
| 17 | flow | `wave_emoji` | Flow State | Состояние потока |

### Emotional Wellbeing Values / Значения эмоционального благополучия

Used as the 10th WVI metric:

| Emotion | Value | Emotion | Value |
|---------|-------|---------|-------|
| flow | 100 | drowsy | 50 |
| meditative | 95 | stressed | 35 |
| joyful | 90 | frustrated | 30 |
| excited | 85 | sad | 25 |
| energized | 85 | anxious | 20 |
| relaxed | 80 | angry | 18 |
| calm | 75 | pain | 15 |
| focused | 72 | fearful | 12 |
| recovering | 60 | exhausted | 10 |

---

### GET /emotions/current

**EN:** Runs emotion detection on latest biometric signals. Returns primary/secondary emotions with confidence, emoji, category, and top-5 scores.
**RU:** Запускает распознавание эмоций по последним биометрическим сигналам.

**Query Parameters (all optional, for testing):**

| Parameter | Description |
|-----------|-------------|
| hr | Heart rate (bpm) |
| hrv | HRV RMSSD (ms) |
| stress | Stress (0-100) |
| spo2 | SpO2 (%) |
| temp | Temperature (C) |
| coherence | PPI coherence (0-1) |
| rmssd | PPI RMSSD (ms) |
| sleepScore | Sleep score (0-100) |
| activityScore | Activity score (0-100) |
| sys | Systolic BP (mmHg) |
| restingHR | Resting HR (bpm) |

```bash
curl "http://localhost:8091/api/v1/emotions/current" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "primary": "focused",
    "primaryConfidence": 0.82,
    "secondary": "calm",
    "secondaryConfidence": 0.65,
    "emoji": "^_target",
    "category": "neutral",
    "label": "Focused",
    "allScores": [
      {"emotion": "focused", "score": 0.8200},
      {"emotion": "calm", "score": 0.6500},
      {"emotion": "relaxed", "score": 0.4800},
      {"emotion": "joyful", "score": 0.2200},
      {"emotion": "stressed", "score": 0.1200}
    ],
    "timestamp": "2026-04-02T12:00:00.000Z"
  }
}
```

---

### GET /emotions/history

**EN:** Returns time series of detected emotions over the period.
**RU:** Возвращает временной ряд распознанных эмоций за период.

**Parameters:** `period` = `6h` / `12h` / `24h` / `7d` / `30d` (default: `24h`)

```bash
curl "http://localhost:8091/api/v1/emotions/history?period=24h" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "24h",
    "entries": [
      {"ts": "2026-04-02T00:00:00Z", "emotion": "drowsy", "confidence": 0.78},
      {"ts": "2026-04-02T08:00:00Z", "emotion": "calm", "confidence": 0.72},
      {"ts": "2026-04-02T10:00:00Z", "emotion": "focused", "confidence": 0.85}
    ]
  }
}
```

---

### GET /emotions/wellbeing

**EN:** Returns aggregate emotional wellbeing score (0-100) based on positive-to-negative ratio, dominant emotion, and trend.
**RU:** Возвращает агрегированный скор эмоционального благополучия (0-100).

**Parameters:** `period` = `7d` / `14d` / `30d` (default: `7d`)

```bash
curl "http://localhost:8091/api/v1/emotions/wellbeing?period=7d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "score": 72,
    "trend": "improving",
    "positiveRatio": 0.65,
    "dominantEmotion": "focused",
    "period": "7d"
  }
}
```

---

### GET /emotions/distribution

**EN:** Returns percentage of time spent in each emotion over the period.
**RU:** Возвращает процент времени в каждой эмоции за период.

**Parameters:** `period` = `24h` / `7d` / `30d` (default: `7d`)

```bash
curl "http://localhost:8091/api/v1/emotions/distribution?period=7d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "distribution": {
      "calm": 0.25,
      "focused": 0.20,
      "relaxed": 0.15,
      "stressed": 0.10,
      "drowsy": 0.08,
      "joyful": 0.07,
      "recovering": 0.05,
      "energized": 0.05,
      "exhausted": 0.03,
      "sad": 0.02
    }
  }
}
```

---

### GET /emotions/heatmap

**EN:** Returns a 7-day by 24-hour grid of dominant emotions with intensity. Each cell = one hour of one day.
**RU:** Возвращает сетку 7 дней x 24 часа с доминирующими эмоциями и интенсивностью.

**Parameters:** `period` = `7d` / `14d` / `30d` (default: `7d`)

```bash
curl "http://localhost:8091/api/v1/emotions/heatmap?period=7d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "grid": [
      {
        "day": 0,
        "hours": [
          {"hour": 8, "emotion": "calm", "intensity": 0.72},
          {"hour": 12, "emotion": "focused", "intensity": 0.85},
          {"hour": 18, "emotion": "stressed", "intensity": 0.45}
        ]
      }
    ]
  }
}
```

---

### GET /emotions/transitions

**EN:** Returns emotion state change sequences with transition counts and average duration in each state.
**RU:** Возвращает последовательности смены эмоциональных состояний со счётчиком и средней длительностью.

**Parameters:** `period` = `24h` / `7d` / `30d` (default: `24h`)

```bash
curl "http://localhost:8091/api/v1/emotions/transitions?period=24h" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "24h",
    "transitions": [
      {"from": "drowsy", "to": "calm", "count": 3, "avgDuration": "45min"},
      {"from": "calm", "to": "focused", "count": 5, "avgDuration": "32min"},
      {"from": "focused", "to": "stressed", "count": 2, "avgDuration": "18min"}
    ]
  }
}
```

---

### GET /emotions/triggers

**EN:** Identifies biometric patterns that correlate with specific emotions.
**RU:** Определяет биометрические паттерны, коррелирующие с определёнными эмоциями.

```bash
curl "http://localhost:8091/api/v1/emotions/triggers" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "triggers": [
      {"emotion": "stressed", "trigger": "HRV drop below 40ms + stress above 60", "correlation": 0.82},
      {"emotion": "focused", "trigger": "HRV 45-65ms + stress 25-40 + low activity", "correlation": 0.78},
      {"emotion": "joyful", "trigger": "HRV above 55ms + activity score above 40", "correlation": 0.65}
    ]
  }
}
```

---

### GET /emotions/streaks

**EN:** Returns current and longest streaks for positive emotional states.
**RU:** Возвращает текущие и самые длинные серии позитивных эмоциональных состояний.

```bash
curl "http://localhost:8091/api/v1/emotions/streaks" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "currentStreak": {"emotion": "positive", "days": 4},
    "longestStreak": {"emotion": "positive", "days": 12, "startDate": "2026-03-10"},
    "streaks": [
      {"type": "positive", "current": 4},
      {"type": "focused", "current": 2}
    ]
  }
}
```

---

## 7. Activities / Активности (64 types)

### How Auto-Detection Works / Как работает автоопределение

**EN:** The Activity Detector uses a cascade algorithm analyzing HR, steps/min, HRV, stress, SpO2, temperature, PPI coherence, HR acceleration, HR interval pattern, breathing regularity, and time of day. It identifies one of 64 activity types across 12 categories, and calculates:
- **Load Level** (0-6): none, minimal, light, moderate, high, intense, extreme
- **HR Zone** (0-5): Sub-threshold, Recovery, Fat Burn, Aerobic, Anaerobic, VO2max
- **TRIMP** (Training Impulse): Banister formula `deltaHRratio * exp(b * deltaHRratio)` where b=1.92 (male) or 1.67 (female)
- **METs** (Metabolic Equivalent): per-activity constant
- **Calories/min**: `METs * weight_kg * 3.5 / 200`

**RU:** Детектор Активности использует каскадный алгоритм, анализирующий ЧСС, шаги/мин, ВРС, стресс, SpO2, температуру, PPI когерентность, ускорение ЧСС, паттерн интервалов ЧСС, регулярность дыхания и время суток. Он определяет один из 64 типов активности в 12 категориях и вычисляет нагрузку, зону ЧСС, TRIMP, MET и калории.

### Full Activity Type List / Полный список типов активности

#### Sleep / Сон (5)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 0 | deep_sleep | `sleeping_emoji` | 0.9 |
| 1 | light_sleep | `zzz_emoji` | 0.9 |
| 2 | rem_sleep | `moon_emoji` | 0.9 |
| 3 | nap | `sleepy_emoji` | 0.9 |
| 4 | falling_asleep | `yawn_emoji` | 0.9 |

#### Rest / Отдых (7)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 5 | resting | `couch_emoji` | 1.0 |
| 6 | sitting_relaxed | `tv_emoji` | 1.0 |
| 7 | sitting_working | `computer_emoji` | 1.3 |
| 8 | standing | `standing_emoji` | 1.5 |
| 9 | lying_awake | `bed_emoji` | 1.0 |
| 10 | phone_scrolling | `phone_emoji` | 1.0 |
| 11 | watching_screen | `movie_emoji` | 1.0 |

#### Walking / Ходьба (5)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 12 | stroll | `walking_emoji` | 2.0 |
| 13 | walk_normal | `walking_emoji` | 3.3 |
| 14 | walk_brisk | `runner_emoji` | 4.5 |
| 15 | hiking | `hiking_emoji` | 5.5 |
| 16 | nordic_walking | `mountain_emoji` | 5.0 |

#### Running / Бег (5)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 17 | jogging | `runner_emoji` | 7.0 |
| 18 | run_tempo | `runner_emoji` | 9.0 |
| 19 | run_interval | `lightning_emoji` | 10.5 |
| 20 | sprinting | `dash_emoji` | 15.0 |
| 21 | trail_running | `mountain_emoji` | 8.5 |

#### Cardio Machine / Кардио тренажёры (4)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 22 | cycling | `cyclist_emoji` | 7.5 |
| 23 | stationary_bike | `bike_emoji` | 7.0 |
| 24 | elliptical | `recycle_emoji` | 5.5 |
| 25 | rowing | `rowing_emoji` | 7.0 |

#### Strength / Силовые (5)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 26 | weight_training | `weights_emoji` | 5.0 |
| 27 | bodyweight | `muscle_emoji` | 5.5 |
| 28 | crossfit | `weights_emoji` | 10.0 |
| 29 | hiit | `lightning_emoji` | 12.0 |
| 30 | circuit_training | `recycle_emoji` | 8.0 |

#### Mind-Body / Разум-Тело (5)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 31 | yoga_vinyasa | `yoga_emoji` | 3.5 |
| 32 | yoga_hot | `fire_emoji` | 5.0 |
| 33 | pilates | `cartwheel_emoji` | 3.0 |
| 34 | stretching | `stretching_emoji` | 2.0 |
| 35 | meditation | `om_emoji` | 1.0 |

#### Sports / Спорт (7)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 36 | football | `soccer_emoji` | 8.0 |
| 37 | basketball | `basketball_emoji` | 8.0 |
| 38 | tennis | `tennis_emoji` | 7.0 |
| 39 | badminton | `badminton_emoji` | 5.5 |
| 40 | swimming | `swimming_emoji` | 7.0 |
| 41 | martial_arts | `boxing_emoji` | 8.0 |
| 42 | dancing | `dancing_emoji` | 5.5 |

#### Daily / Повседневные (6)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 43 | housework | `broom_emoji` | 3.0 |
| 44 | cooking | `cook_emoji` | 2.5 |
| 45 | driving | `car_emoji` | 1.5 |
| 46 | commuting | `bus_emoji` | 1.3 |
| 47 | shopping | `shopping_emoji` | 2.5 |
| 48 | eating | `dining_emoji` | 1.5 |

#### Physiological / Физиологические (7)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 49 | stress_event | `anxious_emoji` | 1.2 |
| 50 | panic_attack | `scream_emoji` | 1.5 |
| 51 | crying | `crying_emoji` | 1.2 |
| 52 | laughing | `laughing_emoji` | 1.5 |
| 53 | pain_episode | `injury_emoji` | 1.0 |
| 54 | illness | `sick_emoji` | 1.0 |
| 55 | intimacy | `heart_fire_emoji` | 2.5 |

#### Recovery / Восстановление (4)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 56 | warm_up | `runner_emoji` | 3.0 |
| 57 | cool_down | `ice_emoji` | 2.5 |
| 58 | active_recovery | `walking_emoji` | 2.0 |
| 59 | passive_recovery | `calm_emoji` | 1.0 |

#### Mental / Умственные (4)

| ID | Key | Emoji | METs |
|----|-----|-------|------|
| 60 | deep_work | `brain_emoji` | 1.5 |
| 61 | presentation | `microphone_emoji` | 1.8 |
| 62 | exam | `memo_emoji` | 1.3 |
| 63 | creative_flow | `art_emoji` | 1.3 |

### Load Levels / Уровни нагрузки

| Level | Name | Description EN | Описание RU |
|-------|------|---------------|-------------|
| 0 | none | Sleep/rest, no load | Сон/отдых, без нагрузки |
| 1 | minimal | Very light activity | Очень лёгкая активность |
| 2 | light | Light walking, stretching | Лёгкая ходьба, растяжка |
| 3 | moderate | Brisk walking, yoga | Быстрая ходьба, йога |
| 4 | high | Running, sports | Бег, спорт |
| 5 | intense | Tempo run, weight training | Темповый бег, силовые |
| 6 | extreme | HIIT, sprinting | HIIT, спринт |

### HR Zones / Зоны ЧСС

| Zone | Name | % of Max HR | Description EN | Описание RU |
|------|------|------------|---------------|-------------|
| 0 | Sub-threshold | <50% | Below training threshold | Ниже тренировочного порога |
| 1 | Recovery | 50-60% | Recovery zone | Зона восстановления |
| 2 | Fat Burn | 60-70% | Fat burning zone | Зона сжигания жира |
| 3 | Aerobic | 70-80% | Aerobic endurance | Аэробная выносливость |
| 4 | Anaerobic | 80-90% | Anaerobic threshold | Анаэробный порог |
| 5 | VO2max | 90-100% | Maximum effort | Максимальное усилие |

---

### GET /activities/current

**EN:** Runs activity detection on latest biometric signals. Returns detected activity, load, HR zone, METs, calories.
**RU:** Запускает детекцию активности по последним сигналам. Возвращает активность, нагрузку, зону ЧСС, MET, калории.

**Query Parameters (all optional, for testing):**

| Parameter | Description |
|-----------|-------------|
| hr | Heart rate (bpm) |
| restingHR | Resting heart rate (bpm) |
| maxHR | Max heart rate (bpm) |
| hrv | HRV RMSSD (ms) |
| stress | Stress (0-100) |
| spo2 | SpO2 (%) |
| temp | Temperature (C) |
| coherence | PPI coherence (0-1) |
| stepsPerMin | Steps per minute |
| stepCadence | Step cadence regularity (0-1) |
| weight | Body weight in kg |
| gender | male / female |

```bash
curl "http://localhost:8091/api/v1/activities/current" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "type": "sitting_working",
    "category": "rest",
    "emoji": "^_computer",
    "confidence": 0.88,
    "loadLevel": 0,
    "loadLevelName": "none",
    "loadScore": 2.1,
    "loadTarget": "mental",
    "heartRateZone": 0,
    "heartRateZoneName": "Sub-threshold",
    "mets": 1.3,
    "caloriesPerMinute": 1.71,
    "isEmergency": false,
    "alertMessage": null,
    "timestamp": "2026-04-02T12:00:00.000Z"
  }
}
```

---

### GET /activities/history

**EN:** Returns activity timeline with start/end times, type, and calories.
**RU:** Возвращает таймлайн активностей со временем начала/конца, типом и калориями.

**Parameters:** `period` = `24h` / `7d` / `30d` (default: `24h`)

```bash
curl "http://localhost:8091/api/v1/activities/history?period=24h" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "24h",
    "activities": [
      {"type": "deep_sleep", "start": "2026-04-01T23:30:00Z", "end": "2026-04-02T01:15:00Z", "steps": 0, "calories": 0},
      {"type": "light_sleep", "start": "2026-04-02T01:15:00Z", "end": "2026-04-02T03:00:00Z", "steps": 0, "calories": 0},
      {"type": "walk_normal", "start": "2026-04-02T08:30:00Z", "end": "2026-04-02T08:50:00Z", "steps": 2100, "calories": 85},
      {"type": "sitting_working", "start": "2026-04-02T09:00:00Z", "end": null, "steps": 120, "calories": 45}
    ]
  }
}
```

---

### GET /activities/load

**EN:** Returns TRIMP-based training load: acute (7d), chronic (28d), and acute-to-chronic ratio. Ratio 0.8-1.3 is optimal.
**RU:** Возвращает TRIMP-нагрузку: острую (7д), хроническую (28д) и соотношение острая/хроническая. Соотношение 0.8-1.3 оптимальное.

```bash
curl "http://localhost:8091/api/v1/activities/load" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "trimp": 45.2,
    "acuteLoad": 320,
    "chronicLoad": 280,
    "ratio": 1.14,
    "status": "optimal",
    "zone": "productive"
  }
}
```

Status values: `undertrained`, `optimal`, `overreaching`, `danger`

---

### GET /activities/zones

**EN:** Returns time spent in each of the 5 HR training zones today.
**RU:** Возвращает время в каждой из 5 зон ЧСС сегодня.

```bash
curl "http://localhost:8091/api/v1/activities/zones" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "zones": [
      {"zone": 1, "name": "Recovery", "min": 50, "max": 60, "pctHrMax": "50-60%", "minutesToday": 15},
      {"zone": 2, "name": "Fat Burn", "min": 60, "max": 70, "pctHrMax": "60-70%", "minutesToday": 22},
      {"zone": 3, "name": "Aerobic", "min": 70, "max": 80, "pctHrMax": "70-80%", "minutesToday": 12},
      {"zone": 4, "name": "Anaerobic", "min": 80, "max": 90, "pctHrMax": "80-90%", "minutesToday": 5},
      {"zone": 5, "name": "VO2max", "min": 90, "max": 100, "pctHrMax": "90-100%", "minutesToday": 0}
    ]
  }
}
```

---

### GET /activities/categories

**EN:** Returns time spent in each activity intensity category.
**RU:** Возвращает время в каждой категории интенсивности активности.

```bash
curl "http://localhost:8091/api/v1/activities/categories" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "categories": [
      {"name": "sedentary", "types": ["resting", "sitting_working", "sitting_relaxed"], "totalMinutes": 360},
      {"name": "light", "types": ["stroll", "stretching", "housework"], "totalMinutes": 45},
      {"name": "moderate", "types": ["walk_brisk", "yoga_vinyasa"], "totalMinutes": 30},
      {"name": "vigorous", "types": ["jogging"], "totalMinutes": 20}
    ]
  }
}
```

---

### GET /activities/transitions

**EN:** Returns activity state change sequence.
**RU:** Возвращает последовательность смены активностей.

**Parameters:** `period` = `24h` / `7d` (default: `24h`)

```bash
curl "http://localhost:8091/api/v1/activities/transitions?period=24h" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "transitions": [
      {"from": "deep_sleep", "to": "light_sleep", "at": "2026-04-02T01:15:00Z"},
      {"from": "light_sleep", "to": "resting", "at": "2026-04-02T06:55:00Z"},
      {"from": "resting", "to": "walk_normal", "at": "2026-04-02T08:30:00Z"}
    ]
  }
}
```

---

### GET /activities/sedentary

**EN:** Returns sedentary behavior analysis: total minutes, longest bout, breaks taken, recommendation.
**RU:** Возвращает анализ сидячего поведения: общее время, самый длинный период, перерывы, рекомендацию.

```bash
curl "http://localhost:8091/api/v1/activities/sedentary" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalMinutes": 360,
    "longestBout": 95,
    "bouts": 5,
    "breaksTaken": 4,
    "recommendation": "Try to take a 5-minute walk every 50 minutes to reduce sedentary time."
  }
}
```

---

### GET /activities/exercise-log

**EN:** Returns completed exercise sessions with type, duration, calories, and HR data.
**RU:** Возвращает завершённые тренировки с типом, длительностью, калориями и данными ЧСС.

**Parameters:** `from`, `to` (ISO 8601 dates)

```bash
curl "http://localhost:8091/api/v1/activities/exercise-log?from=2026-04-01T00:00:00Z&to=2026-04-02T00:00:00Z" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "id": "ex_001",
        "type": "jogging",
        "duration": 35,
        "calories": 320,
        "hr": {"avg": 142, "max": 165},
        "date": "2026-04-01"
      }
    ]
  }
}
```

---

### GET /activities/recovery-status

**EN:** Returns recovery status based on resting HR recovery, HRV trends, and training load. Includes readiness and recommendation.
**RU:** Возвращает статус восстановления на основе восстановления ЧСС в покое, трендов ВРС и тренировочной нагрузки.

```bash
curl "http://localhost:8091/api/v1/activities/recovery-status" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "recovered",
    "score": 82,
    "readiness": "high",
    "hrRecovery": {"resting": 62, "current": 65, "delta": 3},
    "recommendation": "You are well recovered. Good day for a hard training session."
  }
}
```

Status values: `recovered`, `recovering`, `fatigued`, `overtrained`

---

### POST /activities/manual-log

**EN:** Manually records an exercise session that was not auto-detected.
**RU:** Вручную записывает тренировку, которая не была автоматически определена.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Activity type |
| duration | integer | Yes | Duration in minutes |
| calories | number | No | Calories burned |
| notes | string | No | Notes |

```bash
curl -X POST http://localhost:8091/api/v1/activities/manual-log \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "yoga_vinyasa", "duration": 45, "notes": "Morning session"}'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "ex_manual_001",
    "type": "yoga_vinyasa",
    "duration": 45,
    "logged": true,
    "loggedAt": "2026-04-02T12:00:00Z"
  }
}
```

---

## 8. Sleep / Сон

### GET /sleep/last-night

**EN:** Returns comprehensive summary of the most recent sleep session: score, duration, efficiency, phases, latency, wakeups.
**RU:** Возвращает полное резюме последнего сна: скор, длительность, эффективность, фазы, задержка засыпания, пробуждения.

```bash
curl "http://localhost:8091/api/v1/sleep/last-night" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "score": 82,
    "totalMinutes": 462,
    "efficiency": 0.92,
    "phases": {"deep": 95, "light": 248, "rem": 102, "awake": 17},
    "start": "2026-04-01T23:15:00Z",
    "end": "2026-04-02T06:57:00Z",
    "latency": 12,
    "wakeups": 2
  }
}
```

---

### GET /sleep/score-history

**EN:** Returns daily sleep scores over the period.
**RU:** Возвращает ежедневные скоры сна за период.

**Parameters:** `period` = `7d` / `14d` / `30d` / `90d` (default: `14d`)

```bash
curl "http://localhost:8091/api/v1/sleep/score-history?period=7d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "scores": [
      {"date": "2026-03-27", "score": 78},
      {"date": "2026-03-28", "score": 85},
      {"date": "2026-03-29", "score": 72},
      {"date": "2026-03-30", "score": 88},
      {"date": "2026-03-31", "score": 65},
      {"date": "2026-04-01", "score": 82},
      {"date": "2026-04-02", "score": 80}
    ]
  }
}
```

---

### GET /sleep/architecture

**EN:** Returns detailed sleep cycle analysis: number of cycles, stage timeline, percentage breakdown.
**RU:** Возвращает подробный анализ циклов сна: количество циклов, таймлайн стадий, процентное соотношение.

```bash
curl "http://localhost:8091/api/v1/sleep/architecture" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "cycles": 5,
    "stages": [
      {"stage": "light", "start": "23:15", "end": "23:45", "duration": 30},
      {"stage": "deep", "start": "23:45", "end": "00:30", "duration": 45},
      {"stage": "rem", "start": "00:30", "end": "00:50", "duration": 20}
    ],
    "deepPct": 20.5,
    "remPct": 22.1,
    "lightPct": 53.7,
    "awakePct": 3.7
  }
}
```

---

### GET /sleep/consistency

**EN:** Returns sleep schedule consistency: avg bedtime/wake time, std deviations, social jet lag, consistency score.
**RU:** Возвращает постоянство графика сна: ср. время отбоя/пробуждения, ст. отклонения, социальный джет-лаг, скор постоянства.

```bash
curl "http://localhost:8091/api/v1/sleep/consistency" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "avgBedtime": "23:20",
    "avgWakeTime": "07:05",
    "stdDevBedtime": "22min",
    "stdDevWakeTime": "18min",
    "socialJetLag": "45min",
    "consistency": "good",
    "score": 78
  }
}
```

Consistency values: `excellent`, `good`, `fair`, `poor`

---

### GET /sleep/debt

**EN:** Returns accumulated sleep debt over the period.
**RU:** Возвращает накопленный долг сна за период.

**Parameters:** `period` = `7d` / `14d` / `30d` (default: `7d`)

```bash
curl "http://localhost:8091/api/v1/sleep/debt?period=7d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accumulatedDebt": 90,
    "unit": "minutes",
    "period": "7d",
    "dailyTarget": 480,
    "dailyAvg": 467,
    "recommendation": "You have a 1.5 hour sleep debt this week. Try going to bed 15 minutes earlier."
  }
}
```

---

### GET /sleep/phases

**EN:** Returns detailed sleep phase timeline with start/end, durations, cycle count, average cycle duration.
**RU:** Возвращает подробный таймлайн фаз сна с началом/концом, длительностями, счётчиком циклов.

```bash
curl "http://localhost:8091/api/v1/sleep/phases" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "date": "2026-04-02",
    "phases": [
      {"phase": "light", "start": "23:15", "end": "23:45", "durationMin": 30},
      {"phase": "deep", "start": "23:45", "end": "00:30", "durationMin": 45},
      {"phase": "rem", "start": "00:30", "end": "00:50", "durationMin": 20},
      {"phase": "light", "start": "00:50", "end": "01:25", "durationMin": 35}
    ],
    "totalCycles": 5,
    "avgCycleDuration": 90
  }
}
```

---

### GET /sleep/optimal-window

**EN:** Returns recommended bedtime/wake time based on circadian HRV pattern. Includes chronotype and estimated melatonin onset.
**RU:** Возвращает рекомендованное время отбоя/пробуждения на основе циркадного ВРС паттерна. Включает хронотип и оценку начала мелатонина.

```bash
curl "http://localhost:8091/api/v1/sleep/optimal-window" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recommendedBedtime": "23:00",
    "recommendedWakeTime": "07:00",
    "chronotype": "intermediate",
    "melatoninOnsetEstimate": "22:30",
    "reason": "Based on your HRV circadian pattern, your body starts winding down around 22:30."
  }
}
```

Chronotype values: `early`, `intermediate`, `late`

---

## 9. AI / Искусственный интеллект

### Genius Layer / Слой Гения

**EN:** The Genius Layer provides analysis from 8 expert AI perspectives:
1. **Doctor** -- clinical health assessment
2. **Psychologist** -- emotional and mental health
3. **Neuroscientist** -- brain function and HRV patterns
4. **Biohacker** -- optimization strategies
5. **Coach** -- fitness and training readiness
6. **Nutritionist** -- dietary recommendations
7. **Sleep Expert** -- sleep quality and circadian analysis
8. **Data Scientist** -- statistical patterns and anomalies

**RU:** Слой Гения предоставляет анализ с 8 экспертных AI-перспектив: врач, психолог, нейроучёный, биохакер, тренер, диетолог, эксперт по сну, дата-сайентист.

---

### GET /ai/interpret

**EN:** Returns natural-language interpretation of current health data from all 8 expert perspectives.
**RU:** Возвращает интерпретацию текущего здоровья на естественном языке от 8 экспертных перспектив.

```bash
curl "http://localhost:8091/api/v1/ai/interpret" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "wviScore": 78.5,
    "interpretation": "Your overall wellness is in good range. HRV is strong, indicating good recovery. Stress levels are manageable.",
    "perspectives": {
      "doctor": "Vitals are within normal ranges. Blood pressure is optimal. No clinical concerns.",
      "psychologist": "Emotional state is focused and positive. Good emotional resilience today.",
      "neuroscientist": "HRV pattern indicates balanced autonomic function. Parasympathetic tone is healthy.",
      "biohacker": "Consider cold exposure in the morning to further boost HRV. Your coherence score could improve.",
      "coach": "Recovery status is good. You can handle a moderate-to-hard training session today.",
      "nutritionist": "With your current activity level, aim for 2200 kcal intake with emphasis on protein.",
      "sleepExpert": "Sleep architecture was good last night. Deep sleep at 20% is optimal.",
      "dataScientist": "Your WVI has been trending upward +0.35 pts/day over the last 30 days."
    }
  }
}
```

---

### GET /ai/recommendations

**EN:** Returns prioritized actionable recommendations with expected WVI impact.
**RU:** Возвращает приоритетные действенные рекомендации с ожидаемым воздействием на WVI.

```bash
curl "http://localhost:8091/api/v1/ai/recommendations" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {"priority": 1, "category": "activity", "text": "Take a 20-minute walk to reach your step goal", "impact": "+3.2 WVI points"},
      {"priority": 2, "category": "stress", "text": "Practice 5 minutes of deep breathing", "impact": "+2.1 WVI points"},
      {"priority": 3, "category": "sleep", "text": "Go to bed by 23:00 tonight", "impact": "+1.8 WVI points"}
    ]
  }
}
```

---

### POST /ai/chat

**EN:** Send a natural-language question about your health and receive an AI response with biometric context.
**RU:** Отправьте вопрос на естественном языке о вашем здоровье и получите AI-ответ с биометрическим контекстом.

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| message | string | Yes |

```bash
curl -X POST http://localhost:8091/api/v1/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "How can I improve my WVI score?"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "response": "Your WVI is 78.5 (Good). The biggest improvement opportunities are: 1) Increase daily steps from 8420 to 10000 (+3 pts), 2) Reduce evening stress through meditation (+2 pts), 3) Maintain consistent sleep schedule (+2 pts).",
    "context": {
      "wviScore": 78.5,
      "emotion": "focused",
      "activity": "sitting_working"
    }
  }
}
```

---

### GET /ai/explain-metric

**EN:** Returns an AI explanation of a specific biometric metric, its value, meaning, and population comparison.
**RU:** Возвращает AI-объяснение конкретной биометрической метрики, её значения и сравнение с популяцией.

**Parameters (required):** `metric` = `hr` / `hrv` / `stress` / `spo2` / `temperature` / `sleep` / `activity` / `bloodPressure` / `ppiCoherence`

```bash
curl "http://localhost:8091/api/v1/ai/explain-metric?metric=hrv" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "metric": "hrv",
    "value": 68.4,
    "unit": "ms",
    "explanation": "Your HRV (RMSSD) of 68.4ms is above average for your age group. This indicates good parasympathetic nervous system activity and recovery capacity.",
    "percentile": 72,
    "population": "Males age 30-35"
  }
}
```

---

### POST /ai/explain-metric

**EN:** Provides a detailed AI explanation of why a metric is at a given value, with personal comparisons, percentile, recommendations, and references.
**RU:** Предоставляет подробное AI-объяснение почему метрика находится на данном значении, с личными сравнениями, процентилем, рекомендациями и ссылками.

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| metric | string | Yes |
| value | number | No |

```bash
curl -X POST http://localhost:8091/api/v1/ai/explain-metric \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"metric": "hrv", "value": 48}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "metric": "hrv",
    "value": 48,
    "explanation": "An HRV of 48ms is below your personal average of 68ms. This may indicate incomplete recovery, elevated stress, or poor sleep quality.",
    "comparisons": {
      "personalAvg": 68.4,
      "populationAvg": 55.0,
      "personalBest": 95.2,
      "personalWorst": 28.1,
      "percentile": 38
    },
    "recommendations": [
      "Prioritize rest and recovery today",
      "Practice deep breathing or meditation",
      "Ensure 7-8 hours of sleep tonight"
    ],
    "references": [
      "Shaffer & Ginsberg (2017). An Overview of Heart Rate Variability Metrics and Norms.",
      "Plews et al. (2013). Training Adaptation and Heart Rate Variability in Elite Endurance Athletes."
    ]
  }
}
```

---

### POST /ai/action-plan

**EN:** Creates a personalized daily action plan with timed activities to reach a WVI goal.
**RU:** Создаёт персонализированный план действий с привязкой ко времени для достижения цели WVI.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| goal | string | Target (e.g. "Reach WVI 85+") |
| timeframe | string | Timeframe (e.g. "7 days") |

```bash
curl -X POST http://localhost:8091/api/v1/ai/action-plan \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"goal": "Reach WVI 85+", "timeframe": "7 days"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "plan": {
      "goal": "Reach WVI 85+",
      "actions": [
        {"time": "07:00", "action": "Morning walk 20 minutes", "metric": "activity", "expectedImpact": "+2.5 pts"},
        {"time": "10:00", "action": "Deep breathing exercise 5 minutes", "metric": "stress", "expectedImpact": "+1.5 pts"},
        {"time": "12:30", "action": "Brisk walk after lunch 15 minutes", "metric": "activity", "expectedImpact": "+1.8 pts"},
        {"time": "22:30", "action": "Begin wind-down routine", "metric": "sleep", "expectedImpact": "+2.0 pts"}
      ],
      "estimatedDays": 5
    }
  }
}
```

---

### GET /ai/insights

**EN:** Returns AI-discovered patterns, anomaly alerts, streak notifications. Each insight has a confidence score.
**RU:** Возвращает AI-обнаруженные паттерны, алерты об аномалиях, уведомления о сериях. Каждый инсайт имеет скор уверенности.

```bash
curl "http://localhost:8091/api/v1/ai/insights" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "insights": [
      {"type": "pattern", "text": "Your HRV consistently peaks between 09:00-10:00. This is your optimal focus window.", "confidence": 0.88},
      {"type": "correlation", "text": "Days with 8000+ steps correlate with +5 WVI points the next morning.", "confidence": 0.82},
      {"type": "streak", "text": "You have maintained positive emotions for 4 consecutive days.", "confidence": 0.95}
    ]
  }
}
```

---

### GET /ai/genius-layer

**EN:** Returns synthesized analysis from all 8 expert AI perspectives with consensus summary and confidence.
**RU:** Возвращает синтезированный анализ от всех 8 экспертных AI-перспектив с консенсусным резюме и уверенностью.

```bash
curl "http://localhost:8091/api/v1/ai/genius-layer" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "layer": "genius",
    "perspectives": [
      "Doctor: All vitals within normal ranges, no clinical concerns.",
      "Psychologist: Emotional balance is positive, resilience is high.",
      "Neuroscientist: Autonomic function is well-balanced.",
      "Biohacker: Consider morning cold exposure to push HRV higher.",
      "Coach: Ready for moderate-to-hard training.",
      "Nutritionist: Protein intake should be prioritized post-workout.",
      "Sleep Expert: Sleep architecture is excellent.",
      "Data Scientist: Upward WVI trend of +0.35/day confirmed with p<0.01."
    ],
    "synthesis": "Consensus: You are in good overall health with strong recovery indicators. Focus on maintaining activity levels and sleep consistency for continued improvement.",
    "confidenceScore": 0.87
  }
}
```

---

## 10. Reports / Отчёты

### POST /reports/generate

**EN:** Queues generation of a wellness report. Returns a report ID for checking status and downloading.
**RU:** Ставит в очередь генерацию отчёта о здоровье. Возвращает ID отчёта для проверки статуса и скачивания.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| templateId | string | Template ID (e.g. "tpl_daily") |
| format | string | `pdf` / `html` / `slides` (default: `pdf`) |
| period | string | Date range (e.g. "2026-04-01/2026-04-02") |

```bash
curl -X POST http://localhost:8091/api/v1/reports/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"templateId": "tpl_daily", "format": "pdf", "period": "2026-04-01/2026-04-02"}'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "reportId": "rpt_abc123",
    "format": "pdf",
    "status": "generating",
    "estimatedTime": "30 seconds",
    "createdAt": "2026-04-02T12:00:00Z"
  }
}
```

---

### GET /reports/list

**EN:** Returns list of all generated reports.
**RU:** Возвращает список всех сгенерированных отчётов.

```bash
curl "http://localhost:8091/api/v1/reports/list" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reports": [
      {"id": "rpt_abc123", "title": "Daily Report", "format": "pdf", "date": "2026-04-02", "status": "ready"},
      {"id": "rpt_def456", "title": "Weekly Summary", "format": "html", "date": "2026-03-31", "status": "ready"}
    ]
  }
}
```

---

### GET /reports/templates

**EN:** Returns available report templates.
**RU:** Возвращает доступные шаблоны отчётов.

```bash
curl "http://localhost:8091/api/v1/reports/templates" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "templates": [
      {"id": "tpl_daily", "name": "Daily Report", "format": "pdf"},
      {"id": "tpl_weekly", "name": "Weekly Summary", "format": "pdf"},
      {"id": "tpl_monthly", "name": "Monthly Analysis", "format": "pdf"}
    ]
  }
}
```

---

### GET /reports/{id}

**EN:** Returns metadata and download URL for a specific report.
**RU:** Возвращает метаданные и ссылку для скачивания конкретного отчёта.

```bash
curl "http://localhost:8091/api/v1/reports/rpt_abc123" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "rpt_abc123",
    "title": "Daily Report",
    "format": "pdf",
    "date": "2026-04-02",
    "status": "ready",
    "downloadUrl": "/reports/rpt_abc123/download",
    "pages": 5,
    "generatedAt": "2026-04-02T12:00:30Z"
  }
}
```

---

### DELETE /reports/{id}

**EN:** Permanently deletes a generated report.
**RU:** Безвозвратно удаляет сгенерированный отчёт.

```bash
curl -X DELETE "http://localhost:8091/api/v1/reports/rpt_abc123" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": { "id": "rpt_abc123", "deleted": true }
}
```

---

### GET /reports/{id}/download

**EN:** Returns a time-limited download URL for the report file.
**RU:** Возвращает временную ссылку для скачивания файла отчёта.

```bash
curl "http://localhost:8091/api/v1/reports/rpt_abc123/download" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "rpt_abc123",
    "downloadUrl": "https://storage.wvi.health/reports/rpt_abc123.pdf?token=...",
    "expiresAt": "2026-04-02T13:00:00Z",
    "format": "pdf",
    "sizeBytes": 245760
  }
}
```

---

## 11. Alerts / Алерты

### GET /alerts/list

**EN:** Returns all alerts (acknowledged and unacknowledged) with severity, metric, value, and threshold.
**RU:** Возвращает все алерты (подтверждённые и неподтверждённые) с уровнем, метрикой, значением и порогом.

```bash
curl "http://localhost:8091/api/v1/alerts/list" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alt_001",
        "level": "warning",
        "metric": "stress",
        "message": "Stress level exceeded warning threshold",
        "value": 75,
        "threshold": 70,
        "at": "2026-04-02T10:30:00Z",
        "acknowledged": false,
        "acknowledgedAt": null
      }
    ]
  }
}
```

Alert level values: `info`, `notice`, `warning`, `critical`

---

### GET /alerts/active

**EN:** Returns only unacknowledged alerts requiring user attention.
**RU:** Возвращает только неподтверждённые алерты, требующие внимания.

```bash
curl "http://localhost:8091/api/v1/alerts/active" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "count": 1,
    "alerts": [
      {"id": "alt_001", "level": "warning", "metric": "stress", "message": "Stress level exceeded warning threshold", "value": 75, "threshold": 70, "at": "2026-04-02T10:30:00Z", "acknowledged": false}
    ]
  }
}
```

---

### GET /alerts/settings

**EN:** Returns alert threshold configuration and notification channel settings.
**RU:** Возвращает конфигурацию порогов алертов и настройки каналов уведомлений.

```bash
curl "http://localhost:8091/api/v1/alerts/settings" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "thresholds": {
      "hr": {"critical": {"min": 40, "max": 180}, "warning": {"min": 50, "max": 150}},
      "spo2": {"critical": {"min": 90}, "warning": {"min": 94}},
      "stress": {"warning": {"max": 70}, "critical": {"max": 85}}
    },
    "channels": ["push", "email"]
  }
}
```

---

### PUT /alerts/settings

**EN:** Updates alert thresholds and notification channels. Only provided fields are updated.
**RU:** Обновляет пороги алертов и каналы уведомлений. Обновляются только переданные поля.

```bash
curl -X PUT http://localhost:8091/api/v1/alerts/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"thresholds": {"stress": {"warning": {"max": 65}}}, "channels": ["push", "email", "sms"]}'
```

**Response (200):**

```json
{
  "success": true,
  "data": { "updated": true, "updatedAt": "2026-04-02T12:00:00Z" }
}
```

---

### GET /alerts/history

**EN:** Returns historical alerts over the specified period.
**RU:** Возвращает историю алертов за указанный период.

**Parameters:** `period` = `24h` / `7d` / `30d` / `90d` (default: `7d`)

```bash
curl "http://localhost:8091/api/v1/alerts/history?period=7d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "total": 5,
    "alerts": [
      {"id": "alt_001", "level": "warning", "metric": "stress", "message": "Stress exceeded warning", "value": 75, "threshold": 70, "at": "2026-04-02T10:30:00Z", "acknowledged": true, "acknowledgedAt": "2026-04-02T10:35:00Z"}
    ]
  }
}
```

---

### POST /alerts/{id}/acknowledge

**EN:** Marks an alert as acknowledged. Removes from active list.
**RU:** Отмечает алерт как подтверждённый. Удаляет из списка активных.

```bash
curl -X POST "http://localhost:8091/api/v1/alerts/alt_001/acknowledge" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": { "id": "alt_001", "acknowledged": true, "acknowledgedAt": "2026-04-02T12:00:00Z" }
}
```

---

### GET /alerts/stats

**EN:** Returns aggregate alert statistics by severity and metric. Includes average response time.
**RU:** Возвращает агрегированную статистику алертов по уровню и метрике. Включает среднее время ответа.

**Parameters:** `period` = `7d` / `30d` / `90d` (default: `30d`)

```bash
curl "http://localhost:8091/api/v1/alerts/stats?period=30d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "total": 23,
    "byLevel": {"info": 8, "notice": 6, "warning": 7, "critical": 2},
    "byMetric": {"stress": 10, "hr": 6, "spo2": 4, "temperature": 3},
    "avgResponseTime": "4min 32sec"
  }
}
```

---

## 12. Device / Устройство

### GET /device/status

**EN:** Returns wearable device status: model, firmware, battery, connection state, signal strength, uptime.
**RU:** Возвращает статус носимого устройства: модель, прошивка, батарея, состояние подключения, сила сигнала, аптайм.

```bash
curl "http://localhost:8091/api/v1/device/status" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "deviceId": "polar_verity_001",
    "model": "Polar Verity Sense",
    "firmware": "2.1.8",
    "battery": 82,
    "connected": true,
    "lastSync": "2026-04-02T11:55:00Z",
    "signal": "strong",
    "uptime": "3d 14h 22m"
  }
}
```

Signal values: `strong`, `good`, `weak`, `disconnected`

---

### GET /device/auto-monitoring

**EN:** Returns auto-monitoring configuration: sampling interval, tracked metrics, night mode.
**RU:** Возвращает конфигурацию автомониторинга: интервал выборки, отслеживаемые метрики, ночной режим.

```bash
curl "http://localhost:8091/api/v1/device/auto-monitoring" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "interval": 60,
    "metrics": ["heart_rate", "hrv", "spo2", "temperature", "activity"],
    "nightMode": true,
    "nightInterval": 300
  }
}
```

---

### PUT /device/auto-monitoring

**EN:** Updates auto-monitoring settings. Changes take effect on next device sync.
**RU:** Обновляет настройки автомониторинга. Изменения вступают в силу при следующей синхронизации.

```bash
curl -X PUT http://localhost:8091/api/v1/device/auto-monitoring \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"interval": 30, "nightMode": true, "nightInterval": 120}'
```

**Response (200):**

```json
{
  "success": true,
  "data": { "updated": true, "updatedAt": "2026-04-02T12:00:00Z" }
}
```

---

### POST /device/sync

**EN:** Initiates data sync with the connected wearable. Returns sync ID for tracking.
**RU:** Инициирует синхронизацию данных с подключённым устройством. Возвращает ID синхронизации.

```bash
curl -X POST "http://localhost:8091/api/v1/device/sync" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "syncId": "sync_xyz789",
    "status": "started",
    "estimatedRecords": 1200
  }
}
```

---

### GET /device/capabilities

**EN:** Returns device hardware sensors, supported metrics, sample rates, and features.
**RU:** Возвращает аппаратные датчики устройства, поддерживаемые метрики, частоты дискретизации и функции.

```bash
curl "http://localhost:8091/api/v1/device/capabilities" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sensors": ["PPG", "accelerometer", "gyroscope", "thermometer"],
    "metrics": ["heart_rate", "hrv", "spo2", "temperature", "activity", "ppi", "ecg"],
    "sampleRates": {"PPG": 135, "accelerometer": 52, "ecg": 125},
    "features": ["auto_monitoring", "ecg_recording", "swim_proof"]
  }
}
```

---

### POST /device/measure

**EN:** Triggers an on-demand measurement (ECG, SpO2, BP, or temperature). Returns a measurement ID.
**RU:** Запускает измерение по требованию (ЭКГ, SpO2, АД или температура). Возвращает ID измерения.

**Request Body:**

| Field | Type | Required | Values |
|-------|------|----------|--------|
| type | string | Yes | `ecg`, `spo2`, `blood_pressure`, `temperature` |

```bash
curl -X POST http://localhost:8091/api/v1/device/measure \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "ecg"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "measurementId": "msr_001",
    "type": "ecg",
    "status": "started",
    "estimatedDuration": "30 seconds",
    "startedAt": "2026-04-02T12:00:00Z"
  }
}
```

---

### GET /device/firmware

**EN:** Returns current firmware version, latest available version, update availability, and release notes.
**RU:** Возвращает текущую версию прошивки, последнюю доступную версию, наличие обновления и заметки к релизу.

```bash
curl "http://localhost:8091/api/v1/device/firmware" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "currentVersion": "2.1.8",
    "latestVersion": "2.2.0",
    "updateAvailable": true,
    "releaseNotes": "Improved PPG accuracy, new ECG algorithm, battery optimization.",
    "updateUrl": "https://firmware.polar.com/verity-sense/2.2.0"
  }
}
```

---

## 13. Training / Тренировки

### GET /training/recommendation

**EN:** Returns personalized training recommendation based on recovery, acute/chronic load ratio, and readiness.
**RU:** Возвращает персонализированную рекомендацию по тренировке на основе восстановления, соотношения острая/хроническая нагрузка и готовности.

```bash
curl "http://localhost:8091/api/v1/training/recommendation" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "type": "moderate_training",
    "intensity": "moderate",
    "duration": 45,
    "unit": "minutes",
    "reason": "Good recovery status (82/100) and balanced acute-to-chronic ratio (1.14). Safe for moderate training.",
    "suggestedActivities": ["jogging", "cycling", "yoga_vinyasa", "swimming"],
    "targetHRZone": 3,
    "readinessScore": 82
  }
}
```

Type values: `rest`, `light_activity`, `moderate_cardio`, `moderate_training`, `hard_training`, `competition_ready`

---

### GET /training/weekly-plan

**EN:** Returns a 7-day training plan with types, durations, and total/target load.
**RU:** Возвращает 7-дневный план тренировок с типами, длительностями и общей/целевой нагрузкой.

```bash
curl "http://localhost:8091/api/v1/training/weekly-plan" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "week": "2026-03-31/2026-04-06",
    "plan": [
      {"day": "Monday", "type": "jogging", "duration": 40},
      {"day": "Tuesday", "type": "yoga_vinyasa", "duration": 30},
      {"day": "Wednesday", "type": "weight_training", "duration": 50},
      {"day": "Thursday", "type": "active_recovery", "duration": 20},
      {"day": "Friday", "type": "cycling", "duration": 45},
      {"day": "Saturday", "type": "hiking", "duration": 90},
      {"day": "Sunday", "type": "rest", "duration": 0}
    ],
    "totalLoad": 380,
    "targetLoad": 400
  }
}
```

---

### GET /training/overtraining-risk

**EN:** Evaluates overtraining risk based on load ratio, HRV/HR trends, sleep, and fatigue. Returns risk score (0-100).
**RU:** Оценивает риск перетренированности на основе соотношения нагрузки, трендов ВРС/ЧСС, сна и усталости. Возвращает скор риска (0-100).

```bash
curl "http://localhost:8091/api/v1/training/overtraining-risk" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "risk": "low",
    "score": 22,
    "factors": {
      "acuteChronicRatio": 1.14,
      "hrvTrend": "stable",
      "restingHrTrend": "stable",
      "sleepQuality": 82,
      "subjectiveFatigue": null
    },
    "recommendation": "Low overtraining risk. You can maintain or slightly increase training volume."
  }
}
```

Risk values: `low`, `moderate`, `high`, `critical`

---

### GET /training/optimal-time

**EN:** Returns optimal training time window based on HRV circadian pattern, with alternative and avoid windows.
**RU:** Возвращает оптимальное время для тренировки на основе циркадного ВРС паттерна, с альтернативным и избегаемым окнами.

```bash
curl "http://localhost:8091/api/v1/training/optimal-time" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "optimalWindow": {"start": "09:00", "end": "11:00"},
    "reason": "HRV peaks at 09:30, cortisol naturally elevated for energy",
    "alternativeWindow": {"start": "16:00", "end": "18:00"},
    "avoidWindow": {"start": "21:00", "end": "23:00", "reason": "Late training disrupts sleep quality"}
  }
}
```

---

## 14. Risk / Риски

### GET /risk/assessment

**EN:** Returns comprehensive health risk assessment with overall risk level, composite score, and individual risk factors.
**RU:** Возвращает комплексную оценку рисков здоровья с общим уровнем риска, композитным скором и индивидуальными факторами риска.

```bash
curl "http://localhost:8091/api/v1/risk/assessment" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "overallRisk": "low",
    "varScore": 18.5,
    "confidence": 0.85,
    "riskFactors": [
      {"factor": "cardiovascular", "level": "low", "score": 12},
      {"factor": "metabolic", "level": "low", "score": 15},
      {"factor": "mental_health", "level": "moderate", "score": 35},
      {"factor": "musculoskeletal", "level": "low", "score": 10}
    ],
    "assessedAt": "2026-04-02T12:00:00Z"
  }
}
```

Risk levels: `low`, `moderate`, `elevated`, `high`, `critical`

---

### GET /risk/anomalies

**EN:** Returns biometric anomalies detected via statistical deviation analysis. Each anomaly has observed/expected values and severity.
**RU:** Возвращает биометрические аномалии, обнаруженные через анализ статистических отклонений.

**Parameters:** `period` = `24h` / `7d` / `30d` (default: `7d`)

```bash
curl "http://localhost:8091/api/v1/risk/anomalies?period=7d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "anomalies": [
      {"metric": "resting_hr", "value": 72, "expected": 62, "deviation": 2.1, "severity": "mild", "at": "2026-04-01T06:00:00Z"}
    ],
    "period": "7d",
    "totalDetected": 1
  }
}
```

Severity values: `mild`, `moderate`, `severe`

---

### GET /risk/chronic-flags

**EN:** Returns persistent risk patterns detected over 90-day analysis. Empty flags = no chronic concerns.
**RU:** Возвращает устойчивые риск-паттерны за 90-дневный анализ. Пустые флаги = нет хронических проблем.

```bash
curl "http://localhost:8091/api/v1/risk/chronic-flags" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "flags": [],
    "message": "No chronic risk flags detected in the last 90 days.",
    "lastAssessed": "2026-04-02T12:00:00Z"
  }
}
```

---

### GET /risk/correlations

**EN:** Returns pairwise correlations between risk factors with Pearson coefficients and clinical relevance.
**RU:** Возвращает парные корреляции между факторами риска с коэффициентами Пирсона и клинической релевантностью.

```bash
curl "http://localhost:8091/api/v1/risk/correlations" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "correlations": [
      {"factorA": "stress", "factorB": "sleep_quality", "r": -0.72, "clinicalRelevance": "high"},
      {"factorA": "activity_level", "factorB": "cardiovascular_risk", "r": -0.58, "clinicalRelevance": "moderate"}
    ]
  }
}
```

---

### GET /risk/volatility

**EN:** Returns standard deviation of WVI and individual metrics. Lower volatility = more stable health.
**RU:** Возвращает стандартное отклонение WVI и индивидуальных метрик. Ниже волатильность = стабильнее здоровье.

**Parameters:** `period` = `7d` / `30d` / `90d` (default: `30d`)

```bash
curl "http://localhost:8091/api/v1/risk/volatility?period=30d" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "wviVolatility": 5.2,
    "unit": "points",
    "period": "30d",
    "classification": "stable",
    "metricVolatility": {
      "hr": 8.3, "hrv": 12.1, "stress": 15.4, "spo2": 1.2, "sleep": 9.8
    }
  }
}
```

Classification values: `very_stable`, `stable`, `moderate`, `volatile`, `highly_volatile`

---

## 15. Dashboard / Дашборд

### GET /dashboard/widgets

**EN:** Returns pre-configured dashboard widgets with current values for rendering a health dashboard UI.
**RU:** Возвращает предконфигурированные виджеты дашборда с текущими значениями для рендеринга UI здоровья.

```bash
curl "http://localhost:8091/api/v1/dashboard/widgets" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "widgets": [
      {"id": "wvi", "type": "gauge", "title": "WVI Score", "value": 78.5, "max": 100},
      {"id": "hr", "type": "sparkline", "title": "Heart Rate", "current": 72, "data": [68, 70, 72, 74, 71]},
      {"id": "steps", "type": "ring", "title": "Steps", "steps": 8420, "goal": 10000},
      {"id": "emotion", "type": "badge", "title": "Emotion", "value": "Focused"},
      {"id": "stress", "type": "bar", "title": "Stress", "value": 35, "max": 100}
    ]
  }
}
```

Widget types: `gauge`, `sparkline`, `badge`, `ring`, `bar`

---

### GET /dashboard/daily-brief

**EN:** Returns personalized morning briefing with greeting, sleep summary, current WVI, highlights, and top recommendation.
**RU:** Возвращает персонализированный утренний брифинг с приветствием, резюме сна, текущим WVI, ключевыми моментами и топ-рекомендацией.

```bash
curl "http://localhost:8091/api/v1/dashboard/daily-brief" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "date": "2026-04-02",
    "greeting": "Good morning, Alexander!",
    "summary": "You slept 7.7 hours with 82% efficiency. Your WVI is 78.5 (Good). Recovery is strong.",
    "highlights": [
      {"icon": "sleep_emoji", "text": "Sleep score: 82 (Good)"},
      {"icon": "heart_emoji", "text": "Resting HR: 62 bpm (Normal)"},
      {"icon": "chart_emoji", "text": "HRV: 68ms (Above average)"}
    ],
    "topRecommendation": "Great recovery! Today is good for a 45-minute moderate training session."
  }
}
```

---

### GET /dashboard/evening-review

**EN:** Returns end-of-day review with aggregate metrics, achievements, dominant emotion, and tip for tomorrow.
**RU:** Возвращает вечернее резюме с агрегированными метриками, достижениями, доминирующей эмоцией и советом на завтра.

```bash
curl "http://localhost:8091/api/v1/dashboard/evening-review" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "date": "2026-04-02",
    "summary": "Good day overall. WVI averaged 76.2 with a peak of 82.5 at 10:00.",
    "metrics": {
      "wviAvg": 76.2,
      "wviPeak": 82.5,
      "steps": 8420,
      "activeMinutes": 47,
      "stressAvg": 35,
      "dominantEmotion": "focused"
    },
    "achievements": [
      "4-day positive emotion streak",
      "HRV above personal average"
    ],
    "tomorrowTip": "Try to reach 10,000 steps tomorrow for an extra WVI boost."
  }
}
```

---

## 16. Export / Экспорт

### GET /export/csv

**EN:** Downloads biometric and WVI data as a CSV file.
**RU:** Скачивает биометрические и WVI данные в формате CSV.

**Parameters:** `from`, `to` (ISO 8601 dates)

```bash
curl "http://localhost:8091/api/v1/export/csv?from=2026-04-01T00:00:00Z&to=2026-04-02T00:00:00Z" \
  -H "Authorization: Bearer <token>" \
  -o export.csv
```

**Response (200):** Returns `text/csv` file with `Content-Disposition: attachment` header.

---

### GET /export/json

**EN:** Returns biometric and WVI data as structured JSON.
**RU:** Возвращает биометрические и WVI данные в структурированном JSON.

**Parameters:** `from`, `to` (ISO 8601 dates)

```bash
curl "http://localhost:8091/api/v1/export/json?from=2026-04-01T00:00:00Z&to=2026-04-02T00:00:00Z" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "exportDate": "2026-04-02T12:00:00Z",
    "format": "json",
    "records": 2,
    "data": [
      {"date": "2026-04-01", "wviScore": 82.4, "hrAvg": 72, "hrvRmssd": 68.4, "stress": 35, "spo2": 98, "sleepScore": 82, "steps": 8420},
      {"date": "2026-04-02", "wviScore": 78.5, "hrAvg": 74, "hrvRmssd": 65.2, "stress": 38, "spo2": 97, "sleepScore": 80, "steps": 4200}
    ]
  }
}
```

---

### GET /export/health-summary

**EN:** Generates comprehensive health summary for the period with averages, quality assessments, risk level, and PDF download URL.
**RU:** Генерирует комплексное резюме здоровья за период со средними значениями, оценками качества, уровнем риска и ссылкой на PDF.

**Parameters:** `from`, `to` (ISO 8601 dates)

```bash
curl "http://localhost:8091/api/v1/export/health-summary?from=2026-03-01T00:00:00Z&to=2026-04-01T00:00:00Z" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "format": "pdf",
    "status": "ready",
    "summary": {
      "period": "2026-03-01/2026-04-01",
      "avgWvi": 75.8,
      "avgHr": 72,
      "avgHrv": 66.5,
      "avgStress": 38,
      "sleepQuality": "good",
      "activityLevel": "moderate",
      "riskAssessment": "low",
      "recommendation": "Continue current lifestyle patterns. Consider adding 15 min of daily meditation."
    },
    "downloadUrl": "https://storage.wvi.health/exports/summary_2026-03.pdf?token=..."
  }
}
```

---

## 17. Settings / Настройки

### GET /settings

**EN:** Returns application settings: units, language, timezone, theme, data retention, privacy.
**RU:** Возвращает настройки приложения: единицы, язык, часовой пояс, тема, хранение данных, конфиденциальность.

```bash
curl "http://localhost:8091/api/v1/settings" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "units": "metric",
    "language": "en",
    "timezone": "Europe/Moscow",
    "theme": "dark",
    "dataRetention": "365d",
    "privacy": {
      "shareAnonymousData": false,
      "showInLeaderboard": false
    }
  }
}
```

---

### PUT /settings

**EN:** Updates application settings. Only provided fields are modified.
**RU:** Обновляет настройки приложения. Изменяются только переданные поля.

```bash
curl -X PUT http://localhost:8091/api/v1/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"theme": "light", "language": "ru"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": { "updated": true, "updatedAt": "2026-04-02T12:00:00Z" }
}
```

---

### GET /settings/notifications

**EN:** Returns notification preferences: channel toggles, quiet hours, alert level filters.
**RU:** Возвращает настройки уведомлений: переключатели каналов, тихие часы, фильтры уровней алертов.

```bash
curl "http://localhost:8091/api/v1/settings/notifications" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "push": true,
    "email": true,
    "sms": false,
    "quietHours": {
      "enabled": true,
      "start": "23:00",
      "end": "07:00"
    },
    "alertLevels": {
      "critical": true,
      "warning": true,
      "info": false,
      "notice": false
    }
  }
}
```

---

### PUT /settings/notifications

**EN:** Updates notification preferences.
**RU:** Обновляет настройки уведомлений.

```bash
curl -X PUT http://localhost:8091/api/v1/settings/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sms": true, "alertLevels": {"info": true}}'
```

**Response (200):**

```json
{
  "success": true,
  "data": { "updated": true, "updatedAt": "2026-04-02T12:00:00Z" }
}
```

---

## 18. Health / Здоровье сервера

These endpoints do NOT require authentication.

### GET /health/server-status

**EN:** Returns server status, uptime, timestamp, version, environment. No auth required.
**RU:** Возвращает статус сервера, аптайм, метку времени, версию, окружение. Без аутентификации.

```bash
curl "http://localhost:8091/api/v1/health/server-status"
```

**Response (200):**

```json
{
  "status": "ok",
  "uptime": 302445.12,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

---

### GET /health/api-version

**EN:** Returns API name, version, OpenAPI spec version, endpoint count, docs URL. No auth required.
**RU:** Возвращает имя API, версию, версию OpenAPI спецификации, количество эндпоинтов, URL документации. Без аутентификации.

```bash
curl "http://localhost:8091/api/v1/health/api-version"
```

**Response (200):**

```json
{
  "api": "WVI - Wellness Vitality Index API",
  "version": "1.0.0",
  "openapi": "3.1.0",
  "endpoints": 98,
  "docsUrl": "http://localhost:8091/api/v1/docs"
}
```

---

### GET /docs.json

**EN:** Returns the full OpenAPI specification in JSON format. No auth required.
**RU:** Возвращает полную спецификацию OpenAPI в формате JSON. Без аутентификации.

```bash
curl "http://localhost:8091/api/v1/docs.json"
```

---

## Appendix A: Query Parameters for Testing

All three main detection endpoints (`/wvi/current`, `/emotions/current`, `/activities/current`) support query parameter overrides for testing without real biometric data.

### Testing WVI with Different Scenarios

**Healthy person at rest:**
```bash
curl "http://localhost:8091/api/v1/wvi/current?hr=65&hrv=72&stress=20&spo2=98&temp=36.5&sleepMin=480&deep=20&steps=8000&activeMins=45" \
  -H "Authorization: Bearer <token>"
```

**Stressed office worker:**
```bash
curl "http://localhost:8091/api/v1/wvi/current?hr=85&hrv=35&stress=72&spo2=97&temp=36.7&sleepMin=360&deep=12&steps=3000&activeMins=10" \
  -H "Authorization: Bearer <token>"
```

**Active runner mid-workout:**
```bash
curl "http://localhost:8091/api/v1/wvi/current?hr=155&hrv=22&stress=45&spo2=96&temp=37.2&steps=12000&activeMins=60&mets=9&stepsPerMin=160" \
  -H "Authorization: Bearer <token>"
```

**Sleep-deprived person:**
```bash
curl "http://localhost:8091/api/v1/wvi/current?hr=78&hrv=28&stress=55&spo2=96&temp=36.8&sleepMin=240&deep=8&steps=2000&activeMins=5" \
  -H "Authorization: Bearer <token>"
```

**Optimal wellness:**
```bash
curl "http://localhost:8091/api/v1/wvi/current?hr=62&hrv=85&stress=12&spo2=99&temp=36.5&sys=115&dia=72&coherence=0.85&sleepMin=480&deep=22&steps=12000&activeMins=60" \
  -H "Authorization: Bearer <token>"
```

### Testing Emotion Detection

**Calm state:**
```bash
curl "http://localhost:8091/api/v1/emotions/current?hr=65&hrv=65&stress=20&spo2=98&temp=36.5&coherence=0.6" \
  -H "Authorization: Bearer <token>"
```

**Stressed state:**
```bash
curl "http://localhost:8091/api/v1/emotions/current?hr=88&hrv=28&stress=75&spo2=97&temp=36.8&coherence=0.2" \
  -H "Authorization: Bearer <token>"
```

**Flow state:**
```bash
curl "http://localhost:8091/api/v1/emotions/current?hr=72&hrv=55&stress=30&spo2=98&temp=36.5&coherence=0.7&rmssd=55" \
  -H "Authorization: Bearer <token>"
```

**Meditative state:**
```bash
curl "http://localhost:8091/api/v1/emotions/current?hr=58&hrv=80&stress=8&spo2=99&temp=36.4&coherence=0.85&activityScore=5" \
  -H "Authorization: Bearer <token>"
```

**Anxious state:**
```bash
curl "http://localhost:8091/api/v1/emotions/current?hr=95&hrv=22&stress=80&spo2=96&temp=36.9&coherence=0.15&sys=140" \
  -H "Authorization: Bearer <token>"
```

### Testing Activity Detection

**Walking:**
```bash
curl "http://localhost:8091/api/v1/activities/current?hr=95&stepsPerMin=70&hrv=50&stress=25" \
  -H "Authorization: Bearer <token>"
```

**Running (tempo):**
```bash
curl "http://localhost:8091/api/v1/activities/current?hr=165&maxHR=186&restingHR=62&stepsPerMin=145&hrv=20&stress=50" \
  -H "Authorization: Bearer <token>"
```

**Sprinting:**
```bash
curl "http://localhost:8091/api/v1/activities/current?hr=180&maxHR=186&restingHR=62&stepsPerMin=180&hrv=12&stress=60" \
  -H "Authorization: Bearer <token>"
```

**Deep sleep:**
```bash
curl "http://localhost:8091/api/v1/activities/current?hr=58&stepsPerMin=0&hrv=65&stress=10&coherence=0.7" \
  -H "Authorization: Bearer <token>"
```

**Meditation:**
```bash
curl "http://localhost:8091/api/v1/activities/current?hr=58&stepsPerMin=0&hrv=80&stress=5&coherence=0.85&spo2=99" \
  -H "Authorization: Bearer <token>"
```

**Panic attack detection:**
```bash
curl "http://localhost:8091/api/v1/activities/current?hr=140&restingHR=65&stepsPerMin=0&hrv=15&spo2=95&stress=90" \
  -H "Authorization: Bearer <token>"
```

---

## Appendix B: Error Codes

| HTTP Code | Error | Description EN | Описание RU |
|-----------|-------|---------------|-------------|
| 400 | Bad Request | Invalid request body or query parameters | Неверное тело запроса или параметры |
| 401 | Unauthorized | Missing or invalid Bearer token | Отсутствует или недействителен Bearer token |
| 403 | Forbidden | Insufficient permissions | Недостаточно прав доступа |
| 404 | Not Found | Endpoint or resource not found | Эндпоинт или ресурс не найден |
| 409 | Conflict | Resource conflict (e.g. duplicate email) | Конфликт ресурсов (напр. дубликат email) |
| 422 | Unprocessable Entity | Valid JSON but invalid data | Валидный JSON, но невалидные данные |
| 429 | Too Many Requests | Rate limit exceeded | Превышен лимит запросов |
| 500 | Internal Server Error | Server-side error | Ошибка на стороне сервера |
| 503 | Service Unavailable | Server temporarily unavailable | Сервер временно недоступен |

### Error Response Format

```json
{
  "success": false,
  "timestamp": "2026-04-02T12:00:00.000Z",
  "error": {
    "code": 401,
    "message": "Unauthorized",
    "details": "Access token has expired. Use /auth/refresh to obtain a new token."
  }
}
```

### Common Error Scenarios

**Expired token:**
```bash
curl http://localhost:8091/api/v1/wvi/current -H "Authorization: Bearer expired_token"
# 401: Access token has expired
```

**Missing required field:**
```bash
curl -X POST http://localhost:8091/api/v1/auth/register -H "Content-Type: application/json" -d '{"email": "test@test.com"}'
# 400: Missing required field: password
```

**Invalid metric value:**
```bash
curl "http://localhost:8091/api/v1/wvi/current?hr=-10"
# 422: Heart rate must be a positive number
```

---

*Generated from OpenAPI spec v3.1.0 | WVI API v1.0.0 | Last updated: 2026-04-02*
