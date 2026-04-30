class Api::V1::CommentsController < ApplicationController
  before_action :set_chapter
  before_action :authenticate_comment_user!, only: [:create, :update, :destroy, :like]
  before_action :set_comment, only: [:update, :destroy, :like]

  def index
    comments = @chapter
      .comments
      .includes(:user, :comment_likes, replies: [:user, :comment_likes])
      .where(parent_comment_id: nil)

    comments =
      case params[:sort]
      when "popular"
        comments
          .left_joins(:comment_likes)
          .group("comments.id")
          .order(Arel.sql("COUNT(comment_likes.id) DESC"), created_at: :desc)
      else
        comments.order(created_at: :desc)
      end

    render json: {
      comments: comments.map { |comment| comment_payload(comment, include_replies: true) }
    }, status: :ok
  end

  def create
    comment = @chapter.comments.build(comment_params)
    comment.user = current_api_user

    if comment.save
      render json: {
        message: "Comment created",
        comment: comment_payload(comment, include_replies: false)
      }, status: :created
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    unless can_update_comment?(@comment)
      return render json: { message: "Forbidden" }, status: :forbidden
    end

    if @comment.update(comment_params)
      render json: {
        message: "Comment updated",
        comment: comment_payload(@comment, include_replies: false)
      }, status: :ok
    else
      render json: { errors: @comment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    unless can_destroy_comment?(@comment)
      return render json: { message: "Forbidden" }, status: :forbidden
    end

    @comment.destroy

    render json: {
      message: "Comment deleted",
      id: @comment.id
    }, status: :ok
  end

  def like
    existing_like = @comment.comment_likes.find_by(user: current_api_user)

    if request.delete?
      existing_like&.destroy
    else
      @comment.comment_likes.find_or_create_by!(user: current_api_user)
    end

    @comment.reload

    render json: {
      message: request.delete? ? "Comment unliked" : "Comment liked",
      comment: comment_payload(@comment, include_replies: false)
    }, status: :ok
  end

  private

  def set_chapter
    @chapter = Chapter
      .includes(:work)
      .joins(:work)
      .merge(Work.published)
      .find(params[:chapter_id])
  end

  def set_comment
    @comment = @chapter.comments.find(params[:id])
  end

  def authenticate_comment_user!
    render json: { message: "Unauthorized" }, status: :unauthorized unless current_api_user
  end

  def comment_params
    params
      .require(:comment)
      .permit(
        :content,
        :parent_comment_id,
        :media_url,
        :media_type
      )
  end

  def can_update_comment?(comment)
    comment.user_id == current_api_user.id
  end

  def can_destroy_comment?(comment)
    comment.user_id == current_api_user.id ||
      @chapter.work.author_id == current_api_user.id
  end

  def comment_payload(comment, include_replies:)
    {
      id: comment.id,
      content: comment.content,
      media_url: comment.media_url,
      media_type: comment.media_type,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      likes_count: comment.comment_likes.size,
      liked_by_current_user: current_api_user ? comment.comment_likes.any? { |like| like.user_id == current_api_user.id } : false,
      can_update: current_api_user ? comment.user_id == current_api_user.id : false,
      can_destroy: current_api_user ? (
        comment.user_id == current_api_user.id ||
        @chapter.work.author_id == current_api_user.id
      ) : false,
      user: {
        id: comment.user.id,
        username: comment.user.username
      },
      replies: include_replies ? comment.replies.order(created_at: :asc).map do |reply|
        comment_payload(reply, include_replies: false)
      end : []
    }
  end
end
