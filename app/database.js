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
  onConnect();
});

function onConnect(){
  connection.query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'", (err, res) => {
    if(err){
      console.log("Error getting table names");
    }else{
      let tableArray = [];
      res.forEach((table) => {
        tableArray.push(table.TABLE_NAME);
      });
      if(tableArray.indexOf('rooms') === -1){
        console.log("Create Rooms");
        connection.query(options.databaseCommands.createRoomsTable, (err, res) => {
          if(err){
            console.log("Could not create table: ",err)
          }else{
            console.log("Created Table: rooms");
          }
        })
      }
      if(tableArray.indexOf('users') === -1){
        console.log("Create Users");
        connection.query(options.databaseCommands.createUserTable, (err, res) => {
          if(err){
            console.log("Could not create table: ",err)
          }else{
            console.log("Created Table: users");
          }
        })
      }
      if(tableArray.indexOf('userTimes') === -1){
        console.log("Create UserTimes");
        connection.query(options.databaseCommands.createTimeTable, (err, res) => {
          if(err){
            console.log("Could not create table: ",err)
          }else{
            console.log("Created Table: userTimes");
          }
        })
      }
    }
  })
}

export async function getNumOut(roomId){
  return new Promise(resolve => {
    connection.query('SELECT COUNT(CASE WHEN roomId=? AND timeIn=0 THEN 1 END) AS count FROM userTimes', [roomId], (err, res) => {
      if(err){
        resolve("failed");
      }else{
        resolve(res[0].count);
      }
    })
  })
}

export async function updateNumOut(roomId){
  let numOut = await getNumOut(roomId);
  return new Promise(resolve => {
    if(numOut !== "failed") {
      connection.query('UPDATE rooms SET currentUsers = ? WHERE roomId = ?', [numOut, roomId], (err, res) => {
        if (err) {
          resolve(false);
        } else {
          resolve(numOut);
        }
      })
    }else{
      resolve(false);
    }
  })
}

export async function getUser(userId){
  return new Promise(resolve => {
    connection.query('SELECT * FROM users WHERE googleId = ?', [userId], (error, results) => {
      if (error) {
        resolve (createRes(false, {}, "Error on getting user", 500))
      } else {
        if (results.length > 1) {
          resolve(createRes(true, {state: results[0].userState, name: results[0].userName, rank: results[0].userRank, id: userId}, "Warning: More than one user has this ID", 500));
        }else if(results.length == 0){
          resolve(createRes(false, {}, "No user has this ID", 400));
        }else {
          resolve(createRes(true, {state: results[0].userState, name: results[0].userName, rank: results[0].userRank, id: userId}));
        }
      }
    })
  })
}

export async function getRoom(roomId){
  return new Promise(resolve => {
    connection.query('SELECT * FROM rooms WHERE roomId = ?', [roomId], (error, results) => {
      if (error) {
        resolve (createRes(false, {}, "Error on getting room", 500))
      } else {
        if (results.length > 1) {
          resolve(createRes(true, {id: results[0].roomId, passTotal: results[0].passTotal, currentUsers: results[0].currentUsers, creatorId:results[0].creatorId}, "Warning: More than one room has this ID", 500));
        }else if(results.length == 0){
          resolve(createRes(false, {}, "No room has this ID", 400));
        }else {
          resolve(createRes(true, {id: results[0].roomId, passTotal: results[0].passTotal, currentUsers: results[0].currentUsers, creatorId:results[0].creatorId}));
        }
      }
    })
  })
}

export async function searchForName(name){
  return new Promise(resolve => {
    connection.query('SELECT * FROM users WHERE userName LIKE ?', ['%'+name+'%'], (err, res) => {
      if(err){
        resolve(createRes(false, {}, "Error on getting list", 500));
      }else{
        resolve(createRes(true, res))
      }
    })
  })
}

export async function addUser(id, name, rank, email){
  return new Promise(resolve => {
    connection.query('SELECT * FROM users WHERE googleId = ?', [id], (err, res) => {
      if(err){
        resolve(createRes(false, {}, "Server error while getting users", 500));
      }else{
        if(res.length > 0){
          resolve(createRes(false, {userName: res[0].userName, id: res[0].googleId}, "User already exists", 400));
        }else{
          connection.query('INSERT INTO users (userName, googleId, userState, userRank, email) VALUES (?, ?, "false", ?, ?)', [name, id, rank, email], (err, res) => {
            if(err){
              resolve(createRes(false, {}, "Server error while inserting user", 500));
            }else{
              resolve(createRes(true, {userName: name, googleId: id, userState: false, userRank:rank}))
            }
          })
        }
      }
    })
  })
}

export async function addRoom(creatorId, roomId, totalPasses){
  return new Promise(resolve => {
    connection.query('SELECT * FROM users WHERE googleId = ?', [creatorId], (err, res) => {
      if(err){
        resolve(createRes(false, {}, "Error on getting user", 500))
      }else if(res.length < 1){
        resolve(createRes(false, {}, "Creator does not exist", 400))
      }else if(res[0].userRank < 1){
        resolve(createRes(false, {}, "User does not have the permission to register a room", 450))
      }else{
        connection.query('SELECT * FROM rooms WHERE roomId = ?', [roomId], (err, res) => {
          if(err){
            resolve(createRes(false, {}, "Error on testing for room existence", 500));
          }else if(res.length > 0){
            resolve(createRes(false, {}, "Room already registered", 400));
          }else{
            connection.query('INSERT INTO rooms (roomId, passTotal, currentUsers, creatorId) VALUES (?, ?, 0, ?)', [roomId, totalPasses, creatorId], (err, res) => {
              if(err){
                resolve(createRes(false, {}, "Error on inserting room", 500));
              }else{
                resolve(createRes(true, {msg: "Room created", passTotal: totalPasses, creatorId: creatorId}))
              }
            })
          }
        })
      }
    })
  })
}

