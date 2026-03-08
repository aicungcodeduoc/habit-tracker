# PRD: Tính năng AI Buddy

## 1. Tổng quan

### AI Buddy là gì?

AI Buddy là một người bạn đồng hành AI trong ứng dụng Habit Tracker, giúp người dùng xây dựng thói quen tốt thông qua giao diện trò chuyện (chat). Buddy sử dụng Google Gemini API để hiểu bối cảnh thói quen của người dùng và đưa ra phản hồi cá nhân hóa.

### Mục tiêu

- Tăng tỷ lệ giữ chân người dùng bằng trải nghiệm tương tác cá nhân
- Giúp người dùng duy trì động lực thông qua lời khuyên và động viên từ AI
- Tận dụng dữ liệu thói quen có sẵn (habits, completions, streaks) để đưa ra nhận xét có ý nghĩa

### Hiện trạng

- **Branch:** `feature/buddy`
- **BuddyScreen:** Placeholder trống (chỉ hiển thị text "Buddy")
- **Tab Buddy:** Đã có sẵn trong BottomTabNavigator với AIIcon
- **Gemini API:** Đã tích hợp (model `gemini-3-flash-preview`, có `analyzeImageWithGemini` và `generateHabitCompliment`)

---

## 2. User Stories

| # | User Story | Ưu tiên |
|---|-----------|---------|
| US1 | Người dùng mở tab Buddy và bắt đầu trò chuyện với AI để được động viên | MVP |
| US2 | Buddy tự động gửi lời chào khi người dùng lần đầu mở màn hình, bao gồm tóm tắt tình hình thói quen hôm nay | MVP |
| US3 | Người dùng hỏi Buddy về tình hình streak, số ngày hoàn thành, và nhận phân tích | MVP |
| US4 | Buddy trả lời dựa trên dữ liệu thực tế (tên thói quen, streak, completion hôm nay/tuần này) | MVP |
| US5 | Người dùng thấy hiệu ứng typing animation khi Buddy đang trả lời | MVP |
| US6 | Lịch sử trò chuyện được lưu lại và hiển thị khi quay lại màn hình | MVP |
| US7 | Người dùng bấm các nút hành động nhanh (quick actions) để hỏi câu hỏi thường gặp | MVP |
| US8 | Người dùng có thể xóa lịch sử trò chuyện để bắt đầu lại | Future |
| US9 | Buddy gửi thông báo nhắc nhở hàng ngày dựa trên thói quen chưa hoàn thành | Future |
| US10 | Buddy có thể giúp người dùng tạo thói quen mới trực tiếp từ cuộc trò chuyện | Future |

---

## 3. Tính năng chi tiết

### 3.1 MVP (Giai đoạn 1)

#### 3.1.1 Giao diện Chat

- Header với tên Buddy và AIIcon
- Danh sách tin nhắn dạng chat bubbles (FlatList, inverted)
- Bong chat của Buddy: nền trắng, bo tròn, căn trái
- Bong chat của người dùng: nền xanh `#01C459`, chữ trắng, căn phải
- Khung nhập tin nhắn ở dưới cùng với nút gửi (Send icon)
- Typing indicator sử dụng component `TypingText` có sẵn
- KeyboardAvoidingView để xử lý bàn phím

#### 3.1.2 Quick Action Chips

Hiển thị phía trên thanh nhập liệu, cuộn ngang (horizontal ScrollView):

- **"Hôm nay thế nào?"** - Buddy tóm tắt tình hình thói quen hôm nay
- **"Streak của tôi"** - Buddy liệt kê streak các thói quen
- **"Động viên tôi"** - Buddy gửi lời động viên cá nhân
- **"Gợi ý thói quen"** - Buddy gợi ý cách cải thiện

#### 3.1.3 Context-Aware Responses

Mỗi lần gửi tin nhắn, system prompt sẽ bao gồm:

- Danh sách thói quen của người dùng (tên, tần suất, streak)
- Số thói quen đã hoàn thành hôm nay / tổng số thói quen
- Thông tin profile (tên người dùng nếu có)
- 10 tin nhắn gần nhất (để duy trì mạch hội thoại)

