//谷歌扩展使用：chrome_js.js
//普通网页使用：web_js.js
//主要是为了兼容普通网页和谷歌扩展；如果是在谷歌扩展里面的调用这个js，和谷歌扩展相关的api操作在这；
// 如果是在普通网页直接调用谷歌扩展的方法的话会报错
//后缀 _c 的方法是 chrome_js.js 真实执行，而 web_js.js 对应的是个空的，反过来一样

var PassUtil = {
    type: 'chrome_js'
    ,set_storage: function (obj) {
        chrome.storage.local.set(obj);
    }
    ,get_storage: function (arr, callback){
        chrome.storage.local.get(arr, function(sl){
            //console.log(sl);
            callback && callback(sl);
        });
    }
    ,set_storage_c: function(obj){
        PassUtil.set_storage(obj);
    }
    ,get_storage_c: function (arr, callback){
        PassUtil.get_storage(arr, callback);
    }
    ,set_storage_w: function(obj){}
    ,get_storage_w: function (arr, callback){}

    //只能 web 用的 session 储存,谷歌扩展的时候使用 set_storage
    ,set_session_storage: function(obj){
        PassUtil.set_storage(obj);
    }
    ,get_session_storage: function (arr, callback){
        PassUtil.get_storage(arr, callback);
    }
    ,pass_list: function(url, data, success, error){
        var data = {};
        var p = data.p || 1;
        var limit = data.limit || 15;
        var keyword = data.keyword || '';
        var that = this;

        chrome.storage.local.get('pass_list', function(s){
            var returnData = {
                count: 0,
                list: [],
                limit: limit
            };

            if(s.pass_list == ''){
                success(that.show('数据为空', 300));
                return true;
            }

            //搜索、排序、截取……
            var list = s.pass_list;
            returnData.list = list;

            success(that.show('查询成功', 200, returnData));
        })
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
    ,show: function(msg, code, data){
        msg = msg || '';
        code = code || '';

        var _return = {
            code  : code,
            msg   : msg,
            data  : data
        };
        if(Array.isArray(msg)){
            _return['msg'] = msg[0];
            _return['sub_msg'] = msg[1];

            if(Array.isArray(code)){
                _return['code'] = code[0];
                _return['sub_code'] = code[1];
            }
        }else{
            _return['sub_msg']  = msg;
            _return['sub_code'] = code;
        }
        return _return;
    }
}
