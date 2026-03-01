# Cursor rules — best practices

Các rule này giúp AI và **lập trình viên làm chung** giữ code và quy trình nhất quán.

## Cho team (luôn áp dụng)

| Rule | Mục đích |
|------|----------|
| **team-conventions.mdc** | Quy ước chung: branch, commit, cấu trúc `src/`, bảo mật, DB, docs, checklist trước merge |
| **code-style.mdc** | Đồng bộ style: đặt tên, file, comment, xử lý lỗi |

## Theo ngữ cảnh (khi mở file liên quan)

| Rule | Khi nào | Mục đích |
|------|---------|----------|
| **project-structure.mdc** | Always | Stack, `src/` layout, imports, docs |
| **database-and-migrations.mdc** | Supabase migrations, types, DB docs | Cách đổi DB và gen types |
| **supabase-api.mdc** | `src/api/**`, Supabase config | Client, env, queries, errors |
| **atomic-design.mdc** | `src/components/**`, `components/**` | Atoms, molecules, organisms |
| **screens-navigation.mdc** | Screens, navigation, App.js | Import màn hình và nav |

Giữ đồng bộ với `.cursorrules` và `docs/architecture.md`.
