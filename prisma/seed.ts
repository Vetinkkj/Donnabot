import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding banco de dados...");

  const storeData = {
    name: "Loja Exemplo de Peças",
    phone: "+55 11 99999-0000",
    address: "Rua das Peças, 123 - São Paulo/SP",
    botName: "Dona",
    welcomeMessage: "Oi! Aqui é a Dona 👋 Bem-vindo à Loja Exemplo. Em que posso ajudar?",
    paymentMessage: "💳 Pagamento via PIX",
    orderApprovedMessage: "✅ Pagamento confirmado! Seu pedido está sendo processado.",
    defaultMinStock: 2,
  };

  const store = await db.store.upsert({
    where: { id: "store-demo" },
    update: storeData,
    create: { id: "store-demo", ...storeData },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where: { email: "admin@botloja.dev" },
    update: {},
    create: {
      storeId: store.id,
      name: "Dono da Loja",
      email: "admin@botloja.dev",
      passwordHash,
      role: "OWNER",
    },
  });

  const categories = ["Tela", "Bateria", "Câmera", "Conector de Carga", "Capa"];
  const categoryMap = new Map<string, string>();
  for (const name of categories) {
    const category = await db.category.upsert({
      where: { storeId_name: { storeId: store.id, name } },
      update: {},
      create: { storeId: store.id, name },
    });
    categoryMap.set(name, category.id);
  }

  const products = [
    {
      name: "Tela iPhone 11",
      category: "Tela",
      brand: "Apple",
      model: "iPhone 11",
      compatibility: "iPhone 11",
      description: "Tela completa com touch, qualidade OEM.",
      price: 350.0,
      stockQuantity: 4,
      minStock: 2,
      sku: "TEL-IP11-001",
    },
    {
      name: "Tela iPhone XR",
      category: "Tela",
      brand: "Apple",
      model: "iPhone XR",
      compatibility: "iPhone XR",
      description: "Tela completa com touch, qualidade OEM.",
      price: 320.0,
      stockQuantity: 0,
      minStock: 2,
      sku: "TEL-IPXR-001",
    },
    {
      name: "Tela iPhone 13",
      category: "Tela",
      brand: "Apple",
      model: "iPhone 13",
      compatibility: "iPhone 13",
      description: "Tela completa com touch, qualidade OEM.",
      price: 480.0,
      stockQuantity: 3,
      minStock: 2,
      sku: "TEL-IP13-001",
    },
    {
      name: "Bateria iPhone XR",
      category: "Bateria",
      brand: "Apple",
      model: "iPhone XR",
      compatibility: "iPhone XR",
      description: "Bateria nova com capacidade original.",
      price: 120.0,
      stockQuantity: 6,
      minStock: 3,
      sku: "BAT-IPXR-001",
    },
    {
      name: "Bateria iPhone 11",
      category: "Bateria",
      brand: "Apple",
      model: "iPhone 11",
      compatibility: "iPhone 11",
      description: "Bateria nova com capacidade original.",
      price: 130.0,
      stockQuantity: 1,
      minStock: 3,
      sku: "BAT-IP11-001",
    },
    {
      name: "Câmera Traseira iPhone 12",
      category: "Câmera",
      brand: "Apple",
      model: "iPhone 12",
      compatibility: "iPhone 12",
      description: "Módulo de câmera traseira completo.",
      price: 280.0,
      stockQuantity: 2,
      minStock: 2,
      sku: "CAM-IP12-001",
    },
    {
      name: "Conector de Carga iPhone 11",
      category: "Conector de Carga",
      brand: "Apple",
      model: "iPhone 11",
      compatibility: "iPhone 11",
      description: "Flex do conector de carga (dock connector).",
      price: 90.0,
      stockQuantity: 5,
      minStock: 2,
      sku: "CON-IP11-001",
    },
    {
      name: "Capa Transparente iPhone 13",
      category: "Capa",
      brand: "Genérica",
      model: "iPhone 13",
      compatibility: "iPhone 13",
      description: "Capa em TPU transparente antichoque.",
      price: 35.0,
      stockQuantity: 15,
      minStock: 5,
      sku: "CAP-IP13-001",
    },
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { storeId_sku: { storeId: store.id, sku: p.sku } },
      update: {},
      create: {
        storeId: store.id,
        categoryId: categoryMap.get(p.category),
        name: p.name,
        brand: p.brand,
        model: p.model,
        compatibility: p.compatibility,
        description: p.description,
        price: p.price,
        stockQuantity: p.stockQuantity,
        minStock: p.minStock,
        sku: p.sku,
        active: true,
      },
    });
  }

  console.log("Seed concluído.");
  console.log(`Login admin: admin@botloja.dev / senha: admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
