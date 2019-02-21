const server = require("http").createServer();
 const io = require("socket.io")(server,{path:"/ws/socket.io/"});
 const socketioAuth = require("socketio-auth");
const Web3 = require("web3")
const Redis = require("redis")
const Bluebird = require("bluebird")
Bluebird.promisifyAll(Redis);
const Binance =require('binance-api-node').default
const binanceClient = Binance()
import {verifyUser,setupProvider} from "./signalOracle"
const math = require("mathjs")
const _  = require("lodash")

import {Config} from "./priv_config"
const redis = Redis.createClient(Config.REDIS_URL)
let CLIENTS:any={}
let USERS:any[] = []

const authenticate = async (socket:any, data:any, callback:Function) => {
  const {signature,address,endpoint} = data;
  try {
      if(USERS[socket.id]){
          return callback({message:"User already logged in"})
      }
      const canConnect = await redis.setnxAsync(`user:${address}`,socket.id)
      if(!canConnect){
          return callback({message:"User already logged in"})
      }
      const {verified} = await verifyUser(endpoint,signature)
      USERS[socket.id]=address
      CLIENTS[signature]=socket
      if(!verified){
          return callback({message:"Not a valid user"})
      }
      callback(null, "Authenticated");
  } catch (error) {
      console.log("error authenticate : ", error)
    return callback({message:"UNAUTHORIZED : "+socket.id});
  }
};

const postAuthenticate = (socket:any) => {
    console.log("AUTHENTICATED : ",socket.id)
};
const disconnect  = async (socket:any)=>{
    console.log("Socket disconnected",socket.id)
    if(USERS[socket.id]){
        const address = USERS[socket.id]
        console.log("clean up socket id")
        await redis.delAsync(`user:${address}`)
        delete USERS[socket.id]
    }
}
export const disconnectUser = async(signature:any)=>{
    console.log("Disconnect User")
    CLIENTS[signature].disconnect(true)
}

io.on("connection",(socket:any)=>{
    console.log("connected : ", socket.id)
})
//########################### COMPILE DATA AND PUBLISH ###############//
/**

*/
async function getData(){
  let count=1
  while(true){
    io.sockets.emit("signaldata",`Counter :`,count)
    count++
    await (()=>{return new Promise(resolve => setTimeout(resolve, 1000))})()
  }
}
//######################## START AUTH SERVER #####################3//
socketioAuth(io, { authenticate, postAuthenticate ,disconnect});
// Clean up redis before starting server
async function cleanup(){
    const keys = await redis.keysAsync("user:*")
    console.log(keys)
    for(let key of keys){
        await redis.delAsync(key)
    }
}
const port = 8001
cleanup()
.then(setupProvider)
.then(()=>{
    console.log("Cleaned up socket data in redis, starting server")
    server.listen(port);
    console.log("Server is listening on port :",port)
})
.then(getData)

.catch((err)=>{
    console.error("Error cleaning up redis, Failed to start server",err)
})
