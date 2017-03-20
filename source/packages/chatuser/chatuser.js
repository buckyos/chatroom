'use strict'

let request = require('request')
var crypto = require('crypto')

function tagLog() {
    return 'chatuser__server';
}

let md5 = function(str) {
    var md5sum = crypto.createHash(`md5`)
    md5sum.update(str)
    return md5sum.digest(`hex`)
}
/* 由于url包含敏感信息，将appid和secret部分去掉，需填入自己小程序的appid和secret*/
function getOpenID(authCode, cb) {
    let appid = 'wxcacb9d625cb8aa80';
    let secret = '82075a2216f41f70a553c55a9b46b903';
    let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${authCode}&grant_type=authorization_code`;

    request(url, function(err, resp, body) {
        console.log(body)
        let sessionInfo = JSON.parse(body);
        
        BX_INFO('getOpenID', body, tagLog);

        cb(err, err === null ? sessionInfo.openid : null)
    })
}

/*
Storage 是 /chatuser/
  session信息存储在 /chatuser/session下面
  session有效期为1天，过期后，调用任何接口都返回无效用户错误，客户端收到这个错误后，需要重新登录
  session id的生成算法 md5(md5(openid)+expiretime)=openid + expiretime
*/

//登录step1: 用authorcode创建一个我们自己的userid，用于后续操作。
//暂时没有存储openid和userid的对应关系，以后应该加上，用于其他接口的校验
function login(authorCode, cb) {
    let thisRuntime = getCurrentRuntime()
    BX_INFO('login begin login ', authorCode, tagLog);
    getOpenID(authorCode, function(err, openid) {
        let userid = ''
        if (openid) {
            const now = new Date().getTime();
            const sessionInfo = { openid: openid, logintime: now };
            userid = md5(md5(openid) + now.toString());

            BX_INFO('login', userid, sessionInfo, tagLog);

            let rs = thisRuntime.getRuntimeStorage('/chatuser/')
            rs.setObject(`session_id_${userid}`, sessionInfo, (objID, result) => {
                if (result) {
                    BX_INFO(`login write session result ${result} userid=${userid}`, tagLog);
                    cb({err: null, sessionid: userid});
                } else {
                    BX_ERROR(`login write session result ${result}`, tagLog);
                    cb({err: `login write session storage failed`, sessionid: null});
                }
            });

        } else {
            BX_ERROR(`login get open id error ${err}`, tagLog);
            cb({err: `login get open id error ${err}`, sessionid: null});
        }
    })
}

function loginTimeIsExpire(loginTime) {
    const l = new Date(loginTime);

    // 有效期是1天
    l.setDate(l.getDate() + 1);
    return new Date().getTime() < l.getTime();
}

function getUserIDBySessionID(sessionID, cb) {
    BX_INFO(`get user id by session id “${sessionID}”`, tagLog);

    const thisRuntime = getCurrentRuntime();
    const rs = thisRuntime.getRuntimeStorage('/chatuser/');
    BX_INFO('getUserIDBySessionID rs', rs, typeof rs, tagLog);
    if (rs) {
        rs.getObject(`session_id_${sessionID}`, (objID, result) => {
            if (result) {
                if (loginTimeIsExpire(result.logintime)) {
                    BX_INFO(`find openid ok ${result}`, tagLog);
                    cb({err:null, ret:result.openid});
                } else {
                    BX_WARN(`session id is expire ${sessionID}`, tagLog);
                    cb({err:`session id is expire`});
                }
            } else {
                BX_ERROR(`could not get session info, session id "${sessionID}"`, tagLog);
                cb({err:`could not get session info, session id "${sessionID}"`});
            }
        });
    } else {
        BX_ERROR(`get runtime storage failed`, tagLog);
        cb({err:`get runtime storage failed`});
    }

}

function checkSession(sessionID, cb) {
    BX_INFO(`checkSession sessionID= ${sessionID}`, tagLog);
    // getUserIDBySessionID(sessionID, ({err, ret}) => {
    //     BX_INFO(`checkSession getUserIDBySessionID callback err ${err}, openid ${ret}`, tagLog);
    //     cb(err == null);
    // });

    // 小程序每次启动，强制登录一次
    cb(false);
}


// Step2: sessionID,创建或更新一个userInfo
function createUser(sessionID, nickName, avatarUrl, gender, cb) {
    let thisRuntime = getCurrentRuntime()
    BX_INFO('!!!!start createUser.', sessionID, nickName, avatarUrl, gender, tagLog);

    getUserIDBySessionID(sessionID, function({err, ret:userid}) {
        if (err) {
            BX_ERROR('getUserIDBySessionID callback error', err, tagLog);
            cb({err});
        } else {

            let rs = thisRuntime.getRuntimeStorage('/chatuser/')

            rs.getObject(userid, function(objid, usrObj) {
                BX_INFO('get userid', userid, 'callback', objid, usrObj, tagLog);
                var usrInfo = usrObj
                if (usrInfo) {
                    usrInfo.nickName = nickName
                    usrInfo.avatarUrl = avatarUrl
                    usrInfo.gender = gender
                } else {
                    BX_INFO('new user', tagLog);
                    usrInfo = {
                        openid: userid,
                        nickName: nickName,
                        avatarUrl: avatarUrl,
                        gender: gender,
                    }
                }

                rs.setObject(userid, usrInfo, function(objid, res) {
                    BX_INFO('before cb', objid, res, tagLog);
                    cb({err:null, ret:usrInfo});
                    BX_INFO('after cb', tagLog);
                })
            });
        }
    });


}

function getUserInfo(sessionID, openid, cb) {
    let thisRuntime = getCurrentRuntime()
    BX_INFO('!!!!start getUserInfo.', sessionID, openid, tagLog);

    getUserIDBySessionID(sessionID, function({err, ret:userid}) {
        if (err) {
            BX_ERROR('getUserIDBySessionID callback', sessionID, err, cb, tagLog);
            cb({err});
        } else {
            let rs = thisRuntime.getRuntimeStorage('/chatuser/');

            rs.getObject(openid, function(objid, usrObj) {
                BX_INFO('get user info ret', usrObj, tagLog);
                cb({err:null, ret:usrObj});
            });
        }
    });


}

module.exports = {
    login,
    createUser,
    getUserInfo,
    getUserIDBySessionID,
    checkSession,
}