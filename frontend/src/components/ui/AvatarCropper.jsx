import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Minus, Plus } from "lucide-react";

const OUTPUT_SIZE = 512;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });

// Draw the selected area into a 512x512 canvas and return it as a small JPEG
const cropToBlob = async (src, area) => {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not crop"))),
      "image/jpeg",
      0.9
    )
  );
};

// Usage: <AvatarCropper file={file} saving={false}
//          onCancel={...} onSave={(blob) => ...} onInvalid={...} />
export default function AvatarCropper({
  file,
  saving = false,
  onCancel,
  onSave,
  onInvalid,
}) {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [error, setError] = useState("");

  // Create a temporary URL for the chosen file and check it opens as an image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    let active = true;

    loadImage(url)
      .then(() => active && setSrc(url))
      .catch(() => active && onInvalid?.());

    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Close with the Escape key
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" && !saving) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, saving]);

  const onCropComplete = useCallback((_, pixels) => setArea(pixels), []);

  const handleSave = async () => {
    if (!area || !src) return;
    setError("");
    try {
      const blob = await cropToBlob(src, area);
      onSave(blob);
    } catch {
      setError("Could not process this image. Please try another one.");
    }
  };

  const changeZoom = (value) => setZoom(Math.min(5, Math.max(1, value)));

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Edit profile picture">
      <div style={styles.modal}>
        <h3 style={styles.title}>Edit profile picture</h3>
        <p style={styles.hint}>Drag to move. Scroll or use the slider to zoom.</p>

        <div style={styles.cropArea}>
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              minZoom={1}
              maxZoom={5}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : (
            <div style={styles.loading}>Loading image...</div>
          )}
        </div>

        <div style={styles.zoomRow}>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => changeZoom(zoom - 0.2)}
            style={styles.iconButton}
          >
            <Minus size={16} />
          </button>
          <input
            type="range"
            aria-label="Zoom"
            min={1}
            max={5}
            step={0.01}
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            style={styles.slider}
          />
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => changeZoom(zoom + 0.2)}
            style={styles.iconButton}
          >
            <Plus size={16} />
          </button>
        </div>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.actions}>
          <button type="button" onClick={onCancel} disabled={saving} style={styles.cancel}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !src || !area}
            style={{
              ...styles.save,
              ...(saving || !src || !area ? styles.disabled : {}),
            }}
          >
            {saving ? "Saving..." : "Save"}
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
    zIndex: 100,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
  },
  title: { margin: 0, fontSize: 18, color: "var(--text)" },
  hint: { margin: "4px 0 14px", fontSize: 13, color: "var(--text-muted)" },
  cropArea: {
    position: "relative",
    width: "100%",
    height: 320,
    background: "#111111",
    borderRadius: 8,
    overflow: "hidden",
  },
  loading: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: 14,
  },
  zoomRow: { display: "flex", alignItems: "center", gap: 10, margin: "16px 0" },
  slider: { flex: 1, accentColor: "#4f46e5" },
  iconButton: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-2)",
    background: "var(--surface)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    cursor: "pointer",
  },
  error: {
    background: "var(--error-bg)",
    border: "1px solid var(--error-border)",
    color: "var(--error-text)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
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
  save: {
    padding: "9px 18px",
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