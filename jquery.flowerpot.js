/**
 * The Flowerpot
 *
 * A jQuery plugin to overlay images, inline content, and more.
 *
 * @package     The Flowerpot
 * @author      Matthew Riley MacPherson
 * @copyright   Copyright (c) 2009, Matthew Riley MacPherson
 * @license     New BSD License (http://www.opensource.org/licenses/bsd-license.php)
 * @link        http://flowerpot.googlecode.com/
 * @since       Version 0.1
 */
// HTML plants in an overlayed pot!

// The Flowerpot object, where default settings are stored.
// Any of these settings can be overwritten, though it's
// recommended that only the commented settings be changed.
function fp_o() {
	this.animation_speed = 500; // animation time in ms
	this.animation_multiplier = 3; // set to 1 to disable the shiftKey animation slowdown
	this.aux_opacity = 0.75; // opacity of the other backgrounds
	this.close_img = 'flowerpot-close.png';
	if ($.browser.msie && $.browser.version < 7)
		this.close_img = 'flowerpot-close-ie6.png';
	this.dom_img = 0;
	this.gallery_index = 0;
	this.gallery_size = 0;
	this.images_dir = 'images/'; // path to your images folder -- can absolute or relative
	this.locale = {
		'close': 'Close', // alt text for close image (should be text, not html)
		'loading': 'Loading... "Esc" to close', // html that appears when the image is loading
		'next': 'Next', // html inside the gallery "next" link
		'previous': 'Previous' // html inside the gallery "previous" link
	};
	this.overlay = false;
	this.overlay_opacity = 0.5; // opacity of the overlay background
	this.ready = false;
	this.slow_animation = false;
	this.type = 'image';
}

