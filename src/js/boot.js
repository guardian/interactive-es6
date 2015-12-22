'use strict';
define([], function() {
    function addCSS(url) {
        var head = document.querySelector('head');
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', url);
        head.appendChild(link);
    }

    return {
        boot: function(el, context, config, mediator) {

            // Loading message while we fetch JS / CSS
            el.innerHTML = '<svg style="display:block; margin: auto; margin-top: 48px;" width="54" height="54" viewBox="0 0 36 36"><path fill="#005689" d="M21.3 8.8c0-4.9-1.5-5.7-3.3-5.7-1.8 0-3.2.7-3.2 5.7s1.5 5.5 3.2 5.5c1.8-.1 3.3-.6 3.3-5.5m-6.5 18.8c-2.3 0-2.9 1.7-2.9 2.9 0 1.8 1.6 3.4 6.3 3.4 5.3 0 6.8-1.5 6.8-3.4 0-1.7-1.3-2.9-3.4-2.9h-6.8zM10.5 2.4C4.3 5.2 0 11.4 0 18.7c0 4.9 2 9.4 5.2 12.6V31c0-3.2 3.1-4.4 5.9-5-2.6-.6-3.9-2.5-3.9-4.4 0-2.6 2.9-4.8 4.3-5.8l-.2-.1c-2.5-1.4-4.1-3.8-4.1-7 0-2.7 1.2-4.9 3.3-6.3M36 18.8C36 11.4 31.5 5 25.1 2.3c2.1 1.4 3.4 3.5 3.5 6.3l.1.6c0 5.4-4.4 8.2-10.7 8.2-1.6 0-2.7-.1-4.1-.5-.6.4-1.1 1.1-1.1 1.8 0 .9.8 1.6 1.8 1.6h8.8c5.5 0 8.2 2.2 8.2 7.1 0 1.6-.3 3.1-1 4.3 3.3-3.4 5.4-7.9 5.4-12.9"></path></svg>' +
                '<div style="font-size: 24px; text-align: center; padding: 12px; padding-left: 20px; color: #bdbdbd; font-family: \'Guardian Egyptian Web\',Georgia,serif;">Loading…</div>';

            config = {
                'assetPath': '<%= assetPath %>'
            };

            // Load CSS asynchronously
            window.setTimeout(function() {
                addCSS('<%= assetPath %>/build/main.css');
            }, 10);

            // Load JS and init
            require(['<%= assetPath %>/build/main.js'], function(main) {
                main.init(el, context, config, mediator);
            }, function(err) { console.error('Error loading boot.', err); });
        }
    };
});
