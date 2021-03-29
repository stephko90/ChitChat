express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const fns = require('date-fns');
app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const MAX_MESSAGES = process.env.MAX_MESSAGES || 100;
const MAX_DAYS = process.env.MAX_DAYS || 30;
const BUCKET = process.env.BUCKET || "./messages/";
const MESSAGE_FILE_EXTENSION = ".json"
const PORT = process.env.PORT || 8080;
const MAX_MESSAGE_LENGTH = process.env.MAX_MESSAGE_LENGTH || 150;

app.get('/messages', async function(req, res) {
    let recipientID = req.query.recipientID;
    let senderID = req.query.senderID;
    fs.readdir(BUCKET, (err, files) => {
        if (err)
            console.log(err);
        else {
            let output = [];
            if (recipientID !== undefined) {
                if (doesFileExist(getFilename(recipientID))) {
                    messages = processFile(recipientID + MESSAGE_FILE_EXTENSION)
                    if (senderID !== undefined) {
                        senderIDInt = parseInt(senderID)
                        // if we want to see messages from a specific sender, filter out the results
                        // there's probably a better javascript way to do this
                        for (var i = 0; i < messages.length; i++) {
                            if (messages[i].sender !== senderIDInt) {
                                messages.splice(i, 1)
                                i--
                            }
                        }
                    }
                    output.push(messages)
                } else {
                    res.send("No messages exist for recipientID: " + recipientID)
                    return
                }
            }
            else {
                // read through each file in the bucket
                files.forEach(file => {
                    output.push(processFile(file))
                })
            }
            res.send(output)
            return
        }
    })
});
  
app.post('/', async function(req, res) {
    body = req.body;
    
    senderID = body.sender
    recipientID = body.recipient
    message = body.message

    if (senderID === undefined || recipientID === undefined) {
        res.send('Invalid user: Sender and recipient IDs cannot be missing')
    }
    
    if (!validateMessage(message)) {
        res.send('Invalid message: Message field cannot be empty or missing or greater than ' + MAX_MESSAGE_LENGTH + ' chars in length')
        return
    }

    var sentMessage = {
        sender: parseInt(senderID),
        recipient: parseInt(recipientID),
        message: message,
        sent: fns.format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
    }

    let fileName = getFilename(recipientID);

    let mailboxJSON = fs.readFileSync(fileName,{flag: 'a+'});

    let mailbox = [];
    // only parse if the file is not empty
    if (mailboxJSON.length > 0) {
        mailbox = JSON.parse(mailboxJSON);
    }
    mailbox.push(sentMessage);
    mailboxJSON = JSON.stringify(mailbox);
    fs.writeFileSync(fileName,mailboxJSON,"utf-8");
    res.send("Message successfully sent!")
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

http.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
    checkAndCreateDirectory(BUCKET)
});

/**
 * Returns the path in the local file system where messages are stored.
 * If this were a real microservice, I would have this
 * point to an S3 bucket instead
 * @param {The ID of the recipient user's mailbox} recipientID 
 * @returns a formatted string of the relative path of a user's mailbox
 */
function getFilename(recipientID) {
    return BUCKET + recipientID + MESSAGE_FILE_EXTENSION;
}

/**
 * Helper function to determine if a file exists or not
 * @param {the full relative path of the file to check if it exists} file 
 * @returns a boolean of a files existence
 */
function doesFileExist(file) {
    try {
        return fs.existsSync(file);
      } catch(err) {
        console.error(err)
        return false
      }
}

/**
 * Checks if a provided directory exists, and if not, creates it.
 * @param {the name of the directory to check/create} directory 
 */
function checkAndCreateDirectory(directory) {
    try {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
      } catch(e) {
        console.log("An error occurred creatign directory: " + directory)
      }
}

/**
 * This function contains business logic to validate a provided message.
 * @param {The message to be validated} message 
 * @returns a boolean if the message is valid of not
 */
function validateMessage(message) {
    return !(message === undefined || message === "" || message.length > MAX_MESSAGE_LENGTH);
}

/**
 * This function will parse a given user's message JSON file in a provided 
 * bucket
 * @param {The name of a file in a given bucket} file 
 * @returns an array of message objects
 */
function processFile(file) {
    let mailboxJSON = fs.readFileSync(BUCKET+file,{flag: 'a+'});
    let messages = JSON.parse(mailboxJSON);
    let parsedMessage = parseMessages(messages);
    return parsedMessage;
}

/**
 * This method will return all messages within the MAX_DAYS time period, or
 * up to MAX_MESSAGES messages
 * @param {The JSON of all messages for a given user} messages 
 * @returns an array of message objects
 */
function parseMessages(messages) {
    let output = [];
    let maxOverDateRange = 0
    for (var i = 0; i < messages.length && maxOverDateRange <= MAX_MESSAGES; i++) {
        // if the messages are older than MAX_DAYS (30 days in the given example)
        // we want to exit out of the loop if the number of messages exceeds 
        // MAX_MESSAGES (100 messages in the given example)
        if (!isDateNewerThanMaxDays(messages[i].sent)) {
            maxOverDateRange = output.length
            maxOverDateRange++
        }
        output.push(messages[i]);
    }
    return output
}

/**
 * This method checks if the provided day is after the max number of days provided
 * in the global MAX_DAYS variable. This limit can be set in an environment variable.
 * @param {the date to check} day 
 * @returns a boolean if the provided date is more recent than MAX_DAYS ago
 */
function isDateNewerThanMaxDays(day) {
    return fns.isAfter(fns.parseISO(day), fns.subDays(new Date(), MAX_DAYS));
}