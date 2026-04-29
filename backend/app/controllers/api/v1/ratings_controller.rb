class Api::V1::RatingsController < ApplicationController
  before_action :authenticate_api_user!
  before_action :set_work

  def create
    rating = @work.ratings.find_or_initialize_by(user_id: current_api_user.id)
    rating.score = rating_params[:score]

    if rating.save
      @work.reload

      render json: {
        message: "Rating saved",
        rating: {
          score: rating.score
        },
        work: {
          id: @work.id,
          slug: @work.slug,
          rating_avg: @work.rating_avg,
          rating_count: @work.rating_count
        }
      }, status: :created
    else
      render json: { errors: rating.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    rating = @work.ratings.find_by!(user_id: current_api_user.id)
    rating.score = rating_params[:score]

    if rating.save
      @work.reload

      render json: {
        message: "Rating updated",
        rating: {
          score: rating.score
        },
        work: {
          id: @work.id,
          slug: @work.slug,
          rating_avg: @work.rating_avg,
          rating_count: @work.rating_count
        }
      }, status: :ok
    else
      render json: { errors: rating.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_work
    @work = Work.published.find_by!(slug: params[:work_id])
  end

  def rating_params
    params.require(:rating).permit(:score)
  end
end
