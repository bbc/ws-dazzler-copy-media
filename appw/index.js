const AWS = require("aws-sdk");
let prefix = "";
let bucket = "";
let role = "";
let env = "test";
let appwS3 = null;
module.exports = {
  get: async function(doc_type, pid) {
    const key = this.pid2key(doc_type, pid);
    console.log("get_appw", bucket, key);
    try {
      const appw_doc = await appwS3
        .getObject({ Bucket: bucket, Key: key })
        .promise();
      return JSON.parse(appw_doc.Body.toString("utf-8"));
    } catch (error) {
      return error;
    }
  },
  pid2key: function(doc_type, pid) {
    return `${prefix}/application/json/${doc_type}/pid.${pid}`;
  },
  key2pid: function(key) {
    const path = key.split("/");
    return path[path.length - 1].split(".")[1];
  },
  key2docType: function(key) {
    const path = key.split("/");
    const len = path.length;
    if (path[len - 3] === "availability") {
      return "availability/" + path[len - 2];
    } else {
      return path[len - 2];
    }
  },
  settings: function(settings) {
    console.log("SETTINGS RECEIVED ", settings);
    prefix = settings.prefix;
    bucket = settings.bucket;
    role = settings.role;
    env = settings.env;
    const credentials = new AWS.ChainableTemporaryCredentials({
      params: {
        RoleArn: settings.role
      }
    });
    appwS3 = new AWS.S3({ credentials: credentials });
  }
};
