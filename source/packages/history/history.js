"use strict";
const util = require('util');
// let chatroom = require('./chatroom')
// 聊天记录

function tagLog() {
    return 'history__server';
}


function getPackageLoader() {
    let packageCache = [];
    return function(packageName, moduleName, cb) {
        if (packageCache[packageName]) {
            if (packageCache[packageName][moduleName]) {
                cb(packageCache[packageName][moduleName]);
            } else {
                packageCache[packageName].loadModule(moduleName, function(mod) {
                    packageCache[packageName][moduleName] = mod;
                    cb(mod);
                });
            }
        } else {
            let thisRuntime = getCurrentRuntime();
            thisRuntime.loadXARPackage(packageName, function(pkg) {
                packageCache[packageName] = pkg;
                pkg.loadModule(moduleName, function(mod) {
                    packageCache[packageName][moduleName] = mod;
                    cb(mod);
                });
            });
        }
    }
}

const packageLoader = getPackageLoader();

function getNextHistoryID(rs, cb) {
    let nexthistoryid = 'next_history_id'
    BX_INFO('getNextHistoryID get', nexthistoryid, tagLog);
    rs.getObject(nexthistoryid, function(objid, obj) {
        BX_INFO('getNextHistoryID get', nexthistoryid, 'callback', obj, tagLog);
        if (obj) {
            obj.id = obj.id + 1
            BX_INFO('getNextHistoryID set object', nexthistoryid, obj, tagLog);
            rs.setObject(nexthistoryid, obj, function(objId, result) {
                BX_INFO('getNextHistoryID set object1 callback', obj, result, tagLog);
                if (result) {
                    cb(obj.id)
                } else {
                    cb(null)
                }
            })
        } else {
            BX_INFO('getNextHistoryID get next history id callback init id', tagLog);
            let initData = { id: 12122 }
            rs.setObject(nexthistoryid, initData, function(objId, result) {
                BX_INFO('getNextHistoryID set object2 callback', initData, result, tagLog);
                if (result) {
                    cb(initData.id)
                } else {
                    cb(null)
                }
            })
        }
    })
}

function addHistory(sessionID, roomid, from, to, content, type, cb) {
    let thisRuntime = getCurrentRuntime()
    BX_INFO('!!!!start addHistory.', tagLog);

    packageLoader('chatuser', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function({ err, ret: from }) {
            BX_INFO(' chatuser.getUserIDBySessionID callback', err, from, tagLog);
            if (err) {
                BX_ERROR('getUserIDBySessionID callback', err, sessionID, roomid, content, from, to, tagLog);
                cb({ err });
            } else {

                let rs = thisRuntime.getRuntimeStorage('/chathistory/')

                loadPackageModule('chatroom_proxy', 'chatroom', function(chatroom) {
                    BX_INFO('loadPackageModule callback', chatroom, tagLog());

                    chatroom.getRoomInfo(sessionID, roomid, function(roominfo) {
                        BX_INFO('chatroom.getRoomInfo callback', roomid, roominfo, cb, tagLog);
                        if (roominfo.ret) {

                            getNextHistoryID(rs, function(historyid) {
                                BX_INFO('get next history id callback', historyid, tagLog);

                                let info = {
                                    id: historyid,
                                    roomid: roomid,
                                    from: from,
                                    to: to,
                                    content: content,
                                    time: new Date().getTime(),
                                    type: type
                                }

                                BX_INFO('create history info', info, tagLog);

                                rs.setObject(historyid, info, function(objid, result) {
                                    if (result) {
                                        chatroom.appendHistory(sessionID, roomid, historyid, function(ret) {
                                            BX_INFO('chatroom.appendHistory callback', ret, tagLog);
                                            cb({ err: null, ret: ret.ret });
                                        })
                                    } else {
                                        BX_ERROR("setStorage Failed", tagLog);
                                        cb({ err: `setStorage Failed`, ret: false });
                                    }
                                })
                            })
                        } else {
                            BX_ERROR("no roominfo", tagLog);
                            cb({ err: `could not find room id by ${roomid}`, ret: false });
                        }
                    })
                })

            }
        });
    });



}

function loadPackageModule(packageName, modName, cb) {
    let thisRuntime = getCurrentRuntime();
    thisRuntime.loadXARPackage(packageName, function(pkg) {
        pkg.loadModule(modName, function(mod) {
            cb(mod)
        })
    })
}



function getHistory(sessionID, historyid, cb) {
    let thisRuntime = getCurrentRuntime()
    BX_INFO('start getHistory. ', sessionID, historyid, tagLog)

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        BX_INFO('chatuser.getUserIDBySessionID', sessionID, historyid, tagLog);

        chatuser.getUserIDBySessionID(sessionID, function({ err, ret: userid }) {
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chathistory/')

                rs.getObject(historyid, function(objid, info) {
                    packageLoader('chatroom_proxy', 'chatroom', function(chatroom) {

                        if (info == null) {
                            cb({err:`can't find history id ${historyid} info = null`});
                        } else {
                            chatroom.listAllChatRoom(sessionID, ({ err, ret }) => {
                                if (err) {
                                    cb({ err });
                                } else {
                                    let rid = ret.find(n => n == info.roomid);
                                    BX_INFO(`get history enter room list=`, ret, ` history info=`, info, tagLog);
                                    if (rid) {
                                        cb({ err: null, ret: info });
                                    } else {
                                        chatroom.listChatRoom(sessionID, ({ err, ret }) => {
                                            if (err) {
                                                cb({ err });
                                            } else {
                                                let rid = ret.find(n => n == info.roomid);
                                                BX_INFO(`get history create room list=`, ret, ` history info=`, info, tagLog);
                                                if (rid) {
                                                    cb({ err: null, ret: info });
                                                } else {
                                                    cb({ err: `can't find history id ${historyid}, user not in room.` });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }

                    });

                })
            }
        });
    });

}

// function appendHistory (roomid, historyid, cb) {
//   let thisRuntime = getCurrentRuntime()
//   BX_INFO('!!!!start getHistoryCount.')
//   // BX_INFO(arguments)
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