"use strict";

let assert = require('assert')
let request = require('request')
// let history = require('history')

// 聊天室

// GPS 名词
// latitude 纬度
// longitude 经度
// accuracy 精确度

function getNextRoomID (rs, cb) {
  let nextroomid = 'nextroom__id'
  rs.getObject(nextroomid, function (objid, obj) {
    if (obj) {
      rs.setObject(nextroomid, {id: obj.id + 1}, function (objid, result) {
        cb(obj.id + 1)
      })
    } else {
      rs.setObject(nextroomid, {id: 12122}, function (objid, result) {
        cb(12122)
      })
    }
  })
}

let createRoomIDList = 'createRoomIDList'
let enterRoomIDList = 'enterRoomIDList'

function addCreateRoomLink (rs, userid, roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  let userCreateRooms = createRoomIDList + '_' + userid
  rs.getObject(userCreateRooms, function (objid, roomlist) {
    if (roomlist) {
      roomlist.push(roomid)
      rs.setObject(userCreateRooms, roomlist, function (objid, result) {
        logger.info('set user create room list 1', roomlist, result)
        cb(result)
      })
    } else {
      roomlist = [roomid]
      rs.setObject(userCreateRooms, roomlist, function (objid, result) {
        logger.info('set user create room list 2', roomlist, result)
        cb(result)
      })
    }
  })
}

function createRoomEvent(id, cb) {
   let thisRuntime = getCurrentRuntime()
   let logger = thisRuntime.getLogger()
   let em = thisRuntime.getGlobalEventManager();
    // em.createEvent("message_" + id, function() {

    // })

    
    // em.createEvent('bbs_' + id, function() {

    // })

    // em.createEvent('user_' + id, function () {

    // })

    // em.createEvent('destroy_' + id, function() {

    // })

    let eventName = 'room_event_' + id;
    em.createEvent(eventName, function() {
      logger.info('create event', eventName)
      cb()
    })
}

// gps = null or {latitude: 0.0, longitude: 1.1, accuracy: 10}
function createRoom (userid, roomname, expiretime, gps, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start create room.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  getNextRoomID(rs, function (id) {
    let newRoom = {
      id: id,
      admin: userid,
      expire: expiretime,
      name: roomname,
      users: [userid],
      history: [],
      gps: gps,
      enableGPS: gps === null,
      time: new Date().getTime()
    }

    logger.info('set object', id, newRoom)
    rs.setObject(id, newRoom, function (objid, result) {
      addCreateRoomLink(rs, userid, id, function () {
        createRoomEvent(id, function(){
          cb(result ? newRoom : null)
        })
      })
    })
  })
}

// 显示已创建的房间
function listChatRoom (userid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start list room.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  let userCreateRooms = createRoomIDList + '_' + userid
  logger.info('userCreateRooms', userCreateRooms)
  rs.getObject(userCreateRooms, function (objid, roomlist) {
    logger.info('roomlist', roomlist)
    cb(roomlist ? roomlist : [])
  })
}

// 显示所有进入的房间
function listAllChatRoom (userid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start list all room.')
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  let userEnterRooms = enterRoomIDList + '_' + userid

  rs.getObject(userEnterRooms, function (objid, roomlist) {
    cb(roomlist || [])
  })
}

function removeCreateRooms (rs, userid, roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start remove create room.')

  let userCreateRooms = createRoomIDList + '_' + userid
  rs.getObject(userCreateRooms, function (objid, roomlist) {
    if (roomlist) {
      for (let index in roomlist) {
        if (roomid == roomlist[index]) {
          roomlist.splice(index, 1)
          logger.info('after remove list', roomlist, roomid)
          rs.setObject(userCreateRooms, roomlist, function (objid, result) {
            logger.info('remove callback', result)
            cb(result)
          })
          break
        }
      }
      cb(true)
      logger.info('could not get roomid', roomid, 'in roomlist', roomlist)
    } else {
      cb(true)
      logger.info('could not get create rooms', userCreateRooms, roomlist)
    }
  })
}

