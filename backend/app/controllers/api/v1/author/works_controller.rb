class Api::V1::Author::WorksController < ApplicationController
  before_action :authenticate_api_user!
  before_action :set_work, only: [:show, :update]

  def index
    works = current_api_user
      .works
      .includes(:genres)
      .order(created_at: :desc)

    render json: {
      works: works.map { |work| work_payload(work) }
    }, status: :ok
  end

  def show
    render json: {
      work: work_payload(@work).merge(
        chapters: @work.chapters.order(:chapter_number).map do |chapter|
          chapter_payload(chapter)
        end
      )
    }, status: :ok
  end

  def create
    work = current_api_user.works.build(work_params)
    work.slug = generate_unique_slug(work.title)
    work.published_at = Time.current if publish_now?

    if work.save
      attach_genres(work)

      render json: {
        message: "Work created",
        work: work_payload(work.reload)
      }, status: :created
    else
      render json: { errors: work.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @work.assign_attributes(work_params)
    @work.published_at = publish_now? ? (@work.published_at || Time.current) : nil

    if @work.save
      attach_genres(@work)

      render json: {
        message: "Work updated",
        work: work_payload(@work.reload)
      }, status: :ok
    else
      render json: { errors: @work.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_work
    @work = current_api_user.works.find_by!(slug: params[:id])
  end

  def work_params
    params
      .require(:work)
      .permit(
        :title,
        :description,
        :cover_picture,
        :status,
        :access_level,
        :is_subscription_eligible,
        :free_chapter_until
      )
  end

  def genre_ids
    Array(params.dig(:work, :genre_ids)).reject(&:blank?)
  end

  def publish_now?
    ActiveModel::Type::Boolean.new.cast(params.dig(:work, :publish_now))
  end

  def attach_genres(work)
    work.genres = Genre.where(id: genre_ids)
  end

  def generate_unique_slug(title)
    base_slug = title.to_s.parameterize
    base_slug = "work" if base_slug.blank?

    slug = base_slug
    counter = 2

    while Work.exists?(slug: slug)
      slug = "#{base_slug}-#{counter}"
      counter += 1
    end

    slug
  end

  def work_payload(work)
    {
      id: work.id,
      slug: work.slug,
      title: work.title,
      description: work.description,
      cover_picture: work.cover_picture,
      status: work.status,
      access_level: work.access_level,
      free_chapter_until: work.free_chapter_until,
      rating_avg: work.rating_avg,
      rating_count: work.rating_count,
      chapter_count: work.chapter_count,
      views_count: work.views_count,
      is_subscription_eligible: work.is_subscription_eligible,
      published_at: work.published_at,
      created_at: work.created_at,
      genres: work.genres.map do |genre|
        {
          id: genre.id,
          name: genre.name
        }
      end
    }
  end

  def chapter_payload(chapter)
    {
      id: chapter.id,
      chapter_number: chapter.chapter_number,
      title: chapter.title,
      content: chapter.content,
      is_monetizable: chapter.is_monetizable,
      created_at: chapter.created_at,
      updated_at: chapter.updated_at
    }
  end
end
