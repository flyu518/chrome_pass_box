var base_url = 'http://www.yii.com';
var is_chrome = true; //根据这个加载对应的js；如果是，则只操作本地数据；不是的话所有的操作都和网页版的一样直接操作

var url = {
    login : base_url +'/user/login',
    register : base_url +'/user/register',
    logout : base_url +'/user/logout',
    pass_index : base_url +'/pass/index',
    pass_add : base_url +'/pass/add',
    pass_delete : base_url +'/pass/delete',
    user_test : base_url +'/user/test',
}

$(function(){

    //初始化
    show_user_info();
    load_list();

    //加载站点列表
    function load_list(obj){
        obj = !$.isEmptyObject(obj)? obj: {};
        var p       = obj.p || 1;
        var limit   = obj.limit || 15;
        var keyword = obj.keyword || '';

        var request_data = {
            p:  p,
            limit: limit,
            keyword: keyword
        }

        var index = layer.load(1, {
            shade: [0.1,'#fff'] //0.1透明度的白色背景
        });
        $.get(url.pass_index, request_data, function(data){
            layer.close(index);
            console.log(data);

            var li = '';

            if(data.code == 200){
                $.each(data.data.list, function(){
                    li += '<li data-id="'+ $(this)[0].id +'" data-site_name="'+ $(this)[0].site_name +'"\
                         data-desc="'+ $(this)[0].desc +'" data-username="'+ $(this)[0].username +'" data-password="'+ $(this)[0].password +'"\
                          data-site_url="'+ $(this)[0].site_url +'" data-site_login_url="'+ $(this)[0].site_login_url +'">\
                        <div class="text" style="background-image: url(\''+ get_icon($(this)[0].site_url) +'\')" title="'+ $(this)[0].desc +'">'
                        + $(this)[0].site_name +
                        '</div> \
                        <div class="btn-warp">\
                            <span class="btn copy-pass" title="复制密码"></span><span class="btn delete" title="删除"></span>\
                        </div>\
                    </li>';
                })
            }else if(data.code == 300){
                li = '<li>数据为空</li>';
            }else{
                li = '<li>请求出错 - '+ (data.sub_msg) +'</li>';
            }

            $('#main .list').html(li);
        });
    }

    //显示用户信息（如果不传过来则从本地缓存取）
    function show_user_info(user_info){
        var user_info = !$.isEmptyObject(user_info)? user_info: {};
        var username, photo;

        if(!$.isEmptyObject(user_info.username)){
            username = user_info.username;
            photo = user_info.photo;

            $('.bottom .photo').css({backgroundImage: 'url('+ photo +')'});
            $('.bottom .name').html(username);
        }else{
            PassUtil.get_storage(['username', 'photo'], function(s){  //这个是异步

                username = !$.isEmptyObject(s.username)? s.username: '登录';
                photo = !$.isEmptyObject(s.photo)? s.photo: '';

                $('.bottom .photo').css({backgroundImage: 'url('+ photo +')'});
                $('.bottom .name').html(username);
            })
        }
    }

    //退出后页面信息处理
    function logout(){
        PassUtil.set_storage({
            username: '',
            photo: ''
        });

        show_user_info();
    }

    //获取指定url网站的icon图片
    function get_icon(url){
        var domain = get_domain(url);
        if($.isEmptyObject(domain)) return '';

        return 'http://statics.dnspod.cn/proxy_favicon/_/favicon?domain='+ domain;
    }

    //搜索请求
    $('.search').on('click', '.btn', function (e) {

        var keyword = $('.search .keyword').val();
        load_list({keyword: keyword});

        e.preventDefault();
        return ;
    });

    //点击用户框显示登录或退出页面
    $('.bottom .user').click(function(){
        if($('.bottom .name').html() == '登录'){
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

                $.get(url.logout, {}, function(data){
                    console.log(data);

                    if(data.code == 200){
                        layer.msg('退出成功');

                        logout();
                    }else{
                        layer.msg(data.sub_msg);
                    }

                    layer.close(index);
                    logout();
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

        $.post(url.login, request_data, function(data){
            console.log(data);

            if(data.code == 200){
                layer.msg('登录成功');

                PassUtil.set_storage({
                    username: data.data.username,
                    photo: data.data.photo
                });

                show_user_info();

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

        $.post(url.register, $(form).serialize(), function(data){
            console.log(data);

            if(data.code == 200){
                layer.msg('注册成功');

                PassUtil.set_storage({
                    username: data.data.username,
                    photo: data.data.photo
                });

                show_user_info();

                setTimeout(function(){
                    $('#login_page').hide();
                    layer.closeAll();
                }, 1000);
            }

            layer.close(index);
            layer.msg(data.sub_msg.toString());
        });
    });

    //点击站点显示添加添加站点页面
    $('#main .list').on('click', '.text', function(e){
        var id = $(this).parent().data('id') || '';
        var site_name = $(this).parent().data('site_name') || '';
        var desc = $(this).parent().data('desc') || '';
        var username = $(this).parent().data('username') || '';
        var password = $(this).parent().data('password') || '';
        var site_url = $(this).parent().data('site_url') || '';
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
                $('#add_page input[name="id"]').val(id);
                $('#add_page input[name="site_name"]').val(site_name);
                $('#add_page input[name="desc"]').val(desc);
                $('#add_page input[name="username"]').val(username);
                $('#add_page input[name="password"]').val(password);
                $('#add_page input[name="site_url"]').val(site_url);
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
        var out_input = $('<input value="'+ password +'" style="display: none;"></input>');
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

        layer.confirm('要删除吗？', {
            btn: ['删除','取消'] //按钮
        }, function(){

            var index = layer.load(1, {
                shade: [0.1,'#fff'] //0.1透明度的白色背景
            });

            $.post(url.pass_delete, {id: id}, function(data){
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

    //添加站点请求
    $('#add_page .btn').click(function () {
        var form = $(this).parents('form')[0];

        var site_name = $(form).find('input[name="site_name"]').val();
        var username = $(form).find('input[name="username"]').val();
        var password = $(form).find('input[name="password"]').val();
        var site_url = $(form).find('input[name="site_url"]').val();
        var site_login_url = $(form).find('input[name="site_login_url"]').val();

        if($.isEmptyObject(site_name) || $.isEmptyObject(username) || $.isEmptyObject(password) || $.isEmptyObject(site_url)){
            layer.msg('网站名、账户、密码、地址不能为空');
            return;
        }

        var index = layer.load(1, {
            shade: [0.1,'#fff'] //0.1透明度的白色背景
        });

        $.post(url.pass_add, $(form).serialize(), function(data){
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
                layer.msg(data.sub_msg.toString());
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
            title: false,
            shadeClose: true, //开启遮罩关闭
            content: $('#more_page'),
            end:function(){
                $('#more_page').hide();
            },
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

    //更多页面-》清空本地站点数据
    $('#more_page .clear-local').click(function (e) {
        layer.confirm('要清空吗？', {
            btn: ['清空','取消'] //按钮
        }, function(){

            PassUtil.set_storage({pass_list: []})

            layer.msg('处理成功');
            e.preventDefault();
        });
    });

    //更多页面-》清空服务器站点数据
    $('#more_page .clear-cloud').click(function (e) {
        layer.confirm('要清空吗？', {
            btn: ['清空','取消'] //按钮
        }, function(){

            var index = layer.load(1, {
                shade: [0.1,'#fff'] //0.1透明度的白色背景
            });

            $.post(url.pass_delete, {clear: 1}, function(data){
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