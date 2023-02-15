
class NodeSet implements NodeSetInterface {
    public isEmpty: boolean;
    public length: number;
    private elements: HTMLElement[];
    private isSingle: boolean;
    private listeners: ListenerInterface[] = [];

    constructor(elements: any[]) {
        this.elements = $.flatten(elements);
        this._checkIfEmpty();
    }

    private _checkIfEmpty() {
        this.isEmpty = this.elements.length === 0;
        this.isSingle = this.elements.length === 1;
        this.length = this.elements.length;
    }

    get(): HTMLElement {
        if (!this.isEmpty) {
            return this.elements[0];
        } else {
            return document.createElement('div');
        }
    }

    withChildren(): HTMLElement[] {
        return this.elements.concat(this.children().all());
    }

    all(): HTMLElement[] {
        return this.elements;
    }

    set(elements: HTMLElement[]): NodeSet {
        this.elements = elements;

        return this;
    }

    getListeners(): ListenerInterface[] {
        return this.listeners;
    }

    addListener(obj: ListenerInterface): NodeSet {
        this.listeners.push(obj);

        return this;
    }

    removeListener(obj: ListenerInterface): NodeSet {
        $.removeByValue(this.listeners, obj);

        return this;
    }

    each(func: (index?: number, node?: NodeSet) => void): NodeSet {
        let i = 0;

        this.elements.forEach(node => {
            func.apply(node, [i++]);
        });

        return this;
    }

    stream () {
        return new NodeStream(this.elements);
    }

    /**
     * Retrieves the first element of the collection
    */
    first(): NodeSet {
        return $.of(this.get());
    }

    /**
     * Retrieves the last element of the collection
    */
    last(): NodeSet {
        return $.of(this.elements[this.elements.length - 1]);
    }

    /**
     * Retrieves an element of the collection by index as a
     *  new NodeSet
     * @param {number} index
    */
    at(index: number): NodeSet {
        return $.of(this.elements[index]);
    }

    /**
     * Returns a new NodeSet with the elements that match the selector
     * @param {string} selector
    */
    only(selector: string): NodeSet {
        return $.of(this.elements.filter(function (node) {
            return $.matches(node, selector);
        }));
    }

    /**
     * Returns a new NodeSet with the elements that don't match the selector
     * @param {string} selector
    */
    not(selector: string): NodeSet {
        let matches = $.findMatches(this.elements, selector);
        return $.of(this.elements.filter(function (node) {
            return !$.inArray(node, matches);
        }));
    }

    /**
     * Drops all elements that don't match the selector
     * @param {string} selector
    */
    filter(selector: string | ((el: HTMLElement) => boolean)): NodeSet {
        if (typeof selector === 'function') {
            this.set(this.elements.filter(function (node) {
                return selector(node);
            }));
        } else {
            this.set(this.elements.filter(function (node) {
                return $.matches(node, selector);
            }));
        }

        this._checkIfEmpty();
        return this;
    }

    /**
     * Drops all elements that match the selector
     * @param {string} selector
    */
    drop(selector: string | ((el: HTMLElement) => boolean)) {
        if (typeof selector === 'function') {
            this.set(this.elements.filter(function (node) {
                return !selector(node);
            }));
        } else {
            this.set(this.elements.filter(function (node) {
                return !$.matches(node, selector);
            }));
        }

        this._checkIfEmpty();
        return this;
    }

    /**
     * Maps all elements into an array
     * @param {Function} mapping
    */
    map<T>(mapping: (el: HTMLElement) => T): T[] {
        let res = [];
        this.elements.forEach(node => {
            res.push(mapping.apply(node));
        });

        return res;
    }

    /**
     * Finds one matching element
     * @param {string} selector
    */
    find(selector: string): HTMLElement {
        let matches = $.findMatches(this.elements, selector);

        return matches[0];
    }

    /**
     * Returns all elements until one fits the selector
     * @param {string} selector
    */
    until(selector: string | HTMLElement | NodeSet): NodeSet {
        let found = false;
        this.set(this.elements.filter(node => {
            if ($.matches(node, selector)) {
                found = true;
            }

            return !found;
        }));

        this._checkIfEmpty();
        return this;
    }

