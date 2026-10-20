import { Lock, Pencil, Trash2, Mail, User } from "lucide-react";
import IconInput from "../../components/ui/IconInput";
import { useRef, useState } from "react";
import Avatar from "../../components/ui/Avatar";
import AvatarCropper from "../../components/ui/AvatarCropper";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import useAuth from "../../hooks/useAuth";
import api, { getErrorMessage } from "../../services/api";
import { capitalize, getPasswordError } from "../../utils/helpers";

export default function Profile() {
  const { user, updateUser } = useAuth();
    // ---- Profile picture ----
  const fileInputRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");

    // Any image is accepted here, whatever its size. It gets cropped first.
  const handleFileChosen = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets you pick the same file again later
    if (!file) return;

    setAvatarError("");
    setAvatarSuccess("");

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    setCropFile(file);
  };

  // The cropped result is a small 512x512 image, so it always fits the limit
  const handleCropSave = async (blob) => {
    const formData = new FormData();
    formData.append("avatar", blob, "avatar.jpg");

    setAvatarBusy(true);
    try {
       const { data } = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser(data.user);
      setCropFile(null);
      setAvatarSuccess("Profile picture updated.");
    } catch (err) {
      setCropFile(null);
      setAvatarError(getErrorMessage(err));
    } finally {
      setAvatarBusy(false);
    }
  };
  
  const handleAvatarRemove = async () => {
  setAvatarError("");
  setAvatarSuccess("");
  setAvatarBusy(true);
  try {
    const { data } = await api.delete("/users/me/avatar");
    updateUser(data.user);
    setAvatarSuccess("Profile picture removed.");
  } catch (err) {
    setAvatarError(getErrorMessage(err));
  } finally {
    setAvatarBusy(false);
    setConfirmRemove(false);
  }
};
  

  // ---- Profile form ----
  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // ---- Password form ----
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setProfileError("Please enter your full name.");
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await api.patch("/users/me", { name: cleanName });
      updateUser(data.user);
      setName(data.user.name);
      setProfileSuccess("Profile updated.");
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (event) => {
    setPasswords((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwords.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    const ruleError = getPasswordError(passwords.newPassword);
    if (ruleError) {
      setPasswordError(ruleError);
      return;
    }
    if (passwords.newPassword === passwords.currentPassword) {
      setPasswordError("The new password must be different from the current one.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch("/users/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSuccess("Password changed successfully.");
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const nameUnchanged = name.trim() === (user?.name || "");

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Profile</h2>
        <p style={styles.subheading}>Manage your personal information.</p>
      </div>

      {/* Profile info */}
      <div style={styles.panel}>
          <div style={styles.identity}>
          <div style={styles.avatarWrap}>
            <Avatar name={user?.name} src={user?.avatarUrl} size={80} />
            <button
              type="button"
              title="Edit profile picture"
              aria-label="Edit profile picture"
              disabled={avatarBusy}
              onClick={() => fileInputRef.current?.click()}
              style={styles.penButton}
            >
              <Pencil size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChosen}
              style={{ display: "none" }}
            />
          </div>
          <div>
            <div style={styles.identityName}>{user?.name}</div>
            <div style={styles.identityMeta}>
              {capitalize(user?.role)} · {user?.email}
            </div>
            {user?.avatarUrl && (
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => setConfirmRemove(true)}
                style={styles.removeButton}
              >
                <Trash2 size={14} aria-hidden="true" />
                Remove photo
              </button>
            )}
          </div>
        </div>

        {avatarError && (
          <div role="alert" style={styles.error}>
            {avatarError}
          </div>
        )}
        {avatarSuccess && <div style={styles.success}>{avatarSuccess}</div>}

        {cropFile && (
          <AvatarCropper
            file={cropFile}
            saving={avatarBusy}
            onCancel={() => setCropFile(null)}
            onSave={handleCropSave}
            onInvalid={() => {
              setCropFile(null);
              setAvatarError(
                "This image can't be opened. Please try a JPG, PNG or WebP photo."
              );
            }}
          />
        )}
        
         <ConfirmDialog
          open={confirmRemove}
          title="Remove profile picture?"
          message="Your initials will be shown instead. You can upload a new picture at any time."
          confirmLabel="Remove"
          busy={avatarBusy}
          onConfirm={handleAvatarRemove}
          onCancel={() => setConfirmRemove(false)}
        />


        {profileError && (
          <div role="alert" style={styles.error}>
            {profileError}
          </div>
        )}
        {profileSuccess && <div style={styles.success}>{profileSuccess}</div>}

        <form onSubmit={handleProfileSubmit} noValidate>
          <label style={styles.label} htmlFor="name">
            Full name
          </label>
          <IconInput
            id="name"
            type="text"
            icon={User}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
          />
          <label style={styles.label} htmlFor="email">
            Email
          </label>
          <IconInput
            id="email"
            type="email"
            icon={Mail}
            value={user?.email || ""}
            readOnly
          />
          <p style={styles.hint}>Your email can't be changed here.</p>

          <button
            type="submit"
            disabled={savingProfile || nameUnchanged}
            style={{
              ...styles.primaryButton,
              ...(savingProfile || nameUnchanged ? styles.disabled : {}),
            }}
          >
            {savingProfile ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Change password</h3>

        {passwordError && (
          <div role="alert" style={styles.error}>
            {passwordError}
          </div>
        )}
        {passwordSuccess && <div style={styles.success}>{passwordSuccess}</div>}

        <form onSubmit={handlePasswordSubmit} noValidate>
          <label style={styles.label} htmlFor="currentPassword">
            Current password
          </label>
          <IconInput
            id="currentPassword"
            name="currentPassword"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
          />

          <label style={styles.label} htmlFor="newPassword">
            New password
          </label>
          <IconInput
            id="newPassword"
            name="newPassword"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={passwords.newPassword}
            onChange={handlePasswordChange}
          />
          <p style={styles.hint}>Use 8+ characters with a letter and a number.</p>

          <label style={styles.label} htmlFor="confirmPassword">
            Confirm new password
          </label>
          <IconInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
          />

          <button
            type="submit"
            disabled={savingPassword}
            style={{
              ...styles.primaryButton,
              ...(savingPassword ? styles.disabled : {}),
            }}
          >
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  header: { marginBottom: 24 },
  heading: { margin: 0, fontSize: 24, color: "var(--text)" },
  subheading: { margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    maxWidth: 640,
  },
  panelTitle: { margin: "0 0 16px", fontSize: 16, color: "var(--text)" },
  identity: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: "1px solid var(--surface-2)",
  },
  
    avatarWrap: { position: "relative", width: 80, height: 80, flexShrink: 0 },
  penButton: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    background: "#4f46e5",
    border: "2px solid var(--surface)",
    borderRadius: "50%",
    cursor: "pointer",
  },
  removeButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--danger)",
    background: "var(--surface)",
    border: "1px solid var(--error-border)",
    borderRadius: 8,
    cursor: "pointer",
  },

  identityName: { fontSize: 16, fontWeight: 600, color: "var(--text)" },
  identityMeta: { fontSize: 13, color: "var(--text-muted)", marginTop: 2 },
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
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-2)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    marginBottom: 16,
    outline: "none",
    boxSizing: "border-box",
  },
  inputDisabled: { background: "var(--bg)", color: "var(--text-muted)" },
  hint: { margin: "-10px 0 16px", fontSize: 12, color: "var(--text-muted)" },
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
  disabled: { opacity: 0.5, cursor: "not-allowed" },
};