class Api::V1::WorksController < ApplicationController
  def index
    works = Work.includes(:author, :genres).published
    works = works.search_query(params[:q])
    works = works.by_genre_ids(params[:genre_ids] || params[:genre_id])
    works = works.by_status(params[:status])
    works = works.with_min_chapters(params[:min_chapters].to_i) if params[:min_chapters].present?
    works = works.with_min_words(params[:min_words]) if params[:min_words].present?

    works = sort_works(works)

    page = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = normalized_per_page
    offset = (page - 1) * per_page

    # Wichtig:
    # Bei Multi-Genre-Filter nutzt by_genre_ids GROUP BY.
    # works.distinct.count gibt dann einen Hash zurück, z. B. {1=>1, 4=>1}.
    # Deshalb zählen wir IDs robust per pluck + uniq.
    total_count = works.except(:order).pluck(:id).uniq.count

    items = works
      .distinct
      .offset(offset)
      .limit(per_page)

    render json: {
      total_count: total_count,
      page: page,
      per_page: per_page,
      works: items.map { |work| work_payload(work) }
    }, status: :ok
  end

  def show
    work = Work
      .includes(:author, :genres, :chapters)
      .published
      .find_by!(slug: params[:id])

    reading_progress = current_api_user
      &.reading_progresses
      &.includes(:last_chapter)
      &.find_by(work_id: work.id)

    current_user_has_active_subscription = active_subscription_for_current_user?

    render json: {
      id: work.id,
      slug: work.slug,
      title: work.title,
      description: work.description,
      cover_picture: work.cover_picture,
      status: work.status,
      access_level: work.access_level,
      free_chapter_until: work.free_chapter_until,
      current_user_has_active_subscription: current_user_has_active_subscription,
      rating_avg: work.rating_avg,
      rating_count: work.rating_count,
      chapter_count: work.chapter_count,
      word_count: work.word_count,
      views_count: work.views_count,
      published_at: work.published_at,
      in_library: current_api_user ? current_api_user.user_libraries.exists?(work_id: work.id) : false,
      reading_progress: reading_progress_payload(reading_progress),
      author: {
        id: work.author.id,
        username: work.author.username
      },
      genres: work.genres.map { |genre| genre_payload(genre) },
      chapters: work.chapters.order(:chapter_number).map do |chapter|
        chapter_payload(work, chapter)
      end
    }, status: :ok
  end

  def view
    work = Work.published.find_by!(slug: params[:id])
    work.increment!(:views_count)

    render json: {
      views_count: work.views_count
    }, status: :ok
  end

  private

  def sort_works(works)
    case params[:sort]
    when "best_rated"
      works.best_rated
    when "bestsellers"
      works.bestsellers
    when "most_chapters"
      works.order(chapter_count: :desc, published_at: :desc)
    when "most_words"
      works.order(word_count: :desc, published_at: :desc)
    when "title_asc"
      works.order(title: :asc)
    else
      works.latest
    end
  end

  def normalized_per_page
    requested_per_page = params[:per_page].to_i
    return 20 unless requested_per_page.positive?

    [requested_per_page, 48].min
  end

  def active_subscription_for_current_user?
    return false unless current_api_user

    current_api_user
      .subscriptions
      .where(status: :active)
      .where("current_period_start <= ? AND current_period_end >= ?", Time.current, Time.current)
      .exists?
  end

  def work_payload(work)
    {
      id: work.id,
      slug: work.slug,
      title: work.title,
      description: work.description,
      cover_picture: work.cover_picture,
      status: work.status,
      access_level: work.access_level,
      free_chapter_until: work.free_chapter_until,
      rating_avg: work.rating_avg,
      rating_count: work.rating_count,
      chapter_count: work.chapter_count,
      word_count: work.word_count,
      views_count: work.views_count,
      author: {
        id: work.author.id,
        username: work.author.username
      },
      genres: work.genres.map { |genre| genre_payload(genre) }
    }
  end

  def genre_payload(genre)
    {
      id: genre.id,
      name: genre.name.to_s
    }
  end

  def chapter_payload(work, chapter)
    chapter_is_free =
      work.free_access? ||
      chapter.chapter_number <= work.free_chapter_until

    {
      id: chapter.id,
      chapter_number: chapter.chapter_number,
      title: chapter.title,
      is_free: chapter_is_free,
      requires_subscription: !chapter_is_free
    }
  end

  def reading_progress_payload(progress)
    return nil unless progress&.last_chapter

    {
      id: progress.id,
      last_read_at: progress.last_read_at,
      progress_percent: progress.progress_percent,
      scroll_position: progress.scroll_position,
      last_chapter: {
        id: progress.last_chapter.id,
        chapter_number: progress.last_chapter.chapter_number,
        title: progress.last_chapter.title
      }
    }
  end
end
