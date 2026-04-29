import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { WorkDetail } from "../lib/works";
import type { AuthUser } from "../lib/auth";
import {
  addWorkToLibrary,
  getWork,
  rateWork,
  removeWorkFromLibrary,
  trackWorkView,
} from "../lib/works";

type WorkShowPageProps = {
  currentUser: AuthUser | null;
};

function WorkShowPage({ currentUser }: WorkShowPageProps) {
  const { slug } = useParams<{ slug: string }>();

  const [work, setWork] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  const [libraryMessage, setLibraryMessage] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [savingLibrary, setSavingLibrary] = useState(false);

  const trackedViewForSlug = useRef<string | null>(null);

  useEffect(() => {
    const loadWork = async () => {
      if (!slug) {
        setError("Kein Werk angegeben");
        setLoading(false);
        return;
      }

      try {
        const data = await getWork(slug);
        setWork(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Werk konnte nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadWork();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    if (trackedViewForSlug.current === slug) return;

    const storageKey = `viewed-work:${slug}`;
    if (sessionStorage.getItem(storageKey)) return;

    trackedViewForSlug.current = slug;
    sessionStorage.setItem(storageKey, "true");

    const trackView = async () => {
      try {
        const updatedViewsCount = await trackWorkView(slug);

        setWork((currentWork) => {
          if (!currentWork || currentWork.slug !== slug) return currentWork;

          return {
            ...currentWork,
            views_count: updatedViewsCount,
          };
        });
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    };

    trackView();
  }, [slug]);

  const handleRateWork = async (score: number) => {
    if (!work) return;

    setSavingRating(true);
    setRatingMessage("");
    setRatingError("");

    try {
      const result = await rateWork(work.slug, score);

      setWork((currentWork) => {
        if (!currentWork) return currentWork;

        return {
          ...currentWork,
          rating_avg: result.work.rating_avg,
          rating_count: result.work.rating_count,
        };
      });

      setRatingMessage(`Danke! Du hast ${score} Sterne vergeben.`);
    } catch (err) {
      setRatingError(
        err instanceof Error
          ? err.message
          : "Rating konnte nicht gespeichert werden"
      );
    } finally {
      setSavingRating(false);
    }
  };

  const handleToggleLibrary = async () => {
    if (!work) return;

    if (!currentUser) {
      setLibraryError("Bitte melde dich an, um Werke zu speichern.");
      return;
    }

    setSavingLibrary(true);
    setLibraryMessage("");
    setLibraryError("");

    try {
      const inLibrary = work.in_library
        ? await removeWorkFromLibrary(work.slug)
        : await addWorkToLibrary(work.slug);

      setWork((currentWork) => {
        if (!currentWork) return currentWork;

        return {
          ...currentWork,
          in_library: inLibrary,
        };
      });

      setLibraryMessage(
        inLibrary
          ? "Werk wurde zu deiner Bibliothek hinzugefügt."
          : "Werk wurde aus deiner Bibliothek entfernt."
      );
    } catch (err) {
      setLibraryError(
        err instanceof Error
          ? err.message
          : "Bibliothek konnte nicht aktualisiert werden"
      );
    } finally {
      setSavingLibrary(false);
    }
  };

  if (loading) {
    return (
      <section className="card">
        <p>Lade Werk...</p>
      </section>
    );
  }

  if (error || !work) {
    return (
      <section className="card">
        <h2>Werk nicht gefunden</h2>
        <p>{error || "Dieses Werk existiert nicht."}</p>

        <div className="actions">
          <Link to="/" className="text-link">
            Zurück zur Startseite
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="work-show-hero">
        <div className="work-show-cover-wrap">
          {work.cover_picture ? (
            <img
              src={work.cover_picture}
              alt={`Cover von ${work.title}`}
              className="work-show-cover"
            />
          ) : (
            <div className="work-show-cover placeholder-cover">
              <span>{work.title.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="work-show-info">
          <div className="work-show-tags">
            <span>{formatStatus(work.status)}</span>
            <span>{formatAccessLevel(work.access_level)}</span>
          </div>

          <h1>{work.title}</h1>

          <p className="work-show-author">
            von <strong>{work.author.username}</strong>
          </p>

          {work.description && (
            <p className="work-show-description">{work.description}</p>
          )}

          {work.genres.length > 0 && (
            <div className="genre-pills large">
              {work.genres.map((genre) => (
                <span key={genre.id}>{genre.name}</span>
              ))}
            </div>
          )}

          <div className="continue-reading-box">
            {work.reading_progress ? (
              <Link
                to={`/chapters/${work.reading_progress.last_chapter.id}`}
                className="continue-reading-button"
              >
                Weiterlesen bei Kapitel{" "}
                {work.reading_progress.last_chapter.chapter_number}
              </Link>
            ) : work.chapters.length > 0 ? (
              <Link
                to={`/chapters/${work.chapters[0].id}`}
                className="continue-reading-button"
              >
                Bei Kapitel 1 starten
              </Link>
            ) : (
              <button type="button" className="continue-reading-button" disabled>
                Noch keine Kapitel
              </button>
            )}
          </div>

          <div className="library-box">
            <button
              type="button"
              className={work.in_library ? "library-button saved" : "library-button"}
              disabled={savingLibrary}
              onClick={handleToggleLibrary}
            >
              {work.in_library ? "✓ In Bibliothek" : "+ Zur Bibliothek hinzufügen"}
            </button>

            {!currentUser && (
              <Link to="/auth" className="library-login-link">
                Zum Login
              </Link>
            )}

            {libraryMessage && (
              <p className="library-feedback success">{libraryMessage}</p>
            )}

            {libraryError && (
              <p className="library-feedback error">{libraryError}</p>
            )}
          </div>

          <div className="work-show-stats">
            <div>
              <strong>{formatRating(work.rating_avg)}</strong>
              <span>Rating</span>
            </div>

            <div>
              <strong>{work.rating_count}</strong>
              <span>Bewertungen</span>
            </div>

            <div>
              <strong>{work.chapter_count}</strong>
              <span>Kapitel</span>
            </div>

            <div>
              <strong>{formatNumber(work.views_count)}</strong>
              <span>Views</span>
            </div>
          </div>

          <div className="rating-box">
            <div>
              <h2>Bewerte dieses Werk</h2>
              <p>
                {currentUser
                  ? "Vergib 1 bis 5 Sterne."
                  : "Melde dich an, um dieses Werk zu bewerten."}
              </p>
            </div>

            {currentUser ? (
              <div className="rating-actions">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className="star-button"
                    disabled={savingRating}
                    onClick={() => handleRateWork(score)}
                  >
                    {"★".repeat(score)}
                  </button>
                ))}
              </div>
            ) : (
              <Link to="/auth" className="rating-login-link">
                Zum Login
              </Link>
            )}

            {ratingMessage && <p className="rating-feedback success">{ratingMessage}</p>}
            {ratingError && <p className="rating-feedback error">{ratingError}</p>}
          </div>

        </div>
      </section>

      <section className="work-show-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Kapitel</p>
            <h2>Alle Kapitel</h2>
          </div>
        </div>

        {work.chapters.length === 0 ? (
          <div className="empty-state">
            <p>Dieses Werk hat noch keine Kapitel.</p>
          </div>
        ) : (
          <div className="chapter-list">
            {work.chapters.map((chapter) => (
              <Link
                key={chapter.id}
                to={`/chapters/${chapter.id}`}
                className={
                  chapter.requires_subscription ? "chapter-row locked" : "chapter-row"
                }
              >
                <span>
                  Kapitel {chapter.chapter_number}
                  {chapter.requires_subscription && " · Abo"}
                </span>

                <strong>{chapter.title || "Ohne Titel"}</strong>
              </Link>
            ))}
          </div>
        )}

        {work.access_level === "subscription_only" && (
          <p className="subscription-note">
            Kapitel 1 bis {work.free_chapter_until} sind kostenlos. Danach wird ein
            aktives Abo benötigt.
          </p>
        )}

      </section>
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

function formatStatus(status: string): string {
  switch (status) {
    case "ongoing":
      return "Läuft";
    case "completed":
      return "Abgeschlossen";
    default:
      return status;
  }
}

function formatAccessLevel(accessLevel: string): string {
  switch (accessLevel) {
    case "free_access":
      return "Kostenlos";
    case "subscription_only":
      return "Abo";
    case "paid_access":
      return "Bezahlt";
    default:
      return accessLevel;
  }
}

export default WorkShowPage;
