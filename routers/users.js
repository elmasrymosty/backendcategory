const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get(`/`, async (req, res) =>{
    const userList = await User.find().select('-passwordHash');

    if(!userList) {
        res.status(500).json({success: false})
    } 
    res.send(userList);
})

router.get('/:id', async(req,res)=>{
    const user = await User.findById(req.params.id).select('-passwordHash');

    if(!user) {
        res.status(500).json({message: 'The user with the given ID was not found.'})
    } 
    res.status(200).send(user);
})

router.post('/', async (req, res) => {
    try {
        console.log('Request Body:', req.body); // Check the contents of req.body
        const saltRounds = 10; // You can adjust this value as needed
        const password = req.body.password; // Extract the password field

        if (!password) {
            return res.status(400).send('Missing password');
        }
        const hashedPassword = await bcrypt.hashSync(req.body.password, saltRounds);

        let user = new User({
            name: req.body.name,
            email: req.body.email,
            passwordHash: hashedPassword, // Use the hashed password
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            city: req.body.city,
            country: req.body.country,
        });

        // ... rest of your code ...
        user = await user.save();

    if(!user)
    return res.status(400).send('the user cannot be created!')

    res.send(user);

    } catch (error) {
        console.error("Error:", error);
        // Handle the error appropriately
    }
});



router.put('/:id',async (req, res)=> {

    const userExist = await User.findById(req.params.id);
    let newPassword
    if(req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
          
            city: req.body.city,
            country: req.body.country,
        },
        { new: true}
    )

    if(!user)
    return res.status(400).send('the user cannot be created!')

    res.send(user);
})

router.post('/login', async (req,res) => {
    const user = await User.findOne({email: req.body.email})
    const secret = process.env.JWT_SECRET;
    if(!user) {
        return res.status(400).send('The user not found');
    }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            {expiresIn : '1d'}
        )
       
        res.status(200).send({user: user.email , token: token}) 
    } else {
       res.status(400).send('password is wrong!');
    }

    
})


router.post('/register', async (req,res)=>{
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        city: req.body.city,
        country: req.body.country,
    })
    user = await user.save();

    if(!user)
    return res.status(400).send('the user cannot be created!')

    res.send(user);
})


router.delete('/:id' , (req, res)=>{
    console.log('User ID to delete:', req.params.id);
    User.findByIdAndRemove({ _id: req.params.id }).then(result =>{
        if(result) {
            return res.status(200).json({success: true, message: 'the user is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "user not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

const getUserCount = async () => {
    if (!getUserCount.cachedCount) {
      getUserCount.cachedCount = await User.countDocuments();
    }
    return getUserCount.cachedCount;
  };
  
  router.get(`/get/count`, async (req, res) => {
    try {
      const userCount = await getUserCount();
  
      if (!userCount) {
        return res.status(500).json({ success: false });
      }
  
      res.send({
        userCount: userCount
      });
    } catch (error) {
      console.error('Error getting user count:', error);
      res.status(500).json({ success: false });
    }
  });
module.exports =router;