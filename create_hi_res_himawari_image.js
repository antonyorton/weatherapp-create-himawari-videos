var himawari = require('@ungoldman/himawari')
const path = require('path')
const fs = require('fs')
const ProgressBar = require('progress')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const dotenv = require('dotenv')
dotenv.config()

let bar = null

function createProgressBar(total) {
  return new ProgressBar('Downloading satellite images [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function himawariBG(opts) {
  const outfile = opts.outfile //save directory

  //delete all files in the save_dir
  const save_dir = path.dirname(outfile)
  fs.readdir(save_dir, (err, files) => {
    if (err) throw err
    else {
      for (const file of files) {
        fs.unlink(path.join(save_dir, file), err => {
          if (err) throw err
        })
      }
    }
  })

  return new Promise((resolve, reject) => {
    himawari({
      zoom: opts.zoom || 3,
      outfile,
      date: opts.date || 'latest',
      debug: opts.debug || false,
      infrared: opts.infrared || false,
      parallel: opts.parallel | true,
      timeout: opts.timeout || 30000,
      chunk: function (info) {
        bar = bar || createProgressBar(info.total)
        bar.tick()
      },
      error: function (err) {
        console.log(err)
        // reject(err)
      },
      success: async function () {
        await sleep(250) // add delay to avoid flash of system bg
        console.log('Complete!')
        resolve()
      }
    })
  })
}

async function create_himawari_image() {
  let date = new Date()
  date.setHours(date.getHours() - 3) //3 hours ago
  date.setMinutes(0)
  date.setSeconds(0)
  date = date.toISOString().slice(0, 19).replace('T', ' ') //convert date to format 'YYYY-MM-DD HH:MM:SS'

  //options for image generation
  const myopts = {
    zoom: 3,
    outfile: `./tmp/himawari.jpg`,
    date: 'latest',
    timeout: 60000,
    infrared: false, //never had much luck on infrared
    parallel: true,
    debug: false
  }

  try {
    await himawariBG(myopts)
    console.log('created high res himawari image.')
    await sleep(1000)
    const objectKey = 'weather-data/satellite/public-hi-res-images/himawari.jpg'
    const file = fs.readFileSync(myopts.outfile)
    await pushToS3(file, objectKey)
    console.log('pushed image to S3')
  } catch (err) {
    console.log(err)
  }
}

async function pushToS3(data, objectKey) {
  // create an S3 client
  try {
    const s3Client = new S3Client({
      region: process.env.MY_AWS_REGION,
      credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
      }
    })

    //S3 put object command
    const command = new PutObjectCommand({
      Bucket: process.env.MY_AWS_BUCKET_NAME,
      Key: objectKey,
      Body: data,
      ContentType: 'image/jpg'
    })
    //run command to push the video to S3
    const response = await s3Client.send(command)
  } catch (err) {
    console.log('Error pushing image to S3: ', err.message)
  }
}

// create_himawari_image().then(() => console.log('image created'))

module.exports = { create_himawari_image }
