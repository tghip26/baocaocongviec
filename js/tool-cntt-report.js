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
    { key: "xoa_cls_pttt", col: 4, label: "Xoá CLS, PTTT" },
    { key: "ep_the_bh", col: 5, label: "Ép thẻ BH" },
    { key: "sua_phi_qr_tm", col: 6, label: "Sửa phí, mã QR sang TM và ngược lại" },
    { key: "huy_cks", col: 7, label: "Huỷ CKS" },
    { key: "huy_ban", col: 8, label: "Huỷ B/án" },
    { key: "sua_tt_bn", col: 9, label: "Sửa TT bệnh nhân (NN, Đ/chỉ, tuổi, CCCD...) & công khám, kiểu khám" },
    { key: "sua_gio_cls_pttt", col: 10, label: "Sửa ngày giờ CLS/PTTT, giờ đọc KQ, người TH, máy CLS" },
    { key: "sua_ma_benh", col: 11, label: "Sửa mã bệnh kèm theo, bệnh chính" },
    { key: "ho_tro_ky_so", col: 12, label: "Hỗ trợ ký số PM, QLVBĐH" },
    { key: "sua_giay_rv", col: 13, label: "Sửa giấy RV, kết thúc ra viện, chuyển tuyến" },
    { key: "dang_bai_website", col: 14, label: "Đăng bài trên website" },
    { key: "sua_cach_dung_thuoc", col: 15, label: "Sửa cách dùng thuốc, ngày giờ thuốc, vật tư" },
    { key: "phan_quyen_user", col: 16, label: "Phân quyền USER, đổi nick user" },
    { key: "loi_ton_thuoc_hoso", col: 17, label: "Lỗi không kết thúc hồ sơ (tồn thuốc, thuốc chưa cấp)" },
    { key: "sua_gio_phieu_xuat", col: 18, label: "Sửa ngày giờ, sửa xoá phiếu xuất khác" },
    { key: "sua_xoa_anh_pacs", col: 19, label: "Sửa/xoá ảnh trên PACS, lỗi đẩy chỉ định PACS" },
    { key: "mo_hs_ky_so_bs", col: 20, label: "Mở HS ký số bổ sung" },
    { key: "sua_xoa_giuong", col: 21, label: "Sửa xoá giường, cập nhật giường, thêm giường" },
    { key: "chuyen_thuoc_cp_dg", col: 22, label: "Chuyển thuốc CP-DG" },
    { key: "sua_loi_xuat_toan", col: 23, label: "Sửa lỗi xuất toán tự động" },
    { key: "vimes_xu_ly", col: 24, label: "Vimes Xử Lý" }
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

  const ToolCnttReport = {
    DEFAULT_SHEET_ID,
    DEPARTMENTS,
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
          return {
            sheetId: parsed.sheetId || DEFAULT_SHEET_ID,
            sheetName: parsed.sheetName || "",
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
     * Tải dữ liệu trực tiếp từ Google Sheets qua Google Visualization API (GViz)
     * Hoạt động 100% từ Client-side không cần API Key khi Sheet mở quyền chia sẻ
     */
    async fetchGoogleSheetData(sheetId = null) {
      const id = sheetId || this.getConfig().sheetId;
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json`;

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

        return this.parseGvizTable(data.table);
      } catch (gvizErr) {
        console.warn("GViz API failed, fallback to CSV export", gvizErr);
        // Fallback sang CSV endpoint
        const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
        const resp = await fetch(csvUrl);
        if (!resp.ok) throw new Error(`Không thể kết nối Google Sheet: ${resp.statusText}`);
        const csvText = await resp.text();
        return this.parseCsvText(csvText);
      }
    },

    /**
     * Phân tích đối tượng bảng GViz thành mảng các ca công tác chuẩn
     */
    parseGvizTable(table) {
      const records = [];
      const rows = table.rows || [];

      rows.forEach((r, rowIdx) => {
        const cells = (r.c || []).map(cell => (cell ? (cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : (cell.f || "")) : ""));
        
        // Bỏ qua các dòng header ban đầu
        if (rowIdx < 5) return;

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

        // Chỉ tính là 1 ca nếu có Khoa phòng, hoặc có hồ sơ/phiếu, hoặc có lỗi, hoặc có cán bộ
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
     * Tạo chuỗi dữ liệu 1 dòng phân tách bởi Tab (TSV) để dán trực tiếp (Ctrl+V) vào Google Sheets
     */
    buildTsvRow(formData, nextStt = "") {
      const cols = new Array(44).fill("");

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
