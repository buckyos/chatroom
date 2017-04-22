"use strict";

let request = require('request');

function tagLog() {
    // return 'chatroom__server'; 
    return getCurrentTraceInfo();
}

// 带缓存的模块加载器
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
    };
}

const packageLoader = getPackageLoader();

// 聊天室

// GPS 名词
// latitude 纬度
// longitude 经度
// accuracy 精确度

function getNextRoomID(rs, cb) {
    let nextroomid = 'nextroom__id';
    rs.getObject(nextroomid, function(objid, obj) {
        if (obj) {
            rs.setObject(nextroomid, { id: obj.id + 1 }, function(objid, result) {
                cb(obj.id + 1);
            });
        } else {
            rs.setObject(nextroomid, { id: 12122 }, function(objid, result) {
                cb(12122);
            });
        }
    });
}

let createRoomIDList = 'createRoomIDList';
let enterRoomIDList = 'enterRoomIDList';

function addCreateRoomLink(rs, userid, roomid, cb) {
    let userCreateRooms = createRoomIDList + '_' + userid;
    rs.getObject(userCreateRooms, function(objid, roomlist) {
        if (roomlist) {
            roomlist.push(roomid);
            rs.setObject(userCreateRooms, roomlist, function(objid, result) {
                BX_INFO('set user create room list 1', roomlist, result, tagLog());
                cb(result);
            });
        } else {
            roomlist = [roomid];
            rs.setObject(userCreateRooms, roomlist, function(objid, result) {
                BX_INFO('set user create room list 2', roomlist, result, tagLog());
                cb(result);
            });
        }
    });
}

function createRoomEvent(id, cb) {
    let thisRuntime = getCurrentRuntime();
    let em = thisRuntime.getGlobalEventManager();

    let eventName = 'room_event_' + id;
    em.createEvent(eventName, function(result) {
        BX_INFO('create event', eventName, result, tagLog());
        cb(result);
    });
}

// gps = null or {latitude: 0.0, longitude: 1.1, accuracy: 10}
function createRoom(sessionID, roomname, expiretime, gps, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start create room.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                getNextRoomID(rs, function(id) {
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
                    };

                    BX_INFO('set object', id, newRoom, tagLog());
                    createRoomEvent(id, function(result) {
                        if (result === ErrorCode.RESULT_OK) {
                            BX_INFO('create room response ok', newRoom, tagLog());

                            rs.setObject(id, newRoom, function(objid, result) {
                                addCreateRoomLink(rs, userid, id, function() {
                                    cb({ err: null, ret: newRoom });
                                });
                            });
                        } else {
                            BX_ERROR('create room event failed, result', result, tagLog());
                            cb({ err: `create room event failed` });
                        }
                    });
                });
            }
        });
    });
}

// 显示已创建的房间
function listChatRoom(sessionID, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start list room.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        BX_INFO(`chatuser module ${chatuser}`, chatuser, tagLog());

        BX_INFO(`getUserIDBySessionID type is ${typeof chatuser.getUserIDBySessionID}`, tagLog());

        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                let userCreateRooms = createRoomIDList + '_' + userid;
                BX_INFO('userCreateRooms', userCreateRooms, tagLog());
                rs.getObject(userCreateRooms, function(objid, roomlist) {
                    BX_INFO('roomlist', roomlist, tagLog());
                    cb({ err: null, ret: roomlist ? roomlist : [] });

                });
            }
        });
    });
}

// 显示所有进入的房间
function listAllChatRoom(sessionID, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start list all room.', tagLog());
    let rs = thisRuntime.getRuntimeStorage('/chatroom/');

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                BX_ERROR('listAllChatRoom error', err, tagLog());
                cb({ err });
            } else {
                let userEnterRooms = enterRoomIDList + '_' + userid;

                rs.getObject(userEnterRooms, function(objid, roomlist) {
                    BX_INFO('listAllChatRoom response', roomlist, tagLog());
                    cb({ err: null, ret: roomlist || [] });
                });
            }
        });
    });

}

