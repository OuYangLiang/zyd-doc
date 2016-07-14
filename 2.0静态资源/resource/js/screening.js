/*    var dlNum  =$("#selectList").find("dl");
    //for (i = 0; i < dlNum.length; i++) {
     //   $(".hasBeenSelected .clearList").append("<div class=\"selectedInfor selectedShow\" style=\"display:none\"><span></span><label></label><em></em></div>");
   // }
    
    var refresh = "true";*/
    
   // $(".listIndex label").live("click",function(){
//		var Asele=$(".listIndex").find("a");
//        var text =$(this).text();
//        var selectedShow = $(".selectedShow");
//        var textTypeIndex =$(this).parents("dl").index();//父级dl 的索引值
//        var textType =$(this).parent("dd").siblings("dt").text();//取上一层的文本
//        index = textTypeIndex;
//        $(".clearDd").show();
//        $(".selectedShow").eq(index).show();
//		$(this).find("a").addClass("selected");
//
//		$(this).find("input").attr("checked",true);
//		var infor='<div class=\"selectedInfor selectedShow\"><span>'+textType+'</span><label>'+text+'</label><em></em></div>'
//         $(".hasBeenSelected .clearList").append(infor);
//		selectedShow.eq(index).find("span").text(textType);
//        selectedShow.eq(index).find("label").text(text);
//		判断个数显示
//       var show = $(".selectedShow").length - $(".selectedShow:hidden").length;
//		if (show > 1) {
//         $(".eliminateCriteria").show();
//    	}
//       
//    });
/*	 $(".listIndex label").toggle(function(){
		 var Asele=$(".listIndex").find("a");
        var text =$(this).text();
        var selectedShow = $(".selectedShow");
        var textTypeIndex =$(this).parents("dl").index();//父级dl 的索引值
        var textType =$(this).parent("dd").siblings("dt").text();//取上一层的文本
        index = textTypeIndex;
        $(".clearDd").show();
        $(".selectedShow").eq(index).show();
		$(this).find("a").addClass("selected");

		$(this).find("input").attr("checked",true);
		var infor='<div class=\"selectedInfor selectedShow\"><span>'+textType+'</span><label>'+text+'</label><em></em></div>';
         $(".hasBeenSelected .clearList").append(infor);
		 
	},function(){
		$(this).find("a").removeClass("selected");
		$(this).find("input").attr("checked",false);
		});*/

//	 $(".listIndex label").toggle(function(){
//			 var text =$(this).text();
//        var selectedShow = $(".selectedShow");
//       var textTypeIndex =$(this).parents("dl").index();
//       var textType =$(this).parent("dd").siblings("dt").text();
//	           index = textTypeIndex -(2);
//			 $(this).find("a").addClass("selected");
//			 $(this).find("input").attr("checked",true);
//			 selectedShow.eq(index).find("span").text(textType);
//			 $(".selectedShow").eq(index).show();
//			  $(".clearDd").show();
//			  var show = $(".selectedShow").length - $(".selectedShow:hidden").length;
//			//if (show > 1) {
////					   $(".eliminateCriteria").show();
////				}
//		 },function(){
//			 $(this).find("a").removeClass("selected");
//	     	 $(this).find("input").attr("checked",false);
//			 });
/*
    $(".selectedShow em").live("click",function(){
        $(this).parents(".selectedShow").remove();
        var textTypeIndex =$(this).parents(".selectedShow").index();
        index = textTypeIndex;
        $("#selectList").eq(index).find("a").removeClass("selected");
		$("#selectList").eq(index).find("input").attr("checked",false);
        
      //if($(".listIndex .selected").length < 2){
       //    $(".eliminateCriteria").hide();
        //}
    });   
    $(".eliminateCriteria").live("click",function(){
        $(".selectedShow").remove();
        //$(this).hide();
        $(".listIndex a ").removeClass("selected")
		$(".listIndex a ").prev().attr("checked",false);
    }); */


$('.clearDd').show();



var okSelect = []; //已经选择好的
var okSearchParams = [];
var existFilter = document.getElementById("filterConditions").value; //用来进行后台查询
okSearchParams.push(existFilter);
var oSelectList = document.getElementById('selesctList');

