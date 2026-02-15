import { useState } from "react";
import { theme } from "../../lib/theme";
import type { Task } from "../../hooks/useAgentSystem";

interface TaskMarketplaceProps {
  tasks: Task[];
  onCreateTask: (task: Partial<Task>) => Promise<any>;
  onClose: () => void;
}

export function TaskMarketplace({ tasks, onCreateTask, onClose }: TaskMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "create">("browse");
  const [filter, setFilter] = useState<string>("all");
  const [newTask, setNewTask] = useState({
    type: "assist" as const,
    description: "",
    reward: 10,
    requiredSkill: ""
  });

  const filteredTasks = tasks.filter(t => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const handleCreate = async () => {
    if (!newTask.description) return;
    await onCreateTask(newTask);
    setNewTask({ type: "assist", description: "", reward: 10, requiredSkill: "" });
    setActiveTab("browse");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return theme.colors.accent.primary;
      case "accepted": return theme.colors.accent.warning;
      case "completed": return theme.colors.accent.tertiary;
      case "disputed": return theme.colors.accent.error;
      default: return theme.colors.text.muted;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assist": return "A";
      case "build": return "B";
      case "explore": return "E";
      case "create": return "C";
      default: return "T";
    }
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
      zIndex: 2000,
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
          TASK MANAGER
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
        {(["browse", "create"] as const).map((tab) => (
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

      {/* Content */}
      <div style={{ padding: theme.spacing.md, overflowY: "auto", maxHeight: "60vh" }}>
        {activeTab === "browse" ? (
          <>
            <div style={{ display: "flex", gap: theme.spacing.xs, marginBottom: theme.spacing.md, flexWrap: "wrap" }}>
              {["all", "open", "accepted", "completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    background: filter === f ? theme.colors.accent.primary : "transparent",
                    border: `1px solid ${theme.colors.border.default}`,
                    color: filter === f ? theme.colors.text.inverse : theme.colors.text.primary,
                    cursor: "pointer",
                    fontSize: theme.fontSize.xs,
                    fontFamily: theme.fonts.mono,
                    textTransform: 'uppercase',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.sm }}>
              {filteredTasks.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: theme.spacing.xl, 
                  color: theme.colors.text.muted,
                  border: `1px dashed ${theme.colors.border.subtle}`,
                  fontSize: theme.fontSize.xs,
                }}>
                  NO TASKS FOUND
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div key={task.id} style={{
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.border.subtle}`,
                    background: theme.colors.background.tertiary,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs }}>
                      <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.xs }}>
                        <span style={{ fontSize: '16px' }}>{getTypeIcon(task.type)}</span>
                        <span style={{ color: theme.colors.text.primary, fontWeight: 600, fontSize: theme.fontSize.xs }}>{task.type}</span>
                      </div>
                      <span style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        fontSize: theme.fontSize.xs,
                        background: getStatusColor(task.status),
                        color: 'black',
                        fontWeight: 700,
                      }}>
                        {task.status}
                      </span>
                    </div>
                    <p style={{ margin: `0 0 ${theme.spacing.sm} 0`, color: theme.colors.text.secondary, fontSize: theme.fontSize.xs }}>
                      {task.description}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: theme.colors.accent.primary, fontWeight: 700, fontSize: theme.fontSize.xs }}>
                        +{task.reward} USDC
                      </span>
                      {task.requiredSkill && (
                        <span style={{ color: theme.colors.accent.tertiary, fontSize: theme.fontSize.xs }}>
                          REQ: {task.requiredSkill}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.md }}>
            <div>
              <label style={{ display: "block", color: theme.colors.text.muted, fontSize: theme.fontSize.xs, marginBottom: theme.spacing.xs }}>
                TYPE
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: theme.spacing.xs }}>
                {["assist", "build", "explore", "create"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewTask({ ...newTask, type: type as any })}
                    style={{
                      padding: theme.spacing.sm,
                      background: newTask.type === type ? theme.colors.accent.primary : 'transparent',
                      border: `1px solid ${theme.colors.border.default}`,
                      color: newTask.type === type ? theme.colors.text.inverse : theme.colors.text.primary,
                      cursor: "pointer",
                      fontSize: theme.fontSize.xs,
                      fontFamily: theme.fonts.mono,
                    }}
                  >
                    {getTypeIcon(type)} {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: theme.colors.text.muted, fontSize: theme.fontSize.xs, marginBottom: theme.spacing.xs }}>
                DESCRIPTION
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description..."
                style={{
                  width: "100%",
                  padding: theme.spacing.sm,
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.xs,
                  fontFamily: theme.fonts.mono,
                  minHeight: "60px",
                  resize: "vertical",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: theme.colors.text.muted, fontSize: theme.fontSize.xs, marginBottom: theme.spacing.xs }}>
                REWARD (USDC)
              </label>
              <input
                type="number"
                value={newTask.reward}
                onChange={(e) => setNewTask({ ...newTask, reward: parseInt(e.target.value) || 0 })}
                min={1}
                style={{
                  width: "100%",
                  padding: theme.spacing.sm,
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.xs,
                  fontFamily: theme.fonts.mono,
                }}
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={!newTask.description}
              style={{
                width: "100%",
                padding: theme.spacing.sm,
                background: newTask.description ? theme.colors.accent.primary : theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                color: newTask.description ? theme.colors.text.inverse : theme.colors.text.muted,
                cursor: newTask.description ? "pointer" : "not-allowed",
                fontWeight: 700,
                fontSize: theme.fontSize.xs,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontFamily: theme.fonts.mono,
              }}
            >
              {newTask.description ? 'SUBMIT TASK' : 'ENTER DESCRIPTION'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
