/**
 * tool-pdf-to-image.js
 * Advanced Client-side PDF to High-Resolution Image Exporter for CMS Web Publishing.
 * Features:
 * 1. Tải và giải mã file PDF trực tiếp 100% trên trình duyệt bằng Mozilla PDF.js.
 * 2. Xuất từng trang hoặc hàng loạt trang đã chọn cùng lúc sang PNG, JPG, WebP.
 * 3. Tùy chỉnh độ phân giải: 1.0x (Web standard), 1.5x (HD), 2.0x (300 DPI Ultra Sharp), 3.0x (4K).
 * 4. Đóng gói tải về trọn bộ file ZIP bằng JSZip.
 * 5. Tải nhanh từng ảnh riêng lẻ, sao chép ảnh vào Clipboard, hoặc sao chép mã HTML thẻ <img>.
 * 6. Lightbox xem trước ảnh kích thước lớn toàn màn hình.
 */

class PdfToImageConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      scale: 2.0, // 2.0x = 300 DPI siêu sắc nét cho in ấn và đăng web
      format: "image/png", // "image/png" | "image/jpeg" | "image/webp"
      quality: 0.92, // 0.8 - 1.0 cho JPEG/WebP
      filenamePrefix: "Trang"
    }, options);

    this.pdfDoc = null;
    this.pdfBytes = null;
    this.pdfFileName = "";
    this.totalPages = 0;
    this.selectedPages = new Set(); // Set of 1-based page numbers
    this.renderedPages = new Map(); // pageNum -> { canvas, dataUrl, blob, width, height }
    this.isRendering = false;
  }

  setOptions(newOptions) {
    this.options = Object.assign(this.options, newOptions);
  }

  /**
   * Tải và nạp tài liệu PDF
   */
  async loadPdf(fileData, fileName = "document.pdf") {
    if (!window.pdfjsLib) {
      throw new Error("Thư viện PDF.js chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng và tải lại trang.");
    }

    this.pdfFileName = fileName.replace(/\.[^/.]+$/, "");
    this.renderedPages.clear();
    this.selectedPages.clear();

    let arrayBuffer = fileData;
    if (fileData instanceof Blob) {
      arrayBuffer = await fileData.arrayBuffer();
    }
    this.pdfBytes = arrayBuffer;

    const loadingTask = window.pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
      cMapPacked: true
    });

    this.pdfDoc = await loadingTask.promise;
    this.totalPages = this.pdfDoc.numPages;

    // Mặc định chọn tất cả các trang
    for (let i = 1; i <= this.totalPages; i++) {
      this.selectedPages.add(i);
    }

    return {
      totalPages: this.totalPages,
      fileName: this.pdfFileName
    };
  }

  /**
   * Render một trang PDF ra Canvas chất lượng cao
   */
  async renderPageToCanvas(pageNum, scale = this.options.scale) {
    if (!this.pdfDoc) throw new Error("Chưa có tài liệu PDF nào được tải.");
    if (pageNum < 1 || pageNum > this.totalPages) throw new Error(`Trang ${pageNum} không tồn tại.`);

    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background (tránh nền trong suốt khi xuất JPG)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    const format = this.options.format;
    const quality = this.options.quality;
    const dataUrl = canvas.toDataURL(format, quality);

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), format, quality);
    });

    const pageData = {
      pageNum,
      canvas,
      dataUrl,
      blob,
      width: viewport.width,
      height: viewport.height
    };

    this.renderedPages.set(pageNum, pageData);
    return pageData;
  }

  /**
   * Chọn / bỏ chọn trang
   */
  togglePageSelection(pageNum, isSelected) {
    if (isSelected) {
      this.selectedPages.add(pageNum);
    } else {
      this.selectedPages.delete(pageNum);
    }
  }

  selectAllPages() {
    this.selectedPages.clear();
    for (let i = 1; i <= this.totalPages; i++) {
      this.selectedPages.add(i);
    }
  }

  deselectAllPages() {
    this.selectedPages.clear();
  }

  selectOddPages() {
    this.selectedPages.clear();
    for (let i = 1; i <= this.totalPages; i += 2) {
      this.selectedPages.add(i);
    }
  }

  selectEvenPages() {
    this.selectedPages.clear();
    for (let i = 2; i <= this.totalPages; i += 2) {
      this.selectedPages.add(i);
    }
  }

  /**
   * Chọn trang theo biểu thức chuỗi (vd: "1-3, 5, 8-10")
   */
  selectByRangeString(rangeStr) {
    this.selectedPages.clear();
    if (!rangeStr || !rangeStr.trim()) return;

    const parts = rangeStr.split(/[,;\s]+/);
    for (const part of parts) {
      if (!part) continue;
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(this.totalPages, Math.max(start, end));
          for (let p = min; p <= max; p++) {
            this.selectedPages.add(p);
          }
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= this.totalPages) {
          this.selectedPages.add(p);
        }
      }
    }
  }

  /**
   * Lấy đuôi mở rộng file (.png, .jpg, .webp)
   */
  getFileExtension() {
    if (this.options.format === "image/jpeg") return "jpg";
    if (this.options.format === "image/webp") return "webp";
    return "png";
  }

  /**
   * Lấy tên file xuất cho 1 trang cụ thể
   */
  getPageFileName(pageNum) {
    const ext = this.getFileExtension();
    const prefix = this.options.filenamePrefix || this.pdfFileName || "Trang";
    const padNum = String(pageNum).padStart(String(this.totalPages).length > 1 ? 2 : 1, "0");
    return `${prefix}_Trang_${padNum}.${ext}`;
  }

  /**
   * Xuất và tải về toàn bộ các trang đã chọn thành file ZIP
   */
  async exportSelectedPagesAsZip(onProgress = null) {
    if (!window.JSZip) {
      throw new Error("Thư viện JSZip chưa sẵn sàng.");
    }

    const pagesToExport = Array.from(this.selectedPages).sort((a, b) => a - b);
    if (pagesToExport.length === 0) {
      throw new Error("Vui lòng chọn ít nhất một trang để xuất ảnh.");
    }

    const zip = new JSZip();
    const folderName = `${this.pdfFileName}_Images`;
    const folder = zip.folder(folderName);

    for (let i = 0; i < pagesToExport.length; i++) {
      const pageNum = pagesToExport[i];
      if (onProgress) {
        onProgress(i + 1, pagesToExport.length, `Đang xử lý trang ${pageNum}/${this.totalPages}...`);
      }

      let pageData = this.renderedPages.get(pageNum);
      // Nếu chưa render ở độ phân giải hiện tại thì render
      if (!pageData || pageData.blob == null) {
        pageData = await this.renderPageToCanvas(pageNum);
      }

      const fileName = this.getPageFileName(pageNum);
      folder.file(fileName, pageData.blob);
    }

    if (onProgress) {
      onProgress(pagesToExport.length, pagesToExport.length, "Đang nén tệp ZIP...");
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    const zipFileName = `${this.pdfFileName}_Tat_ca_trang_anh.zip`;
    this.triggerDownload(zipBlob, zipFileName);

    return {
      count: pagesToExport.length,
      zipFileName
    };
  }

  /**
   * Tải từng trang riêng lẻ
   */
  async downloadSinglePage(pageNum) {
    let pageData = this.renderedPages.get(pageNum);
    if (!pageData || !pageData.blob) {
      pageData = await this.renderPageToCanvas(pageNum);
    }

    const fileName = this.getPageFileName(pageNum);
    this.triggerDownload(pageData.blob, fileName);
  }

  /**
   * Sao chép ảnh trang vào Clipboard
   */
  async copyPageImageToClipboard(pageNum) {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error("Trình duyệt không hỗ trợ sao chép hình ảnh trực tiếp vào Clipboard.");
    }

    let pageData = this.renderedPages.get(pageNum);
    if (!pageData || !pageData.canvas) {
      pageData = await this.renderPageToCanvas(pageNum);
    }

    // Clipboard API yêu cầu định dạng image/png
    const pngBlob = await new Promise((resolve) => {
      pageData.canvas.toBlob((b) => resolve(b), "image/png", 1.0);
    });

    const item = new ClipboardItem({ "image/png": pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  }

  /**
   * Sinh chuỗi mã HTML thẻ <img> chuẩn đăng bài website CMS
   */
  generateHtmlImageTags() {
    const pagesToExport = Array.from(this.selectedPages).sort((a, b) => a - b);
    if (pagesToExport.length === 0) return "";

    const htmlBlocks = [];
    for (const pageNum of pagesToExport) {
      const pageData = this.renderedPages.get(pageNum);
      const src = pageData ? pageData.dataUrl : "";
      const alt = `${this.pdfFileName} - Trang ${pageNum}`;

      const block = `<div style="overflow-x: auto; margin: 18px 0px; text-align: center;"><img alt="${alt}" src="${src}" style="width: 100%; max-width: 850px; height: auto;" /><br />\n<span style="font-family: times new roman, times, serif; font-size: 16px;"><em>Hình: ${alt}</em></span></div>`;
      htmlBlocks.push(block);
    }

    return htmlBlocks.join("\n\n");
  }

  /**
   * Hỗ trợ tải file về máy
   */
  triggerDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

window.PdfToImageConverter = PdfToImageConverter;
