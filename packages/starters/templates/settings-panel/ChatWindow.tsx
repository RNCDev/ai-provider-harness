"use client";
import { useState } from "react";
import { useChat } from "@aph/react";

export function ChatWindow() {
  const { ready, status, messages, error, send } = useChat();
  const [input, setInput] = useState("");

  return (
    <div className="flex h-[60vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
              m.role === "user"
                ? "ml-auto bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
            ].join(" ")}
          >
            {m.content || (status === "streaming" && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <form
        className="mt-3 flex gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800"
        onSubmit={(e) => { e.preventDefault(); if (input.trim()) { send(input); setInput(""); } }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!ready || status === "streaming"}
          placeholder={ready ? "Send a message…" : "Pick a model and add a key first"}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={!ready || status === "streaming" || !input.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {status === "streaming" ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
