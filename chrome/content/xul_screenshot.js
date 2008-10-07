function run() {
    var browser = document.getElementById("browser");
    var cmdLine = window.arguments[0];
    cmdLine = cmdLine.QueryInterface(Components.interfaces.nsICommandLine);
    var url = cmdLine.handleFlagWithParam("url", false);
    var file_path = cmdLine.handleFlagWithParam("file", false);
    var image_type = cmdLine.handleFlagWithParam("type", false);
    if (url && file_path) {
        if (!image_type) {
            image_type = 'png';
        }
        browser.loadURI(url);
        browser.addEventListener("load", function() {
            setTimeout(function () {
                try {
                    shot(file_path, image_type);
                } finally {
                    quit();
                }
            }, 
            1);
        },
        true);
    }
}

function shot(file_path, image_type) {
    var browser = document.getElementById("browser");
    var width = browser.width;
    var height = browser.height;

    var canvas = document.getElementById("canvas");
    prepare_canvas(canvas, width, height);

    var context = canvas.getContext("2d");
    prepare_context(context, width, height);

    var win = browser.contentWindow;
    context.drawWindow(win, 0, 0, width, height, "rgb(0,0,0)");
    context.restore();
    
    var dataUrl = canvas.toDataURL("image/" + image_type);
    var nsFile = get_nsFile(file_path);
    
    write_data_to_file(dataUrl, nsFile);
}

function prepare_canvas(canvas, width, height) {
    var styleWidth = width + "px";
    var styleHeight = height + "px";
    canvas.width = width;
    canvas.style.width = styleWidth;
    canvas.style.maxWidth = styleWidth;
    canvas.height = height;
    canvas.style.height = styleHeight;
    canvas.style.maxHeight = styleHeight;
}

function prepare_context(context, width, height) {
    context.clearRect(0, 0, width, height);
    context.save();
}

function to_binary_input_stream(dataUrl) {
    var nsIoService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var channel = nsIoService.newChannelFromURI(nsIoService.newURI(dataUrl, null, null));
    
    var binaryInputStream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
    binaryInputStream.setInputStream(channel.open());
    return binaryInputStream;
}

function get_file_output_stream(nsFile) {
    var fileOutputStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
    fileOutputStream.init(nsFile, 0x02 | 0x20 | 0x08, 0664, null); // PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE
    return fileOutputStream;
}

function write_data_to_file(dataUrl, nsFile) {
    var binaryInputStream = to_binary_input_stream(dataUrl);
    var fileOutputStream = get_file_output_stream(nsFile);
    var numBytes = binaryInputStream.available();
    var bytes = binaryInputStream.readBytes(numBytes);
    fileOutputStream.write(bytes, numBytes);
    fileOutputStream.close();
}

function quit() {
  var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);
  appStartup.quit(Components.interfaces.nsIAppStartup.eForceQuit);
}

/*
 * 以下を参考にしました（というかまんま）。
 * http://piro.sakura.ne.jp/latest/blosxom/mozilla/xul/2007-06-05_relative.htm
 */
function get_nsFile(file_path) {
    var nsFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
    try {
        nsFile.initWithPath(file_path);
        return nsFile;
    } catch (e) {
    }
    var platform = Components.classes['@mozilla.org/network/protocol;1?name=http']
                   .getService(Components.interfaces.nsIHttpProtocolHandler).oscpu;
    if (platform.indexOf('Win') > -1) {
        aPath = aPath.replace(/^\.\.\./g, '\.\.\\\.\.')
        .replace(/\\\.\.\./g, '\\\.\.\\\.\.')
        .replace(/\\/g, '/');
    }
    const DIR = Components.classes['@mozilla.org/file/directory_service;1']
                .getService(Components.interfaces.nsIProperties);
    var dir = DIR.get('CurWorkD', Components.interfaces.nsIFile);
    nsFile.setRelativeDescriptor(dir, file_path);
    return nsFile;
}

