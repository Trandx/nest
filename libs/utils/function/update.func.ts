
import { merge, ObjectType } from "./merge.func";

export function update<T extends ObjectType>(data: T[], newData: T|T[]) {
    try {
        if (Array.isArray(newData) && newData.length === data.length) {
            return data.map((item, key) => {
                return merge(item, newData[key]);
            });
        }

        if (typeof newData === 'object' && newData !== null) {
            return data.map((item) => {
                return merge(item, newData as T);
            });
        }

        throw new Error('Invalid newData type or length mismatch');
    } catch (error) {
        throw new Error(`Update function error: ${(error as Error).message}`);
    }
}