function _removeCreateRooms(rs, userid, roomid, cb) {
    BX_INFO('!!!!start remove create room.', tagLog());

    let userCreateRooms = createRoomIDList + '_' + userid;
    rs.getObject(userCreateRooms, function(objid, roomlist) {
        if (roomlist) {
            for (let index in roomlist) {
                if (roomid == roomlist[index]) {
                    rs.getObject(roomid, function(objid, roominfo) {
                        if (roominfo) {
                            if (roominfo.admin === userid) {

                                roomlist.splice(index, 1);
                                BX_INFO('after remove list', roomlist, roomid, tagLog());
                                rs.setObject(userCreateRooms, roomlist, function(objid, result) {
                                    BX_INFO('remove callback', result, tagLog());
                                    cb(result);
                                });
                            }
                        } else {
                            cb(false);
                        }
                    });

                    break;
                }
            }
            cb(false);
            BX_INFO('could not get roomid', roomid, 'in roomlist', roomlist, tagLog());
        } else {
            cb(false);
            BX_INFO('could not get create rooms', userCreateRooms, roomlist, tagLog());
        }
    });
}

function _removeEnterRooms(rs, userid, roomid, cb) {
    BX_INFO('!!!!start remove enter room.', tagLog());

    let userEnterRooms = enterRoomIDList + '_' + userid;
    rs.getObject(userEnterRooms, function(objid, roomlist) {
        if (roomlist) {
            for (let index in roomlist) {
                if (roomid == roomlist[index]) {
                    roomlist.splice(index, 1);
                    BX_INFO('after remove list', roomlist, roomid, tagLog());
                    rs.setObject(userEnterRooms, roomlist, function(objid, result) {
                        BX_INFO('remove callback', result, tagLog());
                        cb(result);
                    });
                    break;
                }
            }
            cb(false);
            BX_ERROR('could not get roomid', roomid, 'in roomlist', roomlist, tagLog());
        } else {
            cb(false);
            BX_ERROR('could not get enter rooms', userEnterRooms, roomlist, tagLog());
        }
    });
}

function destroyChatRoom(sessionID, roomid, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start destroy room.', sessionID, roomid, tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }

            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                _removeCreateRooms(rs, userid, roomid, function(result) {
                    if (result) {
                        _removeEnterRooms(rs, userid, roomid, function(result) {
                            if (result) {
                                rs.removeObject(roomid, function(objid, ret) {
                                    let em = thisRuntime.getGlobalEventManager();
                                    let eventName = 'room_event_' + roomid;
                                    em.removeEvent(eventName, function() {});
                                    cb({ err: null, ret });
                                    // let em = thisRuntime.getGlobalEventManager()
                                    // em.fireEvent('destroy_' + id, roomid)
                                });
                            } else {
                                cb({ err: `can't destory room ${roomid}`, ret: false });
                            }
                        });
                    } else {
                        cb({ err: `can't destory room ${roomid}`, ret: false });
                    }
                });
            }
        });
    });


}

function getRoomInfo(sessionID, roomid, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getRoomInfo.', sessionID, roomid, cb, tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                BX_ERROR('getUserIDBySessionID callback', err, cb, typeof cb, tagLog());
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {
                        // let u = roominfo.users.find(u => u == userid);
                        // if (u) {
                        cb({ err: null, ret: roominfo });
                        // } else {
                        //     cb({ err: `${sessionID} not enter room ${roomid}` });
                        // }

                    } else {
                        cb({ err: `could not get room by id ${roomid}` });
                    }
                });
            }
        });
    });

}

// 获取公告板
function getBBS(sessionID, roomid, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getBBS.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                BX_ERROR('chatuser.getUserIDBySessionID callback', err, userid, tagLog());
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    BX_INFO('get bbs return ', roominfo, tagLog());

                    let u = roominfo.users.find(n => n == userid);
                    if (u) {
                        cb({
                            err: null,
                            ret: {
                                bbs: roominfo ? roominfo.bbs : null,
                                time: roominfo ? roominfo.bbsTime : null,
                            }
                        });
                    } else {
                        cb({ err: `can't find room ${roomid}` });
                    }


                });
            }
        });
    });

}

function setBBS(sessionID, roomid, bbs, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start setBBS.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo.admin != userid) {
                        cb({ err: `Invalid permissions `, ret: false });
                    } else {
                        roominfo.bbs = bbs;
                        roominfo.bbsTime = new Date().getTime();
                        rs.setObject(roomid, roominfo, function() {});
                        cb({ err: null, ret: true });

                        let em = thisRuntime.getGlobalEventManager();
                        let eventName = 'room_event_' + roomid;
                        em.fireEvent(eventName, JSON.stringify({ eventType: 'bbs', value1: roominfo.bbs, value2: roominfo.bbsTime }));
                        BX_INFO('fire event bbs', eventName, roomid, roominfo.bbs, roominfo.bbsTime, tagLog());
                    }
                });
            }
        });
    });

}

