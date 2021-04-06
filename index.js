console.log('Loading function')
const AWS = require('aws-sdk')
const { Client } = require('@elastic/elasticsearch')
const appw = require('./appw')
const tagging = require('./tagging')
const elasticSearch = require('./elasticSearch')
const mediaSyndication = require('./mediaSyndication')

const configTable = process.env.DDB_TABLE
const destinationBucket = process.env.OUTPUT_BUCKET
const envVariables = {
  prefix: process.env.APPW_KEY_PREFIX,
  bucket: process.env.APPW_BUCKET,
  role: process.env.APPW_ROLE,
  env: process.env.APPW_ENV
}
try {
  appw.settings(envVariables)
  if (process.env.ES_HOST) {
    elasticSearch.settings(new Client({ node: `https://${process.env.ES_HOST}` }))
  }
  tagging.settings({ elasticSearch })
} catch (error) {
  console.log(error)
}

/*
const assetCredentials = new AWS.ChainableTemporaryCredentials({
  params: {
    RoleArn: process.env.MEDIA_ROLE
  }
})
*/
const msS3 = new AWS.S3(/* { credentials: assetCredentials } */)
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })

if (process.env.MS_API_KEY) {
  mediaSyndication.settings({
    host: 'media-syndication.api.bbci.co.uk',
    api_key: process.env.MS_API_KEY
  })
}

const transport = async (operation, s3Location, pid) => {
  console.log('transport', operation, s3Location, pid)
  s3Location = s3Location.replace('s3:/', '')
  switch (operation) {
    case 'MODIFY':
    case 'INSERT':
      var params = {
        CopySource: s3Location,
        Bucket: destinationBucket,
        Key: `${pid}.mp4`,
        ACL: 'bucket-owner-full-control'
      }
      console.log('Params are', params)
      try {
        await msS3.copyObject(params).promise()
        console.log('Inserted')
      } catch (e) {
        console.log('error ', e)
      }
      break
    case 'REMOVE':
      try {
        await msS3.deleteObject({
          Bucket: process.env.OUTPUT_BUCKET,
          Key: `${pid}.mp4`
        }).promise()
        console.log('Removed')
      } catch (e) {
        console.log('error ', e)
      }
      break
    default:
      console.log('Not recognised ', operation)
  }
}

/*
{"content_version_id":"pips-pid-p08jyzsp","mediaset":"ws-partner-download","media_assets":[{"drm":"none","media_asset_id":"pips-pid-p08jz13q","sequence_stamp":1594024839001000,"profile_id":"pips-map_id-av_pv10_pa4","uri":"s3://livemodavdistributionresources-distributionbucket-182btg2y28f33/av_pv10_pa4/modav/bUnknown-490d35a9-4eca-4fa2-b781-754229aab2a8_p08jyzsp_cUnknown_1594024535442.mp4","last_updated":"2020-07-06T08:40:49.553Z"}]}
*/
const backfill = async (pids, profileId) => {
  const promises = []
  pids.forEach((pid) => {
    promises.push(mediaSyndication.get(pid))
  })
  const docs = await Promise.all(promises)
  const morePromises = []
  docs.forEach((doc) => {
    const pid = doc.content_version_id.replace('pips-pid-', '')
    const asset = doc.media_assets.find((ma) => ma.profile_id === profileId)
    morePromises.push(transport('INSERT', asset.uri, pid))
  })
  return Promise.all(morePromises)
}

/*
{
  "content_version_id":"pips-pid-p08jxw47",
  "drm":"none",
  "media_asset_id":"pips-pid-p08jxwcm",
  "sequence_stamp":1593962969001000,
  "profile_id":"pips-map_id-av_pv10_pa4",
  "uri":"s3://livemodavdistributionresources-distributionbucket-182btg2y28f33/av_pv10_pa4/modav/bUnknown-99ae4cde-ecc1-4a12-b2dd-71d336ba3f55_p08jxw47_cUnknown_1593962904250.mp4",
  "last_updated":"2020-07-05T15:29:40.147Z",
  "event_name":"INSERT"
}
*/

exports.handler = async (event, context) => {
  // console.log("Received event:", JSON.stringify(event, null, 2));
  let message
  const m = event.Records[0]
  let eventSource
  if (m.eventSource) {
    eventSource = m.eventSource
  } else if (m.EventSource) {
    eventSource = m.EventSource
  }
  switch (eventSource) {
    case 'aws:sns':
      message = m.Sns.Message
      break
    case 'aws:sqs':
      message = m.body
      break
    default:
      message = 'unknown'
  }
  console.log(message)
  if (message == 'unknown') return undefined
  const sns = JSON.parse(message)
  const profileId = sns.profile_id
  if (sns.backfill) {
    return backfill(sns.pids, sns.profile_id)
  }
  const contentVersionId = sns.content_version_id
  const pid = contentVersionId.split('pips-pid-')[1]
  try {
    const response = await appw.get('version', pid)
    const link = response.pips.version.version_of.link
    let masterBrand = ''
    switch (link.rel.split('pips-meta:')[1]) {
      case 'clip': {
        const wantedProfileId = process.env.CLIP_PROFILE_ID
        if (profileId === wantedProfileId) {
          const clip = await appw.get('clip', link.pid)
          masterBrand = clip.pips.master_brand_for.master_brand.mid
          if (masterBrand === 'bbc_webonly') {
            const tag = await tagging.getTag(clip.pips.clip.pid)
            if (tag) {
              const lang = tagging.tag2lang(tag)
              console.log('lang', lang)
              masterBrand = `bbc_${lang}_tv`
            }
          }
          console.log('Clip Master brand is', masterBrand)
        } else {
          console.log('Profile ID was not ' + wantedProfileId, message)
        }
      }
        break
      case 'episode': {
        const wantedProfileId = process.env.EPISODE_PROFILE_ID
        if (profileId === wantedProfileId) {
          const episode = await appw.get('episode', link.pid)
          masterBrand = episode.pips.master_brand_for.master_brand.mid
          console.log('Episode Master brand is ', masterBrand)
        } else {
          console.log('Profile ID was not ' + wantedProfileId, message)
        }
      }
        break
      default: // DO NOTHING
    }
    const t = await ddb.scan({ TableName: configTable }).promise()
    const wantedMasterBrands = t.Items.map(item => item.mid.S)
    console.log('wantedMasterBrands', wantedMasterBrands)
    if (wantedMasterBrands.includes(masterBrand)) {
      console.log('wanted masterbrand')
      try {
        await transport(sns.event_name, sns.uri, pid)
      } catch (error) {
        console.log(error)
      }
    }
  } catch (error) {
    console.log('Error! ', error)
  }
  return undefined
}
