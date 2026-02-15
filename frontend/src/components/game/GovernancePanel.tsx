import { useState } from "react";
import { Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { theme } from "../../lib/theme";

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
    if (diff <= 0) return "ENDED";
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h LEFT`;
  };

  const getProposalTypeColor = (type: string) => {
    switch (type) {
      case "WorldUpgrade": return theme.colors.accent.magic;
      case "SkillCertification": return theme.colors.accent.tertiary;
      case "Resource分配": return theme.colors.accent.warning;
      case "AgentElection": return theme.colors.accent.mana;
      default: return theme.colors.text.muted;
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
          GOVERNANCE
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

      {/* Stats */}
      <div style={{ 
        padding: theme.spacing.md, 
        borderBottom: `2px solid ${theme.colors.border.default}`, 
        display: "flex", 
        gap: theme.spacing.lg,
        background: theme.colors.background.tertiary,
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: theme.colors.accent.magic }}>3</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>REGISTERED</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: theme.colors.accent.tertiary }}>{proposals.filter(p => !p.executed).length}</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>ACTIVE</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: theme.colors.accent.primary }}>500</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted }}>QUORUM</div>
        </div>
      </div>

      {/* Proposals */}
      <div style={{ padding: theme.spacing.md, overflowY: "auto", flex: 1, maxHeight: "55vh" }}>
        {proposals.map(proposal => (
          <div key={proposal.id} style={{
            padding: theme.spacing.md,
            background: theme.colors.background.primary,
            border: `1px solid ${theme.colors.border.subtle}`,
            marginBottom: theme.spacing.md,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.sm }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                  <span style={{ color: theme.colors.text.primary, fontWeight: 700, fontSize: theme.fontSize.xs }}>{proposal.title}</span>
                </div>
                <span style={{
                  fontSize: "10px",
                  padding: `2px ${theme.spacing.xs}`,
                  background: getProposalTypeColor(proposal.proposalType),
                  color: theme.colors.text.inverse,
                  fontWeight: 700,
                }}>
                  {proposal.proposalType}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: theme.colors.text.muted, fontSize: theme.fontSize.xs }}>
                <Clock size={12} />
                {getTimeRemaining(proposal.endTime)}
              </div>
            </div>
            
            <p style={{ margin: `0 0 ${theme.spacing.sm} 0`, color: theme.colors.text.tertiary, fontSize: theme.fontSize.xs }}>
              {proposal.description}
            </p>
            
            {/* Vote bars */}
            <div style={{ marginBottom: theme.spacing.sm }}>
              <div style={{ display: "flex", height: "6px", borderRadius: "2px", overflow: "hidden", background: theme.colors.background.tertiary }}>
                <div style={{ width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst || 1)) * 100}%`, background: theme.colors.accent.tertiary }} />
                <div style={{ width: `${(proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst || 1)) * 100}%`, background: theme.colors.accent.health }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: theme.fontSize.xs }}>
                <span style={{ color: theme.colors.accent.tertiary }}>✓ {proposal.votesFor}</span>
                <span style={{ color: theme.colors.accent.health }}>{proposal.votesAgainst} ✗</span>
              </div>
            </div>

            {/* Vote buttons */}
            {!voted.has(proposal.id) && !proposal.executed && (
              <div style={{ display: "flex", gap: theme.spacing.sm }}>
                <button
                  onClick={() => handleVote(proposal.id, true)}
                  style={{
                    flex: 1,
                    padding: theme.spacing.sm,
                    background: "transparent",
                    border: `1px solid ${theme.colors.accent.tertiary}`,
                    color: theme.colors.accent.tertiary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: theme.spacing.xs,
                    fontSize: theme.fontSize.xs,
                    fontWeight: 700,
                    fontFamily: theme.fonts.mono,
                  }}
                >
                  <ThumbsUp size={12} /> VOTE_FOR
                </button>
                <button
                  onClick={() => handleVote(proposal.id, false)}
                  style={{
                    flex: 1,
                    padding: theme.spacing.sm,
                    background: "transparent",
                    border: `1px solid ${theme.colors.accent.health}`,
                    color: theme.colors.accent.health,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: theme.spacing.xs,
                    fontSize: theme.fontSize.xs,
                    fontWeight: 700,
                    fontFamily: theme.fonts.mono,
                  }}
                >
                  <ThumbsDown size={12} /> VOTE_AGAINST
                </button>
              </div>
            )}
            
            {voted.has(proposal.id) && (
              <div style={{ textAlign: "center", color: theme.colors.accent.primary, fontSize: theme.fontSize.xs, fontWeight: 700 }}>
                ✓ VOTE RECORDED
              </div>
            )}
          </div>
        ))}
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
        1000+ REP TO CREATE • 500 VOTES TO PASS • REPUTATION WEIGHTED
      </div>
    </div>
  );
}
