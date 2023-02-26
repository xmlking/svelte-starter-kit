const defaultMarshall = {
	unmarshal(val) {
		return val;
	},
	marshal(val) {
		return val;
	}
};

/** @type {import('houdini').ConfigFile} */
const config = {
	watchSchema: {
		url: (env) => `${env.HASURA_GRAPHQL_ENDPOINT}/v1/graphql`,
		interval: 0, //  only pull the schema when you first run `pnpm dev`
		headers: {
			'x-hasura-admin-secret': 'env:HASURA_GRAPHQL_ADMIN_SECRET'
		}
	},
	plugins: {
		// 'houdini-plugin-svelte-global-stores': {
		// 	generate: 'all'
		// },
		'houdini-svelte': {
			client: './src/lib/graphql/client'
		}
	},
	scalars: {
		DateTime: {
			// the corresponding typescript type
			type: 'Date',
			// turn the api's response into that type
			unmarshal(val) {
				return new Date(val);
			},
			// turn the value into something the API can use
			marshal(date) {
				return date.getTime();
			}
		},

		Decimal: {
			type: 'number',

			unmarshal(val) {
				return new Number(val);
			},

			marshal(number) {
				return number.toString();
			}
		},

		URL: {
			type: 'URL',

			unmarshal(val) {
				return new URL(val);
			},

			marshal(url) {
				return url.toString();
			}
		},

		uuid: {
			type: 'string',
			...defaultMarshall
		},
		_text: {
			type: 'string',
			...defaultMarshall
		},
		hstore: {
			type: 'string',
			...defaultMarshall
		},
		jsonb: {
			type: 'object',
			...defaultMarshall
		},
		timestamp: {
			type: 'string',
			...defaultMarshall
		},
		timestamptz: {
			type: 'string',
			...defaultMarshall
		}
	}
};

export default config;
