"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FIELD_LABELS,
  guessColumnMapping,
  parseIntBR,
  parsePriceBR,
  parseSpreadsheetFile,
  type ParsedSpreadsheet,
  type ProductFieldKey,
} from "@/lib/spreadsheet";

type ColumnMapping = Record<string, ProductFieldKey | "ignore">;

type BuiltRow = {
  name: string;
  price: number | null;
  categoryName?: string;
  brand?: string;
  model?: string;
  compatibility?: string;
  description?: string;
  stockQuantity?: number;
  minStock?: number;
  sku?: string;
  imageUrl?: string;
  issues: string[];
};

const FIELD_OPTIONS: (ProductFieldKey | "ignore")[] = ["ignore", ...(Object.keys(FIELD_LABELS) as ProductFieldKey[])];

function buildRow(raw: Record<string, string>, mapping: ColumnMapping): BuiltRow {
  const values: Partial<Record<ProductFieldKey, string>> = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (field === "ignore") continue;
    values[field] = raw[header];
  }

  const issues: string[] = [];
  const name = values.name?.trim() ?? "";
  if (!name) issues.push("sem nome");

  const price = parsePriceBR(values.price);
  if (price === null || price <= 0) issues.push("preço inválido");

  return {
    name,
    price,
    categoryName: values.categoryName?.trim() || undefined,
    brand: values.brand?.trim() || undefined,
    model: values.model?.trim() || undefined,
    compatibility: values.compatibility?.trim() || undefined,
    description: values.description?.trim() || undefined,
    stockQuantity: values.stockQuantity ? (parseIntBR(values.stockQuantity) ?? undefined) : undefined,
    minStock: values.minStock ? (parseIntBR(values.minStock) ?? undefined) : undefined,
    sku: values.sku?.trim() || undefined,
    imageUrl: values.imageUrl?.trim() || undefined,
    issues,
  };
}

type ImportSummary = {
  results: Array<{ index: number; productName: string; action: "created" | "updated" | "error"; error?: string }>;
  summary: { created: number; updated: number; errors: number };
};

export default function ImportProductsPage() {
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);

  async function handleFile(file: File) {
    setParsing(true);
    setParseError(null);
    setImportResult(null);
    try {
      const result = await parseSpreadsheetFile(file);
      if (result.rows.length === 0) {
        setParseError("Não encontrei linhas de dados nessa planilha.");
        setParsed(null);
        return;
      }
      setParsed(result);
      setMapping(guessColumnMapping(result.headers));
    } catch {
      setParseError("Não consegui ler esse arquivo. Confira se é um .xlsx ou .csv válido.");
      setParsed(null);
    } finally {
      setParsing(false);
    }
  }

  const builtRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.map((row) => buildRow(row, mapping));
  }, [parsed, mapping]);

  const validRows = builtRows.filter((row) => row.issues.length === 0);
  const hasNameMapped = Object.values(mapping).includes("name");
  const hasPriceMapped = Object.values(mapping).includes("price");

  async function handleImport() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = validRows.map((row) => ({
        name: row.name,
        price: row.price as number,
        categoryName: row.categoryName,
        brand: row.brand,
        model: row.model,
        compatibility: row.compatibility,
        description: row.description,
        stockQuantity: row.stockQuantity,
        minStock: row.minStock,
        sku: row.sku,
        imageUrl: row.imageUrl,
      }));

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Erro ao importar");
        return;
      }
      setSkippedCount(builtRows.length - validRows.length);
      setImportResult(json.data);
    } catch {
      setSubmitError("Erro de conexão ao importar");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setParsed(null);
    setMapping({});
    setImportResult(null);
    setParseError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/products" className="text-sm text-zinc-500 underline">
          ← Voltar para produtos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Importar planilha</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Envie a planilha (.xlsx ou .csv) que a loja já usa. Produtos com o mesmo nome de um já cadastrado são
          atualizados (preço/estoque); os demais são criados com um código gerado automaticamente.
        </p>
      </div>

      {importResult ? (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Importação concluída</h2>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{importResult.summary.created} criados</Badge>
            <Badge tone="neutral">{importResult.summary.updated} atualizados</Badge>
            {importResult.summary.errors > 0 && <Badge tone="danger">{importResult.summary.errors} com erro</Badge>}
            {skippedCount > 0 && <Badge tone="warning">{skippedCount} pulados na pré-validação</Badge>}
          </div>
          {importResult.results.some((r) => r.action === "error") && (
            <ul className="list-inside list-disc text-sm text-red-600">
              {importResult.results
                .filter((r) => r.action === "error")
                .map((r) => (
                  <li key={r.index}>
                    {r.productName}: {r.error}
                  </li>
                ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button onClick={reset}>Importar outra planilha</Button>
            <Link href="/products">
              <Button variant="secondary">Ver produtos</Button>
            </Link>
          </div>
        </div>
      ) : !parsed ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="text-sm"
          />
          {parsing && <p className="mt-2 text-sm text-zinc-500">Lendo planilha...</p>}
          {parseError && <p className="mt-2 text-sm text-red-600">{parseError}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Confira o que cada coluna significa
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {parsed.headers.map((header) => (
                <label key={header} className="flex flex-col gap-1 text-sm">
                  <span className="truncate font-medium text-zinc-600 dark:text-zinc-400" title={header}>
                    {header}
                  </span>
                  <select
                    value={mapping[header] ?? "ignore"}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [header]: e.target.value as ProductFieldKey | "ignore" }))
                    }
                    className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    {FIELD_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option === "ignore" ? "Ignorar esta coluna" : FIELD_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {(!hasNameMapped || !hasPriceMapped) && (
              <p className="mt-3 text-sm text-amber-700">
                Selecione qual coluna é o <strong>Nome</strong> e qual é o <strong>Preço</strong> para continuar.
              </p>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  {["Nome", "Categoria", "Marca/Modelo", "Preço", "Estoque", "Situação"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {builtRows.slice(0, 10).map((row, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{row.name || "—"}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.categoryName ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {[row.brand, row.model].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {row.price !== null ? row.price.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.stockQuantity ?? 0}</td>
                    <td className="px-3 py-2">
                      {row.issues.length === 0 ? (
                        <Badge tone="success">OK</Badge>
                      ) : (
                        <Badge tone="danger">{row.issues.join(", ")}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {builtRows.length > 10 && (
              <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800">
                Mostrando 10 de {builtRows.length} linhas.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {validRows.length} de {builtRows.length} linhas prontas para importar.
            </p>
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={reset}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={submitting || validRows.length === 0 || !hasNameMapped || !hasPriceMapped}
            >
              {submitting ? "Importando..." : `Importar ${validRows.length} produtos`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
