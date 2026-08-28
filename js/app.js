/**
 * app.js
 * Master Application Controller for Multi-tool Portal
 * Single Page Application (SPA) architecture, dynamic tool router, event handlers.
 */

class AppController {
  constructor() {
    this.currentToolId = null;
    this.currentCategory = "all";
    this.selectedFiles = {
      primary: [], // Single Excel or Multi Word
      secondary: [] // SSO Excel files if applicable
    };
    this.isProcessing = false;
    this.lastResult = null;

    this.initElements();
    this.initEvents();
    this.renderToolGrid();
    this.handleUrlHash();
  }

  initElements() {
    // Navigation & Views
    this.sidebar = document.getElementById("sidebar");
    this.sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
    this.sidebarNav = document.getElementById("sidebarNav");
    this.hubView = document.getElementById("hubView");
    this.toolView = document.getElementById("toolView");
    this.categoryFilter = document.getElementById("categoryFilter");
    this.toolCardsContainer = document.getElementById("toolCardsContainer");
    this.globalSearchInput = document.getElementById("globalSearchInput");

    // Tool View Elements
    this.btnBackToHub = document.getElementById("btnBackToHub");
    this.toolBreadcrumb = document.getElementById("toolBreadcrumb");
    this.toolHeaderTitle = document.getElementById("toolHeaderTitle");
    this.toolHeaderSubtitle = document.getElementById("toolHeaderSubtitle");
    this.toolBadge = document.getElementById("toolBadge");
    this.toolGuideList = document.getElementById("toolGuideList");
    this.toolOutputInfo = document.getElementById("toolOutputInfo");

    // Upload & Action Elements
    this.uploadSection = document.getElementById("uploadSection");
    this.dropzonePrimary = document.getElementById("dropzonePrimary");
    this.fileInputPrimary = document.getElementById("fileInputPrimary");
    this.dropzonePrimaryTitle = document.getElementById("dropzonePrimaryTitle");
    this.dropzonePrimaryDesc = document.getElementById("dropzonePrimaryDesc");
    this.fileListPrimary = document.getElementById("fileListPrimary");

    this.secondaryUploadGroup = document.getElementById("secondaryUploadGroup");
    this.dropzoneSecondary = document.getElementById("dropzoneSecondary");
    this.fileInputSecondary = document.getElementById("fileInputSecondary");
    this.fileListSecondary = document.getElementById("fileListSecondary");

    this.progressBarContainer = document.getElementById("progressBarContainer");
    this.progressBar = document.getElementById("progressBar");
    this.progressLabel = document.getElementById("progressLabel");

    this.btnRunAction = document.getElementById("btnRunAction");
    this.btnRunActionText = document.getElementById("btnRunActionText");
    this.btnDownloadResult = document.getElementById("btnDownloadResult");
    this.btnResetTool = document.getElementById("btnResetTool");

    this.logConsole = document.getElementById("logConsole");
    this.previewSection = document.getElementById("previewSection");
    this.previewSummary = document.getElementById("previewSummary");
    this.previewTableHead = document.getElementById("previewTableHead");
    this.previewTableBody = document.getElementById("previewTableBody");

    // Modals
    this.modalDayRange = document.getElementById("modalDayRange");
    this.dayModalInfo = document.getElementById("dayModalInfo");
    this.radioDay0114 = document.getElementById("radioDay0114");
    this.radioDay1531 = document.getElementById("radioDay1531");
    this.btnConfirmDayRange = document.getElementById("btnConfirmDayRange");
    this.btnCloseDayModal = document.getElementById("btnCloseDayModal");

    this.modalSheetSelect = document.getElementById("modalSheetSelect");
    this.sheetDropdown = document.getElementById("sheetDropdown");
    this.btnConfirmSheet = document.getElementById("btnConfirmSheet");
    this.btnCloseSheetModal = document.getElementById("btnCloseSheetModal");

    // Toast Container
    this.toastContainer = document.getElementById("toastContainer");
  }

