/*!
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

(function($, undefined) {
	if ($ === undefined) {
		throw('jQuery is undefined, so Flowerpot is nigh unusable. You should define the jQuery global, as Flowerpot looks for it.');
	}
	
	var animationSpeed = 500, // in ms
	animationSpeedQuick = 10, // in ms
	currentFlowerpotElement,
	// Selectors watched with jQuery().live() -- lightbox is included for compatibility
	defaultSelector = 'a.flowerpot,a.lightbox',
	// href attribute (or programmed source) of Flowerpot'd element
	href,
	// HTML to use when inserting The Flowerpot into the DOM
	htmlContainer = '<div id="flowerpot-js-container" />',
	htmlLoading = '<div id="flowerpot-js-loading" />',
	htmlOverlay = '<div id="flowerpot-js-overlay" />',
	htmlOverlayContents = '<div id="flowerpot-js-contents" />',
	htmlOverlayDescription = '<div id="flowerpot-js-description" />',
	htmlControlsClose = '<a id="flowerpot-js-controls-close" href="#close">X</a>',
	htmlControlsNext = '<a id="flowerpot-js-controls-next" href="#next">›</a>',
	htmlControlsPrevious = '<a id="flowerpot-js-controls-previous" href="#previous">‹</a>',
	htmlSwapDiv,
	// Group elements and current index
	groupElements = [],
	groupIndex = 0,
	groupName,
	groupPositionNext = -1,
	groupPositionPrevious = -2,
	// Main image node
	imageNode,
	// Proposed max width/height for an overlay
	initialHeight,
	initialWidth,
	// Store library state
	isActive = false,
	isLoading = false,
	// These get used inside the resize method
	maxHeight,
	maxWidth,
	// Assinine optimizations for minification
	optimizeDot = '•',
	optimizeNBSP = ' ',
	// Overlay size and info
	overlayHeight,
	overlayWidth,
	// Rel attribute of the current element
	rel,
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
	stateWindowResizeInterval = null,
	// Strings for types
	typeHTML = 'html',
	typeImage = 'image',
	typeIframe = 'iframe',
	typeVimeo = 'vimeo',
	typeYoutube = 'youtube',
	// By default, the type is an image
	type = typeImage,
	// Stored here for easy access and minification fun (that's right, I care
	// about the four characters used from an extra `var `)
	windowHeight,
	windowWidth,
	windowResizeTime = 300, // Only calculate window resizes every 300ms
	
	_buildGroup = function() {
		if (currentFlowerpotElement === undefined || currentFlowerpotElement === null) {
			return;
		}
		
		if (!rel) {
			groupElements = [];
			return;
		}
		
		var match = rel.match(regexGroup);
		
		if (!match || match.length < 2) {
			groupElements = [];
			return;
		}
		
		groupElements = $('a.flowerpot[rel=gallery\\[' + match[1] + '\\]]');
	},
	
	// Detect the type of overlay to load
	// Sets the type overlay that should be loaded based
	// on information in the rel attribute (and optionally
	// through automatic type detection).
	_detectType = function() {
		if (href.match(regexImage)) {
			type = typeImage;
		} else if (!href.match(regexExternal) || href.match(window.location.host)) {
			type = typeHTML;
		} else if (href.match(regexVimeo)) {
			type = typeVimeo;
		} else if (href.match(regexYoutube)) {
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
	
	// Move the gallery index
	// Load a photo from the current gallery based on the index
	// number supplied.
	_galleryMove = function(index) {
		if (index === groupIndex) { // Don't do anything if we're already
		                            // at the requested index
			return false;
		}
		
		isLoading = true;
		
		if (index === groupPositionPrevious) { // Move back (possibly looping around)
			groupIndex--;
			
			if (groupIndex < 0) {
				groupIndex = groupElements.length - 1;
			}
		} else if (index === groupPositionNext) { // Move ahead (possibly looping around)
			groupIndex++;
			
			if (groupIndex >= groupElements.length) {
				groupIndex = 0;
			}
		} else { // Go right to the requested index
			groupIndex = index;
		}
		
		// If the previous index was an inline div, swap the
		// placeholder back into The Flowerpot
		// if (fp.p['src'] && !fp.p['ajax'] && fp.p['type'] == 'div')
		// 	$(fp.p['src']).swap('#flowerpotjs-div-swap');
		
		// Select the gallery element and grow a Flowerpot
		currentFlowerpotElement = groupElements[groupIndex];
		
		$.flowerpot.show();
	},
	
	_loadingAnimation = function() {
		$(htmlLoading).fadeIn(animationSpeed);
		
		stateLoadingInterval = setInterval(function() {
			$(htmlLoading).html(optimizeDot + optimizeNBSP + optimizeNBSP);
			
			setTimeout(function() {
				$(htmlLoading).html(optimizeNBSP + optimizeDot + optimizeNBSP);
			}, animationSpeed / 2);
			
			setTimeout(function() {
				$(htmlLoading).html(optimizeNBSP + optimizeNBSP + optimizeDot);
			}, animationSpeed);
		}, animationSpeed * 1.5);
	},
	
	_resize = function() {
		windowHeight = $(window).height();
		windowWidth = $(window).width();
		// The max height + width should allow for some space
		// between the edge of the viewport and the overlay.
		maxHeight = windowHeight - windowHeight / 10;
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
			overlayHeight -= 10;
			overlayWidth -= 10;
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
		
		$(htmlOverlayDescription).css({
			top: (($(window).height() / 2) + (overlayHeight / 2)) + 'px'
		});
		
		$(htmlControlsClose).animate({
			left: (($(window).width() / 2) - (overlayWidth / 2)) + 'px',
			'margin-left': (overlayWidth - 8.5) + 'px',
			top: (($(window).height() / 2) - (overlayHeight / 2) - 16) + 'px'
		}, animationSpeedQuick);
		
		if (groupElements.length) {
			$(htmlControlsNext).animate({
				left: (($(window).width() / 2) - (overlayWidth / 2)) + 'px',
				'margin-left': (overlayWidth - 8.5) + 'px'
			}, animationSpeedQuick);
		
			$(htmlControlsPrevious).animate({
				left: (($(window).width() / 2) - (overlayWidth / 2) - 12.5) + 'px',
				'margin-right': overlayWidth + 'px'
			}, animationSpeedQuick);
		}
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
		
		// Show the actual content
		$.flowerpot.show();
		
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
			$.each([htmlOverlay, htmlOverlayContents, htmlOverlayDescription, htmlControlsClose, htmlControlsNext, htmlControlsPrevious], function(i, element) {
				$(element).animate({opacity: 0}, animationSpeed / 2);
			});
		} else {
			_stopLoadingAnimation();
		}
		
		setTimeout(function() {
			if (type === typeHTML) {
				$(jQuery(currentFlowerpotElement).attr('href')).swap('#flowerpot-js-swap');
			}
			
			$.each([htmlOverlay, htmlOverlayContents, htmlOverlayDescription, htmlControlsClose, htmlControlsNext, htmlControlsPrevious], function(i, element) {
				$(element).hide().css({opacity: 1});
			});
			$(htmlOverlayDescription).css({opacity: 0.85});
			$(htmlOverlay).css({opacity: 0});
			isActive = false;
		}, animationSpeed * 2);
	};
	
	$.flowerpot.init = function() {
		// Insert the basic Flowerpot HTML into the DOM.
		$('body').append($(htmlContainer).append(htmlOverlay, htmlLoading, htmlOverlayContents, htmlOverlayDescription, htmlControlsClose, htmlControlsNext, htmlControlsPrevious));
		
		// Assign the variables to actual DOM elements rather than using selectors.
		htmlContainer = $('#flowerpot-js-container');
		htmlLoading = $('#flowerpot-js-loading');
		htmlOverlay = $('#flowerpot-js-overlay');
		htmlOverlayContents = $('#flowerpot-js-contents');
		htmlOverlayDescription = $('#flowerpot-js-description');
		htmlControlsClose = $('#flowerpot-js-controls-close');
		htmlControlsNext = $('#flowerpot-js-controls-next');
		htmlControlsPrevious = $('#flowerpot-js-controls-previous');
		
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
		
		// Go to the previous gallery item when the "previous" arrow is clicked.
		$('#flowerpot-js-controls-previous').click(function(e) {
			e.preventDefault();
			
			if (isLoading) {
				return;
			}
			
			$.flowerpot.previous();
		});
		
		// Go to the previous gallery item when the "previous" arrow is clicked.
		$('#flowerpot-js-controls-next').click(function(e) {
			e.preventDefault();
			
			if (isLoading) {
				return;
			}
			
			$.flowerpot.next();
		});
		
		// Attach an event fired on event resize to make sure the overlay doesn't exceed the
		// viewport's height/width.
		$(window).resize(function(e) {
			// Run the resize code only if it isn't already running
			if (isActive && stateWindowResizeInterval === null) {
				stateWindowResizeInterval = setTimeout(function() {
					_resize();
					stateWindowResizeInterval = null;
				}, windowResizeTime);
			}
		});
	};
	
	$.flowerpot.loading = function() {
		$(htmlOverlay).show();
		_loadingAnimation();
	};
	
	$.flowerpot.next = function() {
		_galleryMove(groupPositionNext);
	};
	
	$.flowerpot.previous = function() {
		_galleryMove(groupPositionPrevious);
	};
	
	$.flowerpot.resize = function() {
		_resize();
	};
	
	$.flowerpot.show = function() {
		href = $(currentFlowerpotElement).attr('href');
		rel = $(currentFlowerpotElement).attr('rel');
		
		_detectType();
		
		if (type === typeImage) {
			imageNode = $('<img id="flowerpot-js-image" src="' + href + '" alt="TODO: Get alt text" style="display: none;" />');
			
			$(imageNode).load(function() {
				initialHeight = this.height;
				initialWidth = this.width;
				
				$(htmlOverlayContents).attr('class', 'flowerpot-type-image').html(this);
				$('#flowerpot-js-image').fadeIn(animationSpeed);
				
				_resize();
			});
		} else if (type === typeHTML) {
			htmlSwapDiv = jQuery('<div id="flowerpot-js-swap" />');
			
			$(htmlOverlayContents).attr('class', 'flowerpot-type-html').html(htmlSwapDiv);
			$(htmlSwapDiv).swap(href);
		}
		
		if (!isActive) {
			_buildGroup();
			
			setTimeout(function() {
				_resize();
				
				$(htmlOverlay).css({opacity: 0});
				$(htmlOverlay).animate({opacity: 0.99}, animationSpeed);
				$.each([htmlOverlayContents, htmlControlsClose], function(i, element) {
					$(element).fadeIn(animationSpeed);
				});
				
				if (groupElements.length) {
					$.each([htmlControlsNext, htmlControlsPrevious], function(i, element) {
						$(element).fadeIn(animationSpeed);
					});
				}
				
				// Flowerpot is active now; this affects animation behaviour
				isActive = true;
			}, animationSpeed);
			
			_stopLoadingAnimation();
		} else {
			_stopLoadingAnimation();
		}
		
		if ($(currentFlowerpotElement).attr('title')) {
			$(htmlOverlayDescription).html($(currentFlowerpotElement).attr('title')).fadeIn(animationSpeed);
		} else {
			$(htmlOverlayDescription).html('').fadeOut(animationSpeed);
		}
		
		_resize();
	};
	
	/*! Copyright (c) 2008 Brandon Aaron (brandon.aaron@gmail.com || http://brandonaaron.net)
	 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
	 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
	 */
	
	/**
	 * Swaps out one element with another. It can take either a DOM element, 
	 * a selector or a jQuery object. It only swaps the first matched element.
	 */
	$.fn.swap = function(b) {
		b = jQuery(b)[0];
		var a = this[0],
		    a2 = a.cloneNode(true),
		    b2 = b.cloneNode(true),
		    stack = this;
			
		a.parentNode.replaceChild(b2, a);
		b.parentNode.replaceChild(a2, b);
		
		stack[0] = a2;
		return this.pushStack( stack );
	};
	
	$(document).ready(function() {
		$.flowerpot.init();
	});
})(jQuery); // Load in the jQuery global variable to maintain compability,
            // i.e. in case another framework or variable is using "$"
