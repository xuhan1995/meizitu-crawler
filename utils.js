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

  createAlbumDir: (album, nowPageNum) => {
    const cachePath = basePath + album.name
    if (fs.existsSync(cachePath)) {
      console.log(
        chalk.red(`第${nowPageNum}页=>文件"${cachePath}"已存在`)
      )
      const albumPath = path.resolve(cachePath)
      let count = 0
      files = fs.readdirSync(albumPath)
      files.forEach((filename) => {
        count++
      })
      const alreadyDownload = count
      return [cachePath, alreadyDownload]
    }else{
      fs.mkdirSync(cachePath)
      console.log(
        chalk.yellow(`第${nowPageNum}页=>文件夹"${cachePath}"创建成功`)
      )
      return [cachePath, 0]
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
      return Number($('.pagenavi span')[len - 2].children[0].data)
    } catch (error) {
      throw error
    }
  },

  getImgUrl: res => {
    try {
      const $ = cheerio.load(res)
      const img = $('.main-image img')[0]
      if (img) {
        return img.attribs.src
      }
    } catch (error) {
      throw error
    }
  },

  rmCachePath: (cachePath, alreadyDownload, imgNums) => {
    const albumPath = path.resolve(cachePath)
    if (alreadyDownload) {  //不为0说明没下载完，需要删除所有图片
      files = fs.readdirSync(albumPath)
      files.forEach((filename) => {
          const filePath = path.join(albumPath, filename)
          fs.unlinkSync(`${filePath}`)
          console.log(
            chalk.blue(`${cachePath} => 有${alreadyDownload}张，应有${imgNums}张,删除成功`)
          )
      })
    }
  },

  downloadImg: async(imgPageUrl, imgUrl, cachePath, index) => {
      try {
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
      } catch (error) {
        console.log(
          chalk.red(`${imgUrl}图片不存在`)
        )
        throw error
      }
    }
  }