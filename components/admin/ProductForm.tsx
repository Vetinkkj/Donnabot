"use client";

import { FormEvent, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, fieldClass } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusMessage, Switch } from "@/components/admin/page-ui";
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

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-white/[0.06] px-6 py-6 first:border-t-0">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden>
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

/**
 * Cadastro e edição de produto num painel lateral. Os campos seguem o modelo
 * do banco (nada inventado); erros do servidor aparecem ao lado de cada campo.
 */
export function ProductForm({
  open,
  product,
  categoryOptions,
  defaultMinStock = 2,
  onSubmit,
  onClose,
  submitting,
  fieldErrors,
  formError,
}: {
  open: boolean;
  product?: SerializedProduct;
  categoryOptions: string[];
  defaultMinStock?: number;
  onSubmit: (values: ProductFormValues) => void;
  onClose: () => void;
  submitting: boolean;
  fieldErrors?: FieldErrors;
  formError?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const categoryId = useId();
  const [initial] = useState(() => toFormValues(product, defaultMinStock));
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "imageUrl") setImageFailed(false);
  }

  function requestClose() {
    if (submitting) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  const showPreview = /^https?:\/\/\S+$/.test(values.imageUrl.trim()) && !imageFailed;

  return (
    <dialog
      ref={ref}
      aria-label={product ? "Editar produto" : "Novo produto"}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      className="ml-auto mr-0 mt-0 h-dvh max-h-dvh w-full max-w-xl border-0 border-l border-white/10 bg-zinc-950 p-0 text-zinc-100 shadow-2xl shadow-black/60 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{product ? "Editar produto" : "Novo produto"}</h2>
            <p className="text-xs text-zinc-500">
              {product ? "As mudanças valem na hora para a Donna." : "A Donna passa a oferecer o produto assim que você salvar."}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {formError && (
            <div className="px-6 pt-5">
              <StatusMessage tone="error">{formError}</StatusMessage>
            </div>
          )}

          <Group title="Informações principais" description="Como o produto aparece para a Donna e para o cliente.">
            <Input
              label="Nome"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              error={fieldErrors?.name}
              placeholder="Ex.: Tela iPhone 11 Incell"
              required
              autoFocus
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={categoryId} className="text-[13px] font-medium text-zinc-300">
                  Categoria
                </label>
                <input
                  id={categoryId}
                  list={`${categoryId}-options`}
                  value={values.categoryName}
                  onChange={(e) => update("categoryName", e.target.value)}
                  className={fieldClass}
                  placeholder="Ex.: Tela"
                />
                <datalist id={`${categoryId}-options`}>
                  {categoryOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <span className="text-xs text-zinc-500">Escolha uma existente ou digite uma nova.</span>
              </div>
              <Input label="Marca" value={values.brand} onChange={(e) => update("brand", e.target.value)} error={fieldErrors?.brand} placeholder="Ex.: Apple" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Modelo" value={values.model} onChange={(e) => update("model", e.target.value)} error={fieldErrors?.model} placeholder="Ex.: iPhone 11" />
              <Input
                label="Compatibilidade"
                value={values.compatibility}
                onChange={(e) => update("compatibility", e.target.value)}
                error={fieldErrors?.compatibility}
                placeholder="Ex.: A2111, A2221"
              />
            </div>
            <Textarea
              label="Descrição"
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              error={fieldErrors?.description}
              rows={3}
              hint="Opcional. Ajuda a Donna a responder dúvidas sobre o produto."
            />
          </Group>

          <Group title="Preço e estoque">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Preço de venda (R$)"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={values.price}
                onChange={(e) => update("price", e.target.value)}
                error={fieldErrors?.price}
                placeholder="0,00"
                required
              />
              <Input
                label="SKU"
                value={values.sku}
                onChange={(e) => update("sku", e.target.value)}
                error={fieldErrors?.sku}
                hint="Código interno do produto."
                required
              />
              <Input
                label="Quantidade em estoque"
                type="number"
                inputMode="numeric"
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
                inputMode="numeric"
                min="0"
                step="1"
                value={values.minStock}
                onChange={(e) => update("minStock", e.target.value)}
                error={fieldErrors?.minStock}
                hint="Abaixo disso o produto aparece como estoque baixo."
                required
              />
            </div>
          </Group>

          <Group title="Foto" description="A Donna envia essa foto para o cliente no WhatsApp.">
            <div className="flex gap-4">
              <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-600">
                {showPreview ? (
                  // URL externa cadastrada pela loja — <img> evita configurar domínios no next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={values.imageUrl.trim()} alt="Prévia da foto" className="size-full object-cover" onError={() => setImageFailed(true)} />
                ) : (
                  <ImageIcon className="size-6" aria-hidden />
                )}
              </span>
              <Input
                label="Endereço (URL) da foto"
                type="url"
                value={values.imageUrl}
                onChange={(e) => update("imageUrl", e.target.value)}
                error={fieldErrors?.imageUrl ?? (imageFailed ? "Não foi possível carregar essa imagem." : undefined)}
                placeholder="https://…"
                className="flex-1"
              />
            </div>
          </Group>

          <Group title="Disponibilidade">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-sm text-zinc-100">Produto ativo</p>
                <p className="text-xs text-zinc-500">Inativo: some das respostas da Donna, mas continua no catálogo.</p>
              </div>
              <Switch checked={values.active} onChange={(checked) => update("active", checked)} label="Produto ativo" />
            </div>
          </Group>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-4">
          <span className="text-xs text-zinc-500">{dirty ? "Alterações não salvas" : ""}</span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={requestClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} disabled={product ? !dirty : false}>
              {product ? "Salvar alterações" : "Cadastrar produto"}
            </Button>
          </div>
        </footer>
      </form>

      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar alterações?"
        description="Você mudou campos deste produto e ainda não salvou."
        confirmLabel="Descartar"
        tone="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onClose={() => setConfirmDiscard(false)}
      />
    </dialog>
  );
}
