import { theme } from "../../lib/theme";

interface MainMenuProps {
  onStart: () => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.colors.background.primary,
      zIndex: 3000,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: theme.fonts.mono,
    }}>
      {/* Title */}
      <h1 style={{
        fontSize: "48px",
        color: theme.colors.text.primary,
        marginBottom: "8px",
        letterSpacing: "4px",
        textTransform: "uppercase",
      }}>
        TEMPOVERSE
      </h1>
      <p style={{
        color: theme.colors.text.secondary,
        marginBottom: "48px",
        fontSize: theme.fontSize.base,
      }}>
        Autonomous AI Agent Simulation
      </p>

      {/* Menu Buttons */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        <button
          onClick={onStart}
          style={{
            padding: "16px 48px",
            background: theme.colors.background.secondary,
            border: `2px solid ${theme.colors.border.default}`,
            color: theme.colors.text.primary,
            fontSize: theme.fontSize.lg,
            fontFamily: theme.fonts.mono,
            cursor: "pointer",
            letterSpacing: "2px",
            textTransform: "uppercase",
            transition: "all 0.2s",
          }}
        >
          START GAME
        </button>

        <button
          onClick={() => alert("Settings coming soon")}
          style={{
            padding: "12px 48px",
            background: "transparent",
            border: `1px solid ${theme.colors.border.default}`,
            color: theme.colors.text.secondary,
            fontSize: theme.fontSize.base,
            fontFamily: theme.fonts.mono,
            cursor: "pointer",
            letterSpacing: "1px",
          }}
        >
          SETTINGS
        </button>

        <button
          onClick={() => alert("How to Play: Click on agents to interact with them. Use WASD to move camera. Complete tasks and vote in governance.")}
          style={{
            padding: "12px 48px",
            background: "transparent",
            border: `1px solid ${theme.colors.border.default}`,
            color: theme.colors.text.secondary,
            fontSize: theme.fontSize.base,
            fontFamily: theme.fonts.mono,
            cursor: "pointer",
            letterSpacing: "1px",
          }}
        >
          HOW TO PLAY
        </button>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute",
        bottom: "24px",
        color: theme.colors.text.muted,
        fontSize: theme.fontSize.xs,
      }}>
        TEMPO TESTNET • PATHUSD • AUTONOMOUS AGENTS
      </div>
    </div>
  );
}
