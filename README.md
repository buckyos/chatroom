# chatroom
Live会聊(开源微信小程序）

#系统需求： 
1. 一个Bash环境，Cygwin/MinGW/Win10 Bash均可；巴克云团队日常使用win10 bash环境进行开发
2. 在这个Bash环境依赖：node.js 7.1以上版本

#注册,并获取appID, UID和Token：
1. 打开http://www.tinyappcloud.com/ ,进入小应用云官网 
2. 点击按钮，进入账号注册页面 
3. 填入必要信息，注册账号 
4. 登录后自动进入dashboard页面，首先点击右上角的用户信息页面，点击 “更新Token”按钮，生成UID和Token； UID和Token用于发布后端代码，Token有效期为3天，使用旧Token或过期Token会导致代码发布失败
5. 点击左边菜单栏的 "添加新应用"，输入自定义的应用名称，就可创建一个小应用，得到"应用 ID"即AppID；以后可以在左侧菜单栏直接点击应用名称查看appID

#运行会聊
 1. clone chatroom代码 
 2. 修改source/packages/app.json, 填入获取的appid 
 3. 修改pub_and_clean.sh和pub_not_clean.sh, 填入获取的uid和token
 4. 运行update_latest_sdk.sh  
手动更新 bucky_sdk:从github下载bucky_sdk，将proxytools.js, tools.js, node_core.js拷贝到根目录，将wx_core.js拷贝到source/target/wx/bucky/目录，没有这个目录需手动创建 
 5. 运行install_npm_deps.sh, 安装 node 必要组件 
 6. 运行build_proxy.sh, 生成供服务器和wx使用的proxy 
 7. 运行修改后的pub_and_clean.sh, 第一次发布工程 运行pub_not_clean.sh 更新已发布的代码，不影响数据
 8. 新建小程序，填入自己的小程序appid，目录指向./source/target/wx 
 9. 打开./source/target/wx_config.json,将其中内容拷贝到微信小程序的index.js的data段，覆盖原来的appConfig和packages段
