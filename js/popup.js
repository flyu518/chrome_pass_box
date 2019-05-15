$(function(){
    var login_url = 'http://www.yii.com/user/login';
    var login_url = 'http://www.ua.com/test/test';

    $('.bottom .user').click(function(){
        layer.open({
            type: 1,
            skin: 'layui-layer-demo', //样式类名
            closeBtn: 0, //不显示关闭按钮
            anim: 2,
            title: false,
            shadeClose: true, //开启遮罩关闭
            content: $('#login_page'),
            end:function(){
                $('#login_page').hide();
            },
        });
    });
    
    $('#login_page .btn').click(function () {
        var form = $(this).parents('form')[0];

        var username = $(form).find('input[name="username"]').val();
        var password = $(form).find('input[name="password"]').val();

        if(username == '' || !username || password == '' || !username){
            layer.msg('账户或密码不能为空');
        }

        var request_data = {
            username: username,
            password: password
        };

        $.get(login_url, request_data, function(data){
            console.log(data);

            if(data.code == 200){
                layer.msg('登录成功');
            }else{
                layer.msg(data.msg);
            }
        });
    });
});