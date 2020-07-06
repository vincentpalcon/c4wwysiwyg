/*********************************************** 
/* Change4win WYSIWYG
/* Author: Vincent Palcon - 2/12/2018
/* Files: c4wwysiwyg.js, c4wwysiwyg.css
/* Dependencies: jQuery 1.11.0 or higher and FontAwesome 4.6.3
/* Version: 1.1
/* Documentation: https://prod.c4w.lu/analysis/index?id=1098
/***********************************************/
(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return factory(window, document);
        });
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(window, document);
    } else {
        window.c4wwysiwyg = factory(window, document);
    }
})(function(window, document) {
    'use strict';
    // http://stackoverflow.com/questions/97962/debounce-clicks-when-submitting-a-web-form
    var debounce = function(callback, wait, cancelprevious) {
        var timeout;
        return function() {
            if (timeout) {
                if (!cancelprevious)
                    return;
                clearTimeout(timeout);
            }
            var context = this,
                args = arguments;
            timeout = setTimeout(
                function() {
                    timeout = null;
                    callback.apply(context, args);
                }, wait);
        };
    };
    // http://stackoverflow.com/questions/12949590/how-to-detach-event-in-ie-6-7-8-9-using-javascript
    var addEvent = function(element, type, handler, useCapture) {
        if (element.addEventListener) {
            element.addEventListener(type, handler, useCapture ? true : false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + type, handler);
        } else if (element != window)
            element['on' + type] = handler;
    };
    var removeEvent = function(element, type, handler, useCapture) {
        if (element.removeEventListener) {
            element.removeEventListener(type, handler, useCapture ? true : false);
        } else if (element.detachEvent) {
            element.detachEvent('on' + type, handler);
        } else if (element != window)
            element['on' + type] = null;
    };
    // http://www.cristinawithout.com/content/function-trigger-events-javascript
    var fireEvent = function(element, type, bubbles, cancelable) {
        if (document.createEvent) {
            var event = document.createEvent('Event');
            event.initEvent(type, bubbles !== undefined ? bubbles : true, cancelable !== undefined ? cancelable : false);
            element.dispatchEvent(event);
        } else if (document.createEventObject) { //IE
            var event = document.createEventObject();
            element.fireEvent('on' + type, event);
        } else if (typeof(element['on' + type]) == 'function')
            element['on' + type]();
    };
    // prevent default
    var cancelEvent = function(e) {
        if (e.preventDefault)
            e.preventDefault();
        else
            e.returnValue = false;
        if (e.stopPropagation)
            e.stopPropagation();
        else
            e.cancelBubble = true;
        return false;
    };
    // http://stackoverflow.com/questions/13377887/javascript-node-undefined-in-ie8-and-under
    var Node_ELEMENT_NODE = typeof(Node) != 'undefined' ? Node.ELEMENT_NODE : 1;
    var Node_TEXT_NODE = typeof(Node) != 'undefined' ? Node.TEXT_NODE : 3;

    // http://stackoverflow.com/questions/2234979/how-to-check-in-javascript-if-one-element-is-a-child-of-another
    var isOrContainsNode = function(ancestor, descendant) {
        var node = descendant;
        while (node) {
            if (node === ancestor)
                return true;
            node = node.parentNode;
        }
        return false;
    };
    // http://stackoverflow.com/questions/667951/how-to-get-nodes-lying-inside-a-range-with-javascript
    var nextNode = function(node, container) {
        if (node.firstChild)
            return node.firstChild;
        while (node) {
            if (node == container) // do not walk out of the container
                return null;
            if (node.nextSibling)
                return node.nextSibling;
            node = node.parentNode;
        }
        return null;
    };

    // save/restore selection
    // http://stackoverflow.com/questions/13949059/persisting-the-changes-of-range-objects-after-selection-in-html/13950376#13950376
    var saveSelection = function(containerNode) {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (sel.rangeCount > 0)
                return sel.getRangeAt(0);
        } else if (document.selection) {
            var sel = document.selection;
            return sel.createRange();
        }
        return null;
    };
    var restoreSelection = function(containerNode, savedSel) {
        if (!savedSel)
            return;
        if (window.getSelection) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSel);
        } else if (document.selection) {
            savedSel.select();
        }
    };

    // http://stackoverflow.com/questions/12603397/calculate-width-height-of-the-selected-text-javascript
    // http://stackoverflow.com/questions/6846230/coordinates-of-selected-text-in-browser-page
    var getSelectionRect = function() {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (!sel.rangeCount)
                return false;
            var range = sel.getRangeAt(0).cloneRange();
            if (range.getBoundingClientRect) // Missing for Firefox 3.5+3.6
            {

                var rect = range.getBoundingClientRect();
                // Safari 5.1 returns null, IE9 returns 0/0/0/0 if image selected
                if (rect && rect.left && rect.top && rect.right && rect.bottom)
                    return {
                        // Modern browsers return floating-point numbers
                        left: parseInt(rect.left),
                        top: parseInt(rect.top),
                        width: parseInt(rect.right - rect.left),
                        height: parseInt(rect.bottom - rect.top)
                    };
                // on Webkit 'range.getBoundingClientRect()' sometimes return 0/0/0/0 - but 'range.getClientRects()' works
                var rects = range.getClientRects ? range.getClientRects() : [];
                for (var i = 0; i < rects.length; ++i) {
                    var rect = rects[i];
                    if (rect.left && rect.top && rect.right && rect.bottom)
                        return {
                            // Modern browsers return floating-point numbers
                            left: parseInt(rect.left),
                            top: parseInt(rect.top),
                            width: parseInt(rect.right - rect.left),
                            height: parseInt(rect.bottom - rect.top)
                        };
                }
            }
            /*
            // Fall back to inserting a temporary element (only for Firefox 3.5 and 3.6)
            var span = document.createElement('span');
            if( span.getBoundingClientRect )
            {
                // Ensure span has dimensions and position by
                // adding a zero-width space character
                span.appendChild( document.createTextNode('\u200b') );
                range.insertNode( span );
                var rect = span.getBoundingClientRect();
                var spanParent = span.parentNode;
                spanParent.removeChild( span );
                // Glue any broken text nodes back together
                spanParent.normalize();
                return {
                    left: parseInt(rect.left),
                    top: parseInt(rect.top),
                    width: parseInt(rect.right - rect.left),
                    height: parseInt(rect.bottom - rect.top)
                };
            }
            */
        } else if (document.selection) {
            var sel = document.selection;
            if (sel.type != 'Control') {
                var range = sel.createRange();
                // IE8 return 0/0/0/0 if caret right before newline
                if (range.boundingLeft || range.boundingTop || range.boundingWidth || range.boundingHeight)
                    return {
                        left: range.boundingLeft,
                        top: range.boundingTop,
                        width: range.boundingWidth,
                        height: range.boundingHeight
                    };
            }
        }
        return false;
    };

    var getSelectionCollapsed = function(containerNode) {
        if (window.getSelection) {

            var sel = window.getSelection();
            if (sel.isCollapsed)
                return true;
            return false;
        } else if (document.selection) {
            var sel = document.selection;

            if (sel.type == 'Text') {
                var range = document.selection.createRange();
                var textrange = document.body.createTextRange();
                textrange.moveToElementText(containerNode);
                textrange.setEndPoint('EndToStart', range);
                return range.htmlText.length == 0;
            }
            if (sel.type == 'Control') // e.g. an image selected
                return false;
            // sel.type == 'None' -> collapsed selection
        }
        return true;
    };

