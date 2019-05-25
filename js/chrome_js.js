//谷歌扩展使用：chrome_js.js
//普通网页使用：web_js.js
//主要是为了兼容普通网页和谷歌扩展；如果是在谷歌扩展里面的调用这个js，和谷歌扩展相关的api操作在这；
// 如果是在普通网页直接调用谷歌扩展的方法的话会报错
//后缀 _c 的方法是 chrome_js.js 真实执行，而 web_js.js 对应的是个空的，反过来一样
//私有的_开头，私有的属性放在最上面，私有方法放在最下面；保证 chrome_js、web_js 同名方法顺序相同

var PassUtil = {
    type: 'chrome_js'

    ,_bg: chrome.extension.getBackgroundPage()  //background 对象

    ,set_storage: function (json) {
        chrome.storage.local.set(json);
    }
    ,get_storage: function (arr, callback){
        chrome.storage.local.get(arr, function(sl){
            //console.log(sl);
            callback && callback(sl);
        });
    }
    ,set_storage_c: function(json){
        this.set_storage(json);
    }
    ,get_storage_c: function (arr, callback){
        this.get_storage(arr, callback);
    }
    ,set_storage_w: function(json){}
    ,get_storage_w: function (arr, callback){}

    /**
     * h5本地储存，好处：同步方式，但是background.js取不到，所以范围小的可以用
    */
    ,set_local_storage: function(json){
        for(let key in json){
            localStorage[key] = JSON.stringify(json[key]);
        }
        return true;
    }

    /**
     *  同步，有返回值
     *
     * @param string|array     要获取的键
     * @return json     {}     对应的json对象
     */
    ,get_local_storage: function (arr){
        var arr = typeof arr == 'string'? [arr]: arr;

        var sl = {};
        arr.forEach(function(item){
            sl[item] = localStorage[item]? JSON.parse(localStorage[item]): '';
        })

        return sl;
    }

    //只能 web 用的 session 储存,谷歌扩展的时候使用 set_storage
    ,set_session_storage: function(json){
        this.set_storage(json);
    }
    ,get_session_storage: function (arr, callback){
        this.get_storage(arr, callback);
    }

    /**
     * 是否真正的在线（因为用户信息一直保存，不能根据用户id判断是否真的在线，这个包括服务器端）
     * 扩展要判断本地和服务器同时在线才是true，浏览器只需判断 user_id,服务器下线了就不能操作了
     */
    ,is_online: function(){
        return this._bg.is_online();
    }

    /**
     * 服务器是否可以访问
     */
    ,is_server_online: function(){
        //return this._bg.is_server_online; //不用这种方式了，如果没有登录什么的就不会开定时器，所以不准，用下面的同步

        var is_server_online = false;

        _get(url.get_status, '', function(response){
            if(response.code != 500){
                is_server_online = true;
            }
        }, null, false);

        return is_server_online;
    }

    /**
     *  更新本地用户信息（本地储存 + 更新 user_info 变量 + 通知后台用户信息更改）
     *  使用 session 储存，获取也是
     *
     *  @param object data  格式 {user_id: 1, username: flyu, ……} 或者默认为{}
     */
    ,update_local_user_info: function(data){
        var data = data || {};
        user_info = data;
        this.set_session_storage({user_info: data})
        this._bg.bg_login();
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
    ,pass_list: function(url, data, success, error){
        var data = !$.isEmptyObject(data)? data: {};
        var p = data.p || 1;
        var limit = data.limit || 15;
        var keyword = data.keyword || ''; //多个用空格分割
        var tag = data.tag || ''; //不支持多个
        var search_fileds = ['site_name', 'desc', 'username']; //要搜索的字段 site_name、desc、username
        var list = this._bg.pass_all;
        var tags = [];  //所有的标签

        //这里不存本地读取了， background.js 初始化的时候已经读取了，全部再变量 pass_all 里面
        var returnData = {
            count: 0,
            list: [],
            limit: limit,
            tags: []    //统计出所有的标签
        };

        if($.isEmptyObject(list)){
            success(show('数据为空', 300));
            return true;
        }

        //统计所有的标签、去重
        list.forEach(function(item){
            if(!tags.includes(item.tag)){
                tags.push(item.tag);
            }
        })

        returnData.tags = tags;

        //如果标签存在，先搜标签
        if(tag && tag != '全部'){
            tag = tag == '未设置'? '': tag;
            list = array_search(list, ['tag'], tag, true);
            if(!list || !list.length){
                success(show('数据为空', 300, returnData));
                return true;
            }
        }

        //搜索
        if(keyword){
            list = array_search(list, search_fileds, keyword);
            if(!list || !list.length){
                success(show('数据为空', 300, returnData));
                return true;
            }
        }

        //排序（直接在前面根据字母分组了，不在这排序了）

        //截取（不截取了）

        returnData.count = list.length;
        returnData.list = list;

        success(show('查询成功', 200, returnData));
    }

    /**
     *  站点详情（id存在查id，_index 存在查 _index）
     *  谷歌扩展这个特殊点，1、有返回值，用的时候小心，web_js没返回值；2、里面有个索引 _index 为了之后的编辑和删除提供索引
     */
    ,pass_detail: function(url, data, success){
        var data = data || {};
        var id = data.id || null;
        var _index = $.isNumeric(data._index)? Number(data._index): null;

        if($.isEmptyObject(this._bg.pass_all)){
            success && success(show('数据为空', 300));
            return show('数据为空', 300);
        }

        var info = null;

        $.each(this._bg.pass_all, function(key, item){
            if(id && id == item.id || $.isNumeric(_index) && _index == item._index){
                info = item;
                return false;   //打断，不循环了
            }
        });

        if(info){
            success && success(show('查询成功', 200, info));
            return show('查询成功', 200, info);
        }else{
            success && success(show('数据为空', 300));
            return show('数据为空', 300);
        }
    }

    //添加、编辑站点
    ,pass_add: function(url, data, success){
        var data = data || [];  //过来的是数组[{name: 'xx', value: 'xx'}]
        var data_tmp = {};

        //格式化data
        data.forEach(function(item){
            data_tmp[item.name] = item.value;
        })

        data = data_tmp;

        //如果 _index 存在，则是编辑
        if($.isNumeric(data._index)){
            var response = this.pass_detail('', {_index: data._index});

            if(!response || response.code != 200){
                success(show(400, '该站点地址不存在'));
                return;
            }

            var oldData = response.data;    //以原数据做模板
        }else{
            var oldData = this._bg.pass_scheme;    //用这个作为模板

            //补充数据
            data.user_id = user_info.user_id;
        }

        var newData = json_replace(oldData, data);  //用输入数据替换老数据
        this._pass_save(newData);
        success(show('处理成功', 200));
        return;
    }

    //删除站点
    ,pass_delete: function(url, data, success){
        if(!$.isNumeric(data._index)){
            success(show(400, '该站点地址不存在'));
            return;
        }else {
            this._pass_delete(data._index);
            success(show('处理成功', 200));
        }
    }

    //数据同步，过程：先上传后下载，具体说明看 background.js -> pass_sync()
    ,pass_sync_c: function(success){
        this._bg.pass_sync(success);
    }

    /**
     * 清空本地站点数据
     *
     * 步骤：1、清空 pass_all；2、清空本地 pass_all 储存；3、把有id的添加到删除列表里面，4、更新本地版本号，5、以后有了再加（如：更新索引）
     */
    ,pass_clear: function(){

        //更新删除列表
        this._bg.update_pass_delete_storage(this._bg.pass_all);

        //清空数据
        this._bg.update_pass_storage([]);
    }

    /**
     * 更改站点数据同步方式（只有在扩展的时候才有效）
     *
     * 步骤：1、更新变量 sync_method，2、更新储存的 sync_method，3、通知后台计划变了
     *
     * @param new_method 要改成的，1手动，2自动
     */
    ,update_sync_method: function(new_method){
        sync_method = new_method;

        //通知后台，按计划行事
        this._bg.update_sync_method(new_method);
    }

    //保存选择的标签
    ,update_search_tag: function(tag){
        tag = tag || '';
        this.set_local_storage({search_tag: tag});
    }

    //获取选择的标签
    ,get_search_tag: function(){
        var tag_tmp = this.get_local_storage('search_tag');
        return tag_tmp.search_tag || '';
    }

    /**
     *  更新本地站点列表版本
     *
     *  如果普通的本地操作可以不传值，这样就不会和线上相同，
     *  如果从服务器上下载数据，则把服务器上的版本传过来，保持同步
     *  完成后通知 background
     */
    ,_updata_local_pass_box_version(version){
        this._bg.update_version(version);
    }

    /**
     * 保存、更新本地站点数据
     *
     * 步骤：1、替换、添加至 this._bg.pass_all；2、更新本地储存；3、处理创建、更新时间，4、处理当前站点在整个列表的索引 _index
     *
     * @param obj   pass    json 对象
     */
    ,_pass_save: function(pass){
        var time = get_timestamp();
        if($.isNumeric(pass._index)){
            var _index          = Number(pass._index);
            pass.updatedTime    = time;
            pass._index         = _index;
            pass._is_changed    = true;

            this._bg.pass_all[_index] = pass;
        }else{
            pass.createdTime = time;
            pass.updatedTime = time;
            pass._index      = this._bg.pass_all.length;
            pass._is_changed = true;    //这个模板里面已经有了，不用在这指定了

            this._bg.pass_all.push(pass);
        }

        this.set_storage({pass_all: this._bg.pass_all});
        this._updata_local_pass_box_version();
    }

    /**
     * 删除本地站点数据（添加一个单独的本地储存，同步的时候删去）
     *
     * 步骤：1、从 this._bg.pass_all 删除；2、更新本地储存；
     * 3、如果是服务器数据（有id的）添加一个单独的本地储存 键：pass_delete_list，
     *
     * @param int   index    索引
     */
    ,_pass_delete: function(index){
        var index = Number(index);

        //从变量删除
        var old = this._bg.pass_all.splice(index, 1);   //这个会改变原数组

        if($.isEmptyObject(old)){
            return true;
        }

        //更新数据
        this._bg.update_pass_storage(this._bg.pass_all);

        //更新删除列表
        this._bg.update_pass_delete_storage(old);
    }


}
