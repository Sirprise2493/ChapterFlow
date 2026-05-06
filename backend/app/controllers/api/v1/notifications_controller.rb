class Api::V1::NotificationsController < ApplicationController
  before_action :authenticate_api_user!

  def index
    notifications = current_api_user.notifications.latest

    page = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = params[:per_page].to_i > 0 ? params[:per_page].to_i : 20
    offset = (page - 1) * per_page

    total_count = notifications.count
    unread_count = current_api_user.notifications.unread.count

    items = notifications.offset(offset).limit(per_page)

    render json: {
      total_count: total_count,
      unread_count: unread_count,
      page: page,
      per_page: per_page,
      notifications: items.map { |notification| notification_payload(notification) }
    }, status: :ok
  end

  def read
    notification = current_api_user.notifications.find(params[:id])
    notification.mark_as_read!

    render json: {
      message: "Notification marked as read",
      notification: notification_payload(notification)
    }, status: :ok
  end

  def read_all
    current_api_user
      .notifications
      .unread
      .update_all(read_at: Time.current, updated_at: Time.current)

    render json: {
      message: "All notifications marked as read",
      unread_count: 0
    }, status: :ok
  end

  private

  def notification_payload(notification)
    {
      id: notification.id,
      action: notification.action,
      title: notification.title,
      body: notification.body,
      read_at: notification.read_at,
      is_read: notification.read?,
      created_at: notification.created_at,
      actor: notification.actor ? {
        id: notification.actor.id,
        username: notification.actor.username
      } : nil,
      notifiable: notifiable_payload(notification)
    }
  end

  def notifiable_payload(notification)
    item = notification.notifiable
    return nil unless item

    case item
    when Comment
      work = item.work || item.chapter&.work

      {
        type: "comment",
        id: item.id,
        work_slug: work&.slug,
        chapter_id: item.chapter_id
      }
    when Work
      {
        type: "work",
        id: item.id,
        slug: item.slug
      }
    when Chapter
      {
        type: "chapter",
        id: item.id,
        work_slug: item.work.slug
      }
    else
      {
        type: item.class.name,
        id: item.id
      }
    end
  end
end
