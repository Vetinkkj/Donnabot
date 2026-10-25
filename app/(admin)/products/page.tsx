"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, ImageIcon, Package, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState, currency, integer } from "@/components/admin/ui";
import {
  ErrorBanner,
  FilterSelect,
  PageHeader,
  SearchField,
  Segmented,
  SkeletonRows,
  StatusMessage,
  Switch,
  tableStyles,
} from "@/components/admin/page-ui";
import { cn } from "@/lib/cn";
import type { SerializedProduct, StockStatus } from "@/services/stock";

type StockFilter = StockStatus | "all";
type ActiveFilter = "all" | "active" | "inactive";
type Sort = "name" | "price-asc" | "price-desc" | "stock-asc";

const STOCK_BADGE: Record<StockStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  in_stock: { label: "Em estoque", tone: "success" },
  low_stock: { label: "Estoque baixo", tone: "warning" },
  out_of_stock: { label: "Sem estoque", tone: "danger" },
};

type FormMode = { type: "closed" } | { type: "create" } | { type: "edit"; product: SerializedProduct };

function Thumb({ url, name }: { url: string | null; name: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-600">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa cadastrada pela loja
        <img src={url} alt="" className="size-full object-cover" loading="lazy" title={name} />
      ) : (
        <ImageIcon className="size-4" aria-hidden />
      )}
    </span>
  );
}

