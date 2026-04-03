# WVI — Wellness Vitality Index

## Complete API & SDK Documentation / Полная документация API и SDK

**Version:** 1.0.0
**Base URL:** `https://api.wvi.health/api/v1`
**Protocol:** HTTPS + BLE 5.0
**Auth:** Privy (JWT Bearer)
**License:** Proprietary
**Last updated:** 2026-04-02

---

# Table of Contents / Содержание

1. [Overview / Обзор](#1-overview)
2. [Quick Start / Быстрый старт](#2-quick-start)
3. [Authentication — Privy / Аутентификация](#3-authentication--privy)
4. [Android SDK V8 2.0](#4-android-sdk-v8-20)
5. [iOS SDK V8](#5-ios-sdk-v8)
6. [WVI Algorithm / Алгоритм WVI](#6-wvi-algorithm)
7. [Emotion Engine — 18 Emotions / Движок эмоций](#7-emotion-engine--18-emotions)
8. [Activity Detector — 64 Activities / Детектор активности](#8-activity-detector--64-activities)
9. [API Endpoints Reference / Справочник API](#9-api-endpoints-reference)
10. [Rust Core Architecture / Архитектура ядра Rust](#10-rust-core-architecture)
11. [Deployment — Docker / Развёртывание](#11-deployment--docker)
12. [Testing Scenarios / Тестовые сценарии](#12-testing-scenarios)
13. [Appendix A — Emotions Reference / Справочник эмоций](#appendix-a--emotions-reference)
14. [Appendix B — Activities Reference / Справочник активностей](#appendix-b--activities-reference)
15. [Appendix C — Error Codes / Коды ошибок](#appendix-c--error-codes)
16. [Appendix D — Glossary / Глоссарий](#appendix-d--glossary)

---

# 1. Overview

**EN:** WVI (Wellness Vitality Index) is a comprehensive health monitoring platform that combines real-time biometric data from the V8 BLE wearable device with advanced algorithms to produce a single 0-100 wellness score. The system analyzes 10 health metrics through adaptive time-of-day weighting, detects 18 emotional states via fuzzy logic cascade, classifies 64 activity types with TRIMP load tracking, and provides AI-powered health interpretations from 8 expert perspectives.

**RU:** WVI (Wellness Vitality Index) — это комплексная платформа мониторинга здоровья, которая объединяет биометрические данные в реальном времени с носимого устройства V8 BLE с продвинутыми алгоритмами для получения единого показателя здоровья от 0 до 100. Система анализирует 10 метрик здоровья через адаптивные веса по времени суток, определяет 18 эмоциональных состояний через каскад нечёткой логики, классифицирует 64 типа активности с отслеживанием нагрузки TRIMP и предоставляет ИИ-интерпретации здоровья с 8 экспертных перспектив.

### Key Features / Ключевые возможности

**EN:**
- Real-time WVI score calculation from 10 normalized biometric metrics
- 18-emotion detection using fuzzy logic with sigmoid and bell-curve membership functions
- 64 activity types with automatic detection, HR zones, TRIMP, and calorie tracking
- Adaptive weight system that shifts priorities based on time of day and exercise state
- Emotion-WVI feedback loop with confidence-weighted multipliers
- 8-perspective AI Genius Layer (doctor, psychologist, neuroscientist, biohacker, coach, nutritionist, sleep expert, data scientist)
- 108+ REST API endpoints across 17 functional groups
- Privy authentication with JWT Bearer tokens
- BLE 5.0 connectivity with V8 wearable (PPG, ECG, accelerometer, gyroscope, thermometer)
- Docker deployment with health checks

**RU:**
- Расчёт WVI в реальном времени из 10 нормализованных биометрических метрик
- Определение 18 эмоций с помощью нечёткой логики с сигмоидными и колоколообразными функциями принадлежности
- 64 типа активности с автоматическим определением, зонами ЧСС, TRIMP и отслеживанием калорий
- Адаптивная система весов, меняющая приоритеты в зависимости от времени суток и состояния тренировки
- Петля обратной связи эмоция-WVI с мультипликаторами, взвешенными по уверенности
- 8-перспективный ИИ-слой Genius (врач, психолог, нейроучёный, биохакер, тренер, нутрициолог, эксперт по сну, дата-сайентист)
- 108+ REST API эндпоинтов в 17 функциональных группах
- Аутентификация Privy с JWT Bearer токенами
- BLE 5.0 связь с носимым устройством V8 (PPG, ECG, акселерометр, гироскоп, термометр)
- Docker-развёртывание с проверками состояния

### System Architecture Diagram / Схема архитектуры

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Android App  │  │   iOS App    │  │   Web Dashboard    │    │
│  │  (Kotlin)    │  │   (Swift)    │  │   (React/Next.js)  │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘    │
│         │                 │                    │                │
│         └─────────────────┼────────────────────┘                │
│                           │ HTTPS / JWT Bearer                  │
├───────────────────────────┼─────────────────────────────────────┤
│                      API GATEWAY                                │
│  ┌────────────────────────┴────────────────────────────────┐    │
│  │              Express.js + Privy Auth                     │    │
│  │           /api/v1/* (108+ endpoints)                     │    │
│  └────────────────────────┬────────────────────────────────┘    │
├───────────────────────────┼─────────────────────────────────────┤
│                    ALGORITHM LAYER                               │
│  ┌────────────────┐ ┌─────────────────┐ ┌──────────────────┐   │
│  │ WVI Calculator │ │ Emotion Engine  │ │ Activity Detector│   │
│  │  (10 metrics)  │ │ (18 emotions)   │ │ (64 activities)  │   │
│  │  Adaptive wts  │ │ Fuzzy logic     │ │ HR zones, TRIMP  │   │
│  └────────────────┘ └─────────────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     DEVICE LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           V8 BLE Wearable Device                        │    │
│  │  Sensors: PPG | ECG | Accel | Gyro | Thermometer        │    │
│  │  Service: FFF0 | Chars: FFF6 (write) | FFF7 (notify)    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

# 2. Quick Start

**EN:** Get the WVI API running in under 5 minutes.

**RU:** Запустите WVI API менее чем за 5 минут.

### Prerequisites / Предварительные требования

**EN:**
- Node.js 20+ or Docker
- V8 BLE wearable device (for real biometric data)
- Privy account (for production auth; dev mode works without it)

**RU:**
- Node.js 20+ или Docker
- Носимое устройство V8 BLE (для реальных биометрических данных)
- Аккаунт Privy (для продакшн-аутентификации; режим разработки работает без него)

### Option A: Local / Локально

```bash
# Clone and install
git clone https://github.com/your-org/wvi-api.git
cd wvi-api
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Privy credentials (optional for dev)

# Start server
npm start
# Server running on http://localhost:8091
```

### Option B: Docker

```bash
# Build and run
docker compose up -d

# Verify
curl http://localhost:8091/api/v1/health/server-status
```

**EN:** Expected response:

**RU:** Ожидаемый ответ:

```json
{
  "status": "ok",
  "uptime": 1.234,
  "timestamp": "2026-04-02T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### First API Call / Первый вызов API

**EN:** Get your current WVI score:

**RU:** Получите текущий WVI показатель:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8091/api/v1/wvi/current?hr=72&hrv=52&stress=28&spo2=97.5&temp=36.5"
```

### Explore / Исследуйте

**EN:**
- Swagger UI: `http://localhost:8091/api/v1/docs`
- HTML Documentation: `http://localhost:8091/api/v1/documentation`
- Raw Markdown: `http://localhost:8091/api/v1/documentation/raw`
- OpenAPI JSON: `http://localhost:8091/api/v1/docs.json`

**RU:**
- Swagger UI: `http://localhost:8091/api/v1/docs`
- HTML-документация: `http://localhost:8091/api/v1/documentation`
- Markdown (исходный): `http://localhost:8091/api/v1/documentation/raw`
- OpenAPI JSON: `http://localhost:8091/api/v1/docs.json`

---

# 3. Authentication — Privy

**EN:** WVI uses Privy for authentication. All `/api/v1/*` endpoints (except public paths) require a valid JWT Bearer token.

**RU:** WVI использует Privy для аутентификации. Все эндпоинты `/api/v1/*` (кроме публичных путей) требуют валидный JWT Bearer токен.

### How It Works / Как это работает

**EN:**
1. Client authenticates with Privy SDK (embedded wallet or social login)
2. Privy issues a JWT access token
3. Client sends token in `Authorization: Bearer <token>` header
4. Server verifies token via Privy API (`https://auth.privy.io/api/v1/token/verify`)
5. On success, `req.user` is populated with `{ id, privyUser }`

**RU:**
1. Клиент аутентифицируется через Privy SDK (встроенный кошелёк или социальный логин)
2. Privy выдаёт JWT access-токен
3. Клиент отправляет токен в заголовке `Authorization: Bearer <токен>`
4. Сервер верифицирует токен через Privy API (`https://auth.privy.io/api/v1/token/verify`)
5. При успехе `req.user` заполняется данными `{ id, privyUser }`

### Public Paths (No Auth) / Публичные пути (без авторизации)

| Path | Description EN | Описание RU |
|------|---------------|-------------|
| `/api/v1/auth/*` | Authentication endpoints | Эндпоинты аутентификации |
| `/api/v1/health/*` | Health checks | Проверки здоровья сервера |
| `/api/v1/docs` | Swagger UI | Swagger UI |
| `/api/v1/documentation` | HTML documentation | HTML-документация |

### Environment Variables / Переменные окружения

| Variable | Description EN | Описание RU | Required |
|----------|---------------|-------------|----------|
| `PRIVY_APP_ID` | Privy application ID | ID приложения Privy | Production |
| `PRIVY_APP_SECRET` | Privy application secret | Секрет приложения Privy | Production |
| `PORT` | Server port (default: 8091) | Порт сервера (по умолчанию: 8091) | No |
| `NODE_ENV` | Environment mode | Режим окружения | No |

### Dev Mode / Режим разработки

**EN:** When `PRIVY_APP_ID` and `PRIVY_APP_SECRET` are empty, the server runs in dev mode. Any Bearer token is accepted, and `req.user` is set to `{ id: 'usr_dev_001', email: 'dev@wvi.health' }`.

**RU:** Когда `PRIVY_APP_ID` и `PRIVY_APP_SECRET` пусты, сервер работает в режиме разработки. Любой Bearer-токен принимается, и `req.user` устанавливается в `{ id: 'usr_dev_001', email: 'dev@wvi.health' }`.

### Token Verification Flow / Поток верификации токена

```
Client                   WVI Server              Privy
  │                         │                      │
  │  POST /api/v1/wvi       │                      │
  │  Authorization: Bearer T│                      │
  │────────────────────────>│                      │
  │                         │  POST /token/verify  │
  │                         │  privy-app-id: APP_ID│
  │                         │  Auth: Basic(ID:SEC) │
  │                         │  body: { token: T }  │
  │                         │─────────────────────>│
  │                         │                      │
  │                         │  200 { user_id: ... }│
  │                         │<─────────────────────│
  │                         │                      │
  │  200 { wviScore: 78 }   │                      │
  │<────────────────────────│                      │
```

### Auth API Endpoints / Эндпоинты аутентификации

#### POST /api/v1/auth/register

**EN:** Register a new user account.

**RU:** Зарегистрировать новый аккаунт пользователя.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "Alexander",
  "password": "secure_password"
}
```

**Response (201):**
```json
{
  "success": true,
  "timestamp": "2026-04-02T10:00:00.000Z",
  "data": {
    "userId": "usr_abc123",
    "email": "user@wvi.health",
    "name": "Alexander",
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 3600
  }
}
```

#### POST /api/v1/auth/login

**EN:** Log in with existing credentials.

**RU:** Войти с существующими учётными данными.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 3600
  }
}
```

#### POST /api/v1/auth/refresh

**EN:** Refresh an expired access token.

**RU:** Обновить истёкший access-токен.

**Request:**
```json
{
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 3600
  }
}
```

---

# 4. Android SDK V8 2.0

**EN:** The Android SDK provides BLE communication with the V8 wearable device and integration with the WVI API.

**RU:** Android SDK обеспечивает BLE-связь с носимым устройством V8 и интеграцию с WVI API.

## 4.1 Prerequisites / Предварительные требования

**EN:**
- Android Studio Arctic Fox or newer
- Minimum SDK: API 26 (Android 8.0)
- Target SDK: API 34 (Android 14)
- Kotlin 1.9+
- Bluetooth LE 5.0 support on device

**RU:**
- Android Studio Arctic Fox или новее
- Минимальный SDK: API 26 (Android 8.0)
- Целевой SDK: API 34 (Android 14)
- Kotlin 1.9+
- Поддержка Bluetooth LE 5.0 на устройстве

## 4.2 Gradle Setup / Настройка Gradle

### Project-level build.gradle.kts

```kotlin
// settings.gradle.kts
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://maven.v8device.com/releases") }
    }
}
```

### App-level build.gradle.kts

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.22"
}

android {
    namespace = "com.wvi.health"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.wvi.health"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "2.0.0"
    }

    buildFeatures {
        compose = true
        viewBinding = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    // V8 BLE SDK
    implementation("com.v8device:ble-sdk:2.0.0")
    implementation("com.v8device:ble-sdk-ktx:2.0.0")

    // WVI API Client
    implementation("com.wvi:api-client:1.0.0")

    // BLE Core
    implementation("no.nordicsemi.android:ble:2.7.4")
    implementation("no.nordicsemi.android:ble-ktx:2.7.4")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Privy Auth
    implementation("io.privy:privy-android:0.4.0")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // Health Connect (optional)
    implementation("androidx.health.connect:connect-client:1.1.0-alpha06")
}
```

## 4.3 AndroidManifest.xml Permissions / Разрешения

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- BLE Permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Foreground service for continuous monitoring -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />

    <!-- Network -->
    <uses-permission android:name="android.permission.INTERNET" />

    <uses-feature
        android:name="android.hardware.bluetooth_le"
        android:required="true" />

    <application ...>
        <service
            android:name=".ble.V8MonitoringService"
            android:foregroundServiceType="connectedDevice"
            android:exported="false" />
    </application>
</manifest>
```

## 4.4 BleManager — V8 Device Connection / Подключение к устройству V8

**EN:** The `V8BleManager` handles all BLE communication with the V8 wearable device through the BLE service UUID `FFF0` and characteristics `FFF6` (write) and `FFF7` (notify).

**RU:** `V8BleManager` управляет всей BLE-связью с носимым устройством V8 через UUID сервиса BLE `FFF0` и характеристики `FFF6` (запись) и `FFF7` (уведомления).

### BLE Service UUIDs / UUID BLE-сервиса

| UUID | Type | Description EN | Описание RU |
|------|------|---------------|-------------|
| `0000FFF0-0000-1000-8000-00805F9B34FB` | Service | V8 Main Service | Основной сервис V8 |
| `0000FFF6-0000-1000-8000-00805F9B34FB` | Characteristic | Write (commands) | Запись (команды) |
| `0000FFF7-0000-1000-8000-00805F9B34FB` | Characteristic | Notify (data) | Уведомления (данные) |

### V8BleManager.kt

```kotlin
package com.wvi.health.ble

import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.content.Context
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import no.nordicsemi.android.ble.BleManager
import no.nordicsemi.android.ble.ktx.suspend
import java.util.UUID

class V8BleManager(context: Context) : BleManager(context) {

    companion object {
        val SERVICE_UUID: UUID = UUID.fromString("0000FFF0-0000-1000-8000-00805F9B34FB")
        val WRITE_CHAR_UUID: UUID = UUID.fromString("0000FFF6-0000-1000-8000-00805F9B34FB")
        val NOTIFY_CHAR_UUID: UUID = UUID.fromString("0000FFF7-0000-1000-8000-00805F9B34FB")
    }

    private var writeChar: BluetoothGattCharacteristic? = null
    private var notifyChar: BluetoothGattCharacteristic? = null

    private val _dataFlow = MutableSharedFlow<V8Packet>(replay = 0, extraBufferCapacity = 64)
    val dataFlow: SharedFlow<V8Packet> = _dataFlow

    override fun isRequiredServiceSupported(gatt: BluetoothGatt): Boolean {
        val service = gatt.getService(SERVICE_UUID) ?: return false
        writeChar = service.getCharacteristic(WRITE_CHAR_UUID)
        notifyChar = service.getCharacteristic(NOTIFY_CHAR_UUID)
        return writeChar != null && notifyChar != null
    }

    override fun initialize() {
        setNotificationCallback(notifyChar).with { _, data ->
            data.value?.let { bytes ->
                val packet = V8PacketParser.parse(bytes)
                _dataFlow.tryEmit(packet)
            }
        }
        enableNotifications(notifyChar).enqueue()
    }

    override fun onServicesInvalidated() {
        writeChar = null
        notifyChar = null
    }

    suspend fun sendCommand(command: V8Command) {
        writeChar?.let { char ->
            writeCharacteristic(char, command.toBytes())
                .with { _, _ -> /* sent */ }
                .suspend()
        }
    }
}
```

## 4.5 V8 BLE Commands / BLE команды V8

**EN:** Commands are sent to the FFF6 characteristic as byte arrays.

**RU:** Команды отправляются в характеристику FFF6 как массивы байтов.

### V8Command.kt

```kotlin
package com.wvi.health.ble

sealed class V8Command(val opCode: Byte, val params: ByteArray = byteArrayOf()) {

    fun toBytes(): ByteArray {
        val header = byteArrayOf(0xAB.toByte(), opCode, params.size.toByte())
        return header + params + checksum(header + params)
    }

    private fun checksum(data: ByteArray): Byte =
        data.fold(0) { acc, b -> acc xor b.toInt() }.toByte()

    // ── Measurement Commands ──
    object StartHeartRate : V8Command(0x01)
    object StopHeartRate : V8Command(0x02)
    object StartSpO2 : V8Command(0x03)
    object StopSpO2 : V8Command(0x04)
    object StartTemperature : V8Command(0x05)
    object StopTemperature : V8Command(0x06)
    object StartECG : V8Command(0x07)
    object StopECG : V8Command(0x08)
    object StartBloodPressure : V8Command(0x09)
    object StopBloodPressure : V8Command(0x0A)
    object StartStress : V8Command(0x0B)
    object StartPPI : V8Command(0x0C)
    object StopPPI : V8Command(0x0D)

    // ── Continuous Monitoring ──
    data class StartAutoMonitor(
        val intervalSeconds: Int = 300
    ) : V8Command(0x10, byteArrayOf(
        (intervalSeconds shr 8).toByte(),
        (intervalSeconds and 0xFF).toByte()
    ))
    object StopAutoMonitor : V8Command(0x11)

    // ── Device Control ──
    object GetBattery : V8Command(0x20)
    object GetFirmwareVersion : V8Command(0x21)
    object FactoryReset : V8Command(0xFE.toByte())
    object Reboot : V8Command(0xFF.toByte())

    // ── Data Commands ──
    object SyncAllData : V8Command(0x30)
    object GetDeviceTime : V8Command(0x31)
    data class SetDeviceTime(val timestamp: Long) : V8Command(0x32,
        byteArrayOf(
            (timestamp shr 24).toByte(), (timestamp shr 16).toByte(),
            (timestamp shr 8).toByte(), timestamp.toByte()
        )
    )
}
```

### V8Packet.kt — Data Parsing / Разбор данных

```kotlin
package com.wvi.health.ble

data class V8Packet(
    val type: PacketType,
    val data: Map<String, Any>
)

enum class PacketType {
    HEART_RATE, HRV, SPO2, TEMPERATURE, ECG_SAMPLE,
    BLOOD_PRESSURE, STRESS, PPI, ACTIVITY, SLEEP,
    BATTERY, FIRMWARE_VERSION, SYNC_DATA, UNKNOWN
}

object V8PacketParser {
    fun parse(bytes: ByteArray): V8Packet {
        if (bytes.size < 3 || bytes[0] != 0xAB.toByte()) {
            return V8Packet(PacketType.UNKNOWN, mapOf("raw" to bytes.toList()))
        }
        val opCode = bytes[1]
        val payload = bytes.drop(3).dropLast(1).toByteArray()

        return when (opCode.toInt() and 0xFF) {
            0x01 -> V8Packet(PacketType.HEART_RATE, mapOf(
                "bpm" to (payload[0].toInt() and 0xFF),
                "confidence" to (payload.getOrNull(1)?.toInt()?.and(0xFF) ?: 100)
            ))
            0x02 -> V8Packet(PacketType.HRV, mapOf(
                "rmssd" to bytesToFloat(payload, 0),
                "sdnn" to bytesToFloat(payload, 4),
                "pnn50" to bytesToFloat(payload, 8)
            ))
            0x03 -> V8Packet(PacketType.SPO2, mapOf(
                "percentage" to (payload[0].toInt() and 0xFF),
                "pi" to bytesToFloat(payload, 1)  // Perfusion index
            ))
            0x05 -> V8Packet(PacketType.TEMPERATURE, mapOf(
                "celsius" to bytesToFloat(payload, 0)
            ))
            0x07 -> V8Packet(PacketType.ECG_SAMPLE, mapOf(
                "samples" to parseEcgSamples(payload),
                "sampleRate" to 125
            ))
            0x09 -> V8Packet(PacketType.BLOOD_PRESSURE, mapOf(
                "systolic" to (payload[0].toInt() and 0xFF),
                "diastolic" to (payload[1].toInt() and 0xFF),
                "pulse" to (payload[2].toInt() and 0xFF)
            ))
            0x0B -> V8Packet(PacketType.STRESS, mapOf(
                "score" to (payload[0].toInt() and 0xFF)
            ))
            0x0C -> V8Packet(PacketType.PPI, mapOf(
                "intervalMs" to ((payload[0].toInt() and 0xFF) shl 8 or
                    (payload[1].toInt() and 0xFF)),
                "coherence" to bytesToFloat(payload, 2)
            ))
            0x20 -> V8Packet(PacketType.BATTERY, mapOf(
                "percentage" to (payload[0].toInt() and 0xFF)
            ))
            0x21 -> V8Packet(PacketType.FIRMWARE_VERSION, mapOf(
                "version" to String(payload)
            ))
            else -> V8Packet(PacketType.UNKNOWN, mapOf("opCode" to opCode, "raw" to payload.toList()))
        }
    }

    private fun bytesToFloat(bytes: ByteArray, offset: Int): Float {
        val bits = ((bytes[offset].toInt() and 0xFF) shl 24) or
            ((bytes[offset + 1].toInt() and 0xFF) shl 16) or
            ((bytes[offset + 2].toInt() and 0xFF) shl 8) or
            (bytes[offset + 3].toInt() and 0xFF)
        return Float.fromBits(bits)
    }

    private fun parseEcgSamples(payload: ByteArray): List<Float> {
        return payload.toList().chunked(2).map { (hi, lo) ->
            ((hi.toInt() and 0xFF) shl 8 or (lo.toInt() and 0xFF)).toFloat() / 1000f
        }
    }
}
```

## 4.6 Complete Android Usage Example / Полный пример использования Android

```kotlin
package com.wvi.health

import android.Manifest
import android.annotation.SuppressLint
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wvi.health.ble.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

// ── ViewModel ──
class WviViewModel(private val bleManager: V8BleManager) : ViewModel() {

    data class WviState(
        val isConnected: Boolean = false,
        val heartRate: Int = 0,
        val hrv: Float = 0f,
        val spo2: Int = 0,
        val temperature: Float = 0f,
        val stress: Int = 0,
        val wviScore: Float = 0f,
        val emotion: String = "",
        val activity: String = "",
        val battery: Int = 0,
        val error: String? = null
    )

    private val _state = MutableStateFlow(WviState())
    val state: StateFlow<WviState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            bleManager.dataFlow.collect { packet ->
                when (packet.type) {
                    PacketType.HEART_RATE -> _state.update {
                        it.copy(heartRate = packet.data["bpm"] as Int)
                    }
                    PacketType.HRV -> _state.update {
                        it.copy(hrv = packet.data["rmssd"] as Float)
                    }
                    PacketType.SPO2 -> _state.update {
                        it.copy(spo2 = packet.data["percentage"] as Int)
                    }
                    PacketType.TEMPERATURE -> _state.update {
                        it.copy(temperature = packet.data["celsius"] as Float)
                    }
                    PacketType.STRESS -> _state.update {
                        it.copy(stress = packet.data["score"] as Int)
                    }
                    PacketType.BATTERY -> _state.update {
                        it.copy(battery = packet.data["percentage"] as Int)
                    }
                    else -> { /* handle other types */ }
                }
            }
        }
    }

    fun startMonitoring() {
        viewModelScope.launch {
            try {
                bleManager.sendCommand(V8Command.StartAutoMonitor(intervalSeconds = 300))
                _state.update { it.copy(isConnected = true) }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.message) }
            }
        }
    }

    fun measureNow() {
        viewModelScope.launch {
            bleManager.sendCommand(V8Command.StartHeartRate)
            bleManager.sendCommand(V8Command.StartSpO2)
            bleManager.sendCommand(V8Command.StartTemperature)
            bleManager.sendCommand(V8Command.StartStress)
        }
    }
}

// ── Compose UI ──
@Composable
fun WviDashboard(viewModel: WviViewModel = viewModel()) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // WVI Score Gauge
        Text(
            text = "WVI: ${state.wviScore.toInt()}",
            style = MaterialTheme.typography.displayLarge
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "${state.emotion} | ${state.activity}",
            style = MaterialTheme.typography.titleMedium
        )

        Spacer(Modifier.height(24.dp))

        // Metric Cards
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            MetricCard("HR", "${state.heartRate} bpm")
            MetricCard("HRV", "${state.hrv.toInt()} ms")
            MetricCard("SpO2", "${state.spo2}%")
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            MetricCard("Temp", "${state.temperature}°C")
            MetricCard("Stress", "${state.stress}/100")
            MetricCard("Battery", "${state.battery}%")
        }

        Spacer(Modifier.height(24.dp))

        // Controls
        Button(onClick = { viewModel.startMonitoring() }) {
            Text("Start Monitoring")
        }
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = { viewModel.measureNow() }) {
            Text("Measure Now")
        }

        state.error?.let {
            Spacer(Modifier.height(16.dp))
            Text(text = it, color = MaterialTheme.colorScheme.error)
        }
    }
}

@Composable
fun MetricCard(label: String, value: String) {
    Card(modifier = Modifier.width(100.dp)) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = label, style = MaterialTheme.typography.labelSmall)
            Text(text = value, style = MaterialTheme.typography.titleMedium)
        }
    }
}
```

## 4.7 API Client (Retrofit) / API клиент (Retrofit)

```kotlin
package com.wvi.health.api

import retrofit2.Response
import retrofit2.http.*

interface WviApiService {

    // Auth
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<ApiResponse<AuthResult>>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<ApiResponse<AuthResult>>

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): Response<ApiResponse<TokenResult>>

    // WVI
    @GET("wvi/current")
    suspend fun getWviCurrent(@QueryMap params: Map<String, String>): Response<ApiResponse<WviResult>>

    @GET("wvi/history")
    suspend fun getWviHistory(@Query("period") period: String = "30d"): Response<ApiResponse<WviHistory>>

    @GET("wvi/trends")
    suspend fun getWviTrends(@Query("period") period: String = "30d"): Response<ApiResponse<WviTrends>>

    // Biometrics
    @POST("biometrics/sync")
    suspend fun syncBiometrics(@Body body: SyncRequest): Response<ApiResponse<SyncResult>>

    @GET("biometrics/heart-rate")
    suspend fun getHeartRate(): Response<ApiResponse<HeartRateData>>

    @GET("biometrics/hrv")
    suspend fun getHrv(): Response<ApiResponse<HrvData>>

    @GET("biometrics/realtime")
    suspend fun getRealtime(): Response<ApiResponse<RealtimeData>>

    // Emotions
    @GET("emotions/current")
    suspend fun getCurrentEmotion(@QueryMap params: Map<String, String>): Response<ApiResponse<EmotionResult>>

    @GET("emotions/history")
    suspend fun getEmotionHistory(): Response<ApiResponse<EmotionHistory>>

    // Activities
    @GET("activities/current")
    suspend fun getCurrentActivity(@QueryMap params: Map<String, String>): Response<ApiResponse<ActivityResult>>

    @GET("activities/load")
    suspend fun getActivityLoad(): Response<ApiResponse<ActivityLoad>>

    // AI
    @GET("ai/interpret")
    suspend fun getInterpretation(): Response<ApiResponse<Interpretation>>

    @GET("ai/recommendations")
    suspend fun getRecommendations(): Response<ApiResponse<Recommendations>>

    @POST("ai/chat")
    suspend fun chat(@Body body: ChatRequest): Response<ApiResponse<ChatResponse>>

    // Dashboard
    @GET("dashboard/daily-brief")
    suspend fun getDailyBrief(): Response<ApiResponse<DailyBrief>>
}

