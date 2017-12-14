$(function() {
	var cbh = $(window).height();
	var cbw = $(window).width();
	$("b_body").height(cbh);
	$(".c_b").height(cbh - 50);
	$(".c_b").width(cbw);
	var sll = $(".c_con .c_b").length;
	$(".c_con").width(sll * cbw);
	//滑动时屏幕滚动
	var loghandle = function(event, delta){}
	$('body').mousewheel(function(event,delta){
		loghandle(event,delta);
		var pos = $(".c_con").position();
		var offset_left = pos.left;
		if(offset_left%cbw !== 0) return false;
		var len = $(".c_con .c_b").length;
		var le = (len -1) * $(window).width();
		var cbh_offset = offset_left%cbw;
		if(delta > 0){
			
			if(pos.left !== 0){
				var c_b = $(".c_con").position().left;
				$(".c_con").animate({left: cbw+c_b+'px'});
				var cc = -(pos.left / cbw)-1;
				$(".right_list div ul li").eq(cc).addClass("clk").siblings("li").removeClass("clk");
			}else{
				return;
			}
			
		}else{
			var cb = (sll-1) * cbw;
			if(pos.left > -cb){
				var c_c = $(".c_con").position().left;
				$(".c_con").animate({left: -cbw+c_c+'px'});
				var cca = -(pos.left / cbw) + 1;
				$(".right_list div ul li").eq(cca).addClass("clk").siblings("li").removeClass("clk");
			}else{
				return;
			}
		}
	});
	//圆点点击滑动
	$(".right_list div ul li").click(function(){
		var rl_eq = $(this).index();
		$(this).addClass("clk").siblings("li").removeClass("clk");
		var m_t = $(".c_con").position();
		var m_top = m_t.left;
		
		$(".c_con").stop().animate({
			left: -(cbw * rl_eq) + "px"
		},800);
		
	})
	//
	var a = $(".c_con .c_b").length;
	var b = $(window).width();
	
	$(".rt").click(function(){
		var c_c = $(".c_con").position().left;
		if(c_c > -[a-1]*b){
			$(".c_con").animate({left: -b+c_c+'px'});
			var pos = $(".c_con").position();
			var cca = -(pos.left / cbw)+1;
			$(".right_list div ul li").eq(cca).addClass("clk").siblings("li").removeClass("clk");
		}
	})
	
	$(".lt").click(function(){
		var c_c = $(".c_con").position().left;
		if(c_c < 0){
			$(".c_con").animate({left: b+c_c+'px'});
			var pos = $(".c_con").position();
			var cc = -(pos.left / cbw)-1;
			$(".right_list div ul li").eq(cc).addClass("clk").siblings("li").removeClass("clk");
		}
	})
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	//图片居中
	var cb = $(".c_b img").height();
	$(".c_b img").css("margin-left", - (cb * 61 /100) /2 +"px");
});