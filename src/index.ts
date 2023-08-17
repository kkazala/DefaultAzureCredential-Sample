
import dotenv from "dotenv"
import { Test_DefaultAzureCredential } from "./DefaultAzureAuth.module.js"

dotenv.config({ path: "./.env.cert" })

try {
    const { resultSPO, resultGraph } = await Test_DefaultAzureCredential()
    console.log("Auth SPO: ", resultSPO.token.slice(0, 10) + "...")
    console.log("Auth Graph: ", resultGraph.token.slice(0, 10) + "...")
}
catch (err) {
    console.log("TestDefaultAzureAuth Error: ", err.message)
}