    /**
     * Returns all elements after one fits the selector
     * @param {string} selector
    */
    after(selector: string | HTMLElement | NodeSet): NodeSet {
        let found = false;
        this.set(this.elements.filter(node => {
            let _found = found;
            if ($.matches(node, selector)) {
                found = true;
            }

            return found && _found;
        }));

        this._checkIfEmpty();
        return this;
    }

    /**
     *  Adds a node
     *  @param {*} node
    */
    add(node: string | HTMLElement | NodeSet): NodeSet {
        if (typeof node === 'string') {
            node = $.of(node).get();
        } else if (node instanceof NodeSet) {
            node = node.get();
        }
        this.elements.push(node);

        this._checkIfEmpty();
        return this;
    }

    /**
    *  Returns the number of enclosed elements
    */
    size(): number {
        return this.elements.length;
    }

    private _warn(msg: string = 'Single only method called on Set.') {
        if (!this.isSingle && Env.name === 'dev') {
            if (console.trace) {
                console.trace();
            }
            console.warn(msg);
        }
    }

    private _addClassSVG(target: HTMLElement, className: string): void {
        var classes = target.getAttribute('class');

        if (classes.match(className)) {
            return;
        }

        target.setAttribute('class', classes + ' ' + className);
    }

    /**
    * Adds the given class to all elements
    * @param {string} className
    */
    addClass(className: string): NodeSet {
        let self = this;
        this.each(function () {
            if (typeof this.className !== 'string') {
                self._addClassSVG(this, className);
            }

            if (this.className.match(new RegExp('\\b' + className + '\\b'))) {
                return;
            }
            
            this.className = (this.className + ' ' + className).trim();
        });

        return this;
    }

    private _removeClassSVG(target: HTMLElement, className: string): void {
        var classes = target.getAttribute('class');

        target.setAttribute('class', classes.replace(className, '').trim());
    }

    /**
    * Removes the given class from all elements
    * @param {string} className
    */
    removeClass(className: string): NodeSet {
        let self = this;
        this.each(function () {
            if (typeof this.className !== 'string') {
                return self._removeClassSVG(this, className);
            }

            this.className = (this.className.replace(className, '')).trim();
        });

        return this;
    }

    private _hasClassSVG(target: HTMLElement, className: string): boolean {
        var classes = target.getAttribute('class') || '';
        return classes.match(new RegExp("\\b" + className + "\\b", 'g')) !== null;
    }

    /**
     * Single only
     * Returns whether the element has the given class
     * @param {string} className
    */
    hasClass(className: string): boolean {
        this._warn();

        let element = this.get();
        if (typeof element.className !== 'string') {
            return this._hasClassSVG(element, className);
        }

        return element.className.match(new RegExp("\\b" + className + "\\b", 'g')) !== null;
    }

    /**
    * Toggles the given class of all elements
    * @param {string} className
    */
    toggleClass(className: string): NodeSet {
        this.each(function () {
            if ($.of(this).hasClass(className)) {
                $.of(this).removeClass(className);
            } else {
                $.of(this).addClass(className);
            }
        });

        return this;
    }

    /**
     * Adds an event listener to all elements
     * @param {string} type
     * @param {*=} handler
    */
    on (type: string, handler: EventHandler): NodeSet {
        this.each(function () {
            if (type === 'ready') {
                $.ready(handler);
            } else if(type === 'submit') {
                $.of(this).submit(handler);
            } else {
                type.split(' ').forEach(t => {
                    $.of(this).addListener({ type: t, handler: handler });
                    this.addEventListener(t, handler);
                });
            }
        });

        return this;
    }

    /**
     * Delegate the execution of an event to all children matching a
     *  selector
     * @param {string} type
     * @param {string} childSelector
     * @param {Function} handler
    */
    delegate (type: string, childSelector: string, handler: EventHandler, children = false): NodeSet {
        this.each(function () {
            $.of(this).on(type, function (event) {
                let condition;
                if(childSelector !== '*' && children) {
                    var target = $.of(childSelector),
                      accepted = target.stream().children().collect().all().concat(target.get());
                    condition = $.inArray(event.target, accepted);
                } else {
                    condition = $.matches(event.target, childSelector);
                }
                if (childSelector === '*' || condition) {
                    handler.call(event.target, event);
                }
            });
        });

        return this;
    }

