import { useState, useCallback } from "react";

// ─── Хранилище заметок гида в sessionStorage ──────────────────────
// sessionStorage: очищается при закрытии вкладки, но живёт между
// навигациями внутри приложения — идеально для "заметок на сессию"
const STORAGE_KEY = "guide_notes";

function loadNotes() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

export function useGuideNotes() {
  const [notes, setNotes] = useState(loadNotes);

  const addNote = useCallback((text) => {
    if (!text.trim()) return;
    const updated = [
      ...loadNotes(),
      { id: Date.now(), text: text.trim(), done: false, createdAt: new Date().toISOString() }
    ];
    saveNotes(updated);
    setNotes(updated);
  }, []);

  const toggleNote = useCallback((id) => {
    const updated = loadNotes().map(n => n.id === id ? { ...n, done: !n.done } : n);
    saveNotes(updated);
    setNotes(updated);
  }, []);

  const deleteNote = useCallback((id) => {
    const updated = loadNotes().filter(n => n.id !== id);
    saveNotes(updated);
    setNotes(updated);
  }, []);

  const clearDone = useCallback(() => {
    const updated = loadNotes().filter(n => !n.done);
    saveNotes(updated);
    setNotes(updated);
  }, []);

  return { notes, addNote, toggleNote, deleteNote, clearDone };
}