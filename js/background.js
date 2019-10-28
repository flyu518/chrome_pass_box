/**
 * 这个是扩展用的，为了兼容浏览器环境，不要再 popup.js 中直接调用，可以在扩展环境的 chrome_js.js 中调用
 */

var user_info       = {};  //先声明，在下面获取后填充上，要不然每次获取都是异步的，很恶心

var pass_box_version= 0;  //服务器版本，开定时器获取
var local_pass_box_version = -1; //默认一个本地版本，如果和线上的不一样并且允许自动同步就去同步，popup改变了会通知这边的

var popup = _popup();   //每次用，重新获取一下，这里是声明一下

var sync_method = 1; //同步方式，默认1手动，2自动，可以改成自动的
var is_syncing = false; //是否正在同步，如果true，则本次不执行
var auto_sync_fail_count = 3; //自动同步失败多少次就不执行同步了
var auto_sync_fail_count_current = 0;   //当前出错了多少次，同步成功之后恢复0
var auto_sync_fail_response = {};   //执行失败的返回对象，成功之后清空

var interval;   //定时器的一个变量
var _num = 0;   //计时的一个数

//所有的站点列表，用于谷歌扩展，类似于本地数据库，每次操作都用这个，直接获取本地的会很恶心，
// 结构：[{id: 1, ……, _index: 0}] 一定注意这个 _index,每次操作后（增、删）都要把站点自身位置更新一下，本地删除、更新等操作要用到
var pass_all = [];

//已删除的线上的站点的id数组，每次同步的时候带上，在服务器端删除对应的
var pass_delete_list = [];

//扩展独有，站点数据结构，和后台的一样，这里算是设置默认值了，可以调用 common.js -> json_replace(_pass_scheme, newData)，进行替换
var pass_scheme = {
    id          : null, //存在本地时候可以为空，上传的上时候会自动生成
        user_id     : null, //存在本地的时候可以为空，但是上传的时候会自动补上
        site_name   : '',
        site_url    : '',
        site_login_url: '',
        desc        : '',
        username    : '',
        password    : '',
        sort_num    : 100,  //默认100，从小到大排序
        status      : 0,    //0正常，1删除
        tag         : '',   //标签
        createdTime : get_timestamp(),  //这个最好传过来，如果打开页面添加几个，时间是不会变得
        updatedTime : get_timestamp(),
        _index      : '',  //这个后台没有，前台使用的一个索引，每次操作后（增、删）都要把站点自身位置更新一下，本地删除、更新等操作要用到
        _is_changed : true, //后台没有，前台用来标记该数据是否在本地新增或修改过，每次同步只上传为 true 的
};

/**
 * 如果 user_info 不为空，后台会定时自动请求，查看是否在线；因为扩展的原因，如果未登录不会清空 user_info
 * 这个 popup 页面如果在扩展里面生存时间很短，不适合做定时任务，要放在 background.js 里面
 * background 的浏览器打开的时候进行初始化，如果本地储存有 user_info 就定时请求查看是否登录，如果之前没登录，
 * 登录之后需要主动调用，然后才会执行定时任务
 */
var is_server_login = false;    //服务器端是否登录，如果false，就提示登录

var is_server_online = false;   //服务器是否可用，如果false，就不请求网络

init();

//初始化，这是异步的
function init(){
console.log('init');
    get_storage(['user_info', 'sync_method', 'is_server_login', 'local_pass_box_version', 'pass_all', 'pass_delete_list'], function(s){
        user_info           = s.user_info || {};
        is_server_login     = s.is_server_login && s.user_info? true: false;
        sync_method         = s.sync_method == 2? 2: 1;
        local_pass_box_version = s.local_pass_box_version || -1;
        auto_sync_fail_count_current = 0;   //初始化0

        pass_all  = s.pass_all || []; //这个是谷歌 chrome_js.js 扩展独有的，web_js.js 没有也不会报错
        pass_delete_list  = s.pass_delete_list || [];  //同上

        //第一次请求一次状态，如果符合条件就在里面开启定时器，如果不行就在里面关闭定时器
        get_status();
    });
}

