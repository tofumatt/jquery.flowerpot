/**
 * Flowerpot
 *
 * A jQuery plugin to overlay images, inline content, and more.
 * Dual-licensed under the MIT and GPL (v2 or later) licenses.
 *
 * Copyright (c) 2009-2011, Matthew Riley MacPherson
 * Dual-licensed under the MIT and GPL (v2 or later) licenses.
 * https://github.com/tofumatt/jquery.flowerpot/
 */
// HTML plants in an overlayed pot!

;(function($, undefined) {
	var animationSpeed = 500, // in ms
	animationSpeedQuick = 10, // in ms
	currentFlowerpotElement,
	// Selectors watched with jQuery().live() -- lightbox is included for compatibility
	defaultSelector = 'a.flowerpot,a.lightbox',
	// HTML to use when inserting The Flowerpot into the DOM
	htmlContainer = '<div id="flowerpot-js-container" />',
	htmlLoading = '<div id="flowerpot-js-loading" />',
	htmlOverlay = '<div id="flowerpot-js-overlay" />',
	htmlOverlayContents = '<div id="flowerpot-js-contents" />',
	htmlOverlayDescription = '<div id="flowerpot-js-description" />',
	htmlControlsClose = '<a id="flowerpot-js-controls-close" href="#close">X</a>',
	// Group elements and current index
	groupElements = [],
	groupIndex = 0,
	groupName,
	// Main image node
	imageNode,
	// Proposed max width/height for an overlay
	initialHeight,
	initialWidth,
	// Store library state
	isLoading = false,
	// Overlay size and info
	overlayHeight,
	overlayWidth,
	// Regexes and type strings
	regexImage = /\.(png|jpg|jpeg|gif|bmp)\??(.*)?$/i,
	regexExternal = /^.*:\/\/.*/i,
	regexGroup = /(?:.*\w+)?gallery\[(.*)\](?:\w+.*)?/i,
	regexTypeImage = /.*\w+(image)\w+.*/i,
	regexTypeHTML = /.*\w+(ajax|div)\w+.*/i,
	regexTypeIframe = /.*\w+(iframe)\w+.*/i,
	regexTypeVimeo = /.*\w+(vimeo)\w+.*/i,
	regexTypeYoutube = /.*\w+(youtube)\w+.*/i,
	regexVimeo = /vimeo\.com/i,
	regexYoutube = /youtube\.com/i,
	// State variables
	stateLoadingInterval,
	// Strings for types
	typeHTML = 'html',
	typeImage = 'image',
	typeIframe = 'iframe',
	typeVimeo = 'vimeo',
	typeYoutube = 'youtube',
	// By default, the type is an image
	type = typeImage,
	
	// Detect the type of overlay to load
	// Sets the type overlay that should be loaded based
	// on information in the rel attribute (and optionally
	// through automatic type detection).
	_detectType = function() {
		if (src.match(regexImage)) {
			type = typeImage;
		} else if (!src.match(regexExternal) || src.match(window.location.host)) {
			type = typeHTML;
		} else if (src.match(regexVimeo)) {
			type = typeVimeo;
		} else if (src.match(regexYoutube)) {
			type = typeYoutube;
		} else {
			type = typeIframe;
		}
		
		// Check for the type to load (overrides automatic type detection)
		if (rel.match(regexTypeImage)) {
			type = typeImage;
		} else if (rel.match(regexTypeHTML)) {
			type = typeHTML;
		} else if (rel.match(regexTypeIframe)) {
			type = typeIframe;
		} else if (rel.match(regexTypeVimeo)) {
			type = typeVimeo;
		} else if (rel.match(regexTypeYoutube)) {
			type = typeYoutube;
		}
	},
	
	_loadingAnimation = function() {
		$(htmlLoading).fadeIn(animationSpeed);
		
		stateLoadingInterval = setInterval(function() {
			$(htmlLoading).html("•&nbsp;&nbsp;");
			
			setTimeout(function() {
				$(htmlLoading).html("&nbsp;•&nbsp;");
			}, animationSpeed / 2);
			
			setTimeout(function() {
				$(htmlLoading).html("&nbsp;&nbsp;•");
			}, animationSpeed);
		}, animationSpeed * 1.5);
	},
	
	_resize = function() {
		// If no size if specified, use the size in
		// the properties (default behaviour)
		// if (!size)
		// 	size = fp.p['size'];
		var windowHeight = $(window).height(),
		windowWidth = $(window).width(),
		// The max height + width should allow for some space
		// between the edge of the viewport and the overlay.
		maxHeight = windowHeight - windowHeight / 10,
		maxWidth = windowWidth - windowWidth / 10;
		
		// Use the max size allowed if this isn't an image
		overlayHeight = (type == typeImage && imageNode) ? initialHeight : maxHeight;
		overlayWidth = (type == typeImage && imageNode) ? initialWidth : maxWidth;
		
		/*
		// Allow sizes to be overriden, if either is set
		overlayHeight = (size && size.height) ? size.height : height;
		overlayWidth = (size && size.width) ? size.width : width;
		
		// If we're loading an image but only have one dimension,
		// resize the other dimension appropriately, to maintain
		// aspect ratio.
		if (size !== undefined && type == typeImage) {
			if (imageNode.attr('width') && width && !height) {
				overlayHeight = imageNode.attr('height') / (imageNode.attr('width') / width);
			}
			
			if (imageNode.attr('height') && height && !width) {
				overlayWidth = imageNode.attr('width') / (imageNode.attr('height') / height);
			}
		}
		*/
		
		// Check to make sure the overlay isn't too big for the
		// viewport; if it's too tall or too wide, resize it
		// without changing the aspect ratio.
		if (overlayWidth > maxWidth) {
			overlayHeight = overlayHeight * (maxWidth / overlayWidth);
			overlayWidth = maxWidth;
			if (overlayHeight > maxHeight) {
				overlayWidth = overlayWidth * (maxHeight / overlayHeight);
				overlayHeight = maxHeight;
			}
		} else if (overlayHeight > maxHeight) {
			overlayWidth = overlayWidth * (maxHeight / overlayHeight);
			overlayHeight = maxHeight;
			if (overlayWidth > maxWidth) {
				overlayHeight = overlayHeight * (maxWidth / overlayWidth);
				overlayWidth = maxWidth;
			}
		}
		
		// Adjust the size of the iframe overlay to compensate for scrollbars
		if (type === typeIframe) {
			height -= 10;
			width -= 10;
		}
		
		// Round the values so we don't get pixels represented as floats
		// (which will lead to weird whitespace sometimes)
		overlayHeight = Math.round(overlayHeight);
		overlayWidth = Math.round(overlayWidth);
		
		// Apply the height and width values to the actual DOM element
		// we're loading, and to the enclosing "content" div
		$(htmlOverlayContents).animate({
			height: overlayHeight + 'px',
			left: (($(window).width() / 2) - (overlayWidth / 2)) + 'px',
			top: (($(window).height() / 2) - (overlayHeight / 2) - 16) + 'px',
			width: overlayWidth + 'px'
		}, animationSpeedQuick);
		
		$(htmlOverlayDescription).animate({
			top: (($(window).height() / 2) + (overlayHeight / 2)) + 'px'
		}, animationSpeedQuick);
		
		$(htmlControlsClose).animate({
			left: (($(window).width() / 2) - (overlayWidth / 2)) + 'px',
			'margin-left': (overlayWidth - 8.5) + 'px',
			top: (($(window).height() / 2) - (overlayHeight / 2) - 16) + 'px'
		}, animationSpeedQuick);
	},
	
	_stopLoadingAnimation = function() {
		if (stateLoadingInterval !== undefined) {
			$(htmlLoading).fadeOut(animationSpeed);
			
			$(htmlLoading).queue(function() {
				$(htmlLoading).html('');
				clearInterval(stateLoadingInterval);
				$(htmlLoading).dequeue();
			});
			
			clearInterval(stateLoadingInterval);
		}
		
		isLoading = false;
	};
	
	/**
	 * Display an overlay
	 *
	 * TODO: Document more...
	 *
	 * @return {jQuery} Return jQuery to allow method chaining
	 * @author Matthew Riley MacPherson matt@servicepoint.ca
	 */
	$.fn.flowerpot = function(args) {
		// Don't operate on selectors that don't return elements.
		if (!$(this).length) {
			return;
			// return this;
		}
		
		// If args is undefined we should substitute in an empty object.
		if (args === undefined) {
			args = {};
		}
		
		// Reference the current Flowerpot'd element.
		currentFlowerpotElement = this;
		
		// Don't try to load an overlay if we're currently processing one.
		if (isLoading) {
			return;
		}
		
		// Now we're loading the overlay; blur the activated element to prevent
		// outline styles and extra events that can fire from a focus state.
		isLoading = true;
		$(this).blur();
		
		// Load up the "loading" overlay.
		$.flowerpot.loading();
		
		imageNode = $('<img id="flowerpot-js-image" src="' + $(this).attr('href') + '" />');
		$(htmlOverlayContents).html(imageNode);
		
		_buildGroup();
		
		$(imageNode).load(function(event) {
			initialHeight = imageNode.attr('height'),
			initialWidth = imageNode.attr('width');
			$.flowerpot.show();
		});
		
		// Return this object so we can jQuery method chain.
		return this;
	};
	
	$.flowerpot = function(selector) {
		$(selector).live('click', function(e) {
			e.preventDefault();
			
			$(this).flowerpot();
		});
	};
	
	$.flowerpot.hide = function() {
		if (!isLoading) {
			$.each([htmlOverlay, htmlOverlayContents, htmlOverlayDescription, htmlControlsClose], function(i, element) {
				$(element).animate({opacity: 0}, animationSpeed / 2);
			});
		} else {
			_stopLoadingAnimation();
		}
		
		setTimeout(function() {
			$.each([htmlOverlay, htmlOverlayContents, htmlOverlayDescription, htmlControlsClose], function(i, element) {
				$(element).hide();
			});
			$(htmlOverlayContents).css({opacity: 1});
			$(htmlOverlayDescription).css({opacity: 0.85})
			$(htmlControlsClose).css({opacity: 1});
		}, animationSpeed * 2);
	};
	
	$.flowerpot.init = function() {
		// Insert the basic Flowerpot HTML into the DOM.
		$('body').append($(htmlContainer).append(htmlOverlay, htmlLoading, htmlOverlayContents, htmlOverlayDescription, htmlControlsClose));
		
		// Assign the variables to actual DOM elements rather than using selectors.
		htmlContainer = $('#flowerpot-js-container'),
		htmlLoading = $('#flowerpot-js-loading'),
		htmlOverlay = $('#flowerpot-js-overlay'),
		htmlOverlayContents = $('#flowerpot-js-contents'),
		htmlOverlayDescription = $('#flowerpot-js-description'),
		htmlControlsClose = $('#flowerpot-js-controls-close');
		
		// Assign a Flowerpot event to every <a> element with the class "flowerpot" and "lightbox".
		$(defaultSelector).live('click', function(e) {
			e.preventDefault();
			
			$(this).flowerpot();
		});
		
		// Allow the overlay to be closed by clicking on the background or the "close" link.
		$('#flowerpot-js-overlay,#flowerpot-js-controls-close').click(function(e) {
			e.preventDefault();
			
			$.flowerpot.hide();
		});
		
		// Attach an event fired on event resize to make sure the overlay doesn't exceed the
		// viewport's height/width.
		$(window).resize(function(e) {
			_resize();
		});
	};
	
	$.flowerpot.loading = function() {
		$(htmlOverlay).show();
		_loadingAnimation();
	};
	
	$.flowerpot.resize = function() {
		_resize();
	};
	
	$.flowerpot.show = function() {
		_resize();
		
		$(htmlOverlay).animate({opacity: 0.99}, animationSpeed);
		$.each([htmlOverlayContents, htmlControlsClose], function(i, element) {
			$(element).fadeIn(animationSpeed);
		});
		
		if ($(currentFlowerpotElement).attr('title')) {
			$(htmlOverlayDescription).html($(currentFlowerpotElement).attr('title')).fadeIn(animationSpeed);;
		}
		
		htmlOverlayDescription
		_stopLoadingAnimation();
	};
	
	$(document).ready(function() {
		$.flowerpot.init();
	});
})(jQuery); // Load in the jQuery global variable to maintain compability,
            // i.e. in case another framework or variable is using "$"
