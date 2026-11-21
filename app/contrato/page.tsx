import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  CONTRACT_UPDATED_AT,
  CONTRACT_VERSION,
  LEGAL_CITY,
  LEGAL_CNPJ,
  LEGAL_NAME,
  PRICING,
} from "@/lib/marketing-config";
import { PLAN_TIERS, TIERS, YEARLY_MONTHS_CHARGED } from "@/lib/plans";

export const metadata: Metadata = {
  title: `Contrato de Assinatura — ${BRAND_NAME}`,
  description: "Contrato de assinatura e prestação de serviços da Donnabot para lojas.",
};

const provider = LEGAL_CNPJ ? `${LEGAL_NAME}, inscrita no CNPJ ${LEGAL_CNPJ}` : LEGAL_NAME;

function List({ children }: { children: React.ReactNode }) {
  return <ul className="ml-5 list-disc space-y-1.5">{children}</ul>;
}

export default function ContratoPage() {
  return (
    <LegalPage title="Contrato de Assinatura" updatedAt={CONTRACT_UPDATED_AT}>
      <p>
        Este Contrato de Assinatura e Prestação de Serviços (&quot;Contrato&quot;) regula a contratação da {BRAND_NAME}.
        Ele complementa os{" "}
        <Link href="/termos" className="underline">
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="underline">
          Política de Privacidade
        </Link>
        . Se houver conflito, vale o que está neste Contrato. Versão {CONTRACT_VERSION}.
      </p>

      <LegalSection title="1. Partes">
        <List>
          <li>
            <strong>Contratada:</strong> {provider}, responsável pela {BRAND_NAME} (&quot;{BRAND_NAME}&quot; ou
            &quot;nós&quot;).
          </li>
          <li>
            <strong>Contratante:</strong> a loja que assina o plano no painel (&quot;Loja&quot; ou &quot;você&quot;),
            identificada pelos dados do cadastro e pelo CPF ou CNPJ informado no pagamento. Quem aceita este Contrato em
            nome de uma empresa declara ter poderes para isso.
          </li>
        </List>
      </LegalSection>

      <LegalSection title="2. O que é contratado">
        <p>
          O uso, por assinatura, da Donna: uma assistente virtual que atende os clientes da Loja no WhatsApp da própria
          Loja, consulta os produtos, preços e estoque cadastrados no painel, monta o carrinho, registra o pedido e
          transfere a conversa para um atendente humano da Loja quando o cliente pede ou quando é hora de pagar. Inclui
          o painel de gestão (conversas, pedidos, produtos, clientes e relatórios conforme o plano) e o suporte do plano
          contratado.
        </p>
        <p className="mt-3">
          <strong>Não está incluído:</strong> a cobrança do cliente final (a Donna não recebe pagamentos), a entrega dos
          produtos, a criação de campanhas ou disparos de mensagens, e as taxas cobradas pela Meta pelo uso do
          WhatsApp.
        </p>
      </LegalSection>

      <LegalSection title="3. Planos, limites e preço">
        <List>
          {PLAN_TIERS.map((tier) => (
            <li key={tier}>
              <strong>{TIERS[tier].name}:</strong> até {TIERS[tier].conversations.toLocaleString("pt-BR")} conversas
              atendidas por mês.
            </li>
          ))}
          <li>
            &quot;Conversa&quot; é cada cliente atendido pela Donna em um mesmo dia. O painel mostra quanto do limite já
            foi usado no mês.
          </li>
          <li>
            Se a Loja passar do limite do plano, a Donna continua atendendo, para não deixar o cliente sem resposta.
            Se isso acontecer por 2 meses seguidos, combinaremos com a Loja a mudança para o plano adequado; nenhuma
            cobrança extra é feita sem aviso e concordância prévia.
          </li>
          <li>
            O preço é o informado na tela de pagamento no momento da contratação. No plano anual a Loja paga{" "}
            {YEARLY_MONTHS_CHARGED} mensalidades e usa por 12 meses.
          </li>
          <li>
            O preço pode ser reajustado uma vez a cada 12 meses, com aviso de pelo menos 30 dias por e-mail ou pelo
            painel. Se não concordar, a Loja pode cancelar antes da renovação sem nenhuma multa. Planos anuais já pagos
            não são reajustados durante o período pago.
          </li>
        </List>
      </LegalSection>

      <LegalSection title="4. Pagamento e renovação">
        <List>
          <li>
            A cobrança é feita pelo Asaas, por Pix, cartão de crédito ou boleto. Os dados do cartão são digitados no
            ambiente do Asaas e não passam pela {BRAND_NAME}.
          </li>
          <li>
            A assinatura renova automaticamente ao fim de cada período (mês ou ano) até que a Loja cancele.
          </li>
          <li>
            Se o pagamento não for confirmado até 3 dias depois do vencimento, o painel e o atendimento da Donna são
            pausados. Tudo volta a funcionar assim que o pagamento é confirmado, sem perda de dados. Não cobramos
            multa nem juros por atraso.
          </li>
          <li>Depois de 30 dias sem pagamento, a assinatura pode ser cancelada pela {BRAND_NAME}.</li>
        </List>
      </LegalSection>

      <LegalSection title={`5. Garantia de ${PRICING.refundDays} dias e cancelamento`}>
        <List>
          <li>
            A Loja pode cancelar em até {PRICING.refundDays} dias depois do primeiro pagamento e receber de volta o
            valor integral, sem precisar justificar.
          </li>
          <li>
            Depois desse prazo, a Loja pode cancelar a qualquer momento, sem multa, pelo e-mail {CONTACT_EMAIL}. O
            acesso continua até o fim do período já pago e não há nova cobrança. Não há devolução proporcional do
            período já iniciado.
          </li>
          <li>
            No plano anual, depois dos {PRICING.refundDays} dias de garantia, a Loja continua com acesso até o fim dos 12
            meses pagos.
          </li>
          <li>
            Se o cancelamento acontecer por falha grave da {BRAND_NAME} que não seja corrigida (item 7), a Loja recebe
            de volta o valor proporcional ao período que ainda não usou.
          </li>
        </List>
      </LegalSection>

      <LegalSection title="6. Pelo que a Donnabot se responsabiliza">
        <List>
          <li>Manter a Donna e o painel funcionando conforme descrito neste Contrato e no plano contratado.</li>
          <li>
            Fazer a Donna responder com base nos produtos, preços e estoque que a Loja cadastrou, sem inventar
            produtos, preços ou condições que não estejam no painel.
          </li>
          <li>Corrigir falhas do sistema assim que forem identificadas, com prioridade para as que impedem o atendimento.</li>
          <li>Avisar com antecedência, sempre que possível, sobre manutenções programadas.</li>
          <li>
            Proteger os dados da Loja e dos clientes dela com medidas de segurança adequadas (acesso por senha,
            criptografia das credenciais do WhatsApp, cópias de segurança do banco de dados).
          </li>
          <li>
            Usar os dados dos clientes da Loja somente para prestar o serviço, nunca vender ou repassar esses dados, e
            avisar a Loja em até 72 horas se houver um incidente de segurança que os afete.
          </li>
          <li>Manter sigilo sobre as informações comerciais da Loja (catálogo, preços, vendas e clientes).</li>
          <li>Prestar o suporte do plano contratado pelos canais informados no site, em dias úteis.</li>
          <li>Ajudar a Loja na conexão do número de WhatsApp e na configuração inicial.</li>
        </List>
      </LegalSection>

      <LegalSection title="7. Disponibilidade">
        <p>
          Nosso objetivo é manter o serviço no ar 99% do tempo em cada mês. Se o atendimento da Donna ficar fora do ar
          por culpa da {BRAND_NAME} por mais de 24 horas seguidas, a Loja recebe, a pedido, um desconto proporcional ao
          tempo parado na próxima cobrança. Se ficar fora do ar por culpa da {BRAND_NAME} por mais de 72 horas seguidas,
          a Loja pode cancelar e receber de volta o valor proporcional ao período que não usou. Falhas da Meta, do
          WhatsApp ou da internet da Loja não entram nessa conta (item 9).
        </p>
      </LegalSection>

      <LegalSection title="8. Responsabilidades da Loja">
        <List>
          <li>
            Manter produtos, preços, fotos e estoque corretos e atualizados no painel. A Donna responde com base no
            que está cadastrado.
          </li>
          <li>
            Acompanhar as conversas e atender os clientes que a Donna transferir: enviar a forma de pagamento,
            confirmar os pedidos e marcar como pagos.
          </li>
          <li>
            Responder perante os clientes dela pela venda: preço final, pagamento, nota fiscal, entrega, troca,
            garantia e atendimento pós-venda, conforme o Código de Defesa do Consumidor.
          </li>
          <li>
            Usar um número de WhatsApp próprio e regular, e cumprir as políticas do WhatsApp e da Meta, a LGPD e a lei.
          </li>
          <li>Não vender produtos proibidos ou ilegais, não enviar spam e não contatar quem não autorizou.</li>
          <li>Guardar a própria senha e não compartilhar o acesso com pessoas não autorizadas.</li>
          <li>Pagar as taxas da Meta pelo uso do WhatsApp, quando houver, e manter o cadastro atualizado.</li>
        </List>
      </LegalSection>

      <LegalSection title="9. O que não é responsabilidade da Donnabot">
        <List>
          <li>
            Respostas erradas causadas por informação errada ou desatualizada no painel (por exemplo, preço digitado
            errado ou estoque que não foi atualizado).
          </li>
          <li>
            A venda em si: pagamento, entrega, defeito, troca, garantia ou qualquer acordo feito entre a Loja e o
            cliente, inclusive o que o atendente humano da Loja prometer.
          </li>
          <li>Clientes que ficaram sem resposta depois de transferidos para um atendente da Loja.</li>
          <li>
            Bloqueios, restrições ou banimentos do número de WhatsApp decididos pela Meta, mudanças nas regras ou
            preços da Meta, e indisponibilidades do WhatsApp, da Meta, do Asaas ou dos provedores de internet.
          </li>
          <li>Taxas cobradas pela Meta, pelo Asaas ou por bancos.</li>
          <li>Acessos feitos com a senha da Loja, por ela ou por quem ela passou a senha.</li>
          <li>
            Vendas que a Loja deixou de fazer, lucro que deixou de ter ou outros danos indiretos, salvo nos casos em
            que a lei não permitir essa exclusão.
          </li>
          <li>
            Problemas causados por caso fortuito ou força maior (por exemplo, quedas gerais de energia ou de internet,
            desastres naturais ou decisões do governo).
          </li>
        </List>
      </LegalSection>

      <LegalSection title="10. Limite de responsabilidade">
        <p>
          Se a {BRAND_NAME} causar um dano à Loja, a indenização fica limitada ao valor pago pela Loja nos 12 meses
          anteriores ao fato. Esse limite não vale em caso de dolo, culpa grave ou vazamento de dados por falha de
          segurança da {BRAND_NAME}, e não afasta direitos que a lei garanta e que não possam ser limitados por
          contrato.
        </p>
      </LegalSection>

      <LegalSection title="11. Dados pessoais (LGPD)">
        <p>
          Para os dados dos clientes da Loja (nome, telefone, mensagens e pedidos), a Loja é a controladora e a{" "}
          {BRAND_NAME} é a operadora: trata os dados apenas para prestar o serviço e conforme as instruções da Loja.
          Depois do encerramento, a Loja pode pedir uma cópia dos seus dados em até 30 dias; depois disso, eles são
          apagados, salvo o que a lei obrigar a guardar. Detalhes na{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="12. Propriedade intelectual">
        <p>
          A marca {BRAND_NAME}, a Donna e o software são de {LEGAL_NAME}. A Loja tem direito de uso enquanto a
          assinatura estiver ativa. O catálogo, os clientes e os dados de vendas cadastrados são da Loja.
        </p>
      </LegalSection>

      <LegalSection title="13. Suspensão e encerramento pela Donnabot">
        <p>
          A {BRAND_NAME} pode suspender ou encerrar a conta se a Loja deixar de pagar (item 4), usar o serviço para
          algo ilegal, para spam ou para vender produtos proibidos, ou colocar em risco a segurança do sistema ou o
          número de WhatsApp de outras lojas. Fora dos casos graves, a Loja é avisada antes e tem a chance de
          corrigir.
        </p>
      </LegalSection>

      <LegalSection title="14. Mudanças neste Contrato">
        <p>
          Mudanças relevantes são avisadas com pelo menos 30 dias de antecedência por e-mail ou pelo painel. Se não
          concordar, a Loja pode cancelar antes da mudança valer, sem multa. Mudanças que só beneficiam a Loja podem
          valer na hora.
        </p>
      </LegalSection>

      <LegalSection title="15. Aceite eletrônico e foro">
        <p>
          A Loja aceita este Contrato marcando a caixa de aceite na tela de pagamento. Esse aceite tem a mesma validade
          de uma assinatura. A {BRAND_NAME} registra a data, o horário, o usuário, o IP e a versão aceita. Este Contrato
          segue a lei brasileira. Fica eleito o foro da comarca de {LEGAL_CITY}, ressalvado o direito de a Loja, quando
          for considerada consumidora, propor ação no seu próprio domicílio.
        </p>
        <p className="mt-3">
          Contato:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
