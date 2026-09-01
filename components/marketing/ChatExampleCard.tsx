type ExampleMessage = { from: "customer" | "donna"; text: string };

/**
 * Cartão estático estilo "print" de conversa — só ilustrativo (não é
 * histórico real de nenhuma loja, já que ainda não temos clientes usando em
 * produção). Por isso o título de cada exemplo deixa claro que é uma
 * demonstração, nunca um depoimento.
 */
export function ChatExampleCard({ title, messages }: { title: string; messages: ExampleMessage[] }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#075E54] text-xs text-white">🤖</span>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
      </div>
      <div className="flex flex-col gap-2 bg-[#e5ddd5] px-3 py-4 dark:bg-[#0b141a]">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.from === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-1.5 text-xs shadow-sm ${
                message.from === "customer"
                  ? "bg-[#d9fdd3] text-zinc-900 dark:bg-[#005c4b] dark:text-white"
                  : "bg-white text-zinc-900 dark:bg-[#202c33] dark:text-white"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
