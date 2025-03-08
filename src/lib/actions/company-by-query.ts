import { HttpMethod, propsValidation } from "@activepieces/pieces-common";
import { ceidgAuth } from '../..';
import { createAction, Property } from "@activepieces/pieces-framework";
import { handleResponse, lock, mapPropsToQueryString, PropertyList } from "../../utils";
import { nipSchema, regonSchema } from '../../validations';

export const companyByQuery = createAction({
    name: 'companyByQuery',
    auth: ceidgAuth,
    displayName: 'Company by NIP, REGON or ids',
    description: 'Get company data by query parameters',
    props: {
        nip: Property.ShortText({
            displayName: 'NIP',
            required: false,
        }),
        regon: Property.ShortText({
            displayName: 'REGON',
            required: false,
        }),
        ids: PropertyList('Identyfikator wpisu'),
    },
    run: async (context) => { 
        const startTime = performance.now(),
            propsValue = context.propsValue,
            auth = context.auth;

        await propsValidation.validateZod(propsValue, {
            nip: nipSchema.optional(),
            regon: regonSchema.optional(),
        });

        const queryString = mapPropsToQueryString(propsValue);

        await lock(context);

        const res = await fetch(`${auth.url}/firma?${queryString}`, {
            method: HttpMethod.GET,
            headers: {
                Authorization: `Bearer ${auth.token}`,
                Accept: 'application/json',
            },
        });

        return handleResponse(res, startTime);
    }
})