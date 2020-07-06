$(document).ready(function() {
    $('.editor1').each( function(index, element)
    {
        $('.editor1').c4wwysiwyg({
            toolbar: 'top-selection',
            buttons: {
                // Objective button (GAP)
                insertIssue: index != 0 ? false : {
                    title: 'Custom Button',
                    image: '<img src="img/icon-face1.png" width="16" height="16" alt="" />',
                    click: function( $button ) {
                                var text = $(element).c4wwysiwyg('options').getSelectedText();
                                if( text )
                                   alert( 'You selected: "'+text );
                                else
                                    alert( 'No text selected' );
                           },
                    showstatic: false,    
                    showselection: true    
                },
                // Fontname plugin
                fontname: index == 1 ? false : {
                    title: 'Font',
                    image: '\uf031', 
                    popup: function( $popup, $button ) {
                            var list_fontnames = {
                                    // Name : Font
                                    'Arial, Helvetica' : 'Arial, Helvetica, sans-serif',
                                    'Verdana'          : 'Verdana, Geneva, sans-serif',
                                    'Georgia'          : 'Georgia, sans-serif',
                                    'Courier New'      : 'Courier New,Courier',
                                    'Times New Roman'  : 'Times New Roman,Times',
                                    'Tahoma'          : 'Tahoma,Geneva,sans-serif',
                                    'Impact'          : 'Impact, Charcoal, sans-serif'
                                };
                            var $list = $('<div/>').addClass('wysiwyg-plugin-list')
                                                   .attr('unselectable','on');
                            $.each( list_fontnames, function( name, font ) {
                                var $link = $('<a/>').attr('href','#')
                                                    .css( 'font-family', font )
                                                    .html( name )
                                                    .click(function(event) {
                                                        $(element).c4wwysiwyg('options').fontName(font).closePopup();
                                                        // prevent link-href-#
                                                        event.stopPropagation();
                                                        event.preventDefault();
                                                        return false;
                                                    });
                                $list.append( $link );
                            });
                            $popup.append( $list );
                           },
                    //showstatic: true,    
                    showselection:false    
                },
                // Fontsize plugin
                fontsize: index != 0 ? false : {
                    title: 'Size',
                   // style: 'color:white;background:red',      // you can pass any property - example: "style"
                    image: '\uf034', 
                    popup: function( $popup, $button ) {
                            // Hack: http://stackoverflow.com/questions/5868295/document-execcommand-fontsize-in-pixels/5870603#5870603
                            var list_fontsizes = [];
                            for( var i=8; i <= 11; ++i )
                                list_fontsizes.push(i+'px');
                            for( var i=12; i <= 28; i+=2 )
                                list_fontsizes.push(i+'px');
                            list_fontsizes.push('36px');
                            list_fontsizes.push('48px');
                            list_fontsizes.push('72px');
                            var $list = $('<div/>').addClass('wysiwyg-plugin-list')
                                                   .attr('unselectable','on');
                            $.each( list_fontsizes, function( index, size ) {
                                var $link = $('<a/>').attr('href','#')
                                                    .html( size )
                                                    .click(function(event) {
                                                        $(element).c4wwysiwyg('options').fontSize(7).closePopup();
                                                        $(element).c4wwysiwyg('getparent')
                                                                .find('font[size=7]')
                                                                .removeAttr("size")
                                                                .css("font-size", size);
                                                        // prevent link-href-#
                                                        event.stopPropagation();
                                                        event.preventDefault();
                                                        return false;
                                                    });
                                $list.append( $link );
                            });
                            $popup.append( $list );
                           }
                    //showstatic: true,    
                    //showselection: true    
                },
                // Header plugin
                header: {
                    title: 'Header',
                    image: '\uf1dc', 
                    popup: function( $popup, $button ) {
                            var list_headers = {
                                    // Name : Font
                                    'Header 1' : '<h1>',
                                    'Header 2' : '<h2>',
                                    'Header 3' : '<h3>',
                                    'Header 4' : '<h4>',
                                    'Header 5' : '<h5>',
                                    'Header 6' : '<h6>'
                                };
                            var $list = $('<div/>').addClass('wysiwyg-plugin-list')
                                                   .attr('unselectable','on');
                            $.each( list_headers, function( name, format ) {
                                var $link = $('<a/>').attr('href','#')
                                                     .css( 'font-family', format )
                                                     .html( name )
                                                     .click(function(event) {
                                                        $(element).c4wwysiwyg('options').format(format).closePopup();
                                                        // prevent link-href-#
                                                        event.stopPropagation();
                                                        event.preventDefault();
                                                        return false;
                                                    });
                                $list.append( $link );
                            });
                            $popup.append( $list );
                           },
                    showstatic: true,    
                    showselection: false    
                },
                bold: {
                    title: 'Bold (Ctrl+B)',
                    image: '\uf032', 
                    hotkey: 'b'
                },
                italic: {
                    title: 'Italic (Ctrl+I)',
                    image: '\uf033', 
                    hotkey: 'i'
                },
                underline: {
                    title: 'Underline (Ctrl+U)',
                    image: '\uf0cd', 
                    hotkey: 'u'
                },
                strikethrough: {
                    title: 'Strikethrough (Ctrl+S)',
                    image: '\uf0cc', 
                    hotkey: 's',
                    showselection: false
                },
                forecolor: {
                    title: 'Text color',
                    image: '\uf1fc' 
                },
                highlight: {
                    title: 'Background color',
                    image: '\uf043' 
                },
                insertlink: {
                    title: 'Insert link',
                    image: '\uf08e' 
                },
                inserttable: {
                    title: 'Insert Table',
                    image: '\uf0ce', 
                    //showstatic: true,    
                    showselection:false    
                },
                insertimage: {
                    title: 'Insert image',
                    image: '\uf083', 
                    //showstatic: true,    
                    showselection: index == 2 ? true : false    
                },
                insertvideo: {
                    title: 'Insert video',
                    image: '\uf03d', 
                    //showstatic: true,    
                    showselection: index == 2 ? true : false    
                },
                aligntools: index != 0 ? false : {
                    title: 'Alignment',
                    image: '\uf036', 
                    popup: function( $popup, $button ) {
                            var list_headers = {
                                    '<i class="fa fa-align-left"></i>' : 'left',
                                    '<i class="fa fa-align-center"></i>' : 'center',
                                    '<i class="fa fa-align-right"></i>' : 'right',
                                    '<i class="fa fa-align-justify"></i>' : 'justify'
                                };   
                            var $list = $('<div/>').addClass('wysiwyg-plugin-list wysiwyg-align-on')
                                                   .attr('unselectable','on');
                            $.each( list_headers, function( name, format ) {
                                var newform = format.toLowerCase().replace(/\b[a-z]/g, function(letter) {
                                                    return letter.toUpperCase();
                                                });
                                var $link = $('<a/>').attr('href','#')
                                                     .attr('title', newform)
                                                     .html( name )
                                                     .click(function(event) {
                                                        $(element).c4wwysiwyg('options').align(format).closePopup();
                                                        event.stopPropagation();
                                                        event.preventDefault();
                                                        return false;
                                                    });
                                $list.append( $link );
                            });
                            $popup.append( $list );
                           },
                    showstatic: true,    
                    showselection: false    
                },
                /*alignleft: index != 0 ? false : {
                    title: 'Left',
                    image: '\uf036', 
                    //showstatic: true,    
                    showselection: false    
                },
                aligncenter: index != 0 ? false : {
                    title: 'Center',
                    image: '\uf037', 
                    //showstatic: true,    
                    showselection: false    
                },
                alignright: index != 0 ? false : {
                    title: 'Right',
                    image: '\uf038', 
                    //showstatic: true,    
                    showselection: false    
                },
                alignjustify: index != 0 ? false : {
                    title: 'Justify',
                    image: '\uf039', 
                    //showstatic: true,    
                    showselection: false    
                },
                subscript: index == 1 ? false : {
                    title: 'Subscript',
                    image: '\uf12c', 
                    //showstatic: true,    
                    showselection: false    
                },
                superscript: index == 1 ? false : {
                    title: 'Superscript',
                    image: '\uf12b', 
                    //showstatic: true,    
                    showselection: false    
                },*/
                indent: index != 0 ? false : {
                    title: 'Indent',
                    image: '\uf03c', 
                    //showstatic: true,    
                    showselection: false    
                },
                outdent: index != 0 ? false : {
                    title: 'Outdent',
                    image: '\uf03b', 
                    //showstatic: true,    
                    showselection: false    
                },
                orderedList: index != 0 ? false : {
                    title: 'Ordered list',
                    image: '\uf0cb', 
                    //showstatic: true,    
                    showselection: false    
                },
                unorderedList: index != 0 ? false : {
                    title: 'Unordered list',
                    image: '\uf0ca', 
                    //showstatic: true,    
                    showselection: false    
                },
                removeformat: {
                    title: 'Remove format',
                    image: '\uf12d' 
                }
            },
            // Other properties
            selectImage: 'Click or drop image',
            placeholderUrl: 'www.example.com',
            placeholderEmbed: '<embed/>',
            maxImageWidth: [600],
            //filterImageType: callback( file ) {},
            onKeyDown: function( key, character, shiftKey, altKey, ctrlKey, metaKey ) {
                            // E.g.: submit form on enter-key:
                            //if( (key == 10 || key == 13) && !shiftKey && !altKey && !ctrlKey && !metaKey ) {
                            //    submit_form();
                            //    return false; // swallow enter
                            //}
                        },
            onKeyPress: function( key, character, shiftKey, altKey, ctrlKey, metaKey ) {
                        },
            onKeyUp: function( key, character, shiftKey, altKey, ctrlKey, metaKey ) {
                        },
            onAutocomplete: function( typed, key, character, shiftKey, altKey, ctrlKey, metaKey ) {
                            if( typed.indexOf('@') == 0 ) // startswith '@'
                            {
                                var usernames = {
                                        'Evelyn' : '10',
                                        'Harry' : '11',
                                        'Amelia' : '12',
                                        'Oliver' : '13',
                                        'Isabelle' : '14',
                                        'Eddie' : '15',
                                        'Editha' : '16',
                                        'Jacob' : '17',
                                        'Emily' : '18',
                                        'George' : '19',
                                        'Edison' : '20'
                                    };
                                var $list = $('<div/>').addClass('wysiwyg-plugin-list')
                                                       .attr('unselectable','on');
                                $.each( usernames, function( index, username ) {
                                    if( index.toLowerCase().indexOf(typed.substring(1).toLowerCase()) !== 0 ) // don't count first character '@'
                                        return;
                                    var $link = $('<a/>').attr('href','#')
                                                        .text( index )
                                                        .click(function(event) {
                                                            var url = 'http://example.com/user/' + index,
                                                                html = '<a href="' + url + '">@' + index + '</a> ';
                                                            var editor = $(element).c4wwysiwyg('options');
                                                            // Expand selection and set inject HTML
                                                            editor.expandSelection( typed.length, 0 ).insertHTML( html );
                                                            editor.closePopup().getElement().focus();
                                                            // prevent link-href-#
                                                            event.stopPropagation();
                                                            event.preventDefault();
                                                            return false;
                                                        });
                                    $list.append( $link );
                                });
                                if( $list.children().length )
                                {
                                    if( key == 13 )
                                    {
                                        $list.children(':first').click();
                                        return false; // swallow enter
                                    }
                                    // Show popup
                                    else if( character || key == 8 )
                                        return $list;
                                }
                            }
                        },
            onImageUpload: function( insert_image ) {
              
                            var iframe_name = 'legacy-uploader-' + Math.random().toString(36).substring(2);
                            $('<iframe>').attr('name',iframe_name)
                                         .load(function() {
                                            // <iframe> is ready - we will find the URL in the iframe-body
                                            var iframe = this;
                                            var iframedoc = iframe.contentDocument ? iframe.contentDocument :
                                                           (iframe.contentWindow ? iframe.contentWindow.document : iframe.document);
                                            var iframebody = iframedoc.getElementsByTagName('body')[0];
                                            var image_url = iframebody.innerHTML;
                                            insert_image( image_url );
                                            $(iframe).remove();
                                         })
                                         .appendTo(document.body);
                            var $input = $(this);
                            $input.attr('name','upload-filename')
                                  .parents('form')
                                  .attr('action','/script.php') // accessing cross domain <iframes> could be difficult
                                  .attr('method','POST')
                                  .attr('enctype','multipart/form-data')
                                  .attr('target',iframe_name)
                                  .submit();
                        },
            forceImageUpload: false,    // upload images even if File-API is present
            videoFromUrl: function( url ) {

                // youtube - http://stackoverflow.com/questions/3392993/php-regex-to-get-youtube-video-id
                var youtube_match = url.match( /^(?:http(?:s)?:\/\/)?(?:[a-z0-9.]+\.)?(?:youtu\.be|youtube\.com)\/(?:(?:watch)?\?(?:.*&)?v(?:i)?=|(?:embed|v|vi|user)\/)([^\?&\"'>]+)/ );
                if( youtube_match && youtube_match[1].length == 11 )
                    return '<iframe src="//www.youtube.com/embed/' + youtube_match[1] + '" width="640" height="360" frameborder="0" allowfullscreen></iframe>';

                // vimeo - http://embedresponsively.com/
                var vimeo_match = url.match( /^(?:http(?:s)?:\/\/)?(?:[a-z0-9.]+\.)?vimeo\.com\/([0-9]+)$/ );
                if( vimeo_match )
                    return '<iframe src="//player.vimeo.com/video/' + vimeo_match[1] + '" width="640" height="360" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';

                // dailymotion - http://embedresponsively.com/
                var dailymotion_match = url.match( /^(?:http(?:s)?:\/\/)?(?:[a-z0-9.]+\.)?dailymotion\.com\/video\/([0-9a-z]+)$/ );
                if( dailymotion_match )
                    return '<iframe src="//www.dailymotion.com/embed/video/' + dailymotion_match[1] + '" width="640" height="360" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';

                // undefined -> create '<video/>' tag
            }
        })
        .change(function() {
            if( typeof console != 'undefined' )
                ;//console.log( 'change' );
        })
        .focus(function() {
            if( typeof console != 'undefined' )
                ;//console.log( 'focus' );
        })
        .blur(function() {
            if( typeof console != 'undefined' )
                ;//console.log( 'blur' );
        });
    });

    /*
    $('#editor3-readonly').click(function(e) {
        e.preventDefault()
        var isReadOnly = $('#editor3').wysiwyg('shell').readOnly();
        $('#editor3').wysiwyg('shell').readOnly( ! isReadOnly );
    });
    $('#editor3-bold').click(function(e) {
        e.preventDefault()
        $('#editor3').wysiwyg('shell').bold();
    });
    $('#editor3-red').click(function(e) {
        e.preventDefault()
        $('#editor3').wysiwyg('shell').highlight('#ff0000');
    });
    $('#editor3-sethtml').click(function(e) {
        e.preventDefault()
        $('#editor3').wysiwyg('shell').setHTML('This is the new text.');
    });
    $('#editor3-inserthtml').click(function(e) {
        e.preventDefault()
        $('#editor3').wysiwyg('shell').insertHTML('Insert some text.');
    });
    $('#editor3-reset').click(function(e) {
        e.preventDefault()
        $('#editor3').closest('form').trigger('reset');
    });
    */
     
   
});

function submittest() {
     alert($('.editor1').c4wwysiwyg('options').getHTML());
}