
export abstract class $ {

    private static instances: object = {}
    private static instanceCount: number = 0;

    /**
    * Matches everything with a space, square brackets, > or composite
    *  selectors like div.valign
    */
    private _complexQueryPattern = /([ >\[])|([^ ]+[\.#].*)/;

    /**
     * Assigns a new node id
     * @param node 
     */
    static assignId($node: NodeSet): void {
        const nodeId = $.instanceCount++ + '';
        $node.data('nodeid', nodeId);
        $.instances[nodeId] = $node;
    }

    /**
     * Returns an existing instance, if possible
     * @param node 
     */
    private static _getExisting (node: HTMLElement|SVGSVGElement|Element): NodeSet {
        if(!$.isDefined(node)) {
            return new NodeSet([]);
        }

        let nodeId = node.getAttribute('data-nodeid'),
        _node: NodeSet = $.instances[nodeId];

        if(typeof _node === 'undefined') {
            let nextId = $.instanceCount++,
                $node = new NodeSet([node]);

            $.assignId($node);

            return $node;
        }

        return _node;
    }

    /**
     * Creates a new NodeSet
     * @param {*} node
    */
    static of (node: any): NodeSet {
        let type = typeof node;

        if (node instanceof NodeSet) {
            return node;
        }

        if (node instanceof Window || node instanceof Document) {
            return new NodeSet([node]);
        }

        if (node instanceof NodeList || node instanceof HTMLCollection) {
            return new NodeSet(Array.from(node));
        }

        if (node instanceof Element) {
            return $._getExisting(node);
        }

        if (!$.isDefined(node)) {
            return new NodeSet([]);
        }

        if (node instanceof Array) {
            return new NodeSet(node);
        }

        if (type === 'string') {
            const nodes = Array.prototype.slice.call(document.querySelectorAll(node));

            if (nodes.length > 1) {
                return new NodeSet(nodes);
            } else if (nodes.length === 0) {
                return new NodeSet([]);
            } else {
                let preExisting,
                    _node = nodes[0],
                    nextId = $.instanceCount++;
                
                if (preExisting = $._getExisting(_node)) {
                    return preExisting;
                }
                
                return new NodeSet([_node]);
            }
        }

        throw new TypeError(`Node cannot be created from ${node}`);
    }

    /**
     * Returns a single Node from a selector
     * @param node 
     */
    static one (node: string): NodeSet {
        let result = document.querySelector(node);

        return $._getExisting(result);
    }

    /**
     * Returns a pre-existing node instance by its ID
     * @param nodeId 
     */
    static inst (nodeId: string|number): NodeSet {
        return $.instances[nodeId.toString()];
    }

    /**
     * Creates a new NodeSet from a given id
     * @param {string} id
    */
    static id (id: string): NodeSet {
        let result: HTMLElement = document.getElementById(id);

        return $._getExisting(result);
    }

    /**
     * Creates a new NodeSet from a given class name, returns a single result
     * @param {string} className
    */
    static ocl (className: string): NodeSet {
        let result = document.getElementsByClassName(className)[0];

        return $._getExisting(result);
    }

    /**
     * Creates a new NodeSet from a given classname, returns all results
     * @param {string} className
    */
    static cl (className: string): NodeSet {
        return new NodeSet(Array.from(document.getElementsByClassName(className)));
    }

    /**
     * Returns whether or not an element that fits the given selector exists
     * @param {string} selector
    */
    static exists (selector: string): boolean {
        return document.querySelector(selector) !== null;
    }

    /**
     * Creates a document node
     * @param {string} nodeString
    */
    static create(nodeString: string): NodeSet {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = nodeString;
        if(wrapper.firstChild === null) {
            throw new Error(`Invalid HTML: ${nodeString}`);
        }

        let $node = new NodeSet([wrapper.firstChild]);
        $.assignId($node);

        return $node;
    }

    /**
     * Creates nested nodes
     * @param {string} nodeString
    */
    static createAll(nodeString: string): NodeSet {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = nodeString;

        let $node = new NodeSet(Array.from(wrapper.childNodes));
        $.assignId($node);

        return $node;
    }

    private static _unicodeRegex = /#(\d)/g;

    /**
     * Escapes a unicode string
     */
    private static _escapeUnicode (str: string) {
        let match: RegExpExecArray;
        while ((match = $._unicodeRegex.exec(str))) {
            str = str.replace(match[0], '#\\3' + match[1] + ' ');
        }
        $._unicodeRegex.lastIndex = 0;
        return str;
    }

    /**
     * Returns all elements of the collection that match the
     *  selector, selector can be string, RegExp or start with ? to
     *  match it against the element's id/class/tag
     * @param {*} elements
     * @param {*} selector
    */
    static findMatches (elements: any, selector: string): Array<HTMLElement> {
        if (elements instanceof NodeSet) {
            elements = elements.all();
        }

        return elements.filter(function (el) {
            return $.matches(el, selector);
        });
    }

    /**
     * Returns whether an element matches a selector
     * @param {*} element
     * @param {string} selector
    */
    static matches (element: NodeSet | EventTarget | string, selector: string | NodeSet | EventTarget): boolean {
        if (typeof element === 'string' && typeof selector === 'string') {
            return document.querySelector(element) === document.querySelector(selector);
        } else if(typeof element === 'string') {
            element = document.querySelector(element);
        }

        
        if(typeof selector === 'string') {
            let _element: EventTarget;
            if(element instanceof NodeSet) {
                _element = element.get();
            } else {
                _element = element;
            }

            let results = Array.from(document.querySelectorAll(selector));
            return $.inArray(_element, results);
        }

        if(selector instanceof NodeSet) {
            element = (element instanceof NodeSet) ? element.get() : element;
            return selector.get() === element;
        }
        
        element = (element instanceof NodeSet) ? element.get() : element;
        return selector === element;
    }

    /**
     * Removes an element from the DOM
    *  @param {string} selector
    */
    static remove (selector: string) {
        Array.from(document.querySelectorAll(selector)).forEach(element => {
            element.remove();
        });
    }

    /**
    * Returns all elements of the elements children that match the
    *  selector
    * @param {*} element
    * @param {string} selector
    */
    static findChildren (element: HTMLElement, selector: string = '*') {
        if (element instanceof NodeSet) {
            element = element.get();
        }

        let result;
        try {
            result = element.querySelectorAll(selector);
        } catch (e) {
            result = [];
        }

        return new NodeSet(Array.from(result));
    }


    private static _readyList = [];
    private static _fired = false;
    private static _init = false;
    private static _ready = function () {
        $._readyList.forEach(function (f) {
            f.callback(f.context);
        });
        $._fired = true;
    }

    static DOMParsed (): boolean {
        return document.readyState === "complete" || document.readyState === "interactive";
    }

    /**
    * Executes the given function when the document is ready
    * @param {Function} callback
    */
    static ready (callback: (...args) => any, context?: any): void {
        if ($._fired || $.DOMParsed()) {
            callback(context);
        } else {
            $._readyList.push({ callback: callback, context: context });
            if (!$._init) {
                document.addEventListener("DOMContentLoaded", $._ready);
                $._init = true;
            }
        }
    }

    /**
     * Removes duplicates from arrays
     * @param {*} list
    */
    static unique<T> (list: T[]): T[] {
        let i = 0;
        return list.filter(function (obj) {
            return list.indexOf(obj) === (i++);
        });
    }

    /**
     * Removes an element from an array by its value
     * @param {Array} arr The array to filter
     * @param {*} val The value to remove
    */
    static removeByValue<T> (arr: T[], val: T): T[] {
        let pos = arr.indexOf(val);
        // ~ is a bitwise NOT, returns 0 only for -1
        if (~pos) return arr.splice(pos, 1);
    }

    private static _entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    }

    /*
     * Escapes illegal HTML characters
     * @param {string} string
    */
    static escapeHtml (str = ''): string {
        str = str + '';
        str = str.replace(/[&<>"'`=\/]/g, function (s) {
            return $._entityMap[s];
        });
        
        return str.replace(/\n/g, "<br/>");
    }

    /*
    * Throttles the execution of a function
    * @param {*} fn The callback to execute
    * @param {number} threshhold The interval
    * @param {*=} scope
    */
    static throttle (fn: (...args) => any, threshhold: number = 300) {
        var last = Date.now();
        return function () {
            let now = Date.now(),
                args = arguments;

            if (now > last + threshhold) {
                fn.apply(this, args);
                last = now;
            }
        }
    }

    /**
     * Checks whether or not the given object is
     *  iterable
     * @param {*} obj
     * @exclude all
    */
    static isIndexed (obj: any): boolean {
        if (obj == null) {
            return false;
        }

        return typeof obj.length !== 'undefined';
    }

    /**
     * Return whether or not the given object is defined
     * @param obj 
     */
    static isDefined (obj: any): boolean {
        let _isNaN = (typeof obj === 'number') && isNaN(obj);
        return (typeof obj !== 'undefined') && obj !== null && !_isNaN;
    }

    /**
     * Flattens an array of arrays
     * @param {Array} arr
    */
    static flatten (arr: any[]): any[] {
        return [].concat.apply([], arr);
    }

    /**
     * @param {*} search
     * @param {Array} arr
    */
    static inArray<T> (search: T, arr: T[]): boolean {
        return arr.indexOf(search) !== -1;
    }

    /**
     * Reverses the given array
     * @param {Array} arr
    */
    static reverseArray<T> (arr: T[]): T[] {
        return arr.reverse();
    }

    /**
     * Like inner HTML but also includes self
     * @param {*} node
     * @exclude all
    */
    static outerHtml (node: HTMLElement | NodeSet): string {
        let _node: HTMLElement = (node instanceof NodeSet) ? node.get() : node,
            parent = document.createElement('div');

        parent.appendChild(_node.cloneNode(true));

        return parent.innerHTML;
    }

    /**
     * Partially applies a function in the given scope
     * @param {Function} func
     * @param {*} scope
     * @param {Array} partialArgs
     * @exclude all
    */
    static curry (func: (...args) => any, scope: any, partialArgs: any): (...args) => any {
        return function (...args) {
            let _args = partialArgs.concat(Array.from(args));
            return func.apply(scope, _args);
        }
    }


    /**
     * Returns a default value if the element is undefined
     * @param {Function} func
     * @param {*} scope
     * @param {Array} partialArgs
     * @exclude all
    */
    // static setDefault<T> (obj: T | undefined | null, defVal: T): T {
    //     return (typeof obj === 'undefined') ? defVal :
    //         (obj === null) ? defVal :
    //             (typeof obj === 'number' && isNaN(obj)) ? defVal : obj;
    // }

    private static _escapeRegex = /(\.|\$|\^|\{|\[|\(|\)|\*|\+|\?|\\|\/)/g;
        
    /**
     * Escapes all reserved values for use in a regex
     * @param {string} string
    */
    static escapeRegex (string: string): string {
        let escaped = [];
        Array.from(string).forEach(function (c) {
            if (c.match($._escapeRegex) && !$.inArray(c, escaped)) {
                if (c !== '\\') {
                    string = string.replace(new RegExp("\\" + c, 'g'), "\\" + c);
                    escaped.push(c);
                }
            }
        });

        return string;
    }

    /**
     * Creates a range from start to end, including both
     * @param {number} start
     * @param {number} end
    */
    static range (start: number, end: number): number[] {
        let arr: number[] = [];
        for (var i = start; i <= end; i++) {
            arr.push(i);
        }

        return arr;
    }

    static PAD_LEFT = 0;
    static PAD_RIGHT = 1;

    /**
     * Pads a string with the char param to the given length
     * @param {string} str
     * @param {string} chr
     * @param {number} length
    */
    static pad (str: string | number, chr: string = '0', length: number = 2, type = $.PAD_LEFT): string {
        if (typeof str === 'number') {
            str = str.toString();
        }
        
        if (type === $.PAD_LEFT) {
            while (str.length < length) {
                str = chr + str
            }
        } else {
            while (str.length < length) {
                str = str + chr;
            }
        }

        return str;
    }


    /**
     * Tries to determine CSS support for the given attribute and value
     * @param {string} attr
     * @param {string} value
    */
    static supports (attr: string): boolean {
        return $.html.hasClass(attr) && !$.html.hasClass('no-' + attr);
    }


    /**
     * Merges all given elements into a NodeSet
    */
    static merge (...args: (string|NodeSet)[]): NodeSet {
        var arr: HTMLElement[][] = [];
        Array.from(args).forEach(node => {
            if(node instanceof NodeSet) {
                arr.push(node.all());
            } else {
                arr.push($.of(node).all());
            }
        });
        
        arr = $.flatten(arr);
        return new NodeSet(arr);
    }

    /**
     * Registers multiple event listeners
     * @param {Array} arr An array containing objects with the
     *  attributes node, type and listener
    */
    static registerListeners (arr: ListenerInterface[]): void {
        arr.forEach(entry => {
            if (entry.node instanceof NodeSet) {
                entry.node.on(entry.type, entry.handler);
            } else {
                if(entry.delegate) {
                    $.html.delegate(entry.type, entry.node, entry.handler);
                } else {
                    $.of(entry.node).on(entry.type, entry.handler);
                }
            }
        });
    }

    /**
     * Formats a date to DD.MM.YYYY format
     * @param {Date} date
    */
    static formatDate (date: Date): string {
        return $.pad(date.getDate()) + '.' + $.pad(date.getMonth() + 1) + '.' + date.getFullYear();
    }

    /**
     * Loads a javascript file
     * @param {string} path Path and filename
    */
    static script (path: string): void {
        $.head.append($.create('<script type="text/javascript" src="' + path + '"></script>').get());
    }

    /**
     * Loads a CSS file
     * @param {string} path Path and filename
    */
    static stylesheet (path: string): void {
        $.head.append($.create('<link rel="stylesheet" href="' + path + '"/>').get());
    }

    /**
     * Returns the IE Version if browser is IE, otherwise undefined
    */
    static isIE (): undefined | number {
        //equals version number in IE, undefined everywhere else
        return document.documentMode;
    }

    /**
     * @exclude all
     */
    static isTouchDevice (): boolean {
        return navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/) !== null || ('ontouchstart' in window) || navigator.msMaxTouchPoints > 0 || navigator.maxTouchPoints !== null;
    }

    /**
     * Lazy loads SVG images into the DOM
     */
    static preloadSvg (): void {
        let svgElements = $.cl('svg');
        svgElements.each(function(this: HTMLImageElement) {
            let $this = $.of(this),
              src = $this.data('src'),
              cl = this.className;
            
            this.removeAttribute('data-src');
            $.fetch(src).then((data: string) => {
                this.innerHTML = data;
            });
        });
    }

    /**
     * Lazy loads all images with a data-src attribute
     */
    static preloadImages (): void {
        $.of('img[data-src]:not(.svg)').each(function () {
            let self = $.of(this);
            self.attr('src', self.data('src'));
            self.on('load', () => self.css('opacity', '1'));
        });
    }

    /**
     * Creates a query string to send in an XHR from an object
     * @param {Object|string} obj The object to encode
     * @return {?string} The encoded query string
    */
    static getQueryString (obj: string | Object): string | null {
        if (typeof obj === 'string') {
            return obj;
        }

        var str = "";
        for (var key in obj) {
            str += encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]) + "&";
        }

        return str.substr(0, str.length - 1);
    }

    /**
     * Sends an XmlHttpRequest to the given URL using a promise
     * @param {string} url The URL to post to
     * @param {Object} data The JavaScript Object to send
     * @param {string} method The HTTP method to use
     * @param {boolean=} isSerialized If true, the data will not be serialized again
     * @return {Promise}
    */
    static xhr (url: string, data: object | string, method: string = 'POST', isSerialized: boolean = false, onProgress?: (e: ProgressEvent) => void): Promise<any> {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            if(onProgress) {
                xhr.onprogress = onProgress;
            }

            xhr.onload = function () {
                if (xhr.status == 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.statusText);
                }
            }

            xhr.onerror = function () {
                reject(Error("Network Error"));
            }

            if (!isSerialized) {
                xhr.send($.getQueryString(data));
            } else if (typeof data === 'string') {
                xhr.send(data);
            }
        });
    }

    /**
     * Sends a  GET-XmlHttpRequest to the given URL using a promise
     * @param {string} url The URL to fetch
     * @param {Object} data The JavaScript Object to send
     * @param {boolean=} isSerialized If true, the data will not be serialized again
     * @return {Promise}
    */
    static fetch (url: string, data: object | string = {}, isSerialized = false, onProgress?: (e: ProgressEvent) => void): Promise<any> {
        return $.xhr(url, data, 'GET', isSerialized, onProgress);
    }

    /**
     * Sends a POST-XmlHttpRequest to the given URL using a promise
     * @param {string} url The URL to post to
     * @param {Object} data The JavaScript Object to send
     * @param {boolean=} isSerialized If true, the data will not be serialized again
     * @return {Promise}
    */
    static post (url: string, data: object | string = {}, isSerialized = false, onProgress?: (e: ProgressEvent, ) => void): Promise<any> {
        return $.xhr(url, data, 'POST', isSerialized, onProgress);
    }

    /**
     * Sets or gets a cookie for the base domain
     * @param {string} name The cookie's name
     * @param {string} value The cookie's value
     * @param {dtl=} dtl Days until expiration, default 7
    */
    static cookie (name: string, value?: string, dtl: number = 7): string | undefined {
        if ($.isDefined(value)) {
            var d: Date = new Date();
            d.setTime(d.getTime() + (dtl * 24 * 60 * 60 * 1000));
            var dateString: string = 'expires=' + d.toUTCString(),
                host = window.location.hostname.match(/[^\.]*.de/g);
            document.cookie = name + '=' + value + '; ' + dateString + '; path=/; domain=.' + host;
        } else {
            var cookies = document.cookie.split(';'),
                regex = new RegExp(name + '=(.*)?[;]{0,1}', 'g');

            var res = '',
                match: RegExpExecArray;
            if (cookies.length > 0) {
                cookies.forEach(function (c) {
                    if ((match = regex.exec(c)) !== null) {
                        res = match[1];
                    }
                    regex.lastIndex = 0;
                });
            } else {
                if ((match = regex.exec(document.cookie)) !== null) {
                    res = match[1];
                }
            }

            return res;
        }
    }

    /**
     * Returns whether or not the cookie with the given name exists
     * @param {string} name Name to check
    */
    static cookieSet (name: string): boolean {
        return $.cookie(name) !== '';
    }

    /**
     * 
     * @param obj
     * @exclude all
     */
    static exportObject (obj: object): void {
        var str = 'interface _ {\n';
        Object.keys(obj).forEach(function (prop) {
            if (obj.hasOwnProperty(prop)) {
                if (typeof obj[prop] === 'function') {
                    let signature = obj[prop].toString().match(/\(.*?\)/);
                    str += '\t' + prop + signature + ': any;\n';
                } else {
                    str += '\t' + prop + ': ' + typeof obj[prop] + ';\n';
                }
            }
        });
        str += '\n}';

        console.log(str);
    }

    /**
     * Returns the key code of a keyboard event in all browsers
     * @param e 
     */
    static keyCode (e: KeyboardEvent) {
        return e.which || e.keyCode;
    }

    /**
     * Returns whether the event is an input event, i.e. a letter, number or backspace
     * @param e 
     */
    static isInputEvent (e: KeyboardEvent) {
        let str = String.fromCharCode($.keyCode(e));
        return str.match(/[a-zA-Z0-9 ]/) || $.keyCode(e) === 8;
    }

    /**
     * Partitions an array into two arrays, one where all elements 
     *  pass the predicate and one where they don't
     * @param arr 
     * @param pred
     * @exclude all 
     */
    static partition<T> (arr: T[], pred: (val: T) => boolean): [T[], T[]] {
        let success: T[] = [],
          fail: T[] = [];
         arr.forEach(val => {
             pred(val) ? success.push(val) : fail.push(val);
         });

         return [success, fail];
    }

    /**
     * Removes all falsey values from the array (0, '', false, undefined, null, NaN)
     * @param arr 
     * @exclude all
     */
    static clean (arr: any[]): any[] {
        return arr.filter(el => {
            return el;
        });
    }

    /**
     * Returns an array without all specified elements
     * @param arr 
     * @param without 
     * @exclude all
     */
    static without (arr: any[], ...without: any[]): any[] {
        return arr.filter(el => {
            return !$.inArray(el, without);
        });
    }

   /**
    * Merges two arrays into an object with the values of the first array as keys
    * @param arr 
    * @param arr2 
    * @exclude all
    */
    static objectify (arr: any[], arr2: any[]): object {
        let obj = {};
        if(arr.length >= arr2.length) {
            arr.forEach((el, ind) => {
                obj[arr[ind]] = arr2[ind];
            });
        } else {
            arr2.forEach((el, ind) => {
                obj[arr[ind]] = arr2[ind];
            });
        }

        return obj;
    }

    /**
     * Navigates to a different url on the same domain without reloading the page
     * @param url 
     * @param route
     */
    static navigate (url: string): Promise<any> {
        if (!(history && history.pushState)) {
            window.location.href = url;
        }

        let onProgress = function (e: ProgressEvent, contentLength: string) {
            let length = Number.parseInt(contentLength);
        };

        let pr = new Promise<string>(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            if (onProgress) {
                xhr.onprogress = function(e) {
                    onProgress(e, xhr.getResponseHeader('Content-Length'));
                };
            }

            xhr.onload = function () {
                if (xhr.status == 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.statusText);
                }
            }

            xhr.onerror = function () {
                reject(Error("Network Error"));
            }

            xhr.send($.getQueryString({ 'url': url }));
        });

        return pr.then(res => {
            let _res = JSON.parse(res);
            let html: string = _res['content'],
              route: string = _res['route'];

            $.primary.html(html);
            $.html.removeClass(Env.route).addClass(route);
            
            Env.route = route;
            $.preloadImages();

            if (history && history.pushState) {
                history.pushState('', '', url);
            }

            return html;
        }).catch(e => {
            log(e);
            // window.location.href = url;
        });;
    }

    private static _queryRegex = /[?&]([^=]*)?(=([^&#\/]*)|&|#|\/|$)/g;
    private static _parsed = false;
    private static _queryParams = {};

    /**
     * Returns a parameter from the query string by name
     * @param name 
     */
    static query (name: string): string {
        if(!$._parsed) {
            let url = window.location.href,
              match;
            while((match = $._queryRegex.exec(url)) !== null) {
                if(!match[3]) {
                    match[3] = '';
                }

                $._queryParams[match[1]] = match[3];
            }
            $._parsed = true;
        }


        return $._queryParams[name];
    }

    /**
     * Executes the given function only after 'wait' time has passed without it being invoked
     * @param fn 
     * @param wait 
     */
    static debounce (fn: (...args) => any, wait = 100) {
        let timeout: number;
        return function (...args) {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                fn.call(this, ...args);
            }, wait);
        }
    }

    /**
     * Adds two numbers, but wraps around if the result is bigger than wrapEnd
     * @param a 
     * @param b 
     * @param wrapEnd
     * @param wrapStart
     */
    static addWithWrap(a: number, b: number, wrapEnd: number, wrapStart = 0) {
        if (a + b < wrapEnd) {
            return a + b;
        } else {
            return wrapStart + ((a + b) % wrapEnd);
        }
    }

    static html: NodeSet;
    static window: NodeSet;
    static document: NodeSet;

    static body: NodeSet;
    static head: NodeSet;
    static primary: NodeSet;

    static ui;
}