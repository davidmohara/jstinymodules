/*!
 * TinyModules
 * http://github.com/davidmohara/jstinymodules
 *
 * Copyright 2010, Improving Enterprises.
 *
 * Date: Wed Jan 22 13:27:00
 */

(function ($) {
	var improving = new base2.Package(this, {
		name: "improving",
		version: "1.0",
		exports: "Application,Module"
	});

    eval(this.imports);

    //=========================================================================
    // Applicaton object model
    //=========================================================================

    var ApplicationEvents = base2.Base.extend({
        subscribe: function (type, fn, context, data) {
            fn = delegate(fn, context);
            $(this).bind(type, data, fn);
            return delegate(function () {
                $(this).unbind(type, fn);
            }, this);
        },

        raise: function (type, data) {
            $(this).triggerHandler(type, data);
        }
    }, {
        Starting: 'starting',
        Started: 'started',
        Stopping: 'stopping',
        Stopped: 'stopped'
    });

    var Application = base2.Base.extend({
        constructor: null
    }, {
        getUrl: function () {
            return this.urlHelper;
        },

        getService: function (key) {
            if (typeof key != "string")
                key = assignID(key);
            return this.services.get(key);
        },

        addService: function (key, service) {
            service = service || key;
            if (typeof key != "string")
                key = assignID(key.constructor);
            this.services.put(key, service);
        },

        removeService: function (key) {
            if (typeof key != "string")
                key = assignID(key.constructor);
            this.services.remove(key);
        },

        start: function (environment) {
            if (!this.__started) {
                $.extend(this, {
                    imagePath: '/Conent/img',
                    localizeUrl: '/Localization/Validators'
                }, environment || {});

                this.urlHelper = new UrlHelper(this);
                this.localHelper = new LocalizationHelper(this);

                $().ajaxStop(delegate(function () {
                    this.__inAjax = false;
                    var events = this.loadEvents.shift();
                    if (events) events.forEach(function (instance) {
                        instance();
                    }, this);
                }, this));
                $().ajaxStart(delegate(function () {
                    this.loadEvents.push(new Array2());
                    this.__inAjax = true;
                }, this));
                this.events.raise(ApplicationEvents.Starting);
                this.moduleInstances = this.modules.map(this.instantiateModule, this);
                this.__started = true;
                this.events.raise(ApplicationEvents.Started);
            }
            return this;
        },

        stop: function () {
            if (this.__started) {
                this.events.raise(ApplicationEvents.Stopping);
                this.moduleInstances.forEach(function (instance) {
                    try {
                        instance.unload();
                    } catch (err) {
                    }
                }, this);
                this.__started = false;
                this.events.raise(ApplicationEvents.Stopped);
            }
            delete this.moduleInstances;
            return this;
        },

        registerModule: function (module) {
            var key = assignID(module);
            if (!this.modules.has(key)) {
                this.modules.put(key, module);
                if (this.__started) {
                    if (this.__inAjax) {
                        this.loadEvents[this.loadEvents.length - 1].push(delegate(function () {
                            this.moduleInstances.push(this.instantiateModule(module));
                        }, this));
                    }
                    else {
                        this.moduleInstances.push(this.instantiateModule(module));
                    }
                }
            }
        },

        instantiateModule: function (module) {
            var instance = new module(this).compose(this,
  	    		'getUrl', 'getService', 'addService', 'removeService');
            instance.load();
            return instance;
        },

        starting: function (fn, context, data) {
            if (!this.__started)
                return this.events.subscribe(ApplicationEvents.Starting, fn, context, data);
            return I;
        },

        started: function (fn, context, data) {
            if (!this.__started)
                return this.events.subscribe(ApplicationEvents.Started, fn, context, data);
            fn.call(context, data);
            return I;
        },

        stopping: function (fn, context, data) {
            if (this.__started)
                return this.events.subscribe(ApplicationEvents.Stopping, fn, context, data);
            return I;
        },

        stopped: function (fn, context, data) {
            if (this.__started)
                return this.events.subscribe(ApplicationEvents.Stopped, fn, context, data);
            fn.call(context, data);
            return I;
        },

        modules: new Map(),
        services: new Map(),
        moduleInstances: new Array2(),
        events: new ApplicationEvents(),
        loadEvents: new Array2()
    });

    //=========================================================================
    // Helper class for creating urls
    //=========================================================================

    var UrlHelper = base2.Base.extend({
        constructor: function (application) {
            this.application = application;
        },

        forImage: function (path) {
            return this.application.imagePath + path;
        }
    });

    //=========================================================================
    // Helper class for supporting localization
    //=========================================================================

    var LocalizationHelper = base2.Base.extend({
        constructor: function (application) {
            this.application = application;

            if ($.validator) {
                var keys = Enumerable.map($.validator.messages, function (message, method) {
                    return method;
                });
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    traditional: true,
                    url: this.application.localizeUrl,
                    data: { keys: keys },
                    success: delegate(function (options, messages, status) {
                        Enumerable.forEach(messages, function (message, method) {
                            if (message) $.validator.messages[method] = function (params) {
                                if ((message.match(/\$?\{(\d+)\}/g) || []).length > 1)
                                    params = eval(params);
                                return $.validator.format(message, params);
                            }
                        });
                    })
                })
            }
        }
    });

    //=========================================================================
    // Module class for adding behavior
    //=========================================================================

    var Module = base2.Base.extend({
        constructor: function (application) {
            this.application = application;
        },

        getApplication: function () {
            return this.application;
        },

        load: function () {
            throw new TypeError("load method not implemented");
        },

        unload: function () { }
    }, {
        init: function () {
            var base = this.extend;
            this.extend = function () {
                var module = base.apply(this, arguments);
                Application.registerModule(module);
                return module;
            };
        }
    });

    //=========================================================================
    // Class definition extensions
    //=========================================================================

    function use(context, method) {
        return bind(context[method], context);
    }

    Base.prototype.compose = function (context) {
        Array2.forEach(Array2.slice(arguments, 1), function (method) {
            this[method] = use(context, method);
        }, this);
        return this;
    };

    eval(this.exports);
})(jQuery);

eval(base2.improving.namespace);

