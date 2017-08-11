import mysql from 'mysql';
import * as options from './config';

const connection = mysql.createConnection(options.DATABASE_OPTIONS);

/*
 Standard error codes:
 1xx: Informational - Request received, continuing process
 2xx: Success - The action was successfully received, understood, and accepted
 3xx: Redirection - Further action must be taken in order to complete the request
 4xx: Client Error - The request contains bad syntax or cannot be fulfilled
 5xx: Server Error - The server failed to fulfil an apparently valid request
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

connection.connect((err) => {
  if(err) throw err;
  console.log("Connection established to database");
});

export function addRoom(creatorId, roomId, totalPasses){
  return new Promise(resolve => {
    connection.query('SELECT * FROM rooms WHERE roomId = ?', [roomId], (err, res) => {
      if(err){
        resolve(createRes(false, {}, "Error on testing for room existence", 500));
      }else if(res.length > 0){
        resolve(createRes(false, {}, "Room already registered", 400));
      }else{
        connection.query('INSERT INTO rooms (roomId, passTotal, currentUsers, creatorId) VALUES (?, ?, 0, ?)', [roomId, totalPasses, creatorId], (err, res) => {
          if(err){
            resolve(createRes(false, {}, "Error on inserting room", 500));
            console.log(err);
          }else{
            resolve(createRes(true, {msg: "Room created", passTotal: totalPasses, creatorId: creatorId}))
          }
        })
      }
    })
  })
}