var oClearList = $(".hasBeenSelected .clearList");
var oCustext1 = document.getElementById('custext1');
var oCustext2 = document.getElementById('custext2');
var aItemTxt = oSelectList.getElementsByTagName('a');
var isCusPrice = false;//是否自定义价格
var radioVal = '';

oSelectList.onclick = function(e, a) {
    var ev = e || window.event;
    var tag = ev.target || ev.srcElement;
    if(!tag)return;
    var tagName = tag.nodeName.toUpperCase();
    var infor = '';
    var aRadio = document.getElementsByName('radio2');

    if( isCusPrice ) {
      radioVal = oCustext1.value + '-' + oCustext2.value + '元';
    } else {
      radioVal = '';
    }

    if (tagName == 'A') { //如果点击 的是 A

        if (trim(tag.innerHTML) == '不限') { //如果上一个节点没有则认为点击的是 '不限'
            var parent = parents(tag, 'dd');
            var aItem = parent.getElementsByTagName('label');
            var sType = '';
            for (var i = 0, len = aItem.length; i < len; i++) {
                sType = prev(parents(aItem[i], 'dd')).innerHTML;
                delStr(text(aItem[i]) + '|' + sType, okSelect);
            }
        
        } else {
            var sTypeC = prev(parents(tag, 'dd')).id;
            var sType = prev(parents(tag, 'dd')).innerHTML;
            okSelect.push(trim(tag.innerHTML) + '|' + sType);
            okSearchParams.push(sTypeC + '|' + trim(tag.getAttribute("values1")))
        }
    };

    var vals = [];
    for (var i = 0,
    size = okSelect.length; i < size; i++) {
        vals = okSelect[i].split('|');
        infor += '<div class=\"selectedInfor selectedShow\"><span>' + vals[1] + '</span><label>' + vals[0] + '</label><em><i class="fa fa-remove"></i></em></div>';
    }
    oClearList.html(infor);
};
$('div.eliminateCriteria').click(function(){
    $(oSelectList).find('input').attr('checked',false);
    radioVal = '';
    isCusPrice = false;
    okSelect.length = 0;
    okSearchParams.length = 0;
    $(oSelectList).trigger('click', 1);
})

$('.clearList').find('em').live('click',function(){
    var self = $(this);
    var val = self.prev().html() + '|' + self.prev().prev().html();
    var n = -1;
    var a = this.getAttribute('p') || 1;
    self.die('click');
    for(var i = 0, len = aItemTxt.length; i < len; i++) {
         var html = val.split('|')[0];
         if(trim(aItemTxt[i].innerHTML) == html) {
              prev(aItemTxt[i]).checked = false;
              break;
        }
    };
    delStr(val, okSelect);
    $(oSelectList).trigger('click', a);

})

function delStr(str, arr) { //删除数组给定相同的字符串
    var n = -1;
    for (var i = 0,
    len = arr.length; i < len; i++) {
        if (str == arr[i]) {
            n = i;
            break;
        }
    }
    n > -1 && arr.splice(n, 1);
};
function trim(str) {
    return str.replace(/^\s+|\s+$/g, '')
};
function text(e) {
    var t = '';
    e = e.childNodes || e;
    for (var j = 0; j < e.length; j++) {
        t += e[j].nodeType != 1 ? e[j].nodeValue: text(e[j].childNodes);
    }
    return trim(t);
}

function prev(elem) {
    do {
        elem = elem.previousSibling;
    } while ( elem && elem . nodeType != 1 );
    return elem;
};

function next(elem) {
    do {
        elem = elem.nextSibling;
    } while ( elem && elem . nodeType != 1 );
    return elem;
}

function parents(elem, parents) {  //查找当前祖先辈元素需要的节点  如 parents(oDiv, 'dd') 查找 oDiv 的祖先元素为dd 的
    if(!elem || !parents) return;
    var parents = parents.toUpperCase();
    do{
        elem = elem.parentNode;
    } while( elem.nodeName.toUpperCase() != parents );
    return elem;
};
