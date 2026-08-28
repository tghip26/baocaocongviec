/**
 * tool-word-to-html.js
 * Advanced Word (.docx) to Clean HTML & Inline CSS Converter for CMS & Website Publishing.
 * Specialized for:
 * 1. Bài CTXH (Công Tác Xã Hội / Tin tức sự kiện - Font Times New Roman 16px, #000000, thẳng đầu dòng, ảnh & tiêu đề ảnh căn giữa)
 * 2. Bài Thầu (Thông báo thầu - Font Times New Roman 16px, #000000, thẳng đầu dòng, chỉ có 2 ảnh trên và dưới căn giữa)
 * 100% Link ảnh thường URL (Không mã hóa Base64).
 */

class WordToHtmlConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      preset: "ctxh", // "ctxh" | "thau"
      fontFamily: "'Times New Roman', Times, serif",
      baseFontSize: "16px",
      textColor: "#000000",
      textAlign: "justify", // "justify" | "left" | "center"
      lineHeight: "1.6",
      paragraphMarginBottom: "6px",
      textIndent: "none",
      tableFullBorder: true,
      preserveLayoutTables: true,
      cleanEmptyParagraphs: true,
      collapseSpaces: true,

      // Image URL Controls (Không dùng Base64)
      ctxhImageUrls: [], // Mảng URL ảnh do người dùng nhập cho bài CTXH
      thauTopImageUrl: "",
      thauTopImageCaption: "",
      thauBottomImageUrl: "",
      thauBottomImageCaption: ""
    }, options);

    this.stats = {
      wordCount: 0,
      charCount: 0,
      paragraphCount: 0,
      tableCount: 0,
      imageCount: 0
    };
  }

  setOptions(newOptions) {
    this.options = Object.assign(this.options, newOptions);
  }

  /**
   * Convert Word (.docx) file data to clean, standard HTML string
   */
  async convertDocxToHtml(fileData, fileName = "") {
    if (!window.JSZip) {
      throw new Error("Thư viện JSZip chưa sẵn sàng. Vui lòng tải lại trang.");
    }

    this.stats = { wordCount: 0, charCount: 0, paragraphCount: 0, tableCount: 0, imageCount: 0 };

    let arrayBuffer = fileData;
    if (fileData instanceof Blob) {
      arrayBuffer = await fileData.arrayBuffer();
    }

    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file("word/document.xml");
    if (!docXmlFile) {
      throw new Error(`Tệp ${fileName} không phải là tài liệu Word (.docx) hợp lệ.`);
    }

    // 1. Extract Relationships (Rels)
    const relsMap = {};
    const relsXmlFile = zip.file("word/_rels/document.xml.rels");
    if (relsXmlFile) {
      const relsText = await relsXmlFile.async("text");
      const relsDoc = new DOMParser().parseFromString(relsText, "application/xml");
      const relElements = relsDoc.getElementsByTagName("Relationship");
      for (let i = 0; i < relElements.length; i++) {
        const id = relElements[i].getAttribute("Id");
        const target = relElements[i].getAttribute("Target");
        const type = relElements[i].getAttribute("Type") || "";
        relsMap[id] = { target, type };
      }
    }

    // 2. Count media images
    const mediaFiles = zip.folder("word/media");
    const extractedImageNames = [];
    if (mediaFiles) {
      for (const relativePath in mediaFiles.files) {
        if (!mediaFiles.files[relativePath].dir) {
          extractedImageNames.push(relativePath.split("/").pop());
          this.stats.imageCount++;
        }
      }
    }

    // 3. Parse word/document.xml
    const xmlText = await docXmlFile.async("text");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const bodyNode = xmlDoc.getElementsByTagName("w:body")[0] || xmlDoc.getElementsByTagName("body")[0];
    if (!bodyNode) {
      throw new Error("Không tìm thấy cấu trúc nội dung trong file Word.");
    }

    // 4. Generate Clean HTML
    const htmlChunks = [];
    const childNodes = bodyNode.childNodes;

    let inList = false;
    let listType = "ul";
    let imgCounter = 0;

    const isThau = this.options.preset === "thau";

    // NẾU LÀ BÀI THẦU: Chèn Ảnh Trên cùng (Đầu bài thầu)
    if (isThau) {
      const topUrl = this.options.thauTopImageUrl.trim() || "https://yourwebsite.com/images/thong-bao-thau-1.jpg";
      const topCaption = this.options.thauTopImageCaption.trim();

      htmlChunks.push(`<p style="text-align: center; margin: 12px 0 4px 0;"><img src="${topUrl}" alt="Ảnh thông báo thầu đầu bài" style="max-width: 100%; height: auto;" /></p>`);
      if (topCaption) {
        htmlChunks.push(`<p style="text-align: center; font-style: italic; font-size: 15px; margin: 0 0 14px 0; color: ${this.options.textColor};"><em>${this.escapeHtml(topCaption)}</em></p>`);
      }
    }

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      const nodeName = node.nodeName.toLowerCase();

      if (nodeName === "w:p" || nodeName === "p") {
        const isListItem = this.checkIsListItem(node);
        if (isListItem) {
          if (!inList) {
            inList = true;
            listType = isListItem.type || "ul";
            const listStyles = this.buildParagraphStyles({ isListContainer: true });
            htmlChunks.push(`<${listType} style="${listStyles}">`);
          }
          const liHtml = this.parseParagraph(node, relsMap, { isLi: true, imgIndex: imgCounter });
          if (liHtml && liHtml.trim()) {
            htmlChunks.push(`  <li style="margin-bottom: 4px; line-height: ${this.options.lineHeight};">${liHtml}</li>`);
          }
        } else {
          if (inList) {
            htmlChunks.push(`</${listType}>`);
            inList = false;
          }

          // Đối với bài thầu, không chèn ảnh xen kẽ ở giữa
          const pHtml = this.parseParagraph(node, relsMap, {
            isLi: false,
            inTable: false,
            skipImages: isThau,
            imgIndex: imgCounter
          });

          if (pHtml && pHtml.isImage) {
            imgCounter++;
          }

          if (pHtml && pHtml.html && pHtml.html.trim().length > 0) {
            htmlChunks.push(pHtml.html);
          }
        }
      } else if (nodeName === "w:tbl" || nodeName === "tbl") {
        if (inList) {
          htmlChunks.push(`</${listType}>`);
          inList = false;
        }
        const tblHtml = this.parseTable(node, relsMap);
        if (tblHtml) {
          htmlChunks.push(tblHtml);
          this.stats.tableCount++;
        }
      }
    }

    if (inList) {
      htmlChunks.push(`</${listType}>`);
    }

    // NẾU LÀ BÀI THẦU: Chèn Ảnh Dưới cùng (Cuối bài thầu)
    if (isThau) {
      const btmUrl = this.options.thauBottomImageUrl.trim() || "https://yourwebsite.com/images/thong-bao-thau-2.jpg";
      const btmCaption = this.options.thauBottomImageCaption.trim();

      htmlChunks.push(`<p style="text-align: center; margin: 16px 0 4px 0;"><img src="${btmUrl}" alt="Ảnh thông báo thầu cuối bài" style="max-width: 100%; height: auto;" /></p>`);
      if (btmCaption) {
        htmlChunks.push(`<p style="text-align: center; font-style: italic; font-size: 15px; margin: 0 0 12px 0; color: ${this.options.textColor};"><em>${this.escapeHtml(btmCaption)}</em></p>`);
      }
    }

    const fullHtml = htmlChunks.join("\n");
    return {
      html: fullHtml,
      stats: this.stats,
      images: extractedImageNames
    };
  }

  checkIsListItem(pNode) {
    const pPr = this.findChild(pNode, ["w:pPr", "pPr"]);
    if (!pPr) return false;
    const numPr = this.findChild(pPr, ["w:numPr", "numPr"]);
    if (numPr) {
      const numIdNode = this.findChild(numPr, ["w:numId", "numId"]);
      const numId = numIdNode ? numIdNode.getAttribute("w:val") || numIdNode.getAttribute("val") : "0";
      return { isList: true, type: numId === "0" ? "ul" : "ol" };
    }
    return false;
  }

  /**
   * Build clean, unnested CSS style string for <p>
   */
  buildParagraphStyles(opts = {}) {
    const styles = [];

    // 1. Text Align: default left/justify (thẳng đầu dòng)
    const align = opts.textAlign || (this.options.textAlign === "inherit" ? "" : this.options.textAlign);
    if (align) {
      styles.push(`text-align: ${align}`);
    }

    // 2. Font Family
    if (this.options.fontFamily && this.options.fontFamily !== "inherit") {
      styles.push(`font-family: ${this.options.fontFamily}`);
    }

    // 3. Font Size
    if (this.options.baseFontSize && this.options.baseFontSize !== "inherit") {
      styles.push(`font-size: ${this.options.baseFontSize}`);
    }

    // 4. Line Height
    if (this.options.lineHeight) {
      styles.push(`line-height: ${this.options.lineHeight}`);
    }

    // 5. Text Color
    if (this.options.textColor && this.options.textColor !== "inherit") {
      styles.push(`color: ${this.options.textColor}`);
    }

    // 6. Margins
    if (opts.isListContainer) {
      styles.push(`margin: 0 0 ${this.options.paragraphMarginBottom} 24px; padding: 0`);
    } else if (opts.inTable) {
      styles.push(`margin: 0 0 2px 0`);
    } else {
      const mBottom = opts.isZeroSpacing ? "2px" : this.options.paragraphMarginBottom;
      styles.push(`margin: 0 0 ${mBottom} 0`);
    }

    // 7. Text Indent
    if (!opts.inTable && !opts.isListContainer) {
      if (this.options.textIndent && this.options.textIndent !== "none" && (align === "justify" || align === "left")) {
        styles.push(`text-indent: ${this.options.textIndent}`);
      }
    }

    return styles.join("; ");
  }

  /**
   * Parse a single Word paragraph <w:p>
   */
  parseParagraph(pNode, relsMap, ctx = {}) {
    const isLi = ctx.isLi || false;
    const inTable = ctx.inTable || false;
    const skipImages = ctx.skipImages || false;
    const imgIndex = ctx.imgIndex || 0;

    const pPr = this.findChild(pNode, ["w:pPr", "pPr"]);
    
    let textAlign = "";
    let isZeroSpacing = false;

    if (pPr) {
      const jcNode = this.findChild(pPr, ["w:jc", "jc"]);
      if (jcNode) {
        const val = jcNode.getAttribute("w:val") || jcNode.getAttribute("val");
        if (val === "both" || val === "distribute") textAlign = "justify";
        else if (val === "center") textAlign = "center";
        else if (val === "right") textAlign = "right";
        else if (val === "left") textAlign = "left";
      }

      const spNode = this.findChild(pPr, ["w:spacing", "spacing"]);
      if (spNode) {
        const after = parseInt(spNode.getAttribute("w:after") || spNode.getAttribute("after") || "100", 10);
        if (after === 0) isZeroSpacing = true;
      }
    }

    // Extract Runs & Raw Data
    const rawRuns = [];
    const childNodes = pNode.childNodes;
    let hasImageInP = false;

    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:r" || cName === "r") {
        const rData = this.extractRunData(child, relsMap, skipImages, imgIndex);
        if (rData.text || rData.imageHtml) {
          rawRuns.push(rData);
          if (rData.isImage) hasImageInP = true;
        }
      } else if (cName === "w:hyperlink" || cName === "hyperlink") {
        const rId = child.getAttribute("r:id") || child.getAttribute("id");
        const linkUrl = (rId && relsMap[rId]) ? relsMap[rId].target || "#" : "#";
        const linkRuns = child.childNodes;
        for (let j = 0; j < linkRuns.length; j++) {
          if (linkRuns[j].nodeName.toLowerCase() === "w:r" || linkRuns[j].nodeName.toLowerCase() === "r") {
            const rData = this.extractRunData(linkRuns[j], relsMap, skipImages, imgIndex);
            if (rData.text) {
              rData.linkUrl = linkUrl;
              rawRuns.push(rData);
            }
          }
        }
      } else if (cName === "w:drawing" || cName === "drawing") {
        if (!skipImages) {
          const imgHtml = this.generateImageUrlHtml(imgIndex);
          if (imgHtml) {
            rawRuns.push({ text: "", imageHtml: imgHtml, isImage: true });
            hasImageInP = true;
          }
        }
      }
    }

    if (rawRuns.length === 0) {
      if (this.options.cleanEmptyParagraphs || inTable) return { html: "", isImage: false };
      const pStyles = this.buildParagraphStyles({ textAlign, inTable, isZeroSpacing });
      return { html: `<p style="${pStyles}">&nbsp;</p>`, isImage: false };
    }

    // Merge adjacent runs
    const mergedRuns = this.mergeAdjacentRuns(rawRuns);

    // If paragraph contains ONLY an image
    if (mergedRuns.length === 1 && mergedRuns[0].isImage) {
      return { html: mergedRuns[0].imageHtml, isImage: true };
    }

    // Build inner HTML
    let innerHtml = "";
    let plainText = "";

    for (const run of mergedRuns) {
      if (run.isImage) {
        innerHtml += run.imageHtml;
        continue;
      }

      let runStr = run.text;
      if (this.options.collapseSpaces) {
        runStr = runStr.replace(/[ \t]{2,}/g, " ");
      }
      plainText += runStr;

      if (run.isBold) runStr = `<strong>${runStr}</strong>`;
      if (run.isItalic) runStr = `<em>${runStr}</em>`;
      if (run.isUnderline) runStr = `<u>${runStr}</u>`;
      if (run.isStrike) runStr = `<s>${runStr}</s>`;
      if (run.isSub) runStr = `<sub>${runStr}</sub>`;
      if (run.isSup) runStr = `<sup>${runStr}</sup>`;

      // Custom span only if needed
      const spanStyles = [];
      if (run.customColor && run.customColor.toLowerCase() !== this.options.textColor.toLowerCase()) {
        spanStyles.push(`color: ${run.customColor}`);
      }
      if (run.customBg) {
        spanStyles.push(`background-color: ${run.customBg}`);
      }

      if (spanStyles.length > 0) {
        runStr = `<span style="${spanStyles.join('; ')};">${runStr}</span>`;
      }

      if (run.linkUrl) {
        runStr = `<a href="${run.linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${runStr}</a>`;
      }

      if (run.imageHtml) {
        runStr += run.imageHtml;
      }

      innerHtml += runStr;
    }

    plainText = plainText.trim();

    if (!plainText && !hasImageInP) {
      if (this.options.cleanEmptyParagraphs || inTable) return { html: "", isImage: false };
      const pStyles = this.buildParagraphStyles({ textAlign, inTable, isZeroSpacing });
      return { html: `<p style="${pStyles}">&nbsp;</p>`, isImage: false };
    }

    // Check if paragraph is an Image Caption (italicized or starts with "Ảnh:" / "Hình:") -> Center it!
    const isImageCaption = (textAlign === "center") ||
      (mergedRuns.length === 1 && mergedRuns[0].isItalic && plainText.length < 150) ||
      /^(\*?)(Ảnh|Hình|Ảnh \d|Hình \d|Sơ đồ|Bảng)[\s:]/i.test(plainText);

    if (isImageCaption) {
      textAlign = "center";
    }

    // Update stats
    if (plainText) {
      const words = plainText.split(/\s+/).filter(w => w.length > 0);
      this.stats.wordCount += words.length;
      this.stats.charCount += plainText.length;
      this.stats.paragraphCount++;
    }

    if (isLi) {
      return innerHtml;
    }

    const pStyles = this.buildParagraphStyles({
      textAlign: textAlign || (this.options.textAlign === "inherit" ? "" : this.options.textAlign),
      inTable,
      isZeroSpacing
    });

    const captionStyle = isImageCaption ? ' font-style: italic; font-size: 15px;' : '';

    return {
      html: `<p style="${pStyles};${captionStyle}">${innerHtml}</p>`,
      isImage: hasImageInP
    };
  }

  /**
   * Extract raw attributes from a Run <w:r>
   */
  extractRunData(rNode, relsMap, skipImages = false, imgIndex = 0) {
    const rPr = this.findChild(rNode, ["w:rPr", "rPr"]);
    
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let isStrike = false;
    let isSub = false;
    let isSup = false;
    let customColor = "";
    let customBg = "";

    if (rPr) {
      if (this.findChild(rPr, ["w:b", "b"])) isBold = true;
      if (this.findChild(rPr, ["w:i", "i"])) isItalic = true;
      if (this.findChild(rPr, ["w:u", "u"])) isUnderline = true;
      if (this.findChild(rPr, ["w:strike", "strike"])) isStrike = true;

      const vertAlign = this.findChild(rPr, ["w:vertAlign", "vertAlign"]);
      if (vertAlign) {
        const v = vertAlign.getAttribute("w:val") || vertAlign.getAttribute("val");
        if (v === "subscript") isSub = true;
        if (v === "superscript") isSup = true;
      }

      const colorNode = this.findChild(rPr, ["w:color", "color"]);
      if (colorNode) {
        const cVal = colorNode.getAttribute("w:val") || colorNode.getAttribute("val");
        if (cVal && cVal !== "auto" && cVal.length === 6 && cVal.toLowerCase() !== "000000") {
          customColor = `#${cVal}`;
        }
      }

      const highlightNode = this.findChild(rPr, ["w:highlight", "highlight"]);
      if (highlightNode) {
        const hVal = (highlightNode.getAttribute("w:val") || highlightNode.getAttribute("val") || "").toLowerCase();
        if (hVal === "yellow") customBg = "#fef08a";
        else if (hVal === "green") customBg = "#bbf7d0";
        else if (hVal !== "none") customBg = "#fef08a";
      }
    }

    let text = "";
    let imageHtml = "";
    let isImage = false;

    const childNodes = rNode.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:t" || cName === "t") {
        text += this.escapeHtml(child.textContent);
      } else if (cName === "w:br" || cName === "br") {
        text += "<br/>";
      } else if (cName === "w:tab" || cName === "tab") {
        text += "&emsp;&emsp;";
      } else if (cName === "w:drawing" || cName === "drawing") {
        if (!skipImages) {
          const img = this.generateImageUrlHtml(imgIndex);
          if (img) {
            imageHtml += img;
            isImage = true;
          }
        }
      }
    }

    return {
      text,
      imageHtml,
      isImage,
      isBold,
      isItalic,
      isUnderline,
      isStrike,
      isSub,
      isSup,
      customColor,
      customBg,
      linkUrl: null
    };
  }

  mergeAdjacentRuns(runs) {
    if (runs.length <= 1) return runs;

    const merged = [];
    let current = Object.assign({}, runs[0]);

    for (let i = 1; i < runs.length; i++) {
      const next = runs[i];
      const isSameFormat =
        !current.isImage && !next.isImage &&
        current.isBold === next.isBold &&
        current.isItalic === next.isItalic &&
        current.isUnderline === next.isUnderline &&
        current.isStrike === next.isStrike &&
        current.isSub === next.isSub &&
        current.isSup === next.isSup &&
        current.customColor === next.customColor &&
        current.customBg === next.customBg &&
        current.linkUrl === next.linkUrl;

      if (isSameFormat) {
        current.text += next.text;
        if (next.imageHtml) current.imageHtml = (current.imageHtml || "") + next.imageHtml;
      } else {
        merged.push(current);
        current = Object.assign({}, next);
      }
    }
    merged.push(current);
    return merged;
  }

  /**
   * Generate clean Image HTML using regular URL (Không dùng Base64)
   */
  generateImageUrlHtml(imgIndex) {
    let imgUrl = "";

    if (this.options.ctxhImageUrls && this.options.ctxhImageUrls[imgIndex]) {
      imgUrl = this.options.ctxhImageUrls[imgIndex].trim();
    }

    if (!imgUrl) {
      imgUrl = `https://yourwebsite.com/images/anh-${imgIndex + 1}.jpg`;
    }

    return `<p style="text-align: center; margin: 14px 0 4px 0;"><img src="${imgUrl}" alt="Hình ảnh ${imgIndex + 1}" style="max-width: 100%; height: auto; display: inline-block; margin: 0 auto;" /></p>`;
  }

  isTableBorderless(tblNode) {
    const tblPr = this.findChild(tblNode, ["w:tblPr", "tblPr"]);
    if (!tblPr) return false;

    const tblBorders = this.findChild(tblPr, ["w:tblBorders", "tblBorders"]);
    if (!tblBorders) return true;

    let hasVisibleBorder = false;
    const borderEdges = ["top", "left", "bottom", "right", "insideH", "insideV"];
    for (const edge of borderEdges) {
      const edgeNode = this.findChild(tblBorders, [`w:${edge}`, edge]);
      if (edgeNode) {
        const val = edgeNode.getAttribute("w:val") || edgeNode.getAttribute("val");
        if (val && val !== "none" && val !== "nil") {
          hasVisibleBorder = true;
          break;
        }
      }
    }

    return !hasVisibleBorder;
  }

  parseTable(tblNode, relsMap) {
    const trNodes = tblNode.getElementsByTagName("w:tr").length > 0
      ? tblNode.getElementsByTagName("w:tr")
      : tblNode.getElementsByTagName("tr");

    if (trNodes.length === 0) return "";

    const isLayoutTable = this.options.preserveLayoutTables && this.isTableBorderless(tblNode);

    const tblStyles = [
      "width: 100%",
      "border-collapse: collapse",
      `font-family: ${this.options.fontFamily || "'Times New Roman', Times, serif"}`,
      `font-size: ${this.options.baseFontSize || '16px'}`,
      `color: ${this.options.textColor || '#000000'}`,
      "line-height: 1.45",
      "margin: 8px 0"
    ];

    if (!isLayoutTable && this.options.tableFullBorder) {
      tblStyles.push("border: 1px solid #cbd5e1");
    } else if (isLayoutTable) {
      tblStyles.push("border: none");
    }

    const rowsHtml = [];

    for (let r = 0; r < trNodes.length; r++) {
      const trNode = trNodes[r];
      const isHeaderRow = !isLayoutTable && r === 0;

      const tcNodes = trNode.getElementsByTagName("w:tc").length > 0
        ? trNode.getElementsByTagName("w:tc")
        : trNode.getElementsByTagName("tc");

      const cellsHtml = [];
      for (let c = 0; c < tcNodes.length; c++) {
        const tcNode = tcNodes[c];
        const tcPr = this.findChild(tcNode, ["w:tcPr", "tcPr"]);

        let colSpan = 1;
        let cellBg = "";
        let cellWidth = "";

        if (tcPr) {
          const gridSpan = this.findChild(tcPr, ["w:gridSpan", "gridSpan"]);
          if (gridSpan) {
            colSpan = parseInt(gridSpan.getAttribute("w:val") || gridSpan.getAttribute("val") || "1", 10);
          }

          const shd = this.findChild(tcPr, ["w:shd", "shd"]);
          if (shd) {
            const fill = shd.getAttribute("w:fill") || shd.getAttribute("fill");
            if (fill && fill !== "auto" && fill.length === 6) {
              cellBg = `#${fill}`;
            }
          }

          const tcW = this.findChild(tcPr, ["w:tcW", "tcW"]);
          if (tcW) {
            const wVal = parseInt(tcW.getAttribute("w:val") || tcW.getAttribute("val") || "0", 10);
            if (wVal > 0 && isLayoutTable && tcNodes.length === 2) {
              cellWidth = "50%";
            }
          }
        }

        const pNodes = tcNode.getElementsByTagName("w:p").length > 0
          ? tcNode.getElementsByTagName("w:p")
          : tcNode.getElementsByTagName("p");

        const cellContentParts = [];
        for (let p = 0; p < pNodes.length; p++) {
          const pRes = this.parseParagraph(pNodes[p], relsMap, { isLi: false, inTable: true, skipImages: true });
          if (pRes && pRes.html) cellContentParts.push(pRes.html);
        }

        let cellInner = cellContentParts.join("");
        if (!cellInner.trim()) cellInner = "&nbsp;";

        const cellTag = isHeaderRow ? "th" : "td";
        const cellStyles = [
          isLayoutTable ? "padding: 4px 6px" : "padding: 6px 10px",
          "vertical-align: top"
        ];

        if (cellWidth) {
          cellStyles.push(`width: ${cellWidth}`);
        }

        if (!isLayoutTable && this.options.tableFullBorder) {
          cellStyles.push("border: 1px solid #cbd5e1");
        } else if (isLayoutTable) {
          cellStyles.push("border: none");
        }

        if (isHeaderRow) {
          cellStyles.push(`background-color: ${cellBg || '#f1f5f9'}`, "font-weight: bold", "text-align: center");
        } else if (cellBg) {
          cellStyles.push(`background-color: ${cellBg}`);
        }

        const spanAttr = colSpan > 1 ? ` colspan="${colSpan}"` : "";
        cellsHtml.push(`    <${cellTag}${spanAttr} style="${cellStyles.join('; ')};">${cellInner}</${cellTag}>`);
      }

      const rowBg = isHeaderRow ? 'background-color: #f1f5f9;' : '';
      rowsHtml.push(`  <tr style="${rowBg}">\n${cellsHtml.join("\n")}\n  </tr>`);
    }

    const borderAttr = !isLayoutTable && this.options.tableFullBorder ? ' border="1"' : ' border="0"';
    return `<table${borderAttr} cellpadding="6" cellspacing="0" style="${tblStyles.join('; ')};">\n${rowsHtml.join("\n")}\n</table>`;
  }

  findChild(node, names) {
    if (!node || !node.childNodes) return null;
    for (let i = 0; i < node.childNodes.length; i++) {
      const c = node.childNodes[i];
      if (names.includes(c.nodeName)) return c;
    }
    return null;
  }

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

window.WordToHtmlConverter = WordToHtmlConverter;
