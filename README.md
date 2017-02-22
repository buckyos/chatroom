# chatroom
Live会聊(开源微信小程序）

#系统需求：
1. win10 Bash或Windows环境，巴克云团队日常使用win10 bash环境进行开发
2. 对应环境下依赖：node.js 7.1以上版本

在Bash环境下： 使用.sh脚本；在windows环境下，使用对应文件名的.bat脚本

#注册,并获取appID, UID和Token：
1. 打开http://www.tinyappcloud.com/ ,进入小应用云官网
2. 点击按钮，进入账号注册页面
3. 填入必要信息，注册账号
4. 登录后点击左边菜单栏的 "添加新应用"，输入自定义的应用名称，就可创建一个小应用，得到"应用ID、应用UID和应用Token"
   应用ID即AppID, 需填入app.json中。 
   应用UID和Token用于发布后端代码，Token有效期为3天，使用旧Token或过期Token会导致代码发布失败；可以随时点击Token框后的"更新"按钮，来生成一个新Token，生成后旧Token即失效

#步骤
1. clone chatroom代码
2. 修改source/packages/app.json, 填入获取的appid
3. 修改pub_and_clean.sh和pub_not_clean.sh, 填入获取的uid和token
4. 运行install_npm_deps.sh, 安装 node 必要组件
5. 运行update_latest_sdk.sh, 自动更新最新版本的bucky sdk
   或： 手动更新bucky_sdk: 从github下载bucky_sdk，将proxytools.js, tools.js, node_core.js拷贝到根目录，将wx_core.js拷贝到source/target/wx/bucky/目录，没有这个目录需手动创建
6. 运行build_proxy.sh, 生成供服务器和wx使用的proxy
7. 运行修改后的pub_and_clean.sh, 第一次发布工程
   运行pub_not_clean.sh 更新已发布的代码，不影响数据
   注意： clean时需要app.json中应用ID， 脚本中应用UID和Token三个值都必须一致，否则update knowledge会失败
8. 新建小程序，填入自己的小程序appid，目录指向./source/target/wx
9. 打开./source/target/wx_config.json,将其中内容拷贝到微信小程序的index.js的data段，覆盖原来的appConfig和packages段
   index.js位置： source/target/wx/pages/index/index.js
   首先检查index.js的data中是否已有appConfig, packages字段，如果有，则将wx_config.json中新的内容覆盖这两个字段，。如没有，则将wx_config.json中全部内容粘贴到data段中
   如果后续有修改app.json的内容，或新增了package，必须重新运行build_proxy.sh， 生成新proxy，并对应更新微信小程序index.js中字段的内容

#注意：由于部分函数(getOpenID, getQRCode)包含小程序敏感信息，开源的代码中已将这两部分信息去掉，这些接口需使用者自己补全信息后才可以正常运作。具体参见chatroom.js和charuser.js中的注释