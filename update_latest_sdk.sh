#!/bin/bash

wget https://codeload.github.com/buckyos/bucky_sdk/zip/master
unzip master -d ./sdk
rm -f master

cp -f ./sdk/bucky_sdk-master/proxytools.js ./
cp -f ./sdk/bucky_sdk-master/tools.js ./
cp -f ./sdk/bucky_sdk-master/node_core.js ./

mkdir -p ./source/target/wx/bucky
cp -f ./sdk/bucky_sdk-master/wx_core.js ./source/target/wx/bucky/

rm -rf ./sdk