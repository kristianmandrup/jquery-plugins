/*!
 * NETEYE Touch-Gallery jQuery Plugin
 * Optimized For Touch Devices 
 *
 * Copyright (c) 2010 NETEYE GmbH
 * Licensed under the MIT license
 *
 * Author: Felix Gnass [fgnass at neteye dot de]
 * Optimized Devices By: Andrew Winter [awinter at sbstrm dot co dot jp]
 * Version: @{VERSION}
 */
(function($) {
	
    var mobileSafari = /iPhone OS [^5]/.test(navigator.userAgent);
	
    $.fn.touchGallery = function(opts) {
        opts = $.extend({}, $.fn.touchGallery.defaults, opts);
        var thumbs = this;
        if(thumbs.length){
            var bindTo = 'click';
            if( window.Touch ){
                this.die('touchstart');
                this.live('touchstart', function(ev) {
                    $.fn.touchGallery.touchmoved = false
                });
                this.die('touchmove');
                this.live('touchmove', function(ev) {
                    $.fn.touchGallery.touchmoved = true
                });
                bindTo = 'touchend';
            }
            this.die(bindTo);
            this.live('click', function(ev) {
                ev.preventDefault();
                var clickedThumb = $(this);
                if (!$('#galleryViewport').is('*') && !$.fn.touchGallery.touchmoved) {
                    openGallery(thumbs, clickedThumb, opts);
                }
            });
        }
        return this;
    };
	
    /**
     * Default options.
     */
    $.fn.touchGallery.defaults = {
        getSource: function() {
            return this.attr('href');
        }
    };
	
	
    /**
     * This variable is used to prevent the gallery from opening if 
     * the users thouch event results in a scroll.
     */
    $.fn.touchGallery.touchmoved = false;

    // ==========================================================================================
    // Private functions
    // ==========================================================================================
		
    /**
     * Opens the gallery and creates DOM elements to actually show the gallery.
     */
    function openGallery(thumbs, clickedThumb, opts) {
        insertShade();
        var index = thumbs.index(clickedThumb);
               
        var viewport = fitToView(preventTouch($('<div id="galleryViewport">').css({
            position: 'fixed',
            top: 0,
            left: 0,
            overflow:'hidden'
        }).appendTo('body')));
		
        var stripe = $('<div id="galleryStripe">').css({
            position: 'absolute',
            height: '100%',
            top: 0,
            left: (-index * getInnerWidth()) + 'px'
        }).width(thumbs.length * getInnerWidth()).appendTo(viewport);
        addMenu(stripe, viewport, thumbs, index);
		
        setupEventListeners(stripe, getInnerWidth(), index, thumbs, opts);
		
        $(window).bind('orientationchange.gallery', function() {
            fitToView(viewport);
            stripe.find('img').each(centerImage);
        });
		
        createImagePage(thumbs, index, opts).appendTo(stripe);
        stripe.addClass('ready');
        loadSurroundingImages(thumbs, index, opts);
    }
	
    function hideGallery(stripe) {
        if (stripe.is('.ready') && !stripe.is('.panning')) {
            $('#galleryShade').remove();
            var page = stripe.find('.galleryPage').eq(stripe.data('galleryIndex'));
            var thumb = page.data('thumb');
            stripe.add(window).add(document).unbind('.gallery');
            page.find('img').remove();
            $('#galleryMenuTop').remove();
            $('#galleryMenuBottom').remove();
            $('#galleryViewport').remove();
        }
    }

    /**
     * Inserts top and bottom menu items for touch devices.
     */	
    function addMenu(stripe, viewport, thumbs, index) {
        var menuTop = $('<div id="galleryMenuTop">').css({
            top:0, 
            left:0, 
            background:'#000',
            position:(mobileSafari) ? 'absolute' :'fixed', 
            width:'100%', 
            height:'50px',
            'z-index':'9999',
            'border-bottom':'1px solid #666666',
            opacity:0.8
        });
        
        menuTop.append($('<a id="flickPrev">').css({
            display:'block',
            color:'#FFF',
            width:'33%',
            margin:'0 0 0 -1px',
            'float':'left',
            'font-size':'16px',
            'line-height':'50px',
            'text-align':'center',
            'text-decoration':'none',
            'vertical-align':'middle',
            cursor:'pointer'
        }).text('PREV'));
        
        menuTop.append($('<a>').css({
            display:'block',
            color:'#FFF',
            width:'33%',
            'float':'left',
            margin:'0 0 0 -1px',
            'border-right':'1px solid #FFF',
            'border-left':'1px solid #FFF',
            'font-size':'16px',
            'line-height':'50px',
            'text-align':'center',
            'text-decoration':'none',
            'vertical-align':'middle',
            cursor:'pointer'
        }).text('CLOSE')
            .bind('click', function(){
                hideGallery(stripe);
            })
            .bind('touchstart', function(){
                $(this).css({
                    background:'#FFF',
                    color:'#000'
                });
            })
            .bind('touchend', function(){
                $(this).css({
                    background:'#000',
                    color:'#FFF'
                });
                hideGallery(stripe);
            }));

        menuTop.append($('<a id="flickNext">').css({
            display:'block',
            color:'#FFF',
            width:'33%',
            'float':'left',
            'font-size':'16px',
            'line-height':'50px',
            'text-align':'center',
            'text-decoration':'none',
            'vertical-align':'middle',
            cursor:'pointer'
        }).text('NEXT'));
        
        var menuBottom = $('<div id="galleryMenuBottom">').css({
            bottom:0, 
            left:0, 
            background:'#000',
            position:(mobileSafari) ? 'absolute' :'fixed', 
            width:'100%', 
            height:'40px',
            color:'#FFF',
            'font-size':'16px',
            'line-height':'40px',
            'text-align':'center',
            'z-index':'9999',
            'border-top':'1px solid #666666',
            opacity:0.8
        }).text((index+1)+' of '+thumbs.length);
        
        viewport.append(menuTop);
        viewport.append(menuBottom);
        showMenu();
    }
    
    var menuFadeTimer;
    function showMenu(){
        if(menuFadeTimer){
            clearTimeout(menuFadeTimer);
        }
        $('#galleryMenuTop').fadeIn(0);
        $('#galleryMenuBottom').fadeIn(0);
        menuFadeTimer = setTimeout(function(){
            $('#galleryMenuTop').fadeOut(200);
            $('#galleryMenuBottom').fadeOut(200);
        },2000);
    }
	
    /**
     * Inserts a black DIV before the given target element and performs an opacity 
     * transition form 0 to 1.
     */
    function insertShade(target, onFinish) {
        var el = $('<div id="galleryShade">').css({
            top:0, 
            left:0, 
            background:'#000', 
            opacity:0.9
        });
        if (mobileSafari) {
            // Make the shade bigger so that it shadows the surface upon rotation
            var l = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1) + Math.max(getScrollLeft(), getScrollTop()) + 100;
            el.css({
                position: 'absolute'
            }).width(l).height(l);
        } else {
            el.css({
                position: 'fixed', 
                width: '100%', 
                height: '100%'
            });
        }
        el.appendTo('body');
    }
	
    /**
     * Scales and centers an element according to the dimensions of the given image.
     * The first argument is ignored, it's just there so that the function can be used with .each()
     */
    function centerImage(i, img, el) {
        el = el || $(img);
        if (!img.naturalWidth) {
            //Work-around for Opera which doesn't support naturalWidth/Height. This works because
            //the function is invoked once for each image before it is scaled.
            img.naturalWidth = img.width;
            img.naturalHeight = img.height;
        }
        var s = Math.min(getViewportScale(), Math.min(getInnerHeight()/img.naturalHeight, getInnerWidth()/img.naturalWidth));
        el.css({
            top: Math.round((getInnerHeight() - img.naturalHeight * s) / 2) +  'px',
            left: Math.round((getInnerWidth() - img.naturalWidth * s) / 2) +  'px'
        }).width(Math.round(img.naturalWidth * s));
        return el;
    }
	
    function getPage(i) {
        return $('#galleryStripe #galleryPageID'+i);
    }
	
    function getThumb(i) {
        return getPage(i).data('thumb');
    }
	
    function loadSurroundingImages(thumbs, i, opts) {
        if(thumbs.length >= i+1){
            page = createImagePage(thumbs, i+1, opts);
            if(page != null) page.insertAfter(getPage(i));
        }
        if(i > 0){
            page = createImagePage(thumbs, i-1, opts);
            if(page != null) page.insertAfter(getPage(i));
        }
        
        page = getPage(i+3);
        if(page){
            page.remove();
        }
        page = getPage(i-3);
        if(page){
            page.remove();
        }
    }
    
    function createImagePage(thumbs, i, opts){
        var thumb = thumbs.eq(i);
        if(!getPage(i).is('div') && thumb.is('a')){
            var page = $('<div>', {
                'id':'galleryPageID'+i
                }).addClass('galleryPage').css({
                display: 'block',
                position: 'absolute',
                left: i * getInnerWidth() + 'px',
                overflow: 'hidden'              
            }).width(getInnerWidth()).height(getInnerHeight()).data('thumb', thumb).transform(false);

            page.activity({
                color: '#fff'
            });

            var img = new Image();

            img.onload = function() {
                var $this = $(this).css({
                    position: 'absolute', 
                    display: 'block'
                }).transform(false);
                centerImage(i, this, $this).appendTo(page.activity(false));
                page.trigger('loaded');
            };

            img.src = $.proxy(opts.getSource, thumb)();
            return page;
        }
        return null;
    }
	
    /**
     * Registers event listeners to enable flicking through the images.
     */
    function setupEventListeners(el, pageWidth, currentIndex, thumbs, opts) {
        var max = thumbs.length-1;
        var scale = getViewportScale();
        var xOffset = parseInt(el.css('left'), 10);
        el.data('galleryIndex', currentIndex);
		
        function flick(dir) {
            var i = el.data('galleryIndex');
            
            makeVisible(getThumb(i));
            i = Math.max(0, Math.min(i + dir, max));
            el.data('galleryIndex', i);
            $('#galleryMenuBottom').text((i+1)+' of '+(max+1));
            
            loadSurroundingImages(thumbs, i, opts);

            if(i == 0){
                $('#flickPrev').css({
                    'visibility':'hidden'
                });
            }else{
                $('#flickPrev').css({
                    'visibility':'visible'
                });
            }
            
            if(i == max){
                $('#flickNext').css({
                    'visibility':'hidden'
                });
            }else{
                $('#flickNext').css({
                    'visibility':'visible'
                });
            }

            if ($.fn.transform.supported) {
                var x = -i * pageWidth - xOffset;
                if (x != el.transform().translate.x) {
                    el.addClass('panning').transformTransition({
                        translate: {
                            x: x
                        }, 
                        onFinish: function() {
                            this.removeClass('panning');
                        }
                    });
                }
            } else {
                el.css('left', -i * pageWidth + 'px');
            }
        }
        
        $('#flickPrev')
        .bind('click', function(){
            flick(-1);
            showMenu();
        })
        .bind('touchstart', function(){
            $(this).css({
                background:'#FFF',
                color:'#000'
            });
        })
        .bind('touchend', function(){
            $(this).css({
                background:'#000',
                color:'#FFF'
            });
            flick(-1);
            showMenu();
        })
        
        $('#flickNext')
        .bind('click', function(){
            flick(1);
            showMenu();
        })
        .bind('touchstart', function(){
            $(this).css({
                background:'#FFF',
                color:'#000'
            });
        })
        .bind('touchend', function(){
            $(this).css({
                background:'#000',
                color:'#FFF'
            });
            flick(1);
            showMenu();
        })
		
        $(document).bind('keydown.gallery', function(event) {
            if (event.keyCode == 37) {
                el.trigger('prev');
                return false;
            } else if (event.keyCode == 39) {
                el.trigger('next');
                return false;
            }
            if (event.keyCode == 27 || event.keyCode == 32) {
                hideGallery(el);
                return false;
            }
            return true;
        });
		
        el.bind('touchstart', function() {
            $(this).data('pan', {
                startX: event.targetTouches[0].screenX,
                lastX:event.targetTouches[0].screenX,
                startTime: new Date().getTime(),
                startOffset: $(this).transform().translate.x,
                distance: function() {
                    return Math.round(scale * (this.startX - this.lastX));
                },
                delta: function() {
                    var x = event.targetTouches[0].screenX;
                    this.dir = this.lastX > x ? 1 : -1;
                    var delta = Math.round(scale * (this.lastX - x));
                    this.lastX = x;
                    return delta;
                },
                duration: function() {
                    return new Date().getTime() - this.startTime;
                }
            });
            showMenu();
            return false;
        })
        .bind('touchmove', function() {
            var pan = $(this).data('pan');
            $(this).transform({
                translateBy: {
                    x: -pan.delta()
                }
            });
            return false;
        })
        .bind('touchend', function() {
            var pan = $(this).data('pan');
            if (pan.distance() === 0 && pan.duration() < 500) {
                $(event.target).trigger('click');
            } else {
                flick(pan.dir);
            }
            return false;
        })
        .bind('prev', function() {
            flick(-1);
        })
        .bind('next', function() {
            flick(1);
        })
        .bind('click', function(){
            showMenu();
        })
    }
	
    /**
     * Sets position and size of the given jQuery object to match the current viewport dimensions.
     */
    function fitToView(el) {
        if (mobileSafari) {
            el.css({
                top: getScrollTop() + 'px', 
                left: getScrollLeft() + 'px'
            });
        }
        return el.width(getInnerWidth()).height(getInnerHeight());
    }
	
    /**
     * Returns the reciprocal of the current zoom-factor.
     * @REVISIT Use screen.width / screen.availWidth instead?
     */
    function getViewportScale() {
        return getInnerWidth() / document.documentElement.clientWidth;
    }
	
    /**
     * Returns a window property with fallback to a property on the 
     * documentElement in Internet Explorer.
     */
    function getWindowProp(name, ie) {
        if (window[name] !== undefined) {
            return window[name];
        }
        var d = document.documentElement;
        if (d && d[ie]) {
            return d[ie];
        }
        return document.body[ie];
    }
	
    function getScrollTop() {
        return getWindowProp('pageYOffset', 'scrollTop');
    }
	
    function getScrollLeft() {
        return getWindowProp('pageXOffset', 'scrollLeft');
    }
	
    function getInnerWidth() {
        return getWindowProp('innerWidth', 'clientWidth');
    }
	
    function getInnerHeight() {
        return getWindowProp('innerHeight', 'clientHeight');
    }
	
    function makeVisible(el) {
        return el.css('visibility', 'visible');
    }
	
    function makeInvisible(el) {
        return el.css('visibility', 'hidden');
    }
	
    function bounds(el) {
        var e = el.get(0);
        if (e && e.getBoundingClientRect) {
            return e.getBoundingClientRect();
        }
        return $.extend({
            width: el.width(), 
            height: el.height()
            }, el.offset());
    }
	
    function preventTouch(el) {
        return el.bind('touchstart', function() {
            return false;
        });
    }

})(jQuery);