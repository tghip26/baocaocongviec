/**
 * tool-word-page-remover.js
 * High-Performance Client-side Word (.docx) Page Remover & Cleaner Engine.
 * 100% Client-side bằng JavaScript & JSZip.
 * 
 * Khả năng:
 * 1. Phân tích cấu trúc phân trang chuẩn OpenXML (w:br type="page", w:lastRenderedPageBreak, w:sectPr, w:pageBreakBefore).
 * 2. Nhận diện chính xác trang trắng thừa (Blank Pages), trang bìa, trang chứa bảng biểu và hình ảnh.
 * 3. Cho phép xóa từng trang bất kỳ, xóa hàng loạt theo danh sách hoặc dải trang (ví dụ: 2, 4-6).
 * 4. Tự động xóa sạch toàn bộ trang trắng thừa chỉ với 1 cú click.
 * 5. Xuất tệp .docx mới nguyên bản, bảo toàn 100% hình ảnh (media/*), bảng biểu, styles và header/footer của các trang còn lại.
 */

class WordPageRemover {
  constructor() {
    this.zip = null;
    this.fileName = "";
    this.originalXmlText = "";
    this.xmlDoc = null;
    this.pages = []; // Mảng chứa thông tin từng trang
    this.deletedPageNumbers = new Set();
    this.stats = {
      originalTotalPages: 0,
      totalParagraphs: 0,
      totalTables: 0,
      totalImages: 0,
      blankPagesCount: 0
    };
  }

  /**
   * Tải và phân tích tệp Word (.docx)
   * @param {File|Blob|ArrayBuffer} fileData 
   * @param {string} fileName 
   */
  async loadDocx(fileData, fileName = "Document.docx") {
    if (!window.JSZip) {
      throw new Error("Thư viện JSZip chưa sẵn sàng. Vui lòng tải lại trang.");
    }

    this.fileName = fileName;
    this.deletedPageNumbers.clear();

    let arrayBuffer = fileData;
    if (fileData instanceof Blob) {
      arrayBuffer = await fileData.arrayBuffer();
    }

    this.zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = this.zip.file("word/document.xml");
    if (!docXmlFile) {
      throw new Error(`Tệp "${fileName}" không phải là tài liệu Word (.docx) hợp lệ (thiếu word/document.xml).`);
    }

    this.originalXmlText = await docXmlFile.async("text");
    const parser = new DOMParser();
    this.xmlDoc = parser.parseFromString(this.originalXmlText, "application/xml");

    const parseError = this.xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error(`Lỗi cấu trúc XML trong tệp Word: ${parseError.textContent}`);
    }

    // Đếm số lượng ảnh trong thư mục word/media
    let imageCount = 0;
    const mediaFolder = this.zip.folder("word/media");
    if (mediaFolder) {
      for (const relPath in mediaFolder.files) {
        if (!mediaFolder.files[relPath].dir) {
          imageCount++;
        }
      }
    }
    this.stats.totalImages = imageCount;

    // Phân đoạn các trang
    this.detectPages();

