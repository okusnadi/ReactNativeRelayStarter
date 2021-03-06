# React Native / Relay TodoMVC
![PoC](https://cloud.githubusercontent.com/assets/21496977/23832868/69f873e4-0778-11e7-9cf2-f046c0579a10.gif)

## Installation (Make sure MongoDB is installed: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)

```
npm install -g react-native-cli && npm install
```

## Running

### Start the GraphQL server:

```
mongod  # run MongoDB local
npm start   # run GraphQL server local
```

### Run on simulator:

```
ios: react-native run-ios
android: adb reverse tcp:8080 tcp:8080  # forward requests from the device to your computer
         react-native run-android
```

### Debug:

```
1.open http://localhost:8080 to test MongoDB and GraphQL server
2.Select "Debug JS Remotely" from the Developer Menu and Open http://localhost:8081/debugger-ui with Chrome.
3.Set "__dev__=true" in Chrome console to debug relay.
```

## Developing

If at any time you make changes to `data/schema.js`, stop the server,
regenerate `data/schema.json`, and restart the server:

```
npm run update-schema
npm start
```

## License

    This file provided by Facebook is for non-commercial testing and evaluation
    purposes only.  Facebook reserves all rights not expressly granted.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
    FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
