const cron = require('node-cron')
const express = require('express')
const { createVideoFromImages, push_video_to_s3 } = require('./create_video_from_S3_images.js')
const { image_codes } = require('./jma_image_codes.js')

const app = express()
const port = 3001

app.get('/', (req, res) => {
  res.send('Hello from the video-to-s3 Express app!')
})

cron.schedule('0,10,20,30,40,43,50 * * * *', () => {
  const myDate = new Date()
  const my_image_code = 'aus_snd'
  const my_image_prefix = image_codes[my_image_code]['image_code']
  //
  createVideoFromImages((image_bucket_dir = 'weather-data/satellite/public-images'), (image_prefix = my_image_prefix))
    .then(() => push_video_to_s3((image_prefix = my_image_prefix), (local_video_loc = './tmp/temp_video.mp4'), (video_bucket_dir = 'weather-data/satellite/public-videos')))
    .then(() => console.log('Video upload complete. ', 'Node-cron task completed at time: ', myDate.toISOString()))
  //
  // console.log('Node-cron event complete at time: ', myDate.toISOString())
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
