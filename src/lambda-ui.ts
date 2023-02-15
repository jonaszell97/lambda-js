interface NodeSetInterface {
    animate?(property: string, startVal: any, endVal: any, duration: number, smoothing?: string, callback?: (...args) => any): void;
    animateAll?(properties: Array<object>): void;
    fadeIn?(duration: number): void;
    fadeOut?(duration: number): void;
    counter?(startVal: number, endVal: number, duration?: number, smoothing?: string): void;
    autocomplete?(options?: object): NodeSet;
    datepicker?(options?: object): NodeSet;
    transform?(): string;
    transform?(transformStyle: string): boolean;
    transform?(transformStyle: string): boolean | string;
    resetTransform?(): void;
    scrollPast?(down?: (...args) => any, up?: (...args) => any): void;
}

/**
 * Animates the given property
 * @param {string} property
 * @param {number} startVal
 * @param {number} endVal
 * @param {number} duration
 * @param {string} smoothing
 * @param {Function} callback
*/
// NodeSet.prototype.animate = function(property, startVal, endVal, duration, smoothing, callback) {
    // startVal = $.setDefault(startVal, parseInt($.of(this).css(property)));
    // smoothing = $.setDefault(smoothing, 'easein');
    // Q.assertDefined(startVal);
    // let percentage = -1;
    // let self = $.of(this);
    // if(endVal.toString().match(/%/)) {
    //     percentage = endVal;
    //     endVal = parseInt(self.parent().css(property).replace('px','')) * parseInt(endVal.replace('%','')) / 100;
    // }
    
    // Q.assertType(endVal, 'number');
    // let op = (endVal > startVal) ? function(sum) {
    //         return sum
    //     } : function(sum) {
    //         return startVal - sum;
    // };
    
    // switch(smoothing) {
    //     case 'easein':
    //     case 'easeout':
    //     default:
    //         $.ui.ease(startVal, endVal, duration, function(sum) {
    //             self.css(property, op(sum));
    //         }, smoothing, function() {
    //             if($.isDefined(callback)) {
    //                 callback.apply(self.get());
    //             }
    //             if(percentage !== -1) {
    //                 self.css(property, percentage);
    //             }
    //         });
    //         break;
    //     case 'linear':
    //         $.ui.linear(startVal, endVal, duration, function(sum) {
    //             self.css(property, op(sum));
    //         }, function() {
    //             if($.isDefined(callback)) {
    //                 callback.apply(self.get());
    //             }
    //             if(percentage !== -1) {
    //                 self.css(property, percentage);
    //             }
    //         });
    //         break;
    // }
// }

/**
 * Animates all of the given properties.
 * @param {Array} properties An array of objects with the properties name, duration, end and
 *  callback
 * @exclude all
*/
// NodeSet.prototype.animateAll = function(properties: AnimateAllPropertyInterface): NodeSet {
//     let self = $.of(this);
//     properties.forEach(function(property) {
//         let callback = property.callback,
//           smoothing = property.smoothing,
//           start = property.start;
          
//         self.animate(property.name, start, property.end, property.duration, smoothing, callback);
//     });

//     return this;
// };

NodeSet.prototype.fadeIn = function(this: NodeSet, duration = 500): NodeSet {
    this.each(function() {
        let self = $.of(this);
        
        $.ui.ease(0, 1, duration, function(sum) {
            self.css('opacity', sum);
        });
    });

    return this;
};

NodeSet.prototype.fadeOut = function (this: NodeSet, duration = 500): NodeSet {
    this.each(function() {
        let self = $.of(this);
        
        $.ui.ease(0, 1, duration, function(sum) {
            self.css('opacity', (1 - sum).toString());
        }, 'easein', function() {
            self.css('opacity','0');
        });
    });

    return this;
};

/**
 * Adds an animated counter to the element
 * @param {number} startVal
 * @param {number} endVal
 * @param {number} duration
 * @param {string} smoothing
 * @exclude reg
 * @exclude public
*/
NodeSet.prototype.counter = function(this: NodeSet, startVal = 0, endVal: number, duration = 1000, smoothing = 'easein') {
    let self = this,
        op = (endVal > startVal) ? function(x, y) {
            return x + y;
        } : function(x, y) {
            return x - y;
        };
    
    self.text(startVal.toString());
    window.setTimeout(function() {
        switch(smoothing) {
            case 'easein':
            case 'easeout':
            default:
                var lastInt = 0,
                    val = startVal;
                    
                $.ui.ease(startVal, endVal, duration, function(sum) {
                    if(sum > lastInt) {
                        val = op(val, Math.round(sum - lastInt));
                        lastInt += Math.round(sum - lastInt);
                        self.text(val + '');
                    }
                }, smoothing);
                break;
            case 'linear':
                var lastInt = 0,
                    val = startVal;
                
                $.ui.linear(startVal, endVal, duration, function(sum) {
                    if(sum > lastInt) {
                        val = op(val, Math.round(sum - lastInt));
                        lastInt += Math.round(sum - lastInt);
                        self.text(val + '');
                    }
                });
                break;
        }
    }, 200);
};

