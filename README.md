# 🏥 CỔNG CÔNG CỤ NGHIỆP VỤ & BÁO CÁO Y TẾ TẬP TRUNG
## BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2

> Nền tảng Web tích hợp đa công cụ tự động hóa xử lý dữ liệu y tế, đối chiếu danh sách, cấp chứng thư số và xuất báo cáo chuẩn định dạng Excel & TXT trực tiếp trên trình duyệt 100% Client-side siêu tốc và bảo mật.

🔗 **Trang Web Trực Tuyến:** [https://baocaocongviec-zeta.vercel.app/](https://baocaocongviec-zeta.vercel.app/)  
📦 **Kho Mã Nguồn GitHub:** [https://github.com/tghip26/baocaocongviec](https://github.com/tghip26/baocaocongviec)

---

## 🌟 Danh Sách Công Cụ Tích Hợp

### 📁 Nhóm 1: Báo Cáo Giám Định & P.CNTT
1. **📊 Báo Cáo Cổng Giám Định Bảo Hiểm**
   - Lọc tự động các khoa / phòng / người dùng hợp lệ (`ALLOWED_USERS`).
   - Tự động phát hiện ngày hiện tại và gợi ý chu kỳ xuất: **Ngày 01 → 14** hoặc **Ngày 15 → 31**.
   - Giữ nguyên định dạng chuẩn, công thức, độ rộng cột và màu sắc bảng biểu.
   - Xuất file: `DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM.xlsx`.

2. **📑 Báo Cáo Công Việc P.CNTT**
   - Hỗ trợ chọn Sheet cần xử lý trực tiếp từ danh sách Sheet trong file Excel.
   - Đọc dữ liệu hỗ trợ phần mềm và nhật ký sửa lỗi khác (Cột AI), loại bỏ trùng lặp, tính tổng cộng.
   - Xuất file: `TỔNG HỢP CÔNG VIỆC P.CNTT.xlsx`.

### 🔐 Nhóm 2: Quản Lý Chứng Thư Số & Email Công Vụ (VGCA)
3. **⚡ Đối Chiếu Word & Excel SSO -> Xuất Excel 19 Cột Chuẩn VGCA**
   - Quét hàng loạt file Word (.docx) đề nghị cấp CKS để trích xuất thông tin cán bộ y tế (Họ tên, Ngày sinh, Số CCCD, Ngày cấp, Nơi cấp, SĐT, Chức vụ, Đơn vị...).
   - Tự động đối chiếu với danh sách SSO Excel theo (Họ tên + CCCD) để ghép chính xác Email công vụ.
   - Xuất file: `Ket_qua.xlsx` (đúng 19 cột chuẩn theo mẫu import VGCA Ban Cơ yếu Chính phủ).

4. **🔏 Tổng Hợp Danh Sách Đề Nghị Cấp Chữ Ký Số (CKS)**
   - Quét hàng loạt đơn Word (.docx) và trích xuất bảng biểu.
   - Ghép định dạng cột `CCCD;Ngày cấp;Nơi cấp` và đối chiếu SSO lấy email công vụ.
   - Xuất file: `DANH_SACH_TONG_HOP.txt` (CSV UTF-8 with BOM chuẩn 11 cột).

5. **📧 Tổng Hợp Danh Sách Đề Nghị Cấp Email Công Vụ**
   - Quét hàng loạt đơn Word (.docx) xin cấp tài khoản thư điện tử công vụ.
   - Trích xuất Họ tên, Ngày sinh, Di động, Số CCCD, Đơn vị, Chức vụ, Ghi chú ("Cấp mới").
   - Xuất file: `DANH_SACH_EMAIL_CONG_VU.txt` (CSV UTF-8 with BOM chuẩn 8 cột).

---

## 🛠️ Hướng Dẫn Mở Rộng Thêm Công Cụ Mới

Hệ thống được thiết kế theo kiến trúc **Tool Registry** độc lập, giúp dễ dàng tích hợp thêm các công cụ mới trong tương lai:

1. Mở file `js/tools-registry.js`.
2. Thêm cấu hình công cụ mới vào mảng `TOOLS_REGISTRY`:
```javascript
{
  id: "ten-cong-cu-moi",
  categoryId: "giamdinh", // hoặc "vgca" hoặc danh mục mới
  title: "Tiêu đề công cụ",
  subtitle: "Mô tả ngắn gọn",
  description: "Mô tả chi tiết chức năng...",
  badge: "Nhãn phân loại",
  badgeColor: "blue",
  icon: `<svg>...</svg>`,
  inputType: "single-excel", // "single-excel" | "word-and-sso" | "word-only"
  outputName: "Ket_qua_moi.xlsx",
  guide: [
    "Bước 1: ...",
    "Bước 2: ..."
  ],
  executeKey: "runTenCongCuMoi"
}
```
3. Viết hàm xử lý nghiệp vụ trong thư mục `js/` và đăng ký trong `app.js`.

---

## 🚀 Công Nghệ Sử Dụng
- **Giao diện Portal & Hub**: HTML5, Vanilla CSS3 (Deep Slate & Electric Sapphire Design System, Responsive, Micro-animations).
- **Phân tích Word (.docx)**: [JSZip](https://stuk.github.io/jszip/) + DOMParser (trích xuất cấu trúc XML bảng biểu trực tiếp 100% trong trình duyệt).
- **Đọc & Xuất Excel**: [SheetJS (xlsx)](https://sheetjs.com/) & [ExcelJS](https://github.com/exceljs/exceljs).
- **Triển khai Tự Động**: Vercel Serverless Static + GitHub Actions / Webhooks.
- **Mã nguồn máy tính (Desktop Python GUI)**: `CT_BC_CV_Giamdinh_Gop.py` và `app_tong_hop.py`.
