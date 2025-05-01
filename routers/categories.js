const express = require('express');
const router = express.Router();
const { Category } = require('../models/category');
const multer = require('multer');
const path = require('path');
const { cloudinary } = require('../cloudinary');

// ====== Multer Setup ======
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this directory exists on your server
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
};

const upload = multer({ storage, fileFilter });

// ====== Routes ======

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categoryList = await Category.find();
    res.status(200).send(categoryList);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// GET category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Category not found');
    res.status(200).send(category);
  } catch (err) {
    res.status(500).send('Error retrieving category');
  }
});

// POST create category
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No image uploaded');

  const category = new Category({
    name: req.body.name,
    image: {
      url: req.file.path,
      public_id: req.file.filename,
    },
  });

  try {
    const savedCategory = await category.save();
    res.status(201).send(savedCategory);
  } catch (error) {
    res.status(500).send('Category creation failed');
  }
});

// PUT update category
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Category not found');

    // Remove old image from cloudinary if new one is uploaded
    if (req.file && category.image?.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    category.name = req.body.name || category.name;
    if (req.file) {
      category.image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    const updatedCategory = await category.save();
    res.send(updatedCategory);
  } catch (error) {
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

    await Category.findByIdAndRemove(req.params.id);
    res.status(200).send({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).send('Failed to delete category');
  }
});

module.exports = router;
