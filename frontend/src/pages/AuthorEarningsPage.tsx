import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import { getAuthorEarnings } from "../lib/authorEarnings";
import type { AuthorEarningsResponse } from "../lib/authorEarnings";

const PER_PAGE = 20;

type AuthorEarningsPageProps = {
  currentUser: AuthUser | null;
};

function AuthorEarningsPage({ currentUser }: AuthorEarningsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<AuthorEarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [workId, setWorkId] = useState(searchParams.get("work_id") ?? "");

  const page = Number(searchParams.get("page") ?? "1") || 1;

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total_count / data.per_page));
  }, [data]);

  useEffect(() => {
    const loadEarnings = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await getAuthorEarnings({
          status: searchParams.get("status") ?? undefined,
          work_id: searchParams.get("work_id") ?? undefined,
          page,
          per_page: PER_PAGE,
        });

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Earnings konnten nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, [currentUser, searchParams, page]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const updateParams = (nextPage = 1) => {
    const nextParams = new URLSearchParams();

    if (status) nextParams.set("status", status);
    if (workId) nextParams.set("work_id", workId);
    if (nextPage > 1) nextParams.set("page", String(nextPage));

    setSearchParams(nextParams);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams(1);
  };

  const handleReset = () => {
    setStatus("");
    setWorkId("");
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
      <section className="home-hero author-earnings-hero">
        <div>
          <p className="eyebrow">Author Earnings</p>
          <h1>Einnahmen</h1>
          <p>
            Prüfe deine Kapitel-Payouts, filtere nach Werk oder Status und
            behalte offene Earnings im Blick.
          </p>
        </div>

        <div className="hero-user-pill">
          {data ? `${data.total_count} Einträge` : "Lädt..."}
        </div>
      </section>

      <section className="earnings-summary-grid">
        <article className="dashboard-stat-card">
          <span>Gefilterte Summe</span>
          <strong>
            {data ? formatCentsDecimal(data.total_amount_cents, data.currency) : "-"}
          </strong>
        </article>

        <article className="dashboard-stat-card">
          <span>Einträge</span>
          <strong>{data ? data.total_count.toString() : "-"}</strong>
        </article>

        <article className="dashboard-stat-card">
          <span>Seite</span>
          <strong>
            {data ? `${data.page} / ${totalPages}` : "-"}
          </strong>
        </article>
      </section>

      <section className="earnings-layout">
        <aside className="earnings-filter-card card">
          <h2>Filter</h2>

          <form className="works-filter-form" onSubmit={handleSubmit}>
            <label>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Alle Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </label>

            <label>
              Werk
              <select
                value={workId}
                onChange={(event) => setWorkId(event.target.value)}
              >
                <option value="">Alle Werke</option>
                {data?.works.map((work) => (
                  <option key={work.id} value={work.id}>
                    {work.title}
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

        <section className="earnings-results">
          {error && (
            <section className="card">
              <p>{error}</p>
            </section>
          )}

          {loading && (
            <section className="card">
              <p>Lade Earnings...</p>
            </section>
          )}

          {!loading && !error && data && data.earnings.length === 0 && (
            <section className="empty-state">
              <p>Keine Earnings gefunden.</p>
            </section>
          )}

          {!loading && !error && data && data.earnings.length > 0 && (
            <>
              <div className="earnings-table">
                <div className="earnings-table-header">
                  <span>Betrag</span>
                  <span>Status</span>
                  <span>Werk</span>
                  <span>Kapitel</span>
                  <span>Reader</span>
                  <span>Datum</span>
                </div>

                {data.earnings.map((earning) => (
                  <div key={earning.id} className="earnings-table-row">
                    <strong>
                      {formatCentsDecimal(earning.amount_cents, earning.currency)}
                    </strong>

                    <span className={`earning-status ${earning.status}`}>
                      {formatStatus(earning.status)}
                    </span>

                    <Link to={`/works/${earning.work.slug}`}>
                      {earning.work.title}
                    </Link>

                    <span>
                      Kapitel {earning.chapter.chapter_number}
                      {earning.chapter.title
                        ? `: ${earning.chapter.title}`
                        : ""}
                    </span>

                    <span>{earning.reader.username}</span>

                    <span>{formatDateTime(earning.created_at)}</span>
                  </div>
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

function formatStatus(value: string): string {
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default AuthorEarningsPage;