  initEvents() {
    // Hash change for SPA routing
    window.addEventListener("hashchange", () => this.handleUrlHash());

    // Sidebar toggle (mobile / responsive)
    if (this.sidebarToggleBtn) {
      this.sidebarToggleBtn.addEventListener("click", () => {
        this.sidebar.classList.toggle("open");
      });
    }

    // Back to Hub
    if (this.btnBackToHub) {
      this.btnBackToHub.addEventListener("click", () => {
        window.location.hash = "";
      });
    }

    // Search input
    if (this.globalSearchInput) {
      this.globalSearchInput.addEventListener("input", (e) => {
        this.renderToolGrid(e.target.value);
      });
    }

    // Category filter clicks
    if (this.categoryFilter) {
      this.categoryFilter.addEventListener("click", (e) => {
        const btn = e.target.closest(".cat-btn");
        if (btn) {
          const catId = btn.dataset.cat;
          this.currentCategory = catId;
          this.categoryFilter.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          this.renderToolGrid(this.globalSearchInput ? this.globalSearchInput.value : "");
        }
      });
    }

    // Primary Dropzone
    this.setupDropzone(this.dropzonePrimary, this.fileInputPrimary, (files) => {
      this.handlePrimaryFiles(files);
    });

    // Secondary Dropzone (SSO)
    this.setupDropzone(this.dropzoneSecondary, this.fileInputSecondary, (files) => {
      this.handleSecondaryFiles(files);
    });

    // Action button
    if (this.btnRunAction) {
      this.btnRunAction.addEventListener("click", () => this.executeCurrentTool());
    }

    // Download button
    if (this.btnDownloadResult) {
      this.btnDownloadResult.addEventListener("click", () => this.downloadLastResult());
    }

    // Reset button
    if (this.btnResetTool) {
      this.btnResetTool.addEventListener("click", () => this.resetToolState());
    }

    // Modal Events
    if (this.btnCloseDayModal) {
      this.btnCloseDayModal.addEventListener("click", () => this.hideModal(this.modalDayRange));
    }
    if (this.btnCloseSheetModal) {
      this.btnCloseSheetModal.addEventListener("click", () => this.hideModal(this.modalSheetSelect));
    }
  }

