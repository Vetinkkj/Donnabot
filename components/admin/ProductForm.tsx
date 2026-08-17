"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import type { SerializedProduct } from "@/services/stock";

export type ProductFormValues = {
  name: string;
  categoryName: string;
  brand: string;
  model: string;
  compatibility: string;
  description: string;
  price: string;
  stockQuantity: string;
  minStock: string;
  sku: string;
  imageUrl: string;
  active: boolean;
};

function toFormValues(product: SerializedProduct | undefined, defaultMinStock: number): ProductFormValues {
  return {
    name: product?.name ?? "",
    categoryName: product?.categoryName ?? "",
    brand: product?.brand ?? "",
    model: product?.model ?? "",
    compatibility: product?.compatibility ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    stockQuantity: product ? String(product.stockQuantity) : "0",
    minStock: product ? String(product.minStock) : String(defaultMinStock),
    sku: product?.sku ?? "",
    imageUrl: product?.imageUrl ?? "",
    active: product?.active ?? true,
  };
}

type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

export function ProductForm({
  product,
  categoryOptions,
  defaultMinStock = 2,
  onSubmit,
  onCancel,
  submitting,
  fieldErrors,
  formError,
}: {
  product?: SerializedProduct;
  categoryOptions: string[];
  defaultMinStock?: number;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
  fieldErrors?: FieldErrors;
  formError?: string;
}) {
  const [values, setValues] = useState<ProductFormValues>(() => toFormValues(product, defaultMinStock));

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {product ? "Editar produto" : "Adicionar produto"}
      </h2>

      {formError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {formError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nome"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          error={fieldErrors?.name}
          required
        />
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Categoria</span>
          <input
            list="category-options"
            value={values.categoryName}
            onChange={(e) => update("categoryName", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="Ex: Tela"
          />
          <datalist id="category-options">
            {categoryOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <Input
          label="Marca"
          value={values.brand}
          onChange={(e) => update("brand", e.target.value)}
          error={fieldErrors?.brand}
        />
        <Input
          label="Modelo"
          value={values.model}
          onChange={(e) => update("model", e.target.value)}
          error={fieldErrors?.model}
        />
        <Input
          label="Compatibilidade"
          value={values.compatibility}
          onChange={(e) => update("compatibility", e.target.value)}
          error={fieldErrors?.compatibility}
          className="sm:col-span-2"
        />
        <Input
          label="Preço (R$)"
          type="number"
          step="0.01"
          min="0"
          value={values.price}
          onChange={(e) => update("price", e.target.value)}
          error={fieldErrors?.price}
          required
        />
        <Input
          label="SKU"
          value={values.sku}
          onChange={(e) => update("sku", e.target.value)}
          error={fieldErrors?.sku}
          required
        />
        <Input
          label="Quantidade em estoque"
          type="number"
          min="0"
          step="1"
          value={values.stockQuantity}
          onChange={(e) => update("stockQuantity", e.target.value)}
          error={fieldErrors?.stockQuantity}
          required
        />
        <Input
          label="Estoque mínimo"
          type="number"
          min="0"
          step="1"
          value={values.minStock}
          onChange={(e) => update("minStock", e.target.value)}
          error={fieldErrors?.minStock}
          required
        />
        <Input
          label="URL da imagem"
          value={values.imageUrl}
          onChange={(e) => update("imageUrl", e.target.value)}
          error={fieldErrors?.imageUrl}
          className="sm:col-span-2"
          placeholder="https://..."
        />
        <Textarea
          label="Descrição"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          error={fieldErrors?.description}
          className="sm:col-span-2"
          rows={3}
        />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(e) => update("active", e.target.checked)}
          />
          <span className="text-zinc-700 dark:text-zinc-300">Produto ativo</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
