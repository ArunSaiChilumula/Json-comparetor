import { useState } from "react";

const Accordion = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          background: "#222",
          padding: "10px",
          borderRadius: "6px",
        }}
      >
        {open ? "▼" : "▶"} {title}
      </div>

      {open && (
        <div style={{ padding: "10px", background: "#111" }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;