/**
 * Repositions the autocompletion container
 * @param {node} input
 * @param {node} container
*/
let _autocompleteResize = function(input: NodeSet, container: NodeSet): void {
    container.css('top', (input.offset().top + input.height() + window.pageYOffset) + 'px');
    container.css('left', (input.offset().left + window.pageXOffset) + 'px');
    container.width(input.width() + 'px');
};

type _AutocompleteOnSelectType = (e?: Event, label?: string, value?: string) => boolean | void;
type _AutocompleteOnChangeType = (val: string) => void;
type _AutocompleteSourceType = (val: string, response: (res: string) => void) => void;

/**
 * Fills out the option fields after response was received
 * @param {node} container
 * @param {Array} children
 * @param {Object} options
*/
let _fillOptions = function(container: NodeSet, children: NodeSet[], options: _AutocompleteOptionInterface[]): any[] {
    let child: NodeSet,
      values = [];

    _clearOptions(container, children);
    options.slice(0,3).forEach(function(opt, i) {
        child = children[i];
        if($.isDefined(opt)) {
            container.css('display','block');
            child.text(opt.label);
            values.push(opt.value);
            child.display('block');
        } else {
            container.hide();
            child.text('');
            child.display('none');
        }
    });

    return values;
};

/**
 * Clears out all children and hides the container
 * @param {node} container
 * @param {Array} children
*/
let _clearOptions = function (container: NodeSet, children: NodeSet[]): void {
    children.forEach(function(child) {
        child.text('');
        child.display('none');
    });
    
    container.css("display","none");
};

interface _AutocompleteOptionInterface {
    label: string;
    value: any;
}

interface _AutocompleteOptionsInterface {
    id?: string;
    source: _AutocompleteSourceType;
    onChange?: _AutocompleteOnChangeType;
    onSelect?: _AutocompleteOnSelectType;
    minLength?: number;
    throttle?: boolean;
}

