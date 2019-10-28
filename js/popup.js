try{
    var is_chrome = chrome.extension? true: false; //根据这个加载对应的js【谷歌扩展专用的chrome_js.js|普通web用的web_js.js，两个提供的接口一样】；
}catch (e) {
    var is_chrome = false;
}

init_page();
$(window).resize(function(){
    init_page();
});

var user_info       = {};  //先声明，在下面获取后填充上，要不然每次获取都是异步的，很恶心
var listIsGroup     = true; //列表是否安装26个字母分组显示
var sync_method     = is_chrome? 1: 2; //同步方式，如果是扩展的默认手动，可以改成自动的（浏览器这个参数没用）

$(function(){

//加载对应环境的工具脚本，有点特殊的地方：扩展可以使用普通浏览器下的，但是反过来不行
loadScript("js/"+ (is_chrome? 'chrome': 'web') +"_js.js", function(){
        console.log(PassUtil.type);

        //初始化，这是异步的
        PassUtil.get_session_storage(['user_info', 'sync_method'], function(s){
            user_info           = s.user_info || {};
            sync_method         = s.sync_method == 2? 2: 1;

            show_user_info(user_info);
            load_list();
        });

        //显示用户信息（如果不传过来则从本地缓存取）
        function show_user_info(data){
            var _user_info = !$.isEmptyObject(data)? data: user_info;

            $('.bottom .photo').css({backgroundImage: 'url('+ (_user_info.photo? _user_info.photo: 'img/user.png') +')'});
            $('.bottom .name').html(_user_info.username || '登录');
        }

        //搜索请求
        $('.search').on('click', '.btn', function (e) {
            var keyword = $('.search .keyword').val();
            load_list({keyword: keyword});

            e.preventDefault();
        });
        $(".search input").keydown(function(event){
            if(event.keyCode ==13){
                var keyword = $('.search .keyword').val();
                load_list({keyword: keyword});
            }
        })

        //选择标签
        $('.tags').on('click', 'span', function(){
            $(this).addClass('select').siblings().removeClass('select');
            var tag = $(this).html();

            if(tag == PassUtil.get_search_tag()){
                return;
            }

            //储存
            PassUtil.update_search_tag(tag);

            //加载列表
            load_list();
        });

        //点击用户框显示登录或退出页面
        $('.bottom .user').click(function(){
            if(!PassUtil.is_server_online()){
                return layer.msg('服务器不能访问');
            }
            if(!PassUtil.is_online()){
                layer.open({
                    type: 1,
                    skin: 'layui-layer-demo', //样式类名
                    closeBtn: 0, //不显示关闭按钮
                    anim: 2,
                    title: '登录/注册',
                    shadeClose: true, //开启遮罩关闭
                    content: $('#login_page'),
                    end:function(){
                        $('#login_page').hide();
                    },
                });
            }else{
                layer.confirm('要退出吗？', {
                    btn: ['退出','取消'] //按钮
                }, function(){

                    var index = layer.load(1, {
                        shade: [0.1,'#fff'] //0.1透明度的白色背景
                    });

                    _get(url.logout, {}, function(data){
                        console.log(data);
                        layer.close(index);

                        if(data.code == 200 || data.sub_code == 404 || data.code == 100){
                            layer.msg('退出成功');
                        }else{
                            layer.msg(data.sub_msg);
                        }

                        //不管结果了，直接退出，要不然服务器端不在线退出失败
                        PassUtil.logout();
                        show_user_info();
                        load_list();
                    });
                });
            }
        });

        //登录请求
        $('#login_page .login').click(function () {
            var form = $(this).parents('form')[0];

            var username = $(form).find('input[name="username"]').val();
            var password = $(form).find('input[name="password"]').val();

            if($.isEmptyObject(username) || $.isEmptyObject(password)){
                layer.msg('账户或密码不能为空');
                return;
            }

            var request_data = {
                username: username,
                password: password
            };

            var index = layer.load(1, {
                shade: [0.1,'#fff'] //0.1透明度的白色背景
            });

            _post(url.login, request_data, function(data){

                if(data.code == 200){
                    layer.msg('登录成功');

                    PassUtil.update_local_user_info(data.data);

                    show_user_info();
                    load_list();

                    setTimeout(function(){
                        $('#login_page').hide();
                        layer.closeAll();
                    }, 1000);
                }else{
                    layer.close(index);
                    layer.msg(data.sub_msg.toString());
                }
            });
        });

        //注册请求
        $('#login_page .register').click(function () {

            if($('#login_page .password_repeat_div').hasClass('hide')){
                $('#login_page .password_repeat_div').removeClass('hide');
                $('#login_page .email_div').removeClass('hide');
                layer.msg('请填写确认密码');
                return;
            }

            var form = $(this).parents('form')[0];

            var username = $(form).find('input[name="username"]').val();
            var password = $(form).find('input[name="password"]').val();
            var password_repeat = $(form).find('input[name="password_repeat"]').val();
            var email = $(form).find('input[name="email"]').val();

            if($.isEmptyObject(username) || $.isEmptyObject(password) || $.isEmptyObject(password_repeat) || $.isEmptyObject(email)){
                layer.msg('账户或密码不能为空');
                return;
            }
            if(password !== password_repeat){
                layer.msg('确认密码和密码不相同');
                return;
            }

            var index = layer.load(1, {
                shade: [0.1,'#fff'] //0.1透明度的白色背景
            });

            _post(url.register, $(form).serialize(), function(data){
                console.log(data);

                if(data.code == 200){
                    layer.msg('注册成功');

                    PassUtil.update_local_user_info(data.data);

                    show_user_info();

                    load_list();

                    setTimeout(function(){
                        $('#login_page').hide();
                        layer.closeAll();
                    }, 1000);
                }

                layer.close(index);
                layer.msg(data.sub_msg.toString());
            });
        });

        //找回密码（根据邮箱）
        //TODO::    2019/10/28 15:04

        //设置头像
        //TODO::    2019/10/28 15:04

        //设置用户信息
        //TODO::    2019/10/28 15:04

        //点击站点显示添加、编辑站点页面
        $('#main .list').on('click', '.text', function(e){
            var id          = $(this).parent().data('id') || '';
            var _index      = $(this).parent().data('_index'); //这个有可能是0
            var site_name   = $(this).parent().data('site_name') || '';
            var desc        = $(this).parent().data('desc') || '';
            var username    = $(this).parent().data('username') || '';
            var password    = $(this).parent().data('password') || '';
            var tag         = $(this).parent().data('tag') || '';
            var site_url    = $(this).parent().data('site_url') || '';
            var site_login_url = $(this).parent().data('site_login_url') || '';

            var index = layer.open({
                type: 1,
                skin: 'layui-layer-demo', //样式类名
                closeBtn: 1, //不显示关闭按钮
                anim: 2,
                title: id == ''? '添加': '编辑',
                shadeClose: true, //开启遮罩关闭
                content: $('#add_page'),
                success: function(layero, index){
                    $('#add_page form')[0].reset(); //先重置
                    $('#add_page input[name="id"]').val(id);
                    $('#add_page input[name="_index"]').val(_index);
                    $('#add_page input[name="site_name"]').val(site_name);
                    $('#add_page input[name="desc"]').val(desc);
                    $('#add_page input[name="username"]').val(username);
                    $('#add_page input[name="password"]').val(password);
                    $('#add_page input[name="site_url"]').val(site_url);
                    $('#add_page input[name="tag"]').val(tag);
                    $('#add_page input[name="site_login_url"]').val(site_login_url);
                },
                end:function(){
                    $('#add_page').hide();
                },
            });

            e.preventDefault()
        });

        //复制密码
        $('#main .list').on('click', '.copy-pass', function (e) {
            var password = $(this).parent().parent().data('password');
            var out_input = $('<input value="'+ password +'" style="position: absolute; left: -10000px; top: -1000000px;"></input>');
            $('html').append(out_input);
            out_input.select();
            document.execCommand("Copy");
            //out_input.css({display: 'none'})
            out_input.remove();
            layer.msg('已复制');

            e.preventDefault();
            return ;
        });

        //删除站点
        $('#main .list').on('click', '.delete', function (e) {

            var id = $(this).parent().parent().data('id');
            var _index = $(this).parent().parent().data('_index');  //本地操作的用到

            layer.confirm('要删除吗？', {
                btn: ['删除','取消'] //按钮
            }, function(){

                var index = layer.load(1, {
                    shade: [0.1,'#fff'] //0.1透明度的白色背景
                });

                PassUtil.pass_delete(url.pass_delete, {id: id, _index: _index}, function(data){
                    console.log(data);

                    if(data.code == 200){
                        layer.msg('处理成功');

                        load_list();
                    }else{
                        layer.msg(data.sub_msg);
                    }

                    layer.close(index);
                });
            });

            e.preventDefault();
        });

        //添加、编辑站点请求
        $('#add_page .btn').click(function () {
            var form = $(this).parents('form')[0];

            var id          = $(form).find('input[name="id"]').val();
            var site_name   = $(form).find('input[name="site_name"]').val();
            var username    = $(form).find('input[name="username"]').val();
            var password    = $(form).find('input[name="password"]').val();
            var site_url    = $(form).find('input[name="site_url"]').val();
            var site_login_url = $(form).find('input[name="site_login_url"]').val();

            if($.isEmptyObject(site_name) || $.isEmptyObject(username) || $.isEmptyObject(password)){
                layer.msg('网站名、账户、密码不能为空');
                return;
            }

            var index = layer.load(1, {shade: [0.1,'#fff']});

            PassUtil.pass_add(url.pass_add, $(form).serializeArray(), function(data){
                console.log(data);

                if(data.code == 200){
                    layer.msg('处理成功');
                    load_list();

                    setTimeout(function(){
                        $('#add_page').hide();
                        layer.closeAll();
                    }, 1000);
                }else{
                    layer.close(index);
                    layer.msg(data.sub_msg && data.sub_msg.toString());
                }
            });
        });

        //添加、编辑站点生成随机密码
        $('#add_page .create-random').click(function (e) {
            var form = $(this).parents('form')[0];
            var password = get_random();

            $(form).find('input[name="password"]').val(password);

            e.preventDefault();
        });

        //更多页面
        $('.bottom .more').click(function(){
            layer.open({
                type: 1,
                skin: 'layui-layer-demo', //样式类名
                closeBtn: 0, //不显示关闭按钮
                anim: 2,
                title: '更多功能',
                shadeClose: true, //开启遮罩关闭
                content: $('#more_page'),
                success: function(){
                    if(!is_chrome){
                        $('#more_page .sync-method').parent().css({display: 'none'});
                        $('#more_page .up-cloud').parent().css({display: 'none'});
                        $('#more_page .down-cloud').parent().css({display: 'none'});
                        $('#more_page .up-down-cloud').parent().css({display: 'none'});
                        $('#more_page .clear-local').parent().css({display: 'none'});
                        $('#more_page .web').parent().css({display: 'none'});
                    }else{
                        $('#more_page .sync-method i').html(sync_method == 2? '自动': '手动');
                    }
                },
                end:function(){
                    $('#more_page').hide();
                },
            });
        });

        //更多页面-》同步方式页面
        $('#more_page .sync-method').click(function(e){
            var index = layer.open({
                type: 1,
                skin: 'layui-layer-demo', //样式类名
                closeBtn: 1, //不显示关闭按钮
                anim: 2,
                title: '更改同步方式',
                shadeClose: true, //开启遮罩关闭
                content: $('#sync_method'),
                success: function(){
                    $('#sync_method input[name="sync_method"][value="'+ sync_method +'"]').attr("checked", true);
                    layui.use('form', function(){
                        layui.form.render('radio');
                    });
                },
                end:function(){
                    $('#sync_method').hide();
                },
            });

            e.preventDefault()
        });

        //更多页面-》同步方式更改请求
        $('#sync_method .submit').click(function (e) {
            if(!user_info.user_id){
                return layer.msg('还未登录');
            }
            if(!is_chrome){
                return layer.msg('只有在扩展环境下才可以设置');
            }

            var form = $(this).parents('form')[0];
            var sync_method_tmp = $(form).find('input[name="sync_method"]:checked').val();

            if(sync_method_tmp == sync_method){
                return layer.msg('选择相同未做更改');
            }

            layer.confirm('想清楚了吗，要更改吗？', {
                btn: ['确定','取消'] //按钮
            }, function(){
                var index = layer.load(1, {shade: [0.1,'#fff']});

                PassUtil.update_sync_method(sync_method_tmp);
                layer.close(index);
                layer.msg('处理成功');

                e.preventDefault();
            });
        });

        //更多页面-》添加站点页面
        $('#more_page .add-pass').click(function(e){

            var index = layer.open({
                type: 1,
                skin: 'layui-layer-demo', //样式类名
                closeBtn: 1, //不显示关闭按钮
                anim: 2,
                title: '添加',
                shadeClose: true, //开启遮罩关闭
                content: $('#add_page'),
                success: function(){
                    $('#add_page form')[0].reset(); //先重置
                },
                end:function(){
                    $('#add_page').hide();
                },
            });

            e.preventDefault()
        });

        //更多页面-》生成随机密码页面
        $('#more_page .create-random').click(function(e){

            var index = layer.open({
                type: 1,
                skin: 'layui-layer-demo', //样式类名
                closeBtn: 0, //不显示关闭按钮
                anim: 2,
                title: false,
                shadeClose: true, //开启遮罩关闭
                content: $('#create_random'),
                end:function(){
                    $('#create_random').hide();
                },
            });

            e.preventDefault()
        });

        //更多页面-》生成随机密码
        $('#create_random .btn').click(function (e) {
            var form = $(this).parents('form')[0];

            var num = $(form).find('input[name="num"]').val();
            var type = $(form).find('input[name="type"]:checked').val();

            var password = get_random(num, type);

            $(form).find('input[name="password"]').val(password).select();

            document.execCommand("Copy");
            layer.msg('生成的密码已复制');

            e.preventDefault();
        });

        //更多页面-》同步本地和服务器数据（上传和下载的操作合并）
        $('#more_page .up-down-cloud').click(function (e) {
            if(!PassUtil.is_online()){
                layer.msg('离线状态，请登录');
                return;
            }
            layer.confirm('同步之后本地数据会和服务器数据合并，要同步吗？', {
                btn: ['确定','取消'] //按钮
            }, function(){
                var index = layer.load(1, {shade: [0.1,'#fff']});

                layer.msg('正在上传，请稍等……');
                console.log('正在上传，请稍等……');

                PassUtil.pass_sync_c(function(response){
                    layer.close(index);

                    console.log(response);
                    if(response.code != 200){
                        console.log('上传失败');
                        return layer.msg(response.sub_msg && response.sub_msg.toString());
                    }

                    layer.msg('同步成功');
                    console.log('同步成功');

                    //load_list();
                });
                e.preventDefault();
            });
        });


        //更多页面-》清空本地站点数据
        $('#more_page .clear-local').click(function (e) {
            layer.confirm('要清空吗？', {
                btn: ['清空','取消'] //按钮
            }, function(){
                PassUtil.pass_clear();

                layer.msg('处理成功');

                load_list();
                e.preventDefault();
            });
        });

        //更多页面-》清空服务器站点数据
        $('#more_page .clear-cloud').click(function (e) {
            if(!user_info.user_id){
                layer.msg('还未登录');
                return;
            }

            layer.confirm('要清空吗？', {
                btn: ['清空','取消'] //按钮
            }, function(){

                var index = layer.load(1, {
                    shade: [0.1,'#fff'] //0.1透明度的白色背景
                });

                //这个就不调用删除方法了，如果在谷歌扩展环境的话有点麻烦
                _post(url.pass_delete, {clear: 1}, function(data){
                    console.log(data);

                    if(data.code == 200){
                        layer.msg('处理成功');

                        load_list();
                    }else{
                        layer.msg(data.sub_msg);
                    }

                    layer.close(index);
                });
            });
        });
    });
});

