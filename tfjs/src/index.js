import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import FPSStats from "react-fps-stats";

import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import "./cameraStyles.css";

import "video.js/dist/video-js.css";
import videojs from "video.js";

import "webrtc-adapter";
import RecordRTC from "recordrtc";

import "videojs-record/dist/css/videojs.record.css";
import Record from "videojs-record/dist/videojs.record.js";

import firebase from "firebase";
const firebaseConfig = require('./firebaseConfig.js').firebaseConfig;

const webcam = true;
const flipImage = true;

const recordVideo = true;
const sendVideoToFirebase = true;
const postDataToServer = true;
const serverIp = '192.168.0.52'	// this is ip of raspberry pi - make sure to also update this in package.json
const serverPort = '4000'; // this is not same port as react app - this is server port

const WIDTH = "720";
const HEIGHT = "480";

const desiredCameraLabel = 'Logitech HD Webcam C270 (046d:0825)';

var enabled = true;
const minRecordTime = 5;

class App extends React.Component {
    videoRef = React.createRef();
    canvasRef = React.createRef();

    constructor(props) {
        super(props);
        this.state = { recording: 4, player: null };
    }

    componentDidMount() {        
        firebase.initializeApp(firebaseConfig);

        var storageRef = firebase.storage().ref();

        this.getAlarmEnabled();   
        setInterval(() => {
            this.getAlarmEnabled();
        }, 2000);     

        // instantiate Video.js
        this.state.player = videojs(this.videoNode, this.props, () => {
            // print version information at startup
            var version_info =
                "Using video.js " +
                videojs.VERSION +
                " with videojs-record " +
                videojs.getPluginVersion("record") +
                " and recordrtc " +
                RecordRTC.version;
            videojs.log(version_info);
        });

        // device is ready
        this.state.player.on("deviceReady", () => {
            console.log("device is ready!"); 
            this.state.recording = 0;           
        });

        // user clicked the record button and started recording
        this.state.player.on("startRecord", () => {
            console.log("started recording!");
            this.state.recording = 2;
        });

        // user completed recording and stream is available
        this.state.player.on("finishRecord", () => {
            // recordedData is a blob object containing the recorded data that
            // can be downloaded by the user, stored on server etc.
            console.log("finished recording: ", this.state.player.recordedData);  
            this.state.recording = 4;          

            var elapsedTime = this.state.player.record().getCurrentTime();
            console.log("Time: " + elapsedTime);

            if(sendVideoToFirebase && enabled){
            	if(elapsedTime >= minRecordTime){
                    var videoRef = storageRef.child("videos/" + (new Date()) + ".webm");
                    videoRef
                        .put(this.state.player.recordedData)
                        .then(function (snapshot) {
                            console.log("Uploaded a blob or file!");
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            }

            console.log("VAL: " + this.state.recording)
            this.state.player.record().getDevice();
        });

        // error handling
        this.state.player.on("error", (element, error) => {
            console.warn(error);
        });

        this.state.player.on("deviceError", () => {
            console.error("device error:", this.state.player.deviceErrorCode);
        });

        setInterval(() => {
            if(this.state.recording === 4)
                this.state.player.record().getDevice();
        }, 2000);        

        if (
            navigator.mediaDevices &&
            (navigator.mediaDevices.getUserMedia ||
                navigator.mediaDevices.getDisplayMedia)
        ) {
            if (webcam && flipImage) {
                const ctx = this.canvasRef.current.getContext("2d");
                ctx.translate(WIDTH, 0);
                ctx.scale(-1, 1);
            }

            const modelPromise = cocoSsd.load();

            if (webcam) {
            	let camId;
            	navigator.mediaDevices.enumerateDevices()
				.then(function(devices) {
				  devices.forEach(function(device) {
				  	if(device.kind === 'videoinput' && device.label === desiredCameraLabel){
				  		camId = device.deviceId;
				  		console.log(device.kind + ": " + device.label +
				                " id = " + device.deviceId);
				  	}				    
				  });
				})
				.catch(function(err) {
				  console.log(err.name + ": " + err.message);
				});

                const webCamPromise = navigator.mediaDevices
                    .getUserMedia({
                        audio: false,
                        video: {
                            //facingMode: "user"
                            deviceId: {
                            	exact: camId
                            }
                        },
                    })
                    .then((stream) => {
                        window.stream = stream;
                        this.videoRef.current.srcObject = stream;
                        return new Promise((resolve, reject) => {
                            this.videoRef.current.onloadedmetadata = () => {
                                resolve();
                            };
                        });
                    });

                Promise.all([modelPromise, webCamPromise])
                    .then((values) => {
                        this.detectFrame(this.videoRef.current, values[0]);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            } else {
                const webCamPromise = navigator.mediaDevices
                    .getDisplayMedia({
                        audio: false,
                        video: {
                            cursor: "never",
                            displaySurface: "application",
                        },
                    })
                    .then((stream) => {
                        window.stream = stream;
                        this.videoRef.current.srcObject = stream;
                        return new Promise((resolve, reject) => {
                            this.videoRef.current.onloadedmetadata = () => {
                                resolve();
                            };
                        });
                    });

                Promise.all([modelPromise, webCamPromise])
                    .then((values) => {
                        this.detectFrame(this.videoRef.current, values[0]);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        }
    }

    getAlarmEnabled = () => {
    	axios.get(`http://${serverIp}:${serverPort}/enabled`)
            .then((res) => {
                console.log("RESPONSE RECEIVED: ", res.data);
                enabled = res.data.enabled;

                if (this.state.recording === 2 && !enabled) {
                    console.log("Stopping");   
                    this.state.recording = 3;                 
                    this.state.player.record().stop();                    
                }
            })
            .catch((err) => {
                console.log("AXIOS ERROR: ", err);
            });
    }

    componentWillUnmount() {
        if (this.state.player) {
            this.state.player.dispose();
        }
    }

    detectFrame = (video, model) => {
        model.detect(video).then((predictions) => {
            this.renderPredictions(predictions);
            requestAnimationFrame(() => {
                this.detectFrame(video, model);
            });
        });
    };

    renderPredictions = (predictions) => {
        const ctx = this.canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Font options.
        const font = "16px sans-serif";
        ctx.font = font;
        ctx.textBaseline = "top";

        var data = [];
        var counter = 0;

        predictions.forEach((prediction) => {
            if (prediction.class === "person") {
                const x = prediction.bbox[0];
                const y = prediction.bbox[1];
                const width = prediction.bbox[2];
                const height = prediction.bbox[3];
                // Draw the bounding box.
                ctx.strokeStyle = "#00FFFF";
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, width, height);
                // Draw the label background.
                ctx.fillStyle = "#00FFFF";
                const textWidth = ctx.measureText(prediction.class).width;
                const textHeight = parseInt(font, 10); // base 10
                ctx.fillRect(x, y, textWidth + 30, textHeight + 4);

                counter++;
                // Draw the text last to ensure it's on top.
                ctx.fillStyle = "#000000";
                ctx.fillText(prediction.class + " " + counter.toString(), x, y);

                var dataContent = {
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                };
                data.push(dataContent);
            }
        });

        if (recordVideo && enabled) {
            if (data.length > 0) {
                //console.log("Time: " + this.state.player.record().getCurrentTime())
                if (this.state.recording === 0) {
                    console.log("Starting");    
                    this.state.recording = 1;                
                    this.state.player.record().start();                    
                }

                if(postDataToServer){
                	if(this.state.player.record().getCurrentTime() >= minRecordTime){
	                    var postData = {
	                        data: data,
	                    };

	                    var axiosConfig = {
	                        headers: {
	                            "Content-Type": "application/json",
	                        },
	                    };

	                    axios.post(
	                            `http://${serverIp}:${serverPort}`,
	                            postData,
	                            axiosConfig
	                        )
	                        .then((res) => {
	                            console.log("RESPONSE RECEIVED: ", res);
	                        })
	                        .catch((err) => {
	                            console.log("AXIOS ERROR: ", err);
	                        });
                    }
                }
            } else {
                if (this.state.recording === 2) {
                    console.log("Stopping");   
                    this.state.recording = 3;                 
                    this.state.player.record().stop();                    
                }
            }
        }
    };

    render() {
        return (
            <div>
                <ul>
                    <video
                        id="myVideo"
                        ref={(node) => (this.videoNode = node)}
                        className="video-js vjs-default-skin"
                        playsInline
                    ></video>
                    <video
                        className="size"
                        autoPlay
                        playsInline
                        muted
                        ref={this.videoRef}
                        width={WIDTH}
                        height={HEIGHT}
                    />
                    <canvas
                        className="size"
                        ref={this.canvasRef}
                        width={WIDTH}
                        height={HEIGHT}
                    />
                    <FPSStats />
                </ul>
            </div>
        );
    }
}

const videoJsOptions = {
    controls: true,
    width: 320,
    height: 240,
    fluid: false,
    plugins: {
        record: {
            audio: false,
            video: true,
            maxLength: 300,
            debug: true,
        },
    },
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App {...videoJsOptions} />, rootElement);
