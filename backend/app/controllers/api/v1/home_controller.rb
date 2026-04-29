class Api::V1::HomeController < ApplicationController
  MIN_RATINGS_FOR_TOP_LISTS = 3
  HOME_LIST_LIMIT = 10

  def index
    published_works = Work
      .includes(:author, :genres)
      .published

    render json: {
      rating_lists: {
        month: serialize_works(top_rated_since(1.month.ago)),
        year: serialize_works(top_rated_since(1.year.ago)),
        all_time: serialize_works(
          published_works
            .where("rating_count >= ?", MIN_RATINGS_FOR_TOP_LISTS)
            .best_rated
            .limit(HOME_LIST_LIMIT)
        )
      },
      genre_lists: genre_lists,
      most_viewed: serialize_works(
        published_works
          .bestsellers
          .limit(HOME_LIST_LIMIT)
      ),
      new_releases: serialize_works(
        published_works
          .latest
          .limit(HOME_LIST_LIMIT)
      ),
      recently_updated: serialize_works(recently_updated_works)
    }
  end

  private

  def top_rated_since(date)
    Work
      .includes(:author, :genres)
      .published
      .joins(:ratings)
      .where(ratings: { created_at: date..Time.current })
      .select(
        "works.*",
        "AVG(ratings.score) AS period_rating_avg",
        "COUNT(ratings.id) AS period_rating_count"
      )
      .group("works.id")
      .having("COUNT(ratings.id) >= ?", MIN_RATINGS_FOR_TOP_LISTS)
      .order(
        Arel.sql("AVG(ratings.score) DESC"),
        Arel.sql("COUNT(ratings.id) DESC"),
        views_count: :desc
      )
      .limit(HOME_LIST_LIMIT)
  end

  def genre_lists
    Genre
      .joins(:works)
      .merge(Work.published)
      .distinct
      .order(:name)
      .map do |genre|
        works = genre
          .works
          .includes(:author, :genres)
          .published
          .order(rating_avg: :desc, views_count: :desc, published_at: :desc)
          .limit(HOME_LIST_LIMIT)

        {
          id: genre.id,
          name: genre.name,
          works: serialize_works(works)
        }
      end
  end

  def recently_updated_works
    Work
      .includes(:author, :genres)
      .published
      .joins(:chapters)
      .select("works.*, MAX(chapters.created_at) AS last_chapter_created_at")
      .group("works.id")
      .order(Arel.sql("MAX(chapters.created_at) DESC"))
      .limit(HOME_LIST_LIMIT)
  end

  def serialize_works(works)
    works.distinct.map do |work|
      {
        id: work.id,
        slug: work.slug,
        title: work.title,
        description: work.description,
        cover_picture: work.cover_picture,
        status: work.status,
        access_level: work.access_level,
        rating_avg: work.rating_avg,
        rating_count: work.rating_count,
        chapter_count: work.chapter_count,
        views_count: work.views_count,
        published_at: work.published_at,
        period_rating_avg: optional_decimal(work, :period_rating_avg),
        period_rating_count: optional_integer(work, :period_rating_count),
        author: {
          id: work.author.id,
          username: work.author.username
        },
        genres: work.genres.map do |genre|
          {
            id: genre.id,
            name: genre.name
          }
        end
      }
    end
  end

  def optional_decimal(record, attribute)
    return nil unless record.respond_to?(attribute)

    value = record.public_send(attribute)
    value.present? ? value.to_f.round(2) : nil
  end

  def optional_integer(record, attribute)
    return nil unless record.respond_to?(attribute)

    value = record.public_send(attribute)
    value.present? ? value.to_i : nil
  end
end
