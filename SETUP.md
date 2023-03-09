## Setup

In case of any inconsistencies please refer to [the codelab](https://developers.home.google.com/codelabs/smarthome-washer) this framework is based on.

### 1. Enable Activity controls

Open the [Activity Controls page](https://myaccount.google.com/activitycontrols) for the Google account that you want to use with the Assistant.

Ensure the following toggle switches are enabled:

- Web & App Activity - In addition, be sure to select the Include Chrome history and activity from sites, apps, and devices that use Google services checkbox.
- Device Information
- Voice & Audio Activity

### 2. Create an Actions project

1. Go to the [Actions on Google Developer Console](http://console.actions.google.com/).
2. Click **New Project**, enter a name for the project (e.g. *Firebase Smart Home*), and click **CREATE PROJECT**.
3. Choose the **Smart Home** experience card, click **Start Building**.

### 3. Create a billing account

This project uses [Cloud Functions for Firebase](https://firebase.google.com/docs/functions), which requires you to associate a billing account with your project. Actions projects do not create a billing account by default. See [Create a new billing account](https://cloud.google.com/billing/docs/how-to/manage-billing-account#create_a_new_billing_account) for more information.

### 4. Clone this repository and install dependencies

```
git clone https://github.com/mkorenko/firebase-google-home.git
cd firebase-google-home
npm install
```

### 5. Authorize the Firebase CLI and create a Firebase project
Lookup your `PROJECT_ID` in the Actions console. \
You can find it either in the URL \
`https://console.actions.google.com/project/PROJECT_ID/...` \
or under **Project settings**.

```
npm run login
npm run firebase -- use PROJECT_ID
npm run init
```

Next follow the steps in the wizard:

1. Which Firebase features do you want to set up for this directory? ... \
_Select **Realtime Database** and **Functions**._
2. It seems like you haven’t initialized Realtime Database in your project yet. Do you want to set it up? \
_**Y**_, then _choose the location_
3. File **database.rules.json** already exists. Do you want to overwrite it ... \
_**N**_
4. Would you like to initialize a new codebase, or overwrite an existing one? \
_**Overwrite**_
5. What language would you like to use to write Cloud Functions? \
_**JavaScript**_
6. Do you want to use ESLint to catch probable bugs and enforce style? \
_**Y**_
7. File **functions/package.json** already exists. Overwrite? \
_**N**_
8. File **functions/.eslintrc.js** already exists. Overwrite? \
_**N**_
9. File **functions/index.js** already exists. Overwrite? \
_**N**_
10. File **functions/.gitignore** already exists. Overwrite? \
_**N**_
11. Do you want to install dependencies with npm now? \
_**N**_

You should see:
> ✔  Firebase initialization complete!

### 6. Enable the HomeGraph API
The [HomeGraph API](https://developers.home.google.com/reference/home-graph/rpc) enables the storage and querying of devices and their states within a user's Home Graph. To use this API, you must first open the Google Cloud console and [enable the HomeGraph API](https://console.cloud.google.com/apis/library/homegraph.googleapis.com).

In the Google Cloud console, make sure to select the project that matches your Actions `PROJECT_ID`. Then, in the API Library screen for the HomeGraph API, click **Enable**.

### 7. Enable the Blaze plan and Deploy
1. Go to the [Usage and billing page](https://console.firebase.google.com/project/_/usage/details) of your project.
2. Click **Modify plan**.
3. Select the **Blaze plan** and confirm your billing account.
4. Set a billing budget \
(You will not reach the paid quota for personal use of this project, but set e.g. $1 just in case).
5. Click **Purchase** (you won't be charged).

Next in your project directory run: \
`npm run deploy`

You should see:
> ✔  Deploy complete!

Leave the terminal open for now to copy-paste the URLs to the [Actions console](https://console.actions.google.com/).

Note: you may get some warnings in the log like:
```
@firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"Error fetching access token: Error while making request: getaddrinfo ENOTFOUND metadata.google.internal. Error code: ENOTFOUND\"."}
```
Ignore them – you can set up a [Private Key](https://firebase.google.com/docs/admin/setup#use-oauth-2-0-refresh-token) and reconfigure `initializeApp()` in `functions/src/firebase-ref.js` to make the warnings disappear, but that is not required for the successful operation of the project.

### 8. Configure your Actions console project

Get back to your project in the [Actions console](https://console.actions.google.com/).

1. Under **Overview > Build your Action**, select **Add Action(s)**. Enter the URL for your cloud function that provides fulfillment for the smart home intents and click **Save**.
You can find the URLs for the next steps, in this case ending up with `/smarthome` in your terminal output from the previous step. \
`https://PROJECT_LOCATION-PROJECT_ID.cloudfunctions.net/smarthome`
2. On the **Develop > Invocation** tab, add a **Display Name** for your Action (e.g. *Firebase Smart Home*), and click **Save**. This name will appear in the Google Home app.
3. To enable **Account linking**, select the **Develop > Account linking** option in the left navigation. Use these account linking settings: \
Client ID: `_` \
Client secret: `_` \
Authorization URL: `https://PROJECT_LOCATION-PROJECT_ID.cloudfunctions.net/auth` \
Token URL: `https://PROJECT_LOCATION-PROJECT_ID.cloudfunctions.net/token`
4. Click **Save** to save your account linking configuration, then click **Test** to enable testing on your project.

### 9. Describe a new device in the Firebase RTDB
1. Go to the [Database page](https://console.firebase.google.com/project/_/database) of your Firebase project.
2. Click **Create Database**
3. Select **Start in locked mode**
4. Follow the [main README / DB structure section](https://github.com/mkorenko/firebase-google-home#device_id---gh_config) and fill in `device_id -> gh_config` object. \
**Note**: you can use RTDB's Import/Export functionality to (re)store your device configs.
5. Redeploy RTDB rules, in the terminal run:
`npm run deploy:dbrules`

You should see:
> ✔  Deploy complete!

### 10. Link to Google Assistant
1. On your phone, open the Google Assistant settings. Note that you should be logged in as the same account as in the console.
2. Navigate to **Google Assistant > Settings > Works with Google** (under Services).
3. Search for your project name by typing **test**.
4. Select you project and follow the steps. \
**Note**: you may get an error first time - this is due to time out / cloud functions cold start. In case of an error try again.

As a result you should see your device(s) linked to your home! \
Now move them to your rooms to [support real time state updates](https://stackoverflow.com/a/74218253).
