import { Tempo, uid } from '@app/utils/function';
import { Injectable } from '@nestjs/common';
import { generateKeyPairSync } from 'node:crypto';

export interface KeyPair {
  kid: string;
  publicKey: string;
  privateKey: string;
  createdAt: Date;
  expires: number; // Optional, can be used for convenience
}

@Injectable()
export class KeyGeneratorService {

    constructor() { }

    /**
     * 
     * @param expiresIn Expiration time in seconds. Default is 24 hours (24 * 60 * 60).
     * If set to 0 or less, it will throw an error.
     * @returns KeyPair object containing the generated keys and metadata.
     * @throws Error if expiresIn is less than or equal to 0.
     */
    async genarateKey(expiresIn: number = 24 * 60 * 60): Promise<KeyPair> {
        try {
            if (expiresIn <= 0) {
                throw new Error('Expiration time must be greater than 0');
            }
        
            const { publicKey, privateKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
            });
            
            const expires = Tempo.addSecond(expiresIn).getTime(); // Convert to milliseconds;

            const kid = `key_${uid(8)}`;
            const keyData: KeyPair = {
                kid,
                publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
                privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
                createdAt: new Date(),
                expires,// in milliseconds
            } as KeyPair;

            return keyData;
        } catch (error) {
            throw new Error(`Invalid expiration time: ${error.message}`);
        }
    }
}
