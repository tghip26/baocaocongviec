/**
 * tools-registry.js
 * Central registry for all tools in the portal.
 * Modular, extensible architecture for easy addition of new tools in the future.
 */

window.TOOLS_CATEGORIES = [
  {
    id: "all",
    name: "Tất cả công cụ",
    icon: "grid"
  },
  {
    id: "giamdinh",
    name: "Báo cáo Giám định & P.CNTT",
    icon: "file-spreadsheet"
  },
  {
    id: "vgca",
    name: "Cấp CKS & Email Công Vụ (VGCA)",
    icon: "shield-check"
  }
];

window.TOOLS_REGISTRY = [
  {
    id: "giam-dinh",
    categoryId: "giamdinh",
    title: "Báo cáo Cổng Giám định Bảo hiểm",
    subtitle: "Lọc chu kỳ ngày & định dạng báo cáo giám định",
    description: "Tự động phát hiện ngày hiện tại, lọc dữ liệu theo khoảng ngày 01-14 hoặc 15-31, giữ nguyên định dạng, bảng kẻ, công thức và màu sắc chuẩn.",
    badge: "Bảo hiểm Y tế",
    badgeColor: "blue",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    inputType: "single-excel",
    acceptFile: ".xlsx, .xlsm, .xls",
    outputName: "DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM.xlsx",
    guide: [
      "Bước 1: Chọn hoặc kéo thả tệp Excel Báo cáo Giám định vào khung tải tệp.",
      "Bước 2: Hệ thống tự động mở hộp thoại chọn khoảng ngày (Ngày 01-14 hoặc Ngày 15-31).",
      "Bước 3: Nhấn TIẾP TỤC để hệ thống xử lý, lọc phòng ban hợp lệ và tạo tệp Excel định dạng chuẩn.",
      "Bước 4: Tệp kết quả sẽ tự động tải về máy tính."
    ],
    executeKey: "runGiamDinh"
  },
  {
    id: "cntt",
    categoryId: "giamdinh",
    title: "Báo cáo Công việc P.CNTT",
    subtitle: "Xử lý & định dạng bảng tổng hợp công việc CNTT",
    description: "Cho phép chọn Sheet công việc cần xuất từ file Excel, tự động chuẩn hóa font chữ, viền bảng, căn lề và định dạng báo cáo chuyên nghiệp.",
    badge: "Phòng CNTT",
    badgeColor: "emerald",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    inputType: "single-excel",
    acceptFile: ".xlsx, .xlsm, .xls",
    outputName: "TỔNG HỢP CÔNG VIỆC P.CNTT.xlsx",
    guide: [
      "Bước 1: Chọn hoặc kéo thả tệp Excel Báo cáo vào khung tải tệp.",
      "Bước 2: Chọn Sheet cần xuất trong danh sách sheet của tệp.",
      "Bước 3: Nhấn TIẾP TỤC để hệ thống định dạng lại bảng biểu, căn chỉnh tiêu đề.",
      "Bước 4: Tệp kết quả sẽ tự động tải về máy tính."
    ],
    executeKey: "runCntt"
  },
  {
    id: "vgca-doi-chieu",
    categoryId: "vgca",
    title: "Đối chiếu Word & SSO -> Excel 19 Cột (VGCA)",
    subtitle: "Trích xuất nhiều đơn Word & ghép tài khoản SSO",
    description: "Đọc hàng loạt đơn đề nghị (.docx), trích xuất thông tin người dùng (Họ tên, CCCD, ngày sinh, nơi cấp...), tự động đối chiếu với danh sách SSO Excel để lấy Email công vụ và xuất file Excel Ket_qua.xlsx đúng 19 cột chuẩn VGCA.",
    badge: "Chuẩn VGCA 19 cột",
    badgeColor: "violet",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 12 14 22 4"/></svg>`,
    inputType: "word-and-sso",
    acceptWord: ".docx",
    acceptSso: ".xlsx, .xls, .xlsm",
    outputName: "Ket_qua.xlsx",
    guide: [
      "Bước 1: Tải lên các tệp Word (.docx) chứa bảng biểu đề nghị cấp CKS.",
      "Bước 2: Tải lên tệp Excel danh sách tài khoản SSO công vụ để đối chiếu tự động.",
      "Bước 3: Nhấn 'BẮT ĐẦU XỬ LÝ ĐỐI CHIẾU'.",
      "Bước 4: Hệ thống tự động ghép đôi Họ tên + CCCD để lấy Email công vụ, hiển thị bảng xem trước và tải về file Ket_qua.xlsx (19 cột chuẩn)."
    ],
    executeKey: "runVgcaDoiChieu"
  },
  {
    id: "vgca-cks",
    categoryId: "vgca",
    title: "Tổng hợp Đề nghị cấp Chữ ký số (CKS)",
    subtitle: "Quét hàng loạt đơn Word & xuất file TXT CKS",
    description: "Quét và trích xuất tất cả bảng biểu từ các đơn Word (.docx), ghép chuỗi 'CCCD;Ngày cấp;Nơi cấp' và đối chiếu SSO (tùy chọn) để xuất ra tệp DANH_SACH_TONG_HOP.txt định dạng CSV chuẩn.",
    badge: "Chữ ký số (CKS)",
    badgeColor: "amber",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    inputType: "word-and-sso",
    acceptWord: ".docx",
    acceptSso: ".xlsx, .xls, .xlsm",
    outputName: "DANH_SACH_TONG_HOP.txt",
    guide: [
      "Bước 1: Tải lên các tệp đơn đề nghị cấp CKS dạng Word (.docx).",
      "Bước 2: Tải thêm tệp SSO Excel (nếu có để tự động điền Email công vụ).",
      "Bước 3: Nhấn 'BẮT ĐẦU TỔNG HỢP CKS'.",
      "Bước 4: Tải về file DANH_SACH_TONG_HOP.txt (chuẩn mã UTF-8 with BOM)."
    ],
    executeKey: "runVgcaCks"
  },
  {
    id: "vgca-email",
    categoryId: "vgca",
    title: "Tổng hợp Đề nghị cấp Email Công Vụ",
    subtitle: "Quét đơn Word & xuất danh sách cấp Email",
    description: "Đọc tự động danh sách cán bộ nhân viên từ các đơn xin cấp Email công vụ dạng Word (.docx), xuất ra tệp DANH_SACH_EMAIL_CONG_VU.txt chuẩn 8 cột (Họ tên, Ngày sinh, SĐT, CCCD, Đơn vị, Chức vụ, Ghi chú).",
    badge: "Thư điện tử",
    badgeColor: "indigo",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    inputType: "word-only",
    acceptWord: ".docx",
    outputName: "DANH_SACH_EMAIL_CONG_VU.txt",
    guide: [
      "Bước 1: Tải lên các tệp đơn xin cấp Email công vụ (.docx).",
      "Bước 2: Nhấn 'BẮT ĐẦU TỔNG HỢP EMAIL'.",
      "Bước 3: Hệ thống trích xuất và hiển thị bảng dữ liệu nhân sự.",
      "Bước 4: Tải về file DANH_SACH_EMAIL_CONG_VU.txt."
    ],
    executeKey: "runVgcaEmail"
  }
];

// Helper to get tool by ID
window.getToolById = function(toolId) {
  return window.TOOLS_REGISTRY.find(t => t.id === toolId);
};
