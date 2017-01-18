// pages/chatroom/setting.js
let buckyhelper = require('../../utils/buckyhelper');

Page({
  data:{
    userInfo:{},
    customName: "",
    imgs: ['../../pics/avatar1.jpg', '../../pics/avatar2.jpg', '../../pics/avatar3.jpg','../../pics/avatar4.jpg',
           '../../pics/avatar5.jpg', '../../pics/avatar6.jpg', '../../pics/avatar7.jpg','../../pics/avatar8.jpg']
  },
  onLoad:function(options){
    let userInfo = buckyhelper.getSelfUserInfo()

    if (!userInfo.customName){
      userInfo.customName = userInfo.nickName
    }

    if (!userInfo.customImg){
      userInfo.customImg = userInfo.avatarUrl
    }

    //this.data.imgs.push(userInfo.avatarUrl)
    this.setData({
      userInfo: userInfo,
      customName: userInfo.customName,
      imgs: this.data.imgs
    })
    // 页面初始化 options为页面跳转所带来的参数
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
    this.data.userInfo.customName = this.data.customName

    buckyhelper.setSelfUserInfo(this.data.userInfo)
  },

  nameInput:function(event){
    this.setData({customName: event.detail.value})
  },
  onTapAvatar: function(event){
    this.data.userInfo.customImg = event.target.id
    this.setData({userInfo: this.data.userInfo})
  },
  onRecoveryAvatar: function(event){
    this.data.userInfo.customImg = this.data.userInfo.avatarUrl
    this.setData({userInfo: this.data.userInfo})
  }
})