var getSelectedImg = function(containerNode) {

    // disable firefox resizing

    var imgs = document.getElementsByTagName("IMG");
    for (var i = 0; i < imgs.length; ++i) {
        imgs[i].contentEditable = false;
    }
    // disable IE resizing
    function controlselectHandler(evt) {
        evt.preventDefault();
    }

    document.body.addEventListener('mscontrolselect', controlselectHandler);
    // use custom image resizing
   /* var classname = containerNode.getElementsByClassName("c4wwysiwyg-img");
    var getimageresize = function(event) {
   
        unsetimgtselection();
        if(!this.classList.contains("c4wwysiwyg-selected-img")){
        resizeableImage(this);
        this.classList.add("c4wwysiwyg-selected-img");
        }
    }*/

    function unsetimgtselection(){
      $('img').removeClass('c4wwysiwyg-selected-img'); 
      $('.resize-container .resize-handle').remove();
      $('.resize-container img').unwrap(); 
      var mtoolbars = document.getElementsByClassName('c4wwysiwyg-toolbar-icon'), i;
                for (var i = 0; i < mtoolbars.length; i ++) {
                    mtoolbars[i].classList.remove("c4wwysiwyg-disabled");
      }
      /*
        var el = document.querySelector('div');
    // get the element's parent node
    var parent = el.parentNode;
    // move all children out of the element
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    // remove the empty element
    parent.removeChild(el);
      */  
    };
containerNode.onclick = function(event){
    event.preventDefault();
     var node = event.target;
    var newsel = window.getSelection();

        if(node.classList.contains("c4wwysiwyg-img")){
            if(!node.classList.contains("c4wwysiwyg-selected-img")){
                unsetimgtselection();
                // var vrange = document.createRange();
                // vrange.selectNodeContents(node);
                 window.getSelection().removeAllRanges();
                //window.getSelection().addRange(vrange);
                //window.getSelection().removeAllRanges();
                resizeableImage(node);
                node.classList.add("c4wwysiwyg-selected-img");
              //  var x = document.getElementsByClassName("c4wwysiwyg-toolbar-icon");
              //  console.log('asdasd');
              //  x[].classList.add("c4wwysiwyg-disabled");
                var mtoolbars = document.querySelectorAll('.c4wwysiwyg-toolbar .c4wwysiwyg-toolbar-icon'), i;
                for (var i = 0; i < mtoolbars.length; i ++) {
                    mtoolbars[i].classList.add("c4wwysiwyg-disabled");
                }
            }
                this.onkeydown = function(event) {
                    if(node.classList.contains("c4wwysiwyg-selected-img")){
                        var key = event.keyCode || event.charCode;
                        if( key == 8 || key == 46 ) {
                            unsetimgtselection();
                          node.remove();
                        return false;
                        }
                    }
                }
         
        }
         if(!node.classList.contains("c4wwysiwyg-img") && !node.classList.contains("resize-handle") && !node.classList.contains("resize-container")){
        unsetimgtselection();
        }
}

    /*containerNode.onclick = function(event){
    var hasParent = false;
        for(var node = event.target; node != document.body; node = node.parentNode)
        {
          if(node.classList.contains("c4wwysiwyg-img") || node.classList.contains("resize-container")){
               hasParent = true;
                break; 
          }
        }
        console.log(hasParent);
        if(hasParent) {
        event=window.event? event.srcElement: event.target;
       if(event.className && event.className.indexOf('c4wwysiwyg-img')!=-1){
         event.addEventListener("click", getimageresize);
       }
      } else {
    unsetimgtselection();
    }
       
    }*/

}
    // http://stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
    var getSelectedNodes = function(containerNode) {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (!sel.rangeCount)
                return [];
            var nodes = [];
            for (var i = 0; i < sel.rangeCount; ++i) {
                var range = sel.getRangeAt(i),
                    node = range.startContainer,
                    endNode = range.endContainer;
                while (node) {
                    // add this node?
                    if (node != containerNode) {

                        var node_inside_selection = false;
                        if (sel.containsNode)
                            node_inside_selection = sel.containsNode(node, true);
                        else // IE11
                        {
                            // http://stackoverflow.com/questions/5884210/how-to-find-if-a-htmlelement-is-enclosed-in-selected-text
                            var noderange = document.createRange();
                            noderange.selectNodeContents(node);

                            for (var i = 0; i < sel.rangeCount; ++i) {
                                var range = sel.getRangeAt(i);
                                // start after or end before -> skip node
                                if (range.compareBoundaryPoints(range.END_TO_START, noderange) >= 0 &&
                                    range.compareBoundaryPoints(range.START_TO_END, noderange) <= 0) {
                                    node_inside_selection = true;
                                    break;
                                }
                            }
                        }
                        if (node_inside_selection)
                            nodes.push(node);
                    }
                    node = nextNode(node, node == endNode ? endNode : containerNode);
                }
            }
            // Fallback
            if (nodes.length == 0 && isOrContainsNode(containerNode, sel.focusNode) && sel.focusNode != containerNode)
                nodes.push(sel.focusNode);
            return nodes;
        } else if (document.selection) {
            var sel = document.selection;
            if (sel.type == 'Text') {
                var nodes = [];
                var ranges = sel.createRangeCollection();
                for (var i = 0; i < ranges.length; ++i) {
                    var range = ranges[i],
                        parentNode = range.parentElement(),
                        node = parentNode;
                    while (node) {
                        // No clue how to detect whether a TextNode is within the selection...
                        // ElementNode is easy: http://stackoverflow.com/questions/5884210/how-to-find-if-a-htmlelement-is-enclosed-in-selected-text
                        var noderange = range.duplicate();
                        noderange.moveToElementText(node.nodeType != Node_ELEMENT_NODE ? node.parentNode : node);
                        // start after or end before -> skip node
                        if (noderange.compareEndPoints('EndToStart', range) >= 0 &&
                            noderange.compareEndPoints('StartToEnd', range) <= 0) {
                            // no "Array.indexOf()" in IE8
                            var in_array = false;
                            for (var j = 0; j < nodes.length; ++j) {
                                if (nodes[j] !== node)
                                    continue;
                                in_array = true;
                                break;
                            }
                            if (!in_array)
                                nodes.push(node);
                        }
                        node = nextNode(node, parentNode);
                    }
                }
                // Fallback
                if (nodes.length == 0 && isOrContainsNode(containerNode, document.activeElement) && document.activeElement != containerNode)
                    nodes.push(document.activeElement);
                return nodes;
            }
            if (sel.type == 'Control') // e.g. an image selected
            {
                var nodes = [];
                // http://msdn.microsoft.com/en-us/library/ie/hh826021%28v=vs.85%29.aspx
                var range = sel.createRange();
                for (var i = 0; i < range.length; ++i)
                    nodes.push(range(i));
                return nodes;
            }
        }
        return [];
    };

    // http://stackoverflow.com/questions/8513368/collapse-selection-to-start-of-selection-not-div
    var collapseSelectionEnd = function() {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (!sel.isCollapsed) {
                // Form-submits via Enter throw 'NS_ERROR_FAILURE' on Firefox 34
                try {
                    sel.collapseToEnd();
                } catch (e) {}
            }
        } else if (document.selection) {
            var sel = document.selection;
            if (sel.type != 'Control') {
                var range = sel.createRange();
                range.collapse(false);
                range.select();
            }
        }
    };

    // http://stackoverflow.com/questions/15157435/get-last-character-before-caret-position-in-javascript
    // http://stackoverflow.com/questions/11247737/how-can-i-get-the-word-that-the-caret-is-upon-inside-a-contenteditable-div
    var expandSelectionCaret = function(containerNode, preceding, following) {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (sel.modify) {
                for (var i = 0; i < preceding; ++i)
                    sel.modify('extend', 'backward', 'character');
                for (var i = 0; i < following; ++i)
                    sel.modify('extend', 'forward', 'character');
            } else {
                // not so easy if the steps would cover multiple nodes ...
                var range = sel.getRangeAt(0);
                range.setStart(range.startContainer, range.startOffset - preceding);
                range.setEnd(range.endContainer, range.endOffset + following);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else if (document.selection) {
            var sel = document.selection;
            if (sel.type != 'Control') {
                var range = sel.createRange();
                range.collapse(true);
                range.moveStart('character', -preceding);
                range.moveEnd('character', following);
                range.select();
            }
        }
    };

    // http://stackoverflow.com/questions/4652734/return-html-from-a-user-selected-text/4652824#4652824
    var getSelectionHtml = function(containerNode) {
        if (getSelectionCollapsed(containerNode))
            return null;
        if (window.getSelection) {
            var sel = window.getSelection();
            if (sel.rangeCount) {
                var container = document.createElement('div'),
                    len = sel.rangeCount;
                for (var i = 0; i < len; ++i) {
                    var contents = sel.getRangeAt(i).cloneContents();
                    container.appendChild(contents);
                }

                return container.innerHTML;
            }
        } else if (document.selection) {
            var sel = document.selection;
            if (sel.type == 'Text') {
                var range = sel.createRange();
                return range.htmlText;
            }
        }
        return null;
    };

    var getSelectionText = function(containerNode) {
        if (getSelectionCollapsed(containerNode))
            return null;
        if (window.getSelection) {
            var sel = window.getSelection();
            if (sel.rangeCount) {
                var container = document.createElement('div'),
                    len = sel.rangeCount;
                for (var i = 0; i < len; ++i) {
                    var contents = sel.getRangeAt(i).cloneContents();
                    
                    container.appendChild(contents);
                }
                var stripedHtml = container.innerHTML.replace(/<[^>]+>/g, '');
                return stripedHtml;
            }
        } else if (document.selection) {
            var sel = document.selection;
            if (sel.type == 'Text') {
                var range = sel.createRange();
                return range.htmlText;
            }
            console.log(sel);
        }
        return null;
    };

    var selectionInside = function(containerNode, force) {
        // selection inside editor?
        if (window.getSelection) {
            var sel = window.getSelection();
            if (isOrContainsNode(containerNode, sel.anchorNode) && isOrContainsNode(containerNode, sel.focusNode))
                return true;
            // selection at least partly outside editor
            if (!force)
                return false;
            // force selection to editor
            var range = document.createRange();
            range.selectNodeContents(containerNode);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (document.selection) {
            var sel = document.selection;
            if (sel.type == 'Control') // e.g. an image selected
            {
                // http://msdn.microsoft.com/en-us/library/ie/hh826021%28v=vs.85%29.aspx
                var range = sel.createRange();
                if (range.length != 0 && isOrContainsNode(containerNode, range(0))) // test only the first element
                    return true;
            } else //if( sel.type == 'Text' || sel.type == 'None' )
            {
                // Range of container
                // http://stackoverflow.com/questions/12243898/how-to-select-all-text-in-contenteditable-div
                var rangeContainer = document.body.createTextRange();
                rangeContainer.moveToElementText(containerNode);
                // Compare with selection range
                var range = sel.createRange();
                if (rangeContainer.inRange(range))
                    return true;
            }
            // selection at least partly outside editor
            if (!force)
                return false;
            // force selection to editor
            // http://stackoverflow.com/questions/12243898/how-to-select-all-text-in-contenteditable-div
            var range = document.body.createTextRange();
            range.moveToElementText(containerNode);
            range.setEndPoint('StartToEnd', range); // collapse
            range.select();
        }
        return true;
    };

    /*
    var clipSelectionTo = function( containerNode )
    {
        if( window.getSelection && containerNode.compareDocumentPosition )
        {
            var sel = window.getSelection();
            var left_node = sel.anchorNode,
                left_offset = sel.anchorOffset,
                right_node = sel.focusNode,
                right_offset = sel.focusOffset;
            // http://stackoverflow.com/questions/10710733/dom-determine-if-the-anchornode-or-focusnode-is-on-the-left-side
            if( (left_node == right_node && left_offset > right_offset) ||
                (left_node.compareDocumentPosition(right_node) & Node.DOCUMENT_POSITION_PRECEDING) )
            {
                // Right-to-left selection
                left_node = sel.focusNode;
                left_offset = sel.focusOffset;
                right_node = sel.anchorNode,
                right_offset = sel.anchorOffset;
            }
            // Speed up: selection inside editor
            var left_inside = isOrContainsNode(containerNode,left_node),
                right_inside = isOrContainsNode(containerNode,right_node);
            if( left_inside && right_inside )
                return true;
            // Selection before/after container?
            if( ! left_inside && containerNode.compareDocumentPosition(left_node) & Node.DOCUMENT_POSITION_FOLLOWING )
                return false; // selection after
            if( ! right_inside && containerNode.compareDocumentPosition(right_node) & Node.DOCUMENT_POSITION_PRECEDING )
                return false; // selection before
            // Selection partly before/after container
            // http://stackoverflow.com/questions/12243898/how-to-select-all-text-in-contenteditable-div
            var range = document.createRange();
            range.selectNodeContents( containerNode );
            if( left_inside )
                range.setStart( left_node, left_offset );
            if( right_inside )
                range.setEnd( right_node, right_offset );
            sel.removeAllRanges();
            sel.addRange(range);
            return true;
        }
        else if( document.selection )
        {
            var sel = document.selection;
            if( sel.type == 'Text' )
            {
                // Range of container
                // http://stackoverflow.com/questions/12243898/how-to-select-all-text-in-contenteditable-div
                var rangeContainer = document.body.createTextRange();
                rangeContainer.moveToElementText(containerNode);
                // Compare with selection range
                var range = sel.createRange();
                if( rangeContainer.inRange(range) )
                    return true;
                // Selection before/after container?
                if( rangeContainer.compareEndPoints('StartToEnd',range) > 0 )
                    return false;
                if( rangeContainer.compareEndPoints('EndToStart',range) < 0 )
                    return false;
                // Selection partly before/after container
                if( rangeContainer.compareEndPoints('StartToStart',range) > 0 )
                    range.setEndPoint('StartToStart',rangeContainer);
                if( rangeContainer.compareEndPoints('EndToEnd',range) < 0 )
                    range.setEndPoint('EndToEnd',rangeContainer);
                // select range
                range.select();
                return true;
            }
        }
        return true;
    };
    */

    // http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div/6691294#6691294
    // http://stackoverflow.com/questions/4823691/insert-an-html-element-in-a-contenteditable-element
    // http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element
    var pasteHtmlAtCaret = function(containerNode, html) {
        if (window.getSelection) {
            // IE9 and non-IE
            var sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                var range = sel.getRangeAt(0);
                // Range.createContextualFragment() would be useful here but is
                // only relatively recently standardized and is not supported in
                // some browsers (IE9, for one)
                var el = document.createElement('div');
                el.innerHTML = html;
                html = el.innerHTML;
                var frag = document.createDocumentFragment(),
                    node, lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                if (isOrContainsNode(containerNode, range.commonAncestorContainer)) {
                    range.deleteContents();
                    range.insertNode(frag);
                } else {
                    containerNode.appendChild(frag);
                }
                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        } else if (document.selection) {
            // IE <= 8
            var sel = document.selection;
            if (sel.type != 'Control') {
                var originalRange = sel.createRange();
                originalRange.collapse(true);
                var range = sel.createRange();
                if (isOrContainsNode(containerNode, range.parentElement()))
                    range.pasteHTML(html);
                else // simply append to Editor
                {
                    var textRange = document.body.createTextRange();
                    textRange.moveToElementText(containerNode);
                    textRange.collapse(false);
                    textRange.select();
                    textRange.pasteHTML(html);
                }
                // Preserve the selection
                range = sel.createRange();
                range.setEndPoint('StartToEnd', originalRange);
                range.select();
            }
        }
    };

    // Create wysiwyg
    var c4wwysiwyg = function(option) {
        option = option || {};
        var option_element = option.element || null;
        if (typeof(option_element) == 'string')
            option_element = document.getElementById(option_element);
        var option_contenteditable = option.contenteditable || null;
        if (typeof(option_contenteditable) == 'string')
            option_contenteditable = document.getElementById(option_contenteditable);
        var option_onkeydown = option.onKeyDown || null;
        var option_onkeypress = option.onKeyPress || null;
        var option_onkeyup = option.onKeyUp || null;
        var option_onselection = option.onSelection || null;
        var option_onplaceholder = option.onPlaceholder || null;
        var option_onopenpopup = option.onOpenpopup || null;
        var option_onclosepopup = option.onClosepopup || null;
        var option_hijackcontextmenu = option.hijackContextmenu || false;
        var option_readonly = option.readOnly || false;

        // Keep textarea if browser can't handle content-editable
        var is_textarea = option_element.nodeName == 'TEXTAREA' || option_element.nodeName == 'INPUT';
        if (is_textarea) {
            // http://stackoverflow.com/questions/1882205/how-do-i-detect-support-for-contenteditable-via-javascript
            var canContentEditable = 'contentEditable' in document.body;
            if (canContentEditable) {
                // Sniffer useragent...
                var webkit = navigator.userAgent.match(/(?:iPad|iPhone|Android).* AppleWebKit\/([^ ]+)/);
                if (webkit && 420 <= parseInt(webkit[1]) && parseInt(webkit[1]) < 534) // iPhone 1 was Webkit/420
                    canContentEditable = false;
            }
            if (!canContentEditable) {
                // Keep textarea
                var node_textarea = option_element;
                // Add a 'newline' after each '<br>'
                var newlineAfterBR = function(html) {
                    return html.replace(/<br[ \/]*>\n?/gi, '<br>\n');
                };
                node_textarea.value = newlineAfterBR(node_textarea.value);
                // Command structure
                var dummy_this = function() {
                    return this;
                };
                var dummy_null = function() {
                    return null;
                };
                return {
                    legacy: true,
                    // properties
                    getElement: function() {
                        return node_textarea;
                    },
                    getHTML: function() {
                        return node_textarea.value;
                    },
                    setHTML: function(html) {
                        node_textarea.value = newlineAfterBR(html);
                        return this;
                    },
                    getSelectedHTML: dummy_null,
                    getSelectedText: dummy_null,
                    sync: dummy_this,
                    readOnly: function(readonly) {
                        // query read-only
                        if (readonly === undefined)
                            return node_textarea.hasAttribute ? node_textarea.hasAttribute('readonly') :
                                !!node_textarea.getAttribute('readonly'); // IE7
                        // set read-only
                        if (readonly)
                            node_textarea.setAttribute('readonly', 'readonly');
                        else
                            node_textarea.removeAttribute('readonly');
                        return this;
                    },
                    // selection and popup
                    collapseSelection: dummy_this,
                    expandSelection: dummy_this,
                    openPopup: dummy_null,
                    closePopup: dummy_this,
                    // exec commands
                    removeFormat: dummy_this,
                    bold: dummy_this,
                    italic: dummy_this,
                    underline: dummy_this,
                    strikethrough: dummy_this,
                    forecolor: dummy_this,
                    highlight: dummy_this,
                    fontName: dummy_this,
                    fontSize: dummy_this,
                    subscript: dummy_this,
                    superscript: dummy_this,
                    align: dummy_this,
                    format: dummy_this,
                    indent: dummy_this,
                    insertLink: dummy_this,
                    insertImage: dummy_this,
                    insertHTML: dummy_this,
                    insertList: dummy_this
                };
            }
        }

        // create content-editable
        var node_textarea = null,
            node_c4wwysiwyg = null;
        if (is_textarea) {
            // Textarea
            node_textarea = option_element;
            node_textarea.style.display = 'none';

            // Contenteditable
            if (option_contenteditable)
                node_c4wwysiwyg = option_contenteditable;
            else {
                node_c4wwysiwyg = document.createElement('DIV');
                node_c4wwysiwyg.innerHTML = node_textarea.value || '';
                var parent = node_textarea.parentNode,
                    next = node_textarea.nextSibling;
                if (next)
                    parent.insertBefore(node_c4wwysiwyg, next);
                else
                    parent.appendChild(node_c4wwysiwyg);
            }
        } else
            node_c4wwysiwyg = option_element;
        // If not read-only
        if (!option_readonly)
            node_c4wwysiwyg.setAttribute('contentEditable', 'true'); // IE7 is case sensitive

        // IE8 uses 'document' instead of 'window'
        // http://tanalin.com/en/articles/ie-version-js/ - http://stackoverflow.com/questions/10964966/detect-ie-version-prior-to-v9-in-javascript
        var window_ie8 = (document.all && (!document.documentMode || document.documentMode <= 8)) ? document : window;

        // Sync Editor with Textarea
        var syncTextarea = null,
            callUpdates;
        if (is_textarea) {
            var previous_html = node_c4wwysiwyg.innerHTML;
            syncTextarea = function() {
                var new_html = node_c4wwysiwyg.innerHTML;
                if (new_html == previous_html)
                    return;
                // HTML changed
                node_textarea.value = new_html;
                previous_html = new_html;
                // Event Handler
                fireEvent(node_textarea, 'change', false);
            };

            // handle reset event
            var form = node_textarea.form;
            if (form) {
                addEvent(form, 'reset', function() {
                    node_c4wwysiwyg.innerHTML = '';
                    syncTextarea();
                    callUpdates(true);
                });
            }
        }

        // Show placeholder
        var showPlaceholder;
        if (option_onplaceholder) {
            var placeholder_visible = false;
            showPlaceholder = function() {
                // Test if we have content
                var c4wwysiwyg_empty = true;
                var node = node_c4wwysiwyg;
                while (node) {
                    node = nextNode(node, node_c4wwysiwyg);
                    // Test if node contains something visible
                    if (!node)
                    ;
                    else if (node.nodeType == Node_ELEMENT_NODE) {
                        if (node.nodeName == 'IMG') {
                            c4wwysiwyg_empty = false;
                            break;
                        }
                    } else if (node.nodeType == Node_TEXT_NODE) {
                        var text = node.nodeValue;
                        if (text && text.search(/[^\s]/) != -1) {
                            c4wwysiwyg_empty = false;
                            break;
                        }
                    }
                }
                if (placeholder_visible != c4wwysiwyg_empty) {
                    option_onplaceholder(c4wwysiwyg_empty);
                    placeholder_visible = c4wwysiwyg_empty;
                }
            };
            showPlaceholder();
        }

        // Handle selection
        var popup_saved_selection = null, // preserve selection during popup
            handleSelection = null,
            debounced_handleSelection = null;
        if (option_onselection) {
            handleSelection = function(clientX, clientY, rightclick) {
                // Detect collapsed selection
                var collapsed = getSelectionCollapsed(node_c4wwysiwyg);
                // List of all selected nodes
                var nodes = getSelectedNodes(node_c4wwysiwyg);
                // Rectangle of the selection
                var rect = (clientX === null || clientY === null) ? null : {
                    left: clientX,
                    top: clientY,
                    width: 0,
                    height: 0
                };
                var selectionRect = getSelectionRect();
                if (selectionRect)
                    rect = selectionRect;
                if (rect) {
                    // So far 'rect' is relative to viewport
                    if (node_c4wwysiwyg.getBoundingClientRect) {
                        // Make it relative to the editor via 'getBoundingClientRect()'
                        var boundingrect = node_c4wwysiwyg.getBoundingClientRect();
                        rect.left -= parseInt(boundingrect.left);
                        rect.top -= parseInt(boundingrect.top);
                    } else {
                        var node = node_c4wwysiwyg,
                            offsetLeft = 0,
                            offsetTop = 0,
                            fixed = false;
                        do {
                            offsetLeft += node.offsetLeft ? parseInt(node.offsetLeft) : 0;
                            offsetTop += node.offsetTop ? parseInt(node.offsetTop) : 0;
                            if (node.style.position == 'fixed')
                                fixed = true;
                        }
                        while (node = node.offsetParent);
                        rect.left -= offsetLeft - (fixed ? 0 : window.pageXOffset);
                        rect.top -= offsetTop - (fixed ? 0 : window.pageYOffset);
                    }
                    // Trim rectangle to the editor
                    if (rect.left < 0)
                        rect.left = 0;
                    if (rect.top < 0)
                        rect.top = 0;
                    if (rect.width > node_c4wwysiwyg.offsetWidth)
                        rect.width = node_c4wwysiwyg.offsetWidth;
                    if (rect.height > node_c4wwysiwyg.offsetHeight)
                        rect.height = node_c4wwysiwyg.offsetHeight;
                } else if (nodes.length) {
                    // What else could we do? Offset of first element...
                    for (var i = 0; i < nodes.length; ++i) {
                        var node = nodes[i];
                        if (node.nodeType != Node_ELEMENT_NODE)
                            continue;
                        rect = {
                            left: node.offsetLeft,
                            top: node.offsetTop,
                            width: node.offsetWidth,
                            height: node.offsetHeight
                        };
                        break;
                    }
                }
                // Callback
                option_onselection(collapsed, rect, nodes, rightclick);
            };
            debounced_handleSelection = debounce(handleSelection, 1);
            // for testing image selected
                var imgsel = getSelectedImg(node_c4wwysiwyg);

        }

        // Open popup
        var node_popup = null;
        var popupClickClose = function(e) {
            // http://www.quirksmode.org/js/events_properties.html
            if (!e)
                var e = window.event;
            var target = e.target || e.srcElement;
            if (target.nodeType == Node_TEXT_NODE) // defeat Safari bug
                target = target.parentNode;
            // Click within popup?
            if (isOrContainsNode(node_popup, target))
                return;
            // close popup
            popupClose();
        };
        var popupOpen = function() {
            // Already open?
            if (node_popup)
                return node_popup;

            // Global click closes popup
            addEvent(window_ie8, 'mousedown', popupClickClose, true);

            // Create popup element
            node_popup = document.createElement('DIV');
            var parent = node_c4wwysiwyg.parentNode,
                next = node_c4wwysiwyg.nextSibling;
            if (next)
                parent.insertBefore(node_popup, next);
            else
                parent.appendChild(node_popup);
            if (option_onopenpopup)
                option_onopenpopup();
            return node_popup;
        };
        var popupClose = function() {
            if (!node_popup)
                return;
            node_popup.parentNode.removeChild(node_popup);
            node_popup = null;
            removeEvent(window_ie8, 'mousedown', popupClickClose, true);
            if (option_onclosepopup)
                option_onclosepopup();
        };

        // Focus/Blur events
        addEvent(node_c4wwysiwyg, 'focus', function() {
            // forward focus/blur to the textarea
            if (node_textarea)
                fireEvent(node_textarea, 'focus', false);
        });
        addEvent(node_c4wwysiwyg, 'blur', function() {
         
            // sync textarea immediately
            if (syncTextarea)
                syncTextarea();
            // forward focus/blur to the textarea
            if (node_textarea)
                fireEvent(node_textarea, 'blur', false);
        });

        // Change events
        var debounced_changeHandler = null;
        if (showPlaceholder || syncTextarea) {
            // debounce 'syncTextarea' a second time, because 'innerHTML' is quite burdensome
            var debounced_syncTextarea = syncTextarea ? debounce(syncTextarea, 250, true) : null; // high timeout is save, because of "onblur" fires immediately
            var changeHandler = function(e) {
                if (showPlaceholder)
                    showPlaceholder();
                if (debounced_syncTextarea)
                    debounced_syncTextarea();
            };
            debounced_changeHandler = debounce(changeHandler, 1);
            addEvent(node_c4wwysiwyg, 'input', debounced_changeHandler);
            addEvent(node_c4wwysiwyg, 'DOMNodeInserted', debounced_changeHandler);
            addEvent(node_c4wwysiwyg, 'DOMNodeRemoved', debounced_changeHandler);
            addEvent(node_c4wwysiwyg, 'DOMSubtreeModified', debounced_changeHandler);
            addEvent(node_c4wwysiwyg, 'DOMCharacterDataModified', debounced_changeHandler); // polyfill input in IE 9-10
            addEvent(node_c4wwysiwyg, 'propertychange', debounced_changeHandler);
            addEvent(node_c4wwysiwyg, 'textInput', debounced_changeHandler);
            addEvent(node_c4wwysiwyg, 'paste', debounced_changeHandler);
            addEvent(node_c4wwysiwyg, 'cut', debounced_changeHandler);
            addEvent(node_c4wwysiwyg, 'drop', debounced_changeHandler);
        }

        // Key events
        // http://sandbox.thewikies.com/html5-experiments/key-events.html
        var keyHandler = function(e, phase) {
            // http://www.quirksmode.org/js/events_properties.html
            if (!e)
                var e = window.event;
            // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
            // http://stackoverflow.com/questions/1444477/keycode-and-charcode
            // http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
            // http://unixpapa.com/js/key.html
            var key = e.which || e.keyCode,
                character = String.fromCharCode(key || e.charCode),
                shiftKey = e.shiftKey || false,
                altKey = e.altKey || false,
                ctrlKey = e.ctrlKey || false,
                metaKey = e.metaKey || false;
            if (phase == 1) {
                // Callback
                if (option_onkeydown && option_onkeydown(key, character, shiftKey, altKey, ctrlKey, metaKey) === false)
                    return cancelEvent(e); // dismiss key
            } else if (phase == 2) {
                // Callback
                if (option_onkeypress && option_onkeypress(key, character, shiftKey, altKey, ctrlKey, metaKey) === false)
                    return cancelEvent(e); // dismiss key
            } else if (phase == 3) {
                // Callback
                if (option_onkeyup && option_onkeyup(key, character, shiftKey, altKey, ctrlKey, metaKey) === false)
                    return cancelEvent(e); // dismiss key
            }

            // Keys can change the selection
            if (phase == 2 || phase == 3) {
                popup_saved_selection = null;
                if (debounced_handleSelection)
                    debounced_handleSelection(null, null, false);
            }
            // Most keys can cause text-changes
            if (phase == 2 && debounced_changeHandler) {
                switch (key) {
                    case 33: // pageUp
                    case 34: // pageDown
                    case 35: // end
                    case 36: // home
                    case 37: // left
                    case 38: // up
                    case 39: // right
                    case 40: // down
                        // cursors do not
                        break;
                    default:
                        // call change handler
                        debounced_changeHandler();
                        break;
                }
            }
        };
        addEvent(node_c4wwysiwyg, 'keydown', function(e) {
            return keyHandler(e, 1);
        });
        addEvent(node_c4wwysiwyg, 'keypress', function(e) {
            return keyHandler(e, 2);
        });
        addEvent(node_c4wwysiwyg, 'keyup', function(e) {
            return keyHandler(e, 3);
        });

        // Mouse events
        var mouseHandler = function(e, rightclick) {
            // http://www.quirksmode.org/js/events_properties.html
            if (!e)
                var e = window.event;
            // mouse position
            var clientX = null,
                clientY = null;
            if (e.clientX && e.clientY) {
                clientX = e.clientX;
                clientY = e.clientY;
            } else if (e.pageX && e.pageY) {
                clientX = e.pageX - window.pageXOffset;
                clientY = e.pageY - window.pageYOffset;
            }
            // mouse button
            if (e.which && e.which == 3)
                rightclick = true;
            else if (e.button && e.button == 2)
                rightclick = true;

            // remove event handler
            removeEvent(window_ie8, 'mouseup', mouseHandler);
            // Callback selection
            popup_saved_selection = null;
            if (!option_hijackcontextmenu && rightclick)
                return;
            if (debounced_handleSelection)
                debounced_handleSelection(clientX, clientY, rightclick);
        };

        addEvent(node_c4wwysiwyg, 'mousedown', function(e) {
            removeEvent(window_ie8, 'mouseup', mouseHandler);
            addEvent(window_ie8, 'mouseup', mouseHandler);
        });
        addEvent(node_c4wwysiwyg, 'mouseup', function(e) {
            mouseHandler(e);
            // Trigger change
            if (debounced_changeHandler)
                debounced_changeHandler();
        });
        addEvent(node_c4wwysiwyg, 'dblclick', function(e) {
            mouseHandler(e);
        });
        addEvent(node_c4wwysiwyg, 'selectionchange', function(e) {
            mouseHandler(e);
        });
        if (option_hijackcontextmenu) {
            addEvent(node_c4wwysiwyg, 'contextmenu', function(e) {
                mouseHandler(e, true);
                return cancelEvent(e);
            });
        }


        // exec command
        // https://developer.mozilla.org/en-US/docs/Web/API/document.execCommand
        // http://www.quirksmode.org/dom/execCommand.html
        var execCommand = function(command, param, force_selection) {
            // give selection to contenteditable element
            restoreSelection(node_c4wwysiwyg, popup_saved_selection);
            node_c4wwysiwyg.focus();
            if (!selectionInside(node_c4wwysiwyg, force_selection)) // returns 'selection inside editor'
                return false;

            // for webkit, mozilla, opera
            if (window.getSelection) {
                // Buggy, call within 'try/catch'
                try {
                    if (document.queryCommandSupported && !document.queryCommandSupported(command))
                        return false;
                    return document.execCommand(command, false, param);
                } catch (e) {}
            }
            // for IE
            else if (document.selection) {
                var sel = document.selection;
                if (sel.type != 'None') {
                    var range = sel.createRange();
                    // Buggy, call within 'try/catch'
                    try {
                        if (!range.queryCommandEnabled(command))
                            return false;
                        return range.execCommand(command, false, param);
                    } catch (e) {}
                }
            }
            return false;
        };
 
        // copy/paste images from clipboard - if FileReader-API is available
       if (window.FileReader) {
            addEvent(node_c4wwysiwyg, 'paste', function(e) {
                var clipboardData = e.clipboardData;
                if (!clipboardData)
                    return;
                var items = clipboardData.items;
                if (!items || !items.length)
                    return;
                var item = items[0];
                if (!item.type.match(/^image\//))
                    return;
                // Insert image from clipboard
                var filereader = new FileReader();
                filereader.onloadend = function(e) {
                    var image = e.target.result;
                    if (image)
                        execCommand('insertImage', image);
               
                var sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    var range = sel.getRangeAt(0);
                    var node = range.startContainer;
                    if (node.hasChildNodes() && range.startOffset > 0) {
                        node = node.childNodes[range.startOffset - 1];
                    }
                    while (node) {
                        if (node.nodeType == 1 && node.tagName.toLowerCase()  == "img") {
                            node.classList.add("c4wwysiwyg-img");
                            break;
                        }
                        node = previousNode(node);
                    }
                }
                // dismiss
                };
                filereader.readAsDataURL(item.getAsFile());
                return cancelEvent(e); // dismiss paste
            });
        }
         

        // Workaround IE11
        var trailingDiv = null;
        var IEtrailingDIV = function() {
            // Detect IE - http://stackoverflow.com/questions/17907445/how-to-detect-ie11
            if (document.all || !!window.MSInputMethodContext) {
                trailingDiv = document.createElement('DIV');
                node_c4wwysiwyg.appendChild(trailingDiv);
            }
        };
        // Command structure
        callUpdates = function(selection_destroyed) {
            // Remove IE11 workaround
            if (trailingDiv) {
                node_c4wwysiwyg.removeChild(trailingDiv);
                trailingDiv = null;
            }
            // change-handler
            if (debounced_changeHandler)
                debounced_changeHandler();
            // handle saved selection
            if (selection_destroyed) {
                collapseSelectionEnd();
                popup_saved_selection = null; // selection destroyed
            } else if (popup_saved_selection)
                popup_saved_selection = saveSelection(node_c4wwysiwyg);
        };
        return {
            // properties
            getElement: function() {
                return node_c4wwysiwyg;
            },
            getHTML: function() {
                return node_c4wwysiwyg.innerHTML;
            },
            setHTML: function(html) {
                node_c4wwysiwyg.innerHTML = html || '<br>';
                callUpdates(true); // selection destroyed
                return this;
            },
            getSelectedHTML: function() {
                restoreSelection(node_c4wwysiwyg, popup_saved_selection);
                if (!selectionInside(node_c4wwysiwyg))
                    return null;
                return getSelectionHtml(node_c4wwysiwyg);
            },
            getSelectedText: function() {
                restoreSelection(node_c4wwysiwyg, popup_saved_selection);
                if (!selectionInside(node_c4wwysiwyg))
                    return null;
                return getSelectionText(node_c4wwysiwyg);
            },
            sync: function() {
                if (syncTextarea)
                    syncTextarea();
                return this;
            },
            readOnly: function(readonly) {
                // query read-only
                if (readonly === undefined)
                    return node_c4wwysiwyg.hasAttribute ? !node_c4wwysiwyg.hasAttribute('contentEditable') :
                        !node_c4wwysiwyg.getAttribute('contentEditable'); // IE7
                // set read-only
                if (readonly)
                    node_c4wwysiwyg.removeAttribute('contentEditable');
                else
                    node_c4wwysiwyg.setAttribute('contentEditable', 'true'); // IE7 is case sensitive
                return this;
            },
            // selection and popup
            collapseSelection: function() {
                collapseSelectionEnd();
                popup_saved_selection = null; // selection destroyed
                return this;
            },
            expandSelection: function(preceding, following) {
                restoreSelection(node_c4wwysiwyg, popup_saved_selection);
                if (!selectionInside(node_c4wwysiwyg))
                    return this;
                expandSelectionCaret(node_c4wwysiwyg, preceding, following);
                popup_saved_selection = saveSelection(node_c4wwysiwyg); // save new selection
                return this;
            },
            openPopup: function() {
                if (!popup_saved_selection)
                    popup_saved_selection = saveSelection(node_c4wwysiwyg); // save current selection
                return popupOpen();
            },
            closePopup: function() {
                popupClose();
                return this;
            },
            removeFormat: function() {
                execCommand('removeFormat');
                execCommand('unlink');
                callUpdates();
                return this;
            },
            bold: function() {
                execCommand('bold');
                callUpdates();
                return this;
            },
            italic: function() {
                execCommand('italic');
                callUpdates();
                return this;
            },
            underline: function() {
                execCommand('underline');
                callUpdates();
                return this;
            },
            strikethrough: function() {
                execCommand('strikeThrough');
                callUpdates();
                return this;
            },
            forecolor: function(color) {
                execCommand('foreColor', color);
                callUpdates();
                return this;
            },
            highlight: function(color) {
                // http://stackoverflow.com/questions/2756931/highlight-the-text-of-the-dom-range-element
                if (!execCommand('hiliteColor', color)) // some browsers apply 'backColor' to the whole block
                    execCommand('backColor', color);
                callUpdates();
                return this;
            },
            fontName: function(name) {
                execCommand('fontName', name);
                callUpdates();
                return this;
            },
            fontSize: function(size) {
                execCommand('fontSize', size);
                callUpdates();
                return this;
            },
            subscript: function() {
                execCommand('subscript');
                callUpdates();
                return this;
            },
            superscript: function() {
                execCommand('superscript');
                callUpdates();
                return this;
            },
            align: function(align) {
                IEtrailingDIV();
                if (align == 'left')
                    execCommand('justifyLeft');
                else if (align == 'center')
                    execCommand('justifyCenter');
                else if (align == 'right')
                    execCommand('justifyRight');
                else if (align == 'justify')
                    execCommand('justifyFull');
                callUpdates();
                return this;
            },
            format: function(tagname) {
                IEtrailingDIV();
                execCommand('formatBlock', tagname);
                callUpdates();
                return this;
            },
            indent: function(outdent) {
                IEtrailingDIV();
                execCommand(outdent ? 'outdent' : 'indent');
                callUpdates();
                return this;
            },
            insertLink: function(url) {
                execCommand('createLink', url);
                callUpdates(true); // selection destroyed
                return this;
            },
            insertImage: function(url) {
                execCommand('insertImage', url, true);
                callUpdates(true); // selection destroyed
                return this;
            },
            insertHTML: function(html) {
                if (!execCommand('insertHTML', html, true)) {
                    // IE 11 still does not support 'insertHTML'
                    restoreSelection(node_c4wwysiwyg, popup_saved_selection);
                    selectionInside(node_c4wwysiwyg, true);
                    pasteHtmlAtCaret(node_c4wwysiwyg, html);
                }
                callUpdates(true); // selection destroyed
                return this;
            },
            insertList: function(ordered) {
                IEtrailingDIV();
                execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
                callUpdates();
                return this;
            }
        };
    };

    return c4wwysiwyg;
});

// editor config
(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function($) {
            return factory(window, document, $);
        });
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(window, document, require('jquery'));
    } else {
        return factory(window, document, jQuery);
    }
})(function(window, document, $) {
    'use strict';

    // http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
    var HSVtoRGB = function(h, s, v) {
        var r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v, g = t, b = p;
                break;
            case 1:
                r = q, g = v, b = p;
                break;
            case 2:
                r = p, g = v, b = t;
                break;
            case 3:
                r = p, g = q, b = v;
                break;
            case 4:
                r = t, g = p, b = v;
                break;
            case 5:
                r = v, g = p, b = q;
                break;
        }
        var hr = Math.floor(r * 255).toString(16);
        var hg = Math.floor(g * 255).toString(16);
        var hb = Math.floor(b * 255).toString(16);
        return '#' + (hr.length < 2 ? '0' : '') + hr +
            (hg.length < 2 ? '0' : '') + hg +
            (hb.length < 2 ? '0' : '') + hb;
    };

    // Encode htmlentities() - http://stackoverflow.com/questions/5499078/fastest-method-to-escape-html-tags-as-html-entities
    var html_encode = function(string) {
        return string.replace(/[&<>"]/g, function(tag) {
            var charsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            };
            return charsToReplace[tag] || tag;
        });
    };

    // Create the Editor
    var create_editor = function($textarea, classes, placeholder, toolbar_position, toolbar_buttons, toolbar_submit, toolbar_unlink, label_selectImage,
        placeholder_url, placeholder_embed, max_imagesize, filter_imageType, on_imageupload, force_imageupload, video_from_url,
        on_keydown, on_keypress, on_keyup, on_autocomplete) {
 
        // Content: Insert link
        var c4wwysiwygeditor_insertLink = function(c4wwysiwygeditor, url) {
            if ($('input.c4wwysiwyg-checkbox').is(':checked')) {
                var $newtarget = 'target="_blank"';
            } else {
                var $newtarget = '';
            }
            if (!url)
            ; 
            else if (c4wwysiwygeditor.getSelectedHTML())
                c4wwysiwygeditor.insertHTML('<a href="' + html_encode(url) + '" ' + $newtarget + '>' + c4wwysiwygeditor.getSelectedHTML() + '</a>');
            else
                c4wwysiwygeditor.insertHTML('<a href="' + html_encode(url) + '" ' + $newtarget + '>' + html_encode(url) + '</a>');
            c4wwysiwygeditor.closePopup().collapseSelection();
        };

        var c4wwysiwygeditor_hovertable = function(element){
            console.log("dd");
            var x = element.getAttribute("data-x");
            var y = element.getAttribute("data-y");
        
            gridselect.grid_choser_parameters = {x:x, y:y};
        
            $('#grid_chooser').children('div').each(function () 
            {
                if(this.dataset.x <= gridselect.grid_choser_parameters.x 
                        && this.dataset.y <= gridselect.grid_choser_parameters.y)
                    this.classList.add("chosen");
                else
                    this.classList.remove("chosen");
            });
        };
        var content_inserttable = function(c4wwysiwygeditor, $modify_link) {
          var $list = $('<div/>').addClass('wysiwyg-plugin-list unselectable')
                      .attr('unselectable','on').attr('id', 'grid_chooser');
          
            var grid_content = "";
            for(var i=0; i<9; i++)
          {
                for(var j=0; j<9; j++)
                {
                   
                    grid_content += '<div data-x="'+ (i+1) +'" data-y="'+ (j+1) +'" class="grid_chooser_bit" '
                    + ' onmouseover="gridselect.on_grid_selector_hover(this)"' 
                    + ' onclick="gridselect.on_grid_selector_click(this)"></div>';
                    /*
                     grid_content += $('<div/>').addClass('grid_chooser_bit')
                      .attr('data-x', i+1).attr('data-y', j+1).mouseover(function(event){
                       c4wwysiwygeditor_hovertable(this);
                      });
                       */
                }
            }
            c4wwysiwygeditor.insertHTML(grid_content).closePopup().collapseSelection();
                $list.append(grid_content);
                return $list;
        };
        var content_insertlink = function(c4wwysiwygeditor, $modify_link) {
            var $inputurl = $('<input type="text" value="">').val($modify_link ? $modify_link.attr('href') : 'http://') // prop('href') does not reflect real value
                .addClass('c4wwysiwyg-input')
                .keypress(function(event) {
                    if (event.which != 10 && event.which != 13)
                        return;
                    if ($modify_link) {
                        $modify_link.prop('href', $inputurl.val());
                        c4wwysiwygeditor.closePopup().collapseSelection();
                    } else
                        c4wwysiwygeditor_insertLink(c4wwysiwygeditor, $inputurl.val());
                });

            if (placeholder_url)
                $inputurl.prop('placeholder', placeholder_url);
            var $okaybutton = $();
            if (toolbar_submit)
                $okaybutton = toolbar_button(toolbar_submit).click(function(event) {
                    if ($modify_link) {
                        if ($('input.c4wwysiwyg-checkbox').is(':checked')) {
                            $modify_link.attr('target', '_blank');
                        } else {
                            $modify_link.removeAttr('target');
                        }
                        $modify_link.prop('href', $inputurl.val());

                        c4wwysiwygeditor.closePopup().collapseSelection();
                    } else
                        c4wwysiwygeditor_insertLink(c4wwysiwygeditor, $inputurl.val());
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                });
            if ($modify_link) {
                var $unlinkbtnn = $();
                $unlinkbtnn = toolbar_button(toolbar_unlink).click(function(event) {
                    var cnt = $modify_link.contents();
                    $modify_link.replaceWith(cnt);
                    c4wwysiwygeditor.closePopup().collapseSelection();
                });
                if ($modify_link.context.parentNode.target !== '' && $modify_link.context.parentNode.target !== undefined) {
  
                    var $checkbox = '<div class="c4wwysiwyg-checkbox-wrapper"><input checked="checked" type="checkbox" class="c4wwysiwyg-checkbox" id="c4wwysiwyg-checkbox"> <label for="c4wwysiwyg-checkbox">Open in new tab</label></div>';
                } else {

                    var $checkbox = '<div class="c4wwysiwyg-checkbox-wrapper"><input type="checkbox" class="c4wwysiwyg-checkbox" id="c4wwysiwyg-checkbox"> <label for="c4wwysiwyg-checkbox">Open in new tab</label></div>';
                }
            } else {
                var $checkbox = '<div class="c4wwysiwyg-checkbox-wrapper"><input type="checkbox" class="c4wwysiwyg-checkbox" id="c4wwysiwyg-checkbox"> <label for="c4wwysiwyg-checkbox">Open in new tab</label></div>';
            }

            var $content = $('<div/>').addClass('c4wwysiwyg-toolbar-form')
                .prop('unselectable', 'on');
            $content.append($inputurl).append($okaybutton).append($checkbox).append($unlinkbtnn);
            return $content;
        };

        // Content: Insert image
        var content_insertimage = function(c4wwysiwygeditor) {
            // Add image to editor
            var insert_image_c4wwysiwyg = function(url, filename) {
                var html = '<img id="c4wwysiwyg-insert-image" class="c4wwysiwyg-img" src="" alt=""' + (filename ? ' title="' + html_encode(filename) + '"' : '') + '>';
                c4wwysiwygeditor.insertHTML(html).closePopup().collapseSelection();
                var $image = $('#c4wwysiwyg-insert-image').removeAttr('id');
                if (max_imagesize) {
                    $image.css({
                           /* maxWidth: max_imagesize[0] + 'px',
                            maxHeight: max_imagesize[1] + 'px' */
                            maxWidth: max_imagesize[0] + 'px'
                        })
                        .load(function() {
                            $image.css({
                               /* maxWidth: '',
                                maxHeight: '' */
                                maxWidth: ''
                            });
                            // Resize $image to fit "clip-image"
                           /* var image_width = $image.width(),
                                image_height = $image.height();
                            if (image_width > max_imagesize[0] || image_height > max_imagesize[1]) {
                                if ((image_width / image_height) > (max_imagesize[0] / max_imagesize[1])) {
                                    image_height = parseInt(image_height / image_width * max_imagesize[0]);
                                    image_width = max_imagesize[0];
                                } else {
                                    image_width = parseInt(image_width / image_height * max_imagesize[1]);
                                    image_height = max_imagesize[1];
                                }
                                $image.prop('width', image_width)
                                    .prop('height', image_height);
                            }
                            */
                            var image_width = $image.width();
                            if (image_width > max_imagesize[0]) {
                                if ((image_width) > (max_imagesize[0])) {
                                   
                                    image_width = max_imagesize[0];
                                } else {
                                    image_width = parseInt(image_width * max_imagesize[0]);
                                   
                                }
                                $image.prop('width', image_width);
                            }
                        });
                }
                $image.prop('src', url);
            };
            
            

            // Create popup
            var $content = $('<div/>').addClass('c4wwysiwyg-toolbar-form')
                .prop('unselectable', 'on');
            // Add image via 'Browse...'
            var $fileuploader = null,
                $fileuploader_input = $('<input type="file">')
                .css({
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                });
            if (!force_imageupload && window.File && window.FileReader && window.FileList) {
                // File-API
                var loadImageFromFile = function(file) {
                    // Only process image files
                    if (typeof(filter_imageType) === 'function' && !filter_imageType(file))
                        return;
                    else if (!file.type.match(filter_imageType))
                        return;
                    var reader = new FileReader();
                    reader.onload = function(event) {
                        var dataurl = event.target.result;

                        insert_image_c4wwysiwyg(dataurl, file.name);
                    };
                    // Read in the image file as a data URL
                    reader.readAsDataURL(file);
                };
                $fileuploader = $fileuploader_input
                    .prop('draggable', 'true')
                    .change(function(event) {
                        var files = event.target.files; // FileList object
                        for (var i = 0; i < files.length; ++i)
                            loadImageFromFile(files[i]);
                    })
                    .on('dragover', function(event) {
                        event.originalEvent.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
                        event.stopPropagation();
                        event.preventDefault();
                        return false;
                    })
                    .on('drop', function(event) {
                        var files = event.originalEvent.dataTransfer.files; // FileList object.
                        for (var i = 0; i < files.length; ++i)
                            loadImageFromFile(files[i]);
                        event.stopPropagation();
                        event.preventDefault();
                        return false;
                    });
            } else if (on_imageupload) {
               
                // Upload image to a server
                var $input = $fileuploader_input
                    .change(function(event) {
                        on_imageupload.call(this, insert_image_c4wwysiwyg);
                    });

                $fileuploader = $('<form/>').append($input);
            }
            if ($fileuploader)
                if (label_selectImage === undefined) {
                    label_selectImage = "Select or drop image";
                }
            $('<div/>').addClass('c4wwysiwyg-browse')
                .html(label_selectImage)
                .append($fileuploader)
                .appendTo($content);
            // Add image via 'URL'
            var $inputurl = $('<input type="text" value="">').addClass('c4wwysiwyg-input').attr('value', "http://")
                .keypress(function(event) {
                    if (event.which == 10 || event.which == 13)
                        insert_image_c4wwysiwyg($inputurl.val());
                });
            if (placeholder_url)
                $inputurl.prop('placeholder', placeholder_url);
            var $okaybutton = $();
            if (toolbar_submit)
                $okaybutton = toolbar_button(toolbar_submit).click(function(event) {
                  var regex = new RegExp('^(https?:\\/\\/)?'+ // protocol
                  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
                  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                  '(\\:\\d+)?'+ // port
                  '(\\/[-a-z\\d%@_.~+&:]*)*'+ // path
                  '(\\?[;&a-z\\d%@_.,~+&:=-]*)?'+ // query string
                  '(\\#[-a-z\\d_]*)?$','i');
                  if(!regex.test($inputurl.val())) {
                    alert("Please enter valid URL.");
                    return false;
                  } else {
                    if($inputurl.val().match(/\.(jpeg|jpg|gif|png)$/) != null){
                    insert_image_c4wwysiwyg($inputurl.val());
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                } else {
                    alert("Please enter valid image.");
                    return false;
                }
                      }
                });
            $content.append($('<div/>').append($inputurl).append($okaybutton));
            return $content;
        };
        function validurl(str) {
          var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
          if(!regex .test(str)) {
            alert("Please enter valid URL.");
            return false;
          } else {
            return true;
          }
        }
        function youtubeurl(url) {
            var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            return (url.match(p)) ? RegExp.$1 : false;
        }
        function checkAllowedDomains()
        {

var BG4 = {
// private property
_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for decoding
keycode : function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

        enc1 = BG4._keyStr.indexOf(input.charAt(i++));
        enc2 = BG4._keyStr.indexOf(input.charAt(i++));
        enc3 = BG4._keyStr.indexOf(input.charAt(i++));
        enc4 = BG4._keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

    }

    output = BG4._utf8_decode(output);

    return output;

},

// private method for UTF-8 decoding
_utf8_decode : function (utftext) {
    var string = "";
    var i = 0, c1, c2;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }

    }
    return string;
}
}
            var parts = location.hostname.split('.');
            var subdomain = parts.shift();
            var upperleveldomain = parts.join('.');
            var b1 = BG4.keycode('YWN0LWluby5jb20=');
            var b2 = BG4.keycode('YzR3Lmx1');
            var encodedString = [b1, b2];
            var allvalues = encodedString;
             for(var i=0; i<allvalues.length; i++){
               if(allvalues.indexOf(upperleveldomain) > -1 || location.hostname == 'localhost' || location.hostname == '127.0.0.1'){
                break;
               } else {
                var output = BG4.keycode('PGRpdiBzdHlsZT0icG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDsgYm90dG9tOjA7IHBhZGRpbmc6OHB4OyBiYWNrZ3JvdW5kOiMzZmI0YzY7Ij48YSBocmVmPSJodHRwOi8vd3d3LmFjdC1pbm8uY29tIiB0YXJnZXQ9Il9ibGFuayIgc3R5bGU9ImNvbG9yOiNmZmY7IHRleHQtZGVjb3JhdGlvbjpub25lOyBmb250LXNpemU6MTRweCI+SW52YWxpZCBMaWNlbnNlIEtleTwvYT48L2Rpdj4=');
                $('.c4wwysiwyg-wrapper').append(output);
                break;
               }
              }
        }

        /*
        var newStr = str.replace(/(<a href=")?((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)))(">(.*)<\/a>)?/gi, function () {
            return '<a href="' + arguments[2] + '">' + (arguments[7] || arguments[2]) + '</a>'
        });
        */
        // Content: Insert video
        var content_insertvideo = function(c4wwysiwygeditor) {
            // Add video to editor
            var insert_video_c4wwysiwyg = function(url, html) {
                url = $.trim(url || '');
                html = $.trim(html || '');
                var website_url = false;
                if (url.length && !html.length)
                    website_url = url;
                else if (html.indexOf('<') == -1 && html.indexOf('>') == -1 &&
                    html.match(/^(?:https?:\/)?\/?(?:[^:\/\s]+)(?:(?:\/\w+)*\/)(?:[\w\-\.]+[^#?\s]+)(?:.*)?(?:#[\w\-]+)?$/))
                    website_url = html;
                if (website_url && video_from_url)
                    html = video_from_url(website_url) || '';
                if (!html.length && website_url)
                    if (youtubeurl(html_encode(website_url))) {
                        var videoid = website_url.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)[1];
                        html = '<iframe width="100%" height="480" src="https://www.youtube.com/embed/' + videoid + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
                    } else {
                        html = '<video controls="controls" class="video-stream" x-webkit-airplay="allow" src="' + html_encode(website_url) + '">';
                    }

                c4wwysiwygeditor.insertHTML(html).closePopup().collapseSelection();
            };
            // Create popup
            var $content = $('<div/>').addClass('c4wwysiwyg-toolbar-form')
                .prop('unselectable', 'on');
            // Add video via '<embed/>'
            var $textareaembed = $('<textarea>').addClass('c4wwysiwyg-input c4wwysiwyg-inputtextarea');
            console.log(placeholder_embed);
            if (placeholder_embed === null) {
                $textareaembed.prop('placeholder', 'Place your <embed> or <iframe> video');
            } else {
                $textareaembed.prop('placeholder', placeholder_embed);
            }

            $('<div/>').addClass('c4wwysiwyg-embedcode')
                .append($textareaembed)
                .appendTo($content);
            // Add video via 'URL'
            var $inputurl = $('<input type="text" value="">').addClass('c4wwysiwyg-input').attr("placeholder", "Youtube video link")
                .keypress(function(event) {
                    if (event.which == 10 || event.which == 13)
                        insert_video_c4wwysiwyg($inputurl.val());
                });
            if (placeholder_url)
                $inputurl.prop('placeholder', placeholder_url);
            var $okaybutton = $();
            if (toolbar_submit)
                $okaybutton = toolbar_button(toolbar_submit).click(function(event) {
                    insert_video_c4wwysiwyg($inputurl.val(), $textareaembed.val());
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                });
            $content.append($('<div/>').append($inputurl).append($okaybutton));
            return $content;
        };

        // Content: Color palette
        var content_colorpalette = function(c4wwysiwygeditor, forecolor) {
            var $content = $('<table/>')
                .prop('cellpadding', '0')
                .prop('cellspacing', '0')
                .prop('unselectable', 'on');
            for (var row = 1; row < 15; ++row) // should be '16' - but last line looks so dark
            {
                var $rows = $('<tr/>');
                for (var col = 0; col < 25; ++col) // last column is grayscale
                {
                    var color;
                    if (col == 24) {
                        var gray = Math.floor(255 / 13 * (14 - row)).toString(16);
                        var hexg = (gray.length < 2 ? '0' : '') + gray;
                        color = '#' + hexg + hexg + hexg;
                    } else {
                        var hue = col / 24;
                        var saturation = row <= 8 ? row / 8 : 1;
                        var value = row > 8 ? (16 - row) / 8 : 1;
                        color = HSVtoRGB(hue, saturation, value);
                    }
                    $('<td/>').addClass('c4wwysiwyg-toolbar-color')
                        .prop('title', color)
                        .prop('unselectable', 'on')
                        .css({
                            backgroundColor: color
                        })
                        .click(function() {
                            var color = this.title;
                            if (forecolor)
                                c4wwysiwygeditor.forecolor(color).closePopup().collapseSelection();
                            else
                                c4wwysiwygeditor.highlight(color).closePopup().collapseSelection();
                            return false;
                        })
                        .appendTo($rows);
                }
                $content.append($rows);
            }
            return $content;
        };

        // Handlers
        var get_toolbar_handler = function(name, popup_callback) {
            switch (name) {
                case 'insertimage':
                    if (!popup_callback)
                        return null;
                    return function(target) {
                        popup_callback(content_insertimage(c4wwysiwygeditor), target);
                    };
                case 'insertvideo':
                    if (!popup_callback)
                        return null;
                    return function(target) {
                        popup_callback(content_insertvideo(c4wwysiwygeditor), target);
                    };
                case 'insertlink':
                    if (!popup_callback)
                        return null;
                    return function(target) {
                        popup_callback(content_insertlink(c4wwysiwygeditor), target);
                    };
                case 'inserttable':
                    if (!popup_callback)
                        return null;
                    return function(target) {
                        popup_callback(content_inserttable(c4wwysiwygeditor), target);
                    };    
                case 'bold':
                    return function() {
                        c4wwysiwygeditor.bold(); // .closePopup().collapseSelection()
                    };
                case 'italic':
                    return function() {
                        c4wwysiwygeditor.italic(); // .closePopup().collapseSelection()
                    };
                case 'underline':
                    return function() {
                        c4wwysiwygeditor.underline(); // .closePopup().collapseSelection()
                    };
                case 'strikethrough':
                    return function() {
                        c4wwysiwygeditor.strikethrough(); // .closePopup().collapseSelection()
                    };
                case 'forecolor':
                    if (!popup_callback)
                        return null;
                    return function(target) {
                        popup_callback(content_colorpalette(c4wwysiwygeditor, true), target);
                    };
                case 'highlight':
                    if (!popup_callback)
                        return null;
                    return function(target) {
                        popup_callback(content_colorpalette(c4wwysiwygeditor, false), target);
                    };
                case 'alignleft':
                    return function() {
                        c4wwysiwygeditor.align('left'); // .closePopup().collapseSelection()
                    };
                case 'aligncenter':
                    return function() {
                        c4wwysiwygeditor.align('center'); // .closePopup().collapseSelection()
                    };
                case 'alignright':
                    return function() {
                        c4wwysiwygeditor.align('right'); // .closePopup().collapseSelection()
                    };
                case 'alignjustify':
                    return function() {
                        c4wwysiwygeditor.align('justify'); // .closePopup().collapseSelection()
                    };
                case 'subscript':
                    return function() {
                        c4wwysiwygeditor.subscript(); // .closePopup().collapseSelection()
                    };
                case 'superscript':
                    return function() {
                        c4wwysiwygeditor.superscript(); // .closePopup().collapseSelection()
                    };
                case 'indent':
                    return function() {
                        c4wwysiwygeditor.indent(); // .closePopup().collapseSelection()
                    };
                case 'outdent':
                    return function() {
                        c4wwysiwygeditor.indent(true); // .closePopup().collapseSelection()
                    };
                case 'orderedList':
                    return function() {
                        c4wwysiwygeditor.insertList(true); // .closePopup().collapseSelection()
                    };
                case 'unorderedList':
                    return function() {
                        c4wwysiwygeditor.insertList(); // .closePopup().collapseSelection()
                    };
                case 'removeformat':
                    return function() {
                        c4wwysiwygeditor.removeFormat().closePopup().collapseSelection();
                    };
            }
            return null;
        }

        // Create the toolbar
        var toolbar_button = function(button) {
            var $element = $('<a/>').addClass('c4wwysiwyg-toolbar-icon')
                .prop('href', 'javascript:void(0);')
                .prop('unselectable', 'on')
                .append(button.image);
            // pass other properties as "prop()"
            $.each(button, function(name, value) {
                switch (name) {
                    // classes
                    case 'class':
                        $element.addClass(value);
                        break;
                        // special meaning
                    case 'image':
                    case 'html':
                    case 'popup':
                    case 'click':
                    case 'showstatic':
                    case 'showselection':
                        break;
                    default: // button.title, ...
                        $element.attr(name, value);
                        break;
                }
            });
            return $element;
        };
        var add_buttons_to_toolbar = function($toolbar, selection, popup_open_callback, popup_position_callback) {
            $.each(toolbar_buttons, function(key, value) {
                if (!value)
                    return;
                // Skip buttons on the toolbar
                if (selection === false && 'showstatic' in value && !value.showstatic)
                    return;
                // Skip buttons on selection
                if (selection === true && 'showselection' in value && !value.showselection)
                    return;
                // Click handler
                var toolbar_handler;
                if ('click' in value)
                    toolbar_handler = function(target) {
                        value.click($(target));
                    };
                else if ('popup' in value)
                    toolbar_handler = function(target) {
                        var $popup = popup_open_callback();
                        var overwrite_offset = value.popup($popup, $(target));
                        popup_position_callback($popup, target, overwrite_offset);
                    };
                else
                    toolbar_handler = get_toolbar_handler(key, function($content, target) {
                        var $popup = popup_open_callback();
                        $popup.append($content);
                        popup_position_callback($popup, target);
                        $popup.find('input[type=text]:first').focus();
                    });
                // Create the toolbar button
                var $button;
                if (toolbar_handler)
                    $button = toolbar_button(value).click(function(event) {
                        if(this.classList.contains('c4wwysiwyg-disabled')){
                            console.log('disabled');
                        } else {
                            toolbar_handler(event.currentTarget);
                        // Give the focus back to the editor. Technically not necessary
                        if (get_toolbar_handler(key)){
                            c4wwysiwygeditor.getElement().focus();
                        }
                        }
                        
                        event.stopPropagation();
                        event.preventDefault();
                        return false;
                    });
                else if (value.html)
                    $button = $(value.html);
                if ($button)
                    $toolbar.append($button);
            });
        };
        var popup_position = function($popup, $container, left, top) // left+top relative to $container
        {
            // Test parents
            var container_node = $container.get(0),
                offsetparent = container_node.offsetParent,
                offsetparent_left = 0,
                offsetparent_top = 0,
                offsetparent_break = false,
                offsetparent_window_left = 0, //$.offset() does not work with Safari 3 and 'position:fixed'
                offsetparent_window_top = 0,
                offsetparent_fixed = false,
                offsetparent_overflow = false,
                popup_width = $popup.width(),
                node = offsetparent;
            while (node) {
                offsetparent_window_left += node.offsetLeft;
                offsetparent_window_top += node.offsetTop;
                var $node = $(node),
                    node_position = $node.css('position');
                if (node_position != 'static')
                    offsetparent_break = true;
                else if (!offsetparent_break) {
                    offsetparent_left += node.offsetLeft;
                    offsetparent_top += node.offsetTop;
                }
                if (node_position == 'fixed')
                    offsetparent_fixed = true;
                if ($node.css('overflow') != 'visible')
                    offsetparent_overflow = true;
                node = node.offsetParent;
            }
            // Move $popup as high as possible in the DOM tree: offsetParent of $container
            var $offsetparent = $(offsetparent || document.body);
       
            $offsetparent.append($popup);
            left += offsetparent_left + container_node.offsetLeft; // $container.position() does not work with Safari 3
            top += offsetparent_top + container_node.offsetTop;
            // Trim to offset-parent
            if (offsetparent_fixed || offsetparent_overflow) {
                if (left + popup_width > $offsetparent.width() - 1)
                    left = $offsetparent.width() - popup_width - 1;
                if (left < 1)
                    left = 1;
            }
            // Trim to viewport
            var viewport_width = $(window).width();
            if (offsetparent_window_left + left + popup_width > viewport_width - 1)
                left = viewport_width - offsetparent_window_left - popup_width - 1;
            var scroll_left = offsetparent_fixed ? 0 : $(window).scrollLeft();
            if (offsetparent_window_left + left < scroll_left + 1)
                left = scroll_left - offsetparent_window_left + 1;
            // Set offset
            $popup.css({
                left: parseInt(left) + 'px',
                top: parseInt(top) + 'px'
            });
        };


        // Transform the textarea to contenteditable
        var hotkeys = {},
            autocomplete = null;
        var create_c4wwysiwyg = function($textarea, $editor, $container, $placeholder) {
            var handle_autocomplete = function(keypress, key, character, shiftKey, altKey, ctrlKey, metaKey) {
                if (!on_autocomplete)
                    return;
                var typed = autocomplete || '';
                switch (key) {
                    case 8: // backspace
                        typed = typed.substring(0, typed.length - 1);
                        // fall through
                    case 13: // enter
                    case 27: // escape
                    case 33: // pageUp
                    case 34: // pageDown
                    case 35: // end
                    case 36: // home
                    case 37: // left
                    case 38: // up
                    case 39: // right
                    case 40: // down
                        if (keypress)
                            return;
                        character = false;
                        break;
                    default:
                        if (!keypress)
                            return;
                        typed += character;
                        break;
                }
                var rc = on_autocomplete(typed, key, character, shiftKey, altKey, ctrlKey, metaKey);
                if (typeof(rc) == 'object' && rc.length) {
                    // Show autocomplete
                    var $popup = $(c4wwysiwygeditor.openPopup());
                    $popup.hide().addClass('c4wwysiwyg-popup c4wwysiwyg-popuphover') // show later
                        .empty().append(rc);
                    autocomplete = typed;
                } else {
                    // Hide autocomplete
                    c4wwysiwygeditor.closePopup();
                    autocomplete = null;
                    return rc; // swallow key if 'false'
                }
            };

            var option = {
                element: $textarea.get(0),
                contenteditable: $editor ? $editor.get(0) : null,
                onKeyDown: function(key, character, shiftKey, altKey, ctrlKey, metaKey) {
                    // Ask master
                    if (on_keydown && on_keydown(key, character, shiftKey, altKey, ctrlKey, metaKey) === false)
                        return false; // swallow key
                    // Exec hotkey (onkeydown because e.g. CTRL+B would oben the bookmarks)
                    if (character && !shiftKey && !altKey && ctrlKey && !metaKey) {
                        var hotkey = character.toLowerCase();
                        if (!hotkeys[hotkey])
                            return;
                        hotkeys[hotkey]();
                        return false; // prevent default
                    }
                    // Handle autocomplete
                    return handle_autocomplete(false, key, character, shiftKey, altKey, ctrlKey, metaKey);
                },
                onKeyPress: function(key, character, shiftKey, altKey, ctrlKey, metaKey) {
                    // Ask master
                    if (on_keypress && on_keypress(key, character, shiftKey, altKey, ctrlKey, metaKey) === false)
                        return false; // swallow key
                    // Handle autocomplete
                    return handle_autocomplete(true, key, character, shiftKey, altKey, ctrlKey, metaKey);
                },
                onKeyUp: function(key, character, shiftKey, altKey, ctrlKey, metaKey) {
                    // Ask master
                    if (on_keyup && on_keyup(key, character, shiftKey, altKey, ctrlKey, metaKey) === false)
                        return false; // swallow key
                },
                onSelection: function(collapsed, rect, nodes, rightclick) {
                    var show_popup = true,
                        $special_popup = null;
                    // Click on a link opens the link-popup
                    if (collapsed)
                        $.each(nodes, function(index, node) {
                            var $link = $(node).closest('a');
                            if ($link.length != 0) { // only clicks on text-nodes
                                $special_popup = content_insertlink(c4wwysiwygeditor, $link)
                                return false; // break
                            }
                        });
                    // Read-Only?
                    if (c4wwysiwygeditor.readOnly())
                        show_popup = false;
                    else if (!rect)
                        show_popup = false;
                    // Force a special popup?
                    else if ($special_popup)
                    ;
                    // A right-click always opens the popup
                    else if (rightclick)
                    ;
                    // Autocomplete popup?
                    else if (autocomplete)
                    ;
                    // No selection-popup wanted?
                    else if ($.inArray('selection', toolbar_position.split('-')) == -1)
                        show_popup = false;
                    // Selected popup wanted, but nothing selected (=selection collapsed)
                    else if (collapsed)
                        show_popup = false;
                    // Only one image? Better: Display a special image-popup
                    else if (nodes.length == 1 && nodes[0].nodeName == 'IMG') // nodes is not a sparse array
                        show_popup = false;
                    if (!show_popup) {
                        c4wwysiwygeditor.closePopup();
                        return;
                    }
                    // Popup position
                    var $popup;
                    var apply_popup_position = function() {
                        var popup_width = $popup.outerWidth();
                        // Point is the center of the selection - relative to $parent not the element
                        var $parent = $textarea.parent(),
                            container_offset = $parent.offset(),
                            editor_offset = $(c4wwysiwygeditor.getElement()).offset();
                        var left = rect.left + parseInt(rect.width / 2) - parseInt(popup_width / 2) + editor_offset.left - container_offset.left;
                        var top = rect.top + rect.height + editor_offset.top - container_offset.top;
                        popup_position($popup, $parent, left, top);
                    };
                    // Open popup
                    $popup = $(c4wwysiwygeditor.openPopup());
                    // if wrong popup -> close and open a new one
                    if (!$popup.hasClass('c4wwysiwyg-popuphover') || (!$popup.data('c4wwysiwyg-newpopup')) != (!$special_popup))
                        $popup = $(c4wwysiwygeditor.closePopup().openPopup());
                    if (autocomplete)
                        $popup.show();
                    else if (!$popup.hasClass('c4wwysiwyg-popup')) {
                        // add classes + buttons
                        $popup.addClass('c4wwysiwyg-popup c4wwysiwyg-popuphover');
                        if ($special_popup)
                            $popup.empty().append($special_popup).data('c4wwysiwyg-newpopup', true);
                        else
                            add_buttons_to_toolbar($popup, true,
                                function() {
                                    return $popup.empty();
                                },
                                apply_popup_position);
                    }
                    // Apply position
                    apply_popup_position();
                },
                onOpenpopup: function() {
                    add_class_active();
                },
                onClosepopup: function() {
                    autocomplete = null;
                    remove_class_active();
                },
                hijackContextmenu: (toolbar_position == 'selection'),
                readOnly: !!$textarea.prop('readonly')
            };
            if ($placeholder) {
                option.onPlaceholder = function(visible) {
                    if (visible)
                        $placeholder.show();
                    else
                        $placeholder.hide();
                };
            }
            checkAllowedDomains();
            var c4wwysiwygeditor = c4wwysiwyg(option);
            return c4wwysiwygeditor;
        }


        // Create a container if it does not exist yet
        var $container = $textarea.closest('.c4wwysiwyg-container');
        
        if ($container.length == 0) {
            $container = $('<div/>').addClass('c4wwysiwyg-container').attr('id', 'c4wwysiwyg-container');
            if (classes)
                $container.addClass(classes);
            $textarea.wrap($container);
            $container = $textarea.closest('.c4wwysiwyg-container');
        }

        // Create the placeholder if it does not exist yet and we want one
        var $wrapper = $textarea.closest('.c4wwysiwyg-wrapper');
        if (placeholder && $wrapper.length == 0) {
            $wrapper = $('<div/>').addClass('c4wwysiwyg-wrapper');
            $textarea.wrap($wrapper);
            $wrapper = $textarea.closest('.c4wwysiwyg-wrapper');
        }
        var $placeholder = null;
        if ($wrapper.length != 0)
            $placeholder = $wrapper.find('.c4wwysiwyg-placeholder');
        if (placeholder && (!$placeholder || $placeholder.length == 0)) {
            $placeholder = $('<div/>').addClass('c4wwysiwyg-placeholder')
                .html(placeholder)
                .hide();
            $wrapper.prepend($placeholder);
        }

        // Create the WYSIWYG Editor
        var $editor = $container.find('.change4win-wysiwyg-editor');
        if ($editor.length == 0)
            $editor = null;
        var c4wwysiwygeditor = create_c4wwysiwyg($textarea, $editor, $container, $placeholder);
        if (c4wwysiwygeditor.legacy) {
            if ($editor)
                $editor.hide();
            if ($placeholder)
                $placeholder.hide();
            var $textarea = $(c4wwysiwygeditor.getElement());
            $textarea.show().addClass('c4wwysiwyg-textarea');
            if ($textarea.is(':visible')) // inside the DOM
                $textarea.width($container.width() - ($textarea.outerWidth() - $textarea.width()));
        } else {
            if (!$editor)
                $(c4wwysiwygeditor.getElement()).addClass('change4win-wysiwyg-editor');
            $(c4wwysiwygeditor.getElement()).attr('id', 'change4win-wysiwyg-editor');

            // Clicking the placeholder -> focus editor - fixes IE6-IE8
            $wrapper.click(function() {
                c4wwysiwygeditor.getElement().focus();
            });

            // Support ':active'-class
            var remove_active_timeout = null,
                initialize_toolbar = null;
            var add_class_active = function() {
                if (remove_active_timeout)
                    clearTimeout(remove_active_timeout);
                remove_active_timeout = null;
                if (initialize_toolbar) {
                    initialize_toolbar();
                    initialize_toolbar = null;
                }
                $container.addClass('c4wwysiwyg-active');
                $container.find('.c4wwysiwyg-toolbar-focus').slideDown(200);
            };
            var imgset = {
                unsetimgtselection: function(){
                  $('img').removeClass('c4wwysiwyg-selected-img'); 
                  $('.resize-container .resize-handle').remove();
                  $('.resize-container img').unwrap(); 
                  var mtoolbars = document.getElementsByClassName('c4wwysiwyg-toolbar-icon'), i;
                            for (var i = 0; i < mtoolbars.length; i ++) {
                                mtoolbars[i].classList.remove("c4wwysiwyg-disabled");
                  }
                
              }
            };
            var remove_class_active = function() {
                 imgset.unsetimgtselection();
                if (remove_active_timeout || document.activeElement == c4wwysiwygeditor.getElement())
                    return;
                remove_active_timeout = setTimeout(function() {
                    remove_active_timeout = null;
                    $container.removeClass('c4wwysiwyg-active');
                    if ($.trim(c4wwysiwygeditor.getHTML().replace(/<br\s*[\/]?>/gi, '')).length == 0)
                        $container.find('.c4wwysiwyg-toolbar-focus').slideUp(200);
                }, 100);
            };
            document.addEventListener('mouseup', function (e) {
                var container = document.getElementById('c4wwysiwyg-container');
                if (!container.contains(e.target)) {
                    remove_class_active();
                }
            }.bind(this));
           // $(c4wwysiwygeditor.getElement()).blur(remove_class_active);
           // $(c4wwysiwygeditor.getElement()).focus(add_class_active).blur(remove_class_active);
            $textarea.closest('form').on('reset', remove_class_active);

            // Hotkey+Commands-List
            var commands = {};
            $.each(toolbar_buttons, function(key, value) {
                if (!value || !value.hotkey)
                    return;
                var toolbar_handler = get_toolbar_handler(key);
                if (!toolbar_handler)
                    return;
                hotkeys[value.hotkey.toLowerCase()] = toolbar_handler;
                commands[key] = toolbar_handler;
            });

            // Toolbar on top or bottom
            if (!$.isEmptyObject(toolbar_buttons) && toolbar_position != 'selection') {
                var toolbar_top = $.inArray('top', toolbar_position.split('-')) != -1;
                var toolbar_focus = $.inArray('focus', toolbar_position.split('-')) != -1;
                // Callback to create toolbar on demand
                var create_toolbar = function() {
                    var $toolbar = $('<div/>').addClass('c4wwysiwyg-toolbar').addClass(toolbar_top ? 'c4wwysiwyg-toolbar-top' : 'c4wwysiwyg-toolbar-bottom');
                    if (toolbar_focus)
                        $toolbar.hide().addClass('c4wwysiwyg-toolbar-focus');
                    // Add buttons to the toolbar
                    add_buttons_to_toolbar($toolbar, false,
                        function() {
                            // Open a popup from the toolbar
                            var $popup = $(c4wwysiwygeditor.openPopup());
                            // if wrong popup -> create a new one
                            if ($popup.hasClass('c4wwysiwyg-popup') && $popup.hasClass('c4wwysiwyg-popuphover'))
                                $popup = $(c4wwysiwygeditor.closePopup().openPopup());
                            if (!$popup.hasClass('c4wwysiwyg-popup'))
                                // add classes + content
                                $popup.addClass('c4wwysiwyg-popup');
                            return $popup;
                        },
                        function($popup, target, overwrite_offset) {
                            // Popup position
                            var $button = $(target);
                            var popup_width = $popup.outerWidth();
                            // Point is the top/bottom-center of the button
                            var left = $button.offset().left - $container.offset().left + parseInt($button.width() / 2) - parseInt(popup_width / 2);
                            var top = $button.offset().top - $container.offset().top;
                            if (toolbar_top)
                                top += $button.outerHeight();
                            else
                                top -= $popup.outerHeight();
                            if (overwrite_offset) {
                                left = overwrite_offset.left;
                                top = overwrite_offset.top;
                            }
                            popup_position($popup, $container, left, top);
                        });
                    if (toolbar_top)
                        $container.prepend($toolbar);
                    else
                        $container.append($toolbar);
                };
                if (!toolbar_focus)
                    create_toolbar();
                else
                    initialize_toolbar = create_toolbar;
            }
        }

        // Export userdata
        return {
            c4wwysiwygeditor: c4wwysiwygeditor,
            $container: $container
        };
    };


    // jQuery Interface
    $.fn.c4wwysiwyg = function(option, param) {
        if (!option || typeof(option) === 'object') {
            option = $.extend({}, option);
            return this.each(function() {
                var $that = $(this);
                // Already an editor
                if ($that.data('change4wineditor'))
                    return;
                // Two modes: toolbar on top and on bottom
                var classes = option['class'],
                    placeholder = option.placeholder || $that.prop('placeholder'),
                    toolbar_position = option.toolbar || 'top',
                    toolbar_buttons = option.buttons || {},
                    toolbar_submit = { title: "Submit", image: "\uf00c" },
                    toolbar_unlink = { class: 'c4wwysiwyg-unlink', image: 'Unlink' },
                    label_selectImage = option.selectImage,
                    placeholder_url = option.placeholderUrl || null,
                    placeholder_embed = option.placeholderEmbed || null,
                    max_imagesize = option.maxImageWidth || null,
                    filter_imageType = option.filterImageType || '^image/',
                    on_imageupload = option.onImageUpload || null,
                    force_imageupload = option.useImageUpload && on_imageupload,
                    video_from_url = option.videoFromUrl || null,
                    on_keydown = option.onKeyDown || null,
                    on_keypress = option.onKeyPress || null,
                    on_keyup = option.onKeyUp || null,
                    on_autocomplete = option.onAutocomplete || null;
                // Create the WYSIWYG Editor
                var data = create_editor($that, classes, placeholder, toolbar_position, toolbar_buttons, toolbar_submit, toolbar_unlink, label_selectImage,
                    placeholder_url, placeholder_embed, max_imagesize, filter_imageType, on_imageupload, force_imageupload, video_from_url,
                    on_keydown, on_keypress, on_keyup, on_autocomplete);
                $that.data('change4wineditor', data);
            });
        } else if (this.length == 1) {
            var data = this.data('change4wineditor');
            if (!data)
                return this;
            if (option == 'getparent')
                return data.$container;
            if (option == 'options')
                return data.c4wwysiwygeditor;
        }
        return this;
    };
});

