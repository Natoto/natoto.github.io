function swipeFun(obj,sconObj,thirdObj,forObj){//对象分别为"slider","marCon","ul","li"
			/******焦点图*********/
		var isTouch=true;
		var isTouchone = true;
		obj.each(function(){
			var cont=sconObj.html();
			sconObj.html(cont+cont);
			var ul=sconObj.find(thirdObj);
			var li=sconObj.find(forObj);
			var len=li.length;
			var lWid=li.eq(0).width();
			sconObj.width(lWid*len);
			ul.width(lWid*len/2);
		});
		
		/******************滑动焦点图事件******************/
		obj.swipes({
			istouch:true,
			inits:function(){
				var ow=obj.find("li").width();
				var mW=sconObj.width();
				return((obj.css("translateX")%ow==0)?obj.obj.css("translateX"):(parseInt(obj.obj.css("translateX")/ow))*ow);
				},
			scrollDis:this.inits,
			swipeLeft:function(dis,bol){
				var ow=obj.find("li").width();
				var that=this;
				if(!that.istouch) return false;
				that.istouch=false;
				var mW=sconObj.width();
				if(bol){
					if(dis>=20){
						if(Math.abs(this.scrollDis)>=mW/2){
							this.scrollDis=-ow;
							var disscro=this.scrollDis;
							sconObj.animate({"translate3d":disscro+"px,0px,0px"},500,function(){
								that.scrollDis=disscro;
								var i=1;
								that.istouch=true;
							});
						}else{
							var disscro=(this.scrollDis-parseInt(ow));
							sconObj.animate({"translate3d":disscro+"px,0px,0px"},200,function(){
								that.scrollDis=disscro;
								var i=Math.abs(parseInt(disscro/obj.width()));
								that.istouch=true;
								
							});
						}
					
					}else{
						var disscro=this.scrollDis;
						sconObj.animate({"translate3d":disscro+"px,0px,0px"},200,function(){
							that.scrollDis=disscro;
							that.istouch=true;
						});
					}
						
				}else{				
					/*if(inter&&isTouch){
						clearInterval(inter);
						inter=null;
						that.scrollDis=obj.scrollLeft();
					}*/
					that.istouch=true;
					if(Math.abs(this.scrollDis)>=mW/2){
						sconObj.css({"-webkit-transform":"translate3d("+0+"px,0px,0px)"});
						this.scrollDis=0;
					}
					sconObj.css({"-webkit-transform":"translate3d("+(this.scrollDis-dis)+"px,0px,0px)"});
				}
			},
			swipeRight:function(dis,bol){
				var ow=obj.find("li").width();
				var that=this;
				if(!that.istouch) return false;
				that.istouch=false;
				var mW=sconObj.width();
				if(bol){
					if(dis>=20){
						if(Math.abs(this.scrollDis)<=0){
							this.scrollDis=-mW/2;
							var disscro=this.scrollDis;
							sconObj.animate({"translate3d":disscro+"px,0px,0px"},500,function(){
								that.scrollDis=disscro;
								var i=1;
								that.istouch=true;
								//if(inter==null) inter=setInterval(toright,5000);

							});
							}else{
								var disscro=(this.scrollDis+parseInt(ow));
								sconObj.animate({"translate3d":disscro+"px,0px,0px"},200,function(){
									that.scrollDis=disscro;
									var i=Math.abs(parseInt(disscro/obj.width()));
									that.istouch=true;
								});
							}
						
						}else{
							var disscro=(this.scrollDis);
							sconObj.animate({"translate3d":disscro+"px,0px,0px"},200,function(){
								that.scrollDis=obj.scrollLeft();
								that.istouch=true;
								//if(inter==null) inter=setInterval(toright,5000);
							});
						}
				}else{
					/*if(inter&&isTouch){
						clearInterval(inter);
						inter=null;
						that.scrollDis=obj.scrollLeft();
					}*/that.istouch=true;
					if(Math.abs(this.scrollDis)<=0){
						sconObj.css({"-webkit-transform":"translate3d("+(-mW/2)+"px,0px,0px)"});
						this.scrollDis=-mW/2;
					}
					sconObj.css({"-webkit-transform":"translate3d("+(this.scrollDis+dis)+"px,0px,0px)"});
				}
			},
			swipeUp:function(dis,bol){
				return false;
			},
			swipeDown:function(dis,bol){
				return false;
			},
			preventDefaultEvents: true
		});
		/******************滑动焦点图事件end******************/
	}
		/*************焦点图结束****************/