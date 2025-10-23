import { useEffect, useRef, useState } from "react";
import { fetchMessages, sendMessage } from "@/services/chat";

type Msg = { id: string; sender_id: string; body?: string; created_at: string };

export default function ChatWidget({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const data = await fetchMessages(conversationId);
    setMessages(data);
  }
  async function onSend() {
    if (!text.trim()) return;
    const msg = await sendMessage(conversationId, currentUserId, text.trim());
    setMessages((prev) => [...prev, msg]);
    setText("");
  }

  useEffect(() => {
    load();
  }, [conversationId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="border rounded-2xl p-3 max-h-96 flex flex-col">
      <div className="flex-1 overflow-auto space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] px-3 py-2 rounded-xl ${m.sender_id === currentUserId ? "ml-auto bg-gray-200" : "bg-white border"}`}
          >
            <div className="text-sm whitespace-pre-wrap">{m.body}</div>
            <div className="text-[10px] opacity-60 mt-1">
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje"
          className="flex-1 border rounded-xl px-3 py-2"
        />
        <button onClick={onSend} className="px-4 py-2 rounded-xl border">
          Enviar
        </button>
      </div>
    </div>
  );
}
