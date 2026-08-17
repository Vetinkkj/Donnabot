import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizedTokens } from "@/lib/text";
import type { ProductInput, ProductUpdateInput } from "@/lib/validations/product";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function getStockStatus(quantity: number, minStock: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= minStock) return "low_stock";
  return "in_stock";
}

type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

export type SerializedProduct = ReturnType<typeof serializeProduct>;

function serializeProduct(product: ProductWithCategory) {
  return {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? null,
    brand: product.brand,
    model: product.model,
    compatibility: product.compatibility,
    description: product.description,
    price: Number(product.price),
    stockQuantity: product.stockQuantity,
    minStock: product.minStock,
    sku: product.sku,
    imageUrl: product.imageUrl,
    active: product.active,
    stockStatus: getStockStatus(product.stockQuantity, product.minStock),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function resolveCategoryId(storeId: string, categoryName?: string) {
  if (!categoryName) return null;
  const category = await db.category.upsert({
    where: { storeId_name: { storeId, name: categoryName } },
    update: {},
    create: { storeId, name: categoryName },
  });
  return category.id;
}

export type ProductFilters = {
  search?: string;
  stockStatus?: StockStatus | "all";
  activeOnly?: boolean;
};

export async function listProducts(storeId: string, filters: ProductFilters = {}) {
  const where: Prisma.ProductWhereInput = {
    storeId,
    ...(filters.activeOnly ? { active: true } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { sku: { contains: filters.search, mode: "insensitive" } },
            { model: { contains: filters.search, mode: "insensitive" } },
            { brand: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const products = await db.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const serialized = products.map(serializeProduct);

  // Estoque baixo/zerado depende de comparar duas colunas da mesma linha
  // (quantidade x mínimo), então o filtro é feito em memória. Para um
  // catálogo muito grande isso migraria para uma view ou coluna calculada.
  if (!filters.stockStatus || filters.stockStatus === "all") return serialized;
  return serialized.filter((product) => product.stockStatus === filters.stockStatus);
}

export async function getProduct(storeId: string, id: string) {
  const product = await db.product.findFirst({
    where: { id, storeId },
    include: { category: true },
  });
  return product ? serializeProduct(product) : null;
}

export async function createProduct(storeId: string, input: ProductInput) {
  const categoryId = await resolveCategoryId(storeId, input.categoryName);

  const product = await db.product.create({
    data: {
      storeId,
      categoryId,
      name: input.name,
      brand: input.brand ?? null,
      model: input.model ?? null,
      compatibility: input.compatibility ?? null,
      description: input.description ?? null,
      price: input.price,
      stockQuantity: input.stockQuantity,
      minStock: input.minStock,
      sku: input.sku,
      imageUrl: input.imageUrl ?? null,
      active: input.active ?? true,
    },
    include: { category: true },
  });

  return serializeProduct(product);
}

export async function updateProduct(storeId: string, id: string, input: ProductUpdateInput) {
  const existing = await db.product.findFirst({ where: { id, storeId } });
  if (!existing) return null;

  const categoryId =
    input.categoryName !== undefined
      ? await resolveCategoryId(storeId, input.categoryName)
      : undefined;

  const product = await db.product.update({
    where: { id },
    data: {
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.brand !== undefined ? { brand: input.brand ?? null } : {}),
      ...(input.model !== undefined ? { model: input.model ?? null } : {}),
      ...(input.compatibility !== undefined ? { compatibility: input.compatibility ?? null } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.stockQuantity !== undefined ? { stockQuantity: input.stockQuantity } : {}),
      ...(input.minStock !== undefined ? { minStock: input.minStock } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl ?? null } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
    include: { category: true },
  });

  return serializeProduct(product);
}

export async function deleteProduct(storeId: string, id: string) {
  const existing = await db.product.findFirst({ where: { id, storeId } });
  if (!existing) return null;

  await db.product.delete({ where: { id } });
  return true;
}

export async function listCategories(storeId: string) {
  return db.category.findMany({ where: { storeId }, orderBy: { name: "asc" } });
}

const CATEGORY_EMOJI: Record<string, string> = {
  tela: "📱",
  bateria: "🔋",
  camera: "📷",
  "conector de carga": "🔌",
  capa: "🛡️",
};

export function getCategoryEmoji(categoryName?: string | null): string {
  if (!categoryName) return "🔧";
  return CATEGORY_EMOJI[normalizedTokens(categoryName).join(" ")] ?? "🔧";
}

/**
 * Busca "tolerante" de produto por texto livre (o que o cliente escreveu no
 * WhatsApp, já limpo pela camada de IA). Não usa IA para decidir o produto —
 * apenas compara tokens de texto contra nome/marca/modelo/compatibilidade/
 * categoria/descrição de cada produto ativo da loja e escolhe o de maior
 * pontuação. Suficiente para um catálogo pequeno/médio; um catálogo muito
 * grande migraria isso para uma busca full-text no banco (ex: Postgres
 * `tsvector` ou Meilisearch/Algolia).
 */
export async function findBestProductMatch(storeId: string, queryText: string) {
  const queryTokens = normalizedTokens(queryText);
  if (queryTokens.length === 0) return null;

  const products = await db.product.findMany({
    where: { storeId, active: true },
    include: { category: true },
  });

  let best: { product: ProductWithCategory; score: number } | null = null;

  for (const product of products) {
    const searchable = normalizedTokens(
      [product.name, product.brand, product.model, product.compatibility, product.category?.name, product.description]
        .filter(Boolean)
        .join(" ")
    ).join(" ");

    const score = queryTokens.filter((token) => searchable.includes(token)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { product, score };
    }
  }

  return best ? serializeProduct(best.product) : null;
}

// ---------------------------------------------------------------------------
// IMPORTAÇÃO VIA PLANILHA
// ---------------------------------------------------------------------------

export type ImportRow = {
  name: string;
  categoryName?: string;
  brand?: string;
  model?: string;
  compatibility?: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  minStock?: number;
  sku?: string;
  imageUrl?: string;
};

export type ImportRowResult = {
  index: number;
  productName: string;
  action: "created" | "updated" | "error";
  error?: string;
};

async function generateUniqueSku(storeId: string, row: ImportRow): Promise<string> {
  const parts = [row.categoryName, row.brand, row.model].filter(Boolean).join(" ") || row.name;
  const base =
    normalizedTokens(parts)
      .map((word) => word.slice(0, 3).toUpperCase())
      .join("-")
      .slice(0, 20) || "PROD";

  let counter = 1;
  let candidate = `${base}-${String(counter).padStart(3, "0")}`;
  while (await db.product.findFirst({ where: { storeId, sku: candidate } })) {
    counter += 1;
    candidate = `${base}-${String(counter).padStart(3, "0")}`;
  }
  return candidate;
}

function describeImportError(error: unknown): string {
  // Erros do Prisma trazem stack trace com trecho da query no `message` —
  // nunca repassar isso pro cliente. Só usamos `.message` para os erros que
  // nós mesmos lançamos de propósito (Error simples, sem `code`).
  if (error instanceof Error && "code" in error) {
    if (error.code === "P2002") return "Já existe um produto com esse SKU";
    return "Erro ao salvar produto no banco de dados";
  }
  if (error instanceof Error) return error.message;
  return "Erro desconhecido";
}

/**
 * Importa produtos de uma planilha. Como a loja pode não ter um código
 * (SKU) próprio ainda, o casamento com produtos existentes é feito pelo
 * NOME (sem acento/maiúsculas) — se bater, atualiza preço/estoque; se não,
 * cria um produto novo com um SKU gerado automaticamente. Cada linha é
 * processada de forma independente: um erro numa linha não impede as
 * outras de serem importadas.
 */
export async function importProducts(storeId: string, rows: ImportRow[]): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = [];
  const store = await db.store.findUniqueOrThrow({ where: { id: storeId } });

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    try {
      const name = row.name?.trim();
      if (!name) throw new Error("Nome vazio");
      if (!Number.isFinite(row.price) || row.price <= 0) throw new Error("Preço inválido");

      const categoryId = row.categoryName ? await resolveCategoryId(storeId, row.categoryName) : undefined;
      const existing = await db.product.findFirst({
        where: { storeId, name: { equals: name, mode: "insensitive" } },
      });

      if (existing) {
        await db.product.update({
          where: { id: existing.id },
          data: {
            price: row.price,
            ...(row.stockQuantity !== undefined ? { stockQuantity: row.stockQuantity } : {}),
            ...(categoryId !== undefined ? { categoryId } : {}),
            ...(row.brand ? { brand: row.brand } : {}),
            ...(row.model ? { model: row.model } : {}),
            ...(row.compatibility ? { compatibility: row.compatibility } : {}),
            ...(row.description ? { description: row.description } : {}),
            ...(row.minStock !== undefined ? { minStock: row.minStock } : {}),
            ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
          },
        });
        results.push({ index, action: "updated", productName: name });
        continue;
      }

      const sku = row.sku?.trim() || (await generateUniqueSku(storeId, row));
      await db.product.create({
        data: {
          storeId,
          categoryId: categoryId ?? null,
          name,
          brand: row.brand ?? null,
          model: row.model ?? null,
          compatibility: row.compatibility ?? null,
          description: row.description ?? null,
          price: row.price,
          stockQuantity: row.stockQuantity ?? 0,
          minStock: row.minStock ?? store.defaultMinStock,
          sku,
          imageUrl: row.imageUrl ?? null,
          active: true,
        },
      });
      results.push({ index, action: "created", productName: name });
    } catch (error) {
      results.push({
        index,
        action: "error",
        productName: row.name || `Linha ${index + 2}`,
        error: describeImportError(error),
      });
    }
  }

  return results;
}
