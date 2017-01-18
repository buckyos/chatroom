var util = require('../../utils/util.js')
require('../../utils/date-utils')
var core = require('../../bucky/wx_core.js')
let buckyhelper = require('../../utils/buckyhelper');
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
    console.log(e.detail.value);
    let name = e.detail.value.name;
    //let expire = e.detail.value.expire;
    let that = this
    //console.log(name, expire);
    /*
    if (!name || !expire) {
      console.error("you need set name and expire");
      return;
    }
    */
    buckyhelper.getChatRoomModule(function(chatroom){
      let openid = buckyhelper.getOpenID()
      console.log("create room", { openid: openid, name: name});
      let gps = {};
      if (that.data.limitLocation){
        gps["latitude"] = that.data.latitude
        gps["longitude"] = that.data.longitude
      }
      chatroom.createRoom(openid, name, 0, gps, function (roominfo) {
        console.log("create room callback", roominfo);
        wx.redirectTo({
          url: `../chatroom/chatroom?id=${roominfo.id}`
        });
      });
    })
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
          })
          // success
        },
        fail: function() {
          // fail
          wx.showToast({
            title: "位置获取失败，不可限定位置"
          })
          that.setData({limitLocation: false})
        }
      })
    } else {
      that.setData({limitLocation: false})
    }
  }

})