// ==========================================================
// HỆ THỐNG XỬ LÝ BÁO CÁO CÔNG VIỆC & GIÁM ĐỊNH BẢO HIỂM
// Phiên bản Web 2.0 (Client-side / GitHub Pages / Vercel Ready)
// ==========================================================

const ALLOWED_USERS = new Set([
  'PHCN',
  'NGOẠI TH', 'NGOAI TH',
  'XNTT',
  'NHH',
  'TTTM',
  'NGOẠI CT', 'NGOAI CT',
  'DA LIỄU', 'DA LIEU',
  'PTGMHS',
  'NỘI TH', 'NOI TH',
  'PHỤ SẢN', 'PHU SAN',
  'MẮT', 'MAT',
  'TTBVSK',
  'DƯỢC', 'DUOC',
  'THẬN', 'THAN',
  'TRUYỀN NHIỄM', 'TRUYEN NHIEM',
  'TCKT',
  'NGOẠI UB', 'NGOAI UB',
  'NGOẠI XẠ TRỊ', 'NGOAI XA TRI',
  'RHM',
  'KB',
  'CXK',
  'CSGN',
  'NGOẠI TN', 'NGOAI TN',
  'HHLS',
  'TMH',
  'HSTC',
  'HTL',
  'NGOẠI TKLN', 'NGOAI TKLN',
  'NHI',
  'ĐÔNG Y', 'DONG Y',
  'CẤP CỨU', 'CAP CUU',
  'LKTK'
]);

// Chuẩn hóa text giống như normalize_text trong Python
function normalizeText(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  text = text.replace(/[\r\n]+/g, ' ');
  text = text.replace(/\s+/g, ' ');
  return text.trim().toUpperCase();
}

// Global App State
const state = {
  currentTab: 'giamdinh',
  engine: 'web',
  pyodideReady: false,
  pyodideInstance: null,
  
  giamdinh: {
    file: null,
    fileBuffer: null,
    fileName: '',
    dayRange: '01-14',
    resultBuffer: null,
    previewData: null
  },
  
  cntt: {
    file: null,
    fileBuffer: null,
    fileName: '',
    sheets: [],
    selectedSheet: '',
    resultBuffer: null,
    previewData: null
  }
};

