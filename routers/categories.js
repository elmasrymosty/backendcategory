const {Category} = require('../models/category');
const express = require('express');
const router = express.Router();
const { cloudinary, storage } = require('../cloudinary'); //
router.get(`/`, async (req, res) =>{
    const categoryList = await Category.find();

    if(!categoryList) {
        res.status(500).json({success: false})
    } 
    res.status(200).send(categoryList);
})

router.get('/:id', async(req,res)=>{
    const category = await Category.findById(req.params.id);

    if(!category) {
        res.status(500).json({message: 'The category with the given ID was not found.'})
    } 
    res.status(200).send(category);
})



router.post('/', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).send('No image uploaded.');
  
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
  


  router.put('/:id', upload.single('image'), async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Category not found');
  
    // Delete old image if new one is uploaded
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
  
    try {
      const updatedCategory = await category.save();
      res.send(updatedCategory);
    } catch (error) {
      res.status(500).send('Category update failed');
    }
  });
  

// DELETE category route
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
  

module.exports =router;