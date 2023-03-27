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
		url: (env) => env.PUBLIC_GRAPHQL_ENDPOINT,
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
		hstore: {
			type: 'string',
			unmarshal(val) {
				return Object.entries(val)
					.map(([k, v]) => `"${k}" => "${v}"`)
					.join(', ');
			},
			marshal(val) {
				return val;
			}
		},
		// hstore: {
		// 	type: 'Map',
		// 	unmarshal(val) {
		// 		console.log('in hstore unmarshal', val, typeof val);
		// 		return new Map(Object.entries(val));
		// 	},
		// 	marshal(val) {
		// 		console.log('in hstore marshal', val, typeof val);
		// return Object.entries(JSON.parse(val))
		// 	.map(([k, v]) => `"${k}" => "${v}"`)
		// 	.join(', ');
		// 	}
		// },
		uuid: {
			type: 'string',
			...defaultMarshall
		},
		_text: {
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
