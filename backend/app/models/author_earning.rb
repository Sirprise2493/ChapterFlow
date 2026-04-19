class AuthorEarning < ApplicationRecord
  belongs_to :author, class_name: "User"
  belongs_to :reader_user, class_name: "User"
  belongs_to :chapter_read
  belongs_to :subscription_period
  belongs_to :work
  belongs_to :chapter

  enum status: { pending: 0, paid: 1 }
end
