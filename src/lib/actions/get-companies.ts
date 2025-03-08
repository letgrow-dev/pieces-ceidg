import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { HttpStatusCode } from 'axios';
import { ceidgAuth } from '../..';
import { nipSchema, regonSchema } from '../../validations';
import { z } from 'zod';
import { COMPANY_STATUS, WOJEWODZTWA } from '../../utils/consts';
import { lock, PropertyList } from '../../utils/helpers';

interface GetCompaniesResult {
  statusName: string;
  statusCode: HttpStatusCode | string;
  content: unknown;
  message?: string;
  elapsedTime: number;
}

export const getCompanies = createAction({
  name: 'getCompanies',
  auth: ceidgAuth,
  displayName: 'Get companies',
  description: 'Returns companies list',
  props: {
    nip: PropertyList('NIP'),
    regon: PropertyList('REGON'),
    nip_sc: PropertyList('NIP spółki cywilnej'),
    regon_sc: PropertyList('REGON spółki cywilnej'),
    imie: PropertyList('Imię przesiębiorcy'),
    nazwisko: PropertyList('Nazwisko przesiębiorcy'),
    nazwa: PropertyList('Nazwa firmy'),
    ulica: PropertyList('Adres firmy, ulica'),
    budynek: PropertyList('Adres firmy, budynek'),
    lokal: PropertyList('Adres firmy, lokal'),
    miasto: PropertyList('Adres firmy, miasto'),
    wojewodztwo: Property.StaticMultiSelectDropdown({
      displayName: "Adres firmy, województwo",
      required: false,
      options: {
        options: Object
          .entries(WOJEWODZTWA)
          .map(([label, value]) => ({ label, value }))
      }
    }),
    powiat: PropertyList('Adres firmy, powiat'),
    gmina: PropertyList('Adres firmy, gmina'),
    kod: PropertyList('Adres firmy, kod pocztowy'),
    pkd: PropertyList('Kod PKD'),
    page: Property.Number({
      displayName: 'Page',
      required: true,
      defaultValue: 1,
    }), 
    limit: Property.Number({
      displayName: 'Per page (limit)',
      required: true,
      defaultValue: 50,
    }),
    dataod: Property.DateTime({
      displayName: "Data od",
      required: false,
    }),
    datado: Property.DateTime({
      displayName: "Data do",
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: "Status",
      required: false,
      options: {
        options: Object
          .entries(COMPANY_STATUS)
          .map(([label, value]) => ({ label, value }))
      }
    })
  },
  async run(context): Promise<GetCompaniesResult> {
    const start = performance.now(),
      propsValue = context.propsValue,
      auth = context.auth,
      params = new URLSearchParams();

    await propsValidation.validateZod(propsValue, {
      nip: z.array(nipSchema),
      regon: z.array(regonSchema),
    });

    for (const key in propsValue) { 
      const value = (propsValue as Record<string, number | string | string[]>)[key];
      if (Array.isArray(value)) { 
        value.forEach((item) => params.append(key, item))
      } else {
        params.append(key, `${value}`)
      }
    }

    const queryString = params.toString();
    const url = `${auth.url}/firmy${queryString.length ? '?' + queryString : ''}`;

    await lock(context);

    const res = await fetch(url, {
      method: HttpMethod.GET,
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: 'application/json',
      },
    });

    const status = Object.entries(HttpStatusCode).find(
      (entry) => entry[1] === res.status
    );
    const [statusName, statusCode] = status || ['Unknown', 0];

    if (statusCode === HttpStatusCode.Ok) {
      if (res.headers.get('content-type')?.includes('application/json')) {
        return {
          content: await res.json(),
          elapsedTime: performance.now() - start,
          message: 'Ok',
          statusCode,
          statusName,
        };
      } else {
        const msg = [
          'Invalid content type',
          `Expected "application/json", got "${res.headers.get('content-type')}`,
          'Please ensure the API is functioning correctly and there is no ongoing maintenance',
          'You can check it here: https://dane.biznes.gov.pl',
        ];

        throw new Error(msg.join('. '));
      }
    } else if (statusCode === HttpStatusCode.NoContent) {
      return {
        content: null,
        elapsedTime: performance.now() - start,
        message: 'No matching companies found',
        statusCode,
        statusName,
      };
    }

    throw new Error(
      `Request failed with status: ${statusName} - ${statusCode}`
    );
  },
});
