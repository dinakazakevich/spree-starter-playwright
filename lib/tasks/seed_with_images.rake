namespace :spree_sample do
  desc "Load Spree sample data with product images"
  task load_with_images: :environment do
    Rake::Task['spree_sample:load'].invoke
    load Rails.root.join('db', 'seeds', 'sample_product_images.rb')
  end
end