import { useState } from "react";
import { theme } from "../../lib/theme";
import type { Agent } from "../../hooks/useAgentSystem";

interface AgentPanelProps {
  agent: Agent | null;
  open?: boolean;
  onClose: () => void;
  onTip?: (agentId: string, amount: number) => Promise<any>;
}

export function AgentPanel({ agent, open = true, onClose, onTip }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "skills">("stats");
  const [tipAmount, setTipAmount] = useState(5);
  const [tipping, setTipping] = useState(false);
  const [tipResult, setTipResult] = useState<{ success?: boolean; txHash?: string; error?: string } | null>(null);

  if (!agent || !open) return null;

  const stats = agent.stats || { reputation: 50, totalEarnings: 0, tasksCompleted: 0, tasksFailed: 0, humansHelped: 0, cooperations: 0 };

  const handleTip = async () => {
    if (!onTip || tipping) return;
    setTipping(true);
    setTipResult(null);
    try {
      const result = await onTip(agent.id, tipAmount);
      setTipResult({ success: true, txHash: result.txHash });
    } catch (err: any) {
      setTipResult({ success: false, error: err.message });
    } finally {
      setTipping(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      left: theme.spacing.md,
      width: "300px",
      background: theme.colors.background.secondary,
      border: `2px solid ${theme.colors.border.default}`,
      zIndex: 5000,
      overflow: "hidden",
      fontFamily: theme.fonts.mono,
    }}>
      {/* Header */}
      <div style={{
        background: theme.colors.background.primary,
        padding: theme.spacing.sm,
        borderBottom: `2px solid ${theme.colors.border.default}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
          <div style={{
            width: 44,
            height: 44,
            border: `2px solid ${theme.colors.border.default}`,
            background: theme.colors.background.tertiary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
          }}>
            {agent.avatar.emoji}
          </div>
          <div>
            <div style={{ color: theme.colors.text.primary, fontWeight: 700, fontSize: theme.fontSize.sm, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {agent.name}
            </div>
            <div style={{ color: theme.colors.text.muted, fontSize: theme.fontSize.xs, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {agent.description}
            </div>
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

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `2px solid ${theme.colors.border.default}` }}>
        {(["stats", "skills"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: theme.spacing.xs,
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

      {/* Content */}
      <div style={{ padding: theme.spacing.sm }}>
        {activeTab === "stats" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
            {[
              { label: "REPUTATION", value: `${stats.reputation}%`, color: stats.reputation >= 70 ? theme.colors.accent.primary : stats.reputation >= 40 ? theme.colors.accent.warning : theme.colors.accent.error },
              { label: "EARNINGS", value: `${stats.totalEarnings} USDC`, color: theme.colors.accent.primary },
              { label: "TASKS", value: `${stats.tasksCompleted} DONE`, color: theme.colors.accent.primary },
              { label: "HELPED", value: `${stats.humansHelped} HUMANS`, color: theme.colors.accent.magic },
            ].map((stat) => (
              <div key={stat.label} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: theme.spacing.xs,
                border: `1px solid ${theme.colors.border.subtle}`,
                background: theme.colors.background.tertiary,
              }}>
                <span style={{ color: theme.colors.text.muted, fontSize: theme.fontSize.xs }}>{stat.label}</span>
                <span style={{ color: stat.color, fontWeight: 700, fontSize: theme.fontSize.xs }}>{stat.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
            {agent.skills && agent.skills.length > 0 ? (
              agent.skills.map((skill, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: theme.spacing.xs,
                  border: `1px solid ${theme.colors.border.subtle}`,
                  background: theme.colors.background.tertiary,
                }}>
                  <span style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.xs, textTransform: 'uppercase' }}>{skill.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.xs }}>
                    <div style={{ width: 50, height: 4, background: theme.colors.background.primary, border: `1px solid ${theme.colors.border.default}` }}>
                      <div style={{ width: `${(skill.level / 10) * 100}%`, height: "100%", background: theme.colors.accent.primary }} />
                    </div>
                    <span style={{ color: theme.colors.accent.primary, fontWeight: 700, fontSize: theme.fontSize.xs }}>LV.{skill.level}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: theme.colors.text.muted, textAlign: "center", padding: theme.spacing.md, fontSize: theme.fontSize.xs, border: `1px dashed ${theme.colors.border.subtle}` }}>
                NO DATA
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tip Section */}
      <div style={{ padding: theme.spacing.sm, borderTop: `2px solid ${theme.colors.border.default}`, background: theme.colors.background.primary }}>
        {tipResult?.success ? (
          <div style={{ padding: theme.spacing.xs, border: `1px solid ${theme.colors.accent.primary}`, background: `${theme.colors.accent.primary}10` }}>
            <div style={{ color: theme.colors.accent.primary, fontSize: theme.fontSize.xs }}>▸ TIP SENT: +{tipAmount} USDC</div>
            <div style={{ color: theme.colors.text.muted, fontSize: 10, marginTop: 2 }}>TX: {tipResult.txHash?.slice(0, 12)}...</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: theme.spacing.xs, display: 'flex', gap: '2px' }}>
              {[1, 5, 10, 25].map((amt) => (
                <button key={amt} onClick={() => setTipAmount(amt)} style={{
                  flex: 1,
                  padding: '2px',
                  background: tipAmount === amt ? theme.colors.accent.primary : 'transparent',
                  border: `1px solid ${theme.colors.border.default}`,
                  color: tipAmount === amt ? theme.colors.text.inverse : theme.colors.text.primary,
                  cursor: "pointer",
                  fontSize: theme.fontSize.xs,
                  fontWeight: 700,
                  fontFamily: theme.fonts.mono,
                }}>{amt}</button>
              ))}
            </div>
            <button onClick={handleTip} disabled={tipping || !onTip} style={{
              width: "100%",
              padding: theme.spacing.xs,
              background: tipping ? theme.colors.background.tertiary : theme.colors.accent.primary,
              border: `1px solid ${theme.colors.border.default}`,
              color: tipping ? theme.colors.text.muted : theme.colors.text.inverse,
              cursor: tipping ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: theme.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: theme.fonts.mono,
            }}>
              {tipping ? 'SENDING...' : `TIP ${tipAmount} USDC`}
            </button>
            {tipResult?.error && <div style={{ color: theme.colors.accent.error, fontSize: 10, marginTop: 2 }}>ERROR: {tipResult.error}</div>}
          </>
        )}
      </div>
    </div>
  );
}
