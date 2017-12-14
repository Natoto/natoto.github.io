<%@page import="com.popai.webutil.test.DescJsonTest"%>
<%@page import="org.apache.commons.io.FileUtils"%>
<%@page import="com.popai.webutil.base.ClassPathUtil"%>
<%@page import="java.io.File"%>
<%@page import="java.net.URLEncoder"%>
<%@page import="com.popai.webutil.base.DesUtil"%>
<%@page import="com.alibaba.fastjson.JSONObject"%>
<%@ page language="java" contentType="text/html; charset=utf-8"  pageEncoding="utf-8"%>

<!DOCTYPE HTML>
<head>
<meta charset="utf-8">
<title>popa index</title>
</head>

<body>

<% 
String ctx = request.getContextPath();

String MAGIC_KEY =    "&4ss3fhi&w96*(";


File jsonFile1 = ClassPathUtil.getClassPackageFile(DescJsonTest.class,"/test.json");

String jsonStr = FileUtils.readFileToString(new File(jsonFile1.getAbsolutePath()),DesUtil.ENCODE);

String userJson = DesUtil.encrypt(jsonStr,MAGIC_KEY);
String sharedata = URLEncoder.encode(userJson, DesUtil.ENCODE); 


%>
<H3>请求参数json</H3>
<%=JSONObject.toJSONString(jsonStr, true) %>

<H3>加密后sharedata</H3>
<%=sharedata %>

<H3>测试地址</H3>
	<a href="http://h5.bopaiapp.com/?sharedata=<%=sharedata %>" target="_blank">线上测试(点击) </a> 
	<br><br>
	<a href="<%=ctx%>/index.jsp?sharedata=<%=sharedata%>" target="_blank">本地测试(点击) </a> 
	<br><br>
	
</body>
</html>