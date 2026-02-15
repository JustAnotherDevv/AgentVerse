import { usePrivy } from "@privy-io/react-auth";
import { theme } from "../../lib/theme";

interface MainMenuProps {
  onStart: () => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
  const { user, login, logout, ready } = usePrivy();

  const walletAddress = user?.wallet?.address;
  const isAuthenticated = !!user;
  const isReady = ready === true;

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const canStart = isReady && isAuthenticated;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.colors.background.primary,
      zIndex: 10000,
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
          disabled={!canStart}
          style={{
            padding: "16px 48px",
            background: canStart ? theme.colors.background.secondary : theme.colors.background.tertiary,
            border: `2px solid ${canStart ? theme.colors.border.default : theme.colors.border.subtle}`,
            color: canStart ? theme.colors.text.primary : theme.colors.text.muted,
            fontSize: theme.fontSize.lg,
            fontFamily: theme.fonts.mono,
            cursor: canStart ? "pointer" : "not-allowed",
            letterSpacing: "2px",
            textTransform: "uppercase",
            opacity: canStart ? 1 : 0.5,
          }}
        >
          {canStart ? "START GAME" : "CONNECT WALLET TO PLAY"}
        </button>

        {!isReady ? (
          <div style={{
            padding: "12px 48px",
            background: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.default}`,
            color: theme.colors.text.muted,
            fontSize: theme.fontSize.base,
            fontFamily: theme.fonts.mono,
          }}>
            LOADING...
          </div>
        ) : !isAuthenticated ? (
          <button
            onClick={login}
            style={{
              padding: "12px 48px",
              background: theme.colors.background.secondary,
              border: `2px solid ${theme.colors.accent.primary}`,
              color: theme.colors.text.primary,
              fontSize: theme.fontSize.base,
              fontFamily: theme.fonts.mono,
              cursor: "pointer",
              letterSpacing: "1px",
            }}
          >
            CONNECT WALLET
          </button>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "center",
          }}>
            <div style={{
              padding: "12px 48px",
              background: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.default}`,
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              fontFamily: theme.fonts.mono,
              textAlign: "center",
            }}>
              {walletAddress ? `CONNECTED: ${formatAddress(walletAddress)}` : "SIGNED IN"}
            </div>
            <button
              onClick={logout}
              style={{
                padding: "12px 48px",
                background: "transparent",
                border: `1px solid ${theme.colors.border.default}`,
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.base,
                fontFamily: theme.fonts.mono,
                cursor: "pointer",
                letterSpacing: "1px",
                width: "100%",
              }}
            >
              DISCONNECT
            </button>
          </div>
        )}

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
