import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getChapter, saveReadingProgress } from "../lib/chapters";
import type { ChapterDetail } from "../lib/chapters";
import type { AuthUser } from "../lib/auth";
import {
  createChapterComment,
  deleteChapterComment,
  getChapterComments,
  likeChapterComment,
  unlikeChapterComment,
  updateChapterComment,
} from "../lib/comments";
import type { ChapterComment } from "../lib/comments";
import { uploadMediaToCloudinary } from "../lib/cloudinary";

type ChapterShowPageProps = {
  currentUser: AuthUser | null;
};

type ReaderPanel = "toc" | "settings" | "comments" | null;

type ReaderTheme = "light" | "sepia" | "dark";
type ReaderFont = "serif" | "sans";

type ReaderSettings = {
  theme: ReaderTheme;
  font: ReaderFont;
  fontSize: number;
};

const READER_SETTINGS_KEY = "chapterflow-reader-settings";

const defaultReaderSettings: ReaderSettings = {
  theme: "sepia",
  font: "serif",
  fontSize: 22,
};

function ChapterShowPage({ currentUser }: ChapterShowPageProps) {
  const { id } = useParams<{ id: string }>();

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePanel, setActivePanel] = useState<ReaderPanel>(null);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(
    () => loadReaderSettings()
  );

  const [scrollProgress, setScrollProgress] = useState(0);

  const readerContentRef = useRef<HTMLElement | null>(null);
  const savedProgressRef = useRef(0);
  const latestProgressRef = useRef(0);
  const latestScrollPositionRef = useRef(0);
  const lastSaveRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const restoredScrollRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(readerSettings));
  }, [readerSettings]);

  useEffect(() => {
    restoredScrollRef.current = false;
    savedProgressRef.current = 0;
    latestProgressRef.current = 0;
    latestScrollPositionRef.current = 0;
    lastSaveRef.current = 0;
    saveInFlightRef.current = false;

    window.scrollTo(0, 0);

    window.setTimeout(() => {
      setScrollProgress(0);
    }, 0);
  }, [id]);

  useEffect(() => {
    const loadChapter = async () => {
      if (!id) {
        setError("Kein Kapitel angegeben");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getChapter(id);
        setChapter(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Kapitel konnte nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadChapter();
  }, [id]);

  const getReaderMetrics = useCallback(() => {
    const contentElement = readerContentRef.current;

    if (!contentElement) return null;

    const rect = contentElement.getBoundingClientRect();
    const contentTop = rect.top + window.scrollY;
    const contentHeight = contentElement.offsetHeight;

    const startScroll = Math.max(0, contentTop - 120);
    const endScroll = Math.max(
      startScroll + 1,
      contentTop + contentHeight - window.innerHeight + 180
    );

    return {
      startScroll,
      endScroll,
      scrollRange: endScroll - startScroll,
    };
  }, []);

  const calculateReaderProgress = useCallback(() => {
    const metrics = getReaderMetrics();
    const scrollPosition = Math.max(0, Math.round(window.scrollY));

    let nextProgress = 0;

    if (metrics) {
      nextProgress = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((scrollPosition - metrics.startScroll) / metrics.scrollRange) * 100
          )
        )
      );
    } else {
      const documentElement = document.documentElement;
      const scrollHeight = documentElement.scrollHeight - window.innerHeight;

      nextProgress =
        scrollHeight <= 0
          ? 0
          : Math.min(
              100,
              Math.max(0, Math.round((scrollPosition / scrollHeight) * 100))
            );
    }

    latestProgressRef.current = nextProgress;
    latestScrollPositionRef.current = scrollPosition;

    setScrollProgress(nextProgress);
  }, [getReaderMetrics]);

