console.log("Loading function");
const aws = require("aws-sdk");
const s3 = new aws.S3({ apiVersion: "2006-03-01" });
const appw = require("./appw-merge-isite.js");
const config = require("./config.json");
const mBrand = "bbc_marathi_tv";
const destinationBucket = "dazzler-test-bucket2";
const envVariables = {
  prefix: config.prefix,
  bucket: config.bucket,
  role: config.role,
  env: config.env
};
try {
  appw.settings(envVariables);
} catch (error) {
  console.log(error);
}
const assetCredentials = new aws.ChainableTemporaryCredentials({
  params: {
    RoleArn: config.RoleArn
  }
});
appwS3 = new aws.S3({ credentials: assetCredentials });
mockLambda = async (event, context) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const message = event.Records[0].Sns.Message;
  const sns = JSON.parse(message);
  const profile_id = sns.profile_id;
  const content_version_id = sns.content_version_id;
  const pid = content_version_id.split("pips-pid-")[1];
  const s3Location = sns.uri.replace("s3:/", "");
  const operation = sns.event_name;
  const item = s3Location.includes(".com")
    ? s3Location.split(".com")[1]
    : s3Location.replace("s3:/", "");
  //bucket will just be bucket name - use replace instead

  try {
    let masterBrand = "";
    const response = await appw.get("version", pid);
    if (
      response.pips.version.version_of.link.rel.split("pips-meta:")[1] ===
      "clip"
    ) {
      const clipPid = response.pips.version.version_of.link.pid;
      const clip = await appw.get("clip", clipPid);
      masterBrand = clip.pips.master_brand_for.master_brand.mid;
      console.log("Master brand is ", masterBrand);
    } else if (
      response.pips.version.version_of.link.rel.split("pips-meta:")[1] ===
      "episode"
    ) {
      const episodePid = response.pips.version.version_of.link.pid;
      const episode = await appw.get("episode", episodePid);
      masterBrand = episode.pips.master_brand_for.master_brand.mid;
      console.log("master brand is ", masterBrand);
    }

    if (masterBrand === mBrand && profile_id.includes("pv10")) {
      try {
        transport(operation, s3Location, pid, item);
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log("Error! ", error);
  }
  return message;
};
//s3location
const transport = async (operation, s3Location, pid, item) => {
  switch (operation) {
    case "MODIFY":
    case "INSERT":
      var params = {
        CopySource: s3Location,
        Bucket: destinationBucket,
        Key: `${pid}.mp4`,
        ACL: "bucket-owner-full-control"
      };
      try {
        let s3Response = await s3.copyObject(params).promise();
        console.log("Inserted");
      } catch (e) {
        console.log("error ", e);
      }
      break;
    case "REMOVE":
      var params = {
        Bucket: destinationBucket,
        Key: `${pid}.mp4`
      };
      try {
        let s3Response = await s3.deleteObject(params).promise();
        console.log("Removed");
      } catch (e) {
        console.log("error ", e);
      }
      break;
    default:
      console.log("Not recognised ", message);
  }
};

mockLambda(event, context);
