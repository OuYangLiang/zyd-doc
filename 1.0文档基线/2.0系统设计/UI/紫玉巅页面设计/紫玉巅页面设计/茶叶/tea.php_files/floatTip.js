//¿ì½Ý²Ëµ¥Js
	var FloatTip = {
		side_channels : $('.sidenav .channels'),
		init: function(){
			this.isMobileDevice = navigator.userAgent.match(/Android|iPhone|iPad|iPod/i);
			this.goTop();
			this.bind();
		},
		goTop: function(){
			$('.sidenav .to-top').click(function(){
				$("html, body").animate({
					scrollTop: 0},
					500, function() {
				});
			});
		},
		getModulesPosition: function(){
			var arr = [];
			$('.sidenav .one-channel').each(function(){
				var item = $("."+$(this).data('item'));
				arr.push({
					top : item.offset().top,
					height : item.height()
				});
			})
			return arr;
		},
		getChannelsCur : function(positions,cur){
			var curIdx = 0,dcur = cur + 2*$(window).height()/3, firstItem = positions[0], lastItem = positions[positions.length-1];
			for(var i=0;i<positions.length;i++){
				if(dcur>positions[i].top){
					curIdx = i;
				}
			}
			
			if(dcur<firstItem.top){
				curIdx = -1;
			}
			if(dcur > lastItem.top + lastItem.height){
				curIdx = -1;
			}
			return curIdx;
		},
		setChannelsCur : function(curIdx){

			$('.sidenav .one-channel').removeClass("active");
			if(curIdx !== -1){
				$('.sidenav .one-channel').eq(curIdx).addClass('active');
			}
		},
		floatNav : function(){
			var self = this;
			var navTop = $('.header').offset().top + 36;
            var scrolltop = $(window).scrollTop();
            if(scrolltop > navTop && scrolltop < self.scrollTop1){
            	$('.nav-wrapper').addClass('fix-wrapper');
            }else{
            	$('.nav-wrapper').removeClass('fix-wrapper');
            }
            self.scrollTop1 = $(window).scrollTop();
		},
		bind: function(){
			//¶¥²¿header
			var self = this,
				side_ch_timer = null;

			var aniT = self.isMobileDevice?"show":'fadeIn';
			
			var positions = this.getModulesPosition();

			self.scrollTop1 = $(window).scrollTop();

			function curChannels(){
				if(self.side_channels.length<1){
	            	return;
	            }
	            var curIdx = self.getChannelsCur(positions,self.scrollTop1);

	            if(curIdx == -1){
					self.side_channels.fadeOut()
					self.setChannelsCur(curIdx);
					return;
				}

		        self.side_channels[aniT]();
				clearTimeout(side_ch_timer);
				side_ch_timer = setTimeout(function(){
					self.side_channels.fadeOut()
				},2000)
				self.setChannelsCur(curIdx);
			}

			if(self.isMobileDevice){
				$('body').get(0).addEventListener('touchmove', function(e) { self.floatNav(); curChannels();}, false);
			}

			$(window).scroll(function(){
				if(!self.isMobileDevice){
					self.floatNav();
				}

	            curChannels();
	        });


			var timer = null;
			$('.sidenav .to-module').mouseenter(function(event) {
				$('.sidenav .channels').fadeIn();
			}).mouseleave(function(event) {
				timer = setTimeout(function(){
					$('.sidenav .channels').fadeOut();	
				}, 200);
			});

			$('.sidenav .channels').mouseenter(function(event) {
				if(timer){
					clearTimeout(timer);
				}
				clearTimeout(side_ch_timer);
			}).mouseleave(function(event) {
				$(this).fadeOut();
			});

			$('.sidenav .channel-name').click(function(event) {
				var toClass = $(this).closest('.one-channel').data('item');
				var top = $('.'+toClass).offset().top - 20;
				$("html, body").animate({
					scrollTop: top},
					500, function() {
				});
			});


		}
	};