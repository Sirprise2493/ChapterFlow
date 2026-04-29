import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { AuthUser } from "../lib/auth";
import { getLibrary } from "../lib/works";
import type { LibraryWork } from "../lib/works";

type LibraryPageProps = {
  currentUser: AuthUser | null;
};

function LibraryPage({ currentUser }: LibraryPageProps) {
  const [works, setWorks] = useState<LibraryWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLibrary = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const data = await getLibrary();
        setWorks(data.works);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Bibliothek konnte nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <section className="card">
        <p>Lade Bibliothek...</p>
      </section>
    );
  }

  return (
    <>
      <section className="home-hero library-hero">
        <div>
          <p className="eyebrow">Meine Bibliothek</p>
          <h1>Gespeicherte Werke</h1>
          <p>Alle Werke, die du dir merken oder später weiterlesen möchtest.</p>
        </div>

        <div className="hero-user-pill">
          {works.length} {works.length === 1 ? "Werk" : "Werke"}
        </div>
      </section>

      {error && (
        <section className="card">
          <p>{error}</p>
        </section>
      )}

      {!error && works.length === 0 && (
        <section className="empty-state">
          <p>Du hast noch keine Werke in deiner Bibliothek.</p>
          <div className="actions">
            <Link to="/" className="text-link">
              Werke entdecken
            </Link>
          </div>
        </section>
      )}

      {works.length > 0 && (
        <section className="library-grid">
          {works.map((work) => (
            <article key={work.id} className="library-card">
              <Link to={`/works/${work.slug}`} className="library-cover-link">
                {work.cover_picture ? (
                  <img
                    src={work.cover_picture}
                    alt={`Cover von ${work.title}`}
                    className="library-cover"
                  />
                ) : (
                  <div className="library-cover placeholder-cover">
                    <span>{work.title.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
              </Link>

              <div className="library-card-body">
                <Link to={`/works/${work.slug}`} className="library-title">
                  {work.title}
                </Link>

                <p className="work-author">von {work.author.username}</p>

                {work.description && (
                  <p className="library-description">{work.description}</p>
                )}

                {work.reading_progress ? (
                  <Link
                    to={`/chapters/${work.reading_progress.last_chapter.id}`}
                    className="library-progress-link"
                  >
                    Weiterlesen: Kapitel{" "}
                    {work.reading_progress.last_chapter.chapter_number}
                  </Link>
                ) : (
                  <Link to={`/works/${work.slug}`} className="library-progress-link">
                    Noch nicht begonnen
                  </Link>
                )}

                <div className="work-meta">
                  <span>★ {formatRating(work.rating_avg)}</span>
                  <span>{work.rating_count} Ratings</span>
                </div>

                <div className="work-meta">
                  <span>{work.chapter_count} Kapitel</span>
                  <span>{formatNumber(work.views_count)} Views</span>
                </div>

                {work.genres.length > 0 && (
                  <div className="genre-pills">
                    {work.genres.slice(0, 3).map((genre) => (
                      <span key={genre.id}>{genre.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

function formatRating(value: number | string | null): string {
  if (value === null || value === undefined) return "-";

  const numberValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numberValue)) return "-";

  return numberValue.toFixed(2);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}

export default LibraryPage;
