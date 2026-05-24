import { createContext, useContext, useState, type FormHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import type { ProviderId } from "@aph/harness";
import { useKey } from "../hooks/useKey.js";

interface Ctx {
  providerId: ProviderId;
  hasKey: boolean;
  loading: boolean;
  setKey: (k: string) => Promise<void>;
  deleteKey: () => Promise<void>;
  validate: () => Promise<{ ok: boolean; message?: string }>;
}
const C = createContext<Ctx | null>(null);

function Root({ providerId, children, ...rest }: { providerId: ProviderId; children: ReactNode } & Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit">) {
  const k = useKey(providerId);
  return (
    <C.Provider value={{ providerId, ...k }}>
      <form {...rest} onSubmit={(e) => e.preventDefault()}>{children}</form>
    </C.Provider>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const c = useContext(C);
  if (!c) throw new Error("KeyForm.Input outside Root");
  const [v, setV] = useState("");
  return (
    <>
      <input
        type="password"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={c.hasKey ? "•••••• (replace)" : "Paste API key"}
        {...props}
      />
      <button type="button" onClick={() => { if (v) void c.setKey(v).then(() => setV("")); }}>Save</button>
    </>
  );
}

function Status() {
  const c = useContext(C);
  if (!c) throw new Error("KeyForm.Status outside Root");
  if (c.loading) return <span>Checking…</span>;
  return <span>{c.hasKey ? "Key stored" : "No key"}</span>;
}

function ValidateButton({ children = "Validate" }: { children?: ReactNode }) {
  const c = useContext(C);
  if (!c) throw new Error("KeyForm.ValidateButton outside Root");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={async () => {
        const r = await c.validate();
        setMsg(r.ok ? "OK" : (r.message ?? "Failed"));
      }}>{children}</button>
      {msg && <span>{msg}</span>}
    </>
  );
}

function DeleteButton({ children = "Remove key" }: { children?: ReactNode }) {
  const c = useContext(C);
  if (!c) throw new Error("KeyForm.DeleteButton outside Root");
  return <button type="button" onClick={() => void c.deleteKey()}>{children}</button>;
}

export const KeyForm = { Root, Input, Status, ValidateButton, DeleteButton };
