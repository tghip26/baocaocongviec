/**
 * tool-image-optimizer.js
 * Batch Web Image Optimizer & WebP Converter for Hospital CMS
 * Nén ảnh hàng loạt, đổi định dạng WebP, chuẩn hóa kích thước bài viết & tải ZIP.
 */

class ToolImageOptimizer {
  constructor() {
    this.filesList = []; // { id, file, originalSize, optimizedBlob, optimizedSize, width, height, status }
    this.quality = 0.82;
    this.format = "image/webp";
    this.resizeMode = "article_1200"; // original, article_1200, banner_1920, thumb_600, custom
    this.customWidth = 1200;
  }

  addFiles(files) {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"];
    const added = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (validTypes.includes(file.type) || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(file.name)) {
        const item = {
          id: "img_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
          file: file,
          name: file.name,
          originalSize: file.size,
          optimizedBlob: null,
          optimizedSize: 0,
          width: 0,
          height: 0,
          status: "pending" // pending, processing, done, error
        };
        this.filesList.push(item);
        added.push(item);
      }
    }
    return added;
  }

  removeFile(id) {
    this.filesList = this.filesList.filter(f => f.id !== id);
  }

  clearFiles() {
    this.filesList = [];
  }

  /**
   * Xử lý tối ưu một file ảnh bằng HTML5 Canvas Client-side
   */
  async processImage(item) {
    item.status = "processing";
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(item.file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let origWidth = img.naturalWidth || img.width;
        let origHeight = img.naturalHeight || img.height;

        let targetWidth = origWidth;
        let targetHeight = origHeight;

        // Tính toán kích thước theo chế độ
        if (this.resizeMode === "article_1200" && origWidth > 1200) {
          targetWidth = 1200;
          targetHeight = Math.round((origHeight * 1200) / origWidth);
        } else if (this.resizeMode === "banner_1920" && origWidth > 1920) {
          targetWidth = 1920;
          targetHeight = Math.round((origHeight * 1920) / origWidth);
        } else if (this.resizeMode === "thumb_600" && origWidth > 600) {
          targetWidth = 600;
          targetHeight = Math.round((origHeight * 600) / origWidth);
        } else if (this.resizeMode === "custom" && this.customWidth && origWidth > this.customWidth) {
          targetWidth = this.customWidth;
          targetHeight = Math.round((origHeight * this.customWidth) / origWidth);
        }

        item.width = targetWidth;
        item.height = targetHeight;

        // Vẽ lên canvas với thuật toán làm nét
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              item.optimizedBlob = blob;
              item.optimizedSize = blob.size;
              item.status = "done";
            } else {
              item.status = "error";
            }
            resolve(item);
          },
          this.format,
          this.quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        item.status = "error";
        resolve(item);
      };

      img.src = objectUrl;
    });
  }

  /**
   * Xử lý tối ưu toàn bộ danh sách ảnh
   */
  async processAll(progressCallback = null) {
    const total = this.filesList.length;
    for (let i = 0; i < total; i++) {
      await this.processImage(this.filesList[i]);
      if (progressCallback) {
        progressCallback(i + 1, total, this.filesList[i]);
      }
    }
    return this.filesList;
  }

  /**
   * Đóng gói toàn bộ ảnh đã tối ưu thành file ZIP
   */
  async exportAsZip(zipFileName = "Anh_Website_Toi_Uu.zip") {
    if (!window.JSZip) {
      throw new Error("Thư viện JSZip chưa sẵn sàng.");
    }

    const zip = new JSZip();
    const folder = zip.folder("images_optimized");

    let count = 0;
    for (const item of this.filesList) {
      if (item.optimizedBlob) {
        const ext = this.format === "image/webp" ? ".webp" : (this.format === "image/jpeg" ? ".jpg" : ".png");
        const baseName = item.name.replace(/\.[^/.]+$/, "");
        const finalName = `${baseName}_optimized${ext}`;
        folder.file(finalName, item.optimizedBlob);
        count++;
      }
    }

    if (count === 0) {
      throw new Error("Chưa có ảnh nào được tối ưu thành công để tải về.");
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    return count;
  }

  formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }
}

window.ToolImageOptimizer = ToolImageOptimizer;