// Data classes
data class ApiResponse<T>(val success: Boolean, val timestamp: String, val data: T)
data class RegisterRequest(val email: String, val name: String, val password: String)
data class LoginRequest(val email: String, val password: String)
data class RefreshRequest(val refreshToken: String)
data class AuthResult(val userId: String, val accessToken: String, val refreshToken: String, val expiresIn: Int)
data class TokenResult(val accessToken: String, val expiresIn: Int)
data class WviResult(val wviScore: Float, val level: String, val metrics: Map<String, Float>)
data class SyncRequest(val records: List<Map<String, Any>>)
data class SyncResult(val syncId: String, val recordsProcessed: Int)
data class ChatRequest(val message: String)
data class ChatResponse(val response: String)
```

---

# 5. iOS SDK V8

**EN:** The iOS SDK provides BLE communication with the V8 wearable and WVI API integration using Swift and CoreBluetooth.

**RU:** iOS SDK обеспечивает BLE-связь с носимым устройством V8 и интеграцию с WVI API через Swift и CoreBluetooth.

## 5.1 Prerequisites / Предварительные требования

**EN:**
- Xcode 15+
- iOS 16.0+ deployment target
- Swift 5.9+
- Physical device with BLE 5.0 (simulator does not support BLE)

**RU:**
- Xcode 15+
- Целевая платформа iOS 16.0+
- Swift 5.9+
- Физическое устройство с BLE 5.0 (симулятор не поддерживает BLE)

## 5.2 Xcode Setup / Настройка Xcode

### Swift Package Manager

```swift
// Package.swift or Xcode > File > Add Package Dependencies
dependencies: [
    .package(url: "https://github.com/ApolloGraphQL/apollo-ios.git", from: "1.9.0"),
    .package(url: "https://github.com/nicklockwood/SwiftFormat.git", from: "0.53.0"),
]
```

### Info.plist — Required Keys / Обязательные ключи

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>WVI needs Bluetooth to connect to your V8 health device</string>

<key>NSBluetoothPeripheralUsageDescription</key>
<string>WVI communicates with V8 for real-time health monitoring</string>

<key>UIBackgroundModes</key>
<array>
    <string>bluetooth-central</string>
    <string>bluetooth-peripheral</string>
</array>
```

