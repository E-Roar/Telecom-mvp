/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
/**
 * Context Compressor
 * 
 * Minifies message history before sending to the LLM to save tokens and latency.
 * Strategies:
 * 1. Keep only the last N messages
 * 2. Strip whitespace and newlines from JSON data
 * 3. Truncate large data arrays
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_HISTORY = 6;
const MAX_ARRAY_ITEMS = 10;

export function compressContext(messages: Message[]): Message[] {
  if (messages.length === 0) return [];

  // Separate system prompt from history
  const systemMessages = messages.filter(m => m.role === "system");
  const history = messages.filter(m => m.role !== "system");

  // Keep only the most recent messages
  const recentHistory = history.slice(-MAX_HISTORY);

  // Compress each message's content
  const compressedHistory = recentHistory.map(msg => ({
    ...msg,
    content: compressContent(msg.content)
  }));

  // We only need one system prompt (the last one if there are duplicates)
  const finalSystemMessage = systemMessages.length > 0 
    ? { ...systemMessages[systemMessages.length - 1], content: compressContent(systemMessages[systemMessages.length - 1].content) }
    : null;

  return finalSystemMessage 
    ? [finalSystemMessage, ...compressedHistory]
    : compressedHistory;
}

function compressContent(content: string): string {
  try {
    // If it's a JSON string, try to parse and minify it
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      const parsed = JSON.parse(content);
      
      // Truncate large arrays to save tokens
      if (Array.isArray(parsed) && parsed.length > MAX_ARRAY_ITEMS) {
        return JSON.stringify({
          _omitted: parsed.length - MAX_ARRAY_ITEMS,
          _total: parsed.length,
          data: parsed.slice(0, MAX_ARRAY_ITEMS)
        });
      }
      
      // If it's an object containing large arrays, truncate them
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const compressedObj: any = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (Array.isArray(value) && value.length > MAX_ARRAY_ITEMS) {
            compressedObj[key] = {
              _omitted: value.length - MAX_ARRAY_ITEMS,
              _total: value.length,
              data: value.slice(0, MAX_ARRAY_ITEMS)
            };
          } else {
            compressedObj[key] = value;
          }
        }
        return JSON.stringify(compressedObj); // No spacing = minified
      }

      return JSON.stringify(parsed);
    }
  } catch (e) {
    // Not valid JSON, fall back to standard text compression
  }

  // Text compression: Remove excessive whitespace and newlines
  return content
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/ {2,}/g, ' ')     // Replace 2+ spaces with 1
    .trim();
}
