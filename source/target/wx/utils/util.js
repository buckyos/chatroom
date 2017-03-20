const buckyhelper = require('buckyhelper');
const core = require('../bucky/wx_core')

const BX_INFO = core.BX_INFO;
const BX_ERROR = core.BX_ERROR;

function formatTime(date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()


    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
}

function chatUserLogin(onComplete) {
    // 1. 先登录微信
    wx.login({
        success: function(res) {
            // success
            buckyhelper.getChatUserModule(function(chatuser) {
                BX_INFO("will chatuser.login");
                // 2. 再登录会聊
                chatuser.login(res.code, function(ret) {
                    BX_INFO(`chatuser.login callback sessionID=${ret.sessionid} err=${ret.err}`);
                    if (ret.sessionid) {
                        buckyhelper.setSessionID(ret.sessionid)

                        onComplete(true);
                    } else {
                        BX_ERROR(`chatuser.login callback err ${ret.err}`);
                        onComplete(false);
                    }

                })
            })
        },
        fail: function() {
            // fail
            BX_ERROR('wx.login 登录失败！请重试');
            onComplete(false);
        }
    })

}

function updateUserInfo(sessionID, onComplete) {
    wx.getUserInfo({
        success: function(res) {
            // success
            buckyhelper.setSelfUserInfo(res.userInfo)
        },
        fail: function() {
            // fail
            let userInfo = {}
            userInfo["nickName"] = "默认用户名"
            userInfo["avatarUrl"] = "../../pics/avatar1.jpg"
            userInfo["gender"] = "famale"
            buckyhelper.setSelfUserInfo(userInfo)

            BX_ERROR("wx.getUserInfo failed");
        },
        complete: function() {
            let userInfo = buckyhelper.getSelfUserInfo()
            buckyhelper.getChatUserModule(function(chatuser) {
                chatuser.createUser(sessionID, userInfo.nickName, userInfo.avatarUrl, userInfo.gender, function(ret) {
                    BX_INFO('create user callback ', ret.err, ret.ret);

                    console.assert(ret.err || ret.ret);

                    if (ret.err) {
                        onComplete(false);
                    } else {
                        onComplete(true, ret.ret);
                    }


                })
            })

        }
    })
}

module.exports = {
    formatTime,
    chatUserLogin,
    updateUserInfo
}