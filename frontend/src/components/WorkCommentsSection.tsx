import { useEffect, useState } from "react";
import type { AuthUser } from "../lib/auth";
import { uploadMediaToCloudinary } from "../lib/cloudinary";
import {
  createWorkComment,
  deleteWorkComment,
  getWorkComments,
  likeWorkComment,
  unlikeWorkComment,
  updateWorkComment,
} from "../lib/workComments";
import type { WorkComment } from "../lib/workComments";

type WorkCommentsSectionProps = {
  workSlug: string;
  currentUser: AuthUser | null;
};

function WorkCommentsSection({
  workSlug,
  currentUser,
}: WorkCommentsSectionProps) {
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyingToComment, setReplyingToComment] =
    useState<WorkComment | null>(null);
  const [sort, setSort] = useState<"latest" | "popular">("latest");

  const loadComments = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getWorkComments(workSlug, sort);
      setComments(data.comments);
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

  useEffect(() => {
    loadComments();
  }, [workSlug, sort]);

  const handleCommentCreated = (comment: WorkComment) => {
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

  const handleCommentUpdated = (updatedComment: WorkComment) => {
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

  return (
    <section className="work-comments-section">
      <div className="section-header">
        <div>
          <h2>Kommentare zum Werk</h2>
          <p className="section-subtitle">
            Allgemeine Diskussionen, Fragen und Eindrücke zu diesem Werk.
          </p>
        </div>

        <div className="comment-sort-tabs">
          <button
            type="button"
            className={sort === "latest" ? "active" : ""}
            onClick={() => setSort("latest")}
          >
            Neueste
          </button>

          <button
            type="button"
            className={sort === "popular" ? "active" : ""}
            onClick={() => setSort("popular")}
          >
            Beliebteste
          </button>
        </div>
      </div>

      <WorkCommentForm
        workSlug={workSlug}
        currentUser={currentUser}
        replyingToComment={replyingToComment}
        onCancelReply={() => setReplyingToComment(null)}
        onCommentCreated={handleCommentCreated}
      />

      {loading && (
        <div className="empty-state">
          <p>Lade Kommentare...</p>
        </div>
      )}

      {error && (
        <div className="feedback error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && comments.length === 0 && (
        <div className="empty-state">
          <p>Noch keine Kommentare zu diesem Werk.</p>
        </div>
      )}

      {!loading && !error && comments.length > 0 && (
        <div className="work-comment-list">
          {comments.map((comment) => (
            <WorkCommentItem
              key={comment.id}
              workSlug={workSlug}
              currentUser={currentUser}
              comment={comment}
              onReply={() => setReplyingToComment(comment)}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function WorkCommentForm({
  workSlug,
  currentUser,
  replyingToComment,
  onCancelReply,
  onCommentCreated,
}: {
  workSlug: string;
  currentUser: AuthUser | null;
  replyingToComment: WorkComment | null;
  onCancelReply: () => void;
  onCommentCreated: (comment: WorkComment) => void;
}) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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

    setSaving(true);
    setFormError("");

    try {
      let mediaUrl: string | null = null;
      let mediaType: "image" | "gif" | null = null;

      if (mediaFile) {
        const uploadedMedia = await uploadMediaToCloudinary(
          mediaFile,
          "chapterflow/work-comments"
        );

        mediaUrl = uploadedMedia.secure_url;
        mediaType = mediaFile.type === "image/gif" ? "gif" : "image";
      }

      const result = await createWorkComment(workSlug, {
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
      setSaving(false);
    }
  };

  return (
    <div className="work-comment-form">
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
            ? "Was denkst du über dieses Werk?"
            : "Einloggen zum Kommentieren"
        }
        disabled={!currentUser || saving}
        rows={4}
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
            disabled={!currentUser || saving}
            onChange={(event) =>
              handleMediaChange(event.target.files?.[0] ?? null)
            }
          />
        </label>

        <button type="button" disabled={!currentUser || saving} onClick={handleSubmit}>
          {saving ? "Sendet..." : "Kommentieren"}
        </button>
      </div>

      {formError && <p className="comment-form-error">{formError}</p>}
    </div>
  );
}

function WorkCommentItem({
  workSlug,
  currentUser,
  comment,
  onReply,
  onCommentUpdated,
  onCommentDeleted,
  isReply = false,
}: {
  workSlug: string;
  currentUser: AuthUser | null;
  comment: WorkComment;
  onReply: () => void;
  onCommentUpdated: (comment: WorkComment) => void;
  onCommentDeleted: (commentId: number) => void;
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
      const result = await updateWorkComment(workSlug, comment.id, {
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
      await deleteWorkComment(workSlug, comment.id);
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
        ? await unlikeWorkComment(workSlug, comment.id)
        : await likeWorkComment(workSlug, comment.id);

      onCommentUpdated(result.comment);
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "Like konnte nicht gespeichert werden"
      );
    } finally {
      setSavingLike(false);
    }
  };

  return (
    <article className={isReply ? "work-comment-item reply" : "work-comment-item"}>
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
              <button type="button" disabled={savingEdit} onClick={handleSaveEdit}>
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
              <WorkCommentItem
                key={reply.id}
                workSlug={workSlug}
                currentUser={currentUser}
                comment={reply}
                onReply={onReply}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
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

export default WorkCommentsSection;
