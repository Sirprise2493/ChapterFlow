class Api::V1::MeController < ApplicationController
  before_action :authenticate_user!

  def show
    render json: {
      id: current_user.id,
      email: current_user.email,
      username: current_user.username
    }
  end
end
