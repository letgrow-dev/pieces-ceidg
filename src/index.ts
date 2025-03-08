import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getCompanies } from "./lib/actions";

// Documentation:
// https://pliki.biznes.gov.pl/akademia/Hurtownia_danych/HD%20CEIDG%20-%20API%20v2%20Hurtowni%20Danych%20-%20Dokumentacja%20dla%20integrator%C3%B3w%20v3.0.pdf

const TEST_API = "https://test-dane.biznes.gov.pl/api/ceidg/v2";
const PROD_API = "https://dane.biznes.gov.pl/api/ceidg/v2";

export const ceidgAuth = PieceAuth.CustomAuth({
  description: `API token provided by CEIDG. 

**Note**: For more details how to obtain API token refer to https://akademia.biznes.gov.pl/portal/004279`,
  required: true,
  props: {
    url: Property.ShortText({
      displayName: "API URL",
      required: true,
      defaultValue: PROD_API,
      description: `For test API use: ${TEST_API}`
    }),
    token: PieceAuth.SecretText({
      displayName: "CEIDG API token",
      required: true,
    })
  }
})

export const ceidg = createPiece({
  displayName: "CEIDG",
  description: 'CEIDG (Centralna Ewidencja i Informacja o Działalności Gospodarczej) API (Hurtowania danych)',
  auth: ceidgAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://iconape.com/wp-content/png_logo_vector/logo-ceidg.png",
  authors: ["Marcin Zawada"],
  actions: [
    getCompanies,
    createCustomApiCallAction({
      baseUrl: (auth: unknown) => {
        if (auth && typeof auth === 'object' && 'url' in auth && typeof auth?.url === 'string') {
            return auth.url;
        }

        throw new Error('Missing or invalid API URL');
      },
      auth: ceidgAuth,
      authMapping: async (auth: unknown) => {
        if (auth && typeof auth === 'object' && 'token' in auth && typeof auth?.token === 'string') {
          return {
            Authorization: `Bearer ${auth.token}`,
          }
        }

        throw new Error('Missing or invalid API token');
      },
    }),
  ],
  triggers: [],
});