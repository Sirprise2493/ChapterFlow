class Api::V1::ChaptersController < ApplicationController
  def show
    chapter = Chapter
      .includes(work: [:author, :genres])
      .joins(:work)
      .merge(Work.published)
      .find(params[:id])

    unless can_read_chapter?(chapter)
      return render json: {
        message: "Dieses Kapitel benötigt ein aktives Abo."
      }, status: :payment_required
    end

    recorder_result = ChapterReadRecorder.new(
      user: current_api_user,
      chapter: chapter
    ).call

    unless recorder_result.success?
      return render json: {
        message: recorder_result.error_message
      }, status: :payment_required
    end

    work = chapter.work
    reading_progress = current_api_user&.reading_progresses&.find_by(work_id: work.id)

    render json: {
      id: chapter.id,
      chapter_number: chapter.chapter_number,
      title: chapter.title,
      content: chapter.content,
      is_monetizable: chapter.is_monetizable,
      created_at: chapter.created_at,
      updated_at: chapter.updated_at,
      is_free: free_chapter?(chapter),
      requires_subscription: !free_chapter?(chapter),
      remaining_chapters_this_period: remaining_chapters_for_current_user,
      reading_progress: reading_progress_payload(reading_progress),
      work: {
        id: work.id,
        slug: work.slug,
        title: work.title,
        cover_picture: work.cover_picture,
        status: work.status,
        access_level: work.access_level,
        free_chapter_until: work.free_chapter_until,
        author: {
          id: work.author.id,
          username: work.author.username
        },
        genres: work.genres.map do |genre|
          {
            id: genre.id,
            name: genre.name
          }
        end,
        chapters: work.chapters.order(:chapter_number).map do |work_chapter|
          chapter_is_free = work.free_access? || work_chapter.chapter_number <= work.free_chapter_until

          {
            id: work_chapter.id,
            chapter_number: work_chapter.chapter_number,
            title: work_chapter.title,
            is_free: chapter_is_free,
            requires_subscription: !chapter_is_free
          }
        end
      },
      previous_chapter: previous_chapter_payload(chapter),
      next_chapter: next_chapter_payload(chapter)
    }
  end

  private

  def previous_chapter_payload(chapter)
    previous_chapter = chapter
      .work
      .chapters
      .where("chapter_number < ?", chapter.chapter_number)
      .order(chapter_number: :desc)
      .first

    chapter_payload(previous_chapter)
  end

  def next_chapter_payload(chapter)
    next_chapter = chapter
      .work
      .chapters
      .where("chapter_number > ?", chapter.chapter_number)
      .order(chapter_number: :asc)
      .first

    chapter_payload(next_chapter)
  end

  def chapter_payload(chapter)
    return nil unless chapter

    {
      id: chapter.id,
      chapter_number: chapter.chapter_number,
      title: chapter.title
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
