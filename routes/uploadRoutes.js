const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const requireLogin = require("../middlewares/requireLogin");
const keys = require("../config/keys");

const s3 = new AWS.S3({
  accessKeyId: keys.accessKeyId,
  secretAccessKey: keys.secretAccessKey
});

module.exports = app => {
  app.get("/api/upload", requireLogin, (req, res) => {
    // we want the key to look like this, that is the name of the file uploaded to S3 bucket - my-blog-bucket-pratik
    // with random string of letters and numbers as file name
    // 'myUserId/adnigiunlno.jpeg'...the presence of '/' is going to trick S3 into thinking there is some kind of folder structure

    const key = `${req.user.id}/${uuid()}.jpeg`;

    // putObject is the operation name
    s3.getSignedUrl(
      "putObject",
      {
        Bucket: "my-blog-bucket-pratik", // bucket name in S3
        ContentType: "image/jpeg",
        Key: key
      },
      (err, url) => {
        res.send({ key, url });
      }
    );
  });
};
