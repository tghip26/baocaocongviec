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
    name: "Đăng Bài Website & CMS",
    icon: "code"
  },
  {
    id: "duty",
    name: "Quản Lý Lịch Trực & Chấm Công",
    icon: "calendar"
  },
  {
    id: "schema",
    name: "Tra Cứu Database & Sinh SQL VIMES",
    icon: "database"
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
    id: "word-to-html",
    categoryId: "web-cms",
    title: "Chuyển Đổi Word sang HTML & CSS Inline",
    subtitle: "Trích xuất văn bản, bảng biểu, hình ảnh từ Word sang HTML chuẩn CMS",
    description: "Tự động trích xuất toàn bộ văn bản, hình ảnh nhúng (Base64), bảng biểu và danh sách từ file Word (.docx) sang mã HTML kèm CSS Inline chuẩn đẹp. Tự động nhận diện cặp ảnh 2 cột, loại bỏ header/footer hành chính để dán trực tiếp vào tab [Mã HTML] của CMS website.",
    badge: "Đăng Bài Web / CMS",
    badgeColor: "indigo",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>`,
    inputType: "word-to-html-interactive",
    acceptWord: ".docx",
    outputName: "Bai_viet_Website.html",
    guide: [
      "Bước 1: Chọn hoặc kéo thả tệp Word (.docx) bài viết, thông báo hoặc công văn vào khung tải tệp.",
      "Bước 2: Hệ thống tự động chuyển đổi thành mã HTML chuẩn CMS kèm ảnh Base64 và căn lề sắc nét.",
      "Bước 3: Xem trước bài viết trực tiếp hoặc chỉnh sửa trực tiếp trên tab [✏️ Sửa Mã HTML].",
      "Bước 4: Nhấn '📋 Sao chép mã HTML' và dán thẳng vào ô [Mã HTML / Source] của trình soạn thảo CMS website."
    ],
    executeKey: "openWordToHtml"
  },
  {
    id: "pdf-to-image",
    categoryId: "web-cms",
    title: "Xuất Ảnh Từng Trang File PDF (Đăng Web / Báo Cáo)",
    subtitle: "Trích xuất nhiều trang PDF thành ảnh PNG/JPG cùng lúc, tải trọn bộ ZIP",
    description: "Chuyển đổi từng trang hoặc nhiều trang tùy chọn trong file PDF thành hình ảnh sắc nét cao (PNG, JPG, WebP) với độ phân giải lên đến 300 DPI (2.0x, 3.0x). Hỗ trợ tải về trọn bộ file ZIP, tải từng trang riêng lẻ, sao chép ảnh vào Clipboard hoặc sao chép mã HTML thẻ <img> để đăng lên website.",
    badge: "Xuất Ảnh PDF Đa Năng",
    badgeColor: "emerald",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"/></svg>`,
    inputType: "pdf-to-image-interactive",
    acceptPdf: ".pdf",
    outputName: "PDF_Images.zip",
    guide: [
      "Bước 1: Kéo thả hoặc chọn tệp PDF cần trích xuất ảnh.",
      "Bước 2: Chọn các trang muốn xuất (Tất cả, Trang lẻ, Trang chẵn hoặc chọn từng ô checkbox).",
      "Bước 3: Tùy chỉnh định dạng (PNG, JPG, WebP) và độ sắc nét (1.0x, 1.5x, 2.0x - 300 DPI, 3.0x).",
      "Bước 4: Nhấn '📦 Tải Tất Cả Trang Đã Chọn (.ZIP)' để tải trọn bộ ảnh cùng lúc, hoặc tải nhanh từng trang."
    ],
    executeKey: "openPdfToImage"
  },
  {
    id: "schema-lookup",
    categoryId: "schema",
    title: "Tra Cứu Database Schema VIMES",
    subtitle: "Tra cứu chi tiết bảng theo tên biến & tên cột (1,170 bảng, 20,852 biến)",
    description: "Công cụ tìm kiếm và tra cứu toàn diện cơ sở dữ liệu VIMES. Tra cứu tức thì tất cả các bảng chứa một tên biến/cột cụ thể, xem kiểu dữ liệu, khóa chính, sinh câu lệnh SQL và tra cứu ngược liên kết bảng.",
    badge: "1,170 Bảng & 20,852 Biến",
    badgeColor: "cyan",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    inputType: "schema-interactive",
    outputName: "VIMES_Schema_Dictionary.xlsx",
    guide: [
      "Bước 1: Chọn chế độ tìm kiếm: '🔍 Theo Tên Biến / Tên Cột' (mặc định) hoặc '📋 Theo Tên Bảng'.",
      "Bước 2: Nhập tên biến/cột cần tìm (ví dụ: patientno, docno, invoiceno, doctor_id, card_id, roomid, icd10...).",
      "Bước 3: Nhấp vào bất kỳ bảng nào trong kết quả để xem toàn bộ danh sách cột, kiểu dữ liệu, trạng thái Khóa chính (PK).",
      "Bước 4: Nhấp nút 'Tạo SQL SELECT' hoặc nhấp vào từng tên biến để tra cứu ngược các bảng liên quan."
    ],
    executeKey: "openSchemaLookup"
  },
  {
    id: "sql-builder",
    categoryId: "schema",
    title: "Trình Sinh Câu Lệnh Báo Cáo SQL VIMES",
    subtitle: "Mẫu câu lệnh báo cáo chuẩn & Dựng truy vấn CSDL tự động",
    description: "Bộ sưu tập mẫu câu lệnh SQL báo cáo nghiệp vụ thường quy (KCB Ngoại trú, Bệnh nhân Nội trú, Doanh thu viện phí, Kê đơn dược, Phẫu thuật thủ thuật) và Trình dựng câu lệnh tùy biến trực quan chuẩn CSDL VIMES với đầy đủ lệnh JOIN bảng.",
    badge: "Sinh Lệnh SQL Báo Cáo",
    badgeColor: "cyan",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
    inputType: "sql-builder-interactive",
    outputName: "Bao_cao_SQL_VIMES.sql",
    guide: [
      "Bước 1: Chọn mẫu báo cáo cần sinh (Ngoại trú, Nội trú, Doanh thu, Kê đơn, PTTT) hoặc tự cấu hình bảng.",
      "Bước 2: Tùy chỉnh các trường dữ liệu, khoảng thời gian (Hôm nay, Tháng này, Năm nay) và điều kiện lọc.",
      "Bước 3: Xem trước câu lệnh SQL với cú pháp tô màu chuẩn xác.",
      "Bước 4: Nhấn '📋 Sao Chép SQL' để dán vào DBeaver / Navicat / pgAdmin hoặc '💾 Tải File .SQL'."
    ],
    executeKey: "openSqlBuilder"
  },
  {
    id: "duty-roster",
    categoryId: "duty",
    title: "Quản Lý & Xếp Lịch Trực Bệnh Viện Tự Động",
    subtitle: "Xếp ca trực thông minh, chống trùng lịch, tính công & xuất Excel/Ảnh Zalo",
    description: "Công cụ tự động xếp lịch trực cho các khoa phòng, khối chuyên môn và tổ CNTT. Thuật toán tự động chia đều ca trực đêm, cuối tuần, ngày lễ; chống xếp 2 ngày liên tiếp; giao diện lịch tháng tương tác đổi người trực 1-click; xuất Excel chấm công và xuất Ảnh gửi Zalo sắc nét.",
    badge: "Xếp Lịch Trực Tự Động",
    badgeColor: "amber",
    icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="2"/></svg>`,
    inputType: "duty-roster-interactive",
    outputName: "Lich_Truc_Benh_Vien.xlsx",
    guide: [
      "Bước 1: Nhập danh sách nhân sự (Họ tên, chức danh, nhóm ca) và chọn ngày bận/nghỉ phép (nếu có).",
      "Bước 2: Chọn Tháng / Năm cần xếp lịch và các vị trí ca trực trong ngày (Lãnh đạo, Cấp cứu, Nội, Ngoại, ĐD, KTV, CNTT...).",
      "Bước 3: Nhấn '⚡ Xếp Lịch Tự Động' để hệ thống tự động phân bổ công bằng.",
      "Bước 4: Xem trước Lịch tháng, đổi ca trực thủ công nếu cần, sau đó nhấn '📊 Xuất Excel' hoặc '🖼️ Xuất Ảnh Zalo'."
    ],
    executeKey: "openDutyRoster"
  },
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

window.getToolById = function(toolId) {
  return window.TOOLS_REGISTRY.find(t => t.id === toolId);
};
