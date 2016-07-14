/**
 * NOTICE OF LICENSE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * PHP Version 5
 *
 * @category  Mzentrale
 * @package   Mzentrale_Wishlist
 * @author    Francesco Marangi | mzentrale <f.marangi@mzentrale.de>
 * @copyright 2015 mzentrale GmbH & Co. KG
 * @license   http://opensource.org/licenses/gpl-3.0 GNU General Public License, version 3 (GPLv3)
 * @link      http://www.mzentrale.de/
 */
;

window.mzentrale = window.mzentrale || {};
(function (module, $, window, document) {
    function hasLocalStorage() {
        var testKey = 'test', storage = window.localStorage;
        try {
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
        } catch (error) {
            return false;
        }
        return true;
    }

    var defaults = {
        apiEndpoint: 'http://myfavorites.mytheresa.com/rest/wl/',
        storageKey: 'mzentrale_wishlist',
        listItem: '.wishlist',
        wishlistItem: '.wishlist-item',
        addtoWishlistItem: '.add-to-wishlist',
        notificationCheckbox: '.wishlist-notification',
        syncFrequency: 900000, // 15 minutes
        deleteItem: '.wishlist-delete',
        wishlistButton: '.btn-wishlist',
        cartButton: '.btn-cart',
        itemOption: '.available-sizes li',
        selectedOption: 'selected',
        selectedHoverOption: 'selectedhover',
        noSizeSelected: 'no-size-selected',
        defaultRequestData: {},
        urlConfig: {}
    };

    /**
     * Class constructor
     *
     * @param {String} hash
     * @param {Object} options
     * @constructor
     */
    var Wishlist = function (hash, reference, options) {
        this.hash = hash;
        this.reference = reference;

        this.options = $.extend({}, defaults, options);
        this.wishlistitems = $(this.getOption('wishlistItem'));
        this.deleteItems = $(this.getOption('deleteItem'));
        this.notification = $(this.getOption('notificationCheckbox'));
        this.items = this._loadItems() || [];
        this.products = $([]);
        this.addtoWishlistItems = $([]);

        this.refreshProducts();
    };

    Wishlist.prototype.refreshProducts = function () {
        this.products = $(this.getOption('listItem'));
        this.addtoWishlistItems = $(this.getOption('addtoWishlistItem'));
        this._refreshUI();
        this._bindEvents(this);
    };

    Wishlist.prototype._refreshUI = function () {
        var _this = this;
        $(this.items).each(function () {
            if (this.sku) {
                _this.products.filter('.' + this.sku.toLowerCase()).addClass('in-wishlist');
            }
        });
    };

    Wishlist.prototype.inWishlist = function (sku) {
        var found = $.grep(this.items, function (el) {
            return el.sku.toLowerCase() == sku.toLowerCase();
        });
        return found.length > 0;
    };

    /**
     * Load items from local storage
     *
     * If necessary, sync LS data with server
     *
     * @returns {Array}
     * @private
     */
    Wishlist.prototype._loadItems = function () {
        var _this = this;
        if (hasLocalStorage() && this.hash.length) {
            try {
                var key = _this.getStorageKey();
                var lastSync = parseInt(window.localStorage.getItem(key + ':last_sync')) || 0;
                var now = (new Date()).getTime();
                if (lastSync + _this.getOption('syncFrequency') < now) {
                    window.localStorage.setItem(key + ':last_sync', now);
                    _this._doRequest({}, 'GET', {
                        success: function (data) {
                            if (data && data.hasOwnProperty(_this.hash)) {
                                _this.items = data[_this.hash];
                                _this.save();
                                _this._refreshUI();
                            }
                        }
                    });
                }

                return JSON.parse(window.localStorage.getItem(key) || "[]");
            } catch (e) {
                // Unable to load data from LS
            }
        }
        return [];
    };

    /**
     * Get option
     *
     * @param {String} option
     * @returns {*}
     */
    Wishlist.prototype.getOption = function (option) {
        return this.options.hasOwnProperty(option) ? this.options[option] : '';
    };

    /**
     * Get LS key
     *
     * @returns {String}
     */
    Wishlist.prototype.getStorageKey = function () {
        return this.getOption('storageKey') + ':' + this.hash;
    };

    /**
     * Bind DOM events to internal actions
     *
     * @private
     */
    Wishlist.prototype._bindEvents = function () {
        var _this = this;
        var selected = _this.getOption('selectedOption');
        var selectedHover = _this.getOption('selectedHoverOption');

        this.notification.off('click');
        this.notification.on('click', function (e) {
            $.get(_this.getOption('urlConfig').notificationUrl);
        });

        this.deleteItems.off('click');
        this.deleteItems.on('click', function (e) {
            var requestData = $.extend({}, _this.getOption('defaultRequestData'));
            $.extend(requestData, $(e.delegateTarget).data('option'));
            $.extend(requestData, {_action: 'delete'});
            _this.removeItem(requestData);
        });

        this.products.off('click');
        this.products.on('click', _this.getOption('itemOption'), function (e) {
            $(_this.getOption('itemOption'), e.delegateTarget).removeClass(selected);
            $(e.currentTarget).addClass(selected);
            $(e.delegateTarget).removeClass(_this.getOption('noSizeSelected'));

            var btn = $(_this.getOption('wishlistButton'), e.delegateTarget);
            var addCartBtn = $(_this.getOption('cartButton'), e.delegateTarget);
            var data = $.extend({}, $(e.delegateTarget).data('product-info'), $(e.currentTarget).data('option'));
            var found = $.grep(_this.items, function (i) {
                return data.sku.toLowerCase() == i.sku.toLowerCase() && data.option_id == i.option_id;
            });
            if (!data.saleable) {
                addCartBtn.prop('disabled', true);
                addCartBtn.addClass('soldout disabled');
            } else {
                addCartBtn.prop('disabled', false);
                addCartBtn.removeClass('soldout disabled');
            }

            if (btn.data('added-text')) {
                $('span span', btn).text(found.length ? btn.data('added-text') : btn.data('add-text'));
            }
            btn.prop('disabled', !!found.length);
        });

        this.products.on('mouseover', _this.getOption('itemOption'), function (e) {
            $(e.currentTarget).addClass(selectedHover);
        });

        this.products.on('mouseout', _this.getOption('itemOption'), function (e) {
            $(e.currentTarget).removeClass(selectedHover);
        });

        this.products.on('click', _this.getOption('wishlistButton'), function (e) {
            var option = $('.' + selected, e.delegateTarget);
            if (option.length == 1) {
                var requestData = $.extend({}, _this.getOption('defaultRequestData'));
                $.extend(requestData, $(e.delegateTarget).data('product-info'));
                $.extend(requestData, option.data('option'));
                _this.addItem(requestData);
                $(e.delegateTarget).fadeOut(500);
            } else {
                $(e.delegateTarget).addClass(_this.getOption('noSizeSelected'));
            }
        });
        this.products.on('click', _this.getOption('cartButton'), function (e) {
            var option = $('.' + selected, e.delegateTarget);
            if (option.length == 1) {
                _this.addToCart(option.data('option'));
                $(e.delegateTarget).fadeOut(500);
            } else {
                $(e.delegateTarget).addClass(_this.getOption('noSizeSelected'));
            }
        });

        this.wishlistitems.off('click');
        this.wishlistitems.on('click', _this.getOption('cartButton'), function (e) {
            var option = $(e.delegateTarget);
            if (option.length == 1) {
                _this.addToCart(option.data('option'));
            }
        });

    };

    /**
     * Add item to wishlist
     *
     * @param {Object} data
     */
    Wishlist.prototype.addItem = function (data) {
        var _this = this;

        var afterAdd = function () {
            var added = false;
            $(_this.items).each(function () {
                if (this.sku == data.sku && this.option_id == data.option_id) {
                    $.extend(this, data);
                    added = true;
                }
            });

            if (!added) {
                _this.items.push(data);
            }

            _this.save();
            _this._refreshUI();
            _this._dispatchEvent('add', data);
        };

        _this._doRequest(data, 'POST', {
            success: afterAdd
        });
    };

    /**
     * Save data to LS
     *
     * @return {Boolean}
     */
    Wishlist.prototype.save = function () {
        if (hasLocalStorage()) {
            var key = this.getStorageKey();
            return window.localStorage.setItem(key, JSON.stringify(this.items));
        }
        return true;
    };

    /**
     * Remove item from wishlist
     *
     * @param {Object} data
     */
    Wishlist.prototype.removeItem = function (data) {
        var _this = this;
        var afterDelete = function () {
            _this.items = $.grep(_this.items, function (i) {
                return i.sku != data.sku && i.option_id != data.option_id;
            });
            _this.save();

            _this._dispatchEvent('delete', data);
            //window.location.href = _this.getOption('urlConfig').mywishlistUrl;
            window.location.href = window.location.href;
        };
        _this._doRequest(data, 'POST', {success: afterDelete});
    };

    Wishlist.prototype._renderTemplate = function (template, container, vars) {
        var myTemplate = $('#' + template).html() || '';
        $('#' + container).html(myTemplate.interpolate(vars));
    };

    /**
     * Notify action to subscribers
     *
     * @param {String} name
     * @param {Object} data
     */
    Wishlist.prototype._dispatchEvent = function (name, data) {
        $(document).trigger('mzentrale_wishlist:' + name, data);
    };

    /**
     * Send request to webservice
     *
     * @param {Object} data
     * @param {String} method
     * @param {Object} options
     * @private
     */
    Wishlist.prototype._doRequest = function (data, method, options) {
        var _this = this;
        var callWs = function (data, method, options) {
            data.hash = data.hash || _this.hash;
            data.customer_reference = data.reference || _this.reference;

            options = options || {};
            options.type = method || 'POST';
            options.data = options.type == 'GET' ? data : JSON.stringify(data);
            options.dataType = 'json';
            options.contentType = 'text/plain; charset=UTF-8';
            options.crossDomain = true;
            options.xhrFields = {withCredentials: true};
            $.ajax(_this.getOption('apiEndpoint'), options);
        };

        if (!data.hash && !_this.hash) {
            $.get(_this.getOption('urlConfig').pingUrl, function (hash) {
                _this.hash = hash;
                callWs(data, method, options);
            });
        } else {
            callWs(data, method, options);
        }
    };

    Wishlist.prototype.addToCart = function (data) {
        var _this = this;
        var options = {
            type: 'GET',
            data: {
                product: data.product_id,
                'super_attribute[142]': data.option_id
            }
        };

        $.ajax(this.getOption('urlConfig').addUrl, options).success(function (transport) {
            var response = transport.evalJSON();
            var vars = response.vars;
            _this._renderTemplate('template-product-info-clone', 'product-info-clone', vars);

            if (vars.stocklevel) {
                $('.stockleveltag').show();
            }

            mzoverlay.open('product-info-clone', {modal: true});
            if (response.error == 0) {
                $('#top-cart').replaceWith(response.topcart);
                Enterprise.TopCart.initialize('topCartContent');
            }
        });
    };

    module.Wishlist = Wishlist;
})(window.mzentrale, jQuery, window, document);
