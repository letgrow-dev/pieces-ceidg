import { COMPANY_STATUS, WOJEWODZTWA, lock, PropertyList, ApiResult, handleResponse, mapPropsToQueryString  } from '../../utils/';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { ceidgAuth } from '../..';
import { createAction, Property, } from '@activepieces/pieces-framework';
import { nipSchema, regonSchema } from '../../validations';
import { z } from 'zod';

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
  async run(context): Promise<ApiResult> {
    const startTime = performance.now(),
      propsValue = context.propsValue,
      auth = context.auth;

    await propsValidation.validateZod(propsValue, {
      nip: z.array(nipSchema),
      regon: z.array(regonSchema),
      // TODO validate other properties
    });

    const queryString = mapPropsToQueryString(propsValue);
    const url = `${auth.url}/firmy${queryString.length ? '?' + queryString : ''}`;

    await lock(context);

    const res = await fetch(url, {
      method: HttpMethod.GET,
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: 'application/json',
      },
    });

    return handleResponse(res, startTime)
  },
});
