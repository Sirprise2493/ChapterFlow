Rails.application.routes.draw do
  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      devise_for :users,
                 path: '',
                 path_names: {
                   sign_in: 'login',
                   sign_out: 'logout',
                   registration: 'signup'
                 },
                 controllers: {
                   sessions: 'api/v1/users/sessions',
                   registrations: 'api/v1/users/registrations'
                 }

      get 'me', to: 'me#show'
      get 'home', to: 'home#index'

      resources :genres, only: [:index]

      resources :works, only: [:index, :show] do
        resources :ratings, only: [:create, :update]
        resource :library, only: [:create, :destroy], controller: 'libraries'
        resource :reading_progress, only: [:create, :update]
      end

      resources :chapters, only: [:show]
    end
  end
end
