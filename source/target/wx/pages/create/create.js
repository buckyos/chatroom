const util = require('../../utils/util.js')
require('../../utils/date-utils')
const core = require('../../bucky/wx_core.js')
const buckyhelper = require('../../utils/buckyhelper');
const CallChain = core.CallChain;
const setCurrentCallChain = core.setCurrentCallChain;
const getCurrentTraceInfo = core.getCurrentTraceInfo;
const BX_INFO = core.BX_INFO;
const BX_ERROR = core.BX_ERROR;

Page({
  data: {
    // date: '2016-09-01'
  },
  onLoad: function () {
    this.setData({
      date: Date.tomorrow().toYMD(),
      startdate: new Date().toYMD(),
      enddate: new Date().addYears(1).toYMD(),
      limitLocation: false,
      latitude: 0,
      longitude: 0,
      address: ""
    });
  },
  formSubmit: function (e) {
    BX_INFO(e.detail.value, getCurrentTraceInfo());
    let name = e.detail.value.name;
    //let expire = e.detail.value.expire;
    let that = this;
    buckyhelper.getChatRoomModule(function(chatroom){
      let openid = buckyhelper.getSessionID();
      BX_INFO("create room", { openid: openid, name: name}, getCurrentTraceInfo());
      let gps = {};
      if (that.data.limitLocation){
        gps["latitude"] = that.data.latitude;
        gps["longitude"] = that.data.longitude;
      }

      let cc = new CallChain();
      setCurrentCallChain(cc);

      cc.logCall('createRoom');
      chatroom.createRoom(openid, name, 0, gps, function (roominfo) {
        cc.logReturn('createRoom');
        console.assert(roominfo.err || roominfo.ret, roominfo);
        BX_INFO("create room callback", roominfo, getCurrentTraceInfo());
        wx.hideToast();
        if (roominfo.ret){
          console.assert(roominfo.ret.id);
          wx.redirectTo({url: `../chatroom/chatroom?id=${roominfo.ret.id}`});
        } else {
          wx.showToast({ title: '创建房间失败!!' })
        }
        
      });
      wx.showToast({
        title: '创建中',
        icon: 'loading',
        duration: 10000,
        mask: true,
      });
    });
  },

  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
    });
  },

  onLimitLocation: function(event){
    let that = this;
    if(event.detail.value){
      wx.chooseLocation({
        success: function(res){
          that.setData({
            limitLocation: true,
            latitude: res.latitude,
            longitude: res.longitude,
            address:res.address+" "+res.name            
          });
          // success
        },
        fail: function() {
          // fail
          wx.showToast({
            title: "位置获取失败，不可限定位置"
          });
          that.setData({limitLocation: false});
        }
      });
    } else {
      that.setData({limitLocation: false});
    }
  }

});