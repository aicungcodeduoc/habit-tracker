# Hướng dẫn Phát hành Ứng dụng (App Publication Guide)

Dưới đây là các yêu cầu và thông tin cần thiết để phát hành ứng dụng lên App Store.

## 1. Hình ảnh & Đồ họa (Assets)

### App Icon

* [ ] **Kích thước:** 1024 x 1024 px (định dạng .png).
* [ ] **Lưu ý:** Không để góc bo tròn (Apple sẽ tự bo), không dùng ảnh có nền trong suốt.

### Screenshots (Ảnh chụp màn hình)

Bạn cần ít nhất các bộ khung hình sau (phổ biến nhất):

* **iPhone 6.7"** (iPhone 14/15/16 Pro Max): 1290 x 2796 px.
* **iPhone 6.5"** (iPhone 11 Pro Max/XS Max): 1242 x 2688 px.

## 2. Các URL bắt buộc

Apple yêu cầu các đường link này để đảm bảo quyền lợi và hỗ trợ người dùng:

### Privacy Policy URL (Bắt buộc)

Đây là trang web nêu rõ bạn thu thập dữ liệu gì, dùng làm gì và bảo mật ra sao.

* *Mẹo:* Bạn có thể dùng các công cụ tạo Privacy Policy miễn phí hoặc host một trang đơn giản trên Notion/GitHub Pages.

### Support URL (Bắt buộc)

Đường link để người dùng liên hệ khi gặp lỗi. Có thể là một trang Contact, form Google, hoặc thậm chí là link dẫn đến Fanpage/Email của bạn.

### Marketing URL (Tùy chọn)

Trang web giới thiệu tính năng của app (Landing Page). Nếu chưa có, bạn có thể dùng chung link với Support URL.

---

## 3. Thông tin tài khoản & Pháp lý

### Domain chính

Apple không bắt buộc bạn phải có một domain riêng kiểu `www.myapp.com` cho ứng dụng, nhưng bạn cần có domain để chứa các URL về Privacy và Support nêu trên.

### Copyright

Dòng thông báo bản quyền (Ví dụ: 2026 Bruno Co., Ltd).

* **Đề xuất cho dự án này:** 2026 small App

### Dữ liệu liên hệ

Tên, số điện thoại, email của bạn để Apple liên lạc khi cần.

---

## 4. Thông tin cung cấp cho Reviewer (App Review Information)

Nếu ứng dụng của bạn yêu cầu đăng nhập, bạn phải cung cấp:

### Account đăng nhập demo

* **Username:** (Cần cung cấp)
* **Password:** (Cần cung cấp)
  để nhân viên Apple có thể vào test các tính năng bên trong.

### Thông tin liên hệ

Tên và số điện thoại của người phụ trách (là bạn) để họ gọi nếu có thắc mắc trong quá trình duyệt.

---

## 💡 Một số lưu ý nhỏ

* **Kích thước ảnh:** Nếu bạn không có đủ các dòng máy iPhone, hãy dùng các công cụ như [Previewed.app](https://previewed.app) hoặc [Shot.ly](https://shot.ly) để tạo mockup đúng chuẩn Apple rất nhanh.
* **Tên App:** Không quá 30 ký tự. (Tên hiện tại: `small`)
* **Subtitle:** Đoạn mô tả ngắn dưới tên app, cũng tối đa 30 ký tự.

---

## 🛠 Thông tin kỹ thuật từ dự án

* **App Name:** small
* **Bundle ID:** com.small.app
* **Platform:** Expo (iOS/Android)
