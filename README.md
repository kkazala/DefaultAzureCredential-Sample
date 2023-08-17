
# DefaultAzureCredential Sample

## TL;DR

1. Create Service Principal (see [Application and service principal objects in Azure Active Directory](https://learn.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals?tabs=browser))
2. Create PEM certificate, . See [Create PEM certificate **password protected**](#password-protected))
3. Create `PEM` certificate with **both**, the public and private key. See [BOTH.pem](#bothpem)
4. Set environment variables. See [.env.cert](#envcert)




## DefaultAzureCredential

The `DefaultAzureCredential` is a specialization of the `ChainedTokenCredential` which tries each of the following credential types in order until one of them succeeds:

- `EnvironmentCredential`
- `ManagedIdentityCredential`

`EnvironmentCredential` looks for well-known environment variable names to determine how it should authenticate. It effectively acts as a wrapper for the `ClientSecretCredential`, `ClientCertificateCredential` or `UsernamePasswordCredential` depending on which environment variables are present.

In all cases, the `AZURE_TENANT_ID` and `AZURE_CLIENT_ID` environment variables are expected to be present to use this credential as they identify your application. The following environment variables will then be tried in order:

- `AZURE_CLIENT_SECRET` - A client secret to be used with ClientSecretCredential
- `AZURE_CLIENT_CERTIFICATE_PATH` - The **path to a PEM-formatted certificate file in the deployment environment** to be used with the ``ClientCertificateCredential`
- `AZURE_USERNAME` and `AZURE_PASSWORD` - The username and password pair to be used with the UsernamePasswordCredential

> By specifying `AZURE_CLIENT_CERTIFICATE_PATH` we use the following classes: `DefaultAzureCredential` -> `EnvironmentCredential` -> `ClientCertificateCredential` -> `MsalClientCertificate`

### Certificate-based authentication

You must generate a pair of keys, **one private** and **one public**. Messages can be encrypted with the public key, but only decrypted with the private key.
In public key authentication, client has a private key that he uses to authenticate to server's public key.

A `PEM` file may contain just about anything including a public key, a private key, or both, because a PEM file is not a standard. In effect PEM just means the file contains a base64-encoded bit of data.

## ClientCertificateCredential

The `ClientCertificateCredential` implements the [client credentials flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow).
It uses a certificate as the means to authenticate the client. You must generate your own PEM-formatted certificate for use in this flow and then [register it](https://learn.microsoft.com/en-us/azure/active-directory/develop/certificate-credentials#register-your-certificate-with-microsoft-identity-platform) in the "Certificates & secrets" page for your app registration. Using a certificate to authenticate is recommended as it is generally more secure than using a client secret.

> **NOTE**:
>
> - `@azure/identity` supports both kinds of PEM certificates: those with password protection and those without it.
> - `jsonwebtoken` version 9 introduces several security fixes to follow best practices. These changes may impact you if you were relying on previous insecure behaviour. For example, RSA key size must be `2048` bits or greater.

### Create PEM certificate

#### password protected

```ps
openssl req `
    -x509 `
    -days 365 `
    -newkey rsa:2048 `
    -keyout keyencrypted.pem `
    -out cert.pem `
    -subj '/CN=AuthTestWithPassword/C=CH/ST=Zurich/L=Zurich' `
    -passout pass:HereIsMySuperPass
```

#### NOT password protected

```ps
openssl req `
    -new `
    -x509 `
    -days 365 `
    -newkey rsa:2048 `
    -keyout key.pem `
    -out cert.pem `
    -subj '/CN=AuthTestNoPassword/C=CH/ST=Zurich/L=Zurich' `
    -nodes
```

### MsalClientCertificate

The `MsalClientCertificate` implementation assumes that **both**: the certificate and the private key are included in the local `PEM` file.

Based on the contents of this file it generates a `thumbrpint` (its value is the same as the one you see in "Certificates & Secrets" in Azure portal), and retrieves the `private key`. If the private key file is password encrypted, it will decrypt it with the password you provide. Oterwise, it will use the private key "as is"

After executing the above `openssl` comman, create a new `BOTH.pem` file and copy the contents of the `cert.pem` and `keyencrypted.pem`
The file should have the following format:

#### BOTH.pem

```txt
-----BEGIN CERTIFICATE-----
MIIDfTCCAmWgAwIBAgIUKoqrm/mWZ2EoC/a60vBoAXxoEMEwDQYJKoZIhvcNAQEL
...
tjs1jav+97FKR1lLnyGS90e2LjtTjLzqy1O5k8T1+6sv
-----END CERTIFICATE-----
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFHDBOBgkqhkiG9w0BBQ0wQTApBgkqhkiG9w0BBQwwHAQIZ6SyJiacCZwCAggA
...
UaTp6QTCR5NvDEb3iPNbQw==
-----END ENCRYPTED PRIVATE KEY-----
```

## Environment variables

The `DefaultAzureCredential` attempts to authenticate via the following mechanisms, in this order, stopping when one succeeds:

- **Environment** - The DefaultAzureCredential will read account information specified via [environment variables](https://learn.microsoft.com/en-us/dotnet/api/overview/azure/identity-readme?view=azure-dotnet#environment-variables) and use it to authenticate.
- **Workload Identity** - If the application is deployed to an Azure host with Workload Identity enabled, the DefaultAzureCredential will authenticate with that account.
- **Managed Identity** - If the application is deployed to an Azure host with Managed Identity enabled, the DefaultAzureCredential will authenticate with that account.
- etc...

### Service principal with secret

| Variable name | Value|
|-|-|
|`AZURE_CLIENT_ID` |ID of an Azure AD application|
|`AZURE_TENANT_ID` |ID of the application's Azure AD tenant|
|`AZURE_CLIENT_SECRET`| one of the application's client secrets|

### Service principal with certificate

| Variable name | Value|
|-|-|
|`AZURE_CLIENT_ID` |ID of an Azure AD application|
|`AZURE_TENANT_ID` |ID of the application's Azure AD tenant|
|`AZURE_CLIENT_CERTIFICATE_PATH` |path to a PFX or PEM-encoded certificate file including private key|
|`AZURE_CLIENT_CERTIFICATE_PASSWORD` |(optional) the password protecting the certificate file (currently only supported for PFX (PKCS12) certificates)|
|`AZURE_CLIENT_SEND_CERTIFICATE_CHAIN` |(optional) send certificate chain in x5c header to support subject name / issuer based authentication|

>According to my tests, the `AZURE_CLIENT_CERTIFICATE_PATH` must be a path to a `PEM` file which includes **both**, the certificate (as uploaded to "Certificarte & Secrets") and the private key.

You may either set the environment variable using PowerShell (`$env:Path = 'C:\foo;'`) or using a file. This is my preferred approach because it's very easy to swap them as needed

In the root of your project create `.env.cert` file, and set the values

#### .env.cert

```txt
TenantName= "{tenant-name}"
AZURE_CLIENT_ID= "{client-id}"
AZURE_TENANT_ID= "{tenant-id}"
AZURE_CLIENT_CERTIFICATE_PATH= "./temp/BOTH.pem"
AZURE_CLIENT_CERTIFICATE_PASSWORD= "HereIsMySuperPass"

AZURE_CLOUD_INSTANCE= "https://login.microsoftonline.com/"
GRAPH_API_ENDPOINT= "https://graph.microsoft.com/"
```

> Note: Needless to say, you wouldn't normally commiting the `*.pem` or `.env` files to the repo 😊.

## Implementation

The setup is now ready and you can use the `DefaultAzureCredential` to authenticate. Make sure to import the environment variables from the `.env.cert`

```ts
import dotenv from "dotenv"
import { AccessToken, DefaultAzureCredential } from "@azure/identity";

dotenv.config({ path: "./.env.cert" })

const credential = new DefaultAzureCredential()

const resultGraph: AccessToken = await credential.getToken("https://graph.microsoft.com/.default")
const resultSPO: AccessToken = await credential.getToken(`https://${process.env.TenantName}.sharepoint.com/.default`)

console.log("Auth SPO: ", resultSPO.token.slice(0, 10) + "...")
console.log("Auth Graph: ", resultGraph.token.slice(0, 10) + "...")
```

