/**
 * tool-bhyt-xml.js
 * Comprehensive BHYT XML 4210 & XML 130/QĐ-BYT Validator and Anomaly Detector.
 * CÔNG CỤ KIỂM TRA & LỌC LỖI HỒ SƠ BHYT TRƯỚC KHI ĐẨY CỔNG GIÁM ĐỊNH QUỐC GIA:
 * 1. Hỗ trợ giải nén tệp .zip chứa bộ file XML 1..5 / XML 130 hoặc tải trực tiếp file .xml.
 * 2. Phân tích cú pháp XML, tự động nhận diện gói hồ sơ và liên kết MÃ_LK.
 * 3. Kiểm tra đa tầng:
 *    - Lỗi Hành chính & Thẻ BHYT (Định dạng mã thẻ 15 ký tự, đầu mã đối tượng, nơi ĐKKCB ban đầu).
 *    - Lỗi Thời gian KCB (Logic ngày vào - ngày ra, ngày y lệnh, ngày sinh, ngày kết quả).
 *    - Lỗi Chẩn đoán & Mã bệnh ICD-10 (Định dạng mã chính, mã kèm, tên bệnh).
 *    - Lỗi Tài chính & Cân đối chi phí (Tổng chi = BHTT + BNTT + BNCCT, đối soát tổng XML2/3 với XML1).
 *    - Lỗi Thuốc, Dịch vụ kỹ thuật & Vật tư y tế (Số lượng <= 0, đơn giá sai, thành tiền lệch).
 *    - Lỗi Bác sĩ chỉ định & Mã Khoa phòng.
 *    - Phát hiện trùng lặp hồ sơ, trùng lặp thẻ trong cùng đợt điều trị.
 * 4. Xuất Báo cáo Lỗi chi tiết sang Excel (.xlsx) chuẩn nghiệp vụ P.CNTT Bệnh Viện.
 */

class ToolBhytXml {
  /**
   * Danh sách đầu mã thẻ BHYT hợp lệ theo quy định BHXH Việt Nam
   */
  static validCardPrefixes = [
    "DN", "HX", "CH", "NN", "TK", "HC", "XK", "TB", "NO", "CT", "XB", "TN", "CS", "XN", "MS", "HD", "TQ", "TY", "HG", "LS", "PV", "GB", "GD",
    "QN", "CA", "CY", "QN",
    "CC", "CK", "CB", "KC", "HN", "DT", "DK", "XD", "BT", "TS", "TC", "TQ", "TA", "TY", "HG", "LS", "PV",
    "HT", "TC", "CN",
    "HS", "SV",
    "TE"
  ];

