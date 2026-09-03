/**
 * tool-diff-checker.js
 * Smart Text & Code Diff Checker for Hospital IT & Administrative Documents
 * So sánh đối chiếu hai văn bản, câu lệnh SQL, XML/JSON với thuật toán LCS & tô màu trực quan.
 */

class ToolDiffChecker {
  constructor() {
    this.viewMode = "split"; // "split" hoặc "unified"
    this.ignoreWhitespace = false;
    this.ignoreCase = false;
  }

  computeDiff(textA, textB) {
    let linesA = textA.split(/\r?\n/);
    let linesB = textB.split(/\r?\n/);

    if (this.ignoreWhitespace) {
      linesA = linesA.map(l => l.trim());
      linesB = linesB.map(l => l.trim());
    }

    // Thuật toán LCS tìm các đoạn tương đồng
    const matrix = [];
    const n = linesA.length;
    const m = linesB.length;

    for (let i = 0; i <= n; i++) {
      matrix[i] = new Array(m + 1).fill(0);
    }

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        let match = false;
        if (this.ignoreCase) {
          match = linesA[i - 1].toLowerCase() === linesB[j - 1].toLowerCase();
        } else {
          match = linesA[i - 1] === linesB[j - 1];
        }

        if (match) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }

    // Lần ngược ma trận để xây dựng danh sách diff items
    let i = n;
    let j = m;
    const diff = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        let match = false;
        if (this.ignoreCase) {
          match = linesA[i - 1].toLowerCase() === linesB[j - 1].toLowerCase();
        } else {
          match = linesA[i - 1] === linesB[j - 1];
        }

        if (match) {
          diff.unshift({
            type: "same",
            lineA: i,
            lineB: j,
            textA: linesA[i - 1],
            textB: linesB[j - 1]
          });
          i--;
          j--;
          continue;
        }
      }

      if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
        diff.unshift({
          type: "added",
          lineA: null,
          lineB: j,
          textA: "",
          textB: linesB[j - 1]
        });
        j--;
      } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
        diff.unshift({
          type: "removed",
          lineA: i,
          lineB: null,
          textA: linesA[i - 1],
          textB: ""
        });
        i--;
      }
    }

    // Tính toán thống kê
    let addedCount = 0;
    let removedCount = 0;
    let sameCount = 0;

    diff.forEach(item => {
      if (item.type === "added") addedCount++;
      else if (item.type === "removed") removedCount++;
      else sameCount++;
    });

    const totalLines = diff.length;
    const similarity = totalLines > 0 ? Math.round((sameCount / (sameCount + addedCount + removedCount)) * 100) : 100;

    return {
      diff,
      stats: {
        totalLines,
        addedCount,
        removedCount,
        sameCount,
        similarity
      }
    };
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

  renderDiffHtml(diffResult, viewMode = "split") {
    const { diff } = diffResult;

    if (viewMode === "split") {
      let leftHtml = "";
      let rightHtml = "";

      diff.forEach(item => {
        if (item.type === "same") {
          leftHtml += `<div class="diff-line diff-same"><span class="diff-num">${item.lineA}</span><span class="diff-text">${this.escapeHtml(item.textA) || "&nbsp;"}</span></div>`;
          rightHtml += `<div class="diff-line diff-same"><span class="diff-num">${item.lineB}</span><span class="diff-text">${this.escapeHtml(item.textB) || "&nbsp;"}</span></div>`;
        } else if (item.type === "removed") {
          leftHtml += `<div class="diff-line diff-removed"><span class="diff-num">${item.lineA}</span><span class="diff-text">- ${this.escapeHtml(item.textA) || "&nbsp;"}</span></div>`;
          rightHtml += `<div class="diff-line diff-empty"><span class="diff-num"></span><span class="diff-text">&nbsp;</span></div>`;
        } else if (item.type === "added") {
          leftHtml += `<div class="diff-line diff-empty"><span class="diff-num"></span><span class="diff-text">&nbsp;</span></div>`;
          rightHtml += `<div class="diff-line diff-added"><span class="diff-num">${item.lineB}</span><span class="diff-text">+ ${this.escapeHtml(item.textB) || "&nbsp;"}</span></div>`;
        }
      });

      return {
        leftHtml,
        rightHtml
      };
    } else {
      // Unified Mode
      let unifiedHtml = "";
      diff.forEach(item => {
        if (item.type === "same") {
          unifiedHtml += `<div class="diff-line diff-same"><span class="diff-num">${item.lineA || ""}</span><span class="diff-num">${item.lineB || ""}</span><span class="diff-text">  ${this.escapeHtml(item.textA) || "&nbsp;"}</span></div>`;
        } else if (item.type === "removed") {
          unifiedHtml += `<div class="diff-line diff-removed"><span class="diff-num">${item.lineA}</span><span class="diff-num"></span><span class="diff-text">- ${this.escapeHtml(item.textA) || "&nbsp;"}</span></div>`;
        } else if (item.type === "added") {
          unifiedHtml += `<div class="diff-line diff-added"><span class="diff-num"></span><span class="diff-num">${item.lineB}</span><span class="diff-text">+ ${this.escapeHtml(item.textB) || "&nbsp;"}</span></div>`;
        }
      });
      return { unifiedHtml };
    }
  }
}

window.ToolDiffChecker = ToolDiffChecker;
