import type { AuthUser } from "../lib/auth";

type HomePageProps = {
  currentUser: AuthUser | null;
};

function HomePage({ currentUser }: HomePageProps) {
  return (
    <>
      <div className="hero">
        <h1>ChapterFlow</h1>
        <p>Willkommen bei ChapterFlow.</p>
      </div>

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
        </section>
      ) : (
        <section className="card">
          <h2>Du bist nicht eingeloggt</h2>
          <p>Bitte melde dich über Sign In an.</p>
        </section>
      )}
    </>
  );
}

export default HomePage;
