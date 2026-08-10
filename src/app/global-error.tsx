"use client";

/**
 * Last-resort boundary: this replaces the root layout, so it cannot use the app
 * shell or the i18n provider. Keep it plain and bilingual.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Something went wrong · A apărut o eroare</h1>
          <p style={{ marginTop: ".5rem", opacity: 0.7, fontSize: ".875rem" }}>
            Your measurements are saved on this device.
            <br />
            Măsurătorile tale sunt salvate pe acest dispozitiv.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              padding: ".625rem 1.25rem",
              borderRadius: ".5rem",
              border: "1px solid currentColor",
              background: "transparent",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Try again · Reîncearcă
          </button>
          {error.digest && (
            <p style={{ marginTop: "1rem", fontSize: ".625rem", opacity: 0.5, fontFamily: "monospace" }}>
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
