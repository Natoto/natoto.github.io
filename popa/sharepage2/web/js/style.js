$(function() {
	var hei = $(window).height() - 100;
	var ind_w = $(".ind_c_cen").width();
	var ind_h = $(".ind_c_cen").height();
	var bfb = ind_w / ind_h;
	if(hei < 590){
		var chei = hei * 90 / 100;
		var cwhi = chei * 65 /100;
		$(".ind_c_cen").height(chei);
		$(".ind_c_cen").css("margin-top","-" + chei/2 +"px")
		$(".ind_c_cen img.ind_f_img").css("width","60%")
		$(".ind_c_cen img.ind_f_ewm").css("width","25%")
		$(".ind_c_cen").css("margin-left",- cwhi/1.4 + "px")
		$(".con_f_img").css("margin-bottom","15px")
		$(".ind_c_cen span.mb_b").css("margin-bottom","15px")
	}
});