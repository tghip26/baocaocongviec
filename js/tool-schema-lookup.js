/**
 * tool-schema-lookup.js
 * Comprehensive Database Schema & Column Variable Lookup Engine for VIMES (1,170 tables, 20,852 columns).
 * Ultra-fast client-side search, multi-mode filter, reverse variable search, SQL generator.
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
          tableSection: table.section,
          tableSectionId: table.sectionId,
          tableType: table.type,
          colName: col.name,
          colType: col.type,
          isPk: col.isPk,
          nullable: col.nullable,
          defaultVal: col.default
        });
      });
    });
  }

  /**
   * Search by column / variable name
   */
  searchByColumn(query, sectionFilter = "all", prefixFilter = "all") {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];

    const results = [];
    this.columnInvertedIndex.forEach((matches, colNameLower) => {
      if (colNameLower.includes(q)) {
        matches.forEach(item => {
          if (sectionFilter !== "all" && item.tableSectionId !== sectionFilter) return;
          if (prefixFilter !== "all" && !item.tableName.startsWith(prefixFilter)) return;
          results.push(item);
        });
      }
    });

    // Sort: Exact match first, then startsWith, then alphabetical
    results.sort((a, b) => {
      const aExact = a.colName.toLowerCase() === q;
      const bExact = b.colName.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = a.colName.toLowerCase().startsWith(q);
      const bStarts = b.colName.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return a.tableName.localeCompare(b.tableName);
    });

    return results;
  }

  /**
   * Search by table name
   */
  searchByTable(query, sectionFilter = "all", prefixFilter = "all") {
    const q = (query || "").trim().toLowerCase();

    return this.schema.tables.filter(table => {
      if (sectionFilter !== "all" && table.sectionId !== sectionFilter) return;
      if (prefixFilter !== "all" && !table.name.startsWith(prefixFilter)) return;
      if (!q) return true;

      const tName = table.name.toLowerCase();
      const secName = (table.section || "").toLowerCase();
      return tName.includes(q) || secName.includes(q);
    });
  }

  getTableByName(tableName) {
    if (!tableName) return null;
    const tLower = tableName.trim().toLowerCase();
    return this.schema.tables.find(t => t.name.toLowerCase() === tLower) || null;
  }

  /**
   * Generate SQL SELECT Template
   */
  generateSelectSql(table) {
    if (!table || !table.columns) return "";
    const colList = table.columns.map(c => `  ${c.name}`).join(",\n");
    const pkCols = table.columns.filter(c => c.isPk).map(c => `${c.name} = ?`);
    const whereClause = pkCols.length > 0 ? `WHERE ${pkCols.join(" AND ")}` : "-- WHERE condition";

    return `-- Truy vấn dữ liệu bảng: ${table.name} (${table.columns.length} cột)
SELECT
${colList}
FROM ${table.name}
${whereClause}
LIMIT 100;`;
  }
}

window.schemaLookupEngine = new SchemaLookupEngine();
