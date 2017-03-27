// index.js
// 获取应用实例
let buckyhelper = require('../../utils/buckyhelper')
buckyhelper.Init();

const util = require('../../utils/util');

const core = require('../../bucky/wx_core');
const BX_INFO = core.BX_INFO;
const BX_LOG = core.BX_LOG;
const BX_ERROR = core.BX_ERROR;
const CallChain = core.CallChain;
const setCurrentCallChain = core.setCurrentCallChain;
const getCurrentTraceInfo = core.getCurrentTraceInfo;

const app = getApp();
Page({
    data: {
    userInfo: {},
    createRooms: [],
    enterRooms: [],
    isLogin:false,
    ViewHeight: 0
    }
  },
  // 事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../login/login'
    })
  },
  onCreateRoom: function () {
    wx.navigateTo({
      url: '../create/create'
    })
  },

    _refreshCreateRoomList: function(cc, cb) {
        let that = this;
        let openid = buckyhelper.getSessionID();

        const ccRefreshCreateRoomList = new CallChain(cc);
        ccRefreshCreateRoomList.logCall('listChatRoom');

        buckyhelper.getChatRoomModule(function(chatroom) {
            chatroom.listChatRoom(openid, function(rooms) {
                BX_LOG('listChatRoom', rooms, getCurrentTraceInfo());
                
                ccRefreshCreateRoomList.logReturn('listChatRoom');

                console.assert(rooms.err == null, rooms.err);
                if (rooms.ret) {

                    
                ccRefreshCreateRoomList.logCall('getRoomInfoByRoomIds');

                    buckyhelper.getRoomInfoByRoomIds(rooms.ret, function(roominfos) {
                        ccRefreshCreateRoomList.logReturn('getRoomInfoByRoomIds');
                        that.setData({
                            createRooms: roominfos
                        });

                        ccRefreshCreateRoomList.logEnd();

                        if (cb) {
                            cb();
                        }
                    });
                }
            });
        });
    },

    _refreshEnterRoomList: function(cc, cb) {
        let that = this;

        const ccRefreshEnterRoomList = new CallChain(cc);
        ccRefreshEnterRoomList.logCall('listAllChatRoom');

        let openid = buckyhelper.getSessionID();
        buckyhelper.getChatRoomModule(function(chatroom) {
            chatroom.listAllChatRoom(openid, function(rooms) {
                BX_LOG('listAllChatRoom callback', rooms, getCurrentTraceInfo());

                ccRefreshEnterRoomList.logReturn('listAllChatRoom');

                console.assert(rooms.err == null, rooms.err);
                if (rooms.ret) {

                    ccRefreshEnterRoomList.logCall('getRoomInfoByRoomIds');
                    buckyhelper.getRoomInfoByRoomIds(rooms.ret, function(roominfos) {

                        ccRefreshEnterRoomList.logReturn('getRoomInfoByRoomIds');

                        let NonAdminRooms = [];
                        for (var i = 0; i < roominfos.length; i++) {
                            if (roominfos[i] && roominfos[i].admin != openid) {
                                NonAdminRooms.push(roominfos[i]);
                            }
                        }
                        that.setData({
                            enterRooms: NonAdminRooms
                        });

                        ccRefreshEnterRoomList.logEnd();

                        if (cb) {
                            cb();
                        }
                    });
                }
            })
        })
    },

    OnEnterRoomTap: function(event) {
        let roomid = event.currentTarget.dataset.id;
        let isadmin = event.currentTarget.dataset.admin;
        let name = event.currentTarget.dataset.name;
        if (event.target.id == 'adminBtn') {
            wx.navigateTo({
                url: `../chatroom/adminroom?id=${roomid}&name=${name}&admin=${isadmin}`
            });
        } else {
            wx.navigateTo({
                url: `../chatroom/chatroom?id=${roomid}&admin=${isadmin}`
            });
        }
    },
    onClickSetting: function(event) {
        wx.navigateTo({
            url: '../chatroom/setting'
        });
    },
    OnEnterAdminRoom: function(event) {
        /*
        let parent = event.target.parentNode
        let roomid = event.currentTarget.dataset.id
        let isadmin = event.currentTarget.dataset.admin
        let name = event.currentTarget.dataset.name
    
        */
    },

    ScanRoomID: function() {
        wx.scanCode({
            success: function(res) {
                if (!res.path) {
                    wx.showToast({
                        title: '二维码格式错误'
                    });
                } else {
                    wx.redirectTo({
                        url: res.path
                    });
                }
            }
        })
    },

    onClickCreateBtn: function(event) {
        var that = this;
        wx.showActionSheet({
            itemList: ['创建房间', '扫一扫', '输入房间号'],
            success: function(res) {
                if (!res.cancel) {
                    switch (res.tapIndex) {
                        case 0:
                            wx.navigateTo({
                                url: '../create/create'
                            });
                            break;
                        case 1:
                            that.ScanRoomID();
                            break;
                        case 2:
                            wx.navigateTo({
                                url: '../chatroom/enterroom'
                            });
                    }
                }
            }
        })
    },

    onClickRefreshBtn: function() {
        this._refreshRoomList();
    },

    onShow: function() {
        if (this.data.isLogin) {
            this._updateUserInfo();

            this._refreshRoomList();
        }
    },

    onUserUpdate: function(openid) {
        buckyhelper.getUserInfo(openid, function(userinfo) {}, true);
    },

    onRoomDestory: function(roomid) {
        let newrooms = [];
        for (let i = 0; i < this.data.enterRooms.length; i++) {
            if (this.data.enterRooms[i].id != roomid) {
                newrooms.push(this.data.enterRooms[i]);
            }
        }
        this.setData({
            enterRooms: newrooms
        });
    },
    onRoomCountUpdate: function(roomid, count) {
        buckyhelper.fireRoomCountUpdate(roomid, count);
    },

    // 刷新界面用户头像和昵称
    _updateUserInfo: function() {
        const userInfo = buckyhelper.getSelfUserInfo();
        if (userInfo) {
            this.setData({
                userInfo,
                isLogin: true
            });
        }
    },

    _refreshRoomList: function() {
        const ccRefreshRoomList = new CallChain();
        setCurrentCallChain(ccRefreshRoomList);

        ccRefreshRoomList.logCall('refreshRoomList');

        let cbCount = 0;
        let cb = function() {
            cbCount++;
            if (cbCount === 2) {
                ccRefreshRoomList.logReturn('refreshRoomList');
                ccRefreshRoomList.logEnd();
            }
        };

        this._refreshCreateRoomList(ccRefreshRoomList, cb);
        this._refreshEnterRoomList(ccRefreshRoomList, cb);
    },

    onLoad: function(option) {
        BX_LOG('onLoad', getCurrentTraceInfo());
        var that = this;
        if (option.roomid) {
            that.setData({
                roomid: option.roomid
            });
        }

        let res = wx.getSystemInfoSync();
        buckyhelper.SetSystemInfo(res.windowHeight, res.windowWidth);
        that.setData({
            ViewHeight: buckyhelper.getHeightrpx() - 96
        });

        let sessionID = buckyhelper.getSessionID();

        buckyhelper.buckyReady(this.data.appConfig, this.data.packages, () => {
            BX_INFO('buckyhelper.buckyReady', getCurrentTraceInfo());
            buckyhelper.getChatUserModule(chatuser => {
                BX_INFO('getChatUserModule', chatuser, getCurrentTraceInfo());

                const ccCheckSession = new CallChain();
                setCurrentCallChain(ccCheckSession);

                ccCheckSession.logCall('checkSession');
                chatuser.checkSession(sessionID, (isValid) => {
                    BX_INFO(`checkSession isValid ${isValid}`, getCurrentTraceInfo());

                    ccCheckSession.logReturn('checkSession');
                    ccCheckSession.logEnd();

                    if (!isValid) {
                        wx.showToast({
                            title: '登录中',
                            icon: 'loading',
                            duration: 10000
                        });

                        const ccUserLogin = new CallChain();
                        setCurrentCallChain(ccUserLogin);

                        ccUserLogin.logCall('chatUserLogin');

                        BX_INFO(`will util.chatUserLogin`, getCurrentTraceInfo());
                        util.chatUserLogin(result => {
                            BX_INFO(`util.chatUserLogin result ${result}`, getCurrentTraceInfo());

                            ccCheckSession.logReturn('checkSession');
                            ccCheckSession.logEnd();

                            wx.hideToast();
                            if (!result) {
                                BX_ERROR(`chat user login failed`, getCurrentTraceInfo());
                                wx.showToast({
                                    title: '登录失败!请检查网络连接'
                                });
                            } else {
                                util.updateUserInfo(buckyhelper.getSessionID(), (result, userInfo) => {
                                    BX_INFO('updateUserInfo1 callback', result, getCurrentTraceInfo());
                                    this._updateUserInfo();
                                    this._refreshRoomList();
                                });
                            }
                        });
                    } else {
                        util.updateUserInfo(sessionID, (result, userInfo) => {
                            BX_INFO('updateUserInfo2 callback', result, getCurrentTraceInfo());

                            this._updateUserInfo();
                            this._refreshRoomList();
                        });
                    }
                });
            });
        });
    }
});