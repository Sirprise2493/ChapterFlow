import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getChapter, saveReadingProgress } from "../lib/chapters";
import type { ChapterDetail } from "../lib/chapters";
import type { AuthUser } from "../lib/auth";

type ChapterShowPageProps = {
  currentUser: AuthUser | null;
};

function ChapterShowPage({ currentUser }: ChapterShowPageProps) {
  const { id } = useParams<{ id: string }>();

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadChapter = async () => {
      if (!id) {
        setError("Kein Kapitel angegeben");
        setLoading(false);
        return;
      }

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

  useEffect(() => {
    if (!currentUser || !chapter) return;

    const saveProgress = async () => {
      try {
        await saveReadingProgress(chapter.work.slug, chapter.id);
        console.log("Reading progress saved");
      } catch (err) {
        console.warn("Reading progress could not be saved", err);
      }
    };

    saveProgress();
  }, [currentUser, chapter]);

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
    <>
      <section className="chapter-show-header">
        <div>
          <Link to={`/works/${chapter.work.slug}`} className="chapter-back-link">
            ← Zurück zu {chapter.work.title}
          </Link>

          <p className="eyebrow">Kapitel {chapter.chapter_number}</p>

          <h1>{chapter.title || "Ohne Titel"}</h1>

          <p className="chapter-work-meta">
            aus{" "}
            <Link to={`/works/${chapter.work.slug}`}>
              {chapter.work.title}
            </Link>{" "}
            von <strong>{chapter.work.author.username}</strong>
          </p>
        </div>

        <Link to={`/works/${chapter.work.slug}`} className="chapter-mini-cover">
          {chapter.work.cover_picture ? (
            <img
              src={chapter.work.cover_picture}
              alt={`Cover von ${chapter.work.title}`}
            />
          ) : (
            <div className="chapter-mini-placeholder">
              {chapter.work.title.slice(0, 1).toUpperCase()}
            </div>
          )}
        </Link>
      </section>

      <section className="chapter-reader">
        {chapter.content ? (
          chapter.content
            .split(/\n{2,}/)
            .map((paragraph, index) => (
              <p key={`${chapter.id}-${index}`}>{paragraph.trim()}</p>
            ))
        ) : (
          <p>Dieses Kapitel hat noch keinen Inhalt.</p>
        )}
      </section>

      <section className="chapter-navigation">
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
    </>
  );
}

export default ChapterShowPage;
