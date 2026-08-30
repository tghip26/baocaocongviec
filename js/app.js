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

    // PDF to Image Converter State
    this.pdfConverter = new PdfToImageConverter();
    this.currentPdfBuffer = null;
    this.currentPdfFileName = "";
    this.currentLightboxPage = 1;

    this.initElements();
    this.initEvents();
    this.loadOrgConfigToUi();
    this.loadSavePathsToUi();
    this.renderToolGrid();
    this.handleUrlHash();
  }

  initElements() {
    // Navigation & Views
    this.sidebar = document.getElementById("sidebar");
    this.sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
    this.btnSidebarClose = document.getElementById("btnSidebarClose");
    this.sidebarBackdrop = document.getElementById("sidebarBackdrop");
    this.sidebarNav = document.getElementById("sidebarNav");
    this.hubView = document.getElementById("hubView");
    this.toolView = document.getElementById("toolView");
    this.schemaView = document.getElementById("schemaView");
    this.wordToHtmlView = document.getElementById("wordToHtmlView");
    this.pdfToImageView = document.getElementById("pdfToImageView");
    this.categoryFilter = document.getElementById("categoryFilter");
    this.toolCardsContainer = document.getElementById("toolCardsContainer");
    this.globalSearchInput = document.getElementById("globalSearchInput");

    // PDF to Image Elements
    this.btnBackToHubFromPdf = document.getElementById("btnBackToHubFromPdf");
    this.pdfLayoutGrid = document.getElementById("pdfLayoutGrid");
    this.pdfControlPanel = document.getElementById("pdfControlPanel");
    this.pdfDropzone = document.getElementById("pdfDropzone");
    this.pdfFilePicker = document.getElementById("pdfFilePicker");
    this.pdfFileInfoCard = document.getElementById("pdfFileInfoCard");
    this.pdfFileNameDisplay = document.getElementById("pdfFileNameDisplay");
    this.pdfFileSizeDisplay = document.getElementById("pdfFileSizeDisplay");
    this.pdfPageCountDisplay = document.getElementById("pdfPageCountDisplay");
    this.btnRemovePdf = document.getElementById("btnRemovePdf");

    this.btnPdfSelectAll = document.getElementById("btnPdfSelectAll");
    this.btnPdfDeselectAll = document.getElementById("btnPdfDeselectAll");
    this.btnPdfSelectOdd = document.getElementById("btnPdfSelectOdd");
    this.btnPdfSelectEven = document.getElementById("btnPdfSelectEven");
    this.btnPdfInvertSelection = document.getElementById("btnPdfInvertSelection");
    this.pdfRangeInput = document.getElementById("pdfRangeInput");
    this.btnPdfApplyRange = document.getElementById("btnPdfApplyRange");

    this.pdfExportFormat = document.getElementById("pdfExportFormat");
    this.pdfExportScale = document.getElementById("pdfExportScale");
    this.pdfImageFilter = document.getElementById("pdfImageFilter");
    this.pdfExportQuality = document.getElementById("pdfExportQuality");
    this.groupPdfQuality = document.getElementById("groupPdfQuality");
    this.pdfFilenamePrefix = document.getElementById("pdfFilenamePrefix");

    this.btnPdfDownloadZip = document.getElementById("btnPdfDownloadZip");
    this.btnPdfMergeLongImage = document.getElementById("btnPdfMergeLongImage");
    this.btnPdfRotateAll = document.getElementById("btnPdfRotateAll");
    this.btnPdfDownloadIndividual = document.getElementById("btnPdfDownloadIndividual");
    this.btnPdfCopyHtmlImg = document.getElementById("btnPdfCopyHtmlImg");

    this.pdfStatsSummary = document.getElementById("pdfStatsSummary");
    this.btnToggleSidebarPdf = document.getElementById("btnToggleSidebarPdf");
    this.txtToggleSidebarPdf = document.getElementById("txtToggleSidebarPdf");
    this.btnToggleFullscreenPdf = document.getElementById("btnToggleFullscreenPdf");
    this.txtFullscreenPdf = document.getElementById("txtFullscreenPdf");

    this.pdfProgressBarContainer = document.getElementById("pdfProgressBarContainer");
    this.pdfProgressLabel = document.getElementById("pdfProgressLabel");
    this.pdfProgressPercent = document.getElementById("pdfProgressPercent");
    this.pdfProgressBarFill = document.getElementById("pdfProgressBarFill");

    this.pdfEmptyState = document.getElementById("pdfEmptyState");
    this.pdfPageGrid = document.getElementById("pdfPageGrid");

    // PDF Lightbox Modal
    this.modalPdfLightbox = document.getElementById("modalPdfLightbox");
    this.lightboxPageTag = document.getElementById("lightboxPageTag");
    this.lightboxFilename = document.getElementById("lightboxFilename");
    this.pdfLightboxImg = document.getElementById("pdfLightboxImg");
    this.btnLightboxDownload = document.getElementById("btnLightboxDownload");
    this.btnLightboxCopy = document.getElementById("btnLightboxCopy");
    this.btnClosePdfLightbox = document.getElementById("btnClosePdfLightbox");
    this.btnLightboxPrev = document.getElementById("btnLightboxPrev");
    this.btnLightboxNext = document.getElementById("btnLightboxNext");

    // Tool View Elements
    this.btnBackToHub = document.getElementById("btnBackToHub");
    this.btnBackToHubFromW2h = document.getElementById("btnBackToHubFromW2h");
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
    this.cfgPathGiamDinh = document.getElementById("cfgPathGiamDinh");
    this.cfgPathW2h = document.getElementById("cfgPathW2h");
    this.cfgPathPdf = document.getElementById("cfgPathPdf");
    this.cfgPathVgca = document.getElementById("cfgPathVgca");
    this.w2hSavePathInput = document.getElementById("w2hSavePathInput");
    this.btnBrowseW2hSavePath = document.getElementById("btnBrowseW2hSavePath");
    this.pdfSavePathInput = document.getElementById("pdfSavePathInput");
    this.btnBrowsePdfSavePath = document.getElementById("btnBrowsePdfSavePath");
    this.toolSavePathVal = document.getElementById("toolSavePathVal");
    this.btnChangeSavePathTool = document.getElementById("btnChangeSavePathTool");
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
    this.w2hAutoFilterBoundaries = document.getElementById("w2hAutoFilterBoundaries");
    this.w2hUnboldAll = document.getElementById("w2hUnboldAll");
    this.w2hTableBorder = document.getElementById("w2hTableBorder");
    this.w2hCleanEmpty = document.getElementById("w2hCleanEmpty");
    this.btnResetW2hSettings = document.getElementById("btnResetW2hSettings");

    // Viewport Switcher Elements
    this.btnViewportDesktop = document.getElementById("btnViewportDesktop");
    this.btnViewportTablet = document.getElementById("btnViewportTablet");
    this.btnViewportMobile = document.getElementById("btnViewportMobile");

    // HTML Action Tools
    this.btnCleanGarbageHtml = document.getElementById("btnCleanGarbageHtml");
    this.btnBeautifyHtml = document.getElementById("btnBeautifyHtml");
    this.btnMinifyHtml = document.getElementById("btnMinifyHtml");
    this.btnExportMarkdown = document.getElementById("btnExportMarkdown");

    // Image URL controls
    this.w2hThauImageControls = document.getElementById("w2hThauImageControls");
    this.w2hCtxhImageControls = document.getElementById("w2hCtxhImageControls");
    this.w2hThauTopImageUrl = document.getElementById("w2hThauTopImageUrl");
    this.w2hThauTopImageCaption = document.getElementById("w2hThauTopImageCaption");
    this.w2hThauBottomImageUrl = document.getElementById("w2hThauBottomImageUrl");
    this.w2hThauBottomImageCaption = document.getElementById("w2hThauBottomImageCaption");
    this.w2hCtxhImageUrls = document.getElementById("w2hCtxhImageUrls");

    this.btnToggleFullscreenW2h = document.getElementById("btnToggleFullscreenW2h");
    this.txtFullscreenBtn = document.getElementById("txtFullscreenBtn");
    this.btnToggleSidebarW2h = document.getElementById("btnToggleSidebarW2h");
    this.txtToggleSidebar = document.getElementById("txtToggleSidebar");
    this.w2hLayoutGrid = document.querySelector(".w2h-layout-grid");
    this.wordToHtmlView = document.getElementById("wordToHtmlView");

    this.btnTabW2hVisual = document.getElementById("btnTabW2hVisual");
    this.btnTabW2hCode = document.getElementById("btnTabW2hCode");
    this.btnTabW2hSplit = document.getElementById("btnTabW2hSplit");
    this.btnRevertOriginalHtml = document.getElementById("btnRevertOriginalHtml");
    this.btnCopyHtmlCode = document.getElementById("btnCopyHtmlCode");
    this.btnCopyRichText = document.getElementById("btnCopyRichText");
    this.btnDownloadHtml = document.getElementById("btnDownloadHtml");

    this.w2hStatWords = document.getElementById("w2hStatWords");
    this.w2hStatChars = document.getElementById("w2hStatChars");
    this.w2hStatParagraphs = document.getElementById("w2hStatParagraphs");
    this.w2hStatTables = document.getElementById("w2hStatTables");
    this.w2hStatImages = document.getElementById("w2hStatImages");
    this.w2hStatReadingTime = document.getElementById("w2hStatReadingTime");

    this.w2hDisplayWorkspace = document.getElementById("w2hDisplayWorkspace");
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

    // Mobile Sidebar Drawer Toggle
    if (this.sidebarToggleBtn) {
      this.sidebarToggleBtn.addEventListener("click", () => {
        if (!this.sidebar) return;
        const isOpen = this.sidebar.classList.toggle("open");
        if (this.sidebarBackdrop) {
          this.sidebarBackdrop.classList.toggle("active", isOpen);
        }
      });
    }

    // Mobile Sidebar Close Button
    if (this.btnSidebarClose) {
      this.btnSidebarClose.addEventListener("click", () => {
        if (this.sidebar) this.sidebar.classList.remove("open");
        if (this.sidebarBackdrop) this.sidebarBackdrop.classList.remove("active");
      });
    }

    // Tap outside (backdrop) to close sidebar
    if (this.sidebarBackdrop) {
      this.sidebarBackdrop.addEventListener("click", () => {
        if (this.sidebar) this.sidebar.classList.remove("open");
        this.sidebarBackdrop.classList.remove("active");
      });
    }

    // Auto-close sidebar on mobile when any menu link is tapped
    if (this.sidebarNav) {
      this.sidebarNav.addEventListener("click", (e) => {
        const navItem = e.target.closest(".nav-item");
        if (navItem && window.innerWidth <= 768) {
          if (this.sidebar) this.sidebar.classList.remove("open");
          if (this.sidebarBackdrop) this.sidebarBackdrop.classList.remove("active");
        }
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
    if (this.btnBackToHubFromW2h) {
      this.btnBackToHubFromW2h.addEventListener("click", () => {
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

      const paths = this.getSavePathConfig();
      if (this.cfgPathGiamDinh) this.cfgPathGiamDinh.value = paths.giamdinh;
      if (this.cfgPathW2h) this.cfgPathW2h.value = paths.w2h;
      if (this.cfgPathPdf) this.cfgPathPdf.value = paths.pdf;
      if (this.cfgPathVgca) this.cfgPathVgca.value = paths.vgca;

      this.showModal(this.modalConfig);
    };

    if (this.btnOpenConfigHeader) this.btnOpenConfigHeader.addEventListener("click", openConfigModal);
    if (this.btnOpenConfigSidebar) this.btnOpenConfigSidebar.addEventListener("click", openConfigModal);
    if (this.btnEditOrgInline) this.btnEditOrgInline.addEventListener("click", openConfigModal);
    if (this.btnChangeSavePathTool) this.btnChangeSavePathTool.addEventListener("click", openConfigModal);
    if (this.btnCloseConfigModal) this.btnCloseConfigModal.addEventListener("click", () => this.hideModal(this.modalConfig));

    // Save Path Browse Events
    if (this.btnBrowseW2hSavePath) {
      this.btnBrowseW2hSavePath.addEventListener("click", () => {
        this.selectDirectoryForInput(this.w2hSavePathInput, "w2h");
      });
    }

    if (this.w2hSavePathInput) {
      this.w2hSavePathInput.addEventListener("change", () => {
        const paths = this.getSavePathConfig();
        paths.w2h = this.w2hSavePathInput.value.trim() || "D:\\Website_CMS\\";
        this.savePathConfig(paths);
        this.showToast(`Đã lưu đường dẫn HTML: ${paths.w2h}`, "success");
      });
    }

    if (this.btnBrowsePdfSavePath) {
      this.btnBrowsePdfSavePath.addEventListener("click", () => {
        this.selectDirectoryForInput(this.pdfSavePathInput, "pdf");
      });
    }

    if (this.pdfSavePathInput) {
      this.pdfSavePathInput.addEventListener("change", () => {
        const paths = this.getSavePathConfig();
        paths.pdf = this.pdfSavePathInput.value.trim() || "D:\\XuatAnhPDF\\";
        this.savePathConfig(paths);
        this.showToast(`Đã lưu đường dẫn Ảnh PDF: ${paths.pdf}`, "success");
      });
    }

    document.querySelectorAll(".btn-browse-folder").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;
        const targetInput = document.getElementById(targetId);
        let pathKey = "giamdinh";
        if (targetId === "cfgPathW2h") pathKey = "w2h";
        else if (targetId === "cfgPathPdf") pathKey = "pdf";
        else if (targetId === "cfgPathVgca") pathKey = "vgca";
        this.selectDirectoryForInput(targetInput, pathKey);
      });
    });

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

        const newPaths = {
          giamdinh: this.cfgPathGiamDinh ? this.cfgPathGiamDinh.value.trim() || "D:\\BaoCao\\GiamDinh\\" : "D:\\BaoCao\\GiamDinh\\",
          w2h: this.cfgPathW2h ? this.cfgPathW2h.value.trim() || "D:\\Website_CMS\\" : "D:\\Website_CMS\\",
          pdf: this.cfgPathPdf ? this.cfgPathPdf.value.trim() || "D:\\XuatAnhPDF\\" : "D:\\XuatAnhPDF\\",
          vgca: this.cfgPathVgca ? this.cfgPathVgca.value.trim() || "D:\\VGCA\\" : "D:\\VGCA\\",
          schema: "D:\\Database_Schema\\"
        };
        this.savePathConfig(newPaths);

        this.hideModal(this.modalConfig);
        this.showToast("Đã lưu cấu hình đơn vị & đường dẫn lưu tệp thành công!", "success");
      });
    }

    if (this.btnResetConfigDefault) {
      this.btnResetConfigDefault.addEventListener("click", () => {
        localStorage.removeItem("APP_ORG_CONFIG");
        localStorage.removeItem("APP_SAVE_PATHS");
        this.loadOrgConfigToUi();
        this.loadSavePathsToUi();
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

    // 1-Click Preset Buttons (Bài CTXH vs Bài Thầu)
    document.querySelectorAll(".btn-preset").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const preset = btn.dataset.preset;
        this.applyW2hPreset(preset);
      });
    });

    // Image URL text input events -> live update conversion
    const imgInputs = [
      this.w2hThauTopImageUrl, this.w2hThauTopImageCaption,
      this.w2hThauBottomImageUrl, this.w2hThauBottomImageCaption,
      this.w2hCtxhImageUrls
    ];

    imgInputs.forEach(inp => {
      if (inp) {
        inp.addEventListener("input", () => this.reconvertCurrentW2hDocument());
      }
    });

    // Setting inputs change events -> re-convert in real-time
    const settingInputs = [
      this.w2hFontFamily, this.w2hFontSize, this.w2hTextColorPicker, this.w2hTextColorText,
      this.w2hTextAlign, this.w2hTextIndent, this.w2hLineHeight, this.w2hMarginBottom,
      this.w2hAutoFilterBoundaries, this.w2hUnboldAll, this.w2hTableBorder,
      this.w2hCleanEmpty
    ];

    settingInputs.forEach(input => {
      if (input) {
        input.addEventListener("change", () => {
          if (input === this.w2hTextColorPicker) {
            this.w2hTextColorText.value = this.w2hTextColorPicker.value;
          } else if (input === this.w2hTextColorText) {
            this.w2hTextColorPicker.value = this.w2hTextColorText.value;
          }
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

    // Tab Switcher (Visual Preview vs HTML Code Editor vs Split View)
    if (this.btnTabW2hVisual) {
      this.btnTabW2hVisual.addEventListener("click", () => {
        this.w2hCurrentTab = "visual";
        this.btnTabW2hVisual.classList.add("active");
        if (this.btnTabW2hCode) this.btnTabW2hCode.classList.remove("active");
        if (this.btnTabW2hSplit) this.btnTabW2hSplit.classList.remove("active");
        if (this.w2hDisplayWorkspace) this.w2hDisplayWorkspace.classList.remove("split-mode");
        this.w2hVisualContainer.classList.remove("hidden");
        this.w2hCodeContainer.classList.add("hidden");
      });
    }

    if (this.btnTabW2hCode) {
      this.btnTabW2hCode.addEventListener("click", () => {
        this.w2hCurrentTab = "code";
        this.btnTabW2hCode.classList.add("active");
        if (this.btnTabW2hVisual) this.btnTabW2hVisual.classList.remove("active");
        if (this.btnTabW2hSplit) this.btnTabW2hSplit.classList.remove("active");
        if (this.w2hDisplayWorkspace) this.w2hDisplayWorkspace.classList.remove("split-mode");
        this.w2hVisualContainer.classList.add("hidden");
        this.w2hCodeContainer.classList.remove("hidden");
      });
    }

    if (this.btnTabW2hSplit) {
      this.btnTabW2hSplit.addEventListener("click", () => {
        this.w2hCurrentTab = "split";
        this.btnTabW2hSplit.classList.add("active");
        if (this.btnTabW2hVisual) this.btnTabW2hVisual.classList.remove("active");
        if (this.btnTabW2hCode) this.btnTabW2hCode.classList.remove("active");
        if (this.w2hDisplayWorkspace) this.w2hDisplayWorkspace.classList.add("split-mode");
        this.w2hVisualContainer.classList.remove("hidden");
        this.w2hCodeContainer.classList.remove("hidden");
      });
    }

    // Direct Live HTML Code Edit Event
    if (this.w2hHtmlRawTextarea) {
      this.w2hHtmlRawTextarea.addEventListener("input", () => {
        this.handleDirectHtmlCodeEdit();
      });
    }

    // Revert Original Word Code Button
    if (this.btnRevertOriginalHtml) {
      this.btnRevertOriginalHtml.addEventListener("click", () => {
        this.revertToOriginalWordHtml();
      });
    }

    // Toggle Fullscreen Editor
    if (this.btnToggleFullscreenW2h) {
      this.btnToggleFullscreenW2h.addEventListener("click", () => {
        if (!this.wordToHtmlView) return;
        const isFull = this.wordToHtmlView.classList.toggle("w2h-fullscreen-active");
        if (this.txtFullscreenBtn) {
          this.txtFullscreenBtn.textContent = isFull ? "🗗 Thu nhỏ" : "⛶ Phóng to";
        }
        this.btnToggleFullscreenW2h.classList.toggle("active", isFull);
      });
    }

    // Toggle Left Settings Sidebar
    if (this.btnToggleSidebarW2h) {
      this.btnToggleSidebarW2h.addEventListener("click", () => {
        if (!this.w2hLayoutGrid) return;
        const isCollapsed = this.w2hLayoutGrid.classList.toggle("sidebar-collapsed");
        if (this.txtToggleSidebar) {
          this.txtToggleSidebar.textContent = isCollapsed ? "▶ Mở cài đặt" : "◀ Thu gọn cài đặt";
        }
        this.btnToggleSidebarW2h.classList.toggle("active", isCollapsed);
      });
    }

    // ESC key exits Fullscreen
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.wordToHtmlView && this.wordToHtmlView.classList.contains("w2h-fullscreen-active")) {
        this.wordToHtmlView.classList.remove("w2h-fullscreen-active");
        if (this.txtFullscreenBtn) this.txtFullscreenBtn.textContent = "⛶ Phóng to";
        if (this.btnToggleFullscreenW2h) this.btnToggleFullscreenW2h.classList.remove("active");
      }
    });

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
    if (this.btnExportMarkdown) {
      this.btnExportMarkdown.addEventListener("click", () => this.exportW2hMarkdown());
    }

    // Viewport Switcher Handlers
    const viewports = [
      { btn: this.btnViewportDesktop, cls: "" },
      { btn: this.btnViewportTablet, cls: "viewport-tablet" },
      { btn: this.btnViewportMobile, cls: "viewport-mobile" }
    ];
    viewports.forEach(({ btn, cls }) => {
      if (btn) {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".btn-viewport").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          if (this.w2hArticleSheet) {
            this.w2hArticleSheet.classList.remove("viewport-tablet", "viewport-mobile");
            if (cls) this.w2hArticleSheet.classList.add(cls);
          }
        });
      }
    });

    // Clean, Beautify, Minify HTML Tools
    if (this.btnCleanGarbageHtml) {
      this.btnCleanGarbageHtml.addEventListener("click", () => {
        if (!this.w2hHtmlRawTextarea.value) return;
        this.w2hHtmlRawTextarea.value = this.w2hConverter.cleanGarbageTags(this.w2hHtmlRawTextarea.value);
        this.handleDirectHtmlCodeEdit();
        this.showToast("Đã dọn sạch các thẻ rác MS Word!", "success");
      });
    }

    if (this.btnBeautifyHtml) {
      this.btnBeautifyHtml.addEventListener("click", () => {
        if (!this.w2hHtmlRawTextarea.value) return;
        this.w2hHtmlRawTextarea.value = this.w2hConverter.beautifyHtml(this.w2hHtmlRawTextarea.value);
        this.handleDirectHtmlCodeEdit();
        this.showToast("Đã định dạng mã HTML thụt lề chuẩn!", "success");
      });
    }

    if (this.btnMinifyHtml) {
      this.btnMinifyHtml.addEventListener("click", () => {
        if (!this.w2hHtmlRawTextarea.value) return;
        this.w2hHtmlRawTextarea.value = this.w2hConverter.minifyHtml(this.w2hHtmlRawTextarea.value);
        this.handleDirectHtmlCodeEdit();
        this.showToast("Đã nén mã HTML tối ưu dung lượng CMS!", "success");
      });
    }

    // ==========================================
    // PDF TO IMAGE EXPORTER EVENTS
    // ==========================================
    if (this.btnBackToHubFromPdf) {
      this.btnBackToHubFromPdf.addEventListener("click", () => {
        window.location.hash = "";
      });
    }

    if (this.pdfDropzone && this.pdfFilePicker) {
      this.pdfDropzone.addEventListener("click", () => this.pdfFilePicker.click());
      this.pdfFilePicker.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handlePdfFileInput(e.target.files[0]);
        }
      });

      this.pdfDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        this.pdfDropzone.classList.add("dragover");
      });
      this.pdfDropzone.addEventListener("dragleave", () => {
        this.pdfDropzone.classList.remove("dragover");
      });
      this.pdfDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        this.pdfDropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handlePdfFileInput(e.dataTransfer.files[0]);
        }
      });
    }

    if (this.btnRemovePdf) {
      this.btnRemovePdf.addEventListener("click", (e) => {
        e.stopPropagation();
        this.resetPdfToolState();
      });
    }

    // Range Quick Buttons
    const rangeBtns = [
      { btn: this.btnPdfSelectAll, action: () => { this.pdfConverter.selectAllPages(); this.onPdfSelectionChanged(); } },
      { btn: this.btnPdfDeselectAll, action: () => { this.pdfConverter.deselectAllPages(); this.onPdfSelectionChanged(); } },
      { btn: this.btnPdfSelectOdd, action: () => { this.pdfConverter.selectOddPages(); this.onPdfSelectionChanged(); } },
      { btn: this.btnPdfSelectEven, action: () => { this.pdfConverter.selectEvenPages(); this.onPdfSelectionChanged(); } },
      { btn: this.btnPdfInvertSelection, action: () => { this.pdfConverter.invertSelection(); this.onPdfSelectionChanged(); } }
    ];

    rangeBtns.forEach(({ btn, action }) => {
      if (btn) {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".btn-range-quick").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          action();
        });
      }
    });

    if (this.btnPdfApplyRange && this.pdfRangeInput) {
      this.btnPdfApplyRange.addEventListener("click", () => {
        const val = this.pdfRangeInput.value.trim();
        if (!val) return;
        this.pdfConverter.selectByRangeString(val);
        document.querySelectorAll(".btn-range-quick").forEach(b => b.classList.remove("active"));
        this.onPdfSelectionChanged();
        this.showToast(`Đã chọn ${this.pdfConverter.selectedPages.size} trang theo khoảng: ${val}`, "info");
      });
    }

    // Format, Scale & Filter Changes
    const pdfSettings = [this.pdfExportFormat, this.pdfExportScale, this.pdfImageFilter, this.pdfExportQuality, this.pdfFilenamePrefix];
    pdfSettings.forEach(el => {
      if (el) {
        el.addEventListener("change", async () => {
          this.applyPdfSettings();
          if (this.pdfConverter && this.pdfConverter.pdfDoc) {
            await this.renderPdfPageGrid();
          }
        });
      }
    });

    if (this.pdfExportFormat) {
      this.pdfExportFormat.addEventListener("change", () => {
        const isJpgOrWebp = this.pdfExportFormat.value === "image/jpeg" || this.pdfExportFormat.value === "image/webp";
        if (this.groupPdfQuality) {
          this.groupPdfQuality.style.display = isJpgOrWebp ? "flex" : "none";
        }
      });
    }

    // Batch Action Buttons
    if (this.btnPdfDownloadZip) {
      this.btnPdfDownloadZip.addEventListener("click", () => this.downloadPdfSelectedZip());
    }
    if (this.btnPdfMergeLongImage) {
      this.btnPdfMergeLongImage.addEventListener("click", () => this.mergePdfLongImage());
    }
    if (this.btnPdfRotateAll) {
      this.btnPdfRotateAll.addEventListener("click", async () => {
        if (!this.pdfConverter || !this.pdfConverter.pdfDoc) return;
        this.pdfConverter.rotateAllPages(90);
        this.showToast("Đã xoay toàn bộ các trang 90°!", "info");
        await this.renderPdfPageGrid();
      });
    }
    if (this.btnPdfDownloadIndividual) {
      this.btnPdfDownloadIndividual.addEventListener("click", () => this.downloadPdfIndividualPages());
    }
    if (this.btnPdfCopyHtmlImg) {
      this.btnPdfCopyHtmlImg.addEventListener("click", () => this.copyPdfHtmlTags());
    }

    // Toggle Sidebar & Fullscreen for PDF
    if (this.btnToggleSidebarPdf) {
      this.btnToggleSidebarPdf.addEventListener("click", () => {
        if (!this.pdfLayoutGrid) return;
        const isCollapsed = this.pdfLayoutGrid.classList.toggle("sidebar-collapsed");
        if (this.txtToggleSidebarPdf) {
          this.txtToggleSidebarPdf.textContent = isCollapsed ? "▶ Mở cài đặt" : "◀ Thu gọn cài đặt";
        }
        this.btnToggleSidebarPdf.classList.toggle("active", isCollapsed);
      });
    }

    if (this.btnToggleFullscreenPdf) {
      this.btnToggleFullscreenPdf.addEventListener("click", () => {
        if (!this.pdfToImageView) return;
        const isFull = this.pdfToImageView.classList.toggle("pdf-fullscreen-active");
        if (this.txtFullscreenPdf) {
          this.txtFullscreenPdf.textContent = isFull ? "🗗 Thu nhỏ" : "⛶ Phóng to";
        }
        this.btnToggleFullscreenPdf.classList.toggle("active", isFull);
      });
    }

    // Lightbox Controls
    if (this.btnClosePdfLightbox) {
      this.btnClosePdfLightbox.addEventListener("click", () => this.hideModal(this.modalPdfLightbox));
    }
    if (this.btnLightboxPrev) {
      this.btnLightboxPrev.addEventListener("click", () => this.navigatePdfLightbox(-1));
    }
    if (this.btnLightboxNext) {
      this.btnLightboxNext.addEventListener("click", () => this.navigatePdfLightbox(1));
    }
    if (this.btnLightboxDownload) {
      this.btnLightboxDownload.addEventListener("click", () => {
        this.pdfConverter.downloadSinglePage(this.currentLightboxPage);
      });
    }
    if (this.btnLightboxCopy) {
      this.btnLightboxCopy.addEventListener("click", async () => {
        try {
          await this.pdfConverter.copyPageImageToClipboard(this.currentLightboxPage);
          this.showToast(`Đã sao chép ảnh Trang ${this.currentLightboxPage} vào Clipboard!`, "success");
        } catch (err) {
          this.showToast("Lỗi sao chép: " + err.message, "error");
        }
      });
    }

    // Global Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      // 1. ESC -> Close modals & mobile drawer
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay:not(.hidden)").forEach(m => m.classList.add("hidden"));
        if (this.sidebar && this.sidebar.classList.contains("open")) {
          this.sidebar.classList.remove("open");
          if (this.sidebarBackdrop) this.sidebarBackdrop.classList.remove("active");
        }
      }

      // 2. Lightbox navigation (ArrowLeft / ArrowRight)
      if (this.modalPdfLightbox && !this.modalPdfLightbox.classList.contains("hidden")) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.navigatePdfLightbox(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.navigatePdfLightbox(1);
        }
      }

      // 3. Ctrl + S in Word to HTML -> Download HTML
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && this.wordToHtmlView && !this.wordToHtmlView.classList.contains("hidden")) {
        e.preventDefault();
        this.downloadW2hHtmlFile();
      }

      // 4. Ctrl + Shift + C in Word to HTML -> Copy HTML
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c" && this.wordToHtmlView && !this.wordToHtmlView.classList.contains("hidden")) {
        e.preventDefault();
        this.copyW2hHtmlCode();
      }
    });
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
    } else if (hash === "pdf-to-image") {
      this.showPdfToImageView();
    } else {
      const tool = window.getToolById(hash);
      if (tool) {
        if (tool.id === "word-to-html") {
          this.showWordToHtmlView();
        } else if (tool.id === "pdf-to-image") {
          this.showPdfToImageView();
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
    if (this.pdfToImageView) this.pdfToImageView.classList.add("hidden");
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
    if (this.pdfToImageView) this.pdfToImageView.classList.add("hidden");
    this.schemaView.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "schema-lookup");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (this.pdfToImageView) this.pdfToImageView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "word-to-html");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showPdfToImageView() {
    this.currentToolId = "pdf-to-image";
    this.hubView.classList.add("hidden");
    this.toolView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
    if (this.pdfToImageView) this.pdfToImageView.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "pdf-to-image");
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
    if (toolId === "pdf-to-image") {
      this.showPdfToImageView();
      return;
    }

    const tool = window.getToolById(toolId);
    if (!tool) return;

    this.currentToolId = toolId;
    this.hubView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
    if (this.pdfToImageView) this.pdfToImageView.classList.add("hidden");
    this.toolView.classList.remove("hidden");
    this.hubView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
    this.toolView.classList.remove("hidden");
    this.resetToolState();
    this.loadOrgConfigToUi();
    this.loadSavePathsToUi();

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
        const hlColName = window.schemaLookupEngine.highlight(item.colName, query);
        const hlColDesc = window.schemaLookupEngine.highlight(item.colDesc, query);
        const hlTblName = window.schemaLookupEngine.highlight(item.tableName, query);

        row.innerHTML = `
          <div class="item-card-top">
            <span class="item-col-name ${item.isPk ? 'is-pk' : ''}">
              ${item.isPk ? '🔑 ' : ''}<strong>${hlColName}</strong>
            </span>
            <span class="item-type-badge type-${this.getTypeClass(item.colType)}">${item.colType}</span>
          </div>
          <div class="item-card-desc">
            <span>💡 <strong>${hlColDesc}</strong></span>
          </div>
          <div class="item-card-bottom">
            <span class="item-tbl-name" title="${item.tableName} (${item.tableTitle})">📋 ${hlTblName} &bull; ${item.tableTitle}</span>
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
        const hlTblName = window.schemaLookupEngine.highlight(tbl.name, query);
        const hlTblTitle = window.schemaLookupEngine.highlight(tbl.title || tbl.name, query);

        row.innerHTML = `
          <div class="item-card-top">
            <span class="item-tbl-title">📋 <strong>${hlTblName}</strong></span>
            <span class="item-col-badge">${tbl.columns.length} cột</span>
          </div>
          <div class="item-card-desc">
            <span>🏢 <strong>${hlTblTitle}</strong></span>
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
        setTimeout(() => {
          tr.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
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

  getW2hCurrentOptions() {
    const activePresetBtn = document.querySelector(".btn-preset.active");
    const preset = activePresetBtn ? activePresetBtn.dataset.preset : "ctxh";

    const ctxhUrlsRaw = this.w2hCtxhImageUrls ? this.w2hCtxhImageUrls.value : "";
    const ctxhImageUrls = ctxhUrlsRaw
      .split("\n")
      .map(u => u.trim())
      .filter(u => u.length > 0);

    return {
      preset: preset,
      fontFamily: this.w2hFontFamily ? this.w2hFontFamily.value : "'Times New Roman', Times, serif",
      baseFontSize: this.w2hFontSize ? this.w2hFontSize.value : "16px",
      textColor: this.w2hTextColorText ? this.w2hTextColorText.value : "#000000",
      textAlign: this.w2hTextAlign ? this.w2hTextAlign.value : "justify",
      textIndent: this.w2hTextIndent ? this.w2hTextIndent.value : "none",
      lineHeight: this.w2hLineHeight ? this.w2hLineHeight.value : "1.6",
      paragraphMarginBottom: this.w2hMarginBottom ? this.w2hMarginBottom.value : "10px",
      autoFilterBoundaries: this.w2hAutoFilterBoundaries ? this.w2hAutoFilterBoundaries.checked : true,
      unboldAll: this.w2hUnboldAll ? this.w2hUnboldAll.checked : true,
      tableFullBorder: this.w2hTableBorder ? this.w2hTableBorder.checked : true,
      cleanEmptyParagraphs: this.w2hCleanEmpty ? this.w2hCleanEmpty.checked : true,
      ctxhImageUrls: ctxhImageUrls,
      thauTopImageUrl: this.w2hThauTopImageUrl ? this.w2hThauTopImageUrl.value : "",
      thauTopImageCaption: this.w2hThauTopImageCaption ? this.w2hThauTopImageCaption.value : "",
      thauBottomImageUrl: this.w2hThauBottomImageUrl ? this.w2hThauBottomImageUrl.value : "",
      thauBottomImageCaption: this.w2hThauBottomImageCaption ? this.w2hThauBottomImageCaption.value : ""
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
      this.originalWordHtml = result.html; // Lưu giữ bản sao mã gốc ban đầu từ Word

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

  handleDirectHtmlCodeEdit() {
    if (!this.w2hHtmlRawTextarea) return;

    const editedCode = this.w2hHtmlRawTextarea.value;
    this.currentW2hHtmlOutput = editedCode;

    // Cập nhật ngay lập tức sang khung Visual Preview theo thời gian thực
    if (this.w2hArticleSheet) {
      this.w2hArticleSheet.innerHTML = editedCode;
      this.w2hArticleSheet.classList.remove("hidden");
    }
    if (this.w2hEmptyState) {
      this.w2hEmptyState.classList.toggle("hidden", !!editedCode.trim());
    }

    // Tự động tính toán lại thống kê (từ, ký tự, đoạn văn, bảng, ảnh)
    try {
      const stats = this.w2hConverter.calculateStats(editedCode);
      this.updateW2hStats(stats);
    } catch (e) {
      // Bỏ qua lỗi parsing tạm thời khi đang gõ dở
    }
  }

  revertToOriginalWordHtml() {
    if (!this.originalWordHtml) {
      this.showToast("Chưa có đoạn mã gốc từ file Word để khôi phục!", "warning");
      return;
    }

    this.currentW2hHtmlOutput = this.originalWordHtml;

    if (this.w2hHtmlRawTextarea) {
      this.w2hHtmlRawTextarea.value = this.originalWordHtml;
    }
    if (this.w2hArticleSheet) {
      this.w2hArticleSheet.innerHTML = this.originalWordHtml;
      this.w2hArticleSheet.classList.remove("hidden");
    }
    if (this.w2hEmptyState) {
      this.w2hEmptyState.classList.add("hidden");
    }

    this.handleDirectHtmlCodeEdit();
    this.showToast("Đã khôi phục lại đoạn mã ban đầu của file Word!", "success");
  }

  updateW2hStats(stats) {
    if (this.w2hStatWords) this.w2hStatWords.textContent = (stats.wordCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatChars) this.w2hStatChars.textContent = (stats.charCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatParagraphs) this.w2hStatParagraphs.textContent = (stats.paragraphCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatTables) this.w2hStatTables.textContent = (stats.tableCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatImages) this.w2hStatImages.textContent = (stats.imageCount || 0).toLocaleString("vi-VN");
    if (this.w2hStatReadingTime) this.w2hStatReadingTime.textContent = (stats.readingTimeMinutes || Math.max(1, Math.ceil((stats.wordCount || 0) / 200))).toLocaleString("vi-VN");
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
    if (this.w2hFontFamily) this.w2hFontFamily.value = "'Times New Roman', Times, serif";
    if (this.w2hFontSize) this.w2hFontSize.value = "16px";
    if (this.w2hTextColorPicker) this.w2hTextColorPicker.value = "#000000";
    if (this.w2hTextColorText) this.w2hTextColorText.value = "#000000";
    if (this.w2hTextAlign) this.w2hTextAlign.value = "justify";
    if (this.w2hTextIndent) this.w2hTextIndent.value = "none";
    if (this.w2hLineHeight) this.w2hLineHeight.value = "1.6";
    if (this.w2hMarginBottom) this.w2hMarginBottom.value = "6px";
    if (this.w2hPreserveLayoutTables) this.w2hPreserveLayoutTables.checked = true;
    if (this.w2hTableBorder) this.w2hTableBorder.checked = true;
    if (this.w2hCleanEmpty) this.w2hCleanEmpty.checked = true;
    if (this.w2hCollapseSpaces) this.w2hCollapseSpaces.checked = true;

    if (preset === "thau") {
      if (this.w2hThauImageControls) this.w2hThauImageControls.classList.remove("hidden");
      if (this.w2hCtxhImageControls) this.w2hCtxhImageControls.classList.add("hidden");
    } else {
      if (this.w2hThauImageControls) this.w2hThauImageControls.classList.add("hidden");
      if (this.w2hCtxhImageControls) this.w2hCtxhImageControls.classList.remove("hidden");
    }

    document.querySelectorAll(".chip-color").forEach(c => {
      c.classList.toggle("active", c.dataset.color === "#000000");
    });

    document.querySelectorAll(".btn-preset").forEach(b => {
      b.classList.toggle("active", b.dataset.preset === preset);
    });

    this.reconvertCurrentW2hDocument();
  }

  resetW2hSettings() {
    if (this.w2hThauTopImageUrl) this.w2hThauTopImageUrl.value = "";
    if (this.w2hThauTopImageCaption) this.w2hThauTopImageCaption.value = "";
    if (this.w2hThauBottomImageUrl) this.w2hThauBottomImageUrl.value = "";
    if (this.w2hThauBottomImageCaption) this.w2hThauBottomImageCaption.value = "";
    if (this.w2hCtxhImageUrls) this.w2hCtxhImageUrls.value = "";

    this.applyW2hPreset("ctxh");
    this.showToast("Đã khôi phục cài đặt chuẩn Bài CTXH (Times New Roman 16px, #000000)!", "info");
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

  // ==========================================
  // PDF TO IMAGE EXPORTER WORKSPACE METHODS
  // ==========================================
  async handlePdfFileInput(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      this.showToast("Vui lòng chọn tệp định dạng PDF (.pdf)!", "warning");
      return;
    }

    this.currentPdfFileName = file.name;
    this.pdfFileNameDisplay.textContent = file.name;
    this.pdfFileSizeDisplay.textContent = this.formatFileSize(file.size);
    this.pdfFileInfoCard.classList.remove("hidden");
    this.pdfDropzone.classList.add("hidden");

    if (this.pdfFilenamePrefix) {
      this.pdfFilenamePrefix.value = file.name.replace(/\.[^/.]+$/, "");
    }

    this.applyPdfSettings();

    try {
      this.showToast(`Đang nạp và giải mã tài liệu ${file.name}...`, "info");
      this.currentPdfBuffer = await file.arrayBuffer();
      const res = await this.pdfConverter.loadPdf(this.currentPdfBuffer, file.name);
      
      this.pdfPageCountDisplay.textContent = `${res.totalPages} trang`;
      this.pdfEmptyState.classList.add("hidden");
      this.pdfPageGrid.classList.remove("hidden");

      await this.renderPdfPageGrid();
      this.updatePdfStatsBar();
      this.showToast(`Đã nạp thành công ${res.totalPages} trang PDF!`, "success");
    } catch (err) {
      console.error(err);
      this.showToast("Lỗi nạp file PDF: " + err.message, "error");
      this.resetPdfToolState();
    }
  }

  applyPdfSettings() {
    if (!this.pdfConverter) return;
    const format = this.pdfExportFormat ? this.pdfExportFormat.value : "image/png";
    const scale = this.pdfExportScale ? parseFloat(this.pdfExportScale.value) : 2.0;
    const quality = this.pdfExportQuality ? parseFloat(this.pdfExportQuality.value) : 0.92;
    const filenamePrefix = this.pdfFilenamePrefix ? this.pdfFilenamePrefix.value.trim() : "Trang";
    const imageFilter = this.pdfImageFilter ? this.pdfImageFilter.value : "none";

    this.pdfConverter.setOptions({
      format,
      scale,
      quality,
      filenamePrefix,
      imageFilter
    });

    this.updatePdfStatsBar();
  }

  async renderPdfPageGrid() {
    if (!this.pdfConverter || !this.pdfConverter.pdfDoc) return;
    this.pdfPageGrid.innerHTML = "";

    const total = this.pdfConverter.totalPages;

    // Show Progress Bar while rendering thumbnails
    if (this.pdfProgressBarContainer) {
      this.pdfProgressBarContainer.classList.remove("hidden");
      this.pdfProgressLabel.textContent = `Đang kết xuất ${total} trang...`;
      this.pdfProgressPercent.textContent = `0%`;
      this.pdfProgressBarFill.style.width = `0%`;
    }

    for (let p = 1; p <= total; p++) {
      const isSelected = this.pdfConverter.selectedPages.has(p);

      const card = document.createElement("div");
      card.className = `pdf-page-card ${isSelected ? "selected" : ""}`;
      card.dataset.pageNum = p;

      card.innerHTML = `
        <div class="pdf-card-header">
          <label class="pdf-card-checkbox-label">
            <input type="checkbox" class="pdf-card-checkbox" data-page="${p}" ${isSelected ? "checked" : ""} />
            <span>Trang ${p} / ${total}</span>
          </label>
          <span class="pdf-card-dim" id="pdfDim_${p}">Đang tải...</span>
        </div>
        <div class="pdf-card-preview-box" data-page="${p}">
          <div class="pdf-card-hover-overlay">
            <button type="button" class="btn-overlay-zoom">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              <span>Phóng to</span>
            </button>
          </div>
        </div>
        <div class="pdf-card-footer-3">
          <button type="button" class="btn-card-action btn-card-rotate" data-page="${p}" title="Xoay trang này 90°">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Xoay</span>
          </button>
          <button type="button" class="btn-card-action btn-card-download" data-page="${p}" title="Tải ảnh trang này">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Tải</span>
          </button>
          <button type="button" class="btn-card-action btn-card-copy" data-page="${p}" title="Sao chép ảnh vào Clipboard">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copy</span>
          </button>
        </div>
      `;

      this.pdfPageGrid.appendChild(card);

      // Render thumbnail asynchronously
      try {
        const pageData = await this.pdfConverter.renderPageToCanvas(p, this.pdfConverter.options.scale, true);
        const previewBox = card.querySelector(".pdf-card-preview-box");
        const dimSpan = card.querySelector(`#pdfDim_${p}`);

        if (dimSpan) {
          dimSpan.textContent = `${Math.round(pageData.width)} × ${Math.round(pageData.height)} px`;
        }

        pageData.canvas.className = "pdf-card-canvas";
        previewBox.prepend(pageData.canvas);
      } catch (err) {
        console.error(`Lỗi render trang ${p}:`, err);
      }

      // Update progress
      const percent = Math.round((p / total) * 100);
      if (this.pdfProgressBarFill) this.pdfProgressBarFill.style.width = `${percent}%`;
      if (this.pdfProgressPercent) this.pdfProgressPercent.textContent = `${percent}%`;
    }

    if (this.pdfProgressBarContainer) {
      setTimeout(() => this.pdfProgressBarContainer.classList.add("hidden"), 500);
    }

    // Attach card events
    this.pdfPageGrid.querySelectorAll(".pdf-card-checkbox").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const p = parseInt(e.target.dataset.page, 10);
        const isChecked = e.target.checked;
        this.pdfConverter.togglePageSelection(p, isChecked);
        const card = this.pdfPageGrid.querySelector(`.pdf-page-card[data-page-num="${p}"]`);
        if (card) card.classList.toggle("selected", isChecked);
        this.updatePdfStatsBar();
      });
    });

    this.pdfPageGrid.querySelectorAll(".pdf-card-preview-box").forEach(box => {
      box.addEventListener("click", () => {
        const p = parseInt(box.dataset.page, 10);
        this.openPdfLightbox(p);
      });
    });

    this.pdfPageGrid.querySelectorAll(".btn-card-rotate").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const p = parseInt(btn.dataset.page, 10);
        this.pdfConverter.rotatePage(p, 90);
        const card = this.pdfPageGrid.querySelector(`.pdf-page-card[data-page-num="${p}"]`);
        if (card) {
          const previewBox = card.querySelector(".pdf-card-preview-box");
          const oldCanvas = previewBox.querySelector("canvas");
          if (oldCanvas) oldCanvas.remove();

          const pageData = await this.pdfConverter.renderPageToCanvas(p, this.pdfConverter.options.scale, true);
          pageData.canvas.className = "pdf-card-canvas";
          previewBox.prepend(pageData.canvas);

          const dimSpan = card.querySelector(`#pdfDim_${p}`);
          if (dimSpan) dimSpan.textContent = `${Math.round(pageData.width)} × ${Math.round(pageData.height)} px`;
        }
        this.showToast(`Đã xoay Trang ${p} 90°!`, "info");
      });
    });

    this.pdfPageGrid.querySelectorAll(".btn-card-download").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const p = parseInt(btn.dataset.page, 10);
        this.pdfConverter.downloadSinglePage(p);
      });
    });

    this.pdfPageGrid.querySelectorAll(".btn-card-copy").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const p = parseInt(btn.dataset.page, 10);
        try {
          await this.pdfConverter.copyPageImageToClipboard(p);
          this.showToast(`Đã sao chép ảnh Trang ${p} vào Clipboard!`, "success");
        } catch (err) {
          this.showToast("Không thể sao chép: " + err.message, "error");
        }
      });
    });
  }

  async mergePdfLongImage() {
    if (!this.pdfConverter || !this.pdfConverter.pdfDoc) {
      this.showToast("Vui lòng tải lên file PDF trước khi ghép ảnh!", "warning");
      return;
    }

    if (this.pdfConverter.selectedPages.size === 0) {
      this.showToast("Vui lòng chọn ít nhất một trang để ghép ảnh!", "warning");
      return;
    }

    try {
      if (this.pdfProgressBarContainer) {
        this.pdfProgressBarContainer.classList.remove("hidden");
      }

      this.showToast("Đang ghép các trang đã chọn thành 1 ảnh dài duy nhất...", "info");
      const res = await this.pdfConverter.mergeSelectedPagesToLongImage((cur, total, msg) => {
        const percent = Math.round((cur / total) * 100);
        if (this.pdfProgressLabel) this.pdfProgressLabel.textContent = msg;
        if (this.pdfProgressPercent) this.pdfProgressPercent.textContent = `${percent}%`;
        if (this.pdfProgressBarFill) this.pdfProgressBarFill.style.width = `${percent}%`;
      });

      if (this.pdfProgressBarContainer) {
        setTimeout(() => this.pdfProgressBarContainer.classList.add("hidden"), 500);
      }

      this.showToast(`Đã ghép thành công tệp ảnh ${res.fileName} (${res.width}x${res.height} px)!`, "success");
    } catch (err) {
      this.showToast("Lỗi ghép ảnh: " + err.message, "error");
      if (this.pdfProgressBarContainer) this.pdfProgressBarContainer.classList.add("hidden");
    }
  }

  exportW2hMarkdown() {
    if (!this.w2hHtmlRawTextarea.value) {
      this.showToast("Chưa có nội dung để xuất Markdown!", "warning");
      return;
    }

    const md = this.w2hConverter.convertToMarkdown(this.w2hHtmlRawTextarea.value);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const fileName = (this.currentW2hFileName ? this.currentW2hFileName.replace(/\.[^/.]+$/, "") : "Bai_viet") + ".md";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast(`Đã tải về tệp ${fileName}!`, "success");
  }

  onPdfSelectionChanged() {
    if (!this.pdfPageGrid) return;
    const selectedSet = this.pdfConverter.selectedPages;

    this.pdfPageGrid.querySelectorAll(".pdf-page-card").forEach(card => {
      const p = parseInt(card.dataset.pageNum, 10);
      const isSelected = selectedSet.has(p);
      card.classList.toggle("selected", isSelected);
      const cb = card.querySelector(".pdf-card-checkbox");
      if (cb) cb.checked = isSelected;
    });

    this.updatePdfStatsBar();
  }

  updatePdfStatsBar() {
    if (!this.pdfStatsSummary) return;
    if (!this.pdfConverter || !this.pdfConverter.pdfDoc) {
      this.pdfStatsSummary.textContent = "Chưa có tệp PDF nào được nạp";
      return;
    }

    const total = this.pdfConverter.totalPages;
    const selected = this.pdfConverter.selectedPages.size;
    const fmt = this.pdfConverter.getFileExtension().toUpperCase();
    const scale = this.pdfConverter.options.scale;
    const dpi = scale === 2.0 ? "300 DPI" : (scale === 1.0 ? "96 DPI" : (scale === 3.0 ? "4K" : "150 DPI"));

    this.pdfStatsSummary.textContent = `Tổng cộng: ${total} trang • Đã chọn: ${selected} trang • Định dạng: ${fmt} (${scale}x - ${dpi})`;
  }

  async downloadPdfSelectedZip() {
    if (!this.pdfConverter || !this.pdfConverter.pdfDoc) {
      this.showToast("Vui lòng tải lên file PDF trước khi xuất ảnh!", "warning");
      return;
    }

    if (this.pdfConverter.selectedPages.size === 0) {
      this.showToast("Vui lòng chọn ít nhất một trang để xuất!", "warning");
      return;
    }

    try {
      if (this.pdfProgressBarContainer) {
        this.pdfProgressBarContainer.classList.remove("hidden");
      }

      this.showToast("Đang nén toàn bộ các trang đã chọn thành file ZIP...", "info");
      const res = await this.pdfConverter.exportSelectedPagesAsZip((cur, total, msg) => {
        const percent = Math.round((cur / total) * 100);
        if (this.pdfProgressLabel) this.pdfProgressLabel.textContent = msg;
        if (this.pdfProgressPercent) this.pdfProgressPercent.textContent = `${percent}%`;
        if (this.pdfProgressBarFill) this.pdfProgressBarFill.style.width = `${percent}%`;
      });

      if (this.pdfProgressBarContainer) {
        setTimeout(() => this.pdfProgressBarContainer.classList.add("hidden"), 500);
      }

      this.showToast(`Đã tải về thành công file ${res.zipFileName} (${res.count} trang ảnh)!`, "success");
    } catch (err) {
      this.showToast("Lỗi xuất file ZIP: " + err.message, "error");
      if (this.pdfProgressBarContainer) this.pdfProgressBarContainer.classList.add("hidden");
    }
  }

  async downloadPdfIndividualPages() {
    if (!this.pdfConverter || !this.pdfConverter.pdfDoc) {
      this.showToast("Vui lòng tải lên file PDF trước khi xuất ảnh!", "warning");
      return;
    }

    const pages = Array.from(this.pdfConverter.selectedPages).sort((a, b) => a - b);
    if (pages.length === 0) {
      this.showToast("Vui lòng chọn ít nhất một trang!", "warning");
      return;
    }

    this.showToast(`Đang tải ${pages.length} trang ảnh về máy tính...`, "info");
    for (const p of pages) {
      await this.pdfConverter.downloadSinglePage(p);
      await new Promise(r => setTimeout(r, 200)); // Slight delay between downloads
    }
    this.showToast(`Đã xuất xong ${pages.length} trang ảnh!`, "success");
  }

  copyPdfHtmlTags() {
    if (!this.pdfConverter || !this.pdfConverter.pdfDoc) {
      this.showToast("Vui lòng tải lên file PDF trước!", "warning");
      return;
    }

    const html = this.pdfConverter.generateHtmlImageTags();
    if (!html) {
      this.showToast("Chưa chọn trang nào để sinh mã HTML!", "warning");
      return;
    }

    navigator.clipboard.writeText(html).then(() => {
      this.showToast("Đã sao chép mã HTML thẻ <img> các trang PDF vào Clipboard!", "success");
    }).catch(err => {
      this.showToast("Lỗi sao chép: " + err.message, "error");
    });
  }

  openPdfLightbox(pageNum) {
    if (!this.pdfConverter || !this.pdfConverter.pdfDoc) return;
    this.currentLightboxPage = pageNum;
    this.updatePdfLightboxContent();
    this.showModal(this.modalPdfLightbox);
  }

  updatePdfLightboxContent() {
    const p = this.currentLightboxPage;
    const total = this.pdfConverter.totalPages;

    if (this.lightboxPageTag) this.lightboxPageTag.textContent = `Trang ${p} / ${total}`;
    if (this.lightboxFilename) this.lightboxFilename.textContent = this.pdfConverter.pdfFileName + ".pdf";

    const pageData = this.pdfConverter.renderedPages.get(p);
    if (pageData && this.pdfLightboxImg) {
      this.pdfLightboxImg.src = pageData.dataUrl;
    }

    if (this.btnLightboxPrev) this.btnLightboxPrev.disabled = (p <= 1);
    if (this.btnLightboxNext) this.btnLightboxNext.disabled = (p >= total);
  }

  navigatePdfLightbox(direction) {
    const target = this.currentLightboxPage + direction;
    if (target >= 1 && target <= this.pdfConverter.totalPages) {
      this.currentLightboxPage = target;
      this.updatePdfLightboxContent();
    }
  }

  resetPdfToolState() {
    this.currentPdfBuffer = null;
    this.currentPdfFileName = "";
    if (this.pdfFilePicker) this.pdfFilePicker.value = "";
    if (this.pdfFileInfoCard) this.pdfFileInfoCard.classList.add("hidden");
    if (this.pdfDropzone) this.pdfDropzone.classList.remove("hidden");
    if (this.pdfPageGrid) {
      this.pdfPageGrid.innerHTML = "";
      this.pdfPageGrid.classList.add("hidden");
    }
    if (this.pdfEmptyState) this.pdfEmptyState.classList.remove("hidden");
    this.updatePdfStatsBar();
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

  getSavePathConfig() {
    try {
      const raw = localStorage.getItem("APP_SAVE_PATHS");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      giamdinh: "D:\\BaoCao\\GiamDinh\\",
      w2h: "D:\\Website_CMS\\",
      pdf: "D:\\XuatAnhPDF\\",
      vgca: "D:\\VGCA\\",
      schema: "D:\\Database_Schema\\"
    };
  }

  savePathConfig(cfg) {
    localStorage.setItem("APP_SAVE_PATHS", JSON.stringify(cfg));
    this.loadSavePathsToUi();
  }

  loadSavePathsToUi() {
    const paths = this.getSavePathConfig();
    if (this.w2hSavePathInput) this.w2hSavePathInput.value = paths.w2h || "D:\\Website_CMS\\";
    if (this.pdfSavePathInput) this.pdfSavePathInput.value = paths.pdf || "D:\\XuatAnhPDF\\";
    if (this.cfgPathGiamDinh) this.cfgPathGiamDinh.value = paths.giamdinh || "D:\\BaoCao\\GiamDinh\\";
    if (this.cfgPathW2h) this.cfgPathW2h.value = paths.w2h || "D:\\Website_CMS\\";
    if (this.cfgPathPdf) this.cfgPathPdf.value = paths.pdf || "D:\\XuatAnhPDF\\";
    if (this.cfgPathVgca) this.cfgPathVgca.value = paths.vgca || "D:\\VGCA\\";

    if (this.toolSavePathVal) {
      if (this.currentToolId && this.currentToolId.startsWith("vgca-")) {
        this.toolSavePathVal.textContent = paths.vgca || "D:\\VGCA\\";
      } else {
        this.toolSavePathVal.textContent = paths.giamdinh || "D:\\BaoCao\\GiamDinh\\";
      }
    }
  }

  async selectDirectoryForInput(inputEl, pathKey) {
    if (window.showDirectoryPicker) {
      try {
        const handle = await window.showDirectoryPicker();
        if (handle && handle.name) {
          const currentVal = inputEl ? inputEl.value.trim() : "D:\\";
          const baseDrive = currentVal.match(/^[A-Z]:\\/i) ? currentVal.match(/^[A-Z]:\\/i)[0] : "D:\\";
          const newPath = `${baseDrive}${handle.name}\\`;
          if (inputEl) {
            inputEl.value = newPath;
            inputEl.dispatchEvent(new Event("input"));
            inputEl.dispatchEvent(new Event("change"));
          }
          if (pathKey) {
            const paths = this.getSavePathConfig();
            paths[pathKey] = newPath;
            this.savePathConfig(paths);
          }
          this.showToast(`Đã chọn thư mục lưu: ${newPath}`, "success");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Directory picker error:", err);
          this.showToast("Bạn có thể nhập trực tiếp đường dẫn thư mục lưu vào ô", "info");
        }
      }
    } else {
      this.showToast("Nhập trực tiếp đường dẫn thư mục lưu trên máy vào ô", "info");
    }
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
