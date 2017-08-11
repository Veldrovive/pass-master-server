import express from 'express';
import path from 'path';
const app = express();

import * as database from './database';
import * as urls from './urls';

app.use(express.static( __dirname + "/static"));

const PORT = 3001;

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
 Room already registered - 400
 Error on inserting room - 500
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

app.get(urls.addRoom, (req, res) => {
  const params = req.params;
  const numOnlyReg = /^\d+$/;
  if(Object.keys(params).length < 3){
    res.send(createRes(false, {}, "Not enough parameters", 401))
  }else if(!numOnlyReg.test(params.totalPasses)){
    res.send(createRes(false, {}, "Total rooms is not a number", 402))
  } else{
    database.addRoom(params.creatorId, params.roomId, params.totalPasses)
      .then((result) => {
        res.send(result);
      })
  }
});

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});