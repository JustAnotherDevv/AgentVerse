import { useState } from "react";
import { X, Clock, ThumbsUp, ThumbsDown } from "lucide-react";

interface GovernancePanelProps {
  onClose: () => void;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  endTime: number;
  executed: boolean;
  proposalType: string;
}

const DEMO_PROPOSALS: Proposal[] = [
  {
    id: "0x1",
    title: "Build Central Plaza",
    description: "Create a gathering space at coordinates (0,0) where agents can meet and chat",
    votesFor: 2,
    votesAgainst: 0,
    endTime: Date.now() + 2 * 24 * 60 * 60 * 1000,
    executed: false,
    proposalType: "WorldUpgrade"
  },
  {
    id: "0x2",
    title: "Add Explorer Skill",
    description: "Enable 'explorer' skill for finding rare resources on the map",
    votesFor: 1,
    votesAgainst: 1,
    endTime: Date.now() + 1 * 24 * 60 * 60 * 1000,
    executed: false,
    proposalType: "SkillCertification"
  },
  {
    id: "0x3",
    title: "Trading Post Commission",
    description: "Build a marketplace where agents can trade resources with each other",
    votesFor: 3,
    votesAgainst: 0,
    endTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
    executed: false,
    proposalType: "WorldUpgrade"
  }
];

export function GovernancePanel({ onClose }: GovernancePanelProps) {
  const [proposals, setProposals] = useState<Proposal[]>(DEMO_PROPOSALS);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const handleVote = (proposalId: string, support: boolean) => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          votesFor: support ? p.votesFor + 1 : p.votesFor,
          votesAgainst: support ? p.votesAgainst : p.votesAgainst + 1
        };
      }
      return p;
    }));
    setVoted(prev => new Set(prev).add(proposalId));
  };

  const getTimeRemaining = (endTime: number) => {
    const diff = endTime - Date.now();
    if (diff <= 0) return "Ended";
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getProposalTypeColor = (type: string) => {
    switch (type) {
      case "WorldUpgrade": return "#8b5cf6";
      case "SkillCertification": return "#22c55e";
      case "Resource分配": return "#f59e0b";
      case "AgentElection": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "550px",
      maxHeight: "80vh",
      background: "rgba(15, 23, 42, 0.98)",
      borderRadius: "16px",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      boxShadow: "0 16px 64px rgba(0, 0, 0, 0.5)",
      zIndex: 400,
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
          🗳️ Agent Governance
        </h2>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
          <X size={20} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "16px" }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#8b5cf6" }}>3</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Registered Agents</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#22c55e" }}>{proposals.filter(p => !p.executed).length}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Active Proposals</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>500</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Quorum Required</div>
        </div>
      </div>

      {/* Proposals */}
      <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
        {proposals.map(proposal => (
          <div key={proposal.id} style={{
            padding: "16px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.05)",
            marginBottom: "12px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <h3 style={{ margin: 0, color: "white", fontSize: "16px" }}>{proposal.title}</h3>
                <span style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: getProposalTypeColor(proposal.proposalType),
                  color: "white",
                }}>
                  {proposal.proposalType}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                <Clock size={12} />
                {getTimeRemaining(proposal.endTime)}
              </div>
            </div>
            
            <p style={{ margin: "0 0 12px 0", color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
              {proposal.description}
            </p>
            
            {/* Vote bars */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(255,255,255,0.1)" }}>
                <div style={{ width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst || 1)) * 100}%`, background: "#22c55e" }} />
                <div style={{ width: `${(proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst || 1)) * 100}%`, background: "#ef4444" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px" }}>
                <span style={{ color: "#22c55e" }}>✓ {proposal.votesFor} votes</span>
                <span style={{ color: "#ef4444" }}>{proposal.votesAgainst} against</span>
              </div>
            </div>

            {/* Vote buttons */}
            {!voted.has(proposal.id) && !proposal.executed && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleVote(proposal.id, true)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "rgba(34, 197, 94, 0.2)",
                    border: "1px solid #22c55e",
                    borderRadius: "6px",
                    color: "#22c55e",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <ThumbsUp size={14} /> Vote For
                </button>
                <button
                  onClick={() => handleVote(proposal.id, false)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid #ef4444",
                    borderRadius: "6px",
                    color: "#ef4444",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <ThumbsDown size={14} /> Vote Against
                </button>
              </div>
            )}
            
            {voted.has(proposal.id) && (
              <div style={{ textAlign: "center", color: "#8b5cf6", fontSize: "12px" }}>
                ✓ You voted!
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        Proposals require 1000+ reputation to create • 500 votes to pass • Agents vote with reputation weight
      </div>
    </div>
  );
}
