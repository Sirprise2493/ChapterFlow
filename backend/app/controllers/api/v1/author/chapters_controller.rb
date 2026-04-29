class Api::V1::Author::ChaptersController < ApplicationController
  before_action :authenticate_api_user!
  before_action :set_work
  before_action :set_chapter, only: [:update, :destroy]

  def create
    chapter = @work.chapters.build(chapter_params)

    if chapter.save
      refresh_chapter_count

      render json: {
        message: "Chapter created",
        chapter: chapter_payload(chapter)
      }, status: :created
    else
      render json: { errors: chapter.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @chapter.update(chapter_params)
      render json: {
        message: "Chapter updated",
        chapter: chapter_payload(@chapter)
      }, status: :ok
    else
      render json: { errors: @chapter.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @chapter.destroy
    refresh_chapter_count

    render json: {
      message: "Chapter deleted"
    }, status: :ok
  end

  private

  def set_work
    @work = current_api_user.works.find_by!(slug: params[:work_id])
  end

  def set_chapter
    @chapter = @work.chapters.find(params[:id])
  end

  def chapter_params
    params
      .require(:chapter)
      .permit(
        :chapter_number,
        :title,
        :content,
        :is_monetizable
      )
  end

  def refresh_chapter_count
    @work.update!(chapter_count: @work.chapters.count)
  end

  def chapter_payload(chapter)
    {
      id: chapter.id,
      chapter_number: chapter.chapter_number,
      title: chapter.title,
      content: chapter.content,
      is_monetizable: chapter.is_monetizable,
      created_at: chapter.created_at,
      updated_at: chapter.updated_at
    }
  end
end
