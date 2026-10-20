import { useEffect, useState } from "react";
import { getInitials } from "../../utils/helpers";

// Shows the picture, or the initials if there is no picture (or it fails to load)
export default function Avatar({ name, src, size = 36 }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
  };

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile picture` : "Profile picture"}
        onError={() => setFailed(true)}
        style={{ ...base, objectFit: "cover", display: "block" }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...base,
        background: "#4f46e5",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontWeight: 600,
      }}
    >
      {getInitials(name)}
    </span>
  );
}