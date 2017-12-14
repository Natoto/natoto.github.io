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

<title>测试滑动效果</title>
<link rel="stylesheet" type="text/css" href="<%=ctx%>/indexwap/css/wap.css"/>
<script src="<%=ctx%>/indexwap/js/zepot.js"></script>
<script src="<%=ctx%>/indexwap/js/swipe.js"></script>
<script src="<%=ctx%>/indexwap/js/slider.js"></script>
<script src="<%=ctx%>/indexwap/js/slider_horz.js"></script>
<script src="<%=ctx%>/indexwap/js/wap.js"></script>
<script src="<%=ctx%>/indexwap/js/font-size.js"></script>
<script>
var json =eval(<%=json%>);
</script>
<script src="./js/wap.js"></script>
<script src="./js/font-size.js"></script>

</head>

<body>
	<div class="ind_box">
		<img src="<%=ctx%>/indexwap/images/logo_b.png" class="wt_img" />
		<p class="wt_t"></p>
		<p class="wt_b"></p>
		<a href="http://ios.bopaiapp.com" target="_blank" class="wt_a">进入APP查看名片</a>
		<div class="foot">
			 <div class="f_logo"></div>
			 <div class="d_table">
				 <div class="d_td">
					<p>博拍</p>
					<p>点击下载IOS版APP</p>
				 </div>
			 </div>
			 <a href="http://ios.bopaiapp.com" target="_blank" >点击下载</a>
		</div>
		
	</div>

</body>
</html>

 