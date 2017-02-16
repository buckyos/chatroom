#!/bin/bash

node download_sdk.js
rm -f master

cp -f ./bucky_sdk-master/proxytools.js ./
cp -f ./bucky_sdk-master/tools.js ./
cp -f ./bucky_sdk-master/node_core.js ./

mkdir -p ./source/target/wx/bucky
cp -f ./bucky_sdk-master/wx_core.js ./source/target/wx/bucky/

rm -rf ./bucky_sdk-master
