/**
 * tool-pdf-to-image.js
 * Advanced Client-side PDF to High-Resolution Image Exporter for CMS Web Publishing.
 * Features:
 * 1. Tải và giải mã file PDF trực tiếp 100% trên trình duyệt bằng Mozilla PDF.js.
 * 2. Xuất ảnh từng trang hoặc hàng loạt trang sang PNG, JPG, WebP với độ phân giải lên đến 600 DPI (1.0x - 4.0x).
 * 3. Bộ lọc xử lý ảnh & Tăng cường văn bản scan: Nâng cao độ tương phản (Enhance), Trắng đen (B&W), Màu xám (Grayscale).
 * 4. Xoay ảnh thông minh (Rotate 90°, 180°, 270°) cho từng trang hoặc toàn bộ file.
 * 5. Ghép các trang đã chọn thành 1 ảnh dài duy nhất (Long Image / Infographic).
 * 6. Đóng gói tải về trọn bộ file ZIP bằng JSZip, tải lẻ, copy vào Clipboard, hoặc sinh mã HTML CMS.
 * 7. Lightbox xem trước ảnh toàn màn hình có zoom và điều hướng mượt mà.
 */

class PdfToImageConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      scale: 2.0, // 1.0 (96 DPI) | 1.5 (150 DPI) | 2.0 (300 DPI) | 3.0 (450 DPI) | 4.0 (600 DPI)
      format: "image/png", // "image/png" | "image/jpeg" | "image/webp"
      quality: 0.92, // 0.8 - 1.0 cho JPEG/WebP
      filenamePrefix: "Trang",
      imageFilter: "none" // "none" | "enhance" | "bw" | "grayscale"
    }, options);

    this.pdfDoc = null;
    this.pdfBytes = null;
    this.pdfFileName = "";
    this.totalPages = 0;
    this.selectedPages = new Set(); // Set of 1-based page numbers
    this.pageRotations = new Map(); // pageNum -> degrees (0, 90, 180, 270)
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
    this.pageRotations.clear();

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

    // Mặc định chọn tất cả các trang và góc xoay 0
    for (let i = 1; i <= this.totalPages; i++) {
      this.selectedPages.add(i);
      this.pageRotations.set(i, 0);
    }

    return {
      totalPages: this.totalPages,
      fileName: this.pdfFileName
    };
  }

  /**
   * Render một trang PDF ra Canvas chất lượng cao kèm bộ lọc & góc xoay
   */
  async renderPageToCanvas(pageNum, scale = this.options.scale, forceRerender = false) {
    if (!this.pdfDoc) throw new Error("Chưa có tài liệu PDF nào được tải.");
    if (pageNum < 1 || pageNum > this.totalPages) throw new Error(`Trang ${pageNum} không tồn tại.`);

    const existing = this.renderedPages.get(pageNum);
    if (existing && !forceRerender && existing.scale === scale && existing.filter === this.options.imageFilter) {
      return existing;
    }

    const page = await this.pdfDoc.getPage(pageNum);
    const rotation = (page.rotate + (this.pageRotations.get(pageNum) || 0)) % 360;
    const viewport = page.getViewport({ scale, rotation });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Nền trắng tinh khiết
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // Áp dụng bộ lọc xử lý ảnh nếu được chọn
    if (this.options.imageFilter && this.options.imageFilter !== "none") {
      this.applyCanvasFilter(canvas, ctx, this.options.imageFilter);
    }

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
      height: viewport.height,
      scale,
      filter: this.options.imageFilter,
      rotation
    };

    this.renderedPages.set(pageNum, pageData);
    return pageData;
  }

  /**
   * Áp dụng bộ lọc xử lý ảnh tài liệu (Tăng tương phản, Trắng đen, Grayscale)
   */
  applyCanvasFilter(canvas, ctx, filterType) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    if (filterType === "grayscale") {
      for (let i = 0; i < len; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
    } else if (filterType === "enhance") {
      // Auto Document Enhancer: Làm trắng nền, làm đậm chữ đen
      for (let i = 0; i < len; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Tăng contrast & làm sạch nền xám
        if (gray > 200) {
          gray = 255;
        } else if (gray < 120) {
          gray = Math.max(0, gray * 0.7);
        } else {
          gray = ((gray - 120) / 80) * 255;
        }
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
    } else if (filterType === "medical_scan") {
      // Bộ lọc Tài liệu Y Tế: Khử ố vàng giấy scan, làm trắng sạch nền 100%, nét mực đen đậm rõ nét
      for (let i = 0; i < len; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (gray > 185) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else if (gray < 90) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        } else {
          const norm = (gray - 90) / 95;
          const v = Math.round(Math.pow(norm, 1.35) * 255);
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        }
      }
    } else if (filterType === "invert") {
      // Đảo màu phim X-Quang / CT / MRI / Dark Mode
      for (let i = 0; i < len; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Xoay một trang 90 độ
   */
  rotatePage(pageNum, degrees = 90) {
    const current = this.pageRotations.get(pageNum) || 0;
    const next = (current + degrees) % 360;
    this.pageRotations.set(pageNum, next);
    this.renderedPages.delete(pageNum); // Xóa cache render cũ
    return next;
  }

  /**
   * Xoay tất cả các trang
   */
  rotateAllPages(degrees = 90) {
    for (let p = 1; p <= this.totalPages; p++) {
      this.rotatePage(p, degrees);
    }
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

  invertSelection() {
    const newSet = new Set();
    for (let i = 1; i <= this.totalPages; i++) {
      if (!this.selectedPages.has(i)) {
        newSet.add(i);
      }
    }
    this.selectedPages = newSet;
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

  getFileExtension() {
    if (this.options.format === "image/jpeg") return "jpg";
    if (this.options.format === "image/webp") return "webp";
    return "png";
  }

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
        onProgress(i + 1, pagesToExport.length, `Đang nén ảnh trang ${pageNum}/${this.totalPages}...`);
      }
      await new Promise(r => setTimeout(r, 16));

      let pageData = this.renderedPages.get(pageNum);
      if (!pageData || pageData.blob == null) {
        pageData = await this.renderPageToCanvas(pageNum, this.options.scale, true);
      }

      const fileName = this.getPageFileName(pageNum);
      folder.file(fileName, pageData.blob);
    }

    if (onProgress) onProgress(pagesToExport.length, pagesToExport.length, "Đang đóng gói file ZIP hoàn chỉnh...");
    await new Promise(r => setTimeout(r, 30));

    const content = await zip.generateAsync(
      { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
      (metadata) => {
        if (onProgress) {
          const pct = Math.round(metadata.percent);
          onProgress(pagesToExport.length, pagesToExport.length, `Đang tạo tệp nén: ${pct}%...`);
        }
      }
    );

    const zipFileName = `${this.pdfFileName}_Export_${pagesToExport.length}_Trang.zip`;
    this.triggerDownload(content, zipFileName);
    return zipFileName;
  }

  /**
   * Ghép tất cả các trang đã chọn thành một bức ảnh dài dọc duy nhất
  /**
   * Trích xuất nội dung văn bản (Text Layer) từ một trang PDF
   */
  async extractPageText(pageNum) {
    if (!this.pdfDoc) throw new Error("Chưa có tài liệu PDF nào được nạp.");
    if (pageNum < 1 || pageNum > this.totalPages) throw new Error(`Trang ${pageNum} không tồn tại.`);

    const page = await this.pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    if (!textContent || !textContent.items || textContent.items.length === 0) {
      return "";
    }

    // Sắp xếp items theo tọa độ: từ trên xuống dưới (Y giảm dần), từ trái sang phải (X tăng dần)
    const items = textContent.items.slice().sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    let lastY = undefined;
    let text = "";

    for (const item of items) {
      if (!item.str) continue;
      const curY = item.transform[5];

      if (lastY !== undefined) {
        const diff = Math.abs(curY - lastY);
        if (diff > 16) {
          // Khoảng cách Y lớn -> Ngắt đoạn văn mới
          text += "\n\n";
        } else if (diff > 5) {
          // Xuống dòng thông thường
          text += "\n";
        } else if (text.length > 0 && !text.endsWith("\n") && !text.endsWith(" ")) {
          text += " ";
        }
      }
      text += item.str;
      lastY = curY;
    }
    return text.trim();
  }

  /**
   * Trích xuất văn bản toàn bộ các trang đã chọn
   */
  async extractAllPagesText(onProgress = null) {
    if (!this.pdfDoc) throw new Error("Chưa có tài liệu PDF nào được nạp.");
    const pages = Array.from(this.selectedPages).sort((a, b) => a - b);
    if (pages.length === 0) throw new Error("Vui lòng chọn ít nhất một trang.");

    const results = [];
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      if (onProgress) onProgress(i + 1, pages.length, `Đang đọc văn bản trang ${p}/${this.totalPages}...`);
      const text = await this.extractPageText(p);
      results.push(`=== [TRANG ${p} / ${this.totalPages}] ===\n${text}`);
    }
    return results.join("\n\n");
  }

  /**
   * Lưu trực tiếp từng trang ảnh vào một thư mục trên máy tính qua File System Access API
   */
  async saveSelectedPagesToDirectory(dirHandle, onProgress = null) {
    const pagesToExport = Array.from(this.selectedPages).sort((a, b) => a - b);
    if (pagesToExport.length === 0) throw new Error("Chưa chọn trang nào để lưu.");

    let savedCount = 0;
    for (let i = 0; i < pagesToExport.length; i++) {
      const p = pagesToExport[i];
      if (onProgress) onProgress(i + 1, pagesToExport.length, `Đang ghi tệp ảnh trang ${p}...`);

      let pageData = this.renderedPages.get(p);
      if (!pageData || !pageData.blob) {
        pageData = await this.renderPageToCanvas(p, this.options.scale, true);
      }

      const fileName = this.getPageFileName(p);
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(pageData.blob);
      await writable.close();
      savedCount++;
    }
    return savedCount;
  }

  /**
   * Ghép tất cả các trang đã chọn thành một bức ảnh dài dọc (Long Image / Infographic)
   */
  async mergeSelectedPagesToLongImage(customOptions = {}, onProgress = null) {
    const pagesToExport = Array.from(this.selectedPages).sort((a, b) => a - b);
    if (pagesToExport.length === 0) {
      throw new Error("Vui lòng chọn ít nhất một trang để ghép ảnh dài.");
    }

    const spacing = customOptions.spacing !== undefined ? customOptions.spacing : 12; // px giữa các trang
    const showPageBadge = customOptions.showPageBadge !== false; // hiển thị số trang
    const maxConstraintWidth = customOptions.maxWidth || 0; // 0 = giữ nguyên

    let maxWidth = 0;
    let totalHeight = 0;
    const renderedList = [];

    for (let i = 0; i < pagesToExport.length; i++) {
      const p = pagesToExport[i];
      if (onProgress) onProgress(i + 1, pagesToExport.length, `Đang kết xuất trang ${p}/${pagesToExport.length}...`);
      await new Promise(r => setTimeout(r, 16));

      let pageData = this.renderedPages.get(p);
      if (!pageData || !pageData.canvas) {
        pageData = await this.renderPageToCanvas(p, this.options.scale, true);
      }
      renderedList.push({ ...pageData, pageNum: p });
      maxWidth = Math.max(maxWidth, pageData.canvas.width);
      totalHeight += pageData.canvas.height;
    }

    // Thêm khoảng cách giữa các trang
    totalHeight += (renderedList.length - 1) * spacing;

    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = maxWidth;
    mergedCanvas.height = totalHeight;
    const ctx = mergedCanvas.getContext("2d", { alpha: false });

    // Nền trắng tinh khiết
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, maxWidth, totalHeight);

    let currentY = 0;
    for (let i = 0; i < renderedList.length; i++) {
      const pData = renderedList[i];
      const xOffset = Math.round((maxWidth - pData.canvas.width) / 2);
      ctx.drawImage(pData.canvas, xOffset, currentY);

      // Vẽ vạch ngăn cách & số trang nếu có khoảng cách
      if (spacing > 0 && i < renderedList.length - 1) {
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(0, currentY + pData.canvas.height, maxWidth, spacing);
      }

      // Nhãn số trang tinh tế ở góc
      if (showPageBadge) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
        ctx.fillRect(xOffset + 12, currentY + 12, 90, 26);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`Trang ${pData.pageNum}`, xOffset + 24, currentY + 29);
      }

      currentY += pData.canvas.height + spacing;
    }

    // Scale canvas nếu có ràng buộc chiều rộng
    let outputCanvas = mergedCanvas;
    if (maxConstraintWidth > 0 && maxWidth > maxConstraintWidth) {
      const scaleDown = maxConstraintWidth / maxWidth;
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = maxConstraintWidth;
      scaledCanvas.height = Math.round(totalHeight * scaleDown);
      const sCtx = scaledCanvas.getContext("2d", { alpha: false });
      sCtx.drawImage(mergedCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      outputCanvas = scaledCanvas;
    }

    const ext = this.getFileExtension();
    const mime = this.options.format;
    const blob = await new Promise(r => outputCanvas.toBlob(r, mime, this.options.quality));
    const mergedFileName = `${this.pdfFileName}_Ghep_dai_${pagesToExport.length}_trang.${ext}`;

    this.triggerDownload(blob, mergedFileName);
    return {
      width: outputCanvas.width,
      height: outputCanvas.height,
      fileName: mergedFileName
    };
  }

  /**
   * Tải từng trang riêng lẻ
   */
  async downloadSinglePage(pageNum) {
    let pageData = this.renderedPages.get(pageNum);
    if (!pageData || !pageData.blob) {
      pageData = await this.renderPageToCanvas(pageNum, this.options.scale, true);
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
      pageData = await this.renderPageToCanvas(pageNum, this.options.scale, true);
    }

    const pngBlob = await new Promise((resolve) => {
      pageData.canvas.toBlob((b) => resolve(b), "image/png", 1.0);
    });

    const item = new ClipboardItem({ "image/png": pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  }

  /**
   * Sinh chuỗi mã HTML chuẩn đăng bài website CMS (Hỗ trợ ảnh đơn hoặc cặp ảnh 2 cột)
   */
  generateHtmlImageTags(mode = "pairs") {
    const pagesToExport = Array.from(this.selectedPages).sort((a, b) => a - b);
    if (pagesToExport.length === 0) return "";

    const htmlBlocks = [];

    if (mode === "pairs" && pagesToExport.length >= 2) {
      let pairCount = 0;
      for (let i = 0; i < pagesToExport.length; i += 2) {
        if (i + 1 < pagesToExport.length) {
          pairCount++;
          const p1 = pagesToExport[i];
          const p2 = pagesToExport[i + 1];
          const d1 = this.renderedPages.get(p1);
          const d2 = this.renderedPages.get(p2);
          const src1 = d1 ? d1.dataUrl : "";
          const src2 = d2 ? d2.dataUrl : "";
          const alt1 = `${this.pdfFileName} - Trang ${p1}`;
          const alt2 = `${this.pdfFileName} - Trang ${p2}`;

          htmlBlocks.push(`<!-- Cặp ảnh ${pairCount} -->
<table style="width: 100%; border-collapse: collapse; border: none; margin-top: 15px; margin-bottom: 15px;">
\t<tbody>
\t\t<tr>
\t\t\t<td style="width: 50%; text-align: center; vertical-align: top; padding: 5px; border: none;"><img alt="${alt1}" src="${src1}" style="width: 100%; max-width: 420px; height: auto;" /></td>
\t\t\t<td style="width: 50%; text-align: center; vertical-align: top; padding: 5px; border: none;"><img alt="${alt2}" src="${src2}" style="width: 100%; max-width: 420px; height: auto;" /></td>
\t\t</tr>
\t</tbody>
</table>`);
        } else {
          const p = pagesToExport[i];
          const d = this.renderedPages.get(p);
          const src = d ? d.dataUrl : "";
          const alt = `${this.pdfFileName} - Trang ${p}`;
          htmlBlocks.push(`<!-- Ảnh đơn -->
<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;"><img alt="${alt}" src="${src}" style="max-width: 650px; width: 100%; height: auto;" /></div>`);
        }
      }
    } else {
      for (const pageNum of pagesToExport) {
        const pageData = this.renderedPages.get(pageNum);
        const src = pageData ? pageData.dataUrl : "";
        const alt = `${this.pdfFileName} - Trang ${pageNum}`;

        htmlBlocks.push(`<!-- Ảnh trang ${pageNum} -->
<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;"><img alt="${alt}" src="${src}" style="max-width: 850px; width: 100%; height: auto;" /></div>`);
      }
    }

    return htmlBlocks.join("\n\n");
  }

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
