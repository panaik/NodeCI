const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
  await next();
  // this makes sure we call the 'next function which in this case is the route handler such as
  // POST call to /api/blogs to add a new blog
  // we let the route handler execute, then after the route handler completes,
  // execution comes back to here and then we call clearHash function

  clearHash(req.user.id);
};
