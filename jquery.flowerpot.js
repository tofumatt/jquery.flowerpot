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

// The Flowerpot object. Data is stored in arrays to allow jQuery
// to override settings with $.extend()
function fp_o() {
	this.l = { // Locale html/text strings
		'close': 'Close', // alt text for close image (should be text, not html)
		'loading': 'Loading... "Esc" to close', // html that appears when the image is loading
		'next': 'Next →', // html inside the gallery "next" link
		'previous': '← Previous' // html inside the gallery "previous" link
	};
	this.p = { // Internal data members, stored in an array so jQuery
			   // can run $.extend() to override settings
		ajax: false,
		description: false,
		dom_img: 0,
		gal_i: 0,
		gal_size: 0,
		i_content: '',
		overlay: false,
		ready: false,
		rel: '',
		size: {},
		slow_anim: false,
		speed: 0,
		src: false,
		type: 'image'
	};
	this.s = { // User-customizable settings
		anim_speed: 500, // animation time in ms
		anim_multiplier: 3, // set to 1 to disable the shiftKey animation slowdown
		aux_opacity: 0.75, // opacity of the other backgrounds
		blur_onclick: true, // blur the element that invokes a Flowerpot
		close_img: 'flowerpot-close.png',
		images_dir: 'images/', // path to your images folder -- can absolute or relative
		overlay_opacity: 0.5 // opacity of the overlay background
	};
	if ($.browser.msie && $.browser.version < 7)
		this.s['close_img'] = 'flowerpot-close-ie6.png'; // Optional: rather than apply
														 // a png hack for IE 6, there's
														 // an option to load a non-alpha
														 // image
}

// Create The Flowerpot object
the_flowerpot = new fp_o();

