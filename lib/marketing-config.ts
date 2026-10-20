// Conteúdo público do site (marca, contato, preços) — centralizado aqui pra
// ser fácil de atualizar sem procurar em várias páginas.

export const BRAND_NAME = "Donnabot";

// Quem presta o serviço, para Termos de Uso / Privacidade. CNPJ vazio = não
// aparece nas páginas (preencher quando a empresa estiver formalizada).
export const LEGAL_NAME = "Balbitech";
export const LEGAL_CNPJ = "";

// Data exibida no topo de Termos, Privacidade e Exclusão de dados.
export const LEGAL_UPDATED_AT = "20 de outubro de 2026";

export const CONTACT_EMAIL = "contatodonnabot@gmail.com";

// TODO: preencher assim que tivermos o número real (formato:
// código do país + DDD + número, ex: "5511999998888"). Enquanto vazio, o
// botão de WhatsApp na página de Dúvidas fica escondido.
export const CONTACT_WHATSAPP = "";

export const PRICING = {
  monthly: 300,
  yearly: 3000,
  trialDays: 10,
};
