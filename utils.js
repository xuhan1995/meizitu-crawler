const rp = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')
const chalk = require('chalk')
var path = require('path')
const basePath = './albums/'


module.exports = {
  getPageResponse: async url => {
    return await rp({ url })
  },

  getAlbumUrls: res => {
    try {
      const $ = cheerio.load(res)
      const albumsInfo = []
      $('#pins img').each((i, e) => {
        const album = {
          name: e.attribs.alt,
          url: e.parent.attribs.href
        }
        albumsInfo.push(album)
      })
      return albumsInfo 
    } catch (error) {
        throw error      
    }
  },

  createAlbumDir: async (album, nowPageNum) => {
    const cachePath = basePath + album.name
    if (fs.existsSync(cachePath)) {
      console.log(
        chalk.red(`第${nowPageNum}页=>文件"${cachePath}"已存在`)
      )
      const albumPath = path.resolve(cachePath)
      const repeat = await new Promise((resolve, reject) => {
        fs.readdir(albumPath, (err, files) => {
          if (err) {
            throw err
            reject()
          }
          let count = 0
          files.forEach((filename) => {
            const file = path.join(albumPath, filename)
            count++
            console.log(file)
            console.log(count)
          })
          resolve(count)
        })
      })
      console.log('======================================', repeat)
      return [true, cachePath, repeat]
    }else{
      fs.mkdirSync(cachePath)
      console.log(
        chalk.yellow(`第${nowPageNum}页=>文件夹"${cachePath}"创建成功`)
      )
      return [false, cachePath, 0]
    }
  },

  getImgNums: (res, cachePath) => {
    try {
      const $ = cheerio.load(res)
      const len = $('.pagenavi span').length
      if (!len) {
        fs.rmdirSync(cachePath)
        return 0
      }
      return $('.pagenavi span')[len - 2].children[0].data
    } catch (error) {
      throw error
    }
  },

  getImgUrl: res => {
    try {
      const $ = cheerio.load(res)
      return $('.main-image img')[0].attribs.src
    } catch (error) {
      throw error
    }
  },

  rmCachePath: async (cachePath, repeat) => {
    const albumPath = path.resolve(cachePath)
    if (repeat) {
      return await new Promise((resolve, reject) => {
        fs.readdir(albumPath, (err, files) => {
          if (err) {
            throw err
            reject()
          }
          files.forEach((filename) => {
              const filePath = path.join(albumPath, filename)
              fs.unlinkSync(`${filePath}`)
          })
          fs.rmdirSync(albumPath)
          resolve('文件夹删除完毕')
        })
      })
    }
    fs.rmdirSync(albumPath)
  },

  downloadImg: async(imgPageUrl, imgUrl, cachePath, index) => {
    if (imgUrl) {
      let headers = {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Host: "i.meizitu.net",
        Pragma: "no-cache",
        "Proxy-Connection": "keep-alive",
        Referer: imgPageUrl,
        "Upgrade-Insecure-Requests": 1,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.19 Safari/537.36"
      };//反防盗链
      await rp({  //await保证爬完一张才打log下载成功
        url: imgUrl,
        resolveWithFullResponse: true,
        headers
      }).pipe(fs.createWriteStream(`${cachePath}/${index}.jpg`))
      console.log(
        chalk.green(`${cachePath}/${index}.jpg下载成功`)
      )
    } else {
      console.log(
        chalk.red(`${imgUrl}图片不存在`)
      )
    }
  }
}