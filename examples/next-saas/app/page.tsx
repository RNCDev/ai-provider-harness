"use client";
import { ServerTransport } from "@aph/react";
import { SettingsPanel } from "../components/SettingsPanel";

const transport = new ServerTransport({ baseUrl: "/api/aph" });

export default function Home() {
  return <SettingsPanel transport={transport} />;
}
