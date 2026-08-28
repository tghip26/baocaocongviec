/**
 * tool-schema-lookup.js
 * Comprehensive Semantic Database Schema & Column Variable Lookup Engine for VIMES.
 * Fast multi-dimensional search: variable name, Vietnamese description, table name, topic & prefix conventions.
 */

class SchemaLookupEngine {
  constructor() {
    this.schema = window.VIMES_SCHEMA || { metadata: {}, sections: [], tables: [] };
    this.searchMode = "column"; // "column" | "table"
    this.selectedSection = "all";
    this.selectedPrefix = "all";
    this.currentTable = null;
    this.columnInvertedIndex = new Map();
    this.buildIndex();
  }

  buildIndex() {
    if (!this.schema.tables) return;
    this.columnInvertedIndex.clear();

    this.schema.tables.forEach(table => {
      table.columns.forEach(col => {
        const cLower = col.name.toLowerCase();
        if (!this.columnInvertedIndex.has(cLower)) {
          this.columnInvertedIndex.set(cLower, []);
        }
        this.columnInvertedIndex.get(cLower).push({
          tableName: table.name,
          tableTitle: table.title || table.name,
          tableTopic: table.topic || table.section,
          tableDesc: table.description || "",
          tableSection: table.section,
          tableSectionId: table.sectionId,
          tableType: table.type,
          colName: col.name,
          colDesc: col.description || `Trường ${col.name}`,
          colType: col.type,
          isPk: col.isPk,
          nullable: col.nullable,
          defaultVal: col.default
        });
      });
    });
  }

  /**
   * Search by column name OR column Vietnamese description / meaning
   */
  searchByColumn(query, sectionFilter = "all", prefixFilter = "all") {
    const rawQ = (query || "").trim();
    if (!rawQ) return [];

    const q = rawQ.toLowerCase();
    const qNorm = DocxTableParser ? DocxTableParser.removeAccents(q) : q;

    const matchedItems = [];

    this.schema.tables.forEach(table => {
      if (sectionFilter !== "all" && table.sectionId !== sectionFilter) return;
      if (prefixFilter !== "all" && !table.name.startsWith(prefixFilter)) return;

      const tNameNorm = DocxTableParser ? DocxTableParser.removeAccents(table.name.toLowerCase()) : table.name.toLowerCase();
      const tTitleNorm = DocxTableParser ? DocxTableParser.removeAccents((table.title || "").toLowerCase()) : (table.title || "").toLowerCase();
      const tTopicNorm = DocxTableParser ? DocxTableParser.removeAccents((table.topic || "").toLowerCase()) : (table.topic || "").toLowerCase();

      table.columns.forEach(col => {
        const cNameLower = col.name.toLowerCase();
        const cDescLower = (col.description || "").toLowerCase();
        const cNameNorm = DocxTableParser ? DocxTableParser.removeAccents(cNameLower) : cNameLower;
        const cDescNorm = DocxTableParser ? DocxTableParser.removeAccents(cDescLower) : cDescLower;

        let matchScore = 0;

        if (cNameLower === q) matchScore = 100;
        else if (cNameLower.startsWith(q)) matchScore = 80;
        else if (cNameLower.includes(q)) matchScore = 60;
        else if (cDescNorm.includes(qNorm)) matchScore = 50;
        else if (cNameNorm.includes(qNorm)) matchScore = 40;
        else if (tNameNorm.includes(qNorm) || tTitleNorm.includes(qNorm) || tTopicNorm.includes(qNorm)) matchScore = 30;

        if (matchScore > 0) {
          matchedItems.push({
            score: matchScore,
            tableName: table.name,
            tableTitle: table.title || table.name,
            tableTopic: table.topic || table.section,
            tableDesc: table.description || "",
            tableSection: table.section,
            tableSectionId: table.sectionId,
            tableType: table.type,
            colName: col.name,
            colDesc: col.description || `Trường dữ liệu ${col.name}`,
            colType: col.type,
            isPk: col.isPk,
            nullable: col.nullable,
            defaultVal: col.default
          });
        }
      });
    });

    matchedItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.isPk && !b.isPk) return -1;
      if (!a.isPk && b.isPk) return 1;
      return a.tableName.localeCompare(b.tableName);
    });

    return matchedItems;
  }

  /**
   * Search by table name, table Vietnamese title, topic or description
   */
  searchByTable(query, sectionFilter = "all", prefixFilter = "all") {
    const rawQ = (query || "").trim();
    const q = rawQ.toLowerCase();
    const qNorm = DocxTableParser ? DocxTableParser.removeAccents(q) : q;

    const matchedTables = [];

    this.schema.tables.forEach(table => {
      if (sectionFilter !== "all" && table.sectionId !== sectionFilter) return;
      if (prefixFilter !== "all" && !table.name.startsWith(prefixFilter)) return;

      if (!rawQ) {
        matchedTables.push({ score: 1, ...table });
        return;
      }

      const tNameLower = table.name.toLowerCase();
      const tTitleLower = (table.title || "").toLowerCase();
      const tTopicLower = (table.topic || "").toLowerCase();
      const tDescLower = (table.description || "").toLowerCase();

      const tNameNorm = DocxTableParser ? DocxTableParser.removeAccents(tNameLower) : tNameLower;
      const tTitleNorm = DocxTableParser ? DocxTableParser.removeAccents(tTitleLower) : tTitleLower;
      const tTopicNorm = DocxTableParser ? DocxTableParser.removeAccents(tTopicLower) : tTopicLower;
      const tDescNorm = DocxTableParser ? DocxTableParser.removeAccents(tDescLower) : tDescLower;

      let score = 0;
      if (tNameLower === q) score = 100;
      else if (tNameLower.startsWith(q)) score = 80;
      else if (tNameLower.includes(q)) score = 60;
      else if (tTitleNorm.includes(qNorm)) score = 50;
      else if (tTopicNorm.includes(qNorm)) score = 40;
      else if (tDescNorm.includes(qNorm)) score = 30;
      else if (tNameNorm.includes(qNorm)) score = 20;

      if (score > 0) {
        matchedTables.push({ score, ...table });
      }
    });

    matchedTables.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    return matchedTables;
  }

  getTableByName(tableName) {
    if (!tableName) return null;
    const tLower = tableName.trim().toLowerCase();
    return this.schema.tables.find(t => t.name.toLowerCase() === tLower) || null;
  }

  generateSelectSql(table) {
    if (!table || !table.columns) return "";
    const colList = table.columns.map(c => `  ${c.name} -- ${c.description || ''}`).join(",\n");
    const pkCols = table.columns.filter(c => c.isPk).map(c => `${c.name} = ?`);
    const whereClause = pkCols.length > 0 ? `WHERE ${pkCols.join(" AND ")}` : "-- WHERE điều kiện";

    return `-- ===============================================================
-- Bảng: ${table.name} (${table.title || ''})
-- Chủ đề: ${table.topic || table.section}
-- Tổng số cột/biến: ${table.columns.length} cột
-- ===============================================================
SELECT
${colList}
FROM ${table.name}
${whereClause}
LIMIT 100;`;
  }
}

window.schemaLookupEngine = new SchemaLookupEngine();
