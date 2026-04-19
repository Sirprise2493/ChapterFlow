Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      devise_scope :user do
        post   'signup', to: 'users/registrations#create'
        post   'login',  to: 'users/sessions#create'
        delete 'logout', to: 'users/sessions#destroy'
      end

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
