"use client";

import { useEffect, useState } from "react";

interface Note {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface ToolOutput {
  note: Note;
  success: boolean;
}

declare global {
  interface Window {
    openai?: {
      toolOutput?: ToolOutput;
      callTool?: (toolName: string, params: Record<string, unknown>) => void;
    };
  }
}

export default function NoteSavedWidget() {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = () => {
      if (window.openai?.toolOutput) {
        const output = window.openai.toolOutput;
        if (output.success && output.note) {
          setNote(output.note);
        }
        setIsLoaded(true);
      }
    };

    loadData();

    const handleSetGlobals = () => loadData();
    window.addEventListener("openai:set_globals", handleSetGlobals);

    return () => {
      window.removeEventListener("openai:set_globals", handleSetGlobals);
    };
  }, []);

  const handleViewAll = () => {
    if (window.openai?.callTool) {
      window.openai.callTool("list_notes", {});
    }
  };

  if (!isLoaded) {
    return (
      <div className="widget-container">
        <div className="empty-state">Saving...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="widget-container">
        <div style={{ color: "#e03131", textAlign: "center" }}>
          Failed to save note
        </div>
      </div>
    );
  }

  return (
    <div className="widget-container">
      <div className="success-message">
        <div style={{ fontSize: "20px", marginBottom: "8px" }}>✓</div>
        <div style={{ fontWeight: 500 }}>Note saved successfully!</div>
      </div>

      <div className="note-card" style={{ marginTop: "12px" }}>
        <div
          className="note-content"
          style={{
            maxHeight: "100px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {note.content.length > 150
            ? note.content.substring(0, 150) + "..."
            : note.content}
        </div>

        <div className="note-meta" style={{ marginTop: "8px" }}>
          <div>
            {note.tags.length > 0 ? (
              note.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))
            ) : (
              <span style={{ color: "#adb5bd", fontSize: "11px" }}>
                No tags
              </span>
            )}
          </div>
          <span style={{ fontSize: "11px", color: "#868e96" }}>
            ID: {note.id.slice(-8)}
          </span>
        </div>
      </div>

      <div style={{ marginTop: "12px", textAlign: "center" }}>
        <button className="btn btn-secondary" onClick={handleViewAll}>
          View All Notes
        </button>
      </div>
    </div>
  );
}
