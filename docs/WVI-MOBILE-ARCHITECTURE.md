# WVI Mobile Architecture

## Architectural Reference for Android, iOS, Rust Core, and BLE Protocol
## Архитектурный справочник для Android, iOS, ядра Rust и протокола BLE

**Version:** 1.0.0
**Last updated:** 2026-04-02

---

# Table of Contents / Содержание

1. [System Overview / Обзор системы](#1-system-overview)
2. [Android Architecture Stack / Стек архитектуры Android](#2-android-architecture-stack)
3. [iOS Architecture Stack / Стек архитектуры iOS](#3-ios-architecture-stack)
4. [Rust Core Layer / Ядро на Rust](#4-rust-core-layer)
5. [BLE Protocol — V8 Device / BLE-протокол — устройство V8](#5-ble-protocol--v8-device)
6. [Data Pipeline / Конвейер данных](#6-data-pipeline)
7. [Privy Authentication Flow / Поток аутентификации Privy](#7-privy-authentication-flow)
8. [Build Instructions / Инструкции по сборке](#8-build-instructions)
9. [Architecture Decision Records / Записи архитектурных решений](#9-architecture-decision-records)

---

# 1. System Overview

**EN:** The WVI mobile architecture follows a layered approach with a shared Rust core for algorithmic computation, platform-native BLE layers for device communication, and platform-native UI layers. The system communicates with the WVI API server for data persistence, AI features, and cross-device synchronization.

**RU:** Мобильная архитектура WVI следует послойному подходу с общим ядром на Rust для алгоритмических вычислений, нативными BLE-слоями для связи с устройством и нативными UI-слоями. Система взаимодействует с API-сервером WVI для сохранения данных, ИИ-функций и межустройственной синхронизации.

## High-Level Architecture / Архитектура верхнего уровня

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MOBILE CLIENTS                                     │
│                                                                              │
│  ┌─────────────────────────────┐    ┌──────────────────────────────────┐     │
│  │       ANDROID APP           │    │          iOS APP                  │     │
│  │                             │    │                                   │     │
│  │  ┌───────────────────────┐  │    │  ┌─────────────────────────────┐ │     │
│  │  │    Jetpack Compose    │  │    │  │        SwiftUI              │ │     │
│  │  │    Material 3 UI      │  │    │  │    SF Symbols, Charts      │ │     │
│  │  └───────────┬───────────┘  │    │  └─────────────┬───────────────┘ │     │
│  │              │              │    │                │                 │     │
│  │  ┌───────────┴───────────┐  │    │  ┌─────────────┴───────────────┐ │     │
│  │  │    ViewModel Layer    │  │    │  │    ObservableObject VMs     │ │     │
│  │  │  StateFlow + Coroutines│ │    │  │  @Published + Combine      │ │     │
│  │  └───────────┬───────────┘  │    │  └─────────────┬───────────────┘ │     │
│  │              │              │    │                │                 │     │
│  │  ┌───────────┴───────────┐  │    │  ┌─────────────┴───────────────┐ │     │
│  │  │   Repository Layer    │  │    │  │    Repository Layer         │ │     │
│  │  │  Room DB + Retrofit   │  │    │  │  SwiftData + URLSession    │ │     │
│  │  └───────────┬───────────┘  │    │  └─────────────┬───────────────┘ │     │
│  │              │              │    │                │                 │     │
│  │  ┌───────────┴───────────┐  │    │  ┌─────────────┴───────────────┐ │     │
│  │  │    BLE Layer (NordicSemi)│ │  │  │    BLE Layer (CoreBluetooth)│ │     │
│  │  │  V8BleManager + Scanner │ │  │  │  V8BleManager + Scanner    │ │     │
│  │  └───────────┬───────────┘  │    │  └─────────────┬───────────────┘ │     │
│  │              │              │    │                │                 │     │
│  │  ┌───────────┴───────────┐  │    │  ┌─────────────┴───────────────┐ │     │
│  │  │   Rust Core (JNI)    │  │    │  │   Rust Core (C FFI)        │ │     │
│  │  │   wvi-core.so        │  │    │  │   WviCore.xcframework      │ │     │
│  │  └───────────────────────┘  │    │  └─────────────────────────────┘ │     │
│  └─────────────────────────────┘    └──────────────────────────────────┘     │
│                                                                              │
└──────────────────────┬───────────────────────────┬───────────────────────────┘
                       │  BLE 5.0                   │  HTTPS / JWT
                       ▼                            ▼
              ┌────────────────┐          ┌──────────────────────┐
              │  V8 BLE Device │          │    WVI API Server    │
              │  PPG ECG Accel │          │  Express.js + Privy  │
              │  Gyro Thermo   │          │  Port 8091 (Docker)  │
              └────────────────┘          └──────────────────────┘
```

## Technology Stack Summary / Сводка технологического стека

| Layer | Android | iOS | Shared |
|-------|---------|-----|--------|
| UI | Jetpack Compose + Material 3 | SwiftUI + SF Symbols | -- |
| State | ViewModel + StateFlow | ObservableObject + @Published | -- |
| Async | Kotlin Coroutines | Swift Concurrency (async/await) | -- |
| Persistence | Room DB | SwiftData / CoreData | -- |
| Networking | Retrofit + OkHttp | URLSession | -- |
| BLE | Nordic Semiconductor BLE Library | CoreBluetooth | -- |
| Auth | Privy Android SDK | Privy iOS SDK | -- |
| Algorithms | -- | -- | Rust Core (FFI) |
| Serialization | Moshi / kotlinx.serialization | Codable | -- |
| DI | Hilt / Koin | Swift DI / Swinject | -- |
| Health | Health Connect API | HealthKit | -- |

---

# 2. Android Architecture Stack

**EN:** The Android app follows MVVM (Model-View-ViewModel) with Clean Architecture layers. All BLE communication is managed through a foreground service to ensure continuous monitoring.

**RU:** Android-приложение следует MVVM (Модель-Представление-МодельПредставления) с чистой архитектурой. Вся BLE-связь управляется через foreground-сервис для обеспечения непрерывного мониторинга.

## 2.1 Package Structure / Структура пакетов

```
com.wvi.health/
├── WviApplication.kt                    ← Application class + DI setup
├── MainActivity.kt                      ← Single Activity, Compose entry
│
├── ui/                                  ← Presentation Layer
│   ├── theme/
│   │   ├── Color.kt                     ← WVI brand colors
│   │   ├── Type.kt                      ← Typography
│   │   └── Theme.kt                     ← Material 3 theme
│   ├── navigation/
│   │   ├── WviNavGraph.kt               ← Navigation graph
│   │   └── Screen.kt                    ← Route definitions
│   ├── screens/
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.kt       ← Main WVI dashboard
│   │   │   ├── DashboardViewModel.kt    ← Dashboard state
│   │   │   └── WviGauge.kt              ← Animated gauge composable
│   │   ├── metrics/
│   │   │   ├── MetricsScreen.kt         ← Detailed metrics view
│   │   │   └── MetricsViewModel.kt
│   │   ├── emotions/
│   │   │   ├── EmotionsScreen.kt        ← Emotion history + heatmap
│   │   │   └── EmotionsViewModel.kt
│   │   ├── activity/
│   │   │   ├── ActivityScreen.kt        ← Activity tracking
│   │   │   └── ActivityViewModel.kt
│   │   ├── sleep/
│   │   │   ├── SleepScreen.kt           ← Sleep analysis
│   │   │   └── SleepViewModel.kt
│   │   ├── ai/
│   │   │   ├── AiChatScreen.kt          ← AI assistant
│   │   │   └── AiViewModel.kt
│   │   └── settings/
│   │       ├── SettingsScreen.kt
│   │       └── SettingsViewModel.kt
│   └── components/
│       ├── MetricCard.kt                ← Reusable metric display
│       ├── EmotionBadge.kt              ← Emotion emoji + label
│       ├── ActivityRing.kt              ← Activity progress ring
│       └── WviChart.kt                  ← History chart
│
├── domain/                              ← Domain Layer
│   ├── model/
│   │   ├── WviScore.kt                  ← WVI score entity
│   │   ├── Emotion.kt                   ← Emotion entity
│   │   ├── Activity.kt                  ← Activity entity
│   │   ├── Biometrics.kt                ← Biometric reading entity
│   │   └── UserProfile.kt              ← User profile entity
│   ├── repository/
│   │   ├── WviRepository.kt            ← WVI data repository interface
│   │   ├── BiometricRepository.kt       ← Biometric data interface
│   │   └── UserRepository.kt           ← User data interface
│   └── usecase/
│       ├── CalculateWviUseCase.kt       ← Local WVI calculation
│       ├── DetectEmotionUseCase.kt      ← Local emotion detection
│       ├── SyncBiometricsUseCase.kt     ← Sync with server
│       └── GetRecommendationsUseCase.kt ← AI recommendations
│
├── data/                                ← Data Layer
│   ├── local/
│   │   ├── WviDatabase.kt              ← Room database
│   │   ├── dao/
│   │   │   ├── WviDao.kt               ← WVI score DAO
│   │   │   ├── BiometricDao.kt          ← Biometric DAO
│   │   │   └── EmotionDao.kt           ← Emotion DAO
│   │   └── entity/
│   │       ├── WviEntity.kt
│   │       ├── BiometricEntity.kt
│   │       └── EmotionEntity.kt
│   ├── remote/
│   │   ├── WviApiService.kt            ← Retrofit API interface
│   │   ├── AuthInterceptor.kt          ← JWT injection interceptor
│   │   └── dto/
│   │       ├── WviResponse.kt
│   │       ├── EmotionResponse.kt
│   │       └── ActivityResponse.kt
│   └── repository/
│       ├── WviRepositoryImpl.kt         ← Repository implementation
│       ├── BiometricRepositoryImpl.kt
│       └── UserRepositoryImpl.kt
│
├── ble/                                 ← BLE Layer
│   ├── V8BleManager.kt                 ← Nordic BLE manager
│   ├── V8BleScanner.kt                 ← Device scanner
│   ├── V8Command.kt                    ← BLE command definitions
│   ├── V8Packet.kt                     ← Packet data classes
│   ├── V8PacketParser.kt               ← Byte array parser
│   ├── V8MonitoringService.kt          ← Foreground service
│   └── V8ConnectionState.kt            ← Connection state sealed class
│
├── core/                                ← Rust Core Bridge
│   ├── WviCore.kt                      ← JNI bridge class
│   ├── WviCoreBindings.kt              ← uniffi generated bindings
│   └── RustTypes.kt                    ← Kotlin equivalents of Rust types
│
├── auth/                                ← Authentication
│   ├── PrivyAuthManager.kt             ← Privy SDK wrapper
│   ├── TokenStore.kt                   ← Encrypted token storage
│   └── AuthState.kt                    ← Auth state sealed class
│
├── di/                                  ← Dependency Injection
│   ├── AppModule.kt                    ← Application-scoped
│   ├── NetworkModule.kt                ← Retrofit, OkHttp
│   ├── DatabaseModule.kt               ← Room database
│   └── BleModule.kt                    ← BLE manager
│
└── util/
    ├── Extensions.kt                    ← Kotlin extensions
    ├── DateUtils.kt                     ← Date formatting
    └── Constants.kt                     ← App constants
```

## 2.2 Key Architecture Patterns / Ключевые архитектурные паттерны

### Unidirectional Data Flow (UDF) / Однонаправленный поток данных

```
┌──────────────────────────────────────────────┐
│                 Compose UI                    │
│                                              │
│   @Composable DashboardScreen(               │
│     viewModel: DashboardViewModel            │
│   )                                          │
│                                              │
│   state = viewModel.state.collectAsState()   │
│                                              │
│   ┌───────────┐    ┌──────────────────────┐  │
│   │  UI State  │◄───│  StateFlow<State>    │  │
│   │  (read)    │    │  (single source)     │  │
│   └───────────┘    └──────────────────────┘  │
│                              ▲                │
│   ┌───────────┐              │                │
│   │  Events   │──────────────┘                │
│   │  (intents)│   viewModel.onAction(action)  │
│   └───────────┘                               │
└──────────────────────────────────────────────┘
```

**EN:** The ViewModel exposes a single `StateFlow<UiState>` and receives user actions via function calls. This ensures a single source of truth and predictable state management.

**RU:** ViewModel предоставляет единый `StateFlow<UiState>` и получает действия пользователя через вызовы функций. Это обеспечивает единый источник истины и предсказуемое управление состоянием.

### BLE Foreground Service Pattern / Паттерн BLE Foreground Service

```
┌─────────────────────────────────────────────────┐
│            V8MonitoringService                    │
│            (Foreground Service)                   │
│                                                  │
│  onCreate() ──► startForeground(notification)     │
│                                                  │
│  ┌──────────────────────────────────┐            │
│  │         V8BleManager             │            │
│  │                                  │            │
│  │  connect() ──► discoverServices()│            │
│  │  ──► enableNotifications(FFF7)   │            │
│  │  ──► collect dataFlow            │            │
│  │                                  │            │
│  │  dataFlow.collect { packet ->    │            │
│  │    when (packet.type) {          │            │
│  │      HR -> save + broadcast      │            │
│  │      HRV -> save + broadcast     │            │
│  │      ...                         │            │
│  │    }                             │            │
│  │  }                               │            │
│  └──────────────────────────────────┘            │
│                                                  │
│  Every 5 min: sendCommand(AutoMeasure)            │
│  On data: LocalBroadcastManager.send(intent)      │
│  On data: Room DB insert                          │
│  Every 30 min: API sync (Retrofit)                │
│                                                  │
│  onDestroy() ──► bleManager.disconnect()          │
└─────────────────────────────────────────────────┘
```

**EN:** The foreground service ensures BLE connection persists when the app is backgrounded. It handles device communication, local persistence, and API synchronization.

**RU:** Foreground-сервис обеспечивает сохранение BLE-соединения когда приложение в фоне. Он управляет связью с устройством, локальным сохранением и синхронизацией с API.

### Room Database Schema / Схема базы данных Room

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  biometric_data  │    │    wvi_scores     │    │    emotions       │
│                  │    │                  │    │                  │
│  id (PK)         │    │  id (PK)         │    │  id (PK)         │
│  type (TEXT)     │    │  score (REAL)     │    │  emotion (TEXT)  │
│  value (REAL)    │    │  level (TEXT)     │    │  confidence (REAL)│
│  timestamp (INT) │    │  timestamp (INT)  │    │  timestamp (INT) │
│  synced (BOOL)   │    │  metrics (TEXT)   │    │  synced (BOOL)   │
│  deviceId (TEXT)  │    │  weights (TEXT)   │    │                  │
└──────────────────┘    │  emotion (TEXT)   │    └──────────────────┘
                        │  synced (BOOL)    │
                        └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│   activities      │    │   sleep_records   │
│                  │    │                  │
│  id (PK)         │    │  id (PK)         │
│  type (TEXT)     │    │  startTime (INT)  │
│  category (TEXT)  │    │  endTime (INT)   │
│  startTime (INT)  │    │  score (REAL)    │
│  endTime (INT)   │    │  deepMin (INT)   │
│  loadLevel (INT)  │    │  lightMin (INT)  │
│  calories (REAL)  │    │  remMin (INT)    │
│  trimp (REAL)    │    │  awakeMin (INT)   │
│  synced (BOOL)   │    │  efficiency (REAL)│
└──────────────────┘    │  synced (BOOL)    │
                        └──────────────────┘
```

## 2.3 Data Flow: BLE to UI / Поток данных: BLE → UI

```
V8 Device                 Android App
─────────                 ───────────

BLE Notify (FFF7)
    │
    ▼
V8BleManager
    │ SharedFlow<V8Packet>
    ▼
V8MonitoringService
    │
    ├──► Room DB (insert biometric record)
    │
    ├──► LocalBroadcast (for active UI)
    │
    └──► Rust Core (calculate WVI locally)
              │
              ├──► WVI score → Room DB
              └──► Emotion → Room DB
                        │
                        ▼
              Repository (Room DAO)
                        │
                        ▼
              ViewModel (StateFlow)
                        │
                        ▼
              Compose UI (recomposition)
```

## 2.4 Dependency Injection / Внедрение зависимостей

```kotlin
// AppModule.kt (Hilt)
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideV8BleManager(@ApplicationContext context: Context): V8BleManager =
        V8BleManager(context)

    @Provides
    @Singleton
    fun provideWviDatabase(@ApplicationContext context: Context): WviDatabase =
        Room.databaseBuilder(context, WviDatabase::class.java, "wvi-db")
            .addMigrations(MIGRATION_1_2)
            .build()

    @Provides
    @Singleton
    fun provideWviApiService(authInterceptor: AuthInterceptor): WviApiService {
        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl("https://api.wvi.health/api/v1/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
            .create(WviApiService::class.java)
    }

    @Provides
    @Singleton
    fun providePrivyAuthManager(@ApplicationContext context: Context): PrivyAuthManager =
        PrivyAuthManager(context)
}
```

---

# 3. iOS Architecture Stack

**EN:** The iOS app follows MVVM with SwiftUI, leveraging Combine for reactive data flow and CoreBluetooth for BLE communication. The app uses a background task for continuous monitoring.

**RU:** iOS-приложение следует MVVM со SwiftUI, используя Combine для реактивного потока данных и CoreBluetooth для BLE-связи. Приложение использует фоновую задачу для непрерывного мониторинга.

## 3.1 Project Structure / Структура проекта

```
WVI/
├── WVIApp.swift                          ← App entry point
├── ContentView.swift                     ← Root navigation
│
├── Views/                                ← UI Layer
│   ├── Dashboard/
│   │   ├── DashboardView.swift           ← Main WVI dashboard
│   │   ├── WviGaugeView.swift            ← Animated gauge
│   │   └── MetricGridView.swift          ← Metric tiles
│   ├── Metrics/
│   │   ├── MetricsDetailView.swift
│   │   └── ChartViews.swift              ← Swift Charts
│   ├── Emotions/
│   │   ├── EmotionTimelineView.swift
│   │   └── EmotionHeatmapView.swift
│   ├── Activity/
│   │   ├── ActivityView.swift
│   │   └── ZoneRingsView.swift
│   ├── Sleep/
│   │   ├── SleepView.swift
│   │   └── SleepArchitectureView.swift
│   ├── AI/
│   │   ├── AIChatView.swift
│   │   └── InsightsView.swift
│   ├── Settings/
│   │   └── SettingsView.swift
│   └── Components/
│       ├── MetricTile.swift
│       ├── EmotionBadge.swift
│       └── WviLineChart.swift
│
├── ViewModels/                           ← ViewModel Layer
│   ├── DashboardViewModel.swift
│   ├── MetricsViewModel.swift
│   ├── EmotionsViewModel.swift
│   ├── ActivityViewModel.swift
│   ├── SleepViewModel.swift
│   ├── AIViewModel.swift
│   └── SettingsViewModel.swift
│
├── Models/                               ← Domain Layer
│   ├── WviScore.swift
│   ├── Emotion.swift
│   ├── Activity.swift
│   ├── Biometrics.swift
│   └── UserProfile.swift
│
├── Services/                             ← Service Layer
│   ├── BLE/
│   │   ├── V8BleManager.swift            ← CoreBluetooth manager
│   │   ├── V8Command.swift               ← Command enum
│   │   ├── V8PacketParser.swift          ← Data parser
│   │   └── V8Scanner.swift               ← Device discovery
│   ├── API/
│   │   ├── WviApiClient.swift            ← URLSession client
│   │   ├── Endpoints.swift               ← Endpoint definitions
│   │   └── DTOs.swift                    ← Decodable types
│   ├── Auth/
│   │   ├── PrivyAuthManager.swift        ← Privy SDK wrapper
│   │   └── KeychainHelper.swift          ← Token storage
│   ├── Core/
│   │   ├── WviCoreBridge.swift           ← Rust FFI bridge
│   │   └── WviCoreTypes.swift            ← Swift types for FFI
│   └── Persistence/
│       ├── WviStore.swift                ← SwiftData store
│       └── Models/
│           ├── BiometricRecord.swift
│           ├── WviRecord.swift
│           └── EmotionRecord.swift
│
├── Utilities/
│   ├── Extensions/
│   │   ├── Date+Extensions.swift
│   │   ├── Color+WVI.swift
│   │   └── Data+Parsing.swift
│   └── Constants.swift
│
└── Resources/
    ├── Assets.xcassets
    └── Info.plist
```

## 3.2 SwiftUI + Combine Pattern / Паттерн SwiftUI + Combine

```
┌──────────────────────────────────────────────┐
│              SwiftUI View                     │
│                                              │
│  struct DashboardView: View {                │
│    @StateObject var vm = DashboardViewModel()│
│                                              │
│    var body: some View {                     │
│      VStack {                                │
│        WviGaugeView(score: vm.wviScore)      │
│        EmotionBadge(emotion: vm.emotion)     │
│        MetricGrid(metrics: vm.metrics)       │
│      }                                       │
│      .onAppear { vm.startMonitoring() }      │
│    }                                         │
│  }                                           │
│                                              │
└──────────────────┬───────────────────────────┘
                   │ @Published
                   │
┌──────────────────┴───────────────────────────┐
│           DashboardViewModel                  │
│           (ObservableObject)                  │
│                                              │
│  @Published var wviScore: Int = 0            │
│  @Published var emotion: String = ""         │
│  @Published var metrics: [Metric] = []       │
│                                              │
│  private var cancellables = Set<AnyCancellable>()│
│                                              │
│  init() {                                    │
│    bleManager.packetPublisher                │
│      .receive(on: RunLoop.main)              │
│      .sink { [weak self] packet in           │
│        self?.handlePacket(packet)            │
│      }                                       │
│      .store(in: &cancellables)              │
│  }                                           │
│                                              │
│  func startMonitoring() {                    │
│    bleManager.send(.startAutoMonitor(300))   │
│  }                                           │
│                                              │
└──────────────────────────────────────────────┘
```

## 3.3 Background BLE Monitoring / Фоновый BLE-мониторинг

**EN:** iOS allows BLE operations in the background when `bluetooth-central` background mode is enabled. The system wakes the app to handle BLE events.

**RU:** iOS позволяет BLE-операции в фоне когда включён фоновый режим `bluetooth-central`. Система пробуждает приложение для обработки BLE-событий.

```
┌───────────────────────────────────────────────────┐
│              iOS Background BLE Flow               │
│                                                   │
│  Foreground:                                      │
│    CBCentralManager(delegate: self, queue: .main) │
│    ──► scan ──► connect ──► discoverServices      │
│    ──► enableNotifications(FFF7)                  │
│                                                   │
│  App enters background:                           │
│    ──► BLE connection maintained                  │
│    ──► Notifications still received               │
│    ──► didUpdateValueFor: called                  │
│                                                   │
│  Background processing:                           │
│    ──► Parse packet                               │
│    ──► Store in SwiftData                         │
│    ──► Calculate local WVI (Rust core)            │
│    ──► Schedule local notification if alert       │
│                                                   │
│  State restoration:                               │
│    CBCentralManager(                              │
│      delegate: self,                              │
│      queue: .main,                                │
│      options: [                                   │
│        .restoreIdentifierKey: "wvi-central"       │
│      ]                                            │
│    )                                              │
│                                                   │
│  centralManager(_:willRestoreState:)              │
│    ──► Reconnect to peripherals from state dict   │
└───────────────────────────────────────────────────┘
```

## 3.4 HealthKit Integration / Интеграция с HealthKit

```swift
// HealthKit data sharing
import HealthKit

class HealthKitManager {
    let store = HKHealthStore()

    let readTypes: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
        HKObjectType.quantityType(forIdentifier: .oxygenSaturation)!,
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
    ]

    let writeTypes: Set<HKSampleType> = [
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
        HKObjectType.quantityType(forIdentifier: .oxygenSaturation)!,
    ]

    func requestAuthorization() async throws {
        try await store.requestAuthorization(toShare: writeTypes, read: readTypes)
    }

    func saveHeartRate(_ bpm: Double, date: Date) async throws {
        let type = HKQuantityType(.heartRate)
        let quantity = HKQuantity(unit: .count().unitDivided(by: .minute()), doubleValue: bpm)
        let sample = HKQuantitySample(type: type, quantity: quantity, start: date, end: date)
        try await store.save(sample)
    }
}
```

---

# 4. Rust Core Layer

**EN:** The Rust core implements the three main algorithms (WVI calculator, emotion engine, activity detector) in a cross-platform library compiled to native binaries for Android (JNI) and iOS (C FFI). This ensures consistent results across platforms with maximum performance.

**RU:** Ядро на Rust реализует три основных алгоритма (калькулятор WVI, движок эмоций, детектор активности) в кросс-платформенной библиотеке, компилируемой в нативные бинарники для Android (JNI) и iOS (C FFI). Это обеспечивает согласованные результаты на всех платформах с максимальной производительностью.

## 4.1 Crate Layout / Структура крейта

```
wvi-core/
├── Cargo.toml
├── cbindgen.toml                         ← C header generation config
├── uniffi.toml                           ← Android bindings config
├── src/
│   ├── lib.rs                            ← Public API
│   ├── wvi_calculator.rs                 ← 10-metric WVI scoring
│   │   ├── normalizers (10 functions)
│   │   ├── adaptive_weights (4 time profiles)
│   │   ├── emotion_feedback
│   │   └── calculate() → WviResult
│   ├── emotion_engine.rs                 ← 18-emotion fuzzy cascade
│   │   ├── fuzzy_functions (sigmoid, bellCurve)
│   │   ├── 18 emotion scoring blocks
│   │   └── detect() → EmotionResult
│   ├── activity_detector.rs              ← 64-activity classifier
│   │   ├── hr_zone()
│   │   ├── trimp_per_minute()
│   │   ├── calories_per_minute()
│   │   └── detect() → ActivityResult
│   ├── types.rs                          ← Shared data types
│   ├── fuzzy.rs                          ← Math primitives
│   └── ffi.rs                            ← C-compatible exports
├── android/
│   ├── build.gradle.kts                  ← JNI packaging
│   └── src/main/kotlin/
│       └── WviCore.kt                    ← uniffi generated
├── ios/
│   ├── WviCore.xcframework/              ← Universal framework
│   └── include/
│       └── wvi_core.h                    ← cbindgen generated header
└── tests/
    ├── wvi_test.rs
    ├── emotion_test.rs
    └── activity_test.rs
```

## 4.2 Compilation Targets / Целевые платформы компиляции

| Platform | Target Triple | Output | Size (~) |
|----------|--------------|--------|----------|
| Android arm64 | `aarch64-linux-android` | `libwvi_core.so` | ~180 KB |
| Android arm32 | `armv7-linux-androideabi` | `libwvi_core.so` | ~160 KB |
| Android x86_64 | `x86_64-linux-android` | `libwvi_core.so` | ~200 KB |
| iOS arm64 | `aarch64-apple-ios` | `libwvi_core.a` | ~190 KB |
| iOS Simulator | `aarch64-apple-ios-sim` | `libwvi_core.a` | ~190 KB |
| Server (test) | `x86_64-unknown-linux-gnu` | `libwvi_core.so` | ~210 KB |

## 4.3 Android JNI Bridge / Android JNI мост

```kotlin
// WviCore.kt — JNI bridge
class WviCore {
    companion object {
        init {
            System.loadLibrary("wvi_core")
        }

        @JvmStatic
        external fun calculateWvi(
            heartRate: Double, hrv: Double, stress: Double,
            spo2: Double, temperature: Double,
            systolicBP: Double, diastolicBP: Double,
            ppiCoherence: Double,
            totalSleepMin: Double, deepSleepPct: Double, sleepContinuity: Double,
            steps: Int, activeMinutes: Int, mets: Double,
            restingHR: Double, baseTemp: Double, age: Int, stepGoal: Int,
            hour: Int, isExercising: Boolean,
            currentEmotion: Int, emotionConfidence: Double
        ): WviResultJni

        @JvmStatic
        external fun detectEmotion(
            heartRate: Double, hrv: Double, stress: Double,
            spo2: Double, temperature: Double,
            ppiCoherence: Double, ppiRmssd: Double,
            sleepScore: Double, activityScore: Double, systolicBP: Double,
            restingHR: Double, baseTemp: Double, hour: Int
        ): EmotionResultJni

        @JvmStatic
        external fun detectActivity(
            heartRate: Double, restingHR: Double, maxHR: Double,
            hrv: Double, stress: Double, spo2: Double,
            temperature: Double, baseTemp: Double,
            ppiCoherence: Double, stepsPerMin: Int, hour: Int,
            gender: Int, weightKg: Double
        ): ActivityResultJni
    }
}

data class WviResultJni(
    val score: Double,
    val level: Int,
    val metrics: DoubleArray,
    val weights: DoubleArray,
    val emotionMultiplier: Double,
    val rawScore: Double
)

data class EmotionResultJni(
    val primaryId: Int,
    val primaryConfidence: Double,
    val secondaryId: Int,
    val secondaryConfidence: Double
)

data class ActivityResultJni(
    val typeId: Int,
    val category: String,
    val confidence: Double,
    val loadLevel: Int,
    val zone: Int,
    val trimpPerMin: Double,
    val caloriesPerMin: Double
)
```

## 4.4 iOS Swift Bridge / iOS Swift мост

```swift
// WviCoreBridge.swift
import Foundation

// C function declarations from wvi_core.h
@_silgen_name("wvi_calculate")
func wvi_calculate(_ input: UnsafePointer<WviInputC>,
                    _ norms: UnsafePointer<WviNormsC>,
                    _ context: UnsafePointer<WviContextC>) -> WviResultC

@_silgen_name("wvi_detect_emotion")
func wvi_detect_emotion(_ input: UnsafePointer<WviInputC>,
                         _ norms: UnsafePointer<WviNormsC>,
                         _ hour: UInt8) -> EmotionResultC

@_silgen_name("wvi_detect_activity")
func wvi_detect_activity(_ input: UnsafePointer<WviInputC>,
                          _ norms: UnsafePointer<WviNormsC>,
                          _ stepsPerMin: UInt32,
                          _ hour: UInt8) -> ActivityResultC

// Swift wrapper
class WviCore {
    static func calculate(metrics: WviMetrics, norms: UserNorms, context: WviContext) -> WviScore {
        var input = WviInputC(
            heart_rate: metrics.heartRate,
            hrv: metrics.hrv,
            stress: metrics.stress,
            spo2: metrics.spo2,
            temperature: metrics.temperature,
            systolic_bp: metrics.systolicBP,
            diastolic_bp: metrics.diastolicBP,
            ppi_coherence: metrics.ppiCoherence,
            total_sleep_minutes: metrics.totalSleepMinutes,
            deep_sleep_percent: metrics.deepSleepPercent,
            sleep_continuity: metrics.sleepContinuity,
            steps: UInt32(metrics.steps),
            active_minutes: UInt32(metrics.activeMinutes),
            mets: metrics.mets
        )
        var normsC = WviNormsC(
            resting_hr: norms.restingHR,
            base_temp: norms.baseTemp,
            age: UInt32(norms.age),
            step_goal: UInt32(norms.stepGoal),
            max_hr: norms.maxHR
        )
        var contextC = WviContextC(
            hour: UInt8(context.hour),
            is_exercising: context.isExercising,
            current_emotion: UInt8(context.currentEmotion.rawValue),
            emotion_confidence: context.emotionConfidence
        )

        let result = wvi_calculate(&input, &normsC, &contextC)
        return WviScore(
            score: result.score,
            level: WviLevel(rawValue: Int(result.level)) ?? .moderate,
            rawScore: result.raw_score,
            emotionMultiplier: result.emotion_multiplier
        )
    }
}
```

## 4.5 Performance Characteristics / Характеристики производительности

| Operation | JS (Node.js) | Rust (native) | Speedup |
|-----------|-------------|--------------|---------|
| WVI calculation | ~0.8ms | ~0.02ms | 40x |
| Emotion detection (18 candidates) | ~1.2ms | ~0.03ms | 40x |
| Activity detection | ~0.5ms | ~0.01ms | 50x |
| Full pipeline (WVI+emotion+activity) | ~2.5ms | ~0.06ms | 42x |

**EN:** The Rust core processes the full pipeline in under 100 microseconds, enabling real-time scoring at up to 10,000 evaluations per second on mobile hardware.

**RU:** Ядро на Rust обрабатывает полный конвейер менее чем за 100 микросекунд, что позволяет вычислять в реальном времени до 10,000 оценок в секунду на мобильном оборудовании.

---

# 5. BLE Protocol — V8 Device

**EN:** The V8 wearable communicates over Bluetooth Low Energy 5.0. All data exchange uses a single service with two characteristics: one for sending commands and one for receiving data.

**RU:** Носимое устройство V8 связывается через Bluetooth Low Energy 5.0. Весь обмен данными использует один сервис с двумя характеристиками: одна для отправки команд и одна для получения данных.

## 5.1 BLE Service Definition / Определение BLE-сервиса

```
Service: V8 Health Monitor
UUID:    0000FFF0-0000-1000-8000-00805F9B34FB

Characteristic: Command (Write)
UUID:    0000FFF6-0000-1000-8000-00805F9B34FB
Properties: Write, Write Without Response
MTU:     20 bytes default, negotiable to 512

Characteristic: Data (Notify)
UUID:    0000FFF7-0000-1000-8000-00805F9B34FB
Properties: Notify
MTU:     20 bytes default, negotiable to 512
```

## 5.2 Packet Format / Формат пакета

### Command Packet (Phone → Device) / Пакет команды

```
┌──────────┬──────────┬───────────┬───────────────────┬──────────┐
│  Header  │  OpCode  │ Param Len │    Parameters     │ Checksum │
│  0xAB    │  1 byte  │  1 byte   │  0-N bytes        │  1 byte  │
└──────────┴──────────┴───────────┴───────────────────┴──────────┘

Checksum = XOR of all bytes (Header + OpCode + ParamLen + Params)
```

### Data Packet (Device → Phone) / Пакет данных

```
┌──────────┬──────────┬───────────┬───────────────────┬──────────┐
│  Header  │  OpCode  │ Data Len  │    Payload        │ Checksum │
│  0xAB    │  1 byte  │  1 byte   │  N bytes          │  1 byte  │
└──────────┴──────────┴───────────┴───────────────────┴──────────┘
```

## 5.3 Command OpCodes / Коды операций команд

### Measurement Commands / Команды измерений

| OpCode | Command | Description EN | Описание RU | Params |
|--------|---------|---------------|-------------|--------|
| 0x01 | StartHeartRate | Start HR measurement | Начать измерение ЧСС | None |
| 0x02 | StopHeartRate | Stop HR measurement | Остановить измерение ЧСС | None |
| 0x03 | StartSpO2 | Start SpO2 measurement | Начать измерение SpO2 | None |
| 0x04 | StopSpO2 | Stop SpO2 measurement | Остановить измерение SpO2 | None |
| 0x05 | StartTemperature | Start temperature | Начать измерение температуры | None |
| 0x06 | StopTemperature | Stop temperature | Остановить измерение температуры | None |
| 0x07 | StartECG | Start ECG recording | Начать запись ЭКГ | None |
| 0x08 | StopECG | Stop ECG recording | Остановить запись ЭКГ | None |
| 0x09 | StartBloodPressure | Start BP measurement | Начать измерение АД | None |
| 0x0A | StopBloodPressure | Stop BP measurement | Остановить измерение АД | None |
| 0x0B | StartStress | Start stress measurement | Начать измерение стресса | None |
| 0x0C | StartPPI | Start PPI streaming | Начать PPI-поток | None |
| 0x0D | StopPPI | Stop PPI streaming | Остановить PPI-поток | None |

### Monitoring Commands / Команды мониторинга

| OpCode | Command | Description EN | Описание RU | Params |
|--------|---------|---------------|-------------|--------|
| 0x10 | StartAutoMonitor | Start auto-monitoring | Начать автомониторинг | 2 bytes: interval (seconds, big-endian) |
| 0x11 | StopAutoMonitor | Stop auto-monitoring | Остановить автомониторинг | None |

### Device Control / Управление устройством

| OpCode | Command | Description EN | Описание RU | Params |
|--------|---------|---------------|-------------|--------|
| 0x20 | GetBattery | Get battery level | Получить уровень батареи | None |
| 0x21 | GetFirmwareVersion | Get firmware version | Получить версию прошивки | None |
| 0xFE | FactoryReset | Factory reset device | Сброс к заводским настройкам | None |
| 0xFF | Reboot | Reboot device | Перезагрузка устройства | None |

### Data Commands / Команды данных

| OpCode | Command | Description EN | Описание RU | Params |
|--------|---------|---------------|-------------|--------|
| 0x30 | SyncAllData | Sync stored data | Синхронизировать сохранённые данные | None |
| 0x31 | GetDeviceTime | Get device clock | Получить время устройства | None |
| 0x32 | SetDeviceTime | Set device clock | Установить время устройства | 4 bytes: timestamp |

## 5.4 Data Response Payloads / Структуры ответных данных

### Heart Rate (OpCode 0x01)

```
Byte 0: BPM (uint8, 0-255)
Byte 1: Confidence (uint8, 0-100)
```

### HRV (OpCode 0x02)

```
Bytes 0-3: RMSSD (float32, big-endian)
Bytes 4-7: SDNN (float32, big-endian)
Bytes 8-11: pNN50 (float32, big-endian)
```

### SpO2 (OpCode 0x03)

```
Byte 0: SpO2 percentage (uint8, 0-100)
Bytes 1-4: Perfusion Index (float32, big-endian)
```

### Temperature (OpCode 0x05)

```
Bytes 0-3: Temperature in Celsius (float32, big-endian)
```

### ECG (OpCode 0x07)

```
Bytes 0-1: Sample 1 (int16, big-endian, divide by 1000 for mV)
Bytes 2-3: Sample 2
...
(Up to MTU / 2 samples per packet, at 125 Hz)
```

### Blood Pressure (OpCode 0x09)

```
Byte 0: Systolic (uint8, mmHg)
Byte 1: Diastolic (uint8, mmHg)
Byte 2: Pulse (uint8, bpm)
```

### Stress (OpCode 0x0B)

```
Byte 0: Stress score (uint8, 0-100)
```

### PPI (OpCode 0x0C)

```
Bytes 0-1: Interval (uint16, big-endian, milliseconds)
Bytes 2-5: Coherence (float32, big-endian, 0.0-1.0)
```

### Battery (OpCode 0x20)

```
Byte 0: Battery percentage (uint8, 0-100)
```

### Firmware Version (OpCode 0x21)

```
Bytes 0-N: Version string (ASCII, e.g., "2.4.1")
```

## 5.5 Connection Sequence Diagram / Диаграмма последовательности подключения

```
Phone                           V8 Device
  │                                │
  │  scanForPeripherals(FFF0)      │
  │───────────────────────────────>│
  │                                │
  │  didDiscover(V8, RSSI: -52)   │
  │<───────────────────────────────│
  │                                │
  │  connect(V8)                   │
  │───────────────────────────────>│
  │                                │
  │  didConnect(V8)                │
  │<───────────────────────────────│
  │                                │
  │  discoverServices([FFF0])      │
  │───────────────────────────────>│
  │                                │
  │  didDiscoverServices(FFF0)     │
  │<───────────────────────────────│
  │                                │
  │  discoverCharacteristics       │
  │  ([FFF6, FFF7], for: FFF0)     │
  │───────────────────────────────>│
  │                                │
  │  didDiscoverCharacteristics    │
  │  (FFF6=write, FFF7=notify)     │
  │<───────────────────────────────│
  │                                │
  │  setNotifyValue(true, FFF7)    │
  │───────────────────────────────>│
  │                                │
  │  ✓ Connection established      │
  │                                │
  │  writeValue(StartAutoMonitor,  │
  │    to: FFF6, withResponse)     │
  │───────────────────────────────>│
  │                                │
  │  didUpdateValue(FFF7, HR data) │
  │<───────────────────────────────│
  │                                │
  │  didUpdateValue(FFF7, HRV)     │
  │<───────────────────────────────│
  │                                │
  │  ... continuous data stream    │
  │<───────────────────────────────│
```

## 5.6 V8 Device Sensors / Датчики устройства V8

| Sensor | Type | Sample Rate | Metric | Description EN | Описание RU |
|--------|------|------------|--------|---------------|-------------|
| PPG | Optical | 25 Hz | HR, HRV, SpO2, PPI | Photoplethysmography green LED | Фотоплетизмография зелёный LED |
| ECG | Electrical | 125 Hz | ECG, HR | Single-lead electrocardiogram | Одноканальная электрокардиограмма |
| Accelerometer | MEMS | 50 Hz | Steps, Activity | 3-axis motion detection | 3-осевое определение движения |
| Gyroscope | MEMS | 50 Hz | Activity type | 3-axis rotation | 3-осевое вращение |
| Thermometer | IR | 1 Hz | Temperature | Skin surface temperature | Температура поверхности кожи |

---

# 6. Data Pipeline

**EN:** The data pipeline describes the full journey of biometric data from the V8 device through processing and storage to the user interface.

**RU:** Конвейер данных описывает полный путь биометрических данных от устройства V8 через обработку и хранение до пользовательского интерфейса.

## 6.1 Full Pipeline Diagram / Полная схема конвейера

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA PIPELINE                                       │
│                                                                             │
│  Stage 1: ACQUISITION (BLE)                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────┐      │
│  │  V8 Device   │───>│  BLE Transport   │───>│  Packet Parser       │      │
│  │  (Sensors)   │    │  (FFF7 notify)   │    │  (opCode dispatch)   │      │
│  │              │    │  MTU: 20-512     │    │                      │      │
│  │  PPG: 25Hz   │    │                  │    │  Outputs:            │      │
│  │  ECG: 125Hz  │    │  Interval: auto  │    │  HR, HRV, SpO2,     │      │
│  │  Accel: 50Hz │    │  monitoring OR   │    │  Temp, ECG, BP,      │      │
│  │  Gyro: 50Hz  │    │  on-demand       │    │  Stress, PPI,        │      │
│  │  Therm: 1Hz  │    │                  │    │  Activity raw data   │      │
│  └──────────────┘    └──────────────────┘    └────────┬─────────────┘      │
│                                                        │                    │
│  Stage 2: PROCESSING (Rust Core)                       │                    │
│  ┌─────────────────────────────────────────────────────┴──────────────┐     │
│  │                                                                    │     │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │     │
│  │  │ Emotion Engine   │  │ WVI Calculator   │  │Activity Detect │  │     │
│  │  │                  │  │                  │  │                │  │     │
│  │  │ Input: 15 signals│  │ Input: 10 metrics│  │ Input: HR+steps│  │     │
│  │  │ Process: fuzzy   │  │ Process: normalize│ │ Process: rules │  │     │
│  │  │   logic cascade  │  │   + weight + sum │  │   + HR zones   │  │     │
│  │  │ Output: emotion  │  │ Output: 0-100    │  │ Output: type   │  │     │
│  │  │   + confidence   │  │   + level        │  │   + load level │  │     │
│  │  └──────────┬───────┘  └──────────┬───────┘  └────────┬───────┘  │     │
│  │             │                     │                    │          │     │
│  │             └─────────────────────┼────────────────────┘          │     │
│  │                                   │                               │     │
│  │                        Emotion feedback loop                      │     │
│  │                        (emotion adjusts WVI)                      │     │
│  └───────────────────────────────────┼───────────────────────────────┘     │
│                                      │                                     │
│  Stage 3: STORAGE                    │                                     │
│  ┌───────────────────────────────────┴──────────────────────────────┐      │
│  │                                                                  │      │
│  │  ┌──────────────────┐    ┌──────────────────────┐               │      │
│  │  │  Local DB         │    │  API Server           │               │      │
│  │  │                  │    │                      │               │      │
│  │  │  Room (Android)  │    │  POST /biometrics/*  │               │      │
│  │  │  SwiftData (iOS) │    │  Batch sync every    │               │      │
│  │  │                  │    │  30 minutes          │               │      │
│  │  │  Immediate write │    │                      │               │      │
│  │  │  Offline-first   │    │  Returns:            │               │      │
│  │  └──────────────────┘    │  - AI interpretations│               │      │
│  │                          │  - Recommendations   │               │      │
│  │                          │  - Historical trends │               │      │
│  │                          └──────────────────────┘               │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  Stage 4: PRESENTATION                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                                                                  │      │
│  │  ViewModel (StateFlow / @Published)                             │      │
│  │       │                                                          │      │
│  │       ▼                                                          │      │
│  │  Compose / SwiftUI                                              │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │      │
│  │  │WVI Gauge │ │ Emotion  │ │ Activity │ │ Charts   │           │      │
│  │  │  78/100  │ │ Focused  │ │ Sitting  │ │ History  │           │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │      │
│  │                                                                  │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Offline-First Strategy / Стратегия "сначала оффлайн"

**EN:** The app works fully offline by processing all data locally via the Rust core and storing in the local database. API synchronization happens in the background when connectivity is available.

**RU:** Приложение полностью работает оффлайн, обрабатывая все данные локально через ядро Rust и сохраняя в локальную базу данных. Синхронизация с API происходит в фоне при наличии связи.

```
┌─────────────────────────────────────────────────┐
│              OFFLINE-FIRST FLOW                  │
│                                                 │
│  1. BLE data arrives                            │
│     │                                           │
│     ▼                                           │
│  2. Rust Core processes locally (< 0.1ms)       │
│     ├── WVI score                               │
│     ├── Emotion detection                       │
│     └── Activity classification                 │
│     │                                           │
│     ▼                                           │
│  3. Store in local DB (Room / SwiftData)         │
│     ├── Biometric records (synced=false)         │
│     ├── WVI scores                              │
│     └── Emotion history                         │
│     │                                           │
│     ▼                                           │
│  4. Update UI immediately                        │
│                                                 │
│  5. Background sync (when online):              │
│     ├── Query local DB WHERE synced=false        │
│     ├── POST /api/v1/biometrics/sync             │
│     ├── On success: mark synced=true             │
│     └── Fetch AI insights from server            │
│                                                 │
│  6. Conflict resolution:                        │
│     ├── Server is source of truth for AI         │
│     ├── Local is source of truth for raw data    │
│     └── Last-write-wins for settings             │
└─────────────────────────────────────────────────┘
```

## 6.3 Data Sampling Rates / Частоты выборки данных

| Data Type | Sensor Rate | Processing Rate | Storage Rate | API Sync Rate |
|-----------|------------|----------------|-------------|--------------|
| Heart Rate | 25 Hz (PPG) | 1/second (avg) | Every 5 min | Every 30 min |
| HRV | 25 Hz (PPG) | 1/5 min (RMSSD) | Every 5 min | Every 30 min |
| SpO2 | 25 Hz (PPG) | 1/spot measure | Per measurement | Every 30 min |
| ECG | 125 Hz | Continuous stream | Per session | On completion |
| Temperature | 1 Hz | 1/5 min | Every 5 min | Every 30 min |
| Steps | 50 Hz (accel) | 1/minute | Every 5 min | Every 30 min |
| Stress | Derived | 1/5 min | Every 5 min | Every 30 min |
| PPI | 25 Hz (PPG) | Continuous | Every beat | Every 30 min |
| WVI Score | -- | 1/5 min | Every 5 min | Every 30 min |
| Emotion | -- | 1/5 min | Every 5 min | Every 30 min |
| Activity | -- | 1/minute | Every minute | Every 30 min |

---

# 7. Privy Authentication Flow

**EN:** The mobile apps use Privy for authentication, supporting embedded wallets, social login, and email/SMS authentication.

**RU:** Мобильные приложения используют Privy для аутентификации, поддерживая встроенные кошельки, социальный логин и аутентификацию по email/SMS.

## 7.1 Authentication Flow Diagram / Диаграмма потока аутентификации

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐     ┌───────────┐
│  Mobile App │     │   Privy SDK   │     │ Privy Cloud │     │ WVI API   │
│             │     │   (embedded)  │     │             │     │           │
└──────┬──────┘     └───────┬───────┘     └──────┬──────┘     └─────┬─────┘
       │                    │                    │                   │
       │  1. User taps      │                    │                   │
       │  "Sign In"         │                    │                   │
       │───────────────────>│                    │                   │
       │                    │                    │                   │
       │  2. Show Privy     │                    │                   │
       │  login modal       │                    │                   │
       │<───────────────────│                    │                   │
       │                    │                    │                   │
       │  3. User enters    │                    │                   │
       │  email/social      │                    │                   │
       │───────────────────>│                    │                   │
       │                    │  4. Verify         │                   │
       │                    │  credentials       │                   │
       │                    │───────────────────>│                   │
       │                    │                    │                   │
       │                    │  5. JWT + user     │                   │
       │                    │<───────────────────│                   │
       │                    │                    │                   │
       │  6. JWT token      │                    │                   │
       │<───────────────────│                    │                   │
       │                    │                    │                   │
       │  7. Store in       │                    │                   │
       │  Keychain/Keystore │                    │                   │
       │                    │                    │                   │
       │  8. API request    │                    │                   │
       │  Authorization:    │                    │                   │
       │  Bearer <JWT>      │                    │                   │
       │──────────────────────────────────────────────────────────>│
       │                    │                    │                   │
       │                    │                    │  9. Verify JWT    │
       │                    │                    │<──────────────────│
       │                    │                    │                   │
       │                    │                    │  10. user_id      │
       │                    │                    │──────────────────>│
       │                    │                    │                   │
       │  11. API response  │                    │                   │
       │<──────────────────────────────────────────────────────────│
       │                    │                    │                   │
```

## 7.2 Token Lifecycle / Жизненный цикл токена

```
┌──────────────────────────────────────────────────┐
│              TOKEN LIFECYCLE                       │
│                                                  │
│  1. Initial Authentication                        │
│     └──► Access Token (1h TTL)                    │
│     └──► Refresh Token (30d TTL)                  │
│                                                  │
│  2. API Request                                   │
│     ├── If token valid → proceed                  │
│     ├── If token expired (401) → refresh          │
│     └── If refresh fails → re-authenticate        │
│                                                  │
│  3. Token Refresh                                 │
│     ├── POST /api/v1/auth/refresh                 │
│     │   body: { refreshToken: "..." }             │
│     └──► New Access Token (1h TTL)                │
│                                                  │
│  4. Token Storage                                 │
│     ├── Android: EncryptedSharedPreferences       │
│     └── iOS: Keychain Services                    │
│                                                  │
│  5. Auto-refresh logic (in AuthInterceptor):      │
│     ├── Intercept 401 responses                   │
│     ├── Call refresh endpoint                     │
│     ├── Retry original request with new token     │
│     └── If refresh fails → emit logout event      │
└──────────────────────────────────────────────────┘
```

## 7.3 Security Considerations / Вопросы безопасности

**EN:**
- Tokens stored in OS-level secure storage (Keychain / EncryptedSharedPreferences)
- TLS 1.3 for all API communication
- Certificate pinning for production builds
- Privy handles all credential storage (passwords, social tokens)
- No sensitive data in logs or crash reports
- Biometric local storage encrypted with device key

**RU:**
- Токены хранятся в безопасном хранилище ОС (Keychain / EncryptedSharedPreferences)
- TLS 1.3 для всей связи с API
- Certificate pinning для продакшн-сборок
- Privy управляет хранением всех учётных данных (пароли, социальные токены)
- Нет чувствительных данных в логах или отчётах о сбоях
- Локальное хранилище биометрии зашифровано ключом устройства

---

# 8. Build Instructions

## 8.1 Prerequisites / Предварительные требования

### All Platforms / Все платформы

```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update stable

# Install cargo-ndk (for Android)
cargo install cargo-ndk

# Install cbindgen (for iOS headers)
cargo install cbindgen
```

### Android-Specific / Для Android

**EN:**
- Android Studio Hedgehog or newer
- Android NDK r26b+
- JDK 17

**RU:**
- Android Studio Hedgehog или новее
- Android NDK r26b+
- JDK 17

```bash
# Set environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/26.1.10909125

# Add Rust Android targets
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add x86_64-linux-android
rustup target add i686-linux-android
```

### iOS-Specific / Для iOS

**EN:**
- Xcode 15.2+
- macOS Sonoma 14.0+
- CocoaPods or SPM

**RU:**
- Xcode 15.2+
- macOS Sonoma 14.0+
- CocoaPods или SPM

```bash
# Add Rust iOS targets
rustup target add aarch64-apple-ios
rustup target add aarch64-apple-ios-sim
rustup target add x86_64-apple-ios
```

## 8.2 Build Rust Core / Сборка ядра Rust

### Build for Android / Сборка для Android

```bash
cd wvi-core

# Build all Android architectures
cargo ndk \
  -t armeabi-v7a \
  -t arm64-v8a \
  -t x86_64 \
  -o ./android/src/main/jniLibs \
  build --release

# Verify outputs
ls -la android/src/main/jniLibs/arm64-v8a/libwvi_core.so
ls -la android/src/main/jniLibs/armeabi-v7a/libwvi_core.so
ls -la android/src/main/jniLibs/x86_64/libwvi_core.so

# Generate Kotlin bindings (uniffi)
cargo run --bin uniffi-bindgen generate \
  --library target/release/libwvi_core.so \
  --language kotlin \
  --out-dir android/src/main/kotlin/
```

### Build for iOS / Сборка для iOS

```bash
cd wvi-core

# Build for device (arm64)
cargo build --release --target aarch64-apple-ios

# Build for simulator (arm64)
cargo build --release --target aarch64-apple-ios-sim

# Generate C header
cbindgen --config cbindgen.toml --crate wvi-core --output ios/include/wvi_core.h

# Create xcframework
xcodebuild -create-xcframework \
  -library target/aarch64-apple-ios/release/libwvi_core.a \
    -headers ios/include/ \
  -library target/aarch64-apple-ios-sim/release/libwvi_core.a \
    -headers ios/include/ \
  -output ios/WviCore.xcframework

# Verify
ls -la ios/WviCore.xcframework/
```

### Run Tests / Запуск тестов

```bash
cd wvi-core

# Unit tests
cargo test

# With output
cargo test -- --nocapture

# Specific test
cargo test wvi_calculator::tests::test_healthy_person
cargo test emotion_engine::tests::test_stressed_detection
cargo test activity_detector::tests::test_walking_detection
```

## 8.3 Build Android App / Сборка Android-приложения

```bash
cd wvi-android

# Ensure Rust core is built first
# (outputs in app/src/main/jniLibs/)

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Build AAB for Play Store
./gradlew bundleRelease

# Run on device
./gradlew installDebug

# Run tests
./gradlew testDebugUnitTest
./gradlew connectedDebugAndroidTest
```

### ProGuard Rules / Правила ProGuard

```proguard
# wvi-core JNI
-keep class com.wvi.health.core.WviCore { *; }
-keep class com.wvi.health.core.WviCoreBindings { *; }

# Retrofit
-keepattributes Signature
-keep class com.wvi.health.data.remote.dto.** { *; }

# Privy
-keep class io.privy.** { *; }
```

## 8.4 Build iOS App / Сборка iOS-приложения

```bash
cd wvi-ios

# Ensure Rust core xcframework is built first
# Copy to project
cp -R ../wvi-core/ios/WviCore.xcframework ./Frameworks/

# Install dependencies (if using CocoaPods)
pod install

# Build from command line
xcodebuild \
  -workspace WVI.xcworkspace \
  -scheme WVI \
  -destination 'platform=iOS,name=My iPhone' \
  -configuration Release \
  build

# Archive for App Store
xcodebuild \
  -workspace WVI.xcworkspace \
  -scheme WVI \
  -destination 'generic/platform=iOS' \
  -archivePath build/WVI.xcarchive \
  archive

# Export IPA
xcodebuild \
  -exportArchive \
  -archivePath build/WVI.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/
```

## 8.5 Build WVI API Server / Сборка API-сервера WVI

```bash
cd wvi-api

# Local development
npm install
npm start
# Server: http://localhost:8091

# Docker build
docker compose build

# Docker run
docker compose up -d

# Verify
curl http://localhost:8091/api/v1/health/server-status

# View logs
docker compose logs -f
```

## 8.6 CI/CD Pipeline / Конвейер CI/CD

```
┌──────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                             │
│                                                              │
│  Trigger: push to main / pull request                        │
│                                                              │
│  Stage 1: Rust Core                                          │
│  ├── cargo test                                              │
│  ├── cargo clippy                                            │
│  ├── cargo build --release (all targets)                     │
│  └── Upload artifacts (JNI libs + xcframework)               │
│                                                              │
│  Stage 2: Android (parallel with iOS)                        │
│  ├── Download Rust artifacts                                 │
│  ├── ./gradlew testDebugUnitTest                             │
│  ├── ./gradlew assembleRelease                               │
│  └── Upload APK/AAB                                          │
│                                                              │
│  Stage 3: iOS (parallel with Android)                        │
│  ├── Download Rust xcframework                               │
│  ├── xcodebuild test                                         │
│  ├── xcodebuild archive                                      │
│  └── Upload IPA                                              │
│                                                              │
│  Stage 4: API Server                                         │
│  ├── docker compose build                                    │
│  ├── docker compose up -d                                    │
│  ├── Run integration tests (curl smoke tests)                │
│  └── Push image to registry                                  │
│                                                              │
│  Stage 5: Deploy                                             │
│  ├── Android → Google Play (Internal Track)                  │
│  ├── iOS → TestFlight                                        │
│  └── API → Docker registry → server pull                     │
└──────────────────────────────────────────────────────────────┘
```

---

# 9. Architecture Decision Records

## ADR-001: Shared Rust Core

**EN:** Decision: Implement WVI algorithms in Rust, compiled to native libraries for each platform.

Rationale: Ensures mathematical consistency across Android, iOS, and server. A single implementation avoids divergence bugs. Rust provides memory safety without GC, crucial for real-time processing on mobile.

**RU:** Решение: Реализовать алгоритмы WVI на Rust, компилируемом в нативные библиотеки для каждой платформы.

Обоснование: Обеспечивает математическую согласованность между Android, iOS и сервером. Единая реализация исключает ошибки расхождения. Rust обеспечивает безопасность памяти без сборщика мусора, что критично для обработки в реальном времени на мобильных устройствах.

## ADR-002: Offline-First Architecture

**EN:** Decision: Process all biometric data locally and sync to server in background.

Rationale: BLE wearables operate in environments with unreliable connectivity (gyms, outdoors, sleep). Users expect immediate feedback. Local Rust core processing takes <0.1ms, making real-time updates trivial.

**RU:** Решение: Обрабатывать все биометрические данные локально и синхронизировать с сервером в фоне.

Обоснование: BLE-устройства работают в условиях ненадёжного соединения (спортзалы, улица, сон). Пользователи ожидают немедленной обратной связи. Локальная обработка ядром Rust занимает <0.1мс, делая обновления в реальном времени тривиальными.

## ADR-003: Single BLE Service (FFF0)

**EN:** Decision: Use a single BLE service with two characteristics (write FFF6, notify FFF7) instead of multiple services.

Rationale: Simplifies connection management, reduces power consumption, and speeds up service discovery. The V8 device has limited BLE stack memory. OpCode-based multiplexing within a single characteristic is more efficient than multiple characteristics.

**RU:** Решение: Использовать один BLE-сервис с двумя характеристиками (запись FFF6, уведомления FFF7) вместо нескольких сервисов.

Обоснование: Упрощает управление соединением, снижает энергопотребление и ускоряет обнаружение сервисов. Устройство V8 имеет ограниченную память BLE-стека. Мультиплексирование по OpCode в одной характеристике эффективнее множества характеристик.

## ADR-004: Privy for Authentication

**EN:** Decision: Use Privy as the authentication provider instead of custom auth or Firebase Auth.

Rationale: Privy provides embedded wallet support (future Web3 features), social login, email/SMS auth, and handles all credential storage securely. Reduces auth-related code and security responsibility.

**RU:** Решение: Использовать Privy как провайдера аутентификации вместо собственной или Firebase Auth.

Обоснование: Privy обеспечивает поддержку встроенных кошельков (будущие Web3-функции), социальный логин, аутентификацию по email/SMS и безопасно хранит все учётные данные. Уменьшает код аутентификации и ответственность за безопасность.

## ADR-005: Fuzzy Logic for Emotion Detection

**EN:** Decision: Use fuzzy logic with sigmoid and bell-curve membership functions instead of ML models for emotion detection.

Rationale: Deterministic, explainable, and lightweight. No training data required, no model updates to ship. Runs in <0.03ms on mobile hardware. Each emotion's detection criteria can be precisely tuned by adjusting sigmoid midpoints and steepness parameters.

**RU:** Решение: Использовать нечёткую логику с сигмоидными и колоколообразными функциями принадлежности вместо ML-моделей для определения эмоций.

Обоснование: Детерминистичность, объяснимость и легковесность. Не требуются данные для обучения, не нужно обновлять модели. Работает менее чем за 0.03мс на мобильном оборудовании. Критерии определения каждой эмоции можно точно настроить, изменяя параметры сигмоид.

## ADR-006: Adaptive Time-of-Day Weights

**EN:** Decision: WVI weights shift based on time of day (Night, Morning, Workday, Evening).

Rationale: Health priorities change throughout the day. Sleep quality matters more at night, HRV recovery matters most in the morning, stress management matters during work hours. This produces more meaningful and actionable WVI scores.

**RU:** Решение: Веса WVI меняются в зависимости от времени суток (Ночь, Утро, Рабочий день, Вечер).

Обоснование: Приоритеты здоровья меняются в течение дня. Качество сна важнее ночью, восстановление ВСР важнее утром, управление стрессом важнее в рабочее время. Это даёт более осмысленные и практичные показатели WVI.

---

**EN:** End of WVI Mobile Architecture document.

**RU:** Конец документа архитектуры мобильного WVI.

---

*WVI Mobile Architecture v1.0.0 — 2026-04-02*
