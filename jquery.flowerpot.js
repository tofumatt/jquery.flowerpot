/**
 * The Flowerpot
 *
 * A jQuery plugin to overlay images, inline content, and more.
 * Dual-licensed under the MIT and GPL (v2 or later) licenses.
 *
 * @package		The Flowerpot
 * @version		1.42
 * @author		Matthew Riley MacPherson
 * @copyright	Copyright (c) 2009, Matthew Riley MacPherson
 * @license		MIT License (http://www.opensource.org/licenses/mit-license.php)
 * @license		GNU General Public License (GPL) version 2 or later (http://www.gnu.org/licenses/old-licenses/gpl-2.0.html)
 * @link		http://flowerpot.googlecode.com/
 */
// HTML plants in an overlayed pot!

(function($) {
	// The Flowerpot object. Data is stored in arrays to allow jQuery
	// to override settings with $.extend()
	$.the_flowerpot = new function() {
		this.l = { // Locale html/text strings (These are
				   // Unicode -- you'll wanna override 'next'
				   // and 'previous' if your output isn't)
			ajax_error: 'An error occurred during the request.', // HTML to display when we
																 // have a catchable AJAX error
			close: 'Close', // html for close link
			loading: 'Loading... "Esc" to close', // html that appears when the image is loading
			next: 'Next →', // html inside the gallery "next" link
			previous: '← Previous' // html inside the gallery "previous" link
		};
		this.p = { // Internal data members -- you can modify them dynamically
				   // when you invoke a Flowerpot
			ajax: false,
			desc: false,
			dom_img: 0,
			gal_i: 0,
			gal_s: false,
			gal_size: 0,
			old_set: false,
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
			detect_type: true, // Automatically detect types based on href
			gallery_thumbnails: false, // enable gallery thumnails on the top of the viewport
			overlay_opacity: 0.5, // opacity of the overlay background
			thumbnail_height: 40 // height of the thumbnail links (in pixels)
		};
	};
	
	// Set a local variable to reference The Flowerpot
	// to save space (and typing)
	var fp = $.the_flowerpot;
	
	// --------------------------------------------------------------------
	
	/**
	 * Detect the type of overlay to load
	 *
	 * Returns the type overlay that should be loaded based
	 * on information in the rel attribute (and optionally
	 * through automatic type detection).
	 *
	 * @access	public
	 * @param	string		rel		rel attribute of the link
	 * @param	string		src		src attribute of the link
	 * @return	string
	 */
	fp.detect_type = function(src, rel) {
		// By default, the type is an image
		var type = 'image';
		
		// Try to detect the type of overlay based on the src value
		if (fp.s['detect_type']) {
			if (src.match(/\.(png|jpg|jpeg|gif|bmp)/i))
				type = 'image';
			else if (!src.match(/^.*:\/\/.*/i) || src.match(window.location.host))
				type = 'div';
			else if (src.match(/vimeo\.com/i))
				type = 'vimeo';
			else if (src.match(/youtube\.com/i))
				type = 'youtube';
			else
				type = 'iframe';
		}
		
		// Check for the type to load (overrides automatic type detection)
		if (rel.match(/image/i)) // image (mostly useful for overriding detect_type)
			type = 'image';
		else if (rel.match(/div/i)) // inline/AJAX content
			type = 'div';
		else if (rel.match(/iframe/i)) // inline frame
			type = 'iframe';
		else if (rel.match(/vimeo/i)) // vimeo video
			type = 'vimeo';
		else if (rel.match(/youtube/i)) // youtube video
			type = 'youtube';
		
		return type;
	}
	
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
	fp.ie6_resize_overlay = function() {
		var overlay = $('#flowerpotjs-overlay');
		overlay.css('height', $().height());
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
	fp.image = function(selector) {
		fp.p['dom_img'] = new Image();
		// Create an event listener to resize the image when the
		// image loads (in case the image is bigger than the viewport)
		$(fp.p['dom_img']).load(function() {
			fp.resize('#flowerpotjs-image');
		});
		// Set the internal DOM image based on the image tag
		// inside The Flowerpot
		fp.p['dom_img'].src = $('#flowerpotjs-image').attr('src');
	};
	
	// --------------------------------------------------------------------
	
	/**
	 * Initialize The Flowerpot
	 *
	 * Setup event listeners, CSS, and HTML. By default, The
	 * Flowerpot is loaded when the DOM is ready, but this
	 * method can be run again, or run "on-demand" to minimize
	 * the amount of event listeners set.
	 *
	 * @access	public
	 * @param	array		settings		array of settings to override defaults
	 * @param	array		locale			array of locale html/text to override defaults
	 * @return	void
	 */
	fp.init = function(settings, locale) {
		// Load custom settings passed via array arguments
		$.extend(fp.l, locale);
		$.extend(fp.s, settings);
		
		// HTML to use when inserting The Flowerpot into the DOM
		var flowerpot_html = '<div id="flowerpotjs-overlay" style="display:none;"><span style="display:none;">' + fp.l['loading'] + '</span></div><div id="flowerpotjs-contents" style="display:none;"></div>';
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
				$(this).trigger('blur');
				event.preventDefault();
			}
			fp.p['slow_anim'] = false;
		});
		$('.flowerpot').live('click', function(event) { // Event listener for all current
														// and future elements with the class "flowerpot"
			if (fp.p['overlay']) // Don't try to grow another Flowerpot if there's already an overlay
				return;
			if (event.shiftKey)
				fp.p['slow_anim'] = true;
			if (event.button == 0) { // Only load The Flowerpot when left-clicked
				fp.p['rel'] = $(this).attr('rel');
				if (fp.p['rel'].match(/gallery\[([^ ]*)\]/i)) { // Flowerpot gallery
					var selector = fp.p['rel'].replace(/.*(gallery\[([^ ]*)\]).*/i, '$1');
					fp.p['gal_s'] = $('.flowerpot[rel*="' + selector + '"]');
					fp.p['gal_i'] = fp.p['gal_s'].index(this);
					fp.p['gal_size'] = fp.p['gal_s'].length;
					$(this).flowerpot();
				} else { // Single Flowerpot
					$(this).flowerpot();
				}
				
				$(this).trigger('blur');
				event.preventDefault();
			}
			fp.p['slow_anim'] = false;
		});
		$('#flowerpotjs-prev-link').live('click', function(event) { // Gallery control: previous image
			if (event.shiftKey)
				fp.p['slow_anim'] = true;
			fp.p['rel'] = $(this).attr('rel');
			if (fp.p['ready'] && fp.p['gal_size'] > 0) {
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
			if (fp.p['ready'] && fp.p['gal_size'] > 0) {
				if (event.button == 0)
					fp.gallery_move('next');
			}
			fp.p['slow_anim'] = false;
			$(this).trigger('blur'); // Disable outline for controls
			event.preventDefault();
		});
		$('.flowerpotjs-gallery-index-link').live('click', function(event) { // Gallery control: go to image
			if (event.shiftKey)
				fp.p['slow_anim'] = true;
			fp.p['rel'] = $(this).attr('rel');
			if (fp.p['ready'] && fp.p['gal_size'] > 0) {
				if (event.button == 0)
					fp.gallery_move(fp.p['rel'].replace(/.*gid\[(\d*)\].*/i, '$1'));
			}
			fp.p['slow_anim'] = false;
			$(this).trigger('blur'); // Disable outline for controls
			event.preventDefault();
		});
		
		// Keyboard Events
		$().keydown(function(event) {
			// Don't modify events we aren't handling
			var prevent_default = false;
			if (event.shiftKey)
				fp.p['slow_anim'] = true; // Little OS X-like Easter Egg -- slows down
										  // animations when holding the Shift key ^_^
			switch (event.keyCode) {
				case 27: // Esc (close The Flowerpot)
					if (fp.p['ready'] || fp.p['overlay']) {
						fp.hide();
						prevent_default = true;
					}
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
			}
			if (prevent_default)
				event.preventDefault();
			fp.p['slow_anim'] = false;
		});
		
		// Resize Events
		$(window).resize(function(event) { // If the viewport size changes,
										   // recalculate the image size
			if (fp.p['ready']) {
				if (fp.p['type'] == 'image')
					fp.resize('#flowerpotjs-image');
				else if (fp.p['type'] == 'div')
					fp.resize('#flowerpotjs-div-inline');
				else if (fp.p['type'] == 'iframe')
					fp.resize('#flowerpotjs-iframe-inline');
				if ($.browser.msie && $.browser.version < 7) // The overlay for IE 6 is sized in JavaScript,
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
	fp.gallery_move = function(index) {
		if (index === fp.p['gal_i']) // Don't do anything if we're already
									 // at the requested index
			return false;
		$('#flowerpotjs-contents').hide(); // We're gonna mess with the contents
										   // of The Flowerpot, so hide it
		// Set to false so event listeners don't invoke anything
		fp.p['ready'] = false;
		
		switch (index) {
			case 'prev': // Move ahead (possibly looping around)
				fp.p['gal_i']--;
				if (fp.p['gal_i'] < 0)
					fp.p['gal_i'] = fp.p['gal_size'] - 1;
				break;
			case 'next': // Move back (possibly looping around)
				fp.p['gal_i']++;
				if (fp.p['gal_i'] >= fp.p['gal_size'])
					fp.p['gal_i'] = 0;
				break;
			default: // Go right to the requested index
				fp.p['gal_i'] = index;
				break;
		}
		
		// If the previous index was an inline div, swap the
		// placeholder back into The Flowerpot
		if (fp.p['src'] && !fp.p['ajax'] && fp.p['type'] == 'div')
			$(fp.p['src']).swap('#flowerpotjs-div-swap');
		
		// If gallery thumbnails are on, highlight the current thumbnail
		if (fp.p['gal_size'] > 1 && fp.s['gallery_thumbnails']) {
			$('#flowerpotjs-controls-images li').removeClass('flowerpotjs-thumbnail-active').eq(fp.p['gal_i']).addClass('flowerpotjs-thumbnail-active');
		}
		
		// Select the gallery element and grow a Flowerpot
		fp.p['gal_s'].eq(fp.p['gal_i']).flowerpot();
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
	fp.hide = function() {
		// We're hiding The Flowerpot, so it's not ready for anything!
		fp.p['ready'] = false;
		
		// Get rid of the DOM image, if one is loaded
		fp.p['dom_img'] = 0;
		
		// Selectors we'll access a few times
		var fp_contents = $('#flowerpotjs-contents'),
		gallery_links = $('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg,.flowerpotjs-gallery-index-link'),
		html_objects = $('object,embed'),
		overlay = $('#flowerpotjs-overlay');
		
		// Set the current animation speed (and multiply it if slowdown is on)
		fp.p['speed'] = (fp.p['slow_anim']) ? fp.s['anim_speed'] * fp.s['anim_multiplier'] : fp.s['anim_speed'];
		
		// Set things back to the way they were
		fp.p['gal_size'] = 0;
		if (fp.p['type'] == 'div') {
			if (fp.p['ajax'])
				$('#flowerpotjs-div-inline').empty();
			else
				$(fp.p['src']).swap('#flowerpotjs-div-swap');
		}
		$('#flowerpotjs-media').empty(); // Empty the media div to prevent "invisible" playback
		
		if ($.browser.msie && $.browser.version < 8)
			html_objects.css('visibility', 'visible');
		
		// Fade out elements successively
		fp_contents.fadeOut(fp.p['speed']);
		gallery_links.dequeue();
		gallery_links.fadeOut(fp.p['speed']);
		fp_contents.queue(function() {
			fp_contents.dequeue();
			// Empty some divs, cleaning stuff up
			$('#flowerpotjs-contents').empty();
			$('#flowerpotjs-controls').remove();
			
			overlay.fadeOut(fp.p['speed']);
		});
		overlay.queue(function() {
			overlay.dequeue();
			if (($.browser.msie && $.browser.version < 8) || $.browser.opera)
				html_objects.css('visibility', 'visible');
			$('body').removeClass('flowerpot-active');
			
			// Reload the initial settings
			if (fp.p['old_set']) {
				$.extend(fp.s, fp.p['old_set']);
				fp.p['old_set'] = false;
			}
			
			// We're done: there's no more Flowerpot, and no overlay
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
	fp.locale = function(locale) {
		// Load custom settings passed via arguments
		$.extend(fp.l, locale);
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
	fp.resize = function(selector, size) {
		var fp_contents = $('#flowerpotjs-contents'),
		fp_description = $('#flowerpotjs-description'),
		fp_gallery_thumbnails = $('#flowerpotjs-controls-images'),
		height,
		object = $(selector),
		width,
		window_height = $(window).height(),
		window_width = $(window).width();
		
		// If no size if specified, use the size in
		// the properties (default behaviour)
		if (!size)
			size = fp.p['size'];
		
		// The max height + width should allow for some space
		// between the edge of the viewport and The Flowerpot's
		var max_height = window_height - window_height / 5,
		max_width = window_width - window_width / 5;
		
		// Use the max size allowed if this isn't an image
		height = (fp.p['dom_img'].height) ? fp.p['dom_img'].height : max_height;
		width = (fp.p['dom_img'].width) ? fp.p['dom_img'].width : max_width;
		// Allow sizes to be overriden, if either is set
		height = (size.height) ? size.height : height;
		width = (size.width) ? size.width : width;
		
		// If we're loading an image but only have one dimension,
		// resize the other dimension appropriately, to maintain
		// aspect ratio
		if (fp.p['dom_img'].width && size.width && !size.height)
			height = fp.p['dom_img'].height / (fp.p['dom_img'].width / size.width);
		if (fp.p['dom_img'].height && size.height && !size.width)
			width = fp.p['dom_img'].width / (fp.p['dom_img'].height / size.height);
		
		// Check to make sure The Flowerpot isn't too big for the
		// viewport; if it's too tall or too wide, resize it
		// without changing the aspect ratio
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
		
		// Adjust the size of the iframe overlay to compensate for scrollbars
		if (fp.p['type'] == 'iframe') {
			height -= 10;
			width -= 10;
		}
		
		// Round the values so we don't get pixels represented as floats
		// (which will lead to weird whitespace sometimes)
		height = Math.round(height);
		width = Math.round(width);
		
		// Apply the height and width values to the actual DOM element
		// we're loading, and to the enclosing "content" div
		object.height(height + 'px');
		object.width(width + 'px');
		fp_contents.css({
			'height': height + 'px',
			'width': width + 'px'
		});
		
		if ($.browser.msie && $.browser.version < 7) {
			fp.ie6_resize_overlay();
		} else {
			fp_contents.css({
				'margin-top': '-' + (height / 2) + 'px',
				'margin-left': '-' + (width / 2) + 'px'
			});
		}
		
		// The width of the description div is variable (based on the
		// width of the viewport), so recalucate its height and position
		if (fp.p['desc']) {
			$('#flowerpotjs-description-bg').css({height: fp_description.height()});
			$('#flowerpotjs-description,#flowerpotjs-description-bg').css({bottom: '-' + parseInt(fp_description.height() + 3) + 'px'});
		}
		
		// Make sure the gallery thumbnail links don't disappear by
		// continuing outside the viewport
		if (fp.s['gallery_thumbnails'] && fp.p['gal_size'] > 1) {
			while (fp_gallery_thumbnails.width() > window_width) {
				fp_gallery_thumbnails.height *= 2;
				fp_gallery_thumbnails.height += 2;
			}
		}
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
	fp.settings = function(settings) {
		// Load custom settings passed via arguments
		$.extend(fp.s, settings);
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
	fp.show = function() {
		// If for some reason this function gets called but the
		// overlay isn't active, don't do anything
		if (!fp.p['overlay'])
			return;
		
		var fp_contents = $('#flowerpotjs-contents'),
		fp_close = $('#flowerpotjs-close'),
		fp_description = $('#flowerpotjs-description'),
		overlay_span = $('#flowerpotjs-overlay span');
		
		if ($.browser.msie && $.browser.version < 8) {
			// Object and embed elements (usually Flash) 'under' The Flowerpot
			// can be problematic, so we hide them while the overlay is on.
			$('object,embed').css('visibility', 'hidden');
			$('#flowerpotjs-contents object,#flowerpotjs-contents embed').css('visibility', 'visible');
		}
		
		overlay_span.fadeOut(fp.p['speed']);
		fp_contents.fadeIn(fp.p['speed']);
		$('#flowerpotjs-description,#flowerpotjs-description-bg').css({bottom: '-' + parseInt(fp_description.height() + 3) + 'px'});
		fp_close.css({right: '-' + parseInt(fp_close.width() + 15) + 'px'});
		
		// If there are gallery thumbnails, apply some transparency to them,
		// and set the active one
		if (fp.p['gal_size'] > 1 && fp.s['gallery_thumbnails'])
			$('#flowerpotjs-controls-images').css({display: 'block', opacity: fp.s['aux_opacity']}).children('li').eq(fp.p['gal_i']).addClass('flowerpotjs-thumbnail-active');
		
		// If there's a description under The Flowerpot, account
		// for the space it takes up so it doesn't run under the
		// viewport
		if (fp_description.length > 0 && !($.browser.msie && $.browser.version == 6))
			fp_contents.css({'margin-top': parseInt(fp_contents.css('margin-top')) - parseInt(fp_description.height() * .25 + 3)});
		
		// The description has a transparent background set with JavaScript;
		// we position an empty div behind it and assign the description's
		// height to the empty div (we also set how far away the description
		// should be from the contents)
		$('#flowerpotjs-description-bg').css({height: parseInt(fp_description.height())});
		fp_contents.queue(function() {
			fp_contents.dequeue();
			overlay_span.dequeue();
			overlay_span.hide();
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
		$.extend(true, fp.p, {
			desc: false,
			dom_img: 0,
			overlay: false,
			ready: false,
			rel: $(this).attr('rel'),
			size: {},
			src: false,
			type: 'image'
		});
		// Load properties passed via argument
		$.extend(true, fp.p, props);
		
		// Get the src of the item to put in the gallery
		if (!fp.p['src'])
			// If there's a src[value] in the rel attribute, use
			// that as the src attribute; otherwise, use the
			// href attribute of the element that invoked The Flowerpot
			fp.p['src'] = (fp.p['rel'].match(/src\[([^ ]*)\]/i)) ? fp.p['rel'].replace(/.*src\[([^ ]*)\].*/i, '$1') : $(this).attr('href');
		
		// Only proceed to animate things if we have an src attribute
		if (fp.p['src'] && fp.p['src'] != '#') {
			// Load custom settings passed via argument
			fp.p['old_set'] = (!fp.p['old_set'] && settings) ? $.extend(fp.p['old_set'], fp.s) : fp.p['old_set'];
			$.extend(fp.s, settings);
			
			// Find out what type of overlay we're loading
			fp.p['type'] = fp.detect_type(fp.p['src'], fp.p['rel']);
			
			// Check for explicitly set height/width attributes
			var f_size = {};
			if (fp.p['rel'].match(/height\[([^ ]*)\]/i))
				f_size.height = fp.p['rel'].replace(/.*height\[([^ ]*)\].*/i, '$1');
			if (fp.p['rel'].match(/width\[([^ ]*)\]/i))
				f_size.width = fp.p['rel'].replace(/.*width\[([^ ]*)\].*/i, '$1');
			$.extend(fp.p, {
				size: f_size
			});
			
			// Selectors we'll access a few times
			var fp_contents = $('#flowerpotjs-contents'),
			fp_controls = $('#flowerpotjs-controls'),
			gallery_links = $('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg'),
			html_objects = $('object,embed'),
			overlay = $('#flowerpotjs-overlay'),
			// Strings to store HTML
			content = '',
			controls = '',
			// Misc. variables, mostly used in gallery
			id,
			o_size,
			gallery_item,
			gallery_item_link_text,
			i,
			rel,
			src;
			
			// Set the current animation speed (and multiply it if slowdown is on)
			fp.p['speed'] = (fp.p['slow_anim']) ? fp.s['anim_speed'] * fp.s['anim_multiplier'] : fp.s['anim_speed'];
			
			// Load a description. The Flowerpot looks for a description from three places:
			//
			// 		1. 'desc' from the 'properties' array
			//
			// 		2. an element with the same id as the element that invoked
			// 			The Flowerpot, with the suffix "-flowerpot-description"
			//
			// 		3. the "title" attribute of the element that invoked The Flowerpot
			if (!fp.p['desc']) {
				fp.p['desc'] = $('#' + $(this).attr('id') + '-flowerpot-description');
				fp.p['desc'] = (fp.p['desc'].length > 0) ? fp.p['desc'].html() : $(this).attr('title');
			}
			
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
			
			// Build the HTML for the inside of the overlay
			switch (fp.p['type']) {
				case 'div':
					// Figure out if we're using ajax or inline content
					id = fp.p['src'];
					if (id.substr(0, 1) == '#') {
						id = id.substr(1, id.length - 1);
						fp.p['ajax'] = false;
					} else {
						fp.p['ajax'] = true;
					}
					content = '<div id="flowerpotjs-div-inline"><div id="flowerpotjs-div-swap" style="display:none;"></div></div>';
					break;
				case 'iframe':
					content = '<iframe id="flowerpotjs-iframe-inline" src="' + fp.p['src'] + '"></iframe>';
					break;
				case 'image':
					content = '<img alt="Image overlay" src="' + fp.p['src'] + '" id="flowerpotjs-image" />';
					break;
				case 'vimeo':
					o_size = $.extend({width: 400, height: 300}, fp.p['size']);
					
					fp.p['src'] = fp.p['src'].replace(/https?:\/\/(www\.)?vimeo\.com\/(\d*)/i, '$2');
					content = '<div id="flowerpotjs-media"><object id="flowerpotjs-media-vimeo" name="flowerpotjs-media-vimeo" width="' + o_size.width + '" height="' + o_size.height + '"><param name="allowfullscreen" value="true"><param name="allowscriptaccess" value="always"><param name="movie" value="http://vimeo.com/moogaloop.swf?clip_id=' + fp.p['src'] + '&amp;server=vimeo.com&amp;show_title=1&amp;show_byline=1&amp;show_portrait=0&amp;fullscreen=1" /><embed src="http://vimeo.com/moogaloop.swf?clip_id=' + fp.p['src'] + '&amp;server=vimeo.com&amp;show_title=1&amp;show_byline=1&amp;show_portrait=0&amp;fullscreen=1" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="' + o_size.width + '" height="' + o_size.height + '"></embed></object></div>';
					break;
				case 'youtube':
					o_size = $.extend({width: 480, height: 385}, fp.p['size']);
					
					fp.p['src'] = fp.p['src'].replace(/watch\?v=/i, 'v/');
					content = '<div id="flowerpotjs-media"><object id="flowerpotjs-media-youtube" name="flowerpotjs-media-youtube" width="' + o_size.width + '" height="' + o_size.height + '"><param name="movie" value="' + fp.p['src'] + '&fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="' + fp.p['src'] + '" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="' + o_size.width + '" height="' + o_size.height + '"></embed></object></div>';
					break;
			}
			
			// If this is a gallery with more than one item, add
			// prev/next controls to it
			if (fp_controls.length == 0 && fp.p['gal_size'] > 1) {
				controls = '<div id="flowerpotjs-controls"><span id="flowerpotjs-prev-link-bg" class="flowerpotjs-gallery-link-bg"></span><a href="#prev" id="flowerpotjs-prev-link" class="flowerpotjs-gallery-link" rel="' + fp.p['rel'] + '">' + fp.l['previous'] + '</a><span id="flowerpotjs-next-link-bg" class="flowerpotjs-gallery-link-bg"></span><a href="#next" id="flowerpotjs-next-link" class="flowerpotjs-gallery-link" rel="' + fp.p['rel'] + '">' + fp.l['next'] + '</a>';
				if (fp.s['gallery_thumbnails']) {
					controls += '<ul id="flowerpotjs-controls-images">';
					for (i = 0; i < fp.p['gal_size']; i++) {
						gallery_item = fp.p['gal_s'].eq(i);
						rel = gallery_item.attr('rel');
						src = (rel.match(/src\[([^ ]*)\]/i)) ? rel.replace(/.*src\[([^ ]*)\].*/i, '$1') : gallery_item.attr('href');
						
						switch (fp.detect_type(src, rel)) {
							case 'image':
								gallery_item_link_text = '<img src="' + src + '" height="' + fp.s['thumbnail_height'] + '" />';
								break;
							case 'youtube':
								gallery_item_link_text = '<img src="' + 'http://img.youtube.com/vi/' + src.replace(/.*v(=|\/)([^&#]*).*/i, '$2') + '/3.jpg' + '" height="' + fp.s['thumbnail_height'] + '" />';
								break;
							default:
								gallery_item_link_text = '<span style="height:' + Math.round(fp.s['thumbnail_height'] * .75) + 'px;padding-top:' + Math.round(fp.s['thumbnail_height'] * .25) + 'px;">' + parseInt(i + 1) + '</span>';
								break;
						}
						
						controls += '<li><a href="' + gallery_item.attr('href') + '" rel="' + rel + ' gid[' + i + ']" class="flowerpotjs-gallery-index-link">' + gallery_item_link_text + '</a></li>';
					}
					controls += '</ul>';
				}
				controls += '</div>';
			}
			
			// If there's a description available, add it to the HTML
			if (fp.p['desc'])
				content += '<div id="flowerpotjs-description-bg"></div><div id="flowerpotjs-description">' + fp.p['desc'] + '</div>';
			// Added the "close" link to the HTML
			content += '<a href="#close" id="flowerpotjs-close">' + fp.l['close'] + '</a>';
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
			$('#flowerpotjs-close,#flowerpotjs-description,#flowerpotjs-description-bg').css({
				'-moz-border-radius': '3px',
				'-webkit-border-radius': '2px'
			});
			$('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg').css({
				'-moz-border-radius': '3px',
				'-webkit-border-radius': '2px'
			}).fadeIn(fp.p['speed']);
			
			// And we're off to the races!
			// Load the remote content into the DOM, or swap the inline div with a placeholder
			switch (fp.p['type']) {
				case 'div':
					fp.resize('#flowerpotjs-div-inline');
					if (fp.p['ajax']) { // Set variables here, in case there
										// are global ajax settings
						$.ajax({
							type: 'GET',
							async: false,
							url: fp.p['src'],
							dataType: 'text',
							success: function(result) { // We expect HTML (plaintext) from
														// a GET request...
								$('#flowerpotjs-div-inline').html(result);
							},
							error: function(request, status, error) { // ... so if we don't get
																	  // what we expected, complain
								$('#flowerpotjs-div-inline').html(fp.l['ajax_error']);
							}
						});
					} else {
						$(fp.p['src']).swap('#flowerpotjs-div-swap');
					}
					fp.show();
					break;
				case 'iframe':
					fp.resize('#flowerpotjs-iframe-inline');
					fp.show();
					break;
				case 'image':
					if ($.browser.opera) { // Opera acts a little weird with .load(), so we have
										   // a special case for it
						fp.image();
						fp.show();
					} else {
						$('#flowerpotjs-image').load(function callback(event) {
							if (fp.p['type'] == 'image')
								fp.image();
							if ($.browser.msie && $.browser.version >= 7) {
								fp.show();
							} else {
								$(fp.p['dom_img']).load(function() {
									fp.show();
								});
							}
						});
					}
					break;
				case 'vimeo':
					fp.resize('#flowerpotjs-media', o_size);
					fp.show();
					break;
				case 'youtube':
					fp.resize('#flowerpotjs-media', o_size);
					fp.show();
					break;
			}
			
			// Just in case the overlay isn't there, load it in after the
			// contents have been loaded
			fp_contents.queue(function() {
				fp_contents.dequeue();
				overlay.show();
			});
		} else {
			// Reset the gallery count, as we aren't loading anything
			fp.p['gal_size'] = 0;
			fp.p['type'] = 'image';
			
			// Hide the overlay -- useful if we're in a gallery
			fp.hide();
			
			// Throw an error so the page creator knows something's up
			throw('Attempted to load an overlay using The Flowerpot, but the src value was invalid or null.');
		}
		
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
		var element_a = this[0],
		temp = element_a.parentNode.insertBefore(document.createTextNode(''), element_a);
		
		element_b.parentNode.insertBefore(element_a, element_b);
		temp.parentNode.insertBefore(element_b, temp);
		temp.parentNode.removeChild(temp);
		
		return this;
	};
	
	// Initialize The Flowerpot when the DOM is ready
	$().ready(function() {
		fp.init();
	});
})(jQuery); // Load in the jQuery global variable to maintain compability,
			// i.e. in case another framework or variable is using "$"