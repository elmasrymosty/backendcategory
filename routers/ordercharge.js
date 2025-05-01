const { Ordercharge } = require("../models/ordercharg");
const express = require("express");

const router = express.Router();

//charge
router.post('/charge', async (req,res)=>{
    
    
    let ordercharge= new Ordercharge({
      deliveryCharge: req.body.deliveryCharge,
      
    })
    ordercharge = await ordercharge.save();
  
    if(!ordercharge)
    return res.status(400).send('the cordercharge cannot be created!')
  
    res.send(ordercharge);
  })
// Retrieve the delivery charge
router.get('/charge', async (req, res) => {
  try {
    const orderCharge = await Ordercharge.findOne(); // Assuming you want to retrieve the first record
    
    if (!orderCharge)
      return res.status(404).send('Delivery charge not found');

    res.send(orderCharge);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
// Retrieve the delivery charge by ID
router.get('/charge/:id', async (req, res) => {
  try {
    const orderCharge = await Ordercharge.findById(req.params.id); // Find the order charge by ID
    
    if (!orderCharge)
      return res.status(404).send('Delivery charge not found');

    res.send(orderCharge);
  } catch (error) {
    res.status(500).send(error.message);
  }
});



  
  module.exports = router;