import { useState, type FormEvent } from "react";
import { signup } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

type SignUpFormProps = {
  onSignupSuccess: (user: AuthUser, message?: string) => void;
  onError: (message: string) => void;
  onClearFeedback: () => void;
};

function SignUpForm({ onSignupSuccess, onError, onClearFeedback }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onClearFeedback();

    try {
      const result = await signup(email, username, password, passwordConfirmation);

      onSignupSuccess(result.user, result.message || "Signup successful");

      setEmail("");
      setUsername("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  return (
    <div className="card">
      <h2>Sign Up</h2>

      <form onSubmit={handleSignup} className="form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="newuser@example.com"
            required
          />
        </label>

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="reader_one"
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

        <label>
          Passwort bestätigen
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="password123"
            required
          />
        </label>

        <button type="submit">Registrieren</button>
      </form>
    </div>
  );
}

export default SignUpForm;
