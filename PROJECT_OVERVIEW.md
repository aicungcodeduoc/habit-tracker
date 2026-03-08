# Habit Tracker - Project Overview

## 1. Tổng quan

**Habit Tracker** (tên app: "small") là ứng dụng mobile theo dõi thói quen hàng ngày, được xây dựng bằng **React Native (Expo)** với backend **Supabase** và tích hợp AI **Google Gemini** để xác minh hoàn thành thói quen qua hình ảnh.

### Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  React Native (Expo v54) + React 19                 │
│  Navigation: @react-navigation                     │
│  UI: Atomic Design + lucide-react-native            │
│  Effects: LiquidGlass / expo-blur                   │
├─────────────────────────────────────────────────────┤
│                    BACKEND                          │
│  Supabase (PostgreSQL + Auth + Storage)             │
│  Google Gemini API (image verification)             │
├─────────────────────────────────────────────────────┤
│                  STORAGE                            │
│  AsyncStorage (session, onboarding cache)           │
│  Supabase Storage (habit-images bucket)             │
└─────────────────────────────────────────────────────┘
```

---

## 2. Kiến trúc thư mục

```
habit-tracker/
├── App.js                    # Entry: auth check + navigation
├── config/                   # Colors, fonts, supabase client
│
├── src/                      # === SOURCE CHÍNH ===
│   ├── api/                  # Service layer (Supabase queries)
│   │   ├── habitService.js       # CRUD habits
│   │   ├── completionService.js  # Đánh dấu hoàn thành
│   │   ├── geminiService.js      # AI xác minh ảnh
│   │   ├── onboardingService.js  # Onboarding data
│   │   └── supabase.js           # Supabase client init
│   │
│   ├── components/           # Atomic Design
│   │   ├── atoms/                # Button, AIIcon
│   │   ├── molecules/            # HabitItem, DateHeader, WeekOverview
│   │   └── organisms/            # BottomTabNavigator
│   │
│   ├── hooks/                # useStepAnimation
│   ├── navigation/           # RootNavigator
│   ├── store/                # (placeholder cho Zustand)
│   └── utils/                # Colors, fonts helpers
│
├── components/screens/       # Tất cả màn hình
│   ├── HomeScreen.js             # Danh sách habits + tracking
│   ├── LoginScreen.js            # Google OAuth
│   ├── OnboardingScreen.js       # Onboarding flow
│   ├── AddHabitScreen.js         # Tạo habit mới
│   ├── HabitDetailScreen.js      # Chi tiết + upload ảnh
│   ├── AIProcessScreen.js        # Loading phân tích AI
│   ├── AIResultScreen.js         # Kết quả AI
│   ├── StreaksScreen.js          # Thống kê streaks
│   ├── BuddyScreen.js           # AI Buddy (đang phát triển)
│   ├── ProfileScreen.js         # Hồ sơ người dùng
│   └── SettingsScreen.js        # Cài đặt
│
├── supabase/                 # Migrations + auto-generated types
├── database/                 # SQL schema reference
└── docs/                     # Tài liệu kiến trúc
```

---

## 3. Luồng xác thực (Authentication)

```
┌──────────┐    Google OAuth    ┌──────────────┐
│  User    │ ─────────────────> │ LoginScreen  │
│  mở app  │                    │              │
└──────────┘                    └──────┬───────┘
                                       │
                              signInWithOAuth()
                                       │
                                       v
                               ┌───────────────┐
                               │  Google Auth   │
                               │  (WebBrowser)  │
                               └───────┬───────┘
                                       │
                                 redirect + tokens
                                       │
                                       v
                               ┌───────────────┐
                               │ Supabase Auth  │
                               │ setSession()   │
                               └───────┬───────┘
                                       │
                            ┌──────────┴──────────┐
                            │                     │
                     Lần đầu?                Đã onboard?
                            │                     │
                            v                     v
                   ┌────────────────┐    ┌────────────────┐
                   │ OnboardingScreen│    │   HomeScreen   │
                   │ (setup flow)    │    │   (Main App)   │
                   └────────────────┘    └────────────────┘
