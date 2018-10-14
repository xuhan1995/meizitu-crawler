const utils = require('./utils')
const async = require('async')

const baseUrl = 'http://www.mzitu.com/page/'
let nowPageNum = 1 
const endPageNum = 2
let complicatingNum = 0

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
    if (nowPageNum <= endPageNum) {
      nowPageNum++
    }
    main(baseUrl + nowPageNum)
  })
}

const handleAlum = async (album, callback) => {
  complicatingNum++
  console.log(`现在的并发数是${complicatingNum},正在爬取${album.url}`)
  let [exist, cachePath, repeat] = await utils.createAlbumDir(album, nowPageNum)
  console.log('##############################################################')
  const res = await utils.getPageResponse(album.url)
  const imgNums = utils.getImgNums(res, cachePath)
  if (!exist) {
    // await utils.rmCachePath(cachePath, repeat)
    album.imgs = []
    for (let i = 1; i <= imgNums; i++) {
      const res = await utils.getPageResponse(`${album.url}/${i}`)
      const imgUrl = utils.getImgUrl(res)
      const obj = {
        number : i,
        imgUrl
      }
      album.imgs.push(obj)
      await utils.downloadImg(`${album.url}/${i}`, imgUrl, cachePath, i)  //await保证一次爬取5张图片
    }
  }
  setTimeout(() => {
    complicatingNum--
    callback(null)
  }, 0)
}

main(baseUrl + nowPageNum)