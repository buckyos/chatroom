var fs = require('fs');
var http = require('http');
var https = require('https');
var AdmZip = require('adm-zip')
 
function downloadFile(url, localFile, callback) {
  var httpClient = url.slice(0, 5) === 'https' ? https : http;
  var writer = fs.createWriteStream(localFile);
  writer.on('finish', function() {
    callback(localFile);
  });
  httpClient.get(url, function(response) {
    response.pipe(writer);
  });
}

downloadFile("https://codeload.github.com/buckyos/bucky_sdk/zip/master", "master", function(localfile)
{
    var zip = new AdmZip(localfile);
    zip.extractAllTo(".", true);
})