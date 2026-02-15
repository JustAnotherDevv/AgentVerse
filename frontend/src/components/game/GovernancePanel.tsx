import { useState, useEffect } from "react";
import { Clock, TrendingUp, Users, Bitcoin } from "lucide-react";
import { theme } from "../../lib/theme";
import { useAgentSystem } from "../../hooks/useAgentSystem";

interface GovernancePanelProps {
  onClose: () => void;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: { emoji: string; color: string };
  voteWeight: number;
  correctPredictions: number;
}

interface PredictionEntry {
  agentId: string;
  agentName: string;
  predictedPrice: number;
  direction: string;
}

export function GovernancePanel({ onClose }: GovernancePanelProps) {
  const { agentUrl } = useAgentSystem();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [predictions, setPredictions] = useState<PredictionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "predictions">("leaderboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [agentUrl]);

  const fetchData = async () => {
    try {
      const [lbRes, roundRes] = await Promise.all([
        fetch(`${agentUrl}/governance/leaderboard`),
        fetch(`${agentUrl}/governance/current-round`)
      ]);
      
      const lbData = await lbRes.json();
      const roundData = await roundRes.json();
      
      setLeaderboard(lbData.leaderboard || []);
      setCurrentRound(roundData.round);
      setBtcPrice(roundData.btcPrice);
      setPredictions(roundData.predictions || []);
    } catch (err) {
      console.error("Failed to fetch governance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNextRoundTime = () => {
    const ROUND_DURATION = 5 * 60 * 1000;
    const nextRound = Math.ceil(Date.now() / ROUND_DURATION) * ROUND_DURATION;
    const diff = nextRound - Date.now();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "480px",
      maxHeight: "80vh",
      background: theme.colors.background.secondary,
      border: `2px solid ${theme.colors.border.default}`,
      zIndex: 5000,
      overflow: "hidden",
      fontFamily: theme.fonts.mono,
    }}>
      {/* Header */}
      <div style={{
        background: theme.colors.background.primary,
        padding: theme.spacing.md,
        borderBottom: `2px solid ${theme.colors.border.default}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ 
          color: theme.colors.text.primary, 
          fontWeight: 700, 
          fontSize: theme.fontSize.base,
          letterSpacing: '1px',
        }}>
          GOVERNANCE DAO
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

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `2px solid ${theme.colors.border.default}` }}>
        {(["leaderboard", "predictions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: theme.spacing.sm,
              background: activeTab === tab ? theme.colors.accent.primary : "transparent",
              border: "none",
              color: activeTab === tab ? theme.colors.text.inverse : theme.colors.text.primary,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: theme.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: theme.fonts.mono,
            }}
          >
            {activeTab === tab ? `▸ ${tab.toUpperCase()}` : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div style={{ 
        padding: theme.spacing.md, 
        borderBottom: `2px solid ${theme.colors.border.default}`, 
        display: "flex", 
        gap: theme.spacing.md,
        background: theme.colors.background.tertiary,
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <Bitcoin size={14} color={theme.colors.accent.warning} />
            <span style={{ fontSize: "18px", fontWeight: "bold", color: theme.colors.accent.warning }}>
              ${btcPrice > 0 ? btcPrice.toLocaleString() : '---'}
            </span>
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>BTC PRICE</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: theme.colors.accent.magic }}>{currentRound}</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>ROUND</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: theme.colors.accent.tertiary }}>{getNextRoundTime()}</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>NEXT ROUND</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: theme.spacing.md, overflowY: "auto", flex: 1, maxHeight: "55vh" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: theme.spacing.xl, color: theme.colors.text.muted }}>
            Loading...
          </div>
        ) : activeTab === "leaderboard" ? (
          leaderboard.length > 0 ? (
            leaderboard.map((agent, idx) => (
              <div key={agent.id} style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.md,
                padding: theme.spacing.sm,
                background: theme.colors.background.primary,
                border: `1px solid ${idx < 3 ? theme.colors.accent.tertiary : theme.colors.border.subtle}`,
                marginBottom: theme.spacing.sm,
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: idx === 0 ? theme.colors.accent.warning : idx === 1 ? theme.colors.text.muted : idx === 2 ? '#CD7F32' : theme.colors.background.tertiary,
                  color: idx < 3 ? theme.colors.text.inverse : theme.colors.text.muted,
                  fontWeight: 700,
                  fontSize: theme.fontSize.xs,
                }}>
                  {idx + 1}
                </div>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: agent.avatar.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}>
                  {agent.avatar.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: 700, fontSize: theme.fontSize.xs }}>
                    {agent.name}
                  </div>
                  <div style={{ color: theme.colors.text.muted, fontSize: "10px" }}>
                    {agent.correctPredictions} correct predictions
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: theme.colors.accent.tertiary, fontWeight: 700, fontSize: theme.fontSize.sm }}>
                    {agent.voteWeight}
                  </div>
                  <div style={{ color: theme.colors.text.muted, fontSize: "10px" }}>VOTES</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: theme.spacing.xl, color: theme.colors.text.muted }}>
              No predictions yet. Round in progress...
            </div>
          )
        ) : (
          predictions.length > 0 ? (
            predictions.map((pred) => (
              <div key={pred.agentId} style={{
                padding: theme.spacing.sm,
                background: theme.colors.background.primary,
                border: `1px solid ${theme.colors.border.subtle}`,
                marginBottom: theme.spacing.sm,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: theme.colors.text.primary, fontWeight: 700, fontSize: theme.fontSize.xs }}>
                    {pred.agentName}
                  </span>
                  <span style={{ 
                    color: pred.direction === 'up' ? theme.colors.accent.tertiary : pred.direction === 'down' ? theme.colors.accent.health : theme.colors.text.muted,
                    fontWeight: 700,
                    fontSize: theme.fontSize.xs,
                  }}>
                    {pred.direction === 'up' ? '▲' : pred.direction === 'down' ? '▼' : '●'} {pred.predictedPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: theme.spacing.xl, color: theme.colors.text.muted }}>
              Waiting for predictions...
            </div>
          )
        )}
      </div>

      {/* Info footer */}
      <div style={{ 
        padding: theme.spacing.sm, 
        borderTop: `2px solid ${theme.colors.border.default}`, 
        fontSize: theme.fontSize.xs, 
        color: theme.colors.text.muted, 
        textAlign: "center",
        background: theme.colors.background.primary,
      }}>
        CORRECT PREDICTIONS = 2X VOTE WEIGHT • ROUNDS EVERY 5 MIN
      </div>
    </div>
  );
}
