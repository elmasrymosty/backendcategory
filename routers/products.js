const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { storage } = require('../cloudinary'); // ensure path is correct for your Cloudinary config
const upload = multer({ storage });
const cloudinary = require('cloudinary').v2;


// Upload image or video to Cloudinary (helper function)
const uploadToCloudinary = async (filePath) => {
    try {
        const fileExtension = filePath.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExtension);

        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'products',
            resource_type: isVideo ? 'video' : 'image', // Dynamically set resource type
        });

        return result.secure_url;
    } catch (error) {
        console.error("Error uploading to Cloudinary", error);
        throw new Error('Image upload failed');
    }
};



// Route to add a new product with both single and multiple images
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 3 }
]), async (req, res) => {
    try {
        const category = await Category.findById(req.body.category);
        if (!category) return res.status(400).send('Invalid Category');

        const singleImageURL = req.files.image ? await uploadToCloudinary(req.files.image[0].path, 'image') : null;
        const imagesPaths = req.files.images ? await Promise.all(req.files.images.map(file => uploadToCloudinary(file.path))) : [];
        const videoURL = req.files.video ? await uploadToCloudinary(req.files.video[0].path, 'video') : null;
        let product = new Product({
            name: req.body.name,
            description: req.body.description,
            brand: req.body.brand,
            price: req.body.price,
            discount: req.body.discount,
            priceAfterDiscount: req.body.priceAfterDiscount,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            image: singleImageURL, // Single image,
            images: imagesPaths,
            video: videoURL // 🌟 save video url
        });

        product = await product.save();

        if (!product) return res.status(500).send('The product cannot be created');

        res.send(product);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Route to update a product by ID
router.put('/:productId', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 }, { name: 'video', maxCount: 3 }
]), async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).send('Product not found');

        // Update the product fields
        product.name = req.body.name;
        product.description = req.body.description;
        product.brand = req.body.brand;
        product.price = req.body.price;
        product.discount = req.body.discount;
        product.priceAfterDiscount = req.body.priceAfterDiscount;
        product.category = req.body.category;
        product.countInStock = req.body.countInStock;
        product.rating = req.body.rating;
        product.numReviews = req.body.numReviews;
        product.isFeatured = req.body.isFeatured;

        // Handle image updates
        if (req.files) {
            if (req.files.image && req.files.image.length > 0) {
                product.image = await uploadToCloudinary(req.files.image[0].path);
            }
            if (req.files.images && req.files.images.length > 0) {
                product.images = await Promise.all(req.files.images.map(file => uploadToCloudinary(file.path)));
            }
            if (req.files.video && req.files.video.length > 0) {
                product.video = await uploadToCloudinary(req.files.video[0].path, 'video');
            }
        }

        const updatedProduct = await product.save();

        if (!updatedProduct) return res.status(500).send('Failed to update the product');

        res.send(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Fetch all products with optional filtering by category
router.get(`/`, async (req, res) => {
    try {
        let filter = {};
        if (req.query.categories) {
            filter = { category: req.query.categories.split(',') };
        }
        const productList = await Product.find(filter).populate('category');
        res.send(productList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// Fetch a single product by ID
router.get(`/:id`, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.send(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});




// Delete a product by ID
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndRemove(req.params.id);
        if (product) {
            res.status(200).json({ success: true, message: 'The product is deleted!' });
        } else {
            res.status(404).json({ success: false, message: 'Product not found!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err });
    }
});

// Get product count
const getProductCount = async () => {
    if (!getProductCount.cachedCount) {
        getProductCount.cachedCount = await Product.countDocuments();
    }
    return getProductCount.cachedCount;
};

router.get(`/get/count`, async (req, res) => {
    try {
        const productCount = await getProductCount();
        res.send({ productCount });
    } catch (error) {
        console.error('Error getting product count:', error);
        res.status(500).json({ success: false });
    }
});

// Get featured products (limited by count)
router.get(`/get/featured/:count`, async (req, res) => {
    try {
        const count = req.params.count ? parseInt(req.params.count) : 0;
        const products = await Product.find({ isFeatured: true }).limit(count);
        res.send(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// Search products by name
router.get('/products/search', async (req, res) => {
    const keyword = req.query.q;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required.' });

    try {
        const searchResults = await Product.find({ name: { $regex: new RegExp(keyword, 'i') } }).lean();
        const resultsWithoutId = searchResults.map((result) => {
            const { _id, ...rest } = result;
            return rest;
        });
        res.json(resultsWithoutId);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to get a single product's image
router.get('/image/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ image: product.image });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to get a product's gallery images
router.get('/gallery/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ images: product.images });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
