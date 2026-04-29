import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import { getSubscription } from "../lib/subscription";
import type { ActiveSubscription } from "../lib/subscription";

type SubscriptionPageProps = {
  currentUser: AuthUser | null;
};

function SubscriptionPage({ currentUser }: SubscriptionPageProps) {
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubscription = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const data = await getSubscription();
        setSubscription(data.subscription);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Abo konnte nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [currentUser]);

  const usagePercent = useMemo(() => {
    if (!subscription || subscription.monthly_chapter_limit <= 0) return 0;

    return Math.min(
      100,
      Math.round(
        (subscription.chapters_read_current_period /
          subscription.monthly_chapter_limit) *
          100
      )
    );
  }, [subscription]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <section className="card">
        <p>Lade Abo...</p>
      </section>
    );
  }

  return (
    <>
      <section className="home-hero subscription-hero">
        <div>
          <p className="eyebrow">Mein Abo</p>
          <h1>Subscription</h1>
          <p>
            Hier siehst du deinen aktuellen Plan, dein Kapitel-Limit und wie
            viele Kapitel du in dieser Periode noch lesen kannst.
          </p>
        </div>

        <div className="hero-user-pill">
          {subscription ? "Aktiv" : "Kein aktives Abo"}
        </div>
      </section>

      {error && (
        <section className="card">
          <p>{error}</p>
        </section>
      )}

      {!error && !subscription && (
        <section className="subscription-empty card">
          <h2>Du hast aktuell kein aktives Abo</h2>
          <p>
            Mit einem Abo kannst du geschützte Kapitel lesen und Autoren über
            Kapitel-Payouts unterstützen.
          </p>

          <div className="actions">
            <Link to="/" className="text-link">
              Werke entdecken
            </Link>
          </div>
        </section>
      )}

      {subscription && (
        <section className="subscription-grid">
          <article className="subscription-card main">
            <p className="eyebrow">Aktueller Plan</p>
            <h2>{subscription.plan.name}</h2>

            <p className="subscription-price">
              {formatMoney(subscription.plan.price_cents, subscription.plan.currency)}
              <span> / {formatBillingPeriod(subscription.plan.billing_period)}</span>
            </p>

            <div className="subscription-meta-list">
              <div>
                <span>Status</span>
                <strong>{formatStatus(subscription.status)}</strong>
              </div>

              <div>
                <span>Gestartet</span>
                <strong>{formatDate(subscription.started_at)}</strong>
              </div>

              <div>
                <span>Autor-Anteil</span>
                <strong>{formatPercent(subscription.plan.author_payout_share)}</strong>
              </div>
            </div>
          </article>

          <article className="subscription-card">
            <p className="eyebrow">Kapitel-Limit</p>
            <h2>
              {subscription.remaining_chapters_current_period} Kapitel übrig
            </h2>

            <p className="subscription-muted">
              {subscription.chapters_read_current_period} von{" "}
              {subscription.monthly_chapter_limit} Kapiteln in dieser Periode gelesen.
            </p>

            <div className="usage-bar">
              <div style={{ width: `${usagePercent}%` }} />
            </div>

            <p className="subscription-muted">{usagePercent}% genutzt</p>
          </article>

          <article className="subscription-card">
            <p className="eyebrow">Aktuelle Periode</p>
            <h2>{formatDateRange(subscription.current_period_start, subscription.current_period_end)}</h2>

            <div className="subscription-meta-list">
              <div>
                <span>Start</span>
                <strong>{formatDate(subscription.current_period_start)}</strong>
              </div>

              <div>
                <span>Ende</span>
                <strong>{formatDate(subscription.current_period_end)}</strong>
              </div>

              <div>
                <span>Gezählte Reads</span>
                <strong>{subscription.period?.chapters_read_count ?? 0}</strong>
              </div>
            </div>
          </article>

          <article className="subscription-card">
            <p className="eyebrow">Payout</p>
            <h2>
              {subscription.period
                ? formatCentsDecimal(
                    subscription.period.per_chapter_payout_cents,
                    subscription.period.currency_snapshot
                  )
                : "-"}
            </h2>

            <p className="subscription-muted">
              Geschätzter Payout pro monetarisierbarem Abo-Kapitel in dieser
              Periode.
            </p>
          </article>
        </section>
      )}
    </>
  );
}

function formatMoney(priceCents: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
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

function formatPercent(value: number | string): string {
  const numberValue = typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numberValue)) return "-";

  return `${Math.round(numberValue * 100)}%`;
}

function formatBillingPeriod(value: string): string {
  switch (value) {
    case "monthly":
      return "Monat";
    case "yearly":
      return "Jahr";
    default:
      return value;
  }
}

function formatStatus(value: string): string {
  switch (value) {
    case "active":
      return "Aktiv";
    case "canceled":
      return "Gekündigt";
    case "expired":
      return "Abgelaufen";
    default:
      return value;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "-";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateRange(start: string | null, end: string | null): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export default SubscriptionPage;
