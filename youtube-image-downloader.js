// Dependencies
var Youtube = require("youtube-api")
    , fs = require('fs')
    , config = require("./data/config")
    , Request = require("request")
    , path = require("path")
    , gm = require('gm')
    , mkdirp = require('mkdirp')
;


Youtube.authenticate({
    type: "key"
    , key: config.api_key
}, function (err, data) {
    console.log(err || JSON.stringify(data, null, 2));
});

config.playlists.forEach(function(playlist) {
    downloadImages(playlist);
})

function downloadImages(playlistId) {


    Youtube.playlistItems.list({
        "part": "snippet",
        "playlistId": playlistId,
        "maxResults": 10 // The API only returns up to 50 results per query.
    }, function (err, data) {

        if(err) {
            console.log(err);
        } else {

            console.log("Downloading images for: " + playlistId);

            data.items.forEach(function(video) {

                //console.log("video.snippet.thumbnails", video.snippet);

                var uri = false;
                if(video.snippet.thumbnails['maxres'] !== undefined) {
                    uri = video.snippet.thumbnails['maxres'].url;
                } else if(video.snippet.thumbnails['high'] !== undefined) {
                    uri = video.snippet.thumbnails['high'].url;
                } else if(video.snippet.thumbnails['medium'] !== undefined) {
                    uri = video.snippet.thumbnails['medium'].url;
                } else if(video.snippet.thumbnails['standard'] !== undefined) {
                    uri = video.snippet.thumbnails['standard'].url;
                }

                if(uri) {

                    var videoId = video.snippet.resourceId.videoId,
                        playlistPath = path.join( config.image_output, playlistId),
                        file = path.join( playlistPath, videoId+".jpg");

                    mkdirp( playlistPath , function (err) {

                        if(!err) {

                            // Request image file from YT and apply some filters
                            // see http://aheckmann.github.io/gm/docs.html for the gm documentation.
                            gm( Request(uri) )
                                //.type("Grayscale") // Change colour mode
                                //.resize(1280, 720, "!") // resize image
                                .stream(function (err, stdout, stderr) {


                                    var writeStream = fs.createWriteStream( file );

                                    console.log("Saving image " + uri + " to " + file);

                                    writeStream.on('finish', function() {
                                        //console.log("Finished saving image to " + file);
                                    });
                                    writeStream.on('error', function(err, data) {
                                        console.log("Ooops, could not download " + uri);
                                    });

                                    stdout.pipe(writeStream);

                                });

                        }

                    });

                }

            })

        }

    });

}
