const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  PINcode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  MobileNo: {
    type: String,
    required: true
  },
  ordersArray: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product'
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
  }],
  paymentInfo: {
    id: {
      type: String
    },
    status: {
      type: String
    }
  },
  paidAt: {
    type: Date
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  details : {
    orderedAt: {
      type: Date,
      default: Date.now
    },
    orderStatus: {
      type: String,
      required: true,
      default: 'Processing'
    },
    deliveredAt: {
      type: Date
    }
  }
});

module.exports = orderSchema;
