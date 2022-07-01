const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please specify as product name.'],
    trim: true,
    maxLength: [100, 'Enter the product name within 100 characters.']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    },

  }],
  price: {
    type: Number,
    required: [true, 'Please specify product price.'],
    maxLength: [5, 'Price of the product cannot be more than 5 digits.'],
    default: 0.0
  },
  description: {
    type: String,
    required: [true, 'Product description is required.'],
  },
  seller: {
    type: String,
    required: [true, 'Specify the product seller.']
  },
  category: {
    type: String,
    required: [true, 'Specify the catagory of the product.'],
    enum: {
      values: [
        'Electronics',
        'Cameras',
        'Laptops',
        'Accessories',
        'Headphones',
        'Food',
        "Books",
        'Clothes/Shoes',
        'Beauty/Health',
        'Sports',
        'Outdoor',
        'Home'
      ],
      message: 'Please select correct category for product'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Please specify product stock.'],
    maxLength: [5, 'Stock cannot exceed 5 digits.'],
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  ratings: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true
    },
    comment: {
      type: String,
      required: true
    }
  }],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = productSchema;
