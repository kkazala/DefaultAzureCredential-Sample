
import { AccessToken, DefaultAzureCredential } from "@azure/identity";

export async function Test_DefaultAzureCredential(): Promise<{ resultSPO: AccessToken; resultGraph: AccessToken }> {

    // setLogLevel("info");
    // const credential = new DefaultAzureCredential({
    //     loggingOptions: { allowLoggingAccountIdentifiers: true },
    // });
    const credential = new DefaultAzureCredential()

    const resultGraph: AccessToken = await credential.getToken("https://graph.microsoft.com/.default")

    const resultSPO: AccessToken = await credential.getToken(`https://${process.env.TenantName}.sharepoint.com/.default`)

    return { resultSPO, resultGraph };
}