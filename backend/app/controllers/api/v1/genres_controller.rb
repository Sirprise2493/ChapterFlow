class Api::V1::GenresController < ApplicationController
  def index
    render json: Genre.order(:name).map { |genre| { id: genre.id, name: genre.name } }
  end
end
