class Api::V1::Author::EarningsController < ApplicationController
  before_action :authenticate_api_user!

  def index
    earnings = AuthorEarning
      .includes(:work, :chapter, :reader_user)
      .where(author: current_api_user)

    earnings = earnings.where(status: params[:status]) if valid_status_filter?
    earnings = earnings.where(work_id: params[:work_id]) if params[:work_id].present?

    total_count = earnings.count
    total_amount_cents = earnings.sum(:amount_cents).to_f.round(4)

    page = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = params[:per_page].to_i > 0 ? params[:per_page].to_i : 20
    offset = (page - 1) * per_page

    items = earnings
      .order(created_at: :desc)
      .offset(offset)
      .limit(per_page)

    render json: {
      total_count: total_count,
      total_amount_cents: total_amount_cents,
      currency: "EUR",
      page: page,
      per_page: per_page,
      works: author_works_payload,
      earnings: items.map { |earning| earning_payload(earning) }
    }, status: :ok
  end

  private

  def valid_status_filter?
    params[:status].present? &&
      AuthorEarning.statuses.key?(params[:status])
  end

  def author_works_payload
    current_api_user
      .works
      .order(:title)
      .map do |work|
        {
          id: work.id,
          slug: work.slug,
          title: work.title
        }
      end
  end

  def earning_payload(earning)
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
