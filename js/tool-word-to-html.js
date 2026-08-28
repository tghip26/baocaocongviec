/**
 * tool-word-to-html.js
 * Advanced Word (.docx) to Clean HTML Converter for CMS Website Publishing.
 * Cấu trúc chuẩn 100% theo mẫu tòa soạn Cổng Website:
 * 1. Chuyển đổi toàn bộ ảnh nhúng trong Word sang định dạng Base64 data URI tự động.
 * 2. Tự động lọc và loại bỏ:
 *    - Phần đầu: Bảng hành chính Quốc hiệu Tiêu ngữ, Tên bài viết, Chuyên mục, Mã số.
 *    - Phần cuối: Bảng chữ ký Ban Giám đốc, Trưởng phòng, Tác giả, Địa danh ngày tháng.
 *    - Các khoảng bảng trống (Ghost table) do Word tự sinh ra khi chèn ảnh hoặc định dạng.
 * 3. Không in đậm bất kỳ nội dung nào (tất cả đều là chữ thường font-weight: normal).
 * 4. Mọi đoạn văn bản đều căn thẳng sát đầu dòng, không thụt đầu dòng.
 * 5. Kích thước ảnh chuẩn: 650px cho bài CTXH, 850px cho bài Thầu.
 */

class WordToHtmlConverter {
  constructor(options = {}) {
    this.options = Object.assign({
      preset: "ctxh", // "ctxh" | "thau"
      fontFamily: "times new roman,times,serif",
      baseFontSize: "16px",
      textColor: "#000000",
      textAlign: "justify",

      // Image Controls
      useBase64Images: true, // Tự động nhúng ảnh Base64
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
      imageCount: 0
    };
  }

  setOptions(newOptions) {
    this.options = Object.assign(this.options, newOptions);
  }

  /**
   * Chuyển đổi tệp Word (.docx) sang đúng mẫu HTML chuẩn CMS
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
        
        let base64 = "";
        if (target) {
          const targetFname = target.split("/").pop();
          base64 = imageBase64Map[target] || imageBase64Map[targetFname] || imageBase64Map["media/" + targetFname] || "";
        }

        relsMap[id] = { target, type, base64 };
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

    // 4. Trích xuất toàn bộ các phần tử trong Body (Đoạn văn, Bảng biểu, Khối ảnh)
    const rawElements = [];
    const childNodes = bodyNode.childNodes;

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      const nodeName = node.nodeName.toLowerCase();

      if (nodeName === "w:p" || nodeName === "p") {
        const pItem = this.extractParagraphInfo(node, relsMap);
        if (pItem) {
          rawElements.push(pItem);
        }
      } else if (nodeName === "w:tbl" || nodeName === "tbl") {
        const tblResult = this.parseTable(node, relsMap);
        if (tblResult) {
          if (tblResult.type === "images") {
            // Nếu bảng chỉ dùng để xếp ảnh -> bung các ảnh ra độc lập
            for (const imgUrl of tblResult.images) {
              rawElements.push({
                type: "image",
                src: imgUrl,
                caption: "",
                plainText: ""
              });
            }
          } else if (tblResult.type === "table") {
            rawElements.push(tblResult);
            this.stats.tableCount++;
          } else if (tblResult.type === "admin_header_table" || tblResult.type === "admin_footer_table") {
            rawElements.push(tblResult);
          }
        }
      }
    }

    // 5. Áp dụng Bộ Lọc Thông Minh: Loại bỏ phần Đầu và phần Cuối
    const bodyElements = this.filterDocumentBoundaries(rawElements);

    // 6. Cập nhật thống kê từ ngữ trên phần nội dung đã lọc
    this.recalculateStats(bodyElements);

    // 7. Gom và định dạng theo đúng cấu trúc CMS
    let finalHtml = "";
    if (isThau) {
      finalHtml = this.buildThauHtml(bodyElements);
    } else {
      finalHtml = this.buildCtxhHtml(bodyElements);
    }

    return {
      html: finalHtml,
      stats: this.stats,
      images: extractedImageNames
    };
  }

  /**
   * Bộ lọc thông minh tự động xác định phạm vi bài viết chính
   * Loại bỏ Header (Quốc hiệu, Tên bài, Chuyên mục) và Footer (Chữ ký, Nơi nhận)
   */
  filterDocumentBoundaries(elements) {
    if (!elements || elements.length === 0) return [];

    let startIndex = 0;
    let endIndex = elements.length;

    // 1. Quét tìm vị trí Bắt Đầu nội dung bài viết
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      // Bỏ qua bảng hành chính đầu tài liệu
      if (el.type === "admin_header_table") {
        startIndex = i + 1;
        continue;
      }

      if (el.type === "paragraph") {
        const txt = (el.plainText || "").trim();

        // Bỏ qua đoạn văn rỗng
        if (!txt && !el.hasImage) {
          startIndex = i + 1;
          continue;
        }

        // Bỏ qua các nhãn hành chính / tiêu đề văn bản / chuyên mục
        if (/^(bài viết đăng website|chuyên mục đăng tin|\(chuyên mục|tên bài|tiêu đề bài viết|\d{5,}|[_\-=]{3,})/i.test(txt)) {
          startIndex = i + 1;
          continue;
        }

        // Bỏ qua tên bài viết in hoa ở đầu trang
        if (i < 8 && (txt === txt.toUpperCase() || txt.length < 180) &&
            /(bài viết|nhân ái|thăm, động viên|trao tặng|tên bài|bệnh viện đa khoa)/i.test(txt)) {
          startIndex = i + 1;
          continue;
        }

        // Khi gặp đoạn văn xuôi tự sự đầu tiên (bắt đầu viết hoa chữ đầu, theo sau là chữ thường)
        if (txt.length > 25 && !el.hasImage) {
          startIndex = i;
          break;
        }
      } else if (el.type === "image") {
        // Nếu bài viết bắt đầu bằng một ảnh thực sự sau tiêu đề
        if (i > 1) {
          startIndex = i;
          break;
        }
      }
    }

    // 2. Quét từ dưới lên để tìm vị trí Kết Thúc nội dung bài viết
    for (let i = elements.length - 1; i >= startIndex; i--) {
      const el = elements[i];

      // Bỏ qua bảng chữ ký Ban Giám đốc / Trưởng phòng
      if (el.type === "admin_footer_table") {
        endIndex = i;
        continue;
      }

      if (el.type === "paragraph") {
        const txt = (el.plainText || "").trim();

        // Bỏ qua các dòng chữ ký lẻ ở cuối bài
        if (/^(kt\.?\s*giám đốc|phó giám đốc|trưởng phòng|tác giả|người lập|nơi nhận|lưu:\s*vt)/i.test(txt)) {
          endIndex = i;
          continue;
        }

        if (txt.length > 0 || el.hasImage) {
          endIndex = i + 1;
          break;
        }
      } else if (el.type === "image" || el.type === "table") {
        endIndex = i + 1;
        break;
      }
    }

    const filtered = elements.slice(startIndex, endIndex);
    return filtered.length > 0 ? filtered : elements;
  }

  /**
   * Tính toán lại thống kê chuẩn xác trên phần nội dung bài viết
   */
  recalculateStats(elements) {
    let wordCount = 0;
    let charCount = 0;
    let paragraphCount = 0;
    let tableCount = 0;
    let imageCount = 0;

    for (const el of elements) {
      if (el.type === "paragraph") {
        if (el.plainText) {
          const words = el.plainText.split(/\s+/).filter(w => w.length > 0);
          wordCount += words.length;
          charCount += el.plainText.length;
          paragraphCount++;
        }
        if (el.images && el.images.length > 0) {
          imageCount += el.images.length;
        }
      } else if (el.type === "image") {
        imageCount++;
      } else if (el.type === "table") {
        tableCount++;
      }
    }

    this.stats = {
      wordCount,
      charCount,
      paragraphCount,
      tableCount,
      imageCount
    };
  }

  /**
   * Trích xuất thông tin một đoạn văn từ Word
   * Đảm bảo: Không in đậm (strip bold), sát đầu dòng (no indent)
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
    const images = [];
    const childNodes = pNode.childNodes;

    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:r" || cName === "r") {
        const rData = this.extractRunData(child, relsMap);
        if (rData.text || rData.images.length > 0) {
          runs.push(rData);
          if (rData.images.length > 0) {
            images.push(...rData.images);
          }
        }
      } else if (cName === "w:hyperlink" || cName === "hyperlink") {
        const rId = child.getAttribute("r:id") || child.getAttribute("id");
        const linkUrl = (rId && relsMap[rId]) ? relsMap[rId].target || "#" : "#";
        const linkRuns = child.childNodes;
        for (let j = 0; j < linkRuns.length; j++) {
          if (linkRuns[j].nodeName.toLowerCase() === "w:r" || linkRuns[j].nodeName.toLowerCase() === "r") {
            const rData = this.extractRunData(linkRuns[j], relsMap);
            if (rData.text) {
              rData.linkUrl = linkUrl;
              runs.push(rData);
            }
          }
        }
      } else if (cName === "w:drawing" || cName === "drawing") {
        const imgs = this.extractImagesFromDrawing(child, relsMap);
        images.push(...imgs);
      }
    }

    // Ghép chuỗi văn bản thuần và định dạng (Loại bỏ hoàn toàn In Đậm, Sát đầu dòng)
    let plainText = "";
    let formattedText = "";

    for (const r of runs) {
      if (r.text) {
        let piece = r.text;
        plainText += piece;

        // TUYỆT ĐỐI KHÔNG DÙNG <strong> HAY <b> (Tất cả đều chữ thường theo yêu cầu người dùng)
        if (r.isItalic) piece = `<em>${piece}</em>`;
        if (r.isUnderline) piece = `<u>${piece}</u>`;
        if (r.isStrike) piece = `<s>${piece}</s>`;
        if (r.isSub) piece = `<sub>${piece}</sub>`;
        if (r.isSup) piece = `<sup>${piece}</sup>`;
        if (r.linkUrl) piece = `<a href="${r.linkUrl}" target="_blank" rel="noopener noreferrer">${piece}</a>`;

        formattedText += piece;
      }
    }

    // Xóa khoảng trắng thừa / thụt lề ở đầu dòng (Sát đầu dòng 100%)
    plainText = plainText.replace(/^[\s\u00A0\t\r\n]+/, "").trim();
    formattedText = formattedText.replace(/^[\s\u00A0\t\r\n]+/, "").trim();

    if (!plainText && images.length === 0) {
      return null;
    }

    const isCaption = align === "center" ||
      (runs.length === 1 && runs[0].isItalic && plainText.length < 150) ||
      /^(\*?)(Ảnh|Hình|Ảnh \d|Hình \d|Sơ đồ|Bảng)[\s:]/i.test(plainText);

    const isSource = align === "right" ||
      /^(Nguồn|Theo|Ảnh|Tác giả|PV|CTV|Theo nguồn)[\s:]/i.test(plainText);

    return {
      type: "paragraph",
      plainText,
      formattedText,
      align,
      hasImage: images.length > 0,
      images,
      isCaption,
      isSource
    };
  }

  extractRunData(rNode, relsMap) {
    const rPr = this.findChild(rNode, ["w:rPr", "rPr"]);
    let isItalic = false;
    let isUnderline = false;
    let isStrike = false;
    let isSub = false;
    let isSup = false;

    if (rPr) {
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
    const images = [];

    const childNodes = rNode.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const cName = child.nodeName.toLowerCase();

      if (cName === "w:t" || cName === "t") {
        text += this.escapeHtml(child.textContent);
      } else if (cName === "w:br" || cName === "br") {
        text += "<br />";
      } else if (cName === "w:tab" || cName === "tab") {
        text += " "; // Thay vì &emsp; thì dùng 1 dấu cách để sát đầu dòng
      } else if (cName === "w:drawing" || cName === "drawing") {
        const imgs = this.extractImagesFromDrawing(child, relsMap);
        images.push(...imgs);
      }
    }

    return {
      text,
      images,
      isBold: false, // Ép chữ thường 100%
      isItalic,
      isUnderline,
      isStrike,
      isSub,
      isSup,
      linkUrl: null
    };
  }

  extractImagesFromDrawing(drawingNode, relsMap) {
    const images = [];
    const blips = drawingNode.getElementsByTagName("a:blip").length > 0
      ? drawingNode.getElementsByTagName("a:blip")
      : drawingNode.getElementsByTagName("blip");

    for (let b = 0; b < blips.length; b++) {
      const blip = blips[b];
      const rId = blip.getAttribute("r:embed") || blip.getAttribute("embed") ||
                  blip.getAttribute("r:link") || blip.getAttribute("link");
      if (rId && relsMap[rId] && relsMap[rId].base64) {
        images.push(relsMap[rId].base64);
      }
    }

    return images;
  }

  /**
   * Xây dựng HTML chuẩn bài CTXH theo đúng định dạng CMS của Bệnh viện
   */
  buildCtxhHtml(elements) {
    const outputBlocks = [];
    let pairCounter = 1;
    let lastContext = "";

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      // 1. Xử lý Bảng dữ liệu thực tế (nếu có)
      if (el.type === "table") {
        outputBlocks.push(el.html);
        continue;
      }

      // 2. Xử lý Khối Ảnh (Đơn hoặc Cặp ảnh)
      let imagesToRender = [];
      let captionText = "";

      if (el.type === "image") {
        imagesToRender.push(el.src);
      } else if (el.hasImage && el.images && el.images.length > 0) {
        imagesToRender.push(...el.images);

        // Kiểm tra xem đoạn ngay sau có phải chú thích ảnh không
        if (i + 1 < elements.length && elements[i + 1].type === "paragraph" && elements[i + 1].isCaption) {
          captionText = elements[i + 1].plainText;
          i++;
        }
      }

      if (imagesToRender.length > 0) {
        // Tự động sinh thẻ alt thông minh từ ngữ cảnh đoạn văn liền trước
        const altDesc = captionText || this.generateAltText(lastContext);

        if (imagesToRender.length >= 2) {
          // Xuất bản Cặp ảnh 2 cột (Table không viền)
          const comment = `<!-- Cặp ảnh ${pairCounter} -->`;
          const tableHtml = `${comment}\n\n<table style="width: 100%; border-collapse: collapse; border: none; margin-top: 15px; margin-bottom: 15px;">\n\t<tbody>\n\t\t<tr>\n\t\t\t<td style="width: 50%; text-align: center; vertical-align: top; padding: 5px; border: none;"><img alt="${this.escapeHtml(altDesc)}" src="${imagesToRender[0]}" style="width: 100%; max-width: 420px; height: auto;" /></td>\n\t\t\t<td style="width: 50%; text-align: center; vertical-align: top; padding: 5px; border: none;"><img alt="${this.escapeHtml(altDesc)}" src="${imagesToRender[1]}" style="width: 100%; max-width: 420px; height: auto;" /></td>\n\t\t</tr>\n\t</tbody>\n</table>`;
          outputBlocks.push(tableHtml);
          pairCounter++;

          // Nếu còn ảnh thứ 3, 4 trong cùng khối
          for (let k = 2; k < imagesToRender.length; k++) {
            const singleHtml = `<!-- Ảnh đơn -->\n\n<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;"><img alt="${this.escapeHtml(altDesc)}" src="${imagesToRender[k]}" style="max-width: 420px; width: 100%; height: auto;" /></div>`;
            outputBlocks.push(singleHtml);
          }
        } else {
          // Xuất bản Ảnh đơn căn giữa
          const singleHtml = `<!-- Ảnh đơn -->\n\n<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;"><img alt="${this.escapeHtml(altDesc)}" src="${imagesToRender[0]}" style="max-width: 420px; width: 100%; height: auto;" /></div>`;
          outputBlocks.push(singleHtml);
        }
        continue;
      }

      // 3. Xử lý Dòng Nguồn / Tác giả ở cuối bài
      if (el.isSource && i >= elements.length - 2) {
        outputBlocks.push(
          `<div style="text-align: right; margin-bottom: 10px;"><span style="font-size: 16px;"><span style="font-family: times new roman, times, serif; color: #000000;">${el.formattedText}</span></span></div>`
        );
        continue;
      }

      // 4. Đoạn văn bản bình thường (Đúng mẫu 100%)
      const txt = (el.formattedText || "").trim();
      if (txt) {
        lastContext = el.plainText || txt;
        const blockHtml = `<div style="text-align: justify; margin-bottom: 10px;"><span style="font-size: 16px;"><span style="font-family: times new roman, times, serif; color: #000000;">${txt}</span></span></div>`;
        outputBlocks.push(blockHtml);
      }
    }

    return outputBlocks.join("\n\n");
  }

