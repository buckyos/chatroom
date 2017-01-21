var util = require('../../utils/util.js')
var core = require('../../bucky/wx_core.js')
let buckyhelper = require('../../utils/buckyhelper');

//FetchMessage(begin. step)
//begin > 0: normal
//begin < 0: count+begin
//step > 0: [begin, begin+step)
//step < 0: [begin+step, begin)
//step = 0: [begin, count)

Page({
  data: {
    id: 10000,
    isAdmin: false,
    roomInfo: {},
    history: [],
    historyOnceFetchCount:10,
    historyStartIndex:-1,
    historyEndIndex:-1,
    historyCount:0,
    inputValue: "",
    ViewHeight: 0,
    showAnnounce:false,
    lastUpdateTime:0,
    lastviewid:""
  },
  updateBBS(){
    let that = this
    buckyhelper.getRoomInfo(that.data.id, function(roominfo){
      if (roominfo) {
          console.log("get roominfo ", roominfo)
          if(roominfo.bbs){
              let lastUpdateTime = buckyhelper.getCustomRoominfo(that.data.id, "lastUpdateTime") | 0
              if(lastUpdateTime < roominfo.bbsTime){
                that.data.showAnnounce = true
              }
              
              that.setData({
                announce: roominfo.bbs,
                showAnnounce: that.data.showAnnounce,
                ViewHeight:that.data.ViewHeight-60,
                lastUpdateTime:roominfo.bbsTime,
                lastviewid:that.data.lastviewid
              });
            }
          
          that.setData({
            roomInfo: roominfo
          });
        } else {
          console.error('could not get room info, by id', that.data.id);
        }
    }, true)
  },
  onLoad: function (query) {
    this.setData({
      id: query.id,
      isAdmin: query.admin,
    });
    let that = this;
    //读取历史数据
    let datas = buckyhelper.readHistoryFromCache(that.data.id)
    that.setData({
      history: datas[0],
      historyStartIndex: datas[1],
      historyEndIndex: datas[2]
    })
    //设置推送
    let thisRuntime = core.getCurrentRuntime()
    let em = thisRuntime.getGlobalEventManager()
    let eventName = 'room_event_' + query.id
    console.log('attach event', eventName)
    em.attach(eventName, function(msg) {
      console.log('on room_event', msg)
      let msgObj = JSON.parse(msg)
      if(msgObj.eventType == "count"){
        that.FetchMessage(that.data.historyEndIndex, 0)
      } else if(msgObj.eventType == "bbs"){
        that.updateBBS()
      }
    }, function(result, unknown) {
      console.log('attach event callback ', result, unknown)
    })
    //主动更新一次公告
    that.updateBBS()

    
  },
  onShow: function(){
    //auto fetch last 10 messages or all newest messages
    
    let begin = this.data.historyStartIndex
    if(begin < 0){
      begin = -10
    }
    this.FetchMessage(begin, 0);
  },

  OnInputHeightChange:function(event){
    let heightrpx = event.detail.heightRpx
    let announceheight = 0;
    if(this.data.showAnnounce){
      announceheight = 60
    }
    let inputbottom = 0
    if(heightrpx > 80){
      inputbottom = 20
    }
    this.setData({
      //Screenheight-headerHeight-HistoryViewPaddingTop-inputSessionPaddingBottom-inputSessionPaddingTop-inputSessionHeight-AnnounceHeight
      ViewHeight:buckyhelper.getHeightrpx()-96-20-25-inputbottom-Math.max(80, heightrpx)-announceheight,
      lastviewid:this.data.lastviewid
    })
  },

  OnHistoryScroll:function(event){
    console.log(event.detail)
  },

  OnTapAnnounce:function(event){
    let ViewHeight = this.data.ViewHeight
    if(this.data.showAnnounce){
      ViewHeight=ViewHeight+60
    }
    buckyhelper.setCustomRoominfo(this.data.id, "lastUpdateTime", this.data.lastUpdateTime)
    this.setData({showAnnounce:false, ViewHeight:ViewHeight, lastviewid:this.data.lastviewid})
    this.OnEnterAdminRoom(event)
  },

  FetchMessage:function(begin, num){
    let that = this;
    buckyhelper.getChatRoomModule(function (chatroom) {
      chatroom.getHistoryCount(that.data.id, function (count) {
        let start = begin;
        if (begin < 0){
          start = count+begin
        }
        let end = start+num;
        if(num < 0){
          end = begin;
          start = end+num
        } else if(num == 0){
          end = count
        }

        if (start < 0){
          start = 0
        }
        if(end > count){
          end = count
        }

        if(start == that.data.historyStartIndex && end == that.data.historyEndIndex){
          return
        }

        console.log('get history list, start', start, 'end', end);
        chatroom.getHistoryList(that.data.id, start, end, function (historyList) {
          console.log('get history list callback', historyList);
          if(that.data.historyStartIndex == -1 || start < that.data.historyStartIndex){
            that.setData({historyStartIndex:start})
          }
          if(that.data.historyEndIndex == -1 || end > that.data.historyEndIndex){
            that.setData({historyEndIndex:end})
          }
          buckyhelper.getHistoryModule(function (history) {
            that.getHistoryInfoByHistoryList(history, historyList, function (infos) {
              if (infos.length == 0){
                return;
              }
              let count = 0;
              function getUserInfoCallback(userinfo){
                  infos[count].userInfo = userinfo;
                  infos[count].type = 1
                  count++;
                  if (count >= infos.length) {
                      //infos.push({content:"测试系统信息", id:99999, roomid:12122, type:2})
                      console.log("history infos ",infos)
                      for (let i=0;i<infos.length;i++){
                        that.data.history.push(infos[i])
                      }
                      that.data.history.sort(function(a, b){
                        if(a.id > b.id){
                          return 1
                        } else if(a.id == b.id){
                          return 0
                        } else {
                          return -1
                        }
                      })

                      that.setData({
                        history: that.data.history
                      })
                     // buckyhelper.writeHistoryToCache(that.data.id, that.data.history, that.data.historyStartIndex, that.data.historyEndIndex)
                      if(infos.length > 0){
                        that.setData({lastviewid:"id_"+infos[infos.length-1].id})
                      }
                      
                  } else {
                      buckyhelper.getUserInfo(infos[count].from, getUserInfoCallback);
                  }
              }

              buckyhelper.getUserInfo(infos[count].from, getUserInfoCallback);
            
            });
          });
        });
      });
    });
  },
  onBack:function(){
    wx.navigateBack({
      delta: 1, // 回退前 delta(默认为1) 页面
    })
  },

  onFetchMessage: function () {
    //fetch all latest message
    this.FetchMessage(this.data.historyEndIndex, 0);
  },

  onSubmitForm: function (e) {
    console.log(e.detail.value.message);
    let content = e.detail.value.message;
    let that = this;
    let openid = buckyhelper.getOpenID();
    buckyhelper.getHistoryModule(function (history) {
        console.assert(history != null)
        console.log('add history', that.data.roomInfo.id, openid, content);
        history.addHistory(that.data.roomInfo.id, openid, '', content, 1, function (result) {
          console.log('add history result', result);

          that.onFetchMessage();
        });
    });
    that.setData({inputValue:""});
  },

  getHistoryInfoByHistoryList: function (history, historyList, cb) {
    console.log('getHistoryInfoByHistoryList', historyList);
    if (historyList.length == 0) {
      cb([]);
    } else {
      let historyIndex = 0;
      let historyInfos = []
      function getHistoryInfoCallback(historyInfo) {
        if (historyIndex > historyList.length) {
          cb(historyInfos);
        } else {
          historyInfos.push(historyInfo);
          history.getHistory(historyList[historyIndex++], getHistoryInfoCallback);
        }
      }

      history.getHistory(historyList[historyIndex++], getHistoryInfoCallback);
    }
  },
  OnEnterAdminRoom: function(event){
    wx.navigateTo({url: `../chatroom/adminroom?id=${this.data.id}&name=${this.data.roomInfo.name}&admin=${this.data.isAdmin}`});
  },
  onScrollUpper: function(event){
    //这里需要增量更新
    this.FetchMessage(this.data.historyStartIndex, -10);
  },
  onUnload:function(){
    // 页面关闭
    //buckyhelper.removeRoomCountUpdate(this.data.id)
    let thisRuntime = core.getCurrentRuntime()
    let em = thisRuntime.getGlobalEventManager()
    em.detach('room_event_'+this.data.id)
  }
})