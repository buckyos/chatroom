'use strict'

let core = require('../bucky/wx_core')

let openIDKey = 'openid'
let userInfokey = 'userinfo'
let openID = null

let cachedUserInfos = {}
let cachedRoomInfos = {}
let windowHeight = 0
let windowWidth = 0
let rpxRatio = 0.0
let selfUserInfo = null
let customRoominfo = {}
let roomUpdateCallback = {}

let localmodules = {}

function setOpenID (id, cb) {
  wx.setStorageSync(openIDKey, id)
  openID = id
}

function getOpenID (cb) {
  if (openID) {
    return openID
  } else {
    openID = wx.getStorageSync(openIDKey)
    return openID
  }
}

function loadPackageModule(packageName, moduleName, cb) {
  if(localmodules[packageName+"_"+moduleName]){
    cb(localmodules[packageName+"_"+moduleName])
  } else {
    let thisRuntime = core.getCurrentRuntime()
    thisRuntime.loadXARPackage(packageName, function(pkg) {
      console.assert(pkg != null)
      pkg.loadModule(moduleName, function(mod) {
        console.assert(mod != null)
        localmodules[packageName+"_"+moduleName] = mod
        cb(mod)
      })
    })
  }
  
}

function getChatRoomModule (cb) {
  loadPackageModule('chatroom', 'chatroom', cb);
}

function getChatUserModule (cb) {
  loadPackageModule('chatuser', 'chatuser', cb);
}

function getHistoryModule (cb) {
  loadPackageModule('history', 'history', cb);
}

function buckyReady (appConfig, packages, cb) {
  let tacApp = new core.Application()
  core.setCurrentApp(tacApp)
  tacApp.init(appConfig, function (errorCode, metaInfo) {
    core.initCurrentRuntime(packages)
    console.log('tac app init completed')
    let thisRuntime = core.getCurrentRuntime();
    let km = thisRuntime.getKnowledgeManager();
    km.dependKnowledge("global.loadrules",core.InfoNode.TYPE_OBJECT);
    km.dependKnowledge("global.storages",core.InfoNode.TYPE_MAP);
    km.dependKnowledge("global.devices",core.InfoNode.TYPE_MAP);
    km.ready(function(isReady){
      if (isReady) {
        console.log("update knowledge ok");
        cb();
      } else {
        console.log("update knowledge failed");
      }
    });
  })
}

function enterChatRoom (roomid) {
  let openid = getOpenID()

  getChatRoomModule(function (chatroom) {
    chatroom.getRoomInfo(roomid, function (roominfo) {
      console.log('roominfo', roominfo)
      if (roominfo) {
        chatroom.enterChatRoom(roomid, openid, function (result) {
          console.log('enter chat room result', result)
          if (result) {
            wx.navigateTo({
              url: `../chatroom/chatroom?id=${roominfo.id}`
            })
          } else if (false) {
            wx.getLocation({
              type: 'gcj02', // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
              success: function (res) {
                enterChatRoom(roomid, openid, res.latitude, res.longitude)
              },
              fail: function () {
                wx.showToast({title: '房主限定了加入位置，无法进入!'})
              }
            })
          } else {
            wx.showToast({title: '进入房间失败'})
          }
        })
      } else {
        wx.showToast({
          title: `找不到房间ID:${roomid}`
        })
      }
    })
  })
}

function getRoomInfoByRoomIds (rooms, cb) {
  getChatRoomModule(function (chatroom) {
    if (rooms.length == 0) {
      cb([])
    } else {
      let roomIndex = 0
      let roomInfos = []
      function getRoomInfoCallback (roomInfo) {
        roomInfos.push(roomInfo)
        roomIndex++
        if (roomIndex >= rooms.length) {
          cb(roomInfos)
        } else {
          getRoomInfo(rooms[roomIndex], getRoomInfoCallback)
        }
      }

      getRoomInfo(rooms[roomIndex], getRoomInfoCallback)
    }
  })
}

function getRoomInfo (id, cb, force) {
  if (!force && cachedRoomInfos[id]) {
    cb(cachedRoomInfos[id])
  } else {
    getChatRoomModule(function (chatroom) {
      chatroom.getRoomInfo(id, function (roominfo) {
        cachedRoomInfos[id] = roominfo
        cb(roominfo)
      })
    })
  }
}

function getUserInfo (openid, cb, force) {
  if (!force && cachedUserInfos[openid]) {
    cb(cachedUserInfos[openid])
  } else {
    getChatUserModule(function (user) {
      user.getUserInfo(openid, function (userinfo) {
        cachedUserInfos[openid] = userinfo
        cb(userinfo)
      })
    })
  }
}

function getAllUserInfos (users, cb) {
  if (users.length == 0) {
    cb([])
  } else {
    let userIndex = 0
    let userInfos = []
    function getUserInfoCallback (userinfo) {
      userInfos.push(userinfo)
      userIndex++
      if (userIndex >= users.length) {
        cb(userInfos)
      } else {
        getUserInfo(users[userIndex], getUserInfoCallback)
      }
    }

    getUserInfo(users[userIndex], getUserInfoCallback)
  }
}

function getRoomUserInfos (roomid, cb) {
  getChatRoomModule(function (chatroom) {
    getRoomInfo(roomid, function (roomInfo) {
      getAllUserInfos(roomInfo.users, cb)
    })
  })
}

