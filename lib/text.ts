// Intervalo de acentos combinantes (U+0300-U+036F), usado após normalize("NFD")
const DIACRITICS_REGEX = /[̀-ͯ]/g;

/**
 * Normaliza texto para comparação "tolerante": minúsculas, sem acentos,
 * sem pontuação, espaços colapsados. Usada tanto pela IA mock (services/ai)
 * quanto pela busca de produtos (services/stock), para que as duas camadas
 * comparem texto da mesma forma.
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Preposições/artigos sem valor de busca — sem isso, uma palavra como "do"
// pode "casar" por acidente com a descrição de um produto errado.
const STOPWORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "um",
  "uma",
  "uns",
  "umas",
  "no",
  "na",
  "nos",
  "nas",
  "ao",
  "aos",
  "ou",
  "que",
  "com",
  "para",
  "pra",
  "por",
  "em",
  "se",
  "ta",
]);

export function normalizedTokens(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}
