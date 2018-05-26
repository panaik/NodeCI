const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util"); // standard Node library
const keys = require("../config/keys");

// const redisURL = "redis://127.0.0.1:6379";
// const client = redis.createClient(redisURL);
const client = redis.createClient(keys.redisURL);

// promisify takes any function that accepts a callback as the last argument
// and makes the function return a Promise
// client.get = util.promisify(client.get);
client.hget = util.promisify(client.hget);
// changed to using hget and hset after addition of this.hashKey in cache function below

// this stores the reference to the original exec function
const exec = mongoose.Query.prototype.exec;

// If any query calls 'cache' function and then 'exec' is executed,
// then for that query caching will be enabled
// OR else by default caching is not enabled for any query
mongoose.Query.prototype.cache = function(options = {}) {
  // here 'this' is eqaul to the query instance
  // e.g query...Blog.find({ _user: req.user.id }).cache() => this.cache is 'true' only for this query instance
  // and no other query inside our app
  this.useCache = true;

  // we are expecting the query to pass in a options 'key' to be used as top level key into the cache
  // the key to be used must be a number or string, so it can be used as a key into the cache
  // this 'options.key' can be any value such as user_id, or another property we want to use as top level key,
  // which will be specified in the paramter to the cache function when called with a query
  // using hashKey lets customize and use any key as a top level key into the cache and hence can be reused
  // for any other application as well
  this.hashKey = JSON.stringify(options.key || "");

  return this;
};

// we want to use 'function' here and not arrow function syntax, since we want to make use of 'this'
mongoose.Query.prototype.exec = async function() {
  // console.log("IM ABOUT TO RUN A QUERY");

  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // console.log(this.getQuery());
  // console.log(this.mongooseCollection.name);

  // we don't want to accidentally modify the object returned from this.getQuery(),
  // because otherwise we will modify the actual query itself by changing this.getQuery object

  // So we need to create a new object and assign it the properties of this.getQuery object and the collection
  // for this we will use Object.assign
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  // console.log(key); // we are going to use this as a 'key' into our Redis cache

  // See if we have a value for 'key' in redis
  // const cacheValue = await client.get(key);
  const cacheValue = await client.hget(this.hashKey, key);

  // If we do, return that
  if (cacheValue) {
    // console.log(this);
    // console.log(cacheValue);
    // this.model is a reference to the model class that this query is attached to
    // so we can create a new instance of that model and pass in the properties we want to assign to that model
    // we need to this because Redis cache stores only JSON whereas our app expects Mongoose model returned
    // from the exec function and not Redis JSON

    // const doc = new this.model(JSON.parse(cacheValue));

    // now cacheValue can be a single object or an array of objects

    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments);
  // console.log(result);
  // console.log(result.validate);

  // 'EX' stands for expiration, '10' stands for cache expiration after 10 seconds
  // client.set(key, JSON.stringify(result), "EX", 10);
  client.hset(this.hashKey, key, JSON.stringify(result), "EX", 10);

  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};

/*

    // Do we have any cached data in redis related
    // to this query
    // we are using the user's id as the key into the redis cache

    // const cachedBlogs = client.get(req.user.id, () => {});
    // we don't want use to callback to get access to cached data, rather somehow use Promise
    // so thats why we are promisifying client.get function above
    const cachedBlogs = await client.get(req.user.id);

    // If yes, then respond to the request right away
    // and return
    if (cachedBlogs) {
      console.log("SERVING FROM CACHE");
      return res.send(JSON.parse(cachedBlogs));
    }

    // If no, we need to respond to request
    // and update our cache to store the data

    const blogs = await Blog.find({ _user: req.user.id });

    res.send(blogs);
    console.log("SERVING FROM MONGODB");

    // set the redis cache with this current user's blogs
    client.set(req.user.id, JSON.stringify(blogs));

    */
