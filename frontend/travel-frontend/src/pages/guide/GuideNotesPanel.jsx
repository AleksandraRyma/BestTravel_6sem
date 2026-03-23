import { useState, useRef, useEffect } from "react";
import { useGuideNotes } from "../../hooks/useGuideNotes";
import "../../styles/tour_guide/GuideNotesPanel.css";

/**
 * Панель заметок гида — плавающая кнопка + выдвижная панель.
 * Подключается на любой странице гида:
 *
 *   import GuideNotesPanel from "../../components/guide/GuideNotesPanel";
 *   ...
 *   return (
 *     <div className="page">
 *       ...контент...
 *       <GuideNotesPanel />
 *     </div>
 *   );
 */
export default function GuideNotesPanel() {
  const { notes, addNote, toggleNote, deleteNote, clearDone } = useGuideNotes();
  const [open,     setOpen]     = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);

  // Авто-фокус при открытии
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const handleAdd = () => {
    if (!inputVal.trim()) return;
    addNote(inputVal);
    setInputVal("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setOpen(false);
  };

  const doneCount = notes.filter(n => n.done).length;

  return (
    <>
      {/* ── Floating trigger button ──────────────────────────── */}
      <button
        className={`gnp-trigger ${open ? "gnp-trigger--open" : ""}`}
        onClick={() => setOpen(v => !v)}
        title="Мои заметки"
      >
        <span className="gnp-trigger__icon">📝</span>
        {notes.length > 0 && (
          <span className="gnp-trigger__badge">
            {notes.length - doneCount > 0 ? notes.length - doneCount : "✓"}
          </span>
        )}
      </button>

      {/* ── Panel overlay ────────────────────────────────────── */}
      {open && (
        <div className="gnp-overlay" onClick={() => setOpen(false)} />
      )}

      {/* ── Panel ────────────────────────────────────────────── */}
      <div className={`gnp-panel ${open ? "gnp-panel--open" : ""}`}>
        <div className="gnp-panel__header">
          <div className="gnp-panel__title">
            <span>📝</span>
            <span>Мои заметки</span>
          </div>
          <div className="gnp-panel__meta">
            {notes.length > 0 && (
              <span className="gnp-panel__count">
                {doneCount}/{notes.length}
              </span>
            )}
            {doneCount > 0 && (
              <button className="gnp-clear-btn" onClick={clearDone} title="Удалить выполненные">
                Очистить
              </button>
            )}
            <button className="gnp-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>

        {/* Input */}
        <div className="gnp-input-row">
          <input
            ref={inputRef}
            className="gnp-input"
            placeholder="Новая задача..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKey}
            maxLength={200}
          />
          <button
            className="gnp-add-btn"
            onClick={handleAdd}
            disabled={!inputVal.trim()}
          >
            +
          </button>
        </div>

        {/* Notes list */}
        <div className="gnp-list">
          {notes.length === 0 ? (
            <div className="gnp-empty">
              <span>🗒️</span>
              <p>Нет заметок</p>
              <p className="gnp-empty__sub">Напишите задачу выше и нажмите Enter</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`gnp-note ${note.done ? "gnp-note--done" : ""}`}
              >
                {/* Checkbox-circle */}
                <button
                  className={`gnp-note__circle ${note.done ? "gnp-note__circle--checked" : ""}`}
                  onClick={() => toggleNote(note.id)}
                  title={note.done ? "Отметить как невыполненное" : "Отметить как выполненное"}
                >
                  {note.done && (
                    <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {/* Text */}
                <span className="gnp-note__text">{note.text}</span>

                {/* Delete */}
                <button
                  className="gnp-note__delete"
                  onClick={() => deleteNote(note.id)}
                  title="Удалить"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="gnp-panel__footer">
          <span>Заметки хранятся в текущей сессии</span>
        </div>
      </div>
    </>
  );
}