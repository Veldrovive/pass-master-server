import fs from 'fs'

export const PORT = 3001;

export const DEFAULT_TIME = 1;

//Stored In Milliseconds
export const MAX_TIMEOUT = 5*60*1000;
export const TIMEOUT_CHECK_INTERVAL = 1000*60;

export const DATABASE_OPTIONS = {
  host     : 'localhost',
  user     : 'signSystem2',
  password : PASSWORD,
  database : 'signSystem2'
};

/*export const SSL_OPTIONS = {
  key: fs.readFileSync( 'server/ssl/key.pem' ),
  cert: fs.readFileSync( 'server/ssl/cert.pem' ),
};*/

export const google = {
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  callbackURL: 'http://localhost:'+PORT+'/auth/google/callback',
};

export const validDomain = VALID_DOMAIN;

export const databaseCommands = {
  createSchema: "CREATE SCHEMA signSystem3 DEFAULT CHARACTER SET utf8",
  createUserTable: "CREATE TABLE users (userName VARCHAR(45) NOT NULL, googleId VARCHAR(45) NOT NULL, userState VARCHAR(45) NOT NULL DEFAULT 'false', userRank INT NOT NULL DEFAULT 0, email varchar(45) NOT NULL, PRIMARY KEY (`googleId`))",
  createTimeTable: "CREATE TABLE userTimes (timeUserId VARCHAR(45) NOT NULL, roomId VARCHAR(10) NOT NULL, timeOut INT NOT NULL, timeIn INT NOT NULL, block VARCHAR(45) NOT NULL, PRIMARY KEY (`timeOut`))",
  createRoomsTable: "CREATE TABLE rooms (roomId VARCHAR(10) NOT NULL, passTotal INT NOT NULL DEFAULT 1, currentUsers INT NOT NULL DEFAULT 0, creatorId VARCHAR(45) NOT NULL, PRIMARY KEY (`roomId`))",
};

