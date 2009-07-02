/**
 * The Flowerpot
 *
 * A jQuery plugin to overlay images, inline content, and more.
 * Dual-licensed under the MIT and GPL (v2 or later) licenses.
 *
 * @package		The Flowerpot
 * @version		HEAD
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
			'ajax_error': 'An error occurred during the request.', // HTML to display when we
																   // have a catchable AJAX error
			'close': 'Close', // alt text for close image (should be text, not html)
			'loading': 'Loading... "Esc" to close', // html that appears when the image is loading
			'next': 'Next →', // html inside the gallery "next" link
			'previous': '← Previous' // html inside the gallery "previous" link
		};
		this.p = { // Internal data members -- you can modify them dynamically
				   // when you invoke a Flowerpot
			ajax: false,
			description: false,
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
	};
	
	// Set a local variable to reference The Flowerpot
	// to save space (and typing)
	var fp = $.the_flowerpot;
	
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
	fp.image = function(selector) {
		fp.p['dom_img'] = new Image();
		// Create an event listener to resize the image when the
		// image loads (in case the image is bigger than the viewport)
		$(fp.p['dom_img']).load(function() {
			fp.resize(selector);
		});
		// Set the internal DOM image based on the image tag
		// inside The Flowerpot
		fp.p['dom_img'].src = $(selector).attr('src');
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
		
		if (typeof(index) == 'number') { // Go right to the requested index
			fp.p['gal_i'] = index;
		} else if (index == 'prev') { // Move back (possibly looping around)
			fp.p['gal_i']--;
			if (fp.p['gal_i'] < 0)
				fp.p['gal_i'] = fp.p['gal_size'] - 1;
		} else if (index == 'next') { // Move ahead (possibly looping around)
			fp.p['gal_i']++;
			if (fp.p['gal_i'] >= fp.p['gal_size'])
				fp.p['gal_i'] = 0;
		}
		
		// If the previous index was an inline div, swap the
		// placeholder back into The Flowerpot
		if (fp.p['src'] && !fp.p['ajax'] && fp.p['type'] == 'div')
			$(fp.p['src']).swap('#flowerpotjs-div-swap');
		
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
		var fp_contents = $('#flowerpotjs-contents');
		var gallery_links = $('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg');
		var html_objects = $('object,embed');
		var overlay = $('#flowerpotjs-overlay');
		
		// Set the animation speed (in case we're modifying it)
		if (fp.p['slow_anim'])
			fp.p['speed'] = fp.s['anim_speed'] * fp.s['anim_multiplier'];
		else
			fp.p['speed'] = fp.s['anim_speed'];
		
		// Set things back to the way they were
		fp.p['gal_size'] = 0;
		if (fp.p['type'] == 'div') {
			if (fp.p['ajax'])
				$('#flowerpotjs-div-inline').empty();
			else
				$(fp.p['src']).swap('#flowerpotjs-div-swap');
		}
		if ($.browser.msie && $.browser.version < 8)
			html_objects.css('visibility', 'visible');
		
		// Fade out elements successively
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
			
			// Reload the initial settings
			if (fp.p['old_set'])
				$.extend(fp.s, fp.p['old_set']);
			
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
		var fp_contents = $('#flowerpotjs-contents');
		var height;
		var object = $(selector);
		var width;
		var window_height = $(window).height();
		var window_width = $(window).width();
		
		// If no size if specified, use the size in
		// the properties (default behaviour)
		if (!size)
			size = fp.p['size'];
		
		// The max height + width should allow for some space
		// between the edge of the viewport and The Flowerpot's
		var max_height = window_height - window_height / 5;
		var max_width = window_width - window_width / 5;
		
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
			$('#flowerpotjs-description-bg').animate({
				height: $('#flowerpotjs-description').height()
			}, fp.p['speed'] / 2);
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
		$.extend(true, fp.p, {
			description: false,
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
		if (!fp.p['src']) {
			// If there's a src[value] in the rel attribute, use
			// that as the src attribute; otherwise, use the
			// href attribute of the element that invoked The Flowerpot
			if (fp.p['rel'].match(/src\[([^ ]*)\]/i))
				fp.p['src'] = fp.p['rel'].replace(/.*src\[([^ ]*)\].*/i, '$1');
			else
				fp.p['src'] = $(this).attr('href');
		}
		
		// Only proceed to animate things if we have an src attribute
		if (fp.p['src'] && fp.p['src'] != '#') {
			// Load custom settings passed via argument
			fp.p['old_set'] = (!fp.p['old_set'] && settings) ? $.extend(fp.p['old_set'], fp.s) : false;
			$.extend(fp.s, settings);
			
			// Check for the type to load (if neither are true it's an image)
			if (fp.p['rel'].match(/iframe/i)) // Flowerpot inline frame
				fp.p['type'] = 'iframe';
			else if (fp.p['rel'].match(/div/i)) // Flowerpot inline div
				fp.p['type'] = 'div';
			
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
			var fp_contents = $('#flowerpotjs-contents');
			var fp_controls = $('#flowerpotjs-controls');
			var gallery_links = $('.flowerpotjs-gallery-link,.flowerpotjs-gallery-link-bg');
			var html_objects = $('object,embed');
			var overlay = $('#flowerpotjs-overlay');
			
			// Set the current animation speed (and multiply it if slowdown is on)
			if (fp.p['slow_anim'])
				fp.p['speed'] = fp.s['anim_speed'] * fp.s['anim_multiplier'];
			else
				fp.p['speed'] = fp.s['anim_speed'];
			
			// Load a description. The Flowerpot looks for a description from three places:
			//
			// 		1. 'description' from the 'properties' array
			//
			// 		2. an element with the same id as the element that invoked
			// 			The Flowerpot, with the suffix "-flowerpot-description"
			//
			// 		3. the "title" attribute of the element that invoked The Flowerpot
			var description = fp.p['description'];
			if (!description) {
				description = $('#' + $(this).attr('id') + '-flowerpot-description');
				description = (description.length > 0) ? description.html() : $(this).attr('title');
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
			var content = '';
			var controls = '';
			if (fp.p['type'] == 'image') { // Image
				content = '<img alt="Image overlay" src="' + fp.p['src'] + '" id="flowerpotjs-image" />';
			} else if (fp.p['type'] == 'div') { // Inline div
				// Figure out if we're using ajax or inline content
				var id = fp.p['src'];
				if (id.substr(0, 1) == '#') {
					id = id.substr(1, id.length - 1);
					fp.p['ajax'] = false;
				} else {
					fp.p['ajax'] = true;
				}
				content = '<div id="flowerpotjs-div-inline"><div id="flowerpotjs-div-swap" style="display: none;"></div></div>';
			} else if (fp.p['type'] == 'iframe') { // Inline frame
				// Figure out if we're using ajax or inline content
				content = '<iframe id="flowerpotjs-iframe-inline" src="' + fp.p['src'] + '"></iframe>';
			}
			
			// If this is a gallery with more than one item, add
			// prev/next controls to it
			if (fp.p['gal_size'] > 1)
				controls = '<div id="flowerpotjs-controls"><span id="flowerpotjs-prev-link-bg" class="flowerpotjs-gallery-link-bg"></span><a href="#prev" id="flowerpotjs-prev-link" class="flowerpotjs-gallery-link" rel="' + fp.p['rel'] + '">' + fp.l['previous'] + '</a><span id="flowerpotjs-next-link-bg" class="flowerpotjs-gallery-link-bg"></span><a href="#next" id="flowerpotjs-next-link" class="flowerpotjs-gallery-link" rel="' + fp.p['rel'] + '">' + fp.l['next'] + '</a></div>';
			
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
			if (fp.p['type'] == 'image') {
				if ($.browser.opera) { // Opera acts a little weird with .load(), so we have
									   // a special case for it
					fp.image('#flowerpotjs-image');
					fp.show();
				} else {
					$('#flowerpotjs-image').load(function callback(event) {
						if (fp.p['type'] == 'image')
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
			} else if (fp.p['type'] == 'iframe') {
				fp.resize('#flowerpotjs-iframe-inline');
				fp.show();
			}
			fp_contents.queue(function() {
				fp_contents.dequeue();
				overlay.show();
			});
		} else {
			// Reset the gallery count, as we aren't loading anything
			fp.p['gal_size'] = 0;
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
})(jQuery); // Load in the jQuery global variable to maintain compability,
			// i.e. in case another framework or variable is using "$".