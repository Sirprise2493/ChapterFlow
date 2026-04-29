class Api::V1::ReadingProgressesController < ApplicationController
  before_action :authenticate_api_user!
  before_action :set_work

  def create
    save_progress
  end

  def update
    save_progress
  end

  private

  def set_work
    @work = Work.published.find_by!(slug: params[:work_id])
  end

  def save_progress
    chapter = @work.chapters.find(params[:chapter_id])

    progress = current_api_user.reading_progresses.find_or_initialize_by(work: @work)
    progress.last_chapter = chapter
    progress.last_read_at = Time.current

    if progress.save
      render json: {
        message: "Reading progress saved",
        reading_progress: reading_progress_payload(progress)
      }, status: :ok
    else
      render json: { errors: progress.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def reading_progress_payload(progress)
    {
      id: progress.id,
      work_id: progress.work_id,
      last_read_at: progress.last_read_at,
      last_chapter: {
        id: progress.last_chapter.id,
        chapter_number: progress.last_chapter.chapter_number,
        title: progress.last_chapter.title
      }
    }
  end
end
