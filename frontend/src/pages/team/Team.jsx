import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Select from "../../components/ui/Select";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import {
  getInvites,
  getMembers,
  removeMember,
  resendInvite,
  revokeInvite,
  sendInvite,
  updateMemberRole,
} from "../../services/teamService";
import {
  capitalize,
  formatDate,
  getInitials,
  isValidEmail,
} from "../../utils/helpers";

const ROLES = ["member", "admin"];

const ROLE_OPTIONS = ROLES.map((role) => ({
  value: role,
  label: capitalize(role),
}));

export default function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });
  const [inviting, setInviting] = useState(false);
  // id of the member/invite currently being changed (disables its buttons)
  const [busyId, setBusyId] = useState(null);
  // What the confirmation dialog is asking about: { type: "member" | "invite", item }
  const [confirmTarget, setConfirmTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [membersData, invitesData] = await Promise.all([
        getMembers(),
        isAdmin ? getInvites() : Promise.resolve([]),
      ]);
      setMembers(membersData);
      setInvites(invitesData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    resetMessages();

    const email = inviteForm.email.trim();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setInviting(true);
    try {
      const invite = await sendInvite({ email, role: inviteForm.role });
      setInvites((prev) => [invite, ...prev]);
      setInviteForm({ email: "", role: "member" });
      setSuccess(`Invitation sent to ${email}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member, role) => {
    if (role === member.role) return;
    resetMessages();
    setBusyId(member.id);
    try {
      const updated = await updateMemberRole(member.id, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, ...updated } : m))
      );
      setSuccess(
        `${member.name} is now ${role === "admin" ? "an Admin" : "a Member"}.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (member) => {
    resetMessages();
    setBusyId(member.id);
    try {
      await removeMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSuccess(`${member.name} was removed.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  };

  const handleResend = async (invite) => {
    resetMessages();
    setBusyId(invite.id);
    try {
      await resendInvite(invite.id);
      setSuccess(`Invitation resent to ${invite.email}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (invite) => {
    resetMessages();
    setBusyId(invite.id);
    try {
      await revokeInvite(invite.id);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      setSuccess("Invitation cancelled.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Team</h2>
        <p style={styles.subheading}>
          {isAdmin
            ? "Invite people and manage who can access your workspace."
            : "The people in your workspace."}
        </p>
      </div>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}
      {success && <div style={styles.success}>{success}</div>}

      {/* Invite form (admins only) */}
      {isAdmin && (
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Invite a teammate</h3>
          <form onSubmit={handleInvite} noValidate style={styles.inviteForm}>
            <input
              type="email"
              aria-label="Email to invite"
              placeholder="teammate@company.com"
              value={inviteForm.email}
              onChange={(event) =>
                setInviteForm((prev) => ({ ...prev, email: event.target.value }))
              }
              style={{ ...styles.input, flex: "1 1 240px" }}
            />
            <Select
              ariaLabel="Role for the invited user"
              value={inviteForm.role}
              onChange={(role) => setInviteForm((prev) => ({ ...prev, role }))}
              options={ROLE_OPTIONS}
              width={130}
            />
            <button
              type="submit"
              disabled={inviting}
              style={{
                ...styles.primaryButton,
                ...(inviting ? styles.disabled : {}),
              }}
            >
              {inviting ? "Sending..." : "Send invite"}
            </button>
          </form>
        </div>
      )}

      {/* Members */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Members ({members.length})</h3>
        {loading ? (
          <p style={styles.muted}>Loading...</p>
        ) : members.length === 0 ? (
          <p style={styles.muted}>No members yet.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Member</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th} />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isSelf = member.id === user?.id;
                  const busy = busyId === member.id;
                  return (
                    <tr key={member.id}>
                      <td style={styles.td}>
                        <div style={styles.person}>
                          <span style={styles.avatar}>
                            {getInitials(member.name)}
                          </span>
                          <div>
                            <div style={styles.personName}>
                              {member.name}
                              {isSelf && <span style={styles.you}> (you)</span>}
                            </div>
                            <div style={styles.personEmail}>{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {isAdmin ? (
                          <Select
                            ariaLabel={`Role for ${member.name}`}
                            value={member.role}
                            disabled={isSelf || busy}
                            onChange={(role) => handleRoleChange(member, role)}
                            options={ROLE_OPTIONS}
                            width={130}
                          />
                        ) : (
                          capitalize(member.role)
                        )}
                      </td>
                      <td style={styles.td}>{formatDate(member.joinedAt)}</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {isAdmin && !isSelf && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setConfirmTarget({ type: "member", item: member })
                            }
                            style={styles.dangerButton}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending invites (admins only) */}
      {isAdmin && (
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Pending invites ({invites.length})</h3>
          {loading ? (
            <p style={styles.muted}>Loading...</p>
          ) : invites.length === 0 ? (
            <p style={styles.muted}>No pending invites.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Sent</th>
                    <th style={styles.th} />
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => {
                    const busy = busyId === invite.id;
                    return (
                      <tr key={invite.id}>
                        <td style={styles.td}>{invite.email}</td>
                        <td style={styles.td}>{capitalize(invite.role)}</td>
                        <td style={styles.td}>{formatDate(invite.createdAt)}</td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleResend(invite)}
                            style={styles.linkButton}
                          >
                            Resend
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setConfirmTarget({ type: "invite", item: invite })
                            }
                            style={styles.dangerButton}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={
          confirmTarget?.type === "member"
            ? "Remove member?"
            : "Cancel invitation?"
        }
        message={
          confirmTarget?.type === "member"
            ? `${confirmTarget.item.name} will lose access to the workspace and their account will be permanently deleted.`
            : confirmTarget
            ? `The invitation for ${confirmTarget.item.email} will stop working.`
            : ""
        }
        confirmLabel={
          confirmTarget?.type === "member" ? "Remove member" : "Cancel invitation"
        }
        cancelLabel={
          confirmTarget?.type === "member" ? "Cancel" : "Keep invitation"
        }
        busy={busyId !== null}
        onConfirm={() =>
          confirmTarget.type === "member"
            ? handleRemove(confirmTarget.item)
            : handleRevoke(confirmTarget.item)
        }
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

const styles = {
  header: { marginBottom: 24 },
  heading: { margin: 0, fontSize: 24, color: "var(--text)" },
  subheading: { margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" },
  error: {
    background: "var(--error-bg)",
    border: "1px solid var(--error-border)",
    color: "var(--error-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  success: {
    background: "var(--success-bg)",
    border: "1px solid var(--success-border)",
    color: "var(--success-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  panelTitle: { margin: "0 0 16px", fontSize: 16, color: "var(--text)" },
  muted: { margin: 0, fontSize: 14, color: "var(--text-muted)" },
  inviteForm: { display: "flex", flexWrap: "wrap", gap: 12 },
  input: {
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    outline: "none",
    boxSizing: "border-box",
  },
  primaryButton: {
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: "#ffffff",
    background: "#4f46e5",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  disabled: { opacity: 0.6, cursor: "not-allowed" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    padding: "8px 8px",
    borderBottom: "1px solid var(--border)",
  },
  td: {
    fontSize: 14,
    color: "var(--text-2)",
    padding: "12px 8px",
    borderBottom: "1px solid var(--surface-2)",
    verticalAlign: "middle",
  },
  person: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  },
  personName: { fontWeight: 600, color: "var(--text)" },
  personEmail: { fontSize: 12, color: "var(--text-muted)" },
  you: { fontWeight: 400, color: "var(--text-muted)" },
  linkButton: {
    background: "none",
    border: "none",
    color: "var(--primary-text)",
    fontSize: 14,
    cursor: "pointer",
    marginRight: 12,
  },
  dangerButton: {
    background: "none",
    border: "none",
    color: "var(--danger)",
    fontSize: 14,
    cursor: "pointer",
  },
};