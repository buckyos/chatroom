"use strict";

var fs = require('fs');
var path = require('path')

var curDir = __dirname;

let wx_header = "\"use strict\";\r\n \
var _core = require(\"../../wx_core.js\");\r\n \
var BaseLib = _core.BaseLib;\r\n \
var ErrorCode =_core.ErrorCode;\r\n \
var BX_LOG = _core.BX_LOG;\r\n \
var BX_CHECK = _core.BX_CHECK;\r\n \
var Application = _core.Application;\r\n \
var getCurrentRuntime = _core.getCurrentRuntime;\r\n \
var getCurrentApp = _core.getCurrentApp;\r\n \
var XARPackage = _core.XARPackage;\r\n \
var RuntimeInstance = _core.RuntimeInstance;\r\n \
var RuntimeInfo = _core.RuntimeInfo;\r\n \
var Device = _core.Device;\r\n \
var DeviceInfo = _core.DeviceInfo;\r\n \
var OwnerUser = _core.OwnerUser;\r\n \
var GlobalEventManager = _core.GlobalEventManager;\r\n \
var KnowledgeManager = _core.KnowledgeManager;\r\n \
\r\n \
"

function FixWXheader(path) {
    let scriptContent = fs.readFileSync(path, "utf8");
    let newScriptContent = scriptContent.replace("\"use strict\";", wx_header);
    fs.writeFileSync(path, newScriptContent);
}

FixWXheader(curDir+"/source/target/wx/bucky/packages/chatroom_proxy/chatroom.js")
FixWXheader(curDir+"/source/target/wx/bucky/packages/chatuser_proxy/chatuser.js")
FixWXheader(curDir+"/source/target/wx/bucky/packages/history_proxy/history.js")

var content = "appConfig:";
content += fs.readFileSync(curDir+"/source/packages/app.json");
content += ",\r\npackages:{\r\n\"path\":\"packages\""

function AddConfigFromPackage(packageName, packagePath) {
    content += ",\r\n\""+packageName+"\":";
    content += fs.readFileSync(packagePath+"/"+packageName+"/config.json");
}

AddConfigFromPackage("chatroom_proxy", curDir+"/source/target/wx/bucky/packages")
AddConfigFromPackage("chatuser_proxy", curDir+"/source/target/wx/bucky/packages")
AddConfigFromPackage("history_proxy", curDir+"/source/target/wx/bucky/packages")

content += "\r\n}";

fs.writeFileSync(curDir+"/source/target/wx_config.json", content);