  setupDropzone(zone, input, onFilesSelected) {
    if (!zone || !input) return;

    zone.addEventListener("click", () => input.click());

    input.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(Array.from(e.target.files));
      }
    });

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(Array.from(e.dataTransfer.files));
      }
    });
  }

  handlePrimaryFiles(files) {
    const tool = window.getToolById(this.currentToolId);
    if (!tool) return;

    if (tool.inputType === "single-excel") {
      // Allow only single file
      this.selectedFiles.primary = [files[0]];
    } else {
      // Append word files avoiding duplicates
      const newFiles = files.filter(f => !this.selectedFiles.primary.some(ex => ex.name === f.name && ex.size === f.size));
      this.selectedFiles.primary.push(...newFiles);
    }

    this.renderFileListPrimary();
    this.updateRunButtonState();
  }

  handleSecondaryFiles(files) {
    const newFiles = files.filter(f => !this.selectedFiles.secondary.some(ex => ex.name === f.name && ex.size === f.size));
    this.selectedFiles.secondary.push(...newFiles);
    this.renderFileListSecondary();
    this.updateRunButtonState();
  }

  renderFileListPrimary() {
    this.fileListPrimary.innerHTML = "";
    if (this.selectedFiles.primary.length === 0) {
      this.fileListPrimary.classList.add("hidden");
      return;
    }
    this.fileListPrimary.classList.remove("hidden");

    this.selectedFiles.primary.forEach((f, idx) => {
      const item = document.createElement("div");
      item.className = "file-item";
      item.innerHTML = `
        <div class="file-item-left">
          <span class="file-icon">📄</span>
          <span class="file-name" title="${f.name}">${f.name}</span>
          <span class="file-size">${this.formatFileSize(f.size)}</span>
        </div>
        <button type="button" class="btn-remove-file" title="Xóa tệp" data-idx="${idx}">&times;</button>
      `;
      item.querySelector(".btn-remove-file").addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectedFiles.primary.splice(idx, 1);
        this.renderFileListPrimary();
        this.updateRunButtonState();
      });
      this.fileListPrimary.appendChild(item);
    });
  }

  renderFileListSecondary() {
    this.fileListSecondary.innerHTML = "";
    if (this.selectedFiles.secondary.length === 0) {
      this.fileListSecondary.classList.add("hidden");
      return;
    }
    this.fileListSecondary.classList.remove("hidden");

    this.selectedFiles.secondary.forEach((f, idx) => {
      const item = document.createElement("div");
      item.className = "file-item";
      item.innerHTML = `
        <div class="file-item-left">
          <span class="file-icon">📊</span>
          <span class="file-name" title="${f.name}">${f.name}</span>
          <span class="file-size">${this.formatFileSize(f.size)}</span>
        </div>
        <button type="button" class="btn-remove-file" title="Xóa tệp" data-idx="${idx}">&times;</button>
      `;
      item.querySelector(".btn-remove-file").addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectedFiles.secondary.splice(idx, 1);
        this.renderFileListSecondary();
        this.updateRunButtonState();
      });
      this.fileListSecondary.appendChild(item);
    });
  }

  formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  updateRunButtonState() {
    const tool = window.getToolById(this.currentToolId);
    if (!tool) {
      this.btnRunAction.disabled = true;
      return;
    }

    const hasPrimary = this.selectedFiles.primary.length > 0;
    this.btnRunAction.disabled = !hasPrimary || this.isProcessing;
  }

  handleUrlHash() {
    const hash = window.location.hash.replace(/^#\/?/, "").trim();
    if (!hash || hash === "hub" || hash === "all") {
      this.showHubView();
    } else {
      const tool = window.getToolById(hash);
      if (tool) {
        this.showToolView(tool.id);
      } else {
        this.showHubView();
      }
    }
  }

  showHubView() {
    this.currentToolId = null;
    this.hubView.classList.remove("hidden");
    this.toolView.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update sidebar active
    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "hub");
    });
  }

  showToolView(toolId) {
    const tool = window.getToolById(toolId);
    if (!tool) return;

    this.currentToolId = toolId;
    this.hubView.classList.add("hidden");
    this.toolView.classList.remove("hidden");
    this.resetToolState();

    // Render tool header info
    this.toolBreadcrumb.textContent = tool.title;
    this.toolHeaderTitle.textContent = tool.title;
    this.toolHeaderSubtitle.textContent = tool.subtitle;
    this.toolBadge.textContent = tool.badge;
    this.toolBadge.className = `tool-badge badge-${tool.badgeColor}`;

    // Render guide
    this.toolGuideList.innerHTML = tool.guide.map(g => `<li>${g}</li>`).join("");
    this.toolOutputInfo.textContent = `Tệp kết quả: ${tool.outputName}`;

    // Setup input elements
    if (tool.inputType === "single-excel") {
      this.dropzonePrimaryTitle.textContent = "Kéo & thả tệp Excel báo cáo vào đây";
      this.dropzonePrimaryDesc.textContent = "Hỗ trợ định dạng: .xlsx, .xlsm, .xls (Chỉ 1 tệp)";
      this.fileInputPrimary.removeAttribute("multiple");
      this.fileInputPrimary.accept = tool.acceptFile;
      this.secondaryUploadGroup.classList.add("hidden");
      this.btnRunActionText.textContent = "⚡ Xử lý Báo cáo Ngay";
    } else if (tool.inputType === "word-and-sso") {
      this.dropzonePrimaryTitle.textContent = "Kéo & thả các tệp Word (.docx) vào đây";
      this.dropzonePrimaryDesc.textContent = "Hỗ trợ chọn nhiều tệp cùng lúc (Multi-file upload)";
      this.fileInputPrimary.setAttribute("multiple", "multiple");
      this.fileInputPrimary.accept = tool.acceptWord;
      this.secondaryUploadGroup.classList.remove("hidden");
      this.btnRunActionText.textContent = "🚀 Bắt đầu Xử lý & Đối chiếu";
    } else if (tool.inputType === "word-only") {
      this.dropzonePrimaryTitle.textContent = "Kéo & thả các tệp Word (.docx) vào đây";
      this.dropzonePrimaryDesc.textContent = "Hỗ trợ chọn nhiều tệp cùng lúc (Multi-file upload)";
      this.fileInputPrimary.setAttribute("multiple", "multiple");
      this.fileInputPrimary.accept = tool.acceptWord;
      this.secondaryUploadGroup.classList.add("hidden");
      this.btnRunActionText.textContent = "🚀 Bắt đầu Tổng hợp Email";
    }

    // Update sidebar active
    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === toolId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderToolGrid(searchTerm = "") {
    if (!this.toolCardsContainer) return;
    this.toolCardsContainer.innerHTML = "";

    const term = DocxTableParser.removeAccents(searchTerm.trim().toLowerCase());

    const filteredTools = window.TOOLS_REGISTRY.filter(tool => {
      // Category filter
      if (this.currentCategory !== "all" && tool.categoryId !== this.currentCategory) {
        return false;
      }
      // Search filter
      if (term) {
        const titleNorm = DocxTableParser.removeAccents(tool.title.toLowerCase());
        const descNorm = DocxTableParser.removeAccents(tool.description.toLowerCase());
        const badgeNorm = DocxTableParser.removeAccents(tool.badge.toLowerCase());
        return titleNorm.includes(term) || descNorm.includes(term) || badgeNorm.includes(term);
      }
      return true;
    });

    if (filteredTools.length === 0) {
      this.toolCardsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Không tìm thấy công cụ nào phù hợp</h3>
          <p>Hãy thử tìm kiếm với từ khóa khác hoặc chuyển danh mục.</p>
        </div>
      `;
      return;
    }

    filteredTools.forEach(tool => {
      const card = document.createElement("div");
      card.className = "tool-card";
      card.innerHTML = `
        <div class="tool-card-top">
          <div class="tool-card-icon icon-${tool.badgeColor}">
            ${tool.icon}
          </div>
          <span class="tool-badge badge-${tool.badgeColor}">${tool.badge}</span>
        </div>
        <h3 class="tool-card-title">${tool.title}</h3>
        <p class="tool-card-desc">${tool.description}</p>
        <div class="tool-card-footer">
          <span class="tool-card-output">📁 ${tool.outputName}</span>
          <button type="button" class="btn-open-tool">Mở công cụ &rarr;</button>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.hash = tool.id;
      });

      this.toolCardsContainer.appendChild(card);
    });
  }

  resetToolState() {
    this.selectedFiles = { primary: [], secondary: [] };
    this.isProcessing = false;
    this.lastResult = null;
    this.renderFileListPrimary();
    this.renderFileListSecondary();
    this.updateRunButtonState();

    this.progressBarContainer.classList.add("hidden");
    this.progressBar.style.width = "0%";
    this.progressLabel.textContent = "0%";

    this.btnDownloadResult.classList.add("hidden");
    this.btnResetTool.classList.add("hidden");

    this.logConsole.innerHTML = '<div class="log-line log-info">⚡ Sẵn sàng xử lý. Vui lòng chọn tệp và nhấn nút thực hiện.</div>';
    this.previewSection.classList.add("hidden");
    this.previewTableHead.innerHTML = "";
    this.previewTableBody.innerHTML = "";
  }

  appendLog(msg, type = "info") {
    const line = document.createElement("div");
    line.className = `log-line log-${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.logConsole.appendChild(line);
    this.logConsole.scrollTop = this.logConsole.scrollHeight;
  }

  updateProgress(val) {
    this.progressBarContainer.classList.remove("hidden");
    const clamped = Math.min(Math.max(val, 0), 100);
    this.progressBar.style.width = `${clamped}%`;
    this.progressLabel.textContent = `${clamped}%`;
  }

  async executeCurrentTool() {
    const tool = window.getToolById(this.currentToolId);
    if (!tool) return;

    if (this.selectedFiles.primary.length === 0) {
      this.showToast("Vui lòng chọn tệp trước khi xử lý!", "warning");
      return;
    }

    this.isProcessing = true;
    this.updateRunButtonState();
    this.logConsole.innerHTML = "";
    this.updateProgress(0);

    try {
      if (tool.id === "giam-dinh") {
        await this.handleGiamDinhFlow();
      } else if (tool.id === "cntt") {
        await this.handleCnttFlow();
      } else if (tool.id === "vgca-doi-chieu") {
        await this.handleVgcaDoiChieuFlow();
      } else if (tool.id === "vgca-cks") {
        await this.handleVgcaCksFlow();
      } else if (tool.id === "vgca-email") {
        await this.handleVgcaEmailFlow();
      }
    } catch (err) {
      console.error(err);
      this.appendLog(`❌ LỖI HỆ THỐNG: ${err.message}`, "error");
      this.showToast(`Lỗi xử lý: ${err.message}`, "error");
    } finally {
      this.isProcessing = false;
      this.updateRunButtonState();
    }
  }

  // Flow 1: Báo cáo Giám định Bảo hiểm
  async handleGiamDinhFlow() {
    const file = this.selectedFiles.primary[0];
    const arrayBuffer = await file.arrayBuffer();

    // Auto calculate current date and suggest day range
    const today = new Date();
    const currentDay = today.getDate();
    let defaultRange = currentDay <= 15 ? "01-14" : "15-31";

    this.dayModalInfo.innerHTML = `
      Ngày hiện tại: <strong>${currentDay}</strong><br>
      Khoảng ngày gợi ý mặc định: <strong>${defaultRange === "01-14" ? "Ngày 01 → 14" : "Ngày 15 → 31"}</strong>
    `;

    if (defaultRange === "01-14") {
      this.radioDay0114.checked = true;
    } else {
      this.radioDay1531.checked = true;
    }

    this.showModal(this.modalDayRange);

    const userConfirmed = await new Promise((resolve) => {
      const onConfirm = () => {
        this.btnConfirmDayRange.removeEventListener("click", onConfirm);
        this.hideModal(this.modalDayRange);
        const selected = document.querySelector('input[name="dayRangeRadio"]:checked').value;
        resolve(selected);
      };
      this.btnConfirmDayRange.addEventListener("click", onConfirm);
    });

    let startDay = 1, endDay = 14;
    if (userConfirmed === "15-31") {
      startDay = 15;
      endDay = 31;
    }

    this.appendLog(`Bắt đầu xử lý Báo cáo Giám định: Chu kỳ Ngày ${startDay} -> ${endDay}...`);
    this.updateProgress(30);

    const result = await ToolGiamDinh.processGiamDinh(arrayBuffer, startDay, endDay);
    this.updateProgress(100);
    this.appendLog(`🎉 Đã xử lý thành công! Tổng số bản ghi đạt yêu cầu: ${result.totalRecords}`, "success");

    this.lastResult = {
      blob: new Blob([result.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      fileName: "DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM.xlsx",
      previewHeaders: ["STT", "Khoa/Phòng", ...Array.from({ length: endDay - startDay + 1 }, (_, i) => `Ngày ${startDay + i}`)],
      previewRows: result.previewRows,
      totalRecords: result.totalRecords
    };

    this.finishExecution();
  }

  // Flow 2: Báo cáo CNTT
  async handleCnttFlow() {
    const file = this.selectedFiles.primary[0];
    const arrayBuffer = await file.arrayBuffer();

    const sheetNames = ToolGiamDinh.getExcelSheetNames(arrayBuffer);
    if (!sheetNames || sheetNames.length === 0) {
      throw new Error("Không thể tìm thấy sheet nào trong file Excel.");
    }

    this.sheetDropdown.innerHTML = sheetNames.map(s => `<option value="${s}">${s}</option>`).join("");
    this.showModal(this.modalSheetSelect);

    const chosenSheet = await new Promise((resolve) => {
      const onConfirm = () => {
        this.btnConfirmSheet.removeEventListener("click", onConfirm);
        this.hideModal(this.modalSheetSelect);
        resolve(this.sheetDropdown.value);
      };
      this.btnConfirmSheet.addEventListener("click", onConfirm);
    });

    this.appendLog(`Bắt đầu xử lý Sheet [${chosenSheet}] Báo cáo Công việc P.CNTT...`);
    this.updateProgress(40);

    const result = await ToolGiamDinh.processCntt(arrayBuffer, chosenSheet);
    this.updateProgress(100);
    this.appendLog(`🎉 Đã xử lý thành công! Tổng số khoa/phòng có phát sinh công việc: ${result.totalRecords}`, "success");

    this.lastResult = {
      blob: new Blob([result.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      fileName: "TỔNG HỢP CÔNG VIỆC P.CNTT.xlsx",
      previewHeaders: result.headers,
      previewRows: result.previewRows,
      totalRecords: result.totalRecords
    };

    this.finishExecution();
  }

  // Flow 3: Đối chiếu Word & SSO ra Excel 19 Cột VGCA
  async handleVgcaDoiChieuFlow() {
    const wordFiles = this.selectedFiles.primary;
    const ssoFiles = this.selectedFiles.secondary;

    const result = await ToolVgcaDoiChieu.processVgcaDoiChieu(
      wordFiles,
      ssoFiles,
      (msg) => this.appendLog(msg),
      (pct) => this.updateProgress(pct)
    );

    this.lastResult = {
      blob: new Blob([result.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      fileName: "Ket_qua.xlsx",
      previewHeaders: result.headers,
      previewRows: result.previewRows,
      totalRecords: result.totalRecords
    };

    this.finishExecution();
  }

  // Flow 4: Tổng hợp CKS
  async handleVgcaCksFlow() {
    const wordFiles = this.selectedFiles.primary;
    const ssoFiles = this.selectedFiles.secondary;

    const result = await ToolVgcaCks.processVgcaCks(
      wordFiles,
      ssoFiles,
      (msg) => this.appendLog(msg),
      (pct) => this.updateProgress(pct)
    );

    this.lastResult = {
      blob: result.blob,
      fileName: "DANH_SACH_TONG_HOP.txt",
      previewHeaders: result.headers,
      previewRows: result.previewRows,
      totalRecords: result.totalRecords
    };

    this.finishExecution();
  }

  // Flow 5: Tổng hợp Email
  async handleVgcaEmailFlow() {
    const wordFiles = this.selectedFiles.primary;

    const result = await ToolVgcaEmail.processVgcaEmail(
      wordFiles,
      (msg) => this.appendLog(msg),
      (pct) => this.updateProgress(pct)
    );

    this.lastResult = {
      blob: result.blob,
      fileName: "DANH_SACH_EMAIL_CONG_VU.txt",
      previewHeaders: result.headers,
      previewRows: result.previewRows,
      totalRecords: result.totalRecords
    };

    this.finishExecution();
  }

  finishExecution() {
    if (!this.lastResult) return;

    this.btnDownloadResult.classList.remove("hidden");
    this.btnResetTool.classList.remove("hidden");
    this.btnDownloadResult.textContent = `📥 Tải Về Kết Quả: ${this.lastResult.fileName}`;

    // Render Preview Table
    this.renderPreviewTable(this.lastResult.previewHeaders, this.lastResult.previewRows, this.lastResult.totalRecords);

    // Auto trigger download
    this.downloadLastResult();
    this.showToast(`Đã tạo thành công tệp ${this.lastResult.fileName}!`, "success");
  }

  downloadLastResult() {
    if (!this.lastResult || !this.lastResult.blob) return;

    const url = URL.createObjectURL(this.lastResult.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.lastResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.appendLog(`💾 Tệp [${this.lastResult.fileName}] đã được tải về máy tính.`, "success");
  }

  renderPreviewTable(headers, rows, totalCount) {
    if (!headers || !rows || rows.length === 0) {
      this.previewSection.classList.add("hidden");
      return;
    }

    this.previewSection.classList.remove("hidden");
    this.previewSummary.textContent = `Hiển thị xem trước ${Math.min(rows.length, 50)} / ${totalCount} bản ghi`;

    // Render Header
    this.previewTableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;

    // Render Body (Max 50 rows preview)
    const previewSubset = rows.slice(0, 50);
    this.previewTableBody.innerHTML = previewSubset.map(row => {
      return `<tr>${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ""}</td>`).join("")}</tr>`;
    }).join("");
  }

  showModal(modalEl) {
    if (modalEl) {
      modalEl.classList.remove("hidden");
    }
  }

  hideModal(modalEl) {
    if (modalEl) {
      modalEl.classList.add("hidden");
    }
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✓" : (type === "warning" ? "⚠️" : (type === "error" ? "✕" : "ℹ"));
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast-show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Global bootstrap
document.addEventListener("DOMContentLoaded", () => {
  window.appController = new AppController();
});
