import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import { BRAND_NAME, CONTACT_EMAIL, LEGAL_CNPJ, LEGAL_NAME, PRICING } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Termos de Uso — ${BRAND_NAME}`,
  description: "Regras de uso da Donnabot para as lojas que contratam o atendimento automático via WhatsApp.",
};

const provider = LEGAL_CNPJ ? `${LEGAL_NAME} (CNPJ ${LEGAL_CNPJ})` : LEGAL_NAME;

export default function TermosPage() {
  return (
    <LegalPage title="Termos de Uso">
      <LegalSection title="1. Quem somos e o que é o serviço">
        <p>
          A {BRAND_NAME} é um serviço prestado por {provider} que coloca a Donna, uma assistente virtual, para atender
          os clientes de uma loja pelo WhatsApp: ela consulta o estoque cadastrado pela loja, informa preço e
          disponibilidade, monta o carrinho e transfere a conversa para um atendente humano da loja quando o cliente
          pede ou finaliza a compra. Estes Termos valem para a loja que cria uma conta (&quot;Loja&quot; ou
          &quot;você&quot;). Ao criar a conta, você declara que leu e aceita estes Termos e a{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Cadastro e conta">
        <ul className="ml-5 list-disc space-y-1">
          <li>As informações do cadastro devem ser verdadeiras e mantidas atualizadas.</li>
          <li>Você é responsável por manter a senha em segredo e por tudo o que for feito com o seu acesso.</li>
          <li>Toda loja nova passa por aprovação da {BRAND_NAME} antes de ser liberada.</li>
          <li>Quem usa o serviço em nome de uma empresa declara ter poderes para aceitar estes Termos por ela.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Planos, teste e pagamento">
        <ul className="ml-5 list-disc space-y-1">
          <li>A loja pode testar o serviço por {PRICING.trialDays} dias sem custo.</li>
          <li>
            Depois do teste, o uso depende do pagamento do plano escolhido (mensal ou anual), nos valores informados
            no site no momento da contratação.
          </li>
          <li>
            Sem o pagamento em dia, o acesso ao painel e o atendimento da Donna são suspensos até a regularização.
          </li>
          <li>
            Os custos cobrados pela Meta pelas mensagens que a própria loja iniciar (por exemplo, promoções) não estão
            incluídos no plano, quando houver.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Responsabilidades da Loja">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Manter produtos, preços e estoque corretos no painel: a Donna responde com base no que está cadastrado.
          </li>
          <li>
            Atender os clientes transferidos, enviar a forma de pagamento e marcar os pedidos como pagos. A venda, o
            pagamento, a entrega, a troca e a garantia são relação direta entre a Loja e o cliente dela.
          </li>
          <li>
            Cumprir as políticas do WhatsApp e da Meta (incluindo a Política de Comércio e a Política do WhatsApp
            Business), o Código de Defesa do Consumidor e a LGPD.
          </li>
          <li>
            Não usar o serviço para spam, mensagens a quem não autorizou contato, produtos proibidos ou qualquer
            finalidade ilegal.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. WhatsApp e serviços de terceiros">
        <p>
          A Donna funciona por meio da WhatsApp Business Platform, da Meta, e depende também de serviços de
          hospedagem e banco de dados de terceiros. A conexão do número é autorizada pela própria Loja na Meta. A{" "}
          {BRAND_NAME} não controla esses serviços e não responde por indisponibilidades, mudanças de regras, limites
          ou bloqueios aplicados por eles, inclusive bloqueios do número da Loja causados pelo descumprimento das
          políticas do WhatsApp.
        </p>
      </LegalSection>

      <LegalSection title="6. Dados pessoais (LGPD)">
        <p>
          Para os dados dos clientes da Loja (nome, telefone, mensagens e pedidos), a Loja é a controladora e a{" "}
          {BRAND_NAME} atua como operadora: trata esses dados apenas para prestar o atendimento contratado, seguindo
          as instruções da Loja. Detalhes na{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>{" "}
          e em{" "}
          <Link href="/exclusao-de-dados" className="underline">
            Exclusão de dados
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilidade e limitação de responsabilidade">
        <p className="mb-2">
          Trabalhamos para manter o serviço no ar e funcionando bem, mas ele é oferecido como está, sem garantia de
          funcionamento ininterrupto ou livre de erros. Respostas automáticas podem conter imprecisões; a Loja deve
          acompanhar o atendimento pelo painel.
        </p>
        <p>
          Na extensão permitida pela lei, a {BRAND_NAME} não responde por lucros cessantes, vendas perdidas ou danos
          indiretos, e a responsabilidade total por qualquer reclamação fica limitada ao valor pago pela Loja nos 3
          meses anteriores ao fato.
        </p>
      </LegalSection>

      <LegalSection title="8. Cancelamento">
        <ul className="ml-5 list-disc space-y-1">
          <li>A Loja pode cancelar a qualquer momento pelo e-mail de contato.</li>
          <li>
            A {BRAND_NAME} pode suspender ou encerrar a conta em caso de falta de pagamento ou descumprimento destes
            Termos.
          </li>
          <li>
            Após o encerramento, a Loja pode pedir uma cópia dos seus dados em até 30 dias; depois disso, os dados são
            apagados, salvo o que a lei obrigar a guardar.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Propriedade intelectual">
        <p>
          A marca {BRAND_NAME}, a Donna e o software pertencem a {LEGAL_NAME}. A Loja recebe o direito de uso
          enquanto a conta estiver ativa. Os dados e o catálogo cadastrados continuam sendo da Loja.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações destes Termos">
        <p>
          Podemos atualizar estes Termos para refletir mudanças no serviço ou na lei. Mudanças relevantes serão
          avisadas por e-mail ou pelo painel com antecedência; continuar usando o serviço depois disso significa
          aceitar a nova versão.
        </p>
      </LegalSection>

      <LegalSection title="11. Contato e foro">
        <p>
          Dúvidas:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          . Estes Termos seguem a lei brasileira. Fica eleito o foro da sede de {LEGAL_NAME}, ressalvado o direito do
          consumidor de propor ação no seu próprio domicílio.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
