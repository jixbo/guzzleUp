import { GameState, GuzzleAPIClient, Lobby, Room, Session } from "./guzzleClient";
const client = new GuzzleAPIClient("http://10.0.0.174:7133");

const sessionId = {
    sessionId: "1234",
};

const player = {
    name: "player",
};

const guzzler = {
    cards: [],
    chips: 0,
    score: 0,
    name: "guzzler",
};

const card = {
    value: 0,
    chips: 0,
};

const gameState = {
    you: {
        ...sessionId,
        ...guzzler,
    },
    guzzlaz: [guzzler],
    theGuzzla: guzzler,
    card,
    time2guzzle: false,
    winners: [guzzler],
};

const error = {
    message: "error",
    errors: [
        {
            message: "error",
            path: "error",
        },
    ],
};

const room = {
    roomId: "1234",
    cards: 0,
    chips: 0,
    roomName: "room",
};

const newRoom = {
    ...room,
};

const joinRoomBody = {
    ...sessionId,
    ...player,
    roomId: "1234",
};

const leaveRoomBody = {
    ...sessionId,
};

const stateBody = {
    ...sessionId,
};

const actionBody = {
    ...sessionId,
    guzzle: true,
};

const getMyRoom = (name: string, roomlist: Room[]) => {
    return roomlist.find((room) => room.roomName === name) as Room;
};

const cards = [];

function pollGameState(
    session: Session,
    interval: number,
    actionCallback: (sessionId: string, state: GameState) => void,
) {
    client
        .getState(session)
        .then((gameState: void | GameState) => {
            console.log("Current game state:", JSON.stringify(gameState));
            // Process the game state as needed
            if (gameState) {
                // Call the pollGameState function again after 0.5 seconds
                actionCallback(session.sessionId, gameState);

                setTimeout(() => {
                    pollGameState(session, interval, actionCallback);
                }, 1500);
            }
        })
        .catch((error: Error) => {
            console.error("Failed to fetch game state:", error);
            // Retry fetching the game state after 0.5 seconds
            // setTimeout(pollGameState, 500);
        });
}

let totalCards;
let cardsTaken = 0;
let maxNumber = -1;

const run = async (roomName) => {
    const lobby = (await client.peekLobby()) as Lobby;

    console.log(lobby.rooms);

    const room = getMyRoom(roomName, lobby.rooms);

    totalCards = room.cards;

    maxNumber = totalCards + totalCards / 8;
    const session = (await client.joinRoom(room)) as Session;

    pollGameState(session, 500, action);
};

const shouldGuzzle = (state: GameState): boolean => {
    const chips = state.you.chips;

    if (chips === 0) {
        return true;
    }
    const card = state.card;
    const weight = card.value - card.chips;

    let underCard = -1000;
    let overCard = 1000;

    state.guzzlaz.forEach((guzzler) => {
        guzzler.cards.forEach((c) => {
            if (c.value < card.value) {
                underCard = Math.max(underCard, c.value);
            } else {
                overCard = Math.min(overCard, c.value);
            }
        });
    });

    const myUnderCard = -1000;
    const myOverCard = 1000;
    state.you.cards.forEach((c) => {
        if (c.value < card.value) {
            underCard = Math.max(myOverCard, c.value);
        } else {
            overCard = Math.min(overCard, c.value);
        }
    });

    const myUnderDistance = card.value - myUnderCard;
    const myOverDistance = myOverCard - card.value;
    if (myUnderDistance === 1 || myOverDistance === 1) {
        return true;
    }
    const underDistance = card.value - underCard;
    const overDistance = overCard - card.value;

    let estimatedWeight = 0;
    const chances = cardsTaken / totalCards;
    if (myOverDistance < overDistance) {
        estimatedWeight = Math.max(((overDistance - 1) * 2 * card.value) / 4, weight) * chances;
    }
    if (myUnderDistance < underDistance) {
        estimatedWeight = Math.max(((overDistance - 1) * 2 * card.value) / 4) * chances;
    }

    const needy = 1 / chips;

    return estimatedWeight > maxNumber * needy;
};

const action = async (sessionId: string, state: GameState) => {
    await client.guzzle(sessionId, shouldGuzzle(state));
};

const args = process.argv.slice(2);
if (args.length === 0) {
    (async () => {
        const lobby = (await client.peekLobby()) as Lobby;
        console.log(lobby.rooms);
        console.log("Give room name as parameter to join");
    })();
} else {
    console.log("Joining room");
    run(args[0]);
}
