//谷歌扩展使用：chrome_js.js
//普通网页使用：web_js.js
//主要是为了兼容普通网页和谷歌扩展；如果是在谷歌扩展里面的调用这个js，和谷歌扩展相关的api操作在这；
// 如果是在普通网页直接调用谷歌扩展的方法的话会报错

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
