import SignInForm from "../components/SignInForm";
import SignUpForm from "../components/SignUpForm";
import type { AuthUser } from "../lib/auth";

type AuthPageProps = {
  onLoginSuccess: (user: AuthUser, message?: string) => void;
  onSignupSuccess: (user: AuthUser, message?: string) => void;
  onError: (message: string) => void;
  onClearFeedback: () => void;
};

function AuthPage({
  onLoginSuccess,
  onSignupSuccess,
  onError,
  onClearFeedback,
}: AuthPageProps) {
  return (
    <>
      <div className="hero">
        <h1>ChapterFlow</h1>
        <p>Sign In und Sign Up direkt auf der Startseite.</p>
      </div>

      <section className="grid">
        <SignInForm
          onLoginSuccess={onLoginSuccess}
          onError={onError}
          onClearFeedback={onClearFeedback}
        />

        <SignUpForm
          onSignupSuccess={onSignupSuccess}
          onError={onError}
          onClearFeedback={onClearFeedback}
        />
      </section>
    </>
  );
}

export default AuthPage;
