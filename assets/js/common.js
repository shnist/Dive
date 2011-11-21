var dive = window.dive || {};
	
dive = {
	placeholderCopy : 'explore Flickr',
	errorMessage : 'Sorry, but no search results were returned. Please try something else!',
	imageList : [],
	init : function () {
		this.pageBuilding.init();
		this.ajax.init();
		this.ui.init();
		// initialisation pulls in images london by default
		this.ajax.getImages('london');		
	},
	imageTotalCalculation : function () {
		// variable that contains the width of the document (screen width)
		var containerWidth = 1360,
		// variable that contains the height of the document (screen height)
			contaninerHeight = 850,
		// variable that gets the number of images that can fit across
			imageNoLeft = Math.floor(containerWidth / 85),
		// variable that gets the numbers of images that can fit up the screen
			imageNoTop = Math.floor(contaninerHeight / 85),
		// variable that caculates the number of images that can be displayed on a users screen
			imageNoTotal = Math.floor(imageNoLeft * imageNoTop);

		return imageNoTotal;
	},
	pageBuilding : {
		init : function () {
			// calculate the number of images that are needed for the viewer
			var imageTotal = dive.imageTotalCalculation(),
				imageMarkUp = '';
	
			// populate the container
			for (var i = 0; i < imageTotal; i++){
				imageMarkUp = imageMarkUp + '<img src="assets/images/place_holder.gif" alt="grid image" rel="grid">';
			}
			
			$('#calculation-container').append(imageMarkUp);		
		},
		photoInfo : function (e) {
			$('#title, #dateTaken, #authorName, #tag-cloud').empty();

			// variable that gets the link for each image
			var imageTitle = e.photo.title._content,
			// variable that gets the date taken for each image
				taken = e.photo.dates.taken,
			// variable that gets the author's name for each photo
				authorName = e.photo.owner.realname,
			// variable that sets the length of the for loop
				tagLength = Number(e.photo.tags.tag.length);
			
			// if the number of tags is less than eight get all the tags
			// this is due to the limit of space 
			if (tagLength < 8){
				// for loop that appends the related tags to the tag cloud
				for (i = 0; i < tagLength; i++){
					// variable that creates the tag array
					var tagArray = e.photo.tags.tag[i]._content;
					// appends the correct number of anchor elements to the array and populates them with the tags
					$('#tag-cloud').append('<a class="cloudTag" href="#">' + tagArray + '</a> ');
				}
			} else {
				// for loop that appends the related tags to the tag cloud
				for (i = 0; i < 8; i++){
					// variable that creates the tag array
					var tagArray = e.photo.tags.tag[i]._content;
					// appends the correct number of anchor elements to the array and populates them with the tags
					$('#tag-cloud').append('<a class="cloudTag" href="#">' + tagArray + '</a> ');
				}
			}
			
			// appends the image title to the p element
			$('#title').append('Title: ' + imageTitle);
			// appends the date taken to the p element
			$('#dateTaken').append('Taken: ' + taken);
			// appends the description to the p element
			$('#authorName').append('Author\'s Name: ' + authorName);
			
			$('.cloudTag').bind('click', function(){
				dive.ajax.getImages($(this).text());
			});
		}
	},
	ajax : {
		init : function (){
			$('#image-search').submit(function(e){
				e.preventDefault();
				// if the tag field value has not been defined
				if ($('#tag-field').val() !== dive.placeholderCopy){
					// if there is a space in the search string, replace it with ; - makes it compatible with flickr API
					$('#tag-field').val().replace(/[:space:]/g, ';' );					
					// performs the getImages function with the value of search box
					dive.ajax.getImages($('#tag-field').val());
				}
				return false;
			});			
		},
		getImages : function (tag) {
			dive.pageTransform.loadStart();
			$.ajax ({
				type: 'GET',
				url: 'http://api.flickr.com/services/rest/?format=json&jsoncallback=?',
				dataType: 'jsonp',
				data: {
					method: 'flickr.photos.search',
					api_key: 'eb5bcdae0f763f9a177e185bfb0b2392',
					tag_mode: '',
					min_upload_date: '2007',
					tags: tag,
					per_page: '500'
				},
				success: function (e) {
					if (e.stat === 'ok'){
						if (e.photos.total !== '0'){
							dive.flickr.generateUrls(e);
						} else {
							dive.pageTransform.errorMessage();
							dive.pageTransform.loadComplete();
						}
					} 
				}				
			});
		},
		extractPhotoInformation : function (id) {
			// ajax request to get the information of the photograph
			$.ajax ({
				type: 'GET',
				url: 'http://api.flickr.com/services/rest/?format=json&jsoncallback=?',
				dataType: 'jsonp',
				data: {
					method: 'flickr.photos.getInfo',
					api_key: 'eb5bcdae0f763f9a177e185bfb0b2392',
					photo_id: id
				},
				success: function jsonFlickrApi(data) {			
					if (data.stat === 'ok') {
						$('.loading-image').remove();
						dive.pageBuilding.photoInfo(data);
					}
				}
			});
		}
	},
	flickr : {
		generateUrls : function (e) {
			// empty the array
			dive.imageList.length = 0;
			// cycles through each image
			for(var i = 0; i < $('#calculation-container img').length; i++) {
				// variable that creates an array, which contains all the details of the photos
				var photoDetails = e.photos.photo[ i ];
				
				// if photoDetails array brings back a valid search result
				if (photoDetails !== undefined) {
					
					var imageLink = 'http://farm' +
						photoDetails.farm + '.static.flickr.com/' +
						photoDetails.server + '/' +
						photoDetails.id + '_' +
						photoDetails.secret + '_' + 's.jpg';
					// the values for the imageLink variable are pushed innto the dive.imageList array
					dive.imageList.push(imageLink);
				} 
			}
			dive.flickr.refreshImageUrls();
		},
		refreshImageUrls : function () {
			$('img[rel^="grid"]').each(function(){
				$(this).attr('src', dive.imageList[ Math.floor ( Math.random() * dive.imageList.length )])
			});
			dive.pageTransform.loadComplete();
		}
	},
	pageTransform : {
		loadStart : function () {
			// append the loading image to the body
			$('#contrast-box').append('<div class="loading-image"></div>');
			// reduces the opacity of the images to indicate they are 'inactive'
			$('img[rel^="grid"]').addClass('loading');			
		},
		loadComplete : function () {
			// removes the loading image
			$('.loading-image').remove();
			// removes the opacity
			$('img[rel^="grid"]').removeClass('loading');				
		},
		errorMessage: function () {
			$('#searchContainer')
				.append('<p id="errorMessage">' + dive.errorMessage + '</p>');
			var removeMessage = setTimeout(dive.pageTransform.removeErrorMessage, 5000);
		},
		removeErrorMessage : function () {
			$('#errorMessage').fadeOut(function(){
				$(this).remove();
			});
		}
	},
	ui : {
		imageCoordinates : [],
		init : function () {
			$('img[rel^="grid"]').bind('mousedown', function (e) {
				e.preventDefault();
			});
			dive.ui.drag();
			dive.ui.imageSelection();
		},
		drag : function () {			
			$('#viewport').bind('mousedown', function (e) {
				// variable for the x coordinates of the mouse
				dive.ui.mouseX = e.pageX + $('#calculation-container').offset().left,
				// variable for the y coordinates of the mouse
				dive.ui.mouseY = e.pageY + $('#calculation-container').offset().top;				
			
				// on each image perform a function 'capture', using parameter i to store the argument
				$('img[rel^="grid"]').each(function(i){
					// sets up an array object for each image
					dive.ui.imageCoordinates[i] = {};
					// enters first value, which is the top offset of the image 
					dive.ui.imageCoordinates[i].top = $(this).offset().top;
					// used as a container that will keep the values of the modified offset values when the images move
					dive.ui.imageCoordinates[i].topOffset = 0;
				
					// enter the second value, which is the left offset of the image from the document
					dive.ui.imageCoordinates[i].left = $(this).offset().left;
					// used as a container that will keep the values of the modified offset values when the images move
					dive.ui.imageCoordinates[i].leftOffset = 0;
				});
			
				$(document).bind('mousemove', function(j){
					// changing the cursor style when the mouse is down
					$('document').addClass('cursorClick');
					
					// stops the images from highlighting while dragging 
					$('body').focus();
					
					// variables
					// variable for moving x coordinates of the mouse
					var movingMouseX = j.pageX,
					// variable for the moving y coordinates of the mouse
						movingMouseY = j.pageY,
					// variables - calculates the difference between mouseX and movingMouseX
						differenceX = movingMouseX - dive.ui.mouseX,
					// variable - calculates the difference between mouseY and movingMouseY
						differenceY = movingMouseY - dive.ui.mouseY;				
					
					$('img[rel^="grid"]').each(function(i){
						// the original coordinates of all the images - y
						var originalTop = dive.ui.imageCoordinates[i].top + dive.ui.imageCoordinates[i].topOffset;
						// the original coordinates of all the images - X
						var originalLeft = dive.ui.imageCoordinates[i].left + dive.ui.imageCoordinates[i].leftOffset;
						
						// variable - calculates the new left css position of all the images
						var movingLeft = originalLeft + differenceX;
						// variable - calculates the new top css position of all the images
						var movingTop = originalTop + differenceY;
						
						// if statements for keeping the images within the viewable area
						// if the images move too far to the left
						if (movingLeft < 0) {
							$(this).attr('src', dive.imageList[ Math.floor ( Math.random() * dive.imageList.length )]) ;							
							dive.ui.imageCoordinates[i].leftOffset += $('#calculation-container').width();
						} else if (movingLeft > $('#calculation-container').width()) {
							$(this).attr('src', dive.imageList[ Math.floor ( Math.random() * dive.imageList.length )]) ;
							dive.ui.imageCoordinates[i].leftOffset += - $('#calculation-container').width();
						}
				
						// if the images have moved too far to the top
						if (movingTop < 0) {
							$(this).attr('src', dive.imageList[ Math.floor ( Math.random() * dive.imageList.length )]) ;
							dive.ui.imageCoordinates[i].topOffset += $('#calculation-container').height();
						} else if (movingTop > $('#calculation-container').height()) {
							$(this).attr('src', dive.imageList[ Math.floor ( Math.random() * dive.imageList.length )]) ;
							dive.ui.imageCoordinates[i].topOffset += - $('#calculation-container').height();
						}		
						
						// sets the css position
						$(this).css({
							'position' : 'absolute',
							'top' : movingTop, 
							'left' : movingLeft
						}); 
					});
				});
			});
			
			$(document).mouseup(function(){
				$(document).unbind('mousemove'); // unbinds the mousemove functions 
				$(document).removeClass('cursorClick'); // removes the change of cursor
			}); 	
		},
		imageSelection : function () {
			$('img[rel^="grid"]').dblclick(function(){
				if ($('#content-box-instructions').length){
					$('#content-box p').remove();
					$('#content-box').append('<img src="/assets/images/larger_image_holder.gif" alt="larger image placeholder" id="larger-image"><p id="title">Title:</p>'
									+ '<p id="dateTaken">Taken:</p><p id="authorName">Author\'s Name:</p><div id="tag-cloud"></div>');
					$('#larger-image').bind('click', dive.ui.dialog.init);
				}
				// variable that stores that changes the size of the image
				var changedSource = $(this).attr('src').replace(/_s.jpg/, '_m.jpg'),
				// extracts the beginning of the url up to the beginning of the user id
					extractionStart = $(this).attr('src').replace(/^http:\/\/farm[0-9]\.static\.flickr\.com\/[0-9]{4}\//i, ''),
				// extracts the end of the url up to the end of the user id, leaving only the id
					idExtract = extractionStart.replace(/_[A-Za-z\d]{10}_s\.jpg$/i, ''),				
				// load the image in and put in the loader for now - when onLoad is triggered (when the image has finished loading)
				// change the source of the image and remove the loader
					image = new Image();
					
				$('#content-box').append('<div class="loading-image"></div>');
				image.src = changedSource;
				image.onLoad = dive.ui.displayImage(image.src);
					
				dive.ajax.extractPhotoInformation(idExtract);
			});
		},
		displayImage : function (source){
			$('#larger-image').attr('src', source);
		},
		dialog : {
			init : function (e){
				e.preventDefault();

				// appending the lightBoxOverlay and whiteWindow and target
				$('body').append('<div id="lightBoxOverlay"></div><div id="whiteWindow">'
								+ '<img id="lightboxImage" src="images/targetImage.gif" alt="lightbox loading image">'
								+ '<a href="#close" id="close">&times; Close</a><div class="loading-image"></div></div>').fadeIn('normal');

				// variable that stores that changes the size of the image
				var largerImageSourceChange = $(this).attr('src').replace(/_m.jpg/, '.jpg');
				// changes the src in the lightbox loading image 
				$('#lightboxImage').attr('src', largerImageSourceChange);
				// the loading image is removed
				$('.loading-image').remove();
				// event handlers for the dialog
				dive.ui.dialog.eventHandlers();
			},
			eventHandlers : function (){
				$('#whiteWindow #close').click(function () {
					$('#lightBoxOverlay, #whiteWindow').fadeOut(function(){
						$(this).remove();
					});
				});
			}
		}
	}
};

$(document).ready(function (){
	dive.init();
});

