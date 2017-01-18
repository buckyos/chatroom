// pages/chatroom/QRCode.js

let buckyhelper = require('../../utils/buckyhelper')
let qrcode = require('../../utils/qrcode.js')

Page({
  data:{
    QRSize:400,
    name: "",
    id:0,
    QRImageUrl:"",
    QRImageWidth:0,
    QRImageHeight:0
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    let that = this
    let id = options.id
    this.setData({name: options.name, id: options.id})
    buckyhelper.getChatRoomModule(function(chatroom){
      chatroom.getQRCode(`/pages/index/index?id=${options.id}`, buckyhelper.rpx2px(that.data.QRSize), function(url){
        if(url){
          that.setData({QRImageUrl:url})
        }
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
  onLoadQRImage:function(event){
    this.setData({QRImageWidth:event.detail.width, QRImageHeight:event.detail.height})
  }
})