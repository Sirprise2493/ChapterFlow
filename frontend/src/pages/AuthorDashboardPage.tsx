import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import { getAuthorDashboard } from "../lib/authorDashboard";
import type { AuthorDashboardResponse } from "../lib/authorDashboard";

type AuthorDashboardPageProps = {
  currentUser: AuthUser | null;
};

function AuthorDashboardPage({ currentUser }: AuthorDashboardPageProps) {
  const [dashboard, setDashboard] = useState<AuthorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const data = await getAuthorDashboard();
        setDashboard(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Author Dashboard konnte nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <section className="card">
        <p>Lade Author Dashboard...</p>
      </section>
    );
  }

  if (error || !dashboard) {
    return (
      <section className="card">
        <h2>Dashboard konnte nicht geladen werden</h2>
        <p>{error || "Unbekannter Fehler"}</p>
      </section>
    );
  }

  const { summary } = dashboard;

  return (
    <>
      <section className="home-hero author-dashboard-hero">
        <div>
          <p className="eyebrow">Author Dashboard</p>
          <h1>Earnings & Reads</h1>
          <p>
            Überblick über deine Werke, gelesene Abo-Kapitel und generierte
            Autor-Einnahmen.
          </p>
        </div>

        <div className="hero-user-pill">
          {summary.published_works} / {summary.total_works} veröffentlicht
        </div>
      </section>

      <section className="dashboard-stat-grid">
        <StatCard
          label="Pending Earnings"
          value={formatCentsDecimal(summary.pending_earnings_cents, summary.currency)}
        />

        <StatCard
          label="Paid Earnings"
          value={formatCentsDecimal(summary.paid_earnings_cents, summary.currency)}
        />

        <StatCard
          label="Total Earnings"
          value={formatCentsDecimal(summary.total_earnings_cents, summary.currency)}
        />

        <StatCard
          label="Abo Reads"
          value={summary.total_subscription_reads.toString()}
          subValue={`${summary.payout_reads} payout-relevant`}
        />
      </section>

      <section className="author-dashboard-layout">
        <article className="card dashboard-panel">
          <div className="section-header compact">
            <div>
              <p className="eyebrow">Top Werke</p>
              <h2>Nach Abo-Reads</h2>
            </div>

            <Link to="/author/works" className="text-link">
              Werke verwalten
            </Link>
          </div>

          {dashboard.top_works.length === 0 ? (
            <div className="empty-state">
              <p>Noch keine Abo-Reads für deine Werke.</p>
            </div>
          ) : (
            <div className="dashboard-work-list">
              {dashboard.top_works.map((work) => (
                <article key={work.id} className="dashboard-work-row">
                  <Link to={`/works/${work.slug}`} className="dashboard-work-cover">
                    {work.cover_picture ? (
                      <img src={work.cover_picture} alt={`Cover von ${work.title}`} />
                    ) : (
                      <div>{work.title.slice(0, 1).toUpperCase()}</div>
                    )}
                  </Link>

                  <div>
                    <Link to={`/works/${work.slug}`} className="dashboard-work-title">
                      {work.title}
                    </Link>

                    <p>
                      {work.reads_count} Reads · {work.views_count} Views · ★{" "}
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
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="card dashboard-panel">
          <div className="section-header compact">
            <div>
              <p className="eyebrow">Letzte Earnings</p>
              <h2>Einnahmen</h2>
            </div>
          </div>

          {dashboard.recent_earnings.length === 0 ? (
            <div className="empty-state">
              <p>Noch keine Earnings vorhanden.</p>
            </div>
          ) : (
            <div className="dashboard-event-list">
              {dashboard.recent_earnings.map((earning) => (
                <article key={earning.id} className="dashboard-event-row">
                  <div>
                    <strong>
                      {formatCentsDecimal(earning.amount_cents, earning.currency)}
                    </strong>
                    <p>
                      {earning.work.title} · Kapitel{" "}
                      {earning.chapter.chapter_number}
                    </p>
                    <span>
                      {earning.reader.username} · {formatDateTime(earning.created_at)}
                    </span>
                  </div>

                  <span className={`earning-status ${earning.status}`}>
                    {formatEarningStatus(earning.status)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="card dashboard-panel wide">
          <div className="section-header compact">
            <div>
              <p className="eyebrow">Letzte Reads</p>
              <h2>Gelesene Abo-Kapitel</h2>
            </div>
          </div>

          {dashboard.recent_reads.length === 0 ? (
            <div className="empty-state">
              <p>Noch keine Abo-Kapitel gelesen.</p>
            </div>
          ) : (
            <div className="dashboard-table">
              <div className="dashboard-table-header">
                <span>Werk</span>
                <span>Kapitel</span>
                <span>Reader</span>
                <span>Payout</span>
                <span>Zeit</span>
              </div>

              {dashboard.recent_reads.map((read) => (
                <div key={read.id} className="dashboard-table-row">
                  <Link to={`/works/${read.work.slug}`}>{read.work.title}</Link>
                  <span>
                    Kapitel {read.chapter.chapter_number}:{" "}
                    {read.chapter.title || "Ohne Titel"}
                  </span>
                  <span>{read.reader.username}</span>
                  <span>{read.counted_for_payout ? "Ja" : "Nein"}</span>
                  <span>{formatDateTime(read.read_at)}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <article className="dashboard-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {subValue && <p>{subValue}</p>}
    </article>
  );
}

function formatCentsDecimal(value: number | string, currency: string): string {
  const cents = typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(cents)) return "-";

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(cents / 100);
}

function formatRating(value: number | string | null): string {
  if (value === null || value === undefined) return "-";

  const numberValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numberValue)) return "-";

  return numberValue.toFixed(2);
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

function formatEarningStatus(value: string): string {
  switch (value) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "canceled":
      return "Canceled";
    default:
      return value;
  }
}

export default AuthorDashboardPage;
