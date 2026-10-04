import mongoose from "mongoose";

let bucket;

export const getGridFSBucket = () => {
  if (!bucket) {
    if (!mongoose.connection.db) {
      throw new Error("Mongoose is not connected to a database");
    }
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "attachments",
    });
  }
  return bucket;
};

export const resetGridFSBucket = () => {
  bucket = null;
};

export default { getGridFSBucket, resetGridFSBucket };