function testfunc(){
    alert("In development stage");
}
var resizeableImage = function(image_target) {

  var $container,
      orig_src = new Image(),
      image_target = $(image_target).get(0),
      event_state = {},
      constrain = false,
      min_width = 60, // Change as required
      min_height = 60,
      max_width = 800, // Change as required
      max_height = 900,
      resize_canvas = document.createElement('canvas');

  init = function(){

    // When resizing, we will always use this copy of the original as the base
   
    orig_src.src=image_target.src;

    //image toolbar menu for testing
  popmenu = function(){
    var menu = '<div class="resize-handle c4w-imgtoolbar c4w-imgtoolbar">'+
    '<a class="c4wwysiwyg-toolbar-icon c4wimgtoolbar-icon" href="javascript:void(0);" title="Settings" onclick="testfunc();"><i class="fa fa-cog"></i></a>'+
    '<a class="c4wwysiwyg-toolbar-icon c4wimgtoolbar-icon" href="javascript:void(0);" title="Align" onclick="testfunc();"><i class="fa fa-align-left"></i></a>'+
    '<a class="c4wwysiwyg-toolbar-icon c4wimgtoolbar-icon" href="javascript:void(0);" title="Link" onclick="testfunc();"><i class="fa fa-link"></i></a>'+
    '<a class="c4wwysiwyg-toolbar-icon c4wimgtoolbar-icon" href="javascript:void(0);" title="Delete" onclick="testfunc();"><i class="fa fa-trash-o"></i></a></div>';
    return menu;
  }
    // Wrap the image with the container and add resize handles
    $(image_target).wrap('<div class="resize-container"></div>')
    .before('<span class="resize-handle resize-handle-nw"></span>')
    .before('<span class="resize-handle resize-handle-ne"></span>')
    .after(popmenu)
    .after('<span class="resize-handle resize-handle-se"></span>')
    .after('<span class="resize-handle resize-handle-sw"></span>');

    $container =  $(image_target).parent('.resize-container');
    $container.on('mousedown touchstart', '.resize-handle', startResize);
 

  };

  startResize = function(e){
    e.preventDefault();
    e.stopPropagation();
    saveEventState(e);
    //popmenu();
    $(document).on('mousemove touchmove', resizing);
    $(document).on('mouseup touchend', endResize);
  };

  endResize = function(e){
    e.preventDefault();
    $(document).off('mouseup touchend', endResize);
    $(document).off('mousemove touchmove', resizing);
    e.stopPropagation();
  };

  saveEventState = function(e){

    event_state.container_width = $container.width();
    event_state.container_height = $container.height();
    event_state.container_left = $container.offset().left; 
    event_state.container_top = $container.offset().top;
    event_state.mouse_x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft(); 
    event_state.mouse_y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
    

    if(typeof e.originalEvent.touches !== 'undefined'){
        event_state.touches = [];
        $.each(e.originalEvent.touches, function(i, ob){
          event_state.touches[i] = {};
          event_state.touches[i].clientX = 0+ob.clientX;
          event_state.touches[i].clientY = 0+ob.clientY;
        });
    }
    event_state.evnt = e;
  };


function unsetimgtselection(){
      $('.resize-container img').removeClass('c4wwysiwyg-selected-img'); 
      $('.resize-container .resize-handle').remove();
      $('.resize-container img').unwrap(); 
      /*
        var el = document.querySelector('div');
    // get the element's parent node
    var parent = el.parentNode;
    // move all children out of the element
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    // remove the empty element
    parent.removeChild(el);
      */  
    };

  resizing = function(e){
    var mouse={},width,height,left,top,offset=$container.offset();
    mouse.x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft(); 
    mouse.y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
    

    if( $(event_state.evnt.target).hasClass('resize-handle-se') ){
      width = mouse.x - event_state.container_left;
      height = mouse.y  - event_state.container_top;
      left = event_state.container_left;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-sw') ){
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = mouse.y  - event_state.container_top;
      left = mouse.x;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-nw') ){
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = mouse.x;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    } else if($(event_state.evnt.target).hasClass('resize-handle-ne') ){
      width = mouse.x - event_state.container_left;
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = event_state.container_left;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    }
    

    if(constrain || e.shiftKey){
      height = width / orig_src.width * orig_src.height;
    }

    if(width > min_width && height > min_height && width < max_width && height < max_height){
      resizeImage(width, height);  
     //$container.offset({'left': left, 'top': top});
    }
  }

  resizeImage = function(width, height){
    resize_canvas.width = width;
    resize_canvas.height = height;
    $(image_target).attr('width', resize_canvas.width);
    resize_canvas.getContext('2d').drawImage(orig_src, 0, 0, width, height);
    return;
    //$(image_target).attr('src', resize_canvas.toDataURL("image/png"));  
  };

  init();
};
var gridselect = {
    on_grid_selector_hover: function(element)  
    {
        var x = element.getAttribute("data-x");
        var y = element.getAttribute("data-y");
        
        gridselect.grid_choser_parameters = {x:x, y:y};
        
        $('#grid_chooser').children('div').each(function () 
        {
            if(this.dataset.x <= gridselect.grid_choser_parameters.x 
                    && this.dataset.y <= gridselect.grid_choser_parameters.y)
                this.classList.add("chosen");
            else
                this.classList.remove("chosen");
        });
    },
    pastehtml: function(html){
        var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // non-standard and not supported in all browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            
            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
    },
    saveSelection: function(containerNode) {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (sel.rangeCount > 0)
                return sel.getRangeAt(0);
        } else if (document.selection) {
            var sel = document.selection;
            return sel.createRange();
        }
        return null;
    },
    restoreSelection: function(containerNode, savedSel) {
        if (!savedSel)
            return;
        if (window.getSelection) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSel);
        } else if (document.selection) {
            savedSel.select();
        }
    },
    on_grid_selector_click: function(element)
    {

        gridselect.saveSelection(document.getElementById("change4win-wysiwyg-editor"));

         var x = element.getAttribute("data-x");
         var y = element.getAttribute("data-y");
        
        var table = '<table style="table-layout:fixed">';
        for(var i=0; i<x; i++)
        {
            table += "<tr>";
            for(var j=0; j<y; j++)
            {
                table += "<td id='grid_configurator_cell_"+i+j+"' onclick='$(this).toggleClass(\"selected\")'></td>";
            }
            table += "</tr>";
        }
        table += "</table>";

        gridselect.pastehtml(table);
        $('.c4wwysiwyg-popup').html('');
        $('.c4wwysiwyg-popup').remove();

        
    }
}