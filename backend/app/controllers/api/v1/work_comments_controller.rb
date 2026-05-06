class Api::V1::WorkCommentsController < ApplicationController
  before_action :set_work
  before_action :authenticate_api_user!, only: [:create, :update, :destroy, :like]
  before_action :set_comment, only: [:update, :destroy, :like]

  def index
    comments = @work
      .comments
      .includes(:user, :comment_likes, replies: [:user, :comment_likes])
      .where(parent_comment_id: nil)

    comments =
      case params[:sort]
      when "popular"
        comments
          .left_joins(:comment_likes)
          .group("comments.id")
          .order("COUNT(comment_likes.id) DESC, comments.created_at DESC")
      else
        comments.order(created_at: :desc)
      end

    render json: {
      comments: comments.map { |comment| comment_payload(comment, include_replies: true) }
    }, status: :ok
  end

  def create
    comment = @work.comments.new(comment_params)
    comment.user = current_api_user

    if comment.parent_comment_id.present?
      parent_comment = @work.comments.find_by!(id: comment.parent_comment_id)
      comment.parent_comment = parent_comment
    end

    if comment.save
       NotificationCreator.comment_reply!(comment: comment) if comment.parent_comment_id.present?

      render json: {
        message: "Comment created",
        comment: comment_payload(comment)
      }, status: :created
    else
      render json: {
        errors: comment.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def update
    unless owns_comment?(@comment)
      return render json: { message: "Forbidden" }, status: :forbidden
    end

    if @comment.update(comment_params.except(:parent_comment_id))
      render json: {
        message: "Comment updated",
        comment: comment_payload(@comment)
      }, status: :ok
    else
      render json: {
        errors: @comment.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def destroy
    unless owns_comment?(@comment) || owns_work?
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

      return render json: {
        message: "Comment unliked",
        comment: comment_payload(@comment.reload)
      }, status: :ok
    end

    like = @comment.comment_likes.find_or_create_by!(user: current_api_user)

    if like.previously_new_record?
      NotificationCreator.comment_like!(
        comment: @comment,
        actor: current_api_user
      )
    end

    render json: {
      message: "Comment liked",
      comment: comment_payload(@comment.reload)
    }, status: :ok
  end

  private

  def set_work
    @work = Work.published.find_by!(slug: params[:work_id])
  end

  def set_comment
    @comment = @work.comments.find(params[:id])
  end

  def comment_params
    params
      .require(:comment)
      .permit(:content, :parent_comment_id, :media_url, :media_type)
  end

  def owns_comment?(comment)
    current_api_user && comment.user_id == current_api_user.id
  end

  def owns_work?
    current_api_user && @work.author_id == current_api_user.id
  end

  def comment_payload(comment, include_replies: false)
    {
      id: comment.id,
      content: comment.content,
      media_url: comment.media_url,
      media_type: comment.media_type,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      parent_comment_id: comment.parent_comment_id,
      likes_count: comment.comment_likes.count,
      liked_by_current_user: current_api_user ? comment.comment_likes.exists?(user_id: current_api_user.id) : false,
      can_update: current_api_user ? comment.user_id == current_api_user.id : false,
      can_destroy: current_api_user ? comment.user_id == current_api_user.id || @work.author_id == current_api_user.id : false,
      user: {
        id: comment.user.id,
        username: comment.user.username
      },
      replies: include_replies ? comment.replies.order(created_at: :asc).map { |reply| comment_payload(reply) } : []
    }
  end
end