function SetSystemInfo (height, width) {
  windowHeight = height
  windowWidth = width
  rpxRatio = 750 / windowWidth
}

function px2rpx (px) {
  return Math.round(rpxRatio * px)
}

function rpx2px (rpx) {
  return Math.round(rpx / rpxRatio)
}

function getHeightrpx () {
  return px2rpx(windowHeight)
}

function setSelfUserInfo (userinfo) {
  // 考虑更新的情况
  let oldinfo = selfUserInfo
  selfUserInfo = userinfo

  if (!selfUserInfo.customName && oldinfo && oldinfo.customName) {
    selfUserInfo.customName = oldinfo.customName
  }
  if (!selfUserInfo.customImg && oldinfo && oldinfo.customImg) {
    selfUserInfo.customImg = oldinfo.customImg
  }

  if (!selfUserInfo.customName) {
    selfUserInfo.customName = selfUserInfo.nickName
  }

  if (!selfUserInfo.customImg) {
    selfUserInfo.customImg = selfUserInfo.avatarUrl
  }

  wx.setStorageSync(userInfokey, selfUserInfo)

  let chatUserInfo = Object.assign({}, selfUserInfo)
  chatUserInfo.avatarUrl = chatUserInfo.customImg
  chatUserInfo.nickName = chatUserInfo.customName

  if (openID) {
    updateUserInfo(openID, chatUserInfo, true)
  }

  return selfUserInfo
}

function getSelfUserInfo () {
  if (selfUserInfo) {
    return selfUserInfo
  } else {
    let info = wx.getStorageSync(userInfokey)
    if (info) {
      selfUserInfo = info
      if (openID) {
        let chatUserInfo = selfUserInfo
        chatUserInfo.avatarUrl = chatUserInfo.customImg
        chatUserInfo.nickName = chatUserInfo.customName
        updateUserInfo(openID, chatUserInfo, true)
      }
    }

    return selfUserInfo
  }
}

function Init () {
  getOpenID()
  getSelfUserInfo()
}

function updateUserInfo (openid, userinfo, force) {
  if (force || cachedUserInfos[openid]) {
    cachedUserInfos[openid] = userinfo
  }
}

function updateRoomInfo (roomid, roominfo) {
  if (cachedRoomInfos[roomid]) {
    cachedRoomInfos[roomid] = roominfo
  }
}

function setCustomRoominfo (roomid, key, value) {
  let customInfo = customRoominfo[roomid]
  if (!customInfo) {
    customInfo = {}
    customRoominfo[roomid] = customInfo
  }
  customRoominfo[roomid][key] = value
  wx.setStorageSync(roomid, customRoominfo[roomid])
}

function getCustomRoominfo (roomid, key, value) {
  if (!customRoominfo[roomid]) {
    customRoominfo[roomid] = wx.getStorageSync(roomid)
  }

  if (customRoominfo[roomid]) {
    return customRoominfo[roomid][key]
  }
  return null
}

function readHistoryFromCache (roomid) {
  let historys = wx.getStorageSync('history_' + roomid) || []
  let historyInfo = wx.getStorageSync('history_' + roomid + '_info') || {}
  return [historys, historyInfo["beginIndex"] || -1, historyInfo["endIndex"] || -1]
}

function writeHistoryToCache (roomid, historys, beginIndex, endIndex) {
  wx.setStorageSync('history_' + roomid, historys)
  let historyInfo = {}
  historyInfo["beginIndex"] = beginIndex
  historyInfo["endIndex"] = endIndex
  wx.setStorageSync('history_' + roomid + '_info', historyInfo)
}

function fireRoomCountUpdate (roomid, count) {
  if (roomUpdateCallback[roomid]) {
    roomUpdateCallback[roomid](count)
  }
}

function removeRoomCountUpdate (roomid) {
  let roomcb = {}
  for (let room in roomUpdateCallback) {
    if (room != roomid) {
      roomcb[room] = roomUpdateCallback[room]
    }
  }

  roomUpdateCallback = roomcb
}

function setRoomCountUpdate (roomid, cb) {
  roomUpdateCallback[roomid] = cb
}

module.exports = {
  Init: Init,
  setOpenID: setOpenID,
  getOpenID: getOpenID,
  buckyReady: buckyReady,
  getChatRoomModule: getChatRoomModule,
  getChatUserModule: getChatUserModule,
  getHistoryModule: getHistoryModule,
  enterChatRoom: enterChatRoom,
  getRoomInfoByRoomIds: getRoomInfoByRoomIds,
  getRoomInfo: getRoomInfo,
  getRoomUserInfos: getRoomUserInfos,
  getAllUserInfos: getAllUserInfos,
  getUserInfo: getUserInfo,
  SetSystemInfo: SetSystemInfo,
  px2rpx: px2rpx,
  rpx2px: rpx2px,
  getHeightrpx: getHeightrpx,
  setSelfUserInfo: setSelfUserInfo,
  getSelfUserInfo: getSelfUserInfo,
  updateUserInfo: updateUserInfo,
  updateRoomInfo: updateRoomInfo,
  getCustomRoominfo: getCustomRoominfo,
  setCustomRoominfo: setCustomRoominfo,
  readHistoryFromCache: readHistoryFromCache,
  writeHistoryToCache: writeHistoryToCache,
  fireRoomCountUpdate: fireRoomCountUpdate,
  removeRoomCountUpdate: removeRoomCountUpdate,
  setRoomCountUpdate: setRoomCountUpdate
}
