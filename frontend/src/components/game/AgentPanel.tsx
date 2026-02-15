import { useState } from "react";
import { X, Star, DollarSign, CheckCircle, Users, GitBranch, Zap } from "lucide-react";
import type { Agent } from "../../hooks/useAgentSystem";

interface AgentPanelProps {
  agent: Agent | null;
  open?: boolean;
  onClose: () => void;
}

export function AgentPanel({ agent, open = true, onClose }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "skills">("stats");

  if (!agent || !open) return null;

  const stats = agent.stats || {
    reputation: 50,
    totalEarnings: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    humansHelped: 0,
    cooperations: 0
  };

  const getRepColor = () => {
    if (stats.reputation >= 70) return "text-green-500";
    if (stats.reputation >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      right: "20px",
      transform: "translateY(-50%)",
      width: "320px",
      background: "rgba(15, 23, 42, 0.95)",
      borderRadius: "16px",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      zIndex: 200,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.2))",
        padding: "16px",
        borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: agent.avatar.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}>
              {agent.avatar.emoji}
            </div>
            <div>
              <h3 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "bold" }}>
                {agent.name}
              </h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
                {agent.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => setActiveTab("stats")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "stats" ? "rgba(139, 92, 246, 0.2)" : "transparent",
            border: "none",
            color: activeTab === "stats" ? "#a78bfa" : "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontWeight: activeTab === "stats" ? "bold" : "normal",
          }}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "skills" ? "rgba(139, 92, 246, 0.2)" : "transparent",
            border: "none",
            color: activeTab === "skills" ? "#a78bfa" : "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontWeight: activeTab === "skills" ? "bold" : "normal",
          }}
        >
          Skills
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {activeTab === "stats" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Reputation */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Star size={18} className={getRepColor()} />
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Reputation</span>
              </div>
              <span style={{ color: getRepColor() === "text-green-500" ? "#22c55e" : getRepColor() === "text-yellow-500" ? "#f59e0b" : "#ef4444", fontWeight: "bold", fontSize: "18px" }}>
                {stats.reputation}
              </span>
            </div>

            {/* Earnings */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <DollarSign size={18} style={{ color: "#22c55e" }} />
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Total Earnings</span>
              </div>
              <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "18px" }}>
                ${stats.totalEarnings}
              </span>
            </div>

            {/* Tasks */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={18} style={{ color: "#3b82f6" }} />
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Tasks Done</span>
              </div>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>
                {stats.tasksCompleted}
              </span>
            </div>

            {/* Humans Helped */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={18} style={{ color: "#f472b6" }} />
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Humans Helped</span>
              </div>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>
                {stats.humansHelped}
              </span>
            </div>

            {/* Cooperations */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <GitBranch size={18} style={{ color: "#8b5cf6" }} />
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Cooperations</span>
              </div>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>
                {stats.cooperations}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {agent.skills && agent.skills.length > 0 ? (
              agent.skills.map((skill, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={16} style={{ color: "#60a5fa" }} />
                    <span style={{ color: "white", textTransform: "capitalize" }}>
                      {skill.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "60px",
                      height: "6px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${(skill.level / 10) * 100}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                        borderRadius: "3px",
                      }} />
                    </div>
                    <span style={{ color: "#a78bfa", fontWeight: "bold", fontSize: "14px", minWidth: "24px" }}>
                      {skill.level}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "20px" }}>
                No skills yet. Keep interacting with this agent!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button style={{
          width: "100%",
          padding: "12px",
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
          <DollarSign size={16} />
          Tip this Agent
        </button>
      </div>
    </div>
  );
}