/**
 * Adds autocompletion to the enclosed input field
 * @param {Object} options
 * @exclude reg
*/
NodeSet.prototype.autocomplete = function (this: NodeSet, options: _AutocompleteOptionsInterface): NodeSet {
    let self = this,
      input: HTMLInputElement = this.get() as HTMLInputElement,
      children = [],
      container = $.create('<div class="autocomplete-container">'),
      onSelect: _AutocompleteOnSelectType,
      onChange: _AutocompleteOnChangeType,
      fireSelect = false,
      fireChange = false,
      source = options.source,
      values = [],
      minLength = options.minLength ? options.minLength : 0,
      throttle = options.throttle ? options.throttle : false,
      init = false, 
      selectedOption: number = -1;
    
    if(options.id) {
        container.attr('id', options.id);
    }
    
    if(options.onSelect) {
        fireSelect = true;
        onSelect = options.onSelect;
    }
    
    // create selection options (<p>'s)
    for(let i = 0; i < 3; i++) {
        let child = $.create('<p class="autocomplete-option">');
        child.data('id', i.toString());
        children.push(child);
        child.display('none');
        container.get().appendChild(child.get());
    }

    const $children = new NodeStream(children).collect(),
      response = function (res) {
            values = _fillOptions(container, children, res);
      };

    container.delegate('click', 'p', function() {
        if(fireSelect) {
            let val = this.textContent,
                event = document.createEvent('Event');

            event.initEvent('autocomplete-select',true,true);

            let fire = onSelect(event, this.textContent, values[$.of(this).data('id')]);

            if(!event.defaultPrevented && fire !== false) {
                input.value = val;
            }
        } else {
            input.value = this.textContent;
        }
        _clearOptions(container, children);
    });
    
    self.click(function() {
        if(!init) {
            _autocompleteResize(self, container);
            init = true;
        }
        if(self.val() !== '') {
            source(self.val(), response);
        }
    });
    
    // reposition container on window resize
    $.window.on('scroll', function() {
        container.hide();
        container.children().hide();
        _autocompleteResize(self, container);
        container.show();
        container.children().show();
    });
    
    $.window.on('resize', function() {
        container.display('none');
    });
    
    // check if onChange event should be fired
    if(options.onChange) {
        fireChange = true;
        onChange = options.onChange;
    }
    
    // value change events
    let inputHandler = function(e) {
        if(e.keyCode !== 38 && e.keyCode !== 40) {
            selectedOption = -1;
            $children.removeClass('active');
        }
        let value = input.value;
        if(value === null || value.length < minLength) {
            _clearOptions(container, children);
        } else {
            if(fireChange) {
                onChange(value);
            }
            
            _autocompleteResize(self, container);
                    
            // call the source function and await response
            source(value, response);
        }
    };
    
    if(throttle) {
        let inputTimeout: number;
        self.on('input', function(e) {
            window.clearTimeout(inputTimeout);
            inputTimeout = window.setTimeout(function() {
                inputHandler(e);
            }, 200);
        });
    } else {
        self.on('input', inputHandler);
    }
    
    // allowing selecting via arrow keys and enter
    document.addEventListener('keydown', e => {
        if (container.css('display') === 'none') {
            return;
        }
        const OPT_COUNT = values.length - 1;
        let significantEvent = false;

        //enter
        if(e.keyCode === 13) {
            return $children.at(selectedOption).click();
        }
        // down arrow
        if (e.keyCode === 40 && selectedOption < OPT_COUNT) {
            significantEvent = true;
            selectedOption++;
        }
        // up arrow
        if (e.keyCode === 38 && selectedOption > 0) {
            significantEvent = true;
            selectedOption--;
        }
        if (e.keyCode === 40 && selectedOption === -1) {
            significantEvent = true;
            selectedOption = 0;
        }

        if (significantEvent) {
            e.preventDefault();
            $children.removeClass('active');
            $children.at(selectedOption).addClass('active');
        }
    });

    container.outsideClick(function() {
        _clearOptions(container, children);
        container.display('none');
    }, [self]);
    
    $.body.append(container);
    
    container.triggerResize = function () {
        _autocompleteResize(self, container);
    };

    return container;
};

/**
 * Resizes and repositions the datepicker to fit its target input
 *  field
 * @param {Node} target
 * @param {Node} datepicker
*/
let _datepickerResize = function(target: NodeSet, datepicker: NodeSet): void {
    datepicker.css('left', (target.offset().left + window.pageXOffset) + 'px');
    datepicker.css('top', (target.offset().top + target.height() + window.pageYOffset) + 'px');
    datepicker.width((0.5 * target.width()) + 'px');
    datepicker.height('auto');
};

interface _DatepickerDateInterface {
    year: number;
    month: number;
    day?: number;
}

/**
 * Returns the number of days of the given month
 * @param {Object} date
*/
let _daysInMonth = function (date: _DatepickerDateInterface): number {
    return (new Date(date.year, date.month + 1, 0)).getDate();
};

/**
 * Returns today's date
*/
let _getDate = function (): _DatepickerDateInterface {
    let today = new Date();
    let month = today.getMonth();
    let year = today.getFullYear();
    let day = today.getDate();
    return {
        day: day, month: month, year: year
    };
};

/**
 * Returns the month before the given one
 * @param {Object} date
*/
let _getPreviousMonth = function (date: _DatepickerDateInterface): _DatepickerDateInterface {
    if(date.month == 0) {
        return {
            month: 11,
            year: date.year - 1
        }
    } else {
        return {
            month: date.month - 1,
            year: date.year
        }
    }
};

/**
 * Returns the month after the given one
 * @param {Object} date
*/
let _getNextMonth = function (date: _DatepickerDateInterface): _DatepickerDateInterface {
    if(date.month == 11) {
        return {
            month: 0,
            year: date.year + 1
        }
    } else {
        return {
            month: date.month + 1,
            year: date.year
        }
    }
};

/**
 * Returns the date of the first monday of the week in which
 *  the new month starts
 * @param {Object} date
*/
let _getFirstDay = function (date: _DatepickerDateInterface): number {
    let prevMonth = _getPreviousMonth(date),
        firstDay: number;
    
    if(new Date(date.year, parseInt($.pad(date.month)), 1).getDay() === 1) {
        return 1;
    }

    for(let i = _daysInMonth(prevMonth); i > 0; i--) {
        if(new Date(prevMonth.year, parseInt($.pad(prevMonth.month)), i).getDay() === 1) {
            firstDay = i;
            break;
        }
    }
    return firstDay;
};

