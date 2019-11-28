;(function () {

    function YMRouter() {
        this.addedRouter = [];    // 已注册的路由容器
        this.mode = null;         // 路由类型
        this.isFirstLoad = true;  // 页面是否第一次加载
        this.view = document.querySelector('#ymapp');  // 渲染容器
        this.defaultRouter = {    // 默认路由信息
            path:  '#',
            content: 'this is the page of Home'
        };
    }

    YMRouter.prototype = {
        constructor: this,
        init(opt) {
            if (!window.history.pushState) {
                alert('你的浏览器版本太低了~');
            } else {
                this.mode = opt.mode.toLowerCase();  // 路由类型
                for (let k in opt.list) {     // 注册至路由容器
                    if (typeof k !== 'string' || typeof opt.list[k] !== 'string') {
                        throw new Error('url和content必须是string');
                    }
                    if (this.mode === 'hash' && !/^#/.test(k)) {
                        throw new Error('hash路由不规范');
                    }
                    this.addedRouter.push({
                        path: k,
                        content: opt.list[k]
                    });
                }
                if(this.mode === 'hash') {
                    this.bindHashChange();      // window对象绑定onhashchange事件
                }else if(this.mode === 'history'){
                    this.defaultRouter.path = '/home';    // 修改默认路由的path
                    this.bindStateChange();   // window对象绑定onpopstate
                }
                this.firstLoad();  // 第一次加载事件
                this.bindEvents(); // 绑定点击路由切换事件
            }
        },
        firstLoad() {
            let path = this.mode === 'hash' ? location.hash : location.pathname;   // 第一次加载或者刷新页面获取当前路由信息
            let _router = this.hasThisRouter(path);   // 判断当前路由是否已注册在路由容器里
            if(_router) {
                this.go(_router);
            }else {
                if(this.addedRouter.length === 0) {  // 如果没有注册过路由
                    this.go(this.defaultRouter);
                }else {
                    this.go(this.addedRouter[0]);  // 默认渲染注册的第一个路由
                }
            }
            this.isFirstLoad = false;  // 页面第一次加载结束
        },
        bindEvents() {
            let that = this;
            let navs = document.querySelectorAll('[ym-link]');
            [].slice.call(navs).forEach(item => {
                item.addEventListener('click', function () {
                    let _router = that.hasThisRouter(item.getAttribute('ym-link'));
                    return that.go(_router);
                }, false);
            })
        },
        hasThisRouter(path) {
            let historys = this.addedRouter;
            for (let i = 0; i < historys.length; i++) {
                if (historys[i].path === path) {
                    return historys[i];
                }
            }
            return false;
        },
        go(router) {
            if(this.mode === 'history') {
                let newState = {
                    url: location.origin + router.path,
                    title: document.title,
                    path: router.path
                };
                if(this.isFirstLoad) {  // 第一次加载使用replaceState，在历史栈中替换当前页面
                    window.history.replaceState(newState, '',  router.path);
                }else {
                    window.history.pushState(newState, '',  router.path);
                }
                this.renderHtml(router.content);
            }else {
                // 更改hash值，触发onhashchange事件
                location.hash = router.path;
                // 只有第一次加载的时候才主动去渲染模板，之后在onhashchange的事件渲染模板
                if(this.isFirstLoad) {
                    this.renderHtml(router.content);
                }
            }
        },
        renderHtml(content) {
            this.view.innerHTML = content;
        },
        bindHashChange() {
            let that = this;
            window.onhashchange = function () {
                let path = location.hash;
                that.toRender(path);
            }
        },
        bindStateChange() {
            let that = this;
            window.onpopstate = function (e) {
                let path = e.state && e.state.path;
                that.toRender(path);
            }
        },
        toRender(path) {
            let _router =this.hasThisRouter(path);
            if(_router) {
                this.renderHtml(_router.content);
            }else {
                this.renderHtml(this.defaultRouter.content)
            }
        }
    };

    let ymrouter = new YMRouter();
    window.$YMRouter = ymrouter;

}());