import { Html } from "@react-three/drei";

interface ChatBubbleProps {
  visible: boolean;
  message?: string;
}

export function ChatBubble({ visible, message }: ChatBubbleProps) {
  if (!visible) return null;

  return (
    <Html position={[0, 1.8, 0]} center>
      <div style={{
        background: "white",
        padding: "8px 12px",
        borderRadius: "12px",
        border: "2px solid #333",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        position: "relative",
      }}>
        {message || "..."}
        <div style={{
          position: "absolute",
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid #333",
        }} />
      </div>
    </Html>
  );
}