function removeEnterRooms (rs, userid, roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start remove enter room.')

  let userEnterRooms = enterRoomIDList + '_' + userid
  rs.getObject(userEnterRooms, function (objid, roomlist) {
    if (roomlist) {
      for (let index in roomlist) {
        if (roomid == roomlist[index]) {
          roomlist.splice(index, 1)
          logger.info('after remove list', roomlist, roomid)
          rs.setObject(userEnterRooms, roomlist, function (objid, result) {
            logger.info('remove callback', result)
            cb(result)
          })
          break
        }
      }
      cb(true)
      logger.info('could not get roomid', roomid, 'in roomlist', roomlist)
    } else {
      cb(true)
      logger.info('could not get enter rooms', userEnterRooms, roomlist)
    }
  })
}

function destroyChatRoom (userid, roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start destroy room.', userid, roomid)
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  removeCreateRooms(rs, userid, roomid, function (result) {
    if (result) {
      removeEnterRooms(rs, userid, roomid, function (result) {
        if (result) {
          rs.removeObject(roomid, function (objid, ret) {
            let em = thisRuntime.getGlobalEventManager();
            let eventName = 'room_event_' + roomid;
            em.removeEvent(eventName, function(){})
            cb(ret)
            // let em = thisRuntime.getGlobalEventManager()
            // em.fireEvent('destroy_' + id, roomid)
          })
        } else {
          cb(false)
        }
      })
    } else {
      cb(false)
    }
  })
}

function getRoomInfo (roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getRoomInfo.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    cb(roominfo)
  })
}

// 获取公告板
function getBBS (roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getBBS.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    cb({
      bbs: roominfo.bbs,
      time: roominfo.bbsTime
    })
  })
}

function setBBS (userid, roomid, bbs, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getBBS.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo.admin != userid) {
      cb(false)
    } else {
      roominfo.bbs = bbs
      roominfo.bbsTime = new Date().getTime()
      rs.setObject(roomid, roominfo, function () {})
      cb(true)

      let em = thisRuntime.getGlobalEventManager()
      let eventName = 'room_event_' + roomid
      em.fireEvent(eventName, JSON.stringify({eventType: 'bbs', value1 :roominfo.bbs, value2:roominfo.bbsTime}));
      logger.info('fire event bbs', eventName, roomid, roominfo.bbs, roominfo.bbsTime)
    }
  })
}

function getAdmin (roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getAdmin.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo) {
      cb(roominfo.admin)
    } else {
      cb(-1)
    }
  })
}

let chatRoomPackge = null;
let chatRoomModules = {};

function getChatRoomPackage(cb) {
    if (chatRoomPackge) {
        cb(chatRoomPackge);
    } else {
        let thisRuntime = getCurrentRuntime();
        thisRuntime.loadXARPackage('chatroom', function (pkg) {
            chatRoomPackge = pkg;
            cb(pkg);
        });
    }
}

function getChatRoomModuleByName(name, cb) {
    if (chatRoomModules[name]) {
        cb(chatRoomModules[name]);
    } else {
        getChatRoomPackage(function (pkg) {
            pkg.loadModule(name, function (mod) {
                chatRoomModules[name] = mod;
                cb(mod);
            })
        })
    }
}

function getChatRoomModule(cb) {
    getChatRoomModuleByName('chatroom', cb);
}

function getChatUserModule(cb) {
    getChatRoomModuleByName('chatuser', cb);
}

function getHistoryModule(cb) {
    getChatRoomModuleByName('history', cb);
}

function addEnterRoomLink (rs, roomid, userid, cb) {
  let userEnterRooms = enterRoomIDList + '_' + userid
  rs.getObject(userEnterRooms, function (objid, roomlist) {
    if (roomlist) {
      if (roomlist.indexOf(roomid) == -1) {
        roomlist.push(roomid)
      }
      rs.setObject(userEnterRooms, roomlist, function (objid, result) {
        cb(result)
      })
    } else {
      roomlist = [roomid]
      rs.setObject(userEnterRooms, roomlist, function (objid, result) {
        cb(result)
      })
    }
  })
}

// return
// 0 成功
// 1 需要gps
// 2 失败, GPS失败
// 3 找不到roomid

