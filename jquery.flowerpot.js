/**
 * Flowerpot
 *
 * A jQuery plugin to overlay images, inline content, and more.
 *
 * @package		Flowerpot
 * @author		Matthew Riley MacPherson
 * @copyright	Copyright (c) 2009, Matthew Riley MacPherson
 * @license		New BSD License (http://www.opensource.org/licenses/bsd-license.php)
 * @link		http://flowerpot.googlecode.com/
 * @since		Version 0.1
 */
// HTML plants in an overlayed pot!

function Flowerpot_stdObject() {
	var dom_img = 0;
	var images_dir = "images/";
	
	this.close_img = images_dir + "flowerpot-close.png";
	this.loading_img = images_dir + "flowerpot-loading.gif";
	this.gallery_prev_img = images_dir + "flowerpot-prev.png";
	this.gallery_next_img = images_dir + "flowerpot-next.png";
	// Define IE 6 images, if any, here
	if (jQuery.browser.msie == true && jQuery.browser.version < 7) {
		this.close_img = images_dir + "flowerpot-close-ie6.png";
		this.gallery_prev_img = images_dir + "flowerpot-prev-ie6.png";
		this.gallery_next_img = images_dir + "flowerpot-next-ie6.png";
	}
	
	this.gallery_index = 0;
	this.gallery_size = 0;
	this.overlay = false;
	this.overlay_opacity = 0.5;
	this.ready = false;
}

Flowerpot_stdObject.prototype.do_size = function(object) {
	var window_height = jQuery(window).height();
	var window_width = jQuery(window).width();
	var height = dom_img.height;
	var width = dom_img.width;
	
	if (jQuery.browser.msie == true && jQuery.browser.version < 7) {
		jQuery("#flowerpotjs-overlay").css('height', jQuery(document).height());
		jQuery("#flowerpotjs-overlay").css('width', window_width);
	}
	
	var max_height = window_height - window_height / 10;
	var max_width = window_width - window_width / 10;
	
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
	
	jQuery(object).height(height + "px");
	jQuery(object).width(width + "px");
	
	jQuery("#flowerpotjs-contents").css('height', height + "px");
	if (jQuery.browser.msie == true && jQuery.browser.version < 7) {
	}
	else {
		jQuery("#flowerpotjs-contents").css('margin-top', "-" + (height / 2) + "px");
		jQuery("#flowerpotjs-contents").css('margin-left', "-" + (width / 2) + "px");
	}
	jQuery("#flowerpotjs-contents").css('width', width + "px");
	
	jQuery("#flowerpotjs-close").css('bottom', (height + 24) + "px");
	jQuery("#flowerpotjs-close").css('left', (width - 24) + "px");
}

Flowerpot_stdObject.prototype.init = function(options) {
	var flowerpot_html = "<div id=\"flowerpotjs-overlay\" style=\"display: none;\"></div><div id=\"flowerpotjs-loading\" style=\"display: none;\"><img src=\"" + this.loading_img + "\" alt=\"Loading...\" /><span>Loading...</span></div><div id=\"flowerpotjs-contents\" style=\"display: none;\"></div>";
	jQuery("body").append(flowerpot_html);
	jQuery("#flowerpotjs-overlay").css({opacity: 0});
	
	if (typeof(options) != "object")
		options = new Array;
	
	// Click Events
	jQuery("#flowerpotjs-close,#flowerpotjs-overlay").live("click", function(event) { // Overlay or close link
		if (event.button == 0 && the_flowerpot.overlay == true) {
			the_flowerpot.hide();
			this.blur();
			event.preventDefault();
		}
	});
	jQuery(".flowerpot").live("click", function(event) {
		if (event.button == 0) {
			rel = jQuery(this).attr('rel');
			if (rel.match(/gallery\[(.[^ ]*)\]/i)) { // Flowerpot image gallery
				the_flowerpot.gallery_index = jQuery(".flowerpot[rel=" + rel + "]").index(this);
				the_flowerpot.gallery_size = jQuery(".flowerpot[rel=" + rel + "]").length;
				jQuery(this).flowerpot({gallery: rel, type: "gallery"});
				this.blur();
				return false;
			} else { // Single Flowerpot image
				jQuery(this).flowerpot(options);
				this.blur();
				return false;
			}
		}
	});
		// Gallery controls
		jQuery("#flowerpotjs-prev-link").live("click", function(event) { // Previous image
			rel = jQuery(this).attr('rel');
			if (rel.match(/gallery\[(.[^ ]*)\]/i)) {
				if (event.button == 0) {
					the_flowerpot.gallery_move("prev");
					this.blur();
					return false;
				}
			}
		});
		jQuery("#flowerpotjs-next-link").live("click", function(event) { // Next image
			rel = jQuery(this).attr('rel');
			if (rel.match(/gallery\[(.[^ ]*)\]/i)) {
				if (event.button == 0) {
					the_flowerpot.gallery_move("next");
					this.blur();
					return false;
				}
			}
		});
	
	// Keyboard Events
	jQuery(document).keydown(function(event) {
		switch (event.keyCode) {
			case 27: // Esc key
				if (the_flowerpot.ready == true)
					the_flowerpot.hide();
				event.preventDefault();
				break;
			case 37: // Left Arrow key
				if (the_flowerpot.ready == true && the_flowerpot.gallery_size > 0)
					the_flowerpot.gallery_move("prev");
				event.preventDefault();
				break;
			case 39: // Right Arrow key
				if (the_flowerpot.ready == true && the_flowerpot.gallery_size > 0)
					the_flowerpot.gallery_move("next");
				event.preventDefault();
				break;
			default:
				break;
		}
	});
	
	// Resize Events
	jQuery(window).resize(function(event) {
		if (the_flowerpot.ready == true) {
			the_flowerpot.resize("#flowerpotjs-image", true);
			event.preventDefault();
		}
	});
};

