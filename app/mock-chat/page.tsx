import { notFound } from "next/navigation";
import { ChatSimulator } from "@/components/chat/ChatSimulator";
import { mocksEnabled } from "@/lib/mocks";

export default function MockChatPage() {
  if (!mocksEnabled()) notFound();
  return (
    <div className="min-h-screen bg-zinc-100 p-4 dark:bg-zinc-900 md:p-8">
      <ChatSimulator />
    </div>
  );
}