function init_page() {

    var body_el            = document.body
    var screen_width       = window.screen.width
    var is_use_scrollbar   = false;

    //不设置，扩展里面撑不起来
    body_el.style.width    = screen_width/4+"px"
    body_el.style.height   = parseInt(screen_width/4*1.6)+"px"
    body_el.style.setProperty("--scrollbar_width", is_use_scrollbar?'8px':'0px')

    var main_height = $('#main').outerHeight(true);
    var search_height = $('#main .search').outerHeight(true);
    var tags_height = $('#main .tags').outerHeight(true);
    var bottom_height = $('#main .bottom').outerHeight(true);
    $('body').css({height: main_height, width: $('#main').outerWidth(true)});
    $('#main .list').css({height: main_height - search_height - tags_height - bottom_height});
}

//加载站点列表（放在外面是为了让 background.js 同步完成之后调用）
function load_list(obj){
    obj = !$.isEmptyObject(obj)? obj: {};
    var p       = obj.p || 1;
    var limit   = obj.limit || 15;
    var keyword = obj.keyword || '';
    var tag     = PassUtil.get_search_tag();

    var request_data = {
        p:  p,
        limit: limit,
        keyword: $.trim(keyword),
        tag: tag
    }

    var index = layer.load(1, {
        shade: [0.1,'#fff'] //0.1透明度的白色背景
    });

    PassUtil.pass_list(url.pass_index, request_data, function(data){
        layer.close(index);
        console.log(data);

        //先加载标签
        data.data && load_tags(data.data.tags);

        var li = '';

        if(data.code == 200){

            var item;
            var list = data.data.list;

            if(!listIsGroup){   //以前的直接显示方式
                $.each(list, function(){
                    item = $(this)[0];

                    li += '<li data-id="'+ item.id +'" data-_index="'+ item._index +'" data-site_name="'+ item.site_name +'"\
                         data-desc="'+ item.desc +'" data-username="'+ item.username +'" data-password="'+ item.password +'"\
                          data-tag="'+ item.tag +'"\
                          data-site_url="'+ item.site_url +'" data-site_login_url="'+ item.site_login_url +'">\
                        <div class="text" style="background-image: url(\''+ get_icon(item.site_url) +'\')" title="'+ item.desc +'">'
                        + item.site_name +
                        '</div> \
                        <div class="btn-warp">\
                            <span class="btn copy-pass" title="复制密码"></span><span class="btn delete" title="删除"></span>\
                        </div>\
                    </li>';
                })
            }else{  //以字母分组显示，分组依据 网站名：site_name
                list = array_group_by_letter(list, 'site_name');
                //console.log(list);
                $.each(list, function(){
                    li += '<div class="letter"><span>'+ $(this)[0]['letter'] +'</span></div>';
                    $.each($(this)[0]['data'], function(){
                        item = $(this)[0];

                        li += '<li data-letter="'+ item +'" data-id="'+ item.id +'" data-_index="'+ item._index +'" data-site_name="'+ item.site_name +'"\
                                    data-desc="'+ item.desc +'" data-username="'+ item.username +'" data-password="'+ item.password +'"\
                                    data-tag="'+ item.tag +'"\
                                    data-site_url="'+ item.site_url +'" data-site_login_url="'+ item.site_login_url +'">\
                                    <div class="text" style="background-image: url(\''+ get_icon(item.site_url) +'\')" title="'+ item.desc +'">'
                            + item.site_name +
                            '</div> \
                            <div class="btn-warp">\
                                <span class="btn copy-pass" title="复制密码"></span><span class="btn delete" title="删除"></span>\
                            </div>\
                        </li>';
                    })


                });
            }
        }else if(data.code == 300){
            li = '<li>数据为空</li>';
        }else{
            li = '<li>出错 - '+ (data.sub_msg) +'</li>';
        }

        $('#main .list').html(li);
    });
}

