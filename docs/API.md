# Referência de APIs

Todas as respostas seguem o formato `{ "data": ... }` em caso de sucesso ou
`{ "error": "mensagem" }` (às vezes com `issues` detalhando campo por campo)
em caso de erro.

## Autenticação

As rotas em `/api/admin/*` exigem login (cookie de sessão do Auth.js). Se
você chamar sem estar logado, recebe `401`:

```bash
curl -i http://localhost:3000/api/admin/products
# HTTP/1.1 401 Unauthorized
```

Para testar essas rotas via `curl`, faça login pelo navegador em
`/login` e copie o cookie `authjs.session-token`, ou teste direto pela
interface do painel — os exemplos abaixo assumem que você já tem uma sessão
válida (ex: rodando o `curl` com `-b cookies.txt` depois de logar).

As rotas em `/api/mock/*` e `/api/webhooks/*` são públicas de propósito
(o cliente e os gateways externos não têm login).

---

## Produtos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/products?search=&stockStatus=` | Lista produtos (filtros opcionais) |
| POST | `/api/admin/products` | Cria produto |
| GET | `/api/admin/products/:id` | Detalhe de um produto |
| PATCH | `/api/admin/products/:id` | Edita produto (parcial) |
| DELETE | `/api/admin/products/:id` | Exclui produto |
| POST | `/api/admin/products/import` | Importa produtos em lote |
| GET | `/api/admin/categories` | Lista categorias da loja |

`stockStatus` aceita `all` (padrão), `in_stock`, `low_stock`, `out_of_stock`.

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tela iPhone 12",
    "categoryName": "Tela",
    "brand": "Apple",
    "model": "iPhone 12",
    "price": 400,
    "stockQuantity": 5,
    "minStock": 2,
    "sku": "TEL-IP12-001"
  }'
```

```bash
curl -X PATCH http://localhost:3000/api/admin/products/<id> \
  -H "Content-Type: application/json" \
  -d '{"stockQuantity": 10}'
```

```bash
curl -X POST http://localhost:3000/api/admin/products/import \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {"name": "Fonte Turbo 20W", "categoryName": "Acessório", "price": 45.9, "stockQuantity": 8}
    ]
  }'
```

---

## Pedidos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/orders?status=` | Lista pedidos |
| GET | `/api/admin/orders/:id` | Detalhe do pedido (itens, cliente, pagamento) |
| DELETE | `/api/admin/orders/:id` | Cancela um pedido `PENDING` |

`status` aceita `all` (padrão), `PENDING`, `PAID`, `CANCELLED`, `EXPIRED`.

```bash
curl "http://localhost:3000/api/admin/orders?status=PENDING"
```

---

## Dashboard

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/dashboard` | Estatísticas (produtos, vendas do dia, faturamento, pedidos pendentes/pagos, estoque baixo) |

---

## Atendimento (conversas)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/conversations?status=` | Lista conversas |
| GET | `/api/admin/conversations/:id` | Detalhe com histórico de mensagens |
| POST | `/api/admin/conversations/:id/assign` | Atendente assume a conversa |
| POST | `/api/admin/conversations/:id/close` | Encerra atendimento, devolve pro bot |
| POST | `/api/admin/conversations/:id/messages` | Atendente envia uma mensagem |

`status` aceita `all` (padrão), `BOT`, `WAITING_HUMAN`, `HUMAN`.

```bash
curl -X POST http://localhost:3000/api/admin/conversations/<id>/messages \
  -H "Content-Type: application/json" \
  -d '{"text": "Já verifiquei, temos sim em estoque!"}'
```

---

## Configurações da loja

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/settings` | Lê as configurações atuais |
| PATCH | `/api/admin/settings` | Atualiza (nome, mensagens, estoque mínimo padrão, etc.) |

```bash
curl -X PATCH http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Loja Exemplo de Peças",
    "botName": "Dona",
    "welcomeMessage": "Oi! Aqui é a Dona 👋",
    "paymentMessage": "💳 Pagamento via PIX",
    "orderApprovedMessage": "✅ Pagamento confirmado!",
    "defaultMinStock": 2
  }'
```

---

## WhatsApp — modo mock (desenvolvimento)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/mock/whatsapp` | Simula o cliente mandando uma mensagem |
| GET | `/api/mock/whatsapp?phone=` | Histórico da conversa daquele telefone |

```bash
curl -X POST http://localhost:3000/api/mock/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999998888", "message": "tem tela do iphone 11?", "name": "Cliente Teste"}'
```

---

## WhatsApp — webhook real (Meta Cloud API)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/webhooks/whatsapp` | Handshake de verificação (configurado uma vez no painel da Meta) |
| POST | `/api/webhooks/whatsapp` | Recebe mensagens reais dos clientes |

Só entra em ação quando `WHATSAPP_PROVIDER="meta"` e as credenciais reais
estiverem configuradas. Valida a assinatura via `WHATSAPP_APP_SECRET`
(header `X-Hub-Signature-256`) se essa variável estiver definida.

---

## WhatsApp — webhook real (Twilio, alternativa à Meta)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/webhooks/twilio-whatsapp` | Recebe mensagens do Twilio WhatsApp Sandbox |

Alternativa a `WHATSAPP_PROVIDER="meta"` para quando o cadastro direto na
Meta não é possível (ex: sem CNPJ para verificação de empresa). Configure
com `WHATSAPP_PROVIDER="twilio"` + `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`. Valida a assinatura via
`TWILIO_AUTH_TOKEN` (header `X-Twilio-Signature`) — usa `APP_URL` para
reconstruir a URL exata que o Twilio assinou.

---

## QR Code do PIX (imagem pública)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/payment-qr/:orderId` | Serve o QR Code do pedido como PNG de verdade |

WhatsApp (Meta e Twilio) só aceita enviar imagem a partir de uma URL
pública — não aceita um `data:` URI embutido na mensagem. Esse endpoint
existe só para isso; sem `APP_URL` configurado, o envio de imagem é pulado
(o texto com o código "copia e cola" continua funcionando normal).

---

## Pagamento — modo mock (desenvolvimento)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/mock/payment/:orderId` | Gera (ou retorna) a cobrança PIX de um pedido |
| POST | `/api/mock/payment/:orderId/approve` | Simula o gateway aprovando o pagamento |

```bash
curl http://localhost:3000/api/mock/payment/<orderId>
curl -X POST http://localhost:3000/api/mock/payment/<orderId>/approve
```

Ou visualmente: abra `/mock-payment/<orderId>` no navegador.

---

## Pagamento — webhook real

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/webhooks/payment` | Recebe a confirmação do gateway |

Formato genérico usado hoje (adapte ao integrar um gateway real):

```bash
curl -X POST http://localhost:3000/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{"orderId": "<id do pedido>", "status": "approved"}'
```

`status` aceita `approved`, `cancelled` ou `expired`. Valida a assinatura via
`WEBHOOK_SECRET` (header `X-Webhook-Signature`) se essa variável estiver
definida.

---

## Códigos de erro comuns

| Status | Quando acontece |
|---|---|
| 400 | Dados inválidos (veja `issues` na resposta) |
| 401 | Não autenticado (rota admin sem sessão, ou assinatura de webhook inválida) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: SKU duplicado, pedido já processado) |
| 500 | Erro inesperado do servidor (verifique o log do `npm run dev`) |
