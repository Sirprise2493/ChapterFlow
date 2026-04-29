import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { getMe, logout } from "./lib/auth";
import type { AuthUser } from "./lib/auth";

import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import WorkShowPage from "./pages/WorkShowPage";
import ChapterShowPage from "./pages/ChapterShowPage";
import LibraryPage from "./pages/LibraryPage";
import AuthorWorksPage from "./pages/AuthorWorksPage";
import AuthorWorkEditPage from "./pages/AuthorWorkEditPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AuthorDashboardPage from "./pages/AuthorDashboardPage";
import WorksPage from "./pages/WorksPage";


function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const handleAuthSuccess = (user: AuthUser, successMessage?: string) => {
    setCurrentUser(user);
    setMessage(successMessage || "Erfolgreich angemeldet");
    setError("");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setMessage("");
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
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AppLayout
              isLoggedIn={Boolean(currentUser)}
              onLogout={handleLogout}
            />
          }
        >
          <Route
            path="/"
            element={
              <>
                {message && <div className="feedback success">{message}</div>}
                {error && <div className="feedback error">{error}</div>}

                <HomePage currentUser={currentUser} />
              </>
            }
          />

          <Route
            path="/auth"
            element={
              <>
                {message && <div className="feedback success">{message}</div>}
                {error && <div className="feedback error">{error}</div>}

                {currentUser ? (
                  <Navigate to="/" replace />
                ) : (
                  <AuthPage
                    onLoginSuccess={handleAuthSuccess}
                    onSignupSuccess={handleAuthSuccess}
                    onError={handleError}
                    onClearFeedback={clearFeedback}
                  />
                )}
              </>
            }
          />


          <Route
            path="/chapters/:id"
            element={<ChapterShowPage currentUser={currentUser} />}
          />

          <Route path="/works" element={<WorksPage />} />

          <Route
            path="/works/:slug"
            element={<WorkShowPage currentUser={currentUser} />}
          />

          <Route
            path="/author/works/:slug/edit"
            element={<AuthorWorkEditPage currentUser={currentUser} />}
          />

          <Route
            path="/subscription"
            element={<SubscriptionPage currentUser={currentUser} />}
          />

          <Route
            path="/author/dashboard"
            element={<AuthorDashboardPage currentUser={currentUser} />}
          />



          <Route
            path="/author/works"
            element={<AuthorWorksPage currentUser={currentUser} />}
          />

          <Route
            path="/library"
            element={<LibraryPage currentUser={currentUser} />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
