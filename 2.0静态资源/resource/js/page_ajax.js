/*

showPages v1.1
=================================
Example
----------------------
var pg = new showPages('pg');
pg.pageCount = 12; //定义总页数(必要)
pg.argName = 'p';    //定义参数名(可选,缺省为page)
pg.printHtml();        //显示页数


Supported in Internet Explorer, Mozilla Firefox
*/

function showPages(name, id,callback) { //初始化属性
	this.name = name;      //对象名称
	this.page = 1;         //当前页数
	this.pageCount = 1;    //总页数
	this.argName = 'page'; //参数名
	this.showTimes = 1;    //打印次数
	this.callback = callback; //回调函数
	this.tabName = 'two';
	this.cursel = '1';
	this.containerId = id;
}

showPages.prototype.getPage = function(){ //丛url获得当前页数,如果变量重复只获取最后一个
	var args = location.search;
	var reg = new RegExp('[\?&]?' + this.argName + '=([^&]*)[&$]?', 'gi');
	var chk = args.match(reg);
	this.page = RegExp.$1;
}
showPages.prototype.checkPages = function(){ //进行当前页数和总页数的验证
	if (isNaN(parseInt(this.page))) this.page = 1;
	if (isNaN(parseInt(this.pageCount))) this.pageCount = 1;
	if (this.page < 1) this.page = 1;
	if (this.pageCount < 1) this.pageCount = 1;

	this.page = parseInt(this.page);
	this.pageCount = parseInt(this.pageCount);

	if (this.page > this.pageCount) this.page = this.pageCount;
	this.page = parseInt(this.page);
	this.pageCount = parseInt(this.pageCount);
}
showPages.prototype.createHtml = function(mode){ //生成html代码
	var strHtml = '', prevPage = this.page - 1, nextPage = this.page + 1;
	if (mode == '' || typeof(mode) == 'undefined') mode = 0;
	switch (mode) {
		case 2 : //模式2 (前后缩略,页数,首页,前页,后页,尾页)
			strHtml += '<span class="number">';
			if (prevPage < 1) {
				strHtml += '<span title="First Page"><i class="fa fa-angle-double-left"></i></span>';
				strHtml += '<span title="Prev Page"><i class="fa fa-angle-left"></i></span>';
			} else {
				strHtml += '<span title="First Page"><a href="javascript:' + this.name + '.toPage(1);"><i class="fa fa-angle-double-left"></i></a></span>';
				strHtml += '<span title="Prev Page"><a href="javascript:' + this.name + '.toPage(' + prevPage + ');"><i class="fa fa-angle-left"></i></a></span>';
			}
			if (this.page != 1) strHtml += '<span title="Page 1"><a href="javascript:' + this.name + '.toPage(1);">1</a></span>';
			if (this.page >= 5) strHtml += '<span>...</span>';
			if (this.pageCount > this.page + 2) {
				var endPage = this.page + 2;
			} else {
				var endPage = this.pageCount;
			}
			for (var i = this.page - 2; i <= endPage; i++) {
				if (i > 0) {
					if (i == this.page) {
						strHtml += '<span title="Page ' + i + '">' + i + '</span>';
					} else {
						if (i != 1 && i != this.pageCount) {
							strHtml += '<span title="Page ' + i + '"><a href="javascript:' + this.name + '.toPage(' + i + ');">' + i + '</a></span>';
						}
					}
				}
			}
			if (this.page + 3 < this.pageCount) strHtml += '<span>...</span>';
			if (this.page != this.pageCount) strHtml += '<span title="Page ' + this.pageCount + '"><a href="javascript:' + this.name + '.toPage(' + this.pageCount + ');">' + this.pageCount + '</a></span>';
			if (nextPage > this.pageCount) {
				strHtml += '<span title="Next Page"><i class="fa fa-angle-right"></i></span>';
				strHtml += '<span title="Last Page"><i class="fa fa-angle-double-right"></i></span>';
			} else {
				strHtml += '<span title="Next Page"><a href="javascript:' + this.name + '.toPage(' + nextPage + ');"><i class="fa fa-angle-right"></i></a></span>';
				strHtml += '<span title="Last Page"><a href="javascript:' + this.name + '.toPage(' + this.pageCount + ');"><i class="fa fa-angle-double-right"></i></a></span>';
			}
			strHtml += '</span>';
			strHtml += '<span class="count">页数: ' + this.page + ' / ' + this.pageCount + '</span>';
			break;
	}
	return strHtml;
}
showPages.prototype.createUrl = function (page) { //生成页面跳转url
	if (isNaN(parseInt(page))) page = 1;
	if (page < 1) page = 1;
	if (page > this.pageCount) page = this.pageCount;
	var url = location.protocol + '//' + location.host + location.pathname;
	var args = location.search;
	var hash = location.hash;
	var reg = new RegExp('([\?&]?)' + this.argName + '=[^&]*[&$]?', 'gi');
	args = args.replace(reg,'$1');
	if (args == '' || args == null) {
		args += '?' + this.argName + '=' + page;
	} else if (args.substr(args.length - 1,1) == '?' || args.substr(args.length - 1,1) == '&') {
			args += this.argName + '=' + page;
	} else {
			args += '&' + this.argName + '=' + page;
	}
	if (hash != null && hash !="") {
		args += hash;
	}
	return url + args;
}
showPages.prototype.toPage = function(page){ //页面跳转
	var turnTo = 1;
	if (typeof(page) == 'object') {
		turnTo = page.options[page.selectedIndex].value;
	} else {
		turnTo = page;
	}
	this.page = turnTo;
	this.callback(this.tabName, this.cursel, turnTo, true);
}
showPages.prototype.printHtml = function(mode){ //显示html代码
	//this.getPage();
	this.checkPages();
	this.showTimes += 1;
	document.getElementById(this.containerId).setAttribute('class','pages');
	document.getElementById(this.containerId).innerHTML = this.createHtml(mode);
	
}
showPages.prototype.formatInputPage = function(e){ //限定输入页数格式
	var ie = navigator.appName=="Microsoft Internet Explorer"?true:false;
	if(!ie) var key = e.which;
	else var key = event.keyCode;
	if (key == 8 || key == 46 || (key >= 48 && key <= 57)) return true;
	return false;
}
//-->


		 