### Capabilities / Возможности

**EN:** Enable in Xcode > Target > Signing & Capabilities:
- Background Modes > Uses Bluetooth LE accessories
- HealthKit (optional, for Health app integration)

**RU:** Включите в Xcode > Target > Signing & Capabilities:
- Background Modes > Uses Bluetooth LE accessories
- HealthKit (опционально, для интеграции с приложением Здоровье)

## 5.3 BleSDK_V8 — CoreBluetooth Manager

```swift
import CoreBluetooth
import Combine

// MARK: - V8 BLE Constants
enum V8BLE {
    static let serviceUUID = CBUUID(string: "FFF0")
    static let writeCharUUID = CBUUID(string: "FFF6")
    static let notifyCharUUID = CBUUID(string: "FFF7")
}

// MARK: - V8 Packet Types
enum V8PacketType {
    case heartRate(bpm: Int, confidence: Int)
    case hrv(rmssd: Float, sdnn: Float, pnn50: Float)
    case spo2(percentage: Int, pi: Float)
    case temperature(celsius: Float)
    case ecg(samples: [Float], sampleRate: Int)
    case bloodPressure(systolic: Int, diastolic: Int, pulse: Int)
    case stress(score: Int)
    case ppi(intervalMs: Int, coherence: Float)
    case battery(percentage: Int)
    case firmwareVersion(version: String)
    case unknown(opCode: UInt8, data: Data)
}

// MARK: - V8 Commands
enum V8Command {
    case startHeartRate
    case stopHeartRate
    case startSpO2
    case stopSpO2
    case startTemperature
    case stopTemperature
    case startECG
    case stopECG
    case startBloodPressure
    case stopBloodPressure
    case startStress
    case startPPI
    case stopPPI
    case startAutoMonitor(intervalSeconds: UInt16)
    case stopAutoMonitor
    case getBattery
    case getFirmwareVersion
    case syncAllData

    var opCode: UInt8 {
        switch self {
        case .startHeartRate: return 0x01
        case .stopHeartRate: return 0x02
        case .startSpO2: return 0x03
        case .stopSpO2: return 0x04
        case .startTemperature: return 0x05
        case .stopTemperature: return 0x06
        case .startECG: return 0x07
        case .stopECG: return 0x08
        case .startBloodPressure: return 0x09
        case .stopBloodPressure: return 0x0A
        case .startStress: return 0x0B
        case .startPPI: return 0x0C
        case .stopPPI: return 0x0D
        case .startAutoMonitor: return 0x10
        case .stopAutoMonitor: return 0x11
        case .getBattery: return 0x20
        case .getFirmwareVersion: return 0x21
        case .syncAllData: return 0x30
        }
    }

    var data: Data {
        var bytes: [UInt8] = [0xAB, opCode]
        switch self {
        case .startAutoMonitor(let interval):
            bytes.append(2) // param length
            bytes.append(UInt8(interval >> 8))
            bytes.append(UInt8(interval & 0xFF))
        default:
            bytes.append(0) // no params
        }
        let checksum = bytes.reduce(0, { $0 ^ $1 })
        bytes.append(checksum)
        return Data(bytes)
    }
}

// MARK: - BLE Manager
class V8BleManager: NSObject, ObservableObject {

    @Published var isScanning = false
    @Published var isConnected = false
    @Published var discoveredDevices: [CBPeripheral] = []
    @Published var latestPacket: V8PacketType?
    @Published var error: String?

    // Current readings
    @Published var heartRate: Int = 0
    @Published var hrv: Float = 0
    @Published var spo2: Int = 0
    @Published var temperature: Float = 0
    @Published var stress: Int = 0
    @Published var battery: Int = 0

    private var centralManager: CBCentralManager!
    private var connectedPeripheral: CBPeripheral?
    private var writeCharacteristic: CBCharacteristic?
    private var notifyCharacteristic: CBCharacteristic?

    let packetPublisher = PassthroughSubject<V8PacketType, Never>()

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: .main)
    }

    func startScan() {
        guard centralManager.state == .poweredOn else {
            error = "Bluetooth is not powered on"
            return
        }
        discoveredDevices.removeAll()
        isScanning = true
        centralManager.scanForPeripherals(
            withServices: [V8BLE.serviceUUID],
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
        )
    }

    func stopScan() {
        centralManager.stopScan()
        isScanning = false
    }

    func connect(to peripheral: CBPeripheral) {
        stopScan()
        connectedPeripheral = peripheral
        peripheral.delegate = self
        centralManager.connect(peripheral, options: nil)
    }

    func disconnect() {
        guard let peripheral = connectedPeripheral else { return }
        centralManager.cancelPeripheralConnection(peripheral)
    }

    func send(_ command: V8Command) {
        guard let char = writeCharacteristic else {
            error = "Write characteristic not available"
            return
        }
        connectedPeripheral?.writeValue(command.data, for: char, type: .withResponse)
    }

    private func parsePacket(_ data: Data) -> V8PacketType {
        guard data.count >= 3, data[0] == 0xAB else {
            return .unknown(opCode: 0, data: data)
        }
        let opCode = data[1]
        let payload = data.count > 4 ? Data(data[3..<(data.count - 1)]) : Data()

        switch opCode {
        case 0x01:
            return .heartRate(
                bpm: Int(payload[0]),
                confidence: payload.count > 1 ? Int(payload[1]) : 100
            )
        case 0x02:
            return .hrv(
                rmssd: payload.toFloat(at: 0),
                sdnn: payload.toFloat(at: 4),
                pnn50: payload.toFloat(at: 8)
            )
        case 0x03:
            return .spo2(
                percentage: Int(payload[0]),
                pi: payload.toFloat(at: 1)
            )
        case 0x05:
            return .temperature(celsius: payload.toFloat(at: 0))
        case 0x09:
            return .bloodPressure(
                systolic: Int(payload[0]),
                diastolic: Int(payload[1]),
                pulse: Int(payload[2])
            )
        case 0x0B:
            return .stress(score: Int(payload[0]))
        case 0x0C:
            return .ppi(
                intervalMs: Int(payload[0]) << 8 | Int(payload[1]),
                coherence: payload.toFloat(at: 2)
            )
        case 0x20:
            return .battery(percentage: Int(payload[0]))
        case 0x21:
            return .firmwareVersion(version: String(data: payload, encoding: .utf8) ?? "unknown")
        default:
            return .unknown(opCode: opCode, data: payload)
        }
    }
}

// MARK: - CBCentralManagerDelegate
extension V8BleManager: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state != .poweredOn {
            error = "Bluetooth state: \(central.state.rawValue)"
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any], rssi RSSI: NSNumber) {
        if !discoveredDevices.contains(where: { $0.identifier == peripheral.identifier }) {
            discoveredDevices.append(peripheral)
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        isConnected = true
        peripheral.discoverServices([V8BLE.serviceUUID])
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        isConnected = false
        self.error = error?.localizedDescription
    }
}

// MARK: - CBPeripheralDelegate
extension V8BleManager: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard let service = peripheral.services?.first(where: { $0.uuid == V8BLE.serviceUUID }) else { return }
        peripheral.discoverCharacteristics([V8BLE.writeCharUUID, V8BLE.notifyCharUUID], for: service)
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        for char in service.characteristics ?? [] {
            switch char.uuid {
            case V8BLE.writeCharUUID:
                writeCharacteristic = char
            case V8BLE.notifyCharUUID:
                notifyCharacteristic = char
                peripheral.setNotifyValue(true, for: char)
            default: break
            }
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard let data = characteristic.value else { return }
        let packet = parsePacket(data)
        latestPacket = packet
        packetPublisher.send(packet)

        switch packet {
        case .heartRate(let bpm, _): heartRate = bpm
        case .hrv(let rmssd, _, _): hrv = rmssd
        case .spo2(let pct, _): spo2 = pct
        case .temperature(let c): temperature = c
        case .stress(let s): stress = s
        case .battery(let b): battery = b
        default: break
        }
    }
}

// MARK: - Data Extension
extension Data {
    func toFloat(at offset: Int) -> Float {
        guard offset + 4 <= count else { return 0 }
        let bytes = [self[offset], self[offset+1], self[offset+2], self[offset+3]]
        return bytes.withUnsafeBytes { $0.load(as: Float.self) }
    }
}
```

## 5.4 SwiftUI Usage Example / Пример использования SwiftUI

```swift
import SwiftUI

struct WviDashboardView: View {
    @StateObject private var bleManager = V8BleManager()
    @State private var wviScore: Int = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // WVI Gauge
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                        .frame(width: 200, height: 200)
                    Circle()
                        .trim(from: 0, to: CGFloat(wviScore) / 100.0)
                        .stroke(wviColor, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                        .frame(width: 200, height: 200)
                        .rotationEffect(.degrees(-90))
                    VStack {
                        Text("\(wviScore)")
                            .font(.system(size: 48, weight: .bold))
                        Text("WVI Score")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Metrics Grid
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]) {
                    MetricTile(icon: "heart.fill", label: "HR", value: "\(bleManager.heartRate) bpm", color: .red)
                    MetricTile(icon: "waveform.path.ecg", label: "HRV", value: "\(Int(bleManager.hrv)) ms", color: .green)
                    MetricTile(icon: "lungs.fill", label: "SpO2", value: "\(bleManager.spo2)%", color: .blue)
                    MetricTile(icon: "thermometer", label: "Temp", value: String(format: "%.1f°C", bleManager.temperature), color: .orange)
                    MetricTile(icon: "brain.head.profile", label: "Stress", value: "\(bleManager.stress)", color: .purple)
                    MetricTile(icon: "battery.75", label: "Battery", value: "\(bleManager.battery)%", color: .yellow)
                }
                .padding()

                // Connection
                if bleManager.isConnected {
                    HStack(spacing: 16) {
                        Button("Measure Now") {
                            bleManager.send(.startHeartRate)
                            bleManager.send(.startSpO2)
                            bleManager.send(.startTemperature)
                            bleManager.send(.startStress)
                        }
                        .buttonStyle(.borderedProminent)

                        Button("Start Monitor") {
                            bleManager.send(.startAutoMonitor(intervalSeconds: 300))
                        }
                        .buttonStyle(.bordered)
                    }
                } else {
                    Button("Scan for V8 Device") {
                        bleManager.startScan()
                    }
                    .buttonStyle(.borderedProminent)

                    ForEach(bleManager.discoveredDevices, id: \.identifier) { device in
                        Button("Connect: \(device.name ?? "V8 Device")") {
                            bleManager.connect(to: device)
                        }
                    }
                }

                if let error = bleManager.error {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
            }
            .navigationTitle("WVI Health")
        }
    }

    private var wviColor: Color {
        switch wviScore {
        case 85...100: return .green
        case 70..<85: return .teal
        case 55..<70: return .yellow
        case 40..<55: return .orange
        default: return .red
        }
    }
}

struct MetricTile: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
            Text(value)
                .font(.headline)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(8)
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}
```

