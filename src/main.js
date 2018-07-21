var ac = new (window.AudioContext || window.webkitAudioContext);
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;
var masterGainNode = ac.createGain();
masterGainNode.gain.value = .8;
masterGainNode.connect(ac.destination);

var micStream;
var activeRecorder;
var recordingCount = 1000;

var trackMasterGains = []; //array of track master gain nodes
var trackVolumeGains = [];
var trackInputNodes = [];
var trackCompressors = [];
var trackReverbs = [];
var trackFilters = [];
var trackDelays = [];
var trackTremolos = [];

var activeTrack; //the currently selected track (for editing effects etc.)

var effects;                      //json of effect data
var buffers = [];                 //contains AudioBuffer and id# of samples in workspace
var times = [];                   //contains start times of samples and their id#
var reverbIRs = [];
var pixelsPer16 = 6;              //pixels per 16th note used for grid snapping
var pixelsPer4 = 4 * pixelsPer16; //pixels per 1/4 note used for sample canvas size
var bpm = tempo;
var secondsPer16 = 0.25 * 60 / bpm;

var LatencyClip ;


jQuery.removeFromArray = function(value, arr) {
    return jQuery.grep(arr, function(elem, index) {
        return elem.id !== value;
    });
};


var globalNumberOfTracks;
var globalWavesurfers = [];

var wavesurfer = (function() {
    'use strict';

    var createClip = function(song) {
if (sampleTitle == 'latency.wav') console.info("createClip() song.id" +  song.id + " song.duration=" +  song.duration) ;


        var startTimes = song.startTime;
        var sampleNumber = 0;
        var sampleUrl = song.url.split("/");
        var sampleTitle = sampleUrl[sampleUrl.length - 1];
        var obj;
        $("#libraryList").append("<li id=librarySample" + song.id + " class=\"librarySample\" data-id=" + song.id + " data-url=" + song.url + " data-duration=" + song.duration + "><a href=\"#\">" + sampleTitle + "</a></li>");
        $("#librarySample" + song.id).draggable({
            revert: true,
            helper: "clone",
            start: function(event, ui) { $(this).css("z-index", 10); }
        });
        $.each(startTimes, function() {
            if (sampleNumber == 0) {
                obj = ({bufferURL: song.url, id: song.id, startTimes: song.startTime, track: song.track});
            }

            var currentStartTime = parseInt(song.startTime[sampleNumber]);
            var trackDiv = $("#track" + song.track);

            createClipElements('sample', song.id, sampleNumber, currentStartTime,
                               trackDiv, song.duration, song.track);

            $("#sample" + song.id + "Span" + sampleNumber).resizable({
                helper: "ui-resizable-helper",
                handles: "e",
                grid: pixelsPer16
            });

            createClipWavesurfer('#08c', '#08c', song.url);

            sampleNumber++;
        });


if (sampleTitle == 'latency.wav') console.info("createClip() out") ;


        return obj;
    };

    var processData = function(json) {
        var numberOfTracks = parseInt(json.projectInfo.tracks);
        effects = json.projectInfo.effects;

        //create track-specific nodes
        globalNumberOfTracks = numberOfTracks;
        for (var i = 0; i < numberOfTracks; i++) {
            var currentTrackNumber = i + 1;
            createNodes(currentTrackNumber);
            createTrack(currentTrackNumber);
            $.each(effects[i], function() {
                if (this.type == "Compressor") {
                    var trackCompressor = ac.createDynamicsCompressor();
                    var inputNode = trackInputNodes[currentTrackNumber];
                    var volumeNode = trackVolumeGains[currentTrackNumber];
                    inputNode.disconnect();
                    inputNode.connect(trackCompressor);
                    trackCompressor.connect(volumeNode);
                    trackCompressors[currentTrackNumber] = trackCompressor;
                }
                if (this.type == "Filter") {
                    var trackFilter = ac.createBiquadFilter();
                    var inputNode = trackInputNodes[currentTrackNumber];
                    var volumeNode = trackVolumeGains[currentTrackNumber];
                    inputNode.disconnect();
                    inputNode.connect(trackFilter);
                    trackFilter.connect(volumeNode);
                    trackFilters[currentTrackNumber] = trackFilter;
                }
            });
        }

        //wavesurfers is array of all tracks
        var wavesurfers = json.samples.map(createClip);
        $.each(wavesurfers, function() {
            var clip = this;
            //if they are in workspace...
            if (clip != undefined) {
                var bufferUrl = clip.bufferURL;
                var clipId = clip.id;
                var startTimes = clip.startTimes;
                var trackId = sample.track;

                //load the buffer
                load(bufferUrl, clipId);
                //store the times
                $.each(startTimes, function() { setStartTimes(this, clipId, trackId); });
            }
        });
    };

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == this.DONE && this.status == 200) {
            processData(JSON.parse(this.responseText));
        }
    };
    xhr.open('GET', 'src/data/samples.txt');
    xhr.send();


