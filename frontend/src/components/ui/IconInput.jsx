import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

// Usage:
// <IconInput id="email" name="email" type="email" icon={Mail}
//   value={...} onChange={...} placeholder="you@company.com" />
//
// With type="password" it shows an eye button to reveal or hide the text.
export default function IconInput({
  icon: Icon,
  type = "text",
  readOnly = false,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div style={styles.wrapper}>
      {Icon && <Icon size={18} aria-hidden="true" style={styles.icon} />}

      <input
        {...props}
        type={inputType}
        readOnly={readOnly}
        style={{
          ...styles.input,
          paddingRight: isPassword ? 42 : 12,
          ...(readOnly ? styles.readOnly : {}),
        }}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
          style={styles.eye}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: "relative", marginBottom: 16 },
  icon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "10px 12px 10px 40px",
    fontSize: 14,
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    outline: "none",
    boxSizing: "border-box",
  },
  readOnly: { background: "var(--surface-2)", color: "var(--text-muted)" },
  eye: {
    position: "absolute",
    right: 6,
    top: "50%",
    transform: "translateY(-50%)",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    background: "none",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};