type _DatepickerOnSelectType = (val: string|Date) => void;

/**
 * Fills the datepicker with the given parameters
 * @param {Object} date
 * @param {Node} target
 * @param {boolean} fireSelect
 * @param {Function} onSelect
*/
let _initDatepicker = function (date: _DatepickerDateInterface, onSelect: _DatepickerOnSelectType, allowPast: boolean = true): NodeSet {
    let days = $.create('<div class="datepicker-days">'),
      daysInMonth = _daysInMonth(date),
      _prevMonth = _getPreviousMonth(date),
      daysInPreviousMonth = _daysInMonth(_prevMonth),
      numRows = Math.ceil(daysInMonth / 7),
      d = _getFirstDay(date),
      week = $.create('<div class="datepicker-days-row">'),
      appended: boolean,
      reset = d === 1,
      prevMonth = d !== 1,
      daysTotal = (prevMonth) ? daysInMonth + daysInPreviousMonth - d : daysInMonth - d,
      today = new Date(),
      // allow selection of days before today
      currentMonth = date.month === today.getMonth() && date.year === today.getFullYear(),
      futureOrCurrentMonth = (new Date(date.year + '-' + $.pad(date.month + 1) + '-01')) >= today,
      beforeToday = !allowPast && !futureOrCurrentMonth;
      
    $.range(0, daysTotal).forEach(function(i) {
        appended = false;
        if(i % 7 == 0 && i > 0) {
            days.append(week);
            week = $.create('<div class="datepicker-days-row">');
            appended = true;
        }

        let div1 = $.create('<div>'),
            div2 = $.create('<div>'),
            p = $.create('<p>');

        if(currentMonth && d === today.getDate() && !prevMonth) {
            div2.addClass('today');
            beforeToday = false;
        }
        p.text((d++).toString());

        if(prevMonth) {
            div2.addClass('prevMonth');
        } else if (beforeToday) {
            div2.addClass('before-today');
        } else {
            div2.click(function() {
                let day = $.of(this).children('p').first().text();
                let text = $.pad(day, '0', 2) + '.' + $.pad(date.month + 1, '0', 2) + '.' + date.year;
                onSelect(text);
            });
        }
        if(d > daysInPreviousMonth && !reset) {
            d = 1;
            reset = true;
            prevMonth = false;
        }
        div2.append(p);
        div1.append(div2);
        week.append(div1);
    });
    days.append(week);

    return days;
};

type _DatepickerOnChangeType = (val: _DatepickerDateInterface) => void;
interface _DatepickerOptionsInterface {
    onSelect?: _DatepickerOnSelectType;
    onChange?: _DatepickerOnChangeType;
    id?: string;
    allowPast?: boolean;
}

