//谷歌扩展使用：chrome_js.js
//普通网页使用：web_js.js
//主要是为了兼容普通网页和谷歌扩展；普通网页不能调用谷歌扩展api，做个同名的在这

var PassUtil = {
    set_storage: function (obj) {
        chrome.storage.local.set(obj);
    }
    ,get_storage: function (arr, callback){
        chrome.storage.local.get(arr, function(sl){
            //console.log(sl);
            callback && callback(sl);
        });
    }
}