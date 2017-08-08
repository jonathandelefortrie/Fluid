// Invalid caracters
// return /[\\/:"*?<>|]+/.test(str);

// HTML Entities
// return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

(function() {

    'use strict';

    var Attributes = 'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,checked,cite,class,code,codebase,color,cols,colspan,content,contenteditable,contextmenu,controls,coords,data,data-*,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,size,sizes,span,spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,target,title,type,usemap,value,width,wrap'.split(',');
    var Events = 'onafterprint,onbeforeprint,onbeforeunload,onhashchange,onload,onmessage,onoffline,ononline,onpagehide,onpageshow,onpopstate,onresize,onstorage,onunload,onblur,onchange,oncontextmenu,onfocus,oninput,oninvalid,onreset,onsearch,onselect,onsubmit,onkeydown,onkeypress,onkeyup,onclick,ondblclick,ondrag,ondragend,ondragenter,ondragleave,ondragover,ondragstart,ondrop,onmousedown,onmousemove,onmouseout,onmouseover,onmouseup,onscroll,onwheel,oncopy,oncut,onpaste,onabort,oncanplay,oncanplaythrough,oncuechange,ondurationchange,onemptied,onended,onerror,onloadeddata,onloadedmetadata,onloadstart,onpause,onplay,onplaying,onprogress,onratechange,onseeked,onseeking,onstalled,onsuspend,ontimeupdate,onvolumechange,onwaiting,onshow,ontoggle'.split(',');

    /*
     * @method logger
     * @private
     * @param {String} type
     * @param {String} info
     * @param {String} msg
     * Error manager.
     */
    var logger = function(type, info, msg) {
        console[type]('FluidJS: ', info, msg);
    };

    /*
     * @method stamp
     * @private
     * @param {String} str
     * Stamp the element in order to memories the element as component.
     */
    var stamp = function(str) {
        return str.replace(/<(.|\n)*?>/g, function(a) {
            return a.replace(/^<([-A-Za-z0-9_]+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/g, function(a, b, c) {
                var props = [];
                c.replace(/([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g, function(d, e) {
                    if(Attributes.indexOf(e) === -1 && Events.indexOf(e) === -1) {
                        a = a.replace(d, '');
                        props.push(d);
                    }
                });
                var start = b.length+1;
                return a.substr(0, start) + ' stamp="' + b + '"' + ' props="' + props.join(',') + '"' + a.substr(start, a.length);
            });
        });
    };

    /*
     * @method print
     * @private
     * @param {String} str
     * Quickest way to transform a given string to html.
     */
    var print = function(str) {
        var body = document.createElement('body');
        body.innerHTML = str;

        return body.childNodes;
    };

    /*
     * @method attributes
     * @public
     * @param {Object} component
     * @param {HTMLElement} node
     * @param {HTMLElement} name
     * @param {HTMLElement} value
     * Attach attributes.
     */
    var attributes = function(component, node, name, value) {
        if(Attributes.indexOf(name) !== -1) {
            node[name] = value;
        } else if(Events.indexOf(name) !== -1) {
            (function() {
                try {
                    /*jshint -W061 */
                    node[name] = eval('('+value+')');
                } catch(e) {
                    logger('error', 'The event ' + name + ' can\'t be converted.', e);
                }
            }).bind(component)();
        }
    };

    /*
     * @method properties
     * @private
     * @param {Object} component
     * @param {Object} clone
     * @param {HTMLElement} name
     * @param {HTMLElement} value
     * Attach properties.
     */
    var properties = function(component, clone, name, value) {
        if(Attributes.indexOf(name) === -1 && Events.indexOf(name) === -1) {
            (function() {
                try {
                    /*jshint -W061 */
                    component.props[name] = eval('('+value+')');
                } catch(e) {
                    logger('error', 'The property ' + name + ' can\'t be converted.', e);
                }
            }).bind(clone)();
        }
    };

    /*
     * @class Fluid
     * @static
     */
    var Fluid = {

        /*
         * @method create
         * @public
         * @param {Object} obj
         * Assign defaut object to given object, inherit default public method.
         */
        create: function(obj) {

            var _this = this;

            return Object.assign({
                props: {},
                state: {},
                init: function() {},
                willMount: function() {},
                didMount: function() {},
                setState: function(state) {
                    Object.assign(this.state, state);

                    var element = this.render();
                    element = stamp(element);
                    element = print(element);
                    element = _this.mount(this, element);

                    _this.diff(element.firstElementChild, this.node, this);
                }
            }, obj);
        },

        /*
         * @method mount
         * @public
         * @param {Object} component
         * @param {HTMLElement} elts
         * Combine html elements respecting the given structure.
         */
        mount: function(component, elts) {

            var _this = this;

            var nodes = [].slice.call(elts).reverse();
            var fragment = document.createDocumentFragment();

            var i = nodes.length; while (i--) {

                var node = nodes[i];
                var parent = node.parentNode;
                var children = node.childNodes;

                if(node && node.nodeType === 1) {

                    var clone = component;
                    var attrs = node.attributes;
                    var stamp = attrs.removeNamedItem('stamp');
                    var props = attrs.removeNamedItem('props');

                    if(node instanceof HTMLUnknownElement) {

                        stamp = stamp.nodeValue;
                        parent.removeChild(node);
                        props = props.nodeValue.split(',');
                        component = component.extend[stamp];

                        var u = props.length; while (u--) {

                            var prop = props[u].split('=');
                            var propName = prop[0];
                            var propValue = prop[1];

                            if(propName !== undefined && node[propName] === undefined) {
                                properties(component, clone, propName, propValue);
                            }
                        }

                        node = _this.render(component, parent);
                    }

                    var o = attrs.length; while (o--) {

                        var attr = attrs[o];
                        var attrType = attr.nodeType;
                        var attrName = attr.nodeName;
                        var attrValue = attr.nodeValue;

                        attrName = (attrName === 'class' || attrName === 'classname') ? 'className' : attrName;
                        attrName = (attrName === 'for' || attrName === 'htmlfor') ? 'htmlFor' : attrName;

                        if(attrType === 2 && attrName !== undefined && node[attrName] !== undefined) {
                            attributes(component, node, attrName, attrValue);
                        }
                    }

                    node.appendChild(_this.mount(clone, children));
                }

                fragment.appendChild(node);
            }

            return fragment;
        },

        /*
         * @method diff
         * @public
         * @param {HTMLElement} node1
         * @param {HTMLElement} node2
         * @param {Object} component
         * Associate the diff between node1 and node2 to node2.
         */
        diff: function(node1, node2, component) {

            var _this = this;

            if(node1.nodeType === 1 && node2.nodeType === 1) {

                var children1 = node1.childNodes;
                var children2 = node2.childNodes;

                if(children1.length > children2.length) {
                    var u = -1, lu = children1.length, child1u, child2u; while (++u<lu) {
                        child1u = children1[u];
                        child2u = children2[u];
                        if(child2u) {
                            if(child1u.nodeName !== child2u.nodeName) {
                                node2.insertBefore(child1u.cloneNode(true), child2u);
                            }
                        } else {
                            node2.appendChild(child1u.cloneNode(true));
                        }
                    }
                }

                if(children1.length < children2.length) {
                    var o = -1, lo = children2.length, child1o, child2o; while (++o<lo) {
                        child1o = children1[o];
                        child2o = children2[o];
                        if(child1o) {
                            if(child1o.nodeName !== child2o.nodeName) {
                                node2.removeChild(child2o);
                                o--;
                            }
                        }
                    }
                }

                if(children1.length === children2.length) {
                    var e = children1.length; while (e--) {
                        _this.diff(children1[e], children2[e], component);
                    }
                }

                var attrs1 = [].slice.call(node1.attributes);
                var attrs2 = [].slice.call(node2.attributes);

                var a = attrs1.length; while (a--) {

                    var attr = attrs1[a];
                    var attrName = attr.nodeName;
                    var attrValue = attr.nodeValue;

                    attrName = (attrName === 'class') ? 'className' : attrName;
                    attrName = (attrName === 'for') ? 'htmlFor' : attrName;

                    if(attrValue !== attrs2[a].nodeValue) {
                        attributes(component, node2, attrName, attrValue);
                    }
                }

            } else if(node1.nodeType === 3 && node2.nodeType === 3) {

                if(node1.textContent !== node2.textContent) {
                    node2.textContent = node1.textContent;
                }
            }
        },

        /*
         * @method mount
         * @public
         * @param {Object} component
         * @param {HTMLElement} parent
         * Render function used as hook to keep track on the stack execution.
         */
        render: function(component, parent) {

            var _this = this;

            component.init();

            var element = component.render();
            element = stamp(element);
            element = print(element);

            component.willMount();
            element = _this.mount(component, element);
            component.didMount();

            component.node = element.firstElementChild;
            parent.appendChild(element);

            return component.node;
        }
    };

    window.Fluid = Fluid;

})();
