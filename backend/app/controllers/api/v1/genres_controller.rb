class Api::V1::GenresController < ApplicationController
  def index
    render json: {
      genres: Genre.order(:name).map do |genre|
        {
          id: genre.id,
          name: genre.name
        }
      end
    }, status: :ok
  end
end
