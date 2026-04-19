class Api::V1::LibrariesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work

  def create
    library_item = UserLibrary.find_or_initialize_by(user: current_user, work: @work)
    library_item.added_at ||= Time.current

    if library_item.save
      render json: { message: "Added to library" }, status: :created
    else
      render json: { errors: library_item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    library_item = UserLibrary.find_by(user: current_user, work: @work)

    if library_item
      library_item.destroy
      render json: { message: "Removed from library" }, status: :ok
    else
      render json: { errors: ["Library entry not found"] }, status: :not_found
    end
  end

  private

  def set_work
    @work = Work.find(params[:work_id])
  end
end
