import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getBaseUrl } from "@/lib/base-url";
import {
  saveNote,
  getAllNotes,
  deleteNote,
  searchNotes,
  getRecentNotes,
} from "@/lib/notes-store";

// MCP Server oluştur
function createMcpServer() {
  const server = new McpServer({
    name: "quick-note",
    version: "1.0.0",
  });

  const baseUrl = getBaseUrl();

  // ===== RESOURCES (Widget HTML) =====

  // Not listesi widget'ı
  server.resource("notes-list-widget", `${baseUrl}/widget/notes-list`, {
    mimeType: "text/html+skybridge",
    description: "Widget showing list of saved notes",
  });

  // Not kaydetme onay widget'ı
  server.resource("note-saved-widget", `${baseUrl}/widget/note-saved`, {
    mimeType: "text/html+skybridge",
    description: "Widget confirming note was saved",
  });

  // ===== TOOLS =====

  // 1. Not Kaydet
  server.tool(
    "save_note",
    "Save a new note or code snippet with optional tags",
    {
      content: z.string().describe("The note content or code snippet to save"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Tags to categorize the note (e.g., javascript, todo, idea)"),
    },
    async ({ content, tags = [] }) => {
      const note = await saveNote(content, tags);

      return {
        content: [
          {
            type: "text",
            text: `Note saved successfully with ID: ${note.id}`,
          },
        ],
        structuredContent: {
          note,
          success: true,
        },
        _meta: {
          "openai/outputTemplate": `${baseUrl}/widget/note-saved`,
          "openai/toolInvocation/invoking": "Saving note...",
          "openai/toolInvocation/invoked": "Note saved",
        },
      };
    }
  );

  // 2. Tüm Notları Listele
  server.tool(
    "list_notes",
    "List all saved notes, optionally filtered by search query",
    {
      query: z
        .string()
        .optional()
        .describe("Search query to filter notes by content or tags"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of notes to return (default: 10)"),
    },
    async ({ query, limit = 10 }) => {
      let notes;

      if (query) {
        notes = await searchNotes(query);
      } else {
        notes = await getAllNotes();
      }

      notes = notes.slice(0, limit);

      return {
        content: [
          {
            type: "text",
            text:
              notes.length > 0
                ? `Found ${notes.length} note(s)`
                : "No notes found",
          },
        ],
        structuredContent: {
          notes,
          count: notes.length,
          query: query || null,
        },
        _meta: {
          "openai/outputTemplate": `${baseUrl}/widget/notes-list`,
          "openai/toolInvocation/invoking": "Loading notes...",
          "openai/toolInvocation/invoked": `${notes.length} notes loaded`,
        },
      };
    }
  );

  // 3. Son Notları Getir
  server.tool(
    "get_recent_notes",
    "Get the most recently saved notes",
    {
      count: z
        .number()
        .optional()
        .describe("Number of recent notes to retrieve (default: 5)"),
    },
    async ({ count = 5 }) => {
      const notes = await getRecentNotes(count);

      return {
        content: [
          {
            type: "text",
            text:
              notes.length > 0
                ? `Retrieved ${notes.length} recent note(s)`
                : "No notes saved yet",
          },
        ],
        structuredContent: {
          notes,
          count: notes.length,
        },
        _meta: {
          "openai/outputTemplate": `${baseUrl}/widget/notes-list`,
          "openai/toolInvocation/invoking": "Loading recent notes...",
          "openai/toolInvocation/invoked": `${notes.length} notes loaded`,
        },
      };
    }
  );

  // 4. Not Sil
  server.tool(
    "delete_note",
    "Delete a note by its ID",
    {
      id: z.string().describe("The ID of the note to delete"),
    },
    async ({ id }) => {
      const success = await deleteNote(id);

      return {
        content: [
          {
            type: "text",
            text: success
              ? `Note ${id} deleted successfully`
              : `Note ${id} not found`,
          },
        ],
        structuredContent: {
          deleted: success,
          noteId: id,
        },
      };
    }
  );

  return server;
}

// HTTP Handler
async function handleMcpRequest(request: Request): Promise<Response> {
  const server = createMcpServer();

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  return response;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// GET - Health check
export async function GET() {
  return new Response("Quick Note MCP Server is running", {
    status: 200,
    headers: corsHeaders,
  });
}

// POST - MCP requests
export async function POST(request: Request) {
  try {
    const response = await handleMcpRequest(request);

    // CORS headers ekle
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("MCP Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
