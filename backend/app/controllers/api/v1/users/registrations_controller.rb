class Api::V1::Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  def create
    user = User.new(sign_up_params)

    if user.save
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

      response.set_header('Authorization', "Bearer #{token}")

      render json: {
        message: 'Signed up successfully',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      }, status: :created
    else
      render json: {
        message: 'Sign up failed',
        errors: user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def sign_up_params
    params.require(:user).permit(:email, :username, :password, :password_confirmation)
  end
end
