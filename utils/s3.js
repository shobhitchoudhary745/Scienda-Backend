// require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const S3 = require("aws-sdk/clients/s3");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config({
  path: "../config/config.env",
});

exports.s3Uploadv2 = async (file) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `test/${Date.now().toString()}-${file.originalname}`,
    Body: file.buffer,
  };

  return await s3.upload(param).promise();
};

exports.s3UploadMulti = async (files) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const params = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `test/${Date.now().toString()}-${
        file.originalname ? file.originalname : "not"
      }`,
      Body: file.buffer,
    };
  });

  return await Promise.all(params.map((param) => s3.upload(param).promise()));
};

const storage = multer.memoryStorage();

const fileFilter = async (req, file, cb) => {
  if (
    file.mimetype.split("/")[0] === "image" ||
    file.mimetype.split("/")[0] === "application" ||
    file.mimetype.split("/")[0] === "video"
  ) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 500, files: 10 },
});
