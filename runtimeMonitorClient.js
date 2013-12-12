var prefix = 'smr_monitor';
console.log('Runtime Monitor, Run!');
var dataUrl = '/' + prefix + '/data';
var commandUrl = '/' + prefix + '/command/';

var queryData = function(post){
    var xhr = new window.XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4) {
            var result;
            if (xhr.status >= 200 && xhr.status < 300) {
              result = xhr.responseText;
              ondata(null,JSON.parse(result));
            } else {
                ondata(xhr.responseText,null);   
            }
        }
    };
    xhr.open(post ? 'POST' : 'GET', dataUrl, true);
    xhr.send(post || '');
};
var VisibleMap = {} , Command = {};
var toWatchPage = function(){
    var content = "<div>" ,values;
    var input = document.createElement('span');
    for(var key in VisibleMap){
        values = VisibleMap[key];
        
        if(values.indexOf(/\<\>/i)){
            input.innerText = values;
            values = input.innerHTML;
        }
        
        values = values.replace(/\\n/igm,"\n");
        values = values.replace(/\\t/igm,"\t");
        //values = values.replace(/\\"/igm,'"');
        //values = values.replace(/\\'/igm,"'");
        
        content += "<h2>" + key + "</h2><pre>" + values + "</pre>";
    }
    content += "</div>";
    document.getElementById('monitor').innerHTML = content;
    return content;
};
var toCommandPage = function(){
    var content = '',value;
    for(var key in Command){
        value = Command[key];
        content += '<a href="' + commandUrl + encodeURI(value) +  '">' + value + '</a>';
    }
    document.getElementById('commands').innerHTML = content;
    return content;
};
var ondata = function(err,data){
    if(err){
        return;
    }
    VisibleMap = data.data;
    Command = data.command;
    toWatchPage();
    toCommandPage();
};

var setPrefix = function(_prefix){
    prefix = _prefix;
    dataUrl = '/' + prefix + '/data';
    commandUrl = '/' + prefix + '/command/';
};

window.onload = function(){
    queryData();
    setInterval(queryData,5 * 1000);
};

