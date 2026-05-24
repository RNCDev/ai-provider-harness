import { type SelectHTMLAttributes } from "react";
import { useProviders } from "../hooks/useProviders.js";
import { useSelection } from "../hooks/useSelection.js";

export interface ProviderSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {}

export function ProviderSelect(props: ProviderSelectProps) {
  const { providers } = useProviders();
  const { selection, setSelection } = useSelection();
  return (
    <select
      {...props}
      value={selection?.providerId ?? ""}
      onChange={(e) => {
        const id = e.target.value;
        setSelection({ providerId: id, modelId: providers.find((p) => p.id === id)?.models[0]?.id ?? "" });
      }}
    >
      <option value="" disabled>Select a provider…</option>
      {providers.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
    </select>
  );
}
