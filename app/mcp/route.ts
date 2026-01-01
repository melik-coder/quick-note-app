import { getBaseUrl } from "@/lib/base-url";
import {
  saveNote,
  getAllNotes,
  deleteNote,
  searchNotes,
  getRecentNotes,
} from "@/lib/notes-store";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id",
};

// GET - Health check & server info
export async function GET() {
  return new Response(
    JSON.stringify({
      name: "quick-note",
      version: "1.0.0",
      status: "running",
      tools: ["save_note", "list_notes", "get_recent_notes", "delete_note"],
      endpoints: {
        mcp: "/mcp",
        widgets: {
          notesList: "/widget/notes-list",
          noteSaved: "/widget/note-saved",
        },
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// POST - Handle MCP JSON-RPC requests
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // JSON-RPC request handling
    const { method, params, id } = body;

    let result;

    switch (method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "quick-note",
            version: "1.0.0",
          },
        };
        break;

      case "tools/list":
        result = {
          tools: [
            {
              name: "save_note",
              description: "Save a new note or code snippet with optional tags",
              inputSchema: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description: "The note content or code snippet to save",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Tags to categorize the note",
                  },
                },
                required: ["content"],
              },
            },
            {
              name: "list_notes",
              description: "List all saved notes, optionally filtered by search query",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search query to filter notes",
                  },
                  limit: {
                    type: "number",
                    description: "Maximum number of notes to return",
                  },
                },
              },
            },
            {
              name: "get_recent_notes",
              description: "Get the most recently saved notes",
              inputSchema: {
                type: "object",
                properties: {
                  count: {
                    type: "number",
                    description: "Number of recent notes to retrieve",
                  },
                },
              },
            },
            {
              name: "delete_note",
              description: "Delete a note by its ID",
              inputSchema: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "The ID of the note to delete",
                  },
                },
                required: ["id"],
              },
            },
          ],
        };
        break;

      case "tools/call":
        const { name, arguments: args } = params;
        const baseUrl = getBaseUrl();

        switch (name) {
          case "save_note":
            const savedNote = await saveNote(args.content, args.tags || []);
            result = {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    message: "Note saved successfully",
                    note: savedNote,
                    success: true,
                  }),
                },
              ],
            };
            break;

          case "list_notes":
            let notes = args.query
              ? await searchNotes(args.query)
              : await getAllNotes();
            notes = notes.slice(0, args.limit || 10);
            result = {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    message: `Found ${notes.length} note(s)`,
                    notes,
                    count: notes.length,
                  }),
                },
              ],
            };
            break;

          case "get_recent_notes":
            const recentNotes = await getRecentNotes(args.count || 5);
            result = {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    message: `Retrieved ${recentNotes.length} recent note(s)`,
                    notes: recentNotes,
                    count: recentNotes.length,
                  }),
                },
              ],
            };
            break;

          case "delete_note":
            const deleted = await deleteNote(args.id);
            result = {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    message: deleted ? "Note deleted successfully" : "Note not found",
                    deleted,
                    noteId: args.id,
                  }),
                },
              ],
            };
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        break;

      default:
        result = { error: `Unknown method: ${method}` };
    }

    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("MCP Error:", error);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
