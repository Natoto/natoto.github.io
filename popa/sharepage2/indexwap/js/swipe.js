/*
 *	version swipes 1.0;
 *	date    2014.3.18;
 *	author  wanghao;
 *	#example:
 *	$("#test").swipes({
 *			wipeLeft: function() {$("#val").append("左，");}, //左侧滑动事件
 *			wipeRight: function() { $("#val").append("右，");}, //右侧滑动事件
 *			wipeUp: function() { $("#val").append("上，");}, //向上滑动事件
 *			wipeDown: function() { $("#val").append("下，");}, //向下滑动事件
 *			preventDefaultEvents: true //阻止默认事件
 *		});
 *
 */
;(function($, undefined){
	$.fn.swipes=function(options){
		var defaults = {
            swipeLeft:function(){},
            swipeRight:function(){},
			swipeTop:function(){},
            swipeDown:function(){},
			scrollDis:0,
			inits:function(){},
			preventDeault:true
        }
		if(options) var options = $.extend(defaults, options);
		/*************获取当前正在滑动的对象**************/
		var $this=$(this);
		var $jsThis=$this.get(0);
		this.each(function(){
			/*************给正在滑动的对象绑定函数**************/
			try{
			$jsThis.addEventListener("touchstart",startEve,false);
			$jsThis.addEventListener("touchend",endEve,false);
			}catch(e){}
			/**********定义开始和结束的x和y坐标**********/
			var startX,startY,endX=0,endY=0,Vtime,scrollHei,firstDisX,firstDisY,initTime,endTime,setTimes,isfirst=true,isvert=true;
			
			//根据起点和终点返回方向 1：向上，2：向下，3：向左，4：向右,0：未滑动
			function GetSlideDirection(startX, startY, endX, endY,isHorz) {
				var dy = startY - endY;
				var dx = endX - startX;
				if(isHorz){
					if(startX<endX) {
						result = 2;
					}else if(startX>endX){
						result = 1;
					}
					return result;
				}else{
					if(startY<endY) {
						result = 4;
					}else if(startY>endY){
						result = 3;
					}
					return result;
				}
			
			}
			var ishit=true;
			function startEve(e){
				if ( e.touches.length > 1){return;}
				var evt=e.touches[0];
				startX=(endX==0)?evt.clientX:endX;
				startY=(endY==0)?evt.clientY:endY;
				Vtime=setTimeout(function(){
					$jsThis.addEventListener("touchmove",movEve,false);
					$jsThis.addEventListener("touchend",endEve,false);
				},0);
			}
			
			var movEve=function(e){
				if ( e.touches.length > 1){ishit=false; return;}
				ishit=true;
				var evt=e.touches[0];
				
				if(isfirst){
					firstDisX=evt.clientX;
					firstDisY=evt.clientY;
					isfirst=false;
				}
				if(firstDisX!="undefined"&&firstDisX!=null&&firstDisY!="undefined"&&firstDisY!=null){
					if(Math.abs(firstDisX-startX)<=Math.abs(firstDisY-startY)){//垂直滑动
						endX=evt.clientX;
						endY=evt.clientY;
						isvert=true;
						var absMarW=Math.abs(endX-startX);
						var absMarH=Math.abs(endY-startY);
						var direct=GetSlideDirection(startX,startY,endX,endY,false);
						if(absMarH!=0){
							e.preventDefault();
							glb.isMove=false;
							switch(direct){
								case 3:options.swipeUp(absMarH,false);break;
								case 4:options.swipeDown(absMarH,false);break;
							};
						}else{
							glb.isMove=true;
							$jsThis.removeEventListener("touchmove",movEve,false);
							return;
						}
					}else{
						isvert=false;
						endX=evt.clientX;
						endY=evt.clientY;
						var absMarW=Math.abs(endX-startX);
						var absMarH=Math.abs(endY-startY);
						var direct=GetSlideDirection(startX,startY,endX,endY,true);
						if(absMarW!=0){
							e.preventDefault();
							switch(direct){
								case 1:options.swipeLeft(absMarW,false);break;
								case 2:options.swipeRight(absMarW,false);break;
							};
						}else{
							e.preventDefault();
							$jsThis.removeEventListener("touchmove",movEve,false);
							return;
						}
					}
				}
			}
			
			function endEve(ev){
				if (!ishit){return;}
				glb.isMove=true;
				if(isvert){
					clearTimeout(Vtime);
					$jsThis.removeEventListener("touchmove",movEve);
					var absMarW=Math.abs(endX-startX);
					var absMarH=Math.abs(endY-startY);
					var direct=GetSlideDirection(startX,startY,endX,endY,false);
					if(absMarH!=0){
						switch(direct){
							case 3:options.swipeUp(absMarH,true);break;
							case 4:options.swipeDown(absMarH,true);break;
						};
					}
				}else{
					clearTimeout(Vtime);
					$jsThis.removeEventListener("touchmove",movEve);
					var absMarW=Math.abs(endX-startX);
					var absMarH=Math.abs(endY-startY);
					var direct=GetSlideDirection(startX,startY,endX,endY,true);
					if(absMarW!=0){
						switch(direct){
							case 1:options.swipeLeft(absMarW,true);break;
							case 2:options.swipeRight(absMarW,true);break;
						};
					}
					
				}
					firstDisX=null;
					firstDisY=null;
					isfirst=true;
					clearTimeout(setTimes);
					setTimes=null;
					startX=0;
					startY=0;
					endX=0;
					endY=0;
					isvert=true;
				
			}
		});
	}
	
})(Zepto);
