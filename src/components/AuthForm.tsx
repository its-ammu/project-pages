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
  const [showPassword, setShowPassword] = useState(false);
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
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              style={{
                width: "100%",
                padding: "10px 36px 10px 12px",
                fontSize: 14,
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                outline: "none",
                boxSizing: "border-box",
                background: "#fff",
                color: "#222",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "#bbb",
                display: "flex",
                alignItems: "center",
              }}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
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
