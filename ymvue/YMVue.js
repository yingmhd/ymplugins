;(function () {
    'use strict';
    let _global = null;

    //  观察者
    function Guard(obj) {
        this.obj = obj;
        this.start(obj.data);
    }

    Guard.prototype = {
        start(data) {
            if (data && typeof data === 'object') {
                Object.keys(data).forEach((key) => {
                    this.addGuard(data, key, data[key]);
                });
            }
        },
        addGuard(data, key, val) {
            let self = this;
            this.start(data[key]);
            let dep = new Dep();
            Object.defineProperty(data, key, {
                enumerable: true,
                configurable: true,
                get() {
                    if (Dep.target) {
                        dep.addSub(Dep.target);
                    }
                    return val;
                },
                set(v) {
                    if (val === v) {
                        return;
                    }
                    val = v;
                    dep.update();
                }
            })
        }
    };

    function Dep() {
        this.subs = []
    }

    Dep.prototype = {
        addSub(sub) {
            this.subs.push(sub);
        },
        update() {
            this.subs.forEach((sub) => {
                sub.excute();
            })
        }
    };

    function BindCallbackToGuard(obj, name, callback) {
        this.obj = obj;
        this.callback = callback;
        this.name = name;
        this.value = this.get();
    }

    BindCallbackToGuard.prototype = {
        excute() {
            let val = this.obj.data[this.name];
            let oldVal = this.value;
            if (val !== oldVal) {
                this.value = val;
                this.callback.call(this.obj, val, oldVal);
            }
        },
        get() {
            Dep.target = this;
            let value = this.obj.data[this.name]; // 强行执行观察者的get函数
            Dep.target = null;
            return value;
        }
    };


    function YMVue(opts) {
        this.data = opts.data;
        this.methods = opts.methods || {};

        Object.keys(this.data).forEach((key) => {
            this.proxy(key);
        });
        new Guard(this);
        new Analysis(opts.el, this);
        this.methods.mounted && this.methods.mounted.call(this);
    }

    YMVue.prototype = {
        proxy(key) {
            let self = this;
            Object.defineProperty(this, key, {
                enumerable: true,
                configurable: true,
                get() {
                    return self.data[key];
                },
                set(v) {
                    self.data[key] = v;
                }
            })
        }
    };

    // Dom 解析

    function Analysis(containerId, obj) {
        this.obj = obj;    // YMVue对象
        this.dom = document.querySelector(containerId);
        this.fragment = null;
        this.init();
    }

    Analysis.prototype = {
        init() {
            if (this.dom) {
                this.fragment = this.switchToFragment(this.dom);     // 将NODE节点转换为文档碎片
                this.analysisElement(this.fragment);            // 开始解析
                this.dom.appendChild(this.fragment);            // 用文档碎片替换node节点
            } else {
                console.log('Dom 元素不存在');
            }
        },
        switchToFragment() {
            let fragment = document.createDocumentFragment();
            let child = this.dom.firstChild;
            while (child) {
                fragment.append(child);
                child = this.dom.firstChild;
            }
            return fragment;
        },
        analysisElement(dom) {
            let childNodes = dom.childNodes;
            [].slice.call(childNodes).forEach((node) => {
                let reg = /\{\{(.*)\}\}/;
                let text = node.textContent;

                if (this.isElementNode(node)) {      // 元素节点
                    this.analysisAttr(node);
                } else if (this.isTextNode(node) && reg.test(text)) {  // 文本节点
                    this.bindText(node, reg.exec(text)[1]);
                }

                if (node.childNodes && node.childNodes.length) {
                    this.analysisElement(node);
                }
            });
        },
        analysisAttr(node) {
            let nodeAttrs = node.attributes;
            Array.prototype.forEach.call(nodeAttrs, (attr) => {
                let name = attr.name;          // 属性名称
                if (this.isCommand(name)) {    // 属性名以'v-'开头
                    let value = attr.value;    // 属性值
                    let command = name.substring(2);
                    if (this.isEventCommand(command)) {  // 事件指令，比如v-on:click
                        this.bindEvent(node, value, command);
                    } else { // v-model 指令
                        this.bindModel(node, value)
                    }
                    node.removeAttribute(name);  // 移除后，页面上不显示
                }
            })
        },

        bindText(node, name) {
            let text = this.obj[name];
            node.textContent = text || '';
            // 添加一个订阅者
            new BindCallbackToGuard(this.obj, name, function (v) {
                node.textContent = v;
            });

        },
        bindEvent(node, name, command) {
            let eventType = command.split(':')[1];
            let method = this.obj.methods && this.obj.methods[name];
            if (eventType && method) {
                node.addEventListener(eventType, method.bind(this.obj), false);
            }
        },
        bindModel(node, name) {
            let self = this;
            let text = this.obj[name];
            node.value = text || '';

            // 添加一个订阅者
            new BindCallbackToGuard(this.obj, name, function (v) {
                node.value = v;
            });
            // 监听input事件，当它的value改变时，同时更新其绑定值
            node.addEventListener('input', function (e) {
                let newVal = e.target.value;
                if (text === newVal) {
                    return;
                }
                self.obj[name] = newVal;
                text = newVal;
            }, false);
        },
        isCommand(attr) {
            return attr.indexOf('v-') === 0;
        },
        isEventCommand(dir) {
            return dir.indexOf('on:') === 0;
        },
        isElementNode(node) {
            return node.nodeType === 1;
        },
        isTextNode(node) {
            return node.nodeType === 3;
        }
    };


    _global = (function () {
        return this || (0, eval)('this');
    }());

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = YMVue;
    } else {
        !('YMVue' in _global) && (_global.YMVue = YMVue);
    }

}());