import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline";

/**
 * Recupera o acesso ao painel quando ninguém lembra a senha.
 *
 *   npx tsx --env-file=.env.production.local scripts/admin-access.ts list
 *     → lista os usuários (e-mail, loja, se é platform admin) — nunca mostra senha
 *
 *   npx tsx --env-file=.env.production.local scripts/admin-access.ts reset voce@exemplo.com
 *     → pede a nova senha (sem mostrar na tela) e:
 *        - se o e-mail já existe: troca a senha e promove a platform admin
 *        - se não existe: cria o usuário (OWNER + platform admin) na primeira loja do banco
 *
 *   npx tsx scripts/admin-access.ts hash
 *     → só gera o hash da senha (não acessa o banco), pra quando o DATABASE_URL
 *       de produção não está disponível (na Vercel ele é "Sensitive" e não dá
 *       pra baixar) — cole o hash num UPDATE no SQL Editor do Supabase.
 *
 * Não apaga nada. A senha nunca vai como argumento pra não ficar no histórico do terminal.
 */

const db = new PrismaClient();

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    let muted = false;
    output._writeToOutput = (s: string) => {
      if (!muted) output.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function list() {
  const users = await db.user.findMany({
    select: { email: true, name: true, role: true, isPlatformAdmin: true, store: { select: { name: true, status: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (users.length === 0) {
    console.log("Nenhum usuário no banco.");
    return;
  }
  for (const user of users) {
    console.log(
      `${user.email}  |  ${user.name}  |  ${user.role}${user.isPlatformAdmin ? " + platform admin" : ""}  |  loja: ${user.store.name} (${user.store.status})`
    );
  }
}

async function reset(email: string) {
  const password = await askHidden("Nova senha (mínimo 8 caracteres): ");
  if (password.length < 8) throw new Error("Senha muito curta — use pelo menos 8 caracteres.");
  const confirmation = await askHidden("Repita a senha: ");
  if (password !== confirmation) throw new Error("As senhas não conferem.");

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    await db.user.update({ where: { email }, data: { passwordHash, isPlatformAdmin: true } });
    console.log(`Senha de ${email} redefinida (e promovido a platform admin).`);
    return;
  }

  const store = await db.store.findFirst({ orderBy: { createdAt: "asc" } });
  if (!store) throw new Error("Nenhuma loja no banco — rode o seed primeiro (npm run db:seed).");

  await db.user.create({
    data: { storeId: store.id, name: "Administrador", email, passwordHash, role: "OWNER", isPlatformAdmin: true },
  });
  console.log(`Usuário ${email} criado na loja "${store.name}" como OWNER + platform admin.`);
}

/** Só gera o hash bcrypt (sem tocar no banco) — pra colar num UPDATE no SQL Editor do Supabase. */
async function hash() {
  const password = await askHidden("Nova senha (mínimo 8 caracteres): ");
  if (password.length < 8) throw new Error("Senha muito curta — use pelo menos 8 caracteres.");
  const confirmation = await askHidden("Repita a senha: ");
  if (password !== confirmation) throw new Error("As senhas não conferem.");
  console.log(await bcrypt.hash(password, 10));
}

async function main() {
  const [command, email] = process.argv.slice(2);
  if (command === "hash") return hash();
  if (command === "list") return list();
  if (command === "reset" && email) return reset(email.trim());
  console.log("Uso: scripts/admin-access.ts hash | list | reset <email>");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