    /**
    * Removes an event listener
    * @param {string} type
    * @param {*=} callback
    */
    off(type: string, callback?: EventHandler): NodeSet {
        this.each(function (this: Element) {
            if (typeof callback === 'undefined') {
                var self = this;
                $.of(this).getListeners().forEach(function (listener) {
                    if (listener.type === type) {
                        self.removeEventListener(type, listener.callback);
                        $.of(self).removeListener(listener);
                    }
                });
            } else {
                this.removeEventListener(type, callback);
            }
        });

        return this;
    }

    /**
    * Triggers an event of the given type
    * @param {string} type
    */
    trigger(type: string): NodeSet {
        this.each(function () {
            if (type === 'submit') {
                this.submit();
            }
            var event;
            if (document.createEvent) {
                event = document.createEvent('HTMLEvents');
                event.initEvent(type, true, true);
                event.eventName = type;
                this.dispatchEvent(event);
            } else {
                event = document.createEventObject();
                event.eventType = type;
                event.eventName = type;
                this.fireEvent('on' + event.eventType, event);
            }
        });

        return this;
    }

    /**
    * Focuses the element or adds event listeners
    * @param {Function=} focusIn
    * @param {Function=} focusOut
    */
    focus(focusIn?: EventHandler, focusOut?: EventHandler): NodeSet {
        this.each(function () {
            var focus = true;
            if (focusIn) {
                focus = false;
                $.of(this).on('focusin', focusIn);
            }
            if (focusOut) {
                focus = false;
                $.of(this).on('focusout', focusOut);
            }
            if (focus) {
                this.focus();
            }
        });

        return this;
    }

    /**
    * Adds hover event listeners
    * @param {Function=} hoverIn
    * @param {Function=} hoverOut
    */
    hover(hoverIn: EventHandler, hoverOut?: EventHandler): NodeSet {
        this.each(function () {
            $.of(this).on('mouseover', hoverIn);
            if (hoverOut) {
                $.of(this).on('mouseout', hoverOut);
            }
        });

        return this;
    }

    /**
     * Single Only
     * Retrieves the children of the element
     * @param {string=} selector
    */
    children(selector?: string): NodeSet {
        this._warn();
        let element = this.get();

        return $.findChildren(element, selector);
    }

    /**
     * Single Only
     * Retrieves a single child
     * @param {string=} selector
    */
    child(selector?: string): NodeSet {
        this._warn();
        let element = this.get();

        return $.of(element).children(selector).first();
    }

    /**
     * Single Only
     * Returns the element's parent
    */
    parent(): NodeSet {
        this._warn();
        let element = this.get();

        return $.of(element.parentNode);
    }

    /**
     * Single Only
     * Returns all siblings matching the selector
     * @param {string=} selector
    */
    siblings(selector?: string): NodeSet {
        this._warn();
        let self = this;

        return this.parent().children(selector).filter(el => {
            return el !== self.get();
        });;
    }

    /**
     * Returns a single sibling
     * @param selector 
     */
    sibling (selector?: string): NodeSet {
        return this.parent().child(selector);
    }

    /**
     * Deletes all of the nodes children
    */
    empty(): NodeSet {
        this.each(function () {
            $.of(this).children().remove();
        });

        return this;
    }

    /**
     * Single Only
     * Returns a selector
    */
    getSelector(children: any = ''): string {
        this._warn();
        let element: HTMLElement = this.get(),
            tag: string = element.tagName.toLowerCase();

        if (typeof element.className === 'string' && element.id !== '') {
            return tag + '#' + element.id + children;
        } else if (typeof element.className === 'string' && element.className !== '') {
            var selector = '';
            element.className.split(' ').forEach(function (className) {
                if (className !== '') {
                    selector += '.' + className;
                }
            });
            return tag + selector + children;
        } else {
            var par = $.of(this).parent();
            if (par.get() !== null) {
                return par.getSelector([' ' + tag]);
            } else {
                return tag;
            }
        }
    }

    private _cssSet(styleAttribute: string, value: string | number) {
        this.each(function () {
            this.style[styleAttribute] = value;
        })
    }