// gps = null or {latitude: 0.0, longitude: 1.1, accuracy: 10}
function enterChatRoom (roomid, userid, gps, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start enterChatRoom.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo) {

      // 已经进入,直接返回成功
      for (let index in roominfo.users) {
        if (roominfo.users[index] == userid) {
          cb(0)
          return
        }
      }

      // 添加用户到当前room
      if (roominfo.enableGPS) {
        // 比较GPS
        // 假定经纬度偏差绝对值都是30度
        if (gps == null) {
          cb(1)
          return
        } else {
          let delta = 30
          if (Math.abs(gps.latitude - roominfo.gps.latitude) < delta &&
            Math.abs(gps.longitude - roominfo.gps.longitude)) {
            cb(1)
          } else {
            cb(2)
            return
          }
        }
      } else {
        roominfo.users.push(userid)
        rs.setObject(roomid, roominfo, function (objid, result) {
          getHistoryModule(function(history) {
            getChatUserModule(function (chatuser) {
              chatuser.getUserInfo(userid, function(userinfo) {
                history.addHistory(roomid, null, null, `${userinfo.nickName} 进入房间`, 2, function() {

                })
              })
            })
           
          })
        })
      }
      
      addEnterRoomLink(rs, roomid, userid, function(){
          cb(0)
      })
    } else {
      cb(3)
    }
  })
}

function leaveChatRoom (roomid, userid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start leaveChatRoom.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo) {
      for (let index in roominfo.users) {
        if (roominfo.users[index] == userid) {
          roominfo.users.splice(index, 1)
          cb(true)

          getHistoryModule(function(history) {
            getChatUserModule(function (chatuser) {
              chatuser.getUserInfo(userid, function(userinfo) {
                history.addHistory(roomid, null, null, `${userinfo.nickName} 离开房间`, 2, function() {

                })
              })
            })
           
          })

          rs.setObject(roomid, roominfo, function () {})

          let userEnterRooms = enterRoomIDList + '_' + userid
          rs.getObject(userEnterRooms, function (objid, roomlist) {
            if (roomlist) {
              let idx = roomlist.indexOf(roomid)
              if (idx != -1) {
                roomlist.splice(idx)
              }
              rs.setObject(userEnterRooms, roomlist, function () {})
            }
          })
          return
        }
      }

      cb(false)
    } else {
      cb(false)
    }
  })
}

function getUserCount (roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getUserCount.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo) {
      cb(roominfo.users.length)
    } else {
      cb(0)
    }
  })
}

// start, end 用于分页
function getUserList (roomid, start, end, cb) {
  // 返回 user id list
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getUserList.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo) {
      cb(roominfo.users.slice(start, end))
    } else {
      cb([])
    }
  })
}

function getHistoryCount (roomid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getHistoryCount.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo) {
      cb(roominfo.history.length)
    } else {
      cb([])
    }
  })
}

// start, end 用于分页
function getHistoryList (roomid, start, end, cb) {
  // 返回record id list
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getHistoryList.', roomid, start, end)
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo) {
      logger.info('history list length,', roominfo.history.length)
      if (end <= 0 || end > roominfo.history.length) {
        end = 0
      }
      if (start <= 0 || start > roominfo.history.length) {
        start = 0
      }
      cb(roominfo.history.slice(start, end))
    } else {
      logger.error('could not find roomid,', roomid)
      cb([])
    }
  })
}

function getHistoryListInfo (roomid, start, end, cb) {
  getHistoryList(roomid, start, end, function (idList) {
    if (idList.length == 0) {
      cb([])
    } else {
      let cnt = 0
      let info = []
      for (let i = 0; i < idList.length; i++) {
        history.getHistory(idList[i], function (info) {
          cnt++
          info.push(info)
          if (cnt == idList.length) {
            cb(info)
          }
        })
      }
    }
  })
}

/*由于此处涉及私有appid,secret,对外发布的代码GetQRCode功能将不能直接使用，需填入自己小程序的appid和secret*/

function getToken (cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getToken.')

  let appid = ''
  let secret = ''
  let tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`

  request(tokenUrl, function (err, res, body) {
    cb(err, err === null ? JSON.parse(body) : null)
  })
}

// getToken(function(err, body) {
//     console.log(body)
// })

function getQRFromServer (token, path, width, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getQRFromServer.', token, path, width)

  let url = `https://api.weixin.qq.com/cgi-bin/wxaapp/createwxaqrcode?access_token=${token}`
  request.post({url: url, body: JSON.stringify({path: path, width: width}), encoding: null}, function (err, res, body) {
    if (err === null && res.headers['content-type'] === 'image/jpeg') {
      cb(true, body)
    } else {
      cb(false, JSON.parse(body))
    }
  })
}