(function($, fp) {
	fp_o.fn = fp_o.prototype;
	
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
	fp_o.fn.ie6_resize_overlay = function() {
		var overlay = $('#flowerpotjs-overlay');
		overlay.css('height', $(document).height());
		overlay.css('width', $(window).width());
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
	fp_o.fn.image = function(selector) {
		fp.p['dom_img'] = new Image();
		// Create an event listener to resize the image when the
		// image loads (in case the image is bigger than the viewport)
		$(fp.p['dom_img']).load(function() {
			fp.resize(selector);
		});
		fp.p['dom_img'].src = $(selector).attr('src');
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Initialize The Flowerpot
	 *
	 * Setup event listeners, CSS, and HTML.
	 *
	 * @access	public
	 * @param	array		settings		array of settings to override defaults
	 * @param	array		locale			array of locale html/text to override defaults
	 * @return	void
	 */
	fp_o.fn.init = function(settings, locale) {
		// Load custom settings passed via array arguments
		fp.l = $.extend(fp.l, locale);
		fp.s = $.extend(fp.s, settings);
		
		// HTML to use when inserting The Flowerpot into the DOM
		var flowerpot_html = '<div id="flowerpotjs-overlay" style="display: none;"><span style="display: none;">' + fp.l['loading'] + '</span></div><div id="flowerpotjs-contents" style="display: none;"></div>';
		$('body').append(flowerpot_html);
		
		// Hide the overlay with opacity and style
		// the description span
		$('#flowerpotjs-overlay').css({opacity: 0});
		$('#flowerpotjs-overlay span').css({
			'-moz-border-radius': '3px',
			'-webkit-border-radius': '2px'
		});
		
		// Click Events
		$('#flowerpotjs-close,#flowerpotjs-overlay').live('click', function(event) { // Overlay or close link
			if (event.shiftKey)
				fp.p['slow_anim'] = true;
			if (event.button == 0 && fp.p['ready']) {
				fp.hide();
				if (fp.s['blur_onclick'])
					$(this).trigger('blur');
				event.preventDefault();
			}
			fp.p['slow_anim'] = false;
		});
		$('.flowerpot').live('click', function(event) { // Event listener for all current
														// and future elements with the class "flowerpot"
			if (fp.p['overlay'])
				return; // Don't try to grow another Flowerpot if there's already an overlay
			if (event.shiftKey)
				fp.p['slow_anim'] = true;
			if (event.button == 0) { // Only load The Flowerpot when left-clicked
				fp.p['rel'] = $(this).attr('rel');
				if (fp.p['rel'].match(/iframe\[([^ ]*)\]/i)) { // Flowerpot inline frame
					// Get the address/selector, height, and width
					var id = fp.p['rel'].replace(/.*iframe\[([^ ]*)\].*/i, '$1');
					var f_size = {};
					if (fp.p['rel'].match(/height\[([^ ]*)\]/i))
						f_size.height = fp.p['rel'].replace(/.*height\[([^ ]*)\].*/i, '$1');
					if (fp.p['rel'].match(/width\[([^ ]*)\]/i))
						f_size.width = fp.p['rel'].replace(/.*width\[([^ ]*)\].*/i, '$1');
					$(this).flowerpot({}, {
						i_content: id,
						size: f_size,
						type: 'iframe'
					});
				} else if (fp.p['rel'].match(/div\[([^ ]*)\]/i)) { // Flowerpot inline div
					// Get the address/selector, height, and width
					var id = fp.p['rel'].replace(/.*div\[([^ ]*)\].*/i, '$1');
					var d_size = {};
					if (fp.p['rel'].match(/height\[([^ ]*)\]/i))
						d_size.height = fp.p['rel'].replace(/.*height\[([^ ]*)\].*/i, '$1');
					if (fp.p['rel'].match(/width\[([^ ]*)\]/i))
						d_size.width = fp.p['rel'].replace(/.*width\[([^ ]*)\].*/i, '$1');
					$(this).flowerpot({}, {
						i_content: id,
						size: d_size,
						type: 'div'
					});
				} else if (fp.p['rel'].match(/gallery\[([^ ]*)\]/i)) { // Flowerpot image gallery
					fp.p['rel'] = fp.p['rel'].replace(/.*(gallery\[([^ ]*)\]).*/i, '$1');
					var selector = $('.flowerpot[rel*="' + fp.p['rel'] + '"]');
					fp.p['gal_i'] = selector.index(this);
					fp.p['gal_size'] = selector.length;
					$(this).flowerpot({}, {
						type: 'gallery'
					});
				} else { // Single Flowerpot image
					$(this).flowerpot();
				}
				
				if (fp.s['blur_onclick'])
					$(this).trigger('blur');
				event.preventDefault();
			}
			fp.p['slow_anim'] = false;
		});
		$('#flowerpotjs-prev-link').live('click', function(event) { // Gallery control: previous image
			if (event.shiftKey)
				fp.p['slow_anim'] = true;
			fp.p['rel'] = $(this).attr('rel');
			if (fp.p['ready'] && fp.p['rel'].match(/gallery\[([^ ]*)\]/i)) {
				if (event.button == 0)
					fp.gallery_move('prev');
			}
			fp.p['slow_anim'] = false;
			$(this).trigger('blur'); // Disable outline for controls
			event.preventDefault();
		});
		$('#flowerpotjs-next-link').live('click', function(event) { // Gallery control: next image
			if (event.shiftKey)
				fp.p['slow_anim'] = true;
			fp.p['rel'] = $(this).attr('rel');
			if (fp.p['ready'] && fp.p['rel'].match(/gallery\[([^ ]*)\]/i)) {
				if (event.button == 0)
					fp.gallery_move('next');
			}
			fp.p['slow_anim'] = false;
			$(this).trigger('blur'); // Disable outline for controls
			event.preventDefault();
		});
		
		// Keyboard Events
		$(document).keydown(function(event) {
			// Don't modify events we aren't handling
			var prevent_default = false;
			if (event.shiftKey)
				fp.p['slow_anim'] = true; // Little OS X-like Easter Egg -- slows down
										  // animations when holding the Shift key ^_^
			switch (event.keyCode) {
				case 27: // Esc (close The Flowerpot)
					if (fp.p['ready']) {
						fp.hide();
					}
					if (fp.p['overlay']) {
						fp.p['dom_img'] = 0;
						fp.hide();
					}
					prevent_default = true;
					break;
				case 35: // End (loads last gallery image)
					if (fp.p['ready'] && fp.p['gal_size'] > 0) {
						fp.gallery_move(fp.p['gal_size'] - 1);
						prevent_default = true;
					}
					break;
				case 36: // Home (loads first gallery image)
					if (fp.p['ready'] && fp.p['gal_size'] > 0) {
						fp.gallery_move(0);
						prevent_default = true;
					}
					break;
				case 37: // Left Arrow (loads previous gallery image)
					if (fp.p['ready'] && fp.p['gal_size'] > 0) {
						fp.gallery_move('prev');
						prevent_default = true;
					}
					break;
				case 39: // Right Arrow (loads next gallery image)
					if (fp.p['ready'] && fp.p['gal_size'] > 0) {
						fp.gallery_move('next');
						prevent_default = true;
					}
					break;
				default:
					break;
			}
			if (prevent_default)
				event.preventDefault();
			fp.p['slow_anim'] = false;
		});
		
		// Resize Events
		$(window).resize(function(event) { // If the viewport size changes,
										   // recalculate the image size
			if (fp.p['ready']) {
				if (fp.p['type'] == 'image' || fp.p['type'] == 'gallery')
					fp.resize('#flowerpotjs-image');
				else if ($.browser.msie && $.browser.version < 7) // The overlay for IE 6 is sized in JavaScript,
																  // so it needs to be recalculated
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
	fp_o.fn.gallery_move = function(index) {
		if (index === fp.p['gal_i'])
			return false;
		$('#flowerpotjs-contents').hide();
		fp.p['ready'] = false;
		if (typeof(index) == 'number') {
			fp.p['gal_i'] = index;
		} else if (index == 'prev') {
			fp.p['gal_i']--;
			if (fp.p['gal_i'] < 0)
				fp.p['gal_i'] = fp.p['gal_size'] - 1;
		} else if (index == 'next') {
			fp.p['gal_i']++;
			if (fp.p['gal_i'] >= fp.p['gal_size'])
				fp.p['gal_i'] = 0;
		}
		$('.flowerpot[rel*="' + fp.p['rel'] + '"]').eq(fp.p['gal_i']).flowerpot({}, {
			type: 'gallery'
		});
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
	fp_o.fn.hide = function() {
		fp.p['ready'] = false;
		
		var fp_contents = $('#flowerpotjs-contents');
		var gallery_links = $('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg');
		var html_objects = $('object,embed');
		var overlay = $('#flowerpotjs-overlay');
		
		if (fp.p['slow_anim'])
			fp.p['speed'] = fp.s['anim_speed'] * fp.s['anim_multiplier'];
		else
			fp.p['speed'] = fp.s['anim_speed'];
		fp.p['gal_size'] = 0;
		if (fp.p['type'] == 'div') {
			if (fp.p['ajax'])
				$('#flowerpotjs-div-inline').empty();
			else
				$(fp.p['i_content']).swap('#flowerpotjs-div-swap');
		}
		
		if ($.browser.msie && $.browser.version < 8)
			html_objects.css('visibility', 'visible');
		
		fp_contents.fadeOut(fp.p['speed']);
		gallery_links.dequeue();
		gallery_links.fadeOut(fp.p['speed']);
		fp_contents.queue(function() {
			fp_contents.dequeue();
			$('#flowerpotjs-controls').remove();
			overlay.fadeOut(fp.p['speed']);
		});
		overlay.queue(function() {
			overlay.dequeue();
			if (($.browser.msie && $.browser.version < 8) || $.browser.opera)
				html_objects.css('visibility', 'visible');
			$('body').removeClass('flowerpot-active');
			fp.p['overlay'] = false;
		});
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Define custom locale strings
	 *
	 * Override default locale array with user-supplied html/text after
	 * The Flowerpot has been initialized.
	 *
	 * @access	public
	 * @param	array		locale		array of locale html/text to override defaults
	 * @return	void
	 */
	fp_o.fn.locale = function(locale) {
		// Load custom settings passed via array arguments
		fp.l = $.extend(fp.l, locale);
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
	fp_o.fn.resize = function(selector, size) {
		var fp_contents = $('#flowerpotjs-contents');
		var height;
		var object = $(selector);
		var width;
		var window_height = $(window).height();
		var window_width = $(window).width();
		
		// The max height + width should allow for some space
		// between the edge of the viewport and The Flowerpot's
		var max_height = window_height - window_height / 5;
		var max_width = window_width - window_width / 5;
		
		if (!size) {
			height = fp.p['dom_img'].height;
			width = fp.p['dom_img'].width;
		} else {
			// Use the max size allowed if a size isn't set
			height = (size.height) ? size.height : max_height;
			width = (size.width) ? size.width : max_width;
		}
		
		// Check to make sure the image isn't too big for the viewport
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
		
		if (fp.p['type'] == 'iframe') {
			height -= 10;
			width -= 10;
		}
		
		object.height(height + 'px');
		fp_contents.css('height', height + 'px');
		object.width(width + 'px');
		fp_contents.css('width', width + 'px');
		
		if ($.browser.msie && $.browser.version < 7) {
			fp.ie6_resize_overlay();
		} else {
			fp_contents.css({
				'margin-top': '-' + (height / 2) + 'px',
				'margin-left': '-' + (width / 2) + 'px'
			});
		}
		$('#flowerpotjs-description-bg').css({height: $('#flowerpotjs-description').height()});
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Define custom settings
	 *
	 * Override default settings with user settings after The Flowerpot has
	 * been initialized.
	 *
	 * @access	public
	 * @param	array		settings		array of settings to override defaults
	 * @return	void
	 */
	fp_o.fn.settings = function(settings) {
		// Load custom settings passed via array arguments
		fp.s = $.extend(fp.s, settings);
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Show The Flowerpot
	 *
	 * Fade The Flowerpot in (after the image has loaded) and get rid of
	 * the "loading" text.
	 *
	 * @access	public
	 * @return	void
	 */
	fp_o.fn.show = function() {
		var fp_contents = $('#flowerpotjs-contents');
		var overlay_span = $('#flowerpotjs-overlay span');
		
		if ($.browser.msie && $.browser.version < 8) {
			// Object and embed elements (usually Flash) 'under' The Flowerpot
			// can be problematic, so we hide them while the overlay is on.
			$('object,embed').css('visibility', 'hidden');
			$('#flowerpotjs-contents object,#flowerpotjs-contents embed').css('visibility', 'visible');
		}
		
		overlay_span.fadeOut(fp.p['speed']);
		fp_contents.fadeIn(fp.p['speed']);
		fp_contents.queue(function() {
			fp_contents.dequeue();
			overlay_span.dequeue();
			overlay_span.hide();
			// The description has a transparent background set with JavaScript;
			// we position an empty div behind it and assign the description's
			// height to the empty div.
			$('#flowerpotjs-description-bg').animate({height: $('#flowerpotjs-description').height()}, fp.p['speed'] / 2);
			$('#flowerpotjs-close').fadeIn(parseInt(fp.p['speed'] / 2));
		});
		
		fp.p['ready'] = true;
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Plant a flowerpot
	 *
	 * Create a Flowerpot based on the attributes of the parent object and
	 * the options, if any, supplied.
	 *
	 * @access	public
	 * @param	array		settings		array of settings to override defaults
	 * @param	array		props			array of properties to override defaults
	 * @return	jQuery
	 */
	$.fn.flowerpot = function(settings, props) {
		// Reload special defaults
		fp.p = $.extend(fp.p, {
			description: false,
			div_id: '',
			dom_img: 0,
			overlay: false,
			ready: false,
			size: {},
			src: false,
			type: 'image'
		});
		
		// Load custom settings passed via array arguments
		fp.p = $.extend(fp.p, props);
		fp.s = $.extend(fp.s, settings);
		
		var fp_contents = $('#flowerpotjs-contents');
		var fp_controls = $('#flowerpotjs-controls');
		var gallery_links = $('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg');
		var html_objects = $('object,embed');
		var overlay = $('#flowerpotjs-overlay');
		
		if (fp.p['slow_anim'])
			fp.p['speed'] = fp.s['anim_speed'] * fp.s['anim_multiplier'];
		else
			fp.p['speed'] = fp.s['anim_speed'];
		
		// Load the overlay, which gives a visual queue that clicking a Flowerpot
		// element actually did something, and also is an easy way to prevent most
		// interaction with the page (as everything is under the overlay)
		overlay.css({opacity: fp.s['overlay_opacity']});
		overlay.fadeIn(parseInt(fp.p['speed'] / 2));
		overlay.queue(function() {
			overlay.dequeue();
			$('#flowerpotjs-overlay span').animate({opacity: 1}, fp.p['speed']).fadeIn(fp.p['speed'] / 5);
			$('body').addClass('flowerpot-active');
		});
		fp.p['overlay'] = true;
		
		var content = '';
		var controls = '';
		// Display a description, The Flowerpot looks for a description
		// from three places:
		//
		// 		1. options['description'] from the 'options' array
		//
		// 		2. an element with the same id as the element that invoked
		// 			The Flowerpot, plus the suffix "-flowerpot-description"
		//
		// 		3. the "title" attribute of the element that invoked The Flowerpot
		var description = fp.p['description'];
		if (!description) {
			description = $('#' + $(this).attr('id') + '-flowerpot-description');
			if (description.length > 0)
				description = description.html();
			else
				description = $(this).attr('title');
		}
		
		if (fp.p['type'] == 'image' || fp.p['type'] == 'gallery') { // Image or Gallery
			if (!fp.p['src']) {
				if ($(this).attr('rel').match(/href\[([^ ]*)\]/i))
					fp.p['src'] = $(this).attr('rel').replace(/.*href\[([^ ]*)\].*/i, '$1');
				else
					fp.p['src'] = $(this).attr('href');
			}
			content = '<img alt="Image overlay" src="' + fp.p['src'] + '" id="flowerpotjs-image" />';
			if (fp.p['type'] == 'gallery')
				controls = '<div id="flowerpotjs-controls"><span id="flowerpotjs-prev-link-bg" class="flowerpotjs-gallery-link-bg"></span><a href="#prev" id="flowerpotjs-prev-link" class="flowerpotjs-gallery-link" rel="' + fp.p['rel'] + '">' + fp.l['previous'] + '</a><span id="flowerpotjs-next-link-bg" class="flowerpotjs-gallery-link-bg"></span><a href="#next" id="flowerpotjs-next-link" class="flowerpotjs-gallery-link" rel="' + fp.p['rel'] + '">' + fp.l['next'] + '</a></div>';
		} else if (fp.p['type'] == 'div') { // Inline div
			// Figure out if we're using ajax or inline content
			var id = fp.p['i_content'];
			if (id.substr(0, 1) == '#') {
				id = id.substr(1, id.length - 1);
				fp.p['ajax'] = false;
			} else {
				fp.p['ajax'] = true;
			}
			content = '<div id="flowerpotjs-div-inline"><div id="flowerpotjs-div-swap" style="display: none;"></div></div>';
		} else if (fp.p['type'] == 'iframe') { // Inline frame
			// Figure out if we're using ajax or inline content
			fp.p['i_content'];
			content = '<iframe id="flowerpotjs-iframe-inline" src="' + fp.p['i_content'] + '"></iframe>';
		}
		
		// If there's a description available, add it to the HTML
		if (description)
			content += '<div id="flowerpotjs-description-bg"></div><div id="flowerpotjs-description">' + description + '</div>';
		// Added the "close" image to the HTML
		content += '<a href="#close" id="flowerpotjs-close"><img src="' + fp.s['images_dir'] + fp.s['close_img'] + '" alt="' + fp.l['close'] + '" /></a>';
		// If gallery controls are available, add them to the HTML
		// (provided there's more than one item in the gallery)
		if (fp_controls.length == 0 && fp.p['gal_size'] > 1)
			fp_contents.after(controls);
		
		// Hide flash from IE < 8 while the overlay is on
		if ($.browser.msie && $.browser.version < 8) {
			$('object,embed').css('visibility', 'hidden');
			$('#flowerpotjs-contents object,#flowerpotjs-contents embed').css('visibility', 'visible');
		}
		
		// Replace The Flowerpot's current HTML with the generated HTML in the DOM
		fp_contents.html(content).css({
			'-moz-border-radius': '2px',
			'-webkit-border-radius': '1px'
		});
		
		// Apply some non-standard CSS (opacity and border-radius) to browsers that support it
		$('#flowerpotjs-description-bg,.flowerpotjs-gallery-link-bg').css({opacity: fp.s['aux_opacity']});
		$('#flowerpotjs-description,#flowerpotjs-description-bg').css({
			'-moz-border-radius': '3px',
			'-webkit-border-radius': '2px'
		});
		$('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg').css({
			'-moz-border-radius': '3px',
			'-webkit-border-radius': '2px'
		}).fadeIn(fp.p['speed']);
		$('#flowerpotjs-prev-link-bg').css({height: $('#flowerpotjs-prev-link').height()});
		$('#flowerpotjs-next-link-bg').css({height: $('#flowerpotjs-next-link').height()});
		
		// And we're off to the races!
		// Load the remote content into the DOM, or swap the inline div with a placeholder
		if (fp.p['type'] == 'image' || fp.p['type'] == 'gallery') {
			if ($.browser.opera) { // Opera acts a little weird with .load(), so we have
								   // a special case for it
				fp.image('#flowerpotjs-image');
				fp.show();
			} else {
				$('#flowerpotjs-image').load(function callback(event) {
					if (fp.p['type'] == 'image' || fp.p['type'] == 'gallery')
						fp.image('#flowerpotjs-image');
					if ($.browser.msie && $.browser.version >= 7) {
						fp.show();
					} else {
						$(fp.p['dom_img']).load(function() {
							fp.show();
						});
					}
				});
			}
		} else if (fp.p['type'] == 'div') {
			fp.resize('#flowerpotjs-div-inline', fp.p['size']);
			if (fp.p['ajax']) {
				$.ajax({
					type: 'GET',
					async: false,
					url: fp.p['i_content'],
					dataType: 'text',
					success: function(result) {
						$('#flowerpotjs-div-inline').html(result);
					},
					error: function(request, status, error) {
						$('#flowerpotjs-div-inline').html('AJAX error');
					}
				});
			} else {
				$(fp.p['i_content']).swap('#flowerpotjs-div-swap');
			}
			fp.show();
		} else if (fp.p['type'] == 'iframe') {
			fp.resize('#flowerpotjs-iframe-inline', fp.p['size']);
			fp.show();
		}
		fp_contents.queue(function() {
			fp_contents.dequeue();
			overlay.show();
		});
		
		return this;
	};
	
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
	
	// Initialize The Flowerpot when the DOM is ready
	$(document).ready(function() {
		fp.init();
	});
})(jQuery, the_flowerpot); // Load in the jQuery global variable to maintain compability,
						   // i.e. in case another framework or variable is using "$".
						   // Load in the_flowerpot (The Flowerpot's global var) so
						   // we can use a shorthand inside the code, saving a little
						   // space and typing