/**
 * tool-word-to-html.js
 * Advanced Word (.docx) to Clean HTML & Inline CSS Converter for CMS & Website Publishing.
 * 100% Client-side, ultra-optimized typography, precise layout normalization & smart spacing engine.
 */

class WordToHtmlConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      preset: "article", // "article" | "admin" | "medical" | "compact" | "custom"
      fontFamily: "Arial, sans-serif",
      baseFontSize: "16px",
      textColor: "#333333",
      textAlign: "justify", // "justify" | "left" | "center" | "inherit"
      lineHeight: "1.6",
      paragraphMarginBottom: "10px",
      textIndent: "none", // "none" | "1.5em" | "2em" | "inherit"
      tableFullBorder: true,
      tableHeaderBg: "#f1f5f9",
      tableZebra: false,
      tableFullWidth: true,
      preserveLayoutTables: true, // Preserve borderless layout tables (Quốc hiệu, Tiêu ngữ, Chữ ký)
      embedImagesBase64: true,
      cleanEmptyParagraphs: true,
      collapseSpaces: true,
      autoHeading: true
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

  applyPreset(presetName) {
    if (presetName === "article") {
      this.setOptions({
        preset: "article",
        fontFamily: "Arial, sans-serif",
        baseFontSize: "16px",
        textColor: "#333333",
        textAlign: "justify",
        lineHeight: "1.6",
        paragraphMarginBottom: "10px",
        textIndent: "none",
        tableFullBorder: true,
        tableHeaderBg: "#f1f5f9",
        tableZebra: false,
        tableFullWidth: true,
        preserveLayoutTables: true,
        cleanEmptyParagraphs: true,
        collapseSpaces: true,
        autoHeading: true
      });
    } else if (presetName === "admin") {
      // Văn bản hành chính / Công văn theo Nghị định 30
      this.setOptions({
        preset: "admin",
        fontFamily: "'Times New Roman', Times, serif",
        baseFontSize: "15px",
        textColor: "#000000",
        textAlign: "justify",
        lineHeight: "1.45",
        paragraphMarginBottom: "6px",
        textIndent: "1.5em",
        tableFullBorder: true,
        tableHeaderBg: "#f8fafc",
        tableZebra: false,
        tableFullWidth: true,
        preserveLayoutTables: true,
        cleanEmptyParagraphs: true,
        collapseSpaces: true,
        autoHeading: false
      });
    } else if (presetName === "medical") {
      // Tài liệu y tế / Phác đồ điều trị
      this.setOptions({
        preset: "medical",
        fontFamily: "Arial, sans-serif",
        baseFontSize: "15px",
        textColor: "#1e293b",
        textAlign: "justify",
        lineHeight: "1.55",
        paragraphMarginBottom: "8px",
        textIndent: "none",
        tableFullBorder: true,
        tableHeaderBg: "#f0fdf4",
        tableZebra: true,
        tableFullWidth: true,
        preserveLayoutTables: true,
        cleanEmptyParagraphs: true,
        collapseSpaces: true,
        autoHeading: true
      });
    } else if (presetName === "compact") {
      // Tối giản / Siêu gọn
      this.setOptions({
        preset: "compact",
        fontFamily: "Arial, sans-serif",
        baseFontSize: "14px",
        textColor: "#222222",
        textAlign: "left",
        lineHeight: "1.4",
        paragraphMarginBottom: "4px",
        textIndent: "none",
        tableFullBorder: true,
        tableHeaderBg: "#f1f5f9",
        tableZebra: false,
        tableFullWidth: true,
        preserveLayoutTables: true,
        cleanEmptyParagraphs: true,
        collapseSpaces: true,
        autoHeading: true
      });
    }
  }

  /**
   * Convert Word (.docx) file data to HTML string with Inline CSS
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

    // 4. Generate HTML elements with Inline CSS
    const htmlChunks = [];
    const childNodes = bodyNode.childNodes;

    let inList = false;
    let listType = "ul";
    let lastWasEmptyParagraph = false;

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      const nodeName = node.nodeName.toLowerCase();

      if (nodeName === "w:p" || nodeName === "p") {
        const isListItem = this.checkIsListItem(node);
        if (isListItem) {
          if (!inList) {
            inList = true;
            listType = isListItem.type || "ul";
            htmlChunks.push(`<${listType} style="margin: 0 0 ${this.options.paragraphMarginBottom} 20px; padding-left: 10px; font-family: ${this.options.fontFamily}; color: ${this.options.textColor}; line-height: ${this.options.lineHeight}; font-size: ${this.options.baseFontSize};">`);
          }
          const liHtml = this.parseParagraph(node, relsMap, mediaMap, { isLi: true, inTable: false });
          if (liHtml && liHtml.trim()) {
            htmlChunks.push(`<li style="margin-bottom: 4px; line-height: ${this.options.lineHeight};">${liHtml}</li>`);
          }
          lastWasEmptyParagraph = false;
        } else {
          if (inList) {
            htmlChunks.push(`</${listType}>`);
            inList = false;
          }
          const pHtml = this.parseParagraph(node, relsMap, mediaMap, { isLi: false, inTable: false });
          if (pHtml !== null) {
            // Collapse multiple consecutive empty paragraphs
            const isEmptyP = pHtml.includes("&nbsp;") && pHtml.length < 200;
            if (isEmptyP) {
              if (!lastWasEmptyParagraph && !this.options.cleanEmptyParagraphs) {
                htmlChunks.push(pHtml);
                lastWasEmptyParagraph = true;
              }
            } else {
              htmlChunks.push(pHtml);
              lastWasEmptyParagraph = false;
            }
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
        lastWasEmptyParagraph = false;
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
   * Parse a single Word paragraph <w:p>
   */
  parseParagraph(pNode, relsMap, mediaMap, ctx = {}) {
    const isLi = ctx.isLi || false;
    const inTable = ctx.inTable || false;

    const pPr = this.findChild(pNode, ["w:pPr", "pPr"]);
    
    let textAlign = this.options.textAlign === "inherit" ? "" : this.options.textAlign;
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

      // Check Indent
      const indNode = this.findChild(pPr, ["w:ind", "ind"]);
      if (indNode) {
        const fLine = parseInt(indNode.getAttribute("w:firstLine") || indNode.getAttribute("firstLine") || "0", 10);
        if (fLine > 200) hasWordIndent = true;
      }

      // Check Spacing
      const spNode = this.findChild(pPr, ["w:spacing", "spacing"]);
      if (spNode) {
        const after = parseInt(spNode.getAttribute("w:after") || spNode.getAttribute("after") || "100", 10);
        if (after === 0) isZeroSpacing = true;
      }

      // Check Heading Style
      const pStyle = this.findChild(pPr, ["w:pStyle", "pStyle"]);
      if (pStyle) {
        const sVal = (pStyle.getAttribute("w:val") || pStyle.getAttribute("val") || "").toLowerCase();
        if (sVal.includes("heading1") || sVal.includes("title") || sVal.includes("tieude1") || sVal === "1") headingTag = "h2";
        else if (sVal.includes("heading2") || sVal.includes("tieude2") || sVal === "2") headingTag = "h3";
        else if (sVal.includes("heading3") || sVal.includes("tieude3") || sVal === "3") headingTag = "h4";
      }
    }

    // Traverse runs inside paragraph
    const innerParts = [];
    let hasTextContent = false;
    let hasImage = false;

    const childNodes = pNode.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:r" || cName === "r") {
        const runResult = this.parseRun(child, relsMap, mediaMap);
        if (runResult.html) {
          innerParts.push(runResult.html);
          if (runResult.hasText) hasTextContent = true;
          if (runResult.hasImage) hasImage = true;
          if (runResult.isLargeHeading) isBoldHeading = true;
        }
      } else if (cName === "w:hyperlink" || cName === "hyperlink") {
        const rId = child.getAttribute("r:id") || child.getAttribute("id");
        let linkUrl = "#";
        if (rId && relsMap[rId]) {
          linkUrl = relsMap[rId].target || "#";
        }
        const linkParts = [];
        const linkRuns = child.childNodes;
        for (let j = 0; j < linkRuns.length; j++) {
          if (linkRuns[j].nodeName.toLowerCase() === "w:r" || linkRuns[j].nodeName.toLowerCase() === "r") {
            const rRes = this.parseRun(linkRuns[j], relsMap, mediaMap);
            if (rRes.html) linkParts.push(rRes.html);
          }
        }
        const linkInner = linkParts.join("");
        if (linkInner.trim()) {
          innerParts.push(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 500;">${linkInner}</a>`);
          hasTextContent = true;
        }
      } else if (cName === "w:drawing" || cName === "drawing") {
        const imgHtml = this.extractImageFromDrawing(child, relsMap, mediaMap);
        if (imgHtml) {
          innerParts.push(imgHtml);
          hasImage = true;
        }
      }
    }

    let innerHtml = innerParts.join("");
    
    // Collapse multiple consecutive spaces if requested
    if (this.options.collapseSpaces) {
      innerHtml = innerHtml.replace(/[ \t]{2,}/g, " ");
    }

    const plainText = innerHtml.replace(/<[^>]*>/g, "").trim();

    if (!hasTextContent && !hasImage) {
      if (this.options.cleanEmptyParagraphs || inTable) return null;
      return `<p style="margin: 0 0 6px 0; line-height: 1.2; font-size: ${this.options.baseFontSize};">&nbsp;</p>`;
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

    // Paragraph INSIDE Table Cell -> Tighter margins to prevent bloated table rows
    if (inTable) {
      const cellPStyles = [
        "margin: 0 0 4px 0",
        `line-height: ${Math.min(parseFloat(this.options.lineHeight), 1.45)}`,
        `font-family: inherit`,
        `color: inherit`
      ];
      if (textAlign && textAlign !== "justify") cellPStyles.push(`text-align: ${textAlign}`);
      return `<p style="${cellPStyles.join('; ')};">${innerHtml}</p>`;
    }

    // Determine Headings
    if (this.options.autoHeading && (headingTag || (isBoldHeading && plainText.length < 120 && !plainText.endsWith(".")))) {
      const tag = headingTag || "h3";
      const hColor = this.options.textColor === "#333333" ? "#1e293b" : this.options.textColor;
      const hSize = tag === "h2" ? "1.32em" : "1.16em";
      const hMargin = tag === "h2" ? "18px 0 8px 0" : "14px 0 6px 0";

      return `<${tag} style="font-family: ${this.options.fontFamily}; color: ${hColor}; font-size: ${hSize}; font-weight: 700; margin: ${hMargin}; line-height: 1.35; text-align: ${textAlign || 'left'};">${innerHtml}</${tag}>`;
    }

    // Margin bottom calculation: Zero spacing if Word explicitly set 0pt after
    const pMarginBottom = isZeroSpacing ? "3px" : this.options.paragraphMarginBottom;

    const styles = [
      `font-family: ${this.options.fontFamily}`,
      `font-size: ${this.options.baseFontSize}`,
      `color: ${this.options.textColor}`,
      `line-height: ${this.options.lineHeight}`,
      `margin: 0 0 ${pMarginBottom} 0`
    ];

    if (textAlign) {
      styles.push(`text-align: ${textAlign}`);
    }

    // Apply text indent if enabled or present in Word
    if (this.options.textIndent !== "none" && (textAlign === "justify" || textAlign === "left")) {
      styles.push(`text-indent: ${this.options.textIndent}`);
    } else if (hasWordIndent && (textAlign === "justify" || textAlign === "left")) {
      styles.push(`text-indent: 1.5em`);
    }

    return `<p style="${styles.join('; ')};">${innerHtml}</p>`;
  }

  /**
   * Parse a Word Run <w:r>
   */
  parseRun(rNode, relsMap, mediaMap) {
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
        if (fAscii) customFontFamily = `${fAscii}, sans-serif`;
      }
    }

    let textContent = "";
    let hasImage = false;
    let imageHtml = "";

    const childNodes = rNode.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:t" || cName === "t") {
        textContent += this.escapeHtml(child.textContent);
      } else if (cName === "w:br" || cName === "br") {
        textContent += "<br/>";
      } else if (cName === "w:tab" || cName === "tab") {
        textContent += "&emsp;&emsp;";
      } else if (cName === "w:drawing" || cName === "drawing") {
        const img = this.extractImageFromDrawing(child, relsMap, mediaMap);
        if (img) {
          imageHtml += img;
          hasImage = true;
        }
      }
    }

    if (!textContent && !hasImage) {
      return { html: "", hasText: false, hasImage: false, isLargeHeading: false };
    }

    let runHtml = textContent;

    if (isBold) runHtml = `<strong>${runHtml}</strong>`;
    if (isItalic) runHtml = `<em>${runHtml}</em>`;
    if (isUnderline) runHtml = `<u>${runHtml}</u>`;
    if (isStrike) runHtml = `<s>${runHtml}</s>`;
    if (isSub) runHtml = `<sub>${runHtml}</sub>`;
    if (isSup) runHtml = `<sup>${runHtml}</sup>`;

    const spanStyles = [];
    if (customColor && customColor.toLowerCase() !== this.options.textColor.toLowerCase()) {
      spanStyles.push(`color: ${customColor}`);
    }
    if (customBg) {
      spanStyles.push(`background-color: ${customBg}`, `padding: 1px 3px`, `border-radius: 2px`);
    }
    if (customFontSize) {
      spanStyles.push(`font-size: ${customFontSize}`);
    }
    if (customFontFamily) {
      spanStyles.push(`font-family: ${customFontFamily}`);
    }

    if (spanStyles.length > 0) {
      runHtml = `<span style="${spanStyles.join('; ')};">${runHtml}</span>`;
    }

    if (imageHtml) {
      runHtml += imageHtml;
    }

    return {
      html: runHtml,
      hasText: textContent.trim().length > 0,
      hasImage,
      isLargeHeading
    };
  }

  /**
   * Extract image from <w:drawing> node
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

    const imgStyles = [
      "max-width: 100%",
      "height: auto",
      "display: block",
      "margin: 14px auto",
      "border-radius: 4px",
      "box-shadow: 0 1px 6px rgba(0,0,0,0.12)"
    ];

    return `<div style="text-align: center; margin: 14px 0;"><img src="${imgDataUri}" alt="Hình ảnh bài viết" style="${imgStyles.join('; ')};" loading="lazy" /></div>`;
  }

  /**
   * Check if a table is a borderless layout table (Letterheads, signatures, 2-column info)
   */
  isTableBorderless(tblNode) {
    const tblPr = this.findChild(tblNode, ["w:tblPr", "tblPr"]);
    if (!tblPr) return false;

    const tblBorders = this.findChild(tblPr, ["w:tblBorders", "tblBorders"]);
    if (!tblBorders) return true; // No borders defined -> layout table

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
   * Parse a Word Table <w:tbl> with smart layout detection
   */
  parseTable(tblNode, relsMap, mediaMap) {
    const trNodes = tblNode.getElementsByTagName("w:tr").length > 0
      ? tblNode.getElementsByTagName("w:tr")
      : tblNode.getElementsByTagName("tr");

    if (trNodes.length === 0) return "";

    const isLayoutTable = this.options.preserveLayoutTables && this.isTableBorderless(tblNode);

    const rowsHtml = [];
    const tblStyles = [
      "border-collapse: collapse",
      "margin: 12px 0",
      `font-family: ${this.options.fontFamily}`,
      `font-size: ${this.options.baseFontSize}`,
      `color: ${this.options.textColor}`,
      "line-height: 1.45"
    ];

    if (this.options.tableFullWidth || isLayoutTable) {
      tblStyles.push("width: 100%");
    }

    if (!isLayoutTable && this.options.tableFullBorder) {
      tblStyles.push("border: 1px solid #cbd5e1");
    } else if (isLayoutTable) {
      tblStyles.push("border: none");
    }

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
            const wType = tcW.getAttribute("w:type") || tcW.getAttribute("type");
            const wVal = parseInt(tcW.getAttribute("w:val") || tcW.getAttribute("val") || "0", 10);
            if (wType === "pct" && wVal > 0) {
              cellWidth = `${(wVal / 50).toFixed(0)}%`;
            } else if (wVal > 0 && isLayoutTable && tcNodes.length === 2) {
              cellWidth = c === 0 ? "50%" : "50%";
            }
          }
        }

        // Parse cell content with inTable flag to keep line-height tight
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
          isLayoutTable ? "padding: 4px 8px" : "padding: 8px 12px",
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
          cellStyles.push(`background-color: ${cellBg || this.options.tableHeaderBg}`, "font-weight: 700", "text-align: center");
        } else {
          if (cellBg) {
            cellStyles.push(`background-color: ${cellBg}`);
          } else if (!isLayoutTable && this.options.tableZebra && r % 2 === 1) {
            cellStyles.push("background-color: #f8fafc");
          }
        }

        const spanAttr = colSpan > 1 ? ` colspan="${colSpan}"` : "";
        cellsHtml.push(`<${cellTag}${spanAttr} style="${cellStyles.join('; ')};">${cellInner}</${cellTag}>`);
      }

      const rowBg = isHeaderRow ? `background-color: ${this.options.tableHeaderBg};` : "";
      rowsHtml.push(`  <tr style="${rowBg}">\n    ${cellsHtml.join("\n    ")}\n  </tr>`);
    }

    return `<div style="overflow-x: auto; margin: ${isLayoutTable ? '6px 0' : '14px 0'};"><table style="${tblStyles.join('; ')};">\n${rowsHtml.join("\n")}\n</table></div>`;
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