createTrack(LATENCY_IN_TRACK_N);
var latency_ping_dict = {"id":"42","url":"src/data/samples/latency.wav","track":"42","startTime":[0],"duration":"1.122244954109192"} ;

LatencyClip = createWavesurfer(latency_ping_dict) ;
if (LatencyClip != undefined)
{
  load(LatencyClip.bufferURL, LatencyClip.id);
  $.each(LatencyClip.startTimes, function()
  {
    var currentStartTime = this;
    times[currentStartTime] = [ { id: LatencyClip.id , track: LatencyClip.track } ] ;
  }) ;
}
//             var source = ac.createBufferSource() ;
//             source.connect(trackInputNodes[LatencyClip.track]) ;
//             source.buffer = buffers[LatencyClip.id].buffer;
//
//             push source node and the scheduled start time of the sample
//             activeSources.push({sourceNode: source, sourceStartBar: beatNumber});
//             source.start(ac.currentTime);
}());


function createClipElements(idPrefix , clipId , sampleNumber , startTime ,
                            trackDiv , clipDuration , trackId)
{
if (sampleTitle == 'latency.wav') console.info("createClipElements() in startTime=" + startTime) ;


    var span = document.createElement('span');
    var canvas = document.createElement('canvas');
    var displayW = parseFloat(clipDuration) * pixelsPer4 * bpm / 60 ;
    var spanId = idPrefix + clipId + 'Span' + sampleNumber;
    var canvasId = idPrefix + clipId + 'Canvas' + sampleNumber;
    var spanJq = $(span);

    span.id = spanId;
    canvas.id = canvasId;
    canvas.className = 'sample';
    canvas.width = displayW;
    canvas.height = 80;

    trackDiv.append(span);
    spanJq.append(canvas);
    spanJq.width(displayW);
    spanJq.attr('data-startTime', startTime);
    spanJq.css('left', '' + (startTime * pixelsPer16) + "px");
    spanJq.css('position', 'absolute');
    spanJq.draggable({
        axis: 'x',
        containment: 'parent',
        grid: [ pixelsPer16, 0 ],
        stop: function() {
            var currentStartBar = $(this).attr('data-startTime');
            var newStartTime = parseInt($(this).css('left')) / pixelsPer16;
            $(this).attr('data-startTime', newStartTime);
            times[currentStartBar] = jQuery.removeFromArray(clipId, times[currentStartBar]);
            setStartTimes(newStartTime, clipId, trackId);
        }
    });
}

function createClipWavesurfer(waveColor, progressColor, clipUrl)
{
    var wavesurfer = Object.create(WaveSurfer);

    wavesurfer.init({
        canvas: canvas,
        waveColor: waveColor,
        progressColor: progressColor,
        loadingColor: 'purple',
        cursorColor: 'navy',
        audioContext: ac
    });
    wavesurfer.load(clipUrl);
    globalWavesurfers.push(wavesurfer);
}

function load(src, id) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', src, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('load', function(e) {
        function loadAudioBuffer(buffer) { buffers[id] = {buffer: buffer}; }
        ac.decodeAudioData(e.target.response, loadAudioBuffer, Error);
    }, false);
    xhr.send();
};

function setStartTimes(startTime, clipId, trackId)
{
    if (times[startTime] == null) {
        times[startTime] = [ { id: clipId, track: trackId } ];
    } else {
        times[startTime].push({ id: clipId, track: trackId });
    }
}


initSched({
    bufferArray: buffers,
    audioContext: ac
});
$('body').bind('playPause-event', function(e) {
    schedPlay(ac.currentTime);
});
$('body').bind('stop-event', function(e) {
    schedStop();
});
$('body').bind('stepBackward-event', function(e) {
    schedStepBack(ac.currentTime);
});
$('body').bind('mute-event', function(e, trackNumber) {
    muteTrack(trackNumber);
});
$('body').bind('solo-event', function(e, trackNumber) {
    solo(trackNumber);
});
$('body').bind('zoomIn-event', function(e) {
    timelineZoomIn();
});
$('body').bind('zoomOut-event', function(e) {
    timelineZoomOut();
});


