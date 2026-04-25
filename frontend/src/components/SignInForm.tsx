import { useState, type FormEvent } from "react";
import { login } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

type SignInFormProps = {
  onLoginSuccess: (user: AuthUser, message?: string) => void;
  onError: (message: string) => void;
  onClearFeedback: () => void;
};

function SignInForm({ onLoginSuccess, onError, onClearFeedback }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onClearFeedback();

    try {
      const result = await login(email, password);
      onLoginSuccess(result.user, result.message || "Login successful");
      setPassword("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="card">
      <h2>Sign In</h2>

      <form onSubmit={handleLogin} className="form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="reader@example.com"
            required
          />
        </label>

        <label>
          Passwort
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
            required
          />
        </label>

        <button type="submit">Einloggen</button>
      </form>
    </div>
  );
}

export default SignInForm;
