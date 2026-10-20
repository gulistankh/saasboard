import api from "./api";

// Get all members of the current workspace
export const getMembers = async () => {
  const { data } = await api.get("/team/members");
  return data.members;
};

// Change a member's role (admin only). role: "admin" | "member"
export const updateMemberRole = async (memberId, role) => {
  const { data } = await api.patch(`/team/members/${memberId}/role`, { role });
  return data.member;
};

// Remove a member from the workspace (admin only)
export const removeMember = async (memberId) => {
  const { data } = await api.delete(`/team/members/${memberId}`);
  return data;
};

// Get all pending invites (admin only)
export const getInvites = async () => {
  const { data } = await api.get("/team/invites");
  return data.invites;
};

// Send an invite by email (admin only). role: "admin" | "member"
export const sendInvite = async ({ email, role = "member" }) => {
  const { data } = await api.post("/team/invites", { email, role });
  return data.invite;
};

// Cancel a pending invite (admin only)
export const revokeInvite = async (inviteId) => {
  const { data } = await api.delete(`/team/invites/${inviteId}`);
  return data;
};

// Resend the invite email (admin only)
export const resendInvite = async (inviteId) => {
  const { data } = await api.post(`/team/invites/${inviteId}/resend`);
  return data;
};

// Look up an invite from the link token, so the AcceptInvite page
// can show "You've been invited to join X" before the user acts.
export const getInviteDetails = async (token) => {
  const { data } = await api.get(`/team/invites/details/${token}`);
  return data.invite;
};

// Accept an invite. The user must be logged in; the backend adds them
// to the workspace with the role that was set in the invite.
export const acceptInvite = async (token) => {
  const { data } = await api.post("/team/invites/accept", { token });
  return data;
};