const getScrollPositionForProgress = useCallback(
  (progressPercent: number, fallbackScrollPosition: number) => {
    const metrics = getReaderMetrics();

    if (!metrics) return fallbackScrollPosition;

    return Math.max(
      0,
      Math.round(
        metrics.startScroll + (metrics.scrollRange * progressPercent) / 100
      )
    );
  },
  [getReaderMetrics]
);

  const saveCurrentProgress = useCallback(
    async (force = false) => {
      if (!currentUser || !chapter) return;

      calculateReaderProgress();

      const progress = latestProgressRef.current;
      const scrollPosition = latestScrollPositionRef.current;

      if (!force && progress < 5) return;

      const now = Date.now();
      const savedProgress = savedProgressRef.current;

      const enoughTimePassed = now - lastSaveRef.current > 1500;
      const enoughProgressChanged = Math.abs(progress - savedProgress) >= 3;
      const reachedEnd =
        progress >= 95 &&
        savedProgress < 95 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;

      if (
        !force &&
        !reachedEnd &&
        (!enoughTimePassed || !enoughProgressChanged)
      ) {
        return;
      }

      if (saveInFlightRef.current) return;

      saveInFlightRef.current = true;
      lastSaveRef.current = now;

      try {
        await saveReadingProgress(
          chapter.work.slug,
          chapter.id,
          progress,
          scrollPosition
        );

        savedProgressRef.current = progress;
      } catch (err) {
        console.warn("Reading progress could not be saved", err);
      } finally {
        saveInFlightRef.current = false;
      }
    },
    [currentUser, chapter, calculateReaderProgress]
  );

  useEffect(() => {
    if (!chapter) return;

    let animationFrame: number | null = null;

    const scheduleProgressCalculation = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(calculateReaderProgress);
    };

    scheduleProgressCalculation();

    window.addEventListener("scroll", scheduleProgressCalculation, {
      passive: true,
    });
    window.addEventListener("resize", scheduleProgressCalculation);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", scheduleProgressCalculation);
      window.removeEventListener("resize", scheduleProgressCalculation);
    };
  }, [chapter, calculateReaderProgress]);

  useEffect(() => {
    if (!currentUser || !chapter) return;

    const timeoutId = window.setTimeout(() => {
      saveCurrentProgress(false);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentUser, chapter, scrollProgress, saveCurrentProgress]);

  useEffect(() => {
    if (!currentUser || !chapter) return;

    const handlePageHide = () => {
      saveCurrentProgress(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveCurrentProgress(true);
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      saveCurrentProgress(true);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser, chapter, saveCurrentProgress]);

  useEffect(() => {
    if (!chapter || restoredScrollRef.current) return;

    const progress = chapter.reading_progress;

    if (!progress) return;
    if (progress.last_chapter.id !== chapter.id) return;

    const hasSavedPosition =
      progress.progress_percent > 0 || progress.scroll_position > 0;

    if (!hasSavedPosition) return;

    restoredScrollRef.current = true;
    savedProgressRef.current = progress.progress_percent;
    latestProgressRef.current = progress.progress_percent;

    window.setTimeout(() => {
      const targetScrollPosition = getScrollPositionForProgress(
        progress.progress_percent,
        progress.scroll_position
      );

      window.scrollTo({
        top: targetScrollPosition,
        behavior: "smooth",
      });

      window.setTimeout(() => {
        calculateReaderProgress();
      }, 450);
    }, 450);
  }, [chapter, getScrollPositionForProgress, calculateReaderProgress]);

  const readerClassName = useMemo(() => {
    return [
      "reader-shell",
      `reader-theme-${readerSettings.theme}`,
      `reader-font-${readerSettings.font}`,
    ].join(" ");
  }, [readerSettings]);

  const togglePanel = (panel: Exclude<ReaderPanel, null>) => {
    setActivePanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  const updateSettings = (nextSettings: Partial<ReaderSettings>) => {
    setReaderSettings((currentSettings) => ({
      ...currentSettings,
      ...nextSettings,
    }));
  };

  if (loading) {
    return (
      <section className="card">
        <p>Lade Kapitel...</p>
      </section>
    );
  }

  if (error || !chapter) {
    return (
      <section className="card">
        <h2>Kapitel nicht gefunden</h2>
        <p>{error || "Dieses Kapitel existiert nicht."}</p>

        <div className="actions">
          <Link to="/" className="text-link">
            Zurück zur Startseite
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className={readerClassName}>
      <ReaderProgressBar progress={scrollProgress} />
      <ReaderTopBar chapter={chapter} />

      <main className="reader-main">
        <article
          ref={readerContentRef}
          className="reader-content"
          style={{ fontSize: `${readerSettings.fontSize}px` }}
        >
          {chapter.content ? (
            chapter.content.split(/\n{2,}/).map((paragraph, index) => (
              <p key={`${chapter.id}-${index}`}>{paragraph.trim()}</p>
            ))
          ) : (
            <p>Dieses Kapitel hat noch keinen Inhalt.</p>
          )}
        </article>

        <section className="reader-bottom-navigation">
          {chapter.previous_chapter ? (
            <Link
              to={`/chapters/${chapter.previous_chapter.id}`}
              className="chapter-nav-card"
            >
              <span>Vorheriges Kapitel</span>
              <strong>
                Kapitel {chapter.previous_chapter.chapter_number}:{" "}
                {chapter.previous_chapter.title || "Ohne Titel"}
              </strong>
            </Link>
          ) : (
            <div className="chapter-nav-card disabled">
              <span>Vorheriges Kapitel</span>
              <strong>Kein vorheriges Kapitel</strong>
            </div>
          )}

          {chapter.next_chapter ? (
            <Link
              to={`/chapters/${chapter.next_chapter.id}`}
              className="chapter-nav-card next"
            >
              <span>Nächstes Kapitel</span>
              <strong>
                Kapitel {chapter.next_chapter.chapter_number}:{" "}
                {chapter.next_chapter.title || "Ohne Titel"}
              </strong>
            </Link>
          ) : (
            <div className="chapter-nav-card disabled next">
              <span>Nächstes Kapitel</span>
              <strong>Kein nächstes Kapitel</strong>
            </div>
          )}
        </section>
      </main>

      <ReaderActionBar
        activePanel={activePanel}
        onTogglePanel={togglePanel}
      />

      <ReaderSidePanel
        activePanel={activePanel}
        chapter={chapter}
        currentUser={currentUser}
        readerSettings={readerSettings}
        onClose={() => setActivePanel(null)}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}

function ReaderProgressBar({ progress }: { progress: number }) {
  return (
    <div className="reader-progress-wrap">
      <div className="reader-progress-bar" style={{ width: `${progress}%` }} />

      <span>{progress}%</span>
    </div>
  );
}

function ReaderTopBar({ chapter }: { chapter: ChapterDetail }) {
  return (
    <header className="reader-topbar">
      <Link to="/" className="reader-logo">
        CF
      </Link>

      <div className="reader-title">
        <Link to={`/works/${chapter.work.slug}`}>{chapter.work.title}</Link>
        <span>/</span>
        <strong>
          Kapitel {chapter.chapter_number}: {chapter.title || "Ohne Titel"}
        </strong>
      </div>

      <Link to="/library" className="reader-topbar-link">
        Library
      </Link>
    </header>
  );
}

function ReaderActionBar({
  activePanel,
  onTogglePanel,
}: {
  activePanel: ReaderPanel;
  onTogglePanel: (panel: Exclude<ReaderPanel, null>) => void;
}) {
  return (
    <aside className="reader-action-bar">
      <button
        type="button"
        className={activePanel === "toc" ? "active" : ""}
        onClick={() => onTogglePanel("toc")}
        title="Kapitelliste"
      >
        ☰
      </button>

      <button
        type="button"
        className={activePanel === "settings" ? "active" : ""}
        onClick={() => onTogglePanel("settings")}
        title="Lesesettings"
      >
        ⚙
      </button>

      <button
        type="button"
        className={activePanel === "comments" ? "active" : ""}
        onClick={() => onTogglePanel("comments")}
        title="Kommentare"
      >
        💬
      </button>
    </aside>
  );
}

function ReaderSidePanel({
  activePanel,
  chapter,
  currentUser,
  readerSettings,
  onClose,
  onUpdateSettings,
}: {
  activePanel: ReaderPanel;
  chapter: ChapterDetail;
  currentUser: AuthUser | null;
  readerSettings: ReaderSettings;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
}) {
  return (
    <aside className={activePanel ? "reader-side-panel open" : "reader-side-panel"}>
      <button type="button" className="reader-panel-close" onClick={onClose}>
        ×
      </button>

      {activePanel === "toc" && <TableOfContentsPanel chapter={chapter} />}

      {activePanel === "settings" && (
        <ReaderSettingsPanel
          readerSettings={readerSettings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {activePanel === "comments" && (
        <ChapterCommentsPanel chapterId={chapter.id} currentUser={currentUser} />
      )}
    </aside>
  );
}

function TableOfContentsPanel({ chapter }: { chapter: ChapterDetail }) {
  return (
    <div className="reader-panel-content">
      <h2>Kapitelliste</h2>

      <p className="reader-panel-muted">{chapter.work.title}</p>

      <div className="reader-toc-list">
        {chapter.work.chapters.map((workChapter) => {
          const isCurrentChapter = workChapter.id === chapter.id;

          return (
            <Link
              key={workChapter.id}
              to={`/chapters/${workChapter.id}`}
              className={
                isCurrentChapter ? "reader-toc-item active" : "reader-toc-item"
              }
            >
              <span>{workChapter.chapter_number}</span>
              <strong>{workChapter.title || "Ohne Titel"}</strong>

              {workChapter.requires_subscription && <em>Abo</em>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ReaderSettingsPanel({
  readerSettings,
  onUpdateSettings,
}: {
  readerSettings: ReaderSettings;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
}) {
  return (
    <div className="reader-panel-content">
      <h2>Lesesettings</h2>

      <div className="reader-setting-group">
        <p>Hintergrund</p>

        <div className="reader-theme-options">
          <button
            type="button"
            className={readerSettings.theme === "light" ? "active light" : "light"}
            onClick={() => onUpdateSettings({ theme: "light" })}
          >
            ✓
          </button>

          <button
            type="button"
            className={readerSettings.theme === "sepia" ? "active sepia" : "sepia"}
            onClick={() => onUpdateSettings({ theme: "sepia" })}
          >
            ✓
          </button>

          <button
            type="button"
            className={readerSettings.theme === "dark" ? "active dark" : "dark"}
            onClick={() => onUpdateSettings({ theme: "dark" })}
          >
            ✓
          </button>
        </div>
      </div>

      <div className="reader-setting-group">
        <p>Schriftart</p>

        <div className="reader-font-options">
          <button
            type="button"
            className={readerSettings.font === "sans" ? "active" : ""}
            onClick={() => onUpdateSettings({ font: "sans" })}
          >
            Sans
          </button>

          <button
            type="button"
            className={readerSettings.font === "serif" ? "active" : ""}
            onClick={() => onUpdateSettings({ font: "serif" })}
          >
            Serif
          </button>
        </div>
      </div>

      <div className="reader-setting-group">
        <p>Schriftgröße</p>

        <div className="reader-size-control">
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                fontSize: Math.max(16, readerSettings.fontSize - 2),
              })
            }
          >
            A-
          </button>

          <strong>{readerSettings.fontSize}</strong>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                fontSize: Math.min(34, readerSettings.fontSize + 2),
              })
            }
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}

function ChapterCommentsPanel({
  chapterId,
  currentUser,
}: {
  chapterId: number;
  currentUser: AuthUser | null;
}) {
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentError, setCommentError] = useState("");
  const [replyingToComment, setReplyingToComment] =
    useState<ChapterComment | null>(null);
  const [commentSort, setCommentSort] = useState<"latest" | "popular">("latest");

  const loadComments = async () => {
    setLoadingComments(true);
    setCommentError("");

    try {
      const data = await getChapterComments(chapterId, commentSort);
      setComments(data.comments);
    } catch (err) {
      setCommentError(
        err instanceof Error
          ? err.message
          : "Kommentare konnten nicht geladen werden"
      );
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [chapterId, commentSort]);

  const handleCommentCreated = (comment: ChapterComment) => {
    if (replyingToComment) {
      setComments((currentComments) =>
        currentComments.map((item) =>
          item.id === replyingToComment.id
            ? {
                ...item,
                replies: [...item.replies, comment],
              }
            : item
        )
      );

      setReplyingToComment(null);
      return;
    }

    setComments((currentComments) => [comment, ...currentComments]);
  };

  const handleCommentUpdated = (updatedComment: ChapterComment) => {
    setComments((currentComments) =>
      currentComments.map((comment) => {
        if (comment.id === updatedComment.id) {
          return {
            ...comment,
            ...updatedComment,
            replies: comment.replies,
          };
        }

        return {
          ...comment,
          replies: comment.replies.map((reply) =>
            reply.id === updatedComment.id ? updatedComment : reply
          ),
        };
      })
    );
  };

  const handleCommentDeleted = (commentId: number) => {
    setComments((currentComments) =>
      currentComments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== commentId),
        }))
    );
  };

  const handleCommentLiked = (updatedComment: ChapterComment) => {
    handleCommentUpdated(updatedComment);
  };

  return (
    <div className="reader-panel-content">
      <div className="comments-panel-header">
        <h2>
          Kommentare <span>{comments.length}</span>
        </h2>

        <div className="comment-sort-tabs">
          <button
            type="button"
            className={commentSort === "latest" ? "active" : ""}
            onClick={() => setCommentSort("latest")}
          >
            Neueste
          </button>

          <button
            type="button"
            className={commentSort === "popular" ? "active" : ""}
            onClick={() => setCommentSort("popular")}
          >
            Beliebteste
          </button>
        </div>
      </div>

      <CommentForm
        chapterId={chapterId}
        currentUser={currentUser}
        replyingToComment={replyingToComment}
        onCancelReply={() => setReplyingToComment(null)}
        onCommentCreated={handleCommentCreated}
      />

      {loadingComments && (
        <div className="reader-comments-placeholder">
          <p>Lade Kommentare...</p>
        </div>
      )}

      {commentError && (
        <div className="reader-comments-error">
          <p>{commentError}</p>
        </div>
      )}

      {!loadingComments && !commentError && comments.length === 0 && (
        <div className="reader-comments-placeholder">
          <p>Noch keine Kommentare. Sei der Erste.</p>
        </div>
      )}

      {!loadingComments && !commentError && comments.length > 0 && (
        <div className="reader-comment-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              chapterId={chapterId}
              currentUser={currentUser}
              comment={comment}
              onReply={() => setReplyingToComment(comment)}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onCommentLiked={handleCommentLiked}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  chapterId,
  currentUser,
  replyingToComment,
  onCancelReply,
  onCommentCreated,
}: {
  chapterId: number;
  currentUser: AuthUser | null;
  replyingToComment: ChapterComment | null;
  onCancelReply: () => void;
  onCommentCreated: (comment: ChapterComment) => void;
}) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);
  const [formError, setFormError] = useState("");

  const handleMediaChange = (file: File | null) => {
    setMediaFile(file);

    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }

    setMediaPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setContent("");
    setMediaFile(null);

    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }

    setMediaPreviewUrl(null);
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setFormError("Bitte melde dich an, um zu kommentieren.");
      return;
    }

    if (!content.trim() && !mediaFile) {
      setFormError("Schreibe einen Kommentar oder hänge ein Bild/GIF an.");
      return;
    }

    setSavingComment(true);
    setFormError("");

    try {
      let mediaUrl: string | null = null;
      let mediaType: "image" | "gif" | null = null;

      if (mediaFile) {
        const uploadedMedia = await uploadMediaToCloudinary(
          mediaFile,
          "chapterflow/comment-media"
        );

        mediaUrl = uploadedMedia.secure_url;
        mediaType = mediaFile.type === "image/gif" ? "gif" : "image";
      }

      const result = await createChapterComment(chapterId, {
        content: content.trim(),
        parent_comment_id: replyingToComment?.id ?? null,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      onCommentCreated(result.comment);
      resetForm();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Kommentar konnte nicht erstellt werden"
      );
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <div className="reader-comment-form">
      {replyingToComment && (
        <div className="replying-to-box">
          <span>Antwort an {replyingToComment.user.username}</span>
          <button type="button" onClick={onCancelReply}>
            ×
          </button>
        </div>
      )}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={
          currentUser
            ? "Was denkst du über dieses Kapitel?"
            : "Einloggen zum Kommentieren"
        }
        disabled={!currentUser || savingComment}
        rows={3}
      />

      {mediaPreviewUrl && (
        <div className="comment-media-preview">
          <img src={mediaPreviewUrl} alt="Kommentar Anhang Vorschau" />

          <button type="button" onClick={() => handleMediaChange(null)}>
            Entfernen
          </button>
        </div>
      )}

      <div className="comment-form-actions">
        <label className="comment-upload-button">
          Bild/GIF
          <input
            type="file"
            accept="image/*,.gif"
            disabled={!currentUser || savingComment}
            onChange={(event) =>
              handleMediaChange(event.target.files?.[0] ?? null)
            }
          />
        </label>

        <button
          type="button"
          disabled={!currentUser || savingComment}
          onClick={handleSubmit}
        >
          {savingComment ? "Sendet..." : "Kommentieren"}
        </button>
      </div>

      {formError && <p className="comment-form-error">{formError}</p>}
    </div>
  );
}

function CommentItem({
  chapterId,
  currentUser,
  comment,
  onReply,
  onCommentUpdated,
  onCommentDeleted,
  onCommentLiked,
  isReply = false,
}: {
  chapterId: number;
  currentUser: AuthUser | null;
  comment: ChapterComment;
  onReply: () => void;
  onCommentUpdated: (comment: ChapterComment) => void;
  onCommentDeleted: (commentId: number) => void;
  onCommentLiked: (comment: ChapterComment) => void;
  isReply?: boolean;
}) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content ?? "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingLike, setSavingLike] = useState(false);
  const [commentError, setCommentError] = useState("");

  const hasReplies = comment.replies.length > 0;

  const handleSaveEdit = async () => {
    if (!editContent.trim() && !comment.media_url) {
      setCommentError("Kommentar darf nicht leer sein.");
      return;
    }

    setSavingEdit(true);
    setCommentError("");

    try {
      const result = await updateChapterComment(chapterId, comment.id, {
        content: editContent.trim(),
        media_url: comment.media_url,
        media_type: comment.media_type,
      });

      onCommentUpdated(result.comment);
      setEditing(false);
    } catch (err) {
      setCommentError(
        err instanceof Error
          ? err.message
          : "Kommentar konnte nicht gespeichert werden"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Kommentar wirklich löschen?");

    if (!confirmed) return;

    setCommentError("");

    try {
      await deleteChapterComment(chapterId, comment.id);
      onCommentDeleted(comment.id);
    } catch (err) {
      setCommentError(
        err instanceof Error
          ? err.message
          : "Kommentar konnte nicht gelöscht werden"
      );
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      setCommentError("Bitte melde dich an, um Kommentare zu liken.");
      return;
    }

    setSavingLike(true);
    setCommentError("");

    try {
      const result = comment.liked_by_current_user
        ? await unlikeChapterComment(chapterId, comment.id)
        : await likeChapterComment(chapterId, comment.id);

      onCommentLiked(result.comment);
    } catch (err) {
      setCommentError(
        err instanceof Error
          ? err.message
          : "Like konnte nicht gespeichert werden"
      );
    } finally {
      setSavingLike(false);
    }
  };

  return (
    <article className={isReply ? "reader-comment-item reply" : "reader-comment-item"}>
      <div className="comment-avatar">
        {comment.user.username.slice(0, 1).toUpperCase()}
      </div>

      <div className="comment-body">
        <div className="comment-header">
          <strong>{comment.user.username}</strong>
          <span>{formatRelativeDate(comment.created_at)}</span>
        </div>

        {editing ? (
          <div className="comment-edit-box">
            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows={3}
              disabled={savingEdit}
            />

            <div className="comment-edit-actions">
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
              >
                {savingEdit ? "Speichert..." : "Speichern"}
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={savingEdit}
                onClick={() => {
                  setEditing(false);
                  setEditContent(comment.content ?? "");
                  setCommentError("");
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <>
            {comment.content && <p>{comment.content}</p>}

            {comment.media_url && (
              <div className="comment-media">
                <img src={comment.media_url} alt="Kommentar Anhang" />
              </div>
            )}
          </>
        )}

        {commentError && <p className="comment-form-error">{commentError}</p>}

        <div className="comment-actions-line">
          <button
            type="button"
            className={
              comment.liked_by_current_user
                ? "comment-like-button active"
                : "comment-like-button"
            }
            disabled={savingLike}
            onClick={handleToggleLike}
          >
            ♥ {comment.likes_count}
          </button>

          {!isReply && (
            <button type="button" className="comment-reply-button" onClick={onReply}>
              Antworten
            </button>
          )}

          {comment.can_update && !editing && (
            <button
              type="button"
              className="comment-reply-button"
              onClick={() => setEditing(true)}
            >
              Bearbeiten
            </button>
          )}

          {comment.can_destroy && (
            <button
              type="button"
              className="comment-delete-button"
              onClick={handleDelete}
            >
              Löschen
            </button>
          )}

          {!isReply && hasReplies && (
            <button
              type="button"
              className="comment-toggle-replies-button"
              onClick={() => setRepliesOpen((current) => !current)}
            >
              {repliesOpen
                ? "Antworten ausblenden"
                : `${comment.replies.length} ${
                    comment.replies.length === 1 ? "Antwort" : "Antworten"
                  } anzeigen`}
            </button>
          )}
        </div>

        {!isReply && hasReplies && repliesOpen && (
          <div className="comment-replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                chapterId={chapterId}
                currentUser={currentUser}
                comment={reply}
                onReply={onReply}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
                onCommentLiked={onCommentLiked}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "gerade eben";
  if (diffMinutes < 60) return `${diffMinutes} Min.`;
  if (diffHours < 24) return `${diffHours} Std.`;
  if (diffDays < 30) return `${diffDays} Tg.`;

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function loadReaderSettings(): ReaderSettings {
  const rawSettings = localStorage.getItem(READER_SETTINGS_KEY);

  if (!rawSettings) return defaultReaderSettings;

  try {
    const parsedSettings = JSON.parse(rawSettings) as Partial<ReaderSettings>;

    return {
      theme: parsedSettings.theme ?? defaultReaderSettings.theme,
      font: parsedSettings.font ?? defaultReaderSettings.font,
      fontSize: parsedSettings.fontSize ?? defaultReaderSettings.fontSize,
    };
  } catch {
    return defaultReaderSettings;
  }
}

export default ChapterShowPage;
