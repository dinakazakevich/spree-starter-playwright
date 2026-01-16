# Find products without images and attach defaults
Spree::Product.find_each do |product|
  next if product.images.any?
  
  # Use Spree's image model
  product.images.create!(
    attachment: File.open(Rails.root.join('db', 'seed_images', 'default_product.jpg'))
  )
end