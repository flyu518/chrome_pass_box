//谷歌扩展使用：chrome_js.js
//普通网页使用：web_js.js
//主要是为了兼容普通网页和谷歌扩展；普通网页不能调用谷歌扩展api，做个同名的在这
//后缀 _c 的方法是 chrome_js.js 真实执行，而 web_js.js 对应的是个空的，反过来一样

var PassUtil = {
    type: 'web_js'
    ,set_storage: function (obj) {  //
        for(let key in obj){
            localStorage[key] = JSON.stringify(obj[key]);
        }
        return true;
    }
    ,get_storage: function (arr, callback){
        var arr = typeof arr == 'string'? [arr]: arr;

        var sl = {};
        arr.forEach(function(item){
            sl[item] = localStorage[item]? JSON.parse(localStorage[item]): '';
        })

        callback && callback(sl);
    }
    ,set_storage_c: function(obj){}
    ,get_storage_c: function (arr, callback){}
    ,set_storage_w: function(obj){
        PassUtil.set_storage(obj);
    }
    ,get_storage_w: function (arr, callback){
        PassUtil.get_storage(arr, callback);
    }

    //只能 web 用的 session 储存,谷歌扩展的时候使用 set_storage
    ,set_session_storage: function(obj){
        for(let key in obj){
            sessionStorage[key] = JSON.stringify(obj[key]);
        }
        return true;
    }
    ,get_session_storage: function (arr, callback){
        var arr = typeof arr == 'string'? [arr]: arr;

        var sl = {};
        arr.forEach(function(item){
            sl[item] = sessionStorage[item]? JSON.parse(sessionStorage[item]): '';
        })

        callback && callback(sl);
    }
    ,pass_list: function(url, data, success_fn, error_fn){
        PassUtil._get(url, data, success_fn, error_fn);
    }
    ,_get: function(url, data, success_fn, error_fn){
        PassUtil._ajax('get', url, data, success_fn, error_fn);
    }
    ,_post: function(url, data, success_fn, error_fn){
        PassUtil._ajax('post', url, data, success_fn, error_fn);
    }
    ,_ajax: function(type, url, data, success_fn, error_fn){
        $.ajax({
            url: url
            ,type: type || 'get'
            ,dataType: 'json'
            ,data: data
            ,crossDomain: true  //跨域
            ,xhrFields: {withCredentials: true} //跨域的时候带着cookie，这个设置了，后台的 -Origin 不能设置 *，必须指定
            ,success: function(data){
                success_fn && success_fn(data);
            }
            ,error: function(data){
                error_fn && error_fn(data);
            }
        });
    }
}