#### 3.1.4 Tính cách của Buddy

- Thân thiện, nhẹ nhàng, dùng tiếng Việt tự nhiên
- Thực dụng nhưng động viên - không quá gồi ép hay "toxic positivity"
- Dùng emoji vừa phải (1-2 emoji mỗi tin nhắn)
- Gọi người dùng là "bạn" hoặc tên của họ
- Trả lời ngắn gọn (2-4 câu), không dài dòng

#### 3.1.5 Lưu trữ lịch sử

- Tin nhắn lưu vào bảng `buddy_messages` trên Supabase
- Load 50 tin nhắn gần nhất khi mở màn hình
- Pagination: load thêm khi cuộn lên

#### 3.1.6 Empty State

Khi chưa có tin nhắn nào:

- AIIcon lớn ở giữa (size=64)
- Text: "Xin chào! Mình là Buddy, bạn đồng hành giúp bạn xây dựng thói quen tốt. Hãy bắt đầu trò chuyện nào!"
- Quick action chips hiển thị bên dưới

### 3.2 Future (Giai đoạn 2+)

- Push notification check-in hàng ngày từ Buddy
- Tạo thói quen mới trực tiếp từ cuộc trò chuyện
- Phân tích xu hướng dài hạn (tuần/tháng)
- Nhiều "tính cách" Buddy để người dùng chọn
- Voice input/output
- Xóa từng tin nhắn hoặc toàn bộ lịch sử

---

## 4. Thiết kế kỹ thuật

### 4.1 Database - Bảng mới: `buddy_messages`

```sql
CREATE TABLE IF NOT EXISTS buddy_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_buddy_messages_user_id ON buddy_messages(user_id);
CREATE INDEX idx_buddy_messages_user_created ON buddy_messages(user_id, created_at DESC);

-- RLS
ALTER TABLE buddy_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON buddy_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON buddy_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON buddy_messages FOR DELETE
  USING (auth.uid() = user_id);
```

**Migration file:** `supabase/migrations/20260308000001_buddy_messages.sql`

Trường `metadata` (JSONB) chứa thông tin bổ sung: `{ quickAction: "streak_check" }`, `{ error: true }`.

### 4.2 Service mới: `src/api/buddyService.js`

Theo pattern của `completionService.js`:

```
getCurrentUserId()                              -> helper nội bộ
getMessages(limit=50, beforeTimestamp=null)      -> lấy tin nhắn cũ, phân trang
saveMessage(role, content, metadata={})          -> lưu 1 tin nhắn
deleteAllMessages()                             -> xóa lịch sử (future)
```

### 4.3 Mở rộng: `src/api/geminiService.js`

Thêm hàm `sendBuddyMessage(userMessage, conversationHistory, habitContext)`:

**Input:**
- `userMessage` (string) - tin nhắn người dùng
- `conversationHistory` (array) - 10 tin nhắn gần nhất `[{role, content}]`
- `habitContext` (object) - dữ liệu thói quen hiện tại

**Payload format** (Gemini multi-turn):
```json
{
  "systemInstruction": {
    "parts": [{ "text": "System prompt + habit context" }]
  },
  "contents": [
    { "role": "user", "parts": [{ "text": "tin nhắn cũ 1" }] },
    { "role": "model", "parts": [{ "text": "trả lời cũ 1" }] },
    { "role": "user", "parts": [{ "text": "tin nhắn mới" }] }
  ]
}
```

**System Prompt:**
```
Bạn là Buddy, một người bạn AI thân thiện trong ứng dụng xây dựng thói quen.

Quy tắc:
- Giao tiếp bằng tiếng Việt tự nhiên, gần gũi
- Trả lời ngắn gọn (2-4 câu), không dài dòng
- Dùng 1-2 emoji mỗi tin nhắn
- Gọi người dùng là "bạn"
- Động viên nhưng thực tế, không "toxic positivity"
- Khi được hỏi về thói quen, dựa trên dữ liệu thực tế bên dưới

Dữ liệu thói quen hiện tại:
{habitContextJSON}
```

