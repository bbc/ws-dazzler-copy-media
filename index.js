console.log("Loading function");
const aws = require("aws-sdk");
const appw = require("./appw-merge-isite.js");
const mBrand = process.env.MASTER_BRAND;
const destinationBucket = process.env.OUTPUT_BUCKET;
const envVariables = {
  prefix: process.env.APPW_KEY_PREFIX,
  bucket: process.env.APPW_BUCKET,
  role: process.env.APPW_ROLE,
  env: process.env.APPW_ENV
};
try {
  appw.settings(envVariables);
} catch (error) {
  console.log(error);
}
const assetCredentials = new aws.ChainableTemporaryCredentials({
  params: {
    RoleArn: process.env.MEDIA_ROLE
  }
});
let msS3 = new aws.S3({ credentials: assetCredentials });
exports.handler = async (event, context) => {
  console.log("HIT");
  console.log("Received event:", JSON.stringify(event, null, 2));
  const message = event.Records[0].Sns.Message;
  const sns = JSON.parse(message);
  const profile_id = sns.profile_id;
  if (profile_id === "pips-map_id-av_pv10_pa4") {
    const content_version_id = sns.content_version_id;
    const pid = content_version_id.split("pips-pid-")[1];
    const s3Location = sns.uri;
    const operation = sns.event_name;
    //we don't need this
    const item = s3Location.includes(".com")
      ? s3Location.split(".com")[1]
      : s3Location.replace("s3:/", "");
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
        console.log("Clip Master brand is", masterBrand);
      } else if (
        response.pips.version.version_of.link.rel.split("pips-meta:")[1] ===
        "episode"
      ) {
        const episodePid = response.pips.version.version_of.link.pid;
        const episode = await appw.get("episode", episodePid);
        masterBrand = episode.pips.master_brand_for.master_brand.mid;
        console.log("Episode Master brand is ", masterBrand);
      }
      if (masterBrand === mBrand) {
        console.log("right masterbrand");
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
  } else {
    console.log("Profile ID was not pv10", message);
  }
};
const transport = async (operation, s3Location, pid, item) => {
  console.log("transport", operation, s3Location, pid, item);
  s3Location = s3Location.replace("s3:/", "");
  switch (operation) {
    case "MODIFY":
    case "INSERT":
      var params = {
        CopySource: s3Location,
        Bucket: destinationBucket,
        Key: `${pid}.mp4`,
        ACL: "bucket-owner-full-control"
      };
      console.log("Params are", params);
      try {
        let s3Response = await msS3.copyObject(params).promise();
        console.log("Inserted");
      } catch (e) {
        console.log("error ", e);
      }
      break;
    case "REMOVE":
      var params = {
        Bucket: process.env.OUTPUT_BUCKET,
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