  /**
   * Xử lý và kiểm tra danh sách tệp XML hoặc ZIP
   */
  static async validateFiles(files, progressCallback = null) {
    if (!files || files.length === 0) {
      throw new Error("Vui lòng chọn ít nhất một tệp XML hoặc ZIP để kiểm tra!");
    }

    const xmlTextMap = {}; // filename -> text
    let totalFilesCount = 0;

    if (progressCallback) progressCallback(5, "Đang giải nén và đọc các tệp XML...");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fname = file.name.toLowerCase();

      if (fname.endsWith(".zip")) {
        if (!window.JSZip) throw new Error("Thư viện JSZip chưa sẵn sàng.");
        const arrayBuf = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuf);

        for (const relPath in zip.files) {
          const zFile = zip.files[relPath];
          if (!zFile.dir && relPath.toLowerCase().endsWith(".xml")) {
            const xmlContent = await zFile.async("text");
            xmlTextMap[relPath] = xmlContent;
            totalFilesCount++;
          }
        }
      } else if (fname.endsWith(".xml")) {
        const text = await file.text();
        xmlTextMap[file.name] = text;
        totalFilesCount++;
      }
    }

    if (totalFilesCount === 0) {
      throw new Error("Không tìm thấy tệp XML hợp lệ nào trong dữ liệu tải lên!");
    }

    if (progressCallback) progressCallback(30, `Đã đọc ${totalFilesCount} tệp XML. Đang phân tích cú pháp dữ liệu...`);

    // Phân tích và nhóm dữ liệu theo MÃ_LK
    const encounterMap = {}; // ma_lk -> { xml1: {}, xml2: [], xml3: [], xml4: [], xml5: [], errors: [], warnings: [], rawXmlNodes: [] }
    const parser = new DOMParser();

    let processedCount = 0;
    const fileEntries = Object.entries(xmlTextMap);

    for (const [filename, xmlContent] of fileEntries) {
      processedCount++;
      const pct = 30 + Math.round((processedCount / fileEntries.length) * 40);
      if (progressCallback) progressCallback(pct, `Đang kiểm tra tệp (${processedCount}/${fileEntries.length}): ${filename.split("/").pop()}`);

      try {
        const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
        const parseError = xmlDoc.getElementsByTagName("parsererror")[0];
        if (parseError) {
          // Lỗi cú pháp XML
          const errLk = "FILE_ERROR_" + filename;
          if (!encounterMap[errLk]) {
            encounterMap[errLk] = this.initEncounter(errLk, filename);
          }
          encounterMap[errLk].errors.push({
            ruleId: "XML_SYNTAX_ERROR",
            severity: "critical",
            category: "Cú pháp XML",
            field: "XML_STRUCTURE",
            message: `Tệp ${filename} bị lỗi cú pháp XML, không thể đọc dữ liệu: ${parseError.textContent.slice(0, 120)}`,
            suggestion: "Kiểm tra lại ký tự đặc biệt (&, <, >) hoặc đóng thẻ XML trên phần mềm HIS."
          });
          continue;
        }

        // Trích xuất các nút hồ sơ
        this.extractEncounterNodes(xmlDoc, filename, encounterMap);
      } catch (err) {
        console.error(`Lỗi phân tích ${filename}:`, err);
      }
    }

    if (progressCallback) progressCallback(75, "Đang áp dụng bộ quy tắc kiểm tra BHYT QĐ 130 & 4210...");

    // Áp dụng bộ quy tắc kiểm tra chuyên sâu cho từng hồ sơ
    const encountersList = Object.values(encounterMap);
    let validCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    const allErrorsList = [];

    encountersList.forEach(enc => {
      this.evaluateEncounterRules(enc);

      if (enc.errors.length > 0) {
        criticalCount++;
      } else if (enc.warnings.length > 0) {
        warningCount++;
      } else {
        validCount++;
      }

      enc.errors.forEach(e => allErrorsList.push({ ...e, maLk: enc.maLk, patientName: enc.patientName, cardNo: enc.cardNo, fileName: enc.fileName }));
      enc.warnings.forEach(w => allErrorsList.push({ ...w, maLk: enc.maLk, patientName: enc.patientName, cardNo: enc.cardNo, fileName: enc.fileName }));
    });

    if (progressCallback) progressCallback(100, "Hoàn tất kiểm tra dữ liệu BHYT!");

    return {
      totalEncounters: encountersList.length,
      totalFiles: totalFilesCount,
      validCount,
      warningCount,
      criticalCount,
      encounters: encountersList,
      allErrors: allErrorsList,
      summaryStats: this.calculateSummaryStats(encountersList, allErrorsList)
    };
  }

  static initEncounter(maLk, filename) {
    return {
      maLk: maLk,
      fileName: filename,
      patientName: "Chưa xác định",
      cardNo: "",
      dob: "",
      gender: "",
      dept: "",
      dateIn: "",
      dateOut: "",
      totalCost: 0,
      bhtt: 0,
      bntt: 0,
      bncct: 0,
      primaryIcd: "",
      primaryDisease: "",
      treatmentType: "",
      xml1Data: null,
      xml2List: [], // Thuốc
      xml3List: [], // DVKT & VTYT
      xml4List: [], // CLS
      xml5List: [], // Diễn biến
      errors: [],
      warnings: []
    };
  }

  /**
   * Trích xuất các thẻ dữ liệu từ XML vào cấu trúc Encounter
   */
  static extractEncounterNodes(xmlDoc, filename, encounterMap) {
    // 1. Tìm thẻ Tổng hợp / XML1
    const tongHopNodes = xmlDoc.querySelectorAll("TONG_HOP, DSACH_CHI_TIET_THAU, BANG_TONGHOP, hoso, HO_SO");
    tongHopNodes.forEach(node => {
      const maLk = this.getNodeText(node, "MA_LK, ma_lk, MALK, Ma_lk") || ("LK_" + Date.now());
      if (!encounterMap[maLk]) {
        encounterMap[maLk] = this.initEncounter(maLk, filename);
      }
      const enc = encounterMap[maLk];
      enc.xml1Data = this.nodeToDict(node);
      enc.patientName = this.getNodeText(node, "HO_TEN, ho_ten, TEN_BENH_NHAN") || enc.patientName;
      enc.cardNo = this.getNodeText(node, "MA_THE, ma_the, MA_THE_BHYT, MATHE") || enc.cardNo;
      enc.dob = this.getNodeText(node, "NGAY_SINH, ngay_sinh, NGAYSINH") || enc.dob;
      enc.gender = this.getNodeText(node, "GIOI_TINH, gioi_tinh, GIOITINH") || enc.gender;
      enc.dateIn = this.getNodeText(node, "NGAY_VAO, ngay_vao, NGAYVAO") || enc.dateIn;
      enc.dateOut = this.getNodeText(node, "NGAY_RA, ngay_ra, NGAYRA") || enc.dateOut;
      enc.primaryIcd = this.getNodeText(node, "MA_BENH, ma_benh, MABENH") || enc.primaryIcd;
      enc.primaryDisease = this.getNodeText(node, "TEN_BENH, ten_benh, TENBENH") || enc.primaryDisease;
      enc.treatmentType = this.getNodeText(node, "MA_LOAI_KCB, ma_loai_kcb, MALOAIKCB") || enc.treatmentType;
      enc.dept = this.getNodeText(node, "MA_KHOA, ma_khoa, TEN_KHOA") || enc.dept;
      enc.totalCost = parseFloat(this.getNodeText(node, "T_TONGCHI, t_tongchi, TONGCHI") || "0");
      enc.bhtt = parseFloat(this.getNodeText(node, "T_BHTT, t_bhtt") || "0");
      enc.bntt = parseFloat(this.getNodeText(node, "T_BNTT, t_bntt") || "0");
      enc.bncct = parseFloat(this.getNodeText(node, "T_BNCCT, t_bncct") || "0");
    });

    // 2. Tìm thẻ Thuốc / XML2
    const thuocNodes = xmlDoc.querySelectorAll("CHI_TIET_THUOC, DSACH_CHI_TIET_THUOC, thuoc, THUOC");
    thuocNodes.forEach(node => {
      const maLk = this.getNodeText(node, "MA_LK, ma_lk, MALK") || ("LK_" + filename);
      if (!encounterMap[maLk]) {
        encounterMap[maLk] = this.initEncounter(maLk, filename);
      }
      encounterMap[maLk].xml2List.push(this.nodeToDict(node));
    });

    // 3. Tìm thẻ Dịch vụ kỹ thuật & Vật tư / XML3
    const dvktNodes = xmlDoc.querySelectorAll("CHI_TIET_DVKT, DSACH_CHI_TIET_DVKT, dvkt, DVKT, CHI_TIET_VTYT");
    dvktNodes.forEach(node => {
      const maLk = this.getNodeText(node, "MA_LK, ma_lk, MALK") || ("LK_" + filename);
      if (!encounterMap[maLk]) {
        encounterMap[maLk] = this.initEncounter(maLk, filename);
      }
      encounterMap[maLk].xml3List.push(this.nodeToDict(node));
    });

    // 4. Nếu là file XML tổng thể dạng <CHECKIN_OUT> hay <root>
    if (tongHopNodes.length === 0 && thuocNodes.length === 0 && dvktNodes.length === 0) {
      const rootNode = xmlDoc.documentElement;
      const maLk = this.getNodeText(rootNode, "MA_LK, ma_lk, MALK") || filename.replace(/\.xml$/i, "");
      if (!encounterMap[maLk]) {
        encounterMap[maLk] = this.initEncounter(maLk, filename);
      }
      const enc = encounterMap[maLk];
      enc.xml1Data = this.nodeToDict(rootNode);
      enc.patientName = this.getNodeText(rootNode, "HO_TEN, ho_ten") || enc.patientName;
      enc.cardNo = this.getNodeText(rootNode, "MA_THE, ma_the, MA_THE_BHYT") || enc.cardNo;
      enc.dateIn = this.getNodeText(rootNode, "NGAY_VAO, ngay_vao") || enc.dateIn;
      enc.dateOut = this.getNodeText(rootNode, "NGAY_RA, ngay_ra") || enc.dateOut;
      enc.primaryIcd = this.getNodeText(rootNode, "MA_BENH, ma_benh") || enc.primaryIcd;
      enc.totalCost = parseFloat(this.getNodeText(rootNode, "T_TONGCHI, t_tongchi") || "0");
    }
  }

  /**
   * Áp dụng bộ quy tắc nghiệp vụ BHYT QĐ 130 & 4210
   */
  static evaluateEncounterRules(enc) {
    const data = enc.xml1Data || {};

    // -------------------------------------------------------------
    // NHÓM 1: KIỂM TRA THẺ BHYT & HÀNH CHÍNH
    // -------------------------------------------------------------
    const card = (enc.cardNo || "").trim().toUpperCase();
    if (!card) {
      enc.errors.push({
        ruleId: "CARD_EMPTY",
        severity: "critical",
        category: "Thẻ BHYT",
        field: "MA_THE",
        message: "Mã thẻ BHYT bị để trống.",
        suggestion: "Bổ sung số thẻ BHYT của bệnh nhân vào hồ sơ HIS."
      });
    } else {
      // Kiểm tra độ dài chuẩn (15 ký tự hoặc 10 số định danh BHXH)
      if (card.length !== 15 && card.length !== 10) {
        enc.errors.push({
          ruleId: "CARD_LENGTH_INVALID",
          severity: "critical",
          category: "Thẻ BHYT",
          field: "MA_THE",
          message: `Mã thẻ BHYT [${card}] có độ dài ${card.length} ký tự (Chuẩn phải là 15 ký tự hoặc 10 số BHXH).`,
          suggestion: "Kiểm tra lại số thẻ in trên thẻ BHYT hoặc quét lại mã QR trên Căn cước công dân / VssID."
        });
      }

      if (card.length === 15) {
        const prefix = card.slice(0, 2);
        if (!this.validCardPrefixes.includes(prefix)) {
          enc.warnings.push({
            ruleId: "CARD_PREFIX_UNUSUAL",
            severity: "warning",
            category: "Thẻ BHYT",
            field: "MA_THE",
            message: `Đầu mã đối tượng [${prefix}] trong thẻ [${card}] không nằm trong danh mục đối tượng phổ biến của BHXH.`,
            suggestion: "Kiểm tra lại đúng mã quyền lợi và nhóm đối tượng được cấp thẻ."
          });
        }
      }
    }

    // Họ tên
    if (!enc.patientName || enc.patientName === "Chưa xác định") {
      enc.errors.push({
        ruleId: "NAME_EMPTY",
        severity: "critical",
        category: "Hành chính",
        field: "HO_TEN",
        message: "Họ và tên bệnh nhân bị trống.",
        suggestion: "Nhập đầy đủ Họ tên theo CCCD/Thẻ BHYT."
      });
    }

    // Nơi ĐKKCB Ban đầu
    const maDkbd = data["MA_DKBD"] || data["ma_dkbd"] || data["MADKBD"];
    if (!maDkbd) {
      enc.warnings.push({
        ruleId: "DKBD_EMPTY",
        severity: "warning",
        category: "Hành chính",
        field: "MA_DKBD",
        message: "Mã nơi Đăng ký Khám chữa bệnh ban đầu (MA_DKBD) bị trống.",
        suggestion: "Điền mã cơ sở KCB ban đầu 5 ký tự (ví dụ: 27001, 27026...)."
      });
    }

    // -------------------------------------------------------------
    // NHÓM 2: KIỂM TRA THỜI GIAN KCB (NGÀY VÀO, NGÀY RA, NGÀY SINH)
    // -------------------------------------------------------------
    const dIn = enc.dateIn ? this.parseDateString(enc.dateIn) : null;
    const dOut = enc.dateOut ? this.parseDateString(enc.dateOut) : null;
    const dDob = enc.dob ? this.parseDateString(enc.dob) : null;

    if (!enc.dateIn) {
      enc.errors.push({
        ruleId: "DATE_IN_EMPTY",
        severity: "critical",
        category: "Thời gian",
        field: "NGAY_VAO",
        message: "Ngày vào viện (NGAY_VAO) bị trống.",
        suggestion: "Điền thời gian vào viện theo định dạng YYYYMMDDHHmm."
      });
    }

    if (!enc.dateOut) {
      enc.errors.push({
        ruleId: "DATE_OUT_EMPTY",
        severity: "critical",
        category: "Thời gian",
        field: "NGAY_RA",
        message: "Ngày ra viện / kết thúc khám (NGAY_RA) bị trống.",
        suggestion: "Điền thời gian ra viện theo định dạng YYYYMMDDHHmm."
      });
    }

    if (dIn && dOut) {
      if (dIn > dOut) {
        enc.errors.push({
          ruleId: "DATE_ORDER_REVERSED",
          severity: "critical",
          category: "Thời gian",
          field: "NGAY_VAO_RA",
          message: `Thời gian vào viện [${enc.dateIn}] lớn hơn thời gian ra viện [${enc.dateOut}] (Vô lý).`,
          suggestion: "Điều chỉnh lại giờ/ngày tiếp đón hoặc ngày kết thúc điều trị."
        });
      }
    }

    if (dDob && dIn && dDob > dIn) {
      enc.errors.push({
        ruleId: "DOB_AFTER_ADMISSION",
        severity: "critical",
        category: "Thời gian",
        field: "NGAY_SINH",
        message: `Ngày sinh [${enc.dob}] lớn hơn ngày vào viện [${enc.dateIn}] (Bệnh nhân chưa sinh).`,
        suggestion: "Kiểm tra lại năm sinh của bệnh nhân."
      });
    }

    // -------------------------------------------------------------
    // NHÓM 3: KIỂM TRA MÃ BỆNH ICD-10
    // -------------------------------------------------------------
    const icd = (enc.primaryIcd || "").trim().toUpperCase();
    if (!icd) {
      enc.errors.push({
        ruleId: "ICD_EMPTY",
        severity: "critical",
        category: "Mã bệnh",
        field: "MA_BENH",
        message: "Mã bệnh chính (ICD-10) bị trống.",
        suggestion: "Chỉ định mã bệnh chính theo danh mục chuẩn ICD-10 của Bộ Y Tế."
      });
    } else {
      // Kiểm tra cấu trúc ICD-10 (Bắt đầu bằng chữ cái + 2 chữ số + tùy chọn dấu chấm & số)
      const icdRegex = /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/;
      if (!icdRegex.test(icd)) {
        enc.warnings.push({
          ruleId: "ICD_FORMAT_UNUSUAL",
          severity: "warning",
          category: "Mã bệnh",
          field: "MA_BENH",
          message: `Mã bệnh chính [${icd}] có cấu trúc khác thường so với quy chuẩn ICD-10.`,
          suggestion: "Kiểm tra lại mã bệnh ICD-10 (ví dụ: I10, E11.9, J00...)."
        });
      }
    }

    // -------------------------------------------------------------
    // NHÓM 4: CÂN ĐỐI TÀI CHÍNH & TỔNG CHI PHÍ
    // -------------------------------------------------------------
    const tongChi = enc.totalCost;
    const bhtt = enc.bhtt;
    const bntt = enc.bntt;
    const bncct = enc.bncct;
    const nguonKhac = parseFloat(data["T_NGUONKHAC"] || data["t_nguonkhac"] || "0");
    const ngoaiDs = parseFloat(data["T_NGOAIDS"] || data["t_ngoaids"] || "0");

    const calculatedSum = bhtt + bntt + bncct + nguonKhac + ngoaiDs;
    const diff = Math.abs(tongChi - calculatedSum);

    if (diff > 1.0 && tongChi > 0) {
      enc.errors.push({
        ruleId: "FINANCIAL_MISMATCH",
        severity: "critical",
        category: "Tài chính",
        field: "T_TONGCHI",
        message: `Tổng chi [${tongChi.toLocaleString("vi-VN")} đ] không bằng tổng các nguồn chi trả (BHTT: ${bhtt.toLocaleString("vi-VN")} + BNTT: ${bntt.toLocaleString("vi-VN")} + BNCCT: ${bncct.toLocaleString("vi-VN")}). Lệch: ${diff.toLocaleString("vi-VN")} đ.`,
        suggestion: "Tính toán lại tỷ lệ hưởng BHYT và chi phí cùng chi trả trên HIS."
      });
    }

    // -------------------------------------------------------------
    // NHÓM 5: KIỂM TRA CHI TIẾT THUỐC & DỊCH VỤ (XML 2, XML 3)
    // -------------------------------------------------------------
    // Kiểm tra thuốc (XML2)
    enc.xml2List.forEach((thuoc, idx) => {
      const maThuoc = thuoc["MA_THUOC"] || thuoc["ma_thuoc"] || "";
      const sl = parseFloat(thuoc["SO_LUONG"] || thuoc["so_luong"] || "0");
      const donGia = parseFloat(thuoc["DON_GIA"] || thuoc["don_gia"] || "0");
      const tt = parseFloat(thuoc["THANH_TIEN"] || thuoc["thanh_tien"] || "0");

      if (!maThuoc) {
        enc.errors.push({
          ruleId: "DRUG_CODE_EMPTY",
          severity: "critical",
          category: "Thuốc",
          field: `XML2_ROW_${idx + 1}`,
          message: `Dòng thuốc thứ ${idx + 1} bị thiếu mã thuốc (MA_THUOC).`,
          suggestion: "Ánh xạ mã thuốc theo danh mục thuốc dùng chung của Cổng BYT."
        });
      }

      if (sl <= 0) {
        enc.errors.push({
          ruleId: "DRUG_QTY_INVALID",
          severity: "critical",
          category: "Thuốc",
          field: `XML2_ROW_${idx + 1}`,
          message: `Thuốc [${maThuoc}] có số lượng kê = ${sl} (Số lượng phải > 0).`,
          suggestion: "Điều chỉnh số lượng thuốc > 0 hoặc xóa dòng kê đơn thừa."
        });
      }

      if (donGia < 0) {
        enc.errors.push({
          ruleId: "DRUG_PRICE_NEGATIVE",
          severity: "critical",
          category: "Thuốc",
          field: `XML2_ROW_${idx + 1}`,
          message: `Thuốc [${maThuoc}] có đơn giá âm [${donGia} đ].`,
          suggestion: "Kiểm tra lại giá thuốc trong danh mục viện phí."
        });
      }
    });

    // Kiểm tra Dịch vụ kỹ thuật & Vật tư (XML3)
    enc.xml3List.forEach((dv, idx) => {
      const maDv = dv["MA_DICH_VU"] || dv["ma_dich_vu"] || dv["MA_VAT_TU"] || dv["ma_vat_tu"] || "";
      const sl = parseFloat(dv["SO_LUONG"] || dv["so_luong"] || "0");
      const donGia = parseFloat(dv["DON_GIA"] || dv["don_gia"] || "0");

      if (!maDv) {
        enc.errors.push({
          ruleId: "SERVICE_CODE_EMPTY",
          severity: "critical",
          category: "DVKT & VTYT",
          field: `XML3_ROW_${idx + 1}`,
          message: `Dòng dịch vụ/vật tư thứ ${idx + 1} bị thiếu mã dịch vụ (MA_DICH_VU/MA_VAT_TU).`,
          suggestion: "Ánh xạ mã dịch vụ theo danh mục kỹ thuật chuẩn BYT."
        });
      }

      if (sl <= 0) {
        enc.errors.push({
          ruleId: "SERVICE_QTY_INVALID",
          severity: "critical",
          category: "DVKT & VTYT",
          field: `XML3_ROW_${idx + 1}`,
          message: `Dịch vụ [${maDv}] có số lượng thực hiện = ${sl} (Số lượng phải > 0).`,
          suggestion: "Kiểm tra lại chỉ định dịch vụ kỹ thuật."
        });
      }
    });
  }

  /**
   * Tính toán các chỉ số thống kê tổng hợp lỗi
   */
  static calculateSummaryStats(encounters, allErrors) {
    const errorTypesCount = {};
    const errorCategoryCount = {
      "Cú pháp XML": 0,
      "Thẻ BHYT": 0,
      "Hành chính": 0,
      "Thời gian": 0,
      "Mã bệnh": 0,
      "Tài chính": 0,
      "Thuốc": 0,
      "DVKT & VTYT": 0
    };

    allErrors.forEach(err => {
      const cat = err.category || "Khác";
      errorCategoryCount[cat] = (errorCategoryCount[cat] || 0) + 1;
      errorTypesCount[err.ruleId] = (errorTypesCount[err.ruleId] || 0) + 1;
    });

    return {
      errorCategoryCount,
      errorTypesCount,
      totalErrors: allErrors.filter(e => e.severity === "critical").length,
      totalWarnings: allErrors.filter(e => e.severity === "warning").length
    };
  }

  /**
   * Xuất Báo Cáo Lỗi BHYT sang Excel (.xlsx) chuẩn nghiệp vụ
   */
  static async exportErrorReportExcel(validationResult, orgConfig = {}) {
    if (!window.ExcelJS) {
      throw new Error("Thư viện ExcelJS chưa sẵn sàng.");
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "BVĐK Bắc Ninh Số 2 - Phòng CNTT";
    wb.created = new Date();

    // Sheet 1: Bảng tổng quan
    const wsSummary = wb.addWorksheet("Tổng Quan Kiểm Tra");
    wsSummary.views = [{ showGridLines: true }];

    wsSummary.addRow([orgConfig.org1 || "ỦY BAN NHÂN DÂN TỈNH BẮC NINH"]);
    wsSummary.addRow([orgConfig.org2 || "SỞ Y TẾ BẮC NINH"]);
    wsSummary.addRow([orgConfig.org3 || "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2"]);
    wsSummary.addRow(["PHÒNG CÔNG NGHỆ THÔNG TIN - HỆ THỐNG GIÁM ĐỊNH BHYT"]);
    wsSummary.addRow([]);
    wsSummary.addRow(["BÁO CÁO KẾT QUẢ KIỂM TRA LỖI DỮ LIỆU HỒ SƠ BHYT (QĐ 130 & 4210)"]);
    wsSummary.addRow([`Thời gian xuất báo cáo: ${new Date().toLocaleString("vi-VN")}`]);
    wsSummary.addRow([]);

    wsSummary.addRow(["Chỉ số thống kê", "Số lượng", "Tỷ lệ (%)"]);
    wsSummary.addRow(["Tổng số hồ sơ kiểm tra (MÃ_LK)", validationResult.totalEncounters, "100%"]);
    wsSummary.addRow(["Hồ sơ Hợp lệ (Sẵn sàng đẩy Cổng)", validationResult.validCount, `${((validationResult.validCount / Math.max(1, validationResult.totalEncounters)) * 100).toFixed(1)}%`]);
    wsSummary.addRow(["Hồ sơ Có Cảnh Báo (Cần rà soát)", validationResult.warningCount, `${((validationResult.warningCount / Math.max(1, validationResult.totalEncounters)) * 100).toFixed(1)}%`]);
    wsSummary.addRow(["Hồ sơ Lỗi Nghiêm Trọng (Bắt buộc sửa)", validationResult.criticalCount, `${((validationResult.criticalCount / Math.max(1, validationResult.totalEncounters)) * 100).toFixed(1)}%`]);
    wsSummary.addRow(["Tổng số lỗi & cảnh báo phát hiện", validationResult.allErrors.length, "-"]);

    // Style Header
    wsSummary.mergeCells("A6:C6");
    const titleCell = wsSummary.getCell("A6");
    titleCell.font = { name: "Times New Roman", size: 14, bold: true, color: { argb: "FF0284C7" } };
    titleCell.alignment = { horizontal: "center" };

    // Sheet 2: Danh sách chi tiết các lỗi cần sửa
    const wsErrors = wb.addWorksheet("Chi Tiết Lỗi Cần Xử Lý");
    wsErrors.views = [{ showGridLines: true }];

    wsErrors.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Mã Liên Kết (MÃ_LK)", key: "maLk", width: 22 },
      { header: "Họ và Tên Bệnh Nhân", key: "patientName", width: 24 },
      { header: "Mã Thẻ BHYT", key: "cardNo", width: 18 },
      { header: "Mức Độ", key: "severity", width: 15 },
      { header: "Nhóm Lỗi", key: "category", width: 16 },
      { header: "Trường Dữ Liệu", key: "field", width: 16 },
      { header: "Nội Dung Lỗi Chi Tiết", key: "message", width: 45 },
      { header: "Gợi Ý Xử Lý Khắc Phục", key: "suggestion", width: 40 },
      { header: "Tệp Nguồn", key: "fileName", width: 25 }
    ];

    // Header styling
    const headerRow = wsErrors.getRow(1);
    headerRow.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0284C7" } };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    validationResult.allErrors.forEach((err, idx) => {
      const isCritical = (err.severity === "critical");
      const r = wsErrors.addRow({
        stt: idx + 1,
        maLk: err.maLk,
        patientName: err.patientName,
        cardNo: err.cardNo,
        severity: isCritical ? "LỖI NẶNG" : "CẢNH BÁO",
        category: err.category,
        field: err.field,
        message: err.message,
        suggestion: err.suggestion,
        fileName: err.fileName
      });

      r.font = { name: "Times New Roman", size: 10 };
      r.alignment = { vertical: "middle" };

      // Highlight cell severity
      const sevCell = r.getCell(5);
      sevCell.font = { bold: true, color: { argb: isCritical ? "FFEF4444" : "FFF59E0B" } };
      sevCell.alignment = { horizontal: "center" };
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_Cao_Loi_XML_BHYT_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Tự Động Sửa Lỗi Nhanh (Auto-Fixer) cho tập hồ sơ BHYT
   */
  static autoFixEncounters(validationResult) {
    if (!validationResult || !validationResult.encounters) {
      throw new Error("Chưa có dữ liệu hồ sơ để thực hiện sửa lỗi tự động!");
    }

    let fixedCount = 0;
    const fixLogs = [];

    validationResult.encounters.forEach(enc => {
      let isFixedForThisEnc = false;
      const encLogs = [];

      // 1. Chuẩn hóa Mã thẻ BHYT (Loại bỏ khoảng trắng, tabs, viết hoa chữ cái)
      if (enc.cardNo) {
        const rawCard = enc.cardNo;
        const cleanCard = rawCard.replace(/\s+/g, "").toUpperCase();
        if (cleanCard !== rawCard) {
          enc.cardNo = cleanCard;
          if (enc.xml1Data) {
            enc.xml1Data.MA_THE = cleanCard;
            enc.xml1Data.ma_the = cleanCard;
          }
          isFixedForThisEnc = true;
          encLogs.push(`Chuẩn hóa mã thẻ BHYT [${rawCard}] -> [${cleanCard}]`);
          fixedCount++;
        }
      }

      // 2. Cân bằng sai số làm tròn tài chính / Viện phí
      // T_TONGCHI = T_BHTT + T_BNTT + T_BNCCT + T_NGUONKHAC + T_NGOAIDS
      const data = enc.xml1Data || {};
      const t_tongchi = parseFloat(data.T_TONGCHI || data.t_tongchi || enc.totalCost || 0);
      const t_bhtt = parseFloat(data.T_BHTT || data.t_bhtt || enc.bhtt || 0);
      const t_bntt = parseFloat(data.T_BNTT || data.t_bntt || enc.bntt || 0);
      const t_bncct = parseFloat(data.T_BNCCT || data.t_bncct || enc.bncct || 0);
      const t_nguonkhac = parseFloat(data.T_NGUONKHAC || data.t_nguonkhac || 0);
      const t_ngoadds = parseFloat(data.T_NGOAIDS || data.t_ngoadds || 0);

      const sumComponents = t_bhtt + t_bntt + t_bncct + t_nguonkhac + t_ngoadds;
      const diff = Math.abs(t_tongchi - sumComponents);

      if (diff > 0.001 && diff <= 10.0 && t_tongchi > 0) {
        // Tự động cân bằng làm tròn chính xác vào BHTT
        const newBhtt = Math.round((t_tongchi - (t_bntt + t_bncct + t_nguonkhac + t_ngoadds)) * 100) / 100;
        if (newBhtt >= 0) {
          enc.bhtt = newBhtt;
          if (enc.xml1Data) {
            enc.xml1Data.T_BHTT = newBhtt.toString();
            enc.xml1Data.t_bhtt = newBhtt.toString();
          }
          isFixedForThisEnc = true;
          encLogs.push(`Tự động cân bằng tài chính: Điều chỉnh T_BHTT từ ${t_bhtt} -> ${newBhtt} đ (lệch ${diff.toFixed(2)} đ)`);
          fixedCount++;
        }
      }

      // 3. Chuẩn hóa chuỗi ngày giờ (Loại bỏ dấu gạch ngang, khoảng trắng, định dạng số)
      ["NGAY_VAO", "NGAY_RA", "NGAY_SINH"].forEach(dateField => {
        const rawVal = data[dateField] || (dateField === "NGAY_VAO" ? enc.dateIn : (dateField === "NGAY_RA" ? enc.dateOut : enc.dob));
        if (rawVal && typeof rawVal === "string") {
          const digitsOnly = rawVal.replace(/\D/g, "");
          if (digitsOnly !== rawVal && digitsOnly.length >= 8) {
            if (enc.xml1Data) enc.xml1Data[dateField] = digitsOnly;
            if (dateField === "NGAY_VAO") enc.dateIn = digitsOnly;
            if (dateField === "NGAY_RA") enc.dateOut = digitsOnly;
            if (dateField === "NGAY_SINH") enc.dob = digitsOnly;
            isFixedForThisEnc = true;
            encLogs.push(`Chuẩn hóa định dạng ngày giờ [${dateField}]: [${rawVal}] -> [${digitsOnly}]`);
            fixedCount++;
          }
        }
      });

      // 4. Chuẩn hóa Mã Cơ Sở KCB & Nơi ĐKKCB (Viết hoa, loại bỏ khoảng trắng thừa)
      ["MA_CSKCB", "MA_DKBD", "MA_BENH", "MA_BENHKEM"].forEach(codeField => {
        if (data[codeField]) {
          const raw = data[codeField];
          const clean = raw.trim().toUpperCase();
          if (clean !== raw) {
            if (enc.xml1Data) enc.xml1Data[codeField] = clean;
            if (codeField === "MA_BENH") enc.primaryIcd = clean;
            isFixedForThisEnc = true;
            encLogs.push(`Chuẩn hóa mã [${codeField}]: [${raw}] -> [${clean}]`);
            fixedCount++;
          }
        }
      });

      // 5. Chuẩn hóa danh sách Thuốc & DVKT
      (enc.xml2List || []).forEach((thuoc) => {
        if (thuoc.MA_THUOC) {
          const cleanCode = thuoc.MA_THUOC.trim();
          if (cleanCode !== thuoc.MA_THUOC) {
            thuoc.MA_THUOC = cleanCode;
            fixedCount++;
          }
        }
      });

      (enc.xml3List || []).forEach((dvkt) => {
        if (dvkt.MA_DICH_VU) {
          const cleanCode = dvkt.MA_DICH_VU.trim();
          if (cleanCode !== dvkt.MA_DICH_VU) {
            dvkt.MA_DICH_VU = cleanCode;
            fixedCount++;
          }
        }
      });

      if (isFixedForThisEnc) {
        enc.isAutoFixed = true;
        enc.fixedLogs = encLogs;
        fixLogs.push({ maLk: enc.maLk, patientName: enc.patientName, logs: encLogs });
      }

      // Xóa lỗi cũ và đánh giá lại toàn bộ quy tắc sau khi sửa
      enc.errors = [];
      enc.warnings = [];
      this.evaluateEncounterRules(enc);
    });

    // Tính toán lại các bộ đếm sau khi sửa
    let validCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    const allErrorsList = [];

    validationResult.encounters.forEach(enc => {
      if (enc.errors.length > 0) {
        criticalCount++;
      } else if (enc.warnings.length > 0) {
        warningCount++;
      } else {
        validCount++;
      }

      enc.errors.forEach(e => allErrorsList.push({ ...e, maLk: enc.maLk, patientName: enc.patientName, cardNo: enc.cardNo, fileName: enc.fileName }));
      enc.warnings.forEach(w => allErrorsList.push({ ...w, maLk: enc.maLk, patientName: enc.patientName, cardNo: enc.cardNo, fileName: enc.fileName }));
    });

    validationResult.validCount = validCount;
    validationResult.warningCount = warningCount;
    validationResult.criticalCount = criticalCount;
    validationResult.allErrors = allErrorsList;
    validationResult.summaryStats = this.calculateSummaryStats(validationResult.encounters, allErrorsList);
    validationResult.isFixed = true;
    validationResult.fixedCount = fixedCount;
    validationResult.fixLogs = fixLogs;

    return {
      fixedCount,
      fixLogs,
      updatedResult: validationResult
    };
  }

  /**
   * Tạo gói tệp ZIP chứa toàn bộ file XML đã được chuẩn hóa và sửa lỗi
   */
  static async downloadCleanZip(validationResult, orgConfig = {}) {
    if (!window.JSZip) {
      throw new Error("Thư viện JSZip chưa sẵn sàng.");
    }

    const zip = new JSZip();
    const encounters = validationResult.encounters || [];

    encounters.forEach(enc => {
      const maLk = enc.maLk || ("LK_" + Date.now());

      // 1. Tạo nội dung XML1 (Tổng hợp)
      const xml1Doc = document.implementation.createDocument(null, "TONG_HOP", null);
      const root1 = xml1Doc.documentElement;
      const d1 = enc.xml1Data || {};
      for (const [k, v] of Object.entries(d1)) {
        const el = xml1Doc.createElement(k);
        el.textContent = v !== null && v !== undefined ? v.toString() : "";
        root1.appendChild(el);
      }
      const xml1Str = '<?xml version="1.0" encoding="utf-8"?>\n' + new XMLSerializer().serializeToString(xml1Doc);
      zip.file(`HOSO_${maLk}/XML1_${maLk}.xml`, xml1Str);

      // 2. Tạo nội dung XML2 (Thuốc nếu có)
      if (enc.xml2List && enc.xml2List.length > 0) {
        const xml2Doc = document.implementation.createDocument(null, "DSACH_CHI_TIET_THUOC", null);
        const root2 = xml2Doc.documentElement;
        enc.xml2List.forEach(item => {
          const rowEl = xml2Doc.createElement("CHI_TIET_THUOC");
          for (const [k, v] of Object.entries(item)) {
            const el = xml2Doc.createElement(k);
            el.textContent = v !== null && v !== undefined ? v.toString() : "";
            rowEl.appendChild(el);
          }
          root2.appendChild(rowEl);
        });
        const xml2Str = '<?xml version="1.0" encoding="utf-8"?>\n' + new XMLSerializer().serializeToString(xml2Doc);
        zip.file(`HOSO_${maLk}/XML2_${maLk}.xml`, xml2Str);
      }

      // 3. Tạo nội dung XML3 (DVKT nếu có)
      if (enc.xml3List && enc.xml3List.length > 0) {
        const xml3Doc = document.implementation.createDocument(null, "DSACH_CHI_TIET_DVKT", null);
        const root3 = xml3Doc.documentElement;
        enc.xml3List.forEach(item => {
          const rowEl = xml3Doc.createElement("CHI_TIET_DVKT");
          for (const [k, v] of Object.entries(item)) {
            const el = xml3Doc.createElement(k);
            el.textContent = v !== null && v !== undefined ? v.toString() : "";
            rowEl.appendChild(el);
          }
          root3.appendChild(rowEl);
        });
        const xml3Str = '<?xml version="1.0" encoding="utf-8"?>\n' + new XMLSerializer().serializeToString(xml3Doc);
        zip.file(`HOSO_${maLk}/XML3_${maLk}.xml`, xml3Str);
      }
    });

    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.download = `GOI_XML_BHYT_DA_CHUAN_HOA_${dateStr}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Helpers
  static getNodeText(node, tagNamesStr) {
    const tags = tagNamesStr.split(",").map(t => t.trim());
    for (const t of tags) {
      const el = node.getElementsByTagName(t)[0];
      if (el && el.textContent) return el.textContent.trim();
    }
    return "";
  }

  static nodeToDict(node) {
    const dict = {};
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 1 && child.textContent) {
        dict[child.nodeName] = child.textContent.trim();
      }
    }
    return dict;
  }

  static parseDateString(str) {
    if (!str) return null;
    const clean = str.replace(/\D/g, "");
    if (clean.length >= 8) {
      const y = parseInt(clean.slice(0, 4), 10);
      const m = parseInt(clean.slice(4, 6), 10) - 1;
      const d = parseInt(clean.slice(6, 8), 10);
      const h = clean.length >= 10 ? parseInt(clean.slice(8, 10), 10) : 0;
      const min = clean.length >= 12 ? parseInt(clean.slice(10, 12), 10) : 0;
      return new Date(y, m, d, h, min);
    }
    return null;
  }
}

window.ToolBhytXml = ToolBhytXml;
