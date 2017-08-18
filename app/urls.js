export const addRoom = '/addRoom/:creatorId/:roomId/:roomName/:totalPasses';
export const getUser = '/getUser/:userId';
export const getRoom = '/getRoom/:roomId';
export const addUser = '/addUser/:userId/:userName/:userRank/:email';
export const assignRank = '/assignRank/:userId/:rank';
export const searchName = '/searchName/:name';
export const searchNameList = '/searchNameList/:name';
export const usePass = '/usePass/:userId/:roomId';
export const passInfo = '/passInfo/:userId';
export const passInfoName = '/passInfoName/:userName';

export const testUpdate = '/testUpdate/:roomId';