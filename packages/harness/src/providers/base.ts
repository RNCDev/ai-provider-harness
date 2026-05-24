export async function* parseSseLines(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).replace(/\r$/, "");
        buf = buf.slice(idx + 1);
        if (line.startsWith("data: ")) yield line.slice(6);
      }
    }
  } finally {
    reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export class ProviderHttpError extends Error {
  constructor(public status: number, public body: string) {
    super(`provider http ${status}: ${body.slice(0, 200)}`);
  }
}

export async function jsonOrThrow(res: Response): Promise<unknown> {
  if (!res.ok) throw new ProviderHttpError(res.status, await res.text());
  return res.json();
}