```

---

## 4. Navigation (Điều hướng)

```
RootNavigator (Stack)
│
├── Login ──────────────────────────── LoginScreen
├── Onboarding ─────────────────────── OnboardingScreen
│
├── Main (BottomTabNavigator) ──────┐
│   ├── [Home]    ─── HomeScreen    │  Tab bar dạng pill
│   ├── [Buddy]   ─── BuddyScreen  │  với animation spring
│   ├── [Streaks] ─── StreaksScreen │  + LiquidGlass effect
│   └── [Profile] ─── ProfileScreen │
│                                   └──────────────────
├── AddHabit ───────────────────────── AddHabitScreen
├── HowOften ───────────────────────── HowOftenScreen
├── HabitCreated ───────────────────── HabitCreatedScreen
├── HabitDetail ────────────────────── HabitDetailScreen
├── AIProcess ──────────────────────── AIProcessScreen
├── AIResult ───────────────────────── AIResultScreen
├── HabitSuccess ───────────────────── HabitSuccessScreen
└── Settings ───────────────────────── SettingsScreen
```

---

## 5. Database Schema

```
┌─────────────────────┐       ┌──────────────────────┐
│      profiles       │       │       habits          │
├─────────────────────┤       ├──────────────────────┤
│ id (PK, FK auth)    │──┐    │ id (PK)              │
│ email               │  │    │ user_id (FK) ────────│──┐
│ full_name           │  │    │ title                │  │
│ avatar_url          │  │    │ description          │  │
│ created_at          │  │    │ frequency            │  │
│ updated_at          │  │    │ selected_days[]      │  │
└─────────────────────┘  │    │ target               │  │
                         │    │ streak               │  │
                         │    │ longest_streak       │  │
                         │    │ color, icon          │  │
                         │    │ reminders_enabled    │  │
                         │    │ reminder_time        │  │
                         │    │ is_active            │  │
                         │    └──────────┬───────────┘  │
                         │               │              │
                         │               │ 1:N          │
                         │               v              │
                         │    ┌──────────────────────┐  │
                         │    │ habit_completions    │  │
                         │    ├──────────────────────┤  │
                         │    │ id (PK)              │  │
                         │    │ habit_id (FK) ───────│──┘
                         │    │ user_id (FK) ────────│──┐
                         │    │ completion_date      │  │
                         │    │ verified             │  │
                         │    │ verification_method  │  │
                         │    │ notes                │  │
                         │    └──────────┬───────────┘  │
                         │               │              │
                         │               │ 1:1          │
                         │               v              │
                         │    ┌──────────────────────┐  │
                         │    │   habit_images       │  │
                         │    ├──────────────────────┤  │
                         │    │ id (PK)              │  │
                         │    │ habit_id (FK)        │  │
                         │    │ completion_id (FK)   │  │
                         │    │ image_url            │  │
                         │    │ ai_analysis_result   │  │
                         │    │ ai_verification_status│ │
                         │    └──────────────────────┘  │
                         │                              │
                         │    ┌──────────────────────┐  │
                         └───>│  onboarding_data     │  │
                              ├──────────────────────┤  │
                              │ id (PK)              │  │
                              │ user_id (FK, UNIQUE) │<─┘
                              │ habit_name           │
                              │ distraction_index    │
                              │ notifications_enabled│
                              │ onboarding_completed │
                              └──────────────────────┘

  * RLS (Row-Level Security) trên tất cả bảng
  * Trigger tự động cập nhật streak khi completion thay đổi
  * UNIQUE(habit_id, completion_date) - mỗi habit chỉ complete 1 lần/ngày
```

---

## 6. Các tính năng chính

### 6.1 Quản lý thói quen (CRUD)

```
Tạo habit ──> Chọn tần suất ──> Xác nhận ──> Hiển thị trên Home
   │              │                  │
   v              v                  v
