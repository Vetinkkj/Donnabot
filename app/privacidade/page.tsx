import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { BRAND_NAME, CONTACT_EMAIL } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Política de Privacidade — ${BRAND_NAME}`,
  description: "Como a Donnabot coleta, usa e protege os dados de lojas e seus clientes.",
};

const UPDATED_AT = "1 de setembro de 2026";

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <MarketingNav />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-20">
          <h1 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Política de Privacidade</h1>
          <p className="mb-10 text-sm text-zinc-500 dark:text-zinc-400">Última atualização: {UPDATED_AT}</p>

          <div className="flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">1. Quem somos</h2>
              <p>
                A {BRAND_NAME} é um serviço de automação de atendimento via WhatsApp para lojas de peças de celular:
                a Donna (nosso assistente virtual) responde clientes, consulta estoque, monta pedidos e processa
                pagamentos via PIX em nome da loja que contrata o serviço. Esta política explica quais dados
                coletamos, como usamos e como protegemos — tanto os dados da loja (nosso cliente direto) quanto os
                dados dos clientes finais que conversam com a Donna pelo WhatsApp.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">2. Dados que coletamos</h2>
              <p className="mb-2">
                <strong>Da loja (dono da conta):</strong> nome, e-mail, senha (armazenada com hash, nunca em texto
                puro), nome e endereço da loja, e as credenciais de integração de WhatsApp/pagamento que a loja
                opta por conectar — essas credenciais ficam sempre criptografadas no banco de dados.
              </p>
              <p>
                <strong>Dos clientes finais (quem conversa com a Donna no WhatsApp):</strong> número de telefone,
                nome do perfil do WhatsApp, o conteúdo das mensagens trocadas com a Donna, itens de pedidos e dados
                de pagamento via PIX (valor, status — nunca dados de cartão). Esses dados pertencem à loja que
                atende aquele cliente e são usados só para prestar o serviço de atendimento automatizado a ela.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                3. Uso da API do WhatsApp Business (Meta)
              </h2>
              <p>
                Para enviar e receber mensagens, a {BRAND_NAME} usa a WhatsApp Business Platform (Meta) e/ou a API
                do Twilio como intermediários técnicos autorizados pela loja. As mensagens processadas por essas
                integrações são usadas exclusivamente para operar o atendimento automatizado da loja — nunca para
                anúncios, venda de dados a terceiros, ou qualquer finalidade fora do funcionamento do serviço
                contratado. O uso dessas integrações segue as Políticas de Desenvolvedor e a Política de Uso
                Comercial da Meta.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">4. Como usamos os dados</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>Responder mensagens de clientes automaticamente (consulta de estoque, preço, disponibilidade)</li>
                <li>Montar e processar pedidos e gerar cobranças PIX</li>
                <li>Permitir que a loja acompanhe conversas, pedidos e clientes pelo painel administrativo</li>
                <li>Encaminhar a conversa para um atendente humano da loja quando solicitado</li>
                <li>Manter a segurança da conta e prevenir uso indevido da plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">5. Compartilhamento de dados</h2>
              <p>
                Não vendemos dados de nenhuma loja ou cliente final. Os dados só são compartilhados com prestadores
                de infraestrutura necessários para operar o serviço — provedor de banco de dados (Supabase),
                hospedagem (Vercel), e os provedores de mensageria que a própria loja escolheu conectar (Meta
                WhatsApp Business Platform e/ou Twilio) — sempre limitado ao necessário para prestar o serviço.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">6. Segurança e retenção</h2>
              <p>
                Senhas ficam armazenadas com hash (bcrypt). Credenciais de integração de WhatsApp e pagamento de
                cada loja ficam criptografadas (AES-256-GCM) no banco de dados. Os dados são mantidos enquanto a
                conta da loja estiver ativa; ao encerrar a conta, os dados podem ser apagados mediante solicitação
                (veja a seção 8).
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">7. Cookies</h2>
              <p>
                Usamos apenas um cookie essencial de sessão (autenticação do painel administrativo), necessário
                para manter o dono da loja logado com segurança. Não usamos cookies de rastreamento ou publicidade.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                8. Seus direitos (LGPD)
              </h2>
              <p>
                Você pode solicitar a qualquer momento acesso, correção, portabilidade ou exclusão dos seus dados,
                conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Para exercer esses direitos, entre
                em contato pelo e-mail abaixo.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">9. Contato</h2>
              <p>
                Dúvidas sobre esta política ou sobre seus dados:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">10. Alterações</h2>
              <p>
                Esta política pode ser atualizada periodicamente para refletir mudanças no serviço. A data da
                última atualização está sempre indicada no topo desta página.
              </p>
            </section>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
