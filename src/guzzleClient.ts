import axios, { AxiosError, AxiosResponse } from 'axios';

interface SessionId {
    sessionId: string;
}

interface Player {
    name: string;
}

interface Guzzler extends Player {
    cards: Card[];
    chips: number;
    score: number;
}

interface You extends Guzzler, SessionId { }

interface Card {
    value: number;
    chips: number;
}

export interface GameState {
    you: You;
    guzzlaz: Guzzler[];
    theGuzzla: Guzzler;
    card: Card;
    time2guzzle: boolean;
    winners: Guzzler[];
}

interface Error {
    message: string;
    errors?: {
        message: string;
        path: string;
    }[];
}

export interface Room {
    roomId: string;
    roomName?: string;
}

export interface Lobby {
    rooms: Room[];
}

export interface Session {
    sessionId: string;
}

interface NewRoom extends Room { }

interface JoinRoomBody extends SessionId {
    name: string;
    roomId?: string;
}

interface LeaveRoomBody extends SessionId { }

interface StateBody extends SessionId { }

interface ActionBody extends SessionId {
    guzzle: boolean;
}

export class GuzzleAPIClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private handleResponse<T>(response: AxiosResponse<T>): T {
        return response.data;
    }

    private handleError(error: AxiosError<Error>): void {
        if (error.response) {
            console.error('Request failed:', error.response.data);
        } else {
            console.error('Request failed:', error.message);
        }
    }

    public peekLobby(): Promise<void | Lobby> {
        return axios
            .get<Lobby>(`${this.baseURL}/lobby`)
            .then(this.handleResponse)
            .catch(this.handleError);
    }

    public joinRoom(body: Room): Promise<void | Session> {
        return axios
            .post<Session>(`${this.baseURL}/room`, body)
            .then(this.handleResponse)
            .catch(this.handleError);
    }

    public getState(body: Session): Promise<void | GameState> {
        return axios
            .post<GameState>(`${this.baseURL}/state`, body)
            .then(this.handleResponse)
            .catch(this.handleError);
    }

    public guzzle(sessionId: string, guzzle: boolean): Promise<void | GameState> {
        return axios
            .post<GameState>(`${this.baseURL}/action`, { sessionId, guzzle })
            .then(this.handleResponse)
            .catch(this.handleError);
    }

}
