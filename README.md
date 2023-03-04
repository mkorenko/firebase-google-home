## Google Home integration using Firebase RTDB

This is a framework based on a [Google codelab](https://developers.home.google.com/codelabs/smarthome-washer) that allows to easily integrate custom devices into Google Home ecosystem. \
It uses Firebase Realtime Database (RTDB) to establish two-way communication between Google Home and a device.
To benefit from this framework, the device must be capable of writing its current state as a JSON object to a specific RTDB path. It also should support subscribing to changes of an RTDB path to receive commands.

<img src="https://github.com/mkorenko/firebase-google-home/blob/main/images/fb-to-gh-states.png" alt="Firebase state to Google Home">

### Database structure: reporting device state to GH
To use this framework you need to support the following RTDB schema:
<img src="https://github.com/mkorenko/firebase-google-home/blob/main/images/rtdb-schema.png" alt="RTDB schema" width="50%">

#### device_id -> gh_config
*gh_config* object is used to describe device attributes and capabilities. \
The information in this section is used to form a [GH SYNC intent response](https://developers.home.google.com/cloud-to-cloud/intents/sync#response).
The fields in this object map to a SYNC response as follows:
```
deviceInfo: equals to the "deviceInfo" SYNC response object.

name: equals to the "name" SYNC response object.

notificationSupportedByAgent: equals to the corresponding SYNC response Boolean field.

traits (see https://developers.home.google.com/cloud-to-cloud/traits):
  key: shortened supported GH trait name (without the "action.devices.traits." prefix). The keys are collected and form the "traits" SYNC response string array.
  value: either boolean "true", or "attributes" SYNC response object related to the trait, if the trait has attributes.


type: (see https://developers.home.google.com/cloud-to-cloud/guides)
shortened supported GH device type (without the "action.devices.types." prefix). Forms the "type" SYNC response string field.

willReportState: equals to the corresponding SYNC response Boolean field.
```

#### device_id -> online_at
*online_at* timestamp field is used by the framework to track device offline state. If device did not refresh this field within a minute, its "gh_state" object will receive `offline: true` property, that will report device offline system to GH.

#### device_id -> *{arbitrary_device_param, e.g. power_at}*
(optional) *device_id* object may have other arbitrary device parameters reported by your device that won't be tracked by the framework. F.e. this example device also reports the *power_at* timestamp, and its change has no effect on the system.

#### device_id -> state
*state* object describes current device state. It should be set by the device when its observed state changes.

#### device_id -> state -> *{arbitrary_device_state_param}*
(optional) *state* object may contain device's arbitrary current state parameters. These params won't be tracked by the framework.

#### device_id -> state -> gh_state
*gh_state* object is used in [QUERY](https://developers.home.google.com/cloud-to-cloud/intents/query#response) and [EXECUTE](https://developers.home.google.com/cloud-to-cloud/intents/execute#response) GH intent responses. This object is GH's "device state" object that is formed based on device supported traits (see [Device Traits](https://developers.home.google.com/cloud-to-cloud/traits)).

#### device_id -> state -> gh_state -> gh_notifications
(optional) *gh_notifications* - some traits (f.e. [RunCycle](https://developers.home.google.com/cloud-to-cloud/traits/runcycle)) support notifications. If *gh_state* object is updated and *gh_notifications* sub-object is present, it will be included as a part of "notifications" object in [GH Home Graph request](https://developers.home.google.com/reference/home-graph/rest/v1/devices/reportStateAndNotification#reportstateandnotificationdevice) which as a result will trigger a notification.


### Database structure: receiving GH commands
To receive GH commands the device should subscribe to `{device_id}/cmd` path data changes. \
The device should also reply to a command by setting a "result" object as `{device_id}/cmd/result`.

<img src="https://github.com/mkorenko/firebase-google-home/blob/main/images/cmd-success.png" alt="command and success result example">
<img src="https://github.com/mkorenko/firebase-google-home/blob/main/images/cmd-error.png" alt="command and error result example">

#### device_id -> cmd
*cmd* object is posted by the framework and contains some GH command, the device should react on a change to this path. \
The object will be removed when either the device will push "result" object as `{device_id}/cmd/result` or in case of a timeout (5s by default).

#### device_id -> cmd -> command
*command* is a device supported trait command string (see specific trait description in [Device traits](https://developers.home.google.com/cloud-to-cloud/traits))

#### device_id -> cmd -> params
*params* is a device supported trait params object (see specific trait description in [Device traits](https://developers.home.google.com/cloud-to-cloud/traits))

#### device_id -> cmd -> result
*result* is an object that is pushed by the device as a response to a command. \
In case of a success – the object should contain partial GH state. It will be merged with the existing device state and reported as a result of the [EXECUTE](https://developers.home.google.com/cloud-to-cloud/intents/execute#response) GH intent. \
In case of an error – the object should contain the only "error_code" string field, see [GH supported error codes](https://developers.home.google.com/cloud-to-cloud/intents/errors-exceptions).

### Setup
See [setup guide](https://github.com/mkorenko/firebase-google-home/blob/main/SETUP.md).

### ESP32/ESP8266 controllers companion library
There is a [companion library for ESP32/ESP8266 microcontrolles](https://github.com/mkorenko/esp-firebase-gh). \
It allows to easily integrate with this framework by providing simple "on command" and "report state" callbacks.