/**
 * 加载用户标签
 *
 * 注意：自动生成的有：全部、未设置；全部的时候不加条件，未设置的时候搜索为''的
 */
function load_tags(tags){
    if(!Array.isArray(tags) || !tags.length){
        return $('.tags').addClass('hide');
    }

    var select_tag = PassUtil.get_search_tag();
    var is_selected = false;    //是否有已选择的，没有的话，加到全部上
    var span = '';
    var no_tag_span = '';   //标签未设置的span，如果有放到最后

    //先排序
    tags = array_sort(tags);

    tags.forEach(function(item){
        if(!item){  //未设置的
            if(select_tag == '未设置'){
                is_selected = true;
                no_tag_span = '<span class="select">未设置</span>';
            }else{
                no_tag_span = '<span>未设置</span>';
            }
        }else{
            if(select_tag == item){
                is_selected = true;
                span += '<span class="select">'+ item +'</span>';
            }else{
                span += '<span>'+ item +'</span>';
            }
        }
    })

    span = (!is_selected && (select_tag == '全部' || select_tag == '')? '<span class="select">全部</span>': '<span>全部</span>') + span + no_tag_span;

    $('.tags').html(span);

    //重新计算 .list 的长度（如果标签太多可能 .list 遮盖）
    init_page();
}