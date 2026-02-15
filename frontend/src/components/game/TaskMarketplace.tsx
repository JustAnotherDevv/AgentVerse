import { useState } from "react";
import { X, Plus, Search, DollarSign } from "lucide-react";
import type { Task, Agent } from "../../hooks/useAgentSystem";

interface TaskMarketplaceProps {
  agents: Agent[];
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
      case "open": return "#22c55e";
      case "accepted": return "#f59e0b";
      case "completed": return "#3b82f6";
      case "disputed": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assist": return "💬";
      case "build": return "🏗️";
      case "explore": return "🔍";
      case "create": return "🎨";
      default: return "📝";
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "500px",
      maxHeight: "80vh",
      background: "rgba(15, 23, 42, 0.98)",
      borderRadius: "16px",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      boxShadow: "0 16px 64px rgba(0, 0, 0, 0.5)",
      zIndex: 300,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.2))",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <h2 style={{ margin: 0, color: "white", fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          📋 Task Marketplace
        </h2>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => setActiveTab("browse")}
          style={{
            flex: 1,
            padding: "14px",
            background: activeTab === "browse" ? "rgba(139, 92, 246, 0.15)" : "transparent",
            border: "none",
            color: activeTab === "browse" ? "#a78bfa" : "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontWeight: activeTab === "browse" ? "bold" : "normal",
            fontSize: "14px",
          }}
        >
          Browse Tasks
        </button>
        <button
          onClick={() => setActiveTab("create")}
          style={{
            flex: 1,
            padding: "14px",
            background: activeTab === "create" ? "rgba(139, 92, 246, 0.15)" : "transparent",
            border: "none",
            color: activeTab === "create" ? "#a78bfa" : "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontWeight: activeTab === "create" ? "bold" : "normal",
            fontSize: "14px",
          }}
        >
          Post Task
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
        {activeTab === "browse" ? (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {["all", "open", "accepted", "completed"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 12px",
                    background: filter === f ? "rgba(139, 92, 246, 0.3)" : "rgba(255,255,255,0.05)",
                    border: "none",
                    borderRadius: "6px",
                    color: filter === f ? "#a78bfa" : "rgba(255,255,255,0.6)",
                    fontSize: "12px",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Task List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                  <Search size={40} style={{ marginBottom: "12px", opacity: 0.5 }} />
                  <p>No tasks found</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} style={{
                    padding: "14px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{getTypeIcon(task.type)}</span>
                        <span style={{ color: "white", fontWeight: "500" }}>{task.type}</span>
                      </div>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        background: getStatusColor(task.status),
                        color: "white",
                      }}>
                        {task.status}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 12px 0", color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
                      {task.description}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#22c55e", fontWeight: "bold" }}>
                        <DollarSign size={14} />
                        {task.reward}
                      </div>
                      {task.requiredSkill && (
                        <span style={{ color: "#60a5fa", fontSize: "12px" }}>
                          Requires: {task.requiredSkill}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Task Type */}
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "12px", marginBottom: "6px" }}>
                Task Type
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {["assist", "build", "explore", "create"].map(type => (
                  <button
                    key={type}
                    onClick={() => setNewTask({ ...newTask, type: type as any })}
                    style={{
                      padding: "12px",
                      background: newTask.type === type ? "rgba(139, 92, 246, 0.3)" : "rgba(255,255,255,0.05)",
                      border: newTask.type === type ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: newTask.type === type ? "#a78bfa" : "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{getTypeIcon(type)}</span>
                    <span style={{ textTransform: "capitalize" }}>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "12px", marginBottom: "6px" }}>
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="What do you need help with?"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                  minHeight: "80px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Reward */}
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "12px", marginBottom: "6px" }}>
                Reward (pathUSD)
              </label>
              <input
                type="number"
                value={newTask.reward}
                onChange={e => setNewTask({ ...newTask, reward: parseInt(e.target.value) || 0 })}
                min={1}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Required Skill */}
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "12px", marginBottom: "6px" }}>
                Required Skill (optional)
              </label>
              <select
                value={newTask.requiredSkill}
                onChange={e => setNewTask({ ...newTask, requiredSkill: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                }}
              >
                <option value="">Any skill</option>
                <option value="assistant">Assistant</option>
                <option value="builder">Builder</option>
                <option value="explorer">Explorer</option>
                <option value="mediator">Mediator</option>
                <option value="create">Creator</option>
              </select>
            </div>

            {/* Submit */}
            <button
              onClick={handleCreate}
              disabled={!newTask.description}
              style={{
                width: "100%",
                padding: "14px",
                background: newTask.description ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "8px",
                color: newTask.description ? "white" : "rgba(255,255,255,0.4)",
                fontWeight: "bold",
                cursor: newTask.description ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              <Plus size={16} />
              Post Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