export async function usePass(userId, roomId){
  return new Promise(async function(resolve){
    async function trySignIn(userId, roomId, totalUsers){
      const now = new Date();
      const seconds = Math.floor(now.getTime())/1000;

      return new Promise(resolve => {
        //need to change this so user can only sign in to one they are signed out of
        connection.query('SELECT * FROM userTimes WHERE timeUserId=? AND roomId=? AND timeIn=0', [userId, roomId], (err, res) => {
          if(err){
            resolve(createRes(false, {}, "Could not verify that user was signed out of the correct room", 500));
          }else if(res.length > 0){
            res.forEach(() => {
              connection.query('UPDATE userTimes SET timeIn = ? WHERE roomId = ? AND timeUserId = ? AND timeIn = 0', [seconds, roomId, userId], (err, res) => {
                if(err){
                  resolve(createRes(false, {}, "Failed to update userTimes", 500))
                }else{
                  connection.query('UPDATE users SET userState = "false" WHERE googleId = ?', [userId], (err, res) => {
                    if(err){
                      resolve(createRes(false, {}, "Failed to update userState", 500))
                    }else{
                      updateNumOut(roomId)
                        .then((updatedUsers) => {
                          resolve(createRes(true, {
                            msg: "User signed in",
                            newState: false,
                            time: seconds,
                            user: userId,
                            room: roomId,
                            remainingPasses: totalUsers-updatedUsers,
                          }))
                        })
                    }
                  })
                }
              })
            })
          }else{
            resolve(createRes(false, {}, "User was not signed out of this room", 400));
          }
        });

      })
    }

    async function trySignOut(userId, roomId, userRank, remainingPasses, totalUsers){
      const now = new Date();
      const seconds = Math.floor(now.getTime())/1000;

      return new Promise(resolve => {
        if (remainingPasses < 1 && userRank < 1) {
          resolve(createRes(false, {}, "Too many people out", 400));
        } else {
          connection.query('INSERT INTO userTimes (timeUserId, roomId, timeOut, timeIn, block) VALUES (?, ?, ?, 0, "Z")', [userId, roomId, seconds], (err, res) => {
            if (err) {
              resolve(createRes(false, {}, "Could not insert timeOut", 500));
            } else {
              connection.query('UPDATE users SET userState = "true" WHERE googleId = ?', [userId], (err, res) => {
                if (err) {
                  resolve(createRes(false, {}, "Could not update state of user", 500));
                } else {
                  updateNumOut(roomId)
                    .then((updatedUsers) => {
                      resolve(createRes(true, {
                        msg: "User signed out",
                        newState: true,
                        time: seconds,
                        user: userId,
                        room: roomId,
                        remainingPasses: totalUsers-updatedUsers,
                      }))
                    })
                }
              })
            }
          })
        }
      })
    }

    let userInfo = await getUser(userId);
    let roomInfo = await getRoom(roomId);
    if(userInfo.success){
      const userRank = userInfo.res.rank;
      const userName = userInfo.res.name;
      const userState = userInfo.res.state;
      if(roomInfo.success){
        const passTotal = roomInfo.res.passTotal;
        const currentUsers = roomInfo.res.currentUsers;
        const remainingPasses = passTotal-currentUsers;
        if(userState === 'false'){
          let response = await trySignOut(userId, roomId, userRank, remainingPasses, passTotal);
          resolve(response);
        }else{
          let response = await trySignIn(userId, roomId, passTotal);
          resolve(response);
        }
      }else{
        resolve(createRes(false, {}, "Could not fetch room", 500));
      }
    }else{
      resolve(createRes(false, {}, "Could not fetch user", 500));
    }
  })
}

export async function getPassInfo(userId){
  return new Promise(resolve => {
    connection.query('SELECT * FROM userTimes WHERE timeUserId=? AND timeIn=0', [userId], async function(err, res){
      if(err){
        resolve(createRes(false, {}, "Could not fetch pass", 500));
      }else{
        if(res.length > 0){
          let room = await getRoom(res[0].roomId);
          let teacher = await getUser(room.res.creatorId);
          let user = await getUser(userId);

          const now = new Date();
          const seconds = Math.floor(now.getTime()/1000);
          const totalTime = seconds-res[0].timeOut;

          resolve(createRes(true, {pass: true, name: user.res.name, totalTime: totalTime, timeOut: res[0].timeOut, room: res[0].roomId, teacher: teacher.res.name, remainingRoomPasses: room.res.passTotal-room.res.currentUsers}))
        }else{
          resolve(createRes(false, {pass: false, id: userId}, "User does not have a pass", 400))
        }
      }
    });

  })
}

export async function getPassInfoName(userName){
  return new Promise(async function(resolve){
    let users = await searchForName(userName);
    let passList = [];
    let processesPasses = 0;
    users.res.forEach(async function(user){
      const id = user.googleId;
      let passInfo = await getPassInfo(id);
      const pass = passInfo.res;
      passList.push(pass);
      processesPasses++;
      if(processesPasses === users.res.length){
        resolve(createRes(true, {passes: passList, name: user.userName}));
      }
    });
  });
}