const { Order, } = require("../models/order");
const{Product}=require("../models/product")
const express = require("express");
const { OrderItem } = require("../models/order-item");
const { Ordercharge } = require("../models/ordercharg");
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 });

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });

  if (!order) {
    res.status(500).json({ success: false });
  }
  res.send(order);
});

router.post("/", async (req, res) => {
   if (!Array.isArray(req.body.orderItems)) {
    return res.status(400).json({ error: "orderItems must be an array" });
   }
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderitem) => {
      let newOrderItem = new OrderItem({
        quantity: orderitem.quantity,
        product: orderitem.product,
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItemsIds;

//const deliveryCharge =20; // Adjust this value as needed
// Fetch delivery charge from MongoDB
const orderCharge = await Ordercharge.findOne();
if (!orderCharge) {
  // Handle the case where the delivery charge is not found in the database
  return res.status(400).send("Delivery charge not found!");
}

// Use the fetched delivery charge
const deliveryCharge = orderCharge.deliveryCharge;
// Calculate total price of order items
const totalPrices = await Promise.all(
  orderItemsIdsResolved.map(async (orderItemId) => {
    const orderItem = await OrderItem.findById(orderItemId).populate(
      "product",
      "priceAfterDiscount"
    );

    const totalPrice = orderItem.product.priceAfterDiscount * orderItem.quantity;

    return totalPrice;
  })
);

// Calculate the total price before discount and delivery charge
const totalPriceAfterDiscount = totalPrices.reduce((a,b) => a +b , 0);


// Calculate the final total price after discount and delivery charge
const totalPricendDelivery = totalPriceAfterDiscount + deliveryCharge;


let order = new Order({
  orderItems: orderItemsIdsResolved,
  shippingAddress1: req.body.shippingAddress1,
  shippingAddress2: req.body.shippingAddress2,
  city: req.body.city,
  country: req.body.country,
  phone: req.body.phone,
  status: req.body.status,
  paymentmethod:req.body.paymentmethod,
  totalPrice:totalPricendDelivery , // Set the final total price after discount and delivery charge
  user: req.body.user,
});

order = await order.save();
  if (!order) return res.status(400).send("the order cannot be created!");

  // Now, fetch the product and update its stock count
  for (const orderItem of req.body.orderItems) {
    const product = await Product.findById(orderItem.product);
    if (product) {
      const newStockAfterSales = product.countInStock - orderItem.quantity;
      product.countInStock = newStockAfterSales;
      await product.save();
    } else {
      // Handle the case where the product with the given ID is not found
      // You can choose to return an error or take appropriate action.
      console.log(`Product not found for order item with ID: ${orderItem.product}`);
    }
  }

  res.status(200).send(order);
});



// update order status
router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!order) return res.status(400).send("the order cannot be update!");

  res.send(order);
});

router.delete("/:id", (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndRemove(orderItem);
        });
        return res
          .status(200)
          .json({ success: true, message: "the order is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "order not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get('/get/totalsales', async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ]);

    if (!totalSales || totalSales.length === 0) {
      // No orders, so totalSales array is empty
      return res.status(404).send('No orders found to calculate total sales');
    }

    // At least one order exists, so calculate and send total sales
    res.send({ totalsales: totalSales[0].totalsales });
  } catch (error) {
    console.error('Error getting total sales:', error);
    res.status(500).json({ success: false });
  }
});

router.get(`/get/count`, async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();

    res.send({
      orderCount: orderCount,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});



// router.post('/create-checkout-session', async (req, res) => {
//   const orderItems = req.body;

//   if (!orderItems) {
//       return res.status(400).send('checkout session cannot be created - check the order items');
//   }
//   const lineItems = await Promise.all(
//       orderItems.map(async (orderItem) => {
//           const product = await Product.findById(orderItem.product);
//           return {
//               price_data: {
//                   currency: 'ron',
//                   product_data: {
//                       name: product.name
//                   },
//                   unit_amount: product.priceAfterDiscount *100
                  
//               },
//               quantity: orderItem.quantity
//           };
//       })
//   );
 
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     line_items: lineItems,
//     mode: 'payment',
//     success_url: 'http://localhost:4200/success',
//     cancel_url: 'http://localhost:4200/error'
// });
// res.json({ id: session.id });
// });



router.post('/create-checkout-session', async (req, res) => {
  const orderItems = req.body;

  if (!orderItems) {
    return res.status(400).send('checkout session cannot be created - check the order items');
  }

  const lineItems = await Promise.all(
    orderItems.map(async (orderItem) => {
      const product = await Product.findById(orderItem.product);

// Fetch delivery charge from MongoDB
const orderCharge = await Ordercharge.findOne();
if (!orderCharge) {
  // Handle the case where the delivery charge is not found in the database
  return res.status(400).send("Delivery charge not found!");
}

// Use the fetched delivery charge
const deliveryCharge = orderCharge.deliveryCharge;
      // Calculate the total unit amount including the delivery charge
      const totalUnitAmount = (product.priceAfterDiscount + deliveryCharge) * 100;

      return {
        price_data: {
          currency: 'ron',
          product_data: {
            name: product.name
          },
          unit_amount: totalUnitAmount,
        },
        quantity: orderItem.quantity
      };
    })
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: 'http://localhost:4200/success',
    cancel_url: 'http://localhost:4200/error'
  });

  res.json({ id: session.id });
});


  


module.exports = router;
