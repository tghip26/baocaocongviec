/**
 * tool-word-to-html.js
 * Advanced Word (.docx) to Clean HTML & CSS Inline Converter for CMS Web Publishing.
 * Cấu trúc chuẩn 100% theo mẫu tòa soạn Cổng Website:
 * 1. Trích xuất toàn bộ ảnh nhúng trong Word sang định dạng Base64 data URI tự động.
 * 2. Tự động nhận diện và ghép cặp ảnh 2 cột (Cặp ảnh 1, 2, 3...) hoặc ảnh đơn căn giữa.
 * 3. Bộ lọc thông minh loại bỏ Header/Footer hành chính & Bảng trống (Ghost table).
 * 4. Hỗ trợ Danh sách (Lists), Tiêu đề (Headings), Bảng biểu (Tables) responsive chống tràn.
 * 5. Tích hợp công cụ: Làm sạch mã rác MS Word, Định dạng đẹp (Beautify), Nén mã (Minify), Xuất Markdown.
 */

class WordToHtmlConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      preset: "ctxh", // "ctxh" (ảnh 650px) | "thau" (ảnh 850px) | "custom"
      fontFamily: "times new roman,times,serif",
      baseFontSize: "16px",
      textColor: "#000000",
      textAlign: "justify",
      autoFilterBoundaries: true, // Tự động lọc phần hành chính đầu và cuối
      unboldAll: true, // Chuyển toàn bộ thành chữ thường (không in đậm)
      straightIndent: true, // Căn thẳng sát đầu dòng (không thụt)
      enableLists: true,
      enableHeadings: true,
      cleanEmptySpans: true,

      // Image Controls
      useBase64Images: true,
      ctxhImageUrls: [],
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
   * Chuyển đổi tệp Word (.docx) sang HTML chuẩn CMS
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

    // Duyệt tuần tự các node con trong body (w:p, w:tbl)
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

    // 4. Áp dụng Bộ lọc tự động loại bỏ đầu/cuối và bảng rác nếu bật
    const filteredElements = this.options.autoFilterBoundaries ? this.filterDocumentBoundaries(elements) : elements;

    // 5. Sinh mã HTML theo Preset bài viết
    let finalHtml = "";
    if (this.options.preset === "thau") {
      finalHtml = this.buildThauHtml(filteredElements);
    } else {
      finalHtml = this.buildCtxhHtml(filteredElements);
    }

    // 6. Làm sạch thẻ rác và tính toán thống kê
    finalHtml = this.cleanGarbageTags(finalHtml);
    this.originalGeneratedHtml = finalHtml;
    this.calculateStats(finalHtml);

    return {
      html: finalHtml,
      stats: this.stats,
      extractedImages: extractedImageNames
    };
  }

  /**
   * Phân tích một đoạn văn (w:p)
   */
  parseParagraph(pNode, relsMap, imageBase64Map) {
    let fullText = "";
    const runs = [];
    const images = [];
    let isHeading = false;
    let headingLevel = 0;
    let isListItem = false;
    let listLevel = 0;

    // Kiểm tra style Heading
    const pPr = pNode.getElementsByTagName("w:pPr")[0];
    if (pPr) {
      const pStyle = pPr.getElementsByTagName("w:pStyle")[0];
      if (pStyle) {
        const val = (pStyle.getAttribute("w:val") || "").toLowerCase();
        if (val.includes("heading") || val.includes("tiêu đề") || val.includes("tieude") || val === "title") {
          isHeading = true;
          const match = val.match(/\d+/);
          headingLevel = match ? parseInt(match[0], 10) : 2;
        }
      }

      // Kiểm tra danh sách (Bullet / Numbering)
      const numPr = pPr.getElementsByTagName("w:numPr")[0];
      if (numPr) {
        isListItem = true;
        const ilvl = numPr.getElementsByTagName("w:ilvl")[0];
        listLevel = ilvl ? parseInt(ilvl.getAttribute("w:val") || "0", 10) : 0;
      }
    }

    // Duyệt các phần tử con trong w:p
    for (let i = 0; i < pNode.childNodes.length; i++) {
      const child = pNode.childNodes[i];

      if (child.nodeName === "w:r") {
        const rText = this.getRunText(child);
        if (rText) {
          fullText += rText;
          runs.push({ text: rText });
        }

        // Tìm ảnh bên trong w:r
        const rImages = this.extractImagesFromNode(child, relsMap, imageBase64Map);
        images.push(...rImages);
      } else if (child.nodeName === "w:hyperlink") {
        const rId = child.getAttribute("r:id");
        const url = relsMap[rId] || "#";
        let linkText = "";
        const rNodes = child.getElementsByTagName("w:r");
        for (let r = 0; r < rNodes.length; r++) {
          linkText += this.getRunText(rNodes[r]);
        }
        if (linkText) {
          fullText += linkText;
          runs.push({ text: linkText, isLink: true, url });
        }
      } else if (child.nodeName === "w:drawing" || child.nodeName === "w:pict") {
        const dImages = this.extractImagesFromNode(child, relsMap, imageBase64Map);
        images.push(...dImages);
      }
    }

    const trimmedText = fullText.trim();
    if (!trimmedText && images.length === 0) {
      return null; // Bỏ qua đoạn hoàn toàn trống
    }

    return {
      type: "paragraph",
      text: trimmedText,
      runs,
      images,
      isHeading,
      headingLevel,
      isListItem,
      listLevel
    };
  }

  /**
   * Lấy text thuần túy từ một node w:r
   */
  getRunText(rNode) {
    let txt = "";
    const tNodes = rNode.getElementsByTagName("w:t");
    for (let i = 0; i < tNodes.length; i++) {
      txt += tNodes[i].textContent;
    }
    const tabNodes = rNode.getElementsByTagName("w:tab");
    if (tabNodes.length > 0) txt += " ";
    const brNodes = rNode.getElementsByTagName("w:br");
    if (brNodes.length > 0) txt += "\n";
    return txt;
  }

  /**
   * Trích xuất hình ảnh từ một XML node
   */
  extractImagesFromNode(node, relsMap, imageBase64Map) {
    const images = [];

    // Cách 1: w:drawing -> a:blip
    const blips = node.getElementsByTagName("a:blip");
    for (let i = 0; i < blips.length; i++) {
      const embedId = blips[i].getAttribute("r:embed");
      if (embedId && relsMap[embedId]) {
        images.push({
          src: relsMap[embedId],
          embedId
        });
      }
    }

    // Cách 2: v:imagedata -> r:id
    const imgDatas = node.getElementsByTagName("v:imagedata");
    for (let i = 0; i < imgDatas.length; i++) {
      const rId = imgDatas[i].getAttribute("r:id") || imgDatas[i].getAttribute("o:relid");
      if (rId && relsMap[rId]) {
        images.push({
          src: relsMap[rId],
          embedId: rId
        });
      }
    }

    return images;
  }

  /**
   * Phân tích bảng biểu (w:tbl)
   */
  parseTable(tblNode, relsMap, imageBase64Map) {
    const rows = [];
    let isGhostTable = false;
    let allTextCombined = "";
    const imagesInTable = [];

    const trNodes = tblNode.getElementsByTagName("w:tr");
    for (let r = 0; r < trNodes.length; r++) {
      const row = [];
      const tcNodes = trNodes[r].getElementsByTagName("w:tc");
      for (let c = 0; c < tcNodes.length; c++) {
        const tc = tcNodes[c];
        const pNodes = tc.getElementsByTagName("w:p");
        let cellText = "";
        const cellImages = [];

        for (let p = 0; p < pNodes.length; p++) {
          const pObj = this.parseParagraph(pNodes[p], relsMap, imageBase64Map);
          if (pObj) {
            if (pObj.text) {
              cellText += (cellText ? " " : "") + pObj.text;
              allTextCombined += " " + pObj.text;
            }
            if (pObj.images && pObj.images.length > 0) {
              cellImages.push(...pObj.images);
              imagesInTable.push(...pObj.images);
            }
          }
        }

        // Đọc colSpan (gridSpan)
        let colSpan = 1;
        const gridSpan = tc.getElementsByTagName("w:gridSpan")[0];
        if (gridSpan) {
          colSpan = parseInt(gridSpan.getAttribute("w:val") || "1", 10);
        }

        row.push({
          text: cellText.trim(),
          images: cellImages,
          colSpan
        });
      }
      if (row.length > 0) rows.push(row);
    }

    const cleanAllText = allTextCombined.trim().toLowerCase();

    // Nhận diện Ghost Table (Bảng trống chỉ chứa khoảng trắng hoặc chỉ dùng để căn chỉnh ảnh)
    if (!cleanAllText && imagesInTable.length === 0) {
      isGhostTable = true;
    }

    // Nhận diện Bảng Hành chính (Header: Quốc hiệu hoặc Footer: Chữ ký)
    const isAdministrativeTable = (
      cleanAllText.includes("cộng hòa xã hội") ||
      cleanAllText.includes("độc lập - tự do") ||
      cleanAllText.includes("bài viết đăng website") ||
      cleanAllText.includes("phòng công tác xã hội") ||
      cleanAllText.includes("ban giám đốc") ||
      cleanAllText.includes("trưởng phòng") ||
      cleanAllText.includes("nơi nhận:") ||
      cleanAllText.includes("kt. giám đốc") ||
      cleanAllText.includes("tác giả bài viết")
    );

    return {
      type: "table",
      rows,
      images: imagesInTable,
      isGhostTable,
      isAdministrativeTable,
      allTextCombined: cleanAllText
    };
  }

  /**
   * Bộ lọc nhận diện ranh giới thông minh (Heuristic Boundary Filter)
   */
  filterDocumentBoundaries(elements) {
    if (!elements || elements.length === 0) return [];

    let startIndex = 0;
    let endIndex = elements.length - 1;

    // 1. Tìm điểm bắt đầu nội dung chính (Bỏ header hành chính & tiêu đề in hoa)
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      // Bỏ qua bảng hành chính đầu trang
      if (el.type === "table" && el.isAdministrativeTable) {
        startIndex = i + 1;
        continue;
      }

      // Bỏ qua các đoạn thông tin văn phòng / header
      if (el.type === "paragraph") {
        const t = el.text.toLowerCase();
        const rawT = el.text;

        const isHeaderMeta = (
          t.includes("cộng hòa xã hội chủ nghĩa") ||
          t.includes("độc lập - tự do - hạnh phúc") ||
          t.startsWith("bài viết đăng") ||
          t.startsWith("chuyên mục:") ||
          t.startsWith("tên bài:") ||
          t.startsWith("số:") ||
          t.startsWith("kính gửi:") ||
          (rawT === rawT.toUpperCase() && rawT.length < 80 && !t.includes("thứ") && !t.includes("ngày") && !t.includes("trong những"))
        );

        if (isHeaderMeta && el.images.length === 0) {
          startIndex = i + 1;
          continue;
        } else {
          // Gặp đoạn văn nội dung đầu tiên
          startIndex = i;
          break;
        }
      }
    }

    // 2. Tìm điểm kết thúc nội dung chính (Bỏ chữ ký, nơi nhận, tác giả ở cuối)
    for (let i = elements.length - 1; i >= startIndex; i--) {
      const el = elements[i];

      if (el.type === "table" && el.isAdministrativeTable) {
        endIndex = i - 1;
        continue;
      }

      if (el.type === "paragraph") {
        const t = el.text.toLowerCase();
        const isFooterSignature = (
          t.includes("kt. giám đốc") ||
          t.includes("phó giám đốc") ||
          t.includes("trưởng phòng") ||
          t.includes("tác giả bài viết") ||
          t.includes("tác giả:") ||
          t.includes("nơi nhận:") ||
          (t.includes("bắc ninh, ngày") && i >= elements.length - 3) ||
          t.startsWith("người viết bài")
        );

        if (isFooterSignature && el.images.length === 0) {
          endIndex = i - 1;
          continue;
        } else {
          endIndex = i;
          break;
        }
      }
    }

    // 3. Trích xuất mảng đã lọc và loại bỏ ghost tables
    const validSlice = elements.slice(Math.max(0, startIndex), Math.max(0, endIndex + 1));
    return validSlice.filter(el => {
      if (el.type === "table" && el.isGhostTable) return false;
      return true;
    });
  }

  /**
   * Sinh mã HTML chuẩn cho Bài viết Phòng CTXH / Tin tức Bệnh viện
   */
  buildCtxhHtml(elements) {
    const htmlParts = [];
    const font = this.options.fontFamily;
    const size = this.options.baseFontSize;
    const color = this.options.textColor;
    const align = this.options.textAlign;

    // Gom tất cả ảnh trong tài liệu để ghép cặp ảnh 2 cột
    const allImages = [];
    elements.forEach(el => {
      if (el.images && el.images.length > 0) {
        allImages.push(...el.images);
      }
    });

    let pairCount = 0;
    let singleCount = 0;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      if (el.type === "paragraph") {
        // Nếu đoạn có text
        if (el.text) {
          const pStyle = `text-align: ${align}; margin-bottom: 10px;`;
          const spanStyle = `font-family: ${font}; color: ${color};`;
          
          let formattedText = this.escapeHtml(el.text);
          // Xử lý link nếu có
          if (el.runs) {
            let composed = "";
            el.runs.forEach(r => {
              const safe = this.escapeHtml(r.text);
              if (r.isLink && r.url) {
                composed += `<a href="${r.url}" target="_blank" style="color: #2563eb; text-decoration: underline;">${safe}</a>`;
              } else {
                composed += safe;
              }
            });
            if (composed) formattedText = composed;
          }

          if (el.isHeading && this.options.enableHeadings) {
            const hSize = el.headingLevel === 1 ? "18px" : (el.headingLevel === 2 ? "17px" : "16px");
            htmlParts.push(`<div style="${pStyle}"><span style="font-size: ${hSize};"><span style="${spanStyle} font-weight: bold;">${formattedText}</span></span></div>`);
          } else if (el.isListItem && this.options.enableLists) {
            const indentPx = (el.listLevel + 1) * 20;
            htmlParts.push(`<div style="text-align: ${align}; margin-bottom: 8px; padding-left: ${indentPx}px;"><span style="font-size: ${size};"><span style="${spanStyle}">• ${formattedText}</span></span></div>`);
          } else {
            htmlParts.push(`<div style="${pStyle}"><span style="font-size: ${size};"><span style="${spanStyle}">${formattedText}</span></span></div>`);
          }
        }

        // Xử lý ảnh trong đoạn (nếu có)
        if (el.images && el.images.length > 0) {
          const imgs = el.images;
          for (let imgIdx = 0; imgIdx < imgs.length; imgIdx += 2) {
            if (imgIdx + 1 < imgs.length) {
              pairCount++;
              htmlParts.push(this.renderImagePairTable(imgs[imgIdx].src, imgs[imgIdx + 1].src, pairCount));
            } else {
              singleCount++;
              htmlParts.push(this.renderSingleImage(imgs[imgIdx].src, `Ảnh bài viết ${singleCount}`));
            }
          }
        }
      } else if (el.type === "table") {
        if (!el.isGhostTable && !el.isAdministrativeTable) {
          htmlParts.push(this.renderCustomTable(el));
        }
      }
    }

    return htmlParts.join("\n\n");
  }

  /**
   * Sinh mã HTML cho Bài viết Đấu thầu / Mua sắm vật tư (Ảnh 850px)
   */
  buildThauHtml(elements) {
    const htmlParts = [];
    const font = this.options.fontFamily;
    const size = this.options.baseFontSize;
    const color = this.options.textColor;
    const align = this.options.textAlign;

    // Ảnh tiêu đề trên cùng (nếu có cấu hình)
    if (this.options.thauTopImageUrl) {
      htmlParts.push(this.renderSingleImage(this.options.thauTopImageUrl, this.options.thauTopImageCaption || "Thông báo đấu thầu", 850));
    }

    for (const el of elements) {
      if (el.type === "paragraph" && el.text) {
        const pStyle = `text-align: ${align}; margin-bottom: 12px;`;
        const spanStyle = `font-family: ${font}; color: ${color};`;
        const formattedText = this.escapeHtml(el.text);

        if (el.isHeading) {
          htmlParts.push(`<div style="${pStyle}"><span style="font-size: 17px;"><span style="${spanStyle} font-weight: bold;">${formattedText}</span></span></div>`);
        } else {
          htmlParts.push(`<div style="${pStyle}"><span style="font-size: ${size};"><span style="${spanStyle}">${formattedText}</span></span></div>`);
        }
      } else if (el.type === "table" && !el.isGhostTable && !el.isAdministrativeTable) {
        htmlParts.push(this.renderCustomTable(el));
      }
    }

    // Ảnh kết thúc bài dưới cùng (nếu có cấu hình)
    if (this.options.thauBottomImageUrl) {
      htmlParts.push(this.renderSingleImage(this.options.thauBottomImageUrl, this.options.thauBottomImageCaption || "Bảng tổng hợp chi tiết", 850));
    }

    return htmlParts.join("\n\n");
  }

  /**
   * Render Bảng cặp ảnh 2 cột (Cặp ảnh 1, 2, 3...)
   */
  renderImagePairTable(src1, src2, pairNum = 1) {
    const alt1 = `Ảnh hoạt động trao quà ${pairNum} - Hình 1`;
    const alt2 = `Ảnh hoạt động trao quà ${pairNum} - Hình 2`;

    return `<!-- Cặp ảnh ${pairNum} -->
<table style="width: 100%; border-collapse: collapse; border: none; margin-top: 15px; margin-bottom: 15px;">
\t<tbody>
\t\t<tr>
\t\t\t<td style="width: 50%; text-align: center; vertical-align: top; padding: 5px; border: none;"><img alt="${alt1}" src="${src1}" style="width: 100%; max-width: 420px; height: auto;" /></td>
\t\t\t<td style="width: 50%; text-align: center; vertical-align: top; padding: 5px; border: none;"><img alt="${alt2}" src="${src2}" style="width: 100%; max-width: 420px; height: auto;" /></td>
\t\t</tr>
\t</tbody>
</table>`;
  }

  /**
   * Render Ảnh đơn căn giữa chuẩn đẹp
   */
  renderSingleImage(src, alt = "Hình ảnh bài viết", maxWidth = 650) {
    return `<!-- Ảnh đơn -->
<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;"><img alt="${alt}" src="${src}" style="max-width: ${maxWidth}px; width: 100%; height: auto;" /></div>`;
  }

  /**
   * Render Bảng dữ liệu nghiệp vụ responsive
   */
  renderCustomTable(tableObj) {
    const rowsHtml = [];
    const font = this.options.fontFamily;
    const size = this.options.baseFontSize;

    tableObj.rows.forEach((row, rIdx) => {
      const cellsHtml = [];
      const isHeaderRow = (rIdx === 0);
      const bgStyle = isHeaderRow ? "background-color: #f1f5f9; font-weight: bold;" : (rIdx % 2 === 1 ? "background-color: #ffffff;" : "background-color: #f8fafc;");

      row.forEach(cell => {
        const tag = isHeaderRow ? "th" : "td";
        const spanCol = cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : "";
        const cellContent = this.escapeHtml(cell.text);

        cellsHtml.push(`\t\t\t<${tag}${spanCol} style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; vertical-align: middle; ${bgStyle}"><span style="font-family: ${font}; font-size: ${size}; color: #000000;">${cellContent}</span></${tag}>`);
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
   * Làm sạch sâu các thẻ rác MS Word và chuẩn hóa mã HTML
   */
  cleanGarbageTags(html) {
    if (!html) return "";

    let clean = html;
    // 1. Xóa các thuộc tính thừa của MS Office/Word
    clean = clean.replace(/\s*class="Mso[^"]*"/gi, "");
    clean = clean.replace(/\s*style="[^"]*mso-[^"]*"/gi, "");
    clean = clean.replace(/<o:p>[\s\S]*?<\/o:p>/gi, "");
    clean = clean.replace(/<!--[\s\S]*?-->/gi, (match) => {
      // Giữ lại comment cặp ảnh/ảnh đơn hữu ích
      if (match.includes("Cặp ảnh") || match.includes("Ảnh đơn")) return match;
      return "";
    });

    // 2. Xóa các span lồng nhau có cùng style
    clean = clean.replace(/<span[^>]*>\s*<\/span>/gi, "");

    // 3. Xóa các đoạn div hoàn toàn trống không có ảnh
    clean = clean.replace(/<div[^>]*>\s*<span[^>]*>\s*<\/span>\s*<\/div>/gi, "");

    // 4. Chuẩn hóa khoảng trống và dòng trống liên tiếp
    clean = clean.replace(/\n{3,}/g, "\n\n");

    return clean.trim();
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
   * Chuyển mã HTML sang Markdown sạch
   */
  convertToMarkdown(html) {
    if (!html) return "";
    let md = html;

    // Chuyển headings
    md = md.replace(/<div[^>]*><span[^>]*><span[^>]*font-weight:\s*bold;[^>]*>(.*?)<\/span><\/span><\/div>/gi, "\n### $1\n");
    // Chuyển paragraphs
    md = md.replace(/<div[^>]*><span[^>]*><span[^>]*>(.*?)<\/span><\/span><\/div>/gi, "\n$1\n");
    // Chuyển images
    md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/>/gi, "\n![$1]($2)\n");
    // Bỏ các thẻ HTML còn lại
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
    const readingTime = Math.max(1, Math.ceil(words / 200)); // 200 từ / phút

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
