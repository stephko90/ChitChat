# ChitChat Messaging API

## Description 

ChitChat is a simple messaging API that has two routes for posting and retrieving messages

The code only handles this use-case and reads/writes from/to local disk. If I were to fully flesh this out into a microservice, I would leverage AWS S3 as a document store for storing messages, or add some
Docker container orchestration to create a postgres image and store messages/user information there and migrate data using knex.js. This would allow me to build out other functionality like making a functioning chatroom or user authentication.

## Getting Started

### Dependencies

Ensure that `npm` and `node are installed on the machine running the server. 

You can verify if `npm` and `node` are installed by running

**NPM**
`npm -v`

**Node**
`node -v`

### First Time Setup

Before starting the server, install the project dependencies with the command:

`npm install`

To start the server normally, you can run the following command:

`node index.js`

To start the server in `dev` mode, you can run the following command:

`npm run devStart`

This will start the server which listens on port :8080 for requests

# API Documentation

## Basics

This API contains two routes 

To send data to a POST route via `curl`, the following command can be used:

`curl -d "sender=5&recipient=7&message=test" -X POST "localhost:8080/"`

## Routes

### POST `/`

This route will take a `senderID`, `recipientID` and a `message` and store them as a JSON file that
acts as a recipients mailbox to be retrieved at another time. These three fields are required.

On a successful save, will return a confirmation message. 

**Request**

`curl -d "sender=5&recipient=7&message=test" -X POST "localhost:8080/"`

**Response**
```
Message successfully sent!
```

### GET `/messages`

This route will return up to 100 messages or all the messages for the past 30 days for *ALL* recipient users.

**Request**

`curl "http://localhost:8080/messages"`

**Response**
```json
[
    [
        {
            "sender": 1,
            "recipient": 2,
            "message": "*where are you",
            "sent": "2021-03-28T14:21:30.797-04:00"
        },
        {
            "sender": 1,
            "recipient": 2,
            "message": "hey",
            "sent": "2021-03-28T14:21:54.370-04:00"
        },
        {
            "sender": 1,
            "recipient": 2,
            "message": "r u there",
            "sent": "2021-03-28T14:36:59.631-04:00"
        }
    ],
    [
        {
            "sender": 1,
            "recipient": 5,
            "message": "wheres the code",
            "sent": "2021-03-28T14:51:06.754-04:00"
        }
    ],
    [
        {
            "sender": 1,
            "recipient": 7,
            "message": "help plz",
            "sent": "2021-03-28T14:51:20.442-04:00"
        },
        {
            "sender": 5,
            "recipient": 7,
            "message": "sup",
            "sent": "2021-03-28T15:55:53.301-04:00"
        },
        {
            "sender": 5,
            "recipient": 7,
            "message": "r u there?",
            "sent": "2021-03-28T15:57:11.946-04:00"
        },
        {
            "sender": 5,
            "recipient": 7,
            "message": "hello????",
            "sent": "2021-03-28T15:58:34.285-04:00"
        },
        {
            "sender": 5,
            "recipient": 7,
            "message": "answer plz",
            "sent": "2021-03-28T15:58:55.762-04:00"
        }
    ]
]
```

### GET `/messages?userID=:id`

This route will return up to 100 messages or all the messages for the past 30 days for *ONE* recipient user of the provided ID

**Request**

`curl "http://localhost:8080/messages?userID=7"`

**Response**
```json
[
    [
        {
            "sender": 1,
            "recipient": 7,
            "message": "help plz",
            "sent": "2021-03-28T14:51:20.442-04:00"
        },
        {
            "sender": 5,
            "recipient": 7,
            "message": "sup",
            "sent": "2021-03-28T15:55:53.301-04:00"
        },
        {
            "sender": 5,
            "recipient": 7,
            "message": "r u there?",
            "sent": "2021-03-28T15:57:11.946-04:00"
        },
        {
            "sender": 5,
            "recipient": 7,
            "message": "hello????",
            "sent": "2021-03-28T15:58:34.285-04:00"
        },
        {
            "sender": 5,
            "recipient": 7,
            "message": "answer plz",
            "sent": "2021-03-28T15:58:55.762-04:00"
        }
    ]
]
```