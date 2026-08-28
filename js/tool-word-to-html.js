/**
 * tool-word-to-html.js
 * Advanced Word (.docx) to Clean HTML Converter for CMS Website Publishing.
 * Cấu trúc chuẩn 100% theo mẫu tòa soạn Cổng Website:
 * 1. Bài CTXH:
 *    - Các khối văn bản: <div style="overflow-x: auto; margin: 18px 0px; text-align: justify;"><span style="font-family:times new roman,times,serif;"><span style="font-size:16px;">...</span></span></div>
 *    - Các khối ảnh: <div style="overflow-x: auto; margin: 18px 0px; text-align: center;"><img alt="" src="URL" style="width: 650px; height: 390px;" /><br /><span style="font-family:times new roman,times,serif;"><span style="font-size:16px;">Chú thích ảnh</span></span></div>
 *    - Khối nguồn/tác giả: <div style="overflow-x: auto; margin: 18px 0px; text-align: right;"><span style="font-family:times new roman,times,serif;"><span style="font-size:16px;">Nguồn: ...</span></span></div>
 * 2. Bài Thầu:
 *    - 1 Ảnh trên đầu bài thầu (căn giữa)
 *    - Toàn bộ nội dung văn bản từ Word (giữ nguyên 100%, căn đều)
 *    - 1 Ảnh dưới cuối bài thầu (căn giữa)
 * 3. Link ảnh thường URL (không mã hóa Base64).
 */

class WordToHtmlConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      preset: "ctxh", // "ctxh" | "thau"
      fontFamily: "times new roman,times,serif",
      baseFontSize: "16px",
      textColor: "#000000",
      textAlign: "justify",

      // Image URL Controls (Không dùng Base64)
      ctxhImageUrls: [], // Mảng link ảnh nhập tay
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
   * Chuyển đổi tệp Word (.docx) sang đúng mẫu HTML của cổng thông tin
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

    // 1. Đọc Relationships (Rels) để lấy link hyperlinks
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

    // 2. Đếm số lượng ảnh trong file Word
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

    // 3. Parse XML document
    const xmlText = await docXmlFile.async("text");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const bodyNode = xmlDoc.getElementsByTagName("w:body")[0] || xmlDoc.getElementsByTagName("body")[0];
    if (!bodyNode) {
      throw new Error("Không tìm thấy nội dung trong file Word.");
    }

    const isThau = this.options.preset === "thau";

    // 4. Trích xuất tuần tự toàn bộ các phần tử trong Body
    const parsedElements = [];
    const childNodes = bodyNode.childNodes;

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      const nodeName = node.nodeName.toLowerCase();

      if (nodeName === "w:p" || nodeName === "p") {
        const pItem = this.extractParagraphInfo(node, relsMap);
        if (pItem) {
          parsedElements.push(pItem);
        }
      } else if (nodeName === "w:tbl" || nodeName === "tbl") {
        const tblHtml = this.parseTable(node, relsMap);
        if (tblHtml) {
          parsedElements.push({ type: "table", html: tblHtml });
          this.stats.tableCount++;
        }
      }
    }

    // 5. Gom và định dạng theo đúng cấu trúc CMS
    let finalHtml = "";
    if (isThau) {
      finalHtml = this.buildThauHtml(parsedElements);
    } else {
      finalHtml = this.buildCtxhHtml(parsedElements);
    }

    return {
      html: finalHtml,
      stats: this.stats,
      images: extractedImageNames
    };
  }

  /**
   * Trích xuất thông tin một đoạn văn từ Word
   */
  extractParagraphInfo(pNode, relsMap) {
    const pPr = this.findChild(pNode, ["w:pPr", "pPr"]);
    
    let align = "justify";
    if (pPr) {
      const jcNode = this.findChild(pPr, ["w:jc", "jc"]);
      if (jcNode) {
        const val = jcNode.getAttribute("w:val") || jcNode.getAttribute("val");
        if (val === "center") align = "center";
        else if (val === "right") align = "right";
        else if (val === "left") align = "left";
        else align = "justify";
      }
    }

    const runs = [];
    const childNodes = pNode.childNodes;
    let hasImage = false;

    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:r" || cName === "r") {
        const rData = this.extractRunData(child);
        if (rData.text || rData.hasImage) {
          runs.push(rData);
          if (rData.hasImage) hasImage = true;
        }
      } else if (cName === "w:hyperlink" || cName === "hyperlink") {
        const rId = child.getAttribute("r:id") || child.getAttribute("id");
        const linkUrl = (rId && relsMap[rId]) ? relsMap[rId].target || "#" : "#";
        const linkRuns = child.childNodes;
        for (let j = 0; j < linkRuns.length; j++) {
          if (linkRuns[j].nodeName.toLowerCase() === "w:r" || linkRuns[j].nodeName.toLowerCase() === "r") {
            const rData = this.extractRunData(linkRuns[j]);
            if (rData.text) {
              rData.linkUrl = linkUrl;
              runs.push(rData);
            }
          }
        }
      } else if (cName === "w:drawing" || cName === "drawing") {
        hasImage = true;
      }
    }

    // Build raw text & formatted HTML of paragraph
    let plainText = "";
    let formattedText = "";

    for (const r of runs) {
      if (r.text) {
        let piece = r.text;
        plainText += piece;

        if (r.isBold) piece = `<strong>${piece}</strong>`;
        if (r.isItalic) piece = `<em>${piece}</em>`;
        if (r.isUnderline) piece = `<u>${piece}</u>`;
        if (r.isStrike) piece = `<s>${piece}</s>`;
        if (r.isSub) piece = `<sub>${piece}</sub>`;
        if (r.isSup) piece = `<sup>${piece}</sup>`;
        if (r.linkUrl) piece = `<a href="${r.linkUrl}" target="_blank" rel="noopener noreferrer">${piece}</a>`;

        formattedText += piece;
      }
    }

    plainText = plainText.trim();

    if (!plainText && !hasImage) {
      return null;
    }

    if (plainText) {
      const words = plainText.split(/\s+/).filter(w => w.length > 0);
      this.stats.wordCount += words.length;
      this.stats.charCount += plainText.length;
      this.stats.paragraphCount++;
    }

    // Kiểm tra xem đoạn này có phải là chú thích ảnh không
    const isCaption = align === "center" ||
      (runs.length === 1 && runs[0].isItalic && plainText.length < 150) ||
      /^(\*?)(Ảnh|Hình|Ảnh \d|Hình \d|Sơ đồ|Bảng)[\s:]/i.test(plainText);

    // Kiểm tra xem đoạn này có phải là nguồn / tác giả ở cuối bài không
    const isSource = align === "right" ||
      /^(Nguồn|Theo|Ảnh|Tác giả|PV|CTV|Theo nguồn)[\s:]/i.test(plainText);

    return {
      type: "paragraph",
      plainText,
      formattedText,
      align,
      hasImage,
      isCaption,
      isSource
    };
  }

  extractRunData(rNode) {
    const rPr = this.findChild(rNode, ["w:rPr", "rPr"]);
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let isStrike = false;
    let isSub = false;
    let isSup = false;

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
    }

    let text = "";
    let hasImage = false;

    const childNodes = rNode.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:t" || cName === "t") {
        text += this.escapeHtml(child.textContent);
      } else if (cName === "w:br" || cName === "br") {
        text += "<br />";
      } else if (cName === "w:tab" || cName === "tab") {
        text += "&emsp;&emsp;";
      } else if (cName === "w:drawing" || cName === "drawing") {
        hasImage = true;
      }
    }

    return {
      text,
      hasImage,
      isBold,
      isItalic,
      isUnderline,
      isStrike,
      isSub,
      isSup,
      linkUrl: null
    };
  }

  /**
   * Xây dựng HTML chuẩn bài CTXH
   */
  buildCtxhHtml(elements) {
    const outputBlocks = [];
    let currentTextBlock = [];
    let imgCounter = 0;

    const flushTextBlock = () => {
      if (currentTextBlock.length > 0) {
        const content = currentTextBlock.join("<br />\n");
        outputBlocks.push(
          `<div style="overflow-x: auto; margin: 18px 0px; text-align: justify;"><span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${content}</span></span></div>`
        );
        currentTextBlock = [];
      }
    };

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      if (el.type === "table") {
        flushTextBlock();
        outputBlocks.push(el.html);
        continue;
      }

      // Xử lý dòng nguồn / tác giả ở cuối bài
      if (el.isSource && i >= elements.length - 2) {
        flushTextBlock();
        outputBlocks.push(
          `<div style="overflow-x: auto; margin: 18px 0px; text-align: right;"><span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${el.formattedText}</span></span></div>`
        );
        continue;
      }

      // Xử lý khi gặp ảnh hoặc vị trí ảnh
      if (el.hasImage) {
        flushTextBlock();

        // Kiểm tra xem đoạn tiếp theo có phải chú thích ảnh không
        let captionHtml = "";
        if (i + 1 < elements.length && elements[i + 1].type === "paragraph" && elements[i + 1].isCaption) {
          captionHtml = elements[i + 1].formattedText;
          i++; // Bỏ qua đoạn chú thích vì đã đưa vào khối ảnh
        }

        // Lấy link ảnh từ cấu hình người dùng nhập (nếu không nhập thì để trống "")
        let imgUrl = "";
        if (this.options.ctxhImageUrls && this.options.ctxhImageUrls[imgCounter]) {
          imgUrl = this.options.ctxhImageUrls[imgCounter].trim();
        }

        let imgBlock = `<div style="overflow-x: auto; margin: 18px 0px; text-align: center;"><img alt="" src="${imgUrl}" style="width: 650px;" />`;
        if (captionHtml) {
          imgBlock += `<br />\n<span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${captionHtml}</span></span>`;
        }
        imgBlock += `</div>`;

        outputBlocks.push(imgBlock);
        imgCounter++;
        continue;
      }

      // Đoạn văn thông thường -> gom vào khối text
      currentTextBlock.push(el.formattedText);
    }

    flushTextBlock();
    return outputBlocks.join("\n\n");
  }

  /**
   * Xây dựng HTML chuẩn bài Thầu (Chỉ 2 ảnh trên và dưới kích thước 850px)
   */
  buildThauHtml(elements) {
    const outputBlocks = [];
    const textLines = [];

    // 1. Khối Ảnh Trên (Đầu bài thầu - Chiều rộng 850px, link để trống nếu chưa nhập)
    const topUrl = this.options.thauTopImageUrl.trim();
    const topCaption = this.options.thauTopImageCaption.trim();

    let topBlock = `<div style="overflow-x: auto; margin: 18px 0px; text-align: center;"><img alt="" src="${topUrl}" style="width: 850px;" />`;
    if (topCaption) {
      topBlock += `<br />\n<span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${this.escapeHtml(topCaption)}</span></span>`;
    }
    topBlock += `</div>`;
    outputBlocks.push(topBlock);

    // 2. Gom toàn bộ nội dung văn bản từ Word
    for (const el of elements) {
      if (el.type === "paragraph") {
        textLines.push(el.formattedText);
      } else if (el.type === "table") {
        if (textLines.length > 0) {
          const content = textLines.join("<br />\n");
          outputBlocks.push(
            `<div style="overflow-x: auto; margin: 18px 0px; text-align: justify;"><span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${content}</span></span></div>`
          );
          textLines.length = 0;
        }
        outputBlocks.push(el.html);
      }
    }

    if (textLines.length > 0) {
      const content = textLines.join("<br />\n");
      outputBlocks.push(
        `<div style="overflow-x: auto; margin: 18px 0px; text-align: justify;"><span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${content}</span></span></div>`
      );
    }

    // 3. Khối Ảnh Dưới (Cuối bài thầu - Chiều rộng 850px, link để trống nếu chưa nhập)
    const btmUrl = this.options.thauBottomImageUrl.trim();
    const btmCaption = this.options.thauBottomImageCaption.trim();

    let btmBlock = `<div style="overflow-x: auto; margin: 18px 0px; text-align: center;"><img alt="" src="${btmUrl}" style="width: 850px;" />`;
    if (btmCaption) {
      btmBlock += `<br />\n<span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${this.escapeHtml(btmCaption)}</span></span>`;
    }
    btmBlock += `</div>`;
    outputBlocks.push(btmBlock);

    return outputBlocks.join("\n\n");
  }

  parseTable(tblNode, relsMap) {
    const trNodes = tblNode.getElementsByTagName("w:tr").length > 0
      ? tblNode.getElementsByTagName("w:tr")
      : tblNode.getElementsByTagName("tr");

    if (trNodes.length === 0) return "";

    const rowsHtml = [];

    for (let r = 0; r < trNodes.length; r++) {
      const trNode = trNodes[r];
      const isHeaderRow = r === 0;

      const tcNodes = trNode.getElementsByTagName("w:tc").length > 0
        ? trNode.getElementsByTagName("w:tc")
        : trNode.getElementsByTagName("tc");

      const cellsHtml = [];
      for (let c = 0; c < tcNodes.length; c++) {
        const tcNode = tcNodes[c];
        const tcPr = this.findChild(tcNode, ["w:tcPr", "tcPr"]);

        let colSpan = 1;
        if (tcPr) {
          const gridSpan = this.findChild(tcPr, ["w:gridSpan", "gridSpan"]);
          if (gridSpan) {
            colSpan = parseInt(gridSpan.getAttribute("w:val") || gridSpan.getAttribute("val") || "1", 10);
          }
        }

        const pNodes = tcNode.getElementsByTagName("w:p").length > 0
          ? tcNode.getElementsByTagName("w:p")
          : tcNode.getElementsByTagName("p");

        const cellTextParts = [];
        for (let p = 0; p < pNodes.length; p++) {
          const pInfo = this.extractParagraphInfo(pNodes[p], relsMap);
          if (pInfo && pInfo.formattedText) {
            cellTextParts.push(pInfo.formattedText);
          }
        }

        let cellInner = cellTextParts.join("<br />");
        if (!cellInner.trim()) cellInner = "&nbsp;";

        const cellTag = isHeaderRow ? "th" : "td";
        const spanAttr = colSpan > 1 ? ` colspan="${colSpan}"` : "";
        const cellStyle = isHeaderRow
          ? `background-color: #f1f5f9; padding: 6px 10px; font-weight: bold; text-align: center; border: 1px solid #cbd5e1;`
          : `padding: 6px 10px; vertical-align: top; border: 1px solid #cbd5e1;`;

        cellsHtml.push(`    <${cellTag}${spanAttr} style="${cellStyle}"><span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${cellInner}</span></span></${cellTag}>`);
      }

      rowsHtml.push(`  <tr>\n${cellsHtml.join("\n")}\n  </tr>`);
    }

    return `<div style="overflow-x: auto; margin: 18px 0px;"><table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">\n${rowsHtml.join("\n")}\n</table></div>`;
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
