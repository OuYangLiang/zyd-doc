;
var MobileOverlay = Class.create();
MobileOverlay.prototype = {
    cookie: 'myth_mobiletheme',
    html: '',
    localizations: {},
    defaultLocale: 'EN',

    initialize: function () {
        this.localizations = {'EN': {'welcome': 'Welcome to', 'choose': 'Please choose your settings:', 'gomobile': 'GO TO MOBILE SITE', 'permmobile': 'ALWAYS GO TO MOBILE SITE', 'classic': 'GO TO CLASSIC WEBSITE', 'permclassic': 'ALWAYS GO TO DESKTOP SITE'},
            'DE': {'welcome': 'Willkommen bei', 'choose': 'Bitte wählen Sie Ihre Darstellung:', 'gomobile': 'ZUR MOBILEN ANSICHT', 'permmobile': 'IMMER ZUR MOBILEN ANSICHT', 'classic': 'ZUR KLASSISCHEN ANSICHT', 'permclassic': 'IMMER ZUR DESKTOP ANSICHT'},
            'AR': {'welcome': 'Willkommen bei', 'choose': 'Bitte wählen Sie Ihre Darstellung:', 'gomobile': 'ZUR MOBILEN ANSICHT', 'permmobile': 'IMMER ZUR MOBILEN ANSICHT', 'classic': 'ZUR KLASSISCHEN ANSICHT', 'permclassic': 'IMMER ZUR DESKTOP ANSICHT'},
            'FR': {'welcome': 'Bienvenue sur', 'choose': 'Veuillez s`il vous plaît choisir vos paramètres', 'gomobile': 'VERSION MOBILE', 'permmobile': 'TOUJOURS VERSION MOBILE', 'classic': 'VERSION WEB', 'permclassic': 'TOUJOURS ACCÉDER À LA VERSION DESKTOP'},
            'IT': {'welcome': 'Benvenuto su', 'choose': 'Seleziona le impostazioni:', 'gomobile': 'VAI ALLA VERSIONE MOBILE', 'permmobile': 'VAI SEMPRE ALLA VERSIONE MOBILE', 'classic': 'VAI ALLA VERSIONE WEB', 'permclassic': 'VAI SEMPRE ALLA VERSIONE DESKTOP'}};
        this.html = '<div id="mytheresaiphone-overlay-content" style="width: 400px; height: auto;">' +
            '<span style="padding-top: 10px; display:table; margin: 0 auto;" id="mobilethemeoverlay-welcome">' + this.localizations[this.getDefaultLocale()]['welcome'] + '</span>' +
            '<a class="header-logo" style="display: block; margin: 5px auto; background:url(\'/skin/frontend/enterprise/mytheresa/images/custom/mytheresa_logo_mobile.png\') no-repeat 0 0; height:45px; width:147px;" href="#"></a>' +
            '<div class="langswitch" style="padding: 5px; text-align: center; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; margin: 15px 15px 10px 15px;">' +
            '<a id="seten" style="text-decoration: none; padding: 0 10px; cursor:pointer;">EN</a>|<a id="setde" style="text-decoration: none; padding: 0 10px; cursor:pointer;">DE</a>|' +
            '<a id="setit" style="text-decoration: none; padding: 0 10px; cursor:pointer;">IT</a>|<a id="setfr" style="text-decoration: none; padding: 0 10px; cursor:pointer;">FR</a>' +
            '</div>' +
            '<div class="world">' +
            '<h2 style="border: none; margin-bottom: 25px; font-size: 12px; color: #999; text-align: center; padding: 5px;" id="mobilethemeoverlay-choose">' + this.localizations[this.getDefaultLocale()]['choose'] + '</h2>' +
            '<div class="button">' +
            '<button id="mobilethemeoverlay-gomobile-button" class="button" style="cursor:pointer; padding: 10px 20px; margin: 10px auto; background: #9F2943 url(\'/skin/frontend/enterprise/mytheresa/images/arrow-right_white.png\') no-repeat 95%; background-size: 7px; width:100%; text-align: left; line-height: 25px; color: #ffffff !important; box-shadow: none; border: 0; font-size: 10px; height: auto; letter-spacing: 1px;" id="mzss-submitbutton"><span><span id="mobilethemeoverlay-gomobile">' + this.localizations[this.getDefaultLocale()]['gomobile'] + '</span></span></button>' +
            '</div>' +
            '<div class="button">' +
            '<button id="mobilethemeoverlay-permmobile-button" class="button" style="cursor:pointer; padding: 10px 20px; margin: 10px auto; background: #cccccc url(\'/skin/frontend/enterprise/mytheresa/images/arrow-right.png\') no-repeat 95%; background-size: 7px; width:100%; text-align: left; line-height: 25px; color: #000000 !important; box-shadow: none; border: 0; font-size: 10px; height: auto; letter-spacing: 1px;" id="mzss-submitbutton"><span><span id="mobilethemeoverlay-permmobile">' + this.localizations[this.getDefaultLocale()]['permmobile'] + '</span></span></button>' +
            '</div>' +
            '<div class="button">' +
            '<button id="mobilethemeoverlay-classic-button" class="button" style="cursor:pointer; padding: 10px 20px; margin: 10px auto; background: #cccccc url(\'/skin/frontend/enterprise/mytheresa/images/arrow-right.png\') no-repeat 95%; background-size: 7px; width:100%; text-align: left; line-height: 25px; color: #000000 !important; box-shadow: none; border: 0; font-size: 10px; height: auto; letter-spacing: 1px;" id="mzss-submitbutton"><span><span id="mobilethemeoverlay-classic">' + this.localizations[this.getDefaultLocale()]['classic'] + '</span></span></button>' +
            '</div>' +
            '<div class="button">' +
            '<button id="mobilethemeoverlay-permclassic-button" class="button" style="cursor:pointer; padding: 10px 20px; margin: 10px auto; background: #cccccc url(\'/skin/frontend/enterprise/mytheresa/images/arrow-right.png\') no-repeat 95%; background-size: 7px; width:100%; text-align: left; line-height: 25px; color: #000000 !important; box-shadow: none; border: 0; font-size: 10px; height: auto; letter-spacing: 1px;" id="mzss-submitbutton"><span><span id="mobilethemeoverlay-permclassic">' + this.localizations[this.getDefaultLocale()]['permclassic'] + '</span></span></button>' +
            '</div>' +
            '</div>' +
            '<div class="clearer"></div>' +
            '</div>';

        if (this.isRemoveCookieParameterSet()) {
            Mage.Cookies.set(this.cookie, 'classic');
        }
        if (this.isIPhone() && !this.hasCookie() && this.isParameterSet()) {
            this.openMobileLayer();
        } else if (this.isIPhone() && this.hasGoToMobileCookie()) {
            window.location.href = document.location.protocol + '//m.mytheresa.com' + window.location.pathname;
        }
    },
    openMobileLayer: function () {
        _gaq.push(['_trackEvent', 'M_Overall_Events', 'devicedetection', 'devicedetection_show', 1, true]);
        this.writeDom();
        this.bindEvents();
    },
    checkAndOpenMobileLayer: function () {
        if (this.isIPhone() && !this.hasCookie()) {
            this.openMobileLayer();
        }
    },
    isIPhone: function () {
        var deviceAgent = navigator.userAgent.toLowerCase();
        return deviceAgent.match(/(iphone)/);
    },
    hasCookie: function () {
        return !!Mage.Cookies.get(this.cookie);
    },
    hasGoToMobileCookie: function () {
        if (this.hasCookie()) {
            if (Mage.Cookies.get(this.cookie) == 'mobile') {
                return true;
            }
        }
        return false;
    },
    hasGoToClassicCookie: function () {
        if (this.hasCookie()) {
            if (Mage.Cookies.get(this.cookie) == 'classic') {
                return true;
            }
        }
        return false;
    },
    isParameterSet: function () {
        var qs = (function (a) {
            if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i) {
                var p = a[i].split('=');
                if (p.length != 2) continue;
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(window.location.search.substr(1).split('&'));
        if (qs['device_detection']) {
            return true;
        }
        return false;
    },
    isRemoveCookieParameterSet: function () {
        var qs = (function (a) {
            if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i) {
                var p = a[i].split('=');
                if (p.length != 2) continue;
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(window.location.search.substr(1).split('&'));
        if (qs['from_mobile']) {
            return true;
        }
        return false;
    },
    goToMobile: function () {
        _gaq.push(['_trackEvent', 'M_Overall_Events', 'devicedetection', 'devicedetection_choice_mobile', 1, true]);
        Mage.Cookies.set(this.cookie, 'mobile');
        mzoverlay.close();
        window.location.href = document.location.protocol + '//m.mytheresa.com' + window.location.pathname;
    },
    goToMobilePermanent: function () {
        _gaq.push(['_trackEvent', 'M_Overall_Events', 'devicedetection', 'devicedetection_choice_alwaysmobile', 1, true]);
        Mage.Cookies.set(this.cookie, 'mobile', new Date(new Date().getTime() + (90 * 24 * 60 * 60 * 1000)));
        mzoverlay.close();
        window.location.href = document.location.protocol + '//m.mytheresa.com' + window.location.pathname;
    },
    goToClassic: function () {
        _gaq.push(['_trackEvent', 'M_Overall_Events', 'devicedetection', 'devicedetection_choice_desktop', 1, true]);
        Mage.Cookies.set(this.cookie, 'classic');
        mzoverlay.close();
    },
    goToClassicPermanent: function () {
        _gaq.push(['_trackEvent', 'M_Overall_Events', 'devicedetection', 'devicedetection_choice_alwaysdesktop', 1, true]);
        Mage.Cookies.set(this.cookie, 'classic', new Date(new Date().getTime() + (90 * 24 * 60 * 60 * 1000)));
        mzoverlay.close();
    },
    getDefaultLocale: function () {
        var countryCookie = Mage.Cookies.get('myth_country');
        var localization = [];
        if (countryCookie) {
            localization = countryCookie.split('|');
            if (localization.length) {
                var cookieLanguage = String(localization[3]);
                if (cookieLanguage && cookieLanguage != 'undefined') {
                    return String(localization[3]).toUpperCase();
                }
            }
        }
        var path = window.location.pathname.split('/');
        if (path[1]) {
            var urlLocalization = String(path[1]);
            if (urlLocalization.indexOf('-') >= 0) {
                var parts = urlLocalization.split('-');
            } else if (urlLocalization.indexOf('_') >= 0) {
                var tmpParts = urlLocalization.split('_');
                var parts = [tmpParts[1], tmpParts[0]];
            }
            return String(parts[0]).toUpperCase();
        }
        return this.defaultLocale;
    },

    localize: function (locale) {
        var regions = ['welcome', 'choose', 'gomobile', 'permmobile', 'classic', 'permclassic'];
        for (var i = 0; i < regions.length; i++) {
            var region = regions[i];
            var element = $('mobilethemeoverlay-' + region);
            if (element) element.update(this.localizations[locale][region]);
        }
    },

    writeDom: function () {
        $(document.body).insert({ bottom: this.html });
        if (mzoverlay) mzoverlay.open('mytheresaiphone-overlay-content', { modal: false});
    },

    bindEvents: function () {
        var self = this;
        var overlay = $('mytheresaiphone-overlay-content');
        if (!overlay) return;

        overlay.on('click', '.langswitch a', function (event, element) {
            var lang = element.id.replace('set', '').toUpperCase();
            if (lang) self.localize(lang);
        });

        overlay.on('click', 'button.button', function (event, element) {
            switch (element.id) {
                case 'mobilethemeoverlay-gomobile-button':
                    self.goToMobile();
                    break;
                case 'mobilethemeoverlay-permmobile-button':
                    self.goToMobilePermanent();
                    break;
                case 'mobilethemeoverlay-classic-button':
                    self.goToClassic();
                    break;
                case 'mobilethemeoverlay-permclassic-button':
                    self.goToClassicPermanent();
                    break;
            }
        });
    }
}
