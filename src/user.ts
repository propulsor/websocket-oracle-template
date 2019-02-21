const io= require("socket.io-client");
const socket = io("http://localhost:8001",{autoConnect:false})
socket.on("connect",()=>{
    console.log("connected,start authorization")
    //TODO replace with valid data
    socket.emit("authentication",{signature:"testSignature",address:"testAddress",endpoint:"testEndpoint"})
})
socket.on("disconnect",()=>{
    console.log("Disconnected")
})
socket.on("unauthorized",(reason:string)=>{
    console.log("unauthorized, reason : ", reason)
})
socket.on("authenticated",()=>{
    console.log("Authenticated")
})
socket.on("signaldata",(msg:any)=>{
    console.log("receiving signal data",msg)
})
socket.open()
