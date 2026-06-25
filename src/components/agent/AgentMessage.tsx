"use client";

interface AgentMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export default function AgentMessage({ role, content, timestamp }: AgentMessageProps) {
  const isUser = role === "user";
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`agent-msg ${isUser ? "agent-msg--user" : "agent-msg--assistant"}`}>
      <div className="agent-msg__avatar">
        {isUser ? "U" : "A"}
      </div>
      <div className="agent-msg__body">
        <div className="agent-msg__text">{content}</div>
        <div className="agent-msg__time">{time}</div>
      </div>
    </div>
  );
}