    private _cssGet(styleAttribute: string) {
        this._warn();
        let element: HTMLElement = this.get();

        let style = window.getComputedStyle(element),
            result = style[styleAttribute];
            
        if (result === '') {
            let style = element.style[styleAttribute];
            
            if (style == '') {
                result = '0';
            } else {
                result = style;
            }
        }
        //check if purely numerical value
        result = result.replace('px', '');
        if (result.match(/^[0-9]+$/g)) {
            return parseFloat(result);
        } else {
            return result;
        }
    }
    /**
     * Retrieves or changes the CSS style of the element
     * @param {string} styleAttribute
     * @param {string=} value
    */
    css (styleAttribute: string | object): string;
    css (styleAttribute: string | object, value: string | number): NodeSet;
    css (styleAttribute: string | object, value?: string | number): string | NodeSet {
        //apply multiple styles
        if(typeof styleAttribute === 'string' && styleAttribute.match(/:/) && typeof value === 'undefined') {
            return this.each(function(this: HTMLElement) {
                this.style.cssText = styleAttribute;
            });
        }

        if (typeof styleAttribute === 'object') {
            var self = $.of(this);
            Object.keys(styleAttribute).forEach(function (key) {
                self.css(key, styleAttribute[key]);
            });
        } else {
            if (typeof value !== 'undefined') {
                this._cssSet(styleAttribute, value);
            } else if(typeof styleAttribute !== 'object') {
                return this._cssGet(styleAttribute);
            }
        }

        return this;
    }

    /**
     * Single Only
     * Returns the elements position relative to the given element
     *  or by default, the document
    */
    offset(): OffsetInterface {
        this._warn();

        let element: HTMLElement = this.get(),
            rect = element.getBoundingClientRect(),
            top = rect.top,
            left = rect.left,
            right = rect.right,
            bottom = rect.bottom;

        return {
            top: top,
            left: left,
            right: right,
            bottom: bottom
        }
    }

    private _widthSet(width: number | string): void {
        this.each(function () {
            $.of(this).css('width', width);
        });
    }

    private _widthGet(): number {
        this._warn();
        let element: HTMLElement | Window = this.get();

        if (element instanceof Window) {
            let _width = element.innerWidth || element.clientWidth;
            return _width;
        }

        return element.getBoundingClientRect().width;
    }

    /**
     * Sets or returns the width of the element
     * @param {number=} width
    */
    width(width: number | string): NodeSet;
    width(): number;
    width(width?: number | string): number | NodeSet {
        if (typeof width === 'undefined') {
            return this._widthGet();
        } else {
            this._widthSet(width);
            return this;
        }
    }

    private _heightSet(height: number | string): void {
        this.each(function () {
            $.of(this).css('height', height);
        });
    }

    private _heightGet(): number {
        this._warn();
        let element: HTMLElement | Window = this.get();

        if (element instanceof Window) {
            let _height = element.innerHeight || element.clientHeight;
            return _height;
        }
        return element.getBoundingClientRect().height;
    }

    /**
    * Sets or returns the height of the element (including padding and
    *  excluding margin)
    * @param {number=} height
    */
    height(height: number | string): NodeSet;
    height(): number;
    height(height?: number | string): number | NodeSet {
        if (typeof height === 'undefined') {
            return this._heightGet();
        } else {
            this._heightSet(height);
            return this;
        }
    }

    /**
    * Returns the objects height in case it is not displayed
    */
    hiddenHeight(outer: boolean): number {
        this._warn();
        let element: HTMLElement = this.get(),
            clone = $.of($.of(element).clone(true, false));

        clone.hide();
        $.body.append(clone.get());
        var height = clone.height();
        if (outer) {
            height += parseInt(clone.css('margin-top')) + parseInt(clone.css('margin-bottom'));
        }
        clone.remove();
        return height;
    }

    /**
    * Returns the elements height including its margin
    */
    outerHeight(): number {
        this._warn();
        let element: HTMLElement = this.get(),
            self = $.of(element),
            h = self.height(),
            marginTop = parseInt(self.css('margin-top')),
            marginBottom = parseInt(self.css('margin-bottom'));

        return h + marginBottom + marginTop;
    }

    /**
    * Returns the elements width including its margin
    */
    outerWidth(): number {
        this._warn();
        let element: HTMLElement = this.get(),
            self = $.of(element),
            w = self.width(),
            marginLeft = parseInt(self.css('margin-left')),
            marginRight = parseInt(self.css('margin-right'));

        return w + marginLeft + marginRight;
    }

    /**
    * Returns the elements height excluding its padding
    */
    innerHeight(): number {
        this._warn();
        let element: HTMLElement = this.get(),
            self = $.of(element),
            h = self.height(),
            paddingTop = parseInt(self.css('padding-top')),
            paddingBottom = parseInt(self.css('padding-bottom'));

        return Math.max(h - paddingBottom - paddingTop, 0);
    }

