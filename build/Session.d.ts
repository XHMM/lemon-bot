import { Messages } from './CQHelper';
import { Numbers } from './Command';
import { MessageFromType } from './utils';
export interface SessionData extends Numbers {
    fromType: MessageFromType;
    sessionName: string;
    directives: string[];
    historyMessages: Record<string, Messages>;
}
export declare class Session {
    private readonly redisClient;
    constructor(redisClient: any);
    private static genSessionKey;
    getSession(params: Numbers): Promise<SessionData | null>;
    setSession(params: Numbers, { directives, historyMessages }: Pick<SessionData, 'directives' | 'historyMessages'>, sessionName: SessionData['sessionName'], expireSeconds?: number): Promise<void>;
    removeSession(params: Numbers): Promise<void>;
}
