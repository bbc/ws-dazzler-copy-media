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

var event = {
  Records: [
    {
      EventSource: "aws:sns",
      EventVersion: "1.0",
      EventSubscriptionArn:
        "arn:aws:sns:eu-west-1:294595276257:LiveMsdrPercolatorWorldServicePartnersResources-NotificationsTopic-10ZP19CXN5F82:01ea9877-bbbf-47af-a8eb-6d013f9f44ea",
      Sns: {
        Type: "Notification",
        MessageId: "e98342c1-fdea-5a5f-b155-14b5db1261f5",
        TopicArn:
          "arn:aws:sns:eu-west-1:294595276257:LiveMsdrPercolatorWorldServicePartnersResources-NotificationsTopic-10ZP19CXN5F82",
        Subject: null,
        Message:
          '{"content_version_id":"pips-pid-p07qtqhw","drm":"none","media_asset_id":"pips-pid-p07qtrvv","sequence_stamp":1570807107001000,"profile_id":"pips-map_id-a_od_p006","uri":"https://dazzler-test-bucket.s3-eu-west-1.amazonaws.com/av_pv10_pa4/modav/bUnknown-1ba9cc05-8aed-41cd-9a9e-8112579db9d9_w1msh390zxm7wrt_cUnknown_1576245484850.mp4","last_updated":"2019-10-11T15:18:51.380Z","event_name":"INSERT"}',
        Timestamp: "2019-12-18T13:08:08.066Z",
        SignatureVersion: "1",
        Signature:
          "LkLMPn+1iBBSb9Qf6p/ZawAq82U9OLacijbzO+DfbnVN/qQGSwzs0fnBoGfdXVO+R35wPfxhiZ+WxxIjaIrxU+wiGCqMnqzFsv8dP/W2qwaeahshDxIqFCOKW7ytDMy60fr8OiAwtob996miwCj5hRlh3teOlv7zNhzvjptiN5Jsbsl28YRqcZykpaboN8xLeKlw3fgL9fFvqiIX1owrGzMgR3cOP8d+YgxEEifdXNztCSkriz0+sMcYi4GJDezAVO5Hz3lPNS8iy+VMHfCS6BOU8wsTT8fwbZfSF9zNKacugpu7w/mhxEjkNnBdFfFZ2e+abjecv0uAeXyRhBdO7g==",
        SigningCertUrl:
          "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-6aad65c2f9911b05cd53efda11f913f9.pem",
        UnsubscribeUrl:
          "https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:294595276257:LiveMsdrPercolatorWorldServicePartnersResources-NotificationsTopic-10ZP19CXN5F82:01ea9877-bbbf-47af-a8eb-6d013f9f44ea",
        MessageAttributes: {}
      }
    }
  ]
};
var context = {
  callbackWaitsForEmptyEventLoop: true,
  logGroupName:
    "/aws/lambda/MediaSyndicationApiNotificationsHandlerForPartners",
  logStreamName: "2019/12/17/[$LATEST]f2b113501a774ddb97437e9d18fc6358",
  functionName: "MediaSyndicationApiNotificationsHandlerForPartners",
  memoryLimitInMB: "128",
  functionVersion: "$LATEST",
  invokeid: "3191d65c-5040-4743-8826-0379b2b9059f",
  awsRequestId: "3191d65c-5040-4743-8826-0379b2b9059f",
  invokedFunctionArn:
    "arn:aws:lambda:eu-west-1:205979497597:function:MediaSyndicationApiNotificationsHandlerForPartners"
};
mockLambda(event, context);
