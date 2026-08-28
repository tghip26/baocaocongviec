/**
 * app.js
 * Master Application Controller for Multi-tool Portal & VIMES Schema Explorer
 * Single Page Application (SPA) architecture, dynamic tool router, interactive live data editor,
 * VIMES Schema variable & table lookup engine, SQL generator.
 */

class AppController {
  constructor() {
    this.currentToolId = null;
    this.currentCategory = "all";
    this.selectedFiles = {
      primary: [],
      secondary: []
    };
    this.isProcessing = false;
    this.lastResult = null;

    // Schema Explorer State
    this.schemaSearchMode = "column"; // "column" | "table"
    this.currentInspectedTable = null;

    this.initElements();
    this.initEvents();
    this.loadOrgConfigToUi();
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
    this.schemaView = document.getElementById("schemaView");
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

    // Org Preview Box
    this.orgLine1 = document.getElementById("orgLine1");
    this.orgLine2 = document.getElementById("orgLine2");
    this.orgLine3 = document.getElementById("orgLine3");
    this.btnEditOrgInline = document.getElementById("btnEditOrgInline");

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

    // Quality Metrics
    this.qualityMetricsSection = document.getElementById("qualityMetricsSection");
    this.metricTotal = document.getElementById("metricTotal");
    this.metricSso = document.getElementById("metricSso");
    this.metricMissing = document.getElementById("metricMissing");
    this.metricCccd = document.getElementById("metricCccd");

    this.logConsole = document.getElementById("logConsole");
    this.previewSection = document.getElementById("previewSection");
    this.previewSummary = document.getElementById("previewSummary");
    this.previewTable = document.getElementById("previewTable");
    this.previewTableHead = document.getElementById("previewTableHead");
    this.previewTableBody = document.getElementById("previewTableBody");
    this.btnCopyTable = document.getElementById("btnCopyTable");

    // Config Modal Elements
    this.btnOpenConfigHeader = document.getElementById("btnOpenConfigHeader");
    this.btnOpenConfigSidebar = document.getElementById("btnOpenConfigSidebar");
    this.modalConfig = document.getElementById("modalConfig");
    this.btnCloseConfigModal = document.getElementById("btnCloseConfigModal");
    this.cfgOrg1 = document.getElementById("cfgOrg1");
    this.cfgOrg2 = document.getElementById("cfgOrg2");
    this.cfgOrg3 = document.getElementById("cfgOrg3");
    this.cfgProvince = document.getElementById("cfgProvince");
    this.btnSaveConfig = document.getElementById("btnSaveConfig");
    this.btnResetConfigDefault = document.getElementById("btnResetConfigDefault");

    // SQL Modal Elements
    this.modalSqlView = document.getElementById("modalSqlView");
    this.sqlModalTitle = document.getElementById("sqlModalTitle");
    this.sqlCodeContent = document.getElementById("sqlCodeContent");
    this.btnCopySqlInModal = document.getElementById("btnCopySqlInModal");
    this.btnCloseSqlModal = document.getElementById("btnCloseSqlModal");

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

    // Schema Explorer Elements
    this.btnBackFromSchema = document.getElementById("btnBackFromSchema");
    this.btnModeColumn = document.getElementById("btnModeColumn");
    this.btnModeTable = document.getElementById("btnModeTable");
    this.schemaSearchInput = document.getElementById("schemaSearchInput");
    this.btnClearSchemaSearch = document.getElementById("btnClearSchemaSearch");
    this.selectSchemaSection = document.getElementById("selectSchemaSection");
    this.selectSchemaPrefix = document.getElementById("selectSchemaPrefix");
    this.popularTagsList = document.getElementById("popularTagsList");
    this.schemaResultCount = document.getElementById("schemaResultCount");
    this.schemaResultsList = document.getElementById("schemaResultsList");

    this.inspectorEmptyState = document.getElementById("inspectorEmptyState");
    this.inspectorContent = document.getElementById("inspectorContent");
    this.inspectorTableName = document.getElementById("inspectorTableName");
    this.inspectorTableType = document.getElementById("inspectorTableType");
    this.inspectorTableSection = document.getElementById("inspectorTableSection");
    this.inspectorTableColCount = document.getElementById("inspectorTableColCount");
    this.btnCopySqlSelect = document.getElementById("btnCopySqlSelect");
    this.btnExportTableExcel = document.getElementById("btnExportTableExcel");
    this.inspectorColumnFilterInput = document.getElementById("inspectorColumnFilterInput");
    this.inspectorColumnsBody = document.getElementById("inspectorColumnsBody");

    // Toast Container
    this.toastContainer = document.getElementById("toastContainer");
  }

