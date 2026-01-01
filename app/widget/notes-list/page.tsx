"use client";

import { useEffect, useState } from "react";

interface Note {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ToolOutput {
  notes: Note[];
  count: number;
  query?: string | null;
}

// window.openai tipi
declare global {
  interface Window {
    openai?: {
      toolOutput?: ToolOutput;
      callTool?: (toolName: string, params: Record<string, unknown>) => void;
    };
  }
}

export default function NotesListWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // ChatGPT'den gelen veriyi oku
    const loadData = () => {
      if (window.openai?.toolOutput) {
        const output = window.openai.toolOutput;
        setNotes(output.notes || []);
        setQuery(output.query || null);
        setIsLoaded(true);
      }
    };

    // İlk yükleme
    loadData();

    // openai:set_globals event'ini dinle
    const handleSetGlobals = () => loadData();
    window.addEventListener("openai:set_globals", handleSetGlobals);

    return () => {
      window.removeEventListener("openai:set_globals", handleSetGlobals);
    };
  }, []);

  const handleDelete = (id: string) => {
    if (window.openai?.callTool) {
      window.openai.callTool("delete_note", { id });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatContent = (content: string) => {
    // Kod bloğu kontrolü
    if (content.includes("```") || content.match(/^(const|let|var|function|import|export|class)/)) {
      return <code>{content}</code>;
    }
    return content;
  };

  if (!isLoaded) {
    return (
      <div className="widget-container">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="widget-container">
      {query && (
        <div style={{ marginBottom: "12px", fontSize: "13px", color: "#666" }}>
          Search: <strong>&quot;{query}&quot;</strong>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="empty-state">
          <p>No notes found</p>
          <p style={{ marginTop: "8px", fontSize: "13px" }}>
            Try saving a note: &quot;Save this: your note here&quot;
          </p>
        </div>
      ) : (
        <div>
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              <div className="note-content">{formatContent(note.content)}</div>

              <div className="note-meta">
                <div>
                  {note.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                  {note.tags.length === 0 && (
                    <span style={{ color: "#adb5bd", fontSize: "11px" }}>
                      No tags
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{formatDate(note.createdAt)}</span>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(note.id)}
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "12px", textAlign: "center", fontSize: "12px", color: "#868e96" }}>
        {notes.length} note{notes.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