$(document).ready(function() {
    $(".effectDrag").draggable({
        revert: true,
        helper: "clone"
    });
    $("#effectSortable").sortable({
        cancel: "canvas,input",
        /*
        sort: function(event, ui) {
             console.log($("#effectSortable").sortable("toArray"))
        }*/
    });

    $("#trackEffects").droppable({
        accept: ".effectDrag",
        drop: function(event, ui) {
            $("#" + ui.draggable[0].textContent).removeClass('hidden');
            if (ui.draggable[0].textContent == "Reverb") {
                $("#reverbIrSelectKnob").val(0).trigger('change');
                $("#reverbWetDryKnob").val(50).trigger('change');


                var trackReverb = createTrackReverb();
                var inputNode = trackInputNodes[activeTrack];
                var volumeNode = trackVolumeGains[activeTrack];

                inputNode.disconnect();
                inputNode.connect(trackReverb[0]);

                if (trackFilters[activeTrack] != null) {
                    trackReverb[1].connect(trackFilters[activeTrack]);
                } else if (trackCompressors[activeTrack != null]) {
                    trackReverb[1].connect(trackCompressors[activeTrack]);
                } else if (trackTremolos[activeTrack != null]) {
                    trackReverb[1].connect(trackTremolos[activeTrack][0]);
                } else if (trackDelays[activeTrack] != null) {
                    trackReverb[1].connect(trackDelays[activeTrack][0]);
                } else {
                    trackReverb[1].connect(volumeNode);
                }

                trackReverbs[activeTrack] = trackReverb;
                effects[activeTrack - 1].push({
                    type: "Reverb",
                    ir:  "0",
                    wetDry: "50"
                });
            }
            if (ui.draggable[0].textContent == "Filter") {
                $("#filterCutoffKnob").val(30).trigger('change');
                $("#filterQKnob").val(1).trigger('change');
                $("#filterTypeKnob").val(0).trigger('change');
                var trackFilter = ac.createBiquadFilter();
                var inputNode = trackInputNodes[activeTrack];
                var volumeNode = trackVolumeGains[activeTrack];

                if (trackReverbs[activeTrack] != null) {
                    trackReverbs[activeTrack][1].disconnect();
                    trackReverbs[activeTrack][1].connect(trackFilter);
                } else {
                    inputNode.disconnect();
                    inputNode.connect(trackFilter);
                }

                if (trackCompressors[activeTrack] != null) {
                    trackFilter.connect(trackCompressors[activeTrack]);
                } else if (trackTremolos[activeTrack != null]) {
                    trackFilter.connect(trackTremolos[activeTrack][0]);
                } else if (trackDelays[activeTrack] != null) {
                    trackFilter.connect(trackDelays[activeTrack][0]);
                } else {
                    trackFilter.connect(volumeNode);
                }

                trackFilters[activeTrack] = trackFilter;
                effects[activeTrack - 1].push({
                    type: "Filter",
                    cutoff: "30",
                    q: "1",
                    filterType: "0"
                });
            }
            if (ui.draggable[0].textContent == "Compressor") {
                $("#compressorThresholdKnob").val(-24).trigger('change');
                $("#compressorRatioKnob").val(12).trigger('change');
                $("#compressorAttackKnob").val(3).trigger('change');
                var trackCompressor = ac.createDynamicsCompressor();
                var inputNode = trackInputNodes[activeTrack];
                var volumeNode = trackVolumeGains[activeTrack];

                if (trackFilters[activeTrack] != null) {
                    trackFilters[activeTrack].disconnect();
                    trackFilters[activeTrack].connect(trackCompressor);
                } else if (trackReverbs[activeTrack] != null) {
                    trackReverbs[activeTrack][1].disconnect();
                    trackReverbs[activeTrack][1].connect(trackCompressor);
                } else {
                    inputNode.disconnect();
                    inputNode.connect(trackCompressor);
                }

                if (trackTremolos[activeTrack != null]) {
                    trackCompressor.connect(trackTremolos[activeTrack][0]);
                } else if (trackDelays[activeTrack] != null) {
                    trackCompressor.connect(trackDelays[activeTrack][0]);
                } else {
                    trackCompressor.connect(volumeNode);
                }

                trackCompressors[activeTrack] = trackCompressor;
                effects[activeTrack - 1].push({
                    type: "Compressor",
                    threshold: "-24",
                    ratio: "12",
                    attack: ".003"
                });
                //console.log(effects[activeTrack-1]);
            }
            if (ui.draggable[0].textContent == "Tremolo") {

                $("#tremoloRateKnob").val(1).trigger('change');
                $("#tremoloDepthKnob").val(10).trigger('change');
                var trackTremolo = createTrackTremolo();
                var inputNode = trackInputNodes[activeTrack];
                var volumeNode = trackVolumeGains[activeTrack];

                if (trackCompressors[activeTrack] != null) {
                    trackCompressors[activeTrack].disconnect();
                    trackCompressors[activeTrack].connect(trackTremolo[0]);
                } else if (trackFilters[activeTrack] != null) {
                    trackFilters[activeTrack].disconnect();
                    trackFilters[activeTrack].connect(trackTremolo[0]);
                } else if (trackReverbs[activeTrack] != null) {
                    trackReverbs[activeTrack][1].disconnect();
                    trackReverbs[activeTrack][1].connect(trackTremolo[0]);
                } else {
                    inputNode.disconnect();
                    inputNode.connect(trackTremolo[0]);
                }

                if (trackDelays[activeTrack] != null) {
                    trackTremolo[1].connect(trackDelays[activeTrack][0]);
                } else {
                    trackTremolo[1].connect(volumeNode);
                }

                trackTremolos[activeTrack] = trackTremolo;
                effects[activeTrack - 1].push({
                    type: "Tremolo",
                    rate: "1",
                    depth: "10"
                });
                //console.log(effects[activeTrack-1]);
            }
            if (ui.draggable[0].textContent == "Delay") {
                $("#delayTimeKnob").val(1).trigger('change');
                $("#delayFeedbackKnob").val(20).trigger('change');
                $("#delayWetDryKnob").val(50).trigger('change');
                var trackDelay = createTrackDelay();
                var inputNode = trackInputNodes[activeTrack];
                var volumeNode = trackVolumeGains[activeTrack];

                if (trackFilters[activeTrack] != null) {
                    trackFilters[activeTrack].disconnect();
                    trackFilters[activeTrack].connect(trackDelay[0]);
                } else if (trackReverbs[activeTrack] != null) {
                    trackReverbs[activeTrack][1].disconnect();
                    trackReverbs[activeTrack][1].connect(trackDelay[0]);
                } else if (trackCompressors[activeTrack] != null) {
                    trackCompressors[activeTrack].disconnect();
                    trackCompressors[activeTrack].connect(trackDelay[0]);
                } else if (trackTremolos[activeTrack] != null) {
                    trackTremolos[activeTrack][1].disconnect();
                    trackTremolos[activeTrack][1].connect(trackDelay[0]);
                } else {
                    inputNode.disconnect();
                    inputNode.connect(trackDelay[0]);
                }

                trackDelay[1].connect(volumeNode);

                trackDelays[activeTrack] = trackDelay;
                effects[activeTrack - 1].push({
                    type: "Delay",
                    time: "1",
                    feedback: "20",
                    wetDry: "50"
                });
            }
        }
    });

    $("#compressorThresholdKnob").knob({
        change : function(v) {
            setCompressorThresholdValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Compressor") {
                    this.threshold = v;
                }
            });
        }
    });
    $("#compressorRatioKnob").knob({
        change : function(v) {
            setCompressorRatioValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Compressor") {
                    this.ratio = v;
                }
            });
        }
    });
    $("#compressorAttackKnob").knob({
        change : function(v) {
            setCompressorAttackValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Compressor") {
                    this.attack = v / 1000;
                }
            });
        }
    });

    $("#filterCutoffKnob").knob({
        change : function(v) {
            setFilterCutoffValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Filter") {
                    this.cutoff = v;
                }
            });
        }
    });
    $("#filterQKnob").knob({
        change : function(v) {
            setFilterQValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Filter") {
                    this.q = v;
                }
            });
        }
    });
    $("#filterTypeKnob").knob({
        change : function(v) {
            setFilterType(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Filter") {
                    this.filterType = v;
                }
            });
        }
    });

    $("#reverbWetDryKnob").knob({
        change : function(v) {
            setReverbWetDryValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Reverb") {
                    this.wetDry = v;
                }
            });
        }
    });
    $("#reverbIrSelectKnob").knob({
        change : function(v) {
            setReverbIr(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Reverb") {
                    this.ir = v;
                }
            });
        }
    });

    //$("#reverbList").onchange= setReverbIR()

    $("#delayTimeKnob").knob({
        change : function(v) {
            setDelayTimeValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Delay") {
                    this.time = v;
                }
            });
        }
    });
    $("#delayFeedbackKnob").knob({
        change : function(v) {
            setDelayFeedbackValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Delay") {
                    this.feedback = v;
                }
            });
        }
    });
    $("#delayWetDryKnob").knob({
        change : function(v) {
            setDelayWetDryValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Delay") {
                    this.wetDry = v;
                }
            });
        }
    });

    $("#tremoloRateKnob").knob({
        change : function(v) {
            setTremoloRateValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Tremolo") {
                    this.rate = v;
                }
            });
        }
    });
    $("#tremoloDepthKnob").knob({
        change : function(v) {
            setTremoloDepthValue(activeTrack, v);
            $.each(effects[activeTrack - 1], function() {
                if (this.type == "Tremolo") {
                    this.depth = v;
                }
            });
        }
    });

    $(".dial").knob();

    $("#playPause").click(function() {
        $('body').trigger('playPause-event');
    });
    $("#stop").click(function() {
        $('body').trigger('stop-event');
    });
    $("#step-backward").click(function() {
        $('body').trigger('stepBackward-event');
    });
    $("#zoomIn").click(function() {
        $('body').trigger('zoomIn-event');
        var WavesurferCanvases = $(".sample");
        $.each(WavesurferCanvases, function() {
            var wavesurferCanvas = this;
            var oldWidth = wavesurferCanvas.width;
            var newWidth = oldWidth * 2;
            wavesurferCanvas.width = newWidth;
            $($(wavesurferCanvas).parent()[0]).css("width", newWidth + "px");
            var oldLeft = parseInt($($(wavesurferCanvas).parent()[0]).css("left"));
            $($(wavesurferCanvas).parent()[0]).css("left", "" + oldLeft * 2 + "px");
        });
        $.each(globalWavesurfers, function() {
            var wavesurfer = this;
            wavesurfer.drawer.clear();
            wavesurfer.drawer.width  = wavesurfer.drawer.width * 2;
            wavesurfer.drawer.drawBuffer(wavesurfer.backend.currentBuffer);
        });
    });
    $("#zoomOut").click(function() {
        $('body').trigger('zoomOut-event');
        var WavesurferCanvases = $(".sample");
        $.each(WavesurferCanvases, function() {
            var wavesurferCanvas = this;
            var oldWidth = wavesurferCanvas.width;
            wavesurferCanvas.width = oldWidth / 2 + 1;
            $($(wavesurferCanvas).parent()[0]).css("width", oldWidth / 2 + 1 + "px");
            var oldLeft = parseInt($($(wavesurferCanvas).parent()[0]).css("left"));
            $($(wavesurferCanvas).parent()[0]).css("left", "" + oldLeft / 2 + "px");
        });
        $.each(globalWavesurfers, function() {
            var wavesurfer = this;
            wavesurfer.drawer.clear();
            wavesurfer.drawer.width = wavesurfer.drawer.width / 2 + 1;
            wavesurfer.drawer.drawBuffer(wavesurfer.backend.currentBuffer);
        });
    });
    $("#trackEffectsClose").click(function() {
        $("#trackEffects").css("display", "none");
        $("#masterControl").css("display", "none");
    });

    $("#masterVolume").slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 100,
        value: 80,
        slide: function(event, ui) {
            setMasterVolume(ui.value);
        }
    });

    $("#addTrackButton").click(function() {
        var newTrackNumber = globalNumberOfTracks + 1;
        globalNumberOfTracks++;
        if (globalNumberOfTracks > 4) {
            var currentSideBarHeight = parseInt($(".sidebar").css('height'));
            currentSideBarHeight += 90;
            $(".sidebar").css('height', "" + currentSideBarHeight + "px");
        }
        createNodes(newTrackNumber);
        createTrack(newTrackNumber);
    });


