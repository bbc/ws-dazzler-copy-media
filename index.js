console.log("Loading function");
const aws = require("aws-sdk");
const appw = require("./appw");
const wantedMasterBrand = process.env.MASTER_BRAND;
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
  // console.log("Received event:", JSON.stringify(event, null, 2));
  const message = event.Records[0].Sns.Message;
  const sns = JSON.parse(message);
  const profile_id = sns.profile_id;
  if (profile_id === "pips-map_id-av_pv10_pa4") {
    const content_version_id = sns.content_version_id;
    const pid = content_version_id.split("pips-pid-")[1];
    try {
      const response = await appw.get("version", pid);
      const link = response.pips.version.version_of.link
      let masterBrand = "";
      switch (link.rel.split("pips-meta:")[1]) {
        case "clip": {
          const clip = await appw.get("clip", link.pid);
          masterBrand = clip.pips.master_brand_for.master_brand.mid;
          console.log("Clip Master brand is", masterBrand);
        }
          break
        case "episode": {
          const episode = await appw.get("episode", link.pid);
          masterBrand = episode.pips.master_brand_for.master_brand.mid;
          console.log("Episode Master brand is ", masterBrand);
        }
        default: // DO NOTHING
      }
      if (masterBrand === wantedMasterBrand) {
        console.log("right masterbrand");
        try {
          await transport(sns.event_name, sns.uri, pid);
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

const transport = async (operation, s3Location, pid) => {
  console.log("transport", operation, s3Location, pid);
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
