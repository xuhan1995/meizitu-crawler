const utils = require('./utils')
const async = require('async')
const chalk = require('chalk')

const baseUrl = 'http://www.mzitu.com/page/'
let nowPageNum, endPageNum, complicatingNum = 0

const main = async url => {
  let albumsInfo = []
  const res = await utils.getPageResponse(url)
  albumsInfo = utils.getAlbumUrls(res)
  downloadAlbums(albumsInfo)
}

const downloadAlbums = albumsInfo => {
  async.mapLimit(albumsInfo, 5, (album, callback) => {
    handleAlum(album, callback)
  },(err, result) => {
    if (err) {
      throw err
    }
    nowPageNum++
    if (nowPageNum <= endPageNum) {
      main(baseUrl + nowPageNum)
    }
    return
  })
}

const handleAlum = async (album, callback) => {
  complicatingNum++
  console.log(`现在的并发数是${complicatingNum},正在爬取${album.url}`)
  let [cachePath, alreadyDownload] = utils.createAlbumDir(album, nowPageNum)
  const res = await utils.getPageResponse(album.url)
  const imgNums = utils.getImgNums(res, cachePath)
  if (alreadyDownload !== imgNums) {
    utils.rmCachePath(cachePath, alreadyDownload, imgNums)
    for (let i = 1; i <= imgNums; i++) {
      const res = await utils.getPageResponse(`${album.url}/${i}`)
      const imgUrl = utils.getImgUrl(res)
      await utils.downloadImg(`${album.url}/${i}`, imgUrl, cachePath, i)  //await保证一次爬取5张图片
    }
  }else {
    console.log(
      chalk.magenta(`${cachePath} => 已经全部下载成功不需要下载`)
    )
  }
  complicatingNum--
  callback(null)
}


process.stdin.setEncoding('utf8')
process.stdout.write('请输入开始爬取的页码:')

process.stdin.on('data', (chunk) => {
  chunk = chunk.slice(0,-2)
  let assgin = Number(chunk)

  if (Number.isNaN(assgin) || assgin < 1 || assgin > 196) {
    if (!nowPageNum) {
      process.stdout.write('请输入正确的开始爬取页码:')
      return
    }
    process.stdout.write('请输入正确的结束爬取页码:')
    return
  }

  if (!nowPageNum) {  //经过上面验证输入，开始页码已经能符合要求
    nowPageNum = assgin
    process.stdout.write('请输入结束爬取的页码:')
  } 
  else{
    if (assgin < nowPageNum) {   //结束页码还需要再判断一下
      process.stdout.write('结束页码不能小于开始页码\n')
      process.stdout.write('请输入正确的结束爬取页码:')
      return
    }
    endPageNum = assgin
    process.stdin.emit('end')
  }
})

process.stdin.on('end', () => {
  process.stdout.write(`开始爬取的页码是${nowPageNum},结束爬取的页码是${endPageNum}\n`)
  main(baseUrl + nowPageNum)
})