function getAdmin(sessionID, roomid, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getAdmin.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {
                        let u = roominfo.users.find(n => n == userid);
                        if (u) {
                            cb({ err: null, ret: roominfo.admin });
                        } else {
                            cb({ err: `can't find room ${roomid}` });
                        }

                    } else {
                        cb({ err: `could not get room by id ${roomid}`, ret: -1 });
                    }
                });
            }
        });
    });

}

function _addEnterRoomLink(rs, roomid, userid, cb) {
    BX_INFO('_addEnterRoomLink', roomid, userid, tagLog());

    let userEnterRooms = enterRoomIDList + '_' + userid;
    rs.getObject(userEnterRooms, function(objid, roomlist) {
        if (roomlist) {
            if (roomlist.indexOf(roomid) == -1) {
                roomlist.push(roomid);
            }
            rs.setObject(userEnterRooms, roomlist, function(objid, result) {
                BX_INFO('save enter room', userEnterRooms, roomlist, result);
                cb(result);
            });
        } else {
            roomlist = [roomid];
            rs.setObject(userEnterRooms, roomlist, function(objid, result) {
                BX_INFO('save enter room', userEnterRooms, roomlist, result);
                cb(result);
            });
        }
    });
}

// return
// 0 成功
// 1 需要gps
// 2 失败, GPS失败
// 3 找不到roomid

// gps = null or {latitude: 0.0, longitude: 1.1, accuracy: 10}
function enterChatRoom(sessionID, roomid, gps, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start enterChatRoom.', "sessionID", sessionID, "roomid", roomid, "gps", gps, "cb", cb, tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {

                        // 已经进入,直接返回成功
                        for (let index in roominfo.users) {
                            if (roominfo.users[index] == userid) {
                                BX_INFO("enterChatRoom", tagLog());
                                cb({err:null, ret:0});
                            }
                        }

                        // 添加用户到当前room
                        if (roominfo.enableGPS) {
                            // 比较GPS
                            // 假定经纬度偏差绝对值都是30度
                            if (gps == null) {
                                cb({ err: `need gps param`, ret: 1 });
                                return;
                            } else {
                                let delta = 30;
                                if (Math.abs(gps.latitude - roominfo.gps.latitude) < delta &&
                                    Math.abs(gps.longitude - roominfo.gps.longitude)) {
                                    cb({ err: `need gps param`, ret: 1 });
                                } else {
                                    cb({ err: `gps is not match`, ret: 2 });
                                    return;
                                }
                            }
                        } else {
                            roominfo.users.push(userid);
                            rs.setObject(roomid, roominfo, function(objid, result) {
                                packageLoader('history_proxy', 'history', function(history) {
                                    chatuser.getUserInfo(sessionID, userid, function(userinfo) {
                                        history.addHistory(sessionID, roomid, null, null, `${userinfo.nickName} 进入房间`, 2, function() {

                                        });
                                    });
                                });

                            });
                        }

                        _addEnterRoomLink(rs, roomid, userid, function() {
                            cb({err:null, ret:0});
                        });
                    } else {
                        cb({ err: `could not get room id ${roomid}`, ret: 3 });
                    }
                });
            }
        });
    });

}

function leaveChatRoom(sessionID, roomid, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start leaveChatRoom.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {
                        for (let index in roominfo.users) {
                            if (roominfo.users[index] == userid) {
                                roominfo.users.splice(index, 1);
                                cb({ err: null, ret: true });

                                packageLoader('history_proxy', 'history', function(history) {
                                    chatuser.getUserInfo(sessionID, userid, function(userinfo) {
                                        history.addHistory(sessionID, roomid, null, null, `${userinfo.nickName} 离开房间`, 2, function() {

                                        });
                                    });
                                });

                                rs.setObject(roomid, roominfo, function() {});

                                let userEnterRooms = enterRoomIDList + '_' + userid;
                                rs.getObject(userEnterRooms, function(objid, roomlist) {
                                    if (roomlist) {
                                        let idx = roomlist.indexOf(roomid);
                                        if (idx != -1) {
                                            roomlist.splice(idx);
                                        }
                                        rs.setObject(userEnterRooms, roomlist, function() {});
                                    }
                                });
                                return;
                            }
                        }

                        cb({ err: null, ret: false });
                    } else {
                        cb({ err: null, ret: false });
                    }
                });
            }
        });
    });

}

