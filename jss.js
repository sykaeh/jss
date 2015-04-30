/*
 * JSS v1.0 - JavaScript Stylesheets
 * https://github.com/sykaeh/jss
 *
 * Copyright (c) 2015, Sybil Ehrensberger
 * Copyright (c) 2011, David Tang
 * MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
 */
(function() {
    var adjSelAttrRegex = /((?:\.|#)[^\.\s#]+)((?:\.|#)[^\.\s#]+)/g;
    var doubleColonPseudoElRegex = /(::)(before|after|first-line|first-letter|selection)/;
    var singleColonPseudoElRegex = /([^:])(:)(before|after|first-line|first-letter|selection)/;
    var singleColonForPseudoElements; // flag for older browsers

    function getSelectorsAndRules(sheet) {
        var rules = sheet.cssRules || sheet.rules || [];
        var results = {};
        for (var i = 0; i < rules.length; i++) {
            // Older browsers and FF report pseudo element selectors in an outdated format

            // FIXME: selectorText is not always present, since it might be a CSSMediaRule and not a CSSStyleRule
            // eg. @media print { .label { border: 1 px solid black; } }
            // For now, I'm just skipping media rules
            if (typeof rules[i].selectorText === 'undefined') {
                continue;
            }

            var selectorText = toDoubleColonPseudoElements(rules[i].selectorText);
            if (!results[selectorText]) {
                results[selectorText] = [];
            }
            results[selectorText].push({
                sheet: sheet,
                index: i,
                style: rules[i].style
            });
        }
        return results;
    }

    function getRules(sheet, selector) {
        var rules = sheet.cssRules || sheet.rules || [];
        var results = [];
        // Browsers report selectors in lowercase
        selector = selector.toLowerCase();
        for (var i = 0; i < rules.length; i++) {
            var selectorText = rules[i].selectorText;

            // FIXME: selectorText is not always present, since it might be a CSSMediaRule and not a CSSStyleRule
            // eg. @media print { .label { border: 1 px solid black; } }
            // For now, I'm just skipping media rules
            if (typeof selectorText === 'undefined') {
                continue;
            }

            // Note - certain rules (e.g. @rules) don't have selectorText
            if (selectorText && (selectorText === selector ||
                selectorText === swapAdjSelAttr(selector) ||
                selectorText === swapPseudoElSyntax(selector))) {
                results.push({
                    sheet: sheet,
                    index: i,
                    style: rules[i].style
                });
            }
        }
        return results;
    }

    function getCSSTexts(sheet) {
        var rules = sheet.cssRules || sheet.rules || [];
        var cssTexts = [];
        for (var i = 0; i < rules.length; i++) {
            cssTexts.push(rules[i].cssText);
        }
        return cssTexts.join('\n');
    }

    function addRule(sheet, selector) {
        var rules = sheet.cssRules || sheet.rules || [];
        var index = rules.length;
        var pseudoElementRule = addPseudoElementRule(sheet, selector, rules, index);

        if (!pseudoElementRule) {
            addRuleToSheet(sheet, selector, index);
        }

        return {
            sheet: sheet,
            index: index,
            style: rules[index].style
        };
    }

    function addRuleToSheet(sheet, selector, index) {
        if (sheet.insertRule) {
            sheet.insertRule(selector + ' { }', index);
        } else {
            sheet.addRule(selector, null, index);
        }
    }

    // Handles single colon syntax for older browsers and bugzilla.mozilla.org/show_bug.cgi?id=949651
    function addPseudoElementRule(sheet, selector, rules, index) {
        var doubleColonSelector;
        var singleColonSelector;

        if (doubleColonPseudoElRegex.exec(selector)) {
            doubleColonSelector = selector;
            singleColonSelector = toSingleColonPseudoElements(selector);
        } else if (singleColonPseudoElRegex.exec(selector)) {
            doubleColonSelector = toDoubleColonPseudoElements(selector);
            singleColonSelector = selector;
        } else {
            return false; // Not dealing with a pseudo element
        }

        if (!singleColonForPseudoElements) {
            // Assume modern browser and then check if successful
            addRuleToSheet(sheet, doubleColonSelector, index);
            if (rules.length <= index) {
                singleColonForPseudoElements = true;
            }
        }
        if (singleColonForPseudoElements) {
            addRuleToSheet(sheet, singleColonSelector, index);
        }

        return true;
    }

    function toDoubleColonPseudoElements(selector) {
        return selector.replace(singleColonPseudoElRegex, function (match, submatch1, submatch2, submatch3) {
            return submatch1 + '::' + submatch3;
        });
    }

    function toSingleColonPseudoElements(selector) {
        return selector.replace(doubleColonPseudoElRegex, function(match, submatch1, submatch2) {
            return ':' + submatch2;
        });
    }

    function removeRule(rule) {
        var sheet = rule.sheet;
        if (sheet.deleteRule) {
            sheet.deleteRule(rule.index);
        } else if (sheet.removeRule) {
            sheet.removeRule(rule.index);
        }
    }

    function extend(dest, src) {
        for (var key in src) {
            if (!src.hasOwnProperty(key)) {
              continue;
            }
            dest[key] = src[key];
        }
        return dest;
    }


    function dealWithDirections(top, right, bottom, left) {
      if (top === bottom && left === right && top === right) {
        return [top]; // 1 value
      } else if (top === bottom && left === right) {
        return [top, right];
      } else if (left === right) {
        return [top, right, bottom];
      } else {
        return [top, right, bottom, left];
      }
    }

    function borderProperties(properties, propertyName) {
      var top, bottom, left, right;
      var index = propertyName.indexOf('-');
      top = properties[propertyName.substring(0, index) + '-top' + propertyName.substr(index)];
      bottom = properties[propertyName.substring(0, index) + '-bottom' + propertyName.substr(index)];
      left = properties[propertyName.substring(0, index) + '-left' + propertyName.substr(index)];
      right = properties[propertyName.substring(0, index) + '-right' + propertyName.substr(index)];

      return dealWithDirections(top, bottom, left, right);

    }

    function getProperty(properties, propertyName) {

      // FIXME: Finish implementing
      // deal with shorthand properties (https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties):
      // background, font, margin, border, border-top, border-right, border-bottom,
      // border-left, border-width, border-color, border-style, transition, padding, list-style, border-radius
      // transform is technically a shorthand property, but not like the others
      var top, bottom, left, right, width, style, color;
      var value = properties[propertyName];
      switch(propertyName) {
        case 'margin':
        case 'padding':
          top = properties[propertyName + '-top'];
          bottom = properties[propertyName + '-bottom'];
          left = properties[propertyName + '-left'];
          right = properties[propertyName + '-right'];
          value = dealWithDirections(top, right, bottom, left).join(' ');
          break;

        // width || style || color; since border-width, border-style and border-color
        // are shorthand properties themselves, need an extra step and it is
        // only possible if all edges are set the same
        case 'border':
          width = borderProperties(properties, 'border-width');
          style = borderProperties(properties, 'border-style');
          color = borderProperties(properties, 'border-color');

          if (color.length === 1 && style.length === 1 && width.length === 1) {
            value = width[0] + ' ' + style[0] + ' ' + color[0];
          } else if (width.length === 1 && style.length === 1) {
            value = width[0] + ' ' + style[0];
          } else if (width.length === 1) {
            value = width[0];
          }
          break;

        // width || style || color
        case 'border-top':
        case 'border-left':
        case 'border-right':
        case 'border-bottom':
          width = properties[propertyName + '-width'];
          style = properties[propertyName + '-style'];
          color = properties[propertyName + '-color'];

          if (width && color && style) {
            value = width + ' ' + style + ' ' + color;
          } else if (width && style) {
            value = width + ' ' + style;
          } else if (width) {
            value = width;
          }
          break;

        // border-top-width, border-right-width, border-bottom-width, border-left-width
        case 'border-width':
        case 'border-style':
        case 'border-color':
          value = borderProperties(properties, propertyName).join(' ');
          break;

        case 'border-radius':
          break;

        case 'background':
          break;

        case 'font':
          break;

        case 'transition':
          break;

        default:
          value = properties[propertyName];
      }

      return value;
    }

    function aggregateStyles(rules) {
        var aggregate = {};
        for (var i = 0; i < rules.length; i++) {
            extend(aggregate, declaredProperties(rules[i].style));
        }
        return aggregate;
    }

    function declaredProperties(style) {
        var declared = {};
        for (var i = 0; i < style.length; i++) {
            declared[style[i]] = style[toCamelCase(style[i])];
        }
        return declared;
    }

    // IE9 stores rules with attributes (classes or ID's) adjacent in the opposite order as defined
    // causing them to not be found, so this method swaps [#|.]sel1[#|.]sel2 to become [#|.]sel2[#|.]sel1
    function swapAdjSelAttr(selector) {
        var swap = '';
        var lastIndex = 0;
        var match;
        while ((match = adjSelAttrRegex.exec(selector)) !== null) {
            if (match[0] === '') {
                break;
            }
            swap += selector.substring(lastIndex, match.index);
            swap += selector.substr(match.index + match[1].length, match[2].length);
            swap += selector.substr(match.index, match[1].length);
            lastIndex = match.index + match[0].length;
        }
        swap += selector.substr(lastIndex);

        return swap;
    }

    // FF and older browsers store rules with pseudo elements using single-colon syntax
    function swapPseudoElSyntax(selector) {
        if (doubleColonPseudoElRegex.exec(selector)) {
            return toSingleColonPseudoElements(selector);
        }
        return selector;
    }

    function setStyleProperties(rule, properties) {
        for (var key in properties) {
            var value = properties[key];
            var importantIndex = value.indexOf(' !important');

            // Modern browsers seem to handle overrides fine, but IE9 doesn't
            rule.style.removeProperty(key);
            if (importantIndex > 0) {
                rule.style.setProperty(key, value.substr(0, importantIndex), 'important');
            } else {
                rule.style.setProperty(key, value);
            }
        }
    }

    function toCamelCase(str) {
        return str.replace(/-([a-z])/g, function (match, submatch) {
            return submatch.toUpperCase();
        });
    }

    function transformCamelCasedPropertyNames(oldProps) {
        var newProps = {};
        for (var key in oldProps) {
            newProps[unCamelCase(key)] = oldProps[key];
        }
        return newProps;
    }

    function unCamelCase(str) {
        return str.replace(/([A-Z])/g, function(match, submatch) {
            return '-' + submatch.toLowerCase();
        });
    }

    var Jss = function(doc) {
        this.doc = doc;
        this.head = this.doc.head || this.doc.getElementsByTagName('head')[0];
        this.sheets = this.doc.styleSheets || [];
    };

    Jss.prototype = {

        // Returns only JSS rules (selector is optional)
        get: function(selector) {

            this.defaultSheet = this._getDefaultSheet();

            if (selector) {
                return aggregateStyles(getRules(this.defaultSheet, selector));
            }
            var rules = getSelectorsAndRules(this.defaultSheet);
            for (selector in rules) {
                rules[selector] = aggregateStyles(rules[selector]);
            }
            return rules;
        },
        // Returns all rules (selector is required)
        getAll: function(selector) {
            var properties = {};
            for (var i = 0; i < this.sheets.length; i++) {
                extend(properties, aggregateStyles(getRules(this.sheets[i], selector)));
            }
            return properties;
        },
        getProperty: function(selector, propertyName) {
          return getProperty(this.getAll(selector), propertyName);
        },
        // Returns the style rules as text for each sheet along with the URL and node id
        exportSheets: function() {
            var contents = [];
            for (var i = 0; i < this.sheets.length; i++) {
                var s = this.sheets[i];
                var sh = { url: s.href, node_id: s.ownerNode.id, text: getCSSTexts(s)};
                contents.push(sh);
            }
            return contents;
        },
        // Adds JSS rules for the selector based on the given properties
        set: function(selector, properties) {
            this.defaultSheet = this._getDefaultSheet();

            properties = transformCamelCasedPropertyNames(properties);
            var rules = getRules(this.defaultSheet, selector);
            if (!rules.length) {
                rules = [addRule(this.defaultSheet, selector)];
            }
            for (var i = 0; i < rules.length; i++) {
                setStyleProperties(rules[i], properties);
            }
        },
        setProperty: function(selector, propertyName, propertyValue) {
          var properties = { };
          properties[propertyName] = propertyValue;
          this.set(selector, properties);
        },
        // Removes JSS rules (selector is optional)
        remove: function(selector) {
            this.defaultSheet = this._getDefaultSheet();

            if (!selector) {
                this._removeSheet(this.defaultSheet);
                delete this.defaultSheet;
                return;
            }
            var rules = getRules(this.defaultSheet, selector);
            for (var i = 0; i < rules.length; i++) {
                removeRule(rules[i]);
            }
            return rules.length;
        },
        removeProperty: function(selector, propertyName) {
          for (var i = 0; i < this.sheets.length; i++) {
              var rules = getRules(this.sheets[i], selector);
              if (rules.length > 0) {
                rules[0].style[propertyName] = '';
              }
          }
        },
        _getDefaultSheet: function() {
            var styleNode = this.doc.getElementById('jss-generated-styles');
            if (styleNode === null) {
                styleNode = this.doc.createElement('style');
                styleNode.type = 'text/css';
                styleNode.rel = 'stylesheet';
                styleNode.id = 'jss-generated-styles';
                this.head.appendChild(styleNode);
            }
            return styleNode.sheet;
        },
        _removeSheet: function(sheet) {
            var node = sheet.ownerNode;
            node.parentNode.removeChild(node);
        }
    };

    function jss(doc) {
      doc = doc || document;
      return new Jss(doc);
    }

    /* global exports: true, module, define */

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = jss;
        }
        exports.jss = jss;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('jss', function() {
            return jss;
        });
    }
    else {
        window.jss = jss;
    }

})();
