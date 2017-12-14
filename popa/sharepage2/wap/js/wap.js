$(function(){
	/******焦点图*********/
	var obj=$(".scroll_panel");
	obj.each(function(){
		var scontObj=$(this).find(".marCon");
		swipePro(scontObj,1,"article","section");
	});
	
	/******焦点图横向滑动*********/
	var obj1=$(".slider");
	obj1.each(function(){
		var scontObj=$(this).find(".marCon1");
		swipeFun($(this),scontObj,"ul","li");
	});
	
	var g = $("#cur_page");
	var p = null;
	var winH=parseInt($(window).height());
	$(window).resize(function(){
		var ul=obj.find("article");
		var li=obj.find("section");
		var i=Math.abs(parseInt(parseInt(ul.css("margin-top"))/winH));
		winH=parseInt($(window).height());
		li.height($(this).height());
		var len=li.length;
		var numm=Math.ceil(len/1);
		var lWid=parseInt($(this).height());
		ul.height(lWid*numm);
		ul.css({"margin-top":parseInt($(window).height())*(-i)});
		$.scrollsH=ul.css("margin-top");
		g.removeClass("ani");
		g.addClass("ani");
		p = null;
		p = setTimeout(function() {
			g.html(i + 1);
			g.removeClass("ani");
		},0);
		
	});
	$("nav").click(function(){
		var idd = $("nav").attr("id");
		if(idd == ""){
			$(this).find("ul").show();
			$("nav").attr("id","show");
		}else{
			$(this).find("ul").hide();
			$("nav").attr("id","");
		}
	})
	
	
	
	
	
	
	
	
	
	
	
	
	
	
});