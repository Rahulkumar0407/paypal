"use client";

/** The wordmark: "tm" in PayPal navy, "rw" in PayPal blue, split the way "Pay" and "Pal" are. */
export function Wordmark({ size = 58 }: { size?: number }) {
  return (
    <span
      className="tmrw-wordmark"
      style={{ fontSize: size, display: "block" }}
    >
      <span style={{ color: "#003087" }}>tm</span>
      <span style={{ color: "#009CDE" }}>rw</span>
    </span>
  );
}

/** Stage 1: the login card over the blurred station. */
export function Login({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="tmrw-layer"
      style={{
        display: "grid",
        placeItems: "center",
        background: "rgba(10,20,35,.25)",
      }}
    >
      <div
        className="tmrw-glass tmrw-fade-up"
        style={{
          width: 420,
          borderRadius: 28,
          padding: "40px 40px 32px",
          textAlign: "center",
          boxShadow: "0 30px 80px rgba(0,0,0,.25)",
        }}
      >
        <h1 style={{ margin: 0 }}>
          <Wordmark />
        </h1>
        <p
          className="tmrw-muted"
          style={{ margin: "12px 0 30px", fontSize: 17 }}
        >
          Know tomorrow before it arrives.
        </p>
        <button
          className="tmrw-btn tmrw-pill"
          onClick={onContinue}
          style={{
            width: "100%",
            height: 50,
            fontSize: 16,
            background: "#0070E0",
            color: "#fff",
          }}
        >
          Continue with PayPal
        </button>
        <button
          className="tmrw-btn tmrw-pill tmrw-ghost"
          onClick={onContinue}
          style={{ width: "100%", height: 50, marginTop: 10, fontSize: 16 }}
        >
          Continue with email
        </button>
        <p className="tmrw-muted" style={{ margin: "22px 0 0", fontSize: 13 }}>
          New here? Setup takes about two minutes.
        </p>
      </div>
    </div>
  );
}