## 5.5 WVI API Client (Swift) / API клиент WVI (Swift)

```swift
import Foundation

class WviApiClient {
    private let baseURL: URL
    private var accessToken: String?
    private let session = URLSession.shared
    private let decoder = JSONDecoder()

    init(baseURL: String = "https://api.wvi.health/api/v1") {
        self.baseURL = URL(string: baseURL)!
    }

    func setToken(_ token: String) {
        self.accessToken = token
    }

    private func request<T: Decodable>(_ path: String, method: String = "GET",
                                        body: Encodable? = nil) async throws -> T {
        var urlRequest = URLRequest(url: baseURL.appendingPathComponent(path))
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = accessToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body = body {
            urlRequest.httpBody = try JSONEncoder().encode(body)
        }
        let (data, response) = try await session.data(for: urlRequest)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw WviError.serverError
        }
        return try decoder.decode(T.self, from: data)
    }

    func getWviCurrent(hr: Int, hrv: Float, stress: Int, spo2: Float, temp: Float) async throws -> WviResponse {
        let path = "wvi/current?hr=\(hr)&hrv=\(hrv)&stress=\(stress)&spo2=\(spo2)&temp=\(temp)"
        return try await request(path)
    }

    func getDailyBrief() async throws -> DailyBriefResponse {
        return try await request("dashboard/daily-brief")
    }

    func getRecommendations() async throws -> RecommendationsResponse {
        return try await request("ai/recommendations")
    }

    func syncBiometrics(_ records: [[String: Any]]) async throws -> SyncResponse {
        return try await request("biometrics/sync", method: "POST",
                                 body: ["records": records] as? Encodable)
    }
}

enum WviError: Error {
    case serverError
    case unauthorized
    case networkError
}

struct WviResponse: Decodable {
    let success: Bool
    let data: WviData

    struct WviData: Decodable {
        let wvi: WviScore
        let emotion: EmotionData
        let activity: ActivityData
    }

    struct WviScore: Decodable {
        let wviScore: Float
        let level: String
    }

    struct EmotionData: Decodable {
        let primary: String
        let primaryConfidence: Float
    }

    struct ActivityData: Decodable {
        let type: String
        let category: String
        let loadLevel: Int
    }
}

struct DailyBriefResponse: Decodable {
    let success: Bool
    let data: DailyBrief

    struct DailyBrief: Decodable {
        let greeting: String
        let summary: String
        let topRecommendation: String
    }
}

struct RecommendationsResponse: Decodable {
    let success: Bool
}

struct SyncResponse: Decodable {
    let success: Bool
}
```

---

# 6. WVI Algorithm

**EN:** The WVI (Wellness Vitality Index) is computed from 10 normalized biometric metrics (each 0-100), combined with adaptive time-of-day weights, and adjusted by an emotion feedback multiplier. The result is a single score from 0 to 100.

**RU:** WVI (Wellness Vitality Index) вычисляется из 10 нормализованных биометрических метрик (каждая 0-100), объединённых с адаптивными весами по времени суток, и скорректированных мультипликатором обратной связи по эмоциям. Результат — единый показатель от 0 до 100.

## 6.1 The 10 Metrics / 10 метрик

### 1. Heart Rate Score / Показатель ЧСС

**EN:** Measures deviation from resting HR. Closer to resting = higher score.

**RU:** Измеряет отклонение от ЧСС покоя. Ближе к покою = выше показатель.

```
normalizeHR(heartRate, restingHR) = clamp(100 - |heartRate - restingHR| * 2.5)
```

**EN:** Example: HR=72, restingHR=62 => delta=10, score = 100 - 25 = 75

**RU:** Пример: ЧСС=72, ЧСС покоя=62 => дельта=10, показатель = 100 - 25 = 75

### 2. HRV Score / Показатель ВСР

**EN:** HRV normalized against age-based maximum. Higher HRV = better autonomic balance.

**RU:** ВСР нормализованная по возрастному максимуму. Выше ВСР = лучший автономный баланс.

```
ageBasedMaxHRV(age):
  <30: 74ms    <40: 62ms    <50: 52ms    <60: 42ms    60+: 35ms

normalizeHRV(hrv, age) = clamp((hrv / ageBasedMaxHRV(age)) * 100)
```

**EN:** Example: HRV=52ms, age=32 => maxHRV=62, score = (52/62)*100 = 83.9

**RU:** Пример: ВСР=52мс, возраст=32 => макс.ВСР=62, показатель = (52/62)*100 = 83.9

### 3. Stress Score / Показатель стресса

**EN:** SDK stress 0-100 (0=calm, 100=stressed). Inverted for WVI.

**RU:** Стресс SDK 0-100 (0=спокойствие, 100=стресс). Инвертирован для WVI.

```
normalizeStress(stress) = clamp(100 - stress)
```

**EN:** Example: stress=28 => score = 72

**RU:** Пример: стресс=28 => показатель = 72

### 4. SpO2 Score / Показатель SpO2

**EN:** Blood oxygen with steep penalty below 95%.

**RU:** Кислород крови с резким штрафом ниже 95%.

```
normalizeSpO2(spo2):
  >= 98%: 80 + (spo2 - 98) * 10
  95-98%: 30 + (spo2 - 95) * 16.67
  90-95%: (spo2 - 90) * 6
  < 90%:  0
```

**EN:** Example: spo2=97.5 => 30 + 2.5*16.67 = 71.7

**RU:** Пример: spo2=97.5 => 30 + 2.5*16.67 = 71.7

### 5. Temperature Score / Показатель температуры

**EN:** Deviation from personal baseline temperature.

**RU:** Отклонение от личной базовой температуры.

```
normalizeTemperature(temp, baseTemp) = clamp(100 - |temp - baseTemp| * 40)
```

**EN:** Example: temp=36.6, baseTemp=36.5 => delta=0.1, score = 100 - 4 = 96

**RU:** Пример: темп=36.6, базовая=36.5 => дельта=0.1, показатель = 100 - 4 = 96

### 6. Sleep Score / Показатель сна

**EN:** Composite of deep sleep percentage, duration, and continuity.

**RU:** Комбинация процента глубокого сна, продолжительности и непрерывности.

```
normalizeSleep(totalMinutes, deepPercent, continuity):
  deepScore = 100 if 15% <= deep <= 25%, else 100 - |deepPct - 20| * 5
  durationScore = 100 if 7h <= total <= 9h, else 100 - |hours - 8| * 20
  contScore = continuity * 100

  RESULT = deepScore * 0.35 + durationScore * 0.40 + contScore * 0.25
```

**EN:** Example: total=462min (7.7h), deep=22%, continuity=0.8 => deepScore=90, durationScore=94, contScore=80 => 90*0.35+94*0.4+80*0.25 = 89.1

**RU:** Пример: всего=462мин (7.7ч), глубокий=22%, непрерывность=0.8 => deepScore=90, durationScore=94, contScore=80 => 90*0.35+94*0.4+80*0.25 = 89.1

### 7. Activity Score / Показатель активности

**EN:** Based on steps, active minutes, and METs.

**RU:** На основе шагов, активных минут и METs.

```
normalizeActivity(steps, activeMins, mets, stepGoal=10000):
  stepRatio = min(1, steps / stepGoal)
  activeMinRatio = min(1, activeMins / 30)
  metsBonus = min(1, mets / 8) * 20

  RESULT = clamp(stepRatio * 45 + activeMinRatio * 35 + metsBonus)
```

**EN:** Example: steps=8420, activeMins=47, mets=3 => 0.842*45 + 1.0*35 + 0.375*20 = 37.89+35+7.5 = 80.4

**RU:** Пример: шаги=8420, актМин=47, мэтс=3 => 0.842*45 + 1.0*35 + 0.375*20 = 37.89+35+7.5 = 80.4

### 8. Blood Pressure Score / Показатель артериального давления

**EN:** Deviation from optimal 120/80 mmHg.

**RU:** Отклонение от оптимального 120/80 мм рт.ст.

```
normalizeBP(systolic, diastolic) = clamp(100 - (|sys - 120| + |dia - 80|) * 1.5)
```

**EN:** Example: sys=118, dia=74 => deviation = 2+6 = 8, score = 100 - 12 = 88

**RU:** Пример: сист=118, диаст=74 => отклонение = 2+6 = 8, показатель = 100 - 12 = 88

### 9. PPI Coherence Score / Показатель когерентности PPI

**EN:** Pulse-to-pulse interval coherence, 0.0-1.0 mapped to 0-100.

**RU:** Когерентность пульсовых интервалов, 0.0-1.0 отображается на 0-100.

```
normalizePPICoherence(coherence) = clamp(coherence * 100)
```

**EN:** Example: coherence=0.78 => score = 78

**RU:** Пример: когерентность=0.78 => показатель = 78

### 10. Emotional Wellbeing Score / Показатель эмоционального благополучия

**EN:** Weighted average of emotion values over the last 24 hours, with exponential recency decay (half-life ~4.6h).

**RU:** Взвешенное среднее значений эмоций за последние 24 часа с экспоненциальным затуханием по давности (полупериод ~4.6ч).

```
Emotion values:
  flow=100, meditative=95, joyful=90, excited=85, energized=85,
  relaxed=80, calm=75, focused=72, recovering=60, drowsy=50,
  stressed=35, frustrated=30, sad=25, anxious=20, angry=18,
  pain=15, fearful=12, exhausted=10

emotionalWellbeingScore(history24h):
  For each entry:
    weight = confidence * exp(-hoursAgo * 0.15)
  Return weighted average of emotion values
```

## 6.2 Adaptive Weights / Адаптивные веса

**EN:** Weights shift based on time of day and exercise state:

**RU:** Веса меняются в зависимости от времени суток и состояния тренировки:

| Metric | Default | Night (22-06) | Morning (06-10) | Workday (10-18) |
|--------|---------|---------------|-----------------|-----------------|
| HR Score | 0.09 | 0.06 | 0.06 | 0.06 |
| HRV Score | 0.18 | 0.20 | **0.28** | 0.20 |
| Stress Score | 0.15 | 0.16 | 0.15 | **0.22** |
| SpO2 Score | 0.09 | 0.06 | 0.06 | 0.06 |
| Temperature | 0.05 | 0.08 | 0.04 | 0.04 |
| Sleep Score | 0.13 | **0.25** | 0.18 | 0.08 |
| Activity Score | 0.08 | 0.03 | 0.05 | 0.12 |
| BP Score | 0.06 | 0.04 | 0.04 | 0.05 |
| PPI Coherence | 0.05 | 0.04 | 0.04 | 0.05 |
| Emotional Wellbeing | 0.12 | 0.08 | 0.10 | 0.12 |

**EN:** During exercise: HR weight drops to 0.05, Activity rises to 0.15, SpO2 rises to 0.15.

**RU:** Во время тренировки: вес ЧСС падает до 0.05, Активность растёт до 0.15, SpO2 растёт до 0.15.

## 6.3 Emotion Feedback Loop / Петля обратной связи эмоций

**EN:** The detected emotion adjusts the final WVI score via a confidence-weighted multiplier:

**RU:** Обнаруженная эмоция корректирует итоговый WVI через мультипликатор, взвешенный по уверенности:

| Emotion | Multiplier | Effect |
|---------|-----------|--------|
| flow | 1.12 | +12% max boost |
| meditative | 1.10 | +10% |
| joyful | 1.08 | +8% |
| excited | 1.06 | +6% |
| energized | 1.05 | +5% |
| relaxed | 1.04 | +4% |
| focused | 1.03 | +3% |
| calm | 1.02 | +2% |
| recovering | 1.00 | neutral |
| drowsy | 0.97 | -3% |
| stressed | 0.95 | -5% |
| frustrated | 0.93 | -7% |
| sad | 0.91 | -9% |
| anxious | 0.88 | -12% |
| angry | 0.87 | -13% |
| pain | 0.86 | -14% |
| fearful | 0.85 | -15% |
| exhausted | 0.85 | -15% |

```
applyEmotionFeedback(rawWVI, emotion, confidence):
  multiplier = EMOTION_MULTIPLIERS[emotion]
  adjusted = 1.0 + (multiplier - 1.0) * confidence
  finalWVI = clamp(rawWVI * adjusted)
```

## 6.4 WVI Levels / Уровни WVI

| Score Range | Level EN | Уровень RU | Color |
|------------|----------|------------|-------|
| 95-100 | Superb | Превосходный | Deep green |
| 85-94 | Excellent | Отличный | Green |
| 70-84 | Good | Хороший | Teal |
| 55-69 | Moderate | Умеренный | Yellow |
| 40-54 | Attention | Внимание | Orange |
| 25-39 | Critical | Критический | Red |
| 0-24 | Dangerous | Опасный | Dark red |

---

# 7. Emotion Engine — 18 Emotions