AddHabitScreen  HowOftenScreen  HabitCreatedScreen
```

- Tạo habit với: tên, mô tả, tần suất (daily/weekly), ngày trong tuần, mục tiêu
- Tùy chỉnh: màu sắc, icon, nhắc nhở, môi trường
- Chỉnh sửa / xóa habit

### 6.2 Theo dõi hàng ngày

```
┌─────────────────────────────────────┐
│           HomeScreen                │
├─────────────────────────────────────┤
│  [< ]  Thứ 2, 08/03/2026  [ >]    │  ← DateHeader (điều hướng ngày)
├─────────────────────────────────────┤
│  T2  T3  T4  T5  T6  T7  CN       │  ← WeekOverview
│  ●   ●   ●   ○   ○   ○   ○        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 💧 Uống nước        3/8    │   │  ← HabitItem
│  │    Streak: 5 ngày   [✓]    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 💪 Tập thể dục      1/1    │   │
│  │    Streak: 12 ngày  [📷]   │   │  ← Upload ảnh xác minh
│  └─────────────────────────────┘   │
│                                     │
│          [ + Thêm habit ]           │
└─────────────────────────────────────┘
```

### 6.3 Xác minh bằng AI (Gemini)

```
Chụp/Chọn ảnh ──> Upload ──> Gemini phân tích ──> Kết quả
      │                │              │                │
      v                v              v                v
HabitDetailScreen   Supabase    AIProcessScreen   AIResultScreen
 (image picker)     Storage      (loading)        (correct/incorrect)
                                      │
                                      v
                               ┌──────────────┐
                               │ Gemini API   │
                               │ Prompt:      │
                               │ "Ảnh này có  │
                               │ liên quan    │
                               │ đến [habit]  │
                               │ không?"      │
                               └──────┬───────┘
                                      │
                                      v
                               { correct: true/false,
                                 message: "..." }
```

### 6.4 Streak Tracking

```
Hoàn thành habit ──> DB Trigger ──> Cập nhật streak
                                         │
                          ┌──────────────┴──────────────┐
                          │                             │
                   current_streak++              So sánh với
                                              longest_streak
                                                    │
                                            Cập nhật nếu lớn hơn
```

- Tự động tính streak qua database trigger
- Hiển thị streak hiện tại & streak dài nhất
- StreaksScreen: bảng xếp hạng theo streak

### 6.5 Onboarding

```
Bước 1          Bước 2           Bước 3          Bước 4
Chọn habit ──> Chọn trở ngại ──> Cài đặt ──> Hoàn thành
đầu tiên       (distraction)    thông báo
    │               │               │              │
    └───────────────┴───────────────┴──────────────┘
                          │
                    Lưu AsyncStorage
                          +
                    Sync Supabase DB
```

---

## 7. Luồng dữ liệu tổng thể

```
┌───────────┐     ┌──────────────┐     ┌─────────────────┐
│           │     │              │     │                 │
│  Screens  │────>│  API Layer   │────>│    Supabase     │
│           │     │  (services)  │     │  (PostgreSQL)   │
│           │<────│              │<────│                 │
└───────────┘     └──────┬───────┘     └─────────────────┘
                         │
                         │ (image analysis)
                         v
                  ┌──────────────┐
                  │ Google Gemini│
                  │     API      │
                  └──────────────┘

Screens ─── gọi ──> habitService / completionService / geminiService
                            │
                            v
                     Supabase Client
                     (src/api/supabase.js)
                            │
                     ┌──────┴──────┐
                     │             │
                  Database     Storage
                  (tables)    (images)
```

---

## 8. Bảo mật

| Layer | Cơ chế |
|-------|--------|
| Auth | Google OAuth qua Supabase Auth |
| Database | RLS: `auth.uid() = user_id` trên mọi bảng |
| API Keys | `.env` (không commit), prefix `EXPO_PUBLIC_*` |
| Storage | Supabase Storage policies (user-scoped) |
| Session | AsyncStorage + auto-refresh token |

---

## 9. Các thư viện chính

| Thư viện | Mục đích |
|----------|----------|
| `expo` v54 | Framework mobile |
| `react` v19 | UI library |
| `@supabase/supabase-js` | Database + Auth + Storage |
| `@react-navigation/*` | Điều hướng (stack + tabs) |
| `lucide-react-native` | Icons |
| `@callstack/liquid-glass` | Hiệu ứng kính mờ cao cấp |
| `expo-image-picker` | Chụp/chọn ảnh |
| `expo-notifications` | Push notifications |
| `expo-blur` | Blur effect fallback |
| `@react-native-async-storage` | Local storage |

---

## 10. Branch hiện tại

- **Branch:** `feature/buddy` - Đang phát triển tính năng AI Buddy (bạn đồng hành AI)
- **Status:** Clean (không có thay đổi chưa commit)
- **Main branch:** `main`
