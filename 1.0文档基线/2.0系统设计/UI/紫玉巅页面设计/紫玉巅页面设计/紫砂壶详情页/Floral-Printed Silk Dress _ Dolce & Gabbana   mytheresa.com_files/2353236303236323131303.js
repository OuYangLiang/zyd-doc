
var ia_cl="2353236303236323131303";

var ia_bmcl="8353835313236323131303";

var ia_tr2dmn="t23.intelliad.de";

var ia_tld2u="";

var __ia_brand_kws = new Array("mytheresa", "mytheresa.com", "theresa", "");

var skip_rest = false;

var skip_seo = false;

var skip_ti = false;

var skip_ref = false;

//static part below




var ia_seo_only = false;

function __op_click_px(__script, __sb_keys, __sb_vals, __ptype, __bounce_only, tld4cookie) {
    var ia_rand = Math.floor(Math.random()*11111139435231);
    var _is_ssl = 0;
    var _skip_client = 0;

    if (document.location.protocol=='https:') {
        var _is_ssl = 1;
        var __ia_px = 'https://' + ia_tr2dmn + __script + '?rand=' + ia_rand;
    } else {
        var __ia_px = 'http://' + ia_tr2dmn + __script + '?rand=' + ia_rand;
    }
    //for (__ia_x in __sb_keys) {
    for (var __ia_x = 0; __ia_x < __sb_keys.length; __ia_x++) {
        __ia_px += '&' + __sb_keys[__ia_x] + '=' + __sb_vals[__ia_x];
       if (__sb_keys[__ia_x] == 'cl' && (__sb_vals[__ia_x] == '0' || __sb_vals[__ia_x] == 0 || __sb_vals[__ia_x] == '')) {
           _skip_client = 1;
       }
    }

    // set cookie for identifying 2x clicks
    __set_cookie('ia_c4dc_' + __sb_vals[0], '1', 1800, tld4cookie);
    __set_cookie('ia_u4pc_' + __sb_vals[0], '1', 864000, tld4cookie);

    if (_skip_client == 1 || __bounce_only == true) {
        // TO NOTHING -> NECK SEO !!!!
    } else {
        __ia_is_ie7_askjeu = (navigator.appVersion.indexOf("MSIE 7.") == -1) ? false : true;
        if (__ia_is_ie7_askjeu == false) {
            __ia_is_ie7_askjeu = (navigator.appVersion.indexOf("MSIE 6.") == -1) ? false : true;
        }

        if (__sb_keys[0] == 'cl' && (__sb_vals[0] == '2313433313236323131303' || __sb_vals[0] == '0373330323236323131303')) {
            if (document.body == null || __ia_is_ie7_askjeu == true) {
                document.write('<sc'+'ript src="' + __ia_px + '&rt=js"></sc'+'ript>');
            } else {
                var sct_tag = document.createElement('script');
                sct_tag.src = __ia_px + '&rt=js';
                document.body.appendChild(sct_tag);
            }
        } else {
            if (document.body == null || __ia_is_ie7_askjeu == true) {
                document.write('<img src="' + __ia_px + '" width="1" height="1" alt="" />');
            } else {
                var img_tag = document.createElement('img');
                img_tag.src = __ia_px;
                img_tag.width = 1;
                img_tag.height = 1;
                img_tag.alt = '';

                document.body.appendChild(img_tag);
            }
        }
    }
}

function __set_cookie(c_name, value, expires, tld4cookie) {
    var today = new Date();
    today.setTime(today.getTime());

    var expires_date = new Date(today.getTime() + (expires * 1000));
    if (typeof(tld4cookie) != "undefined" && document.location && document.location.host && document.location.host.indexOf(tld4cookie) != "-1") {
        document.cookie = c_name + "=" + escape(value) + "; path=/; domain=" + tld4cookie + " ; expires=" + expires_date.toGMTString();
    } else {
        document.cookie = c_name + "=" + escape(value) + "; path=/; expires=" + expires_date.toGMTString();
    }
}

function __get_cookie(c_name) {
    if (document.cookie.length>0) {
        c_start=document.cookie.indexOf(c_name + "=");
        if (c_start!=-1) {
            c_start=c_start + c_name.length+1;
            c_end=document.cookie.indexOf(";",c_start);
           if (c_end==-1) c_end=document.cookie.length;
           return unescape(document.cookie.substring(c_start,c_end));
        }
    }
    return 0;
}

function __read_write_u_session(boclid, tld4cookie) {
    var _string_hashing,
        _px_url,
        s = (document.location.protocol == 'https:') ? 's' : '';

    _session_lifetime = 300;
    _cookie_name = 'ia_bncl_' + boclid;
    _split_char = ' ';
    _raw_cookie_data = __get_cookie(_cookie_name);

    var __ia_is_ie7_askjeu = (navigator.appVersion.indexOf("MSIE 7.") == -1) ? false : true;
    if (__ia_is_ie7_askjeu == false) {
        __ia_is_ie7_askjeu = (navigator.appVersion.indexOf("MSIE 6.") == -1) ? false : true;
    }

    _string_hashing = function(str) {
        var hash = 0, i, char;

        if (!str || typeof str != 'string') {
            return hash;
        }

        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // convert to 32bit integer
        }

        return Math.abs(hash); // return always positive number
    };

    function _insert_pixel(src, type) {
        // cookie matching pixel should be placed only once
        var _pixel_id = type + '-0';

        if (document && document.body && document.location)
        {
            _pixel_id = type + '-' + _string_hashing(window.location.host + window.location.pathname);
        }

        if (document.getElementById(_pixel_id) == null) {
            if (document.body == null || __ia_is_ie7_askjeu == true) {
                document.write('<img id="' + _pixel_id + '" src="' + src + '" width="1" height="1" alt="" />');
            } else {
                var img_tag = document.createElement('img');
                img_tag.id = _pixel_id;
                img_tag.src = src;
                img_tag.width = 1;
                img_tag.height = 1;
                img_tag.alt = '';
                document.body.appendChild(img_tag);
            }
        }
    }

    // either cookie is empty or we don't have a referrer
    if (_raw_cookie_data == 0 || !document.referrer || document.referrer.indexOf( 'www.google' ) != -1) {
        //this is the data
        _session_id = Math.random();
        _first_click_time = Math.round((new Date()).getTime() / 1000);
        _last_click_time = Math.round((new Date()).getTime() / 1000);
        _num_session_clicks = 1;
        _chain_secs = 0;

        __dccm_px = 'http'+(document.location.protocol=='https:'?'s':'') +
                    '://cm.g.doubleclick.net/pixel' +
                    '?google_nid=intelliad&google_sc' +
                    '&google_ula=1125454&google_ula=1125334&google_ula=1122694&google_ula=1122454&google_ula=773134';

        // blacklist - adx
        if (typeof ia_rtb_cm_pixels == 'undefined' ||
            !ia_rtb_cm_pixels.blacklist ||
            ia_rtb_cm_pixels.blacklist.indexOf('google') == -1
        ) {
            // our cm hosting matching
            _insert_pixel(
                __dccm_px + '&google_cm&cl=' + boclid,
                'google-cm'
            );

            // hosted match table
            _insert_pixel(
                'http' + s + '://' + ia_tr2dmn + '/icm.php?ia_uc=feea97f4ebbcc74bdfe2bef03357a088' +
                '&cl=' + boclid + '&ia_ru=' + escape(__dccm_px + '&google_hm=[[BASE64_UID]]'),
                'google-hm'
            );
        }

        // whitelist
        if (typeof ia_rtb_cm_pixels != 'undefined' && ia_rtb_cm_pixels.whitelist) {

            // improve
            if (ia_rtb_cm_pixels.whitelist.indexOf('improve') != -1) {
                _insert_pixel(
                    'http' + s + '://' + ia_tr2dmn + '/icm.php?ia_uc=feea97f4ebbcc74bdfe2bef03357a088' +
                    '&cl=' + boclid + '&ia_ru=' +
                    encodeURIComponent(
                        'http' + s + '://ad.360yield.com/match?publisher_dsp_id=189&external_user_id=[[UID]]&dsp_callback=1'
                    ),
                    'improve'
                );
            }

            // appnexus
            if (ia_rtb_cm_pixels.whitelist.indexOf('appnexus') != -1) {
                // uses different hosts for http and https
                if (s == 's') {
                    _px_url = 'http' + s + '://' + ia_tr2dmn + '/icm.php?ia_uc=feea97f4ebbcc74bdfe2bef03357a088' +
                        '&cl=' + boclid + '&ia_ru=' +
                        escape('http' + s + '://secure.adnxs.com/setuid?entity=202&seg=1529077&code=[[UID]]');
                } else {
                    _px_url = 'http' + s + '://' + ia_tr2dmn + '/icm.php?ia_uc=feea97f4ebbcc74bdfe2bef03357a088' +
                        '&cl=' + boclid + '&ia_ru=' +
                        escape('http' + s + '://ib.adnxs.com/setuid?entity=202&seg=1529077&code=[[UID]]');
                }

                _insert_pixel(
                    _px_url,
                    'appnexus'
                );
            }

            // yieldlab
            if (ia_rtb_cm_pixels.whitelist.indexOf('yieldlab') != -1) {
                _insert_pixel(
                    'http' + s + '://' + ia_tr2dmn + '/icm.php?ia_uc=feea97f4ebbcc74bdfe2bef03357a088' +
                    '&cl=' + boclid + '&ia_ylm=1&ia_ru=' +
                    escape('http' + s + '://ad.yieldlab.net/m?dt_id=36146&ext_id=[[UID]]'),
                    'yieldlab'
                );
            }

            // nuggad
            if (ia_rtb_cm_pixels.whitelist.indexOf('nuggad') != -1) {
                _insert_pixel(
                    'http' + s + '://' + ia_tr2dmn + '/icm.php?ia_uc=feea97f4ebbcc74bdfe2bef03357a088' +
                    '&ia_ru=%2F%2Fia-sync.nuggad.net%2Fsyncuid%3Fdpid%3D1589%26uid%3D[[UID]]',
                    'nuggad'
                );
            }

            // rubicon
            if (ia_rtb_cm_pixels.whitelist.indexOf('rubicon') != -1) {
                _insert_pixel(
                    'http' + s + '://' + ia_tr2dmn + '/gcm.php?dmp_id=2' + '&dmp_uid=IA_UID' +
                    '&redirect=' + escape('http' + s + '://pixel.rubiconproject.com/tap.php?v=44898&nid=2715&put=[[UID]]') +
                    '&diar=1&cl=' + boclid,
                    'rubicon'
                );
            }

            // adscale
            if (ia_rtb_cm_pixels.whitelist.indexOf('adscale') != -1) {
                _insert_pixel(
                    'http' + s + '://' + ia_tr2dmn + '/icm.php?ia_uc=feea97f4ebbcc74bdfe2bef03357a088&' +
                    'ia_ru=%2F%2Fih.adscale.de%2Fadscale-ih%2Ftpui%3Ftpid%3D59%26tpuid%3D[[UID]]' +
                    '%26cburl%3D%252F%252F' + ia_tr2dmn + '%252Fgcm.php' +
                    '%253Fdmp_id%253D3%2526cl%253D' + boclid + '%2526dmp_uid%253D__ADSCALE_USER_ID__',
                    'adscale'
                );
            }

        }

    } else {
        _cookie_data = _raw_cookie_data.split(_split_char);
        _session_id = _cookie_data[0];
        _first_click_time = _cookie_data[1];
        _last_click_time = Math.round((new Date()).getTime() / 1000);
        _num_session_clicks = (parseInt(_cookie_data[3]) + 1);
        _chain_secs = (parseInt(_last_click_time) - parseInt(_first_click_time));

        // todo execute call to server
        __bc_px = 'http'+(document.location.protocol=='https:'?'s':'') +
                  '://' + ia_tr2dmn + '/bnc.php' +
                  '?cl=' + boclid +
                  '&sid=' + _session_id +
                  '&fct=' + _first_click_time +
                  '&lct=' + _last_click_time +
                  '&nsc='  + _num_session_clicks +
                  '&cls=' + _chain_secs +
                  '&rand=' + Math.floor(Math.random()*11111139435231);
        if (typeof(ia_pi) != 'undefined') {
            __bc_px += '&pi=' + encodeURIComponent(String(ia_pi).split('|', 8).join('|'));
        }

        if (boclid == '2313433313236323131303' || boclid == '0373330323236323131303') {
            if (document.body == null || __ia_is_ie7_askjeu == true) {
                document.write('<sc'+'ript src="' + __bc_px + '&rt=js"></sc'+'ript>');
            } else {
                var sct_tag_bnc = document.createElement('script');
                sct_tag_bnc.src = __bc_px + '&rt=js';
                document.body.appendChild(sct_tag_bnc);
            }
        }
        else {
            _insert_pixel(__bc_px);
        }
    }
    _cookie_string = _session_id +
                     _split_char +
                     _first_click_time +
                     _split_char +
                     _last_click_time +
                     _split_char +
                     _num_session_clicks +
                     _split_char +
                     _chain_secs;

    __set_cookie(_cookie_name, _cookie_string, _session_lifetime, tld4cookie);
}

