// pages/chatroom/enterroom.js
const core = require('../../bucky/wx_core.js');
const CallChain = core.CallChain;
const setCurrentCallChain = core.setCurrentCallChain;
const buckyhelper = require('../../utils/buckyhelper');

Page({
  data:{
    id:NaN
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    if (options.id) {
      this.SetData({
        id: options.id
      })
    }
  },
  onReady:function(){
    // 页面渲染完成
    if (this.data.id){
        buckyhelper.enterChatRoom(this.data.id);
    }
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
  onSubmitEnterRoomForm: function (e) {
    console.log(e.detail);
    let roomid = e.detail.value.roomid;
    console.log('enter room id', roomid);
    if (!roomid) {
      wx.showToast({
        title: '请输入房间ID'
      });
      return;
    }
    buckyhelper.enterChatRoom(roomid);
  },
});