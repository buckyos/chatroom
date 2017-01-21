"use strict";
// let chatroom = require('./chatroom')
// 聊天记录

function getNextHistoryID (rs, cb) {
  let nexthistoryid = 'next_history_id'
  console.log('getNextHistoryID get', nexthistoryid)
  rs.getObject(nexthistoryid, function (objid, obj) {
    console.log('getNextHistoryID get', nexthistoryid, 'callback', obj)
    if (obj) {
      obj.id = obj.id + 1
      console.log('getNextHistoryID set object', nexthistoryid, obj)
      rs.setObject(nexthistoryid, obj, function (objId, result) {
        console.log('getNextHistoryID set object1 callback', obj, result)
        if (result) {
          cb(obj.id)
        } else {
          cb(null)
        }
      })
    } else {
      console.log('getNextHistoryID get next history id callback init id')
      let initData = {id: 12122}
      rs.setObject(nexthistoryid, initData, function (objId, result) {
        console.log('getNextHistoryID set object2 callback', initData, result)
        if (result) {
          cb(initData.id)
        } else {
          cb(null)
        }
      })
    }
  })
}

function addHistory (roomid, from, to, content, type, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start addHistory.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chathistory/')

  loadPackageModule('chatroom_proxy', 'chatroom', function(chatroom) {
      chatroom.getRoomInfo(roomid, function(roominfo) {
          if (roominfo) {
             getNextHistoryID(rs, function (historyid) {
                logger.info('get next history id callback', historyid)

                let info = {
                id: historyid,
                roomid: roomid,
                from: from,
                to: to,
                content: content,
                time: new Date().getTime(),
                type: type
                }

                rs.setObject(historyid, info, function (objid, result) {
                if (result) {
                    chatroom.appendHistory(roomid, historyid, function(ret) {
                        cb(ret)
                    })
                } else {
                    logger.error("setStorage Failed")
                    cb(false)
                }
                })
            })
          } else {
              logger.error("no roominfo")
              cb(false)
          }
      })
  })


}

function loadPackageModule(packageName, modName, cb) {
    let thisRuntime = getCurrentRuntime();
    thisRuntime.loadXARPackage(packageName, function (pkg) {
      pkg.loadModule(modName, function (mod) {
        cb(mod)
      })
    })
}

function getHistory (historyid, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('start getHistory. ', historyid)
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chathistory/')

  rs.getObject(historyid, function (objid, info) {
    cb(info)
  })
}

// function appendHistory (roomid, historyid, cb) {
//   let thisRuntime = getCurrentRuntime()
//   let logger = thisRuntime.getLogger()
//   logger.info('!!!!start getHistoryCount.')
//   // console.log(arguments)
//   let rs = thisRuntime.getRuntimeStorage('/chatroom/')

//   rs.getObject(roomid, function (objid, roominfo) {
//     if (roominfo) {
//       roominfo.history.push(historyid)
//       rs.setObject(roomid, roominfo, function (id, ret) {
//         cb(ret)

//         // let em = thisRuntime.getGlobalEventManager();
//         // em.fireEvent("message_room_" + roomid, roominfo.history.length)
//       })
//     } else {
//       cb(false)
//     }
//   })
// }

module.exports = {}
module.exports.getHistory = getHistory
module.exports.addHistory = addHistory
