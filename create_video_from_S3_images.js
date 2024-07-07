//create a video from a set of images from an S3-Cloudfront url using fluent-ffmpeg
const ffmpeg = require('fluent-ffmpeg')
// ffmpeg.setFfmpegPath('./ffmpeg_bin/ffmpeg.exe')
// ffmpeg.setFfprobePath('./ffmpeg_bin/ffprobe.exe')

const fs = require('fs')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const dotenv = require('dotenv')
const { image_codes } = require('./jma_image_codes.js')

dotenv.config()

async function createVideoFromImages(image_bucket_dir = 'weather-data/satellite/public-images', image_prefix = 'au__snd_') {
  //input images directory
  // const inputImagesPath = path.join(__dirname, imagesDirectory, `${image_prefix}%04d.jpg`)  //local path setup - not used
  const inputImagesLoc = process.env.MY_AWS_CLOUDFRONT_URL + `${image_bucket_dir}/${image_prefix}/${image_prefix}%04d.jpg`

  //temporary local file for ffmpeg output
  const outputLocalFile = './tmp/temp_video.mp4'

  //run ffmpeg
  console.log('[createVideoFromImages] creating mp4 from image sequence ..')
  return new Promise((resolve, reject) => {
    ffmpeg()
      .outputOptions('-r 8') //number of frames per second (8 works well for 10 minute intervals)
      .duration('00:00:20') // Set the max duration of the video - make sure the output is less than this or it will have been truncated
      .addInput(inputImagesLoc) // Assumes images are named sequentially (0001.jpg, 0002.jpg, ...)
      .inputOptions('-r 8') //seems to set the output frame rate funnily enough (8 works well for 10 minute intervals)
      .outputFormat('mp4')
      .output(outputLocalFile)
      .videoCodec('libx264')
      .size('900x700')
      .on('end', () => {
        console.log('video saved to local fs')
        resolve()
      })

      .on('error', err => {
        console.error('An error occurred: ' + err.message)
        reject(err)
      })
      .run()
  })
}

async function push_video_to_s3(image_prefix = 'aus_snd_', local_video_loc = './tmp/temp_video.mp4', video_bucket_dir = 'weather-data/satellite/public-videos') {
  //objectKey for S3 bucket
  const objectKey = `${video_bucket_dir}/${image_prefix}.mp4`

  console.log('[push_video_to_s3] : uploading video [', local_video_loc, '] to S3 ...')

  try {
    // create an S3 client
    const s3Client = new S3Client({
      region: process.env.MY_AWS_REGION,
      credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
      }
    })

    //read local file
    const data = fs.readFileSync(local_video_loc)

    //S3 put object command
    const command = new PutObjectCommand({
      Bucket: process.env.MY_AWS_BUCKET_NAME,
      Key: objectKey,
      Body: data,
      ContentType: 'video/mp4'
    })

    //run command to push the video to S3
    const response = await s3Client.send(command)
    console.log(`Successful upload of video to S3 on ${new Date()}`)
  } catch (err) {
    console.log(err)
  }
}

// //testing
// const my_image_code = 'aus_snd'
// const my_image_prefix = image_codes[my_image_code]['image_code']
// //
// createVideoFromImages((image_bucket_dir = 'weather-data/satellite/public-images'), (image_prefix = my_image_prefix))
//   .then(() => push_video_to_s3((image_prefix = my_image_prefix), (local_video_loc = './tmp/temp_video.mp4'), (video_bucket_dir = 'weather-data/satellite/public-videos')))
//   .then(() => console.log('Video upload complete'))

module.exports = { createVideoFromImages, push_video_to_s3 }
