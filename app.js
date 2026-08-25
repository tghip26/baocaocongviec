// ==========================================================
// CHƯƠNG TRÌNH BÁO CÁO CÔNG VIỆC & GIÁM ĐỊNH GỘP
// Mô phỏng 100% logic & luồng giao diện Tkinter Python
// Hỗ trợ xử lý an toàn Clean Values & Shared Formulas
// ==========================================================

const TEN_FILE_GIAM_DINH = "DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM.xlsx";
const TEN_FILE_CNTT = "TỔNG HỢP CÔNG VIỆC P.CNTT.xlsx";

const ALLOWED_USERS = new Set([
  "PHCN",
  "NGOẠI TH", "NGOAI TH",
  "XNTT",
  "NHH",
  "TTTM",
  "NGOẠI CT", "NGOAI CT",
  "DA LIỄU", "DA LIEU",
  "PTGMHS",
  "NỘI TH", "NOI TH",
  "PHỤ SẢN", "PHU SAN",
  "MẮT", "MAT",
  "TTBVSK",
  "DƯỢC", "DUOC",
  "THẬN", "THAN",
  "TRUYỀN NHIỄM", "TRUYEN NHIEM",
  "TCKT",
  "NGOẠI UB", "NGOAI UB",
  "NGOẠI XẠ TRỊ", "NGOAI XA TRI",
  "RHM",
  "KB",
  "CXK",
  "CSGN",
  "NGOẠI TN", "NGOAI TN",
  "HHLS",
  "TMH",
  "HSTC",
  "HTL",
  "NGOẠI TKLN", "NGOAI TKLN",
  "NHI",
  "ĐÔNG Y", "DONG Y",
  "CẤP CỨU", "CAP CUU",
  "LKTK"
]);

// Trích xuất giá trị thuần (tránh lỗi Shared Formula clone)
function getCleanCellValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") {
    if ("result" in val) {
      return val.result !== undefined ? val.result : null;
    }
    if ("text" in val) {
      return val.text;
    }
    if ("richText" in val && Array.isArray(val.richText)) {
      return val.richText.map(t => t.text).join("");
    }
    if ("hyperlink" in val && "text" in val) {
      return val.text;
    }
    if (val instanceof Date) {
      return val;
    }
  }
  return val;
}

// Chuẩn hóa text
function normalizeText(value) {
  const clean = getCleanCellValue(value);
  if (clean === null || clean === undefined) return "";
  let text = String(clean);
  text = text.replace(/[\r\n]+/g, " ");
  text = text.replace(/\s+/g, " ");
  return text.trim().toUpperCase();
}

// Copy style an toàn
function copyCellStyle(srcCell, targetCell) {
  if (!srcCell || !targetCell) return;
  try {
    if (srcCell.font) targetCell.font = JSON.parse(JSON.stringify(srcCell.font));
    if (srcCell.alignment) targetCell.alignment = JSON.parse(JSON.stringify(srcCell.alignment));
    if (srcCell.border) targetCell.border = JSON.parse(JSON.stringify(srcCell.border));
    if (srcCell.fill) targetCell.fill = JSON.parse(JSON.stringify(srcCell.fill));
    if (srcCell.numFmt) targetCell.numFmt = srcCell.numFmt;
  } catch (e) {
    // Ignore style clone errors
  }
}

