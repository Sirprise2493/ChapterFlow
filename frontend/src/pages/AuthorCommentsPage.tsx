import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import {
  deleteAuthorComment,
  getAuthorComments,
} from "../lib/authorComments";
import type {
  AuthorCommentChapter,
  AuthorCommentsResponse,
  AuthorModerationComment,
} from "../lib/authorComments";

const PER_PAGE = 20;

type AuthorCommentsPageProps = {
  currentUser: AuthUser | null;
};

function AuthorCommentsPage({ currentUser }: AuthorCommentsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<AuthorCommentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [workId, setWorkId] = useState(searchParams.get("work_id") ?? "");
  const [chapterId, setChapterId] = useState(
    searchParams.get("chapter_id") ?? ""
  );

  const page = Number(searchParams.get("page") ?? "1") || 1;

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total_count / data.per_page));
  }, [data]);

  const availableChapters = useMemo<AuthorCommentChapter[]>(() => {
    if (!data || !workId) return [];

    return data.works.find((work) => String(work.id) === workId)?.chapters ?? [];
  }, [data, workId]);

  useEffect(() => {
    if (!availableChapters.some((chapter) => String(chapter.id) === chapterId)) {
      setChapterId("");
    }
  }, [workId, availableChapters, chapterId]);

  useEffect(() => {
    const loadComments = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await getAuthorComments({
          work_id: searchParams.get("work_id") ?? undefined,
          chapter_id: searchParams.get("chapter_id") ?? undefined,
          page,
          per_page: PER_PAGE,
        });

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Kommentare konnten nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [currentUser, searchParams, page]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const updateParams = (nextPage = 1) => {
    const nextParams = new URLSearchParams();

    if (workId) nextParams.set("work_id", workId);
    if (chapterId) nextParams.set("chapter_id", chapterId);
    if (nextPage > 1) nextParams.set("page", String(nextPage));

    setSearchParams(nextParams);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams(1);
  };

  const handleReset = () => {
    setWorkId("");
    setChapterId("");
    setSearchParams(new URLSearchParams());
  };

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    const nextParams = new URLSearchParams(searchParams);

    if (safePage > 1) {
      nextParams.set("page", String(safePage));
    } else {
      nextParams.delete("page");
    }

    setSearchParams(nextParams);
  };

  const handleDeleteComment = async (comment: AuthorModerationComment) => {
    const confirmed = window.confirm(
      `Kommentar von ${comment.user.username} wirklich löschen?`
    );

    if (!confirmed) return;

    setDeletingId(comment.id);
    setError("");
    setMessage("");

    try {
      await deleteAuthorComment(comment.id);

      setData((currentData) => {
        if (!currentData) return currentData;

        return {
          ...currentData,
          total_count: Math.max(0, currentData.total_count - 1),
          comments: currentData.comments.filter((item) => item.id !== comment.id),
        };
      });

      setMessage("Kommentar wurde gelöscht.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kommentar konnte nicht gelöscht werden"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <section className="home-hero author-comments-hero">
        <div>
          <p className="eyebrow">Kommentar-Moderation</p>
          <h1>Kommentare</h1>
          <p>
            Verwalte Kommentare unter deinen Werken, prüfe Anhänge und entferne
            problematische Beiträge.
          </p>
        </div>

        <div className="hero-user-pill">
          {data ? `${data.total_count} Kommentare` : "Lädt..."}
        </div>
      </section>

      {message && <div className="feedback success">{message}</div>}
      {error && <div className="feedback error">{error}</div>}

      <section className="author-comments-layout">
        <aside className="author-comments-filter-card card">
          <h2>Filter</h2>

          <form className="works-filter-form" onSubmit={handleSubmit}>
            <label>
              Werk
              <select
                value={workId}
                onChange={(event) => {
                  setWorkId(event.target.value);
                  setChapterId("");
                }}
              >
                <option value="">Alle Werke</option>
                {data?.works.map((work) => (
                  <option key={work.id} value={work.id}>
                    {work.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Kapitel
              <select
                value={chapterId}
                disabled={!workId}
                onChange={(event) => setChapterId(event.target.value)}
              >
                <option value="">Alle Kapitel</option>
                {availableChapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    Kapitel {chapter.chapter_number}:{" "}
                    {chapter.title || "Ohne Titel"}
                  </option>
                ))}
              </select>
            </label>

            <div className="works-filter-actions">
              <button type="submit">Anwenden</button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleReset}
              >
                Zurücksetzen
              </button>
            </div>
          </form>
        </aside>

        <section className="author-comments-results">
          {loading && (
            <section className="card">
              <p>Lade Kommentare...</p>
            </section>
          )}

          {!loading && data && data.comments.length === 0 && (
            <section className="empty-state">
              <p>Keine Kommentare gefunden.</p>
            </section>
          )}

          {!loading && data && data.comments.length > 0 && (
            <>
              <div className="author-comment-list">
                {data.comments.map((comment) => (
                  <article key={comment.id} className="author-comment-card">
                    <div className="author-comment-meta">
                      <div className="comment-avatar">
                        {comment.user.username.slice(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <strong>{comment.user.username}</strong>
                        <span>{formatDateTime(comment.created_at)}</span>
                      </div>
                    </div>

                    <div className="author-comment-main">
                      <div className="author-comment-location">
                        <Link to={`/works/${comment.work.slug}`}>
                          {comment.work.title}
                        </Link>
                        <span>
                          Kapitel {comment.chapter.chapter_number}:{" "}
                          {comment.chapter.title || "Ohne Titel"}
                        </span>
                      </div>

                      {comment.content && (
                        <p className="author-comment-content">
                          {comment.content}
                        </p>
                      )}

                      {comment.media_url && (
                        <div className="author-comment-media">
                          <img
                            src={comment.media_url}
                            alt="Kommentar-Anhang"
                          />
                        </div>
                      )}

                      <div className="author-comment-stats">
                        <span>{comment.likes_count} Likes</span>
                        <span>{comment.replies_count} Antworten</span>
                        {comment.parent_comment_id && (
                          <span>Antwort-Kommentar</span>
                        )}
                      </div>
                    </div>

                    <div className="author-comment-actions">
                      <Link
                        to={`/chapters/${comment.chapter.id}`}
                        className="small-link-button secondary"
                      >
                        Kapitel öffnen
                      </Link>

                      <button
                        type="button"
                        className="small-button danger"
                        disabled={deletingId === comment.id}
                        onClick={() => handleDeleteComment(comment)}
                      >
                        {deletingId === comment.id
                          ? "Löscht..."
                          : "Löschen"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="pagination">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Zurück
                </button>

                <span>
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Weiter
                </button>
              </div>
            </>
          )}
        </section>
      </section>
    </>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default AuthorCommentsPage;
