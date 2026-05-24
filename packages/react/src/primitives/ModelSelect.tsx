import { type SelectHTMLAttributes } from "react";
import { useSelection } from "../hooks/useSelection.js";
import { useModels } from "../hooks/useModels.js";

export interface ModelSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {}

export function ModelSelect(props: ModelSelectProps) {
  const { selection, setSelection } = useSelection();
  const { models } = useModels(selection?.providerId);
  return (
    <select
      {...props}
      value={selection?.modelId ?? ""}
      onChange={(e) => selection && setSelection({ ...selection, modelId: e.target.value })}
      disabled={!selection?.providerId}
    >
      <option value="" disabled>{selection?.providerId ? "Select a model…" : "Pick a provider first"}</option>
      {models.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}
    </select>
  );
}
