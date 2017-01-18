// index.js
// 获取应用实例
let buckyhelper = require('../../utils/buckyhelper')
buckyhelper.Init()
var app = getApp()
Page({
  data: {
    motto: 'Hello Bucky',
    userInfo: {},
    createRooms: [],
    enterRooms: [],
    isLogin:false,
    appConfig: {
      'appid': 'wMvbmOeYAl',
      //'appid': 'bx.demos',
      'appHost': 'https://weixin.xmaose.com/apphost/',
      'repositoryHost': 'https://dev.tinyappcloud.com/services/repository71',
      'knowledgeHost': 'https://dev.tinyappcloud.com/services/knowledge/get_value',
      'appver': '1.0.0.1',
      'token': 'abcdef0123'
    },
    packages: {
      'path': 'packages',
      'chatroom_proxy': {
        'packageID': 'chatroom_proxy',
        'version': '1.0.0.0',
        'build': 1,
        'deviceType': '*',
        'meta': {
          'desc': 'chat room'
        },
        'depends': [],
        'modules': {
          'chatroom': 'chatroom.js',
          'history': 'history.js',
          'chatuser': 'chatuser.js'
        },
        'drivers': [],
        'knowledges': [{ 'key': 'global.events', 'type': 1 },
        { 'key': 'global.runtimes', 'type': 1 },
        { 'key': 'global.devices', 'type': 1 },
        { 'key': 'global.storages', 'type': 1 },
        { 'key': 'global.loadrules', 'type': 0 }],
      },
      'chatuser_proxy': {

        "packageID": "chatuser_proxy",
        "version": "1.0.0.0",
        "build": 1,
        "deviceType": "*",
        "meta": {
          "desc": "chat user"
        },
        "depends": [],
        "modules": {
          "chatuser": "chatuser.js"
        },
        "drivers": [],
        "knowledges22": [
          "global.events",
          "global.runtimes",
          "global.devices",
          "global.storages",
          "global.loadrules",
          "global.log"
        ],
        'knowledges': [{ 'key': 'global.events', 'type': 1 },
        { 'key': 'global.runtimes', 'type': 1 },
        { 'key': 'global.devices', 'type': 1 },
        { 'key': 'global.storages', 'type': 1 },
        { 'key': 'global.loadrules', 'type': 0 }],
      },
      'history_proxy': {
        "packageID": "history_proxy",
        "version": "1.0.0.0",
        "build": 1,
        "deviceType": "*",
        "meta": {
          "desc": "chat chathisory"
        },
        "depends": [],
        "modules": {
          "history": "history.js"
        },
        "drivers": [],
        "knowledges22": [
          "global.events",
          "global.runtimes",
          "global.devices",
          "global.storages",
          "global.loadrules",
          "global.log"
        ],
       'knowledges': [{ 'key': 'global.events', 'type': 1 },
        { 'key': 'global.runtimes', 'type': 1 },
        { 'key': 'global.devices', 'type': 1 },
        { 'key': 'global.storages', 'type': 1 },
        { 'key': 'global.loadrules', 'type': 0 }],
      },
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

  onRefreshCreateRoomList: function () {
    let that = this
    let openid = buckyhelper.getOpenID()
    buckyhelper.getChatRoomModule(function (chatroom) {
      chatroom.listChatRoom(openid, function (rooms) {
        console.log('listChatRoom', rooms)
        if (rooms) {
          buckyhelper.getRoomInfoByRoomIds(rooms, function (roominfos) {
            that.setData({
              createRooms: roominfos
            })
          })
        }
      })
    })
  },

  onRefreshEnterRoomList: function () {
    let that = this

    let openid = buckyhelper.getOpenID()
    buckyhelper.getChatRoomModule(function (chatroom) {
      chatroom.listAllChatRoom(openid, function (rooms) {
        console.log('listAllChatRoom callback', rooms)
        if (rooms) {
          buckyhelper.getRoomInfoByRoomIds(rooms, function (roominfos) {
            let NonAdminRooms = []
            for (var i = 0; i < roominfos.length; i++) {
              if (roominfos[i] && roominfos[i].admin != openid) {
                NonAdminRooms.push(roominfos[i])
              }
            }
            that.setData({
              enterRooms: NonAdminRooms
            })
          })
        }
      })
    })
  },

  OnEnterRoomTap: function (event) {
    let roomid = event.currentTarget.dataset.id
    let isadmin = event.currentTarget.dataset.admin
    let name = event.currentTarget.dataset.name
    if (event.target.id == 'adminBtn') {
      wx.navigateTo({ url: `../chatroom/adminroom?id=${roomid}&name=${name}&admin=${isadmin}` })
    } else {
      wx.navigateTo({ url: `../chatroom/chatroom?id=${roomid}&admin=${isadmin}` })
    }
  },
  onClickSetting: function (event) {
    wx.navigateTo({ url: '../chatroom/setting' })
  },
  OnEnterAdminRoom: function (event) {
    /*
    let parent = event.target.parentNode
    let roomid = event.currentTarget.dataset.id
    let isadmin = event.currentTarget.dataset.admin
    let name = event.currentTarget.dataset.name
    
    */
  },

  ScanRoomID: function () {
    wx.scanCode({
      success: function (res) {
        let roomid = parseInt(res.result)
        if (roomid == NaN) {
          wx.showToast({ title: '二维码格式错误' })
        } else {
          buckyhelper.enterChatRoom(roomid)
        }
      }
    })
  },

  onClickCreateBtn: function (event) {
    var that = this
    wx.showActionSheet({
      itemList: ['创建房间', '扫一扫', '输入房间号'],
      success: function (res) {
        if (!res.cancel) {
          switch (res.tapIndex) {
            case 0:
              wx.navigateTo({ url: '../create/create' })
              break
            case 1:
              that.ScanRoomID()
              break
            case 2:
              wx.navigateTo({ url: '../chatroom/enterroom' })
          }
        }
      }
    })
  },

  onClickRefreshBtn: function (event) {
    this.onRefreshCreateRoomList()
    this.onRefreshEnterRoomList()
  },

  onShow: function () {
    if(this.data.isLogin){
      this.setData({ userInfo: buckyhelper.getSelfUserInfo()})
      this.onRefreshCreateRoomList()
      this.onRefreshEnterRoomList()
    }
  },

  onUserUpdate: function (openid) {
    buckyhelper.getUserInfo(openid, function (userinfo) { }, true)
  },
  onRoomInfoUpdate: function (roomid) {
    buckyhelper.getRoomInfo(roomid, function (roominfo) { }, true)
  },
  onRoomDestory: function (roomid) {
    let newrooms = []
    for (let i = 0; i < this.data.enterRooms.length; i++) {
      if (this.data.enterRooms[i].id != roomid) {
        newrooms.push(this.data.enterRooms[i])
      }
    }
    this.setData({ enterRooms: newrooms })
  },
  onRoomCountUpdate: function (roomid, count) {
    buckyhelper.fireRoomCountUpdate(roomid, count)
  },

  onLoad: function () {
    console.log('onLoad')
    var that = this

    let res = wx.getSystemInfoSync()
    buckyhelper.SetSystemInfo(res.windowHeight, res.windowWidth)
    that.setData({
      ViewHeight: buckyhelper.getHeightrpx() - 96
    })

    function UpdateUserInfo(openid){
      wx.getUserInfo({
        success: function(res){
          // success
          buckyhelper.setSelfUserInfo(res.userInfo)
          buckyhelper.getChatUserModule(function(chatuser){
            chatuser.createUser(openid, res.userInfo.nickName, res.userInfo.avatarUrl, res.userInfo.gender, function (userinfo) {
              console.log('create user callback ', userinfo)
              wx.hideToast()
              that.setData({ userInfo: buckyhelper.getSelfUserInfo(), isLogin:true })
              that.onRefreshCreateRoomList()
              that.onRefreshEnterRoomList()
            })
          })
        },
        fail: function() {
          // fail
        }
      })
    }

    let openid = buckyhelper.getOpenID()

    buckyhelper.buckyReady(this.data.appConfig, this.data.packages, function () {
      //1. 检测登录是否过期
      let isNeedLogin = false
      wx.checkSession({
        fail: function(){
          isNeedLogin = true
        },
        complete: function(){
          if (isNeedLogin || !openid){
            //2. 登录过期或没有UserID的情况下，走登陆流程
            wx.showToast({
              title: '登录中',
              icon: 'loading',
              duration: 10000
            })
            wx.login({
              success: function(res){
                // success
                buckyhelper.getChatUserModule(function(chatuser){
                  chatuser.login(res.code, function(userid){
                    buckyhelper.setOpenID(userid)
                    UpdateUserInfo(userid)
                  })
                })
              },
              fail: function() {
                // fail
                console.log('登录失败！' + res.errMsg)
                wx.showToast({
                  title: '登录失败!请检查网络连接'
                })
              }
            })
            
          } else {
            //2.2 登录没有过期，直接取用户信息更新更新
            UpdateUserInfo(openid)
          }
        }
      })
    })
  }
})
