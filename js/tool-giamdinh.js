/**
 * tool-giamdinh.js
 * Logic xử lý Báo cáo Giám định Bảo hiểm & Báo cáo Công việc P.CNTT
 * Chạy 100% Client-side bằng SheetJS & ExcelJS
 * Tối ưu hóa định dạng, căn chỉnh độ rộng cột tự động, lọc danh mục chuẩn
 */

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

function normalizeTextGiamDinh(value) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  text = text.replace(/[\r\n]+/g, " ");
  text = text.replace(/\s+/g, " ");
  return text.trim().toUpperCase();
}

function getColLetterGiamDinh(colNumber) {
  let temp = colNumber;
  let letter = "";
  while (temp > 0) {
    let mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

/**
 * Lấy danh sách tên sheet trong file Excel
 */
function getExcelSheetNames(arrayBuffer) {
  const sjsWb = XLSX.read(arrayBuffer, { type: "array", bookSheets: true });
  return sjsWb.SheetNames || [];
}

/**
 * Xử lý Báo cáo Cổng Giám Định Bảo Hiểm
 */
async function processGiamDinh(arrayBuffer, startDay, endDay) {
  const sjsWb = XLSX.read(arrayBuffer, { type: "array", cellDates: true, cellFormula: false });
  
  let targetSheetName = sjsWb.SheetNames.find(n => {
    const l = n.trim().toLowerCase();
    return l === "người dùng" || l === "nguoi dung" || l.includes("người dùng") || l.includes("nguoi dung");
  }) || sjsWb.SheetNames[0];

  const sjsWs = sjsWb.Sheets[targetSheetName];
  if (!sjsWs) {
    throw new Error("Không tìm thấy sheet 'Người dùng' trong file.");
  }

  const data2D = XLSX.utils.sheet_to_json(sjsWs, { header: 1, defval: "" });

  let headerRow0 = -1;
  const maxSearch = Math.min(data2D.length, 30);

  for (let r = 0; r < maxSearch; r++) {
    const row = data2D[r] || [];
    const cellVals = row.map(v => normalizeTextGiamDinh(v));

    if (cellVals.some(v => v === "STT") && cellVals.some(v => v.includes("NGƯỜI DÙNG") || v.includes("NGUOI DUNG"))) {
      headerRow0 = r;
      break;
    }
  }

  if (headerRow0 === -1) {
    headerRow0 = 3;
  }

  const headerRowVals = data2D[headerRow0] || [];
  let userCol0 = -1;
  const dayColumns0 = {};

  for (let c = 0; c < headerRowVals.length; c++) {
    const val = headerRowVals[c];
    const norm = normalizeTextGiamDinh(val);

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
    userCol0 = 1;
  }

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
  const resultLastLetter = getColLetterGiamDinh(resultLastCol);

  const resultWb = new ExcelJS.Workbook();
  const resultSheet = resultWb.addWorksheet("Người dùng");

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFD0D5DD" } },
    left: { style: "thin", color: { argb: "FFD0D5DD" } },
    bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
    right: { style: "thin", color: { argb: "FFD0D5DD" } }
  };

  // Copy dòng 1-5
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

  // Merge A1 -> LastCol (Tiêu đề chính)
  const titleA1 = (data2D[0] && data2D[0][0]) ? data2D[0][0] : "DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM";
  for (let c = 2; c <= resultLastCol; c++) {
    resultSheet.getCell(1, c).value = null;
  }
  resultSheet.mergeCells(1, 1, 1, resultLastCol);
  const cellA1 = resultSheet.getCell(1, 1);
  cellA1.value = titleA1;
  cellA1.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
  cellA1.font = { name: "Arial", size: 15, bold: true, color: { argb: "FF1E3A8A" } };
  resultSheet.getRow(1).height = 32;

  // Merge A2 -> LastCol (Ghi chú ngày tháng)
  const noteA2 = (data2D[1] && data2D[1][0]) ? data2D[1][0] : `Chu kỳ: Ngày ${startDay} đến ngày ${endDay}`;
  for (let c = 2; c <= resultLastCol; c++) {
    resultSheet.getCell(2, c).value = null;
  }
  resultSheet.mergeCells(2, 1, 2, resultLastCol);
  const cellA2 = resultSheet.getCell(2, 1);
  cellA2.value = noteA2;
  cellA2.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
  cellA2.font = { name: "Arial", size: 10, italic: true };
  resultSheet.getRow(2).height = 20;

  // Merge A4:A5 và B4:B5
  resultSheet.getCell(5, 1).value = null;
  resultSheet.mergeCells(4, 1, 5, 1);
  resultSheet.getCell(4, 1).alignment = { horizontal: "center", vertical: "middle" };
  resultSheet.getCell(4, 1).font = { name: "Arial", size: 10, bold: true };
  resultSheet.getCell(4, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

  resultSheet.getCell(5, 2).value = null;
  resultSheet.mergeCells(4, 2, 5, 2);
  resultSheet.getCell(4, 2).alignment = { horizontal: "center", vertical: "middle" };
  resultSheet.getCell(4, 2).font = { name: "Arial", size: 10, bold: true };
  resultSheet.getCell(4, 2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

  // Fill nền header ngày dòng 4 và 5
  for (let c = 3; c <= resultLastCol; c++) {
    resultSheet.getCell(4, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    resultSheet.getCell(4, c).font = { name: "Arial", size: 10, bold: true };
    resultSheet.getCell(5, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    resultSheet.getCell(5, c).font = { name: "Arial", size: 10, bold: true };
  }

  // Lọc và đánh lại STT từ dòng 6 trở đi
  let outputRowIdx = 6;
  let stt = 1;
  const previewRows = [];

  for (let r0 = 5; r0 < data2D.length; r0++) {
    const srcRow = data2D[r0] || [];
    const userVal = srcRow[userCol0];
    if (!userVal) continue;

    const normUser = normalizeTextGiamDinh(userVal);
    let isAllowed = false;
    for (const allowed of ALLOWED_USERS) {
      if (normUser === allowed || normUser.includes(allowed) || allowed.includes(normUser)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) continue;

    const targetRow = resultSheet.getRow(outputRowIdx);
    targetRow.height = 22;
    const rowPreview = [];

    sourceCols0.forEach((oldCol0, newIdx) => {
      const newCol = newIdx + 1;
      const targetCell = targetRow.getCell(newCol);

      if (newCol === 1) {
        targetCell.value = stt;
        rowPreview.push(stt);
      } else {
        const v = srcRow[oldCol0];
        targetCell.value = (v !== undefined && v !== null) ? v : "";
        rowPreview.push(targetCell.value);
      }

      targetCell.font = { name: "Arial", size: 10 };
      targetCell.border = thinBorder;
      targetCell.alignment = {
        horizontal: newCol === 2 ? "left" : "center",
        vertical: "middle"
      };
    });

    previewRows.push(rowPreview);
    stt++;
    outputRowIdx++;
  }

  // Độ rộng cột tối ưu
  resultSheet.getColumn(1).width = 7;
  resultSheet.getColumn(2).width = 26;
  for (let c = 3; c <= resultLastCol; c++) {
    resultSheet.getColumn(c).width = 12;
  }

  resultSheet.views = [
    { state: "frozen", xSplit: 2, ySplit: 5 }
  ];

  resultSheet.autoFilter = `A4:${resultLastLetter}${outputRowIdx - 1}`;

  const buffer = await resultWb.xlsx.writeBuffer();
  return {
    buffer,
    totalRecords: stt - 1,
    previewRows
  };
}

/**
 * Xử lý Báo cáo Công việc P.CNTT
 */
async function processCntt(arrayBuffer, targetSheetName) {
  const sjsWb = XLSX.read(arrayBuffer, { type: "array", cellDates: true, cellFormula: false });

  const chosenSheetName = targetSheetName || sjsWb.SheetNames[0];
  const sjsWs = sjsWb.Sheets[chosenSheetName];
  if (!sjsWs) {
    throw new Error(`Không tìm thấy sheet '${chosenSheetName}' trong file.`);
  }

  const data2D = XLSX.utils.sheet_to_json(sjsWs, { header: 1, defval: "" });

  const softwareCols0 = [];
  for (let c = 4; c <= 24; c++) softwareCols0.push(c);

  const softwareHeaders = [];
  const headerRow105 = data2D[104] || [];
  softwareCols0.forEach(c => {
    const val = headerRow105[c];
    softwareHeaders.push(val !== null && val !== undefined && String(val).trim() !== "" ? String(val).trim() : `Phần mềm ${c-3}`);
  });

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

  const otherErrors = {};
  departments.forEach(dept => {
    otherErrors[dept] = [];
  });

  for (let r0 = 6; r0 <= 104; r0++) {
    const row = data2D[r0] || [];
    const deptVal = row[1];
    const errorVal = row[34];

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
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  outWs.getRow(1).height = 34;

  // Dòng 3: Header
  const headerRow = outWs.getRow(3);
  headerRow.height = 70;

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFD0D5DD" } },
    left: { style: "thin", color: { argb: "FFD0D5DD" } },
    bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
    right: { style: "thin", color: { argb: "FFD0D5DD" } }
  };

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder;
  });

  let curRow = 4;
  const previewRows = [];

  validDepartments.forEach((dept, dIdx) => {
    const row = outWs.getRow(curRow);
    row.height = 24;
    const rowPreview = [dIdx + 1, dept];
    let colIdx = 1;

    row.getCell(colIdx++).value = dIdx + 1;
    row.getCell(colIdx++).value = dept;

    activeSoftwareIndexes.forEach(swIdx => {
      const val = data[dept][swIdx];
      if (val !== null && val !== undefined && val !== "" && val !== 0 && val !== "0") {
        row.getCell(colIdx).value = val;
        rowPreview.push(val);
      } else {
        rowPreview.push("");
      }
      colIdx++;
    });

    if (hasOtherErrorCol) {
      if (otherErrors[dept] && otherErrors[dept].length > 0) {
        const errText = otherErrors[dept].join(", ");
        row.getCell(colIdx).value = errText;
        rowPreview.push(errText);
      } else {
        rowPreview.push("");
      }
      colIdx++;
    }

    for (let c = 1; c <= totalColumns; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Arial", size: 10 };
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: (c === 2 || (hasOtherErrorCol && c === totalColumns)) ? "left" : "center",
        vertical: "middle",
        wrapText: true
      };
    }
    previewRows.push(rowPreview);
    curRow++;
  });

  // Dòng TỔNG CỘNG
  const totalRow = outWs.getRow(curRow);
  totalRow.height = 26;
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
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    cell.border = thinBorder;
    cell.alignment = {
      horizontal: (c === 2 || (hasOtherErrorCol && c === totalColumns)) ? "left" : "center",
      vertical: "middle",
      wrapText: true
    };
  }

  outWs.getColumn(1).width = 7;
  outWs.getColumn(2).width = 28;
  for (let c = 3; c <= totalColumns; c++) {
    if (headers[c - 1] === "SỬA LỖI KHÁC") {
      outWs.getColumn(c).width = 55;
    } else {
      outWs.getColumn(c).width = 18;
    }
  }

  outWs.views = [
    { state: "frozen", xSplit: 2, ySplit: 3 }
  ];

  outWs.autoFilter = `A3:${getColLetterGiamDinh(totalColumns)}${curRow}`;

  const buffer = await resultWb.xlsx.writeBuffer();
  return {
    buffer,
    headers,
    totalRecords: validDepartments.length,
    previewRows
  };
}

window.ToolGiamDinh = {
  getExcelSheetNames,
  processGiamDinh,
  processCntt
};
