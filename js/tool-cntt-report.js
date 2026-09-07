/**
 * ToolCnttReport - Báo Cáo Công Tác Sửa Chữa Hàng Ngày Phòng CNTT
 * Tích hợp trực tiếp Google Trang Tính (Google Sheets) & Bộ Thống Kê Đi Kèm
 * BVĐK Bắc Ninh Số 2
 */
(function() {
  "use strict";

  const DEFAULT_SHEET_ID = "1_I7qmDx7mtIOcCLkEkDz_PCaC8KPd_Po-pqEh7krdPA";
  const STORAGE_KEY_CONFIG = "CNTT_REPORT_CONFIG";
  const STORAGE_KEY_LOCAL_ROWS = "CNTT_REPORT_LOCAL_ROWS";

  // Danh mục 47 Khoa, Phòng, Trung Tâm chuẩn BVĐK Bắc Ninh Số 2
  const DEPARTMENTS = [
    "BAN BVSK", "CC115", "CĐHA", "CĐT", "CNTT", "CSGN", "CTXH", "CXK",
    "DA LIỄU", "ĐIỀU DƯỠNG", "DINH DƯỠNG", "ĐÔNG Y", "DƯỢC", "GĐYK", "GPB",
    "HCQT", "HHLS", "HSTC", "HTL", "KB", "KHTH", "KSNK", "LKTK", "MẮT",
    "NGOẠI CT", "NGOẠI TH", "NGOẠI TKLN", "NGOẠI TN", "NGOẠI ƯB", "NGOẠI XT",
    "NHH", "NHI", "NỘI TH", "PHCN", "PTGMHS", "QLCL", "RHM", "TCCB", "TCKT",
    "TDCN", "THẬN", "TMH", "TRUYỀN NHIỄM", "TTTM", "VT", "XNTT", "PHỤ SẢN"
  ];

  // 21 Danh mục lỗi Phần Mềm chuẩn (Cột 4 -> Cột 24)
  const SOFTWARE_CATEGORIES = [
    { key: "xoa_cls_pttt", col: 4, label: "Xoá CLS, PTTT", keywords: "xóa xoá xoa bỏ bo cls pttt" },
    { key: "ep_the_bh", col: 5, label: "Ép thẻ BH", keywords: "ép ep the bh bảo hiểm bao hiem bhyt" },
    { key: "sua_phi_qr_tm", col: 6, label: "Sửa phí, mã QR sang TM và ngược lại", keywords: "sửa sua phi qr tm tiền mặt tien mat chuyen khoan" },
    { key: "huy_cks", col: 7, label: "Huỷ CKS", keywords: "hủy huỷ huy cks chữ ký số chu ky so vgca" },
    { key: "huy_ban", col: 8, label: "Huỷ B/án", keywords: "hủy huỷ huy bệnh án benh an b/an b án" },
    { key: "sua_tt_bn", col: 9, label: "Sửa TT bệnh nhân (NN, Đ/chỉ, tuổi, CCCD...) & công khám, kiểu khám", keywords: "sửa sua thông tin thong tin bệnh nhân benh nhan bn cccd nghe nghiep dia chi" },
    { key: "sua_gio_cls_pttt", col: 10, label: "Sửa ngày giờ CLS/PTTT, giờ đọc KQ, người TH, máy CLS", keywords: "sửa sua ngày giờ ngay gio cls pttt ket qua thuc hien" },
    { key: "sua_ma_benh", col: 11, label: "Sửa mã bệnh kèm theo, bệnh chính", keywords: "sửa sua mã bệnh ma benh icd kem theo benh chinh" },
    { key: "ho_tro_ky_so", col: 12, label: "Hỗ trợ ký số PM, QLVBĐH", keywords: "hỗ trợ ho tro ký số ky so qlvbdh van ban phan mem" },
    { key: "sua_giay_rv", col: 13, label: "Sửa giấy RV, kết thúc ra viện, chuyển tuyến", keywords: "sửa sua giấy ra viện giay rv ket thuc ra vien chuyen tuyen" },
    { key: "dang_bai_website", col: 14, label: "Đăng bài trên website", keywords: "đăng dang bài bai website web cong thong tin" },
    { key: "sua_cach_dung_thuoc", col: 15, label: "Sửa cách dùng thuốc, ngày giờ thuốc, vật tư", keywords: "sửa sua cách dùng thuoc vat tu lieu dung" },
    { key: "phan_quyen_user", col: 16, label: "Phân quyền USER, đổi nick user", keywords: "phân quyền phan quyen user nick tài khoản tai khoan mat khau" },
    { key: "loi_ton_thuoc_hoso", col: 17, label: "Lỗi không kết thúc hồ sơ (tồn thuốc, thuốc chưa cấp)", keywords: "lỗi loi ton thuoc tồn thuốc kết thúc ket thuc hồ sơ ho so chua cap" },
    { key: "sua_gio_phieu_xuat", col: 18, label: "Sửa ngày giờ, sửa xoá phiếu xuất khác", keywords: "sửa sua xóa xoá xoa ngày giờ ngay gio phiếu xuất phieu xuat" },
    { key: "sua_xoa_anh_pacs", col: 19, label: "Sửa/xoá ảnh trên PACS, lỗi đẩy chỉ định PACS", keywords: "sửa sua xóa xoá xoa ảnh anh pacs chỉ định chi dinh chup phim xquang ctdl" },
    { key: "mo_hs_ky_so_bs", col: 20, label: "Mở HS ký số bổ sung", keywords: "mở mo hs ký số ky so bổ sung bo sung" },
    { key: "sua_xoa_giuong", col: 21, label: "Sửa xoá giường, cập nhật giường, thêm giường", keywords: "sửa sua xóa xoá xoa giường giuong buồng buong bệnh phong" },
    { key: "chuyen_thuoc_cp_dg", col: 22, label: "Chuyển thuốc CP-DG", keywords: "chuyển chuyen thuoc cp dg chi phí đon gia" },
    { key: "sua_loi_xuat_toan", col: 23, label: "Sửa lỗi xuất toán tự động", keywords: "sửa sua xuất toán xuat toan tu dong bhyt" },
    { key: "vimes_xu_ly", col: 24, label: "Vimes Xử Lý", keywords: "vimes xử lý xu ly loi he thong benh vien his" }
  ];

  // 10 Danh mục linh kiện & sửa chữa Phần Cứng chuẩn (Cột 25 -> Cột 34)
  const HARDWARE_CATEGORIES = [
    { key: "do_muc", col: 25, label: "Đổ mực", unit: "lần" },
    { key: "cai_win", col: 26, label: "Cài win", unit: "máy" },
    { key: "sua_mang", col: 27, label: "Sửa lỗi mạng (IP, switch, dây, card mạng)", unit: "lần" },
    { key: "pc_main_chip", col: 28, label: "Sửa máy tính - Main, Chip", unit: "chiếc" },
    { key: "pc_nguon", col: 29, label: "Sửa máy tính - Nguồn", unit: "chiếc" },
    { key: "pc_o_cung", col: 30, label: "Sửa máy tính - Ổ cứng", unit: "chiếc" },
    { key: "prn_vo_lua", col: 31, label: "Sửa máy in - Vỏ lụa", unit: "chiếc" },
    { key: "prn_lo_ep", col: 32, label: "Sửa máy in - Lô ép", unit: "chiếc" },
    { key: "prn_cam_bien", col: 33, label: "Sửa máy in - Cảm biến", unit: "chiếc" },
    { key: "sua_chua_khac", col: 34, label: "Sửa chữa khác", isText: true }
  ];

  // Danh mục 47 Khoa, Phòng, Trung Tâm chi tiết kèm phân loại & từ khóa tìm kiếm
  const DEPARTMENTS_META = [
    // Cận lâm sàng (cls)
    { code: "CĐHA", name: "Khoa Chẩn Đoán Hình Ảnh", cat: "cls", catName: "Cận lâm sàng", keywords: "xquang ct mri sieu am chieu chup chan doan hinh anh cdha" },
    { code: "XNTT", name: "Khoa Xét Nghiệm Trung Tâm", cat: "cls", catName: "Cận lâm sàng", keywords: "xet nghiem mau sinh hoa huyet hoc vi sinh xntt" },
    { code: "HHLS", name: "Khoa Huyết Học Lâm Sàng", cat: "cls", catName: "Cận lâm sàng", keywords: "huyet hoc lam sang mau truyen mau dong mau hhls" },
    { code: "GPB", name: "Khoa Giải Phẫu Bệnh", cat: "cls", catName: "Cận lâm sàng", keywords: "giai phau benh te bao sinh thiet gpb" },
    { code: "TDCN", name: "Khoa Thăm Dò Chức Năng", cat: "cls", catName: "Cận lâm sàng", keywords: "tham do chuc nang dien tim dien nao noi soi tdcn" },
    { code: "DƯỢC", name: "Khoa Dược", cat: "cls", catName: "Cận lâm sàng", keywords: "duoc thuoc kho thuoc phat thuoc vat tu" },
    { code: "KSNK", name: "Khoa Kiểm Soát Nhiễm Khuẩn", cat: "cls", catName: "Cận lâm sàng", keywords: "kiem soat nhiem khuan tiet trung giat la ksnk" },
    { code: "DINH DƯỠNG", name: "Khoa Dinh Dưỡng", cat: "cls", catName: "Cận lâm sàng", keywords: "dinh duong tiet che suat an" },
    { code: "TTTM", name: "Trung Tâm Tim Mạch", cat: "cls", catName: "Cận lâm sàng", keywords: "trung tam tim mach can thiep mach tttm" },
    { code: "GĐYK", name: "Phòng Giám Định Y Khoa", cat: "cls", catName: "Cận lâm sàng", keywords: "giam dinh y khoa thuong tat gdyk" },

    // Khối Ngoại (ngoai)
    { code: "NGOẠI CT", name: "Khoa Ngoại Chấn Thương", cat: "ngoai", catName: "Khối Ngoại", keywords: "ngoai chan thuong gay xuong bo bot ket hop xuong ngoai ct" },
    { code: "NGOẠI TH", name: "Khoa Ngoại Tổng Hợp", cat: "ngoai", catName: "Khối Ngoại", keywords: "ngoai tong hop tieu hoa gan mat ruot thua ngoai th" },
    { code: "NGOẠI TKLN", name: "Khoa Ngoại Thần Kinh - Lồng Ngực", cat: "ngoai", catName: "Khối Ngoại", keywords: "than kinh long nguc so nao cot song ngoai tkln" },
    { code: "NGOẠI TN", name: "Khoa Ngoại Tiết Niệu", cat: "ngoai", catName: "Khối Ngoại", keywords: "tiet nieu soi than tan soi bang quang ngoai tn" },
    { code: "NGOẠI ƯB", name: "Khoa Ngoại Ung Bướu", cat: "ngoai", catName: "Khối Ngoại", keywords: "ung buou ung thu khoi u xa tri hoa tri ngoai ub" },
    { code: "NGOẠI XT", name: "Khoa Ngoại Xương Khớp / Xương Tủy", cat: "ngoai", catName: "Khối Ngoại", keywords: "xuong khop xuong tuy chinh hinh ngoai xt" },
    { code: "PTGMHS", name: "Khoa Phẫu Thuật Gây Mê Hồi Sức", cat: "ngoai", catName: "Khối Ngoại", keywords: "phau thuat gay me hoi suc phong mo ptgmhs" },

    // Khối Nội & Khám bệnh (noi)
    { code: "KB", name: "Khoa Khám Bệnh", cat: "noi", catName: "Nội & Khám", keywords: "kham benh tiep don phong kham bhyt dang ky kb" },
    { code: "CC115", name: "Khoa Cấp Cứu 115", cat: "noi", catName: "Nội & Khám", keywords: "cap cuu 115 cap cuu luu chuyen vien cc115" },
    { code: "HSTC", name: "Khoa Hồi Sức Tích Cực & Chống Độc", cat: "noi", catName: "Nội & Khám", keywords: "hoi suc tich cuc chong doc icu tho may hstc" },
    { code: "NỘI TH", name: "Khoa Nội Tổng Hợp", cat: "noi", catName: "Nội & Khám", keywords: "noi tong hop noi khoa tieu hoa tim mach noi th" },
    { code: "NHI", name: "Khoa Nhi", cat: "noi", catName: "Nội & Khám", keywords: "nhi so sinh tre em nhi khoa nhi" },
    { code: "PHỤ SẢN", name: "Khoa Phụ Sản", cat: "noi", catName: "Nội & Khám", keywords: "phu san de sinh mo de san khoa phu khoa" },
    { code: "TRUYỀN NHIỄM", name: "Khoa Truyền Nhiễm", cat: "noi", catName: "Nội & Khám", keywords: "truyen nhiem sot xuat huyet covid cum viem gan" },
    { code: "THẬN", name: "Khoa Thận - Tiết Niệu - Lọc Máu", cat: "noi", catName: "Nội & Khám", keywords: "than loc mau chay than nhan tao suy than than" },
    { code: "PHCN", name: "Khoa Phục Hồi Chức Năng", cat: "noi", catName: "Nội & Khám", keywords: "phuc hoi chuc nang vat ly tri lieu phcn" },
    { code: "ĐÔNG Y", name: "Khoa Y Học Cổ Truyền (Đông Y)", cat: "noi", catName: "Nội & Khám", keywords: "dong y y hoc co truyen cham cuu xoa bop" },
    { code: "DA LIỄU", name: "Khoa Da Liễu", cat: "noi", catName: "Nội & Khám", keywords: "da lieu nam di ung my pham da lieu" },
    { code: "MẮT", name: "Khoa Mắt", cat: "noi", catName: "Nội & Khám", keywords: "mat thi luc do thi luc duc thuy tinh the phaco mat" },
    { code: "TMH", name: "Khoa Tai Mũi Họng", cat: "noi", catName: "Nội & Khám", keywords: "tai mui hong viem xoang viem amydal noi soi tmh" },
    { code: "RHM", name: "Khoa Răng Hàm Mặt", cat: "noi", catName: "Nội & Khám", keywords: "rang ham mat nho rang han rang bsy rhm" },
    { code: "CXK", name: "Khoa Cơ Xương Khớp", cat: "noi", catName: "Nội & Khám", keywords: "co xuong khop viem khop thoai hoa gout cxk" },
    { code: "NHH", name: "Khoa Nội Hô Hấp", cat: "noi", catName: "Nội & Khám", keywords: "noi ho hap phoi copd hen phe quan nhh" },
    { code: "LKTK", name: "Khoa Lão Khoa - Thần Kinh", cat: "noi", catName: "Nội & Khám", keywords: "lao khoa than kinh nguoi cao tuoi tai bien lktk" },

    // Khối Phòng Ban chức năng (phong)
    { code: "CNTT", name: "Phòng Công Nghệ Thông Tin", cat: "phong", catName: "Phòng ban", keywords: "cong nghe thong tin may tinh may in his lis pacs cntt" },
    { code: "KHTH", name: "Phòng Kế Hoạch Tổng Hợp", cat: "phong", catName: "Phòng ban", keywords: "ke hoach tong hop ho so benh an chuyen tuyen khth" },
    { code: "TCKT", name: "Phòng Tài Chính Kế Toán", cat: "phong", catName: "Phòng ban", keywords: "tai chinh ke toan vien phi thu ngan ke toan tckt" },
    { code: "TCCB", name: "Phòng Tổ Chức Cán Bộ", cat: "phong", catName: "Phòng ban", keywords: "to chuc can bo nhan su luong nhan vien tccb" },
    { code: "HCQT", name: "Phòng Hành Chính Quản Trị", cat: "phong", catName: "Phòng ban", keywords: "hanh chinh quan tri xe van thu cong van hcqt" },
    { code: "QLCL", name: "Phòng Quản Lý Chất Lượng", cat: "phong", catName: "Phòng ban", keywords: "quan ly chat luong su co tieu chi benh vien qlcl" },
    { code: "ĐIỀU DƯỠNG", name: "Phòng Điều Dưỡng", cat: "phong", catName: "Phòng ban", keywords: "dieu duong cham soc quy trinh ky thuat" },
    { code: "VT", name: "Phòng Vật Tư - Thiết Bị Y Tế", cat: "phong", catName: "Phòng ban", keywords: "vat tu thiet bi y te sua chua may moc vt" },
    { code: "CTXH", name: "Phòng Công Tác Xã Hội", cat: "phong", catName: "Phòng ban", keywords: "cong tac xa hoi tu thien truyen thong ho tro ctxh" },
    { code: "CĐT", name: "Phòng Chỉ Đạo Tuyến", cat: "phong", catName: "Phòng ban", keywords: "chi dao tuyen dao tao ho tro tuyen duoi cdt" },
    { code: "CSGN", name: "Đơn vị Chăm Sóc Giảm Nhẹ", cat: "phong", catName: "Phòng ban", keywords: "cham soc giam nhe ung thu giai doan cuoi csgn" },
    { code: "BAN BVSK", name: "Ban Bảo Vệ Sức Khỏe Cán Bộ", cat: "phong", catName: "Phòng ban", keywords: "bao ve suc khoe can bo kham can bo ttp" },
    { code: "HTL", name: "Hóa Trị Liệu", cat: "phong", catName: "Phòng ban", keywords: "hoa tri lieu" }
  ];

  const ToolCnttReport = {
    DEFAULT_SHEET_ID,
    DEPARTMENTS,
    DEPARTMENTS_META,
    SOFTWARE_CATEGORIES,
    HARDWARE_CATEGORIES,

    /**
     * Lấy cấu hình Google Sheet hiện tại từ LocalStorage
     */
    getConfig() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (saved) {
          const parsed = JSON.parse(saved);
          let sName = parsed.sheetName || "";
          // Nếu lưu tên sheet cũ là 'Tháng ...' không đúng với sheet ngày thực tế trên Google Sheets, xóa đi
          if (sName && (sName.startsWith("Tháng") || sName === "Sheet1")) {
            sName = "";
          }
          return {
            sheetId: parsed.sheetId || DEFAULT_SHEET_ID,
            sheetName: sName,
            customUrl: parsed.customUrl || `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/edit?usp=sharing`
          };
        }
      } catch (e) {
        console.warn("Error reading ToolCnttReport config", e);
      }
      return {
        sheetId: DEFAULT_SHEET_ID,
        sheetName: "",
        customUrl: `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/edit?usp=sharing`
      };
    },

    /**
     * Lưu cấu hình Google Sheet mới
     */
    saveConfig(config) {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    },

    /**
     * Trích xuất Sheet ID từ URL Google Sheets bất kỳ
     */
    extractSheetId(urlOrId) {
      if (!urlOrId) return DEFAULT_SHEET_ID;
      const clean = urlOrId.trim();
      const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) return match[1];
      if (/^[a-zA-Z0-9-_]{20,}$/.test(clean)) return clean;
      return DEFAULT_SHEET_ID;
    },

    /**
     * Danh sách 30 sheet thực tế theo ngày trong Google Trang Tính P.CNTT (kèm GID chuẩn)
     */
    AVAILABLE_SHEETS: [
      { name: "4.9", gid: "229402778", label: "4.9 (Hôm nay / Hiện tại)" },
      { name: "5-7.9", gid: "1974215368", label: "5-7.9" },
      { name: "6.9", gid: "1419054481", label: "6.9" },
      { name: "3.9", gid: "36166584", label: "3.9" },
      { name: "31.8-1.9-2.9", gid: "222465239", label: "31.8-1.9-2.9 (Lễ 2/9)" },
      { name: "28-29-30.8", gid: "524042424", label: "28-29-30.8" },
      { name: "27.8", gid: "1878348164", label: "27.8" },
      { name: "26.8", gid: "968668128", label: "26.8" },
      { name: "25.8", gid: "120079373", label: "25.8" },
      { name: "24.8", gid: "120561833", label: "24.8" },
      { name: "21-22-23.8", gid: "1765495205", label: "21-22-23.8" },
      { name: "20.8", gid: "1208165993", label: "20.8" },
      { name: "19.8", gid: "2049801848", label: "19.8" },
      { name: "18.8", gid: "1169776705", label: "18.8" },
      { name: "17.8", gid: "1904439057", label: "17.8" },
      { name: "14-15-16.8", gid: "486650833", label: "14-15-16.8" },
      { name: "15.8", gid: "1153734661", label: "15.8" },
      { name: "13.8", gid: "2036004273", label: "13.8" },
      { name: "12.8", gid: "1531838084", label: "12.8" },
      { name: "11.8", gid: "967954531", label: "11.8" },
      { name: "10.8", gid: "1496271494", label: "10.8" },
      { name: "7-8-9.8", gid: "282274476", label: "7-8-9.8" },
      { name: "6.8", gid: "1226218874", label: "6.8" },
      { name: "5.8", gid: "1390351569", label: "5.8" },
      { name: "4.8", gid: "1376384020", label: "4.8" },
      { name: "3.8", gid: "128387271", label: "3.8" },
      { name: "31.7-2.8", gid: "1276120505", label: "31.7-2.8" },
      { name: "30.7", gid: "366364974", label: "30.7" },
      { name: "29.7", gid: "102951631", label: "29.7" },
      { name: "Sheet292", gid: "1288431692", label: "Sheet292" }
    ],

    /**
     * Tra cứu GID chuẩn của sheet từ tên sheet
     */
    getSheetGid(sheetName) {
      if (!sheetName) return null;
      const target = String(sheetName).trim().toLowerCase();
      const found = this.AVAILABLE_SHEETS.find(s => {
        const sName = (typeof s === "object" ? s.name : s).toLowerCase();
        const sLabel = (typeof s === "object" && s.label ? s.label : "").toLowerCase();
        return sName === target || sLabel.startsWith(target);
      });
      return found && typeof found === "object" ? found.gid : null;
    },

    /**
     * Tự động xác định tên sheet phù hợp với ngày hiện tại
     */
    getTodaySheetName() {
      const now = new Date();
      const d = now.getDate();
      const m = now.getMonth() + 1;
      const single = `${d}.${m}`;
      const exact = this.AVAILABLE_SHEETS.find(s => (typeof s === "object" ? s.name : s) === single);
      if (exact) return (typeof exact === "object" ? exact.name : exact);
      return "4.9";
    },

    /**
     * Tính toán dò tìm hàng trống tiếp theo trong khoảng từ startRow (mặc định 7) đến maxRow (100)
     * Trả về số hàng, chuỗi tọa độ (ví dụ: B17:AK17) và cờ đầy dữ liệu
     */
    computeNextEmptyRow(rows, startRow = 7, maxRow = 100) {
      if (!Array.isArray(rows) || rows.length === 0) {
        return {
          row: startRow,
          rangeStr: `B${startRow}:AK${startRow}`,
          isFull: false
        };
      }
      for (let excelRow = startRow; excelRow <= maxRow; excelRow++) {
        const gvizIdx = excelRow - 7;
        const r = rows[gvizIdx];
        if (!r) {
          return {
            row: excelRow,
            rangeStr: `B${excelRow}:AK${excelRow}`,
            isFull: false
          };
        }
        const cells = (r.c || []).map(cell => (cell ? (cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : (cell.f || "")) : ""));
        // Quét các cột từ B (cột 1) đến AK (cột 36)
        const hasContent = cells.slice(1, 37).some(v => v !== "" && v !== "0");
        if (!hasContent) {
          return {
            row: excelRow,
            rangeStr: `B${excelRow}:AK${excelRow}`,
            isFull: false
          };
        }
      }
      return {
        row: maxRow + 1,
        rangeStr: `B${maxRow + 1}:AK${maxRow + 1}`,
        isFull: true
      };
    },

    /**
     * Tải dữ liệu trực tiếp từ Google Sheets qua Google Visualization API (GViz)
     * Hỗ trợ chỉ định Sheet cụ thể (ví dụ: 4.9, 3.9, 5-7.9...) bằng GID hoặc tên Sheet
     */
    async fetchGoogleSheetData(sheetId = null, sheetName = null) {
      const id = sheetId || this.getConfig().sheetId;
      const targetSheet = sheetName || this.getConfig().sheetName || this.getTodaySheetName();
      const targetGid = this.getSheetGid(targetSheet);

      // Ưu tiên dùng GID để đảm bảo 100% khớp tab trên Google Sheets
      let sheetQuery = "";
      if (targetGid) {
        sheetQuery = `&gid=${targetGid}`;
      } else if (targetSheet) {
        sheetQuery = `&sheet=${encodeURIComponent(targetSheet)}`;
      }
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json${sheetQuery}`;

      try {
        const resp = await fetch(gvizUrl);
        if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
        const text = await resp.text();

        // Bóc tách JSON từ wrapper google.visualization.Query.setResponse({...});
        const startIdx = text.indexOf("{");
        const endIdx = text.lastIndexOf("}");
        if (startIdx === -1 || endIdx === -1) throw new Error("Invalid GViz format");

        const jsonStr = text.substring(startIdx, endIdx + 1);
        const data = JSON.parse(jsonStr);

        if (data.status !== "ok" || !data.table) {
          throw new Error(data.errors ? data.errors[0].message : "Google Sheet không trả về bảng dữ liệu");
        }

        const records = this.parseGvizTable(data.table, targetSheet);
        records._rawRows = data.table.rows || [];
        records._nextEmptyRow = this.computeNextEmptyRow(records._rawRows, 7, 100);
        records._targetSheet = targetSheet;
        records._targetGid = targetGid;
        return records;
      } catch (gvizErr) {
        console.warn("GViz API failed, fallback to CSV export", gvizErr);
        // Fallback sang CSV endpoint
        const csvQuery = targetGid ? `&gid=${targetGid}` : (targetSheet ? `&sheet=${encodeURIComponent(targetSheet)}` : "");
        const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${csvQuery}`;
        const resp = await fetch(csvUrl);
        if (!resp.ok) throw new Error(`Không thể kết nối Google Sheet: ${resp.statusText}`);
        const csvText = await resp.text();
        const records = this.parseCsvText(csvText);
        records._targetSheet = targetSheet;
        records._targetGid = targetGid;
        return records;
      }
    },

    /**
     * Phân tích đối tượng bảng GViz thành mảng các ca công tác chuẩn
     */
    parseGvizTable(table, currentSheet = "") {
      const records = [];
      const rows = table.rows || [];

      rows.forEach((r, rowIdx) => {
        const cells = (r.c || []).map(cell => (cell ? (cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : (cell.f || "")) : ""));
        const excelRowNumber = rowIdx + 7;

        const stt = cells[0] || "";
        const dept = cells[1] || "";
        const soHoSo = cells[2] || "";
        const soPhieu = cells[3] || "";
        const reqStaff = cells[35] || "";
        const execStaff = cells[36] || "";
        const note = cells[37] || "";
        const status = cells[38] || "Đã xử lý";

        // Kiểm tra xem dòng này có dữ liệu công tác hay không (bỏ qua dòng trống hoặc bảng danh mục khoa ở cuối)
        const isHeaderOrCategoryTable = (stt === "STT" || soHoSo === "STT" || soPhieu === "KHOA, PHÒNG, TRUNG TÂM");
        if (isHeaderOrCategoryTable) return;

        // Quét danh mục phần mềm
        const swIssues = [];
        let swCount = 0;
        SOFTWARE_CATEGORIES.forEach(cat => {
          const val = cells[cat.col] || "";
          if (val && val !== "0") {
            const num = parseInt(val, 10);
            const count = isNaN(num) ? 1 : num;
            swCount += count;
            swIssues.push({
              key: cat.key,
              label: cat.label,
              value: val,
              count: count
            });
          }
        });

        // Quét danh mục phần cứng
        const hwIssues = [];
        let hwCount = 0;
        HARDWARE_CATEGORIES.forEach(cat => {
          const val = cells[cat.col] || "";
          if (val && val !== "0") {
            if (cat.isText) {
              hwCount += 1;
              hwIssues.push({
                key: cat.key,
                label: cat.label,
                value: val,
                count: 1
              });
            } else {
              const num = parseInt(val, 10);
              const count = isNaN(num) ? 1 : num;
              hwCount += count;
              hwIssues.push({
                key: cat.key,
                label: cat.label,
                value: val,
                count: count
              });
            }
          }
        });

        if (dept || soHoSo || soPhieu || swIssues.length > 0 || hwIssues.length > 0 || execStaff || reqStaff) {
          records.push({
            id: `row_${rowIdx + 1}`,
            rowNumber: excelRowNumber,
            sheetName: currentSheet || "Tháng 9",
            stt: stt || String(records.length + 1),
            dept: dept || "Khác",
            soHoSo: soHoSo,
            soPhieu: soPhieu,
            softwareIssues: swIssues,
            softwareCount: swCount,
            hardwareIssues: hwIssues,
            hardwareCount: hwCount,
            reqStaff: reqStaff,
            execStaff: execStaff || "P.CNTT",
            note: note,
            status: status || "Hoàn thành"
          });
        }
      });

      return records;
    },

    /**
     * Fallback: Phân tích CSV text
     */
    parseCsvText(csvText) {
      const lines = this.parseCSVMatrix(csvText);
      const records = [];

      lines.forEach((cells, rowIdx) => {
        if (rowIdx < 5) return;
        const stt = cells[0] || "";
        const dept = cells[1] || "";
        const soHoSo = cells[2] || "";
        const soPhieu = cells[3] || "";
        const reqStaff = cells[35] || "";
        const execStaff = cells[36] || "";
        const note = cells[37] || "";
        const status = cells[38] || "Đã xử lý";

        if (stt === "STT" || soHoSo === "STT" || soPhieu === "KHOA, PHÒNG, TRUNG TÂM") return;

        const swIssues = [];
        let swCount = 0;
        SOFTWARE_CATEGORIES.forEach(cat => {
          const val = cells[cat.col] || "";
          if (val && val !== "0") {
            const num = parseInt(val, 10);
            const count = isNaN(num) ? 1 : num;
            swCount += count;
            swIssues.push({ key: cat.key, label: cat.label, value: val, count: count });
          }
        });

        const hwIssues = [];
        let hwCount = 0;
        HARDWARE_CATEGORIES.forEach(cat => {
          const val = cells[cat.col] || "";
          if (val && val !== "0") {
            const num = parseInt(val, 10);
            const count = (cat.isText || isNaN(num)) ? 1 : num;
            hwCount += count;
            hwIssues.push({ key: cat.key, label: cat.label, value: val, count: count });
          }
        });

        if (dept || soHoSo || soPhieu || swIssues.length > 0 || hwIssues.length > 0 || execStaff || reqStaff) {
          records.push({
            id: `row_${rowIdx + 1}`,
            rowNumber: rowIdx + 1,
            stt: stt || String(records.length + 1),
            dept: dept || "Khác",
            soHoSo: soHoSo,
            soPhieu: soPhieu,
            softwareIssues: swIssues,
            softwareCount: swCount,
            hardwareIssues: hwIssues,
            hardwareCount: hwCount,
            reqStaff: reqStaff,
            execStaff: execStaff || "P.CNTT",
            note: note,
            status: status || "Hoàn thành"
          });
        }
      });

      return records;
    },

    /**
     * CSV Matrix Parser hỗ trợ trích xuất ngoặc kép & ngắt dòng chuẩn
     */
    parseCSVMatrix(text) {
      const rows = [];
      let row = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === "," && !inQuotes) {
          row.push(cur.trim());
          cur = "";
        } else if ((c === "\r" || c === "\n") && !inQuotes) {
          if (c === "\r" && text[i + 1] === "\n") i++;
          row.push(cur.trim());
          rows.push(row);
          row = [];
          cur = "";
        } else {
          cur += c;
        }
      }
      if (row.length > 0) {
        row.push(cur.trim());
        rows.push(row);
      }
      return rows;
    },

    /**
     * Lấy danh sách cán bộ chuẩn từ Lịch Trực CNTT
     */
    getDutyStaffList() {
      if (typeof window !== "undefined" && window.ToolDutyRoster && typeof window.ToolDutyRoster.getStaffList === "function") {
        return window.ToolDutyRoster.getStaffList();
      }
      try {
        if (typeof localStorage !== "undefined") {
          const raw = localStorage.getItem("DUTY_CNTT_STAFF_LIST");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        }
      } catch (e) {}
      if (typeof window !== "undefined" && window.ToolDutyRoster && Array.isArray(window.ToolDutyRoster.defaultStaffList)) {
        return window.ToolDutyRoster.defaultStaffList;
      }
      return [
        { id: "nv1", name: "Nguyễn Minh Họa", role: "Trưởng phòng" },
        { id: "nv2", name: "Nguyễn Duy Phương", role: "Phó phòng" },
        { id: "nv3", name: "Bùi Minh Chí", role: "Phần cứng" },
        { id: "nv4", name: "Vương Bá Tuấn", role: "Phần cứng" },
        { id: "nv5", name: "Phí Đức Phương", role: "Phần cứng" },
        { id: "nv6", name: "Chu Thị Dương", role: "Phần mềm" },
        { id: "nv7", name: "Nguyễn Trọng Nhân", role: "Phần cứng" },
        { id: "nv8", name: "Nguyễn Thu Huyền", role: "Phần mềm" },
        { id: "nv9", name: "Nguyễn Đức Lâm", role: "Phần cứng & mềm" },
        { id: "nv10", name: "Nguyễn Thị Quyên", role: "Phần cứng & mềm" },
        { id: "nv11", name: "Dương Văn Phương", role: "Phần cứng & mềm" },
        { id: "nv12", name: "Lê Thị Huyền Ly", role: "Phần mềm" },
        { id: "nv13", name: "Trương Hoàng Hiệp", role: "Phần cứng & mềm" }
      ];
    },

    /**
     * Ánh xạ tên cán bộ ghi trên Google Sheet sang tên chuẩn trong Lịch Trực CNTT
     */
    resolveStaffName(rawName) {
      if (!rawName) return "P.CNTT (Chung)";
      const clean = rawName.trim();
      const lower = clean.toLowerCase();
      if (lower === "p.cntt" || lower === "cntt" || lower === "phòng cntt" || lower === "p cntt") {
        return "P.CNTT (Chung)";
      }

      const dutyList = this.getDutyStaffList();
      
      // 1. Khớp chính xác toàn bộ họ tên
      const exact = dutyList.find(s => s.name.toLowerCase() === lower);
      if (exact) return exact.name;

      // 2. Khớp theo từ cuối / tên ngắn (VD: "Dương" -> "Chu Thị Dương", "Nhân" -> "Nguyễn Trọng Nhân", "Chí" -> "Bùi Minh Chí")
      const matched = dutyList.find(s => {
        const sLower = s.name.toLowerCase();
        const parts = sLower.split(/\s+/);
        const lastName = parts[parts.length - 1];
        return lastName === lower || sLower.endsWith(" " + lower) || sLower.includes(lower);
      });
      if (matched) return matched.name;

      return clean;
    },

    /**
     * Tính toán toàn diện các chỉ số thống kê & phân tích nghiệp vụ
     */
    computeAnalytics(records = []) {
      const totalCases = records.length;
      let totalSwItems = 0;
      let totalHwItems = 0;
      let casesWithSw = 0;
      let casesWithHw = 0;
      let completedCases = 0;
      let pendingCases = 0;

      const deptCounts = {};
      const swBreakdown = {};
      const hwBreakdown = {};
      const staffCounts = {};

      SOFTWARE_CATEGORIES.forEach(c => { swBreakdown[c.key] = { label: c.label, count: 0 }; });
      HARDWARE_CATEGORIES.forEach(c => { hwBreakdown[c.key] = { label: c.label, count: 0 }; });

      records.forEach(r => {
        const st = (r.status || "").toLowerCase();
        if (st.includes("chờ") || st.includes("chưa") || st.includes("tồn") || st.includes("đang")) {
          pendingCases++;
        } else {
          completedCases++;
        }

        const d = r.dept || "Chưa rõ";
        if (!deptCounts[d]) deptCounts[d] = { total: 0, sw: 0, hw: 0 };
        deptCounts[d].total++;

        if (r.softwareCount > 0) {
          casesWithSw++;
          totalSwItems += r.softwareCount;
          deptCounts[d].sw += r.softwareCount;
        }
        if (r.hardwareCount > 0) {
          casesWithHw++;
          totalHwItems += r.hardwareCount;
          deptCounts[d].hw += r.hardwareCount;
        }

        r.softwareIssues.forEach(item => {
          if (swBreakdown[item.key]) {
            swBreakdown[item.key].count += item.count;
          }
        });

        r.hardwareIssues.forEach(item => {
          if (hwBreakdown[item.key]) {
            hwBreakdown[item.key].count += item.count;
          }
        });

        const staff = r.execStaff || "P.CNTT";
        const staffList = staff.split(/[,;\/&]+/).map(s => s.trim()).filter(Boolean);
        staffList.forEach(stf => {
          const resolvedName = this.resolveStaffName(stf);
          if (!staffCounts[resolvedName]) staffCounts[resolvedName] = { total: 0, sw: 0, hw: 0 };
          staffCounts[resolvedName].total++;
          staffCounts[resolvedName].sw += r.softwareCount;
          staffCounts[resolvedName].hw += r.hardwareCount;
        });
      });

      const deptRanking = Object.entries(deptCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total);

      const swRanking = Object.entries(swBreakdown)
        .map(([key, data]) => ({ key, ...data }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);

      const hwRanking = Object.entries(hwBreakdown)
        .map(([key, data]) => ({ key, ...data }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);

      const staffRanking = Object.entries(staffCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total);

      return {
        totalCases,
        casesWithSw,
        casesWithHw,
        totalSwItems,
        totalHwItems,
        completedCases,
        pendingCases,
        completionRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 100,
        swRate: totalCases > 0 ? Math.round((casesWithSw / totalCases) * 100) : 0,
        hwRate: totalCases > 0 ? Math.round((casesWithHw / totalCases) * 100) : 0,
        deptRanking,
        swRanking,
        hwRanking,
        staffRanking
      };
    },

    /**
     * Tạo chuỗi dữ liệu 1 dòng phân tách bởi Tab (TSV) để dán trực tiếp (Ctrl+V) vào ô B trong Google Sheets (B7:AK100)
     * Mặc định includeSttColA = false để khi chọn ô B và bấm Ctrl+V, dữ liệu rơi đúng từ Cột B -> Cột AM
     */
    buildTsvRow(formData, nextStt = "", includeSttColA = false) {
      const cols = new Array(39).fill("");

      cols[0] = nextStt || "";
      cols[1] = formData.dept || "";
      cols[2] = formData.soHoSo || "";
      cols[3] = formData.soPhieu || "";

      SOFTWARE_CATEGORIES.forEach(cat => {
        if (formData.software && formData.software[cat.key]) {
          cols[cat.col] = String(formData.software[cat.key]);
        }
      });

      HARDWARE_CATEGORIES.forEach(cat => {
        if (formData.hardware && formData.hardware[cat.key]) {
          cols[cat.col] = String(formData.hardware[cat.key]);
        }
      });

      cols[35] = formData.reqStaff || "";
      cols[36] = formData.execStaff || "";
      cols[37] = formData.note || "";
      cols[38] = formData.status || "Đã xử lý";

      // Khi dán vào Google Sheet từ ô B (B7:AK100), cắt bỏ cột A (STT đã được in sẵn trong bảng)
      if (!includeSttColA) {
        return cols.slice(1).join("\t");
      }
      return cols.join("\t");
    },

    /**
     * Lưu ca công tác mới vào bộ nhớ cục bộ (Local cache)
     */
    saveLocalRow(record) {
      try {
        const list = this.getLocalRows();
        list.unshift(record);
        localStorage.setItem(STORAGE_KEY_LOCAL_ROWS, JSON.stringify(list));
        return true;
      } catch (e) {
        console.error("Error saving local row", e);
        return false;
      }
    },

    /**
     * Đọc các ca đã lưu cục bộ
     */
    getLocalRows() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_LOCAL_ROWS);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Xóa sạch các ca công tác cục bộ
     */
    clearLocalRows() {
      localStorage.removeItem(STORAGE_KEY_LOCAL_ROWS);
    },

    /**
     * Khóa lưu trữ nhật ký thao tác của người dùng trên các tài khoản
     */
    STORAGE_KEY_USER_LOG: "CNTT_REPORT_USER_ACTIVITY_LOG",

    /**
     * Ghi nhận một sự kiện nhập ca vào nhật ký tài khoản người dùng
     */
    logUserActivity(record, session) {
      try {
        const logs = this.getUserActivityLogs();
        const username = session ? (session.username || "guest") : (record.execStaff || "guest");
        const fullname = session ? (session.fullname || session.username) : (record.execStaff || "Cán bộ P.CNTT");
        const role = session ? (session.role || "staff") : "staff";

        const logEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          timeDisplay: new Date().toLocaleString("vi-VN"),
          username: username,
          fullname: fullname,
          role: role,
          dept: record.dept || "",
          soHoSo: record.soHoSo || "",
          soPhieu: record.soPhieu || "",
          swCount: record.softwareCount || 0,
          hwCount: record.hardwareCount || 0,
          sheetName: record.targetSheet || "Tháng 9",
          rowTarget: record.targetRow || 51,
          status: record.status || "Đã xử lý",
          action: "Tạo & Điền ca sửa chữa"
        };

        logs.unshift(logEntry);
        // Giữ tối đa 200 lượt nhật ký gần nhất
        if (logs.length > 200) logs.length = 200;
        localStorage.setItem(this.STORAGE_KEY_USER_LOG, JSON.stringify(logs));
        return logEntry;
      } catch (e) {
        console.error("Error logging user activity", e);
        return null;
      }
    },

    /**
     * Lấy danh sách toàn bộ nhật ký người dùng
     */
    getUserActivityLogs() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY_USER_LOG);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Xóa toàn bộ nhật ký người dùng
     */
    clearUserActivityLogs() {
      localStorage.removeItem(this.STORAGE_KEY_USER_LOG);
    },

    /**
     * Thống kê hoạt động của người dùng trên các tài khoản
     */
    computeUserActivityStats(logs = []) {
      const userMap = {};

      logs.forEach(item => {
        const u = item.username || "Chưa rõ";
        if (!userMap[u]) {
          userMap[u] = {
            username: u,
            fullname: item.fullname || u,
            role: item.role || "staff",
            totalEntries: 0,
            swCount: 0,
            hwCount: 0,
            lastActive: item.timeDisplay || item.timestamp,
            recentSheets: new Set()
          };
        }
        userMap[u].totalEntries++;
        userMap[u].swCount += item.swCount || 0;
        userMap[u].hwCount += item.hwCount || 0;
        if (item.sheetName) userMap[u].recentSheets.add(item.sheetName);
      });

      return Object.values(userMap).map(u => ({
        ...u,
        recentSheets: Array.from(u.recentSheets).join(", ")
      })).sort((a, b) => b.totalEntries - a.totalEntries);
    },

    /**
     * Xuất tệp Excel Báo Cáo Thống Kê Công Tác Sửa Chữa Chuẩn P.CNTT
     */
    exportExcelReport(records, analytics, title = "BÁO CÁO THỐNG KÊ CÔNG TÁC P.CNTT") {
      if (typeof XLSX === "undefined") {
        throw new Error("Thư viện XLSX chưa được tải.");
      }

      const wb = XLSX.utils.book_new();

      // Sheet 1: THỐNG KÊ TỔNG HỢP
      const summaryRows = [
        [title.toUpperCase()],
        ["Ngày xuất báo cáo:", new Date().toLocaleString("vi-VN")],
        ["Nguồn dữ liệu:", "Google Sheets BVĐK Bắc Ninh Số 2"],
        [],
        ["1. CHỈ SỐ HOẠT ĐỘNG CHUNG", ""],
        ["Tổng số ca yêu cầu sửa chữa:", analytics.totalCases],
        ["Số ca có sự cố Phần Mềm:", `${analytics.casesWithSw} (${analytics.swRate}%)`],
        ["Số ca có sự cố Phần Cứng:", `${analytics.casesWithHw} (${analytics.hwRate}%)`],
        ["Tổng số lượt xử lý lỗi phần mềm:", analytics.totalSwItems],
        ["Tổng số lượt linh kiện / sửa phần cứng:", analytics.totalHwItems],
        ["Tỷ lệ hoàn thành:", `${analytics.completionRate}% (${analytics.completedCases} hoàn thành, ${analytics.pendingCases} tồn đọng)`],
        [],
        ["2. XẾP HẠNG KHOA/PHÒNG YÊU CẦU NHIỀU NHẤT", "Tổng Ca", "Phần Mềm", "Phần Cứng"],
        ...analytics.deptRanking.map((d, idx) => [d.name, d.total, d.sw, d.hw]),
        [],
        ["3. DANH MỤC LỖI PHẦN MỀM THƯỜNG GẶP", "Số Lượng"],
        ...analytics.swRanking.map(s => [s.label, s.count]),
        [],
        ["4. DANH MỤC SỬA CHỮA PHẦN CỨNG", "Số Lượng"],
        ...analytics.hwRanking.map(h => [h.label, h.count]),
        [],
        ["5. CÁN BỘ P.CNTT THỰC HIỆN", "Tổng Ca", "Phần Mềm", "Phần Cứng"],
        ...analytics.staffRanking.map(stf => [stf.name, stf.total, stf.sw, stf.hw])
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng Hợp Thống Kê");

      // Sheet 2: CHI TIẾT CÁC CA SỬA CHỮA
      const detailRows = [
        ["STT", "Khoa / Phòng", "Số Hồ Sơ", "Số Phiếu", "Sự Cố Phần Mềm", "Sự Cố Phần Cứng", "Cán Bộ Yêu Cầu", "Cán Bộ Thực Hiện", "Ghi Chú", "Tình Trạng"],
        ...records.map((r, i) => [
          r.stt || (i + 1),
          r.dept,
          r.soHoSo,
          r.soPhieu,
          r.softwareIssues.map(sw => `${sw.label}${sw.count > 1 ? ` (${sw.count})` : ''}`).join("; "),
          r.hardwareIssues.map(hw => `${hw.label}${hw.count > 1 ? ` (${hw.count})` : ''}`).join("; "),
          r.reqStaff,
          r.execStaff,
          r.note,
          r.status
        ])
      ];

      const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
      XLSX.utils.book_append_sheet(wb, wsDetail, "Danh Sách Chi Tiết");

      XLSX.writeFile(wb, `Bao_Cao_Cong_Tac_CNTT_${new Date().toISOString().slice(0, 10)}.xlsx`);
      return true;
    }
  };

  // Expose ra toàn cục
  window.ToolCnttReport = ToolCnttReport;
})();
