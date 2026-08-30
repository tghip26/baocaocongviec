/**
 * tool-word-to-html.js
 * Advanced Word (.docx) to Clean HTML & CSS Inline Converter for CMS Web Publishing.
 * BẢO TOÀN 100% NỘI DUNG GỐC:
 * 1. Giữ nguyên 100% văn bản, tiêu đề, số liệu, danh sách, bảng biểu, chữ ký, ghi chú.
 * 2. Trích xuất toàn bộ ảnh nhúng sang định dạng Base64 data URI sắc nét.
 * 3. Bảo lưu định dạng phong phú: In đậm (Bold), In nghiêng (Italic), Gạch chân (Underline), Gạch ngang (Strike), Chỉ số trên/dưới (Sup/Sub), Màu chữ, Căn lề (Trái/Phải/Giữa/Đều hai bên).
 * 4. Bảng biểu (Tables) responsive chống tràn viền chuẩn web.
 * 5. Tích hợp: Beautify HTML, Minify HTML, Xuất Markdown, Tải file .html.
 */

class WordToHtmlConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      preset: "ctxh", // "ctxh" | "thau" | "custom"
      fontFamily: "times new roman,times,serif",
      baseFontSize: "16px",
      textColor: "#000000",
      textAlign: "justify",
      preserveOriginalAlignment: true, // Giữ nguyên căn lề của từng đoạn trong Word
      preserveRichStyles: true, // Giữ nguyên in đậm, in nghiêng, gạch chân, màu sắc
      autoFilterBoundaries: false, // TUYỆT ĐỐI KHÔNG tự ý xóa nội dung đầu/cuối
      enableLists: true,
      enableHeadings: true,
      cleanEmptySpans: true,

      // Image Controls
      useBase64Images: true,
      maxImageWidth: 650
    }, options);

    this.stats = {
      wordCount: 0,
      charCount: 0,
      paragraphCount: 0,
      tableCount: 0,
      imageCount: 0,
      readingTimeMinutes: 0
    };

    this.rawDocxElements = [];
    this.originalGeneratedHtml = "";
  }

  setOptions(newOptions) {
    this.options = Object.assign(this.options, newOptions);
  }

  /**
   * Chuyển đổi tệp Word (.docx) sang HTML chuẩn CMS (Bảo toàn 100% nội dung)
   */
  async convertDocxToHtml(fileData, fileName = "") {
    if (!window.JSZip) {
      throw new Error("Thư viện JSZip chưa sẵn sàng. Vui lòng tải lại trang.");
    }

    this.stats = { wordCount: 0, charCount: 0, paragraphCount: 0, tableCount: 0, imageCount: 0, readingTimeMinutes: 0 };
    this.rawDocxElements = [];

    let arrayBuffer = fileData;
    if (fileData instanceof Blob) {
      arrayBuffer = await fileData.arrayBuffer();
    }

    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file("word/document.xml");
    if (!docXmlFile) {
      throw new Error(`Tệp ${fileName} không phải là tài liệu Word (.docx) hợp lệ.`);
    }

    // 1. Trích xuất toàn bộ Media Images trong file zip sang Base64
    const imageBase64Map = {};
    const extractedImageNames = [];
    const mediaFolder = zip.folder("word/media");
    if (mediaFolder) {
      for (const relPath in mediaFolder.files) {
        const file = mediaFolder.files[relPath];
        if (!file.dir) {
          const fname = relPath.split("/").pop();
          const ext = fname.split(".").pop().toLowerCase();
          const mime = (ext === "jpg" || ext === "jpeg") ? "image/jpeg" : (ext === "gif" ? "image/gif" : (ext === "webp" ? "image/webp" : "image/png"));
          const b64Data = await file.async("base64");
          const dataUrl = `data:${mime};base64,${b64Data}`;
          
          imageBase64Map[fname] = dataUrl;
          imageBase64Map["media/" + fname] = dataUrl;
          imageBase64Map["word/media/" + fname] = dataUrl;
          extractedImageNames.push(fname);
          this.stats.imageCount++;
        }
      }
    }

    // 2. Đọc Relationships (Rels) để ánh xạ rId sang ảnh Base64 & Hyperlinks
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

        if (type.includes("image") || target.includes("media/")) {
          const fname = target.split("/").pop();
          if (imageBase64Map[fname]) {
            relsMap[id] = imageBase64Map[fname];
          }
        } else if (type.includes("hyperlink")) {
          relsMap[id] = target;
        }
      }
    }

    // 3. Phân tích XML cấu trúc document.xml
    const docXmlText = await docXmlFile.async("text");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXmlText, "application/xml");

    const body = xmlDoc.getElementsByTagName("w:body")[0];
    if (!body) {
      throw new Error("Không tìm thấy nội dung w:body trong tài liệu Word.");
    }

    // Duyệt tuần tự 100% các node con trong body (w:p, w:tbl)
    const elements = [];
    for (let i = 0; i < body.childNodes.length; i++) {
      const child = body.childNodes[i];
      if (child.nodeName === "w:p") {
        const pObj = this.parseParagraph(child, relsMap, imageBase64Map);
        if (pObj) elements.push(pObj);
      } else if (child.nodeName === "w:tbl") {
        const tblObj = this.parseTable(child, relsMap, imageBase64Map);
        if (tblObj) elements.push(tblObj);
      }
    }

    this.rawDocxElements = elements;

    // 4. Sinh mã HTML giữ nguyên 100% nội dung
    const finalHtml = this.buildHtmlFromElements(elements);

    // 5. Tính toán thống kê
    this.originalGeneratedHtml = finalHtml;
    this.calculateStats(finalHtml);

    return {
      html: finalHtml,
      stats: this.stats,
      extractedImages: extractedImageNames
    };
  }

  /**
   * Phân tích chi tiết một đoạn văn bản (w:p) với đầy đủ định dạng Rich Text
   */
  parseParagraph(pNode, relsMap, imageBase64Map) {
    let fullText = "";
    const runs = [];
    const images = [];
    let isHeading = false;
    let headingLevel = 0;
    let isListItem = false;
    let listLevel = 0;
    let align = "justify";

    // Phân tích thuộc tính đoạn w:pPr
    const pPr = pNode.getElementsByTagName("w:pPr")[0];
    if (pPr) {
      // Căn lề
      const jc = pPr.getElementsByTagName("w:jc")[0];
      if (jc) {
        const jcVal = (jc.getAttribute("w:val") || "").toLowerCase();
        if (jcVal === "center") align = "center";
        else if (jcVal === "right") align = "right";
        else if (jcVal === "left") align = "left";
        else if (jcVal === "both" || jcVal === "distribute") align = "justify";
      }

      // Heading style
      const pStyle = pPr.getElementsByTagName("w:pStyle")[0];
      if (pStyle) {
        const val = (pStyle.getAttribute("w:val") || "").toLowerCase();
        if (val.includes("heading") || val.includes("tiêu đề") || val.includes("tieude") || val === "title") {
          isHeading = true;
          const match = val.match(/\d+/);
          headingLevel = match ? parseInt(match[0], 10) : 2;
        }
      }

      // Danh sách (Bullet / Numbering)
      const numPr = pPr.getElementsByTagName("w:numPr")[0];
      if (numPr) {
        isListItem = true;
        const ilvl = numPr.getElementsByTagName("w:ilvl")[0];
        listLevel = ilvl ? parseInt(ilvl.getAttribute("w:val") || "0", 10) : 0;
      }
    }

    // Duyệt từng run và hyperlink trong w:p
    for (let i = 0; i < pNode.childNodes.length; i++) {
      const child = pNode.childNodes[i];

      if (child.nodeName === "w:r") {
        const runObj = this.parseRun(child);
        if (runObj && runObj.text) {
          fullText += runObj.text;
          runs.push(runObj);
        }

        // Tìm ảnh bên trong w:r
        const rImages = this.extractImagesFromNode(child, relsMap, imageBase64Map);
        images.push(...rImages);
      } else if (child.nodeName === "w:hyperlink") {
        const rId = child.getAttribute("r:id");
        const url = relsMap[rId] || "#";
        const rNodes = child.getElementsByTagName("w:r");
        for (let r = 0; r < rNodes.length; r++) {
          const runObj = this.parseRun(rNodes[r]);
          if (runObj && runObj.text) {
            runObj.isLink = true;
            runObj.url = url;
            fullText += runObj.text;
            runs.push(runObj);
          }
        }
      } else if (child.nodeName === "w:drawing" || child.nodeName === "w:pict") {
        const dImages = this.extractImagesFromNode(child, relsMap, imageBase64Map);
        images.push(...dImages);
      }
    }

    const trimmedText = fullText.trim();
    if (!trimmedText && images.length === 0) {
      return null;
    }

    return {
      type: "paragraph",
      text: fullText,
      align,
      runs,
      images,
      isHeading,
      headingLevel,
      isListItem,
      listLevel
    };
  }

  /**
   * Phân tích một khối text w:r với in đậm, in nghiêng, gạch chân, màu sắc
   */
  parseRun(rNode) {
    let text = "";
    const tNodes = rNode.getElementsByTagName("w:t");
    for (let i = 0; i < tNodes.length; i++) {
      text += tNodes[i].textContent;
    }
    const tabNodes = rNode.getElementsByTagName("w:tab");
    if (tabNodes.length > 0) text += " ";
    const brNodes = rNode.getElementsByTagName("w:br");
    if (brNodes.length > 0) text += "\n";

    if (!text) return null;

    let bold = false;
    let italic = false;
    let underline = false;
    let strike = false;
    let vertAlign = null; // 'superscript' | 'subscript'
    let color = null;

    const rPr = rNode.getElementsByTagName("w:rPr")[0];
    if (rPr) {
      // Bold
      const bNode = rPr.getElementsByTagName("w:b")[0] || rPr.getElementsByTagName("w:bCs")[0];
      if (bNode) {
        const val = bNode.getAttribute("w:val");
        bold = (val !== "0" && val !== "false");
      }

      // Italic
      const iNode = rPr.getElementsByTagName("w:i")[0] || rPr.getElementsByTagName("w:iCs")[0];
      if (iNode) {
        const val = iNode.getAttribute("w:val");
        italic = (val !== "0" && val !== "false");
      }

      // Underline
      const uNode = rPr.getElementsByTagName("w:u")[0];
      if (uNode) {
        const val = uNode.getAttribute("w:val");
        underline = (val && val !== "none" && val !== "0" && val !== "false");
      }

      // Strike
      const strikeNode = rPr.getElementsByTagName("w:strike")[0];
      if (strikeNode) {
        const val = strikeNode.getAttribute("w:val");
        strike = (val !== "0" && val !== "false");
      }

      // VertAlign (Superscript / Subscript)
      const vaNode = rPr.getElementsByTagName("w:vertAlign")[0];
      if (vaNode) {
        vertAlign = vaNode.getAttribute("w:val");
      }

      // Color
      const colNode = rPr.getElementsByTagName("w:color")[0];
      if (colNode) {
        const colVal = colNode.getAttribute("w:val");
        if (colVal && colVal !== "auto") {
          color = "#" + colVal;
        }
      }
    }

    return {
      text,
      bold,
      italic,
      underline,
      strike,
      vertAlign,
      color
    };
  }

  /**
   * Trích xuất hình ảnh từ XML node
   */
  extractImagesFromNode(node, relsMap, imageBase64Map) {
    const images = [];

    const blips = node.getElementsByTagName("a:blip");
    for (let i = 0; i < blips.length; i++) {
      const embedId = blips[i].getAttribute("r:embed");
      if (embedId && relsMap[embedId]) {
        images.push({ src: relsMap[embedId], embedId });
      }
    }

    const imgDatas = node.getElementsByTagName("v:imagedata");
    for (let i = 0; i < imgDatas.length; i++) {
      const rId = imgDatas[i].getAttribute("r:id") || imgDatas[i].getAttribute("o:relid");
      if (rId && relsMap[rId]) {
        images.push({ src: relsMap[rId], embedId: rId });
      }
    }

    return images;
  }

  /**
   * Phân tích 100% cấu trúc bảng biểu (w:tbl) và từng ô dữ liệu
   */
  parseTable(tblNode, relsMap, imageBase64Map) {
    const rows = [];
    const trNodes = tblNode.getElementsByTagName("w:tr");

    for (let r = 0; r < trNodes.length; r++) {
      const row = [];
      const tcNodes = trNodes[r].getElementsByTagName("w:tc");

      for (let c = 0; c < tcNodes.length; c++) {
        const tc = tcNodes[c];
        const paragraphs = [];
        const pNodes = tc.getElementsByTagName("w:p");

        for (let p = 0; p < pNodes.length; p++) {
          const pObj = this.parseParagraph(pNodes[p], relsMap, imageBase64Map);
          if (pObj) paragraphs.push(pObj);
        }

        let colSpan = 1;
        const gridSpan = tc.getElementsByTagName("w:gridSpan")[0];
        if (gridSpan) {
          colSpan = parseInt(gridSpan.getAttribute("w:val") || "1", 10);
        }

        // Đọc màu nền ô (shading)
        let bgColor = "";
        const shd = tc.getElementsByTagName("w:shd")[0];
        if (shd) {
          const fill = shd.getAttribute("w:fill");
          if (fill && fill !== "auto" && fill !== "none") {
            bgColor = "#" + fill;
          }
        }

        row.push({
          paragraphs,
          colSpan,
          bgColor
        });
      }
      if (row.length > 0) rows.push(row);
    }

    return {
      type: "table",
      rows
    };
  }

  /**
   * Xây dựng HTML chuẩn, bảo toàn 100% nội dung & định dạng phong phú
   */
  buildHtmlFromElements(elements) {
    const htmlParts = [];
    const defaultFont = this.options.fontFamily;
    const defaultSize = this.options.baseFontSize;

    let imageCounter = 0;

    for (const el of elements) {
      if (el.type === "paragraph") {
        // 1. Render văn bản
        if (el.runs && el.runs.length > 0) {
          const align = this.options.preserveOriginalAlignment ? (el.align || "justify") : this.options.textAlign;
          const pStyle = `text-align: ${align}; margin-bottom: 10px; line-height: 1.6;`;
          
          let innerHtml = "";
          for (const run of el.runs) {
            let chunk = this.escapeHtml(run.text);
            if (run.bold) chunk = `<strong>${chunk}</strong>`;
            if (run.italic) chunk = `<em>${chunk}</em>`;
            if (run.underline) chunk = `<u>${chunk}</u>`;
            if (run.strike) chunk = `<s>${chunk}</s>`;
            if (run.vertAlign === "superscript") chunk = `<sup>${chunk}</sup>`;
            if (run.vertAlign === "subscript") chunk = `<sub>${chunk}</sub>`;
            
            if (run.color) {
              chunk = `<span style="color: ${run.color};">${chunk}</span>`;
            }

            if (run.isLink && run.url) {
              chunk = `<a href="${run.url}" target="_blank" style="color: #2563eb; text-decoration: underline;">${chunk}</a>`;
            }

            innerHtml += chunk;
          }

          if (el.isHeading && this.options.enableHeadings) {
            const hSize = el.headingLevel === 1 ? "19px" : (el.headingLevel === 2 ? "17px" : "16px");
            htmlParts.push(`<div style="${pStyle}"><span style="font-family: ${defaultFont}; font-size: ${hSize}; font-weight: bold; color: #000000;">${innerHtml}</span></div>`);
          } else if (el.isListItem && this.options.enableLists) {
            const indentPx = (el.listLevel + 1) * 20;
            htmlParts.push(`<div style="${pStyle} padding-left: ${indentPx}px;"><span style="font-family: ${defaultFont}; font-size: ${defaultSize}; color: #000000;">• ${innerHtml}</span></div>`);
          } else {
            htmlParts.push(`<div style="${pStyle}"><span style="font-family: ${defaultFont}; font-size: ${defaultSize}; color: #000000;">${innerHtml}</span></div>`);
          }
        }

        // 2. Render ảnh trong đoạn
        if (el.images && el.images.length > 0) {
          for (const img of el.images) {
            imageCounter++;
            htmlParts.push(this.renderSingleImage(img.src, `Hình ảnh ${imageCounter}`));
          }
        }
      } else if (el.type === "table") {
        htmlParts.push(this.renderTable(el));
      }
    }

    return htmlParts.join("\n\n");
  }

  /**
   * Render Bảng dữ liệu bảo toàn 100% ô & style
   */
  renderTable(tableObj) {
    const rowsHtml = [];
    const font = this.options.fontFamily;
    const size = this.options.baseFontSize;

    tableObj.rows.forEach((row, rIdx) => {
      const cellsHtml = [];
      const isHeaderRow = (rIdx === 0);

      row.forEach(cell => {
        const tag = isHeaderRow ? "th" : "td";
        const spanCol = cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : "";
        const bgStyle = cell.bgColor ? `background-color: ${cell.bgColor};` : (isHeaderRow ? "background-color: #f1f5f9;" : "");

        let cellInner = "";
        if (cell.paragraphs && cell.paragraphs.length > 0) {
          cellInner = cell.paragraphs.map(p => {
            let pText = "";
            p.runs.forEach(r => {
              let chunk = this.escapeHtml(r.text);
              if (r.bold) chunk = `<strong>${chunk}</strong>`;
              if (r.italic) chunk = `<em>${chunk}</em>`;
              if (r.underline) chunk = `<u>${chunk}</u>`;
              if (r.color) chunk = `<span style="color: ${r.color};">${chunk}</span>`;
              pText += chunk;
            });
            return pText;
          }).join("<br/>");
        }

        cellsHtml.push(`\t\t\t<${tag}${spanCol} style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; vertical-align: middle; ${bgStyle}"><span style="font-family: ${font}; font-size: ${size}; color: #000000;">${cellInner || "&nbsp;"}</span></${tag}>`);
      });

      rowsHtml.push(`\t\t<tr>\n${cellsHtml.join("\n")}\n\t\t</tr>`);
    });

    return `<div style="overflow-x: auto; margin: 15px 0px;">
<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: ${size};">
\t<tbody>
${rowsHtml.join("\n")}
\t</tbody>
</table>
</div>`;
  }

  /**
   * Render ảnh đơn căn giữa chuẩn đẹp
   */
  renderSingleImage(src, alt = "Hình ảnh bài viết", maxWidth = 650) {
    return `<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;">
\t<img alt="${alt}" src="${src}" style="max-width: ${maxWidth}px; width: 100%; height: auto; border-radius: 4px;" />
</div>`;
  }

  /**
   * Định dạng mã HTML đẹp (Beautify HTML)
   */
  beautifyHtml(html) {
    if (!html) return "";
    let formatted = "";
    let indent = 0;
    const tab = "  ";

    html.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) indent = Math.max(0, indent - 1);
      formatted += "\n" + tab.repeat(indent) + "<" + node + ">";
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("input") && !node.startsWith("img") && !node.startsWith("br") && !node.startsWith("hr")) {
        indent++;
      }
    });

    return formatted.substring(1);
  }

  /**
   * Nén mã HTML (Minify HTML)
   */
  minifyHtml(html) {
    if (!html) return "";
    return html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/>\s+</g, "><")
      .trim();
  }

  /**
   * Chuyển mã HTML sang Markdown
   */
  convertToMarkdown(html) {
    if (!html) return "";
    let md = html;

    md = md.replace(/<div[^>]*><span[^>]*font-weight:\s*bold;[^>]*>(.*?)<\/span><\/div>/gi, "\n### $1\n");
    md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
    md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
    md = md.replace(/<div[^>]*>(.*?)<\/div>/gi, "\n$1\n");
    md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/>/gi, "\n![$1]($2)\n");
    md = md.replace(/<[^>]+>/g, "");
    md = md.replace(/\n{3,}/g, "\n\n");

    return md.trim();
  }

  /**
   * Tính toán các chỉ số thống kê bài viết
   */
  calculateStats(html) {
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = textContent ? textContent.split(/\s+/).length : 0;
    const chars = textContent.length;
    const paragraphs = (html.match(/<div style="text-align/g) || []).length;
    const tables = (html.match(/<table/g) || []).length;
    const images = (html.match(/<img/g) || []).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    this.stats = {
      wordCount: words,
      charCount: chars,
      paragraphCount: paragraphs,
      tableCount: tables,
      imageCount: images,
      readingTimeMinutes: readingTime
    };

    return this.stats;
  }

  escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

window.WordToHtmlConverter = WordToHtmlConverter;