/**
 * Adds a datepicker to the enclosed input field
 * @param {Object} options
 * @exclude reg
*/
NodeSet.prototype.datepicker = function(this: NodeSet, options?: _DatepickerOptionsInterface): NodeSet {
    let datepicker = $.create('<div class="datepicker">'),
      self = this,
      id = self.nodeId(),
      target = self.get(),
      fireSelect = options && options.onSelect,
      onSelect,
      fireChange = options && options.onChange,
      activeDate = _getDate(),
      daysInMonth,
      visible = false,
      allowPast = options && options.allowPast;
    
    if($.isDefined(options) && options.id) {
        datepicker.attr('id', options.id);
    }
    
    onSelect = function(val) {
        if(fireSelect) {
            let dateString = $.reverseArray(val.replace(/\./g,'-').split('-')).reduce(function(a,b) {
                return a + '-' + b;
            }) as string;
            
            options.onSelect(new Date(dateString));
        }
        self.val(val);
        datepicker.display('none');
        visible = false;
        self.focus();
    }

    // top row
    let topRow = $.create('<div class="datepicker-top-row"></div');
    datepicker.append(topRow);
    
    let backArrow = $.create('<img alt="Zurück" class="left-arrow" src="/images/triangle_rotated.png"/>'),
      monthName = $.create('<p class="valign">' + months[activeDate.month] + ' ' + activeDate.year + '</p>'),
      nextArrow = $.create('<img alt="Weiter" class="right-arrow" src="/images/triangle_rotated.png"/>');

    topRow.append(backArrow);
    topRow.append(monthName);
    topRow.append(nextArrow);
    
    //weekdays
    let weekdays = $.create('<div class="datepicker-weekdays">');
    datepicker.append(weekdays);
    weekdays.slice(1,7).forEach(function(d) {
        weekdays.append('<p>' + d.substr(0,2) + '</p>');
    });
    weekdays.append('<p>' + weekdays[0].substr(0,2) + '</p>');
    
    // days
    datepicker.append(_initDatepicker(activeDate, onSelect, allowPast));
    
    backArrow.click(function() {
        let _activeDate = _getPreviousMonth(activeDate);
        datepicker.children('.datepicker-days').remove();
        monthName.text(months[_activeDate.month] + ' ' + _activeDate.year);
        datepicker.append(_initDatepicker(_activeDate, onSelect, allowPast));
        if(fireChange) {
            options.onChange(_activeDate);
        }
        activeDate = _activeDate;
    });
    
    nextArrow.click(function() {
        let _activeDate = _getNextMonth(activeDate);
        datepicker.children('.datepicker-days').remove();
        monthName.text(months[_activeDate.month] + ' ' + _activeDate.year);
        datepicker.append(_initDatepicker(_activeDate, onSelect, allowPast));
        if(fireChange) {
            options.onChange(_activeDate);
        }
        activeDate = _activeDate;
    });
    
    self.click(function() {
        _datepickerResize(self, datepicker);
        datepicker.display('block');
        visible = true;
    });
    
    datepicker.outsideClick(function(e) {
        if(datepicker.css('display') === 'none') {
            return;
        }
        if (e.target !== self.get() && !$.inArray(e.target, Array.from(datepicker.children().all()))) {
            datepicker.display('none');
            visible = false;
        }
    });

    $.window.resize($.debounce(function() {
        _datepickerResize(self, datepicker)
    }, 200));

    $.html.scroll($.debounce(function () {
        _datepickerResize(self, datepicker)
    }, 200));
    
    _datepickerResize(self, datepicker);
    target.readOnly = true;
    $.body.append(datepicker);
    
    return datepicker;
};

let vendorPrefixes = ['ms', 'o', 'webkit', 'moz'];

/**
 * Applies the given transform property, or returns false if
 *  transforms are unsupported
 * @param {string} transformStyle
*/
NodeSet.prototype.transform = function (this: NodeSet, transformStyle?: string): string|boolean {
    let element = this.get();

    if(typeof element.style.transform !== 'undefined') {
        if(typeof transformStyle !== 'undefined') {
            element.style.transform += transformStyle;
            return true;
        } else {
            return element.style.transform;
        }
    } else {
        let supported = false;
        vendorPrefixes.forEach(function(pref) {
            if (typeof element.style[pref+'Transform'] !== 'undefined') {
                element.style[pref+'Transform'] += transformStyle;
                supported = element.style[pref+'Transform'];
            }
        });

        if(typeof transformStyle !== 'undefined') {
            return supported !== false;
        } else {
            return supported;
        }
    }
};

/**
 * Resets the elements transforms
*/
NodeSet.prototype.resetTransform = function(this: NodeSet): NodeSet {
    this.each(function() {
        if(typeof this.style.transform !== 'undefined') {
            this.style.transform = '';
        } else {
            let supported = false;
            vendorPrefixes.forEach(function(pref) {
                if(typeof this.style[pref+'Transform'] !== 'undefined') {
                    this.style[pref+'Transform'] = '';
                }
            }.bind(this));
        }
    });

    return this;
};

/**
 * Fires the given functions when the element is scrolled by
 * @param {function} down Function to fire when scrolling down
 * @param {function} up Function to fire when scrolling up
 * @exclude all
*/
NodeSet.prototype.scrollPast = function (this: NodeSet, down, up) {
    let fireDown = (typeof down === 'function'),
      fireUp = (typeof up === 'function'),
      self = this,
      firedUp = true,
      firedDown = false;
    
    $.window.scroll($.throttle(function(e) {
        if(this.pageYOffset > self.offset().top && fireDown && !firedDown) {
            down();
            firedDown = true;
            firedUp = false;
        }
        if(this.pageYOffset < self.offset().top && fireUp && !firedUp) {
            up();
            firedDown = false;
            firedUp = true;
        }
    }, 300));
};

interface LoadReturnInterface {
    fadeOut: (n?: number) => void;
}

