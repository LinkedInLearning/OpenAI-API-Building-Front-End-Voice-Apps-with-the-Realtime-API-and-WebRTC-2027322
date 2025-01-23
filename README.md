# OpenAI API: Building Front-End Voice Apps with the Realtime API and WebRTC
This is the repository for the LinkedIn Learning course OpenAI API: Building Front-End Voice Apps with the Realtime API and WebRTC. The full course is available from [LinkedIn Learning][lil-course-url].

## Instructions
These exercise files are best used in GitHub Codespaces. The project contains five folders with example implementations of OpenAI's Realtime API in vanilla JavaScript:

- `./01-basic-JS/`: A bare-bones reference implementation
- `./02-audio-visualizer/`: A built-out implementation utilizing the Web Audio API for voice visualization
- `./03-voice-and-text/`: Adds text chat input and output to the app
- `./04-transcriptions/`: Adds the voice input and output to the text chat as transcripts
- `./05-function-calling/`: Adds function calling

## Using the Auth Server
The project also contains a basic Node.js-based auth server to supply the front-end app with an ephemeral token for authentication. It is found in the `./auth-server/` folder. If you're running the exercise files in GitHub Codespaces, the dependencies for the auth server are automatically installed. If you're running the exercise files on your local computer, follow the steps below to install them.


## Installing

1. Open the repo in GitHub Codespaces or clone it to your computer.
    - If you're on a local install, open terminal and run `cd auth-server && npm install` to install dependencies.
2. Visit the [platform.openai.com](https://platform.openai.com/api-keys) to create an API key for the project.
3. Make a copy of `/auth-server/.env-template` to create a new `.env` file in the `/auth-server/` directory with the following:
```json
OPENAI_API_KEY=your-api-key
```
4. Run the server from terminal by navigating to the `/auth-server/` directory and running 
```bash
node server.js
```
5. For Codespaces: 
  - Go to Ports, identify the live URL for the auth server, and it to `server-config.js`.
  - In `/01-basic-js/`, set `SERVER_URL` in `app.js` to the same auth server URL.
6. Open `index.html` in your browser to access the all the demos.
7. To stop the auth server, run `Ctrl+C` in the terminal.


[0]: # (Replace these placeholder URLs with actual course URLs)

[lil-course-url]: https://www.linkedin.com/learning/
[lil-thumbnail-url]: http://

