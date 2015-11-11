# knowsnowapi

REST API back end for the knowsnow application.

Assumes Node and NPM are installed on your system.
To install the project's dependencies and development dependencies change to the project's root directory and run
````shell
npm install
````
To enable login with the Facebook Passport provider for Loopback, go to the Facebook developers [console](https://developers.facebook.com/apps) and configure a new application.  Use the App ID and App Secret when setting the environment variables below.

Before running locally the application requires several environment variables to be set for database connections and authentication redirects to the client knowsnow application.  These can be set using
````shell
$ export MONGOLAB_URL=yourMongoDBUrl
````
````shell
$ export SUCCESS_REDIRECT=yourClientapplicationUrl + /create/
````
````shell
$ export CLIENT_ID=yourClientID
````
````shell
$ export CLIENT_SECRET=yourClientSecret
````
Or create a local .env file with the same NAME VALUE pairs as described [here](https://github.com/motdotla/dotenv).
Be sure to include .env in your .gitignore to avoid publishing keys to Github.

To run the application locally in debug mode use
````shell
$ nodemon --debug index.js
````
This will automatically restart the application anytime changes are made to the code.
If you want to debug interactively you can install [node-inspector](https://github.com/node-inspector/node-inspector) globally by running
````shell
$ npm install -g node-inspector
````
You can run node inspector by opening another terminal while nodemon is already running and run
````shell
$ node-inspector
````

To deploy to Heroku you'll need the Heroku CLI, with Homebrew
````shell
$ brew install heroku-toolbelt
````
And login to your Heroku account with
````shell
$ heroku login
````
Running on Heroku requires the same environment variables as above, they can be set with
````shell
$ heroku config:set VARIABLE_NAME=variableValue
````
Then finally to deploy to Heroku run
````shell
$ heroku create knowsnowapi --buildpack https://github.com/strongloop/strongloop-buildpacks.git
$ git push heroku master
````
The Strongloop buildpack is required to enable some Loopback functionality.
