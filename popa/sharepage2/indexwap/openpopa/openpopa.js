var iphoneDownUrl = 'http://ios.bopaiapp.com'
//'https://itunes.apple.com/us/app/id1286343106?l=zh&ls=1&mt=8' 

//var iphoneSchema = 'POPA://';
var androidSchema = 'scheme://com.pobaiapp.popa/';
var androidDownUrl = '';

function openApp(){
    var this_  =  this;
    //微信
    if(this_.isWeixin()){
        // $(".weixin-tip").css("height",$(window).height());
        // $(".weixin-tip").show();
        // $('.weixin-tip').on('touchstart', function () {
        //     $(".weixin-tip").hide();
        // }); 
       alert('请在safri中打开！');
        // window.location = "https://bopaiapp.com/apple-app-site-association";
    }else{//非微信浏览器
        if (navigator.userAgent.match(/(iPhone|iPod|iPad);?/i)) {
            var loadDateTime = new Date();
            window.setTimeout(function() {
                var timeOutDateTime = new Date();
                if (timeOutDateTime - loadDateTime < 5000) {
                    window.location = this_.iphoneDownUrl;//ios下载地址
                } else {
                    window.close();
                }
            },25);
            window.location = this.iphoneSchema;
        }else if (navigator.userAgent.match(/android/i)) {
            try {
                window.location = this_.androidSchema;
                setTimeout(function(){
                    window.location=this_.androidDownUrl; //android下载地址

                },500);
            } catch(e) {}
        }
    }
}
function isWeixin(){ //判断是否是微信
    var ua = navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == "micromessenger") {
        return true;
    } else {
        return false;
    }
} 

function ispcbrowserRedirect() {
            var sUserAgent = navigator.userAgent.toLowerCase();
            var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
            var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
            var bIsMidp = sUserAgent.match(/midp/i) == "midp";
            var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
            var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
            var bIsAndroid = sUserAgent.match(/android/i) == "android";
            var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
            var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
             
            if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
               return false;
            } else {
                return true;
            }
}
 
 
 //DES 解密 加密
function encryptByDES(message, key) {
        var keyHex = CryptoJS.enc.Utf8.parse(key);
        var encrypted = CryptoJS.DES.encrypt(message, keyHex, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
    }
    //DES 解密

function decryptByDES(ciphertext, key) {
    var keyHex = CryptoJS.enc.Utf8.parse(key);
    // direct decrypt ciphertext
    var decrypted = CryptoJS.DES.decrypt({
        ciphertext: CryptoJS.enc.Base64.parse(ciphertext)
    }, keyHex, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
} 
 