Flowerpot_stdObject.prototype.gallery_move = function(index) {
	jQuery("#flowerpotjs-contents").hide();
	the_flowerpot.ready = false;
	if (index == "prev") {
		the_flowerpot.gallery_index = the_flowerpot.gallery_index - 1;
		if (the_flowerpot.gallery_index < 0)
			the_flowerpot.gallery_index = the_flowerpot.gallery_size - 1;
	} else if (index == "next") {
		the_flowerpot.gallery_index = the_flowerpot.gallery_index + 1;
		if (the_flowerpot.gallery_index >= the_flowerpot.gallery_size)
			the_flowerpot.gallery_index = 0;
	}
	jQuery(".flowerpot[rel=" + rel + "]").eq(the_flowerpot.gallery_index).flowerpot({gallery: rel, type: "gallery"});
}

Flowerpot_stdObject.prototype.hide = function() {
	jQuery("#flowerpotjs-loading").fadeOut(50);
	jQuery("#flowerpotjs-overlay").animate({opacity: 0}, 50).hide();
	jQuery("#flowerpotjs-contents").fadeOut();
	if ((jQuery.browser.msie == true && jQuery.browser.version < 8) || jQuery.browser.opera) {
		$("object,embed").css('visibility', "visible");
	}
	the_flowerpot.overlay = false;
	the_flowerpot.ready = false;
}

Flowerpot_stdObject.prototype.resize = function(object) {
	the_flowerpot.do_size(object);
}

Flowerpot_stdObject.prototype.show = function() {
	jQuery("#flowerpotjs-loading").fadeOut(50);
	jQuery("#flowerpotjs-close").fadeIn(50);
	
	jQuery("#flowerpotjs-contents").fadeIn();
	this.overlay = true;
}

Flowerpot_stdObject.prototype.size = function(object) {
	dom_img = new Image();
	jQuery(dom_img).load(function() {
		the_flowerpot.do_size(object);
		the_flowerpot.ready = true;
	});
	dom_img.src = jQuery(object).attr('src');
}

the_flowerpot = new Flowerpot_stdObject();

jQuery.fn.flowerpot = function(options) {
	settings = jQuery.extend({
		gallery: 0,
		global: true,
		overlay_opacity: the_flowerpot.overlay_opacity,
		type: "image"
	}, options);
	
	var content;
	if (settings['type'] == "image" || settings['type'] == "gallery") {
		var alt_text;
		if (jQuery(this).children("img").length == 1)
			alt_text = jQuery(this).children("img").attr("alt");
		else
			alt_text = jQuery(this).attr("title");
		content = "<img alt=\"" + alt_text + "\" src=\"" + jQuery(this).attr("href") + "\" id=\"flowerpotjs-image\" />";
	}
	if (settings['type'] == "gallery") {
		content = content + "<a href=\"#prev\" id=\"flowerpotjs-prev-link\" class=\"flowerpotjs-gallery-link\" rel=\"" + settings['gallery'] + "\"><img src=\"" + the_flowerpot.gallery_prev_img + "\" alt=\"Previous\" /></a><a href=\"#next\" id=\"flowerpotjs-next-link\" class=\"flowerpotjs-gallery-link\" rel=\"" + settings['gallery'] + "\"><img src=\"" + the_flowerpot.gallery_next_img + "\" alt=\"Next\" /></a>";
	}
	content = content + "<a href=\"#close\" id=\"flowerpotjs-close\"><img src=\"" + the_flowerpot.close_img + "\" alt=\"Close\" /></a>";
	
	// Hide flash from IE < 8 while the overlay is on
	if ((jQuery.browser.msie == true && jQuery.browser.version < 8) || jQuery.browser.opera) {
		$("object,embed").css('visibility', "hidden");
		$("#flowerpotjs-contents object,#flowerpotjs-contents embed").css('visibility', "visible");
	}
	
	jQuery("#flowerpotjs-contents").html(content).css({'-moz-border-radius': "2px", '-webkit-border-radius': "1px"});
	jQuery("#flowerpotjs-overlay").show().animate({opacity: settings['overlay_opacity']}, 50);
	jQuery("#flowerpotjs-loading").fadeIn(50);
	if (jQuery.browser.opera) {
		the_flowerpot.size("#flowerpotjs-image");
		the_flowerpot.show();
	} else {
		jQuery("#flowerpotjs-image").load(function callback(event) {
			if (settings['type'] == "image" || settings['type'] == "gallery") {
				the_flowerpot.size("#flowerpotjs-image");
			}
			if (!jQuery.support.style) {
				the_flowerpot.show();
			} else {
				jQuery(dom_img).load(function() {
					the_flowerpot.show();
				});
			}
		});
	}
};

jQuery(document).ready(function() {
	the_flowerpot.init();
});