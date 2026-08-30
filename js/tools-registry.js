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
    id: "web-cms",
    name: "Đăng Bài Web & Xuất Ảnh PDF",
    icon: "code"
  },
  {
    id: "duty",
    name: "Lịch Trực Phòng CNTT",
    icon: "calendar"
  },
  {
    id: "schema",
    name: "Tra Cứu Schema & Sinh SQL",
    icon: "database"
  },
  {
    id: "giamdinh",
    name: "Báo Cáo Giám Định & CNTT",
    icon: "file-spreadsheet"
  },
  {
    id: "vgca",
    name: "Cấp CKS & Email (VGCA)",
    icon: "shield-check"
  }
];

window.TOOLS_REGISTRY = [
  {
    id: "word-to-html",
    categoryId: "web-cms",
    title: "Chuyển Word sang HTML/CSS",
    subtitle: "Trích xuất văn bản, bảng biểu, ảnh Base64 chuẩn CMS",
    description: "Tự động trích xuất nội dung văn bản, bảng biểu và ảnh Base64 từ file Word (.docx) sang mã HTML kèm CSS Inline để dán thẳng vào CMS website.",
    badge: "Đăng Bài Web / CMS",
    badgeColor: "indigo",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>`,
    inputType: "word-to-html-interactive",
    acceptWord: ".docx",
    outputName: "Bai_viet_Website.html",
    guide: [
      "Bước 1: Chọn hoặc kéo thả tệp Word (.docx) bài viết vào khung tải tệp.",
      "Bước 2: Hệ thống chuyển đổi thành mã HTML chuẩn CMS kèm ảnh Base64.",
      "Bước 3: Xem trước hoặc sửa trực tiếp trên tab [✏️ Sửa Mã HTML].",
      "Bước 4: Nhấn '📋 Sao chép mã HTML' và dán vào CMS website."
    ],
    executeKey: "openWordToHtml"
  },
  {
    id: "pdf-to-image",
    categoryId: "web-cms",
    title: "Xuất Ảnh Từng Trang File PDF",
    subtitle: "Trích xuất ảnh PNG/JPG/WebP chất lượng cao (300 DPI), tải trọn bộ ZIP",
    description: "Chuyển đổi từng trang hoặc toàn bộ tài liệu PDF thành ảnh PNG/JPG sắc nét 300 DPI. Hỗ trợ tải trọn bộ ZIP hoặc sao chép ảnh nhanh.",
    badge: "Xuất Ảnh PDF 300 DPI",
    badgeColor: "emerald",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"/></svg>`,
    inputType: "pdf-to-image-interactive",
    acceptPdf: ".pdf",
    outputName: "PDF_Images.zip",
    guide: [
      "Bước 1: Chọn tệp PDF cần trích xuất ảnh.",
      "Bước 2: Chọn các trang muốn xuất (Tất cả, Trang lẻ, Trang chẵn).",
      "Bước 3: Tùy chỉnh định dạng (PNG, JPG, WebP) và độ sắc nét 300 DPI.",
      "Bước 4: Nhấn '📦 Tải Tất Cả (.ZIP)' hoặc tải nhanh từng trang."
    ],
    executeKey: "openPdfToImage"
  },
  {
    id: "schema-lookup",
    categoryId: "schema",
    title: "Tra Cứu Database Schema VIMES",
    subtitle: "Tra cứu cấu trúc 1,170 bảng & 20,852 biến CSDL HIS VIMES",
    description: "Tìm kiếm bảng theo tên biến/cột hoặc tên bảng, xem kiểu dữ liệu, khóa chính và sinh câu lệnh SQL tức thì.",
    badge: "1,170 Bảng & 20,852 Biến",
    badgeColor: "cyan",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    inputType: "schema-interactive",
    outputName: "VIMES_Schema_Dictionary.xlsx",
    guide: [
      "Bước 1: Chọn chế độ tìm kiếm: 'Theo Tên Biến' hoặc 'Theo Tên Bảng'.",
      "Bước 2: Nhập từ khóa (ví dụ: patientno, docno, invoiceno, icd10...).",
      "Bước 3: Nhấp vào bảng để xem toàn bộ danh sách cột, kiểu dữ liệu và PK.",
      "Bước 4: Nhấp 'Tạo SQL SELECT' để lấy câu lệnh truy vấn."
    ],
    executeKey: "openSchemaLookup"
  },
  {
    id: "sql-builder",
    categoryId: "schema",
    title: "Trình Sinh SQL Báo Cáo VIMES",
    subtitle: "Mẫu báo cáo thường quy & Dựng truy vấn SQL chuẩn xác",
    description: "Bộ sưu tập mẫu câu lệnh SQL báo cáo nghiệp vụ (Ngoại trú, Nội trú, Doanh thu, Kê đơn, PTTT) kèm trình dựng SQL tùy biến trực quan.",
    badge: "Sinh Lệnh SQL Báo Cáo",
    badgeColor: "cyan",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><polyline points="14 15 18 19 22 15"/></svg>`,
    inputType: "sql-builder-interactive",
    outputName: "Bao_cao_SQL_VIMES.sql",
    guide: [
      "Bước 1: Chọn mẫu báo cáo cần sinh (Ngoại trú, Nội trú, Doanh thu, Dược...).",
      "Bước 2: Tùy chỉnh khoảng thời gian (Hôm nay, Tháng này, Năm nay).",
      "Bước 3: Xem trước câu lệnh SQL với cú pháp tô màu chuẩn xác.",
      "Bước 4: Nhấn '📋 Sao Chép SQL' hoặc '💾 Tải File .SQL'."
    ],
    executeKey: "openSqlBuilder"
  },
  {
    id: "duty-roster",
    categoryId: "duty",
    title: "Lịch Trực & Chấm Công P.CNTT",
    subtitle: "Xếp ca trực công bằng, quản lý tài khoản user & xuất Excel chấm công",
    description: "Xếp lịch trực tự động cho 8 cán bộ P.CNTT, quản lý tài khoản (admin xem mật khẩu), xem lịch cá nhân và xuất Excel chấm công.",
    badge: "Lịch Trực Phòng CNTT",
    badgeColor: "cyan",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M15 14h2"/><path d="M15 17h3"/></svg>`,
    inputType: "duty-roster-interactive",
    outputName: "Lich_Truc_Phong_CNTT.xlsx",
    guide: [
      "Bước 1: Quản lý danh sách 8 cán bộ P.CNTT và tài khoản đăng nhập.",
      "Bước 2: Chọn Tháng / Năm và nhấn '⚡ Xếp Lịch Tự Động'.",
      "Bước 3: Nhấp vào từng ngày để đổi cán bộ trực khi có nhu cầu.",
      "Bước 4: Chuyển tab '⭐ Lịch Của Tôi' hoặc nhấn '📊 Xuất Excel'."
    ],
    executeKey: "openDutyRoster"
  },
  {
    id: "bhyt-xml",
    categoryId: "giamdinh",
    title: "Kiểm Tra Lỗi XML BHYT (QĐ 130 & 4210)",
    subtitle: "Quét lỗi thẻ, ngày giờ, ICD-10 & cân đối tài chính trước khi gửi Cổng",
    description: "Tự động phân tích gói file XML 1..5/130 (hoặc file .ZIP), phát hiện sai định dạng thẻ, logic ngày vào/ra, chẩn đoán, trùng lặp và lệch tiền.",
    badge: "BHYT QĐ 130 & 4210",
    badgeColor: "rose",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
    inputType: "bhyt-xml-interactive",
    acceptFile: ".xml, .zip",
    outputName: "Bao_Cao_Loi_XML_BHYT.xlsx",
    guide: [
      "Bước 1: Chọn hoặc kéo thả các tệp XML 1..5 hoặc tệp nén .ZIP chứa hồ sơ BHYT.",
      "Bước 2: Hệ thống tự động phân tích cú pháp và kiểm tra toàn bộ danh mục quy tắc.",
      "Bước 3: Xem phân loại hồ sơ Hợp lệ / Cảnh báo / Lỗi nặng và lọc theo nhóm lỗi.",
      "Bước 4: Nhấn '📊 Xuất Báo Cáo Excel' để gửi các khoa phòng/bác sĩ chỉnh sửa."
    ],
    executeKey: "openBhytXml"
  },
  {
    id: "giam-dinh",
    categoryId: "giamdinh",
    title: "Báo Cáo Cổng Giám Định BHYT",
    subtitle: "Lọc chu kỳ ngày 01-14 hoặc 15-31 & chuẩn hóa định dạng",
    description: "Tự động lọc dữ liệu báo cáo giám định theo chu kỳ ngày, giữ nguyên định dạng, công thức và màu sắc chuẩn Bộ Y tế.",
    badge: "Bảo hiểm Y tế",
    badgeColor: "blue",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    inputType: "single-excel",
    acceptFile: ".xlsx, .xlsm, .xls",
    outputName: "DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM.xlsx",
    guide: [
      "Bước 1: Chọn hoặc kéo thả tệp Excel Báo cáo Giám định.",
      "Bước 2: Chọn khoảng ngày (Ngày 01-14 hoặc Ngày 15-31).",
      "Bước 3: Nhấn TIẾP TỤC để xử lý và tạo tệp Excel định dạng chuẩn.",
      "Bước 4: Tải tệp kết quả về máy tính."
    ],
    executeKey: "runGiamDinh"
  },
  {
    id: "cntt",
    categoryId: "giamdinh",
    title: "Báo Cáo Công Việc P.CNTT",
    subtitle: "Xử lý & định dạng bảng tổng hợp công việc CNTT",
    description: "Chọn Sheet công việc từ file Excel, tự động chuẩn hóa font chữ, viền bảng và căn chỉnh bố cục báo cáo chuyên nghiệp.",
    badge: "Phòng CNTT",
    badgeColor: "emerald",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    inputType: "single-excel",
    acceptFile: ".xlsx, .xlsm, .xls",
    outputName: "TỔNG HỢP CÔNG VIỆC P.CNTT.xlsx",
    guide: [
      "Bước 1: Chọn tệp Excel Báo cáo công việc.",
      "Bước 2: Chọn Sheet cần xuất trong danh sách sheet.",
      "Bước 3: Nhấn TIẾP TỤC để hệ thống định dạng lại bảng biểu.",
      "Bước 4: Tải tệp kết quả về máy tính."
    ],
    executeKey: "runCntt"
  },
  {
    id: "vgca-doi-chieu",
    categoryId: "vgca",
    title: "Đối Chiếu Word & SSO (19 Cột VGCA)",
    subtitle: "Trích xuất nhiều đơn Word & ghép tài khoản SSO chuẩn 19 cột",
    description: "Đọc hàng loạt đơn đề nghị (.docx), ghép đôi với danh sách SSO Excel để lấy Email công vụ và xuất file Excel 19 cột chuẩn VGCA.",
    badge: "Chuẩn VGCA 19 cột",
    badgeColor: "violet",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 12 14 22 4"/></svg>`,
    inputType: "word-and-sso",
    acceptWord: ".docx",
    acceptSso: ".xlsx, .xls, .xlsm",
    outputName: "Ket_qua.xlsx",
    guide: [
      "Bước 1: Tải lên các tệp đơn đề nghị (.docx).",
      "Bước 2: Tải lên tệp Excel danh sách SSO công vụ.",
      "Bước 3: Nhấn 'BẮT ĐẦU XỬ LÝ ĐỐI CHIẾU'.",
      "Bước 4: Tải về file Ket_qua.xlsx (19 cột chuẩn VGCA)."
    ],
    executeKey: "runVgcaDoiChieu"
  },
  {
    id: "vgca-cks",
    categoryId: "vgca",
    title: "Tổng Hợp Cấp Chữ Ký Số (CKS)",
    subtitle: "Quét hàng loạt đơn Word & xuất file TXT CKS chuẩn UTF-8",
    description: "Quét bảng biểu từ các đơn Word (.docx), ghép chuỗi 'CCCD;Ngày cấp;Nơi cấp' và xuất file DANH_SACH_TONG_HOP.txt chuẩn định dạng.",
    badge: "Chữ ký số (CKS)",
    badgeColor: "amber",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    inputType: "word-and-sso",
    acceptWord: ".docx",
    acceptSso: ".xlsx, .xls, .xlsm",
    outputName: "DANH_SACH_TONG_HOP.txt",
    guide: [
      "Bước 1: Tải lên các tệp đơn đề nghị cấp CKS dạng Word (.docx).",
      "Bước 2: Tải thêm tệp SSO Excel (nếu có để điền Email công vụ).",
      "Bước 3: Nhấn 'BẮT ĐẦU TỔNG HỢP CKS'.",
      "Bước 4: Tải về file DANH_SACH_TONG_HOP.txt."
    ],
    executeKey: "runVgcaCks"
  },
  {
    id: "vgca-email",
    categoryId: "vgca",
    title: "Tổng Hợp Cấp Email Công Vụ",
    subtitle: "Quét đơn Word & xuất danh sách cấp Email 8 cột",
    description: "Đọc tự động nhân sự từ các đơn xin cấp Email công vụ (.docx), xuất ra tệp DANH_SACH_EMAIL_CONG_VU.txt chuẩn 8 cột.",
    badge: "Thư điện tử",
    badgeColor: "indigo",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    inputType: "word-only",
    acceptWord: ".docx",
    outputName: "DANH_SACH_EMAIL_CONG_VU.txt",
    guide: [
      "Bước 1: Tải lên các tệp đơn xin cấp Email công vụ (.docx).",
      "Bước 2: Nhấn 'BẮT ĐẦU TỔNG HỢP EMAIL'.",
      "Bước 3: Hệ thống trích xuất bảng dữ liệu nhân sự.",
      "Bước 4: Tải về file DANH_SACH_EMAIL_CONG_VU.txt."
    ],
    executeKey: "runVgcaEmail"
  }
];

window.getToolById = function(toolId) {
  return window.TOOLS_REGISTRY.find(t => t.id === toolId);
};
