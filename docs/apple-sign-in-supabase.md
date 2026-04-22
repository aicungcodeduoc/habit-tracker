# Sign in with Apple + Supabase (iOS)

This app uses **native** Sign in with Apple (`expo-apple-authentication`) and `supabase.auth.signInWithIdToken({ provider: 'apple', ... })`. Configure the following so auth succeeds in production.

## 1. Apple Developer

1. Open **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Select the app identifier that matches **com.small.app** (same as `ios.bundleIdentifier` in `app.json`).
3. Enable **Sign In with Apple** → **Configure**. Choose **Enable as a primary App ID** for a standalone iOS app.
4. **Server-to-Server Notification Endpoint:** leave this **empty**. It is not the Supabase OAuth callback URL. [Supabase Auth does not support Apple’s server-to-server notification endpoint](https://supabase.com/docs/guides/auth/social-login/auth-apple) at this time; Apple will still allow you to save. (That URL is only if you operate your own HTTPS endpoint to process Apple’s account/revocation events.)
5. Create a **Services ID** (e.g. `com.small.app.signin`) if Supabase asks for a separate client identifier for the web/OAuth-style provider setup. Register the domains and return URLs that **Supabase** shows in the Apple provider settings.
6. Under **Keys**, create a key with **Sign In with Apple**, link it to the primary App ID. Download the **.p8** file once and note **Key ID** and **Team ID**.

## 2. Nhờ Account Holder lấy key (Sign in with Apple)

Dùng khi developer **không** switch được đúng team trên `developer.apple.com` nhưng **Account Holder** (ví dụ org **Tu Le Anh**) có quyền đầy đủ. Account Holder đăng nhập **đúng team** trên [developer.apple.com](https://developer.apple.com) rồi làm theo:

1. Vào **Certificates, Identifiers & Profiles** → **Keys** → nút **+** (tạo key mới).
2. Đặt tên key (ví dụ `Supabase Apple Auth`).
3. Bật **Sign in with Apple** → **Configure** → chọn **Primary App ID** = app thật (bundle ID trùng bản build, ví dụ `com.small.habit.tracker`).
4. Lưu / đăng ký key.
5. **Tải file `.p8` ngay** — Apple **chỉ cho tải một lần**; mất file phải tạo key mới.
6. Ghi lại **Key ID** (hiển thị sau khi tạo).
7. Ghi **Team ID** tại **Membership** (hoặc thông tin tài khoản developer).

**Chuyển cho người cấu hình Supabase (kênh bảo mật):**


| Thông tin      | Ghi chú                                                               |
| -------------- | --------------------------------------------------------------------- |
| **Team ID**    | Dùng tạo JWT secret cho Supabase.                                     |
| **Key ID**     | Kèm file `.p8` khi tạo secret.                                        |
| **File `.p8`** | Không gửi qua chat/email công khai; dùng vault / file chia sẻ nội bộ. |


**Tuỳ chọn:** Account Holder có thể **tự tạo Secret Key (JWT)** theo [Supabase — Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple) rồi chỉ gửi **chuỗi secret** để dán vào Supabase, giữ `.p8` nội bộ.

**Lưu ý:** Secret OAuth kiểu Apple **hết hạn khoảng 6 tháng** — cần quy trình tạo lại và cập nhật Supabase định kỳ.

## 3. Supabase Dashboard (form fields)

Open **Authentication** → **Providers** → **Apple** and turn **Enable Sign in with Apple** on.


| Field                            | What to enter (this app)                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client IDs**                   | Your iOS **bundle ID** for native sign-in: **com.small.app**. If you also created an Apple **Services ID** for the Supabase callback (web/OAuth side), add it in the same box, comma-separated, e.g. `com.small.app, com.small.app.signin`. Native `signInWithIdToken` tokens use the bundle ID as `aud`; including the Services ID is needed if you use that ID when generating the secret or for web. |
| **Secret Key (for OAuth)**       | A **client secret JWT** built from your Apple **Team ID**, **Key ID**, **Services ID** (often the same identifier you use for OAuth “client”), and the **.p8** private key. Supabase documents the exact JWT claims and tools/scripts; the dashboard warning applies: **this secret expires about every 6 months** — regenerate and paste a new one before it expires.                                  |
| **Allow users without an email** | Leave **off** unless users fail to sign in when Apple withholds email (e.g. edge cases). If needed, turn **on** so auth still succeeds without an email on the user record.                                                                                                                                                                                                                             |
| **Callback URL (for OAuth)**     | Click **Copy**. In Apple Developer → your **Services ID** → **Sign in with Apple** → **Configure**, add this URL under **Return URLs** (and the domain Supabase shows under **Domains** if required). Required for the OAuth half of the provider; native iOS still benefits from a correct overall Apple + Supabase setup.                                                                             |


Then **Save** the provider.

Also check **Authentication** → **URL Configuration** for redirect URLs used by **Google** (e.g. `small://`) if you use OAuth in the app.

Full reference: [Supabase — Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple).

## 4. Xcode / iOS build

- The target should include the **Sign In with Apple** capability (this repo adds `com.apple.developer.applesignin` in `ios/small/small.entitlements`).
- Regenerate the **App Store / ad hoc** provisioning profile after enabling the capability, then archive a new build.

## 5. Client behavior

- **Login** and **Onboarding** show the Apple button only on **iOS**.
- After a successful sign-in, onboarding data is synced with `syncOnboardingToDatabase()` like the Google flow.

If sign-in fails with a provider configuration error, re-check Apple Services ID, key, and Supabase Apple provider fields against the Supabase docs for your project region.