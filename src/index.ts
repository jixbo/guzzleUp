import { GameState, GuzzleAPIClient, Lobby, Room, Session } from './guzzleClient';
const client = new GuzzleAPIClient('http://10.0.0.174:7133');

const sessionId = {
    sessionId: '1234'
}

const player = {
    name: 'player'
}

const guzzler = {
    cards: [],
    chips: 0,
    score: 0,
    name: 'guzzler'
}

const card = {
    value: 0,
    chips: 0
}

const gameState = {
    you: {
        ...sessionId,
        ...guzzler
    },
    guzzlaz: [guzzler],
    theGuzzla: guzzler,
    card,
    time2guzzle: false,
    winners: [guzzler]
}

const error = {
    message: 'error',
    errors: [{
        message: 'error',
        path: 'error'
    }]
}

const room = {
    roomId: '1234',
    cards: 0,
    chips: 0,
    roomName: 'room'
}

const newRoom = {
    ...room
}

const joinRoomBody = {
    ...sessionId,
    ...player,
    roomId: '1234'
}

const leaveRoomBody = {
    ...sessionId
}

const stateBody = {
    ...sessionId
}

const actionBody = {
    ...sessionId,
    guzzle: true
}


const getMyRoom = (name: string, roomlist: Room[]) => {
    return roomlist.find(room => room.roomName === name) as Room;
}



let pollCount = 0

function pollGameState(session: Session, interval: number, actionCallback: (sessionId: string, state: GameState) => void) {

    client.getState(session)
        .then((gameState: void | GameState) => {
            console.log('Current game state:', gameState);
            // Process the game state as needed
            if (gameState) {
                // Call the pollGameState function again after 0.5 seconds
                actionCallback(session.sessionId, gameState);

                if (pollCount < 10) {
                    setTimeout(() => {
                        pollGameState(session, interval, actionCallback)
                    }, 500);
                }
            }
        })
        .catch((error: Error) => {
            console.error('Failed to fetch game state:', error);
            // Retry fetching the game state after 0.5 seconds
            // setTimeout(pollGameState, 500);
        });
}

const run = async (roomName) => {
    const lobby = await client.peekLobby() as Lobby;

    console.log(lobby.rooms);

    const room = getMyRoom(roomName, lobby.rooms);

    const session = await client.joinRoom(room) as Session;

    pollGameState(session, 500, action);
    // const state = await client.getState(session) as GameState;
    // console.log("sesionId: ", sessionId);
}


const action = async (sessionId: string, state: GameState) => {
    if (state.time2guzzle) {
        const result = await client.guzzle(sessionId, true);
    }
}

const args = process.argv.slice(2);
if (args.length === 0) {
   (async () => {
    const lobby = await client.peekLobby() as Lobby;
    console.log(lobby.rooms);
    console.log("Pass room name to join");
})();
} else {
    console.log("Joining room");
    run(args[0]);

}


// client.joinRoom(newRoom)
//     .then((room: Room) => console.log(room))
//     .catch((error: Error) => console.log(error));

// client.joinRoom(joinRoomBody)
//     .then((room: Room) => console.log(room))
//     .catch((error: Error) => console.log(error));



// client.getState(stateBody)
//     .then((gameState: GameState) => console.log(gameState))
//     .catch((error: Error) => console.log(error));