function downloadBlob(buffer, filename) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getColLetter(colNumber) {
  let temp = colNumber;
  let letter = "";
  while (temp > 0) {
    let mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

// ==========================================================
// 1. THUẬT TOÁN XỬ LÝ BÁO CÁO CỔNG GIÁM ĐỊNH
// ==========================================================
async function processGiamDinh(arrayBuffer, startDay, endDay) {
  let sourceWb = null;
  let sourceSheet = null;

  try {
    sourceWb = new ExcelJS.Workbook();
    await sourceWb.xlsx.load(arrayBuffer);
    for (const sheet of sourceWb.worksheets) {
      const sName = sheet.name.trim().toLowerCase();
      if (sName === "người dùng" || sName === "nguoi dung" || sName.includes("người dùng") || sName.includes("nguoi dung")) {
        sourceSheet = sheet;
        break;
      }
    }
    if (!sourceSheet && sourceWb.worksheets.length > 0) {
      sourceSheet = sourceWb.worksheets[0];
    }
  } catch (e) {
    console.warn("ExcelJS load failed, trying SheetJS fallback...", e);
  }

  // Fallback qua SheetJS nếu ExcelJS không load được
  if (!sourceSheet && typeof XLSX !== "undefined") {
    const sjsWb = XLSX.read(arrayBuffer, { type: "array", cellStyles: true });
    let targetSheetName = sjsWb.SheetNames.find(n => {
      const l = n.trim().toLowerCase();
      return l === "người dùng" || l === "nguoi dung" || l.includes("người dùng") || l.includes("nguoi dung");
    }) || sjsWb.SheetNames[0];

    const sjsWs = sjsWb.Sheets[targetSheetName];
    sourceWb = new ExcelJS.Workbook();
    sourceSheet = sourceWb.addWorksheet("Người dùng");
    
    const rows = XLSX.utils.sheet_to_json(sjsWs, { header: 1, defval: "" });
    rows.forEach((r, rIdx) => {
      const row = sourceSheet.getRow(rIdx + 1);
      r.forEach((cVal, cIdx) => {
        row.getCell(cIdx + 1).value = cVal;
      });
    });
  }

  if (!sourceSheet) {
    throw new Error("Không thể đọc cấu trúc sheet 'Người dùng' trong file Excel.");
  }

  // 1. Tìm dòng header
  let headerRowIndex = null;
  const maxSearchRow = Math.min(sourceSheet.rowCount || 20, 20);

  for (let r = 1; r <= maxSearchRow; r++) {
    const row = sourceSheet.getRow(r);
    const cellValues = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cellValues.push(normalizeText(cell.value));
    });

    if (cellValues.some(v => v === "STT") && cellValues.some(v => v.includes("NGƯỜI DÙNG") || v.includes("NGUOI DUNG"))) {
      headerRowIndex = r;
      break;
    }
  }

  if (!headerRowIndex) {
    headerRowIndex = 4;
  }

  // 2. Tìm cột NGƯỜI DÙNG và các cột ngày (1..31)
  const headerRow = sourceSheet.getRow(headerRowIndex);
  let userCol = null;
  const dayColumns = {};

  const maxCol = Math.max(sourceSheet.columnCount || 35, 35);
  for (let c = 1; c <= maxCol; c++) {
    const val = getCleanCellValue(headerRow.getCell(c).value);
    const norm = normalizeText(val);

    if (norm.includes("NGƯỜI DÙNG") || norm.includes("NGUOI DUNG")) {
      userCol = c;
    }

    if (val !== null && val !== undefined) {
      const sVal = String(val).trim();
      const d = parseInt(sVal, 10);
      if (!isNaN(d) && d >= 1 && d <= 31) {
        dayColumns[d] = c;
      }
    }
  }

  if (!userCol) {
    userCol = 2;
  }

  // 3. Lấy các cột ngày theo chu kỳ đã chọn
  const selectedDays = [];
  for (let d = startDay; d <= endDay; d++) {
    selectedDays.push(d);
  }

  const sourceColumns = [1, userCol];
  selectedDays.forEach(d => {
    if (dayColumns[d]) {
      sourceColumns.push(dayColumns[d]);
    }
  });

  const resultLastCol = sourceColumns.length;
  const resultLastLetter = getColLetter(resultLastCol);

  // 4. Tạo workbook kết quả
  const resultWb = new ExcelJS.Workbook();
  const resultSheet = resultWb.addWorksheet("Người dùng");

  // Copy 5 dòng đầu (dùng getCleanCellValue để tránh lỗi Shared Formula)
  for (let r = 1; r <= 5; r++) {
    const srcRow = sourceSheet.getRow(r);
    const targetRow = resultSheet.getRow(r);

    sourceColumns.forEach((oldCol, newIndex) => {
      const newCol = newIndex + 1;
      const srcCell = srcRow.getCell(oldCol);
      const targetCell = targetRow.getCell(newCol);

      targetCell.value = getCleanCellValue(srcCell.value);
      copyCellStyle(srcCell, targetCell);
    });
  }

  // Gộp tiêu đề dòng 1 (A1 -> LastCol)
  const titleA1 = getCleanCellValue(sourceSheet.getCell("A1").value) || "DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM";
  for (let c = 2; c <= resultLastCol; c++) {
    resultSheet.getCell(1, c).value = null;
  }
  resultSheet.mergeCells(1, 1, 1, resultLastCol);
  const cellA1 = resultSheet.getCell(1, 1);
  cellA1.value = titleA1;
  cellA1.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
  cellA1.font = { name: "Arial", size: 16, bold: true };
  resultSheet.getRow(1).height = 32;

  // Gộp tiêu đề dòng 2 (A2 -> LastCol)
  const noteA2 = getCleanCellValue(sourceSheet.getCell("A2").value) || "";
  for (let c = 2; c <= resultLastCol; c++) {
    resultSheet.getCell(2, c).value = null;
  }
  resultSheet.mergeCells(2, 1, 2, resultLastCol);
  const cellA2 = resultSheet.getCell(2, 1);
  cellA2.value = noteA2;
  cellA2.alignment = { horizontal: "center", vertical: "middle", wrapText: false };

  // Gộp A4:A5 và B4:B5
  resultSheet.getCell(5, 1).value = null;
  resultSheet.mergeCells(4, 1, 5, 1);
  resultSheet.getCell(4, 1).alignment = { horizontal: "center", vertical: "middle" };

  resultSheet.getCell(5, 2).value = null;
  resultSheet.mergeCells(4, 2, 5, 2);
  resultSheet.getCell(4, 2).alignment = { horizontal: "center", vertical: "middle" };

  // 5. Lọc và đánh lại STT
  let outputRowIdx = 6;
  let stt = 1;
  const totalSrcRows = Math.max(sourceSheet.rowCount || 0, 100);

  for (let r = 6; r <= totalSrcRows; r++) {
    const srcRow = sourceSheet.getRow(r);
    const userVal = getCleanCellValue(srcRow.getCell(userCol).value);
    if (!userVal) continue;

    const normUser = normalizeText(userVal);
    let isAllowed = false;
    for (const allowed of ALLOWED_USERS) {
      if (normUser === allowed || normUser.includes(allowed) || allowed.includes(normUser)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) continue;

    const targetRow = resultSheet.getRow(outputRowIdx);
    sourceColumns.forEach((oldCol, newIndex) => {
      const newCol = newIndex + 1;
      const srcCell = srcRow.getCell(oldCol);
      const targetCell = targetRow.getCell(newCol);

      if (newCol === 1) {
        targetCell.value = stt;
      } else {
        targetCell.value = getCleanCellValue(srcCell.value);
      }

      copyCellStyle(srcCell, targetCell);
    });

    stt++;
    outputRowIdx++;
  }

  // Đặt độ rộng cột
  resultSheet.getColumn(1).width = 8;
  resultSheet.getColumn(2).width = 25;
  for (let c = 3; c <= resultLastCol; c++) {
    resultSheet.getColumn(c).width = 12;
  }

  resultSheet.views = [
    { state: "frozen", xSplit: 2, ySplit: 5 }
  ];

  resultSheet.autoFilter = `A4:${resultLastLetter}${outputRowIdx - 1}`;

  return await resultWb.xlsx.writeBuffer();
}

// ==========================================================
// 2. THUẬT TOÁN BÁO CÁO CÔNG VIỆC PHÒNG CNTT
// ==========================================================
async function processCntt(arrayBuffer, targetSheetName) {
  let sourceWb = new ExcelJS.Workbook();
  try {
    await sourceWb.xlsx.load(arrayBuffer);
  } catch (e) {
    if (typeof XLSX !== "undefined") {
      const sjsWb = XLSX.read(arrayBuffer, { type: "array" });
      const tName = targetSheetName || sjsWb.SheetNames[0];
      const sjsWs = sjsWb.Sheets[tName];
      sourceWb = new ExcelJS.Workbook();
      const wsNew = sourceWb.addWorksheet(tName);
      const rows = XLSX.utils.sheet_to_json(sjsWs, { header: 1, defval: "" });
      rows.forEach((r, rIdx) => {
        const row = wsNew.getRow(rIdx + 1);
        r.forEach((cVal, cIdx) => {
          row.getCell(cIdx + 1).value = cVal;
        });
      });
    } else {
      throw e;
    }
  }

  let ws = targetSheetName ? sourceWb.getWorksheet(targetSheetName) : null;
  if (!ws) {
    ws = sourceWb.worksheets[0];
  }

  const softwareColumns = [];
  for (let c = 5; c <= 25; c++) softwareColumns.push(c);

  const softwareHeaders = [];
  const headerRow105 = ws.getRow(105);
  softwareColumns.forEach(c => {
    const val = getCleanCellValue(headerRow105.getCell(c).value);
    softwareHeaders.push(val !== null && val !== undefined ? String(val).trim() : `Phần mềm ${c-4}`);
  });

  const departments = [];
  const maxRow = Math.max(ws.rowCount || 0, 250);

  for (let r = 106; r <= maxRow; r++) {
    const deptVal = getCleanCellValue(ws.getRow(r).getCell(4).value);
    if (!deptVal) continue;
    const sDept = String(deptVal).trim();
    if (sDept.toUpperCase() === "TỔNG CỘNG" || sDept.toUpperCase() === "TONG CONG") {
      break;
    }
    if (sDept && !departments.includes(sDept)) {
      departments.push(sDept);
    }
  }

  if (departments.length === 0) {
    for (let r = 1; r <= maxRow; r++) {
      const deptVal = getCleanCellValue(ws.getRow(r).getCell(4).value) || getCleanCellValue(ws.getRow(r).getCell(2).value);
      if (deptVal) {
        const sDept = String(deptVal).trim();
        if (sDept.toUpperCase().includes("KHOA") || sDept.toUpperCase().includes("PHÒNG") || sDept.toUpperCase().includes("TRUNG TÂM")) {
          if (!departments.includes(sDept)) departments.push(sDept);
        }
      }
    }
  }

  const data = {};
  departments.forEach(dept => {
    data[dept] = new Array(softwareColumns.length).fill(null);
  });

  for (let r = 106; r <= maxRow; r++) {
    const deptVal = getCleanCellValue(ws.getRow(r).getCell(4).value);
    if (!deptVal) continue;
    const sDept = String(deptVal).trim();
    if (sDept.toUpperCase() === "TỔNG CỘNG" || sDept.toUpperCase() === "TONG CONG") break;
    if (!data[sDept]) continue;

    softwareColumns.forEach((c, idx) => {
      const val = getCleanCellValue(ws.getRow(r).getCell(c).value);
      if (val !== null && val !== undefined && val !== "" && val !== 0) {
        data[sDept][idx] = val;
      }
    });
  }

  const otherErrors = {};
  departments.forEach(dept => {
    otherErrors[dept] = [];
  });

  for (let r = 7; r <= 105; r++) {
    const deptVal = getCleanCellValue(ws.getRow(r).getCell(2).value);
    const errorVal = getCleanCellValue(ws.getRow(r).getCell(35).value);

    if (!deptVal || !errorVal) continue;
    const sDept = String(deptVal).trim();
    const sError = String(errorVal).trim();

    if (otherErrors[sDept] && sError && sError !== "0") {
      if (!otherErrors[sDept].includes(sError)) {
        otherErrors[sDept].push(sError);
      }
    }
  }

  const validDepartments = departments.filter(dept => {
    const hasSoftware = data[dept].some(v => v !== null && v !== "" && v !== 0);
    const hasError = otherErrors[dept] && otherErrors[dept].length > 0;
    return hasSoftware || hasError;
  });

  const activeSoftwareIndexes = [];
  for (let i = 0; i < softwareColumns.length; i++) {
    const hasData = validDepartments.some(dept => data[dept][i] !== null && data[dept][i] !== "" && data[dept][i] !== 0);
    if (hasData) {
      activeSoftwareIndexes.push(i);
    }
  }

  const hasOtherErrorCol = validDepartments.some(dept => otherErrors[dept] && otherErrors[dept].length > 0);

  const headers = ["STT", "KHOA, PHÒNG, TRUNG TÂM"];
  activeSoftwareIndexes.forEach(i => headers.push(softwareHeaders[i] || `Cột ${i+1}`));
  if (hasOtherErrorCol) headers.push("SỬA LỖI KHÁC");

  const totalColumns = headers.length;

  const resultWb = new ExcelJS.Workbook();
  const outWs = resultWb.addWorksheet("BÁO CÁO TỔNG HỢP");

  // Dòng 1: Tiêu đề
  outWs.mergeCells(1, 1, 1, totalColumns);
  const titleCell = outWs.getCell(1, 1);
  titleCell.value = "TỔNG HỢP CÔNG VIỆC P.CNTT";
  titleCell.font = { name: "Arial", size: 16, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  outWs.getRow(1).height = 32;

  // Dòng 3: Header
  const headerRow = outWs.getRow(3);
  headerRow.height = 75;

  const thinBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder;
  });

  let curRow = 4;
  validDepartments.forEach((dept, dIdx) => {
    const row = outWs.getRow(curRow);
    let colIdx = 1;

    row.getCell(colIdx++).value = dIdx + 1;
    row.getCell(colIdx++).value = dept;

    activeSoftwareIndexes.forEach(swIdx => {
      const val = data[dept][swIdx];
      if (val !== null && val !== undefined && val !== "" && val !== 0) {
        row.getCell(colIdx).value = val;
      }
      colIdx++;
    });

    if (hasOtherErrorCol) {
      if (otherErrors[dept] && otherErrors[dept].length > 0) {
        row.getCell(colIdx).value = otherErrors[dept].join(", ");
      }
      colIdx++;
    }

    for (let c = 1; c <= totalColumns; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Arial", size: 10 };
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: (c === 2 || (hasOtherErrorCol && c === totalColumns)) ? "left" : "center",
        vertical: "top",
        wrapText: true
      };
    }
    curRow++;
  });

  // Dòng TỔNG CỘNG
  const totalRow = outWs.getRow(curRow);
  totalRow.getCell(2).value = "TỔNG CỘNG";

  let grandTotalErrors = 0;
  for (let c = 3; c <= totalColumns; c++) {
    const headerTitle = headers[c - 1];
    if (headerTitle === "SỬA LỖI KHÁC") continue;

    let sum = 0;
    let hasNumeric = false;

    for (let r = 4; r < curRow; r++) {
      const v = outWs.getRow(r).getCell(c).value;
      if (typeof v === "number") {
        sum += v;
        hasNumeric = true;
      } else if (v && !isNaN(Number(v))) {
        sum += Number(v);
        hasNumeric = true;
      }
    }

    if (hasNumeric && sum !== 0) {
      totalRow.getCell(c).value = sum;
      if (headerTitle !== "Đăng bài trên website") {
        grandTotalErrors += sum;
      }
    }
  }

  for (let c = 3; c <= totalColumns; c++) {
    const headerTitle = headers[c - 1];
    if (headerTitle === "Đăng bài trên website") {
      totalRow.getCell(c).value = null;
    }
  }

  if (hasOtherErrorCol && grandTotalErrors !== 0) {
    totalRow.getCell(totalColumns).value = grandTotalErrors;
  }

  for (let c = 1; c <= totalColumns; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { name: "Arial", size: 10, bold: true };
    cell.border = thinBorder;
    cell.alignment = {
      horizontal: (c === 2 || (hasOtherErrorCol && c === totalColumns)) ? "left" : "center",
      vertical: "top",
      wrapText: true
    };
  }

  outWs.getColumn(1).width = 7;
  outWs.getColumn(2).width = 28;
  for (let c = 3; c <= totalColumns; c++) {
    if (headers[c - 1] === "SỬA LỖI KHÁC") {
      outWs.getColumn(c).width = 55;
    } else {
      outWs.getColumn(c).width = 17;
    }
  }

  outWs.views = [
    { state: "frozen", xSplit: 2, ySplit: 3 }
  ];

  outWs.autoFilter = `A3:${getColLetter(totalColumns)}${curRow}`;

  return await resultWb.xlsx.writeBuffer();
}

