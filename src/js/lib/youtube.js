export default function pimpYouTubePlayer(videoId, placeholderId) {
    var player;

    function getPlayerProps() {
        const o = {};
        Array.from(document.querySelectorAll('input')).forEach(function(input) {
            var key = input.id;
            var val = input.value;
            o[key] = val;
        });
        o.autoplay = 1;

        return o;
    }




    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    function onPlayerReady(event) {
        p.style.display = 'none';
        event.target.playVideo();
    }



    const p = document.getElementById('placeholder');
    p.addEventListener('click', function() {
        player = new YT.Player(placeholderId, {height: '390',
            width: '640',
            videoId: videoId,
            enablejsapi: 1,
            events: {
                onReady: onPlayerReady
            },
            playerVars: getPlayerProps()
        });
    });



}
