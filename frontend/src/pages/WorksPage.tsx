import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getGenres } from "../lib/authorWorks";
import { getWorks } from "../lib/works";
import type { AuthorGenre } from "../lib/authorWorks";
import type { HomeLikeWork, WorksIndexResponse } from "../lib/works";

const DEFAULT_PER_PAGE = 12;

const WORD_FILTERS = [
  { label: "Alle Wortanzahlen", value: "" },
  { label: "> 10.000 Wörter", value: "10000" },
  { label: "> 50.000 Wörter", value: "50000" },
  { label: "> 100.000 Wörter", value: "100000" },
  { label: "> 300.000 Wörter", value: "300000" },
  { label: "> 500.000 Wörter", value: "500000" },
  { label: "> 1.000.000 Wörter", value: "1000000" },
];

function parseGenreIds(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function WorksPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [genres, setGenres] = useState<AuthorGenre[]>([]);
  const [worksData, setWorksData] = useState<WorksIndexResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(
    Boolean(
      searchParams.get("genre_ids") ||
        searchParams.get("genre_id") ||
        searchParams.get("status") ||
        searchParams.get("min_chapters") ||
        searchParams.get("min_words") ||
        searchParams.get("per_page")
    )
  );

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(() => {
    const genreIds = parseGenreIds(searchParams.get("genre_ids"));
    const legacyGenreId = parseGenreIds(searchParams.get("genre_id"));

    return genreIds.length > 0 ? genreIds : legacyGenreId;
  });
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest");
  const [minChapters, setMinChapters] = useState(
    searchParams.get("min_chapters") ?? ""
  );
  const [minWords, setMinWords] = useState(searchParams.get("min_words") ?? "");
  const [perPage, setPerPage] = useState(
    Number(searchParams.get("per_page") ?? DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE
  );

  const page = Number(searchParams.get("page") ?? "1") || 1;

  const selectedGenreNames = useMemo(() => {
    return genres
      .filter((genre) => selectedGenreIds.includes(String(genre.id)))
      .map((genre) => toText(genre.name));
  }, [genres, selectedGenreIds]);

  const totalPages = useMemo(() => {
    if (!worksData) return 1;
    return Math.max(1, Math.ceil(worksData.total_count / worksData.per_page));
  }, [worksData]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    for (let currentPage = start; currentPage <= end; currentPage += 1) {
      pages.push(currentPage);
    }

    return pages;
  }, [page, totalPages]);

  useEffect(() => {
    const hasBrokenGenreObjectParams = Array.from(searchParams.keys()).some(
      (key) => key.startsWith("genre_ids[")
    );

    if (!hasBrokenGenreObjectParams) return;

    const fixedParams = new URLSearchParams(searchParams);

    Array.from(fixedParams.keys()).forEach((key) => {
      if (key.startsWith("genre_ids[")) {
        fixedParams.delete(key);
      }
    });

    fixedParams.delete("page");
    setSearchParams(fixedParams, { replace: true });
  }, [searchParams, setSearchParams]);

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
          genre_ids:
            searchParams.get("genre_ids") ??
            searchParams.get("genre_id") ??
            undefined,
          status: searchParams.get("status") ?? undefined,
          sort: searchParams.get("sort") ?? "latest",
          min_chapters: searchParams.get("min_chapters") ?? undefined,
          min_words: searchParams.get("min_words") ?? undefined,
          page,
          per_page:
            Number(searchParams.get("per_page") ?? DEFAULT_PER_PAGE) ||
            DEFAULT_PER_PAGE,
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

  const toggleGenreId = (genreId: number) => {
    const id = String(genreId);

    setSelectedGenreIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id]
    );
  };

  const updateParams = (nextPage = 1) => {
    const nextParams = new URLSearchParams();

    if (q.trim()) nextParams.set("q", q.trim());
    if (selectedGenreIds.length > 0) {
      nextParams.set("genre_ids", selectedGenreIds.join(","));
    }
    if (status) nextParams.set("status", status);
    if (sort && sort !== "latest") nextParams.set("sort", sort);
    if (minChapters) nextParams.set("min_chapters", minChapters);
    if (minWords) nextParams.set("min_words", minWords);
    if (perPage !== DEFAULT_PER_PAGE) nextParams.set("per_page", String(perPage));
    if (nextPage > 1) nextParams.set("page", String(nextPage));

    setSearchParams(nextParams);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams(1);
  };

  const handleReset = () => {
    setQ("");
    setSelectedGenreIds([]);
    setStatus("");
    setSort("latest");
    setMinChapters("");
    setMinWords("");
    setPerPage(DEFAULT_PER_PAGE);
    setShowAdvancedSearch(false);
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

  const setGenreFilter = (nextGenreId: number) => {
    const id = String(nextGenreId);

    setSelectedGenreIds([id]);
    setShowAdvancedSearch(true);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("genre_id");
    nextParams.set("genre_ids", id);
    nextParams.delete("page");

    setSearchParams(nextParams);
  };

  const clearSingleFilter = (filterName: string) => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete(filterName);
    nextParams.delete("page");

    if (filterName === "q") setQ("");
    if (filterName === "genre_ids" || filterName === "genre_id") {
      nextParams.delete("genre_ids");
      nextParams.delete("genre_id");
      setSelectedGenreIds([]);
    }
    if (filterName === "status") setStatus("");
    if (filterName === "sort") setSort("latest");
    if (filterName === "min_chapters") setMinChapters("");
    if (filterName === "min_words") setMinWords("");
    if (filterName === "per_page") setPerPage(DEFAULT_PER_PAGE);

    const hasAdvancedFiltersAfterClear =
      nextParams.has("genre_ids") ||
      nextParams.has("genre_id") ||
      nextParams.has("status") ||
      nextParams.has("min_chapters") ||
      nextParams.has("min_words") ||
      nextParams.has("per_page");

    setShowAdvancedSearch(hasAdvancedFiltersAfterClear);
    setSearchParams(nextParams);
  };

  const hasActiveFilters =
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("genre_ids")) ||
    Boolean(searchParams.get("genre_id")) ||
    Boolean(searchParams.get("status")) ||
    Boolean(searchParams.get("sort")) ||
    Boolean(searchParams.get("min_chapters")) ||
    Boolean(searchParams.get("min_words")) ||
    Boolean(searchParams.get("per_page"));

  return (
    <>
      <section className="home-hero works-hero">
        <div>
          <p className="eyebrow">Browse</p>
          <h1>Werke entdecken</h1>
          <p>
            Suche nach Geschichten, filtere gezielt und finde neue Serien zum
            Lesen.
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
              Sortierung
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="latest">Neueste</option>
                <option value="best_rated">Beste Bewertung</option>
                <option value="bestsellers">Meiste Views</option>
                <option value="most_chapters">Meiste Kapitel</option>
                <option value="most_words">Meiste Wörter</option>
                <option value="title_asc">Titel A–Z</option>
              </select>
            </label>

            {showAdvancedSearch && (
              <div className="advanced-search-box">
                <div className="works-filter-group">
                  <strong>Genres kombinieren</strong>

                  <div className="genre-checkbox-grid browse-genre-filter">
                    {genres.map((genre) => {
                      const genreId = String(genre.id);

                      return (
                        <label key={genre.id} className="genre-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedGenreIds.includes(genreId)}
                            onChange={() => toggleGenreId(genre.id)}
                          />
                          {toText(genre.name)}
                        </label>
                      );
                    })}
                  </div>

                  {selectedGenreIds.length > 1 && (
                    <p className="filter-hint">
                      Es werden nur Werke angezeigt, die alle ausgewählten Genres enthalten.
                    </p>
                  )}
                </div>

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
                  Mindestkapitel
                  <input
                    type="number"
                    min={0}
                    value={minChapters}
                    onChange={(event) => setMinChapters(event.target.value)}
                    placeholder="z. B. 10"
                  />
                </label>

                <label>
                  Mindestwortanzahl
                  <select
                    value={minWords}
                    onChange={(event) => setMinWords(event.target.value)}
                  >
                    {WORD_FILTERS.map((filter) => (
                      <option key={filter.value || "all"} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Werke pro Seite
                  <select
                    value={perPage}
                    onChange={(event) => setPerPage(Number(event.target.value))}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleReset}
                >
                  Alle Filter zurücksetzen
                </button>
              </div>
            )}

            <div className="works-filter-actions">
              <button type="submit">Suchen</button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setShowAdvancedSearch((currentValue) => !currentValue)
                }
              >
                {showAdvancedSearch
                  ? "Erweiterte Suche schließen"
                  : "Erweiterte Suche"}
              </button>
            </div>
          </form>
        </aside>

        <section className="works-results">
          {hasActiveFilters && (
            <div className="active-filter-bar">
              <strong>Aktive Filter:</strong>

              {searchParams.get("q") && (
                <button type="button" onClick={() => clearSingleFilter("q")}>
                  Suche: {toText(searchParams.get("q"))} ×
                </button>
              )}

              {selectedGenreNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearSingleFilter("genre_ids")}
                >
                  Genres: {selectedGenreNames.join(", ")} ×
                </button>
              )}

              {searchParams.get("status") && (
                <button
                  type="button"
                  onClick={() => clearSingleFilter("status")}
                >
                  Status: {formatStatus(searchParams.get("status") || "")} ×
                </button>
              )}

              {searchParams.get("sort") && (
                <button type="button" onClick={() => clearSingleFilter("sort")}>
                  Sortierung: {formatSort(searchParams.get("sort") || "")} ×
                </button>
              )}

              {searchParams.get("min_chapters") && (
                <button
                  type="button"
                  onClick={() => clearSingleFilter("min_chapters")}
                >
                  Min. Kapitel: {searchParams.get("min_chapters")} ×
                </button>
              )}

              {searchParams.get("min_words") && (
                <button
                  type="button"
                  onClick={() => clearSingleFilter("min_words")}
                >
                  Min. Wörter:{" "}
                  {formatNumber(Number(searchParams.get("min_words")))} ×
                </button>
              )}

              {searchParams.get("per_page") && (
                <button
                  type="button"
                  onClick={() => clearSingleFilter("per_page")}
                >
                  Pro Seite: {searchParams.get("per_page")} ×
                </button>
              )}
            </div>
          )}

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
                  Zeige Seite {worksData.page} von {totalPages} ·{" "}
                  {worksData.total_count} Ergebnisse
                </p>
              </div>

              <div className="works-grid">
                {worksData.works.map((work) => (
                  <BrowseWorkCard
                    key={work.id}
                    work={work}
                    onGenreClick={setGenreFilter}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination enhanced-pagination">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                  >
                    Zurück
                  </button>

                  {page > 3 && (
                    <>
                      <button
                        type="button"
                        className="pagination-number"
                        onClick={() => goToPage(1)}
                      >
                        1
                      </button>

                      <span>...</span>
                    </>
                  )}

                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={
                        pageNumber === page
                          ? "pagination-number active"
                          : "pagination-number"
                      }
                      onClick={() => goToPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  {page < totalPages - 2 && (
                    <>
                      <span>...</span>

                      <button
                        type="button"
                        className="pagination-number"
                        onClick={() => goToPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                  >
                    Weiter
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </>
  );
}

function BrowseWorkCard({
  work,
  onGenreClick,
}: {
  work: HomeLikeWork;
  onGenreClick: (genreId: number) => void;
}) {
  return (
    <article className="browse-work-card">
      <Link to={`/works/${work.slug}`} className="browse-work-cover-link">
        {work.cover_picture ? (
          <img
            src={work.cover_picture}
            alt={`Cover von ${toText(work.title)}`}
            className="browse-work-cover"
          />
        ) : (
          <div className="browse-work-cover placeholder-cover">
            <span>{toText(work.title).slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </Link>

      <div className="browse-work-body">
        <div className="browse-work-badges">
          <span>{formatStatus(work.status)}</span>
          <span>{formatAccessLevel(work.access_level)}</span>
        </div>

        <Link to={`/works/${work.slug}`} className="browse-work-title">
          {toText(work.title)}
        </Link>

        <p className="work-author">von {toText(work.author.username)}</p>

        {work.description && (
          <p className="browse-work-description">{toText(work.description)}</p>
        )}

        <div className="work-meta">
          <span>★ {formatRating(work.rating_avg)}</span>
          <span>{work.rating_count} Ratings</span>
        </div>

        <div className="work-meta">
          <span>{work.chapter_count} Kapitel</span>
          <span>{formatNumber(work.views_count)} Views</span>
        </div>

        <div className="work-meta">
          <span>{formatNumber(work.word_count ?? 0)} Wörter</span>
        </div>

        {work.genres.length > 0 && (
          <div className="genre-pills clickable">
            {work.genres.slice(0, 4).map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => onGenreClick(genre.id)}
              >
                {toText(genre.name)}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Ja" : "Nein";

  return "";
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
      return toText(status);
  }
}

function formatAccessLevel(accessLevel: string): string {
  switch (accessLevel) {
    case "free_access":
      return "Kostenlos";
    case "subscription_only":
      return "Abo";
    default:
      return toText(accessLevel);
  }
}

function formatSort(sort: string): string {
  switch (sort) {
    case "best_rated":
      return "Beste Bewertung";
    case "bestsellers":
      return "Meiste Views";
    case "most_chapters":
      return "Meiste Kapitel";
    case "most_words":
      return "Meiste Wörter";
    case "title_asc":
      return "Titel A–Z";
    case "latest":
      return "Neueste";
    default:
      return toText(sort);
  }
}

export default WorksPage;
