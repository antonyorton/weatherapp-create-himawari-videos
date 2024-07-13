const cron = require('node-cron')
const express = require('express')
const { createVideoFromImages, push_video_to_s3 } = require('./create_video_from_S3_images.js')
const { image_codes } = require('./jma_image_codes.js')
const { create_himawari_image } = require('./create_hi_res_himawari_image.js')

const app = express()
const port = 3001

app.get('/', (req, res) => {
  res.send('Hello from the video-to-s3 Express app!')
})

//render (hobby plan) app is woken up at 15 past the hour from AWS lambda
//run the cron jobs at 20, 25, 30, 35 past the hour

//Cron Job 1. Fetch images for 'aus_snd':
cron.schedule('20 * * * *', () => {
  const myDate = new Date()
  const my_image_code = 'aus_snd'
  const my_image_prefix = image_codes[my_image_code]['image_code']
  //
  createVideoFromImages((image_bucket_dir = 'weather-data/satellite/public-images'), (image_prefix = my_image_prefix))
    .then(() => push_video_to_s3((image_prefix = my_image_prefix), (local_video_loc = './tmp/temp_video.mp4'), (video_bucket_dir = 'weather-data/satellite/public-videos')))
    .then(() => console.log(`Video upload of ${my_image_code} complete. `, 'Node-cron task completed at time: ', myDate.toISOString()))
})

//Cron Job 2. Fetch images for 'se1_snd':
cron.schedule('25 * * * *', () => {
  const myDate = new Date()
  const my_image_code = ' se1_snd'
  const my_image_prefix = image_codes[my_image_code]['image_code']
  //
  createVideoFromImages((image_bucket_dir = 'weather-data/satellite/public-images'), (image_prefix = my_image_prefix))
    .then(() => push_video_to_s3((image_prefix = my_image_prefix), (local_video_loc = './tmp/temp_video.mp4'), (video_bucket_dir = 'weather-data/satellite/public-videos')))
    .then(() => console.log(`Video upload of ${my_image_code} complete. `, 'Node-cron task completed at time: ', myDate.toISOString()))
})

//Cron Job 3. Fetch images for 'pia_snd':
cron.schedule('30 * * * *', () => {
  const myDate = new Date()
  const my_image_code = ' pia_snd'
  const my_image_prefix = image_codes[my_image_code]['image_code']
  //
  createVideoFromImages((image_bucket_dir = 'weather-data/satellite/public-images'), (image_prefix = my_image_prefix))
    .then(() => push_video_to_s3((image_prefix = my_image_prefix), (local_video_loc = './tmp/temp_video.mp4'), (video_bucket_dir = 'weather-data/satellite/public-videos')))
    .then(() => console.log(`Video upload of ${my_image_code} complete. `, 'Node-cron task completed at time: ', myDate.toISOString()))
})

//Cron Job 4. Create hi-res image of full disk
cron.schedule('35 * * * *', () => {
  create_himawari_image().then(() => console.log('image created'))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