**Output:** `{ success: boolean, data: string, error?: string }`

### 4.4 Habit Context Builder

Hàm `buildHabitContext()` trong BuddyScreen, gọi các service có sẵn:

```javascript
// Output mẫu:
{
  userName: "Nguyễn Văn A",
  totalHabits: 5,
  habits: [
    { title: "Tập thể dục", frequency: "daily", streak: 12, completedToday: true },
    { title: "Đọc sách", frequency: "daily", streak: 3, completedToday: false },
  ],
  todayProgress: { completed: 3, total: 5 },
  currentDate: "2026-03-08",
  dayOfWeek: "Chủ nhật"
}
```

Sử dụng:
- `getHabits()` từ `habitService.js`
- `getCompletionsForDate(today)` từ `completionService.js`
- `supabase.auth.getSession()` cho userName

---

## 5. Thiết kế UI/UX

### 5.1 Layout tổng thể

```
┌─────────────────────────────────────┐
│  [AI Icon]  buddy                   │  ← Header (Anton-Regular, lowercase)
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────┐           │
│  │ Xin chào! Hôm nay    │          │  ← Buddy bubble (trắng, căn trái)
│  │ bạn đã hoàn thành     │          │
│  │ 3/5 thói quen 💪      │          │
│  └──────────────────────┘           │
│                                     │
│           ┌──────────────────────┐  │
│           │ Streak của tôi       │  │  ← User bubble (xanh, căn phải)
│           │ thế nào?             │  │
│           └──────────────────────┘  │
│                                     │
│  ┌──────────────────────┐           │
│  │ ···                   │          │  ← Typing indicator
│  └──────────────────────┘           │
│                                     │
├─────────────────────────────────────┤
│ [Hôm nay?] [Streak] [Động viên]    │  ← Quick Action Chips
├─────────────────────────────────────┤
│  ┌───────────────────────────┐ [➤] │  ← Input bar
│  │ Nhập tin nhắn...          │      │
│  └───────────────────────────┘      │
└─────────────────────────────────────┘
```

### 5.2 Bảng màu & Typography

| Thành phần | Màu | Font |
|-----------|-----|------|
| Header "buddy" | `#333` (textDark) | Anton-Regular, 24px, lowercase |
| Background | `#ECF7F0` (homeBackground) | - |
| Buddy bubble bg | `#FFFFFF` | System, 15px |
| User bubble bg | `#01C459` (primary) | System, 15px, chữ trắng |
| Timestamp | `#999` (textLight) | System, 11px |
| Quick Action chip | Border `#01C459`, bg transparent | System, 13px |
| Input bar bg | `#FFFFFF` | System, 15px |
| Send button | `#01C459` | - |

### 5.3 Chi tiết Style

**Message Bubbles:**
- Buddy: `marginRight: 60, borderRadius: 18, borderBottomLeftRadius: 4, padding: 12`
- User: `marginLeft: 60, borderRadius: 18, borderBottomRightRadius: 4, padding: 12`
- Gap giữa tin nhắn: `8px`
- Nhóm tin nhắn liên tiếp cùng role: `marginTop: 4px`, khác role: `marginTop: 16px`

**Quick Action Chips:**
- Horizontal ScrollView, `showsHorizontalScrollIndicator: false`
- Mỗi chip: `paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5`
- Gap: `8px`

**Input Bar:**
- Container: `flexDirection: 'row', padding: 8, bg white, borderTopWidth: 1, borderTopColor: '#E5E7EB'`
- TextInput: `flex: 1, borderRadius: 25, bg: '#F0F3F7', paddingHorizontal: 16, maxHeight: 100`
- Send button: `width: 40, height: 40, borderRadius: 20, bg: primary`
- Send disabled (empty input): `opacity: 0.4`

### 5.4 Empty State

