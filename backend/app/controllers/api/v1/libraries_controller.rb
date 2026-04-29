class Api::V1::LibrariesController < ApplicationController
  before_action :authenticate_api_user!

  def index
    library_items = current_api_user
      .user_libraries
      .includes(work: [:author, :genres])
      .order(added_at: :desc, created_at: :desc)

    progress_by_work_id = current_api_user
      .reading_progresses
      .includes(:last_chapter)
      .where(work_id: library_items.map(&:work_id))
      .index_by(&:work_id)

    render json: {
      works: library_items.map do |item|
        work_payload(item.work, item, progress_by_work_id[item.work_id])
      end
    }, status: :ok
  end

  def create
    work = Work.published.find_by!(slug: params[:work_id])

    library_item = current_api_user.user_libraries.find_or_initialize_by(work: work)
    library_item.added_at ||= Time.current

    if library_item.save
      render json: {
        message: "Added to library",
        in_library: true,
        work: work_payload(work, library_item)
      }, status: :created
    else
      render json: { errors: library_item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    work = Work.published.find_by!(slug: params[:work_id])
    library_item = current_api_user.user_libraries.find_by(work: work)

    if library_item
      library_item.destroy
    end

    render json: {
      message: "Removed from library",
      in_library: false,
      work_id: work.id,
      slug: work.slug
    }, status: :ok
  end

  private

  def work_payload(work, library_item = nil, reading_progress = nil)
    {
      id: work.id,
      slug: work.slug,
      title: work.title,
      description: work.description,
      cover_picture: work.cover_picture,
      status: work.status,
      access_level: work.access_level,
      rating_avg: work.rating_avg,
      rating_count: work.rating_count,
      chapter_count: work.chapter_count,
      views_count: work.views_count,
      reading_progress: reading_progress_payload(reading_progress),
      published_at: work.published_at,
      added_at: library_item&.added_at,
      author: {
        id: work.author.id,
        username: work.author.username
      },
      genres: work.genres.map do |genre|
        {
          id: genre.id,
          name: genre.name
        }
      end
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
