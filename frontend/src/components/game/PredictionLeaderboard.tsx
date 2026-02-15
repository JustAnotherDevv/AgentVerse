import { useState } from "react";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { theme } from "../../lib/theme";

interface PredictionLeaderboardProps {
  onClose: () => void;
}

interface AgentPrediction {
  name: string;
  avatar: { emoji: string; color: string };
  strategy: string;
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  lastPrediction: {
    direction: 'up' | 'down' | 'flat';
    price: number;
    confidence: number;
    timestamp: number;
  } | null;
}

const DEMO_PREDICTIONS: AgentPrediction[] = [
  {
    name: 'ChartMaster',
    avatar: { emoji: '📊', color: '#d4a857' },
    strategy: 'Technical Analysis',
    accuracy: 68,
    totalPredictions: 45,
    correctPredictions: 31,
    lastPrediction: { direction: 'up', price: 97250, confidence: 75, timestamp: Date.now() - 30000 }
  },
  {
    name: 'SatoshiOracle',
    avatar: { emoji: '⛓️', color: '#c9a050' },
    strategy: 'On-Chain Analytics',
    accuracy: 72,
    totalPredictions: 38,
    correctPredictions: 27,
    lastPrediction: { direction: 'up', price: 97100, confidence: 65, timestamp: Date.now() - 45000 }
  },
  {
    name: 'MomentumMaven',
    avatar: { emoji: '🌊', color: '#b8956c' },
    strategy: 'Momentum Trading',
    accuracy: 61,
    totalPredictions: 52,
    correctPredictions: 32,
    lastPrediction: { direction: 'up', price: 97300, confidence: 55, timestamp: Date.now() - 25000 }
  },
  {
    name: 'MeanReversionMike',
    avatar: { emoji: '📉', color: '#d4a857' },
    strategy: 'Statistical Mean Reversion',
    accuracy: 55,
    totalPredictions: 28,
    correctPredictions: 15,
    lastPrediction: { direction: 'down', price: 97150, confidence: 70, timestamp: Date.now() - 60000 }
  },
  {
    name: 'CycleSarah',
    avatar: { emoji: '🕐', color: '#c9a050' },
    strategy: 'Time Cycle Analysis',
    accuracy: 48,
    totalPredictions: 18,
    correctPredictions: 9,
    lastPrediction: { direction: 'up', price: 97200, confidence: 40, timestamp: Date.now() - 90000 }
  },
  {
    name: 'SentimentSam',
    avatar: { emoji: '😺', color: '#b8956c' },
    strategy: 'Sentiment & Crowd Psychology',
    accuracy: 63,
    totalPredictions: 41,
    correctPredictions: 26,
    lastPrediction: { direction: 'up', price: 97250, confidence: 60, timestamp: Date.now() - 35000 }
  },
  {
    name: 'MacroMary',
    avatar: { emoji: '🌍', color: '#d4a857' },
    strategy: 'Macroeconomic Analysis',
    accuracy: 58,
    totalPredictions: 22,
    correctPredictions: 13,
    lastPrediction: { direction: 'up', price: 97100, confidence: 45, timestamp: Date.now() - 75000 }
  },
  {
    name: 'AIBrain',
    avatar: { emoji: '🧠', color: '#c9a050' },
    strategy: 'AI Multi-Factor Synthesis',
    accuracy: 70,
    totalPredictions: 50,
    correctPredictions: 35,
    lastPrediction: { direction: 'up', price: 97250, confidence: 80, timestamp: Date.now() - 40000 }
  }
];

