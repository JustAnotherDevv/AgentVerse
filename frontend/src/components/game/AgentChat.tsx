import { useState, useEffect, useRef } from "react";
import { theme } from "../../lib/theme";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentChatProps {
  open: boolean;
  onClose: () => void;
  agent?: {
    id: string;
    name: string;
    avatar: { emoji: string; color?: string };
  };
  onSend?: (message: string) => Promise<any>;
}

export function AgentChat({ open, onClose, agent, onSend }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && agent && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `INITIALIZING ${agent.name.toUpperCase()}_MODULE... SYSTEM READY. How may I assist you?`
      }]);
    }
  }, [open, agent]);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInput("");
    }
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !onSend) return;
    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const data = await onSend(userMessage);
      setMessages(prev => [...prev, { role: "assistant", content: data.response || "> ERROR: NO RESPONSE" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "> ERROR: TRANSMISSION FAILED" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: theme.spacing.md,
      right: theme.spacing.md,
      width: "340px",
      height: "440px",
      background: theme.colors.background.secondary,
      border: `2px solid ${theme.colors.border.default}`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 1000,
      fontFamily: theme.fonts.mono,
    }}>
      {/* Header */}
      <div style={{
        background: theme.colors.background.primary,
        padding: theme.spacing.sm,
        borderBottom: `2px solid ${theme.colors.border.default}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.xs }}>
          <div style={{ width: 8, height: 8, background: theme.colors.accent.primary }} />
          <div style={{ color: theme.colors.text.primary, fontWeight: 700, fontSize: theme.fontSize.sm, letterSpacing: '1px' }}>
            {agent?.name?.toUpperCase() || 'TERMINAL'}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "transparent",
          border: `1px solid ${theme.colors.border.default}`,
          color: theme.colors.text.primary,
          cursor: "pointer",
          padding: "2px 6px",
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.fonts.mono,
        }}>
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: theme.spacing.xs, display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            padding: theme.spacing.xs,
            border: `1px solid ${msg.role === "user" ? theme.colors.accent.primary : theme.colors.border.subtle}`,
            background: msg.role === "user" ? `${theme.colors.accent.primary}15` : theme.colors.background.tertiary,
          }}>
            <div style={{ color: msg.role === "user" ? theme.colors.accent.primary : theme.colors.text.muted, fontSize: theme.fontSize.xs, marginBottom: '2px' }}>
              {msg.role === "user" ? "▸ YOU" : `▸ ${agent?.name?.toUpperCase() || 'BOT'}`}
            </div>
            <div style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.xs, whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: theme.spacing.xs, border: `1px solid ${theme.colors.border.subtle}`, background: theme.colors.background.tertiary }}>
            <div style={{ color: theme.colors.text.muted, fontSize: theme.fontSize.xs }}>▸ PROCESSING...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: theme.spacing.xs, borderTop: `2px solid ${theme.colors.border.default}`, background: theme.colors.background.primary, display: "flex", gap: theme.spacing.xs }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ENTER COMMAND..."
          disabled={loading}
          style={{
            flex: 1,
            padding: theme.spacing.xs,
            border: `1px solid ${theme.colors.border.default}`,
            background: theme.colors.background.tertiary,
            color: theme.colors.text.primary,
            fontSize: theme.fontSize.xs,
            fontFamily: theme.fonts.mono,
            outline: "none",
          }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
          width: 36,
          height: 36,
          border: `1px solid ${theme.colors.border.default}`,
          background: input.trim() && !loading ? theme.colors.accent.primary : theme.colors.background.tertiary,
          color: input.trim() && !loading ? theme.colors.text.inverse : theme.colors.text.muted,
          cursor: input.trim() && !loading ? "pointer" : "not-allowed",
          fontFamily: theme.fonts.mono,
        }}>
          ▸
        </button>
      </div>
    </div>
  );
}
