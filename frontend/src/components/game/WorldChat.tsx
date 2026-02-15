import { useEffect, useRef } from "react";
import { theme } from "../../lib/theme";
import type { WorldMessage } from "../../hooks/useAgentSystem";

interface WorldChatProps {
  messages: WorldMessage[];
}

export function WorldChat({ messages }: WorldChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '260px',
      background: theme.colors.background.secondary,
      borderLeft: `2px solid ${theme.colors.border.default}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 5000,
      fontFamily: theme.fonts.mono,
    }}>
      {/* Header */}
      <div style={{
        padding: `${theme.spacing.sm} ${theme.spacing.xs}`,
        borderBottom: `2px solid ${theme.colors.border.default}`,
        background: theme.colors.background.primary,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.xs,
      }}>
        <div style={{ width: 8, height: 8, background: theme.colors.accent.primary }} />
        <span style={{ 
          color: theme.colors.text.primary, 
          fontWeight: 700, 
          fontSize: theme.fontSize.xs,
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          WORLD FEED
        </span>
        <span style={{ marginLeft: 'auto', color: theme.colors.text.muted, fontSize: theme.fontSize.xs }}>
          {messages.length}
        </span>
      </div>

      {/* Messages */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: theme.spacing.xs, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        {messages.length === 0 && (
          <div style={{ color: theme.colors.text.muted, textAlign: 'center', padding: theme.spacing.md, fontSize: theme.fontSize.xs, border: `1px dashed ${theme.colors.border.subtle}`, margin: theme.spacing.xs }}>
            <span style={{ animation: 'blink 1s infinite' }}>▌</span> WAITING FOR DATA...
          </div>
        )}
        
        {messages.map((msg) => {
          if (msg.type === 'world_event') {
            return (
              <div key={msg.id} style={{ background: theme.colors.background.tertiary, border: `1px solid ${theme.colors.border.subtle}`, padding: `${theme.spacing.xs} ${theme.spacing.sm}`, fontSize: theme.fontSize.xs, color: theme.colors.text.tertiary }}>
                {msg.content}
              </div>
            );
          }

          return (
            <div key={msg.id} style={{ background: theme.colors.background.tertiary, border: `1px solid ${theme.colors.border.subtle}`, padding: theme.spacing.xs }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginBottom: '2px', fontSize: theme.fontSize.xs }}>
                {msg.avatar && <span style={{ fontSize: '11px' }}>{msg.avatar.emoji}</span>}
                <span style={{ color: theme.colors.accent.primary, fontWeight: 700 }}>{msg.agentName}</span>
                <span style={{ color: theme.colors.text.muted, marginLeft: 'auto', fontSize: 10 }}>{formatTime(msg.timestamp)}</span>
              </div>
              <div style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.xs, lineHeight: 1.4 }}>{msg.content}</div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: theme.spacing.xs, borderTop: `2px solid ${theme.colors.border.default}`, fontSize: theme.fontSize.xs, color: theme.colors.text.muted, textAlign: 'center', background: theme.colors.background.primary }}>
        ▸ PRESS ENTER TO TRANSMIT
      </div>
      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}