**EN:** The emotion engine uses a fuzzy logic cascade with sigmoid and bell-curve membership functions to detect 18 emotional states from biometric signals.

**RU:** Движок эмоций использует каскад нечёткой логики с сигмоидными и колоколообразными функциями принадлежности для определения 18 эмоциональных состояний из биометрических сигналов.

## 7.1 Fuzzy Math Functions / Математические функции

```
sigmoid(x, midpoint, steepness) = 1 / (1 + exp(-steepness * (x - midpoint)))
sigmoidInverse(x, midpoint, steepness) = 1 / (1 + exp(steepness * (x - midpoint)))
bellCurve(x, center, width) = exp(-(x - center)^2 / (2 * width^2))
```

**EN:** Each emotion candidate is scored by multiplying several membership function outputs together. The system picks the candidate with the highest weighted score.

**RU:** Каждый кандидат-эмоция оценивается перемножением нескольких выходов функций принадлежности. Система выбирает кандидата с наивысшим взвешенным показателем.

## 7.2 Input Signals / Входные сигналы

| Signal | Description EN | Описание RU | Unit |
|--------|---------------|-------------|------|
| heartRate | Current heart rate | Текущая ЧСС | bpm |
| hrv | Heart rate variability (RMSSD) | Вариабельность сердечного ритма | ms |
| stress | SDK stress score | Показатель стресса SDK | 0-100 |
| spo2 | Blood oxygen saturation | Насыщение крови кислородом | % |
| temperature | Skin temperature | Температура кожи | C |
| ppiCoherence | PPI coherence ratio | Когерентность PPI | 0-1 |
| ppiRMSSD | PPI RMSSD | PPI RMSSD | ms |
| sleepScore | Sleep quality score | Показатель качества сна | 0-100 |
| activityScore | Activity level score | Показатель уровня активности | 0-100 |
| systolicBP | Systolic blood pressure | Систолическое давление | mmHg |
| restingHR | Personal resting HR | Личная ЧСС покоя | bpm |
| baseTemp | Personal base temperature | Личная базовая температура | C |
| hrvTrend | HRV direction (rising/falling/stable) | Направление ВСР | string |
| hrAcceleration | HR rate of change | Скорость изменения ЧСС | bpm/s |
| timeOfDay | Current hour | Текущий час | 0-23 |

## 7.3 Emotion Detection Rules / Правила определения эмоций

**EN:** Each emotion is scored as the product of membership functions. Key factors for each:

**RU:** Каждая эмоция оценивается как произведение функций принадлежности. Ключевые факторы:

### Positive Emotions / Позитивные эмоции

**Calm (Спокойствие):** Default baseline emotion when no strong signals are detected. Low stress, stable HR close to resting, moderate HRV.

**Relaxed (Расслабленность):** High HRV (>58ms), low stress (<27), low deltaHR (<9bpm), good sleep (>58), high PPI coherence (>0.48).

**Joyful (Радость):** Good HRV (>52ms), low stress (<32), moderate HR elevation (~12bpm from resting), high coherence (>0.52), good sleep and activity.

**Energized (Энергичность):** Good HRV (>48ms), moderate stress (<38), elevated HR (~8bpm), high activity (>65), good SpO2 and sleep.

**Excited (Возбуждение):** High HRV (>55ms), low stress (<25), high HR elevation (~18bpm), high activity (>50), slight temperature rise.

### Neutral Emotions / Нейтральные эмоции

**Focused (Сосредоточенность):** HRV centered around 52ms, stress around 32, HR ~10bpm above resting, high coherence (>0.42), moderate activity.

**Meditative (Медитативность):** Very high HRV (>65ms), very low stress (<12), minimal deltaHR (<3bpm), very high coherence (>0.65), low activity.

**Recovering (Восстановление):** Rising HRV trend, moderate stress (~30), improving sleep, stable HR, moderate coherence.

**Drowsy (Сонливость):** Low deltaHR (<2bpm), low HRV (<45ms), slight temperature drop, very low activity (<10), low stress (<25). Boosted during 13:00-16:00 and after 22:00.

### Negative Emotions / Негативные эмоции

**Stressed (Стресс):** Elevated stress (>48), low HRV (<52ms), mild HR increase (+6bpm).

**Anxious (Тревожность):** High stress (>68), very low HRV (<32ms), elevated HR (+12bpm), low coherence (<0.28), low SpO2, high BP.

**Angry (Гнев):** Very high stress (>65), high HR (+22bpm), very low HRV (<38ms), high BP (>130), very low coherence (<0.35), temperature rise.

**Frustrated (Фрустрация):** Moderate stress (>45), high HR variance (>8), low HRV (<48ms), BP centered ~125.

**Fearful (Страх):** Rapid HR acceleration (>15bpm/s), very low HRV (<28ms), low SpO2 (<96%), elevated stress (>60), very low coherence (<0.20).

**Sad (Грусть):** Low HRV (<47ms), low HR (below resting), moderate stress (~40), low activity (<35), poor sleep (<55), low coherence (<0.42).

**Exhausted (Истощение):** Poor sleep (<42), moderate stress (>32), low HRV (<42ms), low SpO2, low activity (<28), low RMSSD (<22ms).

### Physiological Emotions / Физиологические состояния

**Pain/Discomfort (Боль):** Elevated HR (+10bpm), elevated stress (>45), low HRV (<40ms), temperature rise (>0.3C), very low activity, not exercising.

**Flow State (Поток):** HRV centered ~55ms, stress ~32, HR ~8bpm above resting, high coherence (>0.55), high SpO2 (>96.5%).

## 7.4 Complete 18 Emotions Table / Полная таблица 18 эмоций

| ID | Key | Emoji | EN Name | RU Название | Category EN | Категория RU |
|----|-----|-------|---------|-------------|-------------|-------------|
| 0 | calm | 😌 | Calm | Спокойствие | Positive | Позитивная |
| 1 | relaxed | 🧘 | Relaxed | Расслабленность | Positive | Позитивная |
| 2 | joyful | 😊 | Joyful | Радость | Positive | Позитивная |
| 3 | energized | ⚡ | Energized | Энергичность | Positive | Позитивная |
| 4 | excited | 🎉 | Excited | Возбуждение | Positive | Позитивная |
| 5 | focused | 🎯 | Focused | Сосредоточенность | Neutral | Нейтральная |
| 6 | meditative | 🕉 | Meditative | Медитативность | Neutral | Нейтральная |
| 7 | recovering | 🔄 | Recovering | Восстановление | Neutral | Нейтральная |
| 8 | drowsy | 😴 | Drowsy | Сонливость | Neutral | Нейтральная |
| 9 | stressed | 😰 | Stressed | Стресс | Negative | Негативная |
| 10 | anxious | 😱 | Anxious | Тревожность | Negative | Негативная |
| 11 | angry | 😤 | Angry | Гнев | Negative | Негативная |
| 12 | frustrated | 😣 | Frustrated | Фрустрация | Negative | Негативная |
| 13 | fearful | 😨 | Fearful | Страх | Negative | Негативная |
| 14 | sad | 😔 | Sad | Грусть | Negative | Негативная |
| 15 | exhausted | 😩 | Exhausted | Истощение | Negative | Негативная |
| 16 | pain | 🤕 | Pain/Discomfort | Боль/Дискомфорт | Physiological | Физиологическая |
| 17 | flow | 🌊 | Flow State | Состояние потока | Physiological | Физиологическая |

---

# 8. Activity Detector — 64 Activities

**EN:** The activity detector classifies the user's current physical activity from biometric signals, steps, and contextual data. It provides 64 activity types across 12 categories, along with HR zones, TRIMP load, and calorie calculations.

**RU:** Детектор активности классифицирует текущую физическую активность пользователя из биометрических сигналов, шагов и контекстных данных. Он предоставляет 64 типа активности в 12 категориях, а также зоны ЧСС, нагрузку TRIMP и расчёт калорий.

## 8.1 HR Zones / Зоны ЧСС

**EN:** Calculated using Karvonen formula (Heart Rate Reserve method):

**RU:** Рассчитываются по формуле Карвонена (метод резерва ЧСС):

```
reserve = maxHR - restingHR
pctReserve = (heartRate - restingHR) / reserve * 100

Zone 0: < 50% HRR  — Rest / Отдых
Zone 1: 50-60% HRR — Recovery / Восстановление
Zone 2: 60-70% HRR — Fat Burn / Жиросжигание
Zone 3: 70-80% HRR — Aerobic / Аэробная
Zone 4: 80-90% HRR — Anaerobic / Анаэробная
Zone 5: > 90% HRR  — VO2max / VO2max
```

## 8.2 TRIMP (Training Impulse) / ТРИМП

**EN:** Banister's TRIMP formula, calculated per minute:

**RU:** Формула ТРИМП Бэнистера, расчёт за минуту:

```
hrPct = (heartRate - restingHR) / (maxHR - restingHR)
deltaHRratio = max(0, hrPct - 0.5)
b = 1.92 (male) | 1.67 (female)
trimpPerMinute = deltaHRratio * exp(b * deltaHRratio)
```

## 8.3 Calories / Калории

```
caloriesPerMinute = METS * weightKg * 3.5 / 200
```

## 8.4 Load Levels / Уровни нагрузки

| Level | Name EN | Название RU |
|-------|---------|-------------|
| 0 | None | Нет |
| 1 | Minimal | Минимальная |
| 2 | Light | Лёгкая |
| 3 | Moderate | Умеренная |
| 4 | High | Высокая |
| 5 | Intense | Интенсивная |
| 6 | Extreme | Экстремальная |

## 8.5 Complete 64 Activities Table / Полная таблица 64 активностей

### Sleep / Сон (5)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 0 | deep_sleep | 😴 | Deep Sleep | Глубокий сон | 0.9 | sleep |
| 1 | light_sleep | 💤 | Light Sleep | Лёгкий сон | 0.9 | sleep |
| 2 | rem_sleep | 🌙 | REM Sleep | REM-сон | 0.9 | sleep |
| 3 | nap | 😪 | Nap | Дрёма | 0.9 | sleep |
| 4 | falling_asleep | 🥱 | Falling Asleep | Засыпание | 0.9 | sleep |

### Rest / Отдых (7)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 5 | resting | 🛋 | Resting | Отдых | 1.0 | rest |
| 6 | sitting_relaxed | 📺 | Sitting Relaxed | Сидя расслабленно | 1.0 | rest |
| 7 | sitting_working | 💻 | Sitting Working | Сидя за работой | 1.3 | rest |
| 8 | standing | 🧍 | Standing | Стоя | 1.5 | rest |
| 9 | lying_awake | 🛏 | Lying Awake | Лёжа бодрствуя | 1.0 | rest |
| 10 | phone_scrolling | 📱 | Phone Scrolling | Листание телефона | 1.0 | rest |
| 11 | watching_screen | 🎬 | Watching Screen | Просмотр экрана | 1.0 | rest |

### Walking / Ходьба (5)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 12 | stroll | 🚶 | Stroll | Прогулка | 2.0 | walking |
| 13 | walk_normal | 🚶 | Normal Walk | Обычная ходьба | 3.3 | walking |
| 14 | walk_brisk | 🏃‍♂️ | Brisk Walk | Быстрая ходьба | 4.5 | walking |
| 15 | hiking | 🥾 | Hiking | Хайкинг | 5.5 | walking |
| 16 | nordic_walking | 🏔 | Nordic Walking | Скандинавская ходьба | 5.0 | walking |

### Running / Бег (5)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 17 | jogging | 🏃 | Jogging | Джоггинг | 7.0 | running |
| 18 | run_tempo | 🏃‍♀️ | Tempo Run | Темповый бег | 9.0 | running |
| 19 | run_interval | ⚡ | Interval Run | Интервальный бег | 10.5 | running |
| 20 | sprinting | 💨 | Sprinting | Спринт | 15.0 | running |
| 21 | trail_running | 🏔 | Trail Running | Трейлраннинг | 8.5 | running |

### Cardio Machines / Кардиотренажёры (4)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 22 | cycling | 🚴 | Cycling | Велоспорт | 7.5 | cardio_machine |
| 23 | stationary_bike | 🚲 | Stationary Bike | Велотренажёр | 7.0 | cardio_machine |
| 24 | elliptical | 🔄 | Elliptical | Эллиптический | 5.5 | cardio_machine |
| 25 | rowing | 🚣 | Rowing | Гребля | 7.0 | cardio_machine |

### Strength / Силовые (5)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 26 | weight_training | 🏋️ | Weight Training | Силовая тренировка | 5.0 | strength |
| 27 | bodyweight | 💪 | Bodyweight | Собственный вес | 5.5 | strength |
| 28 | crossfit | 🏋️‍♀️ | CrossFit | КроссФит | 10.0 | strength |
| 29 | hiit | ⚡ | HIIT | ВИИТ | 12.0 | strength |
| 30 | circuit_training | 🔁 | Circuit Training | Круговая тренировка | 8.0 | strength |

### Mind-Body / Тело-разум (5)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 31 | yoga_vinyasa | 🧘 | Yoga Vinyasa | Йога Виньяса | 3.5 | mind_body |
| 32 | yoga_hot | 🔥 | Hot Yoga | Горячая йога | 5.0 | mind_body |
| 33 | pilates | 🤸 | Pilates | Пилатес | 3.0 | mind_body |
| 34 | stretching | 🙆 | Stretching | Растяжка | 2.0 | mind_body |
| 35 | meditation | 🕉 | Meditation | Медитация | 1.0 | mind_body |

