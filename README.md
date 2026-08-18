# BOTloja

🔗 **Produção:** https://botloja-wine.vercel.app

Automação de atendimento via WhatsApp para lojas de peças de celular: o cliente
pergunta por uma peça, o sistema consulta o estoque automaticamente, informa
preço/disponibilidade e conduz a compra até o pagamento via PIX.

> Projeto construído por etapas, do zero até um MVP funcional completo — as
> 10 etapas do roadmap abaixo estão concluídas. Nenhuma credencial real é
> usada; WhatsApp, pagamento e IA rodam em modo mock por padrão, prontos para
> trocar por um provedor de verdade sem mexer no restante do código.

## Arquitetura

```
WhatsApp (Meta Cloud API ou mock)
        │
        ▼
services/whatsapp  ──►  services/conversation (estado da conversa, carrinho)
        │                       │
        ▼                       ▼
services/ai (NLU)  ──►  services/stock (produto, preço, estoque — sempre do banco)
                                │
                                ▼
                        services/orders (pedido)
                                │
                                ▼
                        services/payment (PIX mock ou gateway real)
                                │
                                ▼
                     webhook de pagamento ──► baixa estoque + PAID + avisa o cliente
```

Princípio central: a IA (`services/ai`) só interpreta a intenção da mensagem
e devolve um texto de busca — ela nunca decide produto, preço ou
disponibilidade. Quem resolve isso de verdade é sempre `services/stock`,
consultando o Postgres. O mesmo vale para pagamento: o estoque só é
debitado depois que o webhook confirma `PAID`, nunca quando o pedido é só
criado (`PENDING`).

Cada integração externa (WhatsApp, pagamento, IA) é uma interface com um
provider mock (funciona sem nenhuma credencial) e um provider real —
trocar de um pro outro é só mudar uma variável de ambiente
(`WHATSAPP_PROVIDER`, `PAYMENT_PROVIDER`, `AI_PROVIDER`), sem alterar
`services/conversation` nem nenhuma tela do admin.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- Auth.js v5 (autenticação do painel admin)
- Zod (validação)
- exceljs + papaparse (importação de planilha)

## Pré-requisitos

