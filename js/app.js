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

    // Notification Center & Smart Reminders State
    this.notifManager = new NotificationManager();
    this.currentNotifCategory = "all";

    // Restore desktop sidebar collapsed state
    if (localStorage.getItem("APP_SIDEBAR_COLLAPSED") === "true" && window.innerWidth > 768) {
      const appLayout = document.querySelector(".app-layout");
      if (appLayout) appLayout.classList.add("sidebar-collapsed");
    }

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
    this.btnSidebarCollapseDesktop = document.getElementById("btnSidebarCollapseDesktop");
    this.btnSidebarClose = document.getElementById("btnSidebarClose");
    this.sidebarBackdrop = document.getElementById("sidebarBackdrop");
    this.sidebarNav = document.getElementById("sidebarNav");
    this.modalOfflineSyncConfirm = document.getElementById("modalOfflineSyncConfirm");
    this.btnConfirmSyncData = document.getElementById("btnConfirmSyncData");
    this.btnDismissSync = document.getElementById("btnDismissSync");
    this.btnCloseSyncModal = document.getElementById("btnCloseSyncModal");
    this.hubView = document.getElementById("hubView");
    this.toolView = document.getElementById("toolView");
    this.schemaView = document.getElementById("schemaView");
    this.wordToHtmlView = document.getElementById("wordToHtmlView");
    this.pdfToImageView = document.getElementById("pdfToImageView");
    this.sqlBuilderView = document.getElementById("sqlBuilderView");
    this.dutyRosterView = document.getElementById("dutyRosterView");
    this.bhytXmlView = document.getElementById("bhytXmlView");
    this.categoryFilter = document.getElementById("categoryFilter");
    this.toolCardsContainer = document.getElementById("toolCardsContainer");
    this.globalSearchInput = document.getElementById("globalSearchInput");
    this.headerSearchWrapper = document.getElementById("headerSearchWrapper");
    this.headerSearchResultsDropdown = document.getElementById("headerSearchResultsDropdown");
    this.headerSearchResultsList = document.getElementById("headerSearchResultsList");
    this.btnClearGlobalSearch = document.getElementById("btnClearGlobalSearch");

    // Notification Center Elements
    this.btnToggleNotificationCenter = document.getElementById("btnToggleNotificationCenter");
    this.notificationBadgeCount = document.getElementById("notificationBadgeCount");
    this.notificationCenterPanel = document.getElementById("notificationCenterPanel");
    this.btnMarkAllNotifsRead = document.getElementById("btnMarkAllNotifsRead");
    this.btnClearAllNotifs = document.getElementById("btnClearAllNotifs");
    this.notifFilterTabs = document.getElementById("notifFilterTabs");
    this.notificationListContainer = document.getElementById("notificationListContainer");
    this.chkToggleNotifSound = document.getElementById("chkToggleNotifSound");

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

    this.initNetworkStatus();
    this.initNotificationEvents();
    this.initSqlBuilderEvents();
    this.initDutyRosterEvents();
    this.initBhytXmlEvents();

    // Password Visibility Toggles
    this.setupPasswordToggle("btnToggleLoginPass", "inputDutyLoginPass");
    this.setupPasswordToggle("btnToggleNewAccPass", "inputNewAccPass");

    // Offline Sync Modal Actions
    if (this.btnConfirmSyncData) {
      this.btnConfirmSyncData.addEventListener("click", () => {
        localStorage.removeItem("PENDING_OFFLINE_CHANGES");
        this.hideModal(this.modalOfflineSyncConfirm);
        this.showToast("🚀 Đã đồng bộ toàn bộ dữ liệu offline lên hệ thống thành công!", "success");
        if (this.notifManager) {
          this.notifManager.addNotification({
            type: "success",
            category: "system",
            title: "Đồng bộ dữ liệu thành công",
            message: "Toàn bộ thay đổi thực hiện lúc offline đã được đồng bộ an toàn lên hệ thống."
          });
          this.renderNotificationBadge();
        }
      });
    }

    if (this.btnDismissSync) {
      this.btnDismissSync.addEventListener("click", () => {
        this.hideModal(this.modalOfflineSyncConfirm);
        this.showToast("Đã giữ dữ liệu cục bộ.", "info");
      });
    }

    if (this.btnCloseSyncModal) {
      this.btnCloseSyncModal.addEventListener("click", () => this.hideModal(this.modalOfflineSyncConfirm));
    }

    // Sidebar Drawer & Desktop Collapse Toggle
    const toggleDesktopSidebar = () => {
      const appLayout = document.querySelector(".app-layout");
      if (appLayout) {
        const isCollapsed = appLayout.classList.toggle("sidebar-collapsed");
        localStorage.setItem("APP_SIDEBAR_COLLAPSED", isCollapsed ? "true" : "false");
        if (this.btnSidebarCollapseDesktop) {
          this.btnSidebarCollapseDesktop.title = isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar";
        }
      }
    };

    if (this.btnSidebarCollapseDesktop) {
      this.btnSidebarCollapseDesktop.addEventListener("click", toggleDesktopSidebar);
    }

    // Nhấp vào logo/tiêu đề khi đang thu gọn cũng sẽ mở rộng sidebar trở lại
    const sidebarBrand = document.querySelector(".sidebar-brand");
    if (sidebarBrand) {
      sidebarBrand.addEventListener("click", () => {
        const appLayout = document.querySelector(".app-layout");
        if (appLayout && appLayout.classList.contains("sidebar-collapsed")) {
          toggleDesktopSidebar();
        }
      });
    }

    if (this.sidebarToggleBtn) {
      this.sidebarToggleBtn.addEventListener("click", () => {
        if (window.innerWidth > 768) {
          toggleDesktopSidebar();
        } else {
          if (!this.sidebar) return;
          const isOpen = this.sidebar.classList.toggle("open");
          if (this.sidebarBackdrop) {
            this.sidebarBackdrop.classList.toggle("active", isOpen);
          }
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

    // Back to Hub / Home
    const btnSidebarBrand = document.getElementById("btnSidebarBrand");
    if (btnSidebarBrand) {
      btnSidebarBrand.addEventListener("click", () => {
        window.location.hash = "";
      });
    }
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

    // Global Search input & Interactive Quick Dropdown
    if (this.globalSearchInput) {
      const handleGlobalSearch = (query) => {
        const q = query.trim();
        if (this.btnClearGlobalSearch) {
          this.btnClearGlobalSearch.classList.toggle("hidden", !q);
        }

        if (!q) {
          if (this.headerSearchResultsDropdown) this.headerSearchResultsDropdown.classList.add("hidden");
          this.renderToolGrid("");
          return;
        }

        const term = DocxTableParser.removeAccents(q.toLowerCase());
        const matchedTools = (window.TOOLS_REGISTRY || []).filter(tool => {
          const titleNorm = DocxTableParser.removeAccents(tool.title.toLowerCase());
          const descNorm = DocxTableParser.removeAccents(tool.description.toLowerCase());
          const badgeNorm = DocxTableParser.removeAccents((tool.badge || "").toLowerCase());
          const idNorm = DocxTableParser.removeAccents((tool.id || "").toLowerCase());
          return titleNorm.includes(term) || descNorm.includes(term) || badgeNorm.includes(term) || idNorm.includes(term);
        });

        if (this.headerSearchResultsDropdown && this.headerSearchResultsList) {
          this.headerSearchResultsList.innerHTML = "";
          if (matchedTools.length === 0) {
            this.headerSearchResultsList.innerHTML = `
              <div class="search-no-match">
                Không tìm thấy công cụ nào phù hợp với <strong>"${q}"</strong>
              </div>
            `;
          } else {
            matchedTools.forEach((tool, idx) => {
              const item = document.createElement("div");
              item.className = `search-result-item ${idx === 0 ? 'selected' : ''}`;
              item.dataset.toolId = tool.id;
              item.innerHTML = `
                <div class="search-result-icon">${tool.icon || '⚡'}</div>
                <div class="search-result-info">
                  <div class="search-result-title">${tool.title}</div>
                  <div class="search-result-desc">${tool.description}</div>
                </div>
                <span class="search-result-cat">${tool.badge || 'Công cụ'}</span>
              `;
              item.addEventListener("click", () => {
                window.location.hash = tool.id;
                this.headerSearchResultsDropdown.classList.add("hidden");
                this.globalSearchInput.value = "";
                if (this.btnClearGlobalSearch) this.btnClearGlobalSearch.classList.add("hidden");
              });
              this.headerSearchResultsList.appendChild(item);
            });
          }
          this.headerSearchResultsDropdown.classList.remove("hidden");
        }

        // Also update hub grid if on hub
        this.renderToolGrid(q);
      };

      let searchDebounceTimer = null;
      this.globalSearchInput.addEventListener("input", (e) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          handleGlobalSearch(e.target.value);
        }, 80);
      });

      this.globalSearchInput.addEventListener("focus", (e) => {
        if (e.target.value.trim()) {
          handleGlobalSearch(e.target.value);
        }
      });

      this.globalSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if (this.headerSearchResultsDropdown) this.headerSearchResultsDropdown.classList.add("hidden");
          this.globalSearchInput.blur();
        } else if (e.key === "Enter") {
          e.preventDefault();
          const firstItem = this.headerSearchResultsList ? this.headerSearchResultsList.querySelector(".search-result-item") : null;
          if (firstItem && firstItem.dataset.toolId) {
            window.location.hash = firstItem.dataset.toolId;
            if (this.headerSearchResultsDropdown) this.headerSearchResultsDropdown.classList.add("hidden");
            this.globalSearchInput.value = "";
            if (this.btnClearGlobalSearch) this.btnClearGlobalSearch.classList.add("hidden");
            this.globalSearchInput.blur();
          } else {
            window.location.hash = "hub";
            if (this.headerSearchResultsDropdown) this.headerSearchResultsDropdown.classList.add("hidden");
            this.globalSearchInput.blur();
          }
        }
      });

      if (this.btnClearGlobalSearch) {
        this.btnClearGlobalSearch.addEventListener("click", () => {
          this.globalSearchInput.value = "";
          this.btnClearGlobalSearch.classList.add("hidden");
          if (this.headerSearchResultsDropdown) this.headerSearchResultsDropdown.classList.add("hidden");
          this.renderToolGrid("");
          this.globalSearchInput.focus();
        });
      }

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (this.headerSearchWrapper && !this.headerSearchWrapper.contains(e.target)) {
          if (this.headerSearchResultsDropdown) this.headerSearchResultsDropdown.classList.add("hidden");
        }
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

    // Global Modal Backdrop Click to Close
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          this.hideModal(overlay);
        }
      });
    });

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
    } else if (hash === "sql-builder") {
      this.showSqlBuilderView();
    } else if (hash === "duty-roster") {
      this.showDutyRosterView();
    } else if (hash === "bhyt-xml") {
      this.showBhytXmlView();
    } else if (hash === "word-to-html") {
      this.showWordToHtmlView();
    } else if (hash === "pdf-to-image") {
      this.showPdfToImageView();
    } else {
      const tool = window.getToolById(hash);
      if (tool) {
        if (tool.id === "bhyt-xml") {
          this.showBhytXmlView();
        } else if (tool.id === "word-to-html") {
          this.showWordToHtmlView();
        } else if (tool.id === "pdf-to-image") {
          this.showPdfToImageView();
        } else if (tool.id === "sql-builder") {
          this.showSqlBuilderView();
        } else if (tool.id === "duty-roster") {
          this.showDutyRosterView();
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
    if (this.sqlBuilderView) this.sqlBuilderView.classList.add("hidden");
    if (this.dutyRosterView) this.dutyRosterView.classList.add("hidden");
    if (this.bhytXmlView) this.bhytXmlView.classList.add("hidden");
    if (this.dutyHeaderSessionWidget) this.dutyHeaderSessionWidget.classList.add("hidden");
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
    if (this.sqlBuilderView) this.sqlBuilderView.classList.add("hidden");
    if (this.dutyRosterView) this.dutyRosterView.classList.add("hidden");
    if (this.bhytXmlView) this.bhytXmlView.classList.add("hidden");
    if (this.dutyHeaderSessionWidget) this.dutyHeaderSessionWidget.classList.add("hidden");
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

  showSqlBuilderView() {
    this.currentToolId = "sql-builder";
    this.hubView.classList.add("hidden");
    this.toolView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
    if (this.pdfToImageView) this.pdfToImageView.classList.add("hidden");
    if (this.dutyRosterView) this.dutyRosterView.classList.add("hidden");
    if (this.bhytXmlView) this.bhytXmlView.classList.add("hidden");
    if (this.dutyHeaderSessionWidget) this.dutyHeaderSessionWidget.classList.add("hidden");
    if (this.sqlBuilderView) this.sqlBuilderView.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "sql-builder");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    this.renderSqlTemplatesList();
  }

  showDutyRosterView() {
    this.currentToolId = "duty-roster";
    this.hubView.classList.add("hidden");
    this.toolView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
    if (this.pdfToImageView) this.pdfToImageView.classList.add("hidden");
    if (this.sqlBuilderView) this.sqlBuilderView.classList.add("hidden");
    if (this.bhytXmlView) this.bhytXmlView.classList.add("hidden");
    if (this.dutyRosterView) this.dutyRosterView.classList.remove("hidden");
    if (this.dutyHeaderSessionWidget) this.dutyHeaderSessionWidget.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "duty-roster");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    const now = new Date();
    if (this.dutySelectMonth && !this.dutyMonthInitialized) {
      this.dutySelectMonth.value = String(now.getMonth() + 1);
    }
    if (this.dutySelectYear && !this.dutyMonthInitialized) {
      this.dutySelectYear.value = String(now.getFullYear());
    } else if (this.dutyInputYear && !this.dutyMonthInitialized) {
      this.dutyInputYear.value = String(now.getFullYear());
    }
    this.dutyMonthInitialized = true;

    this.dutyStaffList = ToolDutyRoster.getStaffList();
    this.currentDutySession = ToolDutyRoster.getCurrentSession();

    if (!this.currentDutySession) {
      // Khi chưa đăng nhập: Mặc định hiển thị lịch chung toàn bộ Phòng CNTT
      this.currentFilterStaffId = "all";
      this.currentDutyFilter = "all";
      this.dutyViewMode = "calendar";
      if (this.btnTabDutyCalendar) this.btnTabDutyCalendar.classList.add("active");
      if (this.btnTabDutyPersonal) this.btnTabDutyPersonal.classList.remove("active");
      if (this.btnTabDutyTable) this.btnTabDutyTable.classList.remove("active");
      if (this.dutyCalendarContainer) this.dutyCalendarContainer.classList.remove("hidden");
      if (this.dutyPersonalScheduleContainer) this.dutyPersonalScheduleContainer.classList.add("hidden");
      if (this.dutyTableContainer) this.dutyTableContainer.classList.add("hidden");

      if (this.dutyGuestLoginBanner) this.dutyGuestLoginBanner.classList.remove("hidden");
      this.showToast("🔐 Đăng nhập tài khoản để xem lịch trực cá nhân của bạn! Hiện đang hiển thị lịch chung toàn bộ Phòng CNTT.", "info", 5000, "Đăng Nhập", () => this.openDutyLoginModal());
    } else {
      if (this.dutyGuestLoginBanner) this.dutyGuestLoginBanner.classList.add("hidden");
      if (this.currentDutySession.role !== "admin" && this.currentDutySession.staffId) {
        this.currentFilterStaffId = this.currentDutySession.staffId;
        this.currentDutyFilter = "personal";
      } else {
        this.currentFilterStaffId = "all";
        this.currentDutyFilter = "all";
      }
    }

    this.updateDutySessionUI();
    this.renderStaffList();
    this.runAutoSchedule();
  }

  showBhytXmlView() {
    this.currentToolId = "bhyt-xml";
    this.hubView.classList.add("hidden");
    this.toolView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.wordToHtmlView) this.wordToHtmlView.classList.add("hidden");
    if (this.pdfToImageView) this.pdfToImageView.classList.add("hidden");
    if (this.sqlBuilderView) this.sqlBuilderView.classList.add("hidden");
    if (this.dutyRosterView) this.dutyRosterView.classList.add("hidden");
    if (this.dutyHeaderSessionWidget) this.dutyHeaderSessionWidget.classList.add("hidden");
    if (this.bhytXmlView) this.bhytXmlView.classList.remove("hidden");

    this.sidebarNav.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tool === "bhyt-xml");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showWordToHtmlView() {
    this.currentToolId = "word-to-html";
    this.hubView.classList.add("hidden");
    this.toolView.classList.add("hidden");
    this.schemaView.classList.add("hidden");
    if (this.pdfToImageView) this.pdfToImageView.classList.add("hidden");
    if (this.sqlBuilderView) this.sqlBuilderView.classList.add("hidden");
    if (this.dutyRosterView) this.dutyRosterView.classList.add("hidden");
    if (this.bhytXmlView) this.bhytXmlView.classList.add("hidden");
    if (this.dutyHeaderSessionWidget) this.dutyHeaderSessionWidget.classList.add("hidden");
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
    if (this.sqlBuilderView) this.sqlBuilderView.classList.add("hidden");
    if (this.dutyRosterView) this.dutyRosterView.classList.add("hidden");
    if (this.bhytXmlView) this.bhytXmlView.classList.add("hidden");
    if (this.dutyHeaderSessionWidget) this.dutyHeaderSessionWidget.classList.add("hidden");
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
    if (toolId === "sql-builder") {
      this.showSqlBuilderView();
      return;
    }
    if (toolId === "duty-roster") {
      this.showDutyRosterView();
      return;
    }
    if (toolId === "bhyt-xml") {
      this.showBhytXmlView();
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
    if (this.sqlBuilderView) this.sqlBuilderView.classList.add("hidden");
    if (this.dutyRosterView) this.dutyRosterView.classList.add("hidden");
    if (this.bhytXmlView) this.bhytXmlView.classList.add("hidden");
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
      preserveOriginalAlignment: true,
      preserveRichStyles: true,
      autoFilterBoundaries: false, // 100% không tự ý cắt bỏ nội dung
      unboldAll: false,
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

  /* =========================================================================
     SQL BUILDER CONTROLLER METHODS
     ========================================================================= */
  initSqlBuilderEvents() {
    this.sqlTemplateList = document.getElementById("sqlTemplateList");
    this.sqlDateRange = document.getElementById("sqlDateRange");
    this.sqlStatusFilter = document.getElementById("sqlStatusFilter");
    this.sqlLimit = document.getElementById("sqlLimit");
    this.sqlCurrentTitle = document.getElementById("sqlCurrentTitle");
    this.sqlCodeDisplay = document.getElementById("sqlCodeDisplay");
    this.btnCopySqlTop = document.getElementById("btnCopySqlTop");
    this.btnCopySqlEditor = document.getElementById("btnCopySqlEditor");
    this.btnDownloadSqlFile = document.getElementById("btnDownloadSqlFile");
    this.btnBackToHubFromSql = document.getElementById("btnBackToHubFromSql");
    this.sqlBuilderView = document.getElementById("sqlBuilderView");

    this.currentSqlTemplateId = "rpt_kcb_ngoaitru";
    this.currentGeneratedSql = "";

    if (this.btnBackToHubFromSql) {
      this.btnBackToHubFromSql.addEventListener("click", () => {
        window.location.hash = "";
      });
    }

    if (this.btnCopySqlTop) {
      this.btnCopySqlTop.addEventListener("click", () => this.copyCurrentSql());
    }
    if (this.btnCopySqlEditor) {
      this.btnCopySqlEditor.addEventListener("click", () => this.copyCurrentSql());
    }
    if (this.btnDownloadSqlFile) {
      this.btnDownloadSqlFile.addEventListener("click", () => this.downloadCurrentSqlFile());
    }

    if (this.sqlDateRange) {
      this.sqlDateRange.addEventListener("change", () => this.updateSqlOutput());
    }
    if (this.sqlStatusFilter) {
      this.sqlStatusFilter.addEventListener("change", () => this.updateSqlOutput());
    }
    if (this.sqlLimit) {
      this.sqlLimit.addEventListener("change", () => this.updateSqlOutput());
    }
  }

  renderSqlTemplatesList() {
    if (!this.sqlTemplateList || !window.ToolSqlBuilder) return;
    this.sqlTemplateList.innerHTML = "";

    ToolSqlBuilder.templates.forEach(tpl => {
      const card = document.createElement("div");
      card.className = `sql-template-card ${tpl.id === this.currentSqlTemplateId ? "active" : ""}`;
      card.dataset.id = tpl.id;
      card.innerHTML = `
        <div class="sql-template-top">
          <span class="sql-template-name">${tpl.name}</span>
          <span class="sql-template-cat">${tpl.category}</span>
        </div>
        <div class="sql-template-desc">${tpl.description}</div>
      `;
      card.addEventListener("click", () => {
        this.currentSqlTemplateId = tpl.id;
        this.sqlTemplateList.querySelectorAll(".sql-template-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        this.updateSqlOutput();
      });
      this.sqlTemplateList.appendChild(card);
    });

    this.updateSqlOutput();
}

  updateSqlOutput() {
    if (!window.ToolSqlBuilder) return;
    const tpl = ToolSqlBuilder.templates.find(t => t.id === this.currentSqlTemplateId);
    let rawSql = "";
    if (tpl) {
      rawSql = tpl.sql;
      if (this.sqlCurrentTitle) this.sqlCurrentTitle.textContent = `${tpl.id}.sql`;
    } else {
      rawSql = ToolSqlBuilder.generateCustomSql({
        dateRangeType: this.sqlDateRange ? this.sqlDateRange.value : "month",
        statusFilter: this.sqlStatusFilter ? this.sqlStatusFilter.value : "all",
        limit: this.sqlLimit ? parseInt(this.sqlLimit.value, 10) : 100
      });
      if (this.sqlCurrentTitle) this.sqlCurrentTitle.textContent = `Bao_cao_Tuy_Bien.sql`;
    }

    this.currentGeneratedSql = rawSql;
    if (this.sqlCodeDisplay) {
      this.sqlCodeDisplay.innerHTML = ToolSqlBuilder.highlightSql(rawSql);
    }
  }

  copyCurrentSql() {
    if (!this.currentGeneratedSql) return;
    navigator.clipboard.writeText(this.currentGeneratedSql).then(() => {
      this.showToast("Đã sao chép câu lệnh SQL vào Clipboard!", "success");
    }).catch(err => {
      this.showToast("Lỗi sao chép: " + err.message, "error");
    });
  }

  downloadCurrentSqlFile() {
    if (!this.currentGeneratedSql) return;
    const filename = this.sqlCurrentTitle ? this.sqlCurrentTitle.textContent : "Bao_cao_SQL_VIMES.sql";
    const blob = new Blob([this.currentGeneratedSql], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    const paths = this.getSavePathConfig();
    this.showToast(`Đã tải tệp SQL: ${filename} (Thư mục đề xuất: ${paths.schema})`, "success");
  }

  /* =========================================================================
     DUTY ROSTER CONTROLLER METHODS (Phòng Công Nghệ Thông Tin)
     ========================================================================= */
  initDutyRosterEvents() {
    this.dutyRosterView = document.getElementById("dutyRosterView");
    this.btnBackToHubFromDuty = document.getElementById("btnBackToHubFromDuty");
    this.btnRunAutoSchedule = document.getElementById("btnRunAutoSchedule");
    this.btnExportDutyExcel = document.getElementById("btnExportDutyExcel");
    this.dutySelectMonth = document.getElementById("dutySelectMonth");
    this.dutyInputYear = document.getElementById("dutyInputYear");
    this.staffCountDisplay = document.getElementById("staffCountDisplay");
    this.dutyStaffListContainer = document.getElementById("dutyStaffListContainer");
    
    // View Tab Controls
    this.btnTabDutyCalendar = document.getElementById("btnTabDutyCalendar");
    this.btnTabDutyPersonal = document.getElementById("btnTabDutyPersonal");
    this.btnTabDutyTable = document.getElementById("btnTabDutyTable");
    this.dutyCalendarContainer = document.getElementById("dutyCalendarContainer");
    this.dutyPersonalScheduleContainer = document.getElementById("dutyPersonalScheduleContainer");
    this.dutyTableContainer = document.getElementById("dutyTableContainer");

    // Filter Controls
    this.selectFilterSpecificStaff = document.getElementById("selectFilterSpecificStaff");

    // Personal Status Card Elements
    this.personalCardTitle = document.getElementById("personalCardTitle");
    this.personalRolePill = document.getElementById("personalRolePill");
    this.personalNextShiftText = document.getElementById("personalNextShiftText");
    this.personalTotalShifts = document.getElementById("personalTotalShifts");
    this.personalWeekdayShifts = document.getElementById("personalWeekdayShifts");
    this.personalWeekendShifts = document.getElementById("personalWeekendShifts");

    // Header Session Widget Elements
    this.dutyHeaderSessionWidget = document.getElementById("dutyHeaderSessionWidget");
    this.dutyHeaderAvatar = document.getElementById("dutyHeaderAvatar");
    this.dutyHeaderUserName = document.getElementById("dutyHeaderUserName");
    this.dutyHeaderRoleTag = document.getElementById("dutyHeaderRoleTag");
    this.btnOpenLoginModalHeader = document.getElementById("btnOpenLoginModalHeader");
    this.btnOpenUserManageModal = document.getElementById("btnOpenUserManageModal");

    // Modal: Auth Login
    this.modalDutyLogin = document.getElementById("modalDutyLogin");
    this.btnCloseLoginModal = document.getElementById("btnCloseLoginModal");
    this.btnCancelLoginModal = document.getElementById("btnCancelLoginModal");
    this.btnSubmitDutyLogin = document.getElementById("btnSubmitDutyLogin");
    this.inputDutyLoginUser = document.getElementById("inputDutyLoginUser");
    this.inputDutyLoginPass = document.getElementById("inputDutyLoginPass");
    this.quickLoginChipsContainer = document.getElementById("quickLoginChipsContainer");

    // Modal: User Management
    this.modalUserManagement = document.getElementById("modalUserManagement");
    this.btnCloseUserManageModal = document.getElementById("btnCloseUserManageModal");
    this.btnCloseUserManageModalFooter = document.getElementById("btnCloseUserManageModalFooter");
    this.dutyAccountsTableBody = document.getElementById("dutyAccountsTableBody");
    this.userFormTitle = document.getElementById("userFormTitle");
    this.inputEditAccId = document.getElementById("inputEditAccId");
    this.inputNewAccUser = document.getElementById("inputNewAccUser");
    this.inputNewAccPass = document.getElementById("inputNewAccPass");
    this.selectNewAccStaff = document.getElementById("selectNewAccStaff");
    this.selectNewAccRole = document.getElementById("selectNewAccRole");
    this.btnSubmitCreateAccount = document.getElementById("btnSubmitCreateAccount");
    this.btnResetAccountForm = document.getElementById("btnResetAccountForm");

    // Modal: Add/Edit Staff
    this.btnAddStaffModalBtn = document.getElementById("btnAddStaffModalBtn");
    this.modalAddStaff = document.getElementById("modalAddStaff");
    this.modalStaffTitle = document.getElementById("modalStaffTitle");
    this.inputEditStaffId = document.getElementById("inputEditStaffId");
    this.btnCloseAddStaffModal = document.getElementById("btnCloseAddStaffModal");
    this.btnCancelAddStaff = document.getElementById("btnCancelAddStaff");
    this.btnSaveNewStaff = document.getElementById("btnSaveNewStaff");
    this.inputStaffName = document.getElementById("inputStaffName");
    this.inputStaffRole = document.getElementById("inputStaffRole");
    this.inputStaffPhone = document.getElementById("inputStaffPhone");
    this.inputStaffOffDays = document.getElementById("inputStaffOffDays");
    this.inputStaffNoDuty = document.getElementById("inputStaffNoDuty");

    // Modal: Swap / Adjust Day Shift
    this.modalSwapShift = document.getElementById("modalSwapShift");
    this.btnCloseSwapShiftModal = document.getElementById("btnCloseSwapShiftModal");
    this.btnCancelSwapShift = document.getElementById("btnCancelSwapShift");
    this.btnConfirmSwapShift = document.getElementById("btnConfirmSwapShift");
    this.btnConfirmSwapStaff = document.getElementById("btnConfirmSwapStaff");
    this.btnConfirmSwapTwoDays = document.getElementById("btnConfirmSwapTwoDays");
    this.btnSetDayOffDuty = document.getElementById("btnSetDayOffDuty");
    this.selectSwapTargetDay = document.getElementById("selectSwapTargetDay");
    this.swapShiftInfoText = document.getElementById("swapShiftInfoText");
    this.selectSwapStaff = document.getElementById("selectSwapStaff");

    // Segmented Tabs inside Modal Adjust Shift
    this.tabBtnAdjAssign = document.getElementById("tabBtnAdjAssign");
    this.tabBtnAdjSwap = document.getElementById("tabBtnAdjSwap");
    this.tabBtnAdjDayoff = document.getElementById("tabBtnAdjDayoff");
    this.panelAdjAssign = document.getElementById("panelAdjAssign");
    this.panelAdjSwap = document.getElementById("panelAdjSwap");
    this.panelAdjDayoff = document.getElementById("panelAdjDayoff");

    // Modal Auto Schedule Options
    this.modalAutoScheduleOptions = document.getElementById("modalAutoScheduleOptions");
    this.btnCloseAutoScheduleModal = document.getElementById("btnCloseAutoScheduleModal");
    this.btnCancelAutoScheduleModal = document.getElementById("btnCancelAutoScheduleModal");
    this.btnConfirmRunAutoSchedule = document.getElementById("btnConfirmRunAutoSchedule");
    this.txtAutoScheduleTargetMonth = document.getElementById("txtAutoScheduleTargetMonth");

    // Quick Panel Buttons & Modals (Thống Kê & Cán Bộ)
    this.btnOpenDutyStatsModal = document.getElementById("btnOpenDutyStatsModal");
    this.btnOpenDutyStaffModal = document.getElementById("btnOpenDutyStaffModal");
    this.staffCountBtnBadge = document.getElementById("staffCountBtnBadge");
    this.modalDutyStats = document.getElementById("modalDutyStats");
    this.btnCloseDutyStatsModal = document.getElementById("btnCloseDutyStatsModal");
    this.btnDismissDutyStats = document.getElementById("btnDismissDutyStats");
    this.dutyStatsBreakdownContainer = document.getElementById("dutyStatsBreakdownContainer");
    this.modalDutyStaffList = document.getElementById("modalDutyStaffList");
    this.staffCountDisplay = document.getElementById("staffCountDisplay");
    this.btnCloseDutyStaffListModal = document.getElementById("btnCloseDutyStaffListModal");
    this.btnDismissDutyStaffList = document.getElementById("btnDismissDutyStaffList");

    // State Initialization
    this.currentDutyFilter = "all";
    this.currentFilterStaffId = "all";
    this.dutyViewMode = "calendar";
    this.dutySchedule = [];
    this.currentSwapTarget = null;

    this.dutyStaffList = ToolDutyRoster ? ToolDutyRoster.getStaffList() : [];
    this.currentDutySession = ToolDutyRoster ? ToolDutyRoster.getCurrentSession() : { username: "admin", role: "admin", fullname: "Trưởng Phòng CNTT (Quản trị)" };

    // Khởi tạo tháng và năm hiện tại thực tế trên giao diện
    this.dutySelectMonth = document.getElementById("dutySelectMonth");
    this.dutySelectYear = document.getElementById("dutySelectYear");
    this.dutyInputYear = document.getElementById("dutySelectYear") || document.getElementById("dutyInputYear");

    const now = new Date();
    if (this.dutySelectMonth) this.dutySelectMonth.value = String(now.getMonth() + 1);
    if (this.dutySelectYear) this.dutySelectYear.value = String(now.getFullYear());
    else if (this.dutyInputYear) this.dutyInputYear.value = String(now.getFullYear());

    // Event Bindings
    if (this.btnBackToHubFromDuty) {
      this.btnBackToHubFromDuty.addEventListener("click", () => {
        window.location.hash = "";
      });
    }

    if (this.dutySelectMonth) {
      this.dutySelectMonth.addEventListener("change", () => this.runAutoSchedule());
    }
    if (this.dutySelectYear) {
      this.dutySelectYear.addEventListener("change", () => this.runAutoSchedule());
    }
    if (this.dutyInputYear && this.dutyInputYear !== this.dutySelectYear) {
      this.dutyInputYear.addEventListener("input", () => this.runAutoSchedule());
    }

    // Modal Xếp Lịch Tự Động
    if (this.btnRunAutoSchedule) {
      this.btnRunAutoSchedule.addEventListener("click", () => {
        if (this.txtAutoScheduleTargetMonth) {
          this.txtAutoScheduleTargetMonth.textContent = `Tháng ${this.getSelectedDutyMonth()}/${this.getSelectedDutyYear()}`;
        }
        this.showModal(this.modalAutoScheduleOptions);
      });
    }
    if (this.btnCloseAutoScheduleModal) {
      this.btnCloseAutoScheduleModal.addEventListener("click", () => this.hideModal(this.modalAutoScheduleOptions));
    }
    if (this.btnCancelAutoScheduleModal) {
      this.btnCancelAutoScheduleModal.addEventListener("click", () => this.hideModal(this.modalAutoScheduleOptions));
    }
    if (this.btnConfirmRunAutoSchedule) {
      this.btnConfirmRunAutoSchedule.addEventListener("click", () => {
        const selectedAlgo = document.querySelector('input[name="autoScheduleAlgorithm"]:checked');
        const algo = selectedAlgo ? selectedAlgo.value : "fair";
        this.runAutoSchedule(algo);
        this.hideModal(this.modalAutoScheduleOptions);
        const algoName = (algo === "sequential") ? "Xoay vòng tuần tự (1 -> N)" : "Tự động công bằng & tránh ngày nghỉ";
        this.showToast(`Đã xếp lịch ${algoName} cho Tháng ${this.getSelectedDutyMonth()}/${this.getSelectedDutyYear()}!`, "success");
        this.recordOfflineChange("Xếp Lịch Tự Động", `Đã xếp lịch (${algoName}) cho Tháng ${this.getSelectedDutyMonth()}/${this.getSelectedDutyYear()}`);
      });
    }

    this.btnClearDutySchedule = document.getElementById("btnClearDutySchedule");
    if (this.btnClearDutySchedule) {
      this.btnClearDutySchedule.addEventListener("click", () => this.clearDutySchedule());
    }

    if (this.btnExportDutyExcel) {
      this.btnExportDutyExcel.addEventListener("click", () => this.exportDutyRosterExcel());
    }

    // View Mode Tabs
    if (this.btnTabDutyCalendar) this.btnTabDutyCalendar.addEventListener("click", () => this.switchDutyViewMode("calendar"));
    if (this.btnTabDutyPersonal) this.btnTabDutyPersonal.addEventListener("click", () => this.switchDutyViewMode("personal"));
    if (this.btnTabDutyTable) this.btnTabDutyTable.addEventListener("click", () => this.switchDutyViewMode("table"));

    // Filter by Staff Dropdown
    if (this.selectFilterSpecificStaff) {
      this.selectFilterSpecificStaff.addEventListener("change", (e) => {
        this.currentFilterStaffId = e.target.value;
        this.currentDutyFilter = (this.currentFilterStaffId !== "all") ? "personal" : "all";
        this.renderDutyViews();
      });
    }

    // Auth & Session
    this.dutyGuestLoginBanner = document.getElementById("dutyGuestLoginBanner");
    this.btnDutyLoginNow = document.getElementById("btnDutyLoginNow");
    this.btnDutyLogout = document.getElementById("btnDutyLogout");

    if (this.btnOpenLoginModalHeader) this.btnOpenLoginModalHeader.addEventListener("click", () => this.openDutyLoginModal());
    if (this.btnDutyLoginNow) this.btnDutyLoginNow.addEventListener("click", () => this.openDutyLoginModal());
    if (this.btnDutyLogout) this.btnDutyLogout.addEventListener("click", () => this.handleDutyLogout());
    if (this.btnCloseLoginModal) this.btnCloseLoginModal.addEventListener("click", () => this.hideModal(this.modalDutyLogin));
    if (this.btnCancelLoginModal) this.btnCancelLoginModal.addEventListener("click", () => this.hideModal(this.modalDutyLogin));
    if (this.btnSubmitDutyLogin) this.btnSubmitDutyLogin.addEventListener("click", () => this.handleDutyLoginSubmit());

    // User Management Modal
    if (this.btnOpenUserManageModal) this.btnOpenUserManageModal.addEventListener("click", () => this.openUserManageModal());
    if (this.btnCloseUserManageModal) this.btnCloseUserManageModal.addEventListener("click", () => this.hideModal(this.modalUserManagement));
    if (this.btnCloseUserManageModalFooter) this.btnCloseUserManageModalFooter.addEventListener("click", () => this.hideModal(this.modalUserManagement));
    if (this.btnSubmitCreateAccount) this.btnSubmitCreateAccount.addEventListener("click", () => this.saveUserAccount());
    if (this.btnResetAccountForm) this.btnResetAccountForm.addEventListener("click", () => this.resetAccountForm());

    // Add / Edit Staff Modal & Clean All Staff & Restore Default Staff
    if (this.btnAddStaffModalBtn) this.btnAddStaffModalBtn.addEventListener("click", () => this.openStaffModal());
    this.btnClearAllStaffBtn = document.getElementById("btnClearAllStaffBtn");
    if (this.btnClearAllStaffBtn) this.btnClearAllStaffBtn.addEventListener("click", () => this.clearAllStaffData());
    if (this.btnRestoreDefaultStaffBtn) this.btnRestoreDefaultStaffBtn.addEventListener("click", () => this.restoreDefaultStaffList());
    if (this.btnCloseAddStaffModal) this.btnCloseAddStaffModal.addEventListener("click", () => this.hideModal(this.modalAddStaff));
    if (this.btnCancelAddStaff) this.btnCancelAddStaff.addEventListener("click", () => this.hideModal(this.modalAddStaff));
    if (this.btnSaveNewStaff) this.btnSaveNewStaff.addEventListener("click", () => this.saveStaffFromModal());

    // Shift Adjustment & Swap Modal Segmented Tabs
    const switchAdjTab = (tabName) => {
      if (this.tabBtnAdjAssign) this.tabBtnAdjAssign.classList.toggle("active", tabName === "assign");
      if (this.tabBtnAdjSwap) this.tabBtnAdjSwap.classList.toggle("active", tabName === "swap");
      if (this.tabBtnAdjDayoff) this.tabBtnAdjDayoff.classList.toggle("active", tabName === "dayoff");
      if (this.panelAdjAssign) this.panelAdjAssign.classList.toggle("hidden", tabName !== "assign");
      if (this.panelAdjSwap) this.panelAdjSwap.classList.toggle("hidden", tabName !== "swap");
      if (this.panelAdjDayoff) this.panelAdjDayoff.classList.toggle("hidden", tabName !== "dayoff");
    };

    if (this.tabBtnAdjAssign) this.tabBtnAdjAssign.addEventListener("click", () => switchAdjTab("assign"));
    if (this.tabBtnAdjSwap) this.tabBtnAdjSwap.addEventListener("click", () => switchAdjTab("swap"));
    if (this.tabBtnAdjDayoff) this.tabBtnAdjDayoff.addEventListener("click", () => switchAdjTab("dayoff"));

    if (this.btnCloseSwapShiftModal) this.btnCloseSwapShiftModal.addEventListener("click", () => this.hideModal(this.modalSwapShift));
    if (this.btnCancelSwapShift) this.btnCancelSwapShift.addEventListener("click", () => this.hideModal(this.modalSwapShift));
    if (this.btnConfirmSwapStaff) this.btnConfirmSwapStaff.addEventListener("click", () => this.confirmSwapStaff());
    if (this.btnConfirmSwapTwoDays) this.btnConfirmSwapTwoDays.addEventListener("click", () => this.confirmSwapTwoDays());
    if (this.btnSetDayOffDuty) this.btnSetDayOffDuty.addEventListener("click", () => this.setDayOffDuty());

    // Quick Modals: Thống Kê & Cán Bộ
    if (this.btnOpenDutyStatsModal) {
      this.btnOpenDutyStatsModal.addEventListener("click", () => {
        this.updatePersonalDutyStatsUI();
        this.showModal(this.modalDutyStats);
      });
    }
    if (this.btnCloseDutyStatsModal) this.btnCloseDutyStatsModal.addEventListener("click", () => this.hideModal(this.modalDutyStats));
    if (this.btnDismissDutyStats) this.btnDismissDutyStats.addEventListener("click", () => this.hideModal(this.modalDutyStats));

    if (this.btnOpenDutyStaffModal) {
      this.btnOpenDutyStaffModal.addEventListener("click", () => {
        this.renderStaffList();
        this.showModal(this.modalDutyStaffList);
      });
    }
    if (this.btnCloseDutyStaffListModal) this.btnCloseDutyStaffListModal.addEventListener("click", () => this.hideModal(this.modalDutyStaffList));
    if (this.btnDismissDutyStaffList) this.btnDismissDutyStaffList.addEventListener("click", () => this.hideModal(this.modalDutyStaffList));

    this.updateDutySessionUI();
  }

  getSelectedDutyMonth() {
    return parseInt(this.dutySelectMonth ? this.dutySelectMonth.value : (new Date().getMonth() + 1), 10);
  }

  getSelectedDutyYear() {
    if (this.dutySelectYear && this.dutySelectYear.value) {
      return parseInt(this.dutySelectYear.value, 10);
    }
    if (this.dutyInputYear && this.dutyInputYear.value) {
      return parseInt(this.dutyInputYear.value, 10);
    }
    return new Date().getFullYear();
  }

  clearDutySchedule() {
    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ ca trực của Tháng ${month}/${year} để trống toàn bộ lịch không?`)) return;
    this.dutySchedule = ToolDutyRoster.clearSchedule(year, month);
    this.renderDutyViews();
    this.showToast(`Đã xóa toàn bộ ca trực Tháng ${month}/${year}!`, "info");
    this.recordOfflineChange("Xóa Lịch Trực", `Đã xóa toàn bộ ca trực Tháng ${month}/${year}`);
  }

  restoreDefaultStaffList() {
    if (!confirm("Khôi phục lại danh sách 8 cán bộ mẫu ban đầu của Phòng CNTT?")) return;
    this.dutyStaffList = [...ToolDutyRoster.defaultStaffList];
    ToolDutyRoster.saveStaffList(this.dutyStaffList);
    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    this.dutySchedule = ToolDutyRoster.generateSchedule(year, month, this.dutyStaffList, "fair");
    this.renderStaffList();
    this.renderDutyViews();
    this.showToast("Đã khôi phục danh sách 8 cán bộ mẫu ban đầu!", "success");
    this.recordOfflineChange("Khôi Phục Cán Bộ", "Khôi phục 8 cán bộ mẫu ban đầu");
  }

  clearAllStaffData() {
    if (!confirm("Bạn có chắc chắn muốn XÓA SẠCH toàn bộ cán bộ để tự nhập danh sách thực tế của phòng không?")) return;
    this.dutyStaffList = ToolDutyRoster.clearAllStaff();
    this.currentFilterStaffId = "all";
    this.currentDutyFilter = "all";
    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    this.dutySchedule = ToolDutyRoster.clearSchedule(year, month);
    this.renderStaffList();
    this.renderDutyViews();
    this.showToast("Đã dọn sạch danh sách cán bộ! Bạn có thể nhấn '+ Thêm Cán Bộ' để nhập danh sách thực tế.", "warning");
    this.recordOfflineChange("Xóa Danh Sách Cán Bộ", "Đã dọn sạch danh sách cán bộ");
  }

  updateDutySessionUI() {
    const isLogged = !!this.currentDutySession;
    const isAdmin = isLogged && (this.currentDutySession.role === "admin");

    if (this.dutyHeaderUserName) {
      this.dutyHeaderUserName.textContent = isLogged ? (this.currentDutySession.fullname || this.currentDutySession.username) : "Chưa đăng nhập";
    }
    if (this.dutyHeaderRoleTag) {
      this.dutyHeaderRoleTag.textContent = isLogged ? (isAdmin ? "ADMIN" : "USER") : "KHÁCH";
    }
    if (this.dutyHeaderAvatar) {
      this.dutyHeaderAvatar.textContent = isLogged ? (isAdmin ? "👑" : "💻") : "👤";
    }
    if (this.btnDutyLogout) {
      this.btnDutyLogout.classList.toggle("hidden", !isLogged);
    }
    if (this.dutyGuestLoginBanner) {
      this.dutyGuestLoginBanner.classList.toggle("hidden", isLogged);
    }

    const adminButtons = document.querySelectorAll(".admin-only-btn");
    adminButtons.forEach(btn => {
      btn.style.display = isAdmin ? "inline-flex" : "none";
    });
  }

  handleDutyLogout() {
    ToolDutyRoster.logout();
    this.currentDutySession = null;
    this.currentFilterStaffId = "all";
    this.currentDutyFilter = "all";
    this.dutyViewMode = "calendar";
    if (this.btnTabDutyCalendar) this.btnTabDutyCalendar.classList.add("active");
    if (this.btnTabDutyPersonal) this.btnTabDutyPersonal.classList.remove("active");
    if (this.btnTabDutyTable) this.btnTabDutyTable.classList.remove("active");
    if (this.dutyCalendarContainer) this.dutyCalendarContainer.classList.remove("hidden");
    if (this.dutyPersonalScheduleContainer) this.dutyPersonalScheduleContainer.classList.add("hidden");
    if (this.dutyTableContainer) this.dutyTableContainer.classList.add("hidden");

    this.updateDutySessionUI();
    this.populateStaffFilterDropdown();
    this.renderStaffList();
    this.renderDutyViews();
    this.showToast("Đã đăng xuất! Đang hiển thị lịch trực chung Toàn thể Phòng CNTT.", "info");
  }

  openDutyLoginModal() {
    if (this.inputDutyLoginUser) this.inputDutyLoginUser.value = "";
    if (this.inputDutyLoginPass) this.inputDutyLoginPass.value = "";
    this.showModal(this.modalDutyLogin);
  }

  handleDutyLoginSubmit() {
    const u = this.inputDutyLoginUser ? this.inputDutyLoginUser.value.trim() : "";
    const p = this.inputDutyLoginPass ? this.inputDutyLoginPass.value : "";
    if (!u) {
      this.showToast("Vui lòng nhập tên đăng nhập!", "warning");
      return;
    }
    const authRes = ToolDutyRoster.authenticate(u, p);
    if (authRes.success) {
      this.currentDutySession = authRes.user;

      if (authRes.user.role !== "admin" && authRes.user.staffId) {
        this.currentFilterStaffId = authRes.user.staffId;
        this.currentDutyFilter = "personal";
      } else {
        this.currentFilterStaffId = "all";
        this.currentDutyFilter = "all";
      }

      this.updateDutySessionUI();
      this.populateStaffFilterDropdown();
      this.hideModal(this.modalDutyLogin);
      this.showToast(`Chào mừng: ${authRes.user.fullname}! Đang hiển thị lịch trực của bạn.`, "success");
      this.renderStaffList();
      this.renderDutyViews();
    } else {
      this.showToast(authRes.message || "Sai tên đăng nhập hoặc mật khẩu!", "error");
    }
  }

  openUserManageModal() {
    this.resetAccountForm();
    this.populateStaffSelectInUserModal();
    this.renderUserAccountsTable();
    this.showModal(this.modalUserManagement);
  }

  populateStaffSelectInUserModal() {
    if (!this.selectNewAccStaff) return;
    this.selectNewAccStaff.innerHTML = `<option value="">-- Không liên kết cán bộ (Tài khoản chung) --</option>`;
    this.dutyStaffList = ToolDutyRoster.getStaffList();
    this.dutyStaffList.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.role})`;
      this.selectNewAccStaff.appendChild(opt);
    });
  }

  renderUserAccountsTable() {
    if (!this.dutyAccountsTableBody || !window.ToolDutyRoster) return;
    const accounts = ToolDutyRoster.getAccounts();
    this.dutyAccountsTableBody.innerHTML = "";
    accounts.forEach((acc, idx) => {
      const linkedStaff = this.dutyStaffList.find(s => s.id === acc.staffId);
      const staffName = linkedStaff ? linkedStaff.name : (acc.fullname || "Chưa gắn cán bộ");
      const isRootAdmin = (acc.username === "admin");
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="text-align:center;color:#94a3b8;">${idx + 1}</td>
        <td><strong style="color:#f1f5f9;">${acc.username}</strong></td>
        <td>
          <div class="pass-cell-display">
            <span class="user-pass-text">${acc.password}</span>
            <button type="button" class="btn-copy-pass-sm" title="Sao chép mật khẩu">📋</button>
          </div>
        </td>
        <td><span style="color:#38bdf8;">${staffName}</span></td>
        <td><span class="tool-badge badge-${acc.role === 'admin' ? 'purple' : 'blue'}">${acc.role === 'admin' ? 'Admin' : 'User'}</span></td>
        <td>
          <div class="acc-actions-wrap">
            <button type="button" class="btn-acc-act btn-edit-acc" title="Chỉnh sửa tài khoản">✏️ Sửa</button>
            ${!isRootAdmin ? `<button type="button" class="btn-acc-act btn-del-acc" title="Xóa tài khoản">🗑️ Xóa</button>` : `<span style="font-size:0.68rem;color:#94a3b8;font-style:italic;">Mặc định</span>`}
          </div>
        </td>
      `;
      tr.querySelector(".btn-copy-pass-sm").addEventListener("click", () => {
        navigator.clipboard.writeText(acc.password).then(() => this.showToast(`Đã sao chép mật khẩu tài khoản "${acc.username}": ${acc.password}`, "success"));
      });
      tr.querySelector(".btn-edit-acc").addEventListener("click", () => this.openEditAccountForm(acc.id));
      const delBtn = tr.querySelector(".btn-del-acc");
      if (delBtn) delBtn.addEventListener("click", () => this.deleteAccount(acc.id));
      this.dutyAccountsTableBody.appendChild(tr);
    });
  }

  openEditAccountForm(accId) {
    const accounts = ToolDutyRoster.getAccounts();
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return;
    if (this.inputEditAccId) this.inputEditAccId.value = acc.id;
    if (this.inputNewAccUser) this.inputNewAccUser.value = acc.username;
    if (this.inputNewAccPass) this.inputNewAccPass.value = acc.password;
    if (this.selectNewAccStaff) this.selectNewAccStaff.value = acc.staffId || "";
    if (this.selectNewAccRole) this.selectNewAccRole.value = acc.role || "user";
    if (this.userFormTitle) this.userFormTitle.textContent = `✏️ Chỉnh Sửa Tài Khoản: ${acc.username}`;
    if (this.btnSubmitCreateAccount) this.btnSubmitCreateAccount.textContent = "💾 CẬP NHẬT TÀI KHOẢN";
    if (this.btnResetAccountForm) this.btnResetAccountForm.style.display = "inline-block";
  }

  resetAccountForm() {
    if (this.inputEditAccId) this.inputEditAccId.value = "";
    if (this.inputNewAccUser) this.inputNewAccUser.value = "";
    if (this.inputNewAccPass) this.inputNewAccPass.value = "admin";
    if (this.selectNewAccStaff) this.selectNewAccStaff.value = "";
    if (this.selectNewAccRole) this.selectNewAccRole.value = "user";
    if (this.userFormTitle) this.userFormTitle.textContent = "➕ Cấp Tài Khoản Mới";
    if (this.btnSubmitCreateAccount) this.btnSubmitCreateAccount.textContent = "✨ LƯU TÀI KHOẢN";
    if (this.btnResetAccountForm) this.btnResetAccountForm.style.display = "none";
  }

  saveUserAccount() {
    const u = this.inputNewAccUser ? this.inputNewAccUser.value.trim() : "";
    const p = this.inputNewAccPass ? this.inputNewAccPass.value.trim() : "";
    const role = this.selectNewAccRole ? this.selectNewAccRole.value : "user";
    const staffId = this.selectNewAccStaff ? this.selectNewAccStaff.value : null;
    if (!u) {
      this.showToast("Vui lòng nhập tên đăng nhập!", "warning");
      return;
    }
    if (!p) {
      this.showToast("Mật khẩu không được để trống!", "warning");
      return;
    }
    const editId = this.inputEditAccId ? this.inputEditAccId.value : "";
    const accounts = ToolDutyRoster.getAccounts();
    let linkedStaffName = u;
    if (staffId) {
      const s = this.dutyStaffList.find(st => st.id === staffId);
      if (s) linkedStaffName = s.name;
    }
    if (editId) {
      const acc = accounts.find(a => a.id === editId);
      if (acc) {
        acc.username = u;
        acc.password = p;
        acc.role = role;
        acc.staffId = staffId || null;
        acc.fullname = linkedStaffName;
        ToolDutyRoster.saveAccounts(accounts);
        this.showToast(`Đã cập nhật tài khoản "${u}" thành công!`, "success");
      }
    } else {
      if (accounts.some(a => a.username.toLowerCase() === u.toLowerCase())) {
        this.showToast(`Tên đăng nhập "${u}" đã tồn tại!`, "error");
        return;
      }
      const newAcc = { id: "acc_" + Date.now(), username: u, password: p, fullname: linkedStaffName, role: role, dept: "Phòng CNTT", staffId: staffId || null };
      accounts.push(newAcc);
      ToolDutyRoster.saveAccounts(accounts);
      this.showToast(`Đã cấp mới tài khoản "${u}" thành công!`, "success");
    }
    this.resetAccountForm();
    this.renderUserAccountsTable();
  }

  deleteAccount(accId) {
    const accounts = ToolDutyRoster.getAccounts();
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return;
    if (acc.username === "admin") {
      this.showToast("Không thể xóa tài khoản Quản trị viên root (admin)!", "error");
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${acc.username}"?`)) return;
    const filtered = accounts.filter(a => a.id !== accId);
    ToolDutyRoster.saveAccounts(filtered);
    this.renderUserAccountsTable();
    this.showToast(`Đã xóa tài khoản "${acc.username}"!`, "info");
  }

  openStaffModal(staffId = null) {
    if (staffId) {
      const s = this.dutyStaffList.find(st => st.id === staffId);
      if (!s) return;
      if (this.modalStaffTitle) this.modalStaffTitle.textContent = "✏️ CHỈNH SỬA CÁN BỘ P.CNTT";
      if (this.inputEditStaffId) this.inputEditStaffId.value = s.id;
      if (this.inputStaffName) this.inputStaffName.value = s.name;
      if (this.inputStaffRole) this.inputStaffRole.value = s.role;
    if (this.inputStaffPhone) this.inputStaffPhone.value = s.phone || "";
      if (this.inputStaffOffDays) {
        this.inputStaffOffDays.value = Array.isArray(s.offDays) ? s.offDays.join(", ") : (s.offDays || "");
      }
      if (this.inputStaffNoDuty) this.inputStaffNoDuty.checked = !!s.noDuty;
    } else {
      if (this.modalStaffTitle) this.modalStaffTitle.textContent = "➕ THÊM CÁN BỘ PHÒNG CNTT";
      if (this.inputEditStaffId) this.inputEditStaffId.value = "";
      if (this.inputStaffName) this.inputStaffName.value = "";
      if (this.inputStaffRole) this.inputStaffRole.value = "";
      if (this.inputStaffPhone) this.inputStaffPhone.value = "";
      if (this.inputStaffOffDays) this.inputStaffOffDays.value = "";
      if (this.inputStaffNoDuty) this.inputStaffNoDuty.checked = false;
    }
    this.showModal(this.modalAddStaff);
  }

  saveStaffFromModal() {
    const name = this.inputStaffName ? this.inputStaffName.value.trim() : "";
    if (!name) {
      this.showToast("Vui lòng nhập họ tên cán bộ!", "warning");
      return;
    }
    const role = this.inputStaffRole && this.inputStaffRole.value.trim() ? this.inputStaffRole.value.trim() : "Kỹ sư CNTT";
    const phone = this.inputStaffPhone && this.inputStaffPhone.value.trim() ? this.inputStaffPhone.value.trim() : "";
    const offDays = this.inputStaffOffDays ? this.inputStaffOffDays.value.split(",").map(d => d.trim()).filter(d => d !== "") : [];
    const noDuty = this.inputStaffNoDuty ? this.inputStaffNoDuty.checked : false;
    const editId = this.inputEditStaffId ? this.inputEditStaffId.value : "";
    this.dutyStaffList = ToolDutyRoster.getStaffList();
    if (editId) {
      const s = this.dutyStaffList.find(st => st.id === editId);
      if (s) {
        s.name = name;
        s.role = role;
        s.phone = phone;
        s.offDays = offDays;
        s.noDuty = noDuty;
        this.showToast(`Đã cập nhật cán bộ "${name}"!`, "success");
      }
    } else {
      const newStaff = { id: "nv_" + Date.now(), name: name, role: role, dept: "Phòng CNTT", phone: phone, offDays: offDays, noDuty: noDuty };
      this.dutyStaffList.push(newStaff);
      this.showToast(`Đã thêm cán bộ "${name}" vào danh sách!`, "success");
    }
    ToolDutyRoster.saveStaffList(this.dutyStaffList);
    this.renderStaffList();
    this.hideModal(this.modalAddStaff);
    this.runAutoSchedule();
  }

  deleteStaff(staffId) {
    const s = this.dutyStaffList.find(st => st.id === staffId);
    if (!s) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa cán bộ "${s.name}" khỏi danh sách xếp lịch?`)) return;
    this.dutyStaffList = this.dutyStaffList.filter(st => st.id !== staffId);
    ToolDutyRoster.saveStaffList(this.dutyStaffList);
    
    // Xóa cache và tạo lại lịch trực tháng với danh sách cán bộ còn lại
    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    if (this.dutyStaffList.length > 0) {
      this.dutySchedule = ToolDutyRoster.generateSchedule(year, month, this.dutyStaffList, "fair");
    } else {
      this.dutySchedule = ToolDutyRoster.clearSchedule(year, month);
    }
    
    this.renderStaffList();
    this.renderDutyViews();
    this.showToast(`Đã xóa cán bộ "${s.name}" thành công!`, "info");
    this.recordOfflineChange("Xóa Cán Bộ", `Đã xóa cán bộ ${s.name}`);
  }

  renderStaffList() {
    this.dutyStaffList = ToolDutyRoster.getStaffList();
    if (this.staffCountDisplay) this.staffCountDisplay.textContent = this.dutyStaffList.length;
    if (this.staffCountBtnBadge) this.staffCountBtnBadge.textContent = this.dutyStaffList.length;
    if (!this.dutyStaffListContainer) return;
    this.dutyStaffListContainer.innerHTML = "";

    if (this.dutyStaffList.length === 0) {
      this.dutyStaffListContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 10px; color: #94a3b8; font-size: 0.78rem; background: rgba(15, 23, 42, 0.4); border: 1px dashed rgba(148, 163, 184, 0.2); border-radius: 8px;">
          <div style="font-size: 1.6rem; margin-bottom: 6px;">👥</div>
          <strong style="color:#f1f5f9; display:block; margin-bottom: 4px;">Chưa có cán bộ trong danh sách</strong>
          <p style="margin: 0; font-size: 0.72rem; color: #64748b;">Nhấn nút <strong>"➕ Thêm Cán Bộ"</strong> ở trên để bắt đầu thêm nhân sự.</p>
        </div>
      `;
      this.populateStaffFilterDropdown();
      return;
    }

    this.dutyStaffList.forEach((s, idx) => {
      const item = document.createElement("div");
      item.className = "staff-card-item";
      const offDaysStr = Array.isArray(s.offDays) ? s.offDays.join(", ") : (s.offDays || "");
      item.innerHTML = `
        <div class="staff-info" style="flex: 1;">
          <div class="flex-row gap-8 align-center" style="margin-bottom: 4px;">
            <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 800; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px;">#${idx + 1}</span>
            <span class="staff-name" style="font-size: 0.88rem; font-weight: 700; color: #f1f5f9;">${s.name}</span>
          </div>
          <div class="flex-row gap-6 align-center flex-wrap" style="font-size: 0.74rem;">
            <span class="staff-role-badge" style="background: rgba(148, 163, 184, 0.12); color: #94a3b8; padding: 2px 6px; border-radius: 4px;">${s.role}</span>
            ${s.phone ? `<span class="staff-phone-badge" style="color: #34d399; font-weight: 600;">📞 ${s.phone}</span>` : ""}
            ${s.noDuty ? `<span style="color: #f87171; font-size: 0.7rem; font-weight: 700; background: rgba(248, 113, 113, 0.18); border: 1px solid rgba(248, 113, 113, 0.35); padding: 1px 6px; border-radius: 4px;">🚫 Miễn trực</span>` : ""}
            ${offDaysStr ? `<span style="color: #fbbf24; font-size: 0.7rem; background: rgba(245, 158, 11, 0.1); padding: 1px 6px; border-radius: 4px;">💤 Nghỉ: Ngày ${offDaysStr}</span>` : ""}
          </div>
        </div>
        <div class="staff-card-actions" style="display: flex; gap: 6px;">
          <button type="button" class="btn-staff-act btn-edit-staff" title="Sửa thông tin / ngày nghỉ phép" data-id="${s.id}" style="padding: 5px 8px; font-size: 0.8rem; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; cursor: pointer; color: #38bdf8;">✏️</button>
          <button type="button" class="btn-staff-act btn-del-staff" title="Xóa cán bộ này" data-id="${s.id}" style="padding: 5px 8px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; color: #f87171;">🗑️</button>
        </div>
      `;
      item.querySelector(".btn-edit-staff").addEventListener("click", () => this.openStaffModal(s.id));
      item.querySelector(".btn-del-staff").addEventListener("click", () => this.deleteStaff(s.id));
      this.dutyStaffListContainer.appendChild(item);
    });
    this.populateStaffFilterDropdown();
  }

  populateStaffFilterDropdown() {
    if (!this.selectFilterSpecificStaff) return;
    this.selectFilterSpecificStaff.innerHTML = `<option value="all">-- Toàn thể Cán bộ P.CNTT --</option>`;
    this.dutyStaffList.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.role})`;
      if (this.currentFilterStaffId === s.id) opt.selected = true;
      this.selectFilterSpecificStaff.appendChild(opt);
    });
  }

  switchDutyView(mode) {
    this.dutyViewMode = mode;
    if (this.btnTabDutyCalendar) this.btnTabDutyCalendar.classList.toggle("active", mode === "calendar");
    if (this.btnTabDutyPersonal) this.btnTabDutyPersonal.classList.toggle("active", mode === "personal");
    if (this.btnTabDutyTable) this.btnTabDutyTable.classList.toggle("active", mode === "table");

    if (this.dutyCalendarContainer) this.dutyCalendarContainer.classList.toggle("hidden", mode !== "calendar");
    if (this.dutyPersonalScheduleContainer) this.dutyPersonalScheduleContainer.classList.toggle("hidden", mode !== "personal");
    if (this.dutyTableContainer) this.dutyTableContainer.classList.toggle("hidden", mode !== "table");

    this.renderDutyViews();
  }

  switchDutyViewMode(mode) {
    this.switchDutyView(mode);
  }

  runAutoSchedule(algorithm = "fair") {
    if (!window.ToolDutyRoster) return;
    this.dutyStaffList = ToolDutyRoster.getStaffList();
    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    this.dutySchedule = ToolDutyRoster.generateSchedule(year, month, this.dutyStaffList, algorithm);
    this.renderDutyViews();
  }

  renderDutyViews() {
    this.updatePersonalDutyStatsUI();
    if (this.dutyViewMode === "calendar") this.renderDutyCalendarView();
    else if (this.dutyViewMode === "personal") this.renderDutyPersonalView();
    else if (this.dutyViewMode === "table") this.renderDutyTableView();
  }

  updatePersonalDutyStatsUI() {
    this.updatePersonalDashboard();
  }

  updatePersonalDashboard() {
    if (this.staffCountBtnBadge) this.staffCountBtnBadge.textContent = this.dutyStaffList ? this.dutyStaffList.length : 0;
    if (this.staffCountDisplay) this.staffCountDisplay.textContent = this.dutyStaffList ? this.dutyStaffList.length : 0;

    if (!this.dutyStaffList || this.dutyStaffList.length === 0) {
      if (this.personalCardTitle) this.personalCardTitle.textContent = "Chưa có cán bộ";
      if (this.personalRolePill) this.personalRolePill.textContent = "0 Cán Bộ";
      if (this.personalTotalShifts) this.personalTotalShifts.textContent = "0";
      if (this.personalWeekdayShifts) this.personalWeekdayShifts.textContent = "0";
      if (this.personalWeekendShifts) this.personalWeekendShifts.textContent = "0";
      if (this.personalNextShiftText) this.personalNextShiftText.innerHTML = "Nhấn nút <strong>'+ Thêm Cán Bộ'</strong> ở danh sách cán bộ để bắt đầu nhập.";
      if (this.dutyStatsBreakdownContainer) {
        this.dutyStatsBreakdownContainer.innerHTML = `<div style="text-align:center; padding:12px; color:#94a3b8; font-size:0.75rem;">Chưa có dữ liệu cán bộ.</div>`;
      }
      return;
    }

    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    if (!this.dutySchedule || this.dutySchedule.length === 0) {
      this.dutySchedule = ToolDutyRoster.getSchedule(year, month);
    }

    const stats = ToolDutyRoster.calculateStatistics(this.dutyStaffList, this.dutySchedule);
    const assignedDays = this.dutySchedule.filter(d => d.shifts && d.shifts["shift_cntt"] && d.shifts["shift_cntt"].id && !d.shifts["shift_cntt"].isOffDay && d.shifts["shift_cntt"].name !== "Nghỉ trực");
    const total = assignedDays.length;
    const weekend = assignedDays.filter(d => d.isWeekend).length;
    const weekday = total - weekend;

    if (this.personalCardTitle) this.personalCardTitle.textContent = `Thống Kê Ca Trực Tháng ${month}/${year}`;
    if (this.personalRolePill) this.personalRolePill.textContent = `${this.dutyStaffList.length} Cán Bộ`;
    if (this.personalTotalShifts) this.personalTotalShifts.textContent = total;
    if (this.personalWeekdayShifts) this.personalWeekdayShifts.textContent = weekday;
    if (this.personalWeekendShifts) this.personalWeekendShifts.textContent = weekend;

    if (this.personalNextShiftText) {
      const today = new Date();
      let nextShiftStr = `⚡ Đã xếp đủ <strong>${total} ca trực</strong> Tháng ${month}/${year} chia đều cho <strong>${this.dutyStaffList.length} cán bộ</strong>`;
      if (today.getMonth() + 1 === month && today.getFullYear() === year) {
        const curDay = today.getDate();
        const upcoming = this.dutySchedule.find(d => d.day >= curDay && d.shifts["shift_cntt"] && !d.shifts["shift_cntt"].isOffDay && d.shifts["shift_cntt"].id);
        if (upcoming) {
          nextShiftStr = `📅 Ca trực tiếp theo: <strong>Ngày ${upcoming.day} (${upcoming.dayName})</strong> &bull; Trực: <span style="color:#38bdf8;">${upcoming.shifts["shift_cntt"].name}</span>`;
        }
      }
      this.personalNextShiftText.innerHTML = nextShiftStr;
    }

    // Populate Detailed Breakdown in Modal
    if (this.dutyStatsBreakdownContainer) {
      let breakdownHtml = "";
      stats.forEach(st => {
        const staffObj = this.dutyStaffList.find(s => s.id === st.id);
        const daysListStr = st.days && st.days.length > 0 ? st.days.join(", ") : "Chưa có";
        breakdownHtml += `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; margin-bottom:6px; background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:8px;">
            <div>
              <strong style="color:#f1f5f9; font-size:0.83rem;">${st.name}</strong>
              <span style="font-size:0.7rem; color:#94a3b8; display:block; margin-top:2px;">${staffObj ? staffObj.role : 'Kỹ sư'} &bull; Các ngày trực: <span style="color:#38bdf8;">${daysListStr}</span></span>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
              <span style="background:rgba(56,189,248,0.15); color:#38bdf8; padding:3px 8px; border-radius:6px; font-weight:700; font-size:0.75rem;">${st.total} ca</span>
              <span style="background:rgba(52,211,153,0.12); color:#34d399; padding:3px 6px; border-radius:6px; font-size:0.7rem;">${st.weekday} ngày thường</span>
              <span style="background:rgba(245,158,11,0.12); color:#fbbf24; padding:3px 6px; border-radius:6px; font-size:0.7rem;">${st.weekend} T7/CN</span>
            </div>
          </div>
        `;
      });
      this.dutyStatsBreakdownContainer.innerHTML = breakdownHtml;
    }
  }

  renderDutyCalendarView() {
    if (!this.dutyCalendarContainer || !window.ToolDutyRoster) return;
    this.dutyCalendarContainer.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "calendar-month-grid";
    const dayHeaders = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
    dayHeaders.forEach((dh, idx) => {
      const colHead = document.createElement("div");
      colHead.className = `calendar-col-header ${idx >= 5 ? 'col-weekend' : ''}`;
      colHead.innerHTML = `<span>${dh}</span>${idx >= 5 ? '<small style="display:block;font-size:0.65rem;color:#fbbf24;">(Cuối tuần)</small>' : ''}`;
      grid.appendChild(colHead);
    });

    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    const firstDayDow = ToolDutyRoster.getDayOfWeek(year, month, 1);
    const offset = (firstDayDow === 0) ? 6 : (firstDayDow - 1);

    for (let i = 0; i < offset; i++) {
      const blank = document.createElement("div");
      blank.className = "calendar-day-cell blank";
      blank.style.opacity = "0.15";
      grid.appendChild(blank);
    }

    const isFilteringSpecific = (this.currentFilterStaffId && this.currentFilterStaffId !== "all");
    const targetStaffId = isFilteringSpecific ? this.currentFilterStaffId : null;

    const isAdmin = (this.currentDutySession && this.currentDutySession.role === "admin");
    this.dutySchedule.forEach(dayObj => {
      const assigned = dayObj.shifts["shift_cntt"];
      const isOff = assigned && (assigned.isOffDay || assigned.name === "Nghỉ trực");
      const isAssigned = (assigned && assigned.id && assigned.name && assigned.name !== "Chưa có cán bộ" && !isOff);
      const assignedName = isOff ? "Nghỉ trực" : (isAssigned ? assigned.name : "Trống");
      const assignedPhone = (isAssigned && assigned.phone) ? assigned.phone : "";
      const assignedRole = (isAssigned && assigned.role) ? assigned.role : "";
      
      const isMyDay = (isAssigned && targetStaffId && assigned.id === targetStaffId);
      const isDimmed = (isFilteringSpecific && !isMyDay && !isOff);

      const cell = document.createElement("div");
      cell.className = `calendar-day-cell ${dayObj.isWeekend ? "weekend" : ""} ${isMyDay ? "my-duty-highlight" : ""} ${isOff ? "day-off-duty" : ""}`;
      cell.innerHTML = `
        <div class="cal-day-header">
          <span class="cal-date-num">${dayObj.day < 10 ? '0' + dayObj.day : dayObj.day}</span>
          <span class="cal-day-tag ${dayObj.isWeekend ? 'tag-weekend' : ''}">${dayObj.dayName}</span>
        </div>
        <div class="cal-shift-list">
          <div class="cal-duty-badge ${isOff ? 'badge-day-off' : (isAssigned ? 'has-staff' : 'empty-staff')} ${isMyDay ? 'highlight-duty' : ''} ${isDimmed ? 'dimmed' : ''}" data-day="${dayObj.day}" title="${isAdmin ? 'Nhấp để đổi cán bộ, hoán đổi ca hoặc đặt ngày nghỉ' : (isOff ? 'Ngày nghỉ trực' : (isAssigned ? `${assignedName} (${assignedRole})` : 'Chưa phân công'))}" style="cursor: pointer;">
            ${isOff 
              ? `<div class="duty-cell-off-content">
                  <span class="duty-badge-off">💤 Nghỉ trực</span>
                  <span class="duty-badge-sub-off">Không phân công</span>
                </div>`
              : (isAssigned 
                ? `<div class="duty-cell-staff-content">
                    <span class="duty-badge-name" title="${assignedName}">${assignedName}</span>
                    ${assignedRole ? `<span class="duty-badge-role" title="${assignedRole}">${assignedRole}</span>` : ''}
                    ${assignedPhone ? `<span class="duty-badge-phone">📞 ${assignedPhone}</span>` : ''}
                  </div>`
                : `<div class="duty-cell-empty-content">
                    <span class="duty-badge-empty">- Trống ca -</span>
                  </div>`
              )
            }
          </div>
        </div>
      `;
      cell.querySelector(".cal-duty-badge").addEventListener("click", () => {
        this.openSwapShiftModal(dayObj.day);
      });
      grid.appendChild(cell);
    });
    this.dutyCalendarContainer.appendChild(grid);
  }

  renderDutyPersonalView() {
    if (!this.dutyPersonalScheduleContainer || !window.ToolDutyRoster) return;
    this.dutyPersonalScheduleContainer.innerHTML = "";
    const month = parseInt(this.dutySelectMonth ? this.dutySelectMonth.value : "9", 10);
    const year = parseInt(this.dutyInputYear ? this.dutyInputYear.value : "2026", 10);

    const isAllMode = (!this.currentFilterStaffId || this.currentFilterStaffId === "all");

    if (isAllMode) {
      const headerCard = document.createElement("div");
      headerCard.className = "w2h-card";
      headerCard.style.marginBottom = "14px";
      headerCard.innerHTML = `
        <div class="w2h-card-body flex-between">
          <div>
            <h3 style="color:#fff;font-size:1.05rem;margin-bottom:4px;">👥 Lịch Phân Công Toàn Bộ Cán Bộ P.CNTT</h3>
            <p style="color:#38bdf8;font-size:0.8rem;">Tháng ${month}/${year} &bull; Tổng số: <strong>${this.dutySchedule.length} Ca Trực</strong> &bull; Chia đều cho <strong>${this.dutyStaffList.length} Cán Bộ</strong></p>
          </div>
          <span class="personal-status-pill">${this.dutyStaffList.length} Cán Bộ</span>
        </div>
      `;
      this.dutyPersonalScheduleContainer.appendChild(headerCard);

      const listWrap = document.createElement("div");
      listWrap.className = "duty-personal-grid";
      this.dutySchedule.forEach(dayObj => {
        const assigned = dayObj.shifts["shift_cntt"];
        const card = document.createElement("div");
        card.className = `personal-shift-card ${dayObj.isWeekend ? "weekend" : ""}`;
        card.innerHTML = `
          <div class="p-shift-left">
            <div class="p-shift-date-badge">
              <span class="p-shift-date-num">${dayObj.day < 10 ? '0' + dayObj.day : dayObj.day}</span>
              <span class="p-shift-dayname">${dayObj.dayName}</span>
            </div>
            <div class="p-shift-meta">
              <span class="p-shift-role-title">${assigned ? assigned.name : "Chưa phân công"}</span>
              <span style="font-size:0.75rem;color:#94a3b8;">${assigned ? assigned.role : "Phòng CNTT"} ${assigned && assigned.phone ? `&bull; 📞 ${assigned.phone}` : ""}</span>
            </div>
          </div>
          <span class="tool-badge badge-${dayObj.isWeekend ? 'amber' : 'blue'}">${dayObj.isWeekend ? 'Cuối tuần' : 'Ngày thường'}</span>
        `;
        listWrap.appendChild(card);
      });
      this.dutyPersonalScheduleContainer.appendChild(listWrap);
    } else {
      const staff = this.dutyStaffList.find(s => s.id === this.currentFilterStaffId);
      if (!staff) {
        this.dutyPersonalScheduleContainer.innerHTML = `<div class="terminal-box"><div class="log-line log-info">Không tìm thấy thông tin cán bộ.</div></div>`;
        return;
      }
      const personalShifts = ToolDutyRoster.getPersonalSchedule(staff.id, this.dutySchedule);
      const headerCard = document.createElement("div");
      headerCard.className = "w2h-card";
      headerCard.style.marginBottom = "14px";
      headerCard.innerHTML = `
        <div class="w2h-card-body flex-between">
          <div>
            <h3 style="color:#fff;font-size:1.05rem;margin-bottom:4px;">⭐ Lịch Trực Của: ${staff.name}</h3>
            <p style="color:#38bdf8;font-size:0.8rem;">Vị trí: <strong>${staff.role}</strong> &bull; Hotline: <strong>${staff.phone || "0912.345.678"}</strong> &bull; Tháng ${month}/${year} (${personalShifts.length} Ca Trực)</p>
          </div>
          <span class="personal-status-pill">Phòng CNTT</span>
        </div>
      `;
      this.dutyPersonalScheduleContainer.appendChild(headerCard);
      if (personalShifts.length === 0) {
        const emptyBox = document.createElement("div");
        emptyBox.className = "terminal-box";
        emptyBox.innerHTML = `<div class="log-line log-info">ℹ️ Cán bộ không có ca trực nào trong Tháng ${month}/${year}.</div>`;
        this.dutyPersonalScheduleContainer.appendChild(emptyBox);
        return;
      }
      const listWrap = document.createElement("div");
      listWrap.className = "duty-personal-grid";
      personalShifts.forEach(shift => {
        const card = document.createElement("div");
        card.className = `personal-shift-card ${shift.isWeekend ? "weekend" : ""}`;
        card.innerHTML = `
          <div class="p-shift-left">
            <div class="p-shift-date-badge">
              <span class="p-shift-date-num">${shift.day < 10 ? '0' + shift.day : shift.day}</span>
              <span class="p-shift-dayname">${shift.dayName}</span>
            </div>
            <div class="p-shift-meta">
              <span class="p-shift-role-title">Trực Phòng Công Nghệ Thông Tin (24/7)</span>
              <span style="font-size:0.75rem;color:#94a3b8;">Phụ trách: Hệ thống HIS VIMES, Máy Chủ, Cổng BHYT, Ký số & Mạng LAN Khoa/Phòng</span>
            </div>
          </div>
          <span class="tool-badge badge-${shift.isWeekend ? 'amber' : 'blue'}">${shift.isWeekend ? 'Cuối tuần' : 'Ngày thường'}</span>
        `;
        listWrap.appendChild(card);
      });
      this.dutyPersonalScheduleContainer.appendChild(listWrap);
    }
  }

  renderDutyTableView() {
    if (!this.dutyTableContainer || !window.ToolDutyRoster) return;
    this.dutyTableContainer.innerHTML = "";
    const month = parseInt(this.dutySelectMonth ? this.dutySelectMonth.value : "9", 10);
    const year = parseInt(this.dutyInputYear ? this.dutyInputYear.value : "2026", 10);
    const wrap = document.createElement("div");
    wrap.className = "duty-table-wrap";
    let tbodyHtml = "";
    this.dutySchedule.forEach(dayObj => {
      const assigned = dayObj.shifts["shift_cntt"];
      tbodyHtml += `<tr class="${dayObj.isWeekend ? "weekend-row" : ""}">
        <td><strong>Ngày ${dayObj.day}/${month}</strong></td>
        <td>${dayObj.dayName}</td>
        <td><strong style="color:#93c5fd;">${assigned ? assigned.name : "-"}</strong></td>
        <td>${assigned ? (assigned.phone || "-") : "-"}</td>
        <td>${dayObj.isWeekend ? '<span class="tool-badge badge-amber" style="font-size:0.65rem;">Cuối tuần</span>' : '<span style="color:#94a3b8;font-size:0.75rem;">Ngày thường</span>'}</td>
      </tr>`;
    });
    wrap.innerHTML = `<table class="duty-table"><thead><tr><th>Ngày</th><th>Thứ</th><th>Cán Bộ Trực P.CNTT</th><th>Số Điện Thoại Trực</th><th>Ghi Chú</th></tr></thead><tbody>${tbodyHtml}</tbody></table>`;
    this.dutyTableContainer.appendChild(wrap);
  }

  openSwapShiftModal(day) {
    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    this.currentSwapTarget = { day, month, year };
    this.dutySchedule = ToolDutyRoster.getSchedule(year, month);
    const dayObj = this.dutySchedule.find(d => d.day === day);
    const currentAssigned = dayObj ? dayObj.shifts["shift_cntt"] : null;
    const isOff = currentAssigned && (currentAssigned.isOffDay || currentAssigned.name === "Nghỉ trực");

    if (this.swapShiftInfoText) {
      this.swapShiftInfoText.innerHTML = `
        <div style="font-size:0.92rem; margin-bottom:5px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
          <span>📅 <strong>Ngày ${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year} (${dayObj ? dayObj.dayName : ''})</strong></span>
          <span style="font-size:0.72rem; padding:2px 8px; border-radius:12px; font-weight:600; background:${dayObj && dayObj.isWeekend ? 'rgba(245,158,11,0.2);color:#fbbf24;' : 'rgba(56,189,248,0.2);color:#38bdf8;'}">${dayObj && dayObj.isWeekend ? 'Cuối tuần (T7/CN)' : 'Ngày thường'}</span>
        </div>
        <div style="font-size:0.83rem; color:#cbd5e1; background:rgba(15,23,42,0.4); padding:6px 10px; border-radius:6px;">
          👤 Hiện tại: 
          ${isOff 
            ? '<strong style="color:#f87171;">💤 Nghỉ trực (Trống ca)</strong>' 
            : `<strong style="color:#38bdf8;">${currentAssigned && currentAssigned.name ? currentAssigned.name : 'Chưa phân công'}</strong> ${currentAssigned && currentAssigned.phone ? `<span style="color:#34d399;font-size:0.75rem;">(📞 ${currentAssigned.phone})</span>` : ''}`
          }
        </div>
      `;
    }

    // Reset về Tab 1 mặc định (Đổi Cán Bộ)
    if (this.tabBtnAdjAssign) this.tabBtnAdjAssign.classList.add("active");
    if (this.tabBtnAdjSwap) this.tabBtnAdjSwap.classList.remove("active");
    if (this.tabBtnAdjDayoff) this.tabBtnAdjDayoff.classList.remove("active");
    if (this.panelAdjAssign) this.panelAdjAssign.classList.remove("hidden");
    if (this.panelAdjSwap) this.panelAdjSwap.classList.add("hidden");
    if (this.panelAdjDayoff) this.panelAdjDayoff.classList.add("hidden");

    // 1. Dropdown chọn cán bộ thay thế
    if (this.selectSwapStaff) {
      this.selectSwapStaff.innerHTML = "";
      const stats = ToolDutyRoster.calculateStatistics(this.dutyStaffList, this.dutySchedule);
      this.dutyStaffList.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        const stStat = stats.find(st => st.id === s.id);
        const shiftCount = stStat ? stStat.total : 0;
        opt.textContent = `${s.name} (${s.role}) - [Đang có ${shiftCount} ca]`;
        if (currentAssigned && currentAssigned.id === s.id && !isOff) opt.selected = true;
        this.selectSwapStaff.appendChild(opt);
      });
    }

    // 2. Dropdown chọn ngày khác để hoán đổi chéo ca
    if (this.selectSwapTargetDay) {
      this.selectSwapTargetDay.innerHTML = "";
      this.dutySchedule.forEach(d => {
        if (d.day === day) return; // Không hoán đổi với chính ngày này
        const assigned = d.shifts["shift_cntt"];
        const isDOff = assigned && (assigned.isOffDay || assigned.name === "Nghỉ trực");
        const opt = document.createElement("option");
        opt.value = d.day;
        const nameStr = isDOff ? "Nghỉ trực" : (assigned && assigned.name ? assigned.name : "Trống");
        opt.textContent = `Ngày ${d.day < 10 ? '0' + d.day : d.day} (${d.dayName}) - ${nameStr}`;
        this.selectSwapTargetDay.appendChild(opt);
      });
    }

    // 3. Nút đặt ngày nghỉ / phục hồi ca trực
    if (this.btnSetDayOffDuty) {
      if (isOff) {
        this.btnSetDayOffDuty.textContent = "⚡ Hủy Nghỉ & Phân Công Lại Cán Bộ";
        this.btnSetDayOffDuty.className = "btn-duty-action btn-duty-auto";
        this.btnSetDayOffDuty.style.background = "linear-gradient(135deg, #0284c7, #2563eb)";
        this.btnSetDayOffDuty.style.color = "#fff";
      } else {
        this.btnSetDayOffDuty.textContent = "💤 Đặt Ngày Này Nghỉ Trực (Xóa Ca)";
        this.btnSetDayOffDuty.className = "btn-duty-action btn-duty-clear";
        this.btnSetDayOffDuty.style.background = "rgba(239, 68, 68, 0.12)";
        this.btnSetDayOffDuty.style.color = "#f87171";
      }
    }

    this.showModal(this.modalSwapShift);
  }

  confirmSwapStaff() {
    if (!this.currentSwapTarget || !this.selectSwapStaff) return;
    const { day, month, year } = this.currentSwapTarget;
    const selectedStaffId = this.selectSwapStaff.value;
    if (!selectedStaffId) {
      this.showToast("Vui lòng chọn cán bộ để phân công!", "warning");
      return;
    }
    const staff = this.dutyStaffList.find(s => s.id === selectedStaffId);
    this.dutySchedule = ToolDutyRoster.updateDayShift(year, month, day, selectedStaffId);
    this.renderDutyViews();
    this.hideModal(this.modalSwapShift);
    this.showToast(`Đã chuyển phân công Ngày ${day}/${month} cho: ${staff ? staff.name : selectedStaffId}`, "success");
    this.recordOfflineChange("Đổi Ca Trực", `Gán Ngày ${day}/${month} cho ${staff ? staff.name : selectedStaffId}`);
  }

  confirmSwapTwoDays() {
    if (!this.currentSwapTarget || !this.selectSwapTargetDay) return;
    const { day, month, year } = this.currentSwapTarget;
    const targetDay = parseInt(this.selectSwapTargetDay.value, 10);
    if (!targetDay || targetDay === day) {
      this.showToast("Vui lòng chọn ngày hợp lệ để hoán đổi!", "warning");
      return;
    }
    this.dutySchedule = ToolDutyRoster.swapDayShifts(year, month, day, targetDay);
    this.renderDutyViews();
    this.hideModal(this.modalSwapShift);
    this.showToast(`Đã hoán đổi ca trực giữa Ngày ${day} và Ngày ${targetDay}!`, "success");
    this.recordOfflineChange("Hoán Đổi Ca Trực", `Đổi chéo ca Ngày ${day} và Ngày ${targetDay} Tháng ${month}/${year}`);
  }

  setDayOffDuty() {
    if (!this.currentSwapTarget) return;
    const { day, month, year } = this.currentSwapTarget;
    const dayObj = this.dutySchedule.find(d => d.day === day);
    const isCurrentlyOff = dayObj && dayObj.shifts["shift_cntt"] && (dayObj.shifts["shift_cntt"].isOffDay || dayObj.shifts["shift_cntt"].name === "Nghỉ trực");

    if (isCurrentlyOff) {
      const selectedStaffId = this.selectSwapStaff ? this.selectSwapStaff.value : (this.dutyStaffList[0] ? this.dutyStaffList[0].id : "");
      this.dutySchedule = ToolDutyRoster.updateDayShift(year, month, day, selectedStaffId);
      const staff = this.dutyStaffList.find(s => s.id === selectedStaffId);
      this.showToast(`Đã hủy nghỉ trực và gán lại cho: ${staff ? staff.name : 'Cán bộ'}`, "success");
    } else {
      this.dutySchedule = ToolDutyRoster.updateDayShift(year, month, day, "OFF");
      this.showToast(`Đã đặt Ngày ${day}/${month} thành ngày NGHỈ TRỰC (Không phân công)`, "info");
    }
    this.renderDutyViews();
    this.hideModal(this.modalSwapShift);
    this.recordOfflineChange("Điều Chỉnh Ca Trực", `Cập nhật trạng thái Ngày ${day}/${month}`);
  }

  async exportDutyRosterExcel() {
    if (!window.ToolDutyRoster || this.dutySchedule.length === 0) {
      this.showToast("Chưa có lịch trực để xuất Excel!", "warning");
      return;
    }
    const month = this.getSelectedDutyMonth();
    const year = this.getSelectedDutyYear();
    const orgCfg = window.ToolVgcaDoiChieu ? window.ToolVgcaDoiChieu.getOrgConfig() : {};
    await ToolDutyRoster.exportToExcel(year, month, this.dutySchedule, this.dutyStaffList, null, orgCfg);
    this.showToast(`Đã xuất bản file Excel Lịch Trực Phòng CNTT Tháng ${month}/${year} thành công!`, "success");
  }

  // =========================================================================
  // NETWORK STATUS MONITOR (ONLINE / OFFLINE DETECTION)
  // =========================================================================
  initNetworkStatus() {
    this.connectionStatusBadge = document.getElementById("connectionStatusBadge");
    this.connectionStatusDot = document.getElementById("connectionStatusDot");
    this.connectionStatusText = document.getElementById("connectionStatusText");
    this.offlineAlertBanner = document.getElementById("offlineAlertBanner");
    this.btnDismissOfflineBanner = document.getElementById("btnDismissOfflineBanner");

    const updateStatus = (isOnline, notify = false) => {
      if (this.connectionStatusBadge) {
        this.connectionStatusBadge.classList.toggle("online", isOnline);
        this.connectionStatusBadge.classList.toggle("offline", !isOnline);
      }
      if (this.connectionStatusText) {
        this.connectionStatusText.textContent = isOnline ? "Trực tuyến" : "Ngoại tuyến (Offline)";
      }
      if (this.offlineAlertBanner) {
        this.offlineAlertBanner.classList.toggle("hidden", isOnline);
      }

      if (notify) {
        if (isOnline) {
          this.showToast("🌐 Đã kết nối Internet trở lại! Hệ thống đang ở trạng thái Trực tuyến.", "success");
        } else {
          this.showToast("⚠️ Mất kết nối Internet! Hệ thống đã chuyển sang Chế độ Ngoại tuyến (Offline Mode) an toàn.", "warning");
        }

        if (this.notifManager) {
          this.notifManager.addNotification({
            type: isOnline ? "success" : "warning",
            category: "system",
            icon: isOnline ? "🌐" : "⚠️",
            title: isOnline ? "Đã kết nối Internet trở lại" : "Mất kết nối Internet (Offline Mode)",
            message: isOnline ? "Hệ thống đang hoạt động ở trạng thái trực tuyến bình thường." : "Đã chuyển sang chế độ Ngoại tuyến an toàn. Mọi công cụ vẫn xử lý 100% trên máy tính.",
            playSound: true
          });
          this.updateNotificationBadge();
          this.renderNotificationCenter();
        }
      }
    };

    window.addEventListener("online", () => updateStatus(true, true));
    window.addEventListener("offline", () => updateStatus(false, true));

    if (this.btnDismissOfflineBanner) {
      this.btnDismissOfflineBanner.addEventListener("click", () => {
        if (this.offlineAlertBanner) this.offlineAlertBanner.classList.add("hidden");
      });
    }

    // Initial check
    updateStatus(navigator.onLine !== false, false);
  }

  // =========================================================================
  // NOTIFICATION CENTER SYSTEM
  // =========================================================================
  initNotificationEvents() {
    if (!this.notifManager) this.notifManager = new NotificationManager();

    // Toggle dropdown
    if (this.btnToggleNotificationCenter) {
      this.btnToggleNotificationCenter.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.notificationCenterPanel) {
          const isOpen = !this.notificationCenterPanel.classList.contains("hidden");
          this.notificationCenterPanel.classList.toggle("hidden", isOpen);
          if (!isOpen) {
            this.renderNotificationCenter();
          }
        }
      });
    }

    // Click outside to close notification panel
    document.addEventListener("click", (e) => {
      if (this.notificationCenterPanel && !this.notificationCenterPanel.classList.contains("hidden")) {
        if (!this.notificationCenterPanel.contains(e.target) && !this.btnToggleNotificationCenter.contains(e.target)) {
          this.notificationCenterPanel.classList.add("hidden");
        }
      }
    });

    // Mark all as read
    if (this.btnMarkAllNotifsRead) {
      this.btnMarkAllNotifsRead.addEventListener("click", () => {
        const list = this.notifManager.getNotifications();
        list.forEach(n => n.isRead = true);
        this.notifManager.saveNotifications(list);
        this.updateNotificationBadge();
        this.renderNotificationCenter();
        this.showToast("Đã đánh dấu tất cả thông báo là đã đọc.", "info");
      });
    }

    // Clear all notifications
    if (this.btnClearAllNotifs) {
      this.btnClearAllNotifs.addEventListener("click", () => {
        this.notifManager.saveNotifications([]);
        this.updateNotificationBadge();
        this.renderNotificationCenter();
        this.showToast("Đã xóa toàn bộ lịch sử thông báo.", "info");
      });
    }

    // Filter tabs inside panel
    if (this.notifFilterTabs) {
      this.notifFilterTabs.querySelectorAll(".notif-tab-item").forEach(tab => {
        tab.addEventListener("click", () => {
          this.notifFilterTabs.querySelectorAll(".notif-tab-item").forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          this.currentNotifCategory = tab.dataset.cat || "all";
          this.renderNotificationCenter();
        });
      });
    }

    // Sound toggle
    if (this.chkToggleNotifSound) {
      this.chkToggleNotifSound.checked = this.notifManager.getSoundEnabled();
      this.chkToggleNotifSound.addEventListener("change", (e) => {
        this.notifManager.setSoundEnabled(e.target.checked);
      });
    }

    // Run automated smart checks on page load
    setTimeout(() => {
      const schedule = (window.ToolDutyRoster) ? ToolDutyRoster.getSchedule(new Date().getFullYear(), new Date().getMonth() + 1) : [];
      const staffList = (window.ToolDutyRoster) ? ToolDutyRoster.getStaffList() : [];
      this.notifManager.runAutomatedSmartAlerts(schedule, staffList);
      this.updateNotificationBadge();
    }, 1500);

    this.updateNotificationBadge();
  }

  updateNotificationBadge() {
    if (!this.notifManager) return;
    const unread = this.notifManager.getUnreadCount();
    if (this.notificationBadgeCount) {
      this.notificationBadgeCount.textContent = unread;
      this.notificationBadgeCount.classList.toggle("hidden", unread === 0);
    }
  }

  renderNotificationCenter() {
    if (!this.notificationListContainer || !this.notifManager) return;
    const list = this.notifManager.getNotifications();
    const category = this.currentNotifCategory || "all";
    const filtered = (category === "all") ? list : list.filter(n => n.category === category);

    this.notificationListContainer.innerHTML = "";

    if (filtered.length === 0) {
      this.notificationListContainer.innerHTML = `
        <div class="notif-empty-state">
          <span class="empty-icon">🔕</span>
          <p>Không có thông báo nào trong mục này</p>
        </div>
      `;
      return;
    }

    filtered.forEach(notif => {
      const item = document.createElement("div");
      item.className = `notif-item ${notif.isRead ? "read" : "unread"} notif-${notif.type || "info"}`;
      
      const iconWrap = document.createElement("div");
      iconWrap.className = "notif-item-icon";
      iconWrap.textContent = notif.icon || (notif.type === "success" ? "✅" : notif.type === "warning" ? "⚠️" : "🔔");

      const body = document.createElement("div");
      body.className = "notif-item-body";

      const title = document.createElement("div");
      title.className = "notif-item-title";
      title.innerHTML = `${notif.title} <span class="notif-item-time">${this.notifManager.formatTimeAgo(notif.timestamp)}</span>`;

      const msg = document.createElement("div");
      msg.className = "notif-item-msg";
      msg.innerHTML = notif.message;

      body.appendChild(title);
      body.appendChild(msg);

      if (notif.actionText && notif.actionHash) {
        const actionBtn = document.createElement("a");
        actionBtn.href = notif.actionHash;
        actionBtn.className = "notif-item-action-link";
        actionBtn.textContent = notif.actionText;
        actionBtn.addEventListener("click", () => {
          notif.isRead = true;
          this.notifManager.saveNotifications(list);
          this.updateNotificationBadge();
          if (this.notificationCenterPanel) this.notificationCenterPanel.classList.add("hidden");
        });
        body.appendChild(actionBtn);
      }

      item.appendChild(iconWrap);
      item.appendChild(body);

      item.addEventListener("click", (e) => {
        if (e.target.tagName !== "A") {
          notif.isRead = true;
          this.notifManager.saveNotifications(list);
          this.updateNotificationBadge();
          item.classList.remove("unread");
          item.classList.add("read");
        }
      });

      this.notificationListContainer.appendChild(item);
    });
  }

  // =========================================================================
  // BHYT XML 4210 & 130 VALIDATOR CONTROLLER METHODS
  // =========================================================================
  initBhytXmlEvents() {
    this.bhytXmlView = document.getElementById("bhytXmlView");
    this.btnBackToHubFromXml = document.getElementById("btnBackToHubFromXml");
    this.btnXmlRecheck = document.getElementById("btnXmlRecheck");
    this.btnExportXmlErrorReport = document.getElementById("btnExportXmlErrorReport");
    this.btnXmlAutoFix = document.getElementById("btnXmlAutoFix");
    this.btnXmlDownloadCleanZip = document.getElementById("btnXmlDownloadCleanZip");
    this.xmlAutoFixBanner = document.getElementById("xmlAutoFixBanner");
    this.btnTriggerAutoFixInBanner = document.getElementById("btnTriggerAutoFixInBanner");

    this.xmlDropzoneWrapper = document.getElementById("xmlDropzoneWrapper");
    this.xmlDropzone = document.getElementById("xmlDropzone");
    this.xmlFileInput = document.getElementById("xmlFileInput");
    this.btnBrowseXmlFiles = document.getElementById("btnBrowseXmlFiles");

    this.xmlProgressContainer = document.getElementById("xmlProgressContainer");
    this.xmlProgressLabel = document.getElementById("xmlProgressLabel");
    this.xmlProgressPercent = document.getElementById("xmlProgressPercent");
    this.xmlProgressBarFill = document.getElementById("xmlProgressBarFill");

    this.xmlResultsDashboard = document.getElementById("xmlResultsDashboard");
    this.xmlStatTotal = document.getElementById("xmlStatTotal");
    this.xmlStatValid = document.getElementById("xmlStatValid");
    this.xmlStatWarning = document.getElementById("xmlStatWarning");
    this.xmlStatCritical = document.getElementById("xmlStatCritical");

    this.xmlCategoryTabs = document.getElementById("xmlCategoryTabs");
    this.countTabAll = document.getElementById("countTabAll");
    this.countTabCritical = document.getElementById("countTabCritical");
    this.countTabWarning = document.getElementById("countTabWarning");
    this.countTabValid = document.getElementById("countTabValid");

    this.xmlSearchInput = document.getElementById("xmlSearchInput");
    this.xmlTableBody = document.getElementById("xmlTableBody");

    // Modal Detail Elements
    this.modalXmlDetail = document.getElementById("modalXmlDetail");
    this.xmlModalMaLk = document.getElementById("xmlModalMaLk");
    this.btnCloseXmlDetailModal = document.getElementById("btnCloseXmlDetailModal");
    this.btnCloseXmlDetailFooter = document.getElementById("btnCloseXmlDetailFooter");
    this.xmlModalPatientInfo = document.getElementById("xmlModalPatientInfo");
    this.xmlModalErrorsList = document.getElementById("xmlModalErrorsList");
    this.xmlModalRawData = document.getElementById("xmlModalRawData");
    this.btnCopyXmlRawData = document.getElementById("btnCopyXmlRawData");

    this.currentXmlFilter = "all";
    this.xmlValidationResult = null;
    this.currentModalEncounter = null;

    // Event Bindings
    if (this.btnBackToHubFromXml) {
      this.btnBackToHubFromXml.addEventListener("click", () => {
        window.location.hash = "";
      });
    }

    if (this.btnBrowseXmlFiles && this.xmlFileInput) {
      this.btnBrowseXmlFiles.addEventListener("click", (e) => {
        e.stopPropagation();
        this.xmlFileInput.click();
      });
    }

    if (this.xmlFileInput) {
      this.xmlFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleXmlFilesUpload(Array.from(e.target.files));
        }
      });
    }

    if (this.xmlDropzone) {
      this.xmlDropzone.addEventListener("click", (e) => {
        if (e.target.closest("#btnLoadSampleXml")) return;
        if (this.xmlFileInput) this.xmlFileInput.click();
      });

      this.xmlDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        this.xmlDropzone.classList.add("dragover");
      });
      this.xmlDropzone.addEventListener("dragleave", () => {
        this.xmlDropzone.classList.remove("dragover");
      });
      this.xmlDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        this.xmlDropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleXmlFilesUpload(Array.from(e.dataTransfer.files));
        }
      });
    }

    this.btnLoadSampleXml = document.getElementById("btnLoadSampleXml");
    if (this.btnLoadSampleXml) {
      this.btnLoadSampleXml.addEventListener("click", (e) => {
        e.stopPropagation();
        if (window.ToolBhytXml && typeof ToolBhytXml.createSampleDataset === "function") {
          const sampleFiles = ToolBhytXml.createSampleDataset();
          this.handleXmlFilesUpload(sampleFiles);
        }
      });
    }

    if (this.btnXmlRecheck) {
      this.btnXmlRecheck.addEventListener("click", () => {
        this.resetBhytXmlState();
      });
    }

    if (this.btnExportXmlErrorReport) {
      this.btnExportXmlErrorReport.addEventListener("click", () => {
        this.exportXmlErrorReport();
      });
    }

    if (this.btnXmlAutoFix) {
      this.btnXmlAutoFix.addEventListener("click", () => {
        this.handleXmlAutoFix();
      });
    }

    if (this.btnTriggerAutoFixInBanner) {
      this.btnTriggerAutoFixInBanner.addEventListener("click", () => {
        this.handleXmlAutoFix();
      });
    }

    if (this.btnXmlDownloadCleanZip) {
      this.btnXmlDownloadCleanZip.addEventListener("click", () => {
        this.handleXmlDownloadCleanZip();
      });
    }

    // Filter tabs
    if (this.xmlCategoryTabs) {
      this.xmlCategoryTabs.querySelectorAll(".xml-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          this.xmlCategoryTabs.querySelectorAll(".xml-tab-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          this.currentXmlFilter = btn.dataset.cat;
          this.renderXmlTable();
        });
      });
    }

    if (this.xmlSearchInput) {
      this.xmlSearchInput.addEventListener("input", () => this.renderXmlTable());
    }

    // Modal
    if (this.btnCloseXmlDetailModal) this.btnCloseXmlDetailModal.addEventListener("click", () => this.hideModal(this.modalXmlDetail));
    if (this.btnCloseXmlDetailFooter) this.btnCloseXmlDetailFooter.addEventListener("click", () => this.hideModal(this.modalXmlDetail));
    if (this.btnCopyXmlRawData) {
      this.btnCopyXmlRawData.addEventListener("click", () => {
        if (this.xmlModalRawData) {
          navigator.clipboard.writeText(this.xmlModalRawData.textContent).then(() => {
            this.showToast("Đã sao chép dữ liệu XML của hồ sơ vào Clipboard!", "success");
          });
        }
      });
    }
  }

  async handleXmlFilesUpload(files) {
    if (!files || files.length === 0) return;

    if (!window.ToolBhytXml) {
      this.showToast("Mô-đun kiểm tra XML BHYT chưa sẵn sàng. Vui lòng tải lại trang.", "error");
      return;
    }

    try {
      if (this.xmlProgressContainer) {
        this.xmlProgressContainer.classList.remove("hidden");
        this.xmlProgressLabel.textContent = "Đang đọc và phân tích gói tệp XML...";
        this.xmlProgressPercent.textContent = "5%";
        this.xmlProgressBarFill.style.width = "5%";
      }

      this.showToast(`Bắt đầu phân tích ${files.length} tệp...`, "info");

      const result = await ToolBhytXml.validateFiles(files, (pct, msg) => {
        if (this.xmlProgressPercent) this.xmlProgressPercent.textContent = `${pct}%`;
        if (this.xmlProgressBarFill) this.xmlProgressBarFill.style.width = `${pct}%`;
        if (this.xmlProgressLabel) this.xmlProgressLabel.textContent = msg;
      });

      this.xmlValidationResult = result;

      // Update stat cards
      if (this.xmlStatTotal) this.xmlStatTotal.textContent = result.totalEncounters.toLocaleString("vi-VN");
      if (this.xmlStatValid) this.xmlStatValid.textContent = result.validCount.toLocaleString("vi-VN");
      if (this.xmlStatWarning) this.xmlStatWarning.textContent = result.warningCount.toLocaleString("vi-VN");
      if (this.xmlStatCritical) this.xmlStatCritical.textContent = result.criticalCount.toLocaleString("vi-VN");

      // Update tab count badges
      if (this.countTabAll) this.countTabAll.textContent = result.totalEncounters;
      if (this.countTabCritical) this.countTabCritical.textContent = result.criticalCount;
      if (this.countTabWarning) this.countTabWarning.textContent = result.warningCount;
      if (this.countTabValid) this.countTabValid.textContent = result.validCount;

      // Render table
      this.renderXmlTable();

      // Show results, hide progress
      if (this.xmlProgressContainer) this.xmlProgressContainer.classList.add("hidden");
      if (this.xmlDropzoneWrapper) this.xmlDropzoneWrapper.classList.add("hidden");
      if (this.xmlResultsDashboard) this.xmlResultsDashboard.classList.remove("hidden");
      if (this.btnXmlRecheck) this.btnXmlRecheck.classList.remove("hidden");
      if (this.btnExportXmlErrorReport) this.btnExportXmlErrorReport.classList.remove("hidden");
      if (this.btnXmlAutoFix) this.btnXmlAutoFix.classList.remove("hidden");

      // Check if there are fixable errors to show banner
      if (this.xmlAutoFixBanner) {
        if (result.criticalCount > 0 || result.warningCount > 0) {
          this.xmlAutoFixBanner.classList.remove("hidden");
        } else {
          this.xmlAutoFixBanner.classList.add("hidden");
        }
      }

      if (this.notifManager) {
        this.notifManager.addNotification({
          type: result.criticalCount > 0 ? "warning" : "success",
          category: "bhyt",
          icon: "🏥",
          title: `Kiểm tra XML BHYT: ${result.totalEncounters} Hồ sơ`,
          message: `Hợp lệ: <strong>${result.validCount}</strong> &bull; Cảnh báo: <strong>${result.warningCount}</strong> &bull; Lỗi nặng: <strong>${result.criticalCount}</strong>.`,
          actionText: "Xem bảng lỗi",
          actionHash: "#bhyt-xml",
          playSound: true
        });
        this.updateNotificationBadge();
        this.renderNotificationCenter();
      }

      this.showToast(`Đã kiểm tra xong ${result.totalEncounters} hồ sơ! Phát hiện ${result.criticalCount} hồ sơ lỗi nặng.`, result.criticalCount > 0 ? "warning" : "success");
    } catch (err) {
      console.error(err);
      this.showToast(`Lỗi xử lý file XML: ${err.message}`, "error");
      if (this.xmlProgressContainer) this.xmlProgressContainer.classList.add("hidden");
    }
  }

  handleXmlAutoFix() {
    if (!this.xmlValidationResult || !window.ToolBhytXml) {
      this.showToast("Chưa có hồ sơ XML để sửa lỗi!", "warning");
      return;
    }

    try {
      const { fixedCount, fixLogs, updatedResult } = ToolBhytXml.autoFixEncounters(this.xmlValidationResult);
      this.xmlValidationResult = updatedResult;

      // Update stat cards
      if (this.xmlStatTotal) this.xmlStatTotal.textContent = updatedResult.totalEncounters.toLocaleString("vi-VN");
      if (this.xmlStatValid) this.xmlStatValid.textContent = updatedResult.validCount.toLocaleString("vi-VN");
      if (this.xmlStatWarning) this.xmlStatWarning.textContent = updatedResult.warningCount.toLocaleString("vi-VN");
      if (this.xmlStatCritical) this.xmlStatCritical.textContent = updatedResult.criticalCount.toLocaleString("vi-VN");

      // Update tab count badges
      if (this.countTabAll) this.countTabAll.textContent = updatedResult.totalEncounters;
      if (this.countTabCritical) this.countTabCritical.textContent = updatedResult.criticalCount;
      if (this.countTabWarning) this.countTabWarning.textContent = updatedResult.warningCount;
      if (this.countTabValid) this.countTabValid.textContent = updatedResult.validCount;

      // Render table
      this.renderXmlTable();

      // Show download clean zip button & hide banner
      if (this.btnXmlDownloadCleanZip) this.btnXmlDownloadCleanZip.classList.remove("hidden");
      if (this.xmlAutoFixBanner) this.xmlAutoFixBanner.classList.add("hidden");

      if (this.notifManager && fixedCount > 0) {
        this.notifManager.addNotification({
          type: "success",
          category: "bhyt",
          icon: "🪄",
          title: `Tự sửa lỗi XML BHYT: Đã sửa ${fixedCount} lỗi`,
          message: `Đã tự động chuẩn hóa thẻ BHYT, cân bằng viện phí và chuỗi ngày giờ cho hồ sơ.`,
          actionText: "Tải ZIP sạch",
          actionHash: "#bhyt-xml",
          playSound: true
        });
        this.updateNotificationBadge();
        this.renderNotificationCenter();
      }

      if (fixedCount > 0) {
        this.showToast(`✨ Đã tự động sửa thành công ${fixedCount} lỗi dữ liệu (mã thẻ, sai số làm tròn tài chính, ngày giờ)!`, "success");
      } else {
        this.showToast("Dữ liệu không có lỗi cú pháp nào có thể tự động sửa được.", "info");
      }
    } catch (err) {
      console.error(err);
      this.showToast(`Lỗi khi tự động sửa lỗi: ${err.message}`, "error");
    }
  }

  async handleXmlDownloadCleanZip() {
    if (!this.xmlValidationResult || !window.ToolBhytXml) {
      this.showToast("Chưa có dữ liệu XML sạch để tải về!", "warning");
      return;
    }

    try {
      this.showToast("Đang đóng gói tệp ZIP chứa toàn bộ file XML đã chuẩn hóa...", "info");
      const orgCfg = ToolVgcaDoiChieu ? ToolVgcaDoiChieu.getOrgConfig() : {};
      await ToolBhytXml.downloadCleanZip(this.xmlValidationResult, orgCfg);
      this.showToast("Đã tải xuống gói XML sạch (.ZIP) thành công!", "success");
    } catch (err) {
      console.error(err);
      this.showToast(`Lỗi khi tạo gói ZIP: ${err.message}`, "error");
    }
  }

  renderXmlTable() {
    if (!this.xmlTableBody || !this.xmlValidationResult) return;
    this.xmlTableBody.innerHTML = "";

    const encounters = this.xmlValidationResult.encounters || [];
    const filter = this.currentXmlFilter;
    const searchTerm = (this.xmlSearchInput ? this.xmlSearchInput.value : "").trim().toLowerCase();

    const filtered = encounters.filter(enc => {
      // Category filter
      if (filter === "critical" && enc.errors.length === 0) return false;
      if (filter === "warning" && (enc.warnings.length === 0 || enc.errors.length > 0)) return false;
      if (filter === "valid" && (enc.errors.length > 0 || enc.warnings.length > 0)) return false;

      // Search filter
      if (searchTerm) {
        const text = `${enc.maLk} ${enc.patientName} ${enc.cardNo} ${enc.dept} ${enc.primaryIcd}`.toLowerCase();
        if (!text.includes(searchTerm)) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      this.xmlTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 28px; color: #94a3b8;">
            Không có hồ sơ nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    filtered.slice(0, 300).forEach((enc, idx) => {
      const tr = document.createElement("tr");

      let statusBadge = `<span class="xml-status-tag valid">✓ Hợp Lệ</span>`;
      if (enc.errors.length > 0) {
        statusBadge = `<span class="xml-status-tag critical">✕ Lỗi Nặng (${enc.errors.length})</span>`;
      } else if (enc.warnings.length > 0) {
        statusBadge = `<span class="xml-status-tag warning">⚠️ Cảnh Báo (${enc.warnings.length})</span>`;
      }

      if (enc.isAutoFixed) {
        statusBadge += `<span class="xml-fixed-badge" title="Đã tự động sửa lỗi">🪄 Đã sửa</span>`;
      }

      // Format Error Summaries
      let errorPillsHtml = "";
      if (enc.errors.length === 0 && enc.warnings.length === 0) {
        if (enc.isAutoFixed) {
          errorPillsHtml = `<span style="color: #a855f7; font-size: 0.74rem;">🪄 Đã sửa tự động: ${(enc.fixedLogs || []).join("; ")}</span>`;
        } else {
          errorPillsHtml = `<span style="color: #10b981; font-size: 0.74rem;">Đầy đủ trường bắt buộc, định dạng thẻ và cân đối tài chính chuẩn.</span>`;
        }
      } else {
        const allMsg = [
          ...enc.errors.map(e => `<div class="xml-error-pill critical"><strong>[${e.category}]</strong> ${e.message}</div>`),
          ...enc.warnings.map(w => `<div class="xml-error-pill warning"><strong>[${w.category}]</strong> ${w.message}</div>`)
        ];
        errorPillsHtml = `<div class="xml-error-pill-list">${allMsg.slice(0, 3).join("")}${allMsg.length > 3 ? `<span style="font-size:0.7rem;color:#94a3b8;">...và còn ${allMsg.length - 3} cảnh báo khác</span>` : ""}</div>`;
      }

      tr.innerHTML = `
        <td style="text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
        <td><strong style="color: #38bdf8; font-family: monospace;">${enc.maLk}</strong></td>
        <td><strong>${enc.patientName}</strong></td>
        <td><span style="font-family: monospace; color: #e2e8f0;">${enc.cardNo || "—"}</span></td>
        <td style="text-align: center;">${statusBadge}</td>
        <td>${errorPillsHtml}</td>
        <td style="text-align: center;">
          <button type="button" class="btn-view-xml-item" data-lk="${enc.maLk}">Xem</button>
        </td>
      `;

      const btnView = tr.querySelector(".btn-view-xml-item");
      if (btnView) {
        btnView.addEventListener("click", () => this.openXmlDetailModal(enc));
      }

      this.xmlTableBody.appendChild(tr);
    });
  }

  openXmlDetailModal(enc) {
    if (!enc) return;
    this.currentModalEncounter = enc;

    if (this.xmlModalMaLk) this.xmlModalMaLk.textContent = enc.maLk;

    if (this.xmlModalPatientInfo) {
      this.xmlModalPatientInfo.innerHTML = `
        <div><strong>Họ và tên:</strong> ${enc.patientName}</div>
        <div><strong>Mã Thẻ BHYT:</strong> ${enc.cardNo || "—"}</div>
        <div><strong>Ngày vào:</strong> ${enc.dateIn || "—"}</div>
        <div><strong>Ngày ra:</strong> ${enc.dateOut || "—"}</div>
        <div><strong>Mã bệnh (ICD-10):</strong> ${enc.primaryIcd || "—"} - ${enc.primaryDisease || ""}</div>
        <div><strong>Tổng chi:</strong> ${enc.totalCost.toLocaleString("vi-VN")} đ</div>
        <div><strong>BHYT thanh toán:</strong> ${enc.bhtt.toLocaleString("vi-VN")} đ</div>
        <div><strong>Người bệnh cùng chi trả:</strong> ${enc.bncct.toLocaleString("vi-VN")} đ</div>
        <div><strong>Tệp nguồn:</strong> ${enc.fileName || "XML"}</div>
      `;
    }

    if (this.xmlModalErrorsList) {
      const allErr = [...enc.errors, ...enc.warnings];
      if (allErr.length === 0) {
        this.xmlModalErrorsList.innerHTML = `
          <div style="padding: 12px; background: rgba(16, 185, 129, 0.12); border-radius: 6px; color: #10b981; font-size: 0.78rem;">
            ✓ Hồ sơ này hoàn toàn hợp lệ, không phát hiện lỗi cấu trúc hay tài chính nào!
          </div>
        `;
      } else {
        this.xmlModalErrorsList.innerHTML = allErr.map(e => `
          <div class="xml-modal-err-box ${e.severity}">
            <div><strong>[${e.category} • ${e.field}]</strong> ${e.message}</div>
            <div class="err-sugg">💡 <em>Gợi ý khắc phục:</em> ${e.suggestion}</div>
          </div>
        `).join("");
      }
    }

    if (this.xmlModalRawData) {
      const rawDump = JSON.stringify(enc.xml1Data || enc, null, 2);
      this.xmlModalRawData.textContent = rawDump;
    }

    this.showModal(this.modalXmlDetail);
  }

  exportXmlErrorReport() {
    if (!this.xmlValidationResult || !window.ToolBhytXml) {
      this.showToast("Chưa có kết quả kiểm tra để xuất báo cáo!", "warning");
      return;
    }

    const orgCfg = ToolVgcaDoiChieu ? ToolVgcaDoiChieu.getOrgConfig() : {};
    ToolBhytXml.exportErrorReportExcel(this.xmlValidationResult, orgCfg);
    this.showToast("Đang xuất file Excel Báo Cáo Lỗi BHYT chi tiết...", "info");
  }

  resetBhytXmlState() {
    this.xmlValidationResult = null;
    if (this.xmlFileInput) this.xmlFileInput.value = "";
    if (this.xmlDropzoneWrapper) this.xmlDropzoneWrapper.classList.remove("hidden");
    if (this.xmlResultsDashboard) this.xmlResultsDashboard.classList.add("hidden");
    if (this.btnXmlRecheck) this.btnXmlRecheck.classList.add("hidden");
    if (this.btnExportXmlErrorReport) this.btnExportXmlErrorReport.classList.add("hidden");
    if (this.btnXmlAutoFix) this.btnXmlAutoFix.classList.add("hidden");
    if (this.btnXmlDownloadCleanZip) this.btnXmlDownloadCleanZip.classList.add("hidden");
    if (this.xmlAutoFixBanner) this.xmlAutoFixBanner.classList.add("hidden");
    if (this.xmlTableBody) this.xmlTableBody.innerHTML = "";
    this.showToast("Đã làm mới khung tải tệp XML.", "info");
  }

  // =========================================================================
  // NOTIFICATION CENTER & SMART ALERTS CONTROLLER METHODS
  // =========================================================================
  initNotificationEvents() {
    if (!this.notifManager) return;

    if (this.btnToggleNotificationCenter) {
      this.btnToggleNotificationCenter.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.notificationCenterPanel) {
          const isHidden = this.notificationCenterPanel.classList.toggle("hidden");
          if (!isHidden) {
            this.renderNotificationCenter();
          }
        }
      });
    }

    if (this.notificationCenterPanel) {
      this.notificationCenterPanel.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    document.addEventListener("click", () => {
      if (this.notificationCenterPanel && !this.notificationCenterPanel.classList.contains("hidden")) {
        this.notificationCenterPanel.classList.add("hidden");
      }
    });

    if (this.btnMarkAllNotifsRead) {
      this.btnMarkAllNotifsRead.addEventListener("click", () => {
        this.notifManager.markAllAsRead();
        this.renderNotificationCenter();
        this.updateNotificationBadge();
        this.showToast("Đã đánh dấu tất cả thông báo là đã đọc!", "success");
      });
    }

    if (this.btnClearAllNotifs) {
      this.btnClearAllNotifs.addEventListener("click", () => {
        this.notifManager.clearAll();
        this.renderNotificationCenter();
        this.updateNotificationBadge();
        this.showToast("Đã xóa toàn bộ lịch sử thông báo.", "info");
      });
    }

    if (this.chkToggleNotifSound) {
      this.chkToggleNotifSound.checked = this.notifManager.getSoundEnabled();
      this.chkToggleNotifSound.addEventListener("change", (e) => {
        this.notifManager.setSoundEnabled(e.target.checked);
        if (e.target.checked) {
          this.notifManager.playChime("success");
          this.showToast("Đã bật âm thanh nhắc nhở thông báo.", "success");
        } else {
          this.showToast("Đã tắt âm thanh nhắc nhở thông báo.", "info");
        }
      });
    }

    // Category filter tabs
    if (this.notifFilterTabs) {
      this.notifFilterTabs.querySelectorAll(".notif-tab-item").forEach(tab => {
        tab.addEventListener("click", () => {
          this.notifFilterTabs.querySelectorAll(".notif-tab-item").forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          this.currentNotifCategory = tab.dataset.cat;
          this.renderNotificationCenter();
        });
      });
    }

    // Trigger initial automated smart alerts
    const staffList = ToolDutyRoster ? ToolDutyRoster.getStaffList() : [];
    const schedule = (this.dutySchedule && this.dutySchedule.length > 0) ? this.dutySchedule : (ToolDutyRoster ? ToolDutyRoster.generateSchedule(new Date().getFullYear(), new Date().getMonth() + 1, staffList) : []);
    this.notifManager.runAutomatedSmartAlerts(schedule, staffList);

    this.updateNotificationBadge();
  }

  updateNotificationBadge() {
    if (!this.notificationBadgeCount || !this.notifManager) return;
    const unread = this.notifManager.getUnreadCount();
    if (unread > 0) {
      this.notificationBadgeCount.textContent = unread > 99 ? "99+" : unread;
      this.notificationBadgeCount.classList.remove("hidden");
    } else {
      this.notificationBadgeCount.classList.add("hidden");
    }
  }

  renderNotificationCenter() {
    if (!this.notificationListContainer || !this.notifManager) return;
    this.notificationListContainer.innerHTML = "";

    const allNotifs = this.notifManager.getNotifications();
    const cat = this.currentNotifCategory || "all";

    const filtered = allNotifs.filter(n => {
      if (cat === "all") return true;
      if (cat === "duty") return n.category === "duty";
      if (cat === "bhyt") return n.category === "bhyt";
      if (cat === "system") return n.category === "system" || n.category === "network";
      return true;
    });

    if (filtered.length === 0) {
      this.notificationListContainer.innerHTML = `
        <div class="notif-empty-state">
          <div class="empty-icon">🔕</div>
          <div>Không có thông báo nào trong mục này.</div>
        </div>
      `;
      return;
    }

    filtered.forEach(notif => {
      const item = document.createElement("div");
      item.className = `notif-item ${notif.isRead ? 'read' : 'unread'}`;
      
      const timeStr = this.notifManager.formatTimeAgo(notif.timestamp);
      let actionHtml = "";
      if (notif.actionText && notif.actionHash) {
        actionHtml = `<a href="${notif.actionHash}" class="notif-item-action-btn">${notif.actionText} &rarr;</a>`;
      }

      item.innerHTML = `
        <div class="notif-item-icon">${notif.icon || "ℹ️"}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">
            <span>${notif.title}</span>
            <div style="display:flex;align-items:center;">
              <span class="notif-item-time">${timeStr}</span>
              <button type="button" class="btn-notif-delete-single" title="Xóa thông báo này">&times;</button>
            </div>
          </div>
          <div class="notif-item-msg">${notif.message}</div>
          ${actionHtml}
        </div>
      `;

      // Read on click
      item.addEventListener("click", (e) => {
        if (!e.target.classList.contains("btn-notif-delete-single")) {
          this.notifManager.markAsRead(notif.id);
          item.classList.remove("unread");
          item.classList.add("read");
          this.updateNotificationBadge();
        }
      });

      // Delete single
      const btnDel = item.querySelector(".btn-notif-delete-single");
      if (btnDel) {
        btnDel.addEventListener("click", (e) => {
          e.stopPropagation();
          this.notifManager.deleteNotification(notif.id);
          this.renderNotificationCenter();
          this.updateNotificationBadge();
        });
      }

      // Link action
      const btnAct = item.querySelector(".notif-item-action-btn");
      if (btnAct) {
        btnAct.addEventListener("click", () => {
          this.notifManager.markAsRead(notif.id);
          if (this.notificationCenterPanel) this.notificationCenterPanel.classList.add("hidden");
          this.updateNotificationBadge();
        });
      }

      this.notificationListContainer.appendChild(item);
    });

    this.updateNotificationBadge();
  }

  showModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      modalEl.classList.add("modal-visible");
    });
  }

  hideModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("modal-visible");
    setTimeout(() => {
      if (!modalEl.classList.contains("modal-visible")) {
        modalEl.classList.add("hidden");
      }
    }, 180);
  }

  showToast(message, type = "info", duration = 4000, actionText = null, actionHash = null) {
    if (this.notifManager) {
      this.notifManager.playChime(type);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✓" : (type === "warning" ? "⚠️" : (type === "error" ? "✕" : "ℹ"));
    
    let actionBtnHtml = "";
    if (actionText && actionHash) {
      actionBtnHtml = `<button type="button" class="toast-action-btn" data-hash="${actionHash}">${actionText}</button>`;
    }

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      ${actionBtnHtml}
      <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
    `;

    if (actionText && actionHash) {
      const btnAct = toast.querySelector(".toast-action-btn");
      if (btnAct) {
        btnAct.addEventListener("click", () => {
          window.location.hash = actionHash;
          toast.remove();
        });
      }
    }

    this.toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add("toast-show"), 10);
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  initNetworkStatus() {
    this.connectionStatusBadge = document.getElementById("connectionStatusBadge");
    this.connectionStatusDot = document.getElementById("connectionStatusDot");
    this.connectionStatusText = document.getElementById("connectionStatusText");
    this.offlineAlertBanner = document.getElementById("offlineAlertBanner");
    this.btnDismissOfflineBanner = document.getElementById("btnDismissOfflineBanner");

    if (this.btnDismissOfflineBanner) {
      this.btnDismissOfflineBanner.addEventListener("click", () => {
        if (this.offlineAlertBanner) this.offlineAlertBanner.classList.add("hidden");
      });
    }

    const updateStatus = (isOnline) => {
      if (this.connectionStatusBadge) {
        this.connectionStatusBadge.className = isOnline ? "badge-status online" : "badge-status offline";
        this.connectionStatusBadge.title = isOnline ? "Trạng thái: Đang kết nối Internet" : "Trạng thái: Ngoại tuyến (Offline) - Mọi công cụ vẫn hoạt động bình thường";
      }
      if (this.connectionStatusText) {
        this.connectionStatusText.textContent = isOnline ? "Trực tuyến" : "Ngoại tuyến";
      }
      if (this.offlineAlertBanner) {
        if (isOnline) {
          this.offlineAlertBanner.classList.add("hidden");
        } else {
          this.offlineAlertBanner.classList.remove("hidden");
        }
      }
    };

    window.addEventListener("online", () => {
      updateStatus(true);
      this.showToast("🌐 Kết nối Internet đã được khôi phục!", "success");
      this.checkPendingOfflineSync();
    });

    window.addEventListener("offline", () => {
      updateStatus(false);
      this.showToast("⚠️ Đang ở chế độ Ngoại tuyến (Offline). Mọi công cụ vẫn sử dụng bình thường trên trình duyệt!", "warning", 6000);
    });

    updateStatus(navigator.onLine);
  }

  recordOfflineChange(actionName, details) {
    if (!navigator.onLine) {
      try {
        const raw = localStorage.getItem("PENDING_OFFLINE_CHANGES") || "[]";
        const changes = JSON.parse(raw);
        changes.push({
          time: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
          action: actionName,
          details: details
        });
        localStorage.setItem("PENDING_OFFLINE_CHANGES", JSON.stringify(changes));
      } catch (e) {}
    }
  }

  checkPendingOfflineSync() {
    try {
      const raw = localStorage.getItem("PENDING_OFFLINE_CHANGES");
      if (raw) {
        const changes = JSON.parse(raw);
        if (Array.isArray(changes) && changes.length > 0) {
          const preview = document.getElementById("syncChangesPreview");
          if (preview) {
            preview.innerHTML = `<strong>${changes.length} thay đổi đã ghi nhận lúc offline:</strong><ul style="margin:6px 0 0 16px;padding:0;line-height:1.6;">` +
              changes.map(c => `<li><strong>[${c.time}] ${c.action}</strong>: ${c.details}</li>`).join("") +
              `</ul>`;
          }
          this.showModal(this.modalOfflineSyncConfirm);
        }
      }
    } catch (e) {}
  }

  setupPasswordToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener("click", () => {
      const isPwd = (input.type === "password");
      input.type = isPwd ? "text" : "password";
      btn.innerHTML = isPwd
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.appController = new AppController();
});
