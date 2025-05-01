const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { Banner } = require('../models/Banner');
const { cloudinary, storage } = require('../cloudinary');
const upload = multer({ storage });
const path = require('path');


// ✅  deleteloudinary
const deleteImagesFromCloudinary = async (images) => {
  if (!images || !images.length) return;
  const deletions = images.map(img => cloudinary.uploader.destroy(img.public_id));
  await Promise.all(deletions);
};

// ✅ Helper: Upload file manually to Cloudinary with dynamic resource type
const uploadToCloudinary = async (filePath) => {
  const fileExtension = filePath.split('.').pop().toLowerCase();
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExtension);

  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'banners',
    resource_type: isVideo ? 'video' : 'image',
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
    resource_type: result.resource_type,
  };
};


// Create a new banner (supports images/videos)
router.post('/', (req, res, next) => {
  upload.array('images', 6)(req, res, function (err) {
    if (err) {
      console.error('🔥 Multer upload error:', err);
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const images = req.files.map(file => ({
      url: file.path,
      public_id: file.filename,
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const banner = new Banner({ images });
    await banner.save();

    res.status(201).json({
      message: 'Files uploaded successfully',
      bannerId: banner._id,
      images: banner.images,
    });
  } catch (error) {
    console.error('🔥 Error uploading files:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});





// ✅ fetsh 
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({}, 'images _id');
    res.status(200).json({ status: 'success', data: banners });
  } catch (error) {
    console.error('🔥 GET /api/v1/banners error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// ✅ single banner idID
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.status(200).json(banner);
  } catch (error) {
    console.error('🔥 GET /api/v1/banners/:id error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// ✅ updated banner


// Update an existing banner (supports images/videos)
router.put('/update/:id', upload.array('images', 10), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid banner ID' });
    }

    const images = req.files.map(file => ({
      url: file.path,
      public_id: file.filename,
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      { images },
      { new: true }
    );

    if (!updatedBanner) {
      return res.status(500).json({ message: 'The banner cannot be updated!' });
    }

    res.status(200).json(updatedBanner);
  } catch (error) {
    console.error('🔥 PUT /banners/:id error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});




// ✅ حذف بنر
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) return res.status(404).json({ message: 'Banner not found!' });

    await deleteImagesFromCloudinary(banner.images);
    await banner.remove();

    res.status(200).json({ success: true, message: 'The banner is deleted!' });
  } catch (error) {
    console.error('🔥 DELETE /api/v1/banners/:id error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