- Node.js 20+
- Uma instância PostgreSQL. Opções:
  - **Neon** ([neon.tech](https://neon.tech)) ou **Supabase** ([supabase.com](https://supabase.com)) — planos gratuitos, sem instalar nada localmente
  - PostgreSQL via Docker, se preferir rodar localmente

## Instalação

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente (já existe um `.env` local pronto
   para desenvolvimento, mas se precisar recriar):

   ```bash
   cp .env.example .env
   ```

3. Preencha `DATABASE_URL` no `.env` com a connection string do seu banco
   Postgres (Neon/Supabase fornecem essa string ao criar o banco — algo como
   `postgresql://usuario:senha@host/nome_do_banco?sslmode=require`).

4. Gere as tabelas no banco a partir do schema do Prisma:

   ```bash
   npm run db:migrate
   ```

   Isso vai pedir um nome para a migration (ex: `init`) e criar as tabelas.

5. Popule o banco com dados fictícios (loja de exemplo, categorias, produtos
   e um usuário admin):

   ```bash
   npm run db:seed
   ```

   Login do painel admin (acesse em `/login`):
   - **E-mail:** `admin@botloja.dev`
   - **Senha:** `admin123`

6. Rode o projeto:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

Produção: `npx vercel --prod` (depois de `npx vercel link` uma vez). Três
detalhes que custaram tempo pra descobrir e vale saber de antemão:

1. **O arquivo precisa se chamar `middleware.ts`, não `proxy.ts`.** O
   Next.js 16 renomeou oficialmente para `proxy.ts`, mas a versão da Vercel
   CLI usada aqui não gera o roteamento corretamente para esse nome (todas
   as rotas voltavam 404). `middleware.ts` funciona igual.
2. **O projeto na Vercel precisa ter o "Framework Preset" definido como
   Next.js.** Se você criar o projeto via `vercel project add` (necessário
   quando o nome da pasta tem maiúsculas, como aqui), ele fica sem
   framework configurado e a Vercel usa um builder genérico de site
   estático — o build parece funcionar, mas nada é servido. Corrija com
   `vercel project update --framework nextjs`.
3. **Use a connection string do "connection pooler" do Supabase (porta
   6543), não a direta (porta 5432).** Funções serverless da Vercel só
   falam IPv4; a conexão direta do Supabase é IPv6-only sem o add-on pago.
   Veja `DATABASE_URL`/`DIRECT_URL` em `.env.example`.

Variáveis de ambiente na Vercel: mesmas do `.env.example`, definidas via
`vercel env add NOME production` ou pelo painel do projeto.

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:migrate` | Aplica o schema do Prisma no banco (cria/atualiza tabelas) |
| `npm run db:seed` | Popula o banco com dados fictícios |
| `npm run db:studio` | Abre o Prisma Studio (interface visual do banco em `localhost:5555`) |

## Testando a "Dona" (WhatsApp mock)

Acesse [http://localhost:3000/mock-chat](http://localhost:3000/mock-chat) para conversar com o bot pelo navegador, como se fosse o WhatsApp. Ou use a API diretamente:

```bash
curl -X POST http://localhost:3000/api/mock/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999998888", "message": "tem tela do iphone 11?"}'
```

```bash
curl "http://localhost:3000/api/mock/whatsapp?phone=5511999998888"
```

Frases que a Dona já entende: "tem tela de onze?", "vocês têm display iphone 11?", "quanto tá a bateria do XR?", "quero 3 telas de iphone 13", "não encontrei" para peças fora do catálogo, "atendente" para transferir a conversa para um humano (o bot fica em silêncio e a conversa aparece em **Atendimento** no painel — veja a seção "Atendimento humano" abaixo).

Depois que a Dona mostrar um produto, você pode:
- **"sim"** — adiciona ao carrinho
- pedir outra peça — adiciona outro item ao carrinho
- **"finalizar"** — fecha o pedido (cria o registro `PENDING` no banco) e mostra o resumo
- **"sim"** de novo — gera a cobrança PIX (mock)
- **"cancelar"** — cancela o carrinho atual ou o pedido pendente

## Testando o pagamento PIX

Depois que a Dona gerar a cobrança, a resposta traz um link tipo
`/mock-payment/<id do pedido>` — abra no navegador para ver o QR Code de
verdade (gerado localmente, sem gateway nenhum) e o código "copia e cola".
Tem um botão **"Simular pagamento aprovado"** ali mesmo.

Ou via terminal:

```bash
curl -X POST http://localhost:3000/api/mock/payment/<orderId>/approve
```

Isso dispara a mesma lógica que o webhook real usaria: marca o pedido como
`PAID`, dá baixa no estoque (`stock_movements`) e manda a confirmação para o
cliente pelo WhatsApp (mock).

O webhook "de verdade" fica em `/api/webhooks/payment` — hoje ele espera um
formato genérico `{ orderId, status }` (só pra já funcionar de ponta a
ponta); ao integrar um gateway real, troque o parsing do payload pelo
formato daquele gateway e a validação de assinatura pelo esquema documentado
por ele. Veja os comentários em [app/api/webhooks/payment/route.ts](app/api/webhooks/payment/route.ts).

## Atendimento humano

Quando o cliente digita "atendente" (ou similar), a Dona pausa e a conversa
aparece em **Atendimento** no painel, em "Aguardando atendente". Ao abrir a
conversa, o atendente clica em **Assumir atendimento** — a partir daí o bot
fica em silêncio e as mensagens do atendente vão direto pro cliente (a tela
atualiza sozinha a cada poucos segundos, sem precisar recarregar). **Encerrar
atendimento** devolve a conversa pro bot, que volta a responder normalmente.

## Importando produtos de uma planilha

Em **Produtos → Importar planilha** você envia um `.xlsx` ou `.csv`. O
sistema tenta adivinhar qual coluna é qual (nome, preço, estoque, categoria,
marca, modelo...), mas você pode corrigir manualmente antes de importar.
Produtos com o mesmo nome de um já cadastrado são **atualizados**
(preço/estoque); os demais são **criados** com um SKU gerado automaticamente
a partir de categoria/marca/modelo (ex: `ACE-GEN-UNI-001`), já que a
planilha pode não ter um código próprio.
Cada linha é validada e importada individualmente — um erro numa linha não
trava as outras.

## Configurações da loja

Em **Configurações** no painel, o dono da loja edita nome, nome do bot,
telefone, endereço, logo, as três mensagens do bot (inicial, pagamento,
pedido aprovado) e o estoque mínimo padrão — sem precisar mexer em código.
As integrações (WhatsApp/pagamento/IA) aparecem ali como informação
(read-only), porque são configuradas via `.env`: de propósito, para nunca
guardar chave de API no banco de dados.

## Estrutura do projeto

```
/app
  /(admin)/              → painel administrativo (protegido por login)
    /dashboard
    /products, /products/import
    /orders, /orders/[id]
    /conversations, /conversations/[id]   → atendimento humano
    /customers
    /settings
  /login                 → tela de login (fora do layout do admin)
  /mock-chat             → simulador de conversa do WhatsApp
  /mock-payment/[orderId] → simulador de checkout PIX
  /api
    /admin/...           → APIs do painel (protegidas)
    /mock/...            → APIs para testar sem WhatsApp/gateway reais
    /webhooks/...        → webhooks reais (Meta, gateway de pagamento)
    /auth/[...nextauth]  → rotas do Auth.js
/components
  /ui       → Button, Input, Badge...
  /admin    → Sidebar, ProductForm, SettingsForm, StatCard...
  /chat     → simulador de chat
  /payment  → botão de aprovar pagamento (mock)
/services
  /whatsapp, /payment, /ai   → cada um com interface + mock + provider real
  /stock                     → catálogo, estoque, busca tolerante, importação
  /orders                    → carrinho → pedido, dashboard
  /conversation              → orquestra IA + estoque + pedidos + atendimento humano
  /store                     → configurações da loja
/lib          → banco (Prisma), validações (Zod), utilitários de texto/planilha
/prisma       → schema.prisma, migrations e seed.ts
/types        → tipos TypeScript compartilhados (incl. augmentação do Auth.js)
/docs         → API.md (referência completa de endpoints)
auth.ts       → configuração do Auth.js
middleware.ts → protege o painel admin e as APIs administrativas
```

Referência completa de todos os endpoints com exemplos: [docs/API.md](docs/API.md).

## Variáveis de ambiente

Veja `.env.example` para a lista completa. Em desenvolvimento, WhatsApp,
pagamento e IA rodam em **modo mock** por padrão (`*_PROVIDER="mock"`), então
você consegue testar o fluxo inteiro sem contas em nenhum desses serviços.
Nenhuma chave real é necessária até que você decida integrar um provedor de
verdade.

## Roadmap

- [x] Etapa 1 — setup do projeto, schema do banco, seed de produtos
- [x] Etapa 2 — CRUD de produtos (API + painel admin)
- [x] Etapa 3 — interpretação de mensagens (NLU mock) + consulta de estoque via WhatsApp mock
- [x] Etapa 4 — carrinho e pedidos
- [x] Etapa 5 — pagamento PIX mock + webhook + baixa de estoque
- [x] Etapa 6 — dashboard e histórico de pedidos
- [x] Etapa 7 — importação de produtos via planilha (Excel/CSV)
- [x] Etapa 8 — autenticação do painel admin
- [x] Etapa 9 — atendimento humano
- [x] Etapa 10 — configurações da loja e documentação final
- [x] Etapa 11 — multi-loja: cada loja conecta o próprio WhatsApp (Meta ou
      Twilio) pelo painel, com scaffold do "conectar em um clique" via Meta
      Embedded Signup (Tech Provider — aguardando aprovação da Meta)
- [x] Etapa 12 — cadastro público de lojas (`/signup`, dono escolhe o
      próprio e-mail/senha) + controle de acesso: você aprova cada loja
      nova e define/renova a validade da assinatura em `/platform`

## Multi-loja (multi-tenant)

Qualquer pessoa pode criar a própria loja em `/signup`, escolhendo o
e-mail e a senha do próprio acesso. A loja nasce com `status="PENDING"` —
o painel fica bloqueado pro dono e a Donna não responde no WhatsApp até
você aprovar em `/platform` (área só sua, visível pra quem tem
`isPlatformAdmin=true`). Lá você também define/estende a validade da
assinatura (`subscriptionExpiresAt`) e suspende quem não estiver mais em
dia — nos dois casos o acesso é bloqueado automaticamente, sem precisar
mexer em código. Veja
[docs/API.md](docs/API.md#administração-da-plataforma-aprovarsuspender-lojas).

Cada loja pode ter o próprio número de WhatsApp, configurado em
Configurações → "WhatsApp desta loja". As credenciais ficam criptografadas
no banco (AES-256-GCM, `lib/crypto.ts`) e sobrepõem as variáveis de
ambiente globais só para aquela loja — o resto do sistema continua
funcionando com o padrão do `.env` para lojas sem integração própria. Os
webhooks (`/api/webhooks/whatsapp` e `/api/webhooks/twilio-whatsapp`) já
identificam automaticamente de qual loja é cada mensagem recebida. Veja
[docs/API.md](docs/API.md#integrações-de-whatsapp-por-loja-multi-tenant)
para os endpoints.

## Segurança

- Painel admin e APIs `/api/admin/*` exigem login (Auth.js, sessão JWT) —
  ver `middleware.ts`
- Senhas com hash `bcrypt`, nunca em texto puro
- Nenhuma chave/API key/segredo no código — tudo via variáveis de ambiente
  (`.env`, nunca commitado)
- Webhooks (`/api/webhooks/payment`, `/api/webhooks/whatsapp`) validam
  assinatura via HMAC-SHA256 quando o segredo está configurado
- Credenciais de WhatsApp/pagamento de cada loja (multi-tenant) ficam
  criptografadas no banco com AES-256-GCM (`lib/crypto.ts`,
  `CREDENTIALS_ENCRYPTION_KEY`) — o painel admin é write-only para esses
  campos, nunca devolve o valor salvo de volta pro navegador
- `/platform` (aprovar/suspender lojas) exige `isPlatformAdmin=true`,
  checado tanto no `middleware.ts` (JWT) quanto dentro de cada rota — não
  existe UI pra promover alguém a platform admin de propósito (só via
  script direto no banco, ver docs/API.md)
- Cadastro público em `/signup` não tem verificação de e-mail nem rate
  limit por enquanto (mesma decisão da Etapa 11) — mas toda loja nova
  nasce bloqueada (`PENDING`) até você aprovar manualmente, então o pior
  caso de abuso é "alguém cria uma loja que nunca vai ser aprovada"
- Validação de entrada com Zod em todas as APIs administrativas
- Trocamos a lib `xlsx` (usada para ler planilhas enviadas pelo usuário) por
  `exceljs`/`papaparse` depois de descobrir duas vulnerabilidades sem
  correção na primeira — decisão registrada porque é exatamente o tipo de
  superfície de ataque (arquivo de usuário sendo processado no servidor)
  que merece esse cuidado
