import { createAction, Property } from "@activepieces/pieces-framework";
import { ceidgAuth } from '../..';
import { handleResponse, lock } from "../../utils";
import { HttpMethod } from "@activepieces/pieces-common";

export const companyByUuid = createAction({
    name: 'companyByUuid',
    auth: ceidgAuth,
    displayName: 'Company by UUID',
    description: 'Get company data by UUID',
    props: {
        uuid: Property.ShortText({
            displayName: 'UUID',
            description: 'Company UUID',
            required: true,
        })
    },
    run: async (context) => { 
        const
            startTime = performance.now(),
            propsValue = context.propsValue,
            auth = context.auth;

        await lock(context);

        const res = await fetch(`${auth.url}/firma/${propsValue.uuid}`, {
            method: HttpMethod.GET,
            headers: {
                Authorization: `Bearer ${auth.token}`,
                Accept: 'application/json',
            },
        });

        return handleResponse(res, startTime);
    }
})