    /**
    * Returns the elements width excluding its padding
    */
    innerWidth(): number {
        this._warn();
        let element: HTMLElement = this.get(),
            self = $.of(this),
            w = self.width(),
            paddingLeft = parseInt(self.css('padding-left')),
            paddingRight = parseInt(self.css('padding-right'));

        return Math.max(w - paddingLeft - paddingRight, 0);
    }

    /**
    * Sets or returns the text content of the element
    * @param {string=} text
    */
    text (): string;
    text (text: string): NodeSet;
    text (text?: string): string | NodeSet {
        if (typeof text === 'undefined') {
            this._warn();
            let element = this.get();

            return element.textContent;
        } else {
            this.each(function () {
                this.textContent = text.toString();
            });

            return this;
        }
    }

    /**
    * Returns the value of the attribute with the given
    *  name or sets a new value
    * @param {string} name
    * @param {string=} value
    */
    attr(name: string): string;
    attr(name: string, value: string): NodeSet;
    attr(name: string, value?: string): string | NodeSet {
        if (typeof value === 'undefined') {
            this._warn();
            let element = this.get();

            return element.getAttribute(name);
        } else {
            this.each(function () {
                this.setAttribute(name, value);
            });

            return this;
        }
    }

    /**
    *  Disables the node
    */
    disable(): NodeSet {
        this.each(function () {
            this.setAttribute('disabled', 'true');
        });

        return this;
    }

    /**
    *  Reenables the node
    */
    enable(): NodeSet {
        this.each(function () {
            this.removeAttribute('disabled');
        });

        return this;
    }

    /**
    * Completely removes an attribute
    * @param {string} name
    */
    removeAttribute(name): NodeSet {
        this.each(function () {
            this.removeAttribute(name);
        });

        return this;
    }

    /**
     * Returns or sets the value of the "value" attribute
     * @param {string=} value
    */
    val(): string;
    val(value: string): NodeSet;
    val(value?: string): string | NodeSet {
        if (typeof value === 'undefined') {
            this._warn();
            let element = this.get(),
                value: string;
            if ($.isDefined(element['value'])) {
                value = element['value'];
            } else {
                value = element.getAttribute('value');
            }

            if (value !== this.attr('placeholder')) {
                return value;
            } else {
                return '';
            }
        } else {
            this.each(function () {
                if ($.isDefined(this.value)) {
                    this.value = value;
                } else {
                    this.setAttribute('value', value);
                }
            });

            return this;
        }
    }

    /**
     * Returns or sets the value of the "data-" attribute
     * @param {string} name
     * @param {string=} value
    */
    data(name: string): string;
    data(name: string, value: string): NodeSet;
    data(name: string, value?: string): string | NodeSet {
        if (typeof value === 'undefined') {
            this._warn();

            return this.get().getAttribute("data-" + name);
        } else {
            this.each(function () {
                this.setAttribute("data-" + name, value);
            });

            return this;
        }
    }

    /**
     * Returns the elements unique node-id
    */
    nodeId(): string {
        this._warn();

        return this.data('nodeid');
    }

    /**
     * Hides the element
    */
    hide(): NodeSet {
        this.each(function () {
            this.style['visibility'] = 'hidden';
        });

        return this;
    }

    /**
     * Shows the element
    */
    show(): NodeSet {
        this.each(function () {
            this.style['visibility'] = 'visible';
        });

        return this;
    }

    /**
     * Toggles the visibility of the element
    */
    toggleVisibility(): NodeSet {
        this.each(function () {
            let self = $.of(this);
            if (self.css('visibility') === 'hidden') {
                self.show();
            } else {
                self.hide();
            }
        });

        return this;
    }

    /**
     * Toggles the display property of the element
     * @param {string} display
    */
    toggleDisplay(display: string = 'block'): NodeSet {
        this.each(function () {
            if (this.style['display'] === 'none') {
                this.style['display'] = display;
            } else {
                this.style['display'] = 'none';
            }
        });

        return this;
    }

