import { useState, useEffect, useRef } from "react";

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
    avatar: { emoji: string };
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
        content: `Hi! I'm ${agent.name}. ${agent.avatar.emoji} How can I help you today?`
      }]);
    }
  }, [open, agent]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !onSend) return;
    
    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const data = await onSend(userMessage);
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.response || "Sorry, I didn't get a response."
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Failed to send message. Please try again."
      }]);
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
      bottom: "20px",
      right: "20px",
      width: "380px",
      height: "500px",
      background: "#1f2937",
      borderRadius: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 1000,
      border: "2px solid #8b5cf6",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#a855f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}>
            {agent?.avatar?.emoji || "🤖"}
          </div>
          <div>
            <div style={{ color: "white", fontWeight: "bold", fontSize: "16px" }}>{agent?.name || "Agent"}</div>
            <div style={{ color: "#c4b5fd", fontSize: "12px" }}>AI Assistant</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            color: "white",
            fontSize: "18px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              padding: "10px 14px",
              borderRadius: "16px",
              background: msg.role === "user" ? "#8b5cf6" : "#374151",
              color: "white",
              fontSize: "14px",
              lineHeight: "1.4",
              wordBreak: "break-word",
            }}
          >
            {msg.role === "assistant" && (
              <span style={{ marginRight: "6px" }}>🤖</span>
            )}
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start",
            padding: "10px 14px",
            borderRadius: "16px",
            background: "#374151",
            color: "#9ca3af",
            fontSize: "14px",
          }}>
            Typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px",
        borderTop: "1px solid #374151",
        display: "flex",
        gap: "8px",
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "24px",
            border: "1px solid #4b5563",
            background: "#111827",
            color: "white",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            background: input.trim() ? "#8b5cf6" : "#4b5563",
            color: "white",
            cursor: input.trim() ? "pointer" : "not-allowed",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
