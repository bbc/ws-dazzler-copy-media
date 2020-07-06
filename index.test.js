/* eslint-disable no-undef */
const uut = require('./index')

var event = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn:
        'arn:aws:sns:eu-west-1:294595276257:LiveMsdrPercolatorWorldServicePartnersResources-NotificationsTopic-10ZP19CXN5F82:01ea9877-bbbf-47af-a8eb-6d013f9f44ea',
      Sns: {
        Type: 'Notification',
        MessageId: 'e98342c1-fdea-5a5f-b155-14b5db1261f5',
        TopicArn:
          'arn:aws:sns:eu-west-1:294595276257:LiveMsdrPercolatorWorldServicePartnersResources-NotificationsTopic-10ZP19CXN5F82',
        Subject: null,
        Message:
          '{"content_version_id":"pips-pid-p07qtqhw","drm":"none","media_asset_id":"pips-pid-p07qtrvv","sequence_stamp":1570807107001000,"profile_id":"pips-map_id-a_od_p006","uri":"https://dazzler-test-bucket.s3-eu-west-1.amazonaws.com/av_pv10_pa4/modav/bUnknown-1ba9cc05-8aed-41cd-9a9e-8112579db9d9_w1msh390zxm7wrt_cUnknown_1576245484850.mp4","last_updated":"2019-10-11T15:18:51.380Z","event_name":"INSERT"}',
        Timestamp: '2019-12-18T13:08:08.066Z',
        SignatureVersion: '1',
        Signature:
          'LkLMPn+1iBBSb9Qf6p/ZawAq82U9OLacijbzO+DfbnVN/qQGSwzs0fnBoGfdXVO+R35wPfxhiZ+WxxIjaIrxU+wiGCqMnqzFsv8dP/W2qwaeahshDxIqFCOKW7ytDMy60fr8OiAwtob996miwCj5hRlh3teOlv7zNhzvjptiN5Jsbsl28YRqcZykpaboN8xLeKlw3fgL9fFvqiIX1owrGzMgR3cOP8d+YgxEEifdXNztCSkriz0+sMcYi4GJDezAVO5Hz3lPNS8iy+VMHfCS6BOU8wsTT8fwbZfSF9zNKacugpu7w/mhxEjkNnBdFfFZ2e+abjecv0uAeXyRhBdO7g==',
        SigningCertUrl:
          'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-6aad65c2f9911b05cd53efda11f913f9.pem',
        UnsubscribeUrl:
          'https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:294595276257:LiveMsdrPercolatorWorldServicePartnersResources-NotificationsTopic-10ZP19CXN5F82:01ea9877-bbbf-47af-a8eb-6d013f9f44ea',
        MessageAttributes: {}
      }
    }
  ]
}
var context = {
  callbackWaitsForEmptyEventLoop: true,
  logGroupName:
    '/aws/lambda/MediaSyndicationApiNotificationsHandlerForPartners',
  logStreamName: '2019/12/17/[$LATEST]f2b113501a774ddb97437e9d18fc6358',
  functionName: 'MediaSyndicationApiNotificationsHandlerForPartners',
  memoryLimitInMB: '128',
  functionVersion: '$LATEST',
  invokeid: '3191d65c-5040-4743-8826-0379b2b9059f',
  awsRequestId: '3191d65c-5040-4743-8826-0379b2b9059f',
  invokedFunctionArn:
    'arn:aws:lambda:eu-west-1:205979497597:function:MediaSyndicationApiNotificationsHandlerForPartners'
}

test('handler', async () => {
  const r = await uut.handler(event, context)
  expect(r).toBe(undefined)
})
