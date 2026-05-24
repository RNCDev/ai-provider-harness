"use client";
import {
  HarnessProvider,
  ProviderSelect,
  ModelSelect,
  SettingsForm,
  KeyForm,
  type Transport,
} from "@aph/react";
import { ChatWindow } from "./ChatWindow";

export interface SettingsPanelProps {
  transport: Transport;
}

export function SettingsPanel({ transport }: SettingsPanelProps) {
  return (
    <HarnessProvider transport={transport}>
      <div className="mx-auto grid max-w-4xl gap-6 p-6 md:grid-cols-[300px_1fr]">
        <aside className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Provider</h3>
            <ProviderSelect
              aria-label="Provider"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Model</h3>
            <ModelSelect
              aria-label="Model"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Settings</h3>
            <SettingsForm.Root>
              <Field name="temperature" label="Temperature" />
              <Field name="maxTokens" label="Max tokens" />
              <Field name="topP" label="Top P" />
              <Field name="systemPrompt" label="System prompt" />
            </SettingsForm.Root>
          </section>

          <KeyPanel />
        </aside>

        <main className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <ChatWindow />
        </main>
      </div>
    </HarnessProvider>
  );
}

function Field({ name, label }: { name: "temperature" | "maxTokens" | "topP" | "systemPrompt"; label: string }) {
  return (
    <SettingsForm.Field name={name}>
      <SettingsForm.Label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">{label}</SettingsForm.Label>
      <SettingsForm.Control className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
    </SettingsForm.Field>
  );
}

function KeyPanel() {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">API Key</h3>
      <KeyForm.Root providerId="openai" className="space-y-2">
        <KeyForm.Status />
        <div className="flex gap-2">
          <KeyForm.Input
            aria-label="Key"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex gap-2">
          <KeyForm.ValidateButton>Validate</KeyForm.ValidateButton>
          <KeyForm.DeleteButton>Remove</KeyForm.DeleteButton>
        </div>
      </KeyForm.Root>
    </section>
  );
}