// Logging Utility
function log(message, type = 'info') {
  const logBody = document.getElementById('logBody');
  if (!logBody) return;
  const time = new Date().toLocaleTimeString('vi-VN');
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${time}] ${message}`;
  logBody.appendChild(entry);
  logBody.scrollTop = logBody.scrollHeight;
}

// Format file size
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Download Helper
function downloadBlob(buffer, filename) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Helper lấy ký tự cột (1 -> A, 2 -> B, 27 -> AA, ...)
function getColLetter(colNumber) {
  let temp = colNumber;
  let letter = '';
  while (temp > 0) {
    let mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

// ==========================================================
// 1. THUẬT TOÁN XỬ LÝ BÁO CÁO CỔNG GIÁM ĐỊNH (ExcelJS)
// ==========================================================
async function processGiamDinhWeb(arrayBuffer, startDay, endDay) {
  log('Đang đọc dữ liệu file Excel cổng giám định...', 'info');
  
  const sourceWb = new ExcelJS.Workbook();
  await sourceWb.xlsx.load(arrayBuffer);
  
  // Tìm sheet "Người dùng"
  let sourceSheet = null;
  for (const sheet of sourceWb.worksheets) {
    const sName = sheet.name.trim().toLowerCase();
    if (sName === 'người dùng' || sName === 'nguoi dung' || sName.includes('người dùng') || sName.includes('nguoi dung')) {
      sourceSheet = sheet;
      break;
    }
  }
  
  if (!sourceSheet) {
    sourceSheet = sourceWb.worksheets[0];
    log(`Không tìm thấy sheet "Người dùng", sử dụng sheet: "${sourceSheet.name}"`, 'warning');
  } else {
    log(`Đã tìm thấy sheet: "${sourceSheet.name}"`, 'success');
  }
  
  // Tìm dòng header có STT và NGƯỜI DÙNG trong 20 dòng đầu
  let headerRowIndex = null;
  const maxSearchRow = Math.min(sourceSheet.rowCount || 20, 20);
  
  for (let r = 1; r <= maxSearchRow; r++) {
    const row = sourceSheet.getRow(r);
    const cellValues = [];
    row.eachCell({ includeEmpty: false }, (cell) => {
      cellValues.push(normalizeText(cell.value));
    });
    
    if (cellValues.some(v => v === 'STT') && cellValues.some(v => v.includes('NGƯỜI DÙNG') || v.includes('NGUOI DUNG'))) {
      headerRowIndex = r;
      break;
    }
  }
  
  if (!headerRowIndex) {
    headerRowIndex = 4;
    log('Không tìm thấy rõ ràng dòng header STT/NGƯỜI DÙNG, tự động dùng dòng 4', 'warning');
  } else {
    log(`Dòng tiêu đề header nằm ở dòng: ${headerRowIndex}`, 'info');
  }
  
  // Tìm cột NGƯỜI DÙNG và các cột ngày (1 -> 31)
  const headerRow = sourceSheet.getRow(headerRowIndex);
  let userCol = null;
  const dayColumns = {};
  
  const maxCol = Math.max(sourceSheet.columnCount || 35, 35);
  for (let c = 1; c <= maxCol; c++) {
    const val = headerRow.getCell(c).value;
    const norm = normalizeText(val);
    
    if (norm.includes('NGƯỜI DÙNG') || norm.includes('NGUOI DUNG')) {
      userCol = c;
    }
    
    if (val !== null && val !== undefined) {
      const sVal = String(val).trim();
      if (/^\d+$/.test(sVal)) {
        const d = parseInt(sVal, 10);
        if (d >= 1 && d <= 31) {
          dayColumns[d] = c;
        }
      }
    }
  }
  
  if (!userCol) {
    userCol = 2;
    log('Không tìm thấy cột NGƯỜI DÙNG, mặc định cột B (2)', 'warning');
  }
  
  log(`Cột Người dùng: ${userCol}. Tìm thấy ${Object.keys(dayColumns).length} cột ngày.`, 'info');
  
  // Lấy các ngày được chọn
  const selectedDays = [];
  for (let d = startDay; d <= endDay; d++) {
    selectedDays.push(d);
  }
  
  // Các cột nguồn: [STT (1), Người dùng (userCol), Các ngày...]
  const sourceColumns = [1, userCol];
  selectedDays.forEach(d => {
    if (dayColumns[d]) {
      sourceColumns.push(dayColumns[d]);
    }
  });
  
  const resultLastCol = sourceColumns.length;
  const resultLastLetter = getColLetter(resultLastCol);
  
  // Tạo Workbook mới
  const resultWb = new ExcelJS.Workbook();
  const resultSheet = resultWb.addWorksheet('Người dùng');
  
  // Copy 5 dòng đầu (1 -> 5)
  for (let r = 1; r <= 5; r++) {
    const srcRow = sourceSheet.getRow(r);
    const targetRow = resultSheet.getRow(r);
    
    sourceColumns.forEach((oldCol, newIndex) => {
      const newCol = newIndex + 1;
      const srcCell = srcRow.getCell(oldCol);
      const targetCell = targetRow.getCell(newCol);
      
      targetCell.value = srcCell.value;
      if (srcCell.font) targetCell.font = Object.assign({}, srcCell.font);
      if (srcCell.alignment) targetCell.alignment = Object.assign({}, srcCell.alignment);
      if (srcCell.border) targetCell.border = Object.assign({}, srcCell.border);
      if (srcCell.fill) targetCell.fill = Object.assign({}, srcCell.fill);
    });
  }
  
  // Gộp tiêu đề dòng 1 (A1 -> LastCol)
  const titleA1 = sourceSheet.getCell('A1').value || 'DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM';
  for (let c = 2; c <= resultLastCol; c++) {
    resultSheet.getCell(1, c).value = null;
  }
  resultSheet.mergeCells(1, 1, 1, resultLastCol);
  const cellA1 = resultSheet.getCell(1, 1);
  cellA1.value = titleA1;
  cellA1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
  cellA1.font = { name: 'Arial', size: 16, bold: true };
  resultSheet.getRow(1).height = 32;
  
  // Gộp tiêu đề dòng 2 (A2 -> LastCol)
  const noteA2 = sourceSheet.getCell('A2').value || '';
  for (let c = 2; c <= resultLastCol; c++) {
    resultSheet.getCell(2, c).value = null;
  }
  resultSheet.mergeCells(2, 1, 2, resultLastCol);
  const cellA2 = resultSheet.getCell(2, 1);
  cellA2.value = noteA2;
  cellA2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
  
  // Gộp A4:A5 và B4:B5
  resultSheet.getCell(5, 1).value = null;
  resultSheet.mergeCells(4, 1, 5, 1);
  const cellA4 = resultSheet.getCell(4, 1);
  cellA4.alignment = { horizontal: 'center', vertical: 'middle' };
  
  resultSheet.getCell(5, 2).value = null;
  resultSheet.mergeCells(4, 2, 5, 2);
  const cellB4 = resultSheet.getCell(4, 2);
  cellB4.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Lọc dữ liệu các khoa/người dùng được phép từ dòng 6 trở đi
  let outputRowIdx = 6;
  let stt = 1;
  const previewRows = [];
  
  const totalSrcRows = sourceSheet.rowCount || 100;
  for (let r = 6; r <= totalSrcRows; r++) {
    const srcRow = sourceSheet.getRow(r);
    const userVal = srcRow.getCell(userCol).value;
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
    const previewRow = { stt: stt, user: String(userVal).trim(), days: [] };
    
    sourceColumns.forEach((oldCol, newIndex) => {
      const newCol = newIndex + 1;
      const srcCell = srcRow.getCell(oldCol);
      const targetCell = targetRow.getCell(newCol);
      
      if (newCol === 1) {
        targetCell.value = stt;
      } else {
        targetCell.value = srcCell.value;
      }
      
      if (newCol > 2) {
        previewRow.days.push(srcCell.value !== null && srcCell.value !== undefined ? srcCell.value : '');
      }
      
      if (srcCell.font) targetCell.font = Object.assign({}, srcCell.font);
      if (srcCell.alignment) targetCell.alignment = Object.assign({}, srcCell.alignment);
      if (srcCell.border) targetCell.border = Object.assign({}, srcCell.border);
      if (srcCell.fill) targetCell.fill = Object.assign({}, srcCell.fill);
    });
    
    previewRows.push(previewRow);
    stt++;
    outputRowIdx++;
  }
  
  // Đặt độ rộng cột
  resultSheet.getColumn(1).width = 8;
  resultSheet.getColumn(2).width = 25;
  for (let c = 3; c <= resultLastCol; c++) {
    resultSheet.getColumn(c).width = 12;
  }
  
  // Freeze Panes tại C6
  resultSheet.views = [
    { state: 'frozen', xSplit: 2, ySplit: 5 }
  ];
  
  // AutoFilter
  resultSheet.autoFilter = `A4:${resultLastLetter}${outputRowIdx - 1}`;
  
  log(`Hoàn thành lọc ${stt - 1} khoa/người dùng hợp lệ cho chu kỳ ngày ${startDay} -> ${endDay}!`, 'success');
  
  const buffer = await resultWb.xlsx.writeBuffer();
  return {
    buffer: buffer,
    preview: previewRows,
    count: stt - 1,
    days: selectedDays
  };
}

// ==========================================================
// 2. THUẬT TOÁN BÁO CÁO CÔNG VIỆC PHÒNG CNTT (ExcelJS)
// ==========================================================
async function processCnttWeb(arrayBuffer, targetSheetName) {
  log('Đang phân tích dữ liệu tổng hợp công việc P.CNTT...', 'info');
  
  const sourceWb = new ExcelJS.Workbook();
  await sourceWb.xlsx.load(arrayBuffer);
  
  let ws = null;
  if (targetSheetName) {
    ws = sourceWb.getWorksheet(targetSheetName);
  }
  if (!ws) {
    ws = sourceWb.worksheets[0];
  }
  
  log(`Đang xử lý sheet: "${ws.name}"`, 'info');
  
  // Cột phần mềm: Cột 5 đến 25 (E đến Y)
  const softwareColumns = [];
  for (let c = 5; c <= 25; c++) softwareColumns.push(c);
  
  // Hàng 105: Header tên phần mềm
  const softwareHeaders = [];
  const headerRow105 = ws.getRow(105);
  softwareColumns.forEach(c => {
    const val = headerRow105.getCell(c).value;
    softwareHeaders.push(val !== null && val !== undefined ? String(val).trim() : `Phần mềm ${c-4}`);
  });
  
  // Danh sách khoa từ hàng 106 trở đi (Cột 4 = D)
  const departments = [];
  const maxRow = ws.rowCount || 250;
  
  for (let r = 106; r <= maxRow; r++) {
    const deptVal = ws.getRow(r).getCell(4).value;
    if (!deptVal) continue;
    const sDept = String(deptVal).trim();
    if (sDept.toUpperCase() === 'TỔNG CỘNG' || sDept.toUpperCase() === 'TONG CONG') {
      break;
    }
    if (sDept && !departments.includes(sDept)) {
      departments.push(sDept);
    }
  }
  
  if (departments.length === 0) {
    log('Không tìm thấy dòng 106 chuẩn, quét tự động các khoa phòng...', 'warning');
    for (let r = 1; r <= maxRow; r++) {
      const deptVal = ws.getRow(r).getCell(4).value || ws.getRow(r).getCell(2).value;
      if (deptVal) {
        const sDept = String(deptVal).trim();
        if (sDept.toUpperCase().includes('KHOA') || sDept.toUpperCase().includes('PHÒNG') || sDept.toUpperCase().includes('TRUNG TÂM')) {
          if (!departments.includes(sDept)) departments.push(sDept);
        }
      }
    }
  }
  
  log(`Tìm thấy ${departments.length} khoa phòng trong danh sách.`, 'info');
  
  // Đọc dữ liệu phần mềm
  const data = {};
  departments.forEach(dept => {
    data[dept] = new Array(softwareColumns.length).fill(null);
  });
  
  for (let r = 106; r <= maxRow; r++) {
    const deptVal = ws.getRow(r).getCell(4).value;
    if (!deptVal) continue;
    const sDept = String(deptVal).trim();
    if (sDept.toUpperCase() === 'TỔNG CỘNG' || sDept.toUpperCase() === 'TONG CONG') break;
    if (!data[sDept]) continue;
    
    softwareColumns.forEach((c, idx) => {
      const val = ws.getRow(r).getCell(c).value;
      if (val !== null && val !== undefined && val !== '' && val !== 0) {
        data[sDept][idx] = val;
      }
    });
  }
  
  // Đọc dữ liệu SỬA LỖI KHÁC: Hàng 7 -> 105 (Cột 2 = Khoa, Cột 35 (AI) = Mô tả lỗi)
  const otherErrors = {};
  departments.forEach(dept => {
    otherErrors[dept] = [];
  });
  
  for (let r = 7; r <= 105; r++) {
    const deptVal = ws.getRow(r).getCell(2).value;
    const errorVal = ws.getRow(r).getCell(35).value;
    
    if (!deptVal || !errorVal) continue;
    const sDept = String(deptVal).trim();
    const sError = String(errorVal).trim();
    
    if (otherErrors[sDept] && sError && sError !== '0') {
      if (!otherErrors[sDept].includes(sError)) {
        otherErrors[sDept].push(sError);
      }
    }
  }
  
  // Lọc chỉ giữ các khoa có dữ liệu (có phần mềm hoặc có sửa lỗi khác)
  const validDepartments = departments.filter(dept => {
    const hasSoftware = data[dept].some(v => v !== null && v !== '' && v !== 0);
    const hasError = otherErrors[dept] && otherErrors[dept].length > 0;
    return hasSoftware || hasError;
  });
  
  log(`Số khoa/phòng có phát sinh công việc thực tế: ${validDepartments.length}`, 'info');
  
  // Xác định các cột phần mềm thực sự có dữ liệu
  const activeSoftwareIndexes = [];
  for (let i = 0; i < softwareColumns.length; i++) {
    const hasData = validDepartments.some(dept => data[dept][i] !== null && data[dept][i] !== '' && data[dept][i] !== 0);
    if (hasData) {
      activeSoftwareIndexes.push(i);
    }
  }
  
  const hasOtherErrorCol = validDepartments.some(dept => otherErrors[dept] && otherErrors[dept].length > 0);
  
  // Cấu trúc cột xuất
  const headers = ['STT', 'KHOA, PHÒNG, TRUNG TÂM'];
  activeSoftwareIndexes.forEach(i => headers.push(softwareHeaders[i] || `Cột ${i+1}`));
  if (hasOtherErrorCol) headers.push('SỬA LỖI KHÁC');
  
  const totalColumns = headers.length;
  
  // Tạo Workbook tổng hợp mới
  const resultWb = new ExcelJS.Workbook();
  const outWs = resultWb.addWorksheet('BÁO CÁO TỔNG HỢP');
  
  // Dòng 1: Tiêu đề
  outWs.mergeCells(1, 1, 1, totalColumns);
  const titleCell = outWs.getCell(1, 1);
  titleCell.value = 'TỔNG HỢP CÔNG VIỆC P.CNTT';
  titleCell.font = { name: 'Arial', size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  outWs.getRow(1).height = 32;
  
  // Dòng 3: Header
  const headerRow = outWs.getRow(3);
  headerRow.height = 75;
  
  const thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };
  
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });
  
  // Ghi dữ liệu từng dòng
  const previewRows = [];
  let curRow = 4;
  
  validDepartments.forEach((dept, dIdx) => {
    const row = outWs.getRow(curRow);
    let colIdx = 1;
    
    // STT
    row.getCell(colIdx++).value = dIdx + 1;
    // Tên khoa
    row.getCell(colIdx++).value = dept;
    
    const previewItem = { stt: dIdx + 1, dept: dept, values: [], errors: '' };
    
    // Phần mềm
    activeSoftwareIndexes.forEach(swIdx => {
      const val = data[dept][swIdx];
      if (val !== null && val !== undefined && val !== '' && val !== 0) {
        row.getCell(colIdx).value = val;
        previewItem.values.push(val);
      } else {
        previewItem.values.push('');
      }
      colIdx++;
    });
    
    // Sửa lỗi khác
    if (hasOtherErrorCol) {
      if (otherErrors[dept] && otherErrors[dept].length > 0) {
        const errText = otherErrors[dept].join(', ');
        row.getCell(colIdx).value = errText;
        previewItem.errors = errText;
      }
      colIdx++;
    }
    
    // Format dòng
    for (let c = 1; c <= totalColumns; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 10 };
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: (c === 2 || (hasOtherErrorCol && c === totalColumns)) ? 'left' : 'center',
        vertical: 'top',
        wrapText: true
      };
    }
    
    previewRows.push(previewItem);
    curRow++;
  });
  
  // Dòng TỔNG CỘNG
  const totalRow = outWs.getRow(curRow);
  totalRow.getCell(2).value = 'TỔNG CỘNG';
  
  // Tính tổng các cột số
  let grandTotalErrors = 0;
  
  for (let c = 3; c <= totalColumns; c++) {
    const headerTitle = headers[c - 1];
    if (headerTitle === 'SỬA LỖI KHÁC') continue;
    
    let sum = 0;
    let hasNumeric = false;
    
    for (let r = 4; r < curRow; r++) {
      const v = outWs.getRow(r).getCell(c).value;
      if (typeof v === 'number') {
        sum += v;
        hasNumeric = true;
      } else if (v && !isNaN(Number(v))) {
        sum += Number(v);
        hasNumeric = true;
      }
    }
    
    if (hasNumeric && sum !== 0) {
      totalRow.getCell(c).value = sum;
      if (headerTitle !== 'Đăng bài trên website') {
        grandTotalErrors += sum;
      }
    }
  }
  
  for (let c = 3; c <= totalColumns; c++) {
    const headerTitle = headers[c - 1];
    if (headerTitle === 'Đăng bài trên website') {
      totalRow.getCell(c).value = null;
    }
  }
  
  if (hasOtherErrorCol && grandTotalErrors !== 0) {
    totalRow.getCell(totalColumns).value = grandTotalErrors;
  }
  
  for (let c = 1; c <= totalColumns; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { name: 'Arial', size: 10, bold: true };
    cell.border = thinBorder;
    cell.alignment = {
      horizontal: (c === 2 || (hasOtherErrorCol && c === totalColumns)) ? 'left' : 'center',
      vertical: 'top',
      wrapText: true
    };
  }
  
  outWs.getColumn(1).width = 7;
  outWs.getColumn(2).width = 28;
  for (let c = 3; c <= totalColumns; c++) {
    if (headers[c - 1] === 'SỬA LỖI KHÁC') {
      outWs.getColumn(c).width = 55;
    } else {
      outWs.getColumn(c).width = 17;
    }
  }
  
  outWs.views = [
    { state: 'frozen', xSplit: 2, ySplit: 3 }
  ];
  
  outWs.autoFilter = `A3:${getColLetter(totalColumns)}${curRow}`;
  
  log(`Hoàn thành tổng hợp ${validDepartments.length} khoa phòng vào bảng báo cáo CNTT!`, 'success');
  
  const buffer = await resultWb.xlsx.writeBuffer();
  return {
    buffer: buffer,
    headers: headers,
    preview: previewRows,
    deptCount: validDepartments.length
  };
}

// ==========================================================
// 3. TẠO DỮ LIỆU MẪU ĐỂ TEST TRỰC TIẾP
// ==========================================================
async function generateSampleGiamDinh() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Người dùng');
  
  ws.getCell('A1').value = 'DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM Y TẾ THÁNG NÀY';
  ws.getCell('A2').value = 'Đơn vị: Bệnh viện Đa khoa - Ngày xuất: ' + new Date().toLocaleDateString('vi-VN');
  
  ws.getRow(4).values = ['STT', 'NGƯỜI DÙNG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
  
  const testUsers = ['PHCN', 'NGOẠI TH', 'XNTT', 'NHH', 'TTTM', 'NGOẠI CT', 'DA LIỄU', 'PTGMHS', 'NỘI TH', 'USER_KHONG_DUYET_1', 'PHỤ SẢN', 'MẮT', 'TTBVSK', 'DƯỢC', 'USER_KHONG_DUYET_2', 'THẬN', 'TRUYỀN NHIỄM', 'TCKT', 'RHM', 'KB', 'CXK', 'CSGN', 'TMH', 'HSTC', 'NHI', 'ĐÔNG Y', 'CẤP CỨU', 'LKTK'];
  
  testUsers.forEach((u, i) => {
    const rowVals = [i + 1, u];
    for (let d = 1; d <= 20; d++) {
      rowVals.push(Math.floor(Math.random() * 50) + 1);
    }
    ws.getRow(6 + i).values = rowVals;
  });
  
  return await wb.xlsx.writeBuffer();
}

async function generateSampleCntt() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Nhật Ký Công Việc');
  
  const swNames = ['HIS', 'LIS', 'PACS', 'BHYT Cổng', 'Hóa đơn điện tử', 'Kê đơn ngoại trú', 'Quản lý viện phí', 'Đăng bài trên website', 'Sửa máy in', 'Cài đặt Windows'];
  for (let i = 0; i < swNames.length; i++) {
    ws.getRow(105).getCell(5 + i).value = swNames[i];
  }
  
  const sampleDepts = ['Khoa Khám Bệnh', 'Khoa Cấp Cứu', 'Khoa Ngoại Tổng Hợp', 'Khoa Nội Tim Mạch', 'Khoa Dược', 'Khoa Chẩn Đoán Hình Ảnh', 'Khoa Phụ Sản', 'Khoa Nhi'];
  
  sampleDepts.forEach((dept, i) => {
    ws.getRow(7 + i).getCell(2).value = dept;
    ws.getRow(7 + i).getCell(35).value = `Lỗi mạng máy trạm ${i+1}, kẹt giấy máy in`;
  });
  
  sampleDepts.forEach((dept, i) => {
    const row = ws.getRow(106 + i);
    row.getCell(4).value = dept;
    for (let s = 0; s < swNames.length; s++) {
      row.getCell(5 + s).value = Math.floor(Math.random() * 8);
    }
  });
  
  ws.getRow(106 + sampleDepts.length).getCell(4).value = 'TỔNG CỘNG';
  
  return await wb.xlsx.writeBuffer();
}

// ==========================================================
// 4. UI CONTROLLER & EVENT LISTENERS
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  
  const today = new Date().getDate();
  const defaultRange = today <= 14 ? '01-14' : '15-31';
  state.giamdinh.dayRange = defaultRange;
  
  if (defaultRange === '01-14') {
    const r1 = document.getElementById('range0114');
    if (r1) r1.checked = true;
    const card1 = document.getElementById('radioCardG1');
    if (card1) card1.classList.add('selected');
  } else {
    const r2 = document.getElementById('range1531');
    if (r2) r2.checked = true;
    const card2 = document.getElementById('radioCardG2');
    if (card2) card2.classList.add('selected');
  }
  
  // Tab Switcher
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      
      const tabTarget = btn.getAttribute('data-tab');
      state.currentTab = tabTarget;
      
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      if (tabTarget === 'giamdinh') {
        document.getElementById('panelGiamDinh').classList.add('active');
      } else {
        document.getElementById('panelCntt').classList.add('active');
      }
    });
  });
  
  // Radio change handlers
  document.querySelectorAll("input[name='dayRange']").forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.giamdinh.dayRange = e.target.value;
      const c1 = document.getElementById('radioCardG1');
      const c2 = document.getElementById('radioCardG2');
      if (c1) c1.classList.toggle('selected', e.target.value === '01-14');
      if (c2) c2.classList.toggle('selected', e.target.value === '15-31');
      log(`Đã chọn khoảng ngày: ${e.target.value}`, 'info');
    });
  });
  
  // Clear Logs
  const btnClearLogs = document.getElementById('btnClearLogs');
  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      document.getElementById('logBody').innerHTML = '<div class="log-entry log-info">[HỆ THỐNG] Đã xóa nhật ký.</div>';
    });
  }
  
  // --- DROPZONE GIÁM ĐỊNH ---
  setupDropzone(
    document.getElementById('dropzoneGiamDinh'),
    document.getElementById('fileInputGiamDinh'),
    document.getElementById('fileInfoGiamDinh'),
    document.getElementById('fileNameGiamDinh'),
    document.getElementById('fileSizeGiamDinh'),
    document.getElementById('btnProcessGiamDinh'),
    document.getElementById('btnClearGiamDinh'),
    async (file, buffer) => {
      state.giamdinh.file = file;
      state.giamdinh.fileBuffer = buffer;
      state.giamdinh.fileName = file.name;
      log(`Đã nạp file: ${file.name} (${formatBytes(file.size)})`, 'success');
    },
    () => {
      state.giamdinh.file = null;
      state.giamdinh.fileBuffer = null;
      const res = document.getElementById('resultCardGiamDinh');
      if (res) res.classList.add('hidden');
    }
  );
  
  // --- DROPZONE CNTT ---
  setupDropzone(
    document.getElementById('dropzoneCntt'),
    document.getElementById('fileInputCntt'),
    document.getElementById('fileInfoCntt'),
    document.getElementById('fileNameCntt'),
    document.getElementById('fileSizeCntt'),
    document.getElementById('btnProcessCntt'),
    document.getElementById('btnClearCntt'),
    async (file, buffer) => {
      state.cntt.file = file;
      state.cntt.fileBuffer = buffer;
      state.cntt.fileName = file.name;
      
      try {
        const tempWb = new ExcelJS.Workbook();
        await tempWb.xlsx.load(buffer);
        const sheetSelect = document.getElementById('sheetSelectCntt');
        sheetSelect.innerHTML = '';
        state.cntt.sheets = tempWb.worksheets.map(w => w.name);
        
        state.cntt.sheets.forEach((name, i) => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = `${i + 1}. ${name}`;
          sheetSelect.appendChild(opt);
        });
        
        sheetSelect.disabled = false;
        state.cntt.selectedSheet = state.cntt.sheets[0] || '';
        log(`Đã đọc ${state.cntt.sheets.length} sheet từ file CNTT. Mặc định chọn "${state.cntt.selectedSheet}"`, 'success');
      } catch (err) {
        log(`Không thể đọc danh sách sheet: ${err.message}`, 'error');
      }
    },
    () => {
      state.cntt.file = null;
      state.cntt.fileBuffer = null;
      const sheetSelect = document.getElementById('sheetSelectCntt');
      if (sheetSelect) {
        sheetSelect.innerHTML = '<option value="">-- Vui lòng tải file Excel lên trước --</option>';
        sheetSelect.disabled = true;
      }
      const res = document.getElementById('resultCardCntt');
      if (res) res.classList.add('hidden');
    }
  );
  
  const sheetSelect = document.getElementById('sheetSelectCntt');
  if (sheetSelect) {
    sheetSelect.addEventListener('change', (e) => {
      state.cntt.selectedSheet = e.target.value;
      log(`Đã đổi sheet cần xử lý: "${e.target.value}"`, 'info');
    });
  }
  
  // --- NÚT DỮ LIỆU MẪU ---
  const btnDemoGiamDinh = document.getElementById('btnDemoGiamDinh');
  if (btnDemoGiamDinh) {
    btnDemoGiamDinh.addEventListener('click', async () => {
      log('Đang tạo dữ liệu mẫu Cổng Giám Định...', 'info');
      const sampleBuffer = await generateSampleGiamDinh();
      state.giamdinh.fileBuffer = sampleBuffer;
      state.giamdinh.fileName = 'MAU_CONG_GIAM_DINH_TEST.xlsx';
      
      document.getElementById('dropzoneGiamDinh').classList.add('hidden');
      document.getElementById('fileInfoGiamDinh').classList.remove('hidden');
      document.getElementById('fileNameGiamDinh').textContent = 'MAU_CONG_GIAM_DINH_TEST.xlsx (Mẫu)';
      document.getElementById('fileSizeGiamDinh').textContent = formatBytes(sampleBuffer.byteLength);
      document.getElementById('btnProcessGiamDinh').disabled = false;
      log('Đã nạp dữ liệu mẫu Giám Định thành công! Nhấn "BẮT ĐẦU XỬ LÝ BÁO CÁO" để chạy.', 'success');
    });
  }
  
  const btnDemoCntt = document.getElementById('btnDemoCntt');
  if (btnDemoCntt) {
    btnDemoCntt.addEventListener('click', async () => {
      log('Đang tạo dữ liệu mẫu Báo Cáo P.CNTT...', 'info');
      const sampleBuffer = await generateSampleCntt();
      state.cntt.fileBuffer = sampleBuffer;
      state.cntt.fileName = 'MAU_NHAT_KY_CNTT_TEST.xlsx';
      
      document.getElementById('dropzoneCntt').classList.add('hidden');
      document.getElementById('fileInfoCntt').classList.remove('hidden');
      document.getElementById('fileNameCntt').textContent = 'MAU_NHAT_KY_CNTT_TEST.xlsx (Mẫu)';
      document.getElementById('fileSizeCntt').textContent = formatBytes(sampleBuffer.byteLength);
      
      const sSelect = document.getElementById('sheetSelectCntt');
      sSelect.innerHTML = '<option value="Nhật Ký Công Việc">1. Nhật Ký Công Việc</option>';
      sSelect.disabled = false;
      state.cntt.selectedSheet = 'Nhật Ký Công Việc';
      
      document.getElementById('btnProcessCntt').disabled = false;
      log('Đã nạp dữ liệu mẫu CNTT thành công! Nhấn "BẮT ĐẦU TỔNG HỢP CÔNG VIỆC CNTT" để chạy.', 'success');
    });
  }
  
  // --- XỬ LÝ BÁO CÁO GIÁM ĐỊNH ---
  const btnProcessGiamDinh = document.getElementById('btnProcessGiamDinh');
  if (btnProcessGiamDinh) {
    btnProcessGiamDinh.addEventListener('click', async () => {
      const statusBox = document.getElementById('statusBoxGiamDinh');
      const progressBar = document.getElementById('progressBarGiamDinh');
      const statusMsg = document.getElementById('statusMsgGiamDinh');
      const resultCard = document.getElementById('resultCardGiamDinh');
      
      btnProcessGiamDinh.disabled = true;
      statusBox.classList.remove('hidden');
      resultCard.classList.add('hidden');
      progressBar.style.width = '20%';
      statusMsg.textContent = 'Đang khởi tạo bộ xử lý...';
      
      const [startDay, endDay] = state.giamdinh.dayRange === '01-14' ? [1, 14] : [15, 31];
      
      try {
        progressBar.style.width = '50%';
        statusMsg.textContent = 'Đang đọc cấu trúc ô và lọc 32 khoa/người dùng...';
        
        const result = await processGiamDinhWeb(state.giamdinh.fileBuffer, startDay, endDay);
        state.giamdinh.resultBuffer = result.buffer;
        state.giamdinh.previewData = result;
        
        progressBar.style.width = '100%';
        statusMsg.textContent = 'Hoàn tất xử lý!';
        
        setTimeout(() => {
          statusBox.classList.add('hidden');
          resultCard.classList.remove('hidden');
          document.getElementById('resultDescGiamDinh').textContent = `Đã xuất ${result.count} khoa phòng hợp lệ theo chu kỳ ngày ${startDay} → ${endDay}.`;
          btnProcessGiamDinh.disabled = false;
          
          renderGiamDinhPreview(result);
          if (window.lucide) lucide.createIcons();
        }, 400);
        
      } catch (err) {
        statusBox.classList.add('hidden');
        btnProcessGiamDinh.disabled = false;
        log(`Lỗi khi xử lý báo cáo cổng giám định: ${err.message}`, 'error');
        alert(`Đã xảy ra lỗi: ${err.message}`);
      }
    });
  }
  
  // --- DOWNLOAD GIÁM ĐỊNH ---
  const btnDownloadGiamDinh = document.getElementById('btnDownloadGiamDinh');
  if (btnDownloadGiamDinh) {
    btnDownloadGiamDinh.addEventListener('click', () => {
      if (!state.giamdinh.resultBuffer) return;
      const filename = 'DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM.xlsx';
      downloadBlob(state.giamdinh.resultBuffer, filename);
      log(`Đã tải về file: ${filename}`, 'success');
    });
  }
  
  // --- TOGGLE PREVIEW GIÁM ĐỊNH ---
  const btnPreviewGiamDinh = document.getElementById('btnPreviewGiamDinh');
  if (btnPreviewGiamDinh) {
    btnPreviewGiamDinh.addEventListener('click', () => {
      const preview = document.getElementById('previewGiamDinh');
      preview.classList.toggle('hidden');
    });
  }
  
  // --- XỬ LÝ BÁO CÁO CNTT ---
  const btnProcessCntt = document.getElementById('btnProcessCntt');
  if (btnProcessCntt) {
    btnProcessCntt.addEventListener('click', async () => {
      const statusBox = document.getElementById('statusBoxCntt');
      const progressBar = document.getElementById('progressBarCntt');
      const statusMsg = document.getElementById('statusMsgCntt');
      const resultCard = document.getElementById('resultCardCntt');
      
      btnProcessCntt.disabled = true;
      statusBox.classList.remove('hidden');
      resultCard.classList.add('hidden');
      progressBar.style.width = '20%';
      statusMsg.textContent = 'Đang phân tích cấu trúc cột phần mềm & nhật ký sửa lỗi...';
      
      try {
        progressBar.style.width = '60%';
        statusMsg.textContent = 'Đang tổng hợp theo khoa phòng và tính tổng cộng...';
        
        const result = await processCnttWeb(state.cntt.fileBuffer, state.cntt.selectedSheet);
        state.cntt.resultBuffer = result.buffer;
        state.cntt.previewData = result;
        
        progressBar.style.width = '100%';
        statusMsg.textContent = 'Hoàn tất tổng hợp!';
        
        setTimeout(() => {
          statusBox.classList.add('hidden');
          resultCard.classList.remove('hidden');
          document.getElementById('resultDescCntt').textContent = `Đã tổng hợp ${result.deptCount} khoa phòng có phát sinh công việc vào báo cáo hoàn chỉnh.`;
          btnProcessCntt.disabled = false;
          
          renderCnttPreview(result);
          if (window.lucide) lucide.createIcons();
        }, 400);
        
      } catch (err) {
        statusBox.classList.add('hidden');
        btnProcessCntt.disabled = false;
        log(`Lỗi khi tổng hợp báo cáo CNTT: ${err.message}`, 'error');
        alert(`Đã xảy ra lỗi: ${err.message}`);
      }
    });
  }
  
  // --- DOWNLOAD CNTT ---
  const btnDownloadCntt = document.getElementById('btnDownloadCntt');
  if (btnDownloadCntt) {
    btnDownloadCntt.addEventListener('click', () => {
      if (!state.cntt.resultBuffer) return;
      const filename = 'TỔNG HỢP CÔNG VIỆC P.CNTT.xlsx';
      downloadBlob(state.cntt.resultBuffer, filename);
      log(`Đã tải về file: ${filename}`, 'success');
    });
  }
  
  // --- TOGGLE PREVIEW CNTT ---
  const btnPreviewCntt = document.getElementById('btnPreviewCntt');
  if (btnPreviewCntt) {
    btnPreviewCntt.addEventListener('click', () => {
      const preview = document.getElementById('previewCntt');
      preview.classList.toggle('hidden');
    });
  }
  
  // --- ENGINE SWITCHER ---
  const btnEngineWeb = document.getElementById('btnEngineWeb');
  const btnEnginePy = document.getElementById('btnEnginePy');
  if (btnEngineWeb && btnEnginePy) {
    btnEngineWeb.addEventListener('click', () => {
      state.engine = 'web';
      btnEngineWeb.classList.add('active');
      btnEnginePy.classList.remove('active');
      document.getElementById('engineStatusText').innerHTML = 'Động cơ: <strong>ExcelJS Siêu Tốc (Trực tiếp)</strong>';
      log('Chuyển sang chế độ Web Engine (ExcelJS - Xử lý tức thì)', 'info');
    });
    
    btnEnginePy.addEventListener('click', async () => {
      state.engine = 'python';
      btnEnginePy.classList.add('active');
      btnEngineWeb.classList.remove('active');
      document.getElementById('engineStatusText').innerHTML = 'Động cơ: <strong>Python WebAssembly (Đang kết nối...)</strong>';
      log('Đang khởi động môi trường Python Wasm (Pyodide + openpyxl)...', 'info');
      
      try {
        if (!state.pyodideReady) {
          state.pyodideInstance = await loadPyodide();
          await state.pyodideInstance.loadPackage('micropip');
          const micropip = state.pyodideInstance.pyimport('micropip');
          await micropip.install('openpyxl');
          state.pyodideReady = true;
        }
        document.getElementById('engineStatusText').innerHTML = 'Động cơ: <strong>Python WebAssembly (Sẵn sàng)</strong>';
        log('Môi trường Python WebAssembly đã nạp thành công!', 'success');
      } catch (e) {
        log(`Không thể nạp Pyodide: ${e.message}. Tự động duy trì Web Engine.`, 'warning');
        state.engine = 'web';
        btnEngineWeb.classList.add('active');
        btnEnginePy.classList.remove('active');
      }
    });
  }
});

// Setup dropzone handler
function setupDropzone(dropzone, input, fileInfo, nameLabel, sizeLabel, processBtn, clearBtn, onLoaded, onCleared) {
  if (!dropzone || !input) return;
  
  dropzone.addEventListener('click', () => input.click());
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  ['dragleave', 'dragend'].forEach(type => {
    dropzone.addEventListener(type, () => dropzone.classList.remove('dragover'));
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  
  input.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });
  
  function handleFile(file) {
    if (!file.name.match(/\\.(xlsx|xlsm)$/i)) {
      alert('Vui lòng chọn file Excel có đuôi định dạng .xlsx hoặc .xlsm!');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = evt.target.result;
      dropzone.classList.add('hidden');
      fileInfo.classList.remove('hidden');
      nameLabel.textContent = file.name;
      sizeLabel.textContent = formatBytes(file.size);
      processBtn.disabled = false;
      
      if (onLoaded) await onLoaded(file, buffer);
    };
    reader.readAsArrayBuffer(file);
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      dropzone.classList.remove('hidden');
      fileInfo.classList.add('hidden');
      processBtn.disabled = true;
      if (onCleared) onCleared();
    });
  }
}

function renderGiamDinhPreview(result) {
  const container = document.getElementById('previewGiamDinh');
  if (!container) return;
  let html = '<table class="preview-table"><thead><tr><th>STT</th><th>KHOA / PHÒNG</th>';
  result.days.forEach(d => {
    html += `<th>Ngày ${d}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  result.preview.forEach(row => {
    html += `<tr><td style="text-align:center">${row.stt}</td><td style="font-weight:600">${row.user}</td>`;
    row.days.forEach(v => {
      html += `<td style="text-align:center">${v}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderCnttPreview(result) {
  const container = document.getElementById('previewCntt');
  if (!container) return;
  let html = '<table class="preview-table"><thead><tr>';
  result.headers.forEach(h => {
    html += `<th>${h}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  result.preview.forEach(row => {
    html += `<tr><td style="text-align:center">${row.stt}</td><td style="font-weight:600">${row.dept}</td>`;
    row.values.forEach(v => {
      html += `<td style="text-align:center">${v}</td>`;
    });
    if (result.headers.includes('SỬA LỖI KHÁC')) {
      html += `<td>${row.errors || ''}</td>`;
    }
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}
