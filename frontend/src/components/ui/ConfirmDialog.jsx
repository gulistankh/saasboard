import { useEffect } from "react";

// Usage:
// <ConfirmDialog
//   open={showConfirm}
//   title="Remove profile picture?"
//   message="Your initials will be shown instead."
//   confirmLabel="Remove"
//   busy={false}
//   onConfirm={...}
//   onCancel={...}
// />
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  // Close with the Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      style={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div role="alertdialog" aria-modal="true" aria-label={title} style={styles.modal}>
        <h3 style={styles.title}>{title}</h3>
        {message && <p style={styles.message}>{message}</p>}

        <div style={styles.actions}>
          <button type="button" onClick={onCancel} disabled={busy} style={styles.cancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            style={{
              ...styles.confirm,
              background: danger ? "#dc2626" : "#4f46e5",
              ...(busy ? styles.disabled : {}),
            }}
          >
            {busy ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 110,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
  },
  title: { margin: "0 0 8px", fontSize: 18, color: "var(--text)" },
  message: {
    margin: "0 0 20px",
    fontSize: 14,
    lineHeight: 1.5,
    color: "var(--text-muted)",
  },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10 },
  cancel: {
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-2)",
    background: "var(--surface)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    cursor: "pointer",
  },
  confirm: {
    padding: "9px 18px",
    fontSize: 14,
    fontWeight: 600,
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  disabled: { opacity: 0.6, cursor: "not-allowed" },
};