var LATENCY_IN_TRACK_N = 42;
var LATENCY_OUT_TRACK_N = 43;
createNodes(LATENCY_IN_TRACK_N);
createNodes(LATENCY_OUT_TRACK_N);
createTrack(LATENCY_OUT_TRACK_N);
[ { 'track-n': LATENCY_IN_TRACK_N  , 'label': 'Input' } ,
  { 'track-n': LATENCY_OUT_TRACK_N , 'label': 'Reference' } ].forEach(function(latencyTrackDict)
{
var latencyTrackN = latencyTrackDict['track-n'];
var latencyTrackLabel = latencyTrackDict['label'];
var latencyTrack = document.getElementById("selectTrack" + latencyTrackN);
document.getElementById('fake-modal-div').appendChild(latencyTrack);
document.getElementById('track' + latencyTrackN + 'title').textContent = latencyTrackLabel;
}) ;
$('#latency-input').change(function() {
console.info("#latency-input onchange=" + (this).val());
                                        /*borked*/ activeRecorder.setLatency((this).val()) ; }) ;

//             var source = ac.createBufferSource() ;
//             source.connect(trackInputNodes[LatencyClip.track]) ;
//             source.buffer = buffers[LatencyClip.id].buffer;

//             push source node and the scheduled start time of the sample
//             activeSources.push({sourceNode: source, sourceStartBar: beatNumber});
//             source.start(ac.currentTime);


    drawTimeline();
});


