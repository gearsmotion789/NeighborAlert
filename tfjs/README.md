# tfjs

## TODO
- in ```predictions.forEach```, add logic code to find greatest x,y,width,height, then POST to serverToRos

### Run
1. roscore
2. node serverToRos.js
3. rostopic echo /chatter
4. npm start

### Setup - Install dependencies from package.json
- GIT must be preinstalled before running next line
  - https://git-scm.com/download/win
```node.js
npm install
```

### Webcam of Desktop application streaming

- stream data from webcam
  - https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

```node.js
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user"
          }
        })
```

- stream data from desktop application instead of webcam
  - https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture

```node.js
      const webCamPromise = navigator.mediaDevices
        .getDisplayMedia({
          audio: false,
          video: {
            cursor: "never",
            displaySurface: "application"
          }
        })
```
### Install git on Windows (do this before doing npm install)
https://git-scm.com/downloads

### Install latest node.js on Ubuntu
https://websiteforstudents.com/install-the-latest-node-js-and-nmp-packages-on-ubuntu-16-04-18-04-lts/

##### Code from
https://hackernoon.com/tensorflow-js-real-time-object-detection-in-10-lines-of-code-baf15dfb95b2

---------------------------------------------------

# Use tensorflow.js with ROS
http://wiki.ros.org/rosnodejs

npm install rosnodejs

- https://github.com/RethinkRobotics-opensource/rosnodejs_examples
  - roscore
  - rosrun talker.js
  - rosrun listener.js
