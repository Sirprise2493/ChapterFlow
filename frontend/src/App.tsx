import { useEffect, useState, type FormEvent } from "react";
import "./App.css";
import { getMe, login, logout, signup } from "./lib/auth";
import type { AuthUser } from "./lib/auth";

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirmation, setSignupPasswordConfirmation] = useState("");

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getMe();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    loadCurrentUser();
  }, []);

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    try {
      const result = await login(loginEmail, loginPassword);
      setCurrentUser(result.user);
      setMessage(result.message || "Login successful");
      setLoginPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    try {
      const result = await signup(
        signupEmail,
        signupUsername,
        signupPassword,
        signupPasswordConfirmation
      );

      setCurrentUser(result.user);
      setMessage(result.message || "Signup successful");

      setSignupEmail("");
      setSignupUsername("");
      setSignupPassword("");
      setSignupPasswordConfirmation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  const handleLogout = async () => {
    clearFeedback();

    try {
      await logout();
      setCurrentUser(null);
      setMessage("Logged out successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  };

  if (loadingUser) {
    return (
      <main className="page">
        <div className="card">
          <h1>ChapterFlow</h1>
          <p>Lade Benutzerstatus...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="hero">
        <h1>ChapterFlow</h1>
        <p>Sign In und Sign Up direkt auf der Startseite.</p>
      </div>

      {message && <div className="feedback success">{message}</div>}
      {error && <div className="feedback error">{error}</div>}

      {currentUser ? (
        <section className="card user-card">
          <h2>Du bist eingeloggt</h2>
          <div className="user-info">
            <p>
              <strong>ID:</strong> {currentUser.id}
            </p>
            <p>
              <strong>Email:</strong> {currentUser.email}
            </p>
            <p>
              <strong>Username:</strong> {currentUser.username}
            </p>
          </div>

          <div className="actions">
            <button onClick={handleLogout}>Logout</button>
          </div>
        </section>
      ) : (
        <section className="grid">
          <div className="card">
            <h2>Sign In</h2>
            <form onSubmit={handleLogin} className="form">
              <label>
                Email
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="reader@example.com"
                  required
                />
              </label>

              <label>
                Passwort
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="password123"
                  required
                />
              </label>

              <button type="submit">Einloggen</button>
            </form>
          </div>

          <div className="card">
            <h2>Sign Up</h2>
            <form onSubmit={handleSignup} className="form">
              <label>
                Email
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="newuser@example.com"
                  required
                />
              </label>

              <label>
                Username
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="reader_one"
                  required
                />
              </label>

              <label>
                Passwort
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="password123"
                  required
                />
              </label>

              <label>
                Passwort bestätigen
                <input
                  type="password"
                  value={signupPasswordConfirmation}
                  onChange={(e) => setSignupPasswordConfirmation(e.target.value)}
                  placeholder="password123"
                  required
                />
              </label>

              <button type="submit">Registrieren</button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
