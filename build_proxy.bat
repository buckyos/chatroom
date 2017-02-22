mkdir  .\source\target\wx\bucky\packages

node proxytools.js -package ./source/packages/chatroom -out ./source/packages/chatroom_proxy
node proxytools.js -package ./source/packages/chatuser -out ./source/packages/chatuser_proxy
node proxytools.js -package ./source/packages/history -out ./source/packages/history_proxy

xcopy /E /Y .\source\packages\chatroom_proxy .\source\target\wx\bucky\packages\chatroom_proxy\
xcopy /E /Y .\source\packages\chatuser_proxy .\source\target\wx\bucky\packages\chatuser_proxy\
xcopy /E /Y .\source\packages\history_proxy .\source\target\wx\bucky\packages\history_proxy\

node make_wx_demo.js
