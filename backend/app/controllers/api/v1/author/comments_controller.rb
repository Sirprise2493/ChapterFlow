class Api::V1::Author::CommentsController < ApplicationController
  before_action :authenticate_api_user!

  def index
    comments = author_comments_scope
    comments = apply_work_filter(comments)
    comments = apply_chapter_filter(comments)
    comments = apply_type_filter(comments)

    total_count = comments.count

    page = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = params[:per_page].to_i > 0 ? params[:per_page].to_i : 20
    offset = (page - 1) * per_page

    items = comments
      .includes(:user, :work, chapter: :work)
      .order(created_at: :desc)
      .offset(offset)
      .limit(per_page)

    render json: {
      total_count: total_count,
      page: page,
      per_page: per_page,
      works: author_works_payload,
      comments: items.map { |comment| comment_payload(comment) }
    }, status: :ok
  end

  def destroy
    comment = author_comments_scope.find(params[:id])
    comment.destroy

    render json: {
      message: "Comment deleted",
      id: comment.id
    }, status: :ok
  end

  private

  def author_comments_scope
    own_work_ids = current_api_user.works.select(:id)
    own_chapter_ids = Chapter.where(work_id: own_work_ids).select(:id)

    Comment
      .where(work_id: own_work_ids)
      .or(Comment.where(chapter_id: own_chapter_ids))
  end

  def apply_work_filter(comments)
    return comments if params[:work_id].blank?

    work_chapter_ids = Chapter
      .where(work_id: params[:work_id])
      .select(:id)

    comments
      .where(work_id: params[:work_id])
      .or(comments.where(chapter_id: work_chapter_ids))
  end

  def apply_chapter_filter(comments)
    return comments if params[:chapter_id].blank?

    comments.where(chapter_id: params[:chapter_id])
  end

  def apply_type_filter(comments)
    case params[:comment_type]
    when "work"
      comments.where.not(work_id: nil).where(chapter_id: nil)
    when "chapter"
      comments.where.not(chapter_id: nil)
    else
      comments
    end
  end

  def author_works_payload
    current_api_user
      .works
      .includes(:chapters)
      .order(:title)
      .map do |work|
        {
          id: work.id,
          slug: work.slug,
          title: work.title,
          chapters: work.chapters.order(:chapter_number).map do |chapter|
            {
              id: chapter.id,
              chapter_number: chapter.chapter_number,
              title: chapter.title
            }
          end
        }
      end
  end

  def comment_payload(comment)
    work = comment.work || comment.chapter&.work

    {
      id: comment.id,
      comment_type: comment.work_id.present? ? "work" : "chapter",
      content: comment.content,
      media_url: comment.media_url,
      media_type: comment.media_type,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      parent_comment_id: comment.parent_comment_id,
      replies_count: comment.replies.count,
      likes_count: comment.comment_likes.count,
      user: {
        id: comment.user.id,
        username: comment.user.username
      },
      work: {
        id: work.id,
        slug: work.slug,
        title: work.title
      },
      chapter: comment.chapter ? {
        id: comment.chapter.id,
        chapter_number: comment.chapter.chapter_number,
        title: comment.chapter.title
      } : nil
    }
  end
end
