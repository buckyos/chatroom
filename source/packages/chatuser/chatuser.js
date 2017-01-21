'use strict'

let request = require('request')
var crypto = require('crypto')

let md5 = function (str) {
  var md5sum = crypto.createHash(`md5`)
  md5sum.update(str)
  return md5sum.digest(`hex`)
}
/* 由于url包含敏感信息，将appid和secret部分去掉，需填入自己小程序的appid和secret*/
function getOpenID (authCode, cb) {
  let appid = ''
  let secret = ''
  let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${authCode}&grant_type=authorization_code`

  request(url, function (err, resp, body) {
    console.log(body)
    let sessionInfo = JSON.parse(body)
    cb(err, err === null ? sessionInfo.openid : null)
  })
}


//登录step1: 用authorcode创建一个我们自己的userid，用于后续操作。
//暂时没有存储openid和userid的对应关系，以后应该加上，用于其他接口的校验
function login(authorCode, cb) {
    let thisRuntime = getCurrentRuntime()
    let logger = thisRuntime.getLogger()
    logger.info('begin login ',authorCode)
    getOpenID(authorCode, function (err, openid) {
        let userid = ''
        if (openid) {
          userid = md5(openid)
        } else {
          userid = md5(authorCode)
        }
        logger.info('login before cb ', userid)
        cb(userid)
    })
}


// Step2: 用userid,创建或更新一个userInfo，现在先不对userid正确性做校验，以后应该加上
function createUser (userid, nickName, avatarUrl, gender, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start createUser.', userid, nickName, avatarUrl, gender)

  // 兼容之前的openid参数,用openid做为authorCode,必然getOpenID会失败,所以直接对authorCode做md5
  // 如果是真是authorCode,则去微信服务器拿真实openid,然后md5
  // 之后代码中用到的openid,都是md5(openid)
  // console.log(arguments)
    let rs = thisRuntime.getRuntimeStorage('/chatuser/')

    rs.getObject(userid, function (objid, usrObj) {
      logger.info('get userid', userid, 'callback', objid, usrObj)
      var usrInfo = usrObj
      if (usrInfo) {
        usrInfo.nickName = nickName
        usrInfo.avatarUrl = avatarUrl
        usrInfo.gender = gender
      } else {
        logger.info('new user')
        usrInfo = {
            openid: userid,
            nickName: nickName,
            avatarUrl: avatarUrl,
            gender: gender,
        }
      }
      
      rs.setObject(userid, usrInfo, function (objid, res) {
        logger.info('before cb', objid, res)
        cb(usrInfo)
        logger.info('after cb')
      })
    })
}

function getUserInfo (openid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getUserInfo.', openid)
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatuser/')

  rs.getObject(openid, function (objid, usrObj) {
    cb(usrObj)
  })
}

module.exports = {}
module.exports.login = login
module.exports.createUser = createUser
module.exports.getUserInfo = getUserInfo