```
┌─────────────────────────────────────┐
│  [AI Icon]  buddy                   │
├─────────────────────────────────────┤
│                                     │
│                                     │
│            [AI Icon 64px]           │
│                                     │
│       Xin chào! Mình là Buddy      │
│     bạn đồng hành giúp bạn xây    │
│      dựng thói quen tốt. Hãy      │
│      bắt đầu trò chuyện nào!      │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Hôm nay?] [Streak] [Động viên]    │
├─────────────────────────────────────┤
│  ┌───────────────────────────┐ [➤] │
│  │ Nhập tin nhắn...          │      │
│  └───────────────────────────┘      │
└─────────────────────────────────────┘
```

---

## 6. Luồng dữ liệu

```
1. Người dùng gõ tin nhắn hoặc bấm Quick Action
   │
2. Thêm tin nhắn user vào state (hiển thị ngay trên UI)
   │
3. buddyService.saveMessage('user', content) ──> Supabase
   │
4. isSending = true (hiện typing indicator)
   │
5. buildHabitContext():
   │  ├── habitService.getHabits()
   │  └── completionService.getCompletionsForDate(today)
   │  → { habits, todayProgress, streaks }
   │
6. geminiService.sendBuddyMessage(
   │    userMessage,
   │    last10Messages,
   │    habitContext
   │  ) ──> Gemini API
   │
7. Nhận response từ Gemini
   │
8. buddyService.saveMessage('assistant', response) ──> Supabase
   │
9. Thêm tin nhắn assistant vào state (hiển thị trên UI)
   │
10. isSending = false (ẩn typing indicator)
```

**Xử lý lỗi:** Nếu Gemini API fail → hiển thị bubble lỗi màu đỏ nhạt: "Buddy đang gặp sự cố, bạn thử lại nhé!" kèm nút "Thử lại".

---

## 7. Kế hoạch triển khai

### Bước 1: Database Migration
- Tạo `supabase/migrations/20260308000001_buddy_messages.sql`
- Apply migration, chạy `npm run gen:types`

### Bước 2: Buddy Service
- Tạo `src/api/buddyService.js` (CRUD messages)
- Export từ `src/api/index.js`

### Bước 3: Mở rộng Gemini Service
- Thêm `sendBuddyMessage()` vào `src/api/geminiService.js`
- Multi-turn conversation format với systemInstruction

### Bước 4: UI Components
- Tạo `src/components/molecules/MessageBubble.js`
- Tạo `src/components/molecules/ChatInput.js`
- Export từ `src/components/molecules/index.js`

### Bước 5: BuddyScreen
- Cập nhật `components/screens/BuddyScreen.js`
- Tích hợp habit context builder
- Kết nối services, xử lý states

### Bước 6: Testing & Polish
- Test các kịch bản hội thoại
- Tinh chỉnh system prompt
- Tối ưu hiệu năng

---

## 8. Lưu ý kỹ thuật

| Vấn đề | Giải pháp |
|--------|----------|
| **API Quota** | Không cho gửi tin mới khi chưa nhận trả lời (isSending lock) |
| **Context window** | Giới hạn 10 tin nhắn gần nhất trong conversation history |
| **Habit data** | Cache 1 lần khi focus (`useFocusEffect`), không load lại mỗi tin nhắn |
| **Offline** | Hiện thông báo "Bạn cần kết nối mạng để trò chuyện với Buddy" |
| **Client-side API key** | Chấp nhận cho MVP, cần chuyển sang backend proxy cho production |
| **Không có streaming** | Hiện typing indicator cho đến khi có full response |

---

## 9. Tiêu chí hoàn thành (Definition of Done)

- [ ] Người dùng mở tab Buddy và thấy giao diện chat
- [ ] Empty state hiển thị đúng khi chưa có tin nhắn
- [ ] Người dùng gửi tin nhắn và nhận trả lời từ Buddy bằng tiếng Việt
- [ ] Buddy trả lời dựa trên dữ liệu thói quen thực tế
- [ ] Typing indicator hiển thị khi đang chờ trả lời
- [ ] Quick action chips hoạt động và gửi câu hỏi tương ứng
- [ ] Lịch sử tin nhắn lưu vào Supabase và hiển thị khi quay lại
- [ ] Xử lý lỗi (API fail, không có mạng) hiện thông báo phù hợp
- [ ] UI nhất quán với phong cách app (COLORS, FONTS, lowercase style)