export default function ProductsPage() {
  // Atalhos vindos do dashboard: /products?busca=Nome e /products?estoque=baixo|esgotado.
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<SerializedProduct[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("busca") ?? "");
  const [stockFilter, setStockFilter] = useState<StockFilter>(() => {
    const estoque = searchParams.get("estoque");
    return estoque === "baixo" ? "low_stock" : estoque === "esgotado" ? "out_of_stock" : "all";
  });
  const [category, setCategory] = useState("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [defaultMinStock, setDefaultMinStock] = useState(2);

  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<SerializedProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar produtos");
      setProducts(json.data);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Erro ao carregar produtos");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 0);
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
    return () => clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Busca + categoria + ativo (base das contagens de estoque).
  const base = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (category !== "all" && (p.categoryName ?? "") !== category) return false;
      if (activeFilter === "active" && !p.active) return false;
      if (activeFilter === "inactive" && p.active) return false;
      if (!term) return true;
      return [p.name, p.sku, p.brand, p.model, p.compatibility].some((field) => (field ?? "").toLowerCase().includes(term));
    });
  }, [products, search, category, activeFilter]);

  const counts = useMemo(
    () => ({
      all: base.length,
      in_stock: base.filter((p) => p.stockStatus === "in_stock").length,
      low_stock: base.filter((p) => p.stockStatus === "low_stock").length,
      out_of_stock: base.filter((p) => p.stockStatus === "out_of_stock").length,
    }),
    [base]
  );

  const visible = useMemo(() => {
    const list = stockFilter === "all" ? base : base.filter((p) => p.stockStatus === stockFilter);
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "stock-asc") sorted.sort((a, b) => a.stockQuantity - b.stockQuantity);
    return sorted;
  }, [base, stockFilter, sort]);

  const categoriesInUse = useMemo(
    () => [...new Set((products ?? []).map((p) => p.categoryName).filter((c): c is string => Boolean(c)))].sort(),
    [products]
  );
  const activeCount = (products ?? []).filter((p) => p.active).length;
  const hasFilters = search !== "" || stockFilter !== "all" || category !== "all" || activeFilter !== "all";

  function resetFilters() {
    setSearch("");
    setStockFilter("all");
    setCategory("all");
    setActiveFilter("all");
  }

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

  function closeForm() {
    setFormMode({ type: "closed" });
    setFormError(undefined);
    setFieldErrors(undefined);
  }

  async function handleSave(values: ProductFormValues) {
    const editing = formMode.type === "edit" ? formMode.product : null;
    setSubmitting(true);
    setFormError(undefined);
    setFieldErrors(undefined);
    try {
      const res = await fetch(editing ? `/api/admin/products/${editing.id}` : "/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Erro ao salvar produto");
        setFieldErrors(flattenIssues(json.issues));
        return;
      }
      closeForm();
      setNotice(editing ? `“${values.name}” atualizado.` : `“${values.name}” cadastrado.`);
      await loadProducts();
    } catch {
      setFormError("Erro de conexão ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(product: SerializedProduct, active: boolean) {
    setToggling(product.id);
    // otimista: muda na hora e volta se o servidor recusar
    setProducts((list) => list?.map((p) => (p.id === product.id ? { ...p, active } : p)) ?? list);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProducts((list) => list?.map((p) => (p.id === product.id ? { ...p, active: !active } : p)) ?? list);
      setListError(`Não foi possível ${active ? "ativar" : "desativar"} “${product.name}”. Tente de novo.`);
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/products/${toDelete.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Erro ao excluir produto");
      setNotice(`“${toDelete.name}” excluído.`);
      setToDelete(null);
      await loadProducts();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Erro de conexão ao excluir produto");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5">
      <PageHeader
        title="Produtos"
        description={
          products === null
            ? "Carregando catálogo…"
            : `${integer.format(products.length)} ${products.length === 1 ? "produto" : "produtos"} · ${integer.format(activeCount)} ativos para a Donna vender`
        }
        actions={
          <>
            <Link
              href="/products/import"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              <FileSpreadsheet className="size-4" aria-hidden />
              Importar planilha
            </Link>
            <Button onClick={() => setFormMode({ type: "create" })}>
              <Plus className="size-4" aria-hidden />
              Novo produto
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <Segmented<StockFilter>
          label="Estoque"
          value={stockFilter}
          onChange={setStockFilter}
          options={[
            { value: "all", label: "Todos", count: counts.all },
            { value: "in_stock", label: "Em estoque", count: counts.in_stock },
            { value: "low_stock", label: "Estoque baixo", count: counts.low_stock },
            { value: "out_of_stock", label: "Sem estoque", count: counts.out_of_stock },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={search} onChange={setSearch} placeholder="Nome, SKU, marca ou modelo" label="Buscar produtos" className="w-full sm:w-64" />
          {categoriesInUse.length > 0 && (
            <FilterSelect<string>
              label="Categoria"
              value={category}
              onChange={setCategory}
              options={[{ value: "all", label: "Todas as categorias" }, ...categoriesInUse.map((c) => ({ value: c, label: c }))]}
            />
          )}
          <FilterSelect<ActiveFilter>
            label="Situação"
            value={activeFilter}
            onChange={setActiveFilter}
            options={[
              { value: "all", label: "Ativos e inativos" },
              { value: "active", label: "Só ativos" },
              { value: "inactive", label: "Só inativos" },
            ]}
          />
          <FilterSelect<Sort>
            label="Ordenar"
            value={sort}
            onChange={setSort}
            options={[
              { value: "name", label: "Nome (A–Z)" },
              { value: "price-asc", label: "Menor preço" },
              { value: "price-desc", label: "Maior preço" },
              { value: "stock-asc", label: "Menor estoque" },
            ]}
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {notice && <StatusMessage tone="success">{notice}</StatusMessage>}
      {listError && <ErrorBanner message={listError} onRetry={loadProducts} />}

      <div className={cn(tableStyles.wrap, "dash-enter")}>
        {products === null && !listError && <SkeletonRows rows={8} />}

        {products && products.length === 0 && (
          <EmptyState
            icon={Package}
            title="Seu catálogo está vazio"
            description="Cadastre os produtos para a Donna consultar preço e estoque quando o cliente perguntar. Dá para importar tudo de uma planilha."
            action={{ href: "/products/import", label: "Importar planilha" }}
            className="py-16"
          />
        )}

        {products && products.length > 0 && visible.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchX className="size-6 text-zinc-500" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-200">Nenhum produto com esses filtros</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={resetFilters}>
              Limpar filtros
            </Button>
          </div>
        )}

        {visible.length > 0 && (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead className={tableStyles.head}>
                <tr>
                  <th scope="col" className={tableStyles.th}>Produto</th>
                  <th scope="col" className={cn(tableStyles.th, "hidden lg:table-cell")}>SKU</th>
                  <th scope="col" className={cn(tableStyles.th, "hidden xl:table-cell")}>Categoria</th>
                  <th scope="col" className={cn(tableStyles.th, "text-right")}>Preço</th>
                  <th scope="col" className={tableStyles.th}>Estoque</th>
                  <th scope="col" className={tableStyles.th}>Ativo</th>
                  <th scope="col" className={cn(tableStyles.th, "w-24")}>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const stock = STOCK_BADGE[product.stockStatus];
                  return (
                    <tr key={product.id} className={cn(tableStyles.row, !product.active && "opacity-60")}>
                      <td className={tableStyles.td}>
                        <span className="flex items-center gap-3">
                          <Thumb url={product.imageUrl} name={product.name} />
                          <span className="min-w-0">
                            <span className="block max-w-[320px] truncate font-medium text-zinc-100">{product.name}</span>
                            {(product.brand || product.model) && (
                              <span className="block truncate text-xs text-zinc-500">
                                {[product.brand, product.model].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className={cn(tableStyles.td, "hidden font-mono text-xs text-zinc-400 lg:table-cell")}>{product.sku}</td>
                      <td className={cn(tableStyles.td, "hidden text-zinc-400 xl:table-cell")}>{product.categoryName ?? <span className="text-zinc-600">—</span>}</td>
                      <td className={cn(tableStyles.td, "text-right font-medium tabular-nums text-zinc-100")}>{currency.format(product.price)}</td>
                      <td className={tableStyles.td}>
                        <span className="flex flex-col items-start gap-1">
                          <Badge tone={stock.tone}>{stock.label}</Badge>
                          <span className="text-xs tabular-nums text-zinc-500">
                            {product.stockQuantity} un. · mín. {product.minStock}
                          </span>
                        </span>
                      </td>
                      <td className={tableStyles.td}>
                        <Switch
                          size="sm"
                          checked={product.active}
                          disabled={toggling === product.id}
                          onChange={(active) => handleToggleActive(product, active)}
                          label={`${product.active ? "Desativar" : "Ativar"} ${product.name}`}
                        />
                      </td>
                      <td className={tableStyles.td}>
                        <span className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setFormMode({ type: "edit", product })}
                            aria-label={`Editar ${product.name}`}
                            className="grid size-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-500"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setToDelete(product);
                            }}
                            aria-label={`Excluir ${product.name}`}
                            className="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-emerald-500"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Celular: lista compacta; tocar abre a edição */}
            <ul className="md:hidden">
              {visible.map((product) => {
                const stock = STOCK_BADGE[product.stockStatus];
                return (
                  <li key={product.id} className={cn("flex items-center gap-3 border-t border-white/[0.05] px-4 py-3 first:border-t-0", !product.active && "opacity-60")}>
                    <button type="button" onClick={() => setFormMode({ type: "edit", product })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <Thumb url={product.imageUrl} name={product.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-100">{product.name}</span>
                        <span className="mt-1 flex items-center gap-2">
                          <Badge tone={stock.tone}>{product.stockQuantity} un.</Badge>
                          <span className="text-sm font-medium tabular-nums text-zinc-200">{currency.format(product.price)}</span>
                        </span>
                      </span>
                    </button>
                    <Switch
                      size="sm"
                      checked={product.active}
                      disabled={toggling === product.id}
                      onChange={(active) => handleToggleActive(product, active)}
                      label={`${product.active ? "Desativar" : "Ativar"} ${product.name}`}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {formMode.type !== "closed" && (
        <ProductForm
          key={formMode.type === "edit" ? formMode.product.id : "create"}
          open
          product={formMode.type === "edit" ? formMode.product : undefined}
          categoryOptions={categoryNames}
          defaultMinStock={defaultMinStock}
          submitting={submitting}
          formError={formError}
          fieldErrors={fieldErrors}
          onClose={closeForm}
          onSubmit={handleSave}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        tone="danger"
        title={`Excluir “${toDelete?.name ?? ""}”?`}
        description="O produto sai do catálogo e a Donna para de oferecê-lo. Isso não pode ser desfeito. Se for só temporário, prefira desativar."
        confirmLabel="Excluir produto"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

function flattenIssues(issues?: Record<string, string[]>): Record<string, string> | undefined {
  if (!issues) return undefined;
  return Object.fromEntries(Object.entries(issues).map(([key, value]) => [key, value[0]]));
}
