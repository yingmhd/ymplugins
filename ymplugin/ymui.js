;(function () {
    "use strict";
    let _global;

    function extend(o, n, override) {
        for (let key in n) {
            if (n.hasOwnProperty(key) && (!o.hasOwnProperty(key)) || override) {
                o[key] = n[key];
            }
        }
        return o;
    }

    function generateDialogTpl(opt) {
        let Tpl = `
            <div class="ym-dialog-cover"> </div>
            <div class="ym-dialog-main">
                <div class="title backcolor-${opt.theme}">
                    ${opt.title}
                    <span class="x-close"><em></em></span>
                </div>
                <div class="content bordercolor-${opt.theme}">
                    ${opt.content}
                </div>
                <div class="btn-area">`;
        if (opt.cancel) {
            Tpl += `<button class="btn-close ym-btn ym-btn-xsmall ym-btn-gray">${opt.cancel_text}</button>`;
        }
        Tpl += `        
                    <button class="btn-confirm ym-btn ym-btn-xsmall ym-btn-${opt.theme}">${opt.ok_text}</button>
                </div>
            </div>
        `;
        return Tpl;
    }

    function createDialog(def) {
        let dom = document.createElement('div');
        dom.className = 'ym-dialog-container';
        dom.setAttribute('id', def.dialogId);
        dom.innerHTML = generateDialogTpl(def);
        document.body.appendChild(dom);
        return dom;
    }

    function YMDialog(opt) {
        this._initial(opt);
    }

    YMDialog.prototype = {
        constructor: this,
        _initial: function (opt = {}) {
            let def = {
                cancel: true,
                ok_text: '确定',
                cancel_text: '取消',
                ok_fuc: null,
                cancel_fuc: null,
                title: '',
                content: '',
                theme: 'green',
                dialogId: 'ymDialog' + (new Date()).getTime()
            };
            this.def = extend(def, opt, true);
            this.listeners = {};
        },
        show: function (callback) {
            let _this = this;
            if (!!_this.dom) return false;
            // 渲染模板
            _this.dom = createDialog(_this.def);
            // 触发show监听事件
            if (this.listeners['show'] !== 'undefined' && this.listeners['show'] instanceof Array) {
                this.emit({type: 'show', target: this.dom});
            }
            // 绑定基础事件
            _this.dom.getElementsByClassName('btn-close')[0].onclick = function () {
                !!_this.def.cancel_fuc ? _this.def.cancel_fuc.call(_this, _this.dom) : _this.close()
            };
            _this.dom.getElementsByClassName('x-close')[0].onclick = function () {
                _this.close()
            };
            _this.dom.getElementsByClassName('btn-confirm')[0].onclick = function () {
                !!_this.def.ok_fuc && _this.def.ok_fuc.call(_this, _this.dom)
            };
            // 弹窗拖动
            let dragEle = _this.dom.getElementsByClassName('ym-dialog-main')[0];
            _this.dom.getElementsByClassName('title')[0].onmousedown = function (event) {
                let disX = event.clientX - dragEle.offsetLeft;
                let disY = event.clientY - dragEle.offsetTop;
                document.onmousemove = function (e) {
                    let l = e.clientX - disX;
                    let t = e.clientY - disY;
                    dragEle.style.left = l + 'px';
                    dragEle.style.top = t + 'px';
                };
                document.onmouseup = function () {
                    document.onmousemove = null;
                    document.onmouseup = null;
                }
            };
        },
        close: function () {
            // 触发close监听事件
            if (this.listeners['close'] && this.listeners['close'] instanceof Array) {
                this.emit({type: 'close', target: this.dom});
            }
            document.body.removeChild(this.dom);
        },
        on: function (type, handler) {
            if (typeof this.listeners[type] === 'undefined') {
                this.listeners[type] = [];
            }
            this.listeners[type].push(handler);
            return this;
        },
        off: function (type, handler) {
            if (this.listeners[type] instanceof Array) {
                let handlers = this.listeners[type];
                for (let i = 0; i < handlers.length; i++) {
                    if (handlers[i] === handler) {
                        handlers.splice(i, 1);
                        break;
                    }
                }
                return this;
            }
        },
        emit: function (handleObj) {
            if (!handleObj.target) {
                handleObj.target = this;
            }
            if (this.listeners[handleObj.type] instanceof Array) {
                let handlers = this.listeners[handleObj.type];
                for (let i = 0; i < handlers.length; i++) {
                    handlers[i](handleObj.target);
                }
            }
            return false;
        }
    };

    function generatePageTpl(opt) {
        let pageNums = parseInt(opt.pageNums);
        let initPage = parseInt(opt.initPage);
        let end = initPage + 2 > pageNums ? pageNums : initPage + 2;
        let start = end - 4 > 1 ? end - 4 : 1;
        if (typeof pageNums !== "number") {
            pageNums = 1;
        }
        let Tpl = `
            <div class="ym-page-group">
                <ul>
                    <li class="can-click" data-p="${initPage - 1 > 1 ? initPage - 1 : 1}"><</li>
                    <li class="can-click" data-p="1">首页</li>
            `;
        while (start <= end) {
            Tpl += `<li class="${initPage == start ? 'active' : 'can-click'}" data-p="${start}">${start}</li>`;
            start++;
        }
        if (end < pageNums) {
            Tpl += `<li class="dont-click">...</li>`;
            Tpl += `<li class="can-click" data-p="${pageNums}">${pageNums}</li>`;
        }
        Tpl += `
                    <li class="can-click" data-p="${initPage + 1 > pageNums ? pageNums : initPage + 1}">></li>
                </ul>`;
        if (opt.openSearch) {
            Tpl += `
                <div class="page-search">
                    <span>到</span>
                    <input type="text" class="page-input"/>
                    <span>页</span>
                    <button class="ym-btn ym-btn-green page-btn">确定</button>
                </div>`;
        }
        Tpl += `            
            </div>`;
        let container = document.getElementById(opt.containerId);
        container.innerHTML = Tpl;
        if (typeof opt.callback === "function") {
            opt.callback(opt.initPage);
        }
    }

    function YMpage(opt) {
        this._initial(opt);
        this.show();
    }

    YMpage.prototype = {
        constructor: this,
        _initial: function (opt = {}) {
            let def = {
                containerId: '',
                pageNums: 1,
                initPage: 1,
                openSearch: false,
                callback: function () {
                }
            };
            this.def = extend(def, opt, true);
            this.dom = document.getElementById(this.def.containerId);
        },
        show: function () {
            let _this = this;
            generatePageTpl(_this.def);

            _this.dom.addEventListener('click', function (e) {
                let page = '';
                if (e.target && e.target.className === 'can-click') {
                    page = e.target.getAttribute('data-p');

                }

                if (e.target && e.target.className.includes('page-btn')) {
                    let initPage = parseInt(e.target.parentNode.children[1].value);
                    if (!isNaN(initPage) && initPage <= _this.def.pageNums && initPage >= 1) {
                        page = initPage;
                    }
                }

                if (page !== "") {
                    let opt = {
                        containerId: _this.def.containerId,
                        pageNums: _this.def.pageNums,
                        initPage: page,
                        openSearch: _this.def.openSearch,
                        callback: _this.def.callback
                    };
                    generatePageTpl(opt);
                }
            });

        }
    };


    function YMTip(opt) {
        console.log(this);
        this._initial(opt);
        this.bindEvent();
    }

    YMTip.prototype = {
        constructor: this,
        _initial: function (opt = {}) {
            let def = {
                element: '.ym-tip',
                position: '',
                content: ''
            };
            this.def = extend(def, opt, true);
        },
        bindEvent: function () {
            let _data = this.def;
            if (_data.element.includes('.')) {
                let eles = document.getElementsByClassName(_data.element.replace('\.', ''));
                for (let i = 0; i < eles.length; i++) {
                    this.tipEvent(eles[i]);
                }
            } else {
                let ele = document.getElementById(_data.element.replace('\#', ''));
                this.tipEvent(ele);
            }
        },
        tipEvent: function (ele) {
            let _data = this.def;
            let id = Math.random().toFixed(6).slice(-6);
            ele.addEventListener('mouseenter', function () {
                let position = _data.position || ele.getAttribute('data-position') || 'up';
                let content = _data.content || ele.getAttribute('data-tip');
                let t = ele.offsetTop;
                let l = ele.offsetLeft;
                let w = ele.offsetWidth;
                let h = ele.offsetHeight;
                let scrollY = document.body.scrollTop + document.documentElement.scrollTop;
                let scrollX = document.body.scrollLeft + document.documentElement.scrollLeft;
                let x = 0;
                let y = 0;
                let dom = document.createElement('div');
                dom.innerHTML = `${content}<span class="ym-triangle"></span>`;
                dom.className = `ym-tip-container pos-${position}`;
                dom.setAttribute('id', 'ymtip' + id);
                document.body.append(dom);
                let tip_w = dom.offsetWidth;
                switch (position) {
                    case "left":
                        x = -tip_w - scrollX - 10;
                        y = -scrollY;
                        break;
                    case "up":
                        x = -scrollX;
                        y = -h - scrollY - 10;
                        break;
                    case "bottom":
                        x = -scrollX;
                        y = h - scrollY + 10;
                        break;
                    case "right":
                        x = w - scrollX + 10;
                        y = -scrollY;
                        break;
                }
                dom.style.left = l + x + 'px';
                dom.style.top = t + y + 'px';
                dom.style.visibility = 'visible';
            });
            ele.addEventListener('mouseleave', function () {
                let dom = document.getElementById('ymtip' + id);
                document.body.removeChild(dom);
            });
        }
    };

    function YMCarousel(opt) {
        this._initial(opt);
        this.startMove();
    }

    YMCarousel.prototype = {
        constructor: this,
        _initial: function (opt = {}) {
            let def = {
                containerId: '',
                width: '',
                height: '',
                hoverHideItems: false,
                hoverStopMove: true,
                hasBtn: false
            };
            this.def = extend(def, opt, true);
            this.container = document.getElementById(this.def.containerId);
            this.dom = this.container.getElementsByClassName('ym-carousel')[0];
            this.items = this.dom.getElementsByTagName('li');
            this.len = this.items.length - 1;
            let cur = 0;
            Object.defineProperty(this, 'cur', {
                set(v) {
                    cur = v;
                    this.stateChange(v);
                },
                get() {
                    return cur;
                }
            });

            this.insertEle();

        },
        insertEle: function () {
            let point = document.createElement('ol');
            point.className = 'ym-carousel-point';
            point.className += this.def.hoverHideItems ? ' hover-hide' : '';
            let tpl = '';
            for (let i = 0; i <= this.len; i++) {
                tpl += `<li data-index="${i}" class="${i == 0 ? 'active' : ''}"></li>`
            }
            point.innerHTML = tpl;
            this.container.appendChild(point);
            this.point = point;

            if (this.def.hasBtn) {
                let l_btn = document.createElement('div');
                l_btn.className = 'ym-carousel-btn left';
                l_btn.className += this.def.hoverHideItems ? ' hover-hide' : '';
                l_btn.innerText = '<';
                let r_btn = document.createElement('div');
                r_btn.className = 'ym-carousel-btn right';
                r_btn.className += this.def.hoverHideItems ? ' hover-hide' : '';
                r_btn.innerText = '>';
                this.container.appendChild(l_btn);
                this.container.appendChild(r_btn);
            }
            this.setStyle();
        },
        setStyle: function () {
            this.container.style.width = this.def.width + 'px';
            this.container.style.height = this.def.height + 'px';


            for (let i = 0; i < this.items.length; i++) {
                this.items[i].style.width = this.def.width + 'px';
                this.items[i].style.height = this.def.height + 'px';
            }

            this.bindEvent();
        },
        bindEvent: function () {
            let _this = this;
            if (this.def.hoverStopMove) {
                this.container.addEventListener('mouseenter', function () {
                    clearInterval(_this.timer);
                });
                this.container.addEventListener('mouseleave', function () {
                    _this.startMove();
                });
            }
            if (this.def.hasBtn) {
                this.container.addEventListener('click', function (e) {
                    if (e.target && e.target.className.includes('ym-carousel-btn')) {
                        if (e.target.className.includes('left')) {
                            _this.cur = _this.cur == 0 ? _this.len : _this.cur - 1;
                        } else {
                            _this.cur = _this.cur >= _this.len ? 0 : _this.cur + 1;
                        }
                    }
                });
            }
            this.point.addEventListener('click', function (e) {
                if (e.target && e.target.nodeName.toLowerCase() === 'li') {
                    let index = parseInt(e.target.getAttribute('data-index'));
                    _this.cur = index;
                }
            });
        },
        startMove: function () {
            let _this = this;
            this.timer = setInterval(function () {
                if (_this.cur >= _this.len) {
                    _this.cur = 0
                } else {
                    _this.cur += 1;
                }
            }, 4000);
        },

        stateChange: function (v) {
            let step = parseFloat(this.def.width);
            this.dom.style.left = -(v * step) + 'px';
            let points = this.point.getElementsByTagName('li');
            for (let i = 0; i < points.length; i++) {
                points[i].className = i == v ? 'active' : '';
            }
        }
    };

    let YMPlugins = {
        dialog: YMDialog,
        page: YMpage,
        tip: YMTip,
        carousel: YMCarousel
    };

    _global = (function () {
        return this || (0, eval)('this');
    }());
    if (typeof module !== "undefined" && module.exports) {
        module.exports = YMPlugins
    } else {
        !('YMPlugins' in _global) && (_global.YMPlugins = YMPlugins);
    }
}());