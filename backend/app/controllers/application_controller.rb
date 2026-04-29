class ApplicationController < ActionController::API
  include ActionController::MimeResponds
  include Devise::Controllers::Helpers
  include ChapterAccess

  before_action :configure_permitted_parameters, if: :devise_controller?

  private

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username])
    devise_parameter_sanitizer.permit(:account_update, keys: [:username])
  end

  def authenticate_api_user!
    render json: { message: "Unauthorized" }, status: :unauthorized unless current_api_user
  end

  def current_api_user
    return @current_api_user if defined?(@current_api_user)

    auth_header = request.headers["Authorization"]
    return @current_api_user = nil if auth_header.blank?

    scheme, token = auth_header.split(" ", 2)
    return @current_api_user = nil unless scheme == "Bearer" && token.present?

    secret = Rails.application.credentials.devise_jwt_secret_key!

    payload, = JWT.decode(token, secret, true, algorithm: "HS256")
    user_id = payload["sub"]

    @current_api_user = User.find_by(id: user_id)
  rescue JWT::ExpiredSignature, JWT::DecodeError, JWT::VerificationError
    @current_api_user = nil
  end
end
