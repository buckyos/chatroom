// pages/chatroom/adminroom.js
var core = require('../../bucky/wx_core.js')
let buckyhelper = require('../../utils/buckyhelper');
let qrcode = require('../../utils/qrcode.js')

Page({
  data:{
    id:10000,
    name:"test",
    isAdmin: false,
    userInfo: {},
    QRSize:400,
    roomInfo:{},
    disableEdit: true,
    announce:"",
    editfocus: false
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    var that = this
    let admin = options.admin == "true"
    that.setData({
      id: options.id,
      isAdmin: admin,
      name: options.name
    })

    buckyhelper.getRoomInfo(options.id, function(roominfo){     
      that.setData({
        roomInfo:roominfo
      })

      buckyhelper.getChatRoomModule(function(chatroom){
        chatroom.getBBS(options.id, function(announce){
          if(announce){
            that.setData({
              announce:announce.bbs
              // announce.time
            })
          }
        })
      })

      buckyhelper.getAllUserInfos(roominfo.users, function(userInfo){
        that.setData({
          userInfo: userInfo
        })
      })
    })
  },
  onReady:function(){
    // 页面渲染完成

  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  },
  onBack: function(){
    wx.navigateBack({
      delta: 1, // 回退前 delta(默认为1) 页面
    })
  },
  onClickQRCode: function(event){
    wx.navigateTo({
      url: `/pages/chatroom/QRCode?id=${this.data.id}&name=${this.data.name}`,
    })
  },
  onShareAppMessage: function () {
    return {
      title: 'BuckyBucky Chatroom Invite',
      desc: this.data.name,
      path: `/pages/enterroom?id=${this.data.id}`
    }
  },
  OnDestoryRoom:function(event){
    let that = this;
    let openid = buckyhelper.getOpenID();
    buckyhelper.getChatRoomModule(function (chatroom) {
      chatroom.destroyChatRoom(openid, that.data.id, function (ret) {
        wx.navigateBack({delta:5});
      })
    });
  },
  OnLeaveRoom:function(event){
    let that = this;
    let openid = buckyhelper.getOpenID();
    buckyhelper.getChatRoomModule(function (chatroom) {
      chatroom.leaveChatRoom(that.data.id, openid, function (ret) {
        wx.navigateBack({delta:5});
      })
    });
  },
  onTapAnnounce: function(event){
    wx.navigateTo({
      url: `/pages/chatroom/Announce?id=${this.data.id}&name=${this.data.name}&admin=${this.data.isAdmin}`
    })
  }
})