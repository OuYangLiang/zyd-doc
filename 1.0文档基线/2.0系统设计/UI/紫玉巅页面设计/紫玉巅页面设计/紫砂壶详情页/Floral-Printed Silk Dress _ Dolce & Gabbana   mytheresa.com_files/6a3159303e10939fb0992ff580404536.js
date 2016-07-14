/*  Prototype JavaScript framework, version 1.7
 *  (c) 2005-2010 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

var Prototype = {

  Version: '1.7',

  Browser: (function(){
    var ua = navigator.userAgent;
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    return {
      IE:             !!window.attachEvent && !isOpera,
      Opera:          isOpera,
      WebKit:         ua.indexOf('AppleWebKit/') > -1,
      Gecko:          ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
      MobileSafari:   /Apple.*Mobile/.test(ua)
    }
  })(),

  BrowserFeatures: {
    XPath: !!document.evaluate,

    SelectorsAPI: !!document.querySelector,

    ElementExtensions: (function() {
      var constructor = window.Element || window.HTMLElement;
      return !!(constructor && constructor.prototype);
    })(),
    SpecificElementExtensions: (function() {
      if (typeof window.HTMLDivElement !== 'undefined')
        return true;

      var div = document.createElement('div'),
          form = document.createElement('form'),
          isSupported = false;

      if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
        isSupported = true;
      }

      div = form = null;

      return isSupported;
    })()
  },

  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

  emptyFunction: function() { },

  K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
  Prototype.BrowserFeatures.SpecificElementExtensions = false;


var Abstract = { };


var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

/* Based on Alex Arnell's inheritance implementation. */

var Class = (function() {

  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      if (p === 'toString') return false;
    }
    return true;
  })();

  function subclass() {};
  function create() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0, length = properties.length; i < length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;

    klass.prototype.constructor = klass;
    return klass;
  }

  function addMethods(source) {
    var ancestor   = this.superclass && this.superclass.prototype,
        properties = Object.keys(source);

    if (IS_DONTENUM_BUGGY) {
      if (source.toString != Object.prototype.toString)
        properties.push("toString");
      if (source.valueOf != Object.prototype.valueOf)
        properties.push("valueOf");
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames()[0] == "$super") {
        var method = value;
        value = (function(m) {
          return function() { return ancestor[m].apply(this, arguments); };
        })(property).wrap(method);

        value.valueOf = method.valueOf.bind(method);
        value.toString = method.toString.bind(method);
      }
      this.prototype[property] = value;
    }

    return this;
  }

  return {
    create: create,
    Methods: {
      addMethods: addMethods
    }
  };
})();
(function() {

  var _toString = Object.prototype.toString,
      NULL_TYPE = 'Null',
      UNDEFINED_TYPE = 'Undefined',
      BOOLEAN_TYPE = 'Boolean',
      NUMBER_TYPE = 'Number',
      STRING_TYPE = 'String',
      OBJECT_TYPE = 'Object',
      FUNCTION_CLASS = '[object Function]',
      BOOLEAN_CLASS = '[object Boolean]',
      NUMBER_CLASS = '[object Number]',
      STRING_CLASS = '[object String]',
      ARRAY_CLASS = '[object Array]',
      DATE_CLASS = '[object Date]',
      NATIVE_JSON_STRINGIFY_SUPPORT = window.JSON &&
        typeof JSON.stringify === 'function' &&
        JSON.stringify(0) === '0' &&
        typeof JSON.stringify(Prototype.K) === 'undefined';

  function Type(o) {
    switch(o) {
      case null: return NULL_TYPE;
      case (void 0): return UNDEFINED_TYPE;
    }
    var type = typeof o;
    switch(type) {
      case 'boolean': return BOOLEAN_TYPE;
      case 'number':  return NUMBER_TYPE;
      case 'string':  return STRING_TYPE;
    }
    return OBJECT_TYPE;
  }

  function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }

  function inspect(object) {
    try {
      if (isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  }

  function toJSON(value) {
    return Str('', { '': value }, []);
  }

  function Str(key, holder, stack) {
    var value = holder[key],
        type = typeof value;

    if (Type(value) === OBJECT_TYPE && typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }

    var _class = _toString.call(value);

    switch (_class) {
      case NUMBER_CLASS:
      case BOOLEAN_CLASS:
      case STRING_CLASS:
        value = value.valueOf();
    }

    switch (value) {
      case null: return 'null';
      case true: return 'true';
      case false: return 'false';
    }

    type = typeof value;
    switch (type) {
      case 'string':
        return value.inspect(true);
      case 'number':
        return isFinite(value) ? String(value) : 'null';
      case 'object':

        for (var i = 0, length = stack.length; i < length; i++) {
          if (stack[i] === value) { throw new TypeError(); }
        }
        stack.push(value);

        var partial = [];
        if (_class === ARRAY_CLASS) {
          for (var i = 0, length = value.length; i < length; i++) {
            var str = Str(i, value, stack);
            partial.push(typeof str === 'undefined' ? 'null' : str);
          }
          partial = '[' + partial.join(',') + ']';
        } else {
          var keys = Object.keys(value);
          for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i], str = Str(key, value, stack);
            if (typeof str !== "undefined") {
               partial.push(key.inspect(true)+ ':' + str);
             }
          }
          partial = '{' + partial.join(',') + '}';
        }
        stack.pop();
        return partial;
    }
  }

  function stringify(object) {
    return JSON.stringify(object);
  }

  function toQueryString(object) {
    return $H(object).toQueryString();
  }

  function toHTML(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  }

  function keys(object) {
    if (Type(object) !== OBJECT_TYPE) { throw new TypeError(); }
    var results = [];
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        results.push(property);
      }
    }
    return results;
  }

  function values(object) {
    var results = [];
    for (var property in object)
      results.push(object[property]);
    return results;
  }

  function clone(object) {
    return extend({ }, object);
  }

  function isElement(object) {
    return !!(object && object.nodeType == 1);
  }

  function isArray(object) {
    return _toString.call(object) === ARRAY_CLASS;
  }

  var hasNativeIsArray = (typeof Array.isArray == 'function')
    && Array.isArray([]) && !Array.isArray({});

  if (hasNativeIsArray) {
    isArray = Array.isArray;
  }

  function isHash(object) {
    return object instanceof Hash;
  }

  function isFunction(object) {
    return _toString.call(object) === FUNCTION_CLASS;
  }

  function isString(object) {
    return _toString.call(object) === STRING_CLASS;
  }

  function isNumber(object) {
    return _toString.call(object) === NUMBER_CLASS;
  }

  function isDate(object) {
    return _toString.call(object) === DATE_CLASS;
  }

  function isUndefined(object) {
    return typeof object === "undefined";
  }

  extend(Object, {
    extend:        extend,
    inspect:       inspect,
    toJSON:        NATIVE_JSON_STRINGIFY_SUPPORT ? stringify : toJSON,
    toQueryString: toQueryString,
    toHTML:        toHTML,
    keys:          Object.keys || keys,
    values:        values,
    clone:         clone,
    isElement:     isElement,
    isArray:       isArray,
    isHash:        isHash,
    isFunction:    isFunction,
    isString:      isString,
    isNumber:      isNumber,
    isDate:        isDate,
    isUndefined:   isUndefined
  });
})();
Object.extend(Function.prototype, (function() {
  var slice = Array.prototype.slice;

  function update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }

  function merge(array, args) {
    array = slice.call(array, 0);
    return update(array, args);
  }

  function argumentNames() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  }

  function bind(context) {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = slice.call(arguments, 1);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(context, a);
    }
  }

  function bindAsEventListener(context) {
    var __method = this, args = slice.call(arguments, 1);
    return function(event) {
      var a = update([event || window.event], args);
      return __method.apply(context, a);
    }
  }

  function curry() {
    if (!arguments.length) return this;
    var __method = this, args = slice.call(arguments, 0);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(this, a);
    }
  }

  function delay(timeout) {
    var __method = this, args = slice.call(arguments, 1);
    timeout = timeout * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  }

  function defer() {
    var args = update([0.01], arguments);
    return this.delay.apply(this, args);
  }

  function wrap(wrapper) {
    var __method = this;
    return function() {
      var a = update([__method.bind(this)], arguments);
      return wrapper.apply(this, a);
    }
  }

  function methodize() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      var a = update([this], arguments);
      return __method.apply(null, a);
    };
  }

  return {
    argumentNames:       argumentNames,
    bind:                bind,
    bindAsEventListener: bindAsEventListener,
    curry:               curry,
    delay:               delay,
    defer:               defer,
    wrap:                wrap,
    methodize:           methodize
  }
})());



(function(proto) {


  function toISOString() {
    return this.getUTCFullYear() + '-' +
      (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
      this.getUTCDate().toPaddedString(2) + 'T' +
      this.getUTCHours().toPaddedString(2) + ':' +
      this.getUTCMinutes().toPaddedString(2) + ':' +
      this.getUTCSeconds().toPaddedString(2) + 'Z';
  }


  function toJSON() {
    return this.toISOString();
  }

  if (!proto.toISOString) proto.toISOString = toISOString;
  if (!proto.toJSON) proto.toJSON = toJSON;

})(Date.prototype);


RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
        this.currentlyExecuting = false;
      } catch(e) {
        this.currentlyExecuting = false;
        throw e;
      }
    }
  }
});
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, (function() {
  var NATIVE_JSON_PARSE_SUPPORT = window.JSON &&
    typeof JSON.parse === 'function' &&
    JSON.parse('{"test": true}').test;

  function prepareReplacement(replacement) {
    if (Object.isFunction(replacement)) return replacement;
    var template = new Template(replacement);
    return function(match) { return template.evaluate(match) };
  }

  function gsub(pattern, replacement) {
    var result = '', source = this, match;
    replacement = prepareReplacement(replacement);

    if (Object.isString(pattern))
      pattern = RegExp.escape(pattern);

    if (!(pattern.length || pattern.source)) {
      replacement = replacement('');
      return replacement + source.split('').join(replacement) + replacement;
    }

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  }

  function sub(pattern, replacement, count) {
    replacement = prepareReplacement(replacement);
    count = Object.isUndefined(count) ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  }

  function scan(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  }

  function truncate(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  }

  function strip() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  function stripTags() {
    return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
  }

  function stripScripts() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  }

  function extractScripts() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
        matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  }

  function evalScripts() {
    return this.extractScripts().map(function(script) { return eval(script) });
  }

  function escapeHTML() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function unescapeHTML() {
    return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  }


  function toQueryParams(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift()),
            value = pair.length > 1 ? pair.join('=') : pair[0];

        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  }

  function toArray() {
    return this.split('');
  }

  function succ() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  }

  function times(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  }

  function camelize() {
    return this.replace(/-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }

  function capitalize() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  }

  function underscore() {
    return this.replace(/::/g, '/')
               .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
               .replace(/([a-z\d])([A-Z])/g, '$1_$2')
               .replace(/-/g, '_')
               .toLowerCase();
  }

  function dasherize() {
    return this.replace(/_/g, '-');
  }

  function inspect(useDoubleQuotes) {
    var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
      if (character in String.specialChar) {
        return String.specialChar[character];
      }
      return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  }

  function unfilterJSON(filter) {
    return this.replace(filter || Prototype.JSONFilter, '$1');
  }

  function isJSON() {
    var str = this;
    if (str.blank()) return false;
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return (/^[\],:{}\s]*$/).test(str);
  }

  function evalJSON(sanitize) {
    var json = this.unfilterJSON(),
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    if (cx.test(json)) {
      json = json.replace(cx, function (a) {
        return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      });
    }
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  }

  function parseJSON() {
    var json = this.unfilterJSON();
    return JSON.parse(json);
  }

  function include(pattern) {
    return this.indexOf(pattern) > -1;
  }

  function startsWith(pattern) {
    return this.lastIndexOf(pattern, 0) === 0;
  }

  function endsWith(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.indexOf(pattern, d) === d;
  }

  function empty() {
    return this == '';
  }

  function blank() {
    return /^\s*$/.test(this);
  }

  function interpolate(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }

  return {
    gsub:           gsub,
    sub:            sub,
    scan:           scan,
    truncate:       truncate,
    strip:          String.prototype.trim || strip,
    stripTags:      stripTags,
    stripScripts:   stripScripts,
    extractScripts: extractScripts,
    evalScripts:    evalScripts,
    escapeHTML:     escapeHTML,
    unescapeHTML:   unescapeHTML,
    toQueryParams:  toQueryParams,
    parseQuery:     toQueryParams,
    toArray:        toArray,
    succ:           succ,
    times:          times,
    camelize:       camelize,
    capitalize:     capitalize,
    underscore:     underscore,
    dasherize:      dasherize,
    inspect:        inspect,
    unfilterJSON:   unfilterJSON,
    isJSON:         isJSON,
    evalJSON:       NATIVE_JSON_PARSE_SUPPORT ? parseJSON : evalJSON,
    include:        include,
    startsWith:     startsWith,
    endsWith:       endsWith,
    empty:          empty,
    blank:          blank,
    interpolate:    interpolate
  };
})());

var Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    if (object && Object.isFunction(object.toTemplateReplacements))
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return (match[1] + '');

      var before = match[1] || '';
      if (before == '\\') return match[2];

      var ctx = object, expr = match[3],
          pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }

      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = { };

var Enumerable = (function() {
  function each(iterator, context) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator.call(context, value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  }

  function eachSlice(number, iterator, context) {
    var index = -number, slices = [], array = this.toArray();
    if (number < 1) return array;
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  }

  function all(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator.call(context, value, index);
      if (!result) throw $break;
    });
    return result;
  }

  function any(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator.call(context, value, index))
        throw $break;
    });
    return result;
  }

  function collect(iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function detect(iterator, context) {
    var result;
    this.each(function(value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  }

  function findAll(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function grep(filter, iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(RegExp.escape(filter));

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function include(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  }

  function inGroupsOf(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  }

  function inject(memo, iterator, context) {
    this.each(function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  }

  function invoke(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  }

  function max(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  }

  function min(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  }

  function partition(iterator, context) {
    iterator = iterator || Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator.call(context, value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  }

  function pluck(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  }

  function reject(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function sortBy(iterator, context) {
    return this.map(function(value, index) {
      return {
        value: value,
        criteria: iterator.call(context, value, index)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  }

  function toArray() {
    return this.map();
  }

  function zip() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  }

  function size() {
    return this.toArray().length;
  }

  function inspect() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }









  return {
    each:       each,
    eachSlice:  eachSlice,
    all:        all,
    every:      all,
    any:        any,
    some:       any,
    collect:    collect,
    map:        collect,
    detect:     detect,
    findAll:    findAll,
    select:     findAll,
    filter:     findAll,
    grep:       grep,
    include:    include,
    member:     include,
    inGroupsOf: inGroupsOf,
    inject:     inject,
    invoke:     invoke,
    max:        max,
    min:        min,
    partition:  partition,
    pluck:      pluck,
    reject:     reject,
    sortBy:     sortBy,
    toArray:    toArray,
    entries:    toArray,
    zip:        zip,
    size:       size,
    inspect:    inspect,
    find:       detect
  };
})();

function $A(iterable) {
  if (!iterable) return [];
  if ('toArray' in Object(iterable)) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}


function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

Array.from = $A;


(function() {
  var arrayProto = Array.prototype,
      slice = arrayProto.slice,
      _each = arrayProto.forEach; // use native browser JS 1.6 implementation if available

  function each(iterator, context) {
    for (var i = 0, length = this.length >>> 0; i < length; i++) {
      if (i in this) iterator.call(context, this[i], i, this);
    }
  }
  if (!_each) _each = each;

  function clear() {
    this.length = 0;
    return this;
  }

  function first() {
    return this[0];
  }

  function last() {
    return this[this.length - 1];
  }

  function compact() {
    return this.select(function(value) {
      return value != null;
    });
  }

  function flatten() {
    return this.inject([], function(array, value) {
      if (Object.isArray(value))
        return array.concat(value.flatten());
      array.push(value);
      return array;
    });
  }

  function without() {
    var values = slice.call(arguments, 0);
    return this.select(function(value) {
      return !values.include(value);
    });
  }

  function reverse(inline) {
    return (inline === false ? this.toArray() : this)._reverse();
  }

  function uniq(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  }

  function intersect(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  }


  function clone() {
    return slice.call(this, 0);
  }

  function size() {
    return this.length;
  }

  function inspect() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  }

  function indexOf(item, i) {
    i || (i = 0);
    var length = this.length;
    if (i < 0) i = length + i;
    for (; i < length; i++)
      if (this[i] === item) return i;
    return -1;
  }

  function lastIndexOf(item, i) {
    i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
    var n = this.slice(0, i).reverse().indexOf(item);
    return (n < 0) ? n : i - n - 1;
  }

  function concat() {
    var array = slice.call(this, 0), item;
    for (var i = 0, length = arguments.length; i < length; i++) {
      item = arguments[i];
      if (Object.isArray(item) && !('callee' in item)) {
        for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
          array.push(item[j]);
      } else {
        array.push(item);
      }
    }
    return array;
  }

  Object.extend(arrayProto, Enumerable);

  if (!arrayProto._reverse)
    arrayProto._reverse = arrayProto.reverse;

  Object.extend(arrayProto, {
    _each:     _each,
    clear:     clear,
    first:     first,
    last:      last,
    compact:   compact,
    flatten:   flatten,
    without:   without,
    reverse:   reverse,
    uniq:      uniq,
    intersect: intersect,
    clone:     clone,
    toArray:   clone,
    size:      size,
    inspect:   inspect
  });

  var CONCAT_ARGUMENTS_BUGGY = (function() {
    return [].concat(arguments)[0][0] !== 1;
  })(1,2)

  if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;

  if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
  if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();
function $H(object) {
  return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {
  function initialize(object) {
    this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
  }


  function _each(iterator) {
    for (var key in this._object) {
      var value = this._object[key], pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  }

  function set(key, value) {
    return this._object[key] = value;
  }

  function get(key) {
    if (this._object[key] !== Object.prototype[key])
      return this._object[key];
  }

  function unset(key) {
    var value = this._object[key];
    delete this._object[key];
    return value;
  }

  function toObject() {
    return Object.clone(this._object);
  }



  function keys() {
    return this.pluck('key');
  }

  function values() {
    return this.pluck('value');
  }

  function index(value) {
    var match = this.detect(function(pair) {
      return pair.value === value;
    });
    return match && match.key;
  }

  function merge(object) {
    return this.clone().update(object);
  }

  function update(object) {
    return new Hash(object).inject(this, function(result, pair) {
      result.set(pair.key, pair.value);
      return result;
    });
  }

  function toQueryPair(key, value) {
    if (Object.isUndefined(value)) return key;
    return key + '=' + encodeURIComponent(String.interpret(value));
  }

  function toQueryString() {
    return this.inject([], function(results, pair) {
      var key = encodeURIComponent(pair.key), values = pair.value;

      if (values && typeof values == 'object') {
        if (Object.isArray(values)) {
          var queryValues = [];
          for (var i = 0, len = values.length, value; i < len; i++) {
            value = values[i];
            queryValues.push(toQueryPair(key, value));
          }
          return results.concat(queryValues);
        }
      } else results.push(toQueryPair(key, values));
      return results;
    }).join('&');
  }

  function inspect() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  }

  function clone() {
    return new Hash(this);
  }

  return {
    initialize:             initialize,
    _each:                  _each,
    set:                    set,
    get:                    get,
    unset:                  unset,
    toObject:               toObject,
    toTemplateReplacements: toObject,
    keys:                   keys,
    values:                 values,
    index:                  index,
    merge:                  merge,
    update:                 update,
    toQueryString:          toQueryString,
    inspect:                inspect,
    toJSON:                 toObject,
    clone:                  clone
  };
})());

Hash.from = $H;
Object.extend(Number.prototype, (function() {
  function toColorPart() {
    return this.toPaddedString(2, 16);
  }

  function succ() {
    return this + 1;
  }

  function times(iterator, context) {
    $R(0, this, true).each(iterator, context);
    return this;
  }

  function toPaddedString(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  }

  function abs() {
    return Math.abs(this);
  }

  function round() {
    return Math.round(this);
  }

  function ceil() {
    return Math.ceil(this);
  }

  function floor() {
    return Math.floor(this);
  }

  return {
    toColorPart:    toColorPart,
    succ:           succ,
    times:          times,
    toPaddedString: toPaddedString,
    abs:            abs,
    round:          round,
    ceil:           ceil,
    floor:          floor
  };
})());

function $R(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var ObjectRange = Class.create(Enumerable, (function() {
  function initialize(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  }

  function _each(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  }

  function include(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }

  return {
    initialize: initialize,
    _each:      _each,
    include:    include
  };
})());



var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
};

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ },
  onComplete: function() { Ajax.activeRequestCount-- }
});
Ajax.Base = Class.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});
Ajax.Request = Class.create(Ajax.Base, {
  _complete: false,

  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.isString(this.options.parameters) ?
          this.options.parameters :
          Object.toQueryString(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      params += (params ? '&' : '') + "_method=" + this.method;
      this.method = 'post';
    }

    if (params && this.method === 'get') {
      this.url += (this.url.include('?') ? '&' : '?') + params;
    }

    this.parameters = params.toQueryParams();

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300) || status == 304;
  },

  getStatus: function() {
    try {
      if (this.transport.status === 1223) return 204;
      return this.transport.status || 0;
    } catch (e) { return 0 }
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null; }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];








Ajax.Response = Class.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;

    if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }

    if (readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },

  status:      0,

  statusText: '',

  getStatus: Ajax.Request.prototype.getStatus,

  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },

  getHeader: Ajax.Request.prototype.getHeader,

  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null }
  },

  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },

  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },

  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },

  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

Ajax.Updater = Class.create(Ajax.Request, {
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

    if (!options.evalScripts) responseText = responseText.stripScripts();

    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      }
      else receiver.update(responseText);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});


function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}

/*--------------------------------------------------------------------------*/

if (!Node) var Node = { };

if (!Node.ELEMENT_NODE) {
  Object.extend(Node, {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  });
}



(function(global) {
  function shouldUseCache(tagName, attributes) {
    if (tagName === 'select') return false;
    if ('type' in attributes) return false;
    return true;
  }

  var HAS_EXTENDED_CREATE_ELEMENT_SYNTAX = (function(){
    try {
      var el = document.createElement('<input name="x">');
      return el.tagName.toLowerCase() === 'input' && el.name === 'x';
    }
    catch(err) {
      return false;
    }
  })();

  var element = global.Element;

  global.Element = function(tagName, attributes) {
    attributes = attributes || { };
    tagName = tagName.toLowerCase();
    var cache = Element.cache;

    if (HAS_EXTENDED_CREATE_ELEMENT_SYNTAX && attributes.name) {
      tagName = '<' + tagName + ' name="' + attributes.name + '">';
      delete attributes.name;
      return Element.writeAttribute(document.createElement(tagName), attributes);
    }

    if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));

    var node = shouldUseCache(tagName, attributes) ?
     cache[tagName].cloneNode(false) : document.createElement(tagName);

    return Element.writeAttribute(node, attributes);
  };

  Object.extend(global.Element, element || { });
  if (element) global.Element.prototype = element.prototype;

})(this);

Element.idCounter = 1;
Element.cache = { };

Element._purgeElement = function(element) {
  var uid = element._prototypeUID;
  if (uid) {
    Element.stopObserving(element);
    element._prototypeUID = void 0;
    delete Element.Storage[uid];
  }
}

Element.Methods = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },

  hide: function(element) {
    element = $(element);
    element.style.display = 'none';
    return element;
  },

  show: function(element) {
    element = $(element);
    element.style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: (function(){

    var SELECT_ELEMENT_INNERHTML_BUGGY = (function(){
      var el = document.createElement("select"),
          isBuggy = true;
      el.innerHTML = "<option value=\"test\">test</option>";
      if (el.options && el.options[0]) {
        isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
      }
      el = null;
      return isBuggy;
    })();

    var TABLE_ELEMENT_INNERHTML_BUGGY = (function(){
      try {
        var el = document.createElement("table");
        if (el && el.tBodies) {
          el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
          var isBuggy = typeof el.tBodies[0] == "undefined";
          el = null;
          return isBuggy;
        }
      } catch (e) {
        return true;
      }
    })();

    var LINK_ELEMENT_INNERHTML_BUGGY = (function() {
      try {
        var el = document.createElement('div');
        el.innerHTML = "<link>";
        var isBuggy = (el.childNodes.length === 0);
        el = null;
        return isBuggy;
      } catch(e) {
        return true;
      }
    })();

    var ANY_INNERHTML_BUGGY = SELECT_ELEMENT_INNERHTML_BUGGY ||
     TABLE_ELEMENT_INNERHTML_BUGGY || LINK_ELEMENT_INNERHTML_BUGGY;

    var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function () {
      var s = document.createElement("script"),
          isBuggy = false;
      try {
        s.appendChild(document.createTextNode(""));
        isBuggy = !s.firstChild ||
          s.firstChild && s.firstChild.nodeType !== 3;
      } catch (e) {
        isBuggy = true;
      }
      s = null;
      return isBuggy;
    })();


    function update(element, content) {
      element = $(element);
      var purgeElement = Element._purgeElement;

      var descendants = element.getElementsByTagName('*'),
       i = descendants.length;
      while (i--) purgeElement(descendants[i]);

      if (content && content.toElement)
        content = content.toElement();

      if (Object.isElement(content))
        return element.update().insert(content);

      content = Object.toHTML(content);

      var tagName = element.tagName.toUpperCase();

      if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
        element.text = content;
        return element;
      }

      if (ANY_INNERHTML_BUGGY) {
        if (tagName in Element._insertionTranslations.tags) {
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          Element._getContentFromAnonymousElement(tagName, content.stripScripts())
            .each(function(node) {
              element.appendChild(node)
            });
        } else if (LINK_ELEMENT_INNERHTML_BUGGY && Object.isString(content) && content.indexOf('<link') > -1) {
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          var nodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts(), true);
          nodes.each(function(node) { element.appendChild(node) });
        }
        else {
          element.innerHTML = content.stripScripts();
        }
      }
      else {
        element.innerHTML = content.stripScripts();
      }

      content.evalScripts.bind(content).defer();
      return element;
    }

    return update;
  })(),

  replace: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    else if (!Object.isElement(content)) {
      content = Object.toHTML(content);
      var range = element.ownerDocument.createRange();
      range.selectNode(element);
      content.evalScripts.bind(content).defer();
      content = range.createContextualFragment(content.stripScripts());
    }
    element.parentNode.replaceChild(content, element);
    return element;
  },

  insert: function(element, insertions) {
    element = $(element);

    if (Object.isString(insertions) || Object.isNumber(insertions) ||
        Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
          insertions = {bottom:insertions};

    var content, insert, tagName, childNodes;

    for (var position in insertions) {
      content  = insertions[position];
      position = position.toLowerCase();
      insert = Element._insertionTranslations[position];

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        insert(element, content);
        continue;
      }

      content = Object.toHTML(content);

      tagName = ((position == 'before' || position == 'after')
        ? element.parentNode : element).tagName.toUpperCase();

      childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

      if (position == 'top' || position == 'after') childNodes.reverse();
      childNodes.each(insert.curry(element));

      content.evalScripts.bind(content).defer();
    }

    return element;
  },

  wrap: function(element, wrapper, attributes) {
    element = $(element);
    if (Object.isElement(wrapper))
      $(wrapper).writeAttribute(attributes || { });
    else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
    else wrapper = new Element('div', wrapper);
    if (element.parentNode)
      element.parentNode.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(),
          attribute = pair.last(),
          value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  recursivelyCollect: function(element, property, maximumLength) {
    element = $(element);
    maximumLength = maximumLength || -1;
    var elements = [];

    while (element = element[property]) {
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
      if (elements.length == maximumLength)
        break;
    }

    return elements;
  },

  ancestors: function(element) {
    return Element.recursivelyCollect(element, 'parentNode');
  },

  descendants: function(element) {
    return Element.select(element, "*");
  },

  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },

  immediateDescendants: function(element) {
    var results = [], child = $(element).firstChild;
    while (child) {
      if (child.nodeType === 1) {
        results.push(Element.extend(child));
      }
      child = child.nextSibling;
    }
    return results;
  },

  previousSiblings: function(element, maximumLength) {
    return Element.recursivelyCollect(element, 'previousSibling');
  },

  nextSiblings: function(element) {
    return Element.recursivelyCollect(element, 'nextSibling');
  },

  siblings: function(element) {
    element = $(element);
    return Element.previousSiblings(element).reverse()
      .concat(Element.nextSiblings(element));
  },

  match: function(element, selector) {
    element = $(element);
    if (Object.isString(selector))
      return Prototype.Selector.match(element, selector);
    return selector.match(element);
  },

  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = Element.ancestors(element);
    return Object.isNumber(expression) ? ancestors[expression] :
      Prototype.Selector.find(ancestors, expression, index);
  },

  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return Element.firstDescendant(element);
    return Object.isNumber(expression) ? Element.descendants(element)[expression] :
      Element.select(element, expression)[index || 0];
  },

  previous: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.previousSiblings(), expression, index);
    } else {
      return element.recursivelyCollect("previousSibling", index + 1)[index];
    }
  },

  next: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.nextSiblings(), expression, index);
    } else {
      var maximumLength = Object.isNumber(index) ? index + 1 : 1;
      return element.recursivelyCollect("nextSibling", index + 1)[index];
    }
  },


  select: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element);
  },

  adjacent: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element.parentNode).without(element);
  },

  identify: function(element) {
    element = $(element);
    var id = Element.readAttribute(element, 'id');
    if (id) return id;
    do { id = 'anonymous_element_' + Element.idCounter++ } while ($(id));
    Element.writeAttribute(element, 'id', id);
    return id;
  },

  readAttribute: function(element, name) {
    element = $(element);
    if (Prototype.Browser.IE) {
      var t = Element._attributeTranslations.read;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name]) name = t.names[name];
      if (name.include(':')) {
        return (!element.attributes || !element.attributes[name]) ? null :
         element.attributes[name].value;
      }
    }
    return element.getAttribute(name);
  },

  writeAttribute: function(element, name, value) {
    element = $(element);
    var attributes = { }, t = Element._attributeTranslations.write;

    if (typeof name == 'object') attributes = name;
    else attributes[name] = Object.isUndefined(value) ? true : value;

    for (var attr in attributes) {
      name = t.names[attr] || attr;
      value = attributes[attr];
      if (t.values[attr]) name = t.values[attr](element, value);
      if (value === false || value === null)
        element.removeAttribute(name);
      else if (value === true)
        element.setAttribute(name, name);
      else element.setAttribute(name, value);
    }
    return element;
  },

  getHeight: function(element) {
    return Element.getDimensions(element).height;
  },

  getWidth: function(element) {
    return Element.getDimensions(element).width;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    if (!Element.hasClassName(element, className))
      element.className += (element.className ? ' ' : '') + className;
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
    return element;
  },

  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    return Element[Element.hasClassName(element, className) ?
      'removeClassName' : 'addClassName'](element, className);
  },

  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  empty: function(element) {
    return $(element).innerHTML.blank();
  },

  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);

    if (element.compareDocumentPosition)
      return (element.compareDocumentPosition(ancestor) & 8) === 8;

    if (ancestor.contains)
      return ancestor.contains(element) && ancestor !== element;

    while (element = element.parentNode)
      if (element == ancestor) return true;

    return false;
  },

  scrollTo: function(element) {
    element = $(element);
    var pos = Element.cumulativeOffset(element);
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  getStyle: function(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value || value == 'auto') {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  },

  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },

  setStyle: function(element, styles) {
    element = $(element);
    var elementStyle = element.style, match;
    if (Object.isString(styles)) {
      element.style.cssText += ';' + styles;
      return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
            property] = styles[property];

    return element;
  },

  setOpacity: function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
    return element;
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      if (Prototype.Browser.Opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = Element.getStyle(element, 'overflow') || 'auto';
    if (element._overflow !== 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  },

  clonePosition: function(element, source) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || { });

    source = $(source);
    var p = Element.viewportOffset(source), delta = [0, 0], parent = null;

    element = $(element);

    if (Element.getStyle(element, 'position') == 'absolute') {
      parent = Element.getOffsetParent(element);
      delta = Element.viewportOffset(parent);
    }

    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    if (options.setLeft)   element.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if (options.setTop)    element.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if (options.setWidth)  element.style.width = source.offsetWidth + 'px';
    if (options.setHeight) element.style.height = source.offsetHeight + 'px';
    return element;
  }
};

Object.extend(Element.Methods, {
  getElementsBySelector: Element.Methods.select,

  childElements: Element.Methods.immediateDescendants
});

Element._attributeTranslations = {
  write: {
    names: {
      className: 'class',
      htmlFor:   'for'
    },
    values: { }
  }
};

if (Prototype.Browser.Opera) {
  Element.Methods.getStyle = Element.Methods.getStyle.wrap(
    function(proceed, element, style) {
      switch (style) {
        case 'height': case 'width':
          if (!Element.visible(element)) return null;

          var dim = parseInt(proceed(element, style), 10);

          if (dim !== element['offset' + style.capitalize()])
            return dim + 'px';

          var properties;
          if (style === 'height') {
            properties = ['border-top-width', 'padding-top',
             'padding-bottom', 'border-bottom-width'];
          }
          else {
            properties = ['border-left-width', 'padding-left',
             'padding-right', 'border-right-width'];
          }
          return properties.inject(dim, function(memo, property) {
            var val = proceed(element, property);
            return val === null ? memo : memo - parseInt(val, 10);
          }) + 'px';
        default: return proceed(element, style);
      }
    }
  );

  Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
      if (attribute === 'title') return element.title;
      return proceed(element, attribute);
    }
  );
}

else if (Prototype.Browser.IE) {
  Element.Methods.getStyle = function(element, style) {
    element = $(element);
    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
    var value = element.style[style];
    if (!value && element.currentStyle) value = element.currentStyle[style];

    if (style == 'opacity') {
      if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if (value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }

    if (value == 'auto') {
      if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
        return element['offset' + style.capitalize()] + 'px';
      return null;
    }
    return value;
  };

  Element.Methods.setOpacity = function(element, value) {
    function stripAlpha(filter){
      return filter.replace(/alpha\([^\)]*\)/gi,'');
    }
    element = $(element);
    var currentStyle = element.currentStyle;
    if ((currentStyle && !currentStyle.hasLayout) ||
      (!currentStyle && element.style.zoom == 'normal'))
        element.style.zoom = 1;

    var filter = element.getStyle('filter'), style = element.style;
    if (value == 1 || value === '') {
      (filter = stripAlpha(filter)) ?
        style.filter = filter : style.removeAttribute('filter');
      return element;
    } else if (value < 0.00001) value = 0;
    style.filter = stripAlpha(filter) +
      'alpha(opacity=' + (value * 100) + ')';
    return element;
  };

  Element._attributeTranslations = (function(){

    var classProp = 'className',
        forProp = 'for',
        el = document.createElement('div');

    el.setAttribute(classProp, 'x');

    if (el.className !== 'x') {
      el.setAttribute('class', 'x');
      if (el.className === 'x') {
        classProp = 'class';
      }
    }
    el = null;

    el = document.createElement('label');
    el.setAttribute(forProp, 'x');
    if (el.htmlFor !== 'x') {
      el.setAttribute('htmlFor', 'x');
      if (el.htmlFor === 'x') {
        forProp = 'htmlFor';
      }
    }
    el = null;

    return {
      read: {
        names: {
          'class':      classProp,
          'className':  classProp,
          'for':        forProp,
          'htmlFor':    forProp
        },
        values: {
          _getAttr: function(element, attribute) {
            return element.getAttribute(attribute);
          },
          _getAttr2: function(element, attribute) {
            return element.getAttribute(attribute, 2);
          },
          _getAttrNode: function(element, attribute) {
            var node = element.getAttributeNode(attribute);
            return node ? node.value : "";
          },
          _getEv: (function(){

            var el = document.createElement('div'), f;
            el.onclick = Prototype.emptyFunction;
            var value = el.getAttribute('onclick');

            if (String(value).indexOf('{') > -1) {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                attribute = attribute.toString();
                attribute = attribute.split('{')[1];
                attribute = attribute.split('}')[0];
                return attribute.strip();
              };
            }
            else if (value === '') {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                return attribute.strip();
              };
            }
            el = null;
            return f;
          })(),
          _flag: function(element, attribute) {
            return $(element).hasAttribute(attribute) ? attribute : null;
          },
          style: function(element) {
            return element.style.cssText.toLowerCase();
          },
          title: function(element) {
            return element.title;
          }
        }
      }
    }
  })();

  Element._attributeTranslations.write = {
    names: Object.extend({
      cellpadding: 'cellPadding',
      cellspacing: 'cellSpacing'
    }, Element._attributeTranslations.read.names),
    values: {
      checked: function(element, value) {
        element.checked = !!value;
      },

      style: function(element, value) {
        element.style.cssText = value ? value : '';
      }
    }
  };

  Element._attributeTranslations.has = {};

  $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
      'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
    Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
    Element._attributeTranslations.has[attr.toLowerCase()] = attr;
  });

  (function(v) {
    Object.extend(v, {
      href:        v._getAttr2,
      src:         v._getAttr2,
      type:        v._getAttr,
      action:      v._getAttrNode,
      disabled:    v._flag,
      checked:     v._flag,
      readonly:    v._flag,
      multiple:    v._flag,
      onload:      v._getEv,
      onunload:    v._getEv,
      onclick:     v._getEv,
      ondblclick:  v._getEv,
      onmousedown: v._getEv,
      onmouseup:   v._getEv,
      onmouseover: v._getEv,
      onmousemove: v._getEv,
      onmouseout:  v._getEv,
      onfocus:     v._getEv,
      onblur:      v._getEv,
      onkeypress:  v._getEv,
      onkeydown:   v._getEv,
      onkeyup:     v._getEv,
      onsubmit:    v._getEv,
      onreset:     v._getEv,
      onselect:    v._getEv,
      onchange:    v._getEv
    });
  })(Element._attributeTranslations.read.values);

  if (Prototype.BrowserFeatures.ElementExtensions) {
    (function() {
      function _descendants(element) {
        var nodes = element.getElementsByTagName('*'), results = [];
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName !== "!") // Filter out comment nodes.
            results.push(node);
        return results;
      }

      Element.Methods.down = function(element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return element.firstDescendant();
        return Object.isNumber(expression) ? _descendants(element)[expression] :
          Element.select(element, expression)[index || 0];
      }
    })();
  }

}

else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
    return element;
  };
}

else if (Prototype.Browser.WebKit) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;

    if (value == 1)
      if (element.tagName.toUpperCase() == 'IMG' && element.width) {
        element.width++; element.width--;
      } else try {
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
      } catch (e) { }

    return element;
  };
}

if ('outerHTML' in document.documentElement) {
  Element.Methods.replace = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) {
      element.parentNode.replaceChild(content, element);
      return element;
    }

    content = Object.toHTML(content);
    var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

    if (Element._insertionTranslations.tags[tagName]) {
      var nextSibling = element.next(),
          fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
      parent.removeChild(element);
      if (nextSibling)
        fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
      else
        fragments.each(function(node) { parent.appendChild(node) });
    }
    else element.outerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

Element._returnOffset = function(l, t) {
  var result = [l, t];
  result.left = l;
  result.top = t;
  return result;
};

Element._getContentFromAnonymousElement = function(tagName, html, force) {
  var div = new Element('div'),
      t = Element._insertionTranslations.tags[tagName];

  var workaround = false;
  if (t) workaround = true;
  else if (force) {
    workaround = true;
    t = ['', '', 0];
  }

  if (workaround) {
    div.innerHTML = '&nbsp;' + t[0] + html + t[1];
    div.removeChild(div.firstChild);
    for (var i = t[2]; i--; ) {
      div = div.firstChild;
    }
  }
  else {
    div.innerHTML = html;
  }
  return $A(div.childNodes);
};

Element._insertionTranslations = {
  before: function(element, node) {
    element.parentNode.insertBefore(node, element);
  },
  top: function(element, node) {
    element.insertBefore(node, element.firstChild);
  },
  bottom: function(element, node) {
    element.appendChild(node);
  },
  after: function(element, node) {
    element.parentNode.insertBefore(node, element.nextSibling);
  },
  tags: {
    TABLE:  ['<table>',                '</table>',                   1],
    TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
    TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
    TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
    SELECT: ['<select>',               '</select>',                  1]
  }
};

(function() {
  var tags = Element._insertionTranslations.tags;
  Object.extend(tags, {
    THEAD: tags.TBODY,
    TFOOT: tags.TBODY,
    TH:    tags.TD
  });
})();

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    attribute = Element._attributeTranslations.has[attribute] || attribute;
    var node = $(element).getAttributeNode(attribute);
    return !!(node && node.specified);
  }
};

Element.Methods.ByTag = { };

Object.extend(Element, Element.Methods);

(function(div) {

  if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
    window.HTMLElement = { };
    window.HTMLElement.prototype = div['__proto__'];
    Prototype.BrowserFeatures.ElementExtensions = true;
  }

  div = null;

})(document.createElement('div'));

Element.extend = (function() {

  function checkDeficiency(tagName) {
    if (typeof window.Element != 'undefined') {
      var proto = window.Element.prototype;
      if (proto) {
        var id = '_' + (Math.random()+'').slice(2),
            el = document.createElement(tagName);
        proto[id] = 'x';
        var isBuggy = (el[id] !== 'x');
        delete proto[id];
        el = null;
        return isBuggy;
      }
    }
    return false;
  }

  function extendElementWith(element, methods) {
    for (var property in methods) {
      var value = methods[property];
      if (Object.isFunction(value) && !(property in element))
        element[property] = value.methodize();
    }
  }

  var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');

  if (Prototype.BrowserFeatures.SpecificElementExtensions) {
    if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
      return function(element) {
        if (element && typeof element._extendedByPrototype == 'undefined') {
          var t = element.tagName;
          if (t && (/^(?:object|applet|embed)$/i.test(t))) {
            extendElementWith(element, Element.Methods);
            extendElementWith(element, Element.Methods.Simulated);
            extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
          }
        }
        return element;
      }
    }
    return Prototype.K;
  }

  var Methods = { }, ByTag = Element.Methods.ByTag;

  var extend = Object.extend(function(element) {
    if (!element || typeof element._extendedByPrototype != 'undefined' ||
        element.nodeType != 1 || element == window) return element;

    var methods = Object.clone(Methods),
        tagName = element.tagName.toUpperCase();

    if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

    extendElementWith(element, methods);

    element._extendedByPrototype = Prototype.emptyFunction;
    return element;

  }, {
    refresh: function() {
      if (!Prototype.BrowserFeatures.ElementExtensions) {
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
      }
    }
  });

  extend.refresh();
  return extend;
})();

if (document.documentElement.hasAttribute) {
  Element.hasAttribute = function(element, attribute) {
    return element.hasAttribute(attribute);
  };
}
else {
  Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
}

Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

  if (!methods) {
    Object.extend(Form, Form.Methods);
    Object.extend(Form.Element, Form.Element.Methods);
    Object.extend(Element.Methods.ByTag, {
      "FORM":     Object.clone(Form.Methods),
      "INPUT":    Object.clone(Form.Element.Methods),
      "SELECT":   Object.clone(Form.Element.Methods),
      "TEXTAREA": Object.clone(Form.Element.Methods),
      "BUTTON":   Object.clone(Form.Element.Methods)
    });
  }

  if (arguments.length == 2) {
    var tagName = methods;
    methods = arguments[1];
  }

  if (!tagName) Object.extend(Element.Methods, methods || { });
  else {
    if (Object.isArray(tagName)) tagName.each(extend);
    else extend(tagName);
  }

  function extend(tagName) {
    tagName = tagName.toUpperCase();
    if (!Element.Methods.ByTag[tagName])
      Element.Methods.ByTag[tagName] = { };
    Object.extend(Element.Methods.ByTag[tagName], methods);
  }

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    for (var property in methods) {
      var value = methods[property];
      if (!Object.isFunction(value)) continue;
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = value.methodize();
    }
  }

  function findDOMClass(tagName) {
    var klass;
    var trans = {
      "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
      "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
      "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
      "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
      "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];

    var element = document.createElement(tagName),
        proto = element['__proto__'] || element.constructor.prototype;

    element = null;
    return proto;
  }

  var elementPrototype = window.HTMLElement ? HTMLElement.prototype :
   Element.prototype;

  if (F.ElementExtensions) {
    copy(Element.Methods, elementPrototype);
    copy(Element.Methods.Simulated, elementPrototype, true);
  }

  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (Object.isUndefined(klass)) continue;
      copy(T[tag], klass.prototype);
    }
  }

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;

  if (Element.extend.refresh) Element.extend.refresh();
  Element.cache = { };
};


document.viewport = {

  getDimensions: function() {
    return { width: this.getWidth(), height: this.getHeight() };
  },

  getScrollOffsets: function() {
    return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop);
  }
};

(function(viewport) {
  var B = Prototype.Browser, doc = document, element, property = {};

  function getRootElement() {
    if (B.WebKit && !doc.evaluate)
      return document;

    if (B.Opera && window.parseFloat(window.opera.version()) < 9.5)
      return document.body;

    return document.documentElement;
  }

  function define(D) {
    if (!element) element = getRootElement();

    property[D] = 'client' + D;

    viewport['get' + D] = function() { return element[property[D]] };
    return viewport['get' + D]();
  }

  viewport.getWidth  = define.curry('Width');

  viewport.getHeight = define.curry('Height');
})(document.viewport);


Element.Storage = {
  UID: 1
};

Element.addMethods({
  getStorage: function(element) {
    if (!(element = $(element))) return;

    var uid;
    if (element === window) {
      uid = 0;
    } else {
      if (typeof element._prototypeUID === "undefined")
        element._prototypeUID = Element.Storage.UID++;
      uid = element._prototypeUID;
    }

    if (!Element.Storage[uid])
      Element.Storage[uid] = $H();

    return Element.Storage[uid];
  },

  store: function(element, key, value) {
    if (!(element = $(element))) return;

    if (arguments.length === 2) {
      Element.getStorage(element).update(key);
    } else {
      Element.getStorage(element).set(key, value);
    }

    return element;
  },

  retrieve: function(element, key, defaultValue) {
    if (!(element = $(element))) return;
    var hash = Element.getStorage(element), value = hash.get(key);

    if (Object.isUndefined(value)) {
      hash.set(key, defaultValue);
      value = defaultValue;
    }

    return value;
  },

  clone: function(element, deep) {
    if (!(element = $(element))) return;
    var clone = element.cloneNode(deep);
    clone._prototypeUID = void 0;
    if (deep) {
      var descendants = Element.select(clone, '*'),
          i = descendants.length;
      while (i--) {
        descendants[i]._prototypeUID = void 0;
      }
    }
    return Element.extend(clone);
  },

  purge: function(element) {
    if (!(element = $(element))) return;
    var purgeElement = Element._purgeElement;

    purgeElement(element);

    var descendants = element.getElementsByTagName('*'),
     i = descendants.length;

    while (i--) purgeElement(descendants[i]);

    return null;
  }
});

(function() {

  function toDecimal(pctString) {
    var match = pctString.match(/^(\d+)%?$/i);
    if (!match) return null;
    return (Number(match[1]) / 100);
  }

  function getPixelValue(value, property, context) {
    var element = null;
    if (Object.isElement(value)) {
      element = value;
      value = element.getStyle(property);
    }

    if (value === null) {
      return null;
    }

    if ((/^(?:-)?\d+(\.\d+)?(px)?$/i).test(value)) {
      return window.parseFloat(value);
    }

    var isPercentage = value.include('%'), isViewport = (context === document.viewport);

    if (/\d/.test(value) && element && element.runtimeStyle && !(isPercentage && isViewport)) {
      var style = element.style.left, rStyle = element.runtimeStyle.left;
      element.runtimeStyle.left = element.currentStyle.left;
      element.style.left = value || 0;
      value = element.style.pixelLeft;
      element.style.left = style;
      element.runtimeStyle.left = rStyle;

      return value;
    }

    if (element && isPercentage) {
      context = context || element.parentNode;
      var decimal = toDecimal(value);
      var whole = null;
      var position = element.getStyle('position');

      var isHorizontal = property.include('left') || property.include('right') ||
       property.include('width');

      var isVertical =  property.include('top') || property.include('bottom') ||
        property.include('height');

      if (context === document.viewport) {
        if (isHorizontal) {
          whole = document.viewport.getWidth();
        } else if (isVertical) {
          whole = document.viewport.getHeight();
        }
      } else {
        if (isHorizontal) {
          whole = $(context).measure('width');
        } else if (isVertical) {
          whole = $(context).measure('height');
        }
      }

      return (whole === null) ? 0 : whole * decimal;
    }

    return 0;
  }

  function toCSSPixels(number) {
    if (Object.isString(number) && number.endsWith('px')) {
      return number;
    }
    return number + 'px';
  }

  function isDisplayed(element) {
    var originalElement = element;
    while (element && element.parentNode) {
      var display = element.getStyle('display');
      if (display === 'none') {
        return false;
      }
      element = $(element.parentNode);
    }
    return true;
  }

  var hasLayout = Prototype.K;
  if ('currentStyle' in document.documentElement) {
    hasLayout = function(element) {
      if (!element.currentStyle.hasLayout) {
        element.style.zoom = 1;
      }
      return element;
    };
  }

  function cssNameFor(key) {
    if (key.include('border')) key = key + '-width';
    return key.camelize();
  }

  Element.Layout = Class.create(Hash, {
    initialize: function($super, element, preCompute) {
      $super();
      this.element = $(element);

      Element.Layout.PROPERTIES.each( function(property) {
        this._set(property, null);
      }, this);

      if (preCompute) {
        this._preComputing = true;
        this._begin();
        Element.Layout.PROPERTIES.each( this._compute, this );
        this._end();
        this._preComputing = false;
      }
    },

    _set: function(property, value) {
      return Hash.prototype.set.call(this, property, value);
    },

    set: function(property, value) {
      throw "Properties of Element.Layout are read-only.";
    },

    get: function($super, property) {
      var value = $super(property);
      return value === null ? this._compute(property) : value;
    },

    _begin: function() {
      if (this._prepared) return;

      var element = this.element;
      if (isDisplayed(element)) {
        this._prepared = true;
        return;
      }

      var originalStyles = {
        position:   element.style.position   || '',
        width:      element.style.width      || '',
        visibility: element.style.visibility || '',
        display:    element.style.display    || ''
      };

      element.store('prototype_original_styles', originalStyles);

      var position = element.getStyle('position'),
       width = element.getStyle('width');

      if (width === "0px" || width === null) {
        element.style.display = 'block';
        width = element.getStyle('width');
      }

      var context = (position === 'fixed') ? document.viewport :
       element.parentNode;

      element.setStyle({
        position:   'absolute',
        visibility: 'hidden',
        display:    'block'
      });

      var positionedWidth = element.getStyle('width');

      var newWidth;
      if (width && (positionedWidth === width)) {
        newWidth = getPixelValue(element, 'width', context);
      } else if (position === 'absolute' || position === 'fixed') {
        newWidth = getPixelValue(element, 'width', context);
      } else {
        var parent = element.parentNode, pLayout = $(parent).getLayout();

        newWidth = pLayout.get('width') -
         this.get('margin-left') -
         this.get('border-left') -
         this.get('padding-left') -
         this.get('padding-right') -
         this.get('border-right') -
         this.get('margin-right');
      }

      element.setStyle({ width: newWidth + 'px' });

      this._prepared = true;
    },

    _end: function() {
      var element = this.element;
      var originalStyles = element.retrieve('prototype_original_styles');
      element.store('prototype_original_styles', null);
      element.setStyle(originalStyles);
      this._prepared = false;
    },

    _compute: function(property) {
      var COMPUTATIONS = Element.Layout.COMPUTATIONS;
      if (!(property in COMPUTATIONS)) {
        throw "Property not found.";
      }

      return this._set(property, COMPUTATIONS[property].call(this, this.element));
    },

    toObject: function() {
      var args = $A(arguments);
      var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
       args.join(' ').split(' ');
      var obj = {};
      keys.each( function(key) {
        if (!Element.Layout.PROPERTIES.include(key)) return;
        var value = this.get(key);
        if (value != null) obj[key] = value;
      }, this);
      return obj;
    },

    toHash: function() {
      var obj = this.toObject.apply(this, arguments);
      return new Hash(obj);
    },

    toCSS: function() {
      var args = $A(arguments);
      var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
       args.join(' ').split(' ');
      var css = {};

      keys.each( function(key) {
        if (!Element.Layout.PROPERTIES.include(key)) return;
        if (Element.Layout.COMPOSITE_PROPERTIES.include(key)) return;

        var value = this.get(key);
        if (value != null) css[cssNameFor(key)] = value + 'px';
      }, this);
      return css;
    },

    inspect: function() {
      return "#<Element.Layout>";
    }
  });

  Object.extend(Element.Layout, {
    PROPERTIES: $w('height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height'),

    COMPOSITE_PROPERTIES: $w('padding-box-width padding-box-height margin-box-width margin-box-height border-box-width border-box-height'),

    COMPUTATIONS: {
      'height': function(element) {
        if (!this._preComputing) this._begin();

        var bHeight = this.get('border-box-height');
        if (bHeight <= 0) {
          if (!this._preComputing) this._end();
          return 0;
        }

        var bTop = this.get('border-top'),
         bBottom = this.get('border-bottom');

        var pTop = this.get('padding-top'),
         pBottom = this.get('padding-bottom');

        if (!this._preComputing) this._end();

        return bHeight - bTop - bBottom - pTop - pBottom;
      },

      'width': function(element) {
        if (!this._preComputing) this._begin();

        var bWidth = this.get('border-box-width');
        if (bWidth <= 0) {
          if (!this._preComputing) this._end();
          return 0;
        }

        var bLeft = this.get('border-left'),
         bRight = this.get('border-right');

        var pLeft = this.get('padding-left'),
         pRight = this.get('padding-right');

        if (!this._preComputing) this._end();

        return bWidth - bLeft - bRight - pLeft - pRight;
      },

      'padding-box-height': function(element) {
        var height = this.get('height'),
         pTop = this.get('padding-top'),
         pBottom = this.get('padding-bottom');

        return height + pTop + pBottom;
      },

      'padding-box-width': function(element) {
        var width = this.get('width'),
         pLeft = this.get('padding-left'),
         pRight = this.get('padding-right');

        return width + pLeft + pRight;
      },

      'border-box-height': function(element) {
        if (!this._preComputing) this._begin();
        var height = element.offsetHeight;
        if (!this._preComputing) this._end();
        return height;
      },

      'border-box-width': function(element) {
        if (!this._preComputing) this._begin();
        var width = element.offsetWidth;
        if (!this._preComputing) this._end();
        return width;
      },

      'margin-box-height': function(element) {
        var bHeight = this.get('border-box-height'),
         mTop = this.get('margin-top'),
         mBottom = this.get('margin-bottom');

        if (bHeight <= 0) return 0;

        return bHeight + mTop + mBottom;
      },

      'margin-box-width': function(element) {
        var bWidth = this.get('border-box-width'),
         mLeft = this.get('margin-left'),
         mRight = this.get('margin-right');

        if (bWidth <= 0) return 0;

        return bWidth + mLeft + mRight;
      },

      'top': function(element) {
        var offset = element.positionedOffset();
        return offset.top;
      },

      'bottom': function(element) {
        var offset = element.positionedOffset(),
         parent = element.getOffsetParent(),
         pHeight = parent.measure('height');

        var mHeight = this.get('border-box-height');

        return pHeight - mHeight - offset.top;
      },

      'left': function(element) {
        var offset = element.positionedOffset();
        return offset.left;
      },

      'right': function(element) {
        var offset = element.positionedOffset(),
         parent = element.getOffsetParent(),
         pWidth = parent.measure('width');

        var mWidth = this.get('border-box-width');

        return pWidth - mWidth - offset.left;
      },

      'padding-top': function(element) {
        return getPixelValue(element, 'paddingTop');
      },

      'padding-bottom': function(element) {
        return getPixelValue(element, 'paddingBottom');
      },

      'padding-left': function(element) {
        return getPixelValue(element, 'paddingLeft');
      },

      'padding-right': function(element) {
        return getPixelValue(element, 'paddingRight');
      },

      'border-top': function(element) {
        return getPixelValue(element, 'borderTopWidth');
      },

      'border-bottom': function(element) {
        return getPixelValue(element, 'borderBottomWidth');
      },

      'border-left': function(element) {
        return getPixelValue(element, 'borderLeftWidth');
      },

      'border-right': function(element) {
        return getPixelValue(element, 'borderRightWidth');
      },

      'margin-top': function(element) {
        return getPixelValue(element, 'marginTop');
      },

      'margin-bottom': function(element) {
        return getPixelValue(element, 'marginBottom');
      },

      'margin-left': function(element) {
        return getPixelValue(element, 'marginLeft');
      },

      'margin-right': function(element) {
        return getPixelValue(element, 'marginRight');
      }
    }
  });

  if ('getBoundingClientRect' in document.documentElement) {
    Object.extend(Element.Layout.COMPUTATIONS, {
      'right': function(element) {
        var parent = hasLayout(element.getOffsetParent());
        var rect = element.getBoundingClientRect(),
         pRect = parent.getBoundingClientRect();

        return (pRect.right - rect.right).round();
      },

      'bottom': function(element) {
        var parent = hasLayout(element.getOffsetParent());
        var rect = element.getBoundingClientRect(),
         pRect = parent.getBoundingClientRect();

        return (pRect.bottom - rect.bottom).round();
      }
    });
  }

  Element.Offset = Class.create({
    initialize: function(left, top) {
      this.left = left.round();
      this.top  = top.round();

      this[0] = this.left;
      this[1] = this.top;
    },

    relativeTo: function(offset) {
      return new Element.Offset(
        this.left - offset.left,
        this.top  - offset.top
      );
    },

    inspect: function() {
      return "#<Element.Offset left: #{left} top: #{top}>".interpolate(this);
    },

    toString: function() {
      return "[#{left}, #{top}]".interpolate(this);
    },

    toArray: function() {
      return [this.left, this.top];
    }
  });

  function getLayout(element, preCompute) {
    return new Element.Layout(element, preCompute);
  }

  function measure(element, property) {
    return $(element).getLayout().get(property);
  }

  function getDimensions(element) {
    element = $(element);
    var display = Element.getStyle(element, 'display');

    if (display && display !== 'none') {
      return { width: element.offsetWidth, height: element.offsetHeight };
    }

    var style = element.style;
    var originalStyles = {
      visibility: style.visibility,
      position:   style.position,
      display:    style.display
    };

    var newStyles = {
      visibility: 'hidden',
      display:    'block'
    };

    if (originalStyles.position !== 'fixed')
      newStyles.position = 'absolute';

    Element.setStyle(element, newStyles);

    var dimensions = {
      width:  element.offsetWidth,
      height: element.offsetHeight
    };

    Element.setStyle(element, originalStyles);

    return dimensions;
  }

  function getOffsetParent(element) {
    element = $(element);

    if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element))
      return $(document.body);

    var isInline = (Element.getStyle(element, 'display') === 'inline');
    if (!isInline && element.offsetParent) return $(element.offsetParent);

    while ((element = element.parentNode) && element !== document.body) {
      if (Element.getStyle(element, 'position') !== 'static') {
        return isHtml(element) ? $(document.body) : $(element);
      }
    }

    return $(document.body);
  }


  function cumulativeOffset(element) {
    element = $(element);
    var valueT = 0, valueL = 0;
    if (element.parentNode) {
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
      } while (element);
    }
    return new Element.Offset(valueL, valueT);
  }

  function positionedOffset(element) {
    element = $(element);

    var layout = element.getLayout();

    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if (isBody(element)) break;
        var p = Element.getStyle(element, 'position');
        if (p !== 'static') break;
      }
    } while (element);

    valueL -= layout.get('margin-top');
    valueT -= layout.get('margin-left');

    return new Element.Offset(valueL, valueT);
  }

  function cumulativeScrollOffset(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return new Element.Offset(valueL, valueT);
  }

  function viewportOffset(forElement) {
    element = $(element);
    var valueT = 0, valueL = 0, docBody = document.body;

    var element = forElement;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == docBody &&
        Element.getStyle(element, 'position') == 'absolute') break;
    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (element != docBody) {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);
    return new Element.Offset(valueL, valueT);
  }

  function absolutize(element) {
    element = $(element);

    if (Element.getStyle(element, 'position') === 'absolute') {
      return element;
    }

    var offsetParent = getOffsetParent(element);
    var eOffset = element.viewportOffset(),
     pOffset = offsetParent.viewportOffset();

    var offset = eOffset.relativeTo(pOffset);
    var layout = element.getLayout();

    element.store('prototype_absolutize_original_styles', {
      left:   element.getStyle('left'),
      top:    element.getStyle('top'),
      width:  element.getStyle('width'),
      height: element.getStyle('height')
    });

    element.setStyle({
      position: 'absolute',
      top:    offset.top + 'px',
      left:   offset.left + 'px',
      width:  layout.get('width') + 'px',
      height: layout.get('height') + 'px'
    });

    return element;
  }

  function relativize(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') === 'relative') {
      return element;
    }

    var originalStyles =
     element.retrieve('prototype_absolutize_original_styles');

    if (originalStyles) element.setStyle(originalStyles);
    return element;
  }

  if (Prototype.Browser.IE) {
    getOffsetParent = getOffsetParent.wrap(
      function(proceed, element) {
        element = $(element);

        if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element))
          return $(document.body);

        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);

        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      }
    );

    positionedOffset = positionedOffset.wrap(function(proceed, element) {
      element = $(element);
      if (!element.parentNode) return new Element.Offset(0, 0);
      var position = element.getStyle('position');
      if (position !== 'static') return proceed(element);

      var offsetParent = element.getOffsetParent();
      if (offsetParent && offsetParent.getStyle('position') === 'fixed')
        hasLayout(offsetParent);

      element.setStyle({ position: 'relative' });
      var value = proceed(element);
      element.setStyle({ position: position });
      return value;
    });
  } else if (Prototype.Browser.Webkit) {
    cumulativeOffset = function(element) {
      element = $(element);
      var valueT = 0, valueL = 0;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        if (element.offsetParent == document.body)
          if (Element.getStyle(element, 'position') == 'absolute') break;

        element = element.offsetParent;
      } while (element);

      return new Element.Offset(valueL, valueT);
    };
  }


  Element.addMethods({
    getLayout:              getLayout,
    measure:                measure,
    getDimensions:          getDimensions,
    getOffsetParent:        getOffsetParent,
    cumulativeOffset:       cumulativeOffset,
    positionedOffset:       positionedOffset,
    cumulativeScrollOffset: cumulativeScrollOffset,
    viewportOffset:         viewportOffset,
    absolutize:             absolutize,
    relativize:             relativize
  });

  function isBody(element) {
    return element.nodeName.toUpperCase() === 'BODY';
  }

  function isHtml(element) {
    return element.nodeName.toUpperCase() === 'HTML';
  }

  function isDocument(element) {
    return element.nodeType === Node.DOCUMENT_NODE;
  }

  function isDetached(element) {
    return element !== document.body &&
     !Element.descendantOf(element, document.body);
  }

  if ('getBoundingClientRect' in document.documentElement) {
    Element.addMethods({
      viewportOffset: function(element) {
        element = $(element);
        if (isDetached(element)) return new Element.Offset(0, 0);

        var rect = element.getBoundingClientRect(),
         docEl = document.documentElement;
        return new Element.Offset(rect.left - docEl.clientLeft,
         rect.top - docEl.clientTop);
      }
    });
  }
})();
window.$$ = function() {
  var expression = $A(arguments).join(', ');
  return Prototype.Selector.select(expression, document);
};

Prototype.Selector = (function() {

  function select() {
    throw new Error('Method "Prototype.Selector.select" must be defined.');
  }

  function match() {
    throw new Error('Method "Prototype.Selector.match" must be defined.');
  }

  function find(elements, expression, index) {
    index = index || 0;
    var match = Prototype.Selector.match, length = elements.length, matchIndex = 0, i;

    for (i = 0; i < length; i++) {
      if (match(elements[i], expression) && index == matchIndex++) {
        return Element.extend(elements[i]);
      }
    }
  }

  function extendElements(elements) {
    for (var i = 0, length = elements.length; i < length; i++) {
      Element.extend(elements[i]);
    }
    return elements;
  }


  var K = Prototype.K;

  return {
    select: select,
    match: match,
    find: find,
    extendElements: (Element.extend === K) ? K : extendElements,
    extendElement: Element.extend
  };
})();
Prototype._original_property = window.Sizzle;
/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, check, mode, extra, prune = true, contextXML = isXML(context),
		soFar = selector;

	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
		soFar = m[3];

		parts.push( m[1] );

		if ( m[2] ) {
			extra = m[3];
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] )
					selector += parts.shift();

				set = posProcess( selector, set );
			}
		}
	} else {
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;

		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var filter = Expr.filter[ type ], found, item;
				anyFound = false;

				if ( curLoop == result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		if ( expr == old ) {
			if ( anyFound == null ) {
				throw "Syntax error, unrecognized expression: " + expr;
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag && !isXML ) {
				part = part.toUpperCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = isXML ? part : part.toUpperCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context, isXML){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0) ) {
						if ( !inplace )
							result.push( elem );
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			for ( var i = 0; curLoop[i] === false; i++ ){}
			return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
		},
		CHILD: function(match){
			if ( match[1] == "nth" ) {
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");

			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}

			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 == i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 == i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					if ( type == 'first') return true;
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first == 1 && last == 0 ) {
						return true;
					}

					var doneName = match[0],
						parent = elem.parentNode;

					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}
						parent.sizcache = doneName;
					}

					var diff = elem.nodeIndex - last;
					if ( first == 0 ) {
						return diff == 0;
					} else {
						return ( diff % first == 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}

	return array;
};

try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 );

} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

(function(){
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	if ( !!document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){

	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) (function(){
	var oldSizzle = Sizzle, div = document.createElement("div");
	div.innerHTML = "<p class='TEST'></p>";

	if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
		return;
	}

	Sizzle = function(query, context, extra, seed){
		context = context || document;

		if ( !seed && context.nodeType === 9 && !isXML(context) ) {
			try {
				return makeArray( context.querySelectorAll(query), extra );
			} catch(e){}
		}

		return oldSizzle(query, context, extra, seed);
	};

	for ( var prop in oldSizzle ) {
		Sizzle[ prop ] = oldSizzle[ prop ];
	}

	div = null; // release memory in IE
})();

if ( document.getElementsByClassName && document.documentElement.getElementsByClassName ) (function(){
	var div = document.createElement("div");
	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	if ( div.getElementsByClassName("e").length === 0 )
		return;

	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 )
		return;

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ){
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ) {
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ?  function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};


window.Sizzle = Sizzle;

})();

;(function(engine) {
  var extendElements = Prototype.Selector.extendElements;

  function select(selector, scope) {
    return extendElements(engine(selector, scope || document));
  }

  function match(element, selector) {
    return engine.matches(selector, [element]).length == 1;
  }

  Prototype.Selector.engine = engine;
  Prototype.Selector.select = select;
  Prototype.Selector.match = match;
})(Sizzle);

window.Sizzle = Prototype._original_property;
delete Prototype._original_property;

var Form = {
  reset: function(form) {
    form = $(form);
    form.reset();
    return form;
  },

  serializeElements: function(elements, options) {
    if (typeof options != 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    var key, value, submitted = false, submit = options.submit, accumulator, initial;

    if (options.hash) {
      initial = {};
      accumulator = function(result, key, value) {
        if (key in result) {
          if (!Object.isArray(result[key])) result[key] = [result[key]];
          result[key].push(value);
        } else result[key] = value;
        return result;
      };
    } else {
      initial = '';
      accumulator = function(result, key, value) {
        return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + encodeURIComponent(value);
      }
    }

    return elements.inject(initial, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name; value = $(element).getValue();
        if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
          result = accumulator(result, key, value);
        }
      }
      return result;
    });
  }
};

Form.Methods = {
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },

  getElements: function(form) {
    var elements = $(form).getElementsByTagName('*'),
        element,
        arr = [ ],
        serializers = Form.Element.Serializers;
    for (var i = 0; element = elements[i]; i++) {
      arr.push(element);
    }
    return arr.inject([], function(elements, child) {
      if (serializers[child.tagName.toLowerCase()])
        elements.push(Element.extend(child));
      return elements;
    })
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();

    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return /^(?:input|select|textarea)$/i.test(element.tagName);
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    var element = form.findFirstElement();
    if (element) element.activate();
    return form;
  },

  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });

    var params = options.parameters, action = form.readAttribute('action') || '';
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize(true);

    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/


Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {

  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !(/^(?:button|reset|submit)$/i.test(element.type))))
        element.select();
    } catch (e) { }
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;

var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = (function() {
  function input(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return inputSelector(element, value);
      default:
        return valueSelector(element, value);
    }
  }

  function inputSelector(element, value) {
    if (Object.isUndefined(value))
      return element.checked ? element.value : null;
    else element.checked = !!value;
  }

  function valueSelector(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value;
  }

  function select(element, value) {
    if (Object.isUndefined(value))
      return (element.type === 'select-one' ? selectOne : selectMany)(element);

    var opt, currentValue, single = !Object.isArray(value);
    for (var i = 0, length = element.length; i < length; i++) {
      opt = element.options[i];
      currentValue = this.optionValue(opt);
      if (single) {
        if (currentValue == value) {
          opt.selected = true;
          return;
        }
      }
      else opt.selected = value.include(currentValue);
    }
  }

  function selectOne(element) {
    var index = element.selectedIndex;
    return index >= 0 ? optionValue(element.options[index]) : null;
  }

  function selectMany(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(optionValue(opt));
    }
    return values;
  }

  function optionValue(opt) {
    return Element.hasAttribute(opt, 'value') ? opt.value : opt.text;
  }

  return {
    input:         input,
    inputSelector: inputSelector,
    textarea:      valueSelector,
    select:        select,
    selectOne:     selectOne,
    selectMany:    selectMany,
    optionValue:   optionValue,
    button:        valueSelector
  };
})();

/*--------------------------------------------------------------------------*/


Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },

  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
(function() {

  var Event = {
    KEY_BACKSPACE: 8,
    KEY_TAB:       9,
    KEY_RETURN:   13,
    KEY_ESC:      27,
    KEY_LEFT:     37,
    KEY_UP:       38,
    KEY_RIGHT:    39,
    KEY_DOWN:     40,
    KEY_DELETE:   46,
    KEY_HOME:     36,
    KEY_END:      35,
    KEY_PAGEUP:   33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT:   45,

    cache: {}
  };

  var docEl = document.documentElement;
  var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl
    && 'onmouseleave' in docEl;



  var isIELegacyEvent = function(event) { return false; };

  if (window.attachEvent) {
    if (window.addEventListener) {
      isIELegacyEvent = function(event) {
        return !(event instanceof window.Event);
      };
    } else {
      isIELegacyEvent = function(event) { return true; };
    }
  }

  var _isButton;

  function _isButtonForDOMEvents(event, code) {
    return event.which ? (event.which === code + 1) : (event.button === code);
  }

  var legacyButtonMap = { 0: 1, 1: 4, 2: 2 };
  function _isButtonForLegacyEvents(event, code) {
    return event.button === legacyButtonMap[code];
  }

  function _isButtonForWebKit(event, code) {
    switch (code) {
      case 0: return event.which == 1 && !event.metaKey;
      case 1: return event.which == 2 || (event.which == 1 && event.metaKey);
      case 2: return event.which == 3;
      default: return false;
    }
  }

  if (window.attachEvent) {
    if (!window.addEventListener) {
      _isButton = _isButtonForLegacyEvents;
    } else {
      _isButton = function(event, code) {
        return isIELegacyEvent(event) ? _isButtonForLegacyEvents(event, code) :
         _isButtonForDOMEvents(event, code);
      }
    }
  } else if (Prototype.Browser.WebKit) {
    _isButton = _isButtonForWebKit;
  } else {
    _isButton = _isButtonForDOMEvents;
  }

  function isLeftClick(event)   { return _isButton(event, 0) }

  function isMiddleClick(event) { return _isButton(event, 1) }

  function isRightClick(event)  { return _isButton(event, 2) }

  function element(event) {
    event = Event.extend(event);

    var node = event.target, type = event.type,
     currentTarget = event.currentTarget;

    if (currentTarget && currentTarget.tagName) {
      if (type === 'load' || type === 'error' ||
        (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
          && currentTarget.type === 'radio'))
            node = currentTarget;
    }

    if (node.nodeType == Node.TEXT_NODE)
      node = node.parentNode;

    return Element.extend(node);
  }

  function findElement(event, expression) {
    var element = Event.element(event);

    if (!expression) return element;
    while (element) {
      if (Object.isElement(element) && Prototype.Selector.match(element, expression)) {
        return Element.extend(element);
      }
      element = element.parentNode;
    }
  }

  function pointer(event) {
    return { x: pointerX(event), y: pointerY(event) };
  }

  function pointerX(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollLeft: 0 };

    return event.pageX || (event.clientX +
      (docElement.scrollLeft || body.scrollLeft) -
      (docElement.clientLeft || 0));
  }

  function pointerY(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollTop: 0 };

    return  event.pageY || (event.clientY +
       (docElement.scrollTop || body.scrollTop) -
       (docElement.clientTop || 0));
  }


  function stop(event) {
    Event.extend(event);
    event.preventDefault();
    event.stopPropagation();

    event.stopped = true;
  }


  Event.Methods = {
    isLeftClick:   isLeftClick,
    isMiddleClick: isMiddleClick,
    isRightClick:  isRightClick,

    element:     element,
    findElement: findElement,

    pointer:  pointer,
    pointerX: pointerX,
    pointerY: pointerY,

    stop: stop
  };

  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });

  if (window.attachEvent) {
    function _relatedTarget(event) {
      var element;
      switch (event.type) {
        case 'mouseover':
        case 'mouseenter':
          element = event.fromElement;
          break;
        case 'mouseout':
        case 'mouseleave':
          element = event.toElement;
          break;
        default:
          return null;
      }
      return Element.extend(element);
    }

    var additionalMethods = {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return '[object Event]' }
    };

    Event.extend = function(event, element) {
      if (!event) return false;

      if (!isIELegacyEvent(event)) return event;

      if (event._extendedByPrototype) return event;
      event._extendedByPrototype = Prototype.emptyFunction;

      var pointer = Event.pointer(event);

      Object.extend(event, {
        target: event.srcElement || element,
        relatedTarget: _relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });

      Object.extend(event, methods);
      Object.extend(event, additionalMethods);

      return event;
    };
  } else {
    Event.extend = Prototype.K;
  }

  if (window.addEventListener) {
    Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
    Object.extend(Event.prototype, methods);
  }

  function _createResponder(element, eventName, handler) {
    var registry = Element.retrieve(element, 'prototype_event_registry');

    if (Object.isUndefined(registry)) {
      CACHE.push(element);
      registry = Element.retrieve(element, 'prototype_event_registry', $H());
    }

    var respondersForEvent = registry.get(eventName);
    if (Object.isUndefined(respondersForEvent)) {
      respondersForEvent = [];
      registry.set(eventName, respondersForEvent);
    }

    if (respondersForEvent.pluck('handler').include(handler)) return false;

    var responder;
    if (eventName.include(":")) {
      responder = function(event) {
        if (Object.isUndefined(event.eventName))
          return false;

        if (event.eventName !== eventName)
          return false;

        Event.extend(event, element);
        handler.call(element, event);
      };
    } else {
      if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED &&
       (eventName === "mouseenter" || eventName === "mouseleave")) {
        if (eventName === "mouseenter" || eventName === "mouseleave") {
          responder = function(event) {
            Event.extend(event, element);

            var parent = event.relatedTarget;
            while (parent && parent !== element) {
              try { parent = parent.parentNode; }
              catch(e) { parent = element; }
            }

            if (parent === element) return;

            handler.call(element, event);
          };
        }
      } else {
        responder = function(event) {
          Event.extend(event, element);
          handler.call(element, event);
        };
      }
    }

    responder.handler = handler;
    respondersForEvent.push(responder);
    return responder;
  }

  function _destroyCache() {
    for (var i = 0, length = CACHE.length; i < length; i++) {
      Event.stopObserving(CACHE[i]);
      CACHE[i] = null;
    }
  }

  var CACHE = [];

  if (Prototype.Browser.IE)
    window.attachEvent('onunload', _destroyCache);

  if (Prototype.Browser.WebKit)
    window.addEventListener('unload', Prototype.emptyFunction, false);


  var _getDOMEventName = Prototype.K,
      translations = { mouseenter: "mouseover", mouseleave: "mouseout" };

  if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
    _getDOMEventName = function(eventName) {
      return (translations[eventName] || eventName);
    };
  }

  function observe(element, eventName, handler) {
    element = $(element);

    var responder = _createResponder(element, eventName, handler);

    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.addEventListener)
        element.addEventListener("dataavailable", responder, false);
      else {
        element.attachEvent("ondataavailable", responder);
        element.attachEvent("onlosecapture", responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);

      if (element.addEventListener)
        element.addEventListener(actualEventName, responder, false);
      else
        element.attachEvent("on" + actualEventName, responder);
    }

    return element;
  }

  function stopObserving(element, eventName, handler) {
    element = $(element);

    var registry = Element.retrieve(element, 'prototype_event_registry');
    if (!registry) return element;

    if (!eventName) {
      registry.each( function(pair) {
        var eventName = pair.key;
        stopObserving(element, eventName);
      });
      return element;
    }

    var responders = registry.get(eventName);
    if (!responders) return element;

    if (!handler) {
      responders.each(function(r) {
        stopObserving(element, eventName, r.handler);
      });
      return element;
    }

    var i = responders.length, responder;
    while (i--) {
      if (responders[i].handler === handler) {
        responder = responders[i];
        break;
      }
    }
    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.removeEventListener)
        element.removeEventListener("dataavailable", responder, false);
      else {
        element.detachEvent("ondataavailable", responder);
        element.detachEvent("onlosecapture", responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);
      if (element.removeEventListener)
        element.removeEventListener(actualEventName, responder, false);
      else
        element.detachEvent('on' + actualEventName, responder);
    }

    registry.set(eventName, responders.without(responder));

    return element;
  }

  function fire(element, eventName, memo, bubble) {
    element = $(element);

    if (Object.isUndefined(bubble))
      bubble = true;

    if (element == document && document.createEvent && !element.dispatchEvent)
      element = document.documentElement;

    var event;
    if (document.createEvent) {
      event = document.createEvent('HTMLEvents');
      event.initEvent('dataavailable', bubble, true);
    } else {
      event = document.createEventObject();
      event.eventType = bubble ? 'ondataavailable' : 'onlosecapture';
    }

    event.eventName = eventName;
    event.memo = memo || { };

    if (document.createEvent)
      element.dispatchEvent(event);
    else
      element.fireEvent(event.eventType, event);

    return Event.extend(event);
  }

  Event.Handler = Class.create({
    initialize: function(element, eventName, selector, callback) {
      this.element   = $(element);
      this.eventName = eventName;
      this.selector  = selector;
      this.callback  = callback;
      this.handler   = this.handleEvent.bind(this);
    },

    start: function() {
      Event.observe(this.element, this.eventName, this.handler);
      return this;
    },

    stop: function() {
      Event.stopObserving(this.element, this.eventName, this.handler);
      return this;
    },

    handleEvent: function(event) {
      var element = Event.findElement(event, this.selector);
      if (element) this.callback.call(this.element, event, element);
    }
  });

  function on(element, eventName, selector, callback) {
    element = $(element);
    if (Object.isFunction(selector) && Object.isUndefined(callback)) {
      callback = selector, selector = null;
    }

    return new Event.Handler(element, eventName, selector, callback).start();
  }

  Object.extend(Event, Event.Methods);

  Object.extend(Event, {
    fire:          fire,
    observe:       observe,
    stopObserving: stopObserving,
    on:            on
  });

  Element.addMethods({
    fire:          fire,

    observe:       observe,

    stopObserving: stopObserving,

    on:            on
  });

  Object.extend(document, {
    fire:          fire.methodize(),

    observe:       observe.methodize(),

    stopObserving: stopObserving.methodize(),

    on:            on.methodize(),

    loaded:        false
  });

  if (window.Event) Object.extend(window.Event, Event);
  else window.Event = Event;
})();

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

  var timer;

  function fireContentLoadedEvent() {
    if (document.loaded) return;
    if (timer) window.clearTimeout(timer);
    document.loaded = true;
    document.fire('dom:loaded');
  }

  function checkReadyState() {
    if (document.readyState === 'complete') {
      document.stopObserving('readystatechange', checkReadyState);
      fireContentLoadedEvent();
    }
  }

  function pollDoScroll() {
    try { document.documentElement.doScroll('left'); }
    catch(e) {
      timer = pollDoScroll.defer();
      return;
    }
    fireContentLoadedEvent();
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
  } else {
    document.observe('readystatechange', checkReadyState);
    if (window == top)
      timer = pollDoScroll.defer();
  }

  Event.observe(window, 'load', fireContentLoadedEvent);
})();

Element.addMethods();

/*------------------------------- DEPRECATED -------------------------------*/

Hash.toQueryString = Object.toQueryString;

var Toggle = { display: Element.toggle };

Element.Methods.childOf = Element.Methods.descendantOf;

var Insertion = {
  Before: function(element, content) {
    return Element.insert(element, {before:content});
  },

  Top: function(element, content) {
    return Element.insert(element, {top:content});
  },

  Bottom: function(element, content) {
    return Element.insert(element, {bottom:content});
  },

  After: function(element, content) {
    return Element.insert(element, {after:content});
  }
};

var $continue = new Error('"throw $continue" is deprecated, use "return" instead');

var Position = {
  includeScrollOffsets: false,

  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = Element.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = Element.cumulativeScrollOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = Element.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },


  cumulativeOffset: Element.Methods.cumulativeOffset,

  positionedOffset: Element.Methods.positionedOffset,

  absolutize: function(element) {
    Position.prepare();
    return Element.absolutize(element);
  },

  relativize: function(element) {
    Position.prepare();
    return Element.relativize(element);
  },

  realOffset: Element.Methods.cumulativeScrollOffset,

  offsetParent: Element.Methods.getOffsetParent,

  page: Element.Methods.viewportOffset,

  clone: function(source, target, options) {
    options = options || { };
    return Element.clonePosition(target, source, options);
  }
};

/*--------------------------------------------------------------------------*/

if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods){
  function iter(name) {
    return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
  }

  instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
  function(element, className) {
    className = className.toString().strip();
    var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
    return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
  } : function(element, className) {
    className = className.toString().strip();
    var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
    if (!classNames && !className) return elements;

    var nodes = $(element).getElementsByTagName('*');
    className = ' ' + className + ' ';

    for (var i = 0, child, cn; child = nodes[i]; i++) {
      if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
          (classNames && classNames.all(function(name) {
            return !name.toString().blank() && cn.include(' ' + name + ' ');
          }))))
        elements.push(Element.extend(child));
    }
    return elements;
  };

  return function(className, parentElement) {
    return $(parentElement || document.body).getElementsByClassName(className);
  };
}(Element.Methods);

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);

/*--------------------------------------------------------------------------*/

(function() {
  window.Selector = Class.create({
    initialize: function(expression) {
      this.expression = expression.strip();
    },

    findElements: function(rootElement) {
      return Prototype.Selector.select(this.expression, rootElement);
    },

    match: function(element) {
      return Prototype.Selector.match(element, this.expression);
    },

    toString: function() {
      return this.expression;
    },

    inspect: function() {
      return "#<Selector: " + this.expression + ">";
    }
  });

  Object.extend(Selector, {
    matchElements: function(elements, expression) {
      var match = Prototype.Selector.match,
          results = [];

      for (var i = 0, length = elements.length; i < length; i++) {
        var element = elements[i];
        if (match(element, expression)) {
          results.push(Element.extend(element));
        }
      }
      return results;
    },

    findElement: function(elements, expression, index) {
      index = index || 0;
      var matchIndex = 0, element;
      for (var i = 0, length = elements.length; i < length; i++) {
        element = elements[i];
        if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
          return Element.extend(element);
        }
      }
    },

    findChildElements: function(element, expressions) {
      var selector = expressions.toArray().join(', ');
      return Prototype.Selector.select(selector, element || document);
    }
  });
})();

// Credit Card Validation Javascript
// copyright 12th May 2003, by Stephen Chapman, Felgall Pty Ltd

// You have permission to copy and use this javascript provided that
// the content of the script is not changed in any way.

function validateCreditCard(s) {
    // remove non-numerics
    var v = "0123456789";
    var w = "";
    for (i=0; i < s.length; i++) {
        x = s.charAt(i);
        if (v.indexOf(x,0) != -1)
        w += x;
    }
    // validate number
    j = w.length / 2;
    k = Math.floor(j);
    m = Math.ceil(j) - k;
    c = 0;
    for (i=0; i<k; i++) {
        a = w.charAt(i*2+m) * 2;
        c += a > 9 ? Math.floor(a/10 + a%10) : a;
    }
    for (i=0; i<k+m; i++) c += w.charAt(i*2+1-m) * 1;
    return (c%10 == 0);
}


/*
* Really easy field validation with Prototype
* http://tetlaw.id.au/view/javascript/really-easy-field-validation
* Andrew Tetlaw
* Version 1.5.4.1 (2007-01-05)
*
* Copyright (c) 2007 Andrew Tetlaw
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use, copy,
* modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
* BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
* ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*
*/
var Validator = Class.create();

Validator.prototype = {
    initialize : function(className, error, test, options) {
        if(typeof test == 'function'){
            this.options = $H(options);
            this._test = test;
        } else {
            this.options = $H(test);
            this._test = function(){return true};
        }
        this.error = error || 'Validation failed.';
        this.className = className;
    },
    test : function(v, elm) {
        return (this._test(v,elm) && this.options.all(function(p){
            return Validator.methods[p.key] ? Validator.methods[p.key](v,elm,p.value) : true;
        }));
    }
}
Validator.methods = {
    pattern : function(v,elm,opt) {return Validation.get('IsEmpty').test(v) || opt.test(v)},
    minLength : function(v,elm,opt) {return v.length >= opt},
    maxLength : function(v,elm,opt) {return v.length <= opt},
    min : function(v,elm,opt) {return v >= parseFloat(opt)},
    max : function(v,elm,opt) {return v <= parseFloat(opt)},
    notOneOf : function(v,elm,opt) {return $A(opt).all(function(value) {
        return v != value;
    })},
    oneOf : function(v,elm,opt) {return $A(opt).any(function(value) {
        return v == value;
    })},
    is : function(v,elm,opt) {return v == opt},
    isNot : function(v,elm,opt) {return v != opt},
    equalToField : function(v,elm,opt) {return v == $F(opt)},
    notEqualToField : function(v,elm,opt) {return v != $F(opt)},
    include : function(v,elm,opt) {return $A(opt).all(function(value) {
        return Validation.get(value).test(v,elm);
    })}
}

var Validation = Class.create();
Validation.defaultOptions = {
    onSubmit : true,
    stopOnFirst : false,
    immediate : false,
    focusOnError : true,
    useTitles : false,
    addClassNameToContainer: false,
    containerClassName: '.input-box',
    onFormValidate : function(result, form) {},
    onElementValidate : function(result, elm) {}
};

Validation.prototype = {
    initialize : function(form, options){
        this.form = $(form);
        if (!this.form) {
            return;
        }
        this.options = Object.extend({
            onSubmit : Validation.defaultOptions.onSubmit,
            stopOnFirst : Validation.defaultOptions.stopOnFirst,
            immediate : Validation.defaultOptions.immediate,
            focusOnError : Validation.defaultOptions.focusOnError,
            useTitles : Validation.defaultOptions.useTitles,
            onFormValidate : Validation.defaultOptions.onFormValidate,
            onElementValidate : Validation.defaultOptions.onElementValidate
        }, options || {});
        if(this.options.onSubmit) Event.observe(this.form,'submit',this.onSubmit.bind(this),false);
        if(this.options.immediate) {
            Form.getElements(this.form).each(function(input) { // Thanks Mike!
                if (input.tagName.toLowerCase() == 'select') {
                    Event.observe(input, 'blur', this.onChange.bindAsEventListener(this));
                }
                if (input.type.toLowerCase() == 'radio' || input.type.toLowerCase() == 'checkbox') {
                    Event.observe(input, 'click', this.onChange.bindAsEventListener(this));
                } else {
                    Event.observe(input, 'change', this.onChange.bindAsEventListener(this));
                }
            }, this);
        }
    },
    onChange : function (ev) {
        Validation.isOnChange = true;
        Validation.validate(Event.element(ev),{
                useTitle : this.options.useTitles,
                onElementValidate : this.options.onElementValidate
        });
        Validation.isOnChange = false;
    },
    onSubmit :  function(ev){
        if(!this.validate()) Event.stop(ev);
    },
    validate : function() {
        var result = false;
        var useTitles = this.options.useTitles;
        var callback = this.options.onElementValidate;
        try {
            if(this.options.stopOnFirst) {
                result = Form.getElements(this.form).all(function(elm) {
                    if (elm.hasClassName('local-validation') && !this.isElementInForm(elm, this.form)) {
                        return true;
                    }
                    return Validation.validate(elm,{useTitle : useTitles, onElementValidate : callback});
                }, this);
            } else {
                result = Form.getElements(this.form).collect(function(elm) {
                    if (elm.hasClassName('local-validation') && !this.isElementInForm(elm, this.form)) {
                        return true;
                    }
                    return Validation.validate(elm,{useTitle : useTitles, onElementValidate : callback});
                }, this).all();
            }
        } catch (e) {
        }
        if(!result && this.options.focusOnError) {
            try{
                Form.getElements(this.form).findAll(function(elm){return $(elm).hasClassName('validation-failed')}).first().focus()
            }
            catch(e){
            }
        }
        this.options.onFormValidate(result, this.form);
        return result;
    },
    reset : function() {
        Form.getElements(this.form).each(Validation.reset);
    },
    isElementInForm : function(elm, form) {
        var domForm = elm.up('form');
        if (domForm == form) {
            return true;
        }
        return false;
    }
}

Object.extend(Validation, {
    validate : function(elm, options){
        options = Object.extend({
            useTitle : false,
            onElementValidate : function(result, elm) {}
        }, options || {});
        elm = $(elm);

        var cn = $w(elm.className);
        return result = cn.all(function(value) {
            var test = Validation.test(value,elm,options.useTitle);
            options.onElementValidate(test, elm);
            return test;
        });
    },
    insertAdvice : function(elm, advice){
        var container = $(elm).up('.field-row');
        if(container){
            Element.insert(container, {after: advice});
        } else if (elm.up('td.value')) {
            elm.up('td.value').insert({bottom: advice});
        } else if (elm.advaiceContainer && $(elm.advaiceContainer)) {
            $(elm.advaiceContainer).update(advice);
        }
        else {
            switch (elm.type.toLowerCase()) {
                case 'checkbox':
                case 'radio':
                    var p = elm.parentNode;
                    if(p) {
                        Element.insert(p, {'bottom': advice});
                    } else {
                        Element.insert(elm, {'after': advice});
                    }
                    break;
                default:
                    Element.insert(elm, {'after': advice});
            }
        }
    },
    showAdvice : function(elm, advice, adviceName){
        if(!elm.advices){
            elm.advices = new Hash();
        }
        else{
            elm.advices.each(function(pair){
                if (!advice || pair.value.id != advice.id) {
                    // hide non-current advice after delay
                    this.hideAdvice(elm, pair.value);
                }
            }.bind(this));
        }
        elm.advices.set(adviceName, advice);
        if(typeof Effect == 'undefined') {
            advice.style.display = 'block';
        } else {
            if(!advice._adviceAbsolutize) {
                new Effect.Appear(advice, {duration : 1 });
            } else {
                Position.absolutize(advice);
                advice.show();
                advice.setStyle({
                    'top':advice._adviceTop,
                    'left': advice._adviceLeft,
                    'width': advice._adviceWidth,
                    'z-index': 1000
                });
                advice.addClassName('advice-absolute');
            }
        }
    },
    hideAdvice : function(elm, advice){
        if (advice != null) {
            new Effect.Fade(advice, {duration : 1, afterFinishInternal : function() {advice.hide();}});
        }
    },
    updateCallback : function(elm, status) {
        if (typeof elm.callbackFunction != 'undefined') {
            eval(elm.callbackFunction+'(\''+elm.id+'\',\''+status+'\')');
        }
    },
    ajaxError : function(elm, errorMsg) {
        var name = 'validate-ajax';
        var advice = Validation.getAdvice(name, elm);
        if (advice == null) {
            advice = this.createAdvice(name, elm, false, errorMsg);
        }
        this.showAdvice(elm, advice, 'validate-ajax');
        this.updateCallback(elm, 'failed');

        elm.addClassName('validation-failed');
        elm.addClassName('validate-ajax');
        if (Validation.defaultOptions.addClassNameToContainer && Validation.defaultOptions.containerClassName != '') {
            var container = elm.up(Validation.defaultOptions.containerClassName);
            if (container && this.allowContainerClassName(elm)) {
                container.removeClassName('validation-passed');
                container.addClassName('validation-error');
            }
        }
    },
    allowContainerClassName: function (elm) {
        if (elm.type == 'radio' || elm.type == 'checkbox') {
            return elm.hasClassName('change-container-classname');
        }

        return true;
    },
    test : function(name, elm, useTitle) {
        var v = Validation.get(name);
        var prop = '__advice'+name.camelize();
        try {
        if(Validation.isVisible(elm) && !v.test($F(elm), elm)) {
            //if(!elm[prop]) {
                var advice = Validation.getAdvice(name, elm);
                if (advice == null) {
                    advice = this.createAdvice(name, elm, useTitle);
                }
                this.showAdvice(elm, advice, name);
                this.updateCallback(elm, 'failed');
            //}
            elm[prop] = 1;
            if (!elm.advaiceContainer) {
                elm.removeClassName('validation-passed');
                elm.addClassName('validation-failed');
            }

           if (Validation.defaultOptions.addClassNameToContainer && Validation.defaultOptions.containerClassName != '') {
                var container = elm.up(Validation.defaultOptions.containerClassName);
                if (container && this.allowContainerClassName(elm)) {
                    container.removeClassName('validation-passed');
                    container.addClassName('validation-error');
                }
            }
            return false;
        } else {
            var advice = Validation.getAdvice(name, elm);
            this.hideAdvice(elm, advice);
            this.updateCallback(elm, 'passed');
            elm[prop] = '';
            elm.removeClassName('validation-failed');
            elm.addClassName('validation-passed');
            if (Validation.defaultOptions.addClassNameToContainer && Validation.defaultOptions.containerClassName != '') {
                var container = elm.up(Validation.defaultOptions.containerClassName);
                if (container && !container.down('.validation-failed') && this.allowContainerClassName(elm)) {
                    if (!Validation.get('IsEmpty').test(elm.value) || !this.isVisible(elm)) {
                        container.addClassName('validation-passed');
                    } else {
                        container.removeClassName('validation-passed');
                    }
                    container.removeClassName('validation-error');
                }
            }
            return true;
        }
        } catch(e) {
            throw(e)
        }
    },
    isVisible : function(elm) {
        while(elm.tagName != 'BODY') {
            if(!$(elm).visible()) return false;
            elm = elm.parentNode;
        }
        return true;
    },
    getAdvice : function(name, elm) {
        return $('advice-' + name + '-' + Validation.getElmID(elm)) || $('advice-' + Validation.getElmID(elm));
    },
    createAdvice : function(name, elm, useTitle, customError) {
        var v = Validation.get(name);
        var errorMsg = useTitle ? ((elm && elm.title) ? elm.title : v.error) : v.error;
        if (customError) {
            errorMsg = customError;
        }
        try {
            if (Translator){
                errorMsg = Translator.translate(errorMsg);
            }
        }
        catch(e){}

        advice = '<div class="validation-advice" id="advice-' + name + '-' + Validation.getElmID(elm) +'" style="display:none">' + errorMsg + '</div>'


        Validation.insertAdvice(elm, advice);
        advice = Validation.getAdvice(name, elm);
        if($(elm).hasClassName('absolute-advice')) {
            var dimensions = $(elm).getDimensions();
            var originalPosition = Position.cumulativeOffset(elm);

            advice._adviceTop = (originalPosition[1] + dimensions.height) + 'px';
            advice._adviceLeft = (originalPosition[0])  + 'px';
            advice._adviceWidth = (dimensions.width)  + 'px';
            advice._adviceAbsolutize = true;
        }
        return advice;
    },
    getElmID : function(elm) {
        return elm.id ? elm.id : elm.name;
    },
    reset : function(elm) {
        elm = $(elm);
        var cn = $w(elm.className);
        cn.each(function(value) {
            var prop = '__advice'+value.camelize();
            if(elm[prop]) {
                var advice = Validation.getAdvice(value, elm);
                if (advice) {
                    advice.hide();
                }
                elm[prop] = '';
            }
            elm.removeClassName('validation-failed');
            elm.removeClassName('validation-passed');
            if (Validation.defaultOptions.addClassNameToContainer && Validation.defaultOptions.containerClassName != '') {
                var container = elm.up(Validation.defaultOptions.containerClassName);
                if (container) {
                    container.removeClassName('validation-passed');
                    container.removeClassName('validation-error');
                }
            }
        });
    },
    add : function(className, error, test, options) {
        var nv = {};
        nv[className] = new Validator(className, error, test, options);
        Object.extend(Validation.methods, nv);
    },
    addAllThese : function(validators) {
        var nv = {};
        $A(validators).each(function(value) {
                nv[value[0]] = new Validator(value[0], value[1], value[2], (value.length > 3 ? value[3] : {}));
            });
        Object.extend(Validation.methods, nv);
    },
    get : function(name) {
        return  Validation.methods[name] ? Validation.methods[name] : Validation.methods['_LikeNoIDIEverSaw_'];
    },
    methods : {
        '_LikeNoIDIEverSaw_' : new Validator('_LikeNoIDIEverSaw_','',{})
    }
});

Validation.add('IsEmpty', '', function(v) {
    return  (v == '' || (v == null) || (v.length == 0) || /^\s+$/.test(v));
});

Validation.addAllThese([
    ['validate-no-html-tags', 'HTML tags are not allowed', function(v) {
				return !/<(\/)?\w+/.test(v);
			}],
	['validate-select', 'Please select an option.', function(v) {
                return ((v != "none") && (v != null) && (v.length != 0));
            }],
    ['required-entry', 'This is a required field.', function(v) {
                return !Validation.get('IsEmpty').test(v);
            }],
    ['validate-number', 'Please enter a valid number in this field.', function(v) {
                return Validation.get('IsEmpty').test(v)
                    || (!isNaN(parseNumber(v)) && /^\s*-?\d*(\.\d*)?\s*$/.test(v));
            }],
    ['validate-number-range', 'The value is not within the specified range.', function(v, elm) {
                if (Validation.get('IsEmpty').test(v)) {
                    return true;
                }

                var numValue = parseNumber(v);
                if (isNaN(numValue)) {
                    return false;
                }

                var reRange = /^number-range-(-?[\d.,]+)?-(-?[\d.,]+)?$/,
                    result = true;

                $w(elm.className).each(function(name) {
                    var m = reRange.exec(name);
                    if (m) {
                        result = result
                            && (m[1] == null || m[1] == '' || numValue >= parseNumber(m[1]))
                            && (m[2] == null || m[2] == '' || numValue <= parseNumber(m[2]));
                    }
                });

                return result;
            }],
    ['validate-digits', 'Please use numbers only in this field. Please avoid spaces or other characters such as dots or commas.', function(v) {
                return Validation.get('IsEmpty').test(v) ||  !/[^\d]/.test(v);
            }],
    ['validate-digits-range', 'The value is not within the specified range.', function(v, elm) {
                if (Validation.get('IsEmpty').test(v)) {
                    return true;
                }

                var numValue = parseNumber(v);
                if (isNaN(numValue)) {
                    return false;
                }

                var reRange = /^digits-range-(-?\d+)?-(-?\d+)?$/,
                    result = true;

                $w(elm.className).each(function(name) {
                    var m = reRange.exec(name);
                    if (m) {
                        result = result
                            && (m[1] == null || m[1] == '' || numValue >= parseNumber(m[1]))
                            && (m[2] == null || m[2] == '' || numValue <= parseNumber(m[2]));
                    }
                });

                return result;
            }],
    ['validate-alpha', 'Please use letters only (a-z or A-Z) in this field.', function (v) {
                return Validation.get('IsEmpty').test(v) ||  /^[a-zA-Z]+$/.test(v)
            }],
    ['validate-code', 'Please use only letters (a-z), numbers (0-9) or underscore(_) in this field, first character should be a letter.', function (v) {
                return Validation.get('IsEmpty').test(v) ||  /^[a-z]+[a-z0-9_]+$/.test(v)
            }],
    ['validate-alphanum', 'Please use only letters (a-z or A-Z) or numbers (0-9) only in this field. No spaces or other characters are allowed.', function(v) {
                return Validation.get('IsEmpty').test(v) || /^[a-zA-Z0-9]+$/.test(v)
            }],
    ['validate-alphanum-with-spaces', 'Please use only letters (a-z or A-Z), numbers (0-9) or spaces only in this field.', function(v) {
                    return Validation.get('IsEmpty').test(v) || /^[a-zA-Z0-9 ]+$/.test(v)
            }],
    ['validate-street', 'Please use only letters (a-z or A-Z) or numbers (0-9) or spaces and # only in this field.', function(v) {
                return Validation.get('IsEmpty').test(v) ||  /^[ \w]{3,}([A-Za-z]\.)?([ \w]*\#\d+)?(\r\n| )[ \w]{3,}/.test(v)
            }],
    ['validate-phoneStrict', 'Please enter a valid phone number. For example (123) 456-7890 or 123-456-7890.', function(v) {
                return Validation.get('IsEmpty').test(v) || /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/.test(v);
            }],
    ['validate-phoneLax', 'Please enter a valid phone number. For example (123) 456-7890 or 123-456-7890.', function(v) {
                return Validation.get('IsEmpty').test(v) || /^((\d[-. ]?)?((\(\d{3}\))|\d{3}))?[-. ]?\d{3}[-. ]?\d{4}$/.test(v);
            }],
    ['validate-fax', 'Please enter a valid fax number. For example (123) 456-7890 or 123-456-7890.', function(v) {
                return Validation.get('IsEmpty').test(v) || /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/.test(v);
            }],
    ['validate-date', 'Please enter a valid date.', function(v) {
                var test = new Date(v);
                return Validation.get('IsEmpty').test(v) || !isNaN(test);
            }],
    ['validate-email', 'Please enter a valid email address. For example johndoe@domain.com.', function (v) {
                //return Validation.get('IsEmpty').test(v) || /\w{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/.test(v)
                //return Validation.get('IsEmpty').test(v) || /^[\!\#$%\*/?|\^\{\}`~&\'\+\-=_a-z0-9][\!\#$%\*/?|\^\{\}`~&\'\+\-=_a-z0-9\.]{1,30}[\!\#$%\*/?|\^\{\}`~&\'\+\-=_a-z0-9]@([a-z0-9_-]{1,30}\.){1,5}[a-z]{2,4}$/i.test(v)
                return Validation.get('IsEmpty').test(v) || /^([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*@([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*\.(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]){2,})$/i.test(v)
            }],
    ['validate-emailSender', 'Please use only visible characters and spaces.', function (v) {
                return Validation.get('IsEmpty').test(v) ||  /^[\S ]+$/.test(v)
                    }],
    ['validate-password', 'Please enter 6 or more characters. Leading or trailing spaces will be ignored.', function(v) {
                var pass=v.strip(); /*strip leading and trailing spaces*/
                return !(pass.length>0 && pass.length < 6);
            }],
    ['validate-admin-password', 'Please enter 7 or more characters. Password should contain both numeric and alphabetic characters.', function(v) {
                var pass=v.strip();
                if (0 == pass.length) {
                    return true;
                }
                if (!(/[a-z]/i.test(v)) || !(/[0-9]/.test(v))) {
                    return false;
                }
                return !(pass.length < 7);
            }],
    ['validate-cpassword', 'Please make sure your passwords match.', function(v) {
                var conf = $('confirmation') ? $('confirmation') : $$('.validate-cpassword')[0];
                var pass = false;
                if ($('password')) {
                    pass = $('password');
                }
                var passwordElements = $$('.validate-password');
                for (var i = 0; i < passwordElements.size(); i++) {
                    var passwordElement = passwordElements[i];
                    if (passwordElement.up('form').id == conf.up('form').id) {
                        pass = passwordElement;
                    }
                }
                if ($$('.validate-admin-password').size()) {
                    pass = $$('.validate-admin-password')[0];
                }
                return (pass.value == conf.value);
            }],
    ['validate-url', 'Please enter a valid URL. Protocol is required (http://, https:// or ftp://)', function (v) {
                v = (v || '').replace(/^\s+/, '').replace(/\s+$/, '');
                return Validation.get('IsEmpty').test(v) || /^(http|https|ftp):\/\/(([A-Z0-9]([A-Z0-9_-]*[A-Z0-9]|))(\.[A-Z0-9]([A-Z0-9_-]*[A-Z0-9]|))*)(:(\d+))?(\/[A-Z0-9~](([A-Z0-9_~-]|\.)*[A-Z0-9~]|))*\/?(.*)?$/i.test(v)
            }],
    ['validate-clean-url', 'Please enter a valid URL. For example http://www.example.com or www.example.com', function (v) {
                return Validation.get('IsEmpty').test(v) || /^(http|https|ftp):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+.(com|org|net|dk|at|us|tv|info|uk|co.uk|biz|se)$)(:(\d+))?\/?/i.test(v) || /^(www)((\.[A-Z0-9][A-Z0-9_-]*)+.(com|org|net|dk|at|us|tv|info|uk|co.uk|biz|se)$)(:(\d+))?\/?/i.test(v)
            }],
    ['validate-identifier', 'Please enter a valid URL Key. For example "example-page", "example-page.html" or "anotherlevel/example-page".', function (v) {
                return Validation.get('IsEmpty').test(v) || /^[a-z0-9][a-z0-9_\/-]+(\.[a-z0-9_-]+)?$/.test(v)
            }],
    ['validate-xml-identifier', 'Please enter a valid XML-identifier. For example something_1, block5, id-4.', function (v) {
                return Validation.get('IsEmpty').test(v) || /^[A-Z][A-Z0-9_\/-]*$/i.test(v)
            }],
    ['validate-ssn', 'Please enter a valid social security number. For example 123-45-6789.', function(v) {
            return Validation.get('IsEmpty').test(v) || /^\d{3}-?\d{2}-?\d{4}$/.test(v);
            }],
    ['validate-zip', 'Please enter a valid zip code. For example 90602 or 90602-1234.', function(v) {
            return Validation.get('IsEmpty').test(v) || /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(v);
            }],
    ['validate-zip-international', 'Please enter a valid zip code.', function(v) {
            //return Validation.get('IsEmpty').test(v) || /(^[A-z0-9]{2,10}([\s]{0,1}|[\-]{0,1})[A-z0-9]{2,10}$)/.test(v);
            return true;
            }],
    ['validate-date-au', 'Please use this date format: dd/mm/yyyy. For example 17/03/2006 for the 17th of March, 2006.', function(v) {
                if(Validation.get('IsEmpty').test(v)) return true;
                var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                if(!regex.test(v)) return false;
                var d = new Date(v.replace(regex, '$2/$1/$3'));
                return ( parseInt(RegExp.$2, 10) == (1+d.getMonth()) ) &&
                            (parseInt(RegExp.$1, 10) == d.getDate()) &&
                            (parseInt(RegExp.$3, 10) == d.getFullYear() );
            }],
    ['validate-currency-dollar', 'Please enter a valid $ amount. For example $100.00.', function(v) {
                // [$]1[##][,###]+[.##]
                // [$]1###+[.##]
                // [$]0.##
                // [$].##
                return Validation.get('IsEmpty').test(v) ||  /^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/.test(v)
            }],
    ['validate-one-required', 'Please select one of the above options.', function (v,elm) {
                var p = elm.parentNode;
                var options = p.getElementsByTagName('INPUT');
                return $A(options).any(function(elm) {
                    return $F(elm);
                });
            }],
    ['validate-one-required-by-name', 'Please select one of the options.', function (v,elm) {
                var inputs = $$('input[name="' + elm.name.replace(/([\\"])/g, '\\$1') + '"]');

                var error = 1;
                for(var i=0;i<inputs.length;i++) {
                    if((inputs[i].type == 'checkbox' || inputs[i].type == 'radio') && inputs[i].checked == true) {
                        error = 0;
                    }

                    if(Validation.isOnChange && (inputs[i].type == 'checkbox' || inputs[i].type == 'radio')) {
                        Validation.reset(inputs[i]);
                    }
                }

                if( error == 0 ) {
                    return true;
                } else {
                    return false;
                }
            }],
    ['validate-not-negative-number', 'Please enter a number 0 or greater in this field.', function(v) {
                if (Validation.get('IsEmpty').test(v)) {
                    return true;
                }
                v = parseNumber(v);
                return !isNaN(v) && v >= 0;
            }],
    ['validate-zero-or-greater', 'Please enter a number 0 or greater in this field.', function(v) {
            return Validation.get('validate-not-negative-number').test(v);
        }],
    ['validate-greater-than-zero', 'Please enter a number greater than 0 in this field.', function(v) {
            if (Validation.get('IsEmpty').test(v)) {
                return true;
            }
            v = parseNumber(v);
            return !isNaN(v) && v > 0;
        }],
    ['validate-state', 'Please select State/Province.', function(v) {
                return (v!=0 || v == '');
            }],
    ['validate-new-password', 'Please enter 6 or more characters. Leading or trailing spaces will be ignored.', function(v) {
                if (!Validation.get('validate-password').test(v)) return false;
                if (Validation.get('IsEmpty').test(v) && v != '') return false;
                return true;
            }],
    ['validate-cc-number', 'Please enter a valid credit card number.', function(v, elm) {
                // remove non-numerics
                var ccTypeContainer = $(elm.id.substr(0,elm.id.indexOf('_cc_number')) + '_cc_type');
                if (ccTypeContainer && typeof Validation.creditCartTypes.get(ccTypeContainer.value) != 'undefined'
                        && Validation.creditCartTypes.get(ccTypeContainer.value)[2] == false) {
                    if (!Validation.get('IsEmpty').test(v) && Validation.get('validate-digits').test(v)) {
                        return true;
                    } else {
                        return false;
                    }
                }
                return validateCreditCard(v);
            }],
    ['validate-cc-type', 'Credit card number does not match credit card type.', function(v, elm) {
                // remove credit card number delimiters such as "-" and space
                elm.value = removeDelimiters(elm.value);
                v         = removeDelimiters(v);

                var ccTypeContainer = $(elm.id.substr(0,elm.id.indexOf('_cc_number')) + '_cc_type');
                if (!ccTypeContainer) {
                    return true;
                }
                var ccType = ccTypeContainer.value;

                if (typeof Validation.creditCartTypes.get(ccType) == 'undefined') {
                    return false;
                }

                // Other card type or switch or solo card
                if (Validation.creditCartTypes.get(ccType)[0]==false) {
                    return true;
                }

                // Matched credit card type
                var ccMatchedType = '';

                Validation.creditCartTypes.each(function (pair) {
                    if (pair.value[0] && v.match(pair.value[0])) {
                        ccMatchedType = pair.key;
                        throw $break;
                    }
                });

                if(ccMatchedType != ccType) {
                    return false;
                }

                if (ccTypeContainer.hasClassName('validation-failed') && Validation.isOnChange) {
                    Validation.validate(ccTypeContainer);
                }

                return true;
            }],
     ['validate-cc-type-select', 'Card type does not match credit card number.', function(v, elm) {
                var ccNumberContainer = $(elm.id.substr(0,elm.id.indexOf('_cc_type')) + '_cc_number');
                if (Validation.isOnChange && Validation.get('IsEmpty').test(ccNumberContainer.value)) {
                    return true;
                }
                if (Validation.get('validate-cc-type').test(ccNumberContainer.value, ccNumberContainer)) {
                    Validation.validate(ccNumberContainer);
                }
                return Validation.get('validate-cc-type').test(ccNumberContainer.value, ccNumberContainer);
            }],
     ['validate-cc-exp', 'Incorrect credit card expiration date.', function(v, elm) {
                var ccExpMonth   = v;
                var ccExpYear    = $(elm.id.substr(0,elm.id.indexOf('_expiration')) + '_expiration_yr').value;
                var currentTime  = new Date();
                var currentMonth = currentTime.getMonth() + 1;
                var currentYear  = currentTime.getFullYear();
                if (ccExpMonth < currentMonth && ccExpYear == currentYear) {
                    return false;
                }
                return true;
            }],
     ['validate-cc-cvn', 'Please enter a valid credit card verification number.', function(v, elm) {
                var ccTypeContainer = $(elm.id.substr(0,elm.id.indexOf('_cc_cid')) + '_cc_type');
                if (!ccTypeContainer) {
                    return true;
                }
                var ccType = ccTypeContainer.value;

                if (typeof Validation.creditCartTypes.get(ccType) == 'undefined') {
                    return false;
                }

                var re = Validation.creditCartTypes.get(ccType)[1];

                if (v.match(re)) {
                    return true;
                }

                return false;
            }],
     ['validate-ajax', '', function(v, elm) { return true; }],
     ['validate-data', 'Please use only letters (a-z or A-Z), numbers (0-9) or underscore(_) in this field, first character should be a letter.', function (v) {
                if(v != '' && v) {
                    return /^[A-Za-z]+[A-Za-z0-9_]+$/.test(v);
                }
                return true;
            }],
     ['validate-css-length', 'Please input a valid CSS-length. For example 100px or 77pt or 20em or .5ex or 50%.', function (v) {
                if (v != '' && v) {
                    return /^[0-9\.]+(px|pt|em|ex|%)?$/.test(v) && (!(/\..*\./.test(v))) && !(/\.$/.test(v));
                }
                return true;
            }],
     ['validate-length', 'Text length does not satisfy specified text range.', function (v, elm) {
                var reMax = new RegExp(/^maximum-length-[0-9]+$/);
                var reMin = new RegExp(/^minimum-length-[0-9]+$/);
                var result = true;
                $w(elm.className).each(function(name, index) {
                    if (name.match(reMax) && result) {
                       var length = name.split('-')[2];
                       result = (v.length <= length);
                    }
                    if (name.match(reMin) && result && !Validation.get('IsEmpty').test(v)) {
                        var length = name.split('-')[2];
                        result = (v.length >= length);
                    }
                });
                return result;
            }],
     ['validate-percents', 'Please enter a number lower than 100.', {max:100}],
     ['required-file', 'Please select a file', function(v, elm) {
         var result = !Validation.get('IsEmpty').test(v);
         if (result === false) {
             ovId = elm.id + '_value';
             if ($(ovId)) {
                 result = !Validation.get('IsEmpty').test($(ovId).value);
             }
         }
         return result;
     }],
     ['validate-cc-ukss', 'Please enter issue number or start date for switch/solo card type.', function(v,elm) {
         var endposition;

         if (elm.id.match(/(.)+_cc_issue$/)) {
             endposition = elm.id.indexOf('_cc_issue');
         } else if (elm.id.match(/(.)+_start_month$/)) {
             endposition = elm.id.indexOf('_start_month');
         } else {
             endposition = elm.id.indexOf('_start_year');
         }

         var prefix = elm.id.substr(0,endposition);

         var ccTypeContainer = $(prefix + '_cc_type');

         if (!ccTypeContainer) {
               return true;
         }
         var ccType = ccTypeContainer.value;

         if(['SS','SM','SO'].indexOf(ccType) == -1){
             return true;
         }

         $(prefix + '_cc_issue').advaiceContainer
           = $(prefix + '_start_month').advaiceContainer
           = $(prefix + '_start_year').advaiceContainer
           = $(prefix + '_cc_type_ss_div').down('ul li.adv-container');

         var ccIssue   =  $(prefix + '_cc_issue').value;
         var ccSMonth  =  $(prefix + '_start_month').value;
         var ccSYear   =  $(prefix + '_start_year').value;

         var ccStartDatePresent = (ccSMonth && ccSYear) ? true : false;

         if (!ccStartDatePresent && !ccIssue){
             return false;
         }
         return true;
     }]
]);

function removeDelimiters (v) {
    v = v.replace(/\s/g, '');
    v = v.replace(/\-/g, '');
    return v;
}

function parseNumber(v)
{
    if (typeof v != 'string') {
        return parseFloat(v);
    }

    var isDot  = v.indexOf('.');
    var isComa = v.indexOf(',');

    if (isDot != -1 && isComa != -1) {
        if (isComa > isDot) {
            v = v.replace('.', '').replace(',', '.');
        }
        else {
            v = v.replace(',', '');
        }
    }
    else if (isComa != -1) {
        v = v.replace(',', '.');
    }

    return parseFloat(v);
}

/**
 * Hash with credit card types which can be simply extended in payment modules
 * 0 - regexp for card number
 * 1 - regexp for cvn
 * 2 - check or not credit card number trough Luhn algorithm by
 *     function validateCreditCard which you can find above in this file
 */
Validation.creditCartTypes = $H({
//    'SS': [new RegExp('^((6759[0-9]{12})|(5018|5020|5038|6304|6759|6761|6763[0-9]{12,19})|(49[013][1356][0-9]{12})|(6333[0-9]{12})|(6334[0-4]\d{11})|(633110[0-9]{10})|(564182[0-9]{10}))([0-9]{2,3})?$'), new RegExp('^([0-9]{3}|[0-9]{4})?$'), true],
    'SO': [new RegExp('^(6334[5-9]([0-9]{11}|[0-9]{13,14}))|(6767([0-9]{12}|[0-9]{14,15}))$'), new RegExp('^([0-9]{3}|[0-9]{4})?$'), true],
    'SM': [new RegExp('(^(5[0678])[0-9]{11,18}$)|(^(6[^05])[0-9]{11,18}$)|(^(601)[^1][0-9]{9,16}$)|(^(6011)[0-9]{9,11}$)|(^(6011)[0-9]{13,16}$)|(^(65)[0-9]{11,13}$)|(^(65)[0-9]{15,18}$)|(^(49030)[2-9]([0-9]{10}$|[0-9]{12,13}$))|(^(49033)[5-9]([0-9]{10}$|[0-9]{12,13}$))|(^(49110)[1-2]([0-9]{10}$|[0-9]{12,13}$))|(^(49117)[4-9]([0-9]{10}$|[0-9]{12,13}$))|(^(49118)[0-2]([0-9]{10}$|[0-9]{12,13}$))|(^(4936)([0-9]{12}$|[0-9]{14,15}$))'), new RegExp('^([0-9]{3}|[0-9]{4})?$'), true],
    'VI': [new RegExp('^4[0-9]{12}([0-9]{3})?$'), new RegExp('^[0-9]{3}$'), true],
    'MC': [new RegExp('^5[1-5][0-9]{14}$'), new RegExp('^[0-9]{3}$'), true],
    'AE': [new RegExp('^3[47][0-9]{13}$'), new RegExp('^[0-9]{4}$'), true],
    'DI': [new RegExp('^6011[0-9]{12}$'), new RegExp('^[0-9]{3}$'), true],
    'JCB': [new RegExp('^(3[0-9]{15}|(2131|1800)[0-9]{11})$'), new RegExp('^[0-9]{3,4}$'), true],
    'OT': [false, new RegExp('^([0-9]{3}|[0-9]{4})?$'), false]
});

// script.aculo.us builder.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

var Builder = {
  NODEMAP: {
    AREA: 'map',
    CAPTION: 'table',
    COL: 'table',
    COLGROUP: 'table',
    LEGEND: 'fieldset',
    OPTGROUP: 'select',
    OPTION: 'select',
    PARAM: 'object',
    TBODY: 'table',
    TD: 'table',
    TFOOT: 'table',
    TH: 'table',
    THEAD: 'table',
    TR: 'table'
  },
  // note: For Firefox < 1.5, OPTION and OPTGROUP tags are currently broken,
  //       due to a Firefox bug
  node: function(elementName) {
    elementName = elementName.toUpperCase();

    // try innerHTML approach
    var parentTag = this.NODEMAP[elementName] || 'div';
    var parentElement = document.createElement(parentTag);
    try { // prevent IE "feature": http://dev.rubyonrails.org/ticket/2707
      parentElement.innerHTML = "<" + elementName + "></" + elementName + ">";
    } catch(e) {}
    var element = parentElement.firstChild || null;

    // see if browser added wrapping tags
    if(element && (element.tagName.toUpperCase() != elementName))
      element = element.getElementsByTagName(elementName)[0];

    // fallback to createElement approach
    if(!element) element = document.createElement(elementName);

    // abort if nothing could be created
    if(!element) return;

    // attributes (or text)
    if(arguments[1])
      if(this._isStringOrNumber(arguments[1]) ||
        (arguments[1] instanceof Array) ||
        arguments[1].tagName) {
          this._children(element, arguments[1]);
        } else {
          var attrs = this._attributes(arguments[1]);
          if(attrs.length) {
            try { // prevent IE "feature": http://dev.rubyonrails.org/ticket/2707
              parentElement.innerHTML = "<" +elementName + " " +
                attrs + "></" + elementName + ">";
            } catch(e) {}
            element = parentElement.firstChild || null;
            // workaround firefox 1.0.X bug
            if(!element) {
              element = document.createElement(elementName);
              for(attr in arguments[1])
                element[attr == 'class' ? 'className' : attr] = arguments[1][attr];
            }
            if(element.tagName.toUpperCase() != elementName)
              element = parentElement.getElementsByTagName(elementName)[0];
          }
        }

    // text, or array of children
    if(arguments[2])
      this._children(element, arguments[2]);

     return $(element);
  },
  _text: function(text) {
     return document.createTextNode(text);
  },

  ATTR_MAP: {
    'className': 'class',
    'htmlFor': 'for'
  },

  _attributes: function(attributes) {
    var attrs = [];
    for(attribute in attributes)
      attrs.push((attribute in this.ATTR_MAP ? this.ATTR_MAP[attribute] : attribute) +
          '="' + attributes[attribute].toString().escapeHTML().gsub(/"/,'&quot;') + '"');
    return attrs.join(" ");
  },
  _children: function(element, children) {
    if(children.tagName) {
      element.appendChild(children);
      return;
    }
    if(typeof children=='object') { // array can hold nodes and text
      children.flatten().each( function(e) {
        if(typeof e=='object')
          element.appendChild(e);
        else
          if(Builder._isStringOrNumber(e))
            element.appendChild(Builder._text(e));
      });
    } else
      if(Builder._isStringOrNumber(children))
        element.appendChild(Builder._text(children));
  },
  _isStringOrNumber: function(param) {
    return(typeof param=='string' || typeof param=='number');
  },
  build: function(html) {
    var element = this.node('div');
    $(element).update(html.strip());
    return element.down();
  },
  dump: function(scope) {
    if(typeof scope != 'object' && typeof scope != 'function') scope = window; //global scope

    var tags = ("A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY " +
      "BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM FIELDSET " +
      "FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX "+
      "KBD LABEL LEGEND LI LINK MAP MENU META NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P "+
      "PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD "+
      "TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR").split(/\s+/);

    tags.each( function(tag){
      scope[tag] = function() {
        return Builder.node.apply(Builder, [tag].concat($A(arguments)));
      };
    });
  }
};
// script.aculo.us effects.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
// Contributors:
//  Justin Palmer (http://encytemedia.com/)
//  Mark Pilgrim (http://diveintomark.org/)
//  Martin Bialasinki
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

// converts rgb() and #xxx to #xxxxxx format,
// returns self (or first argument) if not convertable
String.prototype.parseColor = function() {
  var color = '#';
  if (this.slice(0,4) == 'rgb(') {
    var cols = this.slice(4,this.length-1).split(',');
    var i=0; do { color += parseInt(cols[i]).toColorPart() } while (++i<3);
  } else {
    if (this.slice(0,1) == '#') {
      if (this.length==4) for(var i=1;i<4;i++) color += (this.charAt(i) + this.charAt(i)).toLowerCase();
      if (this.length==7) color = this.toLowerCase();
    }
  }
  return (color.length==7 ? color : (arguments[0] || this));
};

/*--------------------------------------------------------------------------*/

Element.collectTextNodes = function(element) {
  return $A($(element).childNodes).collect( function(node) {
    return (node.nodeType==3 ? node.nodeValue :
      (node.hasChildNodes() ? Element.collectTextNodes(node) : ''));
  }).flatten().join('');
};

Element.collectTextNodesIgnoreClass = function(element, className) {
  return $A($(element).childNodes).collect( function(node) {
    return (node.nodeType==3 ? node.nodeValue :
      ((node.hasChildNodes() && !Element.hasClassName(node,className)) ?
        Element.collectTextNodesIgnoreClass(node, className) : ''));
  }).flatten().join('');
};

Element.setContentZoom = function(element, percent) {
  element = $(element);
  element.setStyle({fontSize: (percent/100) + 'em'});
  if (Prototype.Browser.WebKit) window.scrollBy(0,0);
  return element;
};

Element.getInlineOpacity = function(element){
  return $(element).style.opacity || '';
};

Element.forceRerendering = function(element) {
  try {
    element = $(element);
    var n = document.createTextNode(' ');
    element.appendChild(n);
    element.removeChild(n);
  } catch(e) { }
};

/*--------------------------------------------------------------------------*/

var Effect = {
  _elementDoesNotExistError: {
    name: 'ElementDoesNotExistError',
    message: 'The specified DOM element does not exist, but is required for this effect to operate'
  },
  Transitions: {
    linear: Prototype.K,
    sinoidal: function(pos) {
      return (-Math.cos(pos*Math.PI)/2) + .5;
    },
    reverse: function(pos) {
      return 1-pos;
    },
    flicker: function(pos) {
      var pos = ((-Math.cos(pos*Math.PI)/4) + .75) + Math.random()/4;
      return pos > 1 ? 1 : pos;
    },
    wobble: function(pos) {
      return (-Math.cos(pos*Math.PI*(9*pos))/2) + .5;
    },
    pulse: function(pos, pulses) {
      return (-Math.cos((pos*((pulses||5)-.5)*2)*Math.PI)/2) + .5;
    },
    spring: function(pos) {
      return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
    },
    none: function(pos) {
      return 0;
    },
    full: function(pos) {
      return 1;
    }
  },
  DefaultOptions: {
    duration:   1.0,   // seconds
    fps:        100,   // 100= assume 66fps max.
    sync:       false, // true for combining
    from:       0.0,
    to:         1.0,
    delay:      0.0,
    queue:      'parallel'
  },
  tagifyText: function(element) {
    var tagifyStyle = 'position:relative';
    if (Prototype.Browser.IE) tagifyStyle += ';zoom:1';

    element = $(element);
    $A(element.childNodes).each( function(child) {
      if (child.nodeType==3) {
        child.nodeValue.toArray().each( function(character) {
          element.insertBefore(
            new Element('span', {style: tagifyStyle}).update(
              character == ' ' ? String.fromCharCode(160) : character),
              child);
        });
        Element.remove(child);
      }
    });
  },
  multiple: function(element, effect) {
    var elements;
    if (((typeof element == 'object') ||
        Object.isFunction(element)) &&
       (element.length))
      elements = element;
    else
      elements = $(element).childNodes;

    var options = Object.extend({
      speed: 0.1,
      delay: 0.0
    }, arguments[2] || { });
    var masterDelay = options.delay;

    $A(elements).each( function(element, index) {
      new effect(element, Object.extend(options, { delay: index * options.speed + masterDelay }));
    });
  },
  PAIRS: {
    'slide':  ['SlideDown','SlideUp'],
    'blind':  ['BlindDown','BlindUp'],
    'appear': ['Appear','Fade']
  },
  toggle: function(element, effect) {
    element = $(element);
    effect = (effect || 'appear').toLowerCase();
    var options = Object.extend({
      queue: { position:'end', scope:(element.id || 'global'), limit: 1 }
    }, arguments[2] || { });
    Effect[element.visible() ?
      Effect.PAIRS[effect][1] : Effect.PAIRS[effect][0]](element, options);
  }
};

Effect.DefaultOptions.transition = Effect.Transitions.sinoidal;

/* ------------- core effects ------------- */

Effect.ScopedQueue = Class.create(Enumerable, {
  initialize: function() {
    this.effects  = [];
    this.interval = null;
  },
  _each: function(iterator) {
    this.effects._each(iterator);
  },
  add: function(effect) {
    var timestamp = new Date().getTime();

    var position = Object.isString(effect.options.queue) ?
      effect.options.queue : effect.options.queue.position;

    switch(position) {
      case 'front':
        // move unstarted effects after this effect
        this.effects.findAll(function(e){ return e.state=='idle' }).each( function(e) {
            e.startOn  += effect.finishOn;
            e.finishOn += effect.finishOn;
          });
        break;
      case 'with-last':
        timestamp = this.effects.pluck('startOn').max() || timestamp;
        break;
      case 'end':
        // start effect after last queued effect has finished
        timestamp = this.effects.pluck('finishOn').max() || timestamp;
        break;
    }

    effect.startOn  += timestamp;
    effect.finishOn += timestamp;

    if (!effect.options.queue.limit || (this.effects.length < effect.options.queue.limit))
      this.effects.push(effect);

    if (!this.interval)
      this.interval = setInterval(this.loop.bind(this), 15);
  },
  remove: function(effect) {
    this.effects = this.effects.reject(function(e) { return e==effect });
    if (this.effects.length == 0) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },
  loop: function() {
    var timePos = new Date().getTime();
    for(var i=0, len=this.effects.length;i<len;i++)
      this.effects[i] && this.effects[i].loop(timePos);
  }
});

Effect.Queues = {
  instances: $H(),
  get: function(queueName) {
    if (!Object.isString(queueName)) return queueName;

    return this.instances.get(queueName) ||
      this.instances.set(queueName, new Effect.ScopedQueue());
  }
};
Effect.Queue = Effect.Queues.get('global');

Effect.Base = Class.create({
  position: null,
  start: function(options) {
    function codeForEvent(options,eventName){
      return (
        (options[eventName+'Internal'] ? 'this.options.'+eventName+'Internal(this);' : '') +
        (options[eventName] ? 'this.options.'+eventName+'(this);' : '')
      );
    }
    if (options && options.transition === false) options.transition = Effect.Transitions.linear;
    this.options      = Object.extend(Object.extend({ },Effect.DefaultOptions), options || { });
    this.currentFrame = 0;
    this.state        = 'idle';
    this.startOn      = this.options.delay*1000;
    this.finishOn     = this.startOn+(this.options.duration*1000);
    this.fromToDelta  = this.options.to-this.options.from;
    this.totalTime    = this.finishOn-this.startOn;
    this.totalFrames  = this.options.fps*this.options.duration;

    this.render = (function() {
      function dispatch(effect, eventName) {
        if (effect.options[eventName + 'Internal'])
          effect.options[eventName + 'Internal'](effect);
        if (effect.options[eventName])
          effect.options[eventName](effect);
      }

      return function(pos) {
        if (this.state === "idle") {
          this.state = "running";
          dispatch(this, 'beforeSetup');
          if (this.setup) this.setup();
          dispatch(this, 'afterSetup');
        }
        if (this.state === "running") {
          pos = (this.options.transition(pos) * this.fromToDelta) + this.options.from;
          this.position = pos;
          dispatch(this, 'beforeUpdate');
          if (this.update) this.update(pos);
          dispatch(this, 'afterUpdate');
        }
      };
    })();

    this.event('beforeStart');
    if (!this.options.sync)
      Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).add(this);
  },
  loop: function(timePos) {
    if (timePos >= this.startOn) {
      if (timePos >= this.finishOn) {
        this.render(1.0);
        this.cancel();
        this.event('beforeFinish');
        if (this.finish) this.finish();
        this.event('afterFinish');
        return;
      }
      var pos   = (timePos - this.startOn) / this.totalTime,
          frame = (pos * this.totalFrames).round();
      if (frame > this.currentFrame) {
        this.render(pos);
        this.currentFrame = frame;
      }
    }
  },
  cancel: function() {
    if (!this.options.sync)
      Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).remove(this);
    this.state = 'finished';
  },
  event: function(eventName) {
    if (this.options[eventName + 'Internal']) this.options[eventName + 'Internal'](this);
    if (this.options[eventName]) this.options[eventName](this);
  },
  inspect: function() {
    var data = $H();
    for(property in this)
      if (!Object.isFunction(this[property])) data.set(property, this[property]);
    return '#<Effect:' + data.inspect() + ',options:' + $H(this.options).inspect() + '>';
  }
});

Effect.Parallel = Class.create(Effect.Base, {
  initialize: function(effects) {
    this.effects = effects || [];
    this.start(arguments[1]);
  },
  update: function(position) {
    this.effects.invoke('render', position);
  },
  finish: function(position) {
    this.effects.each( function(effect) {
      effect.render(1.0);
      effect.cancel();
      effect.event('beforeFinish');
      if (effect.finish) effect.finish(position);
      effect.event('afterFinish');
    });
  }
});

Effect.Tween = Class.create(Effect.Base, {
  initialize: function(object, from, to) {
    object = Object.isString(object) ? $(object) : object;
    var args = $A(arguments), method = args.last(),
      options = args.length == 5 ? args[3] : null;
    this.method = Object.isFunction(method) ? method.bind(object) :
      Object.isFunction(object[method]) ? object[method].bind(object) :
      function(value) { object[method] = value };
    this.start(Object.extend({ from: from, to: to }, options || { }));
  },
  update: function(position) {
    this.method(position);
  }
});

Effect.Event = Class.create(Effect.Base, {
  initialize: function() {
    this.start(Object.extend({ duration: 0 }, arguments[0] || { }));
  },
  update: Prototype.emptyFunction
});

Effect.Opacity = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    // make this work on IE on elements without 'layout'
    if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
      this.element.setStyle({zoom: 1});
    var options = Object.extend({
      from: this.element.getOpacity() || 0.0,
      to:   1.0
    }, arguments[1] || { });
    this.start(options);
  },
  update: function(position) {
    this.element.setOpacity(position);
  }
});

Effect.Move = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      x:    0,
      y:    0,
      mode: 'relative'
    }, arguments[1] || { });
    this.start(options);
  },
  setup: function() {
    this.element.makePositioned();
    this.originalLeft = parseFloat(this.element.getStyle('left') || '0');
    this.originalTop  = parseFloat(this.element.getStyle('top')  || '0');
    if (this.options.mode == 'absolute') {
      this.options.x = this.options.x - this.originalLeft;
      this.options.y = this.options.y - this.originalTop;
    }
  },
  update: function(position) {
    this.element.setStyle({
      left: (this.options.x  * position + this.originalLeft).round() + 'px',
      top:  (this.options.y  * position + this.originalTop).round()  + 'px'
    });
  }
});

// for backwards compatibility
Effect.MoveBy = function(element, toTop, toLeft) {
  return new Effect.Move(element,
    Object.extend({ x: toLeft, y: toTop }, arguments[3] || { }));
};

Effect.Scale = Class.create(Effect.Base, {
  initialize: function(element, percent) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      scaleX: true,
      scaleY: true,
      scaleContent: true,
      scaleFromCenter: false,
      scaleMode: 'box',        // 'box' or 'contents' or { } with provided values
      scaleFrom: 100.0,
      scaleTo:   percent
    }, arguments[2] || { });
    this.start(options);
  },
  setup: function() {
    this.restoreAfterFinish = this.options.restoreAfterFinish || false;
    this.elementPositioning = this.element.getStyle('position');

    this.originalStyle = { };
    ['top','left','width','height','fontSize'].each( function(k) {
      this.originalStyle[k] = this.element.style[k];
    }.bind(this));

    this.originalTop  = this.element.offsetTop;
    this.originalLeft = this.element.offsetLeft;

    var fontSize = this.element.getStyle('font-size') || '100%';
    ['em','px','%','pt'].each( function(fontSizeType) {
      if (fontSize.indexOf(fontSizeType)>0) {
        this.fontSize     = parseFloat(fontSize);
        this.fontSizeType = fontSizeType;
      }
    }.bind(this));

    this.factor = (this.options.scaleTo - this.options.scaleFrom)/100;

    this.dims = null;
    if (this.options.scaleMode=='box')
      this.dims = [this.element.offsetHeight, this.element.offsetWidth];
    if (/^content/.test(this.options.scaleMode))
      this.dims = [this.element.scrollHeight, this.element.scrollWidth];
    if (!this.dims)
      this.dims = [this.options.scaleMode.originalHeight,
                   this.options.scaleMode.originalWidth];
  },
  update: function(position) {
    var currentScale = (this.options.scaleFrom/100.0) + (this.factor * position);
    if (this.options.scaleContent && this.fontSize)
      this.element.setStyle({fontSize: this.fontSize * currentScale + this.fontSizeType });
    this.setDimensions(this.dims[0] * currentScale, this.dims[1] * currentScale);
  },
  finish: function(position) {
    if (this.restoreAfterFinish) this.element.setStyle(this.originalStyle);
  },
  setDimensions: function(height, width) {
    var d = { };
    if (this.options.scaleX) d.width = width.round() + 'px';
    if (this.options.scaleY) d.height = height.round() + 'px';
    if (this.options.scaleFromCenter) {
      var topd  = (height - this.dims[0])/2;
      var leftd = (width  - this.dims[1])/2;
      if (this.elementPositioning == 'absolute') {
        if (this.options.scaleY) d.top = this.originalTop-topd + 'px';
        if (this.options.scaleX) d.left = this.originalLeft-leftd + 'px';
      } else {
        if (this.options.scaleY) d.top = -topd + 'px';
        if (this.options.scaleX) d.left = -leftd + 'px';
      }
    }
    this.element.setStyle(d);
  }
});

Effect.Highlight = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({ startcolor: '#ffff99' }, arguments[1] || { });
    this.start(options);
  },
  setup: function() {
    // Prevent executing on elements not in the layout flow
    if (this.element.getStyle('display')=='none') { this.cancel(); return; }
    // Disable background image during the effect
    this.oldStyle = { };
    if (!this.options.keepBackgroundImage) {
      this.oldStyle.backgroundImage = this.element.getStyle('background-image');
      this.element.setStyle({backgroundImage: 'none'});
    }
    if (!this.options.endcolor)
      this.options.endcolor = this.element.getStyle('background-color').parseColor('#ffffff');
    if (!this.options.restorecolor)
      this.options.restorecolor = this.element.getStyle('background-color');
    // init color calculations
    this._base  = $R(0,2).map(function(i){ return parseInt(this.options.startcolor.slice(i*2+1,i*2+3),16) }.bind(this));
    this._delta = $R(0,2).map(function(i){ return parseInt(this.options.endcolor.slice(i*2+1,i*2+3),16)-this._base[i] }.bind(this));
  },
  update: function(position) {
    this.element.setStyle({backgroundColor: $R(0,2).inject('#',function(m,v,i){
      return m+((this._base[i]+(this._delta[i]*position)).round().toColorPart()); }.bind(this)) });
  },
  finish: function() {
    this.element.setStyle(Object.extend(this.oldStyle, {
      backgroundColor: this.options.restorecolor
    }));
  }
});

Effect.ScrollTo = function(element) {
  var options = arguments[1] || { },
  scrollOffsets = document.viewport.getScrollOffsets(),
  elementOffsets = $(element).cumulativeOffset();

  if (options.offset) elementOffsets[1] += options.offset;

  return new Effect.Tween(null,
    scrollOffsets.top,
    elementOffsets[1],
    options,
    function(p){ scrollTo(scrollOffsets.left, p.round()); }
  );
};

/* ------------- combination effects ------------- */

Effect.Fade = function(element) {
  element = $(element);
  var oldOpacity = element.getInlineOpacity();
  var options = Object.extend({
    from: element.getOpacity() || 1.0,
    to:   0.0,
    afterFinishInternal: function(effect) {
      if (effect.options.to!=0) return;
      effect.element.hide().setStyle({opacity: oldOpacity});
    }
  }, arguments[1] || { });
  return new Effect.Opacity(element,options);
};

Effect.Appear = function(element) {
  element = $(element);
  var options = Object.extend({
  from: (element.getStyle('display') == 'none' ? 0.0 : element.getOpacity() || 0.0),
  to:   1.0,
  // force Safari to render floated elements properly
  afterFinishInternal: function(effect) {
    effect.element.forceRerendering();
  },
  beforeSetup: function(effect) {
    effect.element.setOpacity(effect.options.from).show();
  }}, arguments[1] || { });
  return new Effect.Opacity(element,options);
};

Effect.Puff = function(element) {
  element = $(element);
  var oldStyle = {
    opacity: element.getInlineOpacity(),
    position: element.getStyle('position'),
    top:  element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height
  };
  return new Effect.Parallel(
   [ new Effect.Scale(element, 200,
      { sync: true, scaleFromCenter: true, scaleContent: true, restoreAfterFinish: true }),
     new Effect.Opacity(element, { sync: true, to: 0.0 } ) ],
     Object.extend({ duration: 1.0,
      beforeSetupInternal: function(effect) {
        Position.absolutize(effect.effects[0].element);
      },
      afterFinishInternal: function(effect) {
         effect.effects[0].element.hide().setStyle(oldStyle); }
     }, arguments[1] || { })
   );
};

Effect.BlindUp = function(element) {
  element = $(element);
  element.makeClipping();
  return new Effect.Scale(element, 0,
    Object.extend({ scaleContent: false,
      scaleX: false,
      restoreAfterFinish: true,
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping();
      }
    }, arguments[1] || { })
  );
};

Effect.BlindDown = function(element) {
  element = $(element);
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleX: false,
    scaleFrom: 0,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makeClipping().setStyle({height: '0px'}).show();
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping();
    }
  }, arguments[1] || { }));
};

Effect.SwitchOff = function(element) {
  element = $(element);
  var oldOpacity = element.getInlineOpacity();
  return new Effect.Appear(element, Object.extend({
    duration: 0.4,
    from: 0,
    transition: Effect.Transitions.flicker,
    afterFinishInternal: function(effect) {
      new Effect.Scale(effect.element, 1, {
        duration: 0.3, scaleFromCenter: true,
        scaleX: false, scaleContent: false, restoreAfterFinish: true,
        beforeSetup: function(effect) {
          effect.element.makePositioned().makeClipping();
        },
        afterFinishInternal: function(effect) {
          effect.element.hide().undoClipping().undoPositioned().setStyle({opacity: oldOpacity});
        }
      });
    }
  }, arguments[1] || { }));
};

Effect.DropOut = function(element) {
  element = $(element);
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left'),
    opacity: element.getInlineOpacity() };
  return new Effect.Parallel(
    [ new Effect.Move(element, {x: 0, y: 100, sync: true }),
      new Effect.Opacity(element, { sync: true, to: 0.0 }) ],
    Object.extend(
      { duration: 0.5,
        beforeSetup: function(effect) {
          effect.effects[0].element.makePositioned();
        },
        afterFinishInternal: function(effect) {
          effect.effects[0].element.hide().undoPositioned().setStyle(oldStyle);
        }
      }, arguments[1] || { }));
};

Effect.Shake = function(element) {
  element = $(element);
  var options = Object.extend({
    distance: 20,
    duration: 0.5
  }, arguments[1] || {});
  var distance = parseFloat(options.distance);
  var split = parseFloat(options.duration) / 10.0;
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left') };
    return new Effect.Move(element,
      { x:  distance, y: 0, duration: split, afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance, y: 0, duration: split, afterFinishInternal: function(effect) {
        effect.element.undoPositioned().setStyle(oldStyle);
  }}); }}); }}); }}); }}); }});
};

Effect.SlideDown = function(element) {
  element = $(element).cleanWhitespace();
  // SlideDown need to have the content of the element wrapped in a container element with fixed height!
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleX: false,
    scaleFrom: window.opera ? 0 : 1,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if (window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().setStyle({height: '0px'}).show();
    },
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping().undoPositioned();
      effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom}); }
    }, arguments[1] || { })
  );
};

Effect.SlideUp = function(element) {
  element = $(element).cleanWhitespace();
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, window.opera ? 0 : 1,
   Object.extend({ scaleContent: false,
    scaleX: false,
    scaleMode: 'box',
    scaleFrom: 100,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if (window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().show();
    },
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping().undoPositioned();
      effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom});
    }
   }, arguments[1] || { })
  );
};

// Bug in opera makes the TD containing this element expand for a instance after finish
Effect.Squish = function(element) {
  return new Effect.Scale(element, window.opera ? 1 : 0, {
    restoreAfterFinish: true,
    beforeSetup: function(effect) {
      effect.element.makeClipping();
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping();
    }
  });
};

Effect.Grow = function(element) {
  element = $(element);
  var options = Object.extend({
    direction: 'center',
    moveTransition: Effect.Transitions.sinoidal,
    scaleTransition: Effect.Transitions.sinoidal,
    opacityTransition: Effect.Transitions.full
  }, arguments[1] || { });
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    height: element.style.height,
    width: element.style.width,
    opacity: element.getInlineOpacity() };

  var dims = element.getDimensions();
  var initialMoveX, initialMoveY;
  var moveX, moveY;

  switch (options.direction) {
    case 'top-left':
      initialMoveX = initialMoveY = moveX = moveY = 0;
      break;
    case 'top-right':
      initialMoveX = dims.width;
      initialMoveY = moveY = 0;
      moveX = -dims.width;
      break;
    case 'bottom-left':
      initialMoveX = moveX = 0;
      initialMoveY = dims.height;
      moveY = -dims.height;
      break;
    case 'bottom-right':
      initialMoveX = dims.width;
      initialMoveY = dims.height;
      moveX = -dims.width;
      moveY = -dims.height;
      break;
    case 'center':
      initialMoveX = dims.width / 2;
      initialMoveY = dims.height / 2;
      moveX = -dims.width / 2;
      moveY = -dims.height / 2;
      break;
  }

  return new Effect.Move(element, {
    x: initialMoveX,
    y: initialMoveY,
    duration: 0.01,
    beforeSetup: function(effect) {
      effect.element.hide().makeClipping().makePositioned();
    },
    afterFinishInternal: function(effect) {
      new Effect.Parallel(
        [ new Effect.Opacity(effect.element, { sync: true, to: 1.0, from: 0.0, transition: options.opacityTransition }),
          new Effect.Move(effect.element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition }),
          new Effect.Scale(effect.element, 100, {
            scaleMode: { originalHeight: dims.height, originalWidth: dims.width },
            sync: true, scaleFrom: window.opera ? 1 : 0, transition: options.scaleTransition, restoreAfterFinish: true})
        ], Object.extend({
             beforeSetup: function(effect) {
               effect.effects[0].element.setStyle({height: '0px'}).show();
             },
             afterFinishInternal: function(effect) {
               effect.effects[0].element.undoClipping().undoPositioned().setStyle(oldStyle);
             }
           }, options)
      );
    }
  });
};

Effect.Shrink = function(element) {
  element = $(element);
  var options = Object.extend({
    direction: 'center',
    moveTransition: Effect.Transitions.sinoidal,
    scaleTransition: Effect.Transitions.sinoidal,
    opacityTransition: Effect.Transitions.none
  }, arguments[1] || { });
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    height: element.style.height,
    width: element.style.width,
    opacity: element.getInlineOpacity() };

  var dims = element.getDimensions();
  var moveX, moveY;

  switch (options.direction) {
    case 'top-left':
      moveX = moveY = 0;
      break;
    case 'top-right':
      moveX = dims.width;
      moveY = 0;
      break;
    case 'bottom-left':
      moveX = 0;
      moveY = dims.height;
      break;
    case 'bottom-right':
      moveX = dims.width;
      moveY = dims.height;
      break;
    case 'center':
      moveX = dims.width / 2;
      moveY = dims.height / 2;
      break;
  }

  return new Effect.Parallel(
    [ new Effect.Opacity(element, { sync: true, to: 0.0, from: 1.0, transition: options.opacityTransition }),
      new Effect.Scale(element, window.opera ? 1 : 0, { sync: true, transition: options.scaleTransition, restoreAfterFinish: true}),
      new Effect.Move(element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition })
    ], Object.extend({
         beforeStartInternal: function(effect) {
           effect.effects[0].element.makePositioned().makeClipping();
         },
         afterFinishInternal: function(effect) {
           effect.effects[0].element.hide().undoClipping().undoPositioned().setStyle(oldStyle); }
       }, options)
  );
};

Effect.Pulsate = function(element) {
  element = $(element);
  var options    = arguments[1] || { },
    oldOpacity = element.getInlineOpacity(),
    transition = options.transition || Effect.Transitions.linear,
    reverser   = function(pos){
      return 1 - transition((-Math.cos((pos*(options.pulses||5)*2)*Math.PI)/2) + .5);
    };

  return new Effect.Opacity(element,
    Object.extend(Object.extend({  duration: 2.0, from: 0,
      afterFinishInternal: function(effect) { effect.element.setStyle({opacity: oldOpacity}); }
    }, options), {transition: reverser}));
};

Effect.Fold = function(element) {
  element = $(element);
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height };
  element.makeClipping();
  return new Effect.Scale(element, 5, Object.extend({
    scaleContent: false,
    scaleX: false,
    afterFinishInternal: function(effect) {
    new Effect.Scale(element, 1, {
      scaleContent: false,
      scaleY: false,
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping().setStyle(oldStyle);
      } });
  }}, arguments[1] || { }));
};

Effect.Morph = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      style: { }
    }, arguments[1] || { });

    if (!Object.isString(options.style)) this.style = $H(options.style);
    else {
      if (options.style.include(':'))
        this.style = options.style.parseStyle();
      else {
        this.element.addClassName(options.style);
        this.style = $H(this.element.getStyles());
        this.element.removeClassName(options.style);
        var css = this.element.getStyles();
        this.style = this.style.reject(function(style) {
          return style.value == css[style.key];
        });
        options.afterFinishInternal = function(effect) {
          effect.element.addClassName(effect.options.style);
          effect.transforms.each(function(transform) {
            effect.element.style[transform.style] = '';
          });
        };
      }
    }
    this.start(options);
  },

  setup: function(){
    function parseColor(color){
      if (!color || ['rgba(0, 0, 0, 0)','transparent'].include(color)) color = '#ffffff';
      color = color.parseColor();
      return $R(0,2).map(function(i){
        return parseInt( color.slice(i*2+1,i*2+3), 16 );
      });
    }
    this.transforms = this.style.map(function(pair){
      var property = pair[0], value = pair[1], unit = null;

      if (value.parseColor('#zzzzzz') != '#zzzzzz') {
        value = value.parseColor();
        unit  = 'color';
      } else if (property == 'opacity') {
        value = parseFloat(value);
        if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
          this.element.setStyle({zoom: 1});
      } else if (Element.CSS_LENGTH.test(value)) {
          var components = value.match(/^([\+\-]?[0-9\.]+)(.*)$/);
          value = parseFloat(components[1]);
          unit = (components.length == 3) ? components[2] : null;
      }

      var originalValue = this.element.getStyle(property);
      return {
        style: property.camelize(),
        originalValue: unit=='color' ? parseColor(originalValue) : parseFloat(originalValue || 0),
        targetValue: unit=='color' ? parseColor(value) : value,
        unit: unit
      };
    }.bind(this)).reject(function(transform){
      return (
        (transform.originalValue == transform.targetValue) ||
        (
          transform.unit != 'color' &&
          (isNaN(transform.originalValue) || isNaN(transform.targetValue))
        )
      );
    });
  },
  update: function(position) {
    var style = { }, transform, i = this.transforms.length;
    while(i--)
      style[(transform = this.transforms[i]).style] =
        transform.unit=='color' ? '#'+
          (Math.round(transform.originalValue[0]+
            (transform.targetValue[0]-transform.originalValue[0])*position)).toColorPart() +
          (Math.round(transform.originalValue[1]+
            (transform.targetValue[1]-transform.originalValue[1])*position)).toColorPart() +
          (Math.round(transform.originalValue[2]+
            (transform.targetValue[2]-transform.originalValue[2])*position)).toColorPart() :
        (transform.originalValue +
          (transform.targetValue - transform.originalValue) * position).toFixed(3) +
            (transform.unit === null ? '' : transform.unit);
    this.element.setStyle(style, true);
  }
});

Effect.Transform = Class.create({
  initialize: function(tracks){
    this.tracks  = [];
    this.options = arguments[1] || { };
    this.addTracks(tracks);
  },
  addTracks: function(tracks){
    tracks.each(function(track){
      track = $H(track);
      var data = track.values().first();
      this.tracks.push($H({
        ids:     track.keys().first(),
        effect:  Effect.Morph,
        options: { style: data }
      }));
    }.bind(this));
    return this;
  },
  play: function(){
    return new Effect.Parallel(
      this.tracks.map(function(track){
        var ids = track.get('ids'), effect = track.get('effect'), options = track.get('options');
        var elements = [$(ids) || $$(ids)].flatten();
        return elements.map(function(e){ return new effect(e, Object.extend({ sync:true }, options)) });
      }).flatten(),
      this.options
    );
  }
});

Element.CSS_PROPERTIES = $w(
  'backgroundColor backgroundPosition borderBottomColor borderBottomStyle ' +
  'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth ' +
  'borderRightColor borderRightStyle borderRightWidth borderSpacing ' +
  'borderTopColor borderTopStyle borderTopWidth bottom clip color ' +
  'fontSize fontWeight height left letterSpacing lineHeight ' +
  'marginBottom marginLeft marginRight marginTop markerOffset maxHeight '+
  'maxWidth minHeight minWidth opacity outlineColor outlineOffset ' +
  'outlineWidth paddingBottom paddingLeft paddingRight paddingTop ' +
  'right textIndent top width wordSpacing zIndex');

Element.CSS_LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;

String.__parseStyleElement = document.createElement('div');
String.prototype.parseStyle = function(){
  var style, styleRules = $H();
  if (Prototype.Browser.WebKit)
    style = new Element('div',{style:this}).style;
  else {
    String.__parseStyleElement.innerHTML = '<div style="' + this + '"></div>';
    style = String.__parseStyleElement.childNodes[0].style;
  }

  Element.CSS_PROPERTIES.each(function(property){
    if (style[property]) styleRules.set(property, style[property]);
  });

  if (Prototype.Browser.IE && this.include('opacity'))
    styleRules.set('opacity', this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]);

  return styleRules;
};

if (document.defaultView && document.defaultView.getComputedStyle) {
  Element.getStyles = function(element) {
    var css = document.defaultView.getComputedStyle($(element), null);
    return Element.CSS_PROPERTIES.inject({ }, function(styles, property) {
      styles[property] = css[property];
      return styles;
    });
  };
} else {
  Element.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = Element.CSS_PROPERTIES.inject({ }, function(results, property) {
      results[property] = css[property];
      return results;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
}

Effect.Methods = {
  morph: function(element, style) {
    element = $(element);
    new Effect.Morph(element, Object.extend({ style: style }, arguments[2] || { }));
    return element;
  },
  visualEffect: function(element, effect, options) {
    element = $(element);
    var s = effect.dasherize().camelize(), klass = s.charAt(0).toUpperCase() + s.substring(1);
    new Effect[klass](element, options);
    return element;
  },
  highlight: function(element, options) {
    element = $(element);
    new Effect.Highlight(element, options);
    return element;
  }
};

$w('fade appear grow shrink fold blindUp blindDown slideUp slideDown '+
  'pulsate shake puff squish switchOff dropOut').each(
  function(effect) {
    Effect.Methods[effect] = function(element, options){
      element = $(element);
      Effect[effect.charAt(0).toUpperCase() + effect.substring(1)](element, options);
      return element;
    };
  }
);

$w('getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles').each(
  function(f) { Effect.Methods[f] = Element[f]; }
);

Element.addMethods(Effect.Methods);
// script.aculo.us dragdrop.js v1.9.0, Thu Dec 23 16:54:48 -0500 2010

// Copyright (c) 2005-2010 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

if(Object.isUndefined(Effect))
  throw("dragdrop.js requires including script.aculo.us' effects.js library");

var Droppables = {
  drops: [],

  remove: function(element) {
    this.drops = this.drops.reject(function(d) { return d.element==$(element) });
  },

  add: function(element) {
    element = $(element);
    var options = Object.extend({
      greedy:     true,
      hoverclass: null,
      tree:       false
    }, arguments[1] || { });

    // cache containers
    if(options.containment) {
      options._containers = [];
      var containment = options.containment;
      if(Object.isArray(containment)) {
        containment.each( function(c) { options._containers.push($(c)) });
      } else {
        options._containers.push($(containment));
      }
    }

    if(options.accept) options.accept = [options.accept].flatten();

    Element.makePositioned(element); // fix IE
    options.element = element;

    this.drops.push(options);
  },

  findDeepestChild: function(drops) {
    deepest = drops[0];

    for (i = 1; i < drops.length; ++i)
      if (Element.isParent(drops[i].element, deepest.element))
        deepest = drops[i];

    return deepest;
  },

  isContained: function(element, drop) {
    var containmentNode;
    if(drop.tree) {
      containmentNode = element.treeNode;
    } else {
      containmentNode = element.parentNode;
    }
    return drop._containers.detect(function(c) { return containmentNode == c });
  },

  isAffected: function(point, element, drop) {
    return (
      (drop.element!=element) &&
      ((!drop._containers) ||
        this.isContained(element, drop)) &&
      ((!drop.accept) ||
        (Element.classNames(element).detect(
          function(v) { return drop.accept.include(v) } ) )) &&
      Position.within(drop.element, point[0], point[1]) );
  },

  deactivate: function(drop) {
    if(drop.hoverclass)
      Element.removeClassName(drop.element, drop.hoverclass);
    this.last_active = null;
  },

  activate: function(drop) {
    if(drop.hoverclass)
      Element.addClassName(drop.element, drop.hoverclass);
    this.last_active = drop;
  },

  show: function(point, element) {
    if(!this.drops.length) return;
    var drop, affected = [];

    this.drops.each( function(drop) {
      if(Droppables.isAffected(point, element, drop))
        affected.push(drop);
    });

    if(affected.length>0)
      drop = Droppables.findDeepestChild(affected);

    if(this.last_active && this.last_active != drop) this.deactivate(this.last_active);
    if (drop) {
      Position.within(drop.element, point[0], point[1]);
      if(drop.onHover)
        drop.onHover(element, drop.element, Position.overlap(drop.overlap, drop.element));

      if (drop != this.last_active) Droppables.activate(drop);
    }
  },

  fire: function(event, element) {
    if(!this.last_active) return;
    Position.prepare();

    if (this.isAffected([Event.pointerX(event), Event.pointerY(event)], element, this.last_active))
      if (this.last_active.onDrop) {
        this.last_active.onDrop(element, this.last_active.element, event);
        return true;
      }
  },

  reset: function() {
    if(this.last_active)
      this.deactivate(this.last_active);
  }
};

var Draggables = {
  drags: [],
  observers: [],

  register: function(draggable) {
    if(this.drags.length == 0) {
      this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
      this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
      this.eventKeypress  = this.keyPress.bindAsEventListener(this);

      Event.observe(document, "mouseup", this.eventMouseUp);
      Event.observe(document, "mousemove", this.eventMouseMove);
      Event.observe(document, "keypress", this.eventKeypress);
    }
    this.drags.push(draggable);
  },

  unregister: function(draggable) {
    this.drags = this.drags.reject(function(d) { return d==draggable });
    if(this.drags.length == 0) {
      Event.stopObserving(document, "mouseup", this.eventMouseUp);
      Event.stopObserving(document, "mousemove", this.eventMouseMove);
      Event.stopObserving(document, "keypress", this.eventKeypress);
    }
  },

  activate: function(draggable) {
    if(draggable.options.delay) {
      this._timeout = setTimeout(function() {
        Draggables._timeout = null;
        window.focus();
        Draggables.activeDraggable = draggable;
      }.bind(this), draggable.options.delay);
    } else {
      window.focus(); // allows keypress events if window isn't currently focused, fails for Safari
      this.activeDraggable = draggable;
    }
  },

  deactivate: function() {
    this.activeDraggable = null;
  },

  updateDrag: function(event) {
    if(!this.activeDraggable) return;
    var pointer = [Event.pointerX(event), Event.pointerY(event)];
    // Mozilla-based browsers fire successive mousemove events with
    // the same coordinates, prevent needless redrawing (moz bug?)
    if(this._lastPointer && (this._lastPointer.inspect() == pointer.inspect())) return;
    this._lastPointer = pointer;

    this.activeDraggable.updateDrag(event, pointer);
  },

  endDrag: function(event) {
    if(this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    if(!this.activeDraggable) return;
    this._lastPointer = null;
    this.activeDraggable.endDrag(event);
    this.activeDraggable = null;
  },

  keyPress: function(event) {
    if(this.activeDraggable)
      this.activeDraggable.keyPress(event);
  },

  addObserver: function(observer) {
    this.observers.push(observer);
    this._cacheObserverCallbacks();
  },

  removeObserver: function(element) {  // element instead of observer fixes mem leaks
    this.observers = this.observers.reject( function(o) { return o.element==element });
    this._cacheObserverCallbacks();
  },

  notify: function(eventName, draggable, event) {  // 'onStart', 'onEnd', 'onDrag'
    if(this[eventName+'Count'] > 0)
      this.observers.each( function(o) {
        if(o[eventName]) o[eventName](eventName, draggable, event);
      });
    if(draggable.options[eventName]) draggable.options[eventName](draggable, event);
  },

  _cacheObserverCallbacks: function() {
    ['onStart','onEnd','onDrag'].each( function(eventName) {
      Draggables[eventName+'Count'] = Draggables.observers.select(
        function(o) { return o[eventName]; }
      ).length;
    });
  }
};

/*--------------------------------------------------------------------------*/

var Draggable = Class.create({
  initialize: function(element) {
    var defaults = {
      handle: false,
      reverteffect: function(element, top_offset, left_offset) {
        var dur = Math.sqrt(Math.abs(top_offset^2)+Math.abs(left_offset^2))*0.02;
        new Effect.Move(element, { x: -left_offset, y: -top_offset, duration: dur,
          queue: {scope:'_draggable', position:'end'}
        });
      },
      endeffect: function(element) {
        var toOpacity = Object.isNumber(element._opacity) ? element._opacity : 1.0;
        new Effect.Opacity(element, {duration:0.2, from:0.7, to:toOpacity,
          queue: {scope:'_draggable', position:'end'},
          afterFinish: function(){
            Draggable._dragging[element] = false
          }
        });
      },
      zindex: 1000,
      revert: false,
      quiet: false,
      scroll: false,
      scrollSensitivity: 20,
      scrollSpeed: 15,
      snap: false,  // false, or xy or [x,y] or function(x,y){ return [x,y] }
      delay: 0
    };

    if(!arguments[1] || Object.isUndefined(arguments[1].endeffect))
      Object.extend(defaults, {
        starteffect: function(element) {
          element._opacity = Element.getOpacity(element);
          Draggable._dragging[element] = true;
          new Effect.Opacity(element, {duration:0.2, from:element._opacity, to:0.7});
        }
      });

    var options = Object.extend(defaults, arguments[1] || { });

    this.element = $(element);

    if(options.handle && Object.isString(options.handle))
      this.handle = this.element.down('.'+options.handle, 0);

    if(!this.handle) this.handle = $(options.handle);
    if(!this.handle) this.handle = this.element;

    if(options.scroll && !options.scroll.scrollTo && !options.scroll.outerHTML) {
      options.scroll = $(options.scroll);
      this._isScrollChild = Element.childOf(this.element, options.scroll);
    }

    Element.makePositioned(this.element); // fix IE

    this.options  = options;
    this.dragging = false;

    this.eventMouseDown = this.initDrag.bindAsEventListener(this);
    Event.observe(this.handle, "mousedown", this.eventMouseDown);

    Draggables.register(this);
  },

  destroy: function() {
    Event.stopObserving(this.handle, "mousedown", this.eventMouseDown);
    Draggables.unregister(this);
  },

  currentDelta: function() {
    return([
      parseInt(Element.getStyle(this.element,'left') || '0'),
      parseInt(Element.getStyle(this.element,'top') || '0')]);
  },

  initDrag: function(event) {
    if(!Object.isUndefined(Draggable._dragging[this.element]) &&
      Draggable._dragging[this.element]) return;
    if(Event.isLeftClick(event)) {
      // abort on form elements, fixes a Firefox issue
      var src = Event.element(event);
      if((tag_name = src.tagName.toUpperCase()) && (
        tag_name=='INPUT' ||
        tag_name=='SELECT' ||
        tag_name=='OPTION' ||
        tag_name=='BUTTON' ||
        tag_name=='TEXTAREA')) return;

      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      var pos     = this.element.cumulativeOffset();
      this.offset = [0,1].map( function(i) { return (pointer[i] - pos[i]) });

      Draggables.activate(this);
      Event.stop(event);
    }
  },

  startDrag: function(event) {
    this.dragging = true;
    if(!this.delta)
      this.delta = this.currentDelta();

    if(this.options.zindex) {
      this.originalZ = parseInt(Element.getStyle(this.element,'z-index') || 0);
      this.element.style.zIndex = this.options.zindex;
    }

    if(this.options.ghosting) {
      this._clone = this.element.cloneNode(true);
      this._originallyAbsolute = (this.element.getStyle('position') == 'absolute');
      if (!this._originallyAbsolute)
        Position.absolutize(this.element);
      this.element.parentNode.insertBefore(this._clone, this.element);
    }

    if(this.options.scroll) {
      if (this.options.scroll == window) {
        var where = this._getWindowScroll(this.options.scroll);
        this.originalScrollLeft = where.left;
        this.originalScrollTop = where.top;
      } else {
        this.originalScrollLeft = this.options.scroll.scrollLeft;
        this.originalScrollTop = this.options.scroll.scrollTop;
      }
    }

    Draggables.notify('onStart', this, event);

    if(this.options.starteffect) this.options.starteffect(this.element);
  },

  updateDrag: function(event, pointer) {
    if(!this.dragging) this.startDrag(event);

    if(!this.options.quiet){
      Position.prepare();
      Droppables.show(pointer, this.element);
    }

    Draggables.notify('onDrag', this, event);

    this.draw(pointer);
    if(this.options.change) this.options.change(this);

    if(this.options.scroll) {
      this.stopScrolling();

      var p;
      if (this.options.scroll == window) {
        with(this._getWindowScroll(this.options.scroll)) { p = [ left, top, left+width, top+height ]; }
      } else {
        p = Position.page(this.options.scroll).toArray();
        p[0] += this.options.scroll.scrollLeft + Position.deltaX;
        p[1] += this.options.scroll.scrollTop + Position.deltaY;
        p.push(p[0]+this.options.scroll.offsetWidth);
        p.push(p[1]+this.options.scroll.offsetHeight);
      }
      var speed = [0,0];
      if(pointer[0] < (p[0]+this.options.scrollSensitivity)) speed[0] = pointer[0]-(p[0]+this.options.scrollSensitivity);
      if(pointer[1] < (p[1]+this.options.scrollSensitivity)) speed[1] = pointer[1]-(p[1]+this.options.scrollSensitivity);
      if(pointer[0] > (p[2]-this.options.scrollSensitivity)) speed[0] = pointer[0]-(p[2]-this.options.scrollSensitivity);
      if(pointer[1] > (p[3]-this.options.scrollSensitivity)) speed[1] = pointer[1]-(p[3]-this.options.scrollSensitivity);
      this.startScrolling(speed);
    }

    // fix AppleWebKit rendering
    if(Prototype.Browser.WebKit) window.scrollBy(0,0);

    Event.stop(event);
  },

  finishDrag: function(event, success) {
    this.dragging = false;

    if(this.options.quiet){
      Position.prepare();
      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      Droppables.show(pointer, this.element);
    }

    if(this.options.ghosting) {
      if (!this._originallyAbsolute)
        Position.relativize(this.element);
      delete this._originallyAbsolute;
      Element.remove(this._clone);
      this._clone = null;
    }

    var dropped = false;
    if(success) {
      dropped = Droppables.fire(event, this.element);
      if (!dropped) dropped = false;
    }
    if(dropped && this.options.onDropped) this.options.onDropped(this.element);
    Draggables.notify('onEnd', this, event);

    var revert = this.options.revert;
    if(revert && Object.isFunction(revert)) revert = revert(this.element);

    var d = this.currentDelta();
    if(revert && this.options.reverteffect) {
      if (dropped == 0 || revert != 'failure')
        this.options.reverteffect(this.element,
          d[1]-this.delta[1], d[0]-this.delta[0]);
    } else {
      this.delta = d;
    }

    if(this.options.zindex)
      this.element.style.zIndex = this.originalZ;

    if(this.options.endeffect)
      this.options.endeffect(this.element);

    Draggables.deactivate(this);
    Droppables.reset();
  },

  keyPress: function(event) {
    if(event.keyCode!=Event.KEY_ESC) return;
    this.finishDrag(event, false);
    Event.stop(event);
  },

  endDrag: function(event) {
    if(!this.dragging) return;
    this.stopScrolling();
    this.finishDrag(event, true);
    Event.stop(event);
  },

  draw: function(point) {
    var pos = this.element.cumulativeOffset();
    if(this.options.ghosting) {
      var r   = Position.realOffset(this.element);
      pos[0] += r[0] - Position.deltaX; pos[1] += r[1] - Position.deltaY;
    }

    var d = this.currentDelta();
    pos[0] -= d[0]; pos[1] -= d[1];

    if(this.options.scroll && (this.options.scroll != window && this._isScrollChild)) {
      pos[0] -= this.options.scroll.scrollLeft-this.originalScrollLeft;
      pos[1] -= this.options.scroll.scrollTop-this.originalScrollTop;
    }

    var p = [0,1].map(function(i){
      return (point[i]-pos[i]-this.offset[i])
    }.bind(this));

    if(this.options.snap) {
      if(Object.isFunction(this.options.snap)) {
        p = this.options.snap(p[0],p[1],this);
      } else {
      if(Object.isArray(this.options.snap)) {
        p = p.map( function(v, i) {
          return (v/this.options.snap[i]).round()*this.options.snap[i] }.bind(this));
      } else {
        p = p.map( function(v) {
          return (v/this.options.snap).round()*this.options.snap }.bind(this));
      }
    }}

    var style = this.element.style;
    if((!this.options.constraint) || (this.options.constraint=='horizontal'))
      style.left = p[0] + "px";
    if((!this.options.constraint) || (this.options.constraint=='vertical'))
      style.top  = p[1] + "px";

    if(style.visibility=="hidden") style.visibility = ""; // fix gecko rendering
  },

  stopScrolling: function() {
    if(this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
      Draggables._lastScrollPointer = null;
    }
  },

  startScrolling: function(speed) {
    if(!(speed[0] || speed[1])) return;
    this.scrollSpeed = [speed[0]*this.options.scrollSpeed,speed[1]*this.options.scrollSpeed];
    this.lastScrolled = new Date();
    this.scrollInterval = setInterval(this.scroll.bind(this), 10);
  },

  scroll: function() {
    var current = new Date();
    var delta = current - this.lastScrolled;
    this.lastScrolled = current;
    if(this.options.scroll == window) {
      with (this._getWindowScroll(this.options.scroll)) {
        if (this.scrollSpeed[0] || this.scrollSpeed[1]) {
          var d = delta / 1000;
          this.options.scroll.scrollTo( left + d*this.scrollSpeed[0], top + d*this.scrollSpeed[1] );
        }
      }
    } else {
      this.options.scroll.scrollLeft += this.scrollSpeed[0] * delta / 1000;
      this.options.scroll.scrollTop  += this.scrollSpeed[1] * delta / 1000;
    }

    Position.prepare();
    Droppables.show(Draggables._lastPointer, this.element);
    Draggables.notify('onDrag', this);
    if (this._isScrollChild) {
      Draggables._lastScrollPointer = Draggables._lastScrollPointer || $A(Draggables._lastPointer);
      Draggables._lastScrollPointer[0] += this.scrollSpeed[0] * delta / 1000;
      Draggables._lastScrollPointer[1] += this.scrollSpeed[1] * delta / 1000;
      if (Draggables._lastScrollPointer[0] < 0)
        Draggables._lastScrollPointer[0] = 0;
      if (Draggables._lastScrollPointer[1] < 0)
        Draggables._lastScrollPointer[1] = 0;
      this.draw(Draggables._lastScrollPointer);
    }

    if(this.options.change) this.options.change(this);
  },

  _getWindowScroll: function(w) {
    var T, L, W, H;
    with (w.document) {
      if (w.document.documentElement && documentElement.scrollTop) {
        T = documentElement.scrollTop;
        L = documentElement.scrollLeft;
      } else if (w.document.body) {
        T = body.scrollTop;
        L = body.scrollLeft;
      }
      if (w.innerWidth) {
        W = w.innerWidth;
        H = w.innerHeight;
      } else if (w.document.documentElement && documentElement.clientWidth) {
        W = documentElement.clientWidth;
        H = documentElement.clientHeight;
      } else {
        W = body.offsetWidth;
        H = body.offsetHeight;
      }
    }
    return { top: T, left: L, width: W, height: H };
  }
});

Draggable._dragging = { };

/*--------------------------------------------------------------------------*/

var SortableObserver = Class.create({
  initialize: function(element, observer) {
    this.element   = $(element);
    this.observer  = observer;
    this.lastValue = Sortable.serialize(this.element);
  },

  onStart: function() {
    this.lastValue = Sortable.serialize(this.element);
  },

  onEnd: function() {
    Sortable.unmark();
    if(this.lastValue != Sortable.serialize(this.element))
      this.observer(this.element)
  }
});

var Sortable = {
  SERIALIZE_RULE: /^[^_\-](?:[A-Za-z0-9\-\_]*)[_](.*)$/,

  sortables: { },

  _findRootElement: function(element) {
    while (element.tagName.toUpperCase() != "BODY") {
      if(element.id && Sortable.sortables[element.id]) return element;
      element = element.parentNode;
    }
  },

  options: function(element) {
    element = Sortable._findRootElement($(element));
    if(!element) return;
    return Sortable.sortables[element.id];
  },

  destroy: function(element){
    element = $(element);
    var s = Sortable.sortables[element.id];

    if(s) {
      Draggables.removeObserver(s.element);
      s.droppables.each(function(d){ Droppables.remove(d) });
      s.draggables.invoke('destroy');

      delete Sortable.sortables[s.element.id];
    }
  },

  create: function(element) {
    element = $(element);
    var options = Object.extend({
      element:     element,
      tag:         'li',       // assumes li children, override with tag: 'tagname'
      dropOnEmpty: false,
      tree:        false,
      treeTag:     'ul',
      overlap:     'vertical', // one of 'vertical', 'horizontal'
      constraint:  'vertical', // one of 'vertical', 'horizontal', false
      containment: element,    // also takes array of elements (or id's); or false
      handle:      false,      // or a CSS class
      only:        false,
      delay:       0,
      hoverclass:  null,
      ghosting:    false,
      quiet:       false,
      scroll:      false,
      scrollSensitivity: 20,
      scrollSpeed: 15,
      format:      this.SERIALIZE_RULE,

      // these take arrays of elements or ids and can be
      // used for better initialization performance
      elements:    false,
      handles:     false,

      onChange:    Prototype.emptyFunction,
      onUpdate:    Prototype.emptyFunction
    }, arguments[1] || { });

    // clear any old sortable with same element
    this.destroy(element);

    // build options for the draggables
    var options_for_draggable = {
      revert:      true,
      quiet:       options.quiet,
      scroll:      options.scroll,
      scrollSpeed: options.scrollSpeed,
      scrollSensitivity: options.scrollSensitivity,
      delay:       options.delay,
      ghosting:    options.ghosting,
      constraint:  options.constraint,
      handle:      options.handle };

    if(options.starteffect)
      options_for_draggable.starteffect = options.starteffect;

    if(options.reverteffect)
      options_for_draggable.reverteffect = options.reverteffect;
    else
      if(options.ghosting) options_for_draggable.reverteffect = function(element) {
        element.style.top  = 0;
        element.style.left = 0;
      };

    if(options.endeffect)
      options_for_draggable.endeffect = options.endeffect;

    if(options.zindex)
      options_for_draggable.zindex = options.zindex;

    // build options for the droppables
    var options_for_droppable = {
      overlap:     options.overlap,
      containment: options.containment,
      tree:        options.tree,
      hoverclass:  options.hoverclass,
      onHover:     Sortable.onHover
    };

    var options_for_tree = {
      onHover:      Sortable.onEmptyHover,
      overlap:      options.overlap,
      containment:  options.containment,
      hoverclass:   options.hoverclass
    };

    // fix for gecko engine
    Element.cleanWhitespace(element);

    options.draggables = [];
    options.droppables = [];

    // drop on empty handling
    if(options.dropOnEmpty || options.tree) {
      Droppables.add(element, options_for_tree);
      options.droppables.push(element);
    }

    (options.elements || this.findElements(element, options) || []).each( function(e,i) {
      var handle = options.handles ? $(options.handles[i]) :
        (options.handle ? $(e).select('.' + options.handle)[0] : e);
      options.draggables.push(
        new Draggable(e, Object.extend(options_for_draggable, { handle: handle })));
      Droppables.add(e, options_for_droppable);
      if(options.tree) e.treeNode = element;
      options.droppables.push(e);
    });

    if(options.tree) {
      (Sortable.findTreeElements(element, options) || []).each( function(e) {
        Droppables.add(e, options_for_tree);
        e.treeNode = element;
        options.droppables.push(e);
      });
    }

    // keep reference
    this.sortables[element.identify()] = options;

    // for onupdate
    Draggables.addObserver(new SortableObserver(element, options.onUpdate));

  },

  // return all suitable-for-sortable elements in a guaranteed order
  findElements: function(element, options) {
    return Element.findChildren(
      element, options.only, options.tree ? true : false, options.tag);
  },

  findTreeElements: function(element, options) {
    return Element.findChildren(
      element, options.only, options.tree ? true : false, options.treeTag);
  },

  onHover: function(element, dropon, overlap) {
    if(Element.isParent(dropon, element)) return;

    if(overlap > .33 && overlap < .66 && Sortable.options(dropon).tree) {
      return;
    } else if(overlap>0.5) {
      Sortable.mark(dropon, 'before');
      if(dropon.previousSibling != element) {
        var oldParentNode = element.parentNode;
        element.style.visibility = "hidden"; // fix gecko rendering
        dropon.parentNode.insertBefore(element, dropon);
        if(dropon.parentNode!=oldParentNode)
          Sortable.options(oldParentNode).onChange(element);
        Sortable.options(dropon.parentNode).onChange(element);
      }
    } else {
      Sortable.mark(dropon, 'after');
      var nextElement = dropon.nextSibling || null;
      if(nextElement != element) {
        var oldParentNode = element.parentNode;
        element.style.visibility = "hidden"; // fix gecko rendering
        dropon.parentNode.insertBefore(element, nextElement);
        if(dropon.parentNode!=oldParentNode)
          Sortable.options(oldParentNode).onChange(element);
        Sortable.options(dropon.parentNode).onChange(element);
      }
    }
  },

  onEmptyHover: function(element, dropon, overlap) {
    var oldParentNode = element.parentNode;
    var droponOptions = Sortable.options(dropon);

    if(!Element.isParent(dropon, element)) {
      var index;

      var children = Sortable.findElements(dropon, {tag: droponOptions.tag, only: droponOptions.only});
      var child = null;

      if(children) {
        var offset = Element.offsetSize(dropon, droponOptions.overlap) * (1.0 - overlap);

        for (index = 0; index < children.length; index += 1) {
          if (offset - Element.offsetSize (children[index], droponOptions.overlap) >= 0) {
            offset -= Element.offsetSize (children[index], droponOptions.overlap);
          } else if (offset - (Element.offsetSize (children[index], droponOptions.overlap) / 2) >= 0) {
            child = index + 1 < children.length ? children[index + 1] : null;
            break;
          } else {
            child = children[index];
            break;
          }
        }
      }

      dropon.insertBefore(element, child);

      Sortable.options(oldParentNode).onChange(element);
      droponOptions.onChange(element);
    }
  },

  unmark: function() {
    if(Sortable._marker) Sortable._marker.hide();
  },

  mark: function(dropon, position) {
    // mark on ghosting only
    var sortable = Sortable.options(dropon.parentNode);
    if(sortable && !sortable.ghosting) return;

    if(!Sortable._marker) {
      Sortable._marker =
        ($('dropmarker') || Element.extend(document.createElement('DIV'))).
          hide().addClassName('dropmarker').setStyle({position:'absolute'});
      document.getElementsByTagName("body").item(0).appendChild(Sortable._marker);
    }
    var offsets = dropon.cumulativeOffset();
    Sortable._marker.setStyle({left: offsets[0]+'px', top: offsets[1] + 'px'});

    if(position=='after')
      if(sortable.overlap == 'horizontal')
        Sortable._marker.setStyle({left: (offsets[0]+dropon.clientWidth) + 'px'});
      else
        Sortable._marker.setStyle({top: (offsets[1]+dropon.clientHeight) + 'px'});

    Sortable._marker.show();
  },

  _tree: function(element, options, parent) {
    var children = Sortable.findElements(element, options) || [];

    for (var i = 0; i < children.length; ++i) {
      var match = children[i].id.match(options.format);

      if (!match) continue;

      var child = {
        id: encodeURIComponent(match ? match[1] : null),
        element: element,
        parent: parent,
        children: [],
        position: parent.children.length,
        container: $(children[i]).down(options.treeTag)
      };

      /* Get the element containing the children and recurse over it */
      if (child.container)
        this._tree(child.container, options, child);

      parent.children.push (child);
    }

    return parent;
  },

  tree: function(element) {
    element = $(element);
    var sortableOptions = this.options(element);
    var options = Object.extend({
      tag: sortableOptions.tag,
      treeTag: sortableOptions.treeTag,
      only: sortableOptions.only,
      name: element.id,
      format: sortableOptions.format
    }, arguments[1] || { });

    var root = {
      id: null,
      parent: null,
      children: [],
      container: element,
      position: 0
    };

    return Sortable._tree(element, options, root);
  },

  /* Construct a [i] index for a particular node */
  _constructIndex: function(node) {
    var index = '';
    do {
      if (node.id) index = '[' + node.position + ']' + index;
    } while ((node = node.parent) != null);
    return index;
  },

  sequence: function(element) {
    element = $(element);
    var options = Object.extend(this.options(element), arguments[1] || { });

    return $(this.findElements(element, options) || []).map( function(item) {
      return item.id.match(options.format) ? item.id.match(options.format)[1] : '';
    });
  },

  setSequence: function(element, new_sequence) {
    element = $(element);
    var options = Object.extend(this.options(element), arguments[2] || { });

    var nodeMap = { };
    this.findElements(element, options).each( function(n) {
        if (n.id.match(options.format))
            nodeMap[n.id.match(options.format)[1]] = [n, n.parentNode];
        n.parentNode.removeChild(n);
    });

    new_sequence.each(function(ident) {
      var n = nodeMap[ident];
      if (n) {
        n[1].appendChild(n[0]);
        delete nodeMap[ident];
      }
    });
  },

  serialize: function(element) {
    element = $(element);
    var options = Object.extend(Sortable.options(element), arguments[1] || { });
    var name = encodeURIComponent(
      (arguments[1] && arguments[1].name) ? arguments[1].name : element.id);

    if (options.tree) {
      return Sortable.tree(element, arguments[1]).children.map( function (item) {
        return [name + Sortable._constructIndex(item) + "[id]=" +
                encodeURIComponent(item.id)].concat(item.children.map(arguments.callee));
      }).flatten().join('&');
    } else {
      return Sortable.sequence(element, arguments[1]).map( function(item) {
        return name + "[]=" + encodeURIComponent(item);
      }).join('&');
    }
  }
};

// Returns true if child is contained within element
Element.isParent = function(child, element) {
  if (!child.parentNode || child == element) return false;
  if (child.parentNode == element) return true;
  return Element.isParent(child.parentNode, element);
};

Element.findChildren = function(element, only, recursive, tagName) {
  if(!element.hasChildNodes()) return null;
  tagName = tagName.toUpperCase();
  if(only) only = [only].flatten();
  var elements = [];
  $A(element.childNodes).each( function(e) {
    if(e.tagName && e.tagName.toUpperCase()==tagName &&
      (!only || (Element.classNames(e).detect(function(v) { return only.include(v) }))))
        elements.push(e);
    if(recursive) {
      var grandchildren = Element.findChildren(e, only, recursive, tagName);
      if(grandchildren) elements.push(grandchildren);
    }
  });

  return (elements.length>0 ? elements.flatten() : []);
};

Element.offsetSize = function (element, type) {
  return element['offset' + ((type=='vertical' || type=='height') ? 'Height' : 'Width')];
};
// script.aculo.us controls.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//           (c) 2005-2008 Ivan Krstic (http://blogs.law.harvard.edu/ivan)
//           (c) 2005-2008 Jon Tirsen (http://www.tirsen.com)
// Contributors:
//  Richard Livsey
//  Rahul Bhargava
//  Rob Wills
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

// Autocompleter.Base handles all the autocompletion functionality
// that's independent of the data source for autocompletion. This
// includes drawing the autocompletion menu, observing keyboard
// and mouse events, and similar.
//
// Specific autocompleters need to provide, at the very least,
// a getUpdatedChoices function that will be invoked every time
// the text inside the monitored textbox changes. This method
// should get the text for which to provide autocompletion by
// invoking this.getToken(), NOT by directly accessing
// this.element.value. This is to allow incremental tokenized
// autocompletion. Specific auto-completion logic (AJAX, etc)
// belongs in getUpdatedChoices.
//
// Tokenized incremental autocompletion is enabled automatically
// when an autocompleter is instantiated with the 'tokens' option
// in the options parameter, e.g.:
// new Ajax.Autocompleter('id','upd', '/url/', { tokens: ',' });
// will incrementally autocomplete with a comma as the token.
// Additionally, ',' in the above example can be replaced with
// a token array, e.g. { tokens: [',', '\n'] } which
// enables autocompletion on multiple tokens. This is most
// useful when one of the tokens is \n (a newline), as it
// allows smart autocompletion after linebreaks.

if(typeof Effect == 'undefined')
  throw("controls.js requires including script.aculo.us' effects.js library");

var Autocompleter = { };
Autocompleter.Base = Class.create({
  baseInitialize: function(element, update, options) {
    element          = $(element);
    this.element     = element;
    this.update      = $(update);
    this.hasFocus    = false;
    this.changed     = false;
    this.active      = false;
    this.index       = 0;
    this.entryCount  = 0;
    this.oldElementValue = this.element.value;

    if(this.setOptions)
      this.setOptions(options);
    else
      this.options = options || { };

    this.options.paramName    = this.options.paramName || this.element.name;
    this.options.tokens       = this.options.tokens || [];
    this.options.frequency    = this.options.frequency || 0.4;
    this.options.minChars     = this.options.minChars || 1;
    this.options.onShow       = this.options.onShow ||
      function(element, update){
        if(!update.style.position || update.style.position=='absolute') {
          update.style.position = 'absolute';
          Position.clone(element, update, {
            setHeight: false,
            offsetTop: element.offsetHeight
          });
        }
        Effect.Appear(update,{duration:0.15});
      };
    this.options.onHide = this.options.onHide ||
      function(element, update){ new Effect.Fade(update,{duration:0.15}) };

    if(typeof(this.options.tokens) == 'string')
      this.options.tokens = new Array(this.options.tokens);
    // Force carriage returns as token delimiters anyway
    if (!this.options.tokens.include('\n'))
      this.options.tokens.push('\n');

    this.observer = null;

    this.element.setAttribute('autocomplete','off');

    Element.hide(this.update);

    Event.observe(this.element, 'blur', this.onBlur.bindAsEventListener(this));
    Event.observe(this.element, 'keydown', this.onKeyPress.bindAsEventListener(this));
  },

  show: function() {
    if(Element.getStyle(this.update, 'display')=='none') this.options.onShow(this.element, this.update);
    if(!this.iefix &&
      (Prototype.Browser.IE) &&
      (Element.getStyle(this.update, 'position')=='absolute')) {
      new Insertion.After(this.update,
       '<iframe id="' + this.update.id + '_iefix" '+
       'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' +
       'src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
      this.iefix = $(this.update.id+'_iefix');
    }
    if(this.iefix) setTimeout(this.fixIEOverlapping.bind(this), 50);
  },

  fixIEOverlapping: function() {
    Position.clone(this.update, this.iefix, {setTop:(!this.update.style.height)});
    this.iefix.style.zIndex = 1;
    this.update.style.zIndex = 2;
    Element.show(this.iefix);
  },

  hide: function() {
    this.stopIndicator();
    if(Element.getStyle(this.update, 'display')!='none') this.options.onHide(this.element, this.update);
    if(this.iefix) Element.hide(this.iefix);
  },

  startIndicator: function() {
    if(this.options.indicator) Element.show(this.options.indicator);
  },

  stopIndicator: function() {
    if(this.options.indicator) Element.hide(this.options.indicator);
  },

  onKeyPress: function(event) {
    if(this.active)
      switch(event.keyCode) {
       case Event.KEY_TAB:
       case Event.KEY_RETURN:
         this.selectEntry();
         Event.stop(event);
       case Event.KEY_ESC:
         this.hide();
         this.active = false;
         Event.stop(event);
         return;
       case Event.KEY_LEFT:
       case Event.KEY_RIGHT:
         return;
       case Event.KEY_UP:
         this.markPrevious();
         this.render();
         Event.stop(event);
         return;
       case Event.KEY_DOWN:
         this.markNext();
         this.render();
         Event.stop(event);
         return;
      }
     else
       if(event.keyCode==Event.KEY_TAB || event.keyCode==Event.KEY_RETURN ||
         (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) return;

    this.changed = true;
    this.hasFocus = true;

    if(this.observer) clearTimeout(this.observer);
      this.observer =
        setTimeout(this.onObserverEvent.bind(this), this.options.frequency*1000);
  },

  activate: function() {
    this.changed = false;
    this.hasFocus = true;
    this.getUpdatedChoices();
  },

  onHover: function(event) {
    var element = Event.findElement(event, 'LI');
    if(this.index != element.autocompleteIndex)
    {
        this.index = element.autocompleteIndex;
        this.render();
    }
    Event.stop(event);
  },

  onClick: function(event) {
    var element = Event.findElement(event, 'LI');
    this.index = element.autocompleteIndex;
    this.selectEntry();
    this.hide();
  },

  onBlur: function(event) {
    // needed to make click events working
    setTimeout(this.hide.bind(this), 250);
    this.hasFocus = false;
    this.active = false;
  },

  render: function() {
    if(this.entryCount > 0) {
      for (var i = 0; i < this.entryCount; i++)
        this.index==i ?
          Element.addClassName(this.getEntry(i),"selected") :
          Element.removeClassName(this.getEntry(i),"selected");
      if(this.hasFocus) {
        this.show();
        this.active = true;
      }
    } else {
      this.active = false;
      this.hide();
    }
  },

  markPrevious: function() {
    if(this.index > 0) this.index--;
      else this.index = this.entryCount-1;
    //this.getEntry(this.index).scrollIntoView(true); useless
  },

  markNext: function() {
    if(this.index < this.entryCount-1) this.index++;
      else this.index = 0;
    this.getEntry(this.index).scrollIntoView(false);
  },

  getEntry: function(index) {
    return this.update.firstChild.childNodes[index];
  },

  getCurrentEntry: function() {
    return this.getEntry(this.index);
  },

  selectEntry: function() {
    this.active = false;
    this.updateElement(this.getCurrentEntry());
  },

  updateElement: function(selectedElement) {
    if (this.options.updateElement) {
      this.options.updateElement(selectedElement);
      return;
    }
    var value = '';
    if (this.options.select) {
      var nodes = $(selectedElement).select('.' + this.options.select) || [];
      if(nodes.length>0) value = Element.collectTextNodes(nodes[0], this.options.select);
    } else
      value = Element.collectTextNodesIgnoreClass(selectedElement, 'informal');

    var bounds = this.getTokenBounds();
    if (bounds[0] != -1) {
      var newValue = this.element.value.substr(0, bounds[0]);
      var whitespace = this.element.value.substr(bounds[0]).match(/^\s+/);
      if (whitespace)
        newValue += whitespace[0];
      this.element.value = newValue + value + this.element.value.substr(bounds[1]);
    } else {
      this.element.value = value;
    }
    this.oldElementValue = this.element.value;
    this.element.focus();

    if (this.options.afterUpdateElement)
      this.options.afterUpdateElement(this.element, selectedElement);
  },

  updateChoices: function(choices) {
    if(!this.changed && this.hasFocus) {
      this.update.innerHTML = choices;
      Element.cleanWhitespace(this.update);
      Element.cleanWhitespace(this.update.down());

      if(this.update.firstChild && this.update.down().childNodes) {
        this.entryCount =
          this.update.down().childNodes.length;
        for (var i = 0; i < this.entryCount; i++) {
          var entry = this.getEntry(i);
          entry.autocompleteIndex = i;
          this.addObservers(entry);
        }
      } else {
        this.entryCount = 0;
      }

      this.stopIndicator();
      this.index = 0;

      if(this.entryCount==1 && this.options.autoSelect) {
        this.selectEntry();
        this.hide();
      } else {
        this.render();
      }
    }
  },

  addObservers: function(element) {
    Event.observe(element, "mouseover", this.onHover.bindAsEventListener(this));
    Event.observe(element, "click", this.onClick.bindAsEventListener(this));
  },

  onObserverEvent: function() {
    this.changed = false;
    this.tokenBounds = null;
    if(this.getToken().length>=this.options.minChars) {
      this.getUpdatedChoices();
    } else {
      this.active = false;
      this.hide();
    }
    this.oldElementValue = this.element.value;
  },

  getToken: function() {
    var bounds = this.getTokenBounds();
    return this.element.value.substring(bounds[0], bounds[1]).strip();
  },

  getTokenBounds: function() {
    if (null != this.tokenBounds) return this.tokenBounds;
    var value = this.element.value;
    if (value.strip().empty()) return [-1, 0];
    var diff = arguments.callee.getFirstDifferencePos(value, this.oldElementValue);
    var offset = (diff == this.oldElementValue.length ? 1 : 0);
    var prevTokenPos = -1, nextTokenPos = value.length;
    var tp;
    for (var index = 0, l = this.options.tokens.length; index < l; ++index) {
      tp = value.lastIndexOf(this.options.tokens[index], diff + offset - 1);
      if (tp > prevTokenPos) prevTokenPos = tp;
      tp = value.indexOf(this.options.tokens[index], diff + offset);
      if (-1 != tp && tp < nextTokenPos) nextTokenPos = tp;
    }
    return (this.tokenBounds = [prevTokenPos + 1, nextTokenPos]);
  }
});

Autocompleter.Base.prototype.getTokenBounds.getFirstDifferencePos = function(newS, oldS) {
  var boundary = Math.min(newS.length, oldS.length);
  for (var index = 0; index < boundary; ++index)
    if (newS[index] != oldS[index])
      return index;
  return boundary;
};

Ajax.Autocompleter = Class.create(Autocompleter.Base, {
  initialize: function(element, update, url, options) {
    this.baseInitialize(element, update, options);
    this.options.asynchronous  = true;
    this.options.onComplete    = this.onComplete.bind(this);
    this.options.defaultParams = this.options.parameters || null;
    this.url                   = url;
  },

  getUpdatedChoices: function() {
    this.startIndicator();

    var entry = encodeURIComponent(this.options.paramName) + '=' +
      encodeURIComponent(this.getToken());

    this.options.parameters = this.options.callback ?
      this.options.callback(this.element, entry) : entry;

    if(this.options.defaultParams)
      this.options.parameters += '&' + this.options.defaultParams;

    new Ajax.Request(this.url, this.options);
  },

  onComplete: function(request) {
    this.updateChoices(request.responseText);
  }
});

// The local array autocompleter. Used when you'd prefer to
// inject an array of autocompletion options into the page, rather
// than sending out Ajax queries, which can be quite slow sometimes.
//
// The constructor takes four parameters. The first two are, as usual,
// the id of the monitored textbox, and id of the autocompletion menu.
// The third is the array you want to autocomplete from, and the fourth
// is the options block.
//
// Extra local autocompletion options:
// - choices - How many autocompletion choices to offer
//
// - partialSearch - If false, the autocompleter will match entered
//                    text only at the beginning of strings in the
//                    autocomplete array. Defaults to true, which will
//                    match text at the beginning of any *word* in the
//                    strings in the autocomplete array. If you want to
//                    search anywhere in the string, additionally set
//                    the option fullSearch to true (default: off).
//
// - fullSsearch - Search anywhere in autocomplete array strings.
//
// - partialChars - How many characters to enter before triggering
//                   a partial match (unlike minChars, which defines
//                   how many characters are required to do any match
//                   at all). Defaults to 2.
//
// - ignoreCase - Whether to ignore case when autocompleting.
//                 Defaults to true.
//
// It's possible to pass in a custom function as the 'selector'
// option, if you prefer to write your own autocompletion logic.
// In that case, the other options above will not apply unless
// you support them.

Autocompleter.Local = Class.create(Autocompleter.Base, {
  initialize: function(element, update, array, options) {
    this.baseInitialize(element, update, options);
    this.options.array = array;
  },

  getUpdatedChoices: function() {
    this.updateChoices(this.options.selector(this));
  },

  setOptions: function(options) {
    this.options = Object.extend({
      choices: 10,
      partialSearch: true,
      partialChars: 2,
      ignoreCase: true,
      fullSearch: false,
      selector: function(instance) {
        var ret       = []; // Beginning matches
        var partial   = []; // Inside matches
        var entry     = instance.getToken();
        var count     = 0;

        for (var i = 0; i < instance.options.array.length &&
          ret.length < instance.options.choices ; i++) {

          var elem = instance.options.array[i];
          var foundPos = instance.options.ignoreCase ?
            elem.toLowerCase().indexOf(entry.toLowerCase()) :
            elem.indexOf(entry);

          while (foundPos != -1) {
            if (foundPos == 0 && elem.length != entry.length) {
              ret.push("<li><strong>" + elem.substr(0, entry.length) + "</strong>" +
                elem.substr(entry.length) + "</li>");
              break;
            } else if (entry.length >= instance.options.partialChars &&
              instance.options.partialSearch && foundPos != -1) {
              if (instance.options.fullSearch || /\s/.test(elem.substr(foundPos-1,1))) {
                partial.push("<li>" + elem.substr(0, foundPos) + "<strong>" +
                  elem.substr(foundPos, entry.length) + "</strong>" + elem.substr(
                  foundPos + entry.length) + "</li>");
                break;
              }
            }

            foundPos = instance.options.ignoreCase ?
              elem.toLowerCase().indexOf(entry.toLowerCase(), foundPos + 1) :
              elem.indexOf(entry, foundPos + 1);

          }
        }
        if (partial.length)
          ret = ret.concat(partial.slice(0, instance.options.choices - ret.length));
        return "<ul>" + ret.join('') + "</ul>";
      }
    }, options || { });
  }
});

// AJAX in-place editor and collection editor
// Full rewrite by Christophe Porteneuve <tdd@tddsworld.com> (April 2007).

// Use this if you notice weird scrolling problems on some browsers,
// the DOM might be a bit confused when this gets called so do this
// waits 1 ms (with setTimeout) until it does the activation
Field.scrollFreeActivate = function(field) {
  setTimeout(function() {
    Field.activate(field);
  }, 1);
};

Ajax.InPlaceEditor = Class.create({
  initialize: function(element, url, options) {
    this.url = url;
    this.element = element = $(element);
    this.prepareOptions();
    this._controls = { };
    arguments.callee.dealWithDeprecatedOptions(options); // DEPRECATION LAYER!!!
    Object.extend(this.options, options || { });
    if (!this.options.formId && this.element.id) {
      this.options.formId = this.element.id + '-inplaceeditor';
      if ($(this.options.formId))
        this.options.formId = '';
    }
    if (this.options.externalControl)
      this.options.externalControl = $(this.options.externalControl);
    if (!this.options.externalControl)
      this.options.externalControlOnly = false;
    this._originalBackground = this.element.getStyle('background-color') || 'transparent';
    this.element.title = this.options.clickToEditText;
    this._boundCancelHandler = this.handleFormCancellation.bind(this);
    this._boundComplete = (this.options.onComplete || Prototype.emptyFunction).bind(this);
    this._boundFailureHandler = this.handleAJAXFailure.bind(this);
    this._boundSubmitHandler = this.handleFormSubmission.bind(this);
    this._boundWrapperHandler = this.wrapUp.bind(this);
    this.registerListeners();
  },
  checkForEscapeOrReturn: function(e) {
    if (!this._editing || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (Event.KEY_ESC == e.keyCode)
      this.handleFormCancellation(e);
    else if (Event.KEY_RETURN == e.keyCode)
      this.handleFormSubmission(e);
  },
  createControl: function(mode, handler, extraClasses) {
    var control = this.options[mode + 'Control'];
    var text = this.options[mode + 'Text'];
    if ('button' == control) {
      var btn = document.createElement('input');
      btn.type = 'submit';
      btn.value = text;
      btn.className = 'editor_' + mode + '_button';
      if ('cancel' == mode)
        btn.onclick = this._boundCancelHandler;
      this._form.appendChild(btn);
      this._controls[mode] = btn;
    } else if ('link' == control) {
      var link = document.createElement('a');
      link.href = '#';
      link.appendChild(document.createTextNode(text));
      link.onclick = 'cancel' == mode ? this._boundCancelHandler : this._boundSubmitHandler;
      link.className = 'editor_' + mode + '_link';
      if (extraClasses)
        link.className += ' ' + extraClasses;
      this._form.appendChild(link);
      this._controls[mode] = link;
    }
  },
  createEditField: function() {
    var text = (this.options.loadTextURL ? this.options.loadingText : this.getText());
    var fld;
    if (1 >= this.options.rows && !/\r|\n/.test(this.getText())) {
      fld = document.createElement('input');
      fld.type = 'text';
      var size = this.options.size || this.options.cols || 0;
      if (0 < size) fld.size = size;
    } else {
      fld = document.createElement('textarea');
      fld.rows = (1 >= this.options.rows ? this.options.autoRows : this.options.rows);
      fld.cols = this.options.cols || 40;
    }
    fld.name = this.options.paramName;
    fld.value = text; // No HTML breaks conversion anymore
    fld.className = 'editor_field';
    if (this.options.submitOnBlur)
      fld.onblur = this._boundSubmitHandler;
    this._controls.editor = fld;
    if (this.options.loadTextURL)
      this.loadExternalText();
    this._form.appendChild(this._controls.editor);
  },
  createForm: function() {
    var ipe = this;
    function addText(mode, condition) {
      var text = ipe.options['text' + mode + 'Controls'];
      if (!text || condition === false) return;
      ipe._form.appendChild(document.createTextNode(text));
    };
    this._form = $(document.createElement('form'));
    this._form.id = this.options.formId;
    this._form.addClassName(this.options.formClassName);
    this._form.onsubmit = this._boundSubmitHandler;
    this.createEditField();
    if ('textarea' == this._controls.editor.tagName.toLowerCase())
      this._form.appendChild(document.createElement('br'));
    if (this.options.onFormCustomization)
      this.options.onFormCustomization(this, this._form);
    addText('Before', this.options.okControl || this.options.cancelControl);
    this.createControl('ok', this._boundSubmitHandler);
    addText('Between', this.options.okControl && this.options.cancelControl);
    this.createControl('cancel', this._boundCancelHandler, 'editor_cancel');
    addText('After', this.options.okControl || this.options.cancelControl);
  },
  destroy: function() {
    if (this._oldInnerHTML)
      this.element.innerHTML = this._oldInnerHTML;
    this.leaveEditMode();
    this.unregisterListeners();
  },
  enterEditMode: function(e) {
    if (this._saving || this._editing) return;
    this._editing = true;
    this.triggerCallback('onEnterEditMode');
    if (this.options.externalControl)
      this.options.externalControl.hide();
    this.element.hide();
    this.createForm();
    this.element.parentNode.insertBefore(this._form, this.element);
    if (!this.options.loadTextURL)
      this.postProcessEditField();
    if (e) Event.stop(e);
  },
  enterHover: function(e) {
    if (this.options.hoverClassName)
      this.element.addClassName(this.options.hoverClassName);
    if (this._saving) return;
    this.triggerCallback('onEnterHover');
  },
  getText: function() {
    return this.element.innerHTML.unescapeHTML();
  },
  handleAJAXFailure: function(transport) {
    this.triggerCallback('onFailure', transport);
    if (this._oldInnerHTML) {
      this.element.innerHTML = this._oldInnerHTML;
      this._oldInnerHTML = null;
    }
  },
  handleFormCancellation: function(e) {
    this.wrapUp();
    if (e) Event.stop(e);
  },
  handleFormSubmission: function(e) {
    var form = this._form;
    var value = $F(this._controls.editor);
    this.prepareSubmission();
    var params = this.options.callback(form, value) || '';
    if (Object.isString(params))
      params = params.toQueryParams();
    params.editorId = this.element.id;
    if (this.options.htmlResponse) {
      var options = Object.extend({ evalScripts: true }, this.options.ajaxOptions);
      Object.extend(options, {
        parameters: params,
        onComplete: this._boundWrapperHandler,
        onFailure: this._boundFailureHandler
      });
      new Ajax.Updater({ success: this.element }, this.url, options);
    } else {
      var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
      Object.extend(options, {
        parameters: params,
        onComplete: this._boundWrapperHandler,
        onFailure: this._boundFailureHandler
      });
      new Ajax.Request(this.url, options);
    }
    if (e) Event.stop(e);
  },
  leaveEditMode: function() {
    this.element.removeClassName(this.options.savingClassName);
    this.removeForm();
    this.leaveHover();
    this.element.style.backgroundColor = this._originalBackground;
    this.element.show();
    if (this.options.externalControl)
      this.options.externalControl.show();
    this._saving = false;
    this._editing = false;
    this._oldInnerHTML = null;
    this.triggerCallback('onLeaveEditMode');
  },
  leaveHover: function(e) {
    if (this.options.hoverClassName)
      this.element.removeClassName(this.options.hoverClassName);
    if (this._saving) return;
    this.triggerCallback('onLeaveHover');
  },
  loadExternalText: function() {
    this._form.addClassName(this.options.loadingClassName);
    this._controls.editor.disabled = true;
    var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
    Object.extend(options, {
      parameters: 'editorId=' + encodeURIComponent(this.element.id),
      onComplete: Prototype.emptyFunction,
      onSuccess: function(transport) {
        this._form.removeClassName(this.options.loadingClassName);
        var text = transport.responseText;
        if (this.options.stripLoadedTextTags)
          text = text.stripTags();
        this._controls.editor.value = text;
        this._controls.editor.disabled = false;
        this.postProcessEditField();
      }.bind(this),
      onFailure: this._boundFailureHandler
    });
    new Ajax.Request(this.options.loadTextURL, options);
  },
  postProcessEditField: function() {
    var fpc = this.options.fieldPostCreation;
    if (fpc)
      $(this._controls.editor)['focus' == fpc ? 'focus' : 'activate']();
  },
  prepareOptions: function() {
    this.options = Object.clone(Ajax.InPlaceEditor.DefaultOptions);
    Object.extend(this.options, Ajax.InPlaceEditor.DefaultCallbacks);
    [this._extraDefaultOptions].flatten().compact().each(function(defs) {
      Object.extend(this.options, defs);
    }.bind(this));
  },
  prepareSubmission: function() {
    this._saving = true;
    this.removeForm();
    this.leaveHover();
    this.showSaving();
  },
  registerListeners: function() {
    this._listeners = { };
    var listener;
    $H(Ajax.InPlaceEditor.Listeners).each(function(pair) {
      listener = this[pair.value].bind(this);
      this._listeners[pair.key] = listener;
      if (!this.options.externalControlOnly)
        this.element.observe(pair.key, listener);
      if (this.options.externalControl)
        this.options.externalControl.observe(pair.key, listener);
    }.bind(this));
  },
  removeForm: function() {
    if (!this._form) return;
    this._form.remove();
    this._form = null;
    this._controls = { };
  },
  showSaving: function() {
    this._oldInnerHTML = this.element.innerHTML;
    this.element.innerHTML = this.options.savingText;
    this.element.addClassName(this.options.savingClassName);
    this.element.style.backgroundColor = this._originalBackground;
    this.element.show();
  },
  triggerCallback: function(cbName, arg) {
    if ('function' == typeof this.options[cbName]) {
      this.options[cbName](this, arg);
    }
  },
  unregisterListeners: function() {
    $H(this._listeners).each(function(pair) {
      if (!this.options.externalControlOnly)
        this.element.stopObserving(pair.key, pair.value);
      if (this.options.externalControl)
        this.options.externalControl.stopObserving(pair.key, pair.value);
    }.bind(this));
  },
  wrapUp: function(transport) {
    this.leaveEditMode();
    // Can't use triggerCallback due to backward compatibility: requires
    // binding + direct element
    this._boundComplete(transport, this.element);
  }
});

Object.extend(Ajax.InPlaceEditor.prototype, {
  dispose: Ajax.InPlaceEditor.prototype.destroy
});

Ajax.InPlaceCollectionEditor = Class.create(Ajax.InPlaceEditor, {
  initialize: function($super, element, url, options) {
    this._extraDefaultOptions = Ajax.InPlaceCollectionEditor.DefaultOptions;
    $super(element, url, options);
  },

  createEditField: function() {
    var list = document.createElement('select');
    list.name = this.options.paramName;
    list.size = 1;
    this._controls.editor = list;
    this._collection = this.options.collection || [];
    if (this.options.loadCollectionURL)
      this.loadCollection();
    else
      this.checkForExternalText();
    this._form.appendChild(this._controls.editor);
  },

  loadCollection: function() {
    this._form.addClassName(this.options.loadingClassName);
    this.showLoadingText(this.options.loadingCollectionText);
    var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
    Object.extend(options, {
      parameters: 'editorId=' + encodeURIComponent(this.element.id),
      onComplete: Prototype.emptyFunction,
      onSuccess: function(transport) {
        var js = transport.responseText.strip();
        if (!/^\[.*\]$/.test(js)) // TODO: improve sanity check
          throw('Server returned an invalid collection representation.');
        this._collection = eval(js);
        this.checkForExternalText();
      }.bind(this),
      onFailure: this.onFailure
    });
    new Ajax.Request(this.options.loadCollectionURL, options);
  },

  showLoadingText: function(text) {
    this._controls.editor.disabled = true;
    var tempOption = this._controls.editor.firstChild;
    if (!tempOption) {
      tempOption = document.createElement('option');
      tempOption.value = '';
      this._controls.editor.appendChild(tempOption);
      tempOption.selected = true;
    }
    tempOption.update((text || '').stripScripts().stripTags());
  },

  checkForExternalText: function() {
    this._text = this.getText();
    if (this.options.loadTextURL)
      this.loadExternalText();
    else
      this.buildOptionList();
  },

  loadExternalText: function() {
    this.showLoadingText(this.options.loadingText);
    var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
    Object.extend(options, {
      parameters: 'editorId=' + encodeURIComponent(this.element.id),
      onComplete: Prototype.emptyFunction,
      onSuccess: function(transport) {
        this._text = transport.responseText.strip();
        this.buildOptionList();
      }.bind(this),
      onFailure: this.onFailure
    });
    new Ajax.Request(this.options.loadTextURL, options);
  },

  buildOptionList: function() {
    this._form.removeClassName(this.options.loadingClassName);
    this._collection = this._collection.map(function(entry) {
      return 2 === entry.length ? entry : [entry, entry].flatten();
    });
    var marker = ('value' in this.options) ? this.options.value : this._text;
    var textFound = this._collection.any(function(entry) {
      return entry[0] == marker;
    }.bind(this));
    this._controls.editor.update('');
    var option;
    this._collection.each(function(entry, index) {
      option = document.createElement('option');
      option.value = entry[0];
      option.selected = textFound ? entry[0] == marker : 0 == index;
      option.appendChild(document.createTextNode(entry[1]));
      this._controls.editor.appendChild(option);
    }.bind(this));
    this._controls.editor.disabled = false;
    Field.scrollFreeActivate(this._controls.editor);
  }
});

//**** DEPRECATION LAYER FOR InPlace[Collection]Editor! ****
//**** This only  exists for a while,  in order to  let ****
//**** users adapt to  the new API.  Read up on the new ****
//**** API and convert your code to it ASAP!            ****

Ajax.InPlaceEditor.prototype.initialize.dealWithDeprecatedOptions = function(options) {
  if (!options) return;
  function fallback(name, expr) {
    if (name in options || expr === undefined) return;
    options[name] = expr;
  };
  fallback('cancelControl', (options.cancelLink ? 'link' : (options.cancelButton ? 'button' :
    options.cancelLink == options.cancelButton == false ? false : undefined)));
  fallback('okControl', (options.okLink ? 'link' : (options.okButton ? 'button' :
    options.okLink == options.okButton == false ? false : undefined)));
  fallback('highlightColor', options.highlightcolor);
  fallback('highlightEndColor', options.highlightendcolor);
};

Object.extend(Ajax.InPlaceEditor, {
  DefaultOptions: {
    ajaxOptions: { },
    autoRows: 3,                                // Use when multi-line w/ rows == 1
    cancelControl: 'link',                      // 'link'|'button'|false
    cancelText: 'cancel',
    clickToEditText: 'Click to edit',
    externalControl: null,                      // id|elt
    externalControlOnly: false,
    fieldPostCreation: 'activate',              // 'activate'|'focus'|false
    formClassName: 'inplaceeditor-form',
    formId: null,                               // id|elt
    highlightColor: '#ffff99',
    highlightEndColor: '#ffffff',
    hoverClassName: '',
    htmlResponse: true,
    loadingClassName: 'inplaceeditor-loading',
    loadingText: 'Loading...',
    okControl: 'button',                        // 'link'|'button'|false
    okText: 'ok',
    paramName: 'value',
    rows: 1,                                    // If 1 and multi-line, uses autoRows
    savingClassName: 'inplaceeditor-saving',
    savingText: 'Saving...',
    size: 0,
    stripLoadedTextTags: false,
    submitOnBlur: false,
    textAfterControls: '',
    textBeforeControls: '',
    textBetweenControls: ''
  },
  DefaultCallbacks: {
    callback: function(form) {
      return Form.serialize(form);
    },
    onComplete: function(transport, element) {
      // For backward compatibility, this one is bound to the IPE, and passes
      // the element directly.  It was too often customized, so we don't break it.
      new Effect.Highlight(element, {
        startcolor: this.options.highlightColor, keepBackgroundImage: true });
    },
    onEnterEditMode: null,
    onEnterHover: function(ipe) {
      ipe.element.style.backgroundColor = ipe.options.highlightColor;
      if (ipe._effect)
        ipe._effect.cancel();
    },
    onFailure: function(transport, ipe) {
      alert('Error communication with the server: ' + transport.responseText.stripTags());
    },
    onFormCustomization: null, // Takes the IPE and its generated form, after editor, before controls.
    onLeaveEditMode: null,
    onLeaveHover: function(ipe) {
      ipe._effect = new Effect.Highlight(ipe.element, {
        startcolor: ipe.options.highlightColor, endcolor: ipe.options.highlightEndColor,
        restorecolor: ipe._originalBackground, keepBackgroundImage: true
      });
    }
  },
  Listeners: {
    click: 'enterEditMode',
    keydown: 'checkForEscapeOrReturn',
    mouseover: 'enterHover',
    mouseout: 'leaveHover'
  }
});

Ajax.InPlaceCollectionEditor.DefaultOptions = {
  loadingCollectionText: 'Loading options...'
};

// Delayed observer, like Form.Element.Observer,
// but waits for delay after last key input
// Ideal for live-search fields

Form.Element.DelayedObserver = Class.create({
  initialize: function(element, delay, callback) {
    this.delay     = delay || 0.5;
    this.element   = $(element);
    this.callback  = callback;
    this.timer     = null;
    this.lastValue = $F(this.element);
    Event.observe(this.element,'keyup',this.delayedListener.bindAsEventListener(this));
  },
  delayedListener: function(event) {
    if(this.lastValue == $F(this.element)) return;
    if(this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(this.onTimerEvent.bind(this), this.delay * 1000);
    this.lastValue = $F(this.element);
  },
  onTimerEvent: function() {
    this.timer = null;
    this.callback(this.element, $F(this.element));
  }
});
// script.aculo.us slider.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Marty Haught, Thomas Fuchs
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

if (!Control) var Control = { };

// options:
//  axis: 'vertical', or 'horizontal' (default)
//
// callbacks:
//  onChange(value)
//  onSlide(value)
Control.Slider = Class.create({
  initialize: function(handle, track, options) {
    var slider = this;

    if (Object.isArray(handle)) {
      this.handles = handle.collect( function(e) { return $(e) });
    } else {
      this.handles = [$(handle)];
    }

    this.track   = $(track);
    this.options = options || { };

    this.axis      = this.options.axis || 'horizontal';
    this.increment = this.options.increment || 1;
    this.step      = parseInt(this.options.step || '1');
    this.range     = this.options.range || $R(0,1);

    this.value     = 0; // assure backwards compat
    this.values    = this.handles.map( function() { return 0 });
    this.spans     = this.options.spans ? this.options.spans.map(function(s){ return $(s) }) : false;
    this.options.startSpan = $(this.options.startSpan || null);
    this.options.endSpan   = $(this.options.endSpan || null);

    this.restricted = this.options.restricted || false;

    this.maximum   = this.options.maximum || this.range.end;
    this.minimum   = this.options.minimum || this.range.start;

    // Will be used to align the handle onto the track, if necessary
    this.alignX = parseInt(this.options.alignX || '0');
    this.alignY = parseInt(this.options.alignY || '0');

    this.trackLength = this.maximumOffset() - this.minimumOffset();

    this.handleLength = this.isVertical() ?
      (this.handles[0].offsetHeight != 0 ?
        this.handles[0].offsetHeight : this.handles[0].style.height.replace(/px$/,"")) :
      (this.handles[0].offsetWidth != 0 ? this.handles[0].offsetWidth :
        this.handles[0].style.width.replace(/px$/,""));

    this.active   = false;
    this.dragging = false;
    this.disabled = false;

    if (this.options.disabled) this.setDisabled();

    // Allowed values array
    this.allowedValues = this.options.values ? this.options.values.sortBy(Prototype.K) : false;
    if (this.allowedValues) {
      this.minimum = this.allowedValues.min();
      this.maximum = this.allowedValues.max();
    }

    this.eventMouseDown = this.startDrag.bindAsEventListener(this);
    this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
    this.eventMouseMove = this.update.bindAsEventListener(this);

    // Initialize handles in reverse (make sure first handle is active)
    this.handles.each( function(h,i) {
      i = slider.handles.length-1-i;
      slider.setValue(parseFloat(
        (Object.isArray(slider.options.sliderValue) ?
          slider.options.sliderValue[i] : slider.options.sliderValue) ||
         slider.range.start), i);
      h.makePositioned().observe("mousedown", slider.eventMouseDown);
    });

    this.track.observe("mousedown", this.eventMouseDown);
    document.observe("mouseup", this.eventMouseUp);
    $(this.track.parentNode.parentNode).observe("mousemove", this.eventMouseMove);


    this.initialized = true;
  },
  dispose: function() {
    var slider = this;
    Event.stopObserving(this.track, "mousedown", this.eventMouseDown);
    Event.stopObserving(document, "mouseup", this.eventMouseUp);
    Event.stopObserving(this.track.parentNode.parentNode, "mousemove", this.eventMouseMove);
    this.handles.each( function(h) {
      Event.stopObserving(h, "mousedown", slider.eventMouseDown);
    });
  },
  setDisabled: function(){
    this.disabled = true;
    this.track.parentNode.className = this.track.parentNode.className + ' disabled';
  },
  setEnabled: function(){
    this.disabled = false;
  },
  getNearestValue: function(value){
    if (this.allowedValues){
      if (value >= this.allowedValues.max()) return(this.allowedValues.max());
      if (value <= this.allowedValues.min()) return(this.allowedValues.min());

      var offset = Math.abs(this.allowedValues[0] - value);
      var newValue = this.allowedValues[0];
      this.allowedValues.each( function(v) {
        var currentOffset = Math.abs(v - value);
        if (currentOffset <= offset){
          newValue = v;
          offset = currentOffset;
        }
      });
      return newValue;
    }
    if (value > this.range.end) return this.range.end;
    if (value < this.range.start) return this.range.start;
    return value;
  },
  setValue: function(sliderValue, handleIdx){
    if (!this.active) {
      this.activeHandleIdx = handleIdx || 0;
      this.activeHandle    = this.handles[this.activeHandleIdx];
      this.updateStyles();
    }
    handleIdx = handleIdx || this.activeHandleIdx || 0;
    if (this.initialized && this.restricted) {
      if ((handleIdx>0) && (sliderValue<this.values[handleIdx-1]))
        sliderValue = this.values[handleIdx-1];
      if ((handleIdx < (this.handles.length-1)) && (sliderValue>this.values[handleIdx+1]))
        sliderValue = this.values[handleIdx+1];
    }
    sliderValue = this.getNearestValue(sliderValue);
    this.values[handleIdx] = sliderValue;
    this.value = this.values[0]; // assure backwards compat

    this.handles[handleIdx].style[this.isVertical() ? 'top' : 'left'] =
      this.translateToPx(sliderValue);

    this.drawSpans();
    if (!this.dragging || !this.event) this.updateFinished();
  },
  setValueBy: function(delta, handleIdx) {
    this.setValue(this.values[handleIdx || this.activeHandleIdx || 0] + delta,
      handleIdx || this.activeHandleIdx || 0);
  },
  translateToPx: function(value) {
    return Math.round(
      ((this.trackLength-this.handleLength)/(this.range.end-this.range.start)) *
      (value - this.range.start)) + "px";
  },
  translateToValue: function(offset) {
    return ((offset/(this.trackLength-this.handleLength) *
      (this.range.end-this.range.start)) + this.range.start);
  },
  getRange: function(range) {
    var v = this.values.sortBy(Prototype.K);
    range = range || 0;
    return $R(v[range],v[range+1]);
  },
  minimumOffset: function(){
    return(this.isVertical() ? this.alignY : this.alignX);
  },
  maximumOffset: function(){
    return(this.isVertical() ?
      (this.track.offsetHeight != 0 ? this.track.offsetHeight :
        this.track.style.height.replace(/px$/,"")) - this.alignY :
      (this.track.offsetWidth != 0 ? this.track.offsetWidth :
        this.track.style.width.replace(/px$/,"")) - this.alignX);
  },
  isVertical:  function(){
    return (this.axis == 'vertical');
  },
  drawSpans: function() {
    var slider = this;
    if (this.spans)
      $R(0, this.spans.length-1).each(function(r) { slider.setSpan(slider.spans[r], slider.getRange(r)) });
    if (this.options.startSpan)
      this.setSpan(this.options.startSpan,
        $R(0, this.values.length>1 ? this.getRange(0).min() : this.value ));
    if (this.options.endSpan)
      this.setSpan(this.options.endSpan,
        $R(this.values.length>1 ? this.getRange(this.spans.length-1).max() : this.value, this.maximum));
  },
  setSpan: function(span, range) {
    if (this.isVertical()) {
      span.style.top = this.translateToPx(range.start);
      span.style.height = this.translateToPx(range.end - range.start + this.range.start);
    } else {
      span.style.left = this.translateToPx(range.start);
      span.style.width = this.translateToPx(range.end - range.start + this.range.start);
    }
  },
  updateStyles: function() {
    this.handles.each( function(h){ Element.removeClassName(h, 'selected') });
    Element.addClassName(this.activeHandle, 'selected');
  },
  startDrag: function(event) {
    if (Event.isLeftClick(event)) {
      if (!this.disabled){
        this.active = true;

        var handle = Event.element(event);
        var pointer  = [Event.pointerX(event), Event.pointerY(event)];
        var track = handle;
        if (track==this.track) {
          var offsets  = Position.cumulativeOffset(this.track);
          this.event = event;
          this.setValue(this.translateToValue(
           (this.isVertical() ? pointer[1]-offsets[1] : pointer[0]-offsets[0])-(this.handleLength/2)
          ));
          var offsets  = Position.cumulativeOffset(this.activeHandle);
          this.offsetX = (pointer[0] - offsets[0]);
          this.offsetY = (pointer[1] - offsets[1]);
        } else {
          // find the handle (prevents issues with Safari)
          while((this.handles.indexOf(handle) == -1) && handle.parentNode)
            handle = handle.parentNode;

          if (this.handles.indexOf(handle)!=-1) {
            this.activeHandle    = handle;
            this.activeHandleIdx = this.handles.indexOf(this.activeHandle);
            this.updateStyles();

            var offsets  = Position.cumulativeOffset(this.activeHandle);
            this.offsetX = (pointer[0] - offsets[0]);
            this.offsetY = (pointer[1] - offsets[1]);
          }
        }
      }
      Event.stop(event);
    }
  },
  update: function(event) {
   if (this.active) {
      if (!this.dragging) this.dragging = true;
      this.draw(event);
      if (Prototype.Browser.WebKit) window.scrollBy(0,0);
      Event.stop(event);
   }
  },
  draw: function(event) {
    var pointer = [Event.pointerX(event), Event.pointerY(event)];
    var offsets = Position.cumulativeOffset(this.track);
    pointer[0] -= this.offsetX + offsets[0];
    pointer[1] -= this.offsetY + offsets[1];
    this.event = event;
    this.setValue(this.translateToValue( this.isVertical() ? pointer[1] : pointer[0] ));
    if (this.initialized && this.options.onSlide)
      this.options.onSlide(this.values.length>1 ? this.values : this.value, this);
  },
  endDrag: function(event) {
    if (this.active && this.dragging) {
      this.finishDrag(event, true);
      Event.stop(event);
    }
    this.active = false;
    this.dragging = false;
  },
  finishDrag: function(event, success) {
    this.active = false;
    this.dragging = false;
    this.updateFinished();
  },
  updateFinished: function() {
    if (this.initialized && this.options.onChange)
      this.options.onChange(this.values.length>1 ? this.values : this.value, this);
    this.event = null;
  }
});
/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Varien
 * @package     js
 * @copyright   Copyright (c) 2012 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */
function popWin(url,win,para) {
    var win = window.open(url,win,para);
    win.focus();
}

function setLocation(url){
    window.location.href = url;
}

function setPLocation(url, setFocus){
    if( setFocus ) {
        window.opener.focus();
    }
    window.opener.location.href = url;
}

function setLanguageCode(code, fromCode){
    //TODO: javascript cookies have different domain and path than php cookies
    var href = window.location.href;
    var after = '', dash;
    if (dash = href.match(/\#(.*)$/)) {
        href = href.replace(/\#(.*)$/, '');
        after = dash[0];
    }

    if (href.match(/[?]/)) {
        var re = /([?&]store=)[a-z0-9_]*/;
        if (href.match(re)) {
            href = href.replace(re, '$1'+code);
        } else {
            href += '&store='+code;
        }

        var re = /([?&]from_store=)[a-z0-9_]*/;
        if (href.match(re)) {
            href = href.replace(re, '');
        }
    } else {
        href += '?store='+code;
    }
    if (typeof(fromCode) != 'undefined') {
        href += '&from_store='+fromCode;
    }
    href += after;

    setLocation(href);
}

/**
 * Add classes to specified elements.
 * Supported classes are: 'odd', 'even', 'first', 'last'
 *
 * @param elements - array of elements to be decorated
 * [@param decorateParams] - array of classes to be set. If omitted, all available will be used
 */
function decorateGeneric(elements, decorateParams)
{
    var allSupportedParams = ['odd', 'even', 'first', 'last'];
    var _decorateParams = {};
    var total = elements.length;

    if (total) {
        // determine params called
        if (typeof(decorateParams) == 'undefined') {
            decorateParams = allSupportedParams;
        }
        if (!decorateParams.length) {
            return;
        }
        for (var k in allSupportedParams) {
            _decorateParams[allSupportedParams[k]] = false;
        }
        for (var k in decorateParams) {
            _decorateParams[decorateParams[k]] = true;
        }

        // decorate elements
        // elements[0].addClassName('first'); // will cause bug in IE (#5587)
        if (_decorateParams.first) {
            Element.addClassName(elements[0], 'first');
        }
        if (_decorateParams.last) {
            Element.addClassName(elements[total-1], 'last');
        }
        for (var i = 0; i < total; i++) {
            if ((i + 1) % 2 == 0) {
                if (_decorateParams.even) {
                    Element.addClassName(elements[i], 'even');
                }
            }
            else {
                if (_decorateParams.odd) {
                    Element.addClassName(elements[i], 'odd');
                }
            }
        }
    }
}

/**
 * Decorate table rows and cells, tbody etc
 * @see decorateGeneric()
 */
function decorateTable(table, options) {
    var table = $(table);
    if (table) {
        // set default options
        var _options = {
            'tbody'    : false,
            'tbody tr' : ['odd', 'even', 'first', 'last'],
            'thead tr' : ['first', 'last'],
            'tfoot tr' : ['first', 'last'],
            'tr td'    : ['last']
        };
        // overload options
        if (typeof(options) != 'undefined') {
            for (var k in options) {
                _options[k] = options[k];
            }
        }
        // decorate
        if (_options['tbody']) {
            decorateGeneric(table.select('tbody'), _options['tbody']);
        }
        if (_options['tbody tr']) {
            decorateGeneric(table.select('tbody tr'), _options['tbody tr']);
        }
        if (_options['thead tr']) {
            decorateGeneric(table.select('thead tr'), _options['thead tr']);
        }
        if (_options['tfoot tr']) {
            decorateGeneric(table.select('tfoot tr'), _options['tfoot tr']);
        }
        if (_options['tr td']) {
            var allRows = table.select('tr');
            if (allRows.length) {
                for (var i = 0; i < allRows.length; i++) {
                    decorateGeneric(allRows[i].getElementsByTagName('TD'), _options['tr td']);
                }
            }
        }
    }
}

/**
 * Set "odd", "even" and "last" CSS classes for list items
 * @see decorateGeneric()
 */
function decorateList(list, nonRecursive) {
    if ($(list)) {
        if (typeof(nonRecursive) == 'undefined') {
            var items = $(list).select('li')
        }
        else {
            var items = $(list).childElements();
        }
        decorateGeneric(items, ['odd', 'even', 'last']);
    }
}

/**
 * Set "odd", "even" and "last" CSS classes for list items
 * @see decorateGeneric()
 */
function decorateDataList(list) {
    list = $(list);
    if (list) {
        decorateGeneric(list.select('dt'), ['odd', 'even', 'last']);
        decorateGeneric(list.select('dd'), ['odd', 'even', 'last']);
    }
}

/**
 * Parse SID and produces the correct URL
 */
function parseSidUrl(baseUrl, urlExt) {
    var sidPos = baseUrl.indexOf('/?SID=');
    var sid = '';
    urlExt = (urlExt != undefined) ? urlExt : '';

    if(sidPos > -1) {
        sid = '?' + baseUrl.substring(sidPos + 2);
        baseUrl = baseUrl.substring(0, sidPos + 1);
    }

    return baseUrl+urlExt+sid;
}

/**
 * Formats currency using patern
 * format - JSON (pattern, decimal, decimalsDelimeter, groupsDelimeter)
 * showPlus - true (always show '+'or '-'),
 *      false (never show '-' even if number is negative)
 *      null (show '-' if number is negative)
 */

function formatCurrency(price, format, showPlus){
    var precision = isNaN(format.precision = Math.abs(format.precision)) ? 2 : format.precision;
    var requiredPrecision = isNaN(format.requiredPrecision = Math.abs(format.requiredPrecision)) ? 2 : format.requiredPrecision;

    //precision = (precision > requiredPrecision) ? precision : requiredPrecision;
    //for now we don't need this difference so precision is requiredPrecision
    precision = requiredPrecision;

    var integerRequired = isNaN(format.integerRequired = Math.abs(format.integerRequired)) ? 1 : format.integerRequired;

    var decimalSymbol = format.decimalSymbol == undefined ? "," : format.decimalSymbol;
    var groupSymbol = format.groupSymbol == undefined ? "." : format.groupSymbol;
    var groupLength = format.groupLength == undefined ? 3 : format.groupLength;

    var s = '';

    if (showPlus == undefined || showPlus == true) {
        s = price < 0 ? "-" : ( showPlus ? "+" : "");
    } else if (showPlus == false) {
        s = '';
    }

    var i = parseInt(price = Math.abs(+price || 0).toFixed(precision)) + "";
    var pad = (i.length < integerRequired) ? (integerRequired - i.length) : 0;
    while (pad) { i = '0' + i; pad--; }
    j = (j = i.length) > groupLength ? j % groupLength : 0;
    re = new RegExp("(\\d{" + groupLength + "})(?=\\d)", "g");

    /**
     * replace(/-/, 0) is only for fixing Safari bug which appears
     * when Math.abs(0).toFixed() executed on "0" number.
     * Result is "0.-0" :(
     */
    var r = (j ? i.substr(0, j) + groupSymbol : "") + i.substr(j).replace(re, "$1" + groupSymbol) + (precision ? decimalSymbol + Math.abs(price - i).toFixed(precision).replace(/-/, 0).slice(2) : "")
    var pattern = '';
    if (format.pattern.indexOf('{sign}') == -1) {
        pattern = s + format.pattern;
    } else {
        pattern = format.pattern.replace('{sign}', s);
    }

    return pattern.replace('%s', r).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

function expandDetails(el, childClass) {
    if (Element.hasClassName(el,'show-details')) {
        $$(childClass).each(function(item){item.hide()});
        Element.removeClassName(el,'show-details');
    }
    else {
        $$(childClass).each(function(item){item.show()});
        Element.addClassName(el,'show-details');
    }
}

// Version 1.0
var isIE = navigator.appVersion.match(/MSIE/) == "MSIE";

if (!window.Varien)
    var Varien = new Object();

Varien.showLoading = function(){
    Element.show('loading-process');
}
Varien.hideLoading = function(){
    Element.hide('loading-process');
}
Varien.GlobalHandlers = {
    onCreate: function() {
        Varien.showLoading();
    },

    onComplete: function() {
        if(Ajax.activeRequestCount == 0) {
            Varien.hideLoading();
        }
    }
};

Ajax.Responders.register(Varien.GlobalHandlers);

/**
 * Quick Search form client model
 */
Varien.searchForm = Class.create();
Varien.searchForm.prototype = {
    initialize : function(form, field, emptyText){
        this.form   = $(form);
        this.field  = $(field);
        this.emptyText = emptyText;

        Event.observe(this.form,  'submit', this.submit.bind(this));
        Event.observe(this.field, 'focus', this.focus.bind(this));
        Event.observe(this.field, 'blur', this.blur.bind(this));
        this.blur();
    },

    submit : function(event){
        if (this.field.value == this.emptyText || this.field.value == ''){
            Event.stop(event);
            return false;
        }
        return true;
    },

    focus : function(event){
        if(this.field.value==this.emptyText){
            this.field.value='';
        }

    },

    blur : function(event){
        if(this.field.value==''){
            this.field.value=this.emptyText;
        }
    },

    initAutocomplete : function(url, destinationElement){
        new Ajax.Autocompleter(
            this.field,
            destinationElement,
            url,
            {
                paramName: this.field.name,
                method: 'get',
                minChars: 2,
                updateElement: this._selectAutocompleteItem.bind(this),
                onShow : function(element, update) {
                    if(!update.style.position || update.style.position=='absolute') {
                        update.style.position = 'absolute';
                        Position.clone(element, update, {
                            setHeight: false,
                            offsetTop: element.offsetHeight
                        });
                    }
                    Effect.Appear(update,{duration:0});
                }

            }
        );
    },

    _selectAutocompleteItem : function(element){
        if(element.title){
            this.field.value = element.title;
        }
        this.form.submit();
    }
}

Varien.Tabs = Class.create();
Varien.Tabs.prototype = {
  initialize: function(selector) {
    var self=this;
    $$(selector+' a').each(this.initTab.bind(this));
  },

  initTab: function(el) {
      el.href = 'javascript:void(0)';
      if ($(el.parentNode).hasClassName('active')) {
        this.showContent(el);
      }
      el.observe('click', this.showContent.bind(this, el));
  },

  showContent: function(a) {
    var li = $(a.parentNode), ul = $(li.parentNode);
    ul.getElementsBySelector('li', 'ol').each(function(el){
      var contents = $(el.id+'_contents');
      if (el==li) {
        el.addClassName('active');
        contents.show();
      } else {
        el.removeClassName('active');
        contents.hide();
      }
    });
  }
}

Varien.DateElement = Class.create();
Varien.DateElement.prototype = {
    initialize: function(type, content, required, format) {
        if (type == 'id') {
            // id prefix
            this.day    = $(content + 'day');
            this.month  = $(content + 'month');
            this.year   = $(content + 'year');
            this.full   = $(content + 'full');
            this.advice = $(content + 'date-advice');
        } else if (type == 'container') {
            // content must be container with data
            this.day    = content.day;
            this.month  = content.month;
            this.year   = content.year;
            this.full   = content.full;
            this.advice = content.advice;
        } else {
            return;
        }

        this.required = required;
        this.format   = format;

        this.day.addClassName('validate-custom');
        this.day.validate = this.validate.bind(this);
        this.month.addClassName('validate-custom');
        this.month.validate = this.validate.bind(this);
        this.year.addClassName('validate-custom');
        this.year.validate = this.validate.bind(this);

        this.setDateRange(false, false);
        this.year.setAttribute('autocomplete','off');

        this.advice.hide();
    },
    validate: function() {
        var error = false,
            day = parseInt(this.day.value.replace(/^0*/, '')) || 0,
            month = parseInt(this.month.value.replace(/^0*/, '')) || 0,
            year = parseInt(this.year.value) || 0;
        if (!day && !month && !year) {
            if (this.required) {
                error = 'This date is a required value.';
            } else {
                this.full.value = '';
            }
        } else if (!day || !month || !year) {
            error = 'Please enter a valid full date.';
        } else {
            var date = new Date, countDaysInMonth = 0, errorType = null;
            date.setYear(year);date.setMonth(month-1);date.setDate(32);
            countDaysInMonth = 32 - date.getDate();
            if(!countDaysInMonth || countDaysInMonth>31) countDaysInMonth = 31;

            if (day<1 || day>countDaysInMonth) {
                errorType = 'day';
                error = 'Please enter a valid day (1-%d).';
            } else if (month<1 || month>12) {
                errorType = 'month';
                error = 'Please enter a valid month (1-12).';
            } else {
                if(day % 10 == day) this.day.value = '0'+day;
                if(month % 10 == month) this.month.value = '0'+month;
                this.full.value = this.format.replace(/%[mb]/i, this.month.value).replace(/%[de]/i, this.day.value).replace(/%y/i, this.year.value);
                var testFull = this.month.value + '/' + this.day.value + '/'+ this.year.value;
                var test = new Date(testFull);
                if (isNaN(test)) {
                    error = 'Please enter a valid date.';
                } else {
                    this.setFullDate(test);
                }
            }
            var valueError = false;
            if (!error && !this.validateData()){//(year<1900 || year>curyear) {
                errorType = this.validateDataErrorType;//'year';
                valueError = this.validateDataErrorText;//'Please enter a valid year (1900-%d).';
                error = valueError;
            }
        }

        if (error !== false) {
            try {
                error = Translator.translate(error);
            }
            catch (e) {}
            if (!valueError) {
                this.advice.innerHTML = error.replace('%d', countDaysInMonth);
            } else {
                this.advice.innerHTML = this.errorTextModifier(error);
            }
            this.advice.show();
            return false;
        }

        // fixing elements class
        this.day.removeClassName('validation-failed');
        this.month.removeClassName('validation-failed');
        this.year.removeClassName('validation-failed');

        this.advice.hide();
        return true;
    },
    validateData: function() {
        var year = this.fullDate.getFullYear();
        var date = new Date;
        this.curyear = date.getFullYear();
        return (year>=1900 && year<=this.curyear);
    },
    validateDataErrorType: 'year',
    validateDataErrorText: 'Please enter a valid year (1900-%d).',
    errorTextModifier: function(text) {
        return text.replace('%d', this.curyear);
    },
    setDateRange: function(minDate, maxDate) {
        this.minDate = minDate;
        this.maxDate = maxDate;
    },
    setFullDate: function(date) {
        this.fullDate = date;
    }
};

Varien.DOB = Class.create();
Varien.DOB.prototype = {
    initialize: function(selector, required, format) {
        var el = $$(selector)[0];
        var container       = {};
        container.day       = Element.select(el, '.dob-day input')[0];
        container.month     = Element.select(el, '.dob-month input')[0];
        container.year      = Element.select(el, '.dob-year input')[0];
        container.full      = Element.select(el, '.dob-full input')[0];
        container.advice    = Element.select(el, '.validation-advice')[0];

        new Varien.DateElement('container', container, required, format);
    }
};

Varien.dateRangeDate = Class.create();
Varien.dateRangeDate.prototype = Object.extend(new Varien.DateElement(), {
    validateData: function() {
        var validate = true;
        if (this.minDate || this.maxValue) {
            if (this.minDate) {
                this.minDate = new Date(this.minDate);
                this.minDate.setHours(0);
                if (isNaN(this.minDate)) {
                    this.minDate = new Date('1/1/1900');
                }
                validate = validate && (this.fullDate >= this.minDate)
            }
            if (this.maxDate) {
                this.maxDate = new Date(this.maxDate)
                this.minDate.setHours(0);
                if (isNaN(this.maxDate)) {
                    this.maxDate = new Date();
                }
                validate = validate && (this.fullDate <= this.maxDate)
            }
            if (this.maxDate && this.minDate) {
                this.validateDataErrorText = 'Please enter a valid date between %s and %s';
            } else if (this.maxDate) {
                this.validateDataErrorText = 'Please enter a valid date less than or equal to %s';
            } else if (this.minDate) {
                this.validateDataErrorText = 'Please enter a valid date equal to or greater than %s';
            } else {
                this.validateDataErrorText = '';
            }
        }
        return validate;
    },
    validateDataErrorText: 'Date should be between %s and %s',
    errorTextModifier: function(text) {
        if (this.minDate) {
            text = text.sub('%s', this.dateFormat(this.minDate));
        }
        if (this.maxDate) {
            text = text.sub('%s', this.dateFormat(this.maxDate));
        }
        return text;
    },
    dateFormat: function(date) {
        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    }
});

Varien.FileElement = Class.create();
Varien.FileElement.prototype = {
    initialize: function (id) {
        this.fileElement = $(id);
        this.hiddenElement = $(id + '_value');

        this.fileElement.observe('change', this.selectFile.bind(this));
    },
    selectFile: function(event) {
        this.hiddenElement.value = this.fileElement.getValue();
    }
};

Validation.addAllThese([
    ['validate-custom', ' ', function(v,elm) {
        return elm.validate();
    }]
]);

function truncateOptions() {
    $$('.truncated').each(function(element){
        Event.observe(element, 'mouseover', function(){
            if (element.down('div.truncated_full_value')) {
                element.down('div.truncated_full_value').addClassName('show')
            }
        });
        Event.observe(element, 'mouseout', function(){
            if (element.down('div.truncated_full_value')) {
                element.down('div.truncated_full_value').removeClassName('show')
            }
        });

    });
}
Event.observe(window, 'load', function(){
   truncateOptions();
});

Element.addMethods({
    getInnerText: function(element)
    {
        element = $(element);
        if(element.innerText && !Prototype.Browser.Opera) {
            return element.innerText
        }
        return element.innerHTML.stripScripts().unescapeHTML().replace(/[\n\r\s]+/g, ' ').strip();
    }
});

/*
if (!("console" in window) || !("firebug" in console))
{
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

    window.console = {};
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
}
*/

/**
 * Executes event handler on the element. Works with event handlers attached by Prototype,
 * in a browser-agnostic fashion.
 * @param element The element object
 * @param event Event name, like 'change'
 *
 * @example fireEvent($('my-input', 'click'));
 */
function fireEvent(element, event) {
    if (document.createEvent) {
        // dispatch for all browsers except IE before version 9
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true ); // event type, bubbling, cancelable
        return element.dispatchEvent(evt);
    } else {
        // dispatch for IE before version 9
        var evt = document.createEventObject();
        return element.fireEvent('on' + event, evt)
    }
}

/**
 * Returns more accurate results of floating-point modulo division
 * E.g.:
 * 0.6 % 0.2 = 0.19999999999999996
 * modulo(0.6, 0.2) = 0
 *
 * @param dividend
 * @param divisor
 */
function modulo(dividend, divisor)
{
    var epsilon = divisor / 10000;
    var remainder = dividend % divisor;

    if (Math.abs(remainder - divisor) < epsilon || Math.abs(remainder) < epsilon) {
        remainder = 0;
    }

    return remainder;
}

/**
 * createContextualFragment is not supported in IE9. Adding its support.
 */
if ((typeof Range != "undefined") && !Range.prototype.createContextualFragment)
{
    Range.prototype.createContextualFragment = function(html)
    {
        var frag = document.createDocumentFragment(),
        div = document.createElement("div");
        frag.appendChild(div);
        div.outerHTML = html;
        return frag;
    };
}

/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Varien
 * @package     js
 * @copyright   Copyright (c) 2012 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */
VarienForm = Class.create();
VarienForm.prototype = {
    initialize: function(formId, firstFieldFocus){
        this.form       = $(formId);
        if (!this.form) {
            return;
        }
        this.cache      = $A();
        this.currLoader = false;
        this.currDataIndex = false;
        this.validator  = new Validation(this.form);
        this.elementFocus   = this.elementOnFocus.bindAsEventListener(this);
        this.elementBlur    = this.elementOnBlur.bindAsEventListener(this);
        this.childLoader    = this.onChangeChildLoad.bindAsEventListener(this);
        this.highlightClass = 'highlight';
        this.extraChildParams = '';
        this.firstFieldFocus= firstFieldFocus || false;
        this.bindElements();
        if(this.firstFieldFocus){
            try{
                Form.Element.focus(Form.findFirstElement(this.form))
            }
            catch(e){}
        }
    },

    submit : function(url){
        if(this.validator && this.validator.validate()){
             this.form.submit();
        }
        return false;
    },

    bindElements:function (){
        var elements = Form.getElements(this.form);
        for (var row in elements) {
            if (elements[row].id) {
                Event.observe(elements[row],'focus',this.elementFocus);
                Event.observe(elements[row],'blur',this.elementBlur);
            }
        }
    },

    elementOnFocus: function(event){
        var element = Event.findElement(event, 'fieldset');
        if(element){
            Element.addClassName(element, this.highlightClass);
        }
    },

    elementOnBlur: function(event){
        var element = Event.findElement(event, 'fieldset');
        if(element){
            Element.removeClassName(element, this.highlightClass);
        }
    },

    setElementsRelation: function(parent, child, dataUrl, first){
        if (parent=$(parent)) {
            // TODO: array of relation and caching
            if (!this.cache[parent.id]){
                this.cache[parent.id] = $A();
                this.cache[parent.id]['child']     = child;
                this.cache[parent.id]['dataUrl']   = dataUrl;
                this.cache[parent.id]['data']      = $A();
                this.cache[parent.id]['first']      = first || false;
            }
            Event.observe(parent,'change',this.childLoader);
        }
    },

    onChangeChildLoad: function(event){
        element = Event.element(event);
        this.elementChildLoad(element);
    },

    elementChildLoad: function(element, callback){
        this.callback = callback || false;
        if (element.value) {
            this.currLoader = element.id;
            this.currDataIndex = element.value;
            if (this.cache[element.id]['data'][element.value]) {
                this.setDataToChild(this.cache[element.id]['data'][element.value]);
            }
            else{
                new Ajax.Request(this.cache[this.currLoader]['dataUrl'],{
                        method: 'post',
                        parameters: {"parent":element.value},
                        onComplete: this.reloadChildren.bind(this)
                });
            }
        }
    },

    reloadChildren: function(transport){
        var data = eval('(' + transport.responseText + ')');
        this.cache[this.currLoader]['data'][this.currDataIndex] = data;
        this.setDataToChild(data);
    },

    setDataToChild: function(data){
        if (data.length) {
            var child = $(this.cache[this.currLoader]['child']);
            if (child){
                var html = '<select name="'+child.name+'" id="'+child.id+'" class="'+child.className+'" title="'+child.title+'" '+this.extraChildParams+'>';
                if(this.cache[this.currLoader]['first']){
                    html+= '<option value="">'+this.cache[this.currLoader]['first']+'</option>';
                }
                for (var i in data){
                    if(data[i].value) {
                        html+= '<option value="'+data[i].value+'"';
                        if(child.value && (child.value == data[i].value || child.value == data[i].label)){
                            html+= ' selected';
                        }
                        html+='>'+data[i].label+'</option>';
                    }
                }
                html+= '</select>';
                Element.insert(child, {before: html});
                Element.remove(child);
            }
        }
        else{
            var child = $(this.cache[this.currLoader]['child']);
            if (child){
                var html = '<input type="text" name="'+child.name+'" id="'+child.id+'" class="'+child.className+'" title="'+child.title+'" '+this.extraChildParams+'>';
                Element.insert(child, {before: html});
                Element.remove(child);
            }
        }

        this.bindElements();
        if (this.callback) {
            this.callback();
        }
    }
}

RegionUpdater = Class.create();
RegionUpdater.prototype = {
    initialize: function (countryEl, regionTextEl, regionSelectEl, regions, disableAction, zipEl)
    {
        this.countryEl = $(countryEl);
        this.regionTextEl = $(regionTextEl);
        this.regionSelectEl = $(regionSelectEl);
        this.zipEl = $(zipEl);
        this.config = regions['config'];
        delete regions.config;
        this.regions = regions;

        this.disableAction = (typeof disableAction=='undefined') ? 'hide' : disableAction;
        this.zipOptions = (typeof zipOptions=='undefined') ? false : zipOptions;

        if (this.regionSelectEl.options.length<=1) {
            this.update();
        }

        Event.observe(this.countryEl, 'change', this.update.bind(this));
    },

    _checkRegionRequired: function()
    {
        var label, wildCard;
        var elements = [this.regionTextEl, this.regionSelectEl];
        var that = this;
        if (typeof this.config == 'undefined') {
            return;
        }
        var regionRequired = this.config.regions_required.indexOf(this.countryEl.value) >= 0;

        elements.each(function(currentElement) {
            Validation.reset(currentElement);
            label = $$('label[for="' + currentElement.id + '"]')[0];
            if (label) {
                wildCard = label.down('em') || label.down('span.required');
                if (!that.config.show_all_regions) {
                    if (regionRequired) {
                        label.up().show();
                    } else {
                        label.up().hide();
                    }
                }
            }

            if (label && wildCard) {
                if (!regionRequired) {
                    wildCard.hide();
                    if (label.hasClassName('required')) {
                        label.removeClassName('required');
                    }
                } else if (regionRequired) {
                    wildCard.show();
                    if (!label.hasClassName('required')) {
                        label.addClassName('required')
                    }
                }
            }

            if (!regionRequired) {
                if (currentElement.hasClassName('required-entry')) {
                    currentElement.removeClassName('required-entry');
                }
                if ('select' == currentElement.tagName.toLowerCase() &&
                    currentElement.hasClassName('validate-select')) {
                    currentElement.removeClassName('validate-select');
                }
            } else {
                if (!currentElement.hasClassName('required-entry')) {
                    currentElement.addClassName('required-entry');
                }
                if ('select' == currentElement.tagName.toLowerCase() &&
                    !currentElement.hasClassName('validate-select')) {
                    currentElement.addClassName('validate-select');
                }
            }
        });
    },

    update: function()
    {
        if (this.regions[this.countryEl.value]) {
            var i, option, region, def;

            def = this.regionSelectEl.getAttribute('defaultValue');
            if (this.regionTextEl) {
                if (!def) {
                    def = this.regionTextEl.value.toLowerCase();
                }
                this.regionTextEl.value = '';
            }

            this.regionSelectEl.options.length = 1;
            for (regionId in this.regions[this.countryEl.value]) {
                region = this.regions[this.countryEl.value][regionId];

                option = document.createElement('OPTION');
                option.value = regionId;
                option.text = region.name.stripTags();
                option.title = region.name;

                if (this.regionSelectEl.options.add) {
                    this.regionSelectEl.options.add(option);
                } else {
                    this.regionSelectEl.appendChild(option);
                }

                if (regionId==def || (region.name && region.name.toLowerCase()==def) ||
                    (region.name && region.code.toLowerCase()==def)
                ) {
                    this.regionSelectEl.value = regionId;
                }
            }

            if (this.disableAction=='hide') {
                if (this.regionTextEl) {
                    this.regionTextEl.style.display = 'none';
                }

                this.regionSelectEl.style.display = '';
            } else if (this.disableAction=='disable') {
                if (this.regionTextEl) {
                    this.regionTextEl.disabled = true;
                }
                this.regionSelectEl.disabled = false;
            }
            this.setMarkDisplay(this.regionSelectEl, true);
        } else {
            if (this.disableAction=='hide') {
                if (this.regionTextEl) {
                    this.regionTextEl.style.display = '';
                }
                this.regionSelectEl.style.display = 'none';
                Validation.reset(this.regionSelectEl);
            } else if (this.disableAction=='disable') {
                if (this.regionTextEl) {
                    this.regionTextEl.disabled = false;
                }
                this.regionSelectEl.disabled = true;
            } else if (this.disableAction=='nullify') {
                this.regionSelectEl.options.length = 1;
                this.regionSelectEl.value = '';
                this.regionSelectEl.selectedIndex = 0;
                this.lastCountryId = '';
            }
            this.setMarkDisplay(this.regionSelectEl, false);
        }

        this._checkRegionRequired();
        // Make Zip and its label required/optional
        var zipUpdater = new ZipUpdater(this.countryEl.value, this.zipEl);
        zipUpdater.update();
    },

    setMarkDisplay: function(elem, display){
        elem = $(elem);
        var labelElement = elem.up(0).down('label > span.required') ||
                           elem.up(1).down('label > span.required') ||
                           elem.up(0).down('label.required > em') ||
                           elem.up(1).down('label.required > em');
        if(labelElement) {
            inputElement = labelElement.up().next('input');
            if (display) {
                labelElement.show();
                if (inputElement) {
                    inputElement.addClassName('required-entry');
                }
            } else {
                labelElement.hide();
                if (inputElement) {
                    inputElement.removeClassName('required-entry');
                }
            }
        }
    }
}

ZipUpdater = Class.create();
ZipUpdater.prototype = {
    initialize: function(country, zipElement)
    {
        this.country = country;
        this.zipElement = $(zipElement);
    },

    update: function()
    {
        // Country ISO 2-letter codes must be pre-defined
        if (typeof optionalZipCountries == 'undefined') {
            return false;
        }

        // Ajax-request and normal content load compatibility
        if (this.zipElement != undefined) {
            this._setPostcodeOptional();
        } else {
            Event.observe(window, "load", this._setPostcodeOptional.bind(this));
        }
    },

    _setPostcodeOptional: function()
    {
        this.zipElement = $(this.zipElement);
        if (this.zipElement == undefined) {
            return false;
        }

        // find label
        var label = $$('label[for="' + this.zipElement.id + '"]')[0];
        if (label != undefined) {
            var wildCard = label.down('em') || label.down('span.required');
        }

        // Make Zip and its label required/optional
        if (optionalZipCountries.indexOf(this.country) != -1) {
            while (this.zipElement.hasClassName('required-entry')) {
                this.zipElement.removeClassName('required-entry');
            }
            if (wildCard != undefined) {
                wildCard.hide();
            }
        } else {
            this.zipElement.addClassName('required-entry');
            if (wildCard != undefined) {
                wildCard.show();
            }
        }
    }
}

/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Mage
 * @package     js
 * @copyright   Copyright (c) 2012 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */

var Translate = Class.create();
Translate.prototype = {
    initialize: function(data){
        this.data = $H(data);
    },

    translate : function(){
        var args = arguments;
        var text = arguments[0];

        if(this.data.get(text)){
            return this.data.get(text);
        }
        return text;
    },
    add : function() {
        if (arguments.length > 1) {
            this.data.set(arguments[0], arguments[1]);
        } else if (typeof arguments[0] =='object') {
            $H(arguments[0]).each(function (pair){
                this.data.set(pair.key, pair.value);
            }.bind(this));
        }
    }
}

/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Mage
 * @package     js
 * @copyright   Copyright (c) 2012 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */
// old school cookie functions grabbed off the web

if (!window.Mage) var Mage = {};

Mage.Cookies = {};
Mage.Cookies.expires  = null;
Mage.Cookies.path     = '/';
Mage.Cookies.domain   = null;
Mage.Cookies.secure   = false;
Mage.Cookies.set = function(name, value){
     var argv = arguments;
     var argc = arguments.length;
     var expires = (argc > 2) ? argv[2] : Mage.Cookies.expires;
     var path = (argc > 3) ? argv[3] : Mage.Cookies.path;
     var domain = (argc > 4) ? argv[4] : Mage.Cookies.domain;
     var secure = (argc > 5) ? argv[5] : Mage.Cookies.secure;
     document.cookie = name + "=" + escape (value) +
       ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) +
       ((path == null) ? "" : ("; path=" + path)) +
       ((domain == null) ? "" : ("; domain=" + domain)) +
       ((secure == true) ? "; secure" : "");
};

Mage.Cookies.get = function(name){
    var arg = name + "=";
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    var j = 0;
    while(i < clen){
        j = i + alen;
        if (document.cookie.substring(i, j) == arg)
            return Mage.Cookies.getCookieVal(j);
        i = document.cookie.indexOf(" ", i) + 1;
        if(i == 0)
            break;
    }
    return null;
};

Mage.Cookies.clear = function(name) {
  if(Mage.Cookies.get(name)){
    document.cookie = name + "=" +
    "; expires=Thu, 01-Jan-70 00:00:01 GMT";
  }
};

Mage.Cookies.getCookieVal = function(offset){
   var endstr = document.cookie.indexOf(";", offset);
   if(endstr == -1){
       endstr = document.cookie.length;
   }
   return unescape(document.cookie.substring(offset, endstr));
};

/*! jQuery v1.7.2 jquery.com | jquery.org/license */
(function(a,b){function cy(a){return f.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}function cu(a){if(!cj[a]){var b=c.body,d=f("<"+a+">").appendTo(b),e=d.css("display");d.remove();if(e==="none"||e===""){ck||(ck=c.createElement("iframe"),ck.frameBorder=ck.width=ck.height=0),b.appendChild(ck);if(!cl||!ck.createElement)cl=(ck.contentWindow||ck.contentDocument).document,cl.write((f.support.boxModel?"<!doctype html>":"")+"<html><body>"),cl.close();d=cl.createElement(a),cl.body.appendChild(d),e=f.css(d,"display"),b.removeChild(ck)}cj[a]=e}return cj[a]}function ct(a,b){var c={};f.each(cp.concat.apply([],cp.slice(0,b)),function(){c[this]=a});return c}function cs(){cq=b}function cr(){setTimeout(cs,0);return cq=f.now()}function ci(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function ch(){try{return new a.XMLHttpRequest}catch(b){}}function cb(a,c){a.dataFilter&&(c=a.dataFilter(c,a.dataType));var d=a.dataTypes,e={},g,h,i=d.length,j,k=d[0],l,m,n,o,p;for(g=1;g<i;g++){if(g===1)for(h in a.converters)typeof h=="string"&&(e[h.toLowerCase()]=a.converters[h]);l=k,k=d[g];if(k==="*")k=l;else if(l!=="*"&&l!==k){m=l+" "+k,n=e[m]||e["* "+k];if(!n){p=b;for(o in e){j=o.split(" ");if(j[0]===l||j[0]==="*"){p=e[j[1]+" "+k];if(p){o=e[o],o===!0?n=p:p===!0&&(n=o);break}}}}!n&&!p&&f.error("No conversion from "+m.replace(" "," to ")),n!==!0&&(c=n?n(c):p(o(c)))}}return c}function ca(a,c,d){var e=a.contents,f=a.dataTypes,g=a.responseFields,h,i,j,k;for(i in g)i in d&&(c[g[i]]=d[i]);while(f[0]==="*")f.shift(),h===b&&(h=a.mimeType||c.getResponseHeader("content-type"));if(h)for(i in e)if(e[i]&&e[i].test(h)){f.unshift(i);break}if(f[0]in d)j=f[0];else{for(i in d){if(!f[0]||a.converters[i+" "+f[0]]){j=i;break}k||(k=i)}j=j||k}if(j){j!==f[0]&&f.unshift(j);return d[j]}}function b_(a,b,c,d){if(f.isArray(b))f.each(b,function(b,e){c||bD.test(a)?d(a,e):b_(a+"["+(typeof e=="object"?b:"")+"]",e,c,d)});else if(!c&&f.type(b)==="object")for(var e in b)b_(a+"["+e+"]",b[e],c,d);else d(a,b)}function b$(a,c){var d,e,g=f.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((g[d]?a:e||(e={}))[d]=c[d]);e&&f.extend(!0,a,e)}function bZ(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h=a[f],i=0,j=h?h.length:0,k=a===bS,l;for(;i<j&&(k||!l);i++)l=h[i](c,d,e),typeof l=="string"&&(!k||g[l]?l=b:(c.dataTypes.unshift(l),l=bZ(a,c,d,e,l,g)));(k||!l)&&!g["*"]&&(l=bZ(a,c,d,e,"*",g));return l}function bY(a){return function(b,c){typeof b!="string"&&(c=b,b="*");if(f.isFunction(c)){var d=b.toLowerCase().split(bO),e=0,g=d.length,h,i,j;for(;e<g;e++)h=d[e],j=/^\+/.test(h),j&&(h=h.substr(1)||"*"),i=a[h]=a[h]||[],i[j?"unshift":"push"](c)}}}function bB(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=b==="width"?1:0,g=4;if(d>0){if(c!=="border")for(;e<g;e+=2)c||(d-=parseFloat(f.css(a,"padding"+bx[e]))||0),c==="margin"?d+=parseFloat(f.css(a,c+bx[e]))||0:d-=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0;return d+"px"}d=by(a,b);if(d<0||d==null)d=a.style[b];if(bt.test(d))return d;d=parseFloat(d)||0;if(c)for(;e<g;e+=2)d+=parseFloat(f.css(a,"padding"+bx[e]))||0,c!=="padding"&&(d+=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0),c==="margin"&&(d+=parseFloat(f.css(a,c+bx[e]))||0);return d+"px"}function bo(a){var b=c.createElement("div");bh.appendChild(b),b.innerHTML=a.outerHTML;return b.firstChild}function bn(a){var b=(a.nodeName||"").toLowerCase();b==="input"?bm(a):b!=="script"&&typeof a.getElementsByTagName!="undefined"&&f.grep(a.getElementsByTagName("input"),bm)}function bm(a){if(a.type==="checkbox"||a.type==="radio")a.defaultChecked=a.checked}function bl(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]}function bk(a,b){var c;b.nodeType===1&&(b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase(),c==="object"?b.outerHTML=a.outerHTML:c!=="input"||a.type!=="checkbox"&&a.type!=="radio"?c==="option"?b.selected=a.defaultSelected:c==="input"||c==="textarea"?b.defaultValue=a.defaultValue:c==="script"&&b.text!==a.text&&(b.text=a.text):(a.checked&&(b.defaultChecked=b.checked=a.checked),b.value!==a.value&&(b.value=a.value)),b.removeAttribute(f.expando),b.removeAttribute("_submit_attached"),b.removeAttribute("_change_attached"))}function bj(a,b){if(b.nodeType===1&&!!f.hasData(a)){var c,d,e,g=f._data(a),h=f._data(b,g),i=g.events;if(i){delete h.handle,h.events={};for(c in i)for(d=0,e=i[c].length;d<e;d++)f.event.add(b,c,i[c][d])}h.data&&(h.data=f.extend({},h.data))}}function bi(a,b){return f.nodeName(a,"table")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function U(a){var b=V.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}function T(a,b,c){b=b||0;if(f.isFunction(b))return f.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return f.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){var d=f.grep(a,function(a){return a.nodeType===1});if(O.test(b))return f.filter(b,d,!c);b=f.filter(b,d)}return f.grep(a,function(a,d){return f.inArray(a,b)>=0===c})}function S(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function K(){return!0}function J(){return!1}function n(a,b,c){var d=b+"defer",e=b+"queue",g=b+"mark",h=f._data(a,d);h&&(c==="queue"||!f._data(a,e))&&(c==="mark"||!f._data(a,g))&&setTimeout(function(){!f._data(a,e)&&!f._data(a,g)&&(f.removeData(a,d,!0),h.fire())},0)}function m(a){for(var b in a){if(b==="data"&&f.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1}return!0}function l(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(k,"-$1").toLowerCase();d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:f.isNumeric(d)?+d:j.test(d)?f.parseJSON(d):d}catch(g){}f.data(a,c,d)}else d=b}return d}function h(a){var b=g[a]={},c,d;a=a.split(/\s+/);for(c=0,d=a.length;c<d;c++)b[a[c]]=!0;return b}var c=a.document,d=a.navigator,e=a.location,f=function(){function J(){if(!e.isReady){try{c.documentElement.doScroll("left")}catch(a){setTimeout(J,1);return}e.ready()}}var e=function(a,b){return new e.fn.init(a,b,h)},f=a.jQuery,g=a.$,h,i=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,j=/\S/,k=/^\s+/,l=/\s+$/,m=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,n=/^[\],:{}\s]*$/,o=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,p=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,q=/(?:^|:|,)(?:\s*\[)+/g,r=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,t=/(msie) ([\w.]+)/,u=/(mozilla)(?:.*? rv:([\w.]+))?/,v=/-([a-z]|[0-9])/ig,w=/^-ms-/,x=function(a,b){return(b+"").toUpperCase()},y=d.userAgent,z,A,B,C=Object.prototype.toString,D=Object.prototype.hasOwnProperty,E=Array.prototype.push,F=Array.prototype.slice,G=String.prototype.trim,H=Array.prototype.indexOf,I={};e.fn=e.prototype={constructor:e,init:function(a,d,f){var g,h,j,k;if(!a)return this;if(a.nodeType){this.context=this[0]=a,this.length=1;return this}if(a==="body"&&!d&&c.body){this.context=c,this[0]=c.body,this.selector=a,this.length=1;return this}if(typeof a=="string"){a.charAt(0)!=="<"||a.charAt(a.length-1)!==">"||a.length<3?g=i.exec(a):g=[null,a,null];if(g&&(g[1]||!d)){if(g[1]){d=d instanceof e?d[0]:d,k=d?d.ownerDocument||d:c,j=m.exec(a),j?e.isPlainObject(d)?(a=[c.createElement(j[1])],e.fn.attr.call(a,d,!0)):a=[k.createElement(j[1])]:(j=e.buildFragment([g[1]],[k]),a=(j.cacheable?e.clone(j.fragment):j.fragment).childNodes);return e.merge(this,a)}h=c.getElementById(g[2]);if(h&&h.parentNode){if(h.id!==g[2])return f.find(a);this.length=1,this[0]=h}this.context=c,this.selector=a;return this}return!d||d.jquery?(d||f).find(a):this.constructor(d).find(a)}if(e.isFunction(a))return f.ready(a);a.selector!==b&&(this.selector=a.selector,this.context=a.context);return e.makeArray(a,this)},selector:"",jquery:"1.7.2",length:0,size:function(){return this.length},toArray:function(){return F.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=this.constructor();e.isArray(a)?E.apply(d,a):e.merge(d,a),d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")");return d},each:function(a,b){return e.each(this,a,b)},ready:function(a){e.bindReady(),A.add(a);return this},eq:function(a){a=+a;return a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(F.apply(this,arguments),"slice",F.call(arguments).join(","))},map:function(a){return this.pushStack(e.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:E,sort:[].sort,splice:[].splice},e.fn.init.prototype=e.fn,e.extend=e.fn.extend=function(){var a,c,d,f,g,h,i=arguments[0]||{},j=1,k=arguments.length,l=!1;typeof i=="boolean"&&(l=i,i=arguments[1]||{},j=2),typeof i!="object"&&!e.isFunction(i)&&(i={}),k===j&&(i=this,--j);for(;j<k;j++)if((a=arguments[j])!=null)for(c in a){d=i[c],f=a[c];if(i===f)continue;l&&f&&(e.isPlainObject(f)||(g=e.isArray(f)))?(g?(g=!1,h=d&&e.isArray(d)?d:[]):h=d&&e.isPlainObject(d)?d:{},i[c]=e.extend(l,h,f)):f!==b&&(i[c]=f)}return i},e.extend({noConflict:function(b){a.$===e&&(a.$=g),b&&a.jQuery===e&&(a.jQuery=f);return e},isReady:!1,readyWait:1,holdReady:function(a){a?e.readyWait++:e.ready(!0)},ready:function(a){if(a===!0&&!--e.readyWait||a!==!0&&!e.isReady){if(!c.body)return setTimeout(e.ready,1);e.isReady=!0;if(a!==!0&&--e.readyWait>0)return;A.fireWith(c,[e]),e.fn.trigger&&e(c).trigger("ready").off("ready")}},bindReady:function(){if(!A){A=e.Callbacks("once memory");if(c.readyState==="complete")return setTimeout(e.ready,1);if(c.addEventListener)c.addEventListener("DOMContentLoaded",B,!1),a.addEventListener("load",e.ready,!1);else if(c.attachEvent){c.attachEvent("onreadystatechange",B),a.attachEvent("onload",e.ready);var b=!1;try{b=a.frameElement==null}catch(d){}c.documentElement.doScroll&&b&&J()}}},isFunction:function(a){return e.type(a)==="function"},isArray:Array.isArray||function(a){return e.type(a)==="array"},isWindow:function(a){return a!=null&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):I[C.call(a)]||"object"},isPlainObject:function(a){if(!a||e.type(a)!=="object"||a.nodeType||e.isWindow(a))return!1;try{if(a.constructor&&!D.call(a,"constructor")&&!D.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||D.call(a,d)},isEmptyObject:function(a){for(var b in a)return!1;return!0},error:function(a){throw new Error(a)},parseJSON:function(b){if(typeof b!="string"||!b)return null;b=e.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(n.test(b.replace(o,"@").replace(p,"]").replace(q,"")))return(new Function("return "+b))();e.error("Invalid JSON: "+b)},parseXML:function(c){if(typeof c!="string"||!c)return null;var d,f;try{a.DOMParser?(f=new DOMParser,d=f.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(g){d=b}(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&e.error("Invalid XML: "+c);return d},noop:function(){},globalEval:function(b){b&&j.test(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(w,"ms-").replace(v,x)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,c,d){var f,g=0,h=a.length,i=h===b||e.isFunction(a);if(d){if(i){for(f in a)if(c.apply(a[f],d)===!1)break}else for(;g<h;)if(c.apply(a[g++],d)===!1)break}else if(i){for(f in a)if(c.call(a[f],f,a[f])===!1)break}else for(;g<h;)if(c.call(a[g],g,a[g++])===!1)break;return a},trim:G?function(a){return a==null?"":G.call(a)}:function(a){return a==null?"":(a+"").replace(k,"").replace(l,"")},makeArray:function(a,b){var c=b||[];if(a!=null){var d=e.type(a);a.length==null||d==="string"||d==="function"||d==="regexp"||e.isWindow(a)?E.call(c,a):e.merge(c,a)}return c},inArray:function(a,b,c){var d;if(b){if(H)return H.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=a.length,e=0;if(typeof c.length=="number")for(var f=c.length;e<f;e++)a[d++]=c[e];else while(c[e]!==b)a[d++]=c[e++];a.length=d;return a},grep:function(a,b,c){var d=[],e;c=!!c;for(var f=0,g=a.length;f<g;f++)e=!!b(a[f],f),c!==e&&d.push(a[f]);return d},map:function(a,c,d){var f,g,h=[],i=0,j=a.length,k=a instanceof e||j!==b&&typeof j=="number"&&(j>0&&a[0]&&a[j-1]||j===0||e.isArray(a));if(k)for(;i<j;i++)f=c(a[i],i,d),f!=null&&(h[h.length]=f);else for(g in a)f=c(a[g],g,d),f!=null&&(h[h.length]=f);return h.concat.apply([],h)},guid:1,proxy:function(a,c){if(typeof c=="string"){var d=a[c];c=a,a=d}if(!e.isFunction(a))return b;var f=F.call(arguments,2),g=function(){return a.apply(c,f.concat(F.call(arguments)))};g.guid=a.guid=a.guid||g.guid||e.guid++;return g},access:function(a,c,d,f,g,h,i){var j,k=d==null,l=0,m=a.length;if(d&&typeof d=="object"){for(l in d)e.access(a,c,l,d[l],1,h,f);g=1}else if(f!==b){j=i===b&&e.isFunction(f),k&&(j?(j=c,c=function(a,b,c){return j.call(e(a),c)}):(c.call(a,f),c=null));if(c)for(;l<m;l++)c(a[l],d,j?f.call(a[l],l,c(a[l],d)):f,i);g=1}return g?a:k?c.call(a):m?c(a[0],d):h},now:function(){return(new Date).getTime()},uaMatch:function(a){a=a.toLowerCase();var b=r.exec(a)||s.exec(a)||t.exec(a)||a.indexOf("compatible")<0&&u.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},sub:function(){function a(b,c){return new a.fn.init(b,c)}e.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function(d,f){f&&f instanceof e&&!(f instanceof a)&&(f=a(f));return e.fn.init.call(this,d,f,b)},a.fn.init.prototype=a.fn;var b=a(c);return a},browser:{}}),e.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){I["[object "+b+"]"]=b.toLowerCase()}),z=e.uaMatch(y),z.browser&&(e.browser[z.browser]=!0,e.browser.version=z.version),e.browser.webkit&&(e.browser.safari=!0),j.test(" ")&&(k=/^[\s\xA0]+/,l=/[\s\xA0]+$/),h=e(c),c.addEventListener?B=function(){c.removeEventListener("DOMContentLoaded",B,!1),e.ready()}:c.attachEvent&&(B=function(){c.readyState==="complete"&&(c.detachEvent("onreadystatechange",B),e.ready())});return e}(),g={};f.Callbacks=function(a){a=a?g[a]||h(a):{};var c=[],d=[],e,i,j,k,l,m,n=function(b){var d,e,g,h,i;for(d=0,e=b.length;d<e;d++)g=b[d],h=f.type(g),h==="array"?n(g):h==="function"&&(!a.unique||!p.has(g))&&c.push(g)},o=function(b,f){f=f||[],e=!a.memory||[b,f],i=!0,j=!0,m=k||0,k=0,l=c.length;for(;c&&m<l;m++)if(c[m].apply(b,f)===!1&&a.stopOnFalse){e=!0;break}j=!1,c&&(a.once?e===!0?p.disable():c=[]:d&&d.length&&(e=d.shift(),p.fireWith(e[0],e[1])))},p={add:function(){if(c){var a=c.length;n(arguments),j?l=c.length:e&&e!==!0&&(k=a,o(e[0],e[1]))}return this},remove:function(){if(c){var b=arguments,d=0,e=b.length;for(;d<e;d++)for(var f=0;f<c.length;f++)if(b[d]===c[f]){j&&f<=l&&(l--,f<=m&&m--),c.splice(f--,1);if(a.unique)break}}return this},has:function(a){if(c){var b=0,d=c.length;for(;b<d;b++)if(a===c[b])return!0}return!1},empty:function(){c=[];return this},disable:function(){c=d=e=b;return this},disabled:function(){return!c},lock:function(){d=b,(!e||e===!0)&&p.disable();return this},locked:function(){return!d},fireWith:function(b,c){d&&(j?a.once||d.push([b,c]):(!a.once||!e)&&o(b,c));return this},fire:function(){p.fireWith(this,arguments);return this},fired:function(){return!!i}};return p};var i=[].slice;f.extend({Deferred:function(a){var b=f.Callbacks("once memory"),c=f.Callbacks("once memory"),d=f.Callbacks("memory"),e="pending",g={resolve:b,reject:c,notify:d},h={done:b.add,fail:c.add,progress:d.add,state:function(){return e},isResolved:b.fired,isRejected:c.fired,then:function(a,b,c){i.done(a).fail(b).progress(c);return this},always:function(){i.done.apply(i,arguments).fail.apply(i,arguments);return this},pipe:function(a,b,c){return f.Deferred(function(d){f.each({done:[a,"resolve"],fail:[b,"reject"],progress:[c,"notify"]},function(a,b){var c=b[0],e=b[1],g;f.isFunction(c)?i[a](function(){g=c.apply(this,arguments),g&&f.isFunction(g.promise)?g.promise().then(d.resolve,d.reject,d.notify):d[e+"With"](this===i?d:this,[g])}):i[a](d[e])})}).promise()},promise:function(a){if(a==null)a=h;else for(var b in h)a[b]=h[b];return a}},i=h.promise({}),j;for(j in g)i[j]=g[j].fire,i[j+"With"]=g[j].fireWith;i.done(function(){e="resolved"},c.disable,d.lock).fail(function(){e="rejected"},b.disable,d.lock),a&&a.call(i,i);return i},when:function(a){function m(a){return function(b){e[a]=arguments.length>1?i.call(arguments,0):b,j.notifyWith(k,e)}}function l(a){return function(c){b[a]=arguments.length>1?i.call(arguments,0):c,--g||j.resolveWith(j,b)}}var b=i.call(arguments,0),c=0,d=b.length,e=Array(d),g=d,h=d,j=d<=1&&a&&f.isFunction(a.promise)?a:f.Deferred(),k=j.promise();if(d>1){for(;c<d;c++)b[c]&&b[c].promise&&f.isFunction(b[c].promise)?b[c].promise().then(l(c),j.reject,m(c)):--g;g||j.resolveWith(j,b)}else j!==a&&j.resolveWith(j,d?[a]:[]);return k}}),f.support=function(){var b,d,e,g,h,i,j,k,l,m,n,o,p=c.createElement("div"),q=c.documentElement;p.setAttribute("className","t"),p.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>",d=p.getElementsByTagName("*"),e=p.getElementsByTagName("a")[0];if(!d||!d.length||!e)return{};g=c.createElement("select"),h=g.appendChild(c.createElement("option")),i=p.getElementsByTagName("input")[0],b={leadingWhitespace:p.firstChild.nodeType===3,tbody:!p.getElementsByTagName("tbody").length,htmlSerialize:!!p.getElementsByTagName("link").length,style:/top/.test(e.getAttribute("style")),hrefNormalized:e.getAttribute("href")==="/a",opacity:/^0.55/.test(e.style.opacity),cssFloat:!!e.style.cssFloat,checkOn:i.value==="on",optSelected:h.selected,getSetAttribute:p.className!=="t",enctype:!!c.createElement("form").enctype,html5Clone:c.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,pixelMargin:!0},f.boxModel=b.boxModel=c.compatMode==="CSS1Compat",i.checked=!0,b.noCloneChecked=i.cloneNode(!0).checked,g.disabled=!0,b.optDisabled=!h.disabled;try{delete p.test}catch(r){b.deleteExpando=!1}!p.addEventListener&&p.attachEvent&&p.fireEvent&&(p.attachEvent("onclick",function(){b.noCloneEvent=!1}),p.cloneNode(!0).fireEvent("onclick")),i=c.createElement("input"),i.value="t",i.setAttribute("type","radio"),b.radioValue=i.value==="t",i.setAttribute("checked","checked"),i.setAttribute("name","t"),p.appendChild(i),j=c.createDocumentFragment(),j.appendChild(p.lastChild),b.checkClone=j.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=i.checked,j.removeChild(i),j.appendChild(p);if(p.attachEvent)for(n in{submit:1,change:1,focusin:1})m="on"+n,o=m in p,o||(p.setAttribute(m,"return;"),o=typeof p[m]=="function"),b[n+"Bubbles"]=o;j.removeChild(p),j=g=h=p=i=null,f(function(){var d,e,g,h,i,j,l,m,n,q,r,s,t,u=c.getElementsByTagName("body")[0];!u||(m=1,t="padding:0;margin:0;border:",r="position:absolute;top:0;left:0;width:1px;height:1px;",s=t+"0;visibility:hidden;",n="style='"+r+t+"5px solid #000;",q="<div "+n+"display:block;'><div style='"+t+"0;display:block;overflow:hidden;'></div></div>"+"<table "+n+"' cellpadding='0' cellspacing='0'>"+"<tr><td></td></tr></table>",d=c.createElement("div"),d.style.cssText=s+"width:0;height:0;position:static;top:0;margin-top:"+m+"px",u.insertBefore(d,u.firstChild),p=c.createElement("div"),d.appendChild(p),p.innerHTML="<table><tr><td style='"+t+"0;display:none'></td><td>t</td></tr></table>",k=p.getElementsByTagName("td"),o=k[0].offsetHeight===0,k[0].style.display="",k[1].style.display="none",b.reliableHiddenOffsets=o&&k[0].offsetHeight===0,a.getComputedStyle&&(p.innerHTML="",l=c.createElement("div"),l.style.width="0",l.style.marginRight="0",p.style.width="2px",p.appendChild(l),b.reliableMarginRight=(parseInt((a.getComputedStyle(l,null)||{marginRight:0}).marginRight,10)||0)===0),typeof p.style.zoom!="undefined"&&(p.innerHTML="",p.style.width=p.style.padding="1px",p.style.border=0,p.style.overflow="hidden",p.style.display="inline",p.style.zoom=1,b.inlineBlockNeedsLayout=p.offsetWidth===3,p.style.display="block",p.style.overflow="visible",p.innerHTML="<div style='width:5px;'></div>",b.shrinkWrapBlocks=p.offsetWidth!==3),p.style.cssText=r+s,p.innerHTML=q,e=p.firstChild,g=e.firstChild,i=e.nextSibling.firstChild.firstChild,j={doesNotAddBorder:g.offsetTop!==5,doesAddBorderForTableAndCells:i.offsetTop===5},g.style.position="fixed",g.style.top="20px",j.fixedPosition=g.offsetTop===20||g.offsetTop===15,g.style.position=g.style.top="",e.style.overflow="hidden",e.style.position="relative",j.subtractsBorderForOverflowNotVisible=g.offsetTop===-5,j.doesNotIncludeMarginInBodyOffset=u.offsetTop!==m,a.getComputedStyle&&(p.style.marginTop="1%",b.pixelMargin=(a.getComputedStyle(p,null)||{marginTop:0}).marginTop!=="1%"),typeof d.style.zoom!="undefined"&&(d.style.zoom=1),u.removeChild(d),l=p=d=null,f.extend(b,j))});return b}();var j=/^(?:\{.*\}|\[.*\])$/,k=/([A-Z])/g;f.extend({cache:{},uuid:0,expando:"jQuery"+(f.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){a=a.nodeType?f.cache[a[f.expando]]:a[f.expando];return!!a&&!m(a)},data:function(a,c,d,e){if(!!f.acceptData(a)){var g,h,i,j=f.expando,k=typeof c=="string",l=a.nodeType,m=l?f.cache:a,n=l?a[j]:a[j]&&j,o=c==="events";if((!n||!m[n]||!o&&!e&&!m[n].data)&&k&&d===b)return;n||(l?a[j]=n=++f.uuid:n=j),m[n]||(m[n]={},l||(m[n].toJSON=f.noop));if(typeof c=="object"||typeof c=="function")e?m[n]=f.extend(m[n],c):m[n].data=f.extend(m[n].data,c);g=h=m[n],e||(h.data||(h.data={}),h=h.data),d!==b&&(h[f.camelCase(c)]=d);if(o&&!h[c])return g.events;k?(i=h[c],i==null&&(i=h[f.camelCase(c)])):i=h;return i}},removeData:function(a,b,c){if(!!f.acceptData(a)){var d,e,g,h=f.expando,i=a.nodeType,j=i?f.cache:a,k=i?a[h]:h;if(!j[k])return;if(b){d=c?j[k]:j[k].data;if(d){f.isArray(b)||(b in d?b=[b]:(b=f.camelCase(b),b in d?b=[b]:b=b.split(" ")));for(e=0,g=b.length;e<g;e++)delete d[b[e]];if(!(c?m:f.isEmptyObject)(d))return}}if(!c){delete j[k].data;if(!m(j[k]))return}f.support.deleteExpando||!j.setInterval?delete j[k]:j[k]=null,i&&(f.support.deleteExpando?delete a[h]:a.removeAttribute?a.removeAttribute(h):a[h]=null)}},_data:function(a,b,c){return f.data(a,b,c,!0)},acceptData:function(a){if(a.nodeName){var b=f.noData[a.nodeName.toLowerCase()];if(b)return b!==!0&&a.getAttribute("classid")===b}return!0}}),f.fn.extend({data:function(a,c){var d,e,g,h,i,j=this[0],k=0,m=null;if(a===b){if(this.length){m=f.data(j);if(j.nodeType===1&&!f._data(j,"parsedAttrs")){g=j.attributes;for(i=g.length;k<i;k++)h=g[k].name,h.indexOf("data-")===0&&(h=f.camelCase(h.substring(5)),l(j,h,m[h]));f._data(j,"parsedAttrs",!0)}}return m}if(typeof a=="object")return this.each(function(){f.data(this,a)});d=a.split(".",2),d[1]=d[1]?"."+d[1]:"",e=d[1]+"!";return f.access(this,function(c){if(c===b){m=this.triggerHandler("getData"+e,[d[0]]),m===b&&j&&(m=f.data(j,a),m=l(j,a,m));return m===b&&d[1]?this.data(d[0]):m}d[1]=c,this.each(function(){var b=f(this);b.triggerHandler("setData"+e,d),f.data(this,a,c),b.triggerHandler("changeData"+e,d)})},null,c,arguments.length>1,null,!1)},removeData:function(a){return this.each(function(){f.removeData(this,a)})}}),f.extend({_mark:function(a,b){a&&(b=(b||"fx")+"mark",f._data(a,b,(f._data(a,b)||0)+1))},_unmark:function(a,b,c){a!==!0&&(c=b,b=a,a=!1);if(b){c=c||"fx";var d=c+"mark",e=a?0:(f._data(b,d)||1)-1;e?f._data(b,d,e):(f.removeData(b,d,!0),n(b,c,"mark"))}},queue:function(a,b,c){var d;if(a){b=(b||"fx")+"queue",d=f._data(a,b),c&&(!d||f.isArray(c)?d=f._data(a,b,f.makeArray(c)):d.push(c));return d||[]}},dequeue:function(a,b){b=b||"fx";var c=f.queue(a,b),d=c.shift(),e={};d==="inprogress"&&(d=c.shift()),d&&(b==="fx"&&c.unshift("inprogress"),f._data(a,b+".run",e),d.call(a,function(){f.dequeue(a,b)},e)),c.length||(f.removeData(a,b+"queue "+b+".run",!0),n(a,b,"queue"))}}),f.fn.extend({queue:function(a,c){var d=2;typeof a!="string"&&(c=a,a="fx",d--);if(arguments.length<d)return f.queue(this[0],a);return c===b?this:this.each(function(){var b=f.queue(this,a,c);a==="fx"&&b[0]!=="inprogress"&&f.dequeue(this,a)})},dequeue:function(a){return this.each(function(){f.dequeue(this,a)})},delay:function(a,b){a=f.fx?f.fx.speeds[a]||a:a,b=b||"fx";return this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){function m(){--h||d.resolveWith(e,[e])}typeof a!="string"&&(c=a,a=b),a=a||"fx";var d=f.Deferred(),e=this,g=e.length,h=1,i=a+"defer",j=a+"queue",k=a+"mark",l;while(g--)if(l=f.data(e[g],i,b,!0)||(f.data(e[g],j,b,!0)||f.data(e[g],k,b,!0))&&f.data(e[g],i,f.Callbacks("once memory"),!0))h++,l.add(m);m();return d.promise(c)}});var o=/[\n\t\r]/g,p=/\s+/,q=/\r/g,r=/^(?:button|input)$/i,s=/^(?:button|input|object|select|textarea)$/i,t=/^a(?:rea)?$/i,u=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,v=f.support.getSetAttribute,w,x,y;f.fn.extend({attr:function(a,b){return f.access(this,f.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){f.removeAttr(this,a)})},prop:function(a,b){return f.access(this,f.prop,a,b,arguments.length>1)},removeProp:function(a){a=f.propFix[a]||a;return this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,g,h,i;if(f.isFunction(a))return this.each(function(b){f(this).addClass(a.call(this,b,this.className))});if(a&&typeof a=="string"){b=a.split(p);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{g=" "+e.className+" ";for(h=0,i=b.length;h<i;h++)~g.indexOf(" "+b[h]+" ")||(g+=b[h]+" ");e.className=f.trim(g)}}}return this},removeClass:function(a){var c,d,e,g,h,i,j;if(f.isFunction(a))return this.each(function(b){f(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(p);for(d=0,e=this.length;d<e;d++){g=this[d];if(g.nodeType===1&&g.className)if(a){h=(" "+g.className+" ").replace(o," ");for(i=0,j=c.length;i<j;i++)h=h.replace(" "+c[i]+" "," ");g.className=f.trim(h)}else g.className=""}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";if(f.isFunction(a))return this.each(function(c){f(this).toggleClass(a.call(this,c,this.className,b),b)});return this.each(function(){if(c==="string"){var e,g=0,h=f(this),i=b,j=a.split(p);while(e=j[g++])i=d?i:!h.hasClass(e),h[i?"addClass":"removeClass"](e)}else if(c==="undefined"||c==="boolean")this.className&&f._data(this,"__className__",this.className),this.className=this.className||a===!1?"":f._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(o," ").indexOf(b)>-1)return!0;return!1},val:function(a){var c,d,e,g=this[0];{if(!!arguments.length){e=f.isFunction(a);return this.each(function(d){var g=f(this),h;if(this.nodeType===1){e?h=a.call(this,d,g.val()):h=a,h==null?h="":typeof h=="number"?h+="":f.isArray(h)&&(h=f.map(h,function(a){return a==null?"":a+""})),c=f.valHooks[this.type]||f.valHooks[this.nodeName.toLowerCase()];if(!c||!("set"in c)||c.set(this,h,"value")===b)this.value=h}})}if(g){c=f.valHooks[g.type]||f.valHooks[g.nodeName.toLowerCase()];if(c&&"get"in c&&(d=c.get(g,"value"))!==b)return d;d=g.value;return typeof d=="string"?d.replace(q,""):d==null?"":d}}}}),f.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,g=a.selectedIndex,h=[],i=a.options,j=a.type==="select-one";if(g<0)return null;c=j?g:0,d=j?g+1:i.length;for(;c<d;c++){e=i[c];if(e.selected&&(f.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!f.nodeName(e.parentNode,"optgroup"))){b=f(e).val();if(j)return b;h.push(b)}}if(j&&!h.length&&i.length)return f(i[g]).val();return h},set:function(a,b){var c=f.makeArray(b);f(a).find("option").each(function(){this.selected=f.inArray(f(this).val(),c)>=0}),c.length||(a.selectedIndex=-1);return c}}},attrFn:{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,offset:!0},attr:function(a,c,d,e){var g,h,i,j=a.nodeType;if(!!a&&j!==3&&j!==8&&j!==2){if(e&&c in f.attrFn)return f(a)[c](d);if(typeof a.getAttribute=="undefined")return f.prop(a,c,d);i=j!==1||!f.isXMLDoc(a),i&&(c=c.toLowerCase(),h=f.attrHooks[c]||(u.test(c)?x:w));if(d!==b){if(d===null){f.removeAttr(a,c);return}if(h&&"set"in h&&i&&(g=h.set(a,d,c))!==b)return g;a.setAttribute(c,""+d);return d}if(h&&"get"in h&&i&&(g=h.get(a,c))!==null)return g;g=a.getAttribute(c);return g===null?b:g}},removeAttr:function(a,b){var c,d,e,g,h,i=0;if(b&&a.nodeType===1){d=b.toLowerCase().split(p),g=d.length;for(;i<g;i++)e=d[i],e&&(c=f.propFix[e]||e,h=u.test(e),h||f.attr(a,e,""),a.removeAttribute(v?e:c),h&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(r.test(a.nodeName)&&a.parentNode)f.error("type property can't be changed");else if(!f.support.radioValue&&b==="radio"&&f.nodeName(a,"input")){var c=a.value;a.setAttribute("type",b),c&&(a.value=c);return b}}},value:{get:function(a,b){if(w&&f.nodeName(a,"button"))return w.get(a,b);return b in a?a.value:null},set:function(a,b,c){if(w&&f.nodeName(a,"button"))return w.set(a,b,c);a.value=b}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,g,h,i=a.nodeType;if(!!a&&i!==3&&i!==8&&i!==2){h=i!==1||!f.isXMLDoc(a),h&&(c=f.propFix[c]||c,g=f.propHooks[c]);return d!==b?g&&"set"in g&&(e=g.set(a,d,c))!==b?e:a[c]=d:g&&"get"in g&&(e=g.get(a,c))!==null?e:a[c]}},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):s.test(a.nodeName)||t.test(a.nodeName)&&a.href?0:b}}}}),f.attrHooks.tabindex=f.propHooks.tabIndex,x={get:function(a,c){var d,e=f.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b},set:function(a,b,c){var d;b===!1?f.removeAttr(a,c):(d=f.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase()));return c}},v||(y={name:!0,id:!0,coords:!0},w=f.valHooks.button={get:function(a,c){var d;d=a.getAttributeNode(c);return d&&(y[c]?d.nodeValue!=="":d.specified)?d.nodeValue:b},set:function(a,b,d){var e=a.getAttributeNode(d);e||(e=c.createAttribute(d),a.setAttributeNode(e));return e.nodeValue=b+""}},f.attrHooks.tabindex.set=w.set,f.each(["width","height"],function(a,b){f.attrHooks[b]=f.extend(f.attrHooks[b],{set:function(a,c){if(c===""){a.setAttribute(b,"auto");return c}}})}),f.attrHooks.contenteditable={get:w.get,set:function(a,b,c){b===""&&(b="false"),w.set(a,b,c)}}),f.support.hrefNormalized||f.each(["href","src","width","height"],function(a,c){f.attrHooks[c]=f.extend(f.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),f.support.style||(f.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=""+b}}),f.support.optSelected||(f.propHooks.selected=f.extend(f.propHooks.selected,{get:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex);return null}})),f.support.enctype||(f.propFix.enctype="encoding"),f.support.checkOn||f.each(["radio","checkbox"],function(){f.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}}),f.each(["radio","checkbox"],function(){f.valHooks[this]=f.extend(f.valHooks[this],{set:function(a,b){if(f.isArray(b))return a.checked=f.inArray(f(a).val(),b)>=0}})});var z=/^(?:textarea|input|select)$/i,A=/^([^\.]*)?(?:\.(.+))?$/,B=/(?:^|\s)hover(\.\S+)?\b/,C=/^key/,D=/^(?:mouse|contextmenu)|click/,E=/^(?:focusinfocus|focusoutblur)$/,F=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,G=function(
a){var b=F.exec(a);b&&(b[1]=(b[1]||"").toLowerCase(),b[3]=b[3]&&new RegExp("(?:^|\\s)"+b[3]+"(?:\\s|$)"));return b},H=function(a,b){var c=a.attributes||{};return(!b[1]||a.nodeName.toLowerCase()===b[1])&&(!b[2]||(c.id||{}).value===b[2])&&(!b[3]||b[3].test((c["class"]||{}).value))},I=function(a){return f.event.special.hover?a:a.replace(B,"mouseenter$1 mouseleave$1")};f.event={add:function(a,c,d,e,g){var h,i,j,k,l,m,n,o,p,q,r,s;if(!(a.nodeType===3||a.nodeType===8||!c||!d||!(h=f._data(a)))){d.handler&&(p=d,d=p.handler,g=p.selector),d.guid||(d.guid=f.guid++),j=h.events,j||(h.events=j={}),i=h.handle,i||(h.handle=i=function(a){return typeof f!="undefined"&&(!a||f.event.triggered!==a.type)?f.event.dispatch.apply(i.elem,arguments):b},i.elem=a),c=f.trim(I(c)).split(" ");for(k=0;k<c.length;k++){l=A.exec(c[k])||[],m=l[1],n=(l[2]||"").split(".").sort(),s=f.event.special[m]||{},m=(g?s.delegateType:s.bindType)||m,s=f.event.special[m]||{},o=f.extend({type:m,origType:l[1],data:e,handler:d,guid:d.guid,selector:g,quick:g&&G(g),namespace:n.join(".")},p),r=j[m];if(!r){r=j[m]=[],r.delegateCount=0;if(!s.setup||s.setup.call(a,e,n,i)===!1)a.addEventListener?a.addEventListener(m,i,!1):a.attachEvent&&a.attachEvent("on"+m,i)}s.add&&(s.add.call(a,o),o.handler.guid||(o.handler.guid=d.guid)),g?r.splice(r.delegateCount++,0,o):r.push(o),f.event.global[m]=!0}a=null}},global:{},remove:function(a,b,c,d,e){var g=f.hasData(a)&&f._data(a),h,i,j,k,l,m,n,o,p,q,r,s;if(!!g&&!!(o=g.events)){b=f.trim(I(b||"")).split(" ");for(h=0;h<b.length;h++){i=A.exec(b[h])||[],j=k=i[1],l=i[2];if(!j){for(j in o)f.event.remove(a,j+b[h],c,d,!0);continue}p=f.event.special[j]||{},j=(d?p.delegateType:p.bindType)||j,r=o[j]||[],m=r.length,l=l?new RegExp("(^|\\.)"+l.split(".").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;for(n=0;n<r.length;n++)s=r[n],(e||k===s.origType)&&(!c||c.guid===s.guid)&&(!l||l.test(s.namespace))&&(!d||d===s.selector||d==="**"&&s.selector)&&(r.splice(n--,1),s.selector&&r.delegateCount--,p.remove&&p.remove.call(a,s));r.length===0&&m!==r.length&&((!p.teardown||p.teardown.call(a,l)===!1)&&f.removeEvent(a,j,g.handle),delete o[j])}f.isEmptyObject(o)&&(q=g.handle,q&&(q.elem=null),f.removeData(a,["events","handle"],!0))}},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,e,g){if(!e||e.nodeType!==3&&e.nodeType!==8){var h=c.type||c,i=[],j,k,l,m,n,o,p,q,r,s;if(E.test(h+f.event.triggered))return;h.indexOf("!")>=0&&(h=h.slice(0,-1),k=!0),h.indexOf(".")>=0&&(i=h.split("."),h=i.shift(),i.sort());if((!e||f.event.customEvent[h])&&!f.event.global[h])return;c=typeof c=="object"?c[f.expando]?c:new f.Event(h,c):new f.Event(h),c.type=h,c.isTrigger=!0,c.exclusive=k,c.namespace=i.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+i.join("\\.(?:.*\\.)?")+"(\\.|$)"):null,o=h.indexOf(":")<0?"on"+h:"";if(!e){j=f.cache;for(l in j)j[l].events&&j[l].events[h]&&f.event.trigger(c,d,j[l].handle.elem,!0);return}c.result=b,c.target||(c.target=e),d=d!=null?f.makeArray(d):[],d.unshift(c),p=f.event.special[h]||{};if(p.trigger&&p.trigger.apply(e,d)===!1)return;r=[[e,p.bindType||h]];if(!g&&!p.noBubble&&!f.isWindow(e)){s=p.delegateType||h,m=E.test(s+h)?e:e.parentNode,n=null;for(;m;m=m.parentNode)r.push([m,s]),n=m;n&&n===e.ownerDocument&&r.push([n.defaultView||n.parentWindow||a,s])}for(l=0;l<r.length&&!c.isPropagationStopped();l++)m=r[l][0],c.type=r[l][1],q=(f._data(m,"events")||{})[c.type]&&f._data(m,"handle"),q&&q.apply(m,d),q=o&&m[o],q&&f.acceptData(m)&&q.apply(m,d)===!1&&c.preventDefault();c.type=h,!g&&!c.isDefaultPrevented()&&(!p._default||p._default.apply(e.ownerDocument,d)===!1)&&(h!=="click"||!f.nodeName(e,"a"))&&f.acceptData(e)&&o&&e[h]&&(h!=="focus"&&h!=="blur"||c.target.offsetWidth!==0)&&!f.isWindow(e)&&(n=e[o],n&&(e[o]=null),f.event.triggered=h,e[h](),f.event.triggered=b,n&&(e[o]=n));return c.result}},dispatch:function(c){c=f.event.fix(c||a.event);var d=(f._data(this,"events")||{})[c.type]||[],e=d.delegateCount,g=[].slice.call(arguments,0),h=!c.exclusive&&!c.namespace,i=f.event.special[c.type]||{},j=[],k,l,m,n,o,p,q,r,s,t,u;g[0]=c,c.delegateTarget=this;if(!i.preDispatch||i.preDispatch.call(this,c)!==!1){if(e&&(!c.button||c.type!=="click")){n=f(this),n.context=this.ownerDocument||this;for(m=c.target;m!=this;m=m.parentNode||this)if(m.disabled!==!0){p={},r=[],n[0]=m;for(k=0;k<e;k++)s=d[k],t=s.selector,p[t]===b&&(p[t]=s.quick?H(m,s.quick):n.is(t)),p[t]&&r.push(s);r.length&&j.push({elem:m,matches:r})}}d.length>e&&j.push({elem:this,matches:d.slice(e)});for(k=0;k<j.length&&!c.isPropagationStopped();k++){q=j[k],c.currentTarget=q.elem;for(l=0;l<q.matches.length&&!c.isImmediatePropagationStopped();l++){s=q.matches[l];if(h||!c.namespace&&!s.namespace||c.namespace_re&&c.namespace_re.test(s.namespace))c.data=s.data,c.handleObj=s,o=((f.event.special[s.origType]||{}).handle||s.handler).apply(q.elem,g),o!==b&&(c.result=o,o===!1&&(c.preventDefault(),c.stopPropagation()))}}i.postDispatch&&i.postDispatch.call(this,c);return c.result}},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode);return a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,d){var e,f,g,h=d.button,i=d.fromElement;a.pageX==null&&d.clientX!=null&&(e=a.target.ownerDocument||c,f=e.documentElement,g=e.body,a.pageX=d.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=d.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?d.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0);return a}},fix:function(a){if(a[f.expando])return a;var d,e,g=a,h=f.event.fixHooks[a.type]||{},i=h.props?this.props.concat(h.props):this.props;a=f.Event(g);for(d=i.length;d;)e=i[--d],a[e]=g[e];a.target||(a.target=g.srcElement||c),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey===b&&(a.metaKey=a.ctrlKey);return h.filter?h.filter(a,g):a},special:{ready:{setup:f.bindReady},load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){f.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=f.extend(new f.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?f.event.trigger(e,null,b):f.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},f.event.handle=f.event.dispatch,f.removeEvent=c.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){a.detachEvent&&a.detachEvent("on"+b,c)},f.Event=function(a,b){if(!(this instanceof f.Event))return new f.Event(a,b);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?K:J):this.type=a,b&&f.extend(this,b),this.timeStamp=a&&a.timeStamp||f.now(),this[f.expando]=!0},f.Event.prototype={preventDefault:function(){this.isDefaultPrevented=K;var a=this.originalEvent;!a||(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){this.isPropagationStopped=K;var a=this.originalEvent;!a||(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=K,this.stopPropagation()},isDefaultPrevented:J,isPropagationStopped:J,isImmediatePropagationStopped:J},f.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){f.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c=this,d=a.relatedTarget,e=a.handleObj,g=e.selector,h;if(!d||d!==c&&!f.contains(c,d))a.type=e.origType,h=e.handler.apply(this,arguments),a.type=b;return h}}}),f.support.submitBubbles||(f.event.special.submit={setup:function(){if(f.nodeName(this,"form"))return!1;f.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=f.nodeName(c,"input")||f.nodeName(c,"button")?c.form:b;d&&!d._submit_attached&&(f.event.add(d,"submit._submit",function(a){a._submit_bubble=!0}),d._submit_attached=!0)})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&f.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){if(f.nodeName(this,"form"))return!1;f.event.remove(this,"._submit")}}),f.support.changeBubbles||(f.event.special.change={setup:function(){if(z.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")f.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),f.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1,f.event.simulate("change",this,a,!0))});return!1}f.event.add(this,"beforeactivate._change",function(a){var b=a.target;z.test(b.nodeName)&&!b._change_attached&&(f.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&f.event.simulate("change",this.parentNode,a,!0)}),b._change_attached=!0)})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){f.event.remove(this,"._change");return z.test(this.nodeName)}}),f.support.focusinBubbles||f.each({focus:"focusin",blur:"focusout"},function(a,b){var d=0,e=function(a){f.event.simulate(b,a.target,f.event.fix(a),!0)};f.event.special[b]={setup:function(){d++===0&&c.addEventListener(a,e,!0)},teardown:function(){--d===0&&c.removeEventListener(a,e,!0)}}}),f.fn.extend({on:function(a,c,d,e,g){var h,i;if(typeof a=="object"){typeof c!="string"&&(d=d||c,c=b);for(i in a)this.on(i,c,d,a[i],g);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));if(e===!1)e=J;else if(!e)return this;g===1&&(h=e,e=function(a){f().off(a);return h.apply(this,arguments)},e.guid=h.guid||(h.guid=f.guid++));return this.each(function(){f.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,c,d){if(a&&a.preventDefault&&a.handleObj){var e=a.handleObj;f(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler);return this}if(typeof a=="object"){for(var g in a)this.off(g,c,a[g]);return this}if(c===!1||typeof c=="function")d=c,c=b;d===!1&&(d=J);return this.each(function(){f.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){f(this.context).on(a,this.selector,b,c);return this},die:function(a,b){f(this.context).off(a,this.selector||"**",b);return this},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length==1?this.off(a,"**"):this.off(b,a,c)},trigger:function(a,b){return this.each(function(){f.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0])return f.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||f.guid++,d=0,e=function(c){var e=(f._data(this,"lastToggle"+a.guid)||0)%d;f._data(this,"lastToggle"+a.guid,e+1),c.preventDefault();return b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){f.fn[b]=function(a,c){c==null&&(c=a,a=null);return arguments.length>0?this.on(b,null,a,c):this.trigger(b)},f.attrFn&&(f.attrFn[b]=!0),C.test(b)&&(f.event.fixHooks[b]=f.event.keyHooks),D.test(b)&&(f.event.fixHooks[b]=f.event.mouseHooks)}),function(){function x(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}if(j.nodeType===1){g||(j[d]=c,j.sizset=h);if(typeof b!="string"){if(j===b){k=!0;break}}else if(m.filter(b,[j]).length>0){k=j;break}}j=j[a]}e[h]=k}}}function w(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}j.nodeType===1&&!g&&(j[d]=c,j.sizset=h);if(j.nodeName.toLowerCase()===b){k=j;break}j=j[a]}e[h]=k}}}var a=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,d="sizcache"+(Math.random()+"").replace(".",""),e=0,g=Object.prototype.toString,h=!1,i=!0,j=/\\/g,k=/\r\n/g,l=/\W/;[0,0].sort(function(){i=!1;return 0});var m=function(b,d,e,f){e=e||[],d=d||c;var h=d;if(d.nodeType!==1&&d.nodeType!==9)return[];if(!b||typeof b!="string")return e;var i,j,k,l,n,q,r,t,u=!0,v=m.isXML(d),w=[],x=b;do{a.exec(""),i=a.exec(x);if(i){x=i[3],w.push(i[1]);if(i[2]){l=i[3];break}}}while(i);if(w.length>1&&p.exec(b))if(w.length===2&&o.relative[w[0]])j=y(w[0]+w[1],d,f);else{j=o.relative[w[0]]?[d]:m(w.shift(),d);while(w.length)b=w.shift(),o.relative[b]&&(b+=w.shift()),j=y(b,j,f)}else{!f&&w.length>1&&d.nodeType===9&&!v&&o.match.ID.test(w[0])&&!o.match.ID.test(w[w.length-1])&&(n=m.find(w.shift(),d,v),d=n.expr?m.filter(n.expr,n.set)[0]:n.set[0]);if(d){n=f?{expr:w.pop(),set:s(f)}:m.find(w.pop(),w.length===1&&(w[0]==="~"||w[0]==="+")&&d.parentNode?d.parentNode:d,v),j=n.expr?m.filter(n.expr,n.set):n.set,w.length>0?k=s(j):u=!1;while(w.length)q=w.pop(),r=q,o.relative[q]?r=w.pop():q="",r==null&&(r=d),o.relative[q](k,r,v)}else k=w=[]}k||(k=j),k||m.error(q||b);if(g.call(k)==="[object Array]")if(!u)e.push.apply(e,k);else if(d&&d.nodeType===1)for(t=0;k[t]!=null;t++)k[t]&&(k[t]===!0||k[t].nodeType===1&&m.contains(d,k[t]))&&e.push(j[t]);else for(t=0;k[t]!=null;t++)k[t]&&k[t].nodeType===1&&e.push(j[t]);else s(k,e);l&&(m(l,h,e,f),m.uniqueSort(e));return e};m.uniqueSort=function(a){if(u){h=i,a.sort(u);if(h)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1)}return a},m.matches=function(a,b){return m(a,null,null,b)},m.matchesSelector=function(a,b){return m(b,null,null,[a]).length>0},m.find=function(a,b,c){var d,e,f,g,h,i;if(!a)return[];for(e=0,f=o.order.length;e<f;e++){h=o.order[e];if(g=o.leftMatch[h].exec(a)){i=g[1],g.splice(1,1);if(i.substr(i.length-1)!=="\\"){g[1]=(g[1]||"").replace(j,""),d=o.find[h](g,b,c);if(d!=null){a=a.replace(o.match[h],"");break}}}}d||(d=typeof b.getElementsByTagName!="undefined"?b.getElementsByTagName("*"):[]);return{set:d,expr:a}},m.filter=function(a,c,d,e){var f,g,h,i,j,k,l,n,p,q=a,r=[],s=c,t=c&&c[0]&&m.isXML(c[0]);while(a&&c.length){for(h in o.filter)if((f=o.leftMatch[h].exec(a))!=null&&f[2]){k=o.filter[h],l=f[1],g=!1,f.splice(1,1);if(l.substr(l.length-1)==="\\")continue;s===r&&(r=[]);if(o.preFilter[h]){f=o.preFilter[h](f,s,d,r,e,t);if(!f)g=i=!0;else if(f===!0)continue}if(f)for(n=0;(j=s[n])!=null;n++)j&&(i=k(j,f,n,s),p=e^i,d&&i!=null?p?g=!0:s[n]=!1:p&&(r.push(j),g=!0));if(i!==b){d||(s=r),a=a.replace(o.match[h],"");if(!g)return[];break}}if(a===q)if(g==null)m.error(a);else break;q=a}return s},m.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)};var n=m.getText=function(a){var b,c,d=a.nodeType,e="";if(d){if(d===1||d===9||d===11){if(typeof a.textContent=="string")return a.textContent;if(typeof a.innerText=="string")return a.innerText.replace(k,"");for(a=a.firstChild;a;a=a.nextSibling)e+=n(a)}else if(d===3||d===4)return a.nodeValue}else for(b=0;c=a[b];b++)c.nodeType!==8&&(e+=n(c));return e},o=m.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href")},type:function(a){return a.getAttribute("type")}},relative:{"+":function(a,b){var c=typeof b=="string",d=c&&!l.test(b),e=c&&!d;d&&(b=b.toLowerCase());for(var f=0,g=a.length,h;f<g;f++)if(h=a[f]){while((h=h.previousSibling)&&h.nodeType!==1);a[f]=e||h&&h.nodeName.toLowerCase()===b?h||!1:h===b}e&&m.filter(b,a,!0)},">":function(a,b){var c,d=typeof b=="string",e=0,f=a.length;if(d&&!l.test(b)){b=b.toLowerCase();for(;e<f;e++){c=a[e];if(c){var g=c.parentNode;a[e]=g.nodeName.toLowerCase()===b?g:!1}}}else{for(;e<f;e++)c=a[e],c&&(a[e]=d?c.parentNode:c.parentNode===b);d&&m.filter(b,a,!0)}},"":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("parentNode",b,f,a,d,c)},"~":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("previousSibling",b,f,a,d,c)}},find:{ID:function(a,b,c){if(typeof b.getElementById!="undefined"&&!c){var d=b.getElementById(a[1]);return d&&d.parentNode?[d]:[]}},NAME:function(a,b){if(typeof b.getElementsByName!="undefined"){var c=[],d=b.getElementsByName(a[1]);for(var e=0,f=d.length;e<f;e++)d[e].getAttribute("name")===a[1]&&c.push(d[e]);return c.length===0?null:c}},TAG:function(a,b){if(typeof b.getElementsByTagName!="undefined")return b.getElementsByTagName(a[1])}},preFilter:{CLASS:function(a,b,c,d,e,f){a=" "+a[1].replace(j,"")+" ";if(f)return a;for(var g=0,h;(h=b[g])!=null;g++)h&&(e^(h.className&&(" "+h.className+" ").replace(/[\t\n\r]/g," ").indexOf(a)>=0)?c||d.push(h):c&&(b[g]=!1));return!1},ID:function(a){return a[1].replace(j,"")},TAG:function(a,b){return a[1].replace(j,"").toLowerCase()},CHILD:function(a){if(a[1]==="nth"){a[2]||m.error(a[0]),a[2]=a[2].replace(/^\+|\s*/g,"");var b=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2]==="even"&&"2n"||a[2]==="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);a[2]=b[1]+(b[2]||1)-0,a[3]=b[3]-0}else a[2]&&m.error(a[0]);a[0]=e++;return a},ATTR:function(a,b,c,d,e,f){var g=a[1]=a[1].replace(j,"");!f&&o.attrMap[g]&&(a[1]=o.attrMap[g]),a[4]=(a[4]||a[5]||"").replace(j,""),a[2]==="~="&&(a[4]=" "+a[4]+" ");return a},PSEUDO:function(b,c,d,e,f){if(b[1]==="not")if((a.exec(b[3])||"").length>1||/^\w/.test(b[3]))b[3]=m(b[3],null,null,c);else{var g=m.filter(b[3],c,d,!0^f);d||e.push.apply(e,g);return!1}else if(o.match.POS.test(b[0])||o.match.CHILD.test(b[0]))return!0;return b},POS:function(a){a.unshift(!0);return a}},filters:{enabled:function(a){return a.disabled===!1&&a.type!=="hidden"},disabled:function(a){return a.disabled===!0},checked:function(a){return a.checked===!0},selected:function(a){a.parentNode&&a.parentNode.selectedIndex;return a.selected===!0},parent:function(a){return!!a.firstChild},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!m(c[3],a).length},header:function(a){return/h\d/i.test(a.nodeName)},text:function(a){var b=a.getAttribute("type"),c=a.type;return a.nodeName.toLowerCase()==="input"&&"text"===c&&(b===c||b===null)},radio:function(a){return a.nodeName.toLowerCase()==="input"&&"radio"===a.type},checkbox:function(a){return a.nodeName.toLowerCase()==="input"&&"checkbox"===a.type},file:function(a){return a.nodeName.toLowerCase()==="input"&&"file"===a.type},password:function(a){return a.nodeName.toLowerCase()==="input"&&"password"===a.type},submit:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"submit"===a.type},image:function(a){return a.nodeName.toLowerCase()==="input"&&"image"===a.type},reset:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"reset"===a.type},button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&"button"===a.type||b==="button"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName)},focus:function(a){return a===a.ownerDocument.activeElement}},setFilters:{first:function(a,b){return b===0},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){return c[3]-0===b},eq:function(a,b,c){return c[3]-0===b}},filter:{PSEUDO:function(a,b,c,d){var e=b[1],f=o.filters[e];if(f)return f(a,c,b,d);if(e==="contains")return(a.textContent||a.innerText||n([a])||"").indexOf(b[3])>=0;if(e==="not"){var g=b[3];for(var h=0,i=g.length;h<i;h++)if(g[h]===a)return!1;return!0}m.error(e)},CHILD:function(a,b){var c,e,f,g,h,i,j,k=b[1],l=a;switch(k){case"only":case"first":while(l=l.previousSibling)if(l.nodeType===1)return!1;if(k==="first")return!0;l=a;case"last":while(l=l.nextSibling)if(l.nodeType===1)return!1;return!0;case"nth":c=b[2],e=b[3];if(c===1&&e===0)return!0;f=b[0],g=a.parentNode;if(g&&(g[d]!==f||!a.nodeIndex)){i=0;for(l=g.firstChild;l;l=l.nextSibling)l.nodeType===1&&(l.nodeIndex=++i);g[d]=f}j=a.nodeIndex-e;return c===0?j===0:j%c===0&&j/c>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b},TAG:function(a,b){return b==="*"&&a.nodeType===1||!!a.nodeName&&a.nodeName.toLowerCase()===b},CLASS:function(a,b){return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>-1},ATTR:function(a,b){var c=b[1],d=m.attr?m.attr(a,c):o.attrHandle[c]?o.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c),e=d+"",f=b[2],g=b[4];return d==null?f==="!=":!f&&m.attr?d!=null:f==="="?e===g:f==="*="?e.indexOf(g)>=0:f==="~="?(" "+e+" ").indexOf(g)>=0:g?f==="!="?e!==g:f==="^="?e.indexOf(g)===0:f==="$="?e.substr(e.length-g.length)===g:f==="|="?e===g||e.substr(0,g.length+1)===g+"-":!1:e&&d!==!1},POS:function(a,b,c,d){var e=b[2],f=o.setFilters[e];if(f)return f(a,c,b,d)}}},p=o.match.POS,q=function(a,b){return"\\"+(b-0+1)};for(var r in o.match)o.match[r]=new RegExp(o.match[r].source+/(?![^\[]*\])(?![^\(]*\))/.source),o.leftMatch[r]=new RegExp(/(^(?:.|\r|\n)*?)/.source+o.match[r].source.replace(/\\(\d+)/g,q));o.match.globalPOS=p;var s=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{Array.prototype.slice.call(c.documentElement.childNodes,0)[0].nodeType}catch(t){s=function(a,b){var c=0,d=b||[];if(g.call(a)==="[object Array]")Array.prototype.push.apply(d,a);else if(typeof a.length=="number")for(var e=a.length;c<e;c++)d.push(a[c]);else for(;a[c];c++)d.push(a[c]);return d}}var u,v;c.documentElement.compareDocumentPosition?u=function(a,b){if(a===b){h=!0;return 0}if(!a.compareDocumentPosition||!b.compareDocumentPosition)return a.compareDocumentPosition?-1:1;return a.compareDocumentPosition(b)&4?-1:1}:(u=function(a,b){if(a===b){h=!0;return 0}if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;var c,d,e=[],f=[],g=a.parentNode,i=b.parentNode,j=g;if(g===i)return v(a,b);if(!g)return-1;if(!i)return 1;while(j)e.unshift(j),j=j.parentNode;j=i;while(j)f.unshift(j),j=j.parentNode;c=e.length,d=f.length;for(var k=0;k<c&&k<d;k++)if(e[k]!==f[k])return v(e[k],f[k]);return k===c?v(a,f[k],-1):v(e[k],b,1)},v=function(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}),function(){var a=c.createElement("div"),d="script"+(new Date).getTime(),e=c.documentElement;a.innerHTML="<a name='"+d+"'/>",e.insertBefore(a,e.firstChild),c.getElementById(d)&&(o.find.ID=function(a,c,d){if(typeof c.getElementById!="undefined"&&!d){var e=c.getElementById(a[1]);return e?e.id===a[1]||typeof e.getAttributeNode!="undefined"&&e.getAttributeNode("id").nodeValue===a[1]?[e]:b:[]}},o.filter.ID=function(a,b){var c=typeof a.getAttributeNode!="undefined"&&a.getAttributeNode("id");return a.nodeType===1&&c&&c.nodeValue===b}),e.removeChild(a),e=a=null}(),function(){var a=c.createElement("div");a.appendChild(c.createComment("")),a.getElementsByTagName("*").length>0&&(o.find.TAG=function(a,b){var c=b.getElementsByTagName(a[1]);if(a[1]==="*"){var d=[];for(var e=0;c[e];e++)c[e].nodeType===1&&d.push(c[e]);c=d}return c}),a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!="undefined"&&a.firstChild.getAttribute("href")!=="#"&&(o.attrHandle.href=function(a){return a.getAttribute("href",2)}),a=null}(),c.querySelectorAll&&function(){var a=m,b=c.createElement("div"),d="__sizzle__";b.innerHTML="<p class='TEST'></p>";if(!b.querySelectorAll||b.querySelectorAll(".TEST").length!==0){m=function(b,e,f,g){e=e||c;if(!g&&!m.isXML(e)){var h=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);if(h&&(e.nodeType===1||e.nodeType===9)){if(h[1])return s(e.getElementsByTagName(b),f);if(h[2]&&o.find.CLASS&&e.getElementsByClassName)return s(e.getElementsByClassName(h[2]),f)}if(e.nodeType===9){if(b==="body"&&e.body)return s([e.body],f);if(h&&h[3]){var i=e.getElementById(h[3]);if(!i||!i.parentNode)return s([],f);if(i.id===h[3])return s([i],f)}try{return s(e.querySelectorAll(b),f)}catch(j){}}else if(e.nodeType===1&&e.nodeName.toLowerCase()!=="object"){var k=e,l=e.getAttribute("id"),n=l||d,p=e.parentNode,q=/^\s*[+~]/.test(b);l?n=n.replace(/'/g,"\\$&"):e.setAttribute("id",n),q&&p&&(e=e.parentNode);try{if(!q||p)return s(e.querySelectorAll("[id='"+n+"'] "+b),f)}catch(r){}finally{l||k.removeAttribute("id")}}}return a(b,e,f,g)};for(var e in a)m[e]=a[e];b=null}}(),function(){var a=c.documentElement,b=a.matchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||a.msMatchesSelector;if(b){var d=!b.call(c.createElement("div"),"div"),e=!1;try{b.call(c.documentElement,"[test!='']:sizzle")}catch(f){e=!0}m.matchesSelector=function(a,c){c=c.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!m.isXML(a))try{if(e||!o.match.PSEUDO.test(c)&&!/!=/.test(c)){var f=b.call(a,c);if(f||!d||a.document&&a.document.nodeType!==11)return f}}catch(g){}return m(c,null,null,[a]).length>0}}}(),function(){var a=c.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";if(!!a.getElementsByClassName&&a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length===1)return;o.order.splice(1,0,"CLASS"),o.find.CLASS=function(a,b,c){if(typeof b.getElementsByClassName!="undefined"&&!c)return b.getElementsByClassName(a[1])},a=null}}(),c.documentElement.contains?m.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):!0)}:c.documentElement.compareDocumentPosition?m.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16)}:m.contains=function(){return!1},m.isXML=function(a){var b=(a?a.ownerDocument||a:0).documentElement;return b?b.nodeName!=="HTML":!1};var y=function(a,b,c){var d,e=[],f="",g=b.nodeType?[b]:b;while(d=o.match.PSEUDO.exec(a))f+=d[0],a=a.replace(o.match.PSEUDO,"");a=o.relative[a]?a+"*":a;for(var h=0,i=g.length;h<i;h++)m(a,g[h],e,c);return m.filter(f,e)};m.attr=f.attr,m.selectors.attrMap={},f.find=m,f.expr=m.selectors,f.expr[":"]=f.expr.filters,f.unique=m.uniqueSort,f.text=m.getText,f.isXMLDoc=m.isXML,f.contains=m.contains}();var L=/Until$/,M=/^(?:parents|prevUntil|prevAll)/,N=/,/,O=/^.[^:#\[\.,]*$/,P=Array.prototype.slice,Q=f.expr.match.globalPOS,R={children:!0,contents:!0,next:!0,prev:!0};f.fn.extend({find:function(a){var b=this,c,d;if(typeof a!="string")return f(a).filter(function(){for(c=0,d=b.length;c<d;c++)if(f.contains(b[c],this))return!0});var e=this.pushStack("","find",a),g,h,i;for(c=0,d=this.length;c<d;c++){g=e.length,f.find(a,this[c],e);if(c>0)for(h=g;h<e.length;h++)for(i=0;i<g;i++)if(e[i]===e[h]){e.splice(h--,1);break}}return e},has:function(a){var b=f(a);return this.filter(function(){for(var a=0,c=b.length;a<c;a++)if(f.contains(this,b[a]))return!0})},not:function(a){return this.pushStack(T(this,a,!1),"not",a)},filter:function(a){return this.pushStack(T(this,a,!0),"filter",a)},is:function(a){return!!a&&(typeof a=="string"?Q.test(a)?f(a,this.context).index(this[0])>=0:f.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var c=[],d,e,g=this[0];if(f.isArray(a)){var h=1;while(g&&g.ownerDocument&&g!==b){for(d=0;d<a.length;d++)f(g).is(a[d])&&c.push({selector:a[d],elem:g,level:h});g=g.parentNode,h++}return c}var i=Q.test(a)||typeof a!="string"?f(a,b||this.context):0;for(d=0,e=this.length;d<e;d++){g=this[d];while(g){if(i?i.index(g)>-1:f.find.matchesSelector(g,a)){c.push(g);break}g=g.parentNode;if(!g||!g.ownerDocument||g===b||g.nodeType===11)break}}c=c.length>1?f.unique(c):c;return this.pushStack(c,"closest",a)},index:function(a){if(!a)return this[0]&&this[0].parentNode?this.prevAll().length:-1;if(typeof a=="string")return f.inArray(this[0],f(a));return f.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var c=typeof a=="string"?f(a,b):f.makeArray(a&&a.nodeType?[a]:a),d=f.merge(this.get(),c);return this.pushStack(S(c[0])||S(d[0])?d:f.unique(d))},andSelf:function(){return this.add(this.prevObject)}}),f.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return f.dir(a,"parentNode")},parentsUntil:function(a,b,c){return f.dir(a,"parentNode",c)},next:function(a){return f.nth(a,2,"nextSibling")},prev:function(a){return f.nth(a,2,"previousSibling")},nextAll:function(a){return f.dir(a,"nextSibling")},prevAll:function(a){return f.dir(a,"previousSibling")},nextUntil:function(a,b,c){return f.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return f.dir(a,"previousSibling",c)},siblings:function(a){return f.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return f.sibling(a.firstChild)},contents:function(a){return f.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:f.makeArray(a.childNodes)}},function(a,b){f.fn[a]=function(c,d){var e=f.map(this,b,c);L.test(a)||(d=c),d&&typeof d=="string"&&(e=f.filter(d,e)),e=this.length>1&&!R[a]?f.unique(e):e,(this.length>1||N.test(d))&&M.test(a)&&(e=e.reverse());return this.pushStack(e,a,P.call(arguments).join(","))}}),f.extend({filter:function(a,b,c){c&&(a=":not("+a+")");return b.length===1?f.find.matchesSelector(b[0],a)?[b[0]]:[]:f.find.matches(a,b)},dir:function(a,c,d){var e=[],g=a[c];while(g&&g.nodeType!==9&&(d===b||g.nodeType!==1||!f(g).is(d)))g.nodeType===1&&e.push(g),g=g[c];return e},nth:function(a,b,c,d){b=b||1;var e=0;for(;a;a=a[c])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var V="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",W=/ jQuery\d+="(?:\d+|null)"/g,X=/^\s+/,Y=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,Z=/<([\w:]+)/,$=/<tbody/i,_=/<|&#?\w+;/,ba=/<(?:script|style)/i,bb=/<(?:script|object|embed|option|style)/i,bc=new RegExp("<(?:"+V+")[\\s/>]","i"),bd=/checked\s*(?:[^=]|=\s*.checked.)/i,be=/\/(java|ecma)script/i,bf=/^\s*<!(?:\[CDATA\[|\-\-)/,bg={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bh=U(c);bg.optgroup=bg.option,bg.tbody=bg.tfoot=bg.colgroup=bg.caption=bg.thead,bg.th=bg.td,f.support.htmlSerialize||(bg._default=[1,"div<div>","</div>"]),f.fn.extend({text:function(a){return f.access(this,function(a){return a===b?f.text(this):this.empty().append((this[0]&&this[0].ownerDocument||c).createTextNode(a))},null,a,arguments.length)},wrapAll:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapAll(a.call(this,b))});if(this[0]){var b=f(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapInner(a.call(this,b))});return this.each(function(){var b=f(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=f.isFunction(a);return this.each(function(c){f(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){f.nodeName(this,"body")||f(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=f
.clean(arguments);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,f.clean(arguments));return a}},remove:function(a,b){for(var c=0,d;(d=this[c])!=null;c++)if(!a||f.filter(a,[d]).length)!b&&d.nodeType===1&&(f.cleanData(d.getElementsByTagName("*")),f.cleanData([d])),d.parentNode&&d.parentNode.removeChild(d);return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++){b.nodeType===1&&f.cleanData(b.getElementsByTagName("*"));while(b.firstChild)b.removeChild(b.firstChild)}return this},clone:function(a,b){a=a==null?!1:a,b=b==null?a:b;return this.map(function(){return f.clone(this,a,b)})},html:function(a){return f.access(this,function(a){var c=this[0]||{},d=0,e=this.length;if(a===b)return c.nodeType===1?c.innerHTML.replace(W,""):null;if(typeof a=="string"&&!ba.test(a)&&(f.support.leadingWhitespace||!X.test(a))&&!bg[(Z.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Y,"<$1></$2>");try{for(;d<e;d++)c=this[d]||{},c.nodeType===1&&(f.cleanData(c.getElementsByTagName("*")),c.innerHTML=a);c=0}catch(g){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(f.isFunction(a))return this.each(function(b){var c=f(this),d=c.html();c.replaceWith(a.call(this,b,d))});typeof a!="string"&&(a=f(a).detach());return this.each(function(){var b=this.nextSibling,c=this.parentNode;f(this).remove(),b?f(b).before(a):f(c).append(a)})}return this.length?this.pushStack(f(f.isFunction(a)?a():a),"replaceWith",a):this},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){var e,g,h,i,j=a[0],k=[];if(!f.support.checkClone&&arguments.length===3&&typeof j=="string"&&bd.test(j))return this.each(function(){f(this).domManip(a,c,d,!0)});if(f.isFunction(j))return this.each(function(e){var g=f(this);a[0]=j.call(this,e,c?g.html():b),g.domManip(a,c,d)});if(this[0]){i=j&&j.parentNode,f.support.parentNode&&i&&i.nodeType===11&&i.childNodes.length===this.length?e={fragment:i}:e=f.buildFragment(a,this,k),h=e.fragment,h.childNodes.length===1?g=h=h.firstChild:g=h.firstChild;if(g){c=c&&f.nodeName(g,"tr");for(var l=0,m=this.length,n=m-1;l<m;l++)d.call(c?bi(this[l],g):this[l],e.cacheable||m>1&&l<n?f.clone(h,!0,!0):h)}k.length&&f.each(k,function(a,b){b.src?f.ajax({type:"GET",global:!1,url:b.src,async:!1,dataType:"script"}):f.globalEval((b.text||b.textContent||b.innerHTML||"").replace(bf,"/*$0*/")),b.parentNode&&b.parentNode.removeChild(b)})}return this}}),f.buildFragment=function(a,b,d){var e,g,h,i,j=a[0];b&&b[0]&&(i=b[0].ownerDocument||b[0]),i.createDocumentFragment||(i=c),a.length===1&&typeof j=="string"&&j.length<512&&i===c&&j.charAt(0)==="<"&&!bb.test(j)&&(f.support.checkClone||!bd.test(j))&&(f.support.html5Clone||!bc.test(j))&&(g=!0,h=f.fragments[j],h&&h!==1&&(e=h)),e||(e=i.createDocumentFragment(),f.clean(a,i,e,d)),g&&(f.fragments[j]=h?e:1);return{fragment:e,cacheable:g}},f.fragments={},f.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){f.fn[a]=function(c){var d=[],e=f(c),g=this.length===1&&this[0].parentNode;if(g&&g.nodeType===11&&g.childNodes.length===1&&e.length===1){e[b](this[0]);return this}for(var h=0,i=e.length;h<i;h++){var j=(h>0?this.clone(!0):this).get();f(e[h])[b](j),d=d.concat(j)}return this.pushStack(d,a,e.selector)}}),f.extend({clone:function(a,b,c){var d,e,g,h=f.support.html5Clone||f.isXMLDoc(a)||!bc.test("<"+a.nodeName+">")?a.cloneNode(!0):bo(a);if((!f.support.noCloneEvent||!f.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!f.isXMLDoc(a)){bk(a,h),d=bl(a),e=bl(h);for(g=0;d[g];++g)e[g]&&bk(d[g],e[g])}if(b){bj(a,h);if(c){d=bl(a),e=bl(h);for(g=0;d[g];++g)bj(d[g],e[g])}}d=e=null;return h},clean:function(a,b,d,e){var g,h,i,j=[];b=b||c,typeof b.createElement=="undefined"&&(b=b.ownerDocument||b[0]&&b[0].ownerDocument||c);for(var k=0,l;(l=a[k])!=null;k++){typeof l=="number"&&(l+="");if(!l)continue;if(typeof l=="string")if(!_.test(l))l=b.createTextNode(l);else{l=l.replace(Y,"<$1></$2>");var m=(Z.exec(l)||["",""])[1].toLowerCase(),n=bg[m]||bg._default,o=n[0],p=b.createElement("div"),q=bh.childNodes,r;b===c?bh.appendChild(p):U(b).appendChild(p),p.innerHTML=n[1]+l+n[2];while(o--)p=p.lastChild;if(!f.support.tbody){var s=$.test(l),t=m==="table"&&!s?p.firstChild&&p.firstChild.childNodes:n[1]==="<table>"&&!s?p.childNodes:[];for(i=t.length-1;i>=0;--i)f.nodeName(t[i],"tbody")&&!t[i].childNodes.length&&t[i].parentNode.removeChild(t[i])}!f.support.leadingWhitespace&&X.test(l)&&p.insertBefore(b.createTextNode(X.exec(l)[0]),p.firstChild),l=p.childNodes,p&&(p.parentNode.removeChild(p),q.length>0&&(r=q[q.length-1],r&&r.parentNode&&r.parentNode.removeChild(r)))}var u;if(!f.support.appendChecked)if(l[0]&&typeof (u=l.length)=="number")for(i=0;i<u;i++)bn(l[i]);else bn(l);l.nodeType?j.push(l):j=f.merge(j,l)}if(d){g=function(a){return!a.type||be.test(a.type)};for(k=0;j[k];k++){h=j[k];if(e&&f.nodeName(h,"script")&&(!h.type||be.test(h.type)))e.push(h.parentNode?h.parentNode.removeChild(h):h);else{if(h.nodeType===1){var v=f.grep(h.getElementsByTagName("script"),g);j.splice.apply(j,[k+1,0].concat(v))}d.appendChild(h)}}}return j},cleanData:function(a){var b,c,d=f.cache,e=f.event.special,g=f.support.deleteExpando;for(var h=0,i;(i=a[h])!=null;h++){if(i.nodeName&&f.noData[i.nodeName.toLowerCase()])continue;c=i[f.expando];if(c){b=d[c];if(b&&b.events){for(var j in b.events)e[j]?f.event.remove(i,j):f.removeEvent(i,j,b.handle);b.handle&&(b.handle.elem=null)}g?delete i[f.expando]:i.removeAttribute&&i.removeAttribute(f.expando),delete d[c]}}}});var bp=/alpha\([^)]*\)/i,bq=/opacity=([^)]*)/,br=/([A-Z]|^ms)/g,bs=/^[\-+]?(?:\d*\.)?\d+$/i,bt=/^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,bu=/^([\-+])=([\-+.\de]+)/,bv=/^margin/,bw={position:"absolute",visibility:"hidden",display:"block"},bx=["Top","Right","Bottom","Left"],by,bz,bA;f.fn.css=function(a,c){return f.access(this,function(a,c,d){return d!==b?f.style(a,c,d):f.css(a,c)},a,c,arguments.length>1)},f.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=by(a,"opacity");return c===""?"1":c}return a.style.opacity}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":f.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!!a&&a.nodeType!==3&&a.nodeType!==8&&!!a.style){var g,h,i=f.camelCase(c),j=a.style,k=f.cssHooks[i];c=f.cssProps[i]||i;if(d===b){if(k&&"get"in k&&(g=k.get(a,!1,e))!==b)return g;return j[c]}h=typeof d,h==="string"&&(g=bu.exec(d))&&(d=+(g[1]+1)*+g[2]+parseFloat(f.css(a,c)),h="number");if(d==null||h==="number"&&isNaN(d))return;h==="number"&&!f.cssNumber[i]&&(d+="px");if(!k||!("set"in k)||(d=k.set(a,d))!==b)try{j[c]=d}catch(l){}}},css:function(a,c,d){var e,g;c=f.camelCase(c),g=f.cssHooks[c],c=f.cssProps[c]||c,c==="cssFloat"&&(c="float");if(g&&"get"in g&&(e=g.get(a,!0,d))!==b)return e;if(by)return by(a,c)},swap:function(a,b,c){var d={},e,f;for(f in b)d[f]=a.style[f],a.style[f]=b[f];e=c.call(a);for(f in b)a.style[f]=d[f];return e}}),f.curCSS=f.css,c.defaultView&&c.defaultView.getComputedStyle&&(bz=function(a,b){var c,d,e,g,h=a.style;b=b.replace(br,"-$1").toLowerCase(),(d=a.ownerDocument.defaultView)&&(e=d.getComputedStyle(a,null))&&(c=e.getPropertyValue(b),c===""&&!f.contains(a.ownerDocument.documentElement,a)&&(c=f.style(a,b))),!f.support.pixelMargin&&e&&bv.test(b)&&bt.test(c)&&(g=h.width,h.width=c,c=e.width,h.width=g);return c}),c.documentElement.currentStyle&&(bA=function(a,b){var c,d,e,f=a.currentStyle&&a.currentStyle[b],g=a.style;f==null&&g&&(e=g[b])&&(f=e),bt.test(f)&&(c=g.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),g.left=b==="fontSize"?"1em":f,f=g.pixelLeft+"px",g.left=c,d&&(a.runtimeStyle.left=d));return f===""?"auto":f}),by=bz||bA,f.each(["height","width"],function(a,b){f.cssHooks[b]={get:function(a,c,d){if(c)return a.offsetWidth!==0?bB(a,b,d):f.swap(a,bw,function(){return bB(a,b,d)})},set:function(a,b){return bs.test(b)?b+"px":b}}}),f.support.opacity||(f.cssHooks.opacity={get:function(a,b){return bq.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=f.isNumeric(b)?"alpha(opacity="+b*100+")":"",g=d&&d.filter||c.filter||"";c.zoom=1;if(b>=1&&f.trim(g.replace(bp,""))===""){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bp.test(g)?g.replace(bp,e):g+" "+e}}),f(function(){f.support.reliableMarginRight||(f.cssHooks.marginRight={get:function(a,b){return f.swap(a,{display:"inline-block"},function(){return b?by(a,"margin-right"):a.style.marginRight})}})}),f.expr&&f.expr.filters&&(f.expr.filters.hidden=function(a){var b=a.offsetWidth,c=a.offsetHeight;return b===0&&c===0||!f.support.reliableHiddenOffsets&&(a.style&&a.style.display||f.css(a,"display"))==="none"},f.expr.filters.visible=function(a){return!f.expr.filters.hidden(a)}),f.each({margin:"",padding:"",border:"Width"},function(a,b){f.cssHooks[a+b]={expand:function(c){var d,e=typeof c=="string"?c.split(" "):[c],f={};for(d=0;d<4;d++)f[a+bx[d]+b]=e[d]||e[d-2]||e[0];return f}}});var bC=/%20/g,bD=/\[\]$/,bE=/\r?\n/g,bF=/#.*$/,bG=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,bH=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,bI=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,bJ=/^(?:GET|HEAD)$/,bK=/^\/\//,bL=/\?/,bM=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bN=/^(?:select|textarea)/i,bO=/\s+/,bP=/([?&])_=[^&]*/,bQ=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,bR=f.fn.load,bS={},bT={},bU,bV,bW=["*/"]+["*"];try{bU=e.href}catch(bX){bU=c.createElement("a"),bU.href="",bU=bU.href}bV=bQ.exec(bU.toLowerCase())||[],f.fn.extend({load:function(a,c,d){if(typeof a!="string"&&bR)return bR.apply(this,arguments);if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var g=a.slice(e,a.length);a=a.slice(0,e)}var h="GET";c&&(f.isFunction(c)?(d=c,c=b):typeof c=="object"&&(c=f.param(c,f.ajaxSettings.traditional),h="POST"));var i=this;f.ajax({url:a,type:h,dataType:"html",data:c,complete:function(a,b,c){c=a.responseText,a.isResolved()&&(a.done(function(a){c=a}),i.html(g?f("<div>").append(c.replace(bM,"")).find(g):c)),d&&i.each(d,[c,b,a])}});return this},serialize:function(){return f.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?f.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||bN.test(this.nodeName)||bH.test(this.type))}).map(function(a,b){var c=f(this).val();return c==null?null:f.isArray(c)?f.map(c,function(a,c){return{name:b.name,value:a.replace(bE,"\r\n")}}):{name:b.name,value:c.replace(bE,"\r\n")}}).get()}}),f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){f.fn[b]=function(a){return this.on(b,a)}}),f.each(["get","post"],function(a,c){f[c]=function(a,d,e,g){f.isFunction(d)&&(g=g||e,e=d,d=b);return f.ajax({type:c,url:a,data:d,success:e,dataType:g})}}),f.extend({getScript:function(a,c){return f.get(a,b,c,"script")},getJSON:function(a,b,c){return f.get(a,b,c,"json")},ajaxSetup:function(a,b){b?b$(a,f.ajaxSettings):(b=a,a=f.ajaxSettings),b$(a,b);return a},ajaxSettings:{url:bU,isLocal:bI.test(bV[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":bW},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":f.parseJSON,"text xml":f.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:bY(bS),ajaxTransport:bY(bT),ajax:function(a,c){function w(a,c,l,m){if(s!==2){s=2,q&&clearTimeout(q),p=b,n=m||"",v.readyState=a>0?4:0;var o,r,u,w=c,x=l?ca(d,v,l):b,y,z;if(a>=200&&a<300||a===304){if(d.ifModified){if(y=v.getResponseHeader("Last-Modified"))f.lastModified[k]=y;if(z=v.getResponseHeader("Etag"))f.etag[k]=z}if(a===304)w="notmodified",o=!0;else try{r=cb(d,x),w="success",o=!0}catch(A){w="parsererror",u=A}}else{u=w;if(!w||a)w="error",a<0&&(a=0)}v.status=a,v.statusText=""+(c||w),o?h.resolveWith(e,[r,w,v]):h.rejectWith(e,[v,w,u]),v.statusCode(j),j=b,t&&g.trigger("ajax"+(o?"Success":"Error"),[v,d,o?r:u]),i.fireWith(e,[v,w]),t&&(g.trigger("ajaxComplete",[v,d]),--f.active||f.event.trigger("ajaxStop"))}}typeof a=="object"&&(c=a,a=b),c=c||{};var d=f.ajaxSetup({},c),e=d.context||d,g=e!==d&&(e.nodeType||e instanceof f)?f(e):f.event,h=f.Deferred(),i=f.Callbacks("once memory"),j=d.statusCode||{},k,l={},m={},n,o,p,q,r,s=0,t,u,v={readyState:0,setRequestHeader:function(a,b){if(!s){var c=a.toLowerCase();a=m[c]=m[c]||a,l[a]=b}return this},getAllResponseHeaders:function(){return s===2?n:null},getResponseHeader:function(a){var c;if(s===2){if(!o){o={};while(c=bG.exec(n))o[c[1].toLowerCase()]=c[2]}c=o[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){s||(d.mimeType=a);return this},abort:function(a){a=a||"abort",p&&p.abort(a),w(0,a);return this}};h.promise(v),v.success=v.done,v.error=v.fail,v.complete=i.add,v.statusCode=function(a){if(a){var b;if(s<2)for(b in a)j[b]=[j[b],a[b]];else b=a[v.status],v.then(b,b)}return this},d.url=((a||d.url)+"").replace(bF,"").replace(bK,bV[1]+"//"),d.dataTypes=f.trim(d.dataType||"*").toLowerCase().split(bO),d.crossDomain==null&&(r=bQ.exec(d.url.toLowerCase()),d.crossDomain=!(!r||r[1]==bV[1]&&r[2]==bV[2]&&(r[3]||(r[1]==="http:"?80:443))==(bV[3]||(bV[1]==="http:"?80:443)))),d.data&&d.processData&&typeof d.data!="string"&&(d.data=f.param(d.data,d.traditional)),bZ(bS,d,c,v);if(s===2)return!1;t=d.global,d.type=d.type.toUpperCase(),d.hasContent=!bJ.test(d.type),t&&f.active++===0&&f.event.trigger("ajaxStart");if(!d.hasContent){d.data&&(d.url+=(bL.test(d.url)?"&":"?")+d.data,delete d.data),k=d.url;if(d.cache===!1){var x=f.now(),y=d.url.replace(bP,"$1_="+x);d.url=y+(y===d.url?(bL.test(d.url)?"&":"?")+"_="+x:"")}}(d.data&&d.hasContent&&d.contentType!==!1||c.contentType)&&v.setRequestHeader("Content-Type",d.contentType),d.ifModified&&(k=k||d.url,f.lastModified[k]&&v.setRequestHeader("If-Modified-Since",f.lastModified[k]),f.etag[k]&&v.setRequestHeader("If-None-Match",f.etag[k])),v.setRequestHeader("Accept",d.dataTypes[0]&&d.accepts[d.dataTypes[0]]?d.accepts[d.dataTypes[0]]+(d.dataTypes[0]!=="*"?", "+bW+"; q=0.01":""):d.accepts["*"]);for(u in d.headers)v.setRequestHeader(u,d.headers[u]);if(d.beforeSend&&(d.beforeSend.call(e,v,d)===!1||s===2)){v.abort();return!1}for(u in{success:1,error:1,complete:1})v[u](d[u]);p=bZ(bT,d,c,v);if(!p)w(-1,"No Transport");else{v.readyState=1,t&&g.trigger("ajaxSend",[v,d]),d.async&&d.timeout>0&&(q=setTimeout(function(){v.abort("timeout")},d.timeout));try{s=1,p.send(l,w)}catch(z){if(s<2)w(-1,z);else throw z}}return v},param:function(a,c){var d=[],e=function(a,b){b=f.isFunction(b)?b():b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=f.ajaxSettings.traditional);if(f.isArray(a)||a.jquery&&!f.isPlainObject(a))f.each(a,function(){e(this.name,this.value)});else for(var g in a)b_(g,a[g],c,e);return d.join("&").replace(bC,"+")}}),f.extend({active:0,lastModified:{},etag:{}});var cc=f.now(),cd=/(\=)\?(&|$)|\?\?/i;f.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return f.expando+"_"+cc++}}),f.ajaxPrefilter("json jsonp",function(b,c,d){var e=typeof b.data=="string"&&/^application\/x\-www\-form\-urlencoded/.test(b.contentType);if(b.dataTypes[0]==="jsonp"||b.jsonp!==!1&&(cd.test(b.url)||e&&cd.test(b.data))){var g,h=b.jsonpCallback=f.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,i=a[h],j=b.url,k=b.data,l="$1"+h+"$2";b.jsonp!==!1&&(j=j.replace(cd,l),b.url===j&&(e&&(k=k.replace(cd,l)),b.data===k&&(j+=(/\?/.test(j)?"&":"?")+b.jsonp+"="+h))),b.url=j,b.data=k,a[h]=function(a){g=[a]},d.always(function(){a[h]=i,g&&f.isFunction(i)&&a[h](g[0])}),b.converters["script json"]=function(){g||f.error(h+" was not called");return g[0]},b.dataTypes[0]="json";return"script"}}),f.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){f.globalEval(a);return a}}}),f.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),f.ajaxTransport("script",function(a){if(a.crossDomain){var d,e=c.head||c.getElementsByTagName("head")[0]||c.documentElement;return{send:function(f,g){d=c.createElement("script"),d.async="async",a.scriptCharset&&(d.charset=a.scriptCharset),d.src=a.url,d.onload=d.onreadystatechange=function(a,c){if(c||!d.readyState||/loaded|complete/.test(d.readyState))d.onload=d.onreadystatechange=null,e&&d.parentNode&&e.removeChild(d),d=b,c||g(200,"success")},e.insertBefore(d,e.firstChild)},abort:function(){d&&d.onload(0,1)}}}});var ce=a.ActiveXObject?function(){for(var a in cg)cg[a](0,1)}:!1,cf=0,cg;f.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&ch()||ci()}:ch,function(a){f.extend(f.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})}(f.ajaxSettings.xhr()),f.support.ajax&&f.ajaxTransport(function(c){if(!c.crossDomain||f.support.cors){var d;return{send:function(e,g){var h=c.xhr(),i,j;c.username?h.open(c.type,c.url,c.async,c.username,c.password):h.open(c.type,c.url,c.async);if(c.xhrFields)for(j in c.xhrFields)h[j]=c.xhrFields[j];c.mimeType&&h.overrideMimeType&&h.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(j in e)h.setRequestHeader(j,e[j])}catch(k){}h.send(c.hasContent&&c.data||null),d=function(a,e){var j,k,l,m,n;try{if(d&&(e||h.readyState===4)){d=b,i&&(h.onreadystatechange=f.noop,ce&&delete cg[i]);if(e)h.readyState!==4&&h.abort();else{j=h.status,l=h.getAllResponseHeaders(),m={},n=h.responseXML,n&&n.documentElement&&(m.xml=n);try{m.text=h.responseText}catch(a){}try{k=h.statusText}catch(o){k=""}!j&&c.isLocal&&!c.crossDomain?j=m.text?200:404:j===1223&&(j=204)}}}catch(p){e||g(-1,p)}m&&g(j,k,m,l)},!c.async||h.readyState===4?d():(i=++cf,ce&&(cg||(cg={},f(a).unload(ce)),cg[i]=d),h.onreadystatechange=d)},abort:function(){d&&d(0,1)}}}});var cj={},ck,cl,cm=/^(?:toggle|show|hide)$/,cn=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,co,cp=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],cq;f.fn.extend({show:function(a,b,c){var d,e;if(a||a===0)return this.animate(ct("show",3),a,b,c);for(var g=0,h=this.length;g<h;g++)d=this[g],d.style&&(e=d.style.display,!f._data(d,"olddisplay")&&e==="none"&&(e=d.style.display=""),(e===""&&f.css(d,"display")==="none"||!f.contains(d.ownerDocument.documentElement,d))&&f._data(d,"olddisplay",cu(d.nodeName)));for(g=0;g<h;g++){d=this[g];if(d.style){e=d.style.display;if(e===""||e==="none")d.style.display=f._data(d,"olddisplay")||""}}return this},hide:function(a,b,c){if(a||a===0)return this.animate(ct("hide",3),a,b,c);var d,e,g=0,h=this.length;for(;g<h;g++)d=this[g],d.style&&(e=f.css(d,"display"),e!=="none"&&!f._data(d,"olddisplay")&&f._data(d,"olddisplay",e));for(g=0;g<h;g++)this[g].style&&(this[g].style.display="none");return this},_toggle:f.fn.toggle,toggle:function(a,b,c){var d=typeof a=="boolean";f.isFunction(a)&&f.isFunction(b)?this._toggle.apply(this,arguments):a==null||d?this.each(function(){var b=d?a:f(this).is(":hidden");f(this)[b?"show":"hide"]()}):this.animate(ct("toggle",3),a,b,c);return this},fadeTo:function(a,b,c,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){function g(){e.queue===!1&&f._mark(this);var b=f.extend({},e),c=this.nodeType===1,d=c&&f(this).is(":hidden"),g,h,i,j,k,l,m,n,o,p,q;b.animatedProperties={};for(i in a){g=f.camelCase(i),i!==g&&(a[g]=a[i],delete a[i]);if((k=f.cssHooks[g])&&"expand"in k){l=k.expand(a[g]),delete a[g];for(i in l)i in a||(a[i]=l[i])}}for(g in a){h=a[g],f.isArray(h)?(b.animatedProperties[g]=h[1],h=a[g]=h[0]):b.animatedProperties[g]=b.specialEasing&&b.specialEasing[g]||b.easing||"swing";if(h==="hide"&&d||h==="show"&&!d)return b.complete.call(this);c&&(g==="height"||g==="width")&&(b.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY],f.css(this,"display")==="inline"&&f.css(this,"float")==="none"&&(!f.support.inlineBlockNeedsLayout||cu(this.nodeName)==="inline"?this.style.display="inline-block":this.style.zoom=1))}b.overflow!=null&&(this.style.overflow="hidden");for(i in a)j=new f.fx(this,b,i),h=a[i],cm.test(h)?(q=f._data(this,"toggle"+i)||(h==="toggle"?d?"show":"hide":0),q?(f._data(this,"toggle"+i,q==="show"?"hide":"show"),j[q]()):j[h]()):(m=cn.exec(h),n=j.cur(),m?(o=parseFloat(m[2]),p=m[3]||(f.cssNumber[i]?"":"px"),p!=="px"&&(f.style(this,i,(o||1)+p),n=(o||1)/j.cur()*n,f.style(this,i,n+p)),m[1]&&(o=(m[1]==="-="?-1:1)*o+n),j.custom(n,o,p)):j.custom(n,h,""));return!0}var e=f.speed(b,c,d);if(f.isEmptyObject(a))return this.each(e.complete,[!1]);a=f.extend({},a);return e.queue===!1?this.each(g):this.queue(e.queue,g)},stop:function(a,c,d){typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]);return this.each(function(){function h(a,b,c){var e=b[c];f.removeData(a,c,!0),e.stop(d)}var b,c=!1,e=f.timers,g=f._data(this);d||f._unmark(!0,this);if(a==null)for(b in g)g[b]&&g[b].stop&&b.indexOf(".run")===b.length-4&&h(this,g,b);else g[b=a+".run"]&&g[b].stop&&h(this,g,b);for(b=e.length;b--;)e[b].elem===this&&(a==null||e[b].queue===a)&&(d?e[b](!0):e[b].saveState(),c=!0,e.splice(b,1));(!d||!c)&&f.dequeue(this,a)})}}),f.each({slideDown:ct("show",1),slideUp:ct("hide",1),slideToggle:ct("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){f.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),f.extend({speed:function(a,b,c){var d=a&&typeof a=="object"?f.extend({},a):{complete:c||!c&&b||f.isFunction(a)&&a,duration:a,easing:c&&b||b&&!f.isFunction(b)&&b};d.duration=f.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in f.fx.speeds?f.fx.speeds[d.duration]:f.fx.speeds._default;if(d.queue==null||d.queue===!0)d.queue="fx";d.old=d.complete,d.complete=function(a){f.isFunction(d.old)&&d.old.call(this),d.queue?f.dequeue(this,d.queue):a!==!1&&f._unmark(this)};return d},easing:{linear:function(a){return a},swing:function(a){return-Math.cos(a*Math.PI)/2+.5}},timers:[],fx:function(a,b,c){this.options=b,this.elem=a,this.prop=c,b.orig=b.orig||{}}}),f.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),(f.fx.step[this.prop]||f.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a,b=f.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,c,d){function h(a){return e.step(a)}var e=this,g=f.fx;this.startTime=cq||cr(),this.end=c,this.now=this.start=a,this.pos=this.state=0,this.unit=d||this.unit||(f.cssNumber[this.prop]?"":"px"),h.queue=this.options.queue,h.elem=this.elem,h.saveState=function(){f._data(e.elem,"fxshow"+e.prop)===b&&(e.options.hide?f._data(e.elem,"fxshow"+e.prop,e.start):e.options.show&&f._data(e.elem,"fxshow"+e.prop,e.end))},h()&&f.timers.push(h)&&!co&&(co=setInterval(g.tick,g.interval))},show:function(){var a=f._data(this.elem,"fxshow"+this.prop);this.options.orig[this.prop]=a||f.style(this.elem,this.prop),this.options.show=!0,a!==b?this.custom(this.cur(),a):this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),f(this.elem).show()},hide:function(){this.options.orig[this.prop]=f._data(this.elem,"fxshow"+this.prop)||f.style(this.elem,this.prop),this.options.hide=!0,this.custom(this.cur(),0)},step:function(a){var b,c,d,e=cq||cr(),g=!0,h=this.elem,i=this.options;if(a||e>=i.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),i.animatedProperties[this.prop]=!0;for(b in i.animatedProperties)i.animatedProperties[b]!==!0&&(g=!1);if(g){i.overflow!=null&&!f.support.shrinkWrapBlocks&&f.each(["","X","Y"],function(a,b){h.style["overflow"+b]=i.overflow[a]}),i.hide&&f(h).hide();if(i.hide||i.show)for(b in i.animatedProperties)f.style(h,b,i.orig[b]),f.removeData(h,"fxshow"+b,!0),f.removeData(h,"toggle"+b,!0);d=i.complete,d&&(i.complete=!1,d.call(h))}return!1}i.duration==Infinity?this.now=e:(c=e-this.startTime,this.state=c/i.duration,this.pos=f.easing[i.animatedProperties[this.prop]](this.state,c,0,1,i.duration),this.now=this.start+(this.end-this.start)*this.pos),this.update();return!0}},f.extend(f.fx,{tick:function(){var a,b=f.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||f.fx.stop()},interval:13,stop:function(){clearInterval(co),co=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){f.style(a.elem,"opacity",a.now)},_default:function(a){a.elem.style&&a.elem.style[a.prop]!=null?a.elem.style[a.prop]=a.now+a.unit:a.elem[a.prop]=a.now}}}),f.each(cp.concat.apply([],cp),function(a,b){b.indexOf("margin")&&(f.fx.step[b]=function(a){f.style(a.elem,b,Math.max(0,a.now)+a.unit)})}),f.expr&&f.expr.filters&&(f.expr.filters.animated=function(a){return f.grep(f.timers,function(b){return a===b.elem}).length});var cv,cw=/^t(?:able|d|h)$/i,cx=/^(?:body|html)$/i;"getBoundingClientRect"in c.documentElement?cv=function(a,b,c,d){try{d=a.getBoundingClientRect()}catch(e){}if(!d||!f.contains(c,a))return d?{top:d.top,left:d.left}:{top:0,left:0};var g=b.body,h=cy(b),i=c.clientTop||g.clientTop||0,j=c.clientLeft||g.clientLeft||0,k=h.pageYOffset||f.support.boxModel&&c.scrollTop||g.scrollTop,l=h.pageXOffset||f.support.boxModel&&c.scrollLeft||g.scrollLeft,m=d.top+k-i,n=d.left+l-j;return{top:m,left:n}}:cv=function(a,b,c){var d,e=a.offsetParent,g=a,h=b.body,i=b.defaultView,j=i?i.getComputedStyle(a,null):a.currentStyle,k=a.offsetTop,l=a.offsetLeft;while((a=a.parentNode)&&a!==h&&a!==c){if(f.support.fixedPosition&&j.position==="fixed")break;d=i?i.getComputedStyle(a,null):a.currentStyle,k-=a.scrollTop,l-=a.scrollLeft,a===e&&(k+=a.offsetTop,l+=a.offsetLeft,f.support.doesNotAddBorder&&(!f.support.doesAddBorderForTableAndCells||!cw.test(a.nodeName))&&(k+=parseFloat(d.borderTopWidth)||0,l+=parseFloat(d.borderLeftWidth)||0),g=e,e=a.offsetParent),f.support.subtractsBorderForOverflowNotVisible&&d.overflow!=="visible"&&(k+=parseFloat(d.borderTopWidth)||0,l+=parseFloat(d.borderLeftWidth)||0),j=d}if(j.position==="relative"||j.position==="static")k+=h.offsetTop,l+=h.offsetLeft;f.support.fixedPosition&&j.position==="fixed"&&(k+=Math.max(c.scrollTop,h.scrollTop),l+=Math.max(c.scrollLeft,h.scrollLeft));return{top:k,left:l}},f.fn.offset=function(a){if(arguments.length)return a===b?this:this.each(function(b){f.offset.setOffset(this,a,b)});var c=this[0],d=c&&c.ownerDocument;if(!d)return null;if(c===d.body)return f.offset.bodyOffset(c);return cv(c,d,d.documentElement)},f.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;f.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(f.css(a,"marginTop"))||0,c+=parseFloat(f.css(a,"marginLeft"))||0);return{top:b,left:c}},setOffset:function(a,b,c){var d=f.css(a,"position");d==="static"&&(a.style.position="relative");var e=f(a),g=e.offset(),h=f.css(a,"top"),i=f.css(a,"left"),j=(d==="absolute"||d==="fixed")&&f.inArray("auto",[h,i])>-1,k={},l={},m,n;j?(l=e.position(),m=l.top,n=l.left):(m=parseFloat(h)||0,n=parseFloat(i)||0),f.isFunction(b)&&(b=b.call(a,c,g)),b.top!=null&&(k.top=b.top-g.top+m),b.left!=null&&(k.left=b.left-g.left+n),"using"in b?b.using.call(a,k):e.css(k)}},f.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),c=this.offset(),d=cx.test(b[0].nodeName)?{top:0,left:0}:b.offset();c.top-=parseFloat(f.css(a,"marginTop"))||0,c.left-=parseFloat(f.css(a,"marginLeft"))||0,d.top+=parseFloat(f.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(f.css(b[0],"borderLeftWidth"))||0;return{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||c.body;while(a&&!cx.test(a.nodeName)&&f.css(a,"position")==="static")a=a.offsetParent;return a})}}),f.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);f.fn[a]=function(e){return f.access(this,function(a,e,g){var h=cy(a);if(g===b)return h?c in h?h[c]:f.support.boxModel&&h.document.documentElement[e]||h.document.body[e]:a[e];h?h.scrollTo(d?f(h).scrollLeft():g,d?g:f(h).scrollTop()):a[e]=g},a,e,arguments.length,null)}}),f.each({Height:"height",Width:"width"},function(a,c){var d="client"+a,e="scroll"+a,g="offset"+a;f.fn["inner"+a]=function(){var a=this[0];return a?a.style?parseFloat(f.css(a,c,"padding")):this[c]():null},f.fn["outer"+a]=function(a){var b=this[0];return b?b.style?parseFloat(f.css(b,c,a?"margin":"border")):this[c]():null},f.fn[c]=function(a){return f.access(this,function(a,c,h){var i,j,k,l;if(f.isWindow(a)){i=a.document,j=i.documentElement[d];return f.support.boxModel&&j||i.body&&i.body[d]||j}if(a.nodeType===9){i=a.documentElement;if(i[d]>=i[e])return i[d];return Math.max(a.body[e],i[e],a.body[g],i[g])}if(h===b){k=f.css(a,c),l=parseFloat(k);return f.isNumeric(l)?l:k}f(a).css(c,h)},c,a,arguments.length,null)}}),a.jQuery=a.$=f,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return f})})(window);jQuery.noConflict();
/*!
 * jquery.base64.js 0.1 - https://github.com/yckart/jquery.base64.js
 * Makes Base64 en & -decoding simpler as it is.
 *
 * Based upon: https://gist.github.com/Yaffle/1284012
 *
 * Copyright (c) 2012 Yannick Albert (http://yckart.com)
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).
 * 2013/02/10
 **/
;(function($) {

    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        a256 = '',
        r64 = [256],
        r256 = [256],
        i = 0;

    var UTF8 = {

        /**
         * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
         * (BMP / basic multilingual plane only)
         *
         * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
         *
         * @param {String} strUni Unicode string to be encoded as UTF-8
         * @returns {String} encoded string
         */
        encode: function(strUni) {
            // use regular expressions & String.replace callback function for better efficiency
            // than procedural approaches
            var strUtf = strUni.replace(/[\u0080-\u07ff]/g, // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
            function(c) {
                var cc = c.charCodeAt(0);
                return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
            })
            .replace(/[\u0800-\uffff]/g, // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
            function(c) {
                var cc = c.charCodeAt(0);
                return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
            });
            return strUtf;
        },

        /**
         * Decode utf-8 encoded string back into multi-byte Unicode characters
         *
         * @param {String} strUtf UTF-8 string to be decoded back to Unicode
         * @returns {String} decoded string
         */
        decode: function(strUtf) {
            // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
            var strUni = strUtf.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, // 3-byte chars
            function(c) { // (note parentheses for precence)
                var cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
                return String.fromCharCode(cc);
            })
            .replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, // 2-byte chars
            function(c) { // (note parentheses for precence)
                var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
                return String.fromCharCode(cc);
            });
            return strUni;
        }
    };

    while(i < 256) {
        var c = String.fromCharCode(i);
        a256 += c;
        r256[i] = i;
        r64[i] = b64.indexOf(c);
        ++i;
    }

    function code(s, discard, alpha, beta, w1, w2) {
        s = String(s);
        var buffer = 0,
            i = 0,
            length = s.length,
            result = '',
            bitsInBuffer = 0;

        while(i < length) {
            var c = s.charCodeAt(i);
            c = c < 256 ? alpha[c] : -1;

            buffer = (buffer << w1) + c;
            bitsInBuffer += w1;

            while(bitsInBuffer >= w2) {
                bitsInBuffer -= w2;
                var tmp = buffer >> bitsInBuffer;
                result += beta.charAt(tmp);
                buffer ^= tmp << bitsInBuffer;
            }
            ++i;
        }
        if(!discard && bitsInBuffer > 0) result += beta.charAt(buffer << (w2 - bitsInBuffer));
        return result;
    }

    var Plugin = $.base64 = function(dir, input, encode) {
            return input ? Plugin[dir](input, encode) : dir ? null : this;
        };

    Plugin.btoa = Plugin.encode = function(plain, utf8encode) {
        plain = Plugin.raw === false || Plugin.utf8encode || utf8encode ? UTF8.encode(plain) : plain;
        plain = code(plain, false, r256, b64, 8, 6);
        return plain + '===='.slice((plain.length % 4) || 4);
    };

    Plugin.atob = Plugin.decode = function(coded, utf8decode) {
        coded = String(coded).split('=');
        var i = coded.length;
        do {--i;
            coded[i] = code(coded[i], true, r64, a256, 6, 8);
        } while (i > 0);
        coded = coded.join('');
        return Plugin.raw === false || Plugin.utf8decode || utf8decode ? UTF8.decode(coded) : coded;
    };
}(jQuery));
/*! jQuery UI - v1.9.2 - 2013-06-26
* http://jqueryui.com
* Includes: jquery.ui.core.js, jquery.ui.widget.js, jquery.ui.position.js, jquery.ui.tooltip.js
* Copyright 2013 jQuery Foundation and other contributors Licensed MIT */

;(function(e,t){function i(t,n){var r,i,o,u=t.nodeName.toLowerCase();return"area"===u?(r=t.parentNode,i=r.name,!t.href||!i||r.nodeName.toLowerCase()!=="map"?!1:(o=e("img[usemap=#"+i+"]")[0],!!o&&s(o))):(/input|select|textarea|button|object/.test(u)?!t.disabled:"a"===u?t.href||n:n)&&s(t)}function s(t){return e.expr.filters.visible(t)&&!e(t).parents().andSelf().filter(function(){return e.css(this,"visibility")==="hidden"}).length}var n=0,r=/^ui-id-\d+$/;e.ui=e.ui||{};if(e.ui.version)return;e.extend(e.ui,{version:"1.9.2",keyCode:{BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38}}),e.fn.extend({_focus:e.fn.focus,focus:function(t,n){return typeof t=="number"?this.each(function(){var r=this;setTimeout(function(){e(r).focus(),n&&n.call(r)},t)}):this._focus.apply(this,arguments)},scrollParent:function(){var t;return e.ui.ie&&/(static|relative)/.test(this.css("position"))||/absolute/.test(this.css("position"))?t=this.parents().filter(function(){return/(relative|absolute|fixed)/.test(e.css(this,"position"))&&/(auto|scroll)/.test(e.css(this,"overflow")+e.css(this,"overflow-y")+e.css(this,"overflow-x"))}).eq(0):t=this.parents().filter(function(){return/(auto|scroll)/.test(e.css(this,"overflow")+e.css(this,"overflow-y")+e.css(this,"overflow-x"))}).eq(0),/fixed/.test(this.css("position"))||!t.length?e(document):t},zIndex:function(n){if(n!==t)return this.css("zIndex",n);if(this.length){var r=e(this[0]),i,s;while(r.length&&r[0]!==document){i=r.css("position");if(i==="absolute"||i==="relative"||i==="fixed"){s=parseInt(r.css("zIndex"),10);if(!isNaN(s)&&s!==0)return s}r=r.parent()}}return 0},uniqueId:function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++n)})},removeUniqueId:function(){return this.each(function(){r.test(this.id)&&e(this).removeAttr("id")})}}),e.extend(e.expr[":"],{data:e.expr.createPseudo?e.expr.createPseudo(function(t){return function(n){return!!e.data(n,t)}}):function(t,n,r){return!!e.data(t,r[3])},focusable:function(t){return i(t,!isNaN(e.attr(t,"tabindex")))},tabbable:function(t){var n=e.attr(t,"tabindex"),r=isNaN(n);return(r||n>=0)&&i(t,!r)}}),e(function(){var t=document.body,n=t.appendChild(n=document.createElement("div"));n.offsetHeight,e.extend(n.style,{minHeight:"100px",height:"auto",padding:0,borderWidth:0}),e.support.minHeight=n.offsetHeight===100,e.support.selectstart="onselectstart"in n,t.removeChild(n).style.display="none"}),e("<a>").outerWidth(1).jquery||e.each(["Width","Height"],function(n,r){function u(t,n,r,s){return e.each(i,function(){n-=parseFloat(e.css(t,"padding"+this))||0,r&&(n-=parseFloat(e.css(t,"border"+this+"Width"))||0),s&&(n-=parseFloat(e.css(t,"margin"+this))||0)}),n}var i=r==="Width"?["Left","Right"]:["Top","Bottom"],s=r.toLowerCase(),o={innerWidth:e.fn.innerWidth,innerHeight:e.fn.innerHeight,outerWidth:e.fn.outerWidth,outerHeight:e.fn.outerHeight};e.fn["inner"+r]=function(n){return n===t?o["inner"+r].call(this):this.each(function(){e(this).css(s,u(this,n)+"px")})},e.fn["outer"+r]=function(t,n){return typeof t!="number"?o["outer"+r].call(this,t):this.each(function(){e(this).css(s,u(this,t,!0,n)+"px")})}}),e("<a>").data("a-b","a").removeData("a-b").data("a-b")&&(e.fn.removeData=function(t){return function(n){return arguments.length?t.call(this,e.camelCase(n)):t.call(this)}}(e.fn.removeData)),function(){var t=/msie ([\w.]+)/.exec(navigator.userAgent.toLowerCase())||[];e.ui.ie=t.length?!0:!1,e.ui.ie6=parseFloat(t[1],10)===6}(),e.fn.extend({disableSelection:function(){return this.bind((e.support.selectstart?"selectstart":"mousedown")+".ui-disableSelection",function(e){e.preventDefault()})},enableSelection:function(){return this.unbind(".ui-disableSelection")}}),e.extend(e.ui,{plugin:{add:function(t,n,r){var i,s=e.ui[t].prototype;for(i in r)s.plugins[i]=s.plugins[i]||[],s.plugins[i].push([n,r[i]])},call:function(e,t,n){var r,i=e.plugins[t];if(!i||!e.element[0].parentNode||e.element[0].parentNode.nodeType===11)return;for(r=0;r<i.length;r++)e.options[i[r][0]]&&i[r][1].apply(e.element,n)}},contains:e.contains,hasScroll:function(t,n){if(e(t).css("overflow")==="hidden")return!1;var r=n&&n==="left"?"scrollLeft":"scrollTop",i=!1;return t[r]>0?!0:(t[r]=1,i=t[r]>0,t[r]=0,i)},isOverAxis:function(e,t,n){return e>t&&e<t+n},isOver:function(t,n,r,i,s,o){return e.ui.isOverAxis(t,r,s)&&e.ui.isOverAxis(n,i,o)}})})(jQuery);(function(e,t){var n=0,r=Array.prototype.slice,i=e.cleanData;e.cleanData=function(t){for(var n=0,r;(r=t[n])!=null;n++)try{e(r).triggerHandler("remove")}catch(s){}i(t)},e.widget=function(t,n,r){var i,s,o,u,a=t.split(".")[0];t=t.split(".")[1],i=a+"-"+t,r||(r=n,n=e.Widget),e.expr[":"][i.toLowerCase()]=function(t){return!!e.data(t,i)},e[a]=e[a]||{},s=e[a][t],o=e[a][t]=function(e,t){if(!this._createWidget)return new o(e,t);arguments.length&&this._createWidget(e,t)},e.extend(o,s,{version:r.version,_proto:e.extend({},r),_childConstructors:[]}),u=new n,u.options=e.widget.extend({},u.options),e.each(r,function(t,i){e.isFunction(i)&&(r[t]=function(){var e=function(){return n.prototype[t].apply(this,arguments)},r=function(e){return n.prototype[t].apply(this,e)};return function(){var t=this._super,n=this._superApply,s;return this._super=e,this._superApply=r,s=i.apply(this,arguments),this._super=t,this._superApply=n,s}}())}),o.prototype=e.widget.extend(u,{widgetEventPrefix:s?u.widgetEventPrefix:t},r,{constructor:o,namespace:a,widgetName:t,widgetBaseClass:i,widgetFullName:i}),s?(e.each(s._childConstructors,function(t,n){var r=n.prototype;e.widget(r.namespace+"."+r.widgetName,o,n._proto)}),delete s._childConstructors):n._childConstructors.push(o),e.widget.bridge(t,o)},e.widget.extend=function(n){var i=r.call(arguments,1),s=0,o=i.length,u,a;for(;s<o;s++)for(u in i[s])a=i[s][u],i[s].hasOwnProperty(u)&&a!==t&&(e.isPlainObject(a)?n[u]=e.isPlainObject(n[u])?e.widget.extend({},n[u],a):e.widget.extend({},a):n[u]=a);return n},e.widget.bridge=function(n,i){var s=i.prototype.widgetFullName||n;e.fn[n]=function(o){var u=typeof o=="string",a=r.call(arguments,1),f=this;return o=!u&&a.length?e.widget.extend.apply(null,[o].concat(a)):o,u?this.each(function(){var r,i=e.data(this,s);if(!i)return e.error("cannot call methods on "+n+" prior to initialization; "+"attempted to call method '"+o+"'");if(!e.isFunction(i[o])||o.charAt(0)==="_")return e.error("no such method '"+o+"' for "+n+" widget instance");r=i[o].apply(i,a);if(r!==i&&r!==t)return f=r&&r.jquery?f.pushStack(r.get()):r,!1}):this.each(function(){var t=e.data(this,s);t?t.option(o||{})._init():e.data(this,s,new i(o,this))}),f}},e.Widget=function(){},e.Widget._childConstructors=[],e.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{disabled:!1,create:null},_createWidget:function(t,r){r=e(r||this.defaultElement||this)[0],this.element=e(r),this.uuid=n++,this.eventNamespace="."+this.widgetName+this.uuid,this.options=e.widget.extend({},this.options,this._getCreateOptions(),t),this.bindings=e(),this.hoverable=e(),this.focusable=e(),r!==this&&(e.data(r,this.widgetName,this),e.data(r,this.widgetFullName,this),this._on(!0,this.element,{remove:function(e){e.target===r&&this.destroy()}}),this.document=e(r.style?r.ownerDocument:r.document||r),this.window=e(this.document[0].defaultView||this.document[0].parentWindow)),this._create(),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:e.noop,_getCreateEventData:e.noop,_create:e.noop,_init:e.noop,destroy:function(){this._destroy(),this.element.unbind(this.eventNamespace).removeData(this.widgetName).removeData(this.widgetFullName).removeData(e.camelCase(this.widgetFullName)),this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName+"-disabled "+"ui-state-disabled"),this.bindings.unbind(this.eventNamespace),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")},_destroy:e.noop,widget:function(){return this.element},option:function(n,r){var i=n,s,o,u;if(arguments.length===0)return e.widget.extend({},this.options);if(typeof n=="string"){i={},s=n.split("."),n=s.shift();if(s.length){o=i[n]=e.widget.extend({},this.options[n]);for(u=0;u<s.length-1;u++)o[s[u]]=o[s[u]]||{},o=o[s[u]];n=s.pop();if(r===t)return o[n]===t?null:o[n];o[n]=r}else{if(r===t)return this.options[n]===t?null:this.options[n];i[n]=r}}return this._setOptions(i),this},_setOptions:function(e){var t;for(t in e)this._setOption(t,e[t]);return this},_setOption:function(e,t){return this.options[e]=t,e==="disabled"&&(this.widget().toggleClass(this.widgetFullName+"-disabled ui-state-disabled",!!t).attr("aria-disabled",t),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")),this},enable:function(){return this._setOption("disabled",!1)},disable:function(){return this._setOption("disabled",!0)},_on:function(t,n,r){var i,s=this;typeof t!="boolean"&&(r=n,n=t,t=!1),r?(n=i=e(n),this.bindings=this.bindings.add(n)):(r=n,n=this.element,i=this.widget()),e.each(r,function(r,o){function u(){if(!t&&(s.options.disabled===!0||e(this).hasClass("ui-state-disabled")))return;return(typeof o=="string"?s[o]:o).apply(s,arguments)}typeof o!="string"&&(u.guid=o.guid=o.guid||u.guid||e.guid++);var a=r.match(/^(\w+)\s*(.*)$/),f=a[1]+s.eventNamespace,l=a[2];l?i.delegate(l,f,u):n.bind(f,u)})},_off:function(e,t){t=(t||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,e.unbind(t).undelegate(t)},_delay:function(e,t){function n(){return(typeof e=="string"?r[e]:e).apply(r,arguments)}var r=this;return setTimeout(n,t||0)},_hoverable:function(t){this.hoverable=this.hoverable.add(t),this._on(t,{mouseenter:function(t){e(t.currentTarget).addClass("ui-state-hover")},mouseleave:function(t){e(t.currentTarget).removeClass("ui-state-hover")}})},_focusable:function(t){this.focusable=this.focusable.add(t),this._on(t,{focusin:function(t){e(t.currentTarget).addClass("ui-state-focus")},focusout:function(t){e(t.currentTarget).removeClass("ui-state-focus")}})},_trigger:function(t,n,r){var i,s,o=this.options[t];r=r||{},n=e.Event(n),n.type=(t===this.widgetEventPrefix?t:this.widgetEventPrefix+t).toLowerCase(),n.target=this.element[0],s=n.originalEvent;if(s)for(i in s)i in n||(n[i]=s[i]);return this.element.trigger(n,r),!(e.isFunction(o)&&o.apply(this.element[0],[n].concat(r))===!1||n.isDefaultPrevented())}},e.each({show:"fadeIn",hide:"fadeOut"},function(t,n){e.Widget.prototype["_"+t]=function(r,i,s){typeof i=="string"&&(i={effect:i});var o,u=i?i===!0||typeof i=="number"?n:i.effect||n:t;i=i||{},typeof i=="number"&&(i={duration:i}),o=!e.isEmptyObject(i),i.complete=s,i.delay&&r.delay(i.delay),o&&e.effects&&(e.effects.effect[u]||e.uiBackCompat!==!1&&e.effects[u])?r[t](i):u!==t&&r[u]?r[u](i.duration,i.easing,s):r.queue(function(n){e(this)[t](),s&&s.call(r[0]),n()})}}),e.uiBackCompat!==!1&&(e.Widget.prototype._getCreateOptions=function(){return e.metadata&&e.metadata.get(this.element[0])[this.widgetName]})})(jQuery);(function(e,t){function h(e,t,n){return[parseInt(e[0],10)*(l.test(e[0])?t/100:1),parseInt(e[1],10)*(l.test(e[1])?n/100:1)]}function p(t,n){return parseInt(e.css(t,n),10)||0}e.ui=e.ui||{};var n,r=Math.max,i=Math.abs,s=Math.round,o=/left|center|right/,u=/top|center|bottom/,a=/[\+\-]\d+%?/,f=/^\w+/,l=/%$/,c=e.fn.position;e.position={scrollbarWidth:function(){if(n!==t)return n;var r,i,s=e("<div style='display:block;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>"),o=s.children()[0];return e("body").append(s),r=o.offsetWidth,s.css("overflow","scroll"),i=o.offsetWidth,r===i&&(i=s[0].clientWidth),s.remove(),n=r-i},getScrollInfo:function(t){var n=t.isWindow?"":t.element.css("overflow-x"),r=t.isWindow?"":t.element.css("overflow-y"),i=n==="scroll"||n==="auto"&&t.width<t.element[0].scrollWidth,s=r==="scroll"||r==="auto"&&t.height<t.element[0].scrollHeight;return{width:i?e.position.scrollbarWidth():0,height:s?e.position.scrollbarWidth():0}},getWithinInfo:function(t){var n=e(t||window),r=e.isWindow(n[0]);return{element:n,isWindow:r,offset:n.offset()||{left:0,top:0},scrollLeft:n.scrollLeft(),scrollTop:n.scrollTop(),width:r?n.width():n.outerWidth(),height:r?n.height():n.outerHeight()}}},e.fn.position=function(t){if(!t||!t.of)return c.apply(this,arguments);t=e.extend({},t);var n,l,d,v,m,g=e(t.of),y=e.position.getWithinInfo(t.within),b=e.position.getScrollInfo(y),w=g[0],E=(t.collision||"flip").split(" "),S={};return w.nodeType===9?(l=g.width(),d=g.height(),v={top:0,left:0}):e.isWindow(w)?(l=g.width(),d=g.height(),v={top:g.scrollTop(),left:g.scrollLeft()}):w.preventDefault?(t.at="left top",l=d=0,v={top:w.pageY,left:w.pageX}):(l=g.outerWidth(),d=g.outerHeight(),v=g.offset()),m=e.extend({},v),e.each(["my","at"],function(){var e=(t[this]||"").split(" "),n,r;e.length===1&&(e=o.test(e[0])?e.concat(["center"]):u.test(e[0])?["center"].concat(e):["center","center"]),e[0]=o.test(e[0])?e[0]:"center",e[1]=u.test(e[1])?e[1]:"center",n=a.exec(e[0]),r=a.exec(e[1]),S[this]=[n?n[0]:0,r?r[0]:0],t[this]=[f.exec(e[0])[0],f.exec(e[1])[0]]}),E.length===1&&(E[1]=E[0]),t.at[0]==="right"?m.left+=l:t.at[0]==="center"&&(m.left+=l/2),t.at[1]==="bottom"?m.top+=d:t.at[1]==="center"&&(m.top+=d/2),n=h(S.at,l,d),m.left+=n[0],m.top+=n[1],this.each(function(){var o,u,a=e(this),f=a.outerWidth(),c=a.outerHeight(),w=p(this,"marginLeft"),x=p(this,"marginTop"),T=f+w+p(this,"marginRight")+b.width,N=c+x+p(this,"marginBottom")+b.height,C=e.extend({},m),k=h(S.my,a.outerWidth(),a.outerHeight());t.my[0]==="right"?C.left-=f:t.my[0]==="center"&&(C.left-=f/2),t.my[1]==="bottom"?C.top-=c:t.my[1]==="center"&&(C.top-=c/2),C.left+=k[0],C.top+=k[1],e.support.offsetFractions||(C.left=s(C.left),C.top=s(C.top)),o={marginLeft:w,marginTop:x},e.each(["left","top"],function(r,i){e.ui.position[E[r]]&&e.ui.position[E[r]][i](C,{targetWidth:l,targetHeight:d,elemWidth:f,elemHeight:c,collisionPosition:o,collisionWidth:T,collisionHeight:N,offset:[n[0]+k[0],n[1]+k[1]],my:t.my,at:t.at,within:y,elem:a})}),e.fn.bgiframe&&a.bgiframe(),t.using&&(u=function(e){var n=v.left-C.left,s=n+l-f,o=v.top-C.top,u=o+d-c,h={target:{element:g,left:v.left,top:v.top,width:l,height:d},element:{element:a,left:C.left,top:C.top,width:f,height:c},horizontal:s<0?"left":n>0?"right":"center",vertical:u<0?"top":o>0?"bottom":"middle"};l<f&&i(n+s)<l&&(h.horizontal="center"),d<c&&i(o+u)<d&&(h.vertical="middle"),r(i(n),i(s))>r(i(o),i(u))?h.important="horizontal":h.important="vertical",t.using.call(this,e,h)}),a.offset(e.extend(C,{using:u}))})},e.ui.position={fit:{left:function(e,t){var n=t.within,i=n.isWindow?n.scrollLeft:n.offset.left,s=n.width,o=e.left-t.collisionPosition.marginLeft,u=i-o,a=o+t.collisionWidth-s-i,f;t.collisionWidth>s?u>0&&a<=0?(f=e.left+u+t.collisionWidth-s-i,e.left+=u-f):a>0&&u<=0?e.left=i:u>a?e.left=i+s-t.collisionWidth:e.left=i:u>0?e.left+=u:a>0?e.left-=a:e.left=r(e.left-o,e.left)},top:function(e,t){var n=t.within,i=n.isWindow?n.scrollTop:n.offset.top,s=t.within.height,o=e.top-t.collisionPosition.marginTop,u=i-o,a=o+t.collisionHeight-s-i,f;t.collisionHeight>s?u>0&&a<=0?(f=e.top+u+t.collisionHeight-s-i,e.top+=u-f):a>0&&u<=0?e.top=i:u>a?e.top=i+s-t.collisionHeight:e.top=i:u>0?e.top+=u:a>0?e.top-=a:e.top=r(e.top-o,e.top)}},flip:{left:function(e,t){var n=t.within,r=n.offset.left+n.scrollLeft,s=n.width,o=n.isWindow?n.scrollLeft:n.offset.left,u=e.left-t.collisionPosition.marginLeft,a=u-o,f=u+t.collisionWidth-s-o,l=t.my[0]==="left"?-t.elemWidth:t.my[0]==="right"?t.elemWidth:0,c=t.at[0]==="left"?t.targetWidth:t.at[0]==="right"?-t.targetWidth:0,h=-2*t.offset[0],p,d;if(a<0){p=e.left+l+c+h+t.collisionWidth-s-r;if(p<0||p<i(a))e.left+=l+c+h}else if(f>0){d=e.left-t.collisionPosition.marginLeft+l+c+h-o;if(d>0||i(d)<f)e.left+=l+c+h}},top:function(e,t){var n=t.within,r=n.offset.top+n.scrollTop,s=n.height,o=n.isWindow?n.scrollTop:n.offset.top,u=e.top-t.collisionPosition.marginTop,a=u-o,f=u+t.collisionHeight-s-o,l=t.my[1]==="top",c=l?-t.elemHeight:t.my[1]==="bottom"?t.elemHeight:0,h=t.at[1]==="top"?t.targetHeight:t.at[1]==="bottom"?-t.targetHeight:0,p=-2*t.offset[1],d,v;a<0?(v=e.top+c+h+p+t.collisionHeight-s-r,e.top+c+h+p>a&&(v<0||v<i(a))&&(e.top+=c+h+p)):f>0&&(d=e.top-t.collisionPosition.marginTop+c+h+p-o,e.top+c+h+p>f&&(d>0||i(d)<f)&&(e.top+=c+h+p))}},flipfit:{left:function(){e.ui.position.flip.left.apply(this,arguments),e.ui.position.fit.left.apply(this,arguments)},top:function(){e.ui.position.flip.top.apply(this,arguments),e.ui.position.fit.top.apply(this,arguments)}}},function(){var t,n,r,i,s,o=document.getElementsByTagName("body")[0],u=document.createElement("div");t=document.createElement(o?"div":"body"),r={visibility:"hidden",width:0,height:0,border:0,margin:0,background:"none"},o&&e.extend(r,{position:"absolute",left:"-1000px",top:"-1000px"});for(s in r)t.style[s]=r[s];t.appendChild(u),n=o||document.documentElement,n.insertBefore(t,n.firstChild),u.style.cssText="position: absolute; left: 10.7432222px;",i=e(u).offset().left,e.support.offsetFractions=i>10&&i<11,t.innerHTML="",n.removeChild(t)}(),e.uiBackCompat!==!1&&function(e){var n=e.fn.position;e.fn.position=function(r){if(!r||!r.offset)return n.call(this,r);var i=r.offset.split(" "),s=r.at.split(" ");return i.length===1&&(i[1]=i[0]),/^\d/.test(i[0])&&(i[0]="+"+i[0]),/^\d/.test(i[1])&&(i[1]="+"+i[1]),s.length===1&&(/left|center|right/.test(s[0])?s[1]="center":(s[1]=s[0],s[0]="center")),n.call(this,e.extend(r,{at:s[0]+i[0]+" "+s[1]+i[1],offset:t}))}}(jQuery)})(jQuery);(function(e){function n(t,n){var r=(t.attr("aria-describedby")||"").split(/\s+/);r.push(n),t.data("ui-tooltip-id",n).attr("aria-describedby",e.trim(r.join(" ")))}function r(t){var n=t.data("ui-tooltip-id"),r=(t.attr("aria-describedby")||"").split(/\s+/),i=e.inArray(n,r);i!==-1&&r.splice(i,1),t.removeData("ui-tooltip-id"),r=e.trim(r.join(" ")),r?t.attr("aria-describedby",r):t.removeAttr("aria-describedby")}var t=0;e.widget("ui.tooltip",{version:"1.9.2",options:{content:function(){return e(this).attr("title")},hide:!0,items:"[title]:not([disabled])",position:{my:"left top+15",at:"left bottom",collision:"flipfit flip"},show:!0,tooltipClass:null,track:!1,close:null,open:null},_create:function(){this._on({mouseover:"open",focusin:"open"}),this.tooltips={},this.parents={},this.options.disabled&&this._disable()},_setOption:function(t,n){var r=this;if(t==="disabled"){this[n?"_disable":"_enable"](),this.options[t]=n;return}this._super(t,n),t==="content"&&e.each(this.tooltips,function(e,t){r._updateContent(t)})},_disable:function(){var t=this;e.each(this.tooltips,function(n,r){var i=e.Event("blur");i.target=i.currentTarget=r[0],t.close(i,!0)}),this.element.find(this.options.items).andSelf().each(function(){var t=e(this);t.is("[title]")&&t.data("ui-tooltip-title",t.attr("title")).attr("title","")})},_enable:function(){this.element.find(this.options.items).andSelf().each(function(){var t=e(this);t.data("ui-tooltip-title")&&t.attr("title",t.data("ui-tooltip-title"))})},open:function(t){var n=this,r=e(t?t.target:this.element).closest(this.options.items);if(!r.length||r.data("ui-tooltip-id"))return;r.attr("title")&&r.data("ui-tooltip-title",r.attr("title")),r.data("ui-tooltip-open",!0),t&&t.type==="mouseover"&&r.parents().each(function(){var t=e(this),r;t.data("ui-tooltip-open")&&(r=e.Event("blur"),r.target=r.currentTarget=this,n.close(r,!0)),t.attr("title")&&(t.uniqueId(),n.parents[this.id]={element:this,title:t.attr("title")},t.attr("title",""))}),this._updateContent(r,t)},_updateContent:function(e,t){var n,r=this.options.content,i=this,s=t?t.type:null;if(typeof r=="string")return this._open(t,e,r);n=r.call(e[0],function(n){if(!e.data("ui-tooltip-open"))return;i._delay(function(){t&&(t.type=s),this._open(t,e,n)})}),n&&this._open(t,e,n)},_open:function(t,r,i){function f(e){a.of=e;if(s.is(":hidden"))return;s.position(a)}var s,o,u,a=e.extend({},this.options.position);if(!i)return;s=this._find(r);if(s.length){s.find(".ui-tooltip-content").html(i);return}r.is("[title]")&&(t&&t.type==="mouseover"?r.attr("title",""):r.removeAttr("title")),s=this._tooltip(r),n(r,s.attr("id")),s.find(".ui-tooltip-content").html(i),this.options.track&&t&&/^mouse/.test(t.type)?(this._on(this.document,{mousemove:f}),f(t)):s.position(e.extend({of:r},this.options.position)),s.hide(),this._show(s,this.options.show),this.options.show&&this.options.show.delay&&(u=setInterval(function(){s.is(":visible")&&(f(a.of),clearInterval(u))},e.fx.interval)),this._trigger("open",t,{tooltip:s}),o={keyup:function(t){if(t.keyCode===e.ui.keyCode.ESCAPE){var n=e.Event(t);n.currentTarget=r[0],this.close(n,!0)}},remove:function(){this._removeTooltip(s)}};if(!t||t.type==="mouseover")o.mouseleave="close";if(!t||t.type==="focusin")o.focusout="close";this._on(!0,r,o)},close:function(t){var n=this,i=e(t?t.currentTarget:this.element),s=this._find(i);if(this.closing)return;i.data("ui-tooltip-title")&&i.attr("title",i.data("ui-tooltip-title")),r(i),s.stop(!0),this._hide(s,this.options.hide,function(){n._removeTooltip(e(this))}),i.removeData("ui-tooltip-open"),this._off(i,"mouseleave focusout keyup"),i[0]!==this.element[0]&&this._off(i,"remove"),this._off(this.document,"mousemove"),t&&t.type==="mouseleave"&&e.each(this.parents,function(t,r){e(r.element).attr("title",r.title),delete n.parents[t]}),this.closing=!0,this._trigger("close",t,{tooltip:s}),this.closing=!1},_tooltip:function(n){var r="ui-tooltip-"+t++,i=e("<div>").attr({id:r,role:"tooltip"}).addClass("ui-tooltip ui-widget ui-corner-all ui-widget-content "+(this.options.tooltipClass||""));return e("<div>").addClass("ui-tooltip-content").appendTo(i),i.appendTo(this.document[0].body),e.fn.bgiframe&&i.bgiframe(),this.tooltips[r]=n,i},_find:function(t){var n=t.data("ui-tooltip-id");return n?e("#"+n):e()},_removeTooltip:function(e){e.remove(),delete this.tooltips[e.attr("id")]},_destroy:function(){var t=this;e.each(this.tooltips,function(n,r){var i=e.Event("blur");i.target=i.currentTarget=r[0],t.close(i,!0),e("#"+n).remove(),r.data("ui-tooltip-title")&&(r.attr("title",r.data("ui-tooltip-title")),r.removeData("ui-tooltip-title"))})}})})(jQuery);
/*! jQuery UI - v1.9.2 - 2013-05-14
* http://jqueryui.com
* Includes: jquery.ui.core.js, jquery.ui.widget.js, jquery.ui.accordion.js
* Copyright 2013 jQuery Foundation and other contributors Licensed MIT */
(function(e,t){function i(t,n){var r,i,o,u=t.nodeName.toLowerCase();return"area"===u?(r=t.parentNode,i=r.name,!t.href||!i||r.nodeName.toLowerCase()!=="map"?!1:(o=e("img[usemap=#"+i+"]")[0],!!o&&s(o))):(/input|select|textarea|button|object/.test(u)?!t.disabled:"a"===u?t.href||n:n)&&s(t)}function s(t){return e.expr.filters.visible(t)&&!e(t).parents().andSelf().filter(function(){return e.css(this,"visibility")==="hidden"}).length}var n=0,r=/^ui-id-\d+$/;e.ui=e.ui||{};if(e.ui.version)return;e.extend(e.ui,{version:"1.9.2",keyCode:{BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38}}),e.fn.extend({_focus:e.fn.focus,focus:function(t,n){return typeof t=="number"?this.each(function(){var r=this;setTimeout(function(){e(r).focus(),n&&n.call(r)},t)}):this._focus.apply(this,arguments)},scrollParent:function(){var t;return e.ui.ie&&/(static|relative)/.test(this.css("position"))||/absolute/.test(this.css("position"))?t=this.parents().filter(function(){return/(relative|absolute|fixed)/.test(e.css(this,"position"))&&/(auto|scroll)/.test(e.css(this,"overflow")+e.css(this,"overflow-y")+e.css(this,"overflow-x"))}).eq(0):t=this.parents().filter(function(){return/(auto|scroll)/.test(e.css(this,"overflow")+e.css(this,"overflow-y")+e.css(this,"overflow-x"))}).eq(0),/fixed/.test(this.css("position"))||!t.length?e(document):t},zIndex:function(n){if(n!==t)return this.css("zIndex",n);if(this.length){var r=e(this[0]),i,s;while(r.length&&r[0]!==document){i=r.css("position");if(i==="absolute"||i==="relative"||i==="fixed"){s=parseInt(r.css("zIndex"),10);if(!isNaN(s)&&s!==0)return s}r=r.parent()}}return 0},uniqueId:function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++n)})},removeUniqueId:function(){return this.each(function(){r.test(this.id)&&e(this).removeAttr("id")})}}),e.extend(e.expr[":"],{data:e.expr.createPseudo?e.expr.createPseudo(function(t){return function(n){return!!e.data(n,t)}}):function(t,n,r){return!!e.data(t,r[3])},focusable:function(t){return i(t,!isNaN(e.attr(t,"tabindex")))},tabbable:function(t){var n=e.attr(t,"tabindex"),r=isNaN(n);return(r||n>=0)&&i(t,!r)}}),e(function(){var t=document.body,n=t.appendChild(n=document.createElement("div"));n.offsetHeight,e.extend(n.style,{minHeight:"100px",height:"auto",padding:0,borderWidth:0}),e.support.minHeight=n.offsetHeight===100,e.support.selectstart="onselectstart"in n,t.removeChild(n).style.display="none"}),e("<a>").outerWidth(1).jquery||e.each(["Width","Height"],function(n,r){function u(t,n,r,s){return e.each(i,function(){n-=parseFloat(e.css(t,"padding"+this))||0,r&&(n-=parseFloat(e.css(t,"border"+this+"Width"))||0),s&&(n-=parseFloat(e.css(t,"margin"+this))||0)}),n}var i=r==="Width"?["Left","Right"]:["Top","Bottom"],s=r.toLowerCase(),o={innerWidth:e.fn.innerWidth,innerHeight:e.fn.innerHeight,outerWidth:e.fn.outerWidth,outerHeight:e.fn.outerHeight};e.fn["inner"+r]=function(n){return n===t?o["inner"+r].call(this):this.each(function(){e(this).css(s,u(this,n)+"px")})},e.fn["outer"+r]=function(t,n){return typeof t!="number"?o["outer"+r].call(this,t):this.each(function(){e(this).css(s,u(this,t,!0,n)+"px")})}}),e("<a>").data("a-b","a").removeData("a-b").data("a-b")&&(e.fn.removeData=function(t){return function(n){return arguments.length?t.call(this,e.camelCase(n)):t.call(this)}}(e.fn.removeData)),function(){var t=/msie ([\w.]+)/.exec(navigator.userAgent.toLowerCase())||[];e.ui.ie=t.length?!0:!1,e.ui.ie6=parseFloat(t[1],10)===6}(),e.fn.extend({disableSelection:function(){return this.bind((e.support.selectstart?"selectstart":"mousedown")+".ui-disableSelection",function(e){e.preventDefault()})},enableSelection:function(){return this.unbind(".ui-disableSelection")}}),e.extend(e.ui,{plugin:{add:function(t,n,r){var i,s=e.ui[t].prototype;for(i in r)s.plugins[i]=s.plugins[i]||[],s.plugins[i].push([n,r[i]])},call:function(e,t,n){var r,i=e.plugins[t];if(!i||!e.element[0].parentNode||e.element[0].parentNode.nodeType===11)return;for(r=0;r<i.length;r++)e.options[i[r][0]]&&i[r][1].apply(e.element,n)}},contains:e.contains,hasScroll:function(t,n){if(e(t).css("overflow")==="hidden")return!1;var r=n&&n==="left"?"scrollLeft":"scrollTop",i=!1;return t[r]>0?!0:(t[r]=1,i=t[r]>0,t[r]=0,i)},isOverAxis:function(e,t,n){return e>t&&e<t+n},isOver:function(t,n,r,i,s,o){return e.ui.isOverAxis(t,r,s)&&e.ui.isOverAxis(n,i,o)}})})(jQuery);(function(e,t){var n=0,r=Array.prototype.slice,i=e.cleanData;e.cleanData=function(t){for(var n=0,r;(r=t[n])!=null;n++)try{e(r).triggerHandler("remove")}catch(s){}i(t)},e.widget=function(t,n,r){var i,s,o,u,a=t.split(".")[0];t=t.split(".")[1],i=a+"-"+t,r||(r=n,n=e.Widget),e.expr[":"][i.toLowerCase()]=function(t){return!!e.data(t,i)},e[a]=e[a]||{},s=e[a][t],o=e[a][t]=function(e,t){if(!this._createWidget)return new o(e,t);arguments.length&&this._createWidget(e,t)},e.extend(o,s,{version:r.version,_proto:e.extend({},r),_childConstructors:[]}),u=new n,u.options=e.widget.extend({},u.options),e.each(r,function(t,i){e.isFunction(i)&&(r[t]=function(){var e=function(){return n.prototype[t].apply(this,arguments)},r=function(e){return n.prototype[t].apply(this,e)};return function(){var t=this._super,n=this._superApply,s;return this._super=e,this._superApply=r,s=i.apply(this,arguments),this._super=t,this._superApply=n,s}}())}),o.prototype=e.widget.extend(u,{widgetEventPrefix:s?u.widgetEventPrefix:t},r,{constructor:o,namespace:a,widgetName:t,widgetBaseClass:i,widgetFullName:i}),s?(e.each(s._childConstructors,function(t,n){var r=n.prototype;e.widget(r.namespace+"."+r.widgetName,o,n._proto)}),delete s._childConstructors):n._childConstructors.push(o),e.widget.bridge(t,o)},e.widget.extend=function(n){var i=r.call(arguments,1),s=0,o=i.length,u,a;for(;s<o;s++)for(u in i[s])a=i[s][u],i[s].hasOwnProperty(u)&&a!==t&&(e.isPlainObject(a)?n[u]=e.isPlainObject(n[u])?e.widget.extend({},n[u],a):e.widget.extend({},a):n[u]=a);return n},e.widget.bridge=function(n,i){var s=i.prototype.widgetFullName||n;e.fn[n]=function(o){var u=typeof o=="string",a=r.call(arguments,1),f=this;return o=!u&&a.length?e.widget.extend.apply(null,[o].concat(a)):o,u?this.each(function(){var r,i=e.data(this,s);if(!i)return e.error("cannot call methods on "+n+" prior to initialization; "+"attempted to call method '"+o+"'");if(!e.isFunction(i[o])||o.charAt(0)==="_")return e.error("no such method '"+o+"' for "+n+" widget instance");r=i[o].apply(i,a);if(r!==i&&r!==t)return f=r&&r.jquery?f.pushStack(r.get()):r,!1}):this.each(function(){var t=e.data(this,s);t?t.option(o||{})._init():e.data(this,s,new i(o,this))}),f}},e.Widget=function(){},e.Widget._childConstructors=[],e.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{disabled:!1,create:null},_createWidget:function(t,r){r=e(r||this.defaultElement||this)[0],this.element=e(r),this.uuid=n++,this.eventNamespace="."+this.widgetName+this.uuid,this.options=e.widget.extend({},this.options,this._getCreateOptions(),t),this.bindings=e(),this.hoverable=e(),this.focusable=e(),r!==this&&(e.data(r,this.widgetName,this),e.data(r,this.widgetFullName,this),this._on(!0,this.element,{remove:function(e){e.target===r&&this.destroy()}}),this.document=e(r.style?r.ownerDocument:r.document||r),this.window=e(this.document[0].defaultView||this.document[0].parentWindow)),this._create(),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:e.noop,_getCreateEventData:e.noop,_create:e.noop,_init:e.noop,destroy:function(){this._destroy(),this.element.unbind(this.eventNamespace).removeData(this.widgetName).removeData(this.widgetFullName).removeData(e.camelCase(this.widgetFullName)),this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName+"-disabled "+"ui-state-disabled"),this.bindings.unbind(this.eventNamespace),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")},_destroy:e.noop,widget:function(){return this.element},option:function(n,r){var i=n,s,o,u;if(arguments.length===0)return e.widget.extend({},this.options);if(typeof n=="string"){i={},s=n.split("."),n=s.shift();if(s.length){o=i[n]=e.widget.extend({},this.options[n]);for(u=0;u<s.length-1;u++)o[s[u]]=o[s[u]]||{},o=o[s[u]];n=s.pop();if(r===t)return o[n]===t?null:o[n];o[n]=r}else{if(r===t)return this.options[n]===t?null:this.options[n];i[n]=r}}return this._setOptions(i),this},_setOptions:function(e){var t;for(t in e)this._setOption(t,e[t]);return this},_setOption:function(e,t){return this.options[e]=t,e==="disabled"&&(this.widget().toggleClass(this.widgetFullName+"-disabled ui-state-disabled",!!t).attr("aria-disabled",t),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")),this},enable:function(){return this._setOption("disabled",!1)},disable:function(){return this._setOption("disabled",!0)},_on:function(t,n,r){var i,s=this;typeof t!="boolean"&&(r=n,n=t,t=!1),r?(n=i=e(n),this.bindings=this.bindings.add(n)):(r=n,n=this.element,i=this.widget()),e.each(r,function(r,o){function u(){if(!t&&(s.options.disabled===!0||e(this).hasClass("ui-state-disabled")))return;return(typeof o=="string"?s[o]:o).apply(s,arguments)}typeof o!="string"&&(u.guid=o.guid=o.guid||u.guid||e.guid++);var a=r.match(/^(\w+)\s*(.*)$/),f=a[1]+s.eventNamespace,l=a[2];l?i.delegate(l,f,u):n.bind(f,u)})},_off:function(e,t){t=(t||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,e.unbind(t).undelegate(t)},_delay:function(e,t){function n(){return(typeof e=="string"?r[e]:e).apply(r,arguments)}var r=this;return setTimeout(n,t||0)},_hoverable:function(t){this.hoverable=this.hoverable.add(t),this._on(t,{mouseenter:function(t){e(t.currentTarget).addClass("ui-state-hover")},mouseleave:function(t){e(t.currentTarget).removeClass("ui-state-hover")}})},_focusable:function(t){this.focusable=this.focusable.add(t),this._on(t,{focusin:function(t){e(t.currentTarget).addClass("ui-state-focus")},focusout:function(t){e(t.currentTarget).removeClass("ui-state-focus")}})},_trigger:function(t,n,r){var i,s,o=this.options[t];r=r||{},n=e.Event(n),n.type=(t===this.widgetEventPrefix?t:this.widgetEventPrefix+t).toLowerCase(),n.target=this.element[0],s=n.originalEvent;if(s)for(i in s)i in n||(n[i]=s[i]);return this.element.trigger(n,r),!(e.isFunction(o)&&o.apply(this.element[0],[n].concat(r))===!1||n.isDefaultPrevented())}},e.each({show:"fadeIn",hide:"fadeOut"},function(t,n){e.Widget.prototype["_"+t]=function(r,i,s){typeof i=="string"&&(i={effect:i});var o,u=i?i===!0||typeof i=="number"?n:i.effect||n:t;i=i||{},typeof i=="number"&&(i={duration:i}),o=!e.isEmptyObject(i),i.complete=s,i.delay&&r.delay(i.delay),o&&e.effects&&(e.effects.effect[u]||e.uiBackCompat!==!1&&e.effects[u])?r[t](i):u!==t&&r[u]?r[u](i.duration,i.easing,s):r.queue(function(n){e(this)[t](),s&&s.call(r[0]),n()})}}),e.uiBackCompat!==!1&&(e.Widget.prototype._getCreateOptions=function(){return e.metadata&&e.metadata.get(this.element[0])[this.widgetName]})})(jQuery);(function(e,t){var n=0,r={},i={};r.height=r.paddingTop=r.paddingBottom=r.borderTopWidth=r.borderBottomWidth="hide",i.height=i.paddingTop=i.paddingBottom=i.borderTopWidth=i.borderBottomWidth="show",e.widget("ui.accordion",{version:"1.9.2",options:{active:0,animate:{},collapsible:!1,event:"click",header:"> li > :first-child,> :not(li):even",heightStyle:"auto",icons:{activeHeader:"ui-icon-triangle-1-s",header:"ui-icon-triangle-1-e"},activate:null,beforeActivate:null},_create:function(){var t=this.accordionId="ui-accordion-"+(this.element.attr("id")||++n),r=this.options;this.prevShow=this.prevHide=e(),this.element.addClass("ui-accordion ui-widget ui-helper-reset"),this.headers=this.element.find(r.header).addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all"),this._hoverable(this.headers),this._focusable(this.headers),this.headers.next().addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom").hide(),!r.collapsible&&(r.active===!1||r.active==null)&&(r.active=0),r.active<0&&(r.active+=this.headers.length),this.active=this._findActive(r.active).addClass("ui-accordion-header-active ui-state-active").toggleClass("ui-corner-all ui-corner-top"),this.active.next().addClass("ui-accordion-content-active").show(),this._createIcons(),this.refresh(),this.element.attr("role","tablist"),this.headers.attr("role","tab").each(function(n){var r=e(this),i=r.attr("id"),s=r.next(),o=s.attr("id");i||(i=t+"-header-"+n,r.attr("id",i)),o||(o=t+"-panel-"+n,s.attr("id",o)),r.attr("aria-controls",o),s.attr("aria-labelledby",i)}).next().attr("role","tabpanel"),this.headers.not(this.active).attr({"aria-selected":"false",tabIndex:-1}).next().attr({"aria-expanded":"false","aria-hidden":"true"}).hide(),this.active.length?this.active.attr({"aria-selected":"true",tabIndex:0}).next().attr({"aria-expanded":"true","aria-hidden":"false"}):this.headers.eq(0).attr("tabIndex",0),this._on(this.headers,{keydown:"_keydown"}),this._on(this.headers.next(),{keydown:"_panelKeyDown"}),this._setupEvents(r.event)},_getCreateEventData:function(){return{header:this.active,content:this.active.length?this.active.next():e()}},_createIcons:function(){var t=this.options.icons;t&&(e("<span>").addClass("ui-accordion-header-icon ui-icon "+t.header).prependTo(this.headers),this.active.children(".ui-accordion-header-icon").removeClass(t.header).addClass(t.activeHeader),this.headers.addClass("ui-accordion-icons"))},_destroyIcons:function(){this.headers.removeClass("ui-accordion-icons").children(".ui-accordion-header-icon").remove()},_destroy:function(){var e;this.element.removeClass("ui-accordion ui-widget ui-helper-reset").removeAttr("role"),this.headers.removeClass("ui-accordion-header ui-accordion-header-active ui-helper-reset ui-state-default ui-corner-all ui-state-active ui-state-disabled ui-corner-top").removeAttr("role").removeAttr("aria-selected").removeAttr("aria-controls").removeAttr("tabIndex").each(function(){/^ui-accordion/.test(this.id)&&this.removeAttribute("id")}),this._destroyIcons(),e=this.headers.next().css("display","").removeAttr("role").removeAttr("aria-expanded").removeAttr("aria-hidden").removeAttr("aria-labelledby").removeClass("ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content ui-accordion-content-active ui-state-disabled").each(function(){/^ui-accordion/.test(this.id)&&this.removeAttribute("id")}),this.options.heightStyle!=="content"&&e.css("height","")},_setOption:function(e,t){if(e==="active"){this._activate(t);return}e==="event"&&(this.options.event&&this._off(this.headers,this.options.event),this._setupEvents(t)),this._super(e,t),e==="collapsible"&&!t&&this.options.active===!1&&this._activate(0),e==="icons"&&(this._destroyIcons(),t&&this._createIcons()),e==="disabled"&&this.headers.add(this.headers.next()).toggleClass("ui-state-disabled",!!t)},_keydown:function(t){if(t.altKey||t.ctrlKey)return;var n=e.ui.keyCode,r=this.headers.length,i=this.headers.index(t.target),s=!1;switch(t.keyCode){case n.RIGHT:case n.DOWN:s=this.headers[(i+1)%r];break;case n.LEFT:case n.UP:s=this.headers[(i-1+r)%r];break;case n.SPACE:case n.ENTER:this._eventHandler(t);break;case n.HOME:s=this.headers[0];break;case n.END:s=this.headers[r-1]}s&&(e(t.target).attr("tabIndex",-1),e(s).attr("tabIndex",0),s.focus(),t.preventDefault())},_panelKeyDown:function(t){t.keyCode===e.ui.keyCode.UP&&t.ctrlKey&&e(t.currentTarget).prev().focus()},refresh:function(){var t,n,r=this.options.heightStyle,i=this.element.parent();r==="fill"?(e.support.minHeight||(n=i.css("overflow"),i.css("overflow","hidden")),t=i.height(),this.element.siblings(":visible").each(function(){var n=e(this),r=n.css("position");if(r==="absolute"||r==="fixed")return;t-=n.outerHeight(!0)}),n&&i.css("overflow",n),this.headers.each(function(){t-=e(this).outerHeight(!0)}),this.headers.next().each(function(){e(this).height(Math.max(0,t-e(this).innerHeight()+e(this).height()))}).css("overflow","auto")):r==="auto"&&(t=0,this.headers.next().each(function(){t=Math.max(t,e(this).css("height","").height())}).height(t))},_activate:function(t){var n=this._findActive(t)[0];if(n===this.active[0])return;n=n||this.active[0],this._eventHandler({target:n,currentTarget:n,preventDefault:e.noop})},_findActive:function(t){return typeof t=="number"?this.headers.eq(t):e()},_setupEvents:function(t){var n={};if(!t)return;e.each(t.split(" "),function(e,t){n[t]="_eventHandler"}),this._on(this.headers,n)},_eventHandler:function(t){var n=this.options,r=this.active,i=e(t.currentTarget),s=i[0]===r[0],o=s&&n.collapsible,u=o?e():i.next(),a=r.next(),f={oldHeader:r,oldPanel:a,newHeader:o?e():i,newPanel:u};t.preventDefault();if(s&&!n.collapsible||this._trigger("beforeActivate",t,f)===!1)return;n.active=o?!1:this.headers.index(i),this.active=s?e():i,this._toggle(f),r.removeClass("ui-accordion-header-active ui-state-active"),n.icons&&r.children(".ui-accordion-header-icon").removeClass(n.icons.activeHeader).addClass(n.icons.header),s||(i.removeClass("ui-corner-all").addClass("ui-accordion-header-active ui-state-active ui-corner-top"),n.icons&&i.children(".ui-accordion-header-icon").removeClass(n.icons.header).addClass(n.icons.activeHeader),i.next().addClass("ui-accordion-content-active"))},_toggle:function(t){var n=t.newPanel,r=this.prevShow.length?this.prevShow:t.oldPanel;this.prevShow.add(this.prevHide).stop(!0,!0),this.prevShow=n,this.prevHide=r,this.options.animate?this._animate(n,r,t):(r.hide(),n.show(),this._toggleComplete(t)),r.attr({"aria-expanded":"false","aria-hidden":"true"}),r.prev().attr("aria-selected","false"),n.length&&r.length?r.prev().attr("tabIndex",-1):n.length&&this.headers.filter(function(){return e(this).attr("tabIndex")===0}).attr("tabIndex",-1),n.attr({"aria-expanded":"true","aria-hidden":"false"}).prev().attr({"aria-selected":"true",tabIndex:0})},_animate:function(e,t,n){var s,o,u,a=this,f=0,l=e.length&&(!t.length||e.index()<t.index()),c=this.options.animate||{},h=l&&c.down||c,p=function(){a._toggleComplete(n)};typeof h=="number"&&(u=h),typeof h=="string"&&(o=h),o=o||h.easing||c.easing,u=u||h.duration||c.duration;if(!t.length)return e.animate(i,u,o,p);if(!e.length)return t.animate(r,u,o,p);s=e.show().outerHeight(),t.animate(r,{duration:u,easing:o,step:function(e,t){t.now=Math.round(e)}}),e.hide().animate(i,{duration:u,easing:o,complete:p,step:function(e,n){n.now=Math.round(e),n.prop!=="height"?f+=n.now:a.options.heightStyle!=="content"&&(n.now=Math.round(s-t.outerHeight()-f),f=0)}})},_toggleComplete:function(e){var t=e.oldPanel;t.removeClass("ui-accordion-content-active").prev().removeClass("ui-corner-top").addClass("ui-corner-all"),t.length&&(t.parent()[0].className=t.parent()[0].className),this._trigger("activate",null,e)}}),e.uiBackCompat!==!1&&(function(e,t){e.extend(t.options,{navigation:!1,navigationFilter:function(){return this.href.toLowerCase()===location.href.toLowerCase()}});var n=t._create;t._create=function(){if(this.options.navigation){var t=this,r=this.element.find(this.options.header),i=r.next(),s=r.add(i).find("a").filter(this.options.navigationFilter)[0];s&&r.add(i).each(function(n){if(e.contains(this,s))return t.options.active=Math.floor(n/2),!1})}n.call(this)}}(jQuery,jQuery.ui.accordion.prototype),function(e,t){e.extend(t.options,{heightStyle:null,autoHeight:!0,clearStyle:!1,fillSpace:!1});var n=t._create,r=t._setOption;e.extend(t,{_create:function(){this.options.heightStyle=this.options.heightStyle||this._mergeHeightStyle(),n.call(this)},_setOption:function(e){if(e==="autoHeight"||e==="clearStyle"||e==="fillSpace")this.options.heightStyle=this._mergeHeightStyle();r.apply(this,arguments)},_mergeHeightStyle:function(){var e=this.options;if(e.fillSpace)return"fill";if(e.clearStyle)return"content";if(e.autoHeight)return"auto"}})}(jQuery,jQuery.ui.accordion.prototype),function(e,t){e.extend(t.options.icons,{activeHeader:null,headerSelected:"ui-icon-triangle-1-s"});var n=t._createIcons;t._createIcons=function(){this.options.icons&&(this.options.icons.activeHeader=this.options.icons.activeHeader||this.options.icons.headerSelected),n.call(this)}}(jQuery,jQuery.ui.accordion.prototype),function(e,t){t.activate=t._activate;var n=t._findActive;t._findActive=function(e){return e===-1&&(e=!1),e&&typeof e!="number"&&(e=this.headers.index(this.headers.filter(e)),e===-1&&(e=!1)),n.call(this,e)}}(jQuery,jQuery.ui.accordion.prototype),jQuery.ui.accordion.prototype.resize=jQuery.ui.accordion.prototype.refresh,function(e,t){e.extend(t.options,{change:null,changestart:null});var n=t._trigger;t._trigger=function(e,t,r){var i=n.apply(this,arguments);return i?(e==="beforeActivate"?i=n.call(this,"changestart",t,{oldHeader:r.oldHeader,oldContent:r.oldPanel,newHeader:r.newHeader,newContent:r.newPanel}):e==="activate"&&(i=n.call(this,"change",t,{oldHeader:r.oldHeader,oldContent:r.oldPanel,newHeader:r.newHeader,newContent:r.newPanel})),i):!1}}(jQuery,jQuery.ui.accordion.prototype),function(e,t){e.extend(t.options,{animate:null,animated:"slide"});var n=t._create;t._create=function(){var e=this.options;e.animate===null&&(e.animated?e.animated==="slide"?e.animate=300:e.animated==="bounceslide"?e.animate={duration:200,down:{easing:"easeOutBounce",duration:1e3}}:e.animate=e.animated:e.animate=!1),n.call(this)}}(jQuery,jQuery.ui.accordion.prototype))})(jQuery);
;var mytheresa=mytheresa||{};mytheresa.Spurring=function(){this.templates={h:"#{h} hour",hh:"#{h} hours",m:"#{m} minute",mm:"#{m} minutes",s:"#{s} second",ss:"#{s} seconds",glue:" and "};this.toString=function(e,b){var d=this._filterEmpty(this.getTimeDifference(e,b));var c=[];if(d.hasOwnProperty("h")){c.push(this._render(this.templates[d.h!=1?"hh":"h"],d))}if(d.hasOwnProperty("m")){c.push(this._render(this.templates[d.m!=1?"mm":"m"],d))}if(d.hasOwnProperty("s")){c.push(this._render(this.templates[d.s!=1?"ss":"s"],d))}var a="";switch(c.length){case 0:break;case 1:a=c[0];break;default:a=c.slice(0,-1).join(", ")+this.templates.glue+c.slice(-1)[0];break}return a};this._render=function(b,a){return new Template(b).evaluate(a)};this.getTimeDifference=function(c,a){var b=(c.getTime()-(a||new Date()).getTime())/1000;return b<=0?{}:{h:Math.floor(b/3600),m:Math.floor((b%3600)/60)}};this._filterEmpty=function(c){var b={};for(var a in c){if(0!=c[a]){b[a]=c[a]}}return b}};

/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.4.1
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */

!function(a){"use strict";"function"==typeof define&&define.amd?define(["jquery"],a):"undefined"!=typeof exports?module.exports=a(require("jquery")):a(jQuery)}(function(a){"use strict";var b=window.Slick||{};b=function(){function c(c,d){var f,g,h,e=this;if(e.defaults={accessibility:!0,adaptiveHeight:!1,appendArrows:a(c),appendDots:a(c),arrows:!0,asNavFor:null,prevArrow:'<button type="button" data-role="none" class="slick-prev">Previous</button>',nextArrow:'<button type="button" data-role="none" class="slick-next">Next</button>',autoplay:!1,autoplaySpeed:3e3,centerMode:!1,centerPadding:"50px",cssEase:"ease",customPaging:function(a,b){return'<button type="button" data-role="none">'+(b+1)+"</button>"},dots:!1,dotsClass:"slick-dots",draggable:!0,easing:"linear",edgeFriction:.35,fade:!1,focusOnSelect:!1,infinite:!0,initialSlide:0,lazyLoad:"ondemand",mobileFirst:!1,pauseOnHover:!0,pauseOnDotsHover:!1,respondTo:"window",responsive:null,rtl:!1,slide:"",slidesToShow:1,slidesToScroll:1,speed:500,swipe:!0,swipeToSlide:!1,touchMove:!0,touchThreshold:5,useCSS:!0,variableWidth:!1,vertical:!1,waitForAnimate:!0},e.initials={animating:!1,dragging:!1,autoPlayTimer:null,currentDirection:0,currentLeft:null,currentSlide:0,direction:1,$dots:null,listWidth:null,listHeight:null,loadIndex:0,$nextArrow:null,$prevArrow:null,slideCount:null,slideWidth:null,$slideTrack:null,$slides:null,sliding:!1,slideOffset:0,swipeLeft:null,$list:null,touchObject:{},transformsEnabled:!1},a.extend(e,e.initials),e.activeBreakpoint=null,e.animType=null,e.animProp=null,e.breakpoints=[],e.breakpointSettings=[],e.cssTransitions=!1,e.hidden="hidden",e.paused=!1,e.positionProp=null,e.respondTo=null,e.shouldClick=!0,e.$slider=a(c),e.$slidesCache=null,e.transformType=null,e.transitionType=null,e.visibilityChange="visibilitychange",e.windowWidth=0,e.windowTimer=null,f=a(c).data("slick")||{},e.options=a.extend({},e.defaults,f,d),e.currentSlide=e.options.initialSlide,e.originalSettings=e.options,g=e.options.responsive||null,g&&g.length>-1){e.respondTo=e.options.respondTo||"window";for(h in g)g.hasOwnProperty(h)&&(e.breakpoints.push(g[h].breakpoint),e.breakpointSettings[g[h].breakpoint]=g[h].settings);e.breakpoints.sort(function(a,b){return e.options.mobileFirst===!0?a-b:b-a})}"undefined"!=typeof document.mozHidden?(e.hidden="mozHidden",e.visibilityChange="mozvisibilitychange"):"undefined"!=typeof document.msHidden?(e.hidden="msHidden",e.visibilityChange="msvisibilitychange"):"undefined"!=typeof document.webkitHidden&&(e.hidden="webkitHidden",e.visibilityChange="webkitvisibilitychange"),e.autoPlay=a.proxy(e.autoPlay,e),e.autoPlayClear=a.proxy(e.autoPlayClear,e),e.changeSlide=a.proxy(e.changeSlide,e),e.clickHandler=a.proxy(e.clickHandler,e),e.selectHandler=a.proxy(e.selectHandler,e),e.setPosition=a.proxy(e.setPosition,e),e.swipeHandler=a.proxy(e.swipeHandler,e),e.dragHandler=a.proxy(e.dragHandler,e),e.keyHandler=a.proxy(e.keyHandler,e),e.autoPlayIterator=a.proxy(e.autoPlayIterator,e),e.instanceUid=b++,e.htmlExpr=/^(?:\s*(<[\w\W]+>)[^>]*)$/,e.init(),e.checkResponsive(!0)}var b=0;return c}(),b.prototype.addSlide=b.prototype.slickAdd=function(b,c,d){var e=this;if("boolean"==typeof c)d=c,c=null;else if(0>c||c>=e.slideCount)return!1;e.unload(),"number"==typeof c?0===c&&0===e.$slides.length?a(b).appendTo(e.$slideTrack):d?a(b).insertBefore(e.$slides.eq(c)):a(b).insertAfter(e.$slides.eq(c)):d===!0?a(b).prependTo(e.$slideTrack):a(b).appendTo(e.$slideTrack),e.$slides=e.$slideTrack.children(this.options.slide),e.$slideTrack.children(this.options.slide).detach(),e.$slideTrack.append(e.$slides),e.$slides.each(function(b,c){a(c).attr("data-slick-index",b)}),e.$slidesCache=e.$slides,e.reinit()},b.prototype.animateHeight=function(){var a=this;if(1===a.options.slidesToShow&&a.options.adaptiveHeight===!0&&a.options.vertical===!1){var b=a.$slides.eq(a.currentSlide).outerHeight(!0);a.$list.animate({height:b},a.options.speed)}},b.prototype.animateSlide=function(b,c){var d={},e=this;e.animateHeight(),e.options.rtl===!0&&e.options.vertical===!1&&(b=-b),e.transformsEnabled===!1?e.options.vertical===!1?e.$slideTrack.animate({left:b},e.options.speed,e.options.easing,c):e.$slideTrack.animate({top:b},e.options.speed,e.options.easing,c):e.cssTransitions===!1?(e.options.rtl===!0&&(e.currentLeft=-e.currentLeft),a({animStart:e.currentLeft}).animate({animStart:b},{duration:e.options.speed,easing:e.options.easing,step:function(a){a=Math.ceil(a),e.options.vertical===!1?(d[e.animType]="translate("+a+"px, 0px)",e.$slideTrack.css(d)):(d[e.animType]="translate(0px,"+a+"px)",e.$slideTrack.css(d))},complete:function(){c&&c.call()}})):(e.applyTransition(),b=Math.ceil(b),d[e.animType]=e.options.vertical===!1?"translate3d("+b+"px, 0px, 0px)":"translate3d(0px,"+b+"px, 0px)",e.$slideTrack.css(d),c&&setTimeout(function(){e.disableTransition(),c.call()},e.options.speed))},b.prototype.asNavFor=function(b){var c=this,d=null!==c.options.asNavFor?a(c.options.asNavFor).slick("getSlick"):null;null!==d&&d.slideHandler(b,!0)},b.prototype.applyTransition=function(a){var b=this,c={};c[b.transitionType]=b.options.fade===!1?b.transformType+" "+b.options.speed+"ms "+b.options.cssEase:"opacity "+b.options.speed+"ms "+b.options.cssEase,b.options.fade===!1?b.$slideTrack.css(c):b.$slides.eq(a).css(c)},b.prototype.autoPlay=function(){var a=this;a.autoPlayTimer&&clearInterval(a.autoPlayTimer),a.slideCount>a.options.slidesToShow&&a.paused!==!0&&(a.autoPlayTimer=setInterval(a.autoPlayIterator,a.options.autoplaySpeed))},b.prototype.autoPlayClear=function(){var a=this;a.autoPlayTimer&&clearInterval(a.autoPlayTimer)},b.prototype.autoPlayIterator=function(){var a=this;a.options.infinite===!1?1===a.direction?(a.currentSlide+1===a.slideCount-1&&(a.direction=0),a.slideHandler(a.currentSlide+a.options.slidesToScroll)):(0===a.currentSlide-1&&(a.direction=1),a.slideHandler(a.currentSlide-a.options.slidesToScroll)):a.slideHandler(a.currentSlide+a.options.slidesToScroll)},b.prototype.buildArrows=function(){var b=this;b.options.arrows===!0&&b.slideCount>b.options.slidesToShow&&(b.$prevArrow=a(b.options.prevArrow),b.$nextArrow=a(b.options.nextArrow),b.htmlExpr.test(b.options.prevArrow)&&b.$prevArrow.appendTo(b.options.appendArrows),b.htmlExpr.test(b.options.nextArrow)&&b.$nextArrow.appendTo(b.options.appendArrows),b.options.infinite!==!0&&b.$prevArrow.addClass("slick-disabled"))},b.prototype.buildDots=function(){var c,d,b=this;if(b.options.dots===!0&&b.slideCount>b.options.slidesToShow){for(d='<ul class="'+b.options.dotsClass+'">',c=0;c<=b.getDotCount();c+=1)d+="<li>"+b.options.customPaging.call(this,b,c)+"</li>";d+="</ul>",b.$dots=a(d).appendTo(b.options.appendDots),b.$dots.find("li").first().addClass("slick-active")}},b.prototype.buildOut=function(){var b=this;b.$slides=b.$slider.children(b.options.slide+":not(.slick-cloned)").addClass("slick-slide"),b.slideCount=b.$slides.length,b.$slides.each(function(b,c){a(c).attr("data-slick-index",b)}),b.$slidesCache=b.$slides,b.$slider.addClass("slick-slider"),b.$slideTrack=0===b.slideCount?a('<div class="slick-track"/>').appendTo(b.$slider):b.$slides.wrapAll('<div class="slick-track"/>').parent(),b.$list=b.$slideTrack.wrap('<div class="slick-list"/>').parent(),b.$slideTrack.css("opacity",0),(b.options.centerMode===!0||b.options.swipeToSlide===!0)&&(b.options.slidesToScroll=1),a("img[data-lazy]",b.$slider).not("[src]").addClass("slick-loading"),b.setupInfinite(),b.buildArrows(),b.buildDots(),b.updateDots(),b.options.accessibility===!0&&b.$list.prop("tabIndex",0),b.setSlideClasses("number"==typeof this.currentSlide?this.currentSlide:0),b.options.draggable===!0&&b.$list.addClass("draggable")},b.prototype.checkResponsive=function(b){var d,e,f,c=this,g=c.$slider.width(),h=window.innerWidth||a(window).width();if("window"===c.respondTo?f=h:"slider"===c.respondTo?f=g:"min"===c.respondTo&&(f=Math.min(h,g)),c.originalSettings.responsive&&c.originalSettings.responsive.length>-1&&null!==c.originalSettings.responsive){e=null;for(d in c.breakpoints)c.breakpoints.hasOwnProperty(d)&&(c.originalSettings.mobileFirst===!1?f<c.breakpoints[d]&&(e=c.breakpoints[d]):f>c.breakpoints[d]&&(e=c.breakpoints[d]));null!==e?null!==c.activeBreakpoint?e!==c.activeBreakpoint&&(c.activeBreakpoint=e,"unslick"===c.breakpointSettings[e]?c.unslick():(c.options=a.extend({},c.originalSettings,c.breakpointSettings[e]),b===!0&&(c.currentSlide=c.options.initialSlide),c.refresh())):(c.activeBreakpoint=e,"unslick"===c.breakpointSettings[e]?c.unslick():(c.options=a.extend({},c.originalSettings,c.breakpointSettings[e]),b===!0&&(c.currentSlide=c.options.initialSlide),c.refresh())):null!==c.activeBreakpoint&&(c.activeBreakpoint=null,c.options=c.originalSettings,b===!0&&(c.currentSlide=c.options.initialSlide),c.refresh())}},b.prototype.changeSlide=function(b,c){var f,g,h,d=this,e=a(b.target);switch(e.is("a")&&b.preventDefault(),h=0!==d.slideCount%d.options.slidesToScroll,f=h?0:(d.slideCount-d.currentSlide)%d.options.slidesToScroll,b.data.message){case"previous":g=0===f?d.options.slidesToScroll:d.options.slidesToShow-f,d.slideCount>d.options.slidesToShow&&d.slideHandler(d.currentSlide-g,!1,c);break;case"next":g=0===f?d.options.slidesToScroll:f,d.slideCount>d.options.slidesToShow&&d.slideHandler(d.currentSlide+g,!1,c);break;case"index":var i=0===b.data.index?0:b.data.index||a(b.target).parent().index()*d.options.slidesToScroll;d.slideHandler(d.checkNavigable(i),!1,c);break;default:return}},b.prototype.checkNavigable=function(a){var c,d,b=this;if(c=b.getNavigableIndexes(),d=0,a>c[c.length-1])a=c[c.length-1];else for(var e in c){if(a<c[e]){a=d;break}d=c[e]}return a},b.prototype.clickHandler=function(a){var b=this;b.shouldClick===!1&&(a.stopImmediatePropagation(),a.stopPropagation(),a.preventDefault())},b.prototype.destroy=function(){var b=this;b.autoPlayClear(),b.touchObject={},a(".slick-cloned",b.$slider).remove(),b.$dots&&b.$dots.remove(),b.$prevArrow&&"object"!=typeof b.options.prevArrow&&b.$prevArrow.remove(),b.$nextArrow&&"object"!=typeof b.options.nextArrow&&b.$nextArrow.remove(),b.$slides.removeClass("slick-slide slick-active slick-center slick-visible").removeAttr("data-slick-index").css({position:"",left:"",top:"",zIndex:"",opacity:"",width:""}),b.$slider.removeClass("slick-slider"),b.$slider.removeClass("slick-initialized"),b.$list.off(".slick"),a(window).off(".slick-"+b.instanceUid),a(document).off(".slick-"+b.instanceUid),b.$slider.html(b.$slides)},b.prototype.disableTransition=function(a){var b=this,c={};c[b.transitionType]="",b.options.fade===!1?b.$slideTrack.css(c):b.$slides.eq(a).css(c)},b.prototype.fadeSlide=function(a,b){var c=this;c.cssTransitions===!1?(c.$slides.eq(a).css({zIndex:1e3}),c.$slides.eq(a).animate({opacity:1},c.options.speed,c.options.easing,b)):(c.applyTransition(a),c.$slides.eq(a).css({opacity:1,zIndex:1e3}),b&&setTimeout(function(){c.disableTransition(a),b.call()},c.options.speed))},b.prototype.filterSlides=b.prototype.slickFilter=function(a){var b=this;null!==a&&(b.unload(),b.$slideTrack.children(this.options.slide).detach(),b.$slidesCache.filter(a).appendTo(b.$slideTrack),b.reinit())},b.prototype.getCurrent=b.prototype.slickCurrentSlide=function(){var a=this;return a.currentSlide},b.prototype.getDotCount=function(){var a=this,b=0,c=0,d=0;if(a.options.infinite===!0)d=Math.ceil(a.slideCount/a.options.slidesToScroll);else if(a.options.centerMode===!0)d=a.slideCount;else for(;b<a.slideCount;)++d,b=c+a.options.slidesToShow,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;return d-1},b.prototype.getLeft=function(a){var c,d,f,b=this,e=0;return b.slideOffset=0,d=b.$slides.first().outerHeight(),b.options.infinite===!0?(b.slideCount>b.options.slidesToShow&&(b.slideOffset=-1*b.slideWidth*b.options.slidesToShow,e=-1*d*b.options.slidesToShow),0!==b.slideCount%b.options.slidesToScroll&&a+b.options.slidesToScroll>b.slideCount&&b.slideCount>b.options.slidesToShow&&(a>b.slideCount?(b.slideOffset=-1*(b.options.slidesToShow-(a-b.slideCount))*b.slideWidth,e=-1*(b.options.slidesToShow-(a-b.slideCount))*d):(b.slideOffset=-1*b.slideCount%b.options.slidesToScroll*b.slideWidth,e=-1*b.slideCount%b.options.slidesToScroll*d))):a+b.options.slidesToShow>b.slideCount&&(b.slideOffset=(a+b.options.slidesToShow-b.slideCount)*b.slideWidth,e=(a+b.options.slidesToShow-b.slideCount)*d),b.slideCount<=b.options.slidesToShow&&(b.slideOffset=0,e=0),b.options.centerMode===!0&&b.options.infinite===!0?b.slideOffset+=b.slideWidth*Math.floor(b.options.slidesToShow/2)-b.slideWidth:b.options.centerMode===!0&&(b.slideOffset=0,b.slideOffset+=b.slideWidth*Math.floor(b.options.slidesToShow/2)),c=b.options.vertical===!1?-1*a*b.slideWidth+b.slideOffset:-1*a*d+e,b.options.variableWidth===!0&&(f=b.slideCount<=b.options.slidesToShow||b.options.infinite===!1?b.$slideTrack.children(".slick-slide").eq(a):b.$slideTrack.children(".slick-slide").eq(a+b.options.slidesToShow),c=f[0]?-1*f[0].offsetLeft:0,b.options.centerMode===!0&&(f=b.options.infinite===!1?b.$slideTrack.children(".slick-slide").eq(a):b.$slideTrack.children(".slick-slide").eq(a+b.options.slidesToShow+1),c=f[0]?-1*f[0].offsetLeft:0,c+=(b.$list.width()-f.outerWidth())/2)),c},b.prototype.getOption=b.prototype.slickGetOption=function(a){var b=this;return b.options[a]},b.prototype.getNavigableIndexes=function(){var e,a=this,b=0,c=0,d=[];for(a.options.infinite===!1?(e=a.slideCount-a.options.slidesToShow+1,a.options.centerMode===!0&&(e=a.slideCount)):(b=-1*a.slideCount,c=-1*a.slideCount,e=2*a.slideCount);e>b;)d.push(b),b=c+a.options.slidesToScroll,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;return d},b.prototype.getSlick=function(){return this},b.prototype.getSlideCount=function(){var c,d,e,b=this;return e=b.options.centerMode===!0?b.slideWidth*Math.floor(b.options.slidesToShow/2):0,b.options.swipeToSlide===!0?(b.$slideTrack.find(".slick-slide").each(function(c,f){return f.offsetLeft-e+a(f).outerWidth()/2>-1*b.swipeLeft?(d=f,!1):void 0}),c=Math.abs(a(d).attr("data-slick-index")-b.currentSlide)||1):b.options.slidesToScroll},b.prototype.goTo=b.prototype.slickGoTo=function(a,b){var c=this;c.changeSlide({data:{message:"index",index:parseInt(a)}},b)},b.prototype.init=function(){var b=this;a(b.$slider).hasClass("slick-initialized")||(a(b.$slider).addClass("slick-initialized"),b.buildOut(),b.setProps(),b.startLoad(),b.loadSlider(),b.initializeEvents(),b.updateArrows(),b.updateDots()),b.$slider.trigger("init",[b])},b.prototype.initArrowEvents=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.on("click.slick",{message:"previous"},a.changeSlide),a.$nextArrow.on("click.slick",{message:"next"},a.changeSlide))},b.prototype.initDotEvents=function(){var b=this;b.options.dots===!0&&b.slideCount>b.options.slidesToShow&&a("li",b.$dots).on("click.slick",{message:"index"},b.changeSlide),b.options.dots===!0&&b.options.pauseOnDotsHover===!0&&b.options.autoplay===!0&&a("li",b.$dots).on("mouseenter.slick",function(){b.paused=!0,b.autoPlayClear()}).on("mouseleave.slick",function(){b.paused=!1,b.autoPlay()})},b.prototype.initializeEvents=function(){var b=this;b.initArrowEvents(),b.initDotEvents(),b.$list.on("touchstart.slick mousedown.slick",{action:"start"},b.swipeHandler),b.$list.on("touchmove.slick mousemove.slick",{action:"move"},b.swipeHandler),b.$list.on("touchend.slick mouseup.slick",{action:"end"},b.swipeHandler),b.$list.on("touchcancel.slick mouseleave.slick",{action:"end"},b.swipeHandler),b.$list.on("click.slick",b.clickHandler),b.options.autoplay===!0&&(a(document).on(b.visibilityChange,function(){b.visibility()}),b.options.pauseOnHover===!0&&(b.$list.on("mouseenter.slick",function(){b.paused=!0,b.autoPlayClear()}),b.$list.on("mouseleave.slick",function(){b.paused=!1,b.autoPlay()}))),b.options.accessibility===!0&&b.$list.on("keydown.slick",b.keyHandler),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().on("click.slick",b.selectHandler),a(window).on("orientationchange.slick.slick-"+b.instanceUid,function(){b.checkResponsive(),b.setPosition()}),a(window).on("resize.slick.slick-"+b.instanceUid,function(){a(window).width()!==b.windowWidth&&(clearTimeout(b.windowDelay),b.windowDelay=window.setTimeout(function(){b.windowWidth=a(window).width(),b.checkResponsive(),b.setPosition()},50))}),a("*[draggable!=true]",b.$slideTrack).on("dragstart",function(a){a.preventDefault()}),a(window).on("load.slick.slick-"+b.instanceUid,b.setPosition),a(document).on("ready.slick.slick-"+b.instanceUid,b.setPosition)},b.prototype.initUI=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.show(),a.$nextArrow.show()),a.options.dots===!0&&a.slideCount>a.options.slidesToShow&&a.$dots.show(),a.options.autoplay===!0&&a.autoPlay()},b.prototype.keyHandler=function(a){var b=this;37===a.keyCode&&b.options.accessibility===!0?b.changeSlide({data:{message:"previous"}}):39===a.keyCode&&b.options.accessibility===!0&&b.changeSlide({data:{message:"next"}})},b.prototype.lazyLoad=function(){function g(b){a("img[data-lazy]",b).each(function(){var b=a(this),c=a(this).attr("data-lazy");b.load(function(){b.animate({opacity:1},200)}).css({opacity:0}).attr("src",c).removeAttr("data-lazy").removeClass("slick-loading")})}var c,d,e,f,b=this;b.options.centerMode===!0?b.options.infinite===!0?(e=b.currentSlide+(b.options.slidesToShow/2+1),f=e+b.options.slidesToShow+2):(e=Math.max(0,b.currentSlide-(b.options.slidesToShow/2+1)),f=2+(b.options.slidesToShow/2+1)+b.currentSlide):(e=b.options.infinite?b.options.slidesToShow+b.currentSlide:b.currentSlide,f=e+b.options.slidesToShow,b.options.fade===!0&&(e>0&&e--,f<=b.slideCount&&f++)),c=b.$slider.find(".slick-slide").slice(e,f),g(c),b.slideCount<=b.options.slidesToShow?(d=b.$slider.find(".slick-slide"),g(d)):b.currentSlide>=b.slideCount-b.options.slidesToShow?(d=b.$slider.find(".slick-cloned").slice(0,b.options.slidesToShow),g(d)):0===b.currentSlide&&(d=b.$slider.find(".slick-cloned").slice(-1*b.options.slidesToShow),g(d))},b.prototype.loadSlider=function(){var a=this;a.setPosition(),a.$slideTrack.css({opacity:1}),a.$slider.removeClass("slick-loading"),a.initUI(),"progressive"===a.options.lazyLoad&&a.progressiveLazyLoad()},b.prototype.next=b.prototype.slickNext=function(){var a=this;a.changeSlide({data:{message:"next"}})},b.prototype.pause=b.prototype.slickPause=function(){var a=this;a.autoPlayClear(),a.paused=!0},b.prototype.play=b.prototype.slickPlay=function(){var a=this;a.paused=!1,a.autoPlay()},b.prototype.postSlide=function(a){var b=this;b.$slider.trigger("afterChange",[b,a]),b.animating=!1,b.setPosition(),b.swipeLeft=null,b.options.autoplay===!0&&b.paused===!1&&b.autoPlay()},b.prototype.prev=b.prototype.slickPrev=function(){var a=this;a.changeSlide({data:{message:"previous"}})},b.prototype.progressiveLazyLoad=function(){var c,d,b=this;c=a("img[data-lazy]",b.$slider).length,c>0&&(d=a("img[data-lazy]",b.$slider).first(),d.attr("src",d.attr("data-lazy")).removeClass("slick-loading").load(function(){d.removeAttr("data-lazy"),b.progressiveLazyLoad()}).error(function(){d.removeAttr("data-lazy"),b.progressiveLazyLoad()}))},b.prototype.refresh=function(){var b=this,c=b.currentSlide;b.destroy(),a.extend(b,b.initials),b.init(),b.changeSlide({data:{message:"index",index:c}},!0)},b.prototype.reinit=function(){var b=this;b.$slides=b.$slideTrack.children(b.options.slide).addClass("slick-slide"),b.slideCount=b.$slides.length,b.currentSlide>=b.slideCount&&0!==b.currentSlide&&(b.currentSlide=b.currentSlide-b.options.slidesToScroll),b.slideCount<=b.options.slidesToShow&&(b.currentSlide=0),b.setProps(),b.setupInfinite(),b.buildArrows(),b.updateArrows(),b.initArrowEvents(),b.buildDots(),b.updateDots(),b.initDotEvents(),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().on("click.slick",b.selectHandler),b.setSlideClasses(0),b.setPosition(),b.$slider.trigger("reInit",[b])},b.prototype.removeSlide=b.prototype.slickRemove=function(a,b,c){var d=this;return"boolean"==typeof a?(b=a,a=b===!0?0:d.slideCount-1):a=b===!0?--a:a,d.slideCount<1||0>a||a>d.slideCount-1?!1:(d.unload(),c===!0?d.$slideTrack.children().remove():d.$slideTrack.children(this.options.slide).eq(a).remove(),d.$slides=d.$slideTrack.children(this.options.slide),d.$slideTrack.children(this.options.slide).detach(),d.$slideTrack.append(d.$slides),d.$slidesCache=d.$slides,d.reinit(),void 0)},b.prototype.setCSS=function(a){var d,e,b=this,c={};b.options.rtl===!0&&(a=-a),d="left"==b.positionProp?Math.ceil(a)+"px":"0px",e="top"==b.positionProp?Math.ceil(a)+"px":"0px",c[b.positionProp]=a,b.transformsEnabled===!1?b.$slideTrack.css(c):(c={},b.cssTransitions===!1?(c[b.animType]="translate("+d+", "+e+")",b.$slideTrack.css(c)):(c[b.animType]="translate3d("+d+", "+e+", 0px)",b.$slideTrack.css(c)))},b.prototype.setDimensions=function(){var a=this;if(a.options.vertical===!1?a.options.centerMode===!0&&a.$list.css({padding:"0px "+a.options.centerPadding}):(a.$list.height(a.$slides.first().outerHeight(!0)*a.options.slidesToShow),a.options.centerMode===!0&&a.$list.css({padding:a.options.centerPadding+" 0px"})),a.listWidth=a.$list.width(),a.listHeight=a.$list.height(),a.options.vertical===!1&&a.options.variableWidth===!1)a.slideWidth=Math.ceil(a.listWidth/a.options.slidesToShow),a.$slideTrack.width(Math.ceil(a.slideWidth*a.$slideTrack.children(".slick-slide").length));else if(a.options.variableWidth===!0){var b=0;a.slideWidth=Math.ceil(a.listWidth/a.options.slidesToShow),a.$slideTrack.children(".slick-slide").each(function(){b+=a.listWidth}),a.$slideTrack.width(Math.ceil(b)+1)}else a.slideWidth=Math.ceil(a.listWidth),a.$slideTrack.height(Math.ceil(a.$slides.first().outerHeight(!0)*a.$slideTrack.children(".slick-slide").length));var c=a.$slides.first().outerWidth(!0)-a.$slides.first().width();a.options.variableWidth===!1&&a.$slideTrack.children(".slick-slide").width(a.slideWidth-c)},b.prototype.setFade=function(){var c,b=this;b.$slides.each(function(d,e){c=-1*b.slideWidth*d,b.options.rtl===!0?a(e).css({position:"relative",right:c,top:0,zIndex:800,opacity:0}):a(e).css({position:"relative",left:c,top:0,zIndex:800,opacity:0})}),b.$slides.eq(b.currentSlide).css({zIndex:900,opacity:1})},b.prototype.setHeight=function(){var a=this;if(1===a.options.slidesToShow&&a.options.adaptiveHeight===!0&&a.options.vertical===!1){var b=a.$slides.eq(a.currentSlide).outerHeight(!0);a.$list.css("height",b)}},b.prototype.setOption=b.prototype.slickSetOption=function(a,b,c){var d=this;d.options[a]=b,c===!0&&(d.unload(),d.reinit())},b.prototype.setPosition=function(){var a=this;a.setDimensions(),a.setHeight(),a.options.fade===!1?a.setCSS(a.getLeft(a.currentSlide)):a.setFade(),a.$slider.trigger("setPosition",[a])},b.prototype.setProps=function(){var a=this,b=document.body.style;a.positionProp=a.options.vertical===!0?"top":"left","top"===a.positionProp?a.$slider.addClass("slick-vertical"):a.$slider.removeClass("slick-vertical"),(void 0!==b.WebkitTransition||void 0!==b.MozTransition||void 0!==b.msTransition)&&a.options.useCSS===!0&&(a.cssTransitions=!0),void 0!==b.OTransform&&(a.animType="OTransform",a.transformType="-o-transform",a.transitionType="OTransition",void 0===b.perspectiveProperty&&void 0===b.webkitPerspective&&(a.animType=!1)),void 0!==b.MozTransform&&(a.animType="MozTransform",a.transformType="-moz-transform",a.transitionType="MozTransition",void 0===b.perspectiveProperty&&void 0===b.MozPerspective&&(a.animType=!1)),void 0!==b.webkitTransform&&(a.animType="webkitTransform",a.transformType="-webkit-transform",a.transitionType="webkitTransition",void 0===b.perspectiveProperty&&void 0===b.webkitPerspective&&(a.animType=!1)),void 0!==b.msTransform&&(a.animType="msTransform",a.transformType="-ms-transform",a.transitionType="msTransition",void 0===b.msTransform&&(a.animType=!1)),void 0!==b.transform&&a.animType!==!1&&(a.animType="transform",a.transformType="transform",a.transitionType="transition"),a.transformsEnabled=null!==a.animType&&a.animType!==!1},b.prototype.setSlideClasses=function(a){var c,d,e,f,b=this;b.$slider.find(".slick-slide").removeClass("slick-active").removeClass("slick-center"),d=b.$slider.find(".slick-slide"),b.options.centerMode===!0?(c=Math.floor(b.options.slidesToShow/2),b.options.infinite===!0&&(a>=c&&a<=b.slideCount-1-c?b.$slides.slice(a-c,a+c+1).addClass("slick-active"):(e=b.options.slidesToShow+a,d.slice(e-c+1,e+c+2).addClass("slick-active")),0===a?d.eq(d.length-1-b.options.slidesToShow).addClass("slick-center"):a===b.slideCount-1&&d.eq(b.options.slidesToShow).addClass("slick-center")),b.$slides.eq(a).addClass("slick-center")):a>=0&&a<=b.slideCount-b.options.slidesToShow?b.$slides.slice(a,a+b.options.slidesToShow).addClass("slick-active"):d.length<=b.options.slidesToShow?d.addClass("slick-active"):(f=b.slideCount%b.options.slidesToShow,e=b.options.infinite===!0?b.options.slidesToShow+a:a,b.options.slidesToShow==b.options.slidesToScroll&&b.slideCount-a<b.options.slidesToShow?d.slice(e-(b.options.slidesToShow-f),e+f).addClass("slick-active"):d.slice(e,e+b.options.slidesToShow).addClass("slick-active")),"ondemand"===b.options.lazyLoad&&b.lazyLoad()},b.prototype.setupInfinite=function(){var c,d,e,b=this;if(b.options.fade===!0&&(b.options.centerMode=!1),b.options.infinite===!0&&b.options.fade===!1&&(d=null,b.slideCount>b.options.slidesToShow)){for(e=b.options.centerMode===!0?b.options.slidesToShow+1:b.options.slidesToShow,c=b.slideCount;c>b.slideCount-e;c-=1)d=c-1,a(b.$slides[d]).clone(!0).attr("id","").attr("data-slick-index",d-b.slideCount).prependTo(b.$slideTrack).addClass("slick-cloned");for(c=0;e>c;c+=1)d=c,a(b.$slides[d]).clone(!0).attr("id","").attr("data-slick-index",d+b.slideCount).appendTo(b.$slideTrack).addClass("slick-cloned");b.$slideTrack.find(".slick-cloned").find("[id]").each(function(){a(this).attr("id","")})}},b.prototype.selectHandler=function(b){var c=this,d=parseInt(a(b.target).parents(".slick-slide").attr("data-slick-index"));return d||(d=0),c.slideCount<=c.options.slidesToShow?(c.$slider.find(".slick-slide").removeClass("slick-active"),c.$slides.eq(d).addClass("slick-active"),c.options.centerMode===!0&&(c.$slider.find(".slick-slide").removeClass("slick-center"),c.$slides.eq(d).addClass("slick-center")),c.asNavFor(d),void 0):(c.slideHandler(d),void 0)},b.prototype.slideHandler=function(a,b,c){var d,e,f,g,h=null,i=this;return b=b||!1,i.animating===!0&&i.options.waitForAnimate===!0||i.options.fade===!0&&i.currentSlide===a||i.slideCount<=i.options.slidesToShow?void 0:(b===!1&&i.asNavFor(a),d=a,h=i.getLeft(d),g=i.getLeft(i.currentSlide),i.currentLeft=null===i.swipeLeft?g:i.swipeLeft,i.options.infinite===!1&&i.options.centerMode===!1&&(0>a||a>i.getDotCount()*i.options.slidesToScroll)?(i.options.fade===!1&&(d=i.currentSlide,c!==!0?i.animateSlide(g,function(){i.postSlide(d)}):i.postSlide(d)),void 0):i.options.infinite===!1&&i.options.centerMode===!0&&(0>a||a>i.slideCount-i.options.slidesToScroll)?(i.options.fade===!1&&(d=i.currentSlide,c!==!0?i.animateSlide(g,function(){i.postSlide(d)}):i.postSlide(d)),void 0):(i.options.autoplay===!0&&clearInterval(i.autoPlayTimer),e=0>d?0!==i.slideCount%i.options.slidesToScroll?i.slideCount-i.slideCount%i.options.slidesToScroll:i.slideCount+d:d>=i.slideCount?0!==i.slideCount%i.options.slidesToScroll?0:d-i.slideCount:d,i.animating=!0,i.$slider.trigger("beforeChange",[i,i.currentSlide,e]),f=i.currentSlide,i.currentSlide=e,i.setSlideClasses(i.currentSlide),i.updateDots(),i.updateArrows(),i.options.fade===!0?(c!==!0?i.fadeSlide(e,function(){i.postSlide(e)}):i.postSlide(e),i.animateHeight(),void 0):(c!==!0?i.animateSlide(h,function(){i.postSlide(e)}):i.postSlide(e),void 0)))},b.prototype.startLoad=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.hide(),a.$nextArrow.hide()),a.options.dots===!0&&a.slideCount>a.options.slidesToShow&&a.$dots.hide(),a.$slider.addClass("slick-loading")},b.prototype.swipeDirection=function(){var a,b,c,d,e=this;return a=e.touchObject.startX-e.touchObject.curX,b=e.touchObject.startY-e.touchObject.curY,c=Math.atan2(b,a),d=Math.round(180*c/Math.PI),0>d&&(d=360-Math.abs(d)),45>=d&&d>=0?e.options.rtl===!1?"left":"right":360>=d&&d>=315?e.options.rtl===!1?"left":"right":d>=135&&225>=d?e.options.rtl===!1?"right":"left":"vertical"},b.prototype.swipeEnd=function(){var c,b=this;if(b.dragging=!1,b.shouldClick=b.touchObject.swipeLength>10?!1:!0,void 0===b.touchObject.curX)return!1;if(b.touchObject.edgeHit===!0&&b.$slider.trigger("edge",[b,b.swipeDirection()]),b.touchObject.swipeLength>=b.touchObject.minSwipe)switch(b.swipeDirection()){case"left":c=b.options.swipeToSlide?b.checkNavigable(b.currentSlide+b.getSlideCount()):b.currentSlide+b.getSlideCount(),b.slideHandler(c),b.currentDirection=0,b.touchObject={},b.$slider.trigger("swipe",[b,"left"]);break;case"right":c=b.options.swipeToSlide?b.checkNavigable(b.currentSlide-b.getSlideCount()):b.currentSlide-b.getSlideCount(),b.slideHandler(c),b.currentDirection=1,b.touchObject={},b.$slider.trigger("swipe",[b,"right"])}else b.touchObject.startX!==b.touchObject.curX&&(b.slideHandler(b.currentSlide),b.touchObject={})},b.prototype.swipeHandler=function(a){var b=this;if(!(b.options.swipe===!1||"ontouchend"in document&&b.options.swipe===!1||b.options.draggable===!1&&-1!==a.type.indexOf("mouse")))switch(b.touchObject.fingerCount=a.originalEvent&&void 0!==a.originalEvent.touches?a.originalEvent.touches.length:1,b.touchObject.minSwipe=b.listWidth/b.options.touchThreshold,a.data.action){case"start":b.swipeStart(a);break;case"move":b.swipeMove(a);break;case"end":b.swipeEnd(a)}},b.prototype.swipeMove=function(a){var d,e,f,g,h,b=this;return h=void 0!==a.originalEvent?a.originalEvent.touches:null,!b.dragging||h&&1!==h.length?!1:(d=b.getLeft(b.currentSlide),b.touchObject.curX=void 0!==h?h[0].pageX:a.clientX,b.touchObject.curY=void 0!==h?h[0].pageY:a.clientY,b.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(b.touchObject.curX-b.touchObject.startX,2))),e=b.swipeDirection(),"vertical"!==e?(void 0!==a.originalEvent&&b.touchObject.swipeLength>4&&a.preventDefault(),g=(b.options.rtl===!1?1:-1)*(b.touchObject.curX>b.touchObject.startX?1:-1),f=b.touchObject.swipeLength,b.touchObject.edgeHit=!1,b.options.infinite===!1&&(0===b.currentSlide&&"right"===e||b.currentSlide>=b.getDotCount()&&"left"===e)&&(f=b.touchObject.swipeLength*b.options.edgeFriction,b.touchObject.edgeHit=!0),b.swipeLeft=b.options.vertical===!1?d+f*g:d+f*(b.$list.height()/b.listWidth)*g,b.options.fade===!0||b.options.touchMove===!1?!1:b.animating===!0?(b.swipeLeft=null,!1):(b.setCSS(b.swipeLeft),void 0)):void 0)},b.prototype.swipeStart=function(a){var c,b=this;return 1!==b.touchObject.fingerCount||b.slideCount<=b.options.slidesToShow?(b.touchObject={},!1):(void 0!==a.originalEvent&&void 0!==a.originalEvent.touches&&(c=a.originalEvent.touches[0]),b.touchObject.startX=b.touchObject.curX=void 0!==c?c.pageX:a.clientX,b.touchObject.startY=b.touchObject.curY=void 0!==c?c.pageY:a.clientY,b.dragging=!0,void 0)},b.prototype.unfilterSlides=b.prototype.slickUnfilter=function(){var a=this;null!==a.$slidesCache&&(a.unload(),a.$slideTrack.children(this.options.slide).detach(),a.$slidesCache.appendTo(a.$slideTrack),a.reinit())},b.prototype.unload=function(){var b=this;a(".slick-cloned",b.$slider).remove(),b.$dots&&b.$dots.remove(),b.$prevArrow&&"object"!=typeof b.options.prevArrow&&b.$prevArrow.remove(),b.$nextArrow&&"object"!=typeof b.options.nextArrow&&b.$nextArrow.remove(),b.$slides.removeClass("slick-slide slick-active slick-visible").css("width","")},b.prototype.unslick=function(){var a=this;a.destroy()},b.prototype.updateArrows=function(){var b,a=this;b=Math.floor(a.options.slidesToShow/2),a.options.arrows===!0&&a.options.infinite!==!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.removeClass("slick-disabled"),a.$nextArrow.removeClass("slick-disabled"),0===a.currentSlide?(a.$prevArrow.addClass("slick-disabled"),a.$nextArrow.removeClass("slick-disabled")):a.currentSlide>=a.slideCount-a.options.slidesToShow&&a.options.centerMode===!1?(a.$nextArrow.addClass("slick-disabled"),a.$prevArrow.removeClass("slick-disabled")):a.currentSlide>=a.slideCount-1&&a.options.centerMode===!0&&(a.$nextArrow.addClass("slick-disabled"),a.$prevArrow.removeClass("slick-disabled")))
},b.prototype.updateDots=function(){var a=this;null!==a.$dots&&(a.$dots.find("li").removeClass("slick-active"),a.$dots.find("li").eq(Math.floor(a.currentSlide/a.options.slidesToScroll)).addClass("slick-active"))},b.prototype.visibility=function(){var a=this;document[a.hidden]?(a.paused=!0,a.autoPlayClear()):(a.paused=!1,a.autoPlay())},a.fn.slick=function(){var g,a=this,c=arguments[0],d=Array.prototype.slice.call(arguments,1),e=a.length,f=0;for(f;e>f;f++)if("object"==typeof c||"undefined"==typeof c?a[f].slick=new b(a[f],c):g=a[f].slick[c].apply(a[f].slick,d),"undefined"!=typeof g)return g;return a},a(function(){a("[data-slick]").slick()})});
;(function(a){a.fn.unveil=function(h,j){var e=a(window),b=h||0,d=window.devicePixelRatio>1,f=d?"data-src-retina":"data-src",i=this,g;this.one("unveil",function(){var k=this.getAttribute(f);k=k||this.getAttribute("data-src");if(k){this.setAttribute("src",k);if(typeof j==="function"){j.call(this)}}});function c(){var k=i.filter(function(){var m=a(this);if(m.is(":hidden")){return}var l=e.scrollTop(),o=l+e.height(),p=m.offset().top,n=p+m.height();return n>=l-b&&p<=o+b});g=k.trigger("unveil");i=i.not(g)}e.on("scroll.unveil resize.unveil lookup.unveil",c);c();return this}})(window.jQuery||window.Zepto);

// jXHR.js (JSON-P XHR)
// v0.1 (c) Kyle Simpson
// MIT License

(function(global){
	var SETTIMEOUT = global.setTimeout, // for better compression
		doc = global.document,
		callback_counter = 0;
		
	global.jXHR = function() {
		var script_url,
			script_loaded,
			jsonp_callback,
			scriptElem,
			publicAPI = null;
			 
		function removeScript() { try { scriptElem.parentNode.removeChild(scriptElem); } catch (err) { } }
			
		function reset() {
			script_loaded = false;
			script_url = "";
			removeScript();
			scriptElem = null;
			fireReadyStateChange(0);
		}
		
		function ThrowError(msg) {
			try { publicAPI.onerror.call(publicAPI,msg,script_url); } catch (err) { throw new Error(msg); }
		}

		function handleScriptLoad() {
			if ((this.readyState && this.readyState!=="complete" && this.readyState!=="loaded") || script_loaded) { return; }
			this.onload = this.onreadystatechange = null; // prevent memory leak
			script_loaded = true;
			if (publicAPI.readyState !== 4) ThrowError("Script failed to load ["+script_url+"].");
			removeScript();
		}
		
		function fireReadyStateChange(rs,args) {
			args = args || [];
			publicAPI.readyState = rs;
			if (typeof publicAPI.onreadystatechange === "function") publicAPI.onreadystatechange.apply(publicAPI,args);
		}
				
		publicAPI = {
			onerror:null,
			onreadystatechange:null,
			readyState:0,
			open:function(method,url){
				reset();
				internal_callback = "cb"+(callback_counter++);
				(function(icb){
					global.jXHR[icb] = function() {
						try { fireReadyStateChange.call(publicAPI,4,arguments); } 
						catch(err) { 
							publicAPI.readyState = -1;
							ThrowError("Script failed to run ["+script_url+"]."); 
						}
						global.jXHR[icb] = null;
					};
				})(internal_callback);
				script_url = url.replace(/=\?/g,"=jXHR."+internal_callback);
				fireReadyStateChange(1);
			},
			send:function(){
				SETTIMEOUT(function(){
					scriptElem = doc.createElement("script");
					scriptElem.setAttribute("type","text/javascript");
					scriptElem.onload = scriptElem.onreadystatechange = function(){handleScriptLoad.call(scriptElem);};
					scriptElem.setAttribute("src",script_url);
					doc.getElementsByTagName("head")[0].appendChild(scriptElem);
				},0);
				fireReadyStateChange(2);
			},
			setRequestHeader:function(){}, // noop
			getResponseHeader:function(){return "";}, // basically noop
			getAllResponseHeaders:function(){return [];} // ditto
		};

		reset();
		
		return publicAPI;
	};
})(window);
var FactFinderAjax = {
    getTransport: function() {
        return new jXHR();
    },

    activeRequestCount: 0
};

FactFinderAjax.Response = Class.create(Ajax.Response, {

    initialize: function(request){
        this.request = request;
        var transport  = this.transport  = request.transport,
            readyState = this.readyState = transport.readyState;

        if((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
            this.status       = this.getStatus();
            this.statusText   = this.getStatusText();
            this.responseText = String.interpret(transport.responseText);
            this.headerJSON   = this._getHeaderJSON();
        }

        if(readyState == 4) {
            var xml = transport.responseXML;
            this.responseXML  = Object.isUndefined(xml) ? null : xml;
            this.responseJSON = this._getResponseJSON();
        }
    }
});

FactFinderAjax.Request = Class.create(Ajax.Request, {
    _complete: false,

    initialize: function(url, options) {
        this.options = {
            method:       'get',
            asynchronous: true,
            contentType:  'application/x-www-form-urlencoded',
            encoding:     'UTF-8',
            parameters:   '',
            evalJSON:     true,
            evalJS:       true
        };
        Object.extend(this.options, options || { });

        this.options.method = this.options.method.toLowerCase();

        if (Object.isString(this.options.parameters))
            this.options.parameters = this.options.parameters.toQueryParams();
        else if (Object.isHash(this.options.parameters))
            this.options.parameters = this.options.parameters.toObject();

        this.transport = FactFinderAjax.getTransport();
        this.request(url);
    },

    request: function(url) {
        this.url = url;
        this.method = this.options.method;
        var params = Object.clone(this.options.parameters);

        if (!['get', 'post'].include(this.method)) {
            // simulate other verbs over post
            params['_method'] = this.method;
            this.method = 'post';
        }

        this.parameters = params;

        if (params = Object.toQueryString(params)) {
            // when GET, append parameters to URL
            if (this.method == 'get')
                this.url += (this.url.include('?') ? '&' : '?') + params + '&jquery_callback=?&callback=?';
            else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
                params += '&_=';
        }

        try {

            var response = new FactFinderAjax.Response(this);
            if (this.options.onCreate) this.options.onCreate(response);
            Ajax.Responders.dispatch('onCreate', this, response);

            this.transport.open(this.method.toUpperCase(), this.url,
                this.options.asynchronous);

            if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

            this.transport.onreadystatechange = this.onStateChange.bind(this);
            this.setRequestHeaders();

            this.body = this.method == 'post' ? (this.options.postBody || params) : null;
            this.transport.send(this.body);

            /* Force Firefox to handle ready state 4 for synchronous requests */
            if (!this.options.asynchronous && this.transport.overrideMimeType)
                this.onStateChange();

        }
        catch (e) {
            this.dispatchException(e);
        }
    },

    isSameOrigin: function() {
        var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
        return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
            protocol: location.protocol,
            domain: document.domain,
            port: location.port ? ':' + location.port : ''
        }));
    }
});

var FactFinderAutocompleter = Class.create(Ajax.Autocompleter, {
    caller: null,
    rq: null,
    getUpdatedChoices: function() {
        this.startIndicator();

        var entry = encodeURIComponent(this.options.paramName) + '=' +
            encodeURIComponent(this.getToken());

        this.options.parameters = this.options.callback ?
            this.options.callback(this.element, entry) : entry;

        if(this.options.defaultParams)
            this.options.parameters += '&' + this.options.defaultParams;

        this.rq = new FactFinderAjax.Request(this.url, this.options);
        this.rq.transport.onreadystatechange = this.caller._loadData.bind(this.caller);
    },

    updateChoices: function(choices) {
        if(!this.changed && this.hasFocus) {
            this.update.innerHTML = choices;
            Element.cleanWhitespace(this.update);
            Element.cleanWhitespace(this.update.down());

            if(this.update.firstChild && this.update.select('.selectable-item')) {
                this.entryCount =
                    this.update.select('.selectable-item').length;
                for (var i = 0; i < this.entryCount; i++) {
                    var entry = this.getEntry(i);
                    entry.autocompleteIndex = i;
                    this.addObservers(entry);
                }
            } else {
                this.entryCount = 0;
            }

            this.stopIndicator();
            this.index = 0;

            if(this.entryCount==1 && this.options.autoSelect) {
                this.selectEntry();
                this.hide();
            } else {
                this.render();
            }
        }
    },

    getEntry: function(index) {
        return this.update.select('.selectable-item')[index];
    }
})

var FactFinderSuggest = Class.create(Varien.searchForm, {
    initialize : function($super, form, field, emptyText, loadDataCallback) {
        $super(form, field, emptyText);
        this.loadDataCallback = loadDataCallback;
    },

    loadDataCallback: null,

    request: null,

    initAutocomplete : function(url, destinationElement){
        this.request = new FactFinderAutocompleter(
            this.field,
            destinationElement,
            url,
            {
                parameters: 'format=JSONP',
                paramName: 'query',
                method: 'get',
                minChars: 2,
                updateElement: this._selectAutocompleteItem.bind(this),
                onShow : function(element, update) {
                    if(!update.style.position || update.style.position=='absolute') {
                        update.style.position = 'absolute';
                        Position.clone(element, update, {
                            setHeight: false,
                            offsetTop: element.offsetHeight
                        });
                    }
                    Effect.Appear(update,{duration:0});
                }
                // uncomment for debugging
                //, onHide : function(element, update) {}
            }
        );
        this.request.caller = this;
    },

    _loadData: function(data) {
        this.request.updateChoices(this.loadDataCallback(data));
    },

    _selectAutocompleteItem : function(element){
        if(element.attributes.rel) {
            document.location.href = element.attributes.rel.nodeValue;
        } else if(element.title) {
            this.form.insert('<input type="hidden" name="queryFromSuggest" value="true" />');
            this.form.insert('<input type="hidden" name="userInput" value="'+this.field.value+'" />');

            this.field.value = element.title;

            this.form.submit();
        }
    }
});

if (typeof FactFinderSuggest != 'undefined') {
    var MzentraleAutocompleter = Class.create(FactFinderAutocompleter, {
            // Column mapping of suggest entries
            columns: [],

            updateChoices: function (choices) {
                if (!this.changed && this.hasFocus) {
                    this.update.innerHTML = choices;
                    Element.cleanWhitespace(this.update);
                    Element.cleanWhitespace(this.update.down());

                    this.columns = [];
                    if (this.update.firstChild && this.update.select('.selectable-item')) {
                        this.entryCount = this.update.select('.selectable-item').length;
                        for (var i = 0; i < this.entryCount; i++) {
                            var entry = this.getEntry(i);

                            // Save position in the columns
                            var index = entry.up('.overlay-col').previousSiblings().length;
                            var entries = this.columns[index] || [];
                            entries.push(i);
                            this.columns[index] = entries;

                            entry.autocompleteIndex = i;
                            this.addObservers(entry);
                        }
                    } else {
                        this.entryCount = 0;
                    }

                    this.stopIndicator();
                    this.index = -1;

                    if (this.entryCount == 1 && this.options.autoSelect) {
                        this.hide();
                    } else {
                        this.render();
                    }
                }
            },

            onKeyPress: function (event) {
                if (this.active)
                    switch (event.keyCode) {
                        case Event.KEY_TAB:
                        case Event.KEY_RETURN:
                            this.active = false;
                            this.hide();
                            if (typeof this.getCurrentEntry() != 'undefined') {
                                this.selectEntry();
                                Event.stop(event);
                            }
                            return;
                        case Event.KEY_ESC:
                            this.hide();
                            this.active = false;
                            Event.stop(event);
                            return;
                        case Event.KEY_LEFT:
                        case Event.KEY_RIGHT:
                            this.switchColumn();
                            this.render();
                            Event.stop(event);
                            return;
                        case Event.KEY_UP:
                            this.markPrevious();
                            this.render();
                            Event.stop(event);
                            return;
                        case Event.KEY_DOWN:
                            this.markNext();
                            this.render();
                            Event.stop(event);
                            return;
                    }
                else if (event.keyCode == Event.KEY_TAB || event.keyCode == Event.KEY_RETURN ||
                    (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) return;

                this.changed = true;
                this.hasFocus = true;

                if (this.observer) {
                    clearTimeout(this.observer);
                }
                this.observer = setTimeout(this.onObserverEvent.bind(this), this.options.frequency * 1000);
            },

            _initIndex: function () {
                if (this.index < 0) this.index = 0;
            },

            /**
             * Rewritten to prevent runtime errors
             */
            selectEntry: function () {
                this.active = false;
                if (typeof this.getCurrentEntry() != 'undefined') {
                    this.updateElement(this.getCurrentEntry());
                }
            },

            markPrevious: function () {
                var currentColumn = this._getCurrentColumn();
                var prev = this.index - 1;
                if (prev < this.columns[currentColumn][0]) {
                    prev = this.columns[currentColumn][this.columns[currentColumn].length - 1];
                }
                this.index = prev;
            },

            markNext: function () {
                var next = this.index + 1;
                var currentColumn = this._getCurrentColumn();
                var lastElement = this.columns[currentColumn][this.columns[currentColumn].length - 1];
                if (next > lastElement) {
                    next = this.columns[currentColumn][0];
                }
                this.index = next;
            },

            switchColumn: function () {
                var currentColumn = this._getCurrentColumn();
                for (var i = 0; i < this.columns.length; i++) {
                    if (i != currentColumn && this.columns[i].length > 0) {
                        this.index = this.columns[i][0];
                        return;
                    }
                }
            },

            _getCurrentColumn: function () {
                this._initIndex();
                for (var i = 0; i < this.columns.length; i++) {
                    if (typeof this.columns[i] != 'undefined') {
                        for (var j = 0; j < this.columns[i].length; j++) {
                            if (this.columns[i][j] == this.index) {
                                return i;
                            }
                        }
                    }
                }
                return -1;
            }
        }
    );

    FactFinderSuggest.prototype.initAutocomplete = function (url, destinationElement) {
        this.request = new MzentraleAutocompleter(
            this.field,
            destinationElement,
            url,
            {
                parameters: 'format=JSONP',
                paramName: 'query',
                method: 'get',
                minChars: 2,
                updateElement: this._selectAutocompleteItem.bind(this),
                onShow: function (element, update) {
                    if (!update.style.position || update.style.position == 'absolute') {
                        update.style.position = 'absolute';
                        Position.clone(element, update, {
                            setHeight: false,
                            setWidth: false,
                            setLeft: false,
                            offsetTop: element.offsetHeight
                        });
                    }
                    Effect.Appear(update, {duration: 0});
                }
            }
        );
        this.request.caller = this;
    }
}

/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Varien
 * @package     js
 * @copyright   Copyright (c) 2012 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */

/**
 * @classDescription simple Navigation with replacing old handlers
 * @param {String} id id of ul element with navigation lists
 * @param {Object} settings object with settings
 */
var mainNav = function() {

    var main = {
        obj_nav :   $(arguments[0]) || $("nav"),

        settings :  {
            show_delay      :   0,
            hide_delay      :   0,
            _ie6            :   /MSIE 6.+Win/.test(navigator.userAgent),
            _ie7            :   /MSIE 7.+Win/.test(navigator.userAgent)
        },

        init :  function(obj, level) {
            obj.lists = obj.childElements();
            obj.lists.each(function(el,ind){
                main.handlNavElement(el);
                if((main.settings._ie6 || main.settings._ie7) && level){
                    main.ieFixZIndex(el, ind, obj.lists.size());
                }
            });
            if(main.settings._ie6 && !level){
                document.execCommand("BackgroundImageCache", false, true);
            }
        },

        handlNavElement :   function(list) {
            if(list !== undefined){
                list.onmouseover = function(){
                    main.fireNavEvent(this,true);
                };
                list.onmouseout = function(){
                    main.fireNavEvent(this,false);
                };
                if(list.down("ul")){
                    main.init(list.down("ul"), true);
                }
            }
        },

        ieFixZIndex : function(el, i, l) {
            if(el.tagName.toString().toLowerCase().indexOf("iframe") == -1){
                el.style.zIndex = l - i;
            } else {
                el.onmouseover = "null";
                el.onmouseout = "null";
            }
        },

        fireNavEvent :  function(elm,ev) {
            if(ev){
                elm.addClassName("over");
                //elm.down("a").addClassName("over");
                if (elm.childElements()[1]) {
                    main.show(elm.childElements()[1]);
                }
            } else {
                elm.removeClassName("over");
                //elm.down("a").removeClassName("over");
                if (elm.childElements()[1]) {
                    main.hide(elm.childElements()[1]);
                }
            }
        },

        show : function (sub_elm) {
            if (sub_elm.hide_time_id) {
                clearTimeout(sub_elm.hide_time_id);
            }
            sub_elm.show_time_id = setTimeout(function() {
                if (!sub_elm.hasClassName("shown-sub")) {
                    sub_elm.addClassName("shown-sub");
                }
            }, main.settings.show_delay);
        },

        hide : function (sub_elm) {
            if (sub_elm.show_time_id) {
                clearTimeout(sub_elm.show_time_id);
            }
            sub_elm.hide_time_id = setTimeout(function(){
                if (sub_elm.hasClassName("shown-sub")) {
                    sub_elm.removeClassName("shown-sub");
                }
            }, main.settings.hide_delay);
        }

    };
    if (arguments[1]) {
        main.settings = Object.extend(main.settings, arguments[1]);
    }
    if (main.obj_nav) {
        main.init(main.obj_nav, false);
    }
};

document.observe("dom:loaded", function() {
    //run navigation without delays and with default id="#nav"
    // mainNav();

    //run navigation with delays
    mainNav("nav", {"show_delay":"0","hide_delay":"200"});
});

/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    design
 * @package     enterprise_default
 * @copyright   Copyright (c) 2010 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */

// Add validation hints
Validation.defaultOptions.immediate = true;
Validation.defaultOptions.addClassNameToContainer = true;

Event.observe(document, 'dom:loaded', function () {
    var inputs = $$('ul.options-list input');
    for (var i = 0, l = inputs.length; i < l; i++) {
        inputs[i].addClassName('change-container-classname');
    }
})

if (!window.Enterprise) {
    window.Enterprise = {};
}
Enterprise.templatesPattern = /(^|.|\r|\n)(\{\{(.*?)\}\})/;

Enterprise.TopCart = {
    initialize: function (container, contentUrl) {
        this.container = $(container);
        this.element = this.container.up(0);
        this.elementHeader = this.container.previous(0);
        this.intervalDuration = 400;
        this.interval = null;
        this.intervalAuto = null;

        this.onElementMouseOut = this.handleMouseOut.bindAsEventListener(this);
        this.onElementMouseOver = this.handleMouseOver.bindAsEventListener(this);
        this.onElementMouseClick = this.handleMouseClick.bindAsEventListener(this);

        if (this.element != null) this.element.stopObserving();
        this.element.observe('mouseout', this.onElementMouseOut);
        this.element.observe('mouseover', this.onElementMouseOver);

        if (this.element != null) this.elementHeader.stopObserving();
        this.elementHeader.observe('click', this.onElementMouseClick);

        if (contentUrl) {
            this.contentUrl = contentUrl;
        }
    },
    handleMouseOut: function (evt) {
        if ($(this.elementHeader).hasClassName('expanded')) {
            this.interval = setTimeout(this.hideCart.bind(this), this.intervalDuration);
        }
        var _this = this;
        //this.intervalAuto = setTimeout(function () {_this.hideCartTimeout();}, 3000);
        this.intervalAuto = setTimeout(function () {_this.hideCartTimeout();}, 0);
    },
    handleMouseOver: function (evt) {
        if (this.interval !== null) {
            clearTimeout(this.interval);
            this.interval = null;
        }
        if (this.intervalAuto !== null) {
            clearTimeout(this.intervalAuto);
            this.intervalAuto = null;
        }
        if (!$(this.elementHeader).hasClassName('expanded') && !$(this.container.id).hasClassName('process')) {
            this.showCart();
        }
    },
    handleMouseClick: function (evt) {
        if (!$(this.elementHeader).hasClassName('expanded') && !$(this.container.id).hasClassName('process')) {
            this.showCart();
        }
        else {
            this.hideCart();
        }
    },
    showCart: function (timePeriod) {
        this.container.parentNode.style.zIndex = 992;
        this.container.down(0).innerHtml = 'New Content';
        /* load sidebar car content using ajax */
        var request = new Ajax.Request(this.contentUrl, {
            method: 'get',
            onCreate: function () {
            },
            onSuccess: function (transport) {
                var data = transport.responseText;
                $('toCartContentWrapper').replace(data);
            }
        });

        new Effect.SlideDown(this.container.id, { duration: 0.5,
            beforeStart: function (effect) {
                $(effect.element.id).addClassName('process');
            },
            afterFinish: function (effect) {
                $(effect.element.id).removeClassName('process');
            }
        });
        $(this.elementHeader).addClassName('expanded');
        if (timePeriod) {
            this.timePeriod = timePeriod * 1000;
            this.interval = setTimeout(this.hideCart.bind(this), this.timePeriod);
        }
    },
    hideCart: function () {
        if (!$(this.container.id).hasClassName('process') && $(this.elementHeader).hasClassName('expanded')) {
            new Effect.SlideUp(this.container.id, { duration: 0.5,
                beforeStart: function (effect) {
                    $(effect.element.id).addClassName('process');
                },
                afterFinish: function (effect) {
                    $(effect.element.id).removeClassName('process');
                    effect.element.parentNode.style.zIndex = 10;
                }
            });
        }
        if (this.interval !== null) {
            clearTimeout(this.interval);
            this.interval = null;
        }
        if (this.intervalAuto !== null) {
            clearTimeout(this.intervalAuto);
            this.intervalAuto = null;
        }
        $(this.elementHeader).removeClassName('expanded');
    },
    hideCartTimeout: function () {
        if (!$(this.container.id).hasClassName('process')) {
            new Effect.SlideUp(this.container.id, { duration: 0.5,
                beforeStart: function (effect) {
                    $(effect.element.id).addClassName('process');
                },
                afterFinish: function (effect) {
                    $(effect.element.id).removeClassName('process');
                    effect.element.parentNode.style.zIndex = 10;
                }
            });
            $(this.elementHeader).removeClassName('expanded');
        }
    }
};


Enterprise.Bundle = {
    oldReloadPrice: false,
    initialize: function () {
        this.slider = $('bundleProduct');
        this.xOffset = $('bundle-product-wrapper').getDimensions().width;
    },
    swapReloadPrice: function () {
        Enterprise.Bundle.oldReloadPrice = Product.Bundle.prototype.reloadPrice;
        Product.Bundle.prototype.reloadPrice = Enterprise.Bundle.reloadPrice;
        Product.Bundle.prototype.selection = Enterprise.Bundle.selection;
    },
    reloadPrice: function () {
        var result = Enterprise.Bundle.oldReloadPrice.bind(this)();
        var priceContainer, duplicateContainer = null
        if (priceContainer = $('bundle-product-wrapper').down('.price-box .price-as-configured')) {
            if (duplicateContainer = $('bundle-product-wrapper').down('.duplicate-price-box .price-as-configured')) {
                duplicateContainer.down('.price').update(
                    priceContainer.down('.price').innerHTML
                );
            }
        }
        if (!this.summaryTemplate && $('bundle-summary-template')) {
            this.summaryTemplate = new Template($('bundle-summary-template').innerHTML, Enterprise.templatesPattern);
            this.optionTemplate = new Template($('bundle-summary-option-template').innerHTML, Enterprise.templatesPattern);
            this.optionMultiTemplate = new Template($('bundle-summary-option-multi-template').innerHTML, Enterprise.templatesPattern);
        }

        if (this.summaryTemplate && $('bundle-summary')) {
            var summaryHTML = '';
            for (var option in this.config.options) {
                if (typeof (this.config.selected[option]) !== 'undefined') {
                    var optionHTML = '';
                    for (var i = 0, l = this.config.selected[option].length; i < l; i++) {
                        var selection = this.selection(option, this.config.selected[option][i]);
                        if (selection && this.config.options[option].isMulti) {
                            optionHTML += this.optionMultiTemplate.evaluate(selection);
                        } else if (selection) {
                            optionHTML += this.optionTemplate.evaluate(selection);
                        }
                    }

                    if (optionHTML.length > 0) {
                        summaryHTML += this.summaryTemplate.evaluate({label: this.config.options[option].title.escapeHTML(), options: optionHTML});
                    }
                }
            }

            $('bundle-summary').update(summaryHTML)
        }
        return result;
    },
    selection: function (optionId, selectionId) {
        if (selectionId == '' || selectionId == 'none') {
            return false;
        }
        var qty = null;
        if (this.config.options[optionId].selections[selectionId].customQty == 1 && !this.config['options'][optionId].isMulti) {
            if ($('bundle-option-' + optionId + '-qty-input')) {
                qty = $('bundle-option-' + optionId + '-qty-input').value;
            } else {
                qty = 1;
            }
        } else {
            qty = this.config.options[optionId].selections[selectionId].qty;
        }

        return {qty: qty, name: this.config.options[optionId].selections[selectionId].name.escapeHTML()};
    },
    start: function () {
        if (!$('bundle-product-wrapper').hasClassName('moving-now')) {
            new Effect.Move(this.slider, {
                x: -this.xOffset, y: 0, mode: 'relative', duration: 1.5,
                beforeStart: function (effect) {
                    $('bundle-product-wrapper').setStyle({height: $('productView').getHeight() + 'px'});
                    $('options-container').show();
                    Enterprise.BundleSummary.initialize();
                    $('bundle-product-wrapper').addClassName('moving-now');
                },
                afterFinish: function (effect) {
                    $('bundle-product-wrapper').setStyle({height: 'auto'});
                    $('productView').hide();
                    $('bundle-product-wrapper').removeClassName('moving-now');
                }
            });
        }
    },
    end: function () {
        if (!$('bundle-product-wrapper').hasClassName('moving-now')) {
            new Effect.Move(this.slider, {
                x: this.xOffset, y: 0, mode: 'relative', duration: 1.5,
                beforeStart: function (effect) {
                    $('bundle-product-wrapper').setStyle({height: $('options-container').getHeight() + 'px'});
                    $('productView').show();
                    $('bundle-product-wrapper').addClassName('moving-now');
                },
                afterFinish: function (effect) {
                    $('bundle-product-wrapper').setStyle({height: 'auto'});
                    $('options-container').hide();
                    Enterprise.BundleSummary.exitSummary();
                    $('bundle-product-wrapper').removeClassName('moving-now');
                }
            });
        }
    }
};

Enterprise.BundleSummary = {
    initialize: function () {
        this.summary = $('bundleSummary');
        this.summaryOffsetTop = $('customizeTitle').getDimensions().height;
        this.summary.setStyle({top: this.summaryOffsetTop + "px"});
        this.summaryContainer = this.summary.up(0);
        this.doNotCheck = false;
        this.summaryStartY = this.summary.positionedOffset().top;
        this.summaryStartY = this.summaryOffsetTop;
        this.summaryStartX = this.summary.positionedOffset().left;
        this.onDocScroll = this.handleDocScroll.bindAsEventListener(this);
        this.GetScroll = setInterval(this.onDocScroll, 50);
        this.onEffectEnds = this.effectEnds.bind(this);
    },

    handleDocScroll: function () {
        if (this.currentOffsetTop == document.viewport.getScrollOffsets().top
            && (this.checkOffset(null) == null)) {
            return;
        } else {
            if (this.currentOffsetTop == document.viewport.getScrollOffsets().top) {
                this.doNotCheck = true;
            }
            this.currentOffsetTop = document.viewport.getScrollOffsets().top;
        }

        if (this.currentEffect) {
            this.currentEffect.cancel();
            var topOffset = 0;
            if (this.summaryContainer.viewportOffset().top < -60) {
                topOffset = -(this.summaryContainer.viewportOffset().top);
            } else {
                topOffset = this.summaryStartY;
            }

            topOffset = this.checkOffset(topOffset);
            if (topOffset === null) {
                this.currentEffect = false;
                return;
            }

            this.currentEffect.start({
                x: this.summaryStartX,
                y: topOffset,
                mode: 'absolute',
                duration: 0.3,
                afterFinish: this.onEffectEnds
            });


            return;
        }


        this.currentEffect = new Effect.Move(this.summary);
    },

    effectEnds: function () {
        if (this.doNotCheck == true) {
            this.doNotCheck = false;
        }
    },

    checkOffset: function (offset) {
        if (this.doNotCheck && offset === null) {
            return null;
        }
        var dimensions = this.summary.getDimensions();
        var parentDimensions = this.summary.up().getDimensions();
        if ((offset !== null ? offset : this.summary.offsetTop) + dimensions.height >= parentDimensions.height) {
            offset = parentDimensions.height - dimensions.height;
        } else if (offset === null &&
            this.currentOffsetTop > (this.summaryContainer.viewportOffset().top) &&
            (this.currentOffsetTop - this.summaryContainer.viewportOffset().top) > this.summary.offsetTop) {
            offset = this.currentOffsetTop - this.summaryContainer.viewportOffset().top;
        }


        return offset;
    },

    exitSummary: function () {
        clearInterval(this.GetScroll);
    }
};

Enterprise.Tabs = Class.create();
Object.extend(Enterprise.Tabs.prototype, {
    initialize: function (container) {
        this.container = $(container);
        this.container.addClassName('tab-list');
        this.tabs = this.container.select('dt.tab');
        this.activeTab = this.tabs.first();
        this.tabs.first().addClassName('first');
        this.tabs.last().addClassName('last');
        this.onTabClick = this.handleTabClick.bindAsEventListener(this);
        for (var i = 0, l = this.tabs.length; i < l; i++) {
            this.tabs[i].observe('click', this.onTabClick);
        }
        this.select();
    },
    handleTabClick: function (evt) {
        this.activeTab = Event.findElement(evt, 'dt');
        this.select();
    },
    select: function () {
        for (var i = 0, l = this.tabs.length; i < l; i++) {
            if (this.tabs[i] == this.activeTab) {
                this.tabs[i].addClassName('active');
                this.tabs[i].style.zIndex = this.tabs.length + 2;
                /*this.tabs[i].next('dd').show();*/
                new Effect.Appear(this.tabs[i].next('dd'), { duration: 0.1 });
                this.tabs[i].parentNode.style.height = this.tabs[i].next('dd').getHeight() + 24 + 'px';
            } else {
                this.tabs[i].removeClassName('active');
                this.tabs[i].style.zIndex = this.tabs.length + 1 - i;
                this.tabs[i].next('dd').hide();
            }
        }
    }
});


Enterprise.Slider = Class.create();

Object.extend(Enterprise.Slider.prototype, {
    initialize: function (container, config) {
        this.container = $(container);
        this.config = {
            panelCss: 'slider-panel',
            sliderCss: 'slider',
            itemCss: 'slider-item',
            slideButtonCss: 'slide-button',
            slideButtonInactiveCss: 'inactive',
            forwardButtonCss: 'forward',
            backwardButtonCss: 'backward',
            pageSize: 6,
            scrollSize: 2,
            slideDuration: 1.0,
            slideDirection: 'horizontal',
            fadeEffect: true
        };

        Object.extend(this.config, config || {});

        this.items = this.container.select('.' + this.config.itemCss);
        this.isPlaying = false;
        this.isAbsolutized = false;
        this.offset = 0;
        this.onClick = this.handleClick.bindAsEventListener(this);
        this.sliderPanel = this.container.down('.' + this.config.panelCss);
        this.slider = this.sliderPanel.down('.' + this.config.sliderCss);
        this.container.select('.' + this.config.slideButtonCss).each(
            this.initializeHandlers.bind(this)
        );
        this.updateButtons();

        Event.observe(window, 'load', this.initializeDimensions.bind(this));
    },
    initializeHandlers: function (element) {
        if (element.hasClassName(this.config.forwardButtonCss) ||
            element.hasClassName(this.config.backwardButtonCss)) {
            element.observe('click', this.onClick);
        }
    },
    handleClick: function (evt) {
        var element = Event.element(evt);
        if (!element.hasClassName(this.config.slideButtonCss)) {
            element = element.up('.' + this.config.slideButtonCss);
        }

        if (!element.hasClassName(this.config.slideButtonInactiveCss)) {
            element.hasClassName(this.config.forwardButtonCss) || this.backward();
            element.hasClassName(this.config.backwardButtonCss) || this.forward();
        }
        Event.stop(evt);
    },
    updateButtons: function () {
        var buttons = this.container.select('.' + this.config.slideButtonCss);
        for (var i = 0, l = buttons.length; i < l; i++) {
            if (buttons[i].hasClassName(this.config.backwardButtonCss)) {
                if (this.offset <= 0) {
                    buttons[i].addClassName(this.config.slideButtonInactiveCss);
                }
                else {
                    buttons[i].removeClassName(this.config.slideButtonInactiveCss);
                }
            } else if (buttons[i].hasClassName(this.config.forwardButtonCss)) {
                if (this.offset >= this.items.length - this.config.pageSize) {
                    buttons[i].addClassName(this.config.slideButtonInactiveCss);
                }
                else {
                    buttons[i].removeClassName(this.config.slideButtonInactiveCss);
                }
            }
        }
    },
    initializeDimensions: function () {
        if ((this.config.slideDirection == 'horizontal' && this.sliderPanel.style.width) ||
            (this.config.slideDirection != 'horizontal' && this.sliderPanel.style.height)) {
            return this;
        }
        var firstItem = this.items.first();
        var offset = 0;
        if (this.config.slideDirection == 'horizontal') {
            offset = (parseInt(firstItem.getStyle('margin-left')) + parseInt(firstItem.getStyle('margin-right'))) * (this.config.pageSize - 1);
            this.sliderPanel.setStyle({width: (firstItem.getDimensions().width * this.config.pageSize + offset) + 'px'});
        } else {
            offset = (parseInt(firstItem.getStyle('margin-bottom')) + parseInt(firstItem.getStyle('margin-top'))) * (this.config.pageSize - 1);
            this.sliderPanel.setStyle({height: (firstItem.getDimensions().height * this.config.pageSize + offset) + 'px'});
        }

        var dimensions = this.sliderPanel.getDimensions();

        var sliderParent = this.sliderPanel.up();
        /*
         dimensions.height += parseInt(sliderParent.getStyle('padding-top'));
         dimensions.height += parseInt(sliderParent.getStyle('padding-bottom'));
         dimensions.width += parseInt(sliderParent.getStyle('padding-left'));
         dimensions.width += parseInt(sliderParent.getStyle('padding-right'));

         if (sliderParent.down('.slide-button')) {
         var buttonDimensions = sliderParent.down('.slide-button').getDimensions();
         if (this.config.slideDirection == 'horizontal') {
         dimensions.width += 2 * buttonDimensions.width;
         } else {
         dimensions.height += 2 * buttonDimensions.height;
         }
         }
         */
        sliderParent.setStyle({
            width: dimensions.width + 'px',
            height: dimensions.height + 'px'
        });
        return this;
    },
    absolutize: function () {
        if (!this.isAbsolutized) {
            this.isAbsolutized = true;
            var dimensions = this.sliderPanel.getDimensions();
            this.sliderPanel.setStyle({
                height: dimensions.height + 'px',
                width: dimensions.width + 'px'
            });

            this.slider.absolutize();
        }
    },

    forward: function () {
        if (this.offset + this.config.pageSize <= this.items.length - 1) {
            this.slide(true);
        }
    },
    backward: function () {
        if (this.offset > 0) {
            this.slide(false);
        }
    },
    slide: function (isForward) {

        if (this.isPlaying) {
            return;
        }
        this.absolutize();
        this.effectConfig = {
            duration: this.config.slideDuration
        };
        if (this.config.slideDirection == 'horizontal') {
            this.effectConfig.x = this.getSlidePosition(isForward).left;
        } else {
            this.effectConfig.y = this.getSlidePosition(isForward).top;
        }
        this.start();

    },
    start: function () {
        if (this.config.fadeEffect) {
            this.fadeIn();
        } else {
            this.move();
        }
    },
    fadeIn: function () {
        new Effect.Fade(this.slider.up('div.slider-panel'), {
            from: 1.0,
            to: 0.5,
            afterFinish: this.move.bind(this),
            beforeStart: this.effectStarts.bind(this),
            duration: 0.3
        });
    },
    fadeOut: function () {
        new Effect.Fade(this.slider.up('div.slider-panel'), {
            from: 0.5,
            to: 1.0,
            afterFinish: this.effectEnds.bind(this),
            duration: 0.3
        });
    },
    move: function () {
        if (this.config.fadeEffect) {
            this.effectConfig.afterFinish = this.fadeOut.bind(this);
        } else {
            this.effectConfig.afterFinish = this.effectEnds.bind(this);
            this.effectConfig.beforeStart = this.effectStarts.bind(this);
        }

        new Effect.Move(this.slider, this.effectConfig);
    },
    effectStarts: function () {
        this.isPlaying = true;
    },
    effectEnds: function () {
        this.isPlaying = false;
        this.updateButtons();
    },
    getSlidePosition: function (isForward) {
        var targetOffset;
        if (isForward) {
            targetOffset = Math.min(this.items.length - this.config.pageSize, this.offset + this.config.scrollSize)
        }
        else {
            targetOffset = Math.max(this.offset - this.config.scrollSize, 0);
        }
        this.offset = targetOffset;
        var item = this.items[targetOffset];
        var itemOffset = {left: 0, top: 0};

        itemOffset.left = -(item.cumulativeOffset().left
            - this.slider.cumulativeOffset().left + this.slider.offsetLeft);
        itemOffset.top = -(item.cumulativeOffset().top
            - this.slider.cumulativeOffset().top + this.slider.offsetTop);
        return itemOffset;
    }
});

Enterprise.PopUpMenu = {
    currentPopUp: null,
    documentHandlerInitialized: false,
    popUpZIndex: 994,
    hideDelay: 2000,
    hideOnClick: true,
    hideInterval: null,
    //
    initializeDocumentHandler: function () {
        if (!this.documentHandlerInitialized) {
            this.documentHandlerInitialized = true;
            Event.observe(
                document.body,
                'click',
                this.handleDocumentClick.bindAsEventListener(this)
            );
        }
    },
    handleDocumentClick: function (evt) {
        if (this.currentPopUp !== null) {
            var element = Event.element(evt);
            if (!this.currentPopUp.onlyShowed && this.hideOnClick) {
                this.hide();
            } else {
                this.currentPopUp.onlyShowed = false;
            }
        }
    },
    handlePopUpOver: function (evt) {
        if (this.currentPopUp !== null) {
            this.currentPopUp.removeClassName('faded');
            this.resetTimeout(0);
        }
    },
    handlePopUpOut: function (evt) {
        if (this.currentPopUp !== null) {
            this.currentPopUp.addClassName('faded');
            this.resetTimeout(1);
        }
    },
    show: function (trigger) {
        this.initializeDocumentHandler();

        var container = $(trigger).up('.switch-wrapper');
        if (!$('popId-' + container.id)) {
            return;
        }

        if (this.currentPopUp !== null && $('popId-' + container.id) !== this.currentPopUp) {
            this.hide(true);
        } else if (this.currentPopUp !== null && this.currentPopUp === $('popId-' + container.id)) {
            this.hide();
            return;
        }

        this.currentPopUp = $('popId-' + container.id);
        this.currentPopUp.container = container;
        this.currentPopUp.container.oldZIndex = this.currentPopUp.container.style.zIndex;
        this.currentPopUp.container.style.zIndex = this.popUpZIndex;
        new Effect.Appear(this.currentPopUp, { duration: 0.3 });


        if (!this.currentPopUp.isHandled) {
            this.currentPopUp.observe('mouseover', this.handlePopUpOver.bindAsEventListener(this));
            this.currentPopUp.observe('mouseout', this.handlePopUpOut.bindAsEventListener(this));
            this.currentPopUp.isHandled = true;
        }
        this.currentPopUp.onlyShowed = true;
        this.currentPopUp.container.down('.switcher').addClassName('list-opened');
        this.resetTimeout(2);
    },
    hide: function () {
        if (this.currentPopUp !== null) {
            if (arguments.length == 0) {
                new Effect.Fade(this.currentPopUp, {duration: 0.3});
            } else {
                this.currentPopUp.hide();
            }
            this.currentPopUp.container.style.zIndex = this.currentPopUp.container.oldZIndex;
            this.resetTimeout(0);
            this.currentPopUp.container.down('.switcher').removeClassName('list-opened');
            this.currentPopUp = null;
        }
    },
    resetTimeout: function (delay) {
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        if (delay) {
            this.hideTimeout = setTimeout(
                this.hide.bind(this),
                this.hideDelay * delay
            );
        }
    }
};


function popUpMenu(element) {
    Enterprise.PopUpMenu.show(element);
}
/*
 function popUpMenu(element,trigger) {
 var iDelay = 2000;
 var new_popup = 0;
 var sTempId = 'popUped';
 if (document.getElementById(sTempId)) {
 var eTemp = document.getElementById(sTempId);
 $(sTempId).previous(0).down('.switcher').removeClassName('list-opened');
 new Effect.Fade (eTemp, { duration:0.3 });
 eTemp.id = sNativeId;
 clearTimeout(tId);
 document.onclick = null;
 }

 sNativeId = 'popId-'+$(element).up(1).id;
 var el = $(sNativeId);
 el.id = sTempId;

 if (eTemp && el == eTemp) {
 hideElement();
 } else {
 $(element).addClassName('list-opened');
 $(sTempId).getOffsetParent().style.zIndex = 994;
 new Effect.Appear (el, { duration:0.3 });
 tId=setTimeout("hideElement()",2*iDelay);
 }
 new_popup = 1;
 document.onclick = function() {
 if (!new_popup) {
 hideElement();
 document.onclick = null;
 }
 new_popup = 0;
 }

 el.onmouseout = function() {
 if ($(sTempId)) {
 $(sTempId).addClassName('faded');
 tId=setTimeout("hideElement()",iDelay);
 }
 }

 el.onmouseover = function() {
 if ($(sTempId)) {
 $(sTempId).removeClassName('faded');
 clearTimeout(tId);
 }
 }

 hideElement = function() {
 //el.hide();
 new Effect.Fade (el, { duration:0.3 });
 $(element).removeClassName('list-opened');
 el.getOffsetParent().style.zIndex = 1;
 el.id = sNativeId;
 if (tId) {clearTimeout(tId);}
 }
 } */


/**
 * Store value in the document cookie
 *
 * @param string name     Name of the variable to store
 * @param string value    Value of the variable
 * @param string path     Path in which the cookie will be valid
 * @param integer seconds Number of seconds after which the cookie will be invalid
 */
function cookieSet(name, value, path, seconds) {
    var expires;
    if (seconds) {
        var date = new Date();
        date.setTime(date.getTime() + (seconds * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    var path = "; path=" + path;
    document.cookie = name + "=" + value + expires + path;
}


/**
 * Deletes product from topcart via ajax request (see cartajax controller)
 *
 * @param id
 */
function cartAjaxDeleteProduct(url, id) {
    new Ajax.Request(url, {
        method: 'get',
        parameters: {'id': id},
        onSuccess: function (transport) {
            data = transport.responseText.evalJSON();
            if (data.error == true) {
                mzoverlay.open('product-view-message-box');
                $('product-view-message').update(data.message);
            } else {
                $('top-cart').replace(data.topcart);
                Enterprise.TopCart.initialize('topCartContent');
                Enterprise.TopCart.showCart(3);
            }
        }
    });
}

/**
 * MZOverlay
 * 
 * Moves the element with the given id (contentId) into an overlay and shows the whole thing.
 * After closing the overlay, the element is moved back to its old position.
 * 
 * CSS styles are not included in this script! You have to set it manually (so there is a 
 * strict breakup between different programming languages and the styles are set for the whole system 
 * in one css line (and not in the overlay itself or in each javascript call of the overlay *grusel*)
 * 
 * Example:
 * #mzoverlay-content{ background: #fff; max-width: 950px; z-index: 10002; border: 1px solid #ccc; padding: 20px; text-align: left; }
 * #mzoverlay-content .close{ width: 17px; height: 17px; position: absolute; top: 10px; right: 10px; background: url("../images/i_icons.gif") no-repeat left -208px; cursor: pointer; }
 * #mzoverlay{ background: #fff; z-index: 10001; width: 100%; height: 100%; top: 0; left: 0; }
 * #mzoverlay-loading{ width: 300px; height: 200px; background: url("../images/loading.gif") no-repeat center center;  }
 * a.mzoverlay-open{ cursor: pointer; }
 * #mzoverlay-custom-loading{ width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: #fff url("../images/loading.gif") no-repeat center center; -ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=80)"; -moz-opacity:0.8; opacity:0.8; filter:alpha(opacity = 80); z-index: 100;}
 * 
 * Usage of the script:
 * ------------------------------------------
 * <div id="myid" style="display: none; width: 400px;">
 *  *** your content ***
 * </div>
 * <a class="mzoverlay-open" onclick="mzoverlay.open('myid', {'modal':true})">Open mzoverlay</a>
 * ------------------------------------------
 * 
 * You can also define a non existing id -> the element will be created automatically in the overlay div
 * for easily use with ajax - automatically a loading wheel will be shown!
 * if you got your data from the ajax request, use mzoverlay.updateContent('data') for updating the content
 * with autoresizing ;-)
 * 
 * if you do some ajax request with an opened overlay, you can use the methods 
 * mzoverlay.showLoadingWheel() or mzoverlay.hideLoadingWheel() 
 * for the loading wheel
 * 
 * (c) 2011, Benjamin Zaiser, b.zaiser@mzentrale.de
 * 
 */

MZOverlay = Class.create();
MZOverlay.prototype = {
	//Attributes
	opacity: 80,
	content: null,
	nextElement: null,
	previousElement: null,
	contentWrapper: null,
	background: null,
	options: null,
	defaults: null,
	loadingWheel: null,
	
	
	//Constructor
	initialize: function() {
		this.defaults = {
			'modal': false
		};
		
		//Extend document with prototype functions (important for IE)
		Element.extend(document);
	    Element.extend(document.documentElement);
	},
	
	
	//Methods
	/**
	 * Get options, with fallback to defaults; if not set returns null
	 * 
	 * @param key (see constructor for defaults)
	 * @return option value
	 */
	option: function(key){
		if(this.options != undefined && this.options[key] != undefined){
			return this.options[key];
		}
		else if(this.defaults != undefined && this.defaults[key] != undefined){
			return this.defaults[key];
		}
		else{
			return null;
		}
	},
	
	/**
	 * Creates a new overlay and shows the content of contentId in the overlay
	 * If element with contentId is not available, a new element will be created!
	 * So you can use it easily for ajax overlays just open overlay with mzoverlay.open('loading')
	 * (do some css for ajax-loader-gif) and send the ajax request
	 * 
	 * @param contentId
	 * @param options
	 * @return
	 */
	open: function(contentId, options) {
		this.options = options;
		
		//Background
		this.background = this.generateBackground();
		document.body.appendChild(this.background);
		if(this.option('modal') == false){
			this.background.observe('click', function(event){
				mzoverlay.close();
			});
		}
		
		//Overlay Box
		this.contentWrapper = new Element('div', {'id':'mzoverlay-content', 'class':contentId+'-box'});
		this.contentWrapper.id = 'mzoverlay-content';
		this.contentWrapper.hide();
		
		//Close Button
		if(this.option('modal') == false){
			closeButton = new Element('div');
			closeButton.addClassName('close');
			this.contentWrapper.appendChild(closeButton);
			closeButton.observe('click', function(event){
				mzoverlay.close();
			});
		}
		
		//Custom Loading Div - useful for ajax operations in the overlay
		this.loadingWheel = new Element('div', {'id':'mzoverlay-custom-loading'});
		this.loadingWheel.id = 'mzoverlay-custom-loading';
		this.loadingWheel.hide();
		this.contentWrapper.appendChild(this.loadingWheel);

		//Content
		this.content = $(contentId);
		if(this.content == null){
			//create new div with given id
			this.content = new Element('div', {id:contentId});
			this.content.id = contentId;
			loading = new Element('div', {id:'mzoverlay-loading'});
			loading.id = 'mzoverlay-loading';

			loading.show();
			this.content.update(loading);
		}
		
		this.previousElement = this.content.previous();
		this.nextElement = this.content.next();
		
		this.doRepositioning();	
		//do automatic repositioning on viewport dimensions change
		Event.observe(window, 'resize', function(){
			mzoverlay.doRepositioning();
		});
		
		this.contentWrapper.appendChild(this.content);
		document.body.appendChild(this.contentWrapper);
		
		//IE6 Bugfixing
		if(typeof document.body.style.maxHeight == "undefined"){
			selects = $$('.page select, #page select');
			for(i=0; i<selects.length; i++){
                selects[i].style.visibility = 'hidden';
            }
			mzoverlay.doBackgroundRepositioning();
			Event.observe(window, 'scroll', function(){
				mzoverlay.doBackgroundRepositioning();
			});
		}
		
		//show the thing
		new Effect.Fade('mzoverlay', { duration: 0.15, from:0.0, to: this.opacity/100, queue: 'end', afterFinish: function(){
			mzoverlay.content.show();
			mzoverlay.doRepositioning();
			new Effect.Appear(mzoverlay.contentWrapper, { queue: 'end' });
		}});
	},
	
	/**
	 * Closes overlay and restores the dom
	 * 
	 * @return 
	 */
	close: function() {
		if($('mzoverlay') != null && $('mzoverlay-content') != null) {
			Effect.DropOut('mzoverlay-content', {queue: 'end', afterFinish: function(){
				//element with contentId has to be restored to old position in dom!
				mzoverlay.content.hide();
				if(mzoverlay.nextElement != null){
					mzoverlay.nextElement.up().insert({ top: mzoverlay.content });
				}
				else if(mzoverlay.previousElement != null){
					mzoverlay.previousElement.up().insert({ after: mzoverlay.content });	
				}
				if($('mzoverlay-content') != null){
					$('mzoverlay-content').remove();
				}
				
				//additionally, fade background
				Effect.Fade('mzoverlay', { duration: 0.15, queue: 'end', afterFinish: function(){
					if($('mzoverlay') != null){
						$('mzoverlay').remove();
					}
				}});	
			}});
		}
		
        //IE6 Bugfix
        if(typeof document.body.style.maxHeight == "undefined"){
        	selects = $$('.page select, #page select');
            for(i=0; i<selects.length; i++){
                selects[i].style.visibility = 'visible';
            }
        }
	},
	
	/**
	 * Generates a semitransparent div width width and height = 100%
	 * 
	 * @return element
	 */
	generateBackground: function(){
		myDiv = new Element('div');
		
		// CSS
		//IE6 Bugfix
		if(typeof document.body.style.maxHeight == "undefined"){
			myDiv.style.position = "absolute";	
		}
		else{
			myDiv.style.position = "fixed";
		}
		myDiv.id = 'mzoverlay';
	    
		// Opacity
        myDiv.style.opacity = 0.8; /* IE9 + IE 10 fix, was 0 before */
		myDiv.style.MozOpacity = 0;
		myDiv.style.KhtmlOpacity = 0;
		myDiv.style.filter = "alpha(opacity=" + 0 + ")";
		
		return myDiv;
	},

	/**
	 * Positions the overlay in the center of the viewport
	 * 
	 * @return 
	 */
	doRepositioning: function(){
		//get dimensions
		dimContent = mzoverlay.contentWrapper.getDimensions();
		dimViewport = document.viewport.getDimensions();

		newX = dimViewport.width/2 - dimContent.width/2;
		newY = dimViewport.height/2 - dimContent.height/2;
		if(newY < 0) newY = 0;
        newY += document.viewport.getScrollOffsets().top;
		
		//mittig positionieren
		this.contentWrapper.setStyle({'position':'absolute'});
		this.contentWrapper.setStyle({'left': newX + 'px'});
		this.contentWrapper.setStyle({'top': newY + 'px'});
	},
	
	/**
	 * Do repositioning of the background image for ie6 -> if the user scrolls
	 * 
	 * @return
	 */
	doBackgroundRepositioning: function(){
		viewport_dims = document.viewport.getDimensions();
		document_dims = document.documentElement.getDimensions();
	    document_offsets = document.documentElement.cumulativeOffset();
		viewport_scroll_offsets = document.viewport.getScrollOffsets();
		
		//for background positioning
	    width = Math.max(document_dims.width + document_offsets.left, viewport_dims.width + viewport_scroll_offsets.left);
	    height = Math.max(document_dims.height + document_offsets.top, viewport_dims.height + viewport_scroll_offsets.top);

	    this.background.style.height = height + 'px'; 
	    this.background.style.left = 0;
	    this.background.style.top = 0;
	},
	
	/**
	 * Update the content with new content (maybe loaded by ajax request)
	 * also with nice animation
	 * @param content
	 */
	updateContent: function(content){
		//get new dimensions
		holder = new Element('div');
		holder.hide();
		$(document.body).appendChild(holder);
		holder.update(content);
		dim = holder.getDimensions();
		$(holder).remove();
		
		//Morph overlay and show new content
		dimViewport = document.viewport.getDimensions();
		viewport_scroll_offsets = document.viewport.getScrollOffsets();
		
		newX = Math.floor((dimViewport.width/2) - (dim.width/2) - 20); //20 = Padding-Left, see CSS!
		newY = Math.floor((dimViewport.height/2) - (dim.height/2));
		if(newY < viewport_scroll_offsets.top) newY = viewport_scroll_offsets.top;
		
		new Effect.Parallel([
		    //New Position
			new Effect.Move(mzoverlay.contentWrapper, {
				x: newX,
				y: newY,
				mode: 'absolute',
				sync: true
			}),
		    //New Size (we have to resize the loading div - otherwise the wheel won't be in the center in ie's			
			new Effect.Morph($('mzoverlay-loading'), {
				style: { 
					width: dim.width + 'px', 
					height: dim.height + 'px'
				},
				sync: true
			}),
		    //New Size			
			new Effect.Morph(mzoverlay.content, { 
				style: { 
					width: dim.width + 'px', 
					height: dim.height + 'px'
				},
				afterFinish: function(){ mzoverlay.content.update(content); },
				sync: true
			})
		]);
	},
	
	/**
	 * Shows a loading wheel in the overlay
	 * useful for ajax requests with opened overlay
	 */
	showLoadingWheel: function(){
		this.loadingWheel.show();
	},
	
	/**
	 * Hides the loading wheel,
	 * use it after your ajax request ist completed
	 */
	hideLoadingWheel: function(){
		this.loadingWheel.hide();
	}
};

var mzoverlay = new MZOverlay();
/**
 * MZStoreviewselector
 *
 * (c) 2010, Benjamin Zaiser, b.zaiser@mzentrale.de
 */
var lang = null;
var geoIpCountryCode = '';
var pleaseChoose = '';
var pleaseChooseLanguage = '';
var cookieContent = '';
var chosenStoreViewCode = '';
var chosenCountryIso = '';
var data = '';
var chosenLanguage = '';
var pleaseChooseOptions = '';

function setRtl(){
    $$('#storeviewselect .mzss-region')[0].addClassName('rtl');
    $$('#storeviewselect .mzss-country')[0].addClassName('rtl');
    $$('#storeviewselect .mzss-language')[0].addClassName('rtl');
    $('storeviewselect').setAttribute('dir', "rtl");
}
function resetRtl(){
    $$('#storeviewselect .mzss-region')[0].removeClassName('rtl');
    $$('#storeviewselect .mzss-country')[0].removeClassName('rtl');
    $$('#storeviewselect .mzss-language')[0].removeClassName('rtl');
    $('storeviewselect').setAttribute('dir', "ltr");
}

/**
 * Set all content to English
 */
function setEN(){
    if($('mzss-region') == null){
        //There is something wrong with the dom
        return;
    }
    resetRtl();
    lang = 'EN';
    initSelectboxes(lang);
    selectSelects(geoIpCountryCode);
    $$('#storeviewselect .infotext')[0].update('<p>Please note: the items in your shopping bag may be deleted if you change your region or your delivery country.</p>');
    $$('#storeviewselect label[for="mzss-region"]')[0].update('Your region');
    $$('#storeviewselect label[for="mzss-country"]')[0].update('Your delivery country');
    $$('#storeviewselect label[for="mzss-language"]')[0].update('Your language');
    $$('#storeviewselect #headline_en')[0].show();
    $$('#storeviewselect #headline_de')[0].hide();
    $$('#storeviewselect #headline_it')[0].hide();
    $$('#storeviewselect #headline_fr')[0].hide();
    $$('#storeviewselect #headline_ar')[0].hide();
    $$('#storeviewselect #mzss-submitbutton span span')[0].update('Continue shopping');
    $('seten').update('English');
    $('setde').update('German');
    $('setit').update('Italian');
    $('setfr').update('French');
    $('setar').update('العربیة');
    pleaseChooseNew = 'Please choose...';
    pleaseChooseLanguage = 'Please choose a language';
    pleaseChooseOptions = 'Please fill in and complete your details.';
    $$('#storeviewselect option').each(function(item){
        if(item.innerHTML == pleaseChoose){
            item.update(pleaseChooseNew);
        }
    });
    pleaseChoose = pleaseChooseNew;
}

/**
 * Set all content to Arab
 */
function setAR(){
    if($('mzss-region') == null){
        //There is something wrong with the dom
        return;
    }
    setRtl();
    lang = 'AR';
    initSelectboxes(lang);
    selectSelects(geoIpCountryCode);
    $$('#storeviewselect .infotext')[0].update('<p>ملاحظة هامة : قد يتم حذف العناصر في حقيبة التسوق الخاصة بك إذا قمت بتغيير المنطقة أو بلد الشحن.</p>');
    $$('#storeviewselect label[for="mzss-region"]')[0].update('المنطقة');
    $$('#storeviewselect label[for="mzss-country"]')[0].update('بلد الشحن');
    $$('#storeviewselect label[for="mzss-language"]')[0].update('اللغة');
    $$('#storeviewselect #headline_en')[0].hide();
    $$('#storeviewselect #headline_de')[0].hide();
    $$('#storeviewselect #headline_it')[0].hide();
    $$('#storeviewselect #headline_fr')[0].hide();
    $$('#storeviewselect #headline_ar')[0].show();
    $$('#storeviewselect #mzss-submitbutton span span')[0].update('تابع التسوق');
    $('seten').update('الإنجليزية');
    $('setde').update('الألمانية');
    $('setit').update('الإيطالية');
    $('setfr').update('الفرنسية');
    $('setar').update('العربیة');
    pleaseChooseNew = 'الرجاء اختيار';
    pleaseChooseLanguage = 'الرجاء اختيار اللغة';
    pleaseChooseOptions = 'الرجاء ملء واستكمال التفاصيل الخاصة بك';
    $$('#storeviewselect option').each(function(item){
        if(item.innerHTML == pleaseChoose){
            item.update(pleaseChooseNew);
        }
    });
    pleaseChoose = pleaseChooseNew;
}

/**
 * Set all content to German
 */
function setDE(){
    if($('mzss-region') == null){
        //There is something wrong with the dom
        return;
    }
    resetRtl();
    lang = 'DE';
    initSelectboxes(lang);
    selectSelects(geoIpCountryCode);
    $$('#storeviewselect .infotext')[0].update('<p>Bitte beachten Sie: Wenn Sie die Region oder das Lieferland wechseln,<br/>kann der Inhalt Ihres Warenkorbs verloren gehen.</p>');
    $$('#storeviewselect label[for="mzss-region"]')[0].update('Ihre Region');
    $$('#storeviewselect label[for="mzss-country"]')[0].update('Ihr Lieferland');
    $$('#storeviewselect label[for="mzss-language"]')[0].update('Ihre Sprache');
    $$('#headline_en')[0].hide();
    $$('#headline_it')[0].hide();
    $$('#headline_fr')[0].hide();
    $$('#headline_de')[0].show();
    $$('#headline_ar')[0].hide();
    $$('#storeviewselect #mzss-submitbutton span span')[0].update('Weiter zum Shoppen');
    $('seten').update('englisch');
    $('setde').update('deutsch');
    $('setit').update('italienisch');
    $('setfr').update('französisch');
    $('setar').update('العربیة');
    pleaseChooseNew = 'Bitte wählen...';
    pleaseChooseLanguage = 'Bitte wählen Sie eine Sprache aus';
    pleaseChooseOptions = 'Bitte vervollständigen Sie Ihre Angaben.';
    $$('#storeviewselect option').each(function(item){
        if(item.innerHTML == pleaseChoose){
            item.update(pleaseChooseNew);
        }
    });
    pleaseChoose = pleaseChooseNew;
}

/**
 * Set all content to Italian
 */
function setIT(){
    if($('mzss-region') == null){
        //There is something wrong with the dom
        return;
    }
    resetRtl();
    lang = 'IT';
    initSelectboxes(lang);
    selectSelects(geoIpCountryCode);
    $$('#storeviewselect .infotext')[0].update("<p>Si prega di tenere presente che modificando il Paese di consegna il contenuto del carrello potrebbe essere cancellato.</p>");
    $$('#storeviewselect label[for="mzss-region"]')[0].update('Continente');
    $$('#storeviewselect label[for="mzss-country"]')[0].update('Paese di consegna');
    $$('#storeviewselect label[for="mzss-language"]')[0].update('Lingua');
    $$('#headline_en')[0].hide();
    $$('#headline_de')[0].hide();
    $$('#headline_fr')[0].hide();
    $$('#headline_it')[0].show();
    $$('#headline_ar')[0].hide();
    $$('#storeviewselect #mzss-submitbutton span span')[0].update('Continua lo shopping');
    $('seten').update('Inglese');
    $('setde').update('Tedesco');
    $('setit').update('Italiano');
    $('setfr').update('Fran&ccedil;ais');
    $('setar').update('العربیة');
    pleaseChooseNew = 'Seleziona';
    pleaseChooseLanguage = 'Prego scegliere una lingua';
    pleaseChooseOptions = 'Si prega di inserire tutte le informazioni';
    $$('#storeviewselect option').each(function(item){
        if(item.innerHTML == pleaseChoose){
            item.update(pleaseChooseNew);
        }
    });
    pleaseChoose = pleaseChooseNew;
}

/**
 * Set all content to German
 */
function setFR(){
    if($('mzss-region') == null){
        //There is something wrong with the dom
        return;
    }
    resetRtl();
    lang = 'FR';
    initSelectboxes(lang);
    selectSelects(geoIpCountryCode);
    $$('#storeviewselect .infotext')[0].update('<p>Veuillez noter que le contenu de votre panier sera éventuellement effacé si vous changez de destination de livraison.</p>');
    $$('#storeviewselect label[for="mzss-region"]')[0].update('Continent');
    $$('#storeviewselect label[for="mzss-country"]')[0].update('Pays de livraison');
    $$('#storeviewselect label[for="mzss-language"]')[0].update('Langue');
    $$('#headline_en')[0].hide();
    $$('#headline_it')[0].hide();
    $$('#headline_de')[0].hide();
    $$('#headline_fr')[0].show();
    $$('#headline_ar')[0].hide();
    $$('#storeviewselect #mzss-submitbutton span span')[0].update('Continuer le shopping');
    $('seten').update('Anglais');
    $('setde').update('Allemand');
    $('setit').update('Italien');
    $('setfr').update('Fran&ccedil;ais');
    $('setar').update('العربیة');
    pleaseChooseNew = 'Veuillez sélectionner...';
    pleaseChooseLanguage = 'Veuillez sélectionner votre langue';
    pleaseChooseOptions = 'Veuillez sélectionner vos préférences';
    $$('#storeviewselect option').each(function(item){
        if(item.innerHTML == pleaseChoose){
            item.update(pleaseChooseNew);
        }
    });
    pleaseChoose = pleaseChooseNew;
}

/**
 * Set content to selectboxes
 */

function initSelectboxes(lang){

    if(lang == undefined) lang = 'EN';

    $('mzss-country').disable();
    $('mzss-languagebox').hide();

    // sort data array for country name (DE or EN)
    data.sort(function(a,b){
        aName = a.name;
        if(lang == 'DE') aName = a.nameDE;

        bName = b.name;
        if(lang == 'DE') bName = b.nameDE;

        // umlaut special treatment
        if(aName.substr(0,1) === 'Ä') {
            aName = aName.replace(/Ä/,'Ae');
        }
        if(bName.substr(0,1) === 'Ä') {
            bName = bName.replace(/Ä/,'Ae');
        }

        if(aName.substr(0,1) === 'Ö') {
            aName = aName.replace(/Ö/,'Oe');
        }
        if(bName.substr(0,1) === 'Ö') {
            bName = bName.replace(/Ö/,'Oe');
        }

        if(aName.substr(0,1) === 'Ü') {
            aName = aName.replace(/Ü/,'Ue');
        }
        if(bName.substr(0,1) === 'Ü') {
            bName = bName.replace(/Ü/,'Ue');
        }
        if(aName < bName) return -1;
        if(aName > bName) return 1;
        return 0;
    });

    /**
	 * fill regions
	 */
    $('mzss-region').update(new Element('option').update(pleaseChoose));
    regions = new Array();
    data.each(function(country){
        var regionName = country.region;
        switch (lang) {
            case 'DE':
                regionName = country.regionDE;
                break;
            case 'IT':
                regionName = country.regionIT;
                break;
            case 'FR':
                regionName = country.regionFR;
                break;
            case 'AR':
                regionName = country.regionAR;
                break;
        }

        if (-1 == regions.indexOf(regionName)) {
            regions.push(regionName);
        }
    });
    regions.sort();

    // add "all option"
    var allString = {
        'DE':'Alle',
        'EN':'All',
        'IT':'Tutti',
        'FR':'Tout',
        'AR':'الكل'
    };
    $('mzss-region').insert(new Element('option',{
        'value':'all'
    }).update(allString[lang]));

    regions.each(function(region){
        $('mzss-region').insert(new Element('option').update(region));
    });

    /**
	 * if user has chosen a region -> fill countries
	 */
    $('mzss-country').update(new Element('option').update(pleaseChoose));
    $('mzss-region').stopObserving();
    $('mzss-region').observe('change', function(event){
        $('mzss-region').fire('mz:change', event);
    }); //prototype doesn't support native events!
    $('mzss-region').observe('mz:change', function(event){
        $('mzss-country').enable();
        $('mzss-country').update(new Element('option').update(pleaseChoose));
        $('mzss-languagebox').hide();
        chosenRegion = this.getValue();
        data.each(function(country){
            regionName = country.region;
            if(lang == 'DE') regionName = country.regionDE;
            if(lang == 'IT') regionName = country.regionIT;
            if(lang == 'FR') regionName = country.regionFR;
            if(lang == 'AR') regionName = country.regionAR;
            if((chosenRegion == regionName) || chosenRegion == 'all' ){
                countryName = country.name;
                if(lang == 'DE') countryName = country.nameDE;
                if(lang == 'IT') countryName = country.nameIT;
                if(lang == 'FR') countryName = country.nameFR;
                if(lang == 'AR') countryName = country.nameAR;
                $('mzss-country').insert(new Element('option', {
                    'value': country.id
                    }).update(countryName));
            }
        });
    });

    /**
	 * if user has chosen a country -> fill languages, if available or redirect
	 */
    $('mzss-country').stopObserving();
    $('mzss-country').observe('change', function(event){
        $('mzss-country').fire('mz:change', event);
    }); //prototype doesn't support native events!
    $('mzss-country').observe('mz:change', function(event){
        $('mzss-languagebox').hide();
        chosenCountryId = this.getValue();
        data.each(function(country){
            if(chosenCountryId == country.id){
                if(Object.isArray(country.languages)){
                    $('mzss-languagebox').show();
                    $('mzss-language').update(new Element('option').update(pleaseChoose));
                    var hastoFireLanguageChangeEvent = false;
                    var languageNames = {
                        EN: {
                            en: 'English',
                            it: 'Italian',
                            de: 'German',
                            fr: 'French',
                            ar: 'العربیة'
                        },
                        DE: {
                            en: 'Englisch',
                            it: 'Italienisch',
                            de: 'Deutsch',
                            fr: 'Französisch',
                            ar: 'العربیة'
                        },
                        IT: {
                            en: 'Inglese',
                            it: 'Italiano',
                            de: 'Tedesco',
                            fr: 'Francese',
                            ar: 'العربیة'
                        },
                        FR: {
                            en: 'Anglais',
                            it: 'Italien',
                            de: 'Allemand',
                            fr: 'Français',
                            ar: 'العربیة'
                        },
                        AR: {
                            en: 'الإنجليزية',
                            it: 'الإيطالية',
                            de: 'الألمانية',
                            fr: 'الفرنسية',
                            ar: 'العربیة'
                        }
                    };
                    country.languages.each(function(storeLang){
                        var storeLanguageString = languageNames[lang][storeLang];

                        var option = new Element('option', {
                            'value': storeLang
                        }).update(storeLanguageString);
                        if(storeLang == browserLang){
                            option.selected = true;
                            hastoFireLanguageChangeEvent = true;
                        }
                        $('mzss-language').insert(option);
                    });
                    if(hastoFireLanguageChangeEvent == true){
                        $('mzss-language').fire('mz:change');
                    }
                }
                else{
                    chosenStoreViewCode = country.storeview;
                    chosenCountryIso = country.isoCode;
                    cookieContent = country.id + '|' + chosenStoreViewCode + '|' + country.isoCode;
                }
            }
        });
    });

    /**
	 * if user has chosen a language -> redirect
	 */
    $('mzss-language').stopObserving();
    $('mzss-language').observe('change', function(event){
        $('mzss-language').fire('mz:change', event);
    }); //prototype doesn't support native events!
    $('mzss-language').observe('mz:change', function(event){
        chosenLanguage = this.getValue();
        chosenCountryId = $('mzss-country').getValue();
        data.each(function(country){
            if(chosenCountryId == country.id){
                for(var index=0; index<country.languages.length; index++){
                    if(chosenLanguage == country.languages[index]){
                        break;
                    }
                }
                chosenStoreViewCode = country.storeview[index];
                chosenCountryIso = country.isoCode;
                cookieContent = country.id + '|' + chosenStoreViewCode + '|' + country.isoCode + '|' + chosenLanguage;
            }
        });
    });

   /**
    * Button
    */
    $('mzss-submitbutton').stopObserving();
    $('mzss-submitbutton').observe('click', function(event){
        if(cookieContent == '' || chosenStoreViewCode == '' || chosenStoreViewCode == 'undefined' || chosenLanguage == '' || chosenLanguage == 'undefined' || chosenLanguage == pleaseChooseNew){
            alert(pleaseChooseOptions);
        } else{
            Mage.Cookies.set('myth_country', cookieContent, new Date(new Date().getTime() + (60*60*24*365*5)*1000), '/');
            // MT-933: The key corresponds to Mzentrale_UrlHandler_Helper_Hint::COOKIE_L10N_CHECK
            Mage.Cookies.set('mzurlhandler_l10n_check', true);
            mzoverlay.showLoadingWheel();
            setTimeout("reload()", 500); //IE7^ Bugfix
            country = $('mzss-country').options[$('mzss-country').selectedIndex].text || 'no country selected';
            _gaq.push(['_trackEvent', 'localization', country, chosenLanguage]);
        }
    });
}

function reload(){
    if(chosenStoreViewCode != ''){
        var origPath = window.location.pathname;
        var redirectPath = null;

        path = origPath.replace(/^\/([a-z]{2}-[a-z]{2})/, '/'+chosenStoreViewCode);
        path = path.replace(/^\/([a-z]{2,4}_[a-z]{2})/, '/'+chosenStoreViewCode);

        if(path == '/'){
            redirectPath = '/' + chosenStoreViewCode + '/';
        } else {
            redirectPath = path + window.location.search;
        }
        /* MT-1107: we have to redirect to action which handles quote address countrys*/
        window.location.href = storeswitchRedirectUrl+'?redirectPath=' + redirectPath + '&country=' + chosenCountryIso;
    }
}

function selectSelects(geoIpCountryCode){
    if(!Prototype.Browser.IE6){
        //search for country object
        var geoIpCountry = null;
        data.each(function(country){
            if(country.isoCode == geoIpCountryCode){
                geoIpCountry = country;
                return false;
            }
        });

        if(geoIpCountry != null){
            $$('#mzss-region option').each(function(elRegion){
                //regionName = (lang == 'DE') ? geoIpCountry.regionDE : geoIpCountry.region;
                regionName = geoIpCountry.region;
                if(lang == 'DE'){
                    regionName = geoIpCountry.regionDE;
                }else if(lang == 'IT'){
                    regionName = geoIpCountry.regionIT;
                }else if(lang == 'FR'){
                    regionName = geoIpCountry.regionFR;
                }else if(lang == 'AR'){
                    regionName = geoIpCountry.regionAR;
                }

                if(elRegion.innerHTML == regionName){
                    elRegion.selected = true;
                    $('mzss-region').fire('mz:change');

                    $$('#mzss-country option').each(function(elCountry){
                        if(elCountry.value == geoIpCountry.id){
                            elCountry.selected = true;
                            //fire event only, if stack is empty - otherwise it wouldn't work!
                            //damn prototype
                            fireFireFIRE.defer();
                            return false;
                        }
                    });
                    return false;
                }
            });
        }
    }
}

function fireFireFIRE(){
    $('mzss-country').fire('mz:change');
}

Object.extend(Prototype.Browser, {
    IE6:     Prototype.Browser.IE && (typeof window.XMLHttpRequest == "undefined"),
    IE7:     Prototype.Browser.IE && (typeof window.XMLHttpRequest == "object")
});

;jQuery(document).ready(function($){
    $('.accordion-toggle').click(function() {
        $(this).next('.accordion-content').toggle('fast');
        return false;
    });
});

/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    design
 * @package     enterprise_default
 * @copyright   Copyright (c) 2010 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */
 
if (!window.Enterprise) {
    window.Enterprise = {};
}

if (!Enterprise.CatalogEvent) {
    Enterprise.CatalogEvent = {};
}

Enterprise.CatalogEvent.Ticker = Class.create();

Object.extend(Enterprise.CatalogEvent.Ticker.prototype, {
    initialize: function (container, seconds) {
        this.container = $(container);
        this.seconds   = seconds;
        this.start     = new Date();
        this.interval = setInterval(this.applyTimer.bind(this), 1000);
        this.applyTimer();
    },
    getEstimate: function () {
        var now = new Date();
        
        var result = this.seconds - (now.getTime() - this.start.getTime())/1000;
        
        if (result < 0) {
            return 0;
        }
        
        return Math.round(result);
    },
    applyTimer: function () {
        var seconds = this.getEstimate();
        var daySec = Math.floor(seconds / (3600*24)) * (3600*24);
        var hourSec = Math.floor(seconds / 3600) * 3600;
        var minuteSec =  Math.floor(seconds / 60) * 60;
        var secondSec = seconds;
        this.container.down('.days').update(this.formatNumber(Math.floor(daySec/(3600*24))));
        this.container.down('.hour').update(this.formatNumber(Math.floor((hourSec - daySec)/3600)));
        this.container.down('.minute').update(this.formatNumber(Math.floor((minuteSec - hourSec)/60)));
        this.container.down('.second').update(this.formatNumber(seconds - minuteSec));
        if (daySec > 0) {
            this.container.down('.second').previous('.delimiter').hide();
            this.container.down('.second').hide();
            this.container.down('.days').show();
            this.container.down('.days').next('.delimiter').show();
        } else {
            this.container.down('.days').hide();
            this.container.down('.days').next('.delimiter').hide();
            this.container.down('.second').previous('.delimiter').show();
            this.container.down('.second').show();
        }
    },
    formatNumber: function (number) {
        if (number < 10) {
            return '0' + number.toString();
        }

        return number.toString();
    }
});

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @copyright  Copyright (c) 2008 Irubin Consulting Inc. DBA Varien (http://www.varien.com)
 * @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

var Mzcheckout = Class.create();
Mzcheckout.prototype = {
    initialize: function (locale) {
        this.locale = locale;
        this.loadAddressForm = this.locale + '/mzcheckout/standard/loadAddressForm';
        this.removeShippingAddressFormRegisterUrl = this.locale + '/mzcheckout/standard/removeRegisterShippingAddressRegister';
        this.removeShippingAddressFormGuestUrl = this.locale + '/mzcheckout/standard/removeGuestShippingAddressGuest';

        this.loadShippingAddressFormLoggedinUrl = this.locale + '/mzcheckout/standard/loadRegisterShippingAddressLoggedin';
        this.removeShippingAddressFormLoggedinUrl = this.locale + '/mzcheckout/standard/removeRegisterShippingAddressLoggedin';

        this.loadShippingAddressFormLoggedinUrlNew = this.locale + '/mzcheckout/standard/loadLoggedinBillingAddressLoggedinNew';
        this.removeShippingAddressFormLoggedinUrlNew = this.locale + '/mzcheckout/standard/removeLoggedinShippingAddressLoggedinNew';
        this.removeBillingAddressFormLoggedinUrlNew = this.locale + '/mzcheckout/standard/removeLoggedinBillingAddressNew';

        this.reloadShippingmethodByExistingAddressUrl = this.locale + '/mzcheckout/standard/reloadShippingmethodByExistingAddress';
        this.reloadShippingmethodByCountryIdUrl = this.locale + '/mzcheckout/standard/reloadShippingmethodByCountryId';
        this.reloadShippingmethodByRegionIdUrl = this.locale + '/mzcheckout/standard/reloadShippingmethodByRegionId';
        this.reloadShippingmethodByRegionIdUrl = this.locale + '/mzcheckout/standard/reloadShippingmethodByPostcode';
        this.reloadShippingMethodUrl = this.locale + '/mzcheckout/standard/reloadShippingmethod';

        this.setBillingIsShippingUrl = this.locale + '/mzcheckout/standard/setBillingIsShippingAddress';

        this.loadingHtml = '<div class="loading"><span>Wird geladen, bitte warten...</span></div>';

        Ajax.Responders.register({
            onComplete: function () {
                document.fire('dom:loaded');
            }
        });
    },

    addAddressForm: function (elementid, addblock, newshipping) {
        $(elementid).innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.loadAddressForm,
            {
                method: 'post',
                parameters: 'block=' + addblock + '&newshipping=' + newshipping,
                onSuccess: function (e) {
                    $(elementid).innerHTML = e.responseText;
                }
            }
        );
    },

    removeShippingAddressFormRegister: function (elementid) {
        $(elementid).innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.removeShippingAddressFormRegisterUrl,
            {
                method: 'post',
                parameters: null,
                onSuccess: function (e) {
                    $(elementid).innerHTML = e.responseText;
                }
            }
        );
    },

    removeShippingAddressFormGuest: function (elementid) {
        $(elementid).innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.removeShippingAddressFormGuestUrl,
            {
                method: 'post',
                parameters: null,
                onSuccess: function (e) {
                    $(elementid).innerHTML = e.responseText;
                    mzcheckout.reloadShippingmethod();
                }
            }
        );
    },

    removeShippingAddressFormLoggedin: function () {
        $('shipping-address').innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.removeShippingAddressFormLoggedinUrl,
            {
                method: 'post',
                parameters: null,
                onSuccess: function (e) {
                    $('shipping-address').innerHTML = e.responseText;
                    mzcheckout.reloadShippingmethod();
                }
            }
        );
    },

    setBillingIsShipping: function (addblock) {
        $('shipping-address').innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.setBillingIsShippingUrl,
            {
                method: 'post',
                parameters: 'block=' + addblock,
                onSuccess: function (e) {
                    $('shipping-address').innerHTML = e.responseText;
                    mzcheckout.reloadShippingmethod();
                }
            }
        );


    },

    removeBillingAddressFormLoggedinNew: function () {
        $('billing-address').innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.removeBillingAddressFormLoggedinUrlNew,
            {
                method: 'post',
                parameters: null,
                onSuccess: function (e) {
                    $('billing-address').innerHTML = e.responseText;
                    mzcheckout.reloadShippingmethod();
                }
            }
        );
    },

    removeShippingAddressFormLoggedinNew: function () {
        $('shipping-address').innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.removeShippingAddressFormLoggedinUrlNew,
            {
                method: 'post',
                parameters: null,
                onSuccess: function (e) {
                    $('shipping-address').innerHTML = e.responseText;
                    mzcheckout.reloadShippingmethod();
                }
            }
        );
    },

    reloadShippingmethod: function () {
        $('shipping-method-load').innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.reloadShippingMethodUrl,
            {
                method: 'post',
                parameters: null,
                onSuccess: function (e) {
                    Element.update('shipping-method-load', e.responseText);
                }
            }
        );
    },

    reloadShippingmethodByExistingAddress: function (addressId, type) {
        $('shipping-method-load').innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.reloadShippingmethodByExistingAddressUrl,
            {
                method: 'post',
                parameters: 'address=' + addressId + '&type=' + type,
                onSuccess: function (e) {
                    Element.update('shipping-method-load', e.responseText);
                }
            }
        );
    },

    reloadShippingmethodByCountryId: function (countryId, type) {
        $('shipping-method-load').innerHTML = this.loadingHtml;

        if (document.getElementById("select-us-region-shipping")) {
            switch (type) {
                case "shipping":
                    if (countryId.value == 'US') {
                        $('select-us-region-shipping').style.display = 'block';
                    } else {
                        $('select-us-region-shipping').style.display = 'none';
                    }
                    break;
                case "billing":
                    if (countryId.value == 'US') {
                        $('select-us-region-billing').style.display = 'block';
                    } else {
                        $('select-us-region-billing').style.display = 'none';
                    }
                    break;
            }
        }

        var request = new Ajax.Request(
            this.reloadShippingmethodByCountryIdUrl,
            {
                method: 'post',
                parameters: 'country=' + countryId.value + '&type=' + type + '&isnewaddress=1',
                onSuccess: function (e) {
                    Element.update('shipping-method-load', e.responseText);
                }
            }
        );
    },

    reloadShippingmethodByRegionId: function (countryId, type) {
        $('shipping-method-load').innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.reloadShippingmethodByRegionIdUrl,
            {
                method: 'post',
                parameters: 'region=' + countryId.value + '&type=' + type,
                onSuccess: function (e) {
                    Element.update('shipping-method-load', e.responseText);
                }
            }
        );
    },

    reloadShippingmethodByPostalCode: function (postcode, type) {
        $('shipping-method-load').innerHTML = this.loadingHtml;

        var request = new Ajax.Request(
            this.reloadShippingmethodByRegionIdUrl,
            {
                method: 'post',
                parameters: 'postcode=' + postcode + '&type=' + type,
                onSuccess: function (e) {
                    Element.update('shipping-method-load', e.responseText);
                }
            }
        );
    }
};

var Payment = Class.create();
Payment.prototype = {

    beforeInitFunc: $H({}),
    afterInitFunc: $H({}),
    beforeValidateFunc: $H({}),
    afterValidateFunc: $H({}),

    initialize: function (form, locale) {
        this.form = form;
        this.locale = locale;
    },

    init: function () {
        var elements = Form.getElements(this.form);
        var method = null;
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].name == 'payment[method]') {
                if (elements[i].checked) {
                    method = elements[i].value;
                }
            } else {
                elements[i].disabled = true;
            }
        }
        if (method) this.switchMethod(method);
    },

    addBeforeInitFunction: function (code, func) {
        this.beforeInitFunc.set(code, func);
    },

    beforeInit: function () {
        (this.beforeInitFunc).each(function (init) {
            (init.value)();
            ;
        });
    },

    submitForm: function () {
        $(this.form).submit();
    },

    addAfterInitFunction: function (code, func) {
        this.afterInitFunc.set(code, func);
    },

    afterInit: function () {
        (this.afterInitFunc).each(function (init) {
            (init.value)();
        });
    },

    addBeforeValidateFunction: function (code, func) {
        this.beforeValidateFunc.set(code, func);
    },

    switchMethod: function (method) {
        if ($('p_method_info_' + method)) {
            $('p_method_info_' + method).removeClassName('active');
        }
        if (this.currentMethod)
            $('p_method_info_' + this.currentMethod).removeClassName('active');

        if (this.currentMethod && $('payment_form_' + this.currentMethod)) {
            var form = $('payment_form_' + this.currentMethod);
            form.style.display = 'none';

            var elements = form.select('input', 'select', 'textarea');
            for (var i = 0; i < elements.length; i++) elements[i].disabled = true;
            this.currentMethod = method;
        } else {
            this.currentMethod = method;
        }

        if ($('payment_form_' + method)) {
            var form = $('payment_form_' + method);
            form.style.display = '';
            var elements = form.select('input', 'select', 'textarea');
            for (var i = 0; i < elements.length; i++) elements[i].disabled = false;

            this.currentMethod = method;
        }
        if ($('p_method_info_' + method)) {
            $('p_method_info_' + method).addClassName('active');
        }
    },

    switchUrl: function (url) {
        $(this.form).action = url;
    },

    validate: function () {
        var methods = document.getElementsByName('payment[method]');
        if (methods.length == 0) {
            alert(Translator.translate('Your order can not be completed at this time as there is no payment methods available for it.'));
            return false;
        }
        for (var i = 0; i < methods.length; i++) {
            if (methods[i].checked) {
                return true;
            }
        }
        alert(Translator.translate('Please specify payment method.'));
        return false;
    },

    save: function () {
        var validator = new Validation(this.form);
        Validation.add('validate-blz', 'Eine Bankleitzahl muss aus 8 Zahlen bestehen', {
            minLength: 8, // value must be at least 6 characters
            maxLength: 8 // value must be no longer than 13 characters
        });

        if (this.validate() && validator.validate()) {
            this.submitForm();
        }
    }
}


/**
 * A Radiobox is something like that:
 * <div class="radio-box">
 *    <input type="radio" id="test" class="radio" />
 *  <label for="test">test</label>
 * </div>
 *
 * with some sophisticated css rules, it is shown as a box
 * and you can click on the box (label) and the radio button
 * gets active AND the label gets an active class for additional styling!
 *
 * isn't that cool :-)
 *
 * use new Radiobox('namespace') for initalization
 *
 * (c) 2011, Benjamin Zaiser, b.zaiser@mzentrale.de
 *
 */
var Radiobox = Class.create();
Radiobox.prototype = {
    namespace: '',

    initialize: function (namespace) {
        this.namespace = namespace;
        var self = this;

        $$(this.namespace + ' .radio-box').each(function (box) {
            box.getElementsBySelector('input.radio').each(function (input) {
                var labels = input.up().getElementsBySelector('label');

                //Bereits selektierte auch aktivieren
                if (input.checked) {
                    labels.each(function (label) {
                        label.addClassName('active');
                    });
                }

                //wenn auf input geklickt wird -> label active
                input.stopObserving();
                input.observe('click', function (event) {
                    self.deactivateAll();
                    labels.each(function (label) {
                        label.addClassName('active');
                    });
                });

                //wenn auf label geklickt wird -> label active
                labels.each(function (label) {
                    label.stopObserving();
                    label.observe('click', function (event) {
                        self.deactivateAll();
                        this.addClassName('active');
                    });
                });

            });
        });
    },

    deactivateAll: function () {
        $$(this.namespace + ' .radio-box label').each(function (label) {
            label.removeClassName('active');
        });
    }

};


document.observe('dom:loaded', function () {

    //Init Radioboxes
    new Radiobox('#billing-address');
    new Radiobox('#shipping-address');
    new Radiobox('#shipping-method-load');
    new Radiobox('#checkout-payment-method-load');

    /**
     * Checkout agreements -> click on <a> Tag in agreement label opens the content box
     */
    var classes = new Array();
    $$('p.agree span a').each(function (a) {
        classes.push(a.className);
        a.observe('click', function (event) {
            classes.each(function (item) {
                var classContent = item + 'content';
                if (a.className == item) {
                    mzoverlay.open(classContent);
                }
            });
        });
    });
});


;
/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    design
 * @package     enterprise_default
 * @copyright   Copyright (c) 2010 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */

// Add validation hints
if (typeof mythCollector == 'undefined') {
    var mythCollector = {};
}

mythCollector.Cookie = Class.create();
mythCollector.Cookie.prototype = {
    initialize: function () {
        this.cookieName = 'myth_collector';
        this.cookieContent = {};
        if (Mage.Cookies.get(this.cookieName)) {
            this.cookieContent = Mage.Cookies.get(this.cookieName).evalJSON();
        }

        /* if there is no cookie content, create empty object */
        if (this.cookieContent == null) {
            this.cookieContent = {};
        }

        this.urlParams = window.location.search.substring(1).toQueryParams();
        this.logUrlParams = ['utm_source', 'utm_campaign', 'utm_medium', 'gkid'];
    },

    /* save array as string */
    saveCookie: function (content) {
        Mage.Cookies.set(this.cookieName, Object.toJSON(content));
    },

    logParams: function () {
        var logData = true;

        if (this.logUrlParams.size() > 0) {
            for (var i = 0; i < this.logUrlParams.length; ++i) {
                if (this.hasUrlParam(this.logUrlParams[i])) {
                    /* add param to logged params */
                    this.cookieContent[this.logUrlParams[i]] = this.getUrlParamValue(this.logUrlParams[i]);
                    logData = true;
                }
            }
        }
        if (logData && this.cookieContent) {
            this.saveCookie(this.cookieContent);
        }
    },

    getUrlParamValue: function (param) {
        if (this.urlParams) {
            for (urlKey in this.urlParams) {
                if (param == urlKey) return this.urlParams[urlKey];
            }
        }
        return null;
    },

    hasUrlParam: function (param) {
        if (this.urlParams) {
            for (var urlKey in this.urlParams) {
                if (param == urlKey) return true;
            }
        }
        return false;
    }
};

// Add validation hints
if (typeof mythPersistentCollector == 'undefined') {
    var mythPersistentCollector = {};
}

mythPersistentCollector.Cookie = Class.create();
mythPersistentCollector.Cookie.prototype = {
    initialize: function () {
        this.cookieName = 'myth_collector_persistent';
        this.cookieContent = {};
        if (Mage.Cookies.get(this.cookieName)) {
            this.cookieContent = Mage.Cookies.get(this.cookieName).evalJSON();
        }

        /* if there is no cookie content, create empty object */
        if (this.cookieContent == null) {
            this.cookieContent = {};
        }

        this.urlParams = window.location.search.substring(1).toQueryParams();
        this.logUrlParams = ['eh', 'csf'];
    },

    /* save array as string */
    saveCookie: function (content) {
        Mage.Cookies.set(this.cookieName, Object.toJSON(content), new Date(new Date().getTime() + (60 * 60 * 24 * 365 * 2) * 1000));
    },

    logParams: function () {
        if(this.cookieContent['customer_group'] === undefined){
            var logData = false;
            if (this.logUrlParams.size() > 0) {
                for (var i = 0; i < this.logUrlParams.length; ++i) {
                    if (this.hasUrlParam(this.logUrlParams[i])) {
                        /* add param to logged params */
                        this.cookieContent[this.logUrlParams[i]] = this.getUrlParamValue(this.logUrlParams[i]);
                        logData = true;
                    }
                }
            }
            if (logData && this.cookieContent) {
                this.saveCookie(this.cookieContent);
            }
        }
    },

    getUrlParamValue: function (param) {
        if (this.urlParams) {
            for (urlKey in this.urlParams) {
                if (param == urlKey) return this.urlParams[urlKey];
            }
        }
        return null;
    },

    hasUrlParam: function (param) {
        if (this.urlParams) {
            for (var urlKey in this.urlParams) {
                if (param == urlKey) return true;
            }
        }
        return false;
    }
};

/**
 * Adds two numbers
 * @param {string} param
 * @return {string} sum
 */
function getUrlParamValue(param) {
    var _urlParams = window.location.search.substring(1).toQueryParams();
    if (_urlParams) {
        for (urlKey in _urlParams) {
            if (param == urlKey) return _urlParams[urlKey];
        }
    }
    return '';
}
;
(function () {
    jQuery(document).ready(function () {
        if (trackingVars.category_id && trackingVars.category_name) {
            /* Tracking for sorting */

            /*
            jQuery(document).on('click', '#product-list-sort-by', function (event) {
                _gaq.push(['_trackEvent', 'sort by_' + trackingVars.category_id + '_' + trackingVars.category_name, 'open_drop down_sort_by', '1', 1, true]);
            });
            jQuery(document).on('click', '#product-list-sort-by-1', function (event) {
                _gaq.push(['_trackEvent', 'sort by_' + trackingVars.category_id + '_01_' + trackingVars.category_name, 'down_sort_by', '2', 1, true]);
            });
            jQuery(document).on('click', '#product-list-sort-by-2', function (event) {
                _gaq.push(['_trackEvent', 'sort by_' + trackingVars.category_id + '_02_' + trackingVars.category_name, 'down_sort_by', '3', 1, true]);
            });
            jQuery(document).on('click', '#product-list-sort-by-3', function (event) {
                _gaq.push(['_trackEvent', 'sort by_' + trackingVars.category_id + '_03_' + trackingVars.category_name, 'down_sort_by', '4', 1, true]);
            });*/

            /* Clear filter */
            /*jQuery(document).on('click', 'filter-clear-link-for-', function (event) {
                _gaq.push(['_trackEvent', 'clear filter_' + trackingVars.category_id + '_01_' + trackingVars.category_name, 'clear_filter', '5', 1, true])
            });
            jQuery(document).on('click', 'filter-clear-link-for-designer', function (event) {
                _gaq.push(['_trackEvent', 'clear filter_' + trackingVars.category_id + '_02_' + trackingVars.category_name, 'clear_filter', '6', 1, true])
            });
            jQuery(document).on('click', 'filter-clear-link-for-size_harmonized', function (event) {
                _gaq.push(['_trackEvent', 'clear filter_' + trackingVars.category_id + '_03_' + trackingVars.category_name, 'clear_filter', '7', 1, true])
            });
            jQuery(document).on('click', 'filter-clear-link-for-color', function (event) {
                _gaq.push(['_trackEvent', 'clear filter_' + trackingVars.category_id + '_04_' + trackingVars.category_name, 'clear_filter', '8', 1, true])
            });
            jQuery(document).on('click', 'filter-clear-link-for-price', function (event) {
                _gaq.push(['_trackEvent', 'clear filter_' + trackingVars.category_id + '_05_' + trackingVars.category_name, 'clear_filter', '9', 1, true])
            });*/

            /* Search designer filter */
            /*jQuery(document).on('keyup', '#filter-designer-helper', function (event) {
                _gaq.push(['_trackEvent', 'filter designer search_' + trackingVars.category_id + '_' + trackingVars.category_name, 'search_in_filter_designer', '10', 1, true]);
            });*/

            /* Open filter sizechart */
            /*jQuery(document).on('click', '.open-sizechart', function (event) {
                _gaq.push(['_trackEvent', 'filter size chart_' + trackingVars.category_id + '_' + trackingVars.category_name, 'open_filter_size_chart', '11', 1, true]);
            });*/

            /* Tracking for pagination */
            /*jQuery(document).on('click', '.product-list-pager-item', function (event) {
                _gaq.push(['_trackEvent', 'pagination_' + trackingVars.category_id + '_01_' + trackingVars.category_name, 'use_pagination', '12', 1, true]);
            });*/

            /* More / Less items */
            /*jQuery(document).on('click', '.more-less-items-link', function (event) {
                _gaq.push(['_trackEvent', 'more products_' + trackingVars.category_id + '_' + trackingVars.category_name, 'show_more_products', '14', 1, true]);
            });*/

            /* Back to top */
            /*jQuery(document).on('click', '.product-list-back-to-top', function (event) {
                _gaq.push(['_trackEvent', 'back to top_' + trackingVars.category_id + '_' + trackingVars.category_name, 'back_to_top', '15', 1, true]);
            });*/
        }
    });
})();

/* google tracking */
jQuery(document).ready(function () {
    _gaq = _gaq || [];
    // #1 track left trust banner
    jQuery('#benefit-banner-left #benefit-item-wrapper li').mouseover(function () {
        _gaq.push(['_trackEvent', 'trust communication', 'MouseOver', 'trust' + (jQuery(this).index() + 1)]);
    });
    // #2 track store locator
    jQuery('.header-container .storeviewselection a.mzstoreviewselect-open').live('click', function () {
        _gaq.push(['_trackEvent', 'store selector', 'Click', 'country button']);
    });
    // #2 track store locator
    jQuery('.l10n-hint-container .l10n-hint-text .l10n-hint-close-btn').live('click', function () {
        _gaq.push(['_trackEvent', 'store selector', 'Click', 'yellow bar keep']);
    });
    // #2 track store locator
    jQuery('.l10n-hint-container .l10n-hint-text a').live('click', function () {
        _gaq.push(['_trackEvent', 'store selector', 'Click', 'yellow bar change']);
    });
});

var _deviceAgent = navigator.userAgent.toLowerCase(),
    _isMobileDevice = _deviceAgent.match(/(iphone|ipod|ipad|android|webos|blackberry)/);

var countryCookie = Mage.Cookies.get('myth_country');

function russiaOverlayMap(url) {
    var $j = jQuery;

    if (url == undefined) {
        url = BASE_URL + 'mzoverlay/map_russia/showmap/';
    }

    function isTouchDevice() {
        return (typeof(window.ontouchstart) != 'undefined') ? true : false;
    }

    $j.ajax({
        type: 'GET',
        url: url,
        success: function (data) {

            if ($j('#mzoverlay-russiamap').length !== 1) {
                $j('<div/>', {
                    id: 'mzoverlay-russiamap',
                    html: data
                }).appendTo('body');
            } else {
                $j('#mzoverlay-russiamap').html(data);
                mzoverlay.doRepositioning();
            }

            $j(document).on('mouseenter', '#russia_map_overlay .hotspot',function () {
                $j(this).find('.tooltip').dequeue().fadeIn(350);
            }).on('mouseleave', '#russia_map_overlay .hotspot', function () {
                $j(this).find('.tooltip').stop().fadeOut(350);
            });

            if (isTouchDevice()) {
                $j('.mzoverlay-russiamap-box').click(function () {
                    $j(this).find('.tooltip').stop().fadeOut(350);
                    $j(this).find('.tooltip-arrow').stop().fadeOut(350);
                });
            }
            mzoverlay.open('mzoverlay-russiamap', {'modal': false});
        }
    });
}

function display404ProductHint(categoryName) {
    var _sanitize = function (str) {
        var tmp = document.createElement("div");
        tmp.innerHTML = decodeURIComponent(str);
        return tmp.textContent || tmp.innerText;
    }

    var fragment = window.location.hash, text = '', templateVars = {};
    if (fragment.match('maincat_(.*?)_404$')) {
        templateVars.designer = categoryName;
        templateVars.maincat = _sanitize(fragment.match('maincat_(.*?)_404$')[1]);
        text = "The category #{maincat} you've searched for is unfortunately no longer available. Discover our newest collection from #{designer} instead.";
    } else if (fragment.match('designer_(.*?)_404$')) {
        templateVars.designer = _sanitize(fragment.match('designer_(.*?)_404$')[1]);
        text = "Unfortunately, #{designer} is currently not available at mytheresa.com. Check out our Designers A-Z to find the many more of the world's top brands.";
    } else if (fragment.match('_404$')) {
        templateVars.designer = categoryName;
        text = 'The #{designer} item you have selected is no longer available, therefore we have redirected you to the #{designer} start page.';
    }

    if (text.length > 0 && Translator) {
        text = Translator.translate(text);
        var message = document.createElement('div');
        message.setAttribute('class', 'message');
        message.update((new Template(text)).evaluate(templateVars));
        $('catalog-product-404-hint').update(message);
    }
}

var Mytheresa = Mytheresa || {};
Mytheresa.getCookieCountry = function () {
    if (Mage.Cookies.get('myth_country')) {
        var chunks = Mage.Cookies.get('myth_country').split('|');
        return chunks.length >= 3 ? chunks[2] : null;
    }
    return null;
}

/**
 * JS for service flag, handles all behavior
 */
jQuery(document).ready(function ($) {
    var $serviceFlag = $('#service-flag-wrapper .service-flag'),
        $serviceTooltip = $('#service-flag-wrapper .service-flag-tooltip'),
        $serviceTooltipClose = $('#service-flag-wrapper .service-flag-tooltip-close');

    if (Mage.Cookies.get('myth_service_flag') === null) {
        setTimeout(function () {
            $serviceFlag.animate({left: 0}, 450, function () {
                Mage.Cookies.set('myth_service_flag', 'true', new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), '/');
                if ($(document).width() < 1440) {
                    var $this = $(this);
                    setTimeout(function () {
                        $this.animate({left: '-68px'}, 450);
                    }, 2000);
                }
            });
        }, 4000);
    } else {
        serviceTagDisplay();
    }

    $(window).resize(function () {
        serviceTagDisplay();
    });

    function serviceTagDisplay() {
        if ($(document).width() >= 1440) {
            $serviceFlag.removeClass('closed').addClass('open');
        } else {
            $serviceFlag.removeClass('open').addClass('closed');
        }
    }

    $serviceFlag.hover(function () {
        $serviceFlag.fadeOut(350);
        $serviceTooltip.fadeIn(350);
    });
    $serviceTooltip.mouseleave(function () {
        $serviceFlag.fadeIn(350);
        $serviceTooltip.fadeOut(350);
    });
    $serviceTooltipClose.click(function () {
        $serviceFlag.fadeIn(350);
        $serviceTooltip.fadeOut(350);
    });
});

/**
 * JS for customer care console, load console by ajax if cookie is set
 */
jQuery(document).ready(function ($) {
    function includeCcConsole() {
        var includeCcConsole = Mage.Cookies.get(mytheresaVars.cc_console.cookie_name);
        var ccconsoleurl = mytheresaVars.cc_console.request_url;

        if (includeCcConsole) {
            new Ajax.Request(ccconsoleurl, {
                method: 'get',
                onSuccess: function (transport) {
                    var ccconsole = $('#mythccconsole');
                    data = transport.responseText;
                    ccconsole.html(data);
                }
            });
        }
    }

    includeCcConsole();
});

/**
 * JS for cookie policy hint display and handling
 */
jQuery(document).ready(function ($) {
    if (parseInt(Mage.Cookies.get('myth_cookie_policy')) !== 1) {
        showCookiePolicyHint();
    }

    $(document).on('click', '.cookie-policy-close', function () {
        hideCookiePolicyHint();
    });

    function showCookiePolicyHint() {
        $('#cookie-policy-hint').show();
        _gaq = _gaq || [];
        _gaq.push(['_trackEvent', 'Overall_Events', 'show cookie bar', 'show cookie bar', 1, true]);
    }

    function hideCookiePolicyHint() {
        $('#cookie-policy-hint').hide();
        _setCookiePolicyCookie('cookie bar_ok');
    }

    function _setCookiePolicyCookie(event) {
        _gaq = _gaq || [];
        _gaq.push(['_trackEvent', 'Overall_Events', 'click in cookie bar', event, 1, true]);
        Mage.Cookies.set('myth_cookie_policy', '1', new Date(new Date().getTime() + 5 * 365 * 86400 * 1000));
    }
});

/**
 * JS for language or destination overlay
 */
jQuery(document).ready(function ($) {
    function getURLParameter(name) {
        return decodeURIComponent(
            (location.search.match(RegExp("[?|&]" + name + '=(.+?)(&|$)')) || [, null])[1]
        );
    }

    if (getURLParameter("localize") == 1) {
        openLocalizationLayer();
    }

    if (getURLParameter("overlay") && !Mage.Cookies.get('langappoverlay')) {

        // Set Start Language
        var _selectedLang = getURLParameter("overlay"),
            _startLang;

        switch (_selectedLang) {
            case 'arab':
                _startLang = 'arabic';
                break;
            case 'arab':
                _startLang = 'arabic';
                break;
            case 'rus':
                _startLang = 'russian';
                break;
        }
        $('#overlaylangapp_picture').addClass(_startLang);
        $('#appoverlay_langapp span a').each(function () {
            if ($(this).hasClass(_startLang) || $(this).hasClass('english'))
                $(this).show();
        });

        function showOverlayLangApp() {
            $('#appoverlay_langapp').show();
            mzoverlay.open('appoverlay_langapp', {'modal': false});
            Mage.Cookies.set('langappoverlay', '1', new Date(new Date().getTime() + (60 * 60 * 24 * 365 * 5) * 1000), '/');

        }

        if (getURLParameter("overlay") === "arab" || getURLParameter("overlay") === "rus") {
            showOverlayLangApp();
        } else {
            $('#appoverlay_langapp').remove();
        }

        $(document).on('click', '#appoverlay_langapp span a', function () {
            var _lang = $(this).attr('class');
            if ($(this).attr('class') == 'english') {
                var _lang = _lang + '-' + _startLang;
            }
            $('#overlaylangapp_picture').removeClass().addClass(_lang);
        });

        $(document).on('click', '#overlaylangapp_picture', function () {
            mzoverlay.close();
        });
    }
});

/**
 * JS for storeviewselect and redirects
 */
var params = window.location.search.substring(1).toQueryParams();

function handleOldNlLinks() {
    if (hasNeededParam()) {
        var requestPath = window.location.pathname;
        var redirectPath = requestPath.replace(/^\/([^\/]*)/, '/to');
        setLocation(redirectPath);
    }
}

function hasNeededParam() {
    for (var myKey in params) {
        if (myKey == 'use_cookie_storeview') {
            return true;
        }
    }
    return false;
}

function handleRedirect() {
    var pathArray = window.location.pathname.split('/');
    if (countryCookie) {
        var cookieContents = countryCookie.split('|');
        if (!pathArray[1] && cookieContents[1] != 'undefined') {
            window.location.href = window.location.protocol + '//' + window.location.host + '/' + cookieContents[1] + '/';
            return true;
        } else if (cookieContents[1] == 'undefined') {
            Mage.Cookies.set('myth_country', '27|en-de|DE|en', new Date(new Date().getTime() + (60 * 60 * 24 * 365 * 5) * 1000), '/');
            countryCookie = Mage.Cookies.get('myth_country');
            return true;
        }
    }
    return true;
}
handleOldNlLinks();
if (!hasNeededParam()) {
    handleRedirect();
}

function checkIfCookiesAllowed() {
    if (Mage.Cookies.get('cookiecheck')) {
        return true;
    } else {
        Mage.Cookies.set('cookiecheck', '1');
    }
    if (Mage.Cookies.get('cookiecheck')) {
        return true;
    } else {
        return false;
    }
}

if (checkIfCookiesAllowed() == false) {
    document.observe('dom:loaded', function () {
        $('nocookies-notice').show();
    });
}

function openLocalizationLayer() {
    var urlOverlay = mytheresaVars.storeview_select.request_url;
    mzoverlay.open('mzoverlay-storeviewselect');
    new Ajax.Request(urlOverlay, {
        method: 'get',
        onSuccess: function (transport) {
            data = transport.responseText;
            mzoverlay.updateContent(data);
        }
    });
}
/**
 * JS for customer account flyout in head
 */
jQuery(document).ready(function ($) {

    var customerFlyoutVisible = false;
    var timeoutId;
    var overCustomerFlyout = false;

    function hideCustomerFlyout() {
        $('.customer-flyout-container').stop(true, true).fadeOut(200);
        customerFlyoutVisible = false;
    }

    $('.flyout-close').click(function () {
        hideCustomerFlyout();
    });

    $('.persistent-cart .first').hover(function () {
            if (!timeoutId) {
                timeoutId = window.setTimeout(function () {
                    timeoutId = null;
                    overCustomerFlyout = true;
                    $('.customer-flyout-container').stop(true, true).fadeIn(300, function () {
                        customerFlyoutVisible = true;
                    });
                }, 10);
            }
        },
        function () {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
                timeoutId = null;
            } else {
                overCustomerFlyout = false;
                setTimeout(function () {
                    if (!overCustomerFlyout) {
                        hideCustomerFlyout();
                    }
                }, 40);
            }
        });

    if (_isMobileDevice) {
        $('.customer-account-link').click(function (e) {
            if (customerFlyoutVisible)
                return true;
            else
                return false;
        });
    }
});

/**
 * JS for sticky nav
 */
jQuery(document).ready(function ($) {
    if ($('.sticky-nav').length) {
        var top = $('.sticky-nav').offset().top - parseFloat($('.sticky-nav').css('margin-top').replace(/auto/, 0));
        var _height = $('.sticky-nav').height();
        var topMenuFlyoutVisible = false;

        function handleSticky() {
            var y = $(this).scrollTop();
            var z = $('.footer-container').offset().top;
            if (y >= top && (y + _height) < z) {
                $('body').addClass('nav-fixed');
                $('.sticky-nav').addClass('fixed');
            } else {
                $('body').removeClass('nav-fixed');
                $('.sticky-nav').removeClass('fixed');
            }
        }

        /* observe url fragment */
        if (window.location.hash == '#moreitems') {
            handleSticky();
        }
        /* observe scrolling */
        $(window).scroll(function (event) {
            handleSticky();
        });
        $('.nav-close').click(function () {
            $('.flyout-wrapper').hide();
        });
        $('#nav .parent a').click(function () {
            $('.flyout-wrapper').show();
        });
        $('.sticky-nav').mouseenter(function () {
            $('.flyout-wrapper').show();
        });
        $('.wrapper').click(function () {
            $('.flyout-wrapper').hide();
        });
        $('#nav').click(function (event) {
            event.stopPropagation();
        });
        //fade menu
        if ($.support.opacity) { // does the browser support opacity?
            if (!$('#nav li').is(':empty') || $('#nav li').hasClass('parent')) { // is #nav li not empty OR does it have the class called parent?
                $('#nav li div').hide(); // if so, hide it
                $('#nav').hover(
                    function () {
                        $(this).addClass('active');
                    },
                    function () {
                        $(this).removeClass('active');
                    }
                );
                $('#nav .level0').hover(
                    function () { // on mouseover
                        topMenuFlyoutVisible = false;
                        if ($('#nav').hasClass('active')) {
                            $(this).children('div').show();
                            setTimeout(function () {
                                topMenuFlyoutVisible = true;
                            }, 300);
                        } else {
                            $('#nav li div').hide();
                            $(this).children('div').stop().fadeIn(300, function () {
                                topMenuFlyoutVisible = true;
                            });
                            $(this).children('div').promise().done(function () {
                                $(this).children('div').show();
                                $(this).children('div').css('opacity', 1);
                            });
                        }
                    },
                    function () { // on mouseout
                        topMenuFlyoutVisible = false;
                        if ($('#nav').hasClass('active')) {
                            $(this).children('div').stop().fadeOut(100);
                        } else {
                            $(this).children('div').stop().fadeOut(300);
                            $(this).children('div').promise().done(function () {
                                $(this).children('div').css('opacity', 0);
                                $(this).children('div').hide();
                            });
                        }
                    }
                );
            }
        }

        if (_isMobileDevice) {
            $('#nav .level-top a').click(function (e) {
                if (topMenuFlyoutVisible)
                    return true;
                else
                    return false;
            });
        }
    }
});
/**
 * JS for cart display
 */
jQuery(document).ready(function ($) {
    displayCartCount();
    function displayCartCount() {
        var cookieContent = Mage.Cookies.get(mytheresaVars.persistent.persistent_cookie);
        if (cookieContent) {
            var cookieContentObj = cookieContent.evalJSON();
            if (cookieContentObj && typeof cookieContentObj['cart_qty'] !== 'undefined') {
                jQuery('#top-cart-count').html(cookieContentObj['cart_qty']);
            }
        }
    }

});
/**
 * JS for newsletter signup
 */
/* This code fails in IE8 causing a variety of problems and is unnecessary in IE>8, and we don't
 * support Firefox<3.7 anymore.

 jQuery(document).ready(function ($) {
 // MT-1013 - Newsletter Signup Input Placeholder fix for IE and Firefox 3.6 and below
 if ($.browser.msie || $.browser.mozilla && $.browser.mozilla.version < 3.7) {
 var input = document.createElement("input");
 if (('placeholder' in input) == false) {
 $('[placeholder]').focus(function () {
 var i = $(this);
 if (i.val() == i.attr('placeholder')) {
 i.val('').removeClass('placeholder');
 if (i.hasClass('password')) {
 i.removeClass('password');
 i.attr('type', 'password');
 }
 }
 }).blur(function () {
 var i = $(this);
 if (i.val() == '' || i.val() == i.attr('placeholder')) {
 if (this.type == 'password') {
 i.addClass('password');
 i.attr('type', 'text');
 }
 i.addClass('placeholder').val(i.attr('placeholder'));
 }
 }).blur().parents('form').submit(function () {
 $(this).find('[placeholder]').each(function () {
 var i = $(this);
 if (i.val() == i.attr('placeholder'))
 i.val('');
 })
 });
 }
 }
 });
 */

/**
 * JS for persistent cookie and link in mobile
 */
jQuery(document).ready(function ($) {
    /**
     * Persistent cookie handling
     */
    var persistentCookie = Mage.Cookies.get(mytheresaVars.persistent.persistent_cookie);
    var isIdentified = false;
    if (persistentCookie) {
        var cookieParts = persistentCookie.evalJSON();
        if (cookieParts.hasOwnProperty('customer_info') && String(cookieParts.customer_info).length > 0) {
            isIdentified = true;
        }
    }
    if (isIdentified) {
        jQuery('#customer-mobile-footer-login').remove();
    } else {
        jQuery('#customer-mobile-footer-logout').remove();
    }
});
/**
 * JS for russian overlay
 */
var russianDhlOverlay = new Class.create();
russianDhlOverlay.prototype = {
    cookieLang: null,
    showOverlay: false,
    cookieName: 'myth_rus_overlay',
    overlayContent: 'static/il8n/russian/overlay.html',

    initialize: function (args) {
        this.cookieLang = this.getCookieLang();
        this.showOverlay = this.hastoShowOverlay();
    },
    getCookieLang: function () {
        var countryCookieLang = null;
        if (countryCookie) {
            var cookieContentRusOverlay = countryCookie.split('|');
            if (typeof cookieContents !== 'undefined' && cookieContents.length > 0) {
                countryCookieLang = cookieContents[2];
            }
        }
        return countryCookieLang;
    },
    hastoShowOverlay: function () {
        var overlayCookie = Mage.Cookies.get(this.cookieName);
        if (overlayCookie) {
            return false;
        }
        if (this.cookieLang === 'RU') {
            return true;
        }
        return false;
    },
    displayOverlay: function (show) {
        if (this.showOverlay || show) {
            mzoverlay.open('mzoverlay-rus-notice', {modal: true});
            new Ajax.Request('/' + this.overlayContent, {
                method: 'get',
                onSuccess: function (transport) {
                    data = transport.responseText;
                    mzoverlay.updateContent(data);
                    $('mzoverlay-content').setStyle({padding: '0px'});
                }
            });
        }
    },
    blockOverlay: function () {
        Mage.Cookies.set(this.cookieName, 1);
    },
    closeOverlay: function () {
        mzoverlay.close();
    },
    validateForm: function () {
        var validator = new Validation('my-custom-form');
        Validation.add('accept-rus-terms', mytheresaVars.rus_overlay.validation_notice, function (v) {
            return (v >= 1);
        });
        return validator.validate();
    },
    acceptTerms: function () {
        if (rusOverlay.validateForm()) {
            rusOverlay.blockOverlay();
            rusOverlay.closeOverlay();
        }
    }
}

/**
 * JS for top search field animation
 */
jQuery(document).ready(function ($) {
    // safari fix width font-size
    $('#search').focus(function () {
        $(this).animate({ width: '200px' });
        $('#search_mini_form button').animate({ width: mytheresaVars.search_animate.width + 'px'}).css('font-size', '12px');
    });
    $('#search').blur(function () {
        $(this).animate({ width: '167px' });
        $('#search_mini_form button').animate({ width: '0'}).css('font-size', '0');
    });
});
/**
 * JS for emarsys
 */
jQuery(document).ready(function ($) {

    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    var isMobileDevice = navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad|android|webos|blackberry)/);

    var cookieValue = Mage.Cookies.get('show_newsletter_popup');
    if (cookieValue == '0') {
        return;
    } else if (window.location.search.parseQuery()['nlp'] == '0') {
        Mage.Cookies.set('show_newsletter_popup', '0', _days(365 * 5), '/');
        return;
    } else if (cookieValue === null) {
        //normal pop up handling
        //Mage.Cookies.set('show_newsletter_popup', '1', _days(1), '/');

        //Christmas newsletter version
        Mage.Cookies.set('show_newsletter_popup', '1');
        return;
    }

    var popup = $('#newsletter-signup-popup');
    var requestUrl = mytheresaVars.emarsys.request_url;
    new Ajax.Request(requestUrl, {
        method: 'get',
        parameters: {},
        onSuccess: function (transport) {
            popup.html(transport.responseText);
            var height = $('.newsletter-footer-popup', popup).outerHeight();
            $('.newsletter-footer-popup', popup).css({ top: height }).animate({ top: 0 });

            if (isSafari && !isMobileDevice)
                $('#newsletter-signup-popup .form-subscribe').addClass('safari');

            $('.close', popup).click(function () {
                popup.empty();
                //Christmas newsletter version
                Mage.Cookies.set('show_newsletter_popup', '0');

                //normal pop up handling
                //Mage.Cookies.set('show_newsletter_popup', '0', _days(30), '/');
            });

            $('.reject', popup).click(function () {
                popup.empty();
                Mage.Cookies.set('show_newsletter_popup', '0', _days(365 * 5), '/');
            });
        }
    });

    function _days(n) {
        return new Date(new Date().getTime() + parseInt(n) * 24 * 60 * 60 * 1000);
    }
});

/**
 * Custom 'Disallow Non-Latin characters' validation
 */
Validation.add('validate-latin-only', 'Please enter the information using Latin letters only.', function (value) {
    // Allow only extended ASCII characters
    return !value.match(/[^\x00-\xFF]+/g);
});

/**
 * Trigger validate-latin-only on all text inputs in checkout and customer account address add/edit
 */
Validation.add('input-text', 'Please enter the information using Latin letters only.', function (value, el) {
    if (el.up('#mzcheckout-address') || el.up('.my-account .add-address')) {
        return Validation.get('validate-latin-only').test(value);
    }
    return true;
});

/**
 * Get url parameter
 * @param name
 * @returns {*}
 */
jQuery.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    } else {
        return results[1] || 0;
    }
}

/**
 * handle display for sold out sizes for filter
 * @param name
 * @returns {*}
 */
jQuery.handleSizeFilterSoldOut = function (availableSizes, sku) {
    var sizeFilter = jQuery.urlParam('size_harmonized');
    if (sizeFilter) {
        var filteredSizes = sizeFilter.split('%7C');
        var sumFilter = filteredSizes.length;
        var availableInFilters = 0;
        jQuery.each(filteredSizes, function (index, size) {
            if (jQuery.inArray(size, availableSizes) == -1) {
                availableInFilters++;
            }
        });
        /* show notice if all filtered sizes sold out */
        if (availableInFilters == sumFilter) {
            jQuery('.sold-out-size-notice.' + sku).show();
            jQuery('.sold-out-size-addtowishlist.' + sku).show();
            jQuery('.product-image.' + sku).addClass('milky');
        }
    }
}
/**
 * Check if user is identified
 * @returns {*}
 */
jQuery.isUserIdentified = function () {
    var cookieValue = Mage.Cookies.get(mytheresaVars.persistent.persistent_cookie);
    if (cookieValue) {
        var cookieParts = cookieValue.evalJSON();
        return cookieParts.hasOwnProperty('customer_info') && String(cookieParts.customer_info).length > 0;
    }
    return false;
}
/**
 * Add list item to waitlist
 * @param productId
 * @param sizes
 */
jQuery.addToWaitlist = function (productId, sizes) {
    if (jQuery.isUserIdentified()) {
        mzoverlay.open('waitlist-product-info-clone');
        new Ajax.Request( mytheresaVars.waitlist.addproductmultiajax_action + 'productId/'+productId+'/sizes/'+sizes, {
            method: 'get',
            onSuccess: function(transport) {
                data = transport.responseText;
                mzoverlay.updateContent(data);
            }
        });
    } else {
        setLocation(mytheresaVars.waitlist.addproductmulti_action + 'productId/'+productId+'/sizes/'+sizes);
    }
}


/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Varien
 * @package     js
 * @copyright   Copyright (c) 2010 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */
if(typeof Product=='undefined') {
    var Product = {};
}

/********************* IMAGE ZOOMER ***********************/

Product.Zoom = Class.create();
/**
 * Image zoom control
 *
 * @author      Magento Core Team <core@magentocommerce.com>
 */
Product.Zoom.prototype = {
    initialize: function(imageEl, trackEl, handleEl, zoomInEl, zoomOutEl, hintEl){
        this.containerEl = $(imageEl).parentNode;
        this.imageEl = $(imageEl);
        this.handleEl = $(handleEl);
        this.trackEl = $(trackEl);
        this.hintEl = $(hintEl);

        this.containerDim = Element.getDimensions(this.containerEl);
        this.imageDim = Element.getDimensions(this.imageEl);

        this.imageDim.ratio = this.imageDim.width/this.imageDim.height;

        this.floorZoom = 1;

        if (this.imageDim.width > this.imageDim.height) {
            this.ceilingZoom = this.imageDim.width / this.containerDim.width;
        } else {
            this.ceilingZoom = this.imageDim.height / this.containerDim.height;
        }

        if (this.imageDim.width <= this.containerDim.width
            && this.imageDim.height <= this.containerDim.height) {
            this.trackEl.up().hide();
            this.hintEl.hide();
            this.containerEl.removeClassName('product-image-zoom');
            return;
        }

        this.imageX = 0;
        this.imageY = 0;
        this.imageZoom = 1;

        this.sliderSpeed = 0;
        this.sliderAccel = 0;
        this.zoomBtnPressed = false;

        this.showFull = false;

        this.selects = document.getElementsByTagName('select');

        this.draggable = new Draggable(imageEl, {
            starteffect:false,
            reverteffect:false,
            endeffect:false,
            snap:this.contain.bind(this)
        });

        this.slider = new Control.Slider(handleEl, trackEl, {
            axis:'horizontal',
            minimum:0,
            maximum:Element.getDimensions(this.trackEl).width,
            alignX:0,
            increment:1,
            sliderValue:0,
            onSlide:this.scale.bind(this),
            onChange:this.scale.bind(this)
        });

        this.scale(0);

        Event.observe(this.imageEl, 'dblclick', this.toggleFull.bind(this));

        Event.observe($(zoomInEl), 'mousedown', this.startZoomIn.bind(this));
        Event.observe($(zoomInEl), 'mouseup', this.stopZooming.bind(this));
        Event.observe($(zoomInEl), 'mouseout', this.stopZooming.bind(this));

        Event.observe($(zoomOutEl), 'mousedown', this.startZoomOut.bind(this));
        Event.observe($(zoomOutEl), 'mouseup', this.stopZooming.bind(this));
        Event.observe($(zoomOutEl), 'mouseout', this.stopZooming.bind(this));
    },

    toggleFull: function () {
        this.showFull = !this.showFull;

        //Hide selects for IE6 only
        if (typeof document.body.style.maxHeight == "undefined")  {
            for (i=0; i<this.selects.length; i++) {
                this.selects[i].style.visibility = this.showFull ? 'hidden' : 'visible';
            }
        }
        val_scale = !this.showFull ? this.slider.value : 1;
        this.scale(val_scale);

        this.trackEl.style.visibility = this.showFull ? 'hidden' : 'visible';
        this.containerEl.style.overflow = this.showFull ? 'visible' : 'hidden';
        this.containerEl.style.zIndex = this.showFull ? '1000' : '9';

        return this;
    },

    scale: function (v) {
        var centerX  = (this.containerDim.width*(1-this.imageZoom)/2-this.imageX)/this.imageZoom;
        var centerY  = (this.containerDim.height*(1-this.imageZoom)/2-this.imageY)/this.imageZoom;
        var overSize = (this.imageDim.width > this.containerDim.width && this.imageDim.height > this.containerDim.height);

        this.imageZoom = this.floorZoom+(v*(this.ceilingZoom-this.floorZoom));

        if (overSize) {
            if (this.imageDim.width > this.containerDim.width) {
                this.imageEl.style.width = (this.imageZoom*this.containerDim.width)+'px';
            }

            if(this.containerDim.ratio){
                this.imageEl.style.height = (this.imageZoom*this.containerDim.width*this.containerDim.ratio)+'px'; // for safari
            }
        } else {
            this.slider.setDisabled();
        }

        this.imageX = this.containerDim.width*(1-this.imageZoom)/2-centerX*this.imageZoom;
        this.imageY = this.containerDim.height*(1-this.imageZoom)/2-centerY*this.imageZoom;

        this.contain(this.imageX, this.imageY, this.draggable);

        return true;
    },

    startZoomIn: function()
    {
        if (!this.slider.disabled) {
            this.zoomBtnPressed = true;
            this.sliderAccel = .002;
            this.periodicalZoom();
            this.zoomer = new PeriodicalExecuter(this.periodicalZoom.bind(this), .05);
        }
        return this;
    },

    startZoomOut: function()
    {
        if (!this.slider.disabled) {
            this.zoomBtnPressed = true;
            this.sliderAccel = -.002;
            this.periodicalZoom();
            this.zoomer = new PeriodicalExecuter(this.periodicalZoom.bind(this), .05);
        }
        return this;
    },

    stopZooming: function()
    {
        if (!this.zoomer || this.sliderSpeed==0) {
            return;
        }
        this.zoomBtnPressed = false;
        this.sliderAccel = 0;
    },

    periodicalZoom: function()
    {
        if (!this.zoomer) {
            return this;
        }

        if (this.zoomBtnPressed) {
            this.sliderSpeed += this.sliderAccel;
        } else {
            this.sliderSpeed /= 1.5;
            if (Math.abs(this.sliderSpeed)<.001) {
                this.sliderSpeed = 0;
                this.zoomer.stop();
                this.zoomer = null;
            }
        }
        this.slider.value += this.sliderSpeed;

        this.slider.setValue(this.slider.value);
        this.scale(this.slider.value);

        return this;
    },

    contain: function (x,y,draggable) {

        var dim = Element.getDimensions(draggable.element);

        var xMin = 0, xMax = this.containerDim.width-dim.width;
        var yMin = 0, yMax = this.containerDim.height-dim.height;

        x = x>xMin ? xMin : x;
        x = x<xMax ? xMax : x;
        y = y>yMin ? yMin : y;
        y = y<yMax ? yMax : y;

        if (this.containerDim.width > dim.width) {
            x = (this.containerDim.width/2) - (dim.width/2);
        }

        if (this.containerDim.height > dim.height) {
            y = (this.containerDim.height/2) - (dim.height/2);
        }

        this.imageX = x;
        this.imageY = y;

        this.imageEl.style.left = this.imageX+'px';
        this.imageEl.style.top = this.imageY+'px';

        return [x,y];
    }
}

/**************************** CONFIGURABLE PRODUCT **************************/
Product.Config = Class.create();
Product.Config.prototype = {
    initialize: function(config){
        this.config     = config;
        this.taxConfig  = this.config.taxConfig;
        this.settings   = $$('.super-attribute-select');
        this.state      = new Hash();
        this.priceTemplate = new Template(this.config.template);
        this.prices     = config.prices;

        this.settings.each(function(element){
            Event.observe(element, 'change', this.configure.bind(this))
        }.bind(this));

        // fill state
        this.settings.each(function(element){
            var attributeId = element.id.replace(/[a-z]*/, '');
            if(attributeId && this.config.attributes[attributeId]) {
                element.config = this.config.attributes[attributeId];
                element.attributeId = attributeId;
                this.state[attributeId] = false;
            }
        }.bind(this))

        // Init settings dropdown
        var childSettings = [];
        for(var i=this.settings.length-1;i>=0;i--){
            var prevSetting = this.settings[i-1] ? this.settings[i-1] : false;
            var nextSetting = this.settings[i+1] ? this.settings[i+1] : false;
            if(i==0){
                this.fillSelect(this.settings[i])
            }
            else {
                this.settings[i].disabled=true;
            }
            $(this.settings[i]).childSettings = childSettings.clone();
            $(this.settings[i]).prevSetting   = prevSetting;
            $(this.settings[i]).nextSetting   = nextSetting;
            childSettings.push(this.settings[i]);
        }

        // try retireve options from url
        var separatorIndex = window.location.href.indexOf('#');
        if (separatorIndex!=-1) {
            var paramsStr = window.location.href.substr(separatorIndex+1);
            this.values = paramsStr.toQueryParams();
            this.settings.each(function(element){
                var attributeId = element.attributeId;
                element.value = (typeof(this.values[attributeId]) == 'undefined')? '' : this.values[attributeId];
                this.configureElement(element);
            }.bind(this));
        }
    },

    configure: function(event){
        var element = Event.element(event);
        this.configureElement(element);
    },

    configureElement : function(element) {
        this.reloadOptionLabels(element);
        if(element.value){
            this.state[element.config.id] = element.value;
            if(element.nextSetting){
                element.nextSetting.disabled = false;
                this.fillSelect(element.nextSetting);
                this.resetChildren(element.nextSetting);
            }
            var attributeOptions = this.getAttributeOptions(element.config.id);
            for(var i=0;i<attributeOptions.length;i++){
                if(attributeOptions[i]['id'] == element.value){
                    if(attributeOptions[i]['haswaitlist'] == 1){
                        addToWaitlist();
                    }
                }
            }
        }
        else {
            this.resetChildren(element);
        }
        
        //this.reloadPrice();
//      Calculator.updatePrice();
    },

    reloadOptionLabels: function(element){
        var selectedPrice;
        if(element.options[element.selectedIndex].config){
            selectedPrice = parseFloat(element.options[element.selectedIndex].config.price)
        }
        else{
            selectedPrice = 0;
        }
        for(var i=0;i<element.options.length;i++){
            if(element.options[i].config){
                element.options[i].text = this.getOptionLabel(element.options[i].config, element.options[i].config.price-selectedPrice);
            }
        }
    },

    resetChildren : function(element){
        if(element.childSettings) {
            for(var i=0;i<element.childSettings.length;i++){
                element.childSettings[i].selectedIndex = 0;
                element.childSettings[i].disabled = true;
                if(element.config){
                    this.state[element.config.id] = false;
                }
            }
        }
    },

    fillSelect: function(element){
        var attributeId = element.id.replace(/[a-z]*/, '');
        var options = this.getAttributeOptions(attributeId);
        
        
        
        this.clearSelect(element);
        element.options[0] = new Option(this.config.chooseText, '');

        var prevConfig = false;
        if(element.prevSetting){
            prevConfig = element.prevSetting.options[element.prevSetting.selectedIndex];
        }

        if(options) {
            var index = 1;
            for(var i=0;i<options.length;i++){
                var allowedProducts = [];
                if(prevConfig) {
                    for(var j=0;j<options[i].products.length;j++){
                        if(prevConfig.config.allowedProducts
                            && prevConfig.config.allowedProducts.indexOf(options[i].products[j])>-1){
                            allowedProducts.push(options[i].products[j]);
                        }
                    }
                } else {
                    allowedProducts = options[i].products.clone();
                }

                if(allowedProducts.size()>0){
                    options[i].allowedProducts = allowedProducts;
                    element.options[index] = new Option(this.getOptionLabel(options[i], options[i].price), options[i].id);
                    element.options[index].config = options[i];
                    index++;
                }
            }
        }
        
        if(options.length == 1) {           
            if(element.options[1].innerHTML.substring(0,1) == '-') {
                element.options[1].selected = "selected";
                element.hide();
                $$('.add-to-box').first().addClassName('hidden-select');
            } else {
                 if($('one-size-item') != null){
                    $('one-size-item').hide();
                }
            }          
        } else {            
            if($('one-size-item') != null){
                $('one-size-item').hide();
            }
        }
    },

    getOptionLabel: function(option, price){
        var price = parseFloat(price);
        if (this.taxConfig.includeTax) {
            var tax = price / (100 + this.taxConfig.defaultTax) * this.taxConfig.defaultTax;
            var excl = price - tax;
            var incl = excl*(1+(this.taxConfig.currentTax/100));
        } else {
            var tax = price * (this.taxConfig.currentTax / 100);
            var excl = price;
            var incl = excl + tax;
        }

        if (this.taxConfig.showIncludeTax || this.taxConfig.showBothPrices) {
            price = incl;
        } else {
            price = excl;
        }

        var str = option.label;
        if(price){
            if (this.taxConfig.showBothPrices) {
                str+= ' ' + this.formatPrice(excl, true) + ' (' + this.formatPrice(price, true) + ' ' + this.taxConfig.inclTaxTitle + ')';
            } else {
                str+= ' ' + this.formatPrice(price, true);
            }
        }
        
        if(option.saleable == 0) {
            str+= ' ' + option.waitlist;
        }
        
        return str;
    },

    formatPrice: function(price, showSign){
        var str = '';
        price = parseFloat(price);
        if(showSign){
            if(price<0){
                str+= '-';
                price = -price;
            }
            else{
                str+= '+';
            }
        }

        var roundedPrice = (Math.round(price*100)/100).toString();

        if (this.prices && this.prices[roundedPrice]) {
            str+= this.prices[roundedPrice];
        }
        else {
            str+= this.priceTemplate.evaluate({price:price.toFixed(2)});
        }
        return str;
    },

    clearSelect: function(element){
        for(var i=element.options.length-1;i>=0;i--){
            element.remove(i);
        }
    },

    getAttributeOptions: function(attributeId){
        if(this.config.attributes[attributeId]){
            return this.config.attributes[attributeId].options;
        }
    },

    reloadPrice: function(){
        var price    = 0;
        var oldPrice = 0;
        for(var i=this.settings.length-1;i>=0;i--){
            var selected = this.settings[i].options[this.settings[i].selectedIndex];
            if(selected.config){
                price    += parseFloat(selected.config.price);
                oldPrice += parseFloat(selected.config.oldPrice);
            }
        }

        optionsPrice.changePrice('config', {'price': price, 'oldPrice': oldPrice});
        optionsPrice.reload();

        return price;

        if($('product-price-'+this.config.productId)){
            $('product-price-'+this.config.productId).innerHTML = price;
        }
        this.reloadOldPrice();
    },

    reloadOldPrice: function(){
        if ($('old-price-'+this.config.productId)) {

            var price = parseFloat(this.config.oldPrice);
            for(var i=this.settings.length-1;i>=0;i--){
                var selected = this.settings[i].options[this.settings[i].selectedIndex];
                if(selected.config){
                    price+= parseFloat(selected.config.price);
                }
            }
            if (price < 0)
                price = 0;
            price = this.formatPrice(price);

            if($('old-price-'+this.config.productId)){
                $('old-price-'+this.config.productId).innerHTML = price;
            }

        }
    }
}


/**************************** SUPER PRODUCTS ********************************/

Product.Super = {};
Product.Super.Configurable = Class.create();

Product.Super.Configurable.prototype = {
    initialize: function(container, observeCss, updateUrl, updatePriceUrl, priceContainerId) {
        this.container = $(container);
        this.observeCss = observeCss;
        this.updateUrl = updateUrl;
        this.updatePriceUrl = updatePriceUrl;
        this.priceContainerId = priceContainerId;
        this.registerObservers();
    },
    registerObservers: function() {
        var elements = this.container.getElementsByClassName(this.observeCss);
        elements.each(function(element){
            Event.observe(element, 'change', this.update.bindAsEventListener(this));
        }.bind(this));
        return this;
    },
    update: function(event) {
        var elements = this.container.getElementsByClassName(this.observeCss);
        var parameters = Form.serializeElements(elements, true);

        new Ajax.Updater(this.container, this.updateUrl + '?ajax=1', {
                parameters:parameters,
                onComplete:this.registerObservers.bind(this)
        });
        var priceContainer = $(this.priceContainerId);
        if(priceContainer) {
            new Ajax.Updater(priceContainer, this.updatePriceUrl + '?ajax=1', {
                parameters:parameters
            });
        }
    }
}

/**************************** PRICE RELOADER ********************************/
Product.OptionsPrice = Class.create();
Product.OptionsPrice.prototype = {
    initialize: function(config) {
        this.productId          = config.productId;
        this.priceFormat        = config.priceFormat;
        this.includeTax         = config.includeTax;
        this.defaultTax         = config.defaultTax;
        this.currentTax         = config.currentTax;
        this.productPrice       = config.productPrice;
        this.showIncludeTax     = config.showIncludeTax;
        this.showBothPrices     = config.showBothPrices;
        this.productPrice       = config.productPrice;
        this.productOldPrice    = config.productOldPrice;
        this.skipCalculate      = config.skipCalculate;
        this.duplicateIdSuffix  = config.idSuffix;

        this.oldPlusDisposition = config.oldPlusDisposition;
        this.plusDisposition    = config.plusDisposition;

        this.oldMinusDisposition = config.oldMinusDisposition;
        this.minusDisposition    = config.minusDisposition;

        this.optionPrices    = {};
        this.containers      = {};

        this.displayZeroPrice   = true;

        this.initPrices();
    },

    setDuplicateIdSuffix: function(idSuffix) {
        this.duplicateIdSuffix = idSuffix;
    },

    initPrices: function() {
        this.containers[0] = 'product-price-' + this.productId;
        this.containers[1] = 'bundle-price-' + this.productId;
        this.containers[2] = 'price-including-tax-' + this.productId;
        this.containers[3] = 'price-excluding-tax-' + this.productId;
        this.containers[4] = 'old-price-' + this.productId;
    },

    changePrice: function(key, price) {
        this.optionPrices[key] = price;
    },

    getOptionPrices: function() {
        var price = 0;
        var nonTaxable = 0;
        var oldPrice = 0;
        $H(this.optionPrices).each(function(pair) {
            if ('undefined' != typeof(pair.value.price) && 'undefined' != typeof(pair.value.oldPrice)) {
                price += parseFloat(pair.value.price);
                oldPrice += parseFloat(pair.value.oldPrice);
            } else if (pair.key == 'nontaxable') {
                nonTaxable = pair.value;
            } else {
                price += parseFloat(pair.value);
                oldPrice += parseFloat(pair.value);
            }
        });
        var result = [price, nonTaxable, oldPrice];
        return result;
    },

    reload: function() {
        var price;
        var formattedPrice;
        var optionPrices = this.getOptionPrices();
        var nonTaxable = optionPrices[1];
        var optionOldPrice = optionPrices[2];
        optionPrices = optionPrices[0];
        $H(this.containers).each(function(pair) {
            var _productPrice;
            var _plusDisposition;
            var _minusDisposition;
            if ($(pair.value)) {
                if (pair.value == 'old-price-'+this.productId && this.productOldPrice != this.productPrice) {
                    _productPrice = this.productOldPrice;
                    _plusDisposition = this.oldPlusDisposition;
                    _minusDisposition = this.oldMinusDisposition;
                } else {
                    _productPrice = this.productPrice;
                    _plusDisposition = this.plusDisposition;
                    _minusDisposition = this.minusDisposition;
                }

                var price = 0;
                if (pair.value == 'old-price-'+this.productId && optionOldPrice !== undefined) {
                    price = optionOldPrice+parseFloat(_productPrice);
                } else {
                    price = optionPrices+parseFloat(_productPrice);
                }
                if (this.includeTax == 'true') {
                    // tax = tax included into product price by admin
                    var tax = price / (100 + this.defaultTax) * this.defaultTax;
                    var excl = price - tax;
                    var incl = excl*(1+(this.currentTax/100));
                } else {
                    var tax = price * (this.currentTax / 100);
                    var excl = price;
                    var incl = excl + tax;
                }

                excl += parseFloat(_plusDisposition);
                incl += parseFloat(_plusDisposition);
                excl -= parseFloat(_minusDisposition);
                incl -= parseFloat(_minusDisposition);

                //adding nontaxlable part of options
                excl += parseFloat(nonTaxable);
                incl += parseFloat(nonTaxable);

                if (pair.value == 'price-including-tax-'+this.productId) {
                    price = incl;
                } else if (pair.value == 'old-price-'+this.productId) {
                    if (this.showIncludeTax || this.showBothPrices) {
                        price = incl;
                    } else {
                        price = excl;
                    }
                } else {
                    if (this.showIncludeTax) {
                        price = incl;
                    } else {
                        if (!this.skipCalculate || _productPrice == 0) {
                            price = excl;
                        } else {
                            price = optionPrices+parseFloat(_productPrice);
                        }
                    }
                }

                if (price < 0) price = 0;

                if (price > 0 || this.displayZeroPrice) {
                    formattedPrice = this.formatPrice(price);
                } else {
                    formattedPrice = '';
                }

                if ($(pair.value).select('.price')[0]) {
                    $(pair.value).select('.price')[0].innerHTML = formattedPrice;
                    if ($(pair.value+this.duplicateIdSuffix) && $(pair.value+this.duplicateIdSuffix).select('.price')[0]) {
                        $(pair.value+this.duplicateIdSuffix).select('.price')[0].innerHTML = formattedPrice;
                    }
                } else {
                    $(pair.value).innerHTML = formattedPrice;
                    if ($(pair.value+this.duplicateIdSuffix)) {
                        $(pair.value+this.duplicateIdSuffix).innerHTML = formattedPrice;
                    }
                }
            };
        }.bind(this));
    },
    formatPrice: function(price) {
        return formatCurrency(price, this.priceFormat);
    }
}

/*


   Magic Zoom Plus v4.0.31 
   Copyright 2012 Magic Toolbox
   Buy a license: www.magictoolbox.com/magiczoomplus/
   License agreement: http://www.magictoolbox.com/license/


*/
eval(function(m,a,g,i,c,k){c=function(e){return(e<a?'':c(parseInt(e/a)))+((e=e%a)>35?String.fromCharCode(e+29):e.toString(36))};if(!''.replace(/^/,String)){while(g--){k[c(g)]=i[g]||c(g)}i=[function(e){return k[e]}];c=function(){return'\\w+'};g=1};while(g--){if(i[g]){m=m.replace(new RegExp('\\b'+c(g)+'\\b','g'),i[g])}}return m}('(L(){K(1a.64){M}P b={3m:"ck.7.0",bC:0,5B:{},$9A:L(d){M(d.$4n||(d.$4n=++a.bC))},8h:L(d){M(a.5B[d]||(a.5B[d]={}))},$F:L(){},$U:L(){M U},2C:L(d){M(1C!=d)},ey:L(d){M!!(d)},3k:L(d){K(!a.2C(d)){M U}K(d.$3Z){M d.$3Z}K(!!d.52){K(1==d.52){M"9g"}K(3==d.52){M"bR"}}K(d.1v&&d.8w){M"ez"}K(d.1v&&d.8p){M"1Z"}K((d 48 1a.eA||d 48 1a.9N)&&d.4k===a.4g){M"7x"}K(d 48 1a.5f){M"5n"}K(d 48 1a.9N){M"L"}K(d 48 1a.7E){M"74"}K(a.V.2p){K(a.2C(d.bL)){M"46"}}17{K(d===1a.46||d.4k==1a.a7||d.4k==1a.eB||d.4k==1a.ex||d.4k==1a.ew||d.4k==1a.es){M"46"}}K(d 48 1a.bn){M"bV"}K(d 48 1a.4x){M"er"}K(d===1a){M"1a"}K(d===1c){M"1c"}M 3P(d)},1U:L(j,h){K(!(j 48 1a.5f)){j=[j]}1B(P g=0,e=j.1v;g<e;g++){K(!a.2C(j)){5G}1B(P f 1I(h||{})){2Q{j[g][f]=h[f]}3e(d){}}}M j[0]},7X:L(h,g){K(!(h 48 1a.5f)){h=[h]}1B(P f=0,d=h.1v;f<d;f++){K(!a.2C(h[f])){5G}K(!h[f].2J){5G}1B(P e 1I(g||{})){K(!h[f].2J[e]){h[f].2J[e]=g[e]}}}M h[0]},bw:L(f,e){K(!a.2C(f)){M f}1B(P d 1I(e||{})){K(!f[d]){f[d]=e[d]}}M f},$2Q:L(){1B(P f=0,d=1Z.1v;f<d;f++){2Q{M 1Z[f]()}3e(g){}}M 12},$A:L(f){K(!a.2C(f)){M $S([])}K(f.by){M $S(f.by())}K(f.8w){P e=f.1v||0,d=1k 5f(e);3x(e--){d[e]=f[e]}M $S(d)}M $S(5f.2J.et.1T(f))},3K:L(){M 1k bn().eu()},3z:L(h){P f;2b(a.3k(h)){1f"cL":f={};1B(P g 1I h){f[g]=a.3z(h[g])}1g;1f"5n":f=[];1B(P e=0,d=h.1v;e<d;e++){f[e]=a.3z(h[e])}1g;2h:M h}M a.$(f)},$:L(e){K(!a.2C(e)){M 12}K(e.$9u){M e}2b(a.3k(e)){1f"5n":e=a.bw(e,a.1U(a.5f,{$9u:a.$F}));e.2L=e.3C;M e;1g;1f"74":P d=1c.ev(e);K(a.2C(d)){M a.$(d)}M 12;1g;1f"1a":1f"1c":a.$9A(e);e=a.1U(e,a.6m);1g;1f"9g":a.$9A(e);e=a.1U(e,a.3h);1g;1f"46":e=a.1U(e,a.a7);1g;1f"bR":M e;1g;1f"L":1f"5n":1f"bV":2h:1g}M a.1U(e,{$9u:a.$F})},$1k:L(d,f,e){M $S(a.2F.3J(d)).bB(f||{}).19(e||{})},eC:L(e){K(1c.8H&&1c.8H.1v){1c.8H[0].eD(e,0)}17{P d=$S(1c.3J("1z"));d.2W(e);1c.6o("a5")[0].2a(d)}}};P a=b;1a.64=b;1a.$S=b.$;a.5f={$3Z:"5n",4e:L(g,h){P d=J.1v;1B(P e=J.1v,f=(h<0)?1s.3I(0,e+h):h||0;f<e;f++){K(J[f]===g){M f}}M-1},4T:L(d,e){M J.4e(d,e)!=-1},3C:L(d,g){1B(P f=0,e=J.1v;f<e;f++){K(f 1I J){d.1T(g,J[f],f,J)}}},2E:L(d,j){P h=[];1B(P g=0,e=J.1v;g<e;g++){K(g 1I J){P f=J[g];K(d.1T(j,J[g],g,J)){h.47(f)}}}M h},dw:L(d,h){P g=[];1B(P f=0,e=J.1v;f<e;f++){K(f 1I J){g[f]=d.1T(h,J[f],f,J)}}M g}};a.7X(7E,{$3Z:"74",41:L(){M J.2o(/^\\s+|\\s+$/g,"")},eq:L(d,e){M(e||U)?(J.5u()===d.5u()):(J.2U().5u()===d.2U().5u())},3v:L(){M J.2o(/-\\D/g,L(d){M d.b4(1).eL()})},6k:L(){M J.2o(/[A-Z]/g,L(d){M("-"+d.b4(0).2U())})},1G:L(d){M 3o(J,d||10)},db:L(){M 3H(J)},6l:L(){M!J.2o(/13/i,"").41()},3b:L(e,d){d=d||"";M(d+J+d).4e(d+e+d)>-1}});b.7X(9N,{$3Z:"L",1p:L(){P e=a.$A(1Z),d=J,f=e.6D();M L(){M d.4B(f||12,e.b6(a.$A(1Z)))}},2u:L(){P e=a.$A(1Z),d=J,f=e.6D();M L(g){M d.4B(f||12,$S([g||1a.46]).b6(e))}},2t:L(){P e=a.$A(1Z),d=J,f=e.6D();M 1a.6f(L(){M d.4B(d,e)},f||0)},cn:L(){P e=a.$A(1Z),d=J;M L(){M d.2t.4B(d,e)}},cj:L(){P e=a.$A(1Z),d=J,f=e.6D();M 1a.eM(L(){M d.4B(d,e)},f||0)}});P c=ar.eN.2U();a.V={7R:{co:!!(1c.eO),eK:!!(1a.eJ),95:!!(1c.eF)},2z:L(){M"eE"1I 1a||(1a.di&&1c 48 di)}(),dh:c.3g(/cq.+dh|eG|eH|eI\\/|ep|eo|e6|e7|e8|e9|e5|dq(cY|dj)|e4|e0|dZ |e1|e2|e3|ea|bM m(eb|1I)i|ej( ek)?|bY|p(em|en)\\/|ei|eh|ed|dY|ee|ef\\.(V|5p)|eg|eP|eQ (ce|bY)|fo|fp/)?13:U,4m:(1a.bM)?"5z":!!(1a.fq)?"2p":(1C!=1c.fr||12!=1a.fn)?"9Y":(12!=1a.fm||!ar.fi)?"3w":"fh",3m:"",7I:0,7w:c.3g(/dq(?:ad|dj|cY)/)?"c7":(c.3g(/(?:fj|cq)/)||ar.7w.3g(/bx|4J|fk/i)||["fl"])[0].2U(),3S:1c.8f&&"c9"==1c.8f.2U(),44:L(){M(1c.8f&&"c9"==1c.8f.2U())?1c.24:1c.85},5y:1a.5y||1a.fs||1a.ft||1a.fA||1a.fB||1C,8s:1a.8s||1a.cG||1a.cG||1a.fC||1a.fD||1a.fz||1C,1L:U,5U:L(){K(a.V.1L){M}a.V.1L=13;a.24=$S(1c.24);a.4J=$S(1a);(L(){a.V.5I={45:U,2X:""};K(3P 1c.24.1z.bs!=="1C"){a.V.5I.45=13}17{P f="cM cN O 8B cO".43(" ");1B(P e=0,d=f.1v;e<d;e++){a.V.5I.2X=f[e];K(3P 1c.24.1z[a.V.5I.2X+"fy"]!=="1C"){a.V.5I.45=13;1g}}}})();(L(){a.V.73={45:U,2X:""};K(3P 1c.24.1z.fu!=="1C"){a.V.73.45=13}17{P f="cM cN O 8B cO".43(" ");1B(P e=0,d=f.1v;e<d;e++){a.V.73.2X=f[e];K(3P 1c.24.1z[a.V.73.2X+"fv"]!=="1C"){a.V.73.45=13;1g}}}})();$S(1c).b5("4H")}};(L(){L d(){M!!(1Z.8p.ak)}a.V.3m=("5z"==a.V.4m)?!!(1c.a5)?fw:!!(1a.fx)?fg:!!(1a.aP)?79:(a.V.7R.95)?ff:((d())?eY:((1c.7g)?eZ:6h)):("2p"==a.V.4m)?!!(1a.f0||1a.f1)?aN:!!(1a.cX&&1a.eX)?6:((1a.cX)?5:4):("3w"==a.V.4m)?((a.V.7R.co)?((a.V.7R.95)?eW:cm):eS):("9Y"==a.V.4m)?!!(1c.a5)?6h:!!1c.6j?eR:!!(1a.aP)?eT:((1c.7g)?eU:eV):"";a.V[a.V.4m]=a.V[a.V.4m+a.V.3m]=13;K(1a.b9){a.V.b9=13}a.V.7I=(!a.V.2p)?0:(1c.b8)?1c.b8:L(){P e=0;K(a.V.3S){M 5}2b(a.V.3m){1f 4:e=6;1g;1f 5:e=7;1g;1f 6:e=8;1g;1f aN:e=9;1g}M e}()})();(L(){a.V.36={45:U,7p:L(){M U},9Z:L(){},c6:L(){},aU:"",aR:"",2X:""};K(3P 1c.c3!="1C"){a.V.36.45=13}17{P f="3w d7 o 8B f2".43(" ");1B(P e=0,d=f.1v;e<d;e++){a.V.36.2X=f[e];K(3P 1c[a.V.36.2X+"c1"]!="1C"){a.V.36.45=13;1g}}}K(a.V.36.45){a.V.36.aU=a.V.36.2X+"f3";a.V.36.aR=a.V.36.2X+"fb";a.V.36.7p=L(){2b(J.2X){1f"":M 1c.36;1f"3w":M 1c.fc;2h:M 1c[J.2X+"fd"]}};a.V.36.9Z=L(g){M(J.2X==="")?g.ca():g[J.2X+"fe"]()};a.V.36.c6=L(g){M(J.2X==="")?1c.c3():1c[J.2X+"c1"]()}}})();a.3h={51:L(d){M J.2N.3b(d," ")},2j:L(d){K(d&&!J.51(d)){J.2N+=(J.2N?" ":"")+d}M J},4c:L(d){d=d||".*";J.2N=J.2N.2o(1k 4x("(^|\\\\s)"+d+"(?:\\\\s|$)"),"$1").41();M J},fa:L(d){M J.51(d)?J.4c(d):J.2j(d)},1P:L(f){f=(f=="4S"&&J.7k)?"9H":f.3v();P d=12,e=12;K(J.7k){d=J.7k[f]}17{K(1c.9L&&1c.9L.bu){e=1c.9L.bu(J,12);d=e?e.f9([f.6k()]):12}}K(!d){d=J.1z[f]}K("1u"==f){M a.2C(d)?3H(d):1}K(/^(2l(8t|8u|8q|8m)bJ)|((2n|1Y)(8t|8u|8q|8m))$/.2e(f)){d=3o(d)?d:"1M"}M("1w"==d?12:d)},1E:L(f,d){2Q{K("1u"==f){J.2v(d);M J}17{K("4S"==f){J.1z[("1C"===3P(J.1z.9H))?"f5":"9H"]=d;M J}17{K(a.V.5I&&/bs/.2e(f)){}}}J.1z[f.3v()]=d+(("5w"==a.3k(d)&&!$S(["2q","1j"]).4T(f.3v()))?"1r":"")}3e(g){}M J},19:L(e){1B(P d 1I e){J.1E(d,e[d])}M J},4h:L(){P d={};a.$A(1Z).2L(L(e){d[e]=J.1P(e)},J);M d},2v:L(h,e){e=e||U;h=3H(h);K(e){K(h==0){K("1J"!=J.1z.2w){J.1z.2w="1J"}}17{K("4a"!=J.1z.2w){J.1z.2w="4a"}}}K(a.V.2p){K(!J.7k||!J.7k.f4){J.1z.1j=1}2Q{P g=J.f6.8w("bp.bz.bI");g.7p=(1!=h);g.1u=h*22}3e(d){J.1z.2E+=(1==h)?"":"f7:bp.bz.bI(7p=13,1u="+h*22+")"}}J.1z.1u=h;M J},bB:L(d){1B(P e 1I d){J.f8(e,""+d[e])}M J},1N:L(){M J.19({1V:"2Y",2w:"1J"})},1X:L(){M J.19({1V:"28",2w:"4a"})},21:L(){M{Q:J.cF,R:J.ao}},6G:L(){M{X:J.4y,Y:J.5i}},fE:L(){P d=J,e={X:0,Y:0};do{e.Y+=d.5i||0;e.X+=d.4y||0;d=d.2x}3x(d);M e},3l:L(){K(a.2C(1c.85.bD)){P d=J.bD(),f=$S(1c).6G(),h=a.V.44();M{X:d.X+f.y-h.dU,Y:d.Y+f.x-h.dW}}P g=J,e=t=0;do{e+=g.dQ||0;t+=g.dN||0;g=g.dM}3x(g&&!(/^(?:24|dL)$/i).2e(g.3V));M{X:t,Y:e}},4q:L(){P e=J.3l();P d=J.21();M{X:e.X,1d:e.X+d.R,Y:e.Y,1e:e.Y+d.Q}},6A:L(f){2Q{J.7y=f}3e(d){J.dP=f}M J},4w:L(){M(J.2x)?J.2x.3B(J):J},5s:L(){a.$A(J.dF).2L(L(d){K(3==d.52||8==d.52){M}$S(d).5s()});J.4w();J.aj();K(J.$4n){a.5B[J.$4n]=12;3p a.5B[J.$4n]}M 12},4V:L(g,e){e=e||"1d";P d=J.2I;("X"==e&&d)?J.b1(g,d):J.2a(g);M J},1S:L(f,e){P d=$S(f).4V(J,e);M J},cJ:L(d){J.4V(d.2x.7q(J,d));M J},5t:L(d){K(!(d=$S(d))){M U}M(J==d)?U:(J.4T&&!(a.V.cS))?(J.4T(d)):(J.bk)?!!(J.bk(d)&16):a.$A(J.2k(d.3V)).4T(d)}};a.3h.6T=a.3h.1P;a.3h.da=a.3h.19;K(!1a.3h){1a.3h=a.$F;K(a.V.4m.3w){1a.1c.3J("dG")}1a.3h.2J=(a.V.4m.3w)?1a["[[dI.2J]]"]:{}}a.7X(1a.3h,{$3Z:"9g"});a.6m={21:L(){K(a.V.dC||a.V.cS){M{Q:W.8L,R:W.8V}}M{Q:a.V.44().dJ,R:a.V.44().dR}},6G:L(){M{x:W.dT||a.V.44().5i,y:W.dO||a.V.44().4y}},9X:L(){P d=J.21();M{Q:1s.3I(a.V.44().dK,d.Q),R:1s.3I(a.V.44().dX,d.R)}}};a.1U(1c,{$3Z:"1c"});a.1U(1a,{$3Z:"1a"});a.1U([a.3h,a.6m],{1b:L(g,e){P d=a.8h(J.$4n),f=d[g];K(1C!=e&&1C==f){f=d[g]=e}M(a.2C(f)?f:12)},1A:L(f,e){P d=a.8h(J.$4n);d[f]=e;M J},8i:L(e){P d=a.8h(J.$4n);3p d[e];M J}});K(!(1a.ai&&1a.ai.2J&&1a.ai.2J.7g)){a.1U([a.3h,a.6m],{7g:L(d){M a.$A(J.6o("*")).2E(L(g){2Q{M(1==g.52&&g.2N.3b(d," "))}3e(f){}})}})}a.1U([a.3h,a.6m],{dV:L(){M J.7g(1Z[0])},2k:L(){M J.6o(1Z[0])}});K(a.V.36.45){a.3h.ca=L(){a.V.36.9Z(J)}}a.a7={$3Z:"46",1o:L(){K(J.dv){J.dv()}17{J.bL=13}K(J.9C){J.9C()}17{J.dS=U}M J},aa:L(){P e,d;e=((/6F/i).2e(J.2M))?J.8M[0]:J;M(!a.2C(e))?{x:0,y:0}:{x:e.dB||e.dD+a.V.44().5i,y:e.dE||e.dH+a.V.44().4y}},4C:L(){P d=J.ec||J.fN;3x(d&&3==d.52){d=d.2x}M d},4L:L(){P e=12;2b(J.2M){1f"1Q":e=J.bE||J.h9;1g;1f"2B":e=J.bE||J.h8;1g;2h:M e}2Q{3x(e&&3==e.52){e=e.2x}}3e(d){e=12}M e},54:L(){K(!J.bG&&J.8O!==1C){M(J.8O&1?1:(J.8O&2?3:(J.8O&4?2:0)))}M J.bG}};a.9w="bo";a.a2="he";a.8o="";K(!1c.bo){a.9w="h4";a.a2="hr";a.8o="4E"}a.1U([a.3h,a.6m],{1t:L(g,f){P i=("4H"==g)?U:13,e=J.1b("7j",{});e[g]=e[g]||{};K(e[g].58(f.$6Z)){M J}K(!f.$6Z){f.$6Z=1s.7D(1s.7z()*a.3K())}P d=J,h=L(j){M f.1T(d)};K("4H"==g){K(a.V.1L){f.1T(J);M J}}K(i){h=L(j){j=a.1U(j||1a.e,{$3Z:"46"});M f.1T(d,$S(j))};J[a.9w](a.8o+g,h,U)}e[g][f.$6Z]=h;M J},2D:L(g){P i=("4H"==g)?U:13,e=J.1b("7j");K(!e||!e[g]){M J}P h=e[g],f=1Z[1]||12;K(g&&!f){1B(P d 1I h){K(!h.58(d)){5G}J.2D(g,d)}M J}f=("L"==a.3k(f))?f.$6Z:f;K(!h.58(f)){M J}K("4H"==g){i=U}K(i){J[a.a2](a.8o+g,h[f],U)}3p h[f];M J},b5:L(h,f){P m=("4H"==h)?U:13,l=J,j;K(!m){P g=J.1b("7j");K(!g||!g[h]){M J}P i=g[h];1B(P d 1I i){K(!i.58(d)){5G}i[d].1T(J)}M J}K(l===1c&&1c.8P&&!l.cW){l=1c.85}K(1c.8P){j=1c.8P(h);j.hq(f,13,13)}17{j=1c.hl();j.hs=h}K(1c.8P){l.cW(j)}17{l.hw("4E"+f,j)}M j},aj:L(){P d=J.1b("7j");K(!d){M J}1B(P e 1I d){J.2D(e)}J.8i("7j");M J}});(L(){K("6r"===1c.6j){M a.V.5U.2t(1)}K(a.V.3w&&a.V.3m<cm){(L(){($S(["hE","6r"]).4T(1c.6j))?a.V.5U():1Z.8p.2t(50)})()}17{K(a.V.2p&&a.V.7I<9&&1a==X){(L(){(a.$2Q(L(){a.V.44().gT("Y");M 13}))?a.V.5U():1Z.8p.2t(50)})()}17{$S(1c).1t("gR",a.V.5U);$S(1a).1t("2y",a.V.5U)}}})();a.4g=L(){P h=12,e=a.$A(1Z);K("7x"==a.3k(e[0])){h=e.6D()}P d=L(){1B(P l 1I J){J[l]=a.3z(J[l])}K(J.4k.$3q){J.$3q={};P o=J.4k.$3q;1B(P n 1I o){P j=o[n];2b(a.3k(j)){1f"L":J.$3q[n]=a.4g.cQ(J,j);1g;1f"cL":J.$3q[n]=a.3z(j);1g;1f"5n":J.$3q[n]=a.3z(j);1g}}}P i=(J.3M)?J.3M.4B(J,1Z):J;3p J.ak;M i};K(!d.2J.3M){d.2J.3M=a.$F}K(h){P g=L(){};g.2J=h.2J;d.2J=1k g;d.$3q={};1B(P f 1I h.2J){d.$3q[f]=h.2J[f]}}17{d.$3q=12}d.4k=a.4g;d.2J.4k=d;a.1U(d.2J,e[0]);a.1U(d,{$3Z:"7x"});M d};b.4g.cQ=L(d,e){M L(){P g=J.ak;P f=e.4B(d,1Z);M f}};a.4J=$S(1a);a.2F=$S(1c)})();(L(b){K(!b){7i"81 80 7T";M}K(b.1O){M}P a=b.$;b.1O=1k b.4g({N:{3T:60,2Z:7Z,4b:L(c){M-(1s.ax(1s.av*c)-1)/2},5M:b.$F,3X:b.$F,7n:b.$F,72:U,cx:13},2P:12,3M:L(d,c){J.el=a(d);J.N=b.1U(J.N,c);J.4A=U},1y:L(c){J.2P=c;J.1D=0;J.gM=0;J.aH=b.3K();J.dA=J.aH+J.N.2Z;J.aE=J.aq.1p(J);J.N.5M.1T();K(!J.N.72&&b.V.5y){J.4A=b.V.5y.1T(1a,J.aE)}17{J.4A=J.aq.1p(J).cj(1s.5H(a9/J.N.3T))}M J},aw:L(){K(J.4A){K(!J.N.72&&b.V.5y&&b.V.8s){b.V.8s.1T(1a,J.4A)}17{gN(J.4A)}J.4A=U}},1o:L(c){c=b.2C(c)?c:U;J.aw();K(c){J.6g(1);J.N.3X.2t(10)}M J},7c:L(e,d,c){M(d-e)*c+e},aq:L(){P d=b.3K();K(d>=J.dA){J.aw();J.6g(1);J.N.3X.2t(10);M J}P c=J.N.4b((d-J.aH)/J.N.2Z);K(!J.N.72&&b.V.5y){J.4A=b.V.5y.1T(1a,J.aE)}J.6g(c)},6g:L(c){P d={};1B(P e 1I J.2P){K("1u"===e){d[e]=1s.5H(J.7c(J.2P[e][0],J.2P[e][1],c)*22)/22}17{d[e]=J.7c(J.2P[e][0],J.2P[e][1],c);K(J.N.cx){d[e]=1s.5H(d[e])}}}J.N.7n(d);J.7m(d)},7m:L(c){M J.el.19(c)}});b.1O.3f={4o:L(c){M c},bH:L(c){M-(1s.ax(1s.av*c)-1)/2},gO:L(c){M 1-b.1O.3f.bH(1-c)},c5:L(c){M 1s.5P(2,8*(c-1))},ha:L(c){M 1-b.1O.3f.c5(1-c)},aQ:L(c){M 1s.5P(c,2)},hb:L(c){M 1-b.1O.3f.aQ(1-c)},bi:L(c){M 1s.5P(c,3)},hd:L(c){M 1-b.1O.3f.bi(1-c)},b0:L(d,c){c=c||1.hc;M 1s.5P(d,2)*((c+1)*d-c)},h7:L(d,c){M 1-b.1O.3f.b0(1-d)},cT:L(d,c){c=c||[];M 1s.5P(2,10*--d)*1s.ax(20*d*1s.av*(c[0]||1)/3)},h1:L(d,c){M 1-b.1O.3f.cT(1-d,c)},cI:L(e){1B(P d=0,c=1;1;d+=c,c/=2){K(e>=(7-4*d)/11){M c*c-1s.5P((11-6*d-11*e)/4,2)}}},h5:L(c){M 1-b.1O.3f.cI(1-c)},2Y:L(c){M 0}}})(64);(L(a){K(!a){7i"81 80 7T";M}K(!a.1O){7i"81.1O 80 7T";M}K(a.1O.ap){M}P b=a.$;a.1O.ap=1k a.4g(a.1O,{N:{5J:"7f"},3M:L(d,c){J.el=$S(d);J.N=a.1U(J.$3q.N,J.N);J.$3q.3M(d,c);J.4z=J.el.1b("55:4z");J.4z=J.4z||a.$1k("3d").19(a.1U(J.el.4h("1Y-X","1Y-Y","1Y-1e","1Y-1d","1l","X","4S"),{2m:"1J"})).cJ(J.el);J.el.1A("55:4z",J.4z).19({1Y:0})},7f:L(){J.1Y="1Y-X";J.4t="R";J.5K=J.el.ao},9h:L(c){J.1Y="1Y-"+(c||"Y");J.4t="Q";J.5K=J.el.cF},1e:L(){J.9h()},Y:L(){J.9h("1e")},1y:L(e,h){J[h||J.N.5J]();P g=J.el.1P(J.1Y).1G(),f=J.4z.1P(J.4t).1G(),c={},i={},d;c[J.1Y]=[g,0],c[J.4t]=[0,J.5K],i[J.1Y]=[g,-J.5K],i[J.4t]=[f,0];2b(e){1f"1I":d=c;1g;1f"9J":d=i;1g;1f"8C":d=(0==f)?c:i;1g}J.$3q.1y(d);M J},7m:L(c){J.el.1E(J.1Y,c[J.1Y]);J.4z.1E(J.4t,c[J.4t]);M J},h3:L(c){M J.1y("1I",c)},h2:L(c){M J.1y("9J",c)},1N:L(d){J[d||J.N.5J]();P c={};c[J.4t]=0,c[J.1Y]=-J.5K;M J.7m(c)},1X:L(d){J[d||J.N.5J]();P c={};c[J.4t]=J.5K,c[J.1Y]=0;M J.7m(c)},8C:L(c){M J.1y("8C",c)}})})(64);(L(b){K(!b){7i"81 80 7T";M}K(b.8a){M}P a=b.$;b.8a=1k b.4g(b.1O,{3M:L(c,d){J.92=c;J.N=b.1U(J.N,d);J.4A=U},1y:L(c){J.$3q.1y([]);J.cZ=c;M J},6g:L(c){1B(P d=0;d<J.92.1v;d++){J.el=a(J.92[d]);J.2P=J.cZ[d];J.$3q.6g(c)}}})})(64);P 4X=(L(g){P i=g.$;g.$7r=L(j){$S(j).1o();M U};P c={3m:"aK.0.25",N:{},88:{1u:50,4N:U,a8:40,3T:25,3s:4M,3F:4M,6d:15,3a:"1e",6K:"X",c0:"9K",5Z:U,9V:13,6c:U,9R:U,x:-1,y:-1,8j:U,9W:U,2c:"2y",86:13,5h:"X",7B:"2g",bT:13,d9:7V,d4:6h,2A:"",1n:13,42:"9q",4Q:"9n",7H:75,76:"h6",5c:13,7v:"ci 1j..",7s:75,9v:-1,9z:-1,3j:"1x",8v:60,3Y:"7Y",89:7V,aX:13,bb:U,3O:"",bN:13,70:U,2K:U,4f:U},aO:$S([/^(1u)(\\s+)?:(\\s+)?(\\d+)$/i,/^(1u-9j)(\\s+)?:(\\s+)?(13|U)$/i,/^(86\\-7J)(\\s+)?:(\\s+)?(\\d+)$/i,/^(3T)(\\s+)?:(\\s+)?(\\d+)$/i,/^(1j\\-Q)(\\s+)?:(\\s+)?(\\d+)(1r)?/i,/^(1j\\-R)(\\s+)?:(\\s+)?(\\d+)(1r)?/i,/^(1j\\-gZ)(\\s+)?:(\\s+)?(\\d+)(1r)?/i,/^(1j\\-1l)(\\s+)?:(\\s+)?(1e|Y|X|1d|9s|5q|#([a-7F-7u\\-:\\.]+))$/i,/^(1j\\-cv)(\\s+)?:(\\s+)?(1e|Y|X|1d|59)$/i,/^(1j\\-1a\\-7U)(\\s+)?:(\\s+)?(9K|c2|U)$/i,/^(cV\\-5J)(\\s+)?:(\\s+)?(13|U)$/i,/^(aW\\-4E\\-1x)(\\s+)?:(\\s+)?(13|U)$/i,/^(gY\\-1X\\-1j)(\\s+)?:(\\s+)?(13|U)$/i,/^(gP\\-1l)(\\s+)?:(\\s+)?(13|U)$/i,/^(x)(\\s+)?:(\\s+)?([\\d.]+)(1r)?/i,/^(y)(\\s+)?:(\\s+)?([\\d.]+)(1r)?/i,/^(1x\\-7W\\-65)(\\s+)?:(\\s+)?(13|U)$/i,/^(1x\\-7W\\-gK)(\\s+)?:(\\s+)?(13|U)$/i,/^(9d\\-4E)(\\s+)?:(\\s+)?(2y|1x|1Q)$/i,/^(1x\\-7W\\-9d)(\\s+)?:(\\s+)?(13|U)$/i,/^(86)(\\s+)?:(\\s+)?(13|U)$/i,/^(1X\\-2g)(\\s+)?:(\\s+)?(13|U|X|1d)$/i,/^(2g\\-gL)(\\s+)?:(\\s+)?(2g|#([a-7F-7u\\-:\\.]+))$/i,/^(1j\\-5r)(\\s+)?:(\\s+)?(13|U)$/i,/^(1j\\-5r\\-1I\\-7J)(\\s+)?:(\\s+)?(\\d+)$/i,/^(1j\\-5r\\-9J\\-7J)(\\s+)?:(\\s+)?(\\d+)$/i,/^(2A)(\\s+)?:(\\s+)?([a-7F-7u\\-:\\.]+)$/i,/^(1n)(\\s+)?:(\\s+)?(13|U)/i,/^(1n\\-gQ)(\\s+)?:(\\s+)?([^;]*)$/i,/^(1n\\-1u)(\\s+)?:(\\s+)?(\\d+)$/i,/^(1n\\-1l)(\\s+)?:(\\s+)?(9n|az|at|bl|br|bc)/i,/^(1X\\-5S)(\\s+)?:(\\s+)?(13|U)$/i,/^(5S\\-gW)(\\s+)?:(\\s+)?([^;]*)$/i,/^(5S\\-1u)(\\s+)?:(\\s+)?(\\d+)$/i,/^(5S\\-1l\\-x)(\\s+)?:(\\s+)?(\\d+)(1r)?/i,/^(5S\\-1l\\-y)(\\s+)?:(\\s+)?(\\d+)(1r)?/i,/^(1K\\-bv)(\\s+)?:(\\s+)?(1x|1Q)$/i,/^(3y\\-bv)(\\s+)?:(\\s+)?(1x|1Q)$/i,/^(3y\\-1Q\\-gX)(\\s+)?:(\\s+)?(\\d+)$/i,/^(3y\\-7U)(\\s+)?:(\\s+)?(7Y|5r|87|U)$/i,/^(3y\\-7U\\-7J)(\\s+)?:(\\s+)?(\\d+)$/i,/^(3y\\-7x)(\\s+)?:(\\s+)?([a-7F-7u\\-:\\.]+)$/i,/^(49\\-1j\\-1a)(\\s+)?:(\\s+)?(13|U)$/i,/^(cy\\-3y\\-gV)(\\s+)?:(\\s+)?(13|U)$/i,/^(cy\\-3y\\-9I)(\\s+)?:(\\s+)?(13|U)$/i,/^(cK\\-5j)(\\s+)?:(\\s+)?(13|U)$/i,/^(1e\\-1x)(\\s+)?:(\\s+)?(13|U)$/i,/^(cC\\-1j)(\\s+)?:(\\s+)?(13|U)$/i]),3Q:$S([]),cp:L(l){P k=/(1x|1Q)/i;1B(P j=0;j<c.3Q.1v;j++){K(c.3Q[j].3n&&!c.3Q[j].6U){c.3Q[j].5Y()}17{K(k.2e(c.3Q[j].N.2c)&&c.3Q[j].5N){c.3Q[j].5N=l}}}},1o:L(j){P e=$S([]);K(j){K((j=$S(j))&&j.1j){e.47(j)}17{M U}}17{e=$S(g.$A(g.24.2k("A")).2E(L(k){M((" "+k.2N+" ").3g(/\\ch\\s/)&&k.1j)}))}e.2L(L(k){k.1j&&k.1j.1o()},J)},1y:L(e){K(0==1Z.1v){c.6P();M 13}e=$S(e);K(!e||!(" "+e.2N+" ").3g(/\\s(61|4X)\\s/)){M U}K(!e.1j){P j=12;3x(j=e.2I){K(j.3V=="82"){1g}e.3B(j)}3x(j=e.gU){K(j.3V=="82"){1g}e.3B(j)}K(!e.2I||e.2I.3V!="82"){7i"gS hf 9q"}c.3Q.47(1k c.1j(e,(1Z.1v>1)?1Z[1]:1C))}17{e.1j.1y()}},2W:L(l,e,k,j){K((l=$S(l))&&l.1j){l.1j.2W(e,k,j);M 13}M U},6P:L(){g.$A(1a.1c.6o("A")).2L(L(e){K(e.2N.3b("61"," ")){K(c.1o(e)){c.1y.2t(22,e)}17{c.1y(e)}}},J)},1X:L(e){K((e=$S(e))&&e.1j){M e.1j.65()}M U},hi:L(e){K((e=$S(e))&&e.1j){M{x:e.1j.N.x,y:e.1j.N.y}}},bX:L(k){P j,e;j="";1B(e=0;e<k.1v;e++){j+=7E.d6(14^k.d1(e))}M j}};c.6W=L(){J.3M.4B(J,1Z)};c.6W.2J={3M:L(e){J.cb=12;J.5v=12;J.9F=J.bF.2u(J);J.7G=12;J.Q=0;J.R=0;J.2l={Y:0,1e:0,X:0,1d:0};J.2n={Y:0,1e:0,X:0,1d:0};J.1L=U;J.5D=12;K("74"==g.3k(e)){J.5D=g.$1k("5e").19({1l:"1R",X:"-aF",Q:"bA",R:"bA",2m:"1J"}).1S(g.24);J.W=g.$1k("2V").1S(J.5D);J.7K();J.W.1W=e}17{J.W=$S(e);J.7K();J.W.1W=e.1W}},4i:L(){K(J.5D){K(J.W.2x==J.5D){J.W.4w().19({1l:"6y",X:"1w"})}J.5D.5s();J.5D=12}},bF:L(j){K(j){$S(j).1o()}K(J.cb){J.4i();J.cb.1T(J,U)}J.6a()},7K:L(e){J.5v=12;K(e==13||!(J.W.1W&&(J.W.6r||J.W.6j=="6r"))){J.5v=L(j){K(j){$S(j).1o()}K(J.1L){M}J.1L=13;J.6N();K(J.cb){J.4i();J.cb.1T()}}.2u(J);J.W.1t("2y",J.5v);$S(["7Q","7P"]).2L(L(j){J.W.1t(j,J.9F)},J)}17{J.1L=13}},2W:L(j,k){J.6a();P e=g.$1k("a",{26:j});K(13!==k&&J.W.1W.3b(e.26)&&0!==J.W.Q){J.1L=13}17{J.7K(13);J.W.1W=j}e=12},6N:L(){J.Q=J.W.Q;J.R=J.W.R;K(J.Q==0&&J.R==0&&g.V.3w){J.Q=J.W.7O;J.R=J.W.cg}$S(["8q","8m","8t","8u"]).2L(L(j){J.2n[j.2U()]=J.W.6T("2n"+j).1G();J.2l[j.2U()]=J.W.6T("2l"+j+"bJ").1G()},J);K(g.V.5z||(g.V.2p&&!g.V.3S)){J.Q-=J.2n.Y+J.2n.1e;J.R-=J.2n.X+J.2n.1d}},9U:L(){P e=12;e=J.W.4q();M{X:e.X+J.2l.X,1d:e.1d-J.2l.1d,Y:e.Y+J.2l.Y,1e:e.1e-J.2l.1e}},hz:L(){K(J.7G){J.7G.1W=J.W.1W;J.W=12;J.W=J.7G}},2y:L(e){K(J.1L){K(!J.Q){(L(){J.6N();J.4i();e.1T()}).1p(J).2t(1)}17{J.4i();e.1T()}}17{J.cb=e}},6a:L(){K(J.5v){J.W.2D("2y",J.5v)}$S(["7Q","7P"]).2L(L(e){J.W.2D(e,J.9F)},J);J.5v=12;J.cb=12;J.Q=12;J.1L=U;J.hu=U}};c.1j=L(){J.a3.4B(J,1Z)};c.1j.2J={a3:L(k,j){P e={};J.4u=-1;J.3n=U;J.8d=0;J.8e=0;J.6U=U;J.4l=12;J.9B=$S(1a).1b("bq:7S")||$S(1a).1b("bq:7S",g.$1k("5e").19({1l:"1R",X:-7l,Q:10,R:10,2m:"1J"}).1S(g.24));J.N=g.3z(c.88);K(k){J.c=$S(k)}J.5a=("5e"==J.c.3V.2U());e=g.1U(e,J.4U());e=g.1U(e,J.4U(J.c.3A));K(j){e=g.1U(e,J.4U(j))}K(e.5Z&&1C===e.6c){e.6c=13}g.1U(J.N,e);J.N.2A+="";K("2y"==J.N.2c&&g.2C(J.N.9i)&&"13"==J.N.9i.5u()){J.N.2c="1x"}K(g.2C(J.N.9E)&&J.N.9E!=J.N.3j){J.N.3j=J.N.9E}K(g.V.2z){J.N.3j="1x";J.N.2c=("1Q"==J.N.2c)?"1x":J.N.2c;J.N.9W=U;K(1a.3W.R<=hx){J.N.3a="5q"}}K(J.N.4f){J.3n=U;J.N.8j=13;J.N.1n=U}K(k){J.8k=12;J.6H=J.9S.2u(J);J.9G=J.6u.2u(J);J.a6=J.1X.1p(J,U);J.bP=J.6x.1p(J);J.4r=J.6S.2u(J);K(g.V.2z){K(!J.N.4f){J.c.1t("6C",J.6H);J.c.1t("4K",J.9G)}17{J.c.19({"-3w-hy-hv":"2Y","-3w-6F-hD":"2Y","-3w-hC-hB-8J":"bO"});J.c.1t("1x",L(l){l.9C()})}}17{K(!J.5a){J.c.1t("1x",L(m){P l=m.54();K(3==l){M 13}$S(m).1o();K(!g.V.2p){J.aL()}M U})}J.c.1t("9S",J.6H);J.c.1t("6u",J.9G);K("1Q"==J.N.2c){J.c.1t("1Q",J.6H)}}J.c.aV="4E";J.c.1z.hA="2Y";J.c.1t("hk",g.$7r);K(!J.5a){J.c.19({1l:"4P",1V:"7C-28",hj:"2Y",8l:"0",3R:"ht"});K(g.V.cU||g.V.5z){J.c.19({1V:"28"})}K(J.c.1P("aD")=="59"){J.c.19({1Y:"1w 1w"})}}J.c.1j=J}17{J.N.2c="2y"}K(!J.N.2K){J.c.1t("8I",g.$7r)}K("2y"==J.N.2c){J.6J()}17{K(""!=J.c.1H){J.9y(13)}}},6J:L(){P l,o,n,m,j;K(!J.18){J.18=1k c.6W(J.c.2I);J.1q=1k c.6W(J.c.26)}17{J.1q.2W(J.c.26)}K(!J.1i){J.1i={W:$S(1c.3J("3d"))[(J.5a)?"4c":"2j"]("hg").19({2m:"1J",2q:J.N.3a=="5q"?22:hh,X:"-6X",1l:"1R",Q:J.N.3s+"1r",R:J.N.3F+"1r"}),1j:J,4j:"1M",8b:0,7L:0};K(!(g.V.hm&&g.V.7I<9)){2b(J.N.c0){1f"9K":J.1i.W.2j("hp");1g;1f"c2":J.1i.W.2j("hn");1g;2h:1g}}J.1i.1N=L(){K(J.W.1z.X!="-6X"&&J.1j.1m&&!J.1j.1m.4Y){J.4j=J.W.1z.X;J.W.1z.X="-6X"}K(J.W.2x===g.24){J.W.1S(J.1j.9B)}};J.1i.d5=J.1i.1N.1p(J.1i);K(g.V.3r){l=$S(1c.3J("ab"));l.1W="98:\'\'";l.19({Y:"1M",X:"1M",1l:"1R","z-23":-1}).ho=0;J.1i.9r=J.1i.W.2a(l)}J.1i.4Z=$S(1c.3J("3d")).2j("h0").19({1l:"4P",2q:10,Y:"1M",X:"1M",2n:"gI"}).1N();o=g.$1k("3d",{},{2m:"1J"});o.2a(J.1q.W);J.1q.W.19({2n:"1M",1Y:"1M",2l:"1M",Q:"1w",R:"1w"});K(J.N.5h=="1d"){J.1i.W.2a(o);J.1i.W.2a(J.1i.4Z)}17{J.1i.W.2a(J.1i.4Z);J.1i.W.2a(o)}K(J.N.3a=="9s"&&$S(J.c.1H+"-9I")){$S(J.c.1H+"-9I").2a(J.1i.W)}17{K(J.N.3a.3b("#")){P q=J.N.3a.2o(/^#/,"");K($S(q)){$S(q).2a(J.1i.W)}}17{K(J.N.3a=="5q"){J.c.2a(J.1i.W)}17{J.1i.W.1S(J.9B)}}}K("1C"!==3P(j)){J.1i.g=$S(1c.3J("5e")).19({8J:j[1],df:j[2]+"1r",d0:j[3],d3:"dl",1l:"1R","z-23":10+(""+(J.1q.W.1P("z-23")||0)).1G(),Q:j[5],aD:j[4],Y:"1M"}).6A(c.bX(j[0])).1S(J.1i.W,((1s.7D(1s.7z()*dg)+1)%2)?"X":"1d")}}K(J.N.5h!="U"&&J.N.5h!=U){P k=J.1i.4Z;k.1N();3x(n=k.2I){k.3B(n)}K(J.N.7B=="2g"&&""!=J.c.2g){k.2a(1c.5m(J.c.2g));k.1X()}17{K(J.N.7B.3b("#")){P q=J.N.7B.2o(/^#/,"");K($S(q)){k.6A($S(q).7y);k.1X()}}}}17{J.1i.4Z.1N()}J.c.au=J.c.2g;J.c.2g="";J.18.2y(J.bW.1p(J))},bW:L(e){K(!e&&e!==1C){M}K(!J.N.4N){J.18.W.2v(1)}K(!J.5a){J.c.19({Q:J.18.Q+"1r"})}K(J.N.5c){J.6V=6f(J.bP,7V)}K(J.N.2A!=""&&$S(J.N.2A)){J.aT()}K(J.c.1H!=""){J.9y()}J.1q.2y(J.9t.1p(J))},9t:L(k){P j,e;K(!k&&k!==1C){5d(J.6V);K(J.N.5c&&J.2r){J.2r.1N()}M}K(!J.18||!J.1q){M}e=J.18.W.4q();K(e.1d==e.X){J.9t.1p(J).2t(7Z);M}K(J.18.Q==0&&g.V.2p){J.18.6N();J.1q.6N();!J.5a&&J.c.19({Q:J.18.Q+"1r"})}j=J.1i.4Z.21();K(J.N.bN||J.N.70){K((J.1q.Q<J.N.3s)||J.N.70){J.N.3s=J.1q.Q;J.1i.W.19({Q:J.N.3s});j=J.1i.4Z.21()}K((J.1q.R<J.N.3F)||J.N.70){J.N.3F=J.1q.R+j.R}}2b(J.N.3a){1f"9s":1g;1f"1e":J.1i.W.1z.Y=e.1e+J.N.6d+"1r";1g;1f"Y":J.1i.W.1z.Y=e.Y-J.N.6d-J.N.3s+"1r";1g;1f"X":J.1i.4j=e.X-(J.N.6d+J.N.3F)+"1r";1g;1f"1d":J.1i.4j=e.1d+J.N.6d+"1r";1g;1f"5q":J.1i.W.19({Y:"1M",R:J.18.R+"1r",Q:J.18.Q+"1r"});J.N.3s=J.18.Q;J.N.3F=J.18.R;J.1i.4j="1M";j=J.1i.4Z.21();1g}K(J.N.5h=="1d"){J.1q.W.2x.1z.R=(J.N.3F-j.R)+"1r"}J.1i.W.19({R:J.N.3F+"1r",Q:J.N.3s+"1r"}).2v(1);K(g.V.3r&&J.1i.9r){J.1i.9r.19({Q:J.N.3s+"1r",R:J.N.3F+"1r"})}K(J.N.3a=="1e"||J.N.3a=="Y"){K(J.N.6K=="59"){J.1i.4j=(e.1d-(e.1d-e.X)/2-J.N.3F/2)+"1r"}17{K(J.N.6K=="1d"){J.1i.4j=(e.1d-J.N.3F)+"1r"}17{J.1i.4j=e.X+"1r"}}}17{K(J.N.3a=="X"||J.N.3a=="1d"){K(J.N.6K=="59"){J.1i.W.1z.Y=(e.1e-(e.1e-e.Y)/2-J.N.3s/2)+"1r"}17{K(J.N.6K=="1e"){J.1i.W.1z.Y=(e.1e-J.N.3s)+"1r"}17{J.1i.W.1z.Y=e.Y+"1r"}}}}J.1i.8b=3o(J.1i.4j,10);J.1i.7L=3o(J.1i.W.1z.Y,10);J.84=J.N.3F-j.R;K(J.1i.g){J.1i.g.19({X:J.N.5h=="1d"?0:"1w",1d:J.N.5h=="1d"?"1w":0})}J.1q.W.19({1l:"4P",6b:"1M",2n:"1M",Y:"1M",X:"1M"});J.aJ();K(J.N.6c){K(J.N.x==-1){J.N.x=J.18.Q/2}K(J.N.y==-1){J.N.y=J.18.R/2}J.1X()}17{K(J.N.bT){J.3t=1k g.1O(J.1i.W,{72:"c7"===g.V.7w})}J.1i.W.19({X:"-6X"})}K(J.N.5c&&J.2r){J.2r.1N()}K(g.V.2z){J.c.1t("be",J.4r);J.c.1t("4K",J.4r)}17{J.c.1t("96",J.4r);J.c.1t("2B",J.4r)}J.6z();K(!J.N.4f&&(!J.N.8j||"1x"==J.N.2c)){J.3n=13}K("1x"==J.N.2c&&J.5N){J.6S(J.5N)}K(J.6U){J.65()}J.4u=g.3K()},6z:L(){P m=/az|br/i,e=/bl|br|bc/i,j=/bc|at/i,l=12;J.5Q=1C;K(!J.N.1n){K(J.1n){J.1n.5s();J.1n=1C}M}K(!J.1n){J.1n=$S(1c.3J("3d")).2j(J.N.76).19({1V:"28",2m:"1J",1l:"1R",2w:"1J","z-23":1});K(J.N.42!=""){J.1n.2a(1c.5m(J.N.42))}J.c.2a(J.1n)}17{K(J.N.42!=""){l=J.1n[(J.1n.2I)?"7q":"2a"](1c.5m(J.N.42),J.1n.2I);l=12}}J.1n.19({Y:"1w",1e:"1w",X:"1w",1d:"1w",1V:"28",1u:(J.N.7H/22),"3I-Q":(J.18.Q-4)});P k=J.1n.21();J.1n.1E((m.2e(J.N.4Q)?"1e":"Y"),(j.2e(J.N.4Q)?(J.18.Q-k.Q)/2:2)).1E((e.2e(J.N.4Q)?"1d":"X"),2);J.5Q=13;J.1n.1X()},6x:L(){K(J.1q.1L){M}J.2r=$S(1c.3J("3d")).2j("g1").2v(J.N.7s/22).19({1V:"28",2m:"1J",1l:"1R",2w:"1J","z-23":20,"3I-Q":(J.18.Q-4)});J.2r.2a(1c.5m(J.N.7v));J.c.2a(J.2r);P e=J.2r.21();J.2r.19({Y:(J.N.9v==-1?((J.18.Q-e.Q)/2):(J.N.9v))+"1r",X:(J.N.9z==-1?((J.18.R-e.R)/2):(J.N.9z))+"1r"});J.2r.1X()},aT:L(){$S(J.N.2A).b2=$S(J.N.2A).2x;$S(J.N.2A).b7=$S(J.N.2A).g2;J.c.2a($S(J.N.2A));$S(J.N.2A).19({1l:"1R",Y:"1M",X:"1M",Q:J.18.Q+"1r",R:J.18.R+"1r",2q:15}).1X();K(g.V.2p){J.c.7t=J.c.2a($S(1c.3J("3d")).19({1l:"1R",Y:"1M",X:"1M",Q:J.18.Q+"1r",R:J.18.R+"1r",2q:14,4d:"#g0"}).2v(0.fZ))}g.$A($S(J.N.2A).6o("A")).2L(L(j){P k=j.fX.43(","),e=12;$S(j).19({1l:"1R",Y:k[0]+"1r",X:k[1]+"1r",Q:(k[2]-k[0])+"1r",R:(k[3]-k[1])+"1r",2q:15}).1X();K(j.51("2O")){K(e=j.1b("1K")){e.2s=J.N.2A}17{j.3A+=";2s: "+J.N.2A+";"}}},J)},9y:L(k){P e,l,j=1k 4x("1j\\\\-1H(\\\\s+)?:(\\\\s+)?"+J.c.1H+"($|;)");J.3y=$S([]);g.$A(1c.6o("A")).2L(L(n){K(j.2e(n.3A)){K(!$S(n).71){n.71=L(o){K(!g.V.2p){J.aL()}$S(o).1o();M U};n.1t("1x",n.71)}K(k){M}P m=g.$1k("a",{26:n.6B});(J.N.3O!="")&&$S(n)[J.1q.W.1W.3b(n.26)&&J.18.W.1W.3b(m.26)?"2j":"4c"](J.N.3O);K(J.1q.W.1W.3b(n.26)&&J.18.W.1W.3b(m.26)){J.8k=n}m=12;K(!n.5o){n.5o=L(q,p){p=q.fY||q.4C();2Q{3x("a"!=p.3V.2U()){p=p.2x}}3e(o){M}K(p.5t(q.4L())){M}K(q.2M=="2B"){K(J.6Y){5d(J.6Y)}J.6Y=U;M}K(p.2g!=""){J.c.2g=p.2g}K(q.2M=="1Q"){J.6Y=6f(J.2W.1p(J,p.26,p.6B,p.3A,p),J.N.8v)}17{J.2W(p.26,p.6B,p.3A,p)}}.2u(J);n.1t(J.N.3j,n.5o);K(J.N.3j=="1Q"){n.1t("2B",n.5o)}}n.19({8l:"0",1V:"7C-28"});K(J.N.aX){l=1k ba();l.1W=n.6B}K(J.N.bb){e=1k ba();e.1W=n.26}J.3y.47(n)}},J)},1o:L(j){2Q{J.5Y();K(g.V.2z){J.c.2D("be",J.4r);J.c.2D("4K",J.4r)}17{J.c.2D("96",J.4r);J.c.2D("2B",J.4r)}K(1C===j&&J.1m){J.1m.W.1N()}K(J.3t){J.3t.1o()}J.2f=12;J.3n=U;K(J.3y!==1C){J.3y.2L(L(e){K(J.N.3O!=""){e.4c(J.N.3O)}K(1C===j){e.2D(J.N.3j,e.5o);K(J.N.3j=="1Q"){e.2D("2B",e.5o)}e.5o=12;e.2D("1x",e.71);e.71=12}},J)}K(J.N.2A!=""&&$S(J.N.2A)){$S(J.N.2A).1N();$S(J.N.2A).b2.b1($S(J.N.2A),$S(J.N.2A).b7);K(J.c.7t){J.c.3B(J.c.7t)}}J.1q.6a();K(J.N.4N){J.c.4c("8c");J.18.W.2v(1)}J.3t=12;K(J.2r){J.c.3B(J.2r)}K(J.1n){J.1n.1N()}K(1C===j){K(J.1n){J.c.3B(J.1n)}J.1n=12;J.18.6a();(J.1m&&J.1m.W)&&J.c.3B(J.1m.W);(J.1i&&J.1i.W)&&J.1i.W.2x.3B(J.1i.W);J.1m=12;J.1i=12;J.1q=12;J.18=12;K(!J.N.2K){J.c.2D("8I",g.$7r)}}K(J.6V){5d(J.6V);J.6V=12}J.4l=12;J.c.7t=12;J.2r=12;K(J.c.2g==""){J.c.2g=J.c.au}J.4u=-1}3e(k){}},1y:L(e){K(J.4u!=-1){M}J.a3(U,e)},2W:L(y,o,j,x){P k,B,e,m,u,l,D=12,w=12;P n,p,A,v,r,s,E,C,q;x=x||12;K(g.3K()-J.4u<4M||J.4u==-1||J.a0){k=4M-g.3K()+J.4u;K(J.4u==-1){k=4M}J.6Y=6f(J.2W.1p(J,y,o,j,x),k);M}K(x&&J.8k==x){M}17{J.8k=x}B=L(F){K(1C!=y){J.c.26=y}K(1C===j){j=""}K(J.N.9R){j="x: "+J.N.x+"; y: "+J.N.y+"; "+j}K(1C!=o){J.18.2W(o);K(F!==1C){J.18.2y(F)}}};w=J.c.1b("1K");K(w&&w.1L){w.2H(12,13);w.1D="77";D=L(){w.1D="3N";w.2W(J.c.26,12,j)}.1p(J)}m=J.18.Q;u=J.18.R;J.1o(13);K(J.N.3Y!="U"){J.a0=13;P z=$S(J.c.6v(13)).19({1l:"1R",X:"-6X"});J.c.2x.2a(z);l=1k c.6W(z.2I);l.2W(o);K("87"==J.N.3Y){q=J.c.26;n=J.3y.2E(L(F){M F.26.3b(q)});n=(n[0])?$S(n[0].2k("2V")[0]||n[0]):J.18.W;p=J.3y.2E(L(F){M F.26.3b(y)});p=(p[0])?$S(p[0].2k("2V")[0]||p[0]):12;K(12==p){p=J.18.W;n=J.18.W}v=J.18.W.3l(),r=n.3l(),s=p.3l(),C=n.21(),E=p.21()}e=L(){P F={},H={},G={},I=12;K("87"==J.N.3Y){F.Q=[m,C.Q];F.R=[u,C.R];F.X=[v.X,r.X];F.Y=[v.Y,r.Y];H.Q=[E.Q,l.Q];H.R=[E.R,l.R];H.X=[s.X,v.X];z.2v(0).19({R:0,Q:l.Q,1l:"4P"});H.Y=[s.Y,z.3l().Y];G.Q=[m,l.Q];G.R=[u,l.R];l.W.1S(g.24).19({1l:"1R","z-23":ae,Y:H.Y[0],X:H.X[0],Q:H.Q[0],R:H.R[0]});I=$S(J.c.2I.6v(U)).1S(g.24).19({1l:"1R","z-23":aB,Y:F.Y[0],X:F.X[0],2w:"4a"});$S(J.c.2I).19({2w:"1J"});J.c.2x.3B(z)}17{l.W.1S(J.c).19({1l:"1R","z-23":ae,1u:0,Y:"1M",X:"1M"});I=$S(J.c.2I.6v(U)).1S(J.c).19({1l:"1R","z-23":aB,Y:"1M",X:"1M",2w:"4a"});$S(J.c.2I).19({2w:"1J"});J.c.2x.3B(z);H={1u:[0,1]};K(m!=l.Q||u!=l.R){G.Q=H.Q=F.Q=[m,l.Q];G.R=H.R=F.R=[u,l.R]}K(J.N.3Y=="5r"){F.1u=[1,0]}}1k g.8a([J.c,l.W,(I||J.c.2I)],{2Z:J.N.89,3X:L(){K(I){I.4w();I=12}B.1T(J,L(){l.6a();$S(J.c.2I).19({2w:"4a"});$S(l.W).4w();l=12;K(F.1u){$S(J.c.2I).19({1u:1})}J.a0=U;J.1y(j);K(D){D.2t(10)}}.1p(J))}.1p(J)}).1y([G,H,F])};l.2y(e.1p(J))}17{B.1T(J,L(){J.c.19({Q:J.18.Q+"1r",R:J.18.R+"1r"});J.1y(j);K(D){D.2t(10)}}.1p(J))}},4U:L(j){P e,n,l,k;e=12;n=[];j=j||"";K(""==j){1B(k 1I c.N){e=c.N[k];2b(g.3k(c.88[k.3v()])){1f"7b":e=e.5u().6l();1g;1f"5w":e=3H(e);1g;2h:1g}n[k.3v()]=e}}17{l=$S(j.43(";"));l.2L(L(m){c.aO.2L(L(o){e=o.6p(m.41());K(e){2b(g.3k(c.88[e[1].3v()])){1f"7b":n[e[1].3v()]=e[4]==="13";1g;1f"5w":n[e[1].3v()]=3H(e[4]);1g;2h:n[e[1].3v()]=e[4]}}},J)},J)}K(U===n.3Y){n.3Y="U"}M n},aJ:L(){P j,e;K(!J.1m){J.1m={W:$S(1c.3J("3d")).2j("8c").19({2q:10,1l:"1R",2m:"1J"}).1N(),Q:20,R:20};J.c.2a(J.1m.W)}K(e=J.c.1b("1K")){J.1m.W.19({3R:(e.T.4W)?"aW":""})}K(J.N.70){J.1m.W.19({"2l-Q":"1M",3R:"2h"})}J.1m.4Y=U;J.1m.R=J.84/(J.1q.R/J.18.R);J.1m.Q=J.N.3s/(J.1q.Q/J.18.Q);K(J.1m.Q>J.18.Q){J.1m.Q=J.18.Q}K(J.1m.R>J.18.R){J.1m.R=J.18.R}J.1m.Q=1s.5H(J.1m.Q);J.1m.R=1s.5H(J.1m.R);J.1m.6b=J.1m.W.6T("ah").1G();J.1m.W.19({Q:(J.1m.Q-2*(g.V.3S?0:J.1m.6b))+"1r",R:(J.1m.R-2*(g.V.3S?0:J.1m.6b))+"1r"});K(!J.N.4N&&!J.N.2K){J.1m.W.2v(3H(J.N.1u/22));K(J.1m.4p){J.1m.W.3B(J.1m.4p);J.1m.4p=12}}17{K(J.1m.4p){J.1m.4p.1W=J.18.W.1W}17{j=J.18.W.6v(U);j.aV="4E";J.1m.4p=$S(J.1m.W.2a(j)).19({1l:"1R",2q:5})}K(J.N.4N){J.1m.W.2v(1)}17{K(J.N.2K){J.1m.4p.2v(0.g3)}J.1m.W.2v(3H(J.N.1u/22))}}},6S:L(k,j){K(!J.3n||k===1C){M U}P l=(/6F/i).2e(k.2M)&&k.aI.1v>1;K((!J.5a||k.2M!="2B")&&!l){$S(k).1o()}K(j===1C){j=$S(k).aa()}K(J.2f===12||J.2f===1C){J.2f=J.18.9U()}K("4K"==k.2M||("2B"==k.2M&&!J.c.5t(k.4L()))||l||j.x>J.2f.1e||j.x<J.2f.Y||j.y>J.2f.1d||j.y<J.2f.X){J.5Y();M U}J.6U=U;K(k.2M=="2B"||k.2M=="4K"){M U}K(J.N.5Z&&!J.6Q){M U}K(!J.N.9V){j.x-=J.8d;j.y-=J.8e}K((j.x+J.1m.Q/2)>=J.2f.1e){j.x=J.2f.1e-J.1m.Q/2}K((j.x-J.1m.Q/2)<=J.2f.Y){j.x=J.2f.Y+J.1m.Q/2}K((j.y+J.1m.R/2)>=J.2f.1d){j.y=J.2f.1d-J.1m.R/2}K((j.y-J.1m.R/2)<=J.2f.X){j.y=J.2f.X+J.1m.R/2}J.N.x=j.x-J.2f.Y;J.N.y=j.y-J.2f.X;K(J.4l===12){J.4l=6f(J.a6,10)}K(g.2C(J.5Q)&&J.5Q){J.5Q=U;J.1n.1N()}M 13},1X:L(){P r,n,k,j,p,o,m,l,e=J.N,s=J.1m;r=s.Q/2;n=s.R/2;s.W.1z.Y=e.x-r+J.18.2l.Y+"1r";s.W.1z.X=e.y-n+J.18.2l.X+"1r";K(J.N.4N){s.4p.1z.Y="-"+(3H(s.W.1z.Y)+s.6b)+"1r";s.4p.1z.X="-"+(3H(s.W.1z.X)+s.6b)+"1r"}k=(J.N.x-r)*(J.1q.Q/J.18.Q);j=(J.N.y-n)*(J.1q.R/J.18.R);K(J.1q.Q-k<e.3s){k=J.1q.Q-e.3s;K(k<0){k=0}}K(J.1q.R-j<J.84){j=J.1q.R-J.84;K(j<0){j=0}}K(1c.85.g4=="g9"){k=(e.x+s.Q/2-J.18.Q)*(J.1q.Q/J.18.Q)}k=1s.5H(k);j=1s.5H(j);K(e.86===U||(!s.4Y)){J.1q.W.1z.Y=(-k)+"1r";J.1q.W.1z.X=(-j)+"1r"}17{p=3o(J.1q.W.1z.Y);o=3o(J.1q.W.1z.X);m=(-k-p);l=(-j-o);K(!m&&!l){J.4l=12;M}m*=e.a8/22;K(m<1&&m>0){m=1}17{K(m>-1&&m<0){m=-1}}p+=m;l*=e.a8/22;K(l<1&&l>0){l=1}17{K(l>-1&&l<0){l=-1}}o+=l;J.1q.W.1z.Y=p+"1r";J.1q.W.1z.X=o+"1r"}K(!s.4Y){K(J.3t){J.3t.1o();J.3t.N.3X=g.$F;J.3t.N.2Z=e.d9;J.1i.W.2v(0);J.3t.1y({1u:[0,1]})}K(/^(Y|1e|X|1d)$/i.2e(e.3a)){J.1i.W.1S(g.24)}K(e.3a!="5q"){s.W.1X()}K(/^(Y|1e|X|1d)$/i.2e(e.3a)&&!J.N.6c){P q=J.63();J.1i.W.1z.X=q.y+"1r";J.1i.W.1z.Y=q.x+"1r"}17{J.1i.W.1z.X=J.1i.4j}K(e.4N){J.c.2j("8c").da({"2l-Q":"1M"});J.18.W.2v(3H((22-e.1u)/22))}s.4Y=13}K(J.4l){J.4l=6f(J.a6,a9/e.3T)}},63:L(){P j=J.6I(5),e=J.18.W.4q(),n=J.N.3a,m=J.1i,k=J.N.6d,q=m.W.21(),p=m.8b,l=m.7L,o={x:m.7L,y:m.8b};K("Y"==n||"1e"==n){o.y=1s.3I(j.X,1s.3u(j.1d,p+q.R)-q.R);K("Y"==n&&j.Y>l){o.x=(e.Y-j.Y>=q.Q)?(e.Y-q.Q-2):(j.1e-e.1e-2>e.Y-j.Y-2)?(e.1e+2):(e.Y-q.Q-2)}17{K("1e"==n&&j.1e<l+q.Q){o.x=(j.1e-e.1e>=q.Q)?(e.1e+2):(e.Y-j.Y-2>j.1e-e.1e-2)?(e.Y-q.Q-2):(e.1e+2)}}}17{K("X"==n||"1d"==n){o.x=1s.3I(j.Y+2,1s.3u(j.1e,l+q.Q)-q.Q);K("X"==n&&j.X>p){o.y=(e.X-j.X>=q.R)?(e.X-q.R-2):(j.1d-e.1d-2>e.X-j.X-2)?(e.1d+2):(e.X-q.R-2)}17{K("1d"==n&&j.1d<p+q.R){o.y=(j.1d-e.1d>=q.R)?(e.1d+2):(e.X-j.X-2>j.1d-e.1d-2)?(e.X-q.R-2):(e.1d+2)}}}}M o},6I:L(k){k=k||0;P j=(g.V.2z)?{Q:1a.8L,R:1a.8V}:$S(1a).21(),e=$S(1a).6G();M{Y:e.x+k,1e:e.x+j.Q-k,X:e.y+k,1d:e.y+j.R-k}},65:L(e){e=(g.2C(e))?e:13;J.6U=13;K(!J.1q){J.6J();M}K(J.N.4f){M}J.3n=13;K(e){K(!J.N.9R){J.N.x=J.18.Q/2;J.N.y=J.18.R/2}J.1X()}},5Y:L(){K(J.4l){5d(J.4l);J.4l=12}K(!J.N.6c&&J.1m&&J.1m.4Y){J.1m.4Y=U;J.1m.W.1N();K(J.3t){J.3t.1o();J.3t.N.3X=J.1i.d5;J.3t.N.2Z=J.N.d4;P e=J.1i.W.6T("1u");J.3t.1y({1u:[e,0]})}17{J.1i.1N()}K(J.N.4N){J.c.4c("8c");J.18.W.2v(1)}}J.2f=12;K(J.N.8j){J.3n=U}K(J.N.5Z){J.6Q=U}K(J.1n){J.5Q=13;J.1n.1X()}},9S:L(l){P j=l.54();K(3==j){M 13}K(!((/6F/i).2e(l.2M)&&l.aI.1v>1)){$S(l).1o()}K("1x"==J.N.2c&&!J.18){J.5N=l;J.6J();M}K("1Q"==J.N.2c&&!J.18&&l.2M=="1Q"){J.5N=l;J.6J();J.c.2D("1Q",J.6H);M}K(J.N.4f){M}K(J.18&&!J.1q.1L){M}K(J.1q&&J.N.9W&&J.3n){J.3n=U;J.5Y();M}K(J.1q&&!J.3n){J.3n=13;J.6S(l);K(J.c.1b("1K")){J.c.1b("1K").83=13}}K(J.3n&&J.N.5Z){J.6Q=13;K(!J.N.9V){K(g.V.2z&&(J.2f===12||J.2f===1C)){J.2f=J.18.9U()}P k=l.aa();J.8d=k.x-J.N.x-J.2f.Y;J.8e=k.y-J.N.y-J.2f.X;K(1s.dn(J.8d)>J.1m.Q/2||1s.dn(J.8e)>J.1m.R/2){J.6Q=U;M}}17{J.6S(l)}}},6u:L(k){P j=k.54();K(3==j){M 13}$S(k).1o();K(J.N.5Z){J.6Q=U}}};K(g.V.2p){2Q{1c.ga("g8",U,13)}3e(f){}}$S(1c).1t("4H",L(){K(!g.V.2z){$S(1c).1t("96",c.cp)}});P d=1k g.4g({W:12,1L:U,N:{Q:-1,R:-1,5g:g.$F,94:g.$F,7N:g.$F},Q:0,R:0,9c:0,cf:0,2l:{Y:0,1e:0,X:0,1d:0},1Y:{Y:0,1e:0,X:0,1d:0},2n:{Y:0,1e:0,X:0,1d:0},7h:12,7M:{5g:L(j){K(j){$S(j).1o()}J.7a();K(J.1L){M}J.1L=13;J.7c();J.4i();J.N.5g.2t(1)},94:L(j){K(j){$S(j).1o()}J.7a();J.1L=U;J.4i();J.N.94.2t(1)},7N:L(j){K(j){$S(j).1o()}J.7a();J.1L=U;J.4i();J.N.7N.2t(1)}},cw:L(){$S(["2y","7Q","7P"]).2L(L(e){J.W.1t(e,J.7M["4E"+e].2u(J).cn(1))},J)},7a:L(){$S(["2y","7Q","7P"]).2L(L(e){J.W.2D(e)},J)},4i:L(){K(J.W.1b("1k")){P e=J.W.2x;J.W.4w().8i("1k").19({1l:"6y",X:"1w"});e.5s()}},3M:L(k,j){J.N=g.1U(J.N,j);P e=J.W=$S(k)||g.$1k("2V",{},{"3I-Q":"2Y","3I-R":"2Y"}).1S(g.$1k("5e").2j("g7-g5-2V").19({1l:"1R",X:-7l,Q:10,R:10,2m:"1J"}).1S(g.24)).1A("1k",13),l=L(){K(J.cl()){J.7M.5g.1T(J)}17{J.7M.7N.1T(J)}l=12}.1p(J);J.cw();K(!k.1W){e.1W=k}17{e.1W=k.1W}K(e&&e.6r){J.7h=l.2t(22)}},an:L(){K(J.7h){2Q{5d(J.7h)}3e(e){}J.7h=12}J.7a();J.4i();J.1L=U;M J},cl:L(){P e=J.W;M(e.7O)?(e.7O>0):(e.6j)?("6r"==e.6j):e.Q>0},7c:L(){J.9c=J.W.7O||J.W.Q;J.cf=J.W.cg||J.W.R;K(J.N.Q>0){J.W.1E("Q",J.N.Q)}17{K(J.N.R>0){J.W.1E("R",J.N.R)}}J.Q=J.W.Q;J.R=J.W.R;$S(["Y","1e","X","1d"]).2L(L(e){J.1Y[e]=J.W.1P("1Y-"+e).1G();J.2n[e]=J.W.1P("2n-"+e).1G();J.2l[e]=J.W.1P("2l-"+e+"-Q").1G()},J)}});P b={3m:"ck.1.0.g6-4-fW",N:{},6L:{},1y:L(m){J.3i=$S(1a).1b("5W:53",$S([]));P l=12,j=12,k=$S([]),e=(1Z.1v>1)?g.1U(g.3z(b.N),1Z[1]):b.N;K(m){j=$S(m);K(j&&(" "+j.2N+" ").3g(/\\s(2O|4X)\\s/)){k.47(j)}17{M U}}17{k=$S(g.$A(g.24.2k("A")).2E(L(n){M n.2N.3b("2O"," ")}))}k.3C(L(n){K(l=$S(n).1b("1K")){l.1y()}17{1k a(n,e)}});M 13},1o:L(j){P e=12;K(j){K($S(j)&&(e=$S(j).1b("1K"))){e=e.2S(e.2i||e.1H).1o();3p e;M 13}M U}3x(J.3i.1v){e=J.3i[J.3i.1v-1].1o();3p e}M 13},6P:L(j){P e=12;K(j){K($S(j)){K(e=$S(j).1b("1K")){e=J.1o(j);3p e}J.1y.2t(8S,j);M 13}M U}J.1o();J.1y.2t(8S);M 13},2W:L(n,e,k,l){P m=$S(n),j=12;K(m&&(j=m.1b("1K"))){j.2S(j.2i||j.1H).2W(e,k,l)}},3c:L(j){P e=12;K($S(j)&&(e=$S(j).1b("1K"))){e.3c();M 13}M U},2H:L(j){P e=12;K($S(j)&&(e=$S(j).1b("1K"))){e.2H();M 13}M U}};P a=1k g.4g({T:{2q:fV,8E:7Z,66:-1,3U:"49-3W",9a:"3W",8G:"59",2c:"2y",bj:13,b3:U,6n:U,8n:10,6E:"1x",cP:6h,4D:"cH",7e:"1w",am:"1w",97:30,6R:"#fL",99:6h,c4:79,aA:"6M",68:"1d",bf:4M,aY:4M,6w:"1X",al:"1w",bt:"8y, 8z, 7o",5c:13,7v:"ci...",7s:75,5O:"7Y",9l:7Z,69:13,3j:"1x",8v:60,3Y:"7Y",89:7V,3O:"",2s:12,5p:"",aG:"fM",dx:"",1n:13,42:"fK",4Q:"9n",7H:75,76:"fJ",2K:"U",4W:U,8Z:13},8D:{9i:L(e){e=(""+e).6l();K(e&&"2y"==J.T.2c){J.T.2c="1x"}},fG:L(e){K("49-3W"==J.T.3U&&"5k"==e){J.T.3U="5k"}},fH:L(e){K("1x"==J.T.3j&&"1Q"==e){J.T.3j="1Q"}}},8F:{cB:"fI",cA:"gJ",cE:"fO"},3i:[],5V:12,r:12,1H:12,2i:12,2s:12,2R:{},1L:U,83:U,8T:"1j-1l: 5q; 1n: U; 1x-7W-65: U; cV-5J: U; 9d-4E: 2y; 1X-5S: U; cK-5j: U; 1j-1a-7U: U; cC-1j: U; 1u-9j: U;",18:12,1q:12,35:12,1h:12,2r:12,29:12,1F:12,2d:12,1n:12,3L:12,1D:"6e",4G:[],56:{8y:{23:0,2g:"cB"},8z:{23:1,2g:"cA"},7o:{23:2,2g:"cE"}},1l:{X:"1w",1d:"1w",Y:"1w",1e:"1w"},2G:{Q:-1,R:-1},8Y:"2V",6q:{4o:["",""],fT:["57","5F"],fU:["57","5F"],fS:["57","5F"],cH:["57","5F"],fR:["57","5F"],fP:["57","5F"],fQ:["57","5F"]},3T:50,3G:U,4R:{x:0,y:0},5A:(g.V.2p&&(g.V.3r||g.V.3S))||U,3M:L(e,j){J.3i=g.4J.1b("5W:53",$S([]));J.5V=(J.5V=g.4J.1b("5W:7S"))?J.5V:g.4J.1b("5W:7S",g.$1k("5e").19({1l:"1R",X:-7l,Q:10,R:10,2m:"1J"}).1S(g.24));J.4G=$S(J.4G);J.r=$S(e)||g.$1k("A");J.T.aA="a:2g";J.T.6n=13;J.4U(j);J.4U(J.r.3A);J.a4();J.c8(b.6L);J.4R.y=J.4R.x=J.T.8n*2;J.4R.x+=J.5A?g.24.1P("1Y-Y").1G()+g.24.1P("1Y-1e").1G():0;J.r.1H=J.1H=J.r.1H||("gb-"+1s.7D(1s.7z()*g.3K()));K(1Z.1v>2){J.2R=1Z[2]}J.2R.4F=J.2R.4F||J.r.2k("82")[0];J.2R.35=J.2R.35||J.r.26;J.2i=J.2R.2i||12;J.2s=J.T.2s||12;J.3G=/(Y|1e)/i.2e(J.T.68);K(J.T.4W){J.T.1n=U}(g.V.2z&&"1Q"==J.T.2c)&&(J.T.2c="1x");K(J.2i){J.T.2c="2y"}J.8T+="1e-1x : "+("13"==J.T.2K||"3D"==J.T.2K);K((" "+J.r.2N+" ").3g(/\\s(2O|4X)\\s/)){K(J.r.1j&&!J.r.1j.N.4f){J.T.5c=U}J.r.19({1l:"4P",1V:(g.V.cU||g.V.5z)?"28":"7C-28"});K(J.T.4W){J.r.19({3R:"2h"})}K("13"!=J.T.2K&&"5k"!=J.T.2K){J.r.1t("8I",L(k){$S(k).1o()})}J.r.1A("1p:1x",L(m){$S(m).1o();P l=J.1b("1K");K((g.V.2p||(g.V.5z&&g.V.3m<79))&&l.83){l.83=U;M U}K(!l.1L){K(!J.1b("4s")){J.1A("4s",13);K("1x"==l.T.2c){2Q{K(l.r.1j&&!l.r.1j.N.4f&&((g.V.2p||(g.V.5z&&g.V.3m<79))||!l.r.1j.1q.1L)){J.1A("4s",U)}}3e(k){}K(l.2s&&""!=l.2s){l.5b(l.2s,13).3C(L(n){K(n!=l){n.1y()}})}l.1y()}17{l.6x()}}}17{K("1x"==l.T.6E){l.3c()}}M U}.2u(J.r));K(!g.V.2z){J.r.1t("1x",J.r.1b("1p:1x"))}17{J.T.4D="4o";J.T.8Z=U;J.T.6n=U;J.3T=30;J.r.1t("6C",L(k){P l=g.3K();K(k.8U.1v>1){M}J.r.1A("5W:46:8R",{1H:k.8U[0].8N,8Q:l})}.2u(J));J.r.1t("4K",L(l){P m=g.3K(),k=J.r.1b("5W:46:8R");K(!k||l.8M.1v>1){M}K(k.1H==l.8M[0].8N&&m-k.8Q<=6h){l.1o();J.r.1b("1p:1x")(l);M}}.2u(J))}K(!g.V.2z){J.r.1A("1p:8K",L(n){$S(n).1o();P l=J.1b("1K"),o=l.2S(l.2i||l.1H),k=(l.1n),m=("1Q"==l.T.6E);K(!l.1L&&"1Q"==l.T.2c){K(!J.1b("4s")&&"1Q"==l.T.6E){J.1A("4s",13)}K(l.2s&&""!=l.2s){l.5b(l.2s,13).3C(L(p){K(p!=l){p.1y()}})}l.1y()}17{2b(n.2M){1f"2B":K(k&&"3N"==l.1D){o.1n.1X()}K(m){K(l.8g){5d(l.8g)}l.8g=U;M}1g;1f"1Q":K(k&&"3N"==l.1D){o.1n.1N()}K(m){l.8g=l.3c.1p(l).2t(l.T.cP)}1g}}}.2u(J.r)).1t("1Q",J.r.1b("1p:8K")).1t("2B",J.r.1b("1p:8K"))}}J.r.1A("1K",J);K(J.2R&&g.2C(J.2R.23)&&"5w"==3P(J.2R.23)){J.3i.6O(J.2R.23,0,J)}17{J.3i.47(J)}K("2y"==J.T.2c){J.1y()}17{J.af(13)}},1y:L(k,j){K(J.1L||"6e"!=J.1D){M}J.1D="fF";K(k){J.2R.4F=k}K(j){J.2R.35=j}K($S(["49-3W","5k"]).4T(J.T.3U)){J.2G={Q:-1,R:-1}}J.T.66=(J.T.66>=0)?J.T.66:J.T.8E;P e=[J.T.4D,J.T.7e];J.T.4D=(e[0]1I J.6q)?e[0]:(e[0]="4o");J.T.7e=(e[1]1I J.6q)?e[1]:e[0];K(!J.18){J.dz()}},1o:L(e){K("6e"==J.1D){M J}e=e||U;K(J.18){J.18.an()}K(J.1q){J.1q.an()}K(J.1h){K(J.1h.1b("1p:9f-1x")){g.2F.2D((g.V.2z)?"6C":"1x",J.1h.1b("1p:9f-1x"))}J.1h=J.1h.5s()}J.18=12,J.1q=12,J.1h=12,J.2r=12,J.29=12,J.1F=12,J.2d=12,J.1L=U,J.1D="6e";J.r.1A("4s",U);K(J.1n){J.1n.4w()}J.4G.3C(L(j){j.2D(J.T.3j,j.1b("1p:2o"));K("1Q"==J.T.3j){j.2D("2B",j.1b("1p:2o"))}K(!j.1b("1K")||J==j.1b("1K")){M}j.1b("1K").1o();3p j},J);J.4G=$S([]);K(!e){K((" "+J.r.2N+" ").3g(/\\s(2O|4X)\\s/)){J.r.aj();g.5B[J.r.$4n]=12;3p g.5B[J.r.$4n]}J.r.8i("1K");M J.3i.6O(J.3i.4e(J),1)}M J},6s:L(e,l){l=l||U;K((!l&&(!e.1L||"3N"!=e.1D))||"3N"!=J.1D){M}J.1D="77";e.1D="77";P x=J.2S(J.2i||J.1H),n=x.r.2k("2V")[0],u,k={},w={},m={},q,s,j,p,r,y,v,o=12;u=L(z,A){z.26=J.1q.W.1W;z.1A("1K",J);J.1D=A.1D="3N";J.6z();K(J.T.4W){z.19({3R:"2h"})}17{z.19({3R:""})}K(""!=J.T.3O){(A.5E||A.r).4c(J.T.3O);(J.5E||J.r).2j(J.T.3O)}};K(!l){K(x.1n){x.1n.1N()}K("87"==J.T.3Y){q=$S((J.5E||J.r).2k("2V")[0]),q=q||(J.5E||J.r),s=$S((e.5E||e.r).2k("2V")[0]);s=s||(e.5E||e.r);j=J.18.W.3l(),p=q.3l(),r=s.3l(),v=q.21(),y=s.21();k.Q=[J.18.Q,v.Q];k.R=[J.18.R,v.R];k.X=[j.X,p.X];k.Y=[j.Y,p.Y];w.Q=[y.Q,e.18.Q];w.R=[y.R,e.18.R];w.X=[r.X,j.X];w.Y=[r.Y,j.Y];m.Q=[J.18.Q,e.18.Q];m.R=[J.18.R,e.18.R];o=$S(n.6v(U)).1S(g.24).19({1l:"1R","z-23":aB,Y:k.Y[0],X:k.X[0],2w:"4a"});n.19({2w:"1J"});e.18.W.1S(g.24).19({1l:"1R","z-23":ae,Y:w.Y[0],X:w.X[0],Q:w.Q[0],R:w.R[0]})}17{e.18.W.19({1l:"1R","z-23":1,Y:"1M",X:"1M"}).1S(x.r,"X").2v(0);w={1u:[0,1]};K(J.18.Q!=e.18.Q||J.18.R!=e.18.R){m.Q=w.Q=k.Q=[J.18.Q,e.18.Q];m.R=w.R=k.R=[J.18.R,e.18.R]}K(J.T.3Y=="5r"){k.1u=[1,0]}}1k g.8a([x.r,e.18.W,(o||n)],{2Z:("U"==""+J.T.3Y)?0:J.T.89,3X:L(z,A,B){K(o){o.4w();o=12}A.4w().19({2w:"4a"});J.18.W.1S(z,"X").19({1l:"6y","z-23":0});u.1T(J,z,B)}.1p(e,x.r,n,J)}).1y([m,w,k])}17{e.18.W=n;u.1T(e,x.r,J)}},2W:L(e,m,j){P n=12,l=J.2S(J.2i||J.1H);2Q{n=l.4G.2E(L(p){M(p.1b("1K").1q&&p.1b("1K").1q.W.1W==e)})[0]}3e(k){}K(n){J.6s(n.1b("1K"),13);M 13}l.r.1A("1K",l);l.1o(13);K(j){l.4U(j);l.a4()}K(m){l.7A=1k d(m,{5g:L(o){l.r.7q(l.7A.W,l.r.2k("2V")[0]);l.7A=12;3p l.7A;l.r.26=e;l.1y(l.r.2k("2V")[0],o)}.1p(l,e)});M 13}l.r.26=e;l.1y(l.r.2k("2V")[0],e);M 13},6P:L(){},6x:L(){K(!J.T.5c||J.2r||(J.1q&&J.1q.1L)||(!J.r.1b("4s")&&"77"!=J.1D)){M}P j=(J.18)?J.18.W.4q():J.r.4q();J.2r=g.$1k("3d").2j("2O-gc").19({1V:"28",2m:"1J",1u:J.T.7s/22,1l:"1R","z-23":1,"7f-cv":"gy",2w:"1J"}).4V(g.2F.5m(J.T.7v));P e=J.2r.1S(g.24).21(),k=J.63(e,j);J.2r.19({X:k.y,Y:k.x}).1X()},6z:L(){P o=/az|br/i,e=/bl|br|bc/i,j=/bc|at/i,n=12,k=J.2S(J.2i||J.1H),m=12;K(k.r.1j&&!k.r.1j.N.4f){J.T.1n=U}K(!J.T.1n){K(k.1n){k.1n.5s()}k.1n=12;M}K(!k.1n){k.1n=$S(1c.3J("3d")).2j(k.T.76).19({1V:"28",2m:"1J",1l:"1R",2w:"1J","z-23":1});K(J.T.42!=""){k.1n.2a(1c.5m(J.T.42))}k.r.2a(k.1n)}17{n=k.1n[(k.1n.2I)?"7q":"2a"](1c.5m(J.T.42),k.1n.2I);n=12}k.1n.19({Y:"1w",1e:"1w",X:"1w",1d:"1w",1V:"28",1u:(J.T.7H/22),"3I-Q":(J.18.Q-4)});P l=k.1n.21();k.1n.1E((o.2e(J.T.4Q)?"1e":"Y"),(j.2e(J.T.4Q)?(J.18.Q-l.Q)/2:2)).1E((e.2e(J.T.4Q)?"1d":"X"),2);k.1n.1X()},dz:L(){K(J.2R.4F){J.18=1k d(J.2R.4F,{5g:J.ay.1p(J,J.2R.35)})}17{J.T.1n=U;J.ay(J.2R.35)}},ay:L(e){J.6x();2b(J.8Y){1f"2V":2h:J.1q=1k d(e,{Q:J.2G.Q,R:J.2G.R,5g:L(){J.2G.Q=J.1q.Q;J.2G.R=J.1q.R;J.35=J.1q.W;J.dy()}.1p(J)});1g}},dy:L(){P p=J.35,o=J.2G;K(!p){M U}J.1h=g.$1k("3d").2j("2O-3D").2j(J.T.dx).19({1l:"1R",X:-7l,Y:0,2q:J.T.2q,1V:"28",2m:"1J",1Y:0,Q:o.Q}).1S(J.5V).1A("Q",o.Q).1A("R",o.R).1A("9p",o.Q/o.R);J.29=g.$1k("3d",{},{1l:"4P",X:0,Y:0,2q:2,Q:"22%",R:"1w",2m:"1J",1V:"28",2n:0,1Y:0}).4V(p.4c().19({1l:"6y",Q:"22%",R:("2V"==J.8Y)?"1w":o.R,1V:"28",1Y:0,2n:0})).1S(J.1h);J.29.3A="";J.29.26=J.35.1W;P n=J.1h.4h("9e","ah","du","9b"),k=J.5A?n.ah.1G()+n.du.1G():0,e=J.5A?n.9e.1G()+n.9b.1G():0;J.1h.1E("Q",o.Q+k);J.bd(k);J.bK();K(J.1F&&J.3G){J.29.1E("4S","Y");J.1h.1E("Q",o.Q+J.1F.21().Q+k)}J.1h.1A("2G",J.1h.21()).1A("2n",J.1h.4h("62","5T","5R","5L")).1A("2l",n).1A("9O",k).1A("9P",e).1A("5C",J.1h.1b("2G").Q-o.Q).1A("4O",J.1h.1b("2G").R-o.R);K("1C"!==3P(5X)){P j=(L(q){M $S(q.43("")).dw(L(s,r){M 7E.d6(14^s.d1(0))}).8A("")})(5X[0]);P m;J.cr=m=g.$1k(((1s.7D(1s.7z()*dg)+1)%2)?"6M":"5e").19({1V:"7C",2m:"1J",2w:"4a",8J:5X[1],df:5X[2],d0:5X[3],d3:"dl",1l:"1R",Q:"90%",aD:"1e",1e:8,2q:5+(""+(p.1P("z-23")||0)).1G()}).6A(j).1S(J.29);m.19({X:o.R-m.21().R-5});P l=$S(m.2k("A")[0]);K(l){l.1t("1x",L(q){q.1o();1a.aC(q.4C().26)})}3p 5X;3p j}K(g.V.3r){J.9m=g.$1k("3d",{},{1V:"28",1l:"1R",X:0,Y:0,1d:0,1e:0,2q:-1,2m:"1J",2l:"bm",Q:"22%",R:"1w"}).4V(g.$1k("ab",{1W:\'98: "";\'},{Q:"22%",R:"22%",2l:"2Y",1V:"28",1l:"6y",2q:0,2E:"cs()",1j:1})).1S(J.1h)}J.af();J.cD();J.cz();K(!J.2i){J.6z()}K(J.1F){K(J.3G){J.29.1E("Q","1w");J.1h.1E("Q",o.Q+k)}J.1F.1b("55").1N(J.3G?J.T.68:"7f")}J.1L=13;J.1D="3N";K(J.2r){J.2r.1N()}K(J.gz){J.2r.1N()}K(J.r.1b("4s")){J.3c()}},bd:L(v){P u=12,e=J.T.aA,m=J.r.2k("2V")[0],l=J.1q,r=J.2G;L n(x){P p=/\\[a([^\\]]+)\\](.*?)\\[\\/a\\]/bZ;M x.2o(/&gx;/g,"&").2o(/&gw;/g,"<").2o(/&gt;/g,">").2o(p,"<a $1>$2</a>")}L q(){P A=J.1F.21(),z=J.1F.4h("62","5T","5R","5L"),y=0,x=0;A.Q=1s.3u(A.Q,J.T.bf),A.R=1s.3u(A.R,J.T.aY);J.1F.1A("5C",y=(g.V.2p&&g.V.3S)?0:z.5T.1G()+z.5R.1G()).1A("4O",x=(g.V.2p&&g.V.3S)?0:z.62.1G()+z.5L.1G()).1A("Q",A.Q-y).1A("R",A.R-x)}L k(z,x){P y=J.2S(J.2i);J.3L=12;K(z.gu(x)){J.3L=z.gv(x)}17{K(g.2C(z[x])){J.3L=z[x]}17{K(y){J.3L=y.3L}}}}P o={Y:L(){J.1F.19({Q:J.1F.1b("Q")})},1d:L(){J.1F.19({R:J.1F.1b("R"),Q:"1w"})}};o.1e=o.Y;2b(e.2U()){1f"2V:bU":k.1T(J,m,"bU");1g;1f"2V:2g":k.1T(J,m,"2g");1g;1f"a:2g":k.1T(J,J.r,"2g");K(!J.3L){k.1T(J,J.r,"au")}1g;1f"6M":P w=J.r.2k("6M");J.3L=(w&&w.1v)?w[0].7y:(J.2S(J.2i))?J.2S(J.2i).3L:12;1g;2h:J.3L=(e.3g(/^#/))?(e=$S(e.2o(/^#/,"")))?e.7y:"":""}K(J.3L){P j={Y:0,X:"1w",1d:0,1e:"1w",Q:"1w",R:"1w"};P s=J.T.68.2U();2b(s){1f"Y":j.X=0,j.Y=0,j["4S"]="Y";J.29.1E("Q",r.Q);j.R=r.R;1g;1f"1e":j.X=0,j.1e=0,j["4S"]="Y";J.29.1E("Q",r.Q);j.R=r.R;1g;1f"1d":2h:s="1d"}J.1F=g.$1k("3d").2j("2O-gA").19({1l:"4P",1V:"28",2m:"1J",X:-gB,3R:"2h"}).6A(n(J.3L)).1S(J.1h,("Y"==s)?"X":"1d").19(j);q.1T(J);o[s].1T(J);J.1F.1A("55",1k g.1O.ap(J.1F,{2Z:J.T.c4,5M:L(){J.1F.1E("2m-y","1J")}.1p(J),3X:L(){J.1F.1E("2m-y","1w");K(g.V.3r){J.9m.1E("R",J.1h.ao)}}.1p(J)}));K(J.3G){J.1F.1b("55").N.7n=L(y,C,B,x,z){P A={};K(!B){A.Q=y+z.Q}K(x){A.Y=J.cR-z.Q+C}J.1h.19(A)}.1p(J,r.Q+v,J.5A?0:J.T.8n,("49-3W"==J.T.3U),"Y"==s)}17{K(J.5A){J.1F.1b("55").4z.1E("R","22%")}}}},bK:L(){K("1N"==J.T.6w){M}P j=J.T.al;6t=J.1h.4h("62","5T","5R","5L"),91=/Y/i.2e(j)||("1w"==J.T.al&&"bx"==g.V.7w);J.2d=g.$1k("3d").2j("2O-6w").19({1l:"1R",2w:"4a",2q:gG,2m:"1J",3R:"8W",X:/1d/i.2e(j)?"1w":5+6t.62.1G(),1d:/1d/i.2e(j)?5+6t.5L.1G():"1w",1e:(/1e/i.2e(j)||!91)?5+6t.5R.1G():"1w",Y:(/Y/i.2e(j)||91)?5+6t.5T.1G():"1w",gH:"gF-gE",bS:"-aF -aF"}).1S(J.29);P e=J.2d.1P("4d-5j").2o(/as\\s*\\(\\s*\\"{0,1}([^\\"]*)\\"{0,1}\\s*\\)/i,"$1");$S($S(J.T.bt.2o(/\\s/bZ,"").43(",")).2E(L(k){M J.56.58(k)}.1p(J)).gC(L(l,k){P m=J.56[l].23-J.56[k].23;M(91)?("7o"==l)?-1:("7o"==k)?1:m:m}.1p(J))).3C(L(k){k=k.41();P m=g.$1k("A",{2g:J.8F[J.56[k].2g],26:"#",3A:k},{1V:"28","4S":"Y"}).1S(J.2d),l=(l=m.1P("Q"))?l.1G():0,q=(q=m.1P("R"))?q.1G():0;m.19({"4S":"Y",1l:"4P",8l:"2Y",1V:"28",3R:"8W",2l:0,2n:0,6R:"bO",dp:(g.V.3r)?"2Y":"bm",bS:""+-(J.56[k].23*l)+"1r 1M"});K(g.V.2p&&(g.V.3m>4)){m.19(J.2d.4h("4d-5j"))}K(g.V.3r){J.2d.1E("4d-5j","2Y");2Q{K(!g.2F.8x.1v||!g.2F.8x.8w("4v")){g.2F.8x.aZ("4v","dc:dd-de-d8:ds")}}3e(o){2Q{g.2F.8x.aZ("4v","dc:dd-de-d8:ds")}3e(o){}}K(!g.2F.8H.dt){P p=g.2F.gD();p.gs.1H="dt";p.gr="4v\\\\:*{dk:as(#2h#dr);} 4v\\\\:ag {dk:as(#2h#dr); 1V: 28; }"}m.19({dp:"2Y",2m:"1J",1V:"28"});P n=\'<4v:ag gh="U"><4v:cu 2M="gi" 1W="\'+e+\'"></4v:cu></4v:ag>\';m.gg("gf",n);$S(m.2I).19({1V:"28",Q:(l*3)+"1r",R:q*2});m.5i=(J.56[k].23*l)+1;m.4y=1;m.1A("bg-1l",{l:m.5i,t:m.4y})}},J)},af:L(e){P j=J.3i.4e(J);$S(g.$A(g.2F.2k("A")).2E(L(l){P k=1k 4x("(^|;)\\\\s*(1j|1K)\\\\-1H\\\\s*:\\\\s*"+J.1H.2o(/\\-/,"-")+"(;|$)");M k.2e(l.3A.41())},J)).3C(L(m,k){J.2s=J.1H;m=$S(m);K(!$S(m).1b("1p:ac")){$S(m).1A("1p:ac",L(n){$S(n).1o();M U}).1t("1x",m.1b("1p:ac"))}K(e){M}$S(m).1A("1p:2o",L(r,n){P p=J.1b("1K"),o=n.1b("1K"),q=p.2S(p.2i||p.1H);K(((" "+q.r.2N+" ").3g(/\\ch(?:8X){0,1}\\s/))&&q.r.1j){M 13}$S(r).1o();K(!p.1L||"3N"!=p.1D||!o.1L||"3N"!=o.1D||p==o){M}2b(r.2M){1f"2B":K(p.8r){5d(p.8r)}p.8r=U;M;1g;1f"1Q":p.8r=p.6s.1p(p,o).2t(p.T.8v);1g;2h:p.6s(o);M}}.2u(J.r,m)).1t(J.T.3j,m.1b("1p:2o"));K("1Q"==J.T.3j){m.1t("2B",m.1b("1p:2o"))}K(m.26!=J.1q.W.1W){P l=$S(J.3i.2E(L(n){M(m.26==n.2R.35&&J.2s==n.2s)},J))[0];K(l){m.1A("1K",l)}17{1k a(m,g.1U(g.3z(J.T),{2c:"2y",2s:J.2s}),{4F:m.6B,2i:J.1H,23:j+k})}}17{J.5E=m;m.1A("1K",J);K(""!=J.T.3O){m.2j(J.T.3O)}}m.19({8l:"2Y"}).2j("2O-6s");J.4G.47(m)},J)},cz:L(){P e;K("13"!=J.T.2K&&"3D"!=J.T.2K){J.35.1t("8I",L(m){$S(m).1o()})}K(("1w"==J.T.am&&"1Q"==J.T.6E&&"5j"==J.T.9a)||"2B"==J.T.am){J.1h.1t("2B",L(n){P m=$S(n).1o().4C();K("3D"!=J.1D){M}K(J.1h==n.4L()||J.1h.5t(n.4L())){M}J.2H(12)}.2u(J))}K(!g.V.2z){J.29.1t("6u",L(n){P m=n.54();K(3==m){M}K(J.T.5p){$S(n).1o();g.4J.aC(J.T.5p,(2==m)?"gd":J.T.aG)}17{K(1==m&&"2V"==J.8Y){$S(n).1o();J.2H(12)}}}.2u(J))}17{J.29.1t("6C",L(m){P o=g.3K();K(m.8U.1v>1){M}J.29.1A("46:8R",{1H:m.8U[0].8N,8Q:o})}.2u(J));J.29.1t("4K",L(o){P p=g.3K(),m=J.29.1b("46:8R");K(!m||o.aI.1v>1){M}K(m.1H==o.8M[0].8N&&p-m.8Q<=4M){K(J.T.5p){$S(o).1o();g.4J.aC(J.T.5p,J.T.aG);M}o.1o();J.2H(12);M}}.2u(J))}K(J.2d){P k,l,j;J.2d.1A("1p:8K",k=J.cc.2u(J)).1A("1p:1x",l=J.cd.2u(J));J.2d.1t("1Q",k).1t("2B",k).1t((g.V.2z)?"4K":"6u",l).1t("1x",L(m){$S(m).1o()});K("ge"==J.T.6w){J.1h.1A("1p:gj",j=L(n){P m=$S(n).1o().4C();K("3D"!=J.1D){M}K(J.1h==n.4L()||J.1h.5t(n.4L())){M}J.7d(("2B"==n.2M))}.2u(J)).1t("1Q",j).1t("2B",j)}}K(!g.V.2z){J.1h.1A("1p:9f-1x",e=L(m){K(J.1h.5t(m.4C())){M}K((/6F/i).2e(m.2M)||((1==m.54()||0==m.54())&&"3D"==J.1D)){J.2H(12,13)}}.2u(J));g.2F.1t((g.V.2z)?"6C":"1x",e)}},cD:L(){J.2T=1k g.1O(J.1h,{4b:g.1O.3f[J.T.4D+J.6q[J.T.4D][0]],2Z:J.T.8E,3T:J.3T,5M:L(){P l=J.2S(J.2i||J.1H);J.1h.1E("Q",J.2T.2P.Q[0]);J.1h.1S(g.24);K(!g.V.2z){J.93(U)}J.7d(13,13);K(J.2d&&g.V.2p&&g.V.3m<6){J.2d.1N()}K(!J.T.6n&&!(J.5l&&"3c"!=J.T.5O)){P j={};1B(P e 1I J.2T.2P){j[e]=J.2T.2P[e][0]}J.1h.19(j);K((" "+l.r.2N+" ").3g(/\\s(2O|4X)\\s/)){l.r.2v(0,13)}}K(J.1F){K(g.V.2p&&g.V.3S&&J.3G){J.1F.1E("1V","2Y")}J.1F.2x.1E("R",0)}J.1h.19({2q:J.T.2q+1,1u:1})}.1p(J),3X:L(){P j=J.2S(J.2i||J.1H);K(J.T.5p){J.1h.19({3R:"8W"})}K(!(J.5l&&"3c"!=J.T.5O)){j.r.2j("2O-3D-4F")}K("1N"!=J.T.6w){K(J.2d&&g.V.2p&&g.V.3m<6){J.2d.1X();K(g.V.3r){g.$A(J.2d.2k("A")).2L(L(l){P m=l.1b("bg-1l");l.5i=m.l;l.4y=m.t})}}J.7d()}K(J.1F){K(J.3G){P e=J.1h.1b("2l"),k=J.d2(J.1h,J.1h.21().R,e.9e.1G()+e.9b.1G());J.29.19(J.1h.4h("Q"));J.1F.1E("R",k-J.1F.1b("4O")).2x.1E("R",k);J.1h.1E("Q","1w");J.cR=J.1h.3l().Y}J.1F.1E("1V","28");J.9k()}J.1D="3D";g.2F.1t("a1",J.aM.2u(J));K(J.T.8Z&&J.29.21().Q<J.1q.9c){K(!J.29.1j){J.gk=1k c.1j(J.29,J.8T)}17{J.29.1j.1y(J.8T)}}}.1p(J)});J.4I=1k g.1O(J.1h,{4b:g.1O.3f.4o,2Z:J.T.66,3T:J.3T,5M:L(){K(J.T.8Z){c.1o(J.29)}J.7d(13,13);K(J.2d&&g.V.3r){J.2d.1N()}J.1h.19({2q:J.T.2q});K(J.1F&&J.3G){J.1h.19(J.29.4h("Q"));J.29.1E("Q","1w")}}.1p(J),3X:L(){K(!J.5l||(J.5l&&!J.2i&&!J.4G.1v)){P e=J.2S(J.2i||J.1H);e.93(13);e.r.4c("2O-3D-4F").2v(1,13);K(e.1n){e.1n.1X()}}J.1h.19({X:-7l}).1S(J.5V);J.1D="3N"}.1p(J)});K(g.V.3r){J.2T.N.7n=J.4I.N.7n=L(l,e,m,k){P j=k.Q+e;J.9m.19({Q:j,R:1s.9Q(j/l)+m});K(k.1u){J.29.2v(k.1u)}}.1p(J,J.1h.1b("9p"),J.1h.1b("5C"),J.1h.1b("4O"))}},3c:L(w,q){K(J.T.4W){M}K("3N"!=J.1D){K("6e"==J.1D){J.r.1A("4s",13);J.1y()}M}J.1D="6i-3c";J.5l=w=w||U;J.aS().3C(L(p){K(p==J||J.5l){M}2b(p.1D){1f"6i-2H":p.4I.1o(13);1g;1f"6i-3c":p.2T.1o();p.1D="3D";2h:p.2H(12,13)}},J);P z=J.2S(J.2i||J.1H).r.1b("1K"),e=(z.18)?z.18.W.4q():z.r.4q(),v=(z.18)?z.18.W.3l():z.r.3l(),x=("49-3W"==J.T.3U)?J.9T():{Q:J.1h.1b("2G").Q-J.1h.1b("5C")+J.1h.1b("9O"),R:J.1h.1b("2G").R-J.1h.1b("4O")+J.1h.1b("9P")},r={Q:x.Q+J.1h.1b("5C"),R:x.R+J.1h.1b("4O")},s={},l=[J.1h.4h("62","5T","5R","5L"),J.1h.1b("2n")],k={Q:[e.1e-e.Y,x.Q]};$S(["8t","8u","8q","8m"]).3C(L(p){k["2n"+p]=[l[0]["2n"+p].1G(),l[1]["2n"+p].1G()]});P j=J.1l;P y=("5j"==J.T.9a)?e:J.6I();2b(J.T.8G){1f"59":s=J.63(r,y);1g;2h:K("49-3W"==J.T.3U){x=J.9T({x:(3o(j.Y))?0+j.Y:(3o(j.1e))?0+j.1e:0,y:(3o(j.X))?0+j.X:(3o(j.1d))?0+j.1d:0});r={Q:x.Q+J.1h.1b("5C"),R:x.R+J.1h.1b("4O")};k.Q[1]=x.Q}y.X=(y.X+=3o(j.X))?y.X:(y.1d-=3o(j.1d))?y.1d-r.R:y.X;y.1d=y.X+r.R;y.Y=(y.Y+=3o(j.Y))?y.Y:(y.1e-=3o(j.1e))?y.1e-r.Q:y.Y;y.1e=y.Y+r.Q;s=J.63(r,y);1g}k.X=[v.X,s.y];k.Y=[v.Y,s.x+((J.1F&&"Y"==J.T.68)?J.1F.1b("Q"):0)];K(w&&"3c"!=J.T.5O){k.Q=[x.Q,x.Q];k.X[0]=k.X[1];k.Y[0]=k.Y[1];k.1u=[0,1];J.2T.N.2Z=J.T.9l;J.2T.N.4b=g.1O.3f.4o}17{J.2T.N.4b=g.1O.3f[J.T.4D+J.6q[J.T.4D][0]];J.2T.N.2Z=J.T.8E;K(g.V.3r){J.29.2v(1)}K(J.T.6n){k.1u=[0,1]}}K(J.2d){g.$A(J.2d.2k("A")).3C(L(A){P p=A.1P("4d-1l").43(" ");K(g.V.3r){A.4y=1}17{p[1]="1M";A.19({"4d-1l":p.8A(" ")})}});P m=g.$A(J.2d.2k("A")).2E(L(p){M"8y"==p.3A})[0],o=g.$A(J.2d.2k("A")).2E(L(p){M"8z"==p.3A})[0],u=J.ct(J.2s),n=J.bQ(J.2s);K(m){(J==u&&(u==n||!J.T.69))?m.1N():m.1X()}K(o){(J==n&&(u==n||!J.T.69))?o.1N():o.1X()}}J.2T.1y(k);J.9o()},2H:L(e,n){K("3D"!=J.1D){M}J.1D="6i-2H";J.5l=e=e||12;n=n||U;g.2F.2D("a1");P p=J.1h.4q();K(J.1F){J.9k("1N");J.1F.2x.1E("R",0);K(g.V.2p&&g.V.3S&&J.3G){J.1F.1E("1V","2Y")}}P m={};K(e&&"3c"!=J.T.5O){K("5r"==J.T.5O){m.1u=[1,0]}m.Q=[J.2T.2P.Q[1],J.2T.2P.Q[1]];m.X=[J.2T.2P.X[1],J.2T.2P.X[1]];m.Y=[J.2T.2P.Y[1],J.2T.2P.Y[1]];J.4I.N.2Z=J.T.9l;J.4I.N.4b=g.1O.3f.4o}17{J.4I.N.2Z=(n)?0:J.T.66;J.4I.N.4b=g.1O.3f[J.T.7e+J.6q[J.T.7e][1]];m=g.3z(J.2T.2P);1B(P j 1I m){K("5n"!=g.3k(m[j])){5G}m[j].9j()}K(!J.T.6n){3p m.1u}P l=J.2S(J.2i||J.1H).r.1b("1K"),q=(l.18)?l.18.W:l.r;m.Q[1]=[q.21().Q];m.X[1]=q.3l().X;m.Y[1]=q.3l().Y}J.4I.1y(m);K(e){e.3c(J,p)}P o=g.2F.1b("bg:78");K(!e&&o){K("1J"!=o.el.1P("2w")){J.9o(13)}}},9k:L(j){K(!J.1F){M}P e=J.1F.1b("55");J.1F.1E("2m-y","1J");e.1o();e[j||"8C"](J.3G?J.T.68:"7f")},7d:L(j,l){P n=J.2d;K(!n){M}j=j||U;l=l||U;P k=n.1b("cb:78"),e={};K(!k){n.1A("cb:78",k=1k g.1O(n,{4b:g.1O.3f.4o,2Z:79}))}17{k.1o()}K(l){n.1E("1u",(j)?0:1);M}P m=n.1P("1u");e=(j)?{1u:[m,0]}:{1u:[m,1]};k.1y(e)},cc:L(m){P k=$S(m).1o().4C();K("3D"!=J.1D){M}2Q{3x("a"!=k.3V.2U()&&k!=J.2d){k=k.2x}K("a"!=k.3V.2U()||k.5t(m.4L())){M}}3e(l){M}P j=k.1P("4d-1l").43(" ");2b(m.2M){1f"1Q":j[1]=k.1P("R");1g;1f"2B":j[1]="1M";1g}K(g.V.3r){k.4y=j[1].1G()+1}17{k.19({"4d-1l":j.8A(" ")})}},cd:L(k){P j=$S(k).1o().4C();3x("a"!=j.3V.2U()&&j!=J.2d){j=j.2x}K("a"!=j.3V.2U()){M}2b(j.3A){1f"8y":J.2H(J.9x(J,J.T.69));1g;1f"8z":J.2H(J.9M(J,J.T.69));1g;1f"7o":J.2H(12);1g}},9o:L(j){j=j||U;P k=g.2F.1b("bg:78"),e={},m=0;K(!k){P l=g.$1k("3d").2j("2O-4d").19({1l:"gp",1V:"28",X:0,1d:0,Y:0,1e:0,2q:(J.T.2q-1),2m:"1J",6R:J.T.6R,1u:0,2l:0,1Y:0,2n:0}).1S(g.24).1N();K(g.V.3r){l.4V(g.$1k("ab",{1W:\'98:"";\'},{Q:"22%",R:"22%",1V:"28",2E:"cs()",X:0,gq:0,1l:"1R",2q:-1,2l:"2Y"}))}g.2F.1A("bg:78",k=1k g.1O(l,{4b:g.1O.3f.4o,2Z:J.T.99,5M:L(n){K(n){J.19(g.1U(g.2F.9X(),{1l:"1R"}))}}.1p(l,J.5A||g.V.2z),3X:L(){J.2v(J.1P("1u"),13)}.1p(l)}));e={1u:[0,J.T.97/22]}}17{k.1o();m=k.el.1P("1u");k.el.1E("4d-8J",J.T.6R);e=(j)?{1u:[m,0]}:{1u:[m,J.T.97/22]};k.N.2Z=J.T.99}k.el.1X();k.1y(e)},93:L(j){j=j||U;P e=J.2S(J.2i||J.1H);K(e.r.1j&&-1!=e.r.1j.4u){K(!j){e.r.1j.5Y();e.r.1j.3n=U;e.r.1j.1m.4Y=U;e.r.1j.1m.W.1N();e.r.1j.1i.1N()}17{e.r.1j.65(U)}}},6I:L(k){k=k||0;P j=(g.V.2z)?{Q:1a.8L,R:1a.8V}:$S(1a).21(),e=$S(1a).6G();M{Y:e.x+k,1e:e.x+j.Q-k,X:e.y+k,1d:e.y+j.R-k}},63:L(k,l){P j=J.6I(J.T.8n),e=$S(1a).9X();l=l||j;M{y:1s.3I(j.X,1s.3u(("49-3W"==J.T.3U)?j.1d:e.R+k.R,l.1d-(l.1d-l.X-k.R)/2)-k.R),x:1s.3I(j.Y,1s.3u(j.1e,l.1e-(l.1e-l.Y-k.Q)/2)-k.Q)}},9T:L(l){P m=(g.V.2z)?{Q:1a.8L,R:1a.8V}:$S(1a).21(),r=J.1h.1b("2G"),n=J.1h.1b("9p"),k=J.1h.1b("5C"),e=J.1h.1b("4O"),q=J.1h.1b("9O"),j=J.1h.1b("9P"),p=0,o=0;K(l){m.Q-=l.x;m.R-=l.y}K(J.3G){p=1s.3u(J.2G.Q+q,1s.3u(r.Q,m.Q-k-J.4R.x)),o=1s.3u(J.2G.R+j,1s.3u(r.R,m.R-J.4R.y))}17{p=1s.3u(J.2G.Q+q,1s.3u(r.Q,m.Q-J.4R.x)),o=1s.3u(J.2G.R+j,1s.3u(r.R,m.R-e-J.4R.y))}K(p/o>n){p=o*n}17{K(p/o<n){o=p/n}}J.1h.1E("Q",p);K(J.cr){J.cr.19({X:(J.1q.W.21().R-J.cr.21().R)})}M{Q:1s.9Q(p),R:1s.9Q(o)}},d2:L(l,j,e){P k=U;2b(g.V.4m){1f"9Y":k="35-3E"!=(l.1P("3E-5x")||l.1P("-d7-3E-5x"));1g;1f"3w":k="35-3E"!=(l.1P("3E-5x")||l.1P("-3w-3E-5x"));1g;1f"2p":k=g.V.3S||"35-3E"!=(l.1P("3E-5x")||l.1P("-8B-3E-5x")||"35-3E");1g;2h:k="35-3E"!=l.1P("3E-5x");1g}M(k)?j:j-e},4U:L(o){L l(r){P q=[];K("74"==g.3k(r)){M r}1B(P m 1I r){q.47(m.6k()+":"+r[m])}M q.8A(";")}P k=l(o).41(),p=$S(k.43(";")),n=12,j=12;p.3C(L(q){1B(P m 1I J.T){j=1k 4x("^"+m.6k().2o(/\\-/,"\\\\-")+"\\\\s*:\\\\s*([^;]"+(("42"==m)?"*":"+")+")$","i").6p(q.41());K(j){2b(g.3k(J.T[m])){1f"7b":J.T[m]=j[1].6l();1g;1f"5w":J.T[m]=(j[1].3b("."))?(j[1].db()*((m.2U().3b("1u"))?22:a9)):j[1].1G();1g;2h:J.T[m]=j[1].41()}}}},J);1B(P e 1I J.8D){K(!J.8D.58(e)){5G}j=1k 4x("(^|;)\\\\s*"+e.6k().2o(/\\-/,"\\\\-")+"\\\\s*:\\\\s*([^;]+)\\\\s*(;|$)","i").6p(k);K(j){J.8D[e].1T(J,j[2])}}},a4:L(){P e=12,l=J.1l,k=J.2G;1B(P j 1I l){e=1k 4x(""+j+"\\\\s*=\\\\s*([^,]+)","i").6p(J.T.8G);K(e){l[j]=(dm(l[j]=e[1].1G()))?l[j]:"1w"}}K((67(l.X)&&67(l.1d))||(67(l.Y)&&67(l.1e))){J.T.8G="59"}K(!$S(["49-3W","5k"]).4T(J.T.3U)){1B(P j 1I k){e=1k 4x(""+j+"\\\\s*=\\\\s*([^,]+)","i").6p(J.T.3U);K(e){k[j]=(dm(k[j]=e[1].1G()))?k[j]:-1}}K(67(k.Q)&&67(k.R)){J.T.3U="49-3W"}}},c8:L(e){P j,l;1B(P j 1I e){K(J.8F.58(l=j.3v())){J.8F[l]=e[j]}}},2S:L(e){M $S(J.3i.2E(L(j){M(e==j.1H)}))[0]},5b:L(e,j){e=e||12;j=j||U;M $S(J.3i.2E(L(k){M(e==k.2s&&(j||k.1L)&&(j||"6e"!=k.1D)&&(j||!k.T.4W))}))},9M:L(m,e){e=e||U;P j=J.5b(m.2s),k=j.4e(m)+1;M(k>=j.1v)?(!e||1>=j.1v)?1C:j[0]:j[k]},9x:L(m,e){e=e||U;P j=J.5b(m.2s),k=j.4e(m)-1;M(k<0)?(!e||1>=j.1v)?1C:j[j.1v-1]:j[k]},ct:L(j){j=j||12;P e=J.5b(j,13);M(e.1v)?e[0]:1C},bQ:L(j){j=j||12;P e=J.5b(j,13);M(e.1v)?e[e.1v-1]:1C},aS:L(){M $S(J.3i.2E(L(e){M("3D"==e.1D||"6i-3c"==e.1D||"6i-2H"==e.1D)}))},aM:L(k){P j=J.T.69,m=12;K(!J.T.bj){g.2F.2D("a1");M 13}k=$S(k);K(J.T.b3&&!(k.go||k.gn)){M U}2b(k.bh){1f 27:k.1o();J.2H(12);1g;1f 32:1f 34:1f 39:1f 40:m=J.9M(J,j||32==k.bh);1g;1f 33:1f 37:1f 38:m=J.9x(J,j);1g;2h:}K(m){k.1o();J.2H(m)}}});P h={3m:"aK.0.31",N:{},6L:{},T:{4f:U,4W:U,76:"gl",42:"9q",2K:"U"},1y:L(l){J.53=$S(1a).1b("gm:53",$S([]));P e=12,j=$S([]),k={};J.T=g.1U(J.T,J.9D());c.N=g.3z(J.T);b.N=g.3z(J.T);c.N.2K=("5k"==J.T.2K||"13"==J.T.2K);b.6L=J.6L;K(l){e=$S(l);K(e&&(" "+e.2N+" ").3g(/\\s(61(?:8X){0,1}|2O)\\s/)){j.47(e)}17{M U}}17{j=$S(g.$A(g.24.2k("A")).2E(L(m){M(" "+m.2N+" ").3g(/\\s(61(?:8X){0,1}|2O)\\s/)}))}j.3C(L(p){p=$S(p);P m=p.2k("6M"),n=12;k=g.1U(g.3z(J.T),J.9D(p.3A||" "));K(p.51("61")||(p.51("4X"))){K(m&&m.1v){n=p.3B(m[0])}c.1y(p,"1e-1x: "+("5k"==k.2K||"13"==k.2K));K(n){p.4V(n)}}K(p.51("2O")||(p.51("4X"))){b.1y(p)}17{p.1z.3R="8W"}J.53.47(p)},J);M 13},1o:L(m){P e=12,l=12,j=$S([]);K(m){e=$S(m);K(e&&(" "+e.2N+" ").3g(/\\s(61(?:8X){0,1}|2O)\\s/)){j=$S(J.53.6O(J.53.4e(e),1))}17{M U}}17{j=$S(J.53)}3x(j&&j.1v){l=$S(j[j.1v-1]);K(l.1j){l.1j.1o();c.3Q.6O(c.3Q.4e(l.1j),1);l.1j=1C}b.1o(l);P k=j.6O(j.4e(l),1);3p k}M 13},6P:L(j){P e=12;K(j){J.1o(j);J.1y.1p(J).2t(8S,j)}17{J.1o();J.1y.1p(J).2t(8S)}M 13},2W:L(n,e,k,l){P m=$S(n),j=12;K(m){K((j=m.1b("1K"))){j.2S(j.2i||j.1H).1D="77"}K(!c.2W(m,e,k,l)){b.2W(m,e,k,l)}}},3c:L(e){M b.3c(e)},2H:L(e){M b.2H(e)},9D:L(j){P e,p,l,k,n;e=12;p={};n=[];K(j){l=$S(j.43(";"));l.2L(L(o){1B(P m 1I J.T){e=1k 4x("^"+m.6k().2o(/\\-/,"\\\\-")+"\\\\s*:\\\\s*([^;]+)$","i").6p(o.41());K(e){2b(g.3k(J.T[m])){1f"7b":p[m]=e[1].6l();1g;1f"5w":p[m]=3H(e[1]);1g;2h:p[m]=e[1].41()}}}},J)}17{1B(k 1I J.N){e=J.N[k];2b(g.3k(J.T[k.3v()])){1f"7b":e=e.5u().6l();1g;1f"5w":e=3H(e);1g;2h:1g}p[k.3v()]=e}}M p}};$S(1c).1t("4H",L(){h.1y()});M h})(64);',62,1095,'|||||||||||||||||||||||||||||||||||||||||||||this|if|function|return|options||var|width|height|mjs|_o|false|j21|self|top|left||||null|true||||else|z7|j6|window|j29|document|bottom|right|case|break|t22|z47|zoom|new|position|z4|hint|stop|j24|z1|px|Math|je1|opacity|length|auto|click|start|style|j30|for|undefined|state|j6Prop|t25|j17|id|in|hidden|thumb|ready|0px|hide|FX|j5|mouseover|absolute|j32|call|extend|display|src|show|margin|arguments||j7|100|index|body||href||block|t23|appendChild|switch|initializeOn|t26|test|z6|title|default|t27|j2|byTag|border|overflow|padding|replace|trident|zIndex|z3|group|j27|j16|j23|visibility|parentNode|load|touchScreen|hotspots|mouseout|defined|je2|filter|doc|size|restore|firstChild|prototype|rightClick|j14|type|className|MagicThumb|styles|try|params|t16|t30|toLowerCase|img|update|prefix|none|duration||||||content|fullScreen||||zoomPosition|has|expand|DIV|catch|Transition|match|Element|thumbs|selectorsChange|j1|j8|version|z30|parseInt|delete|parent|trident4|zoomWidth|z2|min|j22|webkit|while|selectors|detach|rel|removeChild|forEach|expanded|box|zoomHeight|hCaption|parseFloat|max|createElement|now|captionText|init|inz30|selectorsClass|typeof|zooms|cursor|backCompat|fps|expandSize|tagName|screen|onComplete|selectorsEffect|J_TYPE||j26|hintText|split|getDoc|capable|event|push|instanceof|fit|visible|transition|j3|background|indexOf|disableZoom|Class|j19s|_cleanup|z21|constructor|z44|engine|J_UUID|linear|z42|j9|z43Bind|clicked|layout|z28|mt_vml_|j33|RegExp|scrollTop|wrapper|timer|apply|getTarget|expandEffect|on|thumbnail|t28|domready|t31|win|touchend|getRelated|300|opacityReverse|padY|relative|hintPosition|scrPad|float|contains|z37|append|disableExpand|MagicZoomPlus|z38|z41||j13|nodeType|items|getButton|slide|cbs|Out|hasOwnProperty|center|divTag|t15|showLoading|clearTimeout|div|Array|onload|showTitle|scrollLeft|image|original|prevItem|createTextNode|array|z34|link|inner|fade|kill|hasChild|toString|z9|number|sizing|requestAnimationFrame|presto|ieBack|storage|padX|_tmpp|selector|In|continue|round|css3Transformations|mode|offset|paddingBottom|onStart|initMouseEvent|slideshowEffect|pow|hintVisible|paddingRight|loading|paddingLeft|onready|t29|magicthumb|gd56f7fsgd|pause|dragMode||MagicZoom|paddingTop|t14|magicJS|activate|restoreSpeed|isNaN|captionPosition|slideshowLoop|unload|borderWidth|alwaysShowZoom|zoomDistance|uninitialized|setTimeout|render|200|busy|readyState|dashize|j18|Doc|keepThumbnail|getElementsByTagName|exec|easing|complete|swap|pad|mouseup|cloneNode|buttons|z29|static|setupHint|changeContent|rev|touchstart|shift|expandTrigger|touch|j10|z14|t13|z18|zoomAlign|lang|span|z13|splice|refresh|z45|backgroundColor|z43|j19|activatedEx|z24|z48|100000px|z35|J_EUID|entireImage|z36|forceAnimation|css3Animation|string||hintClass|updating|t32|250|_unbind|boolean|calc|t10|restoreEffect|vertical|getElementsByClassName|_timer|throw|events|currentStyle|10000|set|onBeforeRender|close|enabled|replaceChild|Ff|loadingOpacity|z33|9_|loadingMsg|platform|class|innerHTML|random|newImg|titleSource|inline|floor|String|z0|z10|hintOpacity|ieMode|speed|z11|initLeftPos|_handlers|onerror|naturalWidth|error|abort|features|holder|found|effect|400|to|implement|dissolve|500|not|MagicJS|IMG|dblclick|zoomViewHeight|documentElement|smoothing|pounce|defaults|selectorsEffectSpeed|PFX|initTopPos|MagicZoomPup|ddx|ddy|compatMode|hoverTimer|getStorage|j31|clickToActivate|lastSelector|outline|Right|screenPadding|_event_prefix_|callee|Left|swapTimer|cancelAnimationFrame|Top|Bottom|selectorsMouseoverDelay|item|namespaces|previous|next|join|ms|toggle|_deprecated|expandSpeed|_lang|expandPosition|styleSheets|contextmenu|color|hover|innerWidth|changedTouches|identifier|button|createEvent|ts|lastTap|150|mzParams|targetTouches|innerHeight|pointer|Plus|media|panZoom||theme_mac|el_arr|toggleMZ|onabort|query|mousemove|backgroundOpacity|javascript|backgroundSpeed|expandAlign|borderBottomWidth|nWidth|initialize|borderTopWidth|external|element|horizontal|clickToInitialize|reverse|t12|slideshowSpeed|overlapBox|tl|t11|ratio|Zoom|z23|custom|z20|J_EXTENDED|loadingPositionX|_event_add_|t18|z26|loadingPositionY|uuid|z1Holder|preventDefault|_z37|thumbChange|onErrorHandler|z15|styleFloat|big|out|shadow|defaultView|t17|Function|hspace|vspace|ceil|preservePosition|mousedown|resize|getBox|moveOnClick|clickToDeactivate|j12|gecko|request|ufx|keydown|_event_del_|construct|parseExOptions|head|z16|Event|smoothingSpeed|1000|j15|IFRAME|prevent||5001|t6|rect|borderLeftWidth|HTMLElement|je3|caller|buttonsPosition|restoreTrigger|destroy|offsetHeight|Slide|loop|navigator|url|tc|z46|PI|stopAnimation|cos|setupContent|tr|captionSource|5000|open|textAlign|loopBind|10000px|linkTarget|startTime|touches|z27|v4|blur|onKey|900|z39|localStorage|quadIn|errorEventName|t21|z25|changeEventName|unselectable|move|preloadSelectorsSmall|captionHeight|add|backIn|insertBefore|z31|keyboardCtrl|charAt|raiseEvent|concat|z32|documentMode|chrome|Image|preloadSelectorsBig||t4|touchmove|captionWidth||keyCode|cubicIn|keyboard|compareDocumentPosition||inherit|Date|addEventListener|DXImageTransform|magiczoom||transform|buttonsDisplay|getComputedStyle|change|nativize|mac|toArray|Microsoft|1px|setProps|UUID|getBoundingClientRect|relatedTarget|onError|which|sineIn|Alpha|Width|t5|cancelBubble|opera|fitZoomWindow|transparent|z17|t20|textnode|backgroundPosition|zoomFade|alt|date|z19|x7|phone|ig|zoomWindowEffect|CancelFullScreen|glow|cancelFullScreen|captionSpeed|expoIn|cancel|ios|setLang|backcompat|requestFullScreen||cbHover|cbClick||nHeight|naturalHeight|sMagicZoom|Loading|interval|v2|isReady|420|j28|xpath|z8|android||mask|t19|fill|align|_bind|roundCss|preload|t7|buttonNext|buttonPrevious|disable|t8|buttonClose|offsetWidth|mozCancelAnimationFrame|back|bounceIn|enclose|entire|object|Webkit|Moz|Khtml|expandTriggerDelay|wrap|curLeft|webkit419|elasticIn|gecko181|drag|dispatchEvent|XMLHttpRequest|hone|styles_arr|fontWeight|charCodeAt|adjBorder|fontFamily|zoomFadeOutSpeed|z22|fromCharCode|moz|com|zoomFadeInSpeed|j20|toFloat|urn|schemas|microsoft|fontSize|101|mobile|DocumentTouch|od|behavior|Tahoma|isFinite|abs||backgroundImage|ip|VML|vml|magicthumb_ie_ex|borderRightWidth|stopPropagation|map|cssClass|t1|t2|finishTime|pageX|presto925|clientX|pageY|childNodes|iframe|clientY|DOMElement|clientWidth|scrollWidth|html|offsetParent|offsetTop|pageYOffset|innerText|offsetLeft|clientHeight|returnValue|pageXOffset|clientTop|byClass|clientLeft|scrollHeight|symbian|lge|kindle|maemo|midp|mmp|iris|iemobile|compal|elaine|fennec|hiptop|netfront|ob|target|psp|treo|up|vodafone|pocket|plucker|palm|os||ixi|re|blazer|blackberry||regexp|KeyEvent|slice|getTime|getElementById|KeyboardEvent|UIEvent|exists|collection|Object|MouseEvent|addCSS|insertRule|ontouchstart|querySelector|tablet|avantgo|bada|runtime|air|toUpperCase|setInterval|userAgent|evaluate|wap|windows|192|419|191|190|181|525|postMessage|211|210|msPerformance|performance|khtml|fullscreenchange|hasLayout|cssFloat|filters|progid|setAttribute|getPropertyValue|j4|fullscreenerror|webkitIsFullScreen|FullScreen|RequestFullScreen|220|260|unknown|taintEnabled|webos|linux|other|WebKitPoint|mozInnerScreenY|xda|xiino|ActiveXObject|getBoxObjectFor|mozRequestAnimationFrame|webkitRequestAnimationFrame|animationName|AnimationName|270|applicationCache|Transform|webkitCancelRequestAnimationFrame|oRequestAnimationFrame|msRequestAnimationFrame|oCancelAnimationFrame|msCancelAnimationFrame|j11|initializing|imageSize|swapImage|Previous|MagicThumbHint|Expand|000000|_self|srcElement|Close|bounce|expo|elastic|cubic|sine|quad|10001|g502b3d0|coords|currentTarget|00001|ccc|MagicZoomLoading|nextSibling|009|dir|temporary|rc24|magic|BackgroundImageCache|rtl|execCommand|mt|loader|_blank|autohide|beforeEnd|insertAdjacentHTML|stroked|tile|cbhover|zoomItem|MagicZoomPlusHint|magiczoomplus|metaKey|ctrlKey|fixed|lef|cssText|owningElement||getAttributeNode|getAttribute|lt|amp|middle|clickTo|caption|9999|sort|createStyleSheet|repeat|no|111|backgroundRepeat|3px|Next|deactivate|source|curFrame|clearInterval|sineOut|preserve|text|DOMContentLoaded|Invalid|doScroll|lastChild|small|msg|delay|always|distance|MagicZoomHeader|elasticOut|slideOut|slideIn|attachEvent|bounceOut|MagicZoomHint|backOut|toElement|fromElement|expoOut|quadOut|618|cubicOut|removeEventListener|Magic|MagicZoomBigImageCont|10002|getXY|textDecoration|selectstart|createEventObject|trident900|MagicBoxGlow|frameBorder|MagicBoxShadow|initEvent|detachEvent|eventType|hand|_new|select|fireEvent|480|user|z12|MozUserSelect|highlight|tap|callout|loaded'.split('|'),0,{}))

/*


   Magic Scroll v1.0.24 
   Copyright 2013 Magic Toolbox
   Buy a license: www.magictoolbox.com/magicscroll/
   License agreement: http://www.magictoolbox.com/license/


*/
eval(function(m,a,g,i,c,k){c=function(e){return(e<a?'':c(parseInt(e/a)))+((e=e%a)>35?String.fromCharCode(e+29):e.toString(36))};if(!''.replace(/^/,String)){while(g--){k[c(g)]=i[g]||c(g)}i=[function(e){return k[e]}];c=function(){return'\\w+'};g=1};while(g--){if(i[g]){m=m.replace(new RegExp('\\b'+c(g)+'\\b','g'),i[g])}}return m}('(L(){N(W.44){M}P b={3v:"cb.7.2",8f:0,4N:{},$4Z:L(d){M(d.$2i||(d.$2i=++a.8f))},5I:L(d){M(a.4N[d]||(a.4N[d]={}))},$F:L(){},$1f:L(){M 1f},1B:L(d){M(2h!=d)},c7:L(d){M!!(d)},1n:L(d){N(!a.1B(d)){M 1f}N(d.$2K){M d.$2K}N(!!d.3y){N(1==d.3y){M"36"}N(3==d.3y){M"8b"}}N(d.1k&&d.1a){M"9z"}N(d.1k&&d.5P){M"1G"}N((d 3i W.c6||d 3i W.6u)&&d.3g===a.1W){M"27"}N(d 3i W.3R){M"3h"}N(d 3i W.6u){M"L"}N(d 3i W.7F){M"2I"}N(a.V.2g){N(a.1B(d.8Q)){M"3U"}}1j{N(d===W.3U||d.3g==W.6S||d.3g==W.c5||d.3g==W.c4||d.3g==W.cp||d.3g==W.cr){M"3U"}}N(d 3i W.8e){M"7S"}N(d 3i W.7t){M"cl"}N(d===W){M"W"}N(d===15){M"15"}M 3L(d)},1h:L(m,j){N(!(m 3i W.3R)){m=[m]}1o(P h=0,e=m.1k;h<e;h++){N(!a.1B(m)){2c}1o(P g 1D(j||{})){2S{m[h][g]=j[g]}3w(d){}}}M m[0]},5J:L(j,h){N(!(j 3i W.3R)){j=[j]}1o(P g=0,d=j.1k;g<d;g++){N(!a.1B(j[g])){2c}N(!j[g].1T){2c}1o(P e 1D(h||{})){N(!j[g].1T[e]){j[g].1T[e]=h[e]}}}M j[0]},89:L(g,e){N(!a.1B(g)){M g}1o(P d 1D(e||{})){N(!g[d]){g[d]=e[d]}}M g},$2S:L(){1o(P g=0,d=1G.1k;g<d;g++){2S{M 1G[g]()}3w(h){}}M 1e},$A:L(g){N(!a.1B(g)){M $R([])}N(g.8g){M $R(g.8g())}N(g.1a){P e=g.1k||0,d=1r 3R(e);3d(e--){d[e]=g[e]}M $R(d)}M $R(3R.1T.bu.2e(g))},4x:L(){M 1r 8e().bI()},4w:L(j){P g;2U(a.1n(j)){1q"33":g={};1o(P h 1D j){g[h]=a.4w(j[h])}1C;1q"3h":g=[];1o(P e=0,d=j.1k;e<d;e++){g[e]=a.4w(j[e])}1C;4m:M j}M a.$(g)},$:L(e){N(!a.1B(e)){M 1e}N(e.$5u){M e}2U(a.1n(e)){1q"3h":e=a.89(e,a.1h(a.3R,{$5u:a.$F}));e.1u=e.7J;M e;1C;1q"2I":P d=15.bS(e);N(a.1B(d)){M a.$(d)}M 1e;1C;1q"W":1q"15":a.$4Z(e);e=a.1h(e,a.48);1C;1q"36":a.$4Z(e);e=a.1h(e,a.1P);1C;1q"3U":e=a.1h(e,a.6S);1C;1q"8b":M e;1C;1q"L":1q"3h":1q"7S":4m:1C}M a.1h(e,{$5u:a.$F})},$1r:L(d,g,e){M $R(a.5s.72(d)).6v(g||{}).1s(e||{})},bM:L(e){N(15.6w&&15.6w.1k){15.6w[0].dr(e,0)}1j{P d=$R(15.72("25"));d.dj(e);15.2Y("6g")[0].2W(d)}}};P a=b;W.44=b;W.$R=b.$;a.3R={$2K:"3h",4l:L(h,j){P d=K.1k;1o(P e=K.1k,g=(j<0)?1w.7b(0,e+j):j||0;g<e;g++){N(K[g]===h){M g}}M-1},1U:L(d,e){M K.4l(d,e)!=-1},7J:L(d,h){1o(P g=0,e=K.1k;g<e;g++){N(g 1D K){d.2e(h,K[g],g,K)}}},4Y:L(d,m){P j=[];1o(P h=0,e=K.1k;h<e;h++){N(h 1D K){P g=K[h];N(d.2e(m,K[h],h,K)){j.1J(g)}}}M j},76:L(d,j){P h=[];1o(P g=0,e=K.1k;g<e;g++){N(g 1D K){h[g]=d.2e(j,K[g],g,K)}}M h}};a.5J(7F,{$2K:"2I",6d:L(){M K.3X(/^\\s+|\\s+$/g,"")},cT:L(d,e){M(e||1f)?(K.5n()===d.5n()):(K.2z().5n()===d.2z().5n())},2O:L(){M K.3X(/-\\D/g,L(d){M d.5k(1).ai()})},6q:L(){M K.3X(/[A-Z]/g,L(d){M("-"+d.5k(0).2z())})},3C:L(d){M 13(K,d||10)},ag:L(){M 6I(K)},ar:L(){M!K.3X(/12/i,"").6d()},6R:L(e,d){d=d||"";M(d+K+d).4l(d+e+d)>-1}});b.5J(6u,{$2K:"L",1d:L(){P e=a.$A(1G),d=K,g=e.3Z();M L(){M d.3B(g||1e,e.7L(a.$A(1G)))}},4Q:L(){P e=a.$A(1G),d=K,g=e.3Z();M L(h){M d.3B(g||1e,$R([h||W.3U]).7L(e))}},2v:L(){P e=a.$A(1G),d=K,g=e.3Z();M W.ak(L(){M d.3B(d,e)},g||0)},7A:L(){P e=a.$A(1G),d=K;M L(){M d.2v.3B(d,e)}},7K:L(){P e=a.$A(1G),d=K,g=e.3Z();M W.aj(L(){M d.3B(d,e)},g||0)}});P c=6z.9J.2z();a.V={5o:{8u:!!(15.9L),9N:!!(W.9I),6h:!!(15.9H)},9D:L(){M"9Y"1D W||(W.7U&&15 3i 7U)}(),al:c.5p(/8x|bo|bq|br\\/|az|aM|aU|aW|aO|aN|aP|8L(8B|8V|ad)|b0|cO|bX |bR|ab|au|cU|8P m(af|1D)i|aa( a9)?|7P|p(a4|am)\\/|a3|9O|9Z|bb|bc|bp\\.(V|bm)|bh|bg|bk (ce|7P)|aH|aI/)?12:1f,3b:(W.8P)?"8C":!!(W.aA)?"2g":(2h!=15.aB||1e!=W.aY)?"6p":(1e!=W.b9||!6z.aR)?"3m":"aQ",3v:"",6c:0,8N:c.5p(/8L(?:ad|8V|8B)/)?"aT":(c.5p(/(?:aX|8x)/)||6z.8N.5p(/aL|6J|aC/i)||["aD"])[0].2z(),5r:15.5g&&"8y"==15.5g.2z(),35:L(){M(15.5g&&"8y"==15.5g.2z())?15.2w:15.6W},47:W.47||W.aE||W.aF||W.aK||W.aJ||2h,5O:W.5O||W.8w||W.8w||W.aG||W.aZ||W.bj||2h,2A:1f,4n:L(){N(a.V.2A){M}a.V.2A=12;a.2w=$R(15.2w);a.6J=$R(W);(L(){a.V.4j={34:1f,1S:""};N(3L 15.2w.25.91!=="2h"){a.V.4j.34=12}1j{P g="8A 8E O 5z 8D".37(" ");1o(P e=0,d=g.1k;e<d;e++){a.V.4j.1S=g[e];N(3L 15.2w.25[a.V.4j.1S+"bi"]!=="2h"){a.V.4j.34=12;1C}}}})();(L(){a.V.5d={34:1f,1S:""};N(3L 15.2w.25.bl!=="2h"){a.V.5d.34=12}1j{P g="8A 8E O 5z 8D".37(" ");1o(P e=0,d=g.1k;e<d;e++){a.V.5d.1S=g[e];N(3L 15.2w.25[a.V.5d.1S+"bn"]!=="2h"){a.V.5d.34=12;1C}}}})();$R(15).8i("3E")}};(L(){L d(){M!!(1G.5P.7e)}a.V.3v=("8C"==a.V.3b)?!!(15.6g)?be:!!(W.b5)?b6:!!(W.8l)?b4:(a.V.5o.6h)?b3:((d())?b1:((15.4G)?b2:8m)):("2g"==a.V.3b)?!!(W.b7||W.b8)?8o:!!(W.8v&&W.bd)?6:((W.8v)?5:4):("3m"==a.V.3b)?((a.V.5o.8u)?((a.V.5o.6h)?ba:7M):bs):("6p"==a.V.3b)?!!(15.6g)?8m:!!15.4u?9T:!!(W.8l)?9Q:((15.4G)?9V:9W):"";a.V[a.V.3b]=a.V[a.V.3b+a.V.3v]=12;N(W.8k){a.V.8k=12}a.V.6c=(!a.V.2g)?0:(15.5S)?15.5S:L(){P e=0;N(a.V.5r){M 5}2U(a.V.3v){1q 4:e=6;1C;1q 5:e=7;1C;1q 6:e=8;1C;1q 8o:e=9;1C}M e}()})();(L(){a.V.2j={34:1f,5m:L(){M 1f},7d:L(){},8s:L(){},8p:"",8t:"",1S:""};N(3L 15.8r!="2h"){a.V.2j.34=12}1j{P g="3m 9t o 5z 9X".37(" ");1o(P e=0,d=g.1k;e<d;e++){a.V.2j.1S=g[e];N(3L 15[a.V.2j.1S+"8q"]!="2h"){a.V.2j.34=12;1C}}}N(a.V.2j.34){a.V.2j.8p=a.V.2j.1S+"9P";a.V.2j.8t=a.V.2j.1S+"9G";a.V.2j.5m=L(){2U(K.1S){1q"":M 15.2j;1q"3m":M 15.9F;4m:M 15[K.1S+"9E"]}};a.V.2j.7d=L(h){M(K.1S==="")?h.8I():h[K.1S+"9C"]()};a.V.2j.8s=L(h){M(K.1S==="")?15.8r():15[K.1S+"8q"]()}}})();a.1P={4q:L(d){M K.3k.6R(d," ")},3t:L(d){N(d&&!K.4q(d)){K.3k+=(K.3k?" ":"")+d}M K},8F:L(d){d=d||".*";K.3k=K.3k.3X(1r 7t("(^|\\\\s)"+d+"(?:\\\\s|$)"),"$1").6d();M K},9M:L(d){M K.4q(d)?K.8F(d):K.3t(d)},18:L(g){g=(g=="4g"&&K.4O)?"6r":g.2O();P d=1e,e=1e;N(K.4O){d=K.4O[g]}1j{N(15.6k&&15.6k.8G){e=15.6k.8G(K,1e);d=e?e.a2([g.6q()]):1e}}N(!d){d=K.25[g]}N("1N"==g){M a.1B(d)?6I(d):1}N(/^(1I(8W|8U|8T|8X)an)|((1K|1g)(8W|8U|8T|8X))$/.4A(g)){d=13(d)?d:"ap"}M("1b"==d?1e:d)},2V:L(g,d){2S{N("1N"==g){K.4E(d);M K}1j{N("4g"==g){K.25[("2h"===3L(K.25.6r))?"as":"6r"]=d;M K}1j{N(a.V.4j&&/91/.4A(g)){}}}K.25[g.2O()]=d+(("97"==a.1n(d)&&!$R(["ah","3j"]).1U(g.2O()))?"31":"")}3w(h){}M K},1s:L(e){1o(P d 1D e){K.2V(d,e[d])}M K},6t:L(){P d={};a.$A(1G).1u(L(e){d[e]=K.18(e)},K);M d},4E:L(h,e){e=e||1f;h=6I(h);N(e){N(h==0){N("2l"!=K.25.2L){K.25.2L="2l"}}1j{N("4b"!=K.25.2L){K.25.2L="4b"}}}N(a.V.2g){N(!K.4O||!K.4O.a6){K.25.3j=1}2S{P g=K.a5.1a("7x.7j.90");g.5m=(1!=h);g.1N=h*2T}3w(d){K.25.4Y+=(1==h)?"":"8Y:7x.7j.90(5m=12,1N="+h*2T+")"}}K.25.1N=h;M K},6v:L(d){1o(P e 1D d){K.9l(e,""+d[e])}M K},4f:L(){M K.1s({3F:"2s",2L:"2l"})},2J:L(){M K.1s({3F:"30",2L:"4b"})},1p:L(){M{Q:K.7X,T:K.7Y}},5t:L(){M{Y:K.5F,14:K.5H}},ae:L(){P d=K,e={Y:0,14:0};do{e.14+=d.5H||0;e.Y+=d.5F||0;d=d.23}3d(d);M e},1X:L(){N(a.1B(15.6W.8Z)){P d=K.8Z(),g=$R(15).5t(),i=a.V.35();M{Y:d.Y+g.y-i.ac,14:d.14+g.x-i.aw}}P h=K,e=t=0;do{e+=h.av||0;t+=h.ao||0;h=h.9R}3d(h&&!(/^(?:2w|bf)$/i).4A(h.2F));M{Y:t,14:e}},dy:L(){P e=K.1X();P d=K.1p();M{Y:e.Y,1z:e.Y+d.T,14:e.14,1A:e.14+d.Q}},cR:L(g){2S{K.cS=g}3w(d){K.cQ=g}M K},3H:L(){M(K.23)?K.23.4X(K):K},6V:L(){a.$A(K.4i).1u(L(d){N(3==d.3y||8==d.3y){M}$R(d).6V()});K.3H();K.7N();N(K.$2i){a.4N[K.$2i]=1e;2P a.4N[K.$2i]}M 1e},28:L(g,e){e=e||"1z";P d=K.56;("Y"==e&&d)?K.54(g,d):K.2W(g);M K},3l:L(g,e){P d=$R(g).28(K,e);M K},74:L(d){K.28(d.23.5w(K,d));M K},cN:L(d){N(!(d=$R(d))){M 1f}M(K==d)?1f:(K.1U&&!(a.V.8J))?(K.1U(d)):(K.8R)?!!(K.8R(d)&16):a.$A(K.5V(d.2F)).1U(d)}};a.1P.52=a.1P.18;a.1P.4J=a.1P.1s;N(!W.1P){W.1P=a.$F;N(a.V.3b.3m){W.15.72("bt")}W.1P.1T=(a.V.3b.3m)?W["[[cZ.1T]]"]:{}}a.5J(W.1P,{$2K:"36"});a.48={1p:L(){N(a.V.d0||a.V.8J){M{Q:W.cY,T:W.cX}}M{Q:a.V.35().cV,T:a.V.35().cW}},5t:L(){M{x:W.cM||a.V.35().5H,y:W.cL||a.V.35().5F}},cB:L(){P d=K.1p();M{Q:1w.7b(a.V.35().cC,d.Q),T:1w.7b(a.V.35().9r,d.T)}}};a.1h(15,{$2K:"15"});a.1h(W,{$2K:"W"});a.1h([a.1P,a.48],{1x:L(h,e){P d=a.5I(K.$2i),g=d[h];N(2h!=e&&2h==g){g=d[h]=e}M(a.1B(g)?g:1e)},2D:L(g,e){P d=a.5I(K.$2i);d[g]=e;M K},6Q:L(e){P d=a.5I(K.$2i);2P d[e];M K}});N(!(W.6T&&W.6T.1T&&W.6T.1T.4G)){a.1h([a.1P,a.48],{4G:L(d){M a.$A(K.2Y("*")).4Y(L(h){2S{M(1==h.3y&&h.3k.6R(d," "))}3w(g){}})}})}a.1h([a.1P,a.48],{cD:L(){M K.4G(1G[0])},5V:L(){M K.2Y(1G[0])}});N(a.V.2j.34){a.1P.8I=L(){a.V.2j.7d(K)}}a.6S={$2K:"3U",1Z:L(){N(K.8M){K.8M()}1j{K.8Q=12}N(K.93){K.93()}1j{K.d2=1f}M K},7g:L(){P e,d;e=((/dn/i).4A(K.3K))?K.dp[0]:K;M(!a.1B(e))?{x:0,y:0}:{x:e.dm||e.dl+a.V.35().5H,y:e.dk||e.dq+a.V.35().5F}},dw:L(){P d=K.1m||K.dx;3d(d&&3==d.3y){d=d.23}M d},dv:L(){P e=1e;2U(K.3K){1q"4U":e=K.8O||K.du;1C;1q"4R":e=K.8O||K.dt;1C;4m:M e}2S{3d(e&&3==e.3y){e=e.23}}3w(d){e=1e}M e},di:L(){N(!K.8j&&K.5G!==2h){M(K.5G&1?1:(K.5G&2?3:(K.5G&4?2:0)))}M K.8j}};a.5y="92";a.55="d8";a.40="";N(!15.92){a.5y="d5";a.55="d3";a.40="6O"}a.1h([a.1P,a.48],{2y:L(h,g){P j=("3E"==h)?1f:12,e=K.1x("4c",{});e[h]=e[h]||{};N(e[h].5K(g.$2b)){M K}N(!g.$2b){g.$2b=1w.5v(1w.5D()*a.4x())}P d=K,i=L(l){M g.2e(d)};N("3E"==h){N(a.V.2A){g.2e(K);M K}}N(j){i=L(l){l=a.1h(l||W.e,{$2K:"3U"});M g.2e(d,$R(l))};K[a.5y](a.40+h,i,1f)}e[h][g.$2b]=i;M K},5Z:L(h){P j=("3E"==h)?1f:12,e=K.1x("4c");N(!e||!e[h]){M K}P i=e[h],g=1G[1]||1e;N(h&&!g){1o(P d 1D i){N(!i.5K(d)){2c}K.5Z(h,d)}M K}g=("L"==a.1n(g))?g.$2b:g;N(!i.5K(g)){M K}N("3E"==h){j=1f}N(j){K[a.55](a.40+h,i[g],1f)}2P i[g];M K},8i:L(i,g){P n=("3E"==i)?1f:12,m=K,l;N(!n){P h=K.1x("4c");N(!h||!h[i]){M K}P j=h[i];1o(P d 1D j){N(!j.5K(d)){2c}j[d].2e(K)}M K}N(m===15&&15.5L&&!m.7O){m=15.6W}N(15.5L){l=15.5L(i);l.df(g,12,12)}1j{l=15.dg();l.de=i}N(15.5L){m.7O(l)}1j{m.dc("6O"+g,l)}M l},7N:L(){P d=K.1x("4c");N(!d){M K}1o(P e 1D d){K.5Z(e)}K.6Q("4c");M K}});(L(){N("3T"===15.4u){M a.V.4n.2v(1)}N(a.V.3m&&a.V.3v<7M){(L(){($R(["3A","3T"]).1U(15.4u))?a.V.4n():1G.5P.2v(50)})()}1j{N(a.V.2g&&a.V.6c<9&&W==Y){(L(){(a.$2S(L(){a.V.35().bP("14");M 12}))?a.V.4n():1G.5P.2v(50)})()}1j{$R(15).2y("9u",a.V.4n);$R(W).2y("2R",a.V.4n)}}})();a.1W=L(){P i=1e,e=a.$A(1G);N("27"==a.1n(e[0])){i=e.3Z()}P d=L(){1o(P n 1D K){K[n]=a.4w(K[n])}N(K.3g.$2n){K.$2n={};P q=K.3g.$2n;1o(P o 1D q){P l=q[o];2U(a.1n(l)){1q"L":K.$2n[o]=a.1W.7T(K,l);1C;1q"33":K.$2n[o]=a.4w(l);1C;1q"3h":K.$2n[o]=a.4w(l);1C}}}P j=(K.2d)?K.2d.3B(K,1G):K;2P K.7e;M j};N(!d.1T.2d){d.1T.2d=a.$F}N(i){P h=L(){};h.1T=i.1T;d.1T=1r h;d.$2n={};1o(P g 1D i.1T){d.$2n[g]=i.1T[g]}}1j{d.$2n=1e}d.3g=a.1W;d.1T.3g=d;a.1h(d.1T,e[0]);a.1h(d,{$2K:"27"});M d};b.1W.7T=L(d,e){M L(){P h=K.7e;P g=e.3B(d,1G);M g}};a.6J=$R(W);a.5s=$R(15)})();(L(b){N(!b){4p"5c 5b 5a";M}N(b.22){M}P a=b.$;b.22=1r b.1W({17:{3Q:60,2H:6y,3N:L(c){M-(1w.6Y(1w.78*c)-1)/2},7V:b.$F,5R:b.$F,7s:b.$F,7H:b.$F,5M:1f,7I:12},2X:1e,2d:L(d,c){K.2Q=a(d);K.17=b.1h(K.17,c);K.3q=1f},1L:L(c){K.2X=c;K.bV=0;K.bU=0;K.6M=b.4x();K.7C=K.6M+K.17.2H;K.6N=K.2E.1d(K);K.17.7V.2e();N(!K.17.5M&&b.V.47){K.3q=b.V.47.2e(W,K.6N)}1j{K.3q=K.2E.1d(K).7K(1w.3c(7q/K.17.3Q))}M K},6L:L(){N(K.3q){N(!K.17.5M&&b.V.47&&b.V.5O){b.V.5O.2e(W,K.3q)}1j{bT(K.3q)}K.3q=1f}},1Z:L(c){c=b.1B(c)?c:1f;K.6L();N(c){K.4r(1);K.17.5R.2v(10)}M K},6X:L(e,d,c){M(d-e)*c+e},2E:L(){P d=b.4x();N(d>=K.7C){K.6L();K.4r(1);K.17.5R.2v(10);M K}P c=K.17.3N((d-K.6M)/K.17.2H);N(!K.17.5M&&b.V.47){K.3q=b.V.47.2e(W,K.6N)}K.4r(c)},4r:L(c){P d={};1o(P e 1D K.2X){N("1N"===e){d[e]=1w.3c(K.6X(K.2X[e][0],K.2X[e][1],c)*2T)/2T}1j{d[e]=K.6X(K.2X[e][0],K.2X[e][1],c);N(K.17.7I){d[e]=1w.3c(d[e])}}}K.17.7s(d);K.4H(d);K.17.7H(d)},4H:L(c){M K.2Q.1s(c)}});b.22.3o={bx:L(c){M c},6Z:L(c){M-(1w.6Y(1w.78*c)-1)/2},bw:L(c){M 1-b.22.3o.6Z(1-c)},7G:L(c){M 1w.4k(2,8*(c-1))},bv:L(c){M 1-b.22.3o.7G(1-c)},7W:L(c){M 1w.4k(c,2)},bA:L(c){M 1-b.22.3o.7W(1-c)},8c:L(c){M 1w.4k(c,3)},bB:L(c){M 1-b.22.3o.8c(1-c)},8a:L(d,c){c=c||1.bH;M 1w.4k(d,2)*((c+1)*d-c)},bF:L(d,c){M 1-b.22.3o.8a(1-d)},8h:L(d,c){c=c||[];M 1w.4k(2,10*--d)*1w.6Y(20*d*1w.78*(c[0]||1)/3)},bY:L(d,c){M 1-b.22.3o.8h(1-d,c)},88:L(e){1o(P d=0,c=1;1;d+=c,c/=2){N(e>=(7-4*d)/11){M c*c-1w.4k((11-6*d-11*e)/4,2)}}},cm:L(c){M 1-b.22.3o.88(1-c)},2s:L(c){M 0}}})(44);(L(a){N(!a){4p"5c 5b 5a";M}N(!a.22){4p"5c.22 5b 5a";M}N(a.22.87){M}P b=a.$;a.22.87=1r a.1W(a.22,{17:{5E:"7Z"},2d:L(d,c){K.2Q=$R(d);K.17=a.1h(K.$2n.17,K.17);K.$2n.2d(d,c);K.X=K.2Q.1x("80:X");K.X=K.X||a.$1r("4h").1s(a.1h(K.2Q.6t("1g-Y","1g-14","1g-1A","1g-1z","1t","Y","4g"),{46:"2l"})).74(K.2Q);K.2Q.2D("80:X",K.X).1s({1g:0})},7Z:L(){K.1g="1g-Y";K.3s="T";K.4t=K.2Q.7Y},79:L(c){K.1g="1g-"+(c||"14");K.3s="Q";K.4t=K.2Q.7X},1A:L(){K.79()},14:L(){K.79("1A")},1L:L(e,i){K[i||K.17.5E]();P h=K.2Q.18(K.1g).3C(),g=K.X.18(K.3s).3C(),c={},j={},d;c[K.1g]=[h,0],c[K.3s]=[0,K.4t],j[K.1g]=[h,-K.4t],j[K.3s]=[g,0];2U(e){1q"1D":d=c;1C;1q"82":d=j;1C;1q"7a":d=(0==g)?c:j;1C}K.$2n.1L(d);M K},4H:L(c){K.2Q.2V(K.1g,c[K.1g]);K.X.2V(K.3s,c[K.3s]);M K},cu:L(c){M K.1L("1D",c)},cs:L(c){M K.1L("82",c)},4f:L(d){K[d||K.17.5E]();P c={};c[K.3s]=0,c[K.1g]=-K.4t;M K.4H(c)},2J:L(d){K[d||K.17.5E]();P c={};c[K.3s]=K.4t,c[K.1g]=0;M K.4H(c)},7a:L(c){M K.1L("7a",c)}})})(44);(L(b){N(!b){4p"5c 5b 5a";M}N(b.85){M}P a=b.$;b.85=1r b.1W(b.22,{2d:L(c,d){K.7c=c;K.17=b.1h(K.17,d);K.3q=1f},1L:L(c){K.$2n.1L([]);K.84=c;M K},4r:L(c){1o(P d=0;d<K.7c.1k;d++){K.2Q=a(K.7c[d]);K.2X=K.84[d];K.$2n.4r(c)}}})})(44);(L(a){N(!a){4p"5c 5b 5a";M}N(a.70){M}P b=a.$;a.70=L(d,e){P c=K.5e=a.$1r("2u",1e,{1t:"2C","z-2m":cc}).3t("cd");a.$(d).2y("4U",L(){c.3l(15.2w)});a.$(d).2y("4R",L(){c.3H()});a.$(d).2y("7r",L(l){P n=20,j=a.$(l).7g(),i=c.1p(),h=a.$(W).1p(),m=a.$(W).5t();L g(r,o,q){M(q<(r-o)/2)?q:((q>(r+o)/2)?(q-o):(r-o)/2)}c.1s({14:m.x+g(h.Q,i.Q+2*n,j.x-m.x)+n,Y:m.y+g(h.T,i.T+2*n,j.y-m.y)+n})});K.71(e)};a.70.1T.71=L(c){K.5e.56&&K.5e.4X(K.5e.56);K.5e.28(15.ca(c))}})(44);P 75=(L(d){P h=d.$;P b=d.1W({1O:{2t:[],4e:[],7w:{},2X:{},17:{},65:{},1b:1f,2q:{1R:"5f","27":"5f",Q:8K,T:8K,4W:"S",X:12,2H:7q,3N:d.22.3o.6Z,3Q:6y,"1a-Q":"4o","1a-T":"4o","1a-6m":"6l","1a-9d":"6n","z-2m":0,1c:"2s","-2M":1}},3S:1f,7v:L(){K.1O.2t=b.5C.5B();K.1O.4e=b.5x.5B()},2d:L(i){K.7v();K.1O.1b=12;K.68(i)},68:L(i){K.1O=d.1h(K.1O,i||{});K.17(K.1O.2q,12);K.43=d.$1r("4h",1e,{1t:"2C",Y:-c8,14:0,46:"2l",Q:1,T:1});K.S=d.$1r("4h",d.1h({"27":K.U("27")},K.1O.7w),d.1h(K.1O.2X,{1t:"5N","71-6m":"14"})).3l(K.43).3t(K.U("1R"));K.19=d.$A([]);d.1h([K.19],b.9e);K.1t=0;K.1c=1r b.5x(K,K.1O.4e);K.2t=1r b.5C(K,K.1O.2t)},5X:L(i){K.1O.2t=$R(K.1O.2t).4Y(L(j){M j!=K},i)},1a:L(i){M K.19[i]},U:L(j,l){P i=d.1B(K.1O.65[j])?K.U(K.1O.65[j],l):d.1B(K.1O.17[j])?K.1O.17[j]:l,m={"1f":1f,"12":12};M d.1B(m[i])?m[i]:i},17:L(i,j){N(j){d.1h(i,K.1O.17)}d.1h(K.1O.17,i);M K},1R:L(i){M(K.U("1R")+"-"+i).2O()},1J:L(){P i=d.1n(1G[0]),j=1e;2U(i){1q"3h":1q"9z":d.$A(1G[0]).1u(L(l){N(d.1n(l)=="3h"){K.1J(l[0],l[1],l[2])}1j{K.1J(l)}},K);1C;1q"2I":j=d.$1r(1G[0],1G[1]||{},1G[2]||{});1q"36":j=j||$R(1G[0]);d.1h([j],b.3V);j.2D("5f",K);j.2D("2m",K.19.1k);j.4B();K.19.1J(j);K.1Y("1J",{1a:j});1C;4m:1C}M K},28:L(i){$R(i).2W(K.43);K.3S=12;N(K.1O.1b){K.42()}M K},3X:L(i){$R(i).23.5w(K.43,$R(i));K.3S=12;N(K.1O.1b){K.42()}M K},2J:L(){K.3I(K.U("Q"),K.U("T"));K.43.23.5w(K.S,K.43);K.1Y("7m-42");K.29("3D");M K},4f:L(){K.43.74(K.S);M K},42:L(){N(!K.3S){4p"ct co: cn: ci ch 68 cj ck 28 S 33 1D 4z 15"}K.S.2J();N(K.U("X")){K.X=K.S.2W(d.$1r("4h",{"27":K.1R("bZ")},{1t:"2C",46:"2l"}).3f(K.S.2p()))}1j{K.X=K.S}K.19.28(K.X);N(K.1O.1b){K.2J()}M K},3I:L(j,i){d.1n(j)=="33"||(j={Q:j,T:i});K.S.7o(j,1e,12);K.U("X")&&K.X.3f(K.S.2p())},29:L(i,j){j=d.1h({1m:"3u",1c:K.U("1c")},d.1h(j||{},d.1n(i)?(d.1n(i)=="33"?i:{1m:i}):{}));K.1t=K.1c.29(j);M K},1i:L(i,l,j){N(d.1n(i)=="2I"){i.37("31").1k>1&&(i=13(i.37("31")[0]));i.37("%").1k>1&&(i=13(1w.3c(l*i.37("%")[0]/2T)))}M j?i:13(i)},41:L(i,m,j){P l;N(d.1n(i)=="2I"){i.37("31").1k>1&&(i=13(i.37("31")[0]));i.37("%").1k>1&&(l=i.37("%")[0])&&(i=13(1w.3c(m*l/(2T-l))))}M j?i:13(i)},6a:L(i){i&&K.3S&&K.S.23.5w(i,K.S);M i||1e}});b.3V={3I:L(l){P j=K.1x("5f");K.1x("6H")&&K.3f(K.1x("6H"))||K.2D("6H",K.1p());P o=K.1p();P n=j.X.2p();P i=l&&l.Q||j.U("1a-Q");P m=l&&l.T||j.U("1a-T");N(i=="4o"&&m=="4o"){i=n.Q;m=o.T*i/o.Q;N(m>n.T){m=n.T;i=o.Q*m/o.T}}1j{i=i=="1b"?n.Q:i=="1F"?o.Q:i;m=m=="1b"?n.T:m=="1F"?o.T:m;i=i=="4o"?o.Q*m/o.T:i;m=m=="4o"?o.T*i/o.Q:m}N(d.1B(l)&&d.1n(l)!="33"){i=j.1i(l||l,i,12);m=j.1i(l||l,m,12)}i=1w.3c(i);m=1w.3c(m);K.3f(i,m);$R(b.3V).1Y("1a-6i",{1a:K,Q:i,T:m});M K},45:L(o,r){P j=K.1x("5f");o=o||{Q:"30",T:"30"};o=d.1n(o)=="2I"?{Q:o,T:o}:o;r=r||j.X.2p();N(o.Q=="3P"){K.1s({"1g-14":"1b","1g-1A":"1b"})}1j{P i=13(K.1p().Q);P m=r.Q-i;P n=j.U("1a-6m");K.1s({"1g-14":n=="6l"?m/2:n=="14"?0:m,"1g-1A":n=="6l"?m/2:n=="1A"?0:m})}N(o.T=="3P"){K.1s({"1g-Y":"1b","1g-1z":"1b"})}1j{P q=13(K.1p().T);P l=r.T-q;P p=j.U("1a-9d");K.1s({"1g-Y":p=="6n"?l/2:p=="Y"?0:l,"1g-1z":p=="6n"?l/2:p=="1z"?0:l})}},5T:L(){P i=K.57();d.1h(i,b.3V);M i},2m:L(){M K.1x("2m")},4B:L(){K.1s({2L:"4b",3F:"30",1t:"5N",1N:1,Y:"1b",14:"1b","4g":"2s"});N(d.V.2g){K.1s({46:"2l"})}}};b.9e={28:L(i){d.$A(K).1u(L(j){N(d.1n(j)=="36"){K.2W(j)}},i)},1s:L(j,i){d.$A(K).1u(L(l){N(d.1n(l)=="36"){N(d.1n(K)=="L"){$R(l).1s(K.3B(l,i||[]))}1j{$R(l).1s(K)}}},j)},45:L(j,i){d.$A(K).1u(L(l){N(d.1n(l)=="36"){$R(l).45(K[0],K[1])}},[j,i])},3I:L(i){d.$A(K).1u(L(j){N(d.1n(j)=="36"){$R(j).3I(K[0])}},[i])},9A:L(){K.3I();K.45()},4B:L(){d.$A(K).1u(L(i){i.4B()})}};b.5x=d.1W({2d:L(i,j){K.S=i;K.4e=j;K.3M=1e;K.1M={}},29:L(i){N(!$R(K.4e).1U(i.1c)||!d.1B(b.3a[("-"+i.1c).2O()])){i.1c="2s"}N(!K.1M[i.1c]){K.1M[i.1c]=1r b.3a[("-"+i.1c).2O()](K.S)}K.1Z();N(!K.3M||K.1M[K.3M].3K!=K.1M[i.1c].3K){K.3M&&K.S.19.4B();K.1M[i.1c].5q()}K.3M=i.1c;M K.1M[i.1c].9f(i)},1Z:L(){K.3M&&K.1M[K.3M].1Z()}});b.3a=d.1W({3K:"2C",26:1f,2q:{},2R:d.$F,5q:d.$F,9s:d.$F,1Z:d.$F,2d:L(i){K.S=i;K.17({2H:K.S.U("2H"),3N:K.S.U("3N"),3Q:K.S.U("3Q")});K.17(K.2q);K.2R()},U:L(i,j){M K.S.U("1c-"+K.1R+"-"+i,j||1e)},17:L(j){P l={};1o(P i 1D j){l["1c-"+K.1R+"-"+i]=j[i]}M K.S.17(l,12)},1t:L(){M K.S.1t},9f:L(i){i.1m=K.1m(i.1m,K.1t(),K.S.U("-2M"),K.S.19.1k);N(K.26){i.1H=K.1H(i.1m,K.1t(),K.S.19.1k,i.1H||"1b")}N(K.26||K.1t()!=i.1m){K.29(d.1h({},i))}M i.1m},1m:L(m,i,l,j){N(!d.1B(m)){m="3u"}N(d.1n(m)=="2I"){N(9m(13(m))){2U(m){1q"49":1q"3M":m=j-l;1C;1q"1L":1q"3D":m=0;1C;1q"4C":m=i-l;1C;1q"3u":4m:m=i+l;1C}}1j{m=i+13(m)}}m=m%j;m<0&&(m+=K.U("2E")!="2c"?-m:j);M m},1H:L(p,i,m,o){N(K.U("2E")!="2c"){o=p<=i?"4C":"3u"}1j{N(!o||o=="1b"){P q=p-i,n=1w.by(q),j=m/2;N(n<=j&&q>0||n>j&&q<0){o="3u"}1j{o="4C"}}}M o}});d.1h(b.5x,{5B:L(){P i=[];1o(1c 1D b.3a){N(d.1n(b.3a[1c])=="27"&&!b.3a[1c].1T.2l){i.1J(1c.2z())}}M i}});b.5C=d.1W({2d:L(i,j){K.S=i;K.2t=j;K.1M={};$R(i).1E("7m-42",K.2R.1d(K))},2R:L(){d.$A(K.2t).1u(L(i){N(d.1B(b.3e[("-"+i).2O()])){K.1M[i]=1r b.3e[("-"+i).2O()](K.S)}},K)}});b.3e=d.1W({2q:{},2l:1f,2d:L(i){K.S=i;K.17(K.2q);K.2R()},U:L(i,j){M K.S.U("39-"+K.1R+"-"+i,j||1e)},17:L(j){P l={};1o(P i 1D j){l["39-"+K.1R+"-"+i]=j[i]}M K.S.17(l,12)},28:L(m,q,l,o){P j=K.h=$R(["Y","1z"]).1U(q);P i=K.S.X.2p();K.S.X.3f(j?1e:i.Q-l,j?i.T-l:1e);$R(["Y","14"]).1U(q)&&K.S.X.2V(q,K.S.X.1X(12)[q]+l);i=K.S.X.2p();P n=K.S.X.1X(12);m.3l(K.S.S).1s({Y:n.Y,14:n.14}).2V(j?"Y":"14",n[j?"Y":"14"]+($R(["Y","14"]).1U(q)?(0-l):i[j?"T":"Q"]));o||m.3f(j?i.Q:l,j?l:i.T)}});d.1h(b.5C,{5B:L(){P i=[];1o(39 1D b.3e){N(d.1n(b.3e[39])=="27"&&!b.3e[39].1T.2l){i.1J(39.6q().5A(1))}}M i}});h=L(){P j=d.$.3B(K,1G),i=d.1n(j);N(d.9j[i]){N(!j.1x){d.$4Z(j);j=d.1h(j,{1x:d.1P.1x,2D:d.1P.2D})}N(!j.1E){j=d.1h(j,d.6e)}}M j};W.$R=h;d.1h([d.1P,d.48],d.6e);d.$4s=L(i){P j=[];1o(k 1D i){N((i+"").5A(0,2)=="$J"){2c}j.1J(i[k])}M d.$A(j)};d.53={3J:2,bQ:2,81:2,86:2,bL:2,bK:2,cv:2,4U:2,4R:2,7r:2,cw:2,db:2,dd:2,d4:2,d6:2,d7:2,7n:2,ds:2,4B:2,cG:2,cF:2,2R:1,cH:1,cK:2,6i:1,7f:1,9u:1,cz:1,6P:1,6K:1};d.9j={15:12,36:12,"27":12,33:12};d.6e={1E:L(n,m,j){N(d.1n(n)=="3h"){$R(n).1u(K.1E.4Q(K,m,j));M K}N(!n||!m||d.1n(n)!="2I"||d.1n(m)!="L"){M K}N(n=="3E"&&d.V.2A){m.2e(K);M K}j=13(j||10);N(!m.$2b){m.$2b=1w.5v(1w.5D()*d.4x())}P l=K.1x("4S",{});l[n]||(l[n]={});l[n][j]||(l[n][j]={});l[n]["2G"]||(l[n]["2G"]={});N(l[n][j][m.$2b]){M K}N(l[n]["2G"][m.$2b]){K.5Q(n,m)}P i=K,o=L(p){M m.2e(i,$R(p))};N(d.53[n]&&!l[n]["L"]){N(d.53[n]==2){o=L(p){p=d.1h(p||W.e,{$2K:"3U"});M m.2e(i,$R(p))}}l[n]["L"]=L(p){i.1Y(n,p)};K[d.5y](d.40+n,l[n]["L"],1f)}l[n][j][m.$2b]=o;l[n]["2G"][m.$2b]=j;M K},1Y:L(j,m){2S{m=d.1h(m||{},{3K:j})}3w(l){}N(!j||d.1n(j)!="2I"){M K}P i=K.1x("4S",{});i[j]||(i[j]={});i[j]["2G"]||(i[j]["2G"]={});d.$4s(i[j]).1u(L(n){N(n!=i[j]["2G"]&&n!=i[j]["L"]){d.$4s(n).1u(L(o){o(K)},K)}},m)},5Q:L(m,l){N(!m||!l||d.1n(m)!="2I"||d.1n(l)!="L"){M K}N(!l.$2b){l.$2b=1w.5v(1w.5D()*d.4x())}P j=K.1x("4S",{});j[m]||(j[m]={});j[m]["2G"]||(j[m]["2G"]={});26=j[m]["2G"][l.$2b];j[m][26]||(j[m][26]={});N(26>=0&&j[m][26][l.$2b]){2P j[m][26][l.$2b];2P j[m]["2G"][l.$2b];N(d.$4s(j[m][26]).1k==0){2P j[m][26];N(d.53[m]&&d.$4s(j[m]).1k==0){P i=K;K[d.55](d.40+m,j[m]["L"],1f)}}}M K},aq:L(l){N(!l||d.1n(l)!="2I"){M K}P j=K.1x("4S",{});N(d.53[l]){P i=K;K[d.55](d.40+l,j[l]["L"],1f)}j[l]={}},98:L(l,j){P i=K.1x("4S",{});1o(t 1D i){N(j&&t!=j){2c}1o(26 1D i[t]){N(26=="2G"||26=="L"){2c}1o(f 1D i[t][26]){$R(l).1E(t,i[t][26][f],26)}}}M K},9g:L(m,l){N(1!==m.3y){M K}P j=K.1x("4c");N(!j){M K}1o(P i 1D j){N(l&&i!=l){2c}1o(P n 1D j[i]){$R(m).1E(i,j[i][n])}}M K}};d.V.1S=({6p:"-9t-",3m:"-3m-",2g:"-5z-"})[d.V.3b]||"";d.1h(d.1P,{3S:L(){P i=K;3d(i.23){N(i.2F=="9S"||i.2F=="9U"){M 12}i=i.23}M 1f},6C:d.1P.4E,4E:L(j,i){N(K.1x("6F")){N($R(K.1x("6G")).3S()){M K}}K.6C(j,i);$R(K.1x("6A",[])).1u(L(l){l.6C(j,i)});M K},6B:d.1P.2y,2y:L(j,i){N(K.1x("6F")){N($R(K.1x("6G")).3S()){M K}}K.6B(j,i);$R(K.1x("6A",[])).1u(L(l){l.6B(j,i)});M K},57:L(m,l){m==2h&&(m=12);l==2h&&(l=12);P n=$R(K.7D(m));N(n.$2i==K.$2i){n.$2i=1f;d.$4Z(n)}P i=d.$A(n.2Y("*"));i.1J(n);P j=d.$A(K.2Y("*"));j.1J(K);i.1u(L(p,o){p.2N="";N(!d.V.2g||d.5s.5S&&d.5s.5S>=9){$R(j[o]).98(p);$R(j[o]).9g(p)}N(l){$R(p).2D("6G",j[o]);$R(p).2D("6F",12);P q=$R(j[o]).1x("6A",[]);q.1J(p)}});M n},2p:L(){P i=K.1p();i.Q-=(13(K.18("1I-14-Q"))+13(K.18("1I-1A-Q"))+13(K.18("1K-14"))+13(K.18("1K-1A")));i.T-=(13(K.18("1I-Y-Q"))+13(K.18("1I-1z-Q"))+13(K.18("1K-Y"))+13(K.18("1K-1z")));M i},7o:L(j,l,i){N(d.1n(j)=="33"){l=j.T;j=j.Q}2U((d.V.2g&&d.V.5r)?"1I-3x":(K.18("3x-4W")||K.18(d.V.1S+"3x-4W"))){1q"1I-3x":j&&(j=j+13(K.18("1I-14-Q"))+13(K.18("1I-1A-Q")));l&&(l=l+13(K.18("1I-Y-Q"))+13(K.18("1I-1z-Q")));1q"1K-3x":j&&(j=j+13(K.18("1K-14"))+13(K.18("1K-1A")));l&&(l=l+13(K.18("1K-Y"))+13(K.18("1K-1z")))}M K.1s({Q:j,T:l})},3f:(d.V.2g&&d.V.5r)?(L(i,j){N(d.1n(i)!="33"){i={Q:i,T:j}}N(K.2F=="66"){i.Q&&(i.Q-=(13(K.18("1I-14-Q"))+13(K.18("1I-1A-Q"))));i.T&&(i.T-=(13(K.18("1I-Y-Q"))+13(K.18("1I-1z-Q"))))}M K.1s(i)}):(L(i,j){N(d.1n(i)=="33"){j=i.T,i=i.Q}2U(K.18("3x-4W")||K.18(d.V.1S+"3x-4W")){1q"aS-3x":i&&(i=i-13(K.18("1K-14"))-13(K.18("1K-1A")));j&&(j=j-13(K.18("1K-Y"))-13(K.18("1K-1z")));1q"1K-3x":i&&(i=i-13(K.18("1I-14-Q"))-13(K.18("1I-1A-Q")));j&&(j=j-13(K.18("1I-Y-Q"))-13(K.18("1I-1z-Q")))}M K.1s({Q:i,T:j})}),9B:d.1P.1X,1X:L(j,m){P n;N(j){P l=K;3d(l&&l.23&&(l=l.23)&&l!==15.2w&&!$R(["5N","2C","ay"]).1U($R(l).52("1t"))){}N(l!==15.2w){P i=l.1X();n=K.1X();n.Y-=i.Y;n.14-=i.14;n.Y-=13(l.18("1I-Y-Q"));n.14-=13(l.18("1I-14-Q"))}}n||(n=K.9B());N(m){n.Y=13(n.Y)-13(K.18("1g-Y"));n.14=13(n.14)-13(K.18("1g-14"))}M n},3H:L(){K.23.4X(K);M K},6v:L(i){1o(P j 1D i){N(j=="$5u"){2c}N(j=="27"){K.3t(""+i[j])}1j{K.9l(j,""+i[j])}}M K}});1w.6x=L(j,i){M 1w.5v(1w.5D()*(i-j+1))+j};d.1h(d.3R,{6x:L(){M K[1w.6x(0,K.1k-1)]}});d.1h(b,{3v:"${bz}"});b.3a.bD=d.1W(b.3a,{1R:"2C",5q:L(){K.S.19.1s({1t:"2C",Y:0,14:0,"z-2m":K.S.U("z-2m")+1,2L:"2l"});K.S.1a(K.S.1t).1s({2L:"4b","z-2m":K.S.U("z-2m")+2});K.S.19.9A()},29:L(i){K.S.1a(K.S.1t).1s({2L:"2l"});K.S.1a(i.1m).1s({2L:"4b"})}});b.3a.d1=d.1W(b.3a,{1R:"1l",3K:"1l",26:12,2q:{1H:"1A",2E:"2c","19-7y":3},2R:L(){K.S.1l=(L(i,j){j=d.1h({1m:"3u"},d.1h(j||{},d.1n(i)?(d.1n(i)=="33"?i:{1m:i}):{}));j.1m=K.1m(j.1m,K.1V(),1,K.32());j.1H=K.1H(j.1m,K.1V(),K.32(),j.1H||"1b");j.1m=j.1m+"31";j.4M=12;K.1Z();K.29(j);M K.S}).1d(K);K.5j=1f;K.4d=0;K.3Y=1f;K.2f=$R(["Y","1z"]).1U(K.U("1H"))?"Y":"14";K.1i=K.2f=="14"?"Q":"T";K.4L=$R(["Y","14"]).1U(K.U("1H"));K.X=d.$1r("2u")},5q:L(){P i=K.U("1H");N(i=="1A"){i="14"}N(i=="Y"||i=="1z"){i="2s"}K.S.19.1s({"4g":i});N(K.4L){K.S.19.1u(L(j){K.X.54(j,K.X.56)},K)}1j{K.S.19.28(K.X)}K.S.X.2W(K.X);K.X.1s({Q:i=="2s"?K.S.U("Q"):(d.V.9i?(9q-1):(K.S.19.1k*6U)),1t:"5N"});K.S.19.3I();K.S.19.45({Q:i=="2s"?"30":"3P",T:i=="2s"?"3P":"30"});N(d.V.2g){K.X.1s({"7k-7l":"aV"});K.S.19.1s({"7k-7l":"9h"})}K.3Y=1f;K.29({1m:K.S.1t,7u:12});K.4K("5h");$R(K.S).1E("1J",(L(o,n){P m=o.1a;m.1s({"4g":n});N(K.4L){K.X.54(m,K.S.19[m.2m()-1])}1j{N(K.S.19[m.2m()-1].9c){K.X.54(m,K.S.19[m.2m()-1].9c)}1j{K.X.2W(m)}}m.3I();m.45({Q:n=="2s"?"30":"3P",T:n=="2s"?"3P":"30"});N(d.V.2g){m.2V("7k-7l","9h")}N(K.4L){N(K.1V()>=m.1X(12,12)[K.2f]){P j=K.1V()+m.1p()[K.1i]+13(m.18("1g-"+K.2f))+13(m.18("1g-"+(K.2f=="Y"?"1z":"1A")));P p=(L(){M K.X.38.1X(12)[K.2f]+K.X.38.1p()[K.1i]+13(K.X.38.18("1g-"+(K.2f=="Y"?"1z":"1A")))}).1d(K);P l=(L(){M p()-K.S.X.1p()[K.1i]}).1d(K);K.1V(j>l()?l():j);K.S.1t++;K.4P();$R(K.S.1c).1Y("1l");K.4M()}}1j{K.4P();$R(K.S.1c).1Y("1l")}K.4K();K.S.2t.1M.1v&&K.S.2t.1M.1v.7p();K.X.1s({Q:n=="2s"?K.S.U("Q"):(d.V.9i?(9q-1):(K.S.19.1k*6U))})}).4Q(K,i));$R(K.S.1c).1Y("1l-2A")},9s:L(){K.4K("6o");K.1V(K.S.1a(K.S.1t).1X(12)[K.2f])},32:L(i){i=i||K.1i;K.3Y={Q:0,T:0};K.S.19.1u(L(l){P j=l.1p();P m={l:13(l.18("1g-14")),r:13(l.18("1g-1A")),t:13(l.18("1g-Y")),b:13(l.18("1g-1z"))};K.3Y.Q+=j.Q+m.l+m.r;K.3Y.T+=j.T+m.t+m.b},K);M i?K.3Y[i]:K.3Y},1V:L(i){N(d.1B(i)){K.S.X[("1l-"+K.2f).2O()]=i}M K.S.X[("1l-"+K.2f).2O()]},4P:L(o){P l,m=K.32(),p=(L(){M K.X.38.1X(12)[K.2f]+K.X.38.1p()[K.1i]+13(K.X.38.18("1g-"+(K.2f=="Y"?"1z":"1A")))}).1d(K),n=(L(){M p()-K.S.X.1p()[K.1i]}).1d(K),j=K.1V();d.1B(o)||(o=j);N(K.U("2E")=="9K"){K.49||(K.49=$R(K.S.1c).1Y.1d(K.S.1c,"at-4z-49"));K.1L||(K.1L=$R(K.S.1c).1Y.1d(K.S.1c,"at-4z-1L"));$R(K.S.1c).5Q("1l",K.49);$R(K.S.1c).5Q("1l",K.1L);(o>n())&&(o=(j<n()||o<p())?n():0);(o<0)&&(o=j>0?0:n());(o==n()||n()==0)&&$R(K.S.1c).1E("1l",K.49);o||$R(K.S.1c).1E("1l",K.1L);M o}3d((o<0?(j+m):o)>n()){K.X.2W(K.S.1a(K.4L?(K.S.19.1k-(K.4d%K.S.19.1k)-1):K.4d%K.S.19.1k).5T());K.4d++}N(o<0){o+=m;K.1V(K.1V()+m)}M o},4K:L(i){N(K.U("2E")!="2c"){M}i=i||"5h";K.1V(K.1V()%K.32());P l=(L(){M K.X.38.1X(12)[K.2f]+K.X.38.1p()[K.1i]+13(K.X.38.18("1g-"+(K.2f=="Y"?"1z":"1A")))}).1d(K),j=(L(){M l()-K.S.X.1p()[K.1i]}).1d(K);3d(K.4d>0&&j()-K.X.38.1p(12,12)[K.1i]>=K.1V()){K.X.4X(K.X.38);K.4d--}N(i=="5h"){K.4P()}1j{P j=K.32()-K.S.X.1p()[K.1i];1l<0&&(1l=0);1l>j&&(1l=j);K.1V(1l)}},29:L(l){P i=K.1V(),j=K.32();N(K.U("19-7y")>0){}N(d.1n(l.1m)=="97"){l.1m=K.X.4i[l.1m%K.S.19.1k].1X(12,12)[K.2f]}1j{l.1m=13(l.1m)}N(l.1m==i&&!l.7u){M}1j{N(K.U("2E")=="2c"){N(l.1m<i&&l.1H=="3u"){l.1m=l.1m+1w.96((i-l.1m)/j)*j}1j{N(l.1m>i&&l.1H=="4C"){l.1m=l.1m-1w.96((l.1m-i)/j)*j}}}}l.1m=K.4P(l.1m);K.9v(l.1m);N(l.7u){K.1V(l.1m);$R(K.S.1c).1Y("1l",l.e);K.1Z.1d(K)}1j{K.5j=1r d.22(K.S.X,{2H:l.2H||K.U("2H"),3N:l.3N||K.U("3N"),3Q:l.3Q||K.U("3Q"),7s:(L(o,n,m){K.X[o]=m.1l;$R(K.1c).1Y("1l",n)}).1d(K.S,("1l-"+K.2f).2O(),l.e),5R:K.1Z.1d(K,l)}).1L({1l:[K.1V(),l.1m]})}},9v:L(){},1Z:L(i){K.5j&&K.5j.1Z();K.4K("5h");i&&i.4M&&K.4M();$R(K.S.1c).1Y("1c-3T");$R(K.S.1c).1Y("1l-3T");i&&i.9y&&i.9y()},4M:L(){P i=K.X.4i,l=i.1k-1,j=K.1V()%K.32();3d(l>=0&&j<i[l].1X(12,12)[K.2f]){l--}K.S.1t=l},1t:L(){M K.S.1t}});b.3e.c1=d.1W(b.3e,{1R:"1v",2q:{1i:"10%",1t:"1z","1v-1i":"1b"},5i:1f,2R:L(){P m=K.8d=K.U("1t");P l=K.h=$R(["Y","1z"]).1U(m);P j=K.S.X.2p();P i=K.1i=K.S.1i(K.U("1i"),j[l?"T":"Q"]);K.X=d.$1r("2u",{},{1t:"2C",46:"2l"}).3t(K.S.1R("1v-X"));K.28(K.X,m,i);$R(K.S.1c).1E("1l-2A",(L(){K.1v=d.$1r("2u",{},{c0:"c2",1t:"2C","z-2m":2}).3t(K.S.1R("1v"));K.X.28(K.1v);K.7p();$R(K.1v).1E("86",K.7B.1d(K));$R(15.2w).1E("81",K.7E.1d(K));$R(15.2w).1E("7r",K.7f.1d(K));$R(K.X).1E("3J",K.29.1d(K));$R(K.S.1c).1E("1l",K.7i.1d(K));$R(K.S.1c).1E("1l-3T",K.7i.1d(K))}).1d(K))},7p:L(){P q=K.8d,p=K.h,n=K.1i;P j=K.U("1v-1i");P o=K.S.1c.1M.1l.32();P i=K.S.X.2p()[K.S.1c.1M.1l.1i];4T=K.X.2p()[p?"Q":"T"];N(j!="1b"){j=K.S.1i(j,K.S.X.2p()[p?"Q":"T"]);4T=1w.3c(j*o/i);P m=13(K.X.1p()[p?"Q":"T"]);K.X.7o(p?4T:1e,p?1e:4T);P l=13(K.X.1p()[p?"Q":"T"]);K.X.2V(p?"14":"Y",13(K.X.1X(12)[p?"14":"Y"])+(m-l)/2)}1j{j=1w.3c(4T*i/o)}j=13(j);n=K.X.2p()[p?"T":"Q"];K.1v.3f(p?j:n,p?n:j).1s({Y:K.X.18("1K-Y"),14:K.X.18("1K-14")});K.3G&&K.3G.3H()&&2P K.3G;K.3G=$R(K.1v.7D(12)).3t(K.S.1R("1v-3G")).1s({"z-2m":1}).3l(K.X);M K.X},7B:L(i){K.5i=12;K.1v.7n();M 12},7E:L(i){K.5i=1f;K.1v.7n();M 12},29:L(q){$R(q).1Z();W.7h&&W.7h().7R&&W.7h().7R()||15.7Q&&15.7Q.bN();P p=K.h;P j=$R(q).7g();P u=K.X.1X();P o=K.X.1p();P r=K.X.2p();P x=K.1v.1p();P s=p?"x":"y";P v=p?"Q":"T";P w=p?"14":"Y";P m=j[s]-u[w]-(o[v]-r[v])/2-x[v]/2;m<0&&(m=0);m>(r[v]-x[v])&&(m=r[v]-x[v]);K.1v.2V("1g-"+w,m);P i=K.S.1c.1M.1l.32();P n=K.S.U(K.S.1c.1M.1l.1i);K.S.1l({1m:1w.3c(m*i/r[v]),e:{5l:["3G"]}});$R(K.S.2t).1Y("1v-29")},7f:L(i){N(!K.5i){M}M K.29(i)},7i:L(m){N(!K.3G){M}P j=K.S.1c.1M.1l.32();P l=K.S.1c.1M.1l.1V();P i=K.X.2p()[K.h?"Q":"T"];m.5l||(m.5l=["3G","1v"]);$R(m.5l).1u(L(n){K[n].2V("1g-"+(K.h?"14":"Y"),i*l/j)},K)}});b.3e.cA=d.1W(b.3e,{1R:"1y",2q:{1t:"a8",1N:0.6,"1N-2r":1},2R:L(){P l=$R(["14","1A"]).1U(K.S.U("1H"));P r=d.$1r("2u",{"27":K.S.1R("1y")+" "+K.S.1R("4y-"+(l?"14":"Y"))},{1t:"2C","z-2m":20});P m=d.$1r("2u",{"27":K.S.1R("1y")+" "+K.S.1R("4y-"+(l?"1A":"1z"))},{1t:"2C","z-2m":20});K.S.S.28(m).28(r);P u=m.1p()[l?"Q":"T"];N(K.U("1t")=="3W"){K.28(r,l?"14":"Y",u,12);K.28(m,l?"1A":"1z",u,12)}P n=K.S.X.1p();P o={},q={},j;N(l){j=13(K.S.X.1X(12)["Y"])+K.S.X.1p()["T"]/2-m.1p()["T"]/2;o={1A:0,Y:j};q={14:0+13(K.S.S.18("1K-14")),Y:j}}1j{j=13(K.S.X.1X(12)["14"])+K.S.X.1p()["Q"]/2-m.1p()["Q"]/2;o={1z:0,14:j};q={Y:0+13(K.S.S.18("1K-Y")),14:j}}m.1s(o);r.1s(q);N(d.V.2g&&d.V.3v<7){L i(z,w,v){P s=z.52("7z-ax"),y=13(z.52("7z-1t-x")),x=13(z.52("7z-1t-y"));s=s.5A(4,s.1k-1);N(s.5k(0)==\'"\'||s.5k(0)=="\'"){s=s.5A(1,s.1k-1)}z.4J({8z:"2s"});P p=1r bW();p.3n=(L(F,D,E,C,B,H){P G=d.$1r("dh",1e,{3F:"30",Q:F.Q,T:F.T,8z:"2s"}).3l(D);G.25.4Y="8Y:7x.7j.cx(cy=\'cI\', 3O=\'"+E+"\')";P J=D.18("Q").3C(),I=D.18("T").3C();D.25.d9="da("+B+"31, "+(C+J)+"31, "+(B+I)+"31, "+C+"31)";P A={};N(w){A.Y=(D.18("Y")||"0").3C()-B;A[H]=(D.18(H)||"0").3C()-(((H=="14")?0:(F.Q-J))-C)}1j{A.14=(D.18("14")||"0").3C()-C;A[H]=(D.18(H)||"0").3C()-(((H=="Y")?0:(F.T-I))-B)}D.4J({Y:"1b",14:"1b",1A:"1b",1z:"1b"});D.4J(A);D.4J({Q:F.Q,T:F.T})}).1d(K,p,z,s,y,x,v);p.3O=s}i(m,l,l?"1A":"1z");i(r,l,l?"14":"Y")}m.1E("3J",(L(){K.2t.1Y("4y-3J",{1H:"3u"})}).1d(K.S));r.1E("3J",(L(){K.2t.1Y("4y-3J",{1H:"4C"})}).1d(K.S));m.2y("4U",K.2r.1d(K,m,12));m.2y("4R",K.2r.1d(K,m));r.2y("4U",K.2r.1d(K,r,12));r.2y("4R",K.2r.1d(K,r));$R(K.S.1c).1E("1l",m.2J.1d(m));$R(K.S.1c).1E("1l",r.2J.1d(r));$R(K.S).1E("1J",m.2J.1d(m));$R(K.S).1E("1J",r.2J.1d(r));$R(K.S.1c).1E("at-4z-49",m.4f.1d(m));$R(K.S.1c).1E("at-4z-1L",r.4f.1d(r));K.2r(m);K.2r(r)},2r:L(j,i){j.4E(K.U("1N"+(i===12?"-2r":"")))}});P g=d.1W(b,{2q:{Q:"1b",T:"1b",1H:"1A",1v:1f,"1v-1i":"10%","1v-1y":1f,1y:"3W","1y-1N":60,"1y-2r-1N":2T,62:cf,2H:7q,19:3,2M:3,2E:"2c","1a-Q":"1b","1a-T":"1b","1a-67":"a",3n:d.$F},2a:{},1F:1e,21:{3A:0,6E:1f,3D:1f,1i:{Q:0,T:0}},2x:L(m,n,j){P o=d.$1r("2u",{"27":K.1F.3k,2N:K.1F.2N},{1t:"2C !5U",Y:"-bC !5U",14:"0 !5U",2L:"2l !5U"}).3l(K.94),l=d.$1r(j||"2u",{"27":m}).3l(o),i=l.18(n);l.3H();o.3H();M(1r 7t("31$","bG")).4A(i)?13(i):i},2d:L(j){K.7v();K.1F=j;K.94=j.23;N(d.V.2g){d.$A(j.2Y("a")).1u(L(n){n.9n=n.9n});d.$A(j.2Y("1Q")).1u(L(n){n.3O=n.3O})}K.9k();K.17({"27":K.1F.3k,1R:"75",1c:"1l"});!K.U("1v")&&K.5X("1v");!K.U("1y")&&K.5X("1y");(K.U("19")=="1b")&&K.17({19:0});9m(K.U("19"))&&K.17({19:3});K.U("2M")>0||K.17({2M:1});K.17({"1y-1N":K.U("1y-1N")/2T,"1y-2r-1N":K.U("1y-2r-1N")/2T});g.73(K.1F);$R(K).1E("7m-42",L(){g.5W(K.S)}.1d(K));K.68({4e:["1l"],7w:{2N:K.1F.2N||""},2X:{"1g-Y":K.1F.18("1g-Y"),"1g-1A":K.1F.18("1g-1A"),"1g-1z":K.1F.18("1g-1z"),"1g-14":K.1F.18("1g-14")},65:{"1c-1l-1H":"1H","39-1v-1t":"1v","39-1v-1i":"1v-1i","39-1y-1t":"1y","39-1y-1N":"1y-1N","39-1y-1N-2r":"1y-2r-1N","1c-1l-2E":"2E","1c-1l-19-7y":"19","1c-1l-2M":"2M","-2M":"2M"}});P m=0;P i=(L(){P p=[],n=1f,o=(L(u){P w=d.1B(W.3z)?3z:d.1B(W.61)?61:1e;N(w){L v(x){2N=x.64.4l("9o-2N")==-1?x.64:w.a1("(^|[ ;]{1,})9o-2N(s+)?:(s+)?([^;$ ]{1,})",x.64,"");M $R(2N)}P r=1e;N(u[1].2F=="A"&&v(u[1])){r=u[1]}1j{d.$A(u[1].2Y("A")).1u(L(x){N(v(x)){r=x}})}N(r){P s=w.bJ(r);N(!s["5X-1b-1L"]&&!$R(r).1x("9b",1f)){o.1d(K,u).2v(6y);M 12}}}L q(y){P z=/(^|;)\\s*3j\\-2N\\s*:\\s*([^;]+)\\\\*(;|$)/i,x;M $R((x=z.cE(y.64))?x[2]:"")}1r c(u[0],{3n:(L(B,A){N(K.6j){M}P C,x,z,y=$R(A).6t("3F");$R(K.1F).2J();N("3P"===y.3F){$R(A).1s({3F:"3P-30"})}z=$R(A).1p();$R(K.1F).4f();A.1s(("A"==A.2F)?d.1h(y,{1g:0}):y);z.Q=13(z.Q);z.T=13(z.T);K.21.3D||(K.21.3D=z);K.21.1i.Q+=z.Q;K.21.1i.T+=z.T;K.1J(d.$1r("2u",{"27":"2o"},{Q:z.Q}).28(C=$R(A).57()));x=q(A);N(x&&x.3j&&x.3j.63&&x.3j.63.1U(A)){x.3j.63[x.3j.63.4l(A)]=C}K.21.3A++;N((K.21.3A>=K.U("19")||K.21.3A>=m)&&!K.21.6E){K.21.6E=12;K.6s()}i.2v()}).4Q(K,u[1])});M 12}).1d(K);M(L(r,q){r&&q&&p.1J([r,q])||(n=1f);n||p.1k>0&&(n=12)&&o(p.3Z())||p.1k==0&&K.U("3n")(K.S);M 12}).1d(K)}).1d(K)();P l=[];d.$A(j.4i).1u(L(n){N((n.2F||"").2z()!=K.U("1a-67").2z()){M 1e}P p=n.2F=="66"?[n]:n.2Y("66"),o;N(!p.1k&&!K.21.3D){$R(K.1F).2J();K.21.3D=$R(n).1p();K.21.1i=$R(K.1F).1p()}n.2F!="4h"&&p.1k>0&&i(p[0],n)&&++m||l.1J(n.2F=="4h"?$R(n).57().3t("2o"):d.$1r("2u",{"27":"2o"}).28($R(n).57()))&&K.19.1k==0&&K.1J(l.3Z())},K);m||K.6s().U("3n")(K.S);d.$A(l).1u(L(n){K.1J(n)},K);K.S.2D("3r",j.$2i);K.2D("3r",j.$2i)},6f:L(j){N(K.U("19")>0){P i=K.X.1p();K.h&&(i.Q/=K.U("19"));!K.h&&(i.T/=K.U("19"));(j.1a||j).45("30",i)}},9p:L(p){p.1a.2V("46","2l");P j=p.1a.2Y("66");N(j.1k>0){j=j[0];P i=13(p.1a.2p().Q),n=13(p.1a.1p().T);P l=2Z=13($R(j).1p().Q);N(2Z>i){j.3f({Q:i});l=2Z=i}j.9w("T");j.9w("Q");P m=L(q){j.3f({Q:q})};P o=L(){M p.1a.9r};1o(;o()>n;2Z-=10){2Z>0&&m(2Z);N(o()<n||2Z<=0){2Z+=10;1o(;o()>n;2Z-=1){N(2Z<=0){m(l);1C}m(2Z)}1C}}}},6s:L(){N(K.U("19")>0){P m=K.21.1i,j=K.21.3D;N(j==1f){j={Q:0,T:0}}N(K.21.3A<K.U("19")){m.Q+=j.Q*(K.U("19")-K.21.3A);m.T+=j.T*(K.U("19")-K.21.3A)}K.U("Q")=="1b"||(m.Q=K.U("Q"));K.U("T")=="1b"||(m.T=K.U("T"));K.U("Q")=="1b"||(j.Q=K.U("Q"));K.U("T")=="1b"||(j.T=K.U("T"));K.U("Q")!="1b"&&K.U("1y")=="3W"&&(m.Q-=2*K.41(K.U("1y-1i"),m.Q));K.U("T")!="1b"&&K.U("1y")=="3W"&&(m.T-=2*K.41(K.U("1y-1i"),m.T));K.U("1v")&&(j.Q+=K.41(K.U("1v-1i"),j.Q));K.U("1v")&&(j.T+=K.41(K.U("1v-1i"),j.T));P p={Q:0,T:0};p.Q=K.2x("2o","1I-14-Q")+K.2x("2o","1I-1A-Q")+K.2x("2o","1g-14")+K.2x("2o","1g-1A")+K.2x("2o","1K-1A")+K.2x("2o","1K-14");p.T=K.2x("2o","1I-Y-Q")+K.2x("2o","1I-1z-Q")+K.2x("2o","1g-Y")+K.2x("2o","1g-1z")+K.2x("2o","1K-Y")+K.2x("2o","1K-1z");K.U("Q")=="1b"&&(m.Q+=p.Q*K.U("19"));K.U("T")=="1b"&&(m.T+=p.T*K.U("19"));K.U("Q")=="1b"&&(j.Q+=p.Q);K.U("T")=="1b"&&(j.T+=p.T);P r={};K.U("1a-Q")=="1b"&&K.h&&(r["1a-Q"]=m.Q/K.U("19"));K.U("1a-T")=="1b"&&K.v&&(r["1a-T"]=m.T/K.U("19"));K.U("1y")=="3W"&&(m.Q+=2*K.41(K.U("1y-1i"),m.Q));K.U("1y")=="3W"&&(m.T+=2*K.41(K.U("1y-1i"),m.T));K.U("Q")=="1b"&&(K.h&&(r.Q=m.Q)||(r.Q=j.Q));K.U("T")=="1b"&&(K.v&&(r.T=m.T)||(r.T=j.T));r.T==0&&(r.T=1);r.Q==0&&(r.Q=1);K.17(r)}1j{P n=K.1F.1p();K.U("Q")=="1b"&&K.17({Q:13(n.Q)});K.U("T")=="1b"&&K.17({T:13(n.T)})}K.U("1a-67").2z()!="2u"&&$R(b.3V).1E("1a-6i",K.9p);K.3X(K.1F).42().2J();P q=K.4v=d.$1r("2u",1e,{3F:"2s"}),l=0;q.3k=K.1F.3k;K.S.23.54(q,K.S);d.$A(K.1F.4i).1u($R(L(i){N((i.2F||"").2z()!=K.U("1a-67").2z()){M 1e}l++;N(l>K.19.1k){q.2W(i)}}).1d(K));$R(K).1E("1J",$R(L(i){K.1F.2W(q.56)}).1d(K));K.U("2E")=="2c"||$R(K.1c).1Y("at-4z-1L");$R(K).1E("1J",L(i){g.5W(i.1a)});$R(K).1E("1J",K.6f.1d(K));K.19.1u(K.6f,K);$R(K.2t).1E(["4y-3J","1v-29"],(L(i){K.1b();i.3K=="4y-3J"&&K.29({1m:i.1H,1H:i.1H})}).1d(K));K.1b();M K},4D:1e,1b:L(){N(!K.U("62")){M}6b(K.4D);K.4D=(L(){K.1b();P i=$R(["Y","14"]).1U(K.U("1H"))?"4C":"3u";K.29({1m:i,1H:i})}).1d(K).2v(K.U("62")+K.U("2H"))},3p:L(i){M d.1B(K.2a[i])},9k:L(){d.1h(K.2a,g.17);K.1F.2N&&d.1h(K.2a,g.83[K.1F.2N]||{});K.2a.Q||(K.2a.Q=K.2q.Q);K.2a.T||(K.2a.T=K.2q.T);K.2a["1a-Q"]||(K.2a["1a-Q"]=K.2q["1a-Q"]);K.2a["1a-T"]||(K.2a["1a-T"]=K.2q["1a-T"]);N(d.1B(K.2a.19)&&K.2a.19==""){2P K.2a.19}K.17(K.2q);K.17(K.2a);$R(["Q","T","62","2H","2M","19","1a-Q","1a-T","1y-1N","1y-2r-1N"]).1u(L(l){P j=K.U(l),i={};N(j==13(j)){i[l]=13(j);K.17(i)}},K);K.U("1v-1i")=="2T%"&&K.17({"1v-1i":"99%"});K.h=$R(["14","1A"]).1U(K.U("1H"));K.v=!K.h;K.3p("Q")&&K.3p("19")&&K.3p("1a-Q")&&(K.U("19")*K.U("1a-Q")>K.U("Q"))&&K.17({"1a-Q":"1b"})&&2P K.2a["1a-Q"];K.3p("T")&&K.3p("19")&&K.3p("1a-T")&&(K.U("19")*K.U("1a-T")>K.U("T"))&&K.17({"1a-T":"1b"})&&2P K.2a["1a-Q"];!K.3p("2M")&&K.17({2M:K.U("19")});K.3p("1y-1i")||K.17({"1y-1i":K.2x("cP",K.h?"Q":"T")});K.U("Q")=="1b"&&K.U("1a-Q")!="1b"&&K.U("19")&&K.17({Q:K.U("1a-Q")*(K.h?K.U("19"):1)+2*(K.h&&K.U("1y")=="3W"?K.U("1y-1i"):0)});K.U("T")=="1b"&&K.U("1a-T")!="1b"&&K.U("19")&&K.17({T:K.U("1a-T")*(K.v?K.U("19"):1)+2*(K.h&&K.U("1y")=="3W"?K.U("1y-1i"):0)});K.h&&$R(["14","1A"]).1U(K.U("1v"))&&K.17({1v:"1z"});K.v&&$R(["Y","1z"]).1U(K.U("1v"))&&K.17({1v:"14"})},6j:1f,6a:L(){K.6j=12;6b(K.4D);N(K.4v){K.4v&&d.$A(K.4v.4i).1u($R(L(j){N(j.2F){K.1F.2W(j)}}).1d(K));K.4v.23.4X(K.4v)}M K.$2n.6a(K.1F)}});P e=d.1B(W.3z)?3z:d.1B(W.61)?61:1e;N(e){e.9a=e.95;e.95=L(i,j,l){e.9a(i,j,l);j.2D("9b",12)}}g.2B={6o:$R(["58","51","59","3z"]),1M:[]};d.1B(W.58)&&(g.2B.58=58);d.1B(W.51)&&(g.2B.51=51);d.1B(W.3z)&&(g.2B.3z=3z)&&(g.2B.58=3z);d.1B(W.59)&&(g.2B.59=59);1o(P a 1D g.2B){N(g.2B.6o.4l(a)!=-1){g.2B.1M.1J(a)}}g.73=L(i){d.$A($R(i).5V("A")).1u(L(j){$R(g.2B.1M).1u(L(l){N(!$R(j).4q(l)){M}N(("51"==l||"59"==l)&&!(j.3j&&j.3j.bE>-1)){M}g.2B[l].1Z(j)})})};g.5W=L(i){d.$A($R(i).5V("A")).1u(L(j){$R(g.2B.1M).1u(L(l){$R(j).4q(l)&&g.2B[l].1L(j)})})};N(!d.V.2g){b.3V.9x=b.3V.5T;b.3V.5T=L(){g.73(K);P i=K.9x();g.5W(K);M i}}d.1h(g,{3v:"c9.0.24",17:{},83:{},2k:{},4a:L(i){M i?d.1n(i)=="3h"?i:[i]:d.$4s(K.2k)},2d:L(i){d.$A((i||15).2Y("2u")).1u((L(j){N($R(j).4q("75")){K.1L(j)}}).1d(K))},1L:L(i){M $R(K.4a(i)).76($R(L(j){j=$R(j);j.1x("3r")||K.2k[j.$2i]||(K.2k[j.$2i]=1r g(j));M K.2k[j.1x("3r")||j.$2i].S}).1d(K))},1Z:L(i){M $R(K.4a(i)).76($R(L(j){P l=$R(j).1x("3r");K.2k[l]&&(j=K.2k[l].6a())&&(2P K.2k[l]);M j}).1d(K))},c3:L(i){M K.1L(K.1Z(i))},29:L(i,j){d.1n($R(i))=="36"||(j=i)&&(i=1e);$R(K.4a(i)).1u(L(l){P m=$R(l).1x("3r");K.2k[m]&&K.2k[m].29(j)},K)},1l:L(i,j){d.1n($R(i))=="36"||(j=i)&&(i=1e);$R(K.4a(i)).1u(L(l){P m=$R(l).1x("3r");K.2k[m]&&K.2k[m].1l(j)},K)},cg:L(i){$R(K.4a(i)).1u(L(j){P l=$R(j).1x("3r");K.2k[l]&&6b(K.2k[l].4D)},K);M i},cq:L(i){$R(K.4a(i)).1u(L(j){P l=$R(j).1x("3r");K.2k[l]&&K.2k[l].1b()},K);M i}});$R(15).2y("3E",L(){g.2d()});P c=1r d.1W({1Q:1e,2A:1f,17:{3n:d.$F,77:d.$F,69:d.$F},1i:1e,4F:1e,5Y:{3n:L(i){N(i){$R(i).1Z()}K.4I();N(K.2A){M}K.2A=12;K.4V();K.17.3n.1d(1e,K).2v(1)},77:L(i){N(i){$R(i).1Z()}K.4I();K.2A=1f;K.4V();K.17.77.1d(1e,K).2v(1)},69:L(i){N(i){$R(i).1Z()}K.4I();K.2A=1f;K.4V();K.17.69.1d(1e,K).2v(1)}},8H:L(){$R(["2R","6K","6P"]).1u(L(i){K.1Q.2y(i,K.5Y["6O"+i].4Q(K).7A(1))},K)},4I:L(){$R(["2R","6K","6P"]).1u(L(i){K.1Q.5Z(i)},K)},4V:L(){K.1p();N(K.1Q.1x("1r")){P i=K.1Q.23;K.1Q.3H().6Q("1r").1s({1t:"bO",Y:"1b"});i.6V()}},2d:L(j,i){K.17=d.1h(K.17,i);K.1Q=$R(j)||d.$1r("1Q").3l(d.$1r("2u",1e,{1t:"2C",Y:-6U,Q:10,T:10,46:"2l"}).3l(d.2w)).2D("1r",12);P l=L(){N(K.8n()){K.5Y.3n.2e(K)}1j{K.5Y.69.2e(K)}l=1e}.1d(K);K.8H();N(!j.3O){K.1Q.3O=j}1j{N(d.V.cJ&&d.V.6c<9){K.1Q.8S=L(){N(/3A|3T/.4A(K.1Q.4u)){K.1Q.8S=1e;l&&l()}}.1d(K)}K.1Q.3O=j.3O}K.1Q&&K.1Q.3T&&l&&(K.4F=l.2v(2T))},a7:L(){N(K.4F){2S{6b(K.4F)}3w(i){}K.4F=1e}K.4I();K.4V();K.2A=1f;M K},8n:L(){P j=K.1Q;M(j.6D)?(j.6D>0):(j.4u)?("3T"==j.4u):j.Q>0},1p:L(){M K.1i||(K.1i={Q:K.1Q.6D||K.1Q.Q,T:K.1Q.a0||K.1Q.T})}});M g})(44);',62,841,'||||||||||||||||||||||||||||||||||||||||||||||this|function|return|if||var|width|mjs|core|height|option|j21|window|wrapper|top||||true|parseInt|left|document||options|j5|items|item|auto|effect|j24|null|false|margin|extend|size|else|length|scroll|target|j1|for|j7|case|new|j6|position|j14|slider|Math|j29|arrows|bottom|right|defined|break|in|bindEvent|original|arguments|direction|border|push|padding|start|classes|opacity|_options|Element|img|name|prefix|prototype|contains|scrollPosition|Class|j8|callEvent|stop||tmp|FX|parentNode||style|order|class|append|jump|options_|J_EUID|continue|init|call|prop|trident|undefined|J_UUID|fullScreen|_list|hidden|index|parent|MagicScrollItem|getBoxSize|defaults|hover|none|modules|div|j27|body|getPropValue|je1|toLowerCase|ready|extraEffects|absolute|j30|loop|tagName|orders|duration|string|show|J_TYPE|visibility|step|id|j22|delete|el|load|try|100|switch|j6Prop|appendChild|styles|getElementsByTagName|iw|block|px|scrollSize|object|capable|getDoc|element|split|lastChild|module|mw2|engine|round|while|mw4|setSize|constructor|array|instanceof|zoom|className|j32|webkit|onload|Transition|isset|timer|MagicScrollID|layout|j2|forward|version|catch|box|nodeType|MagicMagnifyPlus|loaded|apply|j17|first|domready|display|shadow|j33|fixSize|click|type|typeof|last|transition|src|inline|fps|Array|indoc|complete|event|Item|outside|replace|_scrollSize|shift|_event_prefix_|sizeup|reload|_tmp|magicJS|fixPosition|overflow|requestAnimationFrame|Doc|end|list|visible|events|offsets|effects|hide|float|DIV|childNodes|css3Transformations|pow|indexOf|default|onready|stretch|throw|j13|render|AA|offset|readyState|ph|detach|now|arrow|the|test|reset|backward|_auto|j23|_timer|getElementsByClassName|set|_unbind|j20|removeOffsets|reverse|checkPosition|storage|currentStyle|checkOffsets|j16|mouseout|_events|wrapperSize|mouseover|_cleanup|sizing|removeChild|filter|uuid||MagicZoom|j19|nativeEvents|insertBefore|_event_del_|firstChild|clone|MagicThumb|MagicZoomPlus|found|not|MagicJS|css3Animation|tooltip|MagicSwap|compatMode|extra|holded|fx|charAt|targets|enabled|toString|features|match|prepare|backCompat|doc|j10|J_EXTENDED|floor|replaceChild|mw1|_event_add_|ms|substring|getAll|mw3|random|mode|scrollTop|button|scrollLeft|getStorage|implement|hasOwnProperty|createEvent|forceAnimation|relative|cancelAnimationFrame|callee|unbindEvent|onComplete|documentMode|copy|important|byTag|startExtraEffects|disable|_handlers|je2||MagicMagnify|speed|selectors|rel|alias|IMG|tag|create|onerror|dispose|clearTimeout|ieMode|j26|customEvents|fixItemPosition|head|query|resize|_disposed|defaultView|center|align|middle|all|gecko|dashize|styleFloat|initSize|j19s|Function|setProps|styleSheets|rand|500|navigator|clones|addEvent_|j23_|naturalWidth|initialized|isclone|master|initsize|parseFloat|win|abort|stopAnimation|startTime|loopBind|on|error|j31|has|Event|HTMLElement|10000|kill|documentElement|calc|cos|sineIn|Tooltip|text|createElement|stopExtraEffects|enclose|MagicScroll|map|onabort|PI|horizontal|toggle|max|el_arr|request|caller|move|j15|getSelection|jumpShadow|Microsoft|white|space|after|blur|setBoxSize|make|1000|mousemove|onBeforeRender|RegExp|force|preInit|attributes|DXImageTransform|count|background|j28|hold|finishTime|cloneNode|unhold|String|expoIn|onAfterRender|roundCss|forEach|interval|concat|420|je3|dispatchEvent|phone|selection|removeAllRanges|date|wrap|DocumentTouch|onStart|quadIn|offsetWidth|offsetHeight|vertical|slide|mouseup|out|extraOptions|styles_arr|PFX|mousedown|Slide|bounceIn|nativize|backIn|textnode|cubicIn|pos|Date|UUID|toArray|elasticIn|raiseEvent|which|chrome|localStorage|200|isReady|900|changeEventName|CancelFullScreen|cancelFullScreen|cancel|errorEventName|xpath|XMLHttpRequest|mozCancelAnimationFrame|android|backcompat|backgroundImage|Webkit|hone|presto|Khtml|Moz|j3|getComputedStyle|_bind|requestFullScreen|webkit419|400|ip|stopPropagation|platform|relatedTarget|opera|cancelBubble|compareDocumentPosition|onreadystatechange|Left|Bottom|od|Top|Right|progid|getBoundingClientRect|Alpha|transform|addEventListener|preventDefault|originalParent|subInit|ceil|number|cloneEvents||subInit_|mminitialized|nextSibling|valign|Items|jump_|je4|normal|presta|customEventsAllowed|userOptions|setAttribute|isNaN|href|magnifier|fixImageSize|32767|scrollHeight|restore|moz|DOMContentLoaded|clear|removeAttribute|copy_|callback|collection|fix|j8_|RequestFullScreen|touchScreen|FullScreen|webkitIsFullScreen|fullscreenerror|querySelector|runtime|userAgent|restart|evaluate|j4|air|pocket|fullscreenchange|191|offsetParent|BODY|192|HTML|190|181|khtml|ontouchstart|psp|naturalHeight|getParam|getPropertyValue|plucker|ixi|filters|hasLayout|destroy|inside|os|palm|midp|clientTop||j11|ob|toFloat|zIndex|toUpperCase|setInterval|setTimeout|mobile|re|Width|offsetTop|0px|destroyEvent|j18|cssFloat||mmp|offsetLeft|clientLeft|image|fixed|blackberry|ActiveXObject|getBoxObjectFor|linux|other|mozRequestAnimationFrame|webkitRequestAnimationFrame|oCancelAnimationFrame|xda|xiino|msRequestAnimationFrame|oRequestAnimationFrame|mac|blazer|hiptop|fennec|iemobile|unknown|taintEnabled|content|ios|compal|nowrap|elaine|webos|mozInnerScreenY|msCancelAnimationFrame|iris|211|210|220|250|applicationCache|260|msPerformance|performance|WebKitPoint|525|symbian|treo|postMessage|270|html|wap|vodafone|Transform|webkitCancelRequestAnimationFrame|windows|animationName|link|AnimationName|tablet|up|avantgo|bada|419|iframe|slice|expoOut|sineOut|linear|abs|MagicSwap_version|quadOut|cubicOut|1000px|None|lastUpdate|backOut|ig|618|getTime|createParamsList|mousewheel|contextmenu|addCSS|empty|static|doScroll|dblclick|maemo|getElementById|clearInterval|curFrame|state|Image|lge|elasticOut|Container|cursor|Slider|pointer|refresh|UIEvent|MouseEvent|Object|exists|9999|v1|createTextNode|v2|999|MagicToolboxTooltip||5000|pause|to|Try|objects|before|regexp|bounceOut|ERROR|Swap|KeyboardEvent|play|KeyEvent|slideOut|Magic|slideIn|DOMMouseScroll|selectstart|AlphaImageLoader|sizingMethod|readystatechange|Arrows|j12|scrollWidth|byClass|exec|submit|select|unload|scale|trident900|beforeunload|pageYOffset|pageXOffset|hasChild|kindle|MagicScrollArrows|innerText|changeContent|innerHTML|eq|netfront|clientWidth|clientHeight|innerHeight|innerWidth|DOMElement|presto925|Scroll|returnValue|detachEvent|keypress|attachEvent|keyup|focus|removeEventListener|clip|rect|selectend|fireEvent|keydown|eventType|initEvent|createEventObject|span|getButton|update|pageY|clientX|pageX|touch||changedTouches|clientY|insertRule|change|toElement|fromElement|getRelated|getTarget|srcElement|j9'.split('|'),0,{}))

/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Mytheresa
 * @package     js
 * @copyright   Copyright (c) 2010 Benjamin Zaiser, mzentrale
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */

/**
 * Add to cart Proxy for bundleorder
 *
 * @param id, form id
 * @param pressedButton, button
 */
function bundleOrderAddtoCart(id, pressedButton, sku){
    var formId = 'product-add-to-cart-form_' + id;
    bundleOrderProductAddToCartForm = new VarienForm('product-add-to-cart-form_' + id);
    bundleOrderProductAddToCartForm.submit = function(button) {
        if (this.validator.validate()) {
            if($('attribute142_'+id).value){
                if (button && button != 'undefined') {
                    $(button).disabled = true;
                }
                var submitButton = button;
                new Ajax.Request(cartAjaxUrl, {
                    method: 'post',
                    parameters: Form.serialize(formId),
                    onSuccess: function(transport) {
                        data = transport.responseText.evalJSON();
                        $('message-'+sku).update(data.message).show();
                        new Effect.Highlight('message-'+sku, {
                            startcolor: '#ffffff',
                            endcolor: '#eeeeee'
                        });
                        $('top-cart').replace(data.topcart);
                        Enterprise.TopCart.initialize('topCartContent');
                        //Enterprise.TopCart.showCart(3);
                        $(button).disabled = false;
                    }
                });
            } else {
                jQuery('#product-add-to-cart-form_'+id).find('.size-trigger').css('color','#D91A00');
                jQuery('#product-add-to-cart-form_'+id).find('.size-trigger').css('border-color','#D91A00');
            }
        }
    };

    bundleOrderProductAddToCartForm.submit(pressedButton);
}

/**
 * Add selected item to hidden form field
 * @param value, selected option id
 * @param id, form id
 */
function addBundleOptionToCart(value, id){
    $('attribute142_'+id).value = value;
    return true;
}

/**
 * MZTabs
 * 
 * see http://madrobby.github.com/scriptaculous/tabs/
 * 
 * HTML Code:
 * <div id="tabs">
 *     <ul>
 *         <li id="tabs_header_active"><a onclick="mztabs.toggleTab(1,2)">Tab 1</a></li>
 *         <li id="tabs_header_2"><a onclick="mztabs.toggleTab(2,2)">Tab 2</a></li>
 *     </ul>
 *     </div>
 *     <div>
 *         <div id="tabs_content_1">
 * 
 *         </div>
 *         <div id="tabs_content_2" style="display:none;">
 * 
 *         </div>
 *     </div>
 * </div>
 * 
 * (c) 2010, Benjamin Zaiser, b.zaiser@mzentrale.de
 * 
 */
MZTabs = Class.create();
MZTabs.prototype = {

	//Constructor
	initialize: function() {
		
	},
	
	
	/**
	 * Toggles tabs - Closes any open tabs, and then opens current tab
	 *  
	 * @param contentId, id of the whole tab container, e.g. tabs
	 * @param num, the number of the current tab
	 * @param numelems, the number of tabs
	 * @param opennum, (optional)The number of the tab to leave open
	 * @param animate, (optional)Pass in true or false whether or not to animate the open/close of the tabs
	 */
	toggleTab: function(contentId, num, numelems, opennum, animate) {
	    if ($(contentId+'_content_'+num).style.display == 'none'){
	        for (var i=1;i<=numelems;i++){
	            if ((opennum == null) || (opennum != i)){
	                var temph = contentId+'_header_'+i;
	                var h = $(temph);
	                if (!h){
	                    var h = $(contentId+'_header_active');
	                    h.id = temph;
	                }
	                var tempc = contentId+'_content_'+i;
	                var c = $(tempc);
	                if(c.style.display != 'none'){
	                    if (animate || typeof animate == 'undefined')
	                        Effect.toggle(tempc, 'blind', {duration:0.5, queue:{scope:'menus', limit: 3}});
	                    else
	                        toggleDisp(tempc);
	                }
	            }
	        }
	        var h = $(contentId+'_header_'+num);
	        if (h)
	            h.id = contentId+'_header_active';
	        h.blur();
	        var c = $(contentId+'_content_'+num);
	        c.style.marginTop = '2px';
	        if (animate || typeof animate == 'undefined'){
	            Effect.toggle(contentId+'_content_'+num, 'blind', {duration:0.5, queue:{scope:'menus', position:'end', limit: 3}});
	        }else{
	            toggleDisp(contentId+'_content_'+num);
	        }
	    }
	},
	
	/**
	 * Helper function:
	 * 
	 * Toggles element's display value
	 * Input: any number of element id's
	 * Output: none 
	 */
	toggleDisp: function() {
	    for (var i=0;i<arguments.length;i++){
	        var d = $(arguments[i]);
	        if (d.style.display == 'none'){
	        	d.style.display = 'block';
	        }
	        else{
	        	d.style.display = 'none';
	        }
	    }
	}

};

var mztabs = new MZTabs();
;(function(a){a.tiny=a.tiny||{};a.tiny.scrollbar={options:{axis:"y",wheel:40,scroll:true,lockscroll:true,size:"auto",sizethumb:"auto"}};a.fn.tinyscrollbar=function(d){var c=a.extend({},a.tiny.scrollbar.options,d);this.each(function(){a(this).data("tsb",new b(a(this),c))});return this};a.fn.tinyscrollbar_update=function(c){return a(this).data("tsb").update(c)};function b(q,g){var k=this,t=q,j={obj:a(".viewport",q)},h={obj:a(".overview",q)},d={obj:a(".scrollbar",q)},m={obj:a(".track",d.obj)},p={obj:a(".thumb",d.obj)},l=g.axis==="x",n=l?"left":"top",v=l?"Width":"Height",r=0,y={start:0,now:0},o={},e=("ontouchstart"in document.documentElement)?true:false;function c(){k.update();s();return k}this.update=function(z){j[g.axis]=j.obj[0]["offset"+v];h[g.axis]=h.obj[0]["scroll"+v];h.ratio=j[g.axis]/h[g.axis];d.obj.toggleClass("disable",h.ratio>=1);m[g.axis]=g.size==="auto"?j[g.axis]:g.size;p[g.axis]=Math.min(m[g.axis],Math.max(0,(g.sizethumb==="auto"?(m[g.axis]*h.ratio):g.sizethumb)));d.ratio=g.sizethumb==="auto"?(h[g.axis]/m[g.axis]):(h[g.axis]-j[g.axis])/(m[g.axis]-p[g.axis]);r=(z==="relative"&&h.ratio<=1)?Math.min((h[g.axis]-j[g.axis]),Math.max(0,r)):0;r=(z==="bottom"&&h.ratio<=1)?(h[g.axis]-j[g.axis]):isNaN(parseInt(z,10))?r:parseInt(z,10);w()};function w(){var z=v.toLowerCase();p.obj.css(n,r/d.ratio);h.obj.css(n,-r);o.start=p.obj.offset()[n];d.obj.css(z,m[g.axis]);m.obj.css(z,m[g.axis]);p.obj.css(z,p[g.axis])}function s(){if(!e){p.obj.bind("mousedown",i);m.obj.bind("mouseup",u)}else{j.obj[0].ontouchstart=function(z){if(1===z.touches.length){i(z.touches[0]);z.stopPropagation()}}}if(g.scroll&&window.addEventListener){t[0].addEventListener("DOMMouseScroll",x,false);t[0].addEventListener("mousewheel",x,false)}else{if(g.scroll){t[0].onmousewheel=x}}}function i(A){var z=parseInt(p.obj.css(n),10);o.start=l?A.pageX:A.pageY;y.start=z=="auto"?0:z;if(!e){a(document).bind("mousemove",u);a(document).bind("mouseup",f);p.obj.bind("mouseup",f)}else{document.ontouchmove=function(B){B.preventDefault();u(B.touches[0])};document.ontouchend=f}}function x(B){if(h.ratio<1){var A=B||window.event,z=A.wheelDelta?A.wheelDelta/120:-A.detail/3;r-=z*g.wheel;r=Math.min((h[g.axis]-j[g.axis]),Math.max(0,r));p.obj.css(n,r/d.ratio);h.obj.css(n,-r);if(g.lockscroll||(r!==(h[g.axis]-j[g.axis])&&r!==0)){A=a.event.fix(A);A.preventDefault()}}}function u(z){if(h.ratio<1){if(!e){y.now=Math.min((m[g.axis]-p[g.axis]),Math.max(0,(y.start+((l?z.pageX:z.pageY)-o.start))))}else{y.now=Math.min((m[g.axis]-p[g.axis]),Math.max(0,(y.start+(o.start-(l?z.pageX:z.pageY)))))}r=y.now*d.ratio;h.obj.css(n,-r);p.obj.css(n,y.now)}}function f(){a(document).unbind("mousemove",u);a(document).unbind("mouseup",f);p.obj.unbind("mouseup",f);document.ontouchmove=document.ontouchend=null}return c()}}(jQuery));

/* Copyright (c) 2006 Mathias Bank (http://www.mathias-bank.de)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * 
 * Thanks to Hinnerk Ruemenapf - http://hinnerk.ruemenapf.de/ for bug reporting and fixing.
 */
jQuery.extend({
/**
* Returns get parameters.
*
* If the desired param does not exist, null will be returned
*
* @example value = $.getURLParam("paramName");
*/ 
 getURLParam: function(strParamName){
	  var strReturn = "";
	  var strHref = window.location.href;
	  var bFound=false;
	  
	  var cmpstring = strParamName + "=";
	  var cmplen = cmpstring.length;

	  if ( strHref.indexOf("?") > -1 ){
	    var strQueryString = strHref.substr(strHref.indexOf("?")+1);
	    var aQueryString = strQueryString.split("&");
	    for ( var iParam = 0; iParam < aQueryString.length; iParam++ ){
	      if (aQueryString[iParam].substr(0,cmplen)==cmpstring){
	        var aParam = aQueryString[iParam].split("=");
	        strReturn = aParam[1];
	        bFound=true;
	        break;
	      }
	      
	    }
	  }
	  if (bFound==false) return null;
	  return strReturn;
	}
});
// #1
jQuery(document).on('click', 'a.prev-scroll', function() {
    _gaq.push(['_trackEvent', ' arrow left via big product picture', 'Click', 'arrow left_big picture']);
});
// #2
jQuery(document).on('click', 'a.next-scroll', function() {
    _gaq.push(['_trackEvent', ' arrow right via big product picture', 'Click', 'arrow right_big picture']);
});
// #3 track main image on product page
jQuery('img#main-image-image').mouseover(function() {
    _gaq.push(['_trackEvent', 'view product', 'MouseOver', 'img sizeup']);
});
// #4
jQuery('a#main-image.MagicZoomPlus').click(function() {
    _gaq.push(['_trackEvent', 'view product zoom', 'onClick', 'img zoom']);
});
// #5
jQuery(document).on('click', 'a.scroller-bullet-1', function() {
    _gaq.push(['_trackEvent', 'pagination', 'onClick', 'pag1']);
});
// #6
jQuery(document).on('click', 'a.scroller-bullet-2', function() {
    _gaq.push(['_trackEvent', 'pagination', 'onClick', 'pag2']);
});
// #7
jQuery(document).on('click', 'a.scroller-bullet-3', function() {
    _gaq.push(['_trackEvent', 'pagination', 'onClick', 'pag3']);
});
// #8
jQuery(document).on('click', 'a.scroller-bullet-4', function() {
    _gaq.push(['_trackEvent', 'pagination', 'onClick', 'pag4']);
});
// #9
jQuery(document).on('click', 'a.scroller-bullet-5', function() {
    _gaq.push(['_trackEvent', 'pagination', 'onClick', 'pag5']);
});
// #10
jQuery(document).on('click', 'a.designer-link', function() {
    _gaq.push(['_trackEvent', 'product designer', 'onClick', 'designername']);
});
// #11
jQuery(document).on('click', '#cartcode a.size-trigger', function() {
    _gaq.push(['_trackEvent', ' sizeselection', 'onClick', 'sizeselection']);
});
// #12
jQuery(document).on('click', 'a.sizechart-tracking', function() {
    _gaq.push(['_trackEvent', ' chose right size', 'onClick', 'right size']);
});
// #13 track add to cart
function trackAddToCart(){
    _gaq.push(['_trackEvent', 'put in cart', 'Click', 'put in cart']);
}
// #14 track overlay view back to shop
jQuery(document).on('click', '.product-info-clone-box a.btn-continue', function() {
    _gaq.push(['_trackEvent', 'choice post put in cart', 'Click', 'back to shop']);
});
// #15 track overlay view shopping bag
jQuery(document).on('click', 'a#product-info-clone-cart-button', function() {
    _gaq.push(['_trackEvent', 'choice post put in cart', 'Click', 'go to cart']);
});
// #16 track add to wishlist
jQuery(document).on('click', '.product-shop button#add-to-wishlist', function() {
    _gaq.push(['_trackEvent', 'put to wishlist', 'Click', 'put to wishlist via button']);
});
// #17
jQuery(document).on('click', '.product-shop a.addtowishlist', function() {
    _gaq.push(['_trackEvent', 'put to wishlist', 'Click', 'put to wishlist via sizeselection']);
});
// #18 track collateral accordion size
jQuery(document).on('click', 'h3#size-and-fit', function() {
    _gaq.push(['_trackEvent', 'product details', 'Click', 'call size&fit']);
});
// #19 track open size chart
jQuery(document).on('click', '#collateral-accordion .sizechart-container a.mzoverlay-open', function() {
    _gaq.push(['_trackEvent', 'product details', 'Click', 'call size table']);
});
// #20 track all anchors in size-chart overlay
jQuery(document).on('click', '#mzoverlay-content #size-chart a', function() {
    _gaq.push(['_trackEvent', 'product details', 'Click', 'call size key']);
});
// #21 track collateral delivery
jQuery(document).on('click', 'h3#delivery-and-returns', function() {
    _gaq.push(['_trackEvent', 'product details', 'Click', 'call delivery & returns']);
});
// #22 track collateral style
jQuery(document).on('click', 'h3#style-details', function() {
    _gaq.push(['_trackEvent', 'product details', 'Click', 'call style details']);
});
// #23 - 27
function trackScrollerThumbClick(index,runway){
    if(!runway)
        _gaq.push(['_trackEvent', 'product pictures', 'Click', 'picture'+(index+1)]);
    else
        _gaq.push(['_trackEvent', 'product pictures', 'Click', 'runway picture']);
}
// #28
jQuery(document).on('click', 'div.MagicScrollArrowLeft', function() {
    _gaq.push(['_trackEvent', ' arrow left via view more product pictures', 'Click', 'arrow left_more pictures']);
});
// #29
jQuery(document).on('click', 'div.MagicScrollArrowRight', function() {
    _gaq.push(['_trackEvent', ' arrow right via view more product pictures', 'Click', 'arrow right_more pictures']);
});
// #30a
jQuery(document).on('click', '.product-shop .bundleorder-link a', function() {
    _gaq.push(['_trackEvent', 'shop the outfit via text link', 'Click', 'shop the outfit_text link']);
});

// #30b
jQuery(document).on('click', '.product-shop .style-with a.product-image', function() {
    _gaq.push(['_trackEvent', 'shop the outfit via picture link', 'Click', 'shop the outfit_picture']);
});

// #31
jQuery(document).on('click', 'a.upsell-item-1', function() {
   _gaq.push(['_trackEvent', 'shop the outfit via picture', 'Click', 'shop the outfit_picture1']);
});
// #32
jQuery(document).on('click', 'a.upsell-item-2', function() {
   _gaq.push(['_trackEvent', 'shop the outfit via picture', 'Click', 'shop the outfit_picture2']);
});
// #33
jQuery(document).on('click', 'a.upsell-item-3', function() {
   _gaq.push(['_trackEvent', 'shop the outfit via picture', 'Click', 'shop the outfit_picture3']);
});
// #34
jQuery(document).on('click', 'a.upsell-item-4', function() {
   _gaq.push(['_trackEvent', 'shop the outfit via picture', 'Click', 'shop the outfit_picture4']);
});
// #35
jQuery(document).on('click', 'a.designer-cat', function() {
    _gaq.push(['_trackEvent', 'more designer', 'Click', 'more designer']);
});
// #36
jQuery(document).on('click', 'a.sub-cat', function() {
    _gaq.push(['_trackEvent', 'more subcategory', 'Click', 'more subcategory']);
});
// #37
jQuery(document).on('mouseover', '.product-shop span.temporary-info-circle', function() {
    _gaq.push(['_trackEvent', 'wishlist information', 'MouseOver', 'wishlist info']);
});
// #38
jQuery(document).on('click', 'a.facebook', function() {
    _gaq.push(['_trackEvent', 'social share', 'Click', 'social share_facebook']);
});
// #39
jQuery(document).on('click', 'a.twitter', function() {
    _gaq.push(['_trackEvent', 'social share', 'Click', 'social share_twitter']);
});
// #40
jQuery(document).on('click', 'a.pinterest', function() {
    _gaq.push(['_trackEvent', 'social share', 'Click', 'social share_pinterest']);
});
// #41
jQuery(document).on('click', 'a.googleplus', function() {
    _gaq.push(['_trackEvent', 'social share', 'Click', 'social share_google+']);
});
// #42
jQuery(document).on('click', 'a.mail', function() {
    _gaq.push(['_trackEvent', 'social share', 'Click', 'social share_tell a friend']);
});
// #43
jQuery(document).on('click', 'a.upsell-bottom-item-1', function() {
    _gaq.push(['_trackEvent', 'style with', 'Click', 'style with_picture1']);
});
// #44
jQuery(document).on('click', 'a.upsell-bottom-item-2', function() {
    _gaq.push(['_trackEvent', 'style with', 'Click', 'style with_picture2']);
});
// #45
jQuery(document).on('click', 'a.upsell-bottom-item-3', function() {
    _gaq.push(['_trackEvent', 'style with', 'Click', 'style with_picture3']);
});
// #46
jQuery(document).on('click', '.catalog-product-view-banner a', function() {
    _gaq.push(['_trackEvent', 'top level banner', 'Click', 'top level banner']);
});
// added by mz
jQuery(document).on('click', 'a.video-trigger', function() {
    _gaq.push(['_trackEvent', 'product pictures', 'Play', 'play product video']);
});

/* 
 * Magento Commercial Edition
 * 
 * NOTICE OF LICENSE
 * 
 * This source file is subject to the Magento Commercial Edition License
 * that is available at: http://www.magentocommerce.com/license/commercial-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 * 
 * @category    Mzentrale
 * @package     Mzentrale_Catalog
 * @copyright   Copyright (c) 2013 mzentrale | eCommerce - eBusiness
 * @license     http://www.magentocommerce.com/license/commercial-edition
 */
;(function($) {
    var ShareProduct = function(button, options) {
        var defaults = {
            overlayId: 'mzcatalog-share-overlay',
        };
        this.options = $.extend({}, defaults, options);
        this.button = $(button);
    };

    ShareProduct.prototype.getEndpointUrl = function() {
        return this.button.attr('href');
    }

    ShareProduct.prototype.getOption = function(o) {
        return this.options[o];
    }

    ShareProduct.prototype.loadOverlay = function() {
        var self = this;

        var getOverlay = function(id) {
            var overlay = $('#' + id);
            if (overlay.length == 0) {
                overlay = $('<div />').attr('id', id).appendTo('body');
            }
            return overlay;
        };

        $.get(self.getEndpointUrl(), {}, function(data) {
            $(window).scrollTop(0);
            var overlayId = self.getOption('overlayId');
            getOverlay(overlayId).html(data);
            mzoverlay.open(overlayId, {'modal': false});
            mzoverlay.doRepositioning();
        }, 'html');
    }

    $(document).ready(function() {
        var buttonSelector = '.product-view .social-icons .mail';
        $(buttonSelector).click(function(e) {
            e.preventDefault();            
            var popup = new ShareProduct(this);
            popup.loadOverlay();
        });
    });
})(jQuery);

