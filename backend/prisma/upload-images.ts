import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const IMAGE_PATHS: Record<string, string> = {
  shoes: '/Users/kmj/.gemini/antigravity/brain/a43c6576-6072-48a2-abd6-94d022ffdf20/sample_shoes_product_1789276541028.jpg',
  nutrition: '/Users/kmj/.gemini/antigravity/brain/a43c6576-6072-48a2-abd6-94d022ffdf20/sample_nutrition_product_1789276558047.jpg',
  gear: '/Users/kmj/.gemini/antigravity/brain/a43c6576-6072-48a2-abd6-94d022ffdf20/sample_gear_product_1789276574316.jpg',
  equipment: '/Users/kmj/.gemini/antigravity/brain/a43c6576-6072-48a2-abd6-94d022ffdf20/sample_equipment_final.png',
};

async function uploadCategoryImages() {
  console.log('☁️ Starting Cloudinary upload for 4 category representative images...');
  console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  const uploadedUrls: Record<string, string> = {};

  for (const [category, localPath] of Object.entries(IMAGE_PATHS)) {
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found: ${localPath}`);
    }

    console.log(`Uploading [${category}] from ${localPath}...`);
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'fittersweat/products',
      public_id: `${category}_sample`,
      overwrite: true,
      resource_type: 'image',
    });

    console.log(`✅ [${category}] uploaded successfully: ${result.secure_url}`);
    uploadedUrls[category] = result.secure_url;
  }

  // Update products.json with the new URLs
  const productsJsonPath = path.join(__dirname, 'data/products.json');
  console.log(`\n📝 Updating ${productsJsonPath} with real Cloudinary URLs...`);

  const raw = fs.readFileSync(productsJsonPath, 'utf-8');
  const products = JSON.parse(raw);

  let updatedCount = 0;
  for (const product of products) {
    const cat = product.categoryId;
    if (uploadedUrls[cat]) {
      product.imageUrl = uploadedUrls[cat];
      product.detailImageUrl = uploadedUrls[cat]; // Option 1: detailImageUrl = imageUrl
      updatedCount++;
    }
  }

  fs.writeFileSync(productsJsonPath, JSON.stringify(products, null, 2), 'utf-8');
  console.log(`🎉 Successfully updated ${updatedCount} products in products.json!`);
  console.log('\nFinal Cloudinary URLs:');
  console.log(JSON.stringify(uploadedUrls, null, 2));

  return uploadedUrls;
}

uploadCategoryImages().catch((err) => {
  console.error('❌ Cloudinary Upload Error:', err);
  process.exit(1);
});
