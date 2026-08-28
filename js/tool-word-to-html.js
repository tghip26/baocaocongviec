/**
 * tool-word-to-html.js
 * Advanced Word (.docx) to Clean HTML & Inline CSS Converter for CMS & Website Publishing.
 * Specially optimized for CKEditor, TinyMCE, WordPress and Web CMS with clean, unnested markup.
 */

class WordToHtmlConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      preset: "article",
      fontFamily: "'Times New Roman', Times, serif",
      baseFontSize: "16px",
      textColor: "#333333",
      textAlign: "justify", // "justify" | "left" | "center" | "inherit"
      lineHeight: "1.6",
      paragraphMarginBottom: "6px",
      textIndent: "none", // "none" | "1.5em" | "2em" | "inherit"
      tableFullBorder: true,
      tableHeaderBg: "#f1f5f9",
      tableZebra: false,
      tableFullWidth: true,
      preserveLayoutTables: true,
      embedImagesBase64: true,
      cleanEmptyParagraphs: true,
      collapseSpaces: true,
      autoHeading: false
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

    // 2. Extract Embedded Media Images into Base64 Data URIs
    const mediaMap = {};
    const extractedImages = [];
    const mediaFiles = zip.folder("word/media");
    if (mediaFiles) {
      for (const relativePath in mediaFiles.files) {
        const fileObj = mediaFiles.files[relativePath];
        if (!fileObj.dir) {
          const extMatch = relativePath.match(/\.([a-zA-Z0-9]+)$/);
          const ext = extMatch ? extMatch[1].toLowerCase() : "png";
          let mimeType = "image/png";
          if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
          else if (ext === "gif") mimeType = "image/gif";
          else if (ext === "webp") mimeType = "image/webp";
          else if (ext === "svg") mimeType = "image/svg+xml";

          try {
            const base64Data = await fileObj.async("base64");
            const dataUri = `data:${mimeType};base64,${base64Data}`;
            const baseName = relativePath.split("/").pop();
            mediaMap[relativePath] = dataUri;
            mediaMap[`media/${baseName}`] = dataUri;
            mediaMap[baseName] = dataUri;

            extractedImages.push({
              name: baseName,
              dataUri,
              sizeBytes: base64Data.length * 0.75
            });
            this.stats.imageCount++;
          } catch (e) {
            console.warn("Lỗi trích xuất ảnh media:", relativePath, e);
          }
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
          const liHtml = this.parseParagraph(node, relsMap, mediaMap, { isLi: true });
          if (liHtml && liHtml.trim()) {
            htmlChunks.push(`  <li style="margin-bottom: 4px; line-height: ${this.options.lineHeight};">${liHtml}</li>`);
          }
        } else {
          if (inList) {
            htmlChunks.push(`</${listType}>`);
            inList = false;
          }
          const pHtml = this.parseParagraph(node, relsMap, mediaMap, { isLi: false, inTable: false });
          if (pHtml !== null && pHtml.trim().length > 0) {
            htmlChunks.push(pHtml);
          }
        }
      } else if (nodeName === "w:tbl" || nodeName === "tbl") {
        if (inList) {
          htmlChunks.push(`</${listType}>`);
          inList = false;
        }
        const tblHtml = this.parseTable(node, relsMap, mediaMap);
        if (tblHtml) {
          htmlChunks.push(tblHtml);
          this.stats.tableCount++;
        }
      }
    }

    if (inList) {
      htmlChunks.push(`</${listType}>`);
    }

    const fullHtml = htmlChunks.join("\n");
    return {
      html: fullHtml,
      stats: this.stats,
      images: extractedImages
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
   * Build clean, unnested CSS style string for <p> or list
   */
  buildParagraphStyles(opts = {}) {
    const styles = [];

    // 1. Text Align
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
      if (this.options.textIndent !== "none" && (align === "justify" || align === "left")) {
        styles.push(`text-indent: ${this.options.textIndent}`);
      } else if (opts.hasWordIndent && (align === "justify" || align === "left")) {
        styles.push(`text-indent: 1.5em`);
      }
    }

    return styles.join("; ");
  }

  /**
   * Parse a single Word paragraph <w:p>
   */
  parseParagraph(pNode, relsMap, mediaMap, ctx = {}) {
    const isLi = ctx.isLi || false;
    const inTable = ctx.inTable || false;

    const pPr = this.findChild(pNode, ["w:pPr", "pPr"]);
    
    let textAlign = "";
    let headingTag = "";
    let isBoldHeading = false;
    let hasWordIndent = false;
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

      const indNode = this.findChild(pPr, ["w:ind", "ind"]);
      if (indNode) {
        const fLine = parseInt(indNode.getAttribute("w:firstLine") || indNode.getAttribute("firstLine") || "0", 10);
        if (fLine > 200) hasWordIndent = true;
      }

      const spNode = this.findChild(pPr, ["w:spacing", "spacing"]);
      if (spNode) {
        const after = parseInt(spNode.getAttribute("w:after") || spNode.getAttribute("after") || "100", 10);
        if (after === 0) isZeroSpacing = true;
      }

      const pStyle = this.findChild(pPr, ["w:pStyle", "pStyle"]);
      if (pStyle) {
        const sVal = (pStyle.getAttribute("w:val") || pStyle.getAttribute("val") || "").toLowerCase();
        if (sVal.includes("heading1") || sVal.includes("title") || sVal.includes("tieude1") || sVal === "1") headingTag = "h2";
        else if (sVal.includes("heading2") || sVal.includes("tieude2") || sVal === "2") headingTag = "h3";
        else if (sVal.includes("heading3") || sVal.includes("tieude3") || sVal === "3") headingTag = "h4";
      }
    }

    // Extract Runs & Raw Data
    const rawRuns = [];
    const childNodes = pNode.childNodes;

    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:r" || cName === "r") {
        const rData = this.extractRunData(child, relsMap, mediaMap);
        if (rData.text || rData.imageHtml) {
          rawRuns.push(rData);
          if (rData.isLargeHeading) isBoldHeading = true;
        }
      } else if (cName === "w:hyperlink" || cName === "hyperlink") {
        const rId = child.getAttribute("r:id") || child.getAttribute("id");
        const linkUrl = (rId && relsMap[rId]) ? relsMap[rId].target || "#" : "#";
        const linkRuns = child.childNodes;
        for (let j = 0; j < linkRuns.length; j++) {
          if (linkRuns[j].nodeName.toLowerCase() === "w:r" || linkRuns[j].nodeName.toLowerCase() === "r") {
            const rData = this.extractRunData(linkRuns[j], relsMap, mediaMap);
            if (rData.text) {
              rData.linkUrl = linkUrl;
              rawRuns.push(rData);
            }
          }
        }
      } else if (cName === "w:drawing" || cName === "drawing") {
        const imgHtml = this.extractImageFromDrawing(child, relsMap, mediaMap);
        if (imgHtml) {
          rawRuns.push({ text: "", imageHtml: imgHtml, isImage: true });
        }
      }
    }

    if (rawRuns.length === 0) {
      if (this.options.cleanEmptyParagraphs || inTable) return null;
      const pStyles = this.buildParagraphStyles({ textAlign, inTable, isZeroSpacing });
      return `<p style="${pStyles}">&nbsp;</p>`;
    }

    // Merge adjacent runs with identical styling to eliminate fragmented <span> tags
    const mergedRuns = this.mergeAdjacentRuns(rawRuns);

    // Build inner HTML string
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

      // Only add <span> if run has distinct custom styling differing from paragraph base
      const spanStyles = [];
      if (run.customColor && run.customColor.toLowerCase() !== this.options.textColor.toLowerCase()) {
        spanStyles.push(`color: ${run.customColor}`);
      }
      if (run.customBg) {
        spanStyles.push(`background-color: ${run.customBg}`);
      }
      if (run.customFontSize) {
        spanStyles.push(`font-size: ${run.customFontSize}`);
      }
      if (run.customFontFamily) {
        spanStyles.push(`font-family: ${run.customFontFamily}`);
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

    if (!plainText && !rawRuns.some(r => r.isImage || r.imageHtml)) {
      if (this.options.cleanEmptyParagraphs || inTable) return null;
      const pStyles = this.buildParagraphStyles({ textAlign, inTable, isZeroSpacing });
      return `<p style="${pStyles}">&nbsp;</p>`;
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

    // Determine Headings if autoHeading is enabled
    if (this.options.autoHeading && (headingTag || (isBoldHeading && plainText.length < 100 && !plainText.endsWith(".")))) {
      const tag = headingTag || "h3";
      const hColor = this.options.textColor === "#333333" ? "#1e293b" : this.options.textColor;
      const hSize = tag === "h2" ? "18px" : "16px";
      const hMargin = tag === "h2" ? "16px 0 8px 0" : "12px 0 6px 0";
      const font = this.options.fontFamily || "inherit";

      return `<${tag} style="font-family: ${font}; color: ${hColor}; font-size: ${hSize}; font-weight: bold; margin: ${hMargin}; line-height: 1.35; text-align: ${textAlign || 'left'};">${innerHtml}</${tag}>`;
    }

    const pStyles = this.buildParagraphStyles({
      textAlign: textAlign || (this.options.textAlign === "inherit" ? "" : this.options.textAlign),
      inTable,
      isZeroSpacing,
      hasWordIndent
    });

    return `<p style="${pStyles};">${innerHtml}</p>`;
  }

  /**
   * Extract raw attributes from a Run <w:r>
   */
  extractRunData(rNode, relsMap, mediaMap) {
    const rPr = this.findChild(rNode, ["w:rPr", "rPr"]);
    
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let isStrike = false;
    let isSub = false;
    let isSup = false;
    let customColor = "";
    let customBg = "";
    let customFontSize = "";
    let customFontFamily = "";
    let isLargeHeading = false;

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
        else if (hVal === "cyan") customBg = "#a5f3fc";
        else if (hVal === "magenta") customBg = "#fbcfe8";
        else if (hVal !== "none") customBg = "#fef08a";
      }

      const szNode = this.findChild(rPr, ["w:sz", "sz"]);
      if (szNode) {
        const szVal = parseInt(szNode.getAttribute("w:val") || szNode.getAttribute("val") || "0", 10);
        if (szVal > 0) {
          const ptSize = szVal / 2;
          if (ptSize >= 15 && isBold) isLargeHeading = true;
          if (this.options.baseFontSize === "inherit") {
            customFontSize = `${ptSize}pt`;
          }
        }
      }

      const rFonts = this.findChild(rPr, ["w:rFonts", "rFonts"]);
      if (rFonts && this.options.fontFamily === "inherit") {
        const fAscii = rFonts.getAttribute("w:ascii") || rFonts.getAttribute("w:hAnsi");
        if (fAscii) customFontFamily = `${fAscii}, serif`;
      }
    }

    let text = "";
    let imageHtml = "";

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
        const img = this.extractImageFromDrawing(child, relsMap, mediaMap);
        if (img) imageHtml += img;
      }
    }

    return {
      text,
      imageHtml,
      isBold,
      isItalic,
      isUnderline,
      isStrike,
      isSub,
      isSup,
      customColor,
      customBg,
      customFontSize,
      customFontFamily,
      isLargeHeading,
      linkUrl: null
    };
  }

  /**
   * Group adjacent runs that have identical formatting to avoid messy <span> tags
   */
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
        current.customFontSize === next.customFontSize &&
        current.customFontFamily === next.customFontFamily &&
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
   * Extract image from drawing node
   */
  extractImageFromDrawing(drawingNode, relsMap, mediaMap) {
    const blipNodes = drawingNode.getElementsByTagName("a:blip").length > 0
      ? drawingNode.getElementsByTagName("a:blip")
      : drawingNode.getElementsByTagName("blip");

    if (blipNodes.length === 0) return "";

    const blip = blipNodes[0];
    const embedId = blip.getAttribute("r:embed") || blip.getAttribute("embed") || "";
    if (!embedId || !relsMap[embedId]) return "";

    const target = relsMap[embedId].target;
    const baseName = target.split("/").pop();

    let imgDataUri = mediaMap[target] || mediaMap[`media/${baseName}`] || mediaMap[baseName] || "";
    if (!imgDataUri) return "";

    return `<p style="text-align: center; margin: 12px 0;"><img src="${imgDataUri}" alt="Hình ảnh bài viết" style="max-width: 100%; height: auto; display: inline-block; margin: 0 auto;" /></p>`;
  }

  /**
   * Check if table is a borderless layout table (Letterheads, signatures)
   */
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

  /**
   * Parse a Word Table <w:tbl> cleanly into standard HTML <table>
   */
  parseTable(tblNode, relsMap, mediaMap) {
    const trNodes = tblNode.getElementsByTagName("w:tr").length > 0
      ? tblNode.getElementsByTagName("w:tr")
      : tblNode.getElementsByTagName("tr");

    if (trNodes.length === 0) return "";

    const isLayoutTable = this.options.preserveLayoutTables && this.isTableBorderless(tblNode);

    const tblStyles = [
      "width: 100%",
      "border-collapse: collapse",
      `font-family: ${this.options.fontFamily || 'inherit'}`,
      `font-size: ${this.options.baseFontSize || '16px'}`,
      `color: ${this.options.textColor || '#333333'}`,
      "line-height: 1.4",
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
          const pHtml = this.parseParagraph(pNodes[p], relsMap, mediaMap, { isLi: false, inTable: true });
          if (pHtml) cellContentParts.push(pHtml);
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
          cellStyles.push(`background-color: ${cellBg || this.options.tableHeaderBg}`, "font-weight: bold", "text-align: center");
        } else {
          if (cellBg) {
            cellStyles.push(`background-color: ${cellBg}`);
          } else if (!isLayoutTable && this.options.tableZebra && r % 2 === 1) {
            cellStyles.push("background-color: #f8fafc");
          }
        }

        const spanAttr = colSpan > 1 ? ` colspan="${colSpan}"` : "";
        cellsHtml.push(`    <${cellTag}${spanAttr} style="${cellStyles.join('; ')};">${cellInner}</${cellTag}>`);
      }

      const rowBg = isHeaderRow ? `background-color: ${this.options.tableHeaderBg};` : "";
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
