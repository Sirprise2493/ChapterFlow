class Api::V1::RatingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work

  def create
    rating = @work.ratings.find_or_initialize_by(user_id: current_user.id)
    rating.score = params[:score]

    if rating.save
      render json: { message: "Rating saved" }, status: :created
    else
      render json: { errors: rating.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    rating = @work.ratings.find_by!(user_id: current_user.id)

    if rating.update(score: params[:score])
      render json: { message: "Rating updated" }, status: :ok
    else
      render json: { errors: rating.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_work
    @work = Work.find(params[:work_id])
  end
end
