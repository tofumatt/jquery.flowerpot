The Flowerpot is a jQuery plugin that allows you to overlay _images_, _DOM elements_, _AJAX content_, and _iframes_ onto a web page. You can overlay a single item or associate multiple items (of any type) in a gallery.

# Features
  * **Easy to use**  
   
    Just add `class="flowerpot"` to a link and let The Flowerpot's automatic link detection do the rest for you
  * **Easy to customize**  
    
    Built-in functions for changing locale strings (i18n) and settings, keeping _you_ in control (including turning on/off automatic type detection and gallery thumbnails)
  * **Smart**  
    
    Automatically scales the overlay, regardless of the overlay type
  * **Standards-compliant**  
    
    Valid CSS and (X)HTML
  * **Works in all major browsers**  
    
    IE 6+, Firefox 2+, Safari 3+, Opera 9+, and Chrome 1+

# Requirements
The Flowerpot relies on the [jQuery](http://jquery.com) (1.3+) library (including jQuery 1.4). You'll need to load the included CSS as well.

# Usage
Assuming jQuery is already loaded, include The Flowerpot's CSS and JavaScript files:

	<style type="text/css" media="screen">@import url(flowerpot.css);</style>
	<script type="text/javascript" src="jquery.flowerpot.js"></script>

Any element on the page with the class "flowerpot" will launch an overlay. To get a linked image to appear in an overlay, it's as easy as `<a href="photo.jpg" class="flowerpot">Image</a>`. And with automatic type detection, you can link to images, inline divs, YouTube/Vimeo videos, pages on your domain (for AJAX), or external sites (for iFrames).

## Images
	<a href="photo.jpg" class="flowerpot">Image</a>
Opens "photo.jpg" in an overlay. The image will be scaled down if it exceeds the size of the browser window.

## DOM Elements
	<a href="#video" class="flowerpot" rel="div">Watch Video</a>
Displays the element with the ID "video" in the overlay.

## AJAX Content
	<a href="ajax.html" class="flowerpot" rel="div">Load Content</a>
Displays the text/HTML returned by "ajax.html" in the overlay.

## iFrame
	<a href="http://apple.ca" class="flowerpot" rel="iframe">Apple Canada</a>
Display the URL inside the `href` attribute in the overlay, using an inline frame. With automatic type detection on, The Flowerpot loads external URLs (ones not matching the hostname from location.href) in an iFrame.

## YouTube Video
	<a href="http://www.youtube.com/watch?v=ILo1v6Y7IB4" class="flowerpot" rel="youtube">YouTube Music Video</a>
Display the [YouTube](http://youtube.com) video at the link specified.

## Galleries
Multiple items can be viewed one after another without closing the overlay by adding `rel="gallery[NAME]"` to each element that should be part of that gallery. You can have as many galleries as you like, with as many items as you'd like, and you can mix all kinds of content in a gallery (i.e. images and iFrames in the same gallery).

# License
In keeping with jQuery and most of its plugins, The Flowerpot is _dual-licensed_ under the *[MIT](http://www.opensource.org/licenses/mit-license.php)* and *[GPL](http://www.gnu.org/licenses/old-licenses/gpl-2.0.html)* (v2 or later) licenses. This means you can pick whichever license you want to use for your project.