# FRESHDESK TELEX INTEGRATION

This project is an interation for [Telex](telex.im) that fetches new ticket notification from Freshdesk and sends it to a telex channel. It is built using Nodejs(express) and designed to connect to your freshdesk application easily

## Features
- Sends Freshdesk ticket notification to telex channel.
- Webhook url to connect to your company's freshdesk account.
- Customizable interval for receiving notifications.

<hr>

## Setup (local) Instructions
To run this locally, ensure you have the following installed: <br> 
- Node.js
- npm 
- Express

### Steps
1. Clone the repository:
   
   ```sh
     git clone https://github.com/telexintegrations/freshdesk-notifications-telex-integration.git
   
     cd freshdesk-notifications-telex-integration
   ```
2. Install dependencies
   ```sh
     npm install
   ```
3. Create a .env file and specify a port
   ```sh
     PORT = 5000
   ```
4. Start the server
   ```sh
     npm start
   ```
5. Run tests
    ```
       npm test
    ```
6. See integration spec file in your browser or with postman
   ```sh
     http://localhost:5000/integration-spec
   ```
<hr>

## API ENDPOINTS

### Base Url
```
    https://freshdesk-notifications-telex-integration.onrender.com
```
### Integration Specifications
`GET/${base_url}/integtation-spec` - This end point returns a json specififcations for the integation
### Tick Endpoint
`POST/${base_url}/tick` - this endpoint is called at interval by telex, it fetches the notification from freshdesk and send to the telex channel

## Integration Settings
- `API key` - your company's freshdesk api key
- `Freshdesk Domain` - your company freshdesk domain

## screenshot of the freshdesk integration in a telex channel
![Screenshot of Telex chaneel](/Screenshot.png)