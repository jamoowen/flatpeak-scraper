import fs from 'fs';
import { Result, err, ok } from './types';

export function readJsonFile<T>(filePath: string): Result<T, Error> {
	try {
		const data = fs.readFileSync(filePath, 'utf-8');
		const parsedData: T = JSON.parse(data);
		return ok(parsedData);
	} catch (error) {
		return err(new Error(`Failed to read or parse json file: ${error.message}`));
	}
}
