# Database schema — Tóm tắt

Schema chi tiết (SQL) nằm trong **`supabase/migrations/`** (Single Source of Truth). Thư mục `database/` giữ bản tách file tham khảo (01_tables, 02_indexes, …); khi đổi DB thì cập nhật migration trước, sau đó cập nhật tài liệu này nếu cần.

## Bảng chính

| Bảng | Mô tả |
|------|--------|
| **profiles** | Thông tin user (id, email, full_name, avatar_url); mở rộng auth.users. |
| **habits** | Thói quen: title, description, category, frequency, streak, is_active, … |
| **habit_completions** | Lần hoàn thành theo ngày; unique (habit_id, completion_date). |
| **habit_images** | Ảnh đính kèm, AI verification; liên kết habit và optional completion. |
| **onboarding_data** | Dữ liệu onboarding (habit_name, distraction, notifications); một bản ghi/user. |
| **habit_no_auto_pause** | Đánh dấu habit không auto-pause (sau 7 ngày); insert bởi job định kỳ. |

## Quan hệ

- `profiles.id` = `auth.users.id`.
- `habits.user_id` → auth.users; `habit_completions.habit_id` → habits; `habit_completions.user_id` → auth.users.
- `habit_images.habit_id` → habits; `habit_images.completion_id` → habit_completions (optional).
- `onboarding_data.user_id` → auth.users (unique).
- `habit_no_auto_pause.habit_id` → habits (unique); `habit_no_auto_pause.user_id` → auth.users.

## RLS

Tất cả bảng bật RLS; user chỉ truy cập dữ liệu của chính mình (`auth.uid() = user_id` hoặc tương đương). Bảng `habit_no_auto_pause` chỉ cho user SELECT; INSERT do function `insert_no_auto_pause_after_7_days()` (SECURITY DEFINER) thực hiện.