    /**
     * Registers an event in case a click is performed outside of the
     *  element or its children
     * @param {Function} callback
     * @param {Array} exceptions
    */
    outsideClick(callback: EventHandler, exceptions: any[] = []): NodeSet {
        this._warn();
        let element = this.get(),
            exc = $.of(self).children().all().concat(element);

        exceptions.forEach(obj => {
            if (obj instanceof NodeSet) {
                exc.push(obj.get());
                exc.push(obj.children().get());
            } else {
                exc.push(obj);
                exc.push($.of(obj).children().get());
            }
        });
        exc = $.flatten(exc);

        $.html.click(e => {
            if (!$.inArray(e.target, exc) && element.style['display'] !== 'none') {
                callback.call(this, e);
            }
        });

        return this;
    }

    /**
     * Returns or sets selected index of a "select" form field
     * @param {number} val
    */
    selectedIndex(): number;
    selectedIndex(val: number): NodeSet;
    selectedIndex(val?: number): number | NodeSet {
        if (typeof val !== 'undefined') {
            this.each(function () {
                this.selectedIndex = val;
            });

            return this;
        } else {
            this._warn();
            let element = this.get();

            return (element instanceof HTMLSelectElement) ? element.selectedIndex : -1;
        }
    }

    /**
    *  Removes all elements that fit the selector
    *   from the DOM
    *  @param {string} selector
    */
    remove(selector?: string): NodeSet {
        let $this = this;
        this.each(function () {
            var remove = typeof selector === 'undefined' || $.matches(this, selector);
            if (remove) {
                if (typeof this.remove === 'function') {
                    this.remove();
                } else {
                    if ($.isDefined(this.parentNode)) {
                        this.parentNode.removeChild(this);
                    }
                }
                $this.drop(el => el === this)
            }
        });
        
        return this;
    }

    /**
    * Inserts a new node after the current one
    * @param {string} nodeString
    */
    insertAfter(nodeString: string): NodeSet {
        this._warn();
        this.get().insertAdjacentHTML('afterend', nodeString);

        return this;
    }

    /**
     * Inserts a new node inside the current one
     * @param {string} nodeString
    */
    append(...args: (Element | NodeSet | string)[]): NodeSet {
        this.each(function () {
            $.flatten(args).forEach(node => {
                if (typeof node === 'string') {
                    this.insertAdjacentHTML('beforeend', node);
                } else if (node instanceof NodeSet) {
                    this.appendChild(node.get());
                } else {
                    this.appendChild(node);
                }
            });
        });

        return this;
    }

    /**
     * Inserts a new node before the end of the current one
     * @param {string} nodeString
    */
    insertBefore(nodeString: string): NodeSet {
        this.each(function () {
            this.insertAdjacentHTML('beforebegin', nodeString);
        });

        return this;
    }

    /**
    * Inserts a new node inside at the start of the current one
    * @param {string} nodeString
    */
    prepend(nodeString: string): NodeSet {
        this.each(function () {
            this.insertAdjacentHTML('afterbegin', nodeString);
        });

        return this;
    }

    /**
    * Wraps the element in a new node
    * @param {string} nodeString
    */
    wrap(wrapper: string | NodeSet): NodeSet {
        this.each(function () {
            var _wrapper: NodeSet;
            if (typeof wrapper === 'string') {
                _wrapper = $.create(wrapper);
            } else {
                _wrapper = wrapper;
            }

            var clone = this.cloneNode(true);
            $.of(this).getListeners().forEach(function (l) {
                clone.addEventListener(l.type, l.callback);
            });

            _wrapper.append(clone);
            this.parentNode.insertBefore(_wrapper.get(), this);
            $.of(this).remove();
            $.of(this).set(clone);
        });

        return this;
    }

    /**
    * Return the node's inner HTML
    */
    html(): string;
    html(value: string): NodeSet;
    html(value?: string): string | NodeSet {
        if (typeof value === 'undefined') {
            this._warn();

            return this.get().innerHTML;
        } else {
            this.each(function () {
                this.innerHTML = value;
            });

            return this;
        }
    }

    /**
    * Returns a clone of the node
    * @param {boolean} keepChildren
    * @param {boolean} keepListeners
    */
    clone(keepChildren = true, keepListeners = true): NodeSet {
        this._warn();
        let element = this.get(),
            clone = element.cloneNode(keepChildren);

        if (keepListeners) {
            this.getListeners().forEach(listener => {
                clone.addEventListener(listener.type, listener.callback);
            });
        }

        let $clone = $.of(clone);
        $clone.removeAttribute('data-nodeid');
        return $clone;
    }

