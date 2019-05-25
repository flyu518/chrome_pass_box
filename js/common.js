

var base_url = 'http://www.yii.com';
var url = {
    login : base_url +'/user/login',
    register : base_url +'/user/register',
    logout : base_url +'/user/logout',
    pass_index : base_url +'/pass/index',
    pass_detail : base_url +'/pass/detail',
    pass_add : base_url +'/pass/add',
    pass_delete : base_url +'/pass/delete',
    pass_add_tags : base_url +'/pass/add-tags',
    pass_sync : base_url +'/pass/sync',
    get_status : base_url +'/pass/get-status',
    user_test : base_url +'/user/test',
}

/**
 * 用这个方法也是没办法的，谷歌扩展有安全限制，不让用什么append的；所有要用到这里面的方法都要写在回调方法里面
 *
 * @param url
 * @param callback
 */
function loadScript(url, callback) {
    var html = document.getElementsByTagName("html")[0];
    var script = document.createElement("script");
    script.src = url;
    var done = false;

    html.appendChild(script);
    script.onload = script.onreadystatechange = function() {
        if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
            done = true;
            callback();
        }
    };
}


//获取指定url网站的icon图片
function get_icon(url){
    var domain = get_domain(url);
    if($.isEmptyObject(domain)) return '';

    return 'http://statics.dnspod.cn/proxy_favicon/_/favicon?domain='+ domain;
}

/**
 * 获取域名，如：http://www.baidu.com/index/index.php 返回 www.baidu.com
 * @param url
 * @returns {string}
 */
