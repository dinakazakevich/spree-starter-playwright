image_files = Dir.glob(Rails.root.join('db', 'seed_images', '*.png'))

Spree::Product.find_each.with_index do |product, index|
  next if product.images.any?
  
  image_path = image_files[index % image_files.length]
  
  product.images.create!(
    attachment: File.open(image_path)
  )
end