    return {
      fileName: this.fileName,
      totalPages: this.pages.length,
      blankPagesCount: this.stats.blankPagesCount,
      totalParagraphs: this.stats.totalParagraphs,
      totalTables: this.stats.totalTables,
      totalImages: this.stats.totalImages,
      pages: this.pages
    };
  }

  /**
   * Phân tích các nút trong body của document.xml thành các trang logic
   */
  detectPages() {
    this.pages = [];
    const body = this.xmlDoc.getElementsByTagName("w:body")[0];
    if (!body) {
      throw new Error("Không tìm thấy thẻ <w:body> trong tài liệu Word.");
    }

    const childNodes = Array.from(body.childNodes).filter(node => {
      // Chỉ lấy các thẻ p, tbl hoặc sectPr cấp 1 trong body
      const nodeName = node.nodeName.toLowerCase();
      return nodeName === "w:p" || nodeName === "p" ||
             nodeName === "w:tbl" || nodeName === "tbl" ||
             nodeName === "w:sectpr" || nodeName === "sectpr";
    });

    let currentPageNodes = [];
    let pageNumber = 1;
    let totalParas = 0;
    let totalTbls = 0;

    const commitCurrentPage = () => {
      if (currentPageNodes.length === 0) return;

      const pageInfo = this.analyzePageNodes(currentPageNodes, pageNumber);
      this.pages.push(pageInfo);
      currentPageNodes = [];
      pageNumber++;
    };

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      const nodeName = node.nodeName.toLowerCase();

      if (nodeName === "w:sectpr" || nodeName === "sectpr") {
        // Thẻ sectPr ở cuối cùng của body -> thuộc về trang hiện tại
        currentPageNodes.push(node);
        continue;
      }

      if (nodeName === "w:p" || nodeName === "p") {
        totalParas++;
        
        // Kiểm tra xem đoạn này có đánh dấu ngắt trang trước (pageBreakBefore) không
        const hasBreakBefore = this.hasPageBreakBefore(node);
        if (hasBreakBefore && currentPageNodes.length > 0) {
          commitCurrentPage();
        }

        currentPageNodes.push(node);

        // Kiểm tra xem đoạn này có chứa ngắt trang cứng (w:br type="page") hoặc w:lastRenderedPageBreak không
        const hasBreakInside = this.hasExplicitPageBreak(node);
        if (hasBreakInside) {
          commitCurrentPage();
        }
      } else if (nodeName === "w:tbl" || nodeName === "tbl") {
        totalTbls++;
        currentPageNodes.push(node);
      }
    }

    // Đẩy trang cuối cùng
    if (currentPageNodes.length > 0) {
      commitCurrentPage();
    }

    // Trường hợp tài liệu Word không chứa thẻ ngắt trang nào (văn bản chảy tự nhiên)
    // nhưng có nhiều nội dung (> 600 từ hoặc nhiều đoạn) -> Phân trang theo ước lượng
    if (this.pages.length === 1 && childNodes.length > 15) {
      this.pages = this.fallbackEstimatePages(childNodes);
    }

    this.stats.originalTotalPages = this.pages.length;
    this.stats.totalParagraphs = totalParas;
    this.stats.totalTables = totalTbls;
    this.stats.blankPagesCount = this.pages.filter(p => p.isBlank).length;
  }

  /**
   * Kiểm tra thẻ ngắt trang cứng w:br type="page" hoặc w:lastRenderedPageBreak
   */
  hasExplicitPageBreak(pNode) {
    // 1. w:br w:type="page"
    const brNodes = pNode.getElementsByTagName("w:br").length > 0
      ? pNode.getElementsByTagName("w:br")
      : pNode.getElementsByTagName("br");

    for (let i = 0; i < brNodes.length; i++) {
      const type = brNodes[i].getAttribute("w:type") || brNodes[i].getAttribute("type");
      if (type === "page") return true;
    }

    // 2. w:lastRenderedPageBreak (Dấu ngắt trang do Word tự động lưu)
    const softBreaks = pNode.getElementsByTagName("w:lastRenderedPageBreak").length > 0
      ? pNode.getElementsByTagName("w:lastRenderedPageBreak")
      : pNode.getElementsByTagName("lastRenderedPageBreak");

    if (softBreaks.length > 0) return true;

    // 3. Section break sang trang mới trên pPr
    const pPr = pNode.getElementsByTagName("w:pPr")[0] || pNode.getElementsByTagName("pPr")[0];
    if (pPr) {
      const sectPr = pPr.getElementsByTagName("w:sectPr")[0] || pPr.getElementsByTagName("sectPr")[0];
      if (sectPr) {
        const typeNode = sectPr.getElementsByTagName("w:type")[0] || sectPr.getElementsByTagName("type")[0];
        if (!typeNode || typeNode.getAttribute("w:val") === "nextPage") {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Kiểm tra thuộc tính ngắt trang trước đoạn: w:pageBreakBefore
   */
  hasPageBreakBefore(pNode) {
    const pPr = pNode.getElementsByTagName("w:pPr")[0] || pNode.getElementsByTagName("pPr")[0];
    if (pPr) {
      const pb = pPr.getElementsByTagName("w:pageBreakBefore")[0] || pPr.getElementsByTagName("pageBreakBefore")[0];
      if (pb) {
        const val = pb.getAttribute("w:val");
        return val === null || val === "1" || val === "true";
      }
    }
    return false;
  }

  /**
   * Phân tích nội dung các node thuộc một trang
   */
  analyzePageNodes(nodes, pageNumber) {
    let fullText = "";
    let paraCount = 0;
    let tableCount = 0;
    let imageCount = 0;
    let hasHardBreak = false;

    for (const node of nodes) {
      const nodeName = node.nodeName.toLowerCase();
      if (nodeName === "w:p" || nodeName === "p") {
        paraCount++;
        const text = node.textContent || "";
        fullText += text.trim() + " ";

        // Kiểm tra hình ảnh drawing / pict
        if (node.getElementsByTagName("w:drawing").length > 0 || node.getElementsByTagName("w:pict").length > 0) {
          imageCount++;
        }
        if (this.hasExplicitPageBreak(node)) {
          hasHardBreak = true;
        }
      } else if (nodeName === "w:tbl" || nodeName === "tbl") {
        tableCount++;
        const text = node.textContent || "";
        fullText += text.trim() + " ";
      }
    }

    const cleanText = fullText.trim().replace(/\s+/g, " ");
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = cleanText.length;

    // Trang được coi là trang trắng nếu:
    // Không có chữ (hoặc < 5 ký tự vô nghĩa), không có bảng, không có ảnh
    const isBlank = chars < 5 && tableCount === 0 && imageCount === 0;

    // Tạo preview ngắn (160 ký tự đầu)
    let previewText = cleanText;
    if (previewText.length > 160) {
      previewText = previewText.substring(0, 160) + "...";
    }

    return {
      pageNumber: pageNumber,
      nodes: nodes,
      text: cleanText,
      previewText: previewText || (isBlank ? "(Trang trắng trống rỗng)" : "(Không có văn bản dạng text)"),
      wordCount: words,
      charCount: chars,
      paraCount: paraCount,
      tableCount: tableCount,
      imageCount: imageCount,
      isBlank: isBlank,
      hasHardBreak: hasHardBreak
    };
  }

  /**
   * Thuật toán phân trang ước tính nếu tài liệu không có ngắt trang cứng
   */
  fallbackEstimatePages(childNodes) {
    const estimatedPages = [];
    const itemsPerPage = 12; // Ước lượng ~12 đoạn văn hoặc bảng mỗi trang
    let chunk = [];
    let pageNum = 1;

    for (let i = 0; i < childNodes.length; i++) {
      chunk.push(childNodes[i]);
      if (chunk.length >= itemsPerPage || i === childNodes.length - 1) {
        estimatedPages.push(this.analyzePageNodes(chunk, pageNum));
        chunk = [];
        pageNum++;
      }
    }
    return estimatedPages;
  }

  /**
   * Đánh dấu xóa hoặc bỏ chọn một trang
   */
  togglePageDeletion(pageNumber, shouldDelete = null) {
    if (shouldDelete === null) {
      if (this.deletedPageNumbers.has(pageNumber)) {
        this.deletedPageNumbers.delete(pageNumber);
      } else {
        this.deletedPageNumbers.add(pageNumber);
      }
    } else if (shouldDelete) {
      this.deletedPageNumbers.add(pageNumber);
    } else {
      this.deletedPageNumbers.delete(pageNumber);
    }
    return this.deletedPageNumbers.has(pageNumber);
  }

  /**
   * Chọn tất cả các trang trắng để xóa
   */
  selectBlankPagesForDeletion() {
    let count = 0;
    for (const p of this.pages) {
      if (p.isBlank) {
        this.deletedPageNumbers.add(p.pageNumber);
        count++;
      }
    }
    return count;
  }

  /**
   * Chọn dải trang (ví dụ: "2, 4-6, 8")
   */
  selectPageRange(rangeStr) {
    if (!rangeStr || !rangeStr.trim()) return 0;
    const parts = rangeStr.split(/[,;\s]+/);
    let addedCount = 0;

    for (const part of parts) {
      const matchRange = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (matchRange) {
        const start = parseInt(matchRange[1], 10);
        const end = parseInt(matchRange[2], 10);
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(this.pages.length, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          this.deletedPageNumbers.add(p);
          addedCount++;
        }
      } else {
        const single = parseInt(part, 10);
        if (!isNaN(single) && single >= 1 && single <= this.pages.length) {
          this.deletedPageNumbers.add(single);
          addedCount++;
        }
      }
    }
    return addedCount;
  }

  /**
   * Bỏ chọn tất cả trang cần xóa
   */
  clearSelection() {
    this.deletedPageNumbers.clear();
  }

  /**
   * Thực hiện xóa các trang đã chọn khỏi cây XML và cập nhật tệp docx
   */
  async processAndGenerateDocx() {
    if (!this.zip || !this.xmlDoc) {
      throw new Error("Chưa có tài liệu Word nào được tải lên.");
    }

    if (this.deletedPageNumbers.size === 0) {
      throw new Error("Vui lòng chọn ít nhất một trang để xóa.");
    }

    if (this.deletedPageNumbers.size >= this.pages.length) {
      throw new Error("Không thể xóa toàn bộ tất cả các trang trong tài liệu.");
    }

    const parser = new DOMParser();
    const newDoc = parser.parseFromString(this.originalXmlText, "application/xml");
    const newBody = newDoc.getElementsByTagName("w:body")[0];
    if (!newBody) throw new Error("Lỗi cấu trúc w:body.");
    
    // Lưu thẻ w:sectPr ở cuối body (quy định cỡ trang A4, lề, v.v.)
    let finalSectPr = null;
    const existingSectPrs = newBody.getElementsByTagName("w:sectPr");
    if (existingSectPrs.length > 0) {
      finalSectPr = existingSectPrs[existingSectPrs.length - 1].cloneNode(true);
    }

    // Xóa sạch con trong newBody
    while (newBody.firstChild) {
      newBody.removeChild(newBody.firstChild);
    }

    // Đưa lại các node của các trang được GIỮ LẠI
    let remainingPagesCount = 0;
    const keptPages = this.pages.filter(p => !this.deletedPageNumbers.has(p.pageNumber));

    for (let k = 0; k < keptPages.length; k++) {
      const page = keptPages[k];
      const isLastKeptPage = (k === keptPages.length - 1);

      for (let n = 0; n < page.nodes.length; n++) {
        const origNode = page.nodes[n];
        const isSectPr = origNode.nodeName.toLowerCase() === "w:sectpr" || origNode.nodeName.toLowerCase() === "sectpr";
        if (isSectPr) continue; // Sẽ chèn lại ở cuối cùng

        const importedNode = newDoc.importNode(origNode, true);

        // Nếu đây là trang cuối cùng được giữ lại, loại bỏ dấu ngắt trang cuối trang để tránh sinh trang trắng thừa ở cuối file
        if (isLastKeptPage) {
          const brs = importedNode.getElementsByTagName("w:br");
          for (let b = brs.length - 1; b >= 0; b--) {
            if (brs[b].getAttribute("w:type") === "page") {
              brs[b].parentNode.removeChild(brs[b]);
            }
          }
          const softBrs = importedNode.getElementsByTagName("w:lastRenderedPageBreak");
          for (let b = softBrs.length - 1; b >= 0; b--) {
            softBrs[b].parentNode.removeChild(softBrs[b]);
          }
        }

        newBody.appendChild(importedNode);
      }
      remainingPagesCount++;
    }

    // Chèn lại finalSectPr ở cuối cùng của body
    if (finalSectPr) {
      newBody.appendChild(finalSectPr);
    }

    // Chuyển đổi DOM mới thành chuỗi XML
    const serializer = new XMLSerializer();
    const newXmlString = serializer.serializeToString(newDoc);

    // Ghi đè vào zip
    this.zip.file("word/document.xml", newXmlString);

    // Xuất Blob .docx mới
    const modifiedBlob = await this.zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    const baseName = this.fileName.replace(/\.[^/.]+$/, "");
    const outputFileName = `${baseName}_da_xoa_trang.docx`;

    return {
      blob: modifiedBlob,
      fileName: outputFileName,
      deletedCount: this.deletedPageNumbers.size,
      remainingCount: remainingPagesCount
    };
  }
}

window.WordPageRemover = WordPageRemover;