function getUserCount(sessionID, roomid, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getUserCount.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {
                        let u = roominfo.users.find(n => n == userid);
                        if (u) {
                            cb({ err: null, ret: roominfo.users.length });
                        } else {
                            cb({ err: `can't find room ${roomid}` });
                        }

                    } else {
                        cb({ err: null, ret: 0 });
                    }
                });
            }
        });
    });

}

// start, end 用于分页
function getUserList(sessionID, roomid, start, end, cb) {
    // 返回 user id list
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getUserList.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {
                        let u = roominfo.users.find(n => n == userid);
                        if (u) {
                            cb({ err: null, ret: roominfo.users.slice(start, end) });
                        } else {
                            cb({ err: `can't find room ${roomid}` });
                        }

                    } else {
                        cb({ err: null, ret: [] });
                    }
                });
            }
        });
    });

}

function getHistoryCount(sessionID, roomid, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getHistoryCount.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                BX_ERROR('getUserIDBySessionID callback', sessionID, err, cb, tagLog());
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {
                        let u = roominfo.users.find(n => n == userid);
                        if (u) {
                            cb({ err: null, ret: roominfo.history.length });
                        } else {
                            cb({ err: `can't find room ${roomid}` });
                        }

                    } else {
                        cb({ err: null, ret: [] });
                    }
                });
            }
        });
    });

}

// start, end 用于分页
function getHistoryList(sessionID, roomid, start, end, cb) {
    // 返回record id list
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getHistoryList.', roomid, start, end, tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                BX_ERROR('getUserIDBySessionID callback', sessionID, err, cb, tagLog());
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {
                        let u = roominfo.users.find(n => n == userid);
                        if (u) {
                            BX_INFO('history list length,', roominfo.history.length, tagLog());
                            if (end <= 0 || end > roominfo.history.length) {
                                end = 0;
                            }
                            if (start <= 0 || start > roominfo.history.length) {
                                start = 0;
                            }
                            const historyList = roominfo.history.slice(start, end);
                            BX_INFO('get history list return', historyList, start, end, roominfo.history, tagLog());
                            cb({ err: null, ret: historyList });
                        } else {
                            cb({ err: `can't find room ${roomid}` });
                        }

                    } else {
                        BX_ERROR('could not find roomid,', roomid, tagLog());
                        cb({ err: null, ret: [] });
                    }
                });
            }
        });
    });

}