//启动定时器（在线才启动）
function start_interval(){
console.log('start_int');
    clearInterval(interval);
    interval = setInterval(function(){

        _num%5 == 0 && get_status();   //5s一次算了，太快了感觉不好

        if(auto_sync_fail_count_current >= 3 && _num % (60 * 10) == 0) auto_sync_fail_count_current = 0; //10分钟清空1次，要不然只要不出发 init 就不会尝试了

        //_num%5 == 0 && auto_sync_fail_count_current < auto_sync_fail_count && pass_sync();// 这个不自动执行了，当改变的时候通过 get_status() 调用
        //_num % 5 == 0 &&  get_popup_attr();  //不执行了，不算多而且关闭就获取不了了，当popup更改之后会通知


        _num ++;
        if(_num > 19930518) _num = 0;
    }, 1000);
}

//popup 登录之后调用，（用这个是觉得定期请求太费资源了）
function bg_login(){
console.log('bg_login->init');
    init();
}

function update_version(version){
console.log('update_version');

    local_pass_box_version = version;
    this.set_storage({local_pass_box_version: version});

console.log('sync_method:'+ sync_method +';local_v:'+local_pass_box_version+';cloud_v:'+ pass_box_version);
}

function update_sync_method(new_method){
console.log('update_sync_method');

    sync_method = new_method;
    set_storage({sync_method: new_method});

console.log('sync_method:'+ sync_method +';local_v:'+local_pass_box_version+';cloud_v:'+ pass_box_version);
}

//这个现在不用了，数据太少，如果改了之后前端通知
function get_popup_attr(){
    popup = _popup();
    if(popup){
        //需要的一些字段
        sync_method = popup.sync_method;
    }
}

//获取服务器状态、站点状态、登录状态、服务器站点版本号
function get_status(){

console.log('get_status');

    _get(url.get_status, '', function(response){

//console.log(response);
        is_server_online = response.code == 500? false: true; //ajax如果请求失败会模拟返回500，详细的在sub_code

        if(response.code == 200){
            if(response.data.user_id){
                if(pass_box_version != response.data.pass_box_version){
                    pass_box_version = response.data.pass_box_version;
                }

                //第一次是false，以后就可以不管了
                if(!is_server_login){
                    console.log('!is_server_login');
                    is_server_login = true;
                    set_storage({is_server_login: true})
                }

console.log('sync_method:'+ sync_method +';local_v:'+local_pass_box_version+';cloud_v:'+ pass_box_version+';sync_fail_count_current:'+auto_sync_fail_count_current);

                //如果不一样就同步
                if( is_online() && sync_method == 2 &&
                    auto_sync_fail_count_current < auto_sync_fail_count &&
                    pass_box_version != local_pass_box_version){
                    console.log('!sync');
                    pass_sync();
                }

                //如果定时器没开启就打开，开启就别打开了，要不然就死循环了（以后如果有什么消息可以通知可以放在下面）
                if(!interval){
                    console.log('!interval');
                    start_interval();
                }
            }else{
console.log('未登录');
console.log('未登录->is_server_login=false');
                is_server_login = false;
                set_storage({is_server_login: false})

console.log('未登录->clearInterval');
                //关闭定时器
                clearInterval(interval);
                interval = null;    //一定要写一下，要不就上面的断掉了
            }
        }else{
console.log(response);
console.log('!=200->is_server_login=false');
            is_server_login = false;
            set_storage({is_server_login: false})

console.log('!=200->clearInterval');
            //关闭定时器
            clearInterval(interval);
            interval = null;    //一定要写一下，要不就上面的断掉了
        }
    })
}

/**
 * 站点数据同步
 *
 * @param function  success         回调函数
 */
