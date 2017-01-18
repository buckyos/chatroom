#!/bin/sh

mkdir -p ./source/target/wx/bucky/packages

node proxytools.js -package ./source/packages/chatroom -out ./source/packages/chatroom_proxy
node proxytools.js -package ./source/packages/chatuser -out ./source/packages/chatuser_proxy
node proxytools.js -package ./source/packages/history -out ./source/packages/history_proxy

cp -rf ./source/packages/chatroom_proxy ./source/target/wx/bucky/packages/
cp -rf ./source/packages/chatuser_proxy ./source/target/wx/bucky/packages/
cp -rf ./source/packages/history_proxy ./source/target/wx/bucky/packages/

node make_wx_demo.js
