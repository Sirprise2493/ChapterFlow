import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import {
  createAuthorChapter,
  deleteAuthorChapter,
  getAuthorWork,
  getGenres,
  updateAuthorChapter,
  updateAuthorWork,
  uploadCoverToCloudinary,
} from "../lib/authorWorks";
import type {
  AuthorChapter,
  AuthorGenre,
  AuthorWorkDetail,
  ChapterPayload,
  CreateWorkPayload,
} from "../lib/authorWorks";

type AuthorWorkEditPageProps = {
  currentUser: AuthUser | null;
};

function AuthorWorkEditPage({ currentUser }: AuthorWorkEditPageProps) {
  const { slug } = useParams<{ slug: string }>();

  const [work, setWork] = useState<AuthorWorkDetail | null>(null);
  const [genres, setGenres] = useState<AuthorGenre[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CreateWorkPayload["status"]>("ongoing");
  const [accessLevel, setAccessLevel] =
    useState<CreateWorkPayload["access_level"]>("free_access");
  const [freeChapterUntil, setFreeChapterUntil] = useState(0);
  const [isSubscriptionEligible, setIsSubscriptionEligible] = useState(true);
  const [publishNow, setPublishNow] = useState(true);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [chapterIsMonetizable, setChapterIsMonetizable] = useState(true);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);

  const [savingWork, setSavingWork] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedChapters = useMemo(() => {
    return [...(work?.chapters ?? [])].sort(
      (a, b) => a.chapter_number - b.chapter_number
    );
  }, [work]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser || !slug) {
        setLoading(false);
        return;
      }

      try {
        const [workData, genresData] = await Promise.all([
          getAuthorWork(slug),
          getGenres(),
        ]);

        const loadedWork = workData.work;

        setWork(loadedWork);
        setGenres(genresData.genres);

        setTitle(loadedWork.title);
        setDescription(loadedWork.description ?? "");
        setStatus(loadedWork.status as CreateWorkPayload["status"]);
        setAccessLevel(
          loadedWork.access_level === "subscription_only"
            ? "subscription_only"
            : "free_access"
        );
        setFreeChapterUntil(loadedWork.free_chapter_until ?? 0);
        setIsSubscriptionEligible(loadedWork.is_subscription_eligible);
        setPublishNow(Boolean(loadedWork.published_at));
        setSelectedGenreIds(loadedWork.genres.map((genre) => genre.id));
        setChapterNumber(getNextChapterNumber(loadedWork.chapters));
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

    loadData();
  }, [currentUser, slug]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <section className="card">
        <p>Lade Werk...</p>
      </section>
    );
  }

  if (!work || !slug) {
    return (
      <section className="card">
        <h2>Werk nicht gefunden</h2>
        <p>{error || "Dieses Werk konnte nicht geladen werden."}</p>
        <div className="actions">
          <Link to="/author/works" className="text-link">
            Zurück zu deinen Werken
          </Link>
        </div>
      </section>
    );
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

  const handleWorkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSavingWork(true);
    setMessage("");
    setError("");

    try {
      let coverPicture = work.cover_picture;

      if (coverFile) {
        coverPicture = await uploadCoverToCloudinary(coverFile);
      }

      const result = await updateAuthorWork(slug, {
        title,
        description,
        cover_picture: coverPicture,
        status,
        access_level: accessLevel,
        free_chapter_until:
          accessLevel === "subscription_only" ? freeChapterUntil : 0,
        is_subscription_eligible: isSubscriptionEligible,
        genre_ids: selectedGenreIds,
        publish_now: publishNow,
      });

      setWork((currentWork) => {
        if (!currentWork) return currentWork;

        return {
          ...currentWork,
          ...result.work,
          chapters: currentWork.chapters,
        };
      });

      setCoverFile(null);

      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
        setCoverPreviewUrl(null);
      }

      setMessage("Werk wurde aktualisiert.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Werk konnte nicht aktualisiert werden"
      );
    } finally {
      setSavingWork(false);
    }
  };

  const resetChapterForm = () => {
    setEditingChapterId(null);
    setChapterNumber(getNextChapterNumber(work?.chapters ?? []));
    setChapterTitle("");
    setChapterContent("");
    setChapterIsMonetizable(true);
  };

  const startEditChapter = (chapter: AuthorChapter) => {
    setEditingChapterId(chapter.id);
    setChapterNumber(chapter.chapter_number);
    setChapterTitle(chapter.title ?? "");
    setChapterContent(chapter.content ?? "");
    setChapterIsMonetizable(chapter.is_monetizable);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleChapterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSavingChapter(true);
    setMessage("");
    setError("");

    const payload: ChapterPayload = {
      chapter_number: chapterNumber,
      title: chapterTitle,
      content: chapterContent,
      is_monetizable: chapterIsMonetizable,
    };

    try {
      if (editingChapterId) {
        const result = await updateAuthorChapter(slug, editingChapterId, payload);

        setWork((currentWork) => {
          if (!currentWork) return currentWork;

          const nextChapters = [...currentWork.chapters, result.chapter];

          setChapterNumber(getNextChapterNumber(nextChapters));

          return {
            ...currentWork,
            chapter_count: currentWork.chapter_count + 1,
            chapters: nextChapters,
          };
        });

        setMessage("Kapitel wurde aktualisiert.");
      } else {
        const result = await createAuthorChapter(slug, payload);

        setWork((currentWork) => {
          if (!currentWork) return currentWork;

          return {
            ...currentWork,
            chapter_count: currentWork.chapter_count + 1,
            chapters: [...currentWork.chapters, result.chapter],
          };
        });

        setMessage("Kapitel wurde erstellt.");
      }

      if (editingChapterId) {
        resetChapterForm();
      } else {
        setEditingChapterId(null);
        setChapterTitle("");
        setChapterContent("");
        setChapterIsMonetizable(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kapitel konnte nicht gespeichert werden"
      );
    } finally {
      setSavingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapter: AuthorChapter) => {
    const confirmed = window.confirm(
      `Kapitel ${chapter.chapter_number} wirklich löschen?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteAuthorChapter(slug, chapter.id);

      setWork((currentWork) => {
        if (!currentWork) return currentWork;

        return {
          ...currentWork,
          chapter_count: Math.max(0, currentWork.chapter_count - 1),
          chapters: currentWork.chapters.filter((item) => item.id !== chapter.id),
        };
      });

      if (editingChapterId === chapter.id) {
        resetChapterForm();
      }

      setMessage("Kapitel wurde gelöscht.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kapitel konnte nicht gelöscht werden"
      );
    }
  };

  return (
    <>
      <section className="home-hero author-hero">
        <div>
          <p className="eyebrow">Werk bearbeiten</p>
          <h1>{work.title}</h1>
          <p>Bearbeite Metadaten, Cover, Veröffentlichungsstatus und Kapitel.</p>
        </div>

        <div className="hero-user-pill">
          {work.chapters.length}{" "}
          {work.chapters.length === 1 ? "Kapitel" : "Kapitel"}
        </div>
      </section>

      {message && <div className="feedback success">{message}</div>}
      {error && <div className="feedback error">{error}</div>}

      <section className="author-edit-layout">
        <form className="author-form card" onSubmit={handleWorkSubmit}>
          <h2>Werkdaten</h2>

          <label>
            Titel
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={2}
            />
          </label>

          <label>
            Beschreibung
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
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
          </div>

          {accessLevel === "subscription_only" && (
            <label>
              Kostenlose Kapitel bis einschließlich Kapitelnummer
              <input
                type="number"
                min={0}
                value={freeChapterUntil}
                onChange={(event) =>
                  setFreeChapterUntil(Number(event.target.value))
                }
              />
            </label>
          )}

          <label>
            Cover ersetzen
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleCoverChange(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <div className="edit-cover-row">
            {(coverPreviewUrl || work.cover_picture) && (
              <img
                src={coverPreviewUrl || work.cover_picture || ""}
                alt="Cover Vorschau"
              />
            )}
          </div>

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
            Veröffentlicht
          </label>

          <button type="submit" disabled={savingWork}>
            {savingWork ? "Speichert..." : "Werk aktualisieren"}
          </button>

          <Link to={`/works/${work.slug}`} className="text-link">
            Öffentliche Seite ansehen
          </Link>
        </form>

        <div className="author-chapter-column">
          <form className="author-form card" onSubmit={handleChapterSubmit}>
            <h2>{editingChapterId ? "Kapitel bearbeiten" : "Neues Kapitel"}</h2>

            <label>
              Kapitelnummer
              <input
                type="number"
                min={1}
                value={chapterNumber}
                onChange={(event) =>
                  setChapterNumber(Number(event.target.value))
                }
                required
              />
            </label>

            <label>
              Titel
              <input
                value={chapterTitle}
                onChange={(event) => setChapterTitle(event.target.value)}
                placeholder="z. B. Der Anfang"
              />
            </label>

            <label>
              Inhalt
              <textarea
                value={chapterContent}
                onChange={(event) => setChapterContent(event.target.value)}
                rows={14}
                required
              />
            </label>

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={chapterIsMonetizable}
                onChange={(event) =>
                  setChapterIsMonetizable(event.target.checked)
                }
              />
              Kapitel ist monetarisierbar
            </label>

            <div className="chapter-form-actions">
              <button type="submit" disabled={savingChapter}>
                {savingChapter
                  ? "Speichert..."
                  : editingChapterId
                    ? "Kapitel aktualisieren"
                    : "Kapitel erstellen"}
              </button>

              {editingChapterId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetChapterForm}
                >
                  Abbrechen
                </button>
              )}
            </div>
          </form>

          <section className="card author-chapter-list">
            <h2>Kapitel</h2>

            {sortedChapters.length === 0 ? (
              <p>Dieses Werk hat noch keine Kapitel.</p>
            ) : (
              <div className="author-chapter-items">
                {sortedChapters.map((chapter) => (
                  <article key={chapter.id} className="author-chapter-item">
                    <div>
                      <p className="eyebrow">
                        Kapitel {chapter.chapter_number}
                      </p>
                      <h3>{chapter.title || "Ohne Titel"}</h3>
                      <p>
                        {chapter.is_monetizable
                          ? "Monetarisierbar"
                          : "Nicht monetarisierbar"}
                      </p>
                    </div>

                    <div className="author-chapter-actions">
                      <Link
                        to={`/chapters/${chapter.id}`}
                        className="small-link-button"
                      >
                        Lesen
                      </Link>

                      <button
                        type="button"
                        className="small-button"
                        onClick={() => startEditChapter(chapter)}
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        className="small-button danger"
                        onClick={() => handleDeleteChapter(chapter)}
                      >
                        Löschen
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </>
  );
}

function getNextChapterNumber(chapters: AuthorChapter[]): number {
  if (chapters.length === 0) return 1;

  return Math.max(...chapters.map((chapter) => chapter.chapter_number)) + 1;
}

export default AuthorWorkEditPage;
