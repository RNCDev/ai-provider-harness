# settings-panel

A Tailwind-styled settings panel built on `@aph/react`.

## Usage

```tsx
import { SettingsPanel } from "./SettingsPanel";
import { ServerTransport } from "@aph/react";

const transport = new ServerTransport({ baseUrl: "/api/aph" });
export default function Page() { return <SettingsPanel transport={transport} />; }
```

Make sure Tailwind is configured. Edit any file freely — they're yours.
