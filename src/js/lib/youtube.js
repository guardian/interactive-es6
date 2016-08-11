import youTubeIframe from 'youtube-iframe-player'

export function pimpYouTubePlayer(videoId, placeholderId, height, width) {

    youTubeIframe.init(function() {
        //preload youtube iframe API

        const p = document.getElementById('placeholder');
        p.addEventListener('click', function() {
            var youTubePlayer = youTubeIframe.createPlayer(placeholderId, {
                height: height,
                width: width,
                videoId: videoId,
                playerVars: { 'autoplay': 0, 'controls': 1 },
                events: {
                    'onReady': playerReady
                }
            });

            function playerReady(event) {
                p.style.display = 'none';
                youTubePlayer.playVideo();
            }
        });
    })
}

export { pimpYouTubePlayer };
