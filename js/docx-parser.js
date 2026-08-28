/**
 * docx-parser.js
 * Universal client-side Word (.docx) table extractor using JSZip & DOMParser.
 * 100% Client-side, no server required.
 */

class DocxTableParser {
  /**
   * Extract all tables from an ArrayBuffer or File representing a .docx document.
   * @param {ArrayBuffer|File|Blob} fileData 
   * @param {string} fileName 
   * @returns {Promise<Array<Array<Array<string>>>>} Array of tables -> rows -> cells (strings)
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

      // Check parse error
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        throw new Error(`Lỗi phân tích XML trong file ${fileName}: ${parseError.textContent}`);
      }

      const tables = [];
      // Support both namespaced and non-namespaced tags
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
          // Get direct child tc nodes
          const tcNodes = trNode.getElementsByTagName("w:tc").length > 0
            ? trNode.getElementsByTagName("w:tc")
            : trNode.getElementsByTagName("tc");

          const rowData = [];
          for (let c = 0; c < tcNodes.length; c++) {
            const tcNode = tcNodes[c];
            // Extract text from w:t elements
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

  static cleanText(value) {
    if (value === null || value === undefined) return "";
    let text = String(value)
      .replace(/\u00a0/g, " ")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text;
  }

  static removeAccents(text) {
    if (!text) return "";
    let str = String(text).replace(/đ/g, "d").replace(/Đ/g, "D");
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return str.toLowerCase();
  }

  static normName(value) {
    const text = DocxTableParser.cleanText(value);
    const noAcc = DocxTableParser.removeAccents(text);
    return noAcc.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  }

  static normCccd(value) {
    if (!value) return "";
    const digits = String(value).replace(/\D/g, "");
    return digits.replace(/^0+/, "");
  }

  static formatCccdOutput(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 11) {
      return "0" + digits;
    }
    return digits;
  }

  static normalizeDate(value) {
    const val = DocxTableParser.cleanText(value);
    if (!val) return "";
    
    // Check DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const match = val.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (match) {
      let day = parseInt(match[1], 10);
      let month = parseInt(match[2], 10);
      let year = parseInt(match[3], 10);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      const dd = String(day).padStart(2, "0");
      const mm = String(month).padStart(2, "0");
      return `${dd}/${mm}/${year}`;
    }
    return val;
  }

  static normalizeIssuePlace(value) {
    const val = DocxTableParser.cleanText(value).toUpperCase();
    if (
      val.includes("CCSĐKQLCTVDLQGVDC") ||
      val.includes("ĐKQL") ||
      val.includes("DKQL") ||
      val.includes("DÂN CƯ") ||
      val.includes("DAN CU") ||
      val.includes("BỘ CÔNG AN") ||
      val.includes("BO CONG AN")
    ) {
      return "CCSĐKQLCTVDLQGVDC";
    }
    return "CCSQLHCVTTXH";
  }

  static cleanEmail(emailStr) {
    if (!emailStr) return "";
    const clean = DocxTableParser.cleanText(emailStr);
    if (clean.includes("@")) {
      const parts = clean.split("@");
      return parts[0].trim() + "@" + parts[1].trim();
    }
    return clean;
  }
}

window.DocxTableParser = DocxTableParser;
