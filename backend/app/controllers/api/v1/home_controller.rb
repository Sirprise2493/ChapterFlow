class Api::V1::HomeController < ApplicationController
  def index
    render json: {
      bestsellers: serialize_works(Work.published.bestsellers.limit(12)),
      best_ratings: serialize_works(Work.published.best_rated.limit(12)),
      latest: serialize_works(Work.published.latest.limit(12)),
      genres: Genre.order(:name).map do |genre|
        {
          id: genre.id,
          name: genre.name,
          works: serialize_works(genre.works.published.latest.limit(12))
        }
      end
    }
  end

  private

  def serialize_works(works)
    works.distinct.map do |work|
      {
        id: work.id,
        slug: work.slug,
        title: work.title,
        cover_picture: work.cover_picture,
        status: work.status,
        rating_avg: work.rating_avg,
        rating_count: work.rating_count,
        chapter_count: work.chapter_count,
        views_count: work.views_count
      }
    end
  end
end
