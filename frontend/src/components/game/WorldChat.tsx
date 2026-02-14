import { useEffect, useRef } from "react";
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '320px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderLeft: '1px solid rgba(139, 92, 246, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '18px' }}>💬</span>
        <span style={{ 
          color: '#e2e8f0', 
          fontWeight: 'bold', 
          fontSize: '14px',
          letterSpacing: '0.5px'
        }}>
          WORLD CHAT
        </span>
        <span style={{
          marginLeft: 'auto',
          background: '#22c55e',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
        }} />
      </div>

      <div 
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {messages.length === 0 && (
          <div style={{
            color: '#64748b',
            textAlign: 'center',
            padding: '20px',
            fontSize: '13px',
          }}>
            No messages yet...
          </div>
        )}
        
        {messages.map((msg) => {
          if (msg.type === 'world_event') {
            return (
              <div key={msg.id} style={{
                background: 'rgba(100, 116, 139, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#94a3b8',
                textAlign: 'center',
                fontStyle: 'italic',
              }}>
                {msg.content}
              </div>
            );
          }

          return (
            <div 
              key={msg.id}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                borderRadius: '10px',
                padding: '10px 12px',
                borderLeft: msg.type === 'system' 
                  ? '3px solid #f59e0b' 
                  : '3px solid #8b5cf6',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}>
                {msg.avatar && (
                  <span style={{ fontSize: '14px' }}>{msg.avatar.emoji}</span>
                )}
                <span style={{
                  color: '#a5b4fc',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}>
                  {msg.agentName}
                </span>
                <span style={{
                  color: '#475569',
                  fontSize: '11px',
                  marginLeft: 'auto',
                }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <div style={{
                color: '#e2e8f0',
                fontSize: '13px',
                lineHeight: '1.4',
                wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(139, 92, 246, 0.3)',
        fontSize: '11px',
        color: '#64748b',
        textAlign: 'center',
      }}>
        Press Enter to send
      </div>
    </div>
  );
}
