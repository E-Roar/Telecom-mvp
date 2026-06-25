"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/mockdb";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    db.init();
  }, []);

  useEffect(() => {
    if (user) {
      router.replace(user.role === "admin" ? "/admin" : "/technician");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo__icon">FT</span>
          </div>
          <h1 className="login-title">FTTH Work Orders</h1>
          <p className="login-subtitle">Gestion des interventions fibré</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ftth.ma"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="login-demo">
          <p className="login-demo__label">Identifiants de démonstration</p>
          <div className="login-demo__item">
            <span className="login-demo__role">Admin</span>
            <code>admin@ftth.ma</code>
            <code>admin123</code>
          </div>
          <div className="login-demo__item">
            <span className="login-demo__role">Technicien</span>
            <code>tech@ftth.ma</code>
            <code>tech123</code>
          </div>
        </div>

        <p className="login-footer">
          INWI / Traces FTTH &mdash; Casablanca &amp; Berrechid
        </p>
      </div>
    </div>
  );
}