function getHistoryListInfo(sessionID, roomid, start, end, cb) {
    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                getHistoryList(sessionID, roomid, start, end, function({ err, ret: idList }) {
                    if (idList.length == 0) {
                        cb({ err: null, ret: [] });
                    } else {
                        let cnt = 0;
                        let infos = [];
                        packageLoader('history_proxy', 'history', function(history) {
                            for (let i = 0; i < idList.length; i++) {
                                history.getHistory(idList[i], function(info) {
                                    cnt++;
                                    infos.push(info);
                                    if (cnt == idList.length) {
                                        cb({ err: null, ret: infos });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });


}

/*由于此处涉及私有appid,secret,对外发布的代码GetQRCode功能将不能直接使用，需填入自己小程序的appid和secret*/

function getToken(cb) {
    BX_INFO('!!!!start getToken.', tagLog());

    let appid = '{{wxappid}}';
    let secret = '{{wxsecret}}';
    let tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;

    request(tokenUrl, function(err, res, body) {
        cb(err, err === null ? JSON.parse(body) : null);
    });
}

// getToken(function(err, body) {
//     console.log(body)
// })

function getQRFromServer(token, path, width, cb) {
    BX_INFO('!!!!start getQRFromServer.', token, path, width, tagLog());

    let url = `https://api.weixin.qq.com/cgi-bin/wxaapp/createwxaqrcode?access_token=${token}`;
    request.post({ url: url, body: JSON.stringify({ path: path, width: width }), encoding: null }, function(err, res, body) {
        if (err === null && res.headers['content-type'] === 'image/jpeg') {
            cb(true, body);
        } else {
            cb(false, JSON.parse(body));
        }
    });
}

function getQR(token, path, width, cb) {
    
    BX_INFO('!!!!start getQR.', token, path, width, tagLog());

    function qrCallback(result, body) {
        if (result) {
            cb(true, body);
        } else {
            console.log('get qr failed, get token now');
            getToken(function(err, tokenInfo) {
                if (tokenInfo) {
                    console.log('get token ok');
                    getQRFromServer(tokenInfo.access_token, path, width, function(result, body) {
                        cb(result, body);
                    });
                } else {
                    console.log('could not get token');
                    cb(false);
                }
            });
        }
    }

    getQRFromServer(token, path, width, qrCallback);
}

// getQR(tokenExpire, 'pages/index?query=1', 430, function (result, body) {
//   console.log(result)
//   if(result) {
//       upload(body, function(result, body) {
//           console.log(body)
//       })
//   }
// })

function upload(buffer, cb) {
    
    BX_INFO('!!!!start upload.', tagLog());

    var formData = {
        custom_file: {
            value: buffer,
            options: {
                filename: 'topsecret.jpg',
                contentType: 'image/jpg'
            }
        }
    };
    /*微信小程序不支持通过post直接下载图片并显示，这里使用了私有的上传服务器，上传图片文件之后返回http地址*/
    request.post({ url: 'private upload server', formData: formData }, function(err, res, body) {
        BX_INFO('upload', {err, res, body});
        try {
            cb(err === null, JSON.parse(body));
        } catch (e) {
            cb (false, null);
        }
        
    });
}

let tokenID = 'wxToken';

function getCacheToken(cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getCacheToken.', tagLog());
    // console.log(arguments)
    let rs = thisRuntime.getRuntimeStorage('/chatroom/');

    rs.getObject(tokenID, function(objid, token) {
        if (token) {
            BX_INFO('get storage token', token, tagLog());
            cb(token);
        } else {
            BX_INFO('could not get storage token, get online now', tagLog());
            getToken(function(result, tokenInfo) {
                if (result) {
                    BX_INFO('get token ok', tokenInfo, tagLog());
                    saveCacheToekn(tokenInfo.access_token, function() {
                        cb(tokenInfo.access_token);
                    });
                } else {
                    BX_INFO('get online token failed', tagLog());
                    cb(null);
                }
            });
        }
    });
}

function saveCacheToekn(token, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start saveCacheToekn.', token, tagLog());
    // console.log(arguments)
    let rs = thisRuntime.getRuntimeStorage('/chatroom/');

    rs.setObject(tokenID, token, function(objID, objItem) {
        cb(objID, objItem);
    });
}

function getQRCode(sessionID, path, width, cb) {
    
    BX_INFO('!!!!start getQRCode.', path, width, tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {
        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                getCacheToken(function(token) {
                    BX_INFO('get token', token, tagLog());
                    getQR(token, path, width, function(result, body) {
                        BX_INFO('get qr', result, tagLog());
                        if (result) {
                            upload(body, function(result, body) {
                                BX_INFO('upload', result, body, tagLog());
                                if (body) {
                                    cb({ err: null, ret: body.url });
                                } else {
                                    cb({ err: `upload failed`, ret: null });
                                }
                            });
                        } else {
                            cb({ err: `get qr code failed`, ret: null });
                        }
                    });
                });
            }
        });
    });


}

function appendHistory(sessionID, roomid, historyid, cb) {
    let thisRuntime = getCurrentRuntime();
    BX_INFO('!!!!start getHistoryCount.', tagLog());

    packageLoader('chatuser_proxy', 'chatuser', function(chatuser) {

        BX_INFO('chatuser.getUserIDBySessionID', sessionID, roomid, historyid, tagLog());

        chatuser.getUserIDBySessionID(sessionID, function(result) {
            let err = 'server rpc error';
            let userid = null;
            if (result) {
                err = result.err;
                userid = result.ret;
            }
            if (err) {
                cb({ err });
            } else {
                let rs = thisRuntime.getRuntimeStorage('/chatroom/');

                rs.getObject(roomid, function(objid, roominfo) {
                    if (roominfo) {
                        roominfo.history.push(historyid);
                        rs.setObject(roomid, roominfo, function(id, ret) {
                            //临时写一个事件触发，只通知用户有消息更新了,触发客户端主动拉取
                            let em = thisRuntime.getGlobalEventManager();
                            let eventName = 'room_event_' + roomid;
                            em.fireEvent(eventName, JSON.stringify({ eventType: 'count' }));
                            BX_INFO('fire event count', tagLog());
                            cb({ err: null, ret });
                        });
                    } else {
                        cb({ err: null, ret: false });
                    }
                });
            }
        });
    });


}

module.exports = {
    createRoom,
    listChatRoom,
    listAllChatRoom,
    destroyChatRoom,
    getRoomInfo,
    getBBS,
    setBBS,
    getAdmin,
    enterChatRoom,
    leaveChatRoom,
    getUserCount,
    getUserList,
    getHistoryCount,
    getHistoryList,
    getHistoryListInfo,
    getQRCode,
    appendHistory,
};