function pass_sync(success){
    if(!is_online()) return success && success(show('离线状态，无法同步'));
    if(is_syncing) return success && success(show('正在同步，请稍后再试'));
    is_syncing = true;

console.log('同步开始……');

    var changed_list = [];  //查找本地创建、修改过的，没变过的不上传了，浪费资源
    pass_all.forEach(function(item, index){
        if(item._is_changed){
            changed_list.push(item);
        }
    });

    var local_pass_data = {
        'local_delete_list': JSON.stringify(pass_delete_list),
        'local_list': JSON.stringify(changed_list)
    };
console.log('数据整理成功，开始上传……');

    _post(url.pass_sync, local_pass_data, function(response){
console.log(response);
        if(response.code != 200){
console.log('同步失败 - '+ response.sub_msg);

            //更改状态
            update_auto_sync_fail_status(response);

            return success && success(response);
        }

console.log('上传处理成功，正在执行本地数据替换，请稍等……');

        //先清空删除列表
        update_pass_delete_storage(null);

        //更新储存的
        update_pass_storage(response.data.list, response.data.version);

        //更改状态
        update_auto_sync_fail_status();

console.log('同步完成');

        //尝试更新 popup 中的列表（只有打开的时候才能通知到）
        popup = _popup();
        if(popup){
console.log('重新加载列表');
            popup.load_list();
        }

        return success && success(show('处理成功', 200));
    });
}

/**
 * 更新自动同步状态（步骤太多，在这合并一下）
 *
 * 如果 response 不传，说明是成功，如果穿了说明失败，其他的三个字段自动改变
 *
 * @param response 后台返回的原数据，json 格式的 {code: 200, msg:……}
 */
function update_auto_sync_fail_status(response){
    if(response){
        is_syncing = false;
        auto_sync_fail_count_current ++;
        auto_sync_fail_response = response;
    }else{
        is_syncing = false;
        auto_sync_fail_count_current = 0;
        auto_sync_fail_response = {};
    }
}

//是否在线，有本地储存，不能只根据user_id
function is_online(){
    return user_info.user_id && is_server_login;
}

/**
 * 更新本地站点储存 + 更新索引 + 更新本地版本
 *
 * @param new_pass_all
 * @param version       如果是本地增、改、删之后调用，可以不传，为空的话就会和线上不同；如果是同步之后调用就要把线上的版本号传过来
 * @returns {boolean}
 */
function update_pass_storage(new_pass_all, version) {
    var tmp = [];

    //重建索引（中间有删除的可能）
    var i = 0;
    new_pass_all.forEach(function(item, key){
        item._index = i;
        item._is_changed = item._is_changed == undefined? false: item._is_changed;  //重建的时候不要忘了这个
        tmp.push(item);
        i++;
    })

    //更新储存的
    pass_all = tmp;
    set_storage({pass_all: pass_all});

    //更新本地版本（不传参数，就不会和服务器相同）
    update_version(version);

    return true;
}

/**
 * 更新本地站点删除列表
 *
 * 这里面没有添加更新索引什么的，如果需要单独调用
 * 自动过滤没有id的数据，所以清空本地站点列表可以把整个列表传过来
 *
 * @param array|json arr 如果要删除则传过来对应的json：{id:……}或数组[{id:……}]，不删除只清空删除列表 pass_delete_list 的话，不传
 */
function update_pass_delete_storage(arr){
    if(arr){
        arr = Array.isArray(arr)? arr: [arr];
        var tmp = [];
        arr.forEach(function(item){
            if(item.id){

                //现在后台只需要 user_id、id、updatedTime，其他的不要了浪费资源
                tmp = {
                    id: item.id,
                    user_id: item.user_id,
                    updatedTime: get_timestamp(),  //添加删除时间，后台要根据这个时间判断是否删除
                }

                pass_delete_list.push(tmp);
            }
        })
    }else{
        pass_delete_list = [];
    }

    set_storage({pass_delete_list: pass_delete_list});
}

function set_storage(obj) {
    chrome.storage.local.set(obj);
}
function get_storage(arr, callback){
    chrome.storage.local.get(arr, function(sl){
        //console.log(sl);
        callback && callback(sl);
    });
}

//获取 popup 页面对象
function _popup(){
    var views = chrome.extension.getViews({type:'popup'});
    if(views.length > 0) {
        //console.log(views[0].location.href);
        return views[0];
    }
    return null;
}