    /**
    * Scrolls to the elements scroll offset
    * @param {number} duration
    */
    goTo(duration: number = 1000): NodeSet {
        this._warn();
        $.ui.smoothScroll(window.pageYOffset, window.pageYOffset + this.offset().top, duration);

        return this;
    }

    /**
    * Submit event handler that allows returning 'false' to prevent submission
    * @param {Function} handler
    */
    submit (handler?: EventHandler): NodeSet {
        if (typeof handler !== 'undefined') {
            this.addListener({ type: 'submit', handler: handler });
            this.get().addEventListener('submit', function (e) {
                var submit = handler.apply(this, [e]);
                if (!submit) {
                    e.preventDefault();
                }
            }, false);
        } else {
            let target = this.get();
            if(target instanceof HTMLFormElement) {
                target.submit();
            }
        }

        return this;
    }

    /**
    * Returns the elements position relative to its siblings
    */
    index(): number {
        this._warn();
        let element = this.get();

        return $.of(element.parentNode.childNodes).filter(node => {
            return node.nodeType !== 3;
        }).until(element).size();
    }

    /**
    * Serializes a form into a url string
    */
    serialize(): string {
        this._warn();
        let element = this.get(),
            fields = this.children('[name]'),
            queryString = '',
            self,
            val;

        fields.each(function () {
            self = $.of(this);
            if (self.val() !== self.attr('placeholder')) {
                val = self.val();
            } else {
                val = '';
            }
            queryString += encodeURIComponent(self.attr('name')) + '=' + encodeURIComponent(val) + '&';
        });

        return queryString.substr(0, queryString.length - 1);
    }

    [s: string]: any;
}

/**
 * Allows the explicit execution of otherwise single-node-only functions on all nodes
 */
export class NodeStream {
    private elements: NodeSet[] = [];
    constructor (nodes: Element[]) {
        nodes.forEach(node => {
            this.elements.push($.of(node));
        });
    }

    /**
     * Turns the stream back into a NodeSet
     */
    collect () {
        let nodes: Element[] = [];
        this.elements.forEach(el => {
            nodes.push(...el.all());
        });

        return new NodeSet(nodes);
    }

    /**
     * Adds the result of each function call to the stream
     * @param func 
     */
    add (func: () => NodeSet): NodeStream {
        this.elements.forEach(el => {
            this.elements.push(func.apply(el));
        });

        return this;
    }

    /**
     * Replaces all elements with the result set of the function calls
     * @param func 
     */
    alter (func: () => NodeSet): NodeStream {
        let results: NodeSet[] = [],
          visited: string[] = [];

        this.elements.forEach(el => {
            let res: NodeSet = func.apply(el);
            
            if(!res.nodeId()) {
                $.assignId(res);
            }

            if(!res.isEmpty && !$.inArray(res.nodeId(), visited)) {
                visited.push(res.nodeId());
                results.push(res);
            }
        });
        
        this.elements = results;

        return this;
    }

    /**
     * Returns children of all elements
     * @param selector 
     */
    children (selector?: string): NodeStream {
        return this.alter(function() {
            return this.children(selector);
        });
    }
}

export interface NodeSet {
    click: (cb?: EventHandler) => NodeSet;
    scroll: (cb?: EventHandler) => NodeSet;
    resize: (cb?: EventHandler) => NodeSet;
    background: (value: string) => NodeSet;
    color: (value?: string) => NodeSet;
    display: (value?: string) => NodeSet;
    position: (value?: string) => NodeSet;
    overflow: (value?: string) => NodeSet;
    opacity: (value?: string) => NodeSet;
}

['click', 'scroll', 'resize'].forEach(type => {
    NodeSet.prototype[type] = function (this: NodeSet, cb?: EventHandler): NodeSet {
        if (typeof cb !== 'undefined') {
            $.of(this).on(type, cb);
        } else {
            $.of(this).trigger(type);
        }

        return this;
    }
});

['background', 'color', 'display', 'position', 'overflow', 'opacity'].forEach(prop => {
    NodeSet.prototype[prop] = function (this: NodeSet, value?: string): NodeSet | string {
        if(typeof value === 'undefined') {
            return this.css(prop);
        } else {
            this.css(prop, value);
        }

        return this;
    }
});