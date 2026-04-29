class Api::V1::Author::DashboardController < ApplicationController
  before_action :authenticate_api_user!

  def show
    author = current_api_user

    earnings = AuthorEarning
      .includes(:work, :chapter, :reader_user)
      .where(author: author)

    chapter_reads = ChapterRead
      .includes(:work, :chapter, :user)
      .where(author: author)

    render json: {
      summary: {
        pending_earnings_cents: earnings.where(status: :pending).sum(:amount_cents).to_f.round(4),
        paid_earnings_cents: earnings.where(status: :paid).sum(:amount_cents).to_f.round(4),
        total_earnings_cents: earnings.sum(:amount_cents).to_f.round(4),
        currency: "EUR",
        total_subscription_reads: chapter_reads.count,
        payout_reads: chapter_reads.where(counted_for_payout: true).count,
        total_works: author.works.count,
        published_works: author.works.published.count
      },
      top_works: top_works_payload(chapter_reads),
      recent_reads: recent_reads_payload(chapter_reads),
      recent_earnings: recent_earnings_payload(earnings)
    }, status: :ok
  end

  private

  def top_works_payload(chapter_reads)
    reads_by_work_id = chapter_reads
      .group(:work_id)
      .count

    works = Work
      .where(id: reads_by_work_id.keys)
      .includes(:genres)
      .index_by(&:id)

    reads_by_work_id
      .sort_by { |_work_id, reads_count| -reads_count }
      .first(10)
      .map do |work_id, reads_count|
        work = works[work_id]

        {
          id: work.id,
          slug: work.slug,
          title: work.title,
          cover_picture: work.cover_picture,
          status: work.status,
          access_level: work.access_level,
          rating_avg: work.rating_avg,
          rating_count: work.rating_count,
          chapter_count: work.chapter_count,
          views_count: work.views_count,
          reads_count: reads_count,
          genres: work.genres.map do |genre|
            {
              id: genre.id,
              name: genre.name
            }
          end
        }
      end
  end

  def recent_reads_payload(chapter_reads)
    chapter_reads
      .order(read_at: :desc)
      .limit(10)
      .map do |read|
        {
          id: read.id,
          read_at: read.read_at,
          counted_in_quota: read.counted_in_quota,
          counted_for_payout: read.counted_for_payout,
          payout_cents: read.payout_cents,
          reader: {
            id: read.user.id,
            username: read.user.username
          },
          work: {
            id: read.work.id,
            slug: read.work.slug,
            title: read.work.title
          },
          chapter: {
            id: read.chapter.id,
            chapter_number: read.chapter.chapter_number,
            title: read.chapter.title
          }
        }
      end
  end

  def recent_earnings_payload(earnings)
    earnings
      .order(created_at: :desc)
      .limit(10)
      .map do |earning|
        {
          id: earning.id,
          amount_cents: earning.amount_cents,
          currency: earning.currency,
          status: earning.status,
          paid_at: earning.paid_at,
          created_at: earning.created_at,
          reader: {
            id: earning.reader_user.id,
            username: earning.reader_user.username
          },
          work: {
            id: earning.work.id,
            slug: earning.work.slug,
            title: earning.work.title
          },
          chapter: {
            id: earning.chapter.id,
            chapter_number: earning.chapter.chapter_number,
            title: earning.chapter.title
          }
        }
      end
  end
end