function getQR (token, path, width, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getQR.', token, path, width)

  function qrCallback (result, body) {
    if (result) {
      cb(true, body)
    } else {
      console.log('get qr failed, get token now')
      getToken(function (err, tokenInfo) {
        if (tokenInfo) {
          console.log('get token ok')
          getQRFromServer(tokenInfo.access_token, path, width, function (result, body) {
            cb(result, body)
          })
        } else {
          console.log('could not get token')
          cb(false)
        }
      })
    }
  }

  getQRFromServer(token, path, width, qrCallback)
}

// getQR(tokenExpire, 'pages/index?query=1', 430, function (result, body) {
//   console.log(result)
//   if(result) {
//       upload(body, function(result, body) {
//           console.log(body)
//       })
//   }
// })

function upload (buffer, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start upload.')

  var formData = {
    custom_file: {
      value: buffer,
      options: {
        filename: 'topsecret.jpg',
        contentType: 'image/jpg'
      }
    }
  }
  /*微信小程序不支持通过post直接下载图片并显示，这里使用了私有的上传服务器，上传图片文件之后返回http地址*/
  request.post({url: 'private upload server', formData: formData}, function (err, res, body) {
    cb(err === null, JSON.parse(body))
  })
}

let tokenID = 'wxToken'

function getCacheToken (cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getCacheToken.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(tokenID, function (objid, token) {
    if (token) {
      logger.info('get storage token', token)
      cb(token)
    } else {
      logger.info('could not get storage token, get online now')
      getToken(function (result, tokenInfo) {
        if (result) {
          logger.info('get token ok', tokenInfo)
          saveCacheToekn(tokenInfo.access_token, function () {
            cb(tokenInfo.access_token)
          })
        } else {
          logger.info('get online token failed')
          cb(null)
        }
      })
    }
  })
}

function saveCacheToekn (token, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start saveCacheToekn.', token)
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.setObject(tokenID, token, function (objID, objItem) {
    cb(objID, objItem)
  })
}

function getQRCode (path, width, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getQRCode.', path, width)

  getCacheToken(function (token) {
    logger.info('get token', token)
    getQR(tokenExpire, path, width, function (result, body) {
      logger.info('get qr', result)
      if (result) {
        upload(body, function (result, body) {
          logger.info('upload', result, body)
          if (body) {
            cb(body.url)
          } else {
            cb(null)
          }
        })
      } else {
        cb(null)
      }
    })
  })
}

function appendHistory (roomid, historyid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start getHistoryCount.')
  // console.log(arguments)
  
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  rs.getObject(roomid, function (objid, roominfo) {
    if (roominfo) {
      roominfo.history.push(historyid)
      rs.setObject(roomid, roominfo, function (id, ret) {
          //临时写一个事件触发，只通知用户有消息更新了,触发客户端主动拉取
          let em = thisRuntime.getGlobalEventManager()
          let eventName = 'room_event_' + roomid
          em.fireEvent(eventName, JSON.stringify({eventType: 'count'}));
          logger.info('fire event count')
          cb(ret)
      })
    } else {
      cb(false)
    }
  })
}

module.exports = {}
module.exports.createRoom = createRoom
module.exports.listChatRoom = listChatRoom
module.exports.listAllChatRoom = listAllChatRoom
module.exports.destroyChatRoom = destroyChatRoom
module.exports.getRoomInfo = getRoomInfo
module.exports.getBBS = getBBS
module.exports.setBBS = setBBS
module.exports.getAdmin = getAdmin
module.exports.enterChatRoom = enterChatRoom
module.exports.leaveChatRoom = leaveChatRoom
module.exports.getUserCount = getUserCount
module.exports.getUserList = getUserList
module.exports.getHistoryCount = getHistoryCount
module.exports.getHistoryList = getHistoryList
module.exports.getHistoryListInfo = getHistoryListInfo
module.exports.getQRCode = getQRCode
module.exports.appendHistory = appendHistory
