class APIFeatures {
  // queryStr is the string after ? in the api call
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    search(){
        const keyword = this.queryString.keyword ? {
            name: {
                $regex: this.queryString.keyword, //$regex is a mongo operator that provides regular expression capabilities for pattern matching strings in queries.
                $options: 'i' // This is for removing case sensitivity
            }
        } : {} // if the query doesnt exists than keyword = {} therefore find all the products
        // console.log(keyword);  If we search apple we get { name: { '$regex': 'apple', '$options': 'i' } }
        // If we do normally db.products.find({name : "apple"}) we wont find any product
        // But we will if we do db.products.find({ name: { '$regex': 'apple', '$options': 'i' } })
        this.query = this.query.find({ ...keyword }); // Searching the queryStr and returning the full object
        // To access the products found we do this.query in the server.js
        return this;
    }
    filter(){
      const queryCopy = {...this.queryString}; // making copy as we make change in the queryString then it doesn't change the original queryString
      // console.log(queryCopy);
      ["keyword","page","limit"].forEach(function(element){ // As we don't need these fields to filter our products
        delete queryCopy[element];
      });
      // console.log(queryCopy);
      // this.query  = this.query.find(queryCopy);

      // Advance filter for price and rating range
      // api/v1/product?keyword=apple&category=Laptops&price[gte]=100&price[lte]=1000
      // Now if we print this request we get { catagory: 'Laptops', price: { gte: '100', lte: '1000' } }
      // We cannot provide this directly to .find() as it takes price: { $gte: '100', $lte: '1000' }
      // Therefore we need to add doller sign
      let tempQueryString = JSON.stringify(queryCopy);
      console.log(tempQueryString); // As replace() method can only be used on strings that's why we have converted it to strings
      tempQueryString = tempQueryString.replace(/\b(gt|gte|lt|lte)\b/g,function(match){
        return `$${match}`;
      });
      console.log(tempQueryString);
      this.query  = this.query.find(JSON.parse(tempQueryString));
      return this
    }
    pagination(resPerPage){
      // We will give the current page by api/v1/products?page=2
      const currentPage  = this.queryString.page || 1;
      const skip = resPerPage * (currentPage-1); // If we want page 2 and resPerPage = 10 so we have to skip first 10 products that is 10*(2-1);
      this.query = this.query.limit(resPerPage).skip(skip);
      return this;
    }
}

module.exports = APIFeatures;
