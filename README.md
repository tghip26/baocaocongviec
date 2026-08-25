# 📊 HỆ THỐNG BÁO CÁO CÔNG VIỆC & CỔNG GIÁM ĐỊNH BHYT

> Ứng dụng web xử lý, chuẩn hóa dữ liệu và xuất báo cáo Excel tự động cho **Cổng Giám Định BHYT** và **Phòng Công Nghệ Thông Tin**.

🔗 **Website trực tuyến:** [https://baocaocongviec-zeta.vercel.app/](https://baocaocongviec-zeta.vercel.app/)

---

## 🌟 Chức năng chính

### 1. Báo Cáo Cổng Giám Định
- Nhận file Excel báo cáo cổng giám định (`.xlsx`, `.xlsm`).
- Lọc tự động **32 khoa / phòng / người dùng** được phê duyệt.
- Tự động phát hiện dòng tiêu đề header STT, Người dùng và các cột ngày (1 - 31).
- Hỗ trợ chọn chu kỳ xuất báo cáo:
  - **Ngày 01 → 14** (Tổng hợp nửa đầu tháng).
  - **Ngày 15 → 31** (Tổng hợp nửa cuối tháng).
- Tự động đánh lại số thứ tự (STT), gộp ô tiêu đề, định dạng font chữ, border và độ rộng cột.
- Xuất file: `DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM.xlsx`.

### 2. Báo Cáo Công Việc P.CNTT
- Đọc dữ liệu lượt hỗ trợ phần mềm (Cột E → Y) và nhật ký sửa lỗi khác (Cột AI).
- Tự động lọc các khoa phòng có phát sinh công việc thực tế.
- Tự động gộp và loại bỏ trùng lặp các mô tả lỗi khác cho từng khoa.
- Tự động tính tổng cộng các cột số và tổng lỗi sửa chữa khác.
- Xuất file: `TỔNG HỢP CÔNG VIỆC P.CNTT.xlsx`.

---

## 🚀 Công nghệ sử dụng
- **Giao diện Web**: HTML5, Vanilla CSS3 (Glassmorphism & Dark mode), JavaScript ES6+.
- **Xử lý Excel**: [ExcelJS](https://github.com/exceljs/exceljs) (100% Client-side, không cần máy chủ).
- **Mã nguồn Python nguyên bản**: `CT_BC_CV_Giamdinh_Gop.py` (Desktop GUI Tkinter & OpenPyXL).
- **Deploy**: Vercel & GitHub Pages.
