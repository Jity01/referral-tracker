"use client";

import { useState } from "react";

export default function StopMonitoringButton({ clientId }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function stopMonitoring() {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/client/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          reason: "client_requested_stop"
        })
      });
      if (!response.ok) {
        throw new Error("Failed to stop monitoring.");
      }
      setStatus("done");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
      setStatus("error");
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <button type="button" className="subtle-btn" onClick={stopMonitoring} disabled={status === "loading"}>
        {status === "loading" ? "Updating..." : "Pause automated monitoring"}
      </button>
      {error ? <p className="error-text small">{error}</p> : null}
      {status === "done" ? <p className="ok-text small">Monitoring paused for this case.</p> : null}
    </div>
  );
}
