<%@page import="java.util.Arrays"%>
<%@page import="com.alibaba.fastjson.JSONObject"%>
<%@page import="com.popai.webutil.base.DesUtil"%>
<%@page import="java.net.URLDecoder"%>
<%@ page language="java" contentType="text/html; charset=utf-8"  pageEncoding="utf-8"%>
<%
String ctx = request.getContextPath();
	String MAGIC_KEY = "&4ss3fhi&w96*(";
	String sharedata = "" ;
	String queryString = request.getQueryString() ;
	String json = "{}";
	if(queryString!=null){
		String[] datas = queryString.split("=");
		sharedata = datas[1];
		//转码
		String decode =  URLDecoder.decode(sharedata, DesUtil.ENCODE);
		//解密
        String  rsJson = DesUtil.decrypt(decode,MAGIC_KEY);
        try {
			JSONObject js = JSONObject.parseObject(rsJson);
			json = JSONObject.toJSONString(js, true);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
%>
<!DOCTYPE HTML>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0">
<meta name="appl""apple-mobile-web-app-status-bar-style" content="black">
<meta content="telephone=no" name="format-detection" />

<title>博拍首页</title>
<link rel="stylesheet" type="text/css" href="<%=ctx%>/wap/css/wap.css"/>
<script src="<%=ctx%>/wap/js/zepot.js"></script>
<script src="<%=ctx%>/wap/js/swipe.js"></script>
<script src="<%=ctx%>/wap/js/slider.js"></script>
<script src="<%=ctx%>/wap/js/slider_horz.js"></script>
<script src="<%=ctx%>/wap/js/wap.js"></script>
<script src="<%=ctx%>/wap/js/font-size.js"></script>
<script>
	var glb={
		isMove:true
	}
	var json = <%=json%>;
 
	
	var iphoneDownUrl = 'https://itunes.apple.com/us/app/id1204142447?l=zh&ls=1&mt=8';
</script>
</head>

<body>
	<div class="nav">
		<div class="logo"></div>
		<nav id="">
			<ul>
				<li><a href="<%=ctx%>/index.jsp">首页</a></li>
				<li><a href="<%=ctx%>/wap/guanyuwomen.html">关于博拍</a></li>
				<li><a href="<%=ctx%>/wap/lianxiwomen.html">联系我们</a></li>
			</ul>
		</nav>
	</div>
	<div class="ind_box">
		<img src="<%=ctx%>/wap/images/ind_bg.png" class="ind_f_img" />
		<p class="cen_txt">博拍-创建你的影像日志</p>
		<p class="wt_t">111111111111</p>
		<p class="wt_b">1111111111</p>
		<img src="<%=ctx%>/wap/images/ewm.jpg" class="ind_f_ewm" />
		<p class="ewm_txt">
		<a href="http://ios.bopaiapp.com" target="_blank" class="btn-download"
                       >
                        <i class="fa fa-apple"></i><span>iPhone 版下载</span>
                    </a>
                    
          </p>
		
		
		<div class="ind_footer">
			bopaiapp.com 京ICP证110507号 京ICP备10064444号
		</div>
	</div>
</body>
</html>