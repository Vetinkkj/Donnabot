import ExcelJS from "exceljs";
import Papa from "papaparse";
import { normalizeText } from "@/lib/text";

export type ProductFieldKey =
  | "name"
  | "categoryName"
  | "brand"
  | "model"
  | "compatibility"
  | "description"
  | "price"
  | "stockQuantity"
  | "minStock"
  | "sku"
  | "imageUrl";

export const FIELD_LABELS: Record<ProductFieldKey, string> = {
  name: "Nome (obrigatório)",
  price: "Preço (obrigatório)",
  stockQuantity: "Estoque",
  categoryName: "Categoria",
  brand: "Marca",
  model: "Modelo",
  compatibility: "Compatibilidade",
  description: "Descrição",
  minStock: "Estoque mínimo",
  sku: "SKU / código",
  imageUrl: "URL da imagem",
};

const HEADER_ALIASES: Record<ProductFieldKey, string[]> = {
  name: ["nome", "produto", "item", "peca", "descricao do produto", "nome do produto"],
  price: ["preco", "valor", "valor unitario", "preco unitario", "preco de venda", "valor de venda"],
  stockQuantity: ["estoque", "quantidade", "qtd", "qtde", "quantidade em estoque", "saldo", "estoque atual"],
  categoryName: ["categoria", "tipo", "grupo"],
  brand: ["marca", "fabricante"],
  model: ["modelo", "aparelho", "compativel com o modelo"],
  compatibility: ["compatibilidade", "compativel", "compatibilidade com"],
  description: ["descricao", "obs", "observacao", "observacoes"],
  minStock: ["estoque minimo", "minimo", "estoque min"],
  sku: ["sku", "codigo", "cod", "codigo interno"],
  imageUrl: ["imagem", "foto", "url da imagem", "link da imagem"],
};

// Colunas que parecem um campo mas são outra coisa ("Estoque Max.", "Sub Categoria",
// "Código Ref.", "Código Extra"...). Só entram se baterem exatamente com um apelido.
const QUALIFIER_WORDS = new Set(["max", "maximo", "sub", "extra", "ref", "referencia", "barras", "anterior", "custo", "compra"]);

/** Pontuação de quanto um cabeçalho parece com um campo: 0 = não parece. */
function scoreHeader(normalized: string, field: ProductFieldKey): number {
  let best = 0;
  const padded = ` ${normalized} `;
  const hasQualifier = normalized.split(" ").some((word) => QUALIFIER_WORDS.has(word));
  for (const alias of HEADER_ALIASES[field]) {
    if (normalized === alias) best = Math.max(best, 1000);
    else if (!hasQualifier && padded.includes(` ${alias} `)) best = Math.max(best, alias.length);
  }
  return best;
}

/**
 * Tenta adivinhar para qual campo do produto cada coluna da planilha corresponde.
 * Cada campo vai para no máximo uma coluna (a que bater melhor), senão uma coluna
 * como "Sub Categoria" sobrescreveria a "Categoria" na hora de montar o produto.
 */
export function guessColumnMapping(headers: string[]): Record<string, ProductFieldKey | "ignore"> {
  const mapping: Record<string, ProductFieldKey | "ignore"> = {};
  const candidates: { header: string; field: ProductFieldKey; score: number }[] = [];

  for (const header of headers) {
    mapping[header] = "ignore";
    const normalized = normalizeText(header);
    for (const field of Object.keys(HEADER_ALIASES) as ProductFieldKey[]) {
      const score = scoreHeader(normalized, field);
      if (score > 0) candidates.push({ header, field, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const usedFields = new Set<ProductFieldKey>();
  const usedHeaders = new Set<string>();
  for (const { header, field } of candidates) {
    if (usedFields.has(field) || usedHeaders.has(header)) continue;
    mapping[header] = field;
    usedFields.add(field);
    usedHeaders.add(header);
  }

  return mapping;
}

export type ParsedSpreadsheet = {
  headers: string[];
  rows: Record<string, string>[];
};

/**
 * O Excel no Brasil salva CSV em Windows-1252 ("ANSI"), não UTF-8. Ler como UTF-8
 * vira "Pre�o", e aí nenhuma coluna com acento é reconhecida. Tenta UTF-8 primeiro
 * (estrito) e, se não for válido, cai para Windows-1252.
 */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

async function parseCsv(file: File): Promise<ParsedSpreadsheet> {
  const text = decodeText(await file.arrayBuffer());
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data };
}

async function parseExcel(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { headers: [], rows: [] };

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, string>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      record[header] = cellValueToString(cell.value);
    });
    if (Object.values(record).some((value) => value.trim() !== "")) rows.push(record);
  });

  return { headers: headers.filter(Boolean), rows };
}

function cellValueToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((part) => part.text).join("");
  }
  if (typeof value === "object" && "text" in value) return String(value.text ?? "");
  if (typeof value === "object" && "result" in value) return String(value.result ?? "");
  return String(value);
}

/**
 * Lê .xls antigo (Excel 97-2003) e também os ".xls" que muitos sistemas de loja
 * exportam e que na verdade são HTML/texto. O ExcelJS só entende .xlsx; o SheetJS
 * é carregado só quando precisa, para não pesar na página.
 */
async function parseWithSheetJs(file: File): Promise<ParsedSpreadsheet> {
  const XLSX = await import("xlsx");
  const cptable = await import("xlsx/dist/cpexcel.full.mjs");
  XLSX.set_cptable(cptable);

  const bytes = new Uint8Array(await file.arrayBuffer());
  // .xls de verdade começa com a assinatura OLE (D0 CF 11 E0) e .xlsx com a do ZIP ("PK").
  // O resto é HTML/texto: decodifica antes (UTF-8 ou Windows-1252), senão os acentos quebram.
  const isBinary =
    (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) ||
    (bytes[0] === 0x50 && bytes[1] === 0x4b);
  const workbook = isBinary
    ? XLSX.read(bytes, { type: "array", codepage: 1252 })
    : XLSX.read(decodeText(bytes.buffer), { type: "string", raw: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) return { headers: [], rows: [] };

  const table = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: true, defval: "" });
  const [headerRow = [], ...dataRows] = table;
  const headers = headerRow.map((value) => String(value ?? "").trim());

  const rows: Record<string, string>[] = [];
  for (const dataRow of dataRows) {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const value = dataRow[index];
      record[header] = value === null || value === undefined ? "" : String(value);
    });
    if (Object.values(record).some((value) => value.trim() !== "")) rows.push(record);
  }

  return { headers: headers.filter(Boolean), rows };
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) return parseCsv(file);
  if (name.endsWith(".xls")) return parseWithSheetJs(file);
  try {
    return await parseExcel(file);
  } catch {
    // Arquivo com extensão .xlsx mas em outro formato: tenta o leitor mais tolerante.
    return parseWithSheetJs(file);
  }
}

/** Converte texto de preço em formato brasileiro ("R$ 1.050,00") para número. */
export function parsePriceBR(raw: string | number | undefined): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return null;

  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

export function parseIntBR(raw: string | number | undefined): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw) : null;
  if (!raw) return null;

  const digits = raw.replace(/[^\d-]/g, "");
  if (!digits) return null;

  const value = parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}