### Sports / Спорт (7)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 36 | football | ⚽ | Football | Футбол | 8.0 | sports |
| 37 | basketball | 🏀 | Basketball | Баскетбол | 8.0 | sports |
| 38 | tennis | 🎾 | Tennis | Теннис | 7.0 | sports |
| 39 | badminton | 🏸 | Badminton | Бадминтон | 5.5 | sports |
| 40 | swimming | 🏊 | Swimming | Плавание | 7.0 | sports |
| 41 | martial_arts | 🥊 | Martial Arts | Боевые искусства | 8.0 | sports |
| 42 | dancing | 💃 | Dancing | Танцы | 5.5 | sports |

### Daily / Повседневные (6)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 43 | housework | 🧹 | Housework | Домашняя работа | 3.0 | daily |
| 44 | cooking | 👨‍🍳 | Cooking | Готовка | 2.5 | daily |
| 45 | driving | 🚗 | Driving | Вождение | 1.5 | daily |
| 46 | commuting | 🚌 | Commuting | Поездка на транспорте | 1.3 | daily |
| 47 | shopping | 🛍 | Shopping | Шопинг | 2.5 | daily |
| 48 | eating | 🍽 | Eating | Еда | 1.5 | daily |

### Physiological / Физиологические (7)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 49 | stress_event | 😰 | Stress Event | Стрессовое событие | 1.2 | physiological |
| 50 | panic_attack | 😱 | Panic Attack | Паническая атака | 1.5 | physiological |
| 51 | crying | 😢 | Crying | Плач | 1.2 | physiological |
| 52 | laughing | 😂 | Laughing | Смех | 1.5 | physiological |
| 53 | pain_episode | 🤕 | Pain Episode | Эпизод боли | 1.0 | physiological |
| 54 | illness | 🤒 | Illness | Болезнь | 1.0 | physiological |
| 55 | intimacy | ❤️‍🔥 | Intimacy | Близость | 2.5 | physiological |

### Recovery / Восстановление (4)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 56 | warm_up | 🏃‍♂️ | Warm Up | Разминка | 3.0 | recovery |
| 57 | cool_down | 🧊 | Cool Down | Заминка | 2.5 | recovery |
| 58 | active_recovery | 🚶‍♂️ | Active Recovery | Активное восстановление | 2.0 | recovery |
| 59 | passive_recovery | 😌 | Passive Recovery | Пассивное восстановление | 1.0 | recovery |

### Mental / Ментальные (4)

| ID | Key | Emoji | Name EN | Название RU | METs | Category |
|----|-----|-------|---------|-------------|------|----------|
| 60 | deep_work | 🧠 | Deep Work | Глубокая работа | 1.5 | mental |
| 61 | presentation | 🎤 | Presentation | Презентация | 1.8 | mental |
| 62 | exam | 📝 | Exam | Экзамен | 1.3 | mental |
| 63 | creative_flow | 🎨 | Creative Flow | Творческий поток | 1.3 | mental |

---

# 9. API Endpoints Reference

**EN:** Complete reference for all 108+ API endpoints, organized by functional group.

**RU:** Полный справочник всех 108+ API-эндпоинтов, организованных по функциональным группам.

**Response format / Формат ответа:**
```json
{
  "success": true,
  "timestamp": "2026-04-02T10:00:00.000Z",
  "data": { ... }
}
```

---

## 9.1 Auth / Аутентификация (3 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| POST | `/api/v1/auth/register` | Register new user | Регистрация пользователя |
| POST | `/api/v1/auth/login` | Login | Вход |
| POST | `/api/v1/auth/refresh` | Refresh access token | Обновление токена |

---

## 9.2 Users / Пользователи (4 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/users/me` | Get user profile | Профиль пользователя |
| PUT | `/api/v1/users/me` | Update user profile | Обновить профиль |
| GET | `/api/v1/users/me/norms` | Get personal norms (HR, HRV, SpO2, temp, stress, BP) | Персональные нормы |
| POST | `/api/v1/users/me/norms/calibrate` | Start calibration (7 days) | Начать калибровку (7 дней) |

### GET /api/v1/users/me/norms — Response Example

```json
{
  "data": {
    "hr": { "min": 55, "max": 85, "resting": 62 },
    "hrv": { "min": 35, "max": 120, "baseline": 68 },
    "spo2": { "min": 95, "max": 100 },
    "temperature": { "min": 36.1, "max": 37.2 },
    "stress": { "low": 25, "high": 70 },
    "bloodPressure": { "systolicMin": 100, "systolicMax": 130, "diastolicMin": 60, "diastolicMax": 85 }
  }
}
```

---

## 9.3 Biometrics / Биометрия (24 endpoints: 16 GET + 8 POST)

### GET Endpoints

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| POST | `/api/v1/biometrics/sync` | Sync biometric records from device | Синхронизация записей с устройства |
| GET | `/api/v1/biometrics/heart-rate` | Current HR, min, max, resting | ЧСС: текущая, мин, макс, покоя |
| GET | `/api/v1/biometrics/hrv` | RMSSD, SDNN, lnRMSSD, pNN50 | ВСР: RMSSD, SDNN, lnRMSSD, pNN50 |
| GET | `/api/v1/biometrics/spo2` | Blood oxygen saturation | Насыщение крови кислородом |
| GET | `/api/v1/biometrics/temperature` | Skin temperature | Температура кожи |
| GET | `/api/v1/biometrics/sleep` | Sleep data (total, deep, light, REM, awake) | Данные сна |
| GET | `/api/v1/biometrics/ppi` | Pulse-to-pulse intervals, coherence | Пульсовые интервалы, когерентность |
| GET | `/api/v1/biometrics/ecg` | ECG samples at 125Hz | ЭКГ-сэмплы на 125Гц |
| GET | `/api/v1/biometrics/activity` | Steps, calories, distance, active minutes | Шаги, калории, дистанция |
| GET | `/api/v1/biometrics/blood-pressure` | Systolic, diastolic, pulse | Систолическое, диастолическое, пульс |
| GET | `/api/v1/biometrics/stress` | Stress level 0-100 | Уровень стресса 0-100 |
| GET | `/api/v1/biometrics/breathing-rate` | Breaths per minute | Частота дыхания |
| GET | `/api/v1/biometrics/rmssd` | HRV RMSSD with trend | ВСР RMSSD с трендом |
| GET | `/api/v1/biometrics/coherence` | PPI coherence score 0-1 | Показатель когерентности PPI |
| GET | `/api/v1/biometrics/realtime` | All metrics in one call | Все метрики одним запросом |
| GET | `/api/v1/biometrics/summary` | Daily summary | Дневная сводка |

### POST Endpoints (Data Upload / Загрузка данных)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| POST | `/api/v1/biometrics/heart-rate` | Upload HR data | Загрузить данные ЧСС |
| POST | `/api/v1/biometrics/hrv` | Upload HRV data | Загрузить данные ВСР |
| POST | `/api/v1/biometrics/spo2` | Upload SpO2 data | Загрузить данные SpO2 |
| POST | `/api/v1/biometrics/temperature` | Upload temperature data | Загрузить данные температуры |
| POST | `/api/v1/biometrics/sleep` | Upload sleep data | Загрузить данные сна |
| POST | `/api/v1/biometrics/ppi` | Upload PPI data | Загрузить данные PPI |
| POST | `/api/v1/biometrics/ecg` | Upload ECG data | Загрузить данные ЭКГ |
| POST | `/api/v1/biometrics/activity` | Upload activity data | Загрузить данные активности |

---

## 9.4 WVI / Индекс WVI (9 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/wvi/current` | Current WVI score + emotion + activity | Текущий WVI + эмоция + активность |
| GET | `/api/v1/wvi/history` | WVI score history (30d) | История WVI (30 дней) |
| GET | `/api/v1/wvi/trends` | WVI trend analysis | Анализ трендов WVI |
| GET | `/api/v1/wvi/predict` | Predicted WVI for next 24h | Прогноз WVI на 24ч |
| POST | `/api/v1/wvi/simulate` | Simulate WVI under conditions | Симуляция WVI при условиях |
| GET | `/api/v1/wvi/circadian` | 24h circadian WVI pattern | 24ч циркадный паттерн WVI |
| GET | `/api/v1/wvi/correlations` | Metric-WVI correlations | Корреляции метрик с WVI |
| GET | `/api/v1/wvi/breakdown` | Score breakdown by metric | Разбивка по метрикам |
| GET | `/api/v1/wvi/compare` | Compare two time periods | Сравнение двух периодов |

### GET /api/v1/wvi/current — Query Parameters

| Param | Type | Default | Description EN | Описание RU |
|-------|------|---------|---------------|-------------|
| hr | number | 72 | Heart rate (bpm) | ЧСС (уд/мин) |
| hrv | number | 52 | HRV RMSSD (ms) | ВСР RMSSD (мс) |
| stress | number | 28 | Stress (0-100) | Стресс (0-100) |
| spo2 | number | 97.5 | SpO2 (%) | SpO2 (%) |
| temp | number | 36.5 | Temperature (C) | Температура (C) |
| sys | number | 118 | Systolic BP (mmHg) | Систолическое АД |
| dia | number | 76 | Diastolic BP (mmHg) | Диастолическое АД |
| coherence | number | 0.55 | PPI coherence (0-1) | Когерентность PPI |
| sleepMin | number | 420 | Total sleep minutes | Минуты сна |
| deep | number | 22 | Deep sleep percent | Процент глубокого сна |
| steps | number | 7240 | Steps | Шаги |
| activeMins | number | 35 | Active minutes | Активные минуты |
| mets | number | 0 | Current METs | Текущие METs |
| stepsPerMin | number | 0 | Steps per minute | Шагов в минуту |

---

## 9.5 Emotions / Эмоции (8 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/emotions/current` | Detect current emotion from metrics | Определить текущую эмоцию |
| GET | `/api/v1/emotions/history` | 24h emotion history | История эмоций за 24ч |
| GET | `/api/v1/emotions/wellbeing` | Emotional wellbeing score and trend | Показатель эмоционального благополучия |
| GET | `/api/v1/emotions/distribution` | 7-day emotion distribution | Распределение эмоций за 7 дней |
| GET | `/api/v1/emotions/heatmap` | 7-day hourly emotion heatmap | Тепловая карта эмоций по часам |
| GET | `/api/v1/emotions/transitions` | Emotion transition patterns | Паттерны переходов эмоций |
| GET | `/api/v1/emotions/triggers` | Emotion trigger correlations | Корреляции триггеров эмоций |
| GET | `/api/v1/emotions/streaks` | Positive/negative emotion streaks | Серии позитивных/негативных эмоций |

---

## 9.6 Activities / Активности (10 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/activities/current` | Detect current activity | Определить текущую активность |
| GET | `/api/v1/activities/history` | 24h activity history | История активности за 24ч |
| GET | `/api/v1/activities/load` | TRIMP, acute/chronic load ratio | TRIMP, отношение острой/хронической нагрузки |
| GET | `/api/v1/activities/zones` | HR zone time distribution | Распределение времени по зонам ЧСС |
| GET | `/api/v1/activities/categories` | Activity categories summary | Сводка категорий активности |
| GET | `/api/v1/activities/transitions` | Activity transition log | Журнал переходов активности |
| GET | `/api/v1/activities/sedentary` | Sedentary time analysis | Анализ времени сидения |
| GET | `/api/v1/activities/exercise-log` | Exercise history | История тренировок |
| GET | `/api/v1/activities/recovery-status` | Recovery readiness | Готовность к восстановлению |
| POST | `/api/v1/activities/manual-log` | Manually log an exercise | Ручная запись тренировки |

---

## 9.7 Sleep / Сон (7 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/sleep/last-night` | Last night's sleep data | Данные о сне прошлой ночи |
| GET | `/api/v1/sleep/score-history` | 14-day sleep score history | История оценки сна за 14 дней |
| GET | `/api/v1/sleep/architecture` | Sleep cycle architecture | Архитектура циклов сна |
| GET | `/api/v1/sleep/consistency` | Bedtime/wake consistency | Постоянство режима сна |
| GET | `/api/v1/sleep/debt` | Sleep debt calculation | Расчёт дефицита сна |
| GET | `/api/v1/sleep/phases` | Detailed phase timeline | Подробная хронология фаз сна |
| GET | `/api/v1/sleep/optimal-window` | Recommended sleep window | Рекомендуемое время сна |

---

## 9.8 AI / Искусственный интеллект (8 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/ai/interpret` | 8-perspective health interpretation | 8-перспективная интерпретация здоровья |
| GET | `/api/v1/ai/recommendations` | Prioritized health recommendations | Приоритизированные рекомендации |
| POST | `/api/v1/ai/chat` | Conversational health AI | Диалоговый ИИ здоровья |
| GET | `/api/v1/ai/explain-metric` | Explain a specific metric | Объяснить конкретную метрику |
| POST | `/api/v1/ai/explain-metric` | Explain metric with comparisons | Объяснить метрику со сравнениями |
| POST | `/api/v1/ai/action-plan` | Generate action plan | Сгенерировать план действий |
| GET | `/api/v1/ai/insights` | Pattern and anomaly insights | Инсайты по паттернам и аномалиям |
| GET | `/api/v1/ai/genius-layer` | Multi-expert synthesis | Мульти-экспертный синтез |

### GET /api/v1/ai/interpret — 8 Expert Perspectives / 8 экспертных перспектив

| Perspective | Focus EN | Фокус RU |
|-------------|----------|----------|
| doctor | Clinical vitals assessment | Клиническая оценка показателей |
| psychologist | Emotional regulation | Эмоциональная регуляция |
| neuroscientist | Autonomic nervous system | Автономная нервная система |
| biohacker | Circadian optimization | Циркадная оптимизация |
| coach | Training readiness | Готовность к тренировкам |
| nutritionist | Metabolic indicators | Метаболические показатели |
| sleepExpert | Sleep architecture quality | Качество архитектуры сна |
| dataScientist | Trends and correlations | Тренды и корреляции |

---