/**
 * Displays a loading circle
 * @exclude public
 * @exclude reg
 */
NodeSet.prototype.load = function (this: NodeSet): LoadReturnInterface {
    let spinner = $.create(
        `<div class="spinner-container">
            <div class="circularGTop" id="patientSpinnerSpinner">
                <div id="circularG_1" class="circularG"></div>
                <div id="circularG_2" class="circularG"></div>
                <div id="circularG_3" class="circularG"></div>
                <div id="circularG_4" class="circularG"></div>
                <div id="circularG_5" class="circularG"></div>
                <div id="circularG_6" class="circularG"></div>
                <div id="circularG_7" class="circularG"></div>
                <div id="circularG_8" class="circularG"></div>
            </div>
            <svg class="checkmark" id="patientSpinnerCheckmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" opacity: 0;">
                <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"></circle>
                <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
            </svg>
        </div>`
    );

    spinner.css('position', 'absolute')
        .css('top', '50%')
        .css('left', '50%')
        .css('z-index', '5000')
        .transform('translate(-50%,-50%)');

    this.append(spinner);

    return {
        fadeOut: (n = 200) => {
            let $children = spinner.children();
            $children.first().display('none');
            $children.last().display('block');

            setTimeout(() => {
                $children.last().display('none');
            }, n);
        }
    }
};

interface _AccordionOptionsInterface {
    onExpand?: () => void;
    onShrink?: () => void;
    style?: object;
    expanded?: boolean;
    content: NodeSet;
    heading: string;
}

/**
 * Creates a UI accordion
 * @param options
*/
let accordion = function(options: _AccordionOptionsInterface): NodeSet {
    let fireExpand = options.onExpand,
      fireShrink = options.onShrink,
      applyStyles = options.style,
      expanded = options.expanded && options.expanded,
      accord = $.create('<div class="accordion">'),
      headingDiv = $.create('<div class="accordion-heading">'),
      headingh3 = $.create('<h3>' + options.heading + '</h3>'),
      headingCaret = $.create('<div class="caret">'),
      contentDiv = $.create('<div class="accordion-content">'),
      contentContainer = $.create('<div class="accordion-content-container">');
    
    headingDiv.append(headingh3);
    headingDiv.append(headingCaret);
    contentContainer.append(options.content);
    contentDiv.append(contentContainer);

    accord.triggerResize = () => {
        contentDiv.height(contentContainer.outerHeight() + 'px');
    };

    let init = !expanded;
    headingDiv.click(function() {
        if(!init) {
            contentDiv.height(options.content.outerHeight());
            init = true;
            window.setTimeout(function() {
                headingDiv.click();
            }, 100);
            return;
        }
        accord.toggleClass('expanded');
        if(accord.hasClass('expanded')) {
            if(fireExpand) {
                options.onExpand();
            }
            contentDiv.addClass('expanded');
            headingDiv.addClass('expanded');
            if(!$.html.hasClass('csstransitions')) {
                contentDiv.animate('height', 0, options.content.outerHeight(), 250, 'linear');
            } else {
                accord.triggerResize();
            }
        } else {
            if(fireShrink) {
                options.onShrink();
            }
            if(!$.html.hasClass('csstransitions')) {
                contentDiv.animate('height', undefined, 0, 250, 'linear');
            } else {
                contentDiv.height('0px');
            }
            accord.removeClass('expanded');
        }
    });
    
    let resizeTimeout: number;
    $.window.resize(() => {
        if(accord.hasClass('expanded')) {
            window.clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(() => {
                accord.triggerResize();
            }, 100);
        }
    });

    accord.on('transitionend', function() {
        if(!accord.hasClass('expanded')) {
            contentDiv.removeClass('expanded');
            headingDiv.removeClass('expanded');
        }
    });
    
    accord.append(headingDiv);
    accord.append(contentDiv);
    
    if(applyStyles) {
        Object.keys(options.style).forEach(function(key) {
            if(key.match('>')) {
                let selector = key.match(/\>(.*)? /);
                if(selector.length > 1) {
                    let attr = key.replace(selector[0],''),
                        _selector = selector[1],
                        child = accord.children(_selector);
                    child.css(attr, options.style[key]);
                }
            } else {
                accord.css(key, options.style[key]);
            }
        })
    }

    if(expanded) {
        accord.addClass('expanded');
        contentDiv.addClass('expanded');
        headingDiv.addClass('expanded');
    }
    
    accord.toggleExpand = function() {
        headingDiv.click();
    };

    accord.setContent = function(content: string | NodeSet | Element) {
        if(typeof content === 'string') {
            contentContainer.innerHtml = content;
        } else {
            contentContainer.empty();
            contentContainer.append(content);
        }
    };

    return accord;
};

