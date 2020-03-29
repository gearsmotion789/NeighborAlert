import React, { Component } from "react";
import ReactPlayer from "react-player";
import firebase from "firebase";
import "./App.css";
import axios from 'axios';
const firebaseConfig = require('./firebaseConfig.js').firebaseConfig;

const serverIp = '192.168.0.52';
const serverPort = '4000'; // this is not same port as react app - this is server port

class App extends Component {
    constructor(props) {
        super(props);
        this.state = { videos: [], checked: true };
    }
    componentDidMount() {        
        firebase.initializeApp(firebaseConfig);

        this.getAlarmEnabled();
        this.getVideos();

        setInterval(() => {
        	console.log("Reloading videos");
        	this.getVideos();
		}, 5000);
    }

    getAlarmEnabled = () => {
        console.log("Checking Alaram Enabled");

        axios.get(`http://${serverIp}:${serverPort}/enabled`)
            .then((res) => {
              console.log("RESPONSE RECEIVED: ", res.data);
              this.setState({checked: res.data.enabled})
            })
            .catch((err) => {
              console.log("AXIOS ERROR: ", err);
            });
    };

    getVideos = () => {
        var states = this;

        var storageRef = firebase.storage().ref("videos/");
        storageRef
            .listAll()
            .then(async function (response) {
                let vids = await new Promise(async (resolve) => {
                    let videos = [];

                    let result = response.items;

                    // get latest 10 videos
                    for(let i=0; i<10; i++){
                    	if(result[i]){
	                        await new Promise((resolve) => {
	                            result[i].getDownloadURL().then(
	                                function (url) {
	                                	let name = result[i].name;

	                                	let fileRef = storageRef.child(result[i].name);
										fileRef.getMetadata().then(function(metadata) {
											videos.push({
		                                        url: url,
		                                        name: name.replace(".webm", ""),
		                                        date: metadata.timeCreated.toString()
		                                    })
		                                    resolve();
										}).catch(function(error) {
											console.log(error);
										});

	                                    
	                                },
	                                function (error) {
	                                    console.log(error);
	                                }
	                            )
	                        });
	                    }
                    }
                    
                    videos.sort((a, b) => (a.date > b.date) ? 1 : (a.date === b.date) ? ((a.date > b.date) ? 1 : -1) : -1 );
                    videos.reverse();
                    console.log(videos);
                    resolve(videos);
                });

                states.setState({ videos: vids });
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    handleChange = () => {
        var newState = !this.state.checked;
        this.setState({checked: newState});
        console.log("Alarm Enabled set to : " + newState);

        var postData = {
            enabled: newState,
        };

        var axiosConfig = {
            headers: {
                "Content-Type": "application/json",
            },
        };

        axios.post(
                `http://${serverIp}:${serverPort}/enabled`,
                postData,
                axiosConfig
            )
            .then((res) => {
                console.log("RESPONSE RECEIVED: ", res);
            })
            .catch((err) => {
                console.log("AXIOS ERROR: ", err);
            });
    };

    videos = () => {
        //console.log(this.state.videos)
        return this.state.videos.map((video, i) => (
            <div key={i}>
	            <h2>Posted by Alex Feng</h2>
			    <h5>{video.name}</h5>
			    <ReactPlayer url={video.url} controls width='60%' height='60%' />
			    <p>Suspicious Activity...</p>                
            </div>
        ));
    };

    render() {
        return (
            <div class="parallax">
                <div class="header">    
                	<div class="text">Neighborhood Watch</div>            
				  	<h1>.</h1>
				  	<p>View footage of nearby suspicious activity provided for the <b>community</b> by the <b>community</b></p>
				</div>

				<div class="topnav">
				  <a class="active" href="#home">Home</a>
				  <a href="#about">About</a>
				  <a href="#contact">Contact</a>
				  <a href="#members">Members</a>
				  <a href="#location">Location</a>
				  <div class="search-container">
				    <form action="/action_page.php">
				      <input type="text" placeholder="Search.." name="search"/>
				    </form>
				  </div>
				</div>

				<div class="row">
				  <div class="side" align="left">
                    <a href="http://192.168.0.54:8000">Go to Live Video</a><br/>
				    
				    <h5>Alarm System Enabled:</h5>
                    <input class="toggle"
                    	type="checkbox"
                    	checked={this.state.checked}
                        onChange={this.handleChange.bind(this)}
    				/><br/><br/><br/><br/>

				    
				    <h2>About Me</h2>
				    <h5>Alex Feng:</h5>
				    <img src="https://cdn.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png" height="200" width="200"/>
				    <p>This is my first year at OSU.</p>
				    <h3>Other interests</h3>
				    <p>I like to work with the raspberry pi.</p>
				    <img src="https://www.raspberrypi.org/homepage-9df4b/static/hero-shot-33d83b8c5fa0933373dabcc9462b32a3.png" height="200" width="300"/>
				  </div>

				  <div class="main">
				  	<div class="title">
				  		<h1><u><b>All Posted Videos from Newest</b></u></h1>
				  	</div>
				  	<div align="left">
	                    <ul>{this.videos()}</ul>
	                </div>				    
				  </div>

				</div>

				<div class="footer">
				  <h5>Copyright 2020</h5>
				</div>
            </div>
        );
    }
}

export default App;
