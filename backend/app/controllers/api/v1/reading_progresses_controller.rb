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
    chapter = @work.chapters.find(progress_params[:chapter_id])

    progress = nil

    ActiveRecord::Base.transaction do
      progress = current_api_user
        .reading_progresses
        .lock
        .find_or_initialize_by(work: @work)

      progress.last_chapter = chapter
      progress.last_read_at = Time.current
      progress.progress_percent = normalized_progress_percent
      progress.scroll_position = normalized_scroll_position
      progress.save!
    end

    render json: {
      message: "Reading progress saved",
      reading_progress: reading_progress_payload(progress)
    }, status: :ok
  rescue ActiveRecord::RecordNotUnique
    retry
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  def progress_params
    params.permit(:chapter_id, :progress_percent, :scroll_position)
  end

  def normalized_progress_percent
    value = progress_params[:progress_percent].to_i
    [[value, 0].max, 100].min
  end

  def normalized_scroll_position
    [progress_params[:scroll_position].to_i, 0].max
  end

  def reading_progress_payload(progress)
    {
      id: progress.id,
      work_id: progress.work_id,
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
