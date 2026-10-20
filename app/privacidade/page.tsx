import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import Link from "next/link";
import { BRAND_NAME, CONTACT_EMAIL, LEGAL_UPDATED_AT } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Política de Privacidade — ${BRAND_NAME}`,
  description: "Como a Donnabot coleta, usa e protege os dados de lojas e seus clientes.",
};


export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <MarketingNav />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-20">
          <h1 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Política de Privacidade</h1>
          <p className="mb-10 text-sm text-zinc-500 dark:text-zinc-400">Última atualização: {LEGAL_UPDATED_AT}</p>

          <div className="flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">1. Quem somos</h2>
              <p>
                A {BRAND_NAME} é um serviço de automação de atendimento via WhatsApp para lojas de peças de celular:
                a Donna (nossa assistente virtual) responde clientes, consulta estoque, monta pedidos e transfere o
                cliente para um atendente da loja, que envia a forma de pagamento. Esta política explica quais dados
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
                nome do perfil do WhatsApp, o conteúdo das mensagens trocadas com a Donna e com a loja, itens de
                pedidos e o valor e a situação do pagamento (nunca dados de cartão). Quando a loja usa o mesmo
                número no app WhatsApp Business do celular, as mensagens que ela envia por lá também são
                registradas, para a Donna saber quando um atendente humano assumiu a conversa.
              </p>
              <p className="mt-2">
                <strong>Papéis na LGPD:</strong> para os dados dos clientes finais, a loja é a controladora e a{" "}
                {BRAND_NAME} é a operadora — tratamos esses dados só para prestar o atendimento contratado pela
                loja, seguindo as instruções dela e os nossos{" "}
                <Link href="/termos" className="underline">
                  Termos de Uso
                </Link>
                .
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
                <li>Montar pedidos e registrar quando o atendente da loja confirma o pagamento</li>
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
                em contato pelo e-mail abaixo. Para apagar seus dados, siga as instruções em{" "}
                <Link href="/exclusao-de-dados" className="underline">
                  Exclusão de dados
                </Link>
                .
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
