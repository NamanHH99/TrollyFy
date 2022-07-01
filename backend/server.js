const app = require("./app")
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const productSchema = require("./Schema/products");
const APIFeatures = require("./utils/apiFeatures");
const userSchema = require("./Schema/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const orderSchema = require("./Schema/order");
dotenv.config({
  path: "config/config.env"
});
app.use(express.json());
app.use(cookieParser());
mongoose.connect(process.env.LOCAL_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const Product = mongoose.model("Product", productSchema);
const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);
// To add a new product
app.post("/api/v1/admin/product/new", async function(req, res) {
  if (await isAdmin(req, res)) {
    req.body.user = req.user._id; // To assign the who added the product
    const product = await Product.create(req.body, function(err, product) {
      if (!err) {
        res.send({
          status: true,
          product
        })
      }
    });
  } else {
    res.send({
      success: false,
      message: "Login first"
    });
  }
});

// // To get all the products
// app.get("/api/v1/products", async function(req, res) {
//   const products = await Product.find();
//   res.send({
//     status: true,
//     count: products.length,
//     // message: "We will show all the products here."
//     products
//   })
// });


// To get all the products
// And apply search/filters /api/v1/products?keyword=apple
app.get("/api/v1/products", async function(req, res) {
  const resPerPage = 4;
  const apiFeatures = new APIFeatures(Product.find(), req.query).search().filter().pagination(resPerPage);
  const products = await apiFeatures.query;
  res.send({
    status: true,
    count: products.length,
    // message: "We will show all the products here."
    products
  });
});

//To get a single product by its id
app.get("/api/v1/product/:id", async function(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.send({
      status: false,
      message: "Product not found!!!"
    })
  } else {
    res.send({
      status: true,
      product
    });
  }

});

// Update a product by its id
app.put("/api/v1/admin/product/:id", async function(req, res) {
  if (await isAdmin(req, res)) {
    let product = await Product.findById(req.params.id);
    if (!product) {
      res.send({
        status: false,
        message: "Product not found!!!"
      })
    } else {
      product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      res.send({
        status: true,
        product
      });
    }
  } else {
    res.send({
      success: false,
      message: "Login first"
    });
  }

});

//Delete a product by its id
app.delete("/api/v1/admin/product/:id", async function(req, res) {
  if (await isAdmin(req, res)) {
    let product = await Product.findById(req.params.id);
    if (!product) {
      res.send({
        status: false,
        message: "Product not found!!!"
      })
    } else {
      await product.deleteOne();
      res.send({
        status: true,
        message: "Product is deleted!!"
      });
    }
  } else {
    res.send({
      success: false,
      message: "Login first"
    });
  }


});

// Registering a user
const saltRounds = 12;
app.post("/api/v1/register", function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hash
    });
    const jwtToken = jwt.sign({
      id: newUser._id
    }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME
    });
    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
      ),
      httpOnly: true //  If not then it will be accessable by JS
    }

    newUser.save(function(err) {
      if (err) {
        res.send({
          success: false,
          err
        });
      } else {
        res.cookie("token", jwtToken, options).send({
          success: true,
          newUser,
          jwtToken
        });
      }
    })
  });
});
// User login
app.post("/api/v1/login", function(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.send({
      success: true,
      message: "Please enter email or password"
    });
  }
  User.findOne({
    email: email
  }, function(err, foundUser) {
    if (err) {
      res.send(err);
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if (result) {
            const jwtToken = jwt.sign({
              id: foundUser._id
            }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRES_TIME
            });
            const options = {
              expires: new Date(
                Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
              ),
              httpOnly: true //  If not then it will be accessable by JS
            }
            res.cookie("token", jwtToken, options).send({
              success: true,
              foundUser,
              jwtToken
            });
          } else {
            res.send({
              success: false,
              message: "Invalid email or password."
            });
          }
        });
      } else {
        res.send({
          success: false,
          message: "Invalid email or password."
        });
      }
    }
  });
});
// Forgot password
app.post("/api/v1/password/forgot", async function(req, res) {
  const user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    res.send({
      success: false,
      message: "User doesn't exits!!"
    })
  }
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  await User.updateOne(user, {
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: Date.now() + 30 * 60 * 1000
  });
  const resetUrl = req.protocol + "://" + req.get("host") + "/api/v1/password/reset/" + resetToken;
  const message = "Your password reset url is : - " + resetUrl;
  try {
    // Sending password recovery email!!
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    const Message = {
      from: process.env.SMTP_FROM_NAME + "<" + process.env.SMTP_FROM_EMAIL + ">",
      to: req.body.email,
      subject: "Reset password recovery",
      text: message
    }
    await transport.sendMail(Message);
    res.send({
      success: true,
      message: "Reset password email sent to user."
    })
  } catch (error) {
    User.updateOne(user, {
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined
    });
    res.send({
      success: false,
      error
    })
  }
});
// Reset password
app.put("/api/v1/password/reset/:token", async function(req, res) {
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now()
    }
  });
  if (!user) {
    res.send({
      success: false,
      message: "User not found!!"
    })
  }
  if (req.body.password !== req.body.confirmPassword) {
    res.send({
      success: false,
      message: "Password doesn't match"
    })
  }
  bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
    await User.updateOne(user, {
      password: hash,
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined
    });
    if (!err) {
      res.send({
        success: true,
        message: "Password has been successfully updated"
      })
    }
  });
});