## 9.9 Reports / Отчёты (5 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| POST | `/api/v1/reports/generate` | Generate a report | Сгенерировать отчёт |
| GET | `/api/v1/reports/list` | List all reports | Список отчётов |
| GET | `/api/v1/reports/templates` | Available report templates | Доступные шаблоны отчётов |
| GET | `/api/v1/reports/:id` | Get report details | Детали отчёта |
| DELETE | `/api/v1/reports/:id` | Delete a report | Удалить отчёт |
| GET | `/api/v1/reports/:id/download` | Download report file | Скачать файл отчёта |

---

## 9.10 Alerts / Уведомления (7 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/alerts/list` | All alerts | Все уведомления |
| GET | `/api/v1/alerts/active` | Unacknowledged alerts only | Только неподтверждённые |
| GET | `/api/v1/alerts/settings` | Alert thresholds and channels | Пороги и каналы уведомлений |
| PUT | `/api/v1/alerts/settings` | Update alert settings | Обновить настройки уведомлений |
| GET | `/api/v1/alerts/history` | 7-day alert history | История уведомлений за 7 дней |
| POST | `/api/v1/alerts/:id/acknowledge` | Acknowledge an alert | Подтвердить уведомление |
| GET | `/api/v1/alerts/stats` | 30-day alert statistics | Статистика уведомлений за 30 дней |

---

## 9.11 Device / Устройство (6 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/device/status` | Device status, battery, firmware | Статус устройства, батарея, прошивка |
| GET | `/api/v1/device/auto-monitoring` | Auto-monitoring settings | Настройки автомониторинга |
| PUT | `/api/v1/device/auto-monitoring` | Update auto-monitoring | Обновить автомониторинг |
| POST | `/api/v1/device/sync` | Trigger device sync | Запустить синхронизацию |
| GET | `/api/v1/device/capabilities` | Device sensors and features | Датчики и возможности устройства |
| POST | `/api/v1/device/measure` | Start a spot measurement | Начать точечное измерение |
| GET | `/api/v1/device/firmware` | Firmware version and update info | Версия прошивки и обновления |

---

## 9.12 Training / Тренировки (4 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/training/recommendation` | Today's training recommendation | Рекомендация тренировки на сегодня |
| GET | `/api/v1/training/weekly-plan` | Weekly training plan | Недельный план тренировок |
| GET | `/api/v1/training/overtraining-risk` | Overtraining risk assessment | Оценка риска перетренированности |
| GET | `/api/v1/training/optimal-time` | Best time to train today | Лучшее время для тренировки |

---

## 9.13 Risk / Риски (5 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/risk/assessment` | Overall health risk assessment | Общая оценка рисков здоровья |
| GET | `/api/v1/risk/anomalies` | Detected metric anomalies (7d) | Обнаруженные аномалии метрик |
| GET | `/api/v1/risk/chronic-flags` | Chronic risk pattern flags (90d) | Флаги хронических рисков |
| GET | `/api/v1/risk/correlations` | Risk factor correlations | Корреляции факторов риска |
| GET | `/api/v1/risk/volatility` | WVI and metric volatility (30d) | Волатильность WVI и метрик |

---

## 9.14 Dashboard / Дашборд (3 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/dashboard/widgets` | Widget data for mobile/web | Данные виджетов для мобайл/веб |
| GET | `/api/v1/dashboard/daily-brief` | Morning daily brief | Утренняя ежедневная сводка |
| GET | `/api/v1/dashboard/evening-review` | Evening day review | Вечерний обзор дня |

---

## 9.15 Export / Экспорт (3 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/export/csv` | Export data as CSV | Экспорт данных в CSV |
| GET | `/api/v1/export/json` | Export data as JSON | Экспорт данных в JSON |
| GET | `/api/v1/export/health-summary` | Export health summary PDF | Экспорт сводки здоровья в PDF |

---

## 9.16 Settings / Настройки (4 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/settings` | Get all settings | Получить все настройки |
| PUT | `/api/v1/settings` | Update settings | Обновить настройки |
| GET | `/api/v1/settings/notifications` | Notification preferences | Настройки уведомлений |
| PUT | `/api/v1/settings/notifications` | Update notifications | Обновить уведомления |

---

## 9.17 Health / Здоровье сервера (2 endpoints)

| Method | Path | Description EN | Описание RU |
|--------|------|---------------|-------------|
| GET | `/api/v1/health/server-status` | Server health check | Проверка состояния сервера |
| GET | `/api/v1/health/api-version` | API version info | Информация о версии API |

---

# 10. Rust Core Architecture

**EN:** The WVI algorithm layer is designed for portability. While the reference implementation is JavaScript (Node.js), the production mobile SDKs use a Rust core compiled via FFI for maximum performance.

**RU:** Слой алгоритмов WVI спроектирован для портативности. Хотя эталонная реализация на JavaScript (Node.js), продакшн мобильные SDK используют ядро на Rust, компилируемое через FFI для максимальной производительности.

## 10.1 Crate Structure / Структура крейтов

```
wvi-core/
  Cargo.toml
  src/
    lib.rs              ← Public FFI interface
    wvi_calculator.rs   ← 10-metric WVI score
    emotion_engine.rs   ← 18-emotion fuzzy logic
    activity_detector.rs← 64-activity classifier
    normalizers.rs      ← Metric normalization functions
    fuzzy.rs            ← sigmoid, bellCurve, clamp
    types.rs            ← Shared types (WviResult, Emotion, Activity)
    ffi.rs              ← C-compatible FFI exports
  android/
    build.gradle.kts    ← JNI bindings via uniffi
  ios/
    WviCore.xcframework ← Universal binary (arm64, x86_64-sim)
```

## 10.2 Core Types / Основные типы

```rust
// types.rs
#[repr(C)]
pub struct WviInput {
    pub heart_rate: f64,
    pub hrv: f64,
    pub stress: f64,
    pub spo2: f64,
    pub temperature: f64,
    pub systolic_bp: f64,
    pub diastolic_bp: f64,
    pub ppi_coherence: f64,
    pub total_sleep_minutes: f64,
    pub deep_sleep_percent: f64,
    pub sleep_continuity: f64,
    pub steps: u32,
    pub active_minutes: u32,
    pub mets: f64,
}

#[repr(C)]
pub struct WviNorms {
    pub resting_hr: f64,
    pub base_temp: f64,
    pub age: u32,
    pub step_goal: u32,
    pub max_hr: f64,
}

#[repr(C)]
pub struct WviContext {
    pub hour: u8,
    pub is_exercising: bool,
    pub current_emotion: EmotionId,
    pub emotion_confidence: f64,
}

#[repr(C)]
pub struct WviResult {
    pub score: f64,
    pub level: WviLevel,
    pub metrics: [f64; 10],
    pub weights: [f64; 10],
    pub emotion_multiplier: f64,
    pub raw_score: f64,
}

#[repr(C)]
pub enum WviLevel {
    Superb = 0,
    Excellent = 1,
    Good = 2,
    Moderate = 3,
    Attention = 4,
    Critical = 5,
    Dangerous = 6,
}

#[repr(C)]
pub enum EmotionId {
    Calm = 0, Relaxed = 1, Joyful = 2, Energized = 3, Excited = 4,
    Focused = 5, Meditative = 6, Recovering = 7, Drowsy = 8,
    Stressed = 9, Anxious = 10, Angry = 11, Frustrated = 12,
    Fearful = 13, Sad = 14, Exhausted = 15, Pain = 16, Flow = 17,
}
```

## 10.3 FFI Exports / FFI экспорты

```rust
// ffi.rs
use std::os::raw::c_char;

#[no_mangle]
pub extern "C" fn wvi_calculate(
    input: *const WviInput,
    norms: *const WviNorms,
    context: *const WviContext,
) -> WviResult {
    let input = unsafe { &*input };
    let norms = unsafe { &*norms };
    let context = unsafe { &*context };
    crate::wvi_calculator::calculate(input, norms, context)
}

#[no_mangle]
pub extern "C" fn wvi_detect_emotion(
    input: *const WviInput,
    norms: *const WviNorms,
    hour: u8,
) -> EmotionResult {
    let input = unsafe { &*input };
    let norms = unsafe { &*norms };
    crate::emotion_engine::detect(input, norms, hour)
}

#[no_mangle]
pub extern "C" fn wvi_detect_activity(
    input: *const WviInput,
    norms: *const WviNorms,
    steps_per_min: u32,
    hour: u8,
) -> ActivityResult {
    let input = unsafe { &*input };
    let norms = unsafe { &*norms };
    crate::activity_detector::detect(input, norms, steps_per_min, hour)
}

#[no_mangle]
pub extern "C" fn wvi_version() -> *const c_char {
    b"1.0.0\0".as_ptr() as *const c_char
}
```

## 10.4 Build Commands / Команды сборки

**Android (JNI via cargo-ndk):**
```bash
cargo install cargo-ndk
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
cargo ndk -t armeabi-v7a -t arm64-v8a -t x86_64 -o ./android/src/main/jniLibs build --release
```

**iOS (Universal Framework):**
```bash
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
cargo build --release --target aarch64-apple-ios
cargo build --release --target aarch64-apple-ios-sim
xcodebuild -create-xcframework \
  -library target/aarch64-apple-ios/release/libwvi_core.a -headers include/ \
  -library target/aarch64-apple-ios-sim/release/libwvi_core.a -headers include/ \
  -output ios/WviCore.xcframework
```

---

# 11. Deployment — Docker

**EN:** WVI API is packaged as a Docker container for easy deployment.

**RU:** WVI API упакован в Docker-контейнер для лёгкого развёртывания.

## 11.1 Dockerfile

```dockerfile
FROM node:20-alpine

LABEL maintainer="WVI Engine <api@wvi.health>"
LABEL description="WVI — Wellness Vitality Index API Server (18 emotions, 64 activities, 10 metrics)"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY services/ ./services/
COPY swagger/ ./swagger/
COPY API-DOCUMENTATION.md ./
COPY .env.example ./

EXPOSE 8091

ENV PORT=8091
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8091/api/v1/health/server-status || exit 1

CMD ["node", "server.js"]
```

## 11.2 Docker Compose

```yaml
version: '3.8'

services:
  wvi-api:
    build: .
    container_name: wvi-api
    restart: unless-stopped
    ports:
      - "${PORT:-8091}:8091"
    environment:
      - PORT=8091
      - NODE_ENV=production
      - PRIVY_APP_ID=${PRIVY_APP_ID:-}
      - PRIVY_APP_SECRET=${PRIVY_APP_SECRET:-}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8091/api/v1/health/server-status"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

## 11.3 Build and Run / Сборка и запуск

```bash
# Build
docker compose build

# Run
docker compose up -d

# View logs
docker compose logs -f wvi-api

# Check health
curl http://localhost:8091/api/v1/health/server-status

# Stop
docker compose down
```

## 11.4 Environment Variables / Переменные окружения

| Variable | Default | Description EN | Описание RU |
|----------|---------|---------------|-------------|
| `PORT` | 8091 | HTTP server port | Порт HTTP-сервера |
| `NODE_ENV` | development | Environment mode | Режим окружения |
| `PRIVY_APP_ID` | (empty) | Privy app ID for auth | ID приложения Privy |
| `PRIVY_APP_SECRET` | (empty) | Privy app secret | Секрет Privy |
| `ANTHROPIC_API_KEY` | (empty) | Claude API key for AI features | API ключ Claude для ИИ |

---

# 12. Testing Scenarios

**EN:** Comprehensive curl-based testing scenarios for all major API features.

**RU:** Полные тестовые сценарии на основе curl для всех основных функций API.

## 12.1 Health Check / Проверка здоровья

```bash
# Server status
curl -s http://localhost:8091/api/v1/health/server-status | jq .

# API version
curl -s http://localhost:8091/api/v1/health/api-version | jq .
```

## 12.2 Authentication / Аутентификация

```bash
# Register
curl -s -X POST http://localhost:8091/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@wvi.health","name":"Test User","password":"secure123"}' | jq .

# Login
curl -s -X POST http://localhost:8091/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@wvi.health","password":"secure123"}' | jq .

# Refresh token
curl -s -X POST http://localhost:8091/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock"}' | jq .
```

## 12.3 WVI Score — Various Scenarios / Различные сценарии

```bash
TOKEN="dev-token"

# Scenario 1: Healthy, resting
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/wvi/current?hr=62&hrv=68&stress=15&spo2=99&temp=36.5&sys=118&dia=74&coherence=0.78&sleepMin=480&deep=22&steps=10000&activeMins=45" | jq .

# Scenario 2: Stressed office worker
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/wvi/current?hr=85&hrv=35&stress=72&spo2=97&temp=36.8&sys=135&dia=88&coherence=0.32&sleepMin=360&deep=12&steps=3000&activeMins=10" | jq .

# Scenario 3: During exercise
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/wvi/current?hr=155&hrv=22&stress=60&spo2=96&temp=37.2&sys=145&dia=70&coherence=0.25&sleepMin=420&deep=20&steps=8000&activeMins=60&mets=8&stepsPerMin=160" | jq .

# Scenario 4: Sleep deprived
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/wvi/current?hr=78&hrv=32&stress=55&spo2=96&temp=36.3&sys=125&dia=82&coherence=0.35&sleepMin=240&deep=8&steps=4000&activeMins=15" | jq .

# Scenario 5: Post-meditation
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/wvi/current?hr=58&hrv=82&stress=8&spo2=99&temp=36.4&sys=112&dia=70&coherence=0.88&sleepMin=480&deep=24&steps=7000&activeMins=30" | jq .
```

## 12.4 Emotions / Эмоции

```bash
# Current emotion detection
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/emotions/current?hr=72&hrv=52&stress=28&spo2=97.5&temp=36.5&coherence=0.55" | jq .

# Emotion history
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/emotions/history" | jq .