(function($) {
	
	// --------------------------------------------------------------------
	
	/**
	 * Resize the overlay in IE 6
	 *
	 * When the viewport size changes, the overlay size needs to be
	 * recalculated in JavaScript for IE 6
	 *
	 * @access	public
	 * @return	void
	 */
	fp_o.prototype.ie6_resize_overlay = function() {
		$('#flowerpotjs-overlay').css('height', $(document).height());
		$('#flowerpotjs-overlay').css('width', $(window).width());
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Load an image
	 *
	 * Load an image for The Flowerpot into the DOM and setup an event
	 * listener to calculate the size after it loads.
	 *
	 * @access	public
	 * @param	string		selector		jQuery selector of element to resize
	 * @return	void
	 */
	fp_o.prototype.image = function(selector) {
		fp.dom_img = new Image();
		$(fp.dom_img).load(function() {
			fp.resize(selector);
		});
		fp.dom_img.src = $(selector).attr('src');
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Initialize The Flowerpot
	 *
	 * Setup event listeners, CSS, and HTML.
	 *
	 * @access	public
	 * @param	array		options		array of options to override defaults
	 * @return	void
	 */
	fp_o.prototype.init = function(options) {
		fp.locale['loading'] = fp.locale['loading'];
		var flowerpot_html = '<div id="flowerpotjs-overlay" style="display: none;"><span style="display: none;">' + fp.locale['loading'] + '</span></div><div id="flowerpotjs-contents" style="display: none;"></div>';
		$('body').append(flowerpot_html);
		$('#flowerpotjs-overlay').css({opacity: 0});
		$('#flowerpotjs-overlay span').css({'-moz-border-radius': '3px', '-webkit-border-radius': '2px'});
		
		if (typeof(options) != 'object')
			options = new Array;
		
		// Click Events
		$('#flowerpotjs-close,#flowerpotjs-overlay').live('click', function(event) { // Overlay or close link
			if (event.shiftKey) fp.slow_animation = true;
			if (event.button == 0 && fp.ready) {
				fp.hide();
				event.preventDefault();
			}
			fp.slow_animation = false;
		});
		$('.flowerpot').live('click', function(event) {
			if (fp.overlay) return;
			if (event.shiftKey) fp.slow_animation = true;
			if (event.button == 0) {
				rel = $(this).attr('rel');
				if (rel.match(/div\[(.[^ ]*)\]/i)) { // Flowerpot inline div
					var id = rel.replace(/.*div\[(.[^ ]*)\].*/i, '$1');
					var div_size = {};
					if (rel.match(/height\[(.[^ ]*)\]/i))
						div_size['height'] = rel.replace(/.*height\[(.[^ ]*)\].*/i, '$1');
					if (rel.match(/width\[(.[^ ]*)\]/i))
						div_size['width'] = rel.replace(/.*width\[(.[^ ]*)\].*/i, '$1');
					$(this).flowerpot({div_id: id, type: 'div', size: div_size});
				} else if (rel.match(/gallery\[(.[^ ]*)\]/i)) { // Flowerpot image gallery
					fp.gallery_index = $('.flowerpot[rel=' + rel + ']').index(this);
					fp.gallery_size = $('.flowerpot[rel=' + rel + ']').length;
					$(this).flowerpot({gallery: rel, type: 'gallery'});
				} else { // Single Flowerpot image
					$(this).flowerpot();
				}
				event.preventDefault();
			}
			fp.slow_animation = false;
		});
			// Gallery controls
			$('#flowerpotjs-prev-link').live('click', function(event) { // Previous image
				if (event.shiftKey) fp.slow_animation = true;
				rel = $(this).attr('rel');
				if (fp.ready && rel.match(/gallery\[(.[^ ]*)\]/i)) {
					if (event.button == 0) {
						fp.gallery_move('prev');
					}
				}
				fp.slow_animation = false;
				event.preventDefault();
			});
			$('#flowerpotjs-next-link').live('click', function(event) { // Next image
				if (event.shiftKey) fp.slow_animation = true;
				rel = $(this).attr('rel');
				if (fp.ready && rel.match(/gallery\[(.[^ ]*)\]/i)) {
					if (event.button == 0) {
						fp.gallery_move('next');
					}
				}
				fp.slow_animation = false;
				event.preventDefault();
			});
		
		// Keyboard Events
		$(document).keydown(function(event) {
			if (event.shiftKey) fp.slow_animation = true; // Little OS X-like Easter Egg ^_^
			switch (event.keyCode) {
				case 27: // Esc
					if (fp.ready) {
						fp.hide();
					}
					if (fp.overlay) {
						fp.dom_img = 0;
						fp.hide();
					}
					break;
				case 35: // End
					if (fp.ready && fp.gallery_size > 0) {
						fp.gallery_move(fp.gallery_size - 1);
						event.preventDefault();
					}
					break;
				case 36: // Home
					if (fp.ready && fp.gallery_size > 0) {
						fp.gallery_move(0);
						event.preventDefault();
					}
					break;
				case 37: // Left Arrow
					if (fp.ready && fp.gallery_size > 0) {
						fp.gallery_move('prev');
						event.preventDefault();
					}
					break;
				case 39: // Right Arrow
					if (fp.ready && fp.gallery_size > 0) {
						fp.gallery_move('next');
						event.preventDefault();
					}
					break;
				default:
					break;
			}
			fp.slow_animation = false;
		});
		
		// Resize Events
		$(window).resize(function(event) {
			if (fp.ready) {
				if (fp.type == 'image' || fp.type == 'gallery')
					fp.resize('#flowerpotjs-image');
				else if ($.browser.msie && $.browser.version < 7)
					fp.ie6_resize_overlay();
				event.preventDefault();
			}
		});
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Move the gallery index
	 *
	 * Load a photo from the current gallery based on the index
	 * number supplied.
	 *
	 * @access	public
	 * @param	integer		index		photo index in the gallery array
	 * @return	void
	 */
	fp_o.prototype.gallery_move = function(index) {
		if (fp.gallery_index === index) return false;
		$('#flowerpotjs-contents').hide();
		fp.ready = false;
		if (typeof(index) == 'number') {
			fp.gallery_index = index;
		} else if (index == 'prev') {
			fp.gallery_index = fp.gallery_index - 1;
			if (fp.gallery_index < 0)
				fp.gallery_index = fp.gallery_size - 1;
		} else if (index == 'next') {
			fp.gallery_index = fp.gallery_index + 1;
			if (fp.gallery_index >= fp.gallery_size)
				fp.gallery_index = 0;
		}
		$('.flowerpot[rel=' + rel + ']').eq(fp.gallery_index).flowerpot({gallery: rel, type: 'gallery'});
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Hide The Flowerpot
	 *
	 * Fade various elements out and restore any changes made to the DOM
	 * or CSS by loading The Flowerpot
	 *
	 * @access	public
	 * @return	void
	 */
	fp_o.prototype.hide = function() {
		fp.ready = false;
		speed = fp.animation_speed;
		if (fp.slow_animation) speed = speed * fp.animation_multiplier;
		fp.gallery_size = 0;
		if (fp.type == 'div')
			$('#' + settings['div_id']).swap('#flowerpotjs-div-swap');
		
		if ($.browser.msie && $.browser.version < 8)
			$('object,embed').css('visibility', 'visible');
		
		$('#flowerpotjs-contents').fadeOut(speed);
		$('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg').dequeue();
		$('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg').fadeOut(speed);
		$('#flowerpotjs-contents').queue(function() {
			$('#flowerpotjs-contents').dequeue();
			$('#flowerpotjs-overlay').fadeOut(speed);
		});
		$('#flowerpotjs-overlay').queue(function() {
			$('#flowerpotjs-overlay').dequeue();
			if (($.browser.msie && $.browser.version < 8) || $.browser.opera)
				$('object,embed').css('visibility', 'visible');
			$('body').removeClass('flowerpot-active');
			fp.overlay = false;
		});
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Resize The Flowerpot
	 *
	 * When the viewport size changes, the size of The Flowerpot is
	 * recalculated, in case the viewport size change allows for a larger
	 * or smaller Flowerpot
	 *
	 * @access	public
	 * @param	string		selector		jQuery selector of element to resize
	 * @param	object		size			object containing width, height
	 * @return	void
	 */
	fp_o.prototype.resize = function(selector, size) {
		var height;
		var width;
		if (typeof(size) == 'undefined') {
			height = fp.dom_img.height;
			width = fp.dom_img.width;
		} else {
			height = size['height'];
			width = size['width'];
		}
		var window_height = $(window).height();
		var window_width = $(window).width();
		
		var max_height = window_height - window_height / 5;
		var max_width = window_width - window_width / 5;
		
		// Check to make sure the image isn't too big!
		if (width > max_width) {
			height = height * (max_width / width);
			width = max_width;
			if (height > max_height) {
				width = width * (max_height / height);
				height = max_height;
			}
		} else if (height > max_height) {
			width = width * (max_height / height);
			height = max_height;
			if (width > max_width) {
				height = height * (max_width / width);
				width = max_width;
			}
		}
		
		if (typeof(height) != 'undefined')
			$(selector).height(height + 'px');
		if (typeof(width) != 'undefined')
			$(selector).width(width + 'px');
		
		if (typeof(height) == 'undefined')
			$('#flowerpotjs-contents').css('height', 'auto');
		else
			$('#flowerpotjs-contents').css('height', height + 'px');
		if (typeof(width) == 'undefined')
			$('#flowerpotjs-contents').css('width', 'auto');
		else
			$('#flowerpotjs-contents').css('width', width + 'px');
		
		if ($.browser.msie && $.browser.version < 7) {
			fp.ie6_resize_overlay();
		} else {
			$('#flowerpotjs-contents').css('margin-top', '-' + (height / 2) + 'px');
			$('#flowerpotjs-contents').css('margin-left', '-' + (width / 2) + 'px');
		}
		$('#flowerpotjs-description-bg').css({height: $('#flowerpotjs-description').height()});
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Show The Flowerpot
	 *
	 * Fade The Flowerpot in (after the image has loaded) and get rid of
	 * the "loading" text.
	 *
	 * @access	public
	 * @param	integer		speed		transition animation speed in ms
	 * @return	void
	 */
	fp_o.prototype.show = function(speed) {
		if (typeof(speed) == 'undefined') speed = fp.animation_speed;
		if (fp.slow_animation) speed = speed * fp.animation_multiplier;
		
		if (fp.type == 'div')
			$('#' + settings['div_id']).swap('#flowerpotjs-div-swap');
		
		if ($.browser.msie && $.browser.version < 8) {
			$('object,embed').css('visibility', 'hidden');
			$('#flowerpotjs-contents object,#flowerpotjs-contents embed').css('visibility', 'visible');
		}
		
		$('#flowerpotjs-overlay span').fadeOut(speed);
		$('#flowerpotjs-contents').fadeIn(speed);
		$('#flowerpotjs-contents').queue(function() {
			$('#flowerpotjs-contents').dequeue();
			$('#flowerpotjs-overlay span').dequeue();
			$('#flowerpotjs-overlay span').hide();
			$('#flowerpotjs-description-bg').animate({height: $('#flowerpotjs-description').height()}, speed / 2);
			$('#flowerpotjs-close').fadeIn(parseInt(speed / 2));
		});
		
		fp.ready = true;
	};
})(jQuery);

fp = new fp_o();
the_flowerpot = fp;

(function($) {
	
	// --------------------------------------------------------------------
	
	/**
	 * Plant a flowerpot
	 *
	 * Create a Flowerpot based on the attributes of the parent object and
	 * the options, if any, supplied.
	 *
	 * @access	public
	 * @param	array		options		array of options to override defaults
	 * @return	void
	 */
	$.fn.flowerpot = function(options) {
		settings = $.extend({
			aux_opacity: fp.aux_opacity,
			description: false,
			gallery: 0,
			overlay_opacity: fp.overlay_opacity,
			size: {},
			speed: fp.animation_speed,
			type: 'image'
		}, options);
		
		fp.animation_speed = fp.animation_speed;
		fp.animation_multiplier = fp.animation_multiplier;
		fp.close_img = fp.close_img;
		fp.images_dir = fp.images_dir;
		fp.overlay_opacity = fp.overlay_opacity;
		fp.type = settings['type'];
		
		if (fp.slow_animation) settings['speed'] = settings['speed'] * fp.animation_multiplier;
		
		$('#flowerpotjs-overlay').css({opacity: settings['overlay_opacity']});
		$('#flowerpotjs-overlay').fadeIn(parseInt(settings['speed'] / 2));
		$('#flowerpotjs-overlay').queue(function() {
			$('#flowerpotjs-overlay').dequeue();
			$('#flowerpotjs-overlay span').animate({opacity: 1}, settings['speed']).fadeIn(settings['speed'] / 5);
			$('body').addClass('flowerpot-active');
		});
		fp.overlay = true;
		
		var content;
		var controls = '';
		var description = settings['description'];
		if (settings['type'] == 'image' || settings['type'] == 'gallery') { // Image or Gallery
			if (!description) {
				description = $('#' + $(this).attr('id') + '-flowerpot-description');
				if (description.length > 0)
					description = description.html();
				else
					description = $(this).attr('title');
			}
			content = '<img alt="Image overlay" src="' + $(this).attr("href") + '" id="flowerpotjs-image" />';
			if (settings['type'] == 'gallery')			
				controls = '<div id="flowerpotjs-controls"><span id="flowerpotjs-prev-link-bg" class="flowerpotjs-gallery-link-bg"></span><a href="#prev" id="flowerpotjs-prev-link" class="flowerpotjs-gallery-link" rel="' + settings['gallery'] + '">' + fp.locale['previous'] + '</a><span id="flowerpotjs-next-link-bg" class="flowerpotjs-gallery-link-bg"></span><a href="#next" id="flowerpotjs-next-link" class="flowerpotjs-gallery-link" rel="' + settings['gallery'] + '">' + fp.locale['next'] + '</a></div>';
			if (description) content = content + '<div id="flowerpotjs-description-bg"></div><div id="flowerpotjs-description">' + description + '</div>';
		}
		if (settings['type'] == 'div') // Inline <div>
			content = '<div id="flowerpotjs-div-inline"><div id="flowerpotjs-div-swap" style="display: none;"></div></div>';
		
		content = content + '<a href="#close" id="flowerpotjs-close"><img src="' + fp.images_dir + fp.close_img + '" alt="' + fp.locale['close'] + '" /></a>';
		
		// Hide flash from IE < 8 while the overlay is on
		if (($.browser.msie && $.browser.version < 8) || $.browser.opera) {
			$('object,embed').css('visibility', 'hidden');
			$('#flowerpotjs-contents object,#flowerpotjs-contents embed').css('visibility', 'visible');
		}
		
		$('#flowerpotjs-contents').html(content).css({'-moz-border-radius': '2px', '-webkit-border-radius': '1px'});
		if ($('#flowerpotjs-controls').length > 0)
			$('#flowerpotjs-controls').replaceWith(controls);
		else
			$('#flowerpotjs-contents').after(controls);
		
		$('#flowerpotjs-description-bg,.flowerpotjs-gallery-link-bg').css({opacity: settings['aux_opacity']});
		$('#flowerpotjs-description,#flowerpotjs-description-bg').css({'-moz-border-radius': '3px', '-webkit-border-radius': '2px'});
		$('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg').css({'-moz-border-radius': '3px', '-webkit-border-radius': '2px'}).fadeIn(settings['speed']);
		$('#flowerpotjs-prev-link-bg').css({height: $('#flowerpotjs-prev-link').height()});
		$('#flowerpotjs-next-link-bg').css({height: $('#flowerpotjs-next-link').height()});
		
		if (settings['type'] == 'image' || settings['type'] == 'gallery') {
			if ($.browser.opera) {
				fp.image('#flowerpotjs-image');
				fp.show(settings['speed']);
			} else {
				$('#flowerpotjs-image').load(function callback(event) {
					if (settings['type'] == 'image' || settings['type'] == 'gallery')
						fp.image('#flowerpotjs-image');
					if ($.browser.msie && $.browser.version == 7) {
						fp.show(settings['speed']);
					} else {
						$(fp.dom_img).load(function() {
							fp.show(settings['speed']);
						});
					}
				});
			}
		} else if (settings['type'] == 'div') {
			fp.resize('#flowerpotjs-div-inline', settings['size']);
			fp.show(settings['speed']);
		}
		$('#flowerpotjs-contents').queue(function() {
			$('#flowerpotjs-contents').dequeue();
			$('#flowerpotjs-overlay').show();
		});
		
		return this;
	};
	
	$(document).ready(function() {
		fp.init();
	});
	
	// --------------------------------------------------------------------
	
	/**
	 * Swap elements
	 *
	 * Swap an element's place in the DOM for another element. Inspired by
	 * Brandon Aaron's jQuery swap plugin, except elements aren't cloned.
	 *
	 * @access	public
	 * @param	string		element_b		jQuery selector of element to swap
	 * @return	jQuery
	 */
	$.fn.swap = function(element_b) {
		element_b = $(element_b)[0];
		var element_a = this[0];
		
		var temp = element_a.parentNode.insertBefore(document.createTextNode(''), element_a);
		element_b.parentNode.insertBefore(element_a, element_b);
		temp.parentNode.insertBefore(element_b, temp);
		temp.parentNode.removeChild(temp);
		
		return this;
	};
})(jQuery);