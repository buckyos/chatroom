// pages/chatroom/Announce.js
let buckyhelper = require('../../utils/buckyhelper');

Page({
  data:{
    editStatus: "编辑",
    isAdmin:false,
    disableEdit: true,
    announce:"",
    editfocus: false,
    name:"",
    id:0,
    editHeight:0
  },
  onLoad:function(options){
    let that = this
    let admin = options.admin == "true"
    that.setData({
      id: options.id,
      isAdmin: admin,
      name: options.name,
      editHeight: buckyhelper.getHeightrpx()-96-10
    })
    // 页面初始化 options为页面跳转所带来的参数
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
  onTapEdit: function(){
    let that = this
    if (that.data.disableEdit){
      that.setData({
        disableEdit: false,
        editfocus: true,
        editStatus: "保存"
      })
    } else {
      that.setData({
        disableEdit: true,
        editfocus:false,
        editStatus: "编辑"
      })
      buckyhelper.getChatRoomModule(function(chatroom){
        chatroom.setBBS(buckyhelper.getOpenID(), that.data.id, that.data.announce, function(result){
          if(result){
            wx.showToast({"title":"公告保存成功"})
          } else {
            wx.showToast({"title":"只有管理员才可以保存公告"})
          }
        })
      })
    }
  },
  OnAnnounceInput: function(event){
    this.setData({
      announce:event.detail.value
    })
  },
  onBack: function(){
    wx.navigateBack({
      delta: 1, // 回退前 delta(默认为1) 页面
    })
  }
})