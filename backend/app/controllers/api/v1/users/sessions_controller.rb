class Api::V1::Users::SessionsController < Devise::SessionsController
  respond_to :json

  def create
    user = User.find_for_database_authentication(email: params.dig(:user, :email))

    if user&.valid_password?(params.dig(:user, :password))
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

      response.set_header('Authorization', "Bearer #{token}")

      render json: {
        message: 'Logged in successfully',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      }, status: :ok
    else
      render json: {
        message: 'Invalid email or password'
      }, status: :unauthorized
    end
  end

  def destroy
    render json: { message: 'Logged out successfully' }, status: :ok
  end
end
