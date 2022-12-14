# Hasura

GraphQL APIs with Hasura

![Hasura GraphQL Engine architecture](https://raw.githubusercontent.com/hasura/graphql-engine/master/assets/hasura-arch.svg)

## hasura-cli

### Install

```shell
pnpm add -g hasura-cli
# (OR)
go install github.com/hasura/graphql-engine/cli/cmd/hasura@latest
```

### Usage

NOTE: You can pass `--endpoint <hasura-endpoint> --admin-secret <admin-secret> command-line args for all _Hasura CLI_ commands

```shell
# Create a directory to store migrations (with endpoint and admin secret configured):
# hasura init <my-project> --endpoint https://my-graphql-engine.com --admin-secret adminsecretkey
hasura init hasura --project infra --endpoint https://decent-donkey-83.hasura.app --admin-secret <my-admin-secret>
# move infra/hasura/config.yaml to project root and edit metadata_directory, migrations_directory, seeds_directory paths

hasura version

## open console
hasura console

# Create a new seed by exporting data from tables already present in the database:
hasura seed create tz_policies_seed --database-name postgresdb --from-table tz_policies
# Export data from multiple tables:
hasura seed create customer_order_seed --database-name postgresdb --from-table customer --from-table order
# Apply only a particular file:
hasura seed apply --file 1672767205525_customer_order_seed.sql --database-name postgresdb
hasura seed apply --file 1672767180588_tz_policies_seed.sql --database-name postgresdb

# To apply all the Migrations present in the `migrations/` directory and the Metadata present in the `metadata/` directory on a new, "fresh",
# instance of the Hasura Server at http://another-server-instance.hasura.app:
hasura deploy --endpoint http://another-server-instance.hasura.app  --admin-secret <admin-secret>
# NOTE:
# if you get error: "permission denied to create extension \"hstore\"", Run `create extension hstore;` in hasura console
# if you get error: "must be owner of extension hstore",  Run `alter role nhost_hasura with superuser;` in hasura console
# if you get error: "x509: certificate signed by unknown authority", add `--insecure-skip-tls-verify` flag to above command

#  Check the status of Migrations
hasura migrate status   --database-name postgresdb

# Export Hasura GraphQL Engine metadata from the database
hasura metadata export
# Show changes between server metadata and the exported metadata file:
hasura metadata diff
# Reload Hasura GraphQL Engine metadata on the database.
hasura metadata reload
# Apply Hasura Metadata
hasura metadata apply
```

## Local Hasura

### Start local Hasura

```shell
docker compose up hasura
# shutdown
docker compose down
# shutdown , reset volume
docker compose down -v
```

### Apply Migrations

To apply all the Migrations present in the `migrations/` directory and the Metadata present in the `metadata/` directory on a new, "fresh" database (i.e., docker compose down -v):

```shell
hasura deploy --endpoint http://localhost:8080  --admin-secret myadminsecretkey
hasura seed apply --file 1672767205525_customer_order_seed.sql --database-name postgresdb --endpoint http://localhost:8080  --admin-secret myadminsecretkey
hasura seed apply --file 1672767180588_tz_policies_seed.sql --database-name postgresdb --endpoint http://localhost:8080  --admin-secret myadminsecretkey
```

open <http://localhost:8080/console> and try out a query

Sample Query:

```gql
query MyQuery {
	customer {
		email
		first_name
		id
		ip_address
		last_name
		phone
		username
		orders {
			customer_id
			discount_price
			id
			order_date
			product
			purchase_price
			transaction_id
		}
	}
}
```

```gql
query MyQuery {
	countries(filter: { continent: { eq: "AS" } }) {
		code
		capital
		name
		continent {
			name
			code
		}
	}
}
```

```gql
query MyQuery {
	searchRestrooms(arg1: { city: "Riverside" }) {
		accessible
		approved
		changing_table
		city
		comment
		country
		created_at
		directions
		downvote
		edit_id
		id
		latitude
		longitude
		name
		state
		street
		unisex
		updated_at
		upvote
	}
}
```

```gql
query MyQuery {
	listUniversities(arg1: { name: "middle" }) {
		alpha_two_code
		country
		domains
		name
		stateprovince
		web_pages
	}
}
```

## Configuration

Using `claims_map` to map JWT token to hasura claims:

```json
{
	"type": "RS512",
	"key": "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdlatRjRjogo3WojgGHFHYLugd\nUWAY9iR3fy4arWNA1KoS8kVw33cJibXr8bvwUAUparCwlvdbH6dvEOfou0/gCFQs\nHUfQrSDv+MuSUMAe8jzKE4qW+jK+xQU9a03GUnKHkkle+Q0pX/g6jXZ7r1/xAK5D\no2kQ+X5xK9cipRgEKwIDAQAB\n-----END PUBLIC KEY-----\n",
	"claims_map": {
		"x-hasura-allowed-roles": { "path": "$.hasura.all_roles" },
		"x-hasura-default-role": { "path": "$.hasura.all_roles[0]", "default": "user" },
		"x-hasura-user-id": { "path": "$.user.id", "default": "ujdh739kd" }
	}
}
```

## Reference

- Sample metadata <https://github.com/hasura/template-gallery/tree/main/postgres>-
- Hasura and AuthJS [intigration](https://hasura.io/learn/graphql/hasura-authentication/integrations/nextjs-auth/)