// ==========================================================
// 3. UI CONTROLLER (MÔ PHỎNG NGUYÊN BẢN TKINTER)
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const statusLabel = document.getElementById("statusLabel");
  const fileInputGiamDinh = document.getElementById("fileInputGiamDinh");
  const fileInputCntt = document.getElementById("fileInputCntt");

  const modalDayRange = document.getElementById("modalDayRange");
  const modalSheetSelect = document.getElementById("modalSheetSelect");
  const modalInfoBox = document.getElementById("modalInfoBox");
  const modalErrorBox = document.getElementById("modalErrorBox");

  let currentGiamDinhBuffer = null;
  let currentCnttBuffer = null;

  function setStatus(text, type = "gray") {
    statusLabel.textContent = text;
    statusLabel.className = "status-label " + type;
  }

  function showInfoBox(title, fileName) {
    document.getElementById("infoBoxTitle").textContent = title;
    document.getElementById("infoBoxFileName").textContent = fileName;
    modalInfoBox.classList.remove("hidden");
  }

  function showErrorBox(title, message) {
    document.getElementById("errorBoxTitle").textContent = title;
    document.getElementById("errorBoxDetail").textContent = message;
    modalErrorBox.classList.remove("hidden");
  }

  document.getElementById("btnCloseDayModal").addEventListener("click", () => {
    modalDayRange.classList.add("hidden");
    setStatus("Sẵn sàng", "gray");
  });

  document.getElementById("btnCloseSheetModal").addEventListener("click", () => {
    modalSheetSelect.classList.add("hidden");
    setStatus("Sẵn sàng", "gray");
  });

  document.getElementById("btnCloseInfoBox").addEventListener("click", () => {
    modalInfoBox.classList.add("hidden");
  });
  document.getElementById("btnOkInfoBox").addEventListener("click", () => {
    modalInfoBox.classList.add("hidden");
  });

  document.getElementById("btnCloseErrorBox").addEventListener("click", () => {
    modalErrorBox.classList.add("hidden");
  });
  document.getElementById("btnOkErrorBox").addEventListener("click", () => {
    modalErrorBox.classList.add("hidden");
  });

  async function getArrayBufferFromFile(file) {
    if (file.arrayBuffer) {
      return await file.arrayBuffer();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  // ======================================================
  // CHỨC NĂNG 1: BÁO CÁO CỔNG GIÁM ĐỊNH
  // ======================================================
  async function handleGiamDinhFile(file) {
    try {
      currentGiamDinhBuffer = await getArrayBufferFromFile(file);

      const today = new Date().getDate();
      const defaultRange = today <= 14 ? "01-14" : "15-31";

      document.getElementById("dayModalInfo").innerHTML =
        `Ngày hiện tại: ${String(today).padStart(2, '0')}<br>Mặc định: ${defaultRange}`;

      if (defaultRange === "01-14") {
        document.getElementById("radioDay0114").checked = true;
      } else {
        document.getElementById("radioDay1531").checked = true;
      }

      modalDayRange.classList.remove("hidden");
    } catch (err) {
      setStatus("Có lỗi", "red");
      showErrorBox("LỖI", "Không thể đọc file: " + err.message);
    }
  }

  fileInputGiamDinh.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    handleGiamDinhFile(file);
    fileInputGiamDinh.value = "";
  });

  document.getElementById("btnConfirmDayRange").addEventListener("click", async () => {
    modalDayRange.classList.add("hidden");
    const selected = document.querySelector("input[name='dayRangeRadio']:checked").value;
    const [startDay, endDay] = selected === "01-14" ? [1, 14] : [15, 31];

    setStatus("Đang xử lý báo cáo cổng giám định...", "blue");

    setTimeout(async () => {
      try {
        const outBuffer = await processGiamDinh(currentGiamDinhBuffer, startDay, endDay);
        downloadBlob(outBuffer, TEN_FILE_GIAM_DINH);

        setStatus("Đã hoàn thành báo cáo cổng giám định", "green");
        showInfoBox("HOÀN THÀNH", TEN_FILE_GIAM_DINH);
      } catch (err) {
        setStatus("Có lỗi", "red");
        showErrorBox("LỖI", err.message);
      }
    }, 50);
  });

  // ======================================================
  // CHỨC NĂNG 2: BÁO CÁO CÔNG VIỆC P.CNTT
  // ======================================================
  async function handleCnttFile(file) {
    try {
      currentCnttBuffer = await getArrayBufferFromFile(file);

      let sheetNames = [];
      try {
        const tempWb = new ExcelJS.Workbook();
        await tempWb.xlsx.load(currentCnttBuffer);
        sheetNames = tempWb.worksheets.map(w => w.name);
      } catch (e) {
        if (typeof XLSX !== "undefined") {
          const sjsWb = XLSX.read(currentCnttBuffer, { type: "array" });
          sheetNames = sjsWb.SheetNames;
        }
      }

      if (sheetNames.length <= 1) {
        runCnttProcess(sheetNames[0] || "");
      } else {
        const select = document.getElementById("sheetDropdown");
        select.innerHTML = "";
        sheetNames.forEach(name => {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          select.appendChild(opt);
        });
        modalSheetSelect.classList.remove("hidden");
      }
    } catch (err) {
      setStatus("Có lỗi", "red");
      showErrorBox("LỖI", "Không thể đọc file Excel: " + err.message);
    }
  }

  fileInputCntt.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    handleCnttFile(file);
    fileInputCntt.value = "";
  });

  document.getElementById("btnConfirmSheet").addEventListener("click", () => {
    modalSheetSelect.classList.add("hidden");
    const selectedSheet = document.getElementById("sheetDropdown").value;
    runCnttProcess(selectedSheet);
  });

  async function runCnttProcess(sheetName) {
    setStatus("Đang xử lý báo cáo công việc P.CNTT...", "blue");

    setTimeout(async () => {
      try {
        const outBuffer = await processCntt(currentCnttBuffer, sheetName);
        downloadBlob(outBuffer, TEN_FILE_CNTT);

        setStatus("Đã hoàn thành báo cáo công việc P.CNTT", "green");
        showInfoBox("HOÀN THÀNH", TEN_FILE_CNTT);
      } catch (err) {
        setStatus("Có lỗi", "red");
        showErrorBox("LỖI", err.message);
      }
    }, 50);
  }

  // Hỗ trợ Kéo & thả file (Drag & Drop) vào cửa sổ
  const mainWindow = document.getElementById("mainWindow");
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => e.preventDefault());

  mainWindow.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  mainWindow.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const lName = file.name.toLowerCase();
      if (lName.includes("giam") || lName.includes("dinh") || lName.includes("cham") || lName.includes("cong")) {
        handleGiamDinhFile(file);
      } else {
        handleCnttFile(file);
      }
    }
  });
});
