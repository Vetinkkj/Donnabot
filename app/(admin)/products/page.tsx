"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import type { SerializedProduct, StockStatus } from "@/services/stock";

type StockFilter = StockStatus | "all";

const STOCK_FILTERS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "low_stock", label: "Estoque baixo" },
  { value: "out_of_stock", label: "Sem estoque" },
];

const STOCK_BADGE: Record<StockStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  in_stock: { label: "Em estoque", tone: "success" },
  low_stock: { label: "Estoque baixo", tone: "warning" },
  out_of_stock: { label: "Sem estoque", tone: "danger" },
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type FormMode = { type: "closed" } | { type: "create" } | { type: "edit"; product: SerializedProduct };

export default function ProductsPage() {
  const [products, setProducts] = useState<SerializedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [defaultMinStock, setDefaultMinStock] = useState(2);

  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stockFilter !== "all") params.set("stockStatus", stockFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar produtos");
      setProducts(json.data);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, [search, stockFilter]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((json) => setCategoryNames((json.data ?? []).map((c: { name: string }) => c.name)))
      .catch(() => setCategoryNames([]));

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (typeof json.data?.defaultMinStock === "number") setDefaultMinStock(json.data.defaultMinStock);
      })
      .catch(() => {});
  }, []);

  const counts = useMemo(
    () => ({
      low: products.filter((p) => p.stockStatus === "low_stock").length,
      out: products.filter((p) => p.stockStatus === "out_of_stock").length,
    }),
    [products]
  );

  function toPayload(values: ProductFormValues) {
    return {
      name: values.name,
      categoryName: values.categoryName,
      brand: values.brand,
      model: values.model,
      compatibility: values.compatibility,
      description: values.description,
      price: values.price,
      stockQuantity: values.stockQuantity,
      minStock: values.minStock,
      sku: values.sku,
      imageUrl: values.imageUrl,
      active: values.active,
    };
  }

  async function handleCreate(values: ProductFormValues) {
    setSubmitting(true);
    setFormError(undefined);
    setFieldErrors(undefined);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Erro ao salvar produto");
        setFieldErrors(flattenIssues(json.issues));
        return;
      }
      setFormMode({ type: "closed" });
      await loadProducts();
    } catch {
      setFormError("Erro de conexão ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: string, values: ProductFormValues) {
    setSubmitting(true);
    setFormError(undefined);
    setFieldErrors(undefined);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Erro ao salvar produto");
        setFieldErrors(flattenIssues(json.issues));
        return;
      }
      setFormMode({ type: "closed" });
      await loadProducts();
    } catch {
      setFormError("Erro de conexão ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: SerializedProduct) {
    if (!confirm(`Excluir "${product.name}"? Essa ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Erro ao excluir produto");
        return;
      }
      await loadProducts();
    } catch {
      alert("Erro de conexão ao excluir produto");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Produtos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {counts.out > 0 && `${counts.out} sem estoque`}
            {counts.out > 0 && counts.low > 0 && " · "}
            {counts.low > 0 && `${counts.low} com estoque baixo`}
            {counts.out === 0 && counts.low === 0 && "Estoque em dia"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/products/import">
            <Button variant="secondary">📄 Importar planilha</Button>
          </Link>
          <Button onClick={() => setFormMode({ type: "create" })}>+ Adicionar produto</Button>
        </div>
      </div>

      {formMode.type !== "closed" && (
        <ProductForm
          key={formMode.type === "edit" ? formMode.product.id : "create"}
          product={formMode.type === "edit" ? formMode.product : undefined}
          categoryOptions={categoryNames}
          defaultMinStock={defaultMinStock}
          submitting={submitting}
          formError={formError}
          fieldErrors={fieldErrors}
          onCancel={() => {
            setFormMode({ type: "closed" });
            setFormError(undefined);
            setFieldErrors(undefined);
          }}
          onSubmit={(values) =>
            formMode.type === "edit" ? handleUpdate(formMode.product.id, values) : handleCreate(values)
          }
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nome, SKU, marca ou modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
        <div className="flex gap-1">
          {STOCK_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStockFilter(filter.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                stockFilter === filter.value
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {listError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {listError}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {["Produto", "Categoria", "SKU", "Preço", "Estoque", "Status", "Ações"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-2">
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">{product.name}</div>
                    <div className="text-xs text-zinc-500">{product.brand} {product.model}</div>
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {product.categoryName ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{product.sku}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {currency.format(product.price)}
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {product.stockQuantity} (mín. {product.minStock})
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={STOCK_BADGE[product.stockStatus].tone}>
                      {STOCK_BADGE[product.stockStatus].label}
                    </Badge>
                    {!product.active && (
                      <span className="ml-1">
                        <Badge tone="neutral">Inativo</Badge>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="px-2 py-1"
                        onClick={() => setFormMode({ type: "edit", product })}
                      >
                        Editar
                      </Button>
                      <Button variant="danger" className="px-2 py-1" onClick={() => handleDelete(product)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function flattenIssues(issues?: Record<string, string[]>): Record<string, string> | undefined {
  if (!issues) return undefined;
  return Object.fromEntries(Object.entries(issues).map(([key, value]) => [key, value[0]]));
}
