/**
 * docx-parser.js
 * Universal client-side Word (.docx) & Excel data extraction and intelligent normalization engine.
 * 100% Client-side, ultra-fast and secure.
 */

class DocxTableParser {
  /**
   * Trích xuất tất cả các bảng biểu từ file Word (.docx)
   * @param {ArrayBuffer|File|Blob} fileData 
   * @param {string} fileName 
   * @returns {Promise<Array<Array<Array<string>>>>} Mảng chứa các bảng -> dòng -> ô
   */
  static async extractTables(fileData, fileName = "") {
    if (!window.JSZip) {
      throw new Error("Thư viện JSZip chưa được nạp. Vui lòng kiểm tra kết nối mạng.");
    }

    try {
      let arrayBuffer = fileData;
      if (fileData instanceof Blob) {
        arrayBuffer = await fileData.arrayBuffer();
      }

      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXmlFile = zip.file("word/document.xml");
      if (!docXmlFile) {
        throw new Error(`File ${fileName} không phải là tài liệu Word .docx hợp lệ (thiếu word/document.xml).`);
      }

      const xmlText = await docXmlFile.async("text");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");

      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        throw new Error(`Lỗi phân tích XML trong file ${fileName}: ${parseError.textContent}`);
      }

      const tables = [];
      const tblNodes = xmlDoc.getElementsByTagName("w:tbl").length > 0
        ? xmlDoc.getElementsByTagName("w:tbl")
        : xmlDoc.getElementsByTagName("tbl");

      for (let t = 0; t < tblNodes.length; t++) {
        const tblNode = tblNodes[t];
        const trNodes = tblNode.getElementsByTagName("w:tr").length > 0
          ? tblNode.getElementsByTagName("w:tr")
          : tblNode.getElementsByTagName("tr");

        const tableData = [];
        for (let r = 0; r < trNodes.length; r++) {
          const trNode = trNodes[r];
          const tcNodes = trNode.getElementsByTagName("w:tc").length > 0
            ? trNode.getElementsByTagName("w:tc")
            : trNode.getElementsByTagName("tc");

          const rowData = [];
          for (let c = 0; c < tcNodes.length; c++) {
            const tcNode = tcNodes[c];
            const tNodes = tcNode.getElementsByTagName("w:t").length > 0
              ? tcNode.getElementsByTagName("w:t")
              : tcNode.getElementsByTagName("t");

            let cellText = "";
            for (let i = 0; i < tNodes.length; i++) {
              cellText += tNodes[i].textContent;
            }
            rowData.push(DocxTableParser.cleanText(cellText));
          }
          if (rowData.length > 0) {
            tableData.push(rowData);
          }
        }
        if (tableData.length > 0) {
          tables.push(tableData);
        }
      }

      return tables;
    } catch (err) {
      console.error(`Lỗi đọc file Word ${fileName}:`, err);
      throw new Error(`Không thể đọc file Word [${fileName}]: ${err.message}`);
    }
  }

  // =========================================================================
  // BỘ CHUẨN HÓA DỮ LIỆU THÔNG MINH (SMART DATA NORMALIZATION & VALIDATION)
  // =========================================================================

  /**
   * Làm sạch chuỗi cơ bản, loại bỏ ký tự rác, khoảng trắng lạ
   */
  static cleanText(value) {
    if (value === null || value === undefined) return "";
    let text = String(value)
      .replace(/\u00a0/g, " ")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text;
  }

  /**
   * Loại bỏ dấu tiếng Việt chuẩn
   */
  static removeAccents(text) {
    if (!text) return "";
    let str = String(text)
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return str.toLowerCase();
  }

  /**
   * Chuẩn hóa Họ và Tên: Title Case tiếng Việt, loại bỏ tiền tố thừa như "BS. ", "Đ/c ", "1. "
   */
  static normalizePersonName(value) {
    let text = DocxTableParser.cleanText(value);
    if (!text) return "";

    // Loại bỏ số thứ tự ở đầu (ví dụ: "1. Nguyễn Văn A" -> "Nguyễn Văn A")
    text = text.replace(/^\d+[\.\-\)]\s*/, "");

    // Loại bỏ tiền tố xưng danh thường gặp
    text = text.replace(/^(ông|bà|bs|bs\.|bác sĩ|đ\/c|đồng chí|cn|ts|th\s*s)\s+/i, "");

    // Viết hoa chữ cái đầu từng từ (Title Case)
    const words = text.toLowerCase().split(/\s+/);
    const capitalized = words.map(w => {
      if (!w) return "";
      return w.charAt(0).toUpperCase() + w.slice(1);
    });

    return capitalized.join(" ").trim();
  }

  /**
   * Chuẩn hóa Key Tên để so khớp không dấu
   */
  static normName(value) {
    const text = DocxTableParser.cleanText(value);
    const noAcc = DocxTableParser.removeAccents(text);
    return noAcc.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  }

  /**
   * Chuẩn hóa Số CCCD/CMND: Lọc chỉ lấy chữ số, chuẩn hóa 12 số
   */
  static normCccd(value) {
    if (!value) return "";
    const digits = String(value).replace(/\D/g, "");
    return digits.replace(/^0+/, "");
  }

  /**
   * Định dạng xuất CCCD: Nếu 11 số (do Excel tự cắt 0 đầu) -> bù 0 thành 12 số chuẩn
   */
  static formatCccdOutput(value) {
    if (!value) return "";
    const digits = String(value).replace(/\D/g, "");
    if (digits.length === 11) {
      return "0" + digits;
    }
    return digits;
  }

  /**
   * Kiểm tra tính hợp lệ của CCCD
   */
  static isValidCccd(value) {
    const formatted = DocxTableParser.formatCccdOutput(value);
    return formatted.length === 12 || formatted.length === 9;
  }

  /**
   * Chuẩn hóa Ngày tháng (dd/MM/yyyy)
   * Xử lý đa dạng: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, yyyy-mm-dd, Excel Serial Date
   */
  static normalizeDate(value) {
    if (value === null || value === undefined) return "";
    const val = DocxTableParser.cleanText(value);
    if (!val) return "";

    // Nếu là đối tượng Date
    if (value instanceof Date && !isNaN(value.getTime())) {
      const dd = String(value.getDate()).padStart(2, "0");
      const mm = String(value.getMonth() + 1).padStart(2, "0");
      const yyyy = value.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    // Nếu là Excel Serial Number (ví dụ: 35421)
    if (!isNaN(val) && Number(val) > 20000 && Number(val) < 80000) {
      try {
        const dateObj = new Date((Number(val) - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(dateObj.getTime())) {
          const dd = String(dateObj.getDate()).padStart(2, "0");
          const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
          const yyyy = dateObj.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        }
      } catch (e) {}
    }

    // Định dạng ngày/tháng/năm
    const matchDmy = val.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (matchDmy) {
      let day = parseInt(matchDmy[1], 10);
      let month = parseInt(matchDmy[2], 10);
      let year = parseInt(matchDmy[3], 10);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      const dd = String(day).padStart(2, "0");
      const mm = String(month).padStart(2, "0");
      return `${dd}/${mm}/${year}`;
    }

    // Định dạng năm-tháng-ngày (yyyy-mm-dd)
    const matchYmd = val.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (matchYmd) {
      let year = parseInt(matchYmd[1], 10);
      let month = parseInt(matchYmd[2], 10);
      let day = parseInt(matchYmd[3], 10);
      const dd = String(day).padStart(2, "0");
      const mm = String(month).padStart(2, "0");
      return `${dd}/${mm}/${year}`;
    }

    // Chỉ có năm sinh (ví dụ: 1988)
    const matchYearOnly = val.match(/^(\d{4})$/);
    if (matchYearOnly) {
      return val;
    }

    return val;
  }

  /**
   * Chuẩn hóa Nơi cấp CCCD về 2 chuẩn mục tiêu VGCA:
   * 1. CCSĐKQLCTVDLQGVDC (Cục Cảnh sát QLHC về TTXH / Dân cư / Bộ Công An)
   * 2. CCSQLHCVTTXH (Cục Cảnh sát QLHC về TTXH cũ)
   */
  static normalizeIssuePlace(value) {
    const val = DocxTableParser.cleanText(value).toUpperCase();
    if (!val) return "CCSQLHCVTTXH";

    if (
      val.includes("CCSĐKQLCTVDLQGVDC") ||
      val.includes("CCSDKQLCTVDLQGVDC") ||
      val.includes("ĐKQL") ||
      val.includes("DKQL") ||
      val.includes("DÂN CƯ") ||
      val.includes("DAN CU") ||
      val.includes("BỘ CÔNG AN") ||
      val.includes("BO CONG AN") ||
      val.includes("C06") ||
      val.includes("QLCTVDLQGVDC")
    ) {
      return "CCSĐKQLCTVDLQGVDC";
    }

    return "CCSQLHCVTTXH";
  }

  /**
   * Chuẩn hóa Số điện thoại di động Việt Nam (10 chữ số bắt đầu bằng 0)
   */
  static normalizePhoneNumber(value) {
    if (!value) return "";
    let digits = String(value).replace(/\D/g, "");
    if (digits.startsWith("84") && digits.length >= 11) {
      digits = "0" + digits.slice(2);
    }
    if (digits.length === 9 && !digits.startsWith("0")) {
      digits = "0" + digits;
    }
    return digits;
  }

  /**
   * Chuẩn hóa địa chỉ Email công vụ (lowercase, trim)
   */
  static cleanEmail(emailStr) {
    if (!emailStr) return "";
    const clean = DocxTableParser.cleanText(emailStr).toLowerCase();
    if (clean.includes("@")) {
      const parts = clean.split("@");
      return parts[0].trim() + "@" + parts[1].trim();
    }
    return clean;
  }

  /**
   * Chuẩn hóa Chức vụ
   */
  static normalizePosition(value) {
    const val = DocxTableParser.cleanText(value);
    if (!val) return "Nhân viên";
    // Viết hoa chữ cái đầu
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  /**
   * Chuẩn hóa Tên Đơn vị Khoa / Phòng
   */
  static normalizeUnitName(value, defaultUnit = "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2") {
    const val = DocxTableParser.cleanText(value);
    if (!val) return defaultUnit;
    return val;
  }
}

window.DocxTableParser = DocxTableParser;
