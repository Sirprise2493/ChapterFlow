class Api::V1::Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json
  prepend_before_action :set_devise_mapping

  private

  def set_devise_mapping
    request.env['devise.mapping'] = Devise.mappings[:user]
  end

  def sign_up(resource_name, resource)
    sign_in(resource_name, resource, store: false)
  end

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        message: 'Signed up successfully',
        user: {
          id: resource.id,
          email: resource.email,
          username: resource.username
        }
      }, status: :created
    else
      render json: {
        message: 'Sign up failed',
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def sign_up_params
    params.require(:user).permit(:email, :username, :password, :password_confirmation)
  end
end
