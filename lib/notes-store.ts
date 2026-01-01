import { kv } from "@vercel/kv";

export interface Note {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const NOTES_KEY = "quick-notes";

// Tüm notları getir
export async function getAllNotes(): Promise<Note[]> {
  try {
    const notes = await kv.get<Note[]>(NOTES_KEY);
    return notes || [];
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

// Yeni not kaydet
export async function saveNote(content: string, tags: string[]): Promise<Note> {
  const notes = await getAllNotes();

  const newNote: Note = {
    id: generateId(),
    content,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.unshift(newNote); // En yeni not başa eklensin
  await kv.set(NOTES_KEY, notes);

  return newNote;
}

// Not sil
export async function deleteNote(id: string): Promise<boolean> {
  const notes = await getAllNotes();
  const filteredNotes = notes.filter((note) => note.id !== id);

  if (filteredNotes.length === notes.length) {
    return false; // Not bulunamadı
  }

  await kv.set(NOTES_KEY, filteredNotes);
  return true;
}

// Tag'e göre filtrele
export async function getNotesByTag(tag: string): Promise<Note[]> {
  const notes = await getAllNotes();
  return notes.filter((note) =>
    note.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
  );
}

// Not ara (içerikte)
export async function searchNotes(query: string): Promise<Note[]> {
  const notes = await getAllNotes();
  const lowerQuery = query.toLowerCase();

  return notes.filter(
    (note) =>
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// Son N notu getir
export async function getRecentNotes(limit: number = 5): Promise<Note[]> {
  const notes = await getAllNotes();
  return notes.slice(0, limit);
}

// Benzersiz ID oluştur
function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
