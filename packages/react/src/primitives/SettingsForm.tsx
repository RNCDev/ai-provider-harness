import { createContext, useContext, useId, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode } from "react";
import { validateSettings, type InferenceSettings } from "@aph/harness";
import { useSelection } from "../hooks/useSelection.js";
import { useSettings } from "../hooks/useSettings.js";

interface FormCtx { settings: InferenceSettings; update: (p: Partial<InferenceSettings>) => Promise<void> }
const FormC = createContext<FormCtx | null>(null);
interface FieldCtx { name: keyof InferenceSettings; id: string; errorId: string }
const FieldC = createContext<FieldCtx | null>(null);

function Root({ children }: { children: ReactNode }) {
  const { selection } = useSelection();
  const { settings, update } = useSettings(selection?.modelId);
  return (
    <FormC.Provider value={{ settings, update }}>
      <form onSubmit={(e) => e.preventDefault()}>{children}</form>
    </FormC.Provider>
  );
}

function Field({ name, children }: { name: keyof InferenceSettings; children: ReactNode }) {
  const id = useId();
  return <FieldC.Provider value={{ name, id, errorId: `${id}-err` }}><div>{children}</div></FieldC.Provider>;
}

function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  const f = useContext(FieldC);
  if (!f) throw new Error("Label outside Field");
  return <label {...props} htmlFor={f.id} />;
}

function Control(props: InputHTMLAttributes<HTMLInputElement>) {
  const f = useContext(FieldC);
  const c = useContext(FormC);
  if (!f || !c) throw new Error("Control outside Field/Form");
  const v = c.settings[f.name];
  const isNumeric = f.name === "temperature" || f.name === "maxTokens" || f.name === "topP";
  return (
    <input
      id={f.id}
      type={isNumeric ? "number" : "text"}
      step={f.name === "temperature" || f.name === "topP" ? "0.01" : "1"}
      aria-describedby={f.errorId}
      value={v === undefined ? "" : (Array.isArray(v) ? v.join(",") : String(v))}
      onChange={(e) => {
        const raw = e.target.value;
        const next: Partial<InferenceSettings> = {};
        if (raw === "") {
          (next as Record<string, unknown>)[f.name] = undefined;
        } else if (isNumeric) {
          (next as Record<string, unknown>)[f.name] = Number(raw);
        } else if (f.name === "stop") {
          (next as Record<string, unknown>)[f.name] = raw.split(",").map((s) => s.trim());
        } else {
          (next as Record<string, unknown>)[f.name] = raw;
        }
        const r = validateSettings({ ...c.settings, ...next });
        if (r.ok) void c.update(next);
      }}
      {...props}
    />
  );
}

export const SettingsForm = { Root, Field, Label, Control };
