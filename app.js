// ==========================================================
// CHƯƠNG TRÌNH BÁO CÁO CÔNG VIỆC & GIÁM ĐỊNH GỘP
// Mô phỏng 100% logic & luồng giao diện Tkinter Python
// Sử dụng SheetJS làm bộ đọc siêu tốc & ExcelJS làm bộ xuất định dạng
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

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  text = text.replace(/[\r\n]+/g, " ");
  text = text.replace(/\s+/g, " ");
  return text.trim().toUpperCase();
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
// 1. THUẬT TOÁN XỬ LÝ BÁO CÁO CỔNG GIÁM ĐỊNH (SheetJS -> ExcelJS)
// ==========================================================
async function processGiamDinh(arrayBuffer, startDay, endDay) {
  // 1. Đọc file bằng SheetJS (miễn nhiễm hoàn toàn với lỗi shared formulas & XML hỏng)
  const sjsWb = XLSX.read(arrayBuffer, { type: "array", cellDates: true, cellFormula: false });
  
  let targetSheetName = sjsWb.SheetNames.find(n => {
    const l = n.trim().toLowerCase();
    return l === "người dùng" || l === "nguoi dung" || l.includes("người dùng") || l.includes("nguoi dung");
  }) || sjsWb.SheetNames[0];

  const sjsWs = sjsWb.Sheets[targetSheetName];
  if (!sjsWs) {
    throw new Error("Không tìm thấy sheet 'Người dùng' trong file.");
  }

  // Chuyển sheet thành mảng 2D (0-indexed)
  const data2D = XLSX.utils.sheet_to_json(sjsWs, { header: 1, defval: "" });

  // 2. Tìm dòng header (chứa STT và NGƯỜI DÙNG) trong 20 dòng đầu
  let headerRow0 = -1;
  const maxSearch = Math.min(data2D.length, 20);

  for (let r = 0; r < maxSearch; r++) {
    const row = data2D[r] || [];
    const cellVals = row.map(v => normalizeText(v));

    if (cellVals.some(v => v === "STT") && cellVals.some(v => v.includes("NGƯỜI DÙNG") || v.includes("NGUOI DUNG"))) {
      headerRow0 = r;
      break;
    }
  }

  if (headerRow0 === -1) {
    headerRow0 = 3; // Dòng 4 (0-indexed = 3)
  }

  // 3. Tìm cột NGƯỜI DÙNG và các cột ngày (1..31)
  const headerRowVals = data2D[headerRow0] || [];
  let userCol0 = -1;
  const dayColumns0 = {};

  for (let c = 0; c < headerRowVals.length; c++) {
    const val = headerRowVals[c];
    const norm = normalizeText(val);

    if (norm.includes("NGƯỜI DÙNG") || norm.includes("NGUOI DUNG")) {
      userCol0 = c;
    }

    if (val !== null && val !== undefined && val !== "") {
      const sVal = String(val).trim();
      const d = parseInt(sVal, 10);
      if (!isNaN(d) && d >= 1 && d <= 31) {
        dayColumns0[d] = c;
      }
    }
  }

  if (userCol0 === -1) {
    userCol0 = 1; // Cột B (0-indexed = 1)
  }

  // 4. Lấy các ngày theo chu kỳ đã chọn
  const selectedDays = [];
  for (let d = startDay; d <= endDay; d++) {
    selectedDays.push(d);
  }

  const sourceCols0 = [0, userCol0];
  selectedDays.forEach(d => {
    if (dayColumns0[d] !== undefined) {
      sourceCols0.push(dayColumns0[d]);
    }
  });

  const resultLastCol = sourceCols0.length;
  const resultLastLetter = getColLetter(resultLastCol);

  // 5. Tạo file kết quả bằng ExcelJS
  const resultWb = new ExcelJS.Workbook();
  const resultSheet = resultWb.addWorksheet("Người dùng");

  const thinBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };

  // Copy các dòng 1-5 (0-indexed 0..4)
  for (let r0 = 0; r0 < 5; r0++) {
    const srcRow = data2D[r0] || [];
    const targetRow = resultSheet.getRow(r0 + 1);

    sourceCols0.forEach((oldCol0, newIdx) => {
      const newCol = newIdx + 1;
      const val = srcRow[oldCol0];
      const targetCell = targetRow.getCell(newCol);

      targetCell.value = (val !== undefined && val !== null) ? val : "";
      targetCell.font = { name: "Arial", size: 10 };
      targetCell.border = thinBorder;
      targetCell.alignment = { horizontal: "center", vertical: "middle" };
    });
  }

  // Gộp tiêu đề dòng 1 (A1 -> LastCol)
  const titleA1 = (data2D[0] && data2D[0][0]) ? data2D[0][0] : "DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM";
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
  const noteA2 = (data2D[1] && data2D[1][0]) ? data2D[1][0] : "";
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
  resultSheet.getCell(4, 1).font = { name: "Arial", size: 10, bold: true };

  resultSheet.getCell(5, 2).value = null;
  resultSheet.mergeCells(4, 2, 5, 2);
  resultSheet.getCell(4, 2).alignment = { horizontal: "center", vertical: "middle" };
  resultSheet.getCell(4, 2).font = { name: "Arial", size: 10, bold: true };

  // 6. Lọc và đánh lại STT từ dòng 6 (0-indexed 5) trở đi
  let outputRowIdx = 6;
  let stt = 1;

  for (let r0 = 5; r0 < data2D.length; r0++) {
    const srcRow = data2D[r0] || [];
    const userVal = srcRow[userCol0];
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
    sourceCols0.forEach((oldCol0, newIdx) => {
      const newCol = newIdx + 1;
      const targetCell = targetRow.getCell(newCol);

      if (newCol === 1) {
        targetCell.value = stt;
      } else {
        const v = srcRow[oldCol0];
        targetCell.value = (v !== undefined && v !== null) ? v : "";
      }

      targetCell.font = { name: "Arial", size: 10 };
      targetCell.border = thinBorder;
      targetCell.alignment = {
        horizontal: newCol === 2 ? "left" : "center",
        vertical: "middle"
      };
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
// 2. THUẬT TOÁN BÁO CÁO CÔNG VIỆC PHÒNG CNTT (SheetJS -> ExcelJS)
// ==========================================================
async function processCntt(arrayBuffer, targetSheetName) {
  const sjsWb = XLSX.read(arrayBuffer, { type: "array", cellDates: true, cellFormula: false });

  const chosenSheetName = targetSheetName || sjsWb.SheetNames[0];
  const sjsWs = sjsWb.Sheets[chosenSheetName];
  if (!sjsWs) {
    throw new Error(`Không tìm thấy sheet '${chosenSheetName}' trong file.`);
  }

  const data2D = XLSX.utils.sheet_to_json(sjsWs, { header: 1, defval: "" });

  // Cột phần mềm: Cột 5 đến 25 (0-indexed 4..24)
  const softwareCols0 = [];
  for (let c = 4; c <= 24; c++) softwareCols0.push(c);

  // Dòng 105 (0-indexed 104): Header tên phần mềm
  const softwareHeaders = [];
  const headerRow105 = data2D[104] || [];
  softwareCols0.forEach(c => {
    const val = headerRow105[c];
    softwareHeaders.push(val !== null && val !== undefined && String(val).trim() !== "" ? String(val).trim() : `Phần mềm ${c-3}`);
  });

  // Danh sách khoa từ dòng 106 (0-indexed 105) trở đi (Cột 4 = D / 0-indexed 3)
  const departments = [];
  for (let r0 = 105; r0 < data2D.length; r0++) {
    const row = data2D[r0] || [];
    const deptVal = row[3];
    if (!deptVal) continue;
    const sDept = String(deptVal).trim();
    if (sDept.toUpperCase() === "TỔNG CỘNG" || sDept.toUpperCase() === "TONG CONG") {
      break;
    }
    if (sDept && !departments.includes(sDept)) {
      departments.push(sDept);
    }
  }

  // Quét dự phòng nếu file không bắt đầu từ dòng 106
  if (departments.length === 0) {
    for (let r0 = 0; r0 < data2D.length; r0++) {
      const row = data2D[r0] || [];
      const deptVal = row[3] || row[1];
      if (deptVal) {
        const sDept = String(deptVal).trim();
        if (sDept.toUpperCase().includes("KHOA") || sDept.toUpperCase().includes("PHÒNG") || sDept.toUpperCase().includes("TRUNG TÂM")) {
          if (!departments.includes(sDept)) departments.push(sDept);
        }
      }
    }
  }

  // Đọc dữ liệu phần mềm
  const data = {};
  departments.forEach(dept => {
    data[dept] = new Array(softwareCols0.length).fill(null);
  });

  for (let r0 = 105; r0 < data2D.length; r0++) {
    const row = data2D[r0] || [];
    const deptVal = row[3];
    if (!deptVal) continue;
    const sDept = String(deptVal).trim();
    if (sDept.toUpperCase() === "TỔNG CỘNG" || sDept.toUpperCase() === "TONG CONG") break;
    if (!data[sDept]) continue;

    softwareCols0.forEach((c, idx) => {
      const val = row[c];
      if (val !== null && val !== undefined && val !== "" && val !== 0 && val !== "0") {
        data[sDept][idx] = val;
      }
    });
  }

  // Đọc dữ liệu SỬA LỖI KHÁC: Hàng 7 -> 105 (0-indexed 6..104, Cột 2 = Khoa / index 1, Cột 35 = AI / index 34)
  const otherErrors = {};
  departments.forEach(dept => {
    otherErrors[dept] = [];
  });

  for (let r0 = 6; r0 <= 104; r0++) {
    const row = data2D[r0] || [];
    const deptVal = row[1]; // Cột B
    const errorVal = row[34]; // Cột AI

    if (!deptVal || !errorVal) continue;
    const sDept = String(deptVal).trim();
    const sError = String(errorVal).trim();

    if (otherErrors[sDept] && sError && sError !== "0") {
      if (!otherErrors[sDept].includes(sError)) {
        otherErrors[sDept].push(sError);
      }
    }
  }

  // Lọc các khoa có dữ liệu
  const validDepartments = departments.filter(dept => {
    const hasSoftware = data[dept].some(v => v !== null && v !== "" && v !== 0 && v !== "0");
    const hasError = otherErrors[dept] && otherErrors[dept].length > 0;
    return hasSoftware || hasError;
  });

  const activeSoftwareIndexes = [];
  for (let i = 0; i < softwareCols0.length; i++) {
    const hasData = validDepartments.some(dept => data[dept][i] !== null && data[dept][i] !== "" && data[dept][i] !== 0 && data[dept][i] !== "0");
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
      if (val !== null && val !== undefined && val !== "" && val !== 0 && val !== "0") {
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

      // Đọc danh sách sheet bằng SheetJS siêu nhanh
      const sjsWb = XLSX.read(currentCnttBuffer, { type: "array" });
      const sheetNames = sjsWb.SheetNames || [];

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
