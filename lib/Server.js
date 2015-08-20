'use babel';

import socketIO from 'socket.io'
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Session from './Session';
import StatusMessage from './StatusMessage';

class Server {
  constructor() {
    this.online = false;
    this.connectedSession = null;
    this.server = null;
  }

  startServer(quiet=false) {
    console.info('[black-bird]', 'startServer');

    if (this.online) {
      this.stopServer();
      console.log('[black-bird]', 'Restarting server');

    } else if (!quiet){
      console.log('[black-bird]', 'Starting server');
    }

    var port = atom.config.get('black-bird.port');

    this.server = http.createServer();
    var io = socketIO(this.server);

    this.server.listen(port, 'localhost', () => {
      console.log('[black-bird]', 'Server started');
      StatusMessage.display('Server started');
    });

    this.online = true;

    io.on('connection', (socket) => {this.connectionHandler(socket)});
  }

  stopServer() {
    console.info('[black-bird]', 'stopServer');

    if (this.online) {
      this.server.close();
      this.online = false;
      StatusMessage.display('Server stopped');
    }
  }

  connectionHandler(socket) {
    console.info('[black-bird]', 'New connection');

    var session = new Session(socket);

    session.on("connected", () => {
      console.info('[black-bird]', 'Set connected session');
      StatusMessage.display('Connected');
      this.connectedSession = session;
    }.bind(this));

    session.on("disconnected", () => {
      console.info('[black-bird]', 'Remove connected session');
      StatusMessage.display('Disconnected');
      this.connectedSession = null;
    }.bind(this));

    session.on('saving', (fileName) => {
      StatusMessage.display('Saving ' + fileName);
    }.bind(this));

    session.on('saved', () => {
      StatusMessage.display('File saved');
    }.bind(this));

    session.on('closing', (fileName) => {
      StatusMessage.display('Closing ' + fileName);
    }.bind(this));

    session.on('listing', () => {
      StatusMessage.display('Listing');
    }.bind(this));

    session.on('opening', (fileName) => {
      StatusMessage.display('Opening ' + fileName);
    }.bind(this));
  }

  openFile() {
    console.info('[black-bird]', 'Open file');
    // Get the selected text
    var editor = atom.workspace.getActiveTextEditor()
    var text = editor.getSelectedText()

    if (!text) {
      // Get the text from the line in the cursor position
      text = editor.lineTextForBufferRow(editor.getCursorBufferPosition()['row'])
    }

    // TODO: parse the text so we extract a path from it
    this.connectedSession.openFile(text);
  }

  listFiles() {
    console.info('[black-bird]', 'List files');
    var remotePath = atom.config.get('black-bird.remote_project_path');
    this.connectedSession.listFiles(remotePath);
  }
}

export default new Server