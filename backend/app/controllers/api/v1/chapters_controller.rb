class Api::V1::ChaptersController < ApplicationController
  def show
    chapter = Chapter.includes(:work).find(params[:id])
    ordered_chapters = chapter.work.chapters.order(:chapter_number).pluck(:id)
    current_index = ordered_chapters.index(chapter.id)

    chapter.work.increment!(:views_count)

    render json: {
      id: chapter.id,
      title: chapter.title,
      chapter_number: chapter.chapter_number,
      content: chapter.content,
      work: {
        id: chapter.work.id,
        slug: chapter.work.slug,
        title: chapter.work.title
      },
      previous_chapter_id: current_index && current_index > 0 ? ordered_chapters[current_index - 1] : nil,
      next_chapter_id: current_index && current_index < ordered_chapters.length - 1 ? ordered_chapters[current_index + 1] : nil
    }
  end
end