function get_domain(url){
    if($.isEmptyObject(url)) return '';
    if(url.indexOf('.') == -1) return '';
    url = url.replace(/https?\:\/\//, '').replace(/\/w/);
    var arr = url.split(/\/|\#|\?/);
    return arr[0];
}

/**
 * 获取随机密码
 *
 * @param int   num     生成几位密码，默认10位
 * @param int   type    类型，默认1：数字+字母+符号(,.;@&-=+_)；2：数字+字母；3：数字
 */
function get_random(num, type){
    var num = num || 10;
    var type = type || 1;
    var zimu = "abcdefghijklmnopqrstuvwxyz";
    var shuzi = "0123456789";
    var fuhao = ",.;@&-=+_";
    var pwd = "";

    if(type == 2){
        var str = shuzi + zimu;
    }else if(type == 3){
        var str = shuzi;
    }else{
        var str = shuzi + zimu + fuhao;
    }

    var str_len = str.length;

    for(var i=0; i<num; i++){
        pwd += str[Math.floor(Math.random() * str_len)];
    }

    return pwd;
}

/**
 * 获取日期
 * @returns {string}
 */
function get_date(){
    var date_obj=new Date()
    var month=date_obj.getMonth()+1
    var date=/(\d+) (\d+) (\d+:\d+:\d+)/g.exec(date_obj)
    return date[2]+"-"+(month<10?'0'+month:month)+"-"+date[1]
}

/**
 * 获取日期时间
 */
function get_date_time(){
    var date_obj=new Date();
    var month=date_obj.getMonth()+1
    var date=/(\d+) (\d+) (\d+:\d+:\d+)/g.exec(date_obj)

    return date[2]+"-"+(month<10?'0'+month:month)+"-"+date[1]+" "+date[3];
}

/**
 * 获取时间戳
 */
function get_timestamp(){
    var date_obj=new Date();

    return Math.ceil(date_obj/1000);
}

/**
 * json 模板数据替换
 *
 *  作用：以 oldData 为基础模板，newData 为要设置的数据，newData 比 oldData 多的过滤掉，少的以 oldData 作为默认值填充
 *
 * @param oldData   格式：，{id: 1, username: 'xx'}
 * @param newData   格式相同
 */
function json_replace(oldData, newData){

    var oldDataTmp = {};    //不要直接修改oldData，这个是对象属性，修改了之后原对象也会变

    for(let key in oldData){
        if(newData[key] != undefined){
            oldDataTmp[key] = newData[key];
        }else{
            oldDataTmp[key] = oldData[key];
        }
    }

    return oldDataTmp;
}

/**
 * 数组字段模糊搜索
 * 支持 一、二维数组、一二维混套格式['a', 'b', ['c', 'd']] 和 一维数组套的json（格式[{id: 1, name: flyu, ……}, ……]）
 *
 * @param array         arr       被搜索的数组
 * @param array|string  fileds    被搜索的字段数组或字符串，如果是一、二维数组，可以为空
 * @param string        keywords  要搜索的字符串，多个用空格隔开
 * @param bool          is_all_eq 是否全等，默认false,模糊；true就不是模糊了
 *
 * @return array|bool       符合条件的列表
 *
 * 例如：var arr = [{'id': 3, 'name': 'flyu', 'desc': 'flyu简介'}, {'id': 1, 'name': 'xiaokai', 'desc': 'flyu简介'},
 * {'id': 2, 'name': '小明', 'desc': '哈航昂'}, {'id': 4, 'name': '大明', 'desc': '哦哦'}];
 *  array_search(arr, ['name', 'desc'], 'flyu 哦')
 */
function array_search(arr, fileds, keywords, is_all_eq){
    if(!Array.isArray(arr)) return false;
    if(!Array.isArray(fileds)) fileds = [fileds];
    if(typeof keywords != 'string') return false;   //可以空字符串
    keywords = $.trim(keywords);

    var keywords = $.trim(keywords).replace(/\s+/g, '|');

    var arr_json_index = [];    //对于数组套json的，如果json中一个符合了，其他的就不用比较了

    var data = [];
    arr.forEach(function(item, key){
        if(typeof item == "string" || typeof item == "number"){  //一维数组
            if(is_all_eq){
                if(item === keywords){
                    data.push(item);
                }
            }else{
                if(new RegExp(keywords, 'i').test(item)){
                    data.push(item);
                }
            }
        }else if(Array.isArray(item)){  //二维数组
            var s_data = [];
            item.forEach(function(s_item){
                if(typeof s_item != 'string' && typeof item != "number") return ;

                if(is_all_eq){
                    if(s_item === keywords){
                        data.push(item);
                    }
                }else{
                    if(new RegExp(keywords, 'i').test(s_item)){
                        s_data.push(s_item);
                    }
                }
            })
            s_data.length && data.push(s_data);
        }else if(objIsJson(item)){ //json
            for(s_key in item){
                var s_item = item[s_key];

                //如果一个json的一个字段搜出来了就可以跳过其他的了，如果字段在要搜索的里面
                if(!arr_json_index.includes(key) && fileds.includes(s_key)){
                    if(typeof s_item != 'string' && typeof s_item != "number") return ; //TODO

                    if(is_all_eq){
                        if(s_item === keywords){
                            data.push(item);
                            arr_json_index.push(key);
                        }
                    }else{
                        if(new RegExp(keywords, 'i').test(s_item)){
                            data.push(item);
                            arr_json_index.push(key);
                        }
                    }
                }
            }
        }else{
            return false;
        }
    })

    return data;
}

/**
 * 数组根据某字段的值按照26个字母分组
 * 支持 一、二维数组、一二维混套格式['a', 'b', ['c', 'd']] 和 一维数组套的json（格式[{id: 1, name: flyu, ……}, ……]）
 *
 * @param array     arr       被分组的数组，
 * @param string    field     分组依据字段（二维数组是第二层的索引，json对象是字段）
 * @param bool      empty     如果某个字母对应的数据为空，是否用空数组补充，默认不补充
 * @returns [{letter: 'a', data: ['a', 'abc']}, {letter: 'b', data: ['b']}, ……]
 *
 * 例如：var arr = ['a', 'b', '小崔啊', '哈哈', 'hhh', 'abc'];
 * console.log(array_group_by_letter(arr));
 *
 var arr = [{'id': 3, 'name': 'flyu', 'desc': 'flyu简介'}, {'id': 1, 'name': 'xiaokai', 'desc': 'flyu简介'},
 {'id': 2, 'name': '小明', 'desc': '哈航昂'}, {'id': 4, 'name': '大明', 'desc': '哦哦'}, {'id': 4, 'name': '大明11', 'desc': '哦哦'}
 , {'id': 4, 'name': '大明22', 'desc': '哦哦'}, {'id': 4, 'name': '大家好', 'desc': '哦哦'}];
 console.log(array_group_by_letter(arr, 'name'));

 var arr = [['你好啊', '啊啊'], ['你在哪', '真的是你啊'], ['真的啊', '没骗你'], ['啊啊'], ['aaa']];
 console.log(array_group_by_letter(arr, 0))
 */
function array_group_by_letter(arr, field, empty) {
    if(!String.prototype.localeCompare)
        return null;

    var letters = "*abcdefghjklmnopqrstwxyz".split('');
    var zh = "阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀".split('');

    var segs = [];
    var curr;
    $.each(letters, function(i){
        curr = {letter: this, data:[]};

        //这一步只是按英文字母分类
        $.each(arr, function() {
            //这个条件是根据区间，如： 八 > arr > 阿，就放到 a 里面；
            // 但是有特殊情况，zh排序中文都比英文、undefined小，英文v之前的也比undefined小，没问题，
            // 但是v之后的会比undefined大，就出问题了，vwxyz这些开头的英文是会被过滤，
            // 所以用：!letters.includes(this[0]) 去除英文开头的字母，
            // 要把英文字母也添加到结果里面 所以用：letters[i] == this[0] 保留符合的

            if(typeof this == 'string'){
                if((!zh[i-1] || zh[i-1].toString().localeCompare(this,"zh") <= 0) &&
                    (this.toString().localeCompare(zh[i],"zh") == -1 && !letters.includes(this[0]) || letters[i] == this[0])) {
                    curr.data.push(this);
                }
            }else if(Array.isArray(this) || objIsJson(this)){
                if((!zh[i-1] || zh[i-1].toString().localeCompare(this[field],"zh") <= 0) &&
                    (this[field].toString().localeCompare(zh[i],"zh") == -1 && !letters.includes(this[field][0]) || letters[i] == this[field][0])) {
                    curr.data.push(this);
                }
            }
        });

        //如果有数据就保留
        if(empty || curr.data.length) {
            segs.push(curr);
        }
    });
    return segs;
}

/**
 * 数组排序
 * 注意：如果中文和拼音、英文在一块，拼音、英文会在最后面，两块都是按顺序排，如果想让对应的中文和英文开头的在一块，
 * 先用数组分类处理一下 array_group_by_letter()，再排序好点
 *
 * @param array  arr       支持：一维、二维（要指定 field，最好循环调用）、json对象列表(要指定 field，格式：[{id: 1, name: 'flyu', info: {city: '上海'}}, ……]）
 * @param int    sort      排序方式：0正序（默认），1倒序
 * @param string field     要排序的字段，一维不需要；二维、json对象列表必须，如：'id'、 'name'、'info.city'
 *
 * 例：var arr = [{id: 1, name: 'flyu', info: {city: '上海'}}, {id: 2, name: '行号', info: {city: '南京'}}]
 * console.log(array_sort(arr, 0, 'id'));
 */
function array_sort(arr, sort, field){

    //获取数组元素内需要比较的值
    function getValue (option) { // 参数： option 数组元素
        if (!field) return option;
        var data = option
        field.split('.').filter(function (item) {
            data = data[item]
        })
        return data + ''
    }

    var result;
    arr.sort(function (item1, item2) {
        result = getValue(item1, field).toString().localeCompare(getValue(item2, field), 'zh-CN');
        result = sort? -result: result;

        return result;
    })

    return arr;
}

function _get(url, data, success_fn, error_fn, async){
    _ajax('get', url, data, success_fn, error_fn, async);
}

function _post(url, data, success_fn, error_fn, async){
    this._ajax('post', url, data, success_fn, error_fn, async);
}

//错误的也通过成功的返回了，父状态码500，子状态详情；错误回调同样生效
function _ajax(type, url, data, success_fn, error_fn, async){
    $.ajax({
        url: url
        ,type: type || 'get'
        //,dataType: 'json'
        ,data: data
        ,async: async === false? false: true
        ,crossDomain: true  //跨域
        ,xhrFields: {withCredentials: true} //跨域的时候带着cookie，这个设置了，后台的 -Origin 不能设置 *，必须指定
        ,success: function(data){
            if(typeof data == 'string'){
                if(/login/i.test(data)){
                    data = show('请登录', 100);
                }
            }

            success_fn && success_fn(data);
        }
        ,error: function(data){
            error_fn && error_fn(data);

            if(data.status >= 500){
                var msg = '服务器错误';
            }else if(data.status == 404 || data.status == 0){
                var msg = '无法访问服务器';
            }else if(data.status >= 400){
                var msg = '浏览器错误';
            }else{
                var msg = data.statusText;
            }

            var returnData = show(['网络错误', msg], [500, (data.status)], data);

            success_fn && success_fn(returnData);
        }
    });
}

//格式化显示数据（和后台的结构一样）
function show(msg, code, data){
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

function strIsJSON(str) {
    if (typeof str == 'string') {
        try {
            var obj=JSON.parse(str);
            if(typeof obj == 'object' && obj ){
                return true;
            }else{
                return false;
            }

        } catch(e) {
            //console.log('error：'+str+'!!!'+e);
            return false;
        }
    }

    return false;
}

function objIsJson(obj){
    if(typeof obj == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length){
        return true;
    }
    return false;
}