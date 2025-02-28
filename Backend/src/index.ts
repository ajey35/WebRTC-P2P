import {WebSocketServer,WebSocket} from 'ws'

const wss = new WebSocketServer({port:8080})


let senderSocket:null|WebSocket = null 
let recieverSocket:null|WebSocket = null

console.log("Hi there!")

wss.on("connection", function connection(ws){

    ws.on("error",console.error)

    ws.on("message",function message(data:any){
        const message = JSON.parse(data);
        if (message.type==="sender"){
            console.log("Sender Set");
            senderSocket = ws;
        }
        else if(message.type==="receiver"){
            console.log("Receiver Set")
            recieverSocket = ws
        }
        else if(message.type==="createOffer"){
            if(ws!=senderSocket){
                return
            }
            console.log("Offer Created!")
            recieverSocket?.send(JSON.stringify({
                type:"createOffer",
                sdp:message.sdp
            }))
        }
        else if(message.type==="createAnswer"){
            console.log("Answer Created!")
            senderSocket?.send(JSON.stringify({
                type:"createAnswer",
                sdp:message.sdp
            }))
        }
        else if(message.type==="iceCandidate"){
            if(ws===senderSocket){
                recieverSocket?.send(JSON.stringify({type:"iceCandidate",candidate:message.candidate}))
            }
            else{
                senderSocket?.send(JSON.stringify({type:"iceCandidate",candidate:message.candidate}))
            }
        }
    })
})