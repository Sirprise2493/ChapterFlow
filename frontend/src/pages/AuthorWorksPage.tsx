import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import {
  createAuthorWork,
  getAuthorWorks,
  getGenres,
  uploadCoverToCloudinary,
} from "../lib/authorWorks";
import type { AuthorGenre, AuthorWork, CreateWorkPayload } from "../lib/authorWorks";

type AuthorWorksPageProps = {
  currentUser: AuthUser | null;
};

function AuthorWorksPage({ currentUser }: AuthorWorksPageProps) {
  const [works, setWorks] = useState<AuthorWork[]>([]);
  const [genres, setGenres] = useState<AuthorGenre[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CreateWorkPayload["status"]>("ongoing");
  const [accessLevel, setAccessLevel] =
    useState<CreateWorkPayload["access_level"]>("free_access");
  const [isSubscriptionEligible, setIsSubscriptionEligible] = useState(true);
  const [publishNow, setPublishNow] = useState(true);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [freeChapterUntil, setFreeChapterUntil] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const [worksData, genresData] = await Promise.all([
          getAuthorWorks(),
          getGenres(),
        ]);

        setWorks(worksData.works);
        setGenres(genresData.genres);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Autorenbereich konnte nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const toggleGenre = (genreId: number) => {
    setSelectedGenreIds((currentIds) =>
      currentIds.includes(genreId)
        ? currentIds.filter((id) => id !== genreId)
        : [...currentIds, genreId]
    );
  };

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);

    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setCoverPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("ongoing");
    setAccessLevel("free_access");
    setIsSubscriptionEligible(true);
    setPublishNow(true);
    setSelectedGenreIds([]);
    setCoverFile(null);

    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setCoverPreviewUrl(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      let coverPicture: string | null = null;

      if (coverFile) {
        coverPicture = await uploadCoverToCloudinary(coverFile);
      }

      const result = await createAuthorWork({
        title,
        description,
        cover_picture: coverPicture,
        status,
        access_level: accessLevel,
        free_chapter_until: accessLevel === "subscription_only" ? freeChapterUntil : 0,
        is_subscription_eligible: isSubscriptionEligible,
        genre_ids: selectedGenreIds,
        publish_now: publishNow,
      });

      setWorks((currentWorks) => [result.work, ...currentWorks]);
      setMessage("Werk wurde erstellt.");
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Werk konnte nicht erstellt werden"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="card">
        <p>Lade Autorenbereich...</p>
      </section>
    );
  }

  return (
    <>
      <section className="home-hero author-hero">
        <div>
          <p className="eyebrow">Autorenbereich</p>
          <h1>Meine Werke</h1>
          <p>Erstelle neue Geschichten, lade Covers hoch und veröffentliche deine Werke.</p>
        </div>

        <div className="hero-user-pill">
          {works.length} {works.length === 1 ? "Werk" : "Werke"}
        </div>
      </section>

      {message && <div className="feedback success">{message}</div>}
      {error && <div className="feedback error">{error}</div>}

      <section className="author-layout">
        <form className="author-form card" onSubmit={handleSubmit}>
          <h2>Neues Werk erstellen</h2>

          <label>
            Titel
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={2}
              placeholder="z. B. The Last Arcane King"
            />
          </label>

          <label>
            Beschreibung
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="Worum geht es in deinem Werk?"
            />
          </label>

          <div className="form-row">
            <label>
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as CreateWorkPayload["status"])
                }
              >
                <option value="ongoing">Läuft</option>
                <option value="completed">Abgeschlossen</option>
              </select>
            </label>

            <label>
              Zugriff
              <select
                value={accessLevel}
                onChange={(event) =>
                  setAccessLevel(
                    event.target.value as CreateWorkPayload["access_level"]
                  )
                }
              >
                <option value="free_access">Kostenlos</option>
                <option value="subscription_only">Abo</option>
              </select>
            </label>

            {accessLevel === "subscription_only" && (
              <label>
                Kostenlose Kapitel bis einschließlich Kapitelnummer
                <input
                  type="number"
                  min={0}
                  value={freeChapterUntil}
                  onChange={(event) => setFreeChapterUntil(Number(event.target.value))}
                />
              </label>
            )}
          </div>

          <label>
            Cover
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleCoverChange(event.target.files?.[0] ?? null)
              }
            />
          </label>

          {coverPreviewUrl && (
            <div className="cover-preview">
              <img src={coverPreviewUrl} alt="Cover Vorschau" />
            </div>
          )}

          <div className="genre-checkbox-grid">
            {genres.map((genre) => (
              <label key={genre.id} className="genre-checkbox">
                <input
                  type="checkbox"
                  checked={selectedGenreIds.includes(genre.id)}
                  onChange={() => toggleGenre(genre.id)}
                />
                {genre.name}
              </label>
            ))}
          </div>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={isSubscriptionEligible}
              onChange={(event) =>
                setIsSubscriptionEligible(event.target.checked)
              }
            />
            Für Subscription-Payouts berechtigt
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(event) => setPublishNow(event.target.checked)}
            />
            Direkt veröffentlichen
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Speichert..." : "Werk erstellen"}
          </button>
        </form>

        <section className="author-works-list">
          <h2>Deine Werke</h2>

          {works.length === 0 ? (
            <div className="empty-state">
              <p>Du hast noch keine Werke erstellt.</p>
            </div>
          ) : (
            <div className="author-work-grid">
              {works.map((work) => (
                <article key={work.id} className="author-work-card">
                  <Link to={`/works/${work.slug}`} className="author-cover-link">
                    {work.cover_picture ? (
                      <img
                        src={work.cover_picture}
                        alt={`Cover von ${work.title}`}
                      />
                    ) : (
                      <div className="author-cover-placeholder">
                        {work.title.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div>
                    <Link to={`/works/${work.slug}`} className="author-work-title">
                      {work.title}
                    </Link>

                    <p className="author-work-meta">
                      {work.published_at ? "Veröffentlicht" : "Entwurf"} ·{" "}
                      {formatStatus(work.status)}
                    </p>

                    <p className="author-work-meta">
                      {work.chapter_count} Kapitel · {work.views_count} Views · ★{" "}
                      {formatRating(work.rating_avg)}
                    </p>

                    {work.genres.length > 0 && (
                      <div className="genre-pills">
                        {work.genres.slice(0, 3).map((genre) => (
                          <span key={genre.id}>{genre.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="author-work-actions">
                    <Link to={`/author/works/${work.slug}/edit`} className="small-link-button">
                      Bearbeiten
                    </Link>

                    <Link to={`/works/${work.slug}`} className="small-link-button secondary">
                      Anzeigen
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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

export default AuthorWorksPage;
