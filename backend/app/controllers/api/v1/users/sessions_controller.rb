class Api::V1::Users::SessionsController < Devise::SessionsController
  respond_to :json
  prepend_before_action :set_devise_mapping

  private

  def set_devise_mapping
    request.env['devise.mapping'] = Devise.mappings[:user]
  end

  def respond_with(resource, _opts = {})
    render json: {
      message: 'Logged in successfully',
      user: {
        id: resource.id,
        email: resource.email,
        username: resource.username
      }
    }, status: :ok
  end

  def respond_to_on_destroy
    render json: { message: 'Logged out successfully' }, status: :ok
  end
end
