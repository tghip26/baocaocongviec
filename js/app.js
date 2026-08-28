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

    // Schema Explorer State (Mặc định: Tra cứu theo Tên Bảng lên đầu)
    this.schemaSearchMode = "table"; // "table" | "column"
    this.currentInspectedTable = null;

    // Word to HTML & Inline CSS Converter State
    this.w2hConverter = new WordToHtmlConverter();
    this.currentW2hFileBuffer = null;
    this.currentW2hFileName = "";
    this.currentW2hHtmlOutput = "";
    this.w2hCurrentTab = "visual"; // "visual" | "code"

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
    this.wordToHtmlView = document.getElementById("wordToHtmlView");
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
    this.inspectorTableVnTitle = document.getElementById("inspectorTableVnTitle");
    this.inspectorTableTopic = document.getElementById("inspectorTableTopic");
    this.inspectorTableDesc = document.getElementById("inspectorTableDesc");
    this.inspectorTableType = document.getElementById("inspectorTableType");
    this.inspectorTableColCount = document.getElementById("inspectorTableColCount");
    this.btnCopySqlSelect = document.getElementById("btnCopySqlSelect");
    this.btnExportTableExcel = document.getElementById("btnExportTableExcel");
    this.inspectorColumnFilterInput = document.getElementById("inspectorColumnFilterInput");
    this.inspectorColumnsBody = document.getElementById("inspectorColumnsBody");

    // Word To HTML Elements
    this.btnBackToHubFromW2h = document.getElementById("btnBackToHubFromW2h");
    this.w2hDropzone = document.getElementById("w2hDropzone");
    this.w2hFilePicker = document.getElementById("w2hFilePicker");
    this.w2hFileActive = document.getElementById("w2hFileActive");
    this.w2hFileName = document.getElementById("w2hFileName");
    this.w2hFileSize = document.getElementById("w2hFileSize");
    this.btnClearW2hFile = document.getElementById("btnClearW2hFile");

    this.w2hFontFamily = document.getElementById("w2hFontFamily");
    this.w2hFontSize = document.getElementById("w2hFontSize");
    this.w2hTextColorPicker = document.getElementById("w2hTextColorPicker");
    this.w2hTextColorText = document.getElementById("w2hTextColorText");
    this.w2hTextAlign = document.getElementById("w2hTextAlign");
    this.w2hTextIndent = document.getElementById("w2hTextIndent");
    this.w2hLineHeight = document.getElementById("w2hLineHeight");
    this.w2hMarginBottom = document.getElementById("w2hMarginBottom");
    this.w2hPreserveLayoutTables = document.getElementById("w2hPreserveLayoutTables");
    this.w2hTableBorder = document.getElementById("w2hTableBorder");
    this.w2hTableHeaderBg = document.getElementById("w2hTableHeaderBg");
    this.w2hTableWidth = document.getElementById("w2hTableWidth");
    this.w2hTableZebra = document.getElementById("w2hTableZebra");
    this.w2hEmbedImages = document.getElementById("w2hEmbedImages");
    this.w2hCleanEmpty = document.getElementById("w2hCleanEmpty");
    this.w2hCollapseSpaces = document.getElementById("w2hCollapseSpaces");
    this.w2hAutoHeading = document.getElementById("w2hAutoHeading");
    this.btnResetW2hSettings = document.getElementById("btnResetW2hSettings");

    this.btnTabW2hVisual = document.getElementById("btnTabW2hVisual");
    this.btnTabW2hCode = document.getElementById("btnTabW2hCode");
    this.btnCopyHtmlCode = document.getElementById("btnCopyHtmlCode");
    this.btnCopyRichText = document.getElementById("btnCopyRichText");
    this.btnDownloadHtml = document.getElementById("btnDownloadHtml");

    this.w2hStatWords = document.getElementById("w2hStatWords");
    this.w2hStatChars = document.getElementById("w2hStatChars");
    this.w2hStatParagraphs = document.getElementById("w2hStatParagraphs");
    this.w2hStatTables = document.getElementById("w2hStatTables");
    this.w2hStatImages = document.getElementById("w2hStatImages");

    this.w2hVisualContainer = document.getElementById("w2hVisualContainer");
    this.w2hEmptyState = document.getElementById("w2hEmptyState");
    this.w2hArticleSheet = document.getElementById("w2hArticleSheet");
    this.w2hCodeContainer = document.getElementById("w2hCodeContainer");
    this.w2hHtmlRawTextarea = document.getElementById("w2hHtmlRawTextarea");

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

    // ==========================================
    // WORD TO HTML CONVERTER EVENTS
    // ==========================================
    if (this.btnBackToHubFromW2h) {
      this.btnBackToHubFromW2h.addEventListener("click", () => {
        window.location.hash = "";
      });
    }

    if (this.w2hDropzone && this.w2hFilePicker) {
      this.w2hDropzone.addEventListener("click", () => this.w2hFilePicker.click());
      this.w2hFilePicker.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleW2hFileInput(e.target.files[0]);
        }
      });

      this.w2hDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        this.w2hDropzone.classList.add("dragover");
      });
      this.w2hDropzone.addEventListener("dragleave", () => {
        this.w2hDropzone.classList.remove("dragover");
      });
      this.w2hDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        this.w2hDropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleW2hFileInput(e.dataTransfer.files[0]);
        }
      });
    }

    if (this.btnClearW2hFile) {
      this.btnClearW2hFile.addEventListener("click", (e) => {
        e.stopPropagation();
        this.currentW2hFileBuffer = null;
        this.currentW2hFileName = "";
        this.currentW2hHtmlOutput = "";
        if (this.w2hFilePicker) this.w2hFilePicker.value = "";
        this.w2hFileActive.classList.add("hidden");
        this.w2hArticleSheet.classList.add("hidden");
        this.w2hArticleSheet.innerHTML = "";
        this.w2hHtmlRawTextarea.value = "";
        this.w2hEmptyState.classList.remove("hidden");
        this.updateW2hStats({ wordCount: 0, charCount: 0, paragraphCount: 0, tableCount: 0, imageCount: 0 });
      });
    }

    // 1-Click Preset Buttons
    document.querySelectorAll(".btn-preset").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const preset = btn.dataset.preset;
        this.applyW2hPreset(preset);
      });
    });

    // Setting inputs change events -> re-convert in real-time
    const settingInputs = [
      this.w2hFontFamily, this.w2hFontSize, this.w2hTextColorPicker, this.w2hTextColorText,
      this.w2hTextAlign, this.w2hTextIndent, this.w2hLineHeight, this.w2hMarginBottom,
      this.w2hPreserveLayoutTables, this.w2hTableBorder, this.w2hTableHeaderBg, this.w2hTableWidth, this.w2hTableZebra,
      this.w2hEmbedImages, this.w2hCleanEmpty, this.w2hCollapseSpaces, this.w2hAutoHeading
    ];

    settingInputs.forEach(input => {
      if (input) {
        input.addEventListener("change", () => {
          if (input === this.w2hTextColorPicker) {
            this.w2hTextColorText.value = this.w2hTextColorPicker.value;
          } else if (input === this.w2hTextColorText) {
            this.w2hTextColorPicker.value = this.w2hTextColorText.value;
          }
          // Remove active state from preset buttons when user manually changes settings
          document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
          this.reconvertCurrentW2hDocument();
        });
      }
    });

    // Quick Color Chips
    document.querySelectorAll(".chip-color").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".chip-color").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const color = chip.dataset.color;
        if (this.w2hTextColorPicker) this.w2hTextColorPicker.value = color;
        if (this.w2hTextColorText) this.w2hTextColorText.value = color;
        this.reconvertCurrentW2hDocument();
      });
    });

    // Reset settings button
    if (this.btnResetW2hSettings) {
      this.btnResetW2hSettings.addEventListener("click", () => this.resetW2hSettings());
    }

    // Tab Switcher (Visual Preview vs HTML Source Code)
    if (this.btnTabW2hVisual) {
      this.btnTabW2hVisual.addEventListener("click", () => {
        this.w2hCurrentTab = "visual";
        this.btnTabW2hVisual.classList.add("active");
        this.btnTabW2hCode.classList.remove("active");
        this.w2hVisualContainer.classList.remove("hidden");
        this.w2hCodeContainer.classList.add("hidden");
      });
    }

    if (this.btnTabW2hCode) {
      this.btnTabW2hCode.addEventListener("click", () => {
        this.w2hCurrentTab = "code";
        this.btnTabW2hCode.classList.add("active");
        this.btnTabW2hVisual.classList.remove("active");
        this.w2hVisualContainer.classList.add("hidden");
        this.w2hCodeContainer.classList.remove("hidden");
      });
    }

    // Action buttons
    if (this.btnCopyHtmlCode) {
      this.btnCopyHtmlCode.addEventListener("click", () => this.copyW2hHtmlCode());
    }
    if (this.btnCopyRichText) {
      this.btnCopyRichText.addEventListener("click", () => this.copyW2hRichText());
    }
    if (this.btnDownloadHtml) {
      this.btnDownloadHtml.addEventListener("click", () => this.downloadW2hHtml());
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
    } else if (hash === "word-to-html") {
      this.showWordToHtmlView();
    } else {
      const tool = window.getToolById(hash);
      if (tool) {
        if (tool.id === "word-to-html") {
          this.showWordToHtmlView();
        } else {
          this.showToolView(tool.id);
        }
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
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "hub");
    });
  }

  showSchemaView() {
    this.currentToolId = "schema-lookup";
    this.hubView.classList.add("hidden");
    this.toolView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
    this.schemaView.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "schema-lookup");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    // Khởi tạo chế độ Tra cứu theo Tên Bảng lên đầu và ô tìm kiếm hoàn toàn trống
    this.schemaSearchMode = "table";
    if (this.btnModeTable) this.btnModeTable.classList.add("active");
    if (this.btnModeColumn) this.btnModeColumn.classList.remove("active");
    if (this.schemaSearchInput) {
      this.schemaSearchInput.value = "";
      this.schemaSearchInput.placeholder = "Nhập tên bảng hoặc chủ đề (ví dụ: hms_patient, hms_doc, m_transaction, sys_user, viện phí, kho dược)...";
    }
    if (this.btnClearSchemaSearch) this.btnClearSchemaSearch.classList.add("hidden");
    this.performSchemaSearch();
  }

  showWordToHtmlView() {
    this.currentToolId = "word-to-html";
    this.hubView.classList.add("hidden");
    this.toolView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "word-to-html");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showToolView(toolId) {
    if (toolId === "schema-lookup") {
      this.showSchemaView();
      return;
    }
    if (toolId === "word-to-html") {
      this.showWordToHtmlView();
      return;
    }

    const tool = window.getToolById(toolId);
    if (!tool) return;

    this.currentToolId = toolId;
    this.hubView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
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

    // KHI Ô TÌM KIẾM TRỐNG: Hiển thị đầy đủ toàn bộ danh sách các bảng dữ liệu
    if (!query) {
      const allTables = window.schemaLookupEngine.searchByTable("", section, prefix);
      this.schemaResultCount.textContent = `Danh sách toàn bộ ${allTables.length} bảng CSDL VIMES (Nhập từ khóa để tìm biến hoặc bảng)`;

      if (allTables.length === 0) {
        this.schemaResultsList.innerHTML = `
          <div class="schema-no-results">
            <span>🔍 Không có bảng nào phù hợp với bộ lọc phân hệ/tiền tố</span>
          </div>
        `;
        return;
      }

      allTables.forEach((tbl, idx) => {
        const row = document.createElement("div");
        row.className = "schema-item-card";
        row.innerHTML = `
          <div class="item-card-top">
            <span class="item-tbl-title">📋 <strong>${tbl.name}</strong></span>
            <span class="item-col-badge">${tbl.columns.length} cột</span>
          </div>
          <div class="item-card-desc">
            <span>🏢 <strong>${tbl.title || tbl.name}</strong></span>
          </div>
          <div class="item-card-bottom">
            <span class="item-topic-badge">${tbl.topic || tbl.section}</span>
            <span class="item-badge-type">${tbl.type}</span>
          </div>
        `;

        row.addEventListener("click", () => {
          this.inspectTable(tbl.name);
          this.schemaResultsList.querySelectorAll(".schema-item-card").forEach(c => c.classList.remove("selected"));
          row.classList.add("selected");
        });

        this.schemaResultsList.appendChild(row);
      });

      // Tự động kiểm tra bảng đầu tiên nếu chưa có bảng nào được chọn
      if (!this.currentInspectedTable && allTables.length > 0) {
        this.inspectTable(allTables[0].name);
        this.schemaResultsList.querySelector(".schema-item-card")?.classList.add("selected");
      }
      return;
    }

    // KHI CÓ TỪ KHÓA TÌM KIẾM:
    if (this.schemaSearchMode === "column") {
      const results = window.schemaLookupEngine.searchByColumn(query, section, prefix);
      this.schemaResultCount.textContent = `Tìm thấy ${results.length} vị trí biến khớp từ khóa "${query}"`;

      if (results.length === 0) {
        this.schemaResultsList.innerHTML = `
          <div class="schema-no-results">
            <span>🔍 Không tìm thấy biến hoặc ý nghĩa nào chứa "<strong>${query}</strong>"</span>
          </div>
        `;
        return;
      }

      // Render column cards with Vietnamese meaning and topic
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
          <div class="item-card-desc">
            <span>💡 <strong>${item.colDesc}</strong></span>
          </div>
          <div class="item-card-bottom">
            <span class="item-tbl-name" title="${item.tableName} (${item.tableTitle})">📋 ${item.tableName} &bull; ${item.tableTitle}</span>
            <span class="item-topic-badge">${item.tableTopic}</span>
          </div>
        `;

        row.addEventListener("click", () => {
          this.inspectTable(item.tableName, item.colName);
          this.schemaResultsList.querySelectorAll(".schema-item-card").forEach(c => c.classList.remove("selected"));
          row.classList.add("selected");
        });

        this.schemaResultsList.appendChild(row);
      });

      if (results.length > 0) {
        this.inspectTable(results[0].tableName, results[0].colName);
        this.schemaResultsList.querySelector(".schema-item-card")?.classList.add("selected");
      }

    } else {
      // Table search mode
      const results = window.schemaLookupEngine.searchByTable(query, section, prefix);
      this.schemaResultCount.textContent = `Tìm thấy ${results.length} bảng khớp từ khóa "${query}"`;

      if (results.length === 0) {
        this.schemaResultsList.innerHTML = `
          <div class="schema-no-results">
            <span>🔍 Không tìm thấy bảng nào chứa "<strong>${query}</strong>"</span>
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
          <div class="item-card-desc">
            <span>🏢 <strong>${tbl.title || tbl.name}</strong></span>
          </div>
          <div class="item-card-bottom">
            <span class="item-topic-badge">${tbl.topic || tbl.section}</span>
            <span class="item-badge-type">${tbl.type}</span>
          </div>
        `;

        row.addEventListener("click", () => {
          this.inspectTable(tbl.name);
          this.schemaResultsList.querySelectorAll(".schema-item-card").forEach(c => c.classList.remove("selected"));
          row.classList.add("selected");
        });

        this.schemaResultsList.appendChild(row);
      });

      if (results.length > 0) {
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
    this.inspectorTableVnTitle.textContent = table.title || table.name;
    this.inspectorTableTopic.textContent = table.topic || table.section;
    this.inspectorTableDesc.textContent = table.description || `Bảng dữ liệu ${table.name}`;
    this.inspectorTableType.textContent = table.type;
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
        <td style="text-align: center; color: var(--text-muted); font-weight: 600;">${idx + 1}</td>
        <td>
          <span class="col-name-link ${col.isPk ? 'is-pk' : ''}" title="Bấm để tìm tất cả bảng có chứa biến ${col.name}">
            ${col.isPk ? '🔑 ' : ''}<strong>${col.name}</strong>
          </span>
        </td>
        <td>
          <span class="col-vn-desc">${col.description || 'Trường dữ liệu'}</span>
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
    const termNorm = DocxTableParser ? DocxTableParser.removeAccents(term) : term;

    const filtered = this.currentInspectedTable.columns.filter(c => {
      const cNameNorm = DocxTableParser ? DocxTableParser.removeAccents(c.name.toLowerCase()) : c.name.toLowerCase();
      const cDescNorm = DocxTableParser ? DocxTableParser.removeAccents((c.description || "").toLowerCase()) : (c.description || "").toLowerCase();
      const cTypeNorm = (c.type || "").toLowerCase();

      return cNameNorm.includes(termNorm) || cDescNorm.includes(termNorm) || cTypeNorm.includes(term);
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

    // Title Row
    ws.addRow([`TỪ ĐIỂN CẤU TRÚC BẢNG: ${table.name} - ${table.title || ''}`]);
    ws.addRow([`Chủ đề: ${table.topic || table.section} | Tổng số cột: ${table.columns.length}`]);
    ws.addRow([]);

    // Headers
    ws.addRow(["STT", "Tên Biến / Cột", "Ý Nghĩa / Ghi Chú Nghiệp Vụ (Tiếng Việt)", "Kiểu Dữ Liệu", "Khóa Chính (PK)", "Cho Phép NULL", "Giá Trị Mặc Định"]);
    const headerRow = ws.getRow(4);
    headerRow.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    table.columns.forEach((c, idx) => {
      const row = ws.addRow([
        idx + 1,
        c.name,
        c.description || "",
        c.type,
        c.isPk ? "YES (PK)" : "NO",
        c.nullable ? "YES" : "NO",
        c.default || ""
      ]);
      row.font = { name: "Arial", size: 10 };
      row.alignment = { vertical: "middle" };
      row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(5).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(6).alignment = { vertical: "middle", horizontal: "center" };
    });

    ws.columns = [
      { width: 8 },
      { width: 28 },
      { width: 45 },
      { width: 22 },
      { width: 16 },
      { width: 16 },
      { width: 35 }
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
  // WORD TO HTML CONVERTER METHODS
  // =========================================================================
  getW2hCurrentOptions() {
    return {
      fontFamily: this.w2hFontFamily ? this.w2hFontFamily.value : "Arial, sans-serif",
      baseFontSize: this.w2hFontSize ? this.w2hFontSize.value : "16px",
      textColor: this.w2hTextColorText ? this.w2hTextColorText.value : "#333333",
      textAlign: this.w2hTextAlign ? this.w2hTextAlign.value : "justify",
      textIndent: this.w2hTextIndent ? this.w2hTextIndent.value : "none",
      lineHeight: this.w2hLineHeight ? this.w2hLineHeight.value : "1.6",
      paragraphMarginBottom: this.w2hMarginBottom ? this.w2hMarginBottom.value : "10px",
      preserveLayoutTables: this.w2hPreserveLayoutTables ? this.w2hPreserveLayoutTables.checked : true,
      tableFullBorder: this.w2hTableBorder ? this.w2hTableBorder.checked : true,
      tableHeaderBg: this.w2hTableHeaderBg ? (this.w2hTableHeaderBg.checked ? "#f1f5f9" : "") : "#f1f5f9",
      tableFullWidth: this.w2hTableWidth ? this.w2hTableWidth.checked : true,
      tableZebra: this.w2hTableZebra ? this.w2hTableZebra.checked : false,
      embedImagesBase64: this.w2hEmbedImages ? this.w2hEmbedImages.checked : true,
      cleanEmptyParagraphs: this.w2hCleanEmpty ? this.w2hCleanEmpty.checked : true,
      collapseSpaces: this.w2hCollapseSpaces ? this.w2hCollapseSpaces.checked : true,
      autoHeading: this.w2hAutoHeading ? this.w2hAutoHeading.checked : true
    };
  }

  async handleW2hFileInput(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      this.showToast("Chỉ hỗ trợ tệp định dạng Word (.docx)!", "warning");
      return;
    }

    try {
      this.currentW2hFileName = file.name;
      this.currentW2hFileBuffer = await file.arrayBuffer();

      if (this.w2hFileName) this.w2hFileName.textContent = file.name;
      if (this.w2hFileSize) this.w2hFileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      if (this.w2hFileActive) this.w2hFileActive.classList.remove("hidden");

      await this.reconvertCurrentW2hDocument();
      this.showToast(`Đã chuyển đổi thành công tệp ${file.name}!`, "success");
    } catch (err) {
      console.error("Lỗi đọc file Word:", err);
      this.showToast(`Lỗi chuyển đổi: ${err.message}`, "error");
    }
  }

  async reconvertCurrentW2hDocument() {
    if (!this.currentW2hFileBuffer) return;

    const options = this.getW2hCurrentOptions();
    this.w2hConverter.setOptions(options);

    try {
      const result = await this.w2hConverter.convertDocxToHtml(this.currentW2hFileBuffer, this.currentW2hFileName);
      this.currentW2hHtmlOutput = result.html;

      // Update Visual Preview Sheet
      if (this.w2hArticleSheet) {
        this.w2hArticleSheet.innerHTML = result.html;
        this.w2hArticleSheet.classList.remove("hidden");
      }
      if (this.w2hEmptyState) {
        this.w2hEmptyState.classList.add("hidden");
      }

      // Update Raw HTML Code Textarea
      if (this.w2hHtmlRawTextarea) {
        this.w2hHtmlRawTextarea.value = result.html;
      }

      // Update Stats
      this.updateW2hStats(result.stats);
    } catch (err) {
      console.error("Lỗi chuyển đổi Word to HTML:", err);
      this.showToast(`Lỗi xử lý file: ${err.message}`, "error");
    }
  }

  updateW2hStats(stats) {
    if (this.w2hStatWords) this.w2hStatWords.textContent = (stats.wordCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatChars) this.w2hStatChars.textContent = (stats.charCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatParagraphs) this.w2hStatParagraphs.textContent = (stats.paragraphCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatTables) this.w2hStatTables.textContent = (stats.tableCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatImages) this.w2hStatImages.textContent = (stats.imageCount || 0).toLocaleString("vi-VN");
  }

  async copyW2hHtmlCode() {
    if (!this.currentW2hHtmlOutput) {
      this.showToast("Chưa có nội dung để sao chép!", "warning");
      return;
    }
    try {
      await navigator.clipboard.writeText(this.currentW2hHtmlOutput);
      this.showToast("Đã sao chép mã HTML & Inline CSS! Dán vào tab [Mã HTML / Source] của CMS.", "success");
    } catch (err) {
      if (this.w2hHtmlRawTextarea) {
        this.w2hHtmlRawTextarea.select();
        document.execCommand("copy");
      }
      this.showToast("Đã sao chép mã HTML vào Clipboard!", "success");
    }
  }

  async copyW2hRichText() {
    if (!this.currentW2hHtmlOutput) {
      this.showToast("Chưa có nội dung để sao chép!", "warning");
      return;
    }
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([this.currentW2hHtmlOutput], { type: "text/html" });
        const blobText = new Blob([this.w2hArticleSheet.innerText || ""], { type: "text/plain" });
        const item = new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText
        });
        await navigator.clipboard.write([item]);
        this.showToast("Đã sao chép Rich Text! Bạn có thể dán trực tiếp vào khung soạn thảo bình thường.", "success");
      } else {
        const range = document.createRange();
        range.selectNodeContents(this.w2hArticleSheet);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
        this.showToast("Đã sao chép nội dung định dạng vào Clipboard!", "success");
      }
    } catch (err) {
      console.error("Lỗi copy rich text:", err);
      this.showToast("Trình duyệt chặn sao chép Rich Text. Vui lòng dùng nút 'Sao chép mã HTML'.", "warning");
    }
  }

  downloadW2hHtml() {
    if (!this.currentW2hHtmlOutput) {
      this.showToast("Chưa có nội dung để tải về!", "warning");
      return;
    }
    const font = this.w2hFontFamily ? this.w2hFontFamily.value : "Arial, sans-serif";
    const color = this.w2hTextColorText ? this.w2hTextColorText.value : "#333333";
    const docTitle = this.currentW2hFileName ? this.currentW2hFileName.replace(/\.docx$/i, "") : "Bai_viet_Website";

    const fullHtmlDoc = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f8fafc; display: flex; justify-content: center;">
  <div style="background: #ffffff; max-width: 860px; width: 100%; padding: 40px 48px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); font-family: ${font}; color: ${color}; line-height: 1.6;">
${this.currentW2hHtmlOutput}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtmlDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle}_Website.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast("Đã tải tệp HTML thành công!", "success");
  }

  applyW2hPreset(preset) {
    if (preset === "article") {
      if (this.w2hFontFamily) this.w2hFontFamily.value = "'Times New Roman', Times, serif";
      if (this.w2hFontSize) this.w2hFontSize.value = "16px";
      if (this.w2hTextColorPicker) this.w2hTextColorPicker.value = "#333333";
      if (this.w2hTextColorText) this.w2hTextColorText.value = "#333333";
      if (this.w2hTextAlign) this.w2hTextAlign.value = "justify";
      if (this.w2hTextIndent) this.w2hTextIndent.value = "none";
      if (this.w2hLineHeight) this.w2hLineHeight.value = "1.6";
      if (this.w2hMarginBottom) this.w2hMarginBottom.value = "6px";
      if (this.w2hPreserveLayoutTables) this.w2hPreserveLayoutTables.checked = true;
      if (this.w2hTableBorder) this.w2hTableBorder.checked = true;
      if (this.w2hTableHeaderBg) this.w2hTableHeaderBg.checked = true;
      if (this.w2hTableZebra) this.w2hTableZebra.checked = false;
      if (this.w2hCollapseSpaces) this.w2hCollapseSpaces.checked = true;
      if (this.w2hAutoHeading) this.w2hAutoHeading.checked = false;
    } else if (preset === "admin") {
      if (this.w2hFontFamily) this.w2hFontFamily.value = "'Times New Roman', Times, serif";
      if (this.w2hFontSize) this.w2hFontSize.value = "15px";
      if (this.w2hTextColorPicker) this.w2hTextColorPicker.value = "#000000";
      if (this.w2hTextColorText) this.w2hTextColorText.value = "#000000";
      if (this.w2hTextAlign) this.w2hTextAlign.value = "justify";
      if (this.w2hTextIndent) this.w2hTextIndent.value = "1.5em";
      if (this.w2hLineHeight) this.w2hLineHeight.value = "1.45";
      if (this.w2hMarginBottom) this.w2hMarginBottom.value = "6px";
      if (this.w2hPreserveLayoutTables) this.w2hPreserveLayoutTables.checked = true;
      if (this.w2hTableBorder) this.w2hTableBorder.checked = true;
      if (this.w2hTableHeaderBg) this.w2hTableHeaderBg.checked = true;
      if (this.w2hTableZebra) this.w2hTableZebra.checked = false;
      if (this.w2hCollapseSpaces) this.w2hCollapseSpaces.checked = true;
      if (this.w2hAutoHeading) this.w2hAutoHeading.checked = false;
    } else if (preset === "medical") {
      if (this.w2hFontFamily) this.w2hFontFamily.value = "Arial, sans-serif";
      if (this.w2hFontSize) this.w2hFontSize.value = "15px";
      if (this.w2hTextColorPicker) this.w2hTextColorPicker.value = "#1e293b";
      if (this.w2hTextColorText) this.w2hTextColorText.value = "#1e293b";
      if (this.w2hTextAlign) this.w2hTextAlign.value = "justify";
      if (this.w2hTextIndent) this.w2hTextIndent.value = "none";
      if (this.w2hLineHeight) this.w2hLineHeight.value = "1.55";
      if (this.w2hMarginBottom) this.w2hMarginBottom.value = "8px";
      if (this.w2hPreserveLayoutTables) this.w2hPreserveLayoutTables.checked = true;
      if (this.w2hTableBorder) this.w2hTableBorder.checked = true;
      if (this.w2hTableHeaderBg) this.w2hTableHeaderBg.checked = true;
      if (this.w2hTableZebra) this.w2hTableZebra.checked = true;
      if (this.w2hCollapseSpaces) this.w2hCollapseSpaces.checked = true;
      if (this.w2hAutoHeading) this.w2hAutoHeading.checked = true;
    } else if (preset === "compact") {
      if (this.w2hFontFamily) this.w2hFontFamily.value = "'Times New Roman', Times, serif";
      if (this.w2hFontSize) this.w2hFontSize.value = "14px";
      if (this.w2hTextColorPicker) this.w2hTextColorPicker.value = "#222222";
      if (this.w2hTextColorText) this.w2hTextColorText.value = "#222222";
      if (this.w2hTextAlign) this.w2hTextAlign.value = "left";
      if (this.w2hTextIndent) this.w2hTextIndent.value = "none";
      if (this.w2hLineHeight) this.w2hLineHeight.value = "1.4";
      if (this.w2hMarginBottom) this.w2hMarginBottom.value = "4px";
      if (this.w2hPreserveLayoutTables) this.w2hPreserveLayoutTables.checked = true;
      if (this.w2hTableBorder) this.w2hTableBorder.checked = true;
      if (this.w2hTableHeaderBg) this.w2hTableHeaderBg.checked = true;
      if (this.w2hTableZebra) this.w2hTableZebra.checked = false;
      if (this.w2hCollapseSpaces) this.w2hCollapseSpaces.checked = true;
      if (this.w2hAutoHeading) this.w2hAutoHeading.checked = true;
    }

    document.querySelectorAll(".chip-color").forEach(c => {
      c.classList.toggle("active", c.dataset.color === this.w2hTextColorText.value);
    });

    this.reconvertCurrentW2hDocument();
  }

  resetW2hSettings() {
    if (this.w2hFontFamily) this.w2hFontFamily.value = "'Times New Roman', Times, serif";
    if (this.w2hFontSize) this.w2hFontSize.value = "16px";
    if (this.w2hTextColorPicker) this.w2hTextColorPicker.value = "#333333";
    if (this.w2hTextColorText) this.w2hTextColorText.value = "#333333";
    if (this.w2hTextAlign) this.w2hTextAlign.value = "justify";
    if (this.w2hTextIndent) this.w2hTextIndent.value = "none";
    if (this.w2hLineHeight) this.w2hLineHeight.value = "1.6";
    if (this.w2hMarginBottom) this.w2hMarginBottom.value = "6px";
    if (this.w2hPreserveLayoutTables) this.w2hPreserveLayoutTables.checked = true;
    if (this.w2hTableBorder) this.w2hTableBorder.checked = true;
    if (this.w2hTableHeaderBg) this.w2hTableHeaderBg.checked = true;
    if (this.w2hTableWidth) this.w2hTableWidth.checked = true;
    if (this.w2hTableZebra) this.w2hTableZebra.checked = false;
    if (this.w2hEmbedImages) this.w2hEmbedImages.checked = true;
    if (this.w2hCleanEmpty) this.w2hCleanEmpty.checked = true;
    if (this.w2hCollapseSpaces) this.w2hCollapseSpaces.checked = true;
    if (this.w2hAutoHeading) this.w2hAutoHeading.checked = false;

    document.querySelectorAll(".chip-color").forEach(c => {
      c.classList.toggle("active", c.dataset.color === "#333333");
    });

    document.querySelectorAll(".btn-preset").forEach(b => {
      b.classList.toggle("active", b.dataset.preset === "article");
    });

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
