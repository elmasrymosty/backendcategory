const express = require('express');
const router = express.Router();
const { Category } = require('../models/category');
const multer = require('multer');
const { storage } = require('../cloudinary'); // ✅ Same as product route
const upload = multer({ storage });
const cloudinary = require('cloudinary').v2;

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).send(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// GET category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Category not found');
    res.status(200).send(category);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving category');
  }
});

// POST create category with Cloudinary upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No image uploaded');

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'categories',
    });

    const category = new Category({
      name: req.body.name,
      image: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });

    const saved = await category.save();
    res.status(201).send(saved);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).send('Category creation failed');
  }
});

// PUT update category
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Category not found');

    // Delete old image from Cloudinary if a new one is uploaded
    if (req.file && category.image?.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    let updatedImage = category.image;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'categories',
      });
      updatedImage = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    category.name = req.body.name || category.name;
    category.image = updatedImage;

    const updated = await category.save();
    res.send(updated);
  } catch (error) {
    console.error('Category update failed:', error);
    res.status(500).send('Category update failed');
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Category not found');

    if (category.image?.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).send({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).send('Failed to delete category');
  }
});

module.exports = router;