interface _ModalOptionsInterface {
    id?: string;
    heading: string;
    content: NodeSet;
    confirm?: string;
    onClose?: (e?: Event) => boolean | void;
    onConfirm?: (e?: Event) => boolean | void;
}

/**
 * Creates a modal
 * @param {Object} options Possible values are heading, content,
 *  confirm, onClose and onConfirm
 * @exclude public
 * @exclude reg
*/
let modal = function(options: _ModalOptionsInterface): ModalReturnInterface {
    let heading = options.heading,
      content = options.content,
      fireClose = options.onClose && true,
      fireConfirm = options.onConfirm && true,
      onClose = options.onClose,
      onConfirm = options.onConfirm,
      body = $.body,
      confirmText = (options.confirm) ? options.confirm : 'Bestätigen',
      overlay: NodeSet;
    
    if(!$.exists('.ui-modal-overlay')) {
        overlay = $.create('<div class="ui-modal-overlay">');
        body.append(overlay);
    } else {
        overlay = $.of('.ui-modal-overlay');
    }
    
    let modal = $.create('<div class="ui-modal">'),
        headingDiv = $.create('<div class="ui-modal-heading">'),
        headingh3 = $.create('<h3>' + heading + '</h3>'),
        headingClose = $.create('<div class="ui-modal-close-button">\u00D7</div>');

    headingDiv.append(headingh3, headingClose);

    let contentDiv = $.create('<div class="ui-modal-content">');
    contentDiv.append(content);

    let footerDiv = $.create('<div class="ui-modal-footer">'),
        footerButton = $.create('<button class="ui-modal-confirm-button">'+confirmText+'</button>');

    footerDiv.append(footerButton);
    
    modal.append(headingDiv, contentDiv, footerDiv);
    
    if(options.id) {
        modal.attr('id', options.id);
    }
    
    if(fireConfirm) {
        footerButton.on('click', function() {
            let e = document.createEvent('Event');
            e.initEvent('modalconfirm',true,true);
            let fire = onConfirm(e);
            if(!e.defaultPrevented && fire !== false) {
                close();
            }
        });
    }
        
    let open = function() {
        overlay.display('block');
        modal.display('block');
        $.html.overflow('hidden');
        if($.html.hasClass('csstransitions')) {
            window.setTimeout(function() {
                modal.addClass('visible');
            }, 10);
        } else {
            modal.addClass('visible');
            let i = -100;
            modal.css('top',i);
            let end = $.html.height() * 0.05;
            let interval = window.setInterval(function() {
                modal.css('top',i+'px');
                i += 8;
                if(i >= end) {
                    window.clearInterval(interval);
                }
            }, 10);
        }
    };
    
    let close = function() {
        $.html.overflow('scroll');
        if($.html.hasClass('csstransitions')) {
            modal.removeClass('visible');
        } else {
            modal.removeClass('visible');
            let i = $.html.height() * 0.05;
            modal.css('top',i);
            let interval = window.setInterval(function() {
                modal.css('top',i+'px');
                i -= 8;
                if(i <= -modal.height()) {
                    window.clearInterval(interval);
                }
            }, 10);
        }
        overlay.display('none');
        window.setTimeout(function() {
            modal.display('none');
        }, 300);
    };
    
    
    overlay.click(function() {
        if(modal.hasClass('visible')) {
            let fire = true;
            if (fireClose) {
                let e = document.createEvent('Event');
                e.initEvent('modalclose',true,true);
                fire = onClose(e) && !e.defaultPrevented;
            } 

            if(fire !== false) {
                close();
            }
        }
    });
    
    headingClose.click(function() {
        let fire = true;
        if (fireClose) {
            let e = document.createEvent('Event');
            e.initEvent('modalclose', true, true);
            fire = onClose(e) && !e.defaultPrevented;
        }

        if (fire !== false) {
            close();
        }
    });
    
    return {
      modal: modal,
      open: open,
      close: close,
      setHeading: val => {
          headingh3.text(val);
      }
    }
};


/**
 * Creates a checkbox Node
 * @param id 
 * @param text 
 * @param onCheck 
 * @param onUncheck
 * @exclude public
 */
