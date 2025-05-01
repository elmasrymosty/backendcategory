// cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 🔥 Config your Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔥 Create a dynamic storage function
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'products'; // Default folder

    // 📦 If the request path includes 'banner', save to 'banners'
    if (req.originalUrl.includes('/banners')) {
      folder = 'banners';
    }

    // 📷 If file is a video (mp4), resource_type must be video
    const resource_type = file.mimetype.startsWith('video/') ? 'video' : 'image';

    return {
      folder,
      resource_type,
      allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'jfif', 'mp4'],
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};
