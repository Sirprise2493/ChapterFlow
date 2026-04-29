class Api::V1::MeController < ApplicationController
  before_action :authenticate_api_user!

  def show
    render json: {
      user: {
        id: current_api_user.id,
        email: current_api_user.email,
        username: current_api_user.username
      }
    }, status: :ok
  end
end
