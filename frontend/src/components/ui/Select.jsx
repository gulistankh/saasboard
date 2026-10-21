import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Usage:
// <Select ariaLabel="Role" value={role} onChange={setRole}
//   options={[{ value: "member", label: "Member" }, ...]} width={130} />
export default function Select({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
  width = 140,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [active, setActive] = useState(0);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((option) => option.value === value);

  const openMenu = () => {
    if (disabled || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = options.length * 38 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 8 && rect.top > spaceBelow;

    // Fixed positioning, so a table's scroll area can't clip the list
    setPos({
      left: rect.left,
      width: rect.width,
      top: openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
    });
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (option) => {
    setOpen(false);
    if (option.value !== value) onChange(option.value);
    buttonRef.current?.focus();
  };

  // Close when clicking outside, scrolling, or resizing
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handleDown = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((prev) => (prev + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) => (prev - 1 + options.length) % options.length);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        style={{
          ...styles.button,
          width,
          ...(open ? styles.buttonOpen : {}),
          ...(disabled ? styles.disabled : {}),
        }}
      >
        <span>{selected?.label ?? ""}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{
            ...styles.chevron,
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {open && pos && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{ ...styles.menu, ...pos }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                style={{
                  ...styles.option,
                  ...(index === active ? styles.optionActive : {}),
                  ...(isSelected ? styles.optionSelected : {}),
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={16} aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

const styles = {
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "9px 12px",
    fontSize: 14,
    color: "var(--text-2)",
    background: "var(--surface)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
  },
  buttonOpen: { borderColor: "#4f46e5" },
  disabled: { opacity: 0.55, cursor: "not-allowed" },
  chevron: { color: "var(--text-muted)", transition: "transform 0.15s ease" },
  menu: {
    position: "fixed",
    zIndex: 120,
    padding: 4,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)",
  },
  option: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "8px 10px",
    fontSize: 14,
    color: "var(--text-2)",
    borderRadius: 6,
    cursor: "pointer",
  },
  optionActive: {
    background: "var(--primary-soft)",
    color: "var(--primary-text)",
  },
  optionSelected: { fontWeight: 600 },
};
