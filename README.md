# NeighborAlert

Firebase setup:
1. Go to https://console.firebase.google.com and create a new project
2. Add a new app from the home page of your Firebase project, and choose "Web". Give it a name.
3. Copy the config which should like this:
```node.js
const firebaseConfig = {
  apiKey: "*******************",
  authDomain: "*******************",
  databaseURL: "*******************",
  projectId: "*******************",
  storageBucket: "*******************",
  messagingSenderId: "*******************",
  appId: "*******************",
  measurementId: "*******************"
};
```
4. Create a new file called "firebaseConfig.js" and write the following inside the file:
```node.js
exports.firebaseConfig = {
  apiKey: "*******************",
  authDomain: "*******************",
  databaseURL: "*******************",
  projectId: "*******************",
  storageBucket: "*******************",
  messagingSenderId: "*******************",
  appId: "*******************",
  measurementId: "*******************"
};
```
5. You will need to copy this file inside of "neighborhoodWatch/src" as well as "tfjs/src"

General setup:
1. Instal node.js from https://nodejs.org/en/download
2. Install git from https://git-scm.com/downloads
3. Inside of the root directory of each project, type ```npm install```

There are 3 parts to this project:
1. neighborhoodWatch is the web-app that users can go to view uploaded video
  - To run, type ```npm start``` from within the project directory
2. tfjs is the web-app that acts as an object tracking webcam which can trigger the alarm and upload videos to Firebase
  - To run, type ```npm start``` from within the project directory
3. server is the raspberry pi alarm system that controls the siren and relay as well as notifying the webcam whether the alarm is enabled/disabled
  - To run, type ```sudo node index.js``` from within the project directory
4. There is also an additional 4th part called stream-video-borwser which can provide remote live streaming (it is slightly modified from the existing project developed by pyimagesearch.com)
  - Install python 3 from https://www.python.org/downloads
  - Do a ```pip install``` for flask, imutils, opencv-python
  - Note: it may or may not work simulataneously with tfjs running too because depending on whether your pc allows multi-access to a webcam at the same time
  - To run, type ```python webstreaming.py``` from the project directory
  
References:
- https://firebase.google.com/docs/storage/web/file-metadata
- https://www.npmjs.com/package/videojs-record#get-recorded-data
- https://collab-project.github.io/videojs-record/Record.html
- https://www.pyimagesearch.com/2019/09/02/opencv-stream-video-to-web-browser-html-page/
