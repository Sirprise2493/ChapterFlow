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

      resource :subscription, only: [:show], controller: 'subscription'

      namespace :author do
        get "dashboard", to: "dashboard#show"

        resources :works, only: [:index, :show, :create, :update] do
          resources :chapters, only: [:create, :update, :destroy]
        end
      end

      resources :genres, only: [:index]

      resources :works, only: [:index, :show] do
        member do
          post :view
        end

        resources :ratings, only: [:create, :update]
        resource :library, only: [:create, :destroy], controller: 'libraries'
        resource :reading_progress, only: [:create, :update]
      end

      resources :library, only: [:index], controller: 'libraries'

      resources :chapters, only: [:show] do
        resources :comments, only: [:index, :create, :update, :destroy] do
          member do
            post :like
            delete :like
          end
        end
      end
    end
  end
end
