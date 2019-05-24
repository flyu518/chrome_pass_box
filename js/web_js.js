//谷歌扩展使用：chrome_js.js
//普通网页使用：web_js.js
//主要是为了兼容普通网页和谷歌扩展；普通网页不能调用谷歌扩展api，做个同名的在这
//后缀 _c 的方法是 chrome_js.js 真实执行，而 web_js.js 对应的是个空的，反过来一样
//私有的_开头，私有的属性放在最上面，私有方法放在最下面；保证 chrome_js、web_js 同名方法顺序相同

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
        this.set_storage(obj);
    }
    ,get_storage_w: function (arr, callback){
        this.get_storage(arr, callback);
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

    /**
     * 是否真正的在线（因为用户信息一直保存，不能根据用户id判断是否真的在线，这个包括服务器端）
     * 扩展要判断本地和服务器同时在线才是true，浏览器只需判断 user_id,服务器下线了就不能操作了
     */
    ,is_online: function(){
        return user_info.user_id? true: false;
    }

    /**
     * 服务器是否可以访问
     */
    ,is_server_online: function(){
        var is_server_online = false;

        _get(url.get_status, '', function(response){
            if(response.code != 500){
                is_server_online = true;
            }
        }, null, false);

        return is_server_online;
    }

    /**
     *  更新本地用户信息（本地储存 + 更新 user_info 变量）
     *  使用 session 储存，获取也是
     *
     *  @param object data  格式 {user_id: 1, username: flyu, ……} 或者默认为{}
     */
    ,update_local_user_info: function(data){
        var data = data || {};
        user_info = data;
        this.set_session_storage({user_info: data})
    }

    /**
     * 退出
     *
     * 步骤：1、清空 user_info；2、清空 session 储存；3、以后有了再加
     */
    ,logout: function(){
        //现在和更新用户信息一样，直接调用了，有区别的时候再改
        this.update_local_user_info();
    }

    //站点列表
    ,pass_list: function(url, data, success_fn, error_fn){
        _get(url, data, success_fn, error_fn);
    }

    //站点详情、搜索站点（id存在查id，site_url 存在查 site_url）
    ,pass_detail: function(url, data, success){
        _get(url, data, success);
    }

    //添加、编辑站点
    ,pass_add: function(url, data, success){
        _post(url, data, success);
    }

    //删除站点
    ,pass_delete: function(url, data, success){
        _post(url, data, success);
    }

    //数据同步，过程：先上传后下载，具体说明看 background.js -> pass_sync()
    ,pass_sync_c: function(success){
        success(show('处理成功', 200));
    }

    //清空本地站点数据 （chrome_js 用，这个不储存，所以不清空）
    ,pass_clear: function(){}

    //更改站点数据同步方式（只有在扩展的时候才有效）
    ,change_sync_method: function(new_method){}
}