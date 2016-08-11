import youTubeIframe from 'youtube-iframe'

export default function pimpYouTubePlayer(videoId, placeholderId) {

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


    function onPlayerReady(event) {
        p.style.display = 'none';
        event.target.playVideo();
    }
    

    const p = document.getElementById('placeholder');
    p.addEventListener('click', function() {
        youTubeIframe.load(function(YT) {
            new YT.Player(placeholderId, {
                height: '390',
                width: '640',
                videoId: videoId,
                enablejsapi: 1,
                events: {
                    onReady: onPlayerReady
                },
                playerVars: getPlayerProps()
            });
        });
    });
}
