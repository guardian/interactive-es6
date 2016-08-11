import youTubeIframe from 'youtube-iframe-player'
import reqwest from 'reqwest'

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

function getYouTubeVideoDuration(videoId){
    //Note: This is a browser key intended to be exposed on the client-side.
    const apiKey = 'AIzaSyCtM2CJsgRhfXVj_HesBIs540tzD4JUXqc';

    reqwest({
        url: 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=' + videoId + '&key=' + apiKey,
        type: 'json',
        crossOrigin: true,
        success: (resp) => {let duration =  resp.items[0].contentDetails.duration;
                            let re = /PT(\d+)M(\d+)S/;
                            console.log(duration.replace(re,'$1:$2'));}
    });
}

export { pimpYouTubePlayer, getYouTubeVideoDuration };
