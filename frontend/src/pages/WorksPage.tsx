import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getGenres } from "../lib/authorWorks";
import { getWorks } from "../lib/works";
import type { AuthorGenre } from "../lib/authorWorks";
import type { HomeLikeWork, WorksIndexResponse } from "../lib/works";

const PER_PAGE = 12;

function WorksPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [genres, setGenres] = useState<AuthorGenre[]>([]);
  const [worksData, setWorksData] = useState<WorksIndexResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [genreId, setGenreId] = useState(searchParams.get("genre_id") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest");
  const [minChapters, setMinChapters] = useState(
    searchParams.get("min_chapters") ?? ""
  );

  const page = Number(searchParams.get("page") ?? "1") || 1;

  const totalPages = useMemo(() => {
    if (!worksData) return 1;

    return Math.max(1, Math.ceil(worksData.total_count / worksData.per_page));
  }, [worksData]);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await getGenres();
        setGenres(data.genres);
      } catch {
        // Genre-Filter darf die Seite nicht komplett kaputt machen.
      }
    };

    loadGenres();
  }, []);

  useEffect(() => {
    const loadWorks = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getWorks({
          q: searchParams.get("q") ?? undefined,
          genre_id: searchParams.get("genre_id") ?? undefined,
          status: searchParams.get("status") ?? undefined,
          sort: searchParams.get("sort") ?? "latest",
          min_chapters: searchParams.get("min_chapters") ?? undefined,
          page,
          per_page: PER_PAGE,
        });

        setWorksData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Werke konnten nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadWorks();
  }, [searchParams, page]);

  const updateParams = (nextPage = 1) => {
    const nextParams = new URLSearchParams();

    if (q.trim()) nextParams.set("q", q.trim());
    if (genreId) nextParams.set("genre_id", genreId);
    if (status) nextParams.set("status", status);
    if (sort && sort !== "latest") nextParams.set("sort", sort);
    if (minChapters) nextParams.set("min_chapters", minChapters);
    if (nextPage > 1) nextParams.set("page", String(nextPage));

    setSearchParams(nextParams);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams(1);
  };

  const handleReset = () => {
    setQ("");
    setGenreId("");
    setStatus("");
    setSort("latest");
    setMinChapters("");
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

  return (
    <>
      <section className="home-hero works-hero">
        <div>
          <p className="eyebrow">Browse</p>
          <h1>Werke entdecken</h1>
          <p>
            Suche nach Geschichten, filtere nach Genres und finde neue Serien
            zum Lesen.
          </p>
        </div>

        <div className="hero-user-pill">
          {worksData ? `${worksData.total_count} Werke` : "Lädt..."}
        </div>
      </section>

      <section className="works-layout">
        <aside className="works-filter-card card">
          <h2>Filter</h2>

          <form className="works-filter-form" onSubmit={handleSubmit}>
            <label>
              Suche
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Titel oder Beschreibung"
              />
            </label>

            <label>
              Genre
              <select
                value={genreId}
                onChange={(event) => setGenreId(event.target.value)}
              >
                <option value="">Alle Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Alle Status</option>
                <option value="ongoing">Läuft</option>
                <option value="completed">Abgeschlossen</option>
              </select>
            </label>

            <label>
              Sortierung
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="latest">Neueste</option>
                <option value="best_rated">Beste Bewertung</option>
                <option value="bestsellers">Meiste Views</option>
              </select>
            </label>

            <label>
              Mindestkapitel
              <input
                type="number"
                min={0}
                value={minChapters}
                onChange={(event) => setMinChapters(event.target.value)}
                placeholder="z. B. 10"
              />
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

        <section className="works-results">
          {error && (
            <section className="card">
              <p>{error}</p>
            </section>
          )}

          {loading && (
            <section className="card">
              <p>Lade Werke...</p>
            </section>
          )}

          {!loading && !error && worksData && worksData.works.length === 0 && (
            <section className="empty-state">
              <p>Keine Werke gefunden.</p>
            </section>
          )}

          {!loading && !error && worksData && worksData.works.length > 0 && (
            <>
              <div className="works-result-header">
                <p>
                  Zeige Seite {worksData.page} von {totalPages}
                </p>
              </div>

              <div className="works-grid">
                {worksData.works.map((work) => (
                  <BrowseWorkCard key={work.id} work={work} />
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

function BrowseWorkCard({ work }: { work: HomeLikeWork }) {
  return (
    <article className="browse-work-card">
      <Link to={`/works/${work.slug}`} className="browse-work-cover-link">
        {work.cover_picture ? (
          <img
            src={work.cover_picture}
            alt={`Cover von ${work.title}`}
            className="browse-work-cover"
          />
        ) : (
          <div className="browse-work-cover placeholder-cover">
            <span>{work.title.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </Link>

      <div className="browse-work-body">
        <div className="browse-work-badges">
          <span>{formatStatus(work.status)}</span>
          <span>{formatAccessLevel(work.access_level)}</span>
        </div>

        <Link to={`/works/${work.slug}`} className="browse-work-title">
          {work.title}
        </Link>

        <p className="work-author">von {work.author.username}</p>

        {work.description && (
          <p className="browse-work-description">{work.description}</p>
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
    default:
      return accessLevel;
  }
}

export default WorksPage;
