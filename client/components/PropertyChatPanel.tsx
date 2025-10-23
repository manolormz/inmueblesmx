import { useState } from "react";
import ChatWidget from "@/components/ChatWidget";
import { ensureConversation } from "@/services/chat";

export default function PropertyChatPanel({
  listingId,
  agentId,
  currentUserId,
  agentName,
}: {
  listingId: string;
  agentId: string;
  currentUserId: string;
  agentName?: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startChat() {
    try {
      setBusy(true);
      const convo = await ensureConversation(listingId, currentUserId, agentId);
      setConversationId(convo.id);
    } finally {
      setBusy(false);
    }
  }

  if (!conversationId) {
    return (
      <div className="border rounded-2xl p-4 space-y-2">
        <div className="text-sm opacity-70">
          {agentName ? `Agente: ${agentName}` : "Agente disponible"}
        </div>
        <button
          disabled={busy}
          onClick={startChat}
          className="px-4 py-2 rounded-xl border w-full"
        >
          {busy ? "Abriendo chat…" : "Hablar con el agente"}
        </button>
        <p className="text-xs opacity-60">
          Te conectaremos directamente con el agente de esta propiedad.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <ChatWidget
        conversationId={conversationId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