  /**
   * Tự động trích xuất chuỗi mô tả alt ngắn gọn từ câu văn liền trước
   */
  generateAltText(contextText) {
    if (!contextText) return "Ảnh hoạt động bài viết";
    
    // Tìm các cụm từ ý nghĩa trong câu
    const clean = contextText.replace(/^[\w\s,]+:\s*/i, "").trim();
    if (clean.length > 0 && clean.length <= 80) {
      return clean;
    }
    
    // Cắt ngắn nếu quá dài
    const firstSentence = clean.split(/[.;]/)[0].trim();
    return firstSentence.length > 70 ? firstSentence.substring(0, 67) + "..." : firstSentence;
  }

  /**
   * Xây dựng HTML chuẩn bài Thầu (Kích thước ảnh 850px)
   */
  buildThauHtml(elements) {
    const outputBlocks = [];

    // 1. Khối Ảnh Trên (Đầu bài thầu - Chiều rộng 850px)
    const topUrl = this.options.thauTopImageUrl.trim();
    const topCaption = this.options.thauTopImageCaption.trim();

    if (topUrl) {
      let topBlock = `<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;"><img alt="${this.escapeHtml(topCaption || 'Thông báo mời thầu')}" src="${topUrl}" style="width: 100%; max-width: 850px; height: auto;" /></div>`;
      outputBlocks.push(topBlock);
    }

    // 2. Gom toàn bộ nội dung văn bản từ Word
    for (const el of elements) {
      if (el.type === "paragraph") {
        const txt = (el.formattedText || "").trim();
        if (txt) {
          outputBlocks.push(
            `<div style="text-align: justify; margin-bottom: 10px;"><span style="font-size: 16px;"><span style="font-family: times new roman, times, serif; color: #000000;">${txt}</span></span></div>`
          );
        }
      } else if (el.type === "image") {
        outputBlocks.push(
          `<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;"><img alt="Thông báo thầu" src="${el.src}" style="width: 100%; max-width: 850px; height: auto;" /></div>`
        );
      } else if (el.type === "table") {
        outputBlocks.push(el.html);
      }
    }

    // 3. Khối Ảnh Dưới (Cuối bài thầu - Chiều rộng 850px)
    const btmUrl = this.options.thauBottomImageUrl.trim();
    const btmCaption = this.options.thauBottomImageCaption.trim();

    if (btmUrl) {
      let btmBlock = `<div style="text-align: center; margin-top: 15px; margin-bottom: 15px;"><img alt="${this.escapeHtml(btmCaption || 'Thông báo mời thầu')}" src="${btmUrl}" style="width: 100%; max-width: 850px; height: auto;" /></div>`;
      outputBlocks.push(btmBlock);
    }

    return outputBlocks.join("\n\n");
  }