// Logout
app.get("/api/v1/logout", function(req, res) {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true
  });
  res.send({
    success: true,
    message: "loged out successfully!!"
  })
});
async function isAdmin(req, res) {
  const token = req.cookies.token;
  if (!token) {
    return false;
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  if (req.user.role === "admin") {
    return true;
  }
  return false;
}
async function isAuthenticated(req, res) {
  const token = req.cookies.token;
  if (!token) {
    return false;
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  return true;
}
// Get user by its id
app.get("/api/v1/me", async function(req, res) {
  if (await isAuthenticated(req, res)) {
    const user = req.user;
    res.send({
      success: true,
      user
    })
  } else {
    res.send({
      success: false,
      message: "Login first to access the profile."
    })
  }
});
// Update the password of the user
app.put("/api/v1/password/update", async function(req, res) {
  if (await isAuthenticated(req, res)) {
    const user = await User.findById(req.user);
    // Check if oldPassword matches, if yes than change password and generate new token
    bcrypt.compare(req.body.oldPassword, user.password, function(err, result) {
      if (result) {
        bcrypt.hash(req.body.newPassword, saltRounds, async function(error, hash) {
          await User.updateOne(user, {
            password: hash
          });
        });
        const jwtToken = jwt.sign({
          id: user._id
        }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_TIME
        });
        const options = {
          expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
          ),
          httpOnly: true //  If not then it will be accessable by JS
        }
        res.cookie("token", jwtToken, options).send({
          success: true,
          user,
          jwtToken
        });
      } else {
        res.send({
          success: false,
          message: "Incorrect password!!"
        });
      }
    });
  }
});
// Update the profile of the user
app.put("/api/v1/me/update", async function(req, res) {
  if (await isAuthenticated(req, res)) {
    const user = req.user;
    const updates = {
      name: req.body.name,
      email: req.body.email
    }
    await User.updateOne(user, updates);
    res.send({
      success: true
    })
  }
});
// Get all users (Admin route)
app.get("/api/v1/admin/users", async function(req, res) {
  if (await isAdmin(req, res)) {
    const users = await User.find();
    res.send({
      success: true,
      users
    })
  } else {
    res.send({
      success: false,
      message: "Only admin can access this route!!"
    })
  }
});
// Get user details by its id
app.get("/api/v1/admin/user/:id", async function(req, res) {
  if (await isAdmin(req, res)) {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.send({
        success: false,
        message: "User not found in the database!!"
      })
    }
    res.send({
      success: true,
      user
    })
  }
  res.send({
    success: false,
    message: "Only admins can access this route!!"
  })
});
//Update user profile by ADMIN route
app.put("/api/v1/admin/user/:id", async function(req, res) {
  if (await isAdmin(req, res)) {
    const user = await User.findById(req.params.id);
    const updates = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role
    }
    await User.updateOne(user, updates);
    res.send({
      success: true
    })
  }
});
// Delete user by admin
app.delete("/api/v1/admin/user/:id", async function(req, res) {
  if (await isAdmin(req, res)) {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.send({
        success: false,
        message: "User not found"
      })
    }
    user.remove();
    res.send({
      success: true
    })
  }
});
// Creating a new order
app.post("/api/v1/order/new", async function(req, res) {
  if (await isAuthenticated(req, res)) {
    const order = new Order({
      user: req.user._id,
      address: req.body.address,
      city: req.body.city,
      PINcode: req.body.PINcode,
      MobileNo: req.body.MobileNo,
      country: req.body.country,
      ordersArray: req.body.orderItems,
      paymentInfo: req.body.paymentInfo,
      paidAt: Date.now(),
      itemsPrice: req.body.itemsPrice,
      taxPrice: req.body.taxPrice,
      shippingPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice
    });
    await order.save();
    res.send({
      success: true,
      order
    })
  }
  res.send({
    status: false,
    message: "Login to place a order!!"
  })
});
//Get order by its id
app.get("/api/v1/order/:id", async function(req, res) {
  if (await isAuthenticated(req, res)) {
    const order = await Order.findById(req.params.id).populate('user', "name email");
    // To also get the name and email of the user by this method populate which fetches the name and email of the user
    if (!order) {
      res.send({
        success: false,
        message: "Order doesn't exist"
      })
    } else {
      res.send({
        success: true,
        order
      })
    }
  } else {
    res.send({
      success: false,
      message: "Login First."
    })
  }
});
// Get all the orders of an user
app.get("/api/v1/orders/me", async function(req, res) {
  if (await isAuthenticated(req, res)) {
    const orders = await Order.find({
      user: req.user._id
    });
    res.send({
      success: true,
      orders
    })
  } else {
    res.send({
      success: false,
      message: "Login First"
    })
  }
});
// Admin to get all the orders
app.get("/api/v1/admin/orders", async function(req, res) {
  if (await isAdmin(req, res)) {
    const orders = await Order.find();
    let totalPrice = 0;
    orders.forEach(function(order) {
      totalPrice = totalPrice + order.totalPrice;
    });
    res.send({
      success: true,
      totalPrice,
      orders
    })
  } else {
    res.send({
      success: false,
      message: "Only admins can access this route"
    })
  }
});
// Update order details by admin
app.put("/api/v1/admin/order/:id", async function(req, res) {
  if (await isAdmin(req, res)) {
    const order = await Order.findById(req.params.id);
    if (order.details.orderStatus === "delivered") {
      res.send({
        success: false,
        message: "order is already delivered"
      })
    } else {
      order.details.orderStatus = req.body.status;
      order.ordersArray.forEach(async function(item) {
        const product = await Product.findById(item.product);
        product.stock = product.stock - item.quantity;
        await product.save({
          validateBeforeSave: false
        }); // This give some error that user is required which is saving it but we dont want that as we want to keep the user which was before only
      });
      order.details.deliveredAt = Date.now();
      await order.save();
      res.send({
        success: true
      })
    }
  } else {
    res.send({
      success: false,
      message: "Only admin can access this route!!"
    })
  }
});
// Delete order by admin
app.delete("/api/v1/admin/order/:id", async function(req, res) {
  if (await isAdmin(req, res)) {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.send({
        success: false,
        message: "Order doesn't exist"
      })
    } else {
      await order.remove();
      res.send({
        success: true,
        message: "Order deleted"
      })
    }
  } else {
    res.send({
      success: false,
      message: "Only admin can access this route!!"
    })
  }
});
// Create a new review or update the existing review
app.put("/api/v1/review", async function(req, res) {
  if (await isAuthenticated(req, res)) {
    const product = await Product.findById(req.body.product);
    if (product.reviews.find(
        function(review) {
          return review.user.toString() === req.user._id.toString();
        }
      )) {
      product.reviews.forEach(function(review) {
        if (review.user.toString() === req.user._id.toString()) {
          review.comment = req.body.comment;
          review.rating = req.body.rating;
        }
      })
      product.numOfReviews = product.reviews.length;
    } else {
      const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment
      }
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    let avg = 0;
    product.reviews.forEach(function(review) {
      avg = avg + review.rating;
    })
    product.ratings = avg / (product.reviews.length);
    await product.save({
      validateBeforeSave: false
    });
    res.send({
      success:true
    })
  } else {
    res.send({
      success: false,
      message: "Login to access this route"
    })
  }
})
// Get all reviews for a product
app.get("/api/v1/reviews",async function(req,res){
  const product = await Product.findById(req.query.id);
  res.send({
    success:true,
    reviews : product.reviews
  })
})
// Delete a product review
app.delete("/api/v1/reviews",async function(req,res){
  const product = await Product.findById(req.query.productId);
  const reviews = product.reviews.filter(function(review){
    return review._id.toString() !== req.query.reviewId.toString()
  })
  let ratings = 0;
  console.log(reviews.length);
  if(reviews.length !== 0){
    console.log("HI");
    let avg = 0;
    reviews.forEach(function(review) {
      avg = avg + review.rating;
    })
    ratings = avg / (reviews.length);
  }
  const numOfReviews = reviews.length;
  await Product.findByIdAndUpdate(req.query.productId,{
    reviews : reviews,
    ratings: ratings,
    numOfReviews : numOfReviews
  })
  res.send({
    success:true
  })
})
app.listen(process.env.PORT, function() {
  console.log("Server started on PORT: " + process.env.PORT + " in " + process.env.NODE_ENVIRONMENT + " mode.");
});
