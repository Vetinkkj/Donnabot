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
  name: ["nome", "produto", "item", "peca", "descricao do produto"],
  price: ["preco", "valor", "valor unitario", "preco unitario", "preco de venda"],
  stockQuantity: ["estoque", "quantidade", "qtd", "qtde", "quantidade em estoque", "saldo"],
  categoryName: ["categoria", "tipo", "grupo"],
  brand: ["marca", "fabricante"],
  model: ["modelo", "aparelho", "compativel com o modelo"],
  compatibility: ["compatibilidade", "compativel", "compatibilidade com"],
  description: ["descricao", "obs", "observacao", "observacoes"],
  minStock: ["estoque minimo", "minimo", "estoque min"],
  sku: ["sku", "codigo", "cod", "codigo interno"],
  imageUrl: ["imagem", "foto", "url da imagem", "link da imagem"],
};

/** Tenta adivinhar para qual campo do produto cada coluna da planilha corresponde. */
export function guessColumnMapping(headers: string[]): Record<string, ProductFieldKey | "ignore"> {
  const mapping: Record<string, ProductFieldKey | "ignore"> = {};

  for (const header of headers) {
    const normalized = normalizeText(header);
    const match = (Object.keys(HEADER_ALIASES) as ProductFieldKey[]).find((field) =>
      HEADER_ALIASES[field].some((alias) => normalized === alias || normalized.includes(alias))
    );
    mapping[header] = match ?? "ignore";
  }

  return mapping;
}

export type ParsedSpreadsheet = {
  headers: string[];
  rows: Record<string, string>[];
};

async function parseCsv(file: File): Promise<ParsedSpreadsheet> {
  const text = await file.text();
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

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCsv(file);
  return parseExcel(file);
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
