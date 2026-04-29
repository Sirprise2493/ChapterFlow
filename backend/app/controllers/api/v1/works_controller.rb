class Api::V1::WorksController < ApplicationController
  def index
    works = Work.includes(:author, :genres).published
    works = works.search_query(params[:q])
    works = works.by_genre(params[:genre_id])
    works = works.by_status(params[:status])
    works = works.with_min_chapters(params[:min_chapters].to_i) if params[:min_chapters].present?

    works =
      case params[:sort]
      when "best_rated"
        works.best_rated
      when "bestsellers"
        works.bestsellers
      else
        works.latest
      end

    page = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = params[:per_page].to_i > 0 ? params[:per_page].to_i : 20
    offset = (page - 1) * per_page

    total_count = works.distinct.count
    items = works.distinct.offset(offset).limit(per_page)

    render json: {
      total_count: total_count,
      page: page,
      per_page: per_page,
      works: items.map { |work| work_payload(work) }
    }
  end

  def show
    work = Work.includes(:author, :genres, :chapters).find_by!(slug: params[:id])
    reading_progress = current_api_user&.reading_progresses&.includes(:last_chapter)&.find_by(work_id: work.id)

    render json: {
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
      views_count: work.views_count,
      published_at: work.published_at,
      in_library: current_api_user ? current_api_user.user_libraries.exists?(work_id: work.id) : false,
      reading_progress: reading_progress_payload(reading_progress),
      author: {
        id: work.author.id,
        username: work.author.username
      },
      genres: work.genres.map { |genre| { id: genre.id, name: genre.name } },
      chapters: work.chapters.order(:chapter_number).map do |chapter|
        chapter_is_free = work.free_access? || chapter.chapter_number <= work.free_chapter_until

        {
          id: chapter.id,
          chapter_number: chapter.chapter_number,
          title: chapter.title,
          is_free: chapter_is_free,
          requires_subscription: !chapter_is_free
        }
      end
    }
  end

  def view
    work = Work.published.find_by!(slug: params[:id])
    work.increment!(:views_count)

    render json: {
      views_count: work.views_count
    }, status: :ok
  end

  private

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
      views_count: work.views_count,
      author: {
        id: work.author.id,
        username: work.author.username
      },
      genres: work.genres.map { |genre| { id: genre.id, name: genre.name } }
    }
  end

  def reading_progress_payload(progress)
    return nil unless progress&.last_chapter

    {
      id: progress.id,
      last_read_at: progress.last_read_at,
      last_chapter: {
        id: progress.last_chapter.id,
        chapter_number: progress.last_chapter.chapter_number,
        title: progress.last_chapter.title
      }
    }
  end
end