function createTrack(trackNumber) {
    $("#tracks").append("<div class=\"row-fluid\" id=\"selectTrack" + trackNumber + "\"><div class=\"span2 trackBox\" style=\"height: 84px;\"><p style=\"margin: 0 0 0 0;\" id=\"track" + trackNumber + "title\">Track" + trackNumber + "</p><div style=\"margin: 5px 0 5px 0;\" id=\"volumeSlider" + trackNumber + "\"></div><div class=\"btn-toolbar\" style=\"margin-top: 0px;\"><div class=\"btn-group\"><button type=\"button\" class=\"btn btn-mini\" id= \"solo" + trackNumber + "\"><i class=\"icon-headphones\"></i></button><button type=\"button\" class=\"btn btn-mini\" id= \"mute" + trackNumber + "\"><i class=\"icon-volume-off\"></i></button></div><div class=\"btn-group\"><button type=\"button\" class=\"btn btn-mini\" data-toggle=\"button\" id= \"record" + trackNumber + "\"><i class=\"icon-plus-sign\"></i></button></div></div></div><div id=\"track" + trackNumber + "\" class=\"span10 track\"></div></div>");
    if (effects[trackNumber - 1] == null) {
        effects[trackNumber - 1] = [];
    }
    $("#volumeSlider" + trackNumber).slider({
        value: 80,
        orientation: "horizontal",
        range: "min",
        min: 0,
        max: 100,
        animate: true,
        slide: function(event, ui) {
            var muteTrackNumber = $(this).attr('id').split('volumeSlider')[1];
            setTrackVolume(muteTrackNumber, ui.value);
        }
    });
    $("#selectTrack" + trackNumber).click(function() {
        var printTrackNumber = $(this).attr('id').split('selectTrack')[1];
        activeTrack = printTrackNumber;
        //compensation for off by one (track1 = effects[0])
        $(".effect").addClass("hidden");
        $.each(effects[activeTrack - 1], function() {
            var currentEffect = this;
            $("#" + currentEffect.type).removeClass("hidden");
            if (currentEffect.type == "Compressor") {
                $("#compressorThresholdKnob").val(currentEffect.threshold).trigger('change');
                $("#compressorRatioKnob").val(currentEffect.ratio).trigger('change');
                $("#compressorAttackKnob").val(currentEffect.attack * 1000).trigger('change');
            }
            if (currentEffect.type == "Filter") {
                $("#filterCutoffKnob").val(currentEffect.cutoff).trigger('change');
                $("#filterQKnob").val(currentEffect.q).trigger('change');
                $("#filterTypeKnob").val(currentEffect.filterType).trigger('change');
            }
            if (currentEffect.type == "Reverb") {
                $("#reverbWetDryKnob").val(currentEffect.wetDry);
                $("#reverbIrSelectKnob").val(currentEffect.ir);

            }
            if (currentEffect.type == "Delay") {
                $("#delayTimeKnob").val(currentEffect.time);
                $("#delayFeedbackKnob").val(currentEffect.feedback);
                $("#delayWetDryKnob").val(currentEffect.wetDry);
            }
            if (currentEffect.type == "Tremelo") {
                $("#tremeloRateKnob").val(currentEffect.rate).trigger('change');
                $("#tremeloDepthKnob").val(currentEffect.depth).trigger('change');
            }
        });
        Object.keys(effects[activeTrack - 1]);
        $("#trackEffectsHeader").html("Track " + printTrackNumber);
        $("#trackEffects").css("display", "block");
        $("#masterControl").css("display", "block");
    });
    $("#mute" + trackNumber).click(function() {
        $(this).button('toggle');
        var muteTrackNumber = $(this).attr('id').split('mute')[1];
        $('body').trigger('mute-event', muteTrackNumber);
    });
    $("#solo" + trackNumber).click(function() {
        $(this).button('toggle');
        var soloTrackNumber = $(this).attr('id').split('solo')[1];
        $('body').trigger('solo-event', soloTrackNumber);
    });


// $('#latency-input' + trackNumber).change(function() { activeRecorder.setLatency((this).val()) ; }) ;


    $("#record" + trackNumber).click(function() {
        var recordTrackNumber = $(this).attr('id').split('record')[1];
        $(this).button('toggle');
        if ($(this).hasClass('active')) {
            activeRecorder = createRecorder();
        } else {
            destroyRecorder(activeRecorder);
        }
    });
    $("#track" + trackNumber + "title").storage({
        storageKey : 'track' + trackNumber
    });
    $("#track" + trackNumber).droppable({
        accept: ".librarySample",
        drop: function(event, ui) {
            var startBar = Math.floor((ui.offset.left - $(this).offset().left) / 6);
            var sampleStartTime = startBar;
            var rand = parseInt(Math.random() * 10000);
            var sampleID = ui.helper.attr("data-id");
            var sampleDuration = ui.helper.attr("data-duration");
            var sampleURL = ui.helper.attr("data-url");

            createClipElements('sample', sampleID, rand, sampleStartTime,
                               $(this), sampleDuration, trackNumber);
// =
// *            var span = document.createElement('span');
// *            span.id = "sample" + sampleID + "Span" + rand;
// *            var canvas = document.createElement('canvas');
// *            canvas.className = "sample";
// *            canvas.id = "sample" + sampleID + "Canvas" + rand;
// *            $(this).append(span);
// *            $("#sample" + sampleID + "Span" + rand).append(canvas);
// *            $("#sample" + sampleID + "Span" + rand).width(parseFloat(sampleDuration) * ((pixelsPer4 * bpm) / 60));
// *            canvas.width = parseFloat(sampleDuration) * ((pixelsPer4 * bpm) / 60);
// *            canvas.height = 80;
// *            $("#sample" + sampleID + "Span" + rand).attr('data-startTime', startBar);
// *            $("#sample" + sampleID + "Span" + rand).css('left', "" + startBar * pixelsPer16 + "px");
// *            $("#sample" + sampleID + "Span" + rand).css('position', 'absolute');
// *            $("#sample" + sampleID + "Span" + rand).draggable({
// *                axis: "x",
// *                containment: "parent",
// *                grid: [pixelsPer16, 0],                //grid snaps to 16th notes
// *                stop: function() {
// *                    var currentStartBar = $(this).attr('data-startTime');
// *                    times[currentStartBar] = jQuery.removeFromArray(sampleID, times[currentStartBar]);
// *                    $(this).attr('data-startTime', parseInt($(this).css('left')) / pixelsPer16);
// *                    var newStartTime = $(this).attr('data-startTime');
// *                    if (times[newStartTime] == null) {
// *                        times[newStartTime] = [ {id: sampleID, track: trackNumber}];
// *                    } else {
// *                        times[newStartTime].push({id: sampleID, track: trackNumber});
// *                    }
// *                }
// *            });
// =
            createWavesurfer('violet', 'purple', sampleURL);
// =
// *            var wavesurfer = Object.create(WaveSurfer);
// *            wavesurfer.init({
// *                canvas: canvas,
// *                waveColor: 'violet',
// *                progressColor: 'purple',
// *                loadingColor: 'purple',
// *                cursorColor: 'navy',
// *                audioContext: ac
// *            });
// *            wavesurfer.load(sampleURL);
// *            globalWavesurfers.push(wavesurfer);
// =
            if (buffers[sampleID] == undefined) {
                load(sampleURL, sampleID);
            }
            setStartTimes(sampleStartTime, sampleID, trackNumber);
        }
    });
}

