<%@ page language="java" contentType="text/html; charset=utf-8"  pageEncoding="utf-8"%>
<%
String ctx = request.getContextPath();
%>

<!DOCTYPE HTML>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0">
<meta name="appl""apple-mobile-web-app-status-bar-style" content="black">
<meta content="telephone=no" name="format-detection" />

<title>联系我们</title>
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
</script>
</head>

<body>
	<div class="nav">
		<div class="logo"></div>
		<nav id="">
			<ul>
				<li><a href="<%=ctx%>/index.jsp?<%=request.getQueryString()%>">首页</a></li>
				<li><a href="<%=ctx%>/wap/guanyuwomen.jsp?<%=request.getQueryString()%>">关于博拍</a></li>
				<li><a href="<%=ctx%>/wap/lianxiwomen.jsp?<%=request.getQueryString()%>">联系我们</a></li>
			</ul>
		</nav>
	</div>
	<div class="ind_box">
		<img src="<%=ctx%>/wap/images/logo_2.png" class="con_f_img" />
		<p class="con_t">联系我们</p>
		<p class="con_p">地址：广州市番禺区南村敏捷上城国际二期一座14层</p>
		<p class="con_p">公司：广州十寸甫信息技术有限公司</p>
		<p class="con_p">电话：18929929228</p>
		<p class="con_p">邮箱：zimuel@163.com</p>
		<img src="<%=ctx%>/wap/images/ewm.jpg" class="ind_f_ewm" />
		<p class="ewm_txt">扫码下载IOS版APP</p>
		<div class="ind_footer">
			bopaiapp.com 京ICP证110507号 京ICP备10064444号
		</div>
	</div>
</body>
</html>