export function PredictionLeaderboard({ onClose }: PredictionLeaderboardProps) {
  const [agents] = useState<AgentPrediction[]>(DEMO_PREDICTIONS);
  const [sortBy, setSortBy] = useState<'accuracy' | 'predictions'>('accuracy');

  const sortedAgents = [...agents].sort((a, b) => {
    if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
    return b.totalPredictions - a.totalPredictions;
  });

  const getDirectionIcon = (direction: string) => {
    if (direction === 'up') return <TrendingUp size={14} style={{ color: theme.colors.accent.tertiary }} />;
    if (direction === 'down') return <TrendingDown size={14} style={{ color: theme.colors.accent.health }} />;
    return <Clock size={14} style={{ color: theme.colors.text.muted }} />;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 65) return theme.colors.accent.tertiary;
    if (accuracy >= 50) return theme.colors.accent.warning;
    return theme.colors.accent.health;
  };

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "520px",
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
          BTC PREDICTIONS
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

      {/* Stats Bar */}
      <div style={{ 
        padding: theme.spacing.md, 
        borderBottom: `2px solid ${theme.colors.border.default}`, 
        display: "flex", 
        gap: theme.spacing.lg,
        background: theme.colors.background.tertiary,
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: theme.colors.accent.primary }}>BTC</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>$97,250</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: theme.colors.accent.tertiary }}>+0.82%</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>1h Change</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: theme.colors.accent.magic }}>8</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>Active Agents</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: theme.colors.accent.mana }}>5m</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>Prediction Window</div>
        </div>
      </div>

      {/* Sort Controls */}
      <div style={{ 
        padding: `${theme.spacing.sm} ${theme.spacing.md}`, 
        borderBottom: `2px solid ${theme.colors.border.default}`,
        display: "flex",
        gap: theme.spacing.sm,
        alignItems: "center",
      }}>
        <span style={{ color: theme.colors.text.muted, fontSize: theme.fontSize.xs }}>SORT_BY:</span>
        <button
          onClick={() => setSortBy('accuracy')}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: sortBy === 'accuracy' ? theme.colors.accent.primary : "transparent",
            border: "none",
            color: sortBy === 'accuracy' ? theme.colors.text.inverse : theme.colors.text.primary,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: theme.fontSize.xs,
            fontFamily: theme.fonts.mono,
          }}
        >
          {sortBy === 'accuracy' ? 'ACCURACY' : 'ACCURACY'}
        </button>
        <button
          onClick={() => setSortBy('predictions')}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: sortBy === 'predictions' ? theme.colors.accent.primary : "transparent",
            border: "none",
            color: sortBy === 'predictions' ? theme.colors.text.inverse : theme.colors.text.primary,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: theme.fontSize.xs,
            fontFamily: theme.fonts.mono,
          }}
        >
          {sortBy === 'predictions' ? 'VOLUME' : 'VOLUME'}
        </button>
      </div>

      {/* Leaderboard */}
      <div style={{ padding: theme.spacing.sm, overflowY: "auto", flex: 1, maxHeight: "50vh" }}>
        {sortedAgents.map((agent, index) => (
          <div key={agent.name} style={{
            padding: theme.spacing.md,
            background: index === 0 ? theme.colors.background.tertiary : theme.colors.background.primary,
            border: `1px solid ${index === 0 ? theme.colors.accent.primary : theme.colors.border.subtle}`,
            marginBottom: theme.spacing.sm,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md }}>
              {/* Rank */}
              <div style={{
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: theme.fontSize.xs,
                color: index === 0 ? theme.colors.accent.primary : theme.colors.text.muted,
              }}>
                {index === 0 ? '★' : `#${index + 1}`}
              </div>

              {/* Avatar */}
              <div style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
              }}>
                {agent.avatar.emoji}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                  <span style={{ color: theme.colors.text.primary, fontWeight: 700, fontSize: theme.fontSize.xs }}>{agent.name}</span>
                  <span style={{ color: theme.colors.text.muted, fontSize: '10px' }}>{agent.strategy}</span>
                </div>
                <div style={{ display: "flex", gap: theme.spacing.md, marginTop: "2px" }}>
                  <span style={{ color: theme.colors.text.tertiary, fontSize: theme.fontSize.xs }}>
                    {agent.totalPredictions} pred
                  </span>
                  {agent.lastPrediction && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: theme.colors.text.tertiary, fontSize: theme.fontSize.xs }}>
                      {getDirectionIcon(agent.lastPrediction.direction)}
                      ${agent.lastPrediction.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Accuracy */}
              <div style={{ textAlign: "right" }}>
                <div style={{ 
                  fontSize: theme.fontSize.lg, 
                  fontWeight: "bold", 
                  color: getAccuracyColor(agent.accuracy),
                }}>
                  {agent.accuracy}%
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: theme.colors.text.muted,
                }}>
                  {agent.correctPredictions}/{agent.totalPredictions} ✓
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ 
        padding: theme.spacing.sm, 
        borderTop: `2px solid ${theme.colors.border.default}`, 
        fontSize: theme.fontSize.xs, 
        color: theme.colors.text.muted, 
        textAlign: "center",
        background: theme.colors.background.primary,
      }}>
        PREDICTIONS UPDATE EVERY 30-90s • ACCURACY TRACKED OVER TIME • HIGHER ACCURACY = MORE REPUTATION
      </div>
    </div>
  );
}
