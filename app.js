var fs = require('fs'),
    path = require('path');

var args = process.argv.slice(2);
var flvPath = args[0];

var mp3Path = path.basename(flvPath, 'flv');
var mp3Stream = fs.createWriteStream(mp3Path + 'mp3');
var META = 18,
    VIDEO = 9,
    AUDIO = 8;

function headerCheck(data) {
    return (data[0] === 70 && data[1] === 76 && data[2] === 86 &&
        data[3] === 1 && data[4] === 5 && data[5] === 0 && data[6] === 0 &&
        data[7] === 0 && data[8] === 9);
};

fs.readFile(flvPath, function(err, data) {
    if (err) return console.error(err);
    var pos = 13;
    if (headerCheck(data)) {
        console.log('flv file.');
        var length = data.length;
        console.log('length : %d', length);
        var type;
        while (pos !== length) {
            switch (data[pos]) {
                case META: //meta
                case VIDEO: //video
                case AUDIO: //audio
                    type = data[pos];
                    pos++;
                    var chunkSize = parseInt(data.slice(pos, pos + 3).toString('hex'), 16);
                    pos += 10; // data size + timestamp + space
                    var isMp3 = (data[pos] & 0xf0) >> 4 === 2;
                    if (type === AUDIO && isMp3) {
                        var buf = data.slice(pos + 1, pos + chunkSize);
                        mp3Stream.write(buf);
                    }
                    console.log('progress : %d%', (Math.round((pos+chunkSize) / length * 1000) / 10));
                    pos += chunkSize;
                    pos += 4; //footer
                    break;
            }
        }
        mp3Stream.end(function() {
            console.log('finished.');
        });
    } else {
        throw new Error('This file is not flv format.');
    }
});
