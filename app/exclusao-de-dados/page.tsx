import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import { BRAND_NAME, CONTACT_EMAIL } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Exclusão de dados — ${BRAND_NAME}`,
  description: "Como pedir a exclusão dos seus dados na Donnabot.",
};

/**
 * Página informada no app da Meta como "URL de instruções de exclusão de
 * dados do usuário" e citada na Política de Privacidade e nos Termos.
 */
export default function ExclusaoDeDadosPage() {
  return (
    <LegalPage title="Exclusão de dados">
      <LegalSection title="Conversei com a Donna pelo WhatsApp de uma loja">
        <p className="mb-2">Você pode pedir a exclusão dos seus dados (telefone, nome, mensagens e pedidos):</p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>Direto à loja com quem você conversou, que é a responsável pelos seus dados; ou</li>
          <li>
            Por e-mail para{" "}
            <a href={`mailto:${CONTACT_EMAIL}?subject=Exclus%C3%A3o%20de%20dados`} className="underline">
              {CONTACT_EMAIL}
            </a>
            , com o assunto &quot;Exclusão de dados&quot;, informando o número de WhatsApp usado e o nome da loja.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title="Tenho uma loja cadastrada na Donnabot">
        <p>
          Peça o encerramento da conta e a exclusão dos dados pelo e-mail{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Exclus%C3%A3o%20de%20dados`} className="underline">
            {CONTACT_EMAIL}
          </a>
          , a partir do e-mail cadastrado na conta. Antes da exclusão, você pode pedir uma cópia dos dados da loja.
        </p>
      </LegalSection>

      <LegalSection title="O que acontece depois">
        <ul className="ml-5 list-disc space-y-1">
          <li>Confirmamos que o pedido é seu, para ninguém apagar dados de outra pessoa.</li>
          <li>Os dados são apagados em até 15 dias e você recebe a confirmação por e-mail.</li>
          <li>
            Mantemos só o que a lei obrigar a guardar (por exemplo, registros fiscais), pelo prazo exigido.
          </li>
          <li>
            Mensagens que já estão no WhatsApp do seu celular ou da loja não são apagadas por nós: elas ficam nos
            aparelhos de cada um.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Desconectar o WhatsApp da loja">
        <p>
          A loja pode remover a permissão da {BRAND_NAME} a qualquer momento nas configurações da conta da Meta
          (Business Manager), em integrações e apps conectados. Depois disso a Donna deixa de responder naquele
          número. Mais detalhes na{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
