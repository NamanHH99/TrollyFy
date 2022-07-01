const dotenv = require("dotenv");
const productSchema = require("../Schema/products");
const products = require("../data/products");
const mongoose  = require("mongoose");
dotenv.config({
  path: "../config/config.env"
});
mongoose.connect(process.env.LOCAL_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const Product = mongoose.model("Product", productSchema);

const seedProducts  = async function(){
  try{
    await Product.deleteMany();
    console.log("Products are deleted");
    await Product.insertMany(products);
    console.log("All products are inserted");
    process.exit();
  }
  catch{
    console.log(error.message);
    process.exit();
  }
}
seedProducts();