  /**
   * Xử lý bảng biểu trong Word
   * Loại bỏ bảng rỗng, nhận diện bảng ảnh (không sinh table thừa) và phân loại Header/Footer
   */
  parseTable(tblNode, relsMap) {
    const textContent = (tblNode.textContent || "").trim();
    const blips = tblNode.getElementsByTagName("a:blip").length > 0
      ? tblNode.getElementsByTagName("a:blip")
      : tblNode.getElementsByTagName("blip");

    // 1. Thu thập tất cả ảnh nằm trong bảng
    const tableImages = [];
    for (let b = 0; b < blips.length; b++) {
      const blip = blips[b];
      const rId = blip.getAttribute("r:embed") || blip.getAttribute("embed") ||
                  blip.getAttribute("r:link") || blip.getAttribute("link");
      if (rId && relsMap[rId] && relsMap[rId].base64) {
        tableImages.push(relsMap[rId].base64);
      }
    }

    // 2. Nếu bảng dùng để chèn ảnh (có ảnh và ít/không có chữ) -> Trả về đối tượng ảnh độc lập
    if (tableImages.length > 0 && textContent.length < 30) {
      return {
        type: "images",
        images: tableImages
      };
    }

    // 3. Nhận diện bảng hành chính Quốc hiệu Tiêu ngữ ở đầu trang
    if (/(bệnh viện|phòng công tác|cộng hòa xã hội|độc lập|sở y tế)/i.test(textContent)) {
      return {
        type: "admin_header_table",
        rawText: textContent
      };
    }

    // 4. Nhận diện bảng chữ ký Ban Giám đốc ở cuối trang
    if (/(giám đốc|phó giám đốc|tp\s*ctxh|trưởng phòng|tác giả|bắc ninh,\s*ngày)/i.test(textContent)) {
      return {
        type: "admin_footer_table",
        rawText: textContent
      };
    }

    // 5. Nếu bảng hoàn toàn rỗng và không có ảnh -> BỎ QUA HOÀN TOÀN
    if (!textContent && tableImages.length === 0) {
      return null;
    }

    // 6. Xử lý Bảng dữ liệu thực sự (Data Table)
    const trNodes = tblNode.getElementsByTagName("w:tr").length > 0
      ? tblNode.getElementsByTagName("w:tr")
      : tblNode.getElementsByTagName("tr");

    if (trNodes.length === 0) return null;

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
          ? `background-color: #f1f5f9; padding: 6px 10px; text-align: center; border: 1px solid #cbd5e1;`
          : `padding: 6px 10px; vertical-align: top; border: 1px solid #cbd5e1;`;

        cellsHtml.push(`    <${cellTag}${spanAttr} style="${cellStyle}"><span style="font-family:${this.options.fontFamily};"><span style="font-size:${this.options.baseFontSize};">${cellInner}</span></span></${cellTag}>`);
      }

      rowsHtml.push(`  <tr>\n${cellsHtml.join("\n")}\n  </tr>`);
    }

    const tableHtml = `<div style="overflow-x: auto; margin: 18px 0px;"><table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">\n${rowsHtml.join("\n")}\n</table></div>`;

    return {
      type: "table",
      html: tableHtml
    };
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
