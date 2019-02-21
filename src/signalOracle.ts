import {ZapProvider} from "@zapjs/provider";
import {Config} from "./priv_config"
const Web3 = require("web3")
const HDWalletProviderMem = require("truffle-hdwallet-provider");
import {disconnectUser} from "./server"
const web3 = new Web3(new HDWalletProviderMem(Config.MNEMONIC, Config.NODE_URL));
const userWeb3 = new Web3(new HDWalletProviderMem(Config.MNEMONIC, Config.NODE_URL,2));
let Oracle:any,accounts:any,owner:any
/**
    Setup provider through zap-term
*/

export async function setupProvider(){
    console.log("Setting up provider")
    accounts = await web3.eth.getAccounts()
    owner = accounts[0]
    Oracle = new ZapProvider(owner,{
        networkId:(await web3.eth.net.getId()).toString(),
        networkProvider:web3.currentProvider
    })
    Oracle.listenSubscribes({
        endpoint:Config.ENDPOINT
    },gotNewSubscribers)
    Oracle.listenUnsubscribes({
        endpoint:Config.ENDPOINT
    },disconnectUser)
    console.log(accounts)
}

function gotNewSubscribers(err:any,data:any){
    console.log("Got new Subscriber : ", err,data)
}

function endSubscriptions(err:any,data:any){
    console.log("Ending subscriptions",err,data)
}

async function getAddress(signature:string){
    const signer = await web3.eth.personal.ecRecover(Config.ENDPOINT, signature);
}
/**
- Get address of this signature
- Verify if address has subscriptions
- return true if subscription is available
*/



export async function verifyUser(endpoint:string,signature:string){
  return {verified:true}
    try{
        console.log("Singature : ", signature)
        let address = await web3.eth.personal.ecRecover(endpoint, signature);
        console.log("address", address,"owner :",owner, "endpoint", endpoint)
        let subcriptions = await Oracle.zapArbiter.getSubscription({provider:owner,subscriber:address, endpoint})
        console.log("SUBSCRIPTIONS : ",subcriptions['blockStart'], subcriptions['preBlockEnd'])
        const blockNumber = await web3.eth.getBlockNumber()
        if(subcriptions['preBlockEnd']<blockNumber){
            return {verified:false}
            disconnectUser(signature)
        }
        else{
            return {verified:true}
        }
    }catch(e){
        console.error(e)
        return {verified:false}}
}


async function main(){
    await setupProvider()
    const endpoints = await Oracle.getEndpoints()
    const userAddress = await userWeb3.eth.getAccounts()
    const user = userAddress[0]
    const signature = await userWeb3.eth.sign(Config.ENDPOINT,user)
    console.log("SIGNATURE", user,signature)
    await verifyUser(endpoints[0],signature)
}
