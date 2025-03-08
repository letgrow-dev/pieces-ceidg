import { ActionContext, Property } from "@activepieces/pieces-framework";
import { Lock } from "./lock";

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