import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import { getHomeData } from "../lib/home";
import type { GenreList, HomeResponse, HomeWork } from "../lib/home";

type HomePageProps = {
  currentUser: AuthUser | null;
};

type RatingTab = "month" | "year" | "all_time";

const ratingTabs: { key: RatingTab; label: string }[] = [
  { key: "month", label: "Top Monat" },
  { key: "year", label: "Top Jahr" },
  { key: "all_time", label: "All Time" },
];

function HomePage({ currentUser }: HomePageProps) {
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeRatingTab, setActiveRatingTab] = useState<RatingTab>("month");
  const [activeGenreId, setActiveGenreId] = useState<number | null>(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const data = await getHomeData();
        setHomeData(data);

        if (data.genre_lists.length > 0) {
          setActiveGenreId(data.genre_lists[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Home-Daten konnten nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const activeGenreList = useMemo(() => {
    if (!homeData || activeGenreId === null) return null;

    return (
      homeData.genre_lists.find((genreList) => genreList.id === activeGenreId) ??
      null
    );
  }, [homeData, activeGenreId]);

  return (
    <>
      <section className="home-hero">
        <div>
          <p className="eyebrow">Willkommen bei ChapterFlow</p>
          <h1>Entdecke deine nächste Geschichte</h1>
          <p>
            Finde neue Werke, beliebte Serien und top bewertete Bücher aus
            verschiedenen Genres.
          </p>
        </div>

        {currentUser ? (
          <div className="hero-user-pill">
            Eingeloggt als <strong>{currentUser.username}</strong>
          </div>
        ) : (
          <div className="hero-user-pill">Gastmodus</div>
        )}
      </section>

      {loading && (
        <section className="card">
          <p>Lade Home-Inhalte...</p>
        </section>
      )}

      {error && (
        <section className="card">
          <p>{error}</p>
        </section>
      )}

      {homeData && (
        <>
          <section className="home-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Ratings</p>
                <h2>Top bewertet</h2>
              </div>

              <div className="tab-list">
                {ratingTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={
                      activeRatingTab === tab.key
                        ? "tab-button active"
                        : "tab-button"
                    }
                    onClick={() => setActiveRatingTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <WorkRail works={homeData.rating_lists[activeRatingTab]} />
          </section>

          {homeData.genre_lists.length > 0 && (
            <section className="home-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Genres</p>
                  <h2>Nach Genre stöbern</h2>
                </div>

                <div className="tab-list">
                  {homeData.genre_lists.map((genreList) => (
                    <button
                      key={genreList.id}
                      type="button"
                      className={
                        activeGenreId === genreList.id
                          ? "tab-button active"
                          : "tab-button"
                      }
                      onClick={() => setActiveGenreId(genreList.id)}
                    >
                      {genreList.name}
                    </button>
                  ))}
                </div>
              </div>

              {activeGenreList && <GenreRail genreList={activeGenreList} />}
            </section>
          )}

          <section className="home-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Beliebt</p>
                <h2>Am meisten gesehen</h2>
              </div>
            </div>

            <WorkRail works={homeData.most_viewed} />
          </section>

          <section className="home-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Neu</p>
                <h2>Neu veröffentlicht</h2>
              </div>
            </div>

            <WorkRail works={homeData.new_releases} />
          </section>

          <section className="home-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Updates</p>
                <h2>Kürzlich aktualisiert</h2>
              </div>
            </div>

            <WorkRail works={homeData.recently_updated} />
          </section>
        </>
      )}
    </>
  );
}

function GenreRail({ genreList }: { genreList: GenreList }) {
  return <WorkRail works={genreList.works} />;
}

function WorkRail({ works }: { works: HomeWork[] }) {
  if (works.length === 0) {
    return (
      <div className="empty-state">
        <p>Noch keine Werke in dieser Liste.</p>
      </div>
    );
  }

  return (
    <div className="work-rail">
      {works.map((work) => (
        <WorkCard key={work.id} work={work} />
      ))}
    </div>
  );
}

function WorkCard({ work }: { work: HomeWork }) {
  const rating =
    work.period_rating_avg ?? work.rating_avg ?? null;

  const ratingCount =
    work.period_rating_count ?? work.rating_count ?? 0;

  return (
    <article className="work-card">
      <Link to={`/works/${work.slug}`} className="work-cover-link">
        {work.cover_picture ? (
          <img
            src={work.cover_picture}
            alt={`Cover von ${work.title}`}
            className="work-cover"
          />
        ) : (
          <div className="work-cover placeholder-cover">
            <span>{work.title.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </Link>

      <div className="work-card-body">
        <Link to={`/works/${work.slug}`} className="work-title">
          {work.title}
        </Link>

        <p className="work-author">von {work.author.username}</p>

        <div className="work-meta">
          <span>★ {formatRating(rating)}</span>
          <span>{ratingCount} Ratings</span>
        </div>

        <div className="work-meta">
          <span>{work.chapter_count} Kapitel</span>
          <span>{formatNumber(work.views_count)} Views</span>
        </div>

        {work.genres.length > 0 && (
          <div className="genre-pills">
            {work.genres.slice(0, 2).map((genre) => (
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

export default HomePage;