function createNodes(trackId) {
    //create a master gain node. specific tracks represented by trackId
    var trackMasterGainNode = ac.createGain();
    var trackInputNode = ac.createGain();
    var trackVolumeNode = ac.createGain();

    trackMasterGainNode.connect(masterGainNode);
    trackVolumeNode.connect(trackMasterGainNode);
    trackInputNode.connect(trackVolumeNode);

    trackMasterGains[trackId] = {node: trackMasterGainNode, isMuted: false, isSolo: false};
    trackVolumeGains[trackId] = trackVolumeNode;
    trackInputNodes[trackId] = trackInputNode;
}

function createRecorder()
{
    //Start Recording
    var input = ac.createMediaStreamSource(micStream);
    //input.connect(ac.destination);
    var recorder = new Recorder(input);
    recorder.record();
    schedPlay(ac.currentTime);

    return recorder;
}

function destroyRecorder(recorder)
{
    //Stop Recording
    recorder.stop();

    var recordingDuration;

    var startBar;
    if (pauseBeat == undefined) {
        startBar = 0;
    } else {
        startBar = pauseBeat;
    }

    recorder.getBuffer(function(recordingBuffer) {
        var newBuffer = ac.createBuffer(2, recordingBuffer[0].length, ac.sampleRate);
        //var newSource = ac.createBufferSourceNode();
        var trackDiv = $("#track" + recordTrackNumber);
        recordingDuration = recordingBuffer[0].length / ac.sampleRate;

        newBuffer.getChannelData(0).set(recordingBuffer[0]);
        newBuffer.getChannelData(1).set(recordingBuffer[1]);
        //newSource.buffer = newBuffer;
        createClipElements('recording', recordingCount, '', startBar,
                            trackDiv, recordingDuration, recordTrackNumber);
// =
// *        var span = document.createElement('span');
// *        span.id = "recording" + recordingCount + "Span";
// *        var canvas = document.createElement('canvas');
// *        canvas.className = "sample";
// *        canvas.id = "recording" + recordingCount + "Canvas";
// *        $("#track" + recordTrackNumber).append(span);
// *        $("#recording" + recordingCount + "Span").append(canvas);
// *        $("#recording" + recordingCount + "Span").width(parseFloat(recordingDuration) * ((pixelsPer4 * bpm) / 60));
// *        $("#recording" + recordingCount + "Span").attr('data-startTime', startBar);
// *        $("#recording" + recordingCount + "Span").css('left', "" + startBar * pixelsPer16 + "px");
// *        $("#recording" + recordingCount + "Span").css('position', 'absolute');
// *        $("#recording" + recordingCount + "Span").draggable({
// *            axis: "x",
// *            containment: "parent",
// *            grid: [pixelsPer16, 0],                //grid snaps to 16th notes
// *            stop: function() {
// *                //get rid of old entry in table
// *                var currentRecordingCount = parseInt($(this).attr('id').split('recording')[1]);
// *                var currentStartBar = $(this).attr('data-startTime');
// *                times[currentStartBar] = jQuery.removeFromArray(currentRecordingCount, times[currentStartBar]);
// *                $(this).attr('data-startTime', parseInt($(this).css('left')) / pixelsPer16);
// *                var newStartTime = $(this).attr('data-startTime');
// *                if (times[newStartTime] == null) {
// *                    times[newStartTime] = [ {id: currentRecordingCount, track: recordTrackNumber}];
// *                } else {
// *                    times[newStartTime].push({id: currentRecordingCount, track: recordTrackNumber});
// *                }
// *                console.log("Old Start Time: " + currentStartBar);
// *                console.log("New Start Time: " + newStartTime);
// *            }
// *        });
// *        canvas.width = parseFloat(recordingDuration) * ((pixelsPer4 * bpm) / 60);
// *        canvas.height = 80;
// =
        recorder.exportWAV(function(blob) {
            var url = URL.createObjectURL(blob);
            createWavesurfer('#08c', '#08c', url);
// =
// *            var wavesurfer = Object.create(WaveSurfer);
// *            wavesurfer.init({
// *                canvas: canvas,
// *                waveColor: '#08c',
// *                progressColor: '#08c',
// *                loadingColor: 'purple',
// *                cursorColor: 'navy',
// *                audioContext: ac
// *            });
// *            wavesurfer.load(url);
// *            globalWavesurfers.push(wavesurfer);
// =
            buffers[recordingCount] = {buffer: newBuffer};

            setStartTimes(startBar, recordingCount, recordTrackNumber);

            recordingCount++;
        });
    });
}

function startUserMedia(stream) {
    micStream = stream;
}

window.onload = function init() {
    try {
        // webkit shim
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

    } catch (e) {
        alert('No web audio support in this browser!');
    }

//     navigator.getUserMedia({audio: true}, startUserMedia, function(e) {});
};
