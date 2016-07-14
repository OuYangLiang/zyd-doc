(function(window, undefined) {
	var utils = {};

	/** AJAX请求共通
	 *{String} req.url 调用接口传的链接
	 *{Object} req.data 调用接口传参的json
	 */

	utils.doNet = function(req) {
		var dfd = $.Deferred();
		var url = ctx + req.url;
		$.ajax({
			type: "POST",
			url: url,
			dataType: "text",
			data: {
				"jsonData": JSON.stringify(req.data)
			},
			success: function(json) {
				eval('resp = ' + json);
				if (resp.success) {
					dfd.resolve(resp);
				} else {
					dfd.reject(resp);
				}
			},
			error: function(json) {
				eval('resp = ' + json);
				dfd.reject(resp);
			}
		});
		return dfd;
	};

	/**
	 *jsonp Ajax 请求共同
	 */

	utils.doNetJsonp = function(req) {
		var dfd = $.Deferred();
		var url = ctx + req.url;
		$.ajax({
			type: "POST",
			url: url,
			dataType: "jsonp",
			jsonp: "callback",
			jsonpCallback: "jsonpCallback",
			data: {
				"jsonData": JSON.stringify(req.data)
			},
			success: function(json) {
				eval('resp = ' + json);
				if (resp.success) {
					dfd.resolve(resp);
				} else {
					dfd.reject(resp);
				}
			},
			error: function(json) {
				eval('resp = ' + json);
				dfd.reject(resp);
			}
		});
		return dfd;
	};

	function isClass(o) {
		if (o === null) return "Null";
		if (o === undefined) return "Undefined";
		return Object.prototype.toString.call(o).slice(8, -1);
	}

	/**
	 *深度克隆
	 */
	utils.deepClone = function(obj) {
		var result, oClass = isClass(obj);
		//确定result的类型
		if (oClass === "Object") {
			result = {};
		} else if (oClass === "Array") {
			result = [];
		} else {
			return obj;
		}
		for (key in obj) {
			var copy = obj[key];
			if (isClass(copy) == "Object") {
				result[key] = arguments.callee(copy); //递归调用
			} else if (isClass(copy) == "Array") {
				result[key] = arguments.callee(copy);
			} else {
				result[key] = obj[key];
			}
		}
		return result;
	};

	/**
	 *将表单中的单项转化成json对象
	 */
	utils.convertToJson = function($form) {
		var jsonData = {};
		$form.find('.form-control').each(function(index, el) {
			if (el.getAttribute('json')) {
				if (el.type === 'checkbox') {
					jsonData[el.getAttribute('json')] = el.checked ? '1' : '0';
				} else if (el.type === 'radio') {
					el.checked && (jsonData[el.getAttribute('json')] = el.value);
				} else {
					jsonData[el.getAttribute('json')] = el.value;
				}
			}
		});
		return jsonData;
	};

	/**
	 *添加表单验证的方法
	 */
	utils.formValidate = function($form, sucFunc, failFunc) {
		(function($form, sucFunc, failFunc) {
			$form.bootstrapValidator().on('click', 'input.submit', function() {
				if ($form.data('bootstrapValidator').validate().isValid()) {
					sucFunc && 'function' === typeof sucFunc && sucFunc.call(this);
				} else {
					$form.data('bootstrapValidator').disableSubmitButtons(true);
					failFunc && 'function' === typeof failFunc && failFunc.call(this);
				}
			});
		})($form, sucFunc, failFunc);
	};

	/**
	 *初始化左侧菜单
	 */
	utils.initBar = function() {
		var id = $("#menuCodeDefault").val();
		var idArr = id.split('_');
		var titleId = idArr[0];
		$('.sidebar_menuList').find('li.active').removeClass('active');
		$('.sidebar_menuList').find('#' + titleId).addClass('active');
		var sideBarIdArr = idArr.slice(1);
		for (var i = 0; i < sideBarIdArr.length; i++) {
			var _idArr = sideBarIdArr.slice(0, i + 1);
			var _id = titleId + '_' + _idArr.join('_');
			if (i === sideBarIdArr.length - 1) {
				$('#sidebar .sidebar-menu').find('#' + _id).addClass('active');
			} else {
				$('#sidebar .sidebar-menu').find('#' + _id).addClass('active open');
			}
		}
		$('#' + titleId + '_Menu').show();
	};

	/**
	 *弹出通用弹出框的通用方法
	 *{object} option
	 *{string} option.type
	 *              'tip' ：提示框（无按钮，闪现几秒后消失）
	 *              'alert' ：警示框（有确认按钮）
	 *              'confirm' ：确认提示框（有确认按钮和取消按钮）
	 *              'prompt' ：带有input的修改弹出框（有确认按钮和取消按钮）
	 *{string} option.className     弹出框的className
	 *{string} option.title         弹出框的title
	 *{string} option.titleAlign    弹出框的title显示格式 'left' 'center' 'right'
	 *{string} option.value         弹出框的内容
	 *{string} option.placeholder   弹出框中input的默认placeholder
	 *{string} option.valueAlign    弹出框的内容的显示格式 'left' 'center' 'right'
	 *{string} option.size          弹出框的大小 'lg' 'md' 'sm'
	 *{string} option.buttonAlign   弹出框的按钮的显示格式 'left' 'center' 'right'
	 *{boolean} option.closeButton  弹出框右上角的关闭小×是否显示
	 *{function} option.confirmFunc 确认按钮点击方法回调
	 *{function} option.cancelFunc  取消按钮点击方法回调
	 */
	utils.dialog = function(option) {
		if (!bootbox) {
			console.error('请引入bootbox.js');
			return;
		}
		var dialogArgsObj;
		var dialog;
		if (option.type === 'tip') {
			dialogArgsObj = {
				className: option.className || '',
				message: option.value,
				valueAlign: option.valueAlign || (option.size ? (option.size === 'sm' ? 'center' : 'left') : 'center'),
				size: option.size || 'sm',
				closeButton: !! option.closeButton,
				buttonAlign: option.buttonAlign || (option.size ? (option.size === 'sm' ? 'center' : 'right') : 'center')
			};
			setTimeout(function() {
				dialog.modal('hide');
			}, 2000);
		} else if (option.type === 'alert') {
			dialogArgsObj = {
				className: option.className || '',
				title: option.title,
				titleAlign: option.titleAlign || (option.size ? (option.size === 'sm' ? 'center' : 'left') : 'center'),
				message: option.value,
				valueAlign: option.valueAlign || (option.size ? (option.size === 'sm' ? 'center' : 'left') : 'center'),
				size: option.size || 'sm',
				closeButton: !! option.closeButton,
				buttonAlign: option.buttonAlign || (option.size ? (option.size === 'sm' ? 'center' : 'right') : 'center'),
				buttons: {
					'btn_confirm': {
						label: "确认",
						className: "btn btn_common_color",
						callback: option.confirmFunc || function() {}
					}
				}
			};
		} else if (option.type === 'confirm') {
			dialogArgsObj = {
				className: option.className || '',
				title: option.title,
				titleAlign: option.titleAlign || (option.size ? (option.size === 'sm' ? 'center' : 'left') : 'center'),
				message: option.value,
				valueAlign: option.valueAlign || (option.size ? (option.size === 'sm' ? 'center' : 'left') : 'center'),
				size: option.size || 'sm',
				closeButton: !! option.closeButton,
				buttonAlign: option.buttonAlign || (option.size ? (option.size === 'sm' ? 'center' : 'right') : 'center'),
				buttons: {
					'btn_confirm': {
						label: "确认",
						className: "btn btn_common_color",
						callback: option.confirmFunc || function() {}
					},
					'btn_cancel': {
						label: "取消",
						className: "btn btn_cancel_color",
						callback: option.cancelFunc || function() {}
					}
				}
			};
		} else if (option.type === 'prompt') {
			dialogArgsObj = {
				className: option.className || '',
				title: option.title,
				// titleAlign: option.titleAlign || (option.size ? (option.size === 'sm' ? 'center' : 'left') : 'left'),
				titleAlign: option.titleAlign || 'left',
				message: '<input class="input_prompt" type="text" placeholder=' + option.placeholder + ' value=' + (option.value || '') + '>',
				valueAlign: option.valueAlign || 'left',
				size: option.size || 'md',
				closeButton: !! option.closeButton,
				// buttonAlign: option.buttonAlign || (option.size ? (option.size === 'sm' ? 'center' : 'right') : 'right'),
				buttonAlign: option.buttonAlign || 'right',
				buttons: {
					'btn_confirm': {
						label: "确认",
						className: "btn btn_common_color",
						callback: option.confirmFunc || function() {}
					},
					'btn_cancel': {
						label: "取消",
						className: "btn btn_cancel_color",
						callback: option.cancelFunc || function() {}
					}
				}
			};
		}
		dialog = bootbox.dialog(dialogArgsObj);
	};

	/**
	 *显示页面中的dialog
	 */
	utils.showDialog = function($dialog) {
		!$dialog.hasClass('fade') && $dialog.addClass("fade");
		if ($dialog.modal && 'function' === typeof $dialog.modal) $dialog.modal('show');
	};

	/**
	 *隐藏页面中的dialog
	 */
	utils.hideDialog = function($dialog) {
		if ($dialog.modal && 'function' === typeof $dialog.modal) $dialog.modal('hide');
	};

	/**
	 *初始化日期范围控件
	 *{object} options
	 *{string} options.format    'YYYY/MM/DD'
	 *{string} options.startDate '2015-12-12'
	 *{string} options.endDate   '2015-12-12'
	 */
	utils.initRangeDatePicker = function($el, options) {
		if ($el.get(0) && $el.daterangepicker && typeof $el.daterangepicker === 'function' && typeof moment === 'function') {
			if (!options.startDate && !options.endDate) {
				$el.daterangepicker(options);
				return;
			}
			if (options.startDate && !options.endDate && moment(options.startDate._d.getTime() > Date.now())) throw new Error('startDate invalid!');
			if (!options.startDate && options.endDate && moment(options.endDate._d.getTime() < Date.now())) throw new Error('endDate invalid!');
			if (options.startDate && options.endDate && moment(options.startDate)._d.getTime() > moment(options.endDate)._d.getTime()) throw new Error('startDate and endDate invalid!');
			$el.daterangepicker(options).data('daterangepicker').updateInputText();
		}
	};

	/**
	 * 初始化日期控件
	 * value 可选参数   '2015-12-12'
	 */
	utils.initDatePicker = function($el, value) {
		if ($el.get(0)) {
			var datePicker = $el.datepicker({
				format: 'yyyy-mm-dd'
			});
			( !! value) && datePicker.datepicker('setValue', value);
		}
	};


	/**
	 *初始化表格的全选功能
	 */
	utils.initTableCheckControl = function($table) {
		if ($table.find('input[data-tabel-control=parent]').get(0)) {
			var $tableParentControl = $table.find('input[data-tabel-control=parent]');
			var $tableChildControls = $table.find('input[data-tabel-control=child]');
			$tableParentControl.bind('change', function() {
				var checked = this.checked;
				$tableChildControls.each(function(index, el) {
					el.checked = checked;
				});
			});
		}
	};

	/**
	 *获取表格中选中的项对应的value值
	 */
	utils.getTableCheckControl = function($table) {
		if (!$table.find('input[data-tabel-control=child]').get(0)) return;
		var dataArr = [];
		$table.find('input[data-tabel-control=child]').each(function(index, el) {
			el.checked && dataArr.push(el.value);
		});
		return dataArr.join(',');
	};

	/*
	 *初始化文本编辑框
	 *{object} options
	 * {number}options.height 定义文本编辑框的高度
	 * {boolean}options.ownPicPopup true:使用自己定义的弹出框  false:使用默认的弹出框
	 * 使用自定义的弹出框后，在初始化完编辑框后，通过$('#' + 编辑框id).find('button[data-event=showPersonalImageDialog]')获取按钮，并添加事件
	 */
	utils.initSummernote = function($summernote, options) {
		if ($summernote.summernote && 'function' === typeof $summernote.summernote) {
			var params = {};
			params.lang = 'CHN';
			params.height = options.height || 300;
			options.ownPicPopup && (params.toolbar = [
				['style', ['style']],
				['font', ['bold', 'italic', 'underline', 'clear']],
				['fontname', ['fontname']],
				// ['fontsize', ['fontsize']], Still buggy
				['color', ['color']],
				['para', ['ul', 'ol', 'paragraph']],
				['height', ['height']],
				['table', ['table']],
				['insert', ['link', 'ownpicture', 'video']],
				['view', ['fullscreen', 'codeview']],
				['help', ['help']]
			]);
			return $summernote.summernote(params);
		}
		return false;
	};


	/*
	 *初始化step控件
	 *{object} options
	 *{jquery} options.$dom 	需要初始化的$dom
	 *{number} options.step 	初始化需要的起始步长
	 *{jquery} options.prevBtn  上一步按钮
	 *{jquery} options.nextBtn  下一步按钮
	 */
	utils.initStepWidget = function(options) {
		typeof options.$dom.wizard === 'function' && options.$dom.wizard({
			currentStep: options.step || 1,
			prevBtn: options.prevBtn,
			nextBtn: options.nextBtn
		}).data('wizard').setState();
	};

	window.utils = utils;

})(window);