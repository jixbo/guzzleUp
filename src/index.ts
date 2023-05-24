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
            console.log("Current game state:", gameState);
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
let maxNumber = -1;

const run = async (roomName) => {
    const lobby = (await client.peekLobby()) as Lobby;

    console.log(lobby.rooms);

    const room = getMyRoom(roomName, lobby.rooms);

    totalCards = room.cards;

    maxNumber = totalCards + totalCards / 8;
    const session = (await client.joinRoom({...room,name:" ☕ Tea Time ☕ "})) as Session;

    pollGameState(session, 1500, action);
};

const shouldGuzzle = (state: GameState): boolean => {
    let cardsTaken = 0;

    const chips = state.you.chips;

    if (chips === 0) {
        return true;
    }
    const card = state.card;
    console.log(card.value);

    const weight = card.value - card.chips;
    console.log(weight);
    let underCard = 3;
    let overCard = totalCards;

    state.guzzlaz.forEach((guzzler) => {
        guzzler.cards.forEach((c) => {
            if (c.value < card.value) {
                underCard = Math.max(underCard, c.value);
            } else {
                overCard = Math.min(overCard, c.value);
            }
            cardsTaken++;
        });
    });

    const myUnderCard = -1000;
    const myOverCard = 1000;
    state.you.cards.forEach((c) => {
        if (c.value < card.value) {
            underCard = Math.max(myOverCard, c.value);
        } else {
            overCard = Math.min(myUnderCard, c.value);
        }
        cardsTaken++;
    });

    const myUnderDistance = card.value - myUnderCard;
    const myOverDistance = myOverCard - card.value;
    if (myUnderDistance === 1 || myOverDistance === 1) {
        return true;
    }
    const underDistance = card.value - underCard;
    const overDistance = overCard - card.value;

    let estimatedWeight = 0;
    console.log("cardsTaken", cardsTaken);
    const chances = (cardsTaken + 1) / totalCards;

    if (myOverDistance < overDistance) {
        console.log("myOverDistance", myOverDistance);
        console.log("overDistance", overDistance);
        estimatedWeight = (((myOverDistance - 1) * 2 * weight) / 3) * chances;
    } else {
        estimatedWeight = weight;
    }
    if (myUnderDistance < underDistance) {
        estimatedWeight = (((myUnderDistance - 1) * 2 * weight) / 3) * chances;
    } else {
        estimatedWeight = weight;
    }

    const needy = 1 / chips;
    console.log("estimated weight", estimatedWeight);
    console.log("max number * needy", (maxNumber / 4) * needy);
    console.log("result", estimatedWeight < (maxNumber / 4) * needy);
    console.log("card: ", card.value);
    console.log("/n");
    return estimatedWeight < (maxNumber / 4) * needy;
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