  initEvents() {
    // Hash change for SPA routing
    window.addEventListener("hashchange", () => this.handleUrlHash());

    // Sidebar toggle
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
    if (this.btnBackFromSchema) {
      this.btnBackFromSchema.addEventListener("click", () => {
        window.location.hash = "";
      });
    }

    // Global Search input
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

    // Config Modal Triggers
    const openConfigModal = () => {
      const cfg = ToolVgcaDoiChieu ? ToolVgcaDoiChieu.getOrgConfig() : {
        org1: "ỦY BAN NHÂN DÂN TỈNH BẮC NINH",
        org2: "SỞ Y TẾ",
        org3: "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2",
        province: "Bắc Ninh"
      };
      this.cfgOrg1.value = cfg.org1;
      this.cfgOrg2.value = cfg.org2;
      this.cfgOrg3.value = cfg.org3;
      this.cfgProvince.value = cfg.province;
      this.showModal(this.modalConfig);
    };

    if (this.btnOpenConfigHeader) this.btnOpenConfigHeader.addEventListener("click", openConfigModal);
    if (this.btnOpenConfigSidebar) this.btnOpenConfigSidebar.addEventListener("click", openConfigModal);
    if (this.btnEditOrgInline) this.btnEditOrgInline.addEventListener("click", openConfigModal);
    if (this.btnCloseConfigModal) this.btnCloseConfigModal.addEventListener("click", () => this.hideModal(this.modalConfig));

    if (this.btnSaveConfig) {
      this.btnSaveConfig.addEventListener("click", () => {
        const newCfg = {
          org1: this.cfgOrg1.value.trim() || "ỦY BAN NHÂN DÂN TỈNH BẮC NINH",
          org2: this.cfgOrg2.value.trim() || "SỞ Y TẾ",
          org3: this.cfgOrg3.value.trim() || "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2",
          province: this.cfgProvince.value.trim() || "Bắc Ninh"
        };
        localStorage.setItem("APP_ORG_CONFIG", JSON.stringify(newCfg));
        this.loadOrgConfigToUi();
        this.hideModal(this.modalConfig);
        this.showToast("Đã lưu cấu hình đơn vị mục tiêu thành công!", "success");
      });
    }

    if (this.btnResetConfigDefault) {
      this.btnResetConfigDefault.addEventListener("click", () => {
        localStorage.removeItem("APP_ORG_CONFIG");
        this.loadOrgConfigToUi();
        const cfg = ToolVgcaDoiChieu.getOrgConfig();
        this.cfgOrg1.value = cfg.org1;
        this.cfgOrg2.value = cfg.org2;
        this.cfgOrg3.value = cfg.org3;
        this.cfgProvince.value = cfg.province;
        this.showToast("Đã khôi phục cấu hình mặc định!", "info");
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

    // Copy Table to Clipboard
    if (this.btnCopyTable) {
      this.btnCopyTable.addEventListener("click", () => this.copyTableToClipboard());
    }

    // Modal Events
    if (this.btnCloseDayModal) this.btnCloseDayModal.addEventListener("click", () => this.hideModal(this.modalDayRange));
    if (this.btnCloseSheetModal) this.btnCloseSheetModal.addEventListener("click", () => this.hideModal(this.modalSheetSelect));

    // SQL Modal Events
    if (this.btnCloseSqlModal) this.btnCloseSqlModal.addEventListener("click", () => this.hideModal(this.modalSqlView));
    if (this.btnCopySqlInModal) {
      this.btnCopySqlInModal.addEventListener("click", () => {
        navigator.clipboard.writeText(this.sqlCodeContent.textContent).then(() => {
          this.showToast("Đã sao chép câu lệnh SQL vào Clipboard!", "success");
        });
      });
    }

    // ==========================================
    // SCHEMA LOOKUP EVENTS
    // ==========================================
    if (this.btnModeColumn) {
      this.btnModeColumn.addEventListener("click", () => {
        this.schemaSearchMode = "column";
        this.btnModeColumn.classList.add("active");
        this.btnModeTable.classList.remove("active");
        this.schemaSearchInput.placeholder = "Nhập tên biến/cột (ví dụ: patientno, docno, invoiceno, doctor_id, card_id, roomid, icd10)...";
        this.performSchemaSearch();
      });
    }

    if (this.btnModeTable) {
      this.btnModeTable.addEventListener("click", () => {
        this.schemaSearchMode = "table";
        this.btnModeTable.classList.add("active");
        this.btnModeColumn.classList.remove("active");
        this.schemaSearchInput.placeholder = "Nhập tên bảng (ví dụ: hms_patient, hms_doc, m_transaction, sys_user, hms_fee)...";
        this.performSchemaSearch();
      });
    }

    if (this.schemaSearchInput) {
      this.schemaSearchInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (this.btnClearSchemaSearch) {
          this.btnClearSchemaSearch.classList.toggle("hidden", !val);
        }
        this.performSchemaSearch();
      });
    }

    if (this.btnClearSchemaSearch) {
      this.btnClearSchemaSearch.addEventListener("click", () => {
        this.schemaSearchInput.value = "";
        this.btnClearSchemaSearch.classList.add("hidden");
        this.schemaSearchInput.focus();
        this.performSchemaSearch();
      });
    }

    if (this.selectSchemaSection) {
      this.selectSchemaSection.addEventListener("change", () => this.performSchemaSearch());
    }

    if (this.selectSchemaPrefix) {
      this.selectSchemaPrefix.addEventListener("change", () => this.performSchemaSearch());
    }

    if (this.popularTagsList) {
      this.popularTagsList.addEventListener("click", (e) => {
        const tagBtn = e.target.closest(".pop-tag");
        if (tagBtn) {
          const val = tagBtn.dataset.val;
          this.schemaSearchMode = "column";
          this.btnModeColumn.classList.add("active");
          this.btnModeTable.classList.remove("active");
          this.schemaSearchInput.value = val;
          if (this.btnClearSchemaSearch) this.btnClearSchemaSearch.classList.remove("hidden");
          this.performSchemaSearch();
        }
      });
    }

    if (this.inspectorColumnFilterInput) {
      this.inspectorColumnFilterInput.addEventListener("input", (e) => {
        this.filterInspectorColumns(e.target.value);
      });
    }

    if (this.btnCopySqlSelect) {
      this.btnCopySqlSelect.addEventListener("click", () => {
        if (!this.currentInspectedTable) return;
        const sql = window.schemaLookupEngine.generateSelectSql(this.currentInspectedTable);
        this.sqlModalTitle.textContent = `CÂU LỆNH SQL SELECT: ${this.currentInspectedTable.name}`;
        this.sqlCodeContent.textContent = sql;
        this.showModal(this.modalSqlView);
      });
    }

    if (this.btnExportTableExcel) {
      this.btnExportTableExcel.addEventListener("click", () => {
        if (!this.currentInspectedTable) return;
        this.exportTableDictionaryToExcel(this.currentInspectedTable);
      });
    }
  }

  loadOrgConfigToUi() {
    const cfg = ToolVgcaDoiChieu ? ToolVgcaDoiChieu.getOrgConfig() : {
      org1: "ỦY BAN NHÂN DÂN TỈNH BẮC NINH",
      org2: "SỞ Y TẾ",
      org3: "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2",
      province: "Bắc Ninh"
    };

    if (this.orgLine1) this.orgLine1.textContent = cfg.org1;
    if (this.orgLine2) this.orgLine2.textContent = cfg.org2;
    if (this.orgLine3) this.orgLine3.textContent = cfg.org3;
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
      this.selectedFiles.primary = [files[0]];
    } else {
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
    } else if (hash === "schema-lookup") {
      this.showSchemaView();
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
    this.schemaView.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "hub");
    });
  }

  showSchemaView() {
    this.currentToolId = "schema-lookup";
    this.hubView.classList.add("hidden");
    this.toolView.classList.add("hidden");
    this.schemaView.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "schema-lookup");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!this.schemaSearchInput.value) {
      this.schemaSearchInput.value = "patientno";
      if (this.btnClearSchemaSearch) this.btnClearSchemaSearch.classList.remove("hidden");
    }
    this.performSchemaSearch();
  }

  showToolView(toolId) {
    if (toolId === "schema-lookup") {
      this.showSchemaView();
      return;
    }

    const tool = window.getToolById(toolId);
    if (!tool) return;

    this.currentToolId = toolId;
    this.hubView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    this.toolView.classList.remove("hidden");
    this.resetToolState();
    this.loadOrgConfigToUi();

    // Render tool header info
    this.toolBreadcrumb.textContent = tool.title;
    this.toolHeaderTitle.textContent = tool.title;
    this.toolHeaderSubtitle.textContent = tool.subtitle;
    this.toolBadge.textContent = tool.badge;
    this.toolBadge.className = `tool-badge badge-${tool.badgeColor}`;

    // Render guide
    this.toolGuideList.innerHTML = tool.guide.map(g => `<li>${g}</li>`).join("");
    this.toolOutputInfo.textContent = `Tệp kết quả chuẩn: ${tool.outputName}`;

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
      if (this.currentCategory !== "all" && tool.categoryId !== this.currentCategory) {
        return false;
      }
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

  // =========================================================================
  // SCHEMA LOOKUP METHODS
  // =========================================================================
  performSchemaSearch() {
    const query = this.schemaSearchInput.value.trim();
    const section = this.selectSchemaSection.value;
    const prefix = this.selectSchemaPrefix.value;

    this.schemaResultsList.innerHTML = "";

    if (this.schemaSearchMode === "column") {
      const results = window.schemaLookupEngine.searchByColumn(query, section, prefix);
      this.schemaResultCount.textContent = `Tìm thấy ${results.length} vị trí biến khớp từ khóa`;

      if (results.length === 0) {
        this.schemaResultsList.innerHTML = `
          <div class="schema-no-results">
            <span>🔍 Không tìm thấy biến nào có tên chứa "<strong>${query}</strong>"</span>
          </div>
        `;
        return;
      }

      // Group or display results
      results.slice(0, 200).forEach(item => {
        const row = document.createElement("div");
        row.className = "schema-item-card";
        row.innerHTML = `
          <div class="item-card-top">
            <span class="item-col-name ${item.isPk ? 'is-pk' : ''}">
              ${item.isPk ? '🔑 ' : ''}<strong>${item.colName}</strong>
            </span>
            <span class="item-type-badge type-${this.getTypeClass(item.colType)}">${item.colType}</span>
          </div>
          <div class="item-card-bottom">
            <span class="item-tbl-name">📋 ${item.tableName}</span>
            <span class="item-sec-name">${item.tableSection}</span>
          </div>
        `;

        row.addEventListener("click", () => {
          this.inspectTable(item.tableName, item.colName);
          this.schemaResultsList.querySelectorAll(".schema-item-card").forEach(c => c.classList.remove("selected"));
          row.classList.add("selected");
        });

        this.schemaResultsList.appendChild(row);
      });

      // Automatically inspect first result if none currently inspected
      if (!this.currentInspectedTable && results.length > 0) {
        this.inspectTable(results[0].tableName, results[0].colName);
        this.schemaResultsList.querySelector(".schema-item-card")?.classList.add("selected");
      }

    } else {
      // Table search mode
      const results = window.schemaLookupEngine.searchByTable(query, section, prefix);
      this.schemaResultCount.textContent = `Tìm thấy ${results.length} bảng khớp từ khóa`;

      if (results.length === 0) {
        this.schemaResultsList.innerHTML = `
          <div class="schema-no-results">
            <span>🔍 Không tìm thấy bảng nào có tên chứa "<strong>${query}</strong>"</span>
          </div>
        `;
        return;
      }

      results.slice(0, 200).forEach(tbl => {
        const row = document.createElement("div");
        row.className = "schema-item-card";
        row.innerHTML = `
          <div class="item-card-top">
            <span class="item-tbl-title">📋 <strong>${tbl.name}</strong></span>
            <span class="item-col-badge">${tbl.columns.length} cột</span>
          </div>
          <div class="item-card-bottom">
            <span class="item-badge-type">${tbl.type}</span>
            <span class="item-sec-name">${tbl.section}</span>
          </div>
        `;

        row.addEventListener("click", () => {
          this.inspectTable(tbl.name);
          this.schemaResultsList.querySelectorAll(".schema-item-card").forEach(c => c.classList.remove("selected"));
          row.classList.add("selected");
        });

        this.schemaResultsList.appendChild(row);
      });

      if (!this.currentInspectedTable && results.length > 0) {
        this.inspectTable(results[0].name);
        this.schemaResultsList.querySelector(".schema-item-card")?.classList.add("selected");
      }
    }
  }

  inspectTable(tableName, highlightCol = "") {
    const table = window.schemaLookupEngine.getTableByName(tableName);
    if (!table) return;

    this.currentInspectedTable = table;
    this.inspectorEmptyState.classList.add("hidden");
    this.inspectorContent.classList.remove("hidden");

    this.inspectorTableName.textContent = table.name;
    this.inspectorTableType.textContent = table.type;
    this.inspectorTableSection.textContent = table.section;
    this.inspectorTableColCount.textContent = `Tổng cộng: ${table.columns.length} cột / biến`;

    this.inspectorColumnFilterInput.value = "";
    this.renderInspectorColumns(table.columns, highlightCol);
  }

  renderInspectorColumns(columns, highlightCol = "") {
    this.inspectorColumnsBody.innerHTML = "";
    const hCol = (highlightCol || "").toLowerCase();

    columns.forEach((col, idx) => {
      const tr = document.createElement("tr");
      if (hCol && col.name.toLowerCase() === hCol) {
        tr.classList.add("highlight-column-row");
      }

      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
        <td>
          <span class="col-name-link ${col.isPk ? 'is-pk' : ''}" title="Bấm để tìm tất cả bảng có chứa biến ${col.name}">
            ${col.isPk ? '🔑 ' : ''}<strong>${col.name}</strong>
          </span>
        </td>
        <td>
          <span class="col-type-tag type-${this.getTypeClass(col.type)}">${col.type}</span>
        </td>
        <td style="text-align: center;">
          <span class="null-tag ${col.nullable ? 'null-yes' : 'null-no'}">${col.nullable ? 'YES' : 'NO'}</span>
        </td>
        <td style="color: var(--text-muted); font-size: 0.76rem;">${col.default || ''}</td>
      `;

      // Clicking column name performs reverse search
      tr.querySelector(".col-name-link").addEventListener("click", () => {
        this.schemaSearchMode = "column";
        this.btnModeColumn.classList.add("active");
        this.btnModeTable.classList.remove("active");
        this.schemaSearchInput.value = col.name;
        if (this.btnClearSchemaSearch) this.btnClearSchemaSearch.classList.remove("hidden");
        this.performSchemaSearch();
      });

      this.inspectorColumnsBody.appendChild(tr);
    });
  }

  filterInspectorColumns(filterText) {
    if (!this.currentInspectedTable) return;
    const term = (filterText || "").trim().toLowerCase();
    const filtered = this.currentInspectedTable.columns.filter(c => {
      return c.name.toLowerCase().includes(term) || c.type.toLowerCase().includes(term);
    });
    this.renderInspectorColumns(filtered);
  }

  getTypeClass(typeStr) {
    const t = (typeStr || "").toLowerCase();
    if (t.includes("int") || t.includes("serial")) return "int";
    if (t.includes("char") || t.includes("text")) return "text";
    if (t.includes("numeric") || t.includes("float") || t.includes("double")) return "num";
    if (t.includes("date") || t.includes("time")) return "date";
    if (t.includes("bool")) return "bool";
    return "other";
  }

  async exportTableDictionaryToExcel(table) {
    if (!table) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(table.name.slice(0, 30));

    // Headers
    ws.addRow(["STT", "Tên Biến / Tên Cột", "Kiểu Dữ Liệu", "Khóa Chính (PK)", "Cho Phép NULL", "Giá Trị Mặc Định"]);
    const headerRow = ws.getRow(1);
    headerRow.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    table.columns.forEach((c, idx) => {
      const row = ws.addRow([
        idx + 1,
        c.name,
        c.type,
        c.isPk ? "YES (PK)" : "NO",
        c.nullable ? "YES" : "NO",
        c.default || ""
      ]);
      row.font = { name: "Arial", size: 10 };
      row.alignment = { vertical: "middle" };
      row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(5).alignment = { vertical: "middle", horizontal: "center" };
    });

    ws.columns = [
      { width: 8 },
      { width: 30 },
      { width: 25 },
      { width: 16 },
      { width: 16 },
      { width: 40 }
    ];

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Schema_${table.name}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    this.showToast(`Đã xuất từ điển bảng ${table.name}.xlsx thành công!`, "success");
  }

  // =========================================================================
  // STANDARD TOOL WORKSPACE LOGIC
  // =========================================================================
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

    this.qualityMetricsSection.classList.add("hidden");
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
    this.qualityMetricsSection.classList.add("hidden");
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

  async handleGiamDinhFlow() {
    const file = this.selectedFiles.primary[0];
    const arrayBuffer = await file.arrayBuffer();

    const today = new Date();
    const currentDay = today.getDate();
    let defaultRange = currentDay <= 14 ? "01-14" : "15-31";

    this.dayModalInfo.innerHTML = `
      Ngày hiện tại: <strong>${currentDay}</strong><br>
      Khoảng ngày gợi ý: <strong>${defaultRange === "01-14" ? "Ngày 01 → 14" : "Ngày 15 → 31"}</strong>
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

  async handleVgcaDoiChieuFlow() {
    const wordFiles = this.selectedFiles.primary;
    const ssoFiles = this.selectedFiles.secondary;

    const result = await ToolVgcaDoiChieu.processVgcaDoiChieu(
      wordFiles,
      ssoFiles,
      (msg) => this.appendLog(msg),
      (pct) => this.updateProgress(pct)
    );

    this.showQualityMetrics(result.totalRecords, result.matchedSsoCount, result.missingSsoCount, result.validCccdCount);

    this.lastResult = {
      blob: new Blob([result.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      fileName: "Ket_qua.xlsx",
      previewHeaders: result.headers,
      previewRows: result.previewRows,
      totalRecords: result.totalRecords,
      type: "excel-vgca"
    };

    this.finishExecution();
  }

  async handleVgcaCksFlow() {
    const wordFiles = this.selectedFiles.primary;
    const ssoFiles = this.selectedFiles.secondary;

    const result = await ToolVgcaCks.processVgcaCks(
      wordFiles,
      ssoFiles,
      (msg) => this.appendLog(msg),
      (pct) => this.updateProgress(pct)
    );

    this.showQualityMetrics(result.totalRecords, result.matchedSsoCount, result.missingSsoCount, result.validCccdCount);

    this.lastResult = {
      blob: result.blob,
      fileName: "DANH_SACH_TONG_HOP.txt",
      previewHeaders: result.headers,
      previewRows: result.previewRows,
      totalRecords: result.totalRecords,
      type: "txt-cks"
    };

    this.finishExecution();
  }

  async handleVgcaEmailFlow() {
    const wordFiles = this.selectedFiles.primary;

    const result = await ToolVgcaEmail.processVgcaEmail(
      wordFiles,
      (msg) => this.appendLog(msg),
      (pct) => this.updateProgress(pct)
    );

    this.showQualityMetrics(result.totalRecords, 0, 0, result.validCccdCount);

    this.lastResult = {
      blob: result.blob,
      fileName: "DANH_SACH_EMAIL_CONG_VU.txt",
      previewHeaders: result.headers,
      previewRows: result.previewRows,
      totalRecords: result.totalRecords,
      type: "txt-email"
    };

    this.finishExecution();
  }

  showQualityMetrics(total, sso, missing, validCccd) {
    if (!this.qualityMetricsSection) return;
    this.qualityMetricsSection.classList.remove("hidden");
    this.metricTotal.textContent = total || 0;
    this.metricSso.textContent = sso || 0;
    this.metricMissing.textContent = missing || 0;
    this.metricCccd.textContent = validCccd || 0;
  }

  finishExecution() {
    if (!this.lastResult) return;

    this.btnDownloadResult.classList.remove("hidden");
    this.btnResetTool.classList.remove("hidden");
    this.btnDownloadResult.textContent = `📥 Tải Về Kết Quả: ${this.lastResult.fileName}`;

    this.renderPreviewTable(this.lastResult.previewHeaders, this.lastResult.previewRows, this.lastResult.totalRecords);
    this.downloadLastResult();
    this.showToast(`Đã tạo thành công tệp ${this.lastResult.fileName}!`, "success");
  }

  async rebuildBlobFromEditedData() {
    if (!this.lastResult || !this.lastResult.previewRows) return;

    if (this.lastResult.type === "excel-vgca") {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Ket_qua");
      const headers = this.lastResult.previewHeaders;

      const headerRow = ws.getRow(1);
      headerRow.height = 36;
      headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: "Arial", size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F4F7" } };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      });

      this.lastResult.previewRows.forEach((r, idx) => {
        const row = ws.getRow(idx + 2);
        row.height = 24;
        r.forEach((val, cIdx) => {
          const cell = row.getCell(cIdx + 1);
          cell.value = val;
          cell.numFmt = "@";
          cell.font = { name: "Arial", size: 10 };
          cell.alignment = { vertical: "middle", horizontal: cIdx === 0 ? "center" : (cIdx === 1 || cIdx === 6 ? "left" : "center") };
        });
      });

      ws.columns.forEach((col, idx) => {
        col.width = idx === 0 ? 6 : (idx === 1 ? 25 : (idx === 6 ? 30 : 18));
      });

      const buffer = await wb.xlsx.writeBuffer();
      this.lastResult.blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    } else if (this.lastResult.type === "txt-cks" || this.lastResult.type === "txt-email") {
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const s = String(val).replace(/"/g, '""');
        return `"${s}"`;
      };
      const lines = [];
      lines.push(this.lastResult.previewHeaders.map(escapeCsv).join(","));
      this.lastResult.previewRows.forEach(r => {
        lines.push(r.map(escapeCsv).join(","));
      });
      const content = "\uFEFF" + lines.join("\r\n");
      this.lastResult.blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    }
  }

  async downloadLastResult() {
    if (!this.lastResult) return;
    await this.rebuildBlobFromEditedData();

    if (!this.lastResult.blob) return;
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
    this.previewSummary.textContent = `Hiển thị ${Math.min(rows.length, 100)} / ${totalCount} bản ghi (Nhấp vào ô để chỉnh sửa)`;

    this.previewTableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;

    const previewSubset = rows.slice(0, 100);
    this.previewTableBody.innerHTML = "";

    previewSubset.forEach((row, rIdx) => {
      const tr = document.createElement("tr");

      row.forEach((cellVal, cIdx) => {
        const td = document.createElement("td");
        td.textContent = cellVal !== null && cellVal !== undefined ? cellVal : "";
        td.contentEditable = "true";
        td.spellcheck = false;

        const headerName = headers[cIdx] ? headers[cIdx].toLowerCase() : "";
        if ((headerName.includes("email") || headerName.includes("thư điện tử")) && (!cellVal || cellVal === "")) {
          td.classList.add("cell-warning");
          td.title = "Chưa có Email công vụ SSO - Nhấp để nhập";
        }
        if ((headerName.includes("cccd") || headerName.includes("cmnd")) && cellVal) {
          const digits = String(cellVal).replace(/\D/g, "");
          if (digits.length > 0 && digits.length !== 12 && digits.length !== 9 && !String(cellVal).includes(";")) {
            td.classList.add("cell-danger");
            td.title = `Số CCCD có ${digits.length} số (chưa đủ 12 số chuẩn)`;
          }
        }

        td.addEventListener("input", () => {
          this.lastResult.previewRows[rIdx][cIdx] = td.textContent.trim();
          td.classList.remove("cell-warning");
          td.classList.add("cell-edited");
        });

        tr.appendChild(td);
      });

      this.previewTableBody.appendChild(tr);
    });
  }

  copyTableToClipboard() {
    if (!this.lastResult || !this.lastResult.previewRows) return;
    const headers = this.lastResult.previewHeaders;
    const rows = this.lastResult.previewRows;

    const tsvLines = [];
    tsvLines.push(headers.join("\t"));
    rows.forEach(r => tsvLines.push(r.join("\t")));

    navigator.clipboard.writeText(tsvLines.join("\n")).then(() => {
      this.showToast("Đã sao chép toàn bộ bảng dữ liệu vào Clipboard!", "success");
    }).catch(err => {
      this.showToast("Không thể sao chép: " + err.message, "error");
    });
  }

  showModal(modalEl) {
    if (modalEl) modalEl.classList.remove("hidden");
  }

  hideModal(modalEl) {
    if (modalEl) modalEl.classList.add("hidden");
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

    setTimeout(() => toast.classList.add("toast-show"), 10);
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.appController = new AppController();
});
