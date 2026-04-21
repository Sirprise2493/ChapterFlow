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

  private

  def authenticate_api_user!
    render json: { message: 'Unauthorized' }, status: :unauthorized unless current_api_user
  end

  def current_api_user
    return @current_api_user if defined?(@current_api_user)

    auth_header = request.headers['Authorization']
    return @current_api_user = nil if auth_header.blank?

    scheme, token = auth_header.split(' ', 2)
    return @current_api_user = nil unless scheme == 'Bearer' && token.present?

    secret = Rails.application.credentials.devise_jwt_secret_key!

    payload, = JWT.decode(token, secret, true, algorithm: 'HS256')
    user_id = payload['sub']

    @current_api_user = User.find_by(id: user_id)
  rescue JWT::ExpiredSignature, JWT::DecodeError, JWT::VerificationError
    @current_api_user = nil
  end
end