let checkbox = function (id: string, text: string, onCheck?: (e: Event) => boolean|void, onUncheck?: (e: Event) => boolean|void): CheckboxReturnType {
    let cbox = $.create('<div id="' + id + '" class="checkbox">'),
      imgLabel = $.create('<label class="checkboxLabel css-label">'),
      label = $.create('<label class="checkboxText">'+text+'</label>');

    cbox.append(imgLabel,label);

    $.merge(imgLabel, label).on('click', function() {
        if(imgLabel.hasClass('checked')) {
            let e = document.createEvent('Event');
            e.initEvent('checkbox-uncheck',true,true);
            let fire: any = true;
            if(typeof onUncheck !== 'undefined') {
                fire = onUncheck(e);
            }
            if(!e.defaultPrevented && fire !== false) {
                imgLabel.removeClass('checked');
            }
        } else {
            let e = document.createEvent('Event');
            e.initEvent('checkbox-check',true,true);
            let fire: any = true;
            if(typeof onCheck !== 'undefined') {
                fire = onCheck(e);
            }
            if(!e.defaultPrevented && fire !== false) {
                imgLabel.addClass('checked');
            }
        }
    });
    
    return {
      checkbox: cbox,
      isChecked: function() {
          return imgLabel.hasClass('checked');
      }
    }
};


/**
 * Linear count up
 * @param startVal 
 * @param endVal 
 * @param duration 
 * @param callback 
 * @param finished 
 * @exclude public
*/
let linear = function(startVal: number, endVal: number, duration: number, callback: (n: number) => void, finished?: () => any): void {
    let step = Math.abs(endVal - startVal) / duration * 20;
    let numIterations = Math.abs(endVal - startVal) / step;
    
    let i = 1,
        val = startVal,
        sum = 0;
    
    let interval = window.setInterval(function() {
        sum += step;

        callback(sum);
        
        i++;
        if(i > numIterations) {
            window.clearInterval(interval);
            if($.isDefined(finished)) {
                finished();
            }
        }
    }, 20);
};

let _easingFunction = function(x) {
    return Math.pow(Math.E,x);
};

let _cubicBezier = function(p1x, p1y, p2x, p2y) {
    return function(t) {
        return Math.pow(1 - t, 3) * p1x + 3 * Math.pow(1 - t, 2) * t * p1y +
            3 * (1 - t) * t * t * p2x + t * t * t * p2y;
    }
};

let _easeCB = _cubicBezier(0,0,.57,1);

/**
 * Count up with easing
 * @param startVal 
 * @param endVal 
 * @param duration 
 * @param callback 
 * @param type 
 * @param finished 
 * @exclude public
*/
let ease = function(startVal: number, endVal: number, duration: number, callback: (n: number) => void, type = 'easein', finished?: () => any): void {
    let step = Math.abs(endVal - startVal) / duration * 10,
      intEnd = step + 1,
      numIterations = Math.round(Math.abs(endVal - startVal) / step),
      i = (type === 'easein') ? 1 : numIterations,
      nextIteration = (type === 'easein') ? function(i, interval) {
            i++;
            if(i > numIterations) {
                window.clearInterval(interval);
                if($.isDefined(finished)) {
                    finished();
                }
            }
            return i;
        } : function(i, interval) {
            i--;
            if(i < 0) {
                window.clearInterval(interval);
                if($.isDefined(finished)) {
                    finished();
                }
            }
            return i;
        };
    
    let sum = 0,
      val = startVal;

    let interval = window.setInterval(function() {
        sum += (1/numIterations);
        callback(_easeCB(sum) * endVal);
        i = nextIteration(i, interval);
    }, 10);
};

    
/**
 * Smoothly scrolls to the given y offset of the element
 * @param scrollTop
 * @param duration
*/
let smoothScroll = function(startVal: number, endVal: number, duration: number): void {
    let op = (startVal < endVal) ? function(x,y) {
        return x + y;
    } : function(x, y) {
        return x - y;
    };
    
    $.ui.linear(startVal, endVal, duration, function(sum) {
        document.body.scrollTop = op(startVal, sum);
        document.documentElement.scrollTop = op(startVal, sum);
    });
};

class LambdaUIStatic {
    static accordion = accordion;
    static modal = modal;
    static checkbox = checkbox;
    static linear = linear;
    static ease = ease;
    static smoothScroll = smoothScroll;
}

$.ui = LambdaUIStatic;