function setPm (conf_pm)
{
    if (!window.location.search
        || !conf_pm['default']['ia_tc']['param']
        || !conf_pm['default']['ia_tc']['param'].length)
    {
        return;
    }

    var dl_params = {};
    var dl_parts = window.location.search.substring(1).split('&');
    for (var i = 0; i < dl_parts.length; i++) {
        var kv = dl_parts[i].split('=');
        dl_params[decodeURI(kv[0])] = decodeURI(kv[1]);
    }

    var foundCp = false;
    var paComb = ['ia_tc', 'ia_sc', 'ia_kw'];
    var iaMap = {};
    for (var paPos = 0, paLen = paComb.length; paPos < paLen; paPos++)
    {
        for (var coPos = 0, coLen = conf_pm['default'][paComb[paPos]]['param'].length; coPos < coLen; coPos++)
        {
            var dl_key = conf_pm['default'][paComb[paPos]]['param'][coPos];
            if (dl_params.hasOwnProperty(dl_key)
                && (dl_params[dl_key] !== null))
            {
                if (paComb[paPos] == 'ia_tc') {
                    foundCp = true;
                }
                iaMap[paComb[paPos]] = dl_key;
                window[paComb[paPos]] = dl_params[dl_key];
                break;
            }
        }
        if (!foundCp) {
            return;
        }
    }
    ia_bmcl = conf_pm['default']['ia_bmcl'];
    ia_bm = 100;
    ia_sc = (ia_sc != '') ? ia_sc : 'default';

    for (var conNum in conf_pm['conditions']) {
        var currCon = conf_pm['conditions'][conNum];
        for (var checkParm in currCon['con']) {
            var allConMet = true;
            var checkParmCon = currCon['con'][checkParm];
            if (typeof checkParmCon === 'string') {
                checkParmCon = {
                    'val': checkParmCon,
                    'src': ''
                };
            }

            if (!(new RegExp('^'+checkParmCon['val']+'$')).test(window[checkParm])
                || (checkParmCon.src
                    && iaMap[checkParm]
                    && checkParmCon.src != iaMap[checkParm]))
            {
                allConMet = false;
                break;
            }
        }

        if (!allConMet) {
            continue;
        }

        for (var setParm in currCon['res']) {
            var setParmMap = currCon['res'][setParm];
            if (!setParmMap) {
                break;
            }

            if (setParmMap['value']) {
                window[setParm] = setParmMap['value'];
            } else if (setParmMap['param']
                       && dl_params[setParmMap['param']])
            {
                window[setParm] = dl_params[setParmMap['param']];
            }
        }
        break;
    }
}

// DON'T CHANGE ANYTHING BELOW THIS LINE !!!
var ia_sq = "";
var ia_ios = 0;
var ia_bm = 10;
var ia_sb = 1;
var ia_pos = 0;
var ia_cp = "";
var ia_ag = "";
var ia_crid = 100;
var ia_ucrid = 0;
var ia_subid = "";
var ia_kw = "";
var ptype = false;
var referring_domain = "";
var has_pmtrack_param = 0;
var has_pkpmtrack_param = 0;
var submit_urlm = 0;
var is_aclk = 0;
var ia_tc_orig = "";
var ia_sc_orig = "";
var ia_bmcl_overwritten = false;

if (typeof(ia_bmcl) == "undefined") {
    var ia_bmcl = "8353835313236323131303";
} else if (ia_bmcl == "5393835313236323131303") {
    ia_bmcl = "8353835313236323131303";
}
if (typeof(bounce_only) == "undefined") {
    var bounce_only = false;
}
if (typeof(skip_rest) == "undefined") {
    var skip_rest = false;
}
if (typeof(skip_seo) == "undefined") {
    var skip_seo = false;
}
if (typeof(skip_ti) == "undefined") {
    var skip_ti = false;
}
if (typeof(skip_ref) == "undefined") {
    var skip_ref = false;
}
if (typeof(ia_tld2u) == "undefined") {
    var ia_tld2u="";
}
if (typeof(ia_tc) != "undefined") {
    var ia_tc_orig = ia_tc;
}
if (typeof(ia_sc) != "undefined") {
    var ia_sc_orig = ia_sc;
}



// check for bounce only
if (typeof(ia_bounce_only) != "undefined" && (ia_bounce_only == 1 || ia_bounce_only == "1")) {
    bounce_only = true;
}

if (typeof(ia_seo_only) != "undefined" && (ia_seo_only == 1 || ia_seo_only == "1")) {
    skip_rest = true;
    skip_ti = true;
    skip_ref = true;
}


if (typeof(ia_cl) == "undefined") {
  ia_cl = 0;
} else {
    if (bounce_only == true || true) {
        if (ia_cl != '4393932313236323131303') {
            __read_write_u_session(ia_cl, ia_tld2u);
        }
    }
}

