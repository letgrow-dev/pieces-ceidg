import { ActionContext, Property } from "@activepieces/pieces-framework";
import { Lock } from "./lock";
import { HttpStatusCode } from "axios";
import { ApiResult } from "./interfaces";

export async function lock(context: ActionContext) {
  const lock = new Lock({
    key: 'CEIDG_API_LOCK',
    lockId: context.run.id,
    lockTtl: 3600,
    store: context.store,
  });

  return lock.acquireLock();
}

export function PropertyList(name: string) { 
  return Property.Array({
    displayName: name,
    required: false,
    defaultValue: [],
  });
}

export async function handleResponse(res: Response, startTime: number): Promise<ApiResult> { 
    const status = Object.entries(HttpStatusCode).find(([_, s]) => s === res.status);
    const [statusName, statusCode] = status || ['Unknown', 0];

    if (statusCode === HttpStatusCode.Ok) {
      if (res.headers.get('content-type')?.includes('application/json')) {
        return {
          content: await res.json(),
          elapsedTime: performance.now() - startTime,
          message: 'Ok',
          statusCode,
          statusName,
        };
      } else {

        const msg = [
          'Invalid content type',
          `Expected "application/json", got "${res.headers.get('content-type')}`,
        ];

        // Try to find information about maintenance in the response body or HTML content.
        const html: string = await res.text();
        const match = html.match(/<article([\s\S]*?)<\/article>/g);

        if (match) {
          const text = match[0]
            .replaceAll(/<[^>]*>/g, "")
            .trim()
            .replaceAll(/^\s*[\r\n]/gm, "");

          msg.push(text);
        } else {
          msg.push('Please ensure the API is functioning correctly and there is no ongoing maintenance');
          msg.push('You can check it here: https://dane.biznes.gov.pl');
        }

        throw new Error(msg.join('. '));
      }
    } else if (statusCode === HttpStatusCode.NoContent) {
      return {
        content: null,
        elapsedTime: performance.now() - startTime,
        message: 'No matching results found',
        statusCode,
        statusName,
      };
    }

    throw new Error(
      `Request failed with status: ${statusName} - ${statusCode}`
    );
}