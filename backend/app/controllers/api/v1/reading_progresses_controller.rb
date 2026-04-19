class Api::V1::ReadingProgressesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work

  def create
    progress = ReadingProgress.find_or_initialize_by(user: current_user, work: @work)
    progress.last_chapter_id = params[:last_chapter_id]
    progress.last_read_at = Time.current

    if progress.save
      render json: { message: "Reading progress saved" }, status: :created
    else
      render json: { errors: progress.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    progress = ReadingProgress.find_by!(user: current_user, work: @work)

    if progress.update(last_chapter_id: params[:last_chapter_id], last_read_at: Time.current)
      render json: { message: "Reading progress updated" }, status: :ok
    else
      render json: { errors: progress.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_work
    @work = Work.find(params[:work_id])
  end
end