# Emotion distribution
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/emotions/distribution" | jq .

# Emotion heatmap
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/emotions/heatmap" | jq .
```

## 12.5 Activities / Активности

```bash
# Current activity detection
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/activities/current?hr=72&hrv=52&stress=28&stepsPerMin=0" | jq .

# Activity with walking
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/activities/current?hr=95&hrv=42&stress=30&stepsPerMin=100&stepCadence=0.7" | jq .

# Activity load and TRIMP
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/activities/load" | jq .

# Recovery status
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/activities/recovery-status" | jq .
```

## 12.6 Biometrics / Биометрия

```bash
# Real-time all metrics
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/biometrics/realtime" | jq .

# Upload heart rate data
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8091/api/v1/biometrics/heart-rate" \
  -d '{"records":[{"ts":"2026-04-02T10:00:00Z","value":72},{"ts":"2026-04-02T10:05:00Z","value":75}]}' | jq .

# Sync all biometric data
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8091/api/v1/biometrics/sync" \
  -d '{"deviceId":"v8_ble_001","records":[]}' | jq .

# Daily summary
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/biometrics/summary" | jq .
```

## 12.7 AI Features / ИИ-функции

```bash
# 8-perspective interpretation
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/ai/interpret" | jq .

# Recommendations
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/ai/recommendations" | jq .

# Chat
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8091/api/v1/ai/chat" \
  -d '{"message":"Why is my HRV low today?"}' | jq .

# Explain a metric
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8091/api/v1/ai/explain-metric" \
  -d '{"metric":"hrv","value":48}' | jq .

# Genius layer
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/ai/genius-layer" | jq .
```

## 12.8 Sleep / Сон

```bash
# Last night
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/sleep/last-night" | jq .

# Sleep architecture
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/sleep/architecture" | jq .

# Sleep debt
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/sleep/debt" | jq .

# Optimal sleep window
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/sleep/optimal-window" | jq .
```

## 12.9 Dashboard / Дашборд

```bash
# Morning brief
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/dashboard/daily-brief" | jq .

# Evening review
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/dashboard/evening-review" | jq .

# Widgets
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/dashboard/widgets" | jq .
```

## 12.10 Export / Экспорт

```bash
# CSV export
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/export/csv"

# JSON export
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/export/json" | jq .

# Health summary
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/export/health-summary" | jq .
```

## 12.11 Device / Устройство

```bash
# Device status
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/device/status" | jq .

# Device capabilities
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/device/capabilities" | jq .

# Firmware info
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/device/firmware" | jq .
```

## 12.12 Error Scenarios / Сценарии ошибок

```bash
# Missing auth token (401)
curl -s "http://localhost:8091/api/v1/wvi/current" | jq .

# Invalid auth token (401)
curl -s -H "Authorization: Bearer invalid_token" \
  "http://localhost:8091/api/v1/wvi/current" | jq .

# Non-existent endpoint (404)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8091/api/v1/nonexistent" | jq .
```

---

# Appendix A — Emotions Reference

## Full Emotions Table with Fuzzy Logic Parameters / Полная таблица эмоций с параметрами нечёткой логики

| ID | Emoji | Key | EN Name | RU Название | Category | Weight | Primary Signals |
|----|-------|-----|---------|-------------|----------|--------|----------------|
| 0 | 😌 | calm | Calm | Спокойствие | positive | default | Low stress, stable HR, moderate HRV |
| 1 | 🧘 | relaxed | Relaxed | Расслабленность | positive | 0.85 | HRV>58, stress<27, deltaHR<9 |
| 2 | 😊 | joyful | Joyful | Радость | positive | 0.72 | HRV>52, stress<32, deltaHR~12 |
| 3 | ⚡ | energized | Energized | Энергичность | positive | 0.80 | HRV>48, stress<38, activity>65 |
| 4 | 🎉 | excited | Excited | Возбуждение | positive | 0.73 | HRV>55, stress<25, deltaHR~18 |
| 5 | 🎯 | focused | Focused | Сосредоточенность | neutral | 0.78 | HRV~52, stress~32, coherence>0.42 |
| 6 | 🕉 | meditative | Meditative | Медитативность | neutral | 0.88 | HRV>65, stress<12, coherence>0.65 |
| 7 | 🔄 | recovering | Recovering | Восстановление | neutral | 0.75 | HRV rising, stress~30, sleep>42 |
| 8 | 😴 | drowsy | Drowsy | Сонливость | neutral | 0.74 | deltaHR<2, HRV<45, activity<10 |
| 9 | 😰 | stressed | Stressed | Стресс | negative | 0.85 | stress>48, HRV<52, deltaHR>6 |
| 10 | 😱 | anxious | Anxious | Тревожность | negative | 0.95 | stress>68, HRV<32, deltaHR>12 |
| 11 | 😤 | angry | Angry | Гнев | negative | 1.00 | stress>65, deltaHR>22, HRV<38 |
| 12 | 😣 | frustrated | Frustrated | Фрустрация | negative | 0.76 | stress>45, HR variance>8 |
| 13 | 😨 | fearful | Fearful | Страх | negative | 0.90 | hrAccel>15, HRV<28, SpO2<96 |
| 14 | 😔 | sad | Sad | Грусть | negative | 0.80 | HRV<47, low deltaHR, low activity |
| 15 | 😩 | exhausted | Exhausted | Истощение | negative | 0.88 | sleep<42, HRV<42, activity<28 |
| 16 | 🤕 | pain | Pain/Discomfort | Боль/Дискомфорт | physiological | 0.82 | deltaHR>10, stress>45, temp>+0.3C |
| 17 | 🌊 | flow | Flow State | Состояние потока | physiological | 0.85 | HRV~55, stress~32, coherence>0.55 |

## Emotion Value Scores / Значения эмоций для WVI

| Emotion | Value | WVI Multiplier |
|---------|-------|---------------|
| flow | 100 | 1.12 |
| meditative | 95 | 1.10 |
| joyful | 90 | 1.08 |
| excited | 85 | 1.06 |
| energized | 85 | 1.05 |
| relaxed | 80 | 1.04 |
| calm | 75 | 1.02 |
| focused | 72 | 1.03 |
| recovering | 60 | 1.00 |
| drowsy | 50 | 0.97 |
| stressed | 35 | 0.95 |
| frustrated | 30 | 0.93 |
| sad | 25 | 0.91 |
| anxious | 20 | 0.88 |
| angry | 18 | 0.87 |
| pain | 15 | 0.86 |
| fearful | 12 | 0.85 |
| exhausted | 10 | 0.85 |

---

# Appendix B — Activities Reference

## Activity Categories Summary / Сводка категорий активностей

| Category EN | Категория RU | Count | METs Range | Examples |
|-------------|-------------|-------|------------|----------|
| Sleep | Сон | 5 | 0.9 | deep_sleep, light_sleep, rem_sleep, nap, falling_asleep |
| Rest | Отдых | 7 | 1.0-1.5 | resting, sitting_relaxed, sitting_working, standing |
| Walking | Ходьба | 5 | 2.0-5.5 | stroll, walk_normal, walk_brisk, hiking, nordic_walking |
| Running | Бег | 5 | 7.0-15.0 | jogging, run_tempo, run_interval, sprinting, trail_running |
| Cardio Machine | Кардиотренажёры | 4 | 5.5-7.5 | cycling, stationary_bike, elliptical, rowing |
| Strength | Силовые | 5 | 5.0-12.0 | weight_training, bodyweight, crossfit, hiit, circuit_training |
| Mind-Body | Тело-разум | 5 | 1.0-5.0 | yoga_vinyasa, yoga_hot, pilates, stretching, meditation |
| Sports | Спорт | 7 | 5.5-8.0 | football, basketball, tennis, badminton, swimming, martial_arts, dancing |
| Daily | Повседневные | 6 | 1.3-3.0 | housework, cooking, driving, commuting, shopping, eating |
| Physiological | Физиологические | 7 | 1.0-2.5 | stress_event, panic_attack, crying, laughing, pain_episode, illness, intimacy |
| Recovery | Восстановление | 4 | 1.0-3.0 | warm_up, cool_down, active_recovery, passive_recovery |
| Mental | Ментальные | 4 | 1.3-1.8 | deep_work, presentation, exam, creative_flow |

## Calorie Calculation Examples / Примеры расчёта калорий

**EN:** Formula: `calories/min = METs * weightKg * 3.5 / 200`

**RU:** Формула: `калории/мин = METs * весКг * 3.5 / 200`

| Activity | METs | 70kg cal/min | 70kg cal/30min |
|----------|------|-------------|---------------|
| Resting | 1.0 | 1.23 | 36.8 |
| Walking | 3.3 | 4.04 | 121.3 |
| Jogging | 7.0 | 8.58 | 257.3 |
| Sprinting | 15.0 | 18.38 | 551.3 |
| HIIT | 12.0 | 14.70 | 441.0 |
| Yoga | 3.5 | 4.29 | 128.6 |
| Meditation | 1.0 | 1.23 | 36.8 |

---

# Appendix C — Error Codes

## HTTP Error Responses / HTTP ответы ошибок

| Code | Name EN | Название RU | Description EN | Описание RU |
|------|---------|-------------|---------------|-------------|
| 200 | OK | Успех | Request succeeded | Запрос выполнен |
| 201 | Created | Создано | Resource created | Ресурс создан |
| 400 | Bad Request | Неверный запрос | Invalid parameters | Некорректные параметры |
| 401 | Unauthorized | Не авторизован | Missing or invalid token | Отсутствует или невалидный токен |
| 403 | Forbidden | Запрещено | Access denied | Доступ запрещён |
| 404 | Not Found | Не найдено | Endpoint not found | Эндпоинт не найден |
| 429 | Too Many Requests | Слишком много запросов | Rate limit exceeded | Превышен лимит запросов |
| 500 | Internal Server Error | Внутренняя ошибка | Server error | Ошибка сервера |

## Authentication Errors / Ошибки аутентификации

| Error Message | Cause EN | Причина RU |
|--------------|----------|-----------|
| `Missing or invalid Authorization header` | No Bearer token in request | Нет Bearer-токена в запросе |
| `Privy token verification failed` | Token expired or invalid | Токен истёк или невалидный |
| `Privy auth error: <message>` | Privy service unreachable | Сервис Privy недоступен |

## Error Response Format / Формат ответа ошибки

```json
{
  "success": false,
  "error": "Not found"
}
```

```json
{
  "error": "Missing or invalid Authorization header"
}
```

---

# Appendix D — Glossary

| Term EN | Термин RU | Definition EN | Определение RU |
|---------|-----------|---------------|----------------|
| WVI | WVI | Wellness Vitality Index — composite health score 0-100 | Индекс жизненной активности — комплексный показатель здоровья 0-100 |
| HRV | ВСР | Heart Rate Variability — time variation between heartbeats | Вариабельность сердечного ритма — временная вариация между сердцебиениями |
| RMSSD | RMSSD | Root Mean Square of Successive Differences (HRV metric) | Среднеквадратичное отклонение последовательных разностей (метрика ВСР) |
| SDNN | SDNN | Standard Deviation of NN intervals | Стандартное отклонение NN-интервалов |
| pNN50 | pNN50 | Percentage of NN intervals differing by >50ms | Процент NN-интервалов с разницей >50мс |
| SpO2 | SpO2 | Blood oxygen saturation percentage | Процент насыщения крови кислородом |
| PPI | PPI | Pulse-to-Pulse Interval — time between pulse peaks | Пульсовый интервал — время между пиками пульса |
| PPG | ФПГ | Photoplethysmography — optical pulse sensing | Фотоплетизмография — оптическое измерение пульса |
| ECG | ЭКГ | Electrocardiogram — electrical heart activity | Электрокардиограмма — электрическая активность сердца |
| METs | METs | Metabolic Equivalent of Task — energy expenditure ratio | Метаболический эквивалент — соотношение затрат энергии |
| TRIMP | ТРИМП | Training Impulse — workload quantification (Banister) | Тренировочный импульс — количественная оценка нагрузки (Бэнистер) |
| BLE | BLE | Bluetooth Low Energy | Bluetooth с низким энергопотреблением |
| JWT | JWT | JSON Web Token — authentication token standard | JSON Web Token — стандарт токенов аутентификации |
| Privy | Privy | Authentication-as-a-service platform | Платформа аутентификации как сервиса |
| FFI | FFI | Foreign Function Interface — cross-language calling | Интерфейс внешних функций — межъязыковые вызовы |
| Fuzzy Logic | Нечёткая логика | Logic dealing with approximate reasoning | Логика работающая с приблизительными рассуждениями |
| Sigmoid | Сигмоида | S-shaped activation function | S-образная функция активации |
| Bell Curve | Колокольная кривая | Gaussian distribution function | Функция нормального распределения |
| Circadian | Циркадный | Related to 24-hour biological cycle | Связанный с 24-часовым биологическим циклом |
| Coherence | Когерентность | Measure of heart rhythm pattern stability | Мера стабильности паттерна сердечного ритма |
| Acute Load | Острая нагрузка | Short-term training stress (7 days) | Краткосрочный тренировочный стресс (7 дней) |
| Chronic Load | Хроническая нагрузка | Long-term training stress (28 days) | Долгосрочный тренировочный стресс (28 дней) |
| Karvonen | Карвонен | HR reserve method for zone calculation | Метод резерва ЧСС для расчёта зон |
| Banister | Бэнистер | TRIMP formula for training load | Формула ТРИМП для тренировочной нагрузки |

---

**EN:** End of WVI Full Documentation. For updates, check the Swagger UI at `/api/v1/docs`.

**RU:** Конец полной документации WVI. Для обновлений проверяйте Swagger UI по адресу `/api/v1/docs`.

---

*WVI API v1.0.0 — 2026-04-02*