if ((undefined != document.location.search && document.location.search != "") || (undefined != window.location.hash && window.location.hash != "")) {
    var url_match = /(\?|&)ia-pmtrack=([^&]*)/;

    if (undefined != document.location.search && document.location.search != "") {
        var regs_pmtrack = url_match.exec(document.location.search);
    }

    if (regs_pmtrack == null && undefined != window.location.hash && window.location.hash != "") {
        var url_match_hash = /(\#|&)ia-pmtrack=([^&]*)/;
        var regs_pmtrack = url_match_hash.exec(window.location.hash);
    }

    if (regs_pmtrack != null) {
        has_pmtrack_param = 1;

        ptype = "urlm-unique";

        ia_ucrid = regs_pmtrack[2];
        ia_subid = "";

        var url_match = /(\?|&)ia-subid=([^&]*)/;
        if (undefined != document.location.search && document.location.search != "") {
            var regs_subid = url_match.exec(document.location.search);
        }
        if (regs_subid == null && undefined != window.location.hash && window.location.hash != "") {
            var url_match_hash = /(\#|&)ia-subid=([^&]*)/;
            var regs_subid = url_match_hash.exec(window.location.hash);
        }

        if (regs_subid != null) {
            ia_subid = regs_subid[2];
        }

        var url_match = /(\?|&)ia-subidag=([^&]*)/;
        if (undefined != document.location.search && document.location.search != "") {
            var regs_subidag = url_match.exec(document.location.search);
        }
        if (regs_subidag == null && undefined != window.location.hash && window.location.hash != "") {
            var url_match_hash = /(\#|&)ia-subidag=([^&]*)/;
            var regs_subidag = url_match_hash.exec(window.location.hash);
        }

        if (regs_subidag != null) {
            ia_subid = ia_subid + '|||' + regs_subidag[2];
        }
    }

    var url_match = /(\?|&)ia-pkpmtrack=([^&]*)/;
    var regs_pkpmtrack = null;
    if (undefined != document.location.search && document.location.search != "") {
        var regs_pkpmtrack = url_match.exec(document.location.search);
    }

    if (regs_pkpmtrack == null && undefined != window.location.hash && window.location.hash != "") {
        var url_match_hash = /(\#|&)ia-pkpmtrack=([^&]*)/;
        var regs_pkpmtrack = url_match_hash.exec(window.location.hash);
    }

    if (regs_pkpmtrack != null) {
        pkpmtrack_parts = regs_pkpmtrack[2].split('-');

        if (pkpmtrack_parts.length == 5) {
            has_pkpmtrack_param = 1;
            ia_bmcl_overwritten = true;
            ptype = "urlm";
            submit_urlm = 1;

            ia_bm = pkpmtrack_parts[0];
            ia_bmcl = pkpmtrack_parts[1];
            ia_cp = pkpmtrack_parts[2];
            ia_ag = pkpmtrack_parts[3];
            ia_crid = pkpmtrack_parts[4];
        }
    }
}


if (has_pmtrack_param == 0 && has_pkpmtrack_param == 0 && ia_cl == '4393932313236323131303' && document.referrer && document.referrer.indexOf( 'www.google' ) != -1) {
    url_match_pmtrack = /ia-pmtrack=([0-9]+)/;
    var regs_pmtrack2 = url_match_pmtrack.exec(document.referrer);
    if (null == regs_pmtrack2) {
        url_match_pmtrack = /ia-pmtrack%3D([0-9]+)/;
        regs_pmtrack2 = url_match_pmtrack.exec(document.referrer);
    }

    if (regs_pmtrack2 != null) {
        ptype = "urlm-unique";

        ia_ucrid = regs_pmtrack2[1];
        ia_pm_track = ia_ucrid;
        has_pmtrack_param = 1;

        ia_subid = "";
    }
}



if (typeof(ia_pm_track) != 'undefined' && ia_pm_track != "") {
    has_pmtrack_param = 1;
    ptype = "urlm-unique";
    ia_ucrid = ia_pm_track;
    ia_subid = "";

    if (typeof(ia_pm_subid) != 'undefined' && ia_pm_subid != "") {
        ia_subid = ia_pm_subid;
    }
} else if(document.referrer) {
    var referring_domain_match = /^[a-z]+:\/\/([^\/]+|[^$]+)/;
    var ref_match = referring_domain_match.exec(document.referrer);
    if (ref_match != null) {
        referring_domain = ref_match[1];
    }

    doc_loc_match = new RegExp('^http[s]?:\/\/' + document.location.hostname, 'i');
    doc_loc_regs = doc_loc_match.exec(document.referrer);

    ref_ios_match = new RegExp('^http[s]?:\/\/(?:[a-z]+\.)?google(?:\.com|\.co)?\.[a-z]+(?:[\/\?&]|$)', 'i');
    ref_ios_regs = ref_ios_match.exec(document.referrer);

    if (referring_domain != "" && document.location.hostname.indexOf(referring_domain) != -1 && has_pmtrack_param == 0 && has_pkpmtrack_param == 0) {
        ptype = "view";
    } else if (doc_loc_regs != null && has_pmtrack_param == 0 && has_pkpmtrack_param == 0) {
        ptype = "view";
    } else if(ref_ios_regs != null && has_pmtrack_param == 0 && has_pkpmtrack_param == 0) {
        ia_ios = 1;
        ptype = "ios";

        var url_match = /(?:[\?&])(?:q|as_q)=([^&]*)/i;
        var regs = url_match.exec(document.referrer);
        if(regs != null && regs[1] != null && regs[1] != '') {
            ia_sq = regs[1];
        }

        if (ia_sq == '' && (typeof window.location.hash !== "undefined") && window.location.hash != "")
        {
            var url_match_hash = /(?:[#&])(?:q|as_q)=([^&]*)/i;
            var regs = url_match_hash.exec(window.location.hash);
            if(regs != null && regs[1] != null && regs[1] != '') {
                ia_sq = regs[1];
            }
        }

        var url_match = /([\?&])source=([^&]*)/i;
        var regs2 = url_match.exec(document.referrer);
        if(regs2 != null && (regs2[2] == 'web'))
        {
            var url_match = /([\?&])cd=([^&]*)/i;
            var regs3 = url_match.exec(document.referrer);
            if (regs3 != null) {
                ia_pos = regs3[2];
            }
        }

        var url_match = /([\?&])oi=([^&]*).*(&)resnum=([^&]*)/i;
        var regs = url_match.exec(document.referrer);
        if (regs != null) {
            if (regs[4] != null && regs[4] != "") {
                ia_pos = regs[4];
            }
        }

        var url_match = /([\?&])url=([^&]*)/i;
        var regs = url_match.exec(document.referrer);
        if (regs != null && regs[2] != null && regs[2] != "") {
            var url_match_aclk = /^\/(aclk).*http.*$/i;
            var regs_aclk = url_match_aclk.exec(regs[2]);
            if (regs_aclk != null && regs_aclk[1] == "aclk") {
                ia_ios = 0;
                is_aclk = 1;
            }
        }

        var url_match = /^.*(google(?:\.com|\.co)?\.[a-z]+)\/(aclk)\?.*$/i;
        var regs = url_match.exec(document.referrer);
        if (regs != null && regs[2] != null && regs[2] == 'aclk') {
            ia_ios = 0;
            is_aclk = 1;
        }

        var url_match = /(googleads).g.(doubleclick).net/i;
        var regs = url_match.exec(document.referrer);
        if (regs != null && regs[2] != null) {
            ia_ios = 0;
            is_aclk = 1;
        }

        var url_match = /^.*(google(?:\.com|\.co)?\.[a-z]+)\/uds\/(afs)\?.*$/i;
        var regs = url_match.exec(document.referrer);
        if (regs != null && regs[2] != null && regs[2] == 'afs') {
            ia_ios = 0;
            is_aclk = 1;
        }

        var url_param = /([\?&])adurl=([^&]*)/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[2] != "") {
            ia_ios = 0;
            is_aclk = 1;
        }

        // check for adword parameter
        var url_param = /([\?&])adword=([^&]*)/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[2] != "") {
            ia_ios = 0;
            is_aclk = 1;
        }

        // base
        var url_param = /google(?:\.com|\.co)?\.([a-z]+)\/(products)\/catalog/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[2] != "") {
            ptype = "ref";
            ia_ios = 0;
        }

        // base
        var url_param = /google(?:\.com|\.co)?\.([a-z]+)\/(products)\?/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[2] != "") {
            ptype = "ref";
            ia_ios = 0;
        }

        // base
        var url_param = /([\?&])source=productsearch([^&]*)/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[2] != "") {
            ptype = "ref";
            ia_ios = 0;
        }

        // base
        var url_param = /google(?:\.com|\.co)?\.([a-z]+)\/search.*&(tbm=shop)&/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[2] != "") {
            ptype = "ref";
            ia_ios = 0;
        }

        // pages
        var url_param = /(docs)\.google(?:\.com|\.co)?\.([a-z]+)/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[1] != "" && ia_ios == 1) {
            ptype = "ref";
            ia_ios = 0;
        }

        var url_param = /(maps)\.google(?:\.com|\.co)?\.([a-z]+)/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[1] != "" && ia_ios == 1) {
            ptype = "ref";
            ia_ios = 0;
        }

        var url_param = /(images)\.google(?:\.com|\.co)?\.([a-z]+)/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[1] != "" && ia_ios == 1) {
            ptype = "ref";
            ia_ios = 0;
        }

        var url_param = /http[s]?:\/\/([a-z]+\.)?google(?:\.com|\.co)?\.([a-z]+)\/imgres\?/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[2] != "" && ia_ios == 1) {
            ptype = "ref";
            ia_ios = 0;
        }

        var url_param = /([a-z]+)\.google(?:\.com|\.co)?\.([a-z]+)/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[1] != "www" && regs[2] != "www" && ia_ios == 1) {
            ptype = "ref";
            ia_ios = 0;
        }

        var url_param = /google(?:\.com|\.co)?\.([a-z]+)\/(cse)\?/i;
        var regs = url_param.exec(document.referrer);
        if (regs != null && regs[2] != "") {
            ptype = "ref";
            ia_ios = 0;
        }

        var url_param = /([\?&])gclid=([^&]*)/i;
        var regs = url_param.exec(window.location.href);
        if (regs != null && regs[2] != "") {
            ia_ios = 0;
        }

        if (ia_ios == 1) {
            var url_match = /([\?&])cd=([^&]*)/i;
            var regs3 = url_match.exec(document.referrer);
            if (regs3 != null) {
              ia_pos = regs3[2];
            }

            if (is_aclk == 0 && ia_sq == '') {
                var url_match_seo = /^http[s]?:\/\/([a-z]+\.)?google(?:\.com|\.co)?\.([a-z]+)[\/]+url\?/i;
                var regs_seo = url_match_seo.exec(document.referrer);

                if (regs_seo != null && regs_seo[2] != "" && ia_ios == 1) {
                    ia_sq = '(not provided)';
                } else {
                    var url_match = /^http[s]?:\/\/([a-z]+\.)?google(?:\.com|\.co)?\.([a-z]+)[\/]?/i;
                    var regs = url_match.exec(document.referrer);
                    if (regs != null && regs[2] != "") {
                        ptype = "ref";
                        ia_ios = 0;
                    }
                }
            }
        }
    } else if ((undefined != document.location.search && document.location.search != "") || (undefined != window.location.hash && window.location.hash != "")) {
        var url_match = /(\?|&)ia-pmtrack=([^&]*)/;

        if (undefined != document.location.search && document.location.search != "") {
            var regs_pk = url_match.exec(document.location.search);
        }

        if (regs_pk == null && undefined != window.location.hash && window.location.hash != "") {
            var url_match_hash = /(\#|&)ia-pmtrack=([^&]*)/;
            var regs_pk = url_match_hash.exec(window.location.hash);
        }

        if (regs_pk != null) {
            //document.write("test");
            ptype = "urlm-unique";
            ia_ucrid = regs_pk[2];
            ia_subid = "";

            var url_match = /(\?|&)ia-subid=([^&]*)/;
            if (undefined != document.location.search && document.location.search != "") {
                var regs_subid = url_match.exec(document.location.search);
            }
            if (regs_subid == null && undefined != window.location.hash && window.location.hash != "") {
                var url_match_hash = /(\#|&)ia-subid=([^&]*)/;
                var regs_subid = url_match_hash.exec(window.location.hash);
            }

            if (regs_subid != null) {
                ia_subid = regs_subid[2];
            }

            var url_match = /(\?|&)ia-subidag=([^&]*)/;
            if (undefined != document.location.search && document.location.search != "") {
                var regs_subidag = url_match.exec(document.location.search);
            }
            if (regs_subidag == null && undefined != window.location.hash && window.location.hash != "") {
                var url_match_hash = /(\#|&)ia-subidag=([^&]*)/;
                var regs_subidag = url_match_hash.exec(window.location.hash);
            }

            if (regs_subidag != null) {
                ia_subid = ia_subid + '|||' + regs_subidag[2];
            }
        } else {
            var url_match = /(\?|&)intelliad_pk=([^&]*)/;
            if (undefined != document.location.search && document.location.search != "") {
                var regs2 = url_match.exec(document.location.search);
            }
            if (regs2 == null && undefined != window.location.hash && window.location.hash != "") {
                var url_match_hash = /(\#|&)intelliad_pk=([^&]*)/;
                var regs2 = url_match_hash.exec(window.location.hash);
            }

            var has_pk = 0;
            ptype = "urlm";

            if (regs2 != null) {

                parts = regs2[2].split("|");

                if (parts.length >= 5) {
                    if (parts[0] != undefined) {
                        ia_cl = parts[0];
                    }
                    if (parts[1] != undefined) {
                        ia_bmcl_overwritten = true;
                        ia_bmcl = parts[1];
                    }
                    if (parts[2] != undefined) {
                        ia_bm = parts[2];
                    }
                    if (parts[3] != undefined) {
                        ia_cp = parts[3];
                    }
                    if (parts[4] != undefined) {
                        ia_ag = parts[4];
                    }
                    if (parts[5] != undefined) {
                        ia_crid = parts[5];
                    }
                    has_pk = 1;
                }
            }
            if (has_pk == 1) {
                submit_urlm = 1;
                var url_match = /(\?|&)intelliad_subid=([^&]*)/;
                var regs2 = url_match.exec(document.location.search);
                if (regs2 != null) {
                    ia_kw = regs2[2];
                    // unset criterionId FME
                    ia_crid = "";
                } else {
                    ia_crid = 100;
                }
            } else {
                if (ptype != "urlm") {
                    ptype = "";
                } else {
                    if (has_pmtrack_param == 0 && has_pkpmtrack_param == 0) {
                        ptype = false;
                    }
                }
            }
        }
    }

    // nothing matching ==> referrer
    if (ptype == false || ptype == "ref") {
        ptype = "ref";
        ia_tc = "default";
        ia_sc = "default";
        var url_match = /^http[s]?:\/\/([^\/]+)([\/]?[^\?]*)/;

        var regs2 = url_match.exec(document.referrer);
        if (regs2 != null) {
            if (regs2[1] != undefined && regs2[1] != "") {
                ia_tc = regs2[1];
            }
            if (regs2[2] != undefined && regs2[2] != "") {
                ia_sc = regs2[2];
            }
        }

        if (ia_tc == "www.bing.com" || ia_tc == "suche.t-online.de" || ia_tc == "www.bing.de" || ia_tc == "search.icq.com" || ia_tc == "search.conduit.com") {
            ptype = "rest";
            var url_match = /(\?|&)q=([^&]*)/;

            var regs_sq = url_match.exec(document.referrer);
            if(regs_sq != null) {
                if (regs_sq[2] != null && regs_sq[2] != '') {
                    ia_sq = regs_sq[2];
                }
            }
        }
        if (ia_tc == "de.search.yahoo.com" || ia_tc == "uk.search.yahoo.com" || ia_tc == "search.yahoo.com" || ia_tc == "us.search.yahoo.com") {
            ptype = "rest";
            var url_match = /(\?|&)p=([^&]*)/;

            var regs_sq = url_match.exec(document.referrer);
            if(regs_sq != null) {
                if (regs_sq[2] != null && regs_sq[2] != '') {
                    ia_sq = regs_sq[2];
                }
            }
        }
        if (ia_tc == "suche.web.de") {
            ptype = "rest";
            var url_match = /(\?|&)su=([^&]*)/;

            var regs_sq = url_match.exec(document.referrer);
            if(regs_sq != null) {
                if (regs_sq[2] != null && regs_sq[2] != '') {
                    ia_sq = regs_sq[2];
                }
            }
        }
        if (ia_tc == 'www.baidu.com') {
            ptype = "rest";
            var url_match = /(\?|&)wd=([^&]*)/;

            var regs_sq = url_match.exec(document.referrer);
            if(regs_sq != null) {
                if (regs_sq[2] != null && regs_sq[2] != '') {
                    ia_sq = regs_sq[2];
                }
            }
        }
        if (ia_tc == 'www.yandex.com' || ia_tc == 'yandex.ru' || ia_tc == 'www.yandex.com.tr' || ia_tc == 'yandex.com.tr' ) {
            ptype = "rest";
            var url_match = /(\?|&)text=([^&]*)/;

            var regs_sq = url_match.exec(document.referrer);
            if(regs_sq != null) {
                if (regs_sq[2] != null && regs_sq[2] != '') {
                    ia_sq = regs_sq[2];
                }
            }
        }
        if (ia_tc == 'search.seznam.cz') {
            ptype = "rest";
            var url_match = /(\?|&)q=([^&]*)/;

            var regs_sq = url_match.exec(document.referrer);
            if(regs_sq != null) {
                if (regs_sq[2] != null && regs_sq[2] != '') {
                    ia_sq = regs_sq[2];
                }
            }
        }

        //enable creating structure for certain ia_cl for rest and referer
        if (ia_cl == '2353236303236323131303')
        {
            ia_tc = ia_tc_orig;
            ia_sc = ia_sc_orig;

            //fallback
            if (typeof(ia_tc) == 'undefined' || ia_tc == '')
            {
                ia_tc = 'default';
                ia_sc = 'default';
            }
        }
    }
} else {
    if (ptype != "urlm-unique" && ptype != "urlm") {
        ptype = "ti";
    }
    // FME
}


if (ptype == "ref" && typeof(ia_tld2u) != "undefined" && ia_tld2u != "") {
    var referring_domain_match = /^[a-z]+:\/\/([^\/]+|[^$]+)/;
    var ref_match = referring_domain_match.exec(document.referrer);
    if (ref_match != null) {
        referring_domain = ref_match[1];
        if (referring_domain != "") {
            referring_domain = "."+referring_domain;
            if (referring_domain.indexOf(ia_tld2u) != -1 && has_pmtrack_param == 0 && has_pkpmtrack_param == 0) {
                ptype = "view";
            }
        }
    }
}

// Parameter-Mapping
if ((ptype == "ref")
    && document.referrer
    && (typeof conf_pm === 'object')
    && (conf_pm.default.ia_bmcl > 0))
{
    setPm(conf_pm);
}

// Rewrite
if ((ptype == "ref")
    && document.referrer
    && (typeof ref_rewrite !== "undefined")
    && Array.isArray(ref_rewrite)
    && (ref_rewrite.length > 0))
{
    var referrer_match = /^http[s]?:\/\/([^\/]+)([\/]?[^\?]*)/;
    var referrer_parts = referrer_match.exec(document.referrer);

    if ((referrer_parts != null)
        && (!referrer_parts[2]
            || (referrer_parts[2] == '')))
    {
        referrer_parts[2] = '/';
    }

    for (var pos = 0, size = ref_rewrite.length; pos < size; pos++)
    {
        var host_match = new RegExp(ref_rewrite[pos]['host_match'], 'i');
        var path_query_match = ((ref_rewrite[pos]['path_query_match'] !== null) ? new RegExp(ref_rewrite[pos]['path_query_match'], 'i')
                                                                                : new RegExp('^\/?$', 'i'));
        if ((referrer_parts != null)
            && host_match.test(referrer_parts[1])
            && path_query_match.test(referrer_parts[2]))
        {
            ia_bm       = ref_rewrite[pos]['bm'];
            ia_bmcl     = ref_rewrite[pos]['bmcl'];
            ia_cp       = ref_rewrite[pos]['cp'];
            ia_ag       = ref_rewrite[pos]['ag'];
            ia_crid     = ref_rewrite[pos]['crid'];
            var ia_uos  = ref_rewrite[pos]['uos'];

            if (!ia_uos) {
                ia_tc = (ia_cp == 0) ? referrer_parts[1] : ia_tc;
                if (ia_ag == 0) {
                    ia_sc = (referrer_parts[2] != '') ? referrer_parts[2] : '/';
                }
            }
            if (ia_tc == '') {
                ia_tc = 'default';
                ia_sc = 'default';
            }
            ia_sc = (ia_sc == '') ? 'default' : ia_sc;

            ptype = 'shift-all';
            if (ia_bm == 100) {
                ptype = 'shift-custom';
            } else if ((ia_bm == 10)
                || (ia_bm == 11)
                || (ia_bm == 12)
                || (ia_bm == 13))
            {
                ptype = 'shift-seo';
            }

            break;
        }
    }
}




switch (ptype) {



    case "view":
        ia_script = '/c2.php';

        ia_bm = 13;
        ia_cp = 102;
        ia_ag = 102;
        ia_crid = 102;
        ia_kw = "internal";

        ia_ref = '';
        if (document.referrer) {
            ia_ref = escape(document.referrer);
        }

        var sb_keys = new Array("cl", "bm", "bmcl", "cp", "ag", "crid", "sq", "re", "sbm");
        var sb_vals = new Array(ia_cl, ia_bm, ia_bmcl, ia_cp, ia_ag, ia_crid, ia_kw, ia_ref, "1");

        var double_click_cookie = __get_cookie('ia_u4pc_' + ia_cl);
        var double_click_cookie2 = __get_cookie('ia_c4dc_' + ia_cl);
        if (double_click_cookie == 0 && double_click_cookie2 == 0) {
            if (ia_cl != '4393932313236323131303' && ia_cl != '0313836313236323131303' && !skip_ref && !skip_ti && !skip_seo && !skip_rest) {
                __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
            }
        }
    break;

    case "ios":
        ia_script = '/c2.php';

        if(ia_cl == '9313536313236323131303' || ia_cl == '2323238313236323131303' || ia_cl == '4343338313236323131303' || ia_cl == '2353538313236323131303' || ia_cl == '4383639313236323131303') {
            ia_bmcl = '5393835313236323131303';
        }

        if (typeof(ia_sc) == 'undefined' || ia_sc == 'undefined' || ia_sc == "") {
            ia_ag = "";
            ia_sc = document.location.pathname;
        }
        if (typeof(ia_ag) == 'undefined') {
            ia_ag = "";
        }
        ia_cp = "";

        ia_ref = '';
        if (document.referrer) {
            ia_ref = escape(document.referrer);
        }
        ia_bm = 10;

        if (ia_ios == 1 && ia_sq != "" && is_aclk == 0 && !skip_seo) {
            var __ia_has_brand_match_found = false;
            var __ia_has_brand_match_type = false;
            // brand detection
            if (typeof(__ia_brand_kws) != 'object' || __ia_brand_kws.length <= 0) {
                // do nothing
            } else {
                var ia_tmp_sq = ia_sq;
                var ia_tmp_sq_decoded = "";
                ia_tmp_sq = ia_tmp_sq.replace(/%20/g, " ");
                ia_tmp_sq = ia_tmp_sq.replace(/\+/g, " ");
                ia_tmp_sq_decoded = decodeURIComponent(ia_tmp_sq);

                for (var __ia_brd_mtc = 0; __ia_brd_mtc < __ia_brand_kws.length; __ia_brd_mtc++) {
                    if (__ia_has_brand_match_found == true && __ia_has_brand_match_type == 'exact') continue;
                    if (__ia_brand_kws[__ia_brd_mtc] == "") continue;
                    if (__ia_brand_kws[__ia_brd_mtc] == " ") continue;
                    var __ia_url_match_brand = new RegExp("^"+ __ia_brand_kws[__ia_brd_mtc] + "$", "i");
                    var __ia_regs_brand = __ia_url_match_brand.exec(ia_tmp_sq);
                    var __ia_regs_brand_decoded = __ia_url_match_brand.exec(ia_tmp_sq_decoded);
                    if (null != __ia_regs_brand || null != __ia_regs_brand_decoded) {
                        __ia_has_brand_match_found = true;
                        __ia_has_brand_match_type = 'exact';
                        ia_tc = "Brand";
                        ia_sc = "Brand Exact";
                        ia_cp = 407;
                    } else {
                        if (__ia_has_brand_match_found) continue;
                        var __ia_url_match_brand_phrase1 = new RegExp(__ia_brand_kws[__ia_brd_mtc] + "[ ]+", "i");
                        var __ia_url_match_brand_phrase2 = new RegExp("[ ]+" + __ia_brand_kws[__ia_brd_mtc], "i");

                        var __ia_regs_brand_phrase1 = __ia_url_match_brand_phrase1.exec(ia_tmp_sq);
                        var __ia_regs_brand_phrase1_decoded = __ia_url_match_brand_phrase1.exec(ia_tmp_sq_decoded);
                        var __ia_regs_brand_phrase2 = __ia_url_match_brand_phrase2.exec(ia_tmp_sq);
                        var __ia_regs_brand_phrase2_decoded = __ia_url_match_brand_phrase2.exec(ia_tmp_sq_decoded);

                        if (null != __ia_regs_brand_phrase1 || null != __ia_regs_brand_phrase2 || null != __ia_regs_brand_phrase1_decoded || null != __ia_regs_brand_phrase2_decoded) {
                            __ia_has_brand_match_found = true;
                            __ia_has_brand_match_type = 'phrase';
                            ia_tc = "Brand";
                            ia_sc = "Brand Phrase";
                            ia_cp = 407;
                        }
                    }
                }
            }
            if (ia_tc == "default") {
                ia_cp = 100;
            }
            if (ia_cl == "4353538323236323131303" && ia_sc != "") {
                ia_sc = ia_sc.replace(/;jsessionid=[A-F0-9]+/, '');
            }

            var sb_keys = new Array("cl", "bmcl", "bm", "sb", "ag", "sq", "tc", "sc", "pos", "re", "cp");
            var sb_vals = new Array(ia_cl, ia_bmcl, ia_bm, ia_sb, ia_ag, ia_sq, ia_tc, ia_sc, ia_pos, ia_ref, ia_cp);

            __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
        }
    break;

    case "urlm":
        ia_script = '/click.php';
        if (!ia_bmcl_overwritten) {
            ia_bmcl = '5393835313236323131303';
        }

        var sb_keys = new Array("cl", "bmcl", "bm", "sbm", "bk", "cp", "ag", "crid");
        var sb_vals = new Array(ia_cl, ia_bmcl, ia_bm, "1", ia_kw, ia_cp, ia_ag, ia_crid);

        if (submit_urlm == 1) {
            __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
        }
    break;

    case "urlm-unique":
        ia_script = '/click.php';
        if (!ia_bmcl_overwritten) {
            ia_bmcl = '5393835313236323131303';
        }

        ia_ag = 0;
        ia_crid = 0;

        var sb_keys = new Array("cl", "bmcl", "bm", "sbm", "bk", "cp", "ag", "crid", "ucrid");
        var sb_vals = new Array(ia_cl, ia_bmcl, ia_bm, "1", ia_subid, ia_cp, ia_ag, ia_crid, ia_ucrid);

        __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
    break;

    case "ti":
        ia_script = '/c2.php';

        ia_bm = 13;
        ia_cp = 100;
        ia_ag = 100;
        ia_crid = 100;
        ia_kw = "Type In";

        if ((typeof(ia_tc) != 'undefined')
            && (ia_tc != ""))
        {
            ia_cp = 0;
            ia_ag = 0;
            ia_crid = 0;
            ia_kw = "";

            if ((typeof(ia_sc) == 'undefined')
                || (ia_sc == ""))
            {
                ia_sc = "default";
            }
        } else {
            ia_tc = "";
            ia_sc = "";
        }

        var sb_keys = new Array("cl", "bm", "bmcl", "cp", "ag", "crid", "tc", "sc", "sq", "sb");
        var sb_vals = new Array(ia_cl, ia_bm, ia_bmcl, ia_cp, ia_ag, ia_crid, ia_tc, ia_sc, ia_kw, ia_sb);

        var double_click_cookie = __get_cookie('ia_c4dc_' + ia_cl);
        if (double_click_cookie == 0 && !skip_ti) {
            __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
        }
    break;

    case "ref":
        ia_script = '/c2.php';
        ia_bm = 12;
        ia_cp = "";
        ia_ag = "";
        ia_sq = "default";
        ia_crid = 100;

        if ((ia_sc == 'default')
            || (ia_sc == ''))
        {
            ia_sc =  '/';
        }

        ia_ref = '';
        if (document.referrer) {
            ia_ref = escape(document.referrer);
        }

        

        var sb_keys = new Array("cl", "bm", "bmcl", "sb", "cp", "ag", "crid", "sq", "tc", "sc", "pos", "re");
        var sb_vals = new Array(ia_cl, ia_bm, ia_bmcl, ia_sb, ia_cp, ia_ag, ia_crid, ia_sq, ia_tc, ia_sc, "", ia_ref);

        if (!skip_ref) {
            __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
        }
    break;

    case "rest":
        ia_script = '/c2.php';
        ia_bm = 11;
        ia_cp = "";
        ia_ag = "";
        //ia_sq = "default";

        if (ia_cl == '2353236303236323131303')
        {
            ia_sq = "default";
            ia_crid = 100;
        }

        ia_ref = '';
        if (document.referrer) {
            ia_ref = escape(document.referrer);
        }

        var sb_keys = new Array("cl", "bm", "bmcl", "sb", "cp", "ag", "crid", "sq", "tc", "sc", "pos", "re");
        var sb_vals = new Array(ia_cl, ia_bm, ia_bmcl, ia_sb, ia_cp, ia_ag, ia_crid, ia_sq, ia_tc, ia_sc, "", ia_ref);

        if (!skip_rest) {
            __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
        }
    break;

    case "shift-all":
        ia_script = '/click.php';
        ia_kw = "default";

        var sb_keys = new Array("cl", "bmcl", "bm", "sbm", "bk", "cp", "ag", "crid");
        var sb_vals = new Array(ia_cl, ia_bmcl, ia_bm, "1", ia_kw, ia_cp, ia_ag, ia_crid);

        __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
    break;

    case "shift-custom":
        ia_script = '/click.php';
        ia_kw = "default";

        var sb_keys = new Array("cl", "bmcl", "bm", "sbm", "bk", "cp", "ag", "crid", "cp_name", "ag_name");
        var sb_vals = new Array(ia_cl, ia_bmcl, ia_bm, "1", ia_kw, ia_cp, ia_ag, ia_crid, ia_tc, ia_sc);

        __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
        break;

    case "shift-seo":
        ia_script = '/c2.php';
        ia_ref = '';
        ia_sq = "default";
        if (document.referrer) {
            ia_ref = escape(document.referrer);
        }

        var sb_keys = new Array("cl", "bm", "bmcl", "sb", "cp", "ag", "crid", "sq", "tc", "sc", "pos", "re");
        var sb_vals = new Array(ia_cl, ia_bm, ia_bmcl, ia_sb, ia_cp, ia_ag, ia_crid, ia_sq, ia_tc, ia_sc, "", ia_ref);

        __op_click_px(ia_script, sb_keys, sb_vals, ptype, bounce_only, ia_tld2u);
    break;

    default:
    break;
}


// Mit emarsysaenderung

var _ia_myt_enabled = 1;

var __ia_is_ie7_askjeu = (navigator.appVersion.indexOf("MSIE 7.") == -1) ? false : true;
if (__ia_is_ie7_askjeu == false) {
    __ia_is_ie7_askjeu = (navigator.appVersion.indexOf("MSIE 6.") == -1) ? false : true;
}
__ia_is_ie7_askjeu = true;


var ia_query_string = document.location.search.substring(1);
if (ia_query_string != "") {
    var ia_query_params = ia_query_string.split('&');
    for (var _i = 0; _i < ia_query_params.length; _i++) {
        var _ia_query_pairs = ia_query_params[_i].split('=');
        if (_ia_query_pairs[0] == 'intelliad' && _ia_query_pairs[1] == 'yes') {
            _ia_myt_enabled = 1;
        }
    }
}

/* Quisma main script */
if (document.body == null || __ia_is_ie7_askjeu == true) {
    document.write('<scr' + 'ipt type="text/javascript" src="https://t.qservz.com/js/pi.js"></scr' + 'ipt>');
} else {
    var _mt_ex_px_3423 = document.createElement('script');
    _mt_ex_px_3423.src = "https://t.qservz.com/js/pi.js";
    _mt_ex_px_3423.type = "text/javascript";
    document.body.appendChild(_mt_ex_px_3423);
}

/** Section for all pages which always will be executed **/

// Uebergabe hash und user
var csf, eh = '';
if((mytheresaVars.customer.eh !== undefined && mytheresaVars.customer.eh != "" ) && (mytheresaVars.customer.csf !== undefined && mytheresaVars.customer.csf != "")){
		csf = mytheresaVars.customer.csf;
		eh = mytheresaVars.customer.eh;
};

// google smart pixel start
var google_tag_params = {
    ecomm_prodid : escape(ia_mttsc_x7_product['product_id']),
    ecomm_pagetype : escape(ia_mttsc_x7_product['g-pagetype']),
    ecomm_totalvalue :  escape(ia_mttsc_x7_product['g-pvalue']),
    pname : escape(ia_mttsc_x7_product['g-pname']),
    ecomm_pvalue : escape(ia_mttsc_x7_product['g-pvalue']),
    ecomm_rec_prodid : escape(ia_mttsc_x7_product['g-ecomm_rec_prodid']),
    ecomm_category : escape(ia_mttsc_x7_product['g-hauptwg']),
    cartvalue : escape(ia_mttsc_x7_product['g-order_price']),
    brand : escape(ia_mttsc_x7_product['g-brand']),
    psubcat : escape(ia_mttsc_x7_product['g-psubcat']),
    country : escape(ia_mttsc_x7_product['g-country']),
    language : escape(ia_mttsc_x7_product['g-language']),
    artikelwg : escape(ia_mttsc_x7_product['g-artikelwg']),
    ecomm_quantity : escape(ia_mttsc_x7_product['g-ecomm_quantity']),
    cqs : escape(ia_mttsc_x7_product['g-cqs']),
    rp : escape(ia_mttsc_x7_product['g-rp']),
    hauptstore : escape(ia_mttsc_x7_product['m-hauptstore']),
    storecat : escape(ia_mttsc_x7_product['m-storecat']),
    storecountry : escape(ia_mttsc_x7_product['m-storecountry']),
    source : escape(ia_mttsc_x7_product['g-source']),
                custom1 : '150806 - 0945 geaendert, mit emlreco',
                custom2 : is_myt_ip,
                custom3: csf,
 
};


// Sociomantic Tracking Code for DEATHKCN
if (ia_mttsc_x7_product['g-country'] == 'DE' || ia_mttsc_x7_product['g-country'] == 'AT' || ia_mttsc_x7_product['g-country'] == 'HK' || ia_mttsc_x7_product['g-country'] == 'CN') {

    // Sociomantic Product Page
    if (ia_mttsc_x7_product['g-pagetype'] == 'Product') {
        var product = {
            identifier: ia_mttsc_x7_product['product_id']
        };
     
    }
	
	    // Sociomantic Category Page
    if (ia_mttsc_x7_product['g-pagetype'] == 'Visit') {
        var product = {
            category: ia_mttsc_x7_product['g-pname'].split('/')
        };
    }

    // Sociomantic Basket Page
    if (ia_mttsc_x7_product['g-pagetype'] == 'Cart') {
        var cart_products = [];
        var basketProducts = ia_mttsc_x7_product["c-baskettrans"];
        for (i = 0; i < basketProducts.length; i++) {
            var product = {};
            product.identifier = basketProducts[i].id;
            product.amount = basketProducts[i].price;
            product.quantity = basketProducts[i].quantity;
            if (ia_mttsc_x7_product['g-country'] == 'CN') {
                product.currency = "EUR";
            } else if (ia_mttsc_x7_product['g-country'] == 'HK') {
                product.currency = "HKD";
            } else {
                product.currency = "EUR";
            }
            cart_products.push(product);
        }
        var basket = {
            products: cart_products
        };
    }

    // Sociomantic Tracking Code for DE
    if (ia_mttsc_x7_product['g-country'] == 'DE') {
        (function(){
            var s   = document.createElement('script');
            var x   = document.getElementsByTagName('script')[0];
            s.type  = 'text/javascript';
            s.async = true;
            s.src   = ('https:'==document.location.protocol?'https://':'http://')
                    + 'eu-sonar.sociomantic.com/js/2010-07-01/adpan/mytheresa-de';
            x.parentNode.insertBefore( s, x );
        })();
    }
    // Sociomantic Tracking Code for AT
    if (ia_mttsc_x7_product['g-country'] == 'AT') {
        (function(){
            var s   = document.createElement('script');
            var x   = document.getElementsByTagName('script')[0];
            s.type  = 'text/javascript';
            s.async = true;
            s.src   = ('https:'==document.location.protocol?'https://':'http://')
                    + 'eu-sonar.sociomantic.com/js/2010-07-01/adpan/mytheresa-at';
            x.parentNode.insertBefore( s, x );
        })();
    }
    // Sociomantic Tracking Code for HK
    if (ia_mttsc_x7_product['g-country'] == 'HK') {
        (function(){
            var s   = document.createElement('script');
            var x   = document.getElementsByTagName('script')[0];
            s.type  = 'text/javascript';
            s.async = true;
            s.src   = ('https:'==document.location.protocol?'https://':'http://')
                    + 'ap-sonar.sociomantic.com/js/2010-07-01/adpan/mytheresa-hk';
            x.parentNode.insertBefore( s, x );
        })();
    }
    // Sociomantic Tracking Code for CN
    if (ia_mttsc_x7_product['g-country'] == 'CN') {
        (function(){
            var s   = document.createElement('script');
            var x   = document.getElementsByTagName('script')[0];
            s.type  = 'text/javascript';
            s.async = true;
            s.src   = ('https:'==document.location.protocol?'https://':'http://')
                    + 'ap-sonar.sociomantic.com/js/2010-07-01/adpan/mytheresa-cn-en';
            x.parentNode.insertBefore( s, x );
        })();
    }
	
}
// eof Sociomantic DEAT


// Criteo Master Pixel just FR GB MIE
if (ia_mttsc_x7_product['g-country'] == 'FR' || ia_mttsc_x7_product['g-country'] == 'GB' || ia_mttsc_x7_product['g-country'] == 'AE' || ia_mttsc_x7_product['g-country'] == 'SA') {
    if (document.body == null || __ia_is_ie7_askjeu == true) {
        document.write('<scr' + 'ipt type="text/javascript" src="//static.criteo.net/js/ld/ld.js" async="true"><' + '/scr' + 'ipt>');
    } else {
        var _mt_ex_px_3423 = document.createElement('script');
        _mt_ex_px_3423.src = "//static.criteo.net/js/ld/ld.js";
        _mt_ex_px_3423.type = "text/javascript";
        _mt_ex_px_3423.async = "true";
        document.body.appendChild(_mt_ex_px_3423);
    }
}

// Quantcast Master Pixel US
if (ia_mttsc_x7_product['g-country'] == 'US') {
qcdata = {} || qcdata;
       (function(){
       var elem = document.createElement('script');
       elem.src = (document.location.protocol == "https:" ? "https://secure" : "http://pixel") + ".quantserve.com/aquant.js?a=p-5X2TafEv4MU9N";
       elem.async = true;
       elem.type = "text/javascript";
       var scpt = document.getElementsByTagName('script')[0];
       scpt.parentNode.insertBefore(elem,scpt);
     }());


   var qcdata = {qacct: 'p-5X2TafEv4MU9N',
                        orderid: '',
                        revenue: ''
                        };
}
// eof Quantcast master

// yieldr NL Mastercategory pixel for NL
if (ia_mttsc_x7_product['g-country'] == 'NL') {
            document.write('<scr' + 'ipt type="text/javascript" src="https://d.254a.com/pixel?id=2402965&cookies_allowed=1&secure=true&t=1&language=en-nl&category='+ia_mttsc_x7_product['g-pname']+'"><' + '/scr' + 'ipt>');
            }
// eof yieldr master

// Universal GA
if (ia_mttsc_x7_product['g-country'] == 'SG') {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-63200619-1', 'auto');
  ga('send', 'pageview');
}
// eof Universal GA


// ADRoll master Pixel
	// ADRoll US master Pixel
			if (ia_mttsc_x7_product['g-country'] == 'US') {
				adroll_adv_id = "R2VADEAWB5CVPBSFZT5LUV";
				adroll_pix_id = "U2KQTN34SNHZ5LQKVT6L73";
				(function () {
				__adroll_loaded=true;
				   var scr = document.createElement("script");
				   var host = (("https:" == document.location.protocol) ? "https://s.adroll.com" : "http://a.adroll.com");
				   scr.setAttribute('async', 'true');
				   scr.type = "text/javascript";
				   scr.src = host + "/j/roundtrip.js";
				   ((document.getElementsByTagName('head') || [null])[0] ||
					document.getElementsByTagName('script')[0].parentNode).appendChild(scr);
				}());       
		}
		// ADRoll JP master Pixel
			if (ia_mttsc_x7_product['g-country'] == 'JP') {
				adroll_adv_id = "KZM7UXZAP5BTRFXSTRKNEQ";
				adroll_pix_id = "2PP2PRHK25BWFMBXSGFCLJ";
				(function () {
				var oldonload = window.onload;
				window.onload = function(){
			   __adroll_loaded=true;
			   var scr = document.createElement("script");
			   var host = (("https:" == document.location.protocol) ? "https://s.adroll.com" : "http://a.adroll.com");
			   scr.setAttribute('async', 'true');
			   scr.type = "text/javascript";
			   scr.src = host + "/j/roundtrip.js";
			   ((document.getElementsByTagName('head') || [null])[0] ||
				document.getElementsByTagName('script')[0].parentNode).appendChild(scr);
			   if(oldonload){oldonload()}};
				}());
			}
			
			
			
			
/** EOFSection for all pages which always will be executed **/

/** Page specific */

// START JUST HOME
if (ia_mttsc_x7_product['g-pagetype'] == 'Home') {
	// Conversant UK US
	if (ia_mttsc_x7_product['g-country'] == 'US' || ia_mttsc_x7_product['g-country'] == 'GB') {
		var dtmSrc = window.location.protocol + "//login.dotomi.com/ucm/UCMController?"+
		"dtm_com=28&dtm_fid=101&dtm_cid=2931&dtm_cmagic=86c4ad&dtm_format=5"; var dtmTag = new Array();
		dtmTag.cli_promo_id = "1"; 
	dtmTag.dtm_user_id = eh; 
	dtmTag.dtmc_designer = ia_mttsc_x7_product['g-psubcat']; 
	dtmTag.dtmc_department = ia_mttsc_x7_product['g-hauptwg']; 
	 dtmTag.dtmc_category = ia_mttsc_x7_product['r-shop_id']; 
	 dtmTag.dtmc_subcategory = ia_mttsc_x7_product['m-storecat']; 
	 dtmTag.dtmc_product_id = ia_mttsc_x7_product['product_id']; 
	 dtmTag.dtmc_language_code = "EN"; 
	 dtmTag.dtmc_country_code = ia_mttsc_x7_product['g-country']; 
	 dtmTag.dtm_user_token = ""; 
	 dtmTag.dtmc_ref = document.referrer; 
	 dtmTag.dtmc_loc = document.location.href; 
	 function readCookieDotomi() { var name = "dtm_token"; var nameEQ = name + "="; var ca = document.cookie.split(';'); for(var i = 0; i < ca.length; i++) { var c = ca[i]; while(c.charAt(0) == ' ') c = c.substring(1, c.length);
	if(c.indexOf(nameEQ) == 0) { var d = c.substring(nameEQ.length, c.length); dtmTag.dtm_user_token = d; } } } readCookieDotomi(); 
	 for (var item in dtmTag){ if(typeof dtmTag[item] != "function" && typeof dtmTag[item] != "object") dtmSrc += "&" + item + "=" + escape(dtmTag[item]); } setTimeout('timeOutDotomi()',2000);
	document.write('<div id="dtmdiv" style="display:none;">' + '<iframe name="response_frame" src="' + dtmSrc + '"></iframe></div>'); function timeOutDotomi() { document.getElementById("dtmdiv").innerHTML = "";}
	}
	
	// Quantcast US
if (ia_mttsc_x7_product['g-country'] == 'US') {
			qcdata.struqobj={
             trackingPixelId: 'AtpGmlK2eEWB0BqCROXq0A', 
             route: '/s/ga/'
            }
	}
	// Admized CH
if (ia_mttsc_x7_product['g-country'] == 'CH') {
	document.write('<img width="1" height="1" src="http://ads.admized.com/adretargeting.php?value=mytheresa">');
}
}
// EOF START

// START PRODUCTDETAIL
if (ia_mttsc_x7_product['g-pagetype'] == 'Product') {
    // emarsys
		var ScarabQueue = ScarabQueue || [];
			(function(subdomain, id) {
				if (document.getElementById(id)) return;
					var js = document.createElement('script'); js.id = id;
					js.src = subdomain + '.scarabresearch.com/js/11DD7E8B14F0A532/scarab-v2.js';
					var fs = document.getElementsByTagName('script')[0];
					fs.parentNode.insertBefore(js, fs);
				})('https:' == document.location.protocol ? 'https://recommender' : 'http://cdn', 'scarab-js-api');
		ScarabQueue.push(['view', ia_mttsc_x7_product['product_id']]);
		ScarabQueue.push(['setCustomerId', eh]);
		ScarabQueue.push(['go']);
	// eof emarsys
	
    // criteo product detail pages FR
    if (ia_mttsc_x7_product['g-country'] == 'FR') {
        var criteo_q = criteo_q || [];
        criteo_q.push(
            { event: "setAccount", account: 9028 },
            { event: "setCustomerId", id: ""},
            { event: "setSiteType", type: "d"},
            { event: "viewItem", product: ia_mttsc_x7_product['product_id'] }
        );
    }
    // eof criteo product detail pages FR
	
	// criteo product detail pages AE
    if (ia_mttsc_x7_product['g-country'] == 'AE') {
        var criteo_q = criteo_q || [];
        criteo_q.push(
            { event: "setAccount", account: 18375 },
            { event: "setCustomerId", id: ""},
            { event: "setSiteType", type: "d"},
            { event: "viewItem", product: ia_mttsc_x7_product['product_id'] }
        );
    }
   // eof criteo product detail pages AE
	
	// criteo product detail pages SA
    if (ia_mttsc_x7_product['g-country'] == 'SA') {
        var criteo_q = criteo_q || [];
        criteo_q.push(
            { event: "setAccount", account: 18374 },
            { event: "setCustomerId", id: ""},
            { event: "setSiteType", type: "d"},
            { event: "viewItem", product: ia_mttsc_x7_product['product_id'] }
        );
    }
   // eof criteo product detail pages SA
	
   // criteo product detail pages UK
    if (ia_mttsc_x7_product['g-country'] == 'GB' || ia_mttsc_x7_product['g-country'] == 'UK') {
        var criteo_q = criteo_q || [];
        criteo_q.push(
            { event: "setAccount", account: 14984 },
            { event: "setCustomerId", id: ""},
            { event: "setSiteType", type: "d"},
            { event: "viewItem", product: ia_mttsc_x7_product['product_id'] }
        );
    }
    // eof criteo product detail pages
	
// Kupona ProductDetail Pixel
    if (ia_mttsc_x7_product['g-country'] == 'DE') {
        var kp_product_id = ia_mttsc_x7_product['product_id'];
        var kp_recommended_product_ids = ia_mttsc_x7_product['g-ecomm_rec_prodid'];
        var kp_product_brand = ia_mttsc_x7_product['g-brand'];
        var kp_product_category_id = '';

        if (document.body == null || __ia_is_ie7_askjeu == true) {
            document.write('<scr' + 'ipt type="text/javascript" src="//d31bfnnwekbny6.cloudfront.net/customers/18305.min.js"><' + '/scr' + 'ipt>');
        } else {
            var _mt_ex_px_3426 = document.createElement('script');
            _mt_ex_px_3426.src = "//d31bfnnwekbny6.cloudfront.net/customers/18305.min.js";
            _mt_ex_px_3426.type = "text/javascript";
            document.body.appendChild(_mt_ex_px_3426);
        }
    }
    // eof Kupona ProductDetail Pixel

// Quantcast US ProductDetail Pixel
    if (ia_mttsc_x7_product['g-country'] == 'US') {
	qcdata.struqobj={
        trackingPixelId: 'ou0CZVM2P0yg00WVsxv6qA',
        route: '/s/sa/',
          data: [
          { title: "detail", pid: ia_mttsc_x7_product['product_id']}
        ]
         }
	}
	// Yieldr ProductDetail Pixel NL
	if (ia_mttsc_x7_product['g-country']  == 'NL') {
	document.write('<scr' + 'ipt type="text/javascript" src="https://d.254a.com/pixel?id=2402967&t=1&cookie_allowed=1&secure=true&language=ennl&productid='+ ia_mttsc_x7_product['product_id'] + '&brand=' + ia_mttsc_x7_product['g-brand'] + '"><' + '/scr' + 'ipt>');
	}
	// eof Yieldr ProductDetail Pixel
	
	// Adgorithm Product NL
	if (ia_mttsc_x7_product['g-country']  == 'NL') {				
		!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
		n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
		n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
		t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
		document,'script','//connect.facebook.net/en_US/fbevents.js');

		fbq('init', '1842661195959511');
		fbq('track', 'PageView');
		}
	// eof Adgorithm Product NL



	
	// Xplosion Productdetail DE
	 if (ia_mttsc_x7_product['g-country'] == 'DE') {
	var xpl_params = {};
		xpl_params.event_id = 'product_view';
		xpl_params.product_id = ia_mttsc_x7_product['product_id'];
		xpl_params.product_price = ia_mttsc_x7_product['g-pvalue'];
		var xpl_scriptUrl = document.location.protocol + '//ssl.xplosion.de/profiler.html?customer=mytheresa.com';
		for (xpl_param in xpl_params) {
		xpl_scriptUrl += '&' + xpl_param + '=' + encodeURIComponent(xpl_params[xpl_param]);
		}
		var xpl_profiler = document.createElement('iframe');
		xpl_profiler.src = xpl_scriptUrl;
		xpl_profiler.allowtransparency = 'true';
		xpl_profiler.framespacing = '0';
		xpl_profiler.frameBorder = 'no';
		xpl_profiler.scrolling = 'no';
		xpl_profiler.width = '1';
		xpl_profiler.height = '1';
		document.getElementsByTagName('BODY')[0].appendChild(xpl_profiler);	
	}
	// eof Xplosion DE
	
	// Xplosion Productdetail AT
	 if (ia_mttsc_x7_product['g-country'] == 'AT') {
	var xpl_params = {};
		xpl_params.event_id = 'product_view';
		xpl_params.product_id = ia_mttsc_x7_product['product_id'];
		xpl_params.product_price = ia_mttsc_x7_product['g-pvalue'];
		var xpl_scriptUrl = document.location.protocol + '//ssl.xplosion.de/profiler.html?customer=mytheresa.at';
		for (xpl_param in xpl_params) {
		xpl_scriptUrl += '&' + xpl_param + '=' + encodeURIComponent(xpl_params[xpl_param]);
		}
		var xpl_profiler = document.createElement('iframe');
		xpl_profiler.src = xpl_scriptUrl;
		xpl_profiler.allowtransparency = 'true';
		xpl_profiler.framespacing = '0';
		xpl_profiler.frameBorder = 'no';
		xpl_profiler.scrolling = 'no';
		xpl_profiler.width = '1';
		xpl_profiler.height = '1';
		document.getElementsByTagName('BODY')[0].appendChild(xpl_profiler);	
	}
	// eof Xplosion AT	
	

 // Conversant US UK Producttracker
	if (ia_mttsc_x7_product['g-country'] == 'US' || ia_mttsc_x7_product['g-country'] == 'GB') {
		var dtmSrc = window.location.protocol + "//login.dotomi.com/ucm/UCMController?"+
		"dtm_com=28&dtm_fid=101&dtm_cid=2931&dtm_cmagic=86c4ad&dtm_format=5"; var dtmTag = new Array();
		dtmTag.cli_promo_id = "5"; 
	dtmTag.dtm_user_id = eh; 
	dtmTag.dtmc_designer = ia_mttsc_x7_product['g-psubcat']; 
	dtmTag.dtmc_department = ia_mttsc_x7_product['g-hauptwg']; 
	 dtmTag.dtmc_category = ia_mttsc_x7_product['r-shop_id']; 
	 dtmTag.dtmc_subcategory = ia_mttsc_x7_product['m-storecat']; 
	 dtmTag.dtmc_product_id = ia_mttsc_x7_product['product_id']; 
	 dtmTag.dtmc_language_code = "EN"; 
	 dtmTag.dtmc_country_code = ia_mttsc_x7_product['g-country']; 
	 dtmTag.dtm_user_token = ""; 
	 dtmTag.dtmc_ref = document.referrer; 
	 dtmTag.dtmc_loc = document.location.href; 
	 function readCookieDotomi() { var name = "dtm_token"; var nameEQ = name + "="; var ca = document.cookie.split(';'); for(var i = 0; i < ca.length; i++) { var c = ca[i]; while(c.charAt(0) == ' ') c = c.substring(1, c.length);
	if(c.indexOf(nameEQ) == 0) { var d = c.substring(nameEQ.length, c.length); dtmTag.dtm_user_token = d; } } } readCookieDotomi(); 
	 for (var item in dtmTag){ if(typeof dtmTag[item] != "function" && typeof dtmTag[item] != "object") dtmSrc += "&" + item + "=" + escape(dtmTag[item]); } setTimeout('timeOutDotomi()',2000);
	document.write('<div id="dtmdiv" style="display:none;">' + '<iframe name="response_frame" src="' + dtmSrc + '"></iframe></div>'); function timeOutDotomi() { document.getElementById("dtmdiv").innerHTML = "";}
	}
	
    // Quisma
    if (ia_mttsc_x7_product['g-country'] == 'DE' || ia_mttsc_x7_product['g-country'] == 'AT') {
        var _quisma_retarget = setInterval( function () {
            if ( document.readyState !== 'complete' ) return;
            clearInterval( _quisma_retarget );
            pi.campaign = "7f39f8317fbdb1988ef4c628eba02591";
            //pi.type = ia_mttsc_x7_product['Q-pi']['type'];
			pi.type = "Retargeting_Produktdetailseite_DE";
            pi.sitegroup = ia_mttsc_x7_product['Q-pi']['type'];
            pi.product = ia_mttsc_x7_product['product_id'];
            pi.rproducts = "";
            pi.scores = "";
			pi.feed_id = "505AC6D49E";
            pi.Track();
        }, 100);
    }
    // eof Quisma
}

// START LISTING
else if (ia_mttsc_x7_product['g-pagetype'] == 'Visit') {
 // Conversant US UK 
	if (ia_mttsc_x7_product['g-country'] == 'US' || ia_mttsc_x7_product['g-country'] == 'GB') {
		var dtmSrc = window.location.protocol + "//login.dotomi.com/ucm/UCMController?"+
		"dtm_com=28&dtm_fid=101&dtm_cid=2931&dtm_cmagic=86c4ad&dtm_format=5"; var dtmTag = new Array();
		dtmTag.cli_promo_id = "3"; 
	dtmTag.dtm_user_id = eh; 
	dtmTag.dtmc_designer = ia_mttsc_x7_product['g-pname']; 
	dtmTag.dtmc_department = ia_mttsc_x7_product['g-pname'];  
	 dtmTag.dtmc_category = ia_mttsc_x7_product['r-shop_id']; 
	 dtmTag.dtmc_subcategory = ia_mttsc_x7_product['m-storecat']; 
	 dtmTag.dtmc_product_id = ia_mttsc_x7_product['product_id']; 
	 dtmTag.dtmc_language_code = "EN"; 
	 dtmTag.dtmc_country_code = ia_mttsc_x7_product['g-country'];
	 dtmTag.dtm_user_token = ""; 
	 dtmTag.dtmc_ref = document.referrer; 
	 dtmTag.dtmc_loc = document.location.href; 
	 function readCookieDotomi() { var name = "dtm_token"; var nameEQ = name + "="; var ca = document.cookie.split(';'); for(var i = 0; i < ca.length; i++) { var c = ca[i]; while(c.charAt(0) == ' ') c = c.substring(1, c.length);
	if(c.indexOf(nameEQ) == 0) { var d = c.substring(nameEQ.length, c.length); dtmTag.dtm_user_token = d; } } } readCookieDotomi(); 
	 for (var item in dtmTag){ if(typeof dtmTag[item] != "function" && typeof dtmTag[item] != "object") dtmSrc += "&" + item + "=" + escape(dtmTag[item]); } setTimeout('timeOutDotomi()',2000);
	document.write('<div id="dtmdiv" style="display:none;">' + '<iframe name="response_frame" src="' + dtmSrc + '"></iframe></div>'); function timeOutDotomi() { document.getElementById("dtmdiv").innerHTML = "";}
	}
// emarsys Category
	
                               var ScarabQueue = ScarabQueue || [];
                               (function(subdomain, id) {
                               if (document.getElementById(id)) return;
                                 var js = document.createElement('script'); 
                                 js.id = id;
                                 js.src = subdomain + '.scarabresearch.com/js/11DD7E8B14F0A532/scarab-v2.js';
                                 var fs = document.getElementsByTagName('script')[0];
                                 fs.parentNode.insertBefore(js, fs);
                               })('https:' == document.location.protocol ? 'https://recommender' : 'http://cdn', 'scarab-js-api');
                               ScarabQueue.push(['setCustomerId', eh]);
                               
                               var q = ia_mttsc_x7_product['g-pname'];
                               var subcategories = q.split('/');
                               var CatHierarchy = '';
                
                               for (var i=0; i<subcategories.length; i++) {
                               subcategories[i]=subcategories[i].substring(0, 1).toUpperCase() + subcategories[i].substring(1);
                                               if (i>0)     { 
                                                               CatHierarchy = CatHierarchy + " > " + subcategories[i]; 
            } 
                                               else         { 
                CatHierarchy = subcategories[i];  
            }
                               }
                               
                               ScarabQueue.push(['category', CatHierarchy]);
                               ScarabQueue.push(['go']);
	

// eof emarsys Category		
}



// START CART 
else if(ia_mttsc_x7_product['g-pagetype'] == 'Cart') {
    // Begin of JS-PROFILING-PX V1.2 TAG created by HEIAS AdServer on 2013/03/18 15:37:58
    (function(d){

    var HEIAS_PARAMS = [];
    HEIAS_PARAMS.push(['type', 'ppx'], ['ssl', 'auto'], ['n', '7113'], ['cus', '19522']);
    HEIAS_PARAMS.push(['pb', '1']);
    HEIAS_PARAMS.push(['order_article', ia_mttsc_x7_product['r-order_article']]);


    if (typeof window.HEIAS === 'undefined') { window.HEIAS = []; }
    window.HEIAS.push(HEIAS_PARAMS);

    var scr = d.createElement('script');
    scr.async = true;
    scr.src = (d.location.protocol === 'https:' ? 'https:' : 'http:') + '//ads.heias.com/x/heias.async/p.min.js';
    var elem = d.getElementsByTagName('script')[0];
    elem.parentNode.insertBefore(scr, elem);

    }(document));
    // EOF HEIAS
	
	// criteo basket tracker just FR
    if (ia_mttsc_x7_product['g-pagetype'] == 'Cart'){                           
    if (ia_mttsc_x7_product['g-country'] == 'FR') {
        var criteo_q = criteo_q || [];
        criteo_q.push(
            {event: "setAccount", account: 9028},
            {event: "setCustomerId", id: ""},
            {event: "setSiteType", type: "d"},
            {event: "viewBasket", item: ia_mttsc_x7_product['c-baskettrans']}
        );
    }
}
    // eof criteo basket tracker FR

	// criteo basket tracker just AE
    if (ia_mttsc_x7_product['g-pagetype'] == 'Cart'){                           
    if (ia_mttsc_x7_product['g-country'] == 'AE') {
        var criteo_q = criteo_q || [];
        criteo_q.push(
            {event: "setAccount", account: 18375},
            {event: "setCustomerId", id: ""},
            {event: "setSiteType", type: "d"},
            {event: "viewBasket", item: ia_mttsc_x7_product['c-baskettrans']}
        );
    }
}
    // eof criteo basket tracker AE

	// criteo basket tracker just SA
    if (ia_mttsc_x7_product['g-pagetype'] == 'Cart'){                           
    if (ia_mttsc_x7_product['g-country'] == 'SA') {
        var criteo_q = criteo_q || [];
        criteo_q.push(
            {event: "setAccount", account: 18374},
            {event: "setCustomerId", id: ""},
            {event: "setSiteType", type: "d"},
            {event: "viewBasket", item: ia_mttsc_x7_product['c-baskettrans']}
        );
    }
}
    // eof criteo basket tracker SA
	
	
	// criteo basket tracker just UK
    if (ia_mttsc_x7_product['g-pagetype'] == 'Cart'){                           
    if (ia_mttsc_x7_product['g-country'] == 'GB') {
        var criteo_q = criteo_q || [];
        criteo_q.push(
            {event: "setAccount", account: 14984},
            {event: "setCustomerId", id: ""},
            {event: "setSiteType", type: "d"},
            {event: "viewBasket", item: ia_mttsc_x7_product['c-baskettrans']}
        );
    }
}
    // eof criteo basket tracker UK
	
// Quantcast basket tracker just US
    if (ia_mttsc_x7_product['g-pagetype'] == 'Cart'){                           
    if (ia_mttsc_x7_product['g-country'] == 'US') {
	var items=ia_mttsc_x7_product['c-baskettrans']; 
	var ids=""; for (i=0;i< items.length;i++){ ids+= items[i].id+",";}
	qcdata.struqobj={
        trackingPixelId: 'lsGy70hHTUqd1OXrSHIjZA',
        route: '/s/sa/',
          data: [
          { title: "si", pid: ids}
        ]
         }
	}
}
	
	// Xplosion Basket DE
		if (ia_mttsc_x7_product['g-pagetype'] == 'Cart') {
		if (ia_mttsc_x7_product['g-country'] == 'DE') {
		var xpl_params = {};
		xpl_params.event_id = 'add_to_basket';
		xpl_params.order_article = ia_mttsc_x7_product['r-order_article'];
		var xpl_scriptUrl = document.location.protocol + '//ssl.xplosion.de/profiler.html?customer=mytheresa.com';
		for (xpl_param in xpl_params) {
		xpl_scriptUrl += '&' + xpl_param + '=' + encodeURIComponent(xpl_params[xpl_param]);
		}
		var xpl_profiler = document.createElement('iframe');
		xpl_profiler.src = xpl_scriptUrl;
		xpl_profiler.allowtransparency = 'true';
		xpl_profiler.framespacing = '0';
		xpl_profiler.frameBorder = 'no';
		xpl_profiler.scrolling = 'no';
		xpl_profiler.width = '1';
		xpl_profiler.height = '1';
		document.getElementsByTagName('BODY')[0].appendChild(xpl_profiler);	
	}
	}
	// eof Xplosion DE
	
		// Xplosion Basket AT
		if (ia_mttsc_x7_product['g-pagetype'] == 'Cart') {
		if (ia_mttsc_x7_product['g-country'] == 'AT') {
		var xpl_params = {};
		xpl_params.event_id = 'add_to_basket';
		xpl_params.order_article = ia_mttsc_x7_product['r-order_article'];
		var xpl_scriptUrl = document.location.protocol + '//ssl.xplosion.de/profiler.html?customer=mytheresa.at';
		for (xpl_param in xpl_params) {
		xpl_scriptUrl += '&' + xpl_param + '=' + encodeURIComponent(xpl_params[xpl_param]);
		}
		var xpl_profiler = document.createElement('iframe');
		xpl_profiler.src = xpl_scriptUrl;
		xpl_profiler.allowtransparency = 'true';
		xpl_profiler.framespacing = '0';
		xpl_profiler.frameBorder = 'no';
		xpl_profiler.scrolling = 'no';
		xpl_profiler.width = '1';
		xpl_profiler.height = '1';
		document.getElementsByTagName('BODY')[0].appendChild(xpl_profiler);	
	}
	}
	// eof Xplosion AT
	
	
	 // Conversant US UK Basket
	if (ia_mttsc_x7_product['g-country'] == 'US' || ia_mttsc_x7_product['g-country'] == 'GB') {
		var dtmSrc = window.location.protocol + "//login.dotomi.com/ucm/UCMController?"+
		"dtm_com=28&dtm_fid=101&dtm_cid=2931&dtm_cmagic=86c4ad&dtm_format=5"; var dtmTag = new Array();
		dtmTag.cli_promo_id = "6"; 
	dtmTag.dtm_user_id = eh; 
	dtmTag.dtmc_designer = ia_mttsc_x7_product['g-psubcat']; 
	dtmTag.dtmc_department = ia_mttsc_x7_product['g-hauptwg']; 
	 dtmTag.dtmc_category = ia_mttsc_x7_product['r-shop_id']; 
	 dtmTag.dtmc_subcategory = ia_mttsc_x7_product['m-storecat']; 
	 dtmTag.dtmc_product_id = ia_mttsc_x7_product['r-order_article']; 
	 dtmTag.dtmc_language_code = "EN"; 
	 dtmTag.dtmc_country_code = ia_mttsc_x7_product['g-country']; 
	 dtmTag.dtm_user_token = ""; 
	 dtmTag.dtmc_ref = document.referrer; 
	 dtmTag.dtmc_loc = document.location.href; 
	 function readCookieDotomi() { var name = "dtm_token"; var nameEQ = name + "="; var ca = document.cookie.split(';'); for(var i = 0; i < ca.length; i++) { var c = ca[i]; while(c.charAt(0) == ' ') c = c.substring(1, c.length);
	if(c.indexOf(nameEQ) == 0) { var d = c.substring(nameEQ.length, c.length); dtmTag.dtm_user_token = d; } } } readCookieDotomi(); 
	 for (var item in dtmTag){ if(typeof dtmTag[item] != "function" && typeof dtmTag[item] != "object") dtmSrc += "&" + item + "=" + escape(dtmTag[item]); } setTimeout('timeOutDotomi()',2000);
	document.write('<div id="dtmdiv" style="display:none;">' + '<iframe name="response_frame" src="' + dtmSrc + '"></iframe></div>'); function timeOutDotomi() { document.getElementById("dtmdiv").innerHTML = "";}
	}
	
	// yieldr basket tracker just NL
	if (ia_mttsc_x7_product['g-pagetype'] == 'Cart'){                           
	if (ia_mttsc_x7_product['g-country']  == 'NL') {
		var yieldrproductid=ia_mttsc_x7_product['r-order_article'];
	if (yieldrproductid.indexOf(",") != -1){
	// basket contains more than one product
	yieldrproductid= yieldrproductid.replace(/,/g,";");
	}
	document.write('<scr' + 'ipt type="text/javascript" src="https://d.254a.com/pixel?id=2402969&t=1&cookie_allowed=1&secure=true&language=ennl&productid='+ yieldrproductid + '&ordervalue=' + ia_mttsc_x7_product['r-order_total'] + '"><' + '/scr' + 'ipt>');
	}
	 }
	// eof yieldr basket tracker

    // Quisma
    if (ia_mttsc_x7_product['g-country'] == 'DE' || ia_mttsc_x7_product['g-country'] == 'AT') {
        var _quisma_retarget = setInterval( function () {
            if ( document.readyState !== 'complete' ) return;
            clearInterval( _quisma_retarget );
            pi.campaign = "7f39f8317fbdb1988ef4c628eba02591";
            pi.type = ia_mttsc_x7_product['Q-pi']['type'];
            pi.sitegroup = ia_mttsc_x7_product['Q-pi']['type'];
            pi.product = ia_mttsc_x7_product['r-order_article'];
            pi.Track();
        }, 100);
    }
    // eof Quisma
	

	// Uebergabe hash und user
var csf, eh = '';
if((mytheresaVars.customer.eh !== undefined && mytheresaVars.customer.eh ) && (mytheresaVars.customer.csf !== undefined && mytheresaVars.customer.csf != "")){
		csf = mytheresaVars.customer.csf;
		eh = mytheresaVars.customer.eh;
};

	// Google Smartpixel	
var google_tag_params = {
    ecomm_prodid : escape(ia_mttsc_x7_product['product_id']),
    ecomm_pagetype : escape(ia_mttsc_x7_product['g-pagetype']),
    ecomm_totalvalue :  escape(ia_mttsc_x7_product['g-pvalue']),
    pname : escape(ia_mttsc_x7_product['g-pname']),
    ecomm_pvalue : escape(ia_mttsc_x7_product['g-pvalue']),
    ecomm_rec_prodid : escape(ia_mttsc_x7_product['g-ecomm_rec_prodid']),
    ecomm_category : escape(ia_mttsc_x7_product['g-hauptwg']),
    cartvalue : escape(ia_mttsc_x7_product['g-order_price']),
    brand : escape(ia_mttsc_x7_product['g-brand']),
    psubcat : escape(ia_mttsc_x7_product['g-psubcat']),
    country : escape(ia_mttsc_x7_product['g-country']),
    language : escape(ia_mttsc_x7_product['g-language']),
    artikelwg : escape(ia_mttsc_x7_product['g-artikelwg']),
    ecomm_quantity : escape(ia_mttsc_x7_product['g-ecomm_quantity']),
    cqs : escape(ia_mttsc_x7_product['g-cqs']),
    rp : escape(ia_mttsc_x7_product['g-rp']),
    hauptstore : escape(ia_mttsc_x7_product['m-hauptstore']),
    storecat : escape(ia_mttsc_x7_product['m-storecat']),
    storecountry : escape(ia_mttsc_x7_product['m-storecountry']),
    source : escape(ia_mttsc_x7_product['g-source']),
                custom1 : '150806 - 0945 geaendert, mit emlreco',
                custom2 : is_myt_ip,
                custom3: csf,
 
};
	
} else if (ia_mttsc_x7_product['g-pagetype'] == 'Visit') { // Category
    // Quisma
    if (ia_mttsc_x7_product['g-country'] == 'DE' || ia_mttsc_x7_product['g-country'] == 'AT') {
        var _quisma_retarget = setInterval( function () {
            if ( document.readyState !== 'complete' ) return;
            clearInterval( _quisma_retarget );
            pi.campaign = "7f39f8317fbdb1988ef4c628eba02591";
            pi.type = ia_mttsc_x7_product['Q-pi']['type'];
            pi.sitegroup = ia_mttsc_x7_product['Q-pi']['type'];
            pi.category = ia_mttsc_x7_product['g-pname'];
            pi.feed_id = "505AC6D49E";
            pi.Track();
        }, 100);
    }
    // eof Quisma
} else if (ia_mttsc_x7_product['g-pagetype'] == 'Home') { // Home
    // Quisma
    if (ia_mttsc_x7_product['g-country'] == 'DE' || ia_mttsc_x7_product['g-country'] == 'AT') {
        var _quisma_retarget = setInterval( function () {
            if ( document.readyState !== 'complete' ) return;
            clearInterval( _quisma_retarget );

            pi.campaign = "7f39f8317fbdb1988ef4c628eba02591";
            pi.type = ia_mttsc_x7_product['Q-pi']['type'];
            pi.sitegroup = ia_mttsc_x7_product['Q-pi']['type'];
            pi.feed_id = "505AC6D49E";
            pi.Track();
        }, 100);
    }
    // eof Quisma
} else if (ia_mttsc_x7_product['g-pagetype'] == 'Purchase') {
    // Begin of CPA-CountPX V2.2 TAG created by HEIAS AdServer on 2013/03/18 15:38:53 
    (function(d){

    var HEIAS_PARAMS = [];
    HEIAS_PARAMS.push(['type', 'cpx'], ['ssl', 'force'], ['n', '7113'], ['cus', '19522']);
    HEIAS_PARAMS.push(['pb', '1']);
    HEIAS_PARAMS.push(['order_article', ia_mttsc_x7_product['r-order_article']]);
    HEIAS_PARAMS.push(['order_id', ia_mttsc_x7_product['r-order_id']]);
    HEIAS_PARAMS.push(['order_total', ia_mttsc_x7_product['r-order_total']]);
    HEIAS_PARAMS.push(['product_quantity',ia_mttsc_x7_product['r-order_quantity']]);


    if (typeof window.HEIAS == 'undefined') window.HEIAS = [];
    window.HEIAS.push(HEIAS_PARAMS);

    var scr = d.createElement('script');
    scr.async = true;
    scr.src = (d.location.protocol === 'https:' ? 'https:' : 'http:') + '//ads.heias.com/x/heias.async/p.min.js';
    var elem = d.getElementsByTagName('script')[0];
    elem.parentNode.insertBefore(scr, elem);

    }(document));
    // EOF HEIAS
}


var google_conversion_id = 991969879;
var google_conversion_label = "HNOcCMmwiQQQ14SB2QM";
var google_custom_params = window.google_tag_params;
var google_remarketing_only = true;

if (document.body == null || __ia_is_ie7_askjeu == true) {
    document.write('<scr' + 'ipt type="text/javascript" src="//www.googleadservices.com/pagead/conversion.js"><' + '/scr' + 'ipt>');
} else {
    var _mt_ex_px_3423 = document.createElement('script');
    _mt_ex_px_3423.src = "//www.googleadservices.com/pagead/conversion.js";
    _mt_ex_px_3423.type = "text/javascript";
    document.body.appendChild(_mt_ex_px_3423);
}

