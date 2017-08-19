import express from 'express';
import path from 'path';
const cors = require('cors');
const app = express();

import * as database from './database';
import * as urls from './urls';
import * as config from './config';

app.use(express.static( __dirname + "/static"));
app.use(cors());

/*
Standard error codes:
 1xx: Informational - Request received, continuing process
 2xx: Success - The action was successfully received, understood, and accepted
 3xx: Redirection - Further action must be taken in order to complete the request
 4xx: Client Error - The request contains bad syntax or cannot be fulfilled
 5xx: Server Error - The server failed to fulfil an apparently valid request

 Mine:
 Not enough params - 401
 Param is incorrect - 402
 Basic user error - 400
 Insufficient Permissions - 450
 Basic server error - 500
*/

const createRes = (boolSuccess, data, error, errorCode) => {
  if(typeof boolSuccess === 'undefined') boolSuccess = false;
  if(typeof data === 'undefined') data = {};
  if(typeof errorCode === 'undefined') errorCode = 500;
  if(typeof error === 'undefined'){
    error = '';
    errorCode = 200;
  }
  return {
    success: boolSuccess,
    res: data,
    err: {error: error, code: errorCode},
  }
};

app.get("/", (req, res) => {
  res.sendFile(path.join( __dirname, "static", 'home.html'));
});

app.get("/test", (req, res) => {
  res.send(createRes(true, {data: 'Yep, that worked'}))
});

app.get(urls.addRoom, async function(req, res){
  const params = req.params;
  const numOnlyReg = /^\d+$/;
  if(Object.keys(params).length < 4){
    res.send(createRes(false, {}, "Not enough parameters", 401))
  }else if(!numOnlyReg.test(params.totalPasses) || params.totalPasses < 1){
    res.send(createRes(false, {}, "Invalid total room number", 402))
  } else{
    let result = await database.addRoom(params.creatorId, params.roomId, params.totalPasses, params.roomName);
    res.send(result);
  }
});

app.get(urls.getUser, async function(req, res){
  const params = req.params;
  let result = await database.getUser(params.userId);
  res.send(result);
});

app.get(urls.getRoom, async function(req, res){
  const params = req.params;
  let result = await database.getRoom(params.roomId);
  res.send(result);
});

app.get(urls.searchName, async function(req, res){
  const params = req.params;
  let result = await database.searchForName(params.name);
  res.send(result);
});

app.get(urls.searchNameList, async function(req, res){
  const params = req.params;
  let result = await database.getUsersStartWith(params.name);
  res.send(result);
});

app.get(urls.addUser, async function(req, res){
  const params = req.params;
  let result = await database.addUser(params.userId, params.userName, params.userRank, params.email);
  res.send(result);
});

app.get(urls.assignRank, async function(req, res){
  const params = req.params;
  let result = await database.assignRank(params.userId, params.rank);
  res.send(result);
});

app.get(urls.usePass, async function(req, res){
  const params = req.params;
  let result = await database.usePass(params.userId, params.roomId);
  res.send(result);
});

app.get(urls.testUpdate, async function(req, res){
  const params = req.params;
  let result = await database.updateNumOut(params.roomId);
  res.send("Done");
});

app.get(urls.passInfo, async function(req, res){
  const params = req.params;
  let result = await database.getPassInfo(params.userId);
  res.send(result);
});

app.get(urls.passInfoName, async function(req, res){
  const params = req.params;
  let result = await database.getPassInfoName(params.userName);
  res.send(result);
});

app.get(urls.getActivityToday, async function(req, res){
  const params = req.params;
  let result = await database.getTodayActivity(params.userId);
  res.send(result);
});

app.get(urls.getPassActivityToday, async function(req, res){
  const params = req.params;
  let result = await database.getTodayPassActivity(params.roomId, params.doNames);
  res.send(result);
});

app.get(urls.getActivityForDate, async function(req, res){
  const params = req.params;
  let result = await database.getActivityForDate(params.userId, params.day, params.month, params.year);
  res.send(result);
});

app.get(urls.getPassActivityForDate, async function(req, res){
  const params = req.params;
  let result = await database.getPassActivityForDate(params.roomId, params.day, params.month, params.year, params.doNames);
  res.send(result);
});

import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';

import { google, validDomain } from './config';

// Transform Google profile into user object
const transformGoogleProfile = (profile) => ({
  id: profile.id,
  domain: profile.domain,
  email: profile.emails[0].value,
  name: profile.displayName,
  avatar: profile.image.url,
});

// Register Google Passport strategy
passport.use(new GoogleStrategy(google,
  async (accessToken, refreshToken, profile, done)
    => done(null, transformGoogleProfile(profile._json))
));

// Serialize user into the sessions
passport.serializeUser((user, done) => done(null, user));

// Deserialize user from the sessions
passport.deserializeUser((user, done) => done(null, user));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up Google auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['email profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google' }),
  (req, res) => {
    req.user.domain === validDomain ? req.user.valid = true : req.user.valid = false;
    res.redirect('OAuthLogin://login?user=' + JSON.stringify(req.user));
  });

app.listen(config.PORT, () => {
  console.log(`Running on port ${config.PORT}`);
});