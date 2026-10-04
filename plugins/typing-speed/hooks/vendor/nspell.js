// nspell 2.1.5 (MIT, https://github.com/wooorm/nspell), bundled by scripts/vendor-spell.mjs.
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/is-buffer/index.js
var require_is_buffer = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/is-buffer/index.js"(exports, module) {
    module.exports = function isBuffer(obj) {
      return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    };
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/rule-codes.js
var require_rule_codes = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/rule-codes.js"(exports, module) {
    "use strict";
    module.exports = ruleCodes;
    var NO_CODES = [];
    function ruleCodes(flags, value) {
      var index = 0;
      var result;
      if (!value) return NO_CODES;
      if (flags.FLAG === "long") {
        result = new Array(Math.ceil(value.length / 2));
        while (index < value.length) {
          result[index / 2] = value.slice(index, index + 2);
          index += 2;
        }
        return result;
      }
      return value.split(flags.FLAG === "num" ? "," : "");
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/affix.js
var require_affix = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/affix.js"(exports, module) {
    "use strict";
    var parse = require_rule_codes();
    module.exports = affix;
    var push = [].push;
    var alphabet = "etaoinshrdlcumwfgypbvkjxqz".split("");
    var whiteSpaceExpression = /\s+/;
    var defaultKeyboardLayout = [
      "qwertzuop",
      "yxcvbnm",
      "qaw",
      "say",
      "wse",
      "dsx",
      "sy",
      "edr",
      "fdc",
      "dx",
      "rft",
      "gfv",
      "fc",
      "tgz",
      "hgb",
      "gv",
      "zhu",
      "jhn",
      "hb",
      "uji",
      "kjm",
      "jn",
      "iko",
      "lkm"
    ];
    function affix(doc) {
      var rules = /* @__PURE__ */ Object.create(null);
      var compoundRuleCodes = /* @__PURE__ */ Object.create(null);
      var flags = /* @__PURE__ */ Object.create(null);
      var replacementTable = [];
      var conversion = { in: [], out: [] };
      var compoundRules = [];
      var aff = doc.toString("utf8");
      var lines = [];
      var last = 0;
      var index = aff.indexOf("\n");
      var parts;
      var line;
      var ruleType;
      var count;
      var remove;
      var add;
      var source;
      var entry;
      var position;
      var rule;
      var value;
      var offset;
      var character;
      flags.KEY = [];
      while (index > -1) {
        pushLine(aff.slice(last, index));
        last = index + 1;
        index = aff.indexOf("\n", last);
      }
      pushLine(aff.slice(last));
      index = -1;
      while (++index < lines.length) {
        line = lines[index];
        parts = line.split(whiteSpaceExpression);
        ruleType = parts[0];
        if (ruleType === "REP") {
          count = index + parseInt(parts[1], 10);
          while (++index <= count) {
            parts = lines[index].split(whiteSpaceExpression);
            replacementTable.push([parts[1], parts[2]]);
          }
          index--;
        } else if (ruleType === "ICONV" || ruleType === "OCONV") {
          count = index + parseInt(parts[1], 10);
          entry = conversion[ruleType === "ICONV" ? "in" : "out"];
          while (++index <= count) {
            parts = lines[index].split(whiteSpaceExpression);
            entry.push([new RegExp(parts[1], "g"), parts[2]]);
          }
          index--;
        } else if (ruleType === "COMPOUNDRULE") {
          count = index + parseInt(parts[1], 10);
          while (++index <= count) {
            rule = lines[index].split(whiteSpaceExpression)[1];
            position = -1;
            compoundRules.push(rule);
            while (++position < rule.length) {
              compoundRuleCodes[rule.charAt(position)] = [];
            }
          }
          index--;
        } else if (ruleType === "PFX" || ruleType === "SFX") {
          count = index + parseInt(parts[3], 10);
          rule = {
            type: ruleType,
            combineable: parts[2] === "Y",
            entries: []
          };
          rules[parts[1]] = rule;
          while (++index <= count) {
            parts = lines[index].split(whiteSpaceExpression);
            remove = parts[2];
            add = parts[3].split("/");
            source = parts[4];
            entry = {
              add: "",
              remove: "",
              match: "",
              continuation: parse(flags, add[1])
            };
            if (add && add[0] !== "0") {
              entry.add = add[0];
            }
            try {
              if (remove !== "0") {
                entry.remove = ruleType === "SFX" ? end(remove) : remove;
              }
              if (source && source !== ".") {
                entry.match = ruleType === "SFX" ? end(source) : start(source);
              }
            } catch (_) {
              entry = null;
            }
            if (entry) {
              rule.entries.push(entry);
            }
          }
          index--;
        } else if (ruleType === "TRY") {
          source = parts[1];
          offset = -1;
          value = [];
          while (++offset < source.length) {
            character = source.charAt(offset);
            if (character.toLowerCase() === character) {
              value.push(character);
            }
          }
          offset = -1;
          while (++offset < alphabet.length) {
            if (source.indexOf(alphabet[offset]) < 0) {
              value.push(alphabet[offset]);
            }
          }
          flags[ruleType] = value;
        } else if (ruleType === "KEY") {
          push.apply(flags[ruleType], parts[1].split("|"));
        } else if (ruleType === "COMPOUNDMIN") {
          flags[ruleType] = Number(parts[1]);
        } else if (ruleType === "ONLYINCOMPOUND") {
          flags[ruleType] = parts[1];
          compoundRuleCodes[parts[1]] = [];
        } else if (ruleType === "FLAG" || ruleType === "KEEPCASE" || ruleType === "NOSUGGEST" || ruleType === "WORDCHARS") {
          flags[ruleType] = parts[1];
        } else {
          flags[ruleType] = parts[1];
        }
      }
      if (isNaN(flags.COMPOUNDMIN)) {
        flags.COMPOUNDMIN = 3;
      }
      if (!flags.KEY.length) {
        flags.KEY = defaultKeyboardLayout;
      }
      if (!flags.TRY) {
        flags.TRY = alphabet.concat();
      }
      if (!flags.KEEPCASE) {
        flags.KEEPCASE = false;
      }
      return {
        compoundRuleCodes,
        replacementTable,
        conversion,
        compoundRules,
        rules,
        flags
      };
      function pushLine(line2) {
        line2 = line2.trim();
        if (line2 && line2.charCodeAt(0) !== 35) {
          lines.push(line2);
        }
      }
    }
    function end(source) {
      return new RegExp(source + "$");
    }
    function start(source) {
      return new RegExp("^" + source);
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/normalize.js
var require_normalize = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/normalize.js"(exports, module) {
    "use strict";
    module.exports = normalize;
    function normalize(value, patterns) {
      var index = -1;
      while (++index < patterns.length) {
        value = value.replace(patterns[index][0], patterns[index][1]);
      }
      return value;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/flag.js
var require_flag = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/flag.js"(exports, module) {
    "use strict";
    module.exports = flag;
    function flag(values, value, flags) {
      return flags && value in values && flags.indexOf(values[value]) > -1;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/exact.js
var require_exact = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/exact.js"(exports, module) {
    "use strict";
    var flag = require_flag();
    module.exports = exact;
    function exact(context, value) {
      var index = -1;
      if (context.data[value]) {
        return !flag(context.flags, "ONLYINCOMPOUND", context.data[value]);
      }
      if (value.length >= context.flags.COMPOUNDMIN) {
        while (++index < context.compoundRules.length) {
          if (context.compoundRules[index].test(value)) {
            return true;
          }
        }
      }
      return false;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/form.js
var require_form = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/form.js"(exports, module) {
    "use strict";
    var normalize = require_normalize();
    var exact = require_exact();
    var flag = require_flag();
    module.exports = form;
    function form(context, value, all) {
      var normal = value.trim();
      var alternative;
      if (!normal) {
        return null;
      }
      normal = normalize(normal, context.conversion.in);
      if (exact(context, normal)) {
        if (!all && flag(context.flags, "FORBIDDENWORD", context.data[normal])) {
          return null;
        }
        return normal;
      }
      if (normal.toUpperCase() === normal) {
        alternative = normal.charAt(0) + normal.slice(1).toLowerCase();
        if (ignore(context.flags, context.data[alternative], all)) {
          return null;
        }
        if (exact(context, alternative)) {
          return alternative;
        }
      }
      alternative = normal.toLowerCase();
      if (alternative !== normal) {
        if (ignore(context.flags, context.data[alternative], all)) {
          return null;
        }
        if (exact(context, alternative)) {
          return alternative;
        }
      }
      return null;
    }
    function ignore(flags, dict, all) {
      return flag(flags, "KEEPCASE", dict) || all || flag(flags, "FORBIDDENWORD", dict);
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/correct.js
var require_correct = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/correct.js"(exports, module) {
    "use strict";
    var form = require_form();
    module.exports = correct;
    function correct(value) {
      return Boolean(form(this, value));
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/casing.js
var require_casing = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/casing.js"(exports, module) {
    "use strict";
    module.exports = casing;
    function casing(value) {
      var head = exact(value.charAt(0));
      var rest = value.slice(1);
      if (!rest) {
        return head;
      }
      rest = exact(rest);
      if (head === rest) {
        return head;
      }
      if (head === "u" && rest === "l") {
        return "s";
      }
      return null;
    }
    function exact(value) {
      return value === value.toLowerCase() ? "l" : value === value.toUpperCase() ? "u" : null;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/suggest.js
var require_suggest = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/suggest.js"(exports, module) {
    "use strict";
    var casing = require_casing();
    var normalize = require_normalize();
    var flag = require_flag();
    var form = require_form();
    module.exports = suggest;
    var push = [].push;
    function suggest(value) {
      var self = this;
      var charAdded = {};
      var suggestions = [];
      var weighted = {};
      var memory;
      var replacement;
      var edits = [];
      var values;
      var index;
      var offset;
      var position;
      var count;
      var otherOffset;
      var otherCharacter;
      var character;
      var group;
      var before;
      var after;
      var upper;
      var insensitive;
      var firstLevel;
      var previous;
      var next;
      var nextCharacter;
      var max;
      var distance;
      var size;
      var normalized;
      var suggestion;
      var currentCase;
      value = normalize(value.trim(), self.conversion.in);
      if (!value || self.correct(value)) {
        return [];
      }
      currentCase = casing(value);
      index = -1;
      while (++index < self.replacementTable.length) {
        replacement = self.replacementTable[index];
        offset = value.indexOf(replacement[0]);
        while (offset > -1) {
          edits.push(value.replace(replacement[0], replacement[1]));
          offset = value.indexOf(replacement[0], offset + 1);
        }
      }
      index = -1;
      while (++index < value.length) {
        character = value.charAt(index);
        before = value.slice(0, index);
        after = value.slice(index + 1);
        insensitive = character.toLowerCase();
        upper = insensitive !== character;
        charAdded = {};
        offset = -1;
        while (++offset < self.flags.KEY.length) {
          group = self.flags.KEY[offset];
          position = group.indexOf(insensitive);
          if (position < 0) {
            continue;
          }
          otherOffset = -1;
          while (++otherOffset < group.length) {
            if (otherOffset !== position) {
              otherCharacter = group.charAt(otherOffset);
              if (charAdded[otherCharacter]) {
                continue;
              }
              charAdded[otherCharacter] = true;
              if (upper) {
                otherCharacter = otherCharacter.toUpperCase();
              }
              edits.push(before + otherCharacter + after);
            }
          }
        }
      }
      index = -1;
      nextCharacter = value.charAt(0);
      values = [""];
      max = 1;
      distance = 0;
      while (++index < value.length) {
        character = nextCharacter;
        nextCharacter = value.charAt(index + 1);
        before = value.slice(0, index);
        replacement = character === nextCharacter ? "" : character + character;
        offset = -1;
        count = values.length;
        while (++offset < count) {
          if (offset <= max) {
            values.push(values[offset] + replacement);
          }
          values[offset] += character;
        }
        if (++distance < 3) {
          max = values.length;
        }
      }
      push.apply(edits, values);
      values = [value];
      replacement = value.toLowerCase();
      if (value === replacement || currentCase === null) {
        values.push(value.charAt(0).toUpperCase() + replacement.slice(1));
      }
      replacement = value.toUpperCase();
      if (value !== replacement) {
        values.push(replacement);
      }
      memory = {
        state: {},
        weighted,
        suggestions
      };
      firstLevel = generate(self, memory, values, edits);
      previous = 0;
      max = Math.min(firstLevel.length, Math.pow(Math.max(15 - value.length, 3), 3));
      size = Math.max(Math.pow(10 - value.length, 3), 1);
      while (!suggestions.length && previous < max) {
        next = previous + size;
        generate(self, memory, firstLevel.slice(previous, next));
        previous = next;
      }
      suggestions.sort(sort);
      values = [];
      normalized = [];
      index = -1;
      while (++index < suggestions.length) {
        suggestion = normalize(suggestions[index], self.conversion.out);
        replacement = suggestion.toLowerCase();
        if (normalized.indexOf(replacement) < 0) {
          values.push(suggestion);
          normalized.push(replacement);
        }
      }
      return values;
      function sort(a, b) {
        return sortWeight(a, b) || sortCasing(a, b) || sortAlpha(a, b);
      }
      function sortWeight(a, b) {
        return weighted[a] === weighted[b] ? 0 : weighted[a] > weighted[b] ? -1 : 1;
      }
      function sortCasing(a, b) {
        var leftCasing = casing(a);
        var rightCasing = casing(b);
        return leftCasing === rightCasing ? 0 : leftCasing === currentCase ? -1 : rightCasing === currentCase ? 1 : void 0;
      }
      function sortAlpha(a, b) {
        return a.localeCompare(b);
      }
    }
    function generate(context, memory, words, edits) {
      var characters = context.flags.TRY;
      var data = context.data;
      var flags = context.flags;
      var result = [];
      var index = -1;
      var word;
      var before;
      var character;
      var nextCharacter;
      var nextAfter;
      var nextNextAfter;
      var nextUpper;
      var currentCase;
      var position;
      var after;
      var upper;
      var inject;
      var offset;
      if (edits) {
        while (++index < edits.length) {
          check(edits[index], true);
        }
      }
      index = -1;
      while (++index < words.length) {
        word = words[index];
        before = "";
        character = "";
        nextCharacter = word.charAt(0);
        nextAfter = word;
        nextNextAfter = word.slice(1);
        nextUpper = nextCharacter.toLowerCase() !== nextCharacter;
        currentCase = casing(word);
        position = -1;
        while (++position <= word.length) {
          before += character;
          after = nextAfter;
          nextAfter = nextNextAfter;
          nextNextAfter = nextAfter.slice(1);
          character = nextCharacter;
          nextCharacter = word.charAt(position + 1);
          upper = nextUpper;
          if (nextCharacter) {
            nextUpper = nextCharacter.toLowerCase() !== nextCharacter;
          }
          if (nextAfter && upper !== nextUpper) {
            check(before + switchCase(nextAfter));
            check(
              before + switchCase(nextCharacter) + switchCase(character) + nextNextAfter
            );
          }
          check(before + nextAfter);
          if (nextAfter) {
            check(before + nextCharacter + character + nextNextAfter);
          }
          offset = -1;
          while (++offset < characters.length) {
            inject = characters[offset];
            if (upper && inject !== inject.toUpperCase()) {
              if (currentCase !== "s") {
                check(before + inject + after);
                check(before + inject + nextAfter);
              }
              inject = inject.toUpperCase();
              check(before + inject + after);
              check(before + inject + nextAfter);
            } else {
              check(before + inject + after);
              check(before + inject + nextAfter);
            }
          }
        }
      }
      return result;
      function check(value, double) {
        var state = memory.state[value];
        var corrected;
        if (state !== Boolean(state)) {
          result.push(value);
          corrected = form(context, value);
          state = corrected && !flag(flags, "NOSUGGEST", data[corrected]);
          memory.state[value] = state;
          if (state) {
            memory.weighted[value] = double ? 10 : 0;
            memory.suggestions.push(value);
          }
        }
        if (state) {
          memory.weighted[value]++;
        }
      }
      function switchCase(fragment) {
        var first = fragment.charAt(0);
        return (first.toLowerCase() === first ? first.toUpperCase() : first.toLowerCase()) + fragment.slice(1);
      }
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/spell.js
var require_spell = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/spell.js"(exports, module) {
    "use strict";
    var form = require_form();
    var flag = require_flag();
    module.exports = spell;
    function spell(word) {
      var self = this;
      var value = form(self, word, true);
      return {
        correct: self.correct(word),
        forbidden: Boolean(
          value && flag(self.flags, "FORBIDDENWORD", self.data[value])
        ),
        warn: Boolean(value && flag(self.flags, "WARN", self.data[value]))
      };
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/apply.js
var require_apply = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/apply.js"(exports, module) {
    "use strict";
    module.exports = apply;
    function apply(value, rule, rules, words) {
      var index = -1;
      var entry;
      var next;
      var continuationRule;
      var continuation;
      var position;
      while (++index < rule.entries.length) {
        entry = rule.entries[index];
        continuation = entry.continuation;
        position = -1;
        if (!entry.match || entry.match.test(value)) {
          next = entry.remove ? value.replace(entry.remove, "") : value;
          next = rule.type === "SFX" ? next + entry.add : entry.add + next;
          words.push(next);
          if (continuation && continuation.length) {
            while (++position < continuation.length) {
              continuationRule = rules[continuation[position]];
              if (continuationRule) {
                apply(next, continuationRule, rules, words);
              }
            }
          }
        }
      }
      return words;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/add.js
var require_add = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/add.js"(exports, module) {
    "use strict";
    var apply = require_apply();
    module.exports = add;
    var push = [].push;
    var NO_RULES = [];
    function addRules(dict, word, rules) {
      var curr = dict[word];
      if (word in dict) {
        if (curr === NO_RULES) {
          dict[word] = rules.concat();
        } else {
          push.apply(curr, rules);
        }
      } else {
        dict[word] = rules.concat();
      }
    }
    function add(dict, word, codes, options) {
      var position = -1;
      var rule;
      var offset;
      var subposition;
      var suboffset;
      var combined;
      var newWords;
      var otherNewWords;
      if (!("NEEDAFFIX" in options.flags) || codes.indexOf(options.flags.NEEDAFFIX) < 0) {
        addRules(dict, word, codes);
      }
      while (++position < codes.length) {
        rule = options.rules[codes[position]];
        if (codes[position] in options.compoundRuleCodes) {
          options.compoundRuleCodes[codes[position]].push(word);
        }
        if (rule) {
          newWords = apply(word, rule, options.rules, []);
          offset = -1;
          while (++offset < newWords.length) {
            if (!(newWords[offset] in dict)) {
              dict[newWords[offset]] = NO_RULES;
            }
            if (rule.combineable) {
              subposition = position;
              while (++subposition < codes.length) {
                combined = options.rules[codes[subposition]];
                if (combined && combined.combineable && rule.type !== combined.type) {
                  otherNewWords = apply(
                    newWords[offset],
                    combined,
                    options.rules,
                    []
                  );
                  suboffset = -1;
                  while (++suboffset < otherNewWords.length) {
                    if (!(otherNewWords[suboffset] in dict)) {
                      dict[otherNewWords[suboffset]] = NO_RULES;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/add.js
var require_add2 = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/add.js"(exports, module) {
    "use strict";
    var push = require_add();
    module.exports = add;
    var NO_CODES = [];
    function add(value, model) {
      var self = this;
      push(self.data, value, self.data[model] || NO_CODES, self);
      return self;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/remove.js
var require_remove = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/remove.js"(exports, module) {
    "use strict";
    module.exports = remove;
    function remove(value) {
      var self = this;
      delete self.data[value];
      return self;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/word-characters.js
var require_word_characters = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/word-characters.js"(exports, module) {
    "use strict";
    module.exports = wordCharacters;
    function wordCharacters() {
      return this.flags.WORDCHARS || null;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/dictionary.js
var require_dictionary = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/util/dictionary.js"(exports, module) {
    "use strict";
    var parseCodes = require_rule_codes();
    var add = require_add();
    module.exports = parse;
    var whiteSpaceExpression = /\s/g;
    function parse(buf, options, dict) {
      var value = buf.toString("utf8");
      var last = value.indexOf("\n") + 1;
      var index = value.indexOf("\n", last);
      while (index > -1) {
        if (value.charCodeAt(last) !== 9) {
          parseLine(value.slice(last, index), options, dict);
        }
        last = index + 1;
        index = value.indexOf("\n", last);
      }
      parseLine(value.slice(last), options, dict);
    }
    function parseLine(line, options, dict) {
      var slashOffset = line.indexOf("/");
      var hashOffset = line.indexOf("#");
      var codes = "";
      var word;
      var result;
      while (slashOffset > -1 && line.charCodeAt(slashOffset - 1) === 92) {
        line = line.slice(0, slashOffset - 1) + line.slice(slashOffset);
        slashOffset = line.indexOf("/", slashOffset);
      }
      if (hashOffset > -1) {
        if (slashOffset > -1 && slashOffset < hashOffset) {
          word = line.slice(0, slashOffset);
          whiteSpaceExpression.lastIndex = slashOffset + 1;
          result = whiteSpaceExpression.exec(line);
          codes = line.slice(slashOffset + 1, result ? result.index : void 0);
        } else {
          word = line.slice(0, hashOffset);
        }
      } else if (slashOffset > -1) {
        word = line.slice(0, slashOffset);
        codes = line.slice(slashOffset + 1);
      } else {
        word = line;
      }
      word = word.trim();
      if (word) {
        add(dict, word, parseCodes(options.flags, codes.trim()), options);
      }
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/dictionary.js
var require_dictionary2 = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/dictionary.js"(exports, module) {
    "use strict";
    var parse = require_dictionary();
    module.exports = add;
    function add(buf) {
      var self = this;
      var index = -1;
      var rule;
      var source;
      var character;
      var offset;
      parse(buf, self, self.data);
      while (++index < self.compoundRules.length) {
        rule = self.compoundRules[index];
        source = "";
        offset = -1;
        while (++offset < rule.length) {
          character = rule.charAt(offset);
          source += self.compoundRuleCodes[character].length ? "(?:" + self.compoundRuleCodes[character].join("|") + ")" : character;
        }
        self.compoundRules[index] = new RegExp(source, "i");
      }
      return self;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/personal.js
var require_personal = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/personal.js"(exports, module) {
    "use strict";
    module.exports = add;
    function add(buf) {
      var self = this;
      var lines = buf.toString("utf8").split("\n");
      var index = -1;
      var line;
      var forbidden;
      var word;
      var flag;
      if (self.flags.FORBIDDENWORD === void 0) self.flags.FORBIDDENWORD = false;
      flag = self.flags.FORBIDDENWORD;
      while (++index < lines.length) {
        line = lines[index].trim();
        if (!line) {
          continue;
        }
        line = line.split("/");
        word = line[0];
        forbidden = word.charAt(0) === "*";
        if (forbidden) {
          word = word.slice(1);
        }
        self.add(word, line[1]);
        if (forbidden) {
          self.data[word].push(flag);
        }
      }
      return self;
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/index.js
var require_lib = __commonJS({
  "../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/node_modules/nspell/lib/index.js"(exports, module) {
    "use strict";
    var buffer = require_is_buffer();
    var affix = require_affix();
    module.exports = NSpell;
    var proto = NSpell.prototype;
    proto.correct = require_correct();
    proto.suggest = require_suggest();
    proto.spell = require_spell();
    proto.add = require_add2();
    proto.remove = require_remove();
    proto.wordCharacters = require_word_characters();
    proto.dictionary = require_dictionary2();
    proto.personal = require_personal();
    function NSpell(aff, dic) {
      var index = -1;
      var dictionaries;
      if (!(this instanceof NSpell)) {
        return new NSpell(aff, dic);
      }
      if (typeof aff === "string" || buffer(aff)) {
        if (typeof dic === "string" || buffer(dic)) {
          dictionaries = [{ dic }];
        }
      } else if (aff) {
        if ("length" in aff) {
          dictionaries = aff;
          aff = aff[0] && aff[0].aff;
        } else {
          if (aff.dic) {
            dictionaries = [aff];
          }
          aff = aff.aff;
        }
      }
      if (!aff) {
        throw new Error("Missing `aff` in dictionary");
      }
      aff = affix(aff);
      this.data = /* @__PURE__ */ Object.create(null);
      this.compoundRuleCodes = aff.compoundRuleCodes;
      this.replacementTable = aff.replacementTable;
      this.conversion = aff.conversion;
      this.compoundRules = aff.compoundRules;
      this.rules = aff.rules;
      this.flags = aff.flags;
      if (dictionaries) {
        while (++index < dictionaries.length) {
          if (dictionaries[index].dic) {
            this.dictionary(dictionaries[index].dic);
          }
        }
      }
    }
  }
});

// ../../../../../../private/var/folders/jv/0bssmjcs5yjcjhnptd_623p80000gn/T/typing-speed-vendor-w3plFi/entry.js
var import_nspell = __toESM(require_lib());
var export_default = import_nspell.default;
export {
  export_default as default
};
