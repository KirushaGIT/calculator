window.onload = () => {
    const Calculator = createCalculator();
    Calculator.initCache();
    Calculator.initListeners();
};

const createCalculator = () => {
    let cal = {
        keyCodes: {
            0: '0',
            1: '1',
            2: '2',
            3: '3',
            4: '4',
            5: '5',
            6: '6',
            7: '7',
            8: '8',
            9: '9',
            10: '.',
            11: '±',
            12: '=',
            13: '+',
            14: '-',
            15: '*',
            16: '/',
            17: '%',
            18: '√',
            19: 'x2',
            20: '1/x',
            21: '(',
            22: ')',
            23: 'yroot',
            24: 'n!',
            25: 'exp',
            26: '^',
            27: 'sin',
            28: 'cos',
            29: 'tan',
            30: 'powten',
            31: 'log',
            32: 'sinh',
            33: 'cosh',
            34: 'tanh',
            35: 'π',
            36: '↑',
            37: 'CE',
            38: 'C',
            39: 'Back'
        },
        operatorFacade: {
            13: '+',
            14: '-',
            15: '×',
            16: '÷',
            17: '%',
            23: 'yroot',
            26: '^',
            46: '&',
            47: '|'
        },
        type: 1,
        typePrefix: {
            1: "std-",
            2: "sci-"
        },
        hasInited: {
            1: true,
            2: false
        },
        constants: {
            mouseHoverColor: "#CFCFCF",
            firstMouseOutColor: "#F2F2F2",
            mouseOutColor: "#E6E6E6"
        },
        cache: {
            showInput: null,
            preStep: null,
            scaleSpans: null
        },
        getShowInput: () => {
            return cal.cache.showInput.innerHTML;
        },
        setShowInput: (value) => {
            cal.cache.showInput.innerHTML = value;
        },
        getPreStep: () => {
            return cal.cache.preStep.innerHTML;
        },
        setPreStep: (value) => {
            cal.cache.preStep.innerHTML = value;
        },
        operandStack: [],
        operatorStack: [],
        isPreInputBinaryOperator: false,
        isPreInputUnaryOperator: false,
        isPreInputEquals: false,
        preResult: 0,
        currentScale: 10,
        isOverride: false,
        intPattern: /^-?\d+$/,
        floatPattern: /^-?\d+\.\d+$/,
        scientificPattern: /^\d+\.\d+e(\+|-)\d+$/,
        operatorPriority: {
            ")": 0,
            "|": 1,
            "&": 2,
            "+": 3,
            "-": 3,
            "*": 4,
            "%": 4,
            "/": 4,
            "^": 5,
            "yroot": 5,
            "(": 6
        },
        initCache: () => {
            let prefix = cal.typePrefix[cal.type];
            cal.cache.showInput = document.getElementById(prefix + "show-input");
            cal.cache.preStep = document.getElementById(prefix + "pre-step");
            if (cal.type == 3) {
                cal.cache.scaleSpans = document.getElementById("pro-scales").getElementsByTagName("span");
            }
        },
        listeners: {
            mouseHoverListener: (e) => {
                let event = e || window.event;
                event.currentTarget.style.backgroundColor = cal.constants.mouseHoverColor;
            },
            firstMouseOutListener: (e) => {
                let event = e || window.event;
                event.currentTarget.style.backgroundColor = cal.constants.firstMouseOutColor;
            },
            mouseOutListener: (e) => {
                let event = e || window.event;
                event.currentTarget.style.backgroundColor = cal.constants.mouseOutColor;
            },
            keyPressListener: (e) => {
                let event = e || window.event;
                cal.handleKey(event.currentTarget.value);
            },
            toggleTypeBarListener: () => {
                let bar = document.getElementById(cal.typePrefix[cal.type] + "type-bar");
                if (bar.style.display === "block") {
                    bar.style.display = "none";
                } else {
                    bar.style.display = "block";
                }
            },
            switchTypeListener: (e) => {
                let event = e || window.event;
                cal.switchType(parseInt(event.currentTarget.value));
            },
            switchScaleListener: (e) => {
                let event = e || window.event;
                let scales = document.getElementById("pro-scales").getElementsByTagName("div"),
                    scale = parseInt(event.currentTarget.getAttribute("scale")),
                    oldScale = cal.currentScale;
                for (let i = 0, l = scales.length; i < l; ++i) {
                    scales[i].removeAttribute("class");
                }
                event.currentTarget.setAttribute("class", "scale-active");
                let lis, btns;
                if (scale === 16) {
                    cal.listeners._initFirstRowListeners();
                    if (oldScale < 10) {
                        cal.listeners._initSecondRowListeners();
                    }
                } else if (scale === 10) {
                    if (oldScale === 16) {
                        lis = document.getElementById("pro-top-symbol").getElementsByTagName("li");
                        cal.disableButtons(lis, cal.listeners.firstMouseOutListener);
                    } else {
                        cal.listeners._initSecondRowListeners();
                    }
                } else if (scale === 8) {
                    if (oldScale > 8) {
                        lis = document.getElementById("pro-top-symbol").getElementsByTagName("li");
                        cal.disableButtons(lis, cal.listeners.firstMouseOutListener);
                        btns = cal.getElementsByAttribute("li", "oct-disable", document.getElementById("pro-num-symbol"));
                        cal.disableButtons(btns, cal.listeners.mouseOutListener);
                    } else {
                        cal.listeners._initSecondRowListeners();
                    }
                } else if (scale === 2) {
                    if (oldScale === 16) {
                        lis = document.getElementById("pro-top-symbol").getElementsByTagName("li");
                        cal.disableButtons(lis, cal.listeners.firstMouseOutListener);
                    }
                    btns = cal.getElementsByAttribute("li", "bin-disable", document.getElementById("pro-num-symbol"));
                    cal.disableButtons(btns, cal.listeners.mouseOutListener);
                }
                cal.currentScale = scale;
            },
            _initFirstRowListeners: () => {
                let lis = document.getElementById(cal.typePrefix[cal.type] + "top-symbol").getElementsByTagName("li");
                cal.rebuildButtons(lis, cal.listeners.firstMouseOutListener);
            },
            _initSecondRowListeners: () => {
                let lis = document.getElementById(cal.typePrefix[cal.type] + "num-symbol").getElementsByTagName("li");
                cal.rebuildButtons(lis, cal.listeners.mouseOutListener);
                if (cal.type === 3) {
                    cal.disableButtons([document.getElementById("pro-point")], cal.listeners.mouseOutListener);
                }
            }
        },
        initListeners: () => {
            let prefix = cal.typePrefix[cal.type];
            if (cal.type < 3) {
                cal.listeners._initFirstRowListeners();
            }
            cal.listeners._initSecondRowListeners();
            cal.addEvent(document.getElementById(prefix + "show-bar"), "click", cal.listeners.toggleTypeBarListener);
            let bar = document.getElementById(prefix + "type-bar");
            lis = bar.getElementsByTagName("li");
            let li;
            for (let i = 0, l = lis.length; i < l; ++i) {
                li = lis[i];
                if (li.className !== "active") {
                    cal.addEvent(li, "click", cal.listeners.switchTypeListener);
                }
            }
            if (cal.type === 3) {
                let scales = document.getElementById("pro-scales").getElementsByTagName("div"),
                    scale;
                for (i = 0, l = scales.length; i < l; ++i) {
                    scale = scales[i];
                    cal.addEvent(scale, "click", cal.listeners.switchScaleListener);
                }
            }
        },
        handleKey: (value) => {
            let keyCode = parseInt(value);
            if (keyCode < 11 || (keyCode > 39 && keyCode < 46)) {
                cal.showInput(cal.keyCodes[keyCode]);
                if (cal.type === 3) {
                    cal.showScales(cal.getShowInput());
                }
            } else {
                switch (keyCode) {
                    case 11:
                        cal.unaryOperate((oldValue) => {
                            oldValue += "";
                            if (oldValue === "0") {
                                return [oldValue];
                            }
                            if (oldValue.charAt(0) === '-') {
                                return [oldValue.substring(1)];
                            } else {
                                return ["-" + oldValue];
                            }
                        });
                        break;
                    case 18:
                        cal.unaryOperate((si) =>  {
                            return [Math.sqrt(si), "sqrt"];
                        });
                        break;
                    case 19:
                        cal.unaryOperate((si) =>  {
                            return [Math.pow(si, 2), "sqr"];
                        });
                        break;
                    case 20:
                        cal.unaryOperate((si) =>  {
                            return [si === 0 ? "error delete to zero" : 1 / si, "1/"];
                        });
                        break;
                    case 24:
                        cal.unaryOperate((si) =>  {
                            if (si < 0) {
                                si = (0 - si);
                            }
                            if (cal.isFloat(si + "")) {
                                si = Math.floor(si);
                            }
                            return [cal.fact(si), "fact"];
                        });
                        break;
                    case 25:
                        cal.unaryOperate((si) =>  {
                            return [si.toexponential(7)];
                        });
                        break;
                    case 27:
                        cal.unaryOperate((si) =>  {
                            return [Math.sin(si), "sin"];
                        });
                        break;
                        //cos
                    case 28:
                        cal.unaryOperate((si) =>  {
                            return [Math.cos(si), "cos"];
                        });
                        break;
                        //tan
                    case 29:
                        cal.unaryOperate((si) =>  {
                            return [Math.tan(si), "tan"];
                        });
                        break;
                    case 30:
                        cal.unaryOperate((si) =>  {
                            return [Math.pow(10, si), "powten"];
                        });
                        break;
                        //log
                    case 31:
                        cal.unaryOperate((si) =>  {
                            return [Math.log10(si), "log"];
                        });
                        break;
                        //sinh
                    case 32:
                        cal.unaryOperate((si) =>  {
                            return [Math.sinh(si), "sinh"];
                        });
                        break;
                        //cosh()
                    case 33:
                        cal.unaryOperate((si) =>  {
                            return [Math.cosh(si), "cosh"];
                        });
                        break;
                        //tanh()
                    case 34:
                        cal.unaryOperate((si) =>  {
                            return [Math.tanh(si), "tanh"];
                        });
                        break;
                        //π
                    case 35:
                        cal.unaryOperate((si) =>  {
                            return [Math.PI];
                        });
                        break;
                    case 48:
                        cal.unaryOperate((si) =>  {
                            let result = eval("~" + si);
                            cal.showScales(result);
                            return [result];
                        });
                        break;
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                    case 17:
                    case 26:
                    case 23:
                    case 46:
                    case 47:
                        if (cal.isPreInputBinaryOperator) {
                            break;
                        }
                        cal.isPreInputBinaryOperator = true;
                        cal.isOverride = true;
                        cal.binaryOperate(cal.keyCodes[keyCode], cal.operatorFacade[keyCode]);
                        break;
                    case 12:
                        cal.calculate();
                        break;
                        //ce
                    case 37:
                        cal.ce();
                        break;
                        //c
                    case 38:
                        cal.clear();
                        break;
                        //back
                    case 39:
                        cal.back();
                        break;
                        // (
                    case 21:
                        cal.setPreStep(cal.getPreStep() + " (");
                        cal.operatorStack.push("(");
                        break;
                        // )
                    case 22:
                        cal.rightTag();
                        break;
                    case 36:
                        cal.setShowInput(cal.preResult);
                        break;
                }
            }
        },
        unaryOperate: (operation) => {
            let si = cal.getShowInput(),
                result;
            if (cal.isInteger(si)) {
                result = operation(parseInt(si));
            } else if (cal.isFloat(si) || cal.isScientific(si)) {
                result = operation(parseFloat(si));
            }
            if (result != null) {
                cal.setShowInput(cal.checkLength(result[0]));
                if (result.length > 1) {
                    if (!cal.isPreInputUnaryOperator) {
                        cal.setPreStep(cal.getPreStep() + " " + result[1] + "(" + si + ")");
                        cal.isPreInputUnaryOperator = true;
                    } else {
                        let pi = cal.getPreStep();
                        pi = pi.substring(0, pi.lastIndexOf(" "));
                        pi += (" " + result[1] + "(" + si + ")");
                        cal.setPreStep(pi);
                    }
                }
                cal.isOverride = true;
            }
            cal.isPreInputBinaryOperator = false;
        },
        binaryOperate: (operator, facade) => {
            if (cal.type === 3) {
                cal.resetScales();
            }
            let si = cal.getShowInput(),
                pi = cal.getPreStep();
            if (cal.isNumber(si)) {
                cal.operandStack.push(si);
                cal.setPreStep(cal.getPreStep() + ((cal.isPreInputUnaryOperator || pi.charAt(pi.length - 1) === ")") ?
                    (" " + facade) : (" " + si + " " + facade)));
                let preOp = cal.operatorStack.pop();
                if (preOp != null) {
                    let op = cal.operatorPriority[operator],
                        pp = cal.operatorPriority[preOp];
                    if (op > pp) {
                        cal.operatorStack.push(preOp);
                    }
                    else if (op > 3 && op === pp) {
                        cal.operatorStack.push(preOp);
                        cal.travelStack(1);
                    } else {
                        cal.operatorStack.push(preOp);
                        cal.setShowInput(cal.checkLength(cal.travelStack(null, op)));
                    }
                }
                cal.operatorStack.push(operator);
            }
            cal.isPreInputUnaryOperator = false;
            cal.isPreInputEquals = false;
        },
        calculate: () => {
            if (!cal.isPreInputEquals) {
                let si = cal.getShowInput(),
                    result;
                if (cal.isNumber(si)) {
                    cal.operandStack.push(si);
                    result = cal.checkLength(cal.travelStack());
                    cal.setShowInput(result);
                    cal.preResult = result;
                    cal.setPreStep("&nbsp;");
                    if (cal.type === 3) {
                        cal.showScales(result);
                    }
                    cal.isOverride = true;
                }
                cal._reset();
                cal.isPreInputEquals = true;
            }
        },
        travelStack: (level, minPri) => {
            let op, f, s,
                result = cal.operandStack[cal.operandStack.length - 1],
                l = level || cal.operatorStack.length,
                p = minPri || 0;
            for (let i = 0; i < l; ++i) {
                op = cal.operatorStack.pop();
                if (cal.operatorPriority[op] < p || op === "(") {
                    cal.operatorStack.push(op);
                    break;
                }
                s = cal.operandStack.pop();
                f = cal.operandStack.pop();
                result = cal._stackHelper(f, s, op);
                cal.operandStack.push(result);
            }
            return result;
        },
        rightTag: () => {
            let si = cal.getShowInput();
            if (cal.isNumber(si)) {
                cal.setPreStep(cal.getPreStep() + (" " + si + " )"));
                cal.operandStack.push(si);
                let op = cal.operatorStack.pop(),
                    f, s, result;
                while (op !== "(" && op != null) {
                    s = cal.operandStack.pop();
                    f = cal.operandStack.pop();
                    result = cal._stackHelper(f, s, op);
                    cal.operandStack.push(result);
                    op = cal.operatorStack.pop();
                }
                cal.setShowInput(cal.checkLength(cal.operandStack.pop()));
            }
        },
        _stackHelper: (f, s, op) => {
            let result;
            if (op === "^") {
                result = Math.pow(f, s);
            } else if (op === "yroot") {
                result = Math.pow(f, 1 / s);
            }
            else {
                if (cal.type === 3) {
                    let scale = cal.currentScale,
                        fi, si;
                    if (scale === 10) {
                        result = eval(f + op + s);
                    } else if (scale === 16) {
                        fi = parseInt(f, 16);
                        si = parseInt(s, 16);
                        result = eval(fi + op + si).toString(16);
                    } else if (scale === 8) {
                        fi = parseInt(f, 8);
                        si = parseInt(s, 8);
                        result = eval(fi + op + si).toString(8);
                    } else {
                        fi = parseInt(f, 2);
                        si = parseInt(s, 2);
                        result = eval(fi + op + si).toString(2);
                    }
                } else {
                    result = eval(f + op + s);
                }
            }
            return result;
        },
        checkLength: (value) => {
            let valueStr = value + "";
            if (cal.isFloat(valueStr)) {
                valueStr = valueStr.replace(/0+$/, "");
            }
            return valueStr.length > 12 ? value.toFixed(7) : valueStr;
        },
        //CE
        ce: () => {
            cal.setShowInput("0");
            if (cal.type === 3) {
                cal.resetScales();
            }
        },
        //C
        clear: () => {
            cal.setShowInput("0");
            cal.setPreStep("&nbsp;");
            cal._reset();
            if (cal.type === 3) {
                cal.resetScales();
            }
        },
        resetScales: () => {
            for (let i = 0; i < 4; i++) {
                cal.cache.scaleSpans[i].innerHTML = "0";
            }
        },
        back: () => {
            let oldValue = cal.cache.showInput.innerText;
            cal.setShowInput(oldValue.length < 2 ? "0" : oldValue.substring(0, oldValue.length - 1));
        },
        showScales: (num) => {
            let result = cal.calculateScales(num),
                spans = cal.cache.scaleSpans;
            for (let i = 0; i < 4; ++i) {
                spans[i].innerHTML = result[i];
            }
        },
        calculateScales: (num) => {
            let scale = cal.currentScale,
                result = [],
                i;
            if (scale === 10) {
                i = parseInt(num);
                result[0] = i.toString(16);
                result[1] = i;
                result[2] = i.toString(8);
                result[3] = i.toString(2);
            } else if (scale === 16) {
                i = parseInt(num, 16);
                result[0] = num;
                result[1] = i;
                result[2] = i.toString(8);
                result[3] = i.toString(2);
            } else if (scale === 8) {
                i = parseInt(num, 8);
                result[0] = i.toString(16);
                result[1] = i;
                result[2] = num;
                result[3] = i.toString(2);
            } else {
                i = parseInt(num, 2);
                result[0] = i.toString(16);
                result[1] = i;
                result[2] = i.toString(8);
                result[3] = num;
            }
            return result;
        },
        isNumber: (str) => {
            return cal.isInteger(str) || cal.isFloat(str) || cal.isScientific(str);
        },
        isInteger: (str) => {
            return str.match(cal.intPattern);
        },
        isFloat: (str) => {
            return str.match(cal.floatPattern);
        },
        isScientific: (str) => {
            return str.match(cal.scientificPattern);
        },
        showInput: (value) => {
            let oldValue = cal.getShowInput();
            let newValue = oldValue;
            if (cal.isOverride) {
                if (value === ".") {
                    newValue = "0.";
                } else {
                    newValue = value;
                }
            } else if (oldValue.length < 13) {
                if (oldValue === "0") {
                    if (value === ".") {
                        newValue = "0.";
                    } else {
                        newValue = value;
                    }
                } else {
                    newValue += value;
                }
            }
            cal.setShowInput(newValue);
            cal.isOverride = false;
            cal.isPreInputBinaryOperator = false;
            cal.isPreInputUnaryOperator = false;
            cal.isPreInputEquals = false;
        },
        switchType: (type) => {
            let oldPrefix = cal.typePrefix[cal.type];
            document.getElementById(oldPrefix + "type-bar").style.display = "none";
            document.getElementById(oldPrefix + "main").style.display = "none";
            document.getElementById(cal.typePrefix[type] + "main").style.display = "block";
            cal.type = type;
            if (!cal.hasInited[type]) {
                cal.initListeners();
                cal.hasInited[type] = true;
            }
            cal.initCache();
            cal._reset();
        },
        _reset: () => {
            cal.operandStack = [];
            cal.operatorStack = [];
            cal.isPreInputBinaryOperator = false;
            cal.isPreInputUnaryOperator = false;
            cal.isPreInputEquals = false;
        },
        addEvent: (element, name, handler) => {
            if (window.addEventListener) {
                element.addEventListener(name, handler);
            } else if (window.attachEvent) {
                element.attachEvent("on" + name, handler);
            }
        },
        removeEvent: (element, name, handler) => {
            if (window.removeEventListener) {
                element.removeEventListener(name, handler);
            } else if (window.detachEvent) {
                element.detachEvent("on" + name, handler);
            }
        },
        getElementsByAttribute: (tag, attr, root) => {
            let parent = root || document,
                result = [];
            let arr = parent.getElementsByTagName(tag),
                a;
            for (let i = 0, l = arr.length; i < l; ++i) {
                a = arr[i];
                if (a.getAttribute(attr) != null) {
                    result[result.length] = a;
                }
            }
            return result;
        },
        fact: (() => {
            let cache = [1];

            const factorial = (n) => {
                let result = cache[n - 1];
                if (result == null) {
                    result = 1;
                    for (let i = 1; i <= n; ++i) {
                        result *= i;
                    }
                    cache[n - 1] = result;
                }
                return result;
            }
            return factorial;
        })(),
        disableButtons: (lis, mouseOutListener) => {
            let li;
            for (let i = 0, l = lis.length; i < l; ++i) {
                li = lis[i];
                li.setAttribute("class", "disable-btn");
                cal.removeEvent(li, "click", cal.listeners.keyPressListener);
                cal.removeEvent(li, "mouseout", mouseOutListener);
                cal.removeEvent(li, "mouseover", cal.listeners.mouseHoverListener);
            }
        },
        rebuildButtons: (lis, mouseOutListener) => {
            let li;
            for (let i = 0, l = lis.length; i < l; ++i) {
                li = lis[i];
                li.removeAttribute("class");
                cal.addEvent(li, "click", cal.listeners.keyPressListener);
                cal.addEvent(li, "mouseout", mouseOutListener);
                cal.addEvent(li, "mouseover", cal.listeners.mouseHoverListener);
            }
        }
    };
    return cal;
};