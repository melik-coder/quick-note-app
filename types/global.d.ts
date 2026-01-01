// ChatGPT window.openai API types
interface OpenAIToolOutput {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface OpenAIAPI {
  toolOutput?: OpenAIToolOutput;
  callTool?: (toolName: string, params: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    openai?: OpenAIAPI;
  }
}

export {};
