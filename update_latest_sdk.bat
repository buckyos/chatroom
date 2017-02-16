node download_sdk.js
del /q master

xcopy /Y .\bucky_sdk-master\proxytools.js .\
xcopy /Y .\bucky_sdk-master\tools.js .\
xcopy /Y .\bucky_sdk-master\node_core.js .\

mkdir .\source\target\wx\bucky
xcopy /Y .\bucky_sdk-master\wx_core.js .\source\target\wx\bucky\

rd /s /q .\bucky_sdk-master