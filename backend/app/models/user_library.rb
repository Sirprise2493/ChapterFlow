class UserLibrary < ApplicationRecord
  belongs_to :user
  belongs_to :work

  validates :user_id, uniqueness: { scope: :work_id }
end
