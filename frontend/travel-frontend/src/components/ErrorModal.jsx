// ErrorModal.jsx
import React from "react";
import "../styles/ConfirmModal.css";

export default function ErrorModal({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button
          className="modal-close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "15px",
            background: "transparent",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#ef4444"
          }}
        >
          ×
        </button>
        <h3 style={{ color: "#ef4444" }}>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}