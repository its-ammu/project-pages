"use client";

import Image from "next/image";
import { useState } from "react";

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<{ error?: string }>;
  onSignUp: (email: string, password: string) => Promise<{ error?: string }>;
}

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result =
      mode === "signin"
        ? await onSignIn(email.trim(), password)
        : await onSignUp(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setError("");
      setMode("signin");
      setPassword("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-inter), 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 14,
          padding: 32,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #ebebeb",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <Image
            src="/logo.png"
            alt=""
            width={56}
            height={56}
            style={{ objectFit: "contain" }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "-0.3px",
              color: "#222",
            }}
          >
            Project Pages
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              background: mode === "signin" ? "#222" : "transparent",
              color: mode === "signin" ? "#fff" : "#888",
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              background: mode === "signup" ? "#222" : "transparent",
              color: mode === "signup" ? "#fff" : "#888",
            }}
          >
            Sign up
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
              background: "#fff",
              color: "#222",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              outline: "none",
              marginBottom: 16,
              boxSizing: "border-box",
              background: "#fff",
              color: "#222",
            }}
          />
          {error && (
            <p
              style={{
                fontSize: 13,
                color: "#c0392b",
                marginBottom: 12